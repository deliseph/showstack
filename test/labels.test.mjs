import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { label, labelList, LABEL_MAPS } from '../scripts/labels.mjs'

test('maps a known machine value to prose', () => {
  assert.equal(label('category', 'audio-transport'), 'Audio transport')
  assert.equal(label('openness', 'open-free-registration'), 'Open standard, free registration')
  assert.equal(label('price_model', 'dongle-locked'), 'Paid, dongle-locked')
  assert.equal(label('platforms', 'macos'), 'macOS')
})

test('falls back to readable prose, never to the raw key', () => {
  // A value added to the YAML that nobody has named here yet must still read
  // as English rather than leaking the hyphenated key at the reader.
  assert.equal(label('category', 'haptic-feedback'), 'Haptic feedback')
  assert.equal(label('category', 'brand-new'), 'Brand new')
  assert.match(label('category', 'anything-at-all'), /^[A-Z][a-z]/)
})

test('leaves values that are already prose alone', () => {
  // Standards bodies are names, not keys.
  assert.equal(label('body', 'ISO/IEC'), 'ISO/IEC')
  assert.equal(label('body', 'BSMI (經濟部標準檢驗局)'), 'BSMI (經濟部標準檢驗局)')
  assert.equal(label('body', '文化和旅游部 (MCT)'), '文化和旅游部 (MCT)')
})

test('lists read as prose', () => {
  assert.equal(labelList('platforms', ['windows', 'macos', 'linux']), 'Windows, macOS and Linux')
  assert.equal(labelList('platforms', ['web']), 'Web')
  assert.equal(labelList('platforms', []), '')
})

test('every value in the shipped dataset has an explicit label', () => {
  // The fallback exists so a new value is never ugly, but a value that is
  // already in the dataset should have been named deliberately. This is the
  // test that fails when somebody adds a category and forgets the map.
  const bundle = join(process.cwd(), 'dist', 'showstack.json')
  if (!existsSync(bundle)) return // build has not run; the build job covers this
  const db = JSON.parse(readFileSync(bundle, 'utf8'))
  const missing = []
  const check = (field, value) => {
    if (value == null || value === '') return
    if (!Object.prototype.hasOwnProperty.call(LABEL_MAPS[field], value)) missing.push(`${field}=${value}`)
  }
  for (const e of db.protocols) {
    check('category', e.category); check('openness', e.openness)
    check('openness-short', e.openness); check('status', e.status); check('confidence', e.confidence)
  }
  for (const e of db.software) {
    check('category', e.category); check('price_model', e.price_model)
    check('status', e.status); check('confidence', e.confidence)
    for (const p of e.platforms ?? []) check('platforms', p)
  }
  for (const e of db.hardware) { check('category', e.category); check('confidence', e.confidence) }
  for (const e of db.standards) { check('status', e.status); check('confidence', e.confidence) }
  for (const e of db.terms) check('domain', e.domain)
  assert.deepEqual([...new Set(missing)], [], 'unmapped values reaching readers')
})
