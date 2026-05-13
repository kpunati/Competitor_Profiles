---
competitor: Starke (marketing agency)
website: https://wearestarke.com/
competitor_type: b2b_network
threat_level: low
last_updated: 2026-05-13
next_review_by: 2026-11-09
review_cadence_days: 180
---

# Starke — Summary

> **Pasadena, CA full-service marketing agency** (~10 years operating history) serving "growth-focused brands" with social media content, paid social, PPC, web design, media buying, podcasts, influencer marketing, and television. **NOT a wealth-management firm** — vendor adjacency in the same shape as [Asset_Map](../Asset_Map/1_Summary.md) (planning software) or Monster Link Marketing (the agency that builds the Dennis-family sites). Cataloged here to capture an LA-area marketing-services data point and to flag the **third occurrence** of the pickBestMatch false-positive bug in our enrichment pipeline.

## The headline

This URL turned out to be a category misfit. The user sent `wearestarke.com` as part of a wealth-firm batch, but Starke is a *marketing agency*, not a financial-services firm. We're keeping it in the catalog for three reasons:

1. **It's the cleanest example yet** of the recurring `tools/enrich-adv.ts` pickBestMatch false-positive bug. The pipeline scored "Starke" → "STARKEY & ASSOCIATES, INC." (CRD 116023, Evergreen CO) as a 1/1 token confident match — same prefix-fuzz weakness that already produced false positives on Asset Map (→ "Sugar Maple Asset Management") and Streamline Planning (→ unrelated NY DBA umbrella).
2. **It's an LA-area marketing-services data point** we may want when we eventually shop for our own marketing agency. The named-past-partners deck (Sean Hannity, Dallas Mavericks, Gwyneth Paltrow, Newt Gingrich) suggests they work mid-market budgets with mainstream-press-visible clients.
3. **The user sent it deliberately** alongside two genuine wealth-adjacent firms (Peoples Capital Group, Samo Financial), so the inclusion is intentional even if the category fit isn't.

Threat to our retail RIA is **zero** by category — they're a vendor, not a competitor.

## Who they are

- **Founded**: "Nearly a decade" of operating history per site copy — likely founded 2014–2016
- **Size**: "Passionate team of creatives, strategists, designers, and developers." Specific headcount not published.
- **Where they're based**: Pasadena, CA — phone (626) 209-1194 (Pasadena area code). Stated as serving clients "around the world."
- **How they're funded**: Founder-led agency; no external capital visible
- **Regulatory**: None — they're a marketing agency, not a regulated financial firm.
- **Email**: info@wearestarke.com

## What they sell, to whom

Standard full-service marketing agency menu: **Social Media Content · Social Ads · PPC · Web Design · Media Buying · Podcasts · Influencers · Television.** Plus a "Marketing Simplified Podcast" as their own top-of-funnel content surface (7+ episodes captured in homepage carousel — topics like "Why Most Ads Fail," "Marketing strategies for small businesses for 2025," "Building a brand from zero to $1M in 6 steps").

**Stated past partnerships**: Sean Hannity (media personality / political commentator), Dallas Mavericks (NBA), Big Boy in The Neighborhood, Gwyneth Paltrow (Goop / entertainer), Newt Gingrich (former Speaker of the House). The mix is conservative-media-adjacent + entertainment + sports — suggests an LA-conservative-media-political niche, possibly explaining how they ended up in a wealth-firm batch (overlap between conservative-media audiences and small-business/wealth-strategy content).

**Target customer**: Growth-focused brands of varying sizes ("companies from millions to hundreds of millions in revenue"). No published pricing — agency-standard quote-based engagement.

## How big a threat

**Low / Not Applicable** — different category entirely. They're not in the wealth-management value chain. No four-axis scoring meaningful here.

## What they're doing well (worth studying)

- **Their own podcast as primary top-of-funnel content** ("Marketing Simplified") — exactly the same lever Karlton Dennis, Sven Carlin, Jonathan Jay, and Aaron Fragnito (at Peoples Capital Group) pull. Podcast as agency / personality-brand acquisition is by 2026 the dominant cheap-acquisition channel across all the personality-led firms in our catalog.
- **Named-past-client deck.** Not "Featured In" logos — actual client work. Forbes-level marketing agencies usually publish a case-study page; Starke leads with names rather than logos.
- **Concrete blog topics** ("Why Most Ads Fail (It's Not the Creative)," "Building A Business From Zero To $1 Million") are long-tail SEO targets rather than thought-leadership filler. Same playbook as KDA Inc.'s long-tail-tax content.

## Where they're vulnerable

- **No team named on captured pages.** "Passionate team of creatives, strategists, designers, and developers" is generic. A Meet-the-Team URL exists but specific individuals weren't captured.
- **No published pricing.** Agency-standard but undifferentiated.
- **Single Pasadena office** but no specific geographic differentiation in the pitch.

## What this means for our entry

Starke is **not on our threat radar**. The structural / catalog value:

1. **As a marketing-vendor benchmark** — if we eventually shop for an LA-area marketing agency, Starke's claim of "scaling companies from millions to hundreds of millions in revenue" + the conservative-media-adjacent client list is a known data point. Possibly relevant for our brand-architecture phase post-launch.
2. **As the canonical pickBestMatch false-positive case study.** Three false positives now (Streamline → unrelated NY DBA umbrella; Asset Map → Sugar Maple Asset Management; Starke → Starkey & Associates). The pattern is identical across all three: **prefix-token-fuzz** where a query token like "Starke" matches "Starkey" as a 1/1 confident match. The fix is to tighten pickBestMatch to require exact whole-word token equality (case-insensitive). Recurrence rate is 3 in ~22 firms = roughly **1 in 7**, which is high enough to be material.

## Pipeline bug to fix (urgent)

The same enrich-adv.ts false-positive pattern has now hit three firms in this catalog. The fix is well-scoped:

- **Current behavior**: pickBestMatch counts a token as "matched" if the candidate name contains a *prefix* or *substring* match. "Starke" matches "Starkey," "Asset" + "Map" matches "Asset Management" + "Maple," "Streamline" matches an unrelated DBA umbrella that happens to contain "STREAMLINE ASSET MANAGEMENT, LLC."
- **Desired behavior**: a token counts as matched only when it appears as a whole word (case-insensitive, word-boundary-delimited) in the candidate's legal name or DBA list. "Starke" should NOT match "Starkey." "Asset Map" should NOT match "Sugar Maple Asset Management."
- **Mitigation in metadata**: each false-positive metadata file has a clear regulatory_note explaining the bug; the bogus IAPD blocks in `Source_Data/company_facts.json` are manually cleared; cached false-positive ADV PDFs are deleted from `Source_Data/adv_cache/`.

**Recommended fix priority: high** — at the current rate, every 5-7 new firms produces a false positive that needs manual cleanup, and a future synthesize / Notion-import that took the auto-filled data at face value would propagate misattribution into the matrix.

---

*There is no `2_Full_Profile.md` substance for this firm — see the stub. The captured site content is in `Source_Data/pages/` if needed for vendor reference later.*
