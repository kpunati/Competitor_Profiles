#!/usr/bin/env tsx
// Walk Competitors/* and emit 00_Market_Overview/pages_by_kind.json.
// Two sources:
//   1. Source_Data/pages/*.json  — site-shape pages, classification already in `kind`
//   2. Knowledge_From_Source/_index.json — per-firm blog corpus
//
// Output is the canonical "what kinds of pages exist across the catalog" index.
// Downstream consumers: the planned semantic embedder, the planned query CLI,
// and any teammate browsing the catalog for cross-cutting questions like
// "show me every contact page" or "every services page" without walking 30 folders.

import { readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const COMPETITORS_DIR = path.join(ROOT, 'Competitors')
const OUTPUT_DIR = path.join(ROOT, '00_Market_Overview')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'pages_by_kind.json')

const SKIP_ENTRIES = new Set(['README.md', '_template', '.DS_Store'])

type SiteEntry = {
  firm: string
  source: 'site'
  kind: string
  url: string
  title: string
  file: string
  description?: string
  heading_count?: number
}

type BlogEntry = {
  firm: string
  source: 'blog'
  kind: 'blog_post'
  url: string
  title: string
  file: string
  date?: string
  author?: string
  word_count?: number
  tags?: string[]
}

type Entry = SiteEntry | BlogEntry

function relPath(p: string): string {
  return path.relative(ROOT, p)
}

async function listFirms(): Promise<string[]> {
  const items = await readdir(COMPETITORS_DIR)
  const firms: string[] = []
  for (const item of items) {
    if (SKIP_ENTRIES.has(item)) continue
    const full = path.join(COMPETITORS_DIR, item)
    const st = await stat(full).catch(() => null)
    if (st?.isDirectory()) firms.push(item)
  }
  return firms.sort()
}

async function readSitePages(firm: string): Promise<SiteEntry[]> {
  const pagesDir = path.join(COMPETITORS_DIR, firm, 'Source_Data', 'pages')
  if (!existsSync(pagesDir)) return []
  const files = await readdir(pagesDir)
  const entries: SiteEntry[] = []
  for (const f of files) {
    if (!f.endsWith('.json')) continue
    const full = path.join(pagesDir, f)
    try {
      const raw = await readFile(full, 'utf8')
      const data = JSON.parse(raw)
      const rawKind = (data.kind || 'unknown').toLowerCase()
      // Disambiguate `blog` (= blog index page) from `blog_post` (individual posts).
      const kind = rawKind === 'blog' ? 'blog_index' : rawKind
      entries.push({
        firm,
        source: 'site',
        kind,
        url: data.url || '',
        title: (data.title || '').trim(),
        file: relPath(full),
        description: data.meta?.description?.trim() || undefined,
        heading_count: Array.isArray(data.headings) ? data.headings.length : undefined
      })
    } catch (err) {
      console.warn(`  skip ${relPath(full)}: ${(err as Error).message}`)
    }
  }
  return entries
}

async function readBlogPosts(firm: string): Promise<BlogEntry[]> {
  const indexPath = path.join(COMPETITORS_DIR, firm, 'Knowledge_From_Source', '_index.json')
  if (!existsSync(indexPath)) return []
  try {
    const raw = await readFile(indexPath, 'utf8')
    const data = JSON.parse(raw)
    const posts = Array.isArray(data.posts) ? data.posts : []
    return posts.map((p: any): BlogEntry => ({
      firm,
      source: 'blog',
      kind: 'blog_post',
      url: p.url || '',
      title: (p.title || '').trim(),
      file: relPath(path.join(COMPETITORS_DIR, firm, 'Knowledge_From_Source', p.file || '')),
      date: p.date || undefined,
      author: p.author || undefined,
      word_count: typeof p.word_count === 'number' ? p.word_count : undefined,
      tags: Array.isArray(p.tags) && p.tags.length ? p.tags : undefined
    }))
  } catch (err) {
    console.warn(`  skip ${relPath(indexPath)}: ${(err as Error).message}`)
    return []
  }
}

async function main(): Promise<void> {
  if (!existsSync(OUTPUT_DIR)) await mkdir(OUTPUT_DIR, { recursive: true })

  const firms = await listFirms()
  console.log(`Scanning ${firms.length} firms...`)

  const all: Entry[] = []
  const byFirm: Record<string, Record<string, number>> = {}

  for (const firm of firms) {
    const siteEntries = await readSitePages(firm)
    const blogEntries = await readBlogPosts(firm)
    const combined = [...siteEntries, ...blogEntries]
    all.push(...combined)

    const tally: Record<string, number> = {}
    for (const e of combined) tally[e.kind] = (tally[e.kind] || 0) + 1
    byFirm[firm] = tally

    const summary = Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}:${v}`)
      .join(' ')
    console.log(`  ${firm.padEnd(28)} ${summary || '(empty)'}`)
  }

  // Group by kind, ordered: site kinds first (alphabetical), then blog_post last.
  const byKind: Record<string, Entry[]> = {}
  for (const e of all) {
    if (!byKind[e.kind]) byKind[e.kind] = []
    byKind[e.kind].push(e)
  }
  // Stable sort within each kind: by firm then title.
  for (const k of Object.keys(byKind)) {
    byKind[k].sort((a, b) => a.firm.localeCompare(b.firm) || a.title.localeCompare(b.title))
  }

  const siteKinds = Object.keys(byKind).filter(k => k !== 'blog_post').sort()
  const orderedKinds = [...siteKinds, ...(byKind.blog_post ? ['blog_post'] : [])]
  const orderedByKind: Record<string, Entry[]> = {}
  for (const k of orderedKinds) orderedByKind[k] = byKind[k]

  const sitePages = all.filter(e => e.source === 'site').length
  const blogPosts = all.filter(e => e.source === 'blog').length

  const output = {
    generated_at: new Date().toISOString().slice(0, 10),
    totals: {
      firms: firms.length,
      site_pages: sitePages,
      blog_posts: blogPosts,
      total: all.length,
      kinds: Object.fromEntries(orderedKinds.map(k => [k, byKind[k].length]))
    },
    kind: orderedByKind,
    by_firm: byFirm
  }

  await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2))

  console.log('')
  console.log(`Wrote ${relPath(OUTPUT_FILE)}`)
  console.log(`  firms        ${firms.length}`)
  console.log(`  site pages   ${sitePages}`)
  console.log(`  blog posts   ${blogPosts}`)
  console.log(`  total        ${all.length}`)
  console.log(`  kinds:`)
  for (const k of orderedKinds) {
    console.log(`    ${k.padEnd(16)} ${byKind[k].length}`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
