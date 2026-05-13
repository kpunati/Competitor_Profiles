/**
 * enrich-adv-pdf.ts
 *
 * Downloads a competitor's Form ADV PDF (the URL is already stashed in
 * Competitors/{slug}/Source_Data/company_facts.json by tools/enrich-adv.ts)
 * and parses Part 1A Item 5 to fill the structured numeric fields in
 * metadata.json:
 *
 *   - employee_count   (Item 5.A)
 *   - advisor_count    (Item 5.B.(1) — employees performing advisory functions)
 *   - aum_usd          (Item 5.F.(2)(c) — total regulatory AUM)
 *   - aum_as_of        (most recent filing date in the PDF)
 *   - disciplinary_disclosure_count  (count of filed DRPs in Item 11 appendix)
 *
 * Also adds an entry to trajectory.notable_events recording the snapshot.
 *
 * Usage:
 *   npx tsx tools/enrich-adv-pdf.ts --slug Focus_Partners
 *   npx tsx tools/enrich-adv-pdf.ts --slug Focus_Partners --pdf /path/to/local.pdf
 *
 * Skips gracefully for competitors without IAPD matches (education_platform,
 * finance_coach, etc.). Existing manual metadata is preserved.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const USER_AGENT = process.env.SEC_USER_AGENT ?? "Competitor Profiles karthik@miediai.com";

export interface AdvPdfParse {
  employee_count: number | null;
  advisor_count: number | null;
  iar_state_count: number | null;
  aum_discretionary_usd: number | null;
  aum_nondiscretionary_usd: number | null;
  aum_total_usd: number | null;
  account_count_total: number | null;
  has_filed_drps: boolean;
  filed_drp_count: number;
  drp_categories: string[];
  fee_types_listed: string[];
  fee_other_specify: string | null;
  filing_date: string | null;
  total_pages: number;
}

export interface EnrichPdfOptions {
  slug: string;
  pdf?: string;  // optional local path to skip download
}

export interface EnrichPdfResult {
  slug: string;
  applied: boolean;
  reason?: string;
  parse?: AdvPdfParse;
}

export async function enrichAdvPdf(opts: EnrichPdfOptions): Promise<EnrichPdfResult> {
  const { slug } = opts;
  const compDir = join(ROOT, "Competitors", slug);
  const factsPath = join(compDir, "Source_Data", "company_facts.json");
  const metadataPath = join(compDir, "metadata.json");

  if (!existsSync(factsPath)) {
    return { slug, applied: false, reason: "no company_facts.json — run extract first" };
  }
  if (!existsSync(metadataPath)) {
    return { slug, applied: false, reason: "no metadata.json — run a profile pass first" };
  }

  const facts = JSON.parse(await readFile(factsPath, "utf-8"));
  const iapd = facts?.auto_filled?.sec_iapd;
  if (!iapd?.matched) {
    return { slug, applied: false, reason: "no IAPD match — not a US RIA, skipping" };
  }
  const pdfUrl: string | undefined = iapd.adv_pdf_url;
  if (!opts.pdf && !pdfUrl) {
    return { slug, applied: false, reason: "no adv_pdf_url in company_facts.json" };
  }

  console.log(`[enrich-adv-pdf] ${slug} (CRD ${iapd.crd_number})`);

  // Cache PDFs in Source_Data/adv_cache/ so we don't re-download on iteration
  const cacheDir = join(compDir, "Source_Data", "adv_cache");
  await mkdir(cacheDir, { recursive: true });
  const pdfPath = opts.pdf ?? join(cacheDir, `${iapd.crd_number}_${dateStamp()}.pdf`);

  if (!opts.pdf && !existsSync(pdfPath)) {
    console.log(`[enrich-adv-pdf] downloading ${pdfUrl}`);
    const res = await fetch(pdfUrl!, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      return { slug, applied: false, reason: `download failed: ${res.status}` };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(pdfPath, buf);
    console.log(`[enrich-adv-pdf] cached ${pdfPath} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
  }

  const data = await readFile(pdfPath);
  const parser = new PDFParse({ data });
  const result = await parser.getText();
  const text = result.text;

  const parse = parseAdv(text, result.total ?? 0);
  console.log(`[enrich-adv-pdf] parsed: employees=${parse.employee_count}, advisors=${parse.advisor_count}, AUM=$${(parse.aum_total_usd ?? 0).toLocaleString()}, DRPs=${parse.filed_drp_count}`);

  await applyToMetadata(metadataPath, parse, slug);

  return { slug, applied: true, parse };
}

export function parseAdv(text: string, totalPages: number): AdvPdfParse {
  const out: AdvPdfParse = {
    employee_count: null,
    advisor_count: null,
    iar_state_count: null,
    aum_discretionary_usd: null,
    aum_nondiscretionary_usd: null,
    aum_total_usd: null,
    account_count_total: null,
    has_filed_drps: false,
    filed_drp_count: 0,
    drp_categories: [],
    fee_types_listed: [],
    fee_other_specify: null,
    filing_date: null,
    total_pages: totalPages,
  };

  // --- Item 5.A — employees ---
  const empMatch = text.match(
    /Approximately how many employees do you have\?[^]*?do not include any clerical workers\.\s*(\d[\d,]*)/i,
  );
  if (empMatch) out.employee_count = parseIntComma(empMatch[1]);

  // --- Item 5.B.(1) — performs advisory functions ---
  const advMatch = text.match(
    /perform investment advisory functions \(including research\)\?\s*(\d[\d,]*)/i,
  );
  if (advMatch) out.advisor_count = parseIntComma(advMatch[1]);

  // --- Item 5.B.(3) — state-registered IARs ---
  const iarMatch = text.match(
    /registered with one or more state securities authorities as investment adviser representatives\?\s*(\d[\d,]*)/i,
  );
  if (iarMatch) out.iar_state_count = parseIntComma(iarMatch[1]);

  // --- Item 5.F.(2) — Regulatory Assets Under Management ---
  // Discretionary: (a) $ X,XXX,000,000 (d) NN,NNN
  // Non-Discretionary: (b) $ X (e) N
  // Total: (c) $ X,XXX,000,000 (f) NN,NNN
  const aumDisc = text.match(/Discretionary:\s*\(a\)\s*\$\s*([\d,]+)/i);
  if (aumDisc) out.aum_discretionary_usd = parseIntComma(aumDisc[1]);

  const aumNon = text.match(/Non-Discretionary:\s*\(b\)\s*\$\s*([\d,]+)/i);
  if (aumNon) out.aum_nondiscretionary_usd = parseIntComma(aumNon[1]);

  const aumTotal = text.match(/Total:\s*\(c\)\s*\$\s*([\d,]+)/i);
  if (aumTotal) out.aum_total_usd = parseIntComma(aumTotal[1]);

  const totalAcct = text.match(/Total:.*?\(f\)\s*([\d,]+)/is);
  if (totalAcct) out.account_count_total = parseIntComma(totalAcct[1]);

  // --- Item 11 — Disclosure information ---
  // DRP counting from raw text is unreliable: pdf-parse extracts the form's
  // instructional references to DRP types but may or may not extract the
  // form-field content of actually filed DRPs (depends on PDF encoding).
  // Approach: trust the IAPD boolean (already in company_facts), don't try
  // to derive a count here. Only count when we see *strong* evidence —
  // section headers that only appear in filed DRPs.
  const filedDrpEvidence = [
    /DRP - Criminal Disclosure/gi,
    /DRP - Regulatory Disclosure/gi,
    /DRP - Civil Judicial Disclosure/gi,
  ];
  for (const re of filedDrpEvidence) {
    const matches = text.match(re);
    if (matches) {
      out.filed_drp_count += matches.length;
    }
  }
  out.has_filed_drps = out.filed_drp_count > 0;

  // --- Item 5.E — Compensation types listed (text shows all 7; checked status not visible) ---
  const feeListMatch = text.match(
    /You are compensated for your investment advisory services[^]*?\(7\)\s*Other\s*\(specify\)[:\s]*([^\n]*)/i,
  );
  if (feeListMatch) {
    out.fee_types_listed = [
      "percentage_of_aum",
      "hourly",
      "subscription",
      "fixed_fee",
      "commission",
      "performance_based",
      "other",
    ];
    const other = feeListMatch[1].trim();
    // Filter out cases where the firm left "Other" blank and our regex
    // greedily grabbed the next section header (e.g. "Item 5 Information...")
    if (
      other &&
      other.length > 1 &&
      !/^Item\s+\d/i.test(other) &&
      !/Information About/i.test(other) &&
      other.length < 200
    ) {
      out.fee_other_specify = other;
    }
  }

  // --- Filing date — take the LATEST date in the document, not the first.
  // ADVs contain many historical dates (initial registration, prior amendments,
  // event dates in DRPs). The most recent date is almost always the filing/
  // amendment date we want.
  const dateMatches = text.match(/\b(\d{2}\/\d{2}\/\d{4})\b/g);
  if (dateMatches && dateMatches.length > 0) {
    const isoSorted = dateMatches
      .map(mmddyyyyToIso)
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();
    out.filing_date = isoSorted[isoSorted.length - 1];
  }

  return out;
}

async function applyToMetadata(
  metadataPath: string,
  parse: AdvPdfParse,
  slug: string,
): Promise<void> {
  const meta = JSON.parse(await readFile(metadataPath, "utf-8"));

  // Only overwrite if our parse found a non-null value; preserve manual edits.
  if (parse.employee_count !== null) meta.employee_count = parse.employee_count;
  if (parse.advisor_count !== null) meta.advisor_count = parse.advisor_count;
  if (parse.aum_total_usd !== null) {
    meta.aum_usd = parse.aum_total_usd;
    meta.aum_as_of = parse.filing_date ?? new Date().toISOString().slice(0, 10);
  }
  // Align disciplinary_disclosure_count with the IAPD boolean. The text-based
  // count is unreliable (form-field encoding often hides filed DRPs), but we
  // can at least be consistent: if IAPD says no disclosures, count is 0.
  // If IAPD says yes, we take the parsed count if > 0, else leave null
  // (meaning "we know there's at least one, count unknown without manual ADV
  // review").
  if (meta.disciplinary_disclosures === false) {
    meta.disciplinary_disclosure_count = 0;
  } else if (meta.disciplinary_disclosures === true) {
    meta.disciplinary_disclosure_count = parse.filed_drp_count > 0 ? parse.filed_drp_count : null;
  }
  // Re-grade team_size off the actual employee count if we have it
  if (parse.employee_count !== null) {
    meta.team_size = bucketTeamSize(parse.employee_count);
  }

  // Add a notable_events entry for this ADV snapshot
  meta.trajectory ??= {};
  meta.trajectory.notable_events ??= [];
  const eventParts: string[] = [
    `${parse.employee_count?.toLocaleString() ?? "?"} employees`,
    `${parse.advisor_count?.toLocaleString() ?? "?"} advisors performing advisory functions`,
    `$${(parse.aum_total_usd ?? 0).toLocaleString()} regulatory AUM`,
  ];
  if (parse.account_count_total !== null) {
    eventParts.push(`${parse.account_count_total.toLocaleString()} client accounts`);
  }
  if (parse.filed_drp_count > 0) {
    eventParts.push(`${parse.filed_drp_count} filed DRP page(s) detected in text`);
  }
  if (parse.fee_other_specify) {
    eventParts.push(`"Other" fee specify: ${parse.fee_other_specify}`);
  }
  const snapshotEvent = {
    date: parse.filing_date ?? new Date().toISOString().slice(0, 10),
    event: `ADV snapshot — ${eventParts.join("; ")}`,
    source: "Form ADV Part 1A (parsed by tools/enrich-adv-pdf.ts)",
  };
  // De-dup: drop any prior "ADV snapshot" entry from this parser (date may
  // have shifted between runs as we fix bugs). Keep at most one current
  // snapshot per source.
  meta.trajectory.notable_events = meta.trajectory.notable_events.filter(
    (e: any) => e.source !== snapshotEvent.source,
  );
  meta.trajectory.notable_events.push(snapshotEvent);
  meta.last_updated = new Date().toISOString().slice(0, 10);

  await writeFile(metadataPath, JSON.stringify(meta, null, 2));
}

function bucketTeamSize(n: number): "solo" | "small" | "mid" | "large" {
  if (n <= 1) return "solo";
  if (n <= 30) return "small";
  if (n <= 300) return "mid";
  return "large";
}

function parseIntComma(s: string): number {
  return parseInt(s.replace(/,/g, ""), 10);
}

function escRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mmddyyyyToIso(s: string): string {
  const [mm, dd, yyyy] = s.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

// CLI entry
const isCli = import.meta.url === `file://${process.argv[1]}`;
if (isCli) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.slug) {
    console.error("Usage: tsx tools/enrich-adv-pdf.ts --slug <Slug> [--pdf <path>]");
    process.exit(1);
  }
  enrichAdvPdf({ slug: args.slug, pdf: args.pdf }).then((res) => {
    if (!res.applied) console.warn(`[enrich-adv-pdf] skipped: ${res.reason}`);
  }).catch((err) => {
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
