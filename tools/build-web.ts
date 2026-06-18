/**
 * build-web.ts — generate a static, agent-first website from the catalog.
 *
 * Output: ./web/  (a pure static directory, deployable on Vercel)
 *   web/<mirrored content tree>   raw .md / .json / .csv at stable URLs
 *   web/llms.txt                  agent index: every doc + one-line description + URL
 *   web/manifest.json             machine-readable file tree (drives the viewer)
 *   web/index.html                minimal human browser (tree + search + render)
 *   web/robots.txt                crawl policy (flip ALLOW_INDEXING to change)
 *
 * Agents: fetch /llms.txt, pick relevant paths, fetch the raw files.
 * Humans: open / and click around.
 *
 * Run:  npx tsx tools/build-web.ts   (or: npm run build:web)
 * Vercel builds this automatically — see vercel.json at the repo root.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "web");

// Flip to true if you ever want search engines to index the public site.
const ALLOW_INDEXING = false;

const SITE_TITLE = "United Success Wealth Management — Competitor Catalog";
const SITE_BLURB =
  "Competitor research catalog for USWM: structured profiles, market-overview analysis, " +
  "and (for content-led firms) captured blog/article corpora across the wealth-management landscape.";

// ---- include / exclude rules -------------------------------------------------

const CONTENT_EXTS = new Set([".md", ".json", ".csv"]);

// Directory names skipped anywhere in the tree.
const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "web",
  "tools",
  "Screenshots",
  "adv_cache",
]);

// Exact root-relative files to skip.
const SKIP_FILES = new Set([
  "package.json",
  "package-lock.json",
  "tsconfig.json",
]);

// Skip noisy raw dumps by basename.
const SKIP_BASENAMES = new Set(["adv_raw.json"]);

// ---- helpers -----------------------------------------------------------------

type FileEntry = { rel: string; ext: string; title: string; size: number };

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(ROOT, full);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      await walk(full, acc);
    } else {
      const ext = path.extname(e.name).toLowerCase();
      if (!CONTENT_EXTS.has(ext)) continue;
      if (SKIP_FILES.has(rel)) continue;
      if (SKIP_BASENAMES.has(e.name)) continue;
      acc.push(rel);
    }
  }
  return acc;
}

function prettifyName(rel: string): string {
  const base = path.basename(rel).replace(/\.(md|json|csv)$/i, "");
  return base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

async function titleFor(rel: string, ext: string): Promise<string> {
  if (ext === ".md") {
    try {
      const text = await fs.readFile(path.join(ROOT, rel), "utf8");
      const m = text.match(/^#\s+(.+)$/m);
      if (m) return m[1].trim();
    } catch {
      /* ignore */
    }
  }
  return prettifyName(rel);
}

function fmtUsd(n: unknown): string | null {
  if (typeof n !== "number" || !isFinite(n) || n <= 0) return null;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${Math.round(n / 1e6)}M`;
  return `$${n.toLocaleString()}`;
}

const urlFor = (rel: string) => "/" + rel.split(path.sep).join("/");

async function copyFile(rel: string) {
  const dest = path.join(OUT, rel);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(path.join(ROOT, rel), dest);
}

async function readJsonSafe<T = any>(rel: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(ROOT, rel), "utf8")) as T;
  } catch {
    return null;
  }
}

// ---- llms.txt ----------------------------------------------------------------

async function buildLlmsTxt(): Promise<string> {
  const L: string[] = [];
  L.push(`# ${SITE_TITLE}`);
  L.push("");
  L.push(`> ${SITE_BLURB}`);
  L.push("");
  L.push(
    "All paths below are fetchable directly as raw Markdown/JSON. " +
      "Pick what you need from this index, then fetch those files. " +
      "Machine-readable file tree: /manifest.json"
  );
  L.push("");

  // Start here
  L.push("## Start here");
  for (const f of ["README.md", "ONBOARDING.md", "CLAUDE.md"]) {
    try {
      await fs.access(path.join(ROOT, f));
      L.push(`- [${prettifyName(f)}](${urlFor(f)})`);
    } catch {
      /* skip */
    }
  }
  L.push("");

  // Market overview
  const moDir = "00_Market_Overview";
  const moFiles = (await walk(path.join(ROOT, moDir)))
    .filter((r) => r.endsWith(".md"))
    .sort();
  if (moFiles.length) {
    L.push("## Market overview");
    for (const r of moFiles) L.push(`- [${await titleFor(r, ".md")}](${urlFor(r)})`);
    L.push(
      "- Structured fields, all firms: [competitor_catalog.json](/00_Market_Overview/competitor_catalog.json) · [competitor_catalog.csv](/00_Market_Overview/competitor_catalog.csv)"
    );
    L.push("- All captured pages by kind: [pages_by_kind.json](/00_Market_Overview/pages_by_kind.json)");
    L.push("");
  }

  // Context
  const ctxFiles = (await walk(path.join(ROOT, "_context")))
    .filter((r) => r.endsWith(".md"))
    .sort();
  if (ctxFiles.length) {
    L.push("## Context (brand voice, thesis, taxonomy)");
    for (const r of ctxFiles) L.push(`- [${await titleFor(r, ".md")}](${urlFor(r)})`);
    L.push("");
  }

  // Competitors
  const catalog = (await readJsonSafe<any[]>("00_Market_Overview/competitor_catalog.json")) ?? [];
  const bySlug = new Map<string, any>();
  for (const c of catalog) if (c?.slug) bySlug.set(c.slug, c);

  const compRoot = path.join(ROOT, "Competitors");
  const slugs = (await fs.readdir(compRoot, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name)
    .sort();

  L.push("## Competitors");
  L.push("");
  for (const slug of slugs) {
    const meta = bySlug.get(slug);
    const name = meta?.competitor ?? slug.replace(/_/g, " ");
    L.push(`### ${name}`);
    if (meta?.summary_line) L.push(meta.summary_line);

    const facts: string[] = [];
    if (meta?.threat_level) facts.push(`threat: ${meta.threat_level}`);
    const aum = fmtUsd(meta?.aum_usd);
    if (aum) facts.push(`AUM: ${aum}`);
    if (meta?.headquarters_state)
      facts.push(`HQ: ${[meta.headquarters_city, meta.headquarters_state].filter(Boolean).join(", ")}`);
    if (facts.length) L.push(`(${facts.join(" · ")})`);

    const links: string[] = [];
    const base = `Competitors/${slug}`;
    for (const [label, file] of [
      ["Summary", "1_Summary.md"],
      ["Full profile", "2_Full_Profile.md"],
      ["Metadata", "metadata.json"],
    ] as const) {
      try {
        await fs.access(path.join(ROOT, base, file));
        links.push(`[${label}](${urlFor(path.join(base, file))})`);
      } catch {
        /* skip */
      }
    }

    // Knowledge corpus, if any.
    const idxRel = `${base}/Knowledge_From_Source/_index.json`;
    const idx = await readJsonSafe<any>(idxRel);
    if (idx) {
      const n = idx.post_count ?? (Array.isArray(idx.posts) ? idx.posts.length : 0);
      links.push(`[Knowledge corpus — ${n} posts](${urlFor(idxRel)})`);
    }
    if (links.length) L.push(links.map((l) => `- ${l}`).join("\n"));
    L.push("");
  }

  return L.join("\n");
}

// ---- viewer (index.html) -----------------------------------------------------

function indexHtml(): string {
  // Single-file viewer: loads /manifest.json, renders a filterable tree,
  // fetches+renders the selected raw file. Markdown via marked (CDN).
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${SITE_TITLE}</title>
<style>
  :root { --bg:#0f1115; --panel:#161922; --ink:#e6e8ee; --muted:#9aa3b2; --line:#262b36; --accent:#c8a24a; }
  * { box-sizing:border-box; }
  body { margin:0; font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:var(--ink); background:var(--bg); }
  .layout { display:grid; grid-template-columns:340px 1fr; height:100vh; }
  aside { border-right:1px solid var(--line); background:var(--panel); display:flex; flex-direction:column; min-height:0; }
  header { padding:14px 16px; border-bottom:1px solid var(--line); }
  header h1 { font-size:14px; margin:0 0 4px; letter-spacing:.2px; }
  header p { margin:0; font-size:12px; color:var(--muted); }
  header a { color:var(--accent); text-decoration:none; }
  .search { padding:10px 12px; border-bottom:1px solid var(--line); }
  .search input { width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:8px; background:#0c0e13; color:var(--ink); font-size:13px; }
  .tree { overflow:auto; padding:8px 6px 24px; flex:1; min-height:0; }
  .tree details { margin:1px 0; }
  .tree summary { cursor:pointer; padding:3px 6px; border-radius:6px; color:var(--ink); font-weight:600; font-size:13px; list-style:none; }
  .tree summary::-webkit-details-marker { display:none; }
  .tree summary:before { content:"▸"; color:var(--muted); margin-right:6px; font-size:11px; }
  .tree details[open] > summary:before { content:"▾"; }
  .tree .group { margin-left:12px; border-left:1px solid var(--line); padding-left:6px; }
  .tree a.file { display:block; padding:3px 8px; border-radius:6px; color:var(--muted); text-decoration:none; font-size:12.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tree a.file:hover { background:#1d2230; color:var(--ink); }
  .tree a.file.active { background:#23304a; color:#fff; }
  .ext { font-size:10px; color:var(--accent); opacity:.7; margin-left:4px; }
  main { overflow:auto; }
  .toolbar { position:sticky; top:0; background:rgba(15,17,21,.92); backdrop-filter:blur(6px); border-bottom:1px solid var(--line); padding:8px 22px; font-size:12px; color:var(--muted); display:flex; gap:14px; align-items:center; }
  .toolbar a { color:var(--accent); text-decoration:none; }
  .content { padding:28px 40px 120px; max-width:920px; }
  .content pre { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:14px 16px; overflow:auto; }
  .content code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; }
  .content table { border-collapse:collapse; width:100%; margin:14px 0; font-size:13.5px; }
  .content th,.content td { border:1px solid var(--line); padding:6px 9px; text-align:left; }
  .content h1,.content h2,.content h3 { line-height:1.25; }
  .content h1 { border-bottom:1px solid var(--line); padding-bottom:.3em; }
  .content a { color:var(--accent); }
  .empty { color:var(--muted); padding:60px 0; text-align:center; }
  .count { color:var(--muted); font-size:11px; padding:4px 12px; }
</style>
</head>
<body>
<div class="layout">
  <aside>
    <header>
      <h1>${SITE_TITLE}</h1>
      <p>Agent index: <a href="/llms.txt">/llms.txt</a> · <a href="/manifest.json">/manifest.json</a></p>
    </header>
    <div class="search"><input id="q" type="search" placeholder="Filter files…" autocomplete="off" /></div>
    <div class="count" id="count"></div>
    <nav class="tree" id="tree"></nav>
  </aside>
  <main>
    <div class="toolbar">
      <span id="crumb">Select a document</span>
      <span id="raw"></span>
    </div>
    <div class="content" id="content">
      <div class="empty">Pick a file from the tree, or hand an agent <a href="/llms.txt">/llms.txt</a>.</div>
    </div>
  </main>
</div>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script>
const $ = (s) => document.querySelector(s);
let FILES = [];

function buildTree(files) {
  const root = {};
  for (const f of files) {
    const parts = f.rel.split("/");
    let node = root;
    for (let i=0;i<parts.length-1;i++){ node.dirs ??= {}; node.dirs[parts[i]] ??= {}; node = node.dirs[parts[i]]; }
    (node.files ??= []).push(f);
  }
  return root;
}
function renderNode(node, depth) {
  const wrap = document.createElement("div");
  if (node.dirs) {
    for (const name of Object.keys(node.dirs).sort()) {
      const det = document.createElement("details");
      if (depth < 1) det.open = true;
      const sum = document.createElement("summary"); sum.textContent = name; det.appendChild(sum);
      const g = document.createElement("div"); g.className="group";
      g.appendChild(renderNode(node.dirs[name], depth+1)); det.appendChild(g);
      wrap.appendChild(det);
    }
  }
  for (const f of (node.files ?? []).sort((a,b)=>a.title.localeCompare(b.title))) {
    const a = document.createElement("a");
    a.className="file"; a.href="#"+f.rel; a.dataset.rel=f.rel;
    a.innerHTML = f.title.replace(/</g,"&lt;") + '<span class="ext">'+f.ext.slice(1)+'</span>';
    a.onclick = (e)=>{ e.preventDefault(); location.hash = f.rel; };
    wrap.appendChild(a);
  }
  return wrap;
}
function paint(files) {
  const tree = $("#tree"); tree.innerHTML="";
  tree.appendChild(renderNode(buildTree(files), 0));
  $("#count").textContent = files.length + " files";
  highlight();
}
function highlight() {
  const rel = decodeURIComponent(location.hash.slice(1));
  document.querySelectorAll("a.file").forEach(a=>a.classList.toggle("active", a.dataset.rel===rel));
}
async function load() {
  const rel = decodeURIComponent(location.hash.slice(1));
  if (!rel) return;
  highlight();
  $("#crumb").textContent = rel;
  $("#raw").innerHTML = '<a href="/'+rel+'" target="_blank" rel="noopener">view raw ↗</a>';
  const c = $("#content");
  c.innerHTML = '<div class="empty">Loading…</div>';
  try {
    const res = await fetch("/"+rel); const text = await res.text();
    if (rel.endsWith(".md")) c.innerHTML = marked.parse(text);
    else { const pre=document.createElement("pre"); const code=document.createElement("code");
      code.textContent = rel.endsWith(".json") ? JSON.stringify(JSON.parse(text),null,2) : text;
      pre.appendChild(code); c.innerHTML=""; c.appendChild(pre); }
    c.scrollTop = 0; window.scrollTo(0,0);
  } catch(err){ c.innerHTML = '<div class="empty">Could not load '+rel+'</div>'; }
}
$("#q").addEventListener("input", (e)=>{
  const q = e.target.value.toLowerCase().trim();
  paint(!q ? FILES : FILES.filter(f => (f.rel+" "+f.title).toLowerCase().includes(q)));
});
window.addEventListener("hashchange", load);
(async () => {
  const m = await (await fetch("/manifest.json")).json();
  FILES = m.files; paint(FILES); if (location.hash) load();
})();
</script>
</body>
</html>
`;
}

// ---- main --------------------------------------------------------------------

async function main() {
  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });

  const rels = (await walk(ROOT)).sort();

  const entries: FileEntry[] = [];
  for (const rel of rels) {
    const ext = path.extname(rel).toLowerCase();
    await copyFile(rel);
    const stat = await fs.stat(path.join(ROOT, rel));
    entries.push({ rel: urlFor(rel).slice(1), ext, title: await titleFor(rel, ext), size: stat.size });
  }

  const manifest = {
    site: SITE_TITLE,
    generated: new Date().toISOString(),
    count: entries.length,
    files: entries,
  };
  await fs.writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  await fs.writeFile(path.join(OUT, "llms.txt"), await buildLlmsTxt());
  await fs.writeFile(path.join(OUT, "index.html"), indexHtml());
  await fs.writeFile(
    path.join(OUT, "robots.txt"),
    ALLOW_INDEXING ? "User-agent: *\nAllow: /\n" : "User-agent: *\nDisallow: /\n"
  );

  console.log(`web/ built: ${entries.length} content files`);
  console.log(`  llms.txt, manifest.json, index.html, robots.txt`);
  console.log(`  indexing: ${ALLOW_INDEXING ? "ALLOWED" : "blocked (robots Disallow)"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
