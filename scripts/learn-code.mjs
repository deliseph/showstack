/**
 * /learn/code/ — languages, scripting and PLCs, for people who write code
 * only when a show needs it.
 *
 * Show people meet code in three quite different places, and the confusion
 * that costs time is treating them as one place. Writing a Lua macro inside a
 * console, writing a small Node service that sits between two systems, and
 * writing motion control on a PLC are three different disciplines with three
 * different definitions of "working".
 *
 * The argument this page is built to make is about *determinism*: why a
 * language that is perfectly good for glue is disqualified from anything that
 * moves scenery, and why that is a property of the runtime rather than of the
 * programmer. The jitter figure carries it — a bar chart of cycle times says
 * nothing; the same cycle stuttering says everything.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav } from './learn-kit.mjs'

export function learnCodePage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* three places you meet code */
.places{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin:20px 0}
.place{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:17px;
border-top:3px solid var(--accent)}
.place:nth-child(2){border-top-color:var(--accent2)}
.place:nth-child(3){border-top-color:var(--dom-network)}
.place h4{margin:0 0 8px;font-size:15.5px;font-family:var(--sans);text-transform:none;letter-spacing:-.1px;
color:var(--ink);font-weight:650}
.place p{margin:0 0 10px;color:var(--dim);font-size:14px;line-height:1.6}
.place .what{font-family:var(--mono);font-size:11px;color:var(--dimmer);border-top:1px solid var(--line);
padding-top:9px;line-height:1.7}
/* language table */
.langs{width:100%;border-collapse:collapse;margin:16px 0;font-size:14.2px}
.langs th{text-align:left;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;
color:var(--dimmer);padding:0 12px 9px 0;border-bottom:1px solid var(--line);font-weight:400;white-space:nowrap}
.langs td{padding:12px 12px 12px 0;border-bottom:1px solid var(--line);vertical-align:top;color:var(--dim);
line-height:1.55}
.langs td:first-child{color:var(--ink);font-family:var(--mono);font-size:13px;white-space:nowrap}
.langs .kind{font-family:var(--mono);font-size:11px;color:var(--accent2);white-space:nowrap}
.langwrap{overflow-x:auto;margin:16px 0;-webkit-overflow-scrolling:touch}
.langwrap .langs{min-width:640px;margin:0}
/* compile vs interpret */
@keyframes comp-build{0%,30%{opacity:1}38%,100%{opacity:.2}}
@keyframes comp-run{0%,34%{opacity:.2}42%,100%{opacity:1}}
@keyframes interp-step{0%,100%{opacity:.25}}
@keyframes step-on{0%,14%{opacity:1}22%,100%{opacity:.25}}
.cifig .b{animation:comp-build 4s ease-in-out infinite}
.cifig .r{animation:comp-run 4s ease-in-out infinite}
.cifig .s{animation:step-on 2.4s linear infinite}
.cifig .s2{animation-delay:.4s}.cifig .s3{animation-delay:.8s}
.cifig .s4{animation-delay:1.2s}.cifig .s5{animation-delay:1.6s}.cifig .s6{animation-delay:2s}
/* determinism: jitter vs a locked cycle */
@keyframes jit{0%{transform:translateX(0)}12%{transform:translateX(4px)}24%{transform:translateX(-3px)}
40%{transform:translateX(26px)}52%{transform:translateX(2px)}68%{transform:translateX(-4px)}
82%{transform:translateX(18px)}100%{transform:translateX(0)}}
@keyframes gcpause{0%,58%{opacity:0}64%,76%{opacity:1}82%,100%{opacity:0}}
.detfig .jitrow{animation:jit 4.6s ease-in-out infinite}
.detfig .gc{animation:gcpause 4.6s ease-in-out infinite}
.detfig .cyc{animation:l-fade 1.15s steps(1,end) infinite}
.detfig .cyc.c2{animation-delay:.28s}.detfig .cyc.c3{animation-delay:.56s}
.detfig .cyc.c4{animation-delay:.84s}
/* the PLC scan cycle, going round */
@keyframes orbit{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.scanfig .orb{animation:orbit 3.4s linear infinite;transform-origin:130px 96px}
.scanfig .stage{animation:l-fade 3.4s steps(1,end) infinite}
.scanfig .stage.p2{animation-delay:1.13s}
.scanfig .stage.p3{animation-delay:2.26s}
/* IEC language strip */
.iec{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:10px;margin:16px 0}
.iec div{background:var(--panel);border:1px solid var(--line);border-radius:var(--r-sm);padding:13px}
.iec dt{font-family:var(--mono);font-size:11.5px;color:var(--accent);margin-bottom:6px}
.iec dd{margin:0;font-size:13.2px;color:var(--dim);line-height:1.5}
/* code sample */
.code{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--accent2);
border-radius:0 var(--r-sm) var(--r-sm) 0;padding:14px 16px;margin:14px 0;overflow-x:auto;
font-family:var(--mono);font-size:12.8px;line-height:1.75;color:var(--dim);white-space:pre}
.code .c{color:var(--dimmer)}
.code .k{color:var(--accent)}
.code .t{color:var(--accent2)}
.codetitle{font-family:var(--mono);font-size:11px;letter-spacing:.5px;text-transform:uppercase;
color:var(--dimmer);margin:18px 0 -6px}
`

  const ciFig = `
<svg viewBox="0 0 460 180" role="img" class="cifig">
  <text x="115" y="16" class="lbl" font-size="10" text-anchor="middle" fill="var(--accent)">COMPILED</text>
  <g class="b">
    <rect x="26" y="30" width="80" height="34" rx="6" fill="var(--panel)" stroke="var(--accent)"/>
    <text x="66" y="51" class="lbl" font-size="9" text-anchor="middle">source</text>
    <path d="M110 47 L134 47" stroke="var(--dimmer)" stroke-width="1.2"/>
    <rect x="138" y="30" width="80" height="34" rx="6" fill="var(--panel)" stroke="var(--accent)"/>
    <text x="178" y="51" class="lbl" font-size="9" text-anchor="middle">compiler</text>
  </g>
  <g class="r">
    <rect x="26" y="78" width="192" height="34" rx="6" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.6"/>
    <text x="122" y="99" class="val" font-size="11" text-anchor="middle" fill="var(--accent)">machine code, running</text>
  </g>
  <text x="122" y="136" class="lbl" font-size="9" text-anchor="middle">translated once, then it just runs</text>
  <line x1="240" y1="14" x2="240" y2="150" stroke="var(--line)"/>
  <text x="350" y="16" class="lbl" font-size="10" text-anchor="middle" fill="var(--accent2)">INTERPRETED</text>
  ${[0, 1, 2, 3, 4, 5].map((i) => `
  <g class="s${i ? ` s${i + 1}` : ''}">
    <rect x="${266 + i * 30}" y="46" width="22" height="52" rx="4" fill="var(--accent2)" opacity=".9"/>
  </g>`).join('')}
  <text x="350" y="120" class="lbl" font-size="9" text-anchor="middle">a runtime reads and executes it</text>
  <text x="350" y="136" class="lbl" font-size="9" text-anchor="middle">line by line, every time</text>
</svg>`

  const detFig = `
<svg viewBox="0 0 460 190" role="img" class="detfig">
  <text x="16" y="20" class="lbl" font-size="10" fill="var(--warn)">A GENERAL-PURPOSE RUNTIME</text>
  <g class="jitrow">
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${30 + i * 58}" y="32" width="9" height="26" rx="2" fill="var(--warn)"/>`).join('')}
  </g>
  <g class="gc">
    <rect x="212" y="28" width="72" height="34" rx="4" fill="var(--warn)" opacity=".2"/>
    <text x="248" y="49" class="lbl" font-size="8.5" text-anchor="middle" fill="var(--warn)">GC pause</text>
  </g>
  <text x="16" y="80" class="lbl" font-size="9">an average of 10 ms, and no promise about any individual cycle</text>
  <line x1="16" y1="96" x2="444" y2="96" stroke="var(--line)"/>
  <text x="16" y="122" class="lbl" font-size="10" fill="var(--ok)">A REAL-TIME RUNTIME</text>
  ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<g class="cyc${i % 4 ? ` c${(i % 4) + 1}` : ''}"><rect x="${30 + i * 52}" y="134" width="9" height="26" rx="2" fill="var(--ok)"/></g>`).join('')}
  <text x="16" y="182" class="lbl" font-size="9">every cycle, on time — or it faults rather than run late</text>
</svg>`

  const scanFig = `
<svg viewBox="0 0 400 200" role="img" class="scanfig">
  <circle cx="130" cy="96" r="62" fill="none" stroke="var(--line)" stroke-dasharray="4 5"/>
  <g class="orb"><circle cx="130" cy="34" r="6" fill="var(--accent)"/></g>
  <g class="stage">
    <rect x="72" y="4" width="116" height="26" rx="5" fill="var(--panel)" stroke="var(--accent)"/>
    <text x="130" y="21" class="lbl" font-size="9" text-anchor="middle">1 — read all inputs</text>
  </g>
  <g class="stage p2">
    <rect x="196" y="122" width="118" height="26" rx="5" fill="var(--panel)" stroke="var(--accent)"/>
    <text x="255" y="139" class="lbl" font-size="9" text-anchor="middle">2 — run the logic</text>
  </g>
  <g class="stage p3">
    <rect x="8" y="160" width="122" height="26" rx="5" fill="var(--panel)" stroke="var(--accent)"/>
    <text x="69" y="177" class="lbl" font-size="9" text-anchor="middle">3 — write all outputs</text>
  </g>
  <text x="130" y="100" class="val" font-size="12" text-anchor="middle">SCAN</text>
  <text x="130" y="116" class="lbl" font-size="9" text-anchor="middle">every cycle, forever</text>
</svg>`

  const L = (name, kind, what, where) =>
    `<tr><td>${name}</td><td class="kind">${kind}</td><td>${what}</td><td>${where}</td></tr>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / code</div>
${learnNav(esc, 'code')}
<div class="lhero">
  <h2>Code on a show</h2>
  <p class="lede">Most people in this industry write code only when a show needs it — a console macro, a bit of glue between two systems, a bridge to an automation platform. Those are three different jobs, and the reason "just use Python" is sometimes right and sometimes dangerous.</p>
</div>

${S('Start here', 'Three places code shows up, and they are not the same job', [
  'The confusion that wastes the most time is treating these as one skill. They have different tools, different constraints, and completely different definitions of the word <em>working</em>.',
])}

<div class="places">
  <div class="place">
    <h4>Scripting inside a tool</h4>
    <p>You are writing inside somebody else\'s application, using the language they chose to embed. The application decides when your code runs and what it can touch.</p>
    <p class="what">Lua in grandMA3 plugins · Python in TouchDesigner and Ableton control-surface scripts · AppleScript and JavaScript in QLab · JavaScript modules in Companion</p>
  </div>
  <div class="place">
    <h4>Glue between systems</h4>
    <p>A small program of your own that listens to one thing and talks to another — <a href="/protocols/osc/">OSC</a> in, HTTP out; a webhook that fires a cue; a translator between two vendors who will never support each other.</p>
    <p class="what">Python or Node most often · runs on a laptop or a small PC · nothing moves if it crashes, which is exactly why it is allowed to be simple</p>
  </div>
  <div class="place">
    <h4>Machine control</h4>
    <p>Something physical moves. Winches, lifts, revolves, kinetic scenery. The code must run on a guaranteed schedule, and the safety chain is separate hardware regardless of what the code does.</p>
    <p class="what">PLC platforms — TwinCAT, Siemens TIA, CODESYS · IEC 61131-3 languages · <a href="/protocols/ethercat/">EtherCAT</a> or <a href="/protocols/profinet/">PROFINET</a> underneath</p>
  </div>
</div>

${rule('Ask which of the three you are in <b>before</b> choosing a language. The third one is not a harder version of the second — it is a different discipline, with a different regulatory reality behind it.')}

${S('The vocabulary', 'What actually separates one language from another', [
  'Three distinctions do most of the work, and once you have them the landscape stops being a list of names.',
  '<b>Compiled or interpreted.</b> A compiled language (C, C++, Rust, Go) is translated to machine code once, before it runs; from then on the processor is executing it directly. An interpreted language (Python, JavaScript, Lua) ships as source and a runtime reads and executes it as it goes. Compiled is faster and less forgiving; interpreted is quicker to change and easier to get running, which is why so much show glue is written in it.',
  '<b>Managed or manual memory.</b> Most modern languages have a garbage collector: it finds memory you are no longer using and reclaims it, at a moment of its own choosing. That is a huge convenience and it is also a timing hazard, because "a moment of its own choosing" can land in the middle of something you needed to happen on time. C and C++ have no collector — you manage memory yourself, which is more work and more dangerous, and it is why they are still what real-time media engines and firmware are written in.',
  '<b>General-purpose or embedded.</b> Some languages are designed to <em>be</em> the application; some are designed to live inside one. Lua is the clearest example — small, fast to embed, easy to sandbox — which is precisely why it turns up inside so many consoles and media servers rather than as anybody\'s main language.',
])}

${fig(ciFig, 'Compiled: translated once, then it runs. Interpreted: a runtime reads it every time.')}

${S('The landscape', 'What each one is actually for', [
  'This is not a ranking. Every row is the right answer to some question and the wrong answer to most of the others.',
])}

<div class="langwrap">
<table class="langs">
  <thead><tr><th>Language</th><th>Kind</th><th>What it is good at</th><th>Where you meet it on a show</th></tr></thead>
  <tbody>
    ${L('HTML + CSS', 'markup', 'Not programming languages at all. HTML describes structure; CSS describes appearance. Neither can make a decision.', 'Touch-panel layouts, web remotes, lower-third and overlay templates, any browser-based control surface.')}
    ${L('JavaScript', 'interpreted', 'The one language every browser runs. Event-driven by nature, so it is comfortable waiting for things. Also runs outside the browser as Node.', 'Companion modules, browser-based controllers, web remotes, small OSC-to-HTTP bridges.')}
    ${L('Python', 'interpreted', 'The fastest way from an idea to a working script, with a library for almost everything. Slow in raw terms, and almost never slow enough to matter for glue.', 'TouchDesigner, Blender, Ableton remote scripts, disguise scripting, and most one-off integration tools in this industry.')}
    ${L('Lua', 'embedded', 'Tiny, fast, trivially embeddable and easy to sandbox. Designed to be hosted inside another application rather than to stand alone.', 'grandMA3 plugins, and scripting hooks inside a range of consoles, media servers and control systems.')}
    ${L('C / C++', 'compiled', 'Direct control of memory and timing, no garbage collector, no runtime surprises. Correspondingly unforgiving.', 'Fixture and console firmware, media server engines, audio DSP, plug-ins, and custom TwinCAT modules.')}
    ${L('C#', 'compiled + managed', 'Comfortable, strongly typed, excellent tooling. Garbage collected, so not for hard real time.', 'Unity-based interactive and XR work, Windows show tools, plenty of vendor SDKs.')}
    ${L('Structured Text', 'PLC (IEC 61131-3)', 'Looks like ordinary code and compiles to a guaranteed scan cycle. Written to be reviewable by someone who did not write it.', 'Automation: winches, lifts, revolves, turntables, kinetic scenery.')}
    ${L('Ladder / FBD', 'PLC (IEC 61131-3)', 'Graphical. Ladder reads like a relay schematic; function block diagram reads like a signal flow. Both are chosen for auditability, not for expressiveness.', 'The same automation systems — often alongside Structured Text in the same project.')}
    ${L('Shell / batch', 'scripting', 'Starting things, moving files, wiring existing tools together. Not for logic of any depth.', 'Show-machine startup, log collection, backup jobs, media prep.')}
  </tbody>
</table>
</div>

${bites([
  '<b>"HTML5" is not a language you program a show in.</b> It is a name for a generation of web capabilities. When a spec says "HTML5 interface", the logic is JavaScript and HTML is just the surface.',
  '<b>The language rarely decides the outcome.</b> The protocol you speak and the timing you can guarantee do. A well-written Python bridge and a well-written Node bridge will both work; neither should be moving scenery.',
  '<b>An embedded scripting language is not a promise of access.</b> "It has Lua" tells you nothing about which parts of the application that Lua can reach.',
])}

${S('The word that matters', 'Determinism, and why it disqualifies almost everything', [
  'Ask a laptop to do something every 10 milliseconds and it will, on average. Most cycles will be close to 10 ms. Some will not: the operating system schedules something else, the garbage collector runs, a network driver takes a moment, an antivirus scanner wakes up. Averages are excellent and individual guarantees are absent.',
  'For a cue-triggering bridge that is completely fine — a few milliseconds late is invisible. For a motion control loop it is not fine at all, because the loop is what keeps a moving load under control, and "usually on time" is not a property you can write a safety case around.',
  'A <b>real-time</b> system inverts the priority. It is not necessarily fast; it is <em>predictable</em>. The cycle happens every cycle, on time, and if it cannot, the system faults rather than quietly running late. That guarantee is the entire reason PLC platforms exist, and it is why show automation runs on them instead of on the laptop that is already sitting there.',
])}

${fig(detFig, 'The top row averages fine and misses cycles. The bottom row makes a promise and faults if it cannot keep it.')}

${S('The platform', 'What TwinCAT actually is', [
  'TwinCAT is Beckhoff\'s automation platform, and the thing that makes it interesting is what it does to an ordinary industrial PC: it runs a hard real-time kernel <em>alongside</em> Windows, with CPU cores reserved for the real-time side. Windows can be as busy or as badly behaved as Windows normally is, and the control task still runs on its cycle.',
  'TwinCAT 3 is developed inside Microsoft Visual Studio, which means the control engineering and any surrounding software tooling live in one environment. It supports the <a href="/standards/">IEC 61131-3</a> languages — Structured Text, Ladder, Function Block Diagram, Sequential Function Chart, Instruction List — and it will also take compiled C++ modules and models exported from MATLAB/Simulink, so a control algorithm designed in simulation can be deployed as a real-time task rather than rewritten.',
  'Underneath it, <a href="/protocols/ethercat/">EtherCAT</a> is the fieldbus: drives, I/O and sensors on one line, updated every cycle with the determinism the whole design exists to protect. Upward, an <a href="/protocols/opc-ua/">OPC UA</a> server is the usual way the automation platform exposes state to the rest of the building — which is also, in practice, how a show-control system asks it a question without being anywhere near the control loop.',
  'Everything on the show-network side of that boundary is advisory. The automation platform decides what it does.',
])}

${fig(scanFig, 'The scan cycle: inputs, logic, outputs, every cycle. Its regularity is the guarantee.')}

<p class="codetitle">the same idea in three languages</p>
<div class="code"><span class="c">-- Lua, inside a console: run when the operator presses the plugin</span>
<span class="k">local</span> level = <span class="t">Cmd</span>(<span class="t">"Attribute 'Dimmer' Group 3"</span>)
<span class="k">if</span> level &lt; <span class="t">50</span> <span class="k">then</span> <span class="t">Cmd</span>(<span class="t">"At 50"</span>) <span class="k">end</span>

<span class="c"># Python, as glue: listen for a cue, tell something else about it</span>
<span class="k">def</span> on_cue(addr, number):
    requests.post(<span class="t">"http://mediaserver/api/play"</span>, json={<span class="t">"clip"</span>: number})

<span class="c">(* Structured Text, on a PLC: this runs every cycle, forever *)</span>
<span class="k">IF</span> bEnable <span class="k">AND</span> <span class="k">NOT</span> bFault <span class="k">AND</span> fPosition &lt; fTarget <span class="k">THEN</span>
    fVelocity := fMaxVelocity;
<span class="k">ELSE</span>
    fVelocity := <span class="t">0</span>;
<span class="k">END_IF</span></div>

<p style="color:var(--dim);font-size:14.5px;margin-top:14px">Read those three again and notice what changes. The first runs when a human asks. The second runs when a message arrives. <b style="color:var(--ink)">The third runs whether anything happened or not</b> — and that is the difference the whole page is about.</p>

<div class="iec">
  <div><dt>ST — Structured Text</dt><dd>Textual, closest to conventional programming. Where most non-trivial logic lives.</dd></div>
  <div><dt>LD — Ladder</dt><dd>Drawn like a relay schematic so an electrician can read it. Still the default for interlocks.</dd></div>
  <div><dt>FBD — Function Block</dt><dd>Blocks wired together. Reads like a signal flow diagram.</dd></div>
  <div><dt>SFC — Sequential Function Chart</dt><dd>Steps and transitions. Good for a machine that moves through defined states.</dd></div>
</div>

${rule('A PLC language is chosen for how easily a <b>second person</b> can audit it, not for how quickly the first person can write it. That is the opposite of the trade-off you make when writing show glue, and it is not a criticism of either.')}

${S('The boundary', 'Where custom code is allowed to be, and where it is not', [
  'This is the same principle as the arming chain on the <a href="/learn/aerial/">drone and pyro</a> page, and it is worth stating in the same words.',
  'Functional safety — emergency stops, limits, guarding, the interlocks that stop a load before it hurts somebody — is a separate, rated channel. On a Beckhoff system that is TwinSAFE; other vendors have their own. It is certified, it is reviewed, and <b>it is not where your code goes</b>. It remains valid regardless of what the control program does, which is exactly the point: it has to be true even when the control program is wrong.',
  'Custom code belongs on the control side of that boundary and on the show network above it. It can request, sequence, report and integrate. It cannot be the reason a machine stops safely.',
])}

${bites([
  '<b>Determinism is a property of the runtime, not of your skill.</b> Well-written Python on a general-purpose OS still has no cycle guarantee. That is not something you can fix by being careful.',
  '<b>A test that passed once has proved nothing about timing.</b> Jitter is a distribution. Measure the worst case over hours, not the average over a minute.',
  '<b>Glue code becomes infrastructure quietly.</b> The script written at 2am to get through a preview is running the following tour. Give it a repository and a name the moment it survives one show.',
  '<b>Read the sandbox before designing around a scripting hook.</b> Embedded scripting is usually restricted deliberately — no filesystem, no network, no threads — and finding that out late costs a rewrite.',
])}

${S('If you are starting', 'What is actually worth learning first', [
  'For almost everyone in this industry the honest answer is <b>Python</b>, and it is not close. It reads clearly, the library ecosystem covers every protocol you are likely to meet, and it is what the tools you already use have embedded.',
  'Learn <b>JavaScript</b> when what you need lives in a browser or in Companion — which is often enough that it is a fair second.',
  'Learn <b>Lua</b> when the console you are on has it, because it is a small language and you can be useful in it in an afternoon.',
  'Learn <b>Structured Text and a PLC platform</b> when you are moving into automation — and treat that as a career decision rather than a language decision, because the discipline around it is the substantial part, not the syntax.',
  'What survives across all four is not syntax. It is the protocol and timing thinking the rest of this section is about: knowing what you are speaking, and what promises it does and does not make.',
])}

<div class="cta"><strong>Building glue on top of the index?</strong>
<p>Every collection here is plain JSON at a fixed URL with permissive CORS — no key, no rate limit — so it is a reasonable thing to hang a script off. Start at <a href="/api/v1/index.json">/api/v1/index.json</a>, and see <a href="/learn/software/">how software talks to software</a> for the protocol-versus-API-versus-SDK distinction that decides most integration questions.</p></div>
`

  return shell({
    title: 'Code on a show — languages, scripting and PLCs | showstack',
    description: 'What separates HTML, JavaScript, Python, Lua, C++ and Structured Text, where each turns up in live production, what determinism means, and what TwinCAT and IEC 61131-3 actually are — for people who write code only when a show needs it.',
    canonical: `${SITE}/learn/code/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Code on a show: languages, scripting and PLCs',
      description: 'Compiled versus interpreted, garbage collection and determinism, the IEC 61131-3 PLC languages, TwinCAT and EtherCAT, and where custom code belongs relative to a safety chain.',
      url: `${SITE}/learn/code/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
