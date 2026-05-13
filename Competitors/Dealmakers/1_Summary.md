---
competitor: Dealmakers (Jonathan Jay)
website: https://dealmakers.co.uk/
competitor_type: finance_coach
threat_level: low
last_updated: 2026-05-13
next_review_by: 2026-11-09
review_cadence_days: 180
---

# Dealmakers — Summary

> **First UK firm in the catalog.** UK business-acquisition coaching and community led by **Jonathan Jay** — teaching entrepreneurs to "buy a profitable business without using your own cash." Multi-product ladder (FastTrack 3-day live event · Mastermind Programme 2026 · Inner Circle invitation-only · free Toolkit · two podcasts · YouTube channel with **1.7M views over 228 videos** and **188,000 hours watched**) selling to UK and international would-be small-business acquirers. **Not a wealth manager.** Sits adjacent to our category in the "financial independence via owning a business instead of investing in markets" content space.

## The headline

Dealmakers is the **UK version of a category we've seen on the US side** in our catalog ([Karlton_Dennis](../Karlton_Dennis/1_Summary.md) on tax, [ClearValue_Investing](../Clearvalue_Investing/1_Summary.md) on stocks): a personality-led content brand with a multi-product price ladder converging on a premium inner-circle membership. The category is *self-directed financial independence through expert content* — and the prospect who joins Dealmakers is choosing "buy a small UK business with seller-financing" as their wealth-building thesis instead of "save into an ISA / SIPP and let markets compound." That's the threat profile to our retail RIA: the audience overlap is real but the *decision tree is different.* A 40-year-old prospect comparing Dealmakers vs. our RIA is making a buy-vs-allocate choice, not a wealth-manager-vs-wealth-manager choice. Threat is **low** — but worth noting as the first UK content-brand in the catalog and as a structural reference for what mainstream UK "alternative wealth-building" looks like.

Also notable: this is our **first exercise of the Phase-1 jurisdiction-aware schema fields** in a real UK context. The `regulatory_jurisdiction: UK`, `regulator: none`, and `regulatory_note` fields populate correctly. The downstream enrichment pipeline (Companies House lookup, FCA permission check) is still deferred — per the previously agreed plan, Phase 2 enrichers get built once we have ≥2 UK firms in the catalog.

## Who they are

- **Founded**: Not stated; Jonathan Jay claims "more than 70 businesses bought and sold over 25 years," so the personal career spans the mid-1990s onward — the Dealmakers brand itself is likely a 2010s–2020s creation
- **Size**: Founder-led around Jonathan Jay. No team page captured (bot-protected). Team headcount not published.
- **Where they're based**: 42 Lytton Road, Barnet, Hertfordshire EN5 5BY, UK (a residential street in North London — a typical UK private-limited-company registered-office structure where the registered address is the founder's home or accountant's office)
- **How they're funded**: Founder-owned UK limited company; no external capital visible
- **Regulatory**: **No FCA authorization required.** Dealmakers sells coaching, training, community access, and content — not regulated investment advice. The FCA's perimeter guidance is clear that pure business-skills education sits outside the Financial Services and Markets Act 2000 §22 regulated-activities perimeter. We did not pull a Companies House filing this refresh (Phase 2 enricher not yet built).
- **Audience metrics**: 1.7M YouTube views across 228 videos, 188,000 hours watched, 270 podcast episodes, "more than 13,000 dealmakers" shown how to buy a business (per site copy — these are aggregate claims, not third-party-verified)

## What they sell, to whom

A **classic creator-economy multi-tier coaching ladder**, with the Jay personal brand as the top of funnel:

| Surface | Product type | Pricing |
|---|---|---|
| Free Business-Buying Toolkit | Lead magnet | Free (email opt-in) |
| Business Buying Strategies Podcast · 10 Minute Deals Podcast | Top-of-funnel content | Free |
| YouTube channel (228+ videos) | Top-of-funnel content | Free |
| FastTrack — Live 3 Day Event | Mid-tier paid event | Not published on captured pages |
| Mastermind Programme 2026 | High-tier annual coaching | Not published |
| Inner Circle | Top-tier coaching community | Invitation-only |
| Deal Club Members | Community membership | Not published |

**Target customer**: UK and international entrepreneurs who want to buy a profitable existing business (typically £100K–£5M revenue) using seller-financing, vendor-loans, or earn-outs — rather than building from scratch or investing passively. The persona is broadly the "buyer of operating SMBs" — corporate refugees in their 40s and 50s, serial entrepreneurs, financial independence seekers who prefer ownership over allocation.

## How big a threat

**Low.** Four-axis rubric: **Reach 2** (real audience — 1.7M YouTube views and 13,000 students are non-trivial in the UK SMB-acquisition niche; mainstream-press footprint not captured), **Segment overlap 1** (no overlap with early-adult first-investors; weak overlap with our 40-50 segment because the same prospect who *could* hire us is sometimes choosing Dealmakers instead, but the decision is buy-a-business vs. allocate, not advisor-vs-advisor), **Momentum 2** (active programme cadence with named 2026 mastermind cohort and recently published "2026" branding), **Capital backing 1** (founder-owned UK limited) → sum **6 → low** (boundary).

## What they're doing well (worth studying)

- **A real multi-product ladder.** Free toolkit → podcasts → YouTube → live event → mastermind → invitation-only inner circle. Each tier is a separate product with its own conversion logic. Compare to the Dennis-family stack ([Karlton_Dennis](../Karlton_Dennis/1_Summary.md) free content → [Tax_Alchemy](../Tax_Alchemy/1_Summary.md) $20K–$150K → [Synergy_Private](../Synergy_Private/1_Summary.md) invitation-only) which mirrors this exact architecture on the US tax-strategy side.
- **A specific, falsifiable founder track-record claim.** "70+ businesses bought and sold over 25 years" is the kind of concrete number that anchors a coach's credibility. Whether or not every number is third-party verifiable, the specificity is part of why it converts.
- **Two podcast surfaces.** "Business Buying Strategies Podcast" (long-form) + "10 Minute Deals Podcast" (short-form) — segmenting the listener funnel by attention budget. Smart.
- **"Dealmakers" as the brand name** rather than "Jonathan Jay" — leaves room for the brand to outlive Jay personally and to add other coach-personalities later. Compare to "Karlton Dennis" (a personal brand) vs "Dealmakers" (a community brand) — the latter is more durable.
- **"FastTrack" as a 3-day live event** is the right kind of high-energy entry product for this category — most prospects who pay £X to attend a live event will buy the upsell to the mastermind. Standard creator-economy conversion mechanic.

## Where they're vulnerable

- **Site is aggressively bot-protected.** HTTP 403 on the Playwright extract; even the WebFetch fallback hit constraints. For a coaching brand whose job is conversion, every challenge interstitial is friction.
- **No team page captured.** Beyond Jonathan Jay there's no visible operational team — possibly the brand is genuinely solo-led, possibly the team page exists but wasn't reached.
- **All pricing gated.** None of the FastTrack / Mastermind / Inner Circle prices are public. Compare to our fee-transparent reference set (Tax Alchemy, My CPA Coach, Asset Map, Intrepid Wealth Partners) — this is the opposite end of the spectrum.
- **Key-person risk is total.** Jonathan Jay's 25-year track record is the brand. If he steps back, the brand collapses.
- **Aggregate audience claims without third-party verification.** "1.7M YouTube views" and "188,000 hours watched" are real-sounding metrics but they're self-reported. A prospect can verify the channel exists; verifying the specific watch-hour number requires more work.
- **No mainstream UK press signals captured.** No Times / Guardian / FT / BBC / This Is Money / Money Saving Expert features visible on the captured surface. The press deck (if any) is somewhere else.

## What this means for our entry

Dealmakers is **not on our threat radar** — different product (business acquisition vs. wealth management), different decision tree. Strategic value from this profile:

1. **The multi-tier product-ladder pattern is universal across content-led financial-services categories** (tax, investing, business-buying, content/personality). Karlton Dennis runs it on tax; Sven Carlin on stocks; ClearValue on subscription investing; Dealmakers on business-buying. If we ever spin out a content brand alongside the RIA, the architecture is well-tested.
2. **A brand-name distinct from the founder's name** ("Dealmakers" not "Jonathan Jay") is the durability move. Worth doing if we expect to scale past a single advisor.
3. **For our UK profile-handling**: this is the first UK firm we've cataloged. The `regulatory_note` field correctly explains the FCA-non-applicability without requiring a registered-entity pull. We can now confidently say the Phase-1 schema works for UK firms. **One more UK firm and we should build the Phase-2 Companies House + FCA enricher.** Tentative trigger: when the 2nd UK firm lands in the catalog.

What we should explicitly *not* take: the gated pricing, the bot-protection level, the founder-only branding, and the aggregate-self-reported audience metrics without third-party verification.

The narrowest single takeaway: **Dealmakers is a useful negative example of why we should publish our pricing.** They have an audience the size of a mid-cap creator economy and they still gate everything below the lead magnet — which means every interested prospect requires a sales call, which means staffing constraints scale linearly with growth. Our model should be different.

---

*For the full analysis see `2_Full_Profile.md` (which is a stub — the firm's captured site content is thin because of bot-protection and because much of the substance lives in courses / events that aren't web-crawlable).*
