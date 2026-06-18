// Shared knowledge-base configuration used by BOTH the build script
// (scripts/build-kb.ts) and the runtime search function (api/search.ts).
//
// IMPORTANT: the MiniSearch options here must be identical in both places —
// the index is serialized at build time and re-hydrated in the function with
// MiniSearch.loadJSON(json, searchOptions). A mismatch breaks search.

export const SEARCH_FIELDS = ['heading', 'firmName', 'tags', 'body'] as const;

// Fields stored alongside each indexed section so a search hit can be returned
// without a second fetch. Kept deliberately small for token efficiency.
export const STORE_FIELDS = [
  'firm',
  'firmName',
  'doc',
  'heading',
  'anchor',
  'sectionPath',
  'rawPath',
  'snippet',
  'caveat',
  'words',
] as const;

// Field boosts: a query that matches a firm name or a heading is far more
// relevant than an incidental body match. Tags sit in between.
export const SEARCH_OPTIONS = {
  fields: SEARCH_FIELDS as unknown as string[],
  storeFields: STORE_FIELDS as unknown as string[],
  searchOptions: {
    boost: { firmName: 4, heading: 3, tags: 2, body: 1 },
    prefix: true,
    fuzzy: 0.2,
  },
} as const;

// Known data-quality caveats, transcribed from CLAUDE.md. Attached to every
// section/digest row for the affected firm so an agent never silently trusts a
// bad field. Keyed by firm slug.
export const CAVEATS: Record<string, string> = {
  Advize_Wealth:
    "Blog post `title` frontmatter shows a Wix footer-address widget, not the real title — use the body's first H1 instead. Bodies are correct.",
  Streamline_Planning:
    'IAPD false positive: sec_iapd.* fields (CRD, SEC#, AUM) are matched to an unrelated SEC filing. Treat as unverified (see regulatory_note).',
  Asset_Map:
    'IAPD false positive: sec_iapd.* fields are matched to an unrelated SEC filing. Treat as unverified (see regulatory_note).',
  Starke:
    'IAPD false positive: sec_iapd.* fields are matched to an unrelated SEC filing. Treat as unverified (see regulatory_note).',
  Samo_Financial:
    'Site capture was 100% Cloudflare bot-challenge pages — Source_Data/pages/*.json may be challenge text, not real content. Treat site-shape claims as unreliable.',
  Money_Guy:
    'Knowledge corpus points at /resources/ (resource index), so ~half the captures are calculator/PDF-download landing pages, not articles. Read the body before treating as a blog post.',
  Pwl_Capital:
    'Corpus is mostly service pages — real blog content lives at rationalreminder.ca + YouTube, not the main domain.',
};

export type SectionMeta = {
  id: string;
  firm: string;
  firmName: string;
  doc: string; // e.g. "1_Summary", "2_Full_Profile", "knowledge/<basename>", "<overview-doc>"
  heading: string;
  level: number;
  anchor: string;
  path: string; // static URL of the section markdown, e.g. /sections/<firm>/<doc>/<anchor>.md
  rawPath: string; // static URL of the full raw source file, e.g. /raw/Competitors/<Firm>/...
  words: number;
  caveat?: string;
};

export type DigestRow = {
  slug: string;
  name: string;
  summary_line: string;
  type: string | null;
  threat: string | null;
  aum: number | null;
  jurisdiction: string | null;
  website: string | null;
  hasCorpus: boolean;
  postCount: number;
  sections: number;
  caveat?: string;
};
