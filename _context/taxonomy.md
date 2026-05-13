# Taxonomy

The controlled vocabulary every competitor profile is tagged against. Used by `metadata.json` files and consumed by the (planned) query/index layer. Free-form tags fragment within ten profiles; this file is what keeps the catalog actually queryable.

*Last updated: 2026-05-11.*

---

## Threat-level rubric

`threat_level` is scored across four axes, 1-3 each. Sum is mapped to a band.

| Axis | 1 | 2 | 3 |
|---|---|---|---|
| **Reach** — how many of our prospects could find them | Local / niche / sub-1M monthly visits | Regional / 1-10M visits | National / household-name / 10M+ visits |
| **Segment overlap** — how many of *our* target segments they actively serve | One or none, peripherally | One, well | Both early-adult and mid-career 401(k), well |
| **Momentum** — direction over last 24 months (AUM, headcount, branches) | Flat or shrinking | Modest growth | Visible expansion / acquisitions / launches |
| **Capital backing** — resources to outspend a new entrant | Bootstrapped / solo | Profitable, modest team | PE-backed, public, or VC-backed at scale |

Sum → band:

- 4-5 → `low`
- 6-7 → `medium`
- 8-9 → `medium-high`
- 10-12 → `high`

Record the axis scores in the profile's "How big a threat" paragraph so the rating is reproducible. If two analysts can't reach the same band from the same evidence, the rubric needs to tighten — log the disagreement in the findings log (see roadmap in `README.md`).

---

## `regulatory_jurisdiction` and `regulator`

Captures *where* a firm is regulated, so the catalog is jurisdiction-aware and so analysts know whether a null `aum_usd` means "we haven't pulled the ADV yet" vs. "no ADV exists for this jurisdiction."

### `regulatory_jurisdiction` — controlled vocab

| Value | Meaning |
|---|---|
| `US` | US-regulated (SEC or state) |
| `CA` | Canada-regulated (CIRO, CSA member, provincial) |
| `UK` | UK-regulated (FCA, PRA) |
| `AU` | Australia-regulated (ASIC) |
| `EU` | EU-regulated (national member-state regulator under MiFID II) |
| `multiple` | Operates in multiple jurisdictions; record the primary regulator(s) in `regulator` |
| `none` | Not a regulated financial entity (content platforms, networks-as-software, education businesses) |

### `regulator` — free-form, specific

Captures the actual regulator(s). Examples seen so far:

- `SEC` — federal US registration above the $100M AUM threshold
- `state (Michigan)` — US state-registered RIA below the SEC threshold
- `CIRO + FSRA + AMF` — Canadian firm with federal SRO + multiple provincial bodies (PWL pattern)
- `FCA` — UK
- `ASIC` — Australia
- `none` — for content platforms (Kitces) and entities that ride on a third-party RIA's registration (Streamline rides on LaSalle St. — set their `regulator` to `none` and note the relationship in `regulatory_note`)
- `multiple` — used when a firm operates in several jurisdictions and naming each is unwieldy; expand in `regulatory_note`

### `regulatory_note` — when to fill

Use whenever the standard ADV-grade dataset isn't available *because of jurisdiction* (vs. simply not yet pulled). For US SEC-registered firms where we ran `enrich-adv-pdf.ts` successfully, leave null. For everyone else, a one-sentence note that tells a future analyst what to expect: *"Canadian firm — AUM not centrally disclosed; site states $7B+ CAD across 2,700 client families"* or *"Streamline does not hold its own RIA registration; advisory services are provided through LaSalle St. Investment Advisors LLC."*

### Field applicability by jurisdiction

Once we have non-US firms, the existing `aum_usd`, `advisor_count`, `employee_count`, etc. fields still apply — but the *source* changes:

| Field | US (ADV) | Canada (NRD) | UK (FCA + Companies House) |
|---|---|---|---|
| `aum_usd` | ADV Item 5.F.2.c | Not centrally disclosed — site-stated if available | FCA: not standard. Companies House: derivable from total assets / AUM disclosure if firm above small-company threshold |
| `advisor_count` | ADV 5.B.1 | NRD individual registrants count | FCA Register: count of approved persons |
| `employee_count` | ADV 5.A | Not in NRD — site-stated | Companies House: filed accounts (free API) |
| `branch_count` | ADV 1.F | NRD branch registrations | FCA: not standard, often on firm site |
| `disciplinary_disclosures` | IAPD `firm_ia_disclosure_fl` | CIRO + CSA disciplined-list lookup | FCA Register status + final notices |

The pipeline's `enrich-adv-pdf.ts` is US-only. Non-US enrichers will be built as the catalog accumulates ≥2 firms per jurisdiction.

---

## `competitor_type` — the entity-type bucket

Already defined in the `_template/metadata.json` schema. Repeated here for cross-reference:

`wealth_mgmt_traditional | wealth_mgmt_content_led | wealth_mgmt_solo | wealth_mgmt_tax_specialty | robo_advisor | bank_or_wirehouse | education_platform | b2b_network | finance_coach | tax_or_cpa_firm`

### Entity-type applicability

Not every field applies to every entity. Leave non-applicable fields `null` rather than inventing values.

| Field group | RIA types (traditional / solo / tax_specialty / content_led) | robo_advisor | bank_or_wirehouse | education_platform / b2b_network / finance_coach |
|---|---|---|---|---|
| `sec_registered`, `crd_number`, `sec_number` | **required** | required | required | usually null |
| `aum_usd`, `aum_as_of` | **required** (Form ADV Item 5.F) | required | required | null |
| `advisor_count`, `employee_count`, `branch_count` | **required** (ADV 5.B, 5.A, 1.F) | required | required where disclosed | substitute equivalents |
| `fee_aum_pct_*`, `fee_flat_*`, `min_account_usd` | **required if disclosed** (ADV Part 2A) | required | typically not disclosed | null — different revenue model |
| `disciplinary_disclosures`, `disciplinary_disclosure_count` | **required** (IAPD + ADV) | required | required | null unless applicable |
| `wealth_tiers_served`, `segment_*` | required | required | required | required |
| `positioning_claims`, `vulnerabilities`, `tags` | required | required | required | required |
| `trajectory.aum_history` | required (≥3 ADV snapshots) | required | required | null — substitute subscriber/audience metrics in `notable_events` |

For non-RIA entities, the **substitute trajectory metrics** belong in `trajectory.notable_events` as dated entries (e.g. *"newsletter list crossed 50k"*, *"podcast hit 500 episodes"*, *"raised Series B"*).

---

## `positioning_claims` — canonical vocabulary

What the competitor claims about themselves on their site. Use these tags; if a new one is truly needed, add it here first and link the PR-equivalent in the findings log.

| Tag | Meaning |
|---|---|
| `fee_only` | Compensated only by client fees, no commissions |
| `fiduciary` | Explicit fiduciary claim in site copy |
| `independent` | Not tied to a broker-dealer's product shelf |
| `independent_employee_owned` | Owned by employees, not outside capital |
| `modern_tech` | Claims to use modern tooling — verified (visible on site) |
| `modern_tech_asserted` | Claims modern tooling without showing it |
| `comprehensive` | "Holistic / comprehensive financial planning" pitch |
| `advice_only_no_products` | Sells advice, refuses commissioned product sales |
| `transparent_pricing` | Publishes fee schedule on the public site |
| `tax_specialty` | Leads with tax planning as the differentiator |
| `niche_specialist` | Targets one named profession or life-stage |
| `segment_specific` | Differentiates messaging by client segment |
| `content_led` | Marketing engine is publication / podcast / YouTube |
| `personality_led` | Brand built around a single named founder |
| `boutique` | Positions on smallness / high-touch |
| `national_scale` | Positions on size / reach |
| `no_outside_investors` | Explicitly anti-PE / anti-VC positioning |
| `pe_backed_positioning` | Positions PE backing as a feature (rare) |
| `evidence_based` | Positions on data / academic rigor / behavioral-finance discipline |
| `contrarian_vs_conventional` | Explicitly positions against mainstream advice |
| `anti_tiering` | Refuses to tier service quality by wealth — explicit "same service for every client" claim |
| `category_shaping` | Sets the vocabulary the rest of the field uses (publications, research, conferences) |
| `editorial_independence` | Promises no sponsored/paid content influence |
| `named_byline_content` | Content attributed to individual humans, not anonymous "our team" |
| `b2b_advisor_focused` | Addresses advisors, not retail consumers, as the primary audience |
| `gen_xy_focus` | Generational targeting — Gen X and millennial-era clients |
| `two_customer_architecture` | Brand serves B2B and B2C audiences on the same site without confusion |

## `vulnerabilities` — canonical vocabulary

What a focused new entrant could exploit. Same discipline — pick from the list, add new ones here first.

| Tag | Meaning |
|---|---|
| `no_segment_specific_messaging` | One message for all segments |
| `no_early_adult_surface` | No content/funnel for 25-35 first-time investors |
| `no_401k_specific_funnel` | No rollover / held-away-401(k) story |
| `no_modern_tech_visible` | No client portal, no dashboard, no software demo |
| `modern_tech_asserted_not_shown` | Tech claim made but not demonstrated |
| `wix_template_site` | Marketing site is on a low-end template |
| `pe_ownership_vulnerable` | PE backing can be attacked by independent firms |
| `disciplinary_history` | Has any disclosure on file |
| `no_fee_transparency` | Pricing entirely gated |
| `opaque_pricing` | Pricing exists but is hard to find |
| `single_practitioner_capacity` | Solo advisor — capacity ceiling around 50-80 clients |
| `opaque_team` | No team page or anonymous bylines |
| `mixed_revenue_with_commissions` | Not purely fee-only |
| `voice_fragility_typos` | Visible typos / unprofessional copy |
| `no_testimonials` | Not using SEC 2021-rule testimonial latitude |
| `dated_visual_identity` | Looks like a 2010s site in 2026 |
| `geographic_concentration` | Local presence dependency |
| `key_person_risk` | Brand dependent on one named individual |

## `tags` — cross-cutting attributes

Free-from-the-other-two-lists attributes useful for querying. Use these for filters like "show me all PE-backed firms" or "all content-led practitioners."

`pe_backed`, `bootstrapped`, `vc_backed`, `public_company`, `employee_owned`, `founder_led`, `solo_advisor`, `multi_advisor`, `national_aggregator`, `roll_up`, `regional`, `local`, `consumer_facing`, `b2b_facing`, `dual_facing`, `cfp_credentialed`, `cpa_credentialed`, `aif_credentialed`, `jd_llm_credentialed`, `xy_planning_member`, `napfa_member`, `flat_fee`, `aum_fee`, `subscription_fee`, `membership_fee`, `hybrid_fee`, `state_registered_ria`, `not_sec_registered`, `canadian_ria`, `clean_regulatory_record`, `has_disciplinary_disclosures`, `media_personality_led`, `wix_or_template_site`, `content_engine`

---

## Maintenance

- **Adding a new tag**: edit this file first, then use it. If you find yourself wanting a one-off tag, that's a signal it probably belongs here permanently.
- **Renaming a tag**: requires a sweep across all `metadata.json` files — coordinate before doing it.
- **Pruning a tag**: only remove if zero profiles currently use it (check with `grep -r "tag_name" Competitors/*/metadata.json`).
- This taxonomy is the schema for the planned `_index.json` query layer (see roadmap in main `README.md`). Drift between profiles and this file is what kills queryability — keep them aligned.
