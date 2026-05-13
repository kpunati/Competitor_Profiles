/**
 * analyze.ts
 *
 * Reads everything under Competitors/{slug}/Source_Data/ + selected screenshots
 * and writes the two markdown deliverables:
 *   - 2_Full_Profile.md  (deep dive, written first)
 *   - 1_Summary.md       (one-page brief, written after, given the deep dive)
 *
 * The standing context in _context/ (thesis + industry frame) and the template
 * files themselves are cached on the system prompt — every competitor after the
 * first hits the prompt cache for the heavy parts.
 *
 * Usage:
 *   npx tsx tools/analyze.ts --slug Acme_Co
 *
 * Requires ANTHROPIC_API_KEY in the environment.
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const DEFAULT_MODEL = process.env.ANALYZE_MODEL ?? "claude-sonnet-4-6";

export interface AnalyzeOptions {
  slug: string;
  model?: string;
}

export interface AnalyzeResult {
  slug: string;
  fullProfilePath: string;
  summaryPath: string;
  model: string;
}

export async function analyze(opts: AnalyzeOptions): Promise<AnalyzeResult> {
  const { slug } = opts;
  const model = opts.model ?? DEFAULT_MODEL;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Export it before running analyze.ts.\n" +
        "  export ANTHROPIC_API_KEY=sk-ant-...",
    );
  }

  const compDir = join(ROOT, "Competitors", slug);
  const sourceDir = join(compDir, "Source_Data");
  const shotsDir = join(compDir, "Screenshots");
  if (!existsSync(sourceDir)) {
    throw new Error(`No Source_Data found for ${slug}. Run extract.ts first.`);
  }

  console.log(`[analyze] ${slug} using ${model}`);

  const client = new Anthropic();

  // ---- Standing context (cached) -------------------------------------------
  const thesis = await readFileSafe(join(ROOT, "_context", "our_thesis.md"));
  const industry = await readFileSafe(join(ROOT, "_context", "industry_frame.md"));
  const tplFull = await readFileSafe(
    join(ROOT, "Competitors", "_template", "2_Full_Profile.md"),
  );
  const tplSummary = await readFileSafe(
    join(ROOT, "Competitors", "_template", "1_Summary.md"),
  );

  const systemPrompt = buildSystemPrompt({ thesis, industry, tplFull, tplSummary });

  // ---- Competitor-specific inputs ------------------------------------------
  const meta = await readJson(join(sourceDir, "meta.json"));
  const design = await readJson(join(sourceDir, "design_details.json"));
  const facts = await readJson(join(sourceDir, "company_facts.json"));
  const pages = await readPageBundles(join(sourceDir, "pages"));
  const images = await pickKeyScreenshots(shotsDir);

  const userBlocks = buildUserBlocks({ slug, meta, design, facts, pages, images });

  // ---- First call: deep dive ----------------------------------------------
  console.log(`[analyze] writing 2_Full_Profile.md…`);
  const fullProfile = await callClaude(client, model, systemPrompt, [
    ...userBlocks,
    {
      type: "text",
      text:
        "Write the deep-dive **2_Full_Profile.md** for this competitor, following the template exactly. " +
        "Output only the markdown (including the YAML frontmatter). Do not wrap in code fences. " +
        "Every claim should be traceable to the source data above. " +
        "Where data is missing, write `(not in source data)` rather than guessing.",
    },
  ]);

  const fullProfilePath = join(compDir, "2_Full_Profile.md");
  await writeFile(fullProfilePath, fullProfile);

  // ---- Second call: one-page summary (given the deep dive) -----------------
  console.log(`[analyze] writing 1_Summary.md…`);
  const summary = await callClaude(client, model, systemPrompt, [
    ...userBlocks,
    {
      type: "text",
      text:
        "Here is the deep-dive profile you just wrote:\n\n```markdown\n" +
        fullProfile +
        "\n```\n\nNow write the one-page **1_Summary.md** that distills the most important " +
        "findings, following the summary template exactly. Output only the markdown " +
        "(including the YAML frontmatter). The summary's `threat_level` should match the deep dive.",
    },
  ]);

  const summaryPath = join(compDir, "1_Summary.md");
  await writeFile(summaryPath, summary);

  console.log(`[analyze] done`);
  console.log(`  → ${summaryPath}`);
  console.log(`  → ${fullProfilePath}`);

  return { slug, fullProfilePath, summaryPath, model };
}

function buildSystemPrompt(parts: {
  thesis: string;
  industry: string;
  tplFull: string;
  tplSummary: string;
}): Anthropic.TextBlockParam[] {
  return [
    {
      type: "text",
      text:
        "You are a senior competitive strategist writing wealth-management competitor profiles for a pre-launch independent RIA. " +
        "Your job is to produce honest, specific, evidence-based analysis — never generic. " +
        "Every claim must be traceable to the source data the user provides; where data is missing, say so. " +
        "Read the standing context below, then write against the templates exactly.",
    },
    {
      type: "text",
      text: "## Our standing thesis\n\n" + parts.thesis,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: "## Industry frame: wealth management & financial planning\n\n" + parts.industry,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text:
        "## Template — 2_Full_Profile.md\n\nWrite against this template exactly. Keep all headings; " +
        "fill all sections; preserve YAML frontmatter:\n\n```markdown\n" +
        parts.tplFull +
        "\n```",
    },
    {
      type: "text",
      text:
        "## Template — 1_Summary.md\n\n```markdown\n" + parts.tplSummary + "\n```",
      cache_control: { type: "ephemeral" },
    },
  ];
}

function buildUserBlocks(input: {
  slug: string;
  meta: any;
  design: any;
  facts: any;
  pages: Array<{ kind: string; data: any }>;
  images: Array<{ name: string; b64: string; media_type: "image/png" }>;
}): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];

  blocks.push({
    type: "text",
    text:
      `# Competitor: ${input.slug}\n\n` +
      `Source URL: ${input.meta?.source_url ?? "(unknown)"}\n` +
      `Pages captured: ${input.meta?.pages?.map((p: any) => p.kind).join(", ") ?? "(unknown)"}\n` +
      `Extracted at: ${input.meta?.extracted_at ?? "(unknown)"}`,
  });

  blocks.push({
    type: "text",
    text:
      "## Design details (probed from the live site)\n\n```json\n" +
      JSON.stringify(input.design, null, 2) +
      "\n```",
  });

  blocks.push({
    type: "text",
    text:
      "## Company facts (auto-seeded + ADV lookup hint — may be sparse)\n\n```json\n" +
      JSON.stringify(input.facts, null, 2) +
      "\n```",
  });

  for (const page of input.pages) {
    blocks.push({
      type: "text",
      text:
        `## Page capture — ${page.kind}\n\n` +
        `URL: ${page.data?.url ?? "?"}\nTitle: ${page.data?.title ?? "?"}\n` +
        `Meta: ${JSON.stringify(page.data?.meta ?? {})}\n\n` +
        "### Headings\n" +
        (page.data?.headings ?? [])
          .map((h: any) => `- ${h.level}: ${h.text}`)
          .join("\n") +
        "\n\n### CTAs\n" +
        (page.data?.ctas ?? [])
          .map((c: any) => `- "${c.text}" → ${c.href ?? "(no href)"}`)
          .join("\n") +
        "\n\n### Body text\n\n" +
        (page.data?.body_text ?? "(empty)"),
    });
  }

  for (const img of input.images) {
    blocks.push({
      type: "image",
      source: { type: "base64", media_type: img.media_type, data: img.b64 },
    });
    blocks.push({ type: "text", text: `(Above: ${img.name})` });
  }

  return blocks;
}

async function callClaude(
  client: Anthropic,
  model: string,
  system: Anthropic.TextBlockParam[],
  content: Anthropic.ContentBlockParam[],
): Promise<string> {
  const res = await client.messages.create({
    model,
    max_tokens: 8_000,
    system,
    messages: [{ role: "user", content }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  if (!text.trim()) {
    throw new Error("Empty response from Claude");
  }
  return text.trim();
}

async function readFileSafe(p: string): Promise<string> {
  try {
    return await readFile(p, "utf-8");
  } catch {
    return "(missing)";
  }
}

async function readJson(p: string): Promise<any> {
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(await readFile(p, "utf-8"));
  } catch {
    return null;
  }
}

async function readPageBundles(pagesDir: string) {
  if (!existsSync(pagesDir)) return [];
  const files = (await readdir(pagesDir)).filter((f) => f.endsWith(".json"));
  const order = ["home", "services", "pricing", "about", "blog", "contact"];
  files.sort((a, b) => order.indexOf(a.replace(".json", "")) - order.indexOf(b.replace(".json", "")));
  const out: { kind: string; data: any }[] = [];
  for (const f of files) {
    out.push({ kind: f.replace(".json", ""), data: await readJson(join(pagesDir, f)) });
  }
  return out;
}

async function pickKeyScreenshots(shotsDir: string) {
  if (!existsSync(shotsDir)) return [];
  const preferred = [
    "Homepage_above_fold.png",
    "Pricing_above_fold.png",
    "About_above_fold.png",
    "Services_above_fold.png",
  ];
  const out: { name: string; b64: string; media_type: "image/png" }[] = [];
  for (const name of preferred) {
    const p = join(shotsDir, name);
    if (!existsSync(p)) continue;
    const s = await stat(p);
    if (s.size > 4_500_000) continue; // Claude image cap is ~5MB
    const b = await readFile(p);
    out.push({ name, b64: b.toString("base64"), media_type: "image/png" });
    if (out.length >= 4) break;
  }
  return out;
}

// CLI entry
const isCli = import.meta.url === `file://${process.argv[1]}`;
if (isCli) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.slug) {
    console.error("Usage: tsx tools/analyze.ts --slug <Slug> [--model <id>]");
    process.exit(1);
  }
  analyze({ slug: args.slug, model: args.model }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

function parseArgs(argv: string[]): { slug?: string; model?: string } {
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
