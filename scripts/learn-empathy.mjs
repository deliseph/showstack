/**
 * /learn/empathy/ — how an audience comes to feel with somebody, and the
 * conditions a technical department controls that decide whether they will.
 *
 * The site already has the mechanism of feeling: /learn/emotion/ on
 * constructed emotion and contagion, /learn/perception/ on attention,
 * /learn/presence/ on embodiment and agency. What none of them says is how
 * one person's state gets into another person, or what has to be true of a
 * room before anybody will let it.
 *
 * Three things this page is for, and they run in order of how much a
 * technical team can actually move them.
 *
 * SAFETY FIRST, because it is a precondition rather than a nicety. Winnicott's
 * holding environment, borrowed honestly and labelled as a borrowing: a person
 * only risks feeling something in a space that has demonstrated it will hold
 * them. Temperature, sightlines, a visible exit, an effect they were warned
 * about. Every one of those is somebody's technical decision.
 *
 * THE PASSAGE, because an event is a shape and not a duration. Turner's
 * separation / threshold / return, which maps onto the foyer, the house
 * lights, and the street afterwards, and explains why the load-out end of the
 * experience is designed by nobody.
 *
 * THEN THE MECHANISM: simulation, effort, scale, and synchrony — the last of
 * which is the only one on this page with a number attached.
 *
 * The register matters. Some of this is measurable and some is a lens. The
 * page says which is which, in the same way /learn/emotion/ has a section on
 * where the theory is unsettled, because a site that stakes its credibility
 * on citing everything cannot quietly let a framework borrow that credit.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

export function learnEmpathyPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* The passage: three phases, with the middle one the only one anybody
   designs. Drawn as a track so the neglected ends are visible as ends. */
.passfig .phase{transition:opacity .3s ease}
@keyframes pass-walk{0%{offset-distance:0%}100%{offset-distance:100%}}
.passfig .walker{animation:pass-walk 9s linear infinite;
offset-path:path("M70 150 L250 150 L370 150 L550 150")}
/* Synchrony: independent clappers converging onto a common period. */
@keyframes sync-a{0%,100%{transform:translateY(0)}12%{transform:translateY(-9px)}}
@keyframes sync-b{0%,100%{transform:translateY(0)}31%{transform:translateY(-9px)}}
@keyframes sync-c{0%,100%{transform:translateY(0)}68%{transform:translateY(-9px)}}
@keyframes sync-lock{0%,100%{transform:translateY(0)}12%{transform:translateY(-9px)}}
.syncfig .c1{animation:sync-a 1.6s ease-in-out infinite}
.syncfig .c2{animation:sync-b 1.6s ease-in-out infinite}
.syncfig .c3{animation:sync-c 1.6s ease-in-out infinite}
.syncfig .locked g{animation:sync-lock 1.6s ease-in-out infinite}
.regbox{border:1px solid var(--rule);border-left:3px solid var(--ink-faint);border-radius:0 var(--r-sm) var(--r-sm) 0;
padding:14px 17px;margin:18px 0;background:var(--surface-raised)}
.regbox b{display:block;font-family:var(--mono);font-size:11px;letter-spacing:.6px;text-transform:uppercase;
color:var(--ink-faint);margin-bottom:7px}
.regbox p{margin:0 0 9px;color:var(--ink-muted);font-size:14.5px;line-height:1.6}
.regbox p:last-child{margin-bottom:0}
.etable{width:100%;border-collapse:collapse;font-size:14px;margin:14px 0}
.etable th{text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;
color:var(--ink-faint);padding:0 12px 9px 0;border-bottom:1px solid var(--rule);font-weight:400}
.etable td{padding:11px 12px 11px 0;border-bottom:1px solid var(--rule);vertical-align:top;
color:var(--ink-muted);line-height:1.55}
.etable td:first-child{color:var(--ink);white-space:nowrap}
.etable td strong{color:var(--ink)}
.tblscroll{overflow-x:auto;margin:14px 0}
`

  const passFig = `
<svg viewBox="0 0 620 230" role="img" class="passfig">
  <line x1="60" y1="150" x2="560" y2="150" stroke="var(--rule-strong)" stroke-width="2"/>
  <g class="phase">
    <rect x="60" y="70" width="190" height="60" rx="6" fill="var(--surface-raised)" stroke="var(--rule)" stroke-width="1.5"/>
    <text x="155" y="96" class="val" text-anchor="middle">separation</text>
    <text x="155" y="116" class="lbl" text-anchor="middle">queue, foyer, phones away</text>
  </g>
  <g class="phase">
    <rect x="258" y="58" width="104" height="84" rx="6" fill="color-mix(in srgb,var(--signal) 18%,transparent)" stroke="var(--signal)" stroke-width="2"/>
    <text x="310" y="92" class="val" text-anchor="middle" style="fill:var(--signal)">threshold</text>
    <text x="310" y="112" class="lbl" text-anchor="middle">the only bit</text>
    <text x="310" y="128" class="lbl" text-anchor="middle">anybody designs</text>
  </g>
  <g class="phase">
    <rect x="370" y="70" width="190" height="60" rx="6" fill="var(--surface-raised)" stroke="var(--rule)" stroke-width="1.5"/>
    <text x="465" y="96" class="val" text-anchor="middle">return</text>
    <text x="465" y="116" class="lbl" text-anchor="middle">curtain call, street, last train</text>
  </g>
  <circle class="walker" cx="0" cy="0" r="7" fill="var(--accent2)"/>
  <text x="60" y="196" class="lbl">An audience arrives from an ordinary evening and has to be walked out of it, then walked back.</text>
  <text x="60" y="214" class="lbl">The two ends are where events are usually weakest, and they are almost entirely technical decisions.</text>
</svg>`

  const syncFig = `
<svg viewBox="0 0 620 200" role="img" class="syncfig">
  <text x="40" y="34" class="lbl">arriving separately</text>
  <g class="c1"><rect x="60" y="66" width="26" height="58" rx="4" fill="var(--dimmer)"/></g>
  <g class="c2"><rect x="102" y="66" width="26" height="58" rx="4" fill="var(--dimmer)"/></g>
  <g class="c3"><rect x="144" y="66" width="26" height="58" rx="4" fill="var(--dimmer)"/></g>
  <path d="M212 95 L268 95 M256 87 L268 95 L256 103" fill="none" stroke="var(--rule-strong)" stroke-width="2"/>
  <text x="360" y="34" class="lbl">locked, within a few seconds, with nobody conducting</text>
  <g class="locked">
    <g><rect x="300" y="66" width="26" height="58" rx="4" fill="var(--signal)"/></g>
    <g><rect x="342" y="66" width="26" height="58" rx="4" fill="var(--signal)"/></g>
    <g><rect x="384" y="66" width="26" height="58" rx="4" fill="var(--signal)"/></g>
    <g><rect x="426" y="66" width="26" height="58" rx="4" fill="var(--signal)"/></g>
    <g><rect x="468" y="66" width="26" height="58" rx="4" fill="var(--signal)"/></g>
  </g>
  <text x="40" y="164" class="lbl">Weakly coupled oscillators entrain. A room of people clapping is the same physics as pendulums on a shelf,</text>
  <text x="40" y="182" class="lbl">and the coupling here is sound &mdash; which means the PA decides whether it can happen.</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / empathy</div>
${learnNav(esc, 'empathy')}
<h2>Feeling it with them</h2>
<p class="lede">An audience does not decide to be moved. It either is or it is not, and a surprising amount of what decides that sits in departments who would not describe their job that way at all &mdash; the temperature of the room, whether the exit is visible, how long the foyer queue was, and whether the PA lets a thousand people hear each other.</p>

<div class="regbox">
  <b>About the register of this page</b>
  <p>Most of this site reports things that were measured. This page mixes two kinds of claim and it is worth saying which is which as we go.</p>
  <p><strong>Measured:</strong> entrainment and synchrony, the effect of shared attention, contagion of expression, the peak-end structure of memory. These have numbers behind them.</p>
  <p><strong>A lens:</strong> the holding environment, the ritual passage. These are frameworks from clinical psychology and anthropology &mdash; useful for organising what you already know, not findings you can cite as fact. They earn their place here by being <em>operational</em>: each one names something a technical department decides.</p>
</div>

${S('The precondition', 'Nobody feels anything in a room that has not held them yet',
  ['Before any of the mechanism matters, there is a gate. A person will not risk an emotion in a space that has not demonstrated it can be trusted, and the demonstration is almost entirely non-verbal and almost entirely technical.',
   'The psychoanalyst Donald Winnicott called this a <em>holding environment</em>: conditions reliable enough that somebody can afford to stop managing themselves. Borrowed into a venue it stops being abstract very quickly. Can they see an exit. Is the temperature something they have stopped noticing. Did the effect that just went off get announced at the door. Is the sound level one they can stay in for two hours rather than endure. Can they hear the words. Is the seat one they can sit in without the seat being the thing they are thinking about.',
   'None of that is atmosphere. Each one is a decision with an owner, and each one is a decision that gets made on the basis of something else &mdash; the SPL that suits the mix, the haze level the lighting wants, the seat count the budget needs. The point of naming the gate is that an audience whose attention is on the room cannot put it on the stage, and no amount of craft downstream recovers that.'])}

${rule('An audience that is managing the room is not available to the show. <b>Comfort is not the goal</b> &mdash; absorption is &mdash; but discomfort you did not choose is a tax on everything upstream of it.')}

${bites([
  '<b>Effects with no warning.</b> A startle that was not consented to does not read as drama, it reads as a breach. The sign at the door is not a legal formality; it is what lets somebody stay open when the bang arrives.',
  '<b>Level as an argument between departments.</b> A mix that is thrilling at the desk and punishing in row C has moved the audience from listening to enduring, and endurance is the opposite of the state you want.',
  '<b>Temperature nobody owns.</b> A room two degrees too warm produces restlessness that gets blamed on the second act.',
  '<b>An interval that fails.</b> Not enough toilets, or a bar queue longer than the interval, and the second half opens with an audience whose attention is on their own bladder. That is a capacity calculation, and it is an emotional one.',
])}

${S('The shape', 'An event is a passage, not a duration',
  ['The anthropologist Victor Turner described ritual as three phases: <strong>separation</strong> from ordinary life, a <strong>threshold</strong> state where the usual rules are suspended, and a <strong>return</strong>. What happens in the middle he called <em>communitas</em> &mdash; the temporary sense of being one undifferentiated group rather than a room of individuals.',
   'Whatever you make of the anthropology, the shape describes a show accurately and it exposes something useful. The threshold is the part everybody designs. The two ends are where events are consistently weakest, and both are technical.',
   'Separation is the queue, the foyer, the walk down the aisle, the pre-show state of the room, and the moment the house lights go. That sequence is doing the work of getting a person out of an ordinary evening, and it is usually inherited rather than designed &mdash; a playlist nobody chose, a house state left at whatever the get-out was, a house-lights fade whose length nobody has ever discussed.',
   'The return is worse. A curtain call, a house state, a walk out into a street, a last train. It is the last thing that happens and therefore weighted heavily in what gets remembered, and in most buildings it is the moment the technical department is thinking hardest about the load-out. An audience dumped from communitas into a work-light state with the bar shutters coming down has had the ending designed by nobody.'])}

${fig(passFig, 'The passage. The middle is what gets designed; the ends are what gets remembered.')}

${S('The mechanism', 'How one person’s state gets into another',
  ['Once the gate is open, three things do most of the work, and they are not the same thing.',
   '<strong>Simulation.</strong> Watching an action recruits some of the machinery involved in doing it. The strong versions of the mirror-neuron story got well ahead of the evidence and are worth treating carefully, but the weaker claim is solid: perceiving effort, strain and intention engages motor and affective systems in the observer. Which is why <em>real</em> effort reads and simulated effort often does not. A performer genuinely holding a position, genuinely out of breath, genuinely lifting weight, is legible in a way a mimed version is not, and audiences detect the difference without being able to say what they detected.',
   '<strong>Contagion.</strong> Expression spreads. People unconsciously mimic faces and postures around them and the mimicry feeds back into their own state. In a room this compounds, which is the mechanism behind laughter being louder in a full house and the reason a half-empty auditorium is not just quieter but genuinely less funny.',
   '<strong>Synchrony.</strong> This is the one with real numbers behind it. Weakly coupled oscillators entrain &mdash; the same physics as pendulum clocks on a shared shelf. A room clapping converges on a common period within a few seconds, with nobody conducting, and moving together measurably raises reported closeness and cooperation between people who did it. The coupling in an auditorium is <em>sound</em>, which puts a system design decision directly underneath a social effect: if the crowd cannot hear itself, it cannot lock, and a room that never locks stays a set of individuals who happen to be in the same building.'])}

${fig(syncFig, 'Independent, then entrained. Nobody is conducting; the coupling is that they can hear each other.')}

${rule('If the audience cannot hear itself, it cannot become an audience. <b>Crowd mic returns, delay coverage at the back, and how much the PA masks the room</b> are all decisions about whether communitas is available.')}

<div class="tblscroll">
<table class="etable">
  <thead><tr><th>What an audience does</th><th>What is actually underneath it</th><th>Who decides it</th></tr></thead>
  <tbody>
    <tr><td>Laughs louder in a full house</td><td>Expression contagion compounding across a dense room</td><td>Seating density, and whether the room is acoustically live enough to carry it</td></tr>
    <tr><td>Claps in time within seconds</td><td>Entrainment through an audible common signal</td><td>PA coverage, crowd returns, delay alignment</td></tr>
    <tr><td>Leans in during real strain</td><td>Simulation of effort the observer&rsquo;s own body knows</td><td>Whether the effort is visible &mdash; light, scale, camera</td></tr>
    <tr><td>Remembers the interval as the low point</td><td>Peak-end weighting of a badly designed return-and-reseparate</td><td>Interval length, bar and toilet capacity, house state</td></tr>
    <tr><td>Will not settle in the first ten minutes</td><td>The room has not demonstrated it will hold them</td><td>Temperature, sightlines, level, front-of-house</td></tr>
  </tbody>
</table>
</div>

${S('The target state', 'Absorption, not comfort',
  ['It is worth being precise about what you are aiming at, because the obvious answer is wrong. The goal is not that an audience is comfortable. Mih&aacute;ly Cs&iacute;kszentmih&aacute;lyi&rsquo;s account of flow puts the good state at full absorption &mdash; attention entirely occupied, self-consciousness gone, time distorted &mdash; and absorption is not a relaxed state. It is a demanding one that people report as deeply satisfying afterwards.',
   'What follows for a technical team is a slightly counter-intuitive rule. Comfort matters up to the point where discomfort would <em>capture attention</em>, and not one step further. A seat you notice is a problem. A seat so comfortable you drift is also a problem. The thing being protected is the audience&rsquo;s attention budget, and every unresolved irritation spends some of it.',
   'This is also why the failures on this page compound rather than add. Slightly too warm, slightly too loud, slightly obstructed sightline, slightly late caption: none of them individually ruins anything, and together they leave an audience with nothing left to give the show. People describe the result as the show not landing, which is not what happened.'])}

${S('The honest limits', 'What this does not give you',
  ['None of this predicts whether a particular show will move a particular person. It describes conditions and mechanisms, and there is a large gap between a condition being met and something good happening in it. A room can be perfectly held, perfectly synchronised and completely unmoved.',
   'The lens material especially should be held loosely. Turner was describing initiation rituals in Ndembu society, not a Tuesday preview. Winnicott was describing infants and, later, therapy. Both travel well and neither was built for this, and anybody using them should be able to say what they would look like if they were wrong.',
   'What survives the caution is the operational part, and it is enough to act on: the gate is real and it is made of technical decisions; the passage has two ends and one of them is almost never designed; and synchrony has a system-design dependency that is easy to check and easy to get wrong.'])}

${xnote('This page is the closest the site comes to saying what the rest of it is for. Every port number, every derating factor and every millisecond of latency budget elsewhere is in service of a room full of people being briefly able to feel something together. The engineering is not separate from that and it is not decoration on top of it &mdash; the two ends of the passage, the level in row C, and whether the crowd can hear itself are the same decision looked at from two directions.')}

${S('Where this goes next', 'The rest of the person layer',
  ['<a href="/learn/emotion/">How a feeling is built</a> has the mechanism of emotion itself, including the peak-end structure this page leans on. <a href="/learn/perception/">The person on the other end</a> has attention, which is the resource everything here spends. <a href="/learn/access/">Who the show is not reaching</a> is the same argument as the precondition section, made concrete and legally specified. And <a href="/learn/experience/">experience architecture</a> is where the whole chain gets treated as one design problem.'])}
`

  return shell({
    title: 'Feeling it with them — audience empathy, synchrony and the holding room | showstack',
    description: 'How one person’s state gets into another in an auditorium: simulation, expression contagion and entrainment — plus the two things that decide whether any of it is available, which are whether the room has held the audience and whether they can hear each other.',
    canonical: `${SITE}/learn/empathy/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Feeling it with them',
      url: `${SITE}/learn/empathy/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
