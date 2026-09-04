#!/usr/bin/env node
/**
 * Build step. Turns data/*.yaml into:
 *   dist/api/v1/*.json   a static JSON API anyone can fetch, no key, no rate limit
 *   dist/index.html      the browsable site
 *   dist/showstack.json  a single-file bundle for the npm and PyPI packages
 *
 * The interop matrix is computed here rather than stored, so `speaks` only ever
 * has to be written once, on the software or hardware entry.
 */
import { mkdirSync, writeFileSync, readFileSync, cpSync, existsSync, rmSync } from 'node:fs'
import { flowOf } from './flows.mjs'
import { join } from 'node:path'
import { COLLECTIONS, loadCollection, ROOT } from './lib/load.mjs'
import { buildPages, TOKENS, BASE_CSS, SHELL_CSS, navBar } from './pages.mjs'
import { LABEL_MAPS } from './labels.mjs'

const SITE = process.env.SHOWSTACK_SITE ?? 'https://showstack.dev'

const DIST = join(ROOT, 'dist')
const API = join(DIST, 'api', 'v1')

// Wipe dist first. Pages are named after entry ids, so renaming or deleting an
// entry would otherwise leave the old page sitting in dist forever: still
// deployed, still indexed, still carrying a canonical, and no longer backed by
// any file anyone can edit. dist/ is fully generated and gitignored, so there
// is nothing here worth keeping between builds.
rmSync(DIST, { recursive: true, force: true })
mkdirSync(API, { recursive: true })

const db = {}
for (const col of COLLECTIONS) db[col.key] = loadCollection(col.key).map((e) => e.doc)

// ---- Derived: the interop matrix ------------------------------------------
// For each protocol, who speaks it. This is the question people actually
// arrive with ("what can receive PSN?") and it is expensive to answer by hand.
const speakers = {}
for (const kind of ['software', 'hardware']) {
  for (const entry of db[kind]) {
    for (const s of entry.speaks ?? []) {
      ;(speakers[s.protocol] ??= []).push({
        kind,
        id: entry.id,
        name: entry.name,
        vendor: entry.vendor ?? null,
        direction: s.direction,
        requires_licence: s.requires_licence ?? false,
        confidence: s.confidence ?? entry.confidence ?? 'reported',
        note: s.note ?? null,
      })
    }
  }
}
for (const p of db.protocols) p.spoken_by = speakers[p.id] ?? []

// ---- Derived: contributor credits -----------------------------------------
const credits = new Map()
for (const col of COLLECTIONS) {
  for (const entry of db[col.key]) {
    for (const handle of entry.contributed_by ?? []) {
      credits.set(handle, (credits.get(handle) ?? 0) + 1)
    }
  }
}
const contributors = [...credits.entries()]
  .map(([handle, entries]) => ({ handle, entries }))
  .sort((a, b) => b.entries - a.entries || a.handle.localeCompare(b.handle))

// ---- Derived: the gaps ----------------------------------------------------
// Fields we know are missing. This list is the contributor backlog, generated
// rather than hand-maintained, so it can never go stale.
const WANTED = {
  protocols: ['default_ports', 'first_published', 'implementations', 'gotchas', 'spec_url', 'media'],
  software: ['speaks', 'platforms', 'price_model', 'gotchas', 'repo'],
  hardware: ['speaks', 'physical_ports', 'released', 'gotchas'],
  standards: ['year', 'scope', 'free_to_read', 'access_url'],
  terms: ['zh_hant', 'definition_zh_hant', 'false_friends', 'regional_variants'],
}

/**
 * Fields that only make sense for some entries.
 *
 * A backlog that asks for something nobody can supply is not a backlog, it is
 * noise — and it inflates the open-gap count, which is a number this site puts
 * on its own front page. Dante Controller and grandMA3 onPC are free to
 * download and will never have a public source repository, so listing `repo`
 * as missing on them makes the index look 90-odd gaps deeper than it is and
 * sends contributors after something that does not exist.
 *
 * A field is only a gap when it is applicable AND absent.
 */
const APPLICABLE = {
  software: {
    // Only open-source software can have a public repository. Free-to-download
    // proprietary tools are a different thing from open source, and the
    // price_model field already records which is which.
    repo: (e) => e.price_model === 'open-source',
  },
  protocols: {
    // A closed proprietary spec has no public document to link to. Where a
    // vendor does publish one the field is filled in; where they do not, it is
    // not a gap somebody can close with research.
    spec_url: (e) => e.openness !== 'proprietary-closed',
    // Sample rates and resolutions are only a question for something that
    // carries audio or video. Asking sACN for its bit depth is noise, and
    // noise in the backlog is what stops people trusting the backlog.
    media: (e) => e.category === 'audio-transport' || e.category === 'video-transport',
  },
}

const gaps = []
for (const col of COLLECTIONS) {
  const rules = APPLICABLE[col.key] ?? {}
  for (const entry of db[col.key]) {
    const missing = (WANTED[col.key] ?? []).filter((f) => {
      if (rules[f] && !rules[f](entry)) return false
      const v = entry[f]
      return v == null || (Array.isArray(v) && v.length === 0)
    })
    if (missing.length) gaps.push({ collection: col.key, id: entry.id, name: entry.name ?? entry.en ?? entry.designation, missing })
  }
}

// The Four Flows are a derived field, not an authored one: they come from a
// decision table in flows.mjs that a test forces somebody to keep complete.
// Injected here rather than written into 90 YAML files, so the reasoning lives
// in one reviewable place and the API still carries the answer per entry.
for (const p of db.protocols) {
  const fl = flowOf(p)
  if (!fl) continue
  p.flow = fl.flow
  if (fl.reason) p.flow_note = fl.reason
}

const stats = {
  generated: new Date().toISOString().slice(0, 10),
  counts: Object.fromEntries(COLLECTIONS.map((c) => [c.key, db[c.key].length])),
  total: COLLECTIONS.reduce((n, c) => n + db[c.key].length, 0),
  contributors: contributors.length,
  open_gaps: gaps.length,
  verified_share: (() => {
    const all = COLLECTIONS.flatMap((c) => db[c.key])
    return all.length ? +(all.filter((e) => e.confidence === 'verified').length / all.length).toFixed(3) : 0
  })(),
}

// ---- Emit -----------------------------------------------------------------
for (const col of COLLECTIONS) {
  writeFileSync(join(API, `${col.key}.json`), JSON.stringify(db[col.key], null, 2))
}
writeFileSync(join(API, 'index.json'), JSON.stringify({ ...stats, endpoints: COLLECTIONS.map((c) => `/api/v1/${c.key}.json`) }, null, 2))
writeFileSync(join(API, 'contributors.json'), JSON.stringify(contributors, null, 2))
writeFileSync(join(API, 'gaps.json'), JSON.stringify(gaps, null, 2))

const bundle = { $schema: `${SITE}/api/v1/index.json`, ...stats, ...db, contributors, gaps }
writeFileSync(join(DIST, 'showstack.json'), JSON.stringify(bundle))
writeFileSync(join(ROOT, 'packages', 'showstack-js', 'showstack.json'), JSON.stringify(bundle))
writeFileSync(join(ROOT, 'packages', 'showstack-py', 'showstack', 'showstack.json'), JSON.stringify(bundle))

// The search app, with the bundle inlined, so it works from file://, from a
// CDN, and offline in a production office with no wifi. It lives at /search/
// rather than at / because a wall of search results is a poor answer to
// "what is this site" - the front page has that job now.
// Must stay in step with COLS in site/search.html; a test asserts they match.
const GH_URL = 'https://github.com/deliseph/showstack'
const SEARCH_TABS = [
  ['protocols', 'protocols', db.protocols.length],
  ['software', 'software', db.software.length],
  ['hardware', 'hardware', db.hardware.length],
  ['standards', 'standards', db.standards.length],
  ['terms', 'glossary', db.terms.length],
]
const total = stats.total

const searchTpl = readFileSync(join(ROOT, 'site', 'search.html'), 'utf8')
mkdirSync(join(DIST, 'search'), { recursive: true })
writeFileSync(join(DIST, 'search', 'index.html'), searchTpl
  .replace('/*__SHOWSTACK_TOKENS__*/', TOKENS)
  .replace('/*__SHOWSTACK_BASE__*/', BASE_CSS)
  .replace('/*__SHOWSTACK_SHELL__*/', SHELL_CSS)
  .replace('/*__SHOWSTACK_NAV__*/', navBar('/search/'))
  // The category tabs, rendered here rather than by the page script. Their
  // labels are fixed and their counts are a build-time fact, so waiting for
  // JavaScript bought nothing and cost a 94px row appearing after first
  // paint - which pushed the whole page down and was the single largest
  // layout shift on the site.
  .replace('<!--__SHOWSTACK_TABS__-->', [['all', 'all', total], ...SEARCH_TABS]
    .map(([key, label, n]) =>
      `<button class="tab" role="tab" data-k="${key}" aria-selected="${key === 'all'}">${label}<b>${n}</b></button>`)
    .join(''))
  // Same reasoning for the stats strip directly beneath them.
  .replace('<!--__SHOWSTACK_STATS__-->',
    `<span><b>${stats.total}</b> entries</span>` +
    `<span><b>${Math.round((stats.verified_share ?? 0) * 100)}%</b> verified against a primary source</span>` +
    `<span><b>${stats.open_gaps}</b> open gaps</span>` +
    (contributors.length ? `<span><b>${contributors.length}</b> contributors</span>` : '') +
    `<span>built ${stats.generated}</span>`)
  .replace('<!--__SHOWSTACK_FOOT__-->',
    `Built ${stats.generated} from ${stats.total} YAML files. <a href="${GH_URL}">Source</a> ` +
    `&middot; <a href="/api/v1/index.json">API</a> ` +
    `&middot; <a href="${GH_URL}/blob/main/CONTRIBUTING.md">Contribute</a>`)
  .replace('/*__SHOWSTACK_LABELS__*/null', JSON.stringify(LABEL_MAPS))
  .replace('/*__SHOWSTACK_DATA__*/null', JSON.stringify(bundle)))

// The front page is generated by buildPages() below, through the same shell
// as every other page, so its header and nav cannot drift from the rest of
// the site. It ships counts only - no search index. Sending 2 MB of JSON to
// somebody reading a paragraph would be rude.
if (existsSync(join(ROOT, 'site', 'assets'))) cpSync(join(ROOT, 'site', 'assets'), join(DIST, 'assets'), { recursive: true })

// ---- Installable, and honest about working offline ------------------------
// The site describes its user as a phone in a loading dock. Until there was a
// service worker, "works offline once loaded" stopped being true the moment
// they reloaded.
//
// The version stamp is the build date plus the entry count, so a corrected
// dataset invalidates the cache. A data site serving a stale port number from
// cache would be worse than serving nothing.
const swVersion = `${stats.generated}-${stats.total}`
writeFileSync(join(DIST, 'sw.js'),
  readFileSync(join(ROOT, 'site', 'sw.js'), 'utf8').replace('__SW_VERSION__', swVersion))

writeFileSync(join(DIST, 'manifest.webmanifest'), JSON.stringify({
  name: 'showstack — live entertainment technology',
  short_name: 'showstack',
  description: `An open, citable index of live entertainment technology: ${stats.total} entries with a source on every fact, plus animated explainers and offline field calculators.`,
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'any',
  background_color: '#0b0e14',
  theme_color: '#0b0e14',
  categories: ['productivity', 'utilities', 'education'],
  icons: [
    { src: '/assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/assets/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [
    { name: 'Field tools', short_name: 'Tools', url: '/tools/' },
    { name: 'Search the index', short_name: 'Search', url: '/search/' },
    { name: 'Explainers', short_name: 'Learn', url: '/learn/' },
  ],
}, null, 2))

// Static pages. The search app at / serves people who already know we exist;
// these serve the person typing "what port does sACN use" into a search engine,
// which is where nearly all first contact will come from.
const pageStats = buildPages(bundle, DIST)

console.log(`Built ${stats.total} entries -> dist/`)
console.log(`  ${Object.entries(stats.counts).map(([k, v]) => `${v} ${k}`).join(', ')}`)
console.log(`  ${stats.open_gaps} open field gaps, ${contributors.length} contributors credited`)
console.log(`  ${pageStats.pages} static pages incl. ${pageStats.ports} port pages, sitemap.xml, robots.txt, llms.txt`)
