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

/**
 * IPv4 subnet arithmetic from an address and a prefix length.
 *
 * The numbers a show network actually needs: which addresses are on this
 * subnet, where it ends, and how many devices fit. Everything is derived from
 * the mask rather than from the class-A/B/C convention, because classful
 * addressing has not decided anything since CIDR arrived in 1993 and a lot of
 * venue documentation still talks as though it does.
 *
 * /31 and /32 are special: a /32 is a single host route and a /31 is a
 * two-address point-to-point link (RFC 3021) with no network or broadcast
 * address to reserve, so "usable hosts" is 0 and 2 respectively rather than
 * the negative numbers the general formula would give.
 */
export function subnetCidr(ip, prefix) {
  const p = Number(prefix)
  if (!Number.isInteger(p) || p < 0 || p > 32) return null
  const parts = String(ip ?? '').trim().split('.')
  if (parts.length !== 4) return null
  const octets = parts.map((o) => {
    if (!/^\d{1,3}$/.test(o)) return NaN
    const n = Number(o)
    return n >= 0 && n <= 255 ? n : NaN
  })
  if (octets.some((n) => Number.isNaN(n))) return null

  const toInt = (o) => ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3]
  const toStr = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')

  const addr = toInt(octets)
  // A 32-bit shift is undefined in JS, so build the mask without shifting by 32.
  const mask = p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0
  const network = (addr & mask) >>> 0
  const broadcast = (network | (~mask >>> 0)) >>> 0
  const total = Math.pow(2, 32 - p)

  let usable, firstHost, lastHost
  if (p === 32) {
    usable = 0; firstHost = null; lastHost = null
  } else if (p === 31) {
    // RFC 3021: both addresses are usable on a point-to-point link.
    usable = 2; firstHost = toStr(network); lastHost = toStr(broadcast)
  } else {
    usable = total - 2
    firstHost = toStr((network + 1) >>> 0)
    lastHost = toStr((broadcast - 1) >>> 0)
  }

  return {
    network: toStr(network),
    broadcast: p >= 31 ? null : toStr(broadcast),
    mask: toStr(mask),
    wildcard: toStr(~mask >>> 0),
    prefix: p,
    firstHost,
    lastHost,
    totalAddresses: total,
    usableHosts: usable,
    cidr: `${toStr(network)}/${p}`,
    // True for the ranges RFC 1918 reserves for private use, which is what a
    // show network should be on.
    isPrivate: octets[0] === 10
      || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
      || (octets[0] === 192 && octets[1] === 168),
  }
}

/**
 * DMX512 line budget in RS-485 unit loads.
 *
 * The rule people remember is "32 devices per line". The rule that is
 * actually in the standard is 32 UNIT LOADS, where one unit load is the
 * current a standard reference receiver draws (about 12 kOhm input
 * impedance). Modern receiver chips are commonly built at 1/2, 1/4 or 1/8 of
 * a unit load, so a single segment can legitimately carry 64, 128 or even 256
 * physical fixtures - and a rig of old 1 UL fixtures still stops at 32.
 *
 * `groups` is a list of { count, unitLoad } so a mixed rig can be added up as
 * it really is. Returns the load, whether it fits, and how many segments
 * (i.e. splitter outputs) the rig needs.
 */
export function dmxLineBudget(groups, limit = 32) {
  const lim = Number(limit)
  if (!Array.isArray(groups) || !Number.isFinite(lim) || lim <= 0) return null
  let unitLoads = 0
  let fixtures = 0
  for (const g of groups) {
    const c = Number(g?.count), u = Number(g?.unitLoad)
    if (!Number.isFinite(c) || c < 0 || !Number.isFinite(u) || u <= 0) return null
    unitLoads += c * u
    fixtures += c
  }
  const r2 = (x) => Math.round(x * 100) / 100
  return {
    fixtures,
    unitLoads: r2(unitLoads),
    limit: lim,
    withinLimit: unitLoads <= lim,
    percentUsed: r2((unitLoads / lim) * 100),
    // Segments needed if the load is split evenly across splitter outputs.
    segmentsNeeded: unitLoads === 0 ? 0 : Math.ceil(unitLoads / lim),
    headroomUnitLoads: r2(lim - unitLoads),
  }
}

/**
 * Sound pressure level at a distance, from a level quoted at a reference
 * distance, in a free field.
 *
 * L2 = L1 - 20 log10(d2 / d1). That is the inverse square law expressed in
 * decibels: doubling the distance quarters the intensity, which is -6 dB.
 *
 * Free field means no reflections. Indoors, room reflections refill part of
 * the loss, so the real figure is always somewhere between this and no loss
 * at all - which makes this the conservative number for clearance and
 * neighbour-noise work, and an optimistic one for coverage.
 */
export function splAtDistance(splRef, refMeters, distMeters) {
  const l = Number(splRef), d1 = Number(refMeters), d2 = Number(distMeters)
  if (!Number.isFinite(l) || !Number.isFinite(d1) || d1 <= 0) return null
  if (!Number.isFinite(d2) || d2 <= 0) return null
  const drop = 20 * Math.log10(d2 / d1)
  const r1 = (x) => Math.round(x * 10) / 10
  return {
    spl: r1(l - drop),
    dropDb: r1(drop),
    doublings: r1(Math.log2(d2 / d1)),
  }
}

/**
 * Frame budget: how long a frame is, and how much of it is left after the
 * work you already know about.
 *
 * At 60 fps a frame is 16.67 ms and every stage of the pipeline spends part
 * of that same budget - geometry, lighting, effects, post, output. This is
 * the arithmetic behind "can it produce the next frame in time, every time",
 * which is the only question that matters for a real-time engine.
 *
 * Stages are milliseconds. The result is deliberately blunt about the
 * overrun case: a pipeline that needs more than the frame period does not
 * run slightly slower, it drops frames.
 */
export function frameBudget(fps, stages = []) {
  const f = Number(fps)
  if (!Number.isFinite(f) || f <= 0) return null
  const period = 1000 / f
  const used = stages
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n >= 0)
    .reduce((a, b) => a + b, 0)
  const r2 = (x) => Math.round(x * 100) / 100
  const headroom = period - used
  return {
    fps: f,
    periodMs: r2(period),
    usedMs: r2(used),
    headroomMs: r2(headroom),
    percentUsed: r2((used / period) * 100),
    withinBudget: used <= period,
    // If it will not fit, the honest answer is the rate it *can* hold.
    achievableFps: used > 0 ? r2(Math.min(f, 1000 / used)) : f,
  }
}

/** hh:mm:ss:ff from the parts framesToTc returns. */
export function tcString(t) {
  const p = (n) => String(n).padStart(2, '0')
  return `${p(t.h)}:${p(t.m)}:${p(t.s)}:${p(t.f)}`
}

/**
 * Pyro cue time: when a firing system has to fire an item so the audience
 * sees it on the beat.
 *
 * A designer programs the moment an effect is *seen*. A shell has to get up
 * there first, and the igniter and fuse take time before that. So the fire
 * time is the effect time minus the whole delay:
 *
 *   fire = effect - (lift + prefire)
 *
 * Two shells bursting together on one beat may have been fired seconds
 * apart, which is also why a pyromusical cannot be nudged live: by the time
 * you can hear that a cue is early, it was fired several seconds ago.
 *
 * All times in seconds from the start of the show. A negative fire time
 * means the item would have to be fired before the show started - a real
 * design fault, and it is reported rather than clamped.
 */
export function pyroCueTime(effectSeconds, liftSeconds = 0, prefireSeconds = 0) {
  const e = Number(effectSeconds)
  const l = Number(liftSeconds)
  const p = Number(prefireSeconds)
  if (!Number.isFinite(e) || e < 0) return null
  if (!Number.isFinite(l) || l < 0 || !Number.isFinite(p) || p < 0) return null
  const r2 = (x) => Math.round(x * 100) / 100
  const total = l + p
  const fire = e - total
  return {
    effectSeconds: r2(e),
    liftSeconds: r2(l),
    prefireSeconds: r2(p),
    totalDelaySeconds: r2(total),
    fireSeconds: r2(fire),
    // The frame the firing system chases, at the usual show rates. Negative
    // fire times have no timecode representation, so they are reported as null
    // rather than wrapped into a plausible-looking one.
    fireTimecode25: fire < 0 ? null : tcString(framesToTc(Math.round(fire * 25), 25)),
    fireTimecode30: fire < 0 ? null : tcString(framesToTc(Math.round(fire * 30), 30)),
    beforeShowStart: fire < 0,
  }
}

/**
 * Clock drift between two free-running devices.
 *
 * A crystal is specified in parts per million. Two devices at opposite ends
 * of their tolerance drift apart at the sum of their errors, and the number
 * that matters on a show is not the ppm - it is how many frames or samples
 * apart they are by the end of the running time.
 *
 * ppm is the combined error between the two clocks. Returns the offset in
 * milliseconds, in video frames at the given rate, and in samples at 48 kHz,
 * plus how long it takes to accumulate a single frame of error.
 */
export function clockDrift(ppm, seconds, fps = 25) {
  const p = Number(ppm), s = Number(seconds), f = Number(fps)
  if (!Number.isFinite(p) || p < 0) return null
  if (!Number.isFinite(s) || s < 0) return null
  if (!Number.isFinite(f) || f <= 0) return null
  const ms = (p / 1e6) * s * 1000
  const r2 = (x) => Math.round(x * 100) / 100
  return {
    ppm: p,
    seconds: s,
    offsetMs: r2(ms),
    frames: r2(ms / (1000 / f)),
    samples48k: Math.round((ms / 1000) * 48000),
    // How long until the two are a whole frame apart. Infinite at 0 ppm.
    secondsPerFrame: p === 0 ? null : r2((1000 / f) / ((p / 1e6) * 1000)),
  }
}

/**
 * Polling against subscribing.
 *
 * The cost of polling is two numbers people rarely put together: how many
 * requests it makes, and how stale the answer is when you get it. Mean
 * staleness is half the interval; worst case is the whole interval, because
 * the change can land the instant after a poll returns.
 *
 * A push subscription has neither cost, which is the entire argument.
 */
export function pollingCost(intervalMs, hours = 1) {
  const i = Number(intervalMs), h = Number(hours)
  if (!Number.isFinite(i) || i <= 0) return null
  if (!Number.isFinite(h) || h < 0) return null
  const r1 = (x) => Math.round(x * 10) / 10
  return {
    intervalMs: i,
    requestsPerHour: Math.round(3600000 / i),
    requestsTotal: Math.round((3600000 / i) * h),
    meanStalenessMs: r1(i / 2),
    worstStalenessMs: i,
    // A missed video frame is the practical yardstick for "too slow".
    framesLateWorst25: r1(i / 40),
  }
}

/**
 * Does a control loop meet its deadline once jitter is included.
 *
 * The average cycle time tells you almost nothing. What decides whether a
 * loop is safe is the WORST case - nominal plus jitter - against the period
 * it has to finish in. A system that meets its deadline on average and
 * misses it one cycle in a thousand has missed it.
 */
export function jitterMargin(periodMs, nominalMs, jitterMs) {
  const p = Number(periodMs), n = Number(nominalMs), j = Number(jitterMs)
  if (!Number.isFinite(p) || p <= 0) return null
  if (!Number.isFinite(n) || n < 0 || !Number.isFinite(j) || j < 0) return null
  const worst = n + j
  const r2 = (x) => Math.round(x * 100) / 100
  return {
    periodMs: p,
    nominalMs: n,
    jitterMs: j,
    worstCaseMs: r2(worst),
    marginMs: r2(p - worst),
    meetsDeadline: worst <= p,
    percentUsedWorst: r2((worst / p) * 100),
    percentUsedNominal: r2((n / p) * 100),
  }
}

/**
 * Required Performance Level, from the ISO 13849-1 Annex A risk graph.
 *
 * Three binary questions decide how much risk reduction a safety function has
 * to deliver, and they are asked in a fixed order:
 *
 *   S - severity of injury      S1 slight, normally reversible
 *                               S2 serious, normally irreversible, incl. death
 *   F - frequency of exposure   F1 seldom to less often, or short exposure
 *                               F2 frequent to continuous, or long exposure
 *   P - possibility of avoiding P1 possible under specific conditions
 *                               P2 scarcely possible
 *
 * The graph is deterministic, which is exactly why it belongs in a tested
 * function rather than being typed into a page. This determines what the
 * function must ACHIEVE; whether a given design achieves it is a separate
 * calculation from architecture, MTTFd, diagnostic coverage and CCF.
 */
export function requiredPerformanceLevel(severity, frequency, avoidance) {
  const S = String(severity).toUpperCase()
  const F = String(frequency).toUpperCase()
  const P = String(avoidance).toUpperCase()
  if (!['S1', 'S2'].includes(S)) return null
  if (!['F1', 'F2'].includes(F)) return null
  if (!['P1', 'P2'].includes(P)) return null
  const GRAPH = {
    S1F1P1: 'a', S1F1P2: 'b',
    S1F2P1: 'b', S1F2P2: 'c',
    S2F1P1: 'c', S2F1P2: 'd',
    S2F2P1: 'd', S2F2P2: 'e',
  }
  const pl = GRAPH[S + F + P]
  // Approximate SIL correspondence, and the probability of a dangerous
  // failure per hour that each PL band represents.
  const SIL = { a: null, b: 1, c: 1, d: 2, e: 3 }
  const PFH = {
    a: '10⁻⁵ to 10⁻⁴', b: '3×10⁻⁶ to 10⁻⁵', c: '10⁻⁶ to 3×10⁻⁶',
    d: '10⁻⁷ to 10⁻⁶', e: '10⁻⁸ to 10⁻⁷',
  }
  return { severity: S, frequency: F, avoidance: P, performanceLevel: pl,
           approxSil: SIL[pl], pfhBand: PFH[pl] }
}

/**
 * How far a load keeps moving after somebody hits the button.
 *
 * Total travel is what happens during the reaction time - detection, logic
 * and output switching, none of which slows anything down - plus the
 * distance covered while actually decelerating.
 *
 *   d = v * t_reaction  +  v^2 / (2 * a)
 *
 * The reaction part is usually tens of milliseconds and the deceleration
 * part usually dominates, which is why "the relay responds in 15 ms" is a
 * true statement that answers the wrong question.
 */
export function stoppingDistance(speedMps, reactionSeconds, decelMps2) {
  const v = Number(speedMps), t = Number(reactionSeconds), a = Number(decelMps2)
  if (!Number.isFinite(v) || v < 0) return null
  if (!Number.isFinite(t) || t < 0) return null
  if (!Number.isFinite(a) || a <= 0) return null
  const r3 = (x) => Math.round(x * 1000) / 1000
  const reactionDistance = v * t
  const brakingDistance = (v * v) / (2 * a)
  const brakingTime = v / a
  return {
    reactionDistance: r3(reactionDistance),
    brakingDistance: r3(brakingDistance),
    totalDistance: r3(reactionDistance + brakingDistance),
    totalTime: r3(t + brakingTime),
    // What share of the travel happened before anything started slowing down.
    reactionShare: r3(reactionDistance / (reactionDistance + brakingDistance || 1)),
  }
}

/**
 * Minimum safeguard distance, from ISO 13855.
 *
 *   S = (K * T) + C
 *
 * K is an approach speed in mm/s - 2000 for a hand approaching a detection
 * plane, reduced to 1600 where the resulting distance exceeds 500 mm. T is
 * the total time from detection to the hazard stopping. C is an intrusion
 * allowance that depends on the detection capability of the device.
 *
 * The reason this is worth having as a number: T includes everything, so a
 * slow safety network or a long mechanical run-down pushes the guard further
 * away, and the guard is the thing everyone assumed was fixed.
 */
export function safeguardDistance(totalStopSeconds, intrusionMm = 0, approachMmPerS = 2000) {
  const T = Number(totalStopSeconds), C = Number(intrusionMm), K = Number(approachMmPerS)
  if (!Number.isFinite(T) || T < 0) return null
  if (!Number.isFinite(C) || C < 0) return null
  if (!Number.isFinite(K) || K <= 0) return null
  const r1 = (x) => Math.round(x * 10) / 10
  const first = K * T + C
  // ISO 13855 allows K to drop to 1600 mm/s once the first result exceeds
  // 500 mm, with a floor of 500 mm on the recalculated value.
  let distance = first, usedK = K, recalculated = false
  if (K === 2000 && first > 500) {
    recalculated = true
    usedK = 1600
    distance = Math.max(500, 1600 * T + C)
  }
  return { totalStopSeconds: T, intrusionMm: C, approachMmPerS: usedK,
           distanceMm: r1(distance), firstPassMm: r1(first), recalculated }
}

/**
 * A hex colour, taken apart.
 *
 * #ffffff is not a colour name. It is three bytes written in base 16, one per
 * channel, and each byte is exactly two hex digits - which is the whole
 * reason hex is used for this rather than decimal. ff is 255 is full.
 *
 * The same three numbers are what a console sends to an RGB fixture, so a
 * hex code and a DMX value are the same kind of object arriving by different
 * routes. Accepts #fff shorthand, with or without the hash.
 */
export function hexToChannels(hex) {
  let h = String(hex ?? '').trim().replace(/^#/, '').toLowerCase()
  if (/^[0-9a-f]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/.test(h)) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const r1 = (x) => Math.round(x * 10) / 10
  return {
    hex: '#' + h,
    r, g, b,
    // What a console would send an 8-bit RGB fixture. Identical numbers.
    dmx: [r, g, b],
    // The same values as percentages, which is how a desk usually shows them.
    percent: [r1((r / 255) * 100), r1((g / 255) * 100), r1((b / 255) * 100)],
    // 16-bit control splits each channel into a coarse and a fine byte.
    coarseFine: [[r, 0], [g, 0], [b, 0]],
  }
}

/**
 * Code value to relative light, and back.
 *
 * Video code values are not linear light. A transfer function is applied
 * before storage so that the available codes are spread to match human
 * brightness perception, which is roughly logarithmic - far more steps are
 * visible in the dark than in the light. Encoding this way is what makes
 * 8-bit video acceptable at all.
 *
 *   light = (code / max) ^ gamma
 *
 * The consequence people meet: 128 out of 255 is not half the light. At a
 * gamma of 2.2 it is about 22% of it, which is why cross-fading or blending
 * in code values gives the wrong answer.
 */
export function codeToLight(code, bits = 8, gamma = 2.2) {
  const c = Number(code), b = Number(bits), g = Number(gamma)
  if (!Number.isFinite(c) || c < 0) return null
  if (!Number.isFinite(b) || b < 1 || b > 16) return null
  if (!Number.isFinite(g) || g <= 0) return null
  const max = Math.pow(2, b) - 1
  if (c > max) return null
  const norm = c / max
  const light = Math.pow(norm, g)
  const r4 = (x) => Math.round(x * 10000) / 10000
  return {
    code: c, maxCode: max, bits: b, gamma: g,
    codeFraction: r4(norm),
    light: r4(light),
    lightPercent: Math.round(light * 1000) / 10,
    // The code you would need for half the light, which is the number that
    // surprises people.
    codeForHalfLight: Math.round(Math.pow(0.5, 1 / g) * max),
  }
}

/**
 * Full range against limited range.
 *
 * Computer graphics use 0-255 for black to white. Broadcast video uses
 * 16-235 for luma, leaving headroom and footroom outside the picture. Feed
 * one into the other and the result is crushed blacks and clipped whites, or
 * washed-out grey - and it is the single most common video fault on a show.
 *
 * Returns where a given code lands under each interpretation.
 */
export function videoRange(code, bits = 8) {
  const c = Number(code), b = Number(bits)
  if (!Number.isFinite(c) || c < 0) return null
  if (!Number.isFinite(b) || b < 8 || b > 16) return null
  const max = Math.pow(2, b) - 1
  if (c > max) return null
  const scale = Math.pow(2, b - 8)
  const black = 16 * scale
  const white = 235 * scale
  const r3 = (x) => Math.round(x * 1000) / 1000
  const asFull = c / max
  const asLimited = (c - black) / (white - black)
  return {
    code: c, bits: b, maxCode: max,
    limitedBlack: black, limitedWhite: white,
    asFull: r3(asFull),
    asLimited: r3(Math.max(0, Math.min(1, asLimited))),
    // Outside the limited window there is nothing to show, which is what
    // crushing and clipping actually are.
    belowBlack: c < black,
    aboveWhite: c > white,
  }
}

/**
 * Uncompressed bit rate for a video format, and what subsampling saves.
 *
 * The eye resolves far more spatial detail in brightness than in colour, so
 * video converts to luma plus two colour-difference channels and then throws
 * away colour resolution. 4:4:4 keeps all of it, 4:2:2 halves it
 * horizontally, 4:2:0 halves it both ways.
 *
 * Fine for camera footage. Not fine for text, fine graphics or keying, which
 * is why a laptop arriving at 4:2:0 has fringed text.
 */
export function chromaBitrate(width, height, fps, bits = 8, scheme = '4:4:4') {
  const w = Number(width), h = Number(height), f = Number(fps), b = Number(bits)
  if (![w, h, f, b].every((n) => Number.isFinite(n) && n > 0)) return null
  // Samples carried per pixel, across luma and the two chroma channels.
  const PER_PIXEL = { '4:4:4': 3, '4:2:2': 2, '4:2:0': 1.5, '4:1:1': 1.5 }
  const per = PER_PIXEL[scheme]
  if (per === undefined) return null
  const bitsPerSecond = w * h * f * b * per
  const full = w * h * f * b * 3
  const r2 = (x) => Math.round(x * 100) / 100
  return {
    scheme, width: w, height: h, fps: f, bits: b,
    samplesPerPixel: per,
    bitsPerSecond,
    gbps: r2(bitsPerSecond / 1e9),
    // How much of the 4:4:4 rate this is.
    fractionOfFull: r2(per / 3),
    savingPercent: r2((1 - per / 3) * 100),
  }
}

/**
 * Reverberation time, by Sabine.
 *
 *   RT60 = 0.161 * V / A     (metric, V in m^3, A in m^2 sabins)
 *
 * A is the total absorption: every surface area multiplied by its absorption
 * coefficient, summed. The constant comes from the speed of sound and the
 * definition of a 60 dB decay.
 *
 * Sabine is accurate for live rooms with modest, evenly spread absorption and
 * over-predicts in dead ones - Eyring is the usual correction there. It is
 * here because it is the equation everybody actually uses to get a first
 * number, and because the shape of the relationship is the useful part: RT is
 * proportional to volume and inversely proportional to absorption, so a big
 * room is a long room and adding people is adding absorption.
 */
export function rt60Sabine(volumeM3, absorptionSabins) {
  const V = Number(volumeM3), A = Number(absorptionSabins)
  if (!Number.isFinite(V) || V <= 0) return null
  if (!Number.isFinite(A) || A <= 0) return null
  const rt = (0.161 * V) / A
  const r2 = (x) => Math.round(x * 100) / 100
  return {
    volumeM3: V,
    absorptionSabins: r2(A),
    rt60: r2(rt),
    // Absorption needed to reach a target, which is the question people
    // actually have.
    sabinsForTarget: (target) => {
      const t = Number(target)
      if (!Number.isFinite(t) || t <= 0) return null
      return r2((0.161 * V) / t)
    },
    // Average absorption coefficient implied, if a surface area is known.
    alphaFor: (surfaceM2) => {
      const s = Number(surfaceM2)
      if (!Number.isFinite(s) || s <= 0) return null
      return Math.round((A / s) * 1000) / 1000
    },
  }
}

/**
 * Stereoscopic depth: how much on-screen disparity a given real depth
 * produces, and whether it is inside a comfortable budget.
 *
 * Two eyes about 63 mm apart see slightly different images. The horizontal
 * difference between where a point lands in each eye is the disparity, and it
 * is the only cue that gives absolute depth from a flat screen.
 *
 *   parallax = interocular * (1 - convergence / distance)
 *
 * Positive parallax puts an object behind the screen; negative puts it in
 * front. The comfort limit is usually stated as a percentage of screen width,
 * because that is what actually governs how far the eyes must diverge.
 */
export function stereoParallax(objectDistanceM, convergenceM, screenWidthM, interocularMm = 63) {
  const d = Number(objectDistanceM), c = Number(convergenceM)
  const w = Number(screenWidthM), i = Number(interocularMm)
  if (!Number.isFinite(d) || d <= 0) return null
  if (!Number.isFinite(c) || c <= 0) return null
  if (!Number.isFinite(w) || w <= 0) return null
  if (!Number.isFinite(i) || i <= 0) return null
  const parallaxMm = i * (1 - c / d)
  const percentOfWidth = (parallaxMm / 1000 / w) * 100
  const r2 = (x) => Math.round(x * 100) / 100
  return {
    objectDistanceM: d, convergenceM: c, screenWidthM: w, interocularMm: i,
    parallaxMm: r2(parallaxMm),
    percentOfWidth: r2(percentOfWidth),
    behindScreen: parallaxMm > 0,
    inFrontOfScreen: parallaxMm < 0,
    // Positive parallax beyond the eye separation asks the eyes to diverge,
    // which they cannot comfortably do at all.
    divergent: parallaxMm > i,
    // A widely used comfort guide: keep positive parallax within ~1% of
    // screen width and negative within ~1-2%.
    withinComfort: percentOfWidth <= 1 && percentOfWidth >= -2,
  }
}

/**
 * Colour temperature correction, in mireds.
 *
 * Kelvin is the wrong scale to do this arithmetic on: the perceptual step from
 * 3200 K to 3400 K is much larger than the step from 9000 K to 9200 K, so a
 * gel cannot have a fixed effect stated in kelvin. The mired — micro reciprocal
 * degree, 10^6 / K — is the scale on which correction IS fixed, which is why
 * every gel manufacturer prints a mired shift on the swatch book rather than a
 * kelvin one.
 *
 *   mired = 1e6 / kelvin
 *   shift = mired(target) - mired(source)
 *
 * A positive shift warms (CTO, orange); a negative shift cools (CTB, blue).
 * The same gel does the same mired shift whatever you point it at, which is
 * the whole reason the unit exists.
 *
 * Gel values are the published Lee mired shifts. Rosco's equivalents differ
 * slightly and are named separately where they do.
 */
export const CORRECTION_GELS = [
  { id: '201', name: 'Full CTB', shift: -137 },
  { id: '202', name: 'Half CTB', shift: -78 },
  { id: '203', name: 'Quarter CTB', shift: -35 },
  { id: '218', name: 'Eighth CTB', shift: -18 },
  { id: '223', name: 'Eighth CTO', shift: 26 },
  { id: '206', name: 'Quarter CTO', shift: 64 },
  { id: '205', name: 'Half CTO', shift: 109 },
  { id: '204', name: 'Full CTO', shift: 159 },
]

export function miredShift(sourceK, targetK) {
  const s = Number(sourceK), t = Number(targetK)
  if (!Number.isFinite(s) || s <= 0) return null
  if (!Number.isFinite(t) || t <= 0) return null
  const sourceMired = 1e6 / s
  const targetMired = 1e6 / t
  const shift = targetMired - sourceMired
  const r1 = (x) => Math.round(x * 10) / 10
  // Nearest single gel, and the best pair, because a swatch book is discrete
  // and the number you calculated almost never lands on one.
  let best = null
  for (const g of CORRECTION_GELS) {
    const err = Math.abs(g.shift - shift)
    if (!best || err < best.error) best = { ...g, error: r1(err) }
  }
  // Only offer a stack if it actually beats the single gel. Two sheets in
  // front of a lamp costs a stop and a bit of texture, so a pair that is no
  // better than one gel is not an answer, it is extra work.
  let pair = null
  for (const a of CORRECTION_GELS) {
    for (const b of CORRECTION_GELS) {
      const err = Math.abs(a.shift + b.shift - shift)
      if (!pair || err < pair.error) pair = { a, b, sum: a.shift + b.shift, error: r1(err) }
    }
  }
  if (pair && pair.error >= best.error) pair = null
  return {
    sourceK: s,
    targetK: t,
    sourceMired: r1(sourceMired),
    targetMired: r1(targetMired),
    shift: r1(shift),
    // Which way the correction goes, in the language printed on the gel.
    direction: shift > 0 ? 'warmer (CTO)' : shift < 0 ? 'cooler (CTB)' : 'no correction',
    nearestGel: best,
    nearestPair: pair,
    // The swatch book is discrete and the number you calculated almost never
    // lands on one. Past about 15 mired the eye starts to see the residual,
    // so say so rather than presenting a near-miss as the answer.
    gelIsClose: best.error <= 15,
    // Where a given gel actually lands the source, which is the check people
    // do after pulling one off the shelf.
    resultOf: (gelShift) => {
      const g = Number(gelShift)
      if (!Number.isFinite(g)) return null
      const m = sourceMired + g
      return m > 0 ? Math.round(1e6 / m) : null
    },
  }
}

/**
 * Fibre optic loss budget.
 *
 * A fibre run either has enough light left at the far end or it does not, and
 * the arithmetic is a subtraction: start with the transmitter's launch power
 * minus the receiver's sensitivity, then spend that budget on the length of
 * the glass, every connector pair, and every splice.
 *
 * Attenuation figures are wavelength-dependent and this is why a run that
 * works at 1310 nm can fail at 850 nm over the same glass.
 *
 * Typical values (TIA-568 / FOA guidance):
 *   OM3/OM4 multimode  @850nm  ~3.0 dB/km   @1300nm ~1.0 dB/km
 *   OS2 singlemode     @1310nm ~0.4 dB/km   @1550nm ~0.3 dB/km
 *   connector pair     0.3 dB typical, 0.75 dB is the TIA maximum
 *   fusion splice      0.1 dB, mechanical splice 0.3 dB
 */
export const FIBRE_ATTENUATION = {
  'om3-850': { label: 'OM3/OM4 multimode, 850 nm', dbPerKm: 3.0 },
  'om3-1300': { label: 'OM3/OM4 multimode, 1300 nm', dbPerKm: 1.0 },
  'os2-1310': { label: 'OS2 singlemode, 1310 nm', dbPerKm: 0.4 },
  'os2-1550': { label: 'OS2 singlemode, 1550 nm', dbPerKm: 0.3 },
}

export function fibreLossBudget(lengthM, fibreType, connectorPairs = 2, splices = 0, opts = {}) {
  const len = Number(lengthM)
  const f = FIBRE_ATTENUATION[fibreType]
  const conns = Number(connectorPairs)
  const spl = Number(splices)
  if (!Number.isFinite(len) || len < 0) return null
  if (!f) return null
  if (!Number.isFinite(conns) || conns < 0) return null
  if (!Number.isFinite(spl) || spl < 0) return null
  const connectorLoss = Number(opts.connectorLoss ?? 0.3)
  const spliceLoss = Number(opts.spliceLoss ?? 0.1)
  // Link budget: how much loss the optics tolerate. Default is a common
  // short-reach SFP figure; real budgets come from the module's datasheet.
  const budget = Number(opts.linkBudgetDb ?? 8)
  const r2 = (x) => Math.round(x * 100) / 100
  const fibreLoss = (len / 1000) * f.dbPerKm
  const connLoss = conns * connectorLoss
  const splLoss = spl * spliceLoss
  const total = fibreLoss + connLoss + splLoss
  return {
    lengthM: len,
    fibre: f.label,
    fibreLossDb: r2(fibreLoss),
    connectorLossDb: r2(connLoss),
    spliceLossDb: r2(splLoss),
    totalLossDb: r2(total),
    linkBudgetDb: r2(budget),
    marginDb: r2(budget - total),
    ok: total <= budget,
    // A run with almost no margin passes on the day and fails after a
    // re-terminated connector or a dirty end face, so this is the number
    // worth looking at rather than the pass/fail.
    thin: budget - total < 3 && total <= budget,
    // How far the same construction could go before running out.
    maxLengthM: f.dbPerKm > 0
      ? Math.max(0, Math.round(((budget - connLoss - splLoss) / f.dbPerKm) * 1000))
      : null,
  }
}

/**
 * Heat load from equipment, and what it costs to cool.
 *
 * Every watt a lighting rig, an amplifier rack or a media server draws ends up
 * as heat in the room — near enough all of it, because the light and sound
 * that leave are a rounding error against the input power. That is why a
 * lighting designer's rig plot is also an HVAC problem, and why a rehearsal
 * room with the house lights up gets uncomfortable long before anybody blames
 * the lights.
 *
 *   1 W = 3.412 BTU/hr
 *   1 ton of refrigeration = 12 000 BTU/hr = 3.517 kW
 */
export function heatLoad(watts, opts = {}) {
  const w = Number(watts)
  if (!Number.isFinite(w) || w < 0) return null
  // People are a real load in a full room: roughly 100 W sensible each while
  // seated, more when they are dancing.
  const people = Number(opts.people ?? 0)
  const perPerson = Number(opts.wattsPerPerson ?? 100)
  const peopleW = Number.isFinite(people) && people > 0 ? people * perPerson : 0
  const totalW = w + peopleW
  const btuPerHour = totalW * 3.412
  const tons = btuPerHour / 12000
  const r = (x, n = 0) => { const p = 10 ** n; return Math.round(x * p) / p }
  return {
    equipmentW: w,
    peopleW: r(peopleW),
    totalW: r(totalW),
    btuPerHour: r(btuPerHour),
    kwThermal: r(totalW / 1000, 2),
    tonsOfCooling: r(tons, 2),
    // Air volume needed for a given temperature rise, which is the question a
    // production electrician actually asks about a dimmer room or a rack case.
    // Q = P / (rho * cp * dT); 1.2 kg/m3, 1005 J/kg.K at room conditions.
    airflowM3PerHourFor: (deltaC) => {
      const dt = Number(deltaC)
      if (!Number.isFinite(dt) || dt <= 0) return null
      return r((totalW / (1.2 * 1005 * dt)) * 3600)
    },
    airflowCfmFor: (deltaC) => {
      const dt = Number(deltaC)
      if (!Number.isFinite(dt) || dt <= 0) return null
      return r(((totalW / (1.2 * 1005 * dt)) * 3600) * 0.588578)
    },
  }
}

/**
 * Video storage and bitrate.
 *
 * Two questions, one division. How much disk does this shoot need, and how
 * long will this card last. The trap is that vendors quote drives in decimal
 * gigabytes and operating systems report binary gibibytes, so a "1 TB" card
 * holds 931 GiB and the difference is a whole afternoon of recording.
 */
export function videoStorage(bitrateMbps, minutes, opts = {}) {
  const br = Number(bitrateMbps)
  const min = Number(minutes)
  if (!Number.isFinite(br) || br <= 0) return null
  if (!Number.isFinite(min) || min < 0) return null
  const streams = Number(opts.streams ?? 1)
  if (!Number.isFinite(streams) || streams <= 0) return null
  const totalMbps = br * streams
  const seconds = min * 60
  const megabits = totalMbps * seconds
  const gigabytesDecimal = megabits / 8 / 1000
  const gibibytes = megabits / 8 / 1024
  const r2 = (x) => Math.round(x * 100) / 100
  return {
    bitrateMbps: br,
    streams,
    totalMbps: r2(totalMbps),
    minutes: min,
    gigabytes: r2(gigabytesDecimal),
    gibibytes: r2(gibibytes),
    terabytes: r2(gigabytesDecimal / 1000),
    // The other direction: how long a card or array lasts at this rate.
    minutesForGb: (gb) => {
      const g = Number(gb)
      if (!Number.isFinite(g) || g <= 0) return null
      return r2((g * 1000 * 8) / totalMbps / 60)
    },
    // Sustained write the media has to keep up with, which is the spec that
    // actually decides whether a card drops frames.
    writeMBps: r2(totalMbps / 8),
  }
}

/**
 * Battery runtime.
 *
 * Wireless packs, comms belt packs, and anything on a V-lock. The arithmetic
 * is trivial; what people get wrong is using the printed capacity as if all of
 * it were usable. It is not: you lose some to the cutoff voltage, some to
 * cold, and a lithium pack that has done 300 shows is not the pack on the
 * label any more.
 */
export function batteryRuntime(capacityWh, drawW, opts = {}) {
  const cap = Number(capacityWh)
  const draw = Number(drawW)
  if (!Number.isFinite(cap) || cap <= 0) return null
  if (!Number.isFinite(draw) || draw <= 0) return null
  // Fraction of the nameplate you can actually use before the device cuts out.
  const usable = Number(opts.usableFraction ?? 0.8)
  const r2 = (x) => Math.round(x * 100) / 100
  const idealH = cap / draw
  const realH = (cap * usable) / draw
  return {
    capacityWh: cap,
    drawW: draw,
    usableFraction: usable,
    idealHours: r2(idealH),
    hours: r2(realH),
    minutes: Math.round(realH * 60),
    // Show call is the number that matters: does it get through the show plus
    // the notes session, or do you need a swap at interval?
    coversHours: (h) => {
      const n = Number(h)
      if (!Number.isFinite(n) || n <= 0) return null
      return realH >= n
    },
    packsForHours: (h) => {
      const n = Number(h)
      if (!Number.isFinite(n) || n <= 0) return null
      return Math.ceil(n / realH)
    },
  }
}

/**
 * mAh at a nominal voltage, since that is how most packs are labelled.
 */
export function whFromMah(mah, volts) {
  const m = Number(mah), v = Number(volts)
  if (!Number.isFinite(m) || m <= 0) return null
  if (!Number.isFinite(v) || v <= 0) return null
  return Math.round(((m / 1000) * v) * 100) / 100
}

/**
 * Fitting one aspect ratio inside another.
 *
 * Every projector, LED wall and stream has this problem: the content is one
 * shape and the surface is another. Fit letterboxes it and wastes surface;
 * fill crops it and loses content. The bar sizes are what a designer needs,
 * because that is the dead area they have to either mask or design around.
 */
export function aspectFit(contentW, contentH, screenW, screenH) {
  const cw = Number(contentW), ch = Number(contentH)
  const sw = Number(screenW), sh = Number(screenH)
  if (![cw, ch, sw, sh].every((n) => Number.isFinite(n) && n > 0)) return null
  const contentAspect = cw / ch
  const screenAspect = sw / sh
  const r2 = (x) => Math.round(x * 100) / 100
  const scaleFit = Math.min(sw / cw, sh / ch)
  const scaleFill = Math.max(sw / cw, sh / ch)
  const fitW = cw * scaleFit, fitH = ch * scaleFit
  const fillW = cw * scaleFill, fillH = ch * scaleFill
  return {
    contentAspect: r2(contentAspect),
    screenAspect: r2(screenAspect),
    match: Math.abs(contentAspect - screenAspect) < 0.005,
    fit: {
      scale: Math.round(scaleFit * 10000) / 10000,
      width: Math.round(fitW), height: Math.round(fitH),
      // Bars are split between the two sides, which is what you mask.
      pillarboxEach: Math.round((sw - fitW) / 2),
      letterboxEach: Math.round((sh - fitH) / 2),
      unusedPercent: r2((1 - (fitW * fitH) / (sw * sh)) * 100),
    },
    fill: {
      scale: Math.round(scaleFill * 10000) / 10000,
      width: Math.round(fillW), height: Math.round(fillH),
      cropEachSide: Math.round((fillW - sw) / 2),
      cropTopBottom: Math.round((fillH - sh) / 2),
      lostPercent: r2((1 - (sw * sh) / (fillW * fillH)) * 100),
    },
    // Scaling up past 1:1 is where a wall starts to look soft, and it is worth
    // saying so rather than letting the number pass unremarked.
    upscalingFit: scaleFit > 1.02,
    upscalingFill: scaleFill > 1.02,
  }
}

/**
 * Room modes and the Schroeder frequency.
 *
 * Below a certain frequency a room does not behave statistically. Individual
 * standing waves dominate, and the response at a given seat is a comb of
 * peaks and nulls set by the room's dimensions rather than by the system. No
 * amount of absorption on the walls fixes that — the wavelengths are metres
 * long and the treatment would have to be too.
 *
 *   axial mode  f = (c / 2) * sqrt((nx/Lx)^2 + (ny/Ly)^2 + (nz/Lz)^2)
 *   Schroeder   f = 2000 * sqrt(RT60 / V)      (metric, V in m^3)
 *
 * The Schroeder frequency is the transition: above it, statistical acoustics
 * apply and RT60 means something; below it, you are counting modes.
 */
export function roomModes(lengthM, widthM, heightM, opts = {}) {
  const L = Number(lengthM), W = Number(widthM), H = Number(heightM)
  if (![L, W, H].every((n) => Number.isFinite(n) && n > 0)) return null
  const c = Number(opts.speedOfSound ?? 343)
  const rt60 = Number(opts.rt60 ?? 0)
  const volume = L * W * H
  const r1 = (x) => Math.round(x * 10) / 10

  // Axial modes are the loud ones: two parallel surfaces, one dimension.
  const axial = (dim, label) => [1, 2, 3].map((n) => ({
    order: n, axis: label, hz: r1((c / 2) * (n / dim)),
  }))
  const modes = [...axial(L, 'length'), ...axial(W, 'width'), ...axial(H, 'height')]
    .sort((a, b) => a.hz - b.hz)

  const schroeder = rt60 > 0 ? r1(2000 * Math.sqrt(rt60 / volume)) : null

  // Two modes within about 5% of each other pile up at the same frequency,
  // which is a bigger problem than either alone. Cube-ish rooms do this.
  const pileups = []
  for (let i = 0; i < modes.length; i++) {
    for (let j = i + 1; j < modes.length; j++) {
      if (modes[i].axis === modes[j].axis) continue
      const spread = Math.abs(modes[i].hz - modes[j].hz) / modes[i].hz
      if (spread < 0.05) pileups.push({ hz: modes[i].hz, axes: [modes[i].axis, modes[j].axis] })
    }
  }

  return {
    volume: r1(volume),
    modes,
    fundamental: modes[0],
    schroeder,
    // Below Schroeder you are in modal territory; above it the room is
    // statistically diffuse and RT60 is a meaningful description of it.
    modalBelow: schroeder,
    pileups,
    // A room whose dimensions are simple multiples of each other stacks its
    // modes instead of spreading them, which is why cubes sound bad.
    ratioWarning: [L / W, L / H, W / H].some((r) => {
      const near = Math.abs(r - Math.round(r))
      return Math.round(r) >= 1 && near < 0.06
    }),
  }
}

/**
 * Line array coverage: near field, far field, and the distance where the
 * behaviour changes.
 *
 * A point source loses 6 dB every time you double the distance, because the
 * energy spreads over a sphere. A line source that is long compared with the
 * wavelength spreads cylindrically instead, and loses only 3 dB per doubling.
 * That is the whole reason a line array reaches the back of a room without
 * removing the front row's hearing.
 *
 * It does not last forever. Beyond a transition distance set by the array's
 * length and the frequency, the cylindrical wavefront becomes spherical and
 * the array reverts to 6 dB per doubling. Designing as if the 3 dB region
 * extended to the back wall is the classic mistake.
 *
 *   transition ≈ (arrayLength^2 * frequency) / (2 * speedOfSound)
 */
export function lineArrayCoverage(arrayLengthM, frequencyHz, distanceM, opts = {}) {
  const len = Number(arrayLengthM)
  const f = Number(frequencyHz)
  const d = Number(distanceM)
  if (![len, f, d].every((n) => Number.isFinite(n) && n > 0)) return null
  const c = Number(opts.speedOfSound ?? 343)
  const refDistance = Number(opts.refDistance ?? 1)
  const refSpl = Number(opts.refSpl ?? 100)
  const r1 = (x) => Math.round(x * 10) / 10

  const transition = (len * len * f) / (2 * c)
  const nearField = d <= transition

  // Cylindrical to the transition, spherical after it.
  let loss
  if (d <= transition) {
    loss = 3 * Math.log2(d / refDistance)
  } else {
    loss = 3 * Math.log2(transition / refDistance) + 6 * Math.log2(d / transition)
  }
  const spl = refSpl - loss

  return {
    arrayLengthM: len,
    frequencyHz: f,
    distanceM: d,
    transitionM: r1(transition),
    nearField,
    lossDb: r1(loss),
    splAtDistance: r1(spl),
    // The comparison that makes the point: what a point source would have done.
    pointSourceLossDb: r1(6 * Math.log2(d / refDistance)),
    advantageDb: r1(6 * Math.log2(d / refDistance) - loss),
    // Front-to-back consistency is the number a system tech actually cares
    // about: how much louder the front row is than the back.
    frontToBackDb: (frontM, backM) => {
      const a = Number(frontM), b = Number(backM)
      if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(b) || b <= a) return null
      const at = (x) => x <= transition
        ? 3 * Math.log2(x / refDistance)
        : 3 * Math.log2(transition / refDistance) + 6 * Math.log2(x / transition)
      return r1(at(b) - at(a))
    },
  }
}

/**
 * Stops of light: what a filter, a diffusion or an aperture change costs.
 *
 * A stop is a factor of two in light. It is the unit the whole trade counts in
 * because it matches how the eye responds — halving the light is one step
 * whether you are at full or at a quarter.
 *
 *   transmission = 2^(-stops)
 *   stops = -log2(transmission)
 *
 * ND filters are labelled two incompatible ways, which is a permanent source
 * of confusion: photographic ND is an optical density (ND 0.3 = 1 stop) while
 * a lot of stage filter is labelled by the fraction it passes (ND 0.6 = 2
 * stops = 25%).
 */
export function stopsOfLight(input, mode = 'stops') {
  const v = Number(input)
  if (!Number.isFinite(v)) return null
  const r2 = (x) => Math.round(x * 100) / 100
  let stops
  if (mode === 'stops') {
    stops = v
  } else if (mode === 'transmission') {
    if (v <= 0 || v > 1) return null
    stops = -Math.log2(v)
  } else if (mode === 'density') {
    // Optical density: stops = density / 0.301
    if (v < 0) return null
    stops = v / Math.log10(2)
  } else {
    return null
  }
  const transmission = 2 ** -stops
  return {
    stops: r2(stops),
    transmission: r2(transmission),
    percent: r2(transmission * 100),
    opticalDensity: r2(stops * Math.log10(2)),
    // The two labels side by side, because the mismatch is the actual problem.
    ndLabel: `ND ${r2(stops * Math.log10(2)).toFixed(1)}`,
    // Stacking filters multiplies transmission, which is adding stops.
    plus: (moreStops) => {
      const m = Number(moreStops)
      if (!Number.isFinite(m)) return null
      return stopsOfLight(stops + m, 'stops')
    },
    // What it does to a measured level.
    appliedTo: (lux) => {
      const l = Number(lux)
      if (!Number.isFinite(l) || l < 0) return null
      return Math.round(l * transmission)
    },
  }
}

/**
 * Wind pressure and force on a flat surface.
 *
 * Everything with an area outdoors is a sail, and the number that surprises
 * people is how fast it grows: force goes with the square of wind speed, so a
 * banner that shrugs off a 10 m/s breeze takes four times the load at 20 m/s.
 * That is the whole reason a wind action plan has speeds written on it rather
 * than a judgement call at the time.
 *
 *   q = 0.5 * rho * v^2      dynamic pressure, Pa, rho ~1.25 kg/m3 for air
 *   F = q * cf * A           force, N, cf the shape's force coefficient
 *
 * cf is where the honesty lives. A flat panel square to the wind is about 1.3;
 * EN 1991-1-4 puts a signboard at 1.8; a lattice tower is far lower because
 * most of it is hole. The default here is the flat-panel figure, and the
 * structure's own documentation is what governs on a real job.
 *
 * THIS IS A SCREENING NUMBER. It tells you whether to have the conversation,
 * not whether the thing stands up. Temporary demountable structures are
 * designed to EN 13782 / ANSI E1.21 by somebody competent to do it, against a
 * site-specific wind speed, with gust and terrain factors this does not model.
 */
export function windLoad(speedMs, areaM2, opts = {}) {
  const v = Number(speedMs)
  const a = Number(areaM2)
  if (!Number.isFinite(v) || v < 0 || !Number.isFinite(a) || a <= 0) return null
  const rho = Number(opts.airDensity ?? 1.25)
  const cf = Number(opts.forceCoefficient ?? 1.3)
  const gustFactor = Number(opts.gustFactor ?? 1.4)
  if (!Number.isFinite(rho) || rho <= 0 || !Number.isFinite(cf) || cf <= 0) return null
  const r1 = (x) => Math.round(x * 10) / 10
  const r0 = (x) => Math.round(x)

  const pressure = 0.5 * rho * v * v
  const force = pressure * cf * a
  // A gust is what actually takes the thing over, and it arrives at a speed
  // the anemometer's averaged reading never showed you.
  const gustSpeed = v * gustFactor
  const gustForce = 0.5 * rho * gustSpeed * gustSpeed * cf * a

  // Overturning, when there is enough geometry to check it. Moment about the
  // downwind edge of the base: wind pushing at the centroid height against the
  // weight acting through the middle of the base.
  let overturning = null
  const h = Number(opts.centroidHeightM)
  const base = Number(opts.baseWidthM)
  const mass = Number(opts.massKg)
  if ([h, base, mass].every((n) => Number.isFinite(n) && n > 0)) {
    const overturningMoment = gustForce * h
    const restoringMoment = mass * 9.81 * (base / 2)
    const ballastKg = Math.max(0, (overturningMoment / (base / 2) / 9.81) - mass)
    overturning = {
      overturningNm: r0(overturningMoment),
      restoringNm: r0(restoringMoment),
      ratio: r1(restoringMoment / overturningMoment),
      stable: restoringMoment > overturningMoment,
      extraBallastKg: r0(ballastKg),
    }
  }

  return {
    speedMs: r1(v),
    speedKmh: r1(v * 3.6),
    speedMph: r1(v * 2.237),
    beaufort: beaufort(v),
    areaM2: a,
    forceCoefficient: cf,
    pressurePa: r1(pressure),
    forceN: r0(force),
    // Kilogram-force, because that is the unit a rigger can weigh against.
    forceKgf: r0(force / 9.81),
    gustSpeedMs: r1(gustSpeed),
    gustForceN: r0(gustForce),
    gustForceKgf: r0(gustForce / 9.81),
    overturning,
    // Doubling the wind is four times the load; this is the sentence the
    // numbers exist to make unavoidable.
    atSpeed: (otherMs) => {
      const o = Number(otherMs)
      if (!Number.isFinite(o) || o < 0) return null
      return { speedMs: r1(o), forceN: r0(0.5 * rho * o * o * cf * a), timesCurrent: v > 0 ? r1((o * o) / (v * v)) : null }
    },
  }
}

export const BEAUFORT = [
  [0.5, 0, 'Calm'], [1.6, 1, 'Light air'], [3.4, 2, 'Light breeze'],
  [5.5, 3, 'Gentle breeze'], [8.0, 4, 'Moderate breeze'], [10.8, 5, 'Fresh breeze'],
  [13.9, 6, 'Strong breeze'], [17.2, 7, 'Near gale'], [20.8, 8, 'Gale'],
  [24.5, 9, 'Strong gale'], [28.5, 10, 'Storm'], [32.7, 11, 'Violent storm'],
]

/** Beaufort force and its name, from a wind speed in m/s. */
export function beaufort(speedMs) {
  const v = Number(speedMs)
  if (!Number.isFinite(v) || v < 0) return null
  for (const [ceiling, force, name] of BEAUFORT) {
    if (v < ceiling) return { force, name }
  }
  return { force: 12, name: 'Hurricane force' }
}

/**
 * Dew point, and whether a cold surface is about to sweat.
 *
 * Two situations, one calculation. A flight case comes off a cold truck into a
 * humid venue and the metal is below the dew point, so water forms inside the
 * amplifier before anybody has plugged it in. Or an LED wall sits out
 * overnight, the air cools to its dew point around dawn, and the panels are
 * wet at 6am with a show at noon.
 *
 * Magnus-Tetens, with the WMO coefficients:
 *   gamma = ln(RH/100) + (b*T)/(c+T)
 *   Td    = (c*gamma)/(b-gamma)          b = 17.62, c = 243.12 C
 *
 * Good to about +/-0.4 C between -45 and +60 C, which is far better than the
 * humidity reading you are feeding it.
 */
export function dewPoint(tempC, relativeHumidity, opts = {}) {
  const t = Number(tempC)
  const rh = Number(relativeHumidity)
  if (!Number.isFinite(t) || !Number.isFinite(rh) || rh <= 0 || rh > 100) return null
  const b = 17.62
  const c = 243.12
  const r1 = (x) => Math.round(x * 10) / 10
  const gamma = Math.log(rh / 100) + (b * t) / (c + t)
  const td = (c * gamma) / (b - gamma)

  // Absolute humidity, g/m3 - the number that says how much water is actually
  // in the air, which is what a dehumidifier has to remove.
  const svp = 6.112 * Math.exp((b * t) / (c + t))
  const absolute = (svp * (rh / 100) * 2.1674) / (273.15 + t) * 100

  const surface = Number(opts.surfaceTempC)
  let condensation = null
  if (Number.isFinite(surface)) {
    condensation = {
      surfaceTempC: r1(surface),
      marginC: r1(surface - td),
      willCondense: surface <= td,
    }
  }

  return {
    tempC: r1(t),
    relativeHumidity: r1(rh),
    dewPointC: r1(td),
    dewPointF: r1(td * 1.8 + 32),
    absoluteHumidityGm3: r1(absolute),
    condensation,
    // How far the air has to cool before it starts raining on your rig.
    spreadC: r1(t - td),
    // The other direction: how warm a surface has to get to be safe, with a
    // margin, because "exactly at the dew point" is already wet.
    safeSurfaceC: r1(td + Number(opts.marginC ?? 2)),
  }
}

/**
 * Flash rate against the photosensitivity guidance.
 *
 * The threshold that matters is three flashes in any one second. It is the
 * same number in WCAG 2.3.1, in ITU-R BT.1702 and in the Ofcom guidance, and
 * it is not a house style - it is the rate above which a sequence starts
 * provoking seizures in people with photosensitive epilepsy. Saturated red is
 * treated separately and more strictly, because deep red provokes responses
 * that the same rate in another colour does not.
 *
 * Sensitivity peaks around 15-20 Hz, which is squarely inside the range a
 * strobe sits at when somebody sets it by ear against a track.
 *
 * The BPM conversion is here because that is how the rate actually gets chosen.
 * Nobody types 3.2 Hz into a console; they put a strobe on every half beat of
 * a 128 BPM track and that is 4.3 flashes a second.
 */
export function flashRate(flashesPerSecond, opts = {}) {
  const f = Number(flashesPerSecond)
  if (!Number.isFinite(f) || f < 0) return null
  const limit = Number(opts.limit ?? 3)
  const r2 = (x) => Math.round(x * 100) / 100
  const red = Boolean(opts.saturatedRed)
  const stripes = Number(opts.stripes)

  const over = f > limit
  // 3 to 60 Hz provokes; the peak of it is 15 to 20.
  const peakBand = f >= 15 && f <= 20
  const provokingBand = f >= 3 && f <= 60

  const issues = []
  if (over) issues.push(`${r2(f)} flashes per second exceeds the limit of ${limit}`)
  if (red && f > limit) issues.push('saturated red flashing is judged more strictly than any other colour')
  if (peakBand) issues.push('this rate is in the 15-20 Hz band where sensitivity peaks')
  if (Number.isFinite(stripes) && stripes > 5) issues.push(`${stripes} light-dark pairs exceeds the 5-stripe pattern limit`)

  return {
    flashesPerSecond: r2(f),
    periodMs: f > 0 ? r2(1000 / f) : null,
    limit,
    withinGuidance: !over && !(Number.isFinite(stripes) && stripes > 5),
    peakBand,
    provokingBand,
    saturatedRed: red,
    issues,
    // What a strobe on the beat actually comes to.
    fromBpm: (bpm, division = 1) => {
      const b = Number(bpm), d = Number(division)
      if (!Number.isFinite(b) || b <= 0 || !Number.isFinite(d) || d <= 0) return null
      return r2((b / 60) * d)
    },
    // And the answer to "so what can I have": the fastest musical division
    // that still lands inside the guidance at this tempo.
    slowestSafeDivision: (bpm) => {
      const b = Number(bpm)
      if (!Number.isFinite(b) || b <= 0) return null
      const divisions = [
        [4, 'every 1/16 note'], [2, 'every 1/8 note'], [1, 'every beat'],
        [0.5, 'every 2 beats'], [0.25, 'every bar (4/4)'],
      ]
      for (const [d, label] of divisions) {
        if ((b / 60) * d <= limit) return { division: d, label, rate: r2((b / 60) * d) }
      }
      return null
    },
  }
}

/**
 * Assistive listening receivers required, from ADA 2010 Standards Table 219.3.
 *
 * This reproduces a published table rather than deriving anything, which is
 * exactly why it is worth having: the table is a stepped formula that people
 * get wrong from memory, and getting it wrong is a compliance failure that
 * surfaces on opening night.
 *
 * The second column is the part everyone forgets. A share of the receivers
 * have to be hearing-aid compatible - meaning a neckloop or similar that
 * couples to a hearing aid's telecoil, not just headphones. Exception 2 waives
 * that where every seat is covered by an induction loop, because the hearing
 * aids in the room are already the receivers.
 *
 * Source: 2010 ADA Standards for Accessible Design, section 219.3.
 */
export function assistiveListening(seats, opts = {}) {
  const n = Math.floor(Number(seats))
  if (!Number.isFinite(n) || n < 1) return null

  let receivers
  let band
  if (n <= 50) {
    receivers = 2
    band = '50 or fewer'
  } else if (n <= 500) {
    receivers = 2 + Math.ceil((n - 50) / 25)
    band = n <= 200 ? '51 to 200' : '201 to 500'
  } else if (n <= 1000) {
    receivers = 20 + Math.ceil((n - 500) / 33)
    band = '501 to 1000'
  } else if (n <= 2000) {
    receivers = 35 + Math.ceil((n - 1000) / 50)
    band = '1001 to 2000'
  } else {
    receivers = 55 + Math.ceil((n - 2000) / 100)
    band = '2001 and over'
  }

  const loop = Boolean(opts.inductionLoopAllSeats)
  // 50 or fewer, and 51 to 200, require 2 hearing-aid compatible. Above that
  // it is one in four of the total.
  let hearingAidCompatible
  if (loop) hearingAidCompatible = 0
  else if (n <= 200) hearingAidCompatible = 2
  else hearingAidCompatible = Math.ceil(receivers / 4)

  return {
    seats: n,
    band,
    receivers,
    hearingAidCompatible,
    inductionLoopWaiver: loop,
    // The ratio, because a venue manager's question is usually "is one in
    // twenty about right" and the answer changes a lot with size.
    onePer: Math.round(n / receivers),
    note: loop
      ? 'Exception 2: an induction loop serving all seats waives the hearing-aid compatible receiver count.'
      : 'Hearing-aid compatible means it couples to a telecoil - a neckloop, not headphones.',
  }
}

/**
 * NEC conductor ampacity derating, and AWG to mm2 both ways.
 *
 * A cable's rating is a single number on a datasheet measured in still 30 C
 * air with three current-carrying conductors. A touring rig gives it none of
 * those things: cable is coiled, bundled in a loom, run over a hot roof, and
 * carrying harmonics on the neutral. Two published factors correct for the
 * two conditions that matter.
 *
 * The temperature factor is not a lookup here - it is the formula NEC's own
 * Table 310.15(B)(1) is generated from, which reproduces the published values
 * exactly and keeps working between the rows:
 *
 *   correction = sqrt((Tc - Ta) / (Tc - 30))
 *
 * Tc is the insulation's temperature rating, Ta the ambient. The bundling
 * factors are from Table 310.15(C)(1) and are steps, not a curve.
 *
 * The base ampacity has to come from the cable's own datasheet. This does not
 * know what you are holding, and a tool that guessed would be worse than no
 * tool.
 */
export const BUNDLE_FACTORS = [
  [3, 1.00], [6, 0.80], [9, 0.70], [20, 0.50], [30, 0.45], [40, 0.40],
]

export function cableDerating(baseAmps, opts = {}) {
  const base = Number(baseAmps)
  if (!Number.isFinite(base) || base <= 0) return null
  const conductors = Math.floor(Number(opts.conductors ?? 3))
  const ambientC = Number(opts.ambientC ?? 30)
  const insulationC = Number(opts.insulationC ?? 90)
  if (!Number.isFinite(conductors) || conductors < 1) return null
  if (!Number.isFinite(ambientC) || !Number.isFinite(insulationC)) return null
  // Above the insulation rating there is no ampacity at all, not a small one.
  if (ambientC >= insulationC) {
    return { baseAmps: base, conductors, ambientC, insulationC, bundleFactor: 0, tempFactor: 0, deratedAmps: 0, overTemperature: true }
  }
  const r2 = (x) => Math.round(x * 100) / 100

  let bundleFactor = 0.35
  for (const [ceiling, factor] of BUNDLE_FACTORS) {
    if (conductors <= ceiling) { bundleFactor = factor; break }
  }
  const tempFactor = Math.sqrt((insulationC - ambientC) / (insulationC - 30))
  const derated = base * bundleFactor * tempFactor

  return {
    baseAmps: base,
    conductors,
    ambientC,
    insulationC,
    bundleFactor,
    tempFactor: r2(tempFactor),
    deratedAmps: r2(derated),
    // What it cost, as the sentence people actually say out loud.
    lostAmps: r2(base - derated),
    lostPercent: r2((1 - bundleFactor * tempFactor) * 100),
    overTemperature: false,
  }
}

/** AWG to conductor area in mm2. Handles 0, 00, 000, 0000 as 0, -1, -2, -3. */
export function awgToMm2(awg) {
  const n = Number(awg)
  if (!Number.isFinite(n) || n > 40 || n < -3) return null
  const diameterMm = 0.127 * 92 ** ((36 - n) / 39)
  const area = Math.PI * (diameterMm / 2) ** 2
  return {
    awg: n,
    label: n <= 0 ? `${'0'.repeat(1 - n)} (${1 - n}/0) AWG` : `${n} AWG`,
    diameterMm: Math.round(diameterMm * 1000) / 1000,
    areaMm2: Math.round(area * 1000) / 1000,
  }
}

/** The nearest AWG size to a metric cross-section, and whether it is over or under. */
export function mm2ToAwg(areaMm2) {
  const a = Number(areaMm2)
  if (!Number.isFinite(a) || a <= 0) return null
  const diameterMm = 2 * Math.sqrt(a / Math.PI)
  const exact = 36 - 39 * (Math.log(diameterMm / 0.127) / Math.log(92))
  const nearest = Math.round(exact)
  const n = awgToMm2(nearest)
  if (!n) return null
  return {
    areaMm2: a,
    exactAwg: Math.round(exact * 10) / 10,
    nearestAwg: nearest,
    nearestLabel: n.label,
    nearestAreaMm2: n.areaMm2,
    // A smaller AWG number is a bigger conductor, so "nearest" can be thinner
    // than what you asked for, and that is the direction that matters.
    nearestIsSmaller: n.areaMm2 < a,
  }
}

/**
 * How far an SDI signal reaches on a given coax.
 *
 * A receiver equalises a fixed amount of cable loss and then gives up. The
 * cliff is famously sharp: SDI does not degrade into a noisy picture the way
 * analogue did, it works perfectly and then stops, which is why a run that was
 * fine in the shop fails in the venue at ten metres longer.
 *
 * Two facts do the work. Coax loss rises with the square root of frequency
 * (skin effect), and the frequency that matters is half the bit rate, because
 * that is the fastest fundamental in the data:
 *
 *   loss(f) = loss(f_ref) * sqrt(f / f_ref)
 *   reach   = equalisation budget / loss at half the clock
 *
 * The attenuation figure comes off the cable's datasheet, at whatever
 * frequency the manufacturer quoted. Every coax maker publishes it. The
 * equalisation budget is the receiver's, and 20 dB is the figure SMPTE writes
 * down - real receivers often do considerably better, which is why the same
 * cable is quoted at different lengths by different people.
 */
export const SDI_RATES = {
  'sd': { label: 'SD-SDI (SMPTE 259M)', gbps: 0.27 },
  'hd': { label: 'HD-SDI (SMPTE 292M)', gbps: 1.485 },
  '3g': { label: '3G-SDI (SMPTE 424M)', gbps: 2.97 },
  '6g': { label: '6G-SDI (SMPTE ST 2081)', gbps: 5.94 },
  '12g': { label: '12G-SDI (SMPTE ST 2082)', gbps: 11.88 },
}

export function coaxReach(attenuationDbPer100m, atFrequencyMhz, opts = {}) {
  const att = Number(attenuationDbPer100m)
  const refF = Number(atFrequencyMhz)
  if (!Number.isFinite(att) || att <= 0 || !Number.isFinite(refF) || refF <= 0) return null
  const budget = Number(opts.equalisationDb ?? 20)
  if (!Number.isFinite(budget) || budget <= 0) return null
  const r1 = (x) => Math.round(x * 10) / 10

  const rates = Object.entries(SDI_RATES).map(([key, r]) => {
    // Half the clock: the highest fundamental the serial stream produces.
    const halfClockMhz = (r.gbps * 1000) / 2
    const lossPer100m = att * Math.sqrt(halfClockMhz / refF)
    const reachM = (budget / lossPer100m) * 100
    return {
      key,
      label: r.label,
      gbps: r.gbps,
      halfClockMhz: r1(halfClockMhz),
      lossDbPer100m: r1(lossPer100m),
      reachM: Math.round(reachM),
      reachFt: Math.round(reachM * 3.281),
    }
  })

  return {
    attenuationDbPer100m: att,
    atFrequencyMhz: refF,
    equalisationDb: budget,
    rates,
    // The question people actually arrive with, in the other direction.
    canRun: (metres, rateKey) => {
      const m = Number(metres)
      const rate = rates.find((r) => r.key === rateKey)
      if (!Number.isFinite(m) || m <= 0 || !rate) return null
      const loss = (m / 100) * rate.lossDbPer100m
      return {
        metres: m,
        rate: rate.label,
        lossDb: r1(loss),
        budgetDb: budget,
        marginDb: r1(budget - loss),
        ok: loss <= budget,
        // Inside 3 dB of the cliff is a run that works today and fails after
        // somebody swaps a barrel connector in.
        thin: loss <= budget && budget - loss < 3,
      }
    },
  }
}

/**
 * sRGB transfer function, both directions.
 *
 * Every colour mixing mistake in lighting has this at the bottom of it. A
 * fixture at 50% is not half the light, and two fixtures at 50% are not one
 * at 100% — not because the fixtures lie, but because the numbers people type
 * are gamma-encoded and the photons add linearly. Mixing has to happen in
 * linear light and be encoded back afterwards, and skipping that step is why
 * a naive average of two colours comes out too dark.
 */
export function srgbToLinear(c) {
  const v = Number(c) / 255
  if (!Number.isFinite(v)) return null
  const x = Math.min(1, Math.max(0, v))
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
}

export function linearToSrgb(l) {
  const v = Number(l)
  if (!Number.isFinite(v)) return null
  const x = Math.min(1, Math.max(0, v))
  const e = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
  return Math.round(e * 255)
}

/**
 * Colour mixing, and the colour of the shadows it casts.
 *
 * Two operations share the word "mixing" and they are opposites.
 *
 * ADDITIVE is what a multi-emitter LED fixture does, and what two lamps
 * pointed at the same wall do. Each source contributes its own spectrum and
 * they sum. You start at black and add. Red plus green is yellow, which is
 * the fact that makes no sense with paint and perfect sense with light.
 *
 * SUBTRACTIVE is what a CMY fixture does, and what a gel does, and what a
 * costume does. One white source passes through things that each REMOVE part
 * of the spectrum, and removal is multiplication, not addition. You start at
 * white and take away. Stack enough and you get black, which is why a deep
 * colour on a subtractive fixture is also a dim one.
 *
 * An object's reflectance behaves exactly like a filter's transmission — it
 * multiplies — which is why the same function answers "what does this gel
 * do" and "why has that red costume gone black".
 *
 * Then the shadows. This is the part people ask about and it has a completely
 * mechanical answer: a shadow is not an absence of light, it is the light
 * that still arrives. Block one of two sources and the shadow is lit by
 * everything else, so it takes the colour of the OTHER source. Two coloured
 * sources from two angles give two coloured shadows, each in the opposite
 * source's colour, and neither of them is grey.
 *
 * (There is a second, perceptual reason shadows read coloured — the visual
 * system adapts to the dominant illuminant, so a neutral shadow under a warm
 * key looks blue. That one is not arithmetic and is not modelled here.)
 */
export function colourMix(sources, mode = 'additive') {
  if (!Array.isArray(sources) || sources.length === 0) return null
  const lit = []
  for (const s of sources) {
    const r = srgbToLinear(s.r), g = srgbToLinear(s.g), b = srgbToLinear(s.b)
    if (r === null || g === null || b === null) return null
    const level = s.level === undefined ? 1 : Number(s.level)
    if (!Number.isFinite(level) || level < 0 || level > 1) return null
    lit.push({ name: s.name ?? null, level, lin: [r * level, g * level, b * level], raw: [r, g, b] })
  }

  const clamp01 = (x) => Math.min(1, Math.max(0, x))
  const encode = (v) => v.map(linearToSrgb)
  const hex = (v) => '#' + encode(v).map((n) => n.toString(16).padStart(2, '0')).join('')
  // Rec. 709 luminance weights: green carries most of the brightness, which
  // is why swapping a green emitter for an amber costs so much output.
  const luma = (v) => 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
  const r3 = (x) => Math.round(x * 1000) / 1000

  const sum = (list) => {
    const t = [0, 0, 0]
    for (const s of list) for (let i = 0; i < 3; i++) t[i] += s.lin[i]
    return t
  }

  let mixedRaw
  if (mode === 'additive') {
    mixedRaw = sum(lit)
  } else if (mode === 'subtractive') {
    // Start at white and multiply by each transmission. Level dials the
    // filter in and out: at level 0 the filter is out of the beam entirely.
    mixedRaw = [1, 1, 1]
    for (const s of lit) {
      for (let i = 0; i < 3; i++) {
        mixedRaw[i] *= 1 - s.level * (1 - s.raw[i])
      }
    }
  } else {
    return null
  }

  const over = mixedRaw.some((v) => v > 1.0001)
  const mixed = mixedRaw.map(clamp01)

  return {
    mode,
    linear: mixed.map(r3),
    rgb: encode(mixed),
    hex: hex(mixed),
    luminance: r3(luma(mixed)),
    // Clipping is a real fixture condition, not a rounding note: it means a
    // channel has run out of headroom and the hue is now shifting as you
    // push, rather than the fixture getting brighter.
    clipped: over,
    headroom: r3(1 - Math.max(...mixed)),
    /**
     * The colour of the shadow cast by an object that blocks source `index`.
     * Additive only — a shadow is about which sources reach the surface, and
     * a subtractive stack is one source with things in front of it.
     */
    shadowOf: (index) => {
      if (mode !== 'additive') return null
      const i = Number(index)
      if (!Number.isInteger(i) || i < 0 || i >= lit.length) return null
      const rest = sum(lit.filter((_, k) => k !== i)).map(clamp01)
      return {
        blocked: lit[i].name,
        linear: rest.map(r3),
        rgb: encode(rest),
        hex: hex(rest),
        luminance: r3(luma(rest)),
        // A shadow with nothing else reaching it really is black. With
        // anything else reaching it, it is that colour, not a dark grey.
        black: rest.every((v) => v < 0.002),
      }
    },
  }
}

/**
 * Mixing two or more white sources of different colour temperature.
 *
 * Colour temperature does not average in kelvin, it averages in mireds —
 * reciprocal megakelvin — because that is the scale on which equal steps look
 * equal, and it is the scale gel manufacturers print their shift values on.
 * Half of 3200 K and half of 6500 K is not 4850 K; it is about 4290 K, and
 * the difference is visible.
 *
 *   mired = 1e6 / kelvin
 *   result = 1e6 / (weighted mean of the mireds)
 *
 * The warning this returns matters more than the number. Two sources on the
 * Planckian locus mix to a point OFF it, toward green, because the locus is a
 * curve and mixing walks the straight line between two points on it. That is
 * why mixing a tungsten wash with a daylight LED gives a result that reads
 * slightly green on camera even when both sources are individually clean, and
 * why the fix is a minus-green correction rather than a colour temperature
 * change.
 */
export function mixWhites(sources) {
  if (!Array.isArray(sources) || sources.length < 1) return null
  let miredSum = 0
  let weightSum = 0
  const parts = []
  for (const s of sources) {
    const k = Number(s.cct)
    const level = s.level === undefined ? 1 : Number(s.level)
    if (!Number.isFinite(k) || k < 1000 || k > 20000) return null
    if (!Number.isFinite(level) || level < 0 || level > 1) return null
    const mired = 1e6 / k
    miredSum += mired * level
    weightSum += level
    parts.push({ cct: k, mired: Math.round(mired), level })
  }
  if (weightSum <= 0) return null
  const meanMired = miredSum / weightSum
  const result = Math.round(1e6 / meanMired)
  const kelvinAverage = Math.round(parts.reduce((n, p) => n + p.cct * p.level, 0) / weightSum)

  // How far apart the sources are, in mireds. The threshold is 30 rather than
  // some rounder number because 1/8 CTB is about 20 mireds and is the
  // smallest correction anybody stocks: a flag that fires below the smallest
  // available fix is a flag that only ever means "ignore me".
  const mireds = parts.filter((p) => p.level > 0).map((p) => p.mired)
  const spread = mireds.length > 1 ? Math.max(...mireds) - Math.min(...mireds) : 0

  return {
    parts,
    resultK: result,
    resultMired: Math.round(meanMired),
    // The number people expect, and the size of their mistake.
    naiveKelvinAverage: kelvinAverage,
    kelvinErrorIfAveraged: kelvinAverage - result,
    miredSpread: spread,
    // Mixing walks a straight line between two points on a curve, and the
    // curve bulges away from that line.
    greenShift: spread > 30,
    advice: spread > 100
      ? 'Far apart: expect a visible green cast off the Planckian locus. Correct with minus-green, not with colour temperature.'
      : spread > 30
        ? 'Mildly off the locus. Usually invisible by eye, sometimes visible on camera.'
        : 'Close enough that the mix stays on the locus.',
  }
}

/**
 * What is actually inside one LTC frame.
 *
 * Linear timecode is 80 bits per frame, sent as an audio signal, and only 26
 * of those bits are the time. The rest is 32 user bits, a handful of flags,
 * and a 16-bit sync word.
 *
 * The time is stored as BCD — binary-coded decimal — with each digit in its
 * own little field, LSB first. That is why you can read the digits straight
 * out of a bit dump without dividing anything, and it is why the tens fields
 * are the odd widths they are: frame tens only has to count to 2, so it gets
 * two bits, and seconds tens only has to reach 5, so it gets three.
 *
 * The sync word is bits 64-79 and it is 0011111111111101. Twelve consecutive
 * ones cannot occur anywhere else in the frame, because biphase mark encoding
 * guarantees a transition at every bit boundary and the data fields are
 * broken up by flags. So a reader finds the frame boundary by looking for
 * that run — and because the word is not a palindrome, whether it arrives
 * forwards or backwards also tells the reader which way the tape is moving.
 * That is why LTC can be read while shuttling in reverse.
 *
 * Bits 27, 43, 58 and 59 carry binary group flags and a polarity correction
 * bit whose assignment differs between 25 fps and 30 fps systems and between
 * revisions of SMPTE 12M. They are returned as named flag bits rather than
 * given a specific meaning here.
 */
export const LTC_SYNC_WORD = '0011111111111101'

export function ltcFrame(h, m, s, f, opts = {}) {
  const H = Number(h), M = Number(m), S = Number(s), F = Number(f)
  if (![H, M, S, F].every(Number.isInteger)) return null
  if (H < 0 || H > 23 || M < 0 || M > 59 || S < 0 || S > 59 || F < 0 || F > 29) return null

  const bits = new Array(80).fill(0)
  // Each field is written LSB first, starting at its own bit position.
  const put = (start, width, value) => {
    for (let i = 0; i < width; i++) bits[start + i] = (value >> i) & 1
  }
  const fields = [
    { name: 'frame units', start: 0, width: 4, value: F % 10 },
    { name: 'user bits 1', start: 4, width: 4, value: 0, user: true },
    { name: 'frame tens', start: 8, width: 2, value: Math.floor(F / 10) },
    { name: 'drop frame flag', start: 10, width: 1, value: opts.dropFrame ? 1 : 0, flag: true },
    { name: 'colour frame flag', start: 11, width: 1, value: opts.colourFrame ? 1 : 0, flag: true },
    { name: 'user bits 2', start: 12, width: 4, value: 0, user: true },
    { name: 'second units', start: 16, width: 4, value: S % 10 },
    { name: 'user bits 3', start: 20, width: 4, value: 0, user: true },
    { name: 'second tens', start: 24, width: 3, value: Math.floor(S / 10) },
    { name: 'flag bit', start: 27, width: 1, value: 0, flag: true },
    { name: 'user bits 4', start: 28, width: 4, value: 0, user: true },
    { name: 'minute units', start: 32, width: 4, value: M % 10 },
    { name: 'user bits 5', start: 36, width: 4, value: 0, user: true },
    { name: 'minute tens', start: 40, width: 3, value: Math.floor(M / 10) },
    { name: 'flag bit', start: 43, width: 1, value: 0, flag: true },
    { name: 'user bits 6', start: 44, width: 4, value: 0, user: true },
    { name: 'hour units', start: 48, width: 4, value: H % 10 },
    { name: 'user bits 7', start: 52, width: 4, value: 0, user: true },
    { name: 'hour tens', start: 56, width: 2, value: Math.floor(H / 10) },
    { name: 'flag bit', start: 58, width: 1, value: 0, flag: true },
    { name: 'flag bit', start: 59, width: 1, value: 0, flag: true },
    { name: 'user bits 8', start: 60, width: 4, value: 0, user: true },
  ]
  for (const fl of fields) put(fl.start, fl.width, fl.value)
  // The sync word is a fixed pattern, not a computed value.
  for (let i = 0; i < 16; i++) bits[64 + i] = Number(LTC_SYNC_WORD[i])

  const timeBits = fields.filter((x) => !x.user && !x.flag).reduce((n, x) => n + x.width, 0)
  return {
    bits,
    string: bits.join(''),
    fields: [...fields, { name: 'sync word', start: 64, width: 16, value: null, sync: true }],
    timeBits,
    userBits: 32,
    totalBits: 80,
    syncWord: LTC_SYNC_WORD,
    // 80 bits every frame, and the bit rate is what makes LTC an audio signal
    // rather than a data one: at 30 fps it is 2400 bit/s, squarely inside
    // what an analogue audio track can carry.
    bitRateAt: (fps) => {
      const r = Number(fps)
      return Number.isFinite(r) && r > 0 ? Math.round(r * 80) : null
    },
  }
}

/**
 * MIDI timecode: the same time, dribbled out over a 31 250 baud wire.
 *
 * MIDI is slow, so MTC does not send a whole timecode value per frame. It
 * sends a quarter-frame message eight times, each carrying four bits, and
 * eight quarter-frames at four per frame takes TWO frames to complete.
 *
 * That is the fact everybody trips over: a running MTC reader is always two
 * frames behind the transmitter, and a receiver that does not add the offset
 * back is quietly two frames out on every cue. It is also why MTC has a
 * separate full-frame message for locating, used when transport is stopped:
 * there is nothing to be two frames behind of.
 *
 *   F1 0nnndddd    nnn = which of the 8 pieces, dddd = the 4 data bits
 *
 * Piece 7 carries the top hours bit AND the frame rate, which is why the rate
 * is only known once the whole sequence has arrived.
 */
export const MTC_RATES = { '24': 0, '25': 1, '29.97df': 2, '30': 3 }

export function mtcQuarterFrames(h, m, s, f, rate = '25') {
  const H = Number(h), M = Number(m), S = Number(s), F = Number(f)
  if (![H, M, S, F].every(Number.isInteger)) return null
  if (H < 0 || H > 23 || M < 0 || M > 59 || S < 0 || S > 59 || F < 0 || F > 29) return null
  const rateCode = MTC_RATES[rate]
  if (rateCode === undefined) return null

  const nibbles = [
    { piece: 0, label: 'frame low', value: F & 0x0f },
    { piece: 1, label: 'frame high', value: (F >> 4) & 0x0f },
    { piece: 2, label: 'second low', value: S & 0x0f },
    { piece: 3, label: 'second high', value: (S >> 4) & 0x0f },
    { piece: 4, label: 'minute low', value: M & 0x0f },
    { piece: 5, label: 'minute high', value: (M >> 4) & 0x0f },
    { piece: 6, label: 'hour low', value: H & 0x0f },
    { piece: 7, label: 'hour high + rate', value: ((rateCode << 1) | ((H >> 4) & 0x01)) & 0x0f },
  ]
  const hex = (n) => n.toString(16).toUpperCase().padStart(2, '0')
  const messages = nibbles.map((n) => ({
    ...n,
    data: (n.piece << 4) | n.value,
    hex: `F1 ${hex((n.piece << 4) | n.value)}`,
  }))

  // Full frame, for locating while stopped: hours carries the rate in bits 5-6.
  const fullFrame = ['F0', '7F', '7F', '01', '01', hex((rateCode << 5) | H), hex(M), hex(S), hex(F), 'F7']

  return {
    rate,
    rateCode,
    messages,
    // Eight pieces at four per frame. This is the two-frame lag, stated as
    // arithmetic rather than as folklore.
    piecesPerFrame: 4,
    framesToComplete: 2,
    fullFrame: fullFrame.join(' '),
    // What the wire actually costs: 2 bytes per quarter frame, 4 per frame.
    bytesPerSecondAt: (fps) => {
      const r = Number(fps)
      return Number.isFinite(r) && r > 0 ? Math.round(r * 4 * 2) : null
    },
  }
}

/**
 * Reading MIDI as hex bytes.
 *
 * One rule does all the parsing: a status byte has its top bit set (0x80 to
 * 0xFF) and a data byte does not (0x00 to 0x7F). That is the whole framing
 * mechanism — there is no packet header, no length field and no checksum, so
 * a receiver that joins a stream mid-message resynchronises on the next byte
 * with the high bit set.
 *
 * For channel messages the high nibble is the command and the low nibble is
 * the channel, zero-based on the wire and displayed one-based by nearly every
 * piece of software, which is the off-by-one everybody meets once.
 *
 * Running status is the compression: if the status byte would be the same as
 * the last one, it can be left out and only the data bytes sent. It is why a
 * dump of a busy MIDI stream has long runs with no status byte in sight, and
 * why "note on with velocity 0" exists as a note off — it lets a whole
 * passage of notes on and off share one 0x9n status byte.
 */
export const MIDI_CHANNEL = {
  0x8: { name: 'Note Off', data: 2, fields: ['note', 'velocity'] },
  0x9: { name: 'Note On', data: 2, fields: ['note', 'velocity'] },
  0xa: { name: 'Poly Aftertouch', data: 2, fields: ['note', 'pressure'] },
  0xb: { name: 'Control Change', data: 2, fields: ['controller', 'value'] },
  0xc: { name: 'Program Change', data: 1, fields: ['program'] },
  0xd: { name: 'Channel Aftertouch', data: 1, fields: ['pressure'] },
  0xe: { name: 'Pitch Bend', data: 2, fields: ['LSB', 'MSB'] },
}

export const MIDI_SYSTEM = {
  0xf1: { name: 'MTC Quarter Frame', data: 1 },
  0xf2: { name: 'Song Position Pointer', data: 2 },
  0xf3: { name: 'Song Select', data: 1 },
  0xf6: { name: 'Tune Request', data: 0 },
  0xf8: { name: 'Timing Clock', data: 0 },
  0xfa: { name: 'Start', data: 0 },
  0xfb: { name: 'Continue', data: 0 },
  0xfc: { name: 'Stop', data: 0 },
  0xfe: { name: 'Active Sensing', data: 0 },
  0xff: { name: 'System Reset', data: 0 },
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** Note number to name. Middle C = 60 = C3 in the Yamaha convention used here. */
export function midiNoteName(n) {
  const v = Number(n)
  if (!Number.isInteger(v) || v < 0 || v > 127) return null
  return `${NOTE_NAMES[v % 12]}${Math.floor(v / 12) - 2}`
}

export function midiDecode(input) {
  if (typeof input !== 'string') return null
  const bytes = []
  for (const tok of input.replace(/0x/gi, ' ').split(/[\s,;:]+/)) {
    if (!tok) continue
    if (!/^[0-9a-fA-F]{1,2}$/.test(tok)) return { error: `"${tok}" is not a hex byte`, messages: [] }
    bytes.push(parseInt(tok, 16))
  }
  if (!bytes.length) return { error: null, messages: [], bytes: 0 }

  const hex = (n) => n.toString(16).toUpperCase().padStart(2, '0')
  const messages = []
  let running = null
  let i = 0

  while (i < bytes.length) {
    let status = bytes[i]
    let usedRunning = false
    if (status < 0x80) {
      // No status byte here: running status, or junk before the first one.
      if (running === null) {
        messages.push({ raw: [hex(status)], name: 'orphan data byte', detail: 'No status byte has been seen yet, so this cannot be interpreted. A receiver would discard it.', error: true })
        i++
        continue
      }
      status = running
      usedRunning = true
    } else {
      i++
      // Only channel messages set running status; system messages clear it,
      // except realtime bytes, which may appear inside another message and
      // must not disturb it.
      if (status < 0xf0) running = status
      else if (status < 0xf8) running = null
    }

    if (status === 0xf0) {
      const start = i
      while (i < bytes.length && bytes[i] !== 0xf7) i++
      const body = bytes.slice(start, i)
      const terminated = bytes[i] === 0xf7
      if (terminated) i++
      messages.push({
        raw: ['F0', ...body.map(hex), ...(terminated ? ['F7'] : [])],
        name: 'System Exclusive',
        detail: sysexDetail(body),
        error: !terminated,
        ...(terminated ? {} : { note: 'unterminated: no F7' }),
      })
      continue
    }

    const high = status >> 4
    const spec = MIDI_CHANNEL[high] ?? MIDI_SYSTEM[status]
    if (!spec) {
      messages.push({ raw: [hex(status)], name: `undefined status ${hex(status)}`, detail: 'Not a defined MIDI message.', error: true })
      continue
    }

    const data = []
    for (let k = 0; k < spec.data; k++) {
      if (i >= bytes.length || bytes[i] >= 0x80) break
      data.push(bytes[i]); i++
    }
    const short = data.length < spec.data
    const raw = [...(usedRunning ? [] : [hex(status)]), ...data.map(hex)]

    messages.push({
      raw,
      status: hex(status),
      name: spec.name,
      channel: high >= 0x8 && high <= 0xe ? (status & 0x0f) + 1 : null,
      data,
      runningStatus: usedRunning,
      error: short,
      detail: short ? `Truncated: expected ${spec.data} data byte${spec.data === 1 ? '' : 's'}, got ${data.length}.`
        : channelDetail(high, status, data),
    })
  }

  return { error: null, bytes: bytes.length, messages }
}

export function channelDetail(high, status, d) {
  const ch = (status & 0x0f) + 1
  if (high === 0x9 && d[1] === 0) {
    return `Note ${midiNoteName(d[0])} (${d[0]}) off on channel ${ch} — a Note On at velocity 0 is a Note Off, which is what lets a whole passage share one status byte under running status.`
  }
  if (high === 0x8 || high === 0x9) {
    return `Note ${midiNoteName(d[0])} (${d[0]}) ${high === 0x9 ? 'on' : 'off'}, channel ${ch}, velocity ${d[1]}.`
  }
  if (high === 0xb) return `Controller ${d[0]} set to ${d[1]} on channel ${ch}.`
  if (high === 0xc) return `Program ${d[0]} (often shown as ${d[0] + 1}) on channel ${ch}.`
  if (high === 0xa) return `Pressure ${d[1]} on note ${midiNoteName(d[0])} (${d[0]}), channel ${ch}.`
  if (high === 0xd) return `Channel pressure ${d[0]} on channel ${ch}.`
  if (high === 0xe) {
    const v = (d[1] << 7) | d[0]
    return `Pitch bend ${v} of 16383, centre 8192 — 14 bits sent LSB first, so the value is (MSB << 7) | LSB.`
  }
  if (status === 0xf1) {
    const piece = (d[0] >> 4) & 0x07
    const nibble = d[0] & 0x0f
    const labels = ['frame low', 'frame high', 'second low', 'second high', 'minute low', 'minute high', 'hour low', 'hour high + rate']
    return `MTC piece ${piece} of 8 — ${labels[piece]}, value ${nibble}. Eight of these make one timecode value and take two frames to arrive.`
  }
  if (status === 0xf2) {
    const v = (d[1] << 7) | d[0]
    return `Song position ${v} sixteenth notes from the start — 14 bits, LSB first.`
  }
  return null
}

/**
 * MIDI Show Control command formats and commands.
 *
 * Only the values this repository already carries a source for, on the
 * `midi-show-control` protocol entry. Everything else decodes as its raw
 * number rather than being guessed at — a show-control decoder that
 * confidently mislabels a command is worse than one that says "0x14".
 */
export const MSC_FORMATS = { 0x01: 'Lighting (General)', 0x02: 'Moving Lights', 0x7f: 'All-types' }
export const MSC_COMMANDS = { 0x01: 'GO', 0x02: 'STOP', 0x03: 'RESUME' }

export function sysexDetail(body) {
  if (body[0] === 0x7f && body[2] === 0x02) {
    const fmt = MSC_FORMATS[body[3]] ?? `format 0x${(body[3] ?? 0).toString(16).toUpperCase()}`
    const cmd = MSC_COMMANDS[body[4]] ?? `command 0x${(body[4] ?? 0).toString(16).toUpperCase()}`
    // Cue data is ASCII digits with 0x00 between cue number, list and path.
    const parts = []
    let cur = ''
    for (const byte of body.slice(5)) {
      if (byte === 0x00) { parts.push(cur); cur = '' } else cur += String.fromCharCode(byte)
    }
    if (cur) parts.push(cur)
    const [number, list, path] = parts
    const cue = number
      ? ` Cue ${number}${list ? ` in list ${list}` : ''}${path ? `, path ${path}` : ''}.`
      : ''
    const device = body[1] === 0x7f ? 'all-call (127)' : body[1]
    return `MIDI Show Control: ${cmd} to ${fmt}, device ${device}.${cue}`
      + (body[1] === 0x7f ? ' All-call means every receiver acts on this, whatever its device ID.' : '')
  }
  if (body[0] === 0x7f && body[2] === 0x01 && body[3] === 0x01) {
    return 'Universal realtime, MTC full frame — the locate message used when transport is stopped, carrying a whole timecode value at once.'
  }
  if (body[0] === 0x7e) return 'Universal non-realtime.'
  return `Manufacturer ${body[0] === undefined ? '?' : '0x' + body[0].toString(16).toUpperCase()}, ${Math.max(0, body.length - 1)} data bytes.`
}

/**
 * Pepper's ghost: the brightness problem, not the geometry problem.
 *
 * Everybody who builds one of these gets the geometry right and the contrast
 * wrong. A pane of glass or foil is set between the audience and the scene;
 * a hidden object, usually below and lit hard, reflects in it and appears to
 * be standing in the space. The reflection is real optics and the position is
 * easy — the image sits as far behind the pane as the object is in front.
 *
 * What decides whether it reads as a solid figure or as a smear on a window
 * is a ratio of two luminances arriving at the same retina:
 *
 *   ghost      = object luminance      x pane reflectance
 *   background = background luminance  x pane transmittance
 *
 * A ghost is solid when the first is far larger than the second, which is why
 * the hidden object is lit like a rock star and the space behind the ghost is
 * kept as dark as the design will allow. Turning the ghost up is only one of
 * the two available moves, and it is usually the harder one.
 *
 * Uncoated glass reflects about 8% of what hits it, which is why plain glass
 * needs a very dark background. Purpose-made foil runs far higher and buys
 * you a lit set behind the ghost.
 */
export function peppersGhost(opts = {}) {
  const objectLuminance = Number(opts.objectLuminance ?? 1000)
  const backgroundLuminance = Number(opts.backgroundLuminance ?? 50)
  const reflectance = Number(opts.reflectance ?? 0.08)
  if (!Number.isFinite(objectLuminance) || objectLuminance < 0) return null
  if (!Number.isFinite(backgroundLuminance) || backgroundLuminance < 0) return null
  if (!Number.isFinite(reflectance) || reflectance <= 0 || reflectance >= 1) return null
  // What the pane does not reflect or absorb, it passes. Absorption is small
  // in a good pane and is folded in here as an option rather than ignored.
  const absorption = Number(opts.absorption ?? 0)
  if (!Number.isFinite(absorption) || absorption < 0 || absorption + reflectance >= 1) return null
  const transmittance = 1 - reflectance - absorption
  const r2 = (x) => Math.round(x * 100) / 100

  const ghost = objectLuminance * reflectance
  const background = backgroundLuminance * transmittance
  const ratio = background > 0 ? ghost / background : Infinity

  return {
    reflectance,
    transmittance: r2(transmittance),
    ghostLuminance: r2(ghost),
    backgroundLuminance: r2(background),
    contrastRatio: background > 0 ? r2(ratio) : null,
    // Rough bands, and they are judgement rather than measurement: below
    // parity the ghost is a suggestion, and it takes a good multiple before
    // an audience stops seeing through it.
    reads: ratio >= 4 ? 'solid' : ratio >= 1.5 ? 'translucent' : 'barely there',
    /** How bright the hidden object has to be for a target contrast ratio. */
    objectLuminanceFor: (targetRatio) => {
      const t = Number(targetRatio)
      if (!Number.isFinite(t) || t <= 0) return null
      return Math.round((t * backgroundLuminance * transmittance) / reflectance)
    },
    /**
     * How dark the background has to be instead. Almost always the cheaper
     * move, and the one people reach for last.
     */
    backgroundLuminanceFor: (targetRatio) => {
      const t = Number(targetRatio)
      if (!Number.isFinite(t) || t <= 0 || transmittance <= 0) return null
      return Math.round((objectLuminance * reflectance) / (t * transmittance) * 100) / 100
    },
  }
}

/**
 * Forced perspective: the size an object has to be to read as another size.
 *
 * Two things look the same size when they subtend the same angle at the eye,
 * and angle is size over distance. So an object twice as far away has to be
 * twice as big to match, and the whole trick is that arithmetic:
 *
 *   apparent size = 2 * atan(size / (2 * distance))
 *   to match:      size2 = size1 * (distance2 / distance1)
 *
 * What the arithmetic does not tell you is where it stops working, and that
 * is the more useful half. Angular size is one depth cue among many. Inside
 * roughly ten metres, binocular disparity reports the true distance and
 * simply overrules it, which is why a forced-perspective set that is perfect
 * in a photograph collapses for the front row. Motion parallax does the same
 * job for anybody who moves their head.
 *
 * So the technique is really a statement about the audience: it works for one
 * viewpoint, at a distance, for people who hold still — a camera, or a seat
 * you can name.
 */
export const STEREO_LIMIT_M = 10

export function forcedPerspective(realSize, realDistance, targetDistance, opts = {}) {
  const s = Number(realSize)
  const d1 = Number(realDistance)
  const d2 = Number(targetDistance)
  if (![s, d1, d2].every((n) => Number.isFinite(n) && n > 0)) return null
  const r2 = (x) => Math.round(x * 100) / 100
  const deg = (rad) => (rad * 180) / Math.PI

  const angularRad = 2 * Math.atan(s / (2 * d1))
  const requiredSize = s * (d2 / d1)

  // Binocular disparity resolves depth well out to roughly this range for a
  // typical interocular distance; past it the two eyes agree and stop
  // contradicting the size cue. It is a soft edge rather than a threshold,
  // which is why it is an option and not a constant buried in the maths.
  const stereoLimitM = Number(opts.stereoLimitM ?? STEREO_LIMIT_M)
  if (!Number.isFinite(stereoLimitM) || stereoLimitM < 0) return null
  return {
    realSize: s,
    realDistanceM: d1,
    targetDistanceM: d2,
    angularSizeDeg: r2(deg(angularRad)),
    requiredSize: r2(requiredSize),
    scaleFactor: r2(d2 / d1),
    // The honest part: where the trick stops working.
    stereoLimitM,
    disparityWillBetrayIt: Math.min(d1, d2) < stereoLimitM,
    note: Math.min(d1, d2) < stereoLimitM
      ? 'Inside the stereo range: two eyes will report the true distance and overrule the size cue. This works in a photograph and fails for a live front row.'
      : 'Beyond the useful range of binocular disparity, so angular size is doing the work unopposed. Motion parallax still betrays it if the viewer moves.',
    /** The reverse question: at what distance does an object of this size match? */
    distanceToMatch: (otherSize) => {
      const o = Number(otherSize)
      if (!Number.isFinite(o) || o <= 0) return null
      return r2(d1 * (o / s))
    },
  }
}


/**
 * DMX512 frame timing, and what RDM costs you.
 *
 * DMX is a fixed-rate serial stream and its refresh rate is not a setting —
 * it falls out of the arithmetic. 250 kbit/s, 8 data bits with one start and
 * two stop bits, so eleven bits on the wire per slot:
 *
 *   slot time  = 11 / 250000 = 44 us
 *   frame time = break + mark-after-break + (1 + slots) x 44 us
 *
 * The extra slot is the start code, which is why a "512 channel" frame is
 * really 513 slots. A full frame comes to about 22.7 ms, giving the familiar
 * ~44 Hz ceiling, and the only way to go faster is to send fewer slots.
 *
 * RDM shares this wire by taking turns on it. Every transaction — request out,
 * line released, response back — is time the transmitter is not sending
 * levels, so heavy discovery or continuous sensor polling really does slow the
 * rig down. That is not a superstition, it is subtraction, and this is the
 * subtraction.
 *
 * The turnaround figure is an input rather than a constant because it is the
 * part that varies: E1.20 specifies windows, and real gateways, splitters and
 * USB dongles sit at different places inside them.
 */
export function dmxFrameTime(slots = 512, opts = {}) {
  const n = Number(slots)
  if (!Number.isInteger(n) || n < 0 || n > 512) return null
  const breakUs = Number(opts.breakUs ?? 92)
  const mabUs = Number(opts.markAfterBreakUs ?? 12)
  const bitRate = Number(opts.bitRate ?? 250000)
  if (![breakUs, mabUs, bitRate].every((x) => Number.isFinite(x) && x > 0)) return null
  const r2 = (x) => Math.round(x * 100) / 100

  // Eleven bits per slot: one start, eight data, two stop.
  const slotUs = (11 / bitRate) * 1e6
  // The start code is a slot too, which is why 512 channels is 513 slots.
  const frameUs = breakUs + mabUs + (n + 1) * slotUs

  return {
    slots: n,
    slotUs: r2(slotUs),
    breakUs,
    markAfterBreakUs: mabUs,
    frameUs: r2(frameUs),
    frameMs: r2(frameUs / 1000),
    refreshHz: r2(1e6 / frameUs),
    // The one lever there is: a partial frame is a faster frame.
    atSlots: (other) => {
      const o = Number(other)
      if (!Number.isInteger(o) || o < 0 || o > 512) return null
      const us = breakUs + mabUs + (o + 1) * slotUs
      return { slots: o, frameMs: r2(us / 1000), refreshHz: r2(1e6 / us) }
    },
  }
}

/**
 * The cost of RDM traffic on a DMX line, in refresh rate.
 *
 * An RDM packet is 25 bytes of overhead plus its parameter data: start code,
 * sub-start code, message length, destination and source UIDs at six bytes
 * each, transaction number, port ID or response type, message count,
 * sub-device, command class, PID, parameter data length, and a two-byte
 * checksum. At 44 us a byte that is about 1.1 ms before anything useful is
 * carried.
 *
 * A transaction is a request out and a response back with the line turned
 * around in between, and all of it displaces level data. The result is the
 * answer to a question people ask every production: why did the rig get
 * sluggish when somebody turned sensor polling on.
 */
export const RDM_OVERHEAD_BYTES = 25

export function rdmOverhead(transactionsPerSecond, opts = {}) {
  const tps = Number(transactionsPerSecond)
  if (!Number.isFinite(tps) || tps < 0) return null
  const requestPdl = Number(opts.requestPdl ?? 0)
  const responsePdl = Number(opts.responsePdl ?? 8)
  const turnaroundUs = Number(opts.turnaroundUs ?? 400)
  const slots = Number(opts.slots ?? 512)
  if (![requestPdl, responsePdl, turnaroundUs].every((x) => Number.isFinite(x) && x >= 0)) return null
  if (requestPdl > 231 || responsePdl > 231) return null
  const frame = dmxFrameTime(slots, opts)
  if (!frame) return null
  const r2 = (x) => Math.round(x * 100) / 100

  const requestUs = (RDM_OVERHEAD_BYTES + requestPdl) * frame.slotUs
  const responseUs = (RDM_OVERHEAD_BYTES + responsePdl) * frame.slotUs
  // Two turnarounds: the controller releasing the line, and taking it back.
  const transactionUs = requestUs + responseUs + turnaroundUs * 2

  const rdmUsPerSecond = transactionUs * tps
  const leftUsPerSecond = Math.max(0, 1e6 - rdmUsPerSecond)
  const framesPerSecond = leftUsPerSecond / frame.frameUs

  return {
    transactionsPerSecond: tps,
    requestUs: r2(requestUs),
    responseUs: r2(responseUs),
    turnaroundUs,
    transactionMs: r2(transactionUs / 1000),
    // What share of the wire RDM is holding.
    wirePercent: r2((rdmUsPerSecond / 1e6) * 100),
    baseRefreshHz: frame.refreshHz,
    refreshHz: r2(framesPerSecond),
    lostHz: r2(frame.refreshHz - framesPerSecond),
    // Past this the line has no room for level data at all, which is what a
    // runaway discovery actually looks like from the fixture's end.
    saturated: rdmUsPerSecond >= 1e6,
  }
}

/**
 * An RDM UID, taken apart.
 *
 * Forty-eight bits: a 16-bit ESTA manufacturer ID and a 32-bit device ID,
 * written mmmm:dddddddd. Devices are addressed by this rather than by DMX
 * address, which is the point — a fixture can be found and interrogated
 * before anybody knows what address it is on, or when two fixtures are
 * sitting on the same one.
 *
 * Two ranges are not ordinary UIDs and both matter in the field.
 * FFFF:FFFFFFFF is the broadcast to everything, and mmmm:FFFFFFFF is the
 * broadcast to every device from one manufacturer. And manufacturer IDs from
 * 8000h up are reserved for the dynamic UIDs E1.33 hands out, so a device
 * showing one of those cannot be identified by manufacturer from its UID at
 * all.
 */
export function rdmUid(input) {
  if (typeof input !== 'string') return null
  const cleaned = input.trim().replace(/[\s_]/g, '')
  const m = /^([0-9a-fA-F]{4})[:-]?([0-9a-fA-F]{8})$/.exec(cleaned)
  if (!m) return null
  const manufacturer = parseInt(m[1], 16)
  const device = parseInt(m[2], 16)
  const hex4 = manufacturer.toString(16).toUpperCase().padStart(4, '0')
  const hex8 = device.toString(16).toUpperCase().padStart(8, '0')

  const allDevices = device === 0xffffffff
  const allManufacturers = manufacturer === 0xffff
  const dynamic = manufacturer >= 0x8000 && manufacturer !== 0xffff

  return {
    uid: `${hex4}:${hex8}`,
    manufacturerId: manufacturer,
    manufacturerHex: hex4,
    deviceId: device,
    deviceHex: hex8,
    broadcast: allDevices,
    scope: allManufacturers && allDevices ? 'all devices, all manufacturers'
      : allDevices ? `all devices from manufacturer ${hex4}`
        : 'a single device',
    // 8000h and up belongs to E1.33's dynamic allocation, so the usual
    // "look the manufacturer up in the ESTA registry" step does not apply.
    dynamicUid: dynamic,
    identifiableByManufacturer: !dynamic && !allManufacturers,
    note: dynamic
      ? 'Manufacturer IDs 8000h-FFFFh are reserved for E1.33 RDMnet dynamic UIDs. This one names no manufacturer.'
      : allManufacturers
        ? 'FFFFh is the broadcast manufacturer, not a real one.'
        : 'Look the manufacturer ID up in the ESTA registry to name it.',
  }
}

/**
 * Total harmonic distortion, and the conductor it fills up.
 *
 * A perfect load draws a sine wave. Nothing on a rig does. Switch-mode
 * supplies — every LED fixture, every media server, every amplifier — draw
 * current in short spikes near the voltage peak, and a spiky current is a
 * sine plus a set of harmonics at multiples of the mains frequency.
 *
 * THD is how much of the current is not the fundamental:
 *
 *   THD-F = sqrt(sum of harmonic^2) / fundamental      referenced to the fundamental
 *   THD-R = sqrt(sum of harmonic^2) / total RMS        referenced to the total
 *
 * Both are in use and they are not interchangeable, which is why a meter and
 * a datasheet can disagree while both are right. THD-F is the common one in
 * power work and is unbounded; THD-R can never exceed 100%.
 *
 * The reason this matters on a show rather than in a textbook is the third
 * harmonic and its odd multiples. On a three-phase supply the fundamentals
 * are 120 degrees apart and cancel in the neutral, but the triplens — 3rd,
 * 9th, 15th — arrive in phase on all three legs and ADD there instead. A
 * perfectly balanced rig full of LED fixtures can put more current down the
 * neutral than any phase is carrying, and the neutral is the one conductor
 * with no breaker in it.
 *
 * Harmonics are given as amplitudes relative to the fundamental, starting at
 * the 2nd: [h2, h3, h4, ...]. A value of 0.3 at h3 means the third harmonic
 * is 30% of the fundamental.
 */
export function thd(harmonics, opts = {}) {
  if (!Array.isArray(harmonics) || harmonics.length === 0) return null
  const h = harmonics.map(Number)
  if (!h.every((x) => Number.isFinite(x) && x >= 0)) return null
  const fundamentalAmps = Number(opts.fundamentalAmps ?? 0)
  if (!Number.isFinite(fundamentalAmps) || fundamentalAmps < 0) return null
  const r2 = (x) => Math.round(x * 100) / 100

  // Index 0 is the 2nd harmonic, so order n sits at index n - 2.
  const orderOf = (i) => i + 2
  const sumSq = h.reduce((n, x) => n + x * x, 0)
  const harmonicRms = Math.sqrt(sumSq)
  const totalRms = Math.sqrt(1 + sumSq)

  const thdF = harmonicRms
  const thdR = harmonicRms / totalRms

  // Triplens: orders divisible by three. These are the ones that add in the
  // neutral instead of cancelling.
  const triplenSumSq = h.reduce((n, x, i) => (orderOf(i) % 3 === 0 ? n + x * x : n), 0)
  const triplenRms = Math.sqrt(triplenSumSq)

  // Distortion power factor. Even at unity displacement, distortion alone
  // drags the true power factor down - which is why a rig of LED fixtures can
  // present a poor power factor with nothing inductive anywhere in it.
  const distortionPf = 1 / totalRms

  return {
    thdF: r2(thdF * 100),
    thdR: r2(thdR * 100),
    harmonicRms: r2(harmonicRms),
    totalRmsPerUnitFundamental: r2(totalRms),
    distortionPowerFactor: Math.round(distortionPf * 1000) / 1000,
    triplenShare: r2(triplenRms * 100),
    /**
     * Neutral current on a balanced three-phase load. The fundamentals
     * cancel; the triplens arrive in phase and sum to three times the
     * per-phase triplen current.
     */
    neutral: fundamentalAmps > 0
      ? (() => {
        const perPhaseTriplen = fundamentalAmps * triplenRms
        const neutralAmps = 3 * perPhaseTriplen
        const phaseAmps = fundamentalAmps * totalRms
        return {
          phaseAmps: r2(phaseAmps),
          neutralAmps: r2(neutralAmps),
          ratio: phaseAmps > 0 ? r2(neutralAmps / phaseAmps) : null,
          // The condition nobody expects and nothing protects against.
          exceedsPhase: neutralAmps > phaseAmps,
        }
      })()
      : null,
    // A short read on where this sits. The 5% figure is the limit commonly
    // written into supply agreements and equipment specifications; it is a
    // threshold people cite rather than a law of nature.
    verdict: thdF <= 0.05 ? 'clean' : thdF <= 0.2 ? 'ordinary for a modern rig' : 'high — check the neutral and the power factor',
  }
}

/**
 * Crest factor: peak divided by RMS.
 *
 * A pure sine is 1.414. A switch-mode supply drawing in spikes runs 2 to 3,
 * and a generator or UPS sized on RMS alone will clip those peaks even though
 * the average is well inside its rating. It is the same distortion described
 * from the other side, and it is the number that explains why a genset that
 * is comfortably big enough still misbehaves.
 */
export function crestFactor(peak, rms) {
  const p = Number(peak), r = Number(rms)
  if (!Number.isFinite(p) || p < 0 || !Number.isFinite(r) || r <= 0) return null
  const cf = p / r
  return {
    peak: p,
    rms: r,
    crestFactor: Math.round(cf * 1000) / 1000,
    sineReference: 1.414,
    // Above about 2 the peaks are what sizes the source, not the average.
    peakLimited: cf > 2,
    note: cf <= 1.5 ? 'Near-sinusoidal.'
      : cf <= 2.2 ? 'Typical of a mixed rig with power factor correction.'
        : 'Spiky. Size the source on the peaks, not the RMS — a supply that is comfortably large on paper will still clip these.',
  }
}

/* ===========================================================================
 * Wire formats: building the actual bytes.
 *
 * Everything below produces the exact octets a protocol puts on the wire.
 * That is useful for three different jobs — checking what a device should be
 * sending, building a test packet by hand, and understanding a capture — and
 * it is honest about the one thing it cannot do, which is send them. A
 * browser cannot open a raw TCP or UDP socket. What it can do is hand you the
 * bytes, and for MIDI it can genuinely transmit, because Web MIDI exists.
 * ======================================================================== */

const enc = new TextEncoder()
const toHex = (bytes) => [...bytes].map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')

/**
 * OSC 1.0 message encoding.
 *
 * Four rules and everything follows. Strings are null-terminated and then
 * padded with more nulls until the length is a multiple of four. Numbers are
 * big-endian. The type tag string starts with a comma and names each argument
 * in order. And the whole message is a multiple of four bytes, always, which
 * is why an OSC packet dump is full of trailing zeros that mean nothing.
 *
 * Argument types: i (int32), f (float32), s (string), b (blob),
 * T (true), F (false), N (null) and I (impulse) — the last four carry a tag
 * and no bytes at all, which surprises people reading a capture.
 */
export function oscMessage(address, args = []) {
  if (typeof address !== 'string' || !address.startsWith('/')) return null
  if (!Array.isArray(args)) return null

  const padded = (str) => {
    const raw = enc.encode(str)
    // Null terminator, then nulls up to the next multiple of four.
    const len = raw.length + 1
    const out = new Uint8Array(Math.ceil(len / 4) * 4)
    out.set(raw)
    return out
  }

  const tags = [',']
  const chunks = []
  for (const a of args) {
    if (a && typeof a === 'object' && a.type) {
      const t = a.type
      if (t === 'T' || t === 'F' || t === 'N' || t === 'I') { tags.push(t); continue }
      if (t === 'i') {
        const v = Number(a.value)
        if (!Number.isInteger(v)) return null
        const b = new Uint8Array(4)
        new DataView(b.buffer).setInt32(0, v, false)
        tags.push('i'); chunks.push(b); continue
      }
      if (t === 'f') {
        const v = Number(a.value)
        if (!Number.isFinite(v)) return null
        const b = new Uint8Array(4)
        new DataView(b.buffer).setFloat32(0, v, false)
        tags.push('f'); chunks.push(b); continue
      }
      if (t === 's') { tags.push('s'); chunks.push(padded(String(a.value))); continue }
      if (t === 'b') {
        const raw = a.value instanceof Uint8Array ? a.value : enc.encode(String(a.value))
        const size = new Uint8Array(4)
        new DataView(size.buffer).setInt32(0, raw.length, false)
        const body = new Uint8Array(Math.ceil(raw.length / 4) * 4)
        body.set(raw)
        tags.push('b'); chunks.push(size, body); continue
      }
      return null
    }
    // Bare values: integers are ints, everything else numeric is a float,
    // and anything else is a string. Guessing is a convenience, not a rule.
    if (typeof a === 'number') {
      const b = new Uint8Array(4)
      if (Number.isInteger(a)) { new DataView(b.buffer).setInt32(0, a, false); tags.push('i') }
      else { new DataView(b.buffer).setFloat32(0, a, false); tags.push('f') }
      chunks.push(b); continue
    }
    tags.push('s'); chunks.push(padded(String(a)))
  }

  const addr = padded(address)
  const tagBytes = padded(tags.join(''))
  const total = addr.length + tagBytes.length + chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(total)
  let o = 0
  out.set(addr, o); o += addr.length
  out.set(tagBytes, o); o += tagBytes.length
  for (const c of chunks) { out.set(c, o); o += c.length }

  return {
    address,
    typeTags: tags.join(''),
    bytes: out,
    hex: toHex(out),
    length: out.length,
    // Every OSC message is a multiple of four bytes. If yours is not, it is
    // not an OSC message.
    aligned: out.length % 4 === 0,
    // The default transport, and the reason ordering is not guaranteed.
    transport: 'UDP, commonly port 8000, 9000 or whatever the device says',
  }
}

/**
 * MD5, needed for PJLink authentication and for nothing else here.
 *
 * PJLink's auth is a challenge: the projector greets you with a random
 * 8-digit hex number, and the client prepends the MD5 of that number
 * concatenated with the password to its first command. Without this the
 * builder could only produce commands for projectors with security off,
 * which is not the interesting case.
 */
export function md5(message) {
  if (typeof message !== 'string') return null
  const msg = enc.encode(message)
  const K = new Int32Array(64)
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296)
  const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21]

  const bitLen = msg.length * 8
  const withPad = new Uint8Array(((msg.length + 8) >> 6 << 6) + 64)
  withPad.set(msg)
  withPad[msg.length] = 0x80
  const dv = new DataView(withPad.buffer)
  dv.setUint32(withPad.length - 8, bitLen >>> 0, true)
  dv.setUint32(withPad.length - 4, Math.floor(bitLen / 4294967296), true)

  let [a0, b0, c0, d0] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476]
  const rotl = (x, c) => (x << c) | (x >>> (32 - c))

  for (let chunk = 0; chunk < withPad.length; chunk += 64) {
    const M = new Uint32Array(16)
    for (let i = 0; i < 16; i++) M[i] = dv.getUint32(chunk + i * 4, true)
    let [A, B, C, D] = [a0, b0, c0, d0]
    for (let i = 0; i < 64; i++) {
      let F, g
      if (i < 16) { F = (B & C) | (~B & D); g = i }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16 }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16 }
      else { F = C ^ (B | ~D); g = (7 * i) % 16 }
      F = (F + A + K[i] + M[g]) | 0
      A = D; D = C; C = B
      B = (B + rotl(F, S[i])) | 0
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0
  }

  const le = (n) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]
    .map((b) => b.toString(16).padStart(2, '0')).join('')
  return le(a0) + le(b0) + le(c0) + le(d0)
}

/**
 * PJLink class 1, the projector control protocol nearly every manufacturer
 * implements and nearly nobody documents in their own manual.
 *
 * TCP port 4352. A command is one line:
 *
 *   %1POWR 1\r        set power on
 *   %1POWR ?\r        ask the power state
 *
 * Per cent, class number, four upper-case letters, a space, the parameter,
 * carriage return. Responses come back the same shape with an equals sign,
 * and ERR1 to ERR4 mean undefined command, out of parameter, unavailable
 * time, and projector failure.
 *
 * Authentication is a challenge. On connect the projector sends
 * "PJLINK 1 <8 hex digits>" and the client prepends MD5(digits + password)
 * to its first command, as 32 lower-case hex characters and nothing else —
 * no separator. "PJLINK 0" means security is off and you send commands
 * straight away.
 */
export const PJLINK_COMMANDS = {
  POWR: { label: 'Power', set: '0 = off, 1 = on', query: '0 off, 1 on, 2 cooling, 3 warming' },
  INPT: { label: 'Input select', set: '11-19 RGB, 21-29 video, 31-39 digital, 41-49 storage, 51-59 network', query: 'current input' },
  AVMT: { label: 'AV mute', set: '11/10 video, 21/20 audio, 31/30 both — 1 on, 0 off', query: 'current mute state' },
  ERST: { label: 'Error status', set: null, query: '6 digits: fan, lamp, temp, cover, filter, other' },
  LAMP: { label: 'Lamp hours', set: null, query: 'hours and on/off per lamp' },
  INST: { label: 'Input list', set: null, query: 'space-separated list of available inputs' },
  NAME: { label: 'Projector name', set: null, query: 'the name set by the owner' },
  INF1: { label: 'Manufacturer', set: null, query: 'manufacturer name' },
  INF2: { label: 'Product name', set: null, query: 'model name' },
  INFO: { label: 'Other information', set: null, query: 'free text' },
  CLSS: { label: 'Class', set: null, query: '1 or 2' },
}

export function pjlinkCommand(command, parameter = '?', opts = {}) {
  const cmd = String(command).toUpperCase()
  if (!PJLINK_COMMANDS[cmd]) return null
  const param = String(parameter)
  if (!param.length) return null
  const cls = Number(opts.class ?? 1)
  if (![1, 2].includes(cls)) return null

  const line = `%${cls}${cmd} ${param}\r`
  const challenge = opts.challenge ? String(opts.challenge).trim() : null
  const password = opts.password ? String(opts.password) : null

  let auth = null
  let wire = line
  if (challenge && password) {
    if (!/^[0-9a-fA-F]{8}$/.test(challenge)) return null
    auth = md5(challenge + password)
    // The digest is prepended to the first command with no separator at all.
    wire = auth + line
  }

  return {
    command: cmd,
    label: PJLINK_COMMANDS[cmd].label,
    parameter: param,
    isQuery: param === '?',
    line,
    wire,
    authDigest: auth,
    port: 4352,
    bytes: enc.encode(wire),
    hex: toHex(enc.encode(wire)),
    // A browser cannot open a TCP socket, so this is the honest deliverable:
    // a line somebody can paste into a terminal.
    netcat: `printf '${wire.replace(/\r/g, '\\r')}' | nc <projector-ip> 4352`,
    note: challenge && !password
      ? 'A challenge was given with no password, so no digest could be computed.'
      : auth
        ? 'Digest prepended to the first command only. Subsequent commands on the same connection go unprefixed.'
        : 'No authentication. This is correct only where the projector greeted you with "PJLINK 0".',
  }
}

/**
 * Art-Net ArtDmx, and the ArtPoll that finds nodes.
 *
 * A short header and then the slots. The header is eighteen bytes:
 * the identifier "Art-Net" with its null, the opcode, the protocol version,
 * a sequence number, a physical port hint, and the port address split into
 * a low byte and a net byte.
 *
 * Two things trip people. The opcode is sent LOW BYTE FIRST while the data
 * length is sent HIGH BYTE FIRST, in the same header, which is a genuine
 * inconsistency in the protocol rather than a mistake in your reading. And
 * the sequence number is not a slot count — it is 1 to 255 with 0 meaning
 * "not using sequencing", and a receiver uses it to drop packets that
 * arrived out of order.
 */
export const ARTNET_ID = 'Art-Net\0'
export const ARTNET_OPCODES = { ArtPoll: 0x2000, ArtPollReply: 0x2100, ArtDmx: 0x5000, ArtSync: 0x5200 }

export function artnetDmx(net, subnet, universe, slots = [], opts = {}) {
  const n = Number(net), s = Number(subnet), u = Number(universe)
  if (!Number.isInteger(n) || n < 0 || n > 127) return null
  if (!Number.isInteger(s) || s < 0 || s > 15) return null
  if (!Number.isInteger(u) || u < 0 || u > 15) return null
  if (!Array.isArray(slots) || slots.length > 512) return null
  if (!slots.every((v) => Number.isInteger(v) && v >= 0 && v <= 255)) return null
  const sequence = Number(opts.sequence ?? 0)
  const physical = Number(opts.physical ?? 0)
  if (!Number.isInteger(sequence) || sequence < 0 || sequence > 255) return null

  // The wire always carries an even number of slots, minimum two.
  const dataLen = Math.max(2, slots.length + (slots.length % 2))
  const out = new Uint8Array(18 + dataLen)
  out.set(enc.encode('Art-Net'), 0)
  out[7] = 0
  // Opcode, low byte first.
  out[8] = ARTNET_OPCODES.ArtDmx & 0xff
  out[9] = ARTNET_OPCODES.ArtDmx >> 8
  out[10] = 0    // ProtVerHi
  out[11] = 14   // ProtVerLo
  out[12] = sequence
  out[13] = physical
  out[14] = (s << 4) | u  // SubUni
  out[15] = n             // Net
  // Length, high byte first — the opposite of the opcode, in the same header.
  out[16] = dataLen >> 8
  out[17] = dataLen & 0xff
  out.set(slots, 18)

  return {
    net: n,
    subnet: s,
    universe: u,
    portAddress: (n << 8) | (s << 4) | u,
    sequence,
    slots: slots.length,
    dataLength: dataLen,
    bytes: out,
    hex: toHex(out.slice(0, Math.min(out.length, 32))) + (out.length > 32 ? ` … (${out.length} bytes total)` : ''),
    length: out.length,
    port: 6454,
    transport: 'UDP port 6454, broadcast or unicast',
    note: sequence === 0
      ? 'Sequence 0 means sequencing is disabled and the receiver will not reorder.'
      : 'Sequence increments 1-255 and wraps, skipping 0.',
  }
}

/** ArtPoll: the broadcast that makes every node announce itself. */
export function artnetPoll(opts = {}) {
  const talkToMe = Number(opts.talkToMe ?? 0)
  const priority = Number(opts.priority ?? 0)
  if (!Number.isInteger(talkToMe) || talkToMe < 0 || talkToMe > 255) return null
  const out = new Uint8Array(14)
  out.set(enc.encode('Art-Net'), 0)
  out[7] = 0
  out[8] = ARTNET_OPCODES.ArtPoll & 0xff
  out[9] = ARTNET_OPCODES.ArtPoll >> 8
  out[10] = 0
  out[11] = 14
  out[12] = talkToMe
  out[13] = priority
  return {
    bytes: out,
    hex: toHex(out),
    length: out.length,
    port: 6454,
    transport: 'UDP broadcast to 6454',
    expects: 'Every node replies with ArtPollReply (opcode 0x2100), which is how a controller builds its node list.',
  }
}

/**
 * An RDM packet, checksum and all.
 *
 * Twenty-four bytes of header, then parameter data, then a two-byte
 * additive checksum — a plain sum of every preceding byte, which is the
 * simplest integrity check there is and catches exactly the single-bit
 * errors a marginal RS-485 line produces.
 *
 * The message length field counts everything up to but NOT including the
 * checksum, which is the off-by-two everybody hits once.
 *
 * PIDs here are the well-known ones from E1.20. The registry is much larger
 * and manufacturer-specific PIDs live above 0x8000; an unknown PID is
 * emitted as its number rather than guessed at.
 */
export const RDM_COMMAND_CLASSES = {
  0x10: 'DISCOVERY_COMMAND', 0x11: 'DISCOVERY_COMMAND_RESPONSE',
  0x20: 'GET_COMMAND', 0x21: 'GET_COMMAND_RESPONSE',
  0x30: 'SET_COMMAND', 0x31: 'SET_COMMAND_RESPONSE',
}

export const RDM_PIDS = {
  0x0001: 'DISC_UNIQUE_BRANCH', 0x0002: 'DISC_MUTE', 0x0003: 'DISC_UN_MUTE',
  0x0060: 'DEVICE_INFO', 0x0080: 'DEVICE_MODEL_DESCRIPTION',
  0x0081: 'MANUFACTURER_LABEL', 0x0082: 'DEVICE_LABEL',
  0x00e0: 'DMX_PERSONALITY', 0x00e1: 'DMX_PERSONALITY_DESCRIPTION',
  0x00f0: 'DMX_START_ADDRESS',
  0x0200: 'SENSOR_DEFINITION', 0x0201: 'SENSOR_VALUE',
  0x0400: 'DEVICE_HOURS', 0x0401: 'LAMP_HOURS',
  0x1000: 'IDENTIFY_DEVICE',
}

export function rdmPacket(opts = {}) {
  const dest = rdmUid(opts.destination ?? 'FFFF:FFFFFFFF')
  const src = rdmUid(opts.source ?? '0001:00000001')
  if (!dest || !src) return null
  const cc = Number(opts.commandClass ?? 0x20)
  const pid = Number(opts.pid ?? 0x0060)
  if (!RDM_COMMAND_CLASSES[cc]) return null
  if (!Number.isInteger(pid) || pid < 0 || pid > 0xffff) return null
  const data = opts.data instanceof Uint8Array ? opts.data
    : Array.isArray(opts.data) ? Uint8Array.from(opts.data) : new Uint8Array(0)
  if (data.length > 231) return null
  const tn = Number(opts.transactionNumber ?? 0)
  const subDevice = Number(opts.subDevice ?? 0)
  if (!Number.isInteger(tn) || tn < 0 || tn > 255) return null
  if (!Number.isInteger(subDevice) || subDevice < 0 || subDevice > 0xffff) return null

  const uidBytes = (u) => {
    const b = new Uint8Array(6)
    b[0] = u.manufacturerId >> 8; b[1] = u.manufacturerId & 0xff
    b[2] = (u.deviceId >>> 24) & 0xff; b[3] = (u.deviceId >>> 16) & 0xff
    b[4] = (u.deviceId >>> 8) & 0xff; b[5] = u.deviceId & 0xff
    return b
  }

  // 24 header bytes before the parameter data, then two of checksum.
  const messageLength = 24 + data.length
  const out = new Uint8Array(messageLength + 2)
  out[0] = 0xcc          // START code: this is RDM, not level data
  out[1] = 0x01          // sub start code
  out[2] = messageLength // up to but not including the checksum
  out.set(uidBytes(dest), 3)
  out.set(uidBytes(src), 9)
  out[15] = tn
  out[16] = Number(opts.portId ?? 1)
  out[17] = 0            // message count, zero in a controller request
  out[18] = subDevice >> 8
  out[19] = subDevice & 0xff
  out[20] = cc
  out[21] = pid >> 8
  out[22] = pid & 0xff
  out[23] = data.length
  out.set(data, 24)

  let sum = 0
  for (let i = 0; i < messageLength; i++) sum = (sum + out[i]) & 0xffff
  out[messageLength] = sum >> 8
  out[messageLength + 1] = sum & 0xff

  return {
    destination: dest.uid,
    source: src.uid,
    commandClass: RDM_COMMAND_CLASSES[cc],
    pid: RDM_PIDS[pid] ?? `0x${pid.toString(16).toUpperCase().padStart(4, '0')}`,
    pidKnown: Boolean(RDM_PIDS[pid]),
    messageLength,
    dataLength: data.length,
    checksum: sum,
    checksumHex: sum.toString(16).toUpperCase().padStart(4, '0'),
    bytes: out,
    hex: toHex(out),
    length: out.length,
    broadcast: dest.broadcast,
    note: dest.broadcast
      ? 'Broadcast: every addressed device acts on this and none of them answers, because simultaneous responses would collide.'
      : 'Unicast: the addressed device responds in the window the controller leaves after the packet.',
  }
}

/**
 * MIDI Machine Control — transport commands as system exclusive.
 *
 *   F0 7F <device> 06 <command> F7
 *
 * Device 7F is all-call. The command set is small and stable, and LOCATE is
 * the only one that carries data: sub-command 01 followed by five bytes of
 * timecode in hours-with-rate, minutes, seconds, frames, subframes.
 */
export const MMC_COMMANDS = {
  0x01: 'STOP', 0x02: 'PLAY', 0x03: 'DEFERRED PLAY', 0x04: 'FAST FORWARD',
  0x05: 'REWIND', 0x06: 'RECORD STROBE', 0x07: 'RECORD EXIT', 0x09: 'PAUSE',
  0x0d: 'RESET', 0x44: 'LOCATE',
}

export function mmcCommand(command, opts = {}) {
  const cmd = Number(command)
  if (!MMC_COMMANDS[cmd]) return null
  const device = Number(opts.device ?? 0x7f)
  if (!Number.isInteger(device) || device < 0 || device > 0x7f) return null

  let body = [0xf0, 0x7f, device, 0x06, cmd]
  let locate = null
  if (cmd === 0x44) {
    const h = Number(opts.hours ?? 0), m = Number(opts.minutes ?? 0)
    const s = Number(opts.seconds ?? 0), f = Number(opts.frames ?? 0)
    if (![h, m, s, f].every(Number.isInteger)) return null
    if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59 || f < 0 || f > 29) return null
    const rateCode = MTC_RATES[opts.rate ?? '25']
    if (rateCode === undefined) return null
    // LOCATE target: sub-command 01, then hours carrying the rate in bits 5-6.
    body = [...body, 0x06, 0x01, (rateCode << 5) | h, m, s, f, 0]
    locate = { h, m, s, f, rate: opts.rate ?? '25' }
  }
  body.push(0xf7)
  const bytes = Uint8Array.from(body)

  return {
    command: MMC_COMMANDS[cmd],
    commandByte: cmd,
    device: device === 0x7f ? 'all-call (127)' : device,
    locate,
    bytes,
    hex: toHex(bytes),
    length: bytes.length,
    // Web MIDI can actually put these on a real wire, unlike everything else
    // in this section.
    sendable: true,
    transport: 'MIDI — a DIN cable, a USB interface, or RTP-MIDI over a network',
    note: device === 0x7f
      ? 'All-call: every machine on the chain acts on this whatever its device ID.'
      : `Only the machine set to device ${device} acts on this.`,
  }
}

/**
 * MIDI Show Control, built rather than decoded.
 *
 *   F0 7F <device> 02 <format> <command> <cue> 00 <list> 00 <path> 00 F7
 *
 * The cue data is ASCII DIGITS, not binary — cue 12 is 0x31 0x32, not 0x0C.
 * That catches everybody once, and it is the reason a cue number can contain
 * a decimal point.
 */
export function mscCommand(opts = {}) {
  const device = Number(opts.device ?? 0x7f)
  const format = Number(opts.format ?? 0x01)
  const command = Number(opts.command ?? 0x01)
  if (!Number.isInteger(device) || device < 0 || device > 0x7f) return null
  if (!Number.isInteger(format) || format < 0 || format > 0x7f) return null
  if (!Number.isInteger(command) || command < 0 || command > 0x7f) return null

  const body = [0xf0, 0x7f, device, 0x02, format, command]
  const parts = []
  const ascii = (v) => {
    const str = String(v ?? '').trim()
    if (!str) return null
    if (!/^[0-9.]+$/.test(str)) return undefined // invalid, not merely absent
    return [...str].map((c) => c.charCodeAt(0))
  }
  for (const key of ['cue', 'list', 'path']) {
    const a = ascii(opts[key])
    if (a === undefined) return null
    parts.push(a)
  }
  // Trailing empty fields are omitted; a delimiter follows each field present.
  let lastUsed = -1
  parts.forEach((p, i) => { if (p) lastUsed = i })
  for (let i = 0; i <= lastUsed; i++) {
    body.push(...(parts[i] ?? []))
    body.push(0x00)
  }
  body.push(0xf7)
  const bytes = Uint8Array.from(body)

  return {
    device: device === 0x7f ? 'all-call (127)' : device,
    format: MSC_FORMATS[format] ?? `0x${format.toString(16).toUpperCase()}`,
    command: MSC_COMMANDS[command] ?? `0x${command.toString(16).toUpperCase()}`,
    cue: opts.cue ?? null,
    list: opts.list ?? null,
    path: opts.path ?? null,
    bytes,
    hex: toHex(bytes),
    length: bytes.length,
    sendable: true,
    note: device === 0x7f
      ? 'All-call: every receiver on the network acts on this whatever its device ID.'
      : 'A receiver only acts if BOTH its device ID and its command format match. A format mismatch is the commonest reason MSC appears to do nothing.',
  }
}

/**
 * sACN (ANSI E1.31) data packet, laid out in full.
 *
 * Three nested PDUs — root, framing, DMP — each starting with a combined
 * flags-and-length field where the top nibble is 0x7 and the remaining
 * twelve bits are the length of that PDU including its own header. Getting
 * those three lengths right is most of the work, and getting one wrong
 * produces a packet that some receivers accept and others silently drop,
 * which is a miserable thing to debug.
 *
 * The arithmetic for a full universe: 638 bytes total, root PDU 622,
 * framing 600, DMP 523. Send fewer slots and all four shrink together.
 *
 * The CID is a UUID identifying the SOURCE, not the universe, and it must
 * stay the same for the life of the source — a device that generates a fresh
 * one every packet will be treated as an unlimited number of new sources and
 * will break priority arbitration on any receiver paying attention.
 */
export const SACN_ACN_ID = 'ASC-E1.17'

export function sacnPacket(universe, slots = [], opts = {}) {
  const u = Number(universe)
  if (!Number.isInteger(u) || u < 1 || u > 63999) return null
  if (!Array.isArray(slots) || slots.length > 512) return null
  if (!slots.every((v) => Number.isInteger(v) && v >= 0 && v <= 255)) return null
  const priority = Number(opts.priority ?? 100)
  const sequence = Number(opts.sequence ?? 0)
  const syncAddress = Number(opts.syncAddress ?? 0)
  if (!Number.isInteger(priority) || priority < 0 || priority > 200) return null
  if (!Number.isInteger(sequence) || sequence < 0 || sequence > 255) return null
  const sourceName = String(opts.sourceName ?? 'showstack')
  if (enc.encode(sourceName).length > 63) return null

  const n = slots.length
  const total = 126 + n
  const out = new Uint8Array(total)
  const dv = new DataView(out.buffer)
  const pdu = (offset, length) => dv.setUint16(offset, 0x7000 | length, false)

  // ---- root layer ---------------------------------------------------------
  dv.setUint16(0, 0x0010, false)   // preamble size
  dv.setUint16(2, 0x0000, false)   // post-amble size
  out.set(enc.encode(SACN_ACN_ID), 4)  // then three nulls, already zero
  pdu(16, 110 + n)
  dv.setUint32(18, 0x00000004, false)  // VECTOR_ROOT_E131_DATA
  // CID: a UUID for the source. Deterministic here so the same inputs give
  // the same packet, which is what makes this testable.
  const cid = opts.cid instanceof Uint8Array && opts.cid.length === 16
    ? opts.cid
    : Uint8Array.from({ length: 16 }, (_, i) => (0x5a + i * 7) & 0xff)
  out.set(cid, 22)

  // ---- framing layer ------------------------------------------------------
  pdu(38, 88 + n)
  dv.setUint32(40, 0x00000002, false)  // VECTOR_E131_DATA_PACKET
  out.set(enc.encode(sourceName), 44)  // 64-byte field, null padded
  out[108] = priority
  dv.setUint16(109, syncAddress, false)
  out[111] = sequence
  out[112] = Number(opts.options ?? 0)
  dv.setUint16(113, u, false)

  // ---- DMP layer ----------------------------------------------------------
  pdu(115, 11 + n)
  out[117] = 0x02   // VECTOR_DMP_SET_PROPERTY
  out[118] = 0xa1   // address type and data type
  dv.setUint16(119, 0x0000, false)  // first property address
  dv.setUint16(121, 0x0001, false)  // address increment
  dv.setUint16(123, 1 + n, false)   // property value count: start code + slots
  out[125] = 0x00   // DMX start code
  out.set(slots, 126)

  return {
    universe: u,
    priority,
    sequence,
    slots: n,
    sourceName,
    rootPduLength: 110 + n,
    framingPduLength: 88 + n,
    dmpPduLength: 11 + n,
    bytes: out,
    hex: toHex(out.slice(0, Math.min(out.length, 48))) + (out.length > 48 ? ` … (${out.length} bytes total)` : ''),
    length: total,
    // The multicast group for a universe: 239.255.<high>.<low>.
    multicastGroup: sacnMulticast(u),
    port: 5568,
    transport: `UDP port 5568, multicast to ${sacnMulticast(u)}`,
    note: 'The CID identifies the source and must not change between packets. A device that generates a new one each time looks like an unlimited number of sources and breaks priority arbitration.',
  }
}
