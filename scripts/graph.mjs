/**
 * The "living data" system: a shared domain color-code and a small, real
 * graph of who-speaks-what, used to draw the ambient constellation on the
 * section-index pages (ports, compare, tools, rf, network) and the homepage.
 *
 * This is a wayfinding layer, not a new fact — every edge in the graph is a
 * real `speaks` relationship already in the data, and every color is just a
 * grouping of the real `category`/`domain` field. Nothing here is invented;
 * it is the same taxonomy contributors already fill in, made visible.
 */

export const SUPER_DOMAINS = {
  visual: { label: 'lighting & video', color: '#ffb454' },
  audio: { label: 'audio', color: '#4fd1ff' },
  network: { label: 'network & data', color: '#6ea8fe' },
  safety: { label: 'rigging & safety', color: '#ec7f66' },
  control: { label: 'show control', color: '#b98cf2' },
}

/**
 * Bucket the many fine-grained `category`/`domain` strings used across the
 * five collections into five super-domains. Intentionally coarse: this is
 * for at-a-glance color grouping, not a taxonomy claim, so a term landing in
 * the wrong bucket costs a slightly-off badge color, not a wrong fact.
 */
export function superDomain(catOrDomain) {
  const c = String(catOrDomain ?? '').toLowerCase()
  if (/light|video/.test(c)) return 'visual'
  if (/audio/.test(c)) return 'audio'
  if (/network|device-management|control-data|monitoring|switch/.test(c)) return 'network'
  if (/rig|machin|track|safety|pyro|laser|electrical|dmx-node/.test(c)) return 'safety'
  return 'control'
}

/**
 * Build a small, real, capped graph for the ambient background.
 *
 * Nodes: every protocol (the hubs everything else connects through), plus
 * software/hardware products that speak at least one of them, up to a node
 * budget so the constellation stays legible and cheap to animate. Edges:
 * the real `speaks` links.
 *
 * Returns a compact shape safe to embed inline: nodes are just domain codes
 * (no ids/labels — this is decoration, not a second copy of the dataset),
 * edges are index pairs.
 */
export function buildGraph(db, { maxNodes = 70 } = {}) {
  const protoIds = new Set(db.protocols.map((p) => p.id))
  const nodesById = new Map()
  const addNode = (id, cat) => {
    if (!nodesById.has(id)) nodesById.set(id, { id, d: superDomain(cat) })
  }
  for (const p of db.protocols) addNode(`p:${p.id}`, p.category)

  const edgeSet = []
  for (const prod of [...db.software, ...db.hardware]) {
    const speaks = (prod.speaks ?? []).filter((s) => protoIds.has(s.protocol))
    if (!speaks.length) continue
    addNode(`x:${prod.id}`, prod.category)
    for (const s of speaks) edgeSet.push([`x:${prod.id}`, `p:${s.protocol}`])
  }

  let nodes = [...nodesById.values()]
  if (nodes.length > maxNodes) {
    const protoNodeIds = new Set([...protoIds].map((id) => `p:${id}`))
    const protoOnly = nodes.filter((n) => protoNodeIds.has(n.id))
    const productOnly = nodes.filter((n) => !protoNodeIds.has(n.id))
    const degree = new Map()
    for (const [a, b] of edgeSet) {
      degree.set(a, (degree.get(a) ?? 0) + 1)
      degree.set(b, (degree.get(b) ?? 0) + 1)
    }
    productOnly.sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0))
    const budget = Math.max(0, maxNodes - protoOnly.length)
    nodes = [...protoOnly, ...productOnly.slice(0, budget)]
  }

  const keep = new Set(nodes.map((n) => n.id))
  const idx = new Map(nodes.map((n, i) => [n.id, i]))
  const edges = edgeSet
    .filter(([a, b]) => keep.has(a) && keep.has(b))
    .map(([a, b]) => [idx.get(a), idx.get(b)])

  return { nodes: nodes.map((n) => n.d), edges }
}
