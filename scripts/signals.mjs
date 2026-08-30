/**
 * /signals/ — hub page for the signal & connector reference material.
 *
 * This used to be one long page with everything from serial-vs-parallel data
 * to connector pinouts stacked on top of each other. That was bad IA: three
 * genuinely different questions ("how does data move," "which cable/fibre/
 * radio do I pull," "what's specific to getting an image on a screen or in a
 * headset") were sharing one scroll, so none of them read as a place you'd
 * bookmark for a specific job. Split into three category pages instead; this
 * page is just the index between them, plus the framing that ties them
 * together — why "8 Ω" or "HDMI" or "Cat6" printed on two different things
 * doesn't mean those two things behave the same.
 */
export function signalsPage({ esc, shell, SITE, GH }) {
  const style = `
.hubgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-top:22px}
.hubcard{background:var(--panel);border:1px solid var(--line);border-radius:var(--r-lg);padding:24px;display:block;color:inherit;transition:border-color .15s,transform .15s}
.hubcard:hover{border-color:color-mix(in srgb,var(--accent) 40%,var(--line));transform:translateY(-2px);text-decoration:none}
.hubcard .hubtag{display:inline-block;font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.5px;padding:3px 9px;border-radius:999px;margin-bottom:14px;border:1px solid var(--line)}
.hubcard .hubtag.dom-network{color:var(--dom-network);border-color:color-mix(in srgb,var(--dom-network) 40%,transparent)}
.hubcard .hubtag.dom-visual{color:var(--dom-visual);border-color:color-mix(in srgb,var(--dom-visual) 40%,transparent)}
.hubcard h3{margin:0 0 8px;font-size:19px}
.hubcard p{margin:0;color:var(--dim);font-size:14px;line-height:1.55}
.hubcard .hubtopics{margin-top:16px;padding-top:14px;border-top:1px solid var(--line);font-size:12px;color:var(--dimmer);font-family:var(--mono);line-height:1.7}
`

  const body = `
<div class="crumb"><a href="/">showstack</a> / signals</div>
<h2>Signal &amp; connector reference</h2>
<p class="lede">Why two cables both rated &ldquo;8&nbsp;&Omega;&rdquo;, or two ports both called &ldquo;HDMI&rdquo;, or two runs both called &ldquo;Cat6&rdquo;, can behave completely differently. This section is for <em>looking something up</em> &mdash; the tables, the version numbers, the pinouts. When you want to know <em>why</em> rather than <em>which</em>, <a href="/learn/">the explainers</a> have the same subjects at length, with the figures. Pick the question you actually have:</p>

<div class="hubgrid">
  <a class="hubcard" href="/signals/data/">
    <span class="hubtag dom-network">Concepts</span>
    <h3>Data &amp; networking fundamentals</h3>
    <p>The layer model as a table, so you can see where each thing indexed here sits and what that lets it do. Signalling rates for USB, Thunderbolt, PCIe and Ethernet. And where analogue and digital fail differently, department by department.</p>
    <div class="hubtopics">Serial/parallel · OSI · analog/digital · EtherCAT</div>
  </a>
  <a class="hubcard" href="/signals/media/">
    <span class="hubtag dom-network">Physical layer</span>
    <h3>Transmission media &amp; connectors</h3>
    <p>Which cable, which fibre, which wireless band — and what's actually on the end of the plug. Ethernet categories, fibre types, Wi-Fi/Bluetooth/Zigbee, RS-485 unit loads, and pinouts you can read at a glance.</p>
    <div class="hubtopics">Cat5e–8 · OM1–OS2 · Wi-Fi/BT/Zigbee · RS-485 · HDMI/DVI/USB-C pinouts</div>
  </a>
  <a class="hubcard" href="/signals/display/">
    <span class="hubtag dom-visual">Video &amp; light</span>
    <h3>Display &amp; video signals</h3>
    <p>Version numbers, light engines, and what a virtual-production stack is actually assembled from. HDMI/DisplayPort generations, laser safety classes, how the four kinds of projector actually make colour, and where XR fits.</p>
    <div class="hubtopics">HDMI/DP versions · laser safety · projector optics · XR/VR/AR</div>
  </a>
</div>

<div class="cta"><strong>Missing a topic, or something here needs a correction?</strong>
<p><a href="${GH}/issues/new?labels=tooling&amp;title=signals%3A+">Open an issue</a> — this material is hand-authored reference content rather than data pulled from the dataset, so corrections go straight to a pull request against the relevant page.</p></div>
`

  return shell({
    title: 'Signal & connector reference — showstack',
    description: 'Three references: data & networking fundamentals, transmission media & connectors, and display & video signals — serial vs parallel, HDMI/DisplayPort, Ethernet, fibre, RS-485, XR/VR/AR, and pinouts.',
    canonical: `${SITE}/signals/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Signal & connector reference',
      description: 'Hub linking data & networking fundamentals, transmission media & connectors, and display & video signals reference pages for live entertainment technology.',
      url: `${SITE}/signals/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
