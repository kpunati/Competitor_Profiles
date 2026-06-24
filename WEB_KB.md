# USWM Competitor KB — agent-facing web layer

A lean, **agent-first** view of the competitor catalog, deployed on Vercel. No
human UI by design — people read the markdown in the repo directly; this layer
exists so an **agent can locate and fetch catalog content over HTTP with the
fewest possible tokens**, without cloning the repo.

It is **read-only** over the catalog: the build script only *reads*
`Competitors/`, `00_Market_Overview/`, and `_context/`, and writes everything
under `public/` + `generated/` (both gitignored, rebuilt on every deploy).
Nothing in the source catalog or the `tools/` pipeline changes.

## How an agent uses it (token-efficient flow) — fully static, no API

Every URL the KB emits (in `llms.txt`, `index.json`, and the landing page) is an
**absolute** URL — agent fetchers commonly won't resolve or follow *relative*
links found in page content, which would strand an agent at the entry point. See
"Absolute URLs" below.

1. `GET /digest.json` — read **once**: a slim row per firm (slug, summary_line,
   type, threat, aum, jurisdiction, hasCorpus, postCount, sections, caveat).
   Many questions resolve here directly.
2. `GET /index.json` — **locate**: the full section map
   (`{firm,doc,heading,anchor,path,words,caveat}`); each row's `path`/`rawPath`
   is absolute. Filter it locally by firm, doc, or heading to find the section.
3. `GET <path>` — **fetch** only that section's markdown (smallest unit).

≈ under ~1K tokens per question vs. thousands to read whole files. No search
service to call — locating is a local filter over `/index.json`.

**Can't follow links at all?** Some fetchers only retrieve URLs the user pasted
directly. For them, `GET /brief.md` — one file that inlines the strategy
synthesis + positioning thesis, enough to answer gaps / openings / positioning.

## Endpoints

All endpoints are static files served at **absolute** URLs.

| Endpoint | Kind | Purpose |
|---|---|---|
| `/digest.json` | static | slim catalog, one-read overview |
| `/index.json` | static | full section map `{firm,doc,heading,anchor,path,words,caveat}` — `path`/`rawPath` absolute; filter locally to locate a section |
| `/brief.md` | static | strategy synthesis + positioning thesis inlined in one file (for link-averse fetchers) |
| `/sections/<firm>/<doc>/<anchor>.md` | static | one self-contained section |
| `/raw/<repo-path>` | static | verbatim source files |
| `/llms.txt` | static | agent onboarding manifest |

`doc` is `1_Summary`, `2_Full_Profile`, `knowledge/<basename>`, or a
market-overview / `_context` doc name. Firms `_market_overview` and `_context`
hold the cross-cutting and USWM-brand docs.

## Locating content (no search service)

There is no search API — locating is a **local filter over `/index.json`**, which
lists every section with its `firm`, `doc`, `heading`, `anchor`, and `path`. An
agent reads `/index.json` once and filters in-context by firm, document, or
heading to pick the section(s) to fetch. This keeps the whole KB static (no
functions, no cold starts, no per-query cost) and scales fine from 48 to 100+
firms. If keyword ranking is ever wanted later, it can be added without changing
the static contract.

## Absolute URLs (and link-averse fetchers)

Many agent fetchers refuse to resolve or follow links discovered in page content
(an anti-SSRF / anti-injection posture), and a stateless fetcher can't resolve a
root-relative `/path` without a base URL. So the build emits **absolute** URLs in
`llms.txt`, `index.json`, and the landing page. The base URL is resolved at build
time, in priority order:

1. `KB_BASE_URL` — explicit override (set this when the KB is served from a custom domain).
2. `VERCEL_PROJECT_PRODUCTION_URL` — auto-set by Vercel on every build (the `*.vercel.app` production domain). No config needed for the default deploy.
3. Neither set → paths stay relative (fine for local `npm run build`).

For the fetcher that won't follow *any* in-content link, `/brief.md` inlines the
high-value synthesis so one user-pasted URL answers the common questions. It is
scoped to the synthesis + thesis layer on purpose — inlining all 48 profiles
would be megabytes.

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
4. Environment variables: none required — Vercel's `VERCEL_PROJECT_PRODUCTION_URL`
   auto-populates the absolute base URL at build time. Set `KB_BASE_URL` only if
   you serve the KB from a custom domain.
5. Deploy. Pick an unlisted project name (e.g. `uswmcomp`) → URL like
   `uswmcomp.vercel.app`. `robots.txt` + `X-Robots-Tag: noindex` keep it
   out of search engines (public-but-unlisted posture).
6. Point teammates' agents at the base URL and `…/llms.txt`.

Every push to the repo's production branch triggers an automatic rebuild, so the
KB stays in sync with the catalog with no manual step.

> Note: an unlisted URL is not access control. To lock it down later, enable
> Vercel **Password Protection** (project setting) — no code change needed.
