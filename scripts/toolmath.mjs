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
