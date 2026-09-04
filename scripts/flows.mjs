/**
 * The Four Flows — one model for every piece of traffic on a show network.
 *
 * Borrowed, with thanks, from the way this is taught in a first-year computer
 * systems module for lighting, audio and video students. The claim is small
 * and the payoff is large: anything on a show network is CONTROL, MEDIA,
 * CLOCK or MANAGEMENT, each has a character, and each has one specific thing
 * that kills it. Once somebody can classify traffic on sight they can predict
 * what a switch will do to it, which is the whole skill.
 *
 * WHY THIS IS NOT JUST A RENAME OF `category`.
 *
 * `category` says what a protocol is FOR. Flow says what it BEHAVES LIKE on a
 * wire, and the two come apart more often than a lookup table would suggest.
 * RDM is lighting-adjacent and behaves like management. RTP sits under
 * network-transport and behaves like media. That divergence is the whole
 * reason the field earns its place: where flow and category agree it adds a
 * little, and where they disagree it is telling you something a category
 * never could.
 *
 * WHY SOME ENTRIES HAVE NO FLOW.
 *
 * Because some of them are not traffic. PoE is power. RS-485 is a pair of
 * wires and a voltage convention. Giving those a flow would be a guess
 * dressed as a fact, and this project would rather leave a field blank —
 * which is what it does everywhere else, and the reason anything here can be
 * cited at all.
 *
 * DRIFT.
 *
 * Nothing is derived silently. Every protocol must appear in the category
 * default, an explicit override, or the not-a-flow list, and a test fails the
 * build when one does not. So a protocol added next year cannot quietly
 * inherit somebody's guess: it stops the build until a human decides.
 */

export const FLOWS = {
  control: {
    label: 'Control',
    short: 'Small, urgent, must arrive',
    character: 'Small messages that either repeat constantly or fire once. Bandwidth is almost never the problem.',
    kills: 'Latency and loss on the messages that fire once. A repeating level survives a dropped packet; a GO does not.',
  },
  media: {
    label: 'Media',
    short: 'Large, continuous, on time and in order',
    character: 'Continuous streams that are large enough to be sized properly, and that must arrive in order and on time.',
    kills: 'Anything that starves the link — usually a management transfer nobody scheduled — and jitter that outruns the receive buffer.',
  },
  clock: {
    label: 'Clock and sync',
    short: 'Tiny, ruthlessly regular',
    character: 'Almost no bandwidth. Carries no content at all, only agreement about when. Its value is entirely in its regularity.',
    kills: 'Jitter, an unaware switch delaying the timestamps it was meant to correct, and two devices both convinced they are the master.',
  },
  management: {
    label: 'Management',
    short: 'Housekeeping, no deadline',
    character: 'Discovery, monitoring, configuration, backups, updates. Useful, and none of it has a deadline of its own.',
    kills: 'Nothing kills it. That is the problem: with no deadline it has no manners, and it will happily starve everything that does have one. Putting it on a show VLAN is the commonest self-inflicted wound in the industry.',
  },
}

/** The default for each category, where the category genuinely predicts it. */
const BY_CATEGORY = {
  'audio-transport': 'media',
  'video-transport': 'media',
  'lighting-control': 'control',
  'machinery-motion': 'control',
  'show-control': 'control',
  'media-control': 'control',
  'audio-control': 'control',
  'video-control': 'control',
  'tracking-position': 'control',
  'timecode-sync': 'clock',
  'device-management': 'management',
}

/**
 * Where behaviour on the wire differs from what the category implies.
 *
 * Each entry says why, because an override without a reason is indistinguishable
 * from a mistake six months later.
 */
const OVERRIDE = {
  // Filed under network-transport, but this is the media carrier itself.
  rtp: ['media', 'The transport AES67, RAVENNA and ST 2110 all actually run on.'],
  // Network-transport entries that are pure housekeeping.
  dhcp: ['management', 'Address handout. Nothing that has started working depends on it continuing.'],
  igmp: ['management', 'Housekeeping that decides where multicast media is allowed to go — management traffic with an outsized effect on media.'],
  'mdns-dns-sd': ['management', 'Discovery. It is how devices find each other, and it is chatty in a way that matters on a busy VLAN.'],
  lldp: ['management', 'Neighbour discovery, for the benefit of whoever has to draw the diagram later.'],
  // Network-transport entries that carry control.
  acn: ['control', 'The architecture sACN was cut down from. What it carries is lighting control.'],
  thread: ['control', 'A low-power mesh, and in a venue what crosses it is device control.'],
  zigbee: ['control', 'Same: a mesh whose payload is control, usually lighting and sensors.'],
  lorawan: ['management', 'Long-range, low-rate sensor telemetry. Nothing on it has a show deadline.'],
  // Device-management entries that genuinely control things.
  knx: ['control', 'Building control. It switches and dims real loads rather than reporting on them.'],
  bacnet: ['control', 'Building automation: HVAC and lighting plant, actually commanded rather than monitored.'],
  'ember-plus': ['control', 'Broadcast device control. It sets parameters rather than gathering statistics.'],
  matter: ['control', 'Smart-home device control, increasingly the layer a venue meets consumer kit through.'],
  'bluetooth-le': ['control', 'In this industry it is nearly always a control link — a phone setting a fixture or a speaker.'],
  // Two that look like control and behave like management.
  rdm: ['management', 'Discovery, addressing and configuration sharing the DMX pair. It has no show deadline and it competes with traffic that does — which is exactly why it is scheduled between the lighting frames rather than instead of them.'],
  rdmnet: ['management', 'The same job over IP, and the same reasoning.'],
  'osc-query': ['management', 'Introspection: asking a device what it can do, not telling it to do something.'],
  mqtt: ['management', 'A message broker. In a venue it carries telemetry and status far more often than anything with a deadline.'],
  'opc-ua': ['management', 'Industrial monitoring and configuration. Its safety-rated siblings do the commanding.'],
  snmp: ['management', 'Monitoring. The definitive no-deadline protocol.'],
  // Timecode-sync entries where the flow is not clock.
  ntp: ['management', 'Wall-clock agreement to within milliseconds. Useful for log timestamps, nowhere near tight enough to be a show clock — a distinction people lose money on.'],
}

/**
 * Entries that carry no flow, because they are not traffic.
 *
 * Blank with a stated reason, rather than guessed. The reason is rendered, so
 * a reader is told why the field is empty instead of wondering.
 */
const NOT_A_FLOW = {
  poe: 'Power, not traffic. It shares the cable with a flow rather than being one.',
  'rs-232': 'An electrical and connector standard. What rides on it decides the flow.',
  'rs-422': 'An electrical standard, like RS-232 but balanced. The flow is whatever it carries.',
  'rs-485': 'The electrical layer DMX and many machinery buses sit on. It has no payload of its own.',
  edid: 'A description a display hands over once at connection. Not a stream of anything.',
  hdcp: 'An encryption and authentication scheme wrapped around a media link, not a flow beside it.',
}

/**
 * The flow for one protocol entry.
 *
 * Returns { flow, reason } where flow is a key of FLOWS, or
 * { flow: null, reason } where the entry deliberately carries none, or null
 * when nothing has decided — which the test treats as a failure.
 */
export function flowOf(protocol) {
  const id = protocol?.id
  if (!id) return null
  if (Object.hasOwn(NOT_A_FLOW, id)) return { flow: null, reason: NOT_A_FLOW[id] }
  if (Object.hasOwn(OVERRIDE, id)) {
    const [flow, reason] = OVERRIDE[id]
    return { flow, reason }
  }
  const byCat = BY_CATEGORY[protocol.category]
  if (byCat) return { flow: byCat, reason: null }
  return null
}

/** Group a list of protocols by flow, for an index or a comparison. */
export function byFlow(protocols) {
  const out = { control: [], media: [], clock: [], management: [], none: [] }
  for (const p of protocols) {
    const r = flowOf(p)
    if (!r) continue
    out[r.flow ?? 'none'].push(p)
  }
  return out
}
