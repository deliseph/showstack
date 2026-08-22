/**
 * The shared domain color-code: five super-domains that group the many
 * fine-grained `category`/`domain` strings in the dataset so a badge means
 * the same thing everywhere it appears (entry pages, cards, the homepage
 * search results). Not a new fact — just a coarse grouping of the real
 * category/domain field contributors already fill in.
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
