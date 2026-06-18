// GET /api/firms?type=&threat=&jurisdiction=&has_corpus=&q=
// Structured filter over the slim catalog. Cheaper than pulling all of
// /digest.json when an agent only needs a slice (e.g. "high-threat US firms
// with a blog corpus"). All params optional; AND-combined.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import type { DigestRow } from '../lib/kbConfig';

let digest: DigestRow[] | null = null;

function loadDigest(): DigestRow[] {
  if (digest) return digest;
  const candidates = [
    path.join(process.cwd(), 'generated', 'digest.json'),
    path.join(process.cwd(), 'web', 'generated', 'digest.json'),
    path.join(__dirname, '..', 'generated', 'digest.json'),
  ];
  for (const p of candidates) {
    try {
      digest = JSON.parse(readFileSync(p, 'utf8')) as DigestRow[];
      return digest;
    } catch {
      /* try next */
    }
  }
  throw new Error('digest not found in any candidate path');
}

function param(req: VercelRequest, name: string): string | undefined {
  const v = req.query[name];
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  return s ? s.toLowerCase() : undefined;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  let rows: DigestRow[];
  try {
    rows = loadDigest();
  } catch (err: any) {
    res.status(500).json({ error: 'catalog unavailable', detail: String(err?.message ?? err) });
    return;
  }

  const type = param(req, 'type');
  const threat = param(req, 'threat');
  const jurisdiction = param(req, 'jurisdiction');
  const hasCorpus = param(req, 'has_corpus');
  const q = param(req, 'q');

  const filtered = rows.filter((r) => {
    if (type && (r.type ?? '').toLowerCase() !== type) return false;
    if (threat && (r.threat ?? '').toLowerCase() !== threat) return false;
    if (jurisdiction && (r.jurisdiction ?? '').toLowerCase() !== jurisdiction) return false;
    if (hasCorpus !== undefined) {
      const want = hasCorpus === 'true' || hasCorpus === '1' || hasCorpus === 'yes';
      if (r.hasCorpus !== want) return false;
    }
    if (q) {
      const hay = `${r.name} ${r.slug} ${r.summary_line}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  res.status(200).json({ count: filtered.length, firms: filtered });
}
