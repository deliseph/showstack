/**
 * /learn/encoding/ — how a one actually gets down a wire, and how the far end
 * knows it arrived.
 *
 * Two halves. The first is line coding: a receiver has no clock of its own,
 * so the waveform has to carry the timing as well as the data. That single
 * constraint explains Manchester, 8b/10b, and why DMX starts every packet
 * with a deliberate break.
 *
 * The second is verification: parity, checksum, CRC and forward error
 * correction are four different bargains between how much you spend and how
 * much you catch. And on top of that sits the layer-4 choice - TCP or UDP -
 * which is really a question about whether a retransmitted packet is worth
 * anything by the time it arrives. On a show it usually is not, which is why
 * almost every protocol in this index is UDP.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav } from './learn-kit.mjs'

export function learnEncodingPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* A read-head sweeping the waveform. The receiver is doing exactly this, and
   the point of a line code is whether it can stay in step while it does. */
@keyframes scan{0%{transform:translateX(0)}100%{transform:translateX(580px)}}
#lc-head{animation:scan 4s linear infinite}
@keyframes edgeglow{0%,100%{stroke-opacity:.25}50%{stroke-opacity:.75}}
#lc-grid line{animation:edgeglow 4s ease-in-out infinite}
/* TCP handshake and retransmit vs UDP fire-and-forget */
@keyframes go{0%{transform:translateX(0);opacity:0}8%{opacity:1}
70%{transform:translateX(var(--run,250px));opacity:1}82%,100%{opacity:0}}
@keyframes back{0%,34%{transform:translateX(var(--run,250px));opacity:0}42%{opacity:1}
88%{transform:translateX(0);opacity:1}96%,100%{opacity:0}}
@keyframes lost{0%{transform:translateX(0);opacity:0}8%{opacity:1}
40%{transform:translateX(120px);opacity:1}52%,100%{opacity:0;transform:translateX(120px)}}
.tcpfig .p{animation:go 3s linear infinite}
.tcpfig .p.d2{animation-delay:1s}
.tcpfig .ack{animation:back 3s linear infinite}
.udpfig .p{animation:go 1.6s linear infinite}
.udpfig .p.d2{animation-delay:.3s}
.udpfig .p.d3{animation-delay:.6s}
.udpfig .p.d4{animation-delay:.9s}
.udpfig .p.gone{animation:lost 1.6s linear infinite;animation-delay:.45s}
/* checksum: change one bit, the sum disagrees */
@keyframes flip{0%,44%{fill:var(--accent)}50%,88%{fill:var(--warn)}94%,100%{fill:var(--accent)}}
@keyframes alarm{0%,48%{opacity:0}54%,88%{opacity:1}94%,100%{opacity:0}}
.cksfig .bit{animation:flip 4s steps(1,end) infinite}
.cksfig .bad{animation:alarm 4s steps(1,end) infinite}
.cksfig .good{animation:alarm 4s steps(1,end) infinite;animation-direction:reverse}
/* the layer-4 table */
.l4{width:100%;border-collapse:collapse;font-size:14.2px;margin:16px 0}
.l4 th{text-align:left;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;
color:var(--dimmer);padding:0 12px 9px 0;border-bottom:1px solid var(--line);font-weight:400;white-space:nowrap}
.l4 td{padding:12px 12px 12px 0;border-bottom:1px solid var(--line);vertical-align:top;color:var(--dim);line-height:1.55}
.l4 td:first-child{color:var(--ink);font-family:var(--mono);font-size:12.5px;white-space:nowrap}
.l4wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.l4wrap .l4{min-width:640px}
/* the code viewer */
.codeview{margin:14px 0 0;padding:16px;background:var(--panel);border:1px solid var(--line);
border-radius:var(--r-md);overflow-x:auto;-webkit-overflow-scrolling:touch}
.codeview svg{display:block;min-width:560px;width:100%;height:auto}
`

  const tcpFig = `
<svg viewBox="0 0 400 150" role="img" class="tcpfig" style="--run:250px">
  <rect x="10" y="52" width="60" height="42" rx="6" fill="var(--panel)" stroke="var(--line)"/>
  <text x="40" y="77" class="lbl" font-size="9" text-anchor="middle">sender</text>
  <rect x="330" y="52" width="60" height="42" rx="6" fill="var(--panel)" stroke="var(--line)"/>
  <text x="360" y="77" class="lbl" font-size="9" text-anchor="middle">receiver</text>
  <line x1="74" y1="73" x2="326" y2="73" stroke="var(--line)" stroke-dasharray="3 5"/>
  <g class="p"><rect x="76" y="56" width="34" height="13" rx="3" fill="var(--accent)"/></g>
  <g class="p d2"><rect x="76" y="56" width="34" height="13" rx="3" fill="var(--accent)"/></g>
  <g class="ack"><rect x="76" y="78" width="30" height="13" rx="3" fill="var(--ok)"/>
    <text x="91" y="88" font-size="8" font-family="var(--mono)" fill="var(--bg)" text-anchor="middle">ack</text></g>
  <text x="200" y="126" class="lbl" font-size="9.5" text-anchor="middle">every segment acknowledged, anything missing re-sent</text>
  <text x="200" y="142" class="lbl" font-size="9.5" text-anchor="middle">nothing is lost, and nothing is on time</text>
</svg>`

  const udpFig = `
<svg viewBox="0 0 400 150" role="img" class="udpfig" style="--run:250px">
  <rect x="10" y="52" width="60" height="42" rx="6" fill="var(--panel)" stroke="var(--line)"/>
  <text x="40" y="77" class="lbl" font-size="9" text-anchor="middle">sender</text>
  <rect x="330" y="52" width="60" height="42" rx="6" fill="var(--panel)" stroke="var(--line)"/>
  <text x="360" y="77" class="lbl" font-size="9" text-anchor="middle">receiver</text>
  <line x1="74" y1="73" x2="326" y2="73" stroke="var(--line)" stroke-dasharray="3 5"/>
  ${['', 'd2', 'd3', 'd4'].map((c) => `<g class="p ${c}"><rect x="76" y="66" width="28" height="13" rx="3" fill="var(--accent2)"/></g>`).join('')}
  <g class="p gone"><rect x="76" y="66" width="28" height="13" rx="3" fill="var(--warn)"/></g>
  <text x="200" y="126" class="lbl" font-size="9.5" text-anchor="middle">sent and forgotten — the next one is already on its way</text>
  <text x="200" y="142" class="lbl" font-size="9.5" text-anchor="middle">which, for a stream of live values, is exactly the right answer</text>
</svg>`

  const cksFig = `
<svg viewBox="0 0 460 160" role="img" class="cksfig">
  <text x="24" y="20" class="lbl" font-size="9.5">the data</text>
  ${[...Array(12)].map((_, i) => `<rect ${i === 5 ? 'class="bit" ' : ''}x="${24 + i * 26}" y="30" width="20" height="24" rx="3" fill="${i === 5 ? 'var(--accent)' : 'var(--accent)'}" opacity="${i === 5 ? 1 : 0.5}"/>`).join('')}
  <text x="24" y="80" class="lbl" font-size="9.5">a number computed from all of it, and sent alongside</text>
  <rect x="24" y="90" width="98" height="26" rx="4" fill="var(--panel)" stroke="var(--accent2)"/>
  <text x="73" y="107" class="lbl" font-size="10" text-anchor="middle" fill="var(--accent2)">checksum</text>
  <path d="M130 103 L188 103" stroke="var(--dimmer)" stroke-width="1.2"/>
  <g class="good"><text x="196" y="108" class="val" font-size="11" fill="var(--ok)">recomputed → matches → keep it</text></g>
  <g class="bad"><text x="196" y="108" class="val" font-size="11" fill="var(--warn)">one bit changed → discard it</text></g>
  <text x="230" y="148" class="lbl" font-size="9.5" text-anchor="middle">it does not repair anything. It tells you not to trust what arrived.</text>
</svg>`

  const L = (a, b, c) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / encoding</div>
${learnNav(esc, 'encoding')}
<div class="lhero">
  <h2>How a one gets down a wire</h2>
  <p class="lede">A receiver has no clock of its own. It has a voltage that changes, and from that alone it has to work out where each bit begins, what each bit is, and whether any of it survived the journey. Everything on this page follows from that one problem.</p>
</div>

${S('The problem', 'A wire carries voltage, not bits', [
  'The obvious scheme is the naive one: high is a one, low is a zero. It is called <b>NRZ</b>, non-return-to-zero, and it fails for a reason that is easy to miss — send a long run of the same value and nothing on the wire changes for a long time. The receiver, which is timing itself from the transitions it sees, has nothing to time from and slowly drifts out of step. By the time the run ends it has miscounted.',
  'So a line code has two jobs at once: carry the data, <em>and</em> guarantee enough transitions that a receiver can keep its clock locked. Every scheme below is a different bargain about how much bandwidth to spend on that guarantee.',
])}

<div class="dial">
  <div class="d" style="flex:0 0 auto"><label>line code</label>
    <span class="seg" role="group" id="lc-seg">
      <button type="button" data-c="nrz" aria-pressed="true">NRZ</button>
      <button type="button" data-c="man" aria-pressed="false">Manchester</button>
      <button type="button" data-c="nrzi" aria-pressed="false">NRZI</button>
      <button type="button" data-c="rz" aria-pressed="false">Return to zero</button>
    </span>
  </div>
  <div class="d"><label for="lc-bits">the byte on the wire <b id="lc-bv">11010001</b></label>
    <input id="lc-bits" type="range" min="0" max="255" step="1" value="209"></div>
</div>
<div class="codeview">
  <svg viewBox="0 0 620 150" role="img" aria-label="The selected byte drawn in the selected line code">
    <g id="lc-grid"></g>
    <line id="lc-head" x1="20" y1="18" x2="20" y2="122" stroke="var(--accent2)" stroke-width="2" opacity=".8"/>
    <path id="lc-path" fill="none" stroke="var(--accent)" stroke-width="2.4"/>
    <g id="lc-labels"></g>
  </svg>
</div>
<div class="verdict" id="lc-out"></div>

${S('The famous one', 'Why Manchester puts a transition in every bit', [
  'Manchester coding takes the guarantee to its logical conclusion: <b>every single bit has a transition in the middle of it</b>. A one is a change one way, a zero is a change the other way. Which direction means which depends on the convention and both are in use, which has confused people since the 1970s.',
  'The receiver now cannot lose the clock, because there is an edge in the middle of every bit whatever the data does. That is a very strong guarantee, and it is bought with bandwidth: the signal changes twice as often as the data rate, so you need twice the bandwidth for the same throughput.',
  'It was the coding of original 10 Mbit/s Ethernet, and it lives on wherever a receiver has to lock on quickly with no separate clock line and bandwidth is cheap — RFID and contactless cards, some infrared remotes, DALI lighting control, and plenty of short-range radio links.',
  'The alternatives spend less. <b>4B/5B</b> and <b>8b/10b</b> map each group of data bits to a slightly longer group chosen so that long runs are impossible — 25% and 20% overhead respectively, rather than 100%. <b>64b/66b</b>, used at 10 Gbit/s and above, gets that overhead down to about 3% by scrambling instead of substituting.',
])}

${S('The one on a show', 'DMX has no line code at all — it has a break', [
  'DMX is asynchronous serial over <a href="/standards/tia-485/">RS-485</a>, and it solves the clock problem in the oldest way there is: both ends agree in advance on the bit rate — 250 kbit/s — and every byte carries its own start and stop bits so the receiver can re-synchronise at the start of each one.',
  'What marks the beginning of a whole packet is a deliberate violation. The line is held low for far longer than any legal byte could be — the <b>break</b> — followed by a <b>mark after break</b>, and then a start code. Nothing in normal data can look like that, which is exactly why it works as a frame marker.',
  'This is worth knowing because the failures follow from it directly. A break that is too short and a receiver misses the start of the packet. A source that sends packets slightly too fast and a fixture with a slow input drops frames. And the whole scheme has <b>no error checking whatsoever</b>: a corrupted DMX value is simply used. That is the deal — 44 packets a second, no verification, and the next packet along fixes it. See <a href="/learn/dmx/">DMX on the wire</a> for what happens electrically.',
])}

${S('Verification', 'Four bargains between cost and catching', [
  'Once bits arrive, something has to decide whether to believe them. There are four broad approaches and they are not interchangeable.',
])}

<div class="l4wrap">
<table class="l4">
  <thead><tr><th>Scheme</th><th>What it does</th><th>What it costs and catches</th></tr></thead>
  <tbody>
    ${L('Parity', 'One extra bit making the number of ones odd or even.', 'One bit of overhead. Catches any odd number of flipped bits and misses every even number. Cheap, weak, and still used inside serial links.')}
    ${L('Checksum', 'Add up the data and send the total. Recompute it at the far end and compare.', 'Cheap and easy, and blind to errors that cancel out — swap two bytes and the sum is identical. This is what UDP and IP headers use.')}
    ${L('CRC', 'Treat the data as a big polynomial, divide by a fixed one, send the remainder.', 'A little more arithmetic and vastly stronger: it catches all burst errors up to the length of the CRC and nearly everything else. This is what Ethernet puts on every frame.')}
    ${L('FEC', 'Send enough structured redundancy that the receiver can rebuild the missing parts.', 'Real bandwidth — but it repairs rather than reports. Reed–Solomon is the classic; it is why a QR code with a hole in it still scans, and why satellite links work at all.')}
  </tbody>
</table>
</div>

${fig(cksFig, 'A checksum does not repair. It tells you not to trust what arrived.')}

${rule('Detection tells you something is wrong. <b>Correction fixes it.</b> Which one you want depends entirely on whether asking again is an option — and on a live stream it is not.')}

${S('Layer four', 'TCP and UDP, and why show protocols choose UDP', [
  'IP gets a packet to an address. Layer 4 decides what happens when that goes wrong, and there are essentially two answers.',
  '<b>TCP</b> establishes a connection, numbers every byte, acknowledges what arrived, and retransmits what did not. Data comes out the far end complete and in order, guaranteed. The cost is time: a lost packet stalls everything behind it until the retransmission arrives, because TCP will not hand over byte 400 before byte 399. That is <em>head-of-line blocking</em>, and it is the right trade for a file and the wrong one for a stage.',
  '<b>UDP</b> sends a datagram and forgets it. No connection, no acknowledgement, no retransmission, no ordering. Packets can arrive late, out of order, twice, or never, and the application deals with it.',
  'That sounds worse and for live control it is much better, for one reason: <b>a retransmitted lighting level is worthless</b>. By the time it arrives, two newer values have already been sent. There is no point spending latency to recover data that is already obsolete. So <a href="/protocols/sacn/">sACN</a>, <a href="/protocols/art-net/">Art-Net</a>, <a href="/protocols/dante/">Dante</a>\'s audio, <a href="/protocols/ptp-1588/">PTP</a>, <a href="/protocols/osc/">OSC</a> and almost everything else in this index run over UDP and simply send the next value.',
  'TCP still shows up where completeness matters more than latency: configuration, file transfer, <a href="/protocols/rdm/">RDM</a>-over-IP style management, web interfaces, and anything you would rather have arrive late than wrong.',
])}

<div class="figrow">
  ${fig(tcpFig, 'TCP: acknowledged and retransmitted. Complete, and never quite now.')}
  ${fig(udpFig, 'UDP: sent and forgotten. One is lost and the next is already on its way.')}
</div>

${bites([
  '<b>UDP does not mean unreliable in practice.</b> On a properly designed switched network with headroom, loss is close to zero. UDP means <em>the protocol does not promise</em>, which is a different claim.',
  '<b>Multicast is UDP only.</b> There is no such thing as multicast TCP, because there is nobody to acknowledge. That is why <a href="/learn/network/">IGMP snooping</a> matters so much.',
  '<b>A TCP control channel on a show network is fine and can still bite.</b> A management session retransmitting hard can consume the same bandwidth your streams need.',
  '<b>Ethernet already CRCs every frame.</b> A corrupted frame is dropped by the switch before your protocol ever sees it — which means your protocol\'s losses are usually congestion, not corruption.',
])}

${S('Standing back', 'The same three questions, at every layer', [
  'Whether you are looking at a voltage on a wire, a byte in a serial frame, or a datagram on a network, the questions are identical.',
  '<b>How does the receiver know where this begins?</b> A transition, a start bit, a break, a header. <b>How does it know what it says?</b> A voltage level, a code group, a field layout. <b>How does it know it is true?</b> A parity bit, a checksum, a CRC, or nothing at all — and "nothing at all" is a legitimate answer when the next value is 23 milliseconds away.',
  'Every protocol in the <a href="/protocols/">index</a> is a set of answers to those three. Reading it that way makes an unfamiliar one much less unfamiliar.',
])}

<div class="cta"><strong>Want to see this on a real capture?</strong>
<p><a href="/software/wireshark/">Wireshark</a> will show you the layer-4 headers, the checksums and the retransmissions on any of the protocols above, and it is free. Point it at a show network with <a href="/protocols/sacn/">sACN</a> running and the theory stops being theory.</p></div>

<script>
(function(){
  var seg=document.getElementById('lc-seg'); if(!seg) return;
  var bits=document.getElementById('lc-bits'), bv=document.getElementById('lc-bv'),
      path=document.getElementById('lc-path'), grid=document.getElementById('lc-grid'),
      labels=document.getElementById('lc-labels'), out=document.getElementById('lc-out');
  var code='nrz';
  var NOTE={
    nrz:'<b>NRZ.</b> High is one, low is zero, and that is all. Cheapest possible, and a long run of identical bits gives the receiver nothing to keep its clock on. Watch the flat stretches — that is where a real receiver drifts.',
    man:'<b>Manchester.</b> A transition in the middle of every bit, no exceptions, so the clock can never be lost. It costs double the bandwidth for the same data rate, which is the price of that guarantee.',
    nrzi:'<b>NRZI.</b> A one is a <em>transition</em>, a zero is no transition. Removes the ambiguity about which level means what, and still stalls on a run of zeros — which is why it is normally paired with a scheme like 4B/5B that forbids long runs.',
    rz:'<b>Return to zero.</b> Every bit returns to the idle level part-way through, so there is always an edge. Simple and self-clocking, and it spends bandwidth even more freely than Manchester.'
  };
  var W=620,H=150,HI=34,LO=104,MID=69,N=8;
  function draw(){
    var v=Number(bits.value), b=v.toString(2).padStart(8,'0').split('').map(Number);
    bv.textContent=b.join('');
    var bw=(W-40)/N, x=20, d='', lvl=LO, last=1;
    function to(y,at){ if(y!==lvl){ d+='L'+at+' '+lvl+' L'+at+' '+y+' '; lvl=y; } }
    d='M20 '+lvl+' ';
    for(var i=0;i<N;i++){
      var x0=20+i*bw, x1=x0+bw, xm=x0+bw/2;
      if(code==='nrz'){ to(b[i]?HI:LO,x0); d+='L'+x1+' '+lvl+' '; }
      else if(code==='man'){ to(b[i]?LO:HI,x0); d+='L'+xm+' '+lvl+' '; to(b[i]?HI:LO,xm); d+='L'+x1+' '+lvl+' '; }
      else if(code==='nrzi'){ if(b[i]) last=(last===1?0:1); to(last?HI:LO,x0); d+='L'+x1+' '+lvl+' '; }
      else { to(b[i]?HI:LO,x0); d+='L'+xm+' '+lvl+' '; to(MID,xm); d+='L'+x1+' '+lvl+' '; }
    }
    path.setAttribute('d',d);
    var g='',l='';
    for(var i=0;i<=N;i++){ var gx=20+i*bw;
      g+='<line x1="'+gx+'" y1="20" x2="'+gx+'" y2="118" stroke="var(--line)" stroke-width=".7" stroke-dasharray="2 4"/>'; }
    for(var i=0;i<N;i++){
      l+='<text x="'+(20+i*bw+bw/2)+'" y="140" font-size="12" font-family="var(--mono)" text-anchor="middle" fill="var(--dimmer)">'+b[i]+'</text>'; }
    grid.innerHTML=g; labels.innerHTML=l;
    // longest run of identical bits - the thing that breaks a clock
    var run=1,best=1; for(var i=1;i<N;i++){ run = b[i]===b[i-1] ? run+1 : 1; if(run>best) best=run; }
    var risk = code==='man'||code==='rz' ? '<span class="ok">Clock is safe whatever the data does.</span>'
      : best>=4 ? '<span class="err">Longest run of identical bits: '+best+'.</span> This is where a receiver starts drifting.'
      : 'Longest run of identical bits: '+best+'. Short enough that a receiver stays locked.';
    out.innerHTML=NOTE[code]+' '+risk;
  }
  seg.addEventListener('click',function(e){var b=e.target.closest('button'); if(!b)return;
    code=b.dataset.c; for(var x of seg.querySelectorAll('button')) x.setAttribute('aria-pressed',String(x.dataset.c===code)); draw();});
  bits.addEventListener('input',draw); draw();
})();
</script>
`

  return shell({
    title: 'How a one gets down a wire — line codes, checksums, TCP and UDP | showstack',
    description: 'Why NRZ loses its clock and Manchester cannot, what 8b/10b buys, how DMX uses a break instead of a line code, the difference between parity, checksum, CRC and forward error correction, and why almost every show protocol chooses UDP over TCP.',
    canonical: `${SITE}/learn/encoding/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Line coding, error detection and the layer-4 choice',
      description: 'NRZ, Manchester, NRZI and block codes; DMX framing; parity, checksums, CRC and FEC; and why live control protocols run over UDP.',
      url: `${SITE}/learn/encoding/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
