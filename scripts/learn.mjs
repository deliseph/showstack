/**
 * /learn/ — the hub for the explainers.
 *
 * The index answers "what is this thing and what are its numbers". The tools
 * answer "what is the answer for my show tonight". This section answers the
 * question in between, which is the one nobody writes down: *why does it
 * behave like that*.
 *
 * The hub is organised as a chain rather than as a list, because that is the
 * claim the section is making: a signal leaves a console, survives a wire, a
 * network and the air, becomes something in a room, agrees with several other
 * systems about time and space, and finally arrives at a nervous system. Five
 * stages, in that order, and every page belongs to exactly one of them.
 *
 * Cards lead with the questions rather than the topics, because that is how
 * the material is actually looked for - nobody searches for "RS-485 unit
 * loads", they search for whether they can put forty fixtures on one line.
 */
import { LEARN_CSS, LEARN_TOPICS, LEARN_GROUPS } from './learn-kit.mjs'

export function learnPage({ esc, shell, SITE, GH }) {
  const style = LEARN_CSS + `
.chain{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:24px 0 6px;font-family:var(--mono);
font-size:11.5px}
.chain a{border:1px solid var(--line);border-radius:999px;padding:7px 14px;color:var(--dim);
background:var(--panel);text-decoration:none;transition:border-color .18s,color .18s}
.chain a:hover{border-color:color-mix(in srgb,var(--accent) 50%,var(--line));color:var(--accent);
text-decoration:none}
.chain i{color:var(--dimmer);font-style:normal}
.stage{margin:44px 0 0;padding-top:26px;border-top:1px solid var(--line)}
.stage:first-of-type{border-top:none;padding-top:0;margin-top:34px}
.stage .shead{display:flex;gap:14px;align-items:baseline;flex-wrap:wrap;margin-bottom:6px}
.stage > .shead h3{font-family:var(--sans);font-size:23px;letter-spacing:-.3px;text-transform:none;color:var(--ink);
margin:0;font-weight:650}
.stage .num{font-family:var(--mono);font-size:11.5px;color:var(--accent);letter-spacing:.8px;
border:1px solid color-mix(in srgb,var(--accent) 38%,transparent);border-radius:999px;padding:3px 10px}
.stage > p{color:var(--dim);font-size:15px;max-width:64ch;margin:0}
.lintro{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin:26px 0 8px}
.lintro div{border-left:2px solid var(--line);padding:2px 0 2px 14px}
.lintro dt{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.6px;
color:var(--accent);margin-bottom:5px}
.lintro dd{margin:0;color:var(--dim);font-size:14px;line-height:1.55}
.lgrid{margin-top:18px}
@media(max-width:640px){.stage > .shead h3{font-size:20px}}
`

  const card = (t) => `
  <a class="lcard" href="/learn/${esc(t.slug)}/">
    <span class="ltag">${esc(t.tag)}</span>
    <h3>${esc(t.title)}</h3>
    <p>${esc(t.blurb)}</p>
    <div class="lq">${t.questions.map((q) => `<span>${esc(q)}</span>`).join('')}</div>
  </a>`

  const chain = LEARN_GROUPS.map((g) => `<a href="#${esc(g.id)}">${esc(g.name)}</a>`)
    .join('<i>→</i>')

  const body = `
<div class="crumb"><a href="/">showstack</a> / learn</div>
<div class="lhero">
  <h2>Why it behaves like that</h2>
  <p class="lede">The index tells you what a thing is. The tools give you the number for tonight. These pages are the part in between — the mechanism, drawn moving, so the rule stays with you after you close the tab.</p>
</div>

<p style="color:var(--dim);font-size:15.5px;max-width:66ch">They are arranged as one chain, because that is what they are. A signal leaves a console, survives a wire, a network and the air, becomes something in a room, agrees with several other systems about time and space, and finally arrives at a nervous system — which is the only part of it that was ever the point.</p>

<nav class="chain" aria-label="The five stages">${chain}</nav>

<dl class="lintro">
  <div><dt>Built on the index</dt><dd>Every claim links to the protocol, standard or term it comes from, so you can go from the explanation to the citation in one click.</dd></div>
  <div><dt>Interactive, not decorative</dt><dd>Drag the prefix, terminate the line, switch the access method. The figures are the thing being explained, not an illustration of it.</dd></div>
  <div><dt>Written from load-in</dt><dd>Each page ends with what actually goes wrong when the rule is ignored — the failure you would otherwise learn about in front of an audience.</dd></div>
</dl>

${LEARN_GROUPS.map((g, i) => {
  const topics = LEARN_TOPICS.filter((t) => t.group === g.id)
  return `
<section class="stage" id="${esc(g.id)}">
  <div class="shead"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(g.name)}</h3></div>
  <p>${esc(g.lede)}</p>
  <div class="lgrid">${topics.map(card).join('')}</div>
</section>`
}).join('')}

<div class="cta"><strong>Something here explained badly, or missing entirely?</strong>
<p>This material is hand-written rather than generated from the dataset, so corrections are a pull request against one file. <a href="${GH}/issues/new?labels=tooling&amp;title=learn%3A+">Open an issue</a> and say which bit did not land — that is genuinely the most useful thing you can send.</p></div>
`

  return shell({
    title: 'Learn — show networking and control, explained | showstack',
    description: 'Interactive explainers arranged as one chain: DMX unit loads and termination, show networks and subnetting, wireless multiple access and WMAS, choosing a radio, sound measurement and delay alignment, beams and blends, CAD and BIM, integrated systems, drone shows and pyro, APIs, programming languages and game engines, and the human perception the whole thing is aimed at.',
    canonical: `${SITE}/learn/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'showstack learn',
      description: 'Interactive explainers covering the whole chain from a control signal on a wire to the nervous system that receives it.',
      url: `${SITE}/learn/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
      hasPart: LEARN_TOPICS.map((t) => ({
        '@type': 'TechArticle',
        name: t.title,
        url: `${SITE}/learn/${t.slug}/`,
      })),
    },
    body,
    extraStyle: style,
  })
}
