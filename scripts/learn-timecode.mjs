/**
 * /learn/timecode/ — what is actually inside a timecode frame, and how to
 * read MIDI as hex.
 *
 * The site has a timecode converter, a pyro cue calculator and a clock drift
 * tool, and four protocol entries for LTC, MTC, MIDI and MSC — and nothing
 * anywhere that says what the bits are. That is the wrong way round for a
 * site whose whole pitch is the mechanism rather than the lookup.
 *
 * Four things this page is for.
 *
 * An LTC frame is 80 bits and only 26 of them are the time, stored as BCD
 * with a fixed 16-bit sync word whose twelve consecutive ones cannot occur
 * anywhere else — which is how a reader finds the frame boundary and, because
 * the word is not a palindrome, which direction the tape is moving.
 *
 * MTC sends the same value four bits at a time over a 31 250 baud wire, so it
 * takes two frames to arrive and every MTC reader is two frames behind.
 *
 * Drop frame does not drop frames. It drops frame NUMBERS, 108 an hour, which
 * is exactly the drift between 30 and 29.97.
 *
 * And MIDI's entire framing rule is one bit: status bytes have the top bit
 * set, data bytes do not.
 */
import { ltcFrame, LTC_SYNC_WORD, mtcQuarterFrames, MTC_RATES, tcToFrames, framesToTc } from './toolmath.mjs'
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

const MATH_SRC = [ltcFrame, mtcQuarterFrames, tcToFrames, framesToTc].map((f) => f.toString()).join('\n\n')
const MATH_TABLES = `const LTC_SYNC_WORD = ${JSON.stringify(LTC_SYNC_WORD)};
const MTC_RATES = ${JSON.stringify(MTC_RATES)};`

export function learnTimecodePage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* The 80-bit frame, drawn as 80 cells that recolour by field. Small enough
   to fit a phone, so the cells are CSS grid rather than SVG. */
.bitgrid{display:grid;grid-template-columns:repeat(20,1fr);gap:2px;margin:14px 0 6px;font-variant-numeric:tabular-nums}
.bit{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-family:var(--mono);
font-size:9px;border-radius:2px;color:var(--surface);background:var(--rule-strong);line-height:1}
.bit[data-k="time"]{background:var(--signal);color:#fff}
.bit[data-k="user"]{background:var(--rule)}
.bit[data-k="flag"]{background:var(--accent2)}
.bit[data-k="sync"]{background:var(--verified);color:#fff}
.bitkey{display:flex;flex-wrap:wrap;gap:14px;margin:6px 0 0;font-family:var(--mono);font-size:11px;color:var(--ink-faint)}
.bitkey span{display:inline-flex;align-items:center;gap:6px}
.bitkey i{width:11px;height:11px;border-radius:2px;display:inline-block}
/* Biphase mark: a transition every bit boundary, and one extra mid-bit for a
   one. Drawn as a stepped path so the rule is visible rather than described. */
@keyframes bp-run{to{stroke-dashoffset:-40}}
.bpfig .clockline{stroke-dasharray:3 5;animation:bp-run 2.2s linear infinite}
.qftable{width:100%;border-collapse:collapse;font-size:13.5px;margin:12px 0}
.qftable th{text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;
color:var(--ink-faint);padding:0 10px 8px 0;border-bottom:1px solid var(--rule);font-weight:400}
.qftable td{padding:9px 10px 9px 0;border-bottom:1px solid var(--rule);color:var(--ink-muted);vertical-align:top}
.qftable td:first-child,.qftable td:nth-child(2){font-family:var(--mono);color:var(--ink);white-space:nowrap}
.hexkey{width:100%;border-collapse:collapse;font-size:13.5px;margin:12px 0}
.hexkey th{text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;
color:var(--ink-faint);padding:0 10px 8px 0;border-bottom:1px solid var(--rule);font-weight:400}
.hexkey td{padding:8px 10px 8px 0;border-bottom:1px solid var(--rule);color:var(--ink-muted);line-height:1.5}
.hexkey td:first-child{font-family:var(--mono);color:var(--ink);white-space:nowrap;font-size:13px}
.tblscroll{overflow-x:auto;margin:14px 0}
.mono{font-family:var(--mono)}
`

  const biphaseFig = `
<svg viewBox="0 0 620 200" role="img" class="bpfig">
  <text x="40" y="28" class="lbl">bit value</text>
  <text x="118" y="28" class="val">1</text>
  <text x="188" y="28" class="val">0</text>
  <text x="258" y="28" class="val">1</text>
  <text x="328" y="28" class="val">1</text>
  <text x="398" y="28" class="val">0</text>
  <text x="468" y="28" class="val">0</text>
  <path d="M84 96 L118 96 L118 56 L154 56 L154 96 L224 96 L224 56 L258 56 L258 96 L294 96 L294 56 L328 56 L328 96 L364 96 L364 56 L434 56 L434 96 L504 96"
        fill="none" stroke="var(--signal)" stroke-width="2.5"/>
  <g stroke="var(--rule-strong)" stroke-width="1" stroke-dasharray="3 4">
    <line x1="84" y1="44" x2="84" y2="140"/><line x1="154" y1="44" x2="154" y2="140"/>
    <line x1="224" y1="44" x2="224" y2="140"/><line x1="294" y1="44" x2="294" y2="140"/>
    <line x1="364" y1="44" x2="364" y2="140"/><line x1="434" y1="44" x2="434" y2="140"/>
    <line x1="504" y1="44" x2="504" y2="140"/>
  </g>
  <line class="clockline" x1="84" y1="140" x2="504" y2="140" stroke="var(--accent2)" stroke-width="1.5"/>
  <text x="512" y="144" class="lbl" style="fill:var(--accent2)">bit boundaries</text>
  <text x="40" y="170" class="lbl">A transition at every boundary is the clock. An extra transition in the middle means one.</text>
  <text x="40" y="188" class="lbl">No DC, no separate clock, and inverting the whole signal changes nothing &mdash; which is why it survives an audio track.</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / timecode</div>
${learnNav(esc, 'timecode')}
<h2>What is actually in a timecode frame</h2>
<p class="lede">LTC and MTC both carry hours, minutes, seconds and frames, and they carry them completely differently &mdash; one as an audio waveform, one as four bits at a time down a slow serial wire. Here is what the bits are, why drop frame drops nothing, and how to read a MIDI stream in hex.</p>

${S('LTC', 'Eighty bits, of which twenty-six are the time',
  ['Linear timecode is exactly 80 bits per frame, repeated every frame forever. At 30 fps that is 2400 bits per second, which is the whole design constraint: it has to fit down an analogue audio track, so it has to sound like audio and survive everything that happens to audio.',
   'Of those 80 bits, 26 are the time. The rest is 32 user bits &mdash; free space, often carrying a date or a reel number and very often carrying nothing &mdash; six flag bits, and a 16-bit sync word. Two of the flags are named and useful: bit 10 says whether this is drop frame, bit 11 is the colour frame flag. The other four carry binary group flags and a polarity correction bit whose assignment differs between 25 and 30 frame systems and between revisions of SMPTE 12M, so they are left unlabelled here rather than asserted.',
   'The time is stored as <strong>BCD</strong>: binary-coded decimal, each decimal digit in its own little field, least significant bit first. That is why the field widths look arbitrary until you think about what each digit has to count to. Frame tens only ever reaches 2, so it gets two bits. Second tens reaches 5, so it gets three. Hour tens reaches 2, so two bits again. And it is why you can read the digits straight out of a bit dump without dividing anything.'])}

<div class="tryit">
  <div class="f"><label for="lt-h">Hours <span id="lt-hv">10</span></label><input id="lt-h" type="range" min="0" max="23" value="10"></div>
  <div class="f"><label for="lt-m">Minutes <span id="lt-mv">30</span></label><input id="lt-m" type="range" min="0" max="59" value="30"></div>
  <div class="f"><label for="lt-s">Seconds <span id="lt-sv">45</span></label><input id="lt-s" type="range" min="0" max="59" value="45"></div>
  <div class="f"><label for="lt-f">Frames <span id="lt-fv">12</span></label><input id="lt-f" type="range" min="0" max="29" value="12"></div>
</div>
<div class="bitgrid" id="lt-bits" aria-hidden="true"></div>
<div class="bitkey">
  <span><i style="background:var(--signal)"></i>time (26 bits)</span>
  <span><i style="background:var(--rule)"></i>user bits (32)</span>
  <span><i style="background:var(--accent2)"></i>flags (6)</span>
  <span><i style="background:var(--verified)"></i>sync word (16)</span>
</div>
<div class="readout" id="lt-out" role="status" aria-live="polite"></div>

${rule('The sync word is <b class="mono">0011111111111101</b>, and its twelve consecutive ones cannot occur anywhere else in the frame. That is how a reader finds the frame boundary &mdash; and because the word is not a palindrome, whether it arrives forwards or backwards also tells the reader <b>which way the tape is moving</b>.')}

${S('Why it sounds like that', 'Biphase mark, and reading tape backwards',
  ['LTC is encoded biphase mark, which is the reason a timecode track sounds like an angry fax machine and the reason it works at all.',
   'The rule is two lines long. There is a transition at every bit boundary, always. A <em>one</em> gets one extra transition in the middle of the bit; a <em>zero</em> does not. Everything useful follows: the guaranteed boundary transition is a clock, so no separate clock line is needed. There is no DC component, so it passes through the transformers and capacitors in an audio path. Inverting the whole signal changes nothing, so a swapped pair does not matter. And a one is always twice the frequency of a zero, so the decoder works over a wide range of speeds &mdash; which is what lets an editor read timecode while shuttling at a third of play speed, or backwards.',
   'This is the same family of ideas as every other self-clocking line code. <a href="/learn/encoding/">How a one gets down a wire</a> has the wider set; LTC is the one that had to survive being recorded on quarter-inch tape.'])}

${fig(biphaseFig, 'Biphase mark. Every boundary has a transition; a one has one more in the middle.')}

${S('MTC', 'The same time, four bits at a time',
  ['MIDI runs at 31 250 baud, which by modern standards is nothing. Sending a whole timecode value every frame as a system exclusive message would eat a significant slice of the wire, so MTC does something else: it sends <strong>quarter-frame</strong> messages, two bytes each, four times per frame.',
   'Each quarter frame is <span class="mono">F1</span> followed by one byte packing a piece index and four bits of data: <span class="mono">0nnn&nbsp;dddd</span>. Eight pieces make one complete timecode value, and eight pieces at four per frame takes <strong>two frames</strong>.',
   'That is the fact everybody trips over, and it is arithmetic rather than folklore: a running MTC receiver is always two frames behind the transmitter, because the value only completes two frames after it started arriving. A receiver that does not add the offset back is quietly two frames out on every cue, which at 25 fps is 80 milliseconds &mdash; well inside the range where an audience notices a light that is late for a hit.',
   'It is also why MTC has a separate full-frame message, a system exclusive carrying the whole value at once, used for locating while the transport is stopped. Nothing is running, so there is nothing to be two frames behind of.'])}

<div class="tryit">
  <div class="f"><label for="mt-h">Hours <span id="mt-hv">1</span></label><input id="mt-h" type="range" min="0" max="23" value="1"></div>
  <div class="f"><label for="mt-m">Minutes <span id="mt-mv">2</span></label><input id="mt-m" type="range" min="0" max="59" value="2"></div>
  <div class="f"><label for="mt-s">Seconds <span id="mt-sv">3</span></label><input id="mt-s" type="range" min="0" max="59" value="3"></div>
  <div class="f"><label for="mt-f">Frames <span id="mt-fv">4</span></label><input id="mt-f" type="range" min="0" max="29" value="4"></div>
  <div class="f"><label for="mt-r">Rate</label><select id="mt-r">
    <option value="24">24</option><option value="25" selected>25</option>
    <option value="29.97df">29.97 drop</option><option value="30">30</option>
  </select></div>
</div>
<div class="tblscroll"><table class="qftable" id="mt-table"></table></div>
<div class="readout" id="mt-out" role="status" aria-live="polite"></div>

${bites([
  '<b>Not compensating the two frames.</b> Every MTC receiver is two frames behind. If your cues land late by exactly two frames, this is why, and the fix is an offset, not a nudge.',
  '<b>Expecting the rate immediately.</b> The frame rate rides in piece 7, the last one. A receiver does not know what rate it is being sent until a whole sequence has arrived.',
  '<b>Using MTC to locate.</b> Quarter frames only make sense running. Locating while stopped is what the full-frame message is for.',
  '<b>Running MTC down a busy MIDI cable.</b> Four messages a frame is eight bytes a frame, every frame, forever &mdash; on a wire that carries about 3125 bytes a second in total. Give it its own port.',
])}

${S('Drop frame', 'It drops numbers, not frames',
  ['This is the most misunderstood thing in the whole subject, and the name is entirely to blame. <strong>Drop frame drops no frames.</strong> Every frame that was shot is still there. What gets dropped is <em>labels</em>.',
   'The problem it solves: NTSC colour does not run at 30 frames per second, it runs at 30000/1001, which is 29.97. Timecode counts in whole frames, so if you count 30 frames to the second, your counter runs slightly fast compared with the clock on the wall. Over an hour it gains about 108 frames &mdash; 3.6 seconds. For a broadcaster billing by the second, that is intolerable.',
   'So drop-frame timecode skips two frame <em>numbers</em>, 00 and 01, at the start of every minute, except every tenth minute. There are 60 minutes in an hour and six of them are tenth minutes, so 54 minutes lose two numbers each: 54 &times; 2 = <strong>108</strong>. Which is the drift, near enough &mdash; the true figure is 107.89, so the correction itself is slightly over and drop frame gains about a frame every ten hours. Nobody cares at show length, and the picture is untouched either way: nothing was dropped, the numbering just skips.',
   'Which means <span class="mono">00:01:00:00</span> and <span class="mono">00:01:00:01</span> are not timecodes at all in drop frame. They do not exist. A system that lets you type one is not validating, and a system that reports one is lying.'])}

${rule('Non-drop counts <b>every frame</b> and does not match the clock. Drop frame <b>matches the clock</b> and skips numbers. Neither loses a single frame of picture.')}

<div class="tryit">
  <div class="f"><label for="df-h">Hours into the tape <span id="df-hv">1</span></label>
    <input id="df-h" type="range" min="1" max="12" value="1"></div>
</div>
<div class="readout" id="df-out" role="status" aria-live="polite"></div>

${S('MIDI in hex', 'One bit does all the framing',
  ['A MIDI stream has no packet header, no length field and no checksum. It has one rule instead, and it is enough: <strong>a status byte has its top bit set</strong> &mdash; 0x80 to 0xFF &mdash; and a data byte does not, 0x00 to 0x7F. Everything else falls out of that. A receiver that joins a stream mid-message throws bytes away until it sees one with the high bit set, and it is back in sync.',
   'For channel messages the byte splits in two: the high nibble is the command, the low nibble is the channel. The channel is zero-based on the wire and displayed one-based by nearly every piece of software, which is the off-by-one every MIDI person meets exactly once. So <span class="mono">90</span> is Note On on channel 1, <span class="mono">9F</span> is Note On on channel 16, and <span class="mono">B0 07 64</span> is controller 7 &mdash; volume &mdash; set to 100 on channel 1.',
   'Then <strong>running status</strong>, which is the compression that makes MIDI dumps look confusing. If the status byte would repeat, it can simply be left out and only the data bytes sent. That is why a busy stream has long runs with no status byte in sight. And it is why Note On with velocity 0 exists as a way of saying Note Off: it means an entire passage of notes going down and coming up can share one <span class="mono">9n</span> status byte instead of alternating between two.'])}

<div class="tblscroll">
<table class="hexkey">
  <thead><tr><th>Byte</th><th>Message</th><th>Data bytes</th></tr></thead>
  <tbody>
    <tr><td>8n</td><td>Note Off</td><td>note, velocity</td></tr>
    <tr><td>9n</td><td>Note On &mdash; velocity 0 means off</td><td>note, velocity</td></tr>
    <tr><td>An</td><td>Poly aftertouch</td><td>note, pressure</td></tr>
    <tr><td>Bn</td><td>Control change</td><td>controller, value</td></tr>
    <tr><td>Cn</td><td>Program change</td><td>program</td></tr>
    <tr><td>Dn</td><td>Channel aftertouch</td><td>pressure</td></tr>
    <tr><td>En</td><td>Pitch bend &mdash; 14 bits, LSB first</td><td>LSB, MSB</td></tr>
    <tr><td>F0 &hellip; F7</td><td>System exclusive, runs until F7</td><td>any length</td></tr>
    <tr><td>F1</td><td>MTC quarter frame</td><td>piece and nibble</td></tr>
    <tr><td>F2</td><td>Song position &mdash; 14 bits, LSB first</td><td>LSB, MSB</td></tr>
    <tr><td>F8 FA FB FC</td><td>Clock, start, continue, stop</td><td>none</td></tr>
  </tbody>
</table>
</div>

${S('Fourteen bits', 'Why pitch bend arrives backwards',
  ['Seven bits per data byte is 128 steps, which is fine for a velocity and hopeless for a pitch bend. So the values that need more precision are sent as two data bytes, seven bits each, giving 14 bits and 16384 steps &mdash; and they are sent <strong>least significant byte first</strong>.',
   'The reassembly is one line: <span class="mono">value = (MSB &lt;&lt; 7) | LSB</span>. Pitch bend centre is 8192, which on the wire is <span class="mono">En 00 40</span> &mdash; LSB zero, MSB 0x40. Reading those two bytes in the order they appear and expecting a number is how people end up convinced their bender is broken.',
   'The same shape appears in Song Position Pointer, in the 14-bit control change pairs (controller n and controller n+32), and in almost everything MIDI does when seven bits is not enough. When something MIDI reads backwards, this is usually why.'])}

${S('Show control', 'MSC is a system exclusive with a cue number in it',
  ['MIDI Show Control is one message shape: <span class="mono">F0 7F &lt;device&gt; 02 &lt;format&gt; &lt;command&gt; &lt;data&gt; F7</span>. It is the oldest reliable way to make one GO button fire lighting, sound and machinery at once.',
   'Three details cause nearly all the trouble. Device ID <span class="mono">7F</span> is all-call, so a receiver left at 127 acts on every message on the network whether it was meant for it or not. Command format is a category rather than an address &mdash; 01 is Lighting (General), 02 is Moving Lights &mdash; and a receiver only acts on the formats it is set to accept, so a format mismatch is the single most common cause of &ldquo;MSC is doing nothing&rdquo;. And the cue data is <strong>ASCII digits</strong>, not binary, with 0x00 bytes separating cue number, cue list and cue path.',
   'So <span class="mono">F0 7F 7F 02 01 01 31 00 F7</span> is: all-call, lighting, GO, cue &ldquo;1&rdquo;. The <span class="mono">31</span> is the ASCII character 1, not the number 0x31. Paste it into <a href="/tools/#midi">the decoder</a> and it will say so.',
   'The last detail is the one that bites in a show: MSC is one-directional and has no state. Nothing acknowledges. A receiver that missed a GO stays where it was, and the sender reports a perfectly successful cue.'])}

${xnote('Everything on this page exists so that two departments can agree about <em>when</em>. An audience does not perceive a lighting cue and a sound cue as two events that happened close together &mdash; below about a tenth of a second they experience one event, and just past it they experience a mistake. Two frames of MTC offset is 80 milliseconds, which is close enough to that boundary that it decides whether a hit lands as a hit. The bits are the mechanism; the thing being protected is a single perceived moment.')}

${S('Where this goes next', 'The calculators on this page',
  ['<a href="/tools/#midi">The MIDI hex decoder</a> parses a pasted stream, including running status, quarter frames and MSC. <a href="/tools/#tc">Timecode</a> converts between rates and validates drop-frame times &mdash; it will refuse <span class="mono">00:01:00:00</span>, because that is not a time. <a href="/learn/encoding/">How a one gets down a wire</a> has the wider family of line codes that biphase mark belongs to, and <a href="/learn/systems/">how it all runs together</a> covers what happens when several systems assume a shared clock rather than agreeing one.'])}
`

  const script = `
${MATH_TABLES}
${MATH_SRC}
(function(){
  var ids=['lt-h','lt-m','lt-s','lt-f'];
  var els=ids.map(function(i){return document.getElementById(i)});
  if(els.some(function(e){return !e}))return;
  function draw(){
    var v=els.map(function(e){return Number(e.value)});
    ['lt-hv','lt-mv','lt-sv','lt-fv'].forEach(function(id,i){
      document.getElementById(id).textContent=String(v[i]).padStart(2,'0');
    });
    var f=ltcFrame(v[0],v[1],v[2],v[3]);
    if(!f)return;
    /* Classify each bit by which field it lives in, so the grid shows the
       shape of the frame rather than just its contents. */
    var kind=new Array(80).fill('user');
    f.fields.forEach(function(fl){
      var k = fl.sync ? 'sync' : fl.flag ? 'flag' : fl.user ? 'user' : 'time';
      for(var i=0;i<fl.width;i++) kind[fl.start+i]=k;
    });
    var html='';
    for(var i=0;i<80;i++){
      html+='<span class="bit" data-k="'+kind[i]+'" title="bit '+i+'">'+f.bits[i]+'</span>';
    }
    document.getElementById('lt-bits').innerHTML=html;
    document.getElementById('lt-out').innerHTML=
      'Reading the digits straight out: frame units bits 0&ndash;3, frame tens 8&ndash;9, second units 16&ndash;19, '
      +'second tens 24&ndash;26, minute units 32&ndash;35, minute tens 40&ndash;42, hour units 48&ndash;51, hour tens 56&ndash;57. '
      +'<b>'+f.timeBits+'</b> bits of time in <b>'+f.totalBits+'</b>, and '+f.bitRateAt(30)+' bit/s at 30 fps &mdash; '
      +'slow enough to live on an audio track.';
  }
  els.forEach(function(e){e.addEventListener('input',draw)}); draw();
})();
(function(){
  var ids=['mt-h','mt-m','mt-s','mt-f'];
  var els=ids.map(function(i){return document.getElementById(i)});
  var rate=document.getElementById('mt-r');
  if(!rate||els.some(function(e){return !e}))return;
  function draw(){
    var v=els.map(function(e){return Number(e.value)});
    ['mt-hv','mt-mv','mt-sv','mt-fv'].forEach(function(id,i){
      document.getElementById(id).textContent=String(v[i]).padStart(2,'0');
    });
    var q=mtcQuarterFrames(v[0],v[1],v[2],v[3],rate.value);
    if(!q){
      document.getElementById('mt-out').innerHTML='That frame number does not exist at this rate.';
      document.getElementById('mt-table').innerHTML='';
      return;
    }
    var rows='<tr><th>Piece</th><th>On the wire</th><th>Carries</th></tr>';
    q.messages.forEach(function(m){
      rows+='<tr><td>'+m.piece+'</td><td>'+m.hex+'</td><td>'+m.label+' = '+m.value+'</td></tr>';
    });
    document.getElementById('mt-table').innerHTML=rows;
    document.getElementById('mt-out').innerHTML=
      'Eight pieces at four a frame: this value takes <b>'+q.framesToComplete+' frames</b> to arrive, '
      +'so a receiver reading it is two frames behind the transmitter.<br>'
      +'Locating while stopped uses the full frame instead: <span class="mono">'+q.fullFrame+'</span>';
  }
  els.forEach(function(e){e.addEventListener('input',draw)});
  rate.addEventListener('change',draw); draw();
})();
(function(){
  var h=document.getElementById('df-h');
  if(!h)return;
  function draw(){
    var hours=Number(h.value);
    document.getElementById('df-hv').textContent=hours;
    /* Count the labels that do not exist: two per minute except every tenth. */
    var minutes=hours*60;
    var dropped=2*(minutes-Math.floor(minutes/10));
    /* And the drift a non-drop counter accumulates over the same span. */
    var realFrames=hours*3600*(30000/1001);
    var countedFrames=hours*3600*30;
    var drift=countedFrames-realFrames;
    document.getElementById('df-out').innerHTML=
      'Over <b>'+hours+' hour'+(hours===1?'':'s')+'</b>, a non-drop counter runs <b>'
      +(drift/30).toFixed(2)+' seconds</b> fast against the wall clock &mdash; '+Math.round(drift)+' frames.<br>'
      +'Drop frame skips <b>'+dropped+'</b> frame numbers over the same span. '
      +'Not one frame of picture is missing; '+dropped+' labels simply never occur.'
      +(Math.abs(dropped-drift)>=1
        ? '<br>Over this long the correction is <b>'+(dropped-drift).toFixed(2)+' frames</b> out: dropping two labels '
          +'a minute is very close to the drift but not exactly it, so drop frame gains roughly a frame every ten hours.'
        : '');
  }
  h.addEventListener('input',draw); draw();
})();
`

  return shell({
    title: 'What is actually in a timecode frame — LTC bits, MTC quarter frames, drop frame and MIDI hex | showstack',
    description: 'An LTC frame is 80 bits and only 26 are the time, stored as BCD behind a sync word whose twelve consecutive ones cannot occur elsewhere. MTC sends the same value four bits at a time and is always two frames behind. Drop frame drops numbers, not frames. And MIDI framing is one bit.',
    canonical: `${SITE}/learn/timecode/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'What is actually in a timecode frame',
      url: `${SITE}/learn/timecode/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
