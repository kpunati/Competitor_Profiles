# Competitors

One folder per competitor. Each folder contains:

- **`1_Summary.md`** — one-page brief, the quick read
- **`2_Full_Profile.md`** — the deep dive
- **`metadata.json`** — structured data behind the prose (competitor type, threat, pricing model, segment scores, positioning tags, vulnerabilities). This is what `tools/synthesize.ts` reads to build the cross-cutting matrix and the Notion-importable catalog.
- **`Screenshots/`** — what their site looks like
- **`Source_Data/`** — raw research files (ignorable for most readers)

The `_template/` folder holds the empty versions copied into each new competitor's folder. The schema for `metadata.json` is documented inline in that file's `_schema` block.

Folder names use the competitor's name with underscores instead of spaces (e.g. `Acme_Co`, `Beta_Inc`).
