# Context

Standing context the analyzer reads on every run, and the conventions reviewers follow when writing profiles by hand. Edit these as the strategy sharpens.

- **`our_thesis.md`** — who we want to serve, what edge we think we have, what's off the table. The lens every competitor is read through. Two target segments: early-adults setting up first investment accounts, and 40-50 mid-career 401(k) holders.
- **`industry_frame.md`** — what we know about the wealth-management / financial-planning category. Patterns to look for, what "good" looks like, what to flag.
- **`taxonomy.md`** — controlled vocabulary that every `metadata.json` must conform to: `competitor_type` buckets, the four-axis threat-level rubric (Reach × Segment overlap × Momentum × Capital backing, summed and banded into low / medium / medium-high / high), `regulatory_jurisdiction` + `regulator` conventions, canonical `positioning_claims` / `vulnerabilities` / `tags` lists, and the entity-type field-applicability rules (which fields apply to which `competitor_type`).

These files are inputs to `tools/analyze.ts`, and the reference document for hand-written profile reviews. They shape the analysis without having to be re-stated in every prompt or every editing pass. If a profile starts drifting from the standing voice, the fix is usually here, not in the profile.
