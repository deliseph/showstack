/**
 * /learn/presence/ — being somewhere.
 *
 * The senses nobody counts do most of the work of convincing a body that it
 * is in a place: balance, the position of your own limbs, the state of your
 * own organs. Presence is what happens when all of those agree with what the
 * eyes and ears are reporting, and a break in presence is what happens the
 * instant one of them does not.
 *
 * Slater's split is the spine of the page - place illusion (I am here) and
 * plausibility illusion (this is really happening) are separate, fail
 * separately, and are repaired by completely different work. That
 * distinction is as useful for a set and a room as it is for a headset,
 * which is why this page is not filed under XR.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

export function learnPresencePage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* the senses nobody counts */
@keyframes sglow{0%,100%{opacity:.32}22%,40%{opacity:1}}
${[...Array(8)].map((_, i) => `.sensefig .s${i}{animation:sglow 6.4s ease-in-out infinite;animation-delay:${(i * 0.8).toFixed(1)}s}`).join('')}
/* conflict: eyes say moving, balance says still */
@keyframes drift-eye{0%,100%{transform:translateX(0)}50%{transform:translateX(26px)}}
.config .eye{animation:drift-eye 3s ease-in-out infinite}
@keyframes alarm2{0%,40%{opacity:0}52%,86%{opacity:1}96%,100%{opacity:0}}
.config .warn{animation:alarm2 3s ease-in-out infinite}
/* ownership: a stroke on both, and the brain reassigns */
@keyframes tap{0%,100%{transform:translateY(0);opacity:.4}30%,50%{transform:translateY(-5px);opacity:1}}
.ownfig .t1{animation:tap 1.8s ease-in-out infinite}
.ownfig .t2{animation:tap 1.8s ease-in-out infinite;animation-delay:.02s}
@keyframes claim{0%,54%{opacity:0}66%,92%{opacity:1}100%{opacity:0}}
.ownfig .claimed{animation:claim 5.4s ease-in-out infinite}
/* break in presence: a seam appears */
@keyframes seam{0%,58%{opacity:0}66%,84%{opacity:1}94%,100%{opacity:0}}
.brkfig .seamline{animation:seam 4.6s ease-in-out infinite}
.brkfig .world{animation:l-breathe 4.6s ease-in-out infinite}
/* two illusions panel */
.two{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--line);border-radius:var(--r-md);
overflow:hidden;margin:18px 0}
.two > div{padding:18px}
.two > div:first-child{border-right:1px solid var(--line);
background:color-mix(in srgb,var(--accent) 6%,transparent)}
.two > div:last-child{background:color-mix(in srgb,var(--accent2) 6%,transparent)}
.two h4{margin:0 0 4px;font-size:16px;font-family:var(--sans);text-transform:none;letter-spacing:-.1px;
color:var(--ink);font-weight:650}
.two .lat{font-family:var(--mono);font-size:10.5px;letter-spacing:.5px;text-transform:uppercase;margin-bottom:11px}
.two > div:first-child .lat{color:var(--accent)}
.two > div:last-child .lat{color:var(--accent2)}
.two p{margin:0 0 9px;color:var(--dim);font-size:13.8px;line-height:1.6}
.two p:last-child{margin-bottom:0}
@media(max-width:600px){.two{grid-template-columns:1fr}
.two > div:first-child{border-right:none;border-bottom:1px solid var(--line)}}
/* sense list */
.senses{display:grid;grid-template-columns:repeat(auto-fit,minmax(212px,1fr));gap:12px;margin:18px 0}
.senses > div{background:var(--panel);border:1px solid var(--line);border-radius:var(--r-sm);padding:14px}
.senses dt{font-family:var(--mono);font-size:11.5px;color:var(--accent);margin-bottom:6px}
.senses dd{margin:0;color:var(--dim);font-size:13.4px;line-height:1.55}
`

  const senseFig = `
<svg viewBox="0 0 460 190" role="img" class="sensefig">
  <ellipse cx="230" cy="96" rx="52" ry="62" fill="var(--panel2)" stroke="var(--line)"/>
  <text x="230" y="100" class="lbl" font-size="9.5" text-anchor="middle">one body</text>
  ${[
    ['sight', 0], ['hearing', 1], ['balance', 2], ['limb position', 3],
    ['touch', 4], ['organs', 5], ['temperature', 6], ['time', 7],
  ].map(([n, i]) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2
    const x = 230 + Math.cos(a) * 155, y = 96 + Math.sin(a) * 74
    const anchor = Math.cos(a) > 0.3 ? 'start' : Math.cos(a) < -0.3 ? 'end' : 'middle'
    return `<g class="s${i}">
      <line x1="${230 + Math.cos(a) * 56}" y1="${96 + Math.sin(a) * 66}" x2="${x - Math.cos(a) * 8}" y2="${y - Math.sin(a) * 4}"
        stroke="var(--accent)" stroke-width="1.2"/>
      <text x="${x}" y="${y + 3}" class="lbl" font-size="9.5" text-anchor="${anchor}">${n}</text></g>`
  }).join('')}
  <text x="230" y="182" class="lbl" font-size="9.5" text-anchor="middle">only the first two get counted; the rest locate you</text>
</svg>`

  const conFig = `
<svg viewBox="0 0 460 170" role="img" class="config">
  <rect x="34" y="34" width="150" height="52" rx="8" fill="var(--panel)" stroke="var(--accent)"/>
  <g class="eye"><circle cx="109" cy="60" r="9" fill="var(--accent)"/></g>
  <text x="109" y="104" class="lbl" font-size="9.5" text-anchor="middle">eyes: we are moving</text>
  <rect x="276" y="34" width="150" height="52" rx="8" fill="var(--panel)" stroke="var(--accent2)"/>
  <circle cx="351" cy="60" r="9" fill="var(--accent2)"/>
  <text x="351" y="104" class="lbl" font-size="9.5" text-anchor="middle">inner ear: we are still</text>
  <g class="warn">
    <path d="M212 44 L248 76 M248 44 L212 76" stroke="var(--warn)" stroke-width="2.6"/>
    <text x="230" y="134" class="lbl" font-size="10" text-anchor="middle" fill="var(--warn)">unresolvable conflict</text>
    <text x="230" y="152" class="lbl" font-size="9.5" text-anchor="middle" fill="var(--warn)">and the response to it is nausea, not confusion</text>
  </g>
</svg>`

  const ownFig = `
<svg viewBox="0 0 460 170" role="img" class="ownfig">
  <rect x="46" y="70" width="120" height="24" rx="12" fill="var(--dimmer)" opacity=".45"/>
  <text x="106" y="112" class="lbl" font-size="9" text-anchor="middle">your hand, hidden</text>
  <rect x="252" y="70" width="120" height="24" rx="12" fill="var(--panel2)" stroke="var(--line)"/>
  <text x="312" y="112" class="lbl" font-size="9" text-anchor="middle">a false hand, in view</text>
  <g class="t1"><circle cx="106" cy="58" r="6" fill="var(--accent)"/></g>
  <g class="t2"><circle cx="312" cy="58" r="6" fill="var(--accent)"/></g>
  <text x="230" y="34" class="lbl" font-size="9.5" text-anchor="middle">stroked at exactly the same moment</text>
  <g class="claimed">
    <rect x="248" y="66" width="128" height="32" rx="16" fill="none" stroke="var(--ok)" stroke-width="2"/>
    <text x="230" y="140" class="lbl" font-size="9.5" text-anchor="middle" fill="var(--ok)">the brain reassigns ownership to the one it can see</text>
  </g>
</svg>`

  const brkFig = `
<svg viewBox="0 0 460 170" role="img" class="brkfig">
  <g class="world">
    <rect x="30" y="26" width="400" height="96" rx="8" fill="var(--panel2)" stroke="var(--line)"/>
    <text x="230" y="80" class="val" font-size="13" text-anchor="middle">a place you are in</text>
  </g>
  <g class="seamline">
    <line x1="302" y1="26" x2="302" y2="122" stroke="var(--warn)" stroke-width="2.4" stroke-dasharray="6 5"/>
    <text x="230" y="148" class="lbl" font-size="9.5" text-anchor="middle" fill="var(--warn)">one wrong cue and it is a room with equipment in it again</text>
  </g>
  <text x="230" y="18" class="lbl" font-size="9" text-anchor="middle">presence is binary in experience and continuous in cause</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / presence</div>
${learnNav(esc, 'presence')}
<div class="lhero">
  <h2>Being somewhere</h2>
  <p class="lede">Five senses is a children\'s answer. The ones that decide whether a body believes it is in a place are mostly the uncounted ones — balance, the position of your own limbs, the state of your own organs — and presence is simply what happens when every one of them agrees with what your eyes and ears are reporting.</p>
</div>

${S('Start here', 'The senses nobody counts', [
  'Sight and hearing get all the attention because they are the ones a show buys equipment for. They are not the ones doing the work of locating you.',
])}

<div class="senses">
  <div><dt>Vestibular</dt><dd>Fluid-filled canals in the inner ear reporting rotation and acceleration. It is the only sense that tells you which way is down, and you never notice it until it disagrees with your eyes.</dd></div>
  <div><dt>Proprioception</dt><dd>Receptors in muscles and joints reporting where your limbs are without looking. Close your eyes and touch your nose — that is this, and it is the sense that makes a body feel like <em>yours</em>.</dd></div>
  <div><dt>Interoception</dt><dd>The state of the inside: heart rate, breath, gut, temperature, the vague sense of being alright or not. It supplies most of the raw material the <a href="/learn/emotion/">emotion page</a> is about.</dd></div>
  <div><dt>Thermoception</dt><dd>Temperature, including airflow across skin. It is a large part of why a room feels like outdoors, a cellar, or a crowd — and it is almost never designed.</dd></div>
  <div><dt>Nociception</dt><dd>Damage and threat. Mostly relevant here as something to design carefully around rather than toward.</dd></div>
  <div><dt>Time</dt><dd>Not a sense organ, and unmistakably a perception — and thoroughly distortable by arousal, darkness, absorption and the absence of clocks.</dd></div>
</div>

${fig(senseFig, 'One body, many streams. Presence is all of them agreeing.')}

${S('The useful split', 'Two illusions, and they fail separately', [
  'Mel Slater\'s distinction is the most practically useful idea in this whole area, and it applies to a set, a room and an installation exactly as much as to a headset.',
])}

<div class="two">
  <div>
    <h4>Place illusion</h4>
    <p class="lat">“I am here”</p>
    <p>The sense of being located somewhere. It is built from <b>sensorimotor contingencies</b> — when you turn your head, the world moves the way a world moves; when you lean, the parallax is right; when you step, the sound changes as it should.</p>
    <p>Broken by anything that makes the world stop behaving like a world: latency, a wrong perspective, sound that does not move with you, an edge you can see past.</p>
  </div>
  <div>
    <h4>Plausibility illusion</h4>
    <p class="lat">“This is really happening”</p>
    <p>The sense that the events are real. It is built from <b>the world responding to you</b>: things react to your presence, other agents acknowledge you, and events follow a coherent internal logic.</p>
    <p>Broken by anything that shows the world does not know you are there — a character who looks through you, an object that cannot be affected, a state that resets while you are watching.</p>
  </div>
</div>

<p style="color:var(--dim);font-size:15px;max-width:66ch">The reason this matters is that they need <b>different work</b>. Place illusion is largely a tracking, latency and rendering problem — engineering. Plausibility is a design and content problem, and no amount of resolution will fix it. A photoreal environment where nothing responds to you scores very high on the first and fails completely on the second, which is why so much high-budget immersive work feels strangely inert.</p>

${rule('“I am here” and “this is really happening” are separate illusions. <b>Diagnose which one broke</b> before you spend anything, because the fixes are in different departments.')}

${S('Owning a body', 'The rubber hand, and why it matters here', [
  'Hide someone\'s hand, put a false one where they can see it, and stroke both at exactly the same moment. Within a minute or two most people report that the false hand feels like theirs — and will flinch when it is threatened.',
  'The mechanism is straightforward once stated. The brain is continuously deciding which body it is in, based on which sensory streams agree. Vision says the touch is happening there; touch says a touch is happening now; the two are synchronous; the simplest explanation is that <em>there</em> is where the hand is. Break the synchrony by even a modest delay and the effect collapses.',
  'For anything with an avatar, a puppet, a prosthetic or a tracked object, this is the working principle: <b>ownership follows synchrony</b>. A virtual hand that moves with yours becomes yours within seconds. Add latency, or make the movement approximate, and it stays a graphic. The tolerance here is tight — the same order as the <a href="/learn/perception/">audiovisual binding window</a>, and for the same reason.',
])}

${fig(ownFig, 'Synchronous touch, and the brain reassigns which hand is yours. Delay it and the effect vanishes.')}

${S('Causing things', 'The sense of agency, and why latency destroys it', [
  'Separately from owning a body, there is a sense of having <em>caused</em> something — and it too is inferred rather than known directly. The brain compares what it predicted an action would do with what happened, and if they match closely enough in time and content, it concludes you did it.',
  'The timing tolerance is remarkably short. Push it out and the feeling of authorship fades even though the causal chain is unchanged: you know you pressed the button, and it stops feeling like you made the thing happen. There is a measurable companion effect — an action and its outcome are perceived as closer together in time when you caused them, sometimes called intentional binding — and it disappears as the delay grows.',
  'This is why interactive work lives or dies on latency in a way that video playback does not. A hundred milliseconds in a linear show is nothing. A hundred milliseconds between a visitor\'s gesture and the response is the difference between "I did that" and "something happened".',
])}

${S('Breaking it', 'What actually ends presence', [
  'Presence is experienced as binary — you are either in the place or you are in a room with equipment in it — while its causes are continuous. A break in presence is usually one cue crossing a threshold, and the same short list is responsible almost every time.',
  '<b>Latency and mismatch.</b> The world lagging behind your head, or moving when you did not move it. The special case is a conflict your body cannot resolve: eyes reporting motion while the vestibular system reports stillness. Camera and performer position reach a render engine over <a href="/protocols/freed/">FreeD</a>, <a href="/protocols/psn/">PSN</a> and <a href="/protocols/rttrpm/">RTTrPM</a>, and the latency of that path is the thing being described here. That is not confusing, it is <em>nauseating</em> — a hard physiological limit rather than a quality setting.',
  '<b>A visible seam.</b> The edge of a projection, the join in an LED wall, a masking gap, a light spilling from a doorway, a technician crossing upstage. Attention is drawn by contrast, so any seam becomes the most interesting thing in the frame.',
  '<b>Sound from the wrong place.</b> Sound localisation is fast, accurate and involuntary. A voice that comes from a PA rather than a body is one of the strongest presence-breaking cues there is, which is exactly what <a href="/learn/systems/">object audio</a> — a <a href="/hardware/db-ds100/">DS100</a>, an <a href="/software/l-isa-controller/">L-ISA</a> system — exists to fix.',
  '<b>A world that does not notice you.</b> The plausibility failure — the thing you cannot touch, the character who looks through you, the state that visibly resets.',
  '<b>The real world getting in.</b> A phone, a draught from the wrong direction, a queue visible past the set, the smell of the foyer. Presence is a whole-body agreement, and it only takes one dissenter.',
])}

<div class="figrow">
  ${fig(conFig, 'Eyes and balance disagreeing. The body\'s answer to that is not confusion, it is nausea.')}
  ${fig(brkFig, 'One wrong cue, and it is a room with equipment in it again.')}
</div>

${S('', 'How much delay before the world stops being yours?', [
  'Motion-to-photon is the time between your head moving and the light for that new viewpoint reaching your eye. Everything on this page has a threshold somewhere along it.',
])}

<div class="dial">
  <div class="d"><label for="mp-l">motion-to-photon <b id="mp-lv">18 ms</b></label>
    <input id="mp-l" type="range" min="2" max="160" step="1" value="18"></div>
  <div class="d"><label for="mp-r">refresh rate <b id="mp-rv">90 Hz</b></label>
    <input id="mp-r" type="range" min="30" max="144" step="6" value="90"></div>
</div>
<div class="verdict" id="mp-out"></div>

${S('Building it', 'What actually helps', [
  '<b>Get the head right first.</b> Tracking quality and motion-to-photon latency buy more presence per pound than resolution does, every time. A lower-fidelity world that responds correctly beats a beautiful one that lags.',
  '<b>Give the world a way to notice people.</b> One genuine response — a light that follows, a sound that acknowledges, a door that opens because you approached — does more for plausibility than a great deal of visual detail.',
  '<b>Design the threshold.</b> The transition into the space is when presence is established or lost. A corridor, a dimming, a change of temperature, a moment of held silence — a deliberate boundary gives the body time to accept a new place.',
  '<b>Use the uncounted senses.</b> Airflow, temperature, floor texture, a subtle low-frequency floor vibration. These are cheap relative to visual fidelity and they land on channels nothing else is competing for.',
  '<b>Hide the seams or make them intentional.</b> If a visitor can see the edge, either mask it or make the edge part of the fiction. What you cannot do is hope they will not look.',
  '<b>Choose comfort deliberately.</b> Locomotion that moves the view without moving the body is the primary cause of sickness, and the mitigations — teleporting instead of gliding, narrowing the field of view during motion, giving a stable reference in view — cost some elegance and are worth it.',
])}

${bites([
  '<b>Sickness is not a tolerance problem to be pushed through.</b> It is a sensory conflict, it affects some people far more than others, and it disproportionately affects people who are not the young men most systems get tested on.',
  '<b>Presence is not the goal of every piece.</b> Plenty of excellent work wants you aware you are in a theatre. Breaking presence deliberately is a technique; breaking it by accident is a fault.',
  '<b>You cannot ask people whether they felt present.</b> Asking makes them notice the room. Behaviour — flinching, ducking, reaching, keeping their distance from a virtual edge — is much better evidence than a questionnaire.',
  '<b>Adaptation is real and asymmetric.</b> People acclimatise across a session, so the version that feels fine to a team who have been in it for six weeks may not be the version an audience meets cold.',
])}

${xnote('Presence is the precondition for everything else. An audience that has not accepted the place cannot be moved by what happens in it, which is why the <b>threshold and the first two minutes</b> are worth more design attention than they usually get.')}

${S('Why this page is here', 'A set and a headset are the same problem', [
  'It would be easy to file all of this under virtual reality. That would be a mistake, because everything on it applies to a black box, an arena and a promenade piece.',
  'A set convinces because the sightlines hold from every seat, the sound comes from where the thing is, nothing visible contradicts the fiction, and the world reacts. A headset convinces for exactly the same reasons, using exactly the same senses, with tighter tolerances because it has taken responsibility for more of the signal.',
  'And both of them are working on a body that has been quietly running the <a href="/learn/neuro/">prediction machinery</a> the previous pages describe — comparing what it expected against what arrived, and concluding, or not, that it is somewhere.',
])}

<div class="cta"><strong>Work in immersive or XR?</strong>
<p>Field practice here is far ahead of what is written down, particularly the comfort mitigations that actually survive contact with a public audience. If you have hard-won knowledge about what breaks presence in a real venue, <a href="${GH}/issues/new?labels=tooling&amp;title=presence%3A+">open an issue</a>.</p></div>

<script>
(function(){
  var l=document.getElementById('mp-l'); if(!l) return;
  var r=document.getElementById('mp-r'), lv=document.getElementById('mp-lv'),
      rv=document.getElementById('mp-rv'), out=document.getElementById('mp-out');
  function draw(){
    var ms=Number(l.value), hz=Number(r.value), frame=1000/hz;
    lv.textContent=ms+' ms'; rv.textContent=hz+' Hz';
    var frames=ms/frame;
    var verdict = ms<=20
      ? '<span class="ok">Inside the usual comfort target.</span> The world moves when you do, and place illusion holds.'
      : ms<=40
      ? 'Detectable. Presence survives sitting still and starts to fray on fast head movement.'
      : ms<=80
      ? '<span class="err">Agency is going.</span> You still know you moved; it stops feeling like you caused what happened.'
      : '<span class="err">Sensory conflict.</span> At this delay the eyes and the vestibular system are telling different stories, and the answer a body gives to that is nausea.';
    out.innerHTML='<b>'+ms+' ms</b> is <b>'+frames.toFixed(1)+'</b> frames at '+hz+' Hz ('+frame.toFixed(1)+
      ' ms each). '+verdict+' Note that refresh rate does not fix latency \u2014 <b>90 Hz says frames arrive often, not that they are recent</b>.';
  }
  l.addEventListener('input',draw); r.addEventListener('input',draw); draw();
})();
</script>
`

  return shell({
    title: 'Being somewhere — presence, body ownership and what breaks the illusion | showstack',
    description: 'The senses nobody counts, place illusion versus plausibility illusion and why they fail separately, how synchrony makes a body claim a limb, why latency destroys the sense of agency, and the short list of cues that actually end presence in a set or a headset.',
    canonical: `${SITE}/learn/presence/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Presence: how a body decides it is somewhere',
      description: 'Vestibular, proprioceptive and interoceptive senses, place and plausibility illusions, body ownership and synchrony, the sense of agency, and what breaks presence.',
      url: `${SITE}/learn/presence/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
