/**
 * Derived data and page generation.
 *
 * Two things are checked here.
 *
 * First, the derivations: `spoken_by` and the gaps list are computed at build
 * time rather than stored, so nobody has to maintain them by hand. If a
 * derivation breaks, the data files still look perfect in review and the site
 * is quietly wrong.
 *
 * Second, escaping. This project merges YAML written by strangers and renders
 * it straight into HTML. That is a content-injection path, and "we review PRs
 * carefully" is not a control. So the generator is tested against hostile input.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from '../scripts/lib/load.mjs'
import { buildPages } from '../scripts/pages.mjs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'

const DIST = join(ROOT, 'dist')
const bundlePath = join(DIST, 'showstack.json')

// The build must have run. `npm test` runs it first; say so plainly rather
// than failing with an unhelpful ENOENT.
assert.ok(
  existsSync(bundlePath),
  'dist/showstack.json is missing — run `npm run build` before the tests'
)
const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'))

describe('the interop matrix is derived correctly', () => {
  test('every speaks[] declaration appears in the target protocol spoken_by', () => {
    // This is the reverse index that answers "what can receive PSN?".
    // It is computed, so it can silently desync from the source of truth.
    const byId = Object.fromEntries(bundle.protocols.map((p) => [p.id, p]))
    const missing = []
    for (const kind of ['software', 'hardware']) {
      for (const e of bundle[kind]) {
        for (const s of e.speaks ?? []) {
          const target = byId[s.protocol]
          if (!target) { missing.push(`${e.id} -> unknown protocol ${s.protocol}`); continue }
          const found = (target.spoken_by ?? []).some((x) => x.id === e.id && x.direction === s.direction)
          if (!found) missing.push(`${e.id} speaks ${s.protocol} (${s.direction}) but is not in spoken_by`)
        }
      }
    }
    assert.deepEqual(missing, [], 'speaks declarations missing from the reverse index')
  })

  test('spoken_by contains no entry that does not declare the protocol', () => {
    // The inverse leak: a product credited with speaking something it never
    // claimed. That would put a wrong answer in front of someone specifying kit.
    const declared = new Set()
    for (const kind of ['software', 'hardware']) {
      for (const e of bundle[kind]) {
        for (const s of e.speaks ?? []) declared.add(`${e.id}|${s.protocol}`)
      }
    }
    const phantom = []
    for (const p of bundle.protocols) {
      for (const s of p.spoken_by ?? []) {
        if (!declared.has(`${s.id}|${p.id}`)) phantom.push(`${p.id} credits ${s.id}`)
      }
    }
    assert.deepEqual(phantom, [], 'spoken_by entries with no matching speaks declaration')
  })

  test('each spoken_by record carries what a reader needs to judge it', () => {
    // A bare id is useless in a table. Name, direction and confidence are what
    // make the matrix readable without clicking through.
    for (const p of bundle.protocols) {
      for (const s of p.spoken_by ?? []) {
        assert.ok(s.id, `${p.id}: spoken_by record without id`)
        assert.ok(s.name, `${p.id}/${s.id}: missing name`)
        assert.ok(['in', 'out', 'bidirectional'].includes(s.direction), `${p.id}/${s.id}: bad direction`)
        assert.ok(['verified', 'reported', 'unverified'].includes(s.confidence), `${p.id}/${s.id}: bad confidence`)
      }
    }
  })
})

describe('the gaps list is a usable contributor backlog', () => {
  test('every gap names a field that is genuinely absent', () => {
    // If gaps reports a field that is actually filled in, contributors are sent
    // to do work that is already done, and the backlog loses credibility fast.
    const byCollection = {
      protocols: Object.fromEntries(bundle.protocols.map((e) => [e.id, e])),
      software: Object.fromEntries(bundle.software.map((e) => [e.id, e])),
      hardware: Object.fromEntries(bundle.hardware.map((e) => [e.id, e])),
      standards: Object.fromEntries(bundle.standards.map((e) => [e.id, e])),
      terms: Object.fromEntries(bundle.terms.map((e) => [e.id, e])),
    }
    const wrong = []
    for (const g of bundle.gaps) {
      const entry = byCollection[g.collection]?.[g.id]
      assert.ok(entry, `gap points at missing entry ${g.collection}/${g.id}`)
      for (const field of g.missing) {
        const v = entry[field]
        const absent = v == null || (Array.isArray(v) && v.length === 0)
        if (!absent) wrong.push(`${g.collection}/${g.id}: ${field} is reported missing but present`)
      }
    }
    assert.deepEqual(wrong, [], 'gaps naming fields that are actually filled')
  })

  test('stats.open_gaps matches the gaps list length', () => {
    assert.equal(bundle.open_gaps, bundle.gaps.length)
  })
})

describe('published stats are internally consistent', () => {
  test('counts match the actual collections', () => {
    for (const key of ['protocols', 'software', 'hardware', 'standards', 'terms']) {
      assert.equal(bundle.counts[key], bundle[key].length, `counts.${key} disagrees with the data`)
    }
  })

  test('total equals the sum of the counts', () => {
    const sum = Object.values(bundle.counts).reduce((a, b) => a + b, 0)
    assert.equal(bundle.total, sum)
  })

  test('verified_share is a proportion, not a percentage', () => {
    // Rendered as a percentage on the site. If this ever became 0-100 the
    // homepage would claim 8300% verified.
    assert.ok(bundle.verified_share >= 0 && bundle.verified_share <= 1)
  })
})

describe('page generation is safe against hostile contributions', () => {
  // The threat: someone opens a PR adding an entry whose summary or gotcha
  // contains markup. It looks like prose in the diff and becomes script on the
  // live site. Reviewer attention is not a mitigation, escaping is.
  const XSS = '<script>alert(1)</script>'
  const BREAKOUT = '"><img src=x onerror=alert(1)>'

  const hostileBundle = () => ({
    generated: '2026-01-01',
    counts: { protocols: 1, software: 0, hardware: 0, standards: 0, terms: 0 },
    total: 1,
    contributors: [],
    open_gaps: 0,
    verified_share: 0,
    protocols: [{
      id: 'evil',
      name: `Evil ${XSS}`,
      category: 'lighting-control',
      summary: `A summary containing ${XSS} and ${BREAKOUT} which must not execute.`,
      openness: 'open-published',
      status: 'current',
      confidence: 'reported',
      gotchas: [`A gotcha with ${XSS}`],
      aka: [BREAKOUT],
      spoken_by: [],
      sources: [{ title: `Source ${XSS}`, url: 'https://example.com/' }],
    }],
    software: [], hardware: [], standards: [], terms: [], gaps: [],
  })

  test('script tags in contributed fields are escaped, not emitted', () => {
    const out = mkdtempSync(join(tmpdir(), 'showstack-xss-'))
    buildPages(hostileBundle(), out)
    const html = readFileSync(join(out, 'protocols', 'evil', 'index.html'), 'utf8')

    // What matters is that the *delimiters* are neutralised. The inert text
    // "onerror=alert(1)" may legitimately survive as visible prose, because
    // without an unescaped `<` or `"` around it there is nothing to break out
    // of. So assert on the dangerous constructs, not on scary-looking
    // substrings, or the test raises false alarms on correctly escaped output.
    assert.ok(!/<script>alert\(1\)<\/script>/.test(html), 'raw <script> payload reached the page')
    assert.ok(!/<img\s+src=x/i.test(html), 'an unescaped <img> tag was constructed from contributed text')

    // Nothing may re-open a tag after the head's own script blocks close.
    const bodyOnly = html.slice(html.indexOf('<body>'))
    assert.ok(!/<script/i.test(bodyOnly), 'contributed text introduced a <script> tag into the body')

    // And the payload should still be readable, escaped, rather than dropped.
    assert.ok(html.includes('&lt;script&gt;'), 'payload should appear escaped, not silently dropped')
  })

  test('JSON-LD cannot be broken out of by contributed text', () => {
    // JSON-LD sits in a <script type="application/ld+json"> block. A literal
    // </script> inside a string value would close it early and turn the rest
    // of the payload into executable markup.
    const out = mkdtempSync(join(tmpdir(), 'showstack-jsonld-'))
    buildPages(hostileBundle(), out)
    const html = readFileSync(join(out, 'protocols', 'evil', 'index.html'), 'utf8')

    const block = html.split('application/ld+json')[1]?.split('</script>')[0] ?? ''
    assert.ok(block.length > 0, 'expected a JSON-LD block')
    assert.doesNotThrow(
      () => JSON.parse(block.slice(block.indexOf('{'))),
      'JSON-LD block should still parse after hostile input'
    )
  })
})

describe('generated pages carry what search engines need', () => {
  // The static pages are the entire acquisition strategy. A page with no title
  // or no canonical is invisible or duplicate, either way it does not rank.
  const samples = [
    ['protocols', bundle.protocols[0]?.id],
    ['software', bundle.software[0]?.id],
  ].filter(([, id]) => id)

  for (const [kind, id] of samples) {
    test(`${kind}/${id} has a title, description and canonical`, () => {
      const path = join(DIST, kind, id, 'index.html')
      assert.ok(existsSync(path), `expected a generated page at ${kind}/${id}`)
      const html = readFileSync(path, 'utf8')

      const title = html.match(/<title>([^<]+)<\/title>/)?.[1]
      assert.ok(title && title.length > 10, 'missing or trivial <title>')

      const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1]
      assert.ok(desc && desc.length > 20, 'missing or trivial meta description')

      assert.ok(/<link rel="canonical"/.test(html), 'missing canonical link')
    })
  }

  test('sitemap, robots and llms.txt are emitted', () => {
    for (const f of ['sitemap.xml', 'robots.txt', 'llms.txt']) {
      assert.ok(existsSync(join(DIST, f)), `${f} was not generated`)
    }
  })

  test('the sitemap lists real, absolute URLs', () => {
    const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8')
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    assert.ok(locs.length > 50, 'sitemap looks suspiciously short')
    for (const l of locs.slice(0, 40)) assert.match(l, /^https?:\/\//)
  })
})

describe('comparison and interop pages', () => {
  test('every curated pair with both protocols present got a page', async () => {
    // The pair list may name protocols that do not exist yet, which is
    // deliberate. What must not happen is a pair whose protocols both exist
    // silently failing to generate.
    const { PAIRS } = await import('../scripts/compare.mjs')
    const have = new Set(bundle.protocols.map((p) => p.id))
    const expected = PAIRS.filter(([a, b]) => have.has(a) && have.has(b))
    assert.ok(expected.length > 0, 'expected at least one generatable pair')
    for (const [a, b] of expected) {
      assert.ok(
        existsSync(join(DIST, 'compare', `${a}-vs-${b}`, 'index.html')),
        `missing comparison page for ${a} vs ${b}`
      )
    }
  })

  test('a comparison page contains both protocols and real compared values', () => {
    const path = join(DIST, 'compare', 'art-net-vs-sacn', 'index.html')
    if (!existsSync(path)) return // skip if either protocol was removed
    const html = readFileSync(path, 'utf8')
    assert.match(html, /Art-Net/)
    assert.match(html, /sACN/)
    // The comparison must actually compare something, not render an empty table.
    assert.match(html, /Side by side/)
    assert.ok((html.match(/<tr>/g) ?? []).length >= 5, 'comparison table looks empty')
  })

  test('the interop picker inlines a usable product table', () => {
    const html = readFileSync(join(DIST, 'interop', 'index.html'), 'utf8')
    // Extract the inlined DB and confirm it is real, parseable data rather
    // than an empty shell that would render a broken picker.
    const m = html.match(/const DB = (\{.*?\});\n/s)
    assert.ok(m, 'inlined interop dataset not found')
    const db = JSON.parse(m[1].replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\u0026/g, '&'))
    assert.ok(db.products.length > 10, 'interop picker has suspiciously few products')
    assert.ok(Object.keys(db.protocols).length > 10, 'interop picker has no protocol names')
    for (const p of db.products.slice(0, 10)) {
      assert.ok(p.i && p.n, 'product needs an id and a name')
      assert.ok(Array.isArray(p.s) && p.s.length > 0, 'only products that speak something belong here')
    }
  })
})

describe('the built site has no orphans', () => {
  test('every generated entry page corresponds to a live entry', () => {
    // Pages are named after entry ids. Renaming or deleting an entry used to
    // leave the old directory in dist forever: still deployed, still indexed,
    // still serving a canonical, and backed by no file anyone could edit.
    // The build now clears dist first; this makes sure that stays true.
    const map = {
      protocols: bundle.protocols,
      software: bundle.software,
      hardware: bundle.hardware,
      standards: bundle.standards,
      glossary: bundle.terms,
    }
    const orphans = []
    for (const [dir, entries] of Object.entries(map)) {
      const live = new Set(entries.map((e) => e.id))
      const path = join(DIST, dir)
      if (!existsSync(path)) continue
      for (const name of readdirSync(path)) {
        if (name.endsWith('.html')) continue // the collection index page
        if (!live.has(name)) orphans.push(`${dir}/${name}`)
      }
    }
    assert.deepEqual(orphans, [], 'generated pages with no corresponding entry')
  })

  test('canonical URLs and the sitemap agree on one origin', () => {
    // A canonical pointing somewhere the sitemap does not list, or at a domain
    // that does not resolve, tells a crawler the page it just read is a
    // duplicate of nothing. That silently undoes the entire static-page effort.
    const html = readFileSync(join(DIST, 'protocols', 'sacn', 'index.html'), 'utf8')
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
    assert.ok(canonical, 'no canonical on a protocol page')
    const origin = new URL(canonical).origin

    const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8')
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).origin)
    const foreign = [...new Set(locs)].filter((o) => o !== origin)
    assert.deepEqual(foreign, [], `sitemap lists origins other than ${origin}`)
  })
})

/**
 * The vendor verification flow.
 *
 * These are cheap tests guarding an expensive property. An index that
 * manufacturers can correct is worth more than one they cannot, but only for
 * as long as the corollary holds: they cannot *buy* a correction. That promise
 * is made in prose, which means it can be edited away by accident in a tidy-up
 * six months from now, so it is pinned here.
 *
 * The URL length check exists because the issue bodies are generated from the
 * entry - a product that grows to forty protocols would silently produce a
 * link long enough for a proxy or an old browser to truncate, and a truncated
 * GitHub issue URL fails by opening a blank issue rather than by erroring.
 */
describe('vendor verification', () => {
  const verify = readFileSync(join(DIST, 'verify', 'index.html'), 'utf8')

  const issueLinks = (html) =>
    [...html.matchAll(/href="(https:\/\/github\.com\/[^"]*\/issues\/new\?[^"]*)"/g)].map((m) =>
      m[1].replace(/&amp;/g, '&'))

  test('every prefilled issue URL is well formed and short enough to survive', () => {
    const pages = ['verify', join('hardware', '7thsense-delta'), join('protocols', 'sacn')]
    let checked = 0
    for (const p of pages) {
      const file = join(DIST, p, 'index.html')
      if (!existsSync(file)) continue
      for (const href of issueLinks(readFileSync(file, 'utf8'))) {
        const u = new URL(href)
        assert.ok(u.searchParams.get('title'), `no title in ${href.slice(0, 80)}`)
        assert.ok(u.searchParams.get('body'), `no body in ${href.slice(0, 80)}`)
        // 6000 is well inside the 8192 that the most restrictive things in the
        // path actually enforce, and well above the ~1900 the longest entry
        // currently produces.
        assert.ok(href.length < 6000, `issue URL is ${href.length} chars: ${href.slice(0, 120)}`)
        checked++
      }
    }
    assert.ok(checked > 20, `expected many prefilled issue links, found ${checked}`)
  })

  test('the claim link only appears where somebody could answer it', () => {
    // A glossary term has no vendor, no steward and no publishing body, so
    // "work at X?" has nobody to address. Rendering it anyway would be the
    // kind of small dishonesty that costs a reader's trust in everything else.
    const term = readdirSync(join(DIST, 'glossary')).find((n) => !n.endsWith('.html'))
    if (term) {
      const html = readFileSync(join(DIST, 'glossary', term, 'index.html'), 'utf8')
      assert.ok(!html.includes('class="claim"'), 'a glossary term is being asked to verify itself')
    }
    const hw = readFileSync(join(DIST, 'hardware', '7thsense-delta', 'index.html'), 'utf8')
    assert.match(hw, /class="claim"/, 'a vendor product has no claim link')
    assert.match(hw, /Work at 7thSense\?/)
  })

  test('the no-purchase promise is still on the page', () => {
    // The entire value of a neutral index rests on this sentence. If a future
    // edit softens it into "sponsors may be featured", that is a different
    // website and this test should be the thing that says so.
    assert.match(verify, /cannot buy an entry/i)
    assert.match(verify, /[Ss]ponsor(ing|ship) does not (move data|change)/i)
    assert.match(verify, /cannot delete a true fact/i)
    // And the same promise has to reach the machines, because an assistant
    // repeating "showstack listings are sponsored" would do the damage
    // whether or not the page says otherwise.
    const llms = readFileSync(join(DIST, 'llms.txt'), 'utf8')
    assert.match(llms, /[Nn]othing here is a paid\s+placement/)
  })

  test('the vendor table is generated from the data, not written by hand', () => {
    const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'))
    const counts = new Map()
    for (const e of [...bundle.software, ...bundle.hardware]) {
      if (e.vendor) counts.set(e.vendor, (counts.get(e.vendor) ?? 0) + 1)
    }
    const expected = [...counts.values()].filter((n) => n >= 2).length
    const rows = (verify.match(/>Check th(em|it)</g) ?? []).length
    assert.equal(rows, expected, 'vendor table row count has drifted from the dataset')
  })
})
