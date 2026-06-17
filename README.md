# Competitor Research

Research on our key competitors, organized so you can read as little or as much as you want.

## Start here

**What this is:** a folder of research on 48 financial-advisor competitors, plus our own brand voice files. Using Claude Code, you can ask questions about it in plain English — *"what do fee-only fiduciary firms say on their contact page?"*, *"draft a blog post in our voice based on what's in here"* — and Claude reads the folder and answers. No coding needed. Uses your existing Claude.ai subscription — no separate billing.

### What you need (one-time)

1. A **paid Claude.ai subscription** — Pro, Max, Team, or Enterprise (the same login you already use at claude.ai)
2. **Claude Code** installed on your computer — download from [claude.com/download](https://claude.com/download)
3. **Access to this repo** — send Karthik your GitHub username so he can add you as a collaborator

### Three steps to start chatting

**Step 1.** Open Claude Code on your computer. (On a Mac: open the Terminal app, type `claude`, hit enter. On Windows: open PowerShell, type `claude`, hit enter. Or open this folder in VS Code and click the Claude Code icon in the sidebar.)

**Step 2.** Download this folder. Paste these three lines into Claude Code one at a time:

```bash
git clone https://github.com/kpunati/Competitor_Profiles.git
cd Competitor_Profiles
claude
```

The first command downloads the folder to your computer. The second steps into it. The third starts Claude Code chatting from inside this folder, so it can read every file here.

**Step 3.** Ask a question. Copy any of these, paste into the chat, hit enter:

> *"Read every `1_Summary.md` in the `Competitors/` folder. Tell me the 5 firms most similar to USWM by methodology and voice — active investment management, fee-only fiduciary, tax-integrated, NJ-anchored. Format as a table with firm, AUM, primary positioning, and what's worth learning from each."*

> *"Draft a contact page for our firm. Look at how Brindle & Bay, Foundry Financial, and The Peak FP handle theirs, then write our version using `_context/brand_voice.md` for voice and avoiding everything in `_context/brand_what_not_to_make.md`. Cite which firms you drew from."*

> *"What do competitors charge for their services? Read every page tagged 'pricing' in `00_Market_Overview/pages_by_kind.json` and summarize the patterns you see. Recommend which approach fits our brand best."*

> *"Write a 500-word blog post titled 'Why trend-following beats market prediction.' In our voice per `_context/brand_voice.md`. End with a CTA to schedule a consultation."*

Claude writes a draft. Read it, edit it, copy it into wherever you need it (email, Google Doc, website).

**Want more prompts and a deeper walkthrough?** Open [`ONBOARDING.md`](ONBOARDING.md) — same flow, more examples, troubleshooting tips.

---

**Already comfortable with the catalog?** Jump straight to **`00_Market_Overview/Executive_Briefing.md`** for the headline findings, or **`00_Market_Overview/competitor_catalog.csv`** (Notion-importable) for structured metadata across all 48 firms.

## How this folder is organized

```
00_Market_Overview/         The big picture — read this first
  Executive_Briefing.md     2-page summary of everything we found
  Competitive_Landscape.md  Where each competitor sits in the market
  What_The_Market_Looks_Like.md   What's common, what's distinctive
  Where_We_Should_Play.md   Gaps and recommended direction
  Head_to_Head_Matrix.md    Auto-generated cross-competitor matrix + segment coverage + tag rollups
  competitor_catalog.csv    Notion-importable catalog of every competitor's structured metadata (45 columns)
  competitor_catalog.json   Same data as JSON for programmatic use
  pages_by_kind.json        Cross-catalog index: every captured page tagged by kind (home / about / contact / services / pricing / blog_post / …)

_context/                   Standing context — shapes every profile
  our_thesis.md             Who we serve, what edge we think we have
  industry_frame.md         Wealth-management category background
  taxonomy.md               Controlled vocabulary, threat-level rubric, regulatory-jurisdiction conventions, entity-type field applicability

Competitors/                One folder per competitor
  Acme_Co/
    1_Summary.md            One-page brief
    2_Full_Profile.md       Deep-dive analysis
    metadata.json           Structured data (type, threat, pricing model, segment scores, etc.)
    Screenshots/            Captured site screenshots
    Source_Data/            Raw research files (HTML, page JSON, design probe, IAPD facts, Form ADV PDF cache)
    Knowledge_From_Source/  Markdown-extracted competitor content (blog posts / articles) — present for Tier 1+2 firms.
                            Each post: YAML frontmatter + clean markdown body.
                            _index.json catalogs the per-firm corpus.

Summaries/                  Convenience mirror — every competitor's 1_Summary.md in one place
  summary_<slug>/           One folder per competitor, holding a copy of that firm's 1_Summary.md
                            (e.g. summary_Advize_Wealth/1_Summary.md)

tools/                      Scripts that produce the research (technical)
```

> **Keep summaries in sync.** `Summaries/summary_<slug>/1_Summary.md` is a **copy** of `Competitors/<slug>/1_Summary.md`. If you edit one, update the other so they don't drift. The canonical source is the one under `Competitors/`; the `Summaries/` copy exists only for quick cross-competitor reading.

## How to read a competitor

- Want a quick read? Open `1_Summary.md` in that competitor's folder. One page.
- Want the full picture? Open `2_Full_Profile.md`. Plain-language deep dive.
- Want to see their site? Open `Screenshots/`.
- Want to read their actual content? Open `Knowledge_From_Source/` (where present). Searchable markdown of their posts with title / author / date / tags in frontmatter.

## Catalog state

| | |
|---|---|
| Competitors profiled | **48** |
| Market-overview matrix columns | 45 |
| Knowledge_From_Source corpus | ~297 markdown posts across 18 firms |
| Site pages indexed by kind | 155 in `pages_by_kind.json` |
| Jurisdictions covered | US (primary) · CA (PWL) · UK (Dealmakers) · EU (Sven Carlin) |

## How this research was built

Each competitor's website is captured (screenshots, copy, design choices), combined with public company information — **Form ADV Part 1A** for SEC-registered RIAs (parsed automatically for AUM, advisor count, employee count, disciplinary disclosures), plus `/about`-page facts and named-team biographies — and analyzed against a consistent template. Every claim cites the evidence behind it. The analysis reads against a standing thesis and industry frame in `_context/`, so every profile is written through the same lens.

For competitors outside the US (Canadian / UK / EU), Form ADV fields are intentionally null and the `regulatory_jurisdiction` + `regulator` + `regulatory_note` fields explain what was captured instead. See `_context/taxonomy.md`.

For content-led competitors, the `tools/scrape-knowledge.ts` tool captures their published blog/article content into per-firm `Knowledge_From_Source/` corpora — separate from the site-shape capture in `Source_Data/`. The corpora are ready for downstream search, RAG, or content benchmarking.

This is a pre-launch positioning exercise — we are not in the market yet. The goal is to land on where to play and how to enter, informed by what's already working and what isn't.

## Keeping it fresh

Every profile carries a `next_review_by` date in its frontmatter and `metadata.json`. Default cadence is **180 days** for low-threat competitors and **90 days** for medium-high. High-threat competitors should use a shorter window (30-60 days), and stale-content competitors (blog cadence dropping below quarterly) can extend.

To run a refresh pass, follow `tools/refresh_prompt.md` — a standing instruction set you can hand to Claude Code (or any agent with file-system access). Today this is a manual quarterly trigger; see the roadmap below for the planned escalation.

## Roadmap

Planned tooling to support the catalog as it scales beyond ~50 competitors:

- **`tools/build-index.ts`** — walks every `Competitors/*/metadata.json` and emits a single `_index.json`. Today `tools/synthesize.ts` regenerates `competitor_catalog.{csv,json}` and `Head_to_Head_Matrix.md` from the same source; consider promoting the underlying read-and-merge into a shared helper.
- **`tools/refresh.ts`** — diff-aware refresh script that mechanically finds stale profiles, re-runs the data pipeline (extract → enrich → enrich-pdf → synthesize), produces a delta report, and only invokes an agent for the narrative-rewrite judgment step. The right end state for refresh — see Tier 3 in `tools/refresh_prompt.md`.
- **Scheduled refresh task** — wires `refresh_prompt.md` into a recurring scheduled task so the manual quarterly trigger becomes automatic. Stand up after the diff-aware script lands, otherwise it'll regenerate noise.
- **`tools/enrich-fca.ts` + `tools/enrich-companies-house.ts`** (Phase 2 — UK jurisdiction). Deferred until we have ≥2 UK firms in the catalog. Currently 1 (Dealmakers).
- **`tools/enrich-nrd.ts`** (Phase 3 — Canadian jurisdiction). Deferred until we have ≥2 Canadian firms. Currently 1 (PWL Capital).
- **`pickBestMatch` tightening in `tools/enrich-adv.ts`** — the current prefix-token-fuzz matcher has produced three false positives this catalog (Streamline → unrelated NY DBA umbrella, Asset Map → Sugar Maple Asset Management, Starke → Starkey & Associates). Fix is single-method: require exact whole-word token equality before claiming a confident match. Documented in each affected metadata file's `regulatory_note`.
- **Bot-protection fallback in `tools/extract.ts`** — `tools/scrape-knowledge.ts` already has a `fetch()` fallback when Playwright hits Cloudflare; the same pattern should be ported to `extract.ts` so the site-shape capture step doesn't write 403 challenge bodies as if they were real pages. ~10 of 48 firms in the catalog have triggered this (most recently Mercer Advisors and Carson Group).
- **`_context/findings_log.md`** — running log of refresh batches, taxonomy changes, and conclusions that shifted because of new data. The audit trail when a future analyst asks *"why did we change our mind about Focus Partners between Q2 and Q3?"*

## Status

- [x] Structure set up
- [x] First competitor captured and analyzed
- [x] Initial competitor set captured (30 firms)
- [x] Candidate-firm expansion batch (+18 firms → 48 total)
- [x] Knowledge corpus for Tier 1+2 content firms (`Knowledge_From_Source/`)
- [x] Market overview written (`00_Market_Overview/Executive_Briefing.md` + `Competitive_Landscape.md` + `What_The_Market_Looks_Like.md` + `Where_We_Should_Play.md` — first-draft synthesis from the 48-firm catalog, ready for your editorial pass)
- [ ] Internal direction recommended (the strategy docs propose a direction; your sign-off is the next step)
