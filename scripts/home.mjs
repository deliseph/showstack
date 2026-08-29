/**
 * The front door.
 *
 * This page used to be the search application. That was wrong: a wall of
 * results is a poor answer to "what is this site", and it shipped a megabyte
 * of index to somebody who wanted to read a paragraph. The search app now
 * lives at /search/ and this page has one job — say what the thing is, show
 * the shape of it, and get somebody into the right door.
 *
 * It is generated through the same shell() as the other 600 pages rather than
 * being a hand-maintained site/index.html, so the header, the nav rail, the
 * tokens and the footer cannot drift away from the rest of the site. The
 * previous hand-maintained copy had accumulated about 200 lines of CSS for
 * components it did not render.
 *
 * The one piece of real ornament is the spine: the seven stages drawn as a
 * connected line with a pulse running down it, from something physical at the
 * top to a person at the bottom. That is the site's entire argument, and
 * drawing it makes the claim visible instead of merely asserted.
 */
import { LEARN_GROUPS, LEARN_TOPICS, LEARN_CAPSTONE } from './learn-kit.mjs'

/** One-line summaries of each stage, written for somebody who has not read anything yet. */
const STAGE_NOTE = {
  foundation: 'Transducers, bits, colour, line codes, pinouts',
  signal: 'DMX, show networks, RF, radios, comms',
  room: 'Sound, light, drawings, rigging',
  system: 'Clocks, tracking, drones, pyro',
  build: 'APIs, code, engines',
  person: 'Senses, perception, neuroscience, emotion, presence',
  machine: 'Vision, AI, robots',
}

export function homePage({ esc, shell, SITE, GH, db }) {
  const n = db.counts ?? {}
  const total = db.total ?? 0
  const gaps = (db.gaps ?? []).length || db.open_gaps || 0
  const topicCount = LEARN_TOPICS.length
  const per = (id) => LEARN_TOPICS.filter((t) => t.group === id).length

  const style = `
/* --- the front door ---------------------------------------------------
   Everything here is local to this page. The header, nav, footer, tokens
   and type come from the shared shell, which is the point. */
main > .wrap{max-width:1000px}

.hero{padding:34px 0 4px}
.hero h2{font-size:clamp(30px,5.2vw,50px);line-height:1.06;letter-spacing:-1.3px;margin:0 0 20px;
text-wrap:balance;max-width:16ch;font-weight:640}
.hero h2 em{font-style:normal;color:var(--accent)}
.hero .thesis{font-size:clamp(16px,1.9vw,18.5px);color:var(--dim);line-height:1.62;margin:0 0 28px;max-width:60ch}
.hero .thesis b{color:var(--ink);font-weight:600}

/* The search field. It is the most common intent, so it is above the doors,
   but it is a field and not an index - the results live at /search/. */
.findbar{display:flex;gap:9px;flex-wrap:wrap;align-items:stretch;margin:0 0 12px;max-width:640px}
.findbar input{flex:1 1 260px;min-width:0;padding:0 16px;font-size:16px;font-family:var(--mono);
background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:var(--r-md);min-height:52px;
box-shadow:var(--shadow);transition:border-color .16s}
.findbar input::placeholder{color:var(--dimmer)}
.findbar input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.findbar button{padding:0 24px;font-size:13.5px;font-family:var(--mono);border-radius:var(--r-md);min-height:52px;
background:var(--accent);color:var(--bg);border:0;cursor:pointer;font-weight:600;letter-spacing:.2px;
transition:filter .16s}
.findbar button:hover{filter:brightness(1.08)}
.findhint{font-family:var(--mono);font-size:12px;color:var(--dimmer);margin:0 0 38px;line-height:1.7}
.findhint a{color:var(--dim);border-bottom:1px solid transparent}
.findhint a:hover{color:var(--accent);border-bottom-color:color-mix(in srgb,var(--accent) 40%,transparent);
text-decoration:none}

/* Four doors. The order is the order somebody actually needs them in:
   understand it, look it up, calculate with it, build on it. */
.doors{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,236px),1fr));gap:13px;margin:0 0 13px}
.door{display:flex;flex-direction:column;padding:22px;border-radius:var(--r-lg);border:1px solid var(--line);
background:var(--panel);color:inherit;box-shadow:var(--shadow);
transition:border-color .18s,transform .18s,box-shadow .18s}
.door:hover{border-color:color-mix(in srgb,var(--accent) 50%,var(--line));transform:translateY(-3px);
text-decoration:none;box-shadow:0 2px 4px rgba(0,0,0,.2),0 14px 30px rgba(0,0,0,.16)}
.door .dk{font-family:var(--mono);font-size:10px;letter-spacing:.8px;text-transform:uppercase;
color:var(--accent);margin-bottom:11px}
.door b{font-size:20px;color:var(--ink);margin-bottom:8px;letter-spacing:-.3px;line-height:1.2}
.door em{font-style:normal;color:var(--dim);font-size:13.8px;line-height:1.58;flex:1 1 auto}
.door .dn{margin-top:15px;padding-top:11px;border-top:1px solid var(--line);
font-family:var(--mono);font-size:11px;color:var(--dimmer);letter-spacing:.2px}

/* The capstone sits apart from the four doors because it is not a fifth
   section of the site - it is what the other four are for. */
.cap{display:block;margin:13px 0 0;padding:24px;border-radius:var(--r-lg);color:inherit;
border:1px solid color-mix(in srgb,var(--accent) 32%,var(--line));
background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 11%,var(--panel)) 0%,var(--panel) 62%);
transition:border-color .18s,transform .18s}
.cap:hover{border-color:color-mix(in srgb,var(--accent) 62%,var(--line));transform:translateY(-2px);text-decoration:none}
.cap .dk{display:block;font-family:var(--mono);font-size:10px;letter-spacing:.8px;text-transform:uppercase;
color:var(--accent);margin-bottom:9px}
.cap b{display:block;font-size:21px;color:var(--ink);margin-bottom:8px;letter-spacing:-.3px}
.cap em{display:block;font-style:normal;font-size:14.4px;color:var(--dim);line-height:1.6;max-width:72ch}

/* --- the spine -------------------------------------------------------
   Seven stages on one continuous line. The gradient runs amber (something
   physical) through teal (a signal) to violet (a person), which is the
   order of the chain, and a pulse travels the same way. */
.why{margin:56px 0 0;padding-top:34px;border-top:1px solid var(--line)}
.why h2{font-size:clamp(23px,3vw,30px);letter-spacing:-.6px;margin:0 0 12px;color:var(--ink);font-weight:640}
.why > p{color:var(--dim);font-size:16px;line-height:1.68;max-width:66ch;margin:0 0 10px}
.why > p b{color:var(--ink);font-weight:600}

.spine{position:relative;margin:30px 0 0;padding-left:38px}
.spine::before{content:"";position:absolute;left:13px;top:10px;bottom:14px;width:2px;border-radius:2px;
background:linear-gradient(180deg,var(--accent2) 0%,var(--accent) 46%,var(--dom-control) 100%);opacity:.5}
.spine::after{content:"";position:absolute;left:11px;top:10px;width:6px;height:34px;border-radius:6px;
background:linear-gradient(180deg,transparent,var(--accent),transparent);
filter:blur(1px);animation:sp-run 7s cubic-bezier(.4,0,.5,1) infinite}
@keyframes sp-run{0%{top:6px;opacity:0}8%{opacity:.95}92%{opacity:.95}100%{top:calc(100% - 44px);opacity:0}}
.stage{display:block;position:relative;padding:13px 16px;border-radius:var(--r-md);color:inherit;
border:1px solid transparent;transition:border-color .16s,background .16s,transform .16s}
.stage + .stage{margin-top:5px}
.stage:hover{background:var(--panel);border-color:var(--line);transform:translateX(3px);text-decoration:none}
.stage::before{content:"";position:absolute;left:-30px;top:19px;width:11px;height:11px;border-radius:50%;
background:var(--bg);border:2px solid var(--stage-hue,var(--accent));box-shadow:0 0 0 4px var(--bg)}
.stage:hover::before{background:var(--stage-hue,var(--accent))}
.stage .sn{font-family:var(--mono);font-size:10px;letter-spacing:1px;color:var(--dimmer);display:block;
margin-bottom:3px}
.stage b{font-size:16.5px;color:var(--ink);letter-spacing:-.2px;display:inline}
.stage .sc{font-family:var(--mono);font-size:10.5px;color:var(--stage-hue,var(--accent));margin-left:9px;
white-space:nowrap}
.stage em{display:block;font-style:normal;font-size:13.4px;color:var(--dim);line-height:1.5;margin-top:3px}
@media(max-width:520px){.spine{padding-left:30px}.spine::before{left:9px}.spine::after{left:7px}
.stage{padding:11px 12px}.stage::before{left:-25px}}

/* Four claims, each of which the site can be checked against. */
.principles{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,224px),1fr));gap:18px;margin:36px 0 0;
padding:0}
.principles div{border-left:2px solid color-mix(in srgb,var(--accent) 42%,var(--line));padding:1px 0 1px 15px}
.principles dt{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.7px;
color:var(--accent);margin-bottom:7px}
.principles dd{margin:0;color:var(--dim);font-size:13.9px;line-height:1.6}

/* The count strip. Five cells that must not overflow a 390px phone, which is
   why they are a grid with a minmax floor rather than flex percentages -
   the flex version compounded flex-basis with padding and broke at 390. */
.counts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,132px),1fr));margin:38px 0 0;
border:1px solid var(--line);border-radius:var(--r-lg);overflow:hidden;background:var(--panel)}
.counts a{padding:18px 16px;color:inherit;border-right:1px solid var(--line);border-bottom:1px solid var(--line);
transition:background .16s}
.counts a:hover{background:var(--panel2);text-decoration:none}
.counts b{display:block;font-family:var(--mono);font-size:26px;color:var(--accent);letter-spacing:-.7px;
font-variant-numeric:tabular-nums;line-height:1.1}
.counts span{display:block;font-family:var(--mono);font-size:10.5px;color:var(--dimmer);margin-top:6px;
text-transform:uppercase;letter-spacing:.5px}

/* The last block. One ask, stated plainly. */
.contrib{margin:44px 0 0;padding:22px 24px;border:1px solid var(--line);border-radius:var(--r-lg);
background:var(--panel2)}
.contrib h2{margin:0 0 7px;font-size:18px;letter-spacing:-.3px;color:var(--ink);font-weight:640}
.contrib p{margin:0 0 12px;color:var(--dim);font-size:14.4px;line-height:1.62;max-width:70ch}
.contrib p:last-child{margin-bottom:0}
.cbtns{display:flex;gap:9px;flex-wrap:wrap}
.cbtns a{font-family:var(--mono);font-size:12.5px;padding:10px 15px;border-radius:999px;
border:1px solid var(--line);background:var(--panel);color:var(--dim);white-space:nowrap}
.cbtns a:hover{border-color:var(--accent);color:var(--accent);text-decoration:none}
.cbtns a.primary{background:color-mix(in srgb,var(--accent) 14%,var(--panel));color:var(--accent);
border-color:color-mix(in srgb,var(--accent) 42%,var(--line))}
@media(prefers-reduced-motion:reduce){.spine::after{display:none}}
`

  const HUE = ['var(--accent2)', 'var(--dom-network)', 'var(--dom-audio)', 'var(--accent)',
    'var(--ok)', 'var(--dom-control)', 'var(--dom-visual)']

  const spine = LEARN_GROUPS.map((g, i) => {
    const c = per(g.id)
    return `<a class="stage" href="/learn/#${esc(g.id)}" style="--stage-hue:${HUE[i]}">` +
      `<span class="sn">STAGE ${String(i + 1).padStart(2, '0')}</span>` +
      `<b>${esc(g.name)}</b><span class="sc">${c} explainer${c === 1 ? '' : 's'}</span>` +
      `<em>${esc(STAGE_NOTE[g.id] ?? '')}</em></a>`
  }).join('')

  const COUNTLABEL = { protocols: 'protocols', standards: 'standards', software: 'software', hardware: 'hardware', terms: 'glossary terms' }
  const COUNTHREF = { protocols: '/protocols/', standards: '/standards/', software: '/software/', hardware: '/hardware/', terms: '/glossary/' }
  const counts = ['protocols', 'standards', 'software', 'hardware', 'terms']
    .filter((k) => n[k] != null)
    .map((k) => `<a href="${COUNTHREF[k]}"><b>${n[k]}</b><span>${COUNTLABEL[k]}</span></a>`).join('')

  const body = `
<section class="hero">
  <h2>Everything a show runs on, <em>and why it behaves like that</em></h2>
  <p class="thesis">An open, citable index of live entertainment technology &mdash; every protocol, standard,
  tool and box, with a source on each fact &mdash; and <b>${topicCount} animated explainers arranged as one
  chain</b>, from a vibration in the air to a feeling in a person. Free, no account, no tracking.</p>

  <form class="findbar" action="/search/" method="get" role="search">
    <input id="q" name="q" type="search" placeholder="sACN, 5568, 吊桿, D8 Plus, RT60&hellip;"
           aria-label="Search showstack" autocomplete="off" spellcheck="false">
    <button type="submit">Search</button>
  </form>
  <p class="findhint">Searches names, ports, vendors, gotchas and 繁體中文 at once.
  Or browse <a href="/protocols/">protocols</a>, <a href="/standards/">standards</a>,
  <a href="/software/">software</a>, <a href="/hardware/">hardware</a>, <a href="/glossary/">glossary</a>.</p>
</section>

<section class="doors" aria-label="Ways in">
  <a class="door" href="/learn/">
    <span class="dk">Understand it</span>
    <b>Learn</b>
    <em>Why DMX needs a terminator, what QoS is protecting, why 128 is not half brightness, what may hang over
    people, and how a feeling gets built. Every diagram moves; most have a dial you can turn.</em>
    <span class="dn">${topicCount} explainers &middot; 7 stages &middot; one chain</span>
  </a>
  <a class="door" href="/search/">
    <span class="dk">Look it up</span>
    <b>The index</b>
    <em>Protocols with ports and gotchas, standards with access links, software with what it actually speaks,
    hardware with what is on the back, and a bilingual glossary. A citation on every fact.</em>
    <span class="dn">${total} entries &middot; ${gaps} open gaps</span>
  </a>
  <a class="door" href="/tools/">
    <span class="dk">Work it out</span>
    <b>Field tools</b>
    <em>Subnets, DMX unit loads, bridle geometry, voltage drop, speaker delay, noise dose, RF intermod,
    frame budget, pyro fire time. The same arithmetic the test suite runs.</em>
    <span class="dn">offline once loaded &middot; no login</span>
  </a>
  <a class="door" href="/build/">
    <span class="dk">Build on it</span>
    <b>The API</b>
    <em>The whole dataset as JSON, no key and no rate limit, plus eight recipes you can paste: an offline port
    lookup, a console macro, a Companion module, a spreadsheet, a flashcard deck, an AI tool definition.</em>
    <span class="dn">CC BY 4.0 &middot; MIT &middot; no key</span>
  </a>
</section>

<a class="cap" href="/learn/${esc(LEARN_CAPSTONE.slug)}/">
  <span class="dk">And what it is all for</span>
  <b>${esc(LEARN_CAPSTONE.title)}</b>
  <em>You cannot design a feeling, only the conditions and the timing. Attention, arousal and expectation as
  materials &mdash; and why the peak and the ending are the only two moments that survive.</em>
</a>

<section class="why">
  <h2>The logic of the whole thing</h2>
  <p>Most of this knowledge lives in people&rsquo;s heads and in PDFs nobody can find. It is real, it is
  checkable, and it is scattered across a dozen trades that rarely read each other&rsquo;s documentation.
  <b>showstack puts it in one place, in one order, with a source on it.</b></p>
  <p>The order is the argument. Everything follows one chain &mdash; something physical becomes a signal, the
  signal survives a wire and a network and the air, it becomes something in a room, several systems agree about
  time and space, and it arrives at a person. Each stage answers the questions the one before it raised.</p>

  <div class="spine">${spine}</div>

  <dl class="principles">
    <div><dt>Everything is cited</dt><dd>Every fact names its source, and where we could not find one the field
    is left visibly empty rather than guessed. ${gaps} of those gaps are open right now.</dd></div>
    <div><dt>Everything is connected</dt><dd>Every entry links to the explainers that cover its mechanism, and
    every explainer lists what it just talked about as things you can look up.</dd></div>
    <div><dt>Everything is open</dt><dd>Data under CC BY 4.0, code under MIT, a JSON API with no key and no
    rate limit. Fork it, ship it, build on it.</dd></div>
    <div><dt>Bilingual by design</dt><dd>The glossary carries 繁體中文 alongside English,
    including the regional variants and false friends that cause real confusion on headset.</dd></div>
  </dl>

  <div class="counts">${counts}</div>
</section>

<section class="contrib">
  <h2>Built by people who run shows, for people who run shows.</h2>
  <p>If a field is empty or wrong, the fix is one file and one pull request, and your handle goes on the entry
  permanently. If it saved you an argument at load-in, that is the whole point.</p>
  <div class="cbtns">
    <a class="primary" href="/build/">Build something on the API &rarr;</a>
    <a href="${GH}/blob/main/CONTRIBUTING.md">How to contribute</a>
    <a href="${GH}">Source on GitHub</a>
    <a href="https://github.com/sponsors/deliseph" rel="noopener">Support the work</a>
  </div>
</section>`

  return shell({
    title: 'showstack — the technology behind live shows, explained',
    description: `An open, citable index of live entertainment technology: ${total} protocols, standards, software and hardware entries with a source on every fact, plus ${topicCount} animated explainers from signal to sensation. Free JSON API, no key.`,
    canonical: `${SITE}/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'showstack',
      url: `${SITE}/`,
      description: 'Open, citable index of live entertainment technology, with animated explainers from signal to sensation.',
      inLanguage: ['en', 'zh-Hant'],
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/search/?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    body,
    extraStyle: style,
  })
}
