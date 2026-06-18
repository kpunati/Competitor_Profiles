// GET /api/search?q=<terms>&k=8
// Keyword (BM25) search over KB sections. Returns compact, ranked hits with a
// snippet + anchor + sectionPath so an agent can locate-then-fetch the minimal
// unit. The MiniSearch index is built at deploy time (scripts/build-kb.ts) and
// re-hydrated here once per cold start (cached across warm invocations).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import MiniSearch from 'minisearch';
import { SEARCH_OPTIONS } from '../lib/kbConfig';

let index: MiniSearch | null = null;

function loadIndex(): MiniSearch {
  if (index) return index;
  // generated/ is shipped with the function via vercel.json includeFiles.
  const candidates = [
    path.join(process.cwd(), 'generated', 'search-index.json'),
    path.join(process.cwd(), 'web', 'generated', 'search-index.json'),
    path.join(__dirname, '..', 'generated', 'search-index.json'),
  ];
  for (const p of candidates) {
    try {
      const json = readFileSync(p, 'utf8');
      index = MiniSearch.loadJSON(json, SEARCH_OPTIONS as any);
      return index;
    } catch {
      /* try next */
    }
  }
  throw new Error('search index not found in any candidate path');
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const q = (Array.isArray(req.query.q) ? req.query.q[0] : req.query.q ?? '').trim();
  const kRaw = Array.isArray(req.query.k) ? req.query.k[0] : req.query.k;
  const k = Math.min(Math.max(parseInt(String(kRaw ?? '8'), 10) || 8, 1), 25);

  if (!q) {
    res.status(400).json({ error: 'missing query param `q`' });
    return;
  }

  let results: any[];
  try {
    results = loadIndex().search(q);
  } catch (err: any) {
    res.status(500).json({ error: 'search unavailable', detail: String(err?.message ?? err) });
    return;
  }

  const hits = results.slice(0, k).map((r) => ({
    score: Math.round(r.score * 100) / 100,
    firm: r.firm,
    firmName: r.firmName,
    doc: r.doc,
    heading: r.heading,
    anchor: r.anchor,
    sectionPath: r.sectionPath,
    rawPath: r.rawPath,
    snippet: r.snippet,
    words: r.words,
    ...(r.caveat ? { caveat: r.caveat } : {}),
  }));

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  res.status(200).json({ query: q, count: hits.length, hits });
}
