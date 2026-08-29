/**
 * /learn/dmx/ — why a DMX line behaves the way it does.
 *
 * Three questions get asked on every load-in and are answered wrong more
 * often than not: how many fixtures fit on a line, whether one fixture is one
 * unit load, and what the terminator is actually for. The last one is the
 * dangerous one, because an unterminated line does not fail - it fails
 * *sometimes*, which is how a rig gets signed off and then flickers in front
 * of an audience.
 *
 * The reflection figure is the reason this page exists. A reflection is a
 * thing that happens in time, so a static drawing of it has never once made
 * the point. Drawn moving - pulse out, pulse back, collision - it lands in
 * about four seconds.
 */
import { dmxLineBudget } from './toolmath.mjs'
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

const MATH_SRC = [dmxLineBudget].map((f) => f.toString()).join('\n\n')

export function learnDmxPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* the daisy chain, carrying data to a terminator that swallows it */
@keyframes chain-run{0%{transform:translateX(0);opacity:0}6%{opacity:1}
82%{transform:translateX(206px);opacity:1}94%,100%{opacity:0;transform:translateX(216px)}}
.chainfig .pk{animation:chain-run 2.4s linear infinite}
.chainfig .pk.p2{animation-delay:.8s}
.chainfig .pk.p3{animation-delay:1.6s}
/* The line, the pulse, and the pulse coming back. */
@keyframes dmx-out{
  0%{transform:translateX(0);opacity:0}
  4%{opacity:1}
  46%{opacity:1}
  50%{transform:translateX(var(--run));opacity:1}
  100%{transform:translateX(var(--run));opacity:0}
}
@keyframes dmx-absorb{
  0%{transform:translateX(0);opacity:0}
  4%{opacity:1}
  44%{transform:translateX(calc(var(--run) * .88));opacity:1}
  50%{transform:translateX(var(--run));opacity:0}
  100%{transform:translateX(var(--run));opacity:0}
}
@keyframes dmx-back{
  0%,50%{transform:translateX(var(--run));opacity:0}
  54%{opacity:.95}
  96%{transform:translateX(0);opacity:.95}
  100%{transform:translateX(0);opacity:0}
}
@keyframes dmx-clash{0%,62%{opacity:0;r:4}70%{opacity:1;r:11}82%{opacity:0;r:4}100%{opacity:0;r:4}}
.dmxwire .pulse-out{animation:dmx-out 2.6s linear infinite}
.dmxwire.terminated .pulse-out{animation-name:dmx-absorb}
.dmxwire .pulse-back{animation:dmx-back 2.6s linear infinite}
.dmxwire.terminated .pulse-back{display:none}
.dmxwire .clash{animation:dmx-clash 2.6s linear infinite}
.dmxwire.terminated .clash{display:none}
.dmxwire .termres{opacity:.22;transition:opacity .25s}
.dmxwire.terminated .termres{opacity:1}
/* the unit-load bar */
.ulbar{position:relative;height:38px;border:1px solid var(--line);border-radius:9px;background:var(--panel);
overflow:hidden;margin-top:14px}
.ulbar .used{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,var(--ok),var(--accent));
transition:width .3s ease,background .3s}
.ulbar.over .used{background:linear-gradient(90deg,var(--accent2),var(--warn))}
.ulbar .cap32{position:absolute;top:0;bottom:0;width:2px;background:var(--ink);opacity:.55}
.ulbar .cap32 span{position:absolute;top:3px;left:5px;font-family:var(--mono);font-size:10px;color:var(--ink);white-space:nowrap}
.ulbar .inner{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
font-family:var(--mono);font-size:13px;color:var(--ink);text-shadow:0 1px 3px rgba(0,0,0,.35)}
`

  // ---- figure: reflection on an unterminated line -------------------------
  const W = 620, H = 168, x0 = 74, x1 = 546, wireY = 84
  const wireFig = `
<svg viewBox="0 0 ${W} ${H}" role="img">
  <g class="dmxwire" id="dmx-wire" style="--run:${x1 - x0}px">
    <rect x="14" y="${wireY - 26}" width="58" height="52" rx="6" fill="var(--panel)" stroke="var(--line)"/>
    <text x="43" y="${wireY + 4}" class="lbl" text-anchor="middle">CONSOLE</text>
    <line x1="${x0}" y1="${wireY}" x2="${x1}" y2="${wireY}" stroke="var(--line)" stroke-width="6" stroke-linecap="round"/>
    ${[0, 1, 2, 3].map((i) => {
      const fx = x0 + 62 + i * 112
      return `<rect x="${fx - 15}" y="${wireY - 17}" width="30" height="34" rx="4" fill="var(--panel)" stroke="var(--line)"/>` +
             `<line x1="${fx}" y1="${wireY - 17}" x2="${fx}" y2="${wireY + 17}" stroke="var(--dimmer)" stroke-width="1"/>`
    }).join('')}
    <g class="termres">
      <rect x="${x1 - 4}" y="${wireY - 15}" width="26" height="30" rx="4" fill="none" stroke="var(--accent)" stroke-width="2"/>
      <text x="${x1 + 9}" y="${wireY + 4}" class="lbl" fill="var(--accent)" text-anchor="middle" font-size="9">120Ω</text>
    </g>
    <g class="pulse-out">
      <rect x="${x0 - 9}" y="${wireY - 9}" width="18" height="18" rx="3" fill="var(--accent)"/>
    </g>
    <g class="pulse-back">
      <rect x="${x0 - 9}" y="${wireY - 9}" width="18" height="18" rx="3" fill="var(--warn)"/>
    </g>
    <circle class="clash" cx="${(x0 + x1) / 2}" cy="${wireY}" r="4" fill="none" stroke="var(--warn)" stroke-width="2.5"/>
    <text x="${x0}" y="${wireY + 44}" class="lbl">data out →</text>
    <text x="${x1}" y="${wireY + 44}" class="lbl" text-anchor="end" id="dmx-endlbl">← reflected back</text>
  </g>
</svg>`

  // ---- figure: daisy chain vs star ---------------------------------------
  const topoFig = `
<svg viewBox="-70 0 440 150" role="img" class="chainfig">
  <rect x="8" y="60" width="46" height="30" rx="4" fill="var(--panel)" stroke="var(--line)"/>
  <text x="31" y="79" class="lbl" text-anchor="middle">DESK</text>
  <line x1="54" y1="75" x2="272" y2="75" stroke="var(--ok)" stroke-width="4" stroke-linecap="round"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="${86 + i * 48}" y="62" width="26" height="26" rx="3" fill="var(--panel)" stroke="var(--line)"/>`).join('')}
  <rect x="272" y="64" width="18" height="22" rx="3" fill="none" stroke="var(--accent)" stroke-width="2"/>
  ${[0, 1, 2].map((i) => `<g class="pk p${i + 1}"><rect x="58" y="69" width="16" height="12" rx="2" fill="var(--ok)"/></g>`).join('')}
  <text x="150" y="126" class="lbl" text-anchor="middle" fill="var(--ok)">one line in, one line out, terminated once at the end</text>
</svg>`

  const starFig = `
<svg viewBox="-70 0 440 150" role="img">
  <rect x="8" y="60" width="46" height="30" rx="4" fill="var(--panel)" stroke="var(--line)"/>
  <text x="31" y="79" class="lbl" text-anchor="middle">DESK</text>
  <circle cx="86" cy="75" r="7" fill="var(--warn)"/>
  <line x1="54" y1="75" x2="86" y2="75" stroke="var(--line)" stroke-width="4"/>
  ${[[-34, 26], [0, 34], [34, 26]].map(([dy, len]) =>
    `<line x1="86" y1="75" x2="${86 + 150}" y2="${75 + dy}" stroke="var(--warn)" stroke-width="3" stroke-linecap="round" class="l-fade"/>` +
    `<rect x="${86 + 150}" y="${75 + dy - 12}" width="26" height="24" rx="3" fill="var(--panel)" stroke="var(--line)"/>`).join('')}
  <text x="150" y="132" class="lbl" text-anchor="middle" fill="var(--warn)">a passive Y-split: three stubs, three reflections, one broken line</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / dmx</div>
${learnNav(esc, 'dmx')}
<div class="lhero">
  <h2>DMX on the wire</h2>
  <p class="lede">DMX512 is a 250 kbit/s serial signal on an <a href="/protocols/rs-485/">RS-485</a> bus, and almost everything that goes wrong with it is electrical rather than logical. Three questions, answered properly.</p>
</div>

${S('Question one', 'Is one fixture one unit load?', [
  'No, and this is the single most useful thing on this page. The limit in the standard is <b>32 unit loads per segment</b>, not 32 fixtures. A unit load is defined by the current a standard RS-485 receiver draws — roughly a 12 kΩ input impedance — and it is a property of the receiver chip inside the fixture, not of the fixture itself.',
  'Modern receiver chips are commonly built at a fraction of a unit load. A fixture with a 1/8 UL receiver presents an eighth of the electrical burden of an old 1 UL one, which is why a line can legitimately carry well over a hundred modern fixtures, and why a rig of twenty-year-old dimmer packs still stops at thirty-two.',
  'The figure is in the fixture manual, usually near the DMX connector pinout. If it is not stated, assume 1 UL and be pleasantly surprised.',
])}

<div class="tryit">
  <div class="f"><label for="ul-a">Fixtures at 1 UL</label><input id="ul-a" type="number" min="0" value="8" inputmode="numeric" style="width:110px"></div>
  <div class="f"><label for="ul-b">at 1/2 UL</label><input id="ul-b" type="number" min="0" value="0" inputmode="numeric" style="width:110px"></div>
  <div class="f"><label for="ul-c">at 1/4 UL</label><input id="ul-c" type="number" min="0" value="40" inputmode="numeric" style="width:110px"></div>
  <div class="f"><label for="ul-d">at 1/8 UL</label><input id="ul-d" type="number" min="0" value="0" inputmode="numeric" style="width:110px"></div>
</div>
<div class="ulbar" id="ul-bar"><div class="used" id="ul-used"></div><div class="cap32" id="ul-cap"><span>32 UL</span></div><div class="inner" id="ul-inner"></div></div>
<div class="readout" id="ul-out" role="status" aria-live="polite"></div>

${rule('The line is rated in <b>unit loads</b>, not in boxes. Count the electrical load, not the fixtures — then check the manual, because the two numbers are rarely the same.')}

${S('Question two', 'Why does a DMX line need a terminator?', [
  'A twisted pair has a characteristic impedance — around 120 Ω for DMX cable. When the signal reaches the end of the cable and finds nothing there, that energy has nowhere to go, so it turns around and travels back up the line. That returning energy is a <b>reflection</b>, and it lands on top of the data still arriving.',
  'A 120 Ω resistor across the pair at the far end matches the impedance of the cable. The signal arrives, the resistor absorbs it, and nothing comes back. That is the whole job.',
])}

${fig(wireFig, 'Click the switch to terminate the line. Unterminated, the pulse reaches the end and returns as a reflection — where it meets outgoing data, the receiver sees neither cleanly.')}

<div class="tryit">
  <div class="f"><label>Far end of the line</label>
    <span class="seg" role="group">
      <button type="button" id="dmx-unterm" aria-pressed="true">Open (no terminator)</button>
      <button type="button" id="dmx-term" aria-pressed="false">120 Ω terminated</button>
    </span>
  </div>
</div>
<div class="readout" id="dmx-wire-out" role="status" aria-live="polite"></div>

${rule('A terminator is not a formality and it is not optional on a long run. It is a <b>120 Ω resistor that gives the signal somewhere to stop</b>.')}

${S('Question three', 'Then why does an unterminated rig often work?', [
  'Because a reflection takes time to come back, and on a short cable it returns while the same bit is still being transmitted — so it lands harmlessly on top of itself. DMX runs at 250 kbit/s, which is 4 µs per bit, and signal travels down copper at roughly two thirds the speed of light. The round trip only starts to eat into the next bit once the cable is long enough for the delay to matter.',
  'That is exactly what makes it dangerous. A missing terminator does not produce a fault you can find at focus. It produces a rig that is fine at ten metres and flickers at eighty, fine cold and marginal warm, fine until someone adds one more fixture and the line gets a little longer.',
])}

${bites([
  '<b>Intermittent flicker on the far end of a run.</b> Almost always the terminator, before you start swapping fixtures.',
  '<b>A rig that works in the shop and not in the venue.</b> Same fixtures, longer cable, longer reflection delay.',
  '<b>Adding one fixture breaks the whole line.</b> Not the fixture — the extra cable length it brought with it.',
  '<b>A DMX cable that is really a mic cable.</b> Microphone cable is not 120 Ω, so the terminator no longer matches anything. See <a href="/standards/ansi-e1-27-1/">ANSI E1.27-1</a>, which is free to read.',
])}

${S('Topology', 'Daisy chain, never a Y-split', [
  'DMX is a bus. One line leaves the desk, passes through each device, and ends in a terminator. Splitting it passively into three branches creates three unterminated stubs, each of which reflects, and none of which can be terminated correctly because they all share one driver.',
  'When a rig needs to branch, it needs an <b>opto-splitter</b>: an active device that receives the line properly, terminates it, and re-transmits a fresh signal on each output. Each output is then its own segment with its own 32 unit load budget and its own terminator.',
])}

<div class="figrow">
  ${fig(topoFig, 'Daisy chain — one segment, one terminator.')}
  ${fig(starFig, 'Passive Y-split — three stubs, three reflections.')}
</div>

${xnote('An intermittent fixture is not read by an audience as a technical fault. It is read as <b>the show being slightly wrong</b> — attention goes to the flicker instead of the thing you pointed at, and it costs you the moment whether or not anybody could name what happened. Termination is an attention problem wearing an impedance problem\u2019s clothes.')}

${rule('Branch with an <b>opto-splitter</b>, not a Y-cable. Each splitter output is a new segment: new unit-load budget, new terminator.')}

${S('Question four', 'How does a one-way wire carry an answer back?',
  ['DMX512 has no return path. One transmitter drives the pair, every receiver listens, and nothing a fixture might want to say has anywhere to go. Which makes RDM &mdash; ANSI E1.20 &mdash; look impossible until you see the trick, which is that it does not add a return path. It <strong>takes turns</strong>.',
   'The controller sends a packet and then stops driving the line, and while it is quiet a responder drives the same pair back the other way. Half duplex on one differential pair, arbitrated entirely by timing. That is the whole idea, and everything awkward about RDM in the field follows from it: the wire is now bidirectional in a rig full of equipment that was built on the assumption that it never would be.',
   'RDM packets are told apart from level data by their <strong>start code</strong>. Ordinary DMX carries start code 0x00; RDM uses 0xCC. A fixture that checks start codes ignores anything that is not 0x00 and never notices RDM exists. A fixture that does not check will treat 0xCC packets as if they were levels, which is why switching RDM on for the first time in an old rig can produce flicker or jumps that look exactly like a data fault and are not.'])}

${rule('RDM does not add a wire. It <b>borrows the one that is there</b>, by having the controller shut up long enough for a fixture to answer.')}

${S('Question five', 'Why does discovery find nothing through a perfectly good splitter?',
  ['Because a splitter is a one-way amplifier unless somebody designed it not to be. It takes the incoming pair, buffers it, and drives several outgoing pairs. DMX passes through beautifully. A response coming back the other way meets the output of a buffer and stops there, silently.',
   'So the rig looks completely healthy &mdash; every fixture responding to levels, no errors anywhere &mdash; and discovery finds nothing at all, which is a confusing failure to sit in front of. An RDM-aware splitter has to detect the quiet window and turn its buffers around inside it, and then turn them back before the controller starts transmitting again. That is real work, done to a tight timing budget, and it is why RDM-aware splitters cost more and why one non-aware unit anywhere in a chain removes RDM from everything downstream of it.',
   'The same applies to anything else in the path: opto-isolators, buffers, DMX-over-Ethernet gateways, and cheap USB dongles that turn their transceiver around too slowly. Every one of them has to be in on it. And because a long line, a missing terminator or a marginal cable all eat into the same timing budget, RDM tends to fail intermittently on exactly the lines that were already marginal for DMX &mdash; which makes it a rather good, if annoying, test of a rig you thought was fine.'])}

${S('Question six', 'How does a controller find devices it has never met?',
  ['Every RDM device has a 48-bit UID: a 16-bit manufacturer ID from the ESTA registry, and a 32-bit device ID. That is 281 trillion possible addresses and a controller cannot ask them one at a time.',
   'So it plays a binary search, out loud, with collisions as the signal. It broadcasts <span class="mono">DISC_UNIQUE_BRANCH</span> over a range of UIDs, meaning roughly &ldquo;anybody in this range, speak now&rdquo;. If nothing is in the range, silence. If exactly one device is, it answers cleanly and gets found. If several are, they all answer at once, the responses collide into garbage &mdash; and that garbage is itself the answer, because it says the range contains more than one device. The controller splits the range in half and asks both halves. Each device it finds is told to be quiet, and the search continues until nothing answers anywhere.',
   'Two consequences. It takes a while, and on a big or marginal line it takes minutes, which is why a console can sit there apparently doing nothing after you press discover. And it can miss devices, because a collision that happens to look like a valid response, or a response that arrives fractionally late, sends the search down the wrong branch. Running discovery twice and comparing the count is not superstition.'])}

${bites([
  '<b>One non-RDM splitter kills everything behind it.</b> DMX passes, responses do not, and nothing about the symptom points at the splitter.',
  '<b>Two controllers on one universe.</b> Both own the line, both transmit into each other&rsquo;s quiet windows, and responses get attributed to the wrong device. The resulting patch data is confidently wrong, which is worse than empty.',
  '<b>Polling with the show up.</b> RDM shares the wire with levels, so continuous sensor polling measurably drops the refresh rate. Turn it down before doors &mdash; <a href="/tools/#dmxrate">the calculator</a> puts a number on it.',
  '<b>Trusting the UID to name a manufacturer.</b> IDs from 8000h up are reserved for E1.33 dynamic UIDs and belong to nobody. <a href="/tools/#uid">The decoder</a> flags them.',
  '<b>Old fixtures that do not check start codes.</b> They act on 0xCC as if it were level data. If enabling RDM introduces flicker, that is what happened, and the fix is upstream of the fixture.',
])}

${S('One box, many devices', 'Sub-devices and proxies, and why a rack answers for things that cannot speak',
  ['Two parts of RDM exist because the world is not made of identical fixtures on one wire, and both turn up the first time you point a controller at real installed kit.',
   'A <strong>sub-device</strong> is a logical device inside a physical one. A twelve-way dimmer rack is a single box with a single UID, but it is twelve dimmers, and each of them has its own address, its own curve, its own lamp hours. RDM handles that by letting a message be directed at a sub-device number instead of at the root: root device zero is the box itself and carries the things that belong to the box &mdash; the fan, the mains, the firmware &mdash; while sub-devices 1 to 12 each carry the things that belong to one channel. Ask the root for a DMX start address and you get the rack&rsquo;s; ask sub-device 7 and you get that dimmer&rsquo;s. Multi-cell LED battens work the same way, which is why one fixture can report twelve independent addresses without twelve UIDs.',
   'A <strong>proxy</strong> is a device that answers on behalf of others. It has its own UID, it declares itself a proxy, and it holds a list of the UIDs behind it &mdash; typically a gateway onto a segment that does not speak RDM, or a system with its own internal bus. A controller discovering the line finds the proxy, asks it what it is fronting for, and gets a list rather than having to run the binary search through it. The devices behind it appear in the patch as real devices, because as far as the controller is concerned they are.',
   'The consequence worth carrying: a UID appearing on your line does not mean that thing is physically on your line. It may be behind a proxy on another bus entirely, which is excellent for getting a whole installed system into one patch and confusing the first time you go looking for a fixture with a torch.'])}

${bites([
  '<b>Sub-device zero is the box, not the first channel.</b> Setting a start address on the root of a multi-cell fixture and expecting cell one to move is a normal half hour lost.',
  '<b>Not every device implements sub-devices even when it obviously has them.</b> Some racks present twelve separate UIDs instead. Both are legal and they patch quite differently.',
  '<b>A proxy has to keep its list current.</b> Something added behind it after discovery may not appear until the proxy is asked again, which is not the same as rediscovering your own line.',
])}

${S('And then', 'RDMnet is a different animal',
  ['E1.33, RDMnet, carries the same RDM message set over IP instead of over the DMX pair. That removes the turnaround timing problem entirely &mdash; a network is already bidirectional &mdash; and replaces it with a broker, a discovery mechanism built on DNS-SD, and all the ordinary questions of a show network.',
   'It is genuinely a different thing rather than a faster version of the same thing, and the two coexist: RDMnet to a gateway, plain RDM from the gateway down the DMX line to the fixtures. Which means the splitter problem is still yours, it has just moved further from the console.'])}

<div class="cta"><strong>Want the numbers rather than the explanation?</strong>
<p>The <a href="/tools/#dmxload">unit-load budget calculator</a>, the <a href="/tools/#dmx">DMX address tool</a>, the <a href="/tools/#dmxrate">refresh-rate and RDM cost calculator</a> and the <a href="/tools/#uid">RDM UID decoder</a> are on the field tools page, and work offline once loaded. Protocol detail lives on <a href="/protocols/dmx512/">DMX512</a>, <a href="/protocols/rdm/">RDM</a> and <a href="/protocols/rdmnet/">RDMnet</a>.</p></div>
`

  const script = `
${MATH_SRC}
const $ = (s) => document.querySelector(s);

function ulRender(){
  const groups = [
    {count: Number($("#ul-a").value) || 0, unitLoad: 1},
    {count: Number($("#ul-b").value) || 0, unitLoad: 0.5},
    {count: Number($("#ul-c").value) || 0, unitLoad: 0.25},
    {count: Number($("#ul-d").value) || 0, unitLoad: 0.125},
  ];
  const r = dmxLineBudget(groups);
  if (!r) { $("#ul-out").innerHTML = '<span class="err">Fixture counts must be zero or more.</span>'; return; }
  // Scale the bar so the 32 UL cap sits at 75% when we are under it, and the
  // whole load fits when we are over - so going over is visible, not clipped.
  const scale = Math.max(r.limit / 0.75, r.unitLoads * 1.08);
  $("#ul-used").style.width = Math.min(100, (r.unitLoads / scale) * 100) + "%";
  $("#ul-cap").style.left = ((r.limit / scale) * 100) + "%";
  $("#ul-bar").classList.toggle("over", !r.withinLimit);
  $("#ul-inner").textContent = r.fixtures + " fixtures · " + r.unitLoads + " unit loads";
  $("#ul-out").innerHTML = r.withinLimit
    ? '<span class="ok">Fits on one segment.</span> <b>' + r.unitLoads + '</b> of 32 unit loads used, <b>' + r.headroomUnitLoads + '</b> spare — that is ' + r.fixtures + ' physical fixtures on one line.'
    : '<span class="err">Over the limit.</span> <b>' + r.unitLoads + '</b> unit loads needs <b>' + r.segmentsNeeded + '</b> segments — an opto-splitter with at least ' + r.segmentsNeeded + ' outputs.';
}
for (const id of ["#ul-a","#ul-b","#ul-c","#ul-d"]) $(id).addEventListener("input", ulRender);

function setTerm(on){
  $("#dmx-wire").classList.toggle("terminated", on);
  $("#dmx-term").setAttribute("aria-pressed", String(on));
  $("#dmx-unterm").setAttribute("aria-pressed", String(!on));
  $("#dmx-endlbl").textContent = on ? "absorbed" : "← reflected back";
  $("#dmx-wire-out").innerHTML = on
    ? '<span class="ok">Terminated.</span> The 120 Ω resistor matches the cable impedance, so the signal is absorbed at the end and nothing returns.'
    : '<span class="err">Open circuit.</span> The signal reaches the end, finds no matching impedance, and reflects back along the line — colliding with the data still arriving.';
}
$("#dmx-term").addEventListener("click", () => setTerm(true));
$("#dmx-unterm").addEventListener("click", () => setTerm(false));

ulRender();
setTerm(false);
`

  return shell({
    title: 'DMX on the wire — unit loads, termination and reflections | showstack',
    description: 'Why a DMX line is limited to 32 unit loads and not 32 fixtures, what a 120 Ω terminator actually does, why an unterminated line fails intermittently, and why a Y-split breaks a bus. With an interactive unit-load budget calculator.',
    canonical: `${SITE}/learn/dmx/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'DMX on the wire: unit loads, termination and reflections',
      description: 'How RS-485 unit loads limit a DMX segment, what a terminator does, and why unterminated lines fail intermittently.',
      url: `${SITE}/learn/dmx/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
