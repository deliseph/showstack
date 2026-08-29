import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  voltageDrop, powerLoad, phaseBalance, dmxLineBudget, subnetCidr,
  heatLoad, fibreLossBudget, roomModes, lineArrayCoverage,
} from '../scripts/toolmath.mjs'

/**
 * The pre-show check reads fields off these results by name, inside a string
 * of JavaScript that no type checker or bundler ever sees. That is exactly how
 * `vd.percent` shipped once when the field is called `dropPercent` — the check
 * silently reported a 36% volt drop as "fine", because `undefined > 5` is
 * false and so is `undefined > 3`.
 *
 * A wrong number on a page called "pre-show check" is worse than no page, so
 * the field names every consumer depends on are pinned here. Renaming one now
 * fails the build instead of quietly reporting a dangerous run as safe.
 */
const has = (obj, fields, label) => {
  for (const f of fields) {
    assert.ok(obj != null && f in obj, `${label} no longer returns "${f}"`)
    assert.notEqual(obj[f], undefined, `${label}.${f} is undefined`)
  }
}

test('voltageDrop keeps the field names its consumers read', () => {
  has(voltageDrop(87, 120, 2.5, 400, 3),
    ['dropVolts', 'dropPercent', 'voltsAtLoad', 'withinLighting', 'withinPower'], 'voltageDrop')
})

test('voltageDrop distinguishes single from three phase', () => {
  // Three-phase uses sqrt(3), single uses 2, so omitting the phase understates
  // a three-phase run. The check page passes it; this proves it matters.
  const single = voltageDrop(87, 120, 2.5, 400, 1).dropPercent
  const three = voltageDrop(87, 120, 2.5, 400, 3).dropPercent
  assert.ok(single > three, 'the two must differ')
  assert.ok(Math.abs(single / three - 2 / Math.sqrt(3)) < 0.01)
})

test('a long thin run at high current is never reported as acceptable', () => {
  // The exact case that shipped wrong.
  const vd = voltageDrop(87, 120, 2.5, 400, 3)
  assert.ok(vd.dropPercent > 5, `expected a serious drop, got ${vd.dropPercent}%`)
  assert.equal(vd.withinLighting, false)
  assert.equal(vd.withinPower, false)
})

test('powerLoad keeps the field names its consumers read', () => {
  has(powerLoad(60000, 400, 3), ['amps'], 'powerLoad')
})

test('phaseBalance keeps the field names its consumers read', () => {
  has(phaseBalance(34, 28, 19), ['imbalancePercent', 'neutralAmps', 'worstLeg'], 'phaseBalance')
})

test('subnetCidr keeps the field names its consumers read', () => {
  has(subnetCidr('10.0.0.1', 24), ['usableHosts', 'mask', 'network', 'broadcast'], 'subnetCidr')
})

test('heatLoad keeps the field names its consumers read', () => {
  has(heatLoad(24000, { people: 450 }), ['btuPerHour', 'tonsOfCooling', 'peopleW', 'kwThermal'], 'heatLoad')
})

test('fibreLossBudget keeps the field names its consumers read', () => {
  has(fibreLossBudget(500, 'om3-850', 2, 0), ['totalLossDb', 'marginDb', 'ok', 'thin', 'maxLengthM'], 'fibreLossBudget')
})

test('roomModes and lineArrayCoverage keep theirs', () => {
  has(roomModes(12, 9, 4, { rt60: 1.2 }), ['schroeder', 'modes', 'fundamental', 'pileups', 'volume'], 'roomModes')
  has(lineArrayCoverage(4, 1000, 30), ['transitionM', 'lossDb', 'advantageDb', 'nearField'], 'lineArrayCoverage')
})

test('dmxLineBudget takes an array of groups, not a map', () => {
  // The signature is (groups[], limit). Passing a map returns null, which a
  // caller reading r.unitLoads would turn into "undefined unit loads".
  assert.equal(dmxLineBudget({ 1: 8, 0.25: 40 }), null)
  const r = dmxLineBudget([{ count: 8, unitLoad: 1 }, { count: 40, unitLoad: 0.25 }])
  has(r, ['unitLoads', 'fixtures'], 'dmxLineBudget')
  assert.equal(r.unitLoads, 18)
  assert.equal(r.fixtures, 48)
})
