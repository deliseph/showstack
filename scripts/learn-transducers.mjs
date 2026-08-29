/**
 * /learn/transducers/ — turning the world into a voltage, and back.
 *
 * A microphone, an encoder, a load cell and a photodiode are the same kind of
 * object: something physical happens, and a number comes out. Once that is
 * said plainly, the differences between them stop being trivia and become a
 * short list of engineering choices - does it need power, what is its noise
 * floor, what does it do when it saturates, and does it know where it is at
 * power-up or only how far it has moved since.
 *
 * The second half is the other side of the same coin: what happens to that
 * small voltage on its way somewhere. Balanced lines, common-mode rejection,
 * ground loops and isolation are not four topics, they are one, and the hum
 * everybody has chased at 2 a.m. is the thing they all explain.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav } from './learn-kit.mjs'

export function learnTransducersPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* a diaphragm moving, and what each mic type does about it */
@keyframes wave-in{0%{transform:translateX(0);opacity:0}12%{opacity:1}
72%{transform:translateX(96px);opacity:1}84%,100%{opacity:0}}
@keyframes diaph{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}}
@keyframes coil{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}}
.micfig .w{animation:wave-in 2.2s linear infinite}
.micfig .w.w2{animation-delay:.55s}
.micfig .w.w3{animation-delay:1.1s}
.micfig .dia{animation:diaph 1.1s ease-in-out infinite}
.micfig .cl{animation:coil 1.1s ease-in-out infinite;animation-delay:.03s}
@keyframes chg{0%,100%{opacity:.3}50%{opacity:1}}
.micfig .chgmark{animation:chg 1.1s ease-in-out infinite}
/* balanced line: the same interference on both legs, subtracted away */
@keyframes noise-hit{0%,100%{transform:translateY(0)}25%{transform:translateY(-6px)}75%{transform:translateY(6px)}}
.balfig .leg{animation:noise-hit 1.6s ease-in-out infinite}
.balfig .clean{animation:none}
@keyframes zap{0%{transform:translateX(0);opacity:0}20%{opacity:1}80%{transform:translateX(240px);opacity:1}
92%,100%{opacity:0}}
.balfig .em{animation:zap 3s linear infinite}
/* the ground loop: current going round a ring it should not */
@keyframes loop{to{stroke-dashoffset:-64}}
.gndfig .ring{stroke-dasharray:7 9;animation:loop 1.4s linear infinite}
.gndfig .hum{animation:l-breathe 1.4s ease-in-out infinite}
/* encoders: one counts, one knows */
@keyframes spin{to{transform:rotate(360deg)}}
.encfig .disc{animation:spin 6s linear infinite;transform-origin:var(--ox) 96px}
@keyframes pulse-a{0%,48%{opacity:1}50%,100%{opacity:.2}}
@keyframes pulse-b{0%,23%{opacity:.2}25%,73%{opacity:1}75%,100%{opacity:.2}}
.encfig .qa{animation:pulse-a .6s steps(1,end) infinite}
.encfig .qb{animation:pulse-b .6s steps(1,end) infinite}
/* comparison grid */
.tg{display:grid;grid-template-columns:repeat(auto-fit,minmax(238px,1fr));gap:14px;margin:18px 0}
.tg > div{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:16px;
border-top:3px solid var(--accent)}
.tg > div:nth-child(2){border-top-color:var(--accent2)}
.tg > div:nth-child(3){border-top-color:var(--ok)}
.tg h4{margin:0 0 8px;font-size:15.5px;font-family:var(--sans);text-transform:none;color:var(--ink);
letter-spacing:-.1px;font-weight:650}
.tg p{margin:0 0 9px;color:var(--dim);font-size:13.8px;line-height:1.6}
.tg p:last-child{margin-bottom:0}
.tg .k{font-family:var(--mono);font-size:11px;color:var(--dimmer);border-top:1px solid var(--line);
padding-top:9px;margin-top:10px;line-height:1.7}
`

  const micFig = (kind) => {
    const cond = kind === 'condenser'
    return `
<svg viewBox="0 0 300 190" role="img" class="micfig">
  <text x="150" y="16" class="lbl" font-size="10" text-anchor="middle" fill="${cond ? 'var(--accent2)' : 'var(--accent)'}">${cond ? 'CONDENSER' : 'DYNAMIC'}</text>
  ${[0, 1, 2].map((i) => `<g class="w${i ? ` w${i + 1}` : ''}"><path d="M14 ${60 + i * 22} q10 -9 20 0 t20 0" fill="none"
    stroke="var(--dimmer)" stroke-width="1.4"/></g>`).join('')}
  <path class="dia" d="M132 40 L132 140" stroke="${cond ? 'var(--accent2)' : 'var(--accent)'}" stroke-width="2.5"/>
  <text x="132" y="160" class="lbl" font-size="8.5" text-anchor="middle">diaphragm</text>
  ${cond
    ? `<path d="M150 40 L150 140" stroke="var(--dimmer)" stroke-width="2.5"/>
       <text x="152" y="174" class="lbl" font-size="8.5" text-anchor="middle">fixed backplate</text>
       <g class="chgmark">${[0, 1, 2, 3].map((i) => `<text x="141" y="${58 + i * 24}" font-size="11" fill="var(--accent2)" text-anchor="middle" font-family="var(--mono)">+</text>`).join('')}</g>
       <rect x="196" y="70" width="72" height="40" rx="6" fill="var(--panel)" stroke="var(--accent2)"/>
       <text x="232" y="88" class="lbl" font-size="8.5" text-anchor="middle">impedance</text>
       <text x="232" y="101" class="lbl" font-size="8.5" text-anchor="middle">converter</text>
       <path d="M154 90 L192 90" stroke="var(--dimmer)" stroke-width="1.2"/>
       <text x="232" y="130" class="lbl" font-size="8.5" text-anchor="middle" fill="var(--accent2)">needs 48 V</text>`
    : `<g class="cl"><rect x="140" y="72" width="14" height="36" rx="3" fill="none" stroke="var(--accent)" stroke-width="2"/>
       ${[0, 1, 2].map((i) => `<line x1="140" y1="${80 + i * 12}" x2="154" y2="${80 + i * 12}" stroke="var(--accent)" stroke-width="1.4"/>`).join('')}</g>
       <text x="147" y="174" class="lbl" font-size="8.5" text-anchor="middle">coil</text>
       <rect x="166" y="62" width="26" height="56" rx="4" fill="var(--dimmer)" opacity=".45"/>
       <text x="232" y="88" class="lbl" font-size="8.5" text-anchor="middle">magnet</text>
       <text x="232" y="130" class="lbl" font-size="8.5" text-anchor="middle" fill="var(--accent)">no power needed</text>`}
</svg>`
  }

  const balFig = `
<svg viewBox="-46 0 552 176" role="img" class="balfig">
  <text x="20" y="16" class="lbl" font-size="9.5">interference arrives on both legs equally</text>
  <g class="em"><rect x="26" y="26" width="26" height="10" rx="3" fill="var(--warn)"/></g>
  <path class="leg" d="M40 62 L300 62" stroke="var(--accent)" stroke-width="2"/>
  <text x="18" y="66" class="lbl" font-size="9" text-anchor="end">hot</text>
  <path class="leg" d="M40 96 L300 96" stroke="var(--accent2)" stroke-width="2"/>
  <text x="18" y="100" class="lbl" font-size="9" text-anchor="end">cold</text>
  <path d="M40 128 L300 128" stroke="var(--dimmer)" stroke-width="1.2" stroke-dasharray="4 5"/>
  <text x="18" y="132" class="lbl" font-size="9" text-anchor="end">shield</text>
  <rect x="304" y="52" width="66" height="54" rx="7" fill="var(--panel)" stroke="var(--ok)" stroke-width="1.6"/>
  <text x="337" y="76" class="lbl" font-size="9" text-anchor="middle">hot</text>
  <text x="337" y="90" class="lbl" font-size="9" text-anchor="middle">minus cold</text>
  <path class="clean" d="M378 79 L442 79" stroke="var(--ok)" stroke-width="2.4"/>
  <text x="410" y="66" class="lbl" font-size="9" text-anchor="middle" fill="var(--ok)">clean</text>
  <text x="230" y="164" class="lbl" font-size="9.5" text-anchor="middle">the wanted signal is the difference; anything common to both subtracts away</text>
</svg>`

  const gndFig = `
<svg viewBox="-46 0 552 180" role="img" class="gndfig">
  <rect x="24" y="34" width="96" height="46" rx="6" fill="var(--panel)" stroke="var(--line)"/>
  <text x="72" y="62" class="lbl" font-size="9" text-anchor="middle">device A</text>
  <rect x="340" y="34" width="96" height="46" rx="6" fill="var(--panel)" stroke="var(--line)"/>
  <text x="388" y="62" class="lbl" font-size="9" text-anchor="middle">device B</text>
  <path class="ring" d="M120 57 L340 57 M388 84 L388 128 L72 128 L72 84"
    fill="none" stroke="var(--warn)" stroke-width="2"/>
  <text x="230" y="46" class="lbl" font-size="8.5" text-anchor="middle">signal shield</text>
  <text x="230" y="146" class="lbl" font-size="8.5" text-anchor="middle">mains earth, via two different sockets</text>
  <g class="hum"><text x="230" y="100" class="val" font-size="13" text-anchor="middle" fill="var(--warn)">50 / 60 Hz</text></g>
  <text x="230" y="172" class="lbl" font-size="9.5" text-anchor="middle">two earth paths make a loop, and the loop is in your signal</text>
</svg>`

  const encFig = `
<svg viewBox="0 0 460 200" role="img" class="encfig">
  <text x="106" y="16" class="lbl" font-size="10" text-anchor="middle" fill="var(--accent)">INCREMENTAL</text>
  <g class="disc" style="--ox:106px">
    <circle cx="106" cy="96" r="52" fill="none" stroke="var(--line)" stroke-width="1.4"/>
    ${[...Array(16)].map((_, i) => {
      const a = (i / 16) * Math.PI * 2
      return `<line x1="${106 + Math.cos(a) * 40}" y1="${96 + Math.sin(a) * 40}" x2="${106 + Math.cos(a) * 52}" y2="${96 + Math.sin(a) * 52}" stroke="var(--accent)" stroke-width="3"/>`
    }).join('')}
  </g>
  <g class="qa"><rect x="60" y="160" width="40" height="12" rx="2" fill="var(--accent)"/></g>
  <g class="qb"><rect x="112" y="160" width="40" height="12" rx="2" fill="var(--accent2)"/></g>
  <text x="106" y="188" class="lbl" font-size="8.5" text-anchor="middle">direction from which leads</text>
  <line x1="230" y1="10" x2="230" y2="190" stroke="var(--line)"/>
  <text x="348" y="16" class="lbl" font-size="10" text-anchor="middle" fill="var(--ok)">ABSOLUTE</text>
  <g class="disc" style="--ox:348px">
    <circle cx="348" cy="96" r="52" fill="none" stroke="var(--line)" stroke-width="1.4"/>
    ${[0, 1, 2, 3].map((ring) => [...Array(8)].map((_, i) => {
      const on = (i >> ring) & 1
      if (!on) return ''
      const a0 = (i / 8) * 360, a1 = ((i + 1) / 8) * 360, r = 20 + ring * 8
      const rad = (d) => (d * Math.PI) / 180
      const x0 = 348 + Math.cos(rad(a0)) * r, y0 = 96 + Math.sin(rad(a0)) * r
      const x1 = 348 + Math.cos(rad(a1)) * r, y1 = 96 + Math.sin(rad(a1)) * r
      return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="var(--ok)" stroke-width="6"/>`
    }).join('')).join('')}
  </g>
  <text x="348" y="172" class="lbl" font-size="8.5" text-anchor="middle">a unique code at every position</text>
  <text x="348" y="188" class="lbl" font-size="8.5" text-anchor="middle">it knows where it is at power-up</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / transducers</div>
${learnNav(esc, 'transducers')}
<div class="lhero">
  <h2>Turning the world into a voltage</h2>
  <p class="lede">A microphone, an encoder, a load cell and a photodiode are the same kind of object: something physical happens, and a number comes out. Every difference between them is a short list of engineering answers — does it need power, what is its noise floor, what does it do when it saturates, and does it know where it is or only how far it has moved.</p>
</div>

${S('The pair everybody meets first', 'Dynamic and condenser, as signal problems', [
  'Both start identically: sound moves a diaphragm. What differs is how that movement is turned into electricity, and every practical consequence follows from that one choice.',
  'A <b>dynamic</b> microphone attaches a coil of wire to the diaphragm and suspends it in a magnetic field. Move a conductor through a field and a voltage appears — this is a generator, and it generates its own signal from the energy in the sound itself. Nothing has to be supplied. The moving mass is comparatively large, so it is slower to respond and less sensitive, and it will take an enormous amount of level before anything gives up.',
  'A <b>condenser</b> makes the diaphragm one plate of a capacitor with a fixed backplate behind it. Sound changes the spacing, which changes the capacitance, which — with a fixed charge held across it — changes the voltage. The moving mass is tiny, so it responds far more precisely to detail and transient.',
  'But that capacitance is minute, and its output impedance is enormous. Connect it directly to a cable and the signal is gone. So every condenser has an <b>impedance converter</b> built in, a few millimetres behind the capsule — and that circuit needs a supply, which is what phantom power is for. Phantom is not powering the diaphragm. It is powering the amplifier that makes the capsule\'s output usable at all.',
])}

<div class="figrow">
  ${fig(micFig('dynamic'), 'Dynamic: a generator. It makes its own signal and needs nothing from you.')}
  ${fig(micFig('condenser'), 'Condenser: a charged capacitor plus a built-in amplifier. Phantom feeds the amplifier.')}
</div>

<div class="tg">
  <div><h4>Dynamic</h4>
    <p>Robust, no power, high SPL tolerance, lower output, slower transient response.</p>
    <p class="k">loud sources · touring · anything that gets dropped</p></div>
  <div><h4>Condenser</h4>
    <p>Sensitive, detailed, higher output, needs phantom, and unhappy about moisture and being thrown in a case.</p>
    <p class="k">detail · overheads · broadcast · studio</p></div>
  <div><h4>Ribbon</h4>
    <p>A thin metal ribbon in a field — a dynamic by principle, with a very low output and a famously fragile element. Phantom power on a vintage ribbon can destroy it.</p>
    <p class="k">check before you patch, every time</p></div>
</div>

${rule('Phantom power feeds a condenser\'s <b>built-in amplifier</b>, not its capsule. Which is why a dynamic ignores it, and why a ribbon can be ruined by it.')}

${S('The journey after that', 'Why a balanced line works, in one sentence', [
  'A microphone produces something in the order of a thousandth of a volt. It then has to travel fifty metres through a building full of dimmers, motors and mains cable. That should be hopeless, and it is not, because of one idea.',
  'Send the signal down <b>two</b> conductors, one of them inverted. Interference picked up along the way lands on both conductors almost identically — the two wires are twisted together and are in the same field. At the far end the receiver takes the <em>difference</em> between them. The wanted signal, being opposite on the two legs, doubles. The interference, being identical on both, subtracts to nothing.',
  'That is common-mode rejection, and it is the whole trick. It is also why a balanced line stops working the instant the two legs stop being treated identically: an unbalanced adapter, a broken cold leg, a badly wired patch. The rejection is not a property of the cable. It is a property of the <em>symmetry</em>.',
])}

${fig(balFig, 'Both legs pick up the same interference. Taking the difference removes it and keeps the signal.')}

${S('The hum', 'Ground loops, and why the fix is isolation', [
  'Earth is supposed to be one thing at one potential. In a building it is not: two sockets on different circuits sit at slightly different potentials, and the difference is small but real.',
  'Now connect two devices to those two sockets, and also connect them to each other with a cable whose shield joins their chassis. You have made a loop — a closed conducting ring, often several metres across, threading through a building full of mains fields. A loop in a changing magnetic field has a current induced in it, and that current is at mains frequency and its harmonics. It flows through your signal grounds, and you hear it.',
  'The cure is to <b>break the loop</b>, and the honest options are limited. An <b>isolation transformer</b> — the thing inside a DI box\'s ground-lift position — passes the signal magnetically while leaving no conductive path, which removes the loop entirely and is the only fully general answer. Lifting a shield at one end removes the ring while keeping the screen doing its job for the rest of the run. Feeding everything from one distribution point stops the two earths differing in the first place.',
  'What is not an option is lifting a mains earth. That earth is a safety conductor, it is there so that a fault current trips a breaker instead of finding a person, and removing it turns a hum into a hazard. This is the one place in this whole site where the shortcut is genuinely dangerous.',
])}

${fig(gndFig, 'Two earth paths make a ring. The ring picks up the building, and the building is in your signal.')}

${bites([
  '<b>Never lift a mains earth to cure hum.</b> It is a safety conductor. Lift the signal shield, use a transformer, or fix the power distribution.',
  '<b>Hum that changes when you touch a rack is a bonding problem</b>, not a cable problem. Chase the earths before you rewire anything.',
  '<b>The "pin 1 problem" is a design fault in the device.</b> Shield current routed through internal audio ground instead of straight to chassis. You cannot fix it from outside; you can only isolate it.',
  '<b>Optical isolation is the same idea for data.</b> A DMX opto-splitter converts to light and back, so the two sides share no conductor at all — which is why it survives a fixture that puts mains on its data line.',
])}

${S('Sensing position', 'Two kinds of encoder, and why the difference is a safety question', [
  'An encoder turns rotation into numbers, and there are two families that answer completely different questions.',
  'An <b>incremental</b> encoder produces pulses as it turns. Two channels, A and B, are offset a quarter cycle from each other, so which one leads tells you the direction and counting the edges tells you how far. It is cheap, precise and — crucially — it only knows <em>change</em>. Power it down and it has no idea where anything is. Power it back up and it starts counting from wherever it happens to be, believing that to be zero.',
  'An <b>absolute</b> encoder puts a unique code at every position, usually as concentric tracks read all at once. Ask it at any moment and it tells you where it actually is. Power-cycle it and it still knows, because the answer is written on the disc rather than accumulated in a counter.',
  'On a show that is not an efficiency question. An incremental system has to be <b>homed</b> — driven to a known reference — before it can be trusted, every time it loses power, and a machine that skips homing will happily drive a piece of scenery to a position it has calculated from a false zero. That is why automation uses absolute feedback for anything whose position matters, and why "we just power-cycled the rack" is a sentence a head of automation reacts to.',
])}

${fig(encFig, 'Left: pulses, and a count that starts at zero every time. Right: a code that is true the instant it powers up.')}

${rule('An incremental encoder knows <b>how far it moved</b>. An absolute encoder knows <b>where it is</b>. Anything that can hurt somebody should be told by the second kind.')}

${S('The family', 'Everything else is the same idea again', [
  'Once the pattern is visible, the rest of the sensor world stops needing memorising.',
  'A <b>load cell</b> is a piece of metal with strain gauges bonded to it: it deforms minutely under load, the gauges change resistance, and a bridge circuit turns that into a voltage. That is what tells a <a href="/hardware/kinesys-libra/">rigging monitor</a> what a point is really carrying.',
  'A <b>Hall sensor</b> gives a voltage in the presence of a magnetic field — used for limit switches, speed sensing and anything that must detect a passing magnet without touching it. A <b>photodiode</b> turns light into current, which is what is behind an opto-isolator, a smoke detector and a laser safety interlock. A <b>thermistor</b> or <b>thermocouple</b> turns temperature into resistance or voltage, and is inside every amplifier and dimmer that protects itself.',
  'And a loudspeaker is a microphone driven backwards, which is not a party trick — it is the same electromagnetic principle with the energy flowing the other way.',
  'Four questions answer all of them. <b>Does it need power?</b> <b>What is its full range, and what happens past it?</b> <b>What is its noise floor?</b> <b>Does it report an absolute value or a change?</b> Those four determine everything downstream, including how the system behaves when the sensor fails.',
])}

${bites([
  '<b>Ask what a sensor does when it fails, not just what it reads.</b> Reading zero, reading the last value and reading nothing at all are three very different failures for the thing consuming it.',
  '<b>Saturation is not the same as clipping.</b> A dynamic microphone in front of a kick drum is still linear where a condenser has already run out of headroom in its own electronics.',
  '<b>Every transducer has a noise floor</b>, and it sets the bottom of the system no matter how good everything after it is.',
  '<b>Calibration has a date on it.</b> An uncalibrated load reading is a number, not a measurement — the same is true of a sound level meter.',
])}

<div class="cta"><strong>Chasing a hum right now?</strong>
<p>Work outward: is it there with the input unplugged, with the cable in but the source off, with the source on. Each answer eliminates a section. And if the fix you are reaching for is a mains earth, stop — the <a href="/standards/">standards index</a> has the electrical safety documents, and this is the one place on this site where the shortcut is the dangerous one.</p></div>
`

  return shell({
    title: 'Turning the world into a voltage — microphones, isolation and encoders | showstack',
    description: 'Dynamic and condenser microphones as signal problems and what phantom power actually feeds; why a balanced line rejects interference; what a ground loop is and why the cure is isolation and never a lifted mains earth; and why an absolute encoder is a safety decision and an incremental one is not.',
    canonical: `${SITE}/learn/transducers/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Transducers, isolation and encoders',
      description: 'How microphones convert sound to voltage, common-mode rejection on balanced lines, ground loops and isolation, and absolute versus incremental position encoding.',
      url: `${SITE}/learn/transducers/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
