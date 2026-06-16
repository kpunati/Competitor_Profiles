/**
 * scrape-knowledge.ts
 *
 * Deep-crawls a competitor's blog/insights pages to build a corpus of
 * their *content* (not their *site shape* — that's what extract.ts does).
 *
 * Output goes into Competitors/{slug}/Knowledge_From_Source/ as one
 * markdown file per post, plus an _index.json that catalogs the corpus.
 *
 * Usage:
 *   npx tsx tools/scrape-knowledge.ts --slug Foundry_Financial
 *   npx tsx tools/scrape-knowledge.ts --slug Money_Guy --limit 50
 *   npx tsx tools/scrape-knowledge.ts --slug Kitces --blog-url https://kitces.com/blog
 *
 * Notes:
 *   - Resume-safe: re-running skips posts already in _index.json.
 *   - Default --limit 30 most-recent posts.
 *   - Uses Playwright with stealth; falls back to plain fetch() on 403/Cloudflare.
 *   - Article-body extraction via Mozilla Readability; HTML→Markdown via Turndown.
 */

import { chromium, type Browser, type Page } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

interface ScrapeOptions {
  slug: string;
  limit?: number;
  blogUrl?: string;        // override the blog index URL
  perPostDelayMs?: number; // delay between requests
  timeoutMs?: number;      // per-page timeout
}

interface PostIndexEntry {
  file: string;
  url: string;
  title: string;
  date: string | null;     // YYYY-MM-DD or null if not parseable
  author: string | null;
  word_count: number;
  tags: string[];
  captured: string;        // YYYY-MM-DD
}

interface CorpusIndex {
  firm: string;
  blog_url: string;
  captured: string;
  post_count: number;
  posts: PostIndexEntry[];
}

const STEALTH_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const STEALTH_HEADERS = {
  "User-Agent": STEALTH_UA,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
};

// Detect URLs that look like content (post/article/episode/etc.) vs.
// site-shape pages. Used to filter discovered links.
const CONTENT_URL_HINT = /\/(blog|post|posts|article|articles|insights?|news|press|resources?|episodes?|podcast|guides?|stories?|p)\//i;

// Detect URLs that look like blog INDEX pages (which we want to skip when
// looking for actual posts). Pagination patterns + category pages.
const INDEX_URL_HINT =
  /\/(page\/\d+|category\/|tag\/|topic\/|author\/|archive)/i;

export async function scrapeKnowledge(opts: ScrapeOptions): Promise<void> {
  const { slug } = opts;
  const limit = opts.limit ?? 30;
  const perPostDelayMs = opts.perPostDelayMs ?? 3_000;
  const timeoutMs = opts.timeoutMs ?? 30_000;

  const compDir = join(ROOT, "Competitors", slug);
  if (!existsSync(compDir)) {
    throw new Error(`Competitor folder not found: ${compDir}`);
  }
  const knowledgeDir = join(compDir, "Knowledge_From_Source");
  await mkdir(knowledgeDir, { recursive: true });

  const indexPath = join(knowledgeDir, "_index.json");
  let index: CorpusIndex | null = await readJsonOrNull<CorpusIndex>(indexPath);

  // 1. Find the blog URL
  const blogUrl = opts.blogUrl ?? (await findBlogUrl(compDir));
  if (!blogUrl) {
    throw new Error(
      `No blog URL found for ${slug}. Pass --blog-url <url> to override.`,
    );
  }
  console.log(`[scrape-knowledge] ${slug} ← ${blogUrl}`);

  // 2. Spin up Playwright
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: STEALTH_UA,
    locale: "en-US",
    timezoneId: "America/New_York",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  try {
    // 3. Discover post URLs
    const blogPage = await ctx.newPage();
    const postUrls = await discoverPostUrls(blogPage, blogUrl, timeoutMs);
    await blogPage.close();

    if (postUrls.length === 0) {
      console.warn(`[scrape-knowledge] no post URLs discovered on ${blogUrl}`);
      return;
    }

    console.log(
      `[scrape-knowledge] discovered ${postUrls.length} candidate URLs, will capture top ${Math.min(limit, postUrls.length)}`,
    );

    // 4. Filter out URLs already captured
    const seenUrls = new Set(index?.posts.map((p) => p.url) ?? []);
    const fresh = postUrls.filter((u) => !seenUrls.has(u)).slice(0, limit);
    const skipped = postUrls.length - fresh.length - (postUrls.length - Math.min(limit, postUrls.length));

    if (fresh.length === 0) {
      console.log(
        `[scrape-knowledge] all ${Math.min(limit, postUrls.length)} candidates already captured. Nothing to do.`,
      );
      return;
    }

    console.log(
      `[scrape-knowledge] ${fresh.length} new posts to capture (${seenUrls.size} already in index)`,
    );

    // 5. Capture each post
    const today = new Date().toISOString().slice(0, 10);
    const newEntries: PostIndexEntry[] = [];
    let captured = 0;
    let failed = 0;

    for (const url of fresh) {
      try {
        const entry = await capturePost(ctx, url, slug, knowledgeDir, today, timeoutMs);
        if (entry) {
          newEntries.push(entry);
          captured++;
          console.log(`[scrape-knowledge]   ✓ ${entry.title.slice(0, 60)}`);
        }
      } catch (err) {
        failed++;
        console.warn(`[scrape-knowledge]   ✗ ${url} — ${(err as Error).message}`);
      }
      // Be polite between requests
      await sleep(perPostDelayMs);
    }

    // 6. Update _index.json
    const merged: CorpusIndex = {
      firm: slug,
      blog_url: blogUrl,
      captured: today,
      post_count: (index?.posts.length ?? 0) + newEntries.length,
      posts: [...(index?.posts ?? []), ...newEntries].sort((a, b) =>
        (b.date ?? "").localeCompare(a.date ?? ""),
      ),
    };
    await writeFile(indexPath, JSON.stringify(merged, null, 2));

    console.log(
      `[scrape-knowledge] done. captured=${captured} failed=${failed} (corpus now ${merged.post_count} posts)`,
    );
  } finally {
    await ctx.close();
    await browser.close();
  }
}

// ---------- Discovery ----------

async function findBlogUrl(compDir: string): Promise<string | null> {
  const blogJsonPath = join(compDir, "Source_Data", "pages", "blog.json");
  if (!existsSync(blogJsonPath)) return null;
  const blogJson = JSON.parse(await readFile(blogJsonPath, "utf-8"));
  return typeof blogJson.url === "string" ? blogJson.url : null;
}

async function discoverPostUrls(
  page: Page,
  blogUrl: string,
  timeoutMs: number,
): Promise<string[]> {
  // Open the blog index, scroll to trigger lazy loading, harvest links.
  // If Playwright hits a Cloudflare interstitial / 403, fall back to a
  // plain fetch() and parse the raw HTML for links (no JS, no lazy-load
  // but at least we get the initial set of post URLs).
  let html: string | null = null;
  try {
    try {
      await page.goto(blogUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    } catch {
      await page.goto(blogUrl, { waitUntil: "commit", timeout: timeoutMs });
      await page.waitForTimeout(3000);
    }
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

    html = await page.content();
    if (/checking your browser|403\s*[-–]?\s*forbidden|access denied/i.test(html.slice(0, 5000))) {
      html = null;
    }
  } catch {
    html = null;
  }

  let raw: { href: string; text: string }[];
  if (html) {
    // Playwright path: auto-scroll + harvest live DOM
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let total = 0;
        const step = 500;
        const t = setInterval(() => {
          window.scrollBy(0, step);
          total += step;
          if (total >= document.body.scrollHeight - window.innerHeight) {
            clearInterval(t);
            resolve();
          }
        }, 250);
        setTimeout(() => {
          clearInterval(t);
          resolve();
        }, 15_000);
      });
    });

    raw = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[href]")).map((a) => ({
        href: (a as HTMLAnchorElement).href,
        text: ((a as HTMLElement).innerText || "").trim().slice(0, 120),
      }));
    });
  } else {
    // Fallback path: plain fetch() with stealth headers, parse with JSDOM
    console.log(`[scrape-knowledge] discovery: Playwright bot-blocked, falling back to fetch()`);
    const r = await fetch(blogUrl, {
      headers: STEALTH_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) {
      throw new Error(`Blog discovery failed: HTTP ${r.status} ${r.statusText}`);
    }
    const fallbackHtml = await r.text();
    const dom = new JSDOM(fallbackHtml, { url: blogUrl });
    raw = Array.from(dom.window.document.querySelectorAll("a[href]")).map((a) => ({
      href: (a as HTMLAnchorElement).href,
      text: (a.textContent || "").trim().slice(0, 120),
    }));
  }

  const base = new URL(blogUrl);
  const blogPathDepth = base.pathname.split("/").filter(Boolean).length;

  const candidates = new Set<string>();
  for (const { href } of raw) {
    if (!href) continue;
    let u: URL;
    try {
      u = new URL(href);
    } catch {
      continue;
    }
    if (u.origin !== base.origin) continue;
    // Skip index/category/tag pages
    if (INDEX_URL_HINT.test(u.pathname)) continue;
    // Skip the blog index itself and shallow site-shape pages
    if (u.pathname === base.pathname) continue;
    // Skip anchor-only links
    if (u.pathname === "/" || u.pathname === "") continue;
    // Skip non-HTML resources
    if (/\.(jpg|jpeg|png|gif|svg|webp|pdf|mp4|webm|mp3|m4a|zip)(\?|$)/i.test(u.pathname)) continue;
    // Strip query/hash for dedupe
    u.search = "";
    u.hash = "";
    const cleaned = u.toString();

    // Accept if EITHER:
    //  (a) URL is deeper than the blog index (typical /blog/post-name pattern)
    //  (b) URL pathname contains a content-URL hint (/blog/, /post/, etc.)
    //  (c) URL pathname looks like a slug — long-with-hyphens-style — at the
    //      root level (WordPress sites that publish posts directly at /post-slug/
    //      instead of /blog/post-slug/, like Tax Alchemy and Sven Carlin)
    const pathDepth = u.pathname.split("/").filter(Boolean).length;
    const lastSeg = u.pathname.split("/").filter(Boolean).pop() ?? "";
    const slugLike =
      lastSeg.length >= 20 &&
      (lastSeg.match(/-/g)?.length ?? 0) >= 3 &&
      !INDEX_URL_HINT.test(u.pathname);
    if (
      pathDepth > blogPathDepth ||
      CONTENT_URL_HINT.test(u.pathname) ||
      slugLike
    ) {
      candidates.add(cleaned);
    }
  }

  // Sort: URLs with embedded dates → newest first; else lexicographic descending
  const arr = [...candidates];
  arr.sort((a, b) => {
    const da = extractDateFromUrl(a);
    const db = extractDateFromUrl(b);
    if (da && db) return db.localeCompare(da);
    if (da) return -1;
    if (db) return 1;
    return b.localeCompare(a);
  });

  return arr;
}

function extractDateFromUrl(url: string): string | null {
  // Match /YYYY/MM/DD/ or /YYYY/MM/ or YYYY-MM-DD or YYYY/MM
  const m1 = url.match(/\/(\d{4})\/(\d{1,2})\/(\d{1,2})(\/|$)/);
  if (m1) return `${m1[1]}-${m1[2].padStart(2, "0")}-${m1[3].padStart(2, "0")}`;
  const m2 = url.match(/\/(\d{4})\/(\d{1,2})(\/|$)/);
  if (m2) return `${m2[1]}-${m2[2].padStart(2, "0")}-01`;
  const m3 = url.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m3) return `${m3[1]}-${m3[2]}-${m3[3]}`;
  return null;
}

// ---------- Per-post capture ----------

async function capturePost(
  ctx: import("playwright").BrowserContext,
  url: string,
  slug: string,
  knowledgeDir: string,
  capturedDate: string,
  timeoutMs: number,
): Promise<PostIndexEntry | null> {
  // Try Playwright first
  let html: string | null = null;
  let finalUrl = url;
  const page = await ctx.newPage();
  try {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    } catch {
      await page.goto(url, { waitUntil: "commit", timeout: timeoutMs });
      await page.waitForTimeout(2000);
    }
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    // Auto-scroll to load any lazy article body
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let total = 0;
        const t = setInterval(() => {
          window.scrollBy(0, 500);
          total += 500;
          if (total >= document.body.scrollHeight) {
            clearInterval(t);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(t);
          resolve();
        }, 5_000);
      });
    });
    html = await page.content();
    finalUrl = page.url();

    // Soft-bot-check detection: Cloudflare interstitial / 403 in title
    if (/checking your browser|403\s*[-–]?\s*forbidden|access denied/i.test(html.slice(0, 5000))) {
      html = null;
    }
  } catch {
    html = null;
  } finally {
    await page.close().catch(() => {});
  }

  // Fall back to plain fetch() if Playwright was blocked or failed
  if (!html) {
    const r = await fetch(url, {
      headers: STEALTH_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) {
      throw new Error(`HTTP ${r.status} ${r.statusText}`);
    }
    html = await r.text();
    finalUrl = r.url;
  }

  // Parse + extract
  const dom = new JSDOM(html, { url: finalUrl });
  const doc = dom.window.document;

  // Pull metadata BEFORE running Readability (which can strip some meta tags)
  const meta = extractPostMetadata(doc, finalUrl);

  const reader = new Readability(doc, {
    charThreshold: 200,
  });
  const article = reader.parse();

  if (!article || !article.content) {
    throw new Error("Readability could not extract article body");
  }

  // Convert article HTML → markdown
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
  });
  // Drop common chrome that Readability sometimes leaves in
  turndown.remove(["script", "style", "noscript", "iframe", "form", "button"]);
  const markdownBody = turndown.turndown(article.content).trim();

  // Resolve title. Readability is usually best. If the Readability title
  // matches the document <title> exactly AND the document has an H1 with
  // a different text, the site is using a templated <title> (Peak FP
  // pattern) — fall back to the H1.
  let rawTitle = (article.title || meta.title || "Untitled").trim();
  const docTitle = doc.title?.trim();
  const firstH1 = doc.querySelector("h1")?.textContent?.trim();
  if (firstH1 && docTitle && rawTitle === docTitle && firstH1 !== docTitle) {
    rawTitle = firstH1;
  }
  const title = cleanTitle(rawTitle);

  // Date precedence: explicit meta > URL pattern > unknown
  const date = meta.date ?? extractDateFromUrl(finalUrl);

  // File naming: YYYY-MM-DD_slug.md (or captured-date_slug.md if no date)
  const filenameDate = date ?? capturedDate;
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "untitled";
  // Append a short URL hash so different posts that produce the same slug
  // (templated <title>s, very long titles truncated to the same prefix,
  // posts with duplicate titles in different sections) don't collide.
  const urlHash = createHash("sha1").update(finalUrl).digest("hex").slice(0, 6);
  const filename = `${filenameDate}_${slugify(title)}_${urlHash}.md`;
  const filePath = join(knowledgeDir, filename);

  // Build frontmatter + body
  const wordCount = countWords(markdownBody);
  const frontmatter = buildFrontmatter({
    title,
    url: finalUrl,
    author: meta.author,
    date,
    captured: capturedDate,
    tags: meta.tags,
    word_count: wordCount,
    source_firm: slug,
  });

  const content = `${frontmatter}\n\n# ${title}\n\n${markdownBody}\n`;
  await writeFile(filePath, content);

  return {
    file: filename,
    url: finalUrl,
    title,
    date,
    author: meta.author,
    word_count: wordCount,
    tags: meta.tags,
    captured: capturedDate,
  };
}

// ---------- Metadata extraction ----------

interface PostMetadata {
  title: string | null;
  author: string | null;
  date: string | null;
  tags: string[];
}

function extractPostMetadata(doc: Document, url: string): PostMetadata {
  const get = (sel: string, attr = "content") =>
    doc.querySelector(sel)?.getAttribute(attr) ?? null;

  // Title
  const title =
    get('meta[property="og:title"]') ??
    get('meta[name="twitter:title"]') ??
    doc.title ??
    null;

  // Author — tighten selectors and sanity-check the result. The catchall
  // [class*='author'] reliably catches comment-count widgets and other
  // garbage on some templates, so we drop it.
  let authorRaw =
    get('meta[name="author"]') ??
    get('meta[property="article:author"]') ??
    doc.querySelector('[rel="author"]')?.textContent?.trim() ??
    doc.querySelector(".author-name, .byline, .post-author, .entry-author")
      ?.textContent?.trim() ??
    null;
  let author = authorRaw ? cleanAuthor(authorRaw) : null;

  // Date — try several sources in priority order
  let date: string | null = null;
  const dateCandidates = [
    get('meta[property="article:published_time"]'),
    get('meta[name="date"]'),
    get('meta[name="DC.date.issued"]'),
    get('meta[itemprop="datePublished"]'),
    doc.querySelector("time[datetime]")?.getAttribute("datetime") ?? null,
    doc.querySelector("time")?.textContent?.trim() ?? null,
  ];
  // Also try JSON-LD
  doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    if (date) return;
    try {
      const json = JSON.parse(s.textContent || "{}");
      const blocks = Array.isArray(json) ? json : [json];
      for (const b of blocks) {
        const d = b?.datePublished ?? b?.dateCreated ?? null;
        if (d) {
          dateCandidates.push(d);
          break;
        }
      }
    } catch {
      /* malformed JSON-LD */
    }
  });
  for (const c of dateCandidates) {
    if (!c) continue;
    const parsed = parseDateLoose(c);
    if (parsed) {
      date = parsed;
      break;
    }
  }

  // Tags
  const tags = new Set<string>();
  doc.querySelectorAll('meta[property="article:tag"]').forEach((m) => {
    const v = m.getAttribute("content");
    if (v) tags.add(v.toLowerCase());
  });
  doc
    .querySelectorAll('a[rel="tag"], .tags a, .post-tags a, [class*="tag"] a')
    .forEach((a) => {
      const t = (a.textContent || "").trim();
      if (t && t.length < 40) tags.add(t.toLowerCase());
    });

  return { title, author, date, tags: [...tags].slice(0, 10) };
}

function cleanAuthor(raw: string): string | null {
  // Strip "By " prefix, collapse whitespace, trim
  const collapsed = raw.replace(/^by\s+/i, "").replace(/\s+/g, " ").trim();
  // Reject obvious garbage: empty, all-digits-or-symbols, too long
  if (!collapsed || collapsed.length < 2 || collapsed.length > 120) return null;
  if (!/[a-zA-Z]/.test(collapsed)) return null;
  // Reject text that's mostly numbers (comment counts, share counts)
  const letterRatio = (collapsed.match(/[a-zA-Z]/g)?.length ?? 0) / collapsed.length;
  if (letterRatio < 0.5) return null;
  return collapsed;
}

function cleanTitle(raw: string): string {
  // Strip the standard "ArticleTitle — SiteName | Tagline" or
  // "ArticleTitle | SiteName" suffix. Take the part before the FIRST
  // em-dash, en-dash, or pipe separator (don't split on plain hyphen —
  // article titles legitimately contain it).
  const first = raw.split(/\s+[—–|]\s+/)[0].trim();
  return (first || raw.trim()).slice(0, 200);
}

function parseDateLoose(s: string): string | null {
  // Try ISO first
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // Try Date.parse
  const ms = Date.parse(s);
  if (!isNaN(ms)) return new Date(ms).toISOString().slice(0, 10);
  return null;
}

function buildFrontmatter(data: Record<string, unknown>): string {
  const lines = ["---"];
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) {
      lines.push(`${k}: null`);
    } else if (Array.isArray(v)) {
      if (v.length === 0) lines.push(`${k}: []`);
      else lines.push(`${k}: [${v.map((x) => JSON.stringify(x)).join(", ")}]`);
    } else if (typeof v === "string") {
      // Quote strings to be safe with YAML
      lines.push(`${k}: ${JSON.stringify(v)}`);
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

function countWords(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

async function readJsonOrNull<T>(p: string): Promise<T | null> {
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(await readFile(p, "utf-8")) as T;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- CLI ----------

function parseArgs(argv: string[]): ScrapeOptions {
  const out: Partial<ScrapeOptions> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--slug") out.slug = argv[++i];
    else if (a === "--limit") out.limit = parseInt(argv[++i], 10);
    else if (a === "--blog-url") out.blogUrl = argv[++i];
    else if (a === "--delay-ms") out.perPostDelayMs = parseInt(argv[++i], 10);
    else if (a === "--timeout-ms") out.timeoutMs = parseInt(argv[++i], 10);
  }
  if (!out.slug) {
    throw new Error("Missing required --slug <slug>");
  }
  return out as ScrapeOptions;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const opts = parseArgs(process.argv.slice(2));
  scrapeKnowledge(opts).catch((err) => {
    console.error(`[scrape-knowledge] ERROR: ${(err as Error).message}`);
    process.exit(1);
  });
}
