import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, basename, extname } from 'node:path'
import { parse } from 'yaml'

export const ROOT = new URL('../../', import.meta.url).pathname

/**
 * The five collections. `dir` is the folder under data/, `schema` the file
 * under schema/, and `singular` is what we call one of them in error messages.
 * Adding a sixth collection should mean touching this array and nothing else.
 */
export const COLLECTIONS = [
  { key: 'protocols', dir: 'protocols', schema: 'protocol.schema.json', singular: 'protocol' },
  { key: 'software', dir: 'software', schema: 'software.schema.json', singular: 'software entry' },
  { key: 'hardware', dir: 'hardware', schema: 'hardware.schema.json', singular: 'hardware entry' },
  { key: 'standards', dir: 'standards', schema: 'standard.schema.json', singular: 'standard' },
  { key: 'terms', dir: 'terms', schema: 'term.schema.json', singular: 'term' },
]

export function loadCollection(key) {
  const col = COLLECTIONS.find((c) => c.key === key)
  if (!col) throw new Error(`Unknown collection: ${key}`)
  const dir = join(ROOT, 'data', col.dir)
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter((f) => ['.yaml', '.yml'].includes(extname(f)))
    .sort()
    .map((file) => {
      const path = join(dir, file)
      let doc
      try {
        doc = parse(readFileSync(path, 'utf8'))
      } catch (err) {
        // Surface YAML syntax errors with the filename attached, otherwise a
        // first-time contributor gets a stack trace and no idea which file broke.
        throw new Error(`${col.dir}/${file}: YAML could not be parsed — ${err.message}`)
      }
      return { file, path, relpath: `data/${col.dir}/${file}`, expectedId: basename(file, extname(file)), doc }
    })
}

export function loadAll() {
  const out = {}
  for (const col of COLLECTIONS) out[col.key] = loadCollection(col.key)
  return out
}

export function loadSchema(name) {
  return JSON.parse(readFileSync(join(ROOT, 'schema', name), 'utf8'))
}
