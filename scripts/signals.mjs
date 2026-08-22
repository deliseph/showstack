/**
 * /signals/ — the "why don't these two things that both say Ω, or both say
 * HDMI, or both say Cat6, actually behave the same" reference page.
 *
 * Unlike tools.mjs, this page has no calculators: it exists because a crew
 * member needs to know which fibre to pull, which HDMI cable actually does
 * 4K120, or what a DMX receiver's "1/4 unit load" spec means, faster than
 * paging through six different vendor datasheets. Content is hand-authored
 * (not generated from the YAML dataset — these are industry specifications,
 * not showstack entities with their own pages), so every section names the
 * governing standard instead of a per-field source citation.
 */
export function signalsPage({ esc, shell, SITE, GH }) {
  const style = `
.tool{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin-bottom:22px}
.tool h3{margin-top:0}
.note{font-size:13.5px;color:var(--dimmer);margin-top:8px}
.note a{color:var(--accent)}
table{margin-top:6px}
table + p.note{margin-top:12px}
.pingrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:10px}
`

  const body = `
<div class="crumb"><a href="/">showstack</a> / signals</div>
<h2>Signal &amp; connector reference</h2>
<p class="lede">Why two cables both rated "8 Ω", or two ports both called "HDMI", or two runs both called "Cat6", can behave completely differently. Serial vs parallel, cable and fibre categories, RS-485's "unit load", and the pinouts underneath the plugs.</p>

<div class="tool">
  <h3>Serial vs parallel data</h3>
  <p>A parallel bus sends many bits at once, one per wire, and relies on every wire arriving in step — GPIB, SCSI, PATA/IDE, the old Centronics printer port, even VGA's separate RGB + sync lines are all parallel in spirit. It is simple at low clock rates, but as clocks climb the wires' propagation delays stop matching (skew), and crosstalk between adjacent conductors gets worse, not better, as you add more of them. A serial link sends one bit at a time down far fewer conductors — usually one differential pair per lane — which lets it run the clock enormously higher and use proper differential signalling for noise immunity. That trade is why almost everything fast today (USB, SATA, PCIe, Ethernet, DMX512/RS-485, and the TMDS lanes inside HDMI and DisplayPort) is serial: multiple fast serial lanes beat one wide slow parallel bus once you are past a few tens of MHz.</p>
</div>

<div class="tool">
  <h3>Display signal versions — HDMI</h3>
  <table>
    <tr><th>Version</th><th>Year</th><th>Max bandwidth</th><th>Headline capability</th><th>Notable additions</th></tr>
    <tr><td><b>1.4</b></td><td>2009</td><td>10.2 Gbit/s (3× TMDS)</td><td>4K@30Hz, 1080p@120Hz</td><td>3D, ARC, Micro/Mini connectors</td></tr>
    <tr><td><b>2.0</b></td><td>2013</td><td>18 Gbit/s</td><td>4K@60Hz 4:4:4</td><td>HDR (2.0a), up to 32 audio channels</td></tr>
    <tr><td><b>2.1</b></td><td>2017</td><td>48 Gbit/s (FRL, replaces TMDS)</td><td>8K@60Hz, 4K@120Hz</td><td>VRR, eARC, ALLM, Display Stream Compression</td></tr>
  </table>
  <p class="note">The cable is not automatically the generation number on the box. Full HDMI 2.1 bandwidth needs a cable certified <b>Ultra High Speed</b> — an older "high speed" cable will physically fit and often still show an image, just not at the resolution/refresh the source can produce. Per the HDMI Specification (HDMI Licensing Administrator).</p>
</div>

<div class="tool">
  <h3>Display signal versions — DisplayPort</h3>
  <table>
    <tr><th>Version</th><th>Year</th><th>Max raw bandwidth</th><th>Headline capability</th><th>Notable additions</th></tr>
    <tr><td><b>1.2</b></td><td>2010</td><td>21.6 Gbit/s (HBR2)</td><td>4K@60Hz</td><td>Multi-Stream Transport — daisy-chain several monitors off one port</td></tr>
    <tr><td><b>1.4</b></td><td>2016</td><td>32.4 Gbit/s (HBR3)</td><td>8K@60Hz with compression</td><td>Display Stream Compression 1.2, HDR10 metadata</td></tr>
    <tr><td><b>2.0 / 2.1</b></td><td>2019 / 2022</td><td>up to 80 Gbit/s (UHBR20)</td><td>up to 16K with compression</td><td>UHBR rates shared with USB4/Thunderbolt 4 over USB-C</td></tr>
  </table>
  <p class="note">Same story as HDMI: the UHBR rates need a cable certified for that data rate (DP40/DP80), not just a DisplayPort-shaped connector. Per the VESA DisplayPort Standard.</p>
</div>

<div class="tool">
  <h3>The OSI model, briefly</h3>
  <table>
    <tr><th>Layer</th><th>Handles</th><th>Show-network example</th></tr>
    <tr><td>7 Application</td><td>What the data actually means</td><td>DMX512 channel data, an OSC message, an NDI video frame</td></tr>
    <tr><td>6 Presentation</td><td>Encoding/encryption of the payload</td><td>Rarely a distinct layer in show protocols</td></tr>
    <tr><td>5 Session</td><td>Setting up and tearing down a conversation</td><td>Rarely distinct here either</td></tr>
    <tr><td>4 Transport</td><td>Delivery: ordered/reliable or not</td><td>sACN and Art-Net both ride UDP; RDMnet uses TCP for some traffic</td></tr>
    <tr><td>3 Network</td><td>Addressing and routing between networks</td><td>IP addressing, sACN's multicast group</td></tr>
    <tr><td>2 Data link</td><td>Framing and addressing on one local segment</td><td>Ethernet frames and MAC addresses; EtherCAT operates almost entirely here</td></tr>
    <tr><td>1 Physical</td><td>The actual bits on the wire</td><td>Cat6 copper, RS-485 differential signalling, OM3 fibre</td></tr>
  </table>
  <p class="note">Most of the protocols indexed on this site live at layer 7, riding on layer 3/4 (IP/UDP) or, for DMX512, straight on layer 1/2 (RS-485). Per ISO/IEC 7498-1.</p>
</div>

<div class="tool">
  <h3>Why EtherCAT is fast</h3>
  <p>EtherCAT does not use faster wiring — it still runs over ordinary 100BASE-TX Ethernet cable. The speed comes from how each device handles the frame. Standard Ethernet/IP devices are store-and-forward: receive a whole frame, process it, generate a fresh reply frame. EtherCAT devices instead read and write their own slice of data <b>as the frame passes through them</b>, in dedicated hardware, without ever fully buffering it — "processing on the fly." One frame does a complete loop through every device on the segment and returns with every device's data updated in a single pass, instead of the controller polling each device one at a time. That is what gets automation systems into sub-millisecond, deterministic cycle times. In entertainment it shows up in automated rigging, winch and moving-scenery control, where motion needs to be tightly synchronised across many axes.</p>
</div>

<div class="tool">
  <h3>Analog vs digital — and what it changes per department</h3>
  <p>An analog signal represents its value directly as a continuously variable voltage, current or light level — every metre of cable, every connector and every amplifier stage adds a little noise and loss that cannot be undone. A digital signal encodes the value as discrete symbols; as long as the receiver can still tell the symbols apart, it can be regenerated bit-perfect at every hop, which is why digital chains tolerate long runs and many hops that would visibly degrade an analog one — and why, past their rated distance, digital links tend to fail hard (the "cliff effect") rather than gracefully.</p>
  <table>
    <tr><th>Department</th><th>Analog</th><th>Digital</th></tr>
    <tr><td>Audio</td><td>Mic/line voltage (what dBu/dBV above measure) — needs a DI or amp over distance, picks up hum on long runs</td><td>PCM samples over AES67/Dante/MADI — bit-exact over the network, no per-hop noise buildup</td></tr>
    <tr><td>Video</td><td>Composite/component/VGA — degrades gradually (softer image, more noise), which at least warns you a run is marginal</td><td>HDMI/SDI/DisplayPort — exact reproduction up to the cable's rated distance, then fails outright rather than softening</td></tr>
    <tr><td>Lighting</td><td>0–10 V analog dimming, still common in architectural work — degrades gently with cable resistance and voltage drop</td><td>DMX512/RDM — far more channels down one cable, addressable, but (as above) no error correction at all</td></tr>
  </table>
</div>

<div class="tool">
  <h3>Laser safety classes, and how projector light engines work</h3>
  <p>Laser output is classified by IEC 60825-1: Class 1 is safe under any viewing condition; Class 2 is visible light where the blink reflex is assumed to protect the eye (under 1 mW); Class 3R and 3B are hazardous to look into directly; Class 4 is hazardous to eyes and skin and a fire risk, and is what most entertainment show lasers actually are — which is why show-laser operation typically requires a laser safety officer, a controlled beam path, and (in many jurisdictions) separate authorisation for audience scanning. Laser <em>projectors</em> — the video kind — are classified separately by IEC/EN 62471 into Risk Groups (RG1/RG2/RG3) measured at the output aperture, because a projector's internal laser diodes can be far higher powered than the beam that actually reaches an eye at normal viewing distance.</p>
  <p>Inside the projector, two separate design choices get conflated under "laser projector":</p>
  <table>
    <tr><th></th><th>How colour is made</th><th>Trade-off</th></tr>
    <tr><td><b>Single-chip DLP</b></td><td>One DMD (digital micromirror device) chip; colour is sequential, via a spinning colour wheel or sequential-colour illumination</td><td>Cheaper, more compact; some viewers see a "rainbow effect" artifact</td></tr>
    <tr><td><b>3-chip DLP</b></td><td>A dichroic/TIR prism splits light into red/green/blue paths, each hitting its own DMD chip simultaneously, then recombines it</td><td>No colour wheel, no rainbow artifact, much higher brightness ceiling — the standard for large-venue and rental-and-staging projection</td></tr>
    <tr><td><b>Laser phosphor</b></td><td>A blue laser excites a spinning phosphor wheel to generate broad-spectrum light, then filters/splits it into RGB</td><td>Bright and long-lived without a lamp, cheaper than full RGB laser</td></tr>
    <tr><td><b>Direct RGB laser</b></td><td>Separate red/green/blue laser banks, no phosphor conversion step</td><td>Widest colour gamut, no wheel of any kind — premium high-end projection</td></tr>
  </table>
  <p class="note">"Laser" and "3-chip" describe two different things — a projector's light source and how it splits colour — and can combine either way (laser-phosphor 3-chip DLP is common in large venue rental gear).</p>
</div>

<div class="tool">
  <h3>XR / VR / AR — what integrating them into a show actually needs</h3>
  <p>VR is fully synthetic (the audience or performer sees only rendered content); AR overlays rendered content on the real world; MR (mixed reality) blends the two with real-world tracking and occlusion so virtual and physical objects can interact convincingly — XR is the umbrella term for all three. There is no single dedicated "XR entertainment protocol" the way DMX512 exists for lighting; live integration (often called virtual production when it drives an LED volume or a broadcast camera) is an assembly of protocols already on this site:</p>
  <table>
    <tr><th>Need</th><th>Typically provided by</th></tr>
    <tr><td>A shared clock across real and virtual systems</td><td>Timecode — <a href="/protocols/ltc/">LTC</a> / <a href="/protocols/mtc/">MTC</a></td></tr>
    <tr><td>Triggering and parameter control of the real-time engine</td><td><a href="/protocols/osc/">OSC</a>, sometimes MIDI</td></tr>
    <tr><td>Camera or performer position tracking driving the render</td><td>Dedicated tracking protocols (e.g. FreeD for camera tracking) feeding Unreal/Unity</td></tr>
    <tr><td>Moving video between the render engine and the rest of the show</td><td>NDI, SDI</td></tr>
    <tr><td>Keeping physical lighting in sync with the virtual environment</td><td><a href="/protocols/sacn/">sACN</a> / <a href="/protocols/art-net/">Art-Net</a></td></tr>
  </table>
  <p class="note">That gap — no unifying standard, just a stack of adjacent ones held together by timecode and a render engine's own plugin ecosystem — is itself worth knowing before scoping an XR-integrated show: budget for integration work, not just hardware.</p>
</div>

<div class="tool">
  <h3>Structured cabling — Ethernet Cat5e to Cat8</h3>
  <table>
    <tr><th>Category</th><th>Max frequency</th><th>Max standard @ 100 m</th><th>Show-network notes</th></tr>
    <tr><td><b>Cat5e</b></td><td>100 MHz</td><td>1000BASE-T (1 Gbit/s)</td><td>Legacy DMX/sACN-over-Ethernet still works; skip it for anything you are pulling new</td></tr>
    <tr><td><b>Cat6</b></td><td>250 MHz</td><td>1G full distance; 10GBASE-T to ≈37–55 m</td><td>Common general-purpose AV/lighting backbone</td></tr>
    <tr><td><b>Cat6a</b></td><td>500 MHz</td><td>10GBASE-T full 100 m</td><td>Full-distance Dante/NDI/converged AV — see the <a href="/network/">network planner</a></td></tr>
    <tr><td><b>Cat7</b></td><td>600 MHz</td><td>10GBASE-T 100 m</td><td>Individually shielded pairs, but its native connector (GG45/TERA) is not RJ45 — rare on tour</td></tr>
    <tr><td><b>Cat8</b></td><td>2000 MHz</td><td>25/40GBASE-T to 30 m</td><td>Short data-centre-style runs — video-over-IP core switching, not front-of-house distance</td></tr>
  </table>
  <p class="note">On a show network the failure that actually bites is almost always termination quality — a re-crimped end, a kinked pair, a run laid across a dimmer feed — not the category printed on the jacket. Per EIA/TIA-568.</p>
</div>

<div class="tool">
  <h3>Wireless control — Wi-Fi, Bluetooth, Zigbee</h3>
  <table>
    <tr><th>Generation</th><th>IEEE</th><th>Year</th><th>Max PHY rate</th><th>Band</th></tr>
    <tr><td>Wi-Fi 4</td><td>802.11n</td><td>2009</td><td>≈600 Mbit/s</td><td>2.4 / 5 GHz</td></tr>
    <tr><td>Wi-Fi 5</td><td>802.11ac</td><td>2013</td><td>≈3.5 Gbit/s</td><td>5 GHz</td></tr>
    <tr><td>Wi-Fi 6 / 6E</td><td>802.11ax</td><td>2019 / 2020</td><td>≈9.6 Gbit/s</td><td>2.4 / 5 / 6 GHz</td></tr>
    <tr><td>Wi-Fi 7</td><td>802.11be</td><td>2024</td><td>≈46 Gbit/s</td><td>2.4 / 5 / 6 GHz, multi-link</td></tr>
  </table>
  <p class="note">6E/7's 6 GHz band matters most in venues: it is far less congested than 2.4/5 GHz, so a show-network Wi-Fi doesn't have to compete with a room full of phones — but it does not remove the need to keep control-network Wi-Fi off the same spectrum as anything RF-sensitive nearby. Per IEEE 802.11.</p>
  <p><b>Bluetooth</b> is a short-range 2.4 GHz link that frequency-hops across 79 channels roughly 1,600 times a second to dodge interference. Classic Bluetooth carries streamed audio (some in-ear/monitor products); Bluetooth Low Energy (BLE) trades bandwidth for very low power, and is what most modern consoles and remote apps use to pair a tablet to a desk. <b>Zigbee</b> (built on the IEEE 802.15.4 physical layer, also 2.4 GHz) is a low-power <em>mesh</em> network — many battery nodes relay through each other rather than each talking directly to a hub — common in architectural/permanent-install lighting and building sensor networks, less common in touring rigs where wireless DMX still does the job of controlling fixtures.</p>
  <p class="note">Wireless DMX/RDM systems share the 2.4 GHz ISM band with Wi-Fi/Bluetooth/Zigbee but are not built on any of these standards — they are purpose-built proprietary RF layers carrying DMX512 data, which is why coordinating channel/frequency use across all of them at a venue is a real RF-planning task, not just "everything is 2.4 GHz so it's fine."</p>
</div>

<div class="tool">
  <h3>Fibre — multimode OM1–OM5, singlemode OS1/OS2</h3>
  <table>
    <tr><th>Type</th><th>Core / cladding</th><th>Jacket (convention)</th><th>~10G reach</th><th>Notes</th></tr>
    <tr><td><b>OM1</b></td><td>62.5/125 µm multimode</td><td>orange</td><td>≈33 m</td><td>Legacy, LED source</td></tr>
    <tr><td><b>OM2</b></td><td>50/125 µm multimode</td><td>orange</td><td>≈82 m</td><td>Legacy</td></tr>
    <tr><td><b>OM3</b></td><td>50/125 µm laser-optimised multimode</td><td>aqua</td><td>≈300 m</td><td>Common video-over-fibre, 850 nm VCSEL source</td></tr>
    <tr><td><b>OM4</b></td><td>50/125 µm laser-optimised multimode</td><td>aqua / violet</td><td>≈400 m</td><td>Higher-bandwidth backbone runs</td></tr>
    <tr><td><b>OM5</b></td><td>50/125 µm wideband multimode</td><td>lime green</td><td>≈400 m</td><td>Carries several wavelengths at once (SWDM) over fewer fibres</td></tr>
    <tr><td><b>OS1</b></td><td>9/125 µm singlemode</td><td>yellow</td><td>≈10 km</td><td>Indoor, tight-buffered</td></tr>
    <tr><td><b>OS2</b></td><td>9/125 µm singlemode</td><td>yellow</td><td>tens of km</td><td>Outdoor, loose-tube — site-to-site, OB truck runs</td></tr>
  </table>
  <p class="note">Jacket colour is an industry convention (TIA-598), not physics — an unlabelled coil should be confirmed with the printed cable spec or a light source and power meter before it goes into a rig. Per ITU-T G.651.1/G.652 and TIA-492.</p>
</div>

<div class="tool">
  <h3>RS-485, DMX512, and what a "unit load" is</h3>
  <p><a href="/protocols/dmx512/">DMX512</a>'s electrical layer is EIA/TIA-485 (RS-485): a differential, half-duplex, multi-drop bus — one driver, many listeners on a single twisted pair, daisy-chained and terminated with a 120 Ω resistor at the far end. What limits how many fixtures can share one line is not a fixture count but <b>unit loads</b> (also called device load): RS-485 defines a unit load as the current a standard reference receiver draws, roughly a 12 kΩ input impedance, and caps a single segment at 32 unit loads. A fixture's DMX input does not have to present a full unit load — many modern receiver chips are designed as a fraction of one (1/4 UL, 1/8 UL is common), which is how a line can carry well over 32 physical fixtures before it needs an opto-splitter. Check the fixture's manual for its unit-load figure rather than just counting boxes.</p>
  <p class="note">Termination and topology gotchas — star topology is not part of the standard, and there is no error checking on the data itself — are covered on the <a href="/protocols/dmx512/">DMX512 entry</a>. Per ANSI E1.11 (USITT DMX512-A) and EIA/TIA-485.</p>
</div>

<div class="tool wide">
  <h3>Connector pinouts</h3>
  <div class="pingrid">
    <div>
      <h4 style="font-family:var(--mono);font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:var(--dimmer);margin:0 0 8px">HDMI Type-A (19-pin)</h4>
      <table>
        <tr><th>Pins</th><th>Signal</th></tr>
        <tr><td>1–9</td><td>TMDS Data2±, Data1±, Data0± (3 shielded differential pairs)</td></tr>
        <tr><td>10–12</td><td>TMDS Clock±</td></tr>
        <tr><td>13</td><td>CEC</td></tr>
        <tr><td>14</td><td>Reserved / HEC utility</td></tr>
        <tr><td>15–16</td><td>DDC clock (SCL) / data (SDA) — EDID and CEC negotiation</td></tr>
        <tr><td>17</td><td>DDC/CEC ground</td></tr>
        <tr><td>18</td><td>+5 V power</td></tr>
        <tr><td>19</td><td>Hot Plug Detect</td></tr>
      </table>
    </div>
    <div>
      <h4 style="font-family:var(--mono);font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:var(--dimmer);margin:0 0 8px">DVI-D dual-link (24-pin)</h4>
      <table>
        <tr><th>Pins</th><th>Signal</th></tr>
        <tr><td>1–3, 9–11, 17–19</td><td>TMDS Data pairs 2, 1, 0 (+ shields) — the single-link set</td></tr>
        <tr><td>4–5, 12–13, 20–21</td><td>TMDS Data pairs 4, 3, 5 — dual-link only, doubles bandwidth</td></tr>
        <tr><td>6–7</td><td>DDC clock / data</td></tr>
        <tr><td>14–15</td><td>+5 V power / ground</td></tr>
        <tr><td>16</td><td>Hot Plug Detect</td></tr>
        <tr><td>22–24</td><td>TMDS Clock shield / Clock±</td></tr>
      </table>
      <p class="note">DVI-I adds 4 analogue pins plus a ground blade around the connector for VGA compatibility; DVI-D omits them entirely. Per the DDWG DVI 1.0 specification.</p>
    </div>
    <div>
      <h4 style="font-family:var(--mono);font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:var(--dimmer);margin:0 0 8px">USB-C / Thunderbolt</h4>
      <p style="font-size:14px;color:var(--dim);margin:0">There is no separate "Thunderbolt connector" — Thunderbolt 3 and 4 run over the standard 24-pin USB-C connector (the pinout is USB-C's own: high-speed differential lanes, a USB 2.0 D+/D− pair, the CC configuration-channel pins that negotiate orientation and power role, SBU sideband pins, and VBUS power — mirrored front-to-back so the plug works either way up). Thunderbolt 1 and 2, older, instead used the 20-pin Mini DisplayPort connector. Per the USB-IF USB Type-C Cable and Connector Specification and the Thunderbolt Technology spec.</p>
    </div>
  </div>
</div>

<div class="cta"><strong>Missing a topic, or something here needs a correction?</strong>
<p><a href="${GH}/issues/new?labels=tooling&amp;title=signals%3A+">Open an issue</a> — this page is hand-authored reference content rather than data pulled from the dataset, so corrections go straight to a pull request against this file.</p></div>
`

  return shell({
    title: 'Signal & connector reference — HDMI, DisplayPort, Ethernet, fibre, RS-485, pinouts | showstack',
    description: 'Serial vs parallel data, HDMI and DisplayPort version differences, Ethernet Cat5e–Cat8, fibre OM1–OM5 and OS1/OS2, RS-485 and DMX512 unit loads, and HDMI/DVI/USB-C pinouts, in one reference page.',
    canonical: `${SITE}/signals/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Signal & connector reference',
      description: 'Serial vs parallel data, display-protocol versions, structured cabling categories, fibre types, RS-485/DMX unit loads, and connector pinouts for live entertainment technology.',
      url: `${SITE}/signals/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
