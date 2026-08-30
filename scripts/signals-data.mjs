/**
 * /signals/data/ — data & networking fundamentals: the "how does data move"
 * half of the old /signals/ mega-page. Serial vs parallel, the OSI model,
 * analog vs digital, and why EtherCAT is fast. Hand-authored reference
 * content, like the rest of the /signals/ family — see signals.mjs for why.
 *
 * Graphics over tables where the concept is inherently spatial/process-based
 * rather than comparative: the OSI model is a stack, not a list, so it's
 * drawn as one; serial-vs-parallel and EtherCAT's "on the fly" processing
 * are both about *how bits move over time*, so both get a small CSS
 * animation instead of a paragraph asking the reader to picture it.
 */
export function signalsDataPage({ esc, shell, SITE, GH }) {
  const style = `
.tool{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin-bottom:22px}
.tool h3{margin-top:0}
.note{font-size:13.5px;color:var(--dimmer);margin-top:8px}
.note a{color:var(--accent)}
table{margin-top:6px}
table + p.note{margin-top:12px}





















@media(max-width:640px){}

/* analog vs digital waveforms */
.wavegrid{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:16px 18px;margin:14px 0}
.waverow{margin-bottom:16px}
.waverow:last-child{margin-bottom:0}
.wavelabel{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--dimmer);display:block;margin-bottom:9px}
.waveset{display:flex;gap:16px;flex-wrap:wrap}
.waveset figure{margin:0;text-align:center;max-width:110px}
.waveset svg{width:92px;height:40px;display:block;background:var(--panel);border:1px solid var(--line);border-radius:6px}
.waveset figcaption{font-size:11px;color:var(--dimmer);margin-top:6px}
.wv{fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.wv-analog{stroke:var(--accent2)}
.wv-digital{stroke:var(--accent)}
.wv-dead{stroke:var(--warn)}
.wv-deadcap{color:var(--warn)}























@media(prefers-reduced-motion:reduce){}
`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/signals/">signals</a> / data</div>
<h2>Data &amp; networking fundamentals</h2>
<p class="lede">Lookup tables for how data moves, independent of which protocol is riding on top. The layer everything on this site slots into, the rates the common serial buses actually run at, and where analogue and digital fail differently. The explanations behind these live in the explainers, linked from each table.</p>




<div class="tool">
  <h3>The layer model, as a lookup</h3>
  <p>Where each thing indexed on this site sits, and what it therefore can and cannot do. <a href="/learn/network/">The network explainer</a> has the animated version and the reasoning.</p>
  <table>
    <tr><th>Layer</th><th>Name</th><th>What lives there</th><th>On a show</th></tr>
    <tr><td>7</td><td>Application</td><td>What the data means</td><td>sACN, Art-Net, OSC, PJLink, NDI, Dante control</td></tr>
    <tr><td>6</td><td>Presentation</td><td>Encoding and encryption</td><td>Rarely separated out in practice</td></tr>
    <tr><td>5</td><td>Session</td><td>Who is talking to whom, and for how long</td><td>RTSP connection management in RAVENNA</td></tr>
    <tr><td>4</td><td>Transport</td><td>Ports, and whether delivery is guaranteed</td><td>UDP for nearly everything on a show; TCP for PJLink and Ember+</td></tr>
    <tr><td>3</td><td>Network</td><td>Addresses that route between subnets</td><td>IP, and the multicast groups sACN and PTP use</td></tr>
    <tr><td>2</td><td>Data link</td><td>Addresses on one wire, and frames</td><td>Ethernet and MAC addresses, VLANs, AVB, AES50, CobraNet</td></tr>
    <tr><td>1</td><td>Physical</td><td>Voltage, light, radio</td><td>Cat6, fibre, RS-485 &mdash; and DMX512, which sits here with nothing above it</td></tr>
  </table>
  <p class="note">Two things worth reading off this. <b>DMX512 has no layers above 1 and 2 at all</b>, which is why it cannot be routed, addressed or acknowledged &mdash; every limitation follows from that row. And a protocol at layer 7 inherits every property of the layers under it, which is why &ldquo;is it on the network?&rdquo; is a different question from &ldquo;can the switch see it?&rdquo;</p>
</div>
<div class="tool">
  <h3>Serial bus rates</h3>
  <p>Signalling rates for the buses that turn up in a rack, so a spec sheet can be read against what the cable can actually carry. Usable throughput is always lower &mdash; encoding overhead, protocol overhead, and in the case of USB a shared bus.</p>
  <table>
    <tr><th>Bus</th><th>Generation</th><th>Raw rate</th><th>Notes</th></tr>
    <tr><td rowspan="4">USB</td><td>2.0 High Speed</td><td>480 Mbit/s</td><td>Shared across everything on the controller</td></tr>
    <tr><td>3.2 Gen 1</td><td>5 Gbit/s</td><td>Was USB 3.0, then 3.1 Gen 1 &mdash; same thing renamed twice</td></tr>
    <tr><td>3.2 Gen 2</td><td>10 Gbit/s</td><td>Was 3.1 Gen 2</td></tr>
    <tr><td>4</td><td>40 Gbit/s</td><td>Requires a certified cable; falls back silently on a cheap one</td></tr>
    <tr><td rowspan="2">Thunderbolt</td><td>3 and 4</td><td>40 Gbit/s</td><td>Carries PCIe and DisplayPort together</td></tr>
    <tr><td>5</td><td>80 Gbit/s</td><td>120 Gbit/s asymmetric for displays</td></tr>
    <tr><td rowspan="3">PCIe</td><td>Gen 3, per lane</td><td>8 GT/s</td><td>About 985 MB/s of payload per lane</td></tr>
    <tr><td>Gen 4, per lane</td><td>16 GT/s</td><td>Doubles again</td></tr>
    <tr><td>Gen 5, per lane</td><td>32 GT/s</td><td>Lane count multiplies it: x4, x8, x16</td></tr>
    <tr><td rowspan="4">Ethernet</td><td>1000BASE-T</td><td>1 Gbit/s</td><td>Cat5e is enough, and still the show-network default</td></tr>
    <tr><td>2.5G / 5GBASE-T</td><td>2.5 / 5 Gbit/s</td><td>Runs on existing Cat5e and Cat6</td></tr>
    <tr><td>10GBASE-T</td><td>10 Gbit/s</td><td>Cat6a to 100 m; Cat6 only to about 55 m</td></tr>
    <tr><td>25G and above</td><td>25&ndash;400 Gbit/s</td><td>Fibre or twinax in practice</td></tr>
  </table>
  <p class="note">Bits and bytes are the trap here: a 10 Gbit/s link moves at most 1.25 GB/s before overhead, and <b>GT/s is not Gbit/s</b> &mdash; PCIe transfers carry encoding, so gen 3 at 8 GT/s yields about 7.88 Gbit/s of payload per lane. <a href="/tools/#storage">The storage calculator</a> works in bytes; the numbers above are in bits.</p>
</div>
<div class="tool">
  <h3>Analog vs digital — and what it changes per department</h3>
  <p>An analog signal represents its value directly as a continuously variable voltage, current or light level — every metre of cable, every connector and every amplifier stage adds a little noise and loss that cannot be undone. A digital signal encodes the value as discrete symbols; as long as the receiver can still tell the symbols apart, it can be regenerated bit-perfect at every hop, which is why digital chains tolerate long runs and many hops that would visibly degrade an analog one — and why, past their rated distance, digital links tend to fail hard (the "cliff effect") rather than gracefully.</p>
  <div class="wavegrid">
    <div class="waverow">
      <span class="wavelabel">Analog — degrades gradually</span>
      <div class="waveset">
        <figure><svg viewBox="0 0 90 40"><path class="wv wv-analog" d="M0,20 C7,4 13,4 20,20 C27,36 33,36 40,20 C47,4 53,4 60,20 C67,36 73,36 80,20 C83,13 87,13 90,20"/></svg><figcaption>at the source — clean</figcaption></figure>
        <figure><svg viewBox="0 0 90 40"><path class="wv wv-analog" d="M0,21 C7,3 12,7 20,19 C28,33 32,35 40,21 C48,5 52,9 60,19 C68,35 72,33 80,21 C84,12 87,15 90,19"/></svg><figcaption>long run — a little noise</figcaption></figure>
        <figure><svg viewBox="0 0 90 40"><path class="wv wv-analog wv-noisy" d="M0,24 C4,10 9,2 14,16 C19,32 24,38 29,18 C33,4 37,10 41,22 C46,34 51,30 55,14 C60,2 64,12 68,24 C73,34 77,28 81,16 C85,6 88,14 90,20"/></svg><figcaption>past rated distance — noisy, not dead</figcaption></figure>
      </div>
    </div>
    <div class="waverow">
      <span class="wavelabel">Digital — bit-perfect, then a cliff</span>
      <div class="waveset">
        <figure><svg viewBox="0 0 90 40"><path class="wv wv-digital" d="M0,28 H12 V10 H32 V28 H52 V10 H72 V28 H90"/></svg><figcaption>at the source — clean</figcaption></figure>
        <figure><svg viewBox="0 0 90 40"><path class="wv wv-digital" d="M0,28 H12 V10 H32 V28 H52 V10 H72 V28 H90"/></svg><figcaption>long run — bit-identical</figcaption></figure>
        <figure><svg viewBox="0 0 90 40"><path class="wv wv-digital wv-dead" d="M0,28 H12 V10 H24 V28 H30 V32 H36 V8 H40 V30"/></svg><figcaption class="wv-deadcap">past rated distance — the cliff</figcaption></figure>
      </div>
    </div>
  </div>
  <table>
    <tr><th>Department</th><th>Analog</th><th>Digital</th></tr>
    <tr><td>Audio</td><td>Mic/line voltage (what dBu/dBV on the <a href="/tools/#audiounits">tools page</a> measure) — needs a DI or amp over distance, picks up hum on long runs</td><td>PCM samples over AES67/Dante/MADI — bit-exact over the network, no per-hop noise buildup</td></tr>
    <tr><td>Video</td><td>Composite/component/VGA — degrades gradually (softer image, more noise), which at least warns you a run is marginal</td><td>HDMI/SDI/DisplayPort — exact reproduction up to the cable's rated distance, then fails outright rather than softening</td></tr>
    <tr><td>Lighting</td><td>0–10 V analog dimming, still common in architectural work — degrades gently with cable resistance and voltage drop</td><td>DMX512/RDM — far more channels down one cable, addressable, but (as above) no error correction at all</td></tr>
  </table>
</div>

<div class="cta"><strong>Missing a topic, or something here needs a correction?</strong>
<p><a href="${GH}/issues/new?labels=tooling&amp;title=signals%2Fdata%3A+">Open an issue</a> — this page is hand-authored reference content rather than data pulled from the dataset, so corrections go straight to a pull request against this file.</p></div>
`

  return shell({
    title: 'Data & networking fundamentals — serial vs parallel, OSI model, EtherCAT | showstack',
    description: 'Serial vs parallel data, the OSI model applied to show networks, analog vs digital signal behaviour by department, and why EtherCAT gets sub-millisecond cycle times.',
    canonical: `${SITE}/signals/data/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Data & networking fundamentals',
      description: 'Serial vs parallel data, the OSI model, analog vs digital signal behaviour per department, and why EtherCAT is fast, for live entertainment technology.',
      url: `${SITE}/signals/data/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
