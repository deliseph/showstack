/**
 * The converged-network planner. The QoS data is the product here: these
 * tests pin the documented DSCP values and the conflict logic that is the
 * whole reason the page exists.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { NETDATA, qosPlan, linkFill } from '../scripts/netmath.mjs'
import { speakerNetwork } from '../scripts/toolmath.mjs'

describe('documented DSCP values', () => {
  const dscpOf = (proto, kind) => NETDATA.protocols[proto].classes.find((c) => c.kind === kind)?.dscp

  test('Dante: clock CS7 56, audio EF 46 (Audinate)', () => {
    assert.equal(dscpOf('dante', 'clock'), 56)
    assert.equal(dscpOf('dante', 'media'), 46)
  })
  test('Q-LAN: PTPv2 EF 46, audio AF41 34 (Q-SYS)', () => {
    assert.equal(dscpOf('qlan', 'clock'), 46)
    assert.equal(NETDATA.protocols.qlan.classes.find((c) => c.label.startsWith('Audio')).dscp, 34)
  })
  test('standard AES67: clock 46, media 34', () => {
    assert.equal(dscpOf('aes67', 'clock'), 46)
    assert.equal(dscpOf('aes67', 'media'), 34)
  })
  test('every class carries a source URL', () => {
    for (const p of Object.values(NETDATA.protocols)) {
      assert.match(p.source, /^https?:\/\//, `${p.name} has no source`)
    }
    for (const b of Object.values(NETDATA.bandwidth)) {
      assert.match(b.source, /^https?:\/\//, `${b.label} has no source`)
    }
  })
})

describe('qosPlan conflicts', () => {
  test('Dante audio vs Q-LAN clock on EF 46 is flagged', () => {
    // The signature converged-network failure: one queue, two meanings.
    const plan = qosPlan(NETDATA, ['dante', 'qlan'])
    assert.equal(plan.conflicts.length, 1)
    assert.equal(plan.conflicts[0].dscp, 46)
    assert.deepEqual(plan.conflicts[0].clocks, ['Q-LAN (Q-SYS)'])
    assert.deepEqual(plan.conflicts[0].heavy, ['Dante'])
  })
  test('Dante audio vs standard AES67 clock collides the same way', () => {
    const plan = qosPlan(NETDATA, ['dante', 'aes67'])
    assert.ok(plan.conflicts.some((c) => c.dscp === 46))
  })
  test('Dante alone has no conflict - 46 is only its own media', () => {
    assert.equal(qosPlan(NETDATA, ['dante']).conflicts.length, 0)
  })
  test('sACN + Art-Net alone conflict with nothing', () => {
    assert.equal(qosPlan(NETDATA, ['sacn', 'art-net']).conflicts.length, 0)
  })
  test('clocks land in the strict queue, bulk in best effort', () => {
    const plan = qosPlan(NETDATA, ['dante', 'ndi'])
    assert.ok(plan.queues[0].holds.every((r) => r.kind === 'clock'))
    assert.ok(plan.queues[3].holds.some((r) => r.id === 'ndi'))
  })
  test('AVB is reported as reservation-based, not DSCP', () => {
    assert.equal(qosPlan(NETDATA, ['avb-milan']).avb, true)
  })
})

describe('linkFill', () => {
  test('8 Dante flows + 4 NDI + 16 sACN universes on gigabit', () => {
    const f = linkFill(NETDATA, { 'dante-flow-48k': 8, 'ndi-1080p60': 4, 'sacn-universe': 16 })
    // 8x5 + 4x150 + 16x0.23 = 643.68
    assert.ok(Math.abs(f.totalMbps - 643.7) < 0.1)
    assert.equal(f.links.g1.ok, true)
    assert.equal(f.links.m100.ok, false)
  })
  test('one uncompressed ST 2110 HD flow does not fit gigabit', () => {
    const f = linkFill(NETDATA, { 'st2110-hd': 1 })
    assert.equal(f.links.g1.ok, false)
    assert.equal(f.links.g10.ok, true)
  })
  test('the 75% headroom rule marks 80% load as not ok', () => {
    const f = linkFill(NETDATA, { 'ndi-1080p60': 5.34 })
    assert.equal(f.links.g1.ok, false)
  })
  test('unknown keys and zero counts are ignored', () => {
    const f = linkFill(NETDATA, { nonsense: 5, 'dante-flow-48k': 0 })
    assert.equal(f.totalMbps, 0)
  })
})

describe('mixed speaker wiring', () => {
  test('two series pairs in parallel: 8+8, 8+8 is 8 ohms', () => {
    const r = speakerNetwork('8+8, 8+8', 400)
    assert.equal(r.total, 8)
    assert.equal(r.boxes, 4)
    assert.deepEqual(r.groups.map((g) => g.watts), [200, 200])
    assert.deepEqual(r.groups[0].perBox, [100, 100])
  })
  test('uneven groups split power by conductance: 4+4 vs 8', () => {
    const r = speakerNetwork('4+4, 8', 300)
    assert.equal(r.total, 4)
    // Both groups are 8 ohms, so they split evenly; the series pair halves again.
    assert.deepEqual(r.groups[0].perBox, [75, 75])
    assert.deepEqual(r.groups[1].perBox, [150])
  })
  test('pure parallel and pure series still work through the notation', () => {
    assert.equal(speakerNetwork('8, 8').total, 4)
    assert.equal(speakerNetwork('8+8').total, 16)
    assert.equal(speakerNetwork('8 || 8').total, 4)
  })
  test('a series box takes power in proportion to its impedance', () => {
    const r = speakerNetwork('8+4', 300)
    assert.deepEqual(r.groups[0].perBox, [200, 100])
  })
  test('rejects rubbish', () => {
    assert.equal(speakerNetwork(''), null)
    assert.equal(speakerNetwork('8+x'), null)
    assert.equal(speakerNetwork('8, 0'), null)
  })
})
