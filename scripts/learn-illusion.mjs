/**
 * /learn/illusion/ — building something an audience accepts.
 *
 * /learn/perception/ covers what the visual and auditory systems do.
 * /learn/presence/ covers embodiment and agency. Neither says how you
 * deliberately exploit any of it, which is a craft with its own rules and
 * its own characteristic failures.
 *
 * The organising idea is that perception is a prediction machine rather than
 * a camera. It is constantly proposing the most likely world consistent with
 * the evidence, and an illusion is a piece of evidence engineered so that the
 * most likely world is the one you wanted. That framing does real work: it
 * says an illusion is not a lie told to the eye, it is a plausible story the
 * eye is allowed to finish — and it predicts the failure mode, which is any
 * second piece of evidence that makes a different story more likely.
 *
 * Hence the structure. What the system will fill in. Two worked geometries
 * with arithmetic behind them. Where attention goes and how it is moved.
 * What actually breaks an illusion, which is nearly always a viewpoint
 * somebody did not check. And the consent line, because an audience that has
 * agreed to be fooled is having a completely different experience from one
 * that has not.
 */
import { peppersGhost, forcedPerspective } from './toolmath.mjs'
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

const MATH_SRC = [peppersGhost, forcedPerspective].map((f) => f.toString()).join('\n\n')
const MATH_TABLES = 'const STEREO_LIMIT_M = 10;'

export function learnIllusionPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* Pepper's ghost, drawn as the light path rather than as the effect: the
   audience is looking at a reflection and a transmission at once. */
.pgfig .ray{stroke-dasharray:5 5;animation:pg-flow 2.4s linear infinite}
@keyframes pg-flow{to{stroke-dashoffset:-40}}
.pgfig .ghost{opacity:.55}
/* Forced perspective: two objects, one angle. */
.fpfig .sight{stroke-dasharray:4 5}
.itable{width:100%;border-collapse:collapse;font-size:14px;margin:14px 0}
.itable th{text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;
color:var(--ink-faint);padding:0 12px 9px 0;border-bottom:1px solid var(--rule);font-weight:400}
.itable td{padding:11px 12px 11px 0;border-bottom:1px solid var(--rule);vertical-align:top;
color:var(--ink-muted);line-height:1.55}
.itable td:first-child{color:var(--ink)}
.itable td strong{color:var(--ink)}
.tblscroll{overflow-x:auto;margin:14px 0}
`

  const pgFig = `
<svg viewBox="0 0 620 260" role="img" class="pgfig">
  <line x1="300" y1="40" x2="420" y2="160" stroke="var(--signal)" stroke-width="3" opacity=".55"/>
  <text x="376" y="66" class="lbl" style="fill:var(--signal)">pane at 45&deg;</text>
  <rect x="40" y="176" width="520" height="6" fill="var(--rule-strong)"/>
  <rect x="326" y="196" width="46" height="44" rx="4" fill="var(--accent2)"/>
  <text x="349" y="256" class="lbl" text-anchor="middle">hidden object, lit hard</text>
  <rect class="ghost" x="326" y="72" width="46" height="44" rx="4" fill="var(--accent2)"/>
  <text x="300" y="66" class="lbl" text-anchor="end">the ghost, where it appears</text>
  <rect x="470" y="86" width="60" height="86" rx="4" fill="var(--surface-raised)" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <text x="500" y="134" class="lbl" text-anchor="middle">set</text>
  <path class="ray" d="M349 196 L349 130 L200 130" fill="none" stroke="var(--accent2)" stroke-width="2"/>
  <path class="ray" d="M470 130 L200 130" fill="none" stroke="var(--dimmer)" stroke-width="2"/>
  <circle cx="150" cy="130" r="14" fill="none" stroke="var(--ink)" stroke-width="2"/>
  <text x="150" y="168" class="lbl" text-anchor="middle">audience</text>
  <text x="40" y="30" class="lbl">One retina, two light paths: the object reflected off the pane, and the set transmitted through it.</text>
</svg>`

  const fpFig = `
<svg viewBox="0 0 620 230" role="img" class="fpfig">
  <circle cx="62" cy="140" r="13" fill="none" stroke="var(--ink)" stroke-width="2"/>
  <text x="62" y="176" class="lbl" text-anchor="middle">one eye</text>
  <rect x="200" y="104" width="16" height="46" rx="2" fill="var(--signal)"/>
  <text x="208" y="170" class="lbl" text-anchor="middle">near, small</text>
  <rect x="470" y="52" width="46" height="132" rx="3" fill="var(--accent2)"/>
  <text x="493" y="204" class="lbl" text-anchor="middle">far, large</text>
  <line class="sight" x1="62" y1="140" x2="560" y2="34" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <line class="sight" x1="62" y1="140" x2="560" y2="200" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <text x="40" y="30" class="lbl">Same angle at the eye, so the same apparent size. From this one point, and no other.</text>
  <text x="40" y="222" class="lbl">Give the viewer a second eye inside about ten metres and disparity reports the truth instead.</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / illusion</div>
${learnNav(esc, 'illusion')}
<h2>Designing something an audience accepts</h2>
<p class="lede">Perception is not a camera. It is a prediction machine constantly proposing the most likely world consistent with the evidence &mdash; which means an illusion is not a lie told to the eye. It is a plausible story the eye is allowed to finish, and the whole craft is about not handing over the evidence that makes a different story more likely.</p>

${S('The premise', 'The system is filling in constantly, and it does not tell you',
  ['Almost everything a person sees is inferred. There is a hole in each retina where the optic nerve leaves and nobody perceives a hole. Detail collapses within a few degrees of the centre of gaze and the world does not appear blurry at the edges. Colour is reconstructed from three overlapping detectors that do not measure wavelength. The system fills gaps continuously, confidently, and without flagging that it did.',
   'That is the resource. An illusion supplies a small amount of carefully chosen evidence and lets the machinery build the rest, and the reason the good ones feel solid rather than clever is that the audience did most of the construction themselves. It is also why the failures are so total: once a competing piece of evidence arrives, the machinery reruns and lands somewhere else, and there is no partial credit.',
   'Practically this yields one governing question, which is worth asking of every effect before it gets built. <em>What is the cheapest piece of evidence that would make the wrong answer more likely than the right one?</em> Usually it is a sightline, a reflection, a shadow that falls the wrong way, or a second look.'])}

${rule('You are not fooling an eye. You are supplying evidence to an inference engine, and it will use <b>everything else in the room</b> as well.')}

${S('Worked example one', 'Pepper’s ghost is a contrast problem wearing a geometry costume',
  ['A pane between the audience and the scene; something hidden, usually below, lit hard; its reflection appears standing in the space. The geometry is genuinely easy &mdash; the image sits as far behind the pane as the object sits in front of it, mirrored about the plane of the glass &mdash; and it is not where these fail.',
   'They fail on brightness, because the audience is receiving two light paths on the same retina at once. The ghost is the object&rsquo;s luminance multiplied by the pane&rsquo;s reflectance. The set is its own luminance multiplied by the pane&rsquo;s transmittance. Whether the figure reads as solid or as a smear on a window is the ratio between those two numbers and nothing else.',
   'Which gives you exactly two moves, and people reliably reach for the wrong one first. You can light the hidden object harder, which costs fixtures, power, heat and a performer standing in a punishing amount of light. Or you can darken what sits behind the ghost, which costs a conversation with the designer. Plain uncoated glass reflects about 8%, so it demands a very dark background; purpose-made stage foil runs far higher and buys back a lit set. <a href="/tools/#peppers">The calculator</a> does the ratio and tells you what each move would need to be.'])}

${fig(pgFig, 'Two paths, one retina. The ratio between them is the effect.')}

${S('Worked example two', 'Forced perspective, and the front row that ruins it',
  ['Two things look the same size when they subtend the same angle at the eye, and angle is size over distance. So an object twice as far away has to be twice as big to match. That is the entire arithmetic, and <a href="/tools/#forced">it is one line</a>.',
   'The interesting part is where it stops. Angular size is one depth cue among many, and the others are not obliged to agree with it. Binocular disparity &mdash; the difference between what two eyes see &mdash; resolves depth well out to roughly ten metres, and inside that range it simply overrules the size cue. Motion parallax does the same job for anybody who moves their head at all.',
   'So forced perspective is not really a statement about objects. It is a statement about the viewer: it works for one eye, at a distance, held still. Which is precisely a camera. A set that is flawless in the production photograph and collapses for the first three rows has not failed; it was only ever built for a viewpoint the audience was not sitting in, and nobody said so out loud.'])}

${fig(fpFig, 'One viewpoint, one eye, one distance. All three are conditions, not details.')}

<div class="tblscroll">
<table class="itable">
  <thead><tr><th>Technique</th><th>What the audience supplies</th><th>The evidence that kills it</th></tr></thead>
  <tbody>
    <tr><td>Pepper&rsquo;s ghost</td><td>That a bright figure in space is a physical object</td><td>Any light on the pane itself, or a background bright enough to show through</td></tr>
    <tr><td>Forced perspective</td><td>That equal angular size means equal size</td><td>A second eye, or a moving head, inside the stereo range</td></tr>
    <tr><td>Projection mapping</td><td>That light on a surface is the surface&rsquo;s own colour</td><td>Moving off the calibration viewpoint; ambient light raising the black level</td></tr>
    <tr><td>Scenic reveal</td><td>That what appeared was not there before</td><td>A sightline into the wing, or a shadow cast from the wrong side</td></tr>
    <tr><td>Body double / swap</td><td>Continuity of a person across a cut in attention</td><td>Being looked at continuously by anyone the misdirection missed</td></tr>
    <tr><td>Levitation</td><td>Absence of support</td><td>A specular highlight on the support, or a black that is not as black as its surround</td></tr>
  </tbody>
</table>
</div>

${S('Attention', 'The audience does not see what you did not point at',
  ['Misdirection has a bad reputation as a word, as though it were about deceiving somebody. Mechanically it is about <em>allocation</em>: attention is a limited resource with a single high-resolution centre, and the craft is deciding where it goes rather than preventing somebody from looking.',
   'The effects it exploits are well documented and slightly unnerving. Inattentional blindness means an unattended object can be looked directly at and not reported. Change blindness means a substantial alteration made during a saccade, a blink or a cut is very often missed entirely. And attention follows a small, reliable set of pulls: movement, faces, high contrast, the direction other people are looking, and anything that changes.',
   'Which turns misdirection into ordinary technical work. A followspot is an attention instrument. So is a blackout, so is a music sting, so is a performer looking stage left. The most robust reveals are built on a moment when attention was legitimately somewhere else for a reason the audience would endorse &mdash; which is also why an audience that has been given nothing to watch will find the thing you did not want them to.'])}

${bites([
  '<b>Building for the drawing rather than for the seat.</b> The plan view is a viewpoint nobody occupies. Check from the extreme seats, the boxes, and the standing rail before anything gets built.',
  '<b>Forgetting the camera.</b> An IMAG or broadcast feed is another viewpoint with different rules &mdash; longer lens, one eye, and a crop the audience does not have. Effects that work in the room can be exposed on the screen beside it.',
  '<b>Lighting the mechanism.</b> Black scenic is not black; it has a reflectance, and enough spill will find it. A support that is invisible in the plot goes visible when somebody adds a sidelight in tech.',
  '<b>Second looks.</b> Most illusions survive one look and not two. A reveal held too long is a reveal being examined.',
  '<b>Assuming the audience is where you left them.</b> In immersive and promenade work the viewpoint is not fixed at all, and every technique on this page assumes it is. That is the central technical problem of the form.',
])}

${S('The line', 'Fooled with consent is a different experience from fooled without',
  ['One distinction is worth keeping sharp, because everything on this page is a technique for making people believe something untrue.',
   'An audience at a show has agreed to it. That agreement is the whole basis of the pleasure &mdash; they know they are being worked on, they want to be, and the enjoyment includes admiring the work. That is a collaboration in which the audience is a participant rather than a mark, and the more skilful the technique the more they enjoy losing.',
   'The same techniques stop being that the moment the consent is not there. An effect nobody was warned about, a startle deployed on an audience that did not sign up for one, a simulated emergency, a use of somebody&rsquo;s likeness they did not agree to &mdash; the mechanism is identical and the experience is not. It is worth being able to say, of any effect, which side of that line it is on, and to notice that the answer sometimes depends on a sign at the door that somebody else is responsible for printing.'])}

${xnote('The reason a good illusion is satisfying rather than annoying is that the audience did most of the work. They were handed a small amount of evidence and they built the rest, and what they experience as wonder is partly the pleasure of their own machinery running well. That is worth protecting: an effect that explains itself too much, or holds too long, or arrives with a second look that resolves it, takes the construction away from them and keeps it. The craft is knowing how little to supply.')}

${S('Where this goes next', 'The mechanism underneath',
  ['<a href="/learn/perception/">The person on the other end</a> has the perceptual thresholds this page exploits &mdash; fusion, the cross-modal window, attention. <a href="/learn/senses/">How each sense tells things apart</a> has the depth cues, including the eight that forced perspective is competing against. <a href="/learn/presence/">Being somewhere</a> covers the other kind of illusion &mdash; owning a body and causing things &mdash; and why latency destroys it. And the two calculators here are <a href="/tools/#peppers">Pepper&rsquo;s ghost contrast</a> and <a href="/tools/#forced">forced perspective</a>.'])}
`

  return shell({
    title: 'Designing something an audience accepts — Pepper’s ghost, forced perspective and misdirection | showstack',
    description: 'Perception is a prediction machine, not a camera, so an illusion is a plausible story the eye is allowed to finish. The contrast ratio that decides whether a Pepper’s ghost reads as solid, why forced perspective collapses for the front row, and what attention actually follows.',
    canonical: `${SITE}/learn/illusion/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Designing something an audience accepts',
      url: `${SITE}/learn/illusion/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: `${MATH_TABLES}\n${MATH_SRC}\n`,
  })
}
