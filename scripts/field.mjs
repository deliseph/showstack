/**
 * /field/ — the card you open standing in a machine room with somebody waiting.
 *
 * Everything else on this site is written to be read. This page is written to
 * be USED, one-handed, on a phone, under time pressure, possibly on a venue
 * network that is the thing you are trying to fix. That changes every design
 * decision:
 *
 *   - The commands come from NET_COMMANDS in toolmath.mjs, which /tools/ also
 *     renders. One source, so the card and the calculator cannot disagree
 *     about what to type.
 *   - Every command is paired with what its output MEANS, because the wasted
 *     time in a machine room is almost never somebody running the wrong
 *     command. It is somebody running the right one and not reading it.
 *   - The numbers are the ones worth knowing by heart, not the ones that are
 *     interesting. If you would look it up anyway, it belongs in /tools/.
 *   - It is one page with no interaction required. A card that needs
 *     JavaScript to be legible is a card that fails in the one place it
 *     exists for, so the platform switch progressively enhances a table that
 *     already shows all three columns.
 *
 * The order is the diagnostic order — physical first, software last — because
 * that ordering IS the method, and a card that lists things alphabetically
 * teaches the opposite of the thing worth teaching.
 */
import { NET_COMMANDS, IP_RANGES } from './toolmath.mjs'

/**
 * What each of the six commands is actually telling you.
 *
 * Keyed by the question in NET_COMMANDS so it cannot drift from the command
 * list: a question that loses its entry here simply renders without the
 * detail block rather than showing the wrong one.
 */
const READING = {
  'What is my address?': {
    lines: [
      ['IPv4 address', 'Who this machine is.', '169.254.x.x means nobody answered the DHCP request.'],
      ['Subnet mask', 'How much of that address is the network.', 'A mask that disagrees with the other device is the fault.'],
      ['Default gateway', 'Where anything non-local is sent.', 'Blank is normal on a show network, and fine.'],
      ['Physical address', 'The MAC — the hardware identity.', 'This is the number the switch actually learns.'],
    ],
    note: 'Four lines, and only four. Everything else in that output is noise while you are standing up.',
  },
  'Can I reach that device?': {
    lines: [
      ['Replies, times low and steady', 'It is there and the path is healthy.', ''],
      ['Replies, times all over the place', 'The path is congested.', 'That is jitter, measured. Write the number down.'],
      ['Request timed out', 'It did not answer.', 'It may still be there and firewalled. Not proof of absence.'],
      ['Destination host unreachable', 'Your own machine does not know how to get there.', 'Check your mask before you touch anything else.'],
    ],
    note: 'Ping proves reachability, not correctness. A node that pings and does not output is a normal Tuesday: the address is right and something above layer 3 is wrong.',
  },
  'Where does the traffic actually go?': {
    lines: [
      ['One hop', 'Normal on a flat show network.', ''],
      ['Several hops', 'Something that should be local is being routed.', 'Somebody has put a router in the path. That is the finding.'],
      ['Stars, then it continues', 'That hop declined to answer.', 'Not a fault. Plenty of devices refuse to reply and forward perfectly.'],
      ['Stars, and it stops', 'That is where it dies.', 'Now you know whose problem it is before the conversation starts.'],
    ],
    note: '',
  },
  'What is on this network?': {
    lines: [
      ['Two IPs, one MAC', 'One device answering to two addresses.', ''],
      ['One IP, changing MAC', 'Two devices claiming the same address.', 'The classic: intermittent, both affected, either works alone.'],
      ['Nothing at all', 'You have not talked to anything yet.', 'The table only lists what this machine has recently spoken to.'],
    ],
    note: 'This is layer 2, and it finds the duplicate-address fault that nothing at layer 3 can name.',
  },
}

/**
 * The numbers worth carrying in your head.
 *
 * The test is not "is this useful" — everything on this site is useful. It is
 * "would having to look this up cost you the moment". Anything that fails
 * that test belongs in a calculator instead, and is linked to one.
 */
const NUMBERS = [
  ['Sound', [
    ['Speed of sound', '343 m/s at 20 °C', 'So about 3 ms per metre. Temperature moves it ~0.6 m/s per °C.', '/tools/#delay'],
    ['Inverse square law', '−6 dB per doubling of distance', 'Free field. Indoors the room refills part of it.', '/tools/#spl'],
    ['One bit of depth', '≈ 6 dB of dynamic range', '16-bit ≈ 96 dB, 24-bit ≈ 144 dB.', '/learn/bits/'],
    ['Audible range', '20 Hz – 20 kHz, nominally', 'Sampling at 48 kHz gives 24 kHz of it.', '/learn/sound/'],
  ]],
  ['Data', [
    ['Bits to bytes', 'Divide by 8', 'Networks are bits, storage is bytes. 1 Gbit/s = 125 MB/s.', '/learn/bits/'],
    ['8 bits', '256 values', 'Which is why one DMX channel has 256 levels.', '/tools/#dmx'],
    ['16 bits', '65,536 values', 'Coarse × 256 + fine. Why a moving head needs a fine channel.', '/learn/bits/'],
    ['Uncompressed 1080p60', '≈ 3 Gbit/s', 'Will not fit on a 1 Gbit link. This is the whole argument for compression.', '/tools/#storage'],
    ['64 channels of 48 kHz/24-bit audio', '≈ 74 Mbit/s', 'Audio is small. Video is not. People reliably guess this backwards.', '/tools/#storage'],
  ]],
  ['Lighting data', [
    ['One DMX universe', '512 channels', 'Plus a start code, so 513 slots on the wire.', '/protocols/dmx512/'],
    ['DMX refresh, full universe', '≈ 44 Hz maximum', 'A full frame takes about 23 ms and cannot go faster.', '/tools/#dmxrate'],
    ['RS-485 unit loads', '32 maximum on one line', 'An electrical limit, not a DMX one. Over budget works on the bench.', '/tools/#dmxload'],
    ['DMX cable', '120 Ω, terminated', 'Not microphone cable. It works until the run is long and the rig is hot.', '/learn/dmx/'],
    ['sACN, 40 universes', '≈ 10 Mbit/s', 'Lighting control is tiny. It is the media on the same switch that is not.', '/protocols/sacn/'],
  ]],
  ['The network', [
    ['The nine mask octets', '0 128 192 224 240 248 252 254 255', 'A mask is a solid run of ones. 200 can never appear in one.', '/tools/#subnet'],
    ['Usable hosts in a /26', '62', '2^(32−26) − 2. The two are the network and broadcast addresses.', '/tools/#subnet'],
    ['Block size', '256 − the mask octet', 'The whole subnetting method in one line.', '/tools/#subnet'],
    ['169.254.x.x', 'DHCP failed', 'The single most useful number on this page. It is a failure report.', '/tools/#addrkind'],
    ['Ethernet frame, standard', '1500 byte MTU', 'A ping at 1472 bytes finds the MTU problems a small ping walks past.', '/learn/network/'],
  ]],
  ['Power', [
    ['Watts to amps, single phase', 'W ÷ V', '2300 W on a 230 V circuit is 10 A.', '/tools/#power'],
    ['Watts to amps, three phase', 'W ÷ (1.732 × V)', 'Per line conductor, not the total.', '/tools/#power'],
    ['Voltage drop limit', '3% lighting, 5% power', 'Conventions from installation practice, not one global rule.', '/tools/#vdrop'],
    ['PoE+ at the device', '25.5 W guaranteed', 'The port may source 30 W. The difference is the cable.', '/tools/#poe'],
    ['Everything a rack draws', 'ends up as heat in the room', 'Near enough all of it. The light and sound leaving are a rounding error.', '/tools/#heat'],
  ]],
  ['Time', [
    ['Frame at 60 fps', '16.67 ms', 'Every stage of the pipeline spends part of that same budget.', '/tools/#frame'],
    ['Frame at 24 fps', '41.67 ms', '', '/tools/#frame'],
    ['29.97 drop frame', 'Skips frame NUMBERS, not time', 'Two per minute except minutes divisible by 10.', '/tools/#tc'],
    ['Perceptible audio/video offset', '≈ 45 ms audio late, 125 ms early', 'Ears forgive early sound far less than late.', '/learn/timecode/'],
  ]],
]

/** The order to work in, which is the actual method being taught. */
const ORDER = [
  ['1', 'Physical', 'Link light. Both ends. Then the cable, by swapping it for a known-good one.',
    'Thirty seconds, and it rules out the largest fault family there is.'],
  ['2', 'Addressing', 'Address, mask, and whether the two devices agree about which network they are on.',
    'ipconfig / ifconfig on both, then arp -a. Most of the rest of the faults live here.'],
  ['3', 'Reachability', 'Ping. Then trace, if it crosses anything.',
    'Now you are testing the path rather than guessing at it.'],
  ['4', 'Protocol', 'Right universe, right port, right multicast group, subscriptions actually joined.',
    'Everything pings and nothing outputs: this is the layer.'],
  ['5', 'Software', 'Versions, licences, firewall, the application itself.',
    'Last. Reinstalling first is forty minutes you will not get back.'],
]

export function fieldPage({ esc, shell, SITE, GH }) {
  const style = `
.fieldhero{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px 20px;margin-bottom:26px}
.fieldhero p{margin:0;color:var(--dim);font-size:15px;line-height:1.65}
.fieldhero b{color:var(--ink)}
.fsec{margin:34px 0 0}
.fsec > h3{margin-bottom:4px}
.fsec > .sub{margin:0 0 14px;color:var(--dimmer);font-size:14px}
.cmd{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin-bottom:14px}
.cmd > h4{margin:0 0 10px;font-size:16px;color:var(--ink);font-weight:600}
.cmdgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;margin-bottom:10px}
.cmdgrid div{background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:8px 11px;overflow-x:auto}
.cmdgrid span{display:block;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;
letter-spacing:.6px;color:var(--dimmer);margin-bottom:3px}
.cmdgrid code{font-family:var(--mono);font-size:13.5px;color:var(--accent);white-space:nowrap}
.cmd .look{margin:0;font-size:14px;color:var(--dim);line-height:1.6}
.cmd .look b{color:var(--ink)}
.reads{width:100%;border-collapse:collapse;margin:12px 0 0;font-size:14px}
.reads td{padding:8px 10px;border-top:1px solid var(--line);vertical-align:top;color:var(--dim);line-height:1.55}
.reads td:first-child{color:var(--ink);font-weight:500;white-space:nowrap}
.reads td:last-child{color:var(--warn)}
.cmd .after{margin:10px 0 0;font-size:13.5px;color:var(--dimmer);line-height:1.6}
.ord{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-top:1px solid var(--line)}
.ord:first-child{border-top:0}
.ordn{flex:0 0 auto;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;
background:var(--panel2);border:1px solid var(--rule-strong);font-family:var(--mono);font-size:13px;color:var(--accent)}
.ordb{flex:1 1 auto;min-width:0}
.ordb h4{margin:4px 0 4px;font-size:15.5px;color:var(--ink)}
.ordb p{margin:0 0 4px;font-size:14.5px;color:var(--dim);line-height:1.6}
.ordb .why{margin:0;font-size:13.5px;color:var(--dimmer);line-height:1.6}
.nums{margin-bottom:24px}
.nums h4{margin:0 0 8px;font-family:var(--mono);font-size:11.5px;text-transform:uppercase;
letter-spacing:.7px;color:var(--dimmer)}
.numtab{width:100%;border-collapse:collapse;font-size:14.5px}
.numtab tr{border-top:1px solid var(--line)}
.numtab td{padding:9px 10px 9px 0;vertical-align:top;line-height:1.55}
.numtab td:first-child{color:var(--dim);width:38%}
.numtab td:nth-child(2){color:var(--ink);font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;padding-right:14px}
.numtab .gloss{display:block;color:var(--dimmer);font-size:13px;font-weight:400;margin-top:3px;white-space:normal}
.numtab a{color:var(--accent);font-size:12.5px;font-family:var(--mono);white-space:nowrap}
.diag{width:100%;border-collapse:collapse;font-size:14.5px;margin-top:8px}
.diag tr{border-top:1px solid var(--line)}
.diag td{padding:9px 10px 9px 0;vertical-align:top;line-height:1.55;color:var(--dim)}
.diag td:first-child{font-family:var(--mono);color:var(--accent);white-space:nowrap;padding-right:14px}
.diag b{color:var(--ink)}
@media (max-width:560px){
  .numtab td:first-child{width:auto}
  .cmdgrid{grid-template-columns:1fr}
}`

  const cmdBlock = (c) => {
    const r = READING[c.q]
    return `<div class="cmd">
      <h4>${esc(c.q)}</h4>
      <div class="cmdgrid">
        <div><span>Windows</span><code>${esc(c.win)}</code></div>
        <div><span>macOS</span><code>${esc(c.mac)}</code></div>
        <div><span>Linux</span><code>${esc(c.linux)}</code></div>
      </div>
      <p class="look">${esc(c.look)}</p>
      ${r ? `<table class="reads">${r.lines.map(([a, b, c2]) =>
        `<tr><td>${esc(a)}</td><td>${esc(b)}</td><td>${esc(c2)}</td></tr>`).join('')}</table>` : ''}
      ${r && r.note ? `<p class="after">${esc(r.note)}</p>` : ''}
    </div>`
  }

  // The first four are the ones worth knowing without looking; the rest are
  // worth knowing EXIST, which is a different and smaller claim.
  const core = NET_COMMANDS.slice(0, 4)
  const rest = NET_COMMANDS.slice(4)

  const body = `
<div class="crumb"><a href="/">showstack</a> / field</div>
<h2>The field card</h2>
<p class="lede">Everything here is something you type or read while standing in a venue with somebody
waiting. It is one page, it works offline once this site is saved, and it is ordered the way you should
actually work rather than alphabetically.</p>

<div class="fieldhero"><p><b>One rule before any of it.</b> Run the command, then read what it actually
says, then decide. Almost none of the time wasted in a machine room goes on running the wrong command.
It goes on running the right one and not reading the output.</p></div>

<div class="fsec">
<h3>Work in this order</h3>
<p class="sub">Bottom-up. Each step is cheaper than the one after it and rules out more.</p>
${ORDER.map(([n, h, what, why]) => `<div class="ord">
  <div class="ordn">${esc(n)}</div>
  <div class="ordb"><h4>${esc(h)}</h4><p>${esc(what)}</p><p class="why">${esc(why)}</p></div>
</div>`).join('')}
</div>

<div class="fsec">
<h3>The four commands to know by heart</h3>
<p class="sub">With what the output means, which is the half that gets skipped.</p>
${core.map(cmdBlock).join('')}
</div>

<div class="fsec">
<h3>The rest, worth knowing exist</h3>
<p class="sub">Look these up. Knowing there is a command for it is the useful part.</p>
${rest.map((c) => `<div class="cmd">
  <h4>${esc(c.q)}</h4>
  <div class="cmdgrid">
    <div><span>Windows</span><code>${esc(c.win)}</code></div>
    <div><span>macOS</span><code>${esc(c.mac)}</code></div>
    <div><span>Linux</span><code>${esc(c.linux)}</code></div>
  </div>
  <p class="look">${esc(c.look)}</p>
</div>`).join('')}
</div>

<div class="fsec">
<h3>Addresses that are a diagnosis</h3>
<p class="sub">Some addresses are not configuration. They are the machine telling you what went wrong.</p>
<table class="diag">${IP_RANGES.map((r) =>
    `<tr><td>${esc(r.cidr)}</td><td><b>${esc(r.label)}</b> — ${esc(r.meaning)}</td></tr>`).join('')}</table>
<p class="after" style="margin-top:12px;font-size:13.5px;color:var(--dimmer)"><b>169.254.x.x is the one to
recognise instantly.</b> It is not an odd but working configuration. It is a device reporting that it asked
for an address and got silence: no DHCP server, no link, or the wrong VLAN. The fix is always upstream.
<a href="/tools/#addrkind">Check an address →</a></p>
</div>

<div class="fsec">
<h3>Numbers worth carrying in your head</h3>
<p class="sub">The test is not whether a number is useful. It is whether having to look it up would cost
you the moment. Everything else is a calculator, and is linked to one.</p>
${NUMBERS.map(([group, rows]) => `<div class="nums"><h4>${esc(group)}</h4>
<table class="numtab">${rows.map(([what, value, gloss, href]) =>
    `<tr><td>${esc(what)}${gloss ? `<span class="gloss">${esc(gloss)}</span>` : ''}</td>
     <td>${esc(value)}</td><td><a href="${esc(href)}">check →</a></td></tr>`).join('')}</table></div>`).join('')}
</div>

<div class="cta"><strong>A number you have had to look up mid-show?</strong>
<p>That is the test this page is built on, and the only way to find them is for somebody to have been
caught out. <a href="${GH}/issues/new?labels=content&amp;title=field%3A+">Name it</a> and it goes on the card.</p></div>`

  return shell({
    title: 'The field card — commands and numbers | showstack',
    description: 'The commands, outputs and numbers worth knowing without looking them up: what ipconfig, ping, traceroute and arp are actually telling you, the addresses that are a diagnosis, and the order to work in.',
    canonical: `${SITE}/field/`,
    extraStyle: style,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'The field card',
      about: 'Network diagnosis and reference numbers for live entertainment technology',
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
  })
}
