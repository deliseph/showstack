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
import { LEARN_CSS, LEARN_TOPICS, LEARN_GROUPS, LEARN_CAPSTONE, learnNav } from './learn-kit.mjs'

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
/* The capstone sits above the stages because it is what they are all for. */
.cap{display:block;margin:28px 0 6px;padding:26px 28px;border-radius:var(--r-lg);color:inherit;
background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 11%,var(--panel)),var(--panel));
border:1px solid color-mix(in srgb,var(--accent) 34%,var(--line));transition:border-color .18s,transform .18s}
.cap:hover{border-color:color-mix(in srgb,var(--accent) 62%,var(--line));transform:translateY(-2px);
text-decoration:none}
.cap .ct{font-family:var(--mono);font-size:11px;letter-spacing:.7px;text-transform:uppercase;
color:var(--accent);display:block;margin-bottom:12px}
.cap h3{margin:0 0 10px;font-size:clamp(21px,3vw,27px);font-family:var(--sans);text-transform:none;
letter-spacing:-.4px;color:var(--ink);font-weight:660}
.cap p{margin:0;color:var(--dim);font-size:15px;line-height:1.6;max-width:64ch}
.cap .cq{margin-top:15px;padding-top:13px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;
gap:6px 18px;font-size:12.5px;color:var(--dimmer);font-family:var(--mono)}
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
${learnNav(esc, null)}
<div class="lhero">
  <h2>Why it behaves like that</h2>
  <p class="lede">Twenty-five explainers, arranged as one chain — the mechanism drawn moving, so the rule stays with you after you close the tab. The index tells you what a thing is; the tools give you the number for tonight; this is the part in between that nobody writes down.</p>
</div>

<p style="color:var(--dim);font-size:15.5px;max-width:66ch">They are arranged as one chain, because that is what they are. Something physical becomes a signal, the signal survives a wire, a network and the air, it becomes something in a room, it agrees with other systems about time and space, and it finally arrives at a nervous system — which is the only part of it that was ever the point. The last stage is the machines we built to imitate that nervous system, which is the right place for them.</p>

<nav class="chain" aria-label="The stages">${chain}</nav>

<a class="cap" href="/learn/${esc(LEARN_CAPSTONE.slug)}/">
  <span class="ct">Start here if you only read one</span>
  <h3>${esc(LEARN_CAPSTONE.title)}</h3>
  <p>${esc(LEARN_CAPSTONE.blurb)}</p>
  <div class="cq">${LEARN_CAPSTONE.questions.map((q) => `<span>${esc(q)}</span>`).join('')}</div>
</a>

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
      hasPart: [LEARN_CAPSTONE, ...LEARN_TOPICS].map((t) => ({
        '@type': 'TechArticle',
        name: t.title,
        url: `${SITE}/learn/${t.slug}/`,
      })),
    },
    body,
    extraStyle: style,
  })
}
