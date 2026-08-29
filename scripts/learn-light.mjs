/**
 * /learn/light/ — estimating a beam before it is in the air, and the
 * assumptions a projection blend quietly rests on.
 *
 * Two things get guessed on site that are cheap to calculate in advance: how
 * big a beam will actually be when it lands, and whether two projectors can
 * be made to look like one image. The first is trigonometry. The second is
 * mostly about black level, which is the one thing a blend cannot fix and the
 * one thing nobody checks until the content goes dark.
 */
import { beamDiameter, illuminance, throwRatio } from './toolmath.mjs'
import { LEARN_CSS, sec, rule, bites, fig, learnNav } from './learn-kit.mjs'

const MATH_SRC = [beamDiameter, illuminance, throwRatio].map((f) => f.toString()).join('\n\n')

export function learnLightPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* A beam only reads as a beam when there is something in the air, and a blend
   only reveals itself as the overlap is worked. Both animate for that reason
   rather than for decoration. */
@keyframes haze{0%{transform:translate(0,0);opacity:0}12%{opacity:.5}
78%{transform:translate(var(--hx,150px),var(--hy,-18px));opacity:.5}92%,100%{opacity:0}}
.beamfig .mote{animation:haze 5s linear infinite}
${[...Array(7)].map((_, i) => `.beamfig .m${i}{animation-delay:${(i * 0.7).toFixed(1)}s}`).join('')}
@keyframes ovbreathe{0%,100%{opacity:.22}50%{opacity:.5}}
.blendfig .ovzone{animation:ovbreathe 3.4s ease-in-out infinite}
.beamfig .cone{transition:d .2s ease}
.blendfig .ovl{transition:opacity .3s ease}
.blendfig.showblack .blackband{opacity:1}
.blendfig .blackband{opacity:0;transition:opacity .3s ease}
`

  // ---- beam vs field angle ------------------------------------------------
  const angleFig = `
<svg viewBox="0 0 620 240" role="img" class="beamfig">
  ${[...Array(7)].map((_, i) => `<circle class="mote m${i}" cx="${110 + i * 62}" cy="${96 + (i % 3) * 26}" r="${1.8 + (i % 3) * 0.7}"
    fill="var(--accent2)" style="--hx:${120 + i * 14}px;--hy:${-10 - (i % 4) * 9}px"/>`).join('')}
  <defs>
    <linearGradient id="beamgrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="var(--accent2)" stop-opacity=".55"/>
      <stop offset="100%" stop-color="var(--accent2)" stop-opacity=".12"/>
    </linearGradient>
  </defs>
  <rect x="16" y="104" width="34" height="32" rx="4" fill="var(--panel)" stroke="var(--line)" stroke-width="1.5"/>
  <path id="bf-field" d="M50 120 L560 40 L560 200 Z" fill="url(#beamgrad)" opacity=".45"/>
  <path id="bf-beam" d="M50 120 L560 76 L560 164 Z" fill="var(--accent2)" opacity=".3"/>
  <line id="bf-fl1" x1="50" y1="120" x2="560" y2="40" stroke="var(--accent2)" stroke-width="1.2" stroke-dasharray="5 5" opacity=".8"/>
  <line id="bf-fl2" x1="50" y1="120" x2="560" y2="200" stroke="var(--accent2)" stroke-width="1.2" stroke-dasharray="5 5" opacity=".8"/>
  <line id="bf-bl1" x1="50" y1="120" x2="560" y2="76" stroke="var(--accent2)" stroke-width="2"/>
  <line id="bf-bl2" x1="50" y1="120" x2="560" y2="164" stroke="var(--accent2)" stroke-width="2"/>
  <line x1="560" y1="20" x2="560" y2="220" stroke="var(--line)" stroke-width="2"/>
  <text x="612" y="66" class="lbl" text-anchor="end">10% — field</text>
  <text x="612" y="104" class="lbl" text-anchor="end">50% — beam</text>
  <text x="574" y="126" class="lbl">centre</text>
  <text x="60" y="228" class="lbl">fixture</text>
  <text x="556" y="234" class="lbl" text-anchor="end">the surface it lands on</text>
</svg>`

  // ---- projection blend ---------------------------------------------------
  const blendFig = `
<svg viewBox="0 0 620 250" role="img" class="blendfig" id="blend-fig">
  <rect x="30" y="24" width="26" height="34" rx="4" fill="var(--panel)" stroke="var(--line)" stroke-width="1.5"/>
  <rect x="564" y="24" width="26" height="34" rx="4" fill="var(--panel)" stroke="var(--line)" stroke-width="1.5"/>
  <path d="M56 41 L96 150 L392 150 L56 41 Z" fill="var(--accent)" opacity=".18"/>
  <rect class="ovzone" x="240" y="150" width="164" height="60" fill="var(--accent2)"/>
  <path d="M564 41 L524 150 L228 150 L564 41 Z" fill="var(--dom-audio)" opacity=".18"/>
  <rect x="96" y="150" width="428" height="72" rx="3" fill="var(--panel)" stroke="var(--line)"/>
  <rect x="228" y="150" width="164" height="72" fill="var(--accent)" opacity=".14" class="ovl"/>
  <rect x="228" y="150" width="164" height="72" fill="#fff" opacity="0" class="blackband"/>
  <text x="310" y="192" class="lbl" text-anchor="middle" id="blend-lbl">overlap — the blend region</text>
  <text x="160" y="240" class="lbl" text-anchor="middle">projector A</text>
  <text x="460" y="240" class="lbl" text-anchor="middle">projector B</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / light</div>
${learnNav(esc, 'light')}
<div class="lhero">
  <h2>Estimating beams and blends</h2>
  <p class="lede">Two things get guessed on site that are cheap to work out beforehand: how big a beam will be when it lands, and whether two projectors can be made to look like one picture.</p>
</div>

${S('First, read the data sheet properly', 'Beam angle is not field angle', [
  'A fixture does not project a hard-edged cone; intensity falls off from the centre outwards. So "how wide is the beam" needs a definition of where the beam stops, and the industry uses two.',
  '<b>Beam angle</b> is measured where intensity has fallen to <b>50%</b> of the centre. <b>Field angle</b> is where it has fallen to <b>10%</b>. Field angle is always the larger number — usually a good deal larger — and it is closer to what your eye reads as the edge of the light.',
  'This is why comparing two fixtures on a single quoted figure is a trap. A data sheet quoting only "beam" makes the fixture sound tighter than it looks in a room; one quoting only "field" makes it sound wider than its useful centre.',
])}

${fig(angleFig, 'The same fixture, two definitions. Solid lines are the 50% beam angle; dashed lines are the 10% field angle.')}

<div class="tryit">
  <div class="f"><label for="bm-t">Throw distance (m)</label><input id="bm-t" type="number" value="12" min="0.5" step="0.5" inputmode="decimal" style="width:150px"></div>
  <div class="f"><label for="bm-b">Beam angle — <span id="bm-blabel">19°</span></label><input id="bm-b" type="range" min="4" max="70" value="19"></div>
  <div class="f"><label for="bm-f">Field angle — <span id="bm-flabel">36°</span></label><input id="bm-f" type="range" min="4" max="110" value="36"></div>
</div>
<div class="readout" id="bm-out" role="status" aria-live="polite"></div>

${rule('Diameter = <b>2 × throw × tan(angle ÷ 2)</b>. Same formula for either angle — what changes is which definition of "edge" you fed it.')}

${bites([
  '<b>Field angle is always larger than beam angle.</b> If a spec sheet quotes one number and calls it both, it is quoting the flattering one.',
  '<b>Zoom range is quoted at the extremes.</b> A 7–50° fixture is not evenly useful across that range; optical quality and output usually fall off at one end.',
  '<b>Intensity falls with the square of distance.</b> Doubling the throw quarters the illuminance — the same inverse square law as <a href="/learn/sound/">sound</a>, for the same reason.',
  '<b>Beam size is not coverage.</b> A beam that reaches the back wall does not mean a face at the back is lit to a usable level. Check the lux, not just the circle.',
])}

${S('Sizing it before it is rigged', 'How to estimate a beam on paper', [
  'The calculation needs two numbers you already have: the throw distance from the fixture to the surface, and the angle from the data sheet. Everything else is one line of trigonometry — the beam is an isosceles triangle, and you are solving for its base.',
  'For a fixture at an angle rather than square-on, the beam lands as an ellipse rather than a circle and gets larger; the figure above is the square-on case, which is the useful planning number and slightly conservative for anything raked.',
])}

${S('Video', 'What a projection blend actually assumes', [
  'Edge blending overlaps two projected images and ramps each one down across the overlap, so the two add up to a single even brightness. The maths of the ramp is the easy part. What decides whether the blend is invisible is a set of assumptions nobody writes down.',
  'The big one is <b>black level</b>. In the overlap, both projectors are putting up their black floor at once — and a projector\'s black is never truly black. Two blacks add, so the blend band is measurably lighter than the rest of the image. On bright content it is invisible; on a dark scene it is a glowing stripe down the middle, and no ramp adjustment can remove it because there is nothing to ramp down.',
])}

${fig(blendFig, 'Two projectors, one image. Toggle below to see what dark content does to the overlap.')}

<div class="tryit">
  <div class="f"><label>Content</label>
    <span class="seg" role="group">
      <button type="button" id="bl-bright" aria-pressed="true">Bright content</button>
      <button type="button" id="bl-dark" aria-pressed="false">Dark content</button>
    </span>
  </div>
</div>
<div class="readout" id="bl-out" role="status" aria-live="polite"></div>

${bites([
  '<b>Black level cannot be blended away.</b> Plan for it: design content that avoids full black across the seam, or specify projectors with a better native contrast ratio.',
  '<b>Lamp or laser age changes brightness and colour.</b> Two identical projectors of different ages will not match, and the difference shows exactly at the seam.',
  '<b>The blend needs overlap to live in.</b> Roughly 10–25% of image width is normal — too little leaves no room for the ramp or for alignment tolerance.',
  '<b>Geometry has to stay put.</b> A projector nudged by a ladder, or a truss that moves as the room warms, ruins a blend that was perfect at 2am.',
  '<b>Match the colour before the geometry.</b> Aligning a blend between two projectors on different colour settings wastes the alignment when you then correct the colour.',
])}

${rule('A blend hides a <b>seam in brightness</b>, not a difference in black level, colour or geometry. Fix those first — the ramp is the last step, not the fix.')}

<div class="cta"><strong>Run the numbers.</strong>
<p><a href="/tools/#beam">Beam &amp; throw</a> for diameter and lux, <a href="/tools/#throw">projector throw ratio</a>, <a href="/tools/#screen">screen brightness</a> and the <a href="/tools/#led">LED wall resolution</a> tool are on the field tools page. Fixture safety standards are indexed under <a href="/standards/iec-60598-2-17/">IEC 60598-2-17</a> and <a href="/standards/ul-1573/">UL 1573</a>.</p></div>
`

  const script = `
${MATH_SRC}
const $ = (s) => document.querySelector(s);

function bmRender(){
  const t = Number($("#bm-t").value);
  const beam = Number($("#bm-b").value), field = Number($("#bm-f").value);
  $("#bm-blabel").textContent = beam + "°";
  $("#bm-flabel").textContent = field + "°";
  const b = beamDiameter(t, beam), f = beamDiameter(t, field);
  if (!b || !f) { $("#bm-out").innerHTML = '<span class="err">Throw must be greater than zero.</span>'; return; }

  // Redraw the cone. 510px of SVG is the throw; scale metres to pixels so the
  // wider of the two angles always fits the 200px-tall figure.
  const px = 510, cy = 120;
  const half = (deg) => Math.tan((deg * Math.PI / 180) / 2) * px;
  const scale = Math.min(1, 96 / Math.max(half(field), 1));
  const hb = half(beam) * scale, hf = half(field) * scale;
  $("#bf-beam").setAttribute("d", "M50 " + cy + " L560 " + (cy - hb) + " L560 " + (cy + hb) + " Z");
  $("#bf-field").setAttribute("d", "M50 " + cy + " L560 " + (cy - hf) + " L560 " + (cy + hf) + " Z");
  $("#bf-bl1").setAttribute("y2", cy - hb); $("#bf-bl2").setAttribute("y2", cy + hb);
  $("#bf-fl1").setAttribute("y2", cy - hf); $("#bf-fl2").setAttribute("y2", cy + hf);

  const warn = field <= beam
    ? ' <span class="err">Field angle should be larger than beam angle — check which figure the data sheet is quoting.</span>' : '';
  $("#bm-out").innerHTML = 'At ' + t + ' m: <b>' + b.diameter + ' m</b> across at the 50% beam angle, <b>' +
    f.diameter + ' m</b> at the 10% field angle. The eye reads the edge closer to the larger figure.' + warn;
}
for (const id of ["#bm-t","#bm-b","#bm-f"]) $(id).addEventListener("input", bmRender);

function blSet(dark){
  $("#blend-fig").classList.toggle("showblack", dark);
  $("#bl-dark").setAttribute("aria-pressed", String(dark));
  $("#bl-bright").setAttribute("aria-pressed", String(!dark));
  $("#blend-lbl").textContent = dark ? "two black floors, added" : "overlap — the blend region";
  $("#bl-out").innerHTML = dark
    ? '<span class="err">Both projectors are lighting the overlap with their black floor at once.</span> Two blacks add, so the band reads lighter than the rest of the image — and there is nothing to ramp down, so no blend setting removes it.'
    : '<span class="ok">On bright content the blend is invisible.</span> Each projector ramps down across the overlap and the two sum to the same brightness as the rest of the image.';
}
$("#bl-dark").addEventListener("click", () => blSet(true));
$("#bl-bright").addEventListener("click", () => blSet(false));

bmRender();
blSet(false);
`

  return shell({
    title: 'Estimating beams and blends — beam vs field angle, projection blending | showstack',
    description: 'Why beam angle (50%) and field angle (10%) describe the same fixture differently, how to estimate a beam diameter before it is rigged, and the assumptions a projection edge blend depends on — including why black level is the one thing blending cannot fix.',
    canonical: `${SITE}/learn/light/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Estimating beams and blends',
      description: 'Beam angle versus field angle, estimating beam diameter, and what a projection blend assumes.',
      url: `${SITE}/learn/light/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
