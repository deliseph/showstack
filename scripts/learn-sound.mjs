/**
 * /learn/sound/ — the four things a system engineer is actually doing.
 *
 * Measurement, alignment, array behaviour and the inverse square law are
 * usually taught separately, and they are the same subject: sound takes time
 * to travel and loses level as it goes, and every tool in the discipline
 * exists because of those two facts.
 *
 * The delay figure is interactive for a reason. Reading "delay the near
 * speaker by the difference in path length" teaches nothing; dragging the
 * delay until two wavefronts land together teaches it in one go.
 */
import { speakerDelay, splAtDistance } from './toolmath.mjs'
import { LEARN_CSS, sec, rule, bites, fig, learnNav } from './learn-kit.mjs'

const MATH_SRC = [speakerDelay, splAtDistance].map((f) => f.toString()).join('\n\n')

export function learnSoundPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* the two arrivals, so that "they land together" is something you can watch */
@keyframes arr-main{0%{transform:translateX(0);opacity:0}8%{opacity:.85}
84%{transform:translateX(492px);opacity:.85}96%,100%{opacity:0}}
@keyframes arr-dly{0%,26%{transform:translateX(0);opacity:0}32%{opacity:.85}
84%{transform:translateX(190px);opacity:.85}96%,100%{opacity:0}}
.wavepair .fa{animation:arr-main 2.8s linear infinite}
.wavepair .fb{animation:arr-dly 2.8s linear infinite}
/* the difference is the shape of the wavefront, which only reads when it moves */
@keyframes sph{0%{r:14;opacity:.9}100%{r:118;opacity:0}}
@keyframes cyl{0%{transform:translateX(0) scaleY(1);opacity:.9}
100%{transform:translateX(110px) scaleY(1.28);opacity:0}}
.ptfig .wf{animation:sph 2.4s ease-out infinite}
.arrfig .wf{animation:cyl 2.4s ease-out infinite;transform-origin:178px 70px}
.spreadfig .w1{animation-delay:.8s}
.spreadfig .w2{animation-delay:1.6s}
@keyframes ring-out{0%{r:6;opacity:.85}100%{r:120;opacity:0}}
.isq circle.ring{animation:ring-out 3s ease-out infinite;fill:none;stroke:var(--accent);stroke-width:2}
.isq circle.ring:nth-of-type(2){animation-delay:1s}
.isq circle.ring:nth-of-type(3){animation-delay:2s}
.wavepair .wf{transition:transform .25s ease}
`

  // ---- inverse square law: expanding wavefronts + a level scale ----------
  const isqFig = `
<svg viewBox="0 0 620 190" role="img" class="isq">
  <line x1="60" y1="150" x2="600" y2="150" stroke="var(--line)" stroke-width="1.5"/>
  <circle class="ring" cx="60" cy="95" r="6"/>
  <circle class="ring" cx="60" cy="95" r="6"/>
  <circle class="ring" cx="60" cy="95" r="6"/>
  <rect x="46" y="80" width="28" height="30" rx="4" fill="var(--accent)"/>
  ${[1, 2, 4, 8, 16].map((d, i) => {
    const x = 60 + i * 132
    return `<line x1="${x}" y1="144" x2="${x}" y2="156" stroke="var(--dimmer)" stroke-width="1.5"/>` +
      `<text x="${x}" y="172" class="lbl" text-anchor="middle">${d} m</text>` +
      `<text x="${x}" y="134" class="val" text-anchor="middle" font-size="11">${(100 - 20 * Math.log10(d)).toFixed(1)}</text>`
  }).join('')}
  <text x="600" y="172" class="lbl" text-anchor="end">dB SPL from a source measured at 100 dB @ 1 m</text>
</svg>`

  // ---- delay alignment ---------------------------------------------------
  const delayFig = `
<svg viewBox="0 0 620 200" role="img" class="wavepair">
  <rect x="18" y="34" width="34" height="46" rx="5" fill="var(--panel)" stroke="var(--accent)" stroke-width="2"/>
  <text x="35" y="98" class="lbl" text-anchor="middle">MAIN</text>
  <rect x="330" y="34" width="30" height="46" rx="5" fill="var(--panel)" stroke="var(--accent2)" stroke-width="2"/>
  <text x="345" y="98" class="lbl" text-anchor="middle">DELAY</text>
  <g class="fa"><rect x="54" y="44" width="5" height="38" rx="2.5" fill="var(--accent)"/></g>
  <g class="fb"><rect x="362" y="44" width="5" height="38" rx="2.5" fill="var(--accent2)"/></g>
  <rect x="546" y="40" width="26" height="34" rx="13" fill="var(--dimmer)"/>
  <text x="559" y="98" class="lbl" text-anchor="middle">EAR</text>
  <line x1="52" y1="57" x2="546" y2="57" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 4"/>
  <g class="wf" id="wf-main">
    <path d="M0 150 q 13 -22 26 0 t 26 0 t 26 0 t 26 0" fill="none" stroke="var(--accent)" stroke-width="2.5" transform="translate(60,0)"/>
  </g>
  <g class="wf" id="wf-delay">
    <path d="M0 182 q 13 -22 26 0 t 26 0 t 26 0 t 26 0" fill="none" stroke="var(--accent2)" stroke-width="2.5" transform="translate(60,0)"/>
  </g>
  <text x="18" y="140" class="lbl">main arrives</text>
  <text x="18" y="196" class="lbl">delay speaker arrives</text>
</svg>`

  const arrayFig = (kind) => {
    const isArray = kind === 'array'
    return `
<svg viewBox="0 0 300 190" role="img" class="${isArray ? 'arrfig' : 'ptfig'} spreadfig">
  ${isArray
    ? `${[...Array(6)].map((_, i) => `<rect x="140" y="${22 + i * 15}" width="26" height="13" rx="2" fill="var(--panel)" stroke="var(--accent)" stroke-width="1.5"/>`).join('')}
       <path d="M166 28 L286 88 L286 128 L166 112 Z" fill="var(--accent)" opacity=".16"/>
       <path d="M166 28 L286 88" stroke="var(--accent)" stroke-width="1.5" opacity=".7"/>
       <path d="M166 112 L286 128" stroke="var(--accent)" stroke-width="1.5" opacity=".7"/>
       <text x="150" y="180" class="lbl" text-anchor="middle">−3 dB per doubling, near field</text>`
    : `<rect x="140" y="60" width="30" height="40" rx="4" fill="var(--panel)" stroke="var(--accent2)" stroke-width="1.5"/>
       <path d="M170 62 L286 20 L286 148 L170 98 Z" fill="var(--accent2)" opacity=".16"/>
       <path d="M170 62 L286 20" stroke="var(--accent2)" stroke-width="1.5" opacity=".7"/>
       <path d="M170 98 L286 148" stroke="var(--accent2)" stroke-width="1.5" opacity=".7"/>
       <text x="150" y="180" class="lbl" text-anchor="middle">−6 dB per doubling</text>`}
  ${[0, 1, 2].map((i) => isArray
    ? `<rect class="wf w${i}" x="176" y="34" width="4" height="72" rx="2" fill="var(--accent)"/>`
    : `<circle class="wf w${i}" cx="170" cy="80" r="14" fill="none" stroke="var(--accent2)" stroke-width="2"/>`).join('')}
  <text x="10" y="16" class="lbl">${isArray ? 'line array — cylindrical spread' : 'point source — spherical spread'}</text>
</svg>`
  }

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / sound</div>
${learnNav(esc, 'sound')}
<div class="lhero">
  <h2>Measuring and aligning sound</h2>
  <p class="lede">Sound takes time to travel and loses level on the way. Nearly every decision a system engineer makes follows from those two sentences.</p>
</div>

${S('The physics underneath', 'The inverse square law, and why it is 6 dB', [
  'A source radiates into an expanding sphere. Double the distance and the same energy is spread over four times the area, so intensity drops to a quarter. A quarter of the power is <b>−6 dB</b>, and that is the whole rule: every doubling of distance costs 6 dB.',
  'This is why a spec sheet figure is meaningless without its measurement distance. "This box does 100 dB" is not a claim until someone says at what distance — 100 dB at 1 m is 70 dB by 30 m.',
])}

${fig(isqFig, 'Every doubling of distance from the source costs 6 dB. The figures above are a source measured at 100 dB at 1 m.')}

<div class="tryit">
  <div class="f"><label for="isq-l">Level at reference (dB)</label><input id="isq-l" type="number" value="100" inputmode="decimal" style="width:120px"></div>
  <div class="f"><label for="isq-r">Reference distance (m)</label><input id="isq-r" type="number" value="1" min="0.1" step="0.1" inputmode="decimal" style="width:130px"></div>
  <div class="f"><label for="isq-d">Distance to listener (m)</label><input id="isq-d" type="number" value="30" min="0.1" step="0.5" inputmode="decimal" style="width:150px"></div>
</div>
<div class="readout" id="isq-out" role="status" aria-live="polite"></div>

${rule('Free field only. Indoors, reflections refill part of the loss — so 6 dB per doubling is the <b>worst case for coverage and the safe case for neighbour noise</b>, not what a meter will read in a real room.')}

${S('Because sound is slow', 'How to time-align a delay speaker', [
  'Sound travels about 343 m/s at 20 °C. A delay tower 40 m downstage of the main hangs is therefore hearing the mains about 117 ms after they fire — and if the tower plays at the same instant, the audience under it hears the tower first and the mains as an echo.',
  'The fix is to delay the nearer speaker by the difference in travel time, so both arrive together. Measure the physical distance between the two sources, divide by the speed of sound, and that is your delay time.',
  'Temperature matters more than people expect: the speed of sound rises roughly 0.6 m/s per °C. An alignment set in a cold empty room at 10 am can be measurably out by the time a full, warm house is in.',
])}

${fig(delayFig, 'Drag the delay below until the two wavefronts land together.')}

<div class="tryit">
  <div class="f"><label for="dl-d">Distance between sources (m)</label><input id="dl-d" type="number" value="40" min="0" step="0.5" inputmode="decimal" style="width:160px"></div>
  <div class="f"><label for="dl-t">Air temperature (°C)</label><input id="dl-t" type="number" value="20" step="1" inputmode="decimal" style="width:140px"></div>
  <div class="f"><label for="dl-set">Delay you have set (ms) — <span id="dl-setlabel">0</span></label><input id="dl-set" type="range" min="0" max="200" value="0" step="1"></div>
</div>
<div class="readout" id="dl-out" role="status" aria-live="polite"></div>

${rule('Delay time = <b>distance ÷ speed of sound</b>. Everything else — temperature, alignment position, whether you add a few ms for the precedence effect — is a refinement on that one division.')}

${bites([
  '<b>Aligning at one seat misaligns at another.</b> Alignment is a compromise across the coverage area, so the measurement position is a decision, not a convenience.',
  '<b>Many engineers add 5–15 ms beyond the physical figure.</b> The precedence effect then pulls the image back towards the stage rather than the nearby tower. That is a taste decision, not an error.',
  '<b>Processing delay is not free.</b> Every converter, DSP and network hop adds latency of its own — budget it with the <a href="/tools/#latency">latency tool</a> rather than assuming the electronics are instant.',
])}

${S('The measurement itself', 'How a transfer function is actually taken', [
  'Dual-channel FFT measurement compares two signals: a <b>reference</b> taken from the signal you are sending, and a <b>measurement</b> taken from a microphone in the room. The software divides one by the other, and what is left is what the system and the room did to the signal — magnitude, phase, and impulse response.',
  'The third trace is the one to trust first. <b>Coherence</b> says how much of what the microphone heard is actually related to the reference. Where coherence is low — because of noise, reflections, or too little energy at that frequency — the magnitude trace above it is not evidence and should not be equalised against.',
])}

${bites([
  '<b>Take the reference before the processing you want to measure.</b> A reference tapped after the EQ measures everything except the EQ.',
  '<b>Low coherence means "do not act on this".</b> It is not a display problem to be smoothed away.',
  '<b>The microphone position is the measurement.</b> Two engineers three metres apart get different and equally correct answers.',
  '<b>Fix time before frequency.</b> Find the arrival time, set the delay, then look at the magnitude — an unaligned measurement shows comb filtering that no EQ can remove.',
])}

${S('Which box, and why', 'Point source against line array', [
  'A point source radiates into a sphere: energy spreads in every direction and you get the full 6 dB per doubling. A line array, while it is long compared with the wavelength it is reproducing, radiates more like a cylinder — the energy spreads sideways but much less vertically, so the loss is closer to <b>3 dB per doubling</b> in that region.',
  'That is the entire reason arrays exist for long throws: the front row and the back of an arena can be brought within a survivable level range. It is also why arrays are wrong for short rooms — the cylindrical behaviour needs distance to develop, and a short array in a small venue is just an awkward point source.',
  'The behaviour is frequency-dependent, too. An array that is long compared with a 200 Hz wavelength may be short compared with a 40 Hz one, which is why array low end behaves differently from array high end.',
])}

<div class="figrow">
  ${fig(arrayFig('point'), 'Point source: spherical, −6 dB per doubling.')}
  ${fig(arrayFig('array'), 'Line array: cylindrical in the near field, closer to −3 dB.')}
</div>

${rule('An array buys you <b>even coverage over distance</b>, not more level. In a room too short for the near field to develop, it buys you nothing.')}

<div class="cta"><strong>Do it with real numbers.</strong>
<p><a href="/tools/#delay">Speaker delay</a> with temperature correction, <a href="/tools/#latency">latency budget</a>, <a href="/tools/#spkz">speaker impedance</a> and <a href="/tools/#dose">noise exposure dose</a> are all on the field tools page and work offline. Measurement software is indexed under <a href="/software/">software</a>.</p></div>
`

  const script = `
${MATH_SRC}
const $ = (s) => document.querySelector(s);

function isqRender(){
  const r = splAtDistance($("#isq-l").value, $("#isq-r").value, $("#isq-d").value);
  if (!r) { $("#isq-out").innerHTML = '<span class="err">Distances must be greater than zero.</span>'; return; }
  $("#isq-out").innerHTML = '<b>' + r.spl + ' dB</b> at ' + $("#isq-d").value + ' m — a loss of <b>' + r.dropDb +
    ' dB</b> over ' + r.doublings + ' doublings of distance. Free field; a real room gives some of that back.';
}
for (const id of ["#isq-l","#isq-r","#isq-d"]) $(id).addEventListener("input", isqRender);

function dlRender(){
  const d = Number($("#dl-d").value), set = Number($("#dl-set").value);
  const r = speakerDelay(d, Number($("#dl-t").value));
  $("#dl-setlabel").textContent = set;
  if (!r) { $("#dl-out").innerHTML = '<span class="err">Distance must be zero or more.</span>'; return; }
  const need = r.ms;
  const err = set - need;
  // Slide the two wavefronts apart by the timing error, ~2px per ms.
  const off = Math.max(-260, Math.min(260, err * 2));
  $("#wf-delay").style.transform = "translateX(" + off + "px)";
  const aligned = Math.abs(err) <= 1.5;
  $("#dl-out").innerHTML = 'Needs <b>' + need + ' ms</b> at ' + $("#dl-t").value + ' °C (speed of sound ' + r.speedOfSound +
    ' m/s). You have set <b>' + set + ' ms</b> — ' + (aligned
      ? '<span class="ok">aligned.</span>'
      : '<span class="err">out by ' + Math.round(Math.abs(err)) + ' ms</span>, so the ' +
        (err < 0 ? 'delay speaker arrives early and pulls the image off the stage.' : 'delay speaker arrives late and reads as an echo.'));
}
for (const id of ["#dl-d","#dl-t","#dl-set"]) $(id).addEventListener("input", dlRender);

isqRender();
dlRender();
`

  return shell({
    title: 'Measuring and aligning sound — inverse square law, delay towers, arrays | showstack',
    description: 'Why the inverse square law costs 6 dB per doubling of distance, how to time-align a delay speaker including temperature correction, how a dual-channel transfer function measurement is actually taken and why coherence matters, and what separates a point source from a line array.',
    canonical: `${SITE}/learn/sound/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Measuring and aligning sound',
      description: 'Inverse square law, delay speaker alignment, transfer function measurement, and point source versus line array behaviour.',
      url: `${SITE}/learn/sound/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
