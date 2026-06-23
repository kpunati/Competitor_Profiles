# Context

Standing context the analyzer reads on every run, and the conventions reviewers follow when writing profiles by hand. Edit these as the strategy sharpens.

- **`our_thesis.md`** — who we want to serve, what edge we think we have, what's off the table. The lens every competitor is read through. Two target segments: early-adults setting up first investment accounts, and 40-50 mid-career 401(k) holders.
- **`industry_frame.md`** — what we know about the wealth-management / financial-planning category. Patterns to look for, what "good" looks like, what to flag.
- **`taxonomy.md`** — controlled vocabulary that every `metadata.json` must conform to: `competitor_type` buckets, the four-axis threat-level rubric (Reach × Segment overlap × Momentum × Capital backing, summed and banded into low / medium / medium-high / high), `regulatory_jurisdiction` + `regulator` conventions, canonical `positioning_claims` / `vulnerabilities` / `tags` lists, and the entity-type field-applicability rules (which fields apply to which `competitor_type`).
- **`brand_voice.md`** — United Success brand brief. Team, three convictions ("the trend is your friend" / "risk first, returns second" / "if we're not a fit, we'll tell you"), investment vocabulary, voice rules, signature phrases, words to avoid. Used by the query tool to ensure any drafted output sits in the firm's voice.
- **`brand_what_not_to_make.md`** — companion negative-space guide. Visual clichés, verbal clichés, structural anti-patterns, tone anti-patterns to avoid when producing material in the firm's voice. Pair with `brand_voice.md`.
- **`patterns_to_borrow.md`** — curated, action-oriented extract of the catalog's highest-leverage tactical patterns (pricing tier structures, homepage heroes, voice & narrative moves, funnel structures, service-line positioning, founder stories) with the citing competitor file path for each. Used by the `/borrow-pattern` slash command and as a fast lookup when drafting USWM material.

These files are inputs to `tools/analyze.ts`, and the reference document for hand-written profile reviews. They shape the analysis without having to be re-stated in every prompt or every editing pass. If a profile starts drifting from the standing voice, the fix is usually here, not in the profile.

The two `brand_*.md` files are the reference any generative-output tool (the planned `tools/query.ts` or a Claude Project) reads alongside the competitor catalog to make sure drafted contact pages, services copy, and rewrites sound like United Success — not a generic RIA.
