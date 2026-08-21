/**
 * The published query API.
 *
 * These functions are the package's contract with anyone who runs
 * `npm install showstack`. Changing their return shape breaks other people's
 * code, so the shapes are pinned here deliberately.
 *
 * Tests assert on *behaviour and shape*, not on specific dataset contents,
 * because the dataset grows every week and a test that hard-codes "sACN has 15
 * speakers" fails on the next contribution for no good reason. Where a real id
 * is needed, it is chosen from the data at runtime.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import api, {
  byPort, whoSpeaks, interop, term, get, search, missing,
  protocols, products, meta,
} from '../packages/showstack-js/src/index.js'

describe('byPort', () => {
  test('finds the protocol that owns a well-known port', () => {
    // 5568 is sACN. If this ever stops working the flagship use case
    // ("something is on port 5568, what is it?") is broken.
    const hits = byPort(5568)
    assert.ok(hits.length > 0, 'expected at least one protocol on port 5568')
    assert.ok(hits.some((p) => p.id === 'sacn'), 'expected sACN among port 5568 results')
  })

  test('accepts a string port, because CLI args arrive as strings', () => {
    assert.deepEqual(byPort('5568').map((p) => p.id), byPort(5568).map((p) => p.id))
  })

  test('filters by transport when asked', () => {
    const udp = byPort(5568, 'udp')
    const tcp = byPort(5568, 'tcp')
    assert.ok(udp.length > 0)
    assert.equal(tcp.length, 0, 'sACN is not TCP')
  })

  test('returns an empty array for an unused port, never null', () => {
    // Callers do .map() on this. Returning null would be a breaking change.
    assert.deepEqual(byPort(1), [])
  })
})

describe('whoSpeaks', () => {
  test('returns speakers for a widely implemented protocol', () => {
    const speakers = whoSpeaks('art-net')
    assert.ok(speakers.length > 0, 'expected products speaking Art-Net')
    for (const s of speakers) {
      assert.ok(s.id && s.name, 'each speaker carries id and name')
      assert.ok(['in', 'out', 'bidirectional'].includes(s.direction))
      assert.ok(['software', 'hardware'].includes(s.kind))
    }
  })

  test('direction filter includes bidirectional devices', () => {
    // A bidirectional device can receive, so asking "what can receive X"
    // must include it. Getting this wrong gives dangerously incomplete answers
    // to the question the interop matrix exists to answer.
    const receivers = whoSpeaks('art-net', 'in')
    const bidi = whoSpeaks('art-net').filter((s) => s.direction === 'bidirectional')
    for (const b of bidi) {
      assert.ok(receivers.some((r) => r.id === b.id), `${b.id} is bidirectional so must count as a receiver`)
    }
  })

  test('unknown protocol yields an empty array', () => {
    assert.deepEqual(whoSpeaks('definitely-not-a-protocol'), [])
  })
})

describe('interop', () => {
  test('finds a shared protocol path between two real products', () => {
    // Build the expectation from the data rather than hard-coding a pair,
    // so this survives entries being added or renamed.
    const senders = products.filter((p) => (p.speaks ?? []).some((s) => s.direction !== 'in'))
    let found = null
    outer: for (const a of senders) {
      const aOut = (a.speaks ?? []).filter((s) => s.direction !== 'in').map((s) => s.protocol)
      for (const b of products) {
        if (b.id === a.id) continue
        const bIn = (b.speaks ?? []).filter((s) => s.direction !== 'out').map((s) => s.protocol)
        if (aOut.some((p) => bIn.includes(p))) { found = [a.id, b.id]; break outer }
      }
    }
    assert.ok(found, 'dataset should contain at least one interoperable pair')
    const paths = interop(found[0], found[1])
    assert.ok(paths.length > 0)
    for (const p of paths) {
      assert.ok(p.from && p.to && p.protocol)
      assert.ok([found[0], found[1]].includes(p.from))
    }
  })

  test('is symmetric: interop(a,b) and interop(b,a) describe the same links', () => {
    // The function reports both directions, so argument order must not change
    // the answer. A tech asking "can the desk talk to the server" and one
    // asking the reverse deserve the same set of facts.
    const [a, b] = ['qlab', 'eos-family']
    const key = (x) => `${x.from}->${x.to}:${x.protocol}`
    const ab = interop(a, b).map(key).sort()
    const ba = interop(b, a).map(key).sort()
    assert.deepEqual(ab, ba)
  })

  test('unknown product ids give an empty array rather than throwing', () => {
    assert.deepEqual(interop('nope', 'also-nope'), [])
    assert.deepEqual(interop('qlab', 'also-nope'), [])
  })
})

describe('term lookup', () => {
  test('finds a term by its slug', () => {
    const anyTerm = api.terms[0]
    assert.ok(anyTerm, 'dataset has terms')
    const hits = term(anyTerm.id)
    assert.ok(hits.some((t) => t.id === anyTerm.id))
  })

  test('is case insensitive on English', () => {
    const withEn = api.terms.find((t) => t.en)
    assert.ok(withEn)
    assert.ok(term(withEn.en.toUpperCase()).some((t) => t.id === withEn.id))
  })

  test('finds a term by its Traditional Chinese form', () => {
    // The bilingual lookup is the part with no competitor, so it gets a test.
    const withZh = api.terms.find((t) => t.zh_hant)
    assert.ok(withZh, 'dataset has at least one zh_hant term')
    assert.ok(term(withZh.zh_hant).some((t) => t.id === withZh.id))
  })
})

describe('get', () => {
  test('fetches a known entry', () => {
    const p = get('protocols', 'sacn')
    assert.ok(p)
    assert.equal(p.id, 'sacn')
  })

  test('returns null, not undefined, for misses', () => {
    assert.equal(get('protocols', 'nope'), null)
    assert.equal(get('not-a-collection', 'sacn'), null)
  })
})

describe('search', () => {
  test('matches on a port number typed as a bare string', () => {
    // This is what someone types mid-problem.
    assert.ok(search('5568').length > 0)
  })

  test('requires all whitespace-separated terms to match', () => {
    const both = search('art-net lighting')
    for (const r of both) {
      const hay = JSON.stringify(r).toLowerCase()
      assert.ok(hay.includes('art-net') && hay.includes('lighting'))
    }
  })

  test('respects the collection filter and the limit', () => {
    const only = search('a', { collection: 'protocols', limit: 3 })
    assert.ok(only.length <= 3)
    for (const r of only) assert.equal(r.collection, 'protocols')
  })

  test('tags each result with the collection it came from', () => {
    // Callers render results in a mixed list and need to know what they got.
    for (const r of search('sacn')) {
      assert.ok(['protocols', 'software', 'hardware', 'standards', 'terms'].includes(r.collection))
    }
  })
})

describe('missing (the contributor backlog)', () => {
  test('returns gap records with a collection, id and missing fields', () => {
    const gaps = missing()
    assert.ok(Array.isArray(gaps))
    for (const g of gaps.slice(0, 20)) {
      assert.ok(g.collection && g.id)
      assert.ok(Array.isArray(g.missing) && g.missing.length > 0)
    }
  })

  test('filters to one collection', () => {
    for (const g of missing('protocols')) assert.equal(g.collection, 'protocols')
  })
})

describe('package surface', () => {
  test('the default export carries the same functions as the named exports', () => {
    // Both import styles are documented, so both must keep working.
    for (const fn of ['byPort', 'whoSpeaks', 'interop', 'term', 'get', 'search', 'missing']) {
      assert.equal(typeof api[fn], 'function', `default export missing ${fn}`)
    }
  })

  test('meta reports counts that match the collections', () => {
    assert.equal(meta.counts.protocols, protocols.length)
    assert.ok(meta.total > 0)
  })

  test('every protocol carries a computed spoken_by array', () => {
    // Derived at build time. If the build stops emitting it, whoSpeaks
    // silently returns nothing for everything.
    for (const p of protocols) assert.ok(Array.isArray(p.spoken_by), `${p.id} lost spoken_by`)
  })
})
