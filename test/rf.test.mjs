/**
 * The RF frequency map. Regulatory data: the tests pin the documented band
 * edges per region and require a source on every sourced region - a wrong
 * row here is gear seized at customs, so the data IS the product.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { RFDATA, rfBands, rfCheck } from '../scripts/rfdata.mjs'

describe('documented band edges', () => {
  const bands = (id) => RFDATA.regions[id].bands
  test('US: 15.236 unlicensed set and the duplex-gap split', () => {
    const us = bands('us').map((b) => [b.from, b.to, b.use])
    assert.deepEqual(us.filter(([, , u]) => u === 'unlicensed').map(([f, t]) => [f, t]),
      [[54, 72], [76, 88], [174, 216], [470, 608], [614, 616], [657, 663]])
    assert.ok(us.some(([f, t, u]) => f === 653 && t === 657 && u === 'licensed'))
  })
  test('UK: Channel 38 and Channel 70 as Ofcom publishes them', () => {
    assert.ok(bands('uk').some((b) => b.from === 606.5 && b.to === 613.5))
    assert.ok(bands('uk').some((b) => b.from === 863.1 && b.to === 864.9 && b.use === 'unlicensed'))
  })
  test('EU harmonised duplex gaps', () => {
    assert.deepEqual(bands('eu').map((b) => [b.from, b.to]), [[823, 832], [1785, 1805]])
  })
  test('Japan: WS 470-710, dedicated 710-714, B-type 806-810 licence-free', () => {
    const jp = bands('jp')
    assert.ok(jp.some((b) => b.from === 470 && b.to === 710 && b.use === 'coordinated'))
    assert.ok(jp.some((b) => b.from === 710 && b.to === 714))
    assert.ok(jp.some((b) => b.from === 806 && b.to === 810 && b.use === 'unlicensed'))
  })
  test('Australia: 520-694 class licence and the 694-820 prohibition', () => {
    const au = bands('au')
    assert.ok(au.some((b) => b.from === 520 && b.to === 694 && b.use === 'unlicensed'))
    assert.ok(au.some((b) => b.from === 694 && b.to === 820 && b.use === 'prohibited'))
  })
  test('every region with bands cites at least one source', () => {
    for (const [id, r] of Object.entries(RFDATA.regions)) {
      if ((r.bands ?? []).length) {
        assert.ok((r.sources ?? []).length >= 1, `${id} has bands but no source`)
        for (const s of r.sources) assert.match(s.url, /^https:\/\//)
      }
    }
  })
  test('gap regions say so instead of guessing', () => {
    assert.equal(RFDATA.regions.tw.bands.length, 0)
    assert.ok(RFDATA.regions.tw.gapNote.length > 20)
    assert.equal(RFDATA.regions.cn.bands.length, 0)
    assert.ok(RFDATA.regions.hk.gapNote.length > 20)
  })
})

describe('rfCheck', () => {
  test('a prohibited hit outranks everything', () => {
    const r = rfCheck(RFDATA, 'au', 700)
    assert.equal(r.legal, false)
    assert.equal(r.banned, true)
  })
  test('600 MHz: fine in the US TV band, gone above 608', () => {
    assert.equal(rfCheck(RFDATA, 'us', 600).legal, true)
    assert.equal(rfCheck(RFDATA, 'us', 620).legal, false)
    assert.equal(rfCheck(RFDATA, 'us', 615).legal, true) // guard band
  })
  test('band edges are inclusive', () => {
    assert.equal(rfCheck(RFDATA, 'uk', 606.5).legal, true)
    assert.equal(rfCheck(RFDATA, 'uk', 613.5).legal, true)
  })
  test('unknown region and rubbish input return null', () => {
    assert.equal(rfCheck(RFDATA, 'xx', 600), null)
    assert.equal(rfCheck(RFDATA, 'us', 'abc'), null)
    assert.equal(rfCheck(RFDATA, 'us', -5), null)
  })
  test('rfBands returns the raw list or null', () => {
    assert.equal(rfBands(RFDATA, 'xx'), null)
    assert.ok(Array.isArray(rfBands(RFDATA, 'de')))
  })
})
