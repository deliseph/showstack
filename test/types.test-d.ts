/**
 * Type-level test for the published declarations.
 *
 * This file is never executed. It is compiled by `npm run types:check`, and it
 * fails the build if the generated .d.ts stops describing the real API.
 *
 * The point is to exercise the shapes a consumer actually depends on, so that
 * a schema change which breaks downstream code is caught here rather than in
 * someone else's repository.
 */
import api, {
  byPort, whoSpeaks, interop, term, get, search, missing,
  protocols, products, meta,
} from '../packages/showstack-js/index.js'
import type {
  Protocol, Software, Hardware, Term, Speaker, Product,
  InteropPath, Gap, Confidence, Port, Source, CollectionKey,
} from '../packages/showstack-js/index.js'

// --- byPort ---------------------------------------------------------------
const onPort: Protocol[] = byPort(5568)
const onPortStr: Protocol[] = byPort('5568')          // CLI args arrive as strings
const onPortUdp: Protocol[] = byPort(5568, 'udp')
const firstPort: Port | undefined = onPort[0]?.default_ports?.[0]
const portNum: number | undefined = firstPort?.number

// --- whoSpeaks ------------------------------------------------------------
const speakers: Speaker[] = whoSpeaks('art-net')
const receivers: Speaker[] = whoSpeaks('art-net', 'in')
const dir: 'in' | 'out' | 'bidirectional' | undefined = speakers[0]?.direction
const conf: Confidence | undefined = speakers[0]?.confidence

// --- interop --------------------------------------------------------------
const paths: InteropPath[] = interop('qlab', 'eos-family')
const via: string | undefined = paths[0]?.protocol

// --- get: overloads must narrow by collection -----------------------------
const p: Protocol | null = get('protocols', 'sacn')
const s: Software | null = get('software', 'qlab')
const h: Hardware | null = get('hardware', 'grandma3-full-size')
const t: Term | null = get('terms', 'dark')

// A protocol's summary is a string; this only compiles if the overload narrowed.
const summary: string | undefined = p?.summary

// --- term -----------------------------------------------------------------
const found: Term[] = term('吊桿')
const en: string | undefined = found[0]?.en

// --- search ---------------------------------------------------------------
const results = search('5568', { collection: 'protocols', limit: 5 })
const col: CollectionKey = results[0]!.collection

// --- missing --------------------------------------------------------------
const gaps: Gap[] = missing()
const scoped: Gap[] = missing('protocols')
const fields: string[] | undefined = gaps[0]?.missing

// --- collections ----------------------------------------------------------
const allProtocols: Protocol[] = protocols
const allProducts: Product[] = products
const kind: 'software' | 'hardware' | undefined = allProducts[0]?.kind
const total: number = meta.total
const sourced: Source[] | undefined = allProtocols[0]?.sources

// --- default export -------------------------------------------------------
const viaDefault: Protocol[] = api.byPort(6454)
const dp: Protocol[] = api.protocols

// --- derived field --------------------------------------------------------
const spokenBy: Speaker[] | undefined = allProtocols[0]?.spoken_by

// Reference everything so noUnusedLocals stays happy while still type-checking.
export type _Check = [
  typeof onPortStr, typeof onPortUdp, typeof portNum, typeof receivers,
  typeof dir, typeof conf, typeof via, typeof s, typeof h, typeof t,
  typeof summary, typeof found, typeof en, typeof col, typeof scoped,
  typeof fields, typeof kind, typeof total, typeof sourced,
  typeof viaDefault, typeof dp, typeof spokenBy,
]
