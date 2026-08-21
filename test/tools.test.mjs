/**
 * The calculator arithmetic. These are the numbers a technician will set a
 * fixture, a console or a delay line to, so every function is tested against
 * externally known-good vectors, not against itself.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  sacnMulticast, artnetCompose, artnetSplit,
  dmxAbsolute, dmxFromAbsolute, dipSwitches, dipToAddress,
  speakerDelay, tcToFrames, framesToTc,
} from '../scripts/toolmath.mjs'

describe('sACN multicast', () => {
  test('known vectors from E1.31 addressing', () => {
    // Universe number lands in the low two octets of 239.255.0.0/16.
    assert.equal(sacnMulticast(1), '239.255.0.1')
    assert.equal(sacnMulticast(256), '239.255.1.0')
    assert.equal(sacnMulticast(257), '239.255.1.1')
    assert.equal(sacnMulticast(63999), '239.255.249.255')
  })
  test('rejects out-of-range universes', () => {
    assert.equal(sacnMulticast(0), null)
    assert.equal(sacnMulticast(64000), null)
    assert.equal(sacnMulticast('abc'), null)
  })
})

describe('Art-Net port-address', () => {
  test('compose and split are inverses across the field boundaries', () => {
    // 15-bit port-address: 7-bit Net, 4-bit Sub-Net, 4-bit Universe.
    assert.equal(artnetCompose(0, 0, 0), 0)
    assert.equal(artnetCompose(0, 0, 15), 15)
    assert.equal(artnetCompose(0, 1, 0), 16)
    assert.equal(artnetCompose(1, 0, 0), 256)
    assert.equal(artnetCompose(127, 15, 15), 32767)
    for (const p of [0, 15, 16, 255, 256, 4095, 32767]) {
      const t = artnetSplit(p)
      assert.equal(artnetCompose(t.net, t.subnet, t.universe), p)
    }
  })
  test('rejects fields past their bit width', () => {
    assert.equal(artnetCompose(128, 0, 0), null)
    assert.equal(artnetCompose(0, 16, 0), null)
    assert.equal(artnetCompose(0, 0, 16), null)
  })
})

describe('DMX absolute addressing', () => {
  test('round trips and edges', () => {
    assert.equal(dmxAbsolute(1, 1), 1)
    assert.equal(dmxAbsolute(1, 512), 512)
    assert.equal(dmxAbsolute(2, 1), 513)
    assert.deepEqual(dmxFromAbsolute(513), { universe: 2, address: 1 })
    assert.deepEqual(dmxFromAbsolute(512), { universe: 1, address: 512 })
    for (const n of [1, 2, 511, 512, 513, 1024, 1025, 99999]) {
      const t = dmxFromAbsolute(n)
      assert.equal(dmxAbsolute(t.universe, t.address), n)
    }
  })
  test('rejects address 0 and 513', () => {
    assert.equal(dmxAbsolute(1, 0), null)
    assert.equal(dmxAbsolute(1, 513), null)
  })
})

describe('DIP switches', () => {
  test('plain-binary convention: address 1 is switch 1 only', () => {
    assert.deepEqual(dipSwitches(1), [true, false, false, false, false, false, false, false, false])
  })
  test('address 274 = 256+16+2 = switches 2,5,9', () => {
    const sw = dipSwitches(274)
    const on = sw.map((v, i) => v ? i + 1 : null).filter(Boolean)
    assert.deepEqual(on, [2, 5, 9])
  })
  test('address 511 lights switches 1-9; 512 needs a 10th switch and is refused', () => {
    assert.deepEqual(dipSwitches(511), Array(9).fill(true))
    assert.equal(dipSwitches(512), null)
  })
  test('minus-one convention shifts by one', () => {
    // Old fixtures encode (address - 1): address 1 = all off.
    assert.deepEqual(dipSwitches(1, true), Array(9).fill(false))
    assert.deepEqual(dipSwitches(512, true), Array(9).fill(true))
  })
  test('dipToAddress inverts both conventions', () => {
    for (const a of [1, 2, 100, 274, 511]) {
      assert.equal(dipToAddress(dipSwitches(a)), a)
    }
    for (const a of [1, 256, 512]) {
      assert.equal(dipToAddress(dipSwitches(a, true), true), a)
    }
  })
})

describe('speaker delay', () => {
  test('20°C: speed of sound 343.4 m/s, 10 m ≈ 29.12 ms', () => {
    const r = speakerDelay(10, 20)
    assert.equal(r.speedOfSound, 343.4)
    assert.ok(Math.abs(r.ms - 29.12) < 0.02, `got ${r.ms}`)
  })
  test('0°C is audibly slower — the outdoor-winter-gig correction is real', () => {
    const cold = speakerDelay(30, 0).ms
    const warm = speakerDelay(30, 30).ms
    assert.ok(cold > warm)
    assert.ok(cold - warm > 4, 'a 30 m throw shifts by >4 ms across 0-30°C')
  })
  test('sample counts follow the ms', () => {
    const r = speakerDelay(3.434, 20) // exactly 10 ms at 343.4 m/s
    assert.equal(r.samples48k, 480)
    assert.equal(r.samples96k, 960)
  })
})

describe('timecode', () => {
  test('non-drop rates are plain arithmetic', () => {
    assert.equal(tcToFrames(0, 0, 1, 0, '25'), 25)
    assert.equal(tcToFrames(1, 0, 0, 0, '24'), 86400)
    assert.equal(tcToFrames(0, 10, 0, 0, '30'), 18000)
    assert.deepEqual(framesToTc(86400, '24'), { h: 1, m: 0, s: 0, f: 0 })
  })

  test('29.97DF: 00:01:00;02 is the frame after 00:00:59;29', () => {
    // The defining property of drop-frame.
    const before = tcToFrames(0, 0, 59, 29, '29.97df')
    const after = tcToFrames(0, 1, 0, 2, '29.97df')
    assert.equal(after, before + 1)
  })

  test('29.97DF: labels 00 and 01 do not exist at a non-tenth minute', () => {
    assert.equal(tcToFrames(0, 1, 0, 0, '29.97df'), null)
    assert.equal(tcToFrames(0, 1, 0, 1, '29.97df'), null)
    // ...but do exist at minute 0, 10, 20...
    assert.equal(tcToFrames(0, 10, 0, 0, '29.97df'), 17982)
  })

  test('29.97DF: one hour is exactly 107892 frames', () => {
    // 108000 nominal minus 108 dropped labels (2 × 54 non-tenth minutes).
    assert.equal(tcToFrames(1, 0, 0, 0, '29.97df'), 107892)
  })

  test('29.97DF round trip across a day of edge cases', () => {
    const cases = [
      [0, 0, 0, 0], [0, 0, 59, 29], [0, 1, 0, 2], [0, 9, 59, 29], [0, 10, 0, 0],
      [0, 10, 0, 1], [0, 59, 59, 29], [1, 0, 0, 0], [1, 1, 0, 2], [9, 59, 59, 29],
    ]
    for (const [h, m, s, f] of cases) {
      const n = tcToFrames(h, m, s, f, '29.97df')
      assert.notEqual(n, null, `expected ${h}:${m}:${s};${f} to be a valid DF label`)
      assert.deepEqual(framesToTc(n, '29.97df'), { h, m, s, f }, `frame ${n}`)
    }
  })

  test('29.97DF frames count monotonically over the minute boundary', () => {
    // Walk every frame of the first 11 minutes and require +1 steps.
    let prev = tcToFrames(0, 0, 0, 0, '29.97df')
    let count = 0
    for (let m = 0; m <= 10; m++) {
      for (let s = 0; s < 60; s++) {
        for (let f = 0; f < 30; f++) {
          const n = tcToFrames(0, m, s, f, '29.97df')
          if (n === null) continue // the dropped labels
          if (count > 0) assert.equal(n, prev + 1, `discontinuity at 0:${m}:${s};${f}`)
          prev = n
          count++
        }
      }
    }
    // Minutes 0-10 inclusive: the non-tenth minutes are 1 through 9, so nine
    // dropped pairs, not ten. (Minute 0 and minute 10 keep their labels.)
    assert.equal(count, 11 * 1800 - 2 * 9, 'frame count over 11 minutes with 9 dropped pairs')
  })
})
