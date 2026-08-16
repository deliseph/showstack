#!/usr/bin/env node
/**
 * showstack validator.
 *
 * Runs on every pull request. Its job is to make a contributor's first PR
 * either pass cleanly or fail with a message that tells them exactly what to
 * change — never with a stack trace. Every error line is prefixed with the
 * file path so GitHub's log is directly actionable.
 */
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { COLLECTIONS, loadCollection, loadSchema } from './lib/load.mjs'

const ajv = new Ajv({ allErrors: true, strict: false, allowUnionTypes: true })
addFormats(ajv)
ajv.addSchema(loadSchema('common.defs.json'), 'common.defs.json')

const errors = []
const warnings = []
const index = {}
let count = 0

for (const col of COLLECTIONS) {
  const validate = ajv.compile(loadSchema(col.schema))
  const entries = loadCollection(col.key)
  index[col.key] = new Map()

  for (const { relpath, expectedId, doc } of entries) {
    count++

    if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
      errors.push(`${relpath}: file must contain a single YAML mapping (key: value pairs).`)
      continue
    }

    if (!validate(doc)) {
      for (const e of validate.errors) {
        const where = e.instancePath || '(root)'
        let msg = `${relpath}: ${where} ${e.message}`
        if (e.params?.allowedValues) msg += ` — allowed: ${e.params.allowedValues.join(', ')}`
        if (e.params?.additionalProperty) msg += ` — remove "${e.params.additionalProperty}"`
        errors.push(msg)
      }
    }

    // Filename is the primary key. Keeping them in sync is what lets every
    // other entry cross-reference this one by id without a lookup table.
    if (doc.id && doc.id !== expectedId) {
      errors.push(`${relpath}: id "${doc.id}" must match the filename ("${expectedId}.yaml"). Rename one to match the other.`)
    }

    if (doc.id) {
      if (index[col.key].has(doc.id)) {
        errors.push(`${relpath}: duplicate id "${doc.id}" — already defined in ${index[col.key].get(doc.id)}`)
      } else {
        index[col.key].set(doc.id, relpath)
      }
    }

    // A source that is only a blog post is allowed, but we nudge toward the
    // actual standard or the vendor's own documentation.
    if (Array.isArray(doc.sources) && !doc.sources.some((s) => s.primary)) {
      warnings.push(`${relpath}: no source marked "primary: true". If you have the standard or the vendor doc, mark it.`)
    }
  }
}

// ---- Cross-reference integrity -------------------------------------------
// A dangling reference is worse than a missing one: it makes the site render a
// dead link and quietly teaches the reader something false.

const refChecks = [
  { col: 'protocols', field: 'standards', target: 'standards', kind: 'list' },
  { col: 'protocols', field: 'superseded_by', target: 'protocols', kind: 'single' },
  { col: 'software', field: 'speaks', target: 'protocols', kind: 'speaks' },
  { col: 'software', field: 'superseded_by', target: 'software', kind: 'single' },
  { col: 'hardware', field: 'speaks', target: 'protocols', kind: 'speaks' },
  { col: 'hardware', field: 'runs_software', target: 'software', kind: 'list' },
  { col: 'hardware', field: 'superseded_by', target: 'hardware', kind: 'single' },
  { col: 'standards', field: 'related_protocols', target: 'protocols', kind: 'list' },
  { col: 'standards', field: 'supersedes', target: 'standards', kind: 'list' },
  { col: 'standards', field: 'superseded_by', target: 'standards', kind: 'single' },
  { col: 'terms', field: 'see_also', target: 'terms', kind: 'list' },
  { col: 'terms', field: 'related_protocols', target: 'protocols', kind: 'list' },
]

for (const check of refChecks) {
  for (const { relpath, doc } of loadCollection(check.col)) {
    if (!doc || typeof doc !== 'object') continue
    const value = doc[check.field]
    if (value == null) continue

    const ids =
      check.kind === 'single' ? [value]
      : check.kind === 'speaks' ? (Array.isArray(value) ? value.map((v) => v?.protocol) : [])
      : Array.isArray(value) ? value
      : []

    for (const id of ids.filter(Boolean)) {
      if (!index[check.target].has(id)) {
        errors.push(
          `${relpath}: ${check.field} points at "${id}", which does not exist in data/${check.target}/. ` +
          `Either fix the spelling or add data/${check.target}/${id}.yaml in the same PR.`
        )
      }
    }
  }
}

// ---- Port collisions ------------------------------------------------------
// Two protocols sharing a port is real (it happens), but it is almost always
// worth a human look, so we warn rather than fail.
const portMap = new Map()
for (const { relpath, doc } of loadCollection('protocols')) {
  for (const p of doc?.default_ports ?? []) {
    const key = `${p.transport}/${p.number}`
    if (portMap.has(key)) warnings.push(`Port ${key} claimed by both ${portMap.get(key)} and ${relpath}. Check this is genuinely shared.`)
    else portMap.set(key, relpath)
  }
}

// ---- Report ---------------------------------------------------------------
const stats = COLLECTIONS.map((c) => `${index[c.key].size} ${c.key}`).join(', ')

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s) — these will not block your PR:\n`)
  for (const w of warnings) console.log(`  ! ${w}`)
}

if (errors.length) {
  console.error(`\n${errors.length} error(s) in ${count} file(s):\n`)
  for (const e of errors) console.error(`  x ${e}`)
  console.error(
    `\nNothing here is fatal to your contribution — fix the lines above and push again.\n` +
    `If a message is unclear, say so on the PR and we will fix the validator, not just your file.\n`
  )
  process.exit(1)
}

console.log(`\nAll good. ${count} entries validated: ${stats}.\n`)
