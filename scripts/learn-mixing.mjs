/**
 * /learn/mixing/ — colour as a physical process rather than as a number.
 *
 * /learn/colour/ already covers colour as data: hex, gamma, colour spaces,
 * chroma subsampling. It says nothing about what actually happens when two
 * beams land on the same wall, which is the thing a lighting department deals
 * with every day and the thing nobody is taught.
 *
 * The page turns on one distinction. Two completely different operations
 * share the word "mixing" and they are opposites: emitters ADD spectra and
 * filters MULTIPLY transmissions. Everything else here falls out of that —
 * why a CMY fixture gets dimmer as it gets more saturated, why red and green
 * make yellow when paint says otherwise, why a red costume goes black under a
 * green wash, and why two shadows from two sources come out coloured.
 *
 * The coloured shadow is the headline because it is the question people
 * actually ask, and because the answer is almost embarrassingly mechanical:
 * a shadow is not an absence of light, it is the light that still arrives.
 */
import { colourMix, mixWhites, srgbToLinear, linearToSrgb } from './toolmath.mjs'
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

const MATH_SRC = [srgbToLinear, linearToSrgb, colourMix, mixWhites].map((f) => f.toString()).join('\n\n')

export function learnMixingPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* Three overlapping discs, additive. The classic diagram, but drawn with
   real screen-blend arithmetic rather than hand-picked overlap colours. */
.addfig circle{mix-blend-mode:screen}
:root[data-theme="light"] .addfig .plate,
:root:not([data-theme="dark"]) .addfig .plate{fill:#000}
/* Subtractive: the same three discs multiplying instead of adding. */
.subfig circle{mix-blend-mode:multiply}
.subfig .plate{fill:#fff}
/* The shadow scene redraws from the mixer below it. */
.shadfig .beam{opacity:.32}
.mixgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,140px),1fr));gap:11px;margin:16px 0 0}
.mixsw{border:1px solid var(--rule-strong);border-radius:var(--r-sm);overflow:hidden;background:var(--surface-raised)}
.mixsw .chip{display:block;height:54px}
.mixsw b{display:block;font-family:var(--mono);font-size:10.5px;letter-spacing:.5px;text-transform:uppercase;
color:var(--ink-faint);padding:8px 10px 2px}
.mixsw em{display:block;font-style:normal;font-family:var(--mono);font-size:12.5px;color:var(--ink);padding:0 10px 9px}
.mtable{width:100%;border-collapse:collapse;font-size:14px;margin:14px 0}
.mtable th{text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;
color:var(--ink-faint);padding:0 12px 9px 0;border-bottom:1px solid var(--rule);font-weight:400}
.mtable td{padding:11px 12px 11px 0;border-bottom:1px solid var(--rule);vertical-align:top;
color:var(--ink-muted);line-height:1.55}
.mtable td:first-child{font-family:var(--mono);font-size:12.5px;color:var(--ink);white-space:nowrap}
.mtable td strong{color:var(--ink)}
.tblscroll{overflow-x:auto;margin:14px 0}
`

  const addFig = `
<svg viewBox="0 0 300 250" role="img" class="addfig">
  <rect class="plate" x="0" y="0" width="300" height="250" rx="8" fill="#000"/>
  <circle cx="150" cy="96" r="66" fill="#ff0000"/>
  <circle cx="112" cy="160" r="66" fill="#00ff00"/>
  <circle cx="188" cy="160" r="66" fill="#0000ff"/>
  <text x="150" y="240" class="lbl" text-anchor="middle">start at black, each source adds</text>
</svg>`

  const subFig = `
<svg viewBox="0 0 300 250" role="img" class="subfig">
  <rect class="plate" x="0" y="0" width="300" height="250" rx="8" fill="#fff"/>
  <circle cx="150" cy="96" r="66" fill="#00ffff"/>
  <circle cx="112" cy="160" r="66" fill="#ff00ff"/>
  <circle cx="188" cy="160" r="66" fill="#ffff00"/>
  <text x="150" y="240" class="lbl" text-anchor="middle">start at white, each filter takes away</text>
</svg>`

  const shadFig = `
<svg viewBox="0 0 620 270" role="img" class="shadfig">
  <rect x="40" y="30" width="540" height="180" rx="6" fill="var(--surface-sunken)" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <rect id="sf-wall" x="41" y="31" width="538" height="178" rx="5" fill="#888"/>
  <polygon id="sf-beam1" class="beam" points="96,18 300,120 96,222" fill="#ff8c28"/>
  <polygon id="sf-beam2" class="beam" points="524,18 320,120 524,222" fill="#285aff"/>
  <rect id="sf-shadow1" x="330" y="66" width="66" height="108" rx="3" fill="#285aff"/>
  <rect id="sf-shadow2" x="224" y="66" width="66" height="108" rx="3" fill="#ff8c28"/>
  <rect x="296" y="66" width="28" height="108" rx="3" fill="var(--ink)" opacity=".92"/>
  <text x="310" y="188" class="lbl" text-anchor="middle" style="fill:var(--surface)">object</text>
  <circle id="sf-lamp1" cx="86" cy="120" r="13" fill="#ff8c28" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <circle id="sf-lamp2" cx="534" cy="120" r="13" fill="#285aff" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <text x="86" y="152" class="lbl" text-anchor="middle">source 1</text>
  <text x="534" y="152" class="lbl" text-anchor="middle">source 2</text>
  <text x="40" y="240" class="lbl">Neither shadow is grey. Each one is lit by the source the object did not block.</text>
  <text x="40" y="258" class="lbl">Where both reach, you get the sum &mdash; which is why the wall between them is brighter than either.</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / mixing</div>
${learnNav(esc, 'mixing')}
<h2>Why the shadow is blue</h2>
<p class="lede">Two completely different operations share the word &ldquo;mixing&rdquo; and they are opposites. Get that one distinction straight and the rest of colour on a stage stops being surprising &mdash; including why a red costume can go black, and why a shadow is almost never grey.</p>

${S('The distinction', 'Adding light, and taking it away',
  ['<strong>Additive</strong> mixing is what emitters do. Two lamps pointed at the same wall each deliver their own spectrum and the wall receives the sum. You start at black &mdash; no light &mdash; and every source you bring up adds. Red plus green is yellow, which is nonsense with paint and obvious with light: the surface is receiving long wavelengths and medium wavelengths at once, and the eye has no way to tell that apart from a genuine yellow.',
   '<strong>Subtractive</strong> mixing is what filters do. One white source passes through things that each <em>remove</em> part of the spectrum. Removal is multiplication, not addition: a filter passing 40% of the red and a second passing 50% of it gives 20%, not 90%. You start at white and take away, and if you stack enough you get black.',
   'The practical consequence follows immediately and it catches everybody once. On an additive fixture, saturation is free &mdash; a deep blue costs you the red and green emitters, which were not doing much for a blue anyway. On a subtractive fixture, <em>saturation costs output</em>. Every step deeper is another chunk of the spectrum thrown away as heat, which is why a CMY unit at a deep congo is a fraction of its own datasheet and why the same colour on an LED unit next to it looks like a different fixture.'])}

<div class="figrow">
  ${fig(addFig, 'Additive: three emitters. Where all three overlap, white.')}
  ${fig(subFig, 'Subtractive: three filters. Where all three overlap, black.')}
</div>

${rule('Emitters <b>add</b> spectra; filters <b>multiply</b> transmissions. Everything else on this page is a consequence of that one sentence.')}

${S('The question everyone asks', 'A shadow is not an absence of light',
  ['Point a warm source at an object from one side and a blue one from the other, and you get two shadows, one blue and one orange, and neither of them is grey. People find this uncanny, and the explanation is almost disappointingly mechanical.',
   'A shadow is not darkness. It is the set of sources that still reach the surface. The object blocks the warm source in one direction, so that patch of wall is lit by the blue source and by nothing else &mdash; so it is blue. Exactly, precisely blue: the same colour the blue source is, at whatever level it arrives. The other shadow is orange for the same reason. Where neither is blocked you get both, which is why the wall between the two shadows is brighter than either shadow and closer to white than either source.',
   'That is the whole physical story, and you can watch it below. There is a second reason shadows read coloured, and it is perceptual rather than physical: the visual system continuously re-normalises to whatever illuminant dominates, so under a strong warm key a genuinely neutral shadow is <em>seen</em> as blue because it is bluer than the thing your eye has adapted to. Both effects are real and they compound, which is why a warm key with an ordinary white fill produces shadows people insist are blue on film that measures neutral.'])}

${fig(shadFig, 'The two sources below drive this. Change either and both shadows change.')}

<div class="tryit">
  <div class="f"><label for="mf-c1">Source 1</label><input id="mf-c1" type="color" value="#ff8c28"></div>
  <div class="f"><label for="mf-l1">at <span id="mf-l1v">100%</span></label><input id="mf-l1" type="range" min="0" max="100" value="100"></div>
  <div class="f"><label for="mf-c2">Source 2</label><input id="mf-c2" type="color" value="#285aff"></div>
  <div class="f"><label for="mf-l2">at <span id="mf-l2v">100%</span></label><input id="mf-l2" type="range" min="0" max="100" value="100"></div>
</div>
<div class="mixgrid" id="mf-sw"></div>
<div class="readout" id="mf-out" role="status" aria-live="polite"></div>

${rule('Turn one source off and its shadow stops being coloured &mdash; it becomes the <b>only</b> shadow, and a genuinely black one. Coloured shadows need at least two sources by definition.')}

${bites([
  '<b>Chasing a grey shadow with a third fixture.</b> Adding light to a coloured shadow does not neutralise it, it adds to it. If you want a neutral shadow you need the fill to be the same colour as the key, not brighter.',
  '<b>Forgetting the audience is adapted too.</b> A whole scene under a warm wash reads as white to a settled eye. The shadow that measured neutral is the one that will look blue, and a camera will not agree with anybody in the room.',
  '<b>Mixing in code values.</b> Two fixtures at 50% do not make one at 100%. In light, 128 is about 22%, so two of them come to 44%, which encodes to 176 &mdash; visibly short of white. The arithmetic has to happen in linear light. <a href="/learn/colour/">Why 128 is not half &rarr;</a>',
  '<b>Reading clipping as brightness.</b> Once a channel is at full, pushing the others changes hue, not level. A fixture that looks like it stopped getting brighter has usually run out of one emitter.',
])}

${S('Inside the fixture', 'Flags in a beam, or a handful of emitters',
  ['Two architectures do the same job and they fail differently, which is why a rig with both in it never quite matches.',
   'A <strong>CMY</strong> unit is subtractive. One white source &mdash; discharge or a white LED engine &mdash; and three dichroic flags that slide progressively into the beam, each removing one third of the spectrum. Dichroic means the filter reflects what it does not pass rather than absorbing it, which is how it survives being in a beam that would burn a gel to ash in seconds. The mixing is continuous and smooth, the pastel end is beautiful, and the deep end is dim.',
   'A <strong>multi-emitter LED</strong> unit is additive. Several colours of LED, driven independently, summing in a mixing chamber. Three emitters can technically reach a lot of colours, and the reason nobody ships three is that the spectrum between them is empty: an RGB source has almost no energy in the yellows and cyans, so anything reflecting there goes dead. So manufacturers keep adding emitters &mdash; white for output and pastels, amber for warmth and skin, lime for the enormous luminance gain green-yellow gives you, cyan and royal for the gap at the blue end.',
   'The consequence for a programmer is that the same numbers do not mean the same thing on two fixtures. A colour picked on a CMY unit and sent to an LED unit lands somewhere else, because the fixtures got there by different routes through different spectra, and any calibration is a fit rather than an equivalence.'])}

<div class="tblscroll">
<table class="mtable">
  <thead><tr><th>Emitter</th><th>Why it is in there</th><th>What it costs</th></tr></thead>
  <tbody>
    <tr><td>R G B</td><td>The corners. Maximum saturation, widest gamut boundary.</td><td>Almost nothing between them &mdash; a spectrum full of holes</td></tr>
    <tr><td>+ White</td><td>Output and clean pastels without pushing three emitters</td><td>Which white? The choice fixes the fixture&rsquo;s native CCT</td></tr>
    <tr><td>+ Amber</td><td>Warmth, skin, and the tungsten end nobody reaches with RGB</td><td>Another channel, and a hue that is easy to overdo</td></tr>
    <tr><td>+ Lime</td><td>Green-yellow is where luminance lives &mdash; a big output gain</td><td>Ugly on its own; a mixing ingredient, not a colour</td></tr>
    <tr><td>+ Cyan / royal</td><td>Fills the hole between blue and green</td><td>Cost, size, and yet another calibration axis</td></tr>
  </tbody>
</table>
</div>

${S('The costume', 'An object can only reflect what it is given',
  ['A red costume under a saturated green wash does not go dark red. It goes black &mdash; and the first time it happens in a tech run somebody blames the fixture.',
   'What you see from a surface is its reflectance multiplied by the source&rsquo;s spectrum, wavelength by wavelength. A red dye reflects long wavelengths and absorbs the rest. A saturated green LED emits almost nothing in the long wavelengths. Multiply the two and there is nothing left to come back. The costume is not dark; it is receiving no light it is capable of returning.',
   'This is why reflectance and transmission are the same arithmetic and the <a href="/tools/#mix">mixing tool</a> answers both with one calculation: put a source and a costume in subtractive mode and you get exactly what comes off the fabric. And it is why the fix is never &ldquo;more light&rdquo;. Four times the green wash returns four times nothing. What the costume needs is a source with energy where it reflects, which is a design decision made at fixture-selection time, not a level change made at 11pm.'])}

${rule('If the source has no energy where the object reflects, <b>no amount of intensity will bring it back</b>. Level is the wrong knob.')}

${S('The disagreement', 'Metamerism, and why the camera says otherwise',
  ['Two lights can look identical and be made of completely different spectra. The eye has three cone types, so it collapses an entire spectrum into three numbers, and a great many different spectra collapse to the same three. Two such spectra are <em>metamers</em>: indistinguishable to a human, and not remotely the same physical thing.',
   'That is a convenience right up until something else looks at them. A camera has its own three sensitivity curves and they are not the eye&rsquo;s, so it collapses the same spectra differently &mdash; and two sources that matched by eye come out visibly apart on the feed. This is the mechanism behind the classic argument in a tech: an LED wall and a lighting fixture matched carefully by eye, clashing on the broadcast output, with everybody certain the other department has it wrong. Both are seeing what they say they are seeing.',
   'It also runs the other way, across objects rather than sources. Two pieces of costume that match under the workroom&rsquo;s fluorescents can separate under a narrowband LED wash, because they were only ever metamers under one spectrum. Matching fabric under the light it will actually be seen in is not fussiness, it is the only test that means anything.'])}

${bites([
  '<b>Matching by eye and delivering to camera.</b> If there is a feed, match on the feed. The eye is not the customer.',
  '<b>Approving fabric under the wrong light.</b> A metameric match is a match under one spectrum only. Take the samples into the rig.',
  '<b>Trusting a colour picker across fixture types.</b> A CMY unit and an LED unit reach the same picker value by different spectral routes. They will not match, and calibration narrows it rather than fixing it.',
])}

${S('Asking for better', 'CRI, R9 and what TM-30 adds',
  ['CRI is one number summarising how faithfully a source renders a set of test colours against a reference. It is old, the sample set is pale, and averaging eight pastel patches hides exactly the failure that matters on a stage: <strong>R9</strong>, the deep red sample, is not in the average at all. A source can post CRI 95 and still be poor at R9, which shows up immediately as bad skin, dead reds, and a flat look nobody can fix with gel.',
   'TM-30 replaces the summary with two numbers and a picture. <strong>Rf</strong> is fidelity &mdash; how close to the reference, on 99 samples rather than eight. <strong>Rg</strong> is gamut &mdash; whether the source expands or compresses saturation relative to the reference. High Rf with low Rg is a source that is accurate and flat. High Rg is a source that makes everything look more colourful than it is, which some people like and which is still a distortion.',
   'What to actually ask a manufacturer for: Rf and Rg, R9 stated separately from CRI, and the spectral power distribution if they will publish it. And then look at the fixture next to a face, because the reason all of these metrics keep getting replaced is that none of them fully predicts what skin does.'])}

${xnote('Colour is the fastest emotional lever on a stage and it works below the level anybody narrates to themselves. An audience does not think &ldquo;that shadow is blue&rdquo;; they experience a scene as cold. The mechanisms on this page are the ones that decide whether that lever lands where you aimed it &mdash; a costume that reads as intended, a face that looks like a person, a shadow that does what the designer drew. Getting the physics right is not pedantry here; it is the difference between a look that carries and one that has to be explained.')}

${S('Where this goes next', 'The calculators on this page',
  ['<a href="/tools/#mix">Colour mixing and shadows</a> does both operations in linear light and shows what each source&rsquo;s shadow will be. <a href="/tools/#whites">Mixing colour temperatures</a> works the mired arithmetic and warns about the off-locus green shift. <a href="/tools/#mired">Gel correction</a> picks the filter that gets one source to another. And <a href="/learn/colour/">how a colour becomes a number</a> is the other half of this &mdash; what happens once the light has been turned into data.'])}
`

  const script = `
${MATH_SRC}
(function(){
  var c1=document.getElementById('mf-c1'), l1=document.getElementById('mf-l1');
  var c2=document.getElementById('mf-c2'), l2=document.getElementById('mf-l2');
  if(!c1||!c2)return;
  function rgb(h){return {r:parseInt(h.slice(1,3),16),g:parseInt(h.slice(3,5),16),b:parseInt(h.slice(5,7),16)}}
  function draw(){
    var lv1=Number(l1.value)/100, lv2=Number(l2.value)/100;
    document.getElementById('mf-l1v').textContent=Math.round(lv1*100)+'%';
    document.getElementById('mf-l2v').textContent=Math.round(lv2*100)+'%';
    var src=[];
    if(lv1>0)src.push(Object.assign(rgb(c1.value),{level:lv1,name:'source 1',n:1}));
    if(lv2>0)src.push(Object.assign(rgb(c2.value),{level:lv2,name:'source 2',n:2}));
    var wall=document.getElementById('sf-wall');
    var sh1=document.getElementById('sf-shadow1'), sh2=document.getElementById('sf-shadow2');
    var b1=document.getElementById('sf-beam1'), b2=document.getElementById('sf-beam2');
    var lamp1=document.getElementById('sf-lamp1'), lamp2=document.getElementById('sf-lamp2');
    b1.setAttribute('fill',c1.value); b2.setAttribute('fill',c2.value);
    lamp1.setAttribute('fill',lv1>0?c1.value:'var(--surface-sunken)');
    lamp2.setAttribute('fill',lv2>0?c2.value:'var(--surface-sunken)');
    if(!src.length){
      wall.setAttribute('fill','#000');
      sh1.setAttribute('fill','#000'); sh2.setAttribute('fill','#000');
      document.getElementById('mf-sw').innerHTML='';
      document.getElementById('mf-out').innerHTML='Both sources are out. Everything is black, shadows included &mdash; which is the only time a shadow really is an absence of light.';
      return;
    }
    var m=colourMix(src,'additive');
    wall.setAttribute('fill',m.hex);
    /* The shadow of source 1 is what source 2 still delivers, and vice versa.
       With one source up, both shadow patches are the same black. */
    var s1=m.shadowOf(src.findIndex(function(s){return s.n===1}));
    var s2=m.shadowOf(src.findIndex(function(s){return s.n===2}));
    sh1.setAttribute('fill', s1?s1.hex:m.hex);
    sh2.setAttribute('fill', s2?s2.hex:m.hex);
    var sw='<div class="mixsw"><span class="chip" style="background:'+m.hex+'"></span><b>lit wall</b><em>'+m.hex+'</em></div>';
    if(s1)sw+='<div class="mixsw"><span class="chip" style="background:'+s1.hex+'"></span><b>shadow of 1</b><em>'+(s1.black?'black':s1.hex)+'</em></div>';
    if(s2)sw+='<div class="mixsw"><span class="chip" style="background:'+s2.hex+'"></span><b>shadow of 2</b><em>'+(s2.black?'black':s2.hex)+'</em></div>';
    document.getElementById('mf-sw').innerHTML=sw;
    var out=document.getElementById('mf-out');
    if(src.length<2){
      out.innerHTML='One source up. Its shadow is <b>genuinely black</b> &mdash; there is nothing else reaching that patch of wall. Bring the other up and the shadow takes its colour.';
    } else {
      out.innerHTML='The wall is <b>'+m.hex+'</b>, the sum of both. '
        +'The shadow of source 1 is <b>'+s1.hex+'</b>, which is exactly source 2 and nothing else; '
        +'the shadow of source 2 is <b>'+s2.hex+'</b>. Neither is grey, and neither is darker than it is coloured.'
        +(m.clipped?'<br>The lit wall is clipped: a channel is at full, so pushing further shifts the hue rather than adding light.':'');
    }
  }
  [c1,c2,l1,l2].forEach(function(el){el.addEventListener('input',draw)});
  draw();
})();
`

  return shell({
    title: 'Why the shadow is blue — additive and subtractive colour mixing | showstack',
    description: 'Emitters add spectra and filters multiply transmissions, and every surprise in stage colour follows from that one distinction: why a deep colour on a CMY fixture is a dim one, why a red costume goes black under green, why two sources cast two coloured shadows, and why the camera disagrees with your eye.',
    canonical: `${SITE}/learn/mixing/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Why the shadow is blue',
      url: `${SITE}/learn/mixing/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
