# Tools

Scripts that produce the research. This folder is for whoever maintains the pipeline — most readers can ignore it.

## What's in here

- **`add.ts`** — one-shot CLI. Give it a URL, it does everything end-to-end (creates the folder, captures the site, enriches via IAPD, parses Form ADV, optionally invokes the LLM analyzer).
- **`extract.ts`** — the deterministic capture step. Playwright. Visits the homepage + a few key sub-pages, takes screenshots, saves HTML, probes design (colors, fonts, primary button), writes structured JSON. Includes a sitemap-based discovery layer, known-paths probe, lazy-load handling, stealth headers for anti-bot sites, soft-404 detection (rejects pages that look like 404 templates), and graceful fallback for sites that don't fire `domcontentloaded`. **Known gap**: when a homepage returns a Cloudflare interstitial / nginx 403, this tool still writes the challenge body as if it were a real page. Worth porting the `fetch()` fallback from `scrape-knowledge.ts`.
- **`enrich-adv.ts`** — looks up the competitor in the SEC's IAPD search API and fills the `auto_filled.sec_iapd` section of `company_facts.json` (legal name, CRD, SEC#, HQ, branch count, DBAs / affiliated brands, disciplinary disclosure flag, ADV PDF URL, registration status). No API key needed. Gracefully skips when no IAPD match (non-US-RIA competitors). **Known bug**: `pickBestMatch` uses prefix-token-fuzz which has produced three false positives in this catalog (Streamline → unrelated NY DBA umbrella, Asset Map → Sugar Maple Asset Management, Starke → Starkey & Associates). Each affected metadata file's `regulatory_note` documents the false positive + manual cleanup. Fix is one method: require exact whole-word token equality before claiming a confident match.
- **`enrich-adv-pdf.ts`** — downloads the firm's Form ADV PDF (URL stashed by `enrich-adv.ts`), parses Part 1A, and fills the structured numeric fields in `metadata.json`: `employee_count` (Item 5.A), `advisor_count` (Item 5.B.1), `aum_usd` + `aum_as_of` (Item 5.F.2.c, taken from the most recent filing date in the document), `team_size` bucket (re-graded against actual headcount), `disciplinary_disclosure_count` (aligned with IAPD's boolean — false → 0, true → null if not detected, true → positive count if detected). Also appends an "ADV snapshot" entry to `trajectory.notable_events` so the run is logged. PDFs cached locally in `Source_Data/adv_cache/`. Requires `metadata.json` to exist — skips gracefully and prints a hint if it doesn't yet.
- **`scrape-knowledge.ts`** — **NEW**. Deep crawler that builds a per-firm corpus of the competitor's actual published content (blog posts / articles). Distinct from `extract.ts` (which captures site-shape pages, 5-6 per firm). Reads `Source_Data/pages/blog.json` to find the blog URL, harvests post URLs with Playwright + auto-scroll (falls back to plain `fetch()` if Cloudflare-blocked), then per post: tries Playwright → falls back to `fetch()` on 403/challenge → JSDOM + Mozilla Readability extracts article body → Turndown converts to markdown → file write with YAML frontmatter. Maintains `Knowledge_From_Source/_index.json` per firm. Resume-safe (skips URLs already in `_index.json`). See *Building a knowledge corpus* below.
- **`analyze.ts`** — the LLM step. Reads captured data + screenshots + standing context in `_context/`, calls Claude with prompt caching, writes `1_Summary.md` and `2_Full_Profile.md`. Requires `ANTHROPIC_API_KEY`. Optional — for the current single-user flow, profiles are typically written interactively in a Claude Code session instead, using the catalog's existing profiles as the style reference.
- **`synthesize.ts`** — reads every competitor's `metadata.json` and produces:
  - `00_Market_Overview/competitor_catalog.csv` — Notion-import-ready (45 columns)
  - `00_Market_Overview/competitor_catalog.json` — full data dump for programmatic use
  - `00_Market_Overview/Head_to_Head_Matrix.md` — auto-populated cross-cutting matrix with segment-coverage tallies, jurisdiction breakdowns, and tag rollups

  Re-run any time after adding a new profile. Overwrites only the three catalog files; hand-written prose in `00_Market_Overview/` is untouched.
- **`build-page-index.ts`** — walks every `Competitors/*/Source_Data/pages/*.json` and every `Competitors/*/Knowledge_From_Source/_index.json`, then emits `00_Market_Overview/pages_by_kind.json` — the canonical "what kinds of pages exist across the catalog" index. Site pages are classified by `extract.ts`'s existing `kind` field (`home` / `about` / `contact` / `services` / `pricing` / `blog` → `blog_index` / `compliance` / `starthere`); blog posts come from each firm's `_index.json` and are tagged `blog_post`. Output is grouped by kind (`kind.contact`, `kind.services`, …) and by firm (`by_firm.Foundry_Financial.contact = 1`). This index is the input list for the planned semantic embedder and for any "show me every contact page" query — no folder walking needed.
- **`enrich.ts`** — placeholder for additional non-website data (traffic estimates, social follower counts, etc.). Not implemented; for wealth management, the public site + IAPD lookup covers what we need.

## One-time setup

```bash
npm install
npx playwright install chromium
export ANTHROPIC_API_KEY=sk-ant-...   # only needed for analyze.ts
```

## Adding a competitor

```bash
npx tsx tools/add.ts --url https://example.com
# or with explicit name (better for firms where domain ≠ brand name):
npx tsx tools/add.ts --url https://example.com --name "Example Wealth"
# skip the LLM-analyzer step (default in the single-user flow):
npx tsx tools/add.ts --url https://example.com --skip-analyze
```

This creates `Competitors/Example/`, captures the site into `Source_Data/` + `Screenshots/`, runs the IAPD lookup, pulls + parses the Form ADV PDF if matched. Profile markdown is then written interactively in a Claude Code session (using the existing 30 profiles as style references).

## Re-running pieces

Every step is independent and re-runnable:

```bash
npx tsx tools/extract.ts --slug Example --url https://example.com
npx tsx tools/enrich-adv.ts --slug Example --name "Example Wealth"
npx tsx tools/enrich-adv-pdf.ts --slug Example
npx tsx tools/scrape-knowledge.ts --slug Example --limit 30
npx tsx tools/analyze.ts --slug Example     # optional LLM step
npx tsx tools/synthesize.ts                  # regenerate the catalog + matrix
```

`add.ts` also accepts `--skip-extract`, `--skip-enrich`, `--skip-enrich-pdf`, `--skip-analyze`.

**IAPD lookup pro tip**: if `enrich-adv.ts` returns no hits with the user-supplied `--name`, retry with the legal entity name from the captured About page or footer. The brand name on a site often diverges from the legal name in IAPD. This happened for Money Guy → Abound Wealth Management, Brindle & Bay → Brindle & Bay Financial Advisors LLC, The Peak FP → Peak Financial Planning.

## Building a knowledge corpus

After a competitor has been captured + has a `Source_Data/pages/blog.json`, run:

```bash
npx tsx tools/scrape-knowledge.ts --slug Example --limit 30
```

Output goes to `Competitors/Example/Knowledge_From_Source/` as:

```
_index.json                              corpus index (URL → file → title → date → word count → tags)
YYYY-MM-DD_post-slug_abcdef.md           one file per post, with YAML frontmatter
```

CLI flags:

- `--slug <slug>` — required
- `--limit <N>` — max posts to capture (default 30)
- `--blog-url <url>` — override the blog URL if the auto-detected one is wrong (e.g. `extract.ts` captured a single post as "blog")
- `--delay-ms <ms>` — delay between per-post requests (default 3000)
- `--timeout-ms <ms>` — per-page timeout (default 30000)

**Tier scope** (for the current catalog rollout):

- **Tier 1 done** (11 firms, ~167 posts): Foundry Financial, PWL Capital, Money Guy, Peak FP, Brindle & Bay, ClearValue Investing, Streamline Planning, Sven Carlin, Afford Anything, KDA Inc, Tax Alchemy
- **Tier 1 skipped**: Kitces (Cloudflare 403 to plain fetch), Ritholtz Wealth (content lives on `thecompoundnews.com` + author sites — would need separate catalog entries), Karlton Dennis (his site has no blog — pure lead-funnel into Tax Alchemy)
- **Tier 2 done** (5 firms, ~107 posts): Walser, Advize, Focus Partners, XYPN, Intrepid
- **Tier 2 skipped**: Samo Financial (100% Cloudflare bot-challenge pages — captured 11 but all were the verification interstitial), Couplr AI (Cloudflare 403 to plain fetch — same as Kitces)
- **Skip permanently**: Asset Map, Starke, Roadmap Money (stale), Heritage WP (3 posts visible), Dealmakers (UK; no sitemap + bot-blocked), Synergy Private, Peoples Capital, Merit Financial (announcements not articles)

**Corpus quality footnotes**:
- *Advize Wealth*: titles often capture the footer address widget ("429 S. Main Street / Rochester, MI 48307") instead of the real article title because the Wix template positions the address widget high in the DOM. Bodies are real; titles are misleading. Worth a future title-extractor pass.
- *Focus Partners*: 7 of 30 captures share the title "Two-Minute Market Focus" — these are real episodic content with templated titles, not duplicates.
- *Money Guy*: ~half the corpus is calculator/PDF-download landing pages, not articles. The `--blog-url` we used (`/resources/`) is the resource index, not the article index. Future improvement: re-run with `--blog-url https://moneyguy.com/articles/` once that URL is confirmed.
- *PWL Capital*: their main domain doesn't have a blog (content lives at `rationalreminder.ca` + YouTube). The 11 captures are mostly service pages, not articles. Same fix path as Money Guy: external content surface needs its own catalog entry.

## After every new profile

```bash
npx tsx tools/synthesize.ts        # refresh catalog.csv + catalog.json + Head_to_Head_Matrix.md
npx tsx tools/build-page-index.ts  # refresh pages_by_kind.json
```

The CSV is built for direct import into a Notion database — each row is one competitor, multi-select fields use comma-separated values inside quoted cells. The page index drives any cross-cutting "show me every X page" query and feeds the planned semantic embedder.

## How a profile gets written

1. **Capture** — `extract.ts` opens the homepage, dismisses common overlays, auto-scrolls to trigger lazy loading, then:
   - Discovers up to 5 sub-pages via robots.txt + sitemap.xml first, then nav-based fallback, then known-paths probe
   - Saves desktop full-page + above-fold screenshots per page, plus a mobile homepage shot
   - Saves HTML and a structured JSON (title, meta, headings, CTAs, body text) per page
   - Probes design on the homepage: color palette, typography, primary button styling
   - Seeds `company_facts.json` with an SEC ADV search URL
2. **Enrich** — `enrich-adv.ts` searches IAPD by firm name and writes the matched record into `company_facts.json`. `enrich-adv-pdf.ts` then downloads the Form ADV PDF and parses Part 1A into `metadata.json`.
3. **Analyze** — Profile markdown (`1_Summary.md` + `2_Full_Profile.md`) is written interactively in a Claude Code session, using the standing context in `_context/` and the existing 30 profiles as the style reference. `analyze.ts` exists as the automated alternative but is not currently the primary flow.
4. **Synthesize** — `synthesize.ts` regenerates the cross-cutting matrix and the Notion-importable catalog.
5. **(Optional) Scrape knowledge** — `scrape-knowledge.ts` builds the content corpus per firm. Run as a separate step on content-led firms; skip for vendor adjacencies and stale sites.

## Why the analyzer outputs are good

The leverage comes from the standing context in `_context/`, not from the prompts in `analyze.ts`. If a profile reads generic, the fix is almost always to sharpen `_context/our_thesis.md` or `_context/industry_frame.md`, not to edit the scripts. Same principle applies to interactive profile-writing in Claude Code sessions: keep the context files sharp, the profiles follow.
