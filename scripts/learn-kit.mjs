/**
 * Shared vocabulary for the /learn/ explainers.
 *
 * The reference pages under /signals/ answer "what is this thing". The learn
 * pages answer "why does it behave like that, and what do I do about it on
 * site". That is a different kind of page: it needs a picture of the
 * mechanism, not a table of values.
 *
 * So every explainer on every learn page is built from the same three parts,
 * in the same order, and the CSS below is the only place that rhythm is
 * defined:
 *
 *   .fig        the animated diagram - the mechanism, moving
 *   .rule       the one sentence someone should leave with
 *   .bites      what actually goes wrong when the rule is ignored
 *
 * Animation is doing real work here rather than decorating: a reflection
 * bouncing back off an unterminated line, a clock packet stuck behind a file
 * copy, a time-frequency grid filling up. Each one is the thing being
 * explained, drawn moving. Everything respects prefers-reduced-motion through
 * the global rule in pages.mjs, and every figure is aria-hidden with the same
 * information available in the prose next to it.
 */

export const LEARN_CSS = `
/* ---- section rhythm ------------------------------------------------- */
.lhero{margin:0 0 34px}
.lhero h2{font-size:clamp(28px,4.6vw,42px);letter-spacing:-.8px;line-height:1.12;margin:0 0 12px;text-wrap:balance}
.lhero .lede{font-size:17.5px;max-width:62ch}
.lsec{margin:0 0 8px;padding:30px 0 0;border-top:1px solid var(--line)}
.lsec:first-of-type{border-top:none;padding-top:0}
.lsec h3{font-family:var(--sans);font-size:22px;letter-spacing:-.3px;text-transform:none;color:var(--ink);
margin:0 0 10px;font-weight:650}
.lsec > p{color:var(--dim);font-size:15.5px;max-width:66ch}
.lsec > p + p{margin-top:12px}
.qline{font-family:var(--mono);font-size:12px;letter-spacing:.6px;text-transform:uppercase;
color:var(--accent);margin:0 0 8px}

/* ---- the animated figure -------------------------------------------- */
.fig{margin:18px 0;background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);
padding:16px;overflow:hidden}
.fig svg{display:block;width:100%;height:auto;max-width:640px;margin:0 auto}
.fig .cap{font-family:var(--mono);font-size:11.5px;color:var(--dimmer);text-align:center;margin-top:10px;
line-height:1.6}
.fig text{font-family:var(--mono)}
.fig .lbl{font-size:10.5px;fill:var(--dimmer)}
.fig .val{font-size:12px;fill:var(--ink);font-weight:600}
.figrow{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin:18px 0}
.figrow .fig{margin:0}

/* ---- the takeaway ---------------------------------------------------- */
.rule{display:flex;gap:13px;align-items:flex-start;background:color-mix(in srgb,var(--accent) 8%,transparent);
border:1px solid color-mix(in srgb,var(--accent) 32%,transparent);border-left-width:3px;
border-radius:0 var(--r-sm) var(--r-sm) 0;padding:14px 17px;margin:18px 0;font-size:15.5px;color:var(--ink)}
.rule b{color:var(--accent)}
.rule .rmark{font-family:var(--mono);font-size:11px;letter-spacing:.5px;color:var(--accent);
text-transform:uppercase;flex:0 0 auto;padding-top:3px}
.bites{margin:16px 0 0;padding:0;list-style:none}
.bites li{position:relative;padding:9px 0 9px 26px;color:var(--dim);font-size:14.8px;
border-bottom:1px solid var(--line)}
.bites li:last-child{border-bottom:none}
.bites li::before{content:"";position:absolute;left:6px;top:17px;width:6px;height:6px;border-radius:50%;
background:var(--warn)}
.bites b{color:var(--ink);font-weight:600}

/* ---- inline try-it controls ----------------------------------------- */
.tryit{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin:14px 0 0}
.tryit .f{display:flex;flex-direction:column;gap:4px;min-width:0}
.tryit label{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;color:var(--dimmer)}
.tryit input,.tryit select{padding:8px 10px;background:var(--panel);color:var(--ink);border:1px solid var(--line);
border-radius:7px;font-family:var(--mono);font-size:14px;min-height:40px;max-width:100%}
.tryit input[type=range]{accent-color:var(--accent);min-width:150px;padding:0}
.tryit .seg{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden}
.tryit .seg button{background:var(--panel);color:var(--dim);border:0;border-right:1px solid var(--line);
font-family:var(--mono);font-size:12.5px;padding:9px 13px;cursor:pointer;min-height:40px}
.tryit .seg button:last-child{border-right:0}
.tryit .seg button[aria-pressed="true"]{background:color-mix(in srgb,var(--accent) 16%,var(--panel));color:var(--accent)}
.readout{font-family:var(--mono);font-size:14.5px;color:var(--ink);background:var(--panel);
border:1px solid var(--line);border-radius:7px;padding:11px 14px;margin-top:12px;overflow-x:auto}
.readout b{color:var(--accent2)}
.readout .ok{color:var(--ok)}
.readout .err{color:var(--warn)}

/* ---- motion --------------------------------------------------------- */
@keyframes l-travel{from{offset-distance:0%}to{offset-distance:100%}}
@keyframes l-dash{to{stroke-dashoffset:-40}}
@keyframes l-fade{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes l-rise{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.l-dash{stroke-dasharray:6 8;animation:l-dash 1.2s linear infinite}
.l-fade{animation:l-fade 2s ease-in-out infinite}
.l-rise{animation:l-rise 3s ease-in-out infinite}

/* ---- hub cards ------------------------------------------------------ */
.lgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(268px,1fr));gap:16px;margin-top:24px}
.lcard{background:var(--panel);border:1px solid var(--line);border-radius:var(--r-lg);padding:22px;
display:block;color:inherit;transition:border-color .18s,transform .18s}
.lcard:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--line));transform:translateY(-2px);
text-decoration:none}
.lcard .ltag{display:inline-block;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;
letter-spacing:.6px;padding:3px 9px;border-radius:999px;margin-bottom:13px;border:1px solid var(--line);color:var(--dimmer)}
.lcard h3{margin:0 0 8px;font-size:18.5px;font-family:var(--sans);text-transform:none;letter-spacing:-.2px;
color:var(--ink);font-weight:650}
.lcard p{margin:0;color:var(--dim);font-size:14px;line-height:1.55}
.lcard .lq{margin-top:14px;padding-top:12px;border-top:1px solid var(--line);font-size:12.5px;
color:var(--dimmer);line-height:1.75}
.lcard .lq span{display:block}
@media(max-width:640px){
  .lsec h3{font-size:19px}
  .fig{padding:11px}
  .tryit input,.tryit select{width:100%}
}
`

/** An eyebrow + heading + intro, used to open every explainer section. */
export const sec = (esc) => (eyebrow, heading, paras = []) =>
  `<section class="lsec"><p class="qline">${esc(eyebrow)}</p><h3>${esc(heading)}</h3>` +
  paras.map((p) => `<p>${p}</p>`).join('')

/** The one-sentence takeaway. HTML is allowed so key terms can be marked up. */
export const rule = (html) =>
  `<div class="rule"><span class="rmark">rule</span><div>${html}</div></div>`

/** What goes wrong. Each item is HTML. */
export const bites = (items) =>
  `<ul class="bites">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`

/** A figure with an optional caption underneath. */
export const fig = (svg, caption = '', id = '') =>
  `<div class="fig"${id ? ` id="${id}"` : ''} aria-hidden="true">${svg}` +
  (caption ? `<div class="cap">${caption}</div>` : '') + `</div>`

/**
 * A learn page's hub card. Kept here so the hub and any cross-links between
 * pages describe each topic identically.
 */
/**
 * The explainers, in reading order, grouped into the five stages a signal
 * passes through on its way from a console to a person. The grouping is the
 * argument the section makes: everything here is one chain, and the last link
 * in it is a nervous system.
 */
export const LEARN_GROUPS = [
  {
    id: 'signal',
    name: 'The signal',
    lede: 'What actually happens on the wire, on the network and in the air — and why each one fails in its own characteristic way.',
  },
  {
    id: 'room',
    name: 'The room',
    lede: 'Turning a signal into something an audience experiences, and drawing it accurately enough that other departments can trust you.',
  },
  {
    id: 'system',
    name: 'The system',
    lede: 'Several technologies behaving as one thing. A shared clock, a shared coordinate system, and what happens when either is assumed rather than agreed.',
  },
  {
    id: 'build',
    name: 'What you build with',
    lede: 'Software talking to software, the languages and platforms it is written in, and the engines that draw a world sixty times a second.',
  },
  {
    id: 'person',
    name: 'The person',
    lede: 'Every threshold in this industry is a measurement of a nervous system. This is the receiver at the end of the chain, and its data sheet.',
  },
]

export const LEARN_TOPICS = [
  {
    slug: 'dmx',
    group: 'signal',
    tag: 'Control',
    title: 'DMX on the wire',
    blurb: 'Why the limit is 32 unit loads and not 32 fixtures, what a terminator actually does, and why an unterminated line fails intermittently rather than completely.',
    questions: ['Is one fixture one unit load?', 'Why does DMX need termination?', 'What is a reflection?'],
  },
  {
    slug: 'network',
    group: 'signal',
    tag: 'Networking',
    title: 'Show networks',
    blurb: 'What QoS is actually protecting on an entertainment network, how to read a subnet mask without memorising tables, and why multicast floods a switch that is not told otherwise.',
    questions: ['Why does QoS matter here?', 'How do I calculate a subnet?', 'What is IGMP snooping for?'],
  },
  {
    slug: 'wireless',
    group: 'signal',
    tag: 'RF',
    title: 'Sharing the airwaves',
    blurb: 'Simplex, half duplex and full duplex; how FDMA, TDMA, CDMA and OFDMA divide the same spectrum differently; and what WMAS changes about packing radio mics into a band.',
    questions: ['Simplex or duplex?', 'FDMA vs TDMA vs OFDMA?', 'What is WMAS?'],
  },
  {
    slug: 'connectivity',
    group: 'signal',
    tag: 'Wireless',
    title: 'Which radio, and why',
    blurb: 'LoRa, Bluetooth LE, Zigbee, Wi-Fi, UWB, CRMX and cellular all answer the same three-way trade between range, data rate and battery differently. Plus what 2G through 6G actually changed, and why a GNSS antenna on site is usually feeding a clock.',
    questions: ['LoRa or Wi-Fi or BLE?', 'What changed from 4G to 5G?', 'What is GPS really giving me?'],
  },
  {
    slug: 'sound',
    group: 'room',
    tag: 'Audio',
    title: 'Measuring and aligning sound',
    blurb: 'How a transfer-function measurement is actually taken, how to time-align a delay speaker, what separates a point source from a line array, and why the inverse square law is 6 dB.',
    questions: ['How do I measure a system?', 'How do I time a delay tower?', 'Point source or array?'],
  },
  {
    slug: 'light',
    group: 'room',
    tag: 'Light & video',
    title: 'Estimating beams and blends',
    blurb: 'Beam angle against field angle and why a data sheet flatters the fixture, how to size a beam before you rig it, and the assumptions a projection blend quietly depends on.',
    questions: ['Beam angle or field angle?', 'How wide will that beam be?', 'What does blending not fix?'],
  },
  {
    slug: 'drawings',
    group: 'room',
    tag: 'CAD & BIM',
    title: 'Drawings, models and BIM',
    blurb: 'The difference between a line and an object that knows what it weighs — and why that difference is what makes automatic paperwork, load calculation and a patch that nobody retyped possible.',
    questions: ['Geometry or data?', 'What does Braceworks actually do?', 'What are GDTF and MVR?'],
  },
  {
    slug: 'systems',
    group: 'system',
    tag: 'Integration',
    title: 'How it all runs together',
    blurb: 'One familiar system pulled apart — Google Maps — then four show systems built the same way: tracked followspots, an LED volume, AR and XR, and the timecode spine that holds a stadium together.',
    questions: ['What makes things synchronised?', 'How does an LED volume work?', 'AR, VR or XR?'],
  },
  {
    slug: 'aerial',
    group: 'system',
    tag: 'Air & fire',
    title: 'Drone shows and pyro',
    blurb: 'Nobody flies a drone show. Every aircraft flies a pre-computed path against a shared clock, corrected to centimetres by RTK. Pyro works the same way, one bus and one timecode — with the safety chain deliberately outside it.',
    questions: ['How are 500 drones coordinated?', 'What is RTK?', 'How is pyro fired on the beat?'],
  },
  {
    slug: 'software',
    group: 'build',
    tag: 'Integration',
    title: 'How software talks to software',
    blurb: 'Protocol, API and SDK are three different things, and "does it have an API" is only a useful question once you know which one you are asking about. Plus when to poll and when to subscribe.',
    questions: ['What is an API?', 'What is an SDK?', 'Poll or push?'],
  },
  {
    slug: 'code',
    group: 'build',
    tag: 'Languages',
    title: 'Code on a show',
    blurb: 'What actually separates HTML, JavaScript, Python, Lua, C++ and Structured Text; why determinism disqualifies most of them from moving scenery; and what TwinCAT and the IEC 61131-3 languages really are.',
    questions: ['Which language should I learn?', 'What is determinism?', 'What is TwinCAT for?'],
  },
  {
    slug: 'engines',
    group: 'build',
    tag: 'Content',
    title: 'Node graphs and game engines',
    blurb: 'Why a Max or TouchDesigner patch is a patch bay rather than a script, and what a real-time engine is actually for — because a rendered file, however beautiful, cannot answer a camera.',
    questions: ['How do I read a patch?', 'Pre-rendered or real-time?', 'Unreal, Unity or Godot?'],
  },
  {
    slug: 'perception',
    group: 'person',
    tag: 'Human factors',
    title: 'The person on the other end',
    blurb: 'Flicker fusion and phantom arrays, the precedence effect, the window in which sight and sound are one event, metamerism, dark adaptation — and the anticipation mechanism behind musical goosebumps.',
    questions: ['Where do the numbers come from?', 'Why do delay towers work?', 'Why does music give chills?'],
  },
  {
    slug: 'neuro',
    group: 'person',
    tag: 'Neuroscience',
    title: 'The brain as a signal system',
    blurb: 'Every sense is a transducer and they all output the same currency, which is why brain-computer interfaces and sensory substitution work at all — and why their limits are bandwidth problems you already understand.',
    questions: ['Can you really read a brain?', 'How does a cochlear implant work?', 'Can a lost sense be replaced?'],
  },
]
