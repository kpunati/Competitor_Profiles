/**
 * add.ts
 *
 * One-shot CLI that adds a new competitor end-to-end:
 *   1. Derives a slug from --name or the URL host
 *   2. Creates Competitors/{Slug}/ by copying the template
 *   3. Runs extract  (Playwright page + design capture)
 *   4. Runs analyze  (Claude API → 1_Summary.md and 2_Full_Profile.md)
 *
 * Usage:
 *   npx tsx tools/add.ts --url https://example.com
 *   npx tsx tools/add.ts --url https://example.com --name "Example Wealth"
 *   npx tsx tools/add.ts --url https://example.com --skip-analyze
 *
 * Requires:
 *   - npm install (and `npx playwright install chromium` once)
 *   - ANTHROPIC_API_KEY in the environment (for analyze)
 */

import { mkdir, cp, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { extract } from "./extract.ts";
import { enrichAdv } from "./enrich-adv.ts";
import { enrichAdvPdf } from "./enrich-adv-pdf.ts";
import { analyze } from "./analyze.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

interface AddOptions {
  url: string;
  name?: string;
  skipAnalyze?: boolean;
  skipExtract?: boolean;
  skipEnrich?: boolean;
  skipEnrichPdf?: boolean;
  crd?: string;
  model?: string;
}

async function main(opts: AddOptions) {
  const slug = opts.name ? toSlug(opts.name) : slugFromUrl(opts.url);
  const compDir = join(ROOT, "Competitors", slug);

  console.log(`[add] competitor: ${slug}`);
  console.log(`[add] url:        ${opts.url}`);

  await ensureCompetitorFolder(slug, compDir);

  if (!opts.skipExtract) {
    await extract({ slug, url: opts.url });
  } else {
    console.log("[add] skipping extract");
  }

  if (!opts.skipEnrich) {
    await enrichAdv({ slug, name: opts.name, crd: opts.crd }).catch((err) => {
      console.warn(`[add] enrich-adv failed (non-fatal): ${err.message}`);
    });
  } else {
    console.log("[add] skipping enrich-adv");
  }

  if (!opts.skipAnalyze) {
    await analyze({ slug, model: opts.model });
  } else {
    console.log("[add] skipping analyze");
  }

  // Run the ADV PDF parser last. It populates the numeric fields
  // (employee_count, advisor_count, aum_usd, etc.) on metadata.json. Requires
  // metadata.json to already exist — if analyze was skipped and the metadata
  // hasn't been hand-written yet, this gracefully skips and prints a hint.
  if (!opts.skipEnrichPdf) {
    const res = await enrichAdvPdf({ slug }).catch((err) => {
      console.warn(`[add] enrich-adv-pdf failed (non-fatal): ${err.message}`);
      return null;
    });
    if (res && !res.applied) {
      console.log(`[add] enrich-adv-pdf skipped: ${res.reason}`);
      if (res.reason?.includes("metadata.json")) {
        console.log(`[add] hint: after writing metadata.json, run:`);
        console.log(`[add]   npx tsx tools/enrich-adv-pdf.ts --slug ${slug}`);
      }
    }
  }

  console.log(`\nDone. Open:`);
  console.log(`  Competitors/${slug}/1_Summary.md`);
  console.log(`  Competitors/${slug}/2_Full_Profile.md`);
  console.log(`\nAfter writing metadata.json for this competitor, run:`);
  console.log(`  npx tsx tools/synthesize.ts`);
  console.log(`to refresh the cross-cutting matrix and catalog.`);
}

async function ensureCompetitorFolder(slug: string, compDir: string) {
  if (existsSync(compDir)) {
    console.log(`[add] reusing existing folder Competitors/${slug}`);
    return;
  }
  const tpl = join(ROOT, "Competitors", "_template");
  if (!existsSync(tpl)) {
    throw new Error(`Template folder missing at ${tpl}`);
  }
  await mkdir(compDir, { recursive: true });
  await cp(tpl, compDir, { recursive: true });
  console.log(`[add] created Competitors/${slug} from template`);
}

function slugFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    // "example.com" → "Example", "wealth-co.example.com" → "Wealth_Co"
    const main = host.split(".")[0];
    return toSlug(main);
  } catch {
    throw new Error(`Could not derive slug from URL: ${url}`);
  }
}

function toSlug(s: string): string {
  return s
    .trim()
    .split(/[\s\-_\.]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("_");
}

// CLI entry
const isCli = import.meta.url === `file://${process.argv[1]}`;
if (isCli) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url) {
    console.error(
      [
        "Usage:",
        "  tsx tools/add.ts --url <https://...> [--name <Pretty Name>] [--crd <CRD>]",
        "                   [--skip-extract] [--skip-enrich] [--skip-enrich-pdf]",
        "                   [--skip-analyze] [--model <id>]",
      ].join("\n"),
    );
    process.exit(1);
  }
  main({
    url: args.url,
    name: args.name,
    crd: args.crd,
    skipAnalyze: args["skip-analyze"] === "true",
    skipExtract: args["skip-extract"] === "true",
    skipEnrich: args["skip-enrich"] === "true",
    skipEnrichPdf: args["skip-enrich-pdf"] === "true",
    model: args.model,
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
