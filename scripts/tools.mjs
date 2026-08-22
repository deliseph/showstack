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
  ohmsLaw, speakerImpedance, processingDelay, speakerNetwork,
  throwRatio, screenLuminance, relayLogic, dbuToDbv, dbvToDbu,
} from './toolmath.mjs'

// The tested implementations, embedded verbatim.
const MATH_SRC = [
  sacnMulticast, artnetCompose, artnetSplit,
  dmxAbsolute, dmxFromAbsolute, dipSwitches, dipToAddress,
  speakerDelay, tcToFrames, framesToTc,
  powerLoad, beamDiameter, illuminance, ledWall, rfWavelength,
  ohmsLaw, speakerImpedance, processingDelay, speakerNetwork,
  throwRatio, screenLuminance, relayLogic, dbuToDbv, dbvToDbu,
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
/* True masonry, not a uniform-row grid: CSS grid sizes every row to its
   tallest card, so a short calculator next to a tall one leaves dead space
   underneath it. Multi-column flow instead packs each card into whichever
   column is shortest so far, using the card's own height — no row to be
   uneven. .tool.wide breaks the columns for the handful of cards (timecode,
   relay logic, the audio-unit reference) that need the full measure. */
.toolgroup{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.6px;
color:var(--dimmer);margin:0 0 10px;column-span:all}
.toolgroup:not(:first-child){margin-top:22px;padding-top:18px;border-top:1px solid var(--line)}
.toolgrid{columns:2;column-gap:18px}
.toolgrid .tool{break-inside:avoid;margin:0 0 18px}
.tool.wide{column-span:all}
@media(max-width:720px){.toolgrid{columns:1}}
.viz{margin-top:10px;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:8px;overflow:hidden}
.viz svg{display:block;width:100%;height:auto}
.meter{position:relative;height:34px;background:var(--panel2);border:1px solid var(--line);border-radius:7px;margin-top:10px;overflow:hidden}
.meter .fill{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,var(--ok),var(--accent2));transition:width .25s;border-radius:6px 0 0 6px}
.meter .tick{position:absolute;top:0;bottom:0;width:1px;background:var(--dimmer);opacity:.6}
.meter .tick span{position:absolute;top:2px;left:3px;font-family:var(--mono);font-size:10px;color:var(--dimmer)}
.ledprev{margin-top:10px;border:1px solid var(--line);border-radius:8px;background-color:#000;
background-image:radial-gradient(circle,var(--accent) 22%,transparent 26%);max-width:100%}
.field textarea{padding:9px 11px;background:var(--panel2);color:var(--ink);border:1px solid var(--line);
border-radius:7px;font-family:var(--mono);font-size:14px;width:300px;min-height:74px;resize:vertical}
.ttwrap{overflow-x:auto;margin-top:10px}
.tt td.on{color:var(--ok);font-weight:700}
.tt td.off{color:var(--dimmer)}
.tt th.outcol,.tt td.outcol{border-left:1px solid var(--line);padding-left:12px}
`

  const body = `
<div class="crumb"><a href="/">showstack</a> / tools</div>
<h2>Field tools</h2>
<p class="lede">The calculations every crew does at load-in, done by the same arithmetic our test suite checks against published standards. Everything runs on this page: no install, no account, and it works with no signal once loaded.</p>

<div class="toolgrid">
<div class="toolgroup">Addressing &amp; show control</div>
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

<div class="tool wide" id="tc">
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

<div class="tool wide" id="relay">
  <h3>Relay logic matrix</h3>
  <div class="row">
    <div class="field"><label for="rl-rules">Rules (one per line: OUT = expr)</label><textarea id="rl-rules" spellcheck="false">MAIN = GO &amp; !ESTOP
HORN = GO &amp; (A | B)</textarea></div>
  </div>
  <div class="out" id="rl-out" role="status" aria-live="polite"></div>
  <div class="ttwrap" id="rl-table"></div>
  <p class="note">Write each output as a boolean rule: <b>&amp;</b> AND, <b>|</b> OR, <b>!</b> NOT, parentheses group. Every input combination is evaluated into the matrix, which is how you sanity-check an interlock chain before wiring it. Up to 5 inputs and 6 rules; outputs cannot feed back, because latching and timing belong in the controller, not a truth table. This is a thinking tool: a real e-stop chain is hard-wired to the <a href="/standards/">machinery standards</a>, never through software.</p>
</div>

<div class="toolgroup">Audio</div>
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

<div class="tool" id="latency">
  <h3>Latency budget</h3>
  <div class="row">
    <div class="field"><label for="lt-list">Stage delays ms</label><input id="lt-list" type="text" value="0.9, 2.1, 1.5" style="width:200px" spellcheck="false"></div>
  </div>
  <div class="out" id="lt-out" role="status" aria-live="polite"></div>
  <div class="viz" id="lt-viz" aria-hidden="true"></div>
  <p class="note">List every hop in the chain: console, plugin, system processor, amp DSP. The total is what your time alignment has to absorb, shown as the distance sound covers in that time at 20 °C. Pair it with the speaker delay tool when you align delays to the main PA.</p>
</div>

<div class="tool" id="spkz">
  <h3>Speaker load</h3>
  <div class="row">
    <div class="field"><label for="sz-list">Wiring (+ series, comma parallel)</label><input id="sz-list" type="text" value="8+8, 8+8" style="width:210px" spellcheck="false"></div>
    <div class="field"><label for="sz-amp">Amp watts (opt)</label><input id="sz-amp" type="number" min="1" inputmode="numeric" style="width:120px"></div>
  </div>
  <div class="out" id="sz-out" role="status" aria-live="polite"></div>
  <div class="viz" id="sz-viz" aria-hidden="true"></div>
  <p class="note">Mixed wiring the way you would say it: <b>8+8, 8+8</b> is two series pairs in parallel (8 Ω total). "+" chains boxes in series, "," or "||" puts groups in parallel. With amp watts set it shows power per group and per box: in parallel the lower-impedance group takes more, inside a series chain the higher-impedance box takes more. Check the amplifier's minimum rated load before you land below 4 Ω; 70/100 V line systems play by transformer-tap rules instead.</p>
</div>

<div class="tool wide" id="audiounits">
  <h3>Audio levels &amp; impedance</h3>
  <div class="row">
    <div class="field"><label for="db-u">dBu</label><input id="db-u" type="number" step="0.1" value="4" inputmode="decimal"></div>
    <div class="field"><label for="db-v">dBV</label><input id="db-v" type="number" step="0.1" inputmode="decimal"></div>
  </div>
  <div class="out" id="db-out" role="status" aria-live="polite"></div>
  <p class="note">dBu and dBV are both line-level <em>voltage</em> references, fixed 2.21 dB apart at any level — 0 dBu = 0.775 V RMS (the "unloaded" successor to 600 Ω-referenced dBm), 0 dBV = 1 V RMS. Pro gear nominally runs +4 dBu; consumer/semi-pro gear −10 dBV — an 11.8 dB gap, the reason a "line level" cable between the two clips or hisses until you pad or gain-stage it.</p>
  <table style="margin-top:14px">
    <tr><th>Unit</th><th>Reference</th><th>Measures</th></tr>
    <tr><td><b>dB SPL</b></td><td>20 µPa (threshold of hearing)</td><td>Sound pressure in air — what a bare SPL meter reads before any weighting is applied.</td></tr>
    <tr><td><b>dB(A)</b></td><td>SPL, A-weighted</td><td>Rolls off bass steeply to approximate ear sensitivity at moderate levels. Standard for noise-exposure limits and most SPL-meter defaults — under-represents low end.</td></tr>
    <tr><td><b>dB(Z)</b></td><td>SPL, unweighted</td><td>Flat 10 Hz–20 kHz ±1.5 dB per IEC 61672-1 ("Z" = zero weighting). The true acoustic level, used where the low end matters: sub alignment, cinema and room calibration.</td></tr>
    <tr><td><b>dBu</b></td><td>0.775 V RMS</td><td>Line-level signal voltage, independent of load impedance — the professional-gear standard.</td></tr>
    <tr><td><b>dBV</b></td><td>1 V RMS</td><td>Line-level signal voltage on the simpler round-number reference — consumer and semi-pro gear.</td></tr>
  </table>
  <p class="note">SPL and dBu/dBV are not the same kind of measurement and do not convert into each other: one is acoustic pressure in air, the other is electrical voltage in a cable. A mixer's output meter reading "0 dBu" says nothing about how loud the room is.</p>
  <p class="note">Ohms (Ω) also names two different things on this page. <b>Resistance</b> — the Ohm's law tool below, a lamp or heater element — opposes current the same way at any frequency, all of it dissipated as heat. <b>Impedance</b> — the Speaker load tool above — is resistance's AC generalisation, Z = R + jX: a reactance X from the driver's voice coil and crossover that shifts with frequency. A loudspeaker's "8 Ω" is a nominal average, not a fixed value — the real number can swing from under 5 Ω to well over 40 Ω near cone resonance. That is why the speaker load arithmetic above is exact for a stated nominal figure, while Ohm's law's resistive-only assumption is indicative, not exact, once it is pointed at a driver instead of a lamp.</p>
</div>

<div class="toolgroup">Lighting &amp; video</div>
<div class="tool" id="beam">
  <h3>Beam &amp; throw</h3>
  <div class="row">
    <div class="field"><label for="bm-t">Throw m</label><input id="bm-t" type="number" min="0" step="0.1" value="10" inputmode="decimal"></div>
    <div class="field"><label for="bm-a">Beam angle °</label><input id="bm-a" type="number" min="1" max="179" step="0.5" value="26" inputmode="decimal"></div>
    <div class="field"><label for="bm-cd">Candela (optional)</label><input id="bm-cd" type="number" min="0" value="" inputmode="numeric" style="width:130px"></div>
  </div>
  <div class="out" id="bm-out" role="status" aria-live="polite"></div>
  <div class="viz" id="bm-viz" aria-hidden="true"></div>
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
  <div class="ledprev" id="lw-prev" aria-hidden="true"></div>
  <p class="note">Resolution = size ÷ pitch. The minimum comfortable viewing distance shown is the common rule of thumb (1 m per 1 mm of pitch), not a spec — content, brightness and camera use all move it.</p>
</div>

<div class="tool" id="throw">
  <h3>Projector throw</h3>
  <div class="row">
    <div class="field"><label for="th-d">Distance m</label><input id="th-d" type="number" min="0.1" step="0.1" inputmode="decimal"></div>
    <div class="field"><label for="th-w">Image width m</label><input id="th-w" type="number" min="0.1" step="0.1" inputmode="decimal"></div>
    <div class="field"><label for="th-r">Throw ratio</label><input id="th-r" type="number" min="0.1" step="0.01" inputmode="decimal"></div>
  </div>
  <div class="out" id="th-out" role="status" aria-live="polite">Enter any two values.</div>
  <p class="note">Ratio = distance ÷ image width, the number on every lens datasheet. Fill any two, the third follows (the two you touched last are the knowns). A 1.8:1 lens filling a 4 m screen sits at 7.2 m. Zoom lenses quote a range: check both ends still land in the booth.</p>
</div>

<div class="tool" id="screen">
  <h3>Screen brightness</h3>
  <div class="row">
    <div class="field"><label for="sc-lm">Projector lumens</label><input id="sc-lm" type="number" min="1" value="10000" inputmode="numeric" style="width:130px"></div>
    <div class="field"><label for="sc-w">Width m</label><input id="sc-w" type="number" min="0.1" step="0.1" value="6" inputmode="decimal"></div>
    <div class="field"><label for="sc-h">Height m</label><input id="sc-h" type="number" min="0.1" step="0.1" value="3.4" inputmode="decimal"></div>
    <div class="field"><label for="sc-g">Screen gain</label><input id="sc-g" type="number" min="0.1" step="0.1" value="1.0" inputmode="decimal"></div>
  </div>
  <div class="out" id="sc-out" role="status" aria-live="polite"></div>
  <p class="note">Incident light is lux = lumens ÷ area. What the audience sees is luminance: fL = lumens × gain ÷ area in ft², and 1 fL = 3.4263 cd/m² (nits). <a href="https://www.dcimovies.com/specification/" rel="noopener nofollow">DCI cinema reference</a> is 48 cd/m² (14 fL) in the dark; ambient light on the screen is the number that actually kills contrast. Gain redirects light toward the axis rather than creating it, so high gain trades viewing angle.</p>
</div>

<div class="toolgroup">Power &amp; electrical</div>
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
  <div class="meter" id="pw-meter" aria-hidden="true"></div>
  <p class="note">Single phase: A = W ÷ (V × PF). Three phase: A = W ÷ (√3 × V × PF), volts line-to-line. Moving lights and LED fixtures with a poor power factor draw more current than the wattage alone suggests. Circuit fill rules (like the 80% continuous-load rule) are jurisdiction-specific — check the code that applies to your venue.</p>
</div>

<div class="tool" id="ohm">
  <h3>Ohm's law</h3>
  <div class="row">
    <div class="field"><label for="oh-v">Volts</label><input id="oh-v" type="number" min="0" step="0.1" inputmode="decimal"></div>
    <div class="field"><label for="oh-i">Amps</label><input id="oh-i" type="number" min="0" step="0.1" inputmode="decimal"></div>
    <div class="field"><label for="oh-r">Ohms</label><input id="oh-r" type="number" min="0.01" step="0.1" inputmode="decimal"></div>
    <div class="field"><label for="oh-p">Watts</label><input id="oh-p" type="number" min="0" step="1" inputmode="decimal"></div>
  </div>
  <div class="out" id="oh-out" role="status" aria-live="polite">Enter any two values.</div>
  <p class="note">Fill in any two and the other two follow (V = I × R, P = V × I). The last two fields you edited are treated as the knowns. Resistive-load arithmetic: fine for lamps and heaters, indicative for anything reactive.</p>
</div>

<div class="toolgroup">RF</div>
<div class="tool" id="rf">
  <h3>RF wavelength</h3>
  <div class="row">
    <div class="field"><label for="rf-f">Frequency MHz</label><input id="rf-f" type="number" min="1" step="0.025" value="600" inputmode="decimal" style="width:130px"></div>
  </div>
  <div class="out" id="rf-out" role="status" aria-live="polite"></div>
  <p class="note">λ = c ÷ f. Antenna lengths include the standard ~5% end-effect shortening (the 468/f rule). Handy for wireless mic and IEM antenna placement: keep transmit and receive antennas at least a wavelength apart where you can.</p>
</div>

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

// ---- Live visuals ----
// Small, honest pictures of the numbers: the cone you would see, the load on
// the feed, the pixel density you specified. Each redraws with its inputs.
function drawBeam() {
  const t = Number($("#bm-t").value), a = Number($("#bm-a").value);
  const b = beamDiameter(t, a);
  const el = $("#bm-viz");
  if (!b || t <= 0) { el.innerHTML = ""; return; }
  const W = 320, H = 120, fx = 16, fy = H / 2;
  const half = Math.min((b.diameter / (2 * t)) * (W - 60), H / 2 - 8);
  el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img">' +
    '<polygon points="' + fx + ',' + fy + ' ' + (W - 30) + ',' + (fy - half) + ' ' + (W - 30) + ',' + (fy + half) + '"' +
    ' fill="var(--accent2)" opacity="0.25"/>' +
    '<line x1="' + fx + '" y1="' + fy + '" x2="' + (W - 30) + '" y2="' + (fy - half) + '" stroke="var(--accent2)" stroke-width="1.5"/>' +
    '<line x1="' + fx + '" y1="' + fy + '" x2="' + (W - 30) + '" y2="' + (fy + half) + '" stroke="var(--accent2)" stroke-width="1.5"/>' +
    '<rect x="6" y="' + (fy - 8) + '" width="14" height="16" rx="3" fill="var(--dim)"/>' +
    '<line x1="' + (W - 30) + '" y1="' + (fy - half) + '" x2="' + (W - 30) + '" y2="' + (fy + half) + '" stroke="var(--accent)" stroke-width="2"/>' +
    '<text x="' + (W - 24) + '" y="' + (fy + 4) + '" fill="var(--dim)" font-size="11" font-family="monospace">' + b.diameter + 'm</text>' +
    '</svg>';
}
function drawPowerMeter() {
  const r = powerLoad($("#pw-w").value, $("#pw-v").value, Number($("#pw-ph").value), $("#pw-pf").value);
  const el = $("#pw-meter");
  if (!r) { el.innerHTML = ""; return; }
  const marks = [13, 16, 20, 32, 63, 125];
  const top = marks.find((m) => m >= r.amps) ?? Math.ceil(r.amps / 100) * 100;
  const scale = top * 1.25;
  let html = '<div class="fill" style="width:' + Math.min(100, r.amps / scale * 100) + '%"></div>';
  for (const m of marks) {
    if (m > scale) break;
    html += '<div class="tick" style="left:' + (m / scale * 100) + '%"><span>' + m + 'A</span></div>';
  }
  el.innerHTML = html;
}
function drawLedPreview() {
  const r = ledWall($("#lw-w").value, $("#lw-h").value, $("#lw-p").value);
  const el = $("#lw-prev");
  if (!r) { el.style.display = "none"; return; }
  const w = Number($("#lw-w").value), h = Number($("#lw-h").value), p = Number($("#lw-p").value);
  const boxW = 300, boxH = Math.max(40, Math.min(200, boxW * (h / w)));
  const dot = Math.max(3, Math.min(24, p * 2.5));
  el.style.display = "block";
  el.style.width = boxW + "px";
  el.style.height = boxH + "px";
  el.style.backgroundSize = dot + "px " + dot + "px";
}

// ---- Ohm's law ----
// The two most recently edited fields are the knowns; the others follow.
const ohKeys = ["v", "i", "r", "p"];
let ohEdited = [];
function ohmRender() {
  if (ohEdited.length < 2) { $("#oh-out").textContent = "Enter any two values."; return; }
  const args = {};
  for (const k of ohEdited) args[k] = $("#oh-" + k).value;
  const r = ohmsLaw(args);
  if (!r) { $("#oh-out").innerHTML = '<span class="err">Those two do not make a solvable pair — check the numbers.</span>'; return; }
  $("#oh-out").innerHTML =
    '<b>' + r.volts + ' V</b> · <b>' + r.amps + ' A</b> · <b>' + r.ohms + ' Ω</b> · <b>' + r.watts + ' W</b>';
}
for (const k of ohKeys) {
  $("#oh-" + k).addEventListener("input", () => {
    if ($("#oh-" + k).value === "") { ohEdited = ohEdited.filter((x) => x !== k); }
    else { ohEdited = ohEdited.filter((x) => x !== k); ohEdited.push(k); if (ohEdited.length > 2) ohEdited.shift(); }
    ohmRender();
  });
}

// ---- dBu / dBV ----
function dbuvRender(from) {
  if (from === "dbv") {
    const u = dbvToDbu($("#db-v").value);
    if (u !== null) { $("#db-u").value = u; $("#db-out").innerHTML = '<b>' + u + ' dBu</b> · <b>' + $("#db-v").value + ' dBV</b>'; }
    else { $("#db-out").innerHTML = '<span class="err">Enter a number.</span>'; }
  } else {
    const v = dbuToDbv($("#db-u").value);
    if (v !== null) { $("#db-v").value = v; $("#db-out").innerHTML = '<b>' + $("#db-u").value + ' dBu</b> · <b>' + v + ' dBV</b>'; }
    else { $("#db-out").innerHTML = '<span class="err">Enter a number.</span>'; }
  }
}
$("#db-u").addEventListener("input", () => dbuvRender("dbu"));
$("#db-v").addEventListener("input", () => dbuvRender("dbv"));

// ---- Speaker load (mixed series/parallel) ----
function spkRender() {
  const amp = $("#sz-amp").value;
  const r = speakerNetwork($("#sz-list").value, amp === "" ? null : amp);
  const el = $("#sz-viz");
  if (!r) { $("#sz-out").innerHTML = '<span class="err">Write it like: 8+8, 8+8 (series pairs in parallel) or 8, 8, 4</span>'; el.innerHTML = ""; return; }
  $("#sz-out").innerHTML = 'Total load <b>' + r.total + ' Ω</b> across ' + r.boxes +
    (r.boxes === 1 ? ' box' : ' boxes') + ' in ' + r.groups.length + (r.groups.length === 1 ? ' group' : ' groups') +
    (r.groups[0].watts !== undefined ? ' · per group: <b>' + r.groups.map(g => g.watts + ' W').join(" / ") + '</b>' : '') +
    (r.total < 4 ? ' <span class="err">below 4 Ω — check the amp rating</span>' : '');
  // Picture: each parallel group is a series chain hanging between the rails.
  const n = Math.min(r.groups.length, 5), W = 320, maxLen = Math.max.apply(null, r.groups.map(g => g.zs.length));
  const H = 34 + Math.min(maxLen, 4) * 30 + 14;
  const colW = (W - 40) / n;
  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img">' +
    '<line x1="10" y1="12" x2="' + (W - 10) + '" y2="12" stroke="var(--dim)" stroke-width="1.5"/>' +
    '<line x1="10" y1="' + (H - 10) + '" x2="' + (W - 10) + '" y2="' + (H - 10) + '" stroke="var(--dim)" stroke-width="1.5"/>';
  for (let k = 0; k < n; k++) {
    const cx = 20 + colW * k + colW / 2;
    const g = r.groups[k];
    const m = Math.min(g.zs.length, 4);
    const step = (H - 46) / m;
    svg += '<line x1="' + cx + '" y1="12" x2="' + cx + '" y2="' + (H - 10) + '" stroke="var(--dim)"/>';
    for (let j = 0; j < m; j++) {
      const y = 22 + j * step;
      const label = g.zs[j] + 'Ω' + (g.perBox && m === g.zs.length ? ' ' + g.perBox[j] + 'W' : '');
      svg += '<rect x="' + (cx - 27) + '" y="' + y + '" width="54" height="' + Math.min(24, step - 4) + '" rx="4" fill="var(--panel)" stroke="var(--accent)"/>' +
        '<text x="' + cx + '" y="' + (y + Math.min(24, step - 4) / 2 + 4) + '" text-anchor="middle" fill="var(--ink)" font-size="10" font-family="monospace">' + label + '</text>';
    }
    if (g.zs.length > 4) svg += '<text x="' + cx + '" y="' + (H - 14) + '" text-anchor="middle" fill="var(--dimmer)" font-size="9" font-family="monospace">+' + (g.zs.length - 4) + '</text>';
  }
  if (r.groups.length > 5) svg += '<text x="' + (W - 12) + '" y="' + (H - 14) + '" text-anchor="end" fill="var(--dimmer)" font-size="10" font-family="monospace">+' + (r.groups.length - 5) + ' groups</text>';
  el.innerHTML = svg + '</svg>';
}
for (const id of ["sz-list", "sz-amp"]) $("#" + id).addEventListener("input", spkRender);

function parseList(s) {
  return String(s).split(/[\s,]+/).filter(Boolean).map(Number);
}

// ---- Latency budget ----
function latRender() {
  const stages = parseList($("#lt-list").value);
  const r = processingDelay(stages);
  const el = $("#lt-viz");
  if (!r) { $("#lt-out").innerHTML = '<span class="err">List stage delays like: 0.9, 2.1, 1.5</span>'; el.innerHTML = ""; return; }
  $("#lt-out").innerHTML = 'Total <b>' + r.totalMs + ' ms</b> · ' + r.samples48k + ' smp @48k · ' +
    r.samples96k + ' smp @96k · ≈<b>' + r.meters + ' m</b> (' + r.feet + ' ft) of arrival offset';
  const W = 320, H = 46;
  let x = 10, s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img">';
  const usable = W - 20, total = r.totalMs || 1;
  const cols = ["var(--accent)", "var(--accent2)", "var(--ok)", "var(--warn)"];
  stages.forEach((st, k) => {
    const w = Math.max(2, st / total * usable);
    s += '<rect x="' + x + '" y="12" width="' + (w - 2) + '" height="16" rx="3" fill="' + cols[k % cols.length] + '" opacity="0.85"/>' +
         (w > 26 ? '<text x="' + (x + w / 2 - 1) + '" y="40" text-anchor="middle" fill="var(--dimmer)" font-size="10" font-family="monospace">' + st + '</text>' : '');
    x += w;
  });
  el.innerHTML = s + '</svg>';
}
$("#lt-list").addEventListener("input", latRender);

// The original render listeners were bound by reference, so the visuals get
// their own listeners on the same inputs rather than monkey-patching.
for (const id of ["bm-t", "bm-a", "bm-cd"]) $("#" + id).addEventListener("input", drawBeam);
for (const id of ["pw-w", "pw-v", "pw-ph", "pw-pf"]) $("#" + id).addEventListener("input", drawPowerMeter);
for (const id of ["lw-w", "lw-h", "lw-p"]) $("#" + id).addEventListener("input", drawLedPreview);

// ---- Projector throw ----
const thKeys = ["d", "w", "r"];
let thEdited = [];
function thRender() {
  if (thEdited.length < 2) { $("#th-out").textContent = "Enter any two values."; return; }
  const map = { d: "distance", w: "width", r: "ratio" };
  const args = {};
  for (const k of thEdited) args[map[k]] = $("#th-" + k).value;
  const r = throwRatio(args);
  if (!r) { $("#th-out").innerHTML = '<span class="err">Both knowns must be positive numbers.</span>'; return; }
  $("#th-out").innerHTML = 'Distance <b>' + r.distance + ' m</b> · width <b>' + r.width + ' m</b> · ratio <b>' + r.ratio + ':1</b>';
}
for (const k of thKeys) {
  $("#th-" + k).addEventListener("input", () => {
    if ($("#th-" + k).value === "") { thEdited = thEdited.filter((x) => x !== k); }
    else { thEdited = thEdited.filter((x) => x !== k); thEdited.push(k); if (thEdited.length > 2) thEdited.shift(); }
    thRender();
  });
}

// ---- Screen brightness ----
function scrRender() {
  const r = screenLuminance($("#sc-lm").value, $("#sc-w").value, $("#sc-h").value, $("#sc-g").value);
  if (!r) { $("#sc-out").innerHTML = '<span class="err">Lumens, size and gain must be positive.</span>'; return; }
  const vsDci = r.nits >= 48 ? 'meets' : 'below';
  $("#sc-out").innerHTML = '<b>' + r.lux + ' lx</b> on screen · <b>' + r.fl + ' fL</b> · <b>' + r.nits +
    ' cd/m²</b> (' + vsDci + ' the 48 cd/m² DCI dark-room reference) · ' + r.areaM2 + ' m²';
}
for (const id of ["sc-lm", "sc-w", "sc-h", "sc-g"]) $("#" + id).addEventListener("input", scrRender);

// ---- Relay logic matrix ----
function relayRender() {
  const r = relayLogic($("#rl-rules").value);
  const host = $("#rl-table");
  if (!r) {
    $("#rl-out").innerHTML = '<span class="err">Rules look like: MAIN = GO &amp; !ESTOP - up to 5 inputs, 6 rules, no output on the right-hand side.</span>';
    host.innerHTML = "";
    return;
  }
  $("#rl-out").innerHTML = r.inputs.length + ' inputs · ' + r.outputs.length + ' outputs · ' + r.rows.length + ' states';
  const mark = (v) => v ? '<td class="on">1</td>' : '<td class="off">0</td>';
  const markOut = (v, first) => v ? '<td class="on' + (first ? ' outcol' : '') + '">✓</td>' : '<td class="off' + (first ? ' outcol' : '') + '">·</td>';
  host.innerHTML = '<table class="tt"><tr>' +
    r.inputs.map((n) => '<th>' + n + '</th>').join('') +
    r.outputs.map((n, i) => '<th' + (i === 0 ? ' class="outcol"' : '') + '>' + n + '</th>').join('') + '</tr>' +
    r.rows.map((row) => '<tr>' + row.in.map(mark).join('') + row.out.map((v, i) => markOut(v, i === 0)).join('') + '</tr>').join('') +
    '</table>';
}
$("#rl-rules").addEventListener("input", relayRender);


dmxRender(false);
dipRenderFromAddress();
dbuvRender("dbu");
delayRender();
tcRenderFromFields();
powerRender();
beamRender();
ledRender();
rfRender();
drawBeam();
drawPowerMeter();
drawLedPreview();
ohmRender();
spkRender();
latRender();
thRender();
scrRender();
relayRender();
`

  return shell({
    title: 'Field tools — DMX, delay, timecode, power, audio levels and speaker calculators | showstack',
    description: 'The calculators technicians use daily: DMX address, DIP switches, speaker delay and mixed impedance, timecode, relay logic, dBu/dBV and SPL weighting reference, power load, Ohm’s law, latency budget, beam photometrics, LED wall, projector throw and screen brightness, RF wavelength. Free, offline, tested arithmetic.',
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
      featureList: 'DMX address calculator, sACN multicast calculator, Art-Net port-address, DIP switch calculator, speaker delay calculator, drop-frame timecode converter, relay logic truth table, dBu/dBV line-level converter, SPL weighting (dBA/dBZ) reference, impedance vs resistance reference, power load calculator, Ohm law calculator, mixed series parallel speaker impedance calculator, latency budget calculator, beam angle and photometrics calculator, LED wall resolution calculator, projector throw ratio calculator, screen brightness foot-lambert calculator, RF wavelength calculator',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
