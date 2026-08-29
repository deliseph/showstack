/**
 * /learn/neuro/ — the brain as a signal system.
 *
 * This is the page that closes the loop on the whole site. Every other page
 * describes a chain: something is transduced into a signal, encoded, carried
 * with a latency budget, decoded, and turned back into something physical. A
 * nervous system is that same chain, and once it is drawn that way the two
 * halves of this website stop being separate subjects.
 *
 * It also earns the two things people actually ask about — controlling
 * something with brain activity, and giving somebody back a sense they lost.
 * Both are engineering problems with honest, unglamorous limits, and the
 * limits are the interesting part. The bit rate of a non-invasive BCI is
 * measured in bits per minute; a cochlear implant carries roughly two dozen
 * channels where an ear has thousands. Saying so plainly is more useful than
 * any amount of enthusiasm.
 *
 * Nothing here is medical advice and the page says so.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

export function learnNeuroPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* everything becomes the same currency */
@keyframes spike-run{from{stroke-dashoffset:0}to{stroke-dashoffset:-36}}
.transfig .train{stroke-dasharray:3 9;animation:spike-run 1.1s linear infinite}
.transfig .train.t2{animation-duration:1.35s}
.transfig .train.t3{animation-duration:.9s}
@keyframes src-on{0%,100%{opacity:.3}20%,40%{opacity:1}}
.transfig .src{animation:src-on 4.5s ease-in-out infinite}
.transfig .src.s2{animation-delay:1.5s}
.transfig .src.s3{animation-delay:3s}
/* SSVEP: two flicker rates, the attended one shows up downstream */
@keyframes fl-a{0%,49%{opacity:1}50%,100%{opacity:.32}}
@keyframes fl-b{0%,32%{opacity:1}33%,100%{opacity:.32}}
.ssvepfig .fa{animation:fl-a .9s steps(1,end) infinite}
.ssvepfig .fb{animation:fl-b .62s steps(1,end) infinite}
@keyframes trace{from{stroke-dashoffset:400}to{stroke-dashoffset:0}}
.ssvepfig .tr{stroke-dasharray:400;animation:trace 3s linear infinite}
@media(prefers-reduced-motion:reduce){.ssvepfig .fa,.ssvepfig .fb{animation:none;opacity:.7}}
/* substitution: camera to a coarse grid to cortex */
@keyframes cell{0%,100%{opacity:.16}}
@keyframes cell-on{0%,8%{opacity:.9}30%,100%{opacity:.16}}
.subfig .c{animation:cell-on 2.6s ease-in-out infinite}
@keyframes hop{0%{transform:translateX(0);opacity:0}10%{opacity:1}
80%{transform:translateX(226px);opacity:1}88%,100%{opacity:0}}
.subfig .pkt{animation:hop 2.6s linear infinite}
/* the two block diagrams, side by side */
.blocks{display:grid;grid-template-columns:1fr;gap:0;border:1px solid var(--line);
border-radius:var(--r-md);overflow:hidden;margin:18px 0}
.blocks > div{padding:16px 17px;border-bottom:1px solid var(--line)}
.blocks > div:last-child{border-bottom:none}
.blocks h4{margin:0 0 11px;font-family:var(--mono);font-size:11px;letter-spacing:.6px;text-transform:uppercase}
.blocks > div:first-child h4{color:var(--accent)}
.blocks > div:last-child h4{color:var(--accent2)}
.bchain{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-family:var(--mono);font-size:11.5px}
.bchain b{border:1px solid var(--line);border-radius:6px;padding:6px 10px;color:var(--dim);
font-weight:400;background:var(--panel)}
.bchain i{color:var(--dimmer);font-style:normal}
.blocks > div:first-child .bchain b{border-color:color-mix(in srgb,var(--accent) 40%,var(--line))}
.blocks > div:last-child .bchain b{border-color:color-mix(in srgb,var(--accent2) 40%,var(--line))}
/* bandwidth comparison bars */
.bw{margin:16px 0}
.bwrow{display:grid;grid-template-columns:minmax(120px,180px) 1fr auto;gap:12px;align-items:center;
padding:9px 0;border-bottom:1px solid var(--line);font-size:14px}
.bwrow:last-child{border-bottom:none}
.bwrow .n{color:var(--ink)}
.bwrow .track{height:9px;border-radius:5px;background:var(--panel2);overflow:hidden;min-width:40px}
.bwrow .track i{display:block;height:100%;background:var(--accent);border-radius:5px}
.bwrow .v{font-family:var(--mono);font-size:12px;color:var(--accent2);white-space:nowrap}
.bwrow.dim .track i{background:var(--dimmer)}
@media(max-width:560px){.bwrow{grid-template-columns:1fr auto;gap:4px 10px}
.bwrow .track{grid-column:1 / -1;order:3}}
/* paradigm cards */
.para{display:grid;grid-template-columns:repeat(auto-fit,minmax(228px,1fr));gap:14px;margin:18px 0}
.para div{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:16px}
.para dt{font-family:var(--mono);font-size:11.5px;color:var(--accent);letter-spacing:.5px;margin-bottom:8px}
.para dd{margin:0;color:var(--dim);font-size:13.8px;line-height:1.6}
.para dd b{color:var(--ink)}
.caveat{border:1px solid color-mix(in srgb,var(--warn) 38%,transparent);
background:color-mix(in srgb,var(--warn) 7%,transparent);border-radius:var(--r-sm);padding:15px 17px;
margin:20px 0;font-size:14.5px;color:var(--dim);line-height:1.65}
.caveat b{color:var(--warn)}
`

  const transFig = `
<svg viewBox="0 0 460 200" role="img" class="transfig">
  ${[
    ['s1', 26, 'photons', 'retina', 'var(--dom-control)'],
    ['s2', 82, 'pressure waves', 'cochlea', 'var(--dom-audio)'],
    ['s3', 138, 'skin deformation', 'mechanoreceptor', 'var(--accent2)'],
  ].map(([c, y, a, b, col]) => `
  <g class="src ${c}">
    <text x="12" y="${y + 14}" class="lbl" font-size="9.5">${a}</text>
    <rect x="118" y="${y}" width="96" height="26" rx="5" fill="var(--panel)" stroke="${col}" stroke-width="1.3"/>
    <text x="166" y="${y + 17}" class="lbl" font-size="9" text-anchor="middle">${b}</text>
  </g>
  <path class="train${c === 's2' ? ' t2' : c === 's3' ? ' t3' : ''}" d="M218 ${y + 13} L332 ${y + 13}"
    stroke="var(--accent)" stroke-width="2" fill="none"/>`).join('')}
  <rect x="336" y="26" width="106" height="138" rx="10" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.6"/>
  <text x="389" y="88" class="val" font-size="12" text-anchor="middle" fill="var(--accent)">CORTEX</text>
  <text x="389" y="106" class="lbl" font-size="9" text-anchor="middle">never receives light,</text>
  <text x="389" y="119" class="lbl" font-size="9" text-anchor="middle">sound or pressure</text>
  <text x="230" y="190" class="lbl" text-anchor="middle" font-size="9.5">three different physics, one currency: trains of impulses</text>
</svg>`

  const ssvepFig = `
<svg viewBox="0 0 460 190" role="img" class="ssvepfig">
  <rect class="fa" x="30" y="24" width="72" height="72" rx="8" fill="var(--accent)"/>
  <text x="66" y="112" class="lbl" font-size="9.5" text-anchor="middle">10 Hz</text>
  <rect class="fb" x="132" y="24" width="72" height="72" rx="8" fill="var(--accent2)"/>
  <text x="168" y="112" class="lbl" font-size="9.5" text-anchor="middle">15 Hz</text>
  <text x="117" y="16" class="lbl" font-size="9.5" text-anchor="middle">two targets, two rates</text>
  <path d="M214 60 L262 60" stroke="var(--dimmer)" stroke-width="1.3" stroke-dasharray="3 4"/>
  <text x="238" y="52" class="lbl" font-size="8.5" text-anchor="middle">attend</text>
  <rect x="266" y="20" width="176" height="82" rx="8" fill="var(--panel)" stroke="var(--line)"/>
  <path class="tr" d="M276 60 q6 -22 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0"
    fill="none" stroke="var(--accent)" stroke-width="1.8"/>
  <text x="354" y="94" class="lbl" font-size="9" text-anchor="middle">carries the rate you looked at</text>
  <text x="230" y="150" class="lbl" text-anchor="middle" font-size="9.5">no thought is read — an attended flicker rate is detected</text>
  <text x="230" y="168" class="lbl" text-anchor="middle" font-size="9.5">which is a signal-processing result, and a reliable one</text>
</svg>`

  const subFig = `
<svg viewBox="0 0 460 180" role="img" class="subfig">
  <rect x="14" y="52" width="62" height="42" rx="6" fill="var(--panel)" stroke="var(--dom-visual)"/>
  <text x="45" y="77" class="lbl" font-size="9" text-anchor="middle">CAMERA</text>
  <g class="pkt"><rect x="80" y="66" width="26" height="12" rx="3" fill="var(--accent)"/></g>
  <g>
    ${Array.from({ length: 36 }, (_, i) => {
      const r = Math.floor(i / 6), c = i % 6
      const on = [7, 8, 9, 13, 16, 19, 22, 25, 26, 27].includes(i)
      return `<rect class="${on ? 'c' : ''}" x="${310 + c * 17}" y="${44 + r * 17}" width="13" height="13" rx="2"
      fill="var(--accent2)" opacity="${on ? '.9' : '.16'}" style="animation-delay:${(i % 9) * 0.12}s"/>`
    }).join('')}
  </g>
  <text x="358" y="30" class="lbl" font-size="9.5" text-anchor="middle">a coarse grid of stimulation</text>
  <text x="340" y="164" class="lbl" font-size="9.5" text-anchor="middle">on the tongue, the skin, or the retina</text>
  <text x="160" y="150" class="lbl" font-size="9.5" text-anchor="middle">a picture, resampled to what the channel can carry</text>
</svg>`

  const bwRow = (name, pct, val, dim = false) => `
  <div class="bwrow${dim ? ' dim' : ''}"><span class="n">${name}</span>
  <span class="track"><i style="width:${pct}%"></i></span><span class="v">${val}</span></div>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / neuro</div>
${learnNav(esc, 'neuro')}
<div class="lhero">
  <h2>The brain as a signal system</h2>
  <p class="lede">Transduce, encode, carry, decode, act — with a latency budget on every stage. That is the block diagram of a show system, and it is also the block diagram of a nervous system. Once you draw them next to each other, controlling a game with brain activity and giving somebody back a sense they lost stop being science fiction and become engineering, with honest limits.</p>
</div>

${S('The reframe', 'Every sense is a transducer, and they all output the same thing', [
  'A microphone turns pressure into voltage. A retina turns photons into trains of electrical impulses. A cochlea turns pressure into trains of electrical impulses. A mechanoreceptor in the skin turns deformation into trains of electrical impulses.',
  'Notice what happened. Three completely different physics went in, and the <b>same currency came out</b>. The cortex never receives light, sound or pressure. It receives spikes — and spikes from an eye look, in themselves, much like spikes from an ear.',
  'So what makes a signal a sight rather than a sound is largely <em>where it arrives and what it is correlated with</em>, not what produced it. That is the fact everything else on this page depends on. If the currency is common, then a signal from an unusual source, delivered consistently to a channel that still works, can come to mean what the missing sense used to mean.',
])}

${fig(transFig, 'Different physics in. One currency out. This is why substitution is possible at all.')}

${rule('A sense is not defined by its organ. It is defined by <b>a consistent mapping between the world and a signal</b> — which is a specification an engineer can meet, and the entire basis of sensory substitution.')}

${S('Reading', 'What EEG actually measures, and what a brain-computer interface really does', [
  'Put electrodes on a scalp and you can measure voltage differences of a few tens of microvolts. Those come from the summed electrical activity of very large populations of neurons — millions at a time — smeared by the skull and scalp on the way out. EEG has superb time resolution and poor spatial resolution: you know <em>when</em> something happened much better than <em>where</em>.',
  'That is the constraint that shapes every practical brain-computer interface. You cannot read a thought. What you can do is detect a small number of distinguishable, reliably reproducible patterns — and then build an interface out of that handful of choices. Three paradigms carry most of the working systems.',
])}

<dl class="para">
  <div><dt>SSVEP</dt><dd><b>Steady-state visual evoked potential.</b> Show several targets each flickering at a different rate. Attend to one, and the visual cortex response picks up that rate — detectable in a second or two with very little training. The highest information rate of the non-invasive methods, and it works because it is frequency detection, not mind reading.</dd></div>
  <div><dt>P300</dt><dd>A characteristic response roughly 300 ms after a rare or meaningful stimulus in a stream. Flash rows and columns of a grid; the one the user is waiting for produces the response. This is how the classic EEG spellers work.</dd></div>
  <div><dt>Motor imagery</dt><dd>Imagining a movement changes rhythms over the motor cortex, even with no movement. It requires real training on both sides — the user learns, and the classifier learns them — and it delivers a low rate. It is also the most intuitive to use once learned.</dd></div>
</dl>

<div class="caveat"><b>The honest number.</b> A good non-invasive BCI delivers on the order of tens of bits per minute — not per second. A keyboard is thousands of times faster. That is not a reason to dismiss the field, because for someone who cannot move, tens of bits per minute is the difference between silence and conversation. It <em>is</em> a reason to be sceptical of any consumer demo that appears to be doing something rich and fast.</div>

${fig(ssvepFig, 'Two targets, two rates. The system detects which frequency the visual cortex is following.')}

${bites([
  '<b>Most "mind control" demos are muscles.</b> A jaw clench, a blink, an eyebrow raise produce electrical signals orders of magnitude larger than cortical activity, and they sit right where a headset\'s electrodes are. If a demo responds instantly and reliably, suspect EMG before celebrating.',
  '<b>A consumer headset is not clinical EEG.</b> Fewer electrodes, dry contacts, worse placement, far more noise. It can be genuinely fun and it is not measuring what a research rig measures.',
  '<b>"Attention" and "meditation" scores are proxies.</b> They are derived band-power heuristics, not measurements of a mental state, and they should be treated as an interesting control input rather than as a fact about the person.',
  '<b>Invasive is a different regime entirely.</b> Electrode arrays placed in cortex — the research systems behind cursor control, robotic arm control and speech decoding — get orders of magnitude more signal, at the cost of neurosurgery. The gap between what is possible in a lab with an implant and what is possible with a headset at a trade show is enormous.',
])}

${S('Writing', 'Giving a sense back, or delivering it through a different door', [
  'The reverse direction is the older and, so far, the more successful one.',
  'The <b>cochlear implant</b> is the clearest case in all of medicine. When the hair cells of the inner ear are gone, the auditory nerve behind them is often intact. So the implant bypasses the broken transducer entirely: a processor splits incoming sound into bands and stimulates an electrode array threaded into the cochlea, placing each band where the cochlea would naturally have represented that frequency. Hundreds of thousands of people use them.',
  'And the detail that matters most is the one that gets left out: it is <em>not</em> restored hearing. A healthy cochlea has thousands of hair cells; an implant has on the order of a couple of dozen electrodes, whose fields overlap. What arrives is a drastically reduced version of the signal. It works because the brain learns to read it — over months — and because speech turns out to be robust enough to survive that reduction. Music, which needs fine pitch resolution, fares much worse. That is a codec problem, and it is describable in exactly those words.',
  '<b>Retinal implants</b> attempt the same trick for vision and have had a harder time, because vision needs far more channels. Existing systems deliver a coarse grid of light spots rather than an image. One of them, Argus II, is also the field\'s standing cautionary tale: the company stopped supporting the device, leaving implanted users with hardware nobody maintains. A sensory prosthesis is not a product you can discontinue like a phone.',
  '<b>Sensory substitution</b> takes the other route: leave the damaged sense alone and deliver its information through a channel that still works. Paul Bach-y-Rita began this in the 1960s with a camera driving a grid of vibrating points on the back. Later systems moved the grid to the tongue — dense with nerve endings, wet, conductive, so tiny stimulating currents work well — where a camera image becomes a pattern of stimulation that trained users interpret as spatial layout. Others convert images to soundscapes, or colour to audible pitch, which is what lets a person with total colour blindness experience colour as tone.',
  'None of these deliver the resolution of the sense they stand in for. What they deliver is <em>information about the world through an unusual door</em> — and the striking, repeatedly observed result is that with enough use, people stop experiencing the device and start experiencing the world. The stimulation on the tongue stops feeling like tingling on the tongue and starts feeling like something being over there.',
])}

${fig(subFig, 'The image is resampled to whatever the substitute channel can actually carry. The rest is learning.')}

${S('The condition', 'Why it only works if the person can move', [
  'The finding that turned sensory substitution from a curiosity into a field is that <b>it requires action</b>. Passively receiving the stimulation produces a sensation on the skin, or on the tongue, and it stays that way. Being able to move the camera — to turn your head, to reach out and change what arrives — is what converts it into perception of an external world.',
  'That makes sense in signal terms. A sense is a mapping between what you do and what comes back. Without the loop, there is nothing for the brain to correlate against, and no reason for it to infer that the signal is about anything out there.',
  'It is also a warning about every "just feed it into the brain" pitch. The bandwidth is the easy part. The closed loop, the consistency of the mapping, and the months of use are the hard parts, and they are not optional.',
])}

${S('', 'What a channel count actually removes', [
  'A healthy cochlea has thousands of hair cells; an implant has a couple of dozen electrodes whose fields overlap. Drag the channel count and watch a spectrum collapse into what actually gets delivered.',
])}

<div class="dial">
  <div class="d"><label for="ci-ch">channels <b id="ci-chv">22</b></label>
    <input id="ci-ch" type="range" min="4" max="64" step="1" value="22"></div>
</div>
<div class="fig" data-driven="dial" style="padding:16px">
  <div id="ci-bars" style="display:flex;gap:2px;align-items:flex-end;height:110px"></div>
  <div class="cap" style="text-align:left;margin-top:10px">An illustration. The grey outline is a detailed spectrum; the bars are what survives being reduced to the selected number of bands. Speech is redundant enough to come through this; music, which needs fine pitch resolution, is not.</div>
</div>
<div class="verdict" id="ci-out"></div>

${S('The scale', 'What these channels actually carry', [
  'Rough figures, chosen to be comparable rather than precise. They are the reason the field is difficult and the reason the successes are impressive.',
])}

<div class="bw">
  ${bwRow('Healthy cochlea', 100, 'thousands of hair cells')}
  ${bwRow('Cochlear implant', 3, '~12–24 electrodes', true)}
  ${bwRow('Healthy retina', 100, '~1 million ganglion cells')}
  ${bwRow('Retinal implant', 1, 'tens to hundreds of points', true)}
  ${bwRow('Tongue stimulation grid', 2, 'a few hundred points', true)}
  ${bwRow('Non-invasive BCI, out', 1, 'tens of bits per minute', true)}
  ${bwRow('Intracortical BCI, out', 12, 'orders of magnitude more', true)}
</div>
<p style="color:var(--dimmer);font-size:12.5px;font-family:var(--mono)">Bars are illustrative proportions on a compressed scale, not measurements. The point is the gap, not the pixels.</p>

${S('The synthesis', 'The same block diagram, twice', [
  'Set the two chains side by side and they are the same shape, stage for stage. That is not a metaphor — it is why the vocabulary transfers.',
])}

<div class="blocks">
  <div>
    <h4>A show system</h4>
    <div class="bchain"><b>microphone / sensor</b><i>→</i><b>codec</b><i>→</i><b>network, with latency</b><i>→</i><b>processor</b><i>→</i><b>amplifier</b><i>→</i><b>the room</b></div>
  </div>
  <div>
    <h4>A nervous system</h4>
    <div class="bchain"><b>receptor</b><i>→</i><b>spike encoding</b><i>→</i><b>nerve, with conduction delay</b><i>→</i><b>cortex</b><i>→</i><b>motor output</b><i>→</i><b>the world</b></div>
  </div>
</div>

${S('Why this belongs on a show-technology site', 'Three concrete reasons', [
  '<b>Because the audience is the last device in the signal chain.</b> Everything else here is about getting a signal accurately to a person; this is the specification of the person. The thresholds on the <a href="/learn/perception/">perception</a> page are that device\'s data sheet, and the mechanisms here are why the data sheet reads the way it does.',
  '<b>Because accessibility is a substitution problem, and it is a design problem.</b> Haptic vests that turn a mix into patterns on the body for deaf audience members, hearing loops built to <a href="/standards/iec-60118-4/">IEC 60118-4</a>, audio description, captioning, sign interpretation, seat-level tactile transducers: every one of those is the same idea — deliver the information through a channel the person has. Treating that as an engineering layer of the show, budgeted and designed, produces something far better than treating it as a compliance item bolted on in week eleven.',
  '<b>Because biometric input into shows is real and is usually oversold.</b> Heart rate, skin conductance, breathing and EEG can all drive content, and all of them are low-bandwidth and noisy. Designed well — as a slow, aggregate influence on a system that looks good regardless — they add something genuine. Designed as a direct control path, they produce a show that depends on the least reliable signal in the building.',
])}

<div class="caveat"><b>Scope, stated plainly.</b> This page describes how these systems work at a signal level, for people who build show technology. It is not medical advice, it is not a guide to any device, and it does not describe anything a person should attempt on themselves or on anybody else. Venue-side accessibility obligations sit in legislation such as the <a href="/standards/ada-standards-2010/">ADA standards</a>. Neural data is also personal data of the most sensitive kind: if a project ever captures it from an audience, that is a consent-and-retention question before it is a technical one.</div>

${bites([
  '<b>Bandwidth is never the whole story.</b> A cochlear implant carries a fraction of one percent of the channels an ear has and restores conversation, because speech is redundant and brains adapt. Ask what the signal has to carry before asking how much of it you can carry.',
  '<b>Latency applies here too.</b> A prosthesis or a haptic system with inconsistent delay is harder to learn than one that is slower but steady — the same lesson as the <a href="/learn/code/">determinism</a> page, in a different domain.',
  '<b>Adaptation takes months, not minutes.</b> Any demonstration that shows someone using a new sense competently within an afternoon is measuring something simpler than it appears to be.',
  '<b>A device somebody depends on cannot be discontinued.</b> The Argus II story is the one to remember before shipping anything a person will rely on.',
])}

${xnote('Two things follow directly. Accessibility is a substitution problem and therefore a design layer rather than a compliance item. And biometric input into a show is genuinely available and genuinely low-bandwidth — <b>design it as a slow influence on something that already looks good</b>, never as a control path.')}

${S('Where to go next', 'This page is one half of a pair', [
  'The <a href="/learn/perception/">perception page</a> is the thresholds — what a person can detect, and under what conditions. This one is the mechanism underneath those thresholds, and what happens when you interfere with it deliberately.',
  'Everything else on this site is the chain in between: <a href="/learn/dmx/">how a signal survives a wire</a>, <a href="/learn/network/">how it survives a network</a>, <a href="/learn/wireless/">how it survives the air</a>, and <a href="/learn/systems/">how several of them agree with each other</a>. It ends here, at the only receiver that matters.',
])}

<div class="cta"><strong>Work in this field?</strong>
<p>This page is written for show technologists from public research and clinical literature, and it simplifies aggressively. If something here is out of date or overstated — particularly the numbers — <a href="${GH}/issues/new?labels=tooling&amp;title=neuro%3A+">open an issue</a>. Corrections from people who do this work are worth more than any amount of rewriting from outside it.</p></div>

<script>
(function(){
  var ch=document.getElementById('ci-ch'); if(!ch) return;
  var chv=document.getElementById('ci-chv'), bars=document.getElementById('ci-bars'),
      out=document.getElementById('ci-out'), N=64;
  var src=[]; for(var i=0;i<N;i++) src.push(0.25+0.7*Math.abs(Math.sin(i*0.37)*Math.cos(i*0.11)));
  function draw(){
    var n=Number(ch.value); chv.textContent=n;
    var per=N/n, html='';
    for(var i=0;i<N;i++){
      var band=Math.floor(i/per);
      var lo=Math.ceil(band*per), hi=Math.min(N,Math.ceil((band+1)*per));
      var sum=0; for(var k=lo;k<hi;k++) sum+=src[k];
      var v=sum/Math.max(1,hi-lo);
      html+='<div style="flex:1;position:relative;height:100%">'
        +'<div style="position:absolute;bottom:0;left:0;right:0;height:'+(src[i]*100).toFixed(0)+'%;'
        +'border-top:1px solid var(--dimmer);opacity:.5"></div>'
        +'<div style="position:absolute;bottom:0;left:0;right:0;height:'+(v*100).toFixed(0)+'%;'
        +'background:var(--accent);border-radius:2px 2px 0 0"></div></div>';
    }
    bars.innerHTML=html;
    var verdict = n>=40 ? 'More than any implant delivers, and still a fraction of a healthy cochlea.'
      : n>=20 ? 'About what a current implant provides. <span class="ok">Speech survives this</span> because speech is redundant; melody largely does not.'
      : n>=10 ? 'Coarse. Speech in quiet is possible with training; speech in noise becomes very hard.'
      : '<span class="err">Almost nothing of the spectrum is left.</span> The bands are wider than the distinctions that carry meaning.';
    out.innerHTML='<b>'+n+'</b> channels standing in for thousands of hair cells. '+verdict+
      ' It works at all because <b>the brain learns to read it</b> \u2014 over months.';
  }
  ch.addEventListener('input',draw); draw();
})();
</script>
`

  return shell({
    title: 'The brain as a signal system — BCI, sensory substitution and prostheses | showstack',
    description: 'Every sense is a transducer whose output is the same currency, which is why brain-computer interfaces and sensory substitution work at all. What EEG actually measures, how SSVEP, P300 and motor imagery interfaces really function, what a cochlear implant and a tongue stimulation grid can and cannot carry, and why the loop matters more than the bandwidth.',
    canonical: `${SITE}/learn/neuro/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'The brain as a signal system: input, processing and output',
      description: 'Transduction, EEG and brain-computer interface paradigms, cochlear and retinal implants, sensory substitution, and what all of it means for accessible and interactive show design.',
      url: `${SITE}/learn/neuro/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
