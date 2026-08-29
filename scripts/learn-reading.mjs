/**
 * /learn/reading/ — how a machine reads the world.
 *
 * A QR code that still scans with a hole punched in it, OCR that turns a
 * photographed page into text, a depth camera that builds a room out of
 * nothing but time-of-flight - three versions of the same three-step move:
 * capture something physical, find structure in it, then decide what the
 * structure means.
 *
 * The through-line the user asked for, and the right one: every single design
 * decision in here was made because of a *human* limitation, not a machine
 * one. QR codes have error correction because people put stickers on things.
 * Cameras have Bayer filters because we have three colour channels. Depth
 * scanners need registration because a person walks around holding one.
 *
 * The flagship question is the last section - how a scan stays aligned while
 * you are still taking it - because it is the one nobody explains and it is
 * where field work actually goes wrong.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

export function learnReadingPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* QR: finder patterns lock on, then damage is repaired */
@keyframes findpulse{0%,100%{stroke-opacity:.3}50%{stroke-opacity:1}}
.qrfig .finder{animation:findpulse 2.2s ease-in-out infinite}
@keyframes damage{0%,30%{opacity:0}40%,70%{opacity:1}82%,100%{opacity:0}}
@keyframes repair{0%,72%{opacity:0}82%,96%{opacity:1}100%{opacity:0}}
.qrfig .hole{animation:damage 4.4s ease-in-out infinite}
.qrfig .fixed{animation:repair 4.4s ease-in-out infinite}
/* OCR: the page narrows down to a line, a glyph, a guess */
@keyframes narrow{0%,10%{opacity:0}18%,40%{opacity:1}52%,100%{opacity:0}}
.ocrfig .st1{animation:narrow 6s ease-in-out infinite}
.ocrfig .st2{animation:narrow 6s ease-in-out infinite;animation-delay:1.5s}
.ocrfig .st3{animation:narrow 6s ease-in-out infinite;animation-delay:3s}
.ocrfig .st4{animation:narrow 6s ease-in-out infinite;animation-delay:4.5s}
/* time of flight: a pulse out, a pulse back */
@keyframes tof-out{0%{transform:translateX(0);opacity:0}8%{opacity:1}
44%{transform:translateX(var(--d,190px));opacity:1}50%,100%{opacity:0}}
@keyframes tof-back{0%,48%{transform:translateX(var(--d,190px));opacity:0}54%{opacity:1}
90%{transform:translateX(0);opacity:1}96%,100%{opacity:0}}
.toffig .out{animation:tof-out 2.4s linear infinite}
.toffig .back{animation:tof-back 2.4s linear infinite}
/* registration: two clouds sliding into agreement */
@keyframes settle{0%{transform:translate(26px,14px) rotate(5deg)}
70%,100%{transform:translate(0,0) rotate(0deg)}}
.regfig .cloudb{animation:settle 3.4s ease-in-out infinite;transform-origin:230px 90px}
@keyframes matchline{0%,20%{opacity:0}40%,80%{opacity:1}92%,100%{opacity:0}}
.regfig .link{animation:matchline 3.4s ease-in-out infinite}
/* drift: error accumulating, then a loop closure snapping it back */
@keyframes drift-grow{0%{transform:translateY(0)}80%{transform:translateY(-26px)}
88%,100%{transform:translateY(0)}}
@keyframes snap{0%,80%{opacity:0}88%,96%{opacity:1}100%{opacity:0}}
.driftfig .end{animation:drift-grow 4s ease-in-out infinite}
.driftfig .close{animation:snap 4s ease-in-out infinite}
/* sensor table */
.sens{width:100%;border-collapse:collapse;font-size:14.2px;margin:16px 0}
.sens th{text-align:left;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;
color:var(--dimmer);padding:0 12px 9px 0;border-bottom:1px solid var(--line);font-weight:400;white-space:nowrap}
.sens td{padding:12px 12px 12px 0;border-bottom:1px solid var(--line);vertical-align:top;color:var(--dim);line-height:1.55}
.sens td:first-child{color:var(--ink);white-space:nowrap}
.sens td:nth-child(2){font-family:var(--mono);font-size:11.5px;color:var(--accent2)}
.senswrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.senswrap .sens{min-width:700px}
/* three-step strip */
.steps3{display:grid;grid-template-columns:repeat(auto-fit,minmax(212px,1fr));gap:13px;margin:18px 0}
.steps3 > div{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:16px;
position:relative}
.steps3 .n{font-family:var(--mono);font-size:10.5px;letter-spacing:.7px;color:var(--accent);margin-bottom:8px;
display:block}
.steps3 h4{margin:0 0 7px;font-size:15px;font-family:var(--sans);text-transform:none;color:var(--ink);
letter-spacing:-.1px;font-weight:650}
.steps3 p{margin:0;color:var(--dim);font-size:13.6px;line-height:1.58}
`

  const qrFig = `
<svg viewBox="0 0 500 190" role="img" class="qrfig">
  ${[[24, 20], [130, 20], [24, 126]].map(([x, y]) => `
  <rect class="finder" x="${x}" y="${y}" width="44" height="44" fill="none" stroke="var(--accent)" stroke-width="4"/>
  <rect x="${x + 14}" y="${y + 14}" width="16" height="16" fill="var(--accent)"/>`).join('')}
  ${[...Array(64)].map((_, i) => {
    const c = i % 8, r = Math.floor(i / 8)
    const x = 78 + c * 12, y = 74 + r * 12
    if (x < 70 || y > 168) return ''
    return ((c * 5 + r * 3 + (c ^ r)) % 3) ? `<rect x="${x}" y="${y}" width="9" height="9" fill="var(--dim)" opacity=".7"/>` : ''
  }).join('')}
  <g class="hole"><rect x="96" y="86" width="52" height="46" rx="4" fill="var(--warn)" opacity=".85"/>
    <text x="122" y="114" font-size="10" font-family="var(--mono)" fill="var(--bg)" text-anchor="middle">torn</text></g>
  <g class="fixed"><rect x="96" y="86" width="52" height="46" rx="4" fill="none" stroke="var(--ok)" stroke-width="2"/>
    <text x="122" y="114" font-size="10" font-family="var(--mono)" fill="var(--ok)" text-anchor="middle">rebuilt</text></g>
  <text x="252" y="46" class="lbl" font-size="10" fill="var(--accent)">three finder patterns</text>
  <text x="252" y="62" class="lbl" font-size="9">orientation and scale, from any angle</text>
  <text x="252" y="96" class="lbl" font-size="10" fill="var(--ok)">Reed–Solomon redundancy</text>
  <text x="252" y="112" class="lbl" font-size="9">up to ~30% can be missing</text>
  <text x="252" y="126" class="lbl" font-size="9">and still be recoverable</text>
  <text x="252" y="160" class="lbl" font-size="9">because people damage things</text>
</svg>`

  const ocrFig = `
<svg viewBox="0 0 460 170" role="img" class="ocrfig">
  <g class="st1">
    <rect x="20" y="30" width="420" height="90" rx="6" fill="var(--panel)" stroke="var(--line)"/>
    ${[...Array(5)].map((_, i) => `<rect x="34" y="${42 + i * 15}" width="${380 - i * 40}" height="6" rx="3" fill="var(--dimmer)" opacity=".55"/>`).join('')}
    <text x="230" y="146" class="lbl" font-size="9.5" text-anchor="middle">1 — straighten the page and find the text blocks</text>
  </g>
  <g class="st2">
    <rect x="20" y="30" width="420" height="90" rx="6" fill="var(--panel)" stroke="var(--line)"/>
    <rect x="30" y="66" width="400" height="20" rx="4" fill="none" stroke="var(--accent)" stroke-width="1.8"/>
    <text x="230" y="146" class="lbl" font-size="9.5" text-anchor="middle">2 — cut it into lines, then into candidate glyphs</text>
  </g>
  <g class="st3">
    <rect x="20" y="30" width="420" height="90" rx="6" fill="var(--panel)" stroke="var(--line)"/>
    ${[...Array(9)].map((_, i) => `<rect x="${44 + i * 42}" y="60" width="30" height="32" rx="3" fill="none" stroke="var(--accent2)" stroke-width="1.4"/>`).join('')}
    <text x="230" y="146" class="lbl" font-size="9.5" text-anchor="middle">3 — classify each shape, with a confidence, not a certainty</text>
  </g>
  <g class="st4">
    <rect x="20" y="30" width="420" height="90" rx="6" fill="var(--panel)" stroke="var(--ok)" stroke-width="1.6"/>
    <text x="230" y="70" class="val" font-size="15" text-anchor="middle" fill="var(--ok)">rn → m ?  0 → O ?  l → 1 ?</text>
    <text x="230" y="98" class="lbl" font-size="10" text-anchor="middle">a language model breaks the ties</text>
    <text x="230" y="146" class="lbl" font-size="9.5" text-anchor="middle">4 — the shape is ambiguous; what a word can be is not</text>
  </g>
</svg>`

  const tofFig = `
<svg viewBox="0 0 460 150" role="img" class="toffig" style="--d:190px">
  <rect x="20" y="52" width="66" height="46" rx="6" fill="var(--panel)" stroke="var(--accent)"/>
  <text x="53" y="79" class="lbl" font-size="9" text-anchor="middle">emitter</text>
  <rect x="378" y="30" width="18" height="90" rx="3" fill="var(--dimmer)" opacity=".5"/>
  <text x="387" y="140" class="lbl" font-size="9" text-anchor="middle">surface</text>
  <g class="out"><circle cx="98" cy="66" r="5" fill="var(--accent)"/></g>
  <g class="back"><circle cx="98" cy="86" r="5" fill="var(--accent2)"/></g>
  <text x="230" y="20" class="lbl" font-size="9.5" text-anchor="middle">distance = (time out and back ÷ 2) × the speed of whatever you sent</text>
  <text x="230" y="126" class="lbl" font-size="9.5" text-anchor="middle">light, sound or radio — only the speed changes</text>
</svg>`

  const regFig = `
<svg viewBox="0 0 460 180" role="img" class="regfig">
  ${[...Array(9)].map((_, i) => {
    const x = 150 + (i % 3) * 34, y = 54 + Math.floor(i / 3) * 34
    return `<circle cx="${x}" cy="${y}" r="4" fill="var(--accent)"/>`
  }).join('')}
  <g class="cloudb">
    ${[...Array(9)].map((_, i) => {
      const x = 150 + (i % 3) * 34, y = 54 + Math.floor(i / 3) * 34
      return `<circle cx="${x + 4}" cy="${y + 3}" r="4" fill="var(--accent2)" opacity=".85"/>`
    }).join('')}
  </g>
  <g class="link">${[0, 4, 8].map((i) => {
    const x = 150 + (i % 3) * 34, y = 54 + Math.floor(i / 3) * 34
    return `<line x1="${x}" y1="${y}" x2="${x + 4}" y2="${y + 3}" stroke="var(--ok)" stroke-width="1.6"/>`
  }).join('')}</g>
  <text x="312" y="66" class="lbl" font-size="10" fill="var(--accent)">scan A</text>
  <text x="312" y="86" class="lbl" font-size="9" fill="var(--accent2)">scan B, from elsewhere</text>
  <text x="312" y="112" class="lbl" font-size="9">find shared points,</text>
  <text x="312" y="126" class="lbl" font-size="9">then solve for the</text>
  <text x="312" y="140" class="lbl" font-size="9">move that agrees</text>
  <text x="230" y="170" class="lbl" font-size="9.5" text-anchor="middle">registration: two clouds, one transform</text>
</svg>`

  const driftFig = `
<svg viewBox="0 0 460 160" role="img" class="driftfig">
  <path d="M40 110 L120 92 L200 100 L280 84 L360 96" fill="none" stroke="var(--dimmer)" stroke-width="1.6" stroke-dasharray="4 5"/>
  <circle cx="40" cy="110" r="6" fill="var(--accent)"/>
  <text x="40" y="132" class="lbl" font-size="9" text-anchor="middle">start</text>
  <g class="end"><circle cx="360" cy="96" r="6" fill="var(--warn)"/></g>
  <text x="360" y="132" class="lbl" font-size="9" text-anchor="middle">back where you began</text>
  <g class="close">
    <path d="M360 96 L44 110" stroke="var(--ok)" stroke-width="1.8" stroke-dasharray="3 4"/>
    <text x="200" y="146" class="lbl" font-size="9.5" text-anchor="middle" fill="var(--ok)">loop closure — the whole path is corrected at once</text>
  </g>
  <text x="230" y="26" class="lbl" font-size="9.5" text-anchor="middle">every step adds a little error, and the errors add up</text>
  <text x="230" y="42" class="lbl" font-size="9.5" text-anchor="middle">until you recognise somewhere you have already been</text>
</svg>`

  const SN = (a, b, c, d) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td><td>${d}</td></tr>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / reading</div>
${learnNav(esc, 'reading')}
<div class="lhero">
  <h2>How a machine reads the world</h2>
  <p class="lede">A QR code that still scans with a hole in it. OCR that turns a photographed page into text. A camera that builds a room out of nothing but the time light takes to come back. Three versions of the same three-step move — and every design decision in them was made because of a <em>human</em> limitation, not a machine one.</p>
</div>

${S('The shape of it', 'Capture, find structure, decide what it means', [
  'Every machine-reading system is these three steps. When one fails, it fails at one of them, and knowing which saves an enormous amount of guessing.',
])}

<div class="steps3">
  <div><span class="n">01</span><h4>Capture</h4><p>A transducer turns something physical into numbers — photons into charge, an echo into a time, pressure into a resistance. Everything downstream is limited by what this step actually recorded.</p></div>
  <div><span class="n">02</span><h4>Find structure</h4><p>Edges, corners, regions, repeated patterns, planes. Nothing here understands anything yet; it is finding the parts that are not noise.</p></div>
  <div><span class="n">03</span><h4>Decide</h4><p>Match that structure against what is expected — a code layout, a set of glyph shapes, a learned model. This step always outputs a confidence, never a certainty, whatever the interface shows you.</p></div>
</div>

${S('The one in everybody\'s pocket', 'Why a QR code survives being damaged', [
  'A QR code is engineered almost entirely around the fact that a person will point a phone at it badly, from an angle, in poor light, after something has been spilled on it.',
  'The three big squares in the corners are <b>finder patterns</b>. They exist so that a scanner can locate the code anywhere in a frame, work out its rotation, and correct for the perspective of holding a phone at an angle — all before reading a single data bit. A fourth, smaller <b>alignment pattern</b> corrects for the paper being curved.',
  'The data itself is stored with <b>Reed–Solomon error correction</b> — real forward error correction, of the kind on the <a href="/learn/encoding/">encoding page</a>. At the highest correction level roughly <b>30% of the code can be missing or wrong</b> and the original data is still recoverable, not guessed. That is why a code with a logo pasted over the middle of it still scans, and why a torn poster still works.',
  'The pattern of light and dark is also deliberately <em>masked</em> — XORed with one of several fixed patterns, chosen at encoding time — so that the result has no large blank areas that would confuse the scanner. None of this is about storing more data. All of it is about a human being holding a camera.',
])}

${fig(qrFig, 'Finder patterns give orientation. Reed–Solomon gives forgiveness. Both exist because of people.')}

${rule('A QR code is <b>error correction wearing a picture</b>. It is not that scanners are clever about damage — it is that the redundancy to rebuild the damaged part was printed alongside it.')}

${S('The older one', 'What OCR is actually doing', [
  'Turning a photograph of a page into text is four separate problems, and modern systems still do them in roughly this order even when a single neural network is handling several at once.',
  '<b>Straighten and find the text.</b> Correct the skew and perspective, separate text from images and background, identify blocks and their reading order. A two-column page read as one column produces perfect character recognition and unusable output.',
  '<b>Segment.</b> Cut blocks into lines, lines into words, words into candidate glyphs. Touching or broken characters are where this goes wrong, which is why photocopies are harder than scans.',
  '<b>Classify.</b> Decide what each shape most likely is. Older systems compared extracted features against templates; modern ones run a trained network. Either way the output is a ranked list with confidences, not an answer.',
  '<b>Use language.</b> This is the step people forget and it does most of the heavy lifting. <em>rn</em> and <em>m</em> are nearly identical shapes; so are 0 and O, 1 and l, 5 and S. The shape genuinely is ambiguous. What resolves it is a model of what words and number formats are possible — which is why OCR on a normal sentence is far better than OCR on a serial number, where there is no language to lean on.',
])}

${fig(ocrFig, 'Four steps. The last one is where most of the accuracy comes from.')}

${bites([
  '<b>OCR confidence is data.</b> A good engine tells you how sure it was per character. Throwing that away and keeping only the text discards the most useful thing it produced.',
  '<b>Serial numbers and codes are the hard case, not the easy one.</b> No language model can help, so the shape has to carry the whole decision. This is exactly why barcodes and QR codes exist.',
  '<b>Handwriting is a different problem</b>, not a harder version of the same one — there is no fixed glyph set to match against.',
])}

${S('', 'How much of a code can you lose?', [
  'Reed–Solomon redundancy is a dial, not a constant. Higher correction survives more damage and leaves less room for data in the same physical size.',
])}

<div class="dial">
  <div class="d" style="flex:0 0 auto"><label>correction level</label>
    <span class="seg" role="group" id="qr-seg">
      <button type="button" data-l="L" aria-pressed="false">L</button>
      <button type="button" data-l="M" aria-pressed="true">M</button>
      <button type="button" data-l="Q" aria-pressed="false">Q</button>
      <button type="button" data-l="H" aria-pressed="false">H</button>
    </span></div>
  <div class="d"><label for="qr-dam">damage to the code <b id="qr-damv">12%</b></label>
    <input id="qr-dam" type="range" min="0" max="45" step="1" value="12"></div>
</div>
<div class="fig" data-driven="dial" style="padding:16px">
  <div id="qr-grid" style="display:grid;grid-template-columns:repeat(21,1fr);gap:2px;max-width:320px;margin:0 auto"></div>
</div>
<div class="verdict" id="qr-out"></div>

${S('Distance', 'Every rangefinder is one of four principles', [
  'Anything that measures how far away something is uses one of a small number of tricks, and knowing which one a device uses tells you immediately where it will fail.',
])}

<div class="senswrap">
<table class="sens">
  <thead><tr><th>Type</th><th>Principle</th><th>How it works</th><th>Where it fails</th></tr></thead>
  <tbody>
    ${SN('Ultrasonic', 'time of flight', 'Emit a chirp, time the echo, divide by two, multiply by the speed of sound.', 'Soft or angled surfaces absorb or deflect the echo. The speed of sound changes with temperature, so an uncompensated sensor drifts across a day.')}
    ${SN('Infrared, reflective', 'reflected intensity', 'Shine IR, measure how much comes back. More light means closer.', 'A dark object nearby and a light object further away look identical. Sunlight swamps it. It is a presence detector wearing a distance sensor\'s clothes.')}
    ${SN('Infrared, break-beam', 'occlusion', 'An emitter and a receiver facing each other. Something crosses, the beam breaks.', 'Utterly reliable and gives no distance at all. The standard trigger for an effect, a counter, or a safety edge.')}
    ${SN('PIR', 'change in heat', 'A pyroelectric element sees change in infrared radiation across a segmented lens. Movement of a warm body registers.', 'It detects <em>change</em>, not presence. Stand perfectly still and it forgets you exist — which is why corridor lights go out on people.')}
    ${SN('Laser / lidar', 'time of flight or phase', 'A pulsed or modulated laser, timed or phase-compared on return. Millimetres over hundreds of metres, into <a href="/software/rhino-3d/">Rhino</a>, <a href="/software/blender/">Blender</a> or <a href="/software/vectorworks-spotlight/">Vectorworks</a>. Survey-grade scanners feed <a href="/software/rhino-3d/">Rhino</a>, <a href="/software/blender/">Blender</a> and <a href="/software/vectorworks-spotlight/">Vectorworks</a>.', 'Glass, mirrors, water and very dark matt surfaces. Haze and smoke, which is a genuine issue in this industry.')}
    ${SN('Radar / mmWave', 'radio time of flight', 'Radio instead of light, so it sees through fabric, plastic and darkness. Doppler also gives velocity directly.', 'Coarser than lidar, and metal in the environment reflects enthusiastically.')}
    ${SN('Inductive', 'field disturbance', 'An oscillating coil is damped by nearby metal.', 'Metal only, and only a few millimetres. The industrial standard for machine position sensing.')}
    ${SN('Capacitive', 'change in capacitance', 'The object becomes part of a capacitor. Works on almost any material, including through a panel.', 'Humidity, dirt and anything else with a dielectric constant. This is also how a touchscreen and a pressure mat work.')}
  </tbody>
</table>
</div>

${fig(tofFig, 'Time of flight, whatever you send. Only the speed in the arithmetic changes.')}

${S('Two sensors worth pulling apart', 'A pressure mat and an image sensor', [
  '<b>A pressure mat</b> is usually one of three things. A <em>resistive</em> mat has two conductive layers separated by a spacer; standing on it presses them together and the resistance drops. A <em>piezoelectric</em> element generates a voltage when it is deformed — which means it senses the <em>change</em>, not the standing weight, so it detects a footfall and then reports nothing. A <em>capacitive</em> mat senses a body altering an electric field, works through a floor covering, and is the same physics as a touchscreen. Which one you have decides whether it can tell you somebody is still standing there.',
  '<b>An image sensor</b> is a grid of photodiodes, each accumulating charge in proportion to the light landing on it during the exposure. Two things about it matter constantly on a show. First, it is colour-blind: colour comes from a <b>Bayer filter</b>, a mosaic of red, green and blue filters over the pixels, with twice as many green because human vision is most sensitive there — the full-colour image is then interpolated. That is the same three-channel approximation of human vision behind <a href="/learn/perception/">metamerism</a>.',
  'Second, the <b>shutter</b>. A <em>rolling</em> shutter reads the sensor row by row, so different parts of the frame are captured at different instants — which is why fast pans skew and why LED lighting and screens produce banding. A <em>global</em> shutter captures every pixel at the same moment and costs more. On a camera stage this is not a photography detail, it is the whole reason <a href="/learn/systems/">genlock</a> exists.',
])}

${S('The hard one', 'Depth cameras, point clouds, and staying aligned while you scan', [
  'A depth camera returns a distance per pixel, by one of three methods. <b>Stereo</b> uses two lenses and triangulates from the disparity between them — cheap, and it needs texture to match on, so a blank white wall defeats it. <b>Structured light</b> projects a known pattern and reads how the pattern deforms across the surface — very precise up close, and useless in sunlight. <b>Time of flight</b> measures the return time of modulated light per pixel — robust and longer range, with lower spatial detail.',
  'The output is a <b>point cloud</b>: a large set of 3D coordinates, and nothing else. No surfaces, no objects, no meaning. Turning it into a mesh is a separate step, and turning that into something a CAD package can use is another.',
  'And here is the problem nobody warns you about. A single scan only sees what is in front of it. To capture a room you take many, from many positions — and every one of them is in <em>its own</em> coordinate system, with its origin at the scanner. Making them into one model means finding the transform that puts each into a shared frame. That is <b>registration</b>, and it is the whole job — and it is the same coordinate-agreement problem that <a href="/protocols/psn/">PSN</a> and <a href="/protocols/rttrpm/">RTTrPM</a> carry the results of.',
])}

${fig(regFig, 'Two clouds of the same place from different positions. Registration is solving for the move that makes them agree.')}

${S('', 'How registration is actually done in the field', [
  '<b>Targets.</b> Place spheres, checkerboards or reflective markers around the space and make sure several appear in every scan. The software finds them, matches them between scans, and solves the transform exactly. Slow to set up, and the most reliable method there is — which is why survey-grade work still does it.',
  '<b>Cloud-to-cloud (ICP).</b> Iterative Closest Point: guess a transform, pair each point with its nearest neighbour in the other cloud, compute the move that reduces the total distance, repeat. It converges beautifully when the scans overlap well and there is real geometric variety, and it fails in exactly the environments this industry works in — long featureless corridors, a black box studio, a flat empty floor. A shape with nothing distinctive in it has many equally good alignments.',
  '<b>Feature matching.</b> Find distinctive local structures — corners, edges, planes — and match those instead of raw points. Faster and more robust than raw ICP, and still dependent on there being features to find.',
  '<b>SLAM.</b> On a handheld or moving scanner, the device is building the map and tracking its own position in it at the same time — simultaneous localisation and mapping — usually fusing an inertial sensor with the visual or lidar data so that fast movement does not lose the thread. This is the same machinery as an <a href="/learn/systems/">inside-out tracked headset</a>.',
])}

${S('', 'Drift, and the moment it gets fixed', [
  'Every registration is slightly wrong. Chain a hundred of them together walking around a building and those small errors accumulate — the far end of the scan is metres out of place, and nothing in the data itself has flagged a problem. This is <b>drift</b>, and it is the characteristic failure of any system that builds a map by adding to it.',
  'The cure is <b>loop closure</b>. Return to somewhere already scanned and recognise it. Now there are two versions of the same place that ought to coincide, and the mismatch between them measures the total accumulated error. That measurement can be distributed backwards across the whole path, correcting everything at once.',
  'Which gives the single most useful piece of field advice about 3D capture: <b>close your loops</b>. Walk a circuit and come back through somewhere you have already been rather than scanning out and stopping. And in a feature-poor space — an empty black box, a bare arena floor — put targets out, because neither ICP nor SLAM can align geometry that has nothing to distinguish one part from another.',
])}

${fig(driftFig, 'Error accumulates silently. Recognising somewhere you have been is what lets it be removed.')}

${bites([
  '<b>Scan overlap is the number that decides success.</b> Aim for a generous overlap between adjacent positions; scans that only just touch will register badly and you will not know until you are back at the office.',
  '<b>A point cloud is not a model.</b> It is a measurement. Somebody still has to decide what is a wall, what is a truss and what is a passing crew member.',
  '<b>Moving objects poison a scan.</b> People walking through appear as smeared ghost geometry. Scan an empty room, or accept the cleanup.',
  '<b>Check a known dimension immediately.</b> A registered scan can be internally consistent and globally wrong. Measure something you know with a tape and compare.',
  '<b>Reflective and transparent surfaces lie.</b> Mirrors produce a room that does not exist; glass produces nothing at all. Mask them or mark them at capture time.',
])}

${xnote('Every sensing decision here is a decision about what a space can notice about a person — and a space that notices you is the difference between an installation you look at and one you are inside. <b>Plausibility, not resolution</b>, is what a sensor buys.')}

${S('The point', 'All of it is built around us', [
  'It is tempting to read this page as a list of clever machine tricks. It is closer to the opposite.',
  'A QR code has 30% redundancy because a person will damage it. It has finder patterns because a person holds a phone crooked. An image sensor has three colour channels because <em>we</em> have three. It has more green pixels because we are most sensitive to green. OCR leans on a language model because the shapes alone are genuinely ambiguous — and the ambiguity is only resolvable because human writing is predictable.',
  'And a 3D scanner needs registration and loop closure because a person carries it around a room on foot, in an order that made sense to them at the time.',
  'None of these are machines perceiving the world. They are tools shaped around a person perceiving it — which is the same claim the <a href="/learn/perception/">perception</a> and <a href="/learn/neuro/">neuro</a> pages make from the other direction, and the reason this stage of the site sits after that one rather than before it.',
])}

<div class="cta"><strong>Doing capture work on shows?</strong>
<p>Scanner behaviour in venues — haze, black surfaces, moving crew, truss geometry — is badly documented because it is nobody\'s core market. If you have field experience of what does and does not register in a theatre or arena, <a href="${GH}/issues/new?labels=tooling&amp;title=reading%3A+">open an issue</a>. That is exactly the knowledge this site exists to hold.</p></div>

<script>
(function(){
  var seg=document.getElementById('qr-seg'); if(!seg) return;
  var dam=document.getElementById('qr-dam'), damv=document.getElementById('qr-damv'),
      grid=document.getElementById('qr-grid'), out=document.getElementById('qr-out');
  var CAP={L:7,M:15,Q:25,H:30}, level='M', N=21, cells=[];
  for(var i=0;i<N*N;i++){var e=document.createElement('i');e.style.cssText='display:block;aspect-ratio:1;border-radius:1px';grid.appendChild(e);cells.push(e)}
  function rnd(s){var x=Math.sin(s)*10000;return x-Math.floor(x)}
  function finder(c,r){
    for (var f of [[0,0],[14,0],[0,14]]) if(c>=f[0]&&c<f[0]+7&&r>=f[1]&&r<f[1]+7) return true;
    return false;
  }
  function draw(){
    var d=Number(dam.value); damv.textContent=d+'%';
    for(var b of seg.querySelectorAll('button')) b.setAttribute('aria-pressed',String(b.dataset.l===level));
    for(var r=0;r<N;r++) for(var c=0;c<N;c++){
      var i=r*N+c, on = finder(c,r) ? ((c%7===0||r%7===0||(c%7>1&&c%7<5&&r%7>1&&r%7<5)) ) : rnd(i*7.31)>0.5;
      var damaged = rnd(i*3.77+900) < d/100;
      cells[i].style.background = damaged ? 'var(--warn)' : (on ? 'var(--ink)' : 'var(--panel2)');
      cells[i].style.opacity = damaged ? '.85' : '1';
    }
    var cap=CAP[level];
    out.innerHTML = d<=cap
      ? '<span class="ok">Still scans.</span> '+d+'% damaged, level '+level+' recovers up to about <b>'+cap+
        '%</b>. The redundancy to rebuild that area was printed alongside it.'
      : '<span class="err">Gone.</span> '+d+'% damaged is past what level '+level+' can rebuild (about <b>'+cap+
        '%</b>). Higher correction would survive it, at the cost of data capacity in the same physical size.';
  }
  seg.addEventListener('click',function(e){var b=e.target.closest('button'); if(b){level=b.dataset.l;draw()}});
  dam.addEventListener('input',draw); draw();
})();
</script>
`

  return shell({
    title: 'How a machine reads the world — QR, OCR, depth cameras and 3D scanning | showstack',
    description: 'Why a QR code survives damage, what OCR is really doing and why a language model does most of the work, the four principles behind every distance sensor, how pressure mats and image sensors work, and how point clouds are registered and kept aligned in the field with targets, ICP, SLAM and loop closure.',
    canonical: `${SITE}/learn/reading/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Machine vision: codes, OCR, distance sensing and 3D capture',
      description: 'QR error correction, OCR pipelines, ultrasonic, infrared, PIR, lidar, radar, inductive and capacitive sensing, depth cameras, point clouds, registration, SLAM and loop closure.',
      url: `${SITE}/learn/reading/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
