/**
 * /learn/perception/ — the person the whole site is aimed at.
 *
 * Every threshold in this dataset is a fact about a nervous system rather
 * than about equipment. 24 frames a second, 35 milliseconds of delay, 3 kHz
 * PWM, an equal-loudness curve: none of those numbers come from physics. They
 * come from where a human stops being able to tell.
 *
 * That makes this page the floor the rest of the site stands on, and it is
 * why it sits last in the reading order rather than first — the numbers make
 * more sense once you have met them somewhere.
 *
 * Accessibility note on the flicker demonstration: flashing imagery is a
 * genuine seizure risk, so the demo is opt-in, defaults to off, defaults to a
 * fused rate, is deliberately small (far below the large-area threshold in
 * WCAG 2.3.1), uses low contrast, and refuses to run under
 * prefers-reduced-motion. Do not make it bigger or brighter.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

export function learnPerceptionPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* precedence effect: two arrivals, one perceived direction */
@keyframes arr-a{0%{transform:translateX(0);opacity:0}6%{opacity:1}
40%{transform:translateX(150px);opacity:1}46%,100%{opacity:0}}
@keyframes arr-b{0%,10%{transform:translateX(0);opacity:0}16%{opacity:1}
54%{transform:translateX(-150px);opacity:1}60%,100%{opacity:0}}
@keyframes point{0%,44%{opacity:.2}52%,86%{opacity:1}94%,100%{opacity:.2}}
.precfig .a{animation:arr-a 3.4s linear infinite}
.precfig .b{animation:arr-b 3.4s linear infinite}
.precfig .heard{animation:point 3.4s ease-in-out infinite}
/* the binding window */
.bindwrap{position:relative;margin:16px 0 6px}
.bind{position:relative;height:72px;border:1px solid var(--line);border-radius:var(--r-sm);
background:var(--panel);overflow:hidden}
.bind .zone{position:absolute;top:0;bottom:0;background:color-mix(in srgb,var(--ok) 15%,transparent);
border-left:1px solid var(--ok);border-right:1px solid var(--ok)}
.bind .zero{position:absolute;top:0;bottom:0;width:1px;background:var(--accent);left:50%}
.bind .marker{position:absolute;top:8px;width:2px;height:56px;background:var(--accent2);transition:left .1s}
.bind .tag{position:absolute;bottom:5px;font-family:var(--mono);font-size:10px;color:var(--dimmer)}
/* flicker: opt-in, small, low contrast */
.flick{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:14px}
.flickbox{width:54px;height:54px;border-radius:8px;border:1px solid var(--line);
background:var(--panel2);flex:0 0 auto}
.flickbox.on{background:var(--dim);animation:fl var(--per,8ms) steps(1,end) infinite}
@keyframes fl{0%,49%{opacity:1}50%,100%{opacity:.55}}
@media(prefers-reduced-motion:reduce){.flickbox.on{animation:none}}
/* frisson: expectation, delay, resolution */
@keyframes climb{0%{stroke-dashoffset:520}100%{stroke-dashoffset:0}}
.frissonfig .line{stroke-dasharray:520;animation:climb 6s ease-in-out infinite}
@keyframes glow{0%,62%{opacity:0;r:4}70%{opacity:1;r:9}86%{opacity:.5;r:20}100%{opacity:0;r:26}}
.frissonfig .hit{animation:glow 6s ease-in-out infinite}
@keyframes holdgap{0%,44%{opacity:0}52%,60%{opacity:1}68%,100%{opacity:0}}
.frissonfig .gap{animation:holdgap 6s ease-in-out infinite}
/* dark adaptation curve */
@keyframes adapt{0%{transform:translateX(0)}100%{transform:translateX(316px)}}
.darkfig .now{animation:adapt 9s linear infinite}
.darkfig .rod{animation:l-fade 9s ease-in-out infinite}
/* metamerism: same to the eye, different to the sensor */
@keyframes swap{0%,46%{opacity:0}54%,96%{opacity:1}100%{opacity:0}}
.metafig .cam{animation:swap 4s ease-in-out infinite}
/* threshold table */
.thresh{width:100%;border-collapse:collapse;font-size:14.2px;margin:16px 0}
.thresh th{text-align:left;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;
letter-spacing:.6px;color:var(--dimmer);padding:0 12px 9px 0;border-bottom:1px solid var(--line);font-weight:400}
.thresh td{padding:12px 12px 12px 0;border-bottom:1px solid var(--line);vertical-align:top;color:var(--dim);
line-height:1.55}
.thresh td:first-child{color:var(--ink)}
.thresh td:nth-child(2){font-family:var(--mono);color:var(--accent2);white-space:nowrap}
.threshwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.threshwrap .thresh{min-width:600px}
`

  const precFig = `
<svg viewBox="0 0 460 180" role="img" class="precfig">
  <rect x="14" y="60" width="52" height="46" rx="6" fill="var(--panel)" stroke="var(--dom-audio)"/>
  <text x="40" y="87" class="lbl" font-size="9" text-anchor="middle">PA</text>
  <rect x="394" y="60" width="52" height="46" rx="6" fill="var(--panel)" stroke="var(--dom-audio)"/>
  <text x="420" y="87" class="lbl" font-size="9" text-anchor="middle">DELAY</text>
  <g class="a"><circle cx="76" cy="83" r="5" fill="var(--accent)"/></g>
  <g class="b"><circle cx="384" cy="83" r="5" fill="var(--accent2)"/></g>
  <circle cx="230" cy="83" r="11" fill="none" stroke="var(--dimmer)" stroke-width="1.3"/>
  <g class="heard">
    <path d="M230 108 L146 132" stroke="var(--accent)" stroke-width="1.8"/>
    <text x="150" y="150" class="lbl" font-size="9.5" fill="var(--accent)">heard as coming from here</text>
  </g>
  <text x="230" y="24" class="lbl" text-anchor="middle" font-size="9.5">the second arrival can be louder and still lose</text>
</svg>`

  const frissonFig = `
<svg viewBox="0 0 460 190" role="img" class="frissonfig">
  <line x1="24" y1="160" x2="440" y2="160" stroke="var(--line)"/>
  <path class="line" d="M24 156 C110 152 150 120 190 104 C214 94 232 92 250 92 L296 92 C330 92 344 40 400 26"
    fill="none" stroke="var(--accent)" stroke-width="2"/>
  <g class="gap">
    <rect x="250" y="76" width="46" height="32" rx="4" fill="none" stroke="var(--accent2)" stroke-dasharray="3 3"/>
    <text x="273" y="70" class="lbl" font-size="9" text-anchor="middle" fill="var(--accent2)">held</text>
  </g>
  <circle class="hit" cx="400" cy="26" r="4" fill="var(--accent2)"/>
  <text x="24" y="180" class="lbl" font-size="9.5">expectation builds</text>
  <text x="273" y="180" class="lbl" font-size="9.5" text-anchor="middle">resolution withheld</text>
  <text x="436" y="180" class="lbl" font-size="9.5" text-anchor="end">and then given</text>
</svg>`

  const darkFig = `
<svg viewBox="0 0 400 170" role="img" class="darkfig">
  <path d="M24 40 C60 96 88 108 120 112 L120 112 C160 116 176 128 200 140 C240 152 300 154 372 155"
    fill="none" stroke="var(--accent)" stroke-width="2"/>
  <g class="rod"><circle cx="150" cy="120" r="16" fill="var(--accent2)" opacity=".18"/></g>
  <text x="150" y="104" class="lbl" font-size="9" text-anchor="middle" fill="var(--accent2)">rods take over</text>
  <g class="now"><line x1="24" y1="20" x2="24" y2="156" stroke="var(--accent2)" stroke-width="1.4"/></g>
  <line x1="24" y1="156" x2="376" y2="156" stroke="var(--line)"/>
  <text x="24" y="168" class="lbl" font-size="9">blackout</text>
  <text x="200" y="168" class="lbl" font-size="9" text-anchor="middle">10 min</text>
  <text x="376" y="168" class="lbl" font-size="9" text-anchor="end">30 min</text>
  <text x="200" y="28" class="lbl" font-size="9.5" text-anchor="middle">sensitivity keeps rising long after it feels dark</text>
</svg>`

  const metaFig = `
<svg viewBox="0 0 460 170" role="img" class="metafig">
  <rect x="46" y="30" width="130" height="70" rx="8" fill="#c9603f"/>
  <rect x="284" y="30" width="130" height="70" rx="8" fill="#c9603f"/>
  <g class="cam"><rect x="284" y="30" width="130" height="70" rx="8" fill="#a8563c"/>
    <rect x="284" y="30" width="130" height="70" rx="8" fill="none" stroke="var(--warn)" stroke-width="2"/></g>
  <text x="111" y="122" class="lbl" font-size="9.5" text-anchor="middle">tungsten — a continuous spectrum</text>
  <text x="349" y="122" class="lbl" font-size="9.5" text-anchor="middle">an LED matched to it by eye</text>
  <text x="230" y="152" class="lbl" font-size="9.5" text-anchor="middle">identical to a person. The camera does not agree.</text>
</svg>`

  const T = (a, b, c) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / perception</div>
${learnNav(esc, 'perception')}
<div class="lhero">
  <h2>The person on the other end</h2>
  <p class="lede">24 frames a second. 35 milliseconds of delay. 3 kHz of PWM. Not one of those numbers is a fact about equipment — every one of them is a fact about a nervous system, and about where it stops being able to tell. This page is the floor everything else on the site stands on.</p>
</div>

${S('The reframe', 'Specifications are measurements of people', [
  'It is easy to read a spec sheet as though the numbers came from physics. Almost none of them did. They came from experiments on human beings, run to find the point at which a difference stops being detectable — and then a margin was added.',
  'That has a practical consequence. When a number in this industry seems arbitrary, the useful question is not "what is the standard?" but <b>"what could a person tell, and under what conditions?"</b> — because the conditions are usually where the number breaks. A flicker rate that is invisible to a still eye is glaring to a moving one. A delay that is inaudible on speech is obvious on a snare. The threshold was never a single number; it was a number for one experiment.',
])}

<div class="threshwrap">
<table class="thresh">
  <thead><tr><th>What</th><th>Roughly</th><th>And the condition that breaks it</th></tr></thead>
  <tbody>
    ${T('Flicker fusion (steady gaze)', '50–90 Hz', 'Rises with brightness and moves much higher in peripheral vision — which is why a flicker you cannot see head-on appears when you look slightly away.')}
    ${T('Flicker with a moving eye or object', 'kHz territory', 'Move your eye, or move the fixture, and the light lands on different photoreceptors — the "phantom array". This is why PWM frequency matters far above fusion.')}
    ${T('Echo becomes audible', 'about 35–50 ms', 'Depends enormously on material. Speech forgives; a percussive transient does not.')}
    ${T('Audio/video felt as simultaneous', 'about +45 to −125 ms', 'Asymmetric: sound arriving late is natural and tolerated, sound arriving early is not. Nature never does it.')}
    ${T('Loudness integration', 'about 100–200 ms', 'A very short transient sounds quieter than its peak, which is why peak, RMS and the time weightings in <a href="/standards/iec-61672-1/">IEC 61672-1</a> disagree.')}
    ${T('Full dark adaptation', '20–30 minutes', 'Any bright cue resets a large part of it. The audience is never as dark-adapted as the plot assumes.')}
  </tbody>
</table>
</div>
<p style="color:var(--dimmer);font-size:12.5px;font-family:var(--mono)">Ranges, deliberately. Every one of these varies with level, content, age and the individual — treat them as where to start looking, not as limits to design to.</p>

${S('Light', 'Fusion, phantom arrays, and why the eye is not a camera', [
  'Present a light that switches on and off fast enough and it stops looking like flashing and starts looking steady. That point — <b>flicker fusion</b> — is not fixed. It rises with brightness and contrast, and it is markedly higher in your peripheral vision than in the centre of your gaze, which is why a flickering fixture is so often noticed out of the corner of an eye and disappears when you look straight at it.',
  'The bigger trap is movement. Fusion assumes the image stays on the same photoreceptors. Move your eye across a PWM-driven light, or move the fixture, and each flash lands somewhere different on the retina — so instead of a smear you see a dotted line, a <em>phantom array</em>. Flicker and its health effects are the subject of <a href="/standards/ieee-1789/">IEEE 1789</a>. This is why a moving-light manufacturer quoting a PWM frequency in the low hundreds of hertz is not making a claim about your eye being slow; it is making a claim you can disprove by turning your head.',
  'And a camera is a different observer again. It samples with a shutter, so it has its own beat frequencies with the light — the subject of <a href="/learn/systems/">genlock and LED walls</a> — and it will photograph flicker that nobody in the room can see.',
])}

<div class="fig" style="padding:16px">
  <p style="margin:0 0 4px;color:var(--dim);font-size:14px">A flicker demonstration, off by default. It is deliberately small and low-contrast, and it will not run if your system asks for reduced motion. <b>Skip it if flashing imagery affects you.</b></p>
  <div class="flick">
    <div class="flickbox" id="fk-box" aria-hidden="true"></div>
    <div class="tryit" style="margin:0">
      <div class="f"><label for="fk-rate">rate — <span id="fk-val">120 Hz</span></label>
        <input id="fk-rate" type="range" min="8" max="120" value="120" step="1"></div>
      <div class="f"><label>&nbsp;</label>
        <button type="button" class="seg" id="fk-go" style="padding:9px 15px;background:var(--panel);
        color:var(--dim);border:1px solid var(--line);border-radius:8px;font-family:var(--mono);
        font-size:12.5px;min-height:40px;cursor:pointer">start</button></div>
    </div>
  </div>
  <div class="cap" style="text-align:left">Start high, then bring the rate down slowly and note where it changes. Then keep looking <em>past</em> the square rather than at it — the periphery gives it away several steps earlier.</div>
</div>

${rule('Fusion is a property of <b>an eye in a condition</b>, not of a light. Any flicker figure that does not say how bright, how far off-axis, and whether anything was moving is incomplete.')}

${S('Sound', 'Why we localise to the first arrival, and what that buys you', [
  'When the same sound reaches you twice within roughly the first 35 milliseconds, you do not hear two sounds. You hear one, and you hear it as coming from wherever the <b>first</b> arrival came from. The second is folded in — it adds loudness and body, and it does not add a direction.',
  'This is the precedence effect, and Helmut Haas\'s work showed how strong it is: the later arrival can be substantially louder than the first and still not take the localisation. It is not a small perceptual bias, it is a hard preference built into how we survive rooms full of reflections.',
  'It is also the single most useful fact in sound reinforcement, because it is what makes a delay tower possible. Delay the tower slightly <em>more</em> than the physical distance requires and the audience under it hears plenty of level from it while still locating the sound on stage. Get it wrong and the same speaker becomes an echo that pulls every head in the wrong direction. The <a href="/learn/sound/">sound page</a> has the arithmetic; this is the reason the arithmetic matters.',
])}

${fig(precFig, 'Two arrivals inside the window. One perceived source, and it is the earlier one.')}

${S('Both at once', 'The window in which sight and sound are the same event', [
  'Your brain is willing to call a sound and a picture the same event even when they do not arrive together — and the window is lopsided. Sound arriving <em>after</em> the picture is tolerated far more generously than sound arriving <em>before</em> it, because in the physical world late sound is what always happens and early sound never does.',
  'Broadcast practice puts detectability somewhere around 45 ms for audio ahead of video and around 125 ms for audio behind it, with acceptability further out again. On a live show the equivalent question is a room: at 30 metres from the stage the sound is already about 90 ms behind the light, and nobody minds, because that is what distance sounds like.',
  'What people do mind is inconsistency — a video wall with a frame of processing delay against a PA that is aligned to the stage puts a mouth and a voice on different sides of the window.',
])}

<div class="bindwrap">
  <div class="bind" aria-hidden="true">
    <div class="zone" style="left:26%;right:12%"></div>
    <div class="zero"></div>
    <div class="marker" id="bd-mark" style="left:50%"></div>
    <div class="tag" style="left:6px">audio early</div>
    <div class="tag" style="right:6px">audio late</div>
  </div>
  <div class="tryit">
    <div class="f"><label for="bd">audio offset — <span id="bd-val">0 ms</span></label>
      <input id="bd" type="range" min="-200" max="260" step="5" value="0"></div>
  </div>
  <div class="readout" id="bd-out">In the window. Read as one event.</div>
</div>

${S('Colour', 'Two lights that match, and a camera that disagrees', [
  'Human colour vision has three channels. That means a very large number of physically different spectra map onto the same three responses — and any two of them will look identical to you. This is <b>metamerism</b>, and it is not a defect; it is what makes colour reproduction possible at all.',
  'It is also a trap, because a camera also has three channels and they are not the same three. An LED fixture tuned by eye to match a tungsten source can photograph noticeably different — often greener, or with skin tones that will not correct cleanly. Nothing has failed. The two observers simply disagree, and the one holding the camera is the one the audience at home is using.',
  'CRI and the newer TM-30 measures exist to put a number on this, and both are summaries: a single figure standing in for a whole spectrum. Colour spaces such as <a href="/standards/itu-r-bt-709/">BT.709</a> and <a href="/standards/itu-r-bt-2020/">BT.2020</a> are the other half of the agreement — what a camera and a display consider a colour to be. Use them to reject bad sources, not to promise a match.',
  'One more asymmetry worth knowing: at low light levels sensitivity shifts toward the blue end as rod vision takes over — the Purkinje shift. A deep blue night state reads brighter, and a deep red one darker, than a meter says. Designers have exploited that for a century without needing the name for it.',
])}

${fig(metaFig, 'The same to an eye. Not the same to a sensor. Nothing is broken.')}

${S('Darkness', 'What a blackout actually is', [
  'Dark adaptation is slow and it is in two stages: the cones give up their improvement within a few minutes, and then the rods keep going for another twenty to thirty. Full sensitivity is half an hour away, and any bright cue takes a large part of it back instantly.',
  'So the audience\'s "dark" changes across an act. A blackout early in the show is much brighter to them than the identical state an hour in. And the running lights, the exit signs and the phone that comes out three rows back are all doing their work against whatever adaptation the audience has managed to accumulate.',
])}

${fig(darkFig, 'Sensitivity is still climbing long after the audience has decided the room is dark.')}

${S('Attention', 'The audience does not see what you did not point at', [
  'Attention is a spotlight, it is narrow, and it is driven by contrast — a change in brightness, an onset of movement, the start of a sound. Those pull it before conscious thought is involved.',
  'The practical consequence is that a scene change can happen in full view of a thousand people and go unnoticed, provided the change is not where attention is. This is not a trick, it is <em>inattentional blindness</em>: outside the spotlight, large changes routinely go unregistered.',
  'It cuts both ways, and this is the part worth internalising. An unmotivated movement in the wings, a technician crossing upstage, an LED that fades a beat late, a laptop screen in a box — each of those is a contrast event, and each will grab the spotlight away from whatever the show was pointing at. Most of what a good crew does in the dark is <b>avoiding accidental salience</b>.',
])}

${S('The one people ask about', 'Why music gives you goosebumps', [
  'Musical chills — <em>frisson</em> — are a real, measurable autonomic event: piloerection, a change in skin conductance, a shift in heart rate. It is the same machinery that raises hair when you are cold or frightened, recruited by emotional arousal rather than temperature.',
  'The imaging work on it, most influentially Salimpoor and colleagues in 2011, found something more specific than "music feels nice". Dopamine release was found in two places at two times: in the <em>caudate</em> during the build-up, while the listener anticipated the moment, and in the <em>nucleus accumbens</em> at the peak itself. The anticipation is not a lead-in to the reward. Neurochemically, it is part of it.',
  'That explains the structure of the triggers, which are remarkably consistent: a resolution delayed longer than expected, an unexpected harmonic turn, a sudden dynamic swell, a new voice or texture entering, a sudden expansion of stereo width or of the room. All of them are <b>expectations set up and then violated or withheld</b>. A passage that does exactly what it promised, on time, does not produce chills — however beautiful it is.',
  'Not everyone experiences it, and the difference is not musical training. It correlates with the personality trait of Openness to Experience, and with how strongly someone absorbs into what they are listening to.',
])}

${fig(frissonFig, 'Expectation, a resolution withheld a little longer than it should be, and then given. The whole shape is the mechanism.')}

${rule('Chills need a <b>before</b>. Nothing can be violated that was not first established — which is why the loudest, brightest, widest moment in a show is only ever as strong as the restraint in front of it.')}

${bites([
  '<b>An hour at full is an hour with no peak.</b> Constant maximum intensity removes the contrast that the effect depends on. The reason the finale lands is the ninety minutes that were not the finale.',
  '<b>Silence and darkness are effects.</b> They are also the only ones that cost nothing and cannot be over-specified.',
  '<b>Loudness produces real arousal — and real damage.</b> The physiological response to high SPL is not imaginary, and neither is the exposure — see <a href="/standards/din-15905-5/">DIN 15905-5</a> and <a href="/standards/eu-directive-2003-10-ec/">the EU noise directive</a>. Use the <a href="/tools/#dose">noise dose tool</a> and treat the two as the same conversation.',
  '<b>Low frequency is felt before it is heard.</b> Below roughly 20 Hz it stops being a pitch and becomes a sensation in the chest, which is a different design lever from level.',
  '<b>Latency makes people ill, not just annoyed.</b> In a headset, motion-to-photon delay conflicts with the vestibular system, and nausea follows. That is a hard limit, not a quality setting.',
])}

${xnote('This page is the parts list for the previous sentence in every other one. Thresholds tell you where you have room and where you have none — and <b>knowing which human limit a number is protecting</b> is the difference between engineering to a spec and engineering to an effect.')}

${S('Bringing it back', 'Why this page is the floor of the site', [
  'Every other page here is about getting a signal accurately from one place to another. This one is about the only reason that matters.',
  'The <a href="/learn/light/">beam angles</a> are shaped by what an eye reads as an edge. The <a href="/learn/sound/">delay alignment</a> exists because of the precedence effect. The <a href="/learn/network/">QoS</a> config protects a latency figure that was chosen because of a binding window. The <a href="/learn/systems/">shared clock</a> exists because we notice when things disagree. The <a href="/learn/aerial/">drone show</a> reads as a picture because of how we group moving points.',
  'Get the engineering right and nobody notices anything, which is the job. But knowing <em>which</em> human limit each number is protecting tells you the thing a spec sheet cannot: where you have room, and where you have none.',
])}

<div class="cta"><strong>Know this material properly?</strong>
<p>This page summarises perceptual and neuroscience research for practitioners, and summaries lose things. If a claim here is out of date, over-stated, or missing the condition that matters, <a href="${GH}/issues/new?labels=tooling&amp;title=perception%3A+">open an issue</a> — precision here improves every other page.</p></div>

<script>
(function(){
  var box = document.getElementById('fk-box'), rate = document.getElementById('fk-rate'),
      val = document.getElementById('fk-val'), go = document.getElementById('fk-go'), on = false;
  function apply(){
    var hz = Number(rate.value);
    val.textContent = hz + ' Hz';
    box.style.setProperty('--per', (1000 / hz).toFixed(2) + 'ms');
  }
  if (box) {
    rate.addEventListener('input', apply);
    go.addEventListener('click', function(){
      on = !on;
      box.classList.toggle('on', on);
      go.textContent = on ? 'stop' : 'start';
      go.setAttribute('aria-pressed', String(on));
    });
    apply();
  }
  var bd = document.getElementById('bd'), bdv = document.getElementById('bd-val'),
      mark = document.getElementById('bd-mark'), out = document.getElementById('bd-out');
  if (bd) {
    var MIN = -200, MAX = 260;
    bd.addEventListener('input', function(){
      var ms = Number(bd.value);
      bdv.textContent = (ms > 0 ? '+' : '') + ms + ' ms';
      mark.style.left = (((ms - MIN) / (MAX - MIN)) * 100).toFixed(1) + '%';
      if (ms < -45) out.innerHTML = '<span class="err">Audio early.</span> The one direction nature never produces \\u2014 detectable well before the late side is.';
      else if (ms > 125) out.innerHTML = '<span class="err">Audio late enough to read as separate.</span> Past the point where most viewers stop binding them.';
      else out.innerHTML = '<span class="ok">In the window.</span> Read as one event.';
    });
  }
})();
</script>
`

  return shell({
    title: 'The person on the other end — perception, illusion and why music gives you goosebumps | showstack',
    description: 'Every threshold in live production is a measurement of a nervous system: flicker fusion and phantom arrays, the precedence effect, the audio-video binding window, metamerism and dark adaptation, inattentional blindness, and the anticipation mechanism behind musical chills.',
    canonical: `${SITE}/learn/perception/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Perception: the human limits behind every specification',
      description: 'Flicker fusion, the precedence effect, audiovisual binding, metamerism, dark adaptation, attention, and the neuroscience of musical frisson, for live production.',
      url: `${SITE}/learn/perception/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
