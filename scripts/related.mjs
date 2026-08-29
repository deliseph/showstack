/**
 * The connective tissue between the index and the explainers.
 *
 * The problem this solves is real and was reported by a reader: Max/MSP,
 * vvvv and Pure Data were all in the index and nobody could find them,
 * because the two halves of the site did not point at each other. You could
 * read an explainer that named a tool and never reach its entry, and you
 * could land on an entry and have no idea which explainer covered the
 * mechanism behind it.
 *
 * Rather than maintain a hand-written mapping that would rot within a month,
 * the map is DERIVED from the links the explainers already contain. Each
 * learn page is rendered first; every /protocols/, /software/, /hardware/ and
 * /standards/ link inside it is extracted; and the reverse of that gives
 * every entry the set of explainers that actually discuss it. One source of
 * truth, no duplication, and it cannot drift because it is read from the
 * output rather than declared alongside it.
 *
 * Entries that no explainer happens to name fall back to a small set of
 * category rules, so a page is never a dead end.
 */
import { LEARN_TOPICS, LEARN_CAPSTONE } from './learn-kit.mjs'

const TITLE = new Map([...LEARN_TOPICS, LEARN_CAPSTONE].map((t) => [t.slug, t.title]))

/**
 * Fallback rules, used only when no explainer links to an entry directly.
 * Deliberately coarse: the aim is a plausible next step, not a taxonomy.
 */
const BY_CATEGORY = {
  // protocols
  'lighting-control': ['dmx', 'network'],
  'audio-transport': ['network', 'bits'],
  'audio-control': ['software', 'bits'],
  'video-transport': ['network', 'engines'],
  'video-control': ['software', 'engines'],
  'media-control': ['software', 'engines'],
  'show-control': ['software', 'systems'],
  'timecode-sync': ['systems', 'encoding'],
  'tracking-position': ['systems', 'reading'],
  'machinery-motion': ['devices', 'code'],
  'network-transport': ['network', 'encoding'],
  'device-management': ['devices', 'software'],
  'power-monitoring': ['transducers', 'network'],
  // software
  'media-server': ['engines', 'systems'],
  'video-playback': ['engines', 'bits'],
  'audio-playback': ['bits', 'sound'],
  'audio-mixing': ['sound', 'bits'],
  'cue-playback': ['software', 'systems'],
  previsualisation: ['engines', 'light'],
  'cad-drafting': ['drawings', 'light'],
  tracking: ['systems', 'reading'],
  'networking-utility': ['network', 'encoding'],
  'monitoring-diagnostics': ['network', 'encoding'],
  'content-creation': ['engines', 'code'],
  'production-management': ['drawings', 'experience'],
  // hardware
  'lighting-console': ['dmx', 'light'],
  'audio-console': ['sound', 'bits'],
  'video-processor': ['systems', 'engines'],
  'dmx-node': ['dmx', 'network'],
  'network-switch': ['network', 'encoding'],
  'dimmer-distro': ['dmx', 'transducers'],
  'power-distro': ['transducers'],
  'tracking-system': ['systems', 'reading'],
  'motion-control': ['devices', 'code'],
  'show-controller': ['software', 'systems'],
  'timecode-generator': ['systems', 'encoding'],
  'io-interface': ['transducers', 'bits'],
  'wireless-dmx': ['wireless', 'connectivity'],
  amplifier: ['sound', 'transducers'],
  'audio-processor': ['sound', 'bits'],
}

/** Standards and glossary terms carry a domain rather than a category. */
const BY_DOMAIN = {
  'control-data': ['dmx', 'encoding'],
  audio: ['sound', 'bits'],
  video: ['engines', 'systems'],
  networking: ['network', 'encoding'],
  'rigging-structural': ['drawings'],
  electrical: ['transducers'],
  machinery: ['devices', 'code'],
  'pyro-flame': ['aerial'],
  laser: ['perception', 'light'],
  'safety-management': ['experience'],
  accessibility: ['experience', 'neuro'],
  sustainability: ['experience'],
  // glossary domains
  lighting: ['light', 'dmx'],
  rigging: ['drawings', 'devices'],
  'stage-management': ['comms', 'experience'],
  scenic: ['drawings', 'devices'],
  'production-management': ['experience', 'drawings'],
  safety: ['experience', 'devices'],
  automation: ['devices', 'code'],
  wardrobe: ['experience', 'perception'],
  general: ['experience', 'perception'],
}

/**
 * Extract every index link an explainer makes. Called on the rendered HTML,
 * which is why this cannot get out of step with the prose.
 */
export function extractIndexLinks(html) {
  const out = new Set()
  for (const m of html.matchAll(/href="\/(protocols|software|hardware|standards|glossary)\/([a-z0-9-]+)\/"/g))
    out.add(`${m[1]}/${m[2]}`)
  return out
}

/**
 * Build the reverse map: entry key -> [learn slug]. `pages` is a Map of
 * learn slug -> rendered HTML.
 */
export function buildBacklinks(pages) {
  const back = new Map()
  for (const [slug, html] of pages) {
    for (const key of extractIndexLinks(html)) {
      if (!back.has(key)) back.set(key, [])
      if (!back.get(key).includes(slug)) back.get(key).push(slug)
    }
  }
  return back
}

/** Which explainers should this entry point at. Direct links win; rules fill in. */
export function learnFor(backlinks, kind, entry) {
  const direct = backlinks.get(`${kind}/${entry.id}`) ?? []
  if (direct.length) return direct.slice(0, 4)
  const rule = BY_CATEGORY[entry.category] ?? BY_DOMAIN[entry.domain] ?? []
  return rule.filter((s) => TITLE.has(s)).slice(0, 3)
}

/**
 * The block that appears on every entry page. Two jobs: give the reader the
 * mechanism behind the thing they are looking at, and make it obvious that
 * the explainers exist at all.
 */
export function learnBox(esc, slugs) {
  if (!slugs.length) return ''
  return `<div class="learnbox">
    <span class="lbk">Understand the mechanism</span>
    <div class="lbl-links">${slugs.map((s) =>
      `<a href="/learn/${esc(s)}/">${esc(TITLE.get(s) ?? s)}</a>`).join('')}</div>
  </div>`
}

/**
 * The footer on every explainer: what it just talked about, as things you can
 * look up, and where to go next in the chain. A reader should never have to
 * go back to a hub to keep moving.
 */
export function learnFooter(esc, { slug, html, db, groups, topics, capstone }) {
  const keys = [...extractIndexLinks(html)]
  const LABEL = { protocols: 'protocol', software: 'software', hardware: 'hardware',
                  standards: 'standard', glossary: 'term' }
  const NAME = { protocols: 'name', software: 'name', hardware: 'name',
                 standards: 'designation', glossary: 'en' }
  const COLL = { protocols: db.protocols, software: db.software, hardware: db.hardware,
                 standards: db.standards, glossary: db.terms }

  const cards = keys.map((k) => {
    const [kind, id] = k.split('/')
    const e = (COLL[kind] ?? []).find((x) => x.id === id)
    if (!e) return null
    return { kind, id, label: LABEL[kind], name: e[NAME[kind]] ?? id,
             sub: e.summary ?? e.zh_hant ?? e.title ?? '' }
  }).filter(Boolean)
     .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name))

  const inIndex = cards.length ? `
  <section class="onward">
    <h3>Everything on this page, in the index</h3>
    <p class="onlede">Each of these has its own entry with sources, ports, gotchas and an open gap where a field is missing.</p>
    <div class="oncards">${cards.map((c) => `
      <a class="oncard" href="/${esc(c.kind)}/${esc(c.id)}/">
        <span class="ok2">${esc(c.label)}</span>
        <b>${esc(c.name)}</b>
        <em>${esc(String(c.sub).replace(/\s+/g, ' ').slice(0, 96))}${String(c.sub).length > 96 ? '…' : ''}</em>
      </a>`).join('')}</div>
  </section>` : ''

  // where next: the rest of this stage, then the first page of the next one
  const me = topics.find((t) => t.slug === slug)
  let next = []
  if (me) {
    const gi = groups.findIndex((g) => g.id === me.group)
    const mine = topics.filter((t) => t.group === me.group)
    const idx = mine.findIndex((t) => t.slug === slug)
    next = mine.slice(idx + 1).concat(mine.slice(0, idx))
    const after = groups[gi + 1]
    if (after) next = next.concat(topics.filter((t) => t.group === after.id).slice(0, 2))
    const before = groups[gi - 1]
    if (before && next.length < 4) next = next.concat(topics.filter((t) => t.group === before.id).slice(0, 1))
  } else {
    next = topics.slice(0, 4)
  }
  next = next.slice(0, 4)

  const cap = slug === capstone.slug ? '' : `
    <a class="oncard oncap" href="/learn/${esc(capstone.slug)}/">
      <span class="ok2">the practice</span>
      <b>${esc(capstone.title)}</b>
      <em>What all of this is actually for.</em>
    </a>`

  const onward = `
  <section class="onward">
    <h3>Where to go next</h3>
    <p class="onlede">These pages are a chain rather than a library — the next one along usually answers the question this one raised.</p>
    <div class="oncards">${cap}${next.map((t) => `
      <a class="oncard" href="/learn/${esc(t.slug)}/">
        <span class="ok2">${esc(t.tag)}</span>
        <b>${esc(t.title)}</b>
        <em>${esc(t.questions[0])}</em>
      </a>`).join('')}</div>
  </section>`

  // Peak-end. The interactive figure is the peak and it stays where it is;
  // this is the ending, which used to be a licence line and a GitHub link on
  // all 27 pages. It closes the same gap the card opened - the questions here
  // are the ones printed on the hub card, so the reader who came in on "why is
  // there a hum?" is told, in the site's own words, that they can answer it
  // now. No score, no badge, no "great job": the reward is the competence.
  const peak = me ? `
  <section class="peak">
    <span class="pk">You can now answer</span>
    <ul>${me.questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
    <button type="button" class="pkdone" data-slug="${esc(slug)}" aria-pressed="false">
      <span class="pkoff">Mark as read</span><span class="pkon">Read &mdash; undo</span>
    </button>
    <span class="pknote">Kept in this browser on this device. Nothing is sent anywhere.</span>
  </section>` : ''

  return peak + onward + inIndex
}

/**
 * Read state on an explainer: the button in the peak-end block, and the "read"
 * marker in the chain-position line. Same localStorage key the /learn/ hub
 * reads, so the two agree without either knowing about the other.
 */
export const READ_JS = `
(function(){
  var KEY='ss-read';
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return []}}
  function save(a){try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
  var btn=document.querySelector('.pkdone');
  if(!btn)return;
  var slug=btn.dataset.slug, mark=document.querySelector('.cpos .cread');
  function paint(){
    var on=load().indexOf(slug)>-1;
    btn.setAttribute('aria-pressed',String(on));
    if(mark)mark.hidden=!on;
  }
  btn.addEventListener('click',function(){
    var a=load(), i=a.indexOf(slug);
    if(i>-1)a.splice(i,1);else a.push(slug);
    save(a); paint();
  });
  paint();
})();
`

/** Styles for both blocks, injected once into the shared stylesheet. */
export const RELATED_CSS = `
.learnbox{margin:22px 0;padding:15px 18px;border:1px solid color-mix(in srgb,var(--accent) 30%,var(--line));
border-radius:var(--r-md);background:color-mix(in srgb,var(--accent) 6%,transparent)}
.learnbox .lbk{display:block;font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;
text-transform:uppercase;color:var(--accent);margin-bottom:10px}
.learnbox .lbl-links{display:flex;flex-wrap:wrap;gap:8px}
.learnbox a{font-family:var(--mono);font-size:12.5px;padding:7px 12px;border-radius:7px;
border:1px solid var(--line);background:var(--panel);color:var(--dim);text-decoration:none}
.learnbox a:hover{border-color:color-mix(in srgb,var(--accent) 55%,var(--line));color:var(--accent);
text-decoration:none}
.peak{margin:40px 0 0;padding:22px 24px;border-radius:var(--r-lg);
border:1px solid color-mix(in srgb,var(--verified) 32%,var(--rule));
background:color-mix(in srgb,var(--verified) 7%,var(--surface-raised))}
.peak .pk{display:block;font-family:var(--mono);font-size:10.5px;letter-spacing:.8px;text-transform:uppercase;
color:var(--verified);margin-bottom:12px}
.peak ul{margin:0;padding-left:0;list-style:none}
.peak li{color:var(--ink);font-size:16.5px;line-height:1.5;margin:0 0 8px;padding-left:26px;position:relative}
.peak li::before{content:"";position:absolute;left:2px;top:.55em;width:11px;height:6px;
border-left:2px solid var(--verified);border-bottom:2px solid var(--verified);transform:rotate(-45deg)}
.peak li:last-child{margin-bottom:0}
.peak .pkdone{margin-top:16px;font-family:var(--mono);font-size:12.5px;padding:0 16px;min-height:44px;
border-radius:var(--r-pill);border:1px solid var(--rule-strong);background:var(--surface);
color:var(--ink-muted);cursor:pointer;display:inline-flex;align-items:center}
.peak .pkdone:hover{color:var(--verified);border-color:var(--verified)}
.peak .pkdone[aria-pressed="true"]{color:var(--verified);border-color:var(--verified);
background:color-mix(in srgb,var(--verified) 13%,var(--surface))}
.peak .pkon{display:none}
.peak .pkdone[aria-pressed="true"] .pkoff{display:none}
.peak .pkdone[aria-pressed="true"] .pkon{display:inline}
.peak .pknote{display:block;margin-top:10px;font-family:var(--mono);font-size:10.5px;color:var(--ink-faint)}
.onward{margin:38px 0 0;padding-top:26px;border-top:1px solid var(--line)}
.onward h3{font-family:var(--sans);font-size:19px;letter-spacing:-.2px;text-transform:none;color:var(--ink);
margin:0 0 6px;font-weight:650}
.onward .onlede{color:var(--dim);font-size:14.5px;margin:0 0 16px;max-width:64ch}
.oncards{display:grid;grid-template-columns:repeat(auto-fill,minmax(216px,1fr));gap:11px}
.oncard{display:block;padding:14px 15px;border:1px solid var(--line);border-radius:var(--r-md);
background:var(--panel);color:inherit;text-decoration:none;transition:border-color .18s,transform .16s}
.oncard:hover{border-color:color-mix(in srgb,var(--accent) 50%,var(--line));transform:translateY(-2px);
text-decoration:none}
.oncard .ok2{display:block;font-family:var(--mono);font-size:10px;letter-spacing:.6px;text-transform:uppercase;
color:var(--dimmer);margin-bottom:7px}
.oncard b{display:block;color:var(--ink);font-size:14.5px;line-height:1.3;margin-bottom:5px;font-weight:600}
.oncard em{display:block;font-style:normal;color:var(--dim);font-size:12.5px;line-height:1.5}
.oncard.oncap{border-color:color-mix(in srgb,var(--accent) 42%,var(--line));
background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 10%,var(--panel)),var(--panel))}
.oncard.oncap .ok2{color:var(--accent)}
`
