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
.tryit .seg{display:inline-flex;border:1px solid var(--rule-strong);border-radius:8px;overflow:hidden}
.tryit .seg button{background:var(--panel);color:var(--dim);border:0;border-right:1px solid var(--line);
font-family:var(--mono);font-size:12.5px;padding:0 14px;cursor:pointer;min-height:44px}
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

/* ---- ambient motion for figures that are otherwise still -------------
   A diagram of a state - a topology, a stack, a spectrum plan - has nothing
   inherently moving in it. These give one element a slow, low-amplitude
   pulse so the eye is told where the mechanism is, without the figure
   becoming a light show. All of them stop under prefers-reduced-motion via
   the global rule in pages.mjs. */
@keyframes l-breathe{0%,100%{opacity:.42}50%{opacity:1}}
@keyframes l-sweep{0%{transform:translateX(0);opacity:0}8%{opacity:1}
88%{transform:translateX(var(--sweep,300px));opacity:1}96%,100%{opacity:0}}
@keyframes l-ripple{0%{r:6;opacity:.85}100%{r:var(--rmax,54);opacity:0}}
@keyframes l-glow{0%,100%{stroke-opacity:.35}50%{stroke-opacity:1}}
.l-breathe{animation:l-breathe 3.2s ease-in-out infinite}
.l-sweep{animation:l-sweep 2.6s linear infinite}
.l-ripple{animation:l-ripple 2.8s ease-out infinite}
.l-glow{animation:l-glow 2.6s ease-in-out infinite}

/* ---- the slider strip -------------------------------------------------
   Used wherever one number decides what the figure shows. The value is
   always echoed in the label, because a slider with no number on it is a
   toy rather than an instrument. */
.dial{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-end;margin:14px 0 0;
padding:14px 16px;background:var(--panel);border:1px solid var(--line);border-radius:var(--r-md)}
.dial .d{display:flex;flex-direction:column;gap:6px;flex:1 1 190px;min-width:0}
.dial label{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;
color:var(--dimmer);display:flex;justify-content:space-between;gap:10px}
.dial label b{color:var(--accent2);font-weight:600;text-transform:none;letter-spacing:0;font-size:12.5px}
.dial input[type=range]{accent-color:var(--accent);width:100%;min-width:0;height:22px}
.dial .seg{display:inline-flex;border:1px solid var(--rule-strong);border-radius:8px;overflow:hidden;align-self:flex-end}
.dial .seg button{background:var(--panel2);color:var(--dim);border:0;border-right:1px solid var(--line);
font-family:var(--mono);font-size:12px;padding:0 13px;cursor:pointer;min-height:44px}
.dial .seg button:last-child{border-right:0}
.dial .seg button[aria-pressed="true"]{background:color-mix(in srgb,var(--accent) 18%,var(--panel));color:var(--accent)}
.verdict{font-family:var(--mono);font-size:14px;color:var(--ink);background:var(--panel2);
border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:0 var(--r-sm) var(--r-sm) 0;
padding:12px 15px;margin-top:12px;line-height:1.65}
.verdict b{color:var(--accent2)}
.verdict .ok{color:var(--ok)}
.verdict .err{color:var(--warn)}

/* ---- the learn sub-nav ------------------------------------------------
   Twenty pages is too many for the site nav, and a reader on one explainer
   almost always wants a neighbouring one. Grouped by stage so the rail is
   also a reminder of where in the chain you are standing. */
.lnav{margin:0 0 22px;padding:0 0 14px;border-bottom:1px solid var(--line)}
.lnav .lrail{display:flex;gap:5px;overflow-x:auto;-webkit-overflow-scrolling:touch;
scrollbar-width:none;padding-bottom:2px;
-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 26px),transparent);
mask-image:linear-gradient(90deg,#000 calc(100% - 26px),transparent)}
.lnav .lrail::-webkit-scrollbar{display:none}
.lnav a{flex:0 0 auto;font-family:var(--mono);font-size:12px;padding:0 12px;border-radius:7px;
display:inline-flex;align-items:center;min-height:44px;
color:var(--dim);border:1px solid transparent;white-space:nowrap;text-decoration:none}
.lnav a:hover{color:var(--accent);background:var(--panel);text-decoration:none}
.lnav a.active{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,transparent);
background:color-mix(in srgb,var(--accent) 10%,transparent)}
.lnav .gsep{flex:0 0 auto;align-self:center;font-family:var(--mono);font-size:10px;letter-spacing:.6px;
text-transform:uppercase;color:var(--dimmer);padding:0 6px 0 10px;border-left:1px solid var(--line);
margin-left:5px;white-space:nowrap}
.lnav .gsep:first-child{border-left:none;margin-left:0;padding-left:0}

/* ---- the experience note --------------------------------------------
   One per page, always in the same place, always the same shape: what this
   mechanism does to a person. Visually distinct from .rule because it is a
   different kind of claim - a rule is about the equipment, this is about the
   room. */
.xnote{margin:26px 0;padding:18px 20px;border:1px solid color-mix(in srgb,var(--accent2) 32%,var(--line));
border-radius:var(--r-md);background:color-mix(in srgb,var(--accent2) 6%,transparent)}
.xnote .xk{display:block;font-family:var(--mono);font-size:10.5px;letter-spacing:.7px;text-transform:uppercase;
color:var(--accent2);margin-bottom:9px}
.xnote p{margin:0;color:var(--ink);font-size:15.2px;line-height:1.65;max-width:64ch}
.xnote p b{color:var(--accent2)}
.xnote .xl{display:inline-flex;align-items:center;min-height:44px;margin-top:6px;
font-family:var(--mono);font-size:12px;color:var(--accent2)}

/* Position in the chain, on every explainer. */
.cpos{display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap;margin:-8px 0 24px;
font-family:var(--mono);font-size:11px;color:var(--ink-faint);letter-spacing:.2px}
.cpos a{color:var(--ink-faint);display:inline-flex;align-items:center;gap:6px;min-height:32px}
.cpos a b{color:var(--signal);font-weight:600}
.cpos a:hover{color:var(--ink-muted);text-decoration:none}
.cpos a:hover b{text-decoration:underline}
.cpos > span{position:relative;padding-left:15px}
.cpos > span::before{content:"";position:absolute;left:0;top:50%;width:5px;height:5px;margin-top:-2.5px;
border-radius:50%;background:var(--rule-strong)}
.cpos .cread{color:var(--verified)}
.cpos .cread::before{background:var(--verified)}

/* ---- hub cards ------------------------------------------------------ */
.lgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(268px,1fr));gap:16px;margin-top:24px}
.lcard{background:var(--panel);border:1px solid var(--line);border-radius:var(--r-lg);padding:22px;
display:block;color:inherit;transition:border-color .18s,transform .18s}
.lcard:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--line));transform:translateY(-2px);
text-decoration:none}
/* The question opens the card. It is set as a question, in the accent, above
   a quieter title - a gap first, the label second. */
.lcard .lqlead{display:block;font-size:15px;line-height:1.4;color:var(--signal);font-weight:600;
margin-bottom:9px;letter-spacing:-.1px}
.lcard h3{margin:0 0 8px;font-size:17px;font-family:var(--sans);text-transform:none;letter-spacing:-.2px;
color:var(--ink);font-weight:600}
.lcard p{margin:0;color:var(--dim);font-size:14px;line-height:1.55}
.lcard .lfoot{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px}
.lcard .ltag{display:inline-block;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;
letter-spacing:.6px;padding:3px 9px;border-radius:999px;border:1px solid var(--rule);color:var(--ink-faint)}
.lcard .lmin{font-family:var(--mono);font-size:11px;color:var(--ink-faint);font-variant-numeric:tabular-nums}
.lcard .lchecked{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.7px;
color:var(--signal);border:1px solid color-mix(in srgb,var(--signal) 45%,transparent);
border-radius:999px;padding:3px 9px}
.lcard .ldone{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.7px;
color:var(--verified);border:1px solid color-mix(in srgb,var(--verified) 45%,transparent);
border-radius:999px;padding:3px 9px;margin-left:auto}
.lcard .ldone + .lchecked{margin-left:0}
.lcard[data-read] .lqlead{color:var(--ink-muted)}
.lcard[data-read]{border-color:color-mix(in srgb,var(--verified) 26%,var(--rule))}
.lcard .lq{margin-top:13px;padding-top:12px;border-top:1px solid var(--rule);font-size:12.5px;
color:var(--dimmer);line-height:1.75}
.lcard .lq span{display:block}
/* Progress. Stored on this device only, and said so in the interface rather
   than in a policy page. */
.lprog{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:22px 0 0;padding:14px 16px;
border:1px solid var(--rule);border-radius:var(--r-md);background:var(--surface-raised)}
.lprog .lbar{flex:1 1 180px;height:6px;border-radius:3px;background:var(--surface-sunken);overflow:hidden;
min-width:120px}
.lprog .lbar i{display:block;height:100%;background:var(--verified);border-radius:3px;
transition:width var(--dur-slow) var(--ease-out)}
.lprog .lnum{font-family:var(--mono);font-size:13px;color:var(--ink);font-variant-numeric:tabular-nums;
flex:0 0 auto}
.lprog .lnote{font-family:var(--mono);font-size:10.5px;color:var(--ink-faint);flex:1 1 100%;line-height:1.5}
.lprog button{font-family:var(--mono);font-size:11.5px;padding:0 13px;min-height:44px;border-radius:var(--r-pill);
border:1px solid var(--rule-strong);background:var(--surface);color:var(--ink-muted);cursor:pointer;flex:0 0 auto}
.lprog button:hover{color:var(--signal);border-color:var(--signal)}
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

/**
 * The experience note.
 *
 * Every page on this site is engineering in service of something that happens
 * to a person, and that link is usually left implicit. This makes it explicit
 * once per page, in the same place, in the same voice - a single paragraph
 * saying what this page's mechanism does to somebody in the room, pointing at
 * the practice page that treats it as a design material.
 *
 * It is deliberately short. The moment it becomes a second essay it stops
 * being read.
 */
export const xnote = (html) =>
  `<aside class="xnote"><span class="xk">In experience terms</span><p>${html}</p>
  <a class="xl" href="/learn/experience/">Experience architecture &rarr;</a></aside>`

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
    id: 'foundation',
    name: 'Foundations',
    lede: 'How something physical becomes a signal, how that signal is written down as numbers, how it survives a wire, and what the plug on the end of it actually carries.',
  },
  {
    id: 'signal',
    name: 'The signal',
    lede: 'What happens on the control bus, on the network, in the air and on the crew\'s headsets — and why each one fails in its own characteristic way.',
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
    lede: 'Every threshold in this industry is a measurement of a nervous system. What it can detect, how it works, how a feeling is built, and what makes somebody believe they are somewhere.',
  },
  {
    id: 'machine',
    name: 'Machines that copy us',
    lede: 'Each of these is an attempt to do in a tool what the previous stage does in a person: read the world, decide something about it, and act. Seeing them that way is what stops them being magic.',
  },
]

/** The capstone. It sits above the stages rather than inside one. */
export const LEARN_CAPSTONE = {
  slug: 'experience',
  tag: 'The practice',
  title: 'Experience architecture',
  blurb: 'What you do with the whole chain when the job is not "make the signal arrive" but "make something happen to a person over ninety minutes". Attention, arousal and expectation as materials — and why the peak and the ending are the only two moments that survive.',
  questions: ['How do I structure a running order?', 'What actually gets remembered?', 'How should it fail?'],
}

/**
 * Measured reading time per explainer slug, filled in by buildPages() after
 * the explainers render and before the /learn/ index does. Empty during tests
 * that import this module on its own, which is why every read is guarded.
 */
export let LEARN_READING = new Map()
export function setLearnReading(m) { LEARN_READING = m }

export const LEARN_TOPICS = [
  {
    slug: 'transducers',
    group: 'foundation',
    tag: 'Sensing',
    title: 'Turning the world into a voltage',
    blurb: 'Dynamic and condenser microphones as signal problems and what phantom power actually feeds; why a balanced line rejects interference; what a ground loop is; and why an absolute encoder is a safety decision rather than a resolution one.',
    questions: ['What does phantom power do?', 'Why is there a hum?', 'Absolute or incremental?'],
  },
  {
    slug: 'bits',
    group: 'foundation',
    tag: 'Digital',
    title: 'Numbers that stand for signals',
    blurb: 'Sample rate, bit depth and 6 dB per bit — the same fact that explains 24-bit audio and 16-bit fixture control. Then the short list of arithmetic behind every delay, reverb, filter and distortion you have ever used.',
    questions: ['What does 24-bit buy me?', 'Why does a mover step?', 'How does reverb work?'],
  },
  {
    slug: 'colour',
    group: 'foundation',
    tag: 'Colour & video',
    title: 'How a colour becomes a number',
    blurb: 'What #ffffff actually is and why colours are written in base 16, why 128 is not half the light, what a colour space adds that the numbers cannot, and the round trip from photons to code values and back to photons.',
    questions: ['What is a hex code?', 'Why is 128 not half brightness?', 'What is 4:2:0 costing me?'],
  },
  {
    slug: 'encoding',
    group: 'foundation',
    tag: 'On the wire',
    title: 'How a one gets down a wire',
    blurb: 'A receiver has no clock of its own, which is the whole reason line codes exist. Manchester, NRZI and block codes; parity, checksum, CRC and forward error correction; and why almost every show protocol chooses UDP.',
    questions: ['What is Manchester coding?', 'Checksum or CRC?', 'Why UDP and not TCP?'],
  },
  {
    slug: 'connectors',
    group: 'foundation',
    tag: 'Pinouts',
    title: 'The same plug is not the same signal',
    blurb: 'Connector, pinout and protocol are three independent layers. What a USB-C port really carries in each mode, why Thunderbolt and DisplayPort share a socket but only work one way round, and the show connectors that catch everybody once.',
    questions: ['Why does this cable not work?', 'What is on a USB-C pin?', 'Is 3-pin DMX fine?'],
  },
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
    slug: 'video',
    group: 'signal',
    tag: 'Video',
    title: 'Why the picture is black',
    blurb: 'The three negotiations a video chain has to pass before a single pixel moves, why every one of them fails the same way, and why a frame-timing offset that is invisible on one screen is unmistakable across a seam.',
    questions: ['Why is the screen black?', 'What is EDID doing?', 'Why does the seam tear?'],
  },
  {
    slug: 'comms',
    group: 'signal',
    tag: 'Talkback',
    title: 'Getting the crew to hear each other',
    blurb: 'Partyline, matrix, IP and wireless intercom; why a walkie-talkie is not an intercom and never becomes one; what latency does to a cue call; and the licensing question nobody asks until a show travels.',
    questions: ['Partyline or matrix?', 'Why not just use radios?', 'How much latency is too much?'],
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
    slug: 'power',
    group: 'room',
    tag: 'Power',
    title: 'Power, earth and the things that trip',
    blurb: 'Why three phases cancel and what stops them, why a neutral full of LED fixtures can carry more than any phase, and why the device that protects a cable and the device that protects a person are not the same device.',
    questions: ['Why is my neutral hot?', 'Breaker or RCD?', 'Why does it brown out?'],
  },
  {
    slug: 'rigging',
    group: 'room',
    tag: 'Machinery',
    title: 'Hoists and the safety chain',
    blurb: 'What D8, D8 Plus and C1 actually permit and where those words come from; what a safety relay does that a stop button does not; the standards behind an emergency stop; and how far a load keeps moving after somebody presses it.',
    questions: ['What may hang over people?', 'How is a safety relay different?', 'What does SIL 3 mean?'],
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
    slug: 'senses',
    group: 'person',
    tag: 'The channels',
    title: 'How each sense tells things apart',
    blurb: 'Two ears turning a 700-microsecond delay into a direction. Three overlapping cones making a colour that is not in the light. A receptor that cannot tell chilli from heat. None of it is measurement — all of it is inference from a pattern.',
    questions: ['How do we hear direction?', 'How do eyes see colour?', 'Why does chilli feel hot?'],
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
  {
    slug: 'emotion',
    group: 'person',
    tag: 'Feeling',
    title: 'How a feeling is built',
    blurb: 'Emotion is not something a show transmits. It is constructed from bodily arousal plus an appraisal of what it means — which is why the same racing heart is terror in one room and joy in another, and why contrast is the only real lever.',
    questions: ['Where does emotion come from?', 'Why does an audience amplify itself?', 'What do people actually remember?'],
  },
  {
    slug: 'presence',
    group: 'person',
    tag: 'Being there',
    title: 'Being somewhere',
    blurb: 'The senses nobody counts — balance, proprioception, interoception — and how a body decides it is in a place, owns a limb, and caused a thing to happen. The mechanism a set, a room and a headset are all working on.',
    questions: ['What are the other senses?', 'Why does VR feel real?', 'What breaks the illusion?'],
  },
  {
    slug: 'reading',
    group: 'machine',
    tag: 'Machine vision',
    title: 'How a machine reads the world',
    blurb: 'A QR code that still scans with a hole in it, OCR that turns a photographed page into text, a camera that finds a face — three versions of the same trick, and all of them are engineered around a human limitation rather than a machine one.',
    questions: ['How does a QR code survive damage?', 'How does OCR actually work?', 'How does a camera find a face?'],
  },
  {
    slug: 'ai',
    group: 'machine',
    tag: 'AI',
    title: 'What AI is actually doing',
    blurb: 'A network of weights that learned a mapping, run forwards. How training differs from the thing you use, why an image generator starts from noise, what a language model is predicting, and where all of it is genuinely useful on a show.',
    questions: ['How does a neural network work?', 'How is an AI image made?', 'What is a language model doing?'],
  },
  {
    slug: 'devices',
    group: 'machine',
    tag: 'Robots & IoT',
    title: 'Robots, animatronics and connected things',
    blurb: 'How a machine decides where its own arm is, why a show robot is a safety case before it is a puppet, and what actually happens when a smart device joins a network — Matter, Thread, hubs, and why the cloud is a single point of failure.',
    questions: ['How does a robot know where it is?', 'How is an animatronic driven?', 'What is Matter and Thread?'],
  },
]

/**
 * The sub-nav that appears at the top of every explainer. Twenty pages is far
 * more than the site nav can carry, and somebody reading one of these almost
 * always wants a neighbour rather than a different section of the site.
 * Grouped by stage so the rail doubles as a reminder of where in the chain
 * the current page sits.
 */
export const learnNav = (esc, currentSlug) => {
  let html = ''
  for (const g of LEARN_GROUPS) {
    html += `<span class="gsep">${esc(g.name)}</span>`
    for (const t of LEARN_TOPICS.filter((t) => t.group === g.id)) {
      const on = t.slug === currentSlug
      html += `<a href="/learn/${esc(t.slug)}/"${on ? ' class="active" aria-current="page"' : ''}>${esc(t.title)}</a>`
    }
  }
  const cap = LEARN_CAPSTONE.slug === currentSlug
  return `<nav class="lnav" aria-label="Explainers"><div class="lrail">` +
    `<a href="/learn/"${currentSlug ? '' : ' class="active" aria-current="page"'}>All</a>` +
    `<a href="/learn/${esc(LEARN_CAPSTONE.slug)}/"${cap ? ' class="active" aria-current="page"' : ''}>` +
    `${esc(LEARN_CAPSTONE.title)}</a>${html}</div></nav>` + chainPosition(esc, currentSlug)
}

/**
 * Where this page sits in the chain of 27.
 *
 * A reader who arrives from a search engine has no idea any of this is
 * ordered. Two numbers - which stage, and where inside it - plus the reading
 * time, is enough to place the page without a sidebar or a progress widget.
 */
export function chainPosition(esc, slug) {
  const t = LEARN_TOPICS.find((x) => x.slug === slug)
  if (!t) return ''
  const gi = LEARN_GROUPS.findIndex((g) => g.id === t.group)
  const g = LEARN_GROUPS[gi]
  const within = LEARN_TOPICS.filter((x) => x.group === t.group)
  const n = within.findIndex((x) => x.slug === slug) + 1
  // A page cannot know its own reading time while it is being rendered, so
  // this leaves a token that buildPages fills in once the page exists.
  return `<div class="cpos">` +
    `<a href="/learn/#${esc(g.id)}"><b>Stage ${gi + 1} of ${LEARN_GROUPS.length}</b> &middot; ${esc(g.name)}</a>` +
    `<span>${n} of ${within.length} in this stage</span>` +
    `<span class="cmin">__READMIN__ min read</span>` +
    `<span class="cread" data-slug="${esc(slug)}" hidden>read</span></div>`
}
