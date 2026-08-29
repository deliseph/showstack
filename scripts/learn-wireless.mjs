/**
 * /learn/wireless/ — how several things share one piece of spectrum.
 *
 * "Multiple access" is one of those topics that is taught as four acronyms
 * and remembered as none of them. The trick is that all four answer the same
 * question - how do we divide a shared medium - and they only differ in what
 * they divide it *by*. Drawn on one time-versus-frequency grid, switching
 * between them takes about two seconds to understand and never leaves.
 *
 * WMAS is here because it is the first genuinely new thing to happen to radio
 * mics in a long time, and because "one wide carrier carrying many channels"
 * is exactly the idea the grid above already taught.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav } from './learn-kit.mjs'

export function learnWirelessPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* conventional carriers each hold their own slot; WMAS shares one wide one in time */
@keyframes narrow-on{0%,100%{opacity:0}18%,74%{opacity:.9}}
@keyframes slot-on{0%,100%{opacity:.2}12%,26%{opacity:1}}
.wmasfig .nb{animation:narrow-on 3s ease-in-out infinite}
${[0,1,2,3,4,5].map((i) => `.wmasfig .n${i}{animation-delay:${(i*0.12).toFixed(2)}s}`).join('')}
.wmasfig .sl{animation:slot-on 1.5s steps(1,end) infinite}
${[0,1,2,3,4,5].map((i) => `.wmasfig .s${i}{animation-delay:${(i*0.25).toFixed(2)}s}`).join('')}
@keyframes dx-a{0%,46%{opacity:1}50%,100%{opacity:.12}}
@keyframes dx-b{0%,46%{opacity:.12}50%,100%{opacity:1}}
.dx .a{animation:dx-a 2.6s ease-in-out infinite}
.dx .b{animation:dx-b 2.6s ease-in-out infinite}
.dx.simplex .b{display:none}
.dx.full .a,.dx.full .b{animation:none;opacity:1}
/* the time / frequency grid */
.magrid-wrap{position:relative;margin-top:6px}
.grid-ma{display:grid;grid-template-columns:repeat(12,1fr);gap:3px}
/* A playhead sweeping the time axis. Without it the grid is a still picture of
   a scheme whose whole point is what happens over time - TDMA in particular is
   unreadable as a static image. */
@keyframes sweep-t{0%{left:0}100%{left:100%}}
.playhead{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--ink);opacity:.5;
border-radius:2px;animation:sweep-t 4.8s linear infinite;pointer-events:none}
.grid-ma i{aspect-ratio:1;border-radius:3px;background:var(--panel);border:1px solid var(--line);
transition:background .35s ease,border-color .35s ease}
.grid-ma i.u0{background:color-mix(in srgb,var(--accent) 62%,transparent);border-color:transparent}
.grid-ma i.u1{background:color-mix(in srgb,var(--accent2) 62%,transparent);border-color:transparent}
.grid-ma i.u2{background:color-mix(in srgb,var(--dom-control) 58%,transparent);border-color:transparent}
.grid-ma i.u3{background:color-mix(in srgb,var(--dom-audio) 55%,transparent);border-color:transparent}
.gridwrap{display:grid;grid-template-columns:22px 1fr;gap:8px;align-items:center}
.gridwrap .ylab{writing-mode:vertical-rl;transform:rotate(180deg);font-family:var(--mono);font-size:10.5px;
color:var(--dimmer);text-align:center}
.gridwrap .xlab{grid-column:2;font-family:var(--mono);font-size:10.5px;color:var(--dimmer);text-align:center;margin-top:5px}
.malegend{display:flex;gap:14px;flex-wrap:wrap;font-family:var(--mono);font-size:11.5px;color:var(--dimmer);margin-top:12px}
.malegend i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;vertical-align:-1px}
`

  const duplexFig = (mode) => {
    const cls = mode === 'simplex' ? 'simplex' : mode === 'full' ? 'full' : 'half'
    const label = mode === 'simplex' ? 'one direction, always'
      : mode === 'full' ? 'both directions, at once' : 'both directions, taking turns'
    return `
<svg viewBox="0 0 300 118" role="img">
  <g class="dx ${cls}">
    <rect x="10" y="38" width="54" height="42" rx="6" fill="var(--panel)" stroke="var(--line)"/>
    <text x="37" y="63" class="lbl" text-anchor="middle">TX</text>
    <rect x="236" y="38" width="54" height="42" rx="6" fill="var(--panel)" stroke="var(--line)"/>
    <text x="263" y="63" class="lbl" text-anchor="middle">RX</text>
    <g class="a">
      <line x1="70" y1="52" x2="228" y2="52" stroke="var(--accent)" stroke-width="3" class="l-dash"/>
      <path d="M228 52 l-9 -4 v8 z" fill="var(--accent)"/>
    </g>
    <g class="b">
      <line x1="228" y1="68" x2="70" y2="68" stroke="var(--accent2)" stroke-width="3" class="l-dash"/>
      <path d="M70 68 l9 -4 v8 z" fill="var(--accent2)"/>
    </g>
    <text x="150" y="105" class="lbl" text-anchor="middle">${label}</text>
  </g>
</svg>`
  }

  const wmasFig = `
<svg viewBox="0 0 620 140" role="img" class="wmasfig">
  <line x1="20" y1="104" x2="600" y2="104" stroke="var(--line)" stroke-width="1.5"/>
  <text x="20" y="126" class="lbl">one 6–8 MHz TV channel</text>
  <text x="600" y="126" class="lbl" text-anchor="end">frequency →</text>
  <text x="20" y="22" class="lbl">conventional: one narrow carrier per mic, guard space between</text>
  ${[0, 1, 2, 3, 4, 5].map((i) => {
    const x = 40 + i * 92
    return `<rect x="${x}" y="30" width="15" height="24" rx="2" fill="var(--accent2)"/>` +
           `<rect x="${x + 15}" y="46" width="77" height="8" rx="2" fill="var(--line)" opacity=".55"/>`
  }).join('')}
  <text x="20" y="76" class="lbl">WMAS: one wide carrier, the channels shared inside it</text>
  <rect x="40" y="82" width="546" height="16" rx="3" fill="var(--accent)" opacity=".8"/>
  ${[...Array(22)].map((_, i) => `<line class="sl s${i % 6}" x1="${48 + i * 25}" y1="82" x2="${48 + i * 25}" y2="98" stroke="var(--bg)" stroke-width="1.4" opacity=".55"/>`).join('')}
  ${[0, 1, 2, 3, 4, 5].map((i) => `<rect class="nb n${i}" x="${40 + i * 92}" y="30" width="15" height="24" rx="2" fill="var(--accent2)" opacity="0"/>`).join('')}
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / wireless</div>
${learnNav(esc, 'wireless')}
<div class="lhero">
  <h2>Sharing the airwaves</h2>
  <p class="lede">Spectrum is finite and everyone wants some. Every wireless system on a show is an answer to one question — how do several signals occupy the same band without destroying each other — and there are only a few answers.</p>
</div>

${S('First', 'Simplex, half duplex, full duplex', [
  'Three words for who can talk, and when. <b>Simplex</b> is one direction only: a radio mic transmitter sends, the receiver listens, and there is no path back. <b>Half duplex</b> is both directions but one at a time, which is what a walkie-talkie is doing when you press the button and why you say "over". <b>Full duplex</b> is both directions simultaneously, like a phone call — or an intercom beltpack where you can hear the stage manager while you are still talking.',
  'This is not academic on a show. A simplex radio mic cannot be told anything by its receiver, which is exactly why older systems make you walk to the performer to change a frequency. A link with a return path can push a frequency change, read battery state, and mute the pack from front of house.',
])}

<div class="figrow">
  ${fig(duplexFig('simplex'), 'Simplex — a classic radio mic. No path back to the pack.')}
  ${fig(duplexFig('half'), 'Half duplex — comms. One talks, then the other.')}
  ${fig(duplexFig('full'), 'Full duplex — an intercom, or a bidirectional mic link.')}
</div>

${rule('If a system can tell a beltpack anything — battery, frequency, mute — it is <b>not simplex</b>. That return path is the feature you are paying for.')}

${S('Then', 'FDMA, TDMA, CDMA, OFDMA', [
  'All four divide the same resource: a block of spectrum, over a period of time. Draw that as a grid — frequency up the side, time along the bottom — and the difference between them is just which way they slice it.',
  'Change the method below and watch the four users move.',
])}

<div class="tryit">
  <div class="f"><label>Access method</label>
    <span class="seg" role="group" id="ma-seg">
      <button type="button" data-m="fdma" aria-pressed="true">FDMA</button>
      <button type="button" data-m="tdma" aria-pressed="false">TDMA</button>
      <button type="button" data-m="cdma" aria-pressed="false">CDMA</button>
      <button type="button" data-m="ofdma" aria-pressed="false">OFDMA</button>
    </span>
  </div>
</div>

<div class="fig" aria-hidden="true">
  <div class="gridwrap">
    <div class="ylab">frequency →</div>
    <div><div class="magrid-wrap"><div class="grid-ma" id="ma-grid"></div><div class="playhead" aria-hidden="true"></div></div><div class="xlab">time →</div></div>
  </div>
  <div class="malegend">
    <span><i style="background:color-mix(in srgb,var(--accent) 62%,transparent)"></i>user 1</span>
    <span><i style="background:color-mix(in srgb,var(--accent2) 62%,transparent)"></i>user 2</span>
    <span><i style="background:color-mix(in srgb,var(--dom-control) 58%,transparent)"></i>user 3</span>
    <span><i style="background:color-mix(in srgb,var(--dom-audio) 55%,transparent)"></i>user 4</span>
  </div>
</div>
<div class="readout" id="ma-out" role="status" aria-live="polite"></div>

${bites([
  '<b>FDMA is what a conventional radio mic rig is.</b> Every channel owns a frequency for the whole show, which is why coordination is a frequency-planning exercise and why <a href="/tools/#im">intermodulation</a> matters — the products land in the gaps between the carriers.',
  '<b>TDMA needs everyone to agree on time.</b> Slots only work if every device shares a clock, which is why time-division systems are strict about synchronisation.',
  '<b>CDMA does not sound like anything to a receiver without the code.</b> Several users transmit over the whole band at once and are separated mathematically rather than by tuning.',
  '<b>OFDMA is what modern wireless mostly is.</b> Wi-Fi 6 and 5G both allocate blocks of time <em>and</em> frequency per user, which is why they degrade so much more gracefully in a crowded room than older systems.',
])}

${S('Which brings us to', 'WMAS', [
  'Wireless Multichannel Audio Systems is the current change to how radio mics use spectrum. A conventional system gives every channel its own narrow carrier, with guard space either side that carries nothing — spectrum spent on separation rather than on audio.',
  'WMAS instead puts up one <b>wide</b> carrier — up to 20 MHz under the ETSI standard — and shares it between many audio channels, using the time and frequency division ideas above rather than one-carrier-per-mic. ETSI expresses the capability as three or more audio channels per MHz.',
  'It is standardised in <b>ETSI EN 300 422-1</b>, which defines the WMAS transmit mask and caps the bandwidth. The FCC aligned US rules with it in February 2024, following a rulemaking petition Sennheiser filed in 2018.',
  'The practical consequences are bigger than the channel count. A wide shared carrier is naturally bidirectional, so the link can carry telemetry and control back to the pack; and because channels are allocated inside one block rather than hunted between broadcasters, coordination becomes an allocation problem rather than a search.',
])}

${fig(wmasFig, 'Same piece of spectrum. Above: narrow carriers with guard space between them. Below: one wide carrier with the channels shared inside it.')}

${rule('WMAS trades <b>many narrow carriers for one wide one</b>, and gets back the spectrum that used to be spent on the gaps — plus a return path to the transmitter.')}

${bites([
  '<b>It is not a firmware update.</b> WMAS is a different air interface; it needs hardware built for it at both ends.',
  '<b>The regulator still decides.</b> Legal bandwidth and power are national. Check <a href="/rf/">the frequency map</a> for the country before assuming a wide carrier is permitted there.',
  '<b>Wide does not mean immune.</b> A 20 MHz carrier sitting on top of a broadcaster is still sitting on top of a broadcaster.',
])}

<div class="cta"><strong>Then plan it properly.</strong>
<p>Frequency legality by country is on the <a href="/rf/">RF map</a>, and the <a href="/tools/#im">third-order intermod checker</a> shows which products from your own channel list land back on channels you are using.</p></div>
`

  const script = `
const $ = (s) => document.querySelector(s);
const COLS = 12, ROWS = 8;

// Each method is just a rule for which user owns cell (row, col).
const METHOD = {
  fdma: (r) => Math.floor(r / 2) % 4,
  tdma: (r, c) => Math.floor(c / 3) % 4,
  cdma: (r, c) => (r * 5 + c * 3) % 4,           // everyone, everywhere, separated by code
  ofdma: (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 4,
};
const BLURB = {
  fdma: '<b>Frequency Division.</b> Each user gets their own slice of frequency and keeps it for the whole time. Simple, and it wastes the guard space between slices. This is a conventional radio mic rig.',
  tdma: '<b>Time Division.</b> Each user gets the whole band, but only during their slot. Needs everyone locked to a common clock — but no guard frequencies.',
  cdma: '<b>Code Division.</b> Everyone transmits across the whole band at the same time, and receivers pull out their own signal by its unique code. Robust, and it looks like noise without the code.',
  ofdma: '<b>Orthogonal Frequency Division.</b> The band is split into many narrow sub-carriers and users are assigned blocks of time <em>and</em> frequency. What Wi-Fi 6, 5G and WMAS use.',
};

let mode = "fdma";
function maRender(){
  let html = "";
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      html += '<i class="u' + METHOD[mode](r, c) + '"></i>';
  $("#ma-grid").innerHTML = html;
  $("#ma-out").innerHTML = BLURB[mode];
  for (const b of document.querySelectorAll("#ma-seg button"))
    b.setAttribute("aria-pressed", String(b.dataset.m === mode));
}
$("#ma-seg").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-m]");
  if (!b) return;
  mode = b.dataset.m;
  maRender();
});
maRender();
`

  return shell({
    title: 'Sharing the airwaves — duplex, FDMA, TDMA, CDMA, OFDMA and WMAS | showstack',
    description: 'Simplex, half duplex and full duplex explained for show comms and radio mics; how FDMA, TDMA, CDMA and OFDMA divide the same spectrum differently, on one interactive time-frequency grid; and what WMAS changes about packing wireless microphones into a band.',
    canonical: `${SITE}/learn/wireless/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Sharing the airwaves: duplex modes, multiple access and WMAS',
      description: 'How simplex, half and full duplex differ; FDMA, TDMA, CDMA and OFDMA on one grid; and what WMAS changes for wireless microphones.',
      url: `${SITE}/learn/wireless/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
