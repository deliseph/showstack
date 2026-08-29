/**
 * /learn/video/ — the handshake, the clock, and why the picture is black.
 *
 * /signals/display/ is the reference: which HDMI version carries what, which
 * connector does which job. This is the other half — why a chain that is
 * correct on paper produces nothing on the wall, which is almost never a
 * bandwidth problem and almost always a negotiation problem.
 *
 * Three mechanisms, in the order they fail. The source has to be told what
 * the sink can do (EDID). Protected content has to be authenticated at every
 * hop (HDCP). And once a picture exists, several of them have to agree about
 * when a frame starts, or the seam between two projectors tears.
 */
import { frameBudget, chromaBitrate } from './toolmath.mjs'
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

const MATH_SRC = [frameBudget, chromaBitrate].map((f) => f.toString()).join('\n\n')

export function learnVideoPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* The handshake is a sequence, so it plays as one: each step lights in turn
   and the chain only carries a picture once the last one has. */
@keyframes hs-step{0%,8%{opacity:.25}18%,92%{opacity:1}100%{opacity:.25}}
.hsfig .s1{animation:hs-step 6s ease-in-out infinite;animation-delay:0s}
.hsfig .s2{animation:hs-step 6s ease-in-out infinite;animation-delay:.9s}
.hsfig .s3{animation:hs-step 6s ease-in-out infinite;animation-delay:1.8s}
.hsfig .s4{animation:hs-step 6s ease-in-out infinite;animation-delay:2.7s}
@keyframes hs-pic{0%,60%{opacity:0}72%,94%{opacity:1}100%{opacity:0}}
.hsfig .picture{animation:hs-pic 6s ease-in-out infinite}
@keyframes hs-pkt{from{offset-distance:0%}to{offset-distance:100%}}
/* Genlock: two sources drifting, then locked. */
@keyframes gl-drift{0%,45%{transform:translateX(0)}55%,100%{transform:translateX(0)}}
@keyframes gl-free{0%{transform:translateX(0)}45%{transform:translateX(46px)}
50%{transform:translateX(0)}100%{transform:translateX(0)}}
.glfig .freerun{animation:gl-free 5s ease-in-out infinite}
@keyframes gl-tear{0%,44%{opacity:0}46%,52%{opacity:1}56%,100%{opacity:0}}
.glfig .tear{animation:gl-tear 5s linear infinite}
.vtable{width:100%;border-collapse:collapse;font-size:14px;margin:14px 0}
.vtable th{text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;
text-transform:uppercase;color:var(--ink-faint);padding:0 12px 9px 0;border-bottom:1px solid var(--rule);font-weight:400}
.vtable td{padding:11px 12px 11px 0;border-bottom:1px solid var(--rule);vertical-align:top;color:var(--ink-muted);line-height:1.55}
.vtable td:first-child{font-family:var(--mono);font-size:12.5px;color:var(--ink);white-space:nowrap}
.vtable td strong{color:var(--ink)}
`

  const handshakeFig = `
<svg viewBox="0 0 620 260" role="img" class="hsfig">
  <rect x="24" y="94" width="96" height="66" rx="6" fill="var(--surface-raised)" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <text x="72" y="132" class="lbl" text-anchor="middle">source</text>
  <rect x="500" y="94" width="96" height="66" rx="6" fill="var(--surface-raised)" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <text x="548" y="126" class="lbl" text-anchor="middle">display</text>
  <rect class="picture" x="512" y="132" width="72" height="20" rx="2" fill="var(--accent)" opacity=".55"/>

  <g class="s1">
    <line x1="500" y1="106" x2="120" y2="106" stroke="var(--dom-network)" stroke-width="2"/>
    <text x="310" y="98" class="lbl" text-anchor="middle">1 &mdash; hot plug: I am here</text>
  </g>
  <g class="s2">
    <line x1="500" y1="128" x2="120" y2="128" stroke="var(--accent2)" stroke-width="2"/>
    <text x="310" y="122" class="lbl" text-anchor="middle">2 &mdash; EDID: here is what I can do</text>
  </g>
  <g class="s3">
    <line x1="120" y1="150" x2="500" y2="150" stroke="var(--dom-control)" stroke-width="2"/>
    <text x="310" y="144" class="lbl" text-anchor="middle">3 &mdash; HDCP: prove you may receive this</text>
  </g>
  <g class="s4">
    <line x1="120" y1="172" x2="500" y2="172" stroke="var(--accent)" stroke-width="3"/>
    <text x="310" y="192" class="lbl" text-anchor="middle">4 &mdash; and only now, pixels</text>
  </g>
  <text x="24" y="238" class="lbl">Any step that fails gives the same symptom: black. The cable is rarely the reason.</text>
</svg>`

  const genlockFig = `
<svg viewBox="0 0 620 220" role="img" class="glfig">
  <text x="24" y="34" class="lbl">two sources, one wall</text>
  <rect x="24" y="52" width="270" height="60" rx="4" fill="var(--surface-sunken)" stroke="var(--rule)"/>
  <g class="freerun">
    ${[...Array(6)].map((_, i) => `<rect x="${34 + i * 44}" y="60" width="38" height="44" rx="2" fill="var(--accent)" opacity="${0.28 + i * 0.06}"/>`).join('')}
  </g>
  <rect x="326" y="52" width="270" height="60" rx="4" fill="var(--surface-sunken)" stroke="var(--rule)"/>
  ${[...Array(6)].map((_, i) => `<rect x="${336 + i * 44}" y="60" width="38" height="44" rx="2" fill="var(--dom-audio)" opacity="${0.28 + i * 0.06}"/>`).join('')}
  <rect class="tear" x="300" y="46" width="20" height="72" fill="var(--warn)" opacity=".8"/>
  <text x="310" y="136" class="lbl" text-anchor="middle" style="fill:var(--warn)">the seam</text>
  <line x1="24" y1="166" x2="596" y2="166" stroke="var(--rule)" stroke-width="1.5"/>
  <text x="24" y="188" class="lbl">Free-running, each output starts its frame whenever it feels like it. Genlock gives them all the same start.</text>
  <text x="24" y="208" class="lbl">The eye does not see 4 ms of offset on one screen. It sees it instantly across a join.</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / video</div>
${learnNav(esc, 'video')}
<h2>Why the picture is black</h2>
<p class="lede">A video chain that is correct on paper and produces nothing on the wall is almost never short of bandwidth. It has failed a negotiation &mdash; and the three negotiations it can fail all report the same symptom.</p>

${S('Before any pixels', 'The handshake nobody watches',
  ['Plugging a source into a display does not send a picture. It starts a conversation, and the picture is the last thing that happens in it. The display announces itself electrically. The source reads a block of data out of the display &mdash; the EDID &mdash; that lists the resolutions, refresh rates, colour depths and audio formats it will accept. The source picks a format from that list. If the content is protected, both ends then authenticate over HDCP. Only after all of that does anything appear.',
   'Every one of those steps can fail, and every one of them fails the same way from where you are standing: a black screen. That is why "check the cable" is such a poor first move. The cable is the one part of the chain that has no opinion.',
   'The failure mode that wastes the most time is subtler than a black screen. A splitter, a switch, an extender or a scaler in the middle usually presents its <em>own</em> EDID rather than passing the display’s through. So the source picks a format the middle box likes and the actual screen cannot show, and you get a picture that is the wrong resolution, or the wrong refresh, or that works on one output of a splitter and not the other.'])}

${fig(handshakeFig, 'Four steps, in order, before a single pixel moves. Three of them are the display and the source agreeing about what is possible and what is permitted.')}

${rule('The more boxes between source and screen, the more EDIDs there are in the chain, and <b>only one of them is the screen&rsquo;s</b>. A managed EDID is a setting, not an accident &mdash; decide what it says rather than discovering it.')}

${bites([
  'Testing source direct to screen, getting a picture, and concluding the chain is fine. You have just proved the two ends work and removed every device that was actually negotiating.',
  'One HDCP-incapable device anywhere in the path. HDCP is a chain of trust: it fails at the weakest hop, and the symptom appears at the end.',
  'A long run that carries 1080p60 and drops 4K60. That one really is bandwidth &mdash; 4K60 4:4:4 is roughly four times the data rate, and a marginal cable passes the smaller one.',
  'Hot-plugging in the middle of a show, which restarts the whole negotiation from step one on every downstream device.',
])}

${S('Same time, same frame', 'Genlock, and why a seam shows what a screen hides',
  ['Once pictures exist, a second problem starts. Every output is running its own frame clock, and unless something ties them together those clocks drift. On one screen that is invisible &mdash; a frame starting four milliseconds late is still a frame. Across a join between two projectors or two panels of a wall, it is a tear: for a fraction of a second the two halves of the image are showing different moments.',
   'Genlock fixes the reference. Historically that was a black-burst or tri-level sync signal distributed to every device, which locks their frame starts to a common timing. On a network it is <a href="/protocols/ptp/">PTP</a> doing the same job with timestamps rather than a dedicated cable, which is why an ST 2110 or Dante-adjacent video plant cares so much about a grandmaster clock.',
   'Genlock is about <em>when a frame starts</em>. It is not the same as frame rate matching, and it is not the same as latency. Two devices can be perfectly genlocked and still be four frames apart if one of them is doing more processing than the other &mdash; which is the difference between a tear and a lip-sync problem.'])}

${fig(genlockFig, 'Two sources free-running. The offset is invisible on either screen alone and unmistakable across the seam between them.')}

<div class="dial">
  <div class="dialrow">
    <label for="vf-fps">Frame rate</label>
    <input id="vf-fps" type="range" min="24" max="120" step="1" value="60">
    <output id="vf-fps-v">60 fps</output>
  </div>
  <div class="dialrow">
    <label for="vf-lat">Processing in the chain (frames)</label>
    <input id="vf-lat" type="range" min="0" max="10" step="1" value="3">
    <output id="vf-lat-v">3</output>
  </div>
  <div class="verdict" id="vf-out"></div>
</div>

${S('What a link actually carries', 'Bandwidth, and the three ways it gets reduced',
  ['A raw video link carries pixels per second times bits per pixel, and the number gets large quickly: 3840&times;2160 at 60&nbsp;fps in 10-bit 4:4:4 is about 14.9&nbsp;Gbit/s before any overhead. Every real-world link deals with that in one of three ways, and each one costs something different.',
   'Chroma subsampling throws away colour resolution while keeping brightness resolution, on the grounds that the eye notices the second far more than the first. 4:2:2 halves the data; 4:2:0 more than halves it. It is nearly free on camera footage and visibly destructive on fine coloured text or a sharp graphic edge &mdash; which is exactly what a show usually puts on a wall.',
   'Compression &mdash; from Display Stream Compression on a cable to H.264 or JPEG-XS on a network &mdash; buys much larger reductions and costs latency and, above some threshold, artefacts. And reducing the picture itself, in resolution or frame rate, is the honest option that people reach for last.'])}

<table class="vtable">
  <tr><th>Scheme</th><th>Data vs 4:4:4</th><th>What it costs</th></tr>
  <tr><td><strong>4:4:4</strong></td><td>100%</td><td>Nothing. Full colour resolution on every pixel &mdash; what graphics and text need.</td></tr>
  <tr><td><strong>4:2:2</strong></td><td>67%</td><td>Half the horizontal colour resolution. Broadcast standard; safe on camera footage.</td></tr>
  <tr><td><strong>4:2:0</strong></td><td>50%</td><td>Half horizontally and vertically. Fine for delivery, poor for a wall showing coloured text.</td></tr>
</table>

${bites([
  'Sending 4:2:0 to an LED wall and blaming the panels for soft-edged text.',
  'Adding a frame of latency at every hop and only measuring it at the end, when the sound is already locked.',
  'Assuming a "4K" input on a box means 4K at 60 in full colour. Very often it means 4K at 30, or 4K60 at 4:2:0.',
])}

${xnote('Everything on this page is about a picture arriving intact and on time, and neither of those is a visual quality in isolation &mdash; they are both about whether the room believes what it is looking at. A tear across a seam or four frames of lag between a face and its voice does not read to an audience as a technical fault. It reads as wrongness, before anybody can say what is wrong, which is the same mechanism a magician relies on and the reason it is worth this much care.')}

${S('Where the numbers live', 'The calculators behind this page',
  ['<a href="/tools/#frame">Frame budget</a> turns a frame rate into the milliseconds you have to spend. <a href="/tools/#aspect">Aspect fit</a> shows what fitting one shape into another costs in bars or in crop. <a href="/tools/#storage">Video storage</a> converts a bitrate into disk and a card into minutes. <a href="/learn/colour/">How a colour becomes a number</a> has the subsampling grids and the bitrate arithmetic in full.'])}
`

  const script = `
${MATH_SRC}
(function(){
  var fps=document.getElementById('vf-fps'), lat=document.getElementById('vf-lat');
  if(!fps||!lat)return;
  function draw(){
    var f=Number(fps.value), n=Number(lat.value);
    document.getElementById('vf-fps-v').textContent=f+' fps';
    document.getElementById('vf-lat-v').textContent=n;
    var b=frameBudget(f);
    var ms=n*(1000/f);
    var v=document.getElementById('vf-out');
    /* Roughly 40 ms is where lip-sync error starts being noticed on audio
       that leads the picture; the ITU guidance is asymmetric but this is the
       figure people work to on a show floor. */
    var verdict = ms<=20 ? '<span class="ok">imperceptible</span>'
      : ms<=40 ? 'borderline &mdash; fine for a wall, audible against live sound'
      : '<span class="err">visible against a person on stage</span>';
    v.innerHTML='One frame is <b>'+b.periodMs+' ms</b>. '+n+' frame'+(n===1?'':'s')+
      ' of processing is <b>'+ms.toFixed(1)+' ms</b> &mdash; '+verdict+'.';
  }
  fps.addEventListener('input',draw); lat.addEventListener('input',draw); draw();
})();
`

  return shell({
    title: 'Why the picture is black — EDID, HDCP and genlock | showstack',
    description: 'The three negotiations a video chain has to pass before any pixel moves, why every failure looks the same, and why a frame-timing offset is invisible on one screen and obvious across a seam.',
    canonical: `${SITE}/learn/video/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Why the picture is black',
      url: `${SITE}/learn/video/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
