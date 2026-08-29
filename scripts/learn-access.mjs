/**
 * /learn/access/ — the part of the audience the default design excludes.
 *
 * This site is unusually careful about accessibility in its own interface —
 * there is an audit script that fails the build over target sizes and contrast
 * ratios — and had nothing at all to say about accessibility in the shows it
 * describes. That gap is worth closing precisely because the technical trade
 * treats access as somebody else's department, usually front of house, usually
 * after the design is finished.
 *
 * The argument the page makes is that all four of the big access provisions
 * are engineering problems with numbers attached, and every one of them is
 * cheap at the plot stage and expensive afterwards:
 *
 *   - flash rate is a lighting programming constraint with a hard threshold
 *   - assistive listening is an RF and audio-distribution problem with a
 *     legally specified receiver count
 *   - captioning is a latency budget
 *   - audio description is another wireless channel to coordinate
 *
 * No moralising. The claim is that these are solvable, specified, and mostly
 * ignored for want of somebody treating them as technical work.
 */
import { flashRate, assistiveListening } from './toolmath.mjs'
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

const MATH_SRC = [flashRate, assistiveListening].map((f) => f.toString()).join('\n\n')

export function learnAccessPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* A flash train against the three-per-second line. The bars appear at the
   rate being set, so the guidance line is something you watch get crossed
   rather than a number in a sentence. */
.flfig .bar{transition:opacity .12s linear}
.flfig .limit{stroke-dasharray:6 5}
/* The three assistive listening technologies, as coverage shapes. */
.alfig .zone{transition:opacity .3s ease}
.altabs{display:flex;gap:0;border:1px solid var(--rule-strong);border-radius:9px;overflow:hidden;
margin:16px 0 0;flex-wrap:wrap}
.altabs button{flex:1 1 110px;background:var(--surface-raised);color:var(--ink-muted);border:0;
border-right:1px solid var(--rule);font-family:var(--mono);font-size:12.5px;padding:0 12px;
min-height:44px;cursor:pointer}
.altabs button:last-child{border-right:0}
.altabs button[aria-pressed="true"]{background:color-mix(in srgb,var(--signal) 16%,var(--surface-raised));color:var(--signal)}
.atable{width:100%;border-collapse:collapse;font-size:14px;margin:14px 0}
.atable th{text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;
color:var(--ink-faint);padding:0 12px 9px 0;border-bottom:1px solid var(--rule);font-weight:400}
.atable td{padding:11px 12px 11px 0;border-bottom:1px solid var(--rule);vertical-align:top;
color:var(--ink-muted);line-height:1.55}
.atable td:first-child{font-family:var(--mono);font-size:12.5px;color:var(--ink);white-space:nowrap}
.atable td strong{color:var(--ink)}
.tblscroll{overflow-x:auto;margin:14px 0}
`

  const flashFig = `
<svg viewBox="0 0 620 200" role="img" class="flfig">
  <line x1="40" y1="150" x2="590" y2="150" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <g id="ff-bars"></g>
  <line class="limit" x1="40" y1="60" x2="590" y2="60" stroke="var(--fail)" stroke-width="2"/>
  <text x="590" y="52" class="lbl" text-anchor="end" style="fill:var(--fail)">three flashes in any one second</text>
  <text x="40" y="176" class="lbl">one second</text>
  <text x="40" y="192" class="lbl">Each bar is a flash. Four in this second is not a stylistic choice; it is over the line.</text>
</svg>`

  const alFig = `
<svg viewBox="0 0 620 230" role="img" class="alfig">
  <rect x="40" y="40" width="540" height="150" rx="8" fill="none" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <rect x="40" y="40" width="540" height="26" fill="color-mix(in srgb,var(--ink) 8%,transparent)"/>
  <text x="310" y="58" class="lbl" text-anchor="middle">stage</text>
  <g class="zone" id="al-loop-z">
    <rect x="52" y="76" width="516" height="102" rx="5" fill="color-mix(in srgb,var(--signal) 20%,transparent)"
          stroke="var(--signal)" stroke-width="2" stroke-dasharray="8 5"/>
    <text x="310" y="132" class="val" text-anchor="middle" style="fill:var(--signal)">loop covers every seat &mdash; no receiver to collect</text>
  </g>
  <g class="zone" id="al-ir-z" opacity="0">
    <path d="M310 70 L120 178 L500 178 Z" fill="color-mix(in srgb,var(--accent2) 22%,transparent)"
          stroke="var(--accent2)" stroke-width="2"/>
    <text x="310" y="140" class="val" text-anchor="middle" style="fill:var(--accent2)">line of sight only</text>
    <text x="80" y="172" class="lbl">under the balcony: nothing</text>
  </g>
  <g class="zone" id="al-rf-z" opacity="0">
    <rect x="46" y="72" width="528" height="110" rx="5" fill="color-mix(in srgb,var(--dom-network) 18%,transparent)"
          stroke="var(--dom-network)" stroke-width="2"/>
    <text x="310" y="126" class="val" text-anchor="middle" style="fill:var(--dom-network)">covers the room, and the car park</text>
    <text x="310" y="146" class="lbl" text-anchor="middle">another channel to coordinate</text>
  </g>
  <text x="40" y="216" class="lbl">Same job, three different coverage problems. The one you pick decides who can actually use it.</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / access</div>
${learnNav(esc, 'access')}
<h2>Who the show is not reaching</h2>
<p class="lede">Four access provisions, all of them engineering problems with numbers attached, all of them cheap at the plot stage and expensive afterwards. None of this is front of house&rsquo;s department. Every one of them is decided by somebody in a technical role, usually without noticing they decided it.</p>

${S('Flash', 'Three per second, and why it is not a style choice',
  ['Photosensitive epilepsy affects a small proportion of the population and a large proportion of a stadium. The threshold is not a house rule &mdash; it is the same number in <a href="https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html" rel="noopener nofollow">WCAG 2.3.1</a>, in ITU-R BT.1702 and in the Ofcom broadcast guidance: <strong>no more than three flashes in any one-second period</strong>.',
   'Two refinements matter on a show. Sensitivity peaks between roughly 15 and 20&nbsp;Hz, which is exactly where a strobe lands when somebody sets it by feel against a track. And saturated deep red is judged more strictly than any other colour, because the response it provokes is not the same as an equivalent white flash. Static patterns count too: more than about five clearly discernible light-dark stripe pairs is its own hazard, which is why a fast-moving high-contrast gobo pattern can be a problem at no flash rate at all.',
   'The useful reframing is musical rather than numeric, because nobody types a frequency into a console. A strobe on every beat of a 128&nbsp;BPM track is 2.13 flashes a second and fine. On every eighth note it is 4.27 and it is not. The threshold sits between two ordinary programming decisions, which is exactly why it gets crossed by accident.'])}

${fig(flashFig, 'Set a tempo and a division. The bars are flashes; the red line is the limit.')}

<div class="tryit">
  <div class="f"><label for="ff-bpm">Tempo <span id="ff-bpm-v">128 BPM</span></label>
    <input id="ff-bpm" type="range" min="60" max="200" step="1" value="128"></div>
  <div class="f"><label for="ff-div">Strobe on</label>
    <select id="ff-div">
      <option value="0.25">every bar</option>
      <option value="0.5">every 2 beats</option>
      <option value="1" selected>every beat</option>
      <option value="2">every 1/8 note</option>
      <option value="4">every 1/16 note</option>
    </select></div>
</div>
<div class="readout" id="ff-out" role="status" aria-live="polite"></div>

${rule('The limit sits <b>between two ordinary programming decisions</b> at club tempo. That is why it gets crossed by accident rather than by intent &mdash; and why the check belongs in the plot, not in the notes.')}

${bites([
  '<b>Signage instead of design.</b> A notice at the door discharges a duty and does nothing for somebody who is already inside when the cue fires. It is the last line of defence, not the first.',
  '<b>Effects that stack.</b> Two fixtures each at 2 Hz, offset, are 4 Hz in the room. The threshold is about what the eye receives, not what any one fixture is set to.',
  '<b>Video content nobody checked.</b> Supplied content, VJ loops and camera cuts all flash. Lighting gets scrutinised for this and screens routinely do not.',
  '<b>Cameras in the audience.</b> A broadcast or IMAG feed carries the flash to everyone watching a screen, where the assessment standards are stricter and a Harding test is the normal instrument.',
])}

${S('Hearing', 'Three ways to get sound to somebody, and they fail differently',
  ['An assistive listening system takes a clean feed of the show and delivers it to a listener without the room in the way. That last part is the point: for most people with hearing loss the problem is not level, it is separating a voice from reverberation and crowd noise, and turning the PA up makes it worse rather than better.',
   'There are three delivery technologies and they are not interchangeable. An <strong>induction loop</strong> drives a wire around the seating area and couples magnetically to the telecoil built into most hearing aids &mdash; nobody has to collect anything, which is the single biggest determinant of whether a system gets used at all. <strong>Infrared</strong> needs line of sight, which means under a balcony is dead, but it does not leak out of the room, which is why it is used where confidentiality matters. <strong>RF</strong> covers the building comfortably and is therefore one more set of frequencies to coordinate against your radio mics.'])}

${fig(alFig, 'Same job, three coverage problems.')}

<div class="altabs" role="group" aria-label="Assistive listening technology">
  <button type="button" id="al-loop" aria-pressed="true">induction loop</button>
  <button type="button" id="al-ir" aria-pressed="false">infrared</button>
  <button type="button" id="al-rf" aria-pressed="false">RF</button>
</div>

<div class="tryit">
  <div class="f"><label for="af-s">Seats <span id="af-s-v">850</span></label>
    <input id="af-s" type="range" min="50" max="4000" step="50" value="850"></div>
</div>
<div class="readout" id="af-out" role="status" aria-live="polite"></div>

${rule('The receiver count is <b>specified, not estimated</b>. Table 219.3 of the ADA Standards is a stepped formula, and a share of those receivers must couple to a telecoil rather than to headphones.')}

${bites([
  '<b>A system nobody can switch on.</b> The commonest failure by a distance. The receivers are in a cupboard, the batteries are flat, and the duty manager has never been shown the panel. This is a technical handover problem, not a policy one.',
  '<b>Feeding it the wrong mix.</b> The main PA mix is not the right source: it is voiced for a room. A dedicated mix, dry and speech-forward, is what makes the system worth having.',
  '<b>Headphones counted as hearing-aid compatible.</b> They are not. Compatibility means a neckloop or similar that couples to a telecoil, and it is a separate count in the table.',
  '<b>RF assistive listening left out of the coordination.</b> It is another transmitter in a band you are already fighting over. Coordinate it with the mics, not after them.',
])}

${S('Words', 'Captioning is a latency budget',
  ['Captioning and surtitling are the same technical problem with different politics: get accurate text on a surface, in time. The engineering constraint is latency, and it is unforgiving in a way pre-recorded captioning is not. A caption that lands two seconds after the line is tolerable. Four seconds and the audience is reading the previous joke while the room laughs at this one, which is worse than no captions at all because it actively removes them from the shared moment.',
   'That budget is spent in three places: the human or machine producing the text, the transport, and the display. A live captioner working from speech is the largest and least compressible share. Automatic speech recognition is faster but wrong in a characteristic way &mdash; it fails on proper nouns, technical vocabulary and crosstalk, which on a show is most of what matters. The transport is where a technical team can actually win time, and it is usually the part nobody looks at.',
   'Two delivery choices follow. <strong>Open captions</strong> are burned into a surface everyone sees, cost nothing per person, and cannot be turned off. <strong>Closed captions</strong> go to a personal device or a seat-back unit, which serves people who want them without changing the show for anyone else &mdash; at the cost of a distribution system, a network, and something for the audience to collect and return.'])}

<div class="tblscroll">
<table class="atable">
  <thead><tr><th>Provision</th><th>What it actually costs technically</th><th>Where it usually fails</th></tr></thead>
  <tbody>
    <tr><td>Open captions</td><td>A surface, a feed, and a sightline study &mdash; the caption screen is scenery and has to be in the plot</td><td>Placed where half the house cannot see it, or too far from the action to watch both</td></tr>
    <tr><td>Closed captions</td><td>A network, devices, charging, handout and return</td><td>Wi-Fi that was specified for the crew, not for 300 audience devices</td></tr>
    <tr><td>Audio description</td><td>Another wireless channel, a describer position, and a mix that ducks</td><td>Coordinated last, so it lands on top of a radio mic</td></tr>
    <tr><td>Assistive listening</td><td>A dedicated speech mix and a distribution system</td><td>Fed the main mix, or nobody on duty knows where the receivers are</td></tr>
  </tbody>
</table>
</div>

${S('Describing', 'Audio description is a mix problem before it is a script problem',
  ['Audio description narrates what is happening visually, on a separate channel, for blind and partially sighted audience members. Technically it is a small live radio station running in parallel with the show: a describer in a position with a clear view, a microphone, a mix, and a distribution path to a receiver in somebody&rsquo;s hand.',
   'The part that is genuinely an engineering decision is what the listener hears underneath. Description on its own leaves them without the show; the show at full level makes the description unintelligible. So the channel carries a mix &mdash; programme plus description, with the programme ducked under the voice &mdash; and how that duck is set is the difference between a usable service and an unusable one. It is the same problem as a broadcast voice-over and it wants the same care.',
   'Two practical consequences for a technical team. The describer needs a position with sightlines, light to read by, and comms that will not appear on the channel. And the receivers are more transmitters and receivers in a band that is already contested, so audio description belongs in the frequency coordination from the start rather than being handed a leftover.'])}

${S('The rest of the room', 'Sightlines, seats and the performance that gets adjusted',
  ['Wheelchair spaces are not just floor area: the standards require them to be dispersed rather than clustered, with companion seating, and with sightlines comparable to the rest of the house. That last requirement is where technical departments quietly do damage. A front-of-house mix position, a followspot platform or a delay tower placed after the seating plan was signed off can eat an accessible route or block the only sightline a wheelchair space had, and it will not show up in anybody&rsquo;s drawings as an access problem.',
   'Relaxed and sensory-adjusted performances are the other common provision, and they are almost entirely a technical brief: a cap on peak SPL, house lights at a low level rather than out, strobes and haze removed or reduced, sudden transitions softened, and a quiet space with a video and audio feed so somebody can leave and still be at the show. None of that is difficult. All of it needs deciding in the plot rather than negotiated in the last hour.'])}

${bites([
  '<b>Technical positions placed last.</b> Mix position, followspot platforms and delay towers get sited after the seating plan and take out accessible routes and sightlines. Put them in the same drawing.',
  '<b>&ldquo;Comparable sightlines&rdquo; measured from an empty room.</b> A standing audience in front of a wheelchair space removes the sightline that existed at the survey.',
  '<b>Relaxed performances treated as a lighting change.</b> The SPL cap, the haze, the transitions and the relay feed to the quiet space are all separate departments, and all of them need telling.',
  '<b>Access provision with no rehearsal.</b> The one run where nobody tests the loop, the captions and the description together is the run where they all get discovered at once, in front of an audience.',
])}

${xnote('Everything on this page is an experience decision wearing technical clothes. A caption four seconds late does not just fail to inform &mdash; it removes somebody from the shared moment the whole room is having, which is the thing they actually came for. The mechanism is the same one that makes lip-sync error unbearable at a few frames: an audience will forgive missing information far more readily than it will forgive being out of step with everybody around them.')}

${S('Where this goes next', 'The calculators on this page',
  ['<a href="/tools/#flash">Flash rate</a> converts a tempo and a division into flashes per second and checks it against the guidance, and tells you the fastest division that still fits. <a href="/tools/#ada">Assistive listening receivers</a> works Table 219.3 for a seat count, including the hearing-aid-compatible column and the induction-loop exception. The <a href="/standards/">standards index</a> has the documents themselves &mdash; and unlike most of this site, these are ones somebody may need to cite rather than merely apply.'])}
`

  const script = `
${MATH_SRC}
(function(){
  var bpm=document.getElementById('ff-bpm'), div=document.getElementById('ff-div');
  if(!bpm||!div)return;
  var bars=document.getElementById('ff-bars');
  var NS='http://www.w3.org/2000/svg';
  function draw(){
    var b=Number(bpm.value), d=Number(div.value);
    document.getElementById('ff-bpm-v').textContent=b+' BPM';
    var hz=flashRate(0).fromBpm(b,d);
    var r=flashRate(hz);
    /* Draw one second of flashes across the width. Capped at 12 so a 1/16
       at 200 BPM does not turn into a solid block. */
    bars.textContent='';
    var n=Math.min(12, Math.round(hz));
    for(var i=0;i<n;i++){
      var x=52+i*(520/Math.max(1,n));
      var bar=document.createElementNS(NS,'rect');
      bar.setAttribute('class','bar');
      bar.setAttribute('x',x); bar.setAttribute('y',72);
      bar.setAttribute('width',Math.min(28,440/Math.max(1,n)));
      bar.setAttribute('height',78); bar.setAttribute('rx',2);
      bar.setAttribute('fill', r.withinGuidance ? 'var(--signal)' : 'var(--fail)');
      bars.appendChild(bar);
    }
    var out=document.getElementById('ff-out');
    var lead='<b>'+r.flashesPerSecond+'</b> flashes per second at '+b+' BPM, '
      +div.selectedOptions[0].textContent+'. ';
    if(r.withinGuidance){
      out.innerHTML=lead+'Inside the three-per-second guidance'
        +(r.peakBand?' &mdash; but this rate sits in the 15 to 20 Hz band where sensitivity peaks.':'.');
    } else {
      var safe=r.slowestSafeDivision(b);
      out.innerHTML=lead+'<b>Over the limit.</b>'
        +(safe?' At this tempo the fastest division that stays inside it is '+safe.label+', which is '+safe.rate+' a second.':'');
    }
  }
  bpm.addEventListener('input',draw); div.addEventListener('change',draw); draw();
})();
(function(){
  var s=document.getElementById('af-s');
  if(!s)return;
  var tabs=[['al-loop','al-loop-z'],['al-ir','al-ir-z'],['al-rf','al-rf-z']];
  var current='al-loop';
  function paint(){
    tabs.forEach(function(t){
      var on=t[0]===current;
      var btn=document.getElementById(t[0]), zone=document.getElementById(t[1]);
      if(btn)btn.setAttribute('aria-pressed', on?'true':'false');
      if(zone)zone.setAttribute('opacity', on?'1':'0');
    });
    draw();
  }
  function draw(){
    var seats=Number(s.value);
    document.getElementById('af-s-v').textContent=seats.toLocaleString();
    var loop=current==='al-loop';
    var r=assistiveListening(seats,{inductionLoopAllSeats:loop});
    if(!r)return;
    var out=document.getElementById('af-out');
    var html='<b>'+r.receivers+'</b> receivers required for '+seats.toLocaleString()
      +' seats &mdash; Table 219.3 row &ldquo;'+r.band+'&rdquo;, roughly one per '+r.onePer+' seats.';
    html += loop
      ? '<br>An induction loop over every seat waives the hearing-aid compatible count under Exception 2: the hearing aids in the room already are the receivers.'
      : '<br><b>'+r.hearingAidCompatible+'</b> of them must be hearing-aid compatible &mdash; a neckloop that couples to a telecoil, not headphones.';
    out.innerHTML=html;
  }
  tabs.forEach(function(t){
    var btn=document.getElementById(t[0]);
    if(btn)btn.addEventListener('click',function(){current=t[0];paint()});
  });
  s.addEventListener('input',draw);
  paint();
})();
`

  return shell({
    title: 'Who the show is not reaching — flash rate, hearing, captions and description | showstack',
    description: 'Four access provisions as engineering problems with numbers attached: the three-flashes-per-second threshold and where it sits between two ordinary programming decisions, three assistive listening technologies that fail differently, captioning as a latency budget, and audio description as a mix problem.',
    canonical: `${SITE}/learn/access/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Who the show is not reaching',
      url: `${SITE}/learn/access/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
