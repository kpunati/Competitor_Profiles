---
competitor: Merit Financial Advisors
website: https://www.meritfinancialadvisors.com/
competitor_type: wealth_mgmt_traditional
threat_level: medium-high
confidence: high
last_updated: 2026-05-15
next_review_by: 2026-08-13
review_cadence_days: 90
---

# Merit Financial Advisors — Full Profile (Stub)

Substance is in [`1_Summary.md`](./1_Summary.md). This file preserves the schema convention.

## Quick reference

| | |
|---|---|
| Legal name (filing) | Merit Financial Group, LLC |
| Brand | Merit Financial Advisors |
| CRD / SEC# | 142457 / 801-67462 |
| Founded | 1998 by Rick Kent |
| HQ | Atlanta area (Alpharetta, GA per public records) |
| Main phone | 866-637-6949 |
| Regulatory AUM | $23,875,298,692 (Form ADV 2026-05-15) |
| Site-stated "assets served" | $24.69B ($17.86B advisory + $2.73B brokerage + $2.30B retirement plans + $1.80B ESOP) |
| Headcount | 470 employees (ADV) / 350+ team (site) |
| Advisors | 229 (ADV) |
| Offices | 55+ nationwide (site) |
| Households | 26,000+ (site) |
| DRPs | 0 |
| Pricing | "Structured tiered fee approach" / "sliding scale" — **no fee table published** |

## Leadership team (captured)

- **Rick Kent** — Founder & CEO ("servant-leadership philosophy")
- **Kay Lynn Mayhue** — President, Partner (M&A oversight)
- **Chrissy Lee** — COO
- **David Wahlen** — VP Strategic Partnerships (previously integrated 50+ firms since 2018 at prior employer; M&A growth-function owner)

## Service lines

1. Financial Planning
2. Wealth Management
3. **Life Transitions** — Retirement · Divorce · Career Transition · Widowhood
4. Insurance Planning
5. Business solutions — CPA Connect · Retirement Solutions for Employers · Business Succession
6. Tax Services

## Press / awards deck (current as of capture)

- **2025** InvestmentNews RIA Firm of the Year
- **2025** Forbes Top RIA Firms
- **2025** Barron's Top 100 Private Wealth Management
- **2024** Inc. 5000
- **2024** InvestmentNews Awards / Top Advisors
- **2023** Barron's Top 100 Private Wealth Management

Featured-in: U.S. News · WealthManagement.com · Bloomberg · MarketWatch · Kiplinger · WSJ · Yahoo Finance · CBS News

## Captured pages

- [Homepage](./Source_Data/pages/home.html) — captured the nginx 403 challenge body; substantive homepage content from WebFetch
- Leadership page (`/about/our-leadership-team/`) — WebFetch only
- About page (`/about/`) — WebFetch only

## Pipeline note

Playwright extract was bot-blocked by nginx 403 on the homepage; the substantive content was pulled via WebFetch. Same pattern we've seen on ~8 firms in the catalog. Bot-protection is now the default on serious wealth-management firm sites at scale. **Worth scheduling for the next tools/extract.ts iteration**: detect a 403/Cloudflare-challenge response → automatically fall back to a WebFetch-style retrieval (or at minimum, mark the captured pages as `bot_blocked: true` so the metadata stage knows to compensate with manual fetches).

## Open questions for next refresh

- PE backer / capital structure (inferred but not disclosed)
- Specific acquisitions over the past 4 years (referenced but not enumerated)
- Form ADV Part 1A Section 7 affiliate map (multiple legal entities expected)
- Eric / Connie / spouse-team relationships in the executive line (Kay Lynn Mayhue + others)
- Whether the "$24.69B assets served" vs $23.88B regulatory AUM gap holds steady or is widening

**Confidence**: high on the captured-site facts and ADV-pulled regulatory numbers. Medium on the M&A-history detail and capital-structure questions (not surfaced on captured pages).
