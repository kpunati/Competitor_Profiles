---
competitor: Asset Map (Asset-Map, Inc.)
website: https://www.asset-map.com/
competitor_type: b2b_network
threat_level: low
confidence: high
last_updated: 2026-05-13
next_review_by: 2026-11-09
review_cadence_days: 180
---

# Asset Map — Full Profile (Stub)

For a B2B SaaS that isn't a competitor we encounter prospect-side, the substance worth capturing fits in [`1_Summary.md`](./1_Summary.md). This stub preserves the schema convention and points to the cross-references that matter.

## Why this profile exists

- **Vendor adjacency, not competitor**. Asset Map appears on the [Intrepid Wealth Partners](../Intrepid_Wealth_Partners/2_Full_Profile.md) homepage as a named tech-stack component. We profile vendors when they're material to understanding what a sophisticated competitor's tech stack looks like, or when they're a tool we'd ourselves evaluate.
- **B2B SaaS reference set**. Alongside [Couplr_AI](../Couplr_AI/2_Full_Profile.md) (advisor-matching marketplace) and [Kitces](../Kitces/1_Summary.md) (education platform), Asset Map gives us a triangulation point for the advisor-side B2B layer — what advisors are paying for, how those tools position, and what the procurement signals look like.
- **Pricing-page benchmark**. Tier-priced, dollar-anchored, with feature deltas and a "Most Popular" tier. The cleanest fee-transparent SaaS execution in our catalog.

## Quick reference

| | |
|---|---|
| Legal name | Asset-Map, Inc. |
| HQ | 533 East Girard Avenue, Suite 99114, Philadelphia, PA 19125 |
| Phone | 888-664-8850 (multi-time-zone US support) |
| Email | sales@asset-map.com · support@asset-map.com |
| App | https://app.asset-map.com/ampux/auth |
| Demo | https://www.asset-map.com/schedule-a-demo (multi-step, role-segmented) |
| Pricing | Professional $1,699/yr · Elite $2,269/yr · Firm custom — 5% off annual billing · 30-day money-back guarantee |
| Customer types | Broker-Dealer Advisor · RIA · Hybrid RIA · Bank/Credit Union Advisor · Back Office/Operational |
| Operational scale claims | 2.14M people mapped · $1.6T in financial instruments mapped · "30% revenue increase for new advisors" (marketing claim, unsourced) |
| Compliance | SOC 2 Type II certified · FINRA-compliant · SEC-compliant |
| International | UK/Europe · Africa · India/Asia-Pacific (regional landing pages) |
| Recognition (recent) | 2026 WealthTech100 by FinTech Global (April 8, 2026) |
| Integration partners | "Open architecture" with eMoney, MoneyGuidePro, and other advisor tools (specific integration list at `/product/integrations`) |

## Product framework (6 named features)

The six-question planning model surfaces as named product modules:

- **Who** → Relationship Maps (financial connections + people)
- **Why** → Priorities (client values + intentions)
- **What/Where** → The Asset-Map (single-page life inventory)
- **If** → Signals (risk and gap detection)
- **When** → Target-Maps (timeline and funding gaps)
- **How** → Drafts (before-and-after scenario presentation)

## Named-firm testimonials (8 captured)

All testimonials carry name + full credentialing alphabet soup + firm name. The strongest attribution format in our catalog.

- Martin V. Higgins, CFP®, ChFC®, CLU®, AEP®, LUTCF®, RHU® — President, Family Wealth Management, LLC
- Molly Ward, CFP®, CDFA® — Founder, Well Lived Wealth, LLC
- Jack Choi — Senior Commercial Finance Business Partner, JATO Dynamics
- Megan Takagi, CFP® — Director of Business Development, Takagi & Takagi
- Kristopher Grossman, CFP® — Lead Financial Advisor, Kingsbridge Financial Group, Inc.
- Mark J. Dorman, AIF®, CLU®, ChFC®, CEPA, CFBS — President, Dorman Legacy Advisors
- Henry A. Swan, ChFC, CLU — Financial Consultant, Optimal Planning Partners, Inc.
- Michael P. Gainer, AIF® — Partner, Integrated Financial Strategies, Inc.

## Pipeline note (bug to fix)

The `tools/enrich-adv.ts` pickBestMatch incorrectly matched "Asset Map" against "**SUGAR MAPLE ASSET MANAGEMENT, LLC**" (CRD 282632) on this refresh, treating the match as 2/2-token confident. The actual token correspondence was *Asset/Asset* + *Map/Maple*, which is prefix-fuzz rather than equality. The false-positive Form ADV pull was deleted, the IAPD block in `Source_Data/company_facts.json` was manually cleared, and the metadata was rewritten to reflect Asset-Map's actual non-RIA SaaS status. This is the **second** false-positive in the pipeline ([Streamline_Planning](../Streamline_Planning/metadata.json) was the first, where "Streamline Planning" matched an unrelated NY DBA umbrella). Fix: pickBestMatch should require exact whole-word token equality before claiming N/N confidence.

## Captured pages

- [Homepage](./Source_Data/pages/home.html)
- [Pricing](./Source_Data/pages/pricing.html)
- [About](./Source_Data/pages/about.html)
- [Blog](./Source_Data/pages/blog.html)
- [Contact](./Source_Data/pages/contact.html)

**Confidence**: high on observable site facts (pricing tiers, named testimonials, product modules, regional presence, compliance posture). Low on private company-financial detail (revenue, headcount, ARR, growth rate, ownership / funding history) — none of which is published.
