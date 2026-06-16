# Competitors

One folder per competitor. Each folder contains:

- **`1_Summary.md`** — one-page brief, the quick read
- **`2_Full_Profile.md`** — the deep dive
- **`metadata.json`** — structured data behind the prose (competitor type, threat level, regulatory jurisdiction, pricing model, segment-fit scores, positioning claims, vulnerabilities, tags). This is what `tools/synthesize.ts` reads to build the cross-cutting matrix and the Notion-importable catalog.
- **`Screenshots/`** — what their site looks like (full-page + above-fold + mobile homepage)
- **`Source_Data/`** — raw research files (HTML, page-level JSON, design probe, IAPD company facts, Form ADV PDF cache). Ignorable for most readers; the profile's claims cite back to here.
- **`Knowledge_From_Source/`** — *(present for Tier 1 + Tier 2 content-led firms)* — markdown corpus of the competitor's actual published blog/article content, captured by `tools/scrape-knowledge.ts`. One `.md` file per post with YAML frontmatter (title, url, author, date, captured, tags, word_count); `_index.json` indexes the corpus. Distinct from `Source_Data/` — site-shape vs. site-content.

The `_template/` folder holds the empty versions copied into each new competitor's folder. The schema for `metadata.json` is documented inline in that file's `_schema` block.

Folder names use the competitor's name with underscores instead of spaces (e.g. `Acme_Co`, `Beta_Inc`). When the brand name differs from the legal entity name (Money Guy → Abound Wealth Management, The Peak FP → Peak Financial Planning), the folder is named after the brand and the legal name is captured in `metadata.json` + the `regulatory_note`.

## Conventions worth knowing

- **Stub `2_Full_Profile.md`** is used when the firm's substance is fully covered in `1_Summary.md` (small firms, vendor adjacencies, brand-surface-not-business firms like Karlton Dennis). The stub keeps the schema consistent and points to the summary.
- **`related_competitors`** in `metadata.json` is the cross-link graph. Use it to navigate between firms in the same archetype (e.g., all retirement-focused-fiduciary RIAs link to each other).
- **Regulatory fields** (`sec_registered`, `crd_number`, `sec_number`, `disciplinary_disclosures`, `aum_usd`) apply to SEC-registered US RIAs. For non-RIA entities (content platforms, B2B SaaS, marketing agencies) and non-US jurisdictions (Canadian, UK, EU), these fields are intentionally `null` and the `regulatory_note` explains what was captured instead. See `_context/taxonomy.md`.
- **Knowledge_From_Source coverage** is uneven by design — captured for content-led firms where the corpus has analytical value (Tier 1 + Tier 2), skipped for vendor adjacencies (Asset Map, Starke, Couplr AI), stale sites (Roadmap Money), and firms with no blog on the main domain (Ritholtz Wealth, Karlton Dennis).
