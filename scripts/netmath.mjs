/**
 * The converged-network arithmetic and facts behind /network/.
 *
 * Two exports matter:
 *   NETDATA  - per-protocol QoS classes (DSCP values) and bandwidth figures,
 *              each with the source it came from. This is data, not code, so
 *              it lives here once and is inlined into the page at build time.
 *   qosPlan / linkFill - pure functions over that data, unit tested in Node
 *              and embedded verbatim into the page via toString(), so the
 *              page can never disagree with the tests. They take the data as
 *              an argument to stay self-contained for the embedding.
 *
 * The point of the QoS planner is the conflict nobody sees coming: Dante
 * marks AUDIO as EF 46 while Q-LAN and standard AES67 mark their PTP CLOCK
 * as EF 46. Put them in one queue untouched and audio packets can starve the
 * other system's clock. That is the crash people describe as "it just fell
 * over when we added the second system".
 */

export const NETDATA = {
  protocols: {
    dante: {
      name: 'Dante',
      classes: [
        { kind: 'clock', label: 'PTP time-critical', dscp: 56, dscpName: 'CS7' },
        { kind: 'media', label: 'Audio + PTP follow-up', dscp: 46, dscpName: 'EF' },
      ],
      source: 'https://support.getdante.com/hc/en-gb/articles/5508296234399',
      note: 'Hardware devices mark as shown; Dante software (Via, Virtual Soundcard) sends unmarked traffic.',
    },
    qlan: {
      name: 'Q-LAN (Q-SYS)',
      classes: [
        { kind: 'clock', label: 'PTPv2 clock', dscp: 46, dscpName: 'EF' },
        { kind: 'media', label: 'Audio streams', dscp: 34, dscpName: 'AF41' },
        { kind: 'media', label: 'Video streams', dscp: 26, dscpName: 'AF31' },
      ],
      source: 'https://support.qsys.com/en_US/awareness/awareness-%7C-quality-of-service-settings-across-qlan-dante-and-aes67',
    },
    aes67: {
      name: 'AES67 (standard profile)',
      classes: [
        { kind: 'clock', label: 'PTPv2 clock', dscp: 46, dscpName: 'EF' },
        { kind: 'media', label: 'Media RTP', dscp: 34, dscpName: 'AF41' },
      ],
      source: 'https://support.qsys.com/en_US/awareness/awareness-%7C-quality-of-service-settings-across-qlan-dante-and-aes67',
      note: 'Audinate devices running AES67 mode keep Dante marking: clock CS7 56, media EF 46.',
    },
    'avb-milan': {
      name: 'AVB / Milan',
      classes: [
        { kind: 'reserved', label: 'Stream reservation (SRP/credit-based shaper)', dscp: null, dscpName: '802.1Q' },
      ],
      source: 'https://avnu.org/milan/',
      note: 'AVB does not use DSCP: it reserves bandwidth per stream in the switch itself, which is why every switch in the path must be AVB-capable.',
    },
    sacn: {
      name: 'sACN (E1.31)',
      classes: [
        { kind: 'control', label: 'Levels + sync (multicast UDP)', dscp: 0, dscpName: 'BE' },
      ],
      source: 'https://tsp.esta.org/tsp/documents/published_docs.php',
      note: 'The standard defines no DSCP marking. Classify it on the switch (by port or ACL) if lighting shares the LAN with heavy traffic.',
    },
    'art-net': {
      name: 'Art-Net',
      classes: [
        { kind: 'control', label: 'ArtDmx (unicast/broadcast UDP 6454)', dscp: 0, dscpName: 'BE' },
      ],
      source: 'https://art-net.org.uk/downloads/art-net.pdf',
      note: 'No standard marking, and broadcast mode floods every port: keep it off converged networks or force unicast.',
    },
    ndi: {
      name: 'NDI (full bandwidth)',
      classes: [
        { kind: 'bulk', label: 'Video/audio streams (bursty TCP/UDP)', dscp: 0, dscpName: 'BE' },
      ],
      source: 'https://docs.ndi.video/all/getting-started/white-paper/bandwidth',
      note: 'Not deterministic and bursty: give it bandwidth, not priority. Prioritising NDI above clocks is how you starve PTP.',
    },
    'smpte-st-2110': {
      name: 'SMPTE ST 2110',
      classes: [
        { kind: 'clock', label: 'PTP (ST 2059 profile)', dscp: 46, dscpName: 'EF' },
        { kind: 'media', label: 'Essence flows', dscp: 34, dscpName: 'AF41' },
      ],
      source: 'https://www.smpte.org/standards/st2110',
      note: 'Deployments commonly follow AES67-style marking; broadcast plants normally pin exact values per facility spec.',
    },
    // --- added: the protocols a converged show network actually also carries
    'rdmnet': {
      name: 'RDMnet (E1.33)',
      classes: [
        { kind: 'control', label: 'Device management over IP', dscp: 0, dscpName: 'BE' },
      ],
      source: 'https://tsp.esta.org/tsp/documents/published_docs.php',
      note: 'Management traffic, not show data. It is bursty during discovery and can be given a low priority without harm — but do not starve it, or a console appears to lose devices.',
    },
    'ptp-1588': {
      name: 'PTP / gPTP (IEEE 1588, 802.1AS)',
      classes: [
        { kind: 'clock', label: 'Sync and announce messages', dscp: 56, dscpName: 'CS7' },
      ],
      source: 'https://standards.ieee.org/ieee/1588/6825/',
      note: 'The clock has to win every argument. A late clock packet is worse than a late media packet, because everything downstream drifts rather than glitching once. Where a media protocol carries its own PTP profile, mark to that profile rather than to this.',
    },
    'osc': {
      name: 'OSC',
      classes: [
        { kind: 'control', label: 'Control messages (usually UDP)', dscp: 0, dscpName: 'BE' },
      ],
      source: 'https://opensoundcontrol.stanford.edu/spec-1_0.html',
      note: 'The specification says nothing about marking or even about transport. Classify by port on the switch, and remember that UDP OSC has no delivery guarantee at all — a dropped cue is simply gone.',
    },
    'psn': {
      name: 'PosiStageNet',
      classes: [
        { kind: 'control', label: 'Tracking positions (multicast UDP)', dscp: 0, dscpName: 'BE' },
      ],
      source: 'https://posistage.net/',
      note: 'Position data at a high rate. Late positions are visibly worse than dropped ones on a followspot or a projection map, so it wants low latency more than it wants reliability.',
    },
    'citp': {
      name: 'CITP / MSEX',
      classes: [
        { kind: 'control', label: 'Fixture and media exchange', dscp: 0, dscpName: 'BE' },
      ],
      source: 'http://citp-protocol.org/',
      note: 'Thumbnails and media library exchange, which means occasional large transfers between a console and a media server. Give it a ceiling rather than a priority, or a library sync will sit on top of show traffic.',
    },
    'srt': {
      name: 'SRT',
      classes: [
        { kind: 'media', label: 'Contribution video over unreliable links', dscp: 34, dscpName: 'AF41' },
      ],
      source: 'https://www.srtalliance.org/',
      note: 'Designed for links you do not control, with its own retransmission and a configurable latency buffer. On a LAN that buffer is wasted latency; SRT earns its keep between buildings, not inside one.',
    },
    'ravenna': {
      name: 'Ravenna',
      classes: [
        { kind: 'clock', label: 'PTP time-critical', dscp: 56, dscpName: 'CS7' },
        { kind: 'media', label: 'Audio streams', dscp: 46, dscpName: 'EF' },
      ],
      source: 'https://www.ravenna-network.com/',
      note: 'AES67-compatible in its interoperability mode, and marks the same way. Where a network carries both Ravenna and Dante, they compete for the same EF queue and the queue has to be sized for the sum.',
    },
  },

  bandwidth: {
    'dante-flow-48k': { label: 'Dante flow (4ch, 48 kHz)', mbps: 5, source: 'https://www.glensound.co.uk/assets/library/5ddff2e74d5e7-Dante%20bandwidth.pdf' },
    'dante-flow-96k': { label: 'Dante flow (4ch, 96 kHz)', mbps: 11, source: 'https://www.glensound.co.uk/assets/library/5ddff2e74d5e7-Dante%20bandwidth.pdf' },
    'sacn-universe': { label: 'sACN universe (full rate)', mbps: 0.23, source: 'https://support.etcconnect.com/ETC/Getting_Started_with_ETC_and_FAQ/sACN_Bandwidth_Utilization', note: 'Worst case at ~44 packets/s; ETC measured ~0.12 Mbps typical with suppression.' },
    'artnet-universe': { label: 'Art-Net universe (full rate)', mbps: 0.25, source: 'https://art-net.org.uk/downloads/art-net.pdf' },
    'ndi-1080p60': { label: 'NDI full 1080p60 stream', mbps: 150, source: 'https://docs.ndi.video/all/getting-started/white-paper/bandwidth' },
    'ndi-hx-1080p60': { label: 'NDI HX 1080p60 stream', mbps: 20, source: 'https://jemproductions.fi/guides/ndi-bandwidth-explained/', note: 'Vendor and generation dependent; plan 8-30 Mbps.' },
    'qlan-stream': { label: 'Q-LAN audio stream (16ch)', mbps: 33, source: 'https://q-syshelp.qsc.com/q-sys_7.0/content/Appendix/q_dn_qlan_notes.pdf', note: 'Q-LAN sends fixed 16-channel streams at 48 kHz/32-bit.' },
    'st2110-hd': { label: 'ST 2110-20 uncompressed 1080p59.94', mbps: 2600, source: 'https://www.smpte.org/standards/st2110' },
    'st2110-uhd': { label: 'ST 2110-20 uncompressed UHD (2160p59.94, 10-bit)', mbps: 11900, source: 'https://www.smpte.org/standards' },
    'ndi-4k60': { label: 'NDI High Bandwidth 2160p60', mbps: 250, source: 'https://ndi.video/tech/' },
    'srt-1080p': { label: 'SRT / H.264 contribution 1080p', mbps: 8, source: 'https://www.srtalliance.org/' },
    'psn-tracker': { label: 'PosiStageNet, 20 trackers at 60 Hz', mbps: 1, source: 'https://posistage.net/' },
    'ravenna-flow': { label: 'Ravenna / AES67 flow (8ch, 48 kHz, 1 ms)', mbps: 10, source: 'https://www.ravenna-network.com/' },
  },
}

/**
 * Merge the QoS classes of the selected protocols into a queue plan and
 * surface conflicts: a DSCP value carrying both someone's clock and someone
 * else's media is the classic converged-network failure.
 */
export function qosPlan(data, selected) {
  const rows = []
  for (const id of selected) {
    const p = data.protocols[id]
    if (!p) continue
    for (const c of p.classes) rows.push({ protocol: p.name, id, ...c })
  }
  const byDscp = new Map()
  for (const r of rows) {
    if (r.dscp === null) continue
    if (!byDscp.has(r.dscp)) byDscp.set(r.dscp, [])
    byDscp.get(r.dscp).push(r)
  }
  const conflicts = []
  for (const [dscp, list] of byDscp) {
    const kinds = new Set(list.map((r) => r.kind))
    if (kinds.has('clock') && (kinds.has('media') || kinds.has('bulk'))) {
      const clocks = list.filter((r) => r.kind === 'clock').map((r) => r.protocol)
      const heavy = list.filter((r) => r.kind !== 'clock').map((r) => r.protocol)
      conflicts.push({
        dscp,
        clocks,
        heavy,
        text: 'DSCP ' + dscp + ' carries ' + clocks.join(' + ') + ' clock AND ' + heavy.join(' + ') +
          ' media. Heavy media can starve the clock in that queue: separate them by VLAN, or remap one side on the switch.',
      })
    }
  }
  // Four-queue plan, highest first - the shape most managed switches offer.
  const queue = (kinds) => rows.filter((r) => kinds.includes(r.kind))
  return {
    rows,
    conflicts,
    queues: [
      { name: 'Q4 strict priority', holds: queue(['clock']) },
      { name: 'Q3 high', holds: queue(['media']) },
      { name: 'Q2 medium', holds: queue(['control']) },
      { name: 'Q1 best effort', holds: queue(['bulk']) },
    ],
    avb: rows.some((r) => r.dscp === null),
  }
}

/**
 * Link fill: how much of a 100M / 1G / 10G link the selected traffic uses.
 * The 75% ceiling is deliberate: sustained load above that leaves no room
 * for bursts, and NDI in particular is all bursts.
 */
export function linkFill(data, counts) {
  const breakdown = []
  let total = 0
  for (const [key, n] of Object.entries(counts)) {
    const item = data.bandwidth[key]
    const qty = Number(n)
    if (!item || !Number.isFinite(qty) || qty <= 0) continue
    const mbps = item.mbps * qty
    breakdown.push({ key, label: item.label, qty, mbps: Math.round(mbps * 100) / 100 })
    total += mbps
  }
  const r1 = (x) => Math.round(x * 10) / 10
  const verdict = (cap) => {
    const pct = (total / cap) * 100
    return { cap, pct: r1(pct), ok: pct <= 75, tight: pct > 75 && pct <= 100 }
  }
  return {
    totalMbps: r1(total),
    breakdown,
    links: { m100: verdict(100), g1: verdict(1000), g10: verdict(10000) },
  }
}
