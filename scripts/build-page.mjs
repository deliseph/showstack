/**
 * /build/ — what somebody outside this project can actually do with it.
 *
 * The dataset has been open and free the whole time and nobody knew what to
 * do with it, because "there is a JSON API" is a fact rather than an
 * invitation. This page is the invitation: what the endpoints are, what the
 * shapes look like, and eight recipes somebody could actually ship.
 *
 * Every snippet here is short enough to read in full and paste. That is
 * deliberate - a page of copyable eight-line examples gets used, and a page
 * of architecture does not.
 */
import { LEARN_CSS } from './learn-kit.mjs'

export function buildPage({ esc, shell, SITE, GH, db }) {
  const style = LEARN_CSS + `
.ep{width:100%;border-collapse:collapse;font-size:14.2px;margin:16px 0}
.ep th{text-align:left;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;
color:var(--dimmer);padding:0 12px 9px 0;border-bottom:1px solid var(--line);font-weight:400;white-space:nowrap}
.ep td{padding:12px 12px 12px 0;border-bottom:1px solid var(--line);vertical-align:top;color:var(--dim);line-height:1.55}
.ep td:first-child{font-family:var(--mono);font-size:12.5px;white-space:nowrap}
.ep td:first-child a{color:var(--accent)}
.ep td:last-child{font-family:var(--mono);font-size:12px;color:var(--accent2);white-space:nowrap;text-align:right}
.epwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.epwrap .ep{min-width:600px}
.code{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--accent);
border-radius:0 var(--r-sm) var(--r-sm) 0;padding:15px 17px;margin:0;overflow-x:auto;
font-family:var(--mono);font-size:12.6px;line-height:1.75;color:var(--dim);white-space:pre;
-webkit-overflow-scrolling:touch}
.code .c{color:var(--dimmer)}
.code .k{color:var(--accent)}
.code .s{color:var(--accent2)}
.recipes2{display:grid;gap:18px;margin:20px 0}
.rec{border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden;background:var(--panel2)}
.rec > header{padding:15px 18px;border-bottom:1px solid var(--line);background:var(--panel)}
.rec h3{margin:0 0 5px;font-family:var(--sans);font-size:17px;text-transform:none;letter-spacing:-.2px;
color:var(--ink);font-weight:650}
.rec header p{margin:0;color:var(--dim);font-size:13.8px;line-height:1.55}
.rec header .who{display:inline-block;font-family:var(--mono);font-size:10px;letter-spacing:.6px;
text-transform:uppercase;color:var(--accent);margin-bottom:8px}
.rec > .body{padding:16px 18px}
.rec .code{margin:0}
.rec .after{margin:12px 0 0;color:var(--dimmer);font-size:13px;line-height:1.6}
.pill2{display:inline-block;font-family:var(--mono);font-size:10.5px;padding:3px 9px;border-radius:999px;
border:1px solid var(--line);color:var(--dimmer);margin-right:6px}
.shape{display:grid;grid-template-columns:repeat(auto-fit,minmax(226px,1fr));gap:12px;margin:16px 0}
.shape > div{background:var(--panel);border:1px solid var(--line);border-radius:var(--r-sm);padding:14px}
.shape dt{font-family:var(--mono);font-size:11.5px;color:var(--accent);margin-bottom:6px}
.shape dd{margin:0;color:var(--dim);font-size:13.3px;line-height:1.55}
.shape code{font-family:var(--mono);font-size:11.5px;color:var(--accent2)}
`

  const counts = {
    protocols: db.protocols.length, standards: db.standards.length,
    software: db.software.length, hardware: db.hardware.length, terms: db.terms.length,
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  const E = (path, what, size) =>
    `<tr><td><a href="${path}">${path}</a></td><td>${what}</td><td>${size}</td></tr>`

  const recipe = (who, title, blurb, code, after) => `
  <article class="rec">
    <header><span class="who">${esc(who)}</span><h3>${esc(title)}</h3><p>${blurb}</p></header>
    <div class="body"><pre class="code">${code}</pre>${after ? `<p class="after">${after}</p>` : ''}</div>
  </article>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / build</div>
<div class="lhero">
  <h2>Build something on it</h2>
  <p class="lede">The whole dataset is plain JSON at a fixed URL with permissive CORS. No key, no account, no rate limit, no tracking, and it will still be there when this site is not — the same files ship inside the npm and PyPI packages and the repository. Here is what is in it and eight things you could ship this week.</p>
</div>

<p style="color:var(--dim);font-size:15.5px;max-width:66ch">Everything is CC BY 4.0. Use it commercially, embed it in a product, print it on a wall. The only ask is attribution and, if you fix something, a pull request so the next person gets it too.</p>

<section class="lsec">
  <p class="qline">The endpoints</p>
  <h3>Five collections, one index, and the gaps</h3>
  <p>Static files, cacheable at the edge, and they work from a file on a USB stick backstage with no network at all.</p>

  <div class="epwrap">
  <table class="ep">
    <thead><tr><th>Endpoint</th><th>What it holds</th><th>Entries</th></tr></thead>
    <tbody>
      ${E('/api/v1/index.json', 'Counts, build date and the list of endpoints. Start here.', '—')}
      ${E('/api/v1/protocols.json', 'Wire protocols with ports, transports, multicast behaviour, gotchas and sources.', String(counts.protocols))}
      ${E('/api/v1/standards.json', 'Standards with the publishing body, scope, jurisdiction and whether it is free to read.', String(counts.standards))}
      ${E('/api/v1/software.json', 'Software with licence, platforms, price model and — the useful field — what it speaks.', String(counts.software))}
      ${E('/api/v1/hardware.json', 'Hardware with category, form factor, physical ports and what it speaks.', String(counts.hardware))}
      ${E('/api/v1/terms.json', 'Bilingual EN / 繁中 vocabulary with domain, regional variants and false friends.', String(counts.terms))}
      ${E('/api/v1/gaps.json', 'Every field we know is missing, by entry. The to-do list, published.', '—')}
      ${E('/showstack.json', 'All of the above in one file, if you would rather fetch once.', String(total))}
      ${E('/llms.txt', 'A plain-text summary for language models and anything else that reads prose.', '—')}
    </tbody>
  </table>
  </div>

  <div class="shape">
    <div><dt>speaks</dt><dd>On software and hardware: <code>[{protocol, direction, note, confidence}]</code>. The single most useful field, and the one to check before you promise an integration.</dd></div>
    <div><dt>default_ports</dt><dd>On protocols: <code>[{number, transport, role, iana_registered}]</code>. This is what the port pages and the CLI are built from.</dd></div>
    <div><dt>confidence</dt><dd>Everywhere: <code>verified</code> checked against the primary standard or real hardware, <code>reported</code> documented by a credible source, <code>unverified</code> community knowledge. Filter on it.</dd></div>
    <div><dt>sources</dt><dd>Everywhere, and never empty: <code>[{title, url, publisher, accessed, primary}]</code>. An entry with no source would be an opinion.</dd></div>
    <div><dt>gotchas</dt><dd>Free text, and the part practitioners actually read. Short, specific, and written by people who got caught by it.</dd></div>
    <div><dt>id</dt><dd>A stable slug. It is the URL, the filename and the join key, and it does not change once published.</dd></div>
  </div>
</section>

<section class="lsec">
  <p class="qline">Start in ten seconds</p>
  <h3>The smallest possible thing that works</h3>
  <pre class="code"><span class="c"># in a terminal</span>
curl -s ${SITE}/api/v1/protocols.json | jq <span class="s">'.[] | select(.id=="sacn") | .default_ports'</span>

<span class="c"># in a browser, on any page, with no build step</span>
<span class="k">const</span> p = <span class="k">await</span> (<span class="k">await</span> fetch(<span class="s">'${SITE}/api/v1/protocols.json'</span>)).json()
<span class="k">const</span> sacn = p.find(x =&gt; x.id === <span class="s">'sacn'</span>)

<span class="c"># or install it and never make a network call at all</span>
npm i showstack        <span class="c"># the dataset ships inside the package</span>
pip install showstack</pre>
</section>

<div class="rule"><span class="rmark">note</span><div>The data is <b>bundled into the packages</b>, not fetched by them. That is deliberate: a show machine on an isolated network still gets the whole index, and a build that pinned a version keeps working when this site does not.</div></div>

<section class="lsec">
  <p class="qline">Ready kit</p>
  <h3>Eight things you could ship this week</h3>
  <p>Each of these is short enough to read in full. None of them needs an account, a server, or permission.</p>
</section>

<div class="recipes2">

${recipe('for a show technician', 'A port lookup on your phone, offline',
  'The question you actually have at 1am is "what is on udp 6454". One HTML file, no build, works from a USB stick.',
  `<span class="c">&lt;!-- one file. Open it from anywhere, including file:// --&gt;</span>
&lt;input id="q" placeholder="6454"&gt;&lt;pre id="out"&gt;&lt;/pre&gt;
&lt;script type="module"&gt;
<span class="k">const</span> data = <span class="k">await</span> (<span class="k">await</span> fetch(<span class="s">'${SITE}/api/v1/protocols.json'</span>)).json()
q.oninput = () =&gt; {
  <span class="k">const</span> n = +q.value
  out.textContent = data
    .filter(p =&gt; (p.default_ports ?? []).some(x =&gt; x.number === n))
    .map(p =&gt; <span class="s">\`\${p.name} — \${p.summary}\`</span>).join(<span class="s">'\\n\\n'</span>) || <span class="s">'nothing on that port'</span>
}
&lt;/script&gt;`,
  'Cache the JSON in a service worker or just save the file with the data inlined, and it works with the network unplugged.')}

${recipe('for an integrator', 'Answer "can these two talk?" automatically',
  'Cross-reference what two boxes speak. This is the question a rider is actually asking, and it is a set intersection.',
  `<span class="k">const</span> [hw, sw] = <span class="k">await</span> Promise.all([
  fetch(<span class="s">'${SITE}/api/v1/hardware.json'</span>).then(r =&gt; r.json()),
  fetch(<span class="s">'${SITE}/api/v1/software.json'</span>).then(r =&gt; r.json()),
])
<span class="k">const</span> speaks = e =&gt; <span class="k">new</span> Set((e.speaks ?? []).map(s =&gt; s.protocol))

<span class="k">const</span> a = hw.find(x =&gt; x.id === <span class="s">'grandma3-full-size'</span>)
<span class="k">const</span> b = sw.find(x =&gt; x.id === <span class="s">'disguise-designer'</span>)
<span class="k">const</span> shared = [...speaks(a)].filter(p =&gt; speaks(b).has(p))

console.log(shared)  <span class="c">// the protocols both ends actually claim</span>`,
  'Add a <code>confidence</code> filter and you can separate "documented by the vendor" from "somebody on a forum said so", which is usually the difference that matters.')}

${recipe('for a lighting programmer', 'A console macro that checks a patch',
  'Most consoles script in Lua or Python. Load the dataset once at startup and you can validate a universe against what a protocol actually allows.',
  `<span class="c"># Python, inside TouchDesigner, a console plugin, or a check script</span>
<span class="k">import</span> json, urllib.request

url = <span class="s">"${SITE}/api/v1/protocols.json"</span>
protocols = json.load(urllib.request.urlopen(url))
sacn = <span class="k">next</span>(p <span class="k">for</span> p <span class="k">in</span> protocols <span class="k">if</span> p[<span class="s">"id"</span>] == <span class="s">"sacn"</span>)

<span class="k">print</span>(sacn[<span class="s">"universe_model"</span>])   <span class="c"># how universes are numbered</span>
<span class="k">for</span> g <span class="k">in</span> sacn.get(<span class="s">"gotchas"</span>, []):
    <span class="k">print</span>(<span class="s">"!"</span>, g)             <span class="c"># the things that bite, printed at load-in</span>`,
  'Print the gotchas into the show log on startup. It costs nothing and it puts the warning where somebody will read it.')}

${recipe('for a production manager', 'A spreadsheet of everything, refreshed',
  'Sheets and Excel both fetch JSON. Point one at the index and you have a live equipment reference nobody has to maintain.',
  `<span class="c">// Google Apps Script, bound to a sheet</span>
<span class="k">function</span> refresh() {
  <span class="k">const</span> rows = JSON.parse(UrlFetchApp.fetch(
    <span class="s">'${SITE}/api/v1/hardware.json'</span>).getContentText())
    .map(h =&gt; [h.name, h.vendor, h.category, h.form_factor ?? <span class="s">''</span>,
               (h.speaks ?? []).map(s =&gt; s.protocol).join(<span class="s">', '</span>)])
  <span class="k">const</span> sheet = SpreadsheetApp.getActiveSheet()
  sheet.clear()
  sheet.getRange(1, 1, rows.length, 5).setValues(rows)
}`,
  'Set it on a weekly trigger. The sheet stays current and nobody has to remember to update it.')}

${recipe('for a developer', 'A Companion module, or any control surface',
  'Bitfocus Companion modules are Node. A button that shows what a device speaks, or that looks up a port, is about twenty lines.',
  `<span class="c">// Node — no dependency beyond the runtime</span>
<span class="k">import</span> data <span class="k">from</span> <span class="s">'showstack/showstack.json'</span> <span class="k">with</span> { type: <span class="s">'json'</span> }

<span class="k">export const</span> lookupPort = (n) =&gt;
  data.protocols
    .filter(p =&gt; (p.default_ports ?? []).some(x =&gt; x.number === n))
    .map(p =&gt; ({ id: p.id, name: p.name, roles:
      p.default_ports.filter(x =&gt; x.number === n).map(x =&gt; x.role) }))

<span class="c">// bundled, so the surface works on an isolated show network</span>`,
  'If you build one, <a href="' + GH + '/issues/new?labels=tooling&amp;title=built+with+showstack%3A+">say so on the repo</a> and it goes on the list.')}

${recipe('for an AI tool', 'A tool definition a model can actually call',
  'The dataset is small, structured and cited, which makes it a good grounding source. Give a model the lookup rather than the whole file.',
  `<span class="c">// A tool definition — the model calls this instead of guessing</span>
{
  name: <span class="s">'showstack_lookup'</span>,
  description: <span class="s">'Look up a live-entertainment protocol, standard, ' +
    'software or hardware entry. Returns cited data, never a guess.'</span>,
  input_schema: {
    type: <span class="s">'object'</span>,
    properties: {
      collection: { type: <span class="s">'string'</span>,
        enum: [<span class="s">'protocols'</span>, <span class="s">'standards'</span>, <span class="s">'software'</span>, <span class="s">'hardware'</span>, <span class="s">'terms'</span>] },
      id: { type: <span class="s">'string'</span>, description: <span class="s">'the slug, e.g. "sacn"'</span> },
    },
    required: [<span class="s">'collection'</span>, <span class="s">'id'</span>],
  },
}`,
  'Every entry carries its <code>sources</code>, so a model using this can cite rather than assert — which is the specific failure mode described on <a href="/learn/ai/">the AI page</a>.')}

${recipe('for a student or teacher', 'A quiz, a poster, a revision deck',
  'The glossary is bilingual and domain-tagged, which makes it a ready-made deck. This is a flashcard generator in nine lines.',
  `<span class="k">const</span> terms = <span class="k">await</span> (<span class="k">await</span> fetch(<span class="s">'${SITE}/api/v1/terms.json'</span>)).json()

<span class="k">const</span> deck = terms
  .filter(t =&gt; t.domain === <span class="s">'lighting'</span>)
  .map(t =&gt; ({ front: t.en, back: t.zh_hant ?? t.definition, tag: t.domain }))

<span class="c">// export as CSV for Anki, or render straight onto a page</span>
console.log(deck.map(c =&gt; <span class="s">\`"\${c.front}","\${c.back}"\`</span>).join(<span class="s">'\\n'</span>))`,
  'CC BY 4.0 means you can print it, sell the printout, and put it on a classroom wall. Attribution is the only condition.')}

${recipe('for anyone', 'Find what is missing, and fill one field',
  'The gaps file is the to-do list, published. Pick a gap in something you own and you have a five-minute contribution with your name on it permanently.',
  `curl -s ${SITE}/api/v1/gaps.json | jq -r <span class="s">'
  .[] | select(.collection=="hardware")
      | "\\(.id): missing \\(.missing | join(", "))"'</span> | head

<span class="c"># then edit one file in the browser:</span>
<span class="c"># ${GH}/edit/main/data/hardware/&lt;id&gt;.yaml</span>`,
  'Every entry has an <em>Edit this entry</em> link at the bottom. One file, one field, one pull request, and your handle goes on it.')}

</div>

<section class="lsec">
  <p class="qline">The rules</p>
  <h3>What you may do with it</h3>
  <p><span class="pill2">CC BY 4.0</span> The data. Use it commercially, modify it, redistribute it. Credit showstack and link back.</p>
  <p><span class="pill2">MIT</span> The code in the repository, including the generators and the calculators.</p>
  <p><span class="pill2">no key</span> No account, no rate limit, no tracking, no analytics on the API. If you hammer it you are only hurting a CDN.</p>
  <p style="margin-top:14px">Two honest requests rather than conditions. <b>Pin a version if you depend on it</b> — the packages exist for exactly that, and the shape of the data is versioned in the path. And <b>send corrections back</b>: if you found something wrong while building on it, you are the best-placed person on earth to fix it, and it is one file.</p>
</section>

<div class="cta"><strong>Built something?</strong>
<p>Open an issue and it goes on the list, whatever it is — a macro, a spreadsheet, a Companion module, a poster on a workshop wall. <a href="${GH}/issues/new?labels=tooling&amp;title=built+with+showstack%3A+">Tell us about it</a>. And if a field you needed was empty, <a href="${GH}/issues/new?labels=data&amp;title=%5Bgap%5D+">say which one</a> — that is more useful than almost any other feedback.</p></div>
`

  return shell({
    title: 'Build on it — the free JSON API and a ready kit | showstack',
    description: 'Every collection is plain JSON at a fixed URL with permissive CORS: no key, no account, no rate limit. The endpoints, the field shapes that matter, and eight short recipes — an offline port lookup, an interop check, a console macro, a live spreadsheet, a Companion module, an AI tool definition, a bilingual flashcard deck, and how to fill a gap.',
    canonical: `${SITE}/build/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Build on the showstack API',
      description: 'Endpoints, data shapes and worked examples for using the open live-entertainment technology dataset.',
      url: `${SITE}/build/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
