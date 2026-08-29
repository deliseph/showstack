/**
 * /learn/bits/ — sampling, bit depth, and what DSP actually does.
 *
 * Two ideas carry this page. The first is that bit depth is resolution, and
 * that the same fact explains 24-bit audio and 16-bit fixture control - two
 * subjects nobody ever puts in the same paragraph, which is exactly why the
 * connection lands.
 *
 * The second is that DSP is not a bag of mysterious effects. It is arithmetic
 * on a list of numbers, and there are about four operations. Delay is reading
 * an earlier index. Filtering is a weighted sum. Distortion is a lookup on a
 * curve. Reverb is a great many delays. Once that is said, "how does reverb
 * work" stops being a question about magic.
 *
 * Both interactives are quantisers, because seeing the staircase appear as
 * you drop the bits is the single most convincing thing on the page.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

export function learnBitsPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* sampling: a continuous wave, and the instants we actually keep */
@keyframes samp{0%,100%{opacity:.25;transform:translateY(0)}
50%{opacity:1;transform:translateY(-3px)}}
.sampfig .s{animation:samp 1.8s ease-in-out infinite}
${[...Array(12)].map((_, i) => `.sampfig .s${i + 1}{animation-delay:${(i * 0.12).toFixed(2)}s}`).join('')}
@keyframes travel{0%{transform:translateX(0)}100%{transform:translateX(38px)}}
.sampfig .wave{animation:travel 1.4s linear infinite}
/* delay line: write here, read from back there */
@keyframes tape{0%{transform:translateX(0)}100%{transform:translateX(-46px)}}
.dlyfig .buf{animation:tape 1.9s linear infinite}
@keyframes ping{0%,100%{opacity:.3;r:5}50%{opacity:1;r:8}}
.dlyfig .wr{animation:ping 1.9s ease-in-out infinite}
.dlyfig .rd{animation:ping 1.9s ease-in-out infinite;animation-delay:.4s}
/* reverb: one hit, early reflections, then a tail */
@keyframes hit{0%,88%{opacity:0}90%,100%{opacity:1}}
@keyframes er{0%{opacity:0}6%{opacity:1}40%{opacity:.35}70%,100%{opacity:0}}
.rvbfig .direct{animation:er 3.2s linear infinite}
${[...Array(6)].map((_, i) => `.rvbfig .e${i + 1}{animation:er 3.2s linear infinite;animation-delay:${(0.12 + i * 0.09).toFixed(2)}s}`).join('')}
${[...Array(14)].map((_, i) => `.rvbfig .t${i + 1}{animation:er 3.2s linear infinite;animation-delay:${(0.7 + i * 0.07).toFixed(2)}s}`).join('')}
/* the quantiser canvases */
.qbox{margin:14px 0 0;padding:14px;background:var(--panel);border:1px solid var(--line);
border-radius:var(--r-md)}
.qbox svg{display:block;width:100%;height:auto;max-width:640px;margin:0 auto}
.qbox .grid line{stroke:var(--line);stroke-width:.6}
/* pan step visual */
.panbox{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-top:14px}
.panbox > div{background:var(--panel);border:1px solid var(--line);border-radius:var(--r-md);padding:14px}
.panbox h5{margin:0 0 10px;font-family:var(--mono);font-size:11px;letter-spacing:.6px;text-transform:uppercase;
color:var(--dimmer)}
/* effect cards */
.fx{display:grid;grid-template-columns:repeat(auto-fit,minmax(232px,1fr));gap:13px;margin:18px 0}
.fx > div{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:15px}
.fx dt{font-family:var(--mono);font-size:11.5px;color:var(--accent);margin-bottom:7px}
.fx dd{margin:0;color:var(--dim);font-size:13.6px;line-height:1.58}
.fx dd b{color:var(--ink)}
.fx code{font-family:var(--mono);font-size:12px;color:var(--accent2);background:var(--panel);
padding:1px 5px;border-radius:4px}
`

  const sampFig = `
<svg viewBox="0 0 460 160" role="img" class="sampfig">
  <line x1="20" y1="86" x2="440" y2="86" stroke="var(--line)"/>
  <path class="wave" d="M-20 86 q19 -46 38 0 t38 0 t38 0 t38 0 t38 0 t38 0 t38 0 t38 0 t38 0 t38 0 t38 0 t38 0"
    fill="none" stroke="var(--dimmer)" stroke-width="1.6"/>
  ${[...Array(12)].map((_, i) => {
    const x = 32 + i * 34
    const y = 86 - Math.sin((i / 12) * Math.PI * 3) * 34
    return `<g class="s s${i + 1}"><line x1="${x}" y1="86" x2="${x}" y2="${y.toFixed(1)}" stroke="var(--accent)" stroke-width="1.6"/>
      <circle cx="${x}" cy="${y.toFixed(1)}" r="3.6" fill="var(--accent)"/></g>`
  }).join('')}
  <text x="230" y="134" class="lbl" font-size="9.5" text-anchor="middle">the wave is continuous; only the dots are kept</text>
  <text x="230" y="150" class="lbl" font-size="9.5" text-anchor="middle">how often is sample rate; how precisely is bit depth</text>
</svg>`

  const dlyFig = `
<svg viewBox="0 0 460 150" role="img" class="dlyfig">
  <rect x="30" y="46" width="400" height="42" rx="6" fill="var(--panel)" stroke="var(--line)"/>
  <g class="buf">${[...Array(20)].map((_, i) => `<line x1="${36 + i * 23}" y1="46" x2="${36 + i * 23}" y2="88" stroke="var(--line)" stroke-width=".8"/>`).join('')}</g>
  <circle class="wr" cx="396" cy="67" r="6" fill="var(--accent)"/>
  <text x="396" y="36" class="lbl" font-size="9" text-anchor="middle" fill="var(--accent)">write</text>
  <circle class="rd" cx="120" cy="67" r="6" fill="var(--accent2)"/>
  <text x="120" y="36" class="lbl" font-size="9" text-anchor="middle" fill="var(--accent2)">read, N samples ago</text>
  <text x="230" y="116" class="lbl" font-size="9.5" text-anchor="middle">a delay is a buffer and two pointers</text>
  <text x="230" y="134" class="lbl" font-size="9.5" text-anchor="middle">feed some of the output back to the input and you have an echo</text>
</svg>`

  const rvbFig = `
<svg viewBox="0 0 460 170" role="img" class="rvbfig">
  <line x1="24" y1="120" x2="440" y2="120" stroke="var(--line)"/>
  <g class="direct"><rect x="30" y="34" width="6" height="86" rx="2" fill="var(--accent)"/></g>
  <text x="33" y="146" class="lbl" font-size="8.5" text-anchor="middle">direct</text>
  ${[0, 1, 2, 3, 4, 5].map((i) => {
    const x = 68 + i * 22, h = 58 - i * 5
    return `<g class="e${i + 1}"><rect x="${x}" y="${120 - h}" width="5" height="${h}" rx="2" fill="var(--accent2)"/></g>`
  }).join('')}
  <text x="120" y="146" class="lbl" font-size="8.5" text-anchor="middle">early reflections</text>
  ${[...Array(14)].map((_, i) => {
    const x = 210 + i * 16, h = 34 * Math.exp(-i / 5.5)
    return `<g class="t${i + 1}"><rect x="${x}" y="${(120 - h).toFixed(1)}" width="4" height="${h.toFixed(1)}" rx="2" fill="var(--dimmer)"/></g>`
  }).join('')}
  <text x="316" y="146" class="lbl" font-size="8.5" text-anchor="middle">diffuse tail</text>
  <text x="230" y="164" class="lbl" font-size="9.5" text-anchor="middle">a room is a few distinct arrivals, and then a decaying mush of everything</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / bits</div>
${learnNav(esc, 'bits')}
<div class="lhero">
  <h2>Numbers that stand for signals</h2>
  <p class="lede">Sample rate is how often you write the value down. Bit depth is how precisely. That second one explains 24-bit audio and 16-bit fixture control — two things nobody puts in the same paragraph, and which are the same fact twice. Then a short list of arithmetic explains every effect you have ever used.</p>
</div>

${S('First', 'Sampling, and the one rule about it', [
  'A microphone produces a continuously varying voltage — see <a href="/learn/transducers/">transducers</a>. A converter measures it at fixed intervals and writes down a number each time. Everything digital that follows is operations on that list of numbers.',
  'The rule is <b>Nyquist</b>: to represent a frequency you must sample at more than twice it. 44.1 kHz — the rate <a href="/standards/aes3/">AES3</a> and consumer digital audio were built around — gets you just past 22 kHz, which is past the top of human hearing, which is why that number exists. Sample below twice a frequency and it does not simply vanish — it comes back as a <em>different, lower</em> frequency that was never in the original. That is aliasing, it is unrecoverable once it has happened, and it is why every converter has a filter in front of it removing anything above half the sample rate before it gets a chance.',
  'Higher sample rates buy headroom above hearing, gentler filters, and less latency in block-based processing. They do not buy detail inside the audible band that 48 kHz was missing.',
])}

${fig(sampFig, 'Only the dots survive. How often is sample rate; how precisely is bit depth.')}

${S('The one that matters more', 'Bit depth is resolution, and 6 dB per bit', [
  'Each sample has to be written down as a whole number, and bit depth decides how many distinct values are available. 8 bits gives 256. 16 bits gives 65,536. 24 bits gives about 16.7 million.',
  'The gap between one available value and the next is an error, and that error is noise. Add a bit, halve the gap, drop the noise by about 6 dB. So 16-bit gives roughly 96 dB of dynamic range and 24-bit roughly 144 dB — which is more than any converter, room or microphone on earth can actually deliver. 24-bit is not there because you can hear the bottom of it; it is there so that you can record conservatively, leave headroom, and still have a noise floor below the room.',
  'Drag the depth down and watch the staircase appear.',
])}

<div class="dial">
  <div class="d"><label for="bt-b">bit depth <b id="bt-bv">16 bit</b></label>
    <input id="bt-b" type="range" min="2" max="16" step="1" value="16"></div>
</div>
<div class="qbox">
  <svg viewBox="0 0 620 200" role="img" aria-label="A sine wave quantised to the selected bit depth">
    <g class="grid" id="bt-grid"></g>
    <path id="bt-smooth" fill="none" stroke="var(--dimmer)" stroke-width="1.4"/>
    <path id="bt-step" fill="none" stroke="var(--accent)" stroke-width="2"/>
  </svg>
</div>
<div class="verdict" id="bt-out"></div>

${S('The same idea, other side of the building', 'Why a moving light has a fine channel', [
  '<a href="/protocols/dmx512/">DMX</a> gives each channel <b>8 bits</b> — 256 steps. On a dimmer that is mostly acceptable and visibly not enough at the bottom of a slow fade, which is why fixtures apply dimming curves and better ones dim in 16 bits.',
  'On a moving head it is a real problem. A fixture that pans through 540° over 256 steps moves about <b>2.1° per step</b>. At the end of a long throw that is a beam jumping across the stage in visible increments, and no amount of console smoothing invents positions that the protocol cannot express.',
  'So fixtures offer 16-bit control: two channels for one parameter, a <em>coarse</em> and a <em>fine</em>, combined as <code>coarse × 256 + fine</code>. 65,536 steps, and the same 540° now resolves to about 0.008° — below anything an audience could see.',
  'It costs you a channel per parameter, which is why a fixture\'s extended mode has a much larger footprint. And it introduces a failure everyone meets once: if coarse and fine arrive from different sources, or one is patched and the other is not, the light jitters — because the fine channel is chasing a coarse value that keeps changing underneath it.',
])}

<div class="dial">
  <div class="d"><label for="pn-r">pan range <b id="pn-rv">540°</b></label>
    <input id="pn-r" type="range" min="90" max="630" step="10" value="540"></div>
  <div class="d"><label for="pn-d">throw distance <b id="pn-dv">20 m</b></label>
    <input id="pn-d" type="range" min="3" max="60" step="1" value="20"></div>
</div>
<div class="panbox">
  <div><h5>8-bit — one channel</h5><div class="verdict" id="pn-8" style="margin:0"></div></div>
  <div><h5>16-bit — coarse + fine</h5><div class="verdict" id="pn-16" style="margin:0"></div></div>
</div>

${rule('Bit depth is resolution, everywhere. <b>24-bit audio and 16-bit pan are the same decision</b> — buy enough steps that the quantisation is below what anyone can perceive, and stop.')}

${S('The one that confuses people', 'What 32-bit float actually buys', [
  'Fixed-point formats have a hard ceiling. Reach the largest number the format holds and there is nothing above it, so the waveform is cut flat — clipping, permanently, in the data.',
  '<b>32-bit floating point</b> stores a value and a separate exponent, so the <em>scale</em> moves with the signal. There is no fixed ceiling in any practical sense. Inside a mixing engine that means an internal gain stage can go far above nominal and come back down with nothing lost, which is why every modern DAW and digital desk works in float internally, whatever <a href="/protocols/dante/">Dante</a> or <a href="/protocols/madi/">MADI</a> is carrying between them.',
  'What it does <b>not</b> do is protect the input. The converter in front of it is fixed-point and has a real, physical ceiling. Overload that and it clips before the number is ever created — and no float format downstream can invent back a peak that was never captured.',
  'A 32-bit float <em>recorder</em> is a slightly different claim: those use two converters at different gains and combine them, so the recorder genuinely does have enormous usable range. That is a hardware trick, not a property of the number format, and worth knowing which one a spec sheet is selling you.',
])}

${S('Now the fun part', 'DSP is arithmetic on a list of numbers', [
  'Every effect on every processor you have used is built from a very short list of operations. There is nothing else in there.',
])}

<div class="fx">
  <div><dt>Delay</dt><dd>A buffer, a write pointer and a read pointer. Write the incoming sample; read the one from <code>N</code> samples ago. That is the whole thing, and <b>everything time-based is built on it</b>.</dd></div>
  <div><dt>Echo</dt><dd>A delay with <b>feedback</b>: some of the output added back into the input. Each pass round is quieter, which is why repeats decay. Feedback at or above unity is how a delay runs away.</dd></div>
  <div><dt>Filter / EQ</dt><dd>A weighted sum of the current sample and some previous ones — and, for IIR filters, previous outputs too. Change the weights and you change which frequencies survive. A tone control is a handful of multiplications.</dd></div>
  <div><dt>Distortion</dt><dd>A <b>non-linear transfer function</b>: output is no longer proportional to input. Look each sample up on a bent curve. Bending the curve creates harmonics that were not in the original, which is the entire sound.</dd></div>
  <div><dt>Compression</dt><dd>Not a sound, a <b>control loop</b>. Measure the level, compare it to a threshold, and apply a gain that changes over time — attack and release are how fast that gain is allowed to move.</dd></div>
  <div><dt>Reverb</dt><dd>A great many delays. Early reflections are individual short delays representing real surfaces; the tail is a network of delays feeding each other until the echoes are too dense to count.</dd></div>
</div>

${fig(dlyFig, 'A delay is a buffer and two pointers. Add feedback and it is an echo.')}

${S('Two of them in detail', 'What "fuzzy" is, and what reverb is doing', [
  '<b>Distortion.</b> A clean amplifier is linear: double the input, double the output. Push it past what it can do and the peaks flatten. Those flattened peaks are mathematically identical to the original wave plus a set of harmonics at multiples of its frequency — harmonics that were not in the source and that your ear reads as brightness, grit, warmth or harshness depending on which ones appeared.',
  'How the curve bends decides the character. A <b>soft</b> knee rounds the peaks and generates mostly low-order harmonics, which sit close to the original and sound like fullness. <b>Hard</b> clipping — a brick wall, which is what digital does natively — generates high-order harmonics that sound aggressive and, worse, land above half the sample rate and fold back down as inharmonic aliasing. That specific ugliness is the sound of digital distortion done without oversampling, and it is why good plug-ins run their non-linear stage at a multiple of the session rate.',
  '<b>Reverb.</b> A real room gives you the direct sound, then a handful of distinct early reflections off nearby surfaces, then an increasingly dense tail as reflections of reflections pile up. Algorithmic reverbs recreate that with networks of delays and all-pass filters — the classical Schroeder designs and modern feedback delay networks are both doing this.',
  '<b>Convolution</b> reverb takes another route: record a real space\'s response to an impulse, and mathematically apply that recording to your signal. It is exact for the space it was measured in, and it is fixed — you cannot make the hall bigger, because you did not model a hall, you photographed one.',
])}

${fig(rvbFig, 'Direct sound, a few distinct early reflections, then a tail too dense to separate.')}

${bites([
  '<b>Every process costs samples.</b> A block-based or linear-phase process cannot produce output until it has a whole block, and a look-ahead limiter is late by exactly its look-ahead. That latency is real and it lands in the <a href="/learn/systems/">system alignment</a>.',
  '<b>Aliasing is not a volume problem.</b> It is content that was never in the source, at frequencies unrelated to it, and no amount of turning down removes it after the fact.',
  '<b>Dither is not noise you are adding by mistake.</b> Reducing bit depth without it turns quantisation error into distortion correlated with the signal; a tiny bit of noise turns it back into ordinary hiss, which is far less audible.',
  '<b>16-bit fixture control needs both channels from the same source.</b> Coarse from a console and fine from anywhere else is a fixture that jitters and an afternoon lost.',
])}

${xnote('Resolution is only worth buying up to the point where a person stops being able to tell, and past that it is storage. But the failures are visible: a stepped fade and a jittering mover are both <b>the audience noticing the machinery</b>, which is the only quantisation error that costs anything.')}

${S('The through line', 'Why this page sits where it does', [
  'A sensor turns the world into a voltage — that is the <a href="/learn/transducers/">previous page</a>. A converter turns that voltage into numbers. Everything after it, in every department, is arithmetic on numbers: a filter, a delay, a fade, a pan value, a pixel.',
  'And at the end of that chain the numbers become a voltage again, and something physical moves — a cone, a yoke, an LED. The digital part of a show is a long detour between two analogue events, and the only questions that matter along it are how often you wrote the value down, how precisely, and what arithmetic you did in between.',
])}

<div class="cta"><strong>Want the numbers rather than the explanation?</strong>
<p>The <a href="/tools/">field tools</a> have the timecode, delay, SPL and processing-latency arithmetic as tested calculators, and the <a href="/protocols/">protocol index</a> has what each transport actually carries. This page is the part that makes those numbers mean something.</p></div>

<script>
(function(){
  // ---- bit depth quantiser -------------------------------------------
  var b=document.getElementById('bt-b');
  if(b){
    var bv=document.getElementById('bt-bv'), sm=document.getElementById('bt-smooth'),
        st=document.getElementById('bt-step'), gr=document.getElementById('bt-grid'),
        out=document.getElementById('bt-out');
    var W=620,H=200,MID=100,AMP=78;
    function y(t){ return MID - Math.sin(t*Math.PI*2*2)*AMP; }
    function draw(){
      var bits=Number(b.value), levels=Math.pow(2,bits), step=(AMP*2)/levels;
      bv.textContent=bits+' bit';
      var s='',q='';
      for(var i=0;i<=W;i+=2){
        var t=i/W, yy=y(t);
        s+=(i?'L':'M')+i+' '+yy.toFixed(1)+' ';
        var qv=MID-Math.round((MID-yy)/step)*step;
        q+=(i?'L':'M')+i+' '+qv.toFixed(1)+' ';
      }
      sm.setAttribute('d',s); st.setAttribute('d',q);
      // draw the available levels, but only while there are few enough to see
      var g='';
      if(levels<=64) for(var k=0;k<=levels;k++){
        var ly=(MID-AMP)+k*step;
        g+='<line x1="0" y1="'+ly.toFixed(1)+'" x2="'+W+'" y2="'+ly.toFixed(1)+'"/>';
      }
      gr.innerHTML=g;
      var dr=Math.round(bits*6.02);
      var note = bits<=4 ? '<span class="err">Nothing survives this.</span> The staircase is the signal now.'
        : bits<=8 ? 'Audibly stepped. This is where an 8-bit DMX dimmer lives, and why slow fades at low level look like a series of jumps.'
        : bits<=12 ? 'The steps are getting hard to see, and the error is turning into ordinary noise.'
        : '<span class="ok">Indistinguishable at this scale.</span> Which is the point — 16 bit already puts the error below the room.';
      out.innerHTML=levels.toLocaleString()+' available levels, about <b>'+dr+' dB</b> of dynamic range. '+note;
    }
    b.addEventListener('input',draw); draw();
  }
  // ---- 8-bit vs 16-bit pan -------------------------------------------
  var r=document.getElementById('pn-r'), d=document.getElementById('pn-d');
  if(r){
    var rv=document.getElementById('pn-rv'), dv=document.getElementById('pn-dv'),
        o8=document.getElementById('pn-8'), o16=document.getElementById('pn-16');
    function pan(){
      var deg=Number(r.value), dist=Number(d.value);
      rv.textContent=deg+'\\u00b0'; dv.textContent=dist+' m';
      function row(steps){
        var perStep=deg/steps;                       // degrees between adjacent values
        var mm=Math.tan(perStep*Math.PI/180)*dist*1000; // beam movement at the target
        return { deg:perStep, mm:mm };
      }
      var a=row(256), c=row(65536);
      o8.innerHTML='<b>'+a.deg.toFixed(2)+'\\u00b0</b> per step \\u2014 the beam jumps <b>'
        + (a.mm>=1000 ? (a.mm/1000).toFixed(2)+' m' : Math.round(a.mm)+' mm')
        + '</b> at '+dist+' m. <span class="err">Visible.</span>';
      o16.innerHTML='<b>'+c.deg.toFixed(4)+'\\u00b0</b> per step \\u2014 the beam jumps <b>'
        + (c.mm>=10 ? c.mm.toFixed(1)+' mm' : c.mm.toFixed(2)+' mm')
        + '</b> at '+dist+' m. <span class="ok">Below anything an audience can see.</span>';
    }
    r.addEventListener('input',pan); d.addEventListener('input',pan); pan();
  }
})();
</script>
`

  return shell({
    title: 'Numbers that stand for signals — sampling, bit depth and DSP | showstack',
    description: 'Why Nyquist sets the sample rate, why bit depth is 6 dB per bit and 24-bit audio and 16-bit fixture control are the same decision, what 32-bit float actually protects, and how delay, echo, reverb, filtering, distortion and compression are all arithmetic on a list of numbers.',
    canonical: `${SITE}/learn/bits/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Sampling, bit depth and digital signal processing',
      description: 'Sample rate and aliasing, bit depth as resolution in both audio and DMX fixture control, 32-bit float, and how delay, reverb, filtering, distortion and compression actually work.',
      url: `${SITE}/learn/bits/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
