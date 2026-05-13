/**
 * enrich-adv.ts
 *
 * Looks up a competitor in the SEC's Investment Adviser Public Disclosure
 * database (adviserinfo.sec.gov) and fills the `auto_filled.sec_iapd` section
 * of Competitors/{slug}/Source_Data/company_facts.json.
 *
 * What it fills (free, no auth):
 *   - legal name
 *   - CRD number and SEC number
 *   - headquarters (full address)
 *   - branch count
 *   - disciplinary disclosures flag (Y/N)
 *   - registration status (ACTIVE/INACTIVE)
 *   - DBAs and affiliated brand names
 *   - direct URL to the latest Form ADV PDF
 *
 * What it does NOT fill (yet):
 *   - AUM, employee count, founding date — these live in Form ADV Part 1A
 *     which is not exposed via JSON. To get them, parse the ADV PDF (URL
 *     above) or render the IAPD firm page with Playwright. Future work.
 *
 * Usage:
 *   npx tsx tools/enrich-adv.ts --slug Focus_Partners --name "Focus Partners"
 *   npx tsx tools/enrich-adv.ts --slug Focus_Partners --crd 159289
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const USER_AGENT = process.env.SEC_USER_AGENT ?? "Competitor Profiles karthik@miediai.com";
const SEARCH_URL = "https://api.adviserinfo.sec.gov/search/firm";

export interface EnrichOptions {
  slug: string;
  name?: string;
  crd?: string;
}

export interface EnrichResult {
  slug: string;
  matched: boolean;
  legalName: string | null;
  crd: string | null;
}

interface IapdHit {
  firm_source_id: string;
  firm_ia_sec_number?: string;
  firm_ia_full_sec_number?: string;
  firm_name: string;
  firm_other_names?: string[];
  firm_ia_scope?: string;
  firm_ia_disclosure_fl?: string;
  firm_branches_count?: number;
  firm_ia_address_details?: string;
}

export async function enrichAdv(opts: EnrichOptions): Promise<EnrichResult> {
  const { slug } = opts;
  const name = opts.name ?? slug.replace(/_/g, " ");
  const factsPath = join(ROOT, "Competitors", slug, "Source_Data", "company_facts.json");
  const rawPath = join(ROOT, "Competitors", slug, "Source_Data", "adv_raw.json");

  if (!existsSync(factsPath)) {
    throw new Error(
      `company_facts.json missing for ${slug}. Run extract first: tools/extract.ts --slug ${slug} --url ...`,
    );
  }

  console.log(`[enrich-adv] ${slug} (${opts.crd ? `CRD ${opts.crd}` : `name "${name}"`})`);

  const query = opts.crd ?? name;
  const results = await searchIapd(query);

  if (results.length === 0) {
    console.warn(`[enrich-adv] no IAPD hits for "${query}". Skipping.`);
    await markUnmatched(factsPath, query);
    return { slug, matched: false, legalName: null, crd: null };
  }

  const top = opts.crd
    ? results.find((r) => r.firm_source_id === opts.crd) ?? results[0]
    : pickBestMatch(results, name);

  if (!top) {
    console.warn(`[enrich-adv] hits returned but none confidently matched "${name}". Skipping.`);
    await markUnmatched(factsPath, name);
    return { slug, matched: false, legalName: null, crd: null };
  }

  console.log(`[enrich-adv] matched: ${top.firm_name} (CRD ${top.firm_source_id})`);

  await writeFile(rawPath, JSON.stringify({ query, top, all: results.slice(0, 10) }, null, 2));

  const facts = JSON.parse(await readFile(factsPath, "utf-8"));
  facts.auto_filled = facts.auto_filled ?? {};
  facts.auto_filled.sec_iapd = buildIapdSection(top);
  facts.last_updated = new Date().toISOString().slice(0, 10);

  await writeFile(factsPath, JSON.stringify(facts, null, 2));

  return {
    slug,
    matched: true,
    legalName: top.firm_name,
    crd: top.firm_source_id,
  };
}

async function searchIapd(query: string): Promise<IapdHit[]> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("size", "10");

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`IAPD search ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { hits?: { hits?: { _source: IapdHit }[] } };
  return (data.hits?.hits ?? []).map((h) => h._source);
}

function pickBestMatch(hits: IapdHit[], queryName: string): IapdHit | null {
  const q = normalize(queryName);
  const qTokens = q.split(/\s+/).filter((t) => t.length > 2);
  if (qTokens.length === 0) return null;

  // Score each candidate string (legal name + each DBA separately). A "good"
  // match is one where ALL query tokens are present in a SINGLE candidate
  // string — not scattered across multiple DBAs of the same firm.
  //
  // This rules out the failure mode where a multi-brand umbrella firm has
  // dozens of DBAs and any single overlap creates a false positive (the
  // Streamline / "Consolidated Portfolio Review Corp" case).
  let best: { hit: IapdHit; score: number; reason: string } | null = null;
  for (const hit of hits) {
    const allCandidates = [hit.firm_name, ...(hit.firm_other_names ?? [])].map(normalize);
    let bestSingle = 0;
    let bestSingleSource = "";
    for (const cand of allCandidates) {
      const present = qTokens.filter((t) => cand.includes(t)).length;
      if (present > bestSingle) {
        bestSingle = present;
        bestSingleSource = cand;
      }
    }
    // Bonus 5 pts for an exact normalized match in legal_name or any DBA
    const exact = allCandidates.includes(q);
    const score = (exact ? 5 : 0) + bestSingle;
    if (!best || score > best.score) {
      best = {
        hit,
        score,
        reason: exact
          ? `exact match: "${q}"`
          : `${bestSingle}/${qTokens.length} tokens in "${bestSingleSource}"`,
      };
    }
  }

  if (!best) return null;

  // Strict acceptance: require all query tokens present in a single candidate.
  // (Anything less is treated as ambiguous and rejected.)
  const requiredScore = qTokens.length; // bare tokens, no exact-match bonus
  const accepted = best.score >= requiredScore;
  if (!accepted) {
    console.warn(
      `[enrich-adv] best candidate "${best.hit.firm_name}" only matched ` +
        `${best.score}/${requiredScore} (${best.reason}). Rejecting as low confidence. ` +
        `Use --crd <number> to specify exact match if you know the CRD.`,
    );
    return null;
  }
  console.log(`[enrich-adv] match confidence: ${best.reason}`);
  return best.hit;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[,.()]/g, "")
    .replace(/\b(llc|inc|corp|company|co|ltd|lp|llp|plc)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildIapdSection(hit: IapdHit) {
  let hq: string | null = null;
  if (hit.firm_ia_address_details) {
    try {
      const parsed = JSON.parse(hit.firm_ia_address_details);
      const a = parsed.officeAddress ?? {};
      hq = [a.street1, a.street2, a.city, a.state, a.postalCode, a.country]
        .filter(Boolean)
        .join(", ");
    } catch {
      hq = null;
    }
  }

  const crd = hit.firm_source_id;
  return {
    matched: true,
    legal_name: hit.firm_name,
    crd_number: crd,
    sec_number: hit.firm_ia_full_sec_number ?? hit.firm_ia_sec_number ?? null,
    headquarters: hq,
    branch_count: hit.firm_branches_count ?? null,
    disciplinary_disclosures: hit.firm_ia_disclosure_fl === "Y",
    registration_status: hit.firm_ia_scope ?? null,
    dbas_and_affiliates: (hit.firm_other_names ?? []).filter((n) => n !== hit.firm_name),
    adv_pdf_url: `https://reports.adviserinfo.sec.gov/reports/ADV/${crd}/PDF/${crd}.pdf`,
    iapd_profile_url: `https://adviserinfo.sec.gov/firm/summary/${crd}`,
  };
}

async function markUnmatched(factsPath: string, query: string) {
  const facts = JSON.parse(await readFile(factsPath, "utf-8"));
  facts.auto_filled = facts.auto_filled ?? {};
  facts.auto_filled.sec_iapd = {
    matched: false,
    queried_as: query,
    note: "No confident IAPD match. Either this competitor isn't a US-registered RIA, or the firm name needs disambiguation — retry with --crd <number>.",
  };
  facts.last_updated = new Date().toISOString().slice(0, 10);
  await writeFile(factsPath, JSON.stringify(facts, null, 2));
}

// CLI entry
const isCli = import.meta.url === `file://${process.argv[1]}`;
if (isCli) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.slug) {
    console.error("Usage: tsx tools/enrich-adv.ts --slug <Slug> [--name <Name>] [--crd <CRD>]");
    process.exit(1);
  }
  enrichAdv({ slug: args.slug, name: args.name, crd: args.crd }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      out[key] = val;
    }
  }
  return out;
}
