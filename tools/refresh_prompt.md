# Refresh prompt

The standing instruction for refreshing stale competitor profiles. Paste this into Claude Code (or any agent with file-system access to this repo) when the refresh cadence comes due. The default cadence is 90 days per profile — see `next_review_by` in each `metadata.json`.

This is currently a **manual trigger**. The plan is to graduate to a scheduled task (and eventually a diff-aware refresh script) — see the Roadmap section of the main `README.md`.

---

## The prompt

Copy everything between the lines below into a fresh Claude Code session in this project folder.

---

You're refreshing the competitor research catalog. The working directory is `Competitor_Profiles/`. Today is `{TODAY}`.

**Step 1 — find what's stale.** Walk `Competitors/*/metadata.json` and list every profile where `next_review_by` is `null`, missing, or earlier than today. Report the list before doing anything else, including for each entry:
- the competitor slug
- the current `last_updated` and `next_review_by`
- the `threat_level` (so high-threat ones are refreshed first)
- whether they currently have a populated `trajectory` block or not

**Step 2 — process them one by one, highest threat first.** For each stale profile:

1. **Re-run the data pipeline** for that competitor:
   - `tools/extract.ts {slug}` — re-capture website pages and screenshots (use the `tools/extract-{slug}.ts` wrapper if one exists, e.g. for Wix-built sites — see the Advize pipeline-issues note)
   - `tools/enrich-adv.ts {slug}` — pull the latest Form ADV Part 1A and Part 2A. Extract: AUM, advisor count, employee count, branch count, fee schedule, account minimums, new disciplinary disclosures, ownership changes.
   - For non-RIA entities (`competitor_type` is `b2b_network`, `education_platform`, `finance_coach`, etc.), skip the ADV step and substitute the relevant data sources defined in `_context/taxonomy.md § Entity-type applicability`.

2. **Produce a diff report** — *do not* rewrite the profile yet. Compare the freshly-extracted data against the existing `metadata.json` and produce a short delta:
   - What changed in AUM / headcount / branches?
   - Any new disciplinary disclosures?
   - Any new positioning_claims or vulnerabilities visible on the site?
   - Any structural changes to the site (new nav items, new pricing surface, new segments addressed)?
   - Output as `Competitors/{slug}/_refresh_diff_{TODAY}.md` so it's reviewable.

3. **Decide whether a profile rewrite is warranted.** Use these rules:
   - No material change → just bump `last_updated` and `next_review_by` in `metadata.json`. Don't touch the `.md` files. Note "no material change" in the diff report.
   - Numbers changed but narrative still holds → update `metadata.json` numerics + append a new entry to `trajectory.*_history`. Add a one-line "Refreshed {date}" note to the Trajectory section of `2_Full_Profile.md`.
   - Narrative changed (new positioning, new segments addressed, new vulnerabilities, ownership change, new disclosure) → rewrite the affected sections of `2_Full_Profile.md` and `1_Summary.md`. Preserve the rest verbatim. Update `metadata.json` accordingly.

4. **Always update:**
   - `last_updated` → today
   - `next_review_by` → today + `review_cadence_days` (default 90; shorter for high-threat competitors per `_context/taxonomy.md`)
   - Append to `trajectory.aum_history` (and similar) if a fresh ADV snapshot was pulled.

**Step 3 — log the refresh batch.** After processing all stale profiles, append a single dated entry to `_context/findings_log.md` (create the file if it doesn't exist) summarising: how many profiles refreshed, how many had material changes, any cross-cutting observations worth surfacing to the team.

**Step 4 — surface anything that should retrigger the broader analysis.** If you find that a refresh materially changes one of the conclusions in `00_Market_Overview/`, flag it explicitly — those summary files are downstream of the individual profiles and need a human decision on whether to refresh them.

**What NOT to do:**
- Do not refresh profiles that are not yet stale (`next_review_by` > today). Touching fresh profiles unnecessarily creates noise in the audit trail.
- Do not delete or restructure profile sections — only add or update.
- Do not invent ADV data. If the manual ADV pull fails, mark the field `null` and add it to the profile's Open Questions section.
- Do not regenerate `00_Market_Overview/` files automatically. Those require a human pass after the underlying profiles are refreshed.

---

## How to graduate this to automation

Three escalation tiers (currently at Tier 1):

1. **Tier 1 (today) — manual trigger.** A human pastes this prompt every quarter.
2. **Tier 2 — scheduled trigger.** Wire this prompt into a scheduled task that fires every Monday morning. The agent will find nothing to do most weeks, then pick up the few profiles whose `next_review_by` has come due. Setup: a single cron-style scheduled task in Claude Code or a `crontab` entry pointing at a CLI invocation of the same prompt.
3. **Tier 3 — diff-aware refresh script.** A `tools/refresh.ts` that mechanically does Steps 1-2 above (find stale, pull fresh data, write the diff), and then **only** invokes the agent for Step 3 (narrative judgement on whether to rewrite). This is the right end state — agents are slow and expensive for pipeline work, fast and cheap for judgement calls. Worth building when the catalog crosses ~15-20 profiles.
