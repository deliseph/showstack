/**
 * Projection and relay-logic maths. The projection vectors follow the
 * published arithmetic (ratio = distance/width; fL = lm x gain / ft^2;
 * 1 fL = 3.4263 cd/m^2 with the DCI 48 cd/m^2 reference) and the relay
 * matrix is checked against hand-computed truth tables.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { throwRatio, screenLuminance, relayLogic } from '../scripts/toolmath.mjs'

describe('throwRatio', () => {
  test('solves the missing one of three', () => {
    assert.deepEqual(throwRatio({ distance: 7.2, width: 4 }), { distance: 7.2, width: 4, ratio: 1.8 })
    assert.deepEqual(throwRatio({ ratio: 1.8, width: 4 }), { distance: 7.2, width: 4, ratio: 1.8 })
    assert.deepEqual(throwRatio({ distance: 7.2, ratio: 1.8 }), { distance: 7.2, width: 4, ratio: 1.8 })
  })
  test('distance+width win when all three come in', () => {
    assert.equal(throwRatio({ distance: 10, width: 4, ratio: 99 }).ratio, 2.5)
  })
  test('rejects one known, zeros and rubbish', () => {
    assert.equal(throwRatio({ distance: 7.2 }), null)
    assert.equal(throwRatio({ distance: 0, width: 4 }), null)
    assert.equal(throwRatio({ distance: 'x', width: 4 }), null)
    assert.equal(throwRatio({}), null)
  })
})

describe('screenLuminance', () => {
  test('10k lumens on a 6x3.375 m gain-1 screen', () => {
    const r = screenLuminance(10000, 6, 3.375, 1)
    // area 20.25 m^2 = 217.97 ft^2 -> 45.9 fL -> 157.2 nits; 493.8 lx incident
    assert.equal(r.areaM2, 20.3)
    assert.equal(r.fl, 45.9)
    assert.equal(r.nits, 157.2)
    assert.equal(r.lux, 493.8)
  })
  test('the DCI reference: 14 fL is 48 cd/m2 within rounding', () => {
    // Find lumens that give exactly 14 fL on 1 ft^2-equivalent: fL*3.4263 = 47.97
    const r = screenLuminance(14 * 10.7639, 1, 1, 1)
    assert.equal(r.fl, 14)
    assert.ok(Math.abs(r.nits - 48) < 0.1)
  })
  test('gain scales luminance, not incident lux', () => {
    const flat = screenLuminance(10000, 6, 3.375, 1)
    const hot = screenLuminance(10000, 6, 3.375, 1.8)
    assert.equal(hot.lux, flat.lux)
    assert.ok(Math.abs(hot.fl - flat.fl * 1.8) < 0.2)
  })
  test('rejects non-positive anything', () => {
    assert.equal(screenLuminance(0, 6, 3, 1), null)
    assert.equal(screenLuminance(10000, 6, -3, 1), null)
  })
})

describe('relayLogic', () => {
  test('GO & !ESTOP: the basic enable chain', () => {
    const r = relayLogic('MAIN = GO & !ESTOP')
    assert.deepEqual(r.inputs, ['ESTOP', 'GO'])
    assert.deepEqual(r.outputs, ['MAIN'])
    assert.equal(r.rows.length, 4)
    // rows are binary count over [ESTOP, GO]: 00 01 10 11
    assert.deepEqual(r.rows.map((x) => x.out[0]), [false, true, false, false])
  })
  test('parentheses and OR', () => {
    const r = relayLogic('HORN = GO & (A | B)')
    // inputs A,B,GO sorted; HORN true when GO and (A or B)
    const on = r.rows.filter((x) => x.out[0]).map((x) => x.in.join(''))
    assert.deepEqual(on, ['011', '101', '111'].map((s) => s.split('').map((c) => c === '1').join('')).map(String))
  })
  test('multiple rules share the input set', () => {
    const r = relayLogic('MAIN = GO & !ESTOP\nHORN = GO & (A | B)')
    assert.deepEqual(r.inputs, ['A', 'B', 'ESTOP', 'GO'])
    assert.equal(r.rows.length, 16)
    assert.deepEqual(r.outputs, ['MAIN', 'HORN'])
  })
  test('operator precedence: AND binds before OR', () => {
    const r = relayLogic('X = A | B & C')
    const truth = Object.fromEntries(r.rows.map((x) => [x.in.map((v) => v ? 1 : 0).join(''), x.out[0]]))
    assert.equal(truth['100'], true)   // A alone
    assert.equal(truth['011'], true)   // B & C
    assert.equal(truth['010'], false)  // B alone
  })
  test('rejects feedback, duplicates, too many inputs, junk', () => {
    assert.equal(relayLogic('X = X & Y'), null)
    assert.equal(relayLogic('X = A\nX = B'), null)
    assert.equal(relayLogic('X = A & B & C & D & E & F'), null)
    assert.equal(relayLogic('X = A +'), null)
    assert.equal(relayLogic('no equals sign'), null)
    assert.equal(relayLogic(''), null)
  })
})
