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
  protocols: ['default_ports', 'first_published', 'implementations', 'gotchas', 'spec_url'],
  software: ['speaks', 'platforms', 'price_model', 'gotchas', 'repo'],
  hardware: ['speaks', 'physical_ports', 'released', 'gotchas'],
  standards: ['year', 'scope', 'free_to_read', 'access_url'],
  terms: ['zh_hant', 'definition_zh_hant', 'false_friends', 'regional_variants'],
}
const gaps = []
for (const col of COLLECTIONS) {
  for (const entry of db[col.key]) {
    const missing = (WANTED[col.key] ?? []).filter((f) => {
      const v = entry[f]
      return v == null || (Array.isArray(v) && v.length === 0)
    })
    if (missing.length) gaps.push({ collection: col.key, id: entry.id, name: entry.name ?? entry.en ?? entry.designation, missing })
  }
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
const searchTpl = readFileSync(join(ROOT, 'site', 'search.html'), 'utf8')
mkdirSync(join(DIST, 'search'), { recursive: true })
writeFileSync(join(DIST, 'search', 'index.html'), searchTpl
  .replace('/*__SHOWSTACK_TOKENS__*/', TOKENS)
  .replace('/*__SHOWSTACK_BASE__*/', BASE_CSS)
  .replace('/*__SHOWSTACK_SHELL__*/', SHELL_CSS)
  .replace('/*__SHOWSTACK_NAV__*/', navBar('/search/'))
  .replace('/*__SHOWSTACK_LABELS__*/null', JSON.stringify(LABEL_MAPS))
  .replace('/*__SHOWSTACK_DATA__*/null', JSON.stringify(bundle)))

// The front page is generated by buildPages() below, through the same shell
// as every other page, so its header and nav cannot drift from the rest of
// the site. It ships counts only - no search index. Sending 2 MB of JSON to
// somebody reading a paragraph would be rude.
if (existsSync(join(ROOT, 'site', 'assets'))) cpSync(join(ROOT, 'site', 'assets'), join(DIST, 'assets'), { recursive: true })

// Static pages. The search app at / serves people who already know we exist;
// these serve the person typing "what port does sACN use" into a search engine,
// which is where nearly all first contact will come from.
const pageStats = buildPages(bundle, DIST)

console.log(`Built ${stats.total} entries -> dist/`)
console.log(`  ${Object.entries(stats.counts).map(([k, v]) => `${v} ${k}`).join(', ')}`)
console.log(`  ${stats.open_gaps} open field gaps, ${contributors.length} contributors credited`)
console.log(`  ${pageStats.pages} static pages incl. ${pageStats.ports} port pages, sitemap.xml, robots.txt, llms.txt`)
