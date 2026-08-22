/**
 * /signals/media/ — transmission media & connectors: the "which cable, which
 * fibre, which radio, what's on the end of the plug" half of the old
 * /signals/ mega-page. Hand-authored reference content, like the rest of the
 * /signals/ family — see signals.mjs for why.
 *
 * Topology (daisy-chain vs star, star vs mesh) gets a diagram because it's a
 * spatial/wiring concept a table genuinely cannot show. Connector pinouts
 * get an actual pin-face graphic — laid out to match the physical pin
 * arrangement — instead of only a table, because "which pin is which" is a
 * look-at-the-plug question, not a read-a-row question.
 */
export function signalsMediaPage({ esc, shell, SITE, GH }) {
  const style = `
.tool{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin-bottom:22px}
.tool h3{margin-top:0}
.note{font-size:13.5px;color:var(--dimmer);margin-top:8px}
.note a{color:var(--accent)}
table{margin-top:6px}
table + p.note{margin-top:12px}
.swatch{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:6px;vertical-align:middle;border:1px solid var(--line)}

/* topology: node graphs (wireless) */
.topogrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:14px 0}
.topocard{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:14px 16px}
.topocard h4{margin:0;font-family:var(--mono);font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:var(--dim)}
.topocard p{margin:8px 0 0;font-size:12.5px;color:var(--dimmer)}
.topo{width:100%;height:auto;max-width:180px;display:block;margin:10px auto 0}
.topo line{stroke:var(--line);stroke-width:2}
.topo line.topo-cross{stroke-dasharray:3 3;opacity:.7}
.topo-node{fill:var(--panel);stroke:var(--accent);stroke-width:2}
.topo-hub{fill:var(--accent);stroke:var(--accent)}

/* topology: daisy-chain vs star (DMX) */
.topodiagram{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:14px 0}
@media(max-width:640px){.topodiagram{grid-template-columns:1fr}}
.topo-good,.topo-bad{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:14px 16px}
.topo-tag{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.5px;display:inline-block;padding:2px 9px;border-radius:999px;margin-bottom:12px}
.topo-tag.ok{color:var(--ok);border:1px solid color-mix(in srgb,var(--ok) 45%,transparent)}
.topo-tag.bad{color:var(--warn);border:1px solid color-mix(in srgb,var(--warn) 45%,transparent)}
.topo-chain{display:flex;align-items:center;gap:0}
.topo-box{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:8px 4px;font-size:10.5px;text-align:center;flex:1;position:relative;font-family:var(--mono)}
.topo-chain .topo-box:not(:last-child)::after{content:"";position:absolute;top:50%;right:-11px;width:11px;height:2px;background:var(--line)}
.topo-box.term{background:var(--panel2);border-style:dashed;color:var(--dimmer)}
.topo-star{display:flex;align-items:center;gap:18px}
.topo-star .topo-box:first-child{flex:0 0 64px}
.topo-spokes{display:flex;flex-direction:column;gap:8px;flex:1;position:relative}
.topo-spokes::before{content:"";position:absolute;left:-18px;top:0;bottom:0;width:16px;border-left:2px solid var(--warn);opacity:.55}
.topo-good p,.topo-bad p{font-size:12.5px;color:var(--dim);margin:12px 0 0}

/* connector pin faces */
.pinface{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:16px;margin-top:10px}
.pinface h4{margin:0 0 12px;font-family:var(--mono);font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:var(--dim)}
.pinscroll{overflow-x:auto;padding-bottom:2px}
.pinrow{display:flex;gap:4px;justify-content:center;margin-bottom:4px;width:max-content;margin-left:auto;margin-right:auto}
.pin{width:23px;height:23px;border-radius:4px;background:var(--panel);border:1px solid var(--line);
  display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:8.5px;color:var(--dim);flex:0 0 auto}
.pin[data-g="tmds"]{background:color-mix(in srgb,var(--dom-network) 28%,var(--panel));border-color:var(--dom-network);color:var(--ink)}
.pin[data-g="tmds2"]{background:color-mix(in srgb,var(--dom-audio) 28%,var(--panel));border-color:var(--dom-audio);color:var(--ink)}
.pin[data-g="clk"]{background:color-mix(in srgb,var(--dom-visual) 28%,var(--panel));border-color:var(--dom-visual);color:var(--ink)}
.pin[data-g="ddc"]{background:color-mix(in srgb,var(--dom-control) 28%,var(--panel));border-color:var(--dom-control);color:var(--ink)}
.pin[data-g="pwr"]{background:color-mix(in srgb,var(--warn) 28%,var(--panel));border-color:var(--warn);color:var(--ink)}
.pin[data-g="misc"]{background:var(--panel2)}
.pinlegend{display:flex;flex-wrap:wrap;gap:9px 16px;margin-top:14px;font-size:11.5px;color:var(--dim)}
.pinlegend span{display:inline-flex;align-items:center;gap:6px}
.pinlegend i{width:12px;height:12px;border-radius:3px;display:inline-block;border:1px solid var(--line)}
.pinlegend i.tmds{background:color-mix(in srgb,var(--dom-network) 28%,var(--panel2));border-color:var(--dom-network)}
.pinlegend i.tmds2{background:color-mix(in srgb,var(--dom-audio) 28%,var(--panel2));border-color:var(--dom-audio)}
.pinlegend i.clk{background:color-mix(in srgb,var(--dom-visual) 28%,var(--panel2));border-color:var(--dom-visual)}
.pinlegend i.ddc{background:color-mix(in srgb,var(--dom-control) 28%,var(--panel2));border-color:var(--dom-control)}
.pinlegend i.pwr{background:color-mix(in srgb,var(--warn) 28%,var(--panel2));border-color:var(--warn)}
.pinlegend i.misc{background:var(--panel)}
.pingrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:10px}
`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/signals/">signals</a> / media</div>
<h2>Transmission media &amp; connectors</h2>
<p class="lede">Which cable, which fibre, which wireless band — and what's actually wired to which pin once you get to the connector. Structured cabling, fibre types, wireless control, RS-485's "unit load," and pinouts for the plugs you carry every day.</p>

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
  <h3>Fibre — multimode OM1–OM5, singlemode OS1/OS2</h3>
  <table>
    <tr><th>Type</th><th>Core / cladding</th><th>Jacket</th><th>~10G reach</th><th>Notes</th></tr>
    <tr><td><b>OM1</b></td><td>62.5/125 µm multimode</td><td><span class="swatch" style="background:#e8772c"></span>orange</td><td>≈33 m</td><td>Legacy, LED source</td></tr>
    <tr><td><b>OM2</b></td><td>50/125 µm multimode</td><td><span class="swatch" style="background:#e8772c"></span>orange</td><td>≈82 m</td><td>Legacy</td></tr>
    <tr><td><b>OM3</b></td><td>50/125 µm laser-optimised multimode</td><td><span class="swatch" style="background:#3ec9c0"></span>aqua</td><td>≈300 m</td><td>Common video-over-fibre, 850 nm VCSEL source</td></tr>
    <tr><td><b>OM4</b></td><td>50/125 µm laser-optimised multimode</td><td><span class="swatch" style="background:#8a6de0"></span>aqua / violet</td><td>≈400 m</td><td>Higher-bandwidth backbone runs</td></tr>
    <tr><td><b>OM5</b></td><td>50/125 µm wideband multimode</td><td><span class="swatch" style="background:#7ac74f"></span>lime green</td><td>≈400 m</td><td>Carries several wavelengths at once (SWDM) over fewer fibres</td></tr>
    <tr><td><b>OS1</b></td><td>9/125 µm singlemode</td><td><span class="swatch" style="background:#e8d02c"></span>yellow</td><td>≈10 km</td><td>Indoor, tight-buffered</td></tr>
    <tr><td><b>OS2</b></td><td>9/125 µm singlemode</td><td><span class="swatch" style="background:#e8d02c"></span>yellow</td><td>tens of km</td><td>Outdoor, loose-tube — site-to-site, OB truck runs</td></tr>
  </table>
  <p class="note">Jacket colour is an industry convention (TIA-598), not physics — an unlabelled coil should be confirmed with the printed cable spec or a light source and power meter before it goes into a rig. Per ITU-T G.651.1/G.652 and TIA-492.</p>
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
  <p><b>Bluetooth</b> is a short-range 2.4 GHz link that frequency-hops across 79 channels roughly 1,600 times a second to dodge interference. Classic Bluetooth carries streamed audio (some in-ear/monitor products); Bluetooth Low Energy (BLE) trades bandwidth for very low power, and is what most modern consoles and remote apps use to pair a tablet to a desk. <b>Zigbee</b> (built on the IEEE 802.15.4 physical layer, also 2.4 GHz) is a low-power mesh network — many battery nodes relay through each other rather than each talking directly to a hub — common in architectural/permanent-install lighting and building sensor networks.</p>
  <div class="topogrid">
    <div class="topocard">
      <h4>Wi-Fi / Bluetooth — star</h4>
      <svg class="topo" viewBox="0 0 200 140">
        <line x1="100" y1="70" x2="100" y2="15"/><line x1="100" y1="70" x2="147.6" y2="42.5"/>
        <line x1="100" y1="70" x2="147.6" y2="97.5"/><line x1="100" y1="70" x2="100" y2="125"/>
        <line x1="100" y1="70" x2="52.4" y2="97.5"/><line x1="100" y1="70" x2="52.4" y2="42.5"/>
        <circle class="topo-hub" cx="100" cy="70" r="9"/>
        <circle class="topo-node" cx="100" cy="15" r="6"/><circle class="topo-node" cx="147.6" cy="42.5" r="6"/>
        <circle class="topo-node" cx="147.6" cy="97.5" r="6"/><circle class="topo-node" cx="100" cy="125" r="6"/>
        <circle class="topo-node" cx="52.4" cy="97.5" r="6"/><circle class="topo-node" cx="52.4" cy="42.5" r="6"/>
      </svg>
      <p>Every device talks only to the access point / hub (filled centre dot). Simple, but the hub is a single point of failure and every device needs it in range.</p>
    </div>
    <div class="topocard">
      <h4>Zigbee — mesh</h4>
      <svg class="topo" viewBox="0 0 200 140">
        <line x1="100" y1="15" x2="147.6" y2="42.5"/><line x1="147.6" y1="42.5" x2="147.6" y2="97.5"/>
        <line x1="147.6" y1="97.5" x2="100" y2="125"/><line x1="100" y1="125" x2="52.4" y2="97.5"/>
        <line x1="52.4" y1="97.5" x2="52.4" y2="42.5"/><line x1="52.4" y1="42.5" x2="100" y2="15"/>
        <line class="topo-cross" x1="100" y1="15" x2="100" y2="125"/><line class="topo-cross" x1="147.6" y1="42.5" x2="52.4" y2="97.5"/>
        <circle class="topo-node" cx="100" cy="15" r="6"/><circle class="topo-node" cx="147.6" cy="42.5" r="6"/>
        <circle class="topo-node" cx="147.6" cy="97.5" r="6"/><circle class="topo-node" cx="100" cy="125" r="6"/>
        <circle class="topo-node" cx="52.4" cy="97.5" r="6"/><circle class="topo-node" cx="52.4" cy="42.5" r="6"/>
      </svg>
      <p>No hub — nodes relay through each other, with more than one path between any two. No single node losing power takes the network down.</p>
    </div>
  </div>
  <p class="note">Wireless DMX/RDM systems share the 2.4 GHz ISM band with Wi-Fi/Bluetooth/Zigbee but are not built on any of these standards — they are purpose-built proprietary RF layers carrying DMX512 data, which is why coordinating channel/frequency use across all of them at a venue is a real RF-planning task, not just "everything is 2.4 GHz so it's fine."</p>
</div>

<div class="tool">
  <h3>RS-485, DMX512, and what a "unit load" is</h3>
  <p><a href="/protocols/dmx512/">DMX512</a>'s electrical layer is EIA/TIA-485 (RS-485): a differential, half-duplex, multi-drop bus — one driver, many listeners on a single twisted pair, daisy-chained and terminated with a 120 Ω resistor at the far end. What limits how many fixtures can share one line is not a fixture count but <b>unit loads</b> (also called device load): RS-485 defines a unit load as the current a standard reference receiver draws, roughly a 12 kΩ input impedance, and caps a single segment at 32 unit loads. A fixture's DMX input does not have to present a full unit load — many modern receiver chips are designed as a fraction of one (1/4 UL, 1/8 UL is common), which is how a line can carry well over 32 physical fixtures before it needs an opto-splitter. Check the fixture's manual for its unit-load figure rather than just counting boxes.</p>
  <div class="topodiagram">
    <div class="topo-good">
      <span class="topo-tag ok">Correct — daisy chain</span>
      <div class="topo-chain">
        <div class="topo-box">Console</div><div class="topo-box">Fixture</div><div class="topo-box">Fixture</div><div class="topo-box">Fixture</div><div class="topo-box term">120 Ω</div>
      </div>
      <p>One line in, one line out, per device, in a straight chain. Terminate the far end and nowhere else.</p>
    </div>
    <div class="topo-bad">
      <span class="topo-tag bad">Wrong — star / hub-and-spoke</span>
      <div class="topo-star">
        <div class="topo-box">Console</div>
        <div class="topo-spokes"><div class="topo-box">Fixture</div><div class="topo-box">Fixture</div><div class="topo-box">Fixture</div></div>
      </div>
      <p>Splitting one line to several fixtures from a single point creates stub reflections and no clean far end to terminate. Use a proper opto-splitter to branch, not a Y-cable.</p>
    </div>
  </div>
  <p class="note">Termination and topology gotchas — no error checking on the data itself, the difference between a splitter and a splice — are covered in more depth on the <a href="/protocols/dmx512/">DMX512 entry</a>. Per ANSI E1.11 (USITT DMX512-A) and EIA/TIA-485.</p>
</div>

<div class="tool">
  <h3>Connector pinouts</h3>
  <div class="pingrid">
    <div class="pinface">
      <h4>HDMI Type-A — single row, 19 pins</h4>
      <div class="pinscroll"><div class="pinrow">
        <span class="pin" data-g="tmds">1</span><span class="pin" data-g="tmds">2</span><span class="pin" data-g="tmds">3</span>
        <span class="pin" data-g="tmds">4</span><span class="pin" data-g="tmds">5</span><span class="pin" data-g="tmds">6</span>
        <span class="pin" data-g="tmds">7</span><span class="pin" data-g="tmds">8</span><span class="pin" data-g="tmds">9</span>
        <span class="pin" data-g="clk">10</span><span class="pin" data-g="clk">11</span><span class="pin" data-g="clk">12</span>
        <span class="pin" data-g="misc">13</span><span class="pin" data-g="misc">14</span>
        <span class="pin" data-g="ddc">15</span><span class="pin" data-g="ddc">16</span>
        <span class="pin" data-g="misc">17</span><span class="pin" data-g="pwr">18</span><span class="pin" data-g="misc">19</span>
      </div></div>
      <div class="pinlegend">
        <span><i class="tmds"></i>TMDS data (1–9)</span>
        <span><i class="clk"></i>TMDS clock (10–12)</span>
        <span><i class="ddc"></i>DDC / EDID (15–16)</span>
        <span><i class="pwr"></i>+5 V (18)</span>
        <span><i class="misc"></i>CEC, HEC, ground, hot-plug</span>
      </div>
      <p class="note">The cable is not automatically the generation number on the box. Full HDMI 2.1 bandwidth needs a cable certified <b>Ultra High Speed</b> — an older "high speed" cable will physically fit and often still show an image, just not at the resolution/refresh the source can produce.</p>
    </div>
    <div class="pinface">
      <h4>DVI-D dual-link — 3 rows × 8, 24 pins</h4>
      <div class="pinscroll">
        <div class="pinrow">
          <span class="pin" data-g="tmds">1</span><span class="pin" data-g="tmds">2</span><span class="pin" data-g="tmds">3</span>
          <span class="pin" data-g="tmds2">4</span><span class="pin" data-g="tmds2">5</span>
          <span class="pin" data-g="ddc">6</span><span class="pin" data-g="ddc">7</span><span class="pin" data-g="misc">8</span>
        </div>
        <div class="pinrow">
          <span class="pin" data-g="tmds">9</span><span class="pin" data-g="tmds">10</span><span class="pin" data-g="tmds">11</span>
          <span class="pin" data-g="tmds2">12</span><span class="pin" data-g="tmds2">13</span>
          <span class="pin" data-g="pwr">14</span><span class="pin" data-g="pwr">15</span><span class="pin" data-g="misc">16</span>
        </div>
        <div class="pinrow">
          <span class="pin" data-g="tmds">17</span><span class="pin" data-g="tmds">18</span><span class="pin" data-g="tmds">19</span>
          <span class="pin" data-g="tmds2">20</span><span class="pin" data-g="tmds2">21</span>
          <span class="pin" data-g="clk">22</span><span class="pin" data-g="clk">23</span><span class="pin" data-g="clk">24</span>
        </div>
      </div>
      <div class="pinlegend">
        <span><i class="tmds"></i>Single-link TMDS pairs</span>
        <span><i class="tmds2"></i>Dual-link-only pairs</span>
        <span><i class="ddc"></i>DDC (6–7)</span>
        <span><i class="pwr"></i>+5 V / ground (14–15)</span>
        <span><i class="clk"></i>TMDS clock (22–24)</span>
        <span><i class="misc"></i>Hot-plug (16), unused on DVI-D (8)</span>
      </div>
      <p class="note">DVI-I adds 4 analogue pins plus a flat ground blade around this same 24-pin block for VGA compatibility; DVI-D omits them entirely, so a DVI-D plug physically cannot go into an analogue-only DVI-A socket. Per the DDWG DVI 1.0 specification.</p>
    </div>
    <div class="pinface">
      <h4>USB-C — 2 rows × 12, mirrored so the plug works either way up</h4>
      <div class="pinscroll">
        <div class="pinrow">
          <span class="pin" data-g="pwr">GND</span><span class="pin" data-g="misc">HS</span><span class="pin" data-g="misc">HS</span>
          <span class="pin" data-g="pwr">VBUS</span><span class="pin" data-g="ddc">CC1</span><span class="pin" data-g="misc">D+</span>
          <span class="pin" data-g="misc">D−</span><span class="pin" data-g="misc">SBU</span><span class="pin" data-g="pwr">VBUS</span>
          <span class="pin" data-g="misc">HS</span><span class="pin" data-g="misc">HS</span><span class="pin" data-g="pwr">GND</span>
        </div>
        <div class="pinrow">
          <span class="pin" data-g="pwr">GND</span><span class="pin" data-g="misc">HS</span><span class="pin" data-g="misc">HS</span>
          <span class="pin" data-g="pwr">VBUS</span><span class="pin" data-g="misc">SBU</span><span class="pin" data-g="misc">D−</span>
          <span class="pin" data-g="misc">D+</span><span class="pin" data-g="ddc">CC2</span><span class="pin" data-g="pwr">VBUS</span>
          <span class="pin" data-g="misc">HS</span><span class="pin" data-g="misc">HS</span><span class="pin" data-g="pwr">GND</span>
        </div>
      </div>
      <div class="pinlegend">
        <span><i class="pwr"></i>Power / ground</span>
        <span><i class="ddc"></i>CC1 / CC2 — orientation &amp; power-role detect</span>
        <span><i class="misc"></i>High-speed lanes (HS), legacy USB 2.0 D+/D−, sideband (SBU)</span>
      </div>
      <p class="note">Simplified for clarity — see the USB-IF Type-C spec for the authoritative per-pin table. The point to see here is the mirroring: row B is row A's function set again, which is what lets the plug work flipped either way up. There is no separate "Thunderbolt connector" — Thunderbolt 3 and 4 run over this exact 24-pin USB-C connector; Thunderbolt 1/2 used the older 20-pin Mini DisplayPort connector instead.</p>
    </div>
  </div>
</div>

<div class="cta"><strong>Missing a topic, or something here needs a correction?</strong>
<p><a href="${GH}/issues/new?labels=tooling&amp;title=signals%2Fmedia%3A+">Open an issue</a> — this page is hand-authored reference content rather than data pulled from the dataset, so corrections go straight to a pull request against this file.</p></div>
`

  return shell({
    title: 'Transmission media & connectors — Ethernet, fibre, wireless, RS-485, pinouts | showstack',
    description: 'Ethernet Cat5e–Cat8, fibre OM1–OM5 and OS1/OS2, Wi-Fi/Bluetooth/Zigbee, RS-485 and DMX512 unit loads and topology, and HDMI/DVI/USB-C pinouts, in one reference page.',
    canonical: `${SITE}/signals/media/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Transmission media & connectors',
      description: 'Structured cabling categories, fibre types, wireless control standards, RS-485/DMX unit loads and topology, and connector pinouts for live entertainment technology.',
      url: `${SITE}/signals/media/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
