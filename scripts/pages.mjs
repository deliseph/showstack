/**
 * Static page generation.
 *
 * The search app at / is good for someone who already knows showstack exists.
 * It is useless for the person typing "what port does sACN use" into Google at
 * 1am, because a single-page app gives a crawler one page and one title.
 *
 * So every entry also gets its own static HTML page with the answer in the
 * server-rendered body, a real <title>, a real meta description, and JSON-LD.
 * Plus a page per port number, because "port 5568" and "udp 6454" are what
 * people actually type.
 *
 * This is the acquisition engine. The search app is the retention engine.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PAIRS, comparisonPage, comparisonIndex } from './compare.mjs'
import { interopPage } from './interop.mjs'
import { toolsPage } from './tools.mjs'
import { networkPage } from './network.mjs'
import { rfPage } from './rf.mjs'
import { signalsPage } from './signals.mjs'
import { SUPER_DOMAINS, superDomain } from './graph.mjs'

const SITE = process.env.SHOWSTACK_SITE ?? 'https://showstack.dev'
const REPO = process.env.SHOWSTACK_REPO ?? 'deliseph/showstack'
const GH = `https://github.com/${REPO}`

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/**
 * Serialise JSON for embedding inside a <script> block.
 *
 * JSON.stringify does not escape `<`, so a contributed field containing the
 * literal text `</script>` would close the block early and turn everything
 * after it into live markup. This project merges YAML written by strangers,
 * so that is a real path, not a theoretical one.
 *
 * < and friends are ordinary JSON string escapes: the parsed value is
 * byte-identical, and no sequence of characters in the data can terminate the
 * enclosing tag. This is the standard mitigation and it costs nothing.
 */
const jsonForScript = (obj) =>
  JSON.stringify(obj).replace(/[<>&\u2028\u2029]/g, (c) => ({
    '<': '\\u003c', '>': '\\u003e', '&': '\\u0026',
    '\u2028': '\\u2028', '\u2029': '\\u2029',
  }[c]))

const trunc = (s, n = 155) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t }

const CSS = `
:root{color-scheme:dark;
--bg:#0b0e14;--panel:#121722;--panel2:#19212f;--line:#242f42;--ink:#e9edf4;--dim:#9aa8bc;--dimmer:#6e7c94;
--accent:#5fd4bb;--accent2:#f0b866;--warn:#ec7f66;--ok:#8cc96a;
--dom-visual:#ffb454;--dom-audio:#4fd1ff;--dom-network:#6ea8fe;--dom-safety:#ec7f66;--dom-control:#b98cf2;
--glow:rgba(95,212,187,.06);--shadow:0 1px 2px rgba(0,0,0,.35),0 8px 24px rgba(0,0,0,.28);
--r-sm:8px;--r-md:12px;--r-lg:16px;
--mono:"JetBrains Mono",ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
--sans:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
:root[data-theme="light"]{color-scheme:light;
--bg:#f6f7f9;--panel:#ffffff;--panel2:#edf0f4;--line:#dbe1ea;--ink:#141922;--dim:#46536a;--dimmer:#67748b;
--accent:#0e8a72;--accent2:#8f6110;--warn:#b6462e;--ok:#3a7a22;
--dom-visual:#8f5a10;--dom-audio:#116e93;--dom-network:#22579e;--dom-safety:#b6462e;--dom-control:#7440ab;
--glow:transparent;--shadow:0 1px 2px rgba(16,24,40,.06),0 4px 16px rgba(16,24,40,.07)}
@media(prefers-color-scheme:light){:root:not([data-theme="dark"]){color-scheme:light;
--bg:#f6f7f9;--panel:#ffffff;--panel2:#edf0f4;--line:#dbe1ea;--ink:#141922;--dim:#46536a;--dimmer:#67748b;
--accent:#0e8a72;--accent2:#8f6110;--warn:#b6462e;--ok:#3a7a22;
--dom-visual:#8f5a10;--dom-audio:#116e93;--dom-network:#22579e;--dom-safety:#b6462e;--dom-control:#7440ab;
--glow:transparent;--shadow:0 1px 2px rgba(16,24,40,.06),0 4px 16px rgba(16,24,40,.07)}}
*{box-sizing:border-box}html,body{margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.6;
-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
::selection{background:color-mix(in srgb,var(--accent) 30%,transparent)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:800px;margin:0 auto;padding:0 20px}
header{border-bottom:1px solid var(--line);padding:14px 0;position:sticky;top:0;z-index:30;
background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
header::after{content:"";position:absolute;inset:auto 0 -1px 0;height:1px;
background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--accent) 35%,transparent),transparent)}
header .wrap{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
header h1{font-family:var(--mono);font-size:17px;margin:0;letter-spacing:-.3px}header h1 span{color:var(--accent)}
header nav{margin-left:auto;display:flex;gap:3px;flex-wrap:wrap;align-items:center}
header nav a{color:var(--dim);font-family:var(--mono);font-size:12.5px;padding:8px 12px;border-radius:999px;
border:1px solid transparent;display:inline-flex;align-items:center;line-height:1;transition:color .15s,background .15s,border-color .15s}
header nav a:hover{color:var(--ink);background:var(--panel2);border-color:var(--line);text-decoration:none}
header nav a.active{color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent);
border-color:color-mix(in srgb,var(--accent) 38%,transparent)}
header nav .navgroup{display:flex;gap:3px;align-items:center;padding-left:8px;margin-left:5px;border-left:1px solid var(--line)}
@media(max-width:640px){header nav .navgroup{border-left:none;padding-left:0;margin-left:0}}
.themebtn{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;margin-left:4px;
border-radius:999px;border:1px solid var(--line);background:var(--panel2);color:var(--dim);cursor:pointer;padding:0;
transition:color .15s,border-color .15s,transform .15s}
.themebtn:hover{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 50%,transparent);transform:translateY(-1px)}
.themebtn svg{display:block}
@media(max-width:640px){header .wrap{flex-direction:row;align-items:center;gap:8px}header nav{margin-left:0;width:100%}}
main{padding:36px 0 72px;background:
radial-gradient(600px 220px at 50% -60px,var(--glow),transparent)}
h2{font-size:28px;margin:0 0 6px;line-height:1.25;letter-spacing:-.4px}
.zh{color:var(--dim);font-weight:400}
.lede{font-size:17px;color:var(--dim);margin:0 0 18px}
.meta{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:26px}
.pill{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.4px;border:1px solid var(--line);
color:var(--dimmer);padding:3.5px 9px;border-radius:999px;background:var(--panel2)}
.pill.verified{color:var(--ok);border-color:color-mix(in srgb,var(--ok) 40%,transparent)}
.pill.unverified{color:var(--warn);border-color:color-mix(in srgb,var(--warn) 40%,transparent)}
.pill.port{color:var(--accent2);border-color:color-mix(in srgb,var(--accent2) 40%,transparent)}
.pill.safety{color:var(--warn);border-color:color-mix(in srgb,var(--warn) 45%,transparent)}
.pill.dom-visual{color:var(--dom-visual);border-color:color-mix(in srgb,var(--dom-visual) 40%,transparent)}
.pill.dom-audio{color:var(--dom-audio);border-color:color-mix(in srgb,var(--dom-audio) 40%,transparent)}
.pill.dom-network{color:var(--dom-network);border-color:color-mix(in srgb,var(--dom-network) 40%,transparent)}
.pill.dom-safety{color:var(--dom-safety);border-color:color-mix(in srgb,var(--dom-safety) 45%,transparent)}
.pill.dom-control{color:var(--dom-control);border-color:color-mix(in srgb,var(--dom-control) 40%,transparent)}
h3{font-family:var(--mono);font-size:12px;letter-spacing:.7px;text-transform:uppercase;color:var(--dimmer);
margin:32px 0 10px;font-weight:600}
ul{padding-left:20px;margin:0}li{margin-bottom:8px;color:var(--dim)}li strong{color:var(--ink);font-weight:600}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;color:var(--dimmer);font-weight:500;font-family:var(--mono);font-size:12px;
padding:6px 10px 6px 0;border-bottom:1px solid var(--line)}
td{padding:8px 10px 8px 0;border-bottom:1px solid var(--line);color:var(--dim);vertical-align:top}
td strong{color:var(--ink);font-weight:600}
.ports{background:var(--panel);border:1px solid var(--line);border-radius:var(--r-md);padding:16px 18px;margin:0 0 10px;
box-shadow:var(--shadow);transition:border-color .2s}
.ports:hover{border-color:color-mix(in srgb,var(--accent) 35%,var(--line))}
.ports .big{font-family:var(--mono);font-size:24px;color:var(--accent2);display:block;margin-bottom:2px}
.gotcha{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--accent2);padding:12px 16px;
margin-bottom:10px;border-radius:var(--r-sm);color:var(--dim);font-size:15px}
.cta{background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 7%,var(--panel2)),var(--panel2));
border:1px solid var(--line);border-radius:var(--r-md);padding:18px 20px;margin:36px 0 0}
.cta strong{display:block;margin-bottom:5px}
.cta p{margin:0;color:var(--dim);font-size:14.5px}
footer{border-top:1px solid var(--line);padding:24px 0 60px;color:var(--dimmer);font-size:13px}
footer a{color:var(--dim)}
code{font-family:var(--mono);font-size:13.5px;background:var(--panel2);border:1px solid var(--line);
padding:1.5px 6px;border-radius:6px}
.crumb{font-size:13px;color:var(--dimmer);margin-bottom:14px;font-family:var(--mono)}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important;animation:none!important;scroll-behavior:auto!important}}
`


/**
 * The three-state theme switcher: auto (follow the OS), light, dark.
 * Auto removes the data-theme attribute so the prefers-color-scheme media
 * query decides; an explicit choice pins the attribute and persists in
 * localStorage, read again by the tiny pre-paint script in <head> so pages
 * never flash the wrong theme. Icons are inline SVG, not emoji.
 */
const THEME_JS = `
(function(){
  var KEY='ss-theme', root=document.documentElement;
  var ICONS={
    auto:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3.8a8.2 8.2 0 0 1 0 16.4z" fill="currentColor"/></svg>',
    light:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5 5l1.9 1.9M17.1 17.1 19 19M19 5l-1.9 1.9M6.9 17.1 5 19"/></svg>',
    dark:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20.6 13.2A8.6 8.6 0 1 1 10.8 3.4a7 7 0 1 0 9.8 9.8z"/></svg>'
  };
  function mode(){try{var t=localStorage.getItem(KEY);return t==='light'||t==='dark'?t:'auto'}catch(e){return 'auto'}}
  function apply(m){
    if(m==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',m)}
    try{m==='auto'?localStorage.removeItem(KEY):localStorage.setItem(KEY,m)}catch(e){}
    var btn=document.getElementById('themebtn');
    if(btn){btn.innerHTML=ICONS[m];btn.setAttribute('aria-label','Theme: '+m+' (click to change)');btn.title='Theme: '+m}
  }
  apply(mode());
  document.addEventListener('DOMContentLoaded',function(){
    var btn=document.getElementById('themebtn');
    if(btn)btn.addEventListener('click',function(){var o=['auto','light','dark'];apply(o[(o.indexOf(mode())+1)%3])});
    apply(mode());
  });
})();
`

/**
 * The site nav, with the current section highlighted, grouped so the visual
 * spacing matches what the links actually are: the primary search, then the
 * field-calculator utilities, then the whole-index views. Active state is
 * derived from the canonical URL so no page has to declare it and none can
 * forget to.
 */
function navBar(canonical) {
  const path = String(canonical ?? '').replace(/^https?:\/\/[^/]+/, '')
  const link = (href, label) => {
    const active = href === '/' ? path === '/' || path === '' : path.startsWith(href)
    return `<a href="${href}"${active ? ' class="active" aria-current="page"' : ''}>${label}</a>`
  }
  const search = link('/', 'Search')
  const tools = ['/tools/', '/network/', '/rf/'].map((h, i) => link(h, ['Tools', 'Network', 'RF'][i])).join('')
  const views = ['/interop/', '/compare/', '/ports/', '/signals/'].map((h, i) => link(h, ['Interop', 'Compare', 'Ports', 'Signals'][i])).join('')
  return `<nav aria-label="Site">${search}<span class="navgroup">${tools}</span><span class="navgroup">${views}</span><a href="${GH}">GitHub</a><button class="themebtn" id="themebtn" type="button" aria-label="Switch theme"></button></nav>`
}

function shell({ title, description, canonical, jsonld, body, h1extra = '', extraStyle = '', extraScript = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${esc(canonical)}">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap">
<script>${THEME_JS}</script>
${jsonld ? `<script type="application/ld+json">${jsonForScript(jsonld)}</script>` : ''}
<style>${CSS}${extraStyle}</style>
</head>
<body>
<header><div class="wrap">
  <h1><a href="/" style="color:inherit">show<span>stack</span></a></h1>
  ${navBar(canonical)}
  ${h1extra}
</div></header>
<main><div class="wrap">${body}</div></main>
${extraScript ? `<script>${extraScript}</script>` : ''}
<footer><div class="wrap">
  Data <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>, code MIT.
  Free JSON API at <a href="/api/v1/index.json">/api/v1/</a>, no key.
  <a href="${GH}">Source and corrections</a>.
  <br>Created by <a href="https://www.linkedin.com/in/mi2dev/" rel="noopener">Migu Mianizt Leung</a> —
  <a href="https://medium.com/@mi2dev" rel="noopener">Medium</a> ·
  <a href="https://instagram.com/mi2.dev" rel="noopener">Instagram</a>
</div></footer>
</body>
</html>`
}

function contributeBox(collection, id, gap) {
  const missing = gap ? `<p>Known gaps on this entry: <code>${esc(gap.missing.join('</code>, <code>'))}</code>. If you can source one of them, that is a ten minute pull request.</p>` : ''
  return `<div class="cta">
    <strong>Something wrong, or missing?</strong>
    ${missing || '<p>Every entry here is maintained by people who run shows.</p>'}
    <p><a href="${GH}/edit/main/data/${collection}/${esc(id)}.yaml">Edit this entry on GitHub</a> — one file, editable in your browser, and your handle goes on it permanently.</p>
  </div>`
}

function sourcesBlock(sources = []) {
  if (!sources.length) return ''
  return `<h3>Sources</h3><ul>` + sources.map((s) =>
    `<li><a href="${esc(s.url)}" rel="noopener nofollow">${esc(s.title)}</a>${s.publisher ? ` — ${esc(s.publisher)}` : ''}${s.primary ? ' <span class="pill verified">primary</span>' : ''}</li>`
  ).join('') + `</ul>`
}

// --------------------------------------------------------------- protocols
function protocolPage(p, gap) {
  const ports = (p.default_ports ?? [])
  const portStr = ports.map((x) => `${x.transport.toUpperCase()} ${x.number}`).join(', ')
  const title = `${p.name}${portStr ? ` — ${portStr}` : ''} | showstack`
  const description = trunc(`${portStr ? `${p.name} runs on ${portStr}. ` : ''}${p.summary}`)

  let b = `<div class="crumb"><a href="/">showstack</a> / protocols / ${esc(p.id)}</div>`
  b += `<h2>${esc(p.name)}</h2>`
  if (p.aka?.length) b += `<p class="lede">Also called ${p.aka.map(esc).join(', ')}.</p>`
  b += `<p class="lede">${esc(p.summary)}</p>`

  b += `<div class="meta">`
  b += `<span class="pill dom-${superDomain(p.category)}">${esc(p.category)}</span>`
  if (p.openness) b += `<span class="pill">${esc(p.openness)}</span>`
  if (p.steward) b += `<span class="pill">${esc(p.steward)}</span>`
  if (p.confidence) b += `<span class="pill ${esc(p.confidence)}">${esc(p.confidence)}</span>`
  if (p.status && p.status !== 'current') b += `<span class="pill">${esc(p.status)}</span>`
  b += `</div>`

  if (ports.length) {
    b += `<h3>Ports</h3>`
    for (const x of ports) {
      b += `<div class="ports"><span class="big">${x.transport}/${x.number}</span>
        ${esc(x.role ?? '')}${x.note ? `<br><span style="color:var(--dimmer);font-size:14px">${esc(x.note)}</span>` : ''}</div>`
    }
  }
  if (p.multicast?.used) {
    b += `<h3>Multicast</h3><ul>` + (p.multicast.ranges ?? []).map((r) => `<li><code>${esc(r)}</code></li>`).join('')
      + (p.multicast.note ? `<li>${esc(p.multicast.note)}</li>` : '') + `</ul>`
  }
  if (p.universe_model) b += `<h3>Addressing</h3><p style="color:var(--dim)">${esc(p.universe_model)}</p>`

  if (p.gotchas?.length) {
    b += `<h3>What goes wrong</h3>`
    for (const g of p.gotchas) b += `<div class="gotcha">${esc(g)}</div>`
  }

  if (p.spoken_by?.length) {
    b += `<h3>What speaks ${esc(p.name)} (${p.spoken_by.length})</h3><table>
      <tr><th>Product</th><th>Direction</th><th>Notes</th></tr>` +
      p.spoken_by.map((s) => `<tr><td><strong>${esc(s.name)}</strong>${s.vendor ? `<br><span style="font-size:13px;color:var(--dimmer)">${esc(s.vendor)}</span>` : ''}</td>
        <td>${esc(s.direction)}${s.requires_licence ? '<br><span style="font-size:12px;color:var(--accent2)">needs licence</span>' : ''}</td>
        <td>${esc(s.note ?? '')}</td></tr>`).join('') + `</table>`
  }

  if (p.implementations?.length) {
    b += `<h3>Open source implementations</h3><ul>` + p.implementations.map((i) =>
      `<li><a href="${esc(i.url)}" rel="noopener">${esc(i.name)}</a>${i.language ? ` — ${esc(i.language)}` : ''}${i.license ? `, ${esc(i.license)}` : ''}</li>`).join('') + `</ul>`
  }
  if (p.typical_use?.length) b += `<h3>Typical use</h3><ul>` + p.typical_use.map((u) => `<li>${esc(u)}</li>`).join('') + `</ul>`

  b += sourcesBlock(p.sources)
  b += contributeBox('protocols', p.id, gap)

  return shell({
    title, description, canonical: `${SITE}/protocols/${p.id}/`,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'TechArticle',
      headline: `${p.name}${portStr ? ` (${portStr})` : ''}`,
      description: trunc(p.summary, 300),
      url: `${SITE}/protocols/${p.id}/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
      citation: (p.sources ?? []).map((s) => s.url),
      dateModified: p.updated,
    },
    body: b,
  })
}

// ------------------------------------------------------------------- ports
// "port 5568", "what uses udp 6454" — the highest-intent queries in the whole
// domain, and nothing currently answers them with a citation.
function portPage(number, entries) {
  const title = `What runs on port ${number}? | showstack`
  const names = entries.map((e) => e.p.name).join(', ')
  const description = trunc(`Port ${number} is used by ${names} in live entertainment systems. Ports, transports and what goes wrong, with sources.`)

  let b = `<div class="crumb"><a href="/">showstack</a> / <a href="/ports/">ports</a> / ${number}</div>`
  b += `<h2>Port ${number}</h2><p class="lede">In live entertainment systems, port ${number} is used by ${esc(names)}.</p>`
  for (const { p, port } of entries) {
    b += `<div class="ports"><span class="big">${port.transport}/${port.number}</span>
      <strong><a href="/protocols/${esc(p.id)}/">${esc(p.name)}</a></strong> — ${esc(port.role ?? '')}
      <div style="margin-top:8px;color:var(--dim);font-size:15px">${esc(p.summary)}</div></div>`
  }
  b += `<h3>Check it from the command line</h3><p style="color:var(--dim)"><code>npx showstack port ${number}</code></p>`
  b += `<div class="cta"><strong>Not what you were looking for?</strong>
    <p>If you know something else uses port ${number}, <a href="${GH}/issues/new?title=${encodeURIComponent(`[gap] port ${number}`)}">tell us</a>. Adding it is one file.</p></div>`

  return shell({
    title, description, canonical: `${SITE}/ports/${number}/`,
    jsonld: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{
      '@type': 'Question', name: `What runs on port ${number}?`,
      acceptedAnswer: { '@type': 'Answer', text: trunc(`In live entertainment systems, port ${number} is used by ${names}.`, 300) },
    }]},
    body: b,
  })
}

// ------------------------------------------------------------------- terms
function termPage(t, gap) {
  const title = `${t.en}${t.zh_hant ? ` / ${t.zh_hant}` : ''} — theatre and live events glossary | showstack`
  const description = trunc(`${t.en}${t.zh_hant ? ` (${t.zh_hant})` : ''}: ${t.definition_en}`)

  let b = `<div class="crumb"><a href="/">showstack</a> / glossary / ${esc(t.id)}</div>`
  b += `<h2>${esc(t.en)}${t.zh_hant ? ` <span class="zh">${esc(t.zh_hant)}</span>` : ''}</h2>`
  b += `<div class="meta"><span class="pill dom-${superDomain(t.domain)}">${esc(t.domain)}</span>${t.safety_critical ? '<span class="pill safety">safety critical</span>' : ''}</div>`
  b += `<p class="lede">${esc(t.definition_en)}</p>`
  if (t.definition_zh_hant) b += `<h3>中文</h3><p style="color:var(--dim)">${esc(t.definition_zh_hant)}</p>`
  if (t.regional_variants?.length) {
    b += `<h3>Regional usage</h3><table><tr><th>Where</th><th>Term</th><th>Note</th></tr>` +
      t.regional_variants.map((r) => `<tr><td><strong>${esc(r.region)}</strong></td><td>${esc(r.term)}</td><td>${esc(r.note ?? '')}</td></tr>`).join('') + `</table>`
  }
  if (t.false_friends?.length) {
    b += `<h3>Easy to get wrong</h3>`
    for (const f of t.false_friends) b += `<div class="gotcha">${esc(f)}</div>`
  }
  b += sourcesBlock(t.sources)
  b += contributeBox('terms', t.id, gap)

  return shell({
    title, description, canonical: `${SITE}/glossary/${t.id}/`,
    jsonld: { '@context': 'https://schema.org', '@type': 'DefinedTerm',
      name: t.en, alternateName: t.zh_hant, description: trunc(t.definition_en, 300),
      inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'showstack glossary', url: `${SITE}/glossary/` },
      url: `${SITE}/glossary/${t.id}/` },
    body: b,
  })
}

// ------------------------------------------------- software / hardware / std
function productPage(kind, e, gap) {
  // Vendor is only worth putting in the <title> when it adds information.
  // "Notch (Notch (10bit FX Limited))" and "Lightwright (Lightwright LLC)"
  // waste the ~60 characters a search result actually shows, so drop the
  // vendor when it is just the product name plus a legal suffix. Compare on
  // the vendor's leading word, before any parenthetical trading name.
  const vendorHead = (e.vendor ?? '').split('(')[0].trim()
  const redundant =
    vendorHead.toLowerCase().startsWith(e.name.toLowerCase()) ||
    e.name.toLowerCase().startsWith(vendorHead.toLowerCase())
  const byline = e.vendor && !redundant ? ` (${vendorHead})` : ''
  const title = `${e.name}${byline} — protocols and interoperability | showstack`
  const spoken = (e.speaks ?? []).map((s) => s.protocol).join(', ')
  const description = trunc(`${e.name}${spoken ? ` speaks ${spoken}. ` : ' '}${e.summary}`)

  let b = `<div class="crumb"><a href="/">showstack</a> / ${kind} / ${esc(e.id)}</div>`
  b += `<h2>${esc(e.name)}</h2><p class="lede">${esc(e.summary)}</p>`
  b += `<div class="meta"><span class="pill dom-${superDomain(e.category)}">${esc(e.category)}</span>`
  if (e.vendor) b += `<span class="pill">${esc(e.vendor)}</span>`
  if (e.license) b += `<span class="pill">${esc(e.license)}</span>`
  if (e.price_model) b += `<span class="pill">${esc(e.price_model)}</span>`
  for (const pf of e.platforms ?? []) b += `<span class="pill">${esc(pf)}</span>`
  if (e.confidence) b += `<span class="pill ${esc(e.confidence)}">${esc(e.confidence)}</span>`
  if (e.status && e.status !== 'current') b += `<span class="pill">${esc(e.status)}</span>`
  b += `</div>`

  if (e.speaks?.length) {
    b += `<h3>Protocols it speaks</h3><table><tr><th>Protocol</th><th>Direction</th><th>Notes</th></tr>` +
      e.speaks.map((s) => `<tr><td><strong><a href="/protocols/${esc(s.protocol)}/">${esc(s.protocol)}</a></strong></td>
        <td>${esc(s.direction)}${s.requires_licence ? '<br><span style="font-size:12px;color:var(--accent2)">needs licence</span>' : ''}</td>
        <td>${esc(s.note ?? '')}</td></tr>`).join('') + `</table>`
  }
  if (e.physical_ports?.length) b += `<h3>Connectors</h3><ul>` + e.physical_ports.map((x) => `<li>${esc(x)}</li>`).join('') + `</ul>`
  if (e.gotchas?.length) { b += `<h3>What to watch for</h3>`; for (const g of e.gotchas) b += `<div class="gotcha">${esc(g)}</div>` }
  if (e.typical_use?.length) b += `<h3>Typical use</h3><ul>` + e.typical_use.map((u) => `<li>${esc(u)}</li>`).join('') + `</ul>`
  b += sourcesBlock(e.sources)
  b += contributeBox(kind, e.id, gap)

  return shell({ title, description, canonical: `${SITE}/${kind}/${e.id}/`,
    jsonld: { '@context': 'https://schema.org', '@type': kind === 'software' ? 'SoftwareApplication' : 'Product',
      name: e.name, description: trunc(e.summary, 300), url: `${SITE}/${kind}/${e.id}/`,
      ...(e.vendor ? { brand: { '@type': 'Brand', name: e.vendor } } : {}),
      ...(kind === 'software' ? { applicationCategory: e.category, operatingSystem: (e.platforms ?? []).join(', ') } : {}) },
    body: b })
}

function standardPage(s, gap) {
  const title = `${s.designation} — ${trunc(s.title, 70)} | showstack`
  const description = trunc(`${s.designation}, published by ${s.body}. ${s.scope ?? s.title}${s.free_to_read ? ' Free to read.' : ''}`)

  let b = `<div class="crumb"><a href="/">showstack</a> / standards / ${esc(s.id)}</div>`
  b += `<h2>${esc(s.designation)}</h2><p class="lede">${esc(s.title)}</p>`
  b += `<div class="meta"><span class="pill">${esc(s.body)}</span><span class="pill dom-${superDomain(s.domain)}">${esc(s.domain)}</span>`
  if (s.year) b += `<span class="pill">${s.year}</span>`
  if (s.free_to_read === true) b += `<span class="pill verified">free to read</span>`
  if (s.free_to_read === false) b += `<span class="pill">paid</span>`
  b += `<span class="pill">${esc(s.status)}</span></div>`
  if (s.scope) b += `<h3>Scope</h3><p style="color:var(--dim)">${esc(s.scope)}</p>`
  if (s.notes) b += `<h3>Notes</h3><p style="color:var(--dim)">${esc(s.notes)}</p>`
  if (s.access_url) b += `<h3>Where to get it</h3><p><a href="${esc(s.access_url.url)}" rel="noopener nofollow">${esc(s.access_url.label ?? s.access_url.url)}</a></p>`
  if (s.related_protocols?.length) b += `<h3>Related protocols</h3><ul>` + s.related_protocols.map((r) => `<li><a href="/protocols/${esc(r)}/">${esc(r)}</a></li>`).join('') + `</ul>`
  b += sourcesBlock(s.sources)
  b += contributeBox('standards', s.id, gap)

  return shell({ title, description, canonical: `${SITE}/standards/${s.id}/`,
    jsonld: { '@context': 'https://schema.org', '@type': 'TechArticle', headline: s.designation,
      description: trunc(s.scope ?? s.title, 300), url: `${SITE}/standards/${s.id}/`, dateModified: s.updated },
    body: b })
}

// ------------------------------------------------------------------- driver
export function buildPages(db, dist) {
  const gapOf = (col, id) => (db.gaps ?? []).find((g) => g.collection === col && g.id === id)
  const urls = [`${SITE}/`]
  const write = (dir, html) => { mkdirSync(join(dist, dir), { recursive: true }); writeFileSync(join(dist, dir, 'index.html'), html) }

  for (const p of db.protocols) { write(`protocols/${p.id}`, protocolPage(p, gapOf('protocols', p.id))); urls.push(`${SITE}/protocols/${p.id}/`) }
  for (const t of db.terms)     { write(`glossary/${t.id}`,  termPage(t, gapOf('terms', t.id)));          urls.push(`${SITE}/glossary/${t.id}/`) }
  for (const s of db.standards) { write(`standards/${s.id}`, standardPage(s, gapOf('standards', s.id)));  urls.push(`${SITE}/standards/${s.id}/`) }
  for (const e of db.software)  { write(`software/${e.id}`,  productPage('software', e, gapOf('software', e.id))); urls.push(`${SITE}/software/${e.id}/`) }
  for (const e of db.hardware)  { write(`hardware/${e.id}`,  productPage('hardware', e, gapOf('hardware', e.id))); urls.push(`${SITE}/hardware/${e.id}/`) }

  // Comparison pages. Curated pairs, generated content: "art-net vs sacn" is
  // searched constantly and every existing answer is a forum thread.
  const protoById = Object.fromEntries(db.protocols.map((p) => [p.id, p]))
  const products = [
    ...db.software.map((e) => ({ ...e, kind: 'software' })),
    ...db.hardware.map((e) => ({ ...e, kind: 'hardware' })),
  ]
  const helpers = { esc, trunc, shell, SITE, GH, products }
  const livePairs = []
  for (const [aId, bId, ask] of PAIRS) {
    const a = protoById[aId]
    const b = protoById[bId]
    // Skip silently: the curated list may name protocols not yet written, so
    // it can be edited ahead of the data without breaking the build.
    if (!a || !b) continue
    write(`compare/${a.id}-vs-${b.id}`, comparisonPage(a, b, ask, helpers))
    urls.push(`${SITE}/compare/${a.id}-vs-${b.id}/`)
    livePairs.push([a, b, ask])
  }
  if (livePairs.length) {
    write('compare', comparisonIndex(livePairs, helpers))
    urls.push(`${SITE}/compare/`)
  }

  // The interop picker. Uses the same products list built above.
  write('interop', interopPage({ esc, shell, jsonForScript, SITE, GH, products, protocols: db.protocols }))
  urls.push(`${SITE}/interop/`)

  // The field-tool calculators. Market-validated daily utilities: DMX/DIP
  // addressing, speaker delay, timecode. Same arithmetic the test suite runs.
  write('tools', toolsPage({ esc, shell, SITE, GH }))
  urls.push(`${SITE}/tools/`)

  // The converged-network planner: QoS queues, DSCP collisions, link fill.
  write('network', networkPage({ esc, shell, jsonForScript, SITE, GH }))
  urls.push(`${SITE}/network/`)

  // The per-country wireless mic frequency map.
  write('rf', rfPage({ esc, shell, jsonForScript, SITE, GH }))
  urls.push(`${SITE}/rf/`)

  // Signal & connector reference: serial vs parallel, display-protocol
  // versions, structured cabling categories, fibre types, RS-485/DMX unit
  // loads, and connector pinouts. Hand-authored explainer content, not
  // generated from the YAML dataset — see signals.mjs for why.
  write('signals', signalsPage({ esc, shell, SITE, GH }))
  urls.push(`${SITE}/signals/`)

  // Port pages, plus an index of every port we know about.
  const byPort = new Map()
  for (const p of db.protocols) for (const port of p.default_ports ?? []) {
    if (!byPort.has(port.number)) byPort.set(port.number, [])
    byPort.get(port.number).push({ p, port })
  }
  for (const [number, entries] of byPort) { write(`ports/${number}`, portPage(number, entries)); urls.push(`${SITE}/ports/${number}/`) }

  const rows = [...byPort.entries()].sort((a, b) => a[0] - b[0]).flatMap(([n, es]) =>
    es.map((e, i) => `<tr>${i === 0 ? `<td rowspan="${es.length}"><strong><a href="/ports/${n}/">${n}</a></strong></td>` : ''}
     <td>${e.port.transport}</td><td><a href="/protocols/${esc(e.p.id)}/">${esc(e.p.name)}</a></td>
     <td>${esc(e.port.role ?? '')}${e.port.note ? `<br><span style="color:var(--dimmer);font-size:12.5px">${esc(e.port.note)}</span>` : ''}</td></tr>`)).join('')
  write('ports', shell({
    title: 'Port numbers used in live entertainment systems | showstack',
    description: 'Every UDP and TCP port used by lighting, audio, video, tracking and show control protocols, with sources.',
    canonical: `${SITE}/ports/`,
    body: `<div class="crumb"><a href="/">showstack</a> / ports</div><h2>Ports</h2>
      <p class="lede">Every port number indexed so far, and what listens on it. ${byPort.size} ports across ${db.protocols.length} protocols.</p>
      <table><tr><th>Port</th><th>Transport</th><th>Used by</th><th>What it does</th></tr>${rows}</table>
      <div class="cta"><strong>Missing one?</strong><p>Ports we could not source are deliberately left blank rather than guessed.
      <a href="${GH}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22">Open gaps are here.</a></p></div>`,
  }))
  urls.push(`${SITE}/ports/`)

  writeFileSync(join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc><changefreq>weekly</changefreq></url>`).join('\n') + `\n</urlset>\n`)

  writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)

  // llms.txt — an emerging convention for telling AI crawlers what a site is
  // and where the machine-readable version lives. Costs nothing, and being the
  // cited source inside an assistant is real distribution for a dataset.
  writeFileSync(join(dist, 'llms.txt'),
`# showstack

> An open, machine-readable index of live entertainment technology: control
> protocols, published standards, software and hardware interoperability, and a
> bilingual English / Traditional Chinese glossary. Every factual field carries a
> source citation. Fields that could not be sourced are left empty on purpose.

Licence: data CC BY 4.0, code MIT. Attribute to "showstack contributors".

## Machine-readable

- [Full dataset](${SITE}/showstack.json)
- [Protocols](${SITE}/api/v1/protocols.json) — ports, multicast, addressing, gotchas
- [Software](${SITE}/api/v1/software.json) — including which protocols each speaks
- [Hardware](${SITE}/api/v1/hardware.json)
- [Standards](${SITE}/api/v1/standards.json) — ANSI E1.x, SMPTE, AES, IEC
- [Glossary](${SITE}/api/v1/terms.json) — EN / 繁中 with regional variants
- [Known gaps](${SITE}/api/v1/gaps.json)

## Notes for assistants

- Every entry has a \`confidence\` field: \`verified\` means checked against the
  primary standard or real hardware, \`reported\` means a credible secondary
  source, \`unverified\` means community knowledge. Please carry it through.
- Entries link to primary documents in \`sources\`. Cite those, not just this.
- Rigging, electrical, machinery, laser and pyrotechnic entries point at the
  governing standard and never paraphrase a requirement. Do not present an
  entry as a substitute for the standard.
- Corrections: ${GH}/issues
`)

  return { pages: urls.length, ports: byPort.size }
}
