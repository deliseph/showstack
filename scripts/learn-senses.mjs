/**
 * /learn/senses/ — how each sense actually tells things apart.
 *
 * /learn/perception/ has the thresholds, /learn/neuro/ has the signal model,
 * /learn/emotion/ has what gets built out of it. This one is the missing
 * middle: the actual discrimination mechanism in each channel. How two ears
 * turn a delay into a direction. How three overlapping cone responses become
 * a colour that is not in the light. How a receptor that cannot tell chilli
 * from heat makes a pepper feel hot.
 *
 * The unifying claim, and the reason the page exists at all: no sense
 * measures the world. Every one of them takes a handful of broadly tuned,
 * overlapping detectors and INFERS the answer from the pattern across them.
 * That is the same logic as sensor fusion on /learn/systems/ and metamerism
 * on /learn/perception/, arriving from the biological side - which is the
 * connection the user asked for and the one worth making explicit.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'
import { visualAcuity, interauralDelay } from './toolmath.mjs'

const MATH_SRC = [visualAcuity, interauralDelay].map((f) => f.toString()).join('\n\n')


export function learnSensesPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* two ears, one sound, a delay between them */
@keyframes earwave{0%{transform:translateX(0);opacity:0}8%{opacity:.85}
78%{transform:translateX(var(--run,200px));opacity:.85}90%,100%{opacity:0}}
.earfig .wl{animation:earwave 2.6s linear infinite}
.earfig .wr{animation:earwave 2.6s linear infinite;animation-delay:.24s}
.earfig .head{animation:l-breathe 2.6s ease-in-out infinite}
/* three cones, overlapping, and the colour that comes out of the pattern */
@keyframes conehit{0%,100%{opacity:.3}22%,44%{opacity:1}}
.conefig .c1{animation:conehit 5.4s ease-in-out infinite}
.conefig .c2{animation:conehit 5.4s ease-in-out infinite;animation-delay:1.8s}
.conefig .c3{animation:conehit 5.4s ease-in-out infinite;animation-delay:3.6s}
/* warm and cold receptors reporting change, not level */
@keyframes tempramp{0%,100%{transform:translateY(0)}50%{transform:translateY(-34px)}}
@keyframes fireonchange{0%,100%{opacity:.2}18%,32%{opacity:1}68%,82%{opacity:1}}
.tempfig .line{animation:tempramp 5s ease-in-out infinite}
.tempfig .spike{animation:fireonchange 5s ease-in-out infinite}
/* masking: a loud tone hiding its neighbours */
@keyframes maskgrow{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
.maskfig .masker{animation:maskgrow 4s ease-in-out infinite;transform-origin:bottom}
@keyframes fadeunder{0%,100%{opacity:1}50%{opacity:.12}}
.maskfig .hidden{animation:fadeunder 4s ease-in-out infinite}
/* the interactive localisation head */
.headbox{position:relative;aspect-ratio:1.6;max-width:460px;margin:14px auto 0;border:1px solid var(--line);
border-radius:var(--r-md);background:var(--panel);overflow:hidden;touch-action:none;cursor:crosshair}
.headbox svg{position:absolute;inset:0;width:100%;height:100%}
/* frequency-range strip */
.ranges{margin:16px 0}
.rrow{display:grid;grid-template-columns:minmax(96px,150px) 1fr;gap:12px;align-items:center;padding:7px 0;
border-bottom:1px solid var(--line)}
.rrow:last-child{border-bottom:none}
.rrow .n{font-size:14px;color:var(--ink)}
.rrow .n em{display:block;font-style:normal;font-family:var(--mono);font-size:10.5px;color:var(--dimmer);margin-top:2px}
.rrow .track{position:relative;height:14px;background:var(--panel2);border-radius:7px}
.rrow .track i{position:absolute;top:0;bottom:0;border-radius:7px;opacity:.85}
/* sense cards */
.sens2{display:grid;grid-template-columns:repeat(auto-fit,minmax(248px,1fr));gap:14px;margin:18px 0}
.sens2 > div{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:16px;
border-top:3px solid var(--accent)}
.sens2 > div:nth-child(2){border-top-color:var(--accent2)}
.sens2 > div:nth-child(3){border-top-color:var(--dom-control)}
.sens2 > div:nth-child(4){border-top-color:var(--ok)}
.sens2 h4{margin:0 0 8px;font-size:15.5px;font-family:var(--sans);text-transform:none;letter-spacing:-.1px;
color:var(--ink);font-weight:650}
.sens2 p{margin:0 0 9px;color:var(--dim);font-size:13.7px;line-height:1.58}
.sens2 p:last-child{margin-bottom:0}
.sens2 .use{font-family:var(--mono);font-size:11px;color:var(--dimmer);border-top:1px solid var(--line);
padding-top:9px;margin-top:10px;line-height:1.6}
`

  const earFig = `
<svg viewBox="0 0 460 190" role="img" class="earfig" style="--run:200px">
  <circle class="head" cx="300" cy="96" r="42" fill="var(--panel2)" stroke="var(--line)" stroke-width="1.6"/>
  <circle cx="262" cy="82" r="7" fill="var(--accent)"/>
  <circle cx="338" cy="82" r="7" fill="var(--accent2)"/>
  <text x="262" y="66" class="lbl" font-size="9" text-anchor="middle" fill="var(--accent)">near ear</text>
  <text x="338" y="66" class="lbl" font-size="9" text-anchor="middle" fill="var(--accent2)">far ear</text>
  <circle cx="46" cy="70" r="9" fill="var(--dimmer)"/>
  <text x="46" y="50" class="lbl" font-size="9" text-anchor="middle">source, off to the left</text>
  <g class="wl"><path d="M60 70 q10 -10 20 0 t20 0" fill="none" stroke="var(--accent)" stroke-width="1.8"/></g>
  <g class="wr"><path d="M60 118 q10 -10 20 0 t20 0" fill="none" stroke="var(--accent2)" stroke-width="1.8"/></g>
  <text x="230" y="164" class="lbl" font-size="9.5" text-anchor="middle">up to about 700 µs of difference between the two ears, and a level difference on top</text>
  <text x="230" y="180" class="lbl" font-size="9.5" text-anchor="middle">no organ measures direction — the direction is inferred from the disagreement</text>
</svg>`

  const coneFig = `
<svg viewBox="0 0 620 190" role="img" class="conefig">
  <line x1="40" y1="150" x2="590" y2="150" stroke="var(--line)"/>
  ${[
    ['c1', 'S', 130, '#6e9ce0', '≈420 nm'],
    ['c2', 'M', 300, '#6ec96e', '≈534 nm'],
    ['c3', 'L', 380, '#e05c5c', '≈564 nm'],
  ].map(([c, n, x, col, nm]) => {
    let d = `M${x - 130} 150 `
    for (let i = -130; i <= 130; i += 8) {
      const y = 150 - 92 * Math.exp(-(i * i) / 7000)
      d += `L${x + i} ${y.toFixed(1)} `
    }
    return `<g class="${c}"><path d="${d}" fill="none" stroke="${col}" stroke-width="2.4"/>
      <text x="${x}" y="46" class="val" font-size="12" text-anchor="middle" fill="${col}">${n}</text>
      <text x="${x}" y="62" class="lbl" font-size="9" text-anchor="middle">${nm}</text></g>`
  }).join('')}
  <text x="60" y="170" class="lbl" font-size="9">violet</text>
  <text x="570" y="170" class="lbl" font-size="9" text-anchor="end">red</text>
  <text x="310" y="186" class="lbl" font-size="9.5" text-anchor="middle">three broadly tuned detectors that overlap heavily — the colour is the ratio between their responses</text>
</svg>`

  const tempFig = `
<svg viewBox="0 0 460 180" role="img" class="tempfig">
  <line x1="24" y1="130" x2="436" y2="130" stroke="var(--line)"/>
  <g class="line"><path d="M40 118 L420 118" stroke="var(--accent2)" stroke-width="2.4"/></g>
  <text x="24" y="24" class="lbl" font-size="9.5">skin temperature, moving up and back down</text>
  ${[110, 160, 300, 350].map((x, i) => `<g class="spike" style="animation-delay:${(i % 2) * 0.1}s">
    <rect x="${x}" y="60" width="5" height="60" rx="2.5" fill="var(--accent)"/></g>`).join('')}
  <text x="230" y="154" class="lbl" font-size="9.5" text-anchor="middle">the receptors fire hardest while it is <tspan font-style="italic">changing</tspan>, and quieten once it holds</text>
  <text x="230" y="170" class="lbl" font-size="9.5" text-anchor="middle">which is why a room feels cold when you walk in and normal twenty minutes later</text>
</svg>`

  const maskFig = `
<svg viewBox="0 0 460 170" role="img" class="maskfig">
  <line x1="24" y1="130" x2="436" y2="130" stroke="var(--line)"/>
  ${[60, 100, 140].map((x) => `<rect class="hidden" x="${x}" y="86" width="8" height="44" rx="3" fill="var(--dimmer)"/>`).join('')}
  <rect class="masker" x="196" y="30" width="14" height="100" rx="4" fill="var(--accent)"/>
  ${[266, 306, 346].map((x) => `<rect class="hidden" x="${x}" y="86" width="8" height="44" rx="3" fill="var(--dimmer)"/>`).join('')}
  <text x="203" y="22" class="lbl" font-size="9" text-anchor="middle" fill="var(--accent)">a loud tone</text>
  <text x="230" y="152" class="lbl" font-size="9.5" text-anchor="middle">its neighbours are still there and stop being heard — masking, and the reason a mix is a competition</text>
  <text x="230" y="166" class="lbl" font-size="9" text-anchor="middle">frequency →</text>
</svg>`

  const R = (name, sub, from, to, colour) => {
    // log scale from 10 Hz to 20 kHz
    const lo = Math.log10(10), hi = Math.log10(20000)
    const p = (v) => ((Math.log10(v) - lo) / (hi - lo)) * 100
    return `<div class="rrow"><span class="n">${name}<em>${sub}</em></span>
      <span class="track"><i style="left:${p(from).toFixed(1)}%;width:${(p(to) - p(from)).toFixed(1)}%;background:${colour}"></i></span></div>`
  }

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / senses</div>
${learnNav(esc, 'senses')}
<div class="lhero">
  <h2>How each sense tells things apart</h2>
  <p class="lede">Nothing in a body measures the world. Every sense has a handful of broadly tuned, heavily overlapping detectors, and the answer — a direction, a colour, a temperature — is <em>inferred</em> from the pattern across them. That is the same logic as sensor fusion, arriving from the biological side, and it is why all of this is one subject rather than five.</p>
</div>

${S('Hearing, part one', 'How two ears become a direction', [
  'There is no organ for direction. There are two ears about 20 cm apart, and everything else is arithmetic done on the difference between them.',
  '<b>Time.</b> A sound from the left reaches the left ear first — up to roughly 700 microseconds earlier for a sound directly to one side. That interaural time difference is the dominant cue below about 1.5 kHz, where a wavelength is long enough that the phase difference is unambiguous.',
  '<b>Level.</b> Above that, the head itself becomes an obstacle and casts an acoustic shadow, so the far ear hears less. That interaural level difference takes over as the main cue for high frequencies.',
  '<b>Shape.</b> Both of those are symmetrical front to back, which leaves a whole cone of positions that produce identical differences — the cone of confusion. What resolves it is the <b>pinna</b>: the folds of your outer ear filter incoming sound differently depending on where it came from, notching particular frequencies. Your brain learned your own ears\' filtering in childhood, which is why generic binaural audio never quite works on everybody and why individualised head-related transfer functions are a research industry.',
  'And when all of that fails, you move your head. A tiny movement changes the differences in a way that is different for a source in front and one behind, and the ambiguity collapses. Head movement is the single most powerful localisation cue there is, which is exactly why a fixed headphone image feels artificial and a head-tracked one does not.',
])}

${fig(earFig, 'Two ears, one sound, and a disagreement. The direction is inferred, never measured.')}

<div class="headbox" id="loc" tabindex="0" role="application" aria-label="Move a sound source around a head">
  <svg viewBox="0 0 460 288" aria-hidden="true">
    <circle cx="230" cy="150" r="52" fill="var(--panel2)" stroke="var(--line)" stroke-width="1.6"/>
    <circle cx="182" cy="132" r="8" fill="var(--accent)"/>
    <circle cx="278" cy="132" r="8" fill="var(--accent2)"/>
    <path d="M230 98 l-9 16 h18 z" fill="var(--dimmer)"/>
    <circle id="loc-src" cx="330" cy="70" r="11" fill="var(--ok)"/>
    <line id="loc-l" x1="330" y1="70" x2="182" y2="132" stroke="var(--accent)" stroke-width="1.4" stroke-dasharray="3 4"/>
    <line id="loc-r" x1="330" y1="70" x2="278" y2="132" stroke="var(--accent2)" stroke-width="1.4" stroke-dasharray="3 4"/>
    <text x="230" y="272" class="lbl" font-size="10" text-anchor="middle" fill="var(--dimmer)">drag the source</text>
  </svg>
</div>
<div class="verdict" id="loc-out"></div>

${S('Hearing, part two', 'How one ear becomes a pitch — and why a mix is a competition', [
  'The cochlea is a tapered tube, and where along it a frequency causes the greatest movement depends on that frequency: high notes near the entrance, low notes deep inside. That is <b>tonotopy</b>, and it means pitch is partly just <em>which hair cells moved</em> — a place code, the same principle a <a href="/learn/neuro/">cochlear implant</a> exploits.',
  'Below roughly 4 to 5 kHz there is a second mechanism running alongside it: nerve fibres fire in step with the waveform, so the <em>timing</em> of the spikes carries the frequency directly. Two codes, overlapping, which is part of why pitch perception is so much better than the mechanical tuning of the cochlea alone would allow.',
  'The consequence that matters on a show is <b>masking</b>. A loud sound raises the threshold for anything close to it in frequency — the neighbours are still arriving, and they stop being heard. Masking is asymmetric, spreading further upward in frequency than downward, and it is why a mix is not a set of independent channels but a competition for the same detectors. Carving a hole for a vocal is not a stylistic choice; it is the only way to make room in a mechanism that is already full.',
])}

${fig(maskFig, 'The quiet neighbours are still arriving. They just stop being heard.')}

${S('Seeing', 'Three overlapping detectors, and a colour that is not in the light', [
  'There is no such thing as a red photon. Wavelength is a physical property; colour is a construction, and it is built from exactly three numbers.',
  'The retina has three cone types with peak sensitivities at roughly 420, 534 and 564 nm — conventionally short, medium and long. They are <b>very broadly tuned and overlap heavily</b>, particularly the M and L cones, which sit remarkably close together. No single cone can tell you a wavelength: a middling response could be a weak light at its peak or a strong light off to one side. What identifies a colour is the <em>ratio</em> between all three.',
  'That is exactly why <a href="/learn/perception/">metamerism</a> works and why <a href="/learn/colour/">three numbers can encode a colour at all</a>. If vision sampled the spectrum finely, RGB would be hopeless. It works because we only ever had three samples.',
  'Downstream, those three signals are immediately recombined into <b>opponent</b> channels: light-versus-dark, red-versus-green, and blue-versus-yellow. Which is why you cannot imagine a reddish green — the channel that would have to carry it can only point one way at a time — and why staring at a colour and looking away gives you an afterimage in its complement.',
])}

${fig(coneFig, 'Three broad, overlapping responses. The colour is the ratio, not the wavelength.')}

${S('', 'And the parts of that which are not universal', [
  '<b>Colour vision deficiency is common.</b> Roughly 8% of men and about 0.5% of women, overwhelmingly red-green, usually because the M and L cone pigments are shifted closer together than typical. For those people red and green are not confusable in some abstract sense — they are genuinely closer together.',
  'Which makes one design rule non-negotiable and constantly broken: <b>never encode meaning in red versus green alone</b>. Ready and not-ready, armed and safe, pass and fail. Add shape, position, text or brightness. This applies to a control surface, a status page, a cue light and a signage system, and it costs nothing at design time.',
  '<b>Rods are a different sense.</b> Roughly 120 million of them against about 6 million cones, far more sensitive, no colour information at all, and almost none in the fovea — so in a dark room the centre of your gaze is the blind spot for dim things, and you genuinely see a faint star better by looking slightly away from it. It is also why a deeply dark scene reads as monochrome no matter what colour the light is, and why the <a href="/learn/perception/">Purkinje shift</a> pulls sensitivity toward blue at low levels.',
])}

${S('Seeing depth', 'Two eyes, and the eight cues that do most of the work', [
  'A retina is flat. Depth is not in the image — it is reconstructed, and stereo vision is only one of the ingredients and not the largest.',
  '<b>Binocular disparity</b> is the famous one. Your eyes are about 63 mm apart, so each sees a slightly different image, and the horizontal difference between where a point lands in the two is the disparity. It is the only cue that gives genuinely <em>absolute</em> depth, and its useful range is short — a few metres. Beyond about ten metres the disparity between two eyes 63 mm apart is too small to signify, which is why stereo 3D of a distant landscape looks like a flat backdrop.',
  '<b>Convergence</b> adds a little more: how far your eyes have to turn inward to fuse an object. Also short-range, and it is the cue that gets into trouble on a screen.',
  'Everything else is <b>monocular</b>, works with one eye shut, and is doing most of the heavy lifting: <em>occlusion</em> (what covers what — the strongest depth cue there is), <em>motion parallax</em> (near things sweep past faster when you move), <em>perspective</em>, <em>familiar size</em>, <em>texture gradient</em>, <em>shading and shadow</em>, and <em>aerial perspective</em> (distant things are hazier and bluer).',
  'Which is why a well-lit set with good shadows reads as deep on a flat screen, and why adding stereo to badly composed depth cues adds very little. <b>Stereo is a top-up, not the mechanism.</b>',
])}

${S('', 'Why 3D gives people headaches, in one sentence', [
  'In the real world, the distance your eyes <em>converge</em> to and the distance they <em>focus</em> to are always the same number. On a stereoscopic screen they are not: your eyes converge at whatever depth the disparity implies, and focus on the screen, always. That is the <b>vergence–accommodation conflict</b>, it is a genuine physiological mismatch rather than a preference, and it is the single largest cause of discomfort in stereo 3D and in headsets.',
  'The mitigations are all versions of <em>use less of it</em>: keep the depth budget small, keep the action near the screen plane, avoid strong negative parallax for long stretches, and never ask the eyes to <b>diverge</b> — which happens the moment on-screen separation exceeds the distance between somebody\'s eyes, and which they physically cannot do.',
  'And the budget is a percentage of screen width, not a distance, because what matters is the angle the eyes are being asked to make. The same shot that is comfortable on a laptop can be unwatchable on a cinema screen.',
])}

<div class="dial">
  <div class="d"><label for="st-d">object distance <b id="st-dv">12 m</b></label>
    <input id="st-d" type="range" min="1" max="120" step="1" value="12"></div>
  <div class="d"><label for="st-c">convergence set to <b id="st-cv">6 m</b></label>
    <input id="st-c" type="range" min="1" max="60" step="1" value="6"></div>
  <div class="d"><label for="st-w">screen width <b id="st-wv">10 m</b></label>
    <input id="st-w" type="range" min="1" max="30" step="1" value="10"></div>
</div>
<div class="verdict" id="st-out"></div>

${S('', 'How it is delivered, and how it is captured', [
  'Every stereo display is solving one problem: get a different image into each eye. The methods differ only in how they separate them, and each one costs something.',
  '<b>Polarised</b> — the two images carry opposite polarisation and passive glasses filter them. Cheap glasses, comfortable, and it halves light and usually resolution. The cinema standard.',
  '<b>Active shutter</b> — the display alternates left and right frames and the glasses blank each eye in turn. Full resolution per eye, needs powered synchronised glasses, and is where flicker sensitivity shows up.',
  '<b>Anaglyph</b> — red and cyan filters. Works on anything, wrecks colour, and survives because it needs no special screen at all.',
  '<b>Autostereoscopic</b> — a lenticular sheet or parallax barrier sends different columns of pixels in different directions, so no glasses are needed. It costs resolution and it only works from particular positions, which is why it suits a kiosk and not a theatre.',
  '<b>A headset</b> is the honest version: a separate display per eye, no separation trick needed, and the full <a href="/learn/presence/">presence</a> problem instead.',
  'Capture is the mirror image. Two cameras on a rig with an <b>interaxial</b> separation — often smaller than human eyes for close work, larger for distant subjects to create depth that would not otherwise exist — and a <b>convergence</b> setting that decides which distance sits on the screen plane. Increase interaxial and everything gets deeper; move convergence and the whole scene slides through the screen. Those two controls are the entire grammar, and getting them wrong is not fixable later.',
])}

${S('And the newer one', 'Volumetric capture, which is a different thing entirely', [
  'Stereo records <em>one viewpoint, twice</em>. You cannot walk around it, because there is nothing behind the subject to see. <b>Volumetric capture records the subject itself</b>, so a viewpoint can be generated afterwards from anywhere.',
  'The usual method is a rig of many synchronised cameras — often dozens, sometimes with depth sensors — surrounding a performer. Each frame is reconstructed into geometry with texture: a per-frame mesh, or increasingly a neural representation such as a radiance field or a set of Gaussians that encodes how the scene looks from any direction. The output is not a video, it is <b>a moving object you can put in a scene</b>, light, occlude and walk around.',
  'The costs are real. Every camera must be synchronised to the frame — the <a href="/learn/systems/">shared clock</a> problem again — and calibrated to a common coordinate system, which is the <a href="/learn/reading/">registration</a> problem again. Data rates are enormous. Hair, fine fabric and transparency reconstruct badly. And the capture volume is a hard boundary: step outside it and the performer stops existing.',
  'What it buys, in the terms this site cares about, is <b>plausibility</b>. A stereo recording of a person is a picture that happens to have depth; a volumetric one responds correctly when the viewer moves, which is the sensorimotor contingency <a href="/learn/presence/">place illusion</a> is built from. That difference is worth far more than resolution.',
])}

${S('Hearing, part three', 'The machinery, and why the damage is permanent',
  ['The two sections above treat the ear as something that already produces a direction and a pitch. It is worth saying how, because the mechanism explains both what it is astonishingly good at and what breaks it.',
   'Sound arrives as a pressure wave in air and has to end up as nerve impulses in fluid, and air and fluid are wildly mismatched: pushed straight at a fluid surface, almost all of the energy reflects and only around a thousandth gets in. That is a loss of about 30&nbsp;dB, and it would make ordinary speech inaudible. The <strong>middle ear</strong> exists to recover it. Three tiny bones &mdash; the ossicles, the smallest in the body &mdash; act as a mechanical transformer, concentrating the force from the large eardrum onto the much smaller oval window and adding a small lever advantage. It is an impedance matching device, doing the same job for sound that <a href="/tools/#xfmr">a transformer</a> does for a circuit, and for exactly the same reason.',
   'Inside the <strong>cochlea</strong> is the part that ought to be more famous. It is a coiled tube with a membrane running along it that is stiff and narrow at one end and floppy and wide at the other, so different frequencies peak at different places along its length. High frequencies at the entrance, low at the far end. That is a mechanical spectrum analyser, built out of geometry, running with no power and no latency &mdash; the ear does not compute a Fourier transform, it <em>is</em> one. Which is why pitch is called place coding, and why the frequency resolution of hearing is set by how sharply the membrane peaks rather than by anything neural.',
   'Sitting on that membrane are the <strong>hair cells</strong>, around 16,000 of them, converting movement into nerve signals. There are two things to know about them and both matter on a show. The outer ones actively amplify quiet sounds, which is where the enormous dynamic range of hearing comes from. And humans do not regrow them. Noise damage is mechanical destruction of a finite, non-renewing population, which is why <a href="/tools/#dose">noise exposure</a> is a dose over time rather than a level, and why hearing protection is not a comfort measure.'])}

<div class="tryit">
  <div class="f"><label for="itd-a">Source angle <span id="itd-av">45&deg;</span></label>
    <input id="itd-a" type="range" min="-180" max="180" step="5" value="45"></div>
</div>
<div class="readout" id="itd-out" role="status" aria-live="polite"></div>

${rule('Two ears resolve a delay down to about <b>ten microseconds</b> &mdash; finer than one sample at 44.1&nbsp;kHz. The entire mechanism works inside a range of about 660&nbsp;&micro;s, which is thirty-odd samples at 48k.')}

${bites([
  '<b>Treating hearing damage as reversible.</b> It is not. Hair cells do not come back, and the loss is typically at 4 kHz first, where consonants live &mdash; so speech gets muddy before anything gets quiet.',
  '<b>Assuming the whole audience hears the top end.</b> The nominal 20 kHz is a young ear in a lab. By forty it is commonly nearer 15, and a mix voiced on a young engineer&rsquo;s ears is not the mix the room gets.',
  '<b>Forgetting the delay range is tiny.</b> A few hundred microseconds of error between two loudspeakers moves an image right across the stage, because that is the same order as the entire natural range.',
])}

${S('Seeing, part two', 'The eye as an optical instrument, and the two degrees that are sharp',
  ['Most people picture the lens doing the focusing. It does not do most of it. The <strong>cornea</strong> &mdash; the transparent front surface &mdash; provides roughly two thirds of the eye&rsquo;s refractive power, because that is where the biggest change in refractive index happens, from air into tissue. The lens supplies the rest and, crucially, the <em>adjustable</em> part: it changes shape to focus near or far, and it stiffens with age, which is why reading glasses eventually happen to nearly everybody and has nothing to do with the retina.',
   'Behind that sit two detector populations doing two different jobs. Around 6 million <strong>cones</strong>, which need reasonable light, give colour and fine detail, and are packed almost entirely into a tiny central pit called the fovea. Around 120 million <strong>rods</strong>, twenty times as many, work down to nearly single photons, give no colour at all, and are spread across the rest of the retina and absent from the middle of it.',
   'The consequence is the single most under-appreciated fact about vision: <strong>the sharp part of your visual field is about two degrees wide</strong>. That is roughly a thumbnail at arm&rsquo;s length. Everything else is peripheral and dramatically coarser &mdash; the impression of a wide, detailed world is a reconstruction assembled from several fixations a second, and you never see the gaps. It is also why <a href="/learn/perception/">where you point attention</a> decides what is actually seen, and why peripheral content can be far lower resolution than anyone expects to get away with.',
   'Then there is a hole. Where the optic nerve leaves there are no receptors at all, a blind spot several degrees across in each eye, and nobody perceives it. The visual system fills it from the surroundings without flagging that it did, which is the same machinery <a href="/learn/illusion/">every illusion on this site borrows</a>.'])}

${S('Seeing, part three', 'Dark adaptation, and the shift that changes what colour means',
  ['Two effects of the rod-and-cone split matter directly on a stage, and both are about low light.',
   '<strong>Dark adaptation is slow and it happens twice.</strong> Cones adapt within about five minutes and then stop improving. Rods keep going for twenty to thirty minutes and end up vastly more sensitive. The practical figures: after a blackout an audience regains useful vision in a couple of minutes, but full dark adaptation takes half an hour and is destroyed in seconds by one bright cue. Which is why a followspot through a dark scene costs the entire house its adaptation, and why running lights are dim <em>and</em> red &mdash; red light barely stimulates rods, so it preserves the adaptation it lets you work by.',
   '<strong>The Purkinje shift</strong> is the one that surprises lighting people. Rods peak around 500&nbsp;nm and cones around 555&nbsp;nm, so as light falls and vision hands over from cones to rods, the eye&rsquo;s sensitivity peak moves toward blue. A red and a blue that matched in brightness at full will not match at 5% &mdash; the blue will look markedly brighter. Nothing changed about the fixtures. The receiver changed.',
   'That gap between what a meter says and what an eye reports is the whole reason photometry has three regimes with different names: <em>photopic</em> at daylight levels where cones dominate, <em>scotopic</em> in near darkness where rods do, and <em>mesopic</em> in between, which is where almost every theatrical low-level cue actually sits and where neither curve is right.'])}

${rule('At low level the eye <b>changes which detector it is using</b>, and its sensitivity peak moves toward blue. A meter reading photopic lux does not know that.')}

${S('Seeing, part four', 'One arcminute, and every viewing distance that follows from it',
  ['Acuity has a number, and it is the origin of a surprising number of rules that get quoted without it. Standard vision &mdash; 20/20 &mdash; resolves detail about <strong>one arcminute</strong> across: a sixtieth of a degree. At ten metres that is 2.9&nbsp;mm.',
   'Turn it round and you get the distance at which a pixel pitch stops being resolvable, which is about 3.4 metres per millimetre of pitch. A 3.9&nbsp;mm wall is genuinely pixel-free at around 13&nbsp;m. The familiar rule of thumb &mdash; pitch in millimetres equals minimum viewing distance in metres &mdash; gives 3.9&nbsp;m, and the gap between those two numbers is the difference between <em>invisible</em> and <em>acceptable</em>. Both are legitimate targets; they are not the same target, and quoting one while meaning the other is how walls get specified badly.',
   'Two caveats worth carrying. 20/20 is a norm rather than a ceiling &mdash; plenty of people resolve half an arcminute &mdash; so designing exactly at the threshold designs for the average eye and fails the sharpest ones in the room. And this figure only describes the fovea. Two degrees off-axis it is already much worse, which is why a wall that resolves badly straight on can be perfectly acceptable in peripheral vision.'])}

<div class="tryit">
  <div class="f"><label for="acu-d">Viewing distance <span id="acu-dv">10 m</span></label>
    <input id="acu-d" type="range" min="1" max="60" step="1" value="10"></div>
  <div class="f"><label for="acu-p">Pixel pitch <span id="acu-pv">3.9 mm</span></label>
    <input id="acu-p" type="range" min="1" max="20" step="0.1" value="3.9"></div>
</div>
<div class="readout" id="acu-out" role="status" aria-live="polite"></div>

${S('Temperature', 'Receptors that report change, and cannot tell chilli from heat', [
  'There is no thermometer in your skin. There are separate warm and cold receptors, and they respond far more strongly to <b>change and the rate of change</b> than to the absolute level. Walk into a cool room and it feels cold; twenty minutes later it feels normal, and the room has not moved.',
  'The receptors are ion channels, and this is where it gets useful. The main cold channel, TRPM8, is opened by low temperature — and also by <b>menthol</b>. The main heat channel, TRPV1, is opened by high temperature — and also by <b>capsaicin</b>, the compound in chilli. The receptor has no way of distinguishing the two triggers, so the brain receives an identical signal and reports the only thing it can: that is hot, that is cold.',
  'Chilli is not metaphorically hot. It is opening the same channel that heat opens, and by the time the signal reaches you the distinction no longer exists. That is the cleanest demonstration anywhere that <b>perception is downstream of transduction</b> — which is the <a href="/learn/neuro/">common-currency argument</a> in one mouthful of food.',
  'For a room this means comfort is mostly about gradient and airflow rather than a set point. Moving air reads as cold at a temperature still air does not, radiant heat from a lighting rig reads differently from warm air, and an audience arriving from outside is adapted to somewhere else entirely.',
])}

${fig(tempFig, 'The receptors fire while it changes and quieten when it holds. Adaptation is the sense working correctly.')}

${S('Touch', 'Why bass is felt, and where a tactile transducer lives', [
  'Skin has several mechanoreceptor types, each tuned to a different band of mechanical frequency — slow sustained pressure at one end, rapid vibration at the other.',
  'The one worth knowing by name is the <b>Pacinian corpuscle</b>, which is most sensitive to vibration in roughly the 200 to 300 Hz region. That is squarely in the low end of music, and it is why bass is not simply heard — it is genuinely detected by a second sensory system with its own detectors, threshold and adaptation.',
  'This is the mechanism a tactile transducer under a seat is using, and the reason a haptic vest can deliver a mix to somebody who cannot hear it. It is also why very low frequency stops being a pitch and becomes a sensation in the chest: below the hearing range there is nothing for the cochlea to do and plenty for the body to feel.',
])}

<div class="ranges">
  ${R('Deep bass, felt', 'chest, body, structure', 10, 60, 'var(--dom-control)')}
  ${R('Pacinian corpuscles', 'peak vibration sensitivity', 100, 400, 'var(--accent2)')}
  ${R('Speech intelligibility', 'where a vocal lives or dies', 300, 4000, 'var(--accent)')}
  ${R('Phase-locked pitch coding', 'timing as well as place', 20, 4500, 'var(--ok)')}
  ${R('Human hearing, nominal', 'and the top end goes with age', 20, 20000, 'var(--dom-network)')}
</div>

${S('Touch, part two', 'Four detectors, and what a haptic device is actually addressing',
  ['The section above named the Pacinian corpuscle. There are four types worth separating, because a haptic effect that ignores which one it is talking to reads as a buzz rather than as a sensation.',
   '<strong>Merkel cells</strong> respond to sustained pressure and fine spatial detail, and they adapt slowly &mdash; they are how you feel a texture or an edge held still. <strong>Meissner corpuscles</strong> handle low-frequency flutter around 5 to 50&nbsp;Hz and adapt fast, which is how you detect something starting to slip out of your grip. <strong>Ruffini endings</strong> report skin stretch and, with them, the direction of a force. And <strong>Pacinian corpuscles</strong> sit deepest, are the most sensitive of all, and peak around 200 to 300&nbsp;Hz &mdash; which is why they are the ones a tactile transducer is aimed at.',
   'Two consequences for anybody building haptics. Spatial resolution varies enormously across the body: two points a couple of millimetres apart are distinguishable on a fingertip and need several centimetres on a back. A vest with an array of actuators has far less spatial vocabulary than the number of actuators suggests, and putting them closer together past a point buys nothing.',
   'And the actuator has to match the receptor. An <em>eccentric rotating mass</em> spins a weight, so it cannot change amplitude and frequency independently and takes tens of milliseconds to spin up &mdash; fine for a phone buzz, useless for anything that has to land on a beat. A <em>linear resonant actuator</em> is faster and cleaner but only really works at its own resonance. A <em>voice coil</em> is a small loudspeaker without a cone, driven by an audio signal, and it is the only one of the three you can send a waveform to. Which is why haptic design on a show is largely an audio engineering problem, complete with a latency budget: touch and sound have to arrive inside roughly the same window as sight and sound, or the effect separates into two events.'])}

${rule('Which mechanoreceptor you are addressing decides the <b>actuator</b>, not just the frequency. Only a voice coil takes a waveform; the other two take a request and give you what they have.')}

${S('Smell', 'The only sense that does not stop at the switchboard',
  ['Smell is the sense most likely to be dismissed as a novelty and the one with the most direct line to memory and emotion, and there is a structural reason for that rather than a poetic one.',
   'Humans have roughly <strong>400 different olfactory receptor types</strong>. Nothing like enough for the number of distinguishable odours, so the coding is combinatorial: a molecule activates a pattern across many receptors, and the identity is the pattern. It is the same trick colour vision plays with three cone types, with a far larger alphabet &mdash; which is why smells blend into new smells rather than being heard as chords the way sounds are.',
   'The structural fact is the routing. Every other sense passes through the thalamus first, which is the brain&rsquo;s relay and, loosely, its switchboard. <strong>Olfaction does not.</strong> It reaches the olfactory bulb and from there goes more or less directly to the amygdala and hippocampus &mdash; emotion and memory. That is not a metaphor about smell being evocative; it is a wiring diagram, and it is the best available explanation for why a smell can return a memory whole in a way a photograph does not.',
   'Then the part that makes it hard to use. Olfactory adaptation is <em>fast</em> &mdash; a constant odour fades from awareness within a few minutes, sometimes less &mdash; so a scent that fills a room is gone from the audience&rsquo;s experience long before it is gone from the room. And there is no off switch: a scent released into a space stays in the air handling, on the soft furnishings and in the next audience&rsquo;s experience of the first scene. Use once, at a threshold, at the moment it should land, and plan how the room is cleared before you plan the effect.'])}

${bites([
  '<b>Running a scent continuously.</b> The audience stopped smelling it in minutes. The building did not, and neither will the next house.',
  '<b>Treating haze smell as neutral.</b> It is not &mdash; glycol has a smell, audiences notice it, and for some it is a trigger. It is a design decision whether or not anybody made it deliberately.',
  '<b>Scent without consent.</b> Fragrance sensitivity and asthma are common, there is no way to opt out of shared air, and unlike a loud cue somebody cannot cover their nose and stay. It belongs on the door notice with the strobe warning.',
  '<b>Haptics on a spinning-mass actuator.</b> Tens of milliseconds to spin up and no independent control of level. If it has to land with a hit, it needs a voice coil.',
])}

${S('The rest of them', 'Briefly, and they matter more than their airtime', [])}

<div class="sens2">
  <div><h4>Taste</h4>
    <p>Only five things are actually tasted &mdash; sweet, salt, sour, bitter, umami &mdash; and that is the entire vocabulary of the tongue. Everything else people call taste is <em>smell</em>, arriving at the nose from the back of the mouth while chewing.</p>
    <p>Which is why food is nearly flavourless with a blocked nose, and why the two senses are almost impossible to separate in an audience&rsquo;s report of an experience.</p>
    <p class="use">dining events, immersive work with consumption &mdash; and the reason air handling changes how food tastes</p></div>
  <div><h4>Balance</h4>
    <p>Fluid-filled canals reporting rotation and acceleration. It is the only sense that tells you which way is down, and you never notice it until it disagrees with your eyes.</p>
    <p>That disagreement is not confusing, it is nauseating — a hard limit rather than a quality setting.</p>
    <p class="use">the ceiling on motion simulation, XR and anything that moves an audience</p></div>
  <div><h4>Proprioception</h4>
    <p>Receptors in muscles and joints reporting where your limbs are without looking. It is what makes a body feel like <em>yours</em>, and it is what synchronous touch hijacks.</p>
    <p class="use">avatars, puppets, prosthetics — ownership follows synchrony</p></div>
  <div><h4>Interoception</h4>
    <p>The state of the inside: heart, breath, gut, the vague sense of being alright or not. It supplies most of the raw arousal that an emotion gets built out of.</p>
    <p class="use">the material the <a href="/learn/emotion/">emotion page</a> is about</p></div>
</div>

${rule('Every one of these works the same way: <b>a few broadly tuned detectors, and an answer inferred from the pattern across them.</b> Colour from three overlapping cones. Direction from two ears disagreeing. Temperature from receptors that only report change. None of it is measurement, and all of it is fusion.')}

${bites([
  '<b>Never encode meaning in red versus green alone.</b> Roughly one man in twelve cannot reliably read it, and adding shape or text costs nothing.',
  '<b>Masking means a mix is a competition, not a set of channels.</b> Space in the spectrum is finite because the detectors are shared.',
  '<b>Head movement is the strongest localisation cue.</b> Which is why head tracking transforms binaural audio and why a fixed image never quite convinces.',
  '<b>Comfort is about change, not a set point.</b> Airflow, radiant heat and where the audience came from all matter more than the number on the thermostat.',
  '<b>Adaptation is the sense working properly, not failing.</b> Every channel quietens on a constant, which is the physiological version of why <a href="/learn/experience/">contrast is the only lever</a>.',
])}

${xnote('This is the parts list behind every threshold on the <a href="/learn/perception/">perception page</a> and every design lever on the <a href="/learn/emotion/">emotion page</a>. It is also the argument for why they are one subject: <b>a show is several signals arriving at one set of shared, overlapping, adapting detectors</b>, competing for the same capacity. Lighting and sound are not independent channels into a person — they are two inputs to a system that fuses everything and has a finite budget.')}

<div class="cta"><strong>This is a practitioner\'s summary of a very large body of research.</strong>
<p>It simplifies, and where a figure is a range it is written as one. If something here is out of date, over-stated, or missing the caveat that matters, <a href="${GH}/issues/new?labels=tooling&amp;title=senses%3A+">open an issue</a> — precision here improves every page that depends on it.</p></div>

<script>
(function(){
  var box=document.getElementById('loc'); if(!box) return;
  var src=document.getElementById('loc-src'), L=document.getElementById('loc-l'),
      R=document.getElementById('loc-r'), out=document.getElementById('loc-out');
  var EL=[182,132], ER=[278,132], CX=230, CY=150;
  function set(x,y){
    x=Math.max(14,Math.min(446,x)); y=Math.max(14,Math.min(250,y));
    src.setAttribute('cx',x); src.setAttribute('cy',y);
    L.setAttribute('x1',x); L.setAttribute('y1',y);
    R.setAttribute('x1',x); R.setAttribute('y1',y);
    var dl=Math.hypot(x-EL[0],y-EL[1]), dr=Math.hypot(x-ER[0],y-ER[1]);
    // px are arbitrary; scale so a full sideways offset lands near 700 us
    var itd=(dl-dr)*7.3;
    var ild=(dr-dl)*0.11;
    var side = itd < -20 ? 'left' : itd > 20 ? 'right' : 'centre';
    var behind = y > CY;
    var ambiguous = Math.abs(itd) < 30;
    out.innerHTML='Interaural time difference <b>'+Math.abs(itd).toFixed(0)+' \\u00b5s</b> toward the '+
      (itd<0?'left':itd>0?'right':'centre')+', level difference <b>'+Math.abs(ild).toFixed(1)+' dB</b>. '+
      (ambiguous
        ? 'Almost no difference between the ears \\u2014 which is why a source directly in front and directly <em>behind</em> are the hardest pair to tell apart. Only the pinna, and moving your head, resolve it.'
        : 'Heard to the '+side+'. '+(behind
            ? 'Front and back produce the same differences: this position is on a <b>cone of confusion</b> with a mirrored one in front of the head.'
            : 'Below about 1.5 kHz the timing dominates; above it the head shadows the far ear and the level difference takes over.'));
  }
  function pt(e){
    var r=box.getBoundingClientRect(), p=e.touches?e.touches[0]:e;
    set(((p.clientX-r.left)/r.width)*460, ((p.clientY-r.top)/r.height)*288);
  }
  var down=false;
  box.addEventListener('pointerdown',function(e){down=true;pt(e);try{box.setPointerCapture(e.pointerId)}catch(err){}});
  box.addEventListener('pointermove',function(e){if(down)pt(e)});
  box.addEventListener('pointerup',function(){down=false});
  box.addEventListener('keydown',function(e){
    var d={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]}[e.key];
    if(!d) return; e.preventDefault();
    set(+src.getAttribute('cx')+d[0], +src.getAttribute('cy')+d[1]);
  });
  set(330,70);
})();
</script>

<script>
(function(){
  var D=document.getElementById('st-d'); if(!D) return;
  var C=document.getElementById('st-c'), W=document.getElementById('st-w'),
      out=document.getElementById('st-out'), IO=63;
  function draw(){
    var d=Number(D.value), c=Number(C.value), w=Number(W.value);
    document.getElementById('st-dv').textContent=d+' m';
    document.getElementById('st-cv').textContent=c+' m';
    document.getElementById('st-wv').textContent=w+' m';
    var px=IO*(1-c/d), pct=(px/1000/w)*100;
    var where = Math.abs(px)<0.5 ? 'on the screen plane'
      : px>0 ? 'behind the screen' : 'in front of the screen, toward the audience';
    var verdict;
    if (px>IO) verdict='<span class="err">Divergent.</span> The eyes are being asked to turn outward past parallel, which they cannot do. This is pain, not depth.';
    else if (pct>1) verdict='<span class="err">Past the usual comfort guide</span> of about 1% of screen width for positive parallax. Fine for a moment, punishing for a sequence.';
    else if (pct<-2) verdict='<span class="err">Strong negative parallax.</span> Dramatic, and the vergence\u2013accommodation conflict is at its worst here. Use it briefly.';
    else verdict='<span class="ok">Inside the usual comfort guide.</span>';
    out.innerHTML='On-screen separation <b>'+px.toFixed(1)+' mm</b> \u2014 <b>'+pct.toFixed(2)+
      '%</b> of screen width, '+where+'. '+verdict+
      ' Note that the budget is a <b>percentage of width</b>: the same shot on a 30 m screen asks far more of the eyes than on a laptop.';
  }
  for (var el of [D,C,W]) el.addEventListener('input',draw);
  draw();
})();
</script>
`

  const script = `
${MATH_SRC}
(function(){
  var a=document.getElementById('itd-a');
  if(!a)return;
  function draw(){
    var ang=Number(a.value);
    document.getElementById('itd-av').textContent=ang+'°';
    var r=interauralDelay(ang);
    if(!r)return;
    var out=document.getElementById('itd-out');
    var html='<b>'+r.itdMicroseconds+'</b> µs between the ears &mdash; '
      +r.itdSamplesAt48k+' samples at 48 kHz, out of a maximum of '+r.maxItdMicroseconds+' µs.';
    if(r.coneOfConfusion) html+='<br>'+r.coneOfConfusion;
    else if(ang===0) html+='<br>Dead ahead: no difference at all, which is why a centre image is the one thing two ears cannot argue about.';
    html+='<br><span class="dim">Below '+r.phaseAmbiguityHz+' Hz direction comes from this timing. Above it, half a wavelength no longer spans a head, so the system compares level instead.</span>';
    out.innerHTML=html;
  }
  a.addEventListener('input',draw); draw();
})();
(function(){
  var d=document.getElementById('acu-d'), p=document.getElementById('acu-p');
  if(!d||!p)return;
  function draw(){
    var dist=Number(d.value), pitch=Number(p.value);
    document.getElementById('acu-dv').textContent=dist+' m';
    document.getElementById('acu-pv').textContent=pitch+' mm';
    var r=visualAcuity(dist);
    if(!r)return;
    var retina=r.retinaDistanceFor(pitch);
    var visible=r.pitchVisible(pitch);
    document.getElementById('acu-out').innerHTML=
      'At '+dist+' m a standard eye separates <b>'+r.detailMm+'</b> mm, and legible text wants about <b>'
      +Math.round(r.legibleTextMm)+'</b> mm.<br>'
      +'A '+pitch+' mm pitch is '+(visible
        ? '<b>still resolvable</b> from here &mdash; pixels are visible until <b>'+retina+'</b> m'
        : '<b>past the eye’s limit</b> from here; it became invisible at '+retina+' m')
      +'.<br><span class="dim">The old rule of thumb would have said '+pitch+' m, which is where the pixels are acceptable rather than gone.</span>';
  }
  d.addEventListener('input',draw); p.addEventListener('input',draw); draw();
})();
`

  return shell({
    title: 'How each sense tells things apart | showstack',
    description: 'How two ears turn a 700-microsecond delay into a direction, how three overlapping cone responses become a colour that is not in the light, why chilli feels hot to a receptor that cannot tell it from heat, why bass is felt as well as heard, and why masking makes a mix a competition.',
    canonical: `${SITE}/learn/senses/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'How each sense tells things apart',
      description: 'Interaural time and level differences and the cone of confusion, cochlear tonotopy and masking, trichromatic and opponent colour vision, thermoreception and TRP channels, and vibration sensing.',
      url: `${SITE}/learn/senses/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraScript: script,
    extraStyle: style,
  })
}
