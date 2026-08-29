/**
 * /learn/rigging/ — hoists, classifications and the safety chain.
 *
 * The most requested and least written-down subject in this industry, and
 * the one where getting it wrong has a different order of consequence from
 * everything else on this site.
 *
 * The organising idea is layers, and the rule that each layer has to remain
 * valid when the layer above it is wrong. Mechanics, then classification,
 * then the safety function, then the control system, then the procedure. A
 * show network sits at layer four and is advisory; almost every serious
 * incident in this field is a layer that was quietly relying on the one
 * above it.
 *
 * Two things get explained properly because nobody explains them properly:
 * what D8, D8 Plus and C1 actually permit, and what a safety relay is doing
 * that a stop button is not. The second one is the more useful, because once
 * you have seen discrepancy monitoring and a feedback loop you can never
 * again read "emergency stop fitted" as a specification.
 *
 * NOTHING HERE IS A DESIGN AUTHORITY. It is written so that the people around
 * a rigging conversation can follow it, and it says so more than once.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

export function learnRiggingPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* the layer stack, with a fault dropping through it */
@keyframes fault{0%{transform:translateY(0);opacity:0}8%{opacity:1}
34%{transform:translateY(46px)}60%{transform:translateY(92px)}
80%{transform:translateY(92px);opacity:1}92%,100%{opacity:0}}
.layerfig .drop{animation:fault 5s ease-in infinite}
@keyframes catchglow{0%,58%{stroke-opacity:.35}66%,84%{stroke-opacity:1}92%,100%{stroke-opacity:.35}}
.layerfig .catch{animation:catchglow 5s ease-in-out infinite}
/* single channel: a weld goes unnoticed */
@keyframes press{0%,30%{transform:translateY(0)}38%,70%{transform:translateY(6px)}78%,100%{transform:translateY(0)}}
@keyframes stillon{0%,100%{opacity:1}}
@keyframes goesoff{0%,34%{opacity:1}42%,74%{opacity:.15}82%,100%{opacity:1}}
.relayfig .btn{animation:press 4s ease-in-out infinite}
.relayfig .lamp1{animation:stillon 4s linear infinite}
.relayfig .lamp2{animation:goesoff 4s linear infinite}
@keyframes weldmark{0%,20%{opacity:0}30%,90%{opacity:1}100%{opacity:0}}
.relayfig .weld{animation:weldmark 4s ease-in-out infinite}
/* two channels disagreeing, and the relay noticing */
@keyframes chA{0%,34%{stroke:var(--ok)}42%,100%{stroke:var(--warn)}}
@keyframes chB{0%,100%{stroke:var(--ok)}}
@keyframes flag{0%,46%{opacity:0}56%,92%{opacity:1}100%{opacity:0}}
.dualfig .a{animation:chA 4s steps(1,end) infinite}
.dualfig .b{animation:chB 4s steps(1,end) infinite}
.dualfig .disc{animation:flag 4s ease-in-out infinite}
/* the e-stop device itself */
@keyframes latch{0%,44%{transform:scale(1)}54%,90%{transform:scale(.86)}100%{transform:scale(1)}}
.estopfig .head{animation:latch 4.4s ease-in-out infinite;transform-origin:120px 84px}
.estopfig .ring{animation:l-breathe 4.4s ease-in-out infinite}
/* travel after the button */
.travel{position:relative;height:78px;border:1px solid var(--line);border-radius:var(--r-md);
background:var(--panel);overflow:hidden;margin-top:14px}
.travel .seg{position:absolute;top:16px;height:30px;border-radius:4px;transition:left .12s,width .12s}
.travel .lb{position:absolute;bottom:6px;font-family:var(--mono);font-size:10px;color:var(--dimmer)}
.travel .press{position:absolute;top:6px;bottom:6px;width:2px;background:var(--ink);left:0}
/* classification cards */
.cls{display:grid;grid-template-columns:repeat(auto-fit,minmax(238px,1fr));gap:14px;margin:18px 0}
.cls > div{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:17px;
border-top:3px solid var(--warn)}
.cls > div:nth-child(2){border-top-color:var(--accent2)}
.cls > div:nth-child(3){border-top-color:var(--ok)}
.cls h4{margin:0 0 3px;font-size:17px;font-family:var(--mono);text-transform:none;letter-spacing:-.2px;
color:var(--ink);font-weight:650}
.cls .sub{font-family:var(--mono);font-size:10.5px;letter-spacing:.4px;color:var(--dimmer);margin:0 0 12px}
.cls p{margin:0 0 9px;color:var(--dim);font-size:13.8px;line-height:1.6}
.cls p:last-child{margin-bottom:0}
.cls .yn{display:flex;flex-direction:column;gap:5px;margin-top:12px;padding-top:11px;
border-top:1px solid var(--line);font-family:var(--mono);font-size:11.5px}
.cls .yn span::before{content:"✕ ";color:var(--warn)}
.cls .yn span.y::before{content:"✓ ";color:var(--ok)}
.cls .yn span{color:var(--dim)}
/* comparison table */
.stab{width:100%;border-collapse:collapse;font-size:14.2px;margin:16px 0}
.stab th{text-align:left;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;
color:var(--dimmer);padding:0 12px 9px 0;border-bottom:1px solid var(--line);font-weight:400;white-space:nowrap}
.stab td{padding:12px 12px 12px 0;border-bottom:1px solid var(--line);vertical-align:top;color:var(--dim);line-height:1.55}
.stab td:first-child{color:var(--ink);white-space:nowrap}
.stab td:nth-child(2){font-family:var(--mono);font-size:12px;color:var(--accent2);white-space:nowrap}
.stabwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.stabwrap .stab{min-width:640px}
/* the warning that this is not a design authority */
.notauth{margin:24px 0;padding:17px 19px;border:1px solid color-mix(in srgb,var(--warn) 40%,transparent);
border-left-width:4px;border-radius:0 var(--r-md) var(--r-md) 0;
background:color-mix(in srgb,var(--warn) 8%,transparent)}
.notauth b{display:block;font-family:var(--mono);font-size:10.5px;letter-spacing:.7px;text-transform:uppercase;
color:var(--warn);margin-bottom:8px}
.notauth p{margin:0;color:var(--ink);font-size:14.8px;line-height:1.65}
`

  const layerFig = `
<svg viewBox="0 0 620 250" role="img" class="layerfig">
  ${[
    ['5 — procedure', 'competent people, exclusion zones, sign-off', 14, 'var(--dimmer)'],
    ['4 — control system', 'the console, the network, the cue list. Advisory.', 60, 'var(--dom-network)'],
    ['3 — safety function', 'e-stop, limits, overload. Rated, and independent.', 106, 'var(--ok)'],
    ['2 — classification', 'what this machine is permitted to do at all', 152, 'var(--accent2)'],
    ['1 — mechanics', 'chain, brakes, design factor, load path', 198, 'var(--accent)'],
  ].map(([t, s, y, c]) => `
  <rect class="${y === 106 ? 'catch' : ''}" x="40" y="${y}" width="540" height="38" rx="7"
    fill="var(--panel)" stroke="${c}" stroke-width="${y === 106 ? 2.2 : 1.4}"/>
  <text x="58" y="${y + 17}" class="val" font-size="11.5" fill="${c}">${t}</text>
  <text x="58" y="${y + 31}" class="lbl" font-size="9">${s}</text>`).join('')}
  <g class="drop"><circle cx="470" cy="33" r="8" fill="var(--warn)"/>
    <text x="470" y="37" font-size="10" font-family="var(--mono)" fill="var(--bg)" text-anchor="middle">!</text></g>
  <text x="310" y="242" class="lbl" text-anchor="middle" font-size="9.5">a fault falls until something catches it — and layer 3 has to catch it whatever layers 4 and 5 did</text>
</svg>`

  const relayFig = `
<svg viewBox="0 0 460 180" role="img" class="relayfig">
  <text x="230" y="18" class="lbl" font-size="10" text-anchor="middle" fill="var(--warn)">ONE CHANNEL, NOT MONITORED</text>
  <g class="btn"><circle cx="70" cy="66" r="17" fill="var(--warn)"/>
    <circle cx="70" cy="66" r="24" fill="none" stroke="var(--accent2)" stroke-width="3"/></g>
  <text x="70" y="110" class="lbl" font-size="9" text-anchor="middle">pressed</text>
  <line x1="98" y1="66" x2="200" y2="66" stroke="var(--dim)" stroke-width="1.6"/>
  <rect x="204" y="48" width="68" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/>
  <text x="238" y="70" class="lbl" font-size="9" text-anchor="middle">contactor</text>
  <g class="weld"><circle cx="238" cy="40" r="7" fill="var(--warn)"/>
    <text x="238" y="30" class="lbl" font-size="8.5" text-anchor="middle" fill="var(--warn)">welded</text></g>
  <line x1="276" y1="66" x2="356" y2="66" stroke="var(--dim)" stroke-width="1.6"/>
  <circle class="lamp1" cx="386" cy="66" r="16" fill="var(--warn)"/>
  <text x="386" y="106" class="lbl" font-size="9" text-anchor="middle" fill="var(--warn)">still running</text>
  <text x="230" y="146" class="lbl" font-size="9.5" text-anchor="middle">the button worked. The circuit did not. Nothing in the system knows.</text>
  <text x="230" y="164" class="lbl" font-size="9.5" text-anchor="middle">and it will look completely normal at the next pre-show check</text>
</svg>`

  const dualFig = `
<svg viewBox="0 0 460 190" role="img" class="dualfig">
  <text x="230" y="18" class="lbl" font-size="10" text-anchor="middle" fill="var(--ok)">TWO CHANNELS, MONITORED</text>
  <circle cx="58" cy="80" r="16" fill="var(--warn)"/>
  <circle cx="58" cy="80" r="23" fill="none" stroke="var(--accent2)" stroke-width="3"/>
  <path class="a" d="M84 64 L232 64" stroke="var(--ok)" stroke-width="2.4" fill="none"/>
  <path class="b" d="M84 96 L232 96" stroke="var(--ok)" stroke-width="2.4" fill="none"/>
  <text x="158" y="56" class="lbl" font-size="9" text-anchor="middle">channel A</text>
  <text x="158" y="112" class="lbl" font-size="9" text-anchor="middle">channel B</text>
  <rect x="236" y="52" width="92" height="56" rx="7" fill="var(--panel2)" stroke="var(--ok)" stroke-width="1.8"/>
  <text x="282" y="76" class="val" font-size="10.5" text-anchor="middle" fill="var(--ok)">SAFETY</text>
  <text x="282" y="92" class="val" font-size="10.5" text-anchor="middle" fill="var(--ok)">RELAY</text>
  <path d="M332 80 L392 80" stroke="var(--dim)" stroke-width="1.6"/>
  <rect x="396" y="62" width="52" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/>
  <text x="422" y="84" class="lbl" font-size="8.5" text-anchor="middle">output</text>
  <path d="M422 102 C422 132 300 138 300 114" stroke="var(--dimmer)" stroke-width="1.2" stroke-dasharray="3 4" fill="none"/>
  <text x="358" y="136" class="lbl" font-size="8.5" text-anchor="middle">feedback loop</text>
  <g class="disc">
    <rect x="150" y="146" width="180" height="26" rx="5" fill="var(--warn)" opacity=".2" stroke="var(--warn)"/>
    <text x="240" y="163" class="lbl" font-size="9.5" text-anchor="middle" fill="var(--warn)">channels disagree → fault, no reset</text>
  </g>
</svg>`

  const estopFig = `
<svg viewBox="0 0 620 180" role="img" class="estopfig">
  <rect class="ring" x="70" y="34" width="100" height="100" rx="10" fill="#e8c93a" stroke="var(--line)"/>
  <g class="head"><circle cx="120" cy="84" r="30" fill="#c8342a"/>
    <circle cx="120" cy="84" r="30" fill="none" stroke="#8f2018" stroke-width="2"/></g>
  <text x="120" y="152" class="lbl" font-size="9" text-anchor="middle">red on yellow, latching, palm-operable</text>
  ${[
    ['directly opening contacts', 'a rigid link forces it open even if it has welded', 30],
    ['wired normally closed', 'a cut cable is a stop, not a silence', 62],
    ['latches when pressed', 'releasing it permits a restart, never causes one', 94],
    ['stop category 0 or 1', 'category 2 keeps power on, and is not allowed', 126],
  ].map(([t, s, y]) => `
  <text x="196" y="${y}" class="val" font-size="10.5" fill="var(--accent)">${t}</text>
  <text x="196" y="${y + 13}" class="lbl" font-size="8.5">${s}</text>`).join('')}
</svg>`

  const T = (a, b, c) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / rigging</div>
${learnNav(esc, 'rigging')}
<div class="lhero">
  <h2>Hoists, holding loads and the safety chain</h2>
  <p class="lede">One question decides almost everything in this subject: <em>is there a person under the load?</em> A hoist lifting a truss into position with the room clear and a hoist holding that truss over a performer are, legally and mechanically, different machines — and the words D8, D8 Plus and C1 exist to say which one you are holding.</p>
</div>

<div class="notauth">
  <b>What this page is</b>
  <p>An explanation written so that everybody around a rigging conversation — designers, programmers, production managers, students — can follow what is being said and ask a better question. It is <b>not</b> a design authority, a substitute for training, or a basis for deciding what may be flown. Those belong to a competent rigger, the governing standards, and the person who signs.</p>
</div>

${S('Start here', 'The layers, and the rule that holds them together', [
  'Every serious machinery incident in this industry has the same shape: a layer that was quietly relying on the layer above it. So it is worth naming them in order, because the order is the argument.',
  '<b>1 — Mechanics.</b> Chain, brakes, design factor, the load path from the fixture to the building. Physics, and it does not care what anybody intended.',
  '<b>2 — Classification.</b> What this machine is <em>permitted</em> to do at all: lift only, hold over people, move over people. This is where D8, D8 Plus and C1 live.',
  '<b>3 — The safety function.</b> Emergency stop, limits, overload and slack detection, speed monitoring. Rated to a Performance Level, and electrically independent of the show.',
  '<b>4 — The control system.</b> The console, the network, the cue list, the operator. This is where the show lives, and it is <em>advisory</em>.',
  '<b>5 — Procedure.</b> Who is competent, who checks, who watches, what the exclusion zone is, who signs.',
  'And the rule: <b>each layer must remain valid when the layer above it is wrong.</b> That is the same claim as the pyro arming chain and the separate safety channel on a PLC, stated in full — and it is why a cue file can never be the reason a machine is safe.',
])}

${fig(layerFig, 'A fault falls until something catches it. Layer 3 has to catch it whatever layers 4 and 5 did.')}

${S('The words everybody uses', 'D8, D8 Plus and C1', [
  'These come from German accident-prevention regulation — <a href="/standards/dguv-vorschrift-17/">BGV C1, now DGUV Vorschrift 17</a> — and they became the international shorthand because nothing else was as short. They describe what a hoist and its control system are permitted to do, not simply what is inside the motor.',
])}

<div class="cls">
  <div>
    <h4>D8</h4>
    <p class="sub">standard hoist · single brake</p>
    <p>An ordinary electric chain hoist. It lifts a load into position and then the load is <b>secured by other means</b> — steels, safeties, a dead-hang — before anybody works underneath.</p>
    <p>A single brake means a single failure can release the load. That is the whole reason for the restriction.</p>
    <div class="yn"><span>suspend a load over people</span><span>move a load over people</span></div>
  </div>
  <div>
    <h4>D8 Plus</h4>
    <p class="sub">second, independent brake</p>
    <p>The same machine with redundancy in the thing that holds: a second brake, independent of the first, so that a single brake failure does not drop the load.</p>
    <p>That permits a <b>static</b> load to be suspended above people. It does not permit that load to move while they are there — nothing is monitoring the motion.</p>
    <div class="yn"><span class="y">suspend a load over people</span><span>move a load over people</span></div>
  </div>
  <div>
    <h4>C1</h4>
    <p class="sub">full compliance · monitored motion</p>
    <p>Redundant braking plus a <b>monitored, rated control system</b>: position and speed feedback, overload and slack-chain detection, and safety functions assessed to a Performance Level.</p>
    <p>Only at this point may a load be <b>moved</b> above people — because only at this point is something independent of the operator watching whether the movement is doing what it was asked to.</p>
    <div class="yn"><span class="y">suspend a load over people</span><span class="y">move a load over people</span></div>
  </div>
</div>

${rule('The classification belongs to <b>the whole system</b> — hoist, controller, rigging and inspection regime — not to the motor. "We have D8 Plus motors" is not the same claim as "this is a D8 Plus system", and only the second one means anything.')}

${bites([
  '<b>The name of the country is part of the answer.</b> Germany reaches for <a href="/standards/dguv-vorschrift-17/">DGUV</a>, the UK for <a href="/standards/bs-7906-1/">BS 7906</a>, the US for the <a href="/standards/ansi-e1-6-1/">ANSI E1.6</a> family, and Europe increasingly for <a href="/standards/en-17206/">EN 17206</a>. They are answering the same question and none of them uses the others\' words for it.',
  '<b>Performer flying is its own discipline.</b> It is not rigging with a person on the end — see <a href="/standards/ansi-e1-43/">ANSI E1.43</a> — and the whole risk assessment is different.',
  '<b>Inspection intervals are part of the classification.</b> A compliant hoist with an expired inspection is not a compliant hoist.',
  '<b>"Over people" includes the crew.</b> The exclusion zone is not an audience-only concept, and load-in is when most of the exposure actually happens.',
])}

${S('The two letters everybody swaps', 'WLL, SWL, and the design factor underneath both', [
  'These get used interchangeably in conversation and they are not interchangeable, and the difference is exactly the kind of thing that decides an argument on a loading dock.',
  '<b>WLL — Working Load Limit.</b> A property of the <em>equipment</em>, assigned by the manufacturer and marked on the item. It is derived from the minimum breaking load divided by a design factor, and it does not change with how you use the thing. A shackle stamped 3.25 t has a WLL of 3.25 t on Monday and on Friday.',
  '<b>SWL — Safe Working Load.</b> Historically, the maximum load in a <em>particular configuration and application</em>, as assessed by a competent person. It can be — and often is — <b>lower</b> than the WLL: a sling at an angle, a beam clamp near an edge, a shackle side-loaded, an unusual environment.',
  'The important part is what happened to the term. <b>SWL has been largely retired from modern standards and legislation</b>, because it implied a guarantee that could not be given and because it blurred a manufacturer\'s rating with a situational judgement. Current equipment standards and UK lifting legislation use WLL. Plenty of people still say SWL out of habit, and that is fine — as long as everybody in the conversation knows which of the two things is being claimed.',
  'Underneath both sits the <b>design factor</b>: WLL is the minimum breaking load divided by it. Entertainment work commonly uses higher factors than general industry, because a load is over people and because the equipment lives in a truck.',
])}

${rule('<b>WLL is stamped on the item.</b> SWL, where it is still used at all, is what a competent person says this arrangement may do today — and it is frequently the smaller number. Never assume the marking is the answer to the question you are asking.')}

${bites([
  '<b>Angle eats capacity.</b> A two-leg sling does not share the load evenly at any angle other than vertical, and a wide included angle multiplies the tension in each leg dramatically. The <a href="/tools/#bridle">bridle geometry tool</a> shows the shape of it; the actual selection belongs to a rigger.',
  '<b>A rating is for the intended loading direction.</b> A shackle side-loaded, a hook tip-loaded or an eyebolt pulled at an angle is outside what the marking describes.',
  '<b>The weakest component sets the assembly.</b> A 3.25 t shackle on a 1 t sling is a 1 t assembly, and the shackle marking is the number people will quote.',
  '<b>Unmarked is unusable.</b> If the marking is illegible the item has no rating you may rely on, whatever it looks like.',
])}

${S('The bit nobody explains', 'What a safety relay does that a stop button does not', [
  'This is the single most useful thing on the page, because once you have seen it you can never again read "emergency stop fitted" as a specification.',
  'A <b>plain stop circuit</b> is one wire through one button to one contactor. Press it and the circuit opens and the machine stops. It works — right up until one of three things happens. The button\'s contact welds shut. A cable chafes and shorts the two sides together. Or the contactor itself welds, which is what contactors do at the end of their lives.',
  'In all three cases the machine keeps running, the button does nothing, and <b>nothing in the system knows</b>. It will look completely normal at the next pre-show check, because the check is somebody pressing the button on a machine that then stops for an entirely different reason, or not checking at all.',
])}

${fig(relayFig, 'The button worked. The circuit did not. Nothing in the system knows.')}

${S('', 'So a safety relay does five things instead', [
  '<b>Two channels.</b> The button carries two independent circuits, and the relay expects both to open. One channel failing does not defeat the function.',
  '<b>Discrepancy monitoring.</b> If one channel opens and the other does not within a short window, that is not a stop — it is a <em>fault</em>. The relay latches out and refuses to reset. A welded contact or a broken wire is now visible instead of silent.',
  '<b>Cross-fault detection.</b> Each channel carries a distinct pulsed test signal, so a short between the two channels — which would otherwise defeat the redundancy completely — is detected as the two channels reading each other\'s pulses.',
  '<b>Positively guided contacts.</b> Inside the relay, the normally-open and normally-closed contacts are mechanically tied together. If a normally-open contact welds closed, the normally-closed one physically cannot close. The relay reads that back and knows.',
  '<b>A feedback loop.</b> The relay watches the mirror contacts of the contactors it is switching. A welded contactor downstream means the relay will not permit a reset — which is the one that catches the failure the plain circuit could not see at all.',
  'Add a <b>monitored manual reset</b> — requiring both a rising and a falling edge, so a taped-down reset button cannot arm anything — and you have a function where <em>a single fault does not cause loss of safety, and the fault is detected</em>. That sentence is the definition of Category 3 and 4 in <a href="/standards/iso-13849-1/">ISO 13849-1</a>.',
])}

${fig(dualFig, 'Two channels, watched. A disagreement is a fault, not a stop — and a fault will not reset.')}

${rule('A stop button interrupts a circuit. A safety relay <b>checks that the interruption actually happened</b>, in a way that survives the button, the cable or the contactor failing. That difference is the entire subject.')}

${S('The device itself', 'What the standards actually require of an e-stop', [
  'The physical requirements come mostly from <a href="/standards/iso-13850/">ISO 13850</a> and IEC 60947-5-5, and they are more specific than most people expect.',
])}

${fig(estopFig, 'Red on yellow, latching, palm-operable, positively opening, wired normally closed.')}

<div class="stabwrap">
<table class="stab">
  <thead><tr><th>Requirement</th><th>The rule</th><th>Why it is that way</th></tr></thead>
  <tbody>
    ${T('Colour', 'red on yellow', 'Reserved for emergency stop. Using red-on-yellow for anything else — a house-light kill, a convenience stop — dilutes the one signal a stranger will recognise under pressure.')}
    ${T('Shape and size', 'palm or mushroom head', 'It has to be operable by the flat of a hand, without looking and without accuracy. The common 40 mm head follows from that requirement rather than the other way round.')}
    ${T('Latching', 'stays in when pressed', 'The stop persists without anybody holding it, and releasing takes a deliberate twist, pull or key.')}
    ${T('Release behaviour', 'must not restart the machine', 'Releasing only <em>permits</em> a restart. A separate, deliberate reset is required, so that clearing a fault cannot itself set something moving.')}
    ${T('Contacts', 'directly opening', 'A rigid mechanical link forces the contact apart, so a welded contact still opens when you push. An ordinary relay contact offers no such guarantee.')}
    ${T('Wiring', 'normally closed', 'The circuit is held closed by the healthy button. A cut cable, an unplugged connector or a corroded terminal is therefore a stop — a fault fails toward safe rather than toward silence.')}
    ${T('Reach', 'from every operating position', 'And along access routes, unobstructed, at every position from which somebody could start the machine or be exposed to it.')}
    ${T('Span of control', 'the whole hazard zone', 'One button must stop everything in the zone it covers. A machine that stops while the one beside it keeps moving means the zones were never actually defined.')}
    ${T('Stop category', '0 or 1, never 2', 'From <a href="/standards/iec-60204-1/">IEC 60204-1</a>. Category 0 removes power immediately — correct for a hoist, because the brake is spring-applied and losing power <em>applies</em> it. Category 2 keeps power on and is not permitted.')}
  </tbody>
</table>
</div>

${bites([
  '<b>An emergency stop is a complementary measure, not a protective one.</b> <a href="/standards/iso-13850/">ISO 13850</a> says so explicitly. It does not make a machine safe; it is the last resort after safe design, guarding and limits have done their work.',
  '<b>It cannot be the reason people are allowed to be there.</b> If the safety case depends on somebody noticing and reacting in time, there is no safety case.',
  '<b>Test it as a function, not as a button.</b> Pressing it and watching the machine stop proves the happy path. It proves nothing about the second channel, the feedback loop or a welded contactor.',
  '<b>Never fit a stop that only tells software to stop.</b> If the path from the button runs through the control system, the control system is now part of the safety function — and it was not assessed as one.',
])}

${S('How much protection is enough', 'The risk graph, and what PL and SIL actually mean', [
  'Before you can say whether a safety function is good enough, you have to say what it has to achieve. <a href="/standards/iso-13849-1/">ISO 13849-1</a> answers that with three binary questions, asked in a fixed order, and a graph with eight leaves.',
  'The output is a <b>required Performance Level</b>, PL a through e — a target expressed ultimately as a probability of dangerous failure per hour. <a href="/standards/iec-62061/">IEC 62061</a> answers the same question through <b>SIL</b> instead, and both derive from <a href="/standards/iec-61508/">IEC 61508</a>. They correspond roughly, and a specification quoting both without saying which was assessed is quoting marketing.',
  'Try the three questions on a real case.',
])}

<div class="dial">
  <div class="d" style="flex:0 0 auto"><label>S — severity of injury</label>
    <span class="seg" role="group" data-q="S">
      <button type="button" data-v="S1" aria-pressed="false">S1 reversible</button>
      <button type="button" data-v="S2" aria-pressed="true">S2 serious</button>
    </span></div>
  <div class="d" style="flex:0 0 auto"><label>F — frequency of exposure</label>
    <span class="seg" role="group" data-q="F">
      <button type="button" data-v="F1" aria-pressed="false">F1 seldom</button>
      <button type="button" data-v="F2" aria-pressed="true">F2 frequent</button>
    </span></div>
  <div class="d" style="flex:0 0 auto"><label>P — possibility of avoiding</label>
    <span class="seg" role="group" data-q="P">
      <button type="button" data-v="P1" aria-pressed="false">P1 possible</button>
      <button type="button" data-v="P2" aria-pressed="true">P2 scarcely</button>
    </span></div>
</div>
<div class="verdict" id="pl-out"></div>
<p style="color:var(--dimmer);font-size:12.5px;font-family:var(--mono);margin-top:6px">This determines what the function must <em>achieve</em>. Whether a given design achieves it is a separate calculation from architecture, MTTFd, diagnostic coverage and common-cause failure — and that calculation is the competent person&rsquo;s, not this page&rsquo;s.</p>

${S('The number that surprises people', 'How far it travels after you press the button', [
  'A safety relay responds in tens of milliseconds. That is a true fact and it answers the wrong question, because nothing has started slowing down yet. The number that matters is the <b>total travel</b>: the distance covered during the reaction time, plus the distance covered while actually decelerating.',
  'Reaction is detection plus logic plus output switching — and on a networked safety system, plus the watchdog timeout, which is why the watchdog is a design decision rather than a default. Deceleration is mass and brake torque, and it dominates.',
])}

<div class="dial">
  <div class="d"><label for="sd-v">travel speed <b id="sd-vv">0.20 m/s</b></label>
    <input id="sd-v" type="range" min="1" max="150" step="1" value="20"></div>
  <div class="d"><label for="sd-t">reaction time <b id="sd-tv">50 ms</b></label>
    <input id="sd-t" type="range" min="5" max="400" step="5" value="50"></div>
  <div class="d"><label for="sd-a">deceleration <b id="sd-av">1.0 m/s²</b></label>
    <input id="sd-a" type="range" min="1" max="60" step="1" value="10"></div>
</div>
<div class="travel" aria-hidden="true">
  <span class="press"></span>
  <div class="seg" id="sd-react" style="background:var(--warn)"></div>
  <div class="seg" id="sd-brake" style="background:var(--accent)"></div>
  <span class="lb" id="sd-lb" style="left:8px">button pressed</span>
</div>
<div class="verdict" id="sd-out"></div>

${rule('"The relay responds in 15 ms" is a component figure. <b>Stopping performance is a system figure</b>, and it is the only one that decides where a person may stand.')}

${S('Safety on the same wire', 'The black channel, and why it works', [
  'Modern machinery does not run a parallel loop of hard wiring to every emergency stop. The safety function travels over the same industrial network as everything else — <a href="/protocols/profisafe/">PROFIsafe</a> on PROFINET, <a href="/protocols/fsoe/">Safety over EtherCAT</a> on <a href="/protocols/ethercat/">EtherCAT</a>, CIP Safety on EtherNet/IP.',
  'The idea that makes this legitimate is the <b>black channel</b>. The safety layer assumes the network underneath it is completely untrustworthy and protects itself: its own CRC over the safety payload, its own sequence numbering, its own device identifiers, and its own watchdog. Corruption, loss, duplication, delay, resequencing and messages arriving at the wrong device are each detected by the layer above, so the network itself never has to be safety-rated.',
  'That should look familiar. It is precisely the toolkit from <a href="/learn/encoding/">how a one gets down a wire</a> — checksums, sequence numbers, timeouts — applied with the assumption that everything below has failed. And the consequence lands back in the previous section: <b>the watchdog timeout is part of the stopping time</b>, and therefore part of how far away the barrier has to be.',
])}

${S('Where the show sits', 'Layer four, and what it is allowed to be', [
  'A cue file can ask a machine to move. It can sequence, monitor, report and integrate with lighting, sound and video. It is where the artistry of automation actually happens, and none of that is diminished by the next sentence.',
  'It cannot be the reason anybody is safe. Not the console, not the network, not the timecode, not the operator\'s attention. The safety function must hold when the control system is running the wrong file, has crashed, has been updated by somebody helpful, or is being driven by a laptop that should not have been plugged in.',
  'Which is also why the automation operator has a dead-man and the lighting operator does not — and why an automation cue is called and confirmed rather than simply fired. The procedure at layer five exists because layers three and four are known to be insufficient on their own.',
])}

${xnote('An audience reads a moving machine as a <b>character</b>, and reads hesitation, overshoot and recovery as intent. But the more important experience fact is the invisible one: everything on this page is what allows a designer to put a performer under a moving load at all. <b>The safety case is what makes the picture available</b> — which is the least glamorous and most consequential way this site connects engineering to what people see.')}

${bites([
  '<b>Nobody has ever been hurt by a machine that was not moving.</b> The classifications, the zones and the procedures are all versions of that sentence.',
  '<b>The competent person is a role, not a compliment.</b> It has a definition in the standards and it comes with responsibility somebody has accepted in writing.',
  '<b>Ask which layer a claim belongs to.</b> "It has a safety relay" is layer three. "It is D8 Plus" is layer two. "The cue list checks the position" is layer four, and is not a safety claim at all.',
  '<b>If the answer to "can we fly that during the show" is yes, ask what makes it yes.</b> There is a correct answer with a document behind it, and everybody in the room benefits from hearing it out loud.',
])}

<div class="notauth">
  <b>Saying it once more</b>
  <p>This page exists so that more people in a production can follow a rigging conversation, ask a sharper question, and understand why an answer is what it is. Deciding what may be flown, over whom, and on what equipment belongs to a competent rigger working to the standards for the territory you are in — and to the person whose signature is on it.</p>
</div>

<div class="cta"><strong>Work in automation or rigging?</strong>
<p>This is the area where the gap between what is written down and what practitioners know is widest, and where regional practice diverges most. The <a href="/standards/">standards index</a> lists the governing documents with access links. If a description here does not match how it works in your territory, <a href="${GH}/issues/new?labels=tooling&amp;title=rigging%3A+">open an issue</a> — corrections from riggers are the ones worth having.</p></div>

<script>
(function(){
  // ---- the ISO 13849-1 risk graph ------------------------------------
  var pick={S:'S2',F:'F2',P:'P2'};
  var GRAPH={S1F1P1:'a',S1F1P2:'b',S1F2P1:'b',S1F2P2:'c',S2F1P1:'c',S2F1P2:'d',S2F2P1:'d',S2F2P2:'e'};
  var SIL={a:null,b:1,c:1,d:2,e:3};
  var PFH={a:'10\\u207b\\u2075 to 10\\u207b\\u2074',b:'3\\u00d710\\u207b\\u2076 to 10\\u207b\\u2075',
           c:'10\\u207b\\u2076 to 3\\u00d710\\u207b\\u2076',d:'10\\u207b\\u2077 to 10\\u207b\\u2076',
           e:'10\\u207b\\u2078 to 10\\u207b\\u2077'};
  var NOTE={
    a:'The lowest target. Achievable with a well-chosen single channel.',
    b:'Single channel with some diagnostics, or a simple redundant arrangement.',
    c:'Redundancy is expected. A monitored two-channel circuit is the usual answer.',
    d:'Category 3 territory: a single fault must not cause loss of safety, and must be detected.',
    e:'The highest target, and where a load moving above people lands. Category 4: the fault is detected at or before the next demand, and an accumulation of faults still does not cause loss of safety.'
  };
  var out=document.getElementById('pl-out');
  function drawPl(){
    var pl=GRAPH[pick.S+pick.F+pick.P];
    document.querySelectorAll('.dial .seg[data-q]').forEach(function(seg){
      var q=seg.dataset.q;
      seg.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.v===pick[q]))});
    });
    out.innerHTML='Required Performance Level <b>PL '+pl+'</b>'+
      (SIL[pl]?' \\u2014 roughly SIL '+SIL[pl]:' \\u2014 below the SIL range')+
      '. Dangerous failure probability '+PFH[pl]+' per hour. '+NOTE[pl];
  }
  document.querySelectorAll('.dial .seg[data-q]').forEach(function(seg){
    seg.addEventListener('click',function(e){var b=e.target.closest('button');
      if(b){pick[seg.dataset.q]=b.dataset.v; drawPl()}});
  });
  drawPl();

  // ---- travel after the button ---------------------------------------
  var v=document.getElementById('sd-v'); if(!v) return;
  var t=document.getElementById('sd-t'), a=document.getElementById('sd-a'),
      vv=document.getElementById('sd-vv'), tv=document.getElementById('sd-tv'),
      av=document.getElementById('sd-av'), re=document.getElementById('sd-react'),
      br=document.getElementById('sd-brake'), so=document.getElementById('sd-out');
  function drawSd(){
    var V=Number(v.value)/100, T=Number(t.value)/1000, A=Number(a.value)/10;
    vv.textContent=V.toFixed(2)+' m/s'; tv.textContent=Number(t.value)+' ms'; av.textContent=A.toFixed(1)+' m/s\\u00b2';
    var dr=V*T, db=(V*V)/(2*A), total=dr+db, tt=T+V/A;
    var scale=Math.max(total,0.05);
    re.style.left='0%'; re.style.width=((dr/scale)*100).toFixed(2)+'%';
    br.style.left=((dr/scale)*100).toFixed(2)+'%'; br.style.width=((db/scale)*100).toFixed(2)+'%';
    function mm(x){ return x<1 ? (x*1000).toFixed(0)+' mm' : x.toFixed(2)+' m' }
    so.innerHTML='Travel after the button: <b>'+mm(dr)+'</b> during the reaction time, then <b>'+mm(db)+
      '</b> slowing down \\u2014 <b>'+mm(total)+'</b> in total, over '+(tt*1000).toFixed(0)+' ms. '+
      'The reaction is only '+((dr/(total||1))*100).toFixed(0)+'% of it, '+
      'which is why quoting the relay response time answers the wrong question.';
  }
  for (var el of [v,t,a]) el.addEventListener('input',drawSd);
  drawSd();
})();
</script>
`

  return shell({
    title: 'Hoists, holding loads and the safety chain | showstack',
    description: 'What D8, D8 Plus and C1 actually permit and where the words come from, what a safety relay does that a stop button does not, the standards behind an emergency stop device, the ISO 13849-1 risk graph, how far a load travels after the button, and how PROFIsafe and Safety over EtherCAT carry a safety function on an ordinary network.',
    canonical: `${SITE}/learn/rigging/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Hoist classifications and the machinery safety chain',
      description: 'D8, D8 Plus and C1 classifications, two-channel safety relays and monitored stop circuits, ISO 13850 emergency stop requirements, Performance Level and SIL, stopping distance, and safety over industrial networks.',
      url: `${SITE}/learn/rigging/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
