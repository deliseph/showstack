/**
 * The editorial promises, written as executable rules.
 *
 * The schema in schema/ says what shape an entry may take. This file says what
 * the project *means*: that a fact has a source, that "verified" is earned
 * rather than typed, that a reference to another entry actually resolves.
 *
 * Every rule here exists because breaking it would make the index untrustworthy
 * in a way that a JSON Schema cannot catch. If you are adding a rule, the test
 * is whether a reviewer could otherwise merge a plausible-looking PR that
 * quietly degrades the data.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { COLLECTIONS, loadAll } from '../scripts/lib/load.mjs'

const all = loadAll()

/** Every entry across every collection, tagged with where it came from. */
const flat = COLLECTIONS.flatMap((c) => all[c.key].map((e) => ({ collection: c.key, ...e })))

/** Ids that exist, per collection, for reference checking. */
const idsIn = Object.fromEntries(
  COLLECTIONS.map((c) => [c.key, new Set(all[c.key].map((e) => e.doc?.id))])
)

describe('provenance', () => {
  test('every entry cites at least one source', () => {
    // An entry with no source is an opinion, not data. This is the whole
    // premise of the project and it is worth failing loudly over.
    const bare = flat.filter((e) => !(e.doc.sources ?? []).length)
    assert.deepEqual(bare.map((e) => e.relpath), [], 'entries with no sources')
  })

  test('source URLs are absolute http(s)', () => {
    // A relative or mailto: source cannot be checked by a reader, which
    // defeats the point of citing it.
    const bad = []
    for (const e of flat) {
      for (const s of e.doc.sources ?? []) {
        if (!/^https?:\/\//.test(s.url ?? '')) bad.push(`${e.relpath}: ${s.url}`)
      }
    }
    assert.deepEqual(bad, [], 'sources that are not absolute http(s) URLs')
  })

  test('confidence: verified requires a source marked primary', () => {
    // "verified" means someone checked the primary document or the real
    // hardware. Without a primary source on the entry, the claim is not
    // checkable by the next reader, so it is at best "reported".
    const unearned = flat.filter(
      (e) => e.doc.confidence === 'verified' && !(e.doc.sources ?? []).some((s) => s.primary)
    )
    assert.deepEqual(
      unearned.map((e) => e.relpath),
      [],
      'entries claiming verified with no primary source'
    )
  })

  test('no placeholder text survives into the data', () => {
    // Catches a half-finished contribution being merged with TODO in a field
    // that then renders on a public page as if it were a fact.
    const placeholder = /\b(TODO|TBD|FIXME|XXX|lorem ipsum|coming soon)\b/i
    const hits = flat.filter((e) => placeholder.test(JSON.stringify(e.doc)))
    assert.deepEqual(hits.map((e) => e.relpath), [], 'entries containing placeholder text')
  })
})

describe('identity', () => {
  test('id matches filename', () => {
    // The URL of a page is derived from the id, and the file is found by name.
    // If they drift, links break silently.
    const mismatched = flat.filter((e) => e.doc.id !== e.expectedId)
    assert.deepEqual(
      mismatched.map((e) => `${e.relpath} declares id: ${e.doc.id}`),
      [],
      'entries whose id does not match their filename'
    )
  })

  test('ids are unique within a collection', () => {
    for (const c of COLLECTIONS) {
      const seen = new Map()
      const dupes = []
      for (const e of all[c.key]) {
        if (seen.has(e.doc.id)) dupes.push(`${e.doc.id}: ${seen.get(e.doc.id)} and ${e.relpath}`)
        seen.set(e.doc.id, e.relpath)
      }
      assert.deepEqual(dupes, [], `duplicate ids in ${c.key}`)
    }
  })
})

describe('cross references resolve', () => {
  test('speaks[].protocol points at a real protocol', () => {
    // A typo here produces a product page listing a protocol that has no page,
    // and an interop answer that silently never matches.
    const dangling = []
    for (const kind of ['software', 'hardware']) {
      for (const e of all[kind]) {
        for (const s of e.doc.speaks ?? []) {
          if (!idsIn.protocols.has(s.protocol)) dangling.push(`${e.relpath} -> ${s.protocol}`)
        }
      }
    }
    assert.deepEqual(dangling, [], 'speaks entries pointing at unknown protocols')
  })

  test('protocol standards[] point at real standards', () => {
    const dangling = []
    for (const e of all.protocols) {
      for (const id of e.doc.standards ?? []) {
        if (!idsIn.standards.has(id)) dangling.push(`${e.relpath} -> ${id}`)
      }
    }
    assert.deepEqual(dangling, [], 'protocols referencing unknown standards')
  })

  test('superseded_by points at a real entry in the same collection', () => {
    const dangling = []
    for (const c of COLLECTIONS) {
      for (const e of all[c.key]) {
        const target = e.doc.superseded_by
        if (target && !idsIn[c.key].has(target)) dangling.push(`${e.relpath} -> ${target}`)
      }
    }
    assert.deepEqual(dangling, [], 'superseded_by pointing at unknown entries')
  })
})

describe('safety-critical content', () => {
  test('terms flagged safety_critical carry a real definition', () => {
    // These are the entries where being wrong or empty can hurt someone.
    // A safety flag with no definition is worse than no entry at all, because
    // it looks authoritative while saying nothing.
    const thin = all.terms
      .filter((t) => t.doc.safety_critical)
      .filter((t) => !t.doc.definition_en || t.doc.definition_en.trim().length < 20)
    assert.deepEqual(
      thin.map((t) => t.relpath),
      [],
      'safety-critical terms without a substantive definition'
    )
  })
})

describe('freshness', () => {
  test('updated is not in the future', () => {
    // A future date defeats staleness sorting and usually means a typo'd year.
    const today = new Date().toISOString().slice(0, 10)
    const future = flat.filter((e) => e.doc.updated && String(e.doc.updated) > today)
    assert.deepEqual(
      future.map((e) => `${e.relpath}: ${e.doc.updated}`),
      [],
      'entries dated in the future'
    )
  })
})
