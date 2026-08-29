/**
 * /learn/network/ — the three network questions that actually cost shows.
 *
 * The /network/ page is a planner: it tells you what DSCP values collide and
 * whether a link will carry the load. This page is the layer underneath it -
 * why any of that matters, and how to read a subnet mask without memorising
 * a table.
 *
 * The subnetting figure is the one worth building carefully. Every subnetting
 * tutorial writes the mask out in binary and then explains it in prose;
 * almost none of them let you *move the boundary* and watch the network and
 * host halves change. Dragging the prefix is what makes /20 stop being magic.
 */
import { subnetCidr } from './toolmath.mjs'
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

const MATH_SRC = [subnetCidr].map((f) => f.toString()).join('\n\n')

export function learnNetworkPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* queue animation: a small clock packet stuck behind a big file transfer */
@keyframes q-march{from{transform:translateX(0)}to{transform:translateX(var(--march))}}
/* CSS rather than SMIL, deliberately: the site's reduced-motion guarantee is
   one global rule that kills CSS animation, and SMIL would walk straight
   past it. */
@keyframes mc-send{0%{transform:translate(0,0);opacity:0}
8%{opacity:1}88%{opacity:1}
100%{transform:translate(var(--dx),var(--dy));opacity:0}}
.mcfig .mcpkt{animation:mc-send 1.6s linear infinite}
.mcfig.snooped .unwanted{opacity:.12}
.mcfig.snooped .unwanted .mcpkt{animation:none;opacity:0}
.mcfig .mcpath,.mcfig .unwanted{transition:opacity .4s ease}
.maskfig .mbit{transition:fill .25s ease}
#mask-cut{transition:x1 .25s ease,x2 .25s ease}
.qlane .train{animation:q-march 3.4s linear infinite}
.qlane.fast .train{animation-duration:1.5s}
/* the 32-bit address, split by a movable boundary */
.bits{display:flex;flex-wrap:wrap;gap:3px;margin-top:14px;font-family:var(--mono);font-size:11px;line-height:1}
.bits .oct{display:flex;gap:2px;padding:6px;border:1px solid var(--line);border-radius:7px;background:var(--panel)}
.bits .b{width:15px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:3px;
background:var(--panel2);color:var(--dimmer);transition:background .18s,color .18s}
.bits .b.net{background:color-mix(in srgb,var(--accent) 26%,transparent);color:var(--ink);font-weight:600}
.bits .b.host{background:color-mix(in srgb,var(--accent2) 20%,transparent);color:var(--ink)}
.bits .b.edge{box-shadow:inset 0 -2px 0 var(--warn)}
.bitkey{display:flex;gap:16px;flex-wrap:wrap;font-family:var(--mono);font-size:11.5px;color:var(--dimmer);margin-top:10px}
.bitkey i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.subgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:14px}
.subgrid div{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:11px 13px}
.subgrid dt{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;color:var(--dimmer);margin-bottom:4px}
.subgrid dd{margin:0;font-family:var(--mono);font-size:15px;color:var(--ink);word-break:break-all}
`

  // ---- figure: what QoS is protecting ------------------------------------
  const laneW = 600
  const queueFig = (fast) => `
<svg viewBox="0 0 ${laneW} 118" role="img">
  <g class="qlane${fast ? ' fast' : ''}" style="--march:${laneW - 60}px">
    <rect x="8" y="34" width="46" height="46" rx="6" fill="var(--panel)" stroke="var(--line)"/>
    <text x="31" y="61" class="lbl" text-anchor="middle">SWITCH</text>
    <line x1="58" y1="57" x2="${laneW - 10}" y2="57" stroke="var(--line)" stroke-width="2" stroke-dasharray="4 5"/>
    <g class="train">
      ${fast
        ? `<rect x="58" y="44" width="22" height="26" rx="4" fill="var(--accent)"/>
           <rect x="86" y="46" width="96" height="22" rx="4" fill="var(--dimmer)" opacity=".5"/>
           <rect x="186" y="46" width="96" height="22" rx="4" fill="var(--dimmer)" opacity=".5"/>`
        : `<rect x="58" y="46" width="96" height="22" rx="4" fill="var(--dimmer)" opacity=".5"/>
           <rect x="158" y="46" width="96" height="22" rx="4" fill="var(--dimmer)" opacity=".5"/>
           <rect x="258" y="44" width="22" height="26" rx="4" fill="var(--warn)"/>`}
    </g>
    <text x="${laneW - 10}" y="26" class="lbl" text-anchor="end">${fast ? 'clock arrives on time' : 'clock arrives late'}</text>
    <text x="60" y="98" class="lbl">${fast ? 'EF / CS7 — clock jumps the queue' : 'one queue, first come first served'}</text>
  </g>
</svg>`

  /* The flood is the thing to see, not to be told about. Packets travel down
     every path until snooping is switched on, and then the unwanted paths go
     quiet — which is the entire argument for IGMP in one figure. */
  const mcastFig = `
<svg viewBox="-30 0 400 190" role="img" class="mcfig" id="mc-fig">
  <rect x="140" y="12" width="60" height="34" rx="6" fill="var(--panel)" stroke="var(--line)"/>
  <text x="170" y="33" class="lbl" text-anchor="middle">SWITCH</text>
  ${[0, 1, 2, 3, 4].map((i) => {
    const x = 26 + i * 72
    const wanted = i === 1 || i === 3
    return `<g class="mcpath ${wanted ? 'wanted' : 'unwanted'}">` +
      `<line x1="170" y1="46" x2="${x + 22}" y2="112"
             stroke="${wanted ? 'var(--ok)' : 'var(--warn)'}" stroke-width="${wanted ? 3 : 2}"
             opacity="${wanted ? 1 : 0.55}"/>` +
      `<circle class="mcpkt" r="4" cx="170" cy="46" fill="${wanted ? 'var(--ok)' : 'var(--warn)'}"
               style="--dx:${x + 22 - 170}px;--dy:66px;animation-delay:${(i * 0.22).toFixed(2)}s"/>` +
      `</g>` +
      `<rect x="${x}" y="112" width="44" height="30" rx="4" fill="var(--panel)" stroke="var(--line)"/>` +
      `<text x="${x + 22}" y="132" class="lbl" text-anchor="middle" fill="${wanted ? 'var(--ok)' : 'var(--dimmer)'}">${wanted ? 'wants it' : 'does not'}</text>`
  }).join('')}
  <text x="170" y="163" class="lbl" text-anchor="middle" id="mc-cap">without snooping, every port gets every packet</text>
  <text x="170" y="181" class="lbl" text-anchor="middle" id="mc-load"></text>
</svg>`

  /* Where you cut the 32 bits. The ruler is the rule, and moving the cut is
     the only way to feel that every other number is derived from it. */
  const maskFig = `
<svg viewBox="0 0 620 150" role="img" class="maskfig" id="mask-fig">
  ${[...Array(32)].map((_, i) => `<rect class="mbit b${i}" x="${14 + i * 18.5}" y="42" width="15" height="34" rx="2"
      fill="var(--dom-network)" stroke="var(--line)" stroke-width=".5"/>`).join('')}
  ${[...Array(4)].map((_, o) => `<text x="${14 + o * 148 + 66}" y="34" class="lbl" text-anchor="middle">octet ${o + 1}</text>`).join('')}
  ${[...Array(3)].map((_, o) => `<line x1="${14 + (o + 1) * 148 - 4}" y1="38" x2="${14 + (o + 1) * 148 - 4}" y2="80"
      stroke="var(--line)" stroke-width="1.5"/>`).join('')}
  <line id="mask-cut" x1="14" y1="34" x2="14" y2="86" stroke="var(--accent2)" stroke-width="3"/>
  <text id="mask-net" x="14" y="104" class="lbl" text-anchor="middle" fill="var(--dom-network)">network</text>
  <text id="mask-host" x="500" y="104" class="lbl" text-anchor="middle" fill="var(--accent2)">devices</text>
  <text x="14" y="132" class="lbl" id="mask-cap"></text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / network</div>
${learnNav(esc, 'network')}
<div class="lhero">
  <h2>Show networks</h2>
  <p class="lede">An entertainment network carries traffic with a property office IT rarely has to think about: some of it is worthless if it arrives late. Three things follow from that.</p>
</div>

${S('Question one', 'Why does QoS matter more here than in an office?', [
  'In an office, a late packet is a slower file. On a show network, a late packet can be a clock. <a href="/protocols/dante/">Dante</a>, <a href="/protocols/aes67/">AES67</a> and <a href="/protocols/smpte-st-2110/">ST 2110</a> all lock their devices to a shared <a href="/protocols/ptp-1588/">PTP</a> reference, and PTP works by measuring how long messages take to arrive. Delay a clock message behind a big file copy and the receiver does not just get the time late — it calculates the <em>wrong</em> time.',
  'That is why audio-over-IP fails the way it does: not gracefully, not gradually, but as clicks and dropouts on a network whose bandwidth graph looks fine. The link was never full. One queue was, for a few milliseconds, at the wrong moment.',
  'Quality of Service is the switch being told which packets to send first when it cannot send everything at once. Clock highest, media next, everything else last.',
])}

<div class="figrow">
  ${fig(queueFig(false), 'No QoS: the clock packet waits behind whatever arrived first.')}
  ${fig(queueFig(true), 'With QoS: the clock is marked, and the switch sends it first.')}
</div>

${rule('QoS is not about bandwidth. It is about <b>which packet goes first in the microsecond when two want to go at once</b> — and on a media network that packet is the clock.')}

${bites([
  '<b>An unmanaged switch cannot do this at all.</b> It has one queue. This is the entire reason a media network specifies managed switches.',
  '<b>DSCP is layer 3, PCP is layer 2.</b> An untagged access port has no PCP field, so half the QoS a vendor guide describes silently does not exist on that port.',
  '<b>Two systems can both be right and still collide.</b> Dante marks audio EF 46; standard AES67 marks its <em>clock</em> EF 46. In one queue, one system’s audio starves the other’s clock. The <a href="/network/#qos">QoS planner</a> flags that pairing.',
  '<b>Energy-efficient Ethernet parks ports to save power.</b> On a media port it adds exactly the jitter you configured QoS to remove. Turn it off.',
])}

${S('Question two', 'How do I calculate a subnet mask?', [
  'An IPv4 address is 32 bits. The mask does one job: it says how many of those bits from the left identify the <b>network</b>, leaving the rest to identify the <b>host</b>. That is the whole idea — /24 means "the first 24 bits are the network".',
  'Everything else is arithmetic that falls out of it. Set the host bits to all zeros and you have the network address. Set them to all ones and you have the broadcast address. The number of hosts is two to the power of the host bits, minus two — one for the network address, one for the broadcast.',
  'Drag the boundary below and watch it happen. The bits that turn teal are the network; the amber ones are what is left for devices.',
])}

${fig(maskFig, 'The mask is one cut through 32 bits. Everything else — the network address, the broadcast, how many devices fit — falls out of where you put it.', 'mask-wrap')}


<div class="tryit">
  <div class="f"><label for="sn-ip">Address</label><input id="sn-ip" type="text" value="192.168.1.50" spellcheck="false" style="width:170px"></div>
  <div class="f"><label for="sn-p">Prefix — <span id="sn-plabel">/24</span></label><input id="sn-p" type="range" min="0" max="32" value="24"></div>
</div>
<div class="bits" id="sn-bits"></div>
<div class="bitkey">
  <span><i style="background:color-mix(in srgb,var(--accent) 26%,transparent)"></i>network bits</span>
  <span><i style="background:color-mix(in srgb,var(--accent2) 20%,transparent)"></i>host bits</span>
</div>
<dl class="subgrid" id="sn-grid"></dl>
<div class="readout" id="sn-out" role="status" aria-live="polite"></div>

${rule('The mask is just <b>where you cut the 32 bits</b>. Left of the cut is the network, right of it is the devices — and every other number is derived from that one decision.')}

${bites([
  '<b>A /24 is not "the last number".</b> 172.16.5.9/20 lives in the block that starts at 172.16.0.0 and ends at 172.16.15.255 — the boundary does not land on a dot.',
  '<b>Two devices on the same wire with different masks cannot talk reliably.</b> Each computes a different idea of what is local, so traffic goes one way and not the other.',
  '<b>Use the RFC 1918 private ranges</b> — 10.x, 172.16–31.x, 192.168.x. A show network on public address space will collide with something eventually.',
  '<b>Art-Net historically defaults to 2.x.x.x/8</b>, which is public address space and enormous. Fine on an isolated rig, a problem the moment that rig meets a house network.',
])}

${S('Question three', 'Why does multicast need the switch’s help?', [
  'Multicast is how one sender reaches many receivers without sending a copy to each — the mechanism <a href="/protocols/sacn/">sACN</a>, Dante and ST 2110 all rely on to scale past a handful of devices.',
  'But a switch does not know who wants a given multicast group unless it is listening to the messages where devices subscribe. Without <b>IGMP snooping</b>, and an IGMP querier somewhere on the VLAN to prompt those messages, the switch does the only safe thing it can: it sends every multicast packet to every port.',
  'On a small rig that is invisible. On a full lighting network it is every universe arriving at every device, including the laptop that just wanted to be on the wifi.',
])}

${fig(mcastFig, 'One sender, five ports, two subscribers. Watch where the packets actually go, then turn snooping on.', 'mc-wrap')}

<div class="dial">
  <div class="dialrow">
    <label for="mc-snoop">IGMP snooping</label>
    <input id="mc-snoop" type="range" min="0" max="1" step="1" value="0">
    <output id="mc-snoop-v">off</output>
  </div>
  <div class="dialrow">
    <label for="mc-univ">Universes on the wire</label>
    <input id="mc-univ" type="range" min="1" max="64" step="1" value="8">
    <output id="mc-univ-v">8</output>
  </div>
  <div class="verdict" id="mc-out"></div>
</div>

${rule('Multicast needs <b>IGMP snooping plus a querier</b>. Snooping alone, with nothing prompting devices to report, degrades back to flooding.')}

${xnote('QoS is protecting a latency figure, and that figure was chosen because of a human being. A late clock becomes drifting audio, which becomes a mouth and a voice on opposite sides of the <b>audiovisual binding window</b> — the point at which sight and sound stop being one event. Nobody in the room will say "the network is congested"; they will say it felt off.')}

${S('First principles', 'Two addresses, because two different jobs',
  ['Everything above assumed you already knew what an address is, which is the kind of assumption that leaves people quietly stuck. So, plainly: every device on a network has <strong>two</strong> addresses, and the reason is that they answer two different questions.',
   'A <strong>MAC address</strong> is burned into the network interface at the factory. Forty-eight bits, written as six hex pairs like <span class="mono">00:1D:C1:AA:BB:CC</span>, and the first three pairs identify the manufacturer. It never changes and it means nothing about where the device is &mdash; it is a name, not a location. It only works within one local network segment, because the way anything finds a MAC address is by shouting on the local wire and waiting for an answer, and shouting does not cross a router.',
   'An <strong>IP address</strong> is assigned, not born, and it encodes <em>where</em>. That is the whole reason it exists: because it has structure, a router can look at an address it has never seen and know which direction to send it. A MAC address gives you no such clue &mdash; there is no way to look at one and work out which continent it is on.',
   'So the two work as a pair, at different scales. IP gets a packet across the world to the right network. MAC gets it across the last stretch of copper to the right socket. On every hop the MAC addresses are rewritten and the IP addresses are not, which is the single most useful thing to know when reading a packet capture.'])}

${rule('IP says <b>where</b>, MAC says <b>who</b>. IP survives the whole journey; MAC is rewritten at every hop.')}

${S('Four numbers, or eight groups', 'IPv4, IPv6, and why anybody bothered',
  ['IPv4 is the familiar one: four numbers 0&ndash;255, which is 32 bits, which is about 4.3 billion addresses. That sounded limitless in 1981 and ran out around 2011, which is the entire reason IPv6 exists.',
   'IPv6 is 128 bits, written as eight groups of four hex digits &mdash; <span class="mono">2001:0db8:0000:0000:0000:ff00:0042:8329</span> &mdash; with runs of zeros collapsed to <span class="mono">::</span> once per address, so that becomes <span class="mono">2001:db8::ff00:42:8329</span>. The address space is not four times bigger, it is 2<sup>96</sup> times bigger, which is a number with no useful comparison.',
   'What changes in practice is smaller than the address length suggests. There is no broadcast in IPv6 &mdash; its jobs are done by multicast, which is tidier. Devices can configure their own addresses from the router&rsquo;s advertisements without a DHCP server. Fragmentation is the sender&rsquo;s problem rather than the router&rsquo;s. And a device commonly holds several IPv6 addresses at once, including a link-local one starting <span class="mono">fe80::</span> that always exists and never leaves the segment.',
   'For show networks the honest position is that IPv4 is what nearly all entertainment protocols assume. sACN, Art-Net, Dante and most of the rest are specified and deployed on IPv4, several of them with multicast group addresses written into the standard. Turning IPv6 on alongside is usually harmless and occasionally useful; expecting it to replace IPv4 on a show network is not yet a plan.'])}

${S('One cable, several networks', 'What a VLAN actually does',
  ['A VLAN splits one physical switch into several logical ones. Ports in VLAN 10 can talk to each other and cannot reach ports in VLAN 20, even though they are in the same box on the same rack.',
   'Mechanically it is four extra bytes. A tagged frame carries a 12-bit VLAN ID inserted into the Ethernet header &mdash; 802.1Q &mdash; so 4094 usable VLANs, and the switch reads the tag to decide where the frame is allowed to go. A port is either an <strong>access</strong> port, which belongs to one VLAN and sends untagged frames to a device that knows nothing about any of this, or a <strong>trunk</strong>, which carries several VLANs tagged and is how you get more than one network down a single cable between switches.',
   'Why it matters on a show is that broadcast and multicast traffic stays inside its VLAN. Put lighting, audio and production on one flat network and every sACN packet reaches the audio gear, every Dante flow reaches the lighting nodes, and a single misconfigured device can flood all of it. Separate them and each one only has to survive its own traffic. It is also the cheapest form of security available: a laptop plugged into the wrong socket lands somewhere that cannot reach the show control network at all.',
   'The catch is that VLANs cannot talk to each other without a router, and about half of all show-network confusion is somebody discovering this at exactly the wrong moment. If the console is in VLAN 10 and the media server is in VLAN 20, they are on different networks, and no amount of correct IP configuration will change that until something routes between them.'])}

${bites([
  '<b>The native VLAN.</b> A trunk carries one VLAN untagged by default. Devices that disagree about which one that is produce a fault that looks intermittent and is not.',
  '<b>Multicast across VLANs.</b> sACN and Dante multicast does not cross a VLAN boundary on its own. That needs routing plus a multicast router, and it is a much bigger job than adding a VLAN.',
  '<b>VLAN 1.</b> Most switches ship with everything in VLAN 1 and use it for their own management traffic. Leaving show traffic there works and mixes your control plane with your data plane.',
  '<b>One cable, two consoles, no trunk.</b> If the link between switches is an access port, only one VLAN crosses it and the rest silently do not.',
])}

${S('Two cables, one link', 'Aggregation, and what it does not do',
  ['Link aggregation &mdash; LAG, port channel, bonding, LACP, all roughly the same thing &mdash; makes several physical cables behave as one logical link. Two gigabit ports become a two-gigabit trunk with automatic failover if one cable is pulled.',
   'The failover half is genuinely valuable and works as advertised. The bandwidth half needs a caveat that catches people out: aggregation does <strong>not</strong> give a single conversation more bandwidth. The switch chooses which physical link to use by hashing something about each flow &mdash; source and destination MAC, or IP, or port numbers &mdash; and every packet of one flow follows the same link, so packet order is preserved. A single 1.4 Gbit/s video stream across two 1 Gbit/s links does not work. It picks one link and drops the excess.',
   'So aggregation buys you resilience always, and throughput only when the traffic is many independent flows. On a show network that is often exactly what you have &mdash; dozens of Dante flows, many sACN universes &mdash; and it is occasionally the opposite, which is when somebody discovers the hash. Most switches let you choose what to hash on, and moving from MAC-based to IP-and-port-based hashing is the usual fix for traffic that has all piled onto one link.'])}

${rule('Aggregation is <b>resilience always, bandwidth sometimes</b>. One flow gets one cable, however many you bonded.')}

${S('Watching and reaching', 'TAPs, mirrors and VPNs',
  ['Three more pieces of vocabulary that get used as though everyone already knows them.',
   'A <strong>network TAP</strong> is a passive device spliced into a link that copies everything passing through it to a monitoring port. Passive is the point: it has no configuration, cannot drop traffic, and keeps working if it loses power, so it does not become the thing that broke the show. A <strong>port mirror</strong> or SPAN does the same job in software on the switch, which costs nothing and is fine for diagnosis &mdash; but a busy switch drops mirrored frames before it drops real ones, so a mirror can lie about exactly the congestion you are trying to investigate. If you are proving a timing problem, use a TAP.',
   'A <strong>VPN</strong> builds an encrypted tunnel across a network you do not trust, so two things far apart behave as though they are on the same local network. On a show that usually means remote support: somebody at home reaching a console or a media server on site. It is the right tool for that and the wrong tool for anything time-critical, because a tunnel across the public internet inherits the internet&rsquo;s latency and jitter, and no amount of QoS at your end governs what happens in the middle. Remote programming over VPN: yes. Live show traffic over VPN: no.'])}

${S('Hiding who is talking', 'What a VPN does not do, and what onion routing does instead',
  ['A VPN encrypts your traffic and sends it to a server that forwards it on. That hides the <em>content</em> from the local network and hides your address from the far end &mdash; but the VPN operator can see both ends of every connection you make. It does not remove the need to trust somebody. It moves that trust from your café&rsquo;s wifi to a company you have probably never met, which is sometimes a good trade and sometimes a worse one.',
   '<strong>Onion routing</strong> &mdash; Tor is the well-known implementation &mdash; removes the single trusted party rather than relocating it. Your traffic is wrapped in three layers of encryption and passed through three relays chosen from thousands. The first relay peels one layer and knows who you are but not where you are going. The third peels the last and knows where you are going but not who you are. The middle one knows neither. No single relay ever holds both halves, which is the whole idea, and it is why it is called onion routing: layers, removed one at a time.',
   'The cost is latency, and a great deal of it. Three hops chosen for <em>diversity</em> rather than proximity might route you through three continents, so round trips run into hundreds of milliseconds and vary constantly. That makes it completely unsuitable for anything on this site with a clock in it &mdash; no timecode, no PTP, no live media, no remote console control. It is a tool for reading and publishing, not for running a show.',
   'Two refinements worth knowing. An <strong>onion service</strong> &mdash; a <span class="mono">.onion</span> address &mdash; has no exit relay at all, because both ends stay inside the network and meet at a rendezvous point; nothing ever emerges onto the ordinary internet, so there is no exit operator who can watch it. And what none of this hides is what you <em>do</em>: log into an account and you have identified yourself, whatever the transport did. Onion routing protects the metadata &mdash; who is talking to whom &mdash; and metadata is usually the part that matters, which is exactly why it is worth protecting.'])}

${rule('A VPN <b>moves</b> trust to its operator. Onion routing <b>splits</b> it so no single party holds both ends. Neither hides what you type once you have logged in.')}

${bites([
  '<b>A mirror port as evidence.</b> The frames a congested switch drops from a mirror are precisely the ones you needed to see.',
  '<b>A VPN carrying anything with a clock in it.</b> PTP, timecode and live media over a tunnel you do not control is a problem waiting for an audience.',
  '<b>Leaving remote access on after the fit-up.</b> A tunnel into the show network that outlives its reason is somebody else&rsquo;s way in.',
])}

<div class="cta"><strong>Now do it with your own numbers.</strong>
<p>The <a href="/tools/#subnet">subnet calculator</a> and <a href="/network/#qos">QoS priority planner</a> take real inputs, and the <a href="/network/#fill">link fill estimator</a> checks whether the traffic actually fits before you commit to a single gigabit uplink.</p></div>
`

  const script = `
${MATH_SRC}
const $ = (s) => document.querySelector(s);

function snRender(){
  const ip = $("#sn-ip").value.trim();
  const p = Number($("#sn-p").value);
  $("#sn-plabel").textContent = "/" + p;
  const r = subnetCidr(ip, p);
  if (!r) {
    $("#sn-out").innerHTML = '<span class="err">That is not a valid IPv4 address. Four numbers, each 0–255, separated by dots.</span>';
    $("#sn-bits").innerHTML = ""; $("#sn-grid").innerHTML = "";
    return;
  }
  // 32 bits of the address, grouped into octets, coloured by which side of
  // the prefix boundary they fall on.
  const octets = ip.split(".").map(Number);
  let html = "";
  for (let o = 0; o < 4; o++){
    html += '<span class="oct">';
    for (let b = 0; b < 8; b++){
      const idx = o * 8 + b;
      const bit = (octets[o] >> (7 - b)) & 1;
      const cls = idx < p ? "net" : "host";
      const edge = idx === p - 1 ? " edge" : "";
      html += '<span class="b ' + cls + edge + '">' + bit + '</span>';
    }
    html += '</span>';
  }
  $("#sn-bits").innerHTML = html;

  const cell = (k, v) => '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>';
  $("#sn-grid").innerHTML =
    cell("Network", r.network) +
    cell("Mask", r.mask) +
    cell("Broadcast", r.broadcast ?? "—") +
    cell("Host range", r.firstHost ? r.firstHost + " – " + r.lastHost : "—") +
    cell("Usable hosts", r.usableHosts.toLocaleString()) +
    cell("CIDR", r.cidr);

  const hostBits = 32 - p;
  let note = "<b>" + p + "</b> network bits, <b>" + hostBits + "</b> host bits → 2^" + hostBits +
    " = " + r.totalAddresses.toLocaleString() + " addresses";
  if (p <= 30) note += ", minus the network and broadcast address = <b>" + r.usableHosts.toLocaleString() + "</b> usable.";
  else if (p === 31) note += ". A /31 is a point-to-point link (RFC 3021): no network or broadcast address to reserve, so both are usable.";
  else note += ". A /32 is a single host route.";
  note += r.isPrivate
    ? ' <span class="ok">Inside RFC 1918 private space.</span>'
    : ' <span class="err">Not private address space</span> — fine on an isolated rig, a collision waiting to happen on a house network.';
  $("#sn-out").innerHTML = note;
}
$("#sn-ip").addEventListener("input", snRender);
$("#sn-p").addEventListener("input", snRender);
snRender();

/* ---- multicast: watch the flood, then prune it ------------------------- */
(function(){
  var snoop=document.getElementById('mc-snoop'), univ=document.getElementById('mc-univ');
  var figEl=document.getElementById('mc-fig');
  if(!snoop||!univ||!figEl)return;
  function draw(){
    var on=snoop.value==='1', n=Number(univ.value);
    document.getElementById('mc-snoop-v').textContent=on?'on':'off';
    document.getElementById('mc-univ-v').textContent=n;
    figEl.classList.toggle('snooped',on);
    var cap=document.getElementById('mc-cap');
    cap.textContent=on?'with snooping, only the two ports that asked receive it'
                      :'without snooping, every port gets every packet';
    /* An sACN universe is ~1 packet per DMX frame; at 44 Hz and a full
       638-byte E1.31 frame that is roughly 0.22 Mbit/s per universe. */
    var perUniverse=0.22, ports=5, wanted=2;
    var delivered=(on?wanted:ports)*n*perUniverse;
    var wasted=on?0:(ports-wanted)*n*perUniverse;
    document.getElementById('mc-load').textContent=
      Math.round(delivered*10)/10+' Mbit/s leaving the switch';
    var v=document.getElementById('mc-out');
    v.innerHTML= on
      ? '<b>'+(Math.round(delivered*10)/10)+' Mbit/s</b> delivered, none wasted. Every port that did not ask is quiet.'
      : '<b>'+(Math.round(delivered*10)/10)+' Mbit/s</b> leaving the switch, of which <b>'
        +(Math.round(wasted*10)/10)+' Mbit/s</b> goes to ports that never asked for it — and every one of those devices has to receive and discard it.';
  }
  snoop.addEventListener('input',draw); univ.addEventListener('input',draw); draw();
})();

/* ---- the mask, as a cut through 32 bits -------------------------------
   Driven by the calculator's own prefix control rather than a second slider:
   the page already asks you to drag a boundary, and two of them is one too
   many. The ruler is the picture of the number the calculator prints. */
(function(){
  var p=document.getElementById('sn-p');
  if(!p||!document.getElementById('mask-fig'))return;
  function draw(){
    var n=Number(p.value);
    for(var i=0;i<32;i++){
      var b=document.querySelector('.maskfig .b'+i);
      if(b)b.setAttribute('fill', i<n ? 'var(--dom-network)' : 'var(--accent2)');
    }
    var x=14+n*18.5;
    var cut=document.getElementById('mask-cut');
    cut.setAttribute('x1',x-2); cut.setAttribute('x2',x-2);
    document.getElementById('mask-net').setAttribute('x', Math.max(46, (14+x)/2));
    document.getElementById('mask-host').setAttribute('x', Math.min(574, (x+606)/2));
    var r=subnetCidr(($('#sn-ip').value||'10.0.0.1'), n);
    document.getElementById('mask-cap').textContent=
      r ? r.mask+'  \u2014  '+r.usableHosts.toLocaleString()+' usable addresses' : '';
  }
  p.addEventListener('input',draw);
  var ip=document.getElementById('sn-ip'); if(ip)ip.addEventListener('input',draw);
  draw();
})();
`

  return shell({
    title: 'Show networks — QoS, subnetting and multicast | showstack',
    description: 'Why QoS protects the clock and not the bandwidth on an entertainment AV network, how to read and calculate a subnet mask bit by bit, and why multicast needs IGMP snooping and a querier. With an interactive subnet calculator.',
    canonical: `${SITE}/learn/network/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Show networks: QoS, subnetting and multicast',
      description: 'What QoS actually protects on a media network, how subnet masks work bit by bit, and why multicast floods without IGMP snooping.',
      url: `${SITE}/learn/network/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
