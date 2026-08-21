#!/usr/bin/env node
/**
 * Generate TypeScript declarations from the JSON Schemas.
 *
 * Why generate rather than hand-write: the schemas in schema/ are the contract.
 * A hand-maintained .d.ts is a second copy of that contract which drifts the
 * first time someone adds a field, and a type that lies is worse than no type
 * at all. This way `npm run types` regenerates them and CI notices if they are
 * stale.
 *
 * This is a deliberately small subset of JSON Schema — exactly what these
 * schemas use. It refuses to guess: an unhandled construct throws rather than
 * silently emitting `any`, because a silent `any` is how a generated type
 * quietly stops being useful.
 *
 *   node scripts/types.mjs            # write the .d.ts
 *   node scripts/types.mjs --check    # fail if the checked-in file is stale
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, COLLECTIONS, loadSchema } from './lib/load.mjs'

const OUT = join(ROOT, 'packages', 'showstack-js', 'index.d.ts')

const defs = loadSchema('common.defs.json').definitions

/** Turn a schema node into a TypeScript type expression. */
function typeOf(node, indent = '  ') {
  if (node.$ref) {
    const name = node.$ref.split('/').pop()
    // Shared definitions become named types, which keeps the output readable
    // and gives consumers something to import.
    return refName(name)
  }
  if (node.enum) return node.enum.map((v) => JSON.stringify(v)).join(' | ')

  switch (node.type) {
    case 'string': return 'string'
    case 'integer':
    case 'number': return 'number'
    case 'boolean': return 'boolean'
    case 'array': return `${wrap(typeOf(node.items, indent))}[]`
    case 'object': return objectOf(node, indent)
    default:
      throw new Error(`types.mjs: unhandled schema node: ${JSON.stringify(node).slice(0, 120)}`)
  }
}

/** Parenthesise unions before adding [] so `A | B` does not become `A | B[]`. */
const wrap = (t) => (t.includes('|') ? `(${t})` : t)

const refName = (n) => ({
  slug: 'Slug',
  source: 'Source',
  sources: 'Source[]',
  githubHandle: 'GitHubHandle',
  contributors: 'GitHubHandle[]',
  confidence: 'Confidence',
  port: 'Port',
  spdxOrProprietary: 'SpdxOrProprietary',
  link: 'Link',
  status: 'Status',
}[n] ?? (() => { throw new Error(`types.mjs: unknown $ref target "${n}"`) })())

function objectOf(node, indent) {
  const props = node.properties ?? {}
  const required = new Set(node.required ?? [])
  const lines = Object.entries(props).map(([key, sub]) => {
    const optional = required.has(key) ? '' : '?'
    const doc = sub.description ? `${indent}  /** ${oneLine(sub.description)} */\n` : ''
    return `${doc}${indent}  ${safeKey(key)}${optional}: ${typeOf(sub, indent + '  ')}`
  })
  return `{\n${lines.join('\n')}\n${indent}}`
}

const safeKey = (k) => (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k))
const oneLine = (s) => String(s).replace(/\s+/g, ' ').replace(/\*\//g, '*\\/').trim()

/** A named interface from a top-level collection schema. */
function interfaceFor(name, schema, extra = '') {
  const doc = schema.description ? `/**\n * ${oneLine(schema.description)}\n */\n` : ''
  const body = objectOf(schema, '')
  // Strip the outer braces so we can splice in derived fields.
  const inner = body.replace(/^\{\n/, '').replace(/\n\}$/, '')
  return `${doc}export interface ${name} {\n${inner}${extra}\n}`
}

// --------------------------------------------------------------- shared types
const shared = `/** Lower-case kebab-case identifier. Matches the entry's filename. */
export type Slug = string

/** SPDX identifier (MIT, Apache-2.0, ...) or the literal string "proprietary". */
export type SpdxOrProprietary = string

export type GitHubHandle = string

/**
 * How much to trust a field.
 * verified  — checked against the primary standard or tested on real hardware
 * reported  — documented by the vendor or a credible secondary source
 * unverified — community knowledge, needs checking
 */
export type Confidence = ${defs.confidence.enum.map((v) => JSON.stringify(v)).join(' | ')}

export type Status = ${defs.status.enum.map((v) => JSON.stringify(v)).join(' | ')}

export interface Link ${objectOf(defs.link, '')}

export interface Port ${objectOf(defs.port, '')}

/** Where a fact came from. Every entry carries at least one. */
export interface Source ${objectOf(defs.source, '')}`

// ------------------------------------------------------- derived-only fields
// These do not exist in the YAML. The build computes them, so they belong on
// the published type but not in the schema.
const DERIVED = {
  protocols: `
  /**
   * Computed at build time: every indexed product that sends or receives this
   * protocol. Not present in the source YAML — it is the reverse of each
   * product's \`speaks\` array.
   */
  spoken_by?: Speaker[]`,
}

const interfaces = COLLECTIONS.map((c) => {
  const schema = loadSchema(c.schema)
  const name = { protocols: 'Protocol', software: 'Software', hardware: 'Hardware', standards: 'Standard', terms: 'Term' }[c.key]
  return interfaceFor(name, schema, DERIVED[c.key] ?? '')
}).join('\n\n')

const api = `
/** One product's ability to speak a protocol, as recorded on the protocol. */
export interface Speaker {
  kind: 'software' | 'hardware'
  id: Slug
  name: string
  vendor: string | null
  direction: 'in' | 'out' | 'bidirectional'
  requires_licence: boolean
  confidence: Confidence
  note: string | null
}

/** Any indexed product, software or hardware, tagged with which it is. */
export type Product = (Software | Hardware) & { kind: 'software' | 'hardware' }

/** A field we know is missing. The contributor backlog, generated not curated. */
export interface Gap {
  collection: CollectionKey
  id: Slug
  name: string
  missing: string[]
}

export interface Contributor {
  handle: GitHubHandle
  entries: number
}

export type CollectionKey = ${COLLECTIONS.map((c) => JSON.stringify(c.key)).join(' | ')}

/** A path over which one product can reach another. */
export interface InteropPath {
  from: Slug
  to: Slug
  protocol: Slug
}

export interface Meta {
  generated: string
  counts: Record<CollectionKey, number>
  total: number
}

export declare const protocols: Protocol[]
export declare const software: Software[]
export declare const hardware: Hardware[]
export declare const standards: Standard[]
export declare const terms: Term[]
export declare const products: Product[]
export declare const contributors: Contributor[]
export declare const gaps: Gap[]
export declare const meta: Meta

/**
 * What is listening on this port?
 * The question you ask when a capture shows traffic you did not expect.
 */
export declare function byPort(number: number | string, transport?: 'udp' | 'tcp' | 'sctp'): Protocol[]

/**
 * Everything indexed that sends or receives a given protocol.
 * Passing a direction includes bidirectional devices, because a device that
 * can do both can certainly do the one you asked about.
 */
export declare function whoSpeaks(protocolId: Slug, direction?: 'in' | 'out'): Speaker[]

/** Can these two products talk, and over what? Returns both directions. */
export declare function interop(idA: Slug, idB: Slug): InteropPath[]

/** Look up a glossary term by slug, English, or Chinese. */
export declare function term(query: string): Term[]

export declare function get(collection: 'protocols', id: Slug): Protocol | null
export declare function get(collection: 'software', id: Slug): Software | null
export declare function get(collection: 'hardware', id: Slug): Hardware | null
export declare function get(collection: 'standards', id: Slug): Standard | null
export declare function get(collection: 'terms', id: Slug): Term | null
export declare function get(collection: string, id: Slug): unknown | null

export interface SearchOptions {
  collection?: CollectionKey
  limit?: number
}

/** Substring search across everything, including ports and Chinese terms. */
export declare function search(
  query: string,
  options?: SearchOptions
): Array<{ collection: CollectionKey } & Record<string, unknown>>

/** Everything we know is missing, optionally filtered to one collection. */
export declare function missing(collection?: CollectionKey): Gap[]

declare const _default: {
  protocols: Protocol[]
  software: Software[]
  hardware: Hardware[]
  standards: Standard[]
  terms: Term[]
  products: Product[]
  contributors: Contributor[]
  gaps: Gap[]
  meta: Meta
  byPort: typeof byPort
  whoSpeaks: typeof whoSpeaks
  interop: typeof interop
  term: typeof term
  get: typeof get
  search: typeof search
  missing: typeof missing
}
export default _default
`

const out = `// Generated by scripts/types.mjs from schema/*.json — do not edit by hand.
// Regenerate with: npm run types
//
// The JSON Schemas are the contract for the data. These declarations are
// derived from them so the two can never disagree.

${shared}

${interfaces}
${api}`

if (process.argv.includes('--check')) {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : ''
  if (current !== out) {
    console.error('index.d.ts is stale. Run `npm run types` and commit the result.')
    process.exit(1)
  }
  console.log('index.d.ts is up to date.')
} else {
  writeFileSync(OUT, out)
  const lines = out.split('\n').length
  console.log(`Wrote packages/showstack-js/index.d.ts (${lines} lines) from schema/`)
}
