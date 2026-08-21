/**
 * /tools/ — the calculators technicians reach for daily.
 *
 * The market told us what belongs here: the consistently top-ranked apps for
 * working technicians are DMX/DIP addressing calculators, speaker delay
 * calculators, and ShowTool-style timecode utilities. This page is those,
 * in one URL, offline-capable, with no install and no ads.
 *
 * Design constraints, in order:
 *  - Works from a phone on venue wifi, or none: everything client-side.
 *  - The arithmetic is the SAME code that is unit tested in Node. The
 *    functions in toolmath.mjs are embedded via toString(), so the page can
 *    never drift from the tested implementation.
 *  - Where two conventions exist in the field (DIP minus-one fixtures), the
 *    page says so instead of silently picking one. A wrong address set
 *    confidently is the exact failure this page exists to prevent.
 */
import {
  sacnMulticast, artnetCompose, artnetSplit,
  dmxAbsolute, dmxFromAbsolute, dipSwitches, dipToAddress,
  speakerDelay, tcToFrames, framesToTc,
  powerLoad, beamDiameter, illuminance, ledWall, rfWavelength,
} from './toolmath.mjs'

// The tested implementations, embedded verbatim.
const MATH_SRC = [
  sacnMulticast, artnetCompose, artnetSplit,
  dmxAbsolute, dmxFromAbsolute, dipSwitches, dipToAddress,
  speakerDelay, tcToFrames, framesToTc,
  powerLoad, beamDiameter, illuminance, ledWall, rfWavelength,
].map((f) => f.toString()).join('\n\n')

export function toolsPage({ esc, shell, SITE, GH }) {
  const style = `
.tool{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin-bottom:22px}
.tool h3{margin-top:0}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin-bottom:10px}
.field{display:flex;flex-direction:column;gap:4px}
.field label{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--dimmer)}
.field input,.field select{padding:9px 11px;background:var(--panel2);color:var(--ink);border:1px solid var(--line);
border-radius:7px;font-family:var(--mono);font-size:15px;min-height:42px;width:110px}
.field input:focus-visible,.field select:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.field select{width:auto}
.out{font-family:var(--mono);font-size:15px;color:var(--ink);background:var(--panel2);border:1px solid var(--line);
border-radius:7px;padding:10px 13px;margin-top:6px;overflow-x:auto}
.out b{color:var(--accent2)}
.out .err{color:var(--warn)}
.dips{display:flex;gap:6px;margin:10px 0 4px}
.dip{width:30px;height:52px;border:1px solid var(--line);border-radius:5px;background:var(--panel2);
position:relative;cursor:pointer;padding:0}
.dip:focus-visible{outline:2px solid var(--accent)}
.dip::after{content:"";position:absolute;left:4px;right:4px;height:20px;border-radius:3px;background:var(--dimmer);
bottom:4px;transition:all .12s}
.dip[aria-pressed="true"]::after{top:4px;bottom:auto;background:var(--accent)}
.dip .n{position:absolute;top:-18px;left:0;right:0;text-align:center;font-family:var(--mono);font-size:10px;color:var(--dimmer)}
.dips-wrap{padding-top:18px}
.note{font-size:13.5px;color:var(--dimmer);margin-top:8px}
.note a{color:var(--accent)}
label.inline{display:flex;gap:7px;align-items:center;font-size:13.5px;color:var(--dim);margin-top:8px}
`

  const body = `
<div class="crumb"><a href="/">showstack</a> / tools</div>
<h2>Field tools</h2>
<p class="lede">The calculations every crew does at load-in, done by the same arithmetic our test suite checks against published standards. Everything runs on this page: no install, no account, and it works with no signal once loaded.</p>

<div class="tool" id="dmx">
  <h3>DMX address</h3>
  <div class="row">
    <div class="field"><label for="dmx-u">Universe</label><input id="dmx-u" type="number" min="1" value="1" inputmode="numeric"></div>
    <div class="field"><label for="dmx-a">Address</label><input id="dmx-a" type="number" min="1" max="512" value="1" inputmode="numeric"></div>
    <div class="field"><label for="dmx-abs">Absolute channel</label><input id="dmx-abs" type="number" min="1" value="1" inputmode="numeric"></div>
  </div>
  <div class="out" id="dmx-out" role="status" aria-live="polite"></div>
  <p class="note">Absolute = (universe − 1) × 512 + address. sACN multicast per <a href="/protocols/sacn/">ANSI E1.31</a>; Art-Net port-address per <a href="/protocols/art-net/">Art-Net 4</a> (7-bit Net, 4-bit Sub-Net, 4-bit Universe — the sACN universe number and the Art-Net universe nibble are different things).</p>
</div>

<div class="tool" id="dip">
  <h3>DIP switch</h3>
  <div class="row">
    <div class="field"><label for="dip-a">Address</label><input id="dip-a" type="number" min="1" max="512" value="1" inputmode="numeric"></div>
  </div>
  <div class="dips-wrap"><div class="dips" id="dip-bank" aria-label="DIP switch bank"></div></div>
  <div class="out" id="dip-out" role="status" aria-live="polite"></div>
  <label class="inline"><input type="checkbox" id="dip-minus"> This fixture uses the (address − 1) convention</label>
  <p class="note">Most fixtures read the switches as plain binary of the address: switch 1 is value 1, switch 9 is value 256, so address 1 = switch 1 ON. Some older gear encodes address − 1 (address 1 = all OFF) — check the fixture manual before trusting either. Click switches to go the other way.</p>
</div>

<div class="tool" id="delay">
  <h3>Speaker delay</h3>
  <div class="row">
    <div class="field"><label for="del-d">Distance</label><input id="del-d" type="number" min="0" step="0.1" value="10" inputmode="decimal"></div>
    <div class="field"><label for="del-unit">Unit</label><select id="del-unit"><option value="m">metres</option><option value="ft">feet</option></select></div>
    <div class="field"><label for="del-t">Air temp °C</label><input id="del-t" type="number" value="20" inputmode="numeric"></div>
  </div>
  <div class="out" id="del-out" role="status" aria-live="polite"></div>
  <p class="note">Speed of sound = 331.3 + 0.606 × T m/s. Temperature is not pedantry: a 30 m throw shifts by several milliseconds between a cold morning line check and a hot afternoon show.</p>
</div>

<div class="tool" id="tc">
  <h3>Timecode</h3>
  <div class="row">
    <div class="field"><label for="tc-h">HH</label><input id="tc-h" type="number" min="0" value="1" inputmode="numeric"></div>
    <div class="field"><label for="tc-m">MM</label><input id="tc-m" type="number" min="0" max="59" value="0" inputmode="numeric"></div>
    <div class="field"><label for="tc-s">SS</label><input id="tc-s" type="number" min="0" max="59" value="0" inputmode="numeric"></div>
    <div class="field"><label for="tc-f">FF</label><input id="tc-f" type="number" min="0" value="0" inputmode="numeric"></div>
    <div class="field"><label for="tc-rate">Rate</label><select id="tc-rate">
      <option value="24">24</option><option value="23.976">23.976</option><option value="25" selected>25</option>
      <option value="29.97df">29.97 DF</option><option value="29.97ndf">29.97 NDF</option><option value="30">30</option>
    </select></div>
    <div class="field"><label for="tc-frames">Total frames</label><input id="tc-frames" type="number" min="0" inputmode="numeric" style="width:140px"></div>
  </div>
  <div class="out" id="tc-out" role="status" aria-live="polite"></div>
  <p class="note">Drop-frame skips frame labels 00 and 01 at the start of every minute except each tenth minute — labels, not time. Entering a label that does not exist (say 00:01:00;00 in DF) is reported as such rather than silently rounded. See <a href="/protocols/ltc/">LTC</a> and <a href="/protocols/mtc/">MTC</a>.</p>
</div>

<div class="tool" id="power">
  <h3>Power load</h3>
  <div class="row">
    <div class="field"><label for="pw-w">Total watts</label><input id="pw-w" type="number" min="0" value="10000" inputmode="numeric" style="width:130px"></div>
    <div class="field"><label for="pw-v">Volts</label><select id="pw-v">
      <option value="120">120</option><option value="208" selected>208</option><option value="230">230</option><option value="240">240</option><option value="400">400</option>
    </select></div>
    <div class="field"><label for="pw-ph">Phase</label><select id="pw-ph"><option value="1">single</option><option value="3" selected>three</option></select></div>
    <div class="field"><label for="pw-pf">Power factor</label><input id="pw-pf" type="number" min="0.1" max="1" step="0.05" value="1" inputmode="decimal"></div>
  </div>
  <div class="out" id="pw-out" role="status" aria-live="polite"></div>
  <p class="note">Single phase: A = W ÷ (V × PF). Three phase: A = W ÷ (√3 × V × PF), volts line-to-line. Moving lights and LED fixtures with a poor power factor draw more current than the wattage alone suggests. Circuit fill rules (like the 80% continuous-load rule) are jurisdiction-specific — check the code that applies to your venue.</p>
</div>

<div class="tool" id="beam">
  <h3>Beam &amp; throw</h3>
  <div class="row">
    <div class="field"><label for="bm-t">Throw m</label><input id="bm-t" type="number" min="0" step="0.1" value="10" inputmode="decimal"></div>
    <div class="field"><label for="bm-a">Beam angle °</label><input id="bm-a" type="number" min="1" max="179" step="0.5" value="26" inputmode="decimal"></div>
    <div class="field"><label for="bm-cd">Candela (optional)</label><input id="bm-cd" type="number" min="0" value="" inputmode="numeric" style="width:130px"></div>
  </div>
  <div class="out" id="bm-out" role="status" aria-live="polite"></div>
  <p class="note">Beam diameter = 2 × throw × tan(angle ÷ 2). Illuminance by the inverse square law: lux = candela ÷ throw². Enter the field angle instead to size the visible pool edge — fixture datasheets quote both.</p>
</div>

<div class="tool" id="led">
  <h3>LED wall</h3>
  <div class="row">
    <div class="field"><label for="lw-w">Width m</label><input id="lw-w" type="number" min="0.1" step="0.1" value="5" inputmode="decimal"></div>
    <div class="field"><label for="lw-h">Height m</label><input id="lw-h" type="number" min="0.1" step="0.1" value="3" inputmode="decimal"></div>
    <div class="field"><label for="lw-p">Pixel pitch mm</label><input id="lw-p" type="number" min="0.4" step="0.1" value="3.9" inputmode="decimal"></div>
  </div>
  <div class="out" id="lw-out" role="status" aria-live="polite"></div>
  <p class="note">Resolution = size ÷ pitch. The minimum comfortable viewing distance shown is the common rule of thumb (1 m per 1 mm of pitch), not a spec — content, brightness and camera use all move it.</p>
</div>

<div class="tool" id="rf">
  <h3>RF wavelength</h3>
  <div class="row">
    <div class="field"><label for="rf-f">Frequency MHz</label><input id="rf-f" type="number" min="1" step="0.025" value="600" inputmode="decimal" style="width:130px"></div>
  </div>
  <div class="out" id="rf-out" role="status" aria-live="polite"></div>
  <p class="note">λ = c ÷ f. Antenna lengths include the standard ~5% end-effect shortening (the 468/f rule). Handy for wireless mic and IEM antenna placement: keep transmit and receive antennas at least a wavelength apart where you can.</p>
</div>

<div class="cta"><strong>A calculation your crew does daily that is missing here?</strong>
<p><a href="${GH}/issues/new?labels=tooling&amp;title=tools%3A+">Name it</a> — if the arithmetic can be written down and tested, it belongs on this page. Rigging load maths is deliberately absent: point loads and bridle forces belong with a qualified rigger and the <a href="/standards/">governing standards</a>, not a web form.</p></div>
`

  const script = `
${MATH_SRC}

const $ = (s) => document.querySelector(s);

// ---- DMX address ----
// Two-way binding: editing universe/address updates absolute, editing
// absolute updates universe/address. The lastEdited flag prevents loops.
function dmxRender(fromAbs) {
  if (fromAbs) {
    const t = dmxFromAbsolute($("#dmx-abs").value);
    if (t) { $("#dmx-u").value = t.universe; $("#dmx-a").value = t.address; }
  } else {
    const abs = dmxAbsolute($("#dmx-u").value, $("#dmx-a").value);
    if (abs) $("#dmx-abs").value = abs;
  }
  const u = Number($("#dmx-u").value), a = Number($("#dmx-a").value);
  const abs = dmxAbsolute(u, a);
  if (abs === null) { $("#dmx-out").innerHTML = '<span class="err">Address must be 1–512, universe 1 or more.</span>'; return; }
  const mc = sacnMulticast(u);
  const an = artnetSplit(u - 1); // common one-to-one mapping: sACN u1 ~ port-address 0
  $("#dmx-out").innerHTML =
    'Absolute channel <b>' + abs + '</b>' +
    (mc ? ' · sACN universe ' + u + ' multicasts on <b>' + mc + '</b>' : '') +
    (an ? ' · as an Art-Net port-address ' + (u - 1) + ': Net <b>' + an.net + '</b> / Sub-Net <b>' + an.subnet + '</b> / Universe <b>' + an.universe + '</b>' : '');
}
for (const id of ["dmx-u", "dmx-a"]) $("#" + id).addEventListener("input", () => dmxRender(false));
$("#dmx-abs").addEventListener("input", () => dmxRender(true));

// ---- DIP switches ----
let dipState = { minus: false };
function dipRenderFromAddress() {
  const a = Number($("#dip-a").value);
  const sw = dipSwitches(a, dipState.minus);
  const bank = $("#dip-bank");
  if (!sw) {
    $("#dip-out").innerHTML = '<span class="err">' +
      (a === 512 && !dipState.minus
        ? 'Address 512 in plain binary needs a 10th switch — most 9-switch fixtures top out at 511, or use the (address − 1) convention.'
        : 'Address must be 1–512.') + '</span>';
    bank.innerHTML = "";
    return;
  }
  bank.innerHTML = sw.map((on, i) =>
    '<button type="button" class="dip" role="switch" aria-pressed="' + on + '" data-i="' + i + '" aria-label="switch ' + (i + 1) + '">' +
    '<span class="n">' + (i + 1) + '</span></button>').join("");
  const on = sw.map((v, i) => v ? (i + 1) : null).filter(Boolean);
  $("#dip-out").innerHTML = on.length
    ? 'Switches ON: <b>' + on.join(", ") + '</b> (values ' + on.map(n => 1 << (n - 1)).join(" + ") + ')'
    : 'All switches OFF';
}
$("#dip-a").addEventListener("input", dipRenderFromAddress);
$("#dip-minus").addEventListener("change", (e) => { dipState.minus = e.target.checked; dipRenderFromAddress(); });
$("#dip-bank").addEventListener("click", (e) => {
  const b = e.target.closest(".dip");
  if (!b) return;
  const current = [...$("#dip-bank").querySelectorAll(".dip")].map(x => x.getAttribute("aria-pressed") === "true");
  current[Number(b.dataset.i)] = !current[Number(b.dataset.i)];
  const a = dipToAddress(current, dipState.minus);
  if (a) { $("#dip-a").value = a; dipRenderFromAddress(); }
});

// ---- Speaker delay ----
function delayRender() {
  let d = Number($("#del-d").value);
  if ($("#del-unit").value === "ft") d = d * 0.3048;
  const r = speakerDelay(d, $("#del-t").value);
  if (!r) { $("#del-out").innerHTML = '<span class="err">Distance and temperature must be numbers.</span>'; return; }
  $("#del-out").innerHTML =
    '<b>' + r.ms.toFixed(2) + ' ms</b> at ' + r.speedOfSound + ' m/s' +
    ' · ' + r.samples48k + ' samples @48k · ' + r.samples96k + ' samples @96k';
}
for (const id of ["del-d", "del-unit", "del-t"]) $("#" + id).addEventListener("input", delayRender);

// ---- Timecode ----
function tcRenderFromFields() {
  const rate = $("#tc-rate").value;
  const n = tcToFrames($("#tc-h").value, $("#tc-m").value, $("#tc-s").value, $("#tc-f").value, rate);
  if (n === null) {
    $("#tc-out").innerHTML = '<span class="err">' +
      (rate === "29.97df" ? 'Not a valid drop-frame label — frames ;00 and ;01 do not exist at the start of a non-tenth minute.' : 'Fields out of range for this rate.') +
      '</span>';
    return;
  }
  $("#tc-frames").value = n;
  $("#tc-out").innerHTML = 'Frame <b>' + n + '</b> from zero at ' + $("#tc-rate").selectedOptions[0].text + ' fps';
}
function tcRenderFromFrames() {
  const t = framesToTc($("#tc-frames").value, $("#tc-rate").value);
  if (!t) { $("#tc-out").innerHTML = '<span class="err">Total frames must be a non-negative integer.</span>'; return; }
  $("#tc-h").value = t.h; $("#tc-m").value = t.m; $("#tc-s").value = t.s; $("#tc-f").value = t.f;
  const pad = (x) => String(x).padStart(2, "0");
  const sep = $("#tc-rate").value === "29.97df" ? ";" : ":";
  $("#tc-out").innerHTML = 'Timecode <b>' + pad(t.h) + ':' + pad(t.m) + ':' + pad(t.s) + sep + pad(t.f) + '</b>';
}
for (const id of ["tc-h", "tc-m", "tc-s", "tc-f"]) $("#" + id).addEventListener("input", tcRenderFromFields);
$("#tc-rate").addEventListener("input", tcRenderFromFields);
$("#tc-frames").addEventListener("input", tcRenderFromFrames);

// ---- Power load ----
function powerRender() {
  const r = powerLoad($("#pw-w").value, $("#pw-v").value, Number($("#pw-ph").value), $("#pw-pf").value);
  if (!r) { $("#pw-out").innerHTML = '<span class="err">Watts, volts and power factor must be sensible numbers.</span>'; return; }
  $("#pw-out").innerHTML = '<b>' + r.amps + ' A</b> at ' + $("#pw-v").value + ' V ' +
    ($("#pw-ph").value === "3" ? 'three-phase (per line)' : 'single phase');
}
for (const id of ["pw-w", "pw-v", "pw-ph", "pw-pf"]) $("#" + id).addEventListener("input", powerRender);

// ---- Beam & throw ----
function beamRender() {
  const b = beamDiameter($("#bm-t").value, $("#bm-a").value);
  if (!b) { $("#bm-out").innerHTML = '<span class="err">Throw must be 0 or more, angle between 1 and 179.</span>'; return; }
  let html = 'Beam diameter <b>' + b.diameter + ' m</b> at ' + $("#bm-t").value + ' m';
  const cd = $("#bm-cd").value;
  if (cd !== "") {
    const e = illuminance(cd, $("#bm-t").value);
    if (e) html += ' · <b>' + e.lux + ' lx</b> (' + e.footcandles + ' fc) centre beam';
  }
  $("#bm-out").innerHTML = html;
}
for (const id of ["bm-t", "bm-a", "bm-cd"]) $("#" + id).addEventListener("input", beamRender);

// ---- LED wall ----
function ledRender() {
  const r = ledWall($("#lw-w").value, $("#lw-h").value, $("#lw-p").value);
  if (!r) { $("#lw-out").innerHTML = '<span class="err">Width, height and pitch must be positive.</span>'; return; }
  $("#lw-out").innerHTML = '<b>' + r.pxW + ' × ' + r.pxH + ' px</b> · ' +
    (r.totalPx / 1000000).toFixed(2) + ' Mpx · comfortable from ≈<b>' + r.minViewMeters + ' m</b>';
}
for (const id of ["lw-w", "lw-h", "lw-p"]) $("#" + id).addEventListener("input", ledRender);

// ---- RF wavelength ----
function rfRender() {
  const r = rfWavelength($("#rf-f").value);
  if (!r) { $("#rf-out").innerHTML = '<span class="err">Frequency must be a positive number of MHz.</span>'; return; }
  $("#rf-out").innerHTML = 'λ <b>' + r.wavelength + ' m</b> · half-wave <b>' + r.halfWave +
    ' m</b> · quarter-wave <b>' + r.quarterWave + ' m</b> (' + r.quarterWaveInches + ' in)';
}
$("#rf-f").addEventListener("input", rfRender);

dmxRender(false);
dipRenderFromAddress();
delayRender();
tcRenderFromFields();
powerRender();
beamRender();
ledRender();
rfRender();
`

  return shell({
    title: 'Field tools — DMX, delay, timecode, power, beam and LED wall calculators | showstack',
    description: 'The calculators technicians use daily: DMX address and sACN multicast, DIP switches, speaker delay, drop-frame timecode, power load, beam and photometrics, LED wall resolution, RF wavelength. Free, offline-capable, tested arithmetic.',
    canonical: `${SITE}/tools/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'showstack field tools',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      url: `${SITE}/tools/`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
      featureList: 'DMX address calculator, sACN multicast calculator, Art-Net port-address, DIP switch calculator, speaker delay calculator, drop-frame timecode converter, power load calculator, beam angle and photometrics calculator, LED wall resolution calculator, RF wavelength calculator',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
