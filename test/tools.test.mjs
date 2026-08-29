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
  bridleTension, voltageDrop, phaseBalance, noiseDose, intermod3,
  subnetCidr, dmxLineBudget, splAtDistance, frameBudget, pyroCueTime, clockDrift, pollingCost, jitterMargin,
  requiredPerformanceLevel, stoppingDistance, safeguardDistance,
  hexToChannels, codeToLight, videoRange, chromaBitrate, rt60Sabine, stereoParallax,
  miredShift, fibreLossBudget, heatLoad, videoStorage, batteryRuntime, whFromMah, aspectFit,
  roomModes, lineArrayCoverage, stopsOfLight,
  windLoad, beaufort, dewPoint, flashRate, assistiveListening,
  cableDerating, awgToMm2, mm2ToAwg, coaxReach, SDI_RATES,
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

describe('bridle tension', () => {
  test('the three angles every rigger is taught', () => {
    // Dead hang: each leg takes half.
    assert.deepEqual(bridleTension(500, 0).perLegKg, 250)
    // 45 degrees from vertical: 1/cos45 = 1.414, so 500/(2*0.7071).
    assert.equal(bridleTension(500, 45).perLegKg, 353.55)
    assert.equal(bridleTension(500, 45).multiplier, 1.41)
    // 60 degrees from vertical, 120 included: each leg takes the WHOLE load.
    const wide = bridleTension(500, 60)
    assert.equal(wide.perLegKg, 500)
    assert.equal(wide.multiplier, 2)
    assert.equal(wide.includedAngle, 120)
  })
  test('vertical components always sum back to the load', () => {
    for (const angle of [0, 15, 30, 45, 60, 75]) {
      const r = bridleTension(1000, angle)
      assert.ok(Math.abs(r.verticalKg * 2 - 1000) < 0.5, `angle ${angle}`)
    }
  })
  test('horizontal pull is what the structure feels sideways', () => {
    // At 45 degrees the sideways pull equals the vertical share.
    const r = bridleTension(500, 45)
    assert.equal(r.horizontalKg, r.verticalKg)
  })
  test('refuses angles at or past horizontal', () => {
    assert.equal(bridleTension(500, 89), null)
    assert.equal(bridleTension(500, 90), null)
    assert.equal(bridleTension(500, -1), null)
    assert.equal(bridleTension('abc', 30), null)
  })
})

describe('voltage drop', () => {
  test('single phase: 2 * I * L * rho / A', () => {
    // 32 A, 50 m one-way, 6 mm^2 copper, 230 V.
    // 2 * 32 * 50 * 0.0172 / 6 = 9.17 V = 3.99%.
    const r = voltageDrop(32, 50, 6, 230, 1)
    assert.equal(r.dropVolts, 9.17)
    assert.equal(r.dropPercent, 3.99)
    assert.equal(r.withinLighting, false)  // over the 3% lighting convention
    assert.equal(r.withinPower, true)      // inside the 5% power convention
  })
  test('three phase uses sqrt(3), not 2', () => {
    const one = voltageDrop(32, 50, 6, 400, 1)
    const three = voltageDrop(32, 50, 6, 400, 3)
    assert.ok(three.dropVolts < one.dropVolts)
    assert.ok(Math.abs(three.dropVolts / one.dropVolts - Math.sqrt(3) / 2) < 0.01)
  })
  test('aluminium is worse than copper for the same size', () => {
    assert.ok(voltageDrop(32, 50, 6, 230, 1, 'aluminium').dropVolts >
              voltageDrop(32, 50, 6, 230, 1, 'copper').dropVolts)
  })
  test('rejects impossible inputs', () => {
    assert.equal(voltageDrop(32, 50, 0, 230, 1), null)
    assert.equal(voltageDrop(32, 50, 6, 0, 1), null)
    assert.equal(voltageDrop(32, 50, 6, 230, 2), null)
  })
})

describe('three-phase balance', () => {
  test('balanced legs cancel in the neutral', () => {
    const r = phaseBalance(60, 60, 60)
    assert.equal(r.neutralAmps, 0)
    assert.equal(r.imbalancePercent, 0)
  })
  test('one leg loaded puts the whole current in the neutral', () => {
    assert.equal(phaseBalance(60, 0, 0).neutralAmps, 60)
  })
  test('a worked unbalanced case', () => {
    // sqrt(80^2+40^2+30^2 - 80*40 - 40*30 - 30*80) = sqrt(2100) = 45.83
    const r = phaseBalance(80, 40, 30)
    assert.equal(r.neutralAmps, 45.83)
    assert.equal(r.worstLeg, 'L1')
    assert.equal(r.maxAmps, 80)
  })
  test('rejects negatives and rubbish', () => {
    assert.equal(phaseBalance(-1, 0, 0), null)
    assert.equal(phaseBalance(10, 'x', 10), null)
  })
})

describe('noise dose', () => {
  test('EU 3 dB exchange against an 85 dB(A) 8 hour criterion', () => {
    // Every 3 dB halves the permitted time: 100 dB(A) is 5 halvings from 85.
    const r = noiseDose(100, 2, 85, 3)
    assert.equal(r.permittedMinutes, 15)
    assert.equal(r.dosePercent, 800)
    assert.equal(r.overExposed, true)
  })
  test('at the criterion for the criterion duration, dose is exactly 100%', () => {
    const r = noiseDose(85, 8, 85, 3)
    assert.equal(r.dosePercent, 100)
    assert.equal(r.overExposed, false)
  })
  test('OSHA 5 dB exchange against 90 dB(A) gives a different answer', () => {
    // 95 dB(A) is one 5 dB step above 90, so 4 hours, not 8.
    assert.equal(noiseDose(95, 4, 90, 5).permittedHours, 4)
    // The same level under the EU rule is far stricter.
    assert.ok(noiseDose(95, 4, 85, 3).permittedHours < 1)
  })
  test('rejects rubbish', () => {
    assert.equal(noiseDose('x', 2), null)
    assert.equal(noiseDose(100, -1), null)
    assert.equal(noiseDose(100, 2, 85, 0), null)
  })
})

describe('third-order intermodulation', () => {
  test('two carriers give 2a-b and 2b-a', () => {
    const r = intermod3([470.1, 471.3])
    assert.deepEqual(r.products.map((p) => p.mhz), [468.9, 472.5])
    assert.equal(r.clashes.length, 0)
  })
  test('a product landing on a channel in use is flagged', () => {
    // 2*470 - 471 = 469, which is a frequency in the list.
    const r = intermod3([469, 470, 471])
    assert.ok(r.clashes.length > 0)
    assert.ok(r.clashes.some((p) => p.clashesWith === 469))
  })
  test('three carriers also produce a+b-c', () => {
    const r = intermod3([500, 510, 520])
    assert.ok(r.products.some((p) => p.order === 'a+b-c'))
  })
  test('needs at least two frequencies', () => {
    assert.equal(intermod3([500]), null)
    assert.equal(intermod3([]), null)
    assert.equal(intermod3('abc'), null)
  })
})

describe('IPv4 subnetting', () => {
  test('the /24 everyone knows', () => {
    const r = subnetCidr('192.168.1.50', 24)
    assert.equal(r.network, '192.168.1.0')
    assert.equal(r.broadcast, '192.168.1.255')
    assert.equal(r.mask, '255.255.255.0')
    assert.equal(r.firstHost, '192.168.1.1')
    assert.equal(r.lastHost, '192.168.1.254')
    assert.equal(r.usableHosts, 254)
  })
  test('a non-obvious boundary: /20 does not start where the address does', () => {
    // 172.16.5.9/20 sits in the block starting at 172.16.0.0, not 172.16.5.0.
    const r = subnetCidr('172.16.5.9', 20)
    assert.equal(r.network, '172.16.0.0')
    assert.equal(r.broadcast, '172.16.15.255')
    assert.equal(r.mask, '255.255.240.0')
    assert.equal(r.usableHosts, 4094)
  })
  test('/8 and /0 do not overflow the 32-bit shift', () => {
    assert.equal(subnetCidr('10.0.0.1', 8).usableHosts, 16777214)
    const zero = subnetCidr('0.0.0.0', 0)
    assert.equal(zero.mask, '0.0.0.0')
    assert.equal(zero.totalAddresses, 4294967296)
  })
  test('/31 is a point-to-point pair, /32 is a single host (RFC 3021)', () => {
    const p31 = subnetCidr('10.0.0.0', 31)
    assert.equal(p31.usableHosts, 2)
    assert.equal(p31.broadcast, null)   // no broadcast address to reserve
    assert.equal(p31.firstHost, '10.0.0.0')
    assert.equal(p31.lastHost, '10.0.0.1')
    assert.equal(subnetCidr('10.0.0.5', 32).usableHosts, 0)
  })
  test('RFC 1918 detection', () => {
    assert.equal(subnetCidr('10.1.2.3', 24).isPrivate, true)
    assert.equal(subnetCidr('172.16.0.1', 24).isPrivate, true)
    assert.equal(subnetCidr('172.32.0.1', 24).isPrivate, false)  // just outside the block
    assert.equal(subnetCidr('192.168.9.1', 24).isPrivate, true)
    assert.equal(subnetCidr('8.8.8.8', 24).isPrivate, false)
  })
  test('rejects malformed addresses and prefixes', () => {
    assert.equal(subnetCidr('192.168.1', 24), null)
    assert.equal(subnetCidr('192.168.1.256', 24), null)
    assert.equal(subnetCidr('192.168.1.1', 33), null)
    assert.equal(subnetCidr('192.168.1.1', -1), null)
    assert.equal(subnetCidr('a.b.c.d', 24), null)
    assert.equal(subnetCidr('192.168.01.1', 24).network, '192.168.1.0') // leading zero tolerated
  })
})

describe('DMX line budget in unit loads', () => {
  test('the rule is 32 unit loads, not 32 fixtures', () => {
    // 40 fixtures at 1/4 UL each is 10 UL - comfortably legal.
    const r = dmxLineBudget([{ count: 40, unitLoad: 0.25 }])
    assert.equal(r.fixtures, 40)
    assert.equal(r.unitLoads, 10)
    assert.equal(r.withinLimit, true)
    assert.equal(r.segmentsNeeded, 1)
  })
  test('a rig of full-unit-load fixtures still stops at 32', () => {
    assert.equal(dmxLineBudget([{ count: 32, unitLoad: 1 }]).withinLimit, true)
    assert.equal(dmxLineBudget([{ count: 33, unitLoad: 1 }]).withinLimit, false)
    assert.equal(dmxLineBudget([{ count: 33, unitLoad: 1 }]).segmentsNeeded, 2)
  })
  test('mixed rigs add up as they really are', () => {
    // 20 old fixtures at 1 UL + 40 modern at 1/4 UL = 30 UL, just inside.
    const r = dmxLineBudget([{ count: 20, unitLoad: 1 }, { count: 40, unitLoad: 0.25 }])
    assert.equal(r.unitLoads, 30)
    assert.equal(r.fixtures, 60)
    assert.equal(r.headroomUnitLoads, 2)
    assert.equal(r.withinLimit, true)
  })
  test('segment count rounds up', () => {
    assert.equal(dmxLineBudget([{ count: 96, unitLoad: 1 }]).segmentsNeeded, 3)
    assert.equal(dmxLineBudget([{ count: 97, unitLoad: 1 }]).segmentsNeeded, 4)
    assert.equal(dmxLineBudget([]).segmentsNeeded, 0)
  })
  test('rejects rubbish', () => {
    assert.equal(dmxLineBudget([{ count: -1, unitLoad: 1 }]), null)
    assert.equal(dmxLineBudget([{ count: 4, unitLoad: 0 }]), null)
    assert.equal(dmxLineBudget('nope'), null)
  })
})

describe('inverse square law', () => {
  test('every doubling of distance costs 6 dB', () => {
    assert.equal(splAtDistance(100, 1, 2).spl, 94)
    assert.equal(splAtDistance(100, 1, 4).spl, 88)
    assert.equal(splAtDistance(100, 1, 4).doublings, 2)
    // "6 dB per doubling" is itself a rounding: 20*log10(8) is 18.06, not 18,
    // so three doublings lose 18.1 dB rather than a clean 18.
    assert.equal(splAtDistance(100, 1, 8).spl, 81.9)
  })
  test('halving the distance gains 6 dB', () => {
    assert.equal(splAtDistance(100, 2, 1).spl, 106)
  })
  test('no change at the reference distance', () => {
    assert.equal(splAtDistance(100, 1, 1).spl, 100)
    assert.equal(splAtDistance(100, 1, 1).dropDb, 0)
  })
  test('a worked touring case: 100 dB at 1 m, heard at 30 m', () => {
    // 20*log10(30) = 29.5 dB of loss.
    assert.equal(splAtDistance(100, 1, 30).dropDb, 29.5)
    assert.equal(splAtDistance(100, 1, 30).spl, 70.5)
  })
  test('rejects zero and negative distances', () => {
    assert.equal(splAtDistance(100, 0, 10), null)
    assert.equal(splAtDistance(100, 1, 0), null)
    assert.equal(splAtDistance(100, 1, -5), null)
    assert.equal(splAtDistance('x', 1, 10), null)
  })
})

describe('frame budget', () => {
  test('a 60 fps frame is 16.67 ms', () => {
    const r = frameBudget(60, [])
    assert.equal(r.periodMs, 16.67)
    assert.equal(r.headroomMs, 16.67)
    assert.equal(r.withinBudget, true)
  })

  test('sums the stages and reports the headroom left', () => {
    const r = frameBudget(60, [4, 3.5, 2])
    assert.equal(r.usedMs, 9.5)
    assert.equal(r.headroomMs, 7.17)
    assert.equal(r.withinBudget, true)
  })

  test('a pipeline that overruns does not run slightly slower, it drops frames', () => {
    const r = frameBudget(60, [12, 9])
    assert.equal(r.usedMs, 21)
    assert.equal(r.withinBudget, false)
    // 21 ms of work can only hold 47.62 fps, however you label the output.
    assert.equal(r.achievableFps, 47.62)
  })

  test('never claims a higher rate than was asked for', () => {
    assert.equal(frameBudget(30, [2]).achievableFps, 30)
  })

  test('ignores nonsense stage values rather than producing NaN', () => {
    const r = frameBudget(50, [5, 'x', null, -3, 2])
    assert.equal(r.usedMs, 7)
  })

  test('rejects an impossible frame rate', () => {
    assert.equal(frameBudget(0, []), null)
    assert.equal(frameBudget(-30, []), null)
  })
})

describe('pyro cue time', () => {
  test('subtracts lift and prefire from the moment the effect is seen', () => {
    const r = pyroCueTime(60, 4.2, 0.8)
    assert.equal(r.totalDelaySeconds, 5)
    assert.equal(r.fireSeconds, 55)
  })

  test('two items bursting on the same beat are fired at different times', () => {
    const shell = pyroCueTime(90, 5.5, 0.5)
    const mine = pyroCueTime(90, 0, 0.2)
    assert.equal(shell.fireSeconds, 84)
    assert.equal(mine.fireSeconds, 89.8)
    // Same beat, 5.8 seconds apart on the firing script.
    assert.equal(Math.round((mine.fireSeconds - shell.fireSeconds) * 10) / 10, 5.8)
  })

  test('reports the frame the firing system chases', () => {
    const r = pyroCueTime(60, 4.2, 0.8)
    assert.equal(r.fireTimecode25, '00:00:55:00')
    assert.equal(r.fireTimecode30, '00:00:55:00')
  })

  test('flags an item that would have to be fired before the show started', () => {
    const r = pyroCueTime(2, 4, 0.5)
    assert.equal(r.beforeShowStart, true)
    assert.equal(r.fireSeconds, -2.5)
    // A negative fire time has no timecode, and is not wrapped into a plausible one.
    assert.equal(r.fireTimecode25, null)
  })

  test('with no lift or prefire the fire time is the effect time', () => {
    assert.equal(pyroCueTime(42).fireSeconds, 42)
  })

  test('rejects negative delays and times', () => {
    assert.equal(pyroCueTime(-1, 0, 0), null)
    assert.equal(pyroCueTime(10, -1, 0), null)
    assert.equal(pyroCueTime(10, 0, -1), null)
  })
})

describe('clock drift', () => {
  test('50 ppm over an hour is 180 ms', () => {
    const r = clockDrift(50, 3600, 25)
    assert.equal(r.offsetMs, 180)
    assert.equal(r.frames, 4.5)
  })

  test('reports the drift in samples, which is what an audio device cares about', () => {
    // 10 ppm for 60 s = 0.6 ms = 28.8 samples at 48 kHz, rounded to 29.
    assert.equal(clockDrift(10, 60).samples48k, 29)
  })

  test('says how long a whole frame of error takes to build up', () => {
    // At 100 ppm a 40 ms frame accumulates in 400 s.
    assert.equal(clockDrift(100, 0, 25).secondsPerFrame, 400)
  })

  test('a perfect clock never drifts, and does not divide by zero', () => {
    const r = clockDrift(0, 7200, 25)
    assert.equal(r.offsetMs, 0)
    assert.equal(r.secondsPerFrame, null)
  })

  test('rejects nonsense', () => {
    assert.equal(clockDrift(-1, 60), null)
    assert.equal(clockDrift(10, -60), null)
    assert.equal(clockDrift(10, 60, 0), null)
  })
})

describe('polling cost', () => {
  test('a 500 ms poll is 7200 requests an hour', () => {
    const r = pollingCost(500, 1)
    assert.equal(r.requestsPerHour, 7200)
    assert.equal(r.meanStalenessMs, 250)
    assert.equal(r.worstStalenessMs, 500)
  })

  test('worst-case staleness is the whole interval, not half of it', () => {
    // The change can land the instant after a poll returns.
    assert.equal(pollingCost(2000).worstStalenessMs, 2000)
    assert.equal(pollingCost(2000).meanStalenessMs, 1000)
  })

  test('expresses the worst case in frames, which is the practical yardstick', () => {
    // 500 ms at 25 fps is 12.5 frames late.
    assert.equal(pollingCost(500).framesLateWorst25, 12.5)
  })

  test('scales the total with the duration', () => {
    assert.equal(pollingCost(1000, 3).requestsTotal, 10800)
  })

  test('rejects an interval of zero', () => {
    assert.equal(pollingCost(0), null)
    assert.equal(pollingCost(-5), null)
  })
})

describe('jitter margin', () => {
  test('an average that fits can still miss the deadline', () => {
    const r = jitterMargin(10, 8, 3)
    assert.equal(r.percentUsedNominal, 80)
    assert.equal(r.worstCaseMs, 11)
    assert.equal(r.meetsDeadline, false)
    assert.equal(r.marginMs, -1)
  })

  test('passes when the worst case fits', () => {
    const r = jitterMargin(10, 6, 2)
    assert.equal(r.meetsDeadline, true)
    assert.equal(r.marginMs, 2)
  })

  test('exactly on the deadline counts as meeting it', () => {
    assert.equal(jitterMargin(10, 7, 3).meetsDeadline, true)
  })

  test('zero jitter is the nominal case', () => {
    assert.equal(jitterMargin(10, 4, 0).worstCaseMs, 4)
  })

  test('rejects nonsense', () => {
    assert.equal(jitterMargin(0, 1, 1), null)
    assert.equal(jitterMargin(10, -1, 1), null)
    assert.equal(jitterMargin(10, 1, -1), null)
  })
})

describe('required performance level (ISO 13849-1 risk graph)', () => {
  test('the eight leaves of the graph', () => {
    const pl = (s, f, p) => requiredPerformanceLevel(s, f, p).performanceLevel
    assert.equal(pl('S1', 'F1', 'P1'), 'a')
    assert.equal(pl('S1', 'F1', 'P2'), 'b')
    assert.equal(pl('S1', 'F2', 'P1'), 'b')
    assert.equal(pl('S1', 'F2', 'P2'), 'c')
    assert.equal(pl('S2', 'F1', 'P1'), 'c')
    assert.equal(pl('S2', 'F1', 'P2'), 'd')
    assert.equal(pl('S2', 'F2', 'P1'), 'd')
    assert.equal(pl('S2', 'F2', 'P2'), 'e')
  })

  test('a load over people, continuously, with no way to dodge, is PL e', () => {
    const r = requiredPerformanceLevel('S2', 'F2', 'P2')
    assert.equal(r.performanceLevel, 'e')
    assert.equal(r.approxSil, 3)
  })

  test('severity dominates: S1 can never reach d or e', () => {
    for (const f of ['F1', 'F2']) for (const p of ['P1', 'P2'])
      assert.ok(['a', 'b', 'c'].includes(requiredPerformanceLevel('S1', f, p).performanceLevel))
  })

  test('is case insensitive, because nobody types S2 consistently', () => {
    assert.equal(requiredPerformanceLevel('s2', 'f2', 'p2').performanceLevel, 'e')
  })

  test('rejects anything outside the three binary questions', () => {
    assert.equal(requiredPerformanceLevel('S3', 'F1', 'P1'), null)
    assert.equal(requiredPerformanceLevel('S1', 'F3', 'P1'), null)
    assert.equal(requiredPerformanceLevel('S1', 'F1', ''), null)
  })
})

describe('stopping distance', () => {
  test('reaction distance and braking distance are separate contributions', () => {
    // 0.2 m/s, 50 ms reaction, 1 m/s^2 deceleration.
    const r = stoppingDistance(0.2, 0.05, 1)
    assert.equal(r.reactionDistance, 0.01)   // 0.2 * 0.05
    assert.equal(r.brakingDistance, 0.02)    // 0.04 / 2
    assert.equal(r.totalDistance, 0.03)
  })

  test('braking dominates at speed, which is why relay response is the wrong number', () => {
    const r = stoppingDistance(1, 0.03, 0.5)
    assert.equal(r.reactionDistance, 0.03)
    assert.equal(r.brakingDistance, 1)
    assert.ok(r.reactionShare < 0.03)
  })

  test('doubling the speed quadruples the braking distance', () => {
    const a = stoppingDistance(0.5, 0, 1).brakingDistance
    const b = stoppingDistance(1.0, 0, 1).brakingDistance
    assert.equal(b / a, 4)
  })

  test('a stationary load does not move', () => {
    assert.equal(stoppingDistance(0, 0.05, 1).totalDistance, 0)
  })

  test('rejects zero or negative deceleration', () => {
    assert.equal(stoppingDistance(1, 0.05, 0), null)
    assert.equal(stoppingDistance(1, 0.05, -1), null)
    assert.equal(stoppingDistance(-1, 0.05, 1), null)
  })
})

describe('safeguard distance (ISO 13855)', () => {
  test('S = K*T + C with the fast approach speed', () => {
    // 0.1 s total stop, 0 mm intrusion allowance, 2000 mm/s.
    const r = safeguardDistance(0.1, 0)
    assert.equal(r.distanceMm, 200)
    assert.equal(r.recalculated, false)
  })

  test('recalculates at 1600 mm/s once the first pass exceeds 500 mm', () => {
    // 0.3 s at 2000 gives 600 mm, so it is recomputed at 1600 -> 480,
    // then floored at 500.
    const r = safeguardDistance(0.3, 0)
    assert.equal(r.firstPassMm, 600)
    assert.equal(r.recalculated, true)
    assert.equal(r.approachMmPerS, 1600)
    assert.equal(r.distanceMm, 500)
  })

  test('the recalculated value is never allowed below 500 mm', () => {
    assert.equal(safeguardDistance(0.28, 0).distanceMm, 500)
  })

  test('a long stop time pushes the guard a long way back', () => {
    // 1 s: first pass 2000 mm, recalculated to 1600 mm.
    const r = safeguardDistance(1, 0)
    assert.equal(r.distanceMm, 1600)
  })

  test('the intrusion allowance is added on top', () => {
    assert.equal(safeguardDistance(0.1, 128).distanceMm, 328)
  })

  test('rejects nonsense', () => {
    assert.equal(safeguardDistance(-1), null)
    assert.equal(safeguardDistance(0.1, -5), null)
    assert.equal(safeguardDistance(0.1, 0, 0), null)
  })
})

describe('hex colour', () => {
  test('ffffff is three full bytes', () => {
    const r = hexToChannels('#ffffff')
    assert.deepEqual(r.dmx, [255, 255, 255])
    assert.deepEqual(r.percent, [100, 100, 100])
  })

  test('each byte is exactly two hex digits, which is why hex is used', () => {
    const r = hexToChannels('#ff8800')
    assert.equal(r.r, 255)
    assert.equal(r.g, 136)
    assert.equal(r.b, 0)
  })

  test('three-digit shorthand doubles each digit', () => {
    assert.deepEqual(hexToChannels('#f80').dmx, hexToChannels('#ff8800').dmx)
    assert.equal(hexToChannels('fff').hex, '#ffffff')
  })

  test('accepts it with or without the hash, and any case', () => {
    assert.equal(hexToChannels('FF8800').hex, '#ff8800')
  })

  test('rejects anything that is not three or six hex digits', () => {
    assert.equal(hexToChannels('#gggggg'), null)
    assert.equal(hexToChannels('#ff88'), null)
    assert.equal(hexToChannels(''), null)
  })
})

describe('code value to light', () => {
  test('full code is full light and zero is zero, whatever the gamma', () => {
    assert.equal(codeToLight(255, 8, 2.2).light, 1)
    assert.equal(codeToLight(0, 8, 2.2).light, 0)
  })

  test('half the code value is nowhere near half the light', () => {
    // 128/255 at gamma 2.2 is about 21.8%.
    const r = codeToLight(128, 8, 2.2)
    assert.ok(r.lightPercent > 21 && r.lightPercent < 23)
  })

  test('reports the code that actually gives half the light', () => {
    // 0.5 ^ (1/2.2) = 0.7297 -> 186.
    assert.equal(codeToLight(128, 8, 2.2).codeForHalfLight, 186)
  })

  test('gamma 1 is linear, so code fraction and light are the same', () => {
    const r = codeToLight(128, 8, 1)
    assert.equal(r.light, r.codeFraction)
  })

  test('10-bit has four times the codes', () => {
    assert.equal(codeToLight(0, 10).maxCode, 1023)
  })

  test('rejects a code above the range for the bit depth', () => {
    assert.equal(codeToLight(256, 8), null)
    assert.equal(codeToLight(-1, 8), null)
  })
})

describe('full range against limited range', () => {
  test('limited range puts black at 16 and white at 235 in 8 bit', () => {
    const r = videoRange(16)
    assert.equal(r.limitedBlack, 16)
    assert.equal(r.limitedWhite, 235)
    assert.equal(r.asLimited, 0)
  })

  test('the same code means two different brightnesses', () => {
    const r = videoRange(235)
    assert.equal(r.asLimited, 1)
    assert.ok(r.asFull < 0.93)
  })

  test('codes below 16 have nowhere to go in limited range - that is crushing', () => {
    const r = videoRange(4)
    assert.equal(r.belowBlack, true)
    assert.equal(r.asLimited, 0)
  })

  test('codes above 235 are clipped whites', () => {
    assert.equal(videoRange(250).aboveWhite, true)
  })

  test('the window scales with bit depth', () => {
    const r = videoRange(64, 10)
    assert.equal(r.limitedBlack, 64)
    assert.equal(r.limitedWhite, 940)
  })
})

describe('chroma subsampling bitrate', () => {
  test('4:4:4 carries three samples per pixel', () => {
    const r = chromaBitrate(1920, 1080, 60, 8, '4:4:4')
    assert.equal(r.samplesPerPixel, 3)
    assert.equal(r.bitsPerSecond, 1920 * 1080 * 60 * 8 * 3)
  })

  test('4:2:2 is two thirds of the rate, 4:2:0 is a half', () => {
    assert.equal(chromaBitrate(1920, 1080, 60, 8, '4:2:2').fractionOfFull, 0.67)
    assert.equal(chromaBitrate(1920, 1080, 60, 8, '4:2:0').fractionOfFull, 0.5)
    assert.equal(chromaBitrate(1920, 1080, 60, 8, '4:2:0').savingPercent, 50)
  })

  test('UHD at 60p in 10-bit 4:4:4 is well past a single 12G link', () => {
    const r = chromaBitrate(3840, 2160, 60, 10, '4:4:4')
    assert.ok(r.gbps > 14)
  })

  test('rejects an unknown scheme', () => {
    assert.equal(chromaBitrate(1920, 1080, 60, 8, '4:3:1'), null)
  })

  test('rejects nonsense dimensions', () => {
    assert.equal(chromaBitrate(0, 1080, 60), null)
    assert.equal(chromaBitrate(1920, 1080, 0), null)
  })
})

describe('reverberation time', () => {
  test('Sabine on a small hall', () => {
    // 3000 m^3 with 400 sabins of absorption.
    const r = rt60Sabine(3000, 400)
    assert.equal(r.rt60, 1.21)
  })

  test('doubling the absorption halves the reverberation time', () => {
    // Compared on the underlying values: the rounded pair are 1.21 and 0.6,
    // which are half of each other in the room and not on the printout.
    assert.equal(rt60Sabine(3000, 800).rt60, 0.6)
    assert.ok(Math.abs(rt60Sabine(3000, 800).rt60 * 2 - rt60Sabine(3000, 400).rt60) < 0.02)
  })

  test('doubling the volume doubles it', () => {
    assert.equal(rt60Sabine(6000, 400).rt60, rt60Sabine(3000, 400).rt60 * 2)
  })

  test('tells you the absorption needed for a target', () => {
    // 3000 m^3 to RT 0.8 s needs 0.161*3000/0.8 = 603.75 sabins.
    assert.equal(rt60Sabine(3000, 400).sabinsForTarget(0.8), 603.75)
  })

  test('derives the average absorption coefficient from a surface area', () => {
    assert.equal(rt60Sabine(3000, 400).alphaFor(2000), 0.2)
  })

  test('rejects a room with no volume or no absorption', () => {
    assert.equal(rt60Sabine(0, 400), null)
    assert.equal(rt60Sabine(3000, 0), null)
  })
})

describe('stereoscopic parallax', () => {
  test('an object at the convergence distance sits on the screen plane', () => {
    const r = stereoParallax(6, 6, 10)
    assert.equal(r.parallaxMm, 0)
    assert.equal(r.behindScreen, false)
    assert.equal(r.inFrontOfScreen, false)
  })

  test('further than convergence is behind the screen, nearer is in front', () => {
    assert.equal(stereoParallax(12, 6, 10).behindScreen, true)
    assert.equal(stereoParallax(3, 6, 10).inFrontOfScreen, true)
  })

  test('at infinity the parallax approaches the eye separation', () => {
    const r = stereoParallax(100000, 6, 10)
    assert.ok(r.parallaxMm > 62.9 && r.parallaxMm <= 63)
  })

  test('flags divergence, which eyes cannot do', () => {
    // Nothing beyond infinity, so a normal shot never diverges...
    assert.equal(stereoParallax(100000, 6, 10).divergent, false)
    // ...but a wider-than-human interaxial in the rig can produce it.
    assert.equal(stereoParallax(100000, 6, 10, 200).divergent, false)
  })

  test('comfort is a percentage of screen width, so a bigger screen is harsher', () => {
    const small = stereoParallax(100000, 6, 10)
    const huge = stereoParallax(100000, 6, 2)
    assert.ok(huge.percentOfWidth > small.percentOfWidth)
    assert.equal(small.withinComfort, true)
  })

  test('rejects nonsense', () => {
    assert.equal(stereoParallax(0, 6, 10), null)
    assert.equal(stereoParallax(6, 0, 10), null)
    assert.equal(stereoParallax(6, 6, 0), null)
  })
})

// ---------------------------------------------------------------------------
// Colour temperature correction
// ---------------------------------------------------------------------------

test('mired is the reciprocal scale, so a gel shift is constant', () => {
  // The whole point of the unit: the same gel does the same mired shift
  // wherever you point it. Two different kelvin journeys, same shift.
  const a = miredShift(3200, 3200 * 2)
  const b = miredShift(6400, 6400 * 2)
  // Doubling the kelvin halves the mired, so each shift is minus half the
  // source mired. Compared with a tolerance because the reported figure is
  // rounded once at the end rather than per term.
  assert.ok(Math.abs(a.shift - -(1e6 / 3200 / 2)) < 0.1, `got ${a.shift}`)
  assert.ok(Math.abs(b.shift - -(1e6 / 6400 / 2)) < 0.1, `got ${b.shift}`)
  // And the ratio of the two shifts is exactly the ratio of the sources.
  assert.ok(Math.abs(a.shift / b.shift - 2) < 0.001)
})

test('tungsten to daylight lands on Full CTB', () => {
  // 3200 K to 5600 K is the correction Full CTB exists for.
  const r = miredShift(3200, 5600)
  assert.equal(r.direction, 'cooler (CTB)')
  assert.equal(r.nearestGel.name, 'Full CTB')
  // Lee publishes Full CTB as -137; the exact requirement here is -133.9,
  // which is why the gel is close but not perfect.
  assert.equal(r.shift, -133.9)
  assert.ok(r.nearestGel.error < 4)
})

test('daylight to tungsten needs more than any one CTO', () => {
  const r = miredShift(5600, 3200)
  assert.equal(r.direction, 'warmer (CTO)')
  assert.equal(r.shift, 133.9)
  // +133.9 sits almost exactly between Half CTO (+109) and Full CTO (+159) —
  // 24.9 out either way. Neither is close enough to call an answer, and the
  // function says so rather than presenting a near-miss as the choice.
  assert.equal(r.gelIsClose, false)
  assert.ok(r.nearestGel.error > 20)
  // A stack does genuinely better here, which is why the pair is offered.
  assert.ok(r.nearestPair && r.nearestPair.error < r.nearestGel.error)
})

test('applying a gel gives back a colour temperature', () => {
  const r = miredShift(3200, 5600)
  // Lee 201 Full CTB on a 3200 K source.
  const landed = r.resultOf(-137)
  assert.ok(landed > 5600 && landed < 6100, `got ${landed}`)
})

test('a pair is only offered when it beats the single gel', () => {
  // 3200 -> 4300 is -79.9, and Half CTB at -78 is within 2. No stack improves
  // on that, so none is suggested: two sheets cost a stop for nothing.
  const near = miredShift(3200, 4300)
  assert.equal(near.nearestGel.name, 'Half CTB')
  assert.equal(near.gelIsClose, true)
  assert.equal(near.nearestPair, null)
  // Where a stack does help, it is offered and it is genuinely better.
  const far = miredShift(5600, 3200)
  assert.ok(far.nearestPair)
  assert.ok(far.nearestPair.error < far.nearestGel.error)
})

test('mired rejects nonsense temperatures', () => {
  assert.equal(miredShift(0, 5600), null)
  assert.equal(miredShift(3200, -1), null)
  assert.equal(miredShift('x', 5600), null)
})

// ---------------------------------------------------------------------------
// Fibre loss budget
// ---------------------------------------------------------------------------

test('fibre loss is length times attenuation plus the terminations', () => {
  const r = fibreLossBudget(500, 'om3-850', 2, 0)
  // 0.5 km at 3.0 dB/km = 1.5 dB, plus two connector pairs at 0.3 = 0.6.
  assert.equal(r.fibreLossDb, 1.5)
  assert.equal(r.connectorLossDb, 0.6)
  assert.equal(r.totalLossDb, 2.1)
  assert.equal(r.ok, true)
})

test('singlemode goes much further than multimode on the same budget', () => {
  const mm = fibreLossBudget(1000, 'om3-850', 2, 0)
  const sm = fibreLossBudget(1000, 'os2-1310', 2, 0)
  assert.ok(sm.totalLossDb < mm.totalLossDb)
  assert.ok(sm.maxLengthM > mm.maxLengthM * 5)
})

test('splices and extra connectors eat the budget', () => {
  const clean = fibreLossBudget(200, 'os2-1310', 2, 0)
  const patched = fibreLossBudget(200, 'os2-1310', 6, 4)
  assert.ok(patched.totalLossDb > clean.totalLossDb)
  assert.equal(patched.connectorLossDb, 1.8)
  assert.equal(patched.spliceLossDb, 0.4)
})

test('a run can pass and still be too thin to trust', () => {
  // Just inside the budget, but with under 3 dB of margin: it works on the
  // day and fails after one dirty end face.
  const r = fibreLossBudget(2200, 'om3-850', 2, 0)
  assert.equal(r.ok, true)
  assert.equal(r.thin, true)
})

test('fibre rejects an unknown fibre type', () => {
  assert.equal(fibreLossBudget(100, 'not-a-fibre', 2, 0), null)
  assert.equal(fibreLossBudget(-1, 'os2-1310', 2, 0), null)
})

// ---------------------------------------------------------------------------
// Heat load
// ---------------------------------------------------------------------------

test('watts in equals heat out, in BTU and tons', () => {
  const r = heatLoad(20000)
  // 20 kW x 3.412 = 68 240 BTU/hr; / 12 000 = 5.69 tons.
  assert.equal(r.btuPerHour, 68240)
  assert.equal(r.tonsOfCooling, 5.69)
  assert.equal(r.kwThermal, 20)
})

test('an audience is a heat load', () => {
  const empty = heatLoad(10000)
  const full = heatLoad(10000, { people: 500 })
  assert.equal(full.peopleW, 50000)
  assert.ok(full.btuPerHour > empty.btuPerHour * 5)
})

test('airflow follows from the temperature rise you will accept', () => {
  const r = heatLoad(3000)
  const tight = r.airflowM3PerHourFor(5)
  const loose = r.airflowM3PerHourFor(10)
  // Twice the allowed rise, half the air.
  assert.ok(Math.abs(tight / loose - 2) < 0.01)
  assert.ok(r.airflowCfmFor(10) < loose, 'cfm is a smaller number than m3/h')
})

test('heat load rejects negative power', () => {
  assert.equal(heatLoad(-1), null)
  assert.equal(heatLoad('x'), null)
})

// ---------------------------------------------------------------------------
// Video storage
// ---------------------------------------------------------------------------

test('storage is bitrate times time, and the units are the trap', () => {
  const r = videoStorage(100, 60)
  // 100 Mbps x 3600 s = 360 000 Mb = 45 000 MB = 45 GB decimal.
  assert.equal(r.gigabytes, 45)
  // The same bits reported as gibibytes, which is what the OS will say.
  assert.equal(r.gibibytes, 43.95)
  assert.ok(r.gibibytes < r.gigabytes, 'GiB is always the smaller number')
})

test('storage scales with stream count', () => {
  const one = videoStorage(50, 30)
  const four = videoStorage(50, 30, { streams: 4 })
  assert.equal(four.gigabytes, one.gigabytes * 4)
  assert.equal(four.writeMBps, one.writeMBps * 4)
})

test('storage answers the other direction too', () => {
  const r = videoStorage(100, 60)
  // A 1 TB card at 100 Mbps.
  const mins = r.minutesForGb(1000)
  assert.ok(Math.abs(mins - 1333.33) < 1, `got ${mins}`)
})

test('storage rejects a zero bitrate', () => {
  assert.equal(videoStorage(0, 60), null)
  assert.equal(videoStorage(100, -1), null)
})

// ---------------------------------------------------------------------------
// Battery runtime
// ---------------------------------------------------------------------------

test('runtime derates the nameplate, because the nameplate is not usable', () => {
  const r = batteryRuntime(98, 12)
  assert.equal(r.idealHours, 8.17)
  // 80% usable by default.
  assert.equal(r.hours, 6.53)
  assert.ok(r.hours < r.idealHours)
})

test('runtime answers the question that gets asked at the half', () => {
  const r = batteryRuntime(98, 12)
  assert.equal(r.coversHours(6), true)
  assert.equal(r.coversHours(8), false)
  assert.equal(r.packsForHours(12), 2)
})

test('mAh converts to Wh at the nominal voltage', () => {
  // A 2600 mAh pack at 3.7 V is 9.62 Wh.
  assert.equal(whFromMah(2600, 3.7), 9.62)
  assert.equal(whFromMah(0, 3.7), null)
})

test('runtime rejects a zero draw', () => {
  assert.equal(batteryRuntime(98, 0), null)
  assert.equal(batteryRuntime(0, 12), null)
})

// ---------------------------------------------------------------------------
// Aspect fitting
// ---------------------------------------------------------------------------

test('16:9 content in a 21:9 surface pillarboxes', () => {
  const r = aspectFit(1920, 1080, 2560, 1080)
  assert.equal(r.match, false)
  assert.equal(r.fit.pillarboxEach, 320)
  assert.equal(r.fit.letterboxEach, 0)
  assert.equal(r.fit.unusedPercent, 25)
})

test('fill crops exactly what fit would have wasted', () => {
  const r = aspectFit(1920, 1080, 2560, 1080)
  // Filling a wider screen means the content is scaled until it spans the
  // width, and the top and bottom go off the surface.
  assert.equal(r.fill.cropEachSide, 0)
  assert.ok(r.fill.cropTopBottom > 0)
  assert.ok(r.fill.lostPercent > 0)
})

test('matching aspects need neither bars nor crop', () => {
  const r = aspectFit(1920, 1080, 3840, 2160)
  assert.equal(r.match, true)
  assert.equal(r.fit.pillarboxEach, 0)
  assert.equal(r.fit.letterboxEach, 0)
  assert.equal(r.fit.unusedPercent, 0)
})

test('upscaling is flagged, because that is when a wall looks soft', () => {
  const up = aspectFit(1280, 720, 3840, 2160)
  assert.equal(up.upscalingFit, true)
  const down = aspectFit(3840, 2160, 1920, 1080)
  assert.equal(down.upscalingFit, false)
})

test('aspect fit rejects a zero dimension', () => {
  assert.equal(aspectFit(0, 1080, 1920, 1080), null)
  assert.equal(aspectFit(1920, 1080, 1920, 0), null)
})

// ---------------------------------------------------------------------------
// Room modes
// ---------------------------------------------------------------------------

test('Schroeder frequency matches the published worked example', () => {
  // 45 m3 at RT60 0.4 s is quoted as about 189 Hz.
  const r = roomModes(5, 3, 3, { rt60: 0.4 })
  assert.equal(r.volume, 45)
  assert.ok(Math.abs(r.schroeder - 189) < 1, `got ${r.schroeder}`)
})

test('the lowest axial mode is set by the longest dimension', () => {
  const r = roomModes(12, 9, 4)
  // 343 / 2 / 12 = 14.29 Hz
  assert.equal(r.fundamental.axis, 'length')
  assert.equal(r.fundamental.hz, 14.3)
})

test('a cube stacks its modes instead of spreading them', () => {
  const cube = roomModes(5, 5, 5)
  const spread = roomModes(7.1, 5.2, 3.3)
  assert.equal(cube.ratioWarning, true)
  assert.ok(cube.pileups.length > spread.pileups.length)
})

test('no Schroeder frequency without a reverberation time', () => {
  // It is a function of RT60; without one there is no honest answer.
  assert.equal(roomModes(5, 4, 3).schroeder, null)
})

test('room modes reject a zero dimension', () => {
  assert.equal(roomModes(0, 4, 3), null)
  assert.equal(roomModes(5, 4, -1), null)
})

// ---------------------------------------------------------------------------
// Line array coverage
// ---------------------------------------------------------------------------

test('a line array loses 3 dB per doubling in the near field', () => {
  // Well inside the transition for a long array at high frequency.
  const a = lineArrayCoverage(6, 4000, 10)
  const b = lineArrayCoverage(6, 4000, 20)
  assert.equal(a.nearField, true)
  assert.equal(b.nearField, true)
  assert.ok(Math.abs((b.lossDb - a.lossDb) - 3) < 0.1, `got ${b.lossDb - a.lossDb}`)
})

test('and reverts to 6 dB per doubling beyond the transition', () => {
  const r = lineArrayCoverage(2, 500, 40)
  assert.equal(r.nearField, false)
  const far1 = lineArrayCoverage(2, 500, 40)
  const far2 = lineArrayCoverage(2, 500, 80)
  assert.ok(Math.abs((far2.lossDb - far1.lossDb) - 6) < 0.1)
})

test('the transition moves with array length and frequency', () => {
  // Longer array, or higher frequency, keeps the cylindrical region going.
  const shortArray = lineArrayCoverage(2, 1000, 10).transitionM
  const longArray = lineArrayCoverage(4, 1000, 10).transitionM
  const highFreq = lineArrayCoverage(2, 4000, 10).transitionM
  assert.ok(longArray > shortArray * 3, 'length squared')
  assert.ok(highFreq > shortArray * 3, 'frequency linear')
})

test('the advantage over a point source is real and finite', () => {
  const r = lineArrayCoverage(4, 1000, 30)
  assert.ok(r.advantageDb > 10, `only ${r.advantageDb} dB`)
  // It stops growing once past the transition, because both are then
  // losing 6 dB per doubling.
  const near = lineArrayCoverage(4, 1000, 20).advantageDb
  const far = lineArrayCoverage(4, 1000, 200).advantageDb
  assert.ok(Math.abs(far - near) < 3, 'advantage should plateau past transition')
})

test('front to back gives the number a system tech asks for', () => {
  const r = lineArrayCoverage(6, 2000, 40)
  const delta = r.frontToBackDb(5, 40)
  assert.ok(delta > 0 && delta < 25, `got ${delta}`)
  assert.equal(r.frontToBackDb(40, 5), null, 'back must be further than front')
})

// ---------------------------------------------------------------------------
// Stops of light
// ---------------------------------------------------------------------------

test('one stop is half the light, by definition', () => {
  const r = stopsOfLight(1, 'stops')
  assert.equal(r.transmission, 0.5)
  assert.equal(r.percent, 50)
})

test('optical density and stops are the same thing labelled differently', () => {
  // ND 0.3 is one stop; ND 0.6 is two. This mismatch between photographic
  // and stage labelling is a permanent source of confusion.
  assert.ok(Math.abs(stopsOfLight(0.3, 'density').stops - 1) < 0.02)
  assert.ok(Math.abs(stopsOfLight(0.6, 'density').stops - 2) < 0.02)
  assert.equal(stopsOfLight(0.6, 'density').percent, 25.12)
})

test('stacking filters adds stops and multiplies transmission', () => {
  const two = stopsOfLight(1, 'stops').plus(1)
  assert.equal(two.stops, 2)
  assert.equal(two.transmission, 0.25)
})

test('stops apply to a measured level', () => {
  assert.equal(stopsOfLight(2, 'stops').appliedTo(1000), 250)
  assert.equal(stopsOfLight(1, 'stops').appliedTo(-5), null)
})

test('stops reject impossible transmission', () => {
  assert.equal(stopsOfLight(0, 'transmission'), null)
  assert.equal(stopsOfLight(1.5, 'transmission'), null)
  assert.equal(stopsOfLight(1, 'not-a-mode'), null)
})

// ---------------------------------------------------------------------------
// Wind load
// ---------------------------------------------------------------------------

describe('wind load', () => {
  test('dynamic pressure follows 0.5 rho v squared', () => {
    // 20 m/s at rho 1.25: 0.5 * 1.25 * 400 = 250 Pa. This is the textbook
    // figure and the one every wind table is generated from.
    assert.equal(windLoad(20, 1).pressurePa, 250)
    assert.equal(windLoad(10, 1).pressurePa, 62.5)
  })

  test('force is the square of speed, which is the entire point', () => {
    const ten = windLoad(10, 10)
    const twenty = windLoad(20, 10)
    // forceN is rounded to a whole newton, so compare the relation, not the
    // rounded quotient: 812.5 rounds up and 3250 does not.
    assert.ok(Math.abs(twenty.forceN / ten.forceN - 4) < 0.01)
    assert.equal(ten.atSpeed(20).timesCurrent, 4)
    assert.equal(ten.atSpeed(30).timesCurrent, 9)
  })

  test('a 3x2 banner in a fresh breeze, in kilograms a rigger can weigh', () => {
    // 10 m/s, 6 m2, cf 1.3: 62.5 * 1.3 * 6 = 487.5 N = 49.7 kgf.
    const r = windLoad(10, 6)
    assert.equal(r.forceN, 488)
    assert.equal(r.forceKgf, 50)
  })

  test('the gust is what takes it over, not the average', () => {
    const r = windLoad(10, 6)
    assert.equal(r.gustSpeedMs, 14)
    // 1.4x the speed is 1.96x the force.
    assert.ok(r.gustForceN / r.forceN > 1.95 && r.gustForceN / r.forceN < 1.97)
  })

  test('overturning needs geometry, and reports the ballast short', () => {
    const light = windLoad(15, 8, { centroidHeightM: 2, baseWidthM: 1, massKg: 50 })
    assert.equal(light.overturning.stable, false)
    assert.ok(light.overturning.extraBallastKg > 0)
    const heavy = windLoad(5, 8, { centroidHeightM: 2, baseWidthM: 3, massKg: 2000 })
    assert.equal(heavy.overturning.stable, true)
    assert.equal(heavy.overturning.extraBallastKg, 0)
    assert.equal(windLoad(10, 6).overturning, null)
  })

  test('Beaufort boundaries match the published scale', () => {
    assert.deepEqual(beaufort(0), { force: 0, name: 'Calm' })
    assert.deepEqual(beaufort(5.4), { force: 3, name: 'Gentle breeze' })
    assert.deepEqual(beaufort(5.5), { force: 4, name: 'Moderate breeze' })
    assert.deepEqual(beaufort(17.2), { force: 8, name: 'Gale' })
    assert.deepEqual(beaufort(40), { force: 12, name: 'Hurricane force' })
    assert.equal(beaufort(-1), null)
  })

  test('wind load rejects nonsense', () => {
    assert.equal(windLoad(-1, 5), null)
    assert.equal(windLoad(10, 0), null)
    assert.equal(windLoad(10, 5, { forceCoefficient: 0 }), null)
  })
})

// ---------------------------------------------------------------------------
// Dew point
// ---------------------------------------------------------------------------

describe('dew point', () => {
  test('known vectors from a psychrometric chart', () => {
    // 20 C at 50% RH gives 9.3 C; 30 C at 80% gives 26.2 C.
    assert.equal(dewPoint(20, 50).dewPointC, 9.3)
    assert.equal(dewPoint(30, 80).dewPointC, 26.2)
    // Saturated air is at its own dew point.
    assert.equal(dewPoint(15, 100).dewPointC, 15)
  })

  test('a cold case in a humid room sweats, and says by how much', () => {
    const r = dewPoint(28, 75, { surfaceTempC: 12 })
    assert.equal(r.condensation.willCondense, true)
    assert.ok(r.condensation.marginC < 0)
    const dry = dewPoint(28, 75, { surfaceTempC: 26 })
    assert.equal(dry.condensation.willCondense, false)
  })

  test('the safe surface temperature carries a margin, because exactly at the dew point is already wet', () => {
    const r = dewPoint(20, 50)
    assert.equal(r.safeSurfaceC, 11.3)
    assert.equal(dewPoint(20, 50, { marginC: 5 }).safeSurfaceC, 14.3)
  })

  test('dew point rejects impossible humidity', () => {
    assert.equal(dewPoint(20, 0), null)
    assert.equal(dewPoint(20, 101), null)
    assert.equal(dewPoint(20, -5), null)
  })
})

// ---------------------------------------------------------------------------
// Flash rate
// ---------------------------------------------------------------------------

describe('flash rate', () => {
  test('three per second is the line, in WCAG and in the broadcast guidance alike', () => {
    assert.equal(flashRate(3).withinGuidance, true)
    assert.equal(flashRate(3.1).withinGuidance, false)
    assert.equal(flashRate(2).issues.length, 0)
  })

  test('a strobe set against a track is where the rate actually comes from', () => {
    const r = flashRate(0)
    // 128 BPM on every beat: 2.13 a second, fine. Every half beat: 4.27, not.
    assert.equal(r.fromBpm(128, 1), 2.13)
    assert.equal(r.fromBpm(128, 2), 4.27)
    assert.equal(flashRate(r.fromBpm(128, 1)).withinGuidance, true)
    assert.equal(flashRate(r.fromBpm(128, 2)).withinGuidance, false)
  })

  test('it answers "so what can I have" rather than only saying no', () => {
    const safe = flashRate(5).slowestSafeDivision(128)
    assert.equal(safe.label, 'every beat')
    assert.equal(safe.rate, 2.13)
    // At 200 BPM even every beat is 3.33, so it has to drop to every 2 beats.
    assert.equal(flashRate(5).slowestSafeDivision(200).label, 'every 2 beats')
  })

  test('the 15 to 20 Hz peak and saturated red are called out separately', () => {
    const r = flashRate(17, { saturatedRed: true })
    assert.equal(r.peakBand, true)
    assert.equal(r.issues.length, 3)
    assert.ok(r.issues.some((i) => i.includes('red')))
    assert.equal(flashRate(2, { saturatedRed: true }).issues.length, 0)
  })

  test('spatial patterns count too, not just rate', () => {
    assert.equal(flashRate(1, { stripes: 6 }).withinGuidance, false)
    assert.equal(flashRate(1, { stripes: 5 }).withinGuidance, true)
  })

  test('period is the reciprocal, and zero flashes has none', () => {
    assert.equal(flashRate(4).periodMs, 250)
    assert.equal(flashRate(0).periodMs, null)
    assert.equal(flashRate(-1), null)
  })
})

// ---------------------------------------------------------------------------
// Assistive listening
// ---------------------------------------------------------------------------

describe('assistive listening receivers', () => {
  test('reproduces ADA Table 219.3 at every band boundary', () => {
    assert.equal(assistiveListening(50).receivers, 2)
    // 51 to 200: 2 plus one per 25 over 50.
    assert.equal(assistiveListening(200).receivers, 8)
    // 201 to 500: same formula, different hearing-aid column.
    assert.equal(assistiveListening(500).receivers, 20)
    // 501 to 1000: 20 plus one per 33 over 500.
    assert.equal(assistiveListening(1000).receivers, 36)
    // 1001 to 2000: 35 plus one per 50 over 1000.
    assert.equal(assistiveListening(2000).receivers, 55)
    // 2001 and over: 55 plus one per 100 over 2000.
    assert.equal(assistiveListening(3000).receivers, 65)
  })

  test('the hearing-aid compatible column is the part people forget', () => {
    assert.equal(assistiveListening(200).hearingAidCompatible, 2)
    // Over 200 it becomes one in four of the total, not a flat 2.
    assert.equal(assistiveListening(500).hearingAidCompatible, 5)
    assert.equal(assistiveListening(2000).hearingAidCompatible, 14)
  })

  test('an induction loop over every seat waives that column, per Exception 2', () => {
    const r = assistiveListening(1200, { inductionLoopAllSeats: true })
    assert.equal(r.hearingAidCompatible, 0)
    assert.equal(r.inductionLoopWaiver, true)
    assert.match(r.note, /Exception 2/)
  })

  test('the band label says which row of the table applied', () => {
    assert.equal(assistiveListening(40).band, '50 or fewer')
    assert.equal(assistiveListening(150).band, '51 to 200')
    assert.equal(assistiveListening(900).band, '501 to 1000')
    assert.equal(assistiveListening(5000).band, '2001 and over')
  })

  test('a venue with no seats is not a venue', () => {
    assert.equal(assistiveListening(0), null)
    assert.equal(assistiveListening(-10), null)
  })
})

// ---------------------------------------------------------------------------
// Cable derating and gauge conversion
// ---------------------------------------------------------------------------

describe('cable derating', () => {
  test('the temperature formula reproduces NEC Table 310.15(B)(1) exactly', () => {
    // These are the published correction factors, to two places. The formula
    // is what the table was generated from, so it has to land on them.
    const at = (ambient, insulation) => cableDerating(100, { ambientC: ambient, insulationC: insulation, conductors: 3 }).tempFactor
    assert.equal(at(35, 90), 0.96)
    assert.equal(at(40, 90), 0.91)
    assert.equal(at(50, 90), 0.82)
    assert.equal(at(40, 75), 0.88)
    assert.equal(at(50, 75), 0.75)
    assert.equal(at(40, 60), 0.82)
    assert.equal(at(45, 60), 0.71)
    assert.equal(at(30, 90), 1)
  })

  test('bundling factors are the published steps, not a curve', () => {
    const f = (n) => cableDerating(100, { conductors: n }).bundleFactor
    assert.equal(f(3), 1.0)
    assert.equal(f(4), 0.8)
    assert.equal(f(6), 0.8)
    assert.equal(f(7), 0.7)
    assert.equal(f(10), 0.5)
    assert.equal(f(21), 0.45)
    assert.equal(f(50), 0.35)
  })

  test('both factors multiply, which is how a 100 A cable becomes a 56 A cable', () => {
    const r = cableDerating(100, { conductors: 6, ambientC: 45, insulationC: 90 })
    assert.equal(r.bundleFactor, 0.8)
    assert.equal(r.tempFactor, 0.87)
    assert.equal(r.deratedAmps, 69.28)
    assert.equal(r.lostPercent, 30.72)
  })

  test('at or above the insulation rating there is no ampacity at all', () => {
    const r = cableDerating(100, { ambientC: 95, insulationC: 90 })
    assert.equal(r.deratedAmps, 0)
    assert.equal(r.overTemperature, true)
  })

  test('AWG to mm2 matches the published wire table', () => {
    assert.ok(Math.abs(awgToMm2(12).areaMm2 - 3.31) < 0.01)
    assert.ok(Math.abs(awgToMm2(10).areaMm2 - 5.26) < 0.01)
    assert.ok(Math.abs(awgToMm2(0).areaMm2 - 53.5) < 0.1)
    assert.ok(Math.abs(awgToMm2(-3).areaMm2 - 107.2) < 0.5)
    assert.equal(awgToMm2(0).label, '0 (1/0) AWG')
    assert.equal(awgToMm2(-3).label, '0000 (4/0) AWG')
    assert.equal(awgToMm2(12).label, '12 AWG')
  })

  test('mm2 back to AWG, and it says when the nearest size is thinner', () => {
    const r = mm2ToAwg(2.5)
    assert.equal(r.nearestAwg, 13)
    // 2.5 mm2 is the common metric size and there is no exact AWG for it, so
    // which side of it you land on is the whole question.
    assert.equal(mm2ToAwg(3.5).nearestIsSmaller, true)
    assert.equal(mm2ToAwg(3).nearestIsSmaller, false)
    assert.equal(mm2ToAwg(0), null)
  })
})

// ---------------------------------------------------------------------------
// SDI reach on coax
// ---------------------------------------------------------------------------

describe('SDI reach', () => {
  test('loss scales with the square root of frequency', () => {
    // Four times the frequency is twice the loss. That is skin effect, and it
    // is why 12G reaches roughly half as far as 3G rather than a quarter.
    const r = coaxReach(10, 100)
    const at400 = r.rates.find((x) => x.key === 'hd')
    // HD half-clock is 742.5 MHz: sqrt(7.425) = 2.725, so 27.2 dB/100m.
    assert.equal(at400.lossDbPer100m, 27.2)
  })

  test('every SDI rate comes back at once, which is the useful answer', () => {
    const r = coaxReach(21.6, 1000)
    assert.equal(r.rates.length, Object.keys(SDI_RATES).length)
    const by = Object.fromEntries(r.rates.map((x) => [x.key, x.reachM]))
    // Longer runs at lower rates, always, and 12G is the shortest.
    assert.ok(by.sd > by.hd && by.hd > by['3g'] && by['3g'] > by['6g'] && by['6g'] > by['12g'])
    // Doubling the bit rate costs a factor of sqrt(2) in reach.
    assert.ok(Math.abs(by['3g'] / by['6g'] - Math.SQRT2) < 0.02)
  })

  test('half the clock is the frequency that matters, not the bit rate', () => {
    const r = coaxReach(20, 1000)
    assert.equal(r.rates.find((x) => x.key === '12g').halfClockMhz, 5940)
    assert.equal(r.rates.find((x) => x.key === '3g').halfClockMhz, 1485)
  })

  test('the other direction: will this run work, and is it close', () => {
    const r = coaxReach(21.6, 1000)
    const rate = r.rates.find((x) => x.key === '3g')
    const inside = r.canRun(Math.round(rate.reachM * 0.5), '3g')
    assert.equal(inside.ok, true)
    assert.equal(inside.thin, false)
    const over = r.canRun(Math.round(rate.reachM * 1.2), '3g')
    assert.equal(over.ok, false)
    assert.ok(over.marginDb < 0)
    // Just inside the cliff is the dangerous case, and it is called out.
    const marginal = r.canRun(Math.round(rate.reachM * 0.95), '3g')
    assert.equal(marginal.ok, true)
    assert.equal(marginal.thin, true)
  })

  test('a bigger equalisation budget is a longer run, proportionally', () => {
    const a = coaxReach(20, 1000, { equalisationDb: 20 })
    const b = coaxReach(20, 1000, { equalisationDb: 40 })
    const ra = a.rates.find((x) => x.key === 'hd').reachM
    const rb = b.rates.find((x) => x.key === 'hd').reachM
    assert.ok(Math.abs(rb / ra - 2) < 0.02)
  })

  test('SDI reach rejects nonsense', () => {
    assert.equal(coaxReach(0, 1000), null)
    assert.equal(coaxReach(20, 0), null)
    assert.equal(coaxReach(20, 1000, { equalisationDb: 0 }), null)
    assert.equal(coaxReach(20, 1000).canRun(50, 'not-a-rate'), null)
  })
})
