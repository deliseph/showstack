/**
 * /learn/colour/ — how a colour becomes a number, and back again.
 *
 * Starts with the question people actually ask - what is #ffffff - because
 * the honest answer opens the whole subject: it is three bytes written in
 * base 16, and they are the same three bytes a console sends an RGB fixture.
 * Once that lands, hex, DMX and video code values stop being three subjects.
 *
 * The load-bearing idea is that the numbers are NOT linear light. Gamma
 * encoding exists because human brightness perception is roughly
 * logarithmic, and almost every practical video problem on a show - banding,
 * a blend that looks wrong, a dim LED wall that steps - comes from somebody
 * treating a code value as though it were light.
 *
 * Ends where /learn/bits/ ends, deliberately: the digital part is a detour
 * between two analogue events.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

export function learnColourPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* three bytes, lit one at a time */
@keyframes byteon{0%,100%{opacity:.3}18%,40%{opacity:1}}
.hexfig .b1{animation:byteon 4.5s ease-in-out infinite}
.hexfig .b2{animation:byteon 4.5s ease-in-out infinite;animation-delay:1.5s}
.hexfig .b3{animation:byteon 4.5s ease-in-out infinite;animation-delay:3s}
/* the capture and display round trip */
@keyframes rt{0%{offset-distance:0%}100%{offset-distance:100%}}
@keyframes stepon{0%,100%{opacity:.32}}
${[...Array(8)].map((_, i) => `.rtfig .r${i}{animation:byteon 7.2s ease-in-out infinite;animation-delay:${(i * 0.85).toFixed(2)}s}`).join('')}
/* PWM making a grey out of a full-brightness LED */
@keyframes pwm{0%,var(--duty,50%){opacity:1}calc(var(--duty,50%) + 0.1%),100%{opacity:.08}}
.pwmfig .lit{animation:l-breathe 1.2s ease-in-out infinite}
@keyframes march{from{transform:translateX(0)}to{transform:translateX(-48px)}}
.pwmfig .train{animation:march 1.4s linear infinite}
/* the colour tools */
.swatch{height:74px;border-radius:var(--r-md);border:1px solid var(--line);margin-top:12px;
transition:background .12s}
.chanbars{display:grid;gap:8px;margin-top:12px}
.chanrow{display:grid;grid-template-columns:22px 1fr auto;gap:10px;align-items:center;
font-family:var(--mono);font-size:12px}
.chanrow .t{color:var(--dimmer)}
.chanrow .bar{height:12px;border-radius:6px;background:var(--panel2);overflow:hidden}
.chanrow .bar i{display:block;height:100%;border-radius:6px;transition:width .12s}
.chanrow .v{color:var(--accent2);min-width:118px;text-align:right}
.hexin{font-family:var(--mono);font-size:16px;letter-spacing:1px;padding:10px 12px;background:var(--panel);
color:var(--ink);border:1px solid var(--line);border-radius:8px;width:150px;min-height:44px}
/* gradient strips for bit depth and gamma */
.strip{height:52px;border-radius:var(--r-sm);border:1px solid var(--line);margin-top:10px;
display:flex;overflow:hidden}
.strip i{flex:1 1 0;min-width:0}
.striplab{display:flex;justify-content:space-between;font-family:var(--mono);font-size:10.5px;
color:var(--dimmer);margin-top:6px}
/* the gamma curve */
.curvebox{margin-top:14px;padding:14px;background:var(--panel);border:1px solid var(--line);
border-radius:var(--r-md)}
.curvebox svg{display:block;width:100%;height:auto;max-width:420px;margin:0 auto}
/* subsampling grids */
.subgrids{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:14px;margin:16px 0}
.subgrids > div{background:var(--panel);border:1px solid var(--line);border-radius:var(--r-md);padding:14px}
.subgrids h5{margin:0 0 4px;font-family:var(--mono);font-size:12.5px;color:var(--accent)}
.subgrids .why{font-family:var(--mono);font-size:10.5px;color:var(--dimmer);margin:0 0 10px}
.ssgrid{display:grid;grid-template-columns:repeat(8,1fr);gap:1px}
.ssgrid i{aspect-ratio:1;border-radius:1px}
.subgrids p{margin:10px 0 0;font-size:13px;color:var(--dim);line-height:1.5}
/* colour space table */
.csp{width:100%;border-collapse:collapse;font-size:14.2px;margin:16px 0}
.csp th{text-align:left;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;
color:var(--dimmer);padding:0 12px 9px 0;border-bottom:1px solid var(--line);font-weight:400;white-space:nowrap}
.csp td{padding:12px 12px 12px 0;border-bottom:1px solid var(--line);vertical-align:top;color:var(--dim);line-height:1.55}
.csp td:first-child{color:var(--ink);font-family:var(--mono);font-size:12.5px;white-space:nowrap}
.cspwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.cspwrap .csp{min-width:620px}
`

  const hexFig = `
<svg viewBox="0 0 620 180" role="img" class="hexfig">
  <text x="310" y="22" class="val" font-size="22" text-anchor="middle" font-family="var(--mono)">#
    <tspan class="b1" fill="#e05c5c">ff</tspan><tspan class="b2" fill="#6ec96e">88</tspan><tspan class="b3" fill="#6e9ce0">00</tspan></text>
  ${[
    ['b1', 'ff', 'red', 255, 60, '#e05c5c'],
    ['b2', '88', 'green', 136, 250, '#6ec96e'],
    ['b3', '00', 'blue', 0, 440, '#6e9ce0'],
  ].map(([c, hx, name, dec, x, col]) => `
  <g class="${c}">
    <rect x="${x}" y="52" width="120" height="76" rx="8" fill="var(--panel)" stroke="${col}" stroke-width="1.6"/>
    <text x="${x + 60}" y="76" class="lbl" font-size="9.5" text-anchor="middle">${name}</text>
    <text x="${x + 60}" y="99" class="val" font-size="17" text-anchor="middle" fill="${col}" font-family="var(--mono)">${hx}</text>
    <text x="${x + 60}" y="119" class="lbl" font-size="10" text-anchor="middle">= ${dec} = DMX ${dec}</text>
  </g>`).join('')}
  <text x="310" y="152" class="lbl" font-size="9.5" text-anchor="middle">one byte per channel, and one byte is exactly two hex digits</text>
  <text x="310" y="170" class="lbl" font-size="9.5" text-anchor="middle">which is the entire reason colours are written in base 16 rather than base 10</text>
</svg>`

  const rtFig = `
<svg viewBox="0 0 620 210" role="img" class="rtfig">
  ${[
    ['photons hit a sensor', 24, 26, 'var(--accent2)'],
    ['charge → voltage', 24, 62, 'var(--accent2)'],
    ['ADC → linear numbers', 24, 98, 'var(--accent2)'],
    ['debayer, colour transform, gamma encode', 24, 134, 'var(--accent2)'],
  ].map(([t, x, y, c], i) => `
  <g class="r${i}"><rect x="${x}" y="${y}" width="250" height="28" rx="6" fill="var(--panel)" stroke="${c}"/>
    <text x="${x + 12}" y="${y + 18}" class="lbl" font-size="9.5">${t}</text></g>`).join('')}
  ${[
    ['decode the transfer function', 346, 26, 'var(--accent)'],
    ['map to the display’s primaries', 346, 62, 'var(--accent)'],
    ['drive an emitter — PWM, or a mirror', 346, 98, 'var(--accent)'],
    ['photons leave, and hit an eye', 346, 134, 'var(--accent)'],
  ].map(([t, x, y, c], i) => `
  <g class="r${i + 4}"><rect x="${x}" y="${y}" width="250" height="28" rx="6" fill="var(--panel)" stroke="${c}"/>
    <text x="${x + 12}" y="${y + 18}" class="lbl" font-size="9.5">${t}</text></g>`).join('')}
  <text x="149" y="182" class="lbl" font-size="10" text-anchor="middle" fill="var(--accent2)">CAPTURE</text>
  <text x="471" y="182" class="lbl" font-size="10" text-anchor="middle" fill="var(--accent)">DISPLAY</text>
  <path d="M282 84 L338 84" stroke="var(--dimmer)" stroke-width="1.4" stroke-dasharray="3 4"/>
  <text x="310" y="76" class="lbl" font-size="9" text-anchor="middle">numbers</text>
  <text x="310" y="204" class="lbl" font-size="9.5" text-anchor="middle">it is analogue at both ends — the digital part is the detour in the middle</text>
</svg>`

  const pwmFig = `
<svg viewBox="0 0 460 160" role="img" class="pwmfig">
  <clipPath id="pwmclip"><rect x="24" y="34" width="290" height="44"/></clipPath>
  <g clip-path="url(#pwmclip)"><g class="train">
    ${[...Array(14)].map((_, i) => `<rect x="${26 + i * 48}" y="38" width="17" height="36" rx="2" fill="var(--accent)"/>`).join('')}
  </g></g>
  <rect x="24" y="34" width="290" height="44" rx="4" fill="none" stroke="var(--line)"/>
  <text x="169" y="98" class="lbl" font-size="9.5" text-anchor="middle">the LED is only ever fully on or fully off</text>
  <circle class="lit" cx="386" cy="56" r="22" fill="var(--accent)" opacity=".55"/>
  <text x="386" y="98" class="lbl" font-size="9.5" text-anchor="middle">the eye averages it into a level</text>
  <text x="230" y="128" class="lbl" font-size="9.5" text-anchor="middle">grayscale depth is how many on/off ratios the driver can make</text>
  <text x="230" y="146" class="lbl" font-size="9.5" text-anchor="middle">refresh rate is how fast it repeats them — and a camera can see both</text>
</svg>`

  const C = (a, b, c) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / colour</div>
${learnNav(esc, 'colour')}
<div class="lhero">
  <h2>How a colour becomes a number</h2>
  <p class="lede">Start with the question everybody actually asks. <code>#ffffff</code> is not a colour name — it is three bytes written in base 16, and they are the same three bytes a console sends to an RGB fixture. Once that lands, hex codes, DMX values and video code words stop being three separate subjects.</p>
</div>

${S('The direct answer', 'What #ffffff actually is', [
  'Three channels — red, green, blue — one byte each. A byte holds 0 to 255, and <b>one byte is exactly two hexadecimal digits</b>, which is the entire reason colours are written in base 16 rather than base 10: <code>ff</code> is unambiguous and two characters wide, where 255 is three characters and needs separators.',
  'So <code>#ff8800</code> is red 255, green 136, blue 0. Send those same three numbers down a lighting universe to an RGB fixture and you get the same instruction. A web colour and a DMX value are the same object arriving by different routes.',
  '<code>#fff</code> is shorthand: each digit is doubled, so it expands to <code>#ffffff</code>. And <code>#ffffff</code> is every channel at maximum, which is why it is white — not because white is a colour, but because it is all three primaries at full.',
])}

${fig(hexFig, 'One byte per channel. Two hex digits per byte. The same numbers a fixture receives.')}

<div class="dial">
  <div class="d" style="flex:0 0 auto"><label for="hx-in">type a hex code</label>
    <input id="hx-in" class="hexin" type="text" value="#ff8800" spellcheck="false" autocomplete="off"></div>
  <div class="d"><label for="hx-r">red <b id="hx-rv">255</b></label><input id="hx-r" type="range" min="0" max="255" value="255"></div>
  <div class="d"><label for="hx-g">green <b id="hx-gv">136</b></label><input id="hx-g" type="range" min="0" max="255" value="136"></div>
  <div class="d"><label for="hx-b">blue <b id="hx-bv">0</b></label><input id="hx-b" type="range" min="0" max="255" value="0"></div>
</div>
<div class="swatch" id="hx-swatch" aria-hidden="true"></div>
<div class="chanbars" id="hx-bars" aria-hidden="true"></div>
<div class="verdict" id="hx-out"></div>

${S('Why 255 and not 100', 'Bit depth, again', [
  'Eight bits per channel gives 256 levels; three channels gives about 16.7 million combinations. That is 16.7 million <em>codes</em>, not 16.7 million distinguishable colours — the two are frequently confused in marketing.',
  'Ten bits gives 1024 levels per channel and a bit over a billion codes. The reason to want that is not richer colour; it is <b>gradients</b>. A slow fade to black, a soft sky, a subtle wash across a large LED wall — these are where 256 steps become visible as bands, and where a large surface makes each step physically wide.',
  'This is the same fact as <a href="/learn/bits/">bit depth in audio</a> and <a href="/learn/bits/">16-bit fixture control</a>: resolution buys you steps small enough that nobody can see the join, and past that it buys storage.',
])}

<div class="dial">
  <div class="d"><label for="bd-b">bits per channel <b id="bd-bv">8</b></label>
    <input id="bd-b" type="range" min="2" max="10" step="1" value="8"></div>
</div>
<div class="strip" id="bd-strip" aria-hidden="true"></div>
<div class="striplab"><span>black</span><span id="bd-steps"></span><span>white</span></div>
<div class="verdict" id="bd-out"></div>

${S('The thing that surprises everyone', 'The numbers are not linear light', [
  'Half the code value is not half the light. Feed 128 out of 255 into a normal display and you get roughly <b>22%</b> of the brightness of 255, not 50%.',
  'That is deliberate. Human brightness perception is roughly logarithmic — we can distinguish far more steps in the dark than in the light, which is the <a href="/learn/perception/">dark adaptation</a> story from the other side. If you spent 256 codes evenly on linear light, almost all of them would be wasted at the bright end where nobody can tell them apart, and the dark end would band horribly. So a <b>transfer function</b> is applied before storage that distributes the codes to match perception.',
  'It is perceptual compression, and it is the only reason 8-bit video is watchable at all. It is also the source of a whole family of faults.',
])}

<div class="dial">
  <div class="d"><label for="gm-c">code value <b id="gm-cv">128</b></label>
    <input id="gm-c" type="range" min="0" max="255" value="128"></div>
  <div class="d"><label for="gm-g">gamma <b id="gm-gv">2.2</b></label>
    <input id="gm-g" type="range" min="10" max="30" step="1" value="22"></div>
</div>
<div class="curvebox">
  <svg viewBox="0 0 300 200" role="img" aria-label="Code value against relative light">
    <line x1="30" y1="170" x2="285" y2="170" stroke="var(--line)"/>
    <line x1="30" y1="170" x2="30" y2="15" stroke="var(--line)"/>
    <path d="M30 170 L285 15" fill="none" stroke="var(--dimmer)" stroke-width="1.2" stroke-dasharray="4 5"/>
    <path id="gm-curve" fill="none" stroke="var(--accent)" stroke-width="2.4"/>
    <circle id="gm-dot" r="6" fill="var(--accent2)"/>
    <text x="157" y="192" class="lbl" font-size="9.5" text-anchor="middle">code value →</text>
    <text x="14" y="95" class="lbl" font-size="9.5" text-anchor="middle" transform="rotate(-90 14 95)">light →</text>
    <text x="278" y="30" class="lbl" font-size="8.5" text-anchor="end" fill="var(--dimmer)">linear</text>
  </svg>
</div>
<div class="verdict" id="gm-out"></div>

${bites([
  '<b>Cross-fading in code values is wrong.</b> Two layers at 50% do not sum to 100% of the light. Compositing, blending and dimming should happen in linear light and be re-encoded afterwards, which is exactly why a <a href="/learn/light/">projector blend</a> misbehaves in the overlap.',
  '<b>An LED wall at 5% is where the steps live.</b> Low code values are where the encoding has spent its resolution and the panel has spent its PWM range, and the two do not always agree.',
  '<b>"Brightness" on a display is not one control.</b> Backlight level, the transfer function and any picture processing are three different things, and only one of them is what you meant.',
  '<b>HDR changes the transfer function, not just the peak.</b> PQ and HLG are different curves designed for far larger ranges, so an HDR signal into an SDR display is not merely dim — it is decoded with the wrong function.',
])}

${S('RGB is a recipe, not a colour', 'Which red is #ff0000?', [
  'The number says "the red primary, at full". It does not say what that primary <em>is</em>. Two displays with different red phosphors, different LEDs or different filters will both show you their maximum red, and those two reds will be visibly different colours.',
  'A <b>colour space</b> is what closes that gap. It defines three things: the chromaticity of the primaries, the white point, and the transfer function. Given those, the same numbers mean the same colour on any display that honours them.',
  'That is why a screenshot looks different on two monitors, why an LED wall needs calibration rather than just configuration, and why a camera, a media server and a wall all have to be told which space they are working in.',
])}

<div class="cspwrap">
<table class="csp">
  <thead><tr><th>Space</th><th>Where it lives</th><th>What to watch</th></tr></thead>
  <tbody>
    ${C('sRGB', 'Computers, the web, most graphics and content produced on a laptop.', 'Effectively the same primaries as Rec.709 but a different transfer function definition. Close enough that people conflate them, and different enough to matter in a grade.')}
    ${C('Rec.709', 'HD broadcast and most show video. See <a href="/standards/itu-r-bt-709/">BT.709</a>.', 'The safe default for a show, and the one everything else gets converted into when nobody has agreed anything.')}
    ${C('DCI-P3', 'Cinema projection, and increasingly high-end displays.', 'Noticeably wider reds and greens than 709. Content mastered in P3 shown as 709 loses saturation; the reverse over-saturates.')}
    ${C('Rec.2020', 'UHD and HDR. See <a href="/standards/itu-r-bt-2020/">BT.2020</a>.', 'Wider than any current display can actually reproduce, so it is a container rather than a description of a screen.')}
    ${C('Rec.2100', 'HDR transfer functions — PQ and HLG. See <a href="/standards/itu-r-bt-2100/">BT.2100</a>.', 'PQ is absolute — a code means a specific brightness in nits. HLG is relative and degrades more gracefully on an SDR display.')}
  </tbody>
</table>
</div>

${rule('The numbers alone are meaningless. <b>A colour is the numbers plus the space</b> — primaries, white point and transfer function — and every hand-off between camera, server, processor and wall is a place that agreement can be lost.')}

${S('The compression nobody mentions', 'Chroma subsampling', [
  'The eye resolves far more spatial detail in <em>brightness</em> than in <em>colour</em>. Video exploits that: RGB is converted into one luma channel plus two colour-difference channels, and then the colour channels are stored at reduced resolution.',
  'The notation counts samples in a four-pixel-wide block. <b>4:4:4</b> keeps full colour resolution. <b>4:2:2</b> halves it horizontally. <b>4:2:0</b> halves it horizontally and vertically — a quarter of the colour samples, and half the total data.',
  'For camera footage of the real world this is nearly invisible and enormously useful. For anything with hard colour edges it is not: <b>text, fine graphics, and keying</b>. Coloured text over a contrasting background at 4:2:0 develops visible fringes, and a green-screen key at 4:2:0 has a quarter of the edge information a clean key needs.',
])}

<div class="dial">
  <div class="d" style="flex:0 0 auto"><label>subsampling</label>
    <span class="seg" role="group" id="ss-seg">
      <button type="button" data-s="4:4:4" aria-pressed="true">4:4:4</button>
      <button type="button" data-s="4:2:2" aria-pressed="false">4:2:2</button>
      <button type="button" data-s="4:2:0" aria-pressed="false">4:2:0</button>
    </span></div>
  <div class="d" style="flex:0 0 auto"><label>format</label>
    <span class="seg" role="group" id="ss-fmt">
      <button type="button" data-f="1920x1080x60" aria-pressed="true">HD 60p</button>
      <button type="button" data-f="3840x2160x60" aria-pressed="false">UHD 60p</button>
    </span></div>
  <div class="d"><label for="ss-bits">bit depth <b id="ss-bitsv">8</b></label>
    <input id="ss-bits" type="range" min="8" max="12" step="2" value="8"></div>
</div>
<div class="subgrids">
  <div><h5>luma</h5><p class="why">every pixel, always</p><div class="ssgrid" id="ss-luma"></div>
    <p>Brightness detail is kept in full because that is what the eye actually resolves.</p></div>
  <div><h5>chroma</h5><p class="why" id="ss-why">every pixel</p><div class="ssgrid" id="ss-chroma"></div>
    <p id="ss-note">Full colour resolution — what you need for graphics, text and keying.</p></div>
</div>
<div class="verdict" id="ss-out"></div>

${S('The fault that catches everyone', 'Full range against limited range', [
  'Computer graphics use the whole byte: 0 is black, 255 is white. Broadcast video does not — it puts black at <b>16</b> and white at <b>235</b>, leaving footroom below and headroom above for signals that overshoot.',
  'Both conventions travel down the same cable in the same eight bits, and nothing in the picture announces which one it is. Get it wrong in one direction and blacks are crushed and whites clipped; get it wrong in the other and the image is washed out and grey with no true black.',
  'This is the most common video fault on a show, it looks like a grading problem rather than a signalling one, and the fix is a setting rather than a colour correction. When a laptop looks washed out on a wall that was fine yesterday, check this before anything else.',
])}

<div class="dial">
  <div class="d"><label for="vr-c">code value <b id="vr-cv">128</b></label>
    <input id="vr-c" type="range" min="0" max="255" value="128"></div>
</div>
<div class="verdict" id="vr-out"></div>

${S('The round trip', 'Light in, numbers, light out', [
  'Everything above is the middle of a journey that starts and ends in the physical world.',
  '<b>Capture.</b> Photons land on photodiodes and accumulate charge — the <a href="/learn/reading/">image sensor</a> story. That charge becomes a voltage, an analogue-to-digital converter turns it into numbers, and those numbers are linear light at that point. Then the Bayer mosaic is interpolated into full colour, a matrix converts the sensor\'s native primaries into a standard space, and a transfer function is applied. Only after all of that do you have the numbers a file contains.',
  '<b>Display.</b> The reverse, and the last step is physical again. The transfer function is decoded, the values are mapped onto the display\'s actual primaries, and something emits light. On an LED wall a driver chip switches each LED fully on and fully off very quickly — <b>the LED has no dimmer</b> — and the ratio between on and off is the level. On a DLP projector, micromirrors flip. On an LCD panel, liquid crystal modulates a backlight.',
  'Which is why an LED processor talks about <em>grayscale bit depth</em> and <em>refresh rate</em> in the same breath: grayscale is how many on/off ratios the driver can produce, and refresh is how fast it repeats the pattern. Both are invisible to an eye and entirely visible to a camera — see <a href="/learn/systems/">genlock and LED walls</a> and <a href="/learn/perception/">flicker fusion</a>.',
])}

${fig(rtFig, 'Analogue at both ends. The digital part is the detour in the middle.')}
${fig(pwmFig, 'An LED is on or off. The grey is a ratio, and the ratio is why a camera can see it.')}

${rule('Audio and video are the same story told twice. <a href="/learn/bits/">A microphone becomes numbers and a speaker becomes air</a>; a sensor becomes numbers and an emitter becomes light. <b>Sample rate and bit depth in one, resolution and bit depth in the other</b> — and both are detours between two analogue events.')}

${bites([
  '<b>Check the levels before you check the colour.</b> Full-versus-limited mismatch looks exactly like a bad grade and is fixed with a checkbox.',
  '<b>Ask what space every hand-off is in.</b> Camera, server, processor, wall. Each is a place the agreement can be silently dropped.',
  '<b>4:2:0 is for pictures of the world, not for graphics.</b> If there is text, a key or a hard colour edge, get to 4:2:2 or better.',
  '<b>A wall\'s calibration lives with the panels.</b> Moving a wall between processors without carrying the calibration loses the thing the processor was bought for.',
  '<b>10-bit is about gradients, not saturation.</b> If somebody wants "richer colour" the answer is usually the colour space, not the bit depth.',
])}

${xnote('Every choice on this page is a choice about what an audience can detect. Gamma exists because perception is logarithmic, chroma subsampling exists because we resolve brightness better than colour, and 10-bit exists because a visible band in a slow fade pulls attention to the surface instead of the picture. <b>Banding, fringing and a washed-out black are all the audience noticing the machinery</b> — which is the only failure mode any of this is really about.')}

<div class="cta"><strong>Want the arithmetic rather than the explanation?</strong>
<p>The hex, gamma, range and bandwidth calculations on this page are tested functions embedded verbatim from <code>test/tools.test.mjs</code>, the same as everything in the <a href="/tools/">field tools</a>. The colour-space documents are in the <a href="/standards/">standards index</a> with access links.</p></div>

<script>
(function(){
  // ---- hex / rgb / dmx -----------------------------------------------
  var inp=document.getElementById('hx-in'); if(!inp) return;
  var R=document.getElementById('hx-r'), G=document.getElementById('hx-g'), B=document.getElementById('hx-b'),
      sw=document.getElementById('hx-swatch'), bars=document.getElementById('hx-bars'),
      out=document.getElementById('hx-out');
  var COL=['#e05c5c','#6ec96e','#6e9ce0'], NAME=['R','G','B'];
  function h2(n){ return n.toString(16).padStart(2,'0') }
  function render(r,g,b,fromInput){
    document.getElementById('hx-rv').textContent=r;
    document.getElementById('hx-gv').textContent=g;
    document.getElementById('hx-bv').textContent=b;
    var hex='#'+h2(r)+h2(g)+h2(b);
    if(!fromInput) inp.value=hex;
    sw.style.background=hex;
    bars.innerHTML=[r,g,b].map(function(v,i){
      return '<div class="chanrow"><span class="t">'+NAME[i]+'</span>'+
        '<span class="bar"><i style="width:'+((v/255)*100).toFixed(1)+'%;background:'+COL[i]+'"></i></span>'+
        '<span class="v">'+v+' &nbsp;'+h2(v)+' &nbsp;'+((v/255)*100).toFixed(1)+'%</span></div>';
    }).join('');
    var same=(r===g&&g===b);
    out.innerHTML='<b>'+hex+'</b> is three bytes: <b>'+r+' '+g+' '+b+'</b>. '+
      'Send exactly those to an 8-bit RGB fixture and you get this colour. '+
      (same ? (r===255?'All three at full, which is why it is white.':r===0?'All three at zero: nothing is emitting.':'All three equal, so it is a neutral \\u2014 though "neutral" depends on the display\\u2019s white point.')
            : 'In 16-bit control each of these becomes a coarse and a fine channel, giving 65,536 steps instead of 256.');
  }
  function fromSliders(){ render(+R.value,+G.value,+B.value,false) }
  inp.addEventListener('input',function(){
    var h=inp.value.trim().replace(/^#/,'').toLowerCase();
    if(/^[0-9a-f]{3}$/.test(h)) h=h.split('').map(function(c){return c+c}).join('');
    if(!/^[0-9a-f]{6}$/.test(h)) return;
    R.value=parseInt(h.slice(0,2),16); G.value=parseInt(h.slice(2,4),16); B.value=parseInt(h.slice(4,6),16);
    render(+R.value,+G.value,+B.value,true);
  });
  for (var el of [R,G,B]) el.addEventListener('input',fromSliders);
  fromSliders();

  // ---- bit depth gradient --------------------------------------------
  var bd=document.getElementById('bd-b');
  if(bd){
    var strip=document.getElementById('bd-strip'), steps=document.getElementById('bd-steps'),
        bout=document.getElementById('bd-out'), bv=document.getElementById('bd-bv');
    function drawBd(){
      var bits=+bd.value, levels=Math.pow(2,bits), N=64, html='';
      bv.textContent=bits; steps.textContent=levels.toLocaleString()+' steps';
      for(var i=0;i<N;i++){
        var f=i/(N-1);
        var q=Math.round(f*(levels-1))/(levels-1);
        var v=Math.round(Math.pow(q,1/2.2)*255);
        html+='<i style="background:rgb('+v+','+v+','+v+')"></i>';
      }
      strip.innerHTML=html;
      bout.innerHTML=levels.toLocaleString()+' levels per channel, '+
        Math.pow(levels,3).toLocaleString()+' code combinations. '+
        (bits<=4?'<span class="err">Bands you could count.</span> This is what a gradient looks like when the resolution runs out.'
         :bits<=6?'Visibly stepped. A slow fade on a large surface lives here.'
         :bits===8?'The everyday case. Bands appear in slow fades and in the dark end, which is where 10-bit earns its place.'
         :'<span class="ok">Smooth.</span> The steps are now below what an eye can pick out of a gradient.');
    }
    bd.addEventListener('input',drawBd); drawBd();
  }

  // ---- gamma curve ----------------------------------------------------
  var gc=document.getElementById('gm-c');
  if(gc){
    var gg=document.getElementById('gm-g'), curve=document.getElementById('gm-curve'),
        dot=document.getElementById('gm-dot'), gout=document.getElementById('gm-out');
    function drawGm(){
      var c=+gc.value, g=(+gg.value)/10;
      document.getElementById('gm-cv').textContent=c;
      document.getElementById('gm-gv').textContent=g.toFixed(1);
      var d='';
      for(var i=0;i<=100;i++){
        var f=i/100, y=170-Math.pow(f,g)*155;
        d+=(i?'L':'M')+(30+f*255).toFixed(1)+' '+y.toFixed(1)+' ';
      }
      curve.setAttribute('d',d);
      var f=c/255, light=Math.pow(f,g);
      dot.setAttribute('cx',(30+f*255).toFixed(1)); dot.setAttribute('cy',(170-light*155).toFixed(1));
      var half=Math.round(Math.pow(0.5,1/g)*255);
      gout.innerHTML='Code <b>'+c+'</b> of 255 is <b>'+(light*100).toFixed(1)+'%</b> of the light, not '+
        (f*100).toFixed(0)+'%. For half the light you need code <b>'+half+'</b>. '+
        (g<=1.05?'At gamma 1 the encoding is linear \\u2014 which wastes most of the codes where nobody can see them.'
         :'The dashed line is what linear would look like. The gap between the two is the whole reason 8-bit video works.');
    }
    gc.addEventListener('input',drawGm); gg.addEventListener('input',drawGm); drawGm();
  }

  // ---- chroma subsampling --------------------------------------------
  var seg=document.getElementById('ss-seg');
  if(seg){
    var fmt=document.getElementById('ss-fmt'), bits=document.getElementById('ss-bits'),
        luma=document.getElementById('ss-luma'), chroma=document.getElementById('ss-chroma'),
        why=document.getElementById('ss-why'), note=document.getElementById('ss-note'),
        sout=document.getElementById('ss-out'), scheme='4:4:4', format='1920x1080x60';
    var PER={'4:4:4':3,'4:2:2':2,'4:2:0':1.5};
    var WHY={'4:4:4':'every pixel','4:2:2':'every other pixel horizontally','4:2:0':'every other pixel, both directions'};
    var NOTE={
      '4:4:4':'Full colour resolution \\u2014 what you need for graphics, text and keying.',
      '4:2:2':'Half the colour detail horizontally. The broadcast workhorse, and fine for a key.',
      '4:2:0':'A quarter of the colour samples. Invisible on camera footage, and it fringes text and ruins a fine key.'
    };
    function drawSs(){
      var b=+bits.value; document.getElementById('ss-bitsv').textContent=b;
      for(var el of seg.querySelectorAll('button')) el.setAttribute('aria-pressed',String(el.dataset.s===scheme));
      for(var el2 of fmt.querySelectorAll('button')) el2.setAttribute('aria-pressed',String(el2.dataset.f===format));
      var lh='',ch='';
      for(var r=0;r<8;r++) for(var c=0;c<8;c++){
        lh+='<i style="background:var(--accent);opacity:.85"></i>';
        var keep = scheme==='4:4:4' ? true : scheme==='4:2:2' ? (c%2===0) : (c%2===0 && r%2===0);
        ch+='<i style="background:'+(keep?'var(--accent2)':'var(--panel2)')+';opacity:'+(keep?'.85':'1')+'"></i>';
      }
      luma.innerHTML=lh; chroma.innerHTML=ch;
      why.textContent=WHY[scheme]; note.textContent=NOTE[scheme];
      var p=format.split('x').map(Number);
      var bps=p[0]*p[1]*p[2]*b*PER[scheme];
      var full=p[0]*p[1]*p[2]*b*3;
      sout.innerHTML=p[0]+'\\u00d7'+p[1]+' at '+p[2]+'p, '+b+'-bit '+scheme+': <b>'+(bps/1e9).toFixed(2)+
        ' Gbit/s</b> uncompressed \\u2014 '+((bps/full)*100).toFixed(0)+'% of the 4:4:4 rate, saving '+
        (100-(bps/full)*100).toFixed(0)+'%. '+
        (bps/1e9>12?'<span class="err">Past a single 12G-SDI link.</span> This needs more than one cable, or compression, or IP.'
         :bps/1e9>3?'Comfortable on a 12G link, past 3G.':'<span class="ok">Fits a single 3G-SDI link.</span>');
    }
    seg.addEventListener('click',function(e){var b=e.target.closest('button'); if(b){scheme=b.dataset.s;drawSs()}});
    fmt.addEventListener('click',function(e){var b=e.target.closest('button'); if(b){format=b.dataset.f;drawSs()}});
    bits.addEventListener('input',drawSs); drawSs();
  }

  // ---- full vs limited range -----------------------------------------
  var vr=document.getElementById('vr-c');
  if(vr){
    var vout=document.getElementById('vr-out');
    function drawVr(){
      var c=+vr.value; document.getElementById('vr-cv').textContent=c;
      var full=c/255, lim=Math.max(0,Math.min(1,(c-16)/(235-16)));
      var msg = c<16 ? '<span class="err">Below limited-range black.</span> Interpreted as video, everything here is the same black \\u2014 this is what crushing is.'
        : c>235 ? '<span class="err">Above limited-range white.</span> Interpreted as video, all of this clips to the same white.'
        : 'Inside the video window, and still meaning two different brightnesses depending on which convention the sink assumed.';
      vout.innerHTML='Code <b>'+c+'</b> is <b>'+(full*100).toFixed(1)+'%</b> read as full range (0\\u2013255) and <b>'+
        (lim*100).toFixed(1)+'%</b> read as limited range (16\\u2013235). '+msg;
    }
    vr.addEventListener('input',drawVr); drawVr();
  }
})();
</script>
`

  return shell({
    title: 'How a colour becomes a number — hex, RGB, gamma and the conversion chain | showstack',
    description: 'What #ffffff actually is and why colours are written in base 16, why 128 is not half the light, what a colour space adds to the numbers, how chroma subsampling trades colour detail for bandwidth, the full-versus-limited range fault, and the analogue-to-digital-to-analogue round trip from a sensor to an LED.',
    canonical: `${SITE}/learn/colour/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'How a colour becomes a number',
      description: 'Hex and RGB encoding, bit depth and banding, gamma and the non-linearity of code values, colour spaces, chroma subsampling, video levels, and the analogue-digital-analogue conversion chain.',
      url: `${SITE}/learn/colour/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
