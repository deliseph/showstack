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
  powerLoad, beamDiameter, illuminance, ledWall, rfWavelength,
  ohmsLaw, speakerImpedance, processingDelay,
  dbuToDbv, dbvToDbu,
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

describe('power load', () => {
  test('single phase: 1200 W at 120 V is 10 A', () => {
    assert.equal(powerLoad(1200, 120).amps, 10)
  })
  test('three phase: 10 kW at 208 V line-to-line is 27.76 A per line', () => {
    // 10000 / (sqrt(3) x 208) = 27.7570...
    assert.ok(Math.abs(powerLoad(10000, 208, 3).amps - 27.76) < 0.01)
  })
  test('power factor raises the current, never the wattage', () => {
    // Same rig at PF 0.85 draws more amps: 10 / 0.85 = 11.76.
    assert.ok(Math.abs(powerLoad(1200, 120, 1, 0.85).amps - 11.76) < 0.01)
  })
  test('rejects nonsense', () => {
    assert.equal(powerLoad(-1, 120), null)
    assert.equal(powerLoad(1200, 0), null)
    assert.equal(powerLoad(1200, 120, 2), null)
    assert.equal(powerLoad(1200, 120, 1, 1.2), null)
  })
})

describe('beam and photometrics', () => {
  test('26 degrees at 10 m is a 4.62 m pool', () => {
    // 2 x 10 x tan(13 deg) = 4.617
    assert.ok(Math.abs(beamDiameter(10, 26).diameter - 4.62) < 0.01)
  })
  test('inverse square: 100000 cd at 10 m is 1000 lx / 92.9 fc', () => {
    const e = illuminance(100000, 10)
    assert.equal(e.lux, 1000)
    assert.ok(Math.abs(e.footcandles - 92.9) < 0.05)
  })
  test('doubling the throw quarters the light', () => {
    assert.ok(Math.abs(illuminance(100000, 20).lux - 250) < 0.1)
  })
  test('rejects zero throw for illuminance and silly angles', () => {
    assert.equal(illuminance(100000, 0), null)
    assert.equal(beamDiameter(10, 0), null)
    assert.equal(beamDiameter(10, 180), null)
  })
})

describe('LED wall', () => {
  test('5 m x 3 m at 3.9 mm pitch is 1282 x 769 px', () => {
    const r = ledWall(5, 3, 3.9)
    assert.equal(r.pxW, 1282)
    assert.equal(r.pxH, 769)
    assert.equal(r.totalPx, 1282 * 769)
  })
  test('the viewing-distance rule of thumb tracks the pitch', () => {
    assert.equal(ledWall(5, 3, 2.6).minViewMeters, 2.6)
  })
  test('rejects zero pitch', () => {
    assert.equal(ledWall(5, 3, 0), null)
  })
})

describe('RF wavelength', () => {
  test('600 MHz is a 0.5 m wave', () => {
    // c / f = 299.792458 / 600 = 0.49965...
    const r = rfWavelength(600)
    assert.ok(Math.abs(r.wavelength - 0.5) < 0.001)
    // Quarter-wave with 5% end effect: 0.11867 m = ~4.7 in.
    assert.ok(Math.abs(r.quarterWave - 0.119) < 0.001)
    assert.ok(Math.abs(r.quarterWaveInches - 4.7) < 0.1)
  })
  test('half-wave matches the 468/f_MHz feet rule within a percent', () => {
    // 468 / 600 = 0.78 ft = 0.2377 m; ours: lambda/2 x 0.95 = 0.2373 m.
    const metres = rfWavelength(600).halfWave
    assert.ok(Math.abs(metres - (468 / 600) * 0.3048) < 0.005)
  })
  test('rejects non-positive frequency', () => {
    assert.equal(rfWavelength(0), null)
    assert.equal(rfWavelength('x'), null)
  })
})

describe('dBu / dBV line-level conversion', () => {
  test('0 dBu and 0 dBV are 2.21 dB apart, independent of level', () => {
    assert.equal(dbuToDbv(0), -2.21)
    assert.equal(dbvToDbu(0), 2.21)
  })
  test('+4 dBu vs -10 dBV: the textbook 11.79 dB gap between pro and consumer nominal levels', () => {
    const proAsDbu = 4
    const consumerAsDbu = dbvToDbu(-10)
    assert.ok(Math.abs((proAsDbu - consumerAsDbu) - 11.79) < 0.01)
  })
  test('round-trips within rounding error', () => {
    assert.equal(dbvToDbu(dbuToDbv(4)), 4)
    assert.equal(dbuToDbv(dbvToDbu(-10)), -10)
  })
  test('rejects non-numeric input', () => {
    assert.equal(dbuToDbv('x'), null)
    assert.equal(dbvToDbu(undefined), null)
  })
})

describe("Ohm's law solver", () => {
  test('volts and ohms give the rest: 120 V across 12 ohms', () => {
    assert.deepEqual(ohmsLaw({ v: 120, r: 12 }), { volts: 120, amps: 10, ohms: 12, watts: 1200 })
  })
  test('watts and volts: a 1 kW load at 100 V draws 10 A', () => {
    const r = ohmsLaw({ p: 1000, v: 100 })
    assert.equal(r.amps, 10)
    assert.equal(r.ohms, 10)
  })
  test('watts and ohms: 200 W into 8 ohms is 40 V, 5 A', () => {
    const r = ohmsLaw({ r: 8, p: 200 })
    assert.equal(r.volts, 40)
    assert.equal(r.amps, 5)
  })
  test('needs exactly two knowns', () => {
    assert.equal(ohmsLaw({ v: 120 }), null)
    assert.equal(ohmsLaw({ v: 120, i: 1, r: 8 }), null)
    assert.equal(ohmsLaw({}), null)
  })
  test('rejects non-physical values', () => {
    assert.equal(ohmsLaw({ v: 120, r: 0 }), null)
    assert.equal(ohmsLaw({ v: -1, r: 8 }), null)
  })
})

describe('speaker impedance', () => {
  test('two 8-ohm boxes in parallel are 4 ohms; four are 2', () => {
    assert.equal(speakerImpedance([8, 8]).total, 4)
    assert.equal(speakerImpedance([8, 8, 8, 8]).total, 2)
  })
  test('mixed parallel: 8 and 4 in parallel is 2.67', () => {
    assert.equal(speakerImpedance([8, 4]).total, 2.67)
  })
  test('series adds: two 8-ohm drivers in series are 16', () => {
    assert.equal(speakerImpedance([8, 8], 'series').total, 16)
  })
  test('parallel power share: the 4-ohm box takes twice the power of the 8', () => {
    // Same voltage across both, P = V^2/Z, so shares go as 1/Z.
    assert.deepEqual(speakerImpedance([8, 4], 'parallel', 300).share, [100, 200])
  })
  test('series power share follows impedance instead', () => {
    // Same current through both, P = I^2 Z.
    assert.deepEqual(speakerImpedance([8, 4], 'series', 300).share, [200, 100])
  })
  test('rejects empty lists, zero ohms and unknown wiring', () => {
    assert.equal(speakerImpedance([]), null)
    assert.equal(speakerImpedance([8, 0]), null)
    assert.equal(speakerImpedance([8], 'star'), null)
  })
})

describe('processing delay budget', () => {
  test('stages sum and convert: 2 + 1.5 + 0.5 ms', () => {
    const r = processingDelay([2, 1.5, 0.5])
    assert.equal(r.totalMs, 4)
    assert.equal(r.samples48k, 192)
    assert.equal(r.samples96k, 384)
    assert.ok(Math.abs(r.meters - 1.37) < 0.01)
  })
  test('10 ms of DSP is 3.43 m of arrival error at 20 C', () => {
    assert.ok(Math.abs(processingDelay([10]).meters - 3.43) < 0.01)
  })
  test('rejects empty and negative stages', () => {
    assert.equal(processingDelay([]), null)
    assert.equal(processingDelay([1, -2]), null)
  })
})
