/**
 * /rf/ - the wireless microphone frequency map.
 *
 * Radio mic spectrum is national law, not physics: the same transmitter is
 * legal in one country and confiscable in the next, and the 700 MHz sell-off
 * made a lot of working inventory illegal overnight. This page draws each
 * country's permitted bands to scale, checks a frequency against them, and
 * cites the regulator for every row. Regions we could not source render as
 * explicit gaps that ask for a contributor instead of a guess.
 */
import { RFDATA, rfCheck } from './rfdata.mjs'

const MATH_SRC = [rfCheck].map((f) => f.toString()).join('\n\n')

const USE_LABEL = {
  unlicensed: 'licence-exempt',
  licensed: 'licence required',
  coordinated: 'licence + coordination',
  prohibited: 'prohibited',
}

export function rfPage({ esc, shell, jsonForScript, SITE, GH }) {
  const style = `
.tool{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin-bottom:22px}
.tool h3{margin-top:0}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin-bottom:10px}
.field{display:flex;flex-direction:column;gap:4px}
.field label{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--dimmer)}
.field input,.field select{padding:9px 11px;background:var(--panel2);color:var(--ink);border:1px solid var(--line);
border-radius:7px;font-family:var(--mono);font-size:15px;min-height:42px}
.out{font-family:var(--mono);font-size:15px;color:var(--ink);background:var(--panel2);border:1px solid var(--line);
border-radius:7px;padding:10px 13px;margin-top:6px;overflow-x:auto}
.out b{color:var(--accent2)}
.out .err{color:var(--warn)}
.out .ok{color:var(--ok)}
.strip{margin:14px 0 4px}
.strip .cap{display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;color:var(--dimmer)}
.strip .bar{position:relative;height:34px;background:var(--panel2);border:1px solid var(--line);border-radius:7px;overflow:hidden}
.strip .band{position:absolute;top:0;bottom:0;opacity:.85;min-width:2px}
.band.unlicensed{background:var(--ok)}
.band.licensed{background:var(--accent2)}
.band.coordinated{background:var(--accent)}
.band.prohibited{background:repeating-linear-gradient(45deg,var(--warn),var(--warn) 6px,transparent 6px,transparent 12px)}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-family:var(--mono);font-size:11.5px;color:var(--dim);margin-top:10px}
.legend i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.gapbox{background:color-mix(in srgb,var(--accent2) 9%,transparent);border:1px dashed color-mix(in srgb,var(--accent2) 50%,transparent);
border-radius:9px;padding:13px 16px;margin:10px 0;color:var(--ink);font-size:14.5px}
.gotcha{background:var(--panel);border-left:2px solid var(--accent2);padding:11px 15px;margin-bottom:9px;
border-radius:0 7px 7px 0;color:var(--dim);font-size:14.5px}
.gotcha b{color:var(--ink)}
.note{font-size:13.5px;color:var(--dimmer);margin-top:8px}
.note a{color:var(--accent)}
.srcs{font-size:13px;color:var(--dimmer);margin-top:10px}
.srcs a{color:var(--accent)}
`

  const options = Object.entries(RFDATA.regions).map(([id, r]) =>
    `<option value="${esc(id)}"${id === 'us' ? ' selected' : ''}>${esc(r.name)}</option>`).join('')

  // The full per-country picture, server-rendered so a search engine (and a
  // reader with JS off) gets every region, not just the default one.
  const allRegions = Object.entries(RFDATA.regions).map(([id, r]) => {
    const rows = (r.bands ?? []).map((b) =>
      `<tr><td><strong>${b.from} - ${b.to} MHz</strong></td><td>${esc(USE_LABEL[b.use] ?? b.use)}</td><td>${esc(b.label)}</td></tr>`).join('')
    const srcs = (r.sources ?? []).map((s) => `<a href="${esc(s.url)}" rel="noopener nofollow">${esc(s.title)}</a>`).join(' · ')
    return `<h3 id="rf-${esc(id)}">${esc(r.name)}</h3>` +
      (r.gapNote ? `<div class="gapbox"><b>Open gap:</b> ${esc(r.gapNote)} <a href="${GH}/issues/new?labels=good+first+issue&amp;title=${encodeURIComponent(`[rf] ${r.name}: sourced band plan`)}">Claim it →</a></div>` : '') +
      (rows ? `<table><tr><th>Band</th><th>Status</th><th>What it is</th></tr>${rows}</table>` : '') +
      (r.note ? `<p class="note">${esc(r.note)}</p>` : '') +
      (srcs ? `<p class="srcs">Sources: ${srcs}</p>` : '')
  }).join('')

  const body = `
<div class="crumb"><a href="/">showstack</a> / rf</div>
<h2>Wireless mic frequencies by country</h2>
<p class="lede">Where radio microphones and IEMs are legal to run, drawn to scale per country, with the regulator cited on every band. The map exists because the 700 MHz band was sold to mobile carriers almost everywhere, and gear that tours across borders needs to know before customs does.</p>

<div class="tool" id="map">
  <h3>The map</h3>
  <div class="row">
    <div class="field"><label for="rg">Country / region</label><select id="rg">${options}</select></div>
    <div class="field"><label for="fq">Check a frequency (MHz)</label><input id="fq" type="number" min="1" step="0.005" placeholder="606.5" inputmode="decimal" style="width:140px"></div>
  </div>
  <div class="out" id="fq-out" role="status" aria-live="polite">Pick a country; type a frequency to check it.</div>
  <div id="strips"></div>
  <div class="legend">
    <span><i style="background:var(--ok)"></i>licence-exempt</span>
    <span><i style="background:var(--accent2)"></i>licence required</span>
    <span><i style="background:var(--accent)"></i>licence + coordination</span>
    <span><i style="background:repeating-linear-gradient(45deg,var(--warn),var(--warn) 4px,transparent 4px,transparent 8px)"></i>prohibited</span>
  </div>
  <div id="rg-extra"></div>
  <p class="note">Bands not drawn are not listed for that country in our data: that means "check the regulator", never "probably fine". Power limits and licence detail are in the tables below.</p>
</div>

<div class="tool">
  <h3>Why this bites touring shows</h3>
  <div class="gotcha"><b>The 700 MHz sale is global.</b> 694/698-806 MHz went to LTE/5G in the US (2009), EU and Australia (by 2015-2019), Japan (2019) and most of Asia. Inventory tuned there is not grandfathered: it is illegal to switch on.</div>
  <div class="gotcha"><b>TV white space means the locally unused channels.</b> A band being listed does not make every megahertz usable: US, UK, DE and JP all expect you to work around the broadcasters actually on air at that postcode. Scan on site, or use the regulator's channel finder.</div>
  <div class="gotcha"><b>Coordination is part of the licence in some countries.</b> Japan's A-type mics are scheduled with broadcasters through the 特定ラジオマイク運用調整機構; UK coordinated UHF is booked per site through Ofcom PMSE. Turning up unannounced with 40 channels is how festivals end up in the regulator's annual report.</div>
  <div class="gotcha"><b>Buying gear abroad is the classic trap.</b> A US 600 MHz-legal system centres exactly where the EU cleared, and an EU 823-832 duplex-gap system sits inside Japan's B-type band only by luck. Match the tuning range to the country list below before money moves.</div>
</div>

<div class="tool" id="all">
  <h3>Every region, with sources</h3>
  ${allRegions}
  <p class="note">Missing your country, or holding a licence document that pins a gap above? <a href="${GH}/issues/new?labels=good+first+issue&amp;title=%5Brf%5D%20">Open an issue</a> - regulatory rows only merge with a regulator or equivalent citation.</p>
</div>
`

  const script = `
${MATH_SRC}

const RF = ${jsonForScript(RFDATA)};
const USE_LABEL = ${jsonForScript(USE_LABEL)};
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const WINDOWS = [[30, 250], [400, 1000], [1000, 2000]];

function drawStrips() {
  const r = RF.regions[$('#rg').value];
  const host = $('#strips');
  const extra = $('#rg-extra');
  if (!r) { host.innerHTML = ''; extra.innerHTML = ''; return; }
  let html = '';
  for (const [lo, hi] of WINDOWS) {
    const inWin = (r.bands ?? []).filter((b) => b.to > lo && b.from < hi);
    if (!inWin.length) continue;
    const pos = (x) => ((Math.min(Math.max(x, lo), hi) - lo) / (hi - lo)) * 100;
    html += '<div class="strip"><div class="cap"><span>' + lo + ' MHz</span><span>' + hi + ' MHz</span></div><div class="bar">' +
      inWin.map((b) => '<span class="band ' + b.use + '" style="left:' + pos(b.from) + '%;width:' + Math.max(0.4, pos(b.to) - pos(b.from)) + '%" title="' + esc(b.from + '-' + b.to + ' MHz: ' + b.label) + '"></span>').join('') +
      '</div></div>';
  }
  host.innerHTML = html || '<p class="note">No bands to draw for this region yet.</p>';
  extra.innerHTML = (r.gapNote ? '<div class="gapbox"><b>Open gap:</b> ' + esc(r.gapNote) + '</div>' : '') +
    (r.note ? '<p class="note">' + esc(r.note) + '</p>' : '');
}

function checkFq() {
  const v = $('#fq').value;
  if (v === '') { $('#fq-out').textContent = 'Pick a country; type a frequency to check it.'; return; }
  const res = rfCheck(RF, $('#rg').value, v);
  if (!res) { $('#fq-out').innerHTML = '<span class="err">Enter a positive frequency in MHz.</span>'; return; }
  const name = RF.regions[$('#rg').value].name;
  if (res.banned) {
    $('#fq-out').innerHTML = '<span class="err">' + esc(v) + ' MHz is explicitly prohibited in ' + esc(name) + '</span> - ' + esc(res.hits.find((h) => h.use === 'prohibited').label);
  } else if (res.legal) {
    $('#fq-out').innerHTML = '<span class="ok">' + esc(v) + ' MHz falls in a listed band in ' + esc(name) + '</span> - ' +
      res.hits.map((h) => esc(h.from + '-' + h.to + ' (' + (USE_LABEL[h.use] ?? h.use) + '): ' + h.label)).join(' · ');
  } else {
    $('#fq-out').innerHTML = '<span class="err">' + esc(v) + ' MHz is not in any band we list for ' + esc(name) + '</span> - treat as not permitted until the regulator says otherwise.';
  }
}

$('#rg').addEventListener('input', () => { drawStrips(); checkFq(); });
$('#fq').addEventListener('input', checkFq);
drawStrips();
`

  return shell({
    title: 'Wireless microphone frequencies by country - legal bands, licences, 700 MHz | showstack',
    description: 'Which frequencies wireless mics and IEMs may legally use in the US, UK, EU, Germany, Japan, Korea, Australia, Singapore, Hong Kong and more, drawn to scale with regulator sources, licence conditions and a frequency checker.',
    canonical: `${SITE}/rf/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'showstack wireless frequency map',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      url: `${SITE}/rf/`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
      featureList: 'wireless microphone legal frequencies by country, PMSE band map, 700 MHz clearance, frequency legality checker',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
