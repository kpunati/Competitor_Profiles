# Competitor Research

Research on our key competitors, organized so you can read as little or as much as you want.

## Start here

**`00_Market_Overview/Executive_Briefing.md`** — the headline findings in two pages. If you read nothing else, read this.

## How this folder is organized

```
00_Market_Overview/         The big picture — read this first
  Executive_Briefing.md     2-page summary of everything we found
  Competitive_Landscape.md  Where each competitor sits in the market
  What_The_Market_Looks_Like.md   What's common, what's distinctive
  Where_We_Should_Play.md   Gaps and recommended direction
  Head_to_Head_Matrix.md    Auto-generated cross-competitor matrix + segment coverage + tag rollups
  competitor_catalog.csv    Notion-importable catalog of every competitor's structured metadata
  competitor_catalog.json   Same data as JSON for programmatic use

_context/                   Standing context — shapes every profile
  our_thesis.md             Who we serve, what edge we think we have
  industry_frame.md         Wealth-management category background
  taxonomy.md               Controlled vocabulary, threat rubric, entity-type field applicability

Competitors/                One folder per competitor
  Acme_Co/
    1_Summary.md            One-page brief
    2_Full_Profile.md       Deep-dive analysis
    metadata.json           Structured data (type, threat, pricing model, segment scores, etc.)
    Screenshots/            Captured site screenshots
    Source_Data/            Raw research files (HTML, page JSON, design probe, IAPD facts)

tools/                      Scripts that produce the research (technical)
```

## How to read a competitor

- Want a quick read? Open `1_Summary.md` in that competitor's folder. One page.
- Want the full picture? Open `2_Full_Profile.md`. Plain-language deep dive.
- Want to see their site? Open `Screenshots/`.

## How this research was built

Each competitor's website is captured (screenshots, copy, design choices), combined with public company information (Form ADV filings for SEC-registered advisors, plus `/about` page facts), and analyzed against a consistent template. Every claim cites the evidence behind it. The analysis reads against a standing thesis and industry frame in `_context/`, so every profile is written through the same lens.

This is a pre-launch positioning exercise — we are not in the market yet. The goal is to land on where to play and how to enter, informed by what's already working and what isn't.

## Keeping it fresh

Every profile carries a `next_review_by` date in its frontmatter and `metadata.json`. Default cadence is **90 days**; high-threat competitors should use a shorter window (30-60 days), watch-only entries can use longer (180+).

To run a refresh pass, follow `tools/refresh_prompt.md` — a standing instruction set you can hand to Claude Code (or any agent with file-system access). Today this is a manual quarterly trigger; see the roadmap below for the planned escalation.

## Roadmap

Planned tooling to support the catalog as it scales beyond ~15-20 competitors:

- **`tools/build-index.ts`** — walks every `Competitors/*/metadata.json` and emits a single `_index.json` (and regenerates `competitor_catalog.csv` / `competitor_catalog.json`). This is the queryable knowledge-base layer — *"show me every PE-backed RIA with AUM under $5B that markets fee-only and has a disciplinary disclosure"* runs against the index, not the markdown.
- **Auto-regenerated `00_Market_Overview/Head_to_Head_Matrix.md`** — generated from the index, not hand-maintained. Hand-maintained matrices drift the moment any profile updates.
- **`tools/refresh.ts`** — diff-aware refresh script that mechanically finds stale profiles, re-runs the data pipeline, produces a delta report, and only invokes an agent for the narrative-rewrite judgement step. The right end state for refresh — see Tier 3 in `tools/refresh_prompt.md`.
- **Scheduled refresh task** — wires `refresh_prompt.md` into a recurring scheduled task so the manual quarterly trigger becomes automatic. Stand up after the diff-aware script lands, otherwise it'll regenerate noise.
- **`_context/findings_log.md`** — running log of refresh batches, taxonomy changes, and conclusions that shifted because of new data. The audit trail when a future analyst asks "why did we change our mind about Focus Partners between Q2 and Q3?"

## Status

- [x] Structure set up
- [ ] First competitor captured and analyzed
- [ ] Full competitor set captured
- [ ] Market overview written
- [ ] Internal direction recommended
