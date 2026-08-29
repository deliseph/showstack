/**
 * /learn/engines/ — node graphs and game engines.
 *
 * Two ways of building show content that do not look like the code on the
 * /learn/code/ page, and that most people meet without ever being told what
 * kind of thing they are looking at.
 *
 * The first is dataflow: Max/MSP, Pure Data, TouchDesigner, vvvv, Notch,
 * Unreal's Blueprints. The mental model is a patch bay, not a script, and
 * saying so out loud is most of the explanation.
 *
 * The second is the real-time engine: Unreal, Unity, Godot. The distinction
 * that matters is not which one, it is pre-rendered versus real-time — a file
 * being played back cannot answer a camera, and that single fact is why LED
 * volumes and previz needed game engines rather than video editors.
 *
 * Both figures animate because both ideas are about *when* something is
 * computed, and that is not a thing a still picture can show.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

export function learnEnginesPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* data flowing along a patch */
@keyframes flow{from{stroke-dashoffset:0}to{stroke-dashoffset:-28}}
.patchfig .wire{stroke-dasharray:5 9;animation:flow 1.1s linear infinite}
.patchfig .wire.w2{animation-duration:1.5s}
.patchfig .wire.w3{animation-duration:.85s}
@keyframes nodepulse{0%,100%{stroke-width:1.2}50%{stroke-width:2.2}}
.patchfig .node{animation:nodepulse 2.4s ease-in-out infinite}
.patchfig .node.n2{animation-delay:.4s}
.patchfig .node.n3{animation-delay:.8s}
.patchfig .node.n4{animation-delay:1.2s}
.patchfig .node.n5{animation-delay:1.6s}
/* pre-rendered vs real-time */
@keyframes tape{from{transform:translateX(0)}to{transform:translateX(-64px)}}
.rtfig .tape{animation:tape 2s linear infinite}
@keyframes look{0%,100%{transform:translateX(0)}50%{transform:translateX(58px)}}
.rtfig .eye{animation:look 4s ease-in-out infinite}
.rtfig .view{animation:look 4s ease-in-out infinite}
@keyframes redraw{0%,100%{opacity:.25}12%{opacity:1}}
.rtfig .rr{animation:redraw 1.05s linear infinite}
.rtfig .rr.r2{animation-delay:.15s}.rtfig .rr.r3{animation-delay:.3s}
.rtfig .rr.r4{animation-delay:.45s}.rtfig .rr.r5{animation-delay:.6s}
/* the 16.7 ms budget draining */
@keyframes budget{0%{width:100%;background:var(--ok)}70%{background:var(--ok)}
88%{background:var(--warn)}100%{width:6%;background:var(--warn)}}
.budgetbar{height:26px;border:1px solid var(--line);border-radius:6px;overflow:hidden;margin:14px 0 6px;
background:var(--panel)}
.budgetbar i{display:block;height:100%;animation:budget 1.6s linear infinite}
/* operator family strip */
.ops{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:16px 0}
.ops div{border:1px solid var(--line);border-radius:var(--r-sm);padding:13px;background:var(--panel)}
.ops dt{font-family:var(--mono);font-size:11.5px;color:var(--accent);margin-bottom:6px}
.ops dd{margin:0;font-size:13.2px;color:var(--dim);line-height:1.5}
/* engine comparison */
.engines{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin:18px 0}
.engine{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:17px;
border-top:3px solid var(--accent)}
.engine:nth-child(2){border-top-color:var(--accent2)}
.engine:nth-child(3){border-top-color:var(--ok)}
.engine h4{margin:0 0 4px;font-size:16px;font-family:var(--sans);text-transform:none;letter-spacing:-.1px;
color:var(--ink);font-weight:650}
.engine .lic{font-family:var(--mono);font-size:10.5px;color:var(--dimmer);margin-bottom:10px}
.engine p{margin:0 0 9px;color:var(--dim);font-size:13.8px;line-height:1.6}
.engine p:last-child{margin-bottom:0}
.engine .lang{font-family:var(--mono);font-size:11px;color:var(--accent2);border-top:1px solid var(--line);
padding-top:9px;margin-top:11px}
/* pipeline */
.pipe{display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin:16px 0;font-family:var(--mono);font-size:11.5px}
.pipe b{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:7px 11px;
color:var(--dim);font-weight:400}
.pipe b.hi{border-color:color-mix(in srgb,var(--accent) 55%,var(--line));color:var(--accent)}
.pipe i{color:var(--dimmer);font-style:normal}
`

  const patchFig = `
<svg viewBox="0 0 460 210" role="img" class="patchfig">
  ${[
    ['n1', 20, 20, 'input', 'var(--accent)'],
    ['n2', 20, 120, 'timecode', 'var(--accent)'],
    ['n3', 172, 68, 'maths', 'var(--accent2)'],
    ['n4', 172, 150, 'noise', 'var(--accent2)'],
    ['n5', 320, 100, 'output', 'var(--ok)'],
  ].map(([c, x, y, t, col]) => `
  <rect class="node ${c}" x="${x}" y="${y}" width="94" height="34" rx="6" fill="var(--panel)" stroke="${col}" stroke-width="1.2"/>
  <text x="${x + 47}" y="${y + 22}" class="lbl" font-size="10" text-anchor="middle">${t}</text>`).join('')}
  <path class="wire" d="M114 37 C144 37 144 85 172 85" fill="none" stroke="var(--accent)" stroke-width="1.6"/>
  <path class="wire w2" d="M114 137 C144 137 144 85 172 85" fill="none" stroke="var(--accent)" stroke-width="1.6"/>
  <path class="wire w3" d="M114 137 C144 137 144 167 172 167" fill="none" stroke="var(--accent)" stroke-width="1.6"/>
  <path class="wire" d="M266 85 C296 85 296 117 320 117" fill="none" stroke="var(--accent2)" stroke-width="1.6"/>
  <path class="wire w2" d="M266 167 C296 167 296 117 320 117" fill="none" stroke="var(--accent2)" stroke-width="1.6"/>
  <text x="230" y="202" class="lbl" text-anchor="middle" font-size="9.5">nothing here is "called" — the whole graph is running, all the time</text>
</svg>`

  const rtFig = `
<svg viewBox="0 0 460 210" role="img" class="rtfig">
  <text x="112" y="16" class="lbl" font-size="10" text-anchor="middle" fill="var(--dimmer)">PRE-RENDERED</text>
  <clipPath id="tapeclip"><rect x="20" y="30" width="184" height="46"/></clipPath>
  <g clip-path="url(#tapeclip)">
    <g class="tape">
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${22 + i * 32}" y="34" width="28" height="38" rx="3" fill="var(--panel2)" stroke="var(--line)"/>`).join('')}
    </g>
  </g>
  <rect x="20" y="30" width="184" height="46" rx="4" fill="none" stroke="var(--line)"/>
  <text x="112" y="96" class="lbl" font-size="9" text-anchor="middle">frames computed months ago</text>
  <g class="eye"><path d="M84 132 L112 112 L140 132 Z" fill="var(--dimmer)"/></g>
  <text x="112" y="160" class="lbl" font-size="9" text-anchor="middle">move the camera and</text>
  <text x="112" y="174" class="lbl" font-size="9" text-anchor="middle">nothing changes</text>
  <line x1="232" y1="8" x2="232" y2="196" stroke="var(--line)"/>
  <text x="348" y="16" class="lbl" font-size="10" text-anchor="middle" fill="var(--accent)">REAL-TIME</text>
  ${[0, 1, 2, 3, 4].map((i) => `<rect class="rr${i ? ` r${i + 1}` : ''}" x="${262 + i * 34}" y="34" width="28" height="38" rx="3" fill="var(--accent)" opacity=".9"/>`).join('')}
  <text x="348" y="96" class="lbl" font-size="9" text-anchor="middle">a new frame, now, from a scene</text>
  <g class="view"><path d="M320 132 L348 112 L376 132 Z" fill="var(--accent)"/></g>
  <text x="348" y="160" class="lbl" font-size="9" text-anchor="middle">move the camera and the</text>
  <text x="348" y="174" class="lbl" font-size="9" text-anchor="middle">next frame answers it</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / engines</div>
${learnNav(esc, 'engines')}
<div class="lhero">
  <h2>Node graphs and game engines</h2>
  <p class="lede">Two ways of building show content that do not look like code, and that a lot of people use for years without being told what kind of thing they are working in. One is a patch bay. The other is a machine that draws a picture sixty times a second from a description of a world.</p>
</div>

${S('The first one', 'Dataflow: why a patch is not a script', [
  'Open Max, Pure Data, TouchDesigner, vvvv, Notch or Unreal\'s Blueprints and you get boxes joined by wires. The instinct is to read it as a flowchart — do this, then this. That is the wrong model and it makes everything harder.',
  '<b>It is a patch bay.</b> Each box is a device that is permanently powered on. Each wire is a cable. Nothing is "called" and there is no beginning: the whole graph is live, and data moves through it continuously. You are not writing a sequence of instructions, you are <em>building an instrument</em> and then playing it.',
  'That is exactly why this style caught on in this industry rather than in general software. Anybody who has patched a rack already holds the mental model. The signal-flow intuition transfers directly, and so does the debugging habit: when it is wrong, you probe along the chain until you find where the signal stopped looking right.',
])}

${fig(patchFig, 'Boxes are devices, wires are cables, and the whole thing is always running.')}

${rule('Read a patch as <b>signal flow</b>, not as a sequence of steps. Once that clicks, every one of these tools becomes the same tool with a different object set.')}

${S('The families', 'What each dataflow tool is actually for', [
  '<b>Max/MSP</b> (Cycling \'74) is three layers with one look. <em>Max</em> is the message layer — control-rate events, the things that happen when something changes. <em>MSP</em> is the audio layer, where objects whose names end in a tilde process a continuous signal at sample rate. <em>Jitter</em> is the matrix layer, for video and data grids. Being able to move between an event and a sample-rate signal in one patch is what Max is <em>for</em>, and it is why it stayed the standard in music technology and interactive installation. Max for Live puts the same environment inside <a href="/software/ableton-live/">Ableton Live</a>.',
  '<b>Pure Data</b> is the open-source ancestor of the same idea, by the same author, and it is the pragmatic choice when a piece has to keep running for years without a licence server in the way.',
  '<b><a href="/software/touchdesigner/">TouchDesigner</a></b> is the same model built on the GPU, and it organises everything into operator families you connect together: TOPs are textures, CHOPs are channels of numbers over time, SOPs are geometry, DATs are text and tables, MATs are materials, COMPs are containers. Python is embedded throughout, so the awkward parts do not have to be patched. It has become a default for interactive and generative content, and for wiring a protocol into a picture.',
  '<b><a href="/software/notch/">Notch</a></b> is a real-time VFX tool whose output is a <em>block</em> that runs live inside a media server — <a href="/software/disguise-designer/">disguise</a>, <a href="/software/hippotizer/">Hippotizer</a>, PIXERA — with its parameters exposed to the operator. That is its whole point: effects that stay adjustable on site instead of being baked into a file at the last render.',
  '<b>vvvv</b> and <b>Blueprints</b> complete the picture — vvvv as a long-standing patching environment for installation work, Blueprints as Unreal\'s visual layer over the same engine its C++ reaches.',
])}

<div class="ops">
  <div><dt>TOP</dt><dd>Textures — images and video, on the GPU.</dd></div>
  <div><dt>CHOP</dt><dd>Channels — numbers over time. Audio, DMX, sensors, timecode.</dd></div>
  <div><dt>SOP</dt><dd>Surfaces — 3D geometry you can generate and deform.</dd></div>
  <div><dt>DAT</dt><dd>Data — text, tables, scripts. Where Python lives.</dd></div>
  <div><dt>MAT</dt><dd>Materials — how a surface responds to light.</dd></div>
  <div><dt>COMP</dt><dd>Components — containers, and the UI you build for the operator.</dd></div>
</div>
<p style="color:var(--dimmer);font-size:13px;font-family:var(--mono);margin-top:-4px">TouchDesigner\'s operator families. Every other patching tool has an equivalent split; this one just names it clearly.</p>

${bites([
  '<b>A patch is easy to write and hard to review.</b> There is no useful diff of two versions of a graph, which means the normal safety net of "what changed?" is missing. Save numbered versions and write down what each one did.',
  '<b>Spaghetti is a real cost, not a joke.</b> The person opening it in eighteen months is you. Use containers, name things, and lay it out left to right.',
  '<b>Frame rate is the deadline.</b> A patch that runs at 45 fps is not slightly worse than one at 60, it is dropping content. Watch the cook time, not the appearance.',
  '<b>Check the licence before the tour, not after.</b> These tools have very different rules about what a show machine may run unattended, and a dongle or an activation that expires mid-run is a genuine show-stopper.',
])}

${S('The second one', 'What a game engine actually is', [
  'Unreal, Unity and Godot are usually described as tools for making games. That is a market, not a definition. What they actually are is <b>real-time renderers with everything attached</b>: a scene graph that holds a world, a physics simulation, an asset pipeline, an animation system, a scripting layer, and a renderer whose job is to produce a complete new frame in the time before the display needs one.',
  'The consequence is the whole reason they arrived in this industry. A video file is a sequence of frames someone computed in the past. It is beautiful, it is exactly as intended, and it cannot answer a question. A real-time engine holds the <em>scene</em> — geometry, materials, lights, cameras — and draws it now. So it can be asked something: where is the camera, where is the performer, what did the operator just change, what is the tracking system reporting this millisecond.',
  'That is what makes an LED volume possible, what makes previsualisation useful rather than decorative, and what lets an AR graphic sit convincingly on a pitch. Not the rendering quality — the <em>timing</em> of the rendering.',
])}

${fig(rtFig, 'Playback cannot answer the camera. A scene can, because it has not been drawn yet.')}

<div class="budgetbar" aria-hidden="true"><i></i></div>
<p style="color:var(--dimmer);font-family:var(--mono);font-size:11.5px;margin-top:0">At 60 fps the whole budget is 16.7 ms — geometry, lighting, effects, post and output. Everything you add spends part of the same bar.</p>

${xnote('A dropped frame is felt before it is seen. Real-time content that stutters breaks the sense that the world is responding to you, which is the specific illusion the whole apparatus exists to create — see <a href="/learn/presence/">presence</a>. <b>Frame budget is presence budget.</b>')}

${S('', 'Spend the budget and watch it run out', [])}

<div class="dial">
  <div class="d"><label for="fb2-fps">target rate <b id="fb2-fpsv">60 fps</b></label>
    <input id="fb2-fps" type="range" min="24" max="120" step="1" value="60"></div>
  <div class="d"><label for="fb2-geo">geometry <b id="fb2-geov">4.0 ms</b></label>
    <input id="fb2-geo" type="range" min="0" max="200" step="1" value="40"></div>
  <div class="d"><label for="fb2-lig">lighting <b id="fb2-ligv">5.0 ms</b></label>
    <input id="fb2-lig" type="range" min="0" max="200" step="1" value="50"></div>
  <div class="d"><label for="fb2-fx">effects <b id="fb2-fxv">3.0 ms</b></label>
    <input id="fb2-fx" type="range" min="0" max="200" step="1" value="30"></div>
  <div class="d"><label for="fb2-post">post + output <b id="fb2-postv">2.0 ms</b></label>
    <input id="fb2-post" type="range" min="0" max="200" step="1" value="20"></div>
</div>
<div class="fig" data-driven="dial" style="padding:14px">
  <div id="fb2-bar" style="display:flex;height:34px;border:1px solid var(--line);border-radius:7px;overflow:hidden"></div>
</div>
<div class="verdict" id="fb2-out"></div>

${rule('The question is never "is it good enough to look at". It is <b>can it produce the next frame in time, every time</b> — which makes a real-time engine a determinism problem, exactly like the one on the <a href="/learn/code/">code</a> page.')}

${S('The three', 'Unreal, Unity and Godot', [])}

<div class="engines">
  <div class="engine">
    <h4>Unreal Engine</h4>
    <p class="lic">Epic Games · source-available · royalty model</p>
    <p>The default for virtual production and large-scale live visuals. It ships the specific things this industry needs rather than requiring them to be built: nDisplay for driving many synchronised outputs across an LED volume, Live Link for taking camera and performer tracking in live, the Sequencer for timeline-based animation, and integration with media servers through vendor bridges.</p>
    <p>It is also the heaviest of the three — a serious machine, a serious project structure, and a real learning curve before anything looks good.</p>
    <p class="lang">C++ · Blueprints (visual) · Python for tooling</p>
  </div>
  <div class="engine">
    <h4>Unity</h4>
    <p class="lic">Unity Technologies · proprietary · tiered licence</p>
    <p>Lighter to get started with and dominant in XR. If a project involves headsets, handheld AR or an interactive exhibit, the device SDK you need almost certainly exists for Unity first. Strong for installations, museum work and anything that must run on modest hardware or on a phone.</p>
    <p>Less turnkey than Unreal for camera-tracked broadcast and volume work, though it is done.</p>
    <p class="lang">C# · a visual scripting layer</p>
  </div>
  <div class="engine">
    <h4>Godot</h4>
    <p class="lic">Godot Foundation · MIT · genuinely free</p>
    <p>Small, fast to open, and open source under a permissive licence with no royalty and no company able to change the terms later. That last part is not an ideological point on a project that has to still run in ten years, or on a bespoke tool a venue owns.</p>
    <p>Smaller ecosystem, fewer industry integrations, and you will build more of the show-specific plumbing yourself. The right pick for learning, for tools, and for work that must remain yours.</p>
    <p class="lang">GDScript · C# · C++</p>
  </div>
</div>

${S('The practical part', 'How a scene actually becomes something an audience sees', [
  'The workflow is the same in all three, and it is worth knowing the shape even if someone else does it.',
  '<b>Build the world.</b> Geometry comes in from a modelling tool — <a href="/software/blender/">Blender</a>, <a href="/software/cinema-4d/">Cinema 4D</a>, <a href="/software/rhino-3d/">Rhino</a> — or from a scan. Materials describe how each surface responds to light. Lights and cameras are placed. At this point you have a place, not a picture.',
  '<b>Animate it.</b> Keyframes on a timeline for anything choreographed; simulation for anything that should behave rather than be posed; and, on a show, live input for anything that has to follow reality.',
  '<b>Then choose when it is drawn.</b> This is the decision that matters. Render it offline — Unreal\'s Movie Render Queue, or the equivalent — and you get a file: maximum quality, fully deterministic, and completely fixed. Or run it live, and you get responsiveness at the cost of a hard per-frame budget. Plenty of shows do both: pre-rendered content for the sections that are locked, a live engine for the sections that must follow a camera or a performer.',
])}

<div class="pipe">
  <b>model</b><i>→</i><b>scene</b><i>→</i><b>light + animate</b><i>→</i><b class="hi">render offline → a file</b><i>or</i><b class="hi">run live → a frame, now</b>
</div>

${S('Where it joins the show', 'The engine is just another device on the network', [
  'A render engine on a show is not an island. It takes the same signals as everything else, which is the entire subject of this site.',
  '<b>In:</b> <a href="/protocols/art-net/">Art-Net</a> or <a href="/protocols/sacn/">sACN</a> so an operator can drive virtual fixtures — or drive the real rig from the same cue that moves the content; <a href="/protocols/freed/">FreeD</a> for camera position and lens; <a href="/protocols/psn/">PSN</a> or <a href="/protocols/rttrpm/">RTTrPM</a> for performer tracking; <a href="/protocols/ltc/">LTC</a> or <a href="/protocols/ptp-1588/">PTP</a> so it agrees with everyone else about time; <a href="/protocols/osc/">OSC</a> for everything else.',
  '<b>Out:</b> video over <a href="/protocols/ndi/">NDI</a> or <a href="/protocols/smpte-st-2110/">ST 2110</a>, or a vendor stream into a media server, or straight to an LED processor with <a href="/protocols/genlock/">genlock</a> holding the frames together.',
  'This is also how previsualisation works. <a href="/software/capture/">Capture</a>, <a href="/software/wysiwyg/">WYSIWYG</a>, <a href="/software/depence/">Depence</a>, <a href="/software/vectorworks-vision/">Vision</a> and <a href="/software/realizzer-3d/">Realizzer</a> are real-time engines with a lighting-specific asset library: the console sends real DMX, the engine renders what those fixtures would do, and a designer programs a show in a room that does not exist yet. Same machinery, aimed at a different question.',
])}

${bites([
  '<b>Previz is a model of the rig, not of the venue.</b> It is exact about what a fixture does and hopeful about surfaces, haze and eyes. Use it to program, not to promise.',
  '<b>A pre-rendered file cannot be nudged on site.</b> If a section may need to change during tech, it needs to be live — decide that in pre-production, not at 1am.',
  '<b>Real-time quality is a budget, not a setting.</b> Every effect you add takes milliseconds from the same frame. "Turn it up" is a request to drop frames.',
  '<b>Version and back up the project, not just the output.</b> A rendered file is not recoverable content; the scene that made it is.',
])}

${S('Where to start', 'If you want to learn one of these', [
  'For <b>content and interaction</b>, start with TouchDesigner. It is the shortest distance between a protocol arriving on a network port and something moving on a screen, and the free non-commercial licence is genuinely usable for learning.',
  'For <b>sound and event logic</b>, start with Max, or Pure Data if you want it free and permanent. The tilde/no-tilde split is the concept to get straight on day one.',
  'For <b>3D worlds</b>, start with Godot if you want to understand engines, or Unreal if you want to work in virtual production, because that is where the industry tooling is.',
  'And in every case the transferable part is not the software. It is knowing what signal you are taking in, what promise you are making about the next frame, and which clock you are reading — which is the rest of this section.',
])}

<div class="cta"><strong>Using one of these on shows?</strong>
<p>The <a href="/software/">software index</a> lists what each tool speaks, and that is the field most often wrong or missing. If your version of one of these has an integration the entry does not mention, <a href="${GH}/issues/new?labels=data&amp;title=software%3A+">open an issue</a> — that is the single most useful correction anyone sends.</p></div>

<script>
(function(){
  var fps=document.getElementById('fb2-fps'); if(!fps) return;
  var ids=['geo','lig','fx','post'], names=['geometry','lighting','effects','post + output'],
      cols=['var(--dom-control)','var(--accent2)','var(--dom-network)','var(--dom-visual)'],
      bar=document.getElementById('fb2-bar'), out=document.getElementById('fb2-out');
  function draw(){
    var f=Number(fps.value), period=1000/f;
    document.getElementById('fb2-fpsv').textContent=f+' fps';
    var used=0, parts=[];
    ids.forEach(function(id,i){
      var ms=Number(document.getElementById('fb2-'+id).value)/10;
      document.getElementById('fb2-'+id+'v').textContent=ms.toFixed(1)+' ms';
      used+=ms; parts.push(ms);
    });
    var html='';
    parts.forEach(function(ms,i){
      var w=Math.min(100,(ms/period)*100);
      if(w>0.5) html+='<div style="width:'+w+'%;background:'+cols[i]+';color:var(--bg);font-family:var(--mono);'
        +'font-size:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;white-space:nowrap">'+names[i]+'</div>';
    });
    if(used<period) html+='<div style="flex:1;background:var(--panel2)"></div>';
    bar.innerHTML=html;
    var can=used>0?Math.min(f,1000/used):f;
    out.innerHTML='A frame at '+f+' fps is <b>'+period.toFixed(2)+' ms</b>. Using <b>'+used.toFixed(1)+' ms</b> ('
      +((used/period)*100).toFixed(0)+'%). '+(used<=period
        ? '<span class="ok">'+(period-used).toFixed(2)+' ms of headroom.</span>'
        : '<span class="err">Over by '+(used-period).toFixed(2)+' ms \u2014 this drops frames.</span>')
      +' Achievable rate with this work: <b>'+can.toFixed(1)+' fps</b>.';
  }
  fps.addEventListener('input',draw);
  ids.forEach(function(id){document.getElementById('fb2-'+id).addEventListener('input',draw)});
  draw();
})();
</script>
`

  return shell({
    title: 'Node graphs and game engines — Max, TouchDesigner, Unreal, Unity, Godot | showstack',
    description: 'Why a Max or TouchDesigner patch is a patch bay rather than a script, what the operator families mean, and what a game engine actually is — pre-rendered versus real-time, the frame budget, and how Unreal, Unity and Godot join a show network for virtual production and previsualisation.',
    canonical: `${SITE}/learn/engines/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Node graphs and game engines in live production',
      description: 'Dataflow programming in Max/MSP, Pure Data, TouchDesigner, vvvv and Notch; real-time engines Unreal, Unity and Godot; pre-rendered versus real-time rendering and how an engine joins a show network.',
      url: `${SITE}/learn/engines/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
