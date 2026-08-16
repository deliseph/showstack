/**
 * showstack — the open index of live entertainment technology.
 *
 * The whole dataset ships inside the package, so every lookup is synchronous
 * and works with no network. A rack in a basement with no wifi is the normal
 * operating environment for the people this is for.
 */
import { createRequire } from 'node:module'
const db = createRequire(import.meta.url)('../showstack.json')

export const protocols = db.protocols
export const software = db.software
export const hardware = db.hardware
export const standards = db.standards
export const terms = db.terms
export const contributors = db.contributors
export const gaps = db.gaps
export const meta = { generated: db.generated, counts: db.counts, total: db.total }

const COLLECTIONS = { protocols, software, hardware, standards, terms }

/** Every product in the index, software and hardware together. */
export const products = [
  ...software.map((s) => ({ ...s, kind: 'software' })),
  ...hardware.map((h) => ({ ...h, kind: 'hardware' })),
]

/**
 * What is listening on this port?
 * The question you ask when a packet capture shows traffic you did not expect.
 */
export function byPort(number, transport) {
  const n = Number(number)
  return protocols.filter((p) =>
    (p.default_ports ?? []).some((x) => x.number === n && (!transport || x.transport === transport))
  )
}

/**
 * Everything indexed that sends or receives a given protocol.
 * Pass a direction to narrow it: whoSpeaks('psn', 'in') is "what can receive PSN".
 */
export function whoSpeaks(protocolId, direction) {
  const p = protocols.find((x) => x.id === protocolId)
  if (!p) return []
  return (p.spoken_by ?? []).filter(
    (s) => !direction || s.direction === direction || s.direction === 'bidirectional'
  )
}

/**
 * Can these two products talk to each other, and over what?
 * Returns the protocols where one can send and the other can receive.
 */
export function interop(idA, idB) {
  const a = products.find((p) => p.id === idA)
  const b = products.find((p) => p.id === idB)
  if (!a || !b) return []
  const canSend = (e) => new Set((e.speaks ?? []).filter((s) => s.direction !== 'in').map((s) => s.protocol))
  const canRecv = (e) => new Set((e.speaks ?? []).filter((s) => s.direction !== 'out').map((s) => s.protocol))
  const out = []
  for (const proto of canSend(a)) if (canRecv(b).has(proto)) out.push({ from: a.id, to: b.id, protocol: proto })
  for (const proto of canSend(b)) if (canRecv(a).has(proto)) out.push({ from: b.id, to: a.id, protocol: proto })
  return out
}

/** Look up a glossary term in either language. */
export function term(query) {
  const q = String(query).toLowerCase()
  return terms.filter(
    (t) =>
      t.id === q ||
      t.en?.toLowerCase() === q ||
      t.zh_hant === query ||
      t.zh_hans === query ||
      (t.regional_variants ?? []).some((r) => r.term === query || r.term.toLowerCase() === q)
  )
}

/** Fetch any entry by collection and id. */
export function get(collection, id) {
  return (COLLECTIONS[collection] ?? []).find((e) => e.id === id) ?? null
}

/**
 * Substring search across everything, including ports, aka names and Chinese
 * terms, because that is what people type when they are mid-problem.
 */
export function search(query, { collection, limit = 50 } = {}) {
  const terms_ = String(query).toLowerCase().split(/\s+/).filter(Boolean)
  const pool = collection ? [[collection, COLLECTIONS[collection] ?? []]] : Object.entries(COLLECTIONS)
  const out = []
  for (const [key, entries] of pool) {
    for (const e of entries) {
      const hay = [
        e.id, e.name, e.en, e.designation, e.title, e.zh_hant, e.zh_hans, e.vendor, e.body,
        e.summary, e.definition_en, e.scope,
        (e.aka ?? []).join(' '), (e.tags ?? []).join(' '),
        (e.default_ports ?? []).map((p) => `${p.number} ${p.transport}`).join(' '),
      ].filter(Boolean).join(' ').toLowerCase()
      if (terms_.every((t) => hay.includes(t))) out.push({ collection: key, ...e })
      if (out.length >= limit) return out
    }
  }
  return out
}

/** Everything we know is missing, optionally filtered to one collection. */
export function missing(collection) {
  return collection ? gaps.filter((g) => g.collection === collection) : gaps
}

export default {
  protocols, software, hardware, standards, terms, products, contributors, gaps, meta,
  byPort, whoSpeaks, interop, term, get, search, missing,
}
