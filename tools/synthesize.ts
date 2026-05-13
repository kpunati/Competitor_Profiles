/**
 * synthesize.ts
 *
 * Reads every Competitors/{slug}/metadata.json file and produces:
 *   - 00_Market_Overview/competitor_catalog.csv   (Notion-import-ready)
 *   - 00_Market_Overview/competitor_catalog.json  (full data dump)
 *   - 00_Market_Overview/Head_to_Head_Matrix.md   (auto-populated from metadata)
 *
 * Re-run after every meaningful batch of new profiles. Each run overwrites
 * the catalog files; the prose docs in 00_Market_Overview/ (Executive
 * Briefing, Where We Should Play, etc.) are NOT touched.
 *
 * Usage:
 *   npx tsx tools/synthesize.ts
 */

import { readFile, readdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const COMPETITORS_DIR = join(ROOT, "Competitors");
const OVERVIEW_DIR = join(ROOT, "00_Market_Overview");

interface Metadata {
  competitor: string;
  slug: string;
  summary_line: string | null;
  website: string | null;
  competitor_type: string | null;
  threat_level: string | null;
  confidence: string | null;
  last_updated: string | null;
  next_review_by: string | null;
  review_cadence_days: number | null;

  team_size: string | null;
  advisor_count: number | null;
  employee_count: number | null;
  branch_count: number | null;
  geographic_scope: string | null;
  headquarters_city: string | null;
  headquarters_state: string | null;

  aum_usd: number | null;
  aum_as_of: string | null;

  pricing_model: string | null;
  fee_schedule_published: boolean | null;
  fee_aum_pct_low: number | null;
  fee_aum_pct_high: number | null;
  fee_flat_low_usd: number | null;
  fee_flat_high_usd: number | null;
  min_account_usd: number | null;

  wealth_tiers_served: string[];

  segment_early_adults: string | null;
  segment_mid_career_401k: string | null;

  regulatory_jurisdiction: string | null;
  regulator: string | null;
  regulatory_note: string | null;
  sec_registered: boolean | null;
  crd_number: string | null;
  sec_number: string | null;
  ownership_structure: string | null;
  fiduciary_stated_explicitly: boolean | null;
  fee_only_stated_explicitly: boolean | null;
  disciplinary_disclosures: boolean | null;
  disciplinary_disclosure_count: number | null;

  media_presence: string | null;
  design_tone: string | null;

  positioning_claims: string[];
  vulnerabilities: string[];
  tags: string[];
  related_competitors: string[];

  trajectory?: {
    aum_history?: { as_of: string; value_usd: number; source: string }[];
    advisor_count_history?: { as_of: string; value: number; source: string }[];
    employee_count_history?: { as_of: string; value: number; source: string }[];
    branch_count_history?: { as_of: string; value: number; source: string }[];
    notable_events?: { date: string; event: string; source: string }[];
  };
}

const CSV_COLUMNS: { key: keyof Metadata; header: string; type: "text" | "list" | "number" | "bool" }[] = [
  { key: "competitor", header: "Competitor", type: "text" },
  { key: "slug", header: "Slug", type: "text" },
  { key: "summary_line", header: "Summary", type: "text" },
  { key: "website", header: "Website", type: "text" },
  { key: "competitor_type", header: "Type", type: "text" },
  { key: "threat_level", header: "Threat", type: "text" },
  { key: "confidence", header: "Confidence", type: "text" },
  { key: "team_size", header: "Team size", type: "text" },
  { key: "advisor_count", header: "Advisors", type: "number" },
  { key: "employee_count", header: "Employees", type: "number" },
  { key: "branch_count", header: "Branches", type: "number" },
  { key: "geographic_scope", header: "Geography", type: "text" },
  { key: "headquarters_city", header: "HQ city", type: "text" },
  { key: "headquarters_state", header: "HQ state", type: "text" },
  { key: "aum_usd", header: "AUM (USD)", type: "number" },
  { key: "aum_as_of", header: "AUM as of", type: "text" },
  { key: "pricing_model", header: "Pricing model", type: "text" },
  { key: "fee_schedule_published", header: "Fee schedule published", type: "bool" },
  { key: "fee_aum_pct_low", header: "AUM fee low (decimal)", type: "number" },
  { key: "fee_aum_pct_high", header: "AUM fee high (decimal)", type: "number" },
  { key: "fee_flat_low_usd", header: "Flat fee low (USD)", type: "number" },
  { key: "fee_flat_high_usd", header: "Flat fee high (USD)", type: "number" },
  { key: "min_account_usd", header: "Min account (USD)", type: "number" },
  { key: "wealth_tiers_served", header: "Wealth tiers", type: "list" },
  { key: "segment_early_adults", header: "Serves early adults", type: "text" },
  { key: "segment_mid_career_401k", header: "Serves mid-career 401k", type: "text" },
  { key: "regulatory_jurisdiction", header: "Jurisdiction", type: "text" },
  { key: "regulator", header: "Regulator", type: "text" },
  { key: "sec_registered", header: "SEC registered", type: "bool" },
  { key: "crd_number", header: "CRD", type: "text" },
  { key: "sec_number", header: "SEC#", type: "text" },
  { key: "ownership_structure", header: "Ownership", type: "text" },
  { key: "fiduciary_stated_explicitly", header: "Fiduciary stated", type: "bool" },
  { key: "fee_only_stated_explicitly", header: "Fee-only stated", type: "bool" },
  { key: "disciplinary_disclosures", header: "Disciplinary disclosures", type: "bool" },
  { key: "disciplinary_disclosure_count", header: "Disciplinary count", type: "number" },
  { key: "media_presence", header: "Media presence", type: "text" },
  { key: "design_tone", header: "Design tone", type: "text" },
  { key: "positioning_claims", header: "Positioning claims", type: "list" },
  { key: "vulnerabilities", header: "Vulnerabilities", type: "list" },
  { key: "tags", header: "Tags", type: "list" },
  { key: "related_competitors", header: "Related competitors", type: "list" },
  { key: "last_updated", header: "Last updated", type: "text" },
  { key: "next_review_by", header: "Next review by", type: "text" },
  { key: "review_cadence_days", header: "Cadence (days)", type: "number" },
];

async function loadAllMetadata(): Promise<Metadata[]> {
  const entries = await readdir(COMPETITORS_DIR, { withFileTypes: true });
  const all: Metadata[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith("_")) continue; // skip _template/
    const metaPath = join(COMPETITORS_DIR, e.name, "metadata.json");
    if (!existsSync(metaPath)) {
      console.warn(`[synthesize] no metadata.json for ${e.name} — skipping`);
      continue;
    }
    try {
      const data = JSON.parse(await readFile(metaPath, "utf-8"));
      // Strip the _schema documentation block before treating as data
      delete (data as any)._schema;
      all.push(data as Metadata);
    } catch (err) {
      console.warn(`[synthesize] bad metadata.json for ${e.name}: ${(err as Error).message}`);
    }
  }
  // Sort by threat (high → low), then alphabetical
  const threatRank: Record<string, number> = {
    high: 0,
    "medium-high": 1,
    medium: 2,
    low: 3,
  };
  all.sort((a, b) => {
    const ar = threatRank[a.threat_level ?? "low"] ?? 99;
    const br = threatRank[b.threat_level ?? "low"] ?? 99;
    if (ar !== br) return ar - br;
    return (a.competitor ?? "").localeCompare(b.competitor ?? "");
  });
  return all;
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvCell(value: unknown, type: "text" | "list" | "number" | "bool"): string {
  if (value === null || value === undefined) return "";
  if (type === "list") {
    if (!Array.isArray(value)) return "";
    // Notion's CSV import accepts comma-separated multi-select values inside a quoted cell
    return csvEscape((value as string[]).join(", "));
  }
  if (type === "number") {
    return value === "" ? "" : String(value);
  }
  if (type === "bool") {
    if (value === null) return "";
    return value ? "true" : "false";
  }
  return csvEscape(String(value));
}

function buildCsv(rows: Metadata[]): string {
  const header = CSV_COLUMNS.map((c) => csvEscape(c.header)).join(",");
  const body = rows
    .map((r) =>
      CSV_COLUMNS.map((c) => csvCell((r as any)[c.key], c.type)).join(","),
    )
    .join("\n");
  return header + "\n" + body + "\n";
}

function shortName(competitor: string): string {
  // Strip common suffixes for matrix column headers
  return competitor
    .replace(/, LLC$/i, "")
    .replace(/, Inc\.?$/i, "")
    .replace(/\s+Wealth\s+Management$/i, "")
    .replace(/\s+\(.*\)$/, "")
    .trim();
}

function buildMatrix(rows: Metadata[]): string {
  const cols = rows.map((r) => shortName(r.competitor));
  const lines: string[] = [];

  lines.push("# Head-to-Head Matrix");
  lines.push("");
  lines.push(
    `*Auto-generated by \`tools/synthesize.ts\` from each competitor's \`metadata.json\`. Re-run after every batch of new profiles. Generated ${new Date().toISOString().slice(0, 10)}.*`,
  );
  lines.push("");
  lines.push("## How to read this");
  lines.push("");
  lines.push(
    "Each column is a profiled competitor. Each row is a dimension we care about for our entry. Cells use the controlled vocabulary from `metadata.json` — see the schema there for definitions. Hand-written analysis lives in each competitor's `2_Full_Profile.md`; this page is the structured cross-cut.",
  );
  lines.push("");

  const matrixSections: { title: string; rows: { label: string; values: (m: Metadata) => string }[] }[] = [
    {
      title: "Threat & confidence",
      rows: [
        { label: "Threat level", values: (m) => m.threat_level ?? "—" },
        { label: "Confidence", values: (m) => m.confidence ?? "—" },
        { label: "Competitor type", values: (m) => m.competitor_type ?? "—" },
      ],
    },
    {
      title: "Scale & scope",
      rows: [
        { label: "Team size", values: (m) => m.team_size ?? "—" },
        { label: "Branches", values: (m) => m.branch_count?.toString() ?? "—" },
        { label: "Geography", values: (m) => m.geographic_scope ?? "—" },
      ],
    },
    {
      title: "Pricing",
      rows: [
        { label: "Pricing model", values: (m) => m.pricing_model ?? "—" },
        { label: "Fee schedule public", values: (m) => boolStr(m.fee_schedule_published) },
        { label: "Wealth tiers", values: (m) => (m.wealth_tiers_served ?? []).join(", ") || "—" },
      ],
    },
    {
      title: "Our target segments",
      rows: [
        { label: "Early adults (first investment)", values: (m) => m.segment_early_adults ?? "—" },
        { label: "Mid-career 401(k)", values: (m) => m.segment_mid_career_401k ?? "—" },
      ],
    },
    {
      title: "Regulatory / structure",
      rows: [
        { label: "Jurisdiction", values: (m) => m.regulatory_jurisdiction ?? "—" },
        { label: "Regulator", values: (m) => m.regulator ?? "—" },
        { label: "SEC registered", values: (m) => boolStr(m.sec_registered) },
        { label: "CRD", values: (m) => m.crd_number ?? "—" },
        { label: "Ownership", values: (m) => m.ownership_structure ?? "—" },
        { label: "Fiduciary stated", values: (m) => boolStr(m.fiduciary_stated_explicitly) },
        { label: "Fee-only stated", values: (m) => boolStr(m.fee_only_stated_explicitly) },
        { label: "Disciplinary disclosures", values: (m) => boolStr(m.disciplinary_disclosures) },
      ],
    },
    {
      title: "Brand & voice",
      rows: [
        { label: "Media presence", values: (m) => m.media_presence ?? "—" },
        { label: "Design tone", values: (m) => m.design_tone ?? "—" },
      ],
    },
  ];

  for (const section of matrixSections) {
    lines.push(`## ${section.title}`);
    lines.push("");
    lines.push(`| Dimension | ${cols.join(" | ")} |`);
    lines.push(`|---|${cols.map(() => "---").join("|")}|`);
    for (const row of section.rows) {
      lines.push(
        `| ${row.label} | ${rows.map((r) => row.values(r)).join(" | ")} |`,
      );
    }
    lines.push("");
  }

  // Positioning claims, vulnerabilities, and tags — list-by-competitor
  lines.push("## Positioning claims");
  lines.push("");
  lines.push("How each competitor claims to be positioned (controlled-vocabulary tags from `_context/taxonomy.md`).");
  lines.push("");
  for (const r of rows) {
    const tags = (r.positioning_claims ?? []).map((t) => `\`${t}\``).join(", ") || "—";
    lines.push(`- **${shortName(r.competitor)}**: ${tags}`);
  }
  lines.push("");

  lines.push("## Cross-cutting tags");
  lines.push("");
  lines.push("Structural attributes (what they *are*, not what they *claim*). Useful for filter queries like \"show me all PE-backed firms\" or \"all content-led practitioners.\"");
  lines.push("");
  for (const r of rows) {
    const tags = (r.tags ?? []).map((t) => `\`${t}\``).join(", ") || "—";
    lines.push(`- **${shortName(r.competitor)}**: ${tags}`);
  }
  lines.push("");

  lines.push("## Vulnerabilities we could attack");
  lines.push("");
  lines.push("Specific weaknesses surfaced in each competitor's analysis. Each tag links back to the prose in that competitor's `2_Full_Profile.md`.");
  lines.push("");
  for (const r of rows) {
    const tags = (r.vulnerabilities ?? []).map((t) => `\`${t}\``).join(", ") || "—";
    lines.push(`- **${shortName(r.competitor)}**: ${tags}`);
  }
  lines.push("");

  // Cross-cutting tag rollups
  lines.push("## Tag rollups (where the field clusters)");
  lines.push("");
  const claimCounts = countTags(rows.flatMap((r) => r.positioning_claims ?? []));
  const vulnCounts = countTags(rows.flatMap((r) => r.vulnerabilities ?? []));
  const tagCounts = countTags(rows.flatMap((r) => r.tags ?? []));
  lines.push("**Most common positioning claims across the set:**");
  lines.push("");
  for (const [tag, n] of claimCounts.slice(0, 10)) {
    lines.push(`- \`${tag}\` — ${n}/${rows.length} competitors`);
  }
  lines.push("");
  lines.push("**Most common vulnerabilities across the set:**");
  lines.push("");
  for (const [tag, n] of vulnCounts.slice(0, 10)) {
    lines.push(`- \`${tag}\` — ${n}/${rows.length} competitors`);
  }
  lines.push("");
  if (tagCounts.length > 0) {
    lines.push("**Most common structural tags across the set:**");
    lines.push("");
    for (const [tag, n] of tagCounts.slice(0, 10)) {
      lines.push(`- \`${tag}\` — ${n}/${rows.length} competitors`);
    }
    lines.push("");
  }

  // Segment coverage
  lines.push("## Where the field serves our target segments");
  lines.push("");
  lines.push("Strong / OK / Weak / Not aimed — count of competitors per segment.");
  lines.push("");
  lines.push("| Segment | Strong | OK | Weak | Not aimed | Total |");
  lines.push("|---|---|---|---|---|---|");
  const segments: { key: keyof Metadata; label: string }[] = [
    { key: "segment_early_adults", label: "Early adults (first investment)" },
    { key: "segment_mid_career_401k", label: "Mid-career 401(k) management" },
  ];
  for (const s of segments) {
    const tally = { strong: 0, ok: 0, weak: 0, not_aimed: 0 };
    for (const r of rows) {
      const v = (r as any)[s.key] as string | null;
      if (v && v in tally) (tally as any)[v]++;
    }
    lines.push(
      `| ${s.label} | ${tally.strong} | ${tally.ok} | ${tally.weak} | ${tally.not_aimed} | ${rows.length} |`,
    );
  }
  lines.push("");

  lines.push("---");
  lines.push("");
  lines.push(
    "*For prose analysis and the \"so what for us\" reads, see individual competitor `2_Full_Profile.md` files and the other docs in this folder.*",
  );

  return lines.join("\n") + "\n";
}

function boolStr(v: boolean | null | undefined): string {
  if (v === true) return "yes";
  if (v === false) return "no";
  return "—";
}

function countTags(tags: string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

async function main() {
  console.log(`[synthesize] reading metadata from ${COMPETITORS_DIR}`);
  const all = await loadAllMetadata();
  console.log(`[synthesize] loaded ${all.length} competitors`);

  if (all.length === 0) {
    console.warn("[synthesize] no competitors found — nothing to do");
    return;
  }

  const csv = buildCsv(all);
  const csvPath = join(OVERVIEW_DIR, "competitor_catalog.csv");
  await writeFile(csvPath, csv);
  console.log(`  → ${csvPath}`);

  const jsonPath = join(OVERVIEW_DIR, "competitor_catalog.json");
  await writeFile(jsonPath, JSON.stringify(all, null, 2));
  console.log(`  → ${jsonPath}`);

  const matrix = buildMatrix(all);
  const matrixPath = join(OVERVIEW_DIR, "Head_to_Head_Matrix.md");
  await writeFile(matrixPath, matrix);
  console.log(`  → ${matrixPath}`);

  console.log(`[synthesize] done. ${all.length} competitors, ${CSV_COLUMNS.length} columns.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
