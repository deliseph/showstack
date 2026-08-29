/**
 * /learn/devices/ — robots, animatronics and connected things.
 *
 * The output side of the machine stage. A robot is a control loop with a
 * safety case bolted to the outside of it, an animatronic is a puppet whose
 * strings are servos, and a smart device is a radio with an opinion about
 * whose cloud it belongs to.
 *
 * Three ideas do the work here. Forward kinematics is easy and inverse
 * kinematics is hard, and that asymmetry explains why show automation is
 * programmed the way it is. Closed loop versus open loop is the difference
 * between a machine that knows it failed and one that does not. And local
 * control versus cloud control is the difference between a venue that works
 * when the internet is down and one that does not.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav } from './learn-kit.mjs'

export function learnDevicesPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* the control loop, going round */
@keyframes lp{to{stroke-dashoffset:-72}}
.loopfig .path{stroke-dasharray:8 10;animation:lp 1.6s linear infinite}
.loopfig .node{animation:l-breathe 3.2s ease-in-out infinite}
.loopfig .node.b2{animation-delay:.8s}
.loopfig .node.b3{animation-delay:1.6s}
.loopfig .node.b4{animation-delay:2.4s}
/* an arm reaching: joints move, the tip traces a path */
@keyframes j1{0%,100%{transform:rotate(-24deg)}50%{transform:rotate(26deg)}}
@keyframes j2{0%,100%{transform:rotate(46deg)}50%{transform:rotate(-14deg)}}
.armfig .a1{animation:j1 4s ease-in-out infinite;transform-origin:80px 150px}
.armfig .a2{animation:j2 4s ease-in-out infinite;transform-origin:0px 0px}
@keyframes tip{0%,100%{opacity:.35}50%{opacity:1}}
.armfig .goal{animation:tip 4s ease-in-out infinite}
/* mesh: a message hopping to reach the far node */
@keyframes hop1{0%,100%{opacity:.2}10%,26%{opacity:1}}
.meshfig .h1{animation:hop1 3s ease-in-out infinite}
.meshfig .h2{animation:hop1 3s ease-in-out infinite;animation-delay:.5s}
.meshfig .h3{animation:hop1 3s ease-in-out infinite;animation-delay:1s}
.meshfig .h4{animation:hop1 3s ease-in-out infinite;animation-delay:1.5s}
@keyframes cut{0%,54%{opacity:0}62%,88%{opacity:1}96%,100%{opacity:0}}
.meshfig .broken{animation:cut 3s ease-in-out infinite}
/* actuator cards */
.act{display:grid;grid-template-columns:repeat(auto-fit,minmax(224px,1fr));gap:13px;margin:18px 0}
.act > div{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:15px}
.act dt{font-family:var(--mono);font-size:11.5px;color:var(--accent);margin-bottom:7px}
.act dd{margin:0;color:var(--dim);font-size:13.6px;line-height:1.58}
.act dd b{color:var(--ink)}
/* the stack of a connected device */
.iot{margin:18px 0;border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden}
.iot > div{display:grid;grid-template-columns:minmax(112px,150px) 1fr;border-bottom:1px solid var(--line)}
.iot > div:last-child{border-bottom:none}
.iot .k{padding:14px 16px;font-family:var(--mono);font-size:11.5px;color:var(--accent2);
background:var(--panel);border-right:1px solid var(--line);letter-spacing:.4px}
.iot .v{padding:14px 16px;color:var(--dim);font-size:14px;line-height:1.6}
.iot .v b{color:var(--ink)}
@media(max-width:560px){.iot > div{grid-template-columns:1fr}
.iot .k{border-right:none;border-bottom:1px solid var(--line)}}
`

  const loopFig = `
<svg viewBox="0 0 460 190" role="img" class="loopfig">
  <path class="path" d="M96 46 L364 46 L364 140 L96 140 Z" fill="none" stroke="var(--accent)" stroke-width="2"/>
  <g class="node"><rect x="40" y="30" width="112" height="32" rx="6" fill="var(--panel)" stroke="var(--accent)"/>
    <text x="96" y="50" class="lbl" font-size="9" text-anchor="middle">where it should be</text></g>
  <g class="node b2"><rect x="308" y="30" width="112" height="32" rx="6" fill="var(--panel)" stroke="var(--accent)"/>
    <text x="364" y="50" class="lbl" font-size="9" text-anchor="middle">drive the motor</text></g>
  <g class="node b3"><rect x="308" y="124" width="112" height="32" rx="6" fill="var(--panel)" stroke="var(--accent)"/>
    <text x="364" y="144" class="lbl" font-size="9" text-anchor="middle">it moves</text></g>
  <g class="node b4"><rect x="40" y="124" width="112" height="32" rx="6" fill="var(--panel)" stroke="var(--ok)" stroke-width="1.6"/>
    <text x="96" y="144" class="lbl" font-size="9" text-anchor="middle" fill="var(--ok)">measure where it is</text></g>
  <text x="230" y="98" class="val" font-size="12" text-anchor="middle">the error</text>
  <text x="230" y="180" class="lbl" font-size="9.5" text-anchor="middle">remove the green box and the machine can no longer tell you it failed</text>
</svg>`

  const armFig = `
<svg viewBox="0 0 400 200" role="img" class="armfig">
  <rect x="60" y="150" width="40" height="30" rx="4" fill="var(--panel)" stroke="var(--line)"/>
  <g class="a1">
    <line x1="80" y1="150" x2="80" y2="80" stroke="var(--accent)" stroke-width="7" stroke-linecap="round"/>
    <g class="a2" style="transform-origin:80px 80px">
      <line x1="80" y1="80" x2="150" y2="46" stroke="var(--accent2)" stroke-width="6" stroke-linecap="round"/>
      <circle cx="150" cy="46" r="6" fill="var(--accent2)"/>
    </g>
    <circle cx="80" cy="80" r="5" fill="var(--dimmer)"/>
  </g>
  <g class="goal"><circle cx="272" cy="70" r="10" fill="none" stroke="var(--ok)" stroke-width="2" stroke-dasharray="3 3"/>
    <circle cx="272" cy="70" r="3" fill="var(--ok)"/></g>
  <text x="272" y="98" class="lbl" font-size="9" text-anchor="middle" fill="var(--ok)">the point you want</text>
  <text x="200" y="186" class="lbl" font-size="9.5" text-anchor="middle">angles to a point: one answer. A point to angles: several.</text>
</svg>`

  const meshFig = `
<svg viewBox="0 0 460 180" role="img" class="meshfig">
  ${[[40, 90, 'h1', 'hub'], [150, 50, 'h2', ''], [150, 130, '', ''], [268, 90, 'h3', ''], [390, 60, 'h4', 'far node']]
    .map(([x, y, c, l]) => `
  <circle class="${c}" cx="${x}" cy="${y}" r="11" fill="none" stroke="${c ? 'var(--accent)' : 'var(--dimmer)'}" stroke-width="2"/>
  ${l ? `<text x="${x}" y="${y + 30}" class="lbl" font-size="9" text-anchor="middle">${l}</text>` : ''}`).join('')}
  <line x1="51" y1="86" x2="139" y2="54" stroke="var(--accent)" stroke-width="1.4"/>
  <line x1="161" y1="54" x2="257" y2="86" stroke="var(--accent)" stroke-width="1.4"/>
  <line x1="279" y1="86" x2="379" y2="63" stroke="var(--accent)" stroke-width="1.4"/>
  <line x1="51" y1="96" x2="139" y2="126" stroke="var(--dimmer)" stroke-width="1.2" opacity=".5"/>
  <line x1="161" y1="126" x2="257" y2="96" stroke="var(--dimmer)" stroke-width="1.2" opacity=".5"/>
  <g class="broken"><path d="M186 60 L206 44 M206 60 L186 44" stroke="var(--warn)" stroke-width="2.4"/>
    <text x="196" y="30" class="lbl" font-size="8.5" text-anchor="middle" fill="var(--warn)">this node dies</text>
    <line x1="51" y1="96" x2="139" y2="126" stroke="var(--ok)" stroke-width="2"/>
    <line x1="161" y1="126" x2="257" y2="96" stroke="var(--ok)" stroke-width="2"/></g>
  <text x="230" y="168" class="lbl" font-size="9.5" text-anchor="middle">a mesh routes around a failure, and pays for it in hops</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / devices</div>
${learnNav(esc, 'devices')}
<div class="lhero">
  <h2>Robots, animatronics and connected things</h2>
  <p class="lede">A robot is a control loop with a safety case bolted to the outside. An animatronic is a puppet whose strings are servos. A smart device is a radio with an opinion about whose cloud it belongs to. Underneath all three is one question: does the machine know what actually happened, or only what it asked for?</p>
</div>

${S('The heart of it', 'Closed loop, and what open loop costs you', [
  'Every machine that moves is doing one of two things. In an <b>open loop</b> it sends a command and assumes it worked — energise the solenoid, so the flap is open. In a <b>closed loop</b> it sends the command and then <em>measures the result</em>, compares it with what it asked for, and corrects the difference, continuously.',
  'The measurement is the whole difference, and it is not about precision. It is about knowing. An open-loop machine whose belt has slipped, whose load has jammed, or whose air has run out reports success in exactly the same voice as one that worked. A closed-loop machine sees an error it cannot reduce and can raise a fault.',
  'That is why anything with real energy in it on a show — a winch, a lift, a revolve, an arm — is closed loop with position feedback, and why the encoder question on the <a href="/learn/transducers/">transducers</a> page is a safety question rather than a resolution one.',
])}

${fig(loopFig, 'Command, act, measure, correct. Remove the measurement and the machine can no longer tell you it failed.')}

${S('Where it is', 'Forward kinematics is arithmetic, inverse kinematics is a search', [
  'Give a robot arm its joint angles and asking where the tip ends up is straightforward geometry, worked out link by link. That is <b>forward kinematics</b> and it always has exactly one answer.',
  'Now reverse it. You know where you want the tip to be; what angles get it there? That is <b>inverse kinematics</b>, and it is a different kind of problem entirely. There may be no solution — the point is out of reach. There may be several — elbow up or elbow down. There may be infinitely many, if the arm has more joints than the task needs. And some of the valid answers will drive the arm through a piece of scenery on the way.',
  'That asymmetry is why show automation is usually programmed by <b>teaching positions</b> rather than by specifying coordinates: you drive the machine where you want it, record the joint values, and play them back. It sidesteps inverse kinematics entirely and it makes the recorded path something a human watched happen.',
  'It is also why a machine that can reach a point still needs its whole <em>path</em> checked — the same distinction as a <a href="/learn/aerial/">drone show being proven collision-free offline</a> rather than trusting live avoidance.',
])}

${fig(armFig, 'Angles to a point is one answer. A point to angles is several, and some of them go through the set.')}

${rule('Anything that moves on a show should be commanded, measured and <b>proven along its whole path</b> — not just at its endpoints.')}

${S('The muscles', 'What actually does the moving', [])}

<div class="act">
  <div><dt>Solenoid</dt><dd>A coil pulls an iron core. <b>Two positions, fast, no in-between.</b> Latches, valves, poppers, drop-boxes. Open loop by nature, and it gets hot if held on.</dd></div>
  <div><dt>Servo</dt><dd>A motor with position feedback and a controller built in, closed loop out of the box. <b>Go to this angle and hold it.</b> The workhorse of animatronics.</dd></div>
  <div><dt>Stepper</dt><dd>Moves in fixed increments and holds position without feedback — which is precise until it is overloaded, <b>skips a step and is silently wrong from then on</b> unless you add an encoder.</dd></div>
  <div><dt>BLDC / servo drive</dt><dd>Brushless motor plus a drive and encoder. High torque, high efficiency, fine control. What is inside a modern hoist, winch or turntable.</dd></div>
  <div><dt>Pneumatic</dt><dd>Compressed air. Fast, punchy, cheap, and <b>compressible — so position between the ends is not controllable</b>. Ideal for a hard hit, wrong for a smooth move.</dd></div>
  <div><dt>Hydraulic</dt><dd>Enormous force from a small cylinder, and incompressible so it holds. Heavy, expensive, and it leaks onto your stage eventually.</dd></div>
  <div><dt>Linear actuator</dt><dd>Rotation converted to a push along a shaft. Slow, strong, self-holding. Lifts, tilts, reveals.</dd></div>
  <div><dt>Voice coil</dt><dd>The loudspeaker motor, used as an actuator. Very fast, very fine, very short travel. Haptics and precision positioning.</dd></div>
</div>

${S('Animatronics', 'A puppet whose strings are servos', [
  'A character with fifteen moving parts is fifteen actuators, each taking a position, all updating together many times a second. The engineering is not the individual joints — it is the choreography and the fallback.',
  'Movement is authored on a timeline, in exactly the way <a href="/learn/engines/">animation</a> is authored, and played back against the show clock so that a blink lands on a word. Some rigs are driven live by a performer wearing a controller; most are a mixture, with a recorded base and a live layer.',
  'What makes it a show discipline rather than a robotics one is everything around the movement. <b>End stops</b>, physical as well as in software, so a servo cannot drive a jaw through a skull. <b>Torque limits</b> so a hand that meets an obstruction stops rather than pushing. <b>A defined rest position</b> that the whole rig can be driven to safely on power-up or fault, because an animatronic that fails mid-gesture and stays there is a problem in front of an audience. And <b>duty cycle</b>, because a servo holding a heavy limb against gravity for a two-hour show is being asked to do something quite different from moving it.',
])}

${S('Connected things', 'What actually happens when a device joins a network', [
  'A "smart" device is a small computer with a radio and a service behind it, and the interesting decisions are all in the layers people never see.',
])}

<div class="iot">
  <div><div class="k">radio</div><div class="v"><b>Wi-Fi</b> for bandwidth and power, <b>Bluetooth LE</b> for short range and setup, <b>Zigbee</b> and <b>Thread</b> for low-power mesh, <b>Z-Wave</b> in its own sub-GHz band. See <a href="/learn/connectivity/">which radio, and why</a> — every one is the same three-way trade between range, rate and battery.</div></div>
  <div><div class="k">network</div><div class="v">Thread devices get real <b>IPv6 addresses</b> and route to each other directly; Zigbee and Z-Wave devices talk to a hub that translates. That difference decides whether a hub is a convenience or a single point of failure.</div></div>
  <div><div class="k">application</div><div class="v"><b>Matter</b> is the layer that made this less miserable: a common vocabulary for what a device <em>is</em> — a light, a lock, a sensor — so that any controller can drive it without a vendor integration. It runs over Thread, Wi-Fi and Ethernet.</div></div>
  <div><div class="k">control</div><div class="v"><b>Local or cloud.</b> A device controlled locally keeps working when the line goes down. A device that round-trips through a vendor server is offline when they are, obeys a business decision you do not control, and adds hundreds of milliseconds you cannot remove.</div></div>
  <div><div class="k">lifetime</div><div class="v">A cloud dependency is a <b>discontinuation risk</b>. The device keeps working exactly as long as somebody keeps paying for the service behind it — which is the same lesson as the retinal implant on the <a href="/learn/neuro/">neuro page</a>, at lower stakes.</div></div>
</div>

${fig(meshFig, 'A mesh routes around a dead node, and pays for it in hops. Resilient, and not fast.')}

${bites([
  '<b>Mesh is resilient, not quick.</b> Every hop adds latency and jitter. Excellent for a sensor reporting every minute, wrong for anything a cue waits on.',
  '<b>Local control is a specification, not a preference.</b> Write it into the brief for anything installed, or you will discover the dependency on the day the line drops.',
  '<b>Matter reduces integration work; it does not remove vendor lock-in.</b> The extras that made you choose the product are usually outside the standard.',
  '<b>Consumer devices are not show devices.</b> No locking connectors, no redundancy, cheerful automatic firmware updates the night before a show. Fine in a rehearsal room, not in a rig.',
  '<b>Every radio in the building is in somebody\'s spectrum.</b> A mesh of forty 2.4 GHz devices is a real neighbour to your <a href="/learn/wireless/">wireless</a> systems.',
])}

${S('Where the line is', 'Control is not permission', [
  'This is the same rule as the <a href="/learn/aerial/">pyro arming chain</a> and the <a href="/learn/code/">safety channel on a PLC</a>, and it belongs here too because a robot is the most tempting place to break it.',
  'A show network can tell a machine what to do. It cannot be what makes the machine safe. Emergency stops, limits, guarding, light curtains and interlocks are a separate rated channel that stays valid when the control system is confused, disconnected, or running the wrong version of a file.',
  'The reason is simple enough to state in one line: the control system is where the bugs are, and it is also where the laptop is.',
])}

<div class="cta"><strong>Building show machinery or interactive devices?</strong>
<p>The <a href="/hardware/">hardware index</a> covers motion control and show controllers with what each one speaks, and the <a href="/standards/">standards index</a> has the machinery-safety documents. If you work in this area and a description here does not match practice, <a href="${GH}/issues/new?labels=tooling&amp;title=devices%3A+">open an issue</a>.</p></div>
`

  return shell({
    title: 'Robots, animatronics and connected things | showstack',
    description: 'Closed loop versus open loop and why the measurement is the whole point, why inverse kinematics is a search rather than a calculation, what each kind of actuator is actually for, how animatronics are made safe, and what happens when a smart device joins a network — Thread, Zigbee, Matter, and local versus cloud control.',
    canonical: `${SITE}/learn/devices/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Robots, animatronics and connected devices in live production',
      description: 'Control loops and feedback, forward and inverse kinematics, actuator types, animatronic safety practice, and IoT radios, Matter, Thread and local versus cloud control.',
      url: `${SITE}/learn/devices/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
