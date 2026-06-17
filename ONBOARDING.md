# Onboarding — Using This Catalog with Claude Code

This catalog holds research on 48 wealth-management competitors plus our own brand voice files. Pair it with **Claude Code** and you have a private, on-demand research and drafting assistant that already knows our positioning — no API key, no separate billing, just your existing Claude.ai subscription.

This document gets you from zero to "asking the catalog useful questions" in about 10 minutes.

---

## 1. One-time setup

### 1.1 What you need before you start

- A **GitHub account**, added as a collaborator on `github.com/kpunati/Competitor_Profiles` *(ask Karthik to invite you)*
- A **Claude.ai subscription** — Pro, Max, Team, or Enterprise. Claude Code logs in with your subscription, so there's no separate API billing.
- **git** installed on your machine (`git --version` should return something)

### 1.2 Install Claude Code

- **macOS / Linux:**
  ```bash
  curl -fsSL https://claude.ai/install.sh | bash
  ```
- **Windows:** download installer from [claude.com/download](https://claude.com/download)
- **Or VS Code:** install the "Claude Code" extension from the marketplace

### 1.3 Sign in with your Claude subscription

```bash
claude login
```

This opens your browser. Sign in with the same Claude.ai account you use day-to-day. Done.

### 1.4 Clone the repo

```bash
git clone https://github.com/kpunati/Competitor_Profiles.git
cd Competitor_Profiles
```

*(SSH variant: `git clone git@github.com:kpunati/Competitor_Profiles.git`)*

### 1.5 Launch Claude Code in this folder

```bash
claude
```

You're now chatting with Claude Code, and it can read every file in this repo on demand.

> You do **not** need Node.js, npm, or any of the dev tooling unless you want to run the data-pipeline scripts in `tools/`. For everyday "ask the catalog questions" use, the clone + `claude` is everything.

---

## 2. How to actually use it

Claude Code reads files on demand. You don't paste competitor content into the prompt — you just **reference** the files and let Claude open them.

Three habits that make output dramatically better:

1. **Name the brand voice files.** Whenever you're drafting USWM-facing material, reference `_context/brand_voice.md` and `_context/brand_what_not_to_make.md` in the prompt. Without these, Claude defaults to generic financial-services copy.
2. **Name specific competitors.** "Look at how Money Guy, Brindle & Bay, and The Peak FP handle X" produces much sharper output than "look at the catalog."
3. **Ask for citations.** End prompts with *"Cite which files you read"* so you can verify the draft is grounded in real source material.

---

## 3. Sample prompts (copy & paste)

### 3.1 Drafting in USWM's voice

**Contact page rewrite:**
> Read the contact pages from these 5 firms: `Competitors/Brindle_And_Bay`, `Competitors/Foundry_Financial`, `Competitors/The_Peak_Fp`, `Competitors/Walser_Wealth`, `Competitors/Intrepid_Wealth_Partners`. Identify the 3 strongest patterns that fit USWM's positioning (small, fee-only fiduciary, active investment management). Then draft a contact page for USWM using `_context/brand_voice.md` and avoiding everything in `_context/brand_what_not_to_make.md`. Cite which competitor patterns you drew from.

**About-page "Why Choose Us" section, targeted at early-career investors:**
> Draft a 'Why Choose Us' section for USWM's About page, targeted at early-career investors setting up their first investment accounts. Pull the strongest patterns from how Money Guy, Afford Anything, and Brindle & Bay frame this segment. Use the three convictions in `_context/brand_voice.md` (trend is your friend / risk first / we'll tell you if not a fit). Apply gold-italic emphasis on standout phrases. Avoid 'your trusted partner', 'comprehensive', and the rest of the anti-list in `brand_what_not_to_make.md`.

**Blog post:**
> Write a 600-word blog post titled "Why trend-following beats market prediction." In USWM's voice per `_context/brand_voice.md`. Reference how Sven Carlin and Afford Anything handle adjacent topics in their `Knowledge_From_Source/` corpora — what works, where we'd differ. End with a CTA varied from the standard "Schedule a Consultation" phrasing.

### 3.2 Competitive intelligence

**Find our closest comparables:**
> Read every `Summaries/summary_*/1_Summary.md`. Tell me which 5 firms are most directly comparable to USWM by **offerings and voice** — fee-only fiduciary, active investment management (trend-following + options overlay + rules-based), tax-integrated (EA / NATP credentials), three-conviction style brand voice. Size and team count aren't the filter — methodology and brand are. Format as a table: firm, AUM, primary positioning, why they're comparable. Then call out the one or two patterns we should learn from each.

**Pricing-page survey:**
> Use `00_Market_Overview/pages_by_kind.json` to find every page tagged `pricing`. Read each one. Summarize the 3-4 pricing-presentation patterns you see, with example firms for each. Recommend which pattern USWM should adopt given our brand voice and that we're fee-only.

**Trend-following positioning gap:**
> Read the catalog and identify every firm that claims trend-following, momentum, or rules-based investing. How specifically do they describe it? Where is the credible gap that USWM (which actually does trend-following with options overlay) could fill? Cite firm + file paths.

**Objection handling:**
> What objections do prospects raise that competitors address well on their FAQ or About pages? Pull verbatim examples from at least 5 firms. Group by objection type. Recommend which 3 USWM should answer head-on, given our "honest broker" voice.

### 3.3 Cross-cutting research

**Segment coverage:**
> Read `_context/our_thesis.md`. For each of our two target segments (early-career first-time investors, and 40-50 mid-career 401(k) holders), identify the 3 firms in the catalog that serve that segment best. Pull a quote from each that shows the trigger language they use.

**Content-style benchmark:**
> Pick 5 random blog posts from `Competitors/*/Knowledge_From_Source/`. For each, identify: title hook structure, opening sentence pattern, paragraph rhythm, CTA placement. Then describe what a USWM blog post should look like to feel native to the category but distinctively ours.

**What's missing in the market:**
> Read `00_Market_Overview/competitor_catalog.json` plus our thesis. What's the most credible *un*occupied position USWM could take that no competitor in this catalog currently holds? Defend with specific examples.

### 3.4 When you're stuck

- **Output sounds generic?** Re-prompt with: *"This sounds generic. Reread `_context/brand_voice.md` and `_context/brand_what_not_to_make.md` and rewrite, replacing every cliché with a specific claim, name, or number."*
- **Output is too long?** *"Cut by half. Keep the strongest specific claims; drop everything that could appear on any RIA's website."*
- **Wrong firms cited?** *"Use only firms tagged as small + fee-only + active management in `competitor_catalog.json`."*

---

## 4. What's in this catalog (one-paragraph map)

- **`Competitors/<Firm>/`** — 48 folders, one per competitor. Each has `1_Summary.md` (one-page brief), `2_Full_Profile.md` (deep dive), `metadata.json` (structured data), `Screenshots/`, raw site capture in `Source_Data/`, and (for 18 firms) a `Knowledge_From_Source/` corpus of ~297 markdown-converted blog posts.
- **`Summaries/summary_<Firm>/1_Summary.md`** — convenience mirror of every firm's summary in one folder, useful for cross-competitor reading without 48 cd's.
- **`00_Market_Overview/`** — `competitor_catalog.csv` + `.json` (every competitor's structured fields), `Head_to_Head_Matrix.md` (cross-cutting matrix), `pages_by_kind.json` (every page in the catalog tagged by kind: home / about / contact / services / pricing / blog_post / …).
- **`_context/`** — `brand_voice.md` + `brand_what_not_to_make.md` (USWM voice + anti-patterns), `our_thesis.md` (target segments + edge), `industry_frame.md` + `taxonomy.md` (category background + controlled vocabulary).
- **`tools/`** — TypeScript scripts that produced the research. Ignore unless you're maintaining the pipeline.

---

## 5. Rules of the road

**Do:**
- Edit drafts before shipping. Treat output as a strong first draft, not finished copy.
- Reference `brand_voice.md` + `brand_what_not_to_make.md` in every drafting prompt.
- Ask for citations.
- Commit useful drafts back to the repo if they belong here (e.g. in `00_Market_Overview/` strategy docs). Push to a feature branch and tell Karthik.

**Don't:**
- Paste sensitive client data into the prompt. Anything you type can end up in the conversation log.
- Edit `Competitors/*/metadata.json` directly without telling Karthik — those fields feed the catalog pipeline and need to stay consistent.
- Trust output that names specific dollar amounts, AUM figures, or market predictions without verifying against the cited source file.
- Expect real-time data. This is a snapshot; competitors update their sites constantly. Treat "as of" dates in the catalog as the truth.

---

## 6. Who to ask

- **Catalog data, adding a competitor, broken file, repo access:** Karthik
- **How Claude Code works, install issues, subscription limits:** [claude.com/claude-code](https://claude.com/claude-code) or type `/help` inside Claude Code
- **Brand voice questions, things to add to `_context/brand_voice.md`:** Karthik + brand owner

---

## 7. When you've used this enough to have opinions

The catalog is a living document. If you find:
- A prompt pattern that works well → add it to Section 3 above (PR to this file)
- A brand voice rule that's missing → add it to `_context/brand_voice.md`
- A competitor we should add → name it, drop the URL with Karthik
- Output sounding generic in a repeatable way → that's almost always a `_context/` gap; flag it
