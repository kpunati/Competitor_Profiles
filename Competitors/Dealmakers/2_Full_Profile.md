---
competitor: Dealmakers (Jonathan Jay)
website: https://dealmakers.co.uk/
competitor_type: finance_coach
threat_level: low
confidence: low
last_updated: 2026-05-13
next_review_by: 2026-11-09
review_cadence_days: 180
---

# Dealmakers — Full Profile (Stub)

The substance for this firm lives in [`1_Summary.md`](./1_Summary.md). This stub preserves the schema convention and captures cross-references.

## Why a stub

- **Captured surface is thin.** Bot-protected; Playwright extract returned HTTP 403; WebFetch fallback got the homepage but not the subpages.
- **Product-ladder substance lives in non-crawlable surfaces** (3-day live event, mastermind cohort, YouTube videos, podcasts). The website's role is lead capture; the product is delivered elsewhere.
- **First UK firm in the catalog** — most of the cross-cutting analytical value is in the *jurisdiction-handling exercise*, captured fully in `1_Summary.md` and the metadata `regulatory_note`.

## Key facts

| | |
|---|---|
| Brand | Dealmakers |
| Principal | Jonathan Jay |
| Headquarters | 42 Lytton Road, Barnet, Hertfordshire EN5 5BY, UK |
| Hero (verbatim) | "Buy a profitable business without using your own cash" |
| Track-record claim | "Jonathan Jay has bought and sold more than 70 businesses over 25 years" · "shown more than 13,000 dealmakers how to buy a business" |
| Audience claims | 1.7M YouTube views · 228 published videos · 188,000 hours watched · 270 podcast episodes |
| Product ladder | Free Toolkit → 2 podcasts + YouTube → FastTrack (3-day live event) → Mastermind Programme 2026 → Inner Circle (invitation-only) → Deal Club Members |
| Pricing | Fully gated |
| Regulatory | No FCA authorization (correctly — coaching/education, not regulated investment advice) |
| Phase-2 enrichment | Deferred — Companies House lookup not yet built |

## Pages we looked at

- [Homepage](./Source_Data/pages/home.html) — captured the 403 challenge body; substantive content captured via WebFetch fallback.
- About page at `/about-jonathan-jay/` returned 404 via WebFetch — about content lives elsewhere on the site at an undiscovered URL.

## Jurisdiction-handling note

This is the **first UK firm** in the catalog and the first real exercise of the Phase-1 jurisdiction-aware schema fields (`regulatory_jurisdiction: UK`, `regulator: none`, `regulatory_note` populated with FCA-perimeter reasoning).

**Phase-2 trigger**: per the previously agreed plan, the Companies House + FCA enrichment pipeline (`tools/enrich-companies-house.ts`, `tools/enrich-fca.ts`) gets built once we have ≥2 UK firms in the catalog. Dealmakers contributes the first.

**Confidence**: low — bot-protected surface, audience claims are self-reported, no third-party verification of track record.
