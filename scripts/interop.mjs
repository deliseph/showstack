/**
 * The interop picker: "can these two actually talk, and over what?"
 *
 * The matrix is the most defensible thing in this index, and until now it was
 * only browsable — you could read a protocol page and see who speaks it, but
 * you could not ask the question people actually arrive with, which is about
 * two specific boxes sitting in front of them.
 *
 * Runs entirely client side against a compact table inlined into the page, so
 * it works from a phone on venue wifi, from a laptop with no signal, and from
 * a file:// copy on a show machine. There is no backend to go down mid-show.
 *
 * The honesty rule matters more here than anywhere else on the site: an
 * integrator may commit a client's money to this answer. So the page reports
 * "nothing indexed" as its own distinct outcome, never as "no", and it always
 * surfaces the confidence and any licence requirement rather than flattening
 * everything into a green tick.
 */

export function interopPage({ esc, shell, jsonForScript, SITE, GH, products, protocols }) {
  // Only the fields the picker needs. The full bundle is megabytes; this is
  // a few tens of kilobytes, which is the difference between a page that loads
  // on a bad 4G connection backstage and one that does not.
  const compact = {
    products: products
      .filter((p) => (p.speaks ?? []).length)
      .map((p) => ({
        i: p.id,
        n: p.name,
        v: p.vendor ?? '',
        k: p.kind,
        s: (p.speaks ?? []).map((s) => ({
          p: s.protocol,
          d: s.direction,
          c: s.confidence ?? p.confidence ?? 'reported',
          l: s.requires_licence ? 1 : 0,
          t: s.note ?? '',
        })),
      }))
      .sort((a, b) => a.n.localeCompare(b.n)),
    protocols: Object.fromEntries(protocols.map((p) => [p.id, p.name])),
  }

  const body = `
<div class="crumb"><a href="/">showstack</a> / interop</div>
<h2>Can these two talk?</h2>
<p class="lede">Pick two things. This answers whether one can reach the other, over which protocol, in which direction, and how much we trust that claim. Everything comes from the index, and anything nobody could source is reported as unknown rather than guessed.</p>

<div class="picker">
  <label for="a">From</label>
  <select id="a" aria-describedby="answer"></select>
  <label for="b">To</label>
  <select id="b" aria-describedby="answer"></select>
</div>

<div id="answer" role="status" aria-live="polite"></div>

<div class="cta">
  <strong>Answer look wrong?</strong>
  <p>Each row above comes from one product's <code>speaks</code> list, and every entry is one file. If a device does something the index does not know about, <a href="${GH}/issues/new?labels=data&amp;title=interop%3A+">tell us here</a> or edit the entry directly. Corrections carry your handle.</p>
</div>`

  const style = `
.picker{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:10px;align-items:center;margin:0 0 26px}
.picker label{font-family:var(--mono);font-size:12px;text-transform:uppercase;letter-spacing:.6px;color:var(--dimmer)}
.picker select{width:100%;padding:10px 12px;background:var(--panel);color:var(--ink);border:1px solid var(--line);
border-radius:8px;font-family:var(--sans);font-size:15px;min-height:44px}
.picker select:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media(max-width:620px){.picker{grid-template-columns:1fr;gap:6px}.picker label{margin-top:8px}}
.verdict{border:1px solid var(--line);border-radius:10px;padding:18px 20px;margin-bottom:18px;background:var(--panel)}
.verdict .big{font-size:20px;font-weight:600;display:block;margin-bottom:4px}
.verdict.yes{border-left:3px solid var(--ok)}.verdict.yes .big{color:var(--ok)}
.verdict.no{border-left:3px solid var(--warn)}.verdict.no .big{color:var(--warn)}
.verdict.unknown{border-left:3px solid var(--accent2)}.verdict.unknown .big{color:var(--accent2)}
.verdict p{margin:0;color:var(--dim);font-size:15px}
.path{display:flex;gap:10px;align-items:baseline;padding:11px 0;border-bottom:1px solid var(--line);flex-wrap:wrap}
.path .proto{font-family:var(--mono);font-size:15px;color:var(--accent);font-weight:600}
.path .dir{font-size:13px;color:var(--dimmer);font-family:var(--mono)}
.path .note{flex-basis:100%;font-size:13.5px;color:var(--dimmer)}`

  // The picker logic. Written plainly and without dependencies: this file is
  // read by contributors who write YAML, not by front-end engineers.
  const script = `
const DB = ${jsonForScript(compact)};
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function options(sel, selected){
  sel.innerHTML = DB.products.map(p =>
    '<option value="' + esc(p.i) + '"' + (p.i === selected ? " selected" : "") + '>' +
    esc(p.n) + (p.v ? " — " + esc(p.v) : "") + "</option>").join("");
}

// One direction: what can A send that B can receive.
function pathsFrom(a, b){
  const out = [];
  for (const s of a.s){
    if (s.d === "in") continue;                 // A cannot send it
    const match = b.s.find(x => x.p === s.p && x.d !== "out");  // B can receive it
    if (!match) continue;
    out.push({
      proto: s.p,
      name: DB.protocols[s.p] || s.p,
      // Report the weaker of the two claims. A verified sender talking to an
      // unverified receiver is an unverified link overall, and saying
      // otherwise would overstate what anyone actually checked.
      confidence: weaker(s.c, match.c),
      licence: s.l || match.l,
      notes: [s.t, match.t].filter(Boolean),
    });
  }
  return out;
}

const RANK = { unverified: 0, reported: 1, verified: 2 };
const weaker = (x, y) => (RANK[x] <= RANK[y] ? x : y);

function renderPaths(paths, from, to){
  if (!paths.length) return "";
  return '<h3>' + esc(from.n) + " → " + esc(to.n) + " (" + paths.length + ')</h3>' +
    paths.map(p =>
      '<div class="path"><span class="proto"><a href="/protocols/' + esc(p.proto) + '/">' + esc(p.name) + "</a></span>" +
      '<span class="dir">' + esc(p.confidence) + "</span>" +
      (p.licence ? '<span class="pill port">needs licence</span>' : "") +
      (p.notes.length ? '<span class="note">' + esc(p.notes.join(" · ")) + "</span>" : "") +
      "</div>").join("");
}

function render(){
  const a = DB.products.find(p => p.i === $("#a").value);
  const b = DB.products.find(p => p.i === $("#b").value);
  if (!a || !b) return;

  if (a.i === b.i){
    $("#answer").innerHTML = '<div class="verdict unknown"><span class="big">Same product</span>' +
      "<p>Pick two different things.</p></div>";
    return;
  }

  const ab = pathsFrom(a, b);
  const ba = pathsFrom(b, a);
  const total = ab.length + ba.length;

  let verdict;
  if (total > 0){
    const allLicensed = [...ab, ...ba].every(p => p.licence);
    verdict = '<div class="verdict yes"><span class="big">Yes — ' + total +
      (total === 1 ? " path" : " paths") + '</span><p>' +
      (ab.length && ba.length ? "They can reach each other in both directions." :
       ab.length ? esc(a.n) + " can send to " + esc(b.n) + ", but not the other way round in anything we have indexed." :
                   esc(b.n) + " can send to " + esc(a.n) + ", but not the other way round in anything we have indexed.") +
      (allLicensed ? " Every path here needs a paid tier, dongle or licence." : "") +
      "</p></div>";
  } else {
    // The important distinction. "We have no record" is not "it cannot".
    const thin = a.s.length < 3 || b.s.length < 3;
    verdict = '<div class="verdict ' + (thin ? "unknown" : "no") + '"><span class="big">' +
      (thin ? "Nothing indexed" : "No shared protocol indexed") + "</span><p>" +
      (thin
        ? "One of these entries is still thin, so this is a gap in the index rather than a statement about the gear. Worth checking the manual, and worth filling in."
        : "Neither can send anything the other is recorded as receiving. That usually means you need a gateway, a converter, or a protocol one of them has that we have not indexed yet.") +
      "</p></div>";
  }

  $("#answer").innerHTML = verdict + renderPaths(ab, a, b) + renderPaths(ba, b, a);

  // Keep the URL shareable, so an answer can be pasted into a production
  // channel or a tender document and still resolve for the next person.
  const url = new URL(location.href);
  url.searchParams.set("a", a.i);
  url.searchParams.set("b", b.i);
  history.replaceState(null, "", url);
}

const params = new URLSearchParams(location.search);
options($("#a"), params.get("a") || DB.products[0]?.i);
options($("#b"), params.get("b") || DB.products[1]?.i);
$("#a").addEventListener("change", render);
$("#b").addEventListener("change", render);
render();`

  return shell({
    title: 'Can these two talk? Interoperability checker | showstack',
    description: 'Pick any two pieces of live entertainment gear and see whether they can reach each other, over which protocol, in which direction, with a source and a confidence level on every claim.',
    canonical: `${SITE}/interop/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'showstack interoperability checker',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      url: `${SITE}/interop/`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
