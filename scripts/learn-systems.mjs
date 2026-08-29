/**
 * /learn/systems/ — how separate technologies become one system.
 *
 * Every other learn page takes one technology apart. This one puts several
 * back together, because that is the thing nobody writes down: a show is not
 * a lighting system plus an audio system plus a video system, it is those
 * three agreeing about two facts — what time it is, and where things are.
 *
 * The page opens on Google Maps deliberately. Almost everyone has used it,
 * almost nobody has thought about what is inside it, and what is inside it is
 * exactly the pattern a tracked followspot or an LED volume uses: several
 * sensors that are each individually inadequate, fused against a shared clock
 * and a shared coordinate system.
 *
 * Animation carries the argument here. Drift is a timing phenomenon and a
 * static diagram of drift is just two boxes; drift *moving* is immediately
 * obvious, which is the whole point.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

export function learnSystemsPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* Google Maps layer stack — each sensor lights in turn, then all together. */
@keyframes gm-on{0%,100%{opacity:.28}12%,26%{opacity:1}}
.gmfig .gl{animation:gm-on 6s ease-in-out infinite}
.gmfig .gl.g2{animation-delay:1s}
.gmfig .gl.g3{animation-delay:2s}
.gmfig .gl.g4{animation-delay:3s}
.gmfig .gl.g5{animation-delay:4s}
.gmfig .fuse{animation:gm-on 6s ease-in-out infinite;animation-delay:5s}
/* free-running vs locked clocks */
@keyframes drift-a{to{transform:translateX(0)}}
@keyframes drift-b{to{transform:translateX(34px)}}
@keyframes drift-c{to{transform:translateX(-22px)}}
@keyframes tick{0%,46%{opacity:.3}50%,96%{opacity:1}}
.driftfig .d1{animation:drift-a 5s linear infinite alternate}
.driftfig .d2{animation:drift-b 5s linear infinite alternate}
.driftfig .d3{animation:drift-c 5s linear infinite alternate}
.lockfig .p{animation:tick 1.4s steps(1,end) infinite}
/* tracking: a performer walking, light and sound following */
@keyframes walk{0%{transform:translateX(0)}50%{transform:translateX(250px)}100%{transform:translateX(0)}}
@keyframes walk-lag{0%{transform:translateX(0)}50%{transform:translateX(250px)}100%{transform:translateX(0)}}
.trackfig .person{animation:walk 7s ease-in-out infinite}
.trackfig .beam{animation:walk-lag 7s ease-in-out infinite;animation-delay:.12s}
.trackfig .pan{animation:walk-lag 7s ease-in-out infinite;animation-delay:.18s}
/* LED volume: camera moves, frustum re-renders */
@keyframes cam-pan{0%,100%{transform:translateX(0)}50%{transform:translateX(120px)}}
@keyframes frust{0%,100%{transform:translateX(0)}50%{transform:translateX(96px)}}
.volfig .cam{animation:cam-pan 6s ease-in-out infinite}
.volfig .frustum{animation:frust 6s ease-in-out infinite}
.volfig .ray{animation:cam-pan 6s ease-in-out infinite}
/* motion-to-photon budget bar */
@keyframes m2p{from{width:0}to{width:100%}}
.m2p{display:flex;height:34px;border:1px solid var(--line);border-radius:7px;overflow:hidden;margin:14px 0 6px}
.m2p div{display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:10.5px;
color:var(--bg);white-space:nowrap;overflow:hidden}
.m2plegend{font-family:var(--mono);font-size:11px;color:var(--dimmer);display:flex;gap:14px;flex-wrap:wrap}
/* the timecode spine */
@keyframes spine{0%{transform:translateX(0)}100%{transform:translateX(452px)}}
.spinefig .pulse{animation:spine 4s linear infinite}
.spinefig .node{animation:tick 4s steps(1,end) infinite}
.spinefig .node.n2{animation-delay:.8s}
.spinefig .node.n3{animation-delay:1.6s}
.spinefig .node.n4{animation-delay:2.4s}
.spinefig .node.n5{animation-delay:3.2s}
/* case cards */
.cases{display:grid;grid-template-columns:repeat(auto-fit,minmax(255px,1fr));gap:14px;margin:18px 0}
.case{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:16px}
.case h4{margin:0 0 8px;font-family:var(--mono);font-size:11.5px;letter-spacing:.6px;text-transform:uppercase;
color:var(--accent2)}
.case p{margin:0;color:var(--dim);font-size:14px;line-height:1.6}
.chain{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;font-family:var(--mono);font-size:11px}
.chain b{background:var(--panel);border:1px solid var(--line);border-radius:5px;padding:4px 8px;
color:var(--dim);font-weight:400}
.chain i{color:var(--dimmer);font-style:normal;align-self:center}
/* AR/VR/XR definition strip */
.xr{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0;margin:18px 0;
border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden}
.xr div{padding:16px;border-right:1px solid var(--line)}
.xr div:last-child{border-right:none}
.xr dt{font-family:var(--mono);font-size:12px;color:var(--accent);letter-spacing:.5px;margin-bottom:7px}
.xr dd{margin:0;font-size:14px;color:var(--dim);line-height:1.55}
@media(max-width:640px){.xr div{border-right:none;border-bottom:1px solid var(--line)}
.xr div:last-child{border-bottom:none}}
`

  // ---- Google Maps: five inadequate sensors, fused ----------------------
  const gmLayer = (cls, y, name, what, colour) => `
  <g class="gl ${cls}">
    <rect x="18" y="${y}" width="176" height="40" rx="6" fill="var(--panel)" stroke="${colour}" stroke-width="1.4"/>
    <text x="30" y="${y + 17}" class="val" font-size="11.5" fill="${colour}">${name}</text>
    <text x="30" y="${y + 32}" class="lbl" font-size="9.5">${what}</text>
    <path d="M198 ${y + 20} L268 ${y + 20}" stroke="var(--line)" stroke-width="1.2" stroke-dasharray="3 4"/>
  </g>`

  const gmFig = `
<svg viewBox="0 0 600 268" role="img" class="gmfig">
  ${gmLayer('g1', 6, 'GNSS', 'position, and the time — outdoors only', 'var(--accent)')}
  ${gmLayer('g2', 54, 'Cell + Wi-Fi', 'which towers and SSIDs can I hear?', 'var(--dom-network)')}
  ${gmLayer('g3', 102, 'IMU + compass', 'dead reckoning through the tunnel', 'var(--accent2)')}
  ${gmLayer('g4', 150, 'Map data', 'roads, one-ways, speed limits — over an API', 'var(--dom-visual)')}
  ${gmLayer('g5', 198, 'Everyone else', 'anonymised speeds become live traffic', 'var(--ok)')}
  <g class="fuse">
    <rect x="272" y="82" width="140" height="84" rx="9" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.8"/>
    <text x="342" y="112" class="val" font-size="12" text-anchor="middle" fill="var(--accent)">SENSOR FUSION</text>
    <text x="342" y="130" class="lbl" text-anchor="middle" font-size="9.5">one estimate, with a</text>
    <text x="342" y="144" class="lbl" text-anchor="middle" font-size="9.5">confidence attached</text>
    <path d="M416 124 L470 124" stroke="var(--accent)" stroke-width="1.6"/>
    <rect x="474" y="96" width="112" height="56" rx="8" fill="var(--panel)" stroke="var(--line)"/>
    <text x="530" y="120" class="val" font-size="11.5" text-anchor="middle">"turn left"</text>
    <text x="530" y="136" class="lbl" font-size="9.5" text-anchor="middle">in 200 m</text>
  </g>
  <text x="300" y="252" class="lbl" text-anchor="middle" font-size="10">every layer is wrong on its own — the blue dot is what they agree on</text>
</svg>`

  // ---- drift vs lock ----------------------------------------------------
  const bar = (cls, y, label, colour) => `
  <g class="${cls}">
    <rect x="60" y="${y}" width="8" height="22" rx="2" fill="${colour}"/>
    <rect x="140" y="${y}" width="8" height="22" rx="2" fill="${colour}"/>
    <rect x="220" y="${y}" width="8" height="22" rx="2" fill="${colour}"/>
    <rect x="300" y="${y}" width="8" height="22" rx="2" fill="${colour}"/>
  </g>
  <text x="12" y="${y + 16}" class="lbl" font-size="9.5">${label}</text>`

  const driftFig = `
<svg viewBox="-20 0 440 132" role="img" class="driftfig">
  ${bar('d1', 14, 'video', 'var(--dom-visual)')}
  ${bar('d2', 52, 'audio', 'var(--dom-audio)')}
  ${bar('d3', 90, 'light', 'var(--dom-control)')}
  <text x="200" y="128" class="lbl" text-anchor="middle" font-size="9.5">three free-running clocks — nobody is wrong, and nothing lines up</text>
</svg>`

  const lockBar = (y, label, colour) => `
  <g class="p">
    <rect x="56" y="${y}" width="8" height="22" rx="2" fill="${colour}"/>
    <rect x="140" y="${y}" width="8" height="22" rx="2" fill="${colour}"/>
    <rect x="224" y="${y}" width="8" height="22" rx="2" fill="${colour}"/>
    <rect x="308" y="${y}" width="8" height="22" rx="2" fill="${colour}"/>
  </g>
  <text x="12" y="${y + 16}" class="lbl" font-size="9.5">${label}</text>`

  const lockFig = `
<svg viewBox="-20 0 440 132" role="img" class="lockfig">
  ${[56, 140, 224, 308].map((x) => `<line x1="${x}" y1="8" x2="${x}" y2="106" stroke="var(--accent)" stroke-width="1" stroke-dasharray="2 4"/>`).join('')}
  ${lockBar(14, 'video', 'var(--dom-visual)')}
  ${lockBar(52, 'audio', 'var(--dom-audio)')}
  ${lockBar(90, 'light', 'var(--dom-control)')}
  <text x="200" y="128" class="lbl" text-anchor="middle" font-size="9.5">one clock distributed — everything lands on the same edge</text>
</svg>`

  // ---- tracked followspot ----------------------------------------------
  const trackFig = `
<svg viewBox="0 0 460 200" role="img" class="trackfig">
  <rect x="10" y="150" width="440" height="30" rx="4" fill="var(--panel)" stroke="var(--line)"/>
  <text x="230" y="192" class="lbl" text-anchor="middle" font-size="9.5">the tag knows where it is; the light and the pan follow the same number</text>
  <rect x="30" y="12" width="70" height="22" rx="4" fill="none" stroke="var(--dom-control)" stroke-width="1.3"/>
  <text x="65" y="27" class="lbl" font-size="9" text-anchor="middle" fill="var(--dom-control)">FIXTURE</text>
  <g class="beam"><path d="M65 34 L44 150 L86 150 Z" fill="var(--dom-control)" opacity=".22"/></g>
  <g class="person">
    <circle cx="65" cy="130" r="7" fill="var(--accent)"/>
    <rect x="61" y="137" width="8" height="14" rx="3" fill="var(--accent)"/>
    <circle cx="65" cy="118" r="3.5" fill="var(--accent2)"/>
  </g>
  <g class="pan"><circle cx="65" cy="168" r="6" fill="none" stroke="var(--dom-audio)" stroke-width="1.6"/></g>
  <text x="452" y="27" class="lbl" font-size="9" text-anchor="end" fill="var(--accent2)">tag on the performer</text>
  <text x="452" y="45" class="lbl" font-size="9" text-anchor="end" fill="var(--dom-audio)">audio object pan</text>
</svg>`

  // ---- LED volume -------------------------------------------------------
  const volFig = `
<svg viewBox="0 0 480 210" role="img" class="volfig">
  <path d="M40 30 Q240 6 440 30 L440 150 Q240 176 40 150 Z" fill="var(--panel)" stroke="var(--dom-visual)" stroke-width="1.6"/>
  <text x="240" y="24" class="lbl" text-anchor="middle" font-size="9.5" fill="var(--dom-visual)">LED VOLUME</text>
  <g class="frustum">
    <path d="M150 34 L330 34 L330 148 L150 148 Z" fill="var(--accent)" opacity=".14" stroke="var(--accent)" stroke-dasharray="4 4"/>
    <text x="240" y="95" class="val" font-size="11" text-anchor="middle" fill="var(--accent)">inner frustum</text>
    <text x="240" y="111" class="lbl" font-size="9" text-anchor="middle">rendered for this camera, this frame</text>
  </g>
  <g class="cam">
    <rect x="212" y="172" width="56" height="26" rx="5" fill="var(--panel2)" stroke="var(--ink)" stroke-width="1.3"/>
    <text x="240" y="189" class="lbl" font-size="9" text-anchor="middle">CAMERA</text>
  </g>
  <g class="ray"><path d="M240 172 L240 150" stroke="var(--accent)" stroke-width="1.4" stroke-dasharray="3 4"/></g>
</svg>`

  const spineFig = `
<svg viewBox="-30 0 580 176" role="img" class="spinefig">
  <line x1="34" y1="40" x2="486" y2="40" stroke="var(--accent)" stroke-width="2"/>
  <text x="34" y="26" class="val" font-size="11" fill="var(--accent)">MASTER CLOCK</text>
  <g class="pulse"><circle cx="34" cy="40" r="5" fill="var(--accent2)"/></g>
  ${[['playback', 60], ['lighting', 148], ['audio', 236], ['video', 324], ['pyro / drones', 412]]
    .map(([n, x], i) => `
  <g class="node${i ? ` n${i + 1}` : ''}">
    <line x1="${x + 34}" y1="40" x2="${x + 34}" y2="72" stroke="var(--line)" stroke-width="1.2"/>
    <rect x="${x}" y="72" width="68" height="34" rx="5" fill="var(--panel)" stroke="var(--line)"/>
    <text x="${x + 34}" y="93" class="lbl" font-size="9" text-anchor="middle">${n}</text>
  </g>`).join('')}
  <text x="260" y="150" class="lbl" text-anchor="middle" font-size="9.5">nothing waits for anything else — every department reads the same running time</text>
  <text x="260" y="166" class="lbl" text-anchor="middle" font-size="9.5">a department that misses a frame stays wrong for one frame, not for the rest of the show</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / systems</div>
${learnNav(esc, 'systems')}
<div class="lhero">
  <h2>How it all runs together</h2>
  <p class="lede">A show is not a lighting system next to an audio system next to a video system. It is those systems agreeing about two facts: <em>what time it is</em>, and <em>where things are</em>. Everything on this page is a variation on that.</p>
</div>

${S('Start with something you already use', 'What is actually inside Google Maps', [
  'The blue dot looks like one measurement. It is at least five, and every one of them is unreliable on its own.',
  '<b>GNSS</b> gives position outdoors to a few metres — and, more importantly, the time. It fails indoors, in tunnels, and among tall buildings where the signal arrives by reflection. <b>Cell and Wi-Fi</b> fill that gap: the set of towers and network names your phone can hear is itself a rough location, available where satellites are not. The <b>IMU and compass</b> keep dead reckoning going when both drop out — that is why the dot keeps moving sensibly through a tunnel. <b>Map data</b> arrives over an ordinary web API and supplies the constraints: you are on a road, the road is one-way, its limit is 50. And <b>everybody else\'s anonymised speed</b> becomes the traffic layer.',
  'None of that is a positioning system. The positioning system is the <b>fusion</b>: a running estimate that weighs each source by how much it can currently be trusted, and reports a confidence — which is the circle around the dot.',
])}

${fig(gmFig, 'The layers light in turn, then fuse. Nothing here is accurate alone; the estimate is what they agree on.')}

${rule('This is the pattern for every integrated show system on this page: <b>several individually inadequate sensors, fused against a shared clock and a shared coordinate system.</b> When an integration fails, it is almost always because one of those two shared things was never actually agreed.')}

${S('The first shared fact', 'A clock everything reads', [
  'Give three devices their own crystal and they will each run at very slightly the wrong speed. Nobody is faulty. Over a three-hour show those tiny errors accumulate into a lip-sync problem, a video frame tear, or a lighting cue that lands after the downbeat.',
  'Fixing it means one clock and a way of distributing it. Which one depends on what you are locking: <a href="/protocols/ltc/">LTC</a> and <a href="/protocols/mtc/">MTC</a> carry a running <em>show</em> time so departments know where they are in the running order; <a href="/protocols/ptp-1588/">PTP</a> and <a href="/protocols/word-clock/">word clock</a> carry a <em>sample</em>-accurate time so audio converters agree on individual samples; <a href="/protocols/genlock/">genlock</a> carries a <em>frame</em>-accurate time so cameras and displays start each frame together.',
  'A show usually needs all three, from one house reference, and confusion between them is a classic fault: a system perfectly locked to PTP can still be a second late in the running order, because sample lock and show time are different questions.',
])}

<div class="figrow">
  ${S('', 'How far apart do two free-running clocks actually get?', [
  'Crystals are specified in parts per million, which sounds negligible and is not. Two devices at opposite ends of their tolerance drift apart at the sum of their errors, and the number that matters is not the ppm — it is how many frames apart they are by the curtain call.',
])}

<div class="dial">
  <div class="d"><label for="cd-ppm">combined clock error <b id="cd-ppmv">50 ppm</b></label>
    <input id="cd-ppm" type="range" min="0" max="200" step="1" value="50"></div>
  <div class="d"><label for="cd-min">running time <b id="cd-minv">120 min</b></label>
    <input id="cd-min" type="range" min="5" max="300" step="5" value="120"></div>
  <div class="d"><label for="cd-fps">frame rate <b id="cd-fpsv">25 fps</b></label>
    <input id="cd-fps" type="range" min="24" max="60" step="1" value="25"></div>
</div>
<div class="verdict" id="cd-out"></div>

${fig(driftFig, 'Free-running: everything is right, nothing agrees.')}
  ${fig(lockFig, 'Locked: one reference, one edge.')}
</div>

${bites([
  '<b>"It has timecode" does not say which timecode.</b> LTC on an audio pair, MTC over MIDI, and PTP on the network solve different problems at different resolutions.',
  '<b>Free-run is a decision, not a default.</b> Some things should free-run once triggered — a drone flight, a pyro sequence — precisely because a network stutter must not be able to stall them mid-air.',
  '<b>Every conversion costs frames.</b> Timecode that goes LTC → MTC → a plug-in has accumulated latency at each hop, and none of it is documented.',
])}

${S('The second shared fact', 'A coordinate system everything shares', [
  'The moment two departments both need to know <em>where</em> something is — a followspot and a sound object, a camera and a render engine — they need to agree not just on a number but on an origin, an orientation and a unit.',
  'This is the part that gets skipped. The lighting plot is in metres from the centre line of the stage; the audio designer\'s room model has its origin at the front-of-house desk; the render engine is in Unreal units with Z up. Every one of those is internally correct, and none of them will tell you they disagree — the light will simply be two metres out and everyone will blame the tracking.',
  'Protocols like <a href="/protocols/psn/">PosiStageNet</a> and <a href="/protocols/rttrpm/">RTTrPM</a> exist to carry positions between departments, but they carry coordinates, not agreement about coordinates. The survey happens first.',
])}

${S('Showcase one', 'Tracked followspot and object audio', [
  'A performer wears a tag. Depending on the system that tag is ultra-wideband, infrared, or a hybrid with an inertial sensor for when line of sight is lost. A tracking server turns the raw ranges into a position in the venue\'s coordinate system, at something like 50–100 updates a second.',
  'That position then leaves the tracking system over <a href="/protocols/psn/">PSN</a> or <a href="/protocols/rttrpm/">RTTrPM</a> and is consumed twice: the lighting system pans and focuses fixtures at the point, and the audio system moves a sound object to the same point so the voice comes from where the performer is standing rather than from the PA.',
  'One measurement, two departments, no operator — and the reason it looks like magic is that both departments are reading the same number in the same coordinate system.',
])}

${fig(trackFig, 'One position, consumed by lighting and by audio. Neither department is following the other.')}

<div class="cases">
  <div class="case"><h4>What is in the chain</h4>
    <p>Every box in this chain can be a different vendor. The interfaces between them are the whole game.</p>
    <div class="chain"><b>UWB / IR tag</b><i>→</i><b>tracking server</b><i>→</i><b>PSN / RTTrPM</b><i>→</i><b>console + audio processor</b></div>
  </div>
  <div class="case"><h4>Where it goes wrong</h4>
    <p>Reflections confuse UWB in a steel venue; a tag behind a body loses line of sight; and a tracking update rate below the fixture\'s own smoothing makes the light visibly step rather than glide.</p>
  </div>
</div>

${S('Showcase two', 'An LED volume, and why it needs genlock', [
  'Virtual production replaces a green screen with a wall of LED showing the environment. The trick is that what the wall displays depends on where the camera is, so the wall must be re-rendered every frame from the camera\'s point of view.',
  'The camera\'s position and lens data leave the tracking system over <a href="/protocols/freed/">FreeD</a>. A render engine draws the world from exactly that viewpoint and sends it to an LED processor, which drives the panels. Only the region the camera can see — the <em>inner frustum</em> — needs to be perspective-correct; the rest of the wall carries a coarser version whose job is lighting the scene and reflecting off surfaces.',
  'And all of it hangs on <a href="/protocols/genlock/">genlock</a>. The camera shutter, the render output and the LED panel refresh must all start their frames together, because an LED wall does not display a frame all at once — it refreshes in a scan. A camera shutter that opens out of step with that scan photographs a wall mid-refresh, and you get banding that no amount of grading will remove.',
])}

${fig(volFig, 'The camera moves; the inner frustum moves with it. Frames start together or the wall bands on camera.')}

${rule('An LED volume is a <b>timing</b> problem wearing a video problem\'s clothes. Resolution and pixel pitch are chosen in a meeting; genlock is what decides whether the footage is usable.')}

${S('Showcase three', 'AR, VR and XR — what the letters mean and what is underneath', [
  'The three words describe how much of what you see is real, and they are used loosely enough on riders that it is worth being precise.',
])}

<dl class="xr">
  <div><dt>AR — augmented</dt><dd>The real world, with graphics added on top. A phone camera view with directions drawn on the street; a broadcast pitch with a graphic that appears to stand on the grass.</dd></div>
  <div><dt>VR — virtual</dt><dd>The real world replaced entirely. A headset that occludes your vision and renders everything you see.</dd></div>
  <div><dt>MR — mixed</dt><dd>Graphics that are <em>occluded by</em> and interact with real geometry, rather than sitting flatly on top. It needs a model of the room.</dd></div>
  <div><dt>XR — the umbrella</dt><dd>All of the above. In broadcast and touring it usually means something more specific: an LED volume extended past its physical edges with matched graphics.</dd></div>
</dl>

${S('', 'The four hard parts', [
  '<b>Tracking.</b> Six degrees of freedom — position and orientation — recovered many times a second. Modern headsets do this <em>inside-out</em>, running SLAM (simultaneous localisation and mapping) on their own cameras rather than relying on external base stations. Broadcast AR does the opposite: a camera whose position is measured by encoders on the crane or by an optical system, streamed as <a href="/protocols/freed/">FreeD</a>.',
  '<b>Motion-to-photon latency.</b> The time from your head moving to the light for that new viewpoint reaching your eye. Above roughly 20 ms this stops being a technical figure and starts being nausea, which is why headsets predict where your head will be rather than waiting to find out.',
  '<b>Rendering enough pixels.</b> Two eyes, high refresh, wide field of view. Foveated rendering — full detail only where the eye is actually looking, tracked in real time — is the standard way out.',
  '<b>Registration.</b> The graphic has to sit still relative to the real world. That is the coordinate-system problem again: a virtual object that slides slightly when the camera moves has a lens calibration or an origin that disagrees with reality.',
])}

<div class="m2p" aria-hidden="true">
  <div style="flex:2;background:var(--dom-control)">sensor</div>
  <div style="flex:3;background:var(--accent2)">prediction + render</div>
  <div style="flex:2;background:var(--dom-network)">transport</div>
  <div style="flex:3;background:var(--dom-visual)">display scan</div>
</div>
<p class="m2plegend">every stage spends part of the same ~20 ms budget — the display scan is a stage, not a free step</p>

${bites([
  '<b>A headset spec sheet quotes refresh, not latency.</b> 90 Hz says frames arrive often; it does not say how old each one is.',
  '<b>Broadcast AR is judged by a camera, not an eye.</b> Which makes genlock and lens distortion data matter more than frame rate.',
  '<b>Passthrough is a camera, with a camera\'s latency.</b> "See the real room" in a headset means a rendered picture of the room, delayed like everything else.',
])}

${S('Showcase four', 'The spine that holds a stadium show together', [
  'On a large show, almost nothing is triggered by anything else. Departments are not chained — they are each independently reading the same running time.',
  'A master clock generates timecode. Playback, lighting, audio, video, automation and the pyro or drone operator all follow it. Cues are not "go when the previous thing finishes"; they are "go at 01:14:22:06". Nothing is waiting on a message that might not arrive.',
  'This is why it survives. A department that glitches recovers on the next timecode frame and rejoins, because it can see exactly where the show has got to. A chained system, where each step triggers the next, stops dead at the first missed message and cannot recover without a human.',
])}

${fig(spineFig, 'One running time, read independently by every department. A glitch costs a frame, not the show.')}

${xnote('Synchronisation is not a technical virtue, it is the whole reason a large show reads as one thing rather than several. The moment two departments disagree about time, an audience stops perceiving <em>an event</em> and starts perceiving <em>machinery</em> — and once that has happened it is very hard to get them back. <b>A shared clock is what buys coherence.</b>')}

${rule('Trigger chains fail closed and never recover. <b>A shared clock fails open and re-joins.</b> That is the whole reason big shows run on timecode instead of on cue-to-cue triggers.')}

${S('Putting it back together', 'The two questions worth asking at the start of any integration', [
  'When someone asks whether two systems can work together, the useful questions are not about brands.',
  '<b>What clock are they both reading, and at what resolution?</b> If the answer is "each has its own", the integration will look fine in a demo and drift in a show.',
  '<b>What coordinate system are they both using, and who surveyed it?</b> If the answer is "we will line it up on the day", budget the day.',
  'Everything else — which protocol, whose console, what the API returns — is an implementation detail by comparison. Those are covered on the <a href="/learn/software/">software</a>, <a href="/learn/network/">network</a> and <a href="/learn/connectivity/">connectivity</a> pages; this is the layer above them.',
])}

<div class="cta"><strong>Worked on an integration that fits this pattern?</strong>
<p>The chains on this page are deliberately generic so they stay true across vendors. If your version of one differs in a way that matters, <a href="${GH}/issues/new?labels=tooling&amp;title=systems%3A+">open an issue</a> — showcases are the hardest part of this site to get right from the outside.</p></div>

<script>
(function(){
  var ppm=document.getElementById('cd-ppm'); if(!ppm) return;
  var min=document.getElementById('cd-min'), fps=document.getElementById('cd-fps'),
      pv=document.getElementById('cd-ppmv'), mv=document.getElementById('cd-minv'),
      fv=document.getElementById('cd-fpsv'), out=document.getElementById('cd-out');
  function draw(){
    var p=Number(ppm.value), m=Number(min.value), f=Number(fps.value);
    pv.textContent=p+' ppm'; mv.textContent=m+' min'; fv.textContent=f+' fps';
    var ms=(p/1e6)*m*60*1000, frames=ms/(1000/f), samples=Math.round((ms/1000)*48000);
    var perFrame = p===0 ? null : (1000/f)/((p/1e6)*1000);
    if(p===0){ out.innerHTML='<span class="ok">Two perfect clocks.</span> They never drift, and nothing on earth has them \u2014 which is why the reference is distributed instead.'; return; }
    var verdict = frames < 0.5 ? '<span class="ok">Below half a frame.</span> Nobody will see this.'
      : frames < 2 ? 'Detectable on a hard sync point by the end of the show.'
      : frames < 10 ? '<span class="err">Visible lip sync error.</span> This is the state people describe as "it drifted".'
      : '<span class="err">Well past usable.</span> Departments are now telling different stories about where the show is.';
    out.innerHTML='After '+m+' minutes: <b>'+ms.toFixed(0)+' ms</b> apart \u2014 <b>'+frames.toFixed(1)
      +'</b> frames at '+f+' fps, or '+samples.toLocaleString()+' samples at 48 kHz. '
      +'A whole frame of error accumulates every <b>'+(perFrame>60?(perFrame/60).toFixed(1)+' minutes':perFrame.toFixed(0)+' seconds')+'</b>. '+verdict;
  }
  ppm.addEventListener('input',draw); min.addEventListener('input',draw); fps.addEventListener('input',draw); draw();
})();
</script>
`

  return shell({
    title: 'How it all runs together — clocks, coordinates, tracking, XR | showstack',
    description: 'What is actually inside Google Maps, and the same pattern in show systems: a shared clock and a shared coordinate system behind tracked followspots, object audio, LED volumes, AR/VR/XR and the timecode spine of a stadium show.',
    canonical: `${SITE}/learn/systems/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'How separate show technologies become one system',
      description: 'Sensor fusion, shared clocks and shared coordinate systems, illustrated with Google Maps, tracked followspots, LED volumes, XR and timecode distribution.',
      url: `${SITE}/learn/systems/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
