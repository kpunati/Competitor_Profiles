# Tools

Scripts that produce the research. This folder is for whoever maintains the pipeline — most readers can ignore it.

## What's in here

- **`add.ts`** — one-shot CLI. Give it a URL, it does everything end-to-end (creates the folder, captures the site, enriches via IAPD, writes the profile).
- **`extract.ts`** — the deterministic capture step. Playwright. Visits the homepage + a few key sub-pages, takes screenshots, saves HTML, probes design (colors, fonts, primary button), writes structured JSON. Includes a known-paths probe, lazy-load handling, stealth headers for anti-bot sites, and graceful fallback for sites that don't fire `domcontentloaded`.
- **`enrich-adv.ts`** — looks up the competitor in the SEC's IAPD search API and fills the `auto_filled.sec_iapd` section of `company_facts.json` (legal name, CRD, SEC#, HQ, branch count, DBAs/affiliated brands, disciplinary disclosure flag, ADV PDF URL). No API key needed. Gracefully skips when no IAPD match (non-US-RIA competitors).
- **`enrich-adv-pdf.ts`** — downloads the firm's Form ADV PDF (URL stashed by `enrich-adv.ts`), parses Part 1A, and fills the structured numeric fields in `metadata.json`: `employee_count` (Item 5.A), `advisor_count` (Item 5.B.1), `aum_usd` + `aum_as_of` (Item 5.F.2.c, taken from the most recent filing date in the document), `team_size` bucket (re-graded against actual headcount). Also appends an "ADV snapshot" entry to `trajectory.notable_events` so the run is logged. PDFs cached locally in `Source_Data/adv_cache/`. Requires `metadata.json` to exist — skips gracefully and prints a hint if it doesn't yet.
- **`analyze.ts`** — the LLM step. Reads captured data + screenshots + standing context in `_context/`, calls Claude with prompt caching, writes `1_Summary.md` and `2_Full_Profile.md`. Requires `ANTHROPIC_API_KEY`. Optional — for the current single-user flow, profiles are written interactively in a Claude Code session instead.
- **`synthesize.ts`** — reads every competitor's `metadata.json` and produces:
  - `00_Market_Overview/competitor_catalog.csv` — Notion-import-ready
  - `00_Market_Overview/competitor_catalog.json` — full data dump
  - `00_Market_Overview/Head_to_Head_Matrix.md` — auto-populated cross-cutting matrix with segment-coverage tallies and tag rollups
  Re-run any time after adding a new profile. Overwrites only the three catalog files; hand-written prose in `00_Market_Overview/` is untouched.
- **`enrich.ts`** — placeholder for additional non-website data (traffic estimates, social follower counts, etc.). Not implemented; for wealth management, the public site + IAPD lookup covers what we need.

## One-time setup

```bash
npm install
npx playwright install chromium
export ANTHROPIC_API_KEY=sk-ant-...
```

## Adding a competitor

```bash
npx tsx tools/add.ts --url https://example.com
# or:
npx tsx tools/add.ts --url https://example.com --name "Example Wealth"
```

This creates `Competitors/Example/`, captures the site into `Source_Data/` + `Screenshots/`, and writes both markdown profiles. Open `1_Summary.md` for the quick read.

## Re-running pieces

Every step is independent and re-runnable:

```bash
npx tsx tools/extract.ts --slug Example --url https://example.com
npx tsx tools/enrich-adv.ts --slug Example --name "Example Wealth"
npx tsx tools/analyze.ts --slug Example
npx tsx tools/synthesize.ts            # regenerate the catalog + matrix
```

`add.ts` also accepts `--skip-extract`, `--skip-enrich`, `--skip-analyze`.

## After every new profile

Run `npx tsx tools/synthesize.ts` to refresh `00_Market_Overview/competitor_catalog.csv`, `competitor_catalog.json`, and `Head_to_Head_Matrix.md`. The CSV is built for direct import into a Notion database — each row is one competitor, multi-select fields use comma-separated values inside quoted cells.

## How a profile gets written

1. **Capture** — `extract.ts` opens the homepage, dismisses common overlays, auto-scrolls to trigger lazy loading, then:
   - Discovers up to 5 sub-pages from the homepage nav (services, pricing, about, blog, contact)
   - Saves desktop full-page + above-fold screenshots per page, plus a mobile homepage shot
   - Saves HTML and a structured JSON (title, meta, headings, CTAs, body text) per page
   - Probes design on the homepage: color palette, typography, primary button styling
   - Seeds `company_facts.json` with an SEC ADV search URL
2. **Analyze** — `analyze.ts` reads everything plus the standing context in `_context/`:
   - System prompt holds: thesis, industry frame, both templates (cached for prompt-cache hits across competitors)
   - User message holds: this competitor's captured data + 3–4 key screenshots
   - First call writes the deep dive (`2_Full_Profile.md`)
   - Second call writes the one-page summary (`1_Summary.md`), conditioned on the deep dive

## Why the analyzer outputs are good

The leverage comes from the standing context in `_context/`, not from the prompts in this script. If a profile reads generic, the fix is almost always to sharpen `_context/our_thesis.md` or `_context/industry_frame.md`, not to edit the scripts.
