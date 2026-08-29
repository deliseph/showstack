/**
 * /learn/experience/ — the capstone.
 *
 * Everything else on this site is a chain from a console to a nervous system.
 * This page is what you do with that chain when the job is not "make a signal
 * arrive" but "make something happen to a person over an hour".
 *
 * The organising claim: you cannot design a feeling, only the conditions and
 * the timing. So the materials are attention, arousal and expectation, and
 * the structure is a sequence in time rather than a set of moments. Every
 * technical decision elsewhere on the site is an experience decision seen
 * from underneath, and this page names the ones that matter most.
 *
 * The interactive is a running-order shaper, because the peak-end rule is
 * something you have to see acted on a curve before it changes how you plan.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, LEARN_GROUPS, LEARN_TOPICS } from './learn-kit.mjs'

export function learnExperiencePage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* the three materials, orbiting the same person */
@keyframes mglow{0%,100%{opacity:.35}30%,50%{opacity:1}}
.matfig .m1{animation:mglow 5.1s ease-in-out infinite}
.matfig .m2{animation:mglow 5.1s ease-in-out infinite;animation-delay:1.7s}
.matfig .m3{animation:mglow 5.1s ease-in-out infinite;animation-delay:3.4s}
/* the journey, walked */
@keyframes walkpath{0%{offset-distance:0%}100%{offset-distance:100%}}
@keyframes stage-on{0%,100%{opacity:.3}}
${[...Array(7)].map((_, i) => `.jrnfig .g${i}{animation:mglow 7s ease-in-out infinite;animation-delay:${(i * 1).toFixed(1)}s}`).join('')}
@keyframes stroll{0%{transform:translateX(0)}100%{transform:translateX(392px)}}
.jrnfig .you{animation:stroll 7s linear infinite}
/* degradation ladder */
@keyframes fall{0%,18%{opacity:.25}26%,44%{opacity:1}52%,100%{opacity:.25}}
.degfig .d1{animation:fall 5.2s ease-in-out infinite}
.degfig .d2{animation:fall 5.2s ease-in-out infinite;animation-delay:1.3s}
.degfig .d3{animation:fall 5.2s ease-in-out infinite;animation-delay:2.6s}
.degfig .d4{animation:fall 5.2s ease-in-out infinite;animation-delay:3.9s}
/* the running-order shaper */
.shaper{margin:14px 0 0;padding:16px;background:var(--panel);border:1px solid var(--line);
border-radius:var(--r-md)}
.shaper svg{display:block;width:100%;height:auto}
.beats{display:grid;grid-template-columns:repeat(8,1fr);gap:6px;margin-top:14px}
.beats input[type=range]{writing-mode:vertical-lr;direction:rtl;width:100%;height:74px;accent-color:var(--accent)}
.beats label{display:flex;flex-direction:column;align-items:center;gap:6px;
font-family:var(--mono);font-size:9.5px;color:var(--dimmer)}
/* the checklist */
.check{margin:18px 0;border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden}
.check > div{padding:15px 17px;border-bottom:1px solid var(--line)}
.check > div:last-child{border-bottom:none}
.check b{display:block;color:var(--ink);font-size:15px;margin-bottom:5px}
.check span{color:var(--dim);font-size:14px;line-height:1.6}
.check em{font-style:normal;font-family:var(--mono);font-size:11px;color:var(--accent2);
display:block;margin-top:7px;letter-spacing:.3px}
/* the site map, as a practice */
.practice{display:grid;grid-template-columns:repeat(auto-fit,minmax(226px,1fr));gap:13px;margin:20px 0}
.practice > div{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:15px}
.practice h4{margin:0 0 8px;font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;
color:var(--accent)}
.practice p{margin:0 0 10px;color:var(--dim);font-size:13.6px;line-height:1.58}
.practice .lk{display:flex;flex-wrap:wrap;gap:5px}
.practice .lk a{font-family:var(--mono);font-size:10.5px;padding:4px 8px;border:1px solid var(--line);
border-radius:6px;color:var(--dim);text-decoration:none}
.practice .lk a:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--line));color:var(--accent);
text-decoration:none}
`

  const matFig = `
<svg viewBox="0 0 460 190" role="img" class="matfig">
  <circle cx="230" cy="98" r="34" fill="var(--panel2)" stroke="var(--line)"/>
  <text x="230" y="102" class="lbl" font-size="9.5" text-anchor="middle">a person</text>
  ${[
    ['ATTENTION', 'where they are looking', 'm1', 94, 40, 'var(--accent)'],
    ['AROUSAL', 'how stirred up the body is', 'm2', 366, 40, 'var(--accent2)'],
    ['EXPECTATION', 'what they think comes next', 'm3', 230, 172, 'var(--ok)'],
  ].map(([t, s, c, x, y, col]) => `
  <g class="${c}">
    <text x="${x}" y="${y}" class="val" font-size="11" text-anchor="middle" fill="${col}">${t}</text>
    <text x="${x}" y="${y + 15}" class="lbl" font-size="8" text-anchor="middle">${s}</text>
  </g>`).join('')}
  <path d="M120 52 L204 84 M340 52 L256 84 M230 152 L230 134" stroke="var(--line)" stroke-width="1.2" stroke-dasharray="3 4"/>
  <text x="230" y="20" class="lbl" font-size="9.5" text-anchor="middle">three things you can move. Everything else moves one of them.</text>
</svg>`

  const jrnFig = `
<svg viewBox="0 0 460 170" role="img" class="jrnfig">
  <line x1="30" y1="96" x2="430" y2="96" stroke="var(--line)" stroke-width="1.5"/>
  ${['arrive', 'threshold', 'orient', 'settle', 'peak', 'release', 'exit'].map((n, i) => {
    const x = 34 + i * 65
    return `<g class="g${i}">
      <circle cx="${x}" cy="96" r="7" fill="${i === 4 ? 'var(--accent2)' : 'var(--accent)'}"/>
      <text x="${x}" y="${i % 2 ? 78 : 124}" class="lbl" font-size="9" text-anchor="middle">${n}</text>
    </g>`
  }).join('')}
  <g class="you"><circle cx="34" cy="96" r="4" fill="var(--ok)"/></g>
  <text x="230" y="152" class="lbl" font-size="9.5" text-anchor="middle">it starts in the queue and ends in the street</text>
</svg>`

  const degFig = `
<svg viewBox="0 0 460 180" role="img" class="degfig">
  ${[
    ['everything works', 'var(--ok)', 24],
    ['a part fails, and the audience does not find out', 'var(--accent)', 62],
    ['a part fails visibly, and the show continues', 'var(--accent2)', 100],
    ['the show stops, safely, and somebody speaks to the room', 'var(--warn)', 138],
  ].map(([t, c, y], i) => `
  <g class="d${i + 1}">
    <rect x="30" y="${y}" width="400" height="28" rx="6" fill="var(--panel)" stroke="${c}" stroke-width="1.5"/>
    <text x="46" y="${y + 19}" class="lbl" font-size="9.5" fill="${c}">${t}</text>
  </g>`).join('')}
  <text x="230" y="176" class="lbl" font-size="9.5" text-anchor="middle">each rung is decided in advance, or by panic on the night</text>
</svg>`

  const stageLinks = LEARN_GROUPS.map((g) => {
    const t = LEARN_TOPICS.filter((x) => x.group === g.id)
    return { g, t }
  })

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / experience</div>
${learnNav(esc, 'experience')}
<div class="lhero">
  <h2>Experience architecture</h2>
  <p class="lede">Every other page here follows a signal from a console to a nervous system. This one is about what you do with that chain when the job is not "make the signal arrive" but "make something happen to a person over ninety minutes" — which is a different discipline, and the one all the rest of it is for.</p>
</div>

${S('The premise', 'You cannot design a feeling. You can design the conditions and the timing.', [
  'A designer cannot put an emotion into somebody. As the <a href="/learn/emotion/">emotion page</a> sets out, a feeling is constructed from a stirred-up body plus a reading of what the stirring means — and the reading is theirs, not yours.',
  'What you can do is entirely material. You can decide where attention goes and when. You can raise and lower how activated a body is. You can set up an expectation and then meet it, delay it, or break it. Everything else — the fixture choice, the delay time, the subnet, the render budget — is a means of doing one of those three things reliably.',
  'This reframe is not a philosophical nicety. It changes what a production meeting is about. "Make it more emotional" is unactionable. "Raise arousal here, and give them a reading for it, and this is what it is a contrast against" is a plan.',
])}

${fig(matFig, 'Three materials. Every technical choice on this site is a way of moving one of them.')}

${S('The structure', 'An experience is a sequence, not a set of moments', [
  'The most common failure in ambitious work is not a weak moment. It is a strong moment with nothing around it — a peak with no approach, a reveal with nothing established to reveal against, an ending that arrives while the audience is still catching up.',
  'The shape below is not a formula and plenty of good work deliberately breaks it. It is a checklist of stages that exist whether or not anyone designed them, because a person walks through all of them regardless.',
])}

<div class="check">
  <div><b>Arrival</b><span>Begins outside the building. The queue, the signage, the front of house staff, how long they stood, whether they know what is about to happen to them. Expectation is being set here whether you are managing it or not.</span><em>the show has started and you are not in the room</em></div>
  <div><b>Threshold</b><span>The deliberate boundary between out there and in here. A corridor, a dimming, a change of temperature, a held silence. Bodies need a moment to accept a new place — see <a href="/learn/presence/">presence</a>.</span><em>skip this and the first ten minutes are spent arriving</em></div>
  <div><b>Orientation</b><span>Where am I, what are the rules, am I safe, what am I allowed to do. Until this is answered nobody can attend to anything else. In interactive work this is most of the design problem.</span><em>an audience that does not know the rules cannot be surprised by them</em></div>
  <div><b>Settle</b><span>The working body of the piece, where the material accumulates and where restraint is spent. This is the part people wrongly try to make continuously exciting.</span><em>this is the part the peak will be measured against</em></div>
  <div><b>Peak</b><span>The moment that will be remembered. It is only as strong as the contrast it sits on — the ninety minutes in front of it are what make it work.</span><em>engineered, rehearsed, protected from being weakened by everything around it</em></div>
  <div><b>Release</b><span>The return. Not an anticlimax — the resolution the peak was withheld for, and the point at which an audience is allowed to feel something rather than only be stimulated.</span><em>a peak with no release is exhaustion</em></div>
  <div><b>Exit</b><span>The last ninety seconds, and the walk out. Half of what will be remembered is here. It is also the part almost universally under-designed, because it is after the applause.</span><em>the ending is not the last cue, it is the pavement</em></div>
</div>

${fig(jrnFig, 'It starts in the queue and ends in the street. All of it is yours.')}

${S('The lever', 'Shape the running order, and see what survives it', [
  'The <a href="/learn/emotion/">peak-end rule</a> says that what gets remembered is roughly the average of the most intense moment and the final one — and that duration barely counts. Shape a running order below and watch the difference between what happened and what is kept.',
])}

<div class="shaper">
  <svg viewBox="0 0 620 190" role="img" aria-label="A running order, with the remembered value marked">
    <line x1="24" y1="160" x2="600" y2="160" stroke="var(--line)"/>
    <path id="xp-curve" fill="none" stroke="var(--accent)" stroke-width="2.4"/>
    <path id="xp-fill" fill="var(--accent)" opacity=".1"/>
    <line id="xp-avg" x1="24" x2="600" stroke="var(--dimmer)" stroke-width="1.2" stroke-dasharray="4 5"/>
    <line id="xp-rem" x1="24" x2="600" stroke="var(--accent2)" stroke-width="1.8"/>
    <circle id="xp-peak" r="7" fill="var(--accent2)"/>
    <circle id="xp-end" r="7" fill="var(--ok)"/>
    <text id="xp-avgl" x="604" text-anchor="end" font-size="10" font-family="var(--mono)" fill="var(--dimmer)"></text>
    <text id="xp-reml" x="604" text-anchor="end" font-size="10" font-family="var(--mono)" fill="var(--accent2)"></text>
  </svg>
  <div class="beats" id="xp-beats"></div>
</div>
<div class="verdict" id="xp-out"></div>

${rule('Two moments carry the memory of the whole thing. <b>Spend on the peak and on the last ninety seconds</b>, and let the middle be the thing that makes them legible.')}

${S('The technical decisions that are actually experience decisions', 'Where the rest of this site lands', [
  'Almost every number elsewhere on this site is an experience choice wearing engineering clothes. These are the ones that come up most.',
  '<b>Latency</b> is authorship. Above a very short threshold a visitor stops feeling they caused the thing that happened, whatever the causal chain actually is. This is why interactive work is a <a href="/learn/code/">determinism</a> problem before it is a content problem.',
  '<b>Where a sound comes from</b> is presence. Localisation is fast and involuntary, and a voice arriving from a PA rather than a body is one of the strongest breaking cues there is — the whole reason <a href="/learn/systems/">object audio and tracking</a> exist.',
  '<b>Darkness</b> is a resource with a recovery time. <a href="/learn/perception/">Dark adaptation</a> takes twenty to thirty minutes and any bright cue spends it. The blackout in act two is not the same blackout as the one in act one.',
  '<b>Sightlines and seams</b> are attention. Anything with contrast takes the spotlight, so a visible edge, a spill, or a technician crossing upstage is competing directly with whatever you were pointing at.',
  '<b>Comfort</b> is not hospitality, it is capacity. Cold, cramped, needing the toilet, unable to see — every one consumes attention that the piece needed.',
  '<b>Level</b> is arousal <em>and</em> exposure. Both at once, always. Check it against the <a href="/tools/#dose">dose tool</a>.',
])}

${S('Designing for it going wrong', 'Graceful degradation is an experience discipline', [
  'Something will fail. The question that separates a good production from a lucky one is whether the failure modes were designed or discovered.',
  'The useful move is to decide, in advance and for each system, what the rungs are: what fails invisibly, what fails visibly but survivably, and what stops the show. Write it down, tell the crew, and rehearse the middle rung — because that is the one people actually meet and the one nobody practises.',
  'Two principles are worth stating plainly. <b>A failure that is acknowledged is far less damaging than one that is pretended away</b> — an audience forgives a hold and remembers ten minutes of visible flailing. And <b>anything that can hurt somebody fails to safe regardless of the experience cost</b>: that is the <a href="/learn/aerial/">arming chain</a>, the <a href="/learn/devices/">safety channel</a>, and it is never a trade-off.',
])}

${fig(degFig, 'Four rungs. Each is a decision made in advance, or one that panic makes on the night.')}

${S('Everyone, not most people', 'Accessibility as architecture', [
  'Treated as compliance, accessibility is a set of things bolted on in week eleven that satisfy a checklist and delight nobody. Treated as architecture, it is the same design problem as everything else on this page: <b>deliver the experience through a channel the person actually has</b> — which is precisely the <a href="/learn/neuro/">sensory substitution</a> argument.',
  'Captions and surtitles are not a transcript; they are the text design of the piece, and where they sit decides whether somebody watches the show or watches the words. Audio description is dramaturgy — somebody is deciding what matters in each moment. Haptic vests and tactile transducers deliver a mix through the body rather than the ear, and are increasingly used by hearing audiences too because they are simply good. Relaxed performances change the arousal design, not the content. And the sightline from the wheelchair space is a design decision that gets made by whoever puts the desk in, deliberately or not.',
  'Done early it is cheap and it improves the piece for everyone. Done late it is expensive and it feels like an apology.',
])}

${S('Knowing whether it worked', 'What can and cannot be measured', [
  'You can measure some real things: where people went and how long they stayed, what they touched, whether a room fell silent, physiological synchrony across an audience, structured self-report at scale. All of that tells you about a distribution, not about a person, and it is noisier than anyone selling it admits.',
  'What you cannot do is ask people whether they were present, because asking makes them notice the room. Behaviour is far better evidence than a questionnaire — flinching, leaning in, going quiet, staying afterwards, what they describe first to whoever meets them outside.',
  'And the honest measure that survives everything: <b>what do people say about it a week later, and which moment do they say first</b>. That is the peak-end rule reporting back, and it is worth more than most instrumentation.',
])}

${bites([
  '<b>The most common mistake is a peak with no approach.</b> Ambition spent on one moment, and nothing built to make it land.',
  '<b>The second most common is an under-designed ending.</b> Half the memory, and the part everyone is too tired to work on.',
  '<b>Novelty is not a strategy.</b> It works on press night and is inert by the third week, for the crew if not the audience.',
  '<b>Comfort is capacity.</b> Every discomfort is attention removed from the thing you built.',
  '<b>You are not the audience.</b> You have seen it a hundred times, you know where to look, and you cannot un-know it. Watch somebody else watch it.',
])}

${S('The whole thing, as a practice', 'Where each stage of this site does its work', [
  'This is the argument the section is arranged to make. Read from the bottom of the chain rather than the top and the stages stop being topics and start being a method.',
])}

<div class="practice">
  ${stageLinks.map(({ g, t }) => `
  <div>
    <h4>${esc(g.name)}</h4>
    <p>${esc(g.lede)}</p>
    <div class="lk">${t.map((x) => `<a href="/learn/${esc(x.slug)}/">${esc(x.title)}</a>`).join('')}</div>
  </div>`).join('')}
</div>

${rule('Every one of those pages answers a question that ends in the same place: <b>what happens to the person</b>. That is the only test any of it has to pass.')}

<div class="cta"><strong>This is a practitioner\'s framework, not a discipline with settled terms.</strong>
<p>It draws on perception and emotion research, presence research, and a lot of accumulated production practice, and it takes positions. If your working method differs in a way that has survived real audiences, <a href="${GH}/issues/new?labels=tooling&amp;title=experience%3A+">open an issue</a> — that is exactly the kind of knowledge that normally stays in people\'s heads.</p></div>

<script>
(function(){
  var wrap=document.getElementById('xp-beats'); if(!wrap) return;
  var DEF=[22,30,42,38,54,88,46,34], N=DEF.length;
  var LABEL=['open','build','settle','turn','lift','peak','release','end'];
  wrap.innerHTML=DEF.map(function(v,i){
    return '<label>'+LABEL[i]+'<input type="range" min="5" max="100" value="'+v+'" data-i="'+i+'" '+
      'aria-label="intensity at '+LABEL[i]+'"></label>';
  }).join('');
  var curve=document.getElementById('xp-curve'), fill=document.getElementById('xp-fill'),
      avg=document.getElementById('xp-avg'), rem=document.getElementById('xp-rem'),
      pk=document.getElementById('xp-peak'), en=document.getElementById('xp-end'),
      avgl=document.getElementById('xp-avgl'), reml=document.getElementById('xp-reml'),
      out=document.getElementById('xp-out');
  var X0=24,X1=600,Y0=160,Y1=26;
  function yv(v){ return Y0-(v/100)*(Y0-Y1); }
  function xi(i){ return X0+(i/(N-1))*(X1-X0); }
  function draw(){
    var v=[].slice.call(wrap.querySelectorAll('input')).map(function(x){return Number(x.value);});
    var d='',f='M'+X0+' '+Y0+' ';
    for(var i=0;i<N;i++){ d+=(i?'L':'M')+xi(i).toFixed(1)+' '+yv(v[i]).toFixed(1)+' '; f+='L'+xi(i).toFixed(1)+' '+yv(v[i]).toFixed(1)+' '; }
    f+='L'+X1+' '+Y0+' Z';
    curve.setAttribute('d',d); fill.setAttribute('d',f);
    var mean=v.reduce(function(a,b){return a+b;},0)/N;
    var peak=Math.max.apply(null,v), pi=v.indexOf(peak), end=v[N-1];
    var remembered=(peak+end)/2;
    avg.setAttribute('y1',yv(mean)); avg.setAttribute('y2',yv(mean));
    rem.setAttribute('y1',yv(remembered)); rem.setAttribute('y2',yv(remembered));
    pk.setAttribute('cx',xi(pi)); pk.setAttribute('cy',yv(peak));
    en.setAttribute('cx',xi(N-1)); en.setAttribute('cy',yv(end));
    avgl.setAttribute('y',yv(mean)-6); avgl.textContent='actual average '+mean.toFixed(0);
    reml.setAttribute('y',yv(remembered)-6); reml.textContent='remembered '+remembered.toFixed(0);
    var gap=remembered-mean;
    var msg = end < peak*0.45
      ? '<span class="err">The ending is a long way below the peak.</span> Half the memory is being spent on the weakest thing in the room.'
      : gap>18 ? '<span class="ok">The shape is doing the work.</span> A restrained middle makes the peak readable, and the memory is well above the actual average.'
      : gap<3 ? 'Flat. Nothing here is a peak because nothing is a contrast \\u2014 the remembered value has collapsed onto the average.'
      : 'Working, and there is more available: lower the middle, or lift the last beat.';
    out.innerHTML='Actual average <b>'+mean.toFixed(0)+'</b>, remembered <b>'+remembered.toFixed(0)+'</b> \\u2014 peak '+peak+' at &ldquo;'+LABEL[pi]+'&rdquo;, ending '+end+'. '+msg;
  }
  wrap.addEventListener('input',draw); draw();
})();
</script>
`

  return shell({
    title: 'Experience architecture — designing what happens to a person | showstack',
    description: 'You cannot design a feeling, only the conditions and the timing. Attention, arousal and expectation as materials; the stages every audience walks through from the queue to the pavement; the peak and the ending as what actually survives; graceful degradation, accessibility as architecture, and what can honestly be measured.',
    canonical: `${SITE}/learn/experience/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Experience architecture for live production',
      description: 'Attention, arousal and expectation as design materials; the arc from arrival to exit; peak-end structuring of a running order; failure design; accessibility as architecture; and honest measurement.',
      url: `${SITE}/learn/experience/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
