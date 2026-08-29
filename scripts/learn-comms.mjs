/**
 * /learn/comms/ — intercom, talkback and why a radio is not an intercom.
 *
 * Comms is the one system on a show where every department has to hear every
 * other department, live, hands-free, with no opportunity to say "sorry, say
 * again". That makes it the system where latency is felt most directly by a
 * human being rather than measured on an analyser: past roughly 40 ms of
 * round trip, people start talking over each other, because conversational
 * turn-taking is a reflex with its own timing.
 *
 * So the interactive here is a latency dial, and it drives a picture of two
 * people's speech colliding. That is the number doing the arguing.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

export function learnCommsPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* partyline: everybody's audio summed onto one pair */
@keyframes pl-in{0%{opacity:0;transform:translateY(0)}14%{opacity:1}
60%{opacity:1;transform:translateY(var(--dy,38px))}72%,100%{opacity:0;transform:translateY(var(--dy,38px))}}
.plfig .drop{animation:pl-in 2.6s ease-in infinite}
.plfig .drop.p2{animation-delay:.55s}
.plfig .drop.p3{animation-delay:1.1s}
.plfig .drop.p4{animation-delay:1.65s}
@keyframes bus-hum{0%,100%{stroke-opacity:.45}50%{stroke-opacity:1}}
.plfig .bus{animation:bus-hum 2.6s ease-in-out infinite}
/* matrix: one source routed to chosen destinations only */
@keyframes mx-go{0%{stroke-dashoffset:120;opacity:0}12%{opacity:1}
70%{stroke-dashoffset:0;opacity:1}86%,100%{opacity:0;stroke-dashoffset:0}}
.mxfig .route{stroke-dasharray:120;animation:mx-go 2.6s ease-out infinite}
.mxfig .route.r2{animation-delay:.25s}
.mxfig .route.r3{animation-delay:.5s}
/* push to talk: the button, the gap, the reply */
@keyframes ptt-a{0%,4%{opacity:.25}8%,42%{opacity:1}46%,100%{opacity:.25}}
@keyframes ptt-b{0%,52%{opacity:.25}56%,92%{opacity:1}96%,100%{opacity:.25}}
@keyframes ptt-dead{0%,42%{opacity:0}48%,52%{opacity:1}58%,100%{opacity:0}}
.pttfig .a{animation:ptt-a 4s steps(1,end) infinite}
.pttfig .b{animation:ptt-b 4s steps(1,end) infinite}
.pttfig .dead{animation:ptt-dead 4s steps(1,end) infinite}
/* the latency dial's picture */
.talk{position:relative;height:104px;border:1px solid var(--line);border-radius:var(--r-md);
background:var(--panel);overflow:hidden;margin-top:14px}
.talk .lane{position:absolute;left:0;right:0;height:30px;border-radius:5px}
.talk .who{position:absolute;left:9px;font-family:var(--mono);font-size:10px;
text-transform:uppercase;letter-spacing:.5px;color:var(--dimmer)}
.talk .blk{position:absolute;height:26px;border-radius:4px;top:2px;transition:left .12s,width .12s,background .12s}
.talk .lane.a{top:14px}
.talk .lane.b{top:58px}
.talk .ov{position:absolute;top:14px;height:70px;background:color-mix(in srgb,var(--warn) 26%,transparent);
border-left:1px solid var(--warn);border-right:1px solid var(--warn);transition:left .12s,width .12s}
/* the system comparison */
.sys{width:100%;border-collapse:collapse;font-size:14.2px;margin:16px 0}
.sys th{text-align:left;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;
color:var(--dimmer);padding:0 12px 9px 0;border-bottom:1px solid var(--line);font-weight:400;white-space:nowrap}
.sys td{padding:12px 12px 12px 0;border-bottom:1px solid var(--line);vertical-align:top;color:var(--dim);
line-height:1.55}
.sys td:first-child{color:var(--ink);white-space:nowrap}
.sys td:nth-child(2){font-family:var(--mono);font-size:12px;color:var(--accent2);white-space:nowrap}
.syswrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.syswrap .sys{min-width:620px}
`

  const plFig = `
<svg viewBox="0 0 460 168" role="img" class="plfig">
  ${[0, 1, 2, 3].map((i) => {
    const x = 42 + i * 106
    return `<g class="drop${i ? ` p${i + 1}` : ''}" style="--dy:38px">
      <rect x="${x - 13}" y="30" width="26" height="12" rx="3" fill="var(--accent2)"/></g>
    <rect x="${x - 28}" y="12" width="56" height="24" rx="5" fill="var(--panel)" stroke="var(--line)"/>
    <text x="${x}" y="28" class="lbl" font-size="8.5" text-anchor="middle">pack ${i + 1}</text>
    <line x1="${x}" y1="36" x2="${x}" y2="92" stroke="var(--line)" stroke-width="1"/>`
  }).join('')}
  <line class="bus" x1="20" y1="94" x2="440" y2="94" stroke="var(--accent)" stroke-width="3"/>
  <text x="230" y="118" class="lbl" font-size="9.5" text-anchor="middle">one balanced pair, carrying power and everybody at once</text>
  <text x="230" y="140" class="lbl" font-size="9.5" text-anchor="middle">nothing is routed — the sum is the signal, and so is the noise</text>
</svg>`

  const mxFig = `
<svg viewBox="0 0 460 168" role="img" class="mxfig">
  <rect x="186" y="58" width="88" height="52" rx="8" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.6"/>
  <text x="230" y="88" class="val" font-size="11" text-anchor="middle" fill="var(--accent)">MATRIX</text>
  <rect x="14" y="66" width="60" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/>
  <text x="44" y="88" class="lbl" font-size="9" text-anchor="middle">stage mgr</text>
  <path class="route" d="M78 84 L182 84" stroke="var(--accent)" stroke-width="2" fill="none"/>
  ${[['lighting', 16], ['sound', 68], ['flys', 120]].map(([n, y], i) => `
  <rect x="386" y="${y}" width="60" height="34" rx="5" fill="var(--panel)" stroke="var(--line)"/>
  <text x="416" y="${y + 21}" class="lbl" font-size="9" text-anchor="middle">${n}</text>
  <path class="route${i ? ` r${i + 1}` : ''}" d="M278 84 L340 84 L340 ${y + 17} L382 ${y + 17}"
    stroke="${i === 2 ? 'var(--line)' : 'var(--accent)'}" stroke-width="${i === 2 ? 1.2 : 2}" fill="none"
    ${i === 2 ? 'opacity=".35"' : ''}/>`).join('')}
  <text x="230" y="152" class="lbl" font-size="9.5" text-anchor="middle">each panel gets only the keys it needs — flys is not on this call</text>
</svg>`

  const pttFig = `
<svg viewBox="0 0 460 150" role="img" class="pttfig">
  <text x="20" y="18" class="lbl" font-size="9.5">half duplex — the channel belongs to one person at a time</text>
  <g class="a"><rect x="24" y="34" width="150" height="26" rx="4" fill="var(--accent)"/>
    <text x="99" y="52" font-size="9" font-family="var(--mono)" fill="var(--bg)" text-anchor="middle">you, holding the button</text></g>
  <g class="dead"><rect x="178" y="34" width="34" height="26" rx="4" fill="var(--warn)" opacity=".55"/>
    <text x="195" y="76" class="lbl" font-size="8.5" text-anchor="middle" fill="var(--warn)">dead air</text></g>
  <g class="b"><rect x="216" y="34" width="150" height="26" rx="4" fill="var(--accent2)"/>
    <text x="291" y="52" font-size="9" font-family="var(--mono)" fill="var(--bg)" text-anchor="middle">them, after you let go</text></g>
  <line x1="20" y1="96" x2="440" y2="96" stroke="var(--line)"/>
  <text x="230" y="120" class="lbl" font-size="9.5" text-anchor="middle">you cannot hear the answer while you are still asking</text>
  <text x="230" y="138" class="lbl" font-size="9.5" text-anchor="middle">which is exactly what calling a show requires</text>
</svg>`

  const R = (a, b, c, d) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td><td>${d}</td></tr>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / comms</div>
${learnNav(esc, 'comms')}
<div class="lhero">
  <h2>Getting the crew to hear each other</h2>
  <p class="lede">Comms is the only system on a show where every department has to hear every other department, live, hands-free, and without ever getting to say "sorry, say again". That makes it the one place where latency stops being a number on an analyser and becomes something a person can feel.</p>
</div>

${S('The shape of it', 'Four ways to build a talkback system', [
  'They are not competing products so much as four different answers to "who hears whom", and most real shows use two or three of them at once with interfaces in between.',
])}

<div class="syswrap">
<table class="sys">
  <thead><tr><th>System</th><th>Duplex</th><th>How it works</th><th>What it costs you</th></tr></thead>
  <tbody>
    ${R('Partyline (2-wire)', 'full', 'One balanced pair carries DC power and audio to every beltpack on the line. Everyone hears everyone, all the time, summed together. <a href="/hardware/green-go-beltpack/">Green-GO</a> is the networked equivalent.', 'No routing at all, and noise adds with every pack. Clear-Com and RTS use different conventions and do not simply interconnect.')}
    ${R('4-wire', 'full', 'Separate send and return pairs, so a circuit is genuinely point to point rather than a shared bus.', 'More cable and no inherent "everyone hears everyone". It is a building block, not a system.')}
    ${R('Matrix', 'full', 'A central router — an <a href="/hardware/rts-adam/">RTS ADAM</a> or equivalent. Every panel gets its own configurable set of keys, so the stage manager hears the departments they need and nothing else.', 'It has to be programmed, and the programming is a design job with opinions in it.')}
    ${R('Wireless beltpack', 'full', '<a href="/protocols/dect/">DECT</a> at 1.9 GHz is the modern default — <a href="/hardware/clear-com-freespeak-ii/">FreeSpeak II</a>, <a href="/hardware/riedel-bolero/">Bolero</a>. Older systems sit in UHF or fight for 2.4 GHz.', 'Antenna coverage is a survey problem, and every wireless link adds latency the wired system did not have.')}
    ${R('Two-way radio', 'half', 'One channel, one person at a time, push to talk. Cheap, instantly deployable, and everybody already knows how to use one.', 'Half duplex, hands occupied, and no simultaneity. This is not an intercom and it does not become one.')}
  </tbody>
</table>
</div>

<div class="figrow">
  ${fig(plFig, 'Partyline: one pair, everybody summed. Simple, and the noise sums too.')}
  ${fig(mxFig, 'Matrix: routed. Each position hears what it was given, and nothing else.')}
</div>

${rule('Partyline is <b>a bus</b> and matrix is <b>a router</b>. Everything else about the two — cost, scale, how long the prep takes, how bad it gets with forty packs — follows from that one difference.')}

${S('The thing people get wrong', 'A walkie-talkie is not an intercom', [
  'Radios are excellent and every show has them. They are also half duplex, and half duplex is a different kind of conversation from the one a show runs on.',
  'Calling a sequence means speaking and listening at the same time — hearing the flyman acknowledge while you are still on the second half of the standby, hearing a "hold" cut across you the instant it needs to. On a radio you cannot hear anything while you are transmitting, so a hold arrives after you have already said "go".',
  'The other half is your hands. A beltpack with a headset leaves both hands free and the channel permanently open. A radio takes one hand and a deliberate act, every single time.',
  'Use radios for the things they are good at: crew spread over a site, security, load-in traffic, anything where the conversation is occasional and the geography is large. Do not run the show on one.',
])}

${fig(pttFig, 'Push to talk: the channel belongs to one person, and the reply cannot arrive early.')}

${S('The number that decides how it feels', 'Latency, and conversational turn-taking', [
  'Human conversation is timed far more precisely than it feels. Turn-taking in ordinary speech has gaps measured in a couple of hundred milliseconds, and people begin planning their reply <em>while the other person is still speaking</em>. That is a reflex, and it does not adapt to a system that is late.',
  'An analogue partyline is effectively instantaneous. A digital matrix adds a few milliseconds. Audio over a network — <a href="/protocols/dante/">Dante</a> or <a href="/protocols/aes67/">AES67</a> — adds its packet time and buffer. A wireless beltpack adds its own coding delay, and a system that goes wireless to a bridge to a network to another wireless system adds all of them together.',
  'Once the round trip gets long enough, something specific happens: two people start a sentence at the same moment, both stop, both restart. It is not that the audio is bad. It is that the timing cue everyone relies on has been moved.',
  'Drag the dial and watch what the same two people do to each other.',
])}

<div class="dial">
  <div class="d"><label for="cm-lat">round-trip latency <b id="cm-latv">10 ms</b></label>
    <input id="cm-lat" type="range" min="0" max="400" step="5" value="10"></div>
  <div class="d"><label for="cm-hops">links in the chain <b id="cm-hopsv">1</b></label>
    <input id="cm-hops" type="range" min="1" max="5" step="1" value="1"></div>
</div>
<div class="talk" id="cm-talk" aria-hidden="true">
  <span class="who" style="top:2px">stage manager</span>
  <span class="who" style="top:46px">flys</span>
  <div class="lane a"><div class="blk" id="cm-a"></div></div>
  <div class="lane b"><div class="blk" id="cm-b"></div></div>
  <div class="ov" id="cm-ov" hidden></div>
</div>
<div class="verdict" id="cm-out"></div>

${bites([
  '<b>Every interface is a latency budget you did not write down.</b> Wireless to bridge to network to matrix to another wireless system is four delays in series, and nobody owns the total.',
  '<b>Analogue partyline and digital packs on the same show do not agree about time.</b> One is instant, the other is not, and the person hearing both hears an echo of themselves.',
  '<b>VOX has no place on a live channel.</b> Voice-activated open mics put a coughing electrician on the stage manager\'s call. Latching or momentary, never automatic.',
  '<b>Sidetone is not a luxury.</b> If a user cannot hear their own voice in the headset they will shout, and everybody else will turn down.',
  '<b>Clear-Com and RTS partyline are not the same standard.</b> They can be interfaced, and they cannot simply be plugged together.',
])}

${S('The other pieces', 'IFB, program, and who should hear what', [
  '<b>IFB — interruptible foldback</b> — is the talent\'s ear: normally carrying programme sound or a music mix, and interruptible by a director or stage manager who needs to say something over it. It is a different job from crew comms and it is worth keeping it a different system.',
  '<b>Programme feed</b> is the show itself in a corner of the crew\'s ear, and it is what lets a follow-spot operator or a flyman work to what they can actually hear rather than only to a call.',
  '<b>Listen-only positions</b> — bars, box office, front of house staff — need to hear the call and must not be able to join it. That is a routing decision on a matrix and a hardware decision on a partyline.',
  'The design question underneath all of it is the same: <em>the stage manager should never have to hear a conversation that is not theirs.</em> Every channel, key and interface exists to protect that.',
])}

${S('Licensing', 'The question that surfaces when a show travels', [
  'Wired comms is a cable and nobody\'s business but yours. Everything wireless sits in spectrum, and spectrum is national.',
  'Licence-exempt bands exist for radios — PMR446 in Europe, FRS in the United States, and the equivalent low-power allocations elsewhere — and they come with power limits and no protection from anybody else using them. Licensed channels cost money and give you a channel that is meant to be yours.',
  '<a href="/protocols/dect/">DECT</a>-based intercom sits in a band reserved for it in many jurisdictions, which is a large part of why it became the default: it is not competing with the venue\'s Wi-Fi.',
  'The rule for a touring show is unglamorous. Check the band before the freight leaves, not on arrival, and treat every country as a separate answer. The <a href="/rf/">frequency map</a> is the starting point for the ones this site covers.',
])}

${xnote('Comms never reaches the audience directly and shapes everything they see. A crew talking over each other calls cues late, hedges, and stops using the channel — so the show gets more cautious. <b>Latency in comms shows up on stage as timidity</b>, which is not a fault anybody thinks to look for.')}

${rule('Comms is judged by a person mid-sentence, not by a spec sheet. <b>Total round trip and who hears whom</b> are the only two numbers that decide whether it feels right.')}

<div class="cta"><strong>Comms practice varies more by market than almost anything else here.</strong>
<p>Naming, channel conventions and who calls what differ between theatre, broadcast, arena touring and film. If your region works differently, <a href="${GH}/issues/new?labels=tooling&amp;title=comms%3A+">open an issue</a> — that variation is the sort of thing worth recording rather than flattening.</p></div>

<script>
(function(){
  var lat=document.getElementById('cm-lat'), hops=document.getElementById('cm-hops'),
      latv=document.getElementById('cm-latv'), hopsv=document.getElementById('cm-hopsv'),
      A=document.getElementById('cm-a'), B=document.getElementById('cm-b'),
      OV=document.getElementById('cm-ov'), out=document.getElementById('cm-out');
  if(!lat) return;
  var SPAN=900; // ms of timeline shown across the box
  function pct(ms){ return (ms/SPAN)*100; }
  function draw(){
    var one=Number(lat.value), n=Number(hops.value), total=one*n;
    latv.textContent=one+' ms'; hopsv.textContent=n;
    // The stage manager speaks for 400 ms. The reply is planned to land in the
    // natural 200 ms gap, then is pushed later by the whole round trip.
    var aStart=40, aLen=400, gap=200;
    var bStart=aStart+aLen+gap-total;
    A.style.left=pct(aStart)+'%'; A.style.width=pct(aLen)+'%'; A.style.background='var(--accent)';
    B.style.left=pct(Math.max(0,bStart))+'%'; B.style.width=pct(360)+'%';
    var collide = bStart < aStart+aLen;
    B.style.background = collide ? 'var(--warn)' : 'var(--accent2)';
    if(collide){
      OV.hidden=false;
      OV.style.left=pct(Math.max(aStart,bStart))+'%';
      OV.style.width=pct(Math.min(aStart+aLen, bStart+360)-Math.max(aStart,bStart))+'%';
    } else OV.hidden=true;
    var msg;
    if(total<=20) msg='<span class="ok">Transparent.</span> Inside the noise floor of ordinary conversation — nobody notices the system is there.';
    else if(total<=60) msg='<span class="ok">Usable.</span> Detectable if you are listening for it, and turn-taking still works.';
    else if(total<=120) msg='Awkward. The gap before a reply has stretched, and people begin leaving longer pauses to compensate — which slows every call.';
    else if(total<=250) msg='<span class="err">Talking over each other.</span> The reply now lands inside the previous sentence. This is the point where a crew starts saying "sorry — go ahead".';
    else msg='<span class="err">Unworkable for calling a show.</span> At this delay a hold arrives after the go it was meant to stop.';
    out.innerHTML='Total round trip <b>'+total+' ms</b> across '+n+' link'+(n>1?'s':'')+'. '+msg;
  }
  lat.addEventListener('input',draw); hops.addEventListener('input',draw); draw();
})();
</script>
`

  return shell({
    title: 'Getting the crew to hear each other — intercom, partyline and radios | showstack',
    description: 'Partyline, 4-wire, matrix, wireless beltpacks and two-way radios; why a walkie-talkie is half duplex and never becomes an intercom; what round-trip latency does to conversational turn-taking; IFB and programme feeds; and the licensing question that surfaces when a show travels.',
    canonical: `${SITE}/learn/comms/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Intercom and talkback for live production',
      description: 'Partyline versus matrix, wireless intercom, half-duplex radios, latency and conversational turn-taking, IFB and programme feeds, and wireless licensing.',
      url: `${SITE}/learn/comms/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
