/**
 * extract.ts
 *
 * Visits a competitor's website with Playwright and captures everything we
 * need to analyze it:
 *   - Full-page and above-the-fold screenshots (desktop + mobile)
 *   - Saved HTML of every page visited
 *   - Structured extraction per page (title, meta, headings, body text, CTAs)
 *   - Computed design details (palette, fonts, primary button style)
 *   - Stub company_facts.json with public ADV lookup hint
 *
 * Output goes into Competitors/{slug}/Source_Data/ and Competitors/{slug}/Screenshots/.
 *
 * Usage:
 *   npx tsx tools/extract.ts --slug Acme_Co --url https://acme.co
 *
 * Note: this is the deterministic capture step. It uses the playwright npm
 * package directly, not Playwright MCP — MCP is reserved for the analyze step
 * where an LLM has to judge things.
 */

import { chromium, devices, type Browser, type Page } from "playwright";
import { mkdir, writeFile, readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

type PageKind = "home" | "pricing" | "about" | "services" | "contact" | "blog";

// Path-anchored patterns (matched against URL.pathname). Path matches are
// way more reliable than anchor-text matches — nav structure is stable, link
// copy isn't. Each kind has primary path patterns and fallback text patterns.
const PATH_HINTS: Record<Exclude<PageKind, "home">, RegExp> = {
  pricing: /\/(pricing|fees?|cost|rates?)(\/|$)/i,
  about: /\/(about|our[-_]?firm|who[-_]?we[-_]?are|company|our[-_]?story|story|mission)(\/|$)/i,
  services: /\/(services?|what[-_]?we[-_]?do|how[-_]?we[-_]?help|solutions?|approach|process)(\/|$)/i,
  contact: /\/(contact|get[-_]?in[-_]?touch|let[-_']?s[-_]?chat|talk[-_]?to|book|schedule)(\/|$)/i,
  blog: /\/(blog|insights?|articles?|news|press|resources?\/?(news|insights?|blog|articles?)?)(\/|$)/i,
};

const TEXT_HINTS: Record<Exclude<PageKind, "home">, RegExp> = {
  pricing: /^(pricing|fees?|our[-\s]fees?|cost|rates?)$/i,
  about: /^(about|about[-\s]us|our[-\s]firm|who[-\s]we[-\s]are|our[-\s]story|company)$/i,
  services: /^(services?|what[-\s]we[-\s]do|how[-\s]we[-\s]help|our[-\s]services|solutions?|our[-\s]approach)$/i,
  contact: /^(contact|contact[-\s]us|let'?s[-\s]chat|talk[-\s]to[-\s]us|book[-\s]a[-\s](call|meeting))$/i,
  blog: /^(blog|insights?|articles?|news|press|in[-\s]the[-\s]news|resources?)$/i,
};

const VIEWPORT_DESKTOP = { width: 1440, height: 900 };
const MOBILE = devices["iPhone 13"];

export interface ExtractOptions {
  slug: string;
  url: string;
  pageBudget?: number;   // hard cap on pages to capture (default 6)
  timeoutMs?: number;    // per-page timeout (default 30s)
}

export interface ExtractResult {
  slug: string;
  outDir: string;
  pagesCaptured: Array<{ kind: PageKind; url: string; file: string }>;
  competitorName: string | null;
}

export async function extract(opts: ExtractOptions): Promise<ExtractResult> {
  const { slug, url } = opts;
  const pageBudget = opts.pageBudget ?? 6;
  const timeoutMs = opts.timeoutMs ?? 30_000;

  const compDir = join(ROOT, "Competitors", slug);
  const sourceDir = join(compDir, "Source_Data");
  const pagesDir = join(sourceDir, "pages");
  const shotsDir = join(compDir, "Screenshots");

  await mkdir(pagesDir, { recursive: true });
  await mkdir(shotsDir, { recursive: true });

  console.log(`[extract] ${slug} ← ${url}`);

  const browser = await chromium.launch({ headless: true });
  try {
    const desktopCtx = await browser.newContext({
      viewport: VIEWPORT_DESKTOP,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      locale: "en-US",
      timezoneId: "America/New_York",
    });
    const mobileCtx = await browser.newContext({ ...MOBILE });
    // Hide common automation signals. Many anti-bot services (SiteLock,
    // Cloudflare, Imperva, Akamai) check `navigator.webdriver` and a few
    // related properties. Setting them to look like a normal browser stops
    // the easy bot-flagging without trying anything aggressive.
    const stealthScript = `
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      window.chrome = window.chrome || { runtime: {} };
    `;
    await desktopCtx.addInitScript(stealthScript);
    await mobileCtx.addInitScript(stealthScript);

    // Step 1 — homepage on desktop. Captures everything plus our design probe.
    const home = await desktopCtx.newPage();
    home.setDefaultTimeout(timeoutMs);

    const homeRes = await capturePage(home, url, "home", {
      slug, shotsDir, pagesDir, takeMobile: false,
    });
    const design = await probeDesign(home);
    const competitorName = await extractCompetitorName(home);

    // Step 2 — also capture homepage on mobile for the design notes
    const homeMobile = await mobileCtx.newPage();
    homeMobile.setDefaultTimeout(timeoutMs);
    await homeMobile.goto(url, { waitUntil: "domcontentloaded" });
    await homeMobile.waitForLoadState("networkidle", { timeout: timeoutMs }).catch(() => {});
    await homeMobile.screenshot({
      path: join(shotsDir, "Homepage_mobile.png"),
      fullPage: false,
    });
    await homeMobile.close();

    // Step 3 — discover key sub-pages from three sources, ordered by
    // reliability. Each is independent; results are deduped downstream.
    //   (a) sitemap.xml (via robots.txt) — most reliable, ignores nav UI
    //   (b) <a href> links on the homepage (using textContent so hidden
    //       dropdown links aren't dropped)
    //   (c) well-known RIA paths probed via HEAD — fallback for sites
    //       with no sitemap and JS-only navigation
    const fromSitemap = await discoverViaSitemap(new URL(url)).catch((err) => {
      console.warn(`[extract] sitemap discovery failed: ${err.message}`);
      return [];
    });
    const fromNav = await discoverPages(home, new URL(url));
    const fromKnownPaths = await probeKnownPaths(new URL(url));
    console.log(
      `[extract] candidates: sitemap=${fromSitemap.length}, nav=${fromNav.length}, known-paths=${fromKnownPaths.length}`,
    );
    const candidates = [...fromSitemap, ...fromNav, ...fromKnownPaths];
    const picks = pickPages(candidates, pageBudget - 1, url);

    const captured: ExtractResult["pagesCaptured"] = [
      { kind: "home", url, file: homeRes.htmlFile },
    ];

    for (const pick of picks) {
      try {
        const page = await desktopCtx.newPage();
        page.setDefaultTimeout(timeoutMs);
        const res = await capturePage(page, pick.url, pick.kind, {
          slug, shotsDir, pagesDir, takeMobile: false,
        });
        captured.push({ kind: pick.kind, url: pick.url, file: res.htmlFile });
        await page.close();
      } catch (err) {
        console.warn(`[extract] skipped ${pick.kind} (${pick.url}): ${(err as Error).message}`);
      }
    }

    // Step 4 — write design details + company_facts stub + meta
    await writeFile(
      join(sourceDir, "design_details.json"),
      JSON.stringify(
        {
          competitor: competitorName ?? slug.replace(/_/g, " "),
          extracted_at: new Date().toISOString().slice(0, 10),
          source_url: url,
          ...design,
        },
        null,
        2,
      ),
    );

    await ensureCompanyFactsStub(sourceDir, slug, competitorName, url);

    await writeFile(
      join(sourceDir, "meta.json"),
      JSON.stringify(
        {
          slug,
          source_url: url,
          competitor_name: competitorName,
          extracted_at: new Date().toISOString(),
          pages: captured,
          page_budget: pageBudget,
        },
        null,
        2,
      ),
    );

    await desktopCtx.close();
    await mobileCtx.close();

    console.log(`[extract] done. ${captured.length} pages → ${sourceDir}`);
    return { slug, outDir: compDir, pagesCaptured: captured, competitorName };
  } finally {
    await browser.close();
  }
}

async function capturePage(
  page: Page,
  url: string,
  kind: PageKind,
  opts: { slug: string; shotsDir: string; pagesDir: string; takeMobile: boolean },
): Promise<{ htmlFile: string }> {
  // Some platforms (notably Wix-hosted sites) never fire domcontentloaded
  // within the default timeout. Try the strict event first; if it doesn't
  // fire, fall back to `commit` (earliest event) and settle manually.
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
  } catch (err) {
    console.warn(
      `[extract] domcontentloaded didn't fire for ${url}, falling back to commit`,
    );
    await page.goto(url, { waitUntil: "commit", timeout: 30_000 });
    await page.waitForTimeout(3_000);
  }
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await dismissCommonOverlays(page);

  // Soft-404 detection FIRST, before any file writes or screenshots. Many CMSs
  // return HTTP 200 OK with a "Page Not Found" template (Walser's /pricing and
  // /who-we-are did this). Catch and reject before we waste a page slot.
  const softCheckResult = await page.evaluate(() => {
    const title = document.title || "";
    const h1 = document.querySelector("h1")?.textContent || "";
    const combined = `${title}\n${h1}`;
    const soft404 = /\b(page\s+not\s+found|404\s+not\s+found|\bnot\s+found\b|^404$|^\s*oops\b)\b/i.test(
      combined,
    );
    return { soft404, title, h1: h1.slice(0, 80) };
  });
  if (softCheckResult.soft404) {
    throw new Error(
      `soft 404 detected (title="${softCheckResult.title.slice(0, 60)}", h1="${softCheckResult.h1}")`,
    );
  }

  const niceName = niceFileName(kind);

  // Take the above-fold screenshot BEFORE autoScroll runs. Many sites have
  // entrance animations on the hero (typewriter effects, slide-ins, video
  // backgrounds) that don't replay when scrolled away and back to top.
  // Capturing first preserves the hero in its natural initial state.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.screenshot({
    path: join(opts.shotsDir, `${niceName}_above_fold.png`),
    fullPage: false,
  });

  // Now scroll through the whole page to trigger lazy-loaded content, then
  // take the full-page screenshot. Playwright's fullPage handles stitching.
  await autoScroll(page);
  await page.screenshot({
    path: join(opts.shotsDir, `${niceName}_full.png`),
    fullPage: true,
  });

  const html = await page.content();
  const htmlFile = join(opts.pagesDir, `${kind}.html`);
  await writeFile(htmlFile, html);

  const extracted = await page.evaluate(() => {
    // NOTE: keep this body free of local named function expressions —
    // tsx wraps them with a __name helper that breaks inside page.evaluate.
    const headings: { level: string; text: string }[] = [];
    document.querySelectorAll("h1, h2, h3").forEach((h) => {
      headings.push({
        level: h.tagName,
        text: ((h as HTMLElement).innerText || "").trim(),
      });
    });

    const ctas: { text: string; tag: string; href: string | null }[] = [];
    document.querySelectorAll("a, button").forEach((el) => {
      const text = ((el as HTMLElement).innerText || "").trim();
      if (!text || text.length > 60) return;
      const isButtonLike =
        el.tagName === "BUTTON" ||
        /button|cta|btn/i.test((el as HTMLElement).className) ||
        getComputedStyle(el).cursor === "pointer";
      if (!isButtonLike) return;
      ctas.push({ text, tag: el.tagName, href: el.getAttribute("href") });
    });

    const metaDesc =
      document.querySelector('meta[name="description"]')?.getAttribute("content") ??
      document.querySelector('meta[property="og:description"]')?.getAttribute("content") ??
      null;
    const metaTitle =
      document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? null;

    const bodyText = ((document.body as HTMLElement).innerText || "")
      .trim()
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .slice(0, 50_000);

    return {
      url: location.href,
      title: document.title,
      meta: {
        description: metaDesc,
        og_title: metaTitle,
        og_description: metaDesc,
      },
      headings,
      ctas: ctas.slice(0, 30),
      body_text: bodyText,
    };
  });

  await writeFile(
    join(opts.pagesDir, `${kind}.json`),
    JSON.stringify({ kind, ...extracted }, null, 2),
  );

  return { htmlFile };
}

async function probeDesign(page: Page) {
  return await page.evaluate(() => {
    // NOTE: avoid local named function expressions — see capturePage's evaluate.
    const bodyCS = getComputedStyle(document.body);
    const htmlCS = getComputedStyle(document.documentElement);

    const h1 = document.querySelector("h1");
    const p = document.querySelector("p");
    const h1CS = h1 ? getComputedStyle(h1) : null;
    const pCS = p ? getComputedStyle(p) : null;

    // Find a plausible primary CTA: topmost visible button-like element with a real bg
    const btns: HTMLElement[] = [];
    document.querySelectorAll("a, button").forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.width < 60 || rect.height < 24) return;
      const cs = getComputedStyle(el);
      if (!cs.backgroundColor || cs.backgroundColor === "rgba(0, 0, 0, 0)") return;
      btns.push(el as HTMLElement);
    });
    btns.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    const primary = btns[0];
    const primaryCS = primary ? getComputedStyle(primary) : null;

    // Sample palette: count background-colors across all elements
    const paletteCounts = new Map<string, number>();
    document.querySelectorAll("*").forEach((el) => {
      const bg = getComputedStyle(el).backgroundColor;
      if (!bg || bg === "rgba(0, 0, 0, 0)") return;
      paletteCounts.set(bg, (paletteCounts.get(bg) ?? 0) + 1);
    });
    const palette: { color: string; count: number }[] = [];
    [...paletteCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .forEach((entry) => palette.push({ color: entry[0], count: entry[1] }));

    return {
      colors: {
        body_background: bodyCS.backgroundColor,
        body_text: bodyCS.color,
        html_background: htmlCS.backgroundColor,
        palette_raw: palette,
        primary: palette[1]?.color ?? null,
        accent: palette[2]?.color ?? null,
      },
      typography: {
        heading_family: h1CS ? h1CS.fontFamily : null,
        heading_weight: h1CS ? h1CS.fontWeight : null,
        body_family: bodyCS.fontFamily,
        body_weight: bodyCS.fontWeight,
        body_size_px: parseFloat(bodyCS.fontSize) || null,
        paragraph_size_px: pCS ? parseFloat(pCS.fontSize) || null : null,
      },
      primary_button: primaryCS
        ? {
            text: ((primary as HTMLElement).innerText || "").trim().slice(0, 60),
            background: primaryCS.backgroundColor,
            text_color: primaryCS.color,
            border_radius_px: parseFloat(primaryCS.borderRadius) || 0,
            padding: primaryCS.padding,
          }
        : null,
      layout: {
        document_width_px: document.documentElement.scrollWidth,
        viewport_width_px: window.innerWidth,
      },
    };
  });
}

async function extractCompetitorName(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    const ogSite =
      document.querySelector('meta[property="og:site_name"]')?.getAttribute("content") ?? null;
    if (ogSite) return ogSite;
    const title = document.title || "";
    const sep = title.split(/[|·\-–—]/)[0].trim();
    return sep || null;
  });
}

// Common RIA / wealth-mgmt nav paths. We probe these because many sites
// hide them behind hover/click dropdown menus that our link scraper can't
// see. HEAD requests are cheap; we add anything that returns 2xx/3xx.
const KNOWN_PATHS = [
  // about
  "/about",
  "/about-us",
  "/our-firm",
  "/who-we-are",
  "/our-story",
  "/team",
  "/our-team",
  // services
  "/services",
  "/our-services",
  "/what-we-do",
  "/how-we-help",
  "/approach",
  "/process",
  // pricing
  "/pricing",
  "/fees",
  "/our-fees",
  // contact / start
  "/contact",
  "/contact-us",
  "/lets-chat",
  "/get-started",
  "/start",
  "/start-here",
  "/starthere",
  "/book-a-call",
  // content
  "/blog",
  "/insights",
  "/articles",
  "/news",
  "/press",
  "/resources",
  // platform-specific surfaces — useful for B2B / network competitors
  "/compliance",
  "/membership",
  "/pricing-plans",
];

// Discover URLs from the site's own sitemap.xml. This is the most reliable
// source — sitemaps are designed for crawlers and enumerate every page
// regardless of how the navigation UI hides them.
//
// Path:
//   1. Fetch /robots.txt, parse `Sitemap:` directives (one or many)
//   2. Fall back to /sitemap.xml and /sitemap_index.xml
//   3. For each sitemap URL: fetch XML, extract <loc> entries
//   4. If the sitemap is an index (contains <sitemap><loc>), recurse with
//      a hard depth and count cap
//   5. Filter to shallow URLs on the same origin (path depth ≤ 2)
//
// Returns same shape as discoverPages so pickPages can consume both.
async function discoverViaSitemap(base: URL): Promise<{ href: string; text: string }[]> {
  const origin = base.origin;
  const sitemapsToFetch = new Set<string>();
  const seen = new Set<string>();
  const out: { href: string; text: string }[] = [];

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/xml,application/xml,text/plain,*/*",
  };

  // Step 1 — robots.txt
  try {
    const r = await fetch(new URL("/robots.txt", origin).toString(), {
      headers,
      signal: AbortSignal.timeout(5_000),
    });
    if (r.ok) {
      const txt = await r.text();
      for (const m of txt.matchAll(/^\s*Sitemap:\s*(\S+)/gim)) {
        sitemapsToFetch.add(m[1].trim());
      }
    }
  } catch {
    /* robots.txt absent or unreachable */
  }

  // Step 2 — fall-back sitemap paths
  if (sitemapsToFetch.size === 0) {
    for (const p of ["/sitemap.xml", "/sitemap_index.xml", "/sitemap-index.xml"]) {
      sitemapsToFetch.add(new URL(p, origin).toString());
    }
  }

  // Step 3-4 — fetch each sitemap, recurse into indices, collect URLs
  const queue = [...sitemapsToFetch];
  let iterations = 0;
  const MAX_ITERATIONS = 5; // depth cap on index recursion
  const MAX_URLS = 300;

  while (queue.length > 0 && iterations < MAX_ITERATIONS && out.length < MAX_URLS) {
    const batch = queue.splice(0);
    const xmls = await Promise.all(
      batch.map(async (url) => {
        if (seen.has(url)) return null;
        seen.add(url);
        try {
          const r = await fetch(url, {
            headers,
            signal: AbortSignal.timeout(8_000),
            redirect: "follow",
          });
          if (!r.ok) return null;
          return await r.text();
        } catch {
          return null;
        }
      }),
    );

    for (const xml of xmls) {
      if (!xml) continue;
      const isIndex = /<sitemapindex[\s>]/i.test(xml);
      const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) =>
        m[1].trim(),
      );
      if (isIndex) {
        // Add nested sitemap URLs to the queue
        for (const loc of locs) {
          if (!seen.has(loc)) queue.push(loc);
        }
      } else {
        // urlset — these are page URLs
        for (const loc of locs) {
          if (out.length >= MAX_URLS) break;
          try {
            const u = new URL(loc);
            if (u.origin !== origin) continue;
            // Filter to shallow URLs — top-level structural pages, not
            // /blog/some-post-name-with-23-words. Path depth = count of
            // non-empty path segments.
            const pathDepth = u.pathname.split("/").filter(Boolean).length;
            if (pathDepth > 2) continue;
            // Anchor text approximated from final path segment for the
            // text-based picker fallback
            const seg = u.pathname.split("/").filter(Boolean).pop() ?? "";
            out.push({
              href: u.toString(),
              text: seg.replace(/[-_]/g, " "),
            });
          } catch {
            /* malformed URL */
          }
        }
      }
    }
    iterations++;
  }

  return out;
}

async function probeKnownPaths(base: URL): Promise<{ href: string; text: string }[]> {
  const out: { href: string; text: string }[] = [];
  const probes = KNOWN_PATHS.map(async (path) => {
    const target = new URL(path, base.origin).toString();
    try {
      const res = await fetch(target, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(4_000),
      });
      // 2xx = real page. 3xx is followed automatically; res.url may differ.
      if (res.ok && res.url) {
        // Only keep paths still on the same origin (some redirect off-site)
        if (new URL(res.url).origin === base.origin) {
          // Anchor text approximates the path's last segment, so the
          // text-fallback in pickPages still works as a sanity check.
          const seg = new URL(res.url).pathname.split("/").filter(Boolean).pop() ?? "";
          out.push({ href: res.url, text: seg.replace(/[-_]/g, " ") });
        }
      }
    } catch {
      /* probe failure is non-fatal */
    }
  });
  await Promise.all(probes);
  return out;
}

async function discoverPages(page: Page, base: URL) {
  return await page.evaluate((origin) => {
    const links: { href: string; text: string }[] = [];
    document.querySelectorAll("a[href]").forEach((a) => {
      try {
        const href = (a as HTMLAnchorElement).href;
        const u = new URL(href);
        if (u.origin !== origin) return;
        // textContent captures text inside hidden/dropdown nav items
        // (display:none, visibility:hidden) — innerText would return empty
        // for those and silently drop the link. Fall back to aria-label or
        // title attribute when the element has no text node at all (e.g.,
        // icon-only links).
        const rawText =
          (a as HTMLElement).textContent ||
          a.getAttribute("aria-label") ||
          a.getAttribute("title") ||
          "";
        const text = rawText.trim().replace(/\s+/g, " ");
        // Reject obviously-junk text: empty, or huge concatenated mega-menu
        // text that suggests the link wraps an entire submenu.
        if (!text || text.length > 80) return;
        links.push({ href: u.href, text });
      } catch {
        /* ignore */
      }
    });
    return links;
  }, base.origin);
}

function pickPages(
  candidates: { href: string; text: string }[],
  budget: number,
  sourceUrl: string,
): { kind: PageKind; url: string }[] {
  const sourceCanon = canonicalUrl(sourceUrl);
  const seenCanon = new Set<string>([sourceCanon]);

  // Pass 1: prefer matches by URL path (reliable)
  const picksByPath: Partial<
    Record<Exclude<PageKind, "home">, { kind: PageKind; url: string; pathScore: number }>
  > = {};
  for (const c of candidates) {
    let path: string;
    try {
      path = new URL(c.href).pathname;
    } catch {
      continue;
    }
    const canon = canonicalUrl(c.href);
    if (seenCanon.has(canon)) continue;
    for (const [kind, re] of Object.entries(PATH_HINTS) as [
      Exclude<PageKind, "home">,
      RegExp,
    ][]) {
      if (!re.test(path)) continue;
      // Score: prefer shorter paths (closer to top-level) — /about beats /resources/about/team
      const score = -path.split("/").filter(Boolean).length;
      const existing = picksByPath[kind];
      if (!existing || score > existing.pathScore) {
        picksByPath[kind] = { kind, url: c.href, pathScore: score };
      }
    }
  }
  for (const v of Object.values(picksByPath)) {
    if (v) seenCanon.add(canonicalUrl(v.url));
  }

  // Pass 2: text-based fallback for any slot still unfilled. Strict equality
  // on link text (case-insensitive), not substring — avoids picking up
  // "Learn about X" for the blog slot.
  const picksByText: Partial<Record<Exclude<PageKind, "home">, { kind: PageKind; url: string }>> =
    {};
  for (const c of candidates) {
    const canon = canonicalUrl(c.href);
    if (seenCanon.has(canon)) continue;
    const t = c.text.trim();
    if (!t) continue;
    for (const [kind, re] of Object.entries(TEXT_HINTS) as [
      Exclude<PageKind, "home">,
      RegExp,
    ][]) {
      if (picksByPath[kind] || picksByText[kind]) continue;
      if (re.test(t)) {
        picksByText[kind] = { kind, url: c.href };
        seenCanon.add(canon);
      }
    }
  }

  const priority: Exclude<PageKind, "home">[] = [
    "services",
    "about",
    "pricing",
    "blog",
    "contact",
  ];
  const out: { kind: PageKind; url: string }[] = [];
  for (const k of priority) {
    const pick = picksByPath[k] ?? picksByText[k];
    if (pick) out.push({ kind: pick.kind, url: pick.url });
    if (out.length >= budget) break;
  }
  return out;
}

function canonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    // Normalize trailing slash on path
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return url;
  }
}

async function ensureCompanyFactsStub(
  sourceDir: string,
  slug: string,
  name: string | null,
  url: string,
) {
  const filePath = join(sourceDir, "company_facts.json");

  // Always start from the template — but preserve any manual edits the user
  // already made to the `manual` block on re-runs.
  const tpl = join(ROOT, "Competitors", "_template", "Source_Data", "company_facts.json");
  let base: any = {};
  if (existsSync(tpl)) {
    base = JSON.parse(await readFile(tpl, "utf-8"));
  }

  let prevManual: any = null;
  let prevSecIapd: any = null;
  if (existsSync(filePath)) {
    try {
      const prev = JSON.parse(await readFile(filePath, "utf-8"));
      prevManual = prev?.manual ?? null;
      // IAPD data is auto-filled by tools/enrich-adv.ts, not by extract —
      // but extract owns this file, so we have to preserve it here on re-runs.
      prevSecIapd = prev?.auto_filled?.sec_iapd ?? null;
    } catch {
      /* fresh start */
    }
  }

  // Auto-fill from the captured homepage
  const auto = await mineAutoFacts(sourceDir, url);

  base.competitor = name ?? slug.replace(/_/g, " ");
  base.website = url;
  base.last_updated = new Date().toISOString().slice(0, 10);
  base.auto_filled = {
    _comment: base.auto_filled?._comment,
    ...auto,
    ...(prevSecIapd ? { sec_iapd: prevSecIapd } : {}),
  };
  base.manual = {
    ...base.manual,
    ...(prevManual ?? {}),
    adv_search_url:
      prevManual?.adv_search_url ??
      `https://adviserinfo.sec.gov/firm/search?query=${encodeURIComponent(
        (name ?? slug.replace(/_/g, " ")).split(/\s+/).slice(0, 4).join(" "),
      )}`,
  };

  await writeFile(filePath, JSON.stringify(base, null, 2));
}

async function mineAutoFacts(sourceDir: string, sourceUrl: string) {
  // Read all page JSONs and harvest social links from CTAs and emails/phones
  // from body text. Cheap, deterministic.
  const pagesDir = join(sourceDir, "pages");
  const social = {
    linkedin: null as string | null,
    twitter: null as string | null,
    facebook: null as string | null,
    youtube: null as string | null,
    instagram: null as string | null,
  };
  const emails = new Set<string>();
  const phones = new Set<string>();

  const socialMatchers: { key: keyof typeof social; re: RegExp }[] = [
    { key: "linkedin", re: /linkedin\.com\/(company|in|school)\/[^\s"'?#]+/i },
    { key: "twitter", re: /(twitter\.com|x\.com)\/[A-Za-z0-9_]+(?![A-Za-z0-9_])/i },
    { key: "facebook", re: /facebook\.com\/[^\s"'?#]+/i },
    { key: "youtube", re: /(youtube\.com\/(channel|user|@[^\s"'?#]+)|youtu\.be\/[^\s"'?#]+)/i },
    { key: "instagram", re: /instagram\.com\/[^\s"'?#]+/i },
  ];

  if (existsSync(pagesDir)) {
    const files = await readdir(pagesDir);
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      let data: any;
      try {
        data = JSON.parse(await readFile(join(pagesDir, f), "utf-8"));
      } catch {
        continue;
      }
      const haystacks: string[] = [];
      for (const cta of data?.ctas ?? []) {
        if (cta?.href) haystacks.push(cta.href);
      }
      if (data?.body_text) haystacks.push(data.body_text);

      for (const h of haystacks) {
        for (const { key, re } of socialMatchers) {
          if (social[key]) continue;
          const m = h.match(re);
          if (m) social[key] = m[0].startsWith("http") ? m[0] : `https://${m[0]}`;
        }
        const eMatches = h.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g);
        if (eMatches) for (const e of eMatches) emails.add(e);
        const pMatches = h.match(
          /(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
        );
        if (pMatches) for (const p of pMatches) phones.add(p);
      }
    }
  }

  return {
    social_links: social,
    footer_emails: [...emails].slice(0, 10),
    footer_phones: [...phones].slice(0, 10),
  };
}

async function dismissCommonOverlays(page: Page) {
  // Step 1 — try clicking the most common consent CTAs. Wait a beat first so
  // late-injected banners (most are) have a chance to mount.
  await page.waitForTimeout(800);

  const clickTargets = [
    'button:has-text("Accept all")',
    'button:has-text("Accept All")',
    'button:has-text("Accept")',
    'button:has-text("I Accept")',
    'button:has-text("Allow all")',
    'button:has-text("Allow All")',
    'button:has-text("I agree")',
    'button:has-text("Agree")',
    'button:has-text("Got it")',
    'button:has-text("OK")',
    'button:has-text("Close")',
    'a:has-text("Accept all")',
    '#onetrust-accept-btn-handler',
    '#truste-consent-button',
    '.cc-btn.cc-allow',
    '[aria-label="Close"]',
  ];
  for (const sel of clickTargets) {
    const el = page.locator(sel).first();
    if (await el.count().catch(() => 0)) {
      const clicked = await el
        .click({ timeout: 1_200 })
        .then(() => true)
        .catch(() => false);
      if (clicked) {
        await page.waitForTimeout(200);
      }
    }
  }

  // Step 2 — CSS injection fallback. Hides any cookie/consent banners and
  // common chat-widget overlays whether or not the click succeeded. Pure CSS,
  // doesn't depend on click handlers, robust to weird DOM structures.
  await page
    .addStyleTag({
      content: `
        /* Cookie / consent banners */
        [id*="cookie" i], [class*="cookie" i],
        [id*="consent" i], [class*="consent" i],
        [id*="gdpr" i], [class*="gdpr" i],
        [id*="onetrust" i], [class*="onetrust" i],
        [id*="truste" i], [class*="truste" i],
        [aria-label*="cookie" i], [aria-label*="consent" i],
        .cc-window, .cc-banner, #osano-cm-dialog,
        #CybotCookiebotDialog, #cookie-banner, #cookie-notice {
          display: none !important;
          visibility: hidden !important;
        }
        /* Common chat widgets that sit on top of CTAs */
        #intercom-container, .intercom-launcher,
        #drift-frame-chat, .drift-widget-message,
        #hubspot-messages-iframe-container,
        .crisp-client, #crisp-chatbox {
          display: none !important;
        }
        /* Re-enable scroll if the banner locked the body */
        html, body { overflow: auto !important; }
      `,
    })
    .catch(() => {});
}

async function autoScroll(page: Page) {
  // Trigger lazy-loaded content. Some platforms (Wix, Squarespace, many
  // marketing-site builders) grow document.scrollHeight as the user scrolls
  // — a fixed-distance scroll terminates before the bottom. So we keep
  // scrolling until scrollHeight stabilizes (3 stable measurements) or we
  // hit a hard cap.
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let lastHeight = 0;
      let stableCount = 0;
      let iterations = 0;
      const maxIterations = 60; // 60 * 250ms = 15s hard cap
      const id = setInterval(() => {
        window.scrollBy(0, 1200);
        iterations++;
        const currentHeight = document.body.scrollHeight;
        if (
          currentHeight === lastHeight &&
          window.scrollY + window.innerHeight >= currentHeight - 50
        ) {
          stableCount++;
        } else {
          stableCount = 0;
          lastHeight = currentHeight;
        }
        if (stableCount >= 3 || iterations >= maxIterations) {
          clearInterval(id);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 250);
    });
  });
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
}

function niceFileName(kind: PageKind): string {
  return {
    home: "Homepage",
    pricing: "Pricing",
    about: "About",
    services: "Services",
    contact: "Contact",
    blog: "Blog",
  }[kind];
}

// CLI entry
const isCli = import.meta.url === `file://${process.argv[1]}`;
if (isCli) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.slug || !args.url) {
    console.error("Usage: tsx tools/extract.ts --slug <Slug> --url <https://...>");
    process.exit(1);
  }
  extract({ slug: args.slug, url: args.url }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

function parseArgs(argv: string[]): { slug?: string; url?: string } {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      out[key] = val;
    }
  }
  return out;
}
