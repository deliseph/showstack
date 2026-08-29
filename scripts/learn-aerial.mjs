/**
 * /learn/aerial/ — drone shows and pyro, which are the same idea twice.
 *
 * Both look, from the audience, like something is being driven live. Neither
 * is. A drone show is several hundred aircraft each executing a trajectory it
 * already holds, against a clock they all read from orbit. A pyromusical is a
 * list of cue addresses against times, executed by a controller chasing
 * timecode. In both cases the coordination mechanism is a shared clock, and
 * the safety mechanism is deliberately *not* on the show network.
 *
 * This page is a systems-level explanation of how professional shows are
 * coordinated and made safe. It is not a build guide: there is nothing here
 * about devices, circuits or materials, and there should not be.
 *
 * The animations carry the two arguments that a static diagram cannot make:
 * that a steered fleet degrades and a clocked fleet does not, and that a
 * firework is fired earlier than it is seen.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav } from './learn-kit.mjs'

export function learnAerialPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* steered fleet: commands arrive late and unevenly, aircraft jitter */
@keyframes cmd-fly{0%{transform:translateX(0)}100%{transform:translateX(210px)}}
@keyframes jitter{0%,100%{transform:translate(0,0)}20%{transform:translate(0,-5px)}
40%{transform:translate(0,3px)}60%{transform:translate(0,-2px)}80%{transform:translate(0,4px)}}
.steerfig .cmd{animation:cmd-fly 1.9s linear infinite}
.steerfig .cmd.c2{animation-delay:.75s;animation-duration:2.6s}
.steerfig .cmd.c3{animation-delay:1.3s;animation-duration:1.5s}
.steerfig .craft{animation:jitter 1.1s ease-in-out infinite}
.steerfig .craft.k2{animation-delay:.3s}
.steerfig .craft.k3{animation-delay:.6s}
/* clocked fleet: one tick from above, everything holds its slot */
@keyframes tick-down{0%{transform:translateY(0);opacity:0}10%{opacity:1}70%{transform:translateY(48px);opacity:1}
80%,100%{opacity:0}}
@keyframes hold{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
.clockfig .tick{animation:tick-down 2.4s ease-in infinite}
.clockfig .tick.t2{animation-delay:.8s}
.clockfig .tick.t3{animation-delay:1.6s}
.clockfig .craft{animation:hold 3s ease-in-out infinite}
/* RTK: an uncertainty blob collapsing once corrections arrive */
@keyframes blob{0%,22%{r:46;opacity:.30}55%,100%{r:5;opacity:.85}}
@keyframes corr{0%,18%{opacity:0;transform:translateX(0)}
26%{opacity:1}52%{opacity:1;transform:translateX(150px)}60%,100%{opacity:0}}
.rtkfig .unc{animation:blob 4.4s ease-in-out infinite}
.rtkfig .corr{animation:corr 4.4s linear infinite}
.rtkfig .sat{animation:l-fade 3s ease-in-out infinite}
.rtkfig .sat.s2{animation-delay:.5s}
.rtkfig .sat.s3{animation-delay:1s}
.rtkfig .sat.s4{animation-delay:1.5s}
/* formation morph against a scrubbing time bar */
@keyframes morph-a{0%,100%{transform:translate(0,0)}50%{transform:translate(52px,-30px)}}
@keyframes morph-b{0%,100%{transform:translate(0,0)}50%{transform:translate(-38px,-46px)}}
@keyframes morph-c{0%,100%{transform:translate(0,0)}50%{transform:translate(26px,-58px)}}
@keyframes morph-d{0%,100%{transform:translate(0,0)}50%{transform:translate(-60px,-18px)}}
@keyframes scrub{from{transform:translateX(0)}to{transform:translateX(360px)}}
.morphfig .m1{animation:morph-a 6s ease-in-out infinite}
.morphfig .m2{animation:morph-b 6s ease-in-out infinite}
.morphfig .m3{animation:morph-c 6s ease-in-out infinite}
.morphfig .m4{animation:morph-d 6s ease-in-out infinite}
.morphfig .head{animation:scrub 6s linear infinite}
/* separation check: two paths converge, the ring goes red */
@keyframes conv{0%,100%{transform:translateX(0)}50%{transform:translateX(76px)}}
@keyframes warn{0%,32%{stroke:var(--ok);opacity:.5}48%,58%{stroke:var(--warn);opacity:1}72%,100%{stroke:var(--ok);opacity:.5}}
.sepfig .b{animation:conv 5s ease-in-out infinite}
.sepfig .ring{animation:warn 5s ease-in-out infinite}
/* prefire: fired early, seen on the beat */
@keyframes rise{0%{transform:translate(0,0);opacity:0}8%{opacity:1}52%{transform:translate(0,-92px);opacity:1}
58%{opacity:0}100%{opacity:0}}
@keyframes burst{0%,52%{opacity:0;transform:scale(.2)}60%{opacity:1;transform:scale(1)}
78%{opacity:.35;transform:scale(1.5)}86%,100%{opacity:0;transform:scale(1.6)}}
@keyframes beat{0%,52%{opacity:.25}58%,68%{opacity:1}80%,100%{opacity:.25}}
.prefig .shell{animation:rise 3.6s linear infinite}
.prefig .flash{animation:burst 3.6s ease-out infinite;transform-origin:center}
.prefig .beatline{animation:beat 3.6s steps(1,end) infinite}
/* the arming chain sits outside the network box */
.armfig .net{stroke-dasharray:5 5}
@keyframes deny{0%,60%{opacity:0}70%,88%{opacity:1}100%{opacity:0}}
.armfig .no{animation:deny 4s ease-in-out infinite}
/* failsafe ladder */
.ladder{margin:18px 0 0;padding:0;list-style:none;counter-reset:rung}
.ladder li{counter-increment:rung;position:relative;padding:13px 0 13px 46px;border-bottom:1px solid var(--line);
color:var(--dim);font-size:14.8px;line-height:1.6}
.ladder li:last-child{border-bottom:none}
.ladder li::before{content:counter(rung);position:absolute;left:0;top:12px;width:28px;height:28px;
border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;font-family:var(--mono);
font-size:12px;color:var(--accent2);background:var(--panel)}
.ladder b{color:var(--ink);font-weight:600;display:block;margin-bottom:2px}
/* two-column compare */
.vs{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--line);border-radius:var(--r-md);
overflow:hidden;margin:18px 0}
.vs > div{padding:17px}
.vs > div:first-child{border-right:1px solid var(--line);background:color-mix(in srgb,var(--warn) 5%,transparent)}
.vs > div:last-child{background:color-mix(in srgb,var(--ok) 5%,transparent)}
.vs h4{margin:0 0 9px;font-family:var(--mono);font-size:11.5px;letter-spacing:.6px;text-transform:uppercase}
.vs > div:first-child h4{color:var(--warn)}
.vs > div:last-child h4{color:var(--ok)}
.vs p{margin:0 0 9px;font-size:14px;color:var(--dim);line-height:1.6}
.vs p:last-child{margin-bottom:0}
@media(max-width:640px){.vs{grid-template-columns:1fr}
.vs > div:first-child{border-right:none;border-bottom:1px solid var(--line)}}
`

  // The positioning translate has to live on an outer <g>. A CSS transform in
  // a keyframe REPLACES the transform presentation attribute rather than
  // composing with it, so animating the same element that carries
  // transform="translate(x y)" teleports every aircraft to the origin.
  const craft = (x, y, cls, colour = 'var(--accent)') => `
  <g transform="translate(${x} ${y})"><g class="craft ${cls}">
    <line x1="-11" y1="-6" x2="11" y2="-6" stroke="${colour}" stroke-width="1.4" opacity=".55"/>
    <circle cx="-11" cy="-6" r="2.4" fill="${colour}" opacity=".7"/>
    <circle cx="11" cy="-6" r="2.4" fill="${colour}" opacity=".7"/>
    <circle cx="0" cy="0" r="5.5" fill="${colour}"/>
  </g></g>`

  const steerFig = `
<svg viewBox="0 0 400 168" role="img" class="steerfig">
  <rect x="8" y="60" width="62" height="40" rx="6" fill="var(--panel)" stroke="var(--warn)" stroke-width="1.4"/>
  <text x="39" y="84" class="lbl" font-size="9" text-anchor="middle" fill="var(--warn)">PILOT</text>
  <line x1="74" y1="80" x2="290" y2="80" stroke="var(--line)" stroke-dasharray="3 5"/>
  <g class="cmd"><rect x="76" y="72" width="24" height="11" rx="2" fill="var(--warn)"/></g>
  <g class="cmd c2"><rect x="76" y="86" width="24" height="11" rx="2" fill="var(--warn)"/></g>
  <g class="cmd c3"><rect x="76" y="58" width="24" height="11" rx="2" fill="var(--warn)"/></g>
  ${craft(320, 48, 'k1', 'var(--warn)')}
  ${craft(348, 82, 'k2', 'var(--warn)')}
  ${craft(318, 116, 'k3', 'var(--warn)')}
  <text x="200" y="150" class="lbl" text-anchor="middle" font-size="9.5">one link, every command, every aircraft</text>
</svg>`

  const clockFig = `
<svg viewBox="0 0 400 168" role="img" class="clockfig">
  <text x="200" y="18" class="lbl" font-size="9.5" text-anchor="middle" fill="var(--accent)">GNSS TIME — the same microsecond, everywhere</text>
  ${[110, 200, 290].map((x, i) => `<g class="tick${i ? ` t${i + 1}` : ''}"><rect x="${x}" y="26" width="3" height="14" rx="1.5" fill="var(--accent)"/></g>`).join('')}
  ${craft(110, 100, 'k1')}
  ${craft(200, 100, 'k2')}
  ${craft(290, 100, 'k3')}
  ${[110, 200, 290].map((x) => `<text x="${x}" y="126" class="lbl" font-size="8" text-anchor="middle">own path</text>`).join('')}
  <text x="200" y="150" class="lbl" text-anchor="middle" font-size="9.5">no steering at all — each aircraft already knows</text>
</svg>`

  const rtkFig = `
<svg viewBox="0 0 460 200" role="img" class="rtkfig">
  ${[70, 160, 260, 360].map((x, i) => `
  <g class="sat${i ? ` s${i + 1}` : ''}">
    <circle cx="${x}" cy="20" r="5" fill="var(--accent2)"/>
    <line x1="${x}" y1="26" x2="${x - 20 + i * 12}" y2="96" stroke="var(--accent2)" stroke-width=".8" opacity=".45"/>
  </g>`).join('')}
  <rect x="26" y="108" width="96" height="40" rx="6" fill="var(--panel)" stroke="var(--accent)" stroke-width="1.4"/>
  <text x="74" y="126" class="lbl" font-size="9" text-anchor="middle" fill="var(--accent)">BASE STATION</text>
  <text x="74" y="140" class="lbl" font-size="8.5" text-anchor="middle">on a surveyed point</text>
  <g class="corr"><rect x="126" y="120" width="34" height="13" rx="3" fill="var(--accent)"/>
    <text x="143" y="130" font-size="8" fill="var(--bg)" text-anchor="middle" font-family="var(--mono)">corr</text></g>
  <circle class="unc" cx="352" cy="128" r="46" fill="var(--accent)" opacity=".28"/>
  <circle cx="352" cy="128" r="3.5" fill="var(--ink)"/>
  <text x="230" y="184" class="lbl" font-size="9.5" text-anchor="middle">metres → centimetres: both receivers see the same errors</text>
</svg>`

  const morphFig = `
<svg viewBox="0 0 400 190" role="img" class="morphfig">
  ${craft(90, 130, 'm1')}
  ${craft(160, 130, 'm2')}
  ${craft(230, 130, 'm3')}
  ${craft(300, 130, 'm4')}
  <rect x="20" y="162" width="360" height="4" rx="2" fill="var(--line)"/>
  <g class="head"><circle cx="20" cy="164" r="6" fill="var(--accent2)"/></g>
  <text x="200" y="184" class="lbl" text-anchor="middle" font-size="9.5">the formation is a function of time, not of a command</text>
</svg>`

  const sepFig = `
<svg viewBox="0 0 400 150" role="img" class="sepfig">
  <path d="M40 40 L360 40" stroke="var(--dom-control)" stroke-width="1.2" stroke-dasharray="4 5"/>
  <path d="M40 100 L360 100" stroke="var(--dom-visual)" stroke-width="1.2" stroke-dasharray="4 5"/>
  <g class="b"><circle cx="120" cy="40" r="5" fill="var(--dom-control)"/></g>
  <g class="b" style="animation-direction:reverse"><circle cx="196" cy="100" r="5" fill="var(--dom-visual)"/></g>
  <circle class="ring" cx="196" cy="70" r="30" fill="none" stroke="var(--ok)" stroke-width="1.6"/>
  <text x="200" y="138" class="lbl" text-anchor="middle" font-size="9.5">every pair, every timestep, before anything leaves the ground</text>
</svg>`

  const preFig = `
<svg viewBox="0 0 400 190" role="img" class="prefig">
  <rect x="20" y="150" width="360" height="6" rx="3" fill="var(--line)"/>
  <text x="70" y="176" class="lbl" font-size="9" text-anchor="middle">fire</text>
  <line x1="70" y1="140" x2="70" y2="160" stroke="var(--accent2)" stroke-width="1.6"/>
  <g class="beatline">
    <line x1="230" y1="20" x2="230" y2="160" stroke="var(--accent)" stroke-width="1.4" stroke-dasharray="3 4"/>
    <text x="230" y="176" class="lbl" font-size="9" text-anchor="middle" fill="var(--accent)">the beat</text>
  </g>
  <g class="shell"><circle cx="70" cy="146" r="4" fill="var(--accent2)"/></g>
  <g class="flash" style="transform-box:fill-box">
    <circle cx="230" cy="54" r="16" fill="none" stroke="var(--accent2)" stroke-width="2"/>
    <circle cx="230" cy="54" r="7" fill="var(--accent2)"/>
  </g>
  <text x="200" y="16" class="lbl" text-anchor="middle" font-size="9.5">programmed to the burst — the software subtracts the lift</text>
</svg>`

  const armFig = `
<svg viewBox="0 0 460 190" role="img" class="armfig">
  <rect class="net" x="14" y="24" width="250" height="140" rx="10" fill="none" stroke="var(--dom-network)" stroke-width="1.4"/>
  <text x="139" y="44" class="lbl" font-size="9.5" text-anchor="middle" fill="var(--dom-network)">SHOW NETWORK — anything here can be wrong</text>
  <rect x="36" y="60" width="88" height="34" rx="6" fill="var(--panel)" stroke="var(--line)"/>
  <text x="80" y="81" class="lbl" font-size="9" text-anchor="middle">timecode</text>
  <rect x="152" y="60" width="88" height="34" rx="6" fill="var(--panel)" stroke="var(--line)"/>
  <text x="196" y="81" class="lbl" font-size="9" text-anchor="middle">show control</text>
  <rect x="94" y="112" width="88" height="34" rx="6" fill="var(--panel)" stroke="var(--line)"/>
  <text x="138" y="133" class="lbl" font-size="9" text-anchor="middle">firing controller</text>
  <path d="M264 129 L318 129" stroke="var(--dimmer)" stroke-width="1.4"/>
  <rect x="322" y="100" width="124" height="58" rx="8" fill="var(--panel2)" stroke="var(--ok)" stroke-width="1.8"/>
  <text x="384" y="122" class="val" font-size="11" text-anchor="middle" fill="var(--ok)">ARMING</text>
  <text x="384" y="138" class="lbl" font-size="8.5" text-anchor="middle">key, held by a person</text>
  <text x="384" y="150" class="lbl" font-size="8.5" text-anchor="middle">no network path in</text>
  <g class="no">
    <path d="M276 60 L326 92" stroke="var(--warn)" stroke-width="2"/>
    <path d="M326 60 L276 92" stroke="var(--warn)" stroke-width="2"/>
    <text x="301" y="46" class="lbl" font-size="8.5" text-anchor="middle" fill="var(--warn)">software cannot arm</text>
  </g>
  <text x="230" y="182" class="lbl" text-anchor="middle" font-size="9.5">the network may request a fire — it may never grant permission to fire</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / aerial</div>
${learnNav(esc, 'aerial')}
<div class="lhero">
  <h2>Drone shows and pyro</h2>
  <p class="lede">Both look like something is being driven live in front of you. Neither is. A drone show and a pyromusical are the same idea twice over: a sequence computed in advance, executed against a clock everybody reads — with the thing that can actually hurt someone kept deliberately off the network.</p>
</div>

${S('The thing to unlearn', 'Nobody is flying a drone show', [
  'The intuition is that a drone show is a very large remote-control problem — that somewhere there is a computer sending steering commands to five hundred aircraft many times a second. It is not, and it could not be.',
  'That design puts every aircraft\'s safety on one radio link. The link has finite bandwidth, variable latency, and it will occasionally drop. Multiply by hundreds of aircraft and the failure is not a wobble, it is a fleet with no instructions.',
  'What actually happens is the opposite. <b>Before launch, every aircraft is loaded with its own complete flight path</b> — a list of positions, and usually colours, against time. Once airborne, each one flies its own file. The ground station arms, launches, monitors telemetry and can abort — but it does not steer. There is no per-aircraft steering to lose.',
])}

<div class="figrow">
  ${fig(steerFig, 'Steered: one link carries every command to every aircraft — late, uneven, and unrecoverable if it drops.')}
  ${fig(clockFig, 'Clocked: the link carries almost nothing, because each aircraft already knows where it must be at t.')}
</div>

${rule('A drone show is not coordinated by communication. It is coordinated by <b>a clock and a plan every aircraft already holds</b> — which is why it survives a radio link that a steered fleet would not.')}

${S('The first hard part', 'Knowing where you are, to centimetres — RTK', [
  'Ordinary GNSS is good to a few metres. That is fine for a car. It is nowhere near good enough for aircraft flying a couple of metres apart in a pattern the audience is reading as a picture.',
  '<b>RTK — real-time kinematic — closes the gap using a trick.</b> Put a receiver on a point whose position has been surveyed and is therefore already known exactly. It computes its position from the satellites like any receiver, and gets an answer that is slightly wrong. Because it knows the truth, it knows the error — and the sources of that error (the state of the ionosphere, small discrepancies in satellite clocks and orbits) are very nearly identical for every receiver within a few kilometres.',
  'So the base station broadcasts the correction, every aircraft applies it, and the shared error cancels. What is left is <em>relative</em> position accurate to centimetres. RTK also measures the phase of the carrier wave itself rather than only the coded signal, which is where the last of the precision comes from — and why the receiver reports a <em>float</em> solution while it is still resolving that phase ambiguity, and a <em>fix</em> once it has.',
  'The correction link is a radio or, in a fixed venue, corrections pulled over the internet from a national network. Either way it matters more than it looks: aircraft that lose corrections fall back to metre-level accuracy, which for a formation is a fault, not a degradation.',
])}

${fig(rtkFig, 'Two receivers, the same errors. Subtract the known error and centimetres are left.')}

${S('The second hard part', 'Everyone agreeing what time it is', [
  'GNSS gives every receiver on earth the same time, to well under a microsecond. On a drone fleet that is not a side benefit — it <em>is</em> the coordination mechanism.',
  'Each aircraft is executing an instruction of the form <em>at t = 92.400, be at this point, and be this colour</em>. Every aircraft is doing that independently, from its own file, using its own copy of the same time. There is no inter-drone communication and none is needed. A formation appears because several hundred independent aircraft each arrive at their own assigned point at the same instant.',
  'This is the same principle as the timecode spine on the <a href="/learn/systems/">systems</a> page, and the same principle behind <a href="/protocols/ptp-1588/">PTP</a> on an audio network. Distribute the time, not the instructions.',
])}

${fig(morphFig, 'Scrub the time and the picture changes. Nothing was told to move.')}

${S('The third hard part', 'Making sure the plan cannot collide with itself', [
  'Most show drones cannot see each other. There is no radar, no sense-and-avoid between aircraft, and adding it to hundreds of small airframes would be its own hazard. Safety comes from somewhere else entirely: <b>the choreography is proven collision-free before anything is armed.</b>',
  'The design software checks the full flight, timestep by timestep, for every pair of aircraft — minimum separation, maximum speed and acceleration, climb and descent rates, battery energy against flight duration, and the geofence the whole show must stay inside. A design that violates any of those does not fly; it goes back to the designer.',
  'That is why a drone show cannot be improvised, retimed on the night, or "just held for a minute". The plan is the safety case.',
])}

${fig(sepFig, 'Minimum separation is checked across every pair at every timestep, offline, before launch.')}

${S('When it does not go to plan', 'The failsafe ladder', [
  'Each aircraft carries rules for what to do when reality departs from the plan, and they escalate. The exact behaviour is a per-system, per-operator configuration — but the shape is consistent.',
])}

<ol class="ladder">
  <li><b>The correction link drops</b>Positioning degrades from centimetres to metres. The usual response is to hold position and stop trusting fine formation work.</li>
  <li><b>The GNSS fix is lost entirely</b>The aircraft no longer knows where it is. It descends and lands where it stands rather than continuing to fly a path it can no longer verify.</li>
  <li><b>Telemetry to the ground station drops</b>The flight itself continues — it never depended on that link — but the operator has lost visibility, which is its own reason to end the show.</li>
  <li><b>Battery reaches the reserve</b>Land, on the shortest safe path, regardless of where the sequence has got to.</li>
  <li><b>The geofence is breached</b>The hard boundary. Crossing it means immediate landing, because the geofence is what the safety case and the permission were written around.</li>
  <li><b>The operator aborts</b>One action brings the whole fleet down in a controlled way. This is the button the show exists to make unnecessary and must always be available.</li>
</ol>

${bites([
  '<b>Wind is decided before launch, not during.</b> The limit is an airframe figure, and the decision point is on the ground — an airborne fleet has no good options.',
  '<b>A show that free-runs cannot be paused.</b> Stopping the music does not stop the aircraft. Either the show completes or it is aborted; there is no hold.',
  '<b>Permission is not a formality.</b> Every jurisdiction requires authorisation for a display of this kind. In Hong Kong small unmanned aircraft sit under the Civil Aviation Department\'s Small Unmanned Aircraft Order, in force since June 2022, with operator qualification and specific approval for a display. Rules change — confirm the current requirement with the regulator, not with this page.',
  '<b>The GNSS antenna needs sky.</b> A site hemmed in by tall structures gives multipath — signals arriving by reflection — and multipath is exactly what RTK cannot correct away.',
])}

${S('The other one', 'Pyro: the same idea, a different failure mode', [
  'A pyromusical is built the same way. A script lists cue addresses against times; a controller executes it while following the show\'s timecode. Nobody is pressing buttons on the beat.',
  'The chain is short and each link is addressed. An initiator sits in the device; it is connected to a firing module that holds many separately addressed outputs; the modules sit on a bus back to the controller — a two-wire serial link in most wired systems, or a licensed, acknowledged radio link in wireless ones. The controller holds the script and the clock.',
  'Before the show, the controller checks continuity on every cue: a tiny test current confirms each circuit is complete. That is how an operator knows a cue is connected, and it is why a pre-show check that reports a missing cue is worth more than any rehearsal.',
])}

${S('The detail that surprises people', 'A firework is fired before you see it', [
  'A shell has to get up there. Between the moment it is fired and the moment it bursts there is a lift time, and it is not small — a large shell can take several seconds to reach its height.',
  'So a designer does not program fire times. They program <b>burst</b> times, against the music, and the design software subtracts each item\'s known lift and delay to work out when the controller must actually fire it. Two shells that burst together on the same beat may have been fired seconds apart.',
  'This is also why a pyromusical cannot be nudged live. By the time you can hear that a cue is early, it was fired several seconds ago.',
])}

${fig(preFig, 'Fired here. Seen there. The offset is a property of the item, and the software owns it.')}

${S('The part that is not negotiable', 'Why arming is never on the show network', [
  'Everything above is a control-system problem. This is not.',
  'The show network carries timecode, cue triggers and status. It is full of laptops, and laptops are full of software that can be wrong. The firing controller may sit on that network and take its timing from it. <b>What it may not do is take permission from it.</b>',
  'Arming is physical and separate: a key, an arming supply on its own path, and in most operations a person holding an enable. Removing that permission takes the outputs dead no matter what any computer believes. The same logic governs an aerial display: the abort is an operator action on dedicated equipment, not a cue in a show file.',
])}

${fig(armFig, 'The network may ask. Only the physical chain may permit.')}

${rule('Anything that can start a fire or leave the ground must be stoppable by something that is <b>not a computer</b>. Timing may come from the show network. Permission never does.')}

<div class="vs">
  <div>
    <h4>A trigger chain</h4>
    <p>Each step fires the next. Comfortable to build, and it reads well on a diagram.</p>
    <p>One missed message and everything downstream stops, with no way to work out where the show should have been. Recovery is a human guessing.</p>
  </div>
  <div>
    <h4>A shared clock</h4>
    <p>Every department, and every aircraft, independently reads the same running time.</p>
    <p>A glitch costs one frame. The device rejoins by simply reading the clock again, because the clock never stopped telling it where the show is.</p>
  </div>
</div>

${S('Putting it together', 'What a finale actually looks like underneath', [
  'A stadium finale with music, lighting, video, pyro and a drone fleet has no master controller in the sense people imagine. It has a master <em>clock</em>.',
  'The house reference generates timecode. Playback, lighting, video and the firing controller all follow it, each executing its own list against the same running time. The drone fleet is launched by a single trigger at a known timecode and then free-runs on GNSS time — deliberately, because an airborne fleet must never be able to stall waiting for a network that has gone quiet.',
  'Nothing is steering anything. Every element is reading time and executing a plan it already holds. That is what makes it look effortless, and it is also, precisely, what makes it safe.',
])}

<div class="cases" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin:18px 0"></div>

<div class="cta"><strong>Work in aerial or pyro and something here is wrong?</strong>
<p>This page is written at systems level from public documentation and practice, and the operational detail differs between systems and jurisdictions. If a description does not match how your equipment or your regulator actually works, <a href="${GH}/issues/new?labels=tooling&amp;title=aerial%3A+">open an issue</a> — corrections from people who run these shows are the ones worth having.</p></div>
`

  return shell({
    title: 'Drone shows and pyro — how they are coordinated and synchronised | showstack',
    description: 'How a drone show is actually coordinated: pre-loaded flight paths, RTK GNSS positioning to centimetres, a shared clock from orbit, offline collision checking and the failsafe ladder. Plus how pyro is fired to timecode, why a shell is fired before you see it, and why arming is never on the show network.',
    canonical: `${SITE}/learn/aerial/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Drone shows and pyro: how they are coordinated and synchronised',
      description: 'Pre-computed trajectories, RTK GNSS, shared clocks, separation checking and failsafes in drone light shows; timecode-driven pyro, lift-time compensation and the physical arming chain.',
      url: `${SITE}/learn/aerial/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
