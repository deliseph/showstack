/**
 * /learn/software/ — how one piece of show software talks to another.
 *
 * "API" and "SDK" get used interchangeably on riders and in sales decks, and
 * they are not the same kind of thing at all. Neither is a protocol. Getting
 * the three straight is what turns "can your system integrate with ours?"
 * from a hopeful question into a specific one.
 *
 * The request/response and push figures are animated because the difference
 * between polling and subscribing is a difference in *timing*, and timing is
 * the one thing a static diagram cannot show.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav } from './learn-kit.mjs'

export function learnSoftwarePage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* a call going down through SDK, API and protocol, and an answer coming back */
@keyframes down{0%{transform:translateY(0);opacity:0}10%{opacity:1}
44%{transform:translateY(116px);opacity:1}52%,100%{opacity:0}}
@keyframes up{0%,52%{transform:translateY(116px);opacity:0}58%{opacity:1}
92%{transform:translateY(0);opacity:1}98%,100%{opacity:0}}
.stackfig .call{animation:down 3.2s ease-in-out infinite}
.stackfig .ret{animation:up 3.2s ease-in-out infinite}
@keyframes poll-ask{0%,8%{transform:translateX(0);opacity:0}12%{opacity:1}30%{transform:translateX(var(--run));opacity:1}34%{opacity:0}100%{opacity:0}}
@keyframes poll-ans{0%,34%{transform:translateX(var(--run));opacity:0}38%{opacity:1}56%{transform:translateX(0);opacity:1}60%,100%{opacity:0}}
@keyframes push-ev{0%{transform:translateX(var(--run));opacity:0}6%{opacity:1}44%{transform:translateX(0);opacity:1}50%,100%{opacity:0}}
.pollfig .ask{animation:poll-ask 3s linear infinite}
.pollfig .ans{animation:poll-ans 3s linear infinite}
.pushfig .ev{animation:push-ev 2.2s linear infinite}
.pushfig .ev.d2{animation-delay:.7s}
.pushfig .ev.d3{animation-delay:1.4s}
.stackfig .layer{transition:opacity .2s}
.stackfig .layer:hover{opacity:1}
`

  const RUN = 300
  const twoBox = (leftLabel, rightLabel, inner) => `
<svg viewBox="0 0 460 132" role="img">
  <rect x="8" y="40" width="76" height="48" rx="6" fill="var(--panel)" stroke="var(--line)"/>
  <text x="46" y="68" class="lbl" text-anchor="middle">${leftLabel}</text>
  <rect x="376" y="40" width="76" height="48" rx="6" fill="var(--panel)" stroke="var(--line)"/>
  <text x="414" y="68" class="lbl" text-anchor="middle">${rightLabel}</text>
  <line x1="88" y1="64" x2="372" y2="64" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 5"/>
  ${inner}
</svg>`

  const pollFig = `<g class="pollfig" style="--run:${RUN}px">
    ${twoBox('CONSOLE', 'SERVER', `
    <g class="ask"><rect x="88" y="44" width="46" height="16" rx="3" fill="var(--accent)"/>
      <text x="111" y="56" text-anchor="middle" font-size="9" fill="var(--bg)" font-family="var(--mono)">GET</text></g>
    <g class="ans"><rect x="88" y="70" width="46" height="16" rx="3" fill="var(--accent2)"/>
      <text x="111" y="82" text-anchor="middle" font-size="9" fill="var(--bg)" font-family="var(--mono)">200</text></g>
    <text x="230" y="118" class="lbl" text-anchor="middle">ask, wait, get an answer — repeat forever</text>`)}
  </g>`

  const pushFig = `<g class="pushfig" style="--run:${RUN}px">
    ${twoBox('CONSOLE', 'SERVER', `
    <g class="ev"><rect x="88" y="48" width="40" height="14" rx="3" fill="var(--ok)"/></g>
    <g class="ev d2"><rect x="88" y="48" width="40" height="14" rx="3" fill="var(--ok)"/></g>
    <g class="ev d3"><rect x="88" y="48" width="40" height="14" rx="3" fill="var(--ok)"/></g>
    <text x="230" y="118" class="lbl" text-anchor="middle">subscribe once — the server sends when something happens</text>`)}
  </g>`

  const pollSvg = `<svg viewBox="0 0 460 132" role="img">${pollFig}</svg>`.replace('<svg viewBox="0 0 460 132" role="img"><g', '<svg viewBox="0 0 460 132" role="img"><g')

  // The three-layer picture: protocol on the wire, API as the contract, SDK
  // as the code you install.
  const stackFig = `
<svg viewBox="0 0 620 210" role="img" class="stackfig">
  <g class="call"><rect x="286" y="34" width="20" height="14" rx="3" fill="var(--accent)"/></g>
  <g class="ret"><rect x="314" y="34" width="20" height="14" rx="3" fill="var(--ok)"/></g>
  <g class="layer">
    <rect x="40" y="18" width="540" height="46" rx="7" fill="var(--panel)" stroke="var(--accent)" stroke-width="1.6"/>
    <text x="58" y="40" class="val" font-size="13" fill="var(--accent)">SDK</text>
    <text x="58" y="56" class="lbl">a library you install — wraps the API so you write three lines, not thirty</text>
  </g>
  <g class="layer">
    <rect x="40" y="76" width="540" height="46" rx="7" fill="var(--panel)" stroke="var(--accent2)" stroke-width="1.6"/>
    <text x="58" y="98" class="val" font-size="13" fill="var(--accent2)">API</text>
    <text x="58" y="114" class="lbl">the published contract — these are the calls you may make, and what comes back</text>
  </g>
  <g class="layer">
    <rect x="40" y="134" width="540" height="46" rx="7" fill="var(--panel)" stroke="var(--dom-network)" stroke-width="1.6"/>
    <text x="58" y="156" class="val" font-size="13" fill="var(--dom-network)">PROTOCOL</text>
    <text x="58" y="172" class="lbl">what actually goes over the wire — OSC, HTTP, sACN, MIDI</text>
  </g>
  <path d="M310 64 L310 76" stroke="var(--dimmer)" stroke-width="1.5" marker-end="url(#dn)"/>
  <path d="M310 122 L310 134" stroke="var(--dimmer)" stroke-width="1.5"/>
  <text x="600" y="46" class="lbl" text-anchor="end">optional</text>
  <text x="600" y="104" class="lbl" text-anchor="end">the integration point</text>
  <text x="600" y="162" class="lbl" text-anchor="end">the bytes</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / software</div>
${learnNav(esc, 'software')}
<div class="lhero">
  <h2>How software talks to software</h2>
  <p class="lede">"Does it have an API?" is the most common integration question on a show, and the words in it get used loosely enough that the answer often means nothing. Three terms, kept apart.</p>
</div>

${S('The three words', 'Protocol, API, SDK', [
  'A <b>protocol</b> is what goes over the wire. It is an agreement about bytes: what a message looks like, in what order, on which port. <a href="/protocols/osc/">OSC</a>, <a href="/protocols/sacn/">sACN</a>, <a href="/protocols/midi/">MIDI</a> and HTTP are protocols. Two devices that speak the same protocol can exchange data without either knowing anything else about the other.',
  'An <b>API</b> — application programming interface — is the published contract for talking to a specific piece of software. It says which requests you are allowed to make, what each one does, and what comes back. An API is usually carried <em>over</em> a protocol: QLab\'s API is carried over OSC; showstack\'s API is carried over HTTP.',
  'An <b>SDK</b> — software development kit — is a library you install to save yourself writing the API calls by hand. It speaks the API for you and gives you functions in your own language instead. An SDK is a convenience; the API is the thing that actually defines what is possible.',
])}

${fig(stackFig, 'The protocol is the bytes. The API is the contract. The SDK is optional convenience on top of it.')}

${rule('If a vendor says "we have an SDK", ask what the <b>API</b> underneath it does — that is what sets the limits. If they say "we support OSC", ask <b>which messages</b>, because a protocol without a documented message set is not an integration.')}

${bites([
  '<b>"It speaks OSC" is not an answer.</b> OSC is a way of formatting messages, not a set of them. Two OSC devices with no shared message list have nothing to say to each other.',
  '<b>An SDK in the wrong language is not an SDK for you.</b> A Python SDK does not help a show-control system that scripts in Lua — but the underlying API will.',
  '<b>Undocumented does not mean unusable.</b> The X32 OSC implementation is not formally published and a whole generation of show tooling is built on the community documentation of it. Treat that behaviour as reported, not guaranteed.',
  '<b>An API can be read-only.</b> Being able to <em>query</em> a device is not the same as being able to <em>drive</em> it, and riders rarely distinguish.',
])}

${S('The other question to ask', 'Does it poll, or does it push?', [
  'Once an API exists, the next thing that decides whether an integration feels good is how you find out something changed.',
  '<b>Polling</b> means asking repeatedly: "has anything changed? has anything changed?" It is simple, works through almost any network, and is always either too slow or too wasteful — the interval is a compromise between latency and load.',
  '<b>Push</b> means subscribing once and being told when something happens, over a persistent connection like a WebSocket, or by the device simply broadcasting state the way sACN does. Lower latency, far less traffic, and it needs a connection that stays open.',
  'For anything a cue depends on, you want push. Polling a media server every 500 ms to find out whether a clip ended is how a cue lands late.',
])}

<div class="figrow">
  ${fig(`<svg viewBox="0 0 460 132" role="img">${pollFig}</svg>`, 'Polling — ask, wait, answer, repeat.')}
  ${fig(`<svg viewBox="0 0 460 132" role="img">${pushFig}</svg>`, 'Push — subscribe once, hear about it when it happens.')}
</div>

${rule('Poll for state you can afford to be stale about. <b>Push for anything a cue waits on.</b>')}

${S('A worked example', 'What showstack\'s own API looks like', [
  'This site is a useful example because it is deliberately as simple as an API gets. There is no key, no login, no rate limit and no SDK required: every collection is one file of JSON at a fixed URL, served with permissive CORS so a browser can fetch it directly.',
  'That means any tool — a console macro, a spreadsheet, a media server script, another website — can ask for the data and get it. It also means the entire "API" fits in one line of documentation, which is the point.',
])}

<div class="readout" style="margin-top:6px">
  <div>GET <b>/api/v1/protocols.json</b> — every protocol, with ports and gotchas</div>
  <div>GET <b>/api/v1/standards.json</b> — every standard, with access URLs</div>
  <div>GET <b>/api/v1/gaps.json</b> — everything we know we are missing</div>
  <div>GET <b>/api/v1/index.json</b> — counts, and the list of endpoints</div>
</div>

${bites([
  '<b>Static JSON is an underrated API.</b> No server to fall over, cacheable at the edge, and it works from a file on a USB stick backstage with no network at all.',
  '<b>CORS is what makes it usable from a browser.</b> An API without it can only be called from a server, which rules out every in-page tool.',
  '<b>Versioning in the path (<code>/v1/</code>) is a promise.</b> It says the shape of this data will not change under anything already built on it.',
])}

<div class="cta"><strong>Use it.</strong>
<p>The full dataset is at <a href="/api/v1/index.json">/api/v1/index.json</a> under CC BY 4.0 — no key, no rate limit. If you build something on it, <a href="${GH}/issues/new?labels=tooling&amp;title=built+with+showstack%3A+">say so on the repo</a> and it goes on the list.</p></div>
`

  return shell({
    title: 'How software talks to software — protocol, API and SDK | showstack',
    description: 'The difference between a protocol, an API and an SDK, explained for show integration; why "it speaks OSC" is not an integration answer; and when to poll versus when to subscribe for push updates.',
    canonical: `${SITE}/learn/software/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'How software talks to software: protocol, API and SDK',
      description: 'Protocol versus API versus SDK for show integration, and polling versus push.',
      url: `${SITE}/learn/software/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
