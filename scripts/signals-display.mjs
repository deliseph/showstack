/**
 * /signals/display/ — display & video signals: the "version numbers, light
 * engines, and where XR fits" half of the old /signals/ mega-page.
 * Hand-authored reference content, like the rest of the /signals/ family —
 * see signals.mjs for why.
 *
 * The four projector light-engine types are drawn as light-path schematics
 * rather than described only in a table, because the actual differentiator
 * between them — where a prism splits colour, whether a wheel spins, how
 * many chips see the image — is a physical arrangement, not a fact you can
 * fully capture as a table cell. The colour/phosphor wheels genuinely spin
 * in the real device, so they spin here too (CSS only, paused for
 * prefers-reduced-motion).
 */
export function signalsDisplayPage({ esc, shell, SITE, GH }) {
  const style = `
.tool{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin-bottom:22px}
.tool h3{margin-top:0}
.note{font-size:13.5px;color:var(--dimmer);margin-top:8px}
.note a{color:var(--accent)}
table{margin-top:6px}
table + p.note{margin-top:12px}

/* projector optics */
.opticsgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin:14px 0}
.opticscard{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:14px 16px}
.opticscard h4{margin:0 0 12px;font-size:14px}
.opticsflow{display:flex;align-items:flex-start;flex-wrap:wrap;gap:2px}
.ostep{display:flex;flex-direction:column;align-items:center;gap:5px;width:50px}
.ostep small{font-size:9px;color:var(--dimmer);text-align:center;line-height:1.25}
.oarrow{color:var(--dimmer);font-size:13px;margin:5px 0 0;align-self:flex-start;padding-top:4px}
.oicon{width:26px;height:26px;border-radius:6px;display:block;border:1px solid var(--line);flex:0 0 auto}
.oicon.lamp{background:radial-gradient(circle,#fff8d6,var(--accent2));border-radius:50%}
.oicon.laserblue{background:radial-gradient(circle,#cfe8ff,#3d7fd6);border-radius:50%}
.oicon.laserrgb{background:linear-gradient(90deg,#ff5a5a,#57d768,#4f8bff);border-radius:50%}
.oicon.wheel{background:conic-gradient(#ff5a5a,#ffd25a,#57d768,#4fd1ff,#4f8bff,#c470ff,#ff5a5a);border-radius:50%;animation:spin 3s linear infinite}
.oicon.phosphor{background:conic-gradient(#fff6c8,#e8c34a,#fff6c8,#e8c34a,#fff6c8);border-radius:50%;animation:spin 2.2s linear infinite}
.oicon.prism{background:linear-gradient(160deg,#ff5a5a,#57d768 50%,#4f8bff);clip-path:polygon(50% 6%,6% 94%,94% 94%)}
.oicon.dmd1{background:repeating-linear-gradient(90deg,var(--dim) 0 2px,var(--panel) 2px 5px)}
.oicon.dmd3{background:repeating-linear-gradient(0deg,var(--dim) 0 2px,var(--panel) 2px 5px)}
.oicon.lens{background:var(--panel);border-radius:50%;border-width:3px;border-color:var(--accent)}
.oicon.filter{background:linear-gradient(180deg,#ff5a5a,#57d768,#4f8bff);border-radius:4px}
@keyframes spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.oicon{animation:none!important}}

/* reality-virtuality continuum */
.continuum{margin:16px 0 6px}
.cbar{height:10px;border-radius:5px;background:linear-gradient(90deg,var(--dimmer),var(--dom-network),var(--dom-control),var(--accent))}
.cticks{display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--dim);font-family:var(--mono)}
.cticks span{flex:1}
.cticks span:nth-child(2),.cticks span:nth-child(3){text-align:center}
.cticks span:last-child{text-align:right}
.cbrace{text-align:center;margin-top:8px;font-size:11.5px;color:var(--dimmer);font-style:italic}
`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/signals/">signals</a> / display</div>
<h2>Display &amp; video signals</h2>
<p class="lede">Version numbers that decide whether a cable actually does what the box says, how the four kinds of projector light engine actually make colour, the safety classes that govern show lasers, and what a virtual-production or XR stack is actually assembled from.</p>

<div class="tool">
  <h3>Display signal versions — HDMI</h3>
  <table>
    <tr><th>Version</th><th>Year</th><th>Max bandwidth</th><th>Headline capability</th><th>Notable additions</th></tr>
    <tr><td><b>1.4</b></td><td>2009</td><td>10.2 Gbit/s (3× TMDS)</td><td>4K@30Hz, 1080p@120Hz</td><td>3D, ARC, Micro/Mini connectors</td></tr>
    <tr><td><b>2.0</b></td><td>2013</td><td>18 Gbit/s</td><td>4K@60Hz 4:4:4</td><td>HDR (2.0a), up to 32 audio channels</td></tr>
    <tr><td><b>2.1</b></td><td>2017</td><td>48 Gbit/s (FRL, replaces TMDS)</td><td>8K@60Hz, 4K@120Hz</td><td>VRR, eARC, ALLM, Display Stream Compression</td></tr>
  </table>
  <p class="note">The cable is not automatically the generation number on the box. Full HDMI 2.1 bandwidth needs a cable certified <b>Ultra High Speed</b> — an older "high speed" cable will physically fit and often still show an image, just not at the resolution/refresh the source can produce. Pinout on the <a href="/signals/media/">media reference</a>. Per the HDMI Specification (HDMI Licensing Administrator).</p>
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
  <h3>Laser safety classes, and how projector light engines work</h3>
  <p>Laser output is classified by IEC 60825-1: Class 1 is safe under any viewing condition; Class 2 is visible light where the blink reflex is assumed to protect the eye (under 1 mW); Class 3R and 3B are hazardous to look into directly; Class 4 is hazardous to eyes and skin and a fire risk, and is what most entertainment show lasers actually are — which is why show-laser operation typically requires a laser safety officer, a controlled beam path, and (in many jurisdictions) separate authorisation for audience scanning. Laser <em>projectors</em> — the video kind — are classified separately by IEC/EN 62471 into Risk Groups (RG1/RG2/RG3) measured at the output aperture, because a projector's internal laser diodes can be far higher powered than the beam that actually reaches an eye at normal viewing distance.</p>
  <p>Inside the projector, two separate design choices get conflated under "laser projector" — the light source, and how colour gets split. They combine either way (laser-phosphor 3-chip DLP is common in large-venue rental gear):</p>
  <div class="opticsgrid">
    <div class="opticscard">
      <h4>Single-chip DLP</h4>
      <div class="opticsflow">
        <div class="ostep"><span class="oicon lamp"></span><small>Lamp / LED</small></div>
        <span class="oarrow">→</span>
        <div class="ostep"><span class="oicon wheel"></span><small>Colour wheel</small></div>
        <span class="oarrow">→</span>
        <div class="ostep"><span class="oicon dmd1"></span><small>1 DMD chip</small></div>
        <span class="oarrow">→</span>
        <div class="ostep"><span class="oicon lens"></span><small>Lens</small></div>
      </div>
      <p class="note">Colour is sequential — the wheel spins fast enough that the eye fuses R/G/B into one image. Cheapest, most compact; some viewers see a "rainbow effect" artifact on fast eye movement.</p>
    </div>
    <div class="opticscard">
      <h4>3-chip DLP</h4>
      <div class="opticsflow">
        <div class="ostep"><span class="oicon lamp"></span><small>Lamp / laser</small></div>
        <span class="oarrow">→</span>
        <div class="ostep"><span class="oicon prism"></span><small>Prism splits R/G/B</small></div>
        <span class="oarrow">→</span>
        <div class="ostep"><span class="oicon dmd3"></span><small>3 DMD chips</small></div>
        <span class="oarrow">→</span>
        <div class="ostep"><span class="oicon prism"></span><small>Prism recombines</small></div>
        <span class="oarrow">→</span>
        <div class="ostep"><span class="oicon lens"></span><small>Lens</small></div>
      </div>
      <p class="note">A dichroic/TIR prism splits light into red/green/blue paths hitting their own chip simultaneously. No colour wheel, no rainbow artifact, much higher brightness ceiling — the standard for large-venue and rental-and-staging projection.</p>
    </div>
    <div class="opticscard">
      <h4>Laser phosphor</h4>
      <div class="opticsflow">
        <div class="ostep"><span class="oicon laserblue"></span><small>Blue laser</small></div>
        <span class="oarrow">→</span>
        <div class="ostep"><span class="oicon phosphor"></span><small>Phosphor wheel</small></div>
        <span class="oarrow">→</span>
        <div class="ostep"><span class="oicon filter"></span><small>Filter / split RGB</small></div>
        <span class="oarrow">→</span>
        <div class="ostep"><span class="oicon dmd1"></span><small>DMD(s)</small></div>
        <span class="oarrow">→</span>
        <div class="ostep"><span class="oicon lens"></span><small>Lens</small></div>
      </div>
      <p class="note">A blue laser excites a spinning phosphor wheel to generate broad-spectrum light, which is then filtered/split into RGB. Bright and long-lived without a lamp, cheaper than full RGB laser.</p>
    </div>
    <div class="opticscard">
      <h4>Direct RGB laser</h4>
      <div class="opticsflow">
        <div class="ostep"><span class="oicon laserrgb"></span><small>R/G/B laser banks</small></div>
        <span class="oarrow">→</span>
        <div class="ostep"><span class="oicon filter"></span><small>Combine</small></div>
        <span class="oarrow">→</span>
        <div class="ostep"><span class="oicon dmd1"></span><small>DMD(s)</small></div>
        <span class="oarrow">→</span>
        <div class="ostep"><span class="oicon lens"></span><small>Lens</small></div>
      </div>
      <p class="note">Separate red/green/blue laser banks, no phosphor conversion step. Widest colour gamut, no wheel of any kind — premium high-end projection.</p>
    </div>
  </div>
  <p class="note">"Laser" and "3-chip" describe two different things — a projector's light source and how it splits colour — not one spec. Per IEC 60825-1 and IEC/EN 62471.</p>
</div>

<div class="tool">
  <h3>XR / VR / AR — what integrating them into a show actually needs</h3>
  <p>VR is fully synthetic (the audience or performer sees only rendered content); AR overlays rendered content on the real world; MR (mixed reality) blends the two with real-world tracking and occlusion so virtual and physical objects can interact convincingly — XR is the umbrella term for all three, sitting along a continuum from fully real to fully virtual:</p>
  <div class="continuum">
    <div class="cbar"></div>
    <div class="cticks"><span>Real environment</span><span>Augmented reality</span><span>Augmented virtuality</span><span>Virtual environment</span></div>
    <div class="cbrace">— mixed reality (XR) spans the middle of the continuum —</div>
  </div>
  <p class="note" style="margin-bottom:14px">After Milgram &amp; Kishino's reality-virtuality continuum (1994).</p>
  <p>There is no single dedicated "XR entertainment protocol" the way DMX512 exists for lighting; live integration (often called virtual production when it drives an LED volume or a broadcast camera) is an assembly of protocols already on this site:</p>
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

<div class="cta"><strong>Missing a topic, or something here needs a correction?</strong>
<p><a href="${GH}/issues/new?labels=tooling&amp;title=signals%2Fdisplay%3A+">Open an issue</a> — this page is hand-authored reference content rather than data pulled from the dataset, so corrections go straight to a pull request against this file.</p></div>
`

  return shell({
    title: 'Display & video signals — HDMI, DisplayPort, laser & projector optics, XR/VR/AR | showstack',
    description: 'HDMI and DisplayPort version differences, laser safety classes, how single-chip DLP, 3-chip DLP, laser-phosphor and direct-RGB-laser projectors make colour, and how XR/VR/AR integrate into a show.',
    canonical: `${SITE}/signals/display/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Display & video signals',
      description: 'Display-protocol versions, laser safety classes, projector light-engine optics, and XR/VR/AR integration for live entertainment technology.',
      url: `${SITE}/signals/display/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
