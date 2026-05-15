---
competitor: Peak Financial Planning (thepeakfp.com)
website: https://www.thepeakfp.com/
competitor_type: wealth_mgmt_solo
threat_level: low
confidence: high
last_updated: 2026-05-15
next_review_by: 2026-11-11
review_cadence_days: 180
---

# Peak Financial Planning — Full Profile (Stub)

The substance for this firm is in [`1_Summary.md`](./1_Summary.md). This file preserves the schema convention and captures cross-references.

## Why this firm matters more than its size suggests

At $93M AUM, Peak FP is a small RIA — but it's the firm in our catalog whose **public-facing pricing-and-positioning execution** is the closest match to what we should ship at launch. Specifically:

- **Both pricing services published** (flat-fee planning + AUM wealth-management tier table)
- **Conversion mechanic published** ("if you upgrade at month 3, here's exactly what happens")
- **Form ADV link in the footer** as a transparency move
- **Sample financial plan link** that lets prospects see deliverables pre-purchase
- **YouTube channel + free webinar + content blog + podcast** as the audience-building stack
- **Single-segment ICP commitment** with a clear $1M+ assets gate
- **Growth velocity**: $0 → $93M in 4 years (founded 2022) is roughly $20–25M/yr net inflow — a useful comp for content-led, fee-transparent retail RIA growth

## Quick reference

| | |
|---|---|
| Legal name | Peak Financial Planning |
| CRD / SEC# | 317288 / 801-135890 |
| Founded | 2022 |
| Founder | Eric Amzalag, CFP®, RICP® (UC Santa Barbara economics + accounting BA) |
| Head Planner | Joseph Perez, CFP® (Cal State Northridge BS, 3-year tenure) |
| HQ | Woodland Hills, CA · serves clients virtually nationwide |
| AUM | $93,000,000 |
| Headcount | 7 employees, 4 advisors (Form ADV) |
| DRPs | 0 |
| Planning fee | $4,000 upfront + $1,000/mo × 4 = $8,000 baseline (range $5K–$12K per homepage) |
| Wealth mgmt fee tiers | 1.00% (<$1M) · 0.85% ($1M–$2M) · 0.75% ($2M–$10M) · 0.50% (>$10M) |
| ICP | Retirement Risk Zone, $1M+ retirement savings |
| YouTube | ~50,000 subscribers (founder's channel) |
| Free webinar | "The 4 Step System to Living Your Dream Retirement" |

## Captured pages

- [Homepage](./Source_Data/pages/home.html)
- [About](./Source_Data/pages/about.html)
- [Services](./Source_Data/pages/services.html)
- [Pricing](./Source_Data/pages/pricing.html) — **the artifact**
- [Blog](./Source_Data/pages/blog.html)
- [Contact](./Source_Data/pages/contact.html)

## Pipeline note

The initial enrich-adv pass returned no IAPD hits for the user-supplied name "The Peak FP." A second pass with the legal name "Peak Financial Planning" (visible on the site footer + About page) returned a clean 3/3 exact-token match against CRD 317288. **Lesson for the catalog**: when zero IAPD hits return, retry with the entity name discovered from the captured site (footer copyright, About page, Form ADV link target). Worth adding to `tools/enrich-adv.ts` as a fallback strategy.

**Confidence**: high. ADV data + site copy + leadership bios + pricing pages all captured cleanly.
