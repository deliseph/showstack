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

/* serial vs parallel flow */
.flowviz{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:16px 18px;margin:14px 0}
.flowlane{margin-bottom:16px}
.flowlane:last-child{margin-bottom:0}
.flowlabel{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--dimmer);display:block;margin-bottom:9px}
.wires{display:flex;flex-direction:column;gap:7px}
.wire{position:relative;height:6px;background:var(--line);border-radius:3px;overflow:hidden}
.wire.wide{height:11px}
.bit{position:absolute;top:50%;left:-8px;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:var(--accent);animation:flowmove 1.8s linear infinite}
.wire.skew .bit{background:var(--warn);animation-duration:2.15s}
.wire.wide .bit{width:7px;height:7px;margin-top:-3.5px;background:var(--accent2);animation:flowmove .6s linear infinite}
@keyframes flowmove{from{left:-8px}to{left:100%}}
.flowcaption{font-size:12px;color:var(--dimmer);margin-top:2px}
.flowcaption b{color:var(--warn)}

/* OSI stack */
.osistack{border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden;margin:14px 0}
.osilayer{display:grid;grid-template-columns:40px 1.1fr 1.3fr;gap:14px;align-items:center;padding:11px 16px;
  border-bottom:1px solid var(--line);background:var(--panel)}
.osilayer:last-child{border-bottom:none}
.osilayer:nth-child(odd){background:var(--panel2)}
.osilayer.dim{opacity:.6}
.osinum{font-family:var(--mono);font-size:19px;font-weight:700;color:var(--accent);text-align:center}
.osiname{font-weight:600;font-size:14.5px}
.osiname small{display:block;font-weight:400;color:var(--dim);font-size:12.5px;margin-top:2px}
.osiex{font-family:var(--mono);font-size:12px;color:var(--dimmer)}
@media(max-width:640px){.osilayer{grid-template-columns:30px 1fr}.osiex{grid-column:1 / -1;margin-top:4px}}

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

/* EtherCAT frame flow */
.ecatviz{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:16px 18px;margin:14px 0}
.ecatrow{margin-bottom:20px}
.ecatrow:last-child{margin-bottom:0}
.ecatlabel{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--dimmer);display:block;margin-bottom:12px}
.ecattrack{position:relative;display:flex;justify-content:space-between;align-items:center;height:26px;padding:0 11px}
.ecattrack::before{content:"";position:absolute;left:11px;right:11px;top:50%;height:2px;background:var(--line);transform:translateY(-50%)}
.ecatdev{position:relative;z-index:1;width:22px;height:22px;border-radius:5px;background:var(--panel);border:2px solid var(--line)}
.ecatframe{position:absolute;top:50%;left:11px;width:14px;height:14px;margin-top:-7px;border-radius:3px;background:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 25%,transparent);z-index:2}
.ecat-stepped .ecatframe{animation:ecatstep 4s steps(1,end) infinite}
.ecat-flow .ecatframe{animation:ecatflow 2s linear infinite}
@keyframes ecatflow{from{left:11px}to{left:calc(100% - 25px)}}
@keyframes ecatstep{0%,12%{left:11px}25%,37%{left:calc(33% - 6px)}50%,62%{left:calc(66% - 6px)}75%,100%{left:calc(100% - 25px)}}
.ecat-flow .ecatdev:nth-child(1){animation:ecatpulse 2s ease-in-out infinite 0s}
.ecat-flow .ecatdev:nth-child(2){animation:ecatpulse 2s ease-in-out infinite .5s}
.ecat-flow .ecatdev:nth-child(3){animation:ecatpulse 2s ease-in-out infinite 1s}
.ecat-flow .ecatdev:nth-child(4){animation:ecatpulse 2s ease-in-out infinite 1.5s}
.ecat-stepped .ecatdev:nth-child(1){animation:ecatpulselong 4s steps(1,end) infinite 0s}
.ecat-stepped .ecatdev:nth-child(2){animation:ecatpulselong 4s steps(1,end) infinite 1s}
.ecat-stepped .ecatdev:nth-child(3){animation:ecatpulselong 4s steps(1,end) infinite 2s}
.ecat-stepped .ecatdev:nth-child(4){animation:ecatpulselong 4s steps(1,end) infinite 3s}
@keyframes ecatpulse{0%,80%,100%{border-color:var(--line);background:var(--panel)}15%,45%{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 22%,var(--panel))}}
@keyframes ecatpulselong{0%,24%,100%{border-color:var(--line);background:var(--panel)}2%,22%{border-color:var(--accent2);background:color-mix(in srgb,var(--accent2) 22%,var(--panel))}}
@media(prefers-reduced-motion:reduce){.bit,.oicon,.ecatframe,.ecatdev{animation:none!important}.bit{left:40%}}
`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/signals/">signals</a> / data</div>
<h2>Data &amp; networking fundamentals</h2>
<p class="lede">How data actually moves, independent of which protocol is riding on top of it: wires-in-parallel vs one fast lane, the layer model everything else on this site slots into, why "digital" fails differently than "analog," and what EtherCAT does differently from plain Ethernet to get sub-millisecond cycle times.</p>

<div class="tool">
  <h3>Serial vs parallel data</h3>
  <p>A parallel bus sends many bits at once, one per wire, and relies on every wire arriving in step — GPIB, SCSI, PATA/IDE, the old Centronics printer port, even VGA's separate RGB + sync lines are all parallel in spirit. It is simple at low clock rates, but as clocks climb the wires' propagation delays stop matching (<b>skew</b>), and crosstalk between adjacent conductors gets worse, not better, as you add more of them. A serial link sends one bit at a time down far fewer conductors — usually one differential pair per lane — which lets it run the clock enormously higher and use proper differential signalling for noise immunity.</p>
  <div class="flowviz">
    <div class="flowlane">
      <span class="flowlabel">Parallel — 4 wires, one bit each, in step</span>
      <div class="wires">
        <div class="wire"><i class="bit"></i></div>
        <div class="wire"><i class="bit"></i></div>
        <div class="wire skew"><i class="bit"></i></div>
        <div class="wire"><i class="bit"></i></div>
      </div>
      <p class="flowcaption">All four should land together. The <b>orange</b> wire is running the same distance slower — that gap between wires is skew, and it only gets worse as you push the clock higher or add more wires.</p>
    </div>
    <div class="flowlane">
      <span class="flowlabel">Serial — 1 differential pair, bits back-to-back</span>
      <div class="wires">
        <div class="wire wide"><i class="bit"></i><i class="bit" style="animation-delay:.15s"></i><i class="bit" style="animation-delay:.3s"></i><i class="bit" style="animation-delay:.45s"></i></div>
      </div>
      <p class="flowcaption">No wire-to-wire alignment to keep — there's only one lane, so nothing can drift relative to anything else. That's the trade: fewer conductors, much higher clock, no skew budget to manage.</p>
    </div>
  </div>
  <p class="note">That trade is why almost everything fast today — USB, SATA, PCIe, Ethernet, DMX512/RS-485, and the TMDS lanes inside HDMI and DisplayPort — is serial: multiple fast serial lanes beat one wide slow parallel bus once you are past a few tens of MHz.</p>
</div>

<div class="tool">
  <h3>The OSI model, briefly</h3>
  <p>Seven layers, physical wire at the bottom, meaning at the top. Most protocols indexed on this site live at layer 7, riding on layer 3/4 (IP/UDP) or, for DMX512, straight on layer 1/2 (RS-485).</p>
  <div class="osistack">
    <div class="osilayer"><span class="osinum">7</span><span class="osiname">Application<small>What the data actually means</small></span><span class="osiex">DMX512 channel data, an OSC message, an NDI video frame</span></div>
    <div class="osilayer dim"><span class="osinum">6</span><span class="osiname">Presentation<small>Encoding/encryption of the payload</small></span><span class="osiex">Rarely a distinct layer in show protocols</span></div>
    <div class="osilayer dim"><span class="osinum">5</span><span class="osiname">Session<small>Setting up and tearing down a conversation</small></span><span class="osiex">Rarely distinct here either</span></div>
    <div class="osilayer"><span class="osinum">4</span><span class="osiname">Transport<small>Delivery: ordered/reliable or not</small></span><span class="osiex">sACN and Art-Net both ride UDP; RDMnet uses TCP for some traffic</span></div>
    <div class="osilayer"><span class="osinum">3</span><span class="osiname">Network<small>Addressing and routing between networks</small></span><span class="osiex">IP addressing, sACN's multicast group</span></div>
    <div class="osilayer"><span class="osinum">2</span><span class="osiname">Data link<small>Framing and addressing on one local segment</small></span><span class="osiex">Ethernet frames and MAC addresses; EtherCAT operates almost entirely here</span></div>
    <div class="osilayer"><span class="osinum">1</span><span class="osiname">Physical<small>The actual bits on the wire</small></span><span class="osiex">Cat6 copper, RS-485 differential signalling, OM3 fibre</span></div>
  </div>
  <p class="note">Per ISO/IEC 7498-1. Layers 5 and 6 are dimmed above because almost nothing on a show network implements them as a separate step — most show protocols go straight from application data to a transport/network layer that already handles session and encoding concerns, or skips them entirely.</p>
</div>

<div class="tool">
  <h3>Why EtherCAT is fast</h3>
  <p>EtherCAT does not use faster wiring — it still runs over ordinary 100BASE-TX Ethernet cable. The speed comes from how each device handles the frame. Standard Ethernet/IP devices are store-and-forward: receive a whole frame, process it, generate a fresh reply frame. EtherCAT devices instead read and write their own slice of data <b>as the frame passes through them</b>, in dedicated hardware, without ever fully buffering it — "processing on the fly."</p>
  <div class="ecatviz">
    <div class="ecatrow">
      <span class="ecatlabel">Standard Ethernet/IP — store &amp; forward, one device polled at a time</span>
      <div class="ecattrack ecat-stepped">
        <div class="ecatdev"></div><div class="ecatdev"></div><div class="ecatdev"></div><div class="ecatdev"></div>
        <div class="ecatframe"></div>
      </div>
    </div>
    <div class="ecatrow">
      <span class="ecatlabel">EtherCAT — processed on the fly, one pass updates every device</span>
      <div class="ecattrack ecat-flow">
        <div class="ecatdev"></div><div class="ecatdev"></div><div class="ecatdev"></div><div class="ecatdev"></div>
        <div class="ecatframe"></div>
      </div>
    </div>
  </div>
  <p class="note">One frame does a complete loop through every device on the segment and returns with every device's data updated in a single pass, instead of the controller polling each device one at a time. That is what gets automation systems into sub-millisecond, deterministic cycle times. In entertainment it shows up in automated rigging, winch and moving-scenery control, where motion needs to be tightly synchronised across many axes.</p>
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
