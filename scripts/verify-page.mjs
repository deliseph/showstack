/**
 * /verify/ — the page for the people who make the things in this index.
 *
 * A manufacturer arriving here has one question, and it is not "how do I
 * sponsor you". It is "what is this site saying about my product, and can I
 * change it". The honest answer is worth writing down carefully, because the
 * moment money can move an entry the whole index is worth nothing:
 *
 *   - anyone can correct any entry, for free, including their own;
 *   - nobody can buy an entry, a position, a badge, or the removal of a
 *     true but unflattering fact;
 *   - sponsorship pays for hosting and nothing else, and is recorded
 *     nowhere near the data.
 *
 * The vendor table is the part that does the work. It is generated from the
 * dataset, so it cannot flatter anybody, and it gives each manufacturer a
 * single link that opens a pre-filled issue listing every entry we hold for
 * them. That turns "someone should check this" into twenty minutes of work
 * with a defined end.
 */

/** A GitHub issue URL with the body already written. */
function issueUrl(GH, title, body, labels) {
  const q = new URLSearchParams({ title, body, labels })
  return `${GH}/issues/new?${q.toString()}`
}

export function verifyPage({ esc, shell, SITE, GH, SPONSOR, db }) {
  const products = [...db.software, ...db.hardware]

  // ---- Who owns what, measured rather than asserted ----------------------
  const byVendor = new Map()
  for (const kind of ['software', 'hardware']) {
    for (const e of db[kind]) {
      if (!e.vendor) continue
      const row = byVendor.get(e.vendor) ?? { vendor: e.vendor, entries: [], verified: 0 }
      row.entries.push({ kind, id: e.id, name: e.name })
      if (e.confidence === 'verified') row.verified++
      byVendor.set(e.vendor, row)
    }
  }
  const vendors = [...byVendor.values()]
    .filter((v) => v.entries.length >= 2)
    .sort((a, b) => b.entries.length - a.entries.length || a.vendor.localeCompare(b.vendor))

  const all = [...db.protocols, ...products, ...db.standards]
  const verified = all.filter((e) => e.confidence === 'verified').length
  const reported = all.filter((e) => e.confidence === 'reported').length
  const unverified = all.length - verified - reported

  // Every interop claim we publish, and how sure we are of it. This is the
  // number a manufacturer cares about: it is their product's compatibility
  // matrix, written by strangers.
  let claims = 0
  let claimsUnverified = 0
  for (const e of products) {
    for (const s of e.speaks ?? []) {
      claims++
      if ((s.confidence ?? e.confidence) !== 'verified') claimsUnverified++
    }
  }

  const vendorIssue = (v) => {
    const list = v.entries.slice(0, 25)
    const body = [
      `I can speak for ${v.vendor} and I would like these entries checked.`,
      '',
      `showstack currently holds **${v.entries.length} ${v.entries.length === 1 ? 'entry' : 'entries'}** under this name.`,
      'Go through them and mark each one: correct, wrong, or out of date.',
      '',
      ...list.map((e) => `- [ ] \`${e.kind}/${e.id}\` — ${e.name} — ${SITE}/${e.kind}/${e.id}/`),
      ...(v.entries.length > list.length ? ['', `_(${v.entries.length - list.length} more not listed — they are all in the API at ${SITE}/api/v1/.)_`] : []),
      '',
      '### What is wrong',
      '',
      '',
      '### Where can we cite it',
      '',
      'A manual, spec sheet, release note or knowledge-base article we can link.',
      'If the only source is you, say so — we will record it as reported and',
      'name you as the source. We do not publish anything we cannot attribute.',
      '',
      '---',
      '',
      'No money changes hands over this in either direction. Verified is not a paid',
      `placement and sponsorship does not change what an entry says: ${SITE}/verify/`,
    ].join('\n')
    return issueUrl(GH, `[verify] ${v.vendor} — ${v.entries.length} entries`, body, 'verification,vendor')
  }

  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0)

  let rows = ''
  for (const v of vendors) {
    const share = pct(v.verified, v.entries.length)
    rows += `<tr>
      <th scope="row">${esc(v.vendor)}</th>
      <td class="num">${v.entries.length}</td>
      <td class="bar"><span class="track"><span class="fill" style="width:${share}%"></span></span><span class="pctv">${share}%</span></td>
      <td><a href="${esc(vendorIssue(v))}" rel="noopener nofollow">Check ${v.entries.length === 1 ? 'it' : 'them'}</a></td>
    </tr>`
  }

  const body = `
<div class="crumb"><a href="/">showstack</a> / verify</div>
<h2>Is this your product?</h2>
<p class="lede">This index describes ${products.length} pieces of software and hardware, and it publishes
${claims} claims about what they can talk to. Most of those claims were written by people who
use your product, not by you. You can fix that yourself, today, for nothing.</p>

<div class="vnums">
  <div><b>${claimsUnverified.toLocaleString('en')}</b><span>interop claims about somebody&rsquo;s product that nobody at that company has confirmed</span></div>
  <div><b>${pct(verified, all.length)}%</b><span>of entries have been checked against a first-party source</span></div>
  <div><b>&pound;0</b><span>what it costs to correct an entry, verify one, or have one added</span></div>
</div>

<h3>What this is not</h3>
<p>It is worth being blunt, because every trade index eventually gets asked this question.</p>
<ul class="plain">
  <li><b>You cannot buy an entry.</b> Not a listing, not a position, not a badge, not a category.
  There is no rate card because there is no rate.</li>
  <li><b>Sponsoring does not move data.</b> The <a href="${esc(SPONSOR)}" rel="noopener">sponsor button</a>
  pays for a domain and a build minute. It is recorded in a completely different place from the
  dataset, by design, and no sponsor has ever seen an entry before it published.</li>
  <li><b>You cannot delete a true fact.</b> If your protocol support needs a licence, that stays.
  If a firmware version broke something and the release notes say so, that stays. What you
  <em>can</em> do is correct it, date it, and tell us what changed.</li>
  <li><b>There are no logos here.</b> Your name appears because you make the thing, in the same
  typeface as everybody else&rsquo;s.</li>
</ul>

<h3>What verifying actually means</h3>
<p>Every entry and every interop claim carries one of three confidence levels. They are not
grades and the lowest one is not an accusation — it is just an honest note about where the
fact came from.</p>

<table class="conf">
  <caption>The confidence ladder, and what moves an entry up it</caption>
  <thead><tr><th scope="col">Level</th><th scope="col">What it means</th><th scope="col">What we needed to see</th></tr></thead>
  <tbody>
    <tr>
      <th scope="row"><span class="pill">unverified</span></th>
      <td>Somebody in the field told us, and it is plausible.</td>
      <td>Nothing yet. ${unverified} ${unverified === 1 ? 'entry sits' : 'entries sit'} here.</td>
    </tr>
    <tr>
      <th scope="row"><span class="pill">reported</span></th>
      <td>A public document says so, but not a first-party one.</td>
      <td>A manual, a forum post from an engineer, a conference talk. ${reported} entries.</td>
    </tr>
    <tr>
      <th scope="row"><span class="pill verified">verified</span></th>
      <td>A first-party source says so and we linked it.</td>
      <td>Your own documentation, spec sheet, release note or reply. ${verified} entries.</td>
    </tr>
  </tbody>
</table>

<p>Note the third row carefully: <b>a reply from you is a primary source.</b> You do not need to
publish anything new. If you comment on an issue saying &ldquo;that is right, but the direction is
output-only since firmware 4.2&rdquo;, we cite the issue, credit you, and the entry moves up.</p>

<h3>What you get out of it</h3>
<ul class="plain">
  <li><b>Your product described correctly where integrators check.</b> Somebody specifying a
  system at 2am is reading a compatibility list. Right now, on ${claimsUnverified} claims, that
  list is a stranger&rsquo;s best recollection.</li>
  <li><b>Machine-readable, so it travels.</b> Every entry is in <a href="/api/v1/index.json">a free
  JSON API</a> with no key and no rate limit, which is exactly what assistants, procurement tools
  and spec generators read. A wrong entry here becomes a wrong answer in a dozen places.</li>
  <li><b>A permanent, citable record.</b> Entries have stable URLs and a change history. When a
  customer asks whether you support a protocol, you can point at something neutral.</li>
  <li><b>Credit, if you want it.</b> Your handle goes on the entry you fixed. If you would rather
  it did not, say so and it will not.</li>
</ul>

<h3>Where the index stands, by vendor</h3>
<p>Generated from the dataset on every build, so it cannot be flattering. A low number is not a
criticism of the company — it means the entries were written by users and nobody from the vendor
has been through them yet. The link opens an issue with every entry we hold for you, already
listed, ready to be ticked or struck out.</p>

<div class="tblwrap">
<table class="vend">
  <caption>Vendors with two or more entries — ${vendors.length} of them</caption>
  <thead><tr>
    <th scope="col">Vendor</th>
    <th scope="col" class="num">Entries</th>
    <th scope="col">Vendor-confirmed</th>
    <th scope="col">Fix them</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
</div>

<h3>Three ways to do it, shortest first</h3>
<ol class="ways">
  <li><b>Find your row above and click the link.</b> It opens a GitHub issue listing every entry
  we hold for you. Tick what is right, strike what is not, and stop. We do the editing.</li>
  <li><b>Correct one page.</b> Every entry page has an <em>Edit this entry on GitHub</em> link
  that opens the underlying file in a browser text box. It is one YAML file per product, and
  you do not need to install anything.</li>
  <li><b>Send us a document.</b> <a href="${esc(issueUrl(GH, '[verify] new source for an entry', ['Entry:', '', 'Document:', '', 'What it corrects:', ''].join('\n'), 'verification'))}" rel="noopener nofollow">Open an issue</a>
  with a link to the manual or spec sheet and which entry it corrects. Somebody will do the
  transcription.</li>
</ol>

<div class="cta">
  <strong>Nothing about your product here yet?</strong>
  <p>That is a gap, not a policy. <a href="${esc(issueUrl(GH, '[new] add an entry', ['Product:', '', 'Vendor:', '', 'What it does, in a sentence:', '', 'What it can talk to (protocols, formats, control surfaces):', '', 'A public document we can cite:', ''].join('\n'), 'new-entry'))}" rel="noopener nofollow">Open an issue with the basics</a>
  and it gets added on the same terms as everything else: free, sourced, and correctable by anyone
  who finds a mistake in it — including you.</p>
</div>`

  return shell({
    title: 'Verify your own entry — for manufacturers and vendors | showstack',
    description: `showstack publishes ${claims} interop claims about ${products.length} products, most of them written by users rather than vendors. Manufacturers can confirm, correct or source their own entries for free. Entries cannot be bought, and sponsorship does not change what an entry says.`,
    canonical: `${SITE}/verify/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Can a manufacturer pay to change or remove a showstack entry?',
          acceptedAnswer: { '@type': 'Answer', text: 'No. Entries cannot be bought, and sponsorship pays for hosting only — it is recorded separately from the dataset and does not change what an entry says. Accurate but unflattering facts, such as a protocol requiring a licence, are not removed. Manufacturers can correct, source and verify their own entries for free.' },
        },
        {
          '@type': 'Question',
          name: 'What does a verified entry mean on showstack?',
          acceptedAnswer: { '@type': 'Answer', text: 'Verified means a first-party source supports the claim and is linked: vendor documentation, a spec sheet, a release note, or a written reply from the vendor. Reported means a public but non-first-party document supports it. Unverified means a practitioner reported it and nothing has been linked yet.' },
        },
        {
          '@type': 'Question',
          name: 'How does a vendor correct a showstack entry?',
          acceptedAnswer: { '@type': 'Answer', text: 'Open an issue listing the entries to check, edit the underlying YAML file directly in the browser from any entry page, or send a link to a manual or spec sheet and someone will transcribe it. All three are free and no account beyond a GitHub login is needed.' },
        },
      ],
    },
    body,
    extraStyle: `
/* Three figures read off the dataset, set as one measured strip divided by
   hairlines rather than three cards with an accent rail down the side. The
   numbers are the point; the container should not compete with them. */
.vnums{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));
margin:26px 0 34px;border-top:2px solid var(--ink);border-bottom:1px solid var(--rule-strong)}
.vnums div{padding:16px 20px 17px 0}
.vnums div+div{border-left:1px solid var(--rule);padding-left:20px}
.vnums b{display:block;font-size:34px;line-height:1;letter-spacing:-1.4px;
font-variant-numeric:tabular-nums;color:var(--ink)}
.vnums span{display:block;margin-top:9px;color:var(--ink-muted);font-size:13.5px;line-height:1.5}
@media(max-width:600px){
  .vnums div+div{border-left:0;border-top:1px solid var(--rule);padding-left:0}
  .vnums div{padding-right:0}
}
ul.plain{list-style:none;padding:0;margin:16px 0}
ul.plain li{padding:11px 0 11px 20px;border-top:1px solid var(--rule);position:relative;line-height:1.62}
ul.plain li:last-child{border-bottom:1px solid var(--rule)}
ul.plain li::before{content:"";position:absolute;left:0;top:1.02em;width:7px;height:1px;background:var(--signal)}
table.conf,table.vend{width:100%;border-collapse:collapse;margin:14px 0;font-size:14.5px}
table.conf caption,table.vend caption{text-align:left;color:var(--ink-faint);font-size:12.5px;
padding-bottom:9px;font-family:var(--mono);letter-spacing:.3px}
table.conf th,table.conf td,table.vend th,table.vend td{text-align:left;padding:10px 12px 10px 0;
border-bottom:1px solid var(--rule);vertical-align:top;font-weight:400}
table.conf thead th,table.vend thead th{font-family:var(--mono);font-size:11px;text-transform:uppercase;
letter-spacing:.5px;color:var(--ink-faint);border-bottom:1px solid var(--rule-strong)}
table.vend tbody th{font-weight:600;color:var(--ink)}
.tblwrap{overflow-x:auto;margin:14px 0}
table.vend .num{text-align:right;font-variant-numeric:tabular-nums;padding-right:18px;white-space:nowrap}
table.vend .bar{white-space:nowrap;min-width:132px}
/* Twenty-odd of these rows are at zero, so the empty track is the shape the
   eye meets most. Keep it quiet enough that the few filled ones read as the
   exception. The figure beside it carries the value in text, so the bar is
   decorative and does not owe 3:1. */
.track{display:inline-block;width:74px;height:8px;border-radius:4px;background:var(--rule);
overflow:hidden;vertical-align:-1px;margin-right:9px}
.fill{display:block;height:100%;background:var(--verified);border-radius:4px}
.pctv{font-variant-numeric:tabular-nums;color:var(--ink-muted);font-size:13px}
ol.ways{padding-left:1.25em;margin:16px 0}
ol.ways li{margin:11px 0;line-height:1.62;padding-left:5px}
/* Under 560px the vendor table squeezed "Luminex Network Intelligence" into
   three lines and broke "Check them" across two. Drop the bar - it is the one
   column whose information is already written next to it as a number - rather
   than make a phone scroll a table sideways. */
@media(max-width:560px){
  .track{display:none}
  table.vend{font-size:14px}
  table.vend th,table.vend td{padding-right:10px}
  table.vend .bar{min-width:0}
  table.vend td:last-child{white-space:nowrap}
}
@media(max-width:520px){
  /* caption included: on a table forced to display:block the caption keeps
     display:table-caption and shrink-to-fits, which set this one as a five
     word column three characters wide. */
  table.conf,table.conf caption,table.conf tbody,table.conf tr,table.conf td,table.conf th{display:block}
  table.conf thead{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
  table.conf tr{border-bottom:1px solid var(--rule-strong);padding-bottom:9px;margin-bottom:9px}
  table.conf td,table.conf th{border:0;padding:3px 0}
}`,
  })
}
