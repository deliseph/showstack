#!/usr/bin/env node
/**
 * Generates the contributor backlog.
 *
 * Two sources:
 *   1. Gaps computed from the data itself (never goes stale)
 *   2. A curated wishlist of entries that should exist and do not
 *
 * Output is either a JSON file, or `gh issue create` commands you can review
 * before running. It deliberately does not post anything by itself.
 *
 *   node scripts/seed-issues.mjs                 # human-readable preview
 *   node scripts/seed-issues.mjs --sh > seed.sh  # gh commands
 *   node scripts/seed-issues.mjs --json          # machine readable
 *
 * Rule of thumb: an issue that cannot be finished in fifteen minutes by
 * someone who has never seen this repo is too big. Split it.
 */
import { writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadCollection, ROOT } from './lib/load.mjs'

const REPO = process.env.SHOWSTACK_REPO ?? 'OWNER/showstack'

/** Entries that should exist. Each becomes one self-contained issue. */
const WISHLIST = {
  protocols: [
    ['midi', 'Generic MIDI 1.0. Eight indexed products reference MIDI capability and there is no entry to point at.'],
    ['midi-2', 'MIDI 2.0 / UMP. Increasingly relevant and almost undocumented in a show context.'],
    ['ma-net', 'MA Lighting MA-Net2 / MA-Net3. Proprietary, but everyone has to plan a network around it.'],
    ['etcnet3', 'ETC Net3. What it wraps, and how it coexists with sACN on the same wire.'],
    ['hognet', 'High End Systems Hog network protocol.'],
    ['shownet', 'Strand ShowNet.'],
    ['crmx', 'LumenRadio CRMX wireless DMX.'],
    ['w-dmx', 'Wireless Solution W-DMX.'],
    ['sacn-sync', 'E1.31 synchronisation packets as a distinct topic. Why pixel rigs tear without it.'],
    ['osc-query', 'OSCQuery. Discovery for OSC, used by Chataigne and TouchDesigner.'],
    ['open-sound-control-1-1', 'OSC 1.1 specifically, and how it differs from 1.0 in practice.'],
    ['q-lan', 'QSC Q-LAN audio transport.'],
    ['aes50', 'AES50 / SuperMAC. The reason a Midas rack works the way it does.'],
    ['madi', 'MADI (AES10). Still everywhere in broadcast and large-format live.'],
    ['cobranet', 'CobraNet. Legacy, but installed in a great many buildings.'],
    ['ndi-hx', 'NDI|HX and how its bandwidth and latency differ from full NDI.'],
    ['srt', 'Secure Reliable Transport. Increasingly used for remote contribution.'],
    ['rtsp', 'RTSP as used for camera and encoder feeds in venues.'],
    ['sdi-embedded-audio', 'Embedded audio in SDI, groups and pairs.'],
    ['genlock', 'Genlock and blackburst reference distribution.'],
    ['tri-level-sync', 'Tri-level sync for HD reference.'],
    ['smpte-2059', 'SMPTE ST 2059 PTP profile for media.'],
    ['canopen', 'CANopen as used in stage machinery.'],
    ['ethercat', 'EtherCAT in automation and motion control.'],
    ['profinet', 'PROFINET in venue and machinery integration.'],
    ['opc-ua', 'OPC UA where show control meets building systems.'],
    ['bacnet', 'BACnet. The protocol your HVAC and house lights are probably on.'],
    ['knx', 'KNX for architectural lighting in venues.'],
    ['dali', 'DALI for architectural and house lighting control.'],
    ['0-10v', '0-10V analogue control. Still the interface to a great deal of house lighting.'],
    ['smpte-timecode-ltc-vitc', 'VITC as distinct from LTC.'],
    ['word-clock', 'Word clock distribution and why it is not the same as PTP.'],
    ['rttrpm-osc-bridge', 'Common RTTrPM to OSC bridging patterns.'],
    ['bluetooth-midi', 'Bluetooth MIDI in performance contexts.'],
    ['gpio-contact-closure', 'Contact closure and GPIO triggering. The most reliable protocol in the building.'],
  ],
  software: [
    ['eos-family', 'ETC Eos family software.'],
    ['onyx', 'Obsidian Control ONYX.'],
    ['avolites-titan', 'Avolites Titan.'],
    ['chamsys-magicq', 'ChamSys MagicQ. Free for many use cases, widely used.'],
    ['dot2-onpc', 'MA dot2 onPC.'],
    ['lightkey', 'Lightkey for macOS.'],
    ['sunlite-suite', 'Sunlite Suite.'],
    ['millumin', 'Millumin.'],
    ['isadora', 'Isadora.'],
    ['pixera', 'AV Stumpfl PIXERA.'],
    ['hippotizer', 'Green Hippo Hippotizer.'],
    ['modulo-player', 'Modulo Pi Modulo Player.'],
    ['smode', 'Smode.'],
    ['notch', 'Notch.'],
    ['reaper', 'REAPER as a show playback and timecode host.'],
    ['multiplay', 'Multiplay.'],
    ['show-cue-system', 'Show Cue System.'],
    ['ableton-live', 'Ableton Live in a live show control context, not a studio one.'],
    ['qsys-designer', 'Q-SYS Designer.'],
    ['dante-controller', 'Dante Controller.'],
    ['dante-via', 'Dante Via.'],
    ['wireshark', 'Wireshark, with the entertainment protocol dissectors that matter.'],
    ['dmxcat', 'City Theatrical DMXcat.'],
    ['sacnview', 'sACNView.'],
    ['artnetominator', 'Artnetominator.'],
    ['ola-web', 'OLA web UI as distinct from the daemon.'],
    ['depence', 'Syncronorm Depence.'],
    ['wysiwyg', 'CAST WYSIWYG.'],
    ['augment3d', 'ETC Augment3d.'],
    ['moving-light-assistant', 'Moving Light Assistant.'],
    ['lightwright', 'Lightwright. Paperwork is production technology.'],
    ['propared', 'Propared.'],
    ['stagewrite', 'StageWrite.'],
  ],
  hardware: [
    ['chamsys-magicq-mq500', 'ChamSys MagicQ MQ500.'],
    ['avolites-diamond-9', 'Avolites Diamond 9.'],
    ['obsidian-netron-en12', 'Obsidian Netron EN12.'],
    ['etc-gateway-r24', 'ETC Response Gateway.'],
    ['artistic-licence-net-lynx', 'Artistic Licence Net-Lynx.'],
    ['pathway-vignette', 'Pathway Vignette.'],
    ['swisson-xnd', 'Swisson X-Node.'],
    ['enttec-dmx-usb-pro', 'ENTTEC DMX USB Pro. Probably the most common DMX interface on earth.'],
    ['brompton-tessera-sx40', 'Brompton Tessera SX40 LED processor.'],
    ['novastar-mx40-pro', 'NovaStar MX40 Pro.'],
    ['barco-e2', 'Barco E2 screen management.'],
    ['analog-way-aquilon', 'Analog Way Aquilon.'],
    ['blackmagic-atem-constellation', 'Blackmagic ATEM Constellation.'],
    ['yamaha-rivage-pm', 'Yamaha RIVAGE PM.'],
    ['digico-quantum', 'DiGiCo Quantum.'],
    ['allen-heath-dlive', 'Allen & Heath dLive.'],
    ['midas-heritage-d', 'Midas HD96.'],
    ['lake-lm44', 'Lab.gruppen Lake LM44.'],
    ['kinesys-elevation', 'Kinesys Elevation.'],
    ['stage-tech-nomad', 'Stage Technologies Nomad.'],
    ['tait-navigator', 'TAIT Navigator.'],
    ['motion-labs-hoist-controller', 'Motion Labs hoist controllers.'],
    ['luminex-araneo', 'Luminex Araneo network management.'],
    ['cisco-cbs350', 'Cisco CBS350 as commonly specified for entertainment networks.'],
  ],
  standards: [
    ['ansi-e1-4', 'ANSI E1.4 manual counterweight rigging.'],
    ['ansi-e1-8', 'ANSI E1.8 loudspeaker suspension.'],
    ['ansi-e1-15', 'ANSI E1.15 recommended practice for portable control equipment.'],
    ['ansi-e1-22', 'ANSI E1.22 fire safety curtain systems.'],
    ['ansi-e1-27-1', 'ANSI E1.27-1 portable DMX512 cable.'],
    ['ansi-e1-30-series', 'ANSI E1.30 series, EPIs for ACN.'],
    ['ansi-e1-37-series', 'ANSI E1.37 series, RDM parameter extensions.'],
    ['ansi-e1-45', 'ANSI E1.45 unidirectional transport of DMX512 over IP.'],
    ['ansi-e1-54', 'ANSI E1.54 PLASA standard for DMX512 in installations.'],
    ['smpte-st-2110-10', 'SMPTE ST 2110-10, system timing and definitions.'],
    ['smpte-st-2110-20', 'SMPTE ST 2110-20, uncompressed active video.'],
    ['smpte-st-2110-30', 'SMPTE ST 2110-30, PCM audio.'],
    ['smpte-st-2022-7', 'SMPTE ST 2022-7 seamless protection switching.'],
    ['aes3', 'AES3 digital audio interface.'],
    ['aes10-madi', 'AES10 (MADI).'],
    ['iec-61010', 'IEC 61010 safety of measurement and control equipment.'],
    ['bs-7906', 'BS 7906 lifting equipment for performance.'],
    ['din-56950', 'DIN 56950 entertainment machinery safety.'],
    ['en-17206', 'EN 17206 entertainment machinery. The European counterpart people ask about constantly.'],
    ['iso-45001', 'ISO 45001 occupational health and safety management.'],
    ['nfpa-160', 'NFPA 160 flame effects before an audience.'],
    ['ansi-z136-1', 'ANSI Z136.1 safe use of lasers.'],
  ],
  terms: [
    ['dead-hang', ''], ['bridle', ''], ['shackle', ''], ['soft-goods', ''], ['scrim', ''],
    ['cyclorama', ''], ['borders-legs', ''], ['apron', ''], ['thrust', ''], ['proscenium', ''],
    ['orchestra-pit', ''], ['fly-tower', ''], ['grid', ''], ['catwalk', ''], ['fol', ''],
    ['boom', ''], ['ladder', ''], ['sidelight', ''], ['backlight', ''], ['wash', ''],
    ['special', ''], ['gobo-rotator', ''], ['barn-door', ''], ['top-hat', ''], ['iris', ''],
    ['frost', ''], ['haze', ''], ['low-fogger', ''], ['pyro', ''], ['confetti', ''],
    ['dmx-address', ''], ['patch-sheet', ''], ['magic-sheet', ''], ['cue-light', ''], ['comms', ''],
    ['clear-com', ''], ['ring-intercom', ''], ['god-mic', ''], ['fold-back', ''], ['iem', ''],
    ['line-check', ''], ['sound-check', ''], ['ring-out', ''], ['gain-before-feedback', ''],
    ['dry-hire', ''], ['crew-call', ''], ['turnaround', ''], ['golden-time', ''], ['dark-fibre', ''],
    ['production-meeting', ''], ['advance', ''], ['rider', ''], ['tech-rider', ''], ['hospitality-rider', ''],
    ['run-of-show', ''], ['calling-script', ''], ['standby', ''], ['go', ''], ['hold', ''],
    ['abort', ''], ['clear-the-deck', ''], ['heads-up', ''], ['walking', ''], ['dead-case', ''],
  ],
}

const GAP_HELP = {
  default_ports: 'Find the port in the vendor documentation or the specification, and cite it. If the protocol genuinely has no default port, say so in a `note` and close the issue.',
  first_published: 'A citable year the protocol or product first appeared. Vendor history pages and standards front matter are usually best.',
  implementations: 'One or more open source libraries that speak this protocol. Link the repository and record the language and SPDX licence.',
  gotchas: 'The highest-value field in the index. What bites people at 2am with this thing? Concrete and specific beats general.',
  spec_url: 'A link to the actual specification document, if one is publicly available.',
  speaks: 'Which protocols does this product send or receive, and in which direction? Cite the manual page. Set `confidence: verified` only if you have actually done it.',
  platforms: 'Which operating systems does it run on? The vendor system-requirements page is the source.',
  price_model: 'Free, subscription, one-off, dongle-locked, quote-only. Cite the vendor pricing page.',
  repo: 'Link to the source repository if the project is open source.',
  physical_ports: 'What is on the back panel. Connector types and counts, from the manual.',
  released: 'The year this product shipped, with a source.',
  year: 'The publication year of this edition of the standard.',
  scope: 'What the document actually covers, in plain language. Two or three sentences.',
  free_to_read: 'Can the full text be downloaded at no cost? ESTA publishes many ANSI E1.x standards free; most other bodies do not.',
  access_url: 'Where to obtain the document.',
  zh_hant: 'The Traditional Chinese term crews actually say, not the dictionary translation.',
  definition_zh_hant: 'The definition in Traditional Chinese.',
  false_friends: 'Terms that look equivalent and are not. The single most useful field in the glossary.',
  regional_variants: 'Same job, different word depending on where you are standing. HK vs TW vs UK vs US.',
}

const issues = []

// 1. Generated from the data
for (const g of JSON.parse(
  (() => { try { return readFileSync(join(ROOT, 'dist/api/v1/gaps.json'), 'utf8') } catch { return '[]' } })()
)) {
  for (const field of g.missing) {
    issues.push({
      title: `[gap] ${g.collection}/${g.id}: add \`${field}\``,
      labels: ['good first issue', 'data'],
      body: [
        `\`data/${g.collection}/${g.id}.yaml\` is missing \`${field}\`.`,
        ``,
        GAP_HELP[field] ?? 'Fill this field, with a source.',
        ``,
        `**How to do it**`,
        ``,
        `1. Open [\`data/${g.collection}/${g.id}.yaml\`](../blob/main/data/${g.collection}/${g.id}.yaml) and press the pencil icon. No local setup needed.`,
        `2. Add the field. Copy the shape from a neighbouring file in the same folder.`,
        `3. Add the source to \`sources\`, and your handle to \`contributed_by\`.`,
        `4. Propose changes, open the pull request. CI checks it in about a minute.`,
        ``,
        `If you cannot find a citable source, that is a useful result too. Say so here and we will mark the field as genuinely unknown rather than leaving it looking undone.`,
      ].join('\n'),
    })
  }
}

// 2. Curated wishlist
for (const [collection, items] of Object.entries(WISHLIST)) {
  const existing = new Set(loadCollection(collection).map((e) => e.doc?.id))
  for (const [id, why] of items) {
    if (existing.has(id)) continue
    issues.push({
      title: `[new entry] ${collection}/${id}`,
      labels: ['good first issue', 'data', collection === 'terms' ? 'bilingual' : 'help wanted'],
      body: [
        `The index has no entry for \`${id}\`.${why ? ` ${why}` : ''}`,
        ``,
        `**How to do it**`,
        ``,
        `1. Create \`data/${collection}/${id}.yaml\`. Use the [new file button](../new/main/data/${collection}) on GitHub, no local setup needed.`,
        `2. Copy the shape of any neighbouring file in \`data/${collection}/\`. [\`schema/\`](../tree/main/schema) lists every allowed field with an explanation of why it exists.`,
        `3. Fill in only what you can cite. **Leave out anything you cannot.** An omitted field becomes another issue like this one; a guessed field misleads a technician at 1am.`,
        `4. Add your handle to \`contributed_by\`.`,
        ``,
        `A partial entry is welcome. Name, category, summary, one source, and one honest \`gotcha\` is a complete contribution.`,
        ``,
        `Comment here to claim it so two people do not write the same file.`,
      ].join('\n'),
    })
  }
}

const sh = process.argv.includes('--sh')
const json = process.argv.includes('--json')

if (json) {
  writeFileSync(join(ROOT, 'seed-issues.json'), JSON.stringify(issues, null, 2))
  console.log(`Wrote ${issues.length} issues to seed-issues.json`)
} else if (sh) {
  console.log('#!/usr/bin/env bash')
  console.log('# Review before running. Each line creates one issue.')
  console.log(`# gh auth login first. Repo: ${REPO}`)
  console.log('set -euo pipefail\n')
  for (const i of issues) {
    const labels = i.labels.map((l) => `--label ${JSON.stringify(l)}`).join(' ')
    console.log(`gh issue create --repo ${REPO} --title ${JSON.stringify(i.title)} ${labels} --body ${JSON.stringify(i.body)}`)
    console.log('sleep 2')
  }
} else {
  console.log(`\n${issues.length} issues ready to seed\n`)
  const byLabel = {}
  for (const i of issues) byLabel[i.title.split(']')[0] + ']'] = (byLabel[i.title.split(']')[0] + ']'] ?? 0) + 1
  for (const [k, v] of Object.entries(byLabel)) console.log(`  ${String(v).padStart(4)}  ${k}`)
  console.log(`\nPreview:\n`)
  for (const i of issues.slice(0, 8)) console.log(`  ${i.title}`)
  console.log(`\n  node scripts/seed-issues.mjs --sh > seed.sh   # review, then bash seed.sh`)
  console.log(`  node scripts/seed-issues.mjs --json           # machine readable\n`)
}
