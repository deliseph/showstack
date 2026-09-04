/**
 * Comparison pages: "art-net vs sacn", "dante vs aes67", and the rest.
 *
 * These are the highest-intent searches in the whole domain and every existing
 * answer is a forum thread from 2013 with three contradictory replies. Owning
 * them is the single cheapest distribution the project has.
 *
 * The important design decision: the *pairs* are curated, because only a human
 * knows which comparisons people actually agonise over. The *content* is
 * derived entirely from the dataset, because hand-written comparison prose goes
 * stale the moment someone corrects a port number, and stale prose is exactly
 * what this project exists to replace.
 *
 * Consequence: adding a fact to a protocol entry improves every comparison page
 * that protocol appears on, for free. Nobody has to remember to update them.
 */

import { MEDIA_ROWS, hasMedia, mediaNotes } from './media.mjs'
import { flowOf, FLOWS } from './flows.mjs'

/**
 * Curated pairs. `ask` is the question a real person types, in their words.
 * It becomes the FAQ answer target, so it should read like a question, not a
 * heading. Pairs referencing protocols not in the dataset are skipped silently,
 * so this list can name things before they are written.
 */
export const PAIRS = [
  ['art-net', 'sacn', 'Which should I use for network DMX?'],
  ['dante', 'aes67', 'Can Dante and AES67 talk to each other?'],
  ['dante', 'avb-milan', 'Which networked audio standard should a venue specify?'],
  ['dante', 'ravenna', 'How do Dante and RAVENNA differ in practice?'],
  ['ltc', 'mtc', 'Which timecode should I send to lighting and video?'],
  ['psn', 'rttrpm', 'Which tracking protocol does my media server actually take?'],
  ['ndi', 'smpte-st-2110', 'Is NDI good enough, or do I need ST 2110?'],
  ['dmx512', 'sacn', 'What is the difference between DMX and sACN?'],
  ['osc', 'midi-show-control', 'Should show control run on OSC or MSC?'],
  ['aes50', 'dante', 'Why can I not plug AES50 into a network switch?'],
  ['midi', 'midi-2', 'Is MIDI 2.0 worth it for show control yet?'],
  ['acn', 'sacn', 'Are ACN and sACN the same thing?'],
  ['sdi', 'smpte-st-2110', 'Do I still need SDI if the facility is going IP?'],
  ['madi', 'dante', 'Is MADI still worth running next to a Dante network?'],
  ['aes3', 'spdif', 'Can I plug an AES3 output into an S/PDIF input?'],
]

/** Fields compared, in the order a reader wants them. */
const ROWS = [
  ['Category', (p) => p.category],
  // Above ports on purpose. Two protocols in the same flow are alternatives;
  // two in different flows are usually not a choice at all, and a reader who
  // learns that in row two is spared the other eighteen.
  ['Flow', (p) => { const f = flowOf(p); return f && f.flow ? `${FLOWS[f.flow].label} — ${FLOWS[f.flow].short.toLowerCase()}` : '' }],
  ['Ports', (p) => (p.default_ports ?? []).map((x) => `${x.transport.toUpperCase()} ${x.number}`).join(', ')],
  ['Transport', (p) => (p.transport ?? []).join(', ')],
  ['Multicast', (p) => (p.multicast?.used ? (p.multicast.ranges ?? []).join(', ') || 'yes' : p.multicast ? 'no' : '')],
  ['Addressing', (p) => p.universe_model],
  ['Spec availability', (p) => p.openness],
  ['Steward', (p) => p.steward],
  ['First published', (p) => p.first_published],
  ['Status', (p) => p.status],
  ['Our confidence', (p) => p.confidence],
]

/**
 * Build one comparison page.
 *
 * Takes the rendering helpers from pages.mjs rather than importing them, so
 * there is exactly one definition of escaping and one page shell. Passing them
 * in is uglier than importing but it keeps the escaping rule in one file, which
 * is the property that actually matters after the XSS fix.
 */
export function comparisonPage(a, b, ask, { esc, trunc, shell, SITE, GH, products }) {
  const title = `${a.name} vs ${b.name} — what actually differs | showstack`

  // The meta description is what shows in the result. Lead with the single
  // most useful discriminator we have rather than a generic blurb.
  const portsA = (a.default_ports ?? []).map((x) => `${x.transport.toUpperCase()} ${x.number}`).join(', ')
  const portsB = (b.default_ports ?? []).map((x) => `${x.transport.toUpperCase()} ${x.number}`).join(', ')
  const description = trunc(
    `${a.name}${portsA ? ` (${portsA})` : ''} and ${b.name}${portsB ? ` (${portsB})` : ''} compared field by field, with a source on every claim. ${ask}`
  )

  let body = `<div class="crumb"><a href="/">showstack</a> / compare / ${esc(a.id)}-vs-${esc(b.id)}</div>`
  body += `<h2>${esc(a.name)} vs ${esc(b.name)}</h2>`
  body += `<p class="lede">${esc(ask)} Below is every field we hold on both, side by side. Each one is sourced on the individual entry, and anything nobody could source is left blank rather than guessed.</p>`

  // ---- the specification table ----
  const rows = ROWS
    .map(([label, get]) => [label, get(a), get(b)])
    .filter(([, x, y]) => x || y)
    .map(([label, x, y]) =>
      `<tr><td><strong>${esc(label)}</strong></td><td>${esc(x ?? '—')}</td><td>${esc(y ?? '—')}</td></tr>`)
    .join('')

  const head = `<tr><th></th><th><a href="/protocols/${esc(a.id)}/">${esc(a.name)}</a></th><th><a href="/protocols/${esc(b.id)}/">${esc(b.name)}</a></th></tr>`

  body += `<h3>Side by side</h3><table>${head}${rows}</table>`

  // The flow tells you what to worry about, and it is the same sentence for
  // every protocol in that flow — so say it once when they match, and say
  // both when they do not, because that difference is the answer to the
  // question the page is titled with.
  const fa = flowOf(a)
  const fb = flowOf(b)
  if (fa?.flow && fb?.flow) {
    if (fa.flow === fb.flow) {
      body += `<p style="color:var(--dim)"><strong>Both are ${esc(FLOWS[fa.flow].label.toLowerCase())} flows.</strong>
        ${esc(FLOWS[fa.flow].kills)} That applies equally to either, so it is not a discriminator here.</p>`
    } else {
      body += `<p style="color:var(--dim)"><strong>These are not the same kind of traffic.</strong>
        ${esc(a.name)} is a ${esc(FLOWS[fa.flow].label.toLowerCase())} flow: ${esc(FLOWS[fa.flow].kills)}
        ${esc(b.name)} is a ${esc(FLOWS[fb.flow].label.toLowerCase())} flow: ${esc(FLOWS[fb.flow].kills)}</p>`
    }
  }

  // ---- what each one can actually carry ----
  // Kept out of the table above rather than appended to it. That table answers
  // "what is this thing"; this one answers "will it do the job", and somebody
  // choosing between NDI and ST 2110 is asking the second question. Nineteen
  // undifferentiated rows would bury it.
  if (hasMedia(a) || hasMedia(b)) {
    const mrows = MEDIA_ROWS
      .map(([label, get]) => [label, get(a), get(b)])
      .filter(([, x, y]) => x || y)
      .map(([label, x, y]) =>
        `<tr><td><strong>${esc(label)}</strong></td><td>${esc(x || '—')}</td><td>${esc(y || '—')}</td></tr>`)
      .join('')
    body += `<h3>What each one carries</h3>
      <p style="color:var(--dim)">Capability defined by the specification, not by any one product. A blank means the specification does not fix it, which is itself the answer on a transport like SRT.</p>
      <table>${head}${mrows}</table>`

    // The caveats are the half of this that people quote wrongly. 48 kHz on
    // AES67 without "and that is the mandatory interoperability point" is how
    // a rig gets specified that does not work on site.
    const notes = [a, b].flatMap((p) => mediaNotes(p).map(([kind, note]) => [p.name, kind, note]))
    if (notes.length) {
      body += notes.map(([name, kind, note]) =>
        `<p style="color:var(--dim)"><strong>${esc(name)}, ${esc(kind.toLowerCase())}:</strong> ${esc(note)}</p>`).join('')
    }
  }

  // ---- what speaks which ----
  // This is the part no other page on the internet has, and it is why someone
  // mid-spec would bookmark this rather than a forum thread.
  const speak = (p) => new Set((p.spoken_by ?? []).map((s) => s.id))
  const A = speak(a)
  const B = speak(b)
  const both = products.filter((p) => A.has(p.id) && B.has(p.id))
  const onlyA = products.filter((p) => A.has(p.id) && !B.has(p.id))
  const onlyB = products.filter((p) => B.has(p.id) && !A.has(p.id))

  const list = (items) => items.length
    ? `<ul>${items.map((p) => `<li><a href="/${p.kind}/${esc(p.id)}/">${esc(p.name)}</a>${p.vendor ? ` <span style="color:var(--dimmer);font-size:13px">${esc(p.vendor)}</span>` : ''}</li>`).join('')}</ul>`
    : `<p style="color:var(--dimmer)">Nothing indexed yet. <a href="${GH}/issues">That is a gap worth filling.</a></p>`

  if (both.length) {
    body += `<h3>Speaks both (${both.length})</h3>
      <p style="color:var(--dim)">These are the safe choices if you have not committed to either, or need to bridge the two.</p>${list(both)}`
  }
  if (onlyA.length) body += `<h3>${esc(a.name)} only (${onlyA.length})</h3>${list(onlyA)}`
  if (onlyB.length) body += `<h3>${esc(b.name)} only (${onlyB.length})</h3>${list(onlyB)}`

  // ---- the gotchas, which is what people are really searching for ----
  const gotchaBlock = (p) => (p.gotchas ?? []).length
    ? `<h3>What goes wrong with ${esc(p.name)}</h3>` + p.gotchas.map((g) => `<div class="gotcha">${esc(g)}</div>`).join('')
    : ''
  body += gotchaBlock(a) + gotchaBlock(b)

  // ---- sources from both entries, deduplicated ----
  const seen = new Set()
  const sources = [...(a.sources ?? []), ...(b.sources ?? [])].filter((s) => {
    if (seen.has(s.url)) return false
    seen.add(s.url)
    return true
  })
  if (sources.length) {
    body += `<h3>Sources</h3><ul>` + sources.map((s) =>
      `<li><a href="${esc(s.url)}" rel="noopener nofollow">${esc(s.title)}</a>${s.publisher ? ` — ${esc(s.publisher)}` : ''}${s.primary ? ' <span class="pill verified">primary</span>' : ''}</li>`).join('') + `</ul>`
  }

  body += `<div class="cta"><strong>Disagree with any of this?</strong>
    <p>Every claim above comes from one of the two entries and carries a source. If one is wrong, correcting it is a single file and it fixes this page automatically.
    <a href="${GH}/edit/main/data/protocols/${esc(a.id)}.yaml">Edit ${esc(a.name)}</a> or
    <a href="${GH}/edit/main/data/protocols/${esc(b.id)}.yaml">edit ${esc(b.name)}</a>.</p></div>`

  // FAQPage markup targets the "People also ask" box, which is where this
  // kind of question actually surfaces.
  const answer = trunc(
    `${a.name}: ${a.summary} ${b.name}: ${b.summary}`.replace(/\s+/g, ' '), 600
  )

  return shell({
    title,
    description,
    canonical: `${SITE}/compare/${a.id}-vs-${b.id}/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{
        '@type': 'Question',
        name: `${a.name} vs ${b.name}: ${ask}`,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      }],
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
      citation: sources.map((s) => s.url),
    },
    body,
  })
}

/** Index page listing every comparison, so they are crawlable from one place. */
export function comparisonIndex(pairs, { esc, shell, SITE }) {
  const rows = pairs.map(([a, b, ask]) =>
    `<tr><td><strong><a href="/compare/${esc(a.id)}-vs-${esc(b.id)}/">${esc(a.name)} vs ${esc(b.name)}</a></strong></td>
     <td>${esc(ask)}</td></tr>`).join('')

  return shell({
    title: 'Protocol comparisons — live entertainment technology | showstack',
    description: 'Side-by-side comparisons of the protocols people actually have to choose between: Art-Net vs sACN, Dante vs AES67, PSN vs RTTrPM, and more. Sourced.',
    canonical: `${SITE}/compare/`,
    body: `<div class="crumb"><a href="/">showstack</a> / compare</div>
      <h2>Comparisons</h2>
      <p class="lede">The choices that come up on real jobs, compared field by field from the index rather than from memory. ${pairs.length} pairs so far.</p>
      <table><tr><th>Comparison</th><th>The question behind it</th></tr>${rows}</table>
      <div class="cta"><strong>A comparison you keep having to explain?</strong>
      <p>Open an issue naming the two, and it becomes a page.</p></div>`,
  })
}
