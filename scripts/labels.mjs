/**
 * One label map, used everywhere a machine value reaches a person.
 *
 * The dataset stores stable, sortable, lowercase keys - `audio-transport`,
 * `open-free-registration`, `dongle-locked` - which is correct for a file
 * that other people's code reads. Rendering those keys as headings is what
 * made the site read like a database dump rather than a reference.
 *
 * The machine value is never thrown away: every call site keeps it in a
 * `data-value` attribute or a `title`, so anybody working against the API can
 * still see the key behind the label. And the map deliberately falls back to
 * a readable de-hyphenation rather than to the raw key, so a value added to
 * the YAML tomorrow reads as "Haptic feedback" and not "haptic-feedback"
 * while nobody has got round to naming it here.
 */

/** Category, for protocols, software and hardware. */
const CATEGORY = {
  // protocols
  'audio-transport': 'Audio transport',
  'audio-control': 'Audio control',
  'lighting-control': 'Lighting control',
  'video-transport': 'Video transport',
  'video-control': 'Video control',
  'media-control': 'Media control',
  'show-control': 'Show control',
  'timecode-sync': 'Timecode and sync',
  'tracking-position': 'Tracking and position',
  'device-management': 'Device management',
  'network-transport': 'Network transport',
  'machinery-motion': 'Machinery and motion',
  // software
  'audio-mixing': 'Audio mixing',
  'audio-playback': 'Audio playback',
  'cad-drafting': 'CAD and drafting',
  'content-creation': 'Content creation',
  'cue-playback': 'Cue playback',
  'media-server': 'Media servers',
  'monitoring-diagnostics': 'Monitoring and diagnostics',
  'networking-utility': 'Networking utilities',
  previsualisation: 'Previsualisation',
  'production-management': 'Production management',
  tracking: 'Tracking',
  'video-playback': 'Video playback',
  // hardware
  amplifier: 'Amplifiers',
  'audio-console': 'Audio consoles',
  'audio-processor': 'Audio processors',
  'dimmer-distro': 'Dimmers and distro',
  'dmx-node': 'DMX nodes',
  'io-interface': 'I/O interfaces',
  'lighting-console': 'Lighting consoles',
  'motion-control': 'Motion control',
  'network-switch': 'Network switches',
  'show-controller': 'Show controllers',
  'timecode-generator': 'Timecode generators',
  'tracking-system': 'Tracking systems',
  'video-processor': 'Video processors',
  'wireless-dmx': 'Wireless DMX',
}

/** How open a protocol's specification is. */
const OPENNESS = {
  'open-published': 'Open standard, published freely',
  'open-free-registration': 'Open standard, free registration',
  'published-paid': 'Published, paid copy',
  'proprietary-documented': 'Proprietary, documented',
  'proprietary-closed': 'Proprietary, closed',
}

/** Short forms, for pills and table cells where the long one will not fit. */
const OPENNESS_SHORT = {
  'open-published': 'Open',
  'open-free-registration': 'Open, free sign-up',
  'published-paid': 'Paid spec',
  'proprietary-documented': 'Proprietary, documented',
  'proprietary-closed': 'Proprietary',
}

/** What it costs. */
const PRICE = {
  free: 'Free',
  'open-source': 'Open source',
  freemium: 'Free tier, paid upgrade',
  'one-off-purchase': 'One-off purchase',
  subscription: 'Subscription',
  'dongle-locked': 'Paid, dongle-locked',
  'quote-only': 'Price on application',
}

/** Where it runs. */
const PLATFORM = {
  macos: 'macOS', windows: 'Windows', linux: 'Linux', ios: 'iOS',
  android: 'Android', web: 'Web', embedded: 'Embedded',
}

/** Lifecycle, shared by protocols, software and standards. */
const STATUS = {
  current: 'Current',
  draft: 'Draft',
  deprecated: 'Deprecated',
  superseded: 'Superseded',
  historical: 'Historical',
}

/** How much we trust the entry. Never decorative - this drives the one green. */
const CONFIDENCE = {
  verified: 'Verified against the source',
  reported: 'Reported, not yet verified',
}

/** Glossary domain. */
const DOMAIN = {
  audio: 'Audio', video: 'Video', lighting: 'Lighting', rigging: 'Rigging',
  networking: 'Networking', automation: 'Automation', safety: 'Safety',
  scenic: 'Scenic', wardrobe: 'Wardrobe', general: 'General',
  'stage-management': 'Stage management',
  'production-management': 'Production management',
}

const MAPS = {
  category: CATEGORY,
  openness: OPENNESS,
  'openness-short': OPENNESS_SHORT,
  price_model: PRICE,
  platforms: PLATFORM,
  status: STATUS,
  confidence: CONFIDENCE,
  domain: DOMAIN,
}

/**
 * Turn a key nobody named into something readable: hyphens to spaces, first
 * letter up. `haptic-feedback` becomes `Haptic feedback`. Values that are
 * already prose (standards bodies like "ISO/IEC" or "文化和旅游部") pass
 * through untouched, because they are not keys.
 */
function humanise(value) {
  const v = String(value ?? '')
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v)) return v
  const s = v.replace(/-/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * The label for one machine value in one field.
 *
 * @param {string} field  one of the keys of MAPS, e.g. 'category'
 * @param {string} value  the machine value from the YAML
 */
export function label(field, value) {
  const m = MAPS[field]
  if (m && Object.prototype.hasOwnProperty.call(m, value)) return m[value]
  return humanise(value)
}

/** A list of values, laid out as prose: "Windows, macOS and Linux". */
export function labelList(field, values, conjunction = 'and') {
  const out = (values ?? []).map((v) => label(field, v))
  if (out.length <= 1) return out.join('')
  return `${out.slice(0, -1).join(', ')} ${conjunction} ${out[out.length - 1]}`
}

/** Every field this map covers, for the tests. */
export const LABEL_FIELDS = Object.keys(MAPS)

/** Exposed so a test can assert that no dataset value falls through. */
export const LABEL_MAPS = MAPS

/**
 * The short form of a steward, for a pill.
 *
 * A steward is often a sentence rather than a name: "ESTA/PLASA (Entertainment
 * Services and Technology Association), via ANSI" is 72 characters, and 45 of
 * the 92 protocol entries hold something over 30. Rendered whole into a pill
 * it stops being a label and becomes a paragraph with a border round it, which
 * on a phone wraps to two lines and crowds out the pills that actually
 * discriminate between entries.
 *
 * So the pill gets the organisation and the page keeps the rest. The cut is at
 * the first expansion or qualifier — an opening bracket, a comma, a semicolon
 * or a dash — because in every case in the dataset the name comes first and
 * the elaboration follows. Anything still too long is truncated on a word
 * boundary rather than mid-word.
 *
 * Returns the input unchanged when it is already short, so callers can compare
 * the two to decide whether the full version still needs saying.
 */
export function stewardShort(steward, max = 34) {
  const full = String(steward ?? '').trim()
  if (!full) return ''
  const cut = full.search(/\s*[(,;]|\s+[—–-]\s+/)
  let short = cut > 0 ? full.slice(0, cut).trim() : full
  if (short.length > max) {
    const clip = short.slice(0, max)
    const sp = clip.lastIndexOf(' ')
    short = `${(sp > max * 0.6 ? clip.slice(0, sp) : clip).trim()}…`
  }
  return short
}
