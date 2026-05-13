---
competitor: Foundry Financial
website: https://www.foundryfinancial.org/
competitor_type: wealth_mgmt_traditional
threat_level: low
confidence: medium
last_updated: 2026-05-11
next_review_by: 2026-11-07
review_cadence_days: 180
---

# Foundry Financial — Full Profile

*This is the deep dive. For a quick read, see `1_Summary.md`.*

## The big picture

Foundry Financial is a small Pasadena, CA RIA that has chosen its niche cleanly and built almost the entire website around it: **retirees and people nearing retirement** who have been "diligent savers, have little debt and are facing a significant tax burden in retirement." That sentence appears verbatim on the About page and could just as easily be the firm's strategy memo. The home page hero — "Retire with confidence." — leaves no ambiguity about who they are for and who they are not.

The `.org` TLD is a red herring. Foundry Financial is a for-profit Delaware-style LLC (`FOUNDRY FINANCIAL LLC`, CRD 300122, SEC# 801-133770), SEC-registered with $232.6M in regulatory AUM, 10 employees, 7 advisors performing advisory functions, and zero disciplinary disclosures on file (IAPD as of 2026-05-12). The `.org` choice reads as a values-coded marketing decision rather than a non-profit, faith-based, or foundation-backed structure — there is no mission-statement language, no 501(c)(3) signaling, and the only worldview claim on the site is a fee-only / fiduciary / evidence-based one. It's a small firm using `.org` the same way an indie magazine might.

For our purposes — a pre-launch independent RIA targeting two specific demographics (early adults setting up investment accounts; 40–50-year-olds focused on 401(k) management) — Foundry is a **low-threat competitor on directness, but a useful study on craft**. They don't aim at our segments. They aim past them, at people roughly 15-20 years older. But they are a clean example of what a well-positioned single-niche boutique looks like in 2026: an explicit ICP, a trademarked process ("Foundry Framework™"), a free assessment as the single conversion path, and a founder origin story that justifies the existence of the firm. The threat band is low; the design and positioning lessons are real.

---

## Who they are

Pulled from `Source_Data/company_facts.json` (IAPD enrichment), the parsed Form ADV (`Source_Data/adv_cache/300122_20260512.pdf`), and the captured About page.

| | |
|---|---|
| Legal name | FOUNDRY FINANCIAL LLC |
| CRD / SEC# | 300122 / 801-133770 |
| Founded | (not in source data — implied "after founder's father died" per About page; ADV filing dates would pin this down) |
| Headquarters | 479 S Marengo Ave, Pasadena, CA 91101 |
| **Regulatory AUM** | **$232,611,535** as of 2026-05-06 (ADV Part 1A Item 5.F) |
| Employees | **10** total (ADV Item 5.A); **7** perform advisory functions (ADV Item 5.B.1) |
| Branches | **7** (ADV / IAPD) — note: with 10 employees this likely means the firm registers each advisor's home office or client meeting location as a branch, not seven separate staffed offices |
| Client accounts | **626** (parsed from ADV) |
| Funding / Ownership | Founder-led, independent. About page narrative is first-person ("I took matters into my own hands and launched Foundry Financial"). No outside-investor or PE language visible. |
| Leadership | Founder named in first-person voice on About page but not named by proper noun on captured pages. A `/financial-planners-los-angeles` team page exists in the navigation but was not pulled by the sitemap-first capture pass — *needs a manual follow-up*. |
| DBAs and affiliates (IAPD) | FOUNDRY FINANCIAL, LLC (single DBA — just the comma variant) |
| Disciplinary disclosures | **None** (IAPD `firm_ia_disclosure_fl: N`) |
| Recent moves | (not in source data — no press section, no "in the news" page visible) |

## Trajectory

| Metric | ~24-36 mo ago | ~12 mo ago | Most recent | Source |
|---|---|---|---|---|
| Regulatory AUM (USD) | (not pulled) | (not pulled) | **$232,611,535** | ADV Part 1A Item 5.F (filed 2026-05-06) |
| Advisor count (IARs) | (not pulled) | (not pulled) | **7** | ADV Part 1A Item 5.B.1 |
| Employee count | (not pulled) | (not pulled) | **10** | ADV Part 1A Item 5.A |
| Branch count | (not pulled) | (not pulled) | **7** | ADV Part 1A Section 1.F |
| Disclosures on file | (not pulled) | (not pulled) | **0** | IAPD `firm_ia_disclosure_fl: N` |

**Notable events since last review:**

- **2026-05-06** — Most-recent ADV filing reports 10 employees / 7 advisors / 7 branches / 626 client accounts / $232.6M AUM / zero DRPs. (Source: parsed ADV PDF.)
- **2025-07-07** — Most recent blog post: *"Major Tax Legislation Changes for 2025: A Comprehensive Guide for Savers and Retirees."* The prior post was January 2025. The post before that was May 2023. Blog cadence is **bursty, not regular** — see "How they reach people" below.
- **(undated)** — Founder origin story on About page: father died "entirely too early," founder helped mother search for an advisor, was disappointed by commission-driven product pushers, and "took matters into my own hands and launched Foundry Financial." This is the firm's defining narrative.

**What the direction tells us** — The static snapshot is healthy for a small boutique ($230M is comfortably above the SEC's $100M minimum for federal registration, and 626 client accounts means roughly $370K average per account — consistent with their stated "diligent savers nearing retirement" ICP). Without prior ADV snapshots we can't tell whether the firm is growing, holding, or contracting. The sparse blog cadence is the only direction signal in source data and it points to a firm that is *not* primarily marketing-driven. It either grows by referral or has plateaued.

## Who they sell to

The ICP is stated directly on the About page, more clearly than most firms ever bother to do:

> We do our best work with retirees and those nearing retirement who have been diligent savers, have little debt and are facing a significant tax burden in retirement.

And further:

> Our clients value their time and understand that spreadsheets alone can't answer life's most important questions. They know a fulfilling retirement isn't just about the numbers in their accounts — it's about the freedom those numbers provide to live a purposeful, impactful life.

This is a deliberate de-selection. The site does almost no work to attract anyone outside that window. There is no 401(k) accumulation funnel, no early-career investing content (the blog tag list is "College, Investing, Small Business, Strategy, Crypto, Retirement, Taxes" — Retirement and Taxes dominate by topic frequency; the one "Investing" post is about *their* portfolio approach, not first-time-investor education).

Confirming signals on the homepage:

- The H3 anxieties listed under "Retirement planning can be overwhelming" — *"Should I do a Roth conversion? When should I take my Social Security? Am I taking too much risk in my portfolio? Do I have enough money to retire?"* — are exclusively pre-retirement and decumulation questions. A 28-year-old visitor will not see themselves anywhere in that list.
- The hero photograph is a black-and-white surf shot — implying the leisure / freedom side of retired life — and the homepage carousel/banner imagery on subsequent screenshots leans the same way.
- The CTA copy ("Are We a Good Fit?" leading to `/retirement-assessment`) is itself a qualification gate: prospects who aren't retirement-curious self-select out.

626 client accounts across $233M AUM = roughly **$370K per account**, which lands them in the upper mass-affluent / lower-HNW tier — consistent with the diligent-saver-nearing-retirement narrative.

## What they sell

A traditional, comprehensive RIA service line bundled into one offering rather than tiered. The services page lists six pillars under "How We Help":

- **Give Your Money Purpose** (planning-led framing)
- **Dynamic Income Strategy** (decumulation / retirement income)
- **Portfolio Design** (investment management — "evidence-based" using academic research, per the home page)
- **Strategic Tax Planning** (Roth conversions, tax-bracket management — a recurring blog theme)
- **Estate Planning**
- **Risk Management**

These are presented as expandable buttons (interactive accordion), not separate service pages. There is **no tier table, no AUM-bracketed pricing, no breakout for 401(k) plan sponsors, no separate "starting out" tier.** The firm sells one bundle to one type of client.

How a buyer gets started: the *only* conversion path on every page is the same — `Are We a Good Fit?` / `Get Started` / `Schedule a Call` / `Free Assessment` all link to **`/retirement-assessment`**. This is unusually disciplined. There is no contact form, no general "schedule a consultation," no chat widget. One CTA, one destination, one named offer ("FREE Strategy Meeting").

## How they reach people

| | Value | Source | When |
|---|---|---|---|
| Monthly website visits | (not in source data) | | |
| Top traffic channels | Local SEO ("Financial Advisor Los Angeles" in `<title>`; "Wealth Management Los Angeles" as a service-page URL slug) — heavily inferred | meta tags | 2026-05-12 |
| Top keywords they rank for | (not in source data — but URL and `<title>` patterns target "financial advisor los angeles," "wealth management los angeles," "financial planners los angeles") | site | 2026-05-12 |
| Social following | (not in source data — no social links auto-extracted from the footer) | | |
| Review score & count | (not in source data) | | |
| Press footprint | An "As Seen In" section is referenced in the home page body text but no specific outlet logos or named publications were captured. Lighter footprint than a Ritholtz or a Walser. | site | 2026-05-12 |
| Blog cadence | **Sparse and bursty.** Captured post dates: 2025-07-07, 2025-01-04, 2023-05-18, 2023-04-27, 2023-04-21, 2022-12-06, 2022-01-13, 2022-01-10, 2020-08-06. Roughly nine posts over six years, with multi-month and multi-year gaps. | blog page | 2026-05-12 |

The firm is **not running a content engine.** The blog exists for SEO and for one-off tax-law-change explainers, not as a primary acquisition channel. This is a meaningful contrast to Ritholtz Wealth (high-volume named-byline content), Streamline Planning (YouTube-led), and Walser Wealth (personality-led media). Foundry's reach mechanism is more likely **local search + word-of-mouth referrals from existing retiree clients**, not the broadcast-content motion several peers depend on.

---

## How they look

The visual feel in the first three seconds: **clean, calm, modern-conservative.** A black-and-white surf hero photograph anchors the home page above the fold — a person riding a wave, framed as the freedom that retirement makes possible. A bright cyan-blue accent color (`rgb(0, 161, 225)`) carries the primary buttons and the "Foundry" wordmark. Plenty of white space. The overall register is "boutique financial planner who hired a real designer" rather than "regional firm with a template site."

- **Colors**: dominant white background, black-and-white photography, single cyan-blue accent (`#00A1E1`) for CTAs and the wordmark. Secondary accents are restrained — a pale blue-grey (`rgb(142, 182, 220)`) and a near-white grey for cards. The palette signals modern-confident-restrained, not establishment-bank-blue or trying-too-hard-startup. Cyan-on-black-and-white is a deliberately editorial choice.
- **Type**: Lato for headings, weight 700; generic sans-serif for body at 17px (paragraph 25.64px). Lato is a workhorse humanist sans — friendly, contemporary, not trendy. The relatively large paragraph size suggests deliberate accessibility for an older readership.
- **Imagery**: black-and-white photography, real people doing aspirational-leisure things (surfing, the things a retiree imagines). No stock smiling-with-grandkids tropes, no skyline cliches, no abstract-tunnel imagery. The choice to go entirely black-and-white is itself the brand move.
- **Layout**: spacious, narrative scroll, generous vertical spacing. Each section reads like a magazine page. The "Our Simple Process" three-step block (Strategy Meeting → Personalized Plan → Action) is the kind of clean three-column explainer a designer would actually put on the page rather than a Wix template default.
- **Logo**: stacked wordmark — "Foundry" set in a bold weight with a stylized triangular cutout in the "y" descender, "FINANCIAL" set below in caps. The triangle implies a foundation/forge symbol consistent with the firm name.
- **Primary button**: cyan background (`#00A1E1`), white text, 6.8px border-radius, large padding. Modern, friendly, high-contrast against the otherwise grayscale page.

*Design specifics (hex codes, exact RGB values, font names) are in `Source_Data/design_details.json`.*

## How they sound

The voice is **warm-professional with intermittent first-person founder-voice intrusions**, especially on the About page. Compared to peers in the source set: less swaggering than Ritholtz, less crusader-vs-the-industry than Walser, more polished than a typical boutique RIA's blog.

- **Tone**: reassuring, plain-spoken, occasionally personal. Not formal-stiff. Not slogan-driven.
- **Reading level**: roughly grade 8–10. Deliberately accessible; matches the older retiree demographic.
- **Sentence style**: medium-length, conversational. Some declarative short sentences for emphasis (*"Okay, enough about me. Let's talk about you."*).
- **Words they own**: *clarity* (recurring — "financial clarity," "clarity around your money," "clarity around money"), *confidence* ("Retire with confidence," "feel confident about your retirement decisions," "have the confidence to make smart decisions"), *purpose* ("Give Your Money Purpose," "live a purposeful, impactful life"), *Framework* (the trademarked Foundry Framework™), *human touch* ("Retirement expertise, with a human touch"), *evidence-based*.
- **Words they avoid**: *bespoke*, *holistic* (despite the comprehensive-planning offering, they don't use this term), *journey* (used once in the meta description, not in the hero), *partner* (the leveraged consultant-speak), *legacy* (despite serving retirees).
- **Pronouns**: dominantly **"we" / "you"** with a stretch of **"I"** on the About page. The "I" register on the founder origin story is a deliberate intimacy move and probably the most distinctive voice choice on the entire site.

**A sample, in their words:**

> Unlike traditional wealth management firms that offer a static, one-time financial plan, we recognize that real success lies in continuous engagement. Life is dynamic, and so should be your financial plan. Through the Foundry Framework™, we provide financial clarity, so you can feel confident about your money at every stage of your journey, ensuring you remain in command of your finances, no matter what life throws your way.

And the line that does the most positioning work — from the About page:

> I tried to help my Mom find an advisor to sort out her finances. Instead of a helping hand, I found an industry of financial advisors dominated by glorified salespeople working on commission — pushing products that were not in my mother's best interest. Disappointed with the options, I took matters into my own hands and launched, Foundry Financial, a wealth management firm with transparent pricing that specializes in helping provide clarity around money — so you have the confidence to make smart decisions.

## The story they tell

Foundry's pitch has four layered claims:

1. **"A new type of financial firm."** The About page H1 is exactly that — positioning against legacy commission-driven advisors. The argument is structural: most advisors are salespeople with quotas; we are fee-based fiduciaries who don't have to push products.
2. **"Retire with confidence."** The homepage hero. The firm has accepted that decumulation is the hardest emotional moment in personal finance and built the entire site around easing it. The four homepage anxieties (Roth, Social Security, portfolio risk, "do I have enough?") are the four questions every near-retiree is actually losing sleep over.
3. **"Continuous engagement, not a one-time plan."** A jab at the "deliver-a-binder-and-disappear" planning model. Combined with the "Foundry Framework™" branding, this implies the firm offers an ongoing relationship product rather than a one-shot deliverable.
4. **"Evidence-based investments."** A vocabulary borrowed from the DFA / academic-investing world. Signals "we are not stock pickers; we are portfolio engineers." Reinforces the de-selection of clients who want speculation or active outperformance promises.

The implicit competitor they are swinging at is **the commissioned product salesperson** — the broker working at a wirehouse or insurance company who sells annuities and proprietary mutual funds to seniors. The founder's origin story names this enemy explicitly. Foundry is *not* swinging at PE-backed roll-ups (the Focus Partners enemy), and is *not* swinging at the robo-advisors (the Ritholtz enemy). Different fight, same category.

## What they promise

The hierarchy of promises a visitor sees:

1. **Primary** (hero): "Retire with confidence. Preparing for a worry free retirement — one great decision at a time." → *emotional relief on the central anxiety of their target client.*
2. **Secondary** (the three-column band): "EASY TO FOLLOW RETIREMENT PLAN / PERSONALIZED TAX STRATEGY / EVIDENCE-BASED INVESTMENTS" → *the three pillars of the offering, in order of what a retiree cares about.*
3. **Tertiary** (mid-page narrative): "Retirement expertise, with a human touch" + the Foundry Framework™ story → *we are a methodical, repeatable process, not a vibe.*
4. **Underlying** (About): the founder origin story → *we know why this matters because we lived it.*

## How they ask for the sale

- **Primary CTA**: "ARE WE A GOOD FIT?" (top-right persistent), echoed throughout the site as "GET STARTED," "SCHEDULE A CALL," and "FREE ASSESSMENT." Every CTA on every captured page links to the same destination: `/retirement-assessment`.
- **Secondary CTA**: none. There is no second offer, no newsletter signup visible in captured data, no chat widget, no fallback contact form.
- **Friction level**: medium — a single landing-page funnel ("retirement assessment") rather than a contact form or instant chat. Foundry has clearly decided the prospect should either commit to the assessment or leave; there's no middle option.
- **What this tells us**: a *qualifier-first* sales motion. The "Are we a good fit?" framing is itself a filter — the firm is saying "if you're not nearing retirement and don't want this kind of methodical relationship, please self-select out." For a 7-advisor firm with 626 accounts, this is the right move. They cannot serve everyone, so they explicitly serve fewer people more deeply.

## Who vouches for them

- **An "As Seen In" section** appears in the homepage body text, but the specific outlets/logos weren't captured as link text. (The footer-link miner missed any specific publication references.) Light press footprint relative to peers.
- **Founder origin story** itself functions as a trust signal — a named personal motivation for starting the firm.
- **Form CRS** and **ADV** are linked in the footer, the second to a Google Drive URL rather than directly to the SEC filing — a small but slightly off-brand choice for a firm that wants to feel professional. (Form CRS does link directly to `reports.adviserinfo.sec.gov`.)
- **Clean regulatory record** — zero DRPs on file at IAPD.
- **Custodians**: "OUR CUSTODIANS" headline appears on the home page (with logos that weren't extracted as text). This is a standard wealth-management trust signal — naming the institutions that actually hold client assets (likely Schwab, Fidelity, or similar).
- **What's missing**: no client testimonials visible, no named-and-photographed advisor team on the captured pages (a `/financial-planners-los-angeles` URL exists in the nav but the team page wasn't pulled by sitemap-first capture). For a 7-advisor firm, the absence of a visible team is a real gap.

## How they price

- **Transparency**: claimed but not demonstrated. The About page literally says *"a wealth management firm with transparent pricing"* — but no fee schedule is published on captured pages. There is no pricing page, no fee table, no AUM-bracketed disclosure. The transparency claim is **asserted, not shown.**
- **Tier structure**: none visible — one offering, gated by the retirement-assessment funnel.
- **Fee schedule**: would live in ADV Part 2A (the brochure) and is not auto-parsed by `enrich-adv-pdf.ts`. A manual ADV Part 2A read would resolve this. Their public ADV link points to a Google Drive PDF rather than directly to `reports.adviserinfo.sec.gov`; reading that document is the next step if pricing matters for the analysis.
- **What this tells us**: The "transparent pricing" claim is rhetorical positioning, not literal price disclosure. This is mildly hypocritical given the founder's stated frustration with the industry's opacity — but it's also category-norm. The opening is: a competitor that *actually* publishes fees on the site can credibly call Foundry's claim out.

## What they believe

The worldview underneath everything else: **most retirees end up with the wrong advisor, the wrong portfolio, and the wrong tax plan because the dominant industry model rewards selling products rather than giving advice.** The founder's origin story is the embodied version of this belief — his mother's experience trying to find a non-commissioned advisor after his father's death.

Three corollary beliefs visible in the site:

1. **The decumulation phase is structurally different from the accumulation phase, and most firms treat it as the same problem.** Foundry's entire framing — Dynamic Income Strategy, Roth conversion timing, Social Security timing, tax-bracket management — is decumulation-native.
2. **The plan should be alive, not a binder.** "Unlike traditional wealth management firms that offer a static, one-time financial plan, we recognize that real success lies in continuous engagement."
3. **Markets are efficient enough that you should build evidence-based portfolios, not pick stocks.** A DFA-adjacent worldview. They aren't trying to beat the market; they're trying to optimize tax-adjusted expected returns for someone with a 20-30 year retirement horizon.

This is a more coherent and well-bounded worldview than several peer firms in our set. They've decided what they believe, who they're for, and what they won't do — and the site is the consistent expression of those decisions.

---

## What this means for our entry

### What's working for them

- **A single named ICP, defended consistently across the site.** The phrase "retirees and those nearing retirement who have been diligent savers, have little debt and are facing a significant tax burden in retirement" is doing more positioning work than most firms' entire homepages. We should write our equivalent sentence for each of our two target segments before we write anything else.
- **One CTA, one destination.** Every conversion link on every page goes to `/retirement-assessment`. No competing offers, no contact-us fallback, no chat widget. This is what conversion-disciplined design looks like — and it lets the firm test and optimize a single funnel rather than fragment learning across three.
- **The founder origin story as trust mechanism.** "When my dad died entirely too early, I tried to help my Mom find an advisor…" is the most memorable single passage on the entire site. It transforms the firm from "another fee-only RIA" into "a firm with a reason to exist." Most pre-launch firms skip this and read as anonymous.
- **A trademarked named process.** The Foundry Framework™ is a brand move — it lets the firm talk about its approach as a *thing* rather than a generic service. It's a small but specific tactic for being remembered.
- **Modern visual identity in a category that mostly looks dated.** Black-and-white photography + a single cyan accent + Lato + clean spacing is a design system, not a template. It signals "we are a current firm" before any copy is read.
- **A qualification gate as the first ask.** "Are We a Good Fit?" is a softer, lower-pressure ask than "Schedule a Call" but does the same conversion work — and the framing pre-qualifies the prospect's mindset.

### Where they're vulnerable

- **"Transparent pricing" claimed but not shown.** The About page asserts transparent pricing while the site shows no fee schedule. A new entrant who actually publishes pricing — even a single AUM bracket — can credibly contrast.
- **No visible team.** A `/financial-planners-los-angeles` URL exists but no team page was captured by sitemap-first discovery; the homepage shows no advisor photos either. A 7-advisor firm hiding its advisors is a missed trust signal — and a clear competitive opening for a firm that leads with named, photographed advisors.
- **Sparse blog cadence.** Roughly nine posts over six years. The "modern tech-savvy advisor" positioning is undercut by a marketing presence that looks dormant. A firm publishing weekly with bylined advisor authors can pull SEO and trust mindshare easily.
- **Single-segment dependency.** They serve one demographic well and only one. As that demographic ages (and a portion of the book naturally enters spend-down or estate transition), the firm has no growth engine for adjacent segments. A firm built to serve multiple demographics is structurally hedged against this.
- **Modern-tech claim is asserted, not shown.** The site references a "financial dashboard" used to gather and organize client information, but no screenshot, no portal preview, no demo video. This is the standard gap in our set — and the standard opening for us.
- **`.org` TLD without a values story.** The domain choice implies non-profit / mission-driven framing that the site copy never actually delivers. For some prospects, this will read as a hint of inconsistency.
- **Founder concentration / key-person risk.** The About page is first-person singular. The firm's narrative is the founder's narrative. A succession question or a brand transition would be hard.

### How well do they serve each of our target segments?

- **Early adults setting up proper investment accounts: NOT AIMED.** No content for first-time investors, no early-career landing page, no early-adult-friendly fee or service tier, no early-career hero imagery, no blog tags in that direction. A 28-year-old visiting the site is shown a surfing retiree and asked "Are we a good fit?" — the implicit answer is no. **This is a clean entry opening for us.**
- **40–50 year olds focused on 401(k) management: WEAK.** Foundry's tax-planning expertise is relevant to mid-career 401(k) holders (Roth conversion content applies), but there's no 401(k) rollover funnel, no held-away-asset story, no plan-sponsor service, no mid-career hero. The site frames every tax conversation as a *retirement* tax conversation. A 45-year-old looking for "should I increase my 401(k) contribution or pay down the mortgage" finds nothing here. **This is a softer entry opening — we can serve this segment with content and a funnel they don't have.**

**Net read**: Foundry is a **low-overlap competitor on both our target segments**. They are not competing with us for these prospects today. They are, however, a case study in segment discipline — and they show what a firm looks like when it serves one segment well, which is the standard we should hold ourselves to for each of *our* segments.

### What we should consider taking from them

- **Write the explicit ICP sentence.** For each of our target segments, write a one-sentence description that names the demographic, the financial situation, and the emotional state. Foundry's "diligent savers, little debt, significant tax burden in retirement" is the template.
- **One CTA per page.** Resist the temptation to add a contact form, a newsletter, a chat widget, and a "schedule a call" all at once. Pick one. Foundry shows it works.
- **A founder origin story.** Why does this firm exist? Most pre-launch firms skip this. The Foundry About page proves how much positioning work a 200-word personal narrative can do.
- **A named, trademarked process.** The Foundry Framework™ is the kind of small branding move that punches above its weight. Naming our process — even something simple like "the [X] Method" — gives us a noun to refer to rather than a generic verb.
- **The "Are we a good fit?" CTA framing.** Softer than "Schedule a Call," still converts, and the question itself qualifies the prospect.
- **Black-and-white photography + a single bright accent.** Cheap-to-produce, distinctive, doesn't look like a template. A new firm without a six-figure brand budget can copy this design system credibly.

### What we should deliberately *not* do

- **Claim transparent pricing without showing it.** If we make that claim, we should publish the schedule. Otherwise we end up making a Foundry-shaped credibility gap.
- **Hide the team.** Foundry has 7 advisors and shows almost no advisor presence on captured pages. For a small firm trying to compete on "real humans with modern tooling," hiding the team is a contradiction.
- **Burst-publish a blog.** Nine posts in six years is worse than no blog because the visible last-update date signals abandonment. Either commit to a cadence or don't publish dates.
- **Use `.org` as a values-coded marketing choice.** The TLD is doing work the copy isn't backing up. We should pick a TLD whose semantic implication matches our actual structure.
- **Sell one product to one segment when we have a multi-segment thesis.** Foundry is the right structure *for them*. It is the wrong structure for us, because our thesis is explicitly multi-demographic.

---

## Recommended actions

### Quick wins (this month)

- Steal the "explicit ICP sentence" pattern. Write the one-sentence version for each target segment.
- Steal the "Are We a Good Fit?" qualifier CTA framing as a candidate primary CTA for our own site, alongside or in place of "Schedule a Call."
- Draft our founder/origin paragraph in the first person. Foundry's About page is the proof that this works.

### Strategic shifts (this quarter)

- Build the segment-specific landing pages Foundry doesn't have — one for early adults, one for mid-career 401(k) — using Foundry's "one CTA, one destination" discipline within each.
- Decide our pricing-disclosure stance. Foundry's "asserted transparent pricing without a published schedule" is a vulnerable position; we should either publish or not claim.

### Watch items (monitor, don't act yet)

- Whether Foundry begins publishing blog content at regular cadence — currently sparse, but a content push would signal a strategy shift.
- Whether they expand their service line beyond retirement decumulation (e.g., a 401(k) accumulation product, an early-career tier). Each adjacent move would tighten overlap with us.
- Whether they ever publish a public fee schedule — would make the transparency claim real and remove one of their vulnerabilities.

---

## Open questions

Things worth verifying or returning to:

- **Founder's name and bio.** First-person About page narrative is unattributed in captured copy. The `/financial-planners-los-angeles` team page was not captured by sitemap-first discovery — a manual visit would name leadership and likely show advisor photos/bios.
- **Fee schedule.** Manual read of ADV Part 2A (the brochure linked from the Foundry site via Google Drive, or directly at `https://reports.adviserinfo.sec.gov`) would resolve the "transparent pricing" claim.
- **Founding date.** Not stated on captured pages. ADV initial-filing date would pin this.
- **The "As Seen In" outlets.** Body text references the section but specific publications weren't captured. Worth a manual revisit if press-footprint analysis becomes relevant.
- **The `.org` choice.** Is there an actual non-profit or foundation entity behind this, or is it a pure marketing-domain choice? IAPD shows a plain LLC, no foundation affiliate — strongly suggests the latter, but worth noting.
- **Historical ADV trajectory.** Without prior filings, we can't tell if the firm is growing or plateauing. Three historical ADV snapshots would resolve this.

## Where this came from

- Website captured on: 2026-05-12 via `tools/extract.ts` (sitemap-first discovery, 51 sitemap candidates → 4 pages captured: home / services / about / blog)
- Source URL: https://www.foundryfinancial.org/
- IAPD enrichment: exact match on "foundry financial" → CRD 300122 → FOUNDRY FINANCIAL LLC; auto-filled legal name, SEC#, HQ, branches, DBAs, disciplinary flag
- ADV PDF parsed by `tools/enrich-adv-pdf.ts`: $232,611,535 AUM / 7 advisors / 10 employees / 7 branches / 626 client accounts / 0 DRPs (filing dated 2026-05-06)
- Traffic estimates: not collected
- Reviews: not collected (sparse for the category)

**Confidence**: medium. Site-derived observations (voice, design, ICP, positioning, CTA discipline) and IAPD/ADV facts are solid. The notable gaps are (a) no team page captured (founder name and advisor bios remain unverified from source data); (b) no historical ADV trajectory (can't tell if the firm is growing or flat); (c) no captured fee schedule (the "transparent pricing" claim is testable but un-tested). None of these gaps change the threat-level call.

**Threat-level rubric (sum 5 → low):**

- **Reach: 1** — single-office (Pasadena) regional firm, no national presence, blog cadence is dormant, light press footprint. Sub-1M monthly visits is overwhelmingly likely.
- **Segment overlap: 1** — explicitly targets retirees and pre-retirees. Serves our two segments peripherally at most.
- **Momentum: 1** — no growth signals in captured source data; blog cadence is sparse; no acquisitions, hires, or launches visible. Treating as flat.
- **Capital backing: 2** — independent, profitable, founder-led, modest team of 10. No PE, VC, or public-company resources to outspend a new entrant.

Pages we looked at:
- [Homepage](./Source_Data/pages/home.html) — [screenshot](./Screenshots/Homepage_full.png) — [above-fold](./Screenshots/Homepage_above_fold.png) — [mobile](./Screenshots/Homepage_mobile.png)
- [Services / Wealth Management LA](./Source_Data/pages/services.html) — [screenshot](./Screenshots/Services_full.png)
- [Our Story / About](./Source_Data/pages/about.html) — [screenshot](./Screenshots/About_full.png)
- [Blog index](./Source_Data/pages/blog.html) — [screenshot](./Screenshots/Blog_full.png)
- [ADV PDF (cached)](./Source_Data/adv_cache/300122_20260512.pdf)
