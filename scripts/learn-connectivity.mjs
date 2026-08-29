/**
 * /learn/connectivity/ — choosing a radio, and what GNSS is really for.
 *
 * Every wireless technology on a show site is a different answer to the same
 * three-way trade: range, data rate, and battery. You cannot have all three,
 * and once that is drawn as a chart the whole landscape stops being a list of
 * brand names and becomes a map you can point at.
 *
 * GNSS is here for a reason people find surprising: on a show it is far more
 * often used as a clock than as a position.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

export function learnConnectivityPage({ esc, shell, jsonForScript, SITE, GH }) {
  const S = sec(esc)

  // range in metres (log), rate in kbit/s (log), power draw 1-5 (5 = hungry)
  const RADIOS = [
    { id: 'ble', name: 'Bluetooth LE', range: 30, rate: 1000, power: 1, use: 'Beltpack config, sensors, a phone talking to a fixture. Short range by design.' },
    { id: 'zigbee', name: 'Zigbee', range: 80, rate: 250, power: 1, use: 'Mesh sensor and control networks in installs. Low rate, self-healing.' },
    { id: 'lora', name: 'LoRa / LoRaWAN', range: 8000, rate: 27, power: 1, use: 'Kilometres of range on a coin cell, at a trickle of data. Site sensors, crowd counters, remote environmental monitoring across a festival.' },
    { id: 'wifi', name: 'Wi-Fi', range: 60, rate: 600000, power: 4, use: 'High rate, short range, hungry. Control surfaces and production wifi — not a place to put show-critical control.' },
    { id: 'uwb', name: 'UWB', range: 60, rate: 6000, power: 2, use: 'Ultra-wideband. Poor at carrying data, superb at measuring distance — which is why performer tracking uses it.' },
    { id: 'cell', name: '4G / 5G', range: 3000, rate: 100000, power: 4, use: 'Someone else runs the infrastructure. Great for a webcast uplink, unwise as a show-critical path.' },
    { id: 'crmx', name: 'CRMX / W-DMX', range: 300, rate: 250, power: 2, use: 'Purpose-built wireless DMX. Frequency-hopping in 2.4 GHz, sized exactly for a lighting universe.' },
    { id: 'gnss', name: 'GNSS', range: 20000000, rate: 0.05, power: 2, use: 'Receive only. A trickle of data from orbit — and the most accurate clock most venues will ever have.' },
  ]

  const GENS = [
    ['1G', '1980s', 'Analogue voice', 'Nothing but a phone call, and anyone with a scanner could listen to it.'],
    ['2G', '1991', 'Digital voice + SMS', 'GSM. Digital at last, and the first generation that could carry a text message. Being switched off in most countries.'],
    ['3G', '2001', 'Packet data', 'UMTS / CDMA2000. Data became a first-class citizen rather than a modem call. Also now being switched off.'],
    ['4G', '2009', 'All-IP, OFDMA', 'LTE. Everything became IP — voice included — and OFDMA arrived, which is why 4G handles congestion so much better than 3G.'],
    ['5G', '2019', 'Sub-6 + mmWave, slicing', 'NR. Higher rates, much lower latency, and network slicing — a carved-off slice of the network with guaranteed behaviour, which is the part relevant to broadcast contribution.'],
    ['Next', 'developing', '5G-Advanced, then 6G', '3GPP Release 18 onwards adds AI-assisted radio management and better positioning. 6G is research, targeted at roughly 2030 — expect sensing-as-a-feature rather than only communication.'],
  ]

  const style = LEARN_CSS + `
.radiomap{position:relative;height:330px;border:1px solid var(--line);border-radius:var(--r-md);
background:var(--panel);margin-top:14px;overflow:hidden}
.radiomap .ax{position:absolute;font-family:var(--mono);font-size:10.5px;color:var(--dimmer)}
.radiomap .gl{position:absolute;background:var(--line);opacity:.5}
.rnode{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;
gap:3px;cursor:pointer;background:none;border:0;padding:0}
.rnode .dot{border-radius:50%;background:var(--accent);border:2px solid var(--bg);transition:transform .2s}
.rnode:hover .dot,.rnode[aria-pressed="true"] .dot{transform:scale(1.35)}
.rnode[aria-pressed="true"] .dot{background:var(--accent2)}
.rnode .rn{font-family:var(--mono);font-size:10.5px;color:var(--dim);white-space:nowrap}
.rnode[aria-pressed="true"] .rn{color:var(--ink);font-weight:600}
.gens{display:grid;gap:8px;margin-top:16px}
.gen{display:grid;grid-template-columns:56px 74px 1fr;gap:12px;align-items:baseline;padding:12px 14px;
border:1px solid var(--line);border-radius:var(--r-sm);background:var(--panel)}
.gen b{font-family:var(--mono);font-size:15px;color:var(--accent)}
.gen .yr{font-family:var(--mono);font-size:11.5px;color:var(--dimmer)}
.gen .gt{color:var(--ink);font-size:14.5px;font-weight:600;display:block;margin-bottom:3px}
.gen .gd{color:var(--dim);font-size:13.8px;line-height:1.5}
@media(max-width:600px){.gen{grid-template-columns:50px 1fr}.gen .yr{grid-column:2}}
@keyframes sat-ping{0%{r:3;opacity:1}100%{r:46;opacity:0}}
.gnssfig .ping{animation:sat-ping 2.6s ease-out infinite;fill:none;stroke:var(--accent);stroke-width:1.6}
.gnssfig .ping.b{animation-delay:.85s}
.gnssfig .ping.c{animation-delay:1.7s}
`

  const gnssFig = `
<svg viewBox="0 0 620 210" role="img" class="gnssfig">
  ${[[120, 40], [310, 26], [500, 44]].map(([x, y], i) => `
    <circle class="ping ${'abc'[i]}" cx="${x}" cy="${y}" r="3"/>
    <rect x="${x - 13}" y="${y - 9}" width="26" height="18" rx="3" fill="var(--panel)" stroke="var(--accent)" stroke-width="1.4"/>
    <line x1="${x}" y1="${y + 9}" x2="310" y2="160" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 5"/>`).join('')}
  <rect x="288" y="158" width="44" height="30" rx="5" fill="var(--panel)" stroke="var(--line)" stroke-width="1.5"/>
  <text x="310" y="178" class="lbl" text-anchor="middle">RX</text>
  <text x="310" y="204" class="lbl" text-anchor="middle">four satellites, four unknowns: x, y, z — and the receiver's own clock error</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / connectivity</div>
${learnNav(esc, 'connectivity')}
<div class="lhero">
  <h2>Which wireless, and why</h2>
  <p class="lede">Range, data rate, battery life. Every radio technology on a site is a different answer to that three-way trade, and none of them wins all three.</p>
</div>

${S('The whole landscape', 'One chart, eight radios', [
  'Put range on one axis and data rate on the other and the wireless world sorts itself out. Things at the top right need mains power. Things at the bottom left run for years on a coin cell. Nothing sits in the top-right corner on a battery, because physics does not allow it.',
  'Click any of them for what it is actually for on a show.',
])}

<div class="radiomap" id="rmap" aria-hidden="true"></div>
<div class="readout" id="rmap-out" role="status" aria-live="polite"></div>

${rule('You are always trading <b>range against rate against battery</b>. When a vendor claims all three, the missing variable is usually duty cycle — it does that, briefly, occasionally.')}

${bites([
  '<b>LoRa is not a Wi-Fi replacement.</b> It carries a few hundred bytes a few kilometres. Perfect for "is this generator still running", useless for anything streaming.',
  '<b>UWB is a ruler, not a pipe.</b> Its value is measuring time-of-flight precisely, which is why it does performer tracking rather than carrying audio.',
  '<b>Wi-Fi is not a show-critical control path.</b> It is unlicensed, contended, and shared with every phone in the building. Use it for convenience, not for cues.',
  '<b>Bluetooth LE is a configuration channel.</b> Excellent for setting a fixture up from a phone at the rig, not for running it.',
])}

${S('Someone else\'s network', 'What actually changed between 2G and 5G', [
  'Each cellular generation is a different assumption about what the network is for. Worth knowing because a webcast uplink, a remote camera or an audience interaction all now ride on one — and because two of these generations are being switched off underneath equipment that still depends on them.',
])}

<div class="gens">
  ${GENS.map(([g, yr, t, d]) => `<div class="gen"><b>${esc(g)}</b><span class="yr">${esc(yr)}</span>
    <span><span class="gt">${esc(t)}</span><span class="gd">${esc(d)}</span></span></div>`).join('')}
</div>

${bites([
  '<b>2G and 3G shutdowns strand equipment.</b> Anything with an old cellular modem — remote monitoring, alarm diallers, some tracking hardware — stops working when the carrier turns that generation off. This has already happened in many countries.',
  '<b>"5G" on a phone is often not standalone 5G.</b> Non-standalone rides a 4G core, and the low-latency promises belong to the standalone version.',
  '<b>Network slicing is the interesting part for us.</b> A contracted slice with guaranteed behaviour is what makes cellular contribution viable for broadcast; ordinary consumer 5G is still a shared, best-effort network.',
])}

${S('The one everyone underestimates', 'GNSS is a clock that happens to know where it is', [
  'GPS is one of several global navigation satellite systems — alongside Galileo, GLONASS, BeiDou and others, collectively GNSS. Each satellite carries an atomic clock and continuously broadcasts the time along with its own orbital position.',
  'A receiver works out where it is by measuring how long each signal took to arrive. But it does not know its own clock error, so there are four unknowns — x, y, z and time — which is why you need <b>four</b> satellites rather than three. Solving for position necessarily solves for time as well.',
  'That is the part worth knowing on a show. A GNSS receiver is an extremely accurate, free, traceable time source — which is why GNSS-disciplined grandmaster clocks are how large productions and broadcast plants get everyone onto the same <a href="/protocols/ptp-1588/">PTP</a> or <a href="/protocols/ltc/">timecode</a> reference, and why a truck parked in an underground loading dock loses its clock discipline along with its sat-nav.',
])}

${fig(gnssFig, 'Each satellite sends its own time and position. The receiver solves for four unknowns at once — and the fourth is the clock.')}

${rule('Ask what a GNSS antenna is for before you assume. On a show site it is usually feeding a <b>clock</b>, not a map.')}

${xnote('Picking a radio is picking a failure mode, and the audience meets the failure mode rather than the spec sheet. A sensor that reports a minute late is invisible; a control path that stutters is a beat landing wrong. <b>Match the radio to how much lateness the moment can absorb</b>, which is an experience question before it is an RF one.')}

<div class="cta"><strong>The radios that carry a show.</strong>
<p>Legal frequencies by country are on the <a href="/rf/">RF map</a>, wireless DMX and mic hardware is under <a href="/hardware/">hardware</a>, and how several signals share one band is on <a href="/learn/wireless/">sharing the airwaves</a>.</p></div>
`

  const script = `
const RADIOS = ${jsonForScript(RADIOS)};
const $ = (s) => document.querySelector(s);
const map = $("#rmap");

// Log scales, because these span six orders of magnitude in both directions.
const lx = (m) => Math.log10(Math.max(1, m));
const ly = (k) => Math.log10(Math.max(0.01, k));
const X0 = lx(10), X1 = lx(20000000);
const Y0 = ly(0.02), Y1 = ly(600000);

function draw(){
  let html = '<span class="ax" style="left:12px;bottom:8px">10 m</span>' +
             '<span class="ax" style="right:12px;bottom:8px">planetary</span>' +
             '<span class="ax" style="left:12px;top:8px">fast</span>' +
             '<span class="ax" style="left:12px;bottom:26px">slow</span>' +
             '<span class="ax" style="right:12px;top:8px">range →</span>';
  for (let i = 1; i < 4; i++)
    html += '<span class="gl" style="left:' + (i * 25) + '%;top:0;bottom:0;width:1px"></span>' +
            '<span class="gl" style="top:' + (i * 25) + '%;left:0;right:0;height:1px"></span>';
  for (const r of RADIOS){
    const x = 8 + ((lx(r.range) - X0) / (X1 - X0)) * 84;
    const y = 88 - ((ly(r.rate) - Y0) / (Y1 - Y0)) * 76;
    const size = 8 + r.power * 3;
    html += '<button class="rnode" type="button" data-id="' + r.id + '" aria-pressed="false" ' +
      'style="left:' + x + '%;top:' + y + '%">' +
      '<span class="dot" style="width:' + size + 'px;height:' + size + 'px"></span>' +
      '<span class="rn">' + r.name + '</span></button>';
  }
  map.innerHTML = html;
}
function pick(id){
  const r = RADIOS.find((x) => x.id === id);
  for (const b of map.querySelectorAll(".rnode")) b.setAttribute("aria-pressed", String(b.dataset.id === id));
  $("#rmap-out").innerHTML = r
    ? '<b>' + r.name + '</b> — ' + r.use + ' <span style="color:var(--dimmer)">Dot size shows relative power draw.</span>'
    : 'Pick a radio for what it is actually used for.';
}
map.addEventListener("click", (e) => {
  const b = e.target.closest(".rnode");
  if (b) pick(b.dataset.id);
});
draw();
pick("lora");
`

  return shell({
    title: 'Which wireless, and why — LoRa, BLE, UWB, Wi-Fi, 5G and GNSS | showstack',
    description: 'Range against data rate against battery life for the radios used on show sites: Bluetooth LE, Zigbee, LoRa, Wi-Fi, UWB, CRMX, cellular and GNSS. What changed between 2G and 5G and what is developing next. And why GNSS is more often used as a clock than as a position.',
    canonical: `${SITE}/learn/connectivity/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Which wireless, and why',
      description: 'The range/rate/power trade across LoRa, BLE, UWB, Wi-Fi, cellular and GNSS, the 2G-to-5G generations, and GNSS as a time source.',
      url: `${SITE}/learn/connectivity/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
