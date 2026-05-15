---
competitor: Competitor Name
website: https://example.com
competitor_type: wealth_mgmt_traditional | wealth_mgmt_content_led | wealth_mgmt_solo | wealth_mgmt_tax_specialty | robo_advisor | bank_or_wirehouse | education_platform | b2b_network | finance_coach | tax_or_cpa_firm
threat_level: high | medium-high | medium | low
confidence: high | medium | low
last_updated: YYYY-MM-DD
next_review_by: YYYY-MM-DD
review_cadence_days: 90
---

# {Competitor Name} — Full Profile

*This is the deep dive. For a quick read, see `1_Summary.md`.*

## The big picture

Two or three paragraphs orienting the reader. Who this company is, what they're trying to do in the market, and why they matter to us. Written like the opening of a magazine profile, not a corporate slide.

---

## Who they are

A short paragraph covering the basics — when they were founded, where they're based, how big they are, who's running the show, and how they're funded. Pull from `Source_Data/company_facts.json`.

| | |
|---|---|
| Founded | |
| Headquarters | |
| Employees | (with source and date) |
| Funding | (last round, amount, when) |
| Leadership | |
| Recent moves | (hiring, layoffs, launches, press) |

## Trajectory

Direction matters more than the static snapshot. Pull three historical Form ADV filings (most recent + ~12 months back + ~24-36 months back) and chart the deltas. For non-RIA entities, substitute the closest equivalent (subscriber counts, content cadence, named hires).

| Metric | ~24-36 mo ago | ~12 mo ago | Most recent | Source |
|---|---|---|---|---|
| Regulatory AUM (USD) | | | | ADV Part 1A Item 5.F |
| Advisor count (IARs) | | | | ADV Part 1A Item 5.B |
| Employee count | | | | ADV Part 1A Item 5.A |
| Branch count | | | | ADV Part 1A Section 1.F |
| Disclosures on file | | | | IAPD / ADV Part 2A Item 9 |

**Notable events since last review** (acquisitions, leadership changes, new disclosures, ownership changes, product launches):

- (event — source — date)

**What the direction tells us** — one or two sentences. Growing, flat, or shrinking? Does the trajectory support or undercut their public positioning?

## Who they sell to

Who their customer is and how we know. Pair every claim with the evidence — pricing tier, case studies featured, careers page hiring, the language used on the home page.

## What they sell

What's actually in their product or service. The tiers, the packaging, the price points if visible, and how a buyer gets started (free trial, demo call, contact sales).

## How they reach people

Where their traffic comes from and how loud they are.

| | Value | Source | When |
|---|---|---|---|
| Monthly website visits | | | |
| Top traffic channels | | | |
| Top keywords they rank for | | | |
| Social following | | | |
| Review score & count | | | |

---

## How they look

A short paragraph describing the visual feel of their brand — what you'd notice in the first three seconds. Then bullets for the specifics:

- **Colors**: dominant palette, accent choices, what the palette signals
- **Type**: heading/body pairing, the mood it sets
- **Imagery**: photography vs. illustration, real people vs. abstract, warm vs. clinical
- **Layout**: spacious or dense, what that implies about who they're for
- **Logo**: shape, wordmark vs. symbol, the emotional register

*Design specifics (hex codes, font names) are in `Source_Data/design_details.json` if anyone needs them for reference.*

## How they sound

A short paragraph describing the voice you hear reading their site. Then specifics:

- **Tone**: formal / conversational / playful / technical / etc.
- **Reading level**: roughly
- **Sentence style**: short and punchy / long and considered / mixed
- **Words they own**: the distinctive vocabulary
- **Words they avoid**: what they don't say
- **Pronouns**: "we" vs. "you" vs. "I" — what it implies

**A sample, in their words:**
> A direct quote, one to three sentences, that captures the voice best.

## The story they tell

Two or three paragraphs on how they position themselves. Where they place themselves vs. the rest of the category, the implicit competitor they're swinging at, and the worldview they're inviting buyers into.

## What they promise

The hierarchy of promises a visitor sees:

1. **Primary** (the headline above the fold): 
2. **Secondary** (the supporting promises): 
3. **Tertiary** (further down the page): 

## How they ask for the sale

The call-to-action strategy:

- **Primary CTA**: what it says, where it appears, how often
- **Friction level**: free trial / demo / contact sales / signup
- **What this tells us**: their sales motion in one sentence

## Who vouches for them

How they prove they're trustworthy:

- Customer logos they feature
- Testimonials they highlight
- Numbers they cite (customers, revenue, savings, etc.)
- Awards or press
- What's conspicuously *missing* — sometimes more telling

## How they price

How pricing is presented:

- Transparent or gated?
- Tier names and what they imply
- The anchor strategy (which tier is the recommended one)
- What the pricing page is really selling beyond price

## What they believe

The worldview underneath everything else. What problem they think they're solving, why they think they're the right ones to solve it, and what they think is wrong with how the rest of the category does it.

---

## What this means for our entry

### What's working for them

Specific, concrete observations. Not "good design" — explain *why* something works and what a new entrant can learn from it.

### Where they're vulnerable

Gaps, weaknesses, or assumptions a focused new entrant could exploit. Pay particular attention to weaknesses against the segments named in `_context/our_thesis.md`.

### How well do they serve each of our target segments?

For each segment in `_context/our_thesis.md`, score Strong / OK / Weak / Not aimed at this segment and say why in a sentence. This is where the entry openings show up.

### What we should consider taking from them

The handful of things — moves, framings, design choices, copy patterns, specific phrases — worth borrowing or adapting.

### What we should deliberately *not* do

Things they do that feel right at first glance but we'd be wrong to copy.

---

## Recommended actions

### Quick wins (this month)
- 

### Strategic shifts (this quarter)
- 

### Watch items (monitor, don't act yet)
- 

---

## Open questions

Things worth verifying or returning to:
- 

## Where this came from

- Website captured on: 
- Company information from: 
- Traffic estimates from: 
- Review data from: 

**Confidence**: high / medium / low — with a sentence explaining why.

Pages we looked at:
- [Homepage](./Source_Data/home.html) — [screenshot](./Screenshots/Homepage.png)
- [Pricing](./Source_Data/pricing.html) — [screenshot](./Screenshots/Pricing_Page.png)
- [About](./Source_Data/about.html) — [screenshot](./Screenshots/About_Page.png)
