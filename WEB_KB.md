# USWM Competitor KB — agent-facing web layer

A lean, **agent-first** view of the competitor catalog, deployed on Vercel. No
human UI by design — people read the markdown in the repo directly; this layer
exists so an **agent can locate and fetch catalog content over HTTP with the
fewest possible tokens**, without cloning the repo.

It is **read-only** over the catalog: the build script only *reads*
`Competitors/`, `00_Market_Overview/`, and `_context/`, and writes everything
under `public/` + `generated/` (both gitignored, rebuilt on every deploy).
Nothing in the source catalog or the `tools/` pipeline changes.

## How an agent uses it (token-efficient flow)

1. `GET /digest.json` — read **once**: a slim row per firm (slug, summary_line,
   type, threat, aum, jurisdiction, hasCorpus, postCount, sections, caveat).
   Many questions resolve here with zero search.
2. `GET /api/search?q=<terms>&k=5` — **locate**: ranked section hits with a
   snippet + anchor + `sectionPath`. Read snippets, pick one.
3. `GET <sectionPath>` — **fetch** only that section's markdown (smallest unit).

≈ under ~1K tokens per question vs. thousands to read whole files.

## Endpoints

| Endpoint | Kind | Purpose |
|---|---|---|
| `/digest.json` | static | slim catalog, one-read overview |
| `/index.json` | static | full section map `{firm,doc,heading,anchor,path,words,caveat}` |
| `/api/search?q=&k=` | function | BM25 keyword search over sections → ranked hits |
| `/api/firms?type=&threat=&jurisdiction=&has_corpus=&q=` | function | structured catalog filter |
| `/sections/<firm>/<doc>/<anchor>.md` | static | one self-contained section |
| `/raw/<repo-path>` | static | verbatim source files |
| `/llms.txt` | static | agent onboarding manifest |

`doc` is `1_Summary`, `2_Full_Profile`, `knowledge/<basename>`, or a
market-overview / `_context` doc name. Firms `_market_overview` and `_context`
hold the cross-cutting and USWM-brand docs.

## Search

BM25 (MiniSearch) over **sections** (not whole files), field-boosted
firmName > heading > tags > body. Zero infra, no API key, no per-query cost;
ample headroom at 48 → 100+ firms. The build emits clean per-section text, so a
semantic/hybrid re-rank can be added later behind the same `/api/search`
contract without re-architecting.

## Local build

```bash
npm install
npm run build          # runs scripts/build-kb.ts → public/ + generated/
```

## Deploy to Vercel (one-time)

The app lives at the **repo root** — there is no subdirectory to select.

1. Vercel → **Add New Project** → import this repo.
2. Leave **Root Directory** as the default (`./`).
3. Framework preset = **Other**. Build command, output dir, and function
   `includeFiles` are already set in `vercel.json` — leave them.
4. No environment variables required.
5. Deploy. Pick an unlisted project name (e.g. `uswmcomp`) → URL like
   `uswmcomp.vercel.app`. `robots.txt` + `X-Robots-Tag: noindex` keep it
   out of search engines (public-but-unlisted posture).
6. Point teammates' agents at the base URL and `…/llms.txt`.

Every push to the repo's production branch triggers an automatic rebuild, so the
KB stays in sync with the catalog with no manual step.

> Note: an unlisted URL is not access control. To lock it down later, enable
> Vercel **Password Protection** (project setting) — no code change needed.
