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
  srgbToLinear, linearToSrgb, colourMix, mixWhites,
  ltcFrame, LTC_SYNC_WORD, mtcQuarterFrames, MTC_RATES, midiDecode, midiNoteName,
  peppersGhost, forcedPerspective, STEREO_LIMIT_M,
  dmxFrameTime, rdmOverhead, rdmUid, RDM_OVERHEAD_BYTES, thd, crestFactor,
  oscMessage, md5, pjlinkCommand, PJLINK_COMMANDS,
  artnetDmx, artnetPoll, ARTNET_OPCODES, rdmPacket, RDM_PIDS,
  mmcCommand, MMC_COMMANDS, mscCommand, sacnPacket, sacnMulticast as sacnGroup,
  opticalSpot, OPTICAL_FORMATS, rcFilter, transformer,
  waveHarmonics, WAVE_SHAPES, vbapStereo, dbapGains, wfsAliasing,
  directPaths, findBridges, checkChain,
  visualAcuity, ARCMIN_PER_RADIAN, interauralDelay,
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

// ---------------------------------------------------------------------------
// Colour mixing
// ---------------------------------------------------------------------------

describe('sRGB transfer function', () => {
  test('the endpoints are exact and the middle is not half', () => {
    assert.equal(srgbToLinear(0), 0)
    assert.equal(srgbToLinear(255), 1)
    assert.equal(linearToSrgb(0), 0)
    assert.equal(linearToSrgb(1), 255)
    // The whole point: code value 128 is about 21.6% of the light, not 50%.
    assert.ok(Math.abs(srgbToLinear(128) - 0.216) < 0.002)
    // And half the light encodes to 188, not 128.
    assert.equal(linearToSrgb(0.5), 188)
  })

  test('it round-trips', () => {
    for (const v of [0, 1, 17, 64, 128, 200, 254, 255]) {
      assert.equal(linearToSrgb(srgbToLinear(v)), v)
    }
  })

  test('out-of-range input is clamped rather than extrapolated', () => {
    assert.equal(srgbToLinear(300), 1)
    assert.equal(srgbToLinear(-10), 0)
    assert.equal(linearToSrgb(2), 255)
  })
})

describe('additive mixing', () => {
  const R = { name: 'red', r: 255, g: 0, b: 0 }
  const G = { name: 'green', r: 0, g: 255, b: 0 }
  const B = { name: 'blue', r: 0, g: 0, b: 255 }

  test('red plus green is yellow, which is the fact that breaks paint intuition', () => {
    const m = colourMix([R, G], 'additive')
    assert.equal(m.hex, '#ffff00')
  })

  test('all three primaries at full make white', () => {
    const m = colourMix([R, G, B], 'additive')
    assert.equal(m.hex, '#ffffff')
    assert.equal(m.luminance, 1)
  })

  test('two sources at half do not make one at full, because the numbers are not linear', () => {
    // Naive intuition: 128 + 128 = 255. In light it is 0.216 + 0.216 = 0.432,
    // which encodes to 176 — visibly short of white.
    const m = colourMix([{ r: 128, g: 128, b: 128 }, { r: 128, g: 128, b: 128 }], 'additive')
    assert.equal(m.rgb[0], 176)
    assert.equal(m.clipped, false)
  })

  test('clipping is reported, because it means the hue is now shifting rather than getting brighter', () => {
    const m = colourMix([{ r: 255, g: 100, b: 0 }, { r: 255, g: 200, b: 0 }], 'additive')
    assert.equal(m.clipped, true)
    assert.equal(m.headroom, 0)
  })

  test('level scales in linear light, not in code values', () => {
    const full = colourMix([{ r: 255, g: 255, b: 255, level: 1 }], 'additive')
    const half = colourMix([{ r: 255, g: 255, b: 255, level: 0.5 }], 'additive')
    assert.equal(full.luminance, 1)
    assert.equal(half.luminance, 0.5)
    // Half the light, encoded, is 188 — not 128.
    assert.equal(half.rgb[0], 188)
  })
})

describe('subtractive mixing', () => {
  test('cyan and magenta filters give blue, by removing rather than adding', () => {
    const m = colourMix([
      { name: 'cyan', r: 0, g: 255, b: 255 },
      { name: 'magenta', r: 255, g: 0, b: 255 },
    ], 'subtractive')
    // Cyan kills red, magenta kills green, blue survives both.
    assert.equal(m.hex, '#0000ff')
  })

  test('stacking all three subtractive primaries goes to black', () => {
    const m = colourMix([
      { r: 0, g: 255, b: 255 }, { r: 255, g: 0, b: 255 }, { r: 255, g: 255, b: 0 },
    ], 'subtractive')
    assert.equal(m.hex, '#000000')
  })

  test('a deep subtractive colour is also a dim one, which is the trade', () => {
    // Both filters pass red completely; the difference is what they do to the
    // other two channels, and green is where the luminance lives. A pale red
    // returns two thirds of the light, a deep red barely a fifth.
    const light = colourMix([{ r: 255, g: 200, b: 200 }], 'subtractive')
    const deep = colourMix([{ r: 255, g: 20, b: 20 }], 'subtractive')
    assert.ok(light.luminance > 0.6, `pale red passed only ${light.luminance}`)
    assert.ok(deep.luminance < 0.25, `deep red passed ${deep.luminance}`)
    assert.ok(light.luminance / deep.luminance > 3)
  })

  test('a filter at level 0 is a filter out of the beam', () => {
    const m = colourMix([{ r: 0, g: 255, b: 255, level: 0 }], 'subtractive')
    assert.equal(m.hex, '#ffffff')
  })

  test('reflectance multiplies exactly like transmission: a red costume under green light', () => {
    // A saturated green source has almost nothing where a red costume
    // reflects, so the costume returns almost nothing. It does not go dark
    // red — it goes black.
    const m = colourMix([
      { name: 'green source', r: 0, g: 255, b: 40 },
      { name: 'red costume', r: 220, g: 20, b: 20 },
    ], 'subtractive')
    assert.ok(m.luminance < 0.02, `costume returned ${m.luminance}`)
  })
})

describe('coloured shadows', () => {
  const warm = { name: 'warm key', r: 255, g: 140, b: 40 }
  const blue = { name: 'blue side', r: 40, g: 90, b: 255 }

  test('the shadow of one source is the colour of the other', () => {
    const m = colourMix([warm, blue], 'additive')
    const s0 = m.shadowOf(0)
    const s1 = m.shadowOf(1)
    // Block the warm source and what is left IS the blue source, exactly.
    assert.equal(s0.hex, '#285aff')
    assert.equal(s0.blocked, 'warm key')
    assert.equal(s1.hex, '#ff8c28')
    assert.equal(s1.blocked, 'blue side')
    assert.equal(s0.black, false)
    assert.equal(s1.black, false)
  })

  test('one source alone casts a genuinely black shadow', () => {
    const m = colourMix([warm], 'additive')
    assert.equal(m.shadowOf(0).black, true)
    assert.equal(m.shadowOf(0).hex, '#000000')
  })

  test('with three sources, blocking one leaves the sum of the other two', () => {
    const m = colourMix([
      { name: 'a', r: 255, g: 0, b: 0 },
      { name: 'b', r: 0, g: 255, b: 0 },
      { name: 'c', r: 0, g: 0, b: 255 },
    ], 'additive')
    assert.equal(m.shadowOf(0).hex, '#00ffff')
    assert.equal(m.shadowOf(1).hex, '#ff00ff')
    assert.equal(m.shadowOf(2).hex, '#ffff00')
  })

  test('shadows are an additive question and subtractive mode declines to answer', () => {
    const m = colourMix([{ r: 0, g: 255, b: 255 }], 'subtractive')
    assert.equal(m.shadowOf(0), null)
    assert.equal(colourMix([warm], 'additive').shadowOf(5), null)
  })

  test('colour mixing rejects nonsense', () => {
    assert.equal(colourMix([], 'additive'), null)
    assert.equal(colourMix([warm], 'neither'), null)
    assert.equal(colourMix([{ r: 0, g: 0, b: 0, level: 2 }], 'additive'), null)
  })
})

describe('mixing white sources', () => {
  test('colour temperature averages in mireds, not in kelvin', () => {
    // 3200 K is 312.5 mired, 6500 K is 153.8. The mean is 233.2 mired,
    // which is 4289 K — not the 4850 K a kelvin average would give.
    const m = mixWhites([{ cct: 3200 }, { cct: 6500 }])
    assert.equal(m.resultK, 4289)
    assert.equal(m.naiveKelvinAverage, 4850)
    assert.equal(m.kelvinErrorIfAveraged, 561)
  })

  test('level weights the mix', () => {
    const mostlyTungsten = mixWhites([{ cct: 3200, level: 1 }, { cct: 6500, level: 0.1 }])
    assert.ok(mostlyTungsten.resultK < 3600)
    const one = mixWhites([{ cct: 5600, level: 1 }, { cct: 3200, level: 0 }])
    assert.equal(one.resultK, 5600)
  })

  test('far-apart sources are flagged for the green shift, which is the real warning', () => {
    const far = mixWhites([{ cct: 2700 }, { cct: 6500 }])
    assert.ok(far.miredSpread > 100)
    assert.equal(far.greenShift, true)
    assert.match(far.advice, /minus-green/)
    const close = mixWhites([{ cct: 5000 }, { cct: 5600 }])
    assert.equal(close.greenShift, false)
    assert.equal(close.miredSpread, 21)
  })

  test('a single source mixes to itself with no shift', () => {
    const m = mixWhites([{ cct: 5600 }])
    assert.equal(m.resultK, 5600)
    assert.equal(m.miredSpread, 0)
    assert.equal(m.greenShift, false)
  })

  test('white mixing rejects nonsense', () => {
    assert.equal(mixWhites([]), null)
    assert.equal(mixWhites([{ cct: 100 }]), null)
    assert.equal(mixWhites([{ cct: 5600, level: 0 }]), null)
  })
})

// ---------------------------------------------------------------------------
// What is inside a timecode frame
// ---------------------------------------------------------------------------

describe('LTC frame structure', () => {
  test('80 bits, of which only 26 are the time', () => {
    const f = ltcFrame(10, 30, 45, 12)
    assert.equal(f.bits.length, 80)
    assert.equal(f.totalBits, 80)
    assert.equal(f.timeBits, 26)
    assert.equal(f.userBits, 32)
  })

  test('the digits are BCD, each in its own field, LSB first', () => {
    // 12 frames: units 2 in bits 0-3, tens 1 in bits 8-9.
    const f = ltcFrame(0, 0, 0, 12)
    assert.deepEqual(f.bits.slice(0, 4), [0, 1, 0, 0], 'frame units should be 2, LSB first')
    assert.deepEqual(f.bits.slice(8, 10), [1, 0], 'frame tens should be 1')
    // 45 seconds: units 5, tens 4.
    const g = ltcFrame(0, 0, 45, 0)
    assert.deepEqual(g.bits.slice(16, 20), [1, 0, 1, 0], 'second units should be 5')
    assert.deepEqual(g.bits.slice(24, 27), [0, 0, 1], 'second tens should be 4')
    // 23 hours: units 3, tens 2.
    const h = ltcFrame(23, 0, 0, 0)
    assert.deepEqual(h.bits.slice(48, 52), [1, 1, 0, 0], 'hour units should be 3')
    assert.deepEqual(h.bits.slice(56, 58), [0, 1], 'hour tens should be 2')
  })

  test('the sync word is fixed, and its twelve consecutive ones are the point', () => {
    const f = ltcFrame(1, 2, 3, 4)
    assert.equal(f.bits.slice(64).join(''), LTC_SYNC_WORD)
    assert.equal(LTC_SYNC_WORD, '0011111111111101')
    // Twelve ones in a row appear nowhere else in a frame: the longest run in
    // the first 64 bits has to be shorter, or a reader could false-sync.
    const body = f.bits.slice(0, 64).join('')
    const longest = Math.max(...body.split('0').map((r) => r.length))
    assert.ok(longest < 12, `a run of ${longest} ones in the data could be mistaken for sync`)
    // And it is not a palindrome, which is how a reader knows tape direction.
    assert.notEqual(LTC_SYNC_WORD, [...LTC_SYNC_WORD].reverse().join(''))
  })

  test('the drop-frame flag is one bit, and it is bit 10', () => {
    assert.equal(ltcFrame(0, 0, 0, 0, { dropFrame: true }).bits[10], 1)
    assert.equal(ltcFrame(0, 0, 0, 0).bits[10], 0)
    assert.equal(ltcFrame(0, 0, 0, 0, { colourFrame: true }).bits[11], 1)
  })

  test('80 bits a frame is what makes it an audio signal', () => {
    const f = ltcFrame(0, 0, 0, 0)
    assert.equal(f.bitRateAt(30), 2400)
    assert.equal(f.bitRateAt(25), 2000)
    assert.equal(f.bitRateAt(0), null)
  })

  test('LTC rejects impossible times', () => {
    assert.equal(ltcFrame(24, 0, 0, 0), null)
    assert.equal(ltcFrame(0, 60, 0, 0), null)
    assert.equal(ltcFrame(0, 0, 0, 30), null)
    assert.equal(ltcFrame(0, 0, 0, 1.5), null)
  })
})

describe('MTC quarter frames', () => {
  test('eight pieces of four bits, and they take two frames to arrive', () => {
    const q = mtcQuarterFrames(1, 2, 3, 4, '25')
    assert.equal(q.messages.length, 8)
    assert.equal(q.piecesPerFrame, 4)
    assert.equal(q.framesToComplete, 2)
  })

  test('each piece is F1 followed by the piece index and its nibble', () => {
    // 4 frames: low nibble 4 in piece 0, high nibble 0 in piece 1.
    const q = mtcQuarterFrames(1, 2, 3, 4, '25')
    assert.equal(q.messages[0].hex, 'F1 04')
    assert.equal(q.messages[1].hex, 'F1 10')
    // 3 seconds: low nibble 3 -> piece 2 carries 0x23.
    assert.equal(q.messages[2].hex, 'F1 23')
    // 2 minutes -> piece 4 carries 0x42.
    assert.equal(q.messages[4].hex, 'F1 42')
    // 1 hour, rate 25 (code 1): piece 7 = (1 << 1) | 0 = 2, so 0x72.
    assert.equal(q.messages[6].hex, 'F1 61')
    assert.equal(q.messages[7].hex, 'F1 72')
  })

  test('piece 7 carries the frame rate, so the rate is only known at the end', () => {
    assert.equal(mtcQuarterFrames(0, 0, 0, 0, '24').messages[7].hex, 'F1 70')
    assert.equal(mtcQuarterFrames(0, 0, 0, 0, '25').messages[7].hex, 'F1 72')
    assert.equal(mtcQuarterFrames(0, 0, 0, 0, '29.97df').messages[7].hex, 'F1 74')
    assert.equal(mtcQuarterFrames(0, 0, 0, 0, '30').messages[7].hex, 'F1 76')
    // Hours above 15 need a fifth bit, and it rides in piece 7 beside the rate.
    assert.equal(mtcQuarterFrames(23, 0, 0, 0, '30').messages[7].hex, 'F1 77')
    assert.equal(mtcQuarterFrames(23, 0, 0, 0, '30').messages[6].hex, 'F1 67')
  })

  test('the full-frame message exists because a stopped transport has nothing to lag behind', () => {
    const q = mtcQuarterFrames(1, 2, 3, 4, '30')
    assert.equal(q.fullFrame, 'F0 7F 7F 01 01 61 02 03 04 F7')
  })

  test('MTC rejects an unknown rate and impossible times', () => {
    assert.equal(mtcQuarterFrames(0, 0, 0, 0, '23.976'), null)
    assert.equal(mtcQuarterFrames(0, 0, 0, 30, '30'), null)
    assert.equal(Object.keys(MTC_RATES).length, 4)
  })
})

describe('reading MIDI as hex', () => {
  test('the whole framing rule: a status byte has its top bit set', () => {
    const d = midiDecode('90 3C 7F')
    assert.equal(d.messages.length, 1)
    assert.equal(d.messages[0].name, 'Note On')
    assert.equal(d.messages[0].channel, 1)
    assert.match(d.messages[0].detail, /C3 \(60\)/)
    assert.match(d.messages[0].detail, /velocity 127/)
  })

  test('the low nibble is the channel, zero-based on the wire', () => {
    assert.equal(midiDecode('90 3C 40').messages[0].channel, 1)
    assert.equal(midiDecode('9F 3C 40').messages[0].channel, 16)
    assert.equal(midiDecode('B0 07 64').messages[0].channel, 1)
  })

  test('running status: repeated data bytes with the status left out', () => {
    const d = midiDecode('90 3C 7F 3E 7F 40 7F')
    assert.equal(d.messages.length, 3)
    assert.equal(d.messages[0].runningStatus, false)
    assert.equal(d.messages[1].runningStatus, true)
    assert.equal(d.messages[2].runningStatus, true)
    assert.ok(d.messages.every((m) => m.name === 'Note On'))
  })

  test('note on at velocity zero is a note off, which is what makes running status pay', () => {
    const d = midiDecode('90 3C 7F 3C 00')
    assert.equal(d.messages[1].name, 'Note On')
    assert.match(d.messages[1].detail, /is a Note Off/)
  })

  test('14-bit values are LSB first', () => {
    // Pitch bend centre is 8192 = 0x2000, sent as LSB 00, MSB 40.
    assert.match(midiDecode('E0 00 40').messages[0].detail, /8192 of 16383/)
    assert.match(midiDecode('F2 08 00').messages[0].detail, /position 8 /)
  })

  test('an MTC quarter frame decodes to its piece and nibble', () => {
    const d = midiDecode('F1 04')
    assert.equal(d.messages[0].name, 'MTC Quarter Frame')
    assert.match(d.messages[0].detail, /piece 0 of 8/)
    assert.match(d.messages[0].detail, /frame low/)
    assert.match(midiDecode('F1 72').messages[0].detail, /hour high \+ rate/)
  })

  test('SysEx runs until F7, and MSC and MTC full frame are recognised', () => {
    const msc = midiDecode('F0 7F 7F 02 01 01 31 00 F7')
    assert.equal(msc.messages[0].name, 'System Exclusive')
    assert.match(msc.messages[0].detail, /MIDI Show Control/)
    // Only the values this repository has a source for get named; anything
    // else decodes as its raw number rather than being guessed at.
    assert.match(msc.messages[0].detail, /GO to Lighting \(General\)/)
    assert.match(msc.messages[0].detail, /all-call/)
    assert.match(msc.messages[0].detail, /Cue 1\./)
    // Cue number, list and path are ASCII digits split on 0x00.
    const withList = midiDecode('F0 7F 01 02 01 01 31 32 00 33 00 F7')
    assert.match(withList.messages[0].detail, /Cue 12 in list 3/)
    assert.match(withList.messages[0].detail, /device 1/)
    // An unsourced command number is printed, not invented.
    assert.match(midiDecode('F0 7F 7F 02 01 14 F7').messages[0].detail, /command 0x14/)
    const full = midiDecode('F0 7F 7F 01 01 61 02 03 04 F7')
    assert.match(full.messages[0].detail, /full frame/)
  })

  test('realtime bytes do not disturb running status, which is why they can interleave', () => {
    // A clock byte arriving between two running-status notes must not break
    // the run. This is exactly what a real stream looks like.
    const d = midiDecode('90 3C 7F F8 3E 7F')
    const notes = d.messages.filter((m) => m.name === 'Note On')
    assert.equal(notes.length, 2)
    assert.equal(notes[1].runningStatus, true)
    assert.equal(d.messages[1].name, 'Timing Clock')
  })

  test('a truncated or orphaned stream is reported rather than guessed at', () => {
    assert.equal(midiDecode('90 3C').messages[0].error, true)
    assert.match(midiDecode('90 3C').messages[0].detail, /Truncated/)
    assert.equal(midiDecode('3C 7F').messages[0].name, 'orphan data byte')
    assert.equal(midiDecode('F0 7E 01').messages[0].error, true)
    assert.match(midiDecode('zz').error, /not a hex byte/)
  })

  test('separators and 0x prefixes are all accepted, because people paste from anywhere', () => {
    for (const form of ['90 3C 7F', '90,3C,7F', '0x90 0x3C 0x7F', '90:3c:7f', '90\n3C\n7F']) {
      assert.equal(midiDecode(form).messages[0].name, 'Note On', `failed on "${form}"`)
    }
    assert.deepEqual(midiDecode('').messages, [])
  })

  test('note numbers name themselves, with middle C at 60', () => {
    assert.equal(midiNoteName(60), 'C3')
    assert.equal(midiNoteName(0), 'C-2')
    assert.equal(midiNoteName(127), 'G8')
    assert.equal(midiNoteName(128), null)
  })
})

// ---------------------------------------------------------------------------
// Designed illusion
// ---------------------------------------------------------------------------

describe("Pepper's ghost", () => {
  test('the ghost is object luminance times reflectance, and nothing else', () => {
    const g = peppersGhost({ objectLuminance: 1000, backgroundLuminance: 0, reflectance: 0.08 })
    assert.equal(g.ghostLuminance, 80)
    assert.equal(g.transmittance, 0.92)
  })

  test('the contrast ratio is the whole design, and plain glass is a hard place to start', () => {
    // Uncoated glass at 8%: a 1000 cd/m2 object against a 50 cd/m2 set is
    // only 1.74:1 and reads as a smear on a window.
    const glass = peppersGhost({ objectLuminance: 1000, backgroundLuminance: 50, reflectance: 0.08 })
    assert.equal(glass.contrastRatio, 1.74)
    assert.equal(glass.reads, 'translucent')
    // The same object on 45% foil is solid without touching a lamp.
    const foil = peppersGhost({ objectLuminance: 1000, backgroundLuminance: 50, reflectance: 0.45 })
    assert.ok(foil.contrastRatio > 4)
    assert.equal(foil.reads, 'solid')
  })

  test('there are two ways to fix a weak ghost, and darkening is the cheap one', () => {
    const g = peppersGhost({ objectLuminance: 1000, backgroundLuminance: 50, reflectance: 0.08 })
    // Brighten the object to 2300, or drop the background to under 22.
    assert.equal(g.objectLuminanceFor(4), 2300)
    assert.equal(g.backgroundLuminanceFor(4), 21.74)
    // Check the round trip: that background really does give 4:1.
    const fixed = peppersGhost({ objectLuminance: 1000, backgroundLuminance: 21.74, reflectance: 0.08 })
    assert.ok(Math.abs(fixed.contrastRatio - 4) < 0.01)
  })

  test('a black background makes any ghost solid, which is why black boxes are used', () => {
    const g = peppersGhost({ objectLuminance: 100, backgroundLuminance: 0, reflectance: 0.08 })
    assert.equal(g.contrastRatio, null)
    assert.equal(g.reads, 'solid')
  })

  test('a pane cannot reflect everything, or absorb more than it has', () => {
    assert.equal(peppersGhost({ reflectance: 1 }), null)
    assert.equal(peppersGhost({ reflectance: 0 }), null)
    assert.equal(peppersGhost({ reflectance: 0.5, absorption: 0.6 }), null)
    assert.equal(peppersGhost({ objectLuminance: -5 }), null)
  })
})

describe('forced perspective', () => {
  test('matching size is matching the ratio of size to distance', () => {
    // A 1.8 m person at 4 m; to match at 20 m you need 9 m of object.
    const r = forcedPerspective(1.8, 4, 20)
    assert.equal(r.requiredSize, 9)
    assert.equal(r.scaleFactor, 5)
  })

  test('angular size is the thing actually being matched', () => {
    const near = forcedPerspective(1, 10, 10)
    const far = forcedPerspective(10, 100, 100)
    // Same ratio, same angle, so they look the same size.
    assert.equal(near.angularSizeDeg, far.angularSizeDeg)
    assert.equal(far.requiredSize, 10)
  })

  test('the reverse question: where does a given object have to stand', () => {
    const r = forcedPerspective(1.8, 4, 20)
    // A 3.6 m object matches the same angle at twice the distance.
    assert.equal(r.distanceToMatch(3.6), 8)
    assert.equal(r.distanceToMatch(0), null)
  })

  test('the honest half: two eyes overrule the size cue up close', () => {
    const close = forcedPerspective(1.8, 4, 6)
    assert.equal(close.disparityWillBetrayIt, true)
    assert.match(close.note, /fails for a live front row/)
    const far = forcedPerspective(1.8, 40, 200)
    assert.equal(far.disparityWillBetrayIt, false)
    assert.match(far.note, /Motion parallax still betrays it/)
    // The limit is a soft edge, so it is adjustable rather than baked in.
    assert.equal(STEREO_LIMIT_M, 10)
    assert.equal(forcedPerspective(1.8, 4, 6, { stereoLimitM: 2 }).disparityWillBetrayIt, false)
  })

  test('forced perspective rejects nonsense', () => {
    assert.equal(forcedPerspective(0, 4, 20), null)
    assert.equal(forcedPerspective(1.8, 0, 20), null)
    assert.equal(forcedPerspective(1.8, 4, -20), null)
    assert.equal(forcedPerspective(1.8, 4, 20, { stereoLimitM: -1 }), null)
  })
})

// ---------------------------------------------------------------------------
// DMX timing, RDM, and what sharing the wire costs
// ---------------------------------------------------------------------------

describe('DMX frame timing', () => {
  test('the refresh rate is arithmetic, not a setting', () => {
    // 250 kbit/s, 11 bits a slot = 44 us. 513 slots plus break and MAB comes
    // to 22.68 ms, which is the familiar ~44 Hz ceiling.
    const f = dmxFrameTime(512)
    assert.equal(f.slotUs, 44)
    assert.equal(f.frameMs, 22.68)
    assert.equal(f.refreshHz, 44.1)
  })

  test('the start code is a slot, which is why 512 channels is 513 slots', () => {
    const one = dmxFrameTime(1)
    // break + MAB + 2 slots
    assert.equal(one.frameUs, 92 + 12 + 2 * 44)
  })

  test('sending fewer slots is the only lever there is', () => {
    const f = dmxFrameTime(512)
    const short = f.atSlots(24)
    assert.ok(short.refreshHz > 800)
    assert.ok(short.refreshHz > f.refreshHz * 18)
    assert.equal(f.atSlots(513), null)
  })

  test('frame timing rejects impossible frames', () => {
    assert.equal(dmxFrameTime(513), null)
    assert.equal(dmxFrameTime(-1), null)
    assert.equal(dmxFrameTime(512, { bitRate: 0 }), null)
  })
})

describe('what RDM costs the refresh rate', () => {
  test('an RDM packet is 25 bytes before it carries anything', () => {
    assert.equal(RDM_OVERHEAD_BYTES, 25)
    const r = rdmOverhead(1, { requestPdl: 0, responsePdl: 0, turnaroundUs: 0 })
    // 25 bytes each way at 44 us.
    assert.equal(r.requestUs, 25 * 44)
    assert.equal(r.responseUs, 25 * 44)
  })

  test('polling really does slow the rig down, and this is the subtraction', () => {
    const idle = rdmOverhead(0)
    assert.equal(idle.refreshHz, idle.baseRefreshHz)
    assert.equal(idle.lostHz, 0)
    const busy = rdmOverhead(20)
    assert.ok(busy.refreshHz < busy.baseRefreshHz)
    assert.ok(busy.wirePercent > 5 && busy.wirePercent < 10)
    assert.ok(busy.lostHz > 2)
  })

  test('enough traffic and there is no room for levels at all', () => {
    const runaway = rdmOverhead(400)
    assert.equal(runaway.saturated, true)
    assert.equal(runaway.refreshHz, 0)
  })

  test('parameter data cannot exceed what the packet can hold', () => {
    assert.equal(rdmOverhead(10, { responsePdl: 232 }), null)
    assert.equal(rdmOverhead(-1), null)
  })
})

describe('RDM UIDs', () => {
  test('48 bits: a 16-bit manufacturer and a 32-bit device', () => {
    const u = rdmUid('4C55:12345678')
    assert.equal(u.manufacturerHex, '4C55')
    assert.equal(u.deviceHex, '12345678')
    assert.equal(u.deviceId, 0x12345678)
    assert.equal(u.scope, 'a single device')
    assert.equal(u.broadcast, false)
  })

  test('the two broadcast forms are recognised as broadcasts', () => {
    assert.equal(rdmUid('FFFF:FFFFFFFF').scope, 'all devices, all manufacturers')
    assert.equal(rdmUid('4C55:FFFFFFFF').scope, 'all devices from manufacturer 4C55')
    assert.equal(rdmUid('4C55:FFFFFFFF').broadcast, true)
  })

  test('manufacturer IDs from 8000h up name nobody', () => {
    // Reserved for E1.33 dynamic UIDs, which the protocol entry documents.
    const dyn = rdmUid('8001:00000001')
    assert.equal(dyn.dynamicUid, true)
    assert.equal(dyn.identifiableByManufacturer, false)
    assert.match(dyn.note, /RDMnet dynamic UIDs/)
    const real = rdmUid('7FFF:00000001')
    assert.equal(real.dynamicUid, false)
    assert.equal(real.identifiableByManufacturer, true)
  })

  test('the separator is optional and the case does not matter', () => {
    for (const form of ['4C55:12345678', '4c55:12345678', '4C5512345678', '4C55-12345678', ' 4C55:1234 5678 ']) {
      assert.equal(rdmUid(form).uid, '4C55:12345678', `failed on "${form}"`)
    }
  })

  test('a UID that is not 48 bits is not a UID', () => {
    assert.equal(rdmUid('4C55:1234'), null)
    assert.equal(rdmUid('nonsense'), null)
    assert.equal(rdmUid(''), null)
    assert.equal(rdmUid(null), null)
  })
})

// ---------------------------------------------------------------------------
// Harmonic distortion
// ---------------------------------------------------------------------------

describe('total harmonic distortion', () => {
  test('a pure sine has none', () => {
    const r = thd([0, 0, 0, 0])
    assert.equal(r.thdF, 0)
    assert.equal(r.thdR, 0)
    assert.equal(r.distortionPowerFactor, 1)
    assert.equal(r.verdict, 'clean')
  })

  test('THD-F and THD-R are different numbers and both are right', () => {
    // A single 3rd harmonic at 50% of the fundamental.
    const r = thd([0, 0.5])
    assert.equal(r.thdF, 50)
    // Referenced to the total RMS instead: 0.5 / sqrt(1.25) = 44.7%.
    assert.equal(r.thdR, 44.72)
    // THD-R can never reach 100%; THD-F is unbounded.
    assert.ok(thd([0, 5]).thdF > 100)
    assert.ok(thd([0, 5]).thdR < 100)
  })

  test('distortion alone drags the power factor down, with nothing inductive present', () => {
    const r = thd([0, 0.5])
    // 1/sqrt(1 + 0.25) = 0.894
    assert.equal(r.distortionPowerFactor, 0.894)
    assert.ok(thd([0, 0.7, 0, 0.4]).distortionPowerFactor < 0.85)
  })

  test('triplens are the ones that add in the neutral', () => {
    // A 5th harmonic is not a triplen and does not stack in the neutral.
    assert.equal(thd([0, 0, 0, 0.4]).triplenShare, 0)
    // A 3rd is, and so is a 9th.
    assert.equal(thd([0, 0.4]).triplenShare, 40)
    assert.equal(thd([0, 0, 0, 0, 0, 0, 0, 0.3]).triplenShare, 30)
  })

  test('the neutral can carry more than any phase, on a perfectly balanced rig', () => {
    // 30 A of fundamental per phase with a 70% third harmonic.
    const r = thd([0, 0.7, 0, 0.4, 0, 0.25], { fundamentalAmps: 30 })
    assert.equal(r.neutral.phaseAmps, 39.26)
    assert.equal(r.neutral.neutralAmps, 63)
    assert.equal(r.neutral.exceedsPhase, true)
    // Without triplens the neutral is quiet even at high THD.
    const noTriplen = thd([0, 0, 0, 0.6], { fundamentalAmps: 30 })
    assert.equal(noTriplen.neutral.neutralAmps, 0)
    assert.equal(noTriplen.neutral.exceedsPhase, false)
  })

  test('no fundamental current means no neutral figure rather than a wrong one', () => {
    assert.equal(thd([0, 0.5]).neutral, null)
  })

  test('THD rejects nonsense', () => {
    assert.equal(thd([]), null)
    assert.equal(thd([0, -0.5]), null)
    assert.equal(thd('not an array'), null)
  })
})

describe('crest factor', () => {
  test('a pure sine is the square root of two', () => {
    const r = crestFactor(Math.SQRT2, 1)
    assert.equal(r.crestFactor, 1.414)
    assert.equal(r.peakLimited, false)
  })

  test('a spiky load is sized by its peaks, not its average', () => {
    const r = crestFactor(4.2, 1.5)
    assert.equal(r.crestFactor, 2.8)
    assert.equal(r.peakLimited, true)
    assert.match(r.note, /clip these/)
  })

  test('crest factor rejects a zero RMS', () => {
    assert.equal(crestFactor(4, 0), null)
    assert.equal(crestFactor(-1, 1), null)
  })
})

// ---------------------------------------------------------------------------
// Wire formats: the actual bytes
// ---------------------------------------------------------------------------

const hexOf = (bytes) => [...bytes].map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')

describe('OSC encoding', () => {
  test('every message is a multiple of four bytes, always', () => {
    for (const addr of ['/a', '/eos/cue/1/fire', '/composition/layers/1/video/opacity']) {
      const m = oscMessage(addr, [])
      assert.equal(m.length % 4, 0, `${addr} came out ${m.length} bytes`)
      assert.equal(m.aligned, true)
    }
  })

  test('a bare message is address plus a lone comma, both null-padded', () => {
    // "/eos/cue/1/fire" is 15 characters, so the null lands on 16 exactly.
    const m = oscMessage('/eos/cue/1/fire', [])
    assert.equal(m.length, 20)
    assert.equal(m.typeTags, ',')
    assert.equal(m.hex.slice(-11), '2C 00 00 00')
  })

  test('integers and floats are big-endian, four bytes each', () => {
    const i = oscMessage('/x', [{ type: 'i', value: 1 }])
    assert.ok(i.hex.endsWith('00 00 00 01'), i.hex)
    // 0.5 as IEEE 754 single is 0x3F000000.
    const f = oscMessage('/x', [{ type: 'f', value: 0.5 }])
    assert.ok(f.hex.endsWith('3F 00 00 00'), f.hex)
  })

  test('T F N and I carry a tag and no bytes at all', () => {
    const bare = oscMessage('/x', [])
    const flags = oscMessage('/x', [{ type: 'T' }, { type: 'F' }])
    assert.equal(flags.typeTags, ',TF')
    // Same payload length: the tag string grew, nothing else did.
    assert.equal(flags.length, bare.length)
  })

  test('bare values are guessed sensibly and the guess is stated in the tags', () => {
    assert.equal(oscMessage('/x', [1]).typeTags, ',i')
    assert.equal(oscMessage('/x', [1.5]).typeTags, ',f')
    assert.equal(oscMessage('/x', ['go']).typeTags, ',s')
  })

  test('an address must start with a slash', () => {
    assert.equal(oscMessage('eos/go', []), null)
    assert.equal(oscMessage('/x', 'not an array'), null)
    assert.equal(oscMessage('/x', [{ type: 'z', value: 1 }]), null)
  })
})

describe('MD5 and PJLink', () => {
  test('MD5 against the published test vectors', () => {
    assert.equal(md5(''), 'd41d8cd98f00b204e9800998ecf8427e')
    assert.equal(md5('a'), '0cc175b9c0f1b6a831c399e269772661')
    assert.equal(md5('abc'), '900150983cd24fb0d6963f7d28e17f72')
    assert.equal(md5('message digest'), 'f96b697d7cb7938d525a2f31aaf161d0')
    assert.equal(md5('The quick brown fox jumps over the lazy dog'), '9e107d9d372bb6826bd81d3542a419d6')
    // A message long enough to need a second block.
    assert.equal(md5('12345678901234567890123456789012345678901234567890123456789012345678901234567890'),
      '57edf4a22be3c955ac49da2e2107b67a')
  })

  test('the PJLink digest matches the worked example in the specification', () => {
    // Challenge 498e4a67 with password JBMIAProjectorLink is the example
    // PJLink itself publishes, which is what makes it worth testing against.
    const p = pjlinkCommand('POWR', '1', { challenge: '498e4a67', password: 'JBMIAProjectorLink' })
    assert.equal(p.authDigest, '5d8409bc1c3fa39749434aa3a5c38682')
    assert.equal(p.wire, '5d8409bc1c3fa39749434aa3a5c38682%1POWR 1\r')
  })

  test('a command is per cent, class, four letters, space, parameter, carriage return', () => {
    const q = pjlinkCommand('POWR', '?')
    assert.equal(q.line, '%1POWR ?\r')
    assert.equal(q.isQuery, true)
    assert.equal(q.port, 4352)
    assert.equal(pjlinkCommand('INPT', '31').line, '%1INPT 31\r')
  })

  test('with no challenge there is no digest, which is only right if security is off', () => {
    const p = pjlinkCommand('POWR', '1')
    assert.equal(p.authDigest, null)
    assert.equal(p.wire, p.line)
    assert.match(p.note, /PJLINK 0/)
  })

  test('PJLink rejects unknown commands and malformed challenges', () => {
    assert.equal(pjlinkCommand('NOPE', '1'), null)
    assert.equal(pjlinkCommand('POWR', ''), null)
    assert.equal(pjlinkCommand('POWR', '1', { challenge: 'xyz', password: 'p' }), null)
    assert.ok(Object.keys(PJLINK_COMMANDS).length >= 11)
  })
})

describe('Art-Net', () => {
  test('the header is eighteen bytes and starts with the identifier', () => {
    const a = artnetDmx(0, 0, 1, [255])
    assert.equal(a.hex.slice(0, 23), '41 72 74 2D 4E 65 74 00')
    assert.equal(a.port, 6454)
  })

  test('the opcode is low byte first and the length is high byte first, in the same header', () => {
    const a = artnetDmx(0, 0, 1, new Array(512).fill(0))
    const b = a.bytes
    // ArtDmx is 0x5000, so byte 8 is 0x00 and byte 9 is 0x50.
    assert.equal(b[8], 0x00)
    assert.equal(b[9], 0x50)
    // 512 slots is 0x0200, high byte first.
    assert.equal(b[16], 0x02)
    assert.equal(b[17], 0x00)
    assert.equal(a.length, 530)
  })

  test('the port address is net, subnet and universe packed together', () => {
    assert.equal(artnetDmx(0, 0, 0, [0, 0]).portAddress, 0)
    assert.equal(artnetDmx(0, 0, 15, [0, 0]).portAddress, 15)
    assert.equal(artnetDmx(0, 1, 0, [0, 0]).portAddress, 16)
    assert.equal(artnetDmx(1, 0, 0, [0, 0]).portAddress, 256)
    assert.equal(artnetDmx(127, 15, 15, [0, 0]).portAddress, 32767)
  })

  test('the wire carries an even number of slots, minimum two', () => {
    assert.equal(artnetDmx(0, 0, 1, [255]).dataLength, 2)
    assert.equal(artnetDmx(0, 0, 1, [255, 255, 255]).dataLength, 4)
    assert.equal(artnetDmx(0, 0, 1, []).dataLength, 2)
  })

  test('ArtPoll is fourteen bytes and asks every node to announce itself', () => {
    const p = artnetPoll()
    assert.equal(p.length, 14)
    assert.equal(p.bytes[8], 0x00)
    assert.equal(p.bytes[9], 0x20)
    assert.match(p.expects, /ArtPollReply/)
    assert.equal(ARTNET_OPCODES.ArtPollReply, 0x2100)
  })

  test('Art-Net rejects out-of-range addressing', () => {
    assert.equal(artnetDmx(128, 0, 0, []), null)
    assert.equal(artnetDmx(0, 16, 0, []), null)
    assert.equal(artnetDmx(0, 0, 16, []), null)
    assert.equal(artnetDmx(0, 0, 1, new Array(513).fill(0)), null)
    assert.equal(artnetDmx(0, 0, 1, [256]), null)
  })
})

describe('RDM packets', () => {
  test('the checksum is a plain additive sum of everything before it', () => {
    const r = rdmPacket({ destination: '4C55:12345678', source: '0001:00000001', pid: 0x00f0 })
    let sum = 0
    for (let i = 0; i < r.messageLength; i++) sum += r.bytes[i]
    assert.equal(sum & 0xffff, r.checksum)
    assert.equal(r.checksumHex, '03AD')
  })

  test('message length counts the header and data but NOT the checksum', () => {
    const bare = rdmPacket({ pid: 0x0060 })
    assert.equal(bare.messageLength, 24)
    assert.equal(bare.length, 26)
    const withData = rdmPacket({ pid: 0x00f0, commandClass: 0x30, data: [0x00, 0x64] })
    assert.equal(withData.messageLength, 26)
    assert.equal(withData.length, 28)
    assert.equal(withData.bytes[2], 26)
  })

  test('it starts with 0xCC, which is how a fixture knows it is not level data', () => {
    const r = rdmPacket({})
    assert.equal(r.bytes[0], 0xcc)
    assert.equal(r.bytes[1], 0x01)
  })

  test('known PIDs are named and unknown ones are printed rather than guessed', () => {
    assert.equal(rdmPacket({ pid: 0x1000 }).pid, 'IDENTIFY_DEVICE')
    assert.equal(rdmPacket({ pid: 0x00f0 }).pid, 'DMX_START_ADDRESS')
    assert.equal(rdmPacket({ pid: 0x8123 }).pid, '0x8123')
    assert.equal(rdmPacket({ pid: 0x8123 }).pidKnown, false)
    assert.ok(RDM_PIDS[0x0001] === 'DISC_UNIQUE_BRANCH')
  })

  test('a broadcast gets no answer, and the packet says so', () => {
    const b = rdmPacket({ destination: 'FFFF:FFFFFFFF' })
    assert.equal(b.broadcast, true)
    assert.match(b.note, /none of them answers/)
    assert.equal(rdmPacket({ destination: '4C55:00000001' }).broadcast, false)
  })

  test('RDM packets reject bad command classes and oversized data', () => {
    assert.equal(rdmPacket({ commandClass: 0x99 }), null)
    assert.equal(rdmPacket({ data: new Array(232).fill(0) }), null)
    assert.equal(rdmPacket({ destination: 'nonsense' }), null)
  })
})

describe('MIDI Machine Control', () => {
  test('the shape is F0 7F device 06 command F7', () => {
    assert.equal(mmcCommand(0x02).hex, 'F0 7F 7F 06 02 F7')
    assert.equal(mmcCommand(0x01).hex, 'F0 7F 7F 06 01 F7')
    assert.equal(mmcCommand(0x02).command, 'PLAY')
    assert.equal(mmcCommand(0x01).command, 'STOP')
  })

  test('a device id addresses one machine instead of all of them', () => {
    assert.equal(mmcCommand(0x02, { device: 3 }).hex, 'F0 7F 03 06 02 F7')
    assert.equal(mmcCommand(0x02, { device: 3 }).device, 3)
    assert.equal(mmcCommand(0x02).device, 'all-call (127)')
  })

  test('LOCATE is the one that carries a timecode', () => {
    const l = mmcCommand(0x44, { hours: 1, minutes: 2, seconds: 3, frames: 4, rate: '25' })
    assert.equal(l.hex, 'F0 7F 7F 06 44 06 01 21 02 03 04 00 F7')
    // Hours byte carries the rate in bits 5-6: rate 25 is code 1, so 0x20 | 1.
    assert.equal(l.bytes[7], 0x21)
    assert.deepEqual(l.locate, { h: 1, m: 2, s: 3, f: 4, rate: '25' })
  })

  test('MMC rejects unknown commands and impossible times', () => {
    assert.equal(mmcCommand(0x77), null)
    assert.equal(mmcCommand(0x44, { hours: 24 }), null)
    assert.equal(mmcCommand(0x44, { rate: '23.976' }), null)
    assert.ok(Object.keys(MMC_COMMANDS).length >= 10)
  })
})

describe('MIDI Show Control, built', () => {
  test('cue data is ASCII digits, which is the thing that catches everybody', () => {
    // Cue 12 is 0x31 0x32, not 0x0C.
    const m = mscCommand({ cue: '12', list: '3' })
    assert.equal(m.hex, 'F0 7F 7F 02 01 01 31 32 00 33 00 F7')
    assert.equal(m.format, 'Lighting (General)')
    assert.equal(m.command, 'GO')
  })

  test('what it builds is what the decoder reads — the round trip closes', () => {
    const built = mscCommand({ cue: '12', list: '3' })
    const read = midiDecode(built.hex)
    assert.equal(read.messages.length, 1)
    assert.match(read.messages[0].detail, /GO to Lighting \(General\)/)
    assert.match(read.messages[0].detail, /Cue 12 in list 3/)
  })

  test('trailing empty fields are omitted rather than sent as empty', () => {
    assert.equal(mscCommand({ cue: '5' }).hex, 'F0 7F 7F 02 01 01 35 00 F7')
    // No cue at all: command only.
    assert.equal(mscCommand({ command: 0x02 }).hex, 'F0 7F 7F 02 01 02 F7')
  })

  test('a cue number can carry a decimal point, because it is text', () => {
    const m = mscCommand({ cue: '10.5' })
    assert.match(m.hex, /31 30 2E 35/)
  })

  test('MSC rejects a cue that is not a cue number', () => {
    assert.equal(mscCommand({ cue: 'GO NOW' }), null)
    assert.equal(mscCommand({ device: 200 }), null)
  })
})

describe('sACN packets', () => {
  test('a full universe is 638 bytes, and the three PDU lengths are the published ones', () => {
    const p = sacnPacket(1, new Array(512).fill(0))
    assert.equal(p.length, 638)
    assert.equal(p.rootPduLength, 622)
    assert.equal(p.framingPduLength, 600)
    assert.equal(p.dmpPduLength, 523)
  })

  test('the ACN identifier and the three vectors are fixed', () => {
    const p = sacnPacket(1, [255])
    const b = p.bytes
    assert.equal(new TextDecoder().decode(b.slice(4, 13)), 'ASC-E1.17')
    assert.equal(b[0], 0x00); assert.equal(b[1], 0x10)   // preamble size
    assert.equal(b[21], 0x04)  // VECTOR_ROOT_E131_DATA
    assert.equal(b[43], 0x02)  // VECTOR_E131_DATA_PACKET
    assert.equal(b[117], 0x02) // VECTOR_DMP_SET_PROPERTY
    assert.equal(b[118], 0xa1) // address and data type
  })

  test('each PDU length field carries 0x7 in the top nibble', () => {
    const p = sacnPacket(1, new Array(512).fill(0))
    for (const [offset, expected] of [[16, 622], [38, 600], [115, 523]]) {
      const word = (p.bytes[offset] << 8) | p.bytes[offset + 1]
      assert.equal(word >> 12, 0x7, `flags nibble wrong at byte ${offset}`)
      assert.equal(word & 0x0fff, expected, `length wrong at byte ${offset}`)
    }
  })

  test('the property value count is the slots plus the start code', () => {
    const p = sacnPacket(1, new Array(100).fill(0))
    assert.equal((p.bytes[123] << 8) | p.bytes[124], 101)
    assert.equal(p.bytes[125], 0x00) // DMX start code
    assert.equal(p.length, 226)
  })

  test('the universe drives the multicast group', () => {
    assert.equal(sacnPacket(1, [0]).multicastGroup, '239.255.0.1')
    assert.equal(sacnPacket(256, [0]).multicastGroup, sacnGroup(256))
    assert.equal(sacnPacket(1, [0]).port, 5568)
  })

  test('sACN rejects impossible universes and oversized data', () => {
    assert.equal(sacnPacket(0, []), null)
    assert.equal(sacnPacket(64000, []), null)
    assert.equal(sacnPacket(1, new Array(513).fill(0)), null)
    assert.equal(sacnPacket(1, [0], { priority: 201 }), null)
    assert.equal(sacnPacket(1, [0], { sourceName: 'x'.repeat(64) }), null)
  })
})

// ---------------------------------------------------------------------------
// The analogue layer
// ---------------------------------------------------------------------------

describe('optical media', () => {
  test('the focused spot is diffraction limited, and that is what sets capacity', () => {
    // 1.22 lambda / NA, in nanometres.
    assert.equal(opticalSpot(780, 0.45).spotUm, 2.115)
    assert.equal(opticalSpot(650, 0.60).spotUm, 1.322)
    assert.equal(opticalSpot(405, 0.85).spotUm, 0.581)
  })

  test('a shorter wavelength or a wider aperture both shrink the spot', () => {
    const base = opticalSpot(650, 0.6).spotNm
    assert.ok(opticalSpot(405, 0.6).spotNm < base, 'shorter wavelength should be smaller')
    assert.ok(opticalSpot(650, 0.85).spotNm < base, 'higher NA should be smaller')
  })

  test('density goes with the square, because a disc is a surface', () => {
    const bd = opticalSpot(405, 0.85)
    const vs = bd.compare('cd')
    assert.equal(vs.against, 'CD')
    // CD's spot is 3.64x wider, so 13.2x the area per bit.
    assert.equal(vs.linearRatio, 3.638)
    assert.equal(vs.areaRatio, 13.234)
  })

  test('capacity outruns the optics, and the gap is the coding', () => {
    const g = opticalSpot(780, 0.45).codingGain('cd', 'bluray')
    assert.equal(g.areaRatio, 13.234)
    assert.equal(g.capacityRatio, 35.714)
    // Everything diffraction did not give you: modulation and error coding.
    assert.equal(g.beyondOptics, 2.699)
    assert.ok(g.beyondOptics > 1, 'coding should have contributed something')
  })

  test('the three formats are the same disc with different optics', () => {
    assert.equal(Object.keys(OPTICAL_FORMATS).length, 3)
    // Wavelength falls and NA rises across the generations, both helping.
    assert.ok(OPTICAL_FORMATS.cd.wavelengthNm > OPTICAL_FORMATS.dvd.wavelengthNm)
    assert.ok(OPTICAL_FORMATS.dvd.wavelengthNm > OPTICAL_FORMATS.bluray.wavelengthNm)
    assert.ok(OPTICAL_FORMATS.cd.na < OPTICAL_FORMATS.bluray.na)
  })

  test('optical spot rejects impossible optics', () => {
    assert.equal(opticalSpot(0, 0.5), null)
    assert.equal(opticalSpot(650, 0), null)
    assert.equal(opticalSpot(650, 2), null)
    assert.equal(opticalSpot(650, 0.6).compare('minidisc'), null)
  })
})

describe('RC networks', () => {
  test('the corner frequency is one over two pi R C', () => {
    // 10k and 100n: 159.15 Hz, the figure on every filter chart.
    const f = rcFilter(10000, 100e-9)
    assert.equal(f.cornerHz, 159.155)
    assert.equal(f.tauSeconds, 0.001)
    assert.equal(f.tau, '1 ms')
  })

  test('the same R and C give a time constant and a corner, because they are one fact', () => {
    const f = rcFilter(1000, 1e-6)
    assert.equal(f.tauSeconds, 0.001)
    // tau of 1 ms is always 159 Hz, whatever R and C got you there.
    assert.equal(f.cornerHz, 159.155)
  })

  test('63% in one time constant, 95% in three, 99% in five', () => {
    const f = rcFilter(10000, 100e-6)
    assert.equal(f.tau, '1 s')
    assert.equal(f.riseTo95, '3 s')
    assert.equal(f.riseTo99, '5 s')
  })

  test('one pole is 3 dB down at the corner and 6 dB per octave after it', () => {
    const f = rcFilter(10000, 100e-9)
    assert.ok(Math.abs(f.responseAt(f.cornerHz) + 3.01) < 0.02, 'should be -3 dB at the corner')
    // An octave above the corner is about -7 dB, two octaves about -12.3.
    const oneOctave = f.responseAt(f.cornerHz * 2)
    const twoOctaves = f.responseAt(f.cornerHz * 4)
    assert.ok(Math.abs((twoOctaves - oneOctave) - -6) < 0.7, 'slope should approach 6 dB per octave')
    assert.equal(f.slopeDbPerOctave, 6)
  })

  test('RC rejects impossible components', () => {
    assert.equal(rcFilter(0, 1e-6), null)
    assert.equal(rcFilter(1000, 0), null)
    assert.equal(rcFilter(1000, 1e-6).responseAt(0), null)
  })
})

describe('transformers', () => {
  test('voltage follows the turns ratio and impedance follows its square', () => {
    const t = transformer(10, 1, { primaryVolts: 10, secondaryOhms: 6 })
    assert.equal(t.turnsRatio, 10)
    assert.equal(t.secondaryVolts, 1)
    // 6 ohms through a 10:1 looks like 600 — the square, not the ratio.
    assert.equal(t.reflectedPrimaryOhms, 600)
  })

  test('a step-up transformer is the same maths the other way round', () => {
    const t = transformer(1, 10, { primaryVolts: 10 })
    assert.equal(t.stepsUp, true)
    assert.equal(t.secondaryVolts, 100)
    assert.equal(transformer(10, 1).stepsUp, false)
  })

  test('current goes the opposite way to voltage, because power is conserved', () => {
    const t = transformer(10, 1)
    assert.equal(t.currentRatio, 0.1)
  })

  test('isolation is the other reason one gets fitted', () => {
    assert.equal(transformer(1, 1).isolates, true)
    assert.match(transformer(1, 1).note, /ground loop/)
  })

  test('transformers reject zero turns', () => {
    assert.equal(transformer(0, 1), null)
    assert.equal(transformer(1, -1), null)
  })
})

// ---------------------------------------------------------------------------
// Waveforms and spatial audio
// ---------------------------------------------------------------------------

describe('what a waveform is made of', () => {
  test('a sine has nothing above the fundamental', () => {
    const w = waveHarmonics('sine', 8)
    assert.ok(w.relative.every((a) => a === 0))
    assert.equal(thd(w.relative).thdF, 0)
  })

  test('a square is odd harmonics only, at one over n', () => {
    const w = waveHarmonics('square', 6)
    // Index 0 is the 2nd harmonic, so the odd orders sit at 1, 3, 5.
    assert.deepEqual(w.relative, [0, 0.3333, 0, 0.2, 0, 0.1429])
    assert.equal(w.hasEvenHarmonics, false)
    assert.equal(w.thirdHarmonic, 0.3333)
  })

  test('a sawtooth has every harmonic, which is why it is the bright one', () => {
    const w = waveHarmonics('sawtooth', 4)
    assert.deepEqual(w.relative, [0.5, 0.3333, 0.25, 0.2])
    assert.equal(w.hasEvenHarmonics, true)
  })

  test('a triangle falls away as one over n squared, so it is nearly a sine', () => {
    const w = waveHarmonics('triangle', 4)
    assert.deepEqual(w.relative, [0, 0.1111, 0, 0.04])
    // Third harmonic at a ninth rather than a third: that is the difference.
    assert.equal(w.thirdHarmonic, 1 / 9 === 0.1111111111111111 ? 0.1111 : w.thirdHarmonic)
  })

  test('the shapes feed straight into the harmonic distortion maths', () => {
    // A square wave and a switch-mode supply are the same fact pointed at
    // different jobs, and both put energy on the third harmonic.
    const square = thd(waveHarmonics('square', 40).relative)
    const saw = thd(waveHarmonics('sawtooth', 40).relative)
    assert.ok(square.thdF > 46 && square.thdF < 49, `square THD-F was ${square.thdF}`)
    assert.ok(saw.thdF > 77 && saw.thdF < 81, `saw THD-F was ${saw.thdF}`)
    assert.ok(saw.thdF > square.thdF, 'a saw has more harmonic content than a square')
    // The odd-only shapes are triplen-heavy; that is the neutral problem.
    assert.ok(square.triplenShare > 30)
  })

  test('waveHarmonics rejects unknown shapes', () => {
    assert.equal(waveHarmonics('noise', 8), null)
    assert.equal(waveHarmonics('square', 0), null)
    assert.equal(waveHarmonics('square', 500), null)
    assert.equal(WAVE_SHAPES.length, 4)
  })
})

describe('amplitude panning', () => {
  test('dead centre is equal power, which is -3 dB each and not -6', () => {
    const c = vbapStereo(0)
    assert.equal(c.left, 0.707)
    assert.equal(c.right, 0.707)
    assert.equal(c.leftDb, -3.01)
    assert.equal(c.powerSum, 1)
  })

  test('hard over puts everything in one speaker', () => {
    const r = vbapStereo(30, 30)
    assert.equal(r.right, 1)
    assert.equal(r.left, 0)
    const l = vbapStereo(-30, 30)
    assert.equal(l.left, 1)
    assert.equal(l.right, 0)
  })

  test('power stays constant across the whole sweep', () => {
    for (let a = -30; a <= 30; a += 5) {
      assert.equal(vbapStereo(a, 30).powerSum, 1, `power drifted at ${a} degrees`)
    }
  })

  test('a source cannot be panned outside the pair', () => {
    assert.equal(vbapStereo(45, 30), null)
    assert.equal(vbapStereo(0, 0), null)
    assert.equal(vbapStereo(0, 90), null)
  })
})

describe('distance-based panning', () => {
  const rig = [{ name: 'L', x: -3, y: 0 }, { name: 'R', x: 3, y: 0 }, { name: 'C', x: 0, y: 2 }]

  test('the nearest speaker gets the most, and the power still sums to one', () => {
    const d = dbapGains(0, 0, rig)
    const by = Object.fromEntries(d.gains.map((g) => [g.name, g.gain]))
    assert.ok(by.C > by.L, 'the closer speaker should be louder')
    assert.equal(by.L, by.R, 'symmetry should give equal gains')
    assert.equal(d.powerSum, 1)
  })

  test('the rolloff exponent is the design choice, not physics', () => {
    const tight = dbapGains(0, 0, rig, { rolloff: 4 })
    const spread = dbapGains(0, 0, rig, { rolloff: 0.5 })
    const cOf = (r) => r.gains.find((g) => g.name === 'C').gain
    assert.ok(cOf(tight) > cOf(spread), 'a higher rolloff should localise harder')
    assert.ok(spread.activeSpeakers >= tight.activeSpeakers)
    assert.match(tight.note, /jump audibly/)
    assert.match(spread.note, /survives an audience/)
  })

  test('a source sitting exactly on a speaker does not divide by zero', () => {
    const d = dbapGains(-3, 0, rig)
    assert.equal(d.powerSum, 1)
    assert.ok(d.gains.every((g) => Number.isFinite(g.gain)))
    assert.equal(d.gains.find((g) => g.name === 'L').distance, 0)
  })

  test('DBAP rejects an empty rig or a nonsense position', () => {
    assert.equal(dbapGains(0, 0, []), null)
    assert.equal(dbapGains(NaN, 0, rig), null)
    assert.equal(dbapGains(0, 0, rig, { rolloff: 0 }), null)
    assert.equal(dbapGains(0, 0, [{ x: 'left', y: 0 }]), null)
  })
})

describe('wave field synthesis', () => {
  test('spatial aliasing is Nyquist, in space instead of time', () => {
    // c / 2d. At 250 mm spacing that is 686 Hz.
    assert.equal(wfsAliasing(0.25).aliasingHz, 686)
    assert.equal(wfsAliasing(0.125).aliasingHz, 1372)
    // Halving the spacing doubles the limit. That is the cost sentence.
    assert.equal(wfsAliasing(0.125).aliasingHz, wfsAliasing(0.25).aliasingHz * 2)
  })

  test('it answers the cost question in the other direction too', () => {
    const w = wfsAliasing(0.25)
    assert.equal(w.spacingForHz(4000), 0.043)
    assert.equal(w.speakersPerMetre, 4)
    // 4 kHz needs about 23 loudspeakers a metre, which is the whole story.
    assert.ok(1 / w.spacingForHz(4000) > 20)
  })

  test('the verdict tracks where the limit lands', () => {
    assert.match(wfsAliasing(0.03).verdict, /Above most localisation cues/)
    assert.match(wfsAliasing(0.1).verdict, /Ordinary for a real installation/)
    assert.match(wfsAliasing(0.5).verdict, /bottom of the spectrum/)
  })

  test('WFS rejects impossible arrays', () => {
    assert.equal(wfsAliasing(0), null)
    assert.equal(wfsAliasing(-1), null)
    assert.equal(wfsAliasing(0.25, { speedOfSound: 0 }), null)
    assert.equal(wfsAliasing(0.25).spacingForHz(0), null)
  })
})

// ---------------------------------------------------------------------------
// Making two things talk
// ---------------------------------------------------------------------------

describe('interop paths and bridges', () => {
  // A small fixture in the compact shape the interop page builds.
  const console_ = { i: 'desk', n: 'Lighting desk', k: 'hardware', s: [{ p: 'sacn', d: 'out' }, { p: 'artnet', d: 'out' }] }
  const fixture = { i: 'fix', n: 'Moving head', k: 'hardware', s: [{ p: 'dmx512', d: 'in' }] }
  const gateway = { i: 'gw', n: 'Two-port gateway', k: 'hardware', s: [{ p: 'sacn', d: 'in' }, { p: 'dmx512', d: 'out' }] }
  const bigDesk = { i: 'big', n: 'Very large console', k: 'hardware',
    s: [{ p: 'sacn', d: 'bidirectional' }, { p: 'dmx512', d: 'out' }, { p: 'osc', d: 'bidirectional' },
      { p: 'midi', d: 'in' }, { p: 'artnet', d: 'out' }, { p: 'ltc', d: 'in' }] }
  const repeater = { i: 'rep', n: 'sACN repeater', k: 'hardware', s: [{ p: 'sacn', d: 'bidirectional' }] }
  const catalogue = [console_, fixture, gateway, bigDesk, repeater]

  test('a direct path needs a shared protocol pointing the right way', () => {
    assert.deepEqual(directPaths(console_, fixture), [])
    const p = directPaths(console_, gateway)
    assert.equal(p.length, 1)
    assert.equal(p[0].protocol, 'sacn')
    // Direction matters: the fixture receives, so it cannot send back.
    assert.deepEqual(directPaths(fixture, console_), [])
  })

  test('bidirectional counts as both, which is the point of it', () => {
    assert.equal(directPaths(bigDesk, repeater).length, 1)
    assert.equal(directPaths(repeater, bigDesk).length, 1)
  })

  test('it names the box, which is the part the interop page only hinted at', () => {
    const r = findBridges(console_, fixture, catalogue)
    assert.equal(r.needsBridge, true)
    assert.ok(r.bridges.length >= 1)
    const names = r.bridges.map((b) => b.id)
    assert.ok(names.includes('gw'), 'the gateway should be offered')
    const gw = r.bridges.find((b) => b.id === 'gw')
    assert.deepEqual(gw.takes, ['sacn'])
    assert.deepEqual(gw.gives, ['dmx512'])
    assert.equal(gw.converts, true)
  })

  test('a purpose-built converter beats a console that happens to speak both', () => {
    const r = findBridges(console_, fixture, catalogue)
    // Both the gateway and the big desk can do it; the narrow one ranks first.
    assert.equal(r.bridges[0].id, 'gw')
    assert.ok(r.bridges.find((b) => b.id === 'big'), 'the big desk is still offered')
    assert.ok(r.bridges[0].breadth < r.bridges.find((b) => b.id === 'big').breadth)
  })

  test('a repeater is not a bridge, and is marked as not converting', () => {
    const r = findBridges(console_, repeater, catalogue)
    // These already share sACN, so no bridge is required at all.
    assert.equal(r.needsBridge, false)
    assert.match(r.note, /a choice rather than a requirement/)
  })

  test('an empty result is a gap in the index, and says so', () => {
    const orphan = { i: 'odd', n: 'Odd box', s: [{ p: 'nothing-else-speaks-this', d: 'in' }] }
    const r = findBridges(console_, orphan, catalogue)
    assert.equal(r.bridges.length, 0)
    assert.match(r.note, /gap in the index rather than a statement/)
  })

  test('a chain is only as good as its worst joint', () => {
    const good = checkChain([console_, gateway, fixture], catalogue)
    assert.equal(good.ok, true)
    assert.equal(good.hops.length, 2)
    assert.deepEqual(good.hops[0].protocols, ['sacn'])
    assert.deepEqual(good.hops[1].protocols, ['dmx512'])
  })

  test('a broken chain names the first break and suggests a fix for it', () => {
    const bad = checkChain([console_, fixture, repeater], catalogue)
    assert.equal(bad.ok, false)
    assert.equal(bad.firstBreak, 0)
    assert.equal(bad.brokenCount, 2)
    assert.ok(bad.hops[0].bridges.length >= 1, 'the broken hop should carry a suggestion')
    assert.equal(bad.hops[0].bridges[0].id, 'gw')
  })

  test('chains and bridges reject nonsense', () => {
    assert.equal(checkChain([console_]), null)
    assert.equal(checkChain('not an array'), null)
    assert.equal(findBridges(console_, fixture, 'not an array'), null)
    assert.equal(findBridges(null, fixture, catalogue), null)
    assert.equal(directPaths(console_, { i: 'x', n: 'x' }), null)
  })
})

// ---------------------------------------------------------------------------
// Vision and hearing, as numbers
// ---------------------------------------------------------------------------

describe('visual acuity', () => {
  test('one arcminute is the whole basis of every viewing-distance rule', () => {
    // At 10 m, one arcminute subtends 2.909 mm.
    assert.equal(visualAcuity(10).detailMm, 2.909)
    // And it scales linearly with distance, because it is an angle.
    assert.equal(visualAcuity(20).detailMm, visualAcuity(10).detailMm * 2)
    assert.ok(Math.abs(ARCMIN_PER_RADIAN - 3437.75) < 0.01)
  })

  test('it gives the real retina distance for a pixel pitch', () => {
    const a = visualAcuity(10)
    // About 3.44 m per millimetre of pitch.
    assert.equal(a.retinaDistanceFor(3.9), 13.407)
    assert.equal(a.retinaDistanceFor(2.6), 8.938)
    // Which is far further than the "pitch in mm = metres" rule of thumb,
    // and that gap is the difference between invisible and merely acceptable.
    assert.ok(a.retinaDistanceFor(3.9) > 3.9 * 3)
  })

  test('it answers the question from the seat as well as from the wall', () => {
    const close = visualAcuity(4)
    assert.equal(close.pitchVisible(3.9), true, 'a 3.9 mm pitch is visible from 4 m')
    const far = visualAcuity(20)
    assert.equal(far.pitchVisible(3.9), false, 'and invisible from 20 m')
  })

  test('legible text is several times the acuity limit, not equal to it', () => {
    const a = visualAcuity(10)
    assert.equal(a.legibleTextMm, 14.544)
    assert.ok(a.legibleTextMm > a.detailMm * 4)
  })

  test('a sharper eye moves every one of those numbers', () => {
    const sharp = visualAcuity(10, { arcminutes: 0.5 })
    assert.ok(sharp.detailMm < visualAcuity(10).detailMm)
    assert.ok(sharp.retinaDistanceFor(3.9) > visualAcuity(10).retinaDistanceFor(3.9))
    assert.match(visualAcuity(10).note, /norm rather than a maximum/)
  })

  test('acuity rejects impossible input', () => {
    assert.equal(visualAcuity(0), null)
    assert.equal(visualAcuity(-5), null)
    assert.equal(visualAcuity(10, { arcminutes: 0 }), null)
    assert.equal(visualAcuity(10).retinaDistanceFor(0), null)
  })
})

describe('interaural time difference', () => {
  test('straight ahead is zero and ninety degrees is the maximum', () => {
    assert.equal(interauralDelay(0).itdMicroseconds, 0)
    // Woodworth gives about 660 microseconds at 90 degrees for a normal head.
    assert.equal(interauralDelay(90).itdMicroseconds, 655.8)
    assert.equal(interauralDelay(90).itdMicroseconds, interauralDelay(0).maxItdMicroseconds)
  })

  test('the whole mechanism lives inside about thirty samples at 48 kHz', () => {
    assert.equal(interauralDelay(90).itdSamplesAt48k, 31.5)
    // Which is why a delay error of a fraction of a millisecond moves an image.
    assert.ok(interauralDelay(15).itdMicroseconds < 150)
  })

  test('the cone of confusion falls straight out of the geometry', () => {
    // 135 degrees gives the same delay as 45, which IS the front-back confusion.
    assert.equal(interauralDelay(135).itdMicroseconds, interauralDelay(45).itdMicroseconds)
    assert.equal(interauralDelay(135).frontBackAmbiguous, true)
    assert.equal(interauralDelay(45).frontBackAmbiguous, false)
    assert.match(interauralDelay(135).coneOfConfusion, /turning your head/)
    assert.equal(interauralDelay(45).coneOfConfusion, null)
  })

  test('above the ambiguity frequency the system switches to level', () => {
    // c / 4a for a normal head is about 980 Hz.
    assert.equal(interauralDelay(0).phaseAmbiguityHz, 980)
    // A bigger head pushes it lower, which is the physics and not a metaphor.
    assert.ok(interauralDelay(0, { headRadiusM: 0.12 }).phaseAmbiguityHz < 980)
  })

  test('the delay is symmetric left and right', () => {
    assert.equal(interauralDelay(-45).itdMicroseconds, interauralDelay(45).itdMicroseconds)
  })

  test('ITD rejects angles that are not angles', () => {
    assert.equal(interauralDelay(200), null)
    assert.equal(interauralDelay(0, { headRadiusM: 0 }), null)
    assert.equal(interauralDelay(0, { speedOfSound: -1 }), null)
  })
})
