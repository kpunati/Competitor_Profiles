# Web catalog — agent-first static site

A static, **agent-first** version of this catalog so teammates and AI agents can use it
over a URL instead of cloning the repo. Generated from the catalog files by
`tools/build-web.ts` — no database, no backend.

## What it produces

`npm run build:web` writes `./web/` (git-ignored, rebuilt on every deploy):

| Path | For | What |
|---|---|---|
| `/llms.txt` | **agents** | Index of every doc with one-line descriptions + URLs. Point an agent here first. |
| `/manifest.json` | agents / viewer | Machine-readable file tree (path, title, type, size). |
| `/Competitors/<Firm>/…`, `/00_Market_Overview/…`, `/_context/…` | both | The raw `.md` / `.json` / `.csv`, served at stable URLs. |
| `/` (index.html) | **humans** | File-tree browser with filter + rendered Markdown. |
| `/robots.txt` | crawlers | Currently `Disallow: /` (see indexing note below). |

Screenshots, PDFs, and raw HTML captures are intentionally excluded — only the text
corpus agents reason over is published (~12 MB).

## Pointing an agent at it

> Use the catalog at `https://<your-deploy>.vercel.app`. Start with
> `/llms.txt` for the index, then fetch the specific `.md`/`.json` paths you need.

## Deploy on Vercel

The repo root `vercel.json` already wires this up:
- **Build command:** `npx tsx tools/build-web.ts`
- **Output directory:** `web`
- CORS (`Access-Control-Allow-Origin: *`) so agents/browsers can fetch cross-origin.

Steps:
1. Import the repo in Vercel (or `vercel` CLI from the repo root).
2. Deploy. Vercel runs the build command and serves `web/`.

Local preview: `npm run build:web && npx serve web`.

## Two knobs

- **Search-engine indexing** — off by default. To allow it, set `ALLOW_INDEXING = true`
  near the top of `tools/build-web.ts` and rebuild (regenerates `robots.txt`).
- **Access control** — this deploy is **public**. To gate it, enable Vercel password
  protection (Project → Settings → Deployment Protection) or front it with an auth
  provider. Nothing in the build needs to change.

## Keeping it fresh

The site is regenerated from the catalog at build time, so every Vercel deploy reflects
the latest committed content. After catalog changes (`tools/synthesize.ts`), just push —
Vercel rebuilds.
