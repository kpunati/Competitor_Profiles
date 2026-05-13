---
competitor: Starke (marketing agency)
website: https://wearestarke.com/
competitor_type: b2b_network
threat_level: low
confidence: medium
last_updated: 2026-05-13
next_review_by: 2026-11-09
review_cadence_days: 180
---

# Starke — Full Profile (Stub)

This URL is a category misfit — Starke is a Pasadena, CA marketing agency, not a wealth-management firm. Substance is in [`1_Summary.md`](./1_Summary.md).

## Quick reference

| | |
|---|---|
| Brand | Starke ("We Are Starke") |
| Type | Full-service marketing agency |
| Headquarters | Pasadena, CA (phone 626 area code) |
| Founded | "Nearly a decade" per copy — likely 2014–2016 |
| Services | Social Media Content · Social Ads · PPC · Web Design · Media Buying · Podcasts · Influencers · Television |
| Top-of-funnel content | "Marketing Simplified Podcast" |
| Named past partners | Sean Hannity · Dallas Mavericks · Gwyneth Paltrow · Newt Gingrich · Big Boy in The Neighborhood |
| Phone / Email | 626.209.1194 · info@wearestarke.com |
| Pricing | Not published |
| Regulatory | None (marketing agency) |

## Pipeline bug — third occurrence

`tools/enrich-adv.ts` pickBestMatch falsely matched "Starke" against "STARKEY & ASSOCIATES, INC." (CRD 116023, Evergreen CO) as a 1/1 confident match. Same root cause as the Asset Map and Streamline Planning false positives: **prefix-token-fuzz instead of whole-word equality**. The bogus ADV PDF was deleted; the IAPD block in `Source_Data/company_facts.json` was manually cleared.

## Captured pages

- [Homepage](./Source_Data/pages/home.html)
- [About](./Source_Data/pages/about.html)
- [Services](./Source_Data/pages/services.html)
- [Blog](./Source_Data/pages/blog.html)
- [Contact](./Source_Data/pages/contact.html)

**Confidence**: medium on the basic identification (Starke is unambiguously a marketing agency). Low on the deeper business detail (team, pricing, revenue, owner) — not published.
