/**
 * /offline/ — what a reader gets when they ask for a page that was never
 * saved and there is no network.
 *
 * The obvious implementation is to serve the home page instead, and it is
 * wrong: the address bar still says the page they asked for, so the site
 * appears to have quietly replaced their request with something else. This
 * says what happened and offers what genuinely is available.
 */
export function offlinePage({ esc, shell, SITE, GH, TOOL_COUNT }) {
  const body = `
<div class="crumb"><a href="/">showstack</a> / offline</div>
<h2>No network, and this page is not saved</h2>
<p class="lede">You asked for a page this device has not stored. Everything below <em>is</em> saved and works right now.</p>

<div class="offgrid">
  <a class="offcard" href="/tools/"><b>Field tools</b><em>All ${TOOL_COUNT} calculators. They compute on the page and never needed the network.</em></a>
  <a class="offcard" href="/learn/"><b>Explainers</b><em>Saved if you asked for them on the tools page. Otherwise the ones you have read.</em></a>
  <a class="offcard" href="/search/"><b>Search the index</b><em>Saved if you asked for it. The whole dataset, searchable, with no signal.</em></a>
  <a class="offcard" href="/"><b>Start again</b><em>The front page, and everything reachable from what is cached.</em></a>
</div>

<div class="cta">
  <strong>Want more of it available next time?</strong>
  <p>The <a href="/tools/">tools page</a> has a panel that saves the explainers and the searchable index to this
  device. It is a one-off download, it is stored by your browser, and nothing is sent anywhere.</p>
</div>`

  return shell({
    title: 'Offline — showstack',
    description: 'This page is not saved on this device and there is no network.',
    canonical: `${SITE}/offline/`,
    body,
    extraStyle: `
.offgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:13px;margin:24px 0}
.offcard{display:flex;flex-direction:column;gap:7px;padding:20px;border-radius:var(--r-lg);
border:1px solid var(--rule);background:var(--surface-raised);color:inherit;
transition:border-color var(--dur-fast),transform var(--dur-fast)}
.offcard:hover{border-color:var(--signal);transform:translateY(-2px);text-decoration:none}
.offcard b{font-size:17px;color:var(--ink);letter-spacing:-.2px}
.offcard em{font-style:normal;color:var(--ink-muted);font-size:14px;line-height:1.55}`,
  })
}
