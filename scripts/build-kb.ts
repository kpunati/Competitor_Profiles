/*
 * build-kb.ts — generates the agent-facing knowledge base from the existing
 * repo content. Run at Vercel build time (and locally). READ-ONLY with respect
 * to the source catalog: it only reads Competitors/, 00_Market_Overview/ and
 * _context/, and writes everything under web/public/ and web/generated/.
 *
 * Outputs:
 *   public/digest.json      slim one-row-per-firm catalog (read once, route from it)
 *   public/index.json       section map: every addressable section across the KB
 *   public/llms.txt         agent onboarding manifest (base URL, query patterns, schemas)
 *   public/brief.md         strategy synthesis + thesis, inlined for link-averse fetchers
 *   public/robots.txt       noindex (public-but-unlisted posture)
 *   public/sections/...     one markdown file per section (smallest fetch unit)
 *   public/raw/...          verbatim source files at stable URLs
 *   generated/search-index.json   serialized MiniSearch index (consumed by api/search.ts)
 *   generated/digest.json         copy of digest for api/firms.ts
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import MiniSearch from 'minisearch';
import {
  SEARCH_OPTIONS,
  CAVEATS,
  type SectionMeta,
  type DigestRow,
} from '../lib/kbConfig';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(REPO_ROOT, 'public');
const GENERATED = path.join(REPO_ROOT, 'generated');

const COMPETITORS = path.join(REPO_ROOT, 'Competitors');
const MARKET = path.join(REPO_ROOT, '00_Market_Overview');
const CONTEXT = path.join(REPO_ROOT, '_context');

// Canonical base URL for the agent-facing manifests. Agent fetchers frequently
// won't resolve or follow relative links discovered in page content, so every
// URL we emit in llms.txt / index.json / index.html must be ABSOLUTE.
// Priority: explicit KB_BASE_URL > Vercel production domain > '' (relative fallback).
const BASE_URL = (
  process.env.KB_BASE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : '')
).replace(/\/+$/, '');

// Turn a root-relative path ("/sections/...") into an absolute URL when a base
// URL is configured; otherwise leave it relative (local dev / unconfigured build).
function abs(p: string): string {
  if (!BASE_URL) return p;
  return p.startsWith('/') ? `${BASE_URL}${p}` : `${BASE_URL}/${p}`;
}

// ---------- helpers ----------

const usedAnchors = new Map<string, number>();
function slugify(text: string, scope: string): string {
  const base =
    text
      .toLowerCase()
      .replace(/[`*_~>#]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'section';
  const key = `${scope}::${base}`;
  const n = usedAnchors.get(key) ?? 0;
  usedAnchors.set(key, n + 1);
  return n === 0 ? base : `${base}-${n + 1}`;
}

function plainSnippet(body: string, max = 240): string {
  const text = body
    .replace(/^#+\s+.*$/gm, '') // drop heading lines
    .replace(/^>\s?/gm, '') // blockquote markers
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images -> drop entirely
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> text
    .replace(/\]\([^)]*\)/g, '') // orphaned link tails
    .replace(/[*_`#>|\[\]]/g, '') // inline markdown + stray brackets
    .replace(/\s+/g, ' ')
    .replace(/^[\s)\-–—:]+/, '') // strip leading punctuation residue
    .trim();
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

type Section = {
  meta: SectionMeta;
  body: string; // full chunk text (heading + content) written to disk
  searchBody: string; // plain text for indexing
  tags: string[];
};

// Split a markdown body into addressable sections at heading levels 1 and 2.
// H3+ stay nested inside their parent H2 section, keeping chunks self-contained.
function splitSections(opts: {
  raw: string;
  firm: string;
  firmName: string;
  doc: string;
  rawPath: string;
  fallbackTitle: string;
  tags: string[];
}): Section[] {
  const { raw, firm, firmName, doc, rawPath, fallbackTitle, tags } = opts;
  const lines = raw.split('\n');
  const scope = `${firm}/${doc}`;
  const sections: Section[] = [];

  let curHeading = fallbackTitle;
  let curLevel = 1;
  let buf: string[] = [];

  const flush = () => {
    const chunk = buf.join('\n').trim();
    buf = [];
    // skip empty leading sections
    if (!chunk && sections.length === 0 && curHeading === fallbackTitle) return;
    const heading = curHeading || fallbackTitle;
    const anchor = slugify(heading, scope);
    const fullText = chunk;
    const searchBody = plainSnippet(fullText, 100000);
    const words = searchBody ? searchBody.split(/\s+/).length : 0;
    sections.push({
      meta: {
        id: `${firm}::${doc}::${anchor}`,
        firm,
        firmName,
        doc,
        heading,
        level: curLevel,
        anchor,
        path: `/sections/${firm}/${doc}/${anchor}.md`,
        rawPath,
        words,
        caveat: CAVEATS[firm],
      },
      body: fullText,
      searchBody,
      tags,
    });
  };

  for (const line of lines) {
    const m = /^(#{1,2})\s+(.*)$/.exec(line);
    if (m) {
      flush();
      curLevel = m[1].length;
      curHeading = m[2].replace(/\s+#*$/, '').trim();
      buf.push(line);
    } else {
      buf.push(line);
    }
  }
  flush();
  return sections.filter((s) => s.body.trim().length > 0);
}

async function readJson<T>(p: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8')) as T;
  } catch {
    return null;
  }
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function writeFile(p: string, content: string) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, content);
}

async function copyRaw(absSrc: string, repoRelPath: string) {
  const dest = path.join(PUBLIC, 'raw', repoRelPath);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(absSrc, dest);
}

// ---------- main ----------

type CatalogEntry = {
  competitor: string;
  slug: string;
  summary_line: string;
  website: string | null;
  competitor_type: string | null;
  threat_level: string | null;
  aum_usd: number | null;
  regulatory_jurisdiction: string | null;
};

async function processMarkdownFile(args: {
  absPath: string;
  repoRelPath: string;
  firm: string;
  firmName: string;
  doc: string;
  extraTags?: string[];
}): Promise<Section[]> {
  const { absPath, repoRelPath, firm, firmName, doc, extraTags = [] } = args;
  const raw = await fs.readFile(absPath, 'utf8');
  const parsed = matter(raw);
  const fmTags = Array.isArray((parsed.data as any).tags)
    ? ((parsed.data as any).tags as string[])
    : [];
  const fallbackTitle =
    (parsed.data as any).title ||
    (parsed.data as any).competitor ||
    doc.replace(/_/g, ' ');
  await copyRaw(absPath, repoRelPath);
  const sections = splitSections({
    raw: parsed.content,
    firm,
    firmName,
    doc,
    rawPath: `/raw/${repoRelPath}`,
    fallbackTitle: String(fallbackTitle),
    tags: [...fmTags, ...extraTags],
  });
  // write each section to disk
  for (const s of sections) {
    await writeFile(path.join(PUBLIC, s.meta.path.replace(/^\//, '')), s.body + '\n');
  }
  return sections;
}

async function main() {
  // clean output dirs
  await fs.rm(PUBLIC, { recursive: true, force: true });
  await fs.rm(GENERATED, { recursive: true, force: true });
  await fs.mkdir(PUBLIC, { recursive: true });
  await fs.mkdir(GENERATED, { recursive: true });

  const catalog =
    (await readJson<CatalogEntry[]>(path.join(MARKET, 'competitor_catalog.json'))) ?? [];

  const allSections: Section[] = [];
  const digest: DigestRow[] = [];

  // ----- competitor firms -----
  for (const entry of catalog) {
    const firm = entry.slug;
    const firmDir = path.join(COMPETITORS, firm);
    if (!(await exists(firmDir))) continue;
    const firmName = entry.competitor;
    let firmSections = 0;

    // metadata.json (raw only)
    const metaPath = path.join(firmDir, 'metadata.json');
    if (await exists(metaPath)) await copyRaw(metaPath, `Competitors/${firm}/metadata.json`);

    // 1_Summary.md and 2_Full_Profile.md
    for (const doc of ['1_Summary', '2_Full_Profile']) {
      const abs = path.join(firmDir, `${doc}.md`);
      if (!(await exists(abs))) continue;
      const secs = await processMarkdownFile({
        absPath: abs,
        repoRelPath: `Competitors/${firm}/${doc}.md`,
        firm,
        firmName,
        doc,
      });
      allSections.push(...secs);
      firmSections += secs.length;
    }

    // knowledge corpus
    const kIndexPath = path.join(firmDir, 'Knowledge_From_Source', '_index.json');
    let hasCorpus = false;
    let postCount = 0;
    if (await exists(kIndexPath)) {
      hasCorpus = true;
      await copyRaw(kIndexPath, `Competitors/${firm}/Knowledge_From_Source/_index.json`);
      const idx = await readJson<{ posts?: { file: string }[] }>(kIndexPath);
      const posts = idx?.posts ?? [];
      postCount = posts.length;
      for (const post of posts) {
        const abs = path.join(firmDir, 'Knowledge_From_Source', post.file);
        if (!(await exists(abs))) continue;
        const base = post.file.replace(/\.md$/, '');
        const secs = await processMarkdownFile({
          absPath: abs,
          repoRelPath: `Competitors/${firm}/Knowledge_From_Source/${post.file}`,
          firm,
          firmName,
          doc: `knowledge/${base}`,
          extraTags: ['blog', 'corpus'],
        });
        allSections.push(...secs);
        firmSections += secs.length;
      }
    }

    digest.push({
      slug: firm,
      name: firmName,
      summary_line: entry.summary_line,
      type: entry.competitor_type,
      threat: entry.threat_level,
      aum: entry.aum_usd,
      jurisdiction: entry.regulatory_jurisdiction,
      website: entry.website,
      hasCorpus,
      postCount,
      sections: firmSections,
      caveat: CAVEATS[firm],
    });
  }

  // ----- market overview docs -----
  if (await exists(MARKET)) {
    for (const file of await fs.readdir(MARKET)) {
      if (!file.endsWith('.md')) continue;
      const doc = file.replace(/\.md$/, '');
      const secs = await processMarkdownFile({
        absPath: path.join(MARKET, file),
        repoRelPath: `00_Market_Overview/${file}`,
        firm: '_market_overview',
        firmName: 'Market Overview',
        doc,
        extraTags: ['market', 'overview'],
      });
      allSections.push(...secs);
    }
  }

  // ----- _context docs (brand voice, thesis, taxonomy) -----
  if (await exists(CONTEXT)) {
    for (const file of await fs.readdir(CONTEXT)) {
      if (!file.endsWith('.md')) continue;
      const doc = file.replace(/\.md$/, '');
      const secs = await processMarkdownFile({
        absPath: path.join(CONTEXT, file),
        repoRelPath: `_context/${file}`,
        firm: '_context',
        firmName: 'USWM Context',
        doc,
        extraTags: ['context', 'uswm'],
      });
      allSections.push(...secs);
    }
  }

  // ----- build search index -----
  const mini = new MiniSearch(SEARCH_OPTIONS as any);
  mini.addAll(
    allSections.map((s) => ({
      id: s.meta.id,
      firm: s.meta.firm,
      firmName: s.meta.firmName,
      doc: s.meta.doc,
      heading: s.meta.heading,
      anchor: s.meta.anchor,
      sectionPath: s.meta.path,
      rawPath: s.meta.rawPath,
      tags: s.tags.join(' '),
      body: s.searchBody,
      snippet: plainSnippet(s.body),
      caveat: s.meta.caveat ?? null,
      words: s.meta.words,
    }))
  );

  // ----- write artifacts -----
  // index.json carries ABSOLUTE section/raw URLs so an agent can fetch a located
  // section directly. The on-disk section files were already written from the
  // relative meta.path above; only the emitted manifest is rewritten to absolute.
  const sectionMap: SectionMeta[] = allSections.map((s) => ({
    ...s.meta,
    path: abs(s.meta.path),
    rawPath: abs(s.meta.rawPath),
  }));

  await writeFile(path.join(PUBLIC, 'digest.json'), JSON.stringify(digest));
  await writeFile(path.join(PUBLIC, 'index.json'), JSON.stringify(sectionMap));
  await writeFile(path.join(GENERATED, 'digest.json'), JSON.stringify(digest));
  await writeFile(path.join(GENERATED, 'search-index.json'), JSON.stringify(mini));
  await writeFile(path.join(PUBLIC, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  await writeFile(path.join(PUBLIC, 'llms.txt'), buildLlmsTxt(digest, allSections.length));
  await writeFile(path.join(PUBLIC, 'brief.md'), await buildBrief());
  await writeFile(path.join(PUBLIC, 'index.html'), buildIndexHtml(digest, allSections.length));

  console.log(
    `KB built: ${digest.length} firms · ${allSections.length} sections · ` +
      `${sectionMap.length} section files · index written.`
  );
}

function buildLlmsTxt(digest: DigestRow[], sectionCount: number): string {
  const firmsWithCorpus = digest.filter((d) => d.hasCorpus).length;
  const baseNote = BASE_URL
    ? BASE_URL
    : '(relative paths — set KB_BASE_URL or deploy on Vercel to emit absolute URLs)';
  return `# USWM Competitor Knowledge Base — agent manifest

This site serves competitor research for United Success Wealth Management (USWM)
in a token-efficient, agent-first shape. ${digest.length} firms · ${sectionCount} addressable
sections · ${firmsWithCorpus} firms with a blog/article corpus.

Base URL: ${baseNote}
Every path below is an absolute URL so it can be fetched directly. Agent fetchers
often refuse to resolve or follow relative links found inside page content.

## Can't follow links? Read ONE file.
If your tools only fetch URLs handed to you directly (not links discovered inside
a page), fetch this single inlined file — it contains the strategy synthesis and
USWM positioning thesis, enough to answer gaps / openings / positioning questions:
  ${abs('/brief.md')}

## Recommended query flow (minimize tokens) — fully static, no API needed
1. GET ${abs('/digest.json')}
   read ONCE: slim row per firm (slug, summary_line, type, threat, aum,
   jurisdiction, hasCorpus, postCount, sections, caveat). Many questions
   resolve from this alone.
2. GET ${abs('/index.json')}
   locate: full section map ({firm,doc,heading,anchor,path,words,caveat}). Each
   row's path and rawPath are absolute URLs. Filter locally by firm, doc, or
   heading to find the one section you need — no search service required.
3. GET <the path from step 2>
   fetch ONLY that section's markdown (smallest unit).

## Endpoints (all static files, absolute URLs)
- ${abs('/digest.json')}
    slim catalog, ~one read covers "what exists".
- ${abs('/index.json')}
    full section map; each row's path and rawPath are absolute.
- ${abs('/brief.md')}
    strategy synthesis + positioning thesis, inlined in one file.
- ${abs('/sections/<firm>/<doc>/<anchor>.md')}
    one section, self-contained.
- ${abs('/raw/<repo-path>')}
    verbatim source files (e.g. ${abs('/raw/Competitors/<Firm>/2_Full_Profile.md')}).

## Conventions
- doc values: "1_Summary", "2_Full_Profile", "knowledge/<basename>" (blog posts),
  or a market-overview / _context document name.
- Special firms: "_market_overview" (cross-cutting docs), "_context" (USWM brand
  voice, thesis, taxonomy — read before drafting USWM-voiced content).
- 'caveat' on a row/hit flags a known data-quality issue for that firm — heed it.
- Numbers (AUM etc.) come from the catalog; do not invent values not present here.
`;
}

// A single inlined bundle of the strategy synthesis + positioning thesis. An
// agent whose fetcher won't follow in-page links can read this ONE file and
// still answer gaps / openings / positioning questions. Scoped to the synthesis
// layer on purpose — inlining all 48 profiles would be megabytes.
async function buildBrief(): Promise<string> {
  const docs = [
    { title: 'Executive Briefing', dir: MARKET, file: 'Executive_Briefing.md', rel: '00_Market_Overview/Executive_Briefing.md' },
    { title: 'Where We Should Play', dir: MARKET, file: 'Where_We_Should_Play.md', rel: '00_Market_Overview/Where_We_Should_Play.md' },
    { title: 'What The Market Looks Like', dir: MARKET, file: 'What_The_Market_Looks_Like.md', rel: '00_Market_Overview/What_The_Market_Looks_Like.md' },
    { title: 'Competitive Landscape', dir: MARKET, file: 'Competitive_Landscape.md', rel: '00_Market_Overview/Competitive_Landscape.md' },
    { title: 'Our Thesis', dir: CONTEXT, file: 'our_thesis.md', rel: '_context/our_thesis.md' },
  ];
  const present: typeof docs = [];
  for (const d of docs) if (await exists(path.join(d.dir, d.file))) present.push(d);

  const out: string[] = [
    '# USWM Strategy Brief — inlined bundle',
    '',
    "This file inlines the catalog's strategy synthesis and USWM positioning thesis " +
      'so an agent that cannot follow in-page links can read everything in one fetch. ' +
      'Each section notes its verbatim source file.',
    '',
    '## Contents',
    present.map((d) => `- ${d.title}`).join('\n'),
    '',
  ];
  for (const d of present) {
    const raw = await fs.readFile(path.join(d.dir, d.file), 'utf8');
    const { content } = matter(raw);
    out.push('---', '', `> Source: ${abs('/raw/' + d.rel)}`, '', content.trim(), '');
  }
  return out.join('\n') + '\n';
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Root landing page. The thing a person pastes into Claude. It is BOTH the
// human view and the agent entry point: the full digest is inlined so a single
// fetch answers "what's in here?", and the query flow + drill-in URLs are
// documented with relative links Claude can follow.
function buildIndexHtml(digest: DigestRow[], sectionCount: number): string {
  const threatRank: Record<string, number> = {
    high: 0,
    'medium-high': 1,
    medium: 2,
    'medium-low': 3,
    low: 4,
  };
  const rows = [...digest].sort(
    (a, b) =>
      (threatRank[a.threat ?? ''] ?? 9) - (threatRank[b.threat ?? ''] ?? 9) ||
      a.name.localeCompare(b.name)
  );
  const firmsWithCorpus = digest.filter((d) => d.hasCorpus).length;
  const fmtAum = (n: number | null) =>
    n == null ? '—' : '$' + (n / 1e9).toFixed(2) + 'B';

  const cards = rows
    .map((d) => {
      const tags = [d.type, d.jurisdiction, d.hasCorpus ? `${d.postCount} posts` : null]
        .filter(Boolean)
        .map((t) => `<span class="tag">${esc(String(t))}</span>`)
        .join('');
      const caveat = d.caveat
        ? `<p class="caveat">⚠ ${esc(d.caveat)}</p>`
        : '';
      const corpus = d.hasCorpus
        ? ` · <a href="${abs(`/raw/Competitors/${d.slug}/Knowledge_From_Source/_index.json`)}">blog corpus</a>`
        : '';
      return `<article id="${d.slug}">
  <h3>${esc(d.name)} <span class="threat t-${esc((d.threat ?? '').replace(/[^a-z-]/g, ''))}">${esc(d.threat ?? '?')}</span></h3>
  <div class="tags">${tags}<span class="tag aum">${fmtAum(d.aum)} AUM</span></div>
  <p>${esc(d.summary_line)}</p>
  ${caveat}
  <p class="links"><a href="${abs(`/raw/Competitors/${d.slug}/1_Summary.md`)}">summary.md</a> ·
     <a href="${abs(`/raw/Competitors/${d.slug}/2_Full_Profile.md`)}">full profile.md</a> ·
     <a href="${abs(`/raw/Competitors/${d.slug}/metadata.json`)}">metadata.json</a>${corpus}</p>
</article>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>USWM Competitor Knowledge Base</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 16px/1.55 -apple-system, system-ui, sans-serif; max-width: 860px; margin: 0 auto; padding: 1.5rem; }
  h1 { margin-bottom: .2rem; }
  .sub { color: #888; margin-top: 0; }
  .agent-banner { background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1)); border: 2px solid #3b82f6; border-radius: 8px; padding: 1.2rem 1.3rem; margin-bottom: 1.5rem; }
  @media (prefers-color-scheme: dark) { .agent-banner { background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.15)); border-color: #6366f1; } }
  .agent-banner strong { color: #3b82f6; }
  @media (prefers-color-scheme: dark) { .agent-banner strong { color: #a5b4fc; } }
  .agent-banner code { background: rgba(59, 130, 246, 0.2); }
  @media (prefers-color-scheme: dark) { .agent-banner code { background: rgba(99, 102, 241, 0.3); } }
  .agent-banner a { color: #3b82f6; font-weight: 600; text-decoration: none; }
  @media (prefers-color-scheme: dark) { .agent-banner a { color: #a5b4fc; } }
  .note { background: #f4f4f6; border: 1px solid #ddd; border-radius: 8px; padding: 1rem 1.1rem; }
  @media (prefers-color-scheme: dark) { .note { background: #1a1a1d; border-color: #333; } }
  code { background: rgba(127,127,127,.18); padding: .1rem .35rem; border-radius: 4px; }
  article { border-top: 1px solid #ddd; padding: .9rem 0; }
  @media (prefers-color-scheme: dark) { article { border-color: #333; } }
  article h3 { margin: 0 0 .35rem; font-size: 1.05rem; }
  .tags { margin-bottom: .4rem; }
  .tag { font-size: .72rem; background: rgba(127,127,127,.15); border-radius: 20px; padding: .12rem .55rem; margin-right: .3rem; }
  .tag.aum { font-variant-numeric: tabular-nums; }
  .threat { font-size: .68rem; font-weight: 600; padding: .1rem .45rem; border-radius: 4px; vertical-align: middle; }
  .t-high { background: #fde2e1; color: #b42318; } .t-mediumhigh { background: #fdecd2; color: #b54708; }
  .t-medium { background: #fef7c3; color: #854a0e; } .t-low, .t-mediumlow { background: #dcfae6; color: #067647; }
  .links a, article p a { font-size: .85rem; }
  .caveat { font-size: .85rem; color: #b54708; }
  .links { color: #888; }
</style>
</head>
<body>
<h1>USWM Competitor Knowledge Base</h1>
<p class="sub">${digest.length} firms · ${sectionCount} addressable sections · ${firmsWithCorpus} with a blog corpus</p>

<div class="agent-banner">
<strong>🤖 AI agents:</strong> start with <a href="${abs('/llms.txt')}"><code>${abs('/llms.txt')}</code></a> (machine manifest — static file map + conventions), then <code>${abs('/digest.json')}</code> to see what's here. Can't follow links? Fetch <a href="${abs('/brief.md')}"><code>${abs('/brief.md')}</code></a> — the strategy brief inlined in one file.
</div>

<div class="note">
<strong>If you're an AI assistant reading this page:</strong> this is competitor
research for United Success Wealth Management (USWM). The full firm list with
one-line summaries is below — enough to answer "what's here" directly. To go
deeper, fetch (relative to this URL):
<ul>
  <li><code>${abs('/llms.txt')}</code> — the full machine manifest (static file map + conventions).</li>
  <li><code>${abs('/digest.json')}</code> — machine-readable version of the list below.</li>
  <li><code>${abs('/index.json')}</code> — full section map; filter locally to locate the
      one section you need, then fetch its absolute <code>path</code>.</li>
  <li><code>${abs('/brief.md')}</code> — strategy synthesis + thesis inlined in one file
      (use this if your fetcher won't follow links).</li>
  <li><code>${abs('/raw/Competitors/')}&lt;Firm&gt;/2_Full_Profile.md</code> — a full source file.</li>
</ul>
Heed any <code>caveat</code> field — it flags a known data-quality issue. Do not
invent figures (AUM, headcounts) not present here.
</div>

<h2>Firms</h2>
${cards}
</body>
</html>
`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
