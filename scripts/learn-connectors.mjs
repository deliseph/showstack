/**
 * /learn/connectors/ — the same plug is not the same signal.
 *
 * This page exists because of one assumption that costs this industry more
 * money than any other: it fits, so it works. A Mini DisplayPort socket might
 * be DisplayPort or Thunderbolt 2. A USB-C socket might be a 480 Mbit/s
 * charging port or a 40 Gbit/s Thunderbolt port. A 3-pin XLR might be a
 * microphone or a lighting universe. None of that is visible.
 *
 * The organising idea is the split between the *connector* (a mechanical
 * shape), the *pinout* (what each contact is for), and the *protocol* (what
 * the bytes mean). Three independent layers, routinely confused, and once
 * they are separated the whole subject becomes checkable rather than
 * superstitious.
 *
 * The interactive is a USB-C pin map that re-labels itself as you switch
 * mode, because the whole point of that connector is that the same physical
 * pins mean different things depending on a negotiation you cannot see.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav } from './learn-kit.mjs'

export function learnConnectorsPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* the three layers, lighting in turn */
@keyframes ly{0%,100%{opacity:.3}18%,38%{opacity:1}}
.lyrfig .ly1{animation:ly 5.4s ease-in-out infinite}
.lyrfig .ly2{animation:ly 5.4s ease-in-out infinite;animation-delay:1.8s}
.lyrfig .ly3{animation:ly 5.4s ease-in-out infinite;animation-delay:3.6s}
/* asymmetric compatibility: one direction flows, the other stops */
@keyframes flowok{0%{transform:translateX(0);opacity:0}10%{opacity:1}
78%{transform:translateX(190px);opacity:1}90%,100%{opacity:0}}
@keyframes flowno{0%{transform:translateX(0);opacity:0}10%{opacity:1}
44%{transform:translateX(84px);opacity:1}56%,100%{opacity:0;transform:translateX(84px)}}
@keyframes bump{0%,44%{opacity:0}52%,72%{opacity:1}84%,100%{opacity:0}}
.asymfig .go{animation:flowok 2.8s linear infinite}
.asymfig .stop{animation:flowno 2.8s linear infinite}
.asymfig .x{animation:bump 2.8s ease-in-out infinite}
/* the USB-C pin map */
.pinmap{margin:14px 0 0;padding:16px;background:var(--panel);border:1px solid var(--line);
border-radius:var(--r-md);overflow-x:auto;-webkit-overflow-scrolling:touch}
.pinrow{display:flex;gap:3px;min-width:560px}
.pin{flex:1 1 0;min-width:0;border-radius:5px;padding:9px 3px;text-align:center;
font-family:var(--mono);font-size:9.5px;line-height:1.35;border:1px solid var(--line);
background:var(--panel2);color:var(--dimmer);transition:background .2s,color .2s,border-color .2s}
.pin .pn{display:block;font-size:8.5px;opacity:.6;margin-bottom:3px}
.pin.on{background:color-mix(in srgb,var(--accent) 20%,var(--panel));border-color:var(--accent);color:var(--accent)}
.pin.pwr{background:color-mix(in srgb,var(--accent2) 20%,var(--panel));border-color:var(--accent2);color:var(--accent2)}
.pin.neg{background:color-mix(in srgb,var(--ok) 18%,var(--panel));border-color:var(--ok);color:var(--ok)}
.pin.off{opacity:.45}
.pinlegend{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;font-family:var(--mono);font-size:11px;
color:var(--dimmer)}
.pinlegend i{font-style:normal;display:inline-flex;align-items:center;gap:6px}
.pinlegend i::before{content:"";width:10px;height:10px;border-radius:3px;border:1px solid currentColor}
/* connector reference table */
.conn{width:100%;border-collapse:collapse;font-size:14.2px;margin:16px 0}
.conn th{text-align:left;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;
color:var(--dimmer);padding:0 12px 9px 0;border-bottom:1px solid var(--line);font-weight:400;white-space:nowrap}
.conn td{padding:12px 12px 12px 0;border-bottom:1px solid var(--line);vertical-align:top;color:var(--dim);
line-height:1.55}
.conn td:first-child{color:var(--ink);font-family:var(--mono);font-size:12.5px;white-space:nowrap}
.connwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.connwrap .conn{min-width:660px}
/* myth strip */
.myth{margin:18px 0;border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden}
.myth > div{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);border-bottom:1px solid var(--line)}
.myth > div:last-child{border-bottom:none}
.myth .m{padding:14px 16px;background:color-mix(in srgb,var(--warn) 6%,transparent);
border-right:1px solid var(--line);color:var(--dim);font-size:14px;line-height:1.6}
.myth .m b{display:block;font-family:var(--mono);font-size:10px;letter-spacing:.6px;text-transform:uppercase;
color:var(--warn);margin-bottom:6px}
.myth .t{padding:14px 16px;color:var(--dim);font-size:14px;line-height:1.6}
.myth .t b{display:block;font-family:var(--mono);font-size:10px;letter-spacing:.6px;text-transform:uppercase;
color:var(--ok);margin-bottom:6px}
@media(max-width:620px){.myth > div{grid-template-columns:1fr}
.myth .m{border-right:none;border-bottom:1px solid var(--line)}}
`

  const lyrFig = `
<svg viewBox="0 0 620 200" role="img" class="lyrfig">
  <g class="ly1">
    <rect x="40" y="14" width="540" height="48" rx="7" fill="var(--panel)" stroke="var(--accent)" stroke-width="1.6"/>
    <text x="58" y="38" class="val" font-size="12" fill="var(--accent)">CONNECTOR</text>
    <text x="58" y="54" class="lbl">a mechanical shape. It tells you what will physically mate. Nothing else.</text>
  </g>
  <g class="ly2">
    <rect x="40" y="74" width="540" height="48" rx="7" fill="var(--panel)" stroke="var(--accent2)" stroke-width="1.6"/>
    <text x="58" y="98" class="val" font-size="12" fill="var(--accent2)">PINOUT</text>
    <text x="58" y="114" class="lbl">what each contact carries. The same shape can have several, and often does.</text>
  </g>
  <g class="ly3">
    <rect x="40" y="134" width="540" height="48" rx="7" fill="var(--panel)" stroke="var(--dom-network)" stroke-width="1.6"/>
    <text x="58" y="158" class="val" font-size="12" fill="var(--dom-network)">PROTOCOL</text>
    <text x="58" y="174" class="lbl">what the signal on those pins means. Independent of both of the above.</text>
  </g>
</svg>`

  const asymFig = `
<svg viewBox="0 0 460 190" role="img" class="asymfig">
  <text x="230" y="16" class="lbl" font-size="9.5" text-anchor="middle">a DisplayPort monitor into a Thunderbolt 2 port</text>
  <rect x="20" y="28" width="76" height="34" rx="5" fill="var(--panel)" stroke="var(--line)"/>
  <text x="58" y="49" class="lbl" font-size="8.5" text-anchor="middle">DP screen</text>
  <rect x="344" y="28" width="96" height="34" rx="5" fill="var(--panel)" stroke="var(--ok)"/>
  <text x="392" y="49" class="lbl" font-size="8.5" text-anchor="middle">TB2 port</text>
  <line x1="100" y1="45" x2="340" y2="45" stroke="var(--line)" stroke-dasharray="3 5"/>
  <g class="go"><rect x="104" y="38" width="30" height="14" rx="3" fill="var(--ok)"/></g>
  <text x="230" y="76" class="lbl" font-size="9" text-anchor="middle" fill="var(--ok)">works — a Thunderbolt port speaks DisplayPort too</text>
  <line x1="20" y1="94" x2="440" y2="94" stroke="var(--line)"/>
  <text x="230" y="118" class="lbl" font-size="9.5" text-anchor="middle">a Thunderbolt 2 device into a DisplayPort socket</text>
  <rect x="20" y="130" width="76" height="34" rx="5" fill="var(--panel)" stroke="var(--line)"/>
  <text x="58" y="151" class="lbl" font-size="8.5" text-anchor="middle">TB2 drive</text>
  <rect x="344" y="130" width="96" height="34" rx="5" fill="var(--panel)" stroke="var(--warn)"/>
  <text x="392" y="151" class="lbl" font-size="8.5" text-anchor="middle">plain mDP</text>
  <line x1="100" y1="147" x2="340" y2="147" stroke="var(--line)" stroke-dasharray="3 5"/>
  <g class="stop"><rect x="104" y="140" width="30" height="14" rx="3" fill="var(--warn)"/></g>
  <g class="x"><path d="M198 136 L222 158 M222 136 L198 158" stroke="var(--warn)" stroke-width="2.4"/></g>
  <text x="230" y="180" class="lbl" font-size="9" text-anchor="middle" fill="var(--warn)">nothing — the socket has no PCIe behind it, and the plug fits perfectly</text>
</svg>`

  const C = (a, b, c) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / connectors</div>
${learnNav(esc, 'connectors')}
<div class="lhero">
  <h2>The same plug is not the same signal</h2>
  <p class="lede">One assumption costs this industry more time and money than any other: <em>it fits, so it works</em>. A Mini DisplayPort socket might be DisplayPort or Thunderbolt. A USB-C socket might be a charging port or a 40 Gbit/s link. A 3-pin XLR might be a microphone or a lighting universe. None of that is visible from the outside.</p>
</div>

${S('The fix', 'Three layers that are routinely treated as one', [
  'Almost every connector argument dissolves the moment these are separated. They are independent, and any combination is possible.',
  'The <b>connector</b> is a mechanical shape. It tells you what will physically mate and nothing whatsoever about what is behind it. The <b>pinout</b> is what each contact carries — and the same shape frequently has several different pinouts in service at once. The <b>protocol</b> is what the signal on those pins actually means.',
  'So the useful question is never "does this fit". It is <b>"what is on the pins, and does the thing at the other end speak it"</b> — which is answerable, unlike the question people usually ask.',
])}

${fig(lyrFig, 'Three independent layers. A cable can satisfy the first and fail the other two.')}

${S('The interesting case', 'One connector, several protocols — USB-C', [
  'USB-C is 24 pins in a reversible shell, and it is the clearest example on earth of the pinout being negotiated rather than fixed.',
  'A handful of pins never change: <b>VBUS</b> and <b>GND</b> for power, <b>D+/D−</b> for legacy USB 2.0, and <b>CC1/CC2</b> — the configuration channel, which is where orientation is detected, power delivery is negotiated, and any alternate mode is agreed. Everything else is up for discussion.',
  'The four high-speed differential pairs are the ones that change meaning. In plain USB they carry SuperSpeed data. In <b>DisplayPort Alt Mode</b> some or all of them are re-purposed as DisplayPort lanes — two lanes of DP plus USB data, or four lanes of DP and no USB at all. In <b>Thunderbolt 3/4 and USB4</b> they carry a tunnelled mixture: PCIe, DisplayPort and USB multiplexed over the same wires.',
  'That is why two identical-looking sockets on two laptops can be a 480 Mbit/s charge-only port and a 40 Gbit/s Thunderbolt port. And why the cable matters as much as the ports: a charging cable may have no high-speed pairs connected at all, and a passive cable rated for 20 Gbit/s will not do 40 over any length.',
])}

<div class="dial">
  <div class="d" style="flex:0 0 auto"><label>what the port is doing</label>
    <span class="seg" role="group" id="uc-seg">
      <button type="button" data-m="usb2" aria-pressed="false">USB 2.0</button>
      <button type="button" data-m="usb3" aria-pressed="true">USB 3.x</button>
      <button type="button" data-m="dp" aria-pressed="false">DP Alt Mode</button>
      <button type="button" data-m="tb" aria-pressed="false">USB4 / TB</button>
    </span>
  </div>
</div>
<div class="pinmap">
  <div class="pinrow" id="uc-rowa"></div>
  <div class="pinrow" id="uc-rowb" style="margin-top:5px"></div>
  <div class="pinlegend">
    <i style="color:var(--accent2)">power</i>
    <i style="color:var(--accent)">high-speed data</i>
    <i style="color:var(--ok)">negotiation &amp; sideband</i>
    <i style="color:var(--dimmer)">unused in this mode</i>
  </div>
</div>
<div class="verdict" id="uc-out"></div>

${S('The other interesting case', 'One connector, two eras — Mini DisplayPort', [
  'Thunderbolt 1 and 2 used the Mini DisplayPort connector. Not a similar one — the same one. A DisplayPort monitor plugs straight into a Thunderbolt 2 port and works, because a Thunderbolt port also speaks DisplayPort.',
  'The reverse does not hold. A Thunderbolt device plugged into a plain Mini DisplayPort socket does absolutely nothing, because there is no PCIe behind that socket. The plug seats perfectly, the connection is mechanically ideal, and nothing happens.',
  'This <b>asymmetry</b> is the pattern to hold on to, because it recurs everywhere. The more capable port usually accepts the simpler signal; the simpler port almost never accepts the more capable one. And nothing about the outside of either tells you which one you are holding.',
])}

${fig(asymFig, 'One direction works. The other seats perfectly and does nothing.')}

${rule('When two things share a connector, compatibility is nearly always <b>one-way</b>. Ask which end is the more capable one, and expect the traffic to only flow down that hill.')}

${S('The ones on a show', 'What is actually on the pins', [])}

<div class="connwrap">
<table class="conn">
  <thead><tr><th>Connector</th><th>What is on it</th><th>The thing that catches people</th></tr></thead>
  <tbody>
    ${C('XLR5 (DMX)', 'Pin 1 shield, 2/3 the first data pair, 4/5 an optional second data link.', '<a href="/standards/ansi-e1-11/">ANSI E1.11</a> specifies five pins. The industry uses three because it is cheaper, which is non-compliant and — much worse — makes a lighting universe and a microphone line physically interchangeable at 2 a.m.')}
    ${C('XLR3 (audio)', 'Pin 1 shield, pin 2 hot, pin 3 cold. A balanced pair.', 'Microphone cable is not 120 Ω. Running DMX down it works until it does not: the terminator no longer matches anything and the reflections come back. See <a href="/learn/dmx/">termination</a>.')}
    ${C('etherCON', 'An ordinary RJ45 Ethernet pinout inside a ruggedised locking shell.', 'The pinout is standard, so a normal patch lead plugs into an etherCON socket. What you lose is the strain relief and the lock — which is the entire reason the connector exists.')}
    ${C('BNC', 'One coaxial signal path plus screen. Available in 50 Ω and 75 Ω.', 'The two impedances mate happily and look identical. At SDI frequencies the mismatch reflects; at low frequencies you will never notice. Video is 75 Ω, most RF and antenna work is 50 Ω.')}
    ${C('powerCON', 'Mains line, neutral, earth, in a locking connector.', 'Standard powerCON is <b>not</b> rated for connecting or disconnecting under load. TRUE1 is. This is a safety difference, not a convenience one, and the blue/grey pair look reassuringly similar to the thing that is rated.')}
    ${C('speakON NL4', 'Two loudspeaker pairs: 1+/1− and 2+/2−.', 'An NL2 plug mates with an NL4 socket and only picks up pair one. If a bi-amped box is quiet on the low end, check the plug before the amp.')}
    ${C('USB-C', '24 pins: power, CC negotiation, USB 2.0, four high-speed pairs, two sideband.', 'Everything about the high-speed pairs is negotiated. Ports and cables both vary enormously, and nothing on the outside distinguishes them.')}
    ${C('HDMI / DisplayPort', 'HDMI carries TMDS; DisplayPort carries packetised micro-packets plus an AUX channel.', 'They are different signalling schemes. A passive DP-to-HDMI adapter only works because some DP sources can also output HDMI signalling (DP++). A source without that needs an active converter, and a passive adapter on it fails silently.')}
  </tbody>
</table>
</div>

${S('Myths', 'Things everybody has been told that are not true', [])}

<div class="myth">
  <div>
    <div class="m"><b>myth</b>“If it fits, the pinout must match.”</div>
    <div class="t"><b>actually</b>Mating is mechanical. USB-C, Mini DisplayPort, BNC and XLR3 each carry several completely different things on the same shape. The plug is not a promise.</div>
  </div>
  <div>
    <div class="m"><b>myth</b>“A cable is a cable — all USB-C leads are the same.”</div>
    <div class="t"><b>actually</b>A charge-only lead may have no high-speed pairs in it at all, and a passive lead rated at 20 Gbit/s will not do 40. Current capability is declared by an e-marker chip in the cable, which is why one lead charges a laptop and an identical-looking one does not.</div>
  </div>
  <div>
    <div class="m"><b>myth</b>“3-pin DMX is fine, everyone does it.”</div>
    <div class="t"><b>actually</b>Everyone does do it, and it is still outside the standard, still loses the second data link, and still makes a mic line and a data line indistinguishable in a dark truck. Label everything, and never buy 3-pin for a rig that also has audio.</div>
  </div>
  <div>
    <div class="m"><b>myth</b>“Gold contacts sound better.”</div>
    <div class="t"><b>actually</b>Gold resists corrosion, which matters for a connector that is mated once and left in a damp venue for ten years. On a connector cycled nightly it is a durability choice, not an audio one.</div>
  </div>
  <div>
    <div class="m"><b>myth</b>“Cat6 will fix my network problem.”</div>
    <div class="t"><b>actually</b>Category is a bandwidth-over-distance rating. If the fault is a switch flooding multicast, a duplex mismatch or a bad crimp, a higher category changes nothing. See <a href="/learn/network/">show networks</a>.</div>
  </div>
</div>

${bites([
  '<b>Adapters hide the question, they do not answer it.</b> A USB-C to HDMI dongle contains an active converter or it does not, and the failure looks identical to a bad cable.',
  '<b>Test the cable you are going to use, on the port you are going to use.</b> Capability lives in the specific combination of source, cable and sink — not in any one of them.',
  '<b>Label at both ends, by what is on the pins.</b> "DMX" and "MIC" on identical XLR3s is worth more than any amount of care later.',
  '<b>Buy the locking version for anything that carries a show.</b> An etherCON or a TRUE1 costs a few pounds more than the moment it stops a disconnection mid-performance.',
])}

${S('The habit worth forming', 'Ask what is on the pins', [
  'Every connector question on a show reduces to the same three checks, in the same order.',
  '<b>Will it mate?</b> Mechanical, obvious, and the least informative of the three. <b>What is on the pins at each end?</b> Voltage, impedance, which contacts, which direction. <b>Do the two ends speak the same protocol?</b> And if a negotiation is involved — USB-C, DisplayPort, PoE — has it actually succeeded, or is it silently falling back?',
  'That is the whole discipline. It also happens to be the discipline the rest of this site is built on: know what you are carrying before you worry about what it is carrying it in.',
])}

<div class="cta"><strong>Got a pinout that regularly catches people out?</strong>
<p>Connector conventions vary by market and by decade, and the ones that cause trouble are exactly the ones nobody writes down. <a href="${GH}/issues/new?labels=data&amp;title=connectors%3A+">Open an issue</a> and it goes on the page with a citation.</p></div>

<script>
(function(){
  // USB-C receptacle, A side then B side. Each pin knows what it becomes in
  // each mode - which is the entire point of the connector.
  var PINS=[
    [['A1','GND','pwr','pwr','pwr','pwr'],['A2','TX1+','off','on','on','on'],['A3','TX1-','off','on','on','on'],
     ['A4','VBUS','pwr','pwr','pwr','pwr'],['A5','CC1','neg','neg','neg','neg'],['A6','D+','on','on','on','on'],
     ['A7','D-','on','on','on','on'],['A8','SBU1','off','off','neg','neg'],['A9','VBUS','pwr','pwr','pwr','pwr'],
     ['A10','RX2-','off','on','on','on'],['A11','RX2+','off','on','on','on'],['A12','GND','pwr','pwr','pwr','pwr']],
    [['B1','GND','pwr','pwr','pwr','pwr'],['B2','TX2+','off','on','on','on'],['B3','TX2-','off','on','on','on'],
     ['B4','VBUS','pwr','pwr','pwr','pwr'],['B5','CC2','neg','neg','neg','neg'],['B6','D+','on','on','on','on'],
     ['B7','D-','on','on','on','on'],['B8','SBU2','off','off','neg','neg'],['B9','VBUS','pwr','pwr','pwr','pwr'],
     ['B10','RX1-','off','on','on','on'],['B11','RX1+','off','on','on','on'],['B12','GND','pwr','pwr','pwr','pwr']]
  ];
  var MODES={usb2:2,usb3:3,dp:4,tb:5};
  var NOTE={
    usb2:'<b>USB 2.0 only.</b> Just D+/D&minus;, power and the configuration channel. The four high-speed pairs are dormant &mdash; 480 Mbit/s, and a perfectly good charging port.',
    usb3:'<b>USB 3.x.</b> All four high-speed pairs carrying SuperSpeed data. Up to 10 or 20 Gbit/s depending on generation, and the cable has to actually contain those pairs.',
    dp:'<b>DisplayPort Alt Mode.</b> The high-speed pairs are re-purposed as DisplayPort lanes, and SBU1/SBU2 become the DP AUX channel. Two lanes leaves USB 3 working alongside; four lanes gives maximum video and drops USB back to 2.0.',
    tb:'<b>USB4 / Thunderbolt.</b> The same four pairs, now carrying PCIe, DisplayPort and USB tunnelled together and allocated on demand. Up to 40 Gbit/s, and the one mode where the cable is as likely to be the limit as the ports.'
  };
  var seg=document.getElementById('uc-seg'); if(!seg) return;
  var rows=[document.getElementById('uc-rowa'),document.getElementById('uc-rowb')];
  function draw(mode){
    var idx=MODES[mode];
    PINS.forEach(function(side,i){
      rows[i].innerHTML=side.map(function(p){
        return '<div class="pin '+p[idx]+'"><span class="pn">'+p[0]+'</span>'+p[1]+'</div>';
      }).join('');
    });
    document.getElementById('uc-out').innerHTML=NOTE[mode];
    for(var b of seg.querySelectorAll('button')) b.setAttribute('aria-pressed',String(b.dataset.m===mode));
  }
  seg.addEventListener('click',function(e){var b=e.target.closest('button'); if(b) draw(b.dataset.m);});
  draw('usb3');
})();
</script>
`

  return shell({
    title: 'The same plug is not the same signal — connectors, pinouts and alt modes | showstack',
    description: 'Connector, pinout and protocol are three independent layers. What is really on a USB-C port in each mode, why Thunderbolt and DisplayPort share Mini DisplayPort but only work one way round, and the pinouts behind XLR, etherCON, BNC, powerCON, speakON, HDMI and DisplayPort.',
    canonical: `${SITE}/learn/connectors/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Connectors, pinouts and alternate modes',
      description: 'Separating connector from pinout from protocol; USB-C alternate modes pin by pin; Thunderbolt over Mini DisplayPort; and the show connectors that catch people out.',
      url: `${SITE}/learn/connectors/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
