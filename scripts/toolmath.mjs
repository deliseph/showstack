/**
 * The arithmetic behind /tools/ — kept separate from the page template so the
 * same functions can be unit tested in Node and embedded verbatim into the
 * page script. The embedding uses Function.prototype.toString, so these
 * functions must stay self-contained: no closures over module state, no
 * imports used inside the bodies.
 *
 * Every formula here is the kind a technician does in their head at load-in
 * until the day they get it wrong. The point of writing them down as code is
 * the same as the rest of showstack: checked once, cited, reusable.
 */

/**
 * sACN universe (1-63999) -> its E1.31 multicast group.
 * ANSI E1.31 puts the universe number in the low two octets of 239.255.0.0/16.
 */
export function sacnMulticast(universe) {
  const u = Number(universe)
  if (!Number.isInteger(u) || u < 1 || u > 63999) return null
  return `239.255.${(u >> 8) & 0xff}.${u & 0xff}`
}

/**
 * Art-Net 15-bit port-address <-> the Net / Sub-Net / Universe triplet
 * consoles display. Art-Net 4: 7-bit Net, 4-bit Sub-Net, 4-bit Universe.
 */
export function artnetCompose(net, subnet, universe) {
  const n = Number(net), s = Number(subnet), u = Number(universe)
  if (![n, s, u].every(Number.isInteger)) return null
  if (n < 0 || n > 127 || s < 0 || s > 15 || u < 0 || u > 15) return null
  return (n << 8) | (s << 4) | u
}

export function artnetSplit(portAddress) {
  const p = Number(portAddress)
  if (!Number.isInteger(p) || p < 0 || p > 32767) return null
  return { net: (p >> 8) & 0x7f, subnet: (p >> 4) & 0x0f, universe: p & 0x0f }
}

/**
 * DMX slot (universe, address 1-512) <-> absolute channel number across
 * universes, the arithmetic behind every patch sheet.
 */
export function dmxAbsolute(universe, address) {
  const u = Number(universe), a = Number(address)
  if (!Number.isInteger(u) || !Number.isInteger(a) || u < 1 || a < 1 || a > 512) return null
  return (u - 1) * 512 + a
}

export function dmxFromAbsolute(absolute) {
  const n = Number(absolute)
  if (!Number.isInteger(n) || n < 1) return null
  return { universe: Math.floor((n - 1) / 512) + 1, address: ((n - 1) % 512) + 1 }
}

/**
 * DMX start address -> 9-way DIP switch positions.
 *
 * The near-universal convention is plain binary of the address itself
 * (switch 1 = value 1 ... switch 9 = value 256), so address 1 is switch 1 ON.
 * A minority of older fixtures used binary of (address - 1); the page says so
 * rather than pretending the convention is universal, because setting 274
 * one-off is exactly the mistake this tool exists to prevent.
 *
 * Returns switches as an array of 9 booleans, switch 1 first.
 */
export function dipSwitches(address, minusOne = false) {
  const a = Number(address)
  if (!Number.isInteger(a) || a < 1 || a > 512) return null
  let v = minusOne ? a - 1 : a
  if (v > 511) return null // address 512 in plain-binary needs a 10th switch; report honestly
  const out = []
  for (let i = 0; i < 9; i++) out.push(Boolean((v >> i) & 1))
  return out
}

export function dipToAddress(switches, minusOne = false) {
  if (!Array.isArray(switches) || switches.length !== 9) return null
  let v = 0
  for (let i = 0; i < 9; i++) if (switches[i]) v |= 1 << i
  const a = minusOne ? v + 1 : v
  return a >= 1 && a <= 512 ? a : null
}

/**
 * Speaker delay: distance -> milliseconds, with the speed of sound corrected
 * for air temperature (c = 331.3 + 0.606 * T in metres per second).
 * Returns ms and the samples that delay represents at common rates, since
 * consoles take one or the other.
 */
export function speakerDelay(distanceMeters, tempC = 20) {
  const d = Number(distanceMeters), t = Number(tempC)
  if (!Number.isFinite(d) || d < 0 || !Number.isFinite(t)) return null
  const c = 331.3 + 0.606 * t
  const ms = (d / c) * 1000
  return {
    ms: Math.round(ms * 100) / 100,
    speedOfSound: Math.round(c * 10) / 10,
    samples48k: Math.round((ms / 1000) * 48000),
    samples96k: Math.round((ms / 1000) * 96000),
  }
}

/**
 * Timecode <-> frame count.
 *
 * Non-drop rates are plain multiplication. 29.97 drop-frame is the one
 * everybody gets wrong: frame numbers 0 and 1 are skipped at the start of
 * every minute EXCEPT minutes divisible by 10. The skipped numbers are label
 * gaps, not lost time — the arithmetic below is the standard SMPTE 12M
 * formulation.
 *
 * rate is one of: '23.976', '24', '25', '29.97df', '29.97ndf', '30'.
 * For frame counting purposes 23.976 counts like 24 and 29.97ndf like 30;
 * the fractional rates matter for wall-clock drift, not for labelling.
 */
export function tcToFrames(h, m, s, f, rate) {
  const H = Number(h), M = Number(m), S = Number(s), F = Number(f)
  if (![H, M, S, F].every(Number.isInteger)) return null
  if (H < 0 || M < 0 || M > 59 || S < 0 || S > 59 || F < 0) return null
  const nominal = { '23.976': 24, '24': 24, '25': 25, '29.97df': 30, '29.97ndf': 30, '30': 30 }[rate]
  if (!nominal || F >= nominal) return null

  if (rate === '29.97df') {
    // Frames 00 and 01 do not exist at the start of a non-tenth minute.
    if (S === 0 && F < 2 && M % 10 !== 0) return null
    const totalMinutes = H * 60 + M
    const dropped = 2 * (totalMinutes - Math.floor(totalMinutes / 10))
    return H * 108000 + M * 1800 + S * 30 + F - dropped
  }
  return ((H * 60 + M) * 60 + S) * nominal + F
}

/**
 * Electrical load: total fixture watts -> amps on the feed.
 * Single phase: A = W / (V x PF). Three phase: A = W / (sqrt(3) x V_LL x PF),
 * V_LL being line-to-line (208 in North America, 400 in Europe).
 * PF defaults to 1.0; moving lights and LED fixtures with poor power factor
 * draw more current than the wattage suggests, which is why the field exists.
 */
export function powerLoad(watts, volts, phase = 1, pf = 1) {
  const w = Number(watts), v = Number(volts), p = Number(phase), f = Number(pf)
  if (!Number.isFinite(w) || w < 0 || !Number.isFinite(v) || v <= 0) return null
  if (!(p === 1 || p === 3) || !Number.isFinite(f) || f <= 0 || f > 1) return null
  const amps = p === 3 ? w / (Math.sqrt(3) * v * f) : w / (v * f)
  return { amps: Math.round(amps * 100) / 100 }
}

/**
 * Photometrics: beam angle and throw -> beam diameter (d = 2 t tan(theta/2)),
 * and candela at throw -> illuminance by the inverse square law (E = I / d^2).
 * Works for the field angle too; the caller picks which angle they enter.
 */
export function beamDiameter(throwMeters, angleDeg) {
  const t = Number(throwMeters), a = Number(angleDeg)
  if (!Number.isFinite(t) || t < 0 || !Number.isFinite(a) || a <= 0 || a >= 180) return null
  const d = 2 * t * Math.tan((a * Math.PI / 180) / 2)
  return { diameter: Math.round(d * 100) / 100 }
}

export function illuminance(candela, throwMeters) {
  const i = Number(candela), t = Number(throwMeters)
  if (!Number.isFinite(i) || i < 0 || !Number.isFinite(t) || t <= 0) return null
  const lux = i / (t * t)
  return { lux: Math.round(lux * 10) / 10, footcandles: Math.round(lux * 0.09290304 * 10) / 10 }
}

/**
 * LED wall: physical size and pixel pitch -> resolution.
 * minViewMeters is the common rule of thumb (1 m of distance per 1 mm of
 * pitch) and is labelled as a rule of thumb, not a spec.
 */
export function ledWall(widthMeters, heightMeters, pitchMm) {
  const w = Number(widthMeters), h = Number(heightMeters), p = Number(pitchMm)
  if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(h) || h <= 0 || !Number.isFinite(p) || p <= 0) return null
  const pxW = Math.round((w * 1000) / p)
  const pxH = Math.round((h * 1000) / p)
  return { pxW, pxH, totalPx: pxW * pxH, minViewMeters: Math.round(p * 10) / 10 }
}

/**
 * RF: frequency -> free-space wavelength, plus practical half- and
 * quarter-wave antenna lengths with the standard ~5% end-effect shortening
 * (the 468/f_MHz feet rule for a half-wave element).
 */
export function rfWavelength(mhz) {
  const f = Number(mhz)
  if (!Number.isFinite(f) || f <= 0) return null
  const lambda = 299.792458 / f
  const r3 = (x) => Math.round(x * 1000) / 1000
  return {
    wavelength: r3(lambda),
    halfWave: r3(lambda / 2 * 0.95),
    quarterWave: r3(lambda / 4 * 0.95),
    quarterWaveInches: Math.round(lambda / 4 * 0.95 * 39.3701 * 10) / 10,
  }
}

export function framesToTc(frames, rate) {
  let n = Number(frames)
  if (!Number.isInteger(n) || n < 0) return null
  const nominal = { '23.976': 24, '24': 24, '25': 25, '29.97df': 30, '29.97ndf': 30, '30': 30 }[rate]
  if (!nominal) return null

  if (rate === '29.97df') {
    // Invert the drop: 17982 frames per 10-minute block (1800*10 - 2*9).
    const perTen = 17982
    const tens = Math.floor(n / perTen)
    let rem = n % perTen
    // First minute of the block has 1800 frames, the other nine have 1798.
    let minutesInBlock
    if (rem < 1800) {
      minutesInBlock = 0
    } else {
      minutesInBlock = 1 + Math.floor((rem - 1800) / 1798)
      rem = (rem - 1800) % 1798
      rem += 2 // re-add the two dropped labels for display arithmetic
    }
    const totalMinutes = tens * 10 + minutesInBlock
    const H = Math.floor(totalMinutes / 60)
    const M = totalMinutes % 60
    const S = Math.floor(rem / 30)
    const F = rem % 30
    return { h: H, m: M, s: S, f: F }
  }
  const S = Math.floor(n / nominal)
  return { h: Math.floor(S / 3600), m: Math.floor(S / 60) % 60, s: S % 60, f: n % nominal }
}

/**
 * dBu <-> dBV: the two voltage-reference scales used for line-level audio.
 * 0 dBu = 0.775 V RMS (the "unloaded" successor to 600-ohm-referenced dBm —
 * a voltage ratio only, no load impedance implied). 0 dBV = 1 V RMS, the
 * simpler round-number reference common on consumer/semi-pro gear. The
 * offset between them is fixed and independent of level: 20*log10(1/0.775).
 */
export function dbuToDbv(dbu) {
  const n = Number(dbu)
  if (!Number.isFinite(n)) return null
  return Math.round((n - 2.21309) * 100) / 100
}

export function dbvToDbu(dbv) {
  const n = Number(dbv)
  if (!Number.isFinite(n)) return null
  return Math.round((n + 2.21309) * 100) / 100
}

/**
 * Ohm's law / power solver: give any two of volts, amps, ohms, watts and the
 * other two follow (DC or resistive AC, which is the field-normal use).
 * Returns null unless exactly two values are provided.
 */
export function ohmsLaw({ v, i, r, p } = {}) {
  const has = (x) => x !== undefined && x !== null && x !== '' && Number.isFinite(Number(x))
  const given = [has(v), has(i), has(r), has(p)].filter(Boolean).length
  if (given !== 2) return null
  let V = has(v) ? Number(v) : null, I = has(i) ? Number(i) : null
  let R = has(r) ? Number(r) : null, P = has(p) ? Number(p) : null
  if ((R !== null && R <= 0) || (V !== null && V < 0) || (I !== null && I < 0) || (P !== null && P < 0)) return null
  if (V !== null && I !== null) { R = I === 0 ? null : V / I; P = V * I }
  else if (V !== null && R !== null) { I = V / R; P = V * I }
  else if (V !== null && P !== null) { I = V === 0 ? null : P / V; R = I ? V / I : null }
  else if (I !== null && R !== null) { V = I * R; P = V * I }
  else if (I !== null && P !== null) { V = I === 0 ? null : P / I; R = I === 0 ? null : V / I }
  else if (R !== null && P !== null) { V = Math.sqrt(P * R); I = V / R }
  const r2 = (x) => (x === null || !Number.isFinite(x)) ? null : Math.round(x * 100) / 100
  return { volts: r2(V), amps: r2(I), ohms: r2(R), watts: r2(P) }
}

/**
 * Loudspeaker load: total impedance of drivers wired in parallel or series,
 * plus how amplifier power divides among them. In parallel every box sees the
 * same voltage, so the lower-impedance box takes MORE of the power; in series
 * they share one current, so power follows impedance instead.
 */
export function speakerImpedance(ohms, wiring = 'parallel', ampWatts = null) {
  if (!Array.isArray(ohms) || ohms.length === 0) return null
  const zs = ohms.map(Number)
  if (!zs.every((z) => Number.isFinite(z) && z > 0)) return null
  let total
  if (wiring === 'series') total = zs.reduce((a, b) => a + b, 0)
  else if (wiring === 'parallel') total = 1 / zs.reduce((a, z) => a + 1 / z, 0)
  else return null
  const r2 = (x) => Math.round(x * 100) / 100
  const out = { total: r2(total), count: zs.length }
  const w = Number(ampWatts)
  if (Number.isFinite(w) && w > 0) {
    const sumInv = zs.reduce((a, z) => a + 1 / z, 0)
    out.share = wiring === 'parallel'
      ? zs.map((z) => r2(w * (1 / z) / sumInv))
      : zs.map((z) => r2(w * z / total))
  }
  return out
}

/**
 * Latency budget: sum the stage delays in a signal chain and convert to the
 * units a tech aligns with — samples at common rates, and the distance sound
 * covers in that time (what a DSP hop costs you against the PA).
 */
export function processingDelay(stagesMs) {
  if (!Array.isArray(stagesMs) || stagesMs.length === 0) return null
  const ms = stagesMs.map(Number)
  if (!ms.every((x) => Number.isFinite(x) && x >= 0)) return null
  const total = ms.reduce((a, b) => a + b, 0)
  const r2 = (x) => Math.round(x * 100) / 100
  return {
    totalMs: r2(total),
    samples48k: Math.round(total * 48),
    samples96k: Math.round(total * 96),
    meters: r2(total / 1000 * 343.4),
    feet: r2(total / 1000 * 343.4 * 3.28084),
  }
}

/**
 * Mixed speaker wiring. Real cabinets are rarely all-parallel or all-series:
 * the classic four-box rig is two series pairs paralleled. The notation here
 * is how techs say it out loud: "+" wires boxes in series inside a group,
 * "," (or "||") puts groups in parallel. So "8+8, 8+8" is two series pairs
 * in parallel: 8 ohms total.
 *
 * Power maths: parallel groups share the amplifier voltage, so a group takes
 * power in proportion to 1/Z_group; inside a series group one current flows,
 * so each box takes its share in proportion to its own impedance.
 */
export function speakerNetwork(notation, ampWatts = null) {
  const groups = String(notation ?? '')
    .split(/,|\|\|/)
    .map((g) => g.trim())
    .filter(Boolean)
    .map((g) => g.split('+').map((z) => Number(z.trim())))
  if (!groups.length) return null
  for (const zs of groups) {
    if (!zs.length || !zs.every((z) => Number.isFinite(z) && z > 0)) return null
  }
  const r2 = (x) => Math.round(x * 100) / 100
  const parsed = groups.map((zs) => ({ zs, z: zs.reduce((a, b) => a + b, 0) }))
  const total = 1 / parsed.reduce((a, g) => a + 1 / g.z, 0)
  const out = {
    total: r2(total),
    boxes: groups.reduce((n, g) => n + g.length, 0),
    groups: parsed.map((g) => ({ zs: g.zs, z: r2(g.z) })),
  }
  const w = Number(ampWatts)
  if (Number.isFinite(w) && w > 0) {
    const sumInv = parsed.reduce((a, g) => a + 1 / g.z, 0)
    out.groups = parsed.map((g) => {
      const gw = w * (1 / g.z) / sumInv
      return { zs: g.zs, z: r2(g.z), watts: r2(gw), perBox: g.zs.map((z) => r2(gw * z / g.z)) }
    })
  }
  return out
}

/**
 * Projector throw: ratio = distance / image width. Give any two, the third
 * follows. Lens specs quote a ratio range; installers need the distance.
 */
export function throwRatio({ distance = null, width = null, ratio = null } = {}) {
  const num = (x) => (x === null || x === '' ? null : Number(x))
  const d = num(distance), w = num(width), r = num(ratio)
  const ok = (x) => x === null || (Number.isFinite(x) && x > 0)
  if (!ok(d) || !ok(w) || !ok(r)) return null
  const known = [d, w, r].filter((x) => x !== null).length
  if (known < 2) return null
  const r2 = (x) => Math.round(x * 100) / 100
  if (d !== null && w !== null) return { distance: r2(d), width: r2(w), ratio: r2(d / w) }
  if (r !== null && w !== null) return { distance: r2(r * w), width: r2(w), ratio: r2(r) }
  return { distance: r2(d), width: r2(d / r), ratio: r2(r) }
}

/**
 * What the audience actually sees off a projection screen.
 *
 * Incident light: lux = lumens / area(m2). Reflected luminance on a screen of
 * gain g, in foot-lamberts: fL = lumens x gain / area(ft2), and
 * 1 fL = 3.4263 cd/m2 (nits). Cinema reference white is 48 cd/m2 (14 fL)
 * per the DCI spec; gain redistributes light toward the axis, it does not
 * create it, which is why high-gain screens fall off when viewed from the side.
 */
export function screenLuminance(lumens, widthM, heightM, gain = 1) {
  const lm = Number(lumens), w = Number(widthM), h = Number(heightM), g = Number(gain)
  if (![lm, w, h, g].every((x) => Number.isFinite(x) && x > 0)) return null
  const areaM2 = w * h
  const areaFt2 = areaM2 * 10.7639
  const fl = (lm * g) / areaFt2
  const nits = fl * 3.4263
  const lux = lm / areaM2
  const r1 = (x) => Math.round(x * 10) / 10
  return { areaM2: r1(areaM2), lux: r1(lux), fl: r1(fl), nits: r1(nits) }
}

/**
 * Relay / interlock logic as a truth table.
 *
 * Rules are lines like "MAIN = GO & !ESTOP". Operators: & | ! and
 * parentheses; anything named on the right is an input, anything on the left
 * is an output. Every input combination is evaluated, so the matrix shows
 * exactly what closes when - the way you check an interlock chain on paper
 * before you wire it. Outputs may not feed back into expressions: this table
 * is combinational on purpose, latching belongs in the controller.
 */
export function relayLogic(rulesText) {
  const lines = String(rulesText ?? '').split(/[\n;]/).map((l) => l.trim()).filter(Boolean)
  if (!lines.length || lines.length > 6) return null
  const inputs = new Set()
  const parsed = []
  for (const line of lines) {
    const m = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/)
    if (!m) return null
    const tokens = m[2].match(/[A-Za-z][A-Za-z0-9_]*|\S/g) ?? []
    if (tokens.some((t) => !/^([A-Za-z][A-Za-z0-9_]*|[&|!()])$/.test(t))) return null
    for (const t of tokens) if (/^[A-Za-z]/.test(t)) inputs.add(t)
    parsed.push({ out: m[1], tokens })
  }
  const outNames = parsed.map((p) => p.out)
  if (new Set(outNames).size !== outNames.length) return null
  for (const o of outNames) if (inputs.has(o)) return null
  const ins = [...inputs].sort()
  if (!ins.length || ins.length > 5) return null

  function evaluate(tokens, env) {
    let i = 0
    function factor() {
      const t = tokens[i]
      if (t === '!') { i++; return !factor() }
      if (t === '(') { i++; const v = orExpr(); if (tokens[i] !== ')') throw 0; i++; return v }
      if (t !== undefined && /^[A-Za-z]/.test(t)) { i++; return env[t] }
      throw 0
    }
    function andExpr() { let v = factor(); while (tokens[i] === '&') { i++; const r = factor(); v = v && r } return v }
    function orExpr() { let v = andExpr(); while (tokens[i] === '|') { i++; const r = andExpr(); v = v || r } return v }
    const v = orExpr()
    if (i !== tokens.length) throw 0
    return v
  }

  const rows = []
  try {
    for (let mask = 0; mask < (1 << ins.length); mask++) {
      const env = {}
      ins.forEach((name, k) => { env[name] = Boolean(mask & (1 << (ins.length - 1 - k))) })
      rows.push({ in: ins.map((n) => env[n]), out: parsed.map((p) => evaluate(p.tokens, env)) })
    }
  } catch { return null }
  return { inputs: ins, outputs: outNames, rows }
}

/**
 * Bridle geometry: a symmetric two-leg bridle carrying a load.
 *
 * Tension per leg is W / (2 cos theta), where theta is each leg's angle from
 * vertical. That is the whole safety story in one formula: at 0 degrees each
 * leg takes half the load, at 60 degrees each leg takes the WHOLE load, and
 * past that it climbs without limit. Riggers usually talk in the included
 * angle between the legs, which is 2 theta, so both are returned.
 *
 * The horizontal component is returned too, because that is the force trying
 * to pull the two structural points toward each other, and it is the part
 * people forget when they bridle off two beams that were never designed to
 * be pushed sideways.
 */
export function bridleTension(loadKg, legAngleDeg) {
  const w = Number(loadKg), a = Number(legAngleDeg)
  if (!Number.isFinite(w) || w < 0) return null
  // 90 degrees from vertical is a horizontal leg: cos is 0 and tension is
  // infinite. Stop short of it rather than returning Infinity.
  if (!Number.isFinite(a) || a < 0 || a >= 89) return null
  const rad = (a * Math.PI) / 180
  const perLeg = w / (2 * Math.cos(rad))
  const r2 = (x) => Math.round(x * 100) / 100
  return {
    perLegKg: r2(perLeg),
    // Multiplier against the naive "half each" assumption people start from.
    multiplier: r2(perLeg / (w / 2 || 1)),
    includedAngle: r2(a * 2),
    horizontalKg: r2(perLeg * Math.sin(rad)),
    verticalKg: r2(perLeg * Math.cos(rad)),
  }
}

/**
 * Voltage drop on a run of cable.
 *
 * Vdrop = k * I * L * rho / A, where L is the ONE-WAY length, A the conductor
 * cross-section in mm^2, rho the resistivity in ohm mm^2/m, and k accounts for
 * the return path: 2 for single phase (out and back), sqrt(3) for a balanced
 * three-phase line-to-line drop.
 *
 * Resistivity is quoted at 20 C. Real cable on a hot dimmer run is warmer and
 * therefore worse, so this is the optimistic figure, which is the right way
 * round for a limit check.
 */
export function voltageDrop(amps, lengthM, csaMm2, volts, phase = 1, material = 'copper') {
  const i = Number(amps), l = Number(lengthM), a = Number(csaMm2), v = Number(volts)
  const p = Number(phase)
  if (!Number.isFinite(i) || i < 0 || !Number.isFinite(l) || l < 0) return null
  if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(v) || v <= 0) return null
  if (!(p === 1 || p === 3)) return null
  const rho = material === 'aluminium' ? 0.0282 : 0.0172
  const k = p === 3 ? Math.sqrt(3) : 2
  const drop = (k * i * l * rho) / a
  const pct = (drop / v) * 100
  const r2 = (x) => Math.round(x * 100) / 100
  return {
    dropVolts: r2(drop),
    dropPercent: r2(pct),
    voltsAtLoad: r2(v - drop),
    // 3% is the usual limit for a lighting circuit, 5% for power. Both are
    // conventions from installation practice, not a single global rule.
    withinLighting: pct <= 3,
    withinPower: pct <= 5,
  }
}

/**
 * Three-phase load balance.
 *
 * For linear loads at unity power factor the neutral current of a
 * three-phase four-wire supply is
 *   In = sqrt(I1^2 + I2^2 + I3^2 - I1*I2 - I2*I3 - I3*I1)
 * which is zero when the three legs are equal, and equals the leg current
 * when only one leg is loaded.
 *
 * Imbalance is reported against the mean, the way a distro sheet reports it.
 * The neutral figure is a LINEAR-load figure: switch-mode supplies and LED
 * drivers inject triplen harmonics that add in the neutral, so a rig full of
 * them can exceed this even when the legs look balanced.
 */
export function phaseBalance(l1, l2, l3) {
  const a = Number(l1), b = Number(l2), c = Number(l3)
  if (![a, b, c].every((x) => Number.isFinite(x) && x >= 0)) return null
  const sq = a * a + b * b + c * c - a * b - b * c - c * a
  const neutral = Math.sqrt(Math.max(0, sq))
  const mean = (a + b + c) / 3
  const max = Math.max(a, b, c)
  const min = Math.min(a, b, c)
  const r2 = (x) => Math.round(x * 100) / 100
  return {
    neutralAmps: r2(neutral),
    meanAmps: r2(mean),
    maxAmps: r2(max),
    minAmps: r2(min),
    imbalancePercent: mean > 0 ? r2(((max - min) / mean) * 100) : 0,
    // A distro is sized by its worst leg, never by the total divided by three.
    worstLeg: max === a ? 'L1' : max === b ? 'L2' : 'L3',
  }
}

/**
 * Noise exposure dose.
 *
 * Permitted time at a level is T = T_criterion * 2^((Lc - L)/q), where q is
 * the exchange rate: 3 dB in the EU and in most of the world, 5 dB under the
 * US OSHA general-industry rule. Dose is the fraction of that time used.
 *
 * The criterion level and exchange rate are both arguments because they are
 * jurisdictional, not physical: EU 2003/10/EC works to 85 dB(A) with a 3 dB
 * exchange, OSHA 1910.95 to 90 dB(A) with a 5 dB exchange, and getting the
 * pair wrong changes the answer by hours.
 */
export function noiseDose(laeq, hours, criterion = 85, exchangeRate = 3, criterionHours = 8) {
  const l = Number(laeq), h = Number(hours), c = Number(criterion)
  const q = Number(exchangeRate), ch = Number(criterionHours)
  if (!Number.isFinite(l) || !Number.isFinite(h) || h < 0) return null
  if (!Number.isFinite(c) || !Number.isFinite(q) || q <= 0 || !Number.isFinite(ch) || ch <= 0) return null
  const permittedHours = ch * Math.pow(2, (c - l) / q)
  const dose = permittedHours > 0 ? (h / permittedHours) * 100 : Infinity
  const r2 = (x) => Math.round(x * 100) / 100
  return {
    permittedHours: r2(permittedHours),
    permittedMinutes: Math.round(permittedHours * 60),
    dosePercent: r2(dose),
    overExposed: dose > 100,
    // The level that would put exactly this duration at 100% of the dose.
    levelForDuration: h > 0 ? r2(c - q * (Math.log(h / ch) / Math.log(2))) : null,
  }
}

/**
 * Third-order intermodulation between wireless channels.
 *
 * Two transmitters at a and b produce products at 2a - b and 2b - a; three
 * produce a + b - c and its permutations. Third-order products are the ones
 * that matter in practice because they land close to the originals and are
 * strong enough to open a receiver's squelch.
 *
 * Returns each product, and marks the ones that fall within `guardMhz` of a
 * frequency in use, because a product in empty spectrum is harmless and a
 * product on top of your lead vocal is not.
 */
export function intermod3(freqsMhz, guardMhz = 0.3) {
  const list = (Array.isArray(freqsMhz) ? freqsMhz : [])
    .map(Number)
    .filter((f) => Number.isFinite(f) && f > 0)
  const guard = Number(guardMhz)
  if (list.length < 2 || !Number.isFinite(guard) || guard < 0) return null
  const r3 = (x) => Math.round(x * 1000) / 1000
  const products = []
  const push = (mhz, from) => {
    if (mhz <= 0) return
    const f = r3(mhz)
    const hit = list.find((x) => Math.abs(x - f) <= guard)
    products.push({ mhz: f, order: from.length === 2 ? '2a-b' : 'a+b-c', from: from.slice(), clashesWith: hit ?? null })
  }
  for (let i = 0; i < list.length; i++) {
    for (let j = 0; j < list.length; j++) {
      if (i === j) continue
      push(2 * list[i] - list[j], [list[i], list[j]])
    }
  }
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      for (let k = 0; k < list.length; k++) {
        if (k === i || k === j) continue
        push(list[i] + list[j] - list[k], [list[i], list[j], list[k]])
      }
    }
  }
  // Same frequency can arrive from several combinations; keep the first.
  const seen = new Set()
  const unique = products.filter((p) => {
    const key = p.mhz + '|' + p.order
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).sort((x, y) => x.mhz - y.mhz)
  return { products: unique, clashes: unique.filter((p) => p.clashesWith !== null) }
}
