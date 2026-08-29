/**
 * /learn/space/ — putting a sound somewhere, and what a waveform is made of.
 *
 * Three things this page exists to settle.
 *
 * POLARITY IS NOT PHASE, and the two words are used interchangeably by
 * people who know better. Polarity is a sign flip, identical at every
 * frequency, and reversible by a button. Phase is a time relationship that
 * differs at every frequency, and a polarity button will not fix it. Almost
 * every "the mics are out of phase" conversation on a stage is actually
 * about one or the other and rarely says which.
 *
 * WHAT A WAVEFORM IS MADE OF, because the four classic synthesiser shapes
 * have famously tidy harmonic recipes and those recipes explain both why
 * they sound as they do and — via the odd harmonics — why a square wave and
 * a switch-mode power supply are the same fact pointed at different jobs.
 *
 * AND THE THREE WAYS OF PUTTING A SOUND SOMEWHERE, which are not variations
 * of one idea. Amplitude panning fakes a direction for one listening
 * position. Wave field synthesis reconstructs the wavefront and therefore
 * works anywhere, at a cost that is calculable and brutal. Ambisonics
 * encodes a soundfield rather than speaker feeds. They fail differently and
 * the failure mode is how you choose.
 */
import { waveHarmonics, thd, vbapStereo, dbapGains, wfsAliasing, WAVE_SHAPES } from './toolmath.mjs'
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

const MATH_SRC = [waveHarmonics, thd, vbapStereo, dbapGains, wfsAliasing]
  .map((f) => f.toString()).join('\n\n')

/* waveHarmonics closes over this, so the page needs it as well as the
   function. A missing table is a silent ReferenceError at run time. */
const MATH_TABLES = `const WAVE_SHAPES = ${JSON.stringify(WAVE_SHAPES)};`

export function learnSpacePage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* Polarity is a mirror; phase is a slide. Drawing both makes the difference
   visible in a way two paragraphs do not. */
.polfig .wave{transition:d .25s ease}
@keyframes pol-slide{0%,100%{transform:translateX(0)}50%{transform:translateX(46px)}}
.polfig .sliding{animation:pol-slide 4s ease-in-out infinite}
.harm{display:flex;align-items:flex-end;gap:3px;height:96px;margin:14px 0 0;padding-bottom:4px;
border-bottom:1px solid var(--rule-strong)}
.harm span{flex:1 1 0;min-width:4px;background:var(--signal);border-radius:2px 2px 0 0;transition:height .2s ease}
.harm span[data-even="1"]{background:var(--rule-strong)}
.spgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px;margin:16px 0}
.spcard{border:1px solid var(--rule);border-radius:var(--r-md);padding:15px 17px;background:var(--surface-raised)}
.spcard b{display:block;font-size:15.5px;color:var(--ink);margin-bottom:3px}
.spcard i{display:block;font-style:normal;font-family:var(--mono);font-size:11px;letter-spacing:.4px;
text-transform:uppercase;color:var(--ink-faint);margin-bottom:8px}
.spcard p{margin:0 0 8px;color:var(--ink-muted);font-size:14px;line-height:1.55}
.spcard p:last-child{margin-bottom:0}
.spcard .fail{color:var(--warn);font-size:13px}
`

  const polFig = `
<svg viewBox="0 0 620 250" role="img" class="polfig">
  <text x="40" y="26" class="lbl">POLARITY &mdash; flipped, at every frequency at once</text>
  <line x1="40" y1="70" x2="580" y2="70" stroke="var(--rule)" stroke-width="1.5"/>
  <path d="M40 70 q27 -34 54 0 t54 0 t54 0 t54 0 t54 0 t54 0 t54 0 t54 0 t54 0"
        fill="none" stroke="var(--signal)" stroke-width="2.5"/>
  <path d="M40 70 q27 34 54 0 t54 0 t54 0 t54 0 t54 0 t54 0 t54 0 t54 0 t54 0"
        fill="none" stroke="var(--fail)" stroke-width="2.5" stroke-dasharray="6 5"/>
  <text x="584" y="66" class="lbl" text-anchor="end" style="fill:var(--fail)">a sign flip &mdash; one button undoes it</text>

  <text x="40" y="150" class="lbl">PHASE &mdash; slid in time, so the offset differs at every frequency</text>
  <line x1="40" y1="194" x2="580" y2="194" stroke="var(--rule)" stroke-width="1.5"/>
  <path d="M40 194 q27 -34 54 0 t54 0 t54 0 t54 0 t54 0 t54 0 t54 0 t54 0 t54 0"
        fill="none" stroke="var(--signal)" stroke-width="2.5"/>
  <g class="sliding">
    <path d="M40 194 q27 -34 54 0 t54 0 t54 0 t54 0 t54 0 t54 0 t54 0 t54 0"
          fill="none" stroke="var(--accent2)" stroke-width="2.5" stroke-dasharray="6 5"/>
  </g>
  <text x="40" y="240" class="lbl">A fixed delay is a different number of degrees at every frequency. No button fixes that.</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / space</div>
${learnNav(esc, 'space')}
<h2>Putting a sound somewhere</h2>
<p class="lede">Three things that get conflated constantly: polarity is not phase, a waveform is a recipe rather than a shape, and the ways of placing a sound in a room are not variations of one idea &mdash; they fail differently, and the failure is how you choose between them.</p>

${S('The confusion', 'Polarity is not phase',
  ['These two words are used interchangeably by people who know better, and the distinction is worth being pedantic about because the fix is different.',
   '<strong>Polarity</strong> is a sign flip. Every positive becomes negative and every negative positive, identically at every frequency, instantly. It is what the &oslash; button on a preamp does, what swapping pins 2 and 3 does, and what wiring a loudspeaker backwards does. It is completely reversible: press the button again and you are exactly where you were.',
   '<strong>Phase</strong> is a time relationship, and here is the part that matters &mdash; a fixed delay is a <em>different number of degrees at every frequency</em>. Three metres of air is about 8.7&nbsp;ms, which is a full cycle at 115&nbsp;Hz, half a cycle at 57&nbsp;Hz, and dozens of cycles at 4&nbsp;kHz. So two mics on one source are not &ldquo;out of phase&rdquo; by some amount you can dial out. They are in a different phase relationship at every single frequency, and the comb filtering that results has peaks and nulls spaced by the reciprocal of that delay.',
   'Which is why the polarity button sometimes helps and never fixes it. Flipping polarity turns every cancellation into a reinforcement and vice versa &mdash; it moves the comb rather than removing it, and whether that is an improvement depends entirely on where the nulls land relative to what you wanted to hear. The actual fix is time: move the microphone, or delay the other one. <a href="/tools/#delay">The speaker delay calculator</a> is the same arithmetic pointed at loudspeakers.'])}

${fig(polFig, 'Above: a sign flip, the same at every frequency. Below: a slide in time, which is not.')}

${rule('If a button fixes it, it was <b>polarity</b>. If it needs a delay or a tape measure, it was <b>phase</b>, and the amount is different at every frequency.')}

${bites([
  '<b>Reaching for &oslash; on a comb filter.</b> It moves the peaks and nulls; it does not remove them. Sometimes that is an improvement and it is never a fix.',
  '<b>A polarity error on one loudspeaker in an array.</b> The low end largely cancels where the coverage overlaps, and it reads as a room problem rather than a wiring one.',
  '<b>The 3:1 rule, misremembered.</b> It is about keeping the second microphone at least three times as far from a source as the first, so what leaks in is low enough that the comb filtering does not matter. It is a level rule dressed as a distance one.',
  '<b>Assuming a DI and a mic on the same instrument agree.</b> They are metres apart in time. That is phase, and it wants delay, not a button.',
])}

${S('The recipe', 'What a square, a saw and a triangle actually are',
  ['Every periodic wave is a sum of sines at whole multiples of its fundamental. That is not an approximation or a way of thinking about it &mdash; it is what the wave <em>is</em>, and the four classic synthesiser shapes have famously tidy recipes.',
   'A <strong>sine</strong> is the fundamental and nothing else, which is why it is featureless and why it is the only shape that survives any linear system unchanged. A <strong>sawtooth</strong> has every harmonic, falling off as 1/n, which makes it the brightest and the most useful raw material for subtractive synthesis &mdash; there is plenty there for a filter to remove. A <strong>square</strong> has odd harmonics only, also at 1/n: no octaves at all, which is exactly what makes it sound hollow and clarinet-ish rather than bright. And a <strong>triangle</strong> has odd harmonics at 1/n&sup2;, which falls away so fast that the third is already down at a ninth and the shape is very nearly a sine.',
   'The connection worth carrying off this page: those odd harmonics on a square include the <strong>third</strong>, which is a triplen &mdash; the same harmonic that arrives in phase on all three legs of a supply and <a href="/learn/power/">fills up a neutral conductor</a>. An oscillator generating a square wave and a switch-mode power supply drawing a spiky current are not analogous, they are the same fact pointed at different jobs, and the same arithmetic describes both.'])}

<div class="tryit">
  <div class="f"><label for="wf-shape">Shape</label>
    <select id="wf-shape">
      <option value="sine">sine</option><option value="square" selected>square</option>
      <option value="sawtooth">sawtooth</option><option value="triangle">triangle</option>
    </select></div>
</div>
<div class="harm" id="wf-bars" aria-hidden="true"></div>
<div class="readout" id="wf-out" role="status" aria-live="polite"></div>

${S('Making one', 'Subtractive, additive, FM, and why one of them won',
  ['<strong>Subtractive</strong> synthesis starts with something harmonically rich &mdash; a saw, usually &mdash; and takes away. A filter with a cutoff and a resonance removes the top, an envelope moves the cutoff over time, and that is most of the sound of electronic music. It won because it maps onto how the ear hears change: a filter sweep is a single gesture that alters an enormous number of harmonics at once, and it is one knob.',
   '<strong>Additive</strong> synthesis goes the other way, building a sound by summing sines with individual envelopes. It can theoretically make anything, and it is almost unusable by hand: a convincing sound needs dozens of partials each with their own amplitude curve, which is a lot of parameters for one note and no gesture that moves them together meaningfully.',
   '<strong>FM</strong> uses one oscillator to modulate the frequency of another. The result is a sideband spectrum that is not obvious from the controls at all &mdash; small changes in the modulation index reorganise the harmonic content wholesale, which is why FM is famous for metallic and bell-like sounds and for being difficult to steer. It is enormously efficient, which is why it appeared in hardware when memory and processing were expensive.',
   'All three are still around, and the distinction blurs in software where nothing costs what it used to. What survives is the ergonomic point: subtractive won not because it sounds better but because <em>one knob moves the whole spectrum in a way a person can predict</em>.'])}

${S('Placing it', 'Three ways, and they fail differently',
  ['Putting a sound somewhere in a room is not one problem with three solutions. It is three different bargains.'])}

<div class="spgrid">
  <div class="spcard"><i>Amplitude panning</i><b>VBAP and DBAP</b>
    <p>Share one signal between speakers by level, so the ear infers a direction between them. VBAP does it geometrically from a triangle of speakers; DBAP does it from distance without assuming where the listener is.</p>
    <p class="fail">Fails by moving. The image is correct at the point the geometry was drawn around and follows the listener everywhere else &mdash; a sweet spot rather than a location.</p></div>
  <div class="spcard"><i>Wave field synthesis</i><b>Reconstructing the wavefront</b>
    <p>Does not fake a direction. It rebuilds the wavefront a real source would have made, using an array of loudspeakers as a discrete sampling of a continuous surface, so the image really is at a place and stays there as you walk.</p>
    <p class="fail">Fails by frequency. The array is a spatial sampler, so it has a Nyquist limit: above <span class="mono">c / 2d</span> it aliases, and halving the spacing doubles both the limit and the loudspeaker count.</p></div>
  <div class="spcard"><i>Ambisonics</i><b>Encoding a soundfield</b>
    <p>Stores direction as spherical harmonics rather than as speaker feeds, so the same file decodes to any layout &mdash; a dome, a cube, or a pair of headphones. Higher orders carry more directional detail.</p>
    <p class="fail">Fails by order. First order is a smear; useful sharpness needs third order or above, and the channel count grows as (n+1)&sup2; &mdash; 16 channels for third order, 36 for fifth.</p></div>
  <div class="spcard"><i>Binaural</i><b>Rendering to two ears</b>
    <p>Applies the filtering a real head and ear would have imposed, so headphones can carry a full sphere. It is the only method that needs no speakers at all.</p>
    <p class="fail">Fails by head. Those filters are individual &mdash; someone else&rsquo;s ears give you their localisation, not yours &mdash; and without head tracking the world turns when you do.</p></div>
</div>

<div class="tryit">
  <div class="f"><label for="sp-ang">VBAP angle <span id="sp-angv">0&deg;</span></label>
    <input id="sp-ang" type="range" min="-30" max="30" value="0"></div>
  <div class="f"><label for="sp-sp">WFS spacing <span id="sp-spv">0.25 m</span></label>
    <input id="sp-sp" type="range" min="0.03" max="1" step="0.01" value="0.25"></div>
</div>
<div class="readout" id="sp-out" role="status" aria-live="polite"></div>

${rule('Amplitude panning fails by <b>moving</b>, wave field synthesis by <b>frequency</b>, ambisonics by <b>order</b> and binaural by <b>whose head it was measured on</b>. Pick the failure you can live with.')}

${bites([
  '<b>Equal-power panning read as equal-voltage.</b> Dead centre is &minus;3&nbsp;dB in each speaker, not &minus;6. Get that wrong and the middle of the image dips.',
  '<b>A WFS array specified without its aliasing frequency.</b> It is the number that decides the cost, and it is one division.',
  '<b>First-order ambisonics sold as immersive.</b> It is four channels and it is genuinely blurry. That is not a criticism of the format, it is what first order is.',
  '<b>Binaural on speakers.</b> The filters assume the sound arrives at each ear separately. Without crosstalk cancellation, played on speakers, it is just an odd-sounding stereo mix.',
])}

${xnote('All four of these are trying to produce one thing &mdash; the impression that a sound has a place &mdash; and an audience notices the failure long before it can name it. A sweet spot that moves as you lean is felt as the show being slightly unreal rather than as a panning artefact, and an aliasing array is heard as a hardness in the top end rather than as sampling theory. The technical choice here is really a choice about which seat is allowed to be right.')}

${S('Where this goes next', 'The calculators on this page',
  ['<a href="/tools/#wave">Waveform harmonics</a> shows the recipe for each shape and hands it to the distortion maths. <a href="/tools/#pan">VBAP and DBAP</a> does both panning laws, including the rolloff trade in DBAP. <a href="/tools/#wfs">Wave field synthesis</a> gives the aliasing frequency and what a target would cost in loudspeakers. And <a href="/learn/senses/">how each sense tells things apart</a> is why any of it works &mdash; two ears, a delay of a few hundred microseconds, and a great deal of inference.'])}
`

  const script = `
${MATH_TABLES}
${MATH_SRC}
(function(){
  var sel=document.getElementById('wf-shape');
  if(!sel)return;
  function draw(){
    var w=waveHarmonics(sel.value, 14);
    if(!w)return;
    var bars='<span style="height:100%" data-even="0"></span>';
    w.harmonics.forEach(function(h){
      bars+='<span style="height:'+Math.max(1,h.amplitude*100)+'%" data-even="'+(h.odd?'0':'1')+'"></span>';
    });
    document.getElementById('wf-bars').innerHTML=bars;
    var d=thd(w.relative);
    document.getElementById('wf-out').innerHTML=
      '<b>'+sel.value+'</b> &mdash; '+w.rolloff+'.<br>'
      /* A sine has no harmonics at all, so "odd harmonics only" is true and
         useless. Say what is actually there. */
      +(sel.value==='sine'?'No harmonics at all — this is the one shape a linear system passes unchanged.'
        :w.hasEvenHarmonics?'Every harmonic present.':'Odd harmonics only, so no octaves at all.')
      +' Third harmonic at <b>'+Math.round(w.thirdHarmonic*100)+'%</b>'
      +(d?', total harmonic distortion '+d.thdF+'%':'')+'.'
      +(w.thirdHarmonic>0.1?'<br><span class="dim">That third harmonic is a triplen — the same one that adds in a three-phase neutral.</span>':'');
  }
  sel.addEventListener('change',draw); draw();
})();
(function(){
  var a=document.getElementById('sp-ang'), s=document.getElementById('sp-sp');
  if(!a||!s)return;
  function draw(){
    var ang=Number(a.value), sp=Number(s.value);
    document.getElementById('sp-angv').textContent=ang+'°';
    document.getElementById('sp-spv').textContent=sp+' m';
    var v=vbapStereo(ang), w=wfsAliasing(sp);
    if(!v||!w)return;
    document.getElementById('sp-out').innerHTML=
      'Panned to '+ang+'°: L <b>'+v.left+'</b>, R <b>'+v.right+'</b> — power '+v.powerSum
      +', which is why centre is −3 dB each and not −6.<br>'
      +'A WFS array at '+sp+' m spacing aliases above <b>'+w.aliasingHz+' Hz</b>, and needs '
      +w.speakersPerMetre+' loudspeakers a metre. <span class="dim">'+w.verdict+'</span>';
  }
  a.addEventListener('input',draw); s.addEventListener('input',draw); draw();
})();
`

  return shell({
    title: 'Putting a sound somewhere — polarity, waveforms, VBAP, WFS and ambisonics | showstack',
    description: 'Polarity is a sign flip and phase is a time relationship that differs at every frequency, so a button fixes one and not the other. What a square, saw and triangle are actually made of. And the four ways of placing a sound in a room, which fail differently — by moving, by frequency, by order, and by whose head it was measured on.',
    canonical: `${SITE}/learn/space/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Putting a sound somewhere',
      url: `${SITE}/learn/space/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
