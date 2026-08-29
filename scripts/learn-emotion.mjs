/**
 * /learn/emotion/ — how a feeling is built.
 *
 * The claim the page is organised around: a show does not transmit an
 * emotion. It creates conditions - bodily arousal, and a context that says
 * what the arousal means - and a feeling is constructed from those. That is
 * why the same racing heart is terror in one room and joy in another, and it
 * is why contrast rather than intensity is the only real lever.
 *
 * The field is genuinely contested, and the page says so rather than
 * presenting one theory as settled. Barrett's constructed-emotion account is
 * the dominant modern framework; Ekman's basic-emotions tradition is not
 * dead. Where practitioners need to act, both agree on the practical points -
 * arousal is generic, context does the categorising, expectation drives the
 * peaks - so the advice survives the disagreement.
 *
 * The interactive is a valence-arousal map because it turns "make it feel
 * exciting" into two independent dials, which is the single most useful
 * reframe on the page.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav } from './learn-kit.mjs'

export function learnEmotionPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* two ingredients meeting */
@keyframes rise-l{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.mixfig .ing1{animation:rise-l 3s ease-in-out infinite}
.mixfig .ing2{animation:rise-l 3s ease-in-out infinite;animation-delay:.5s}
@keyframes bloom{0%,42%{opacity:0;transform:scale(.85)}58%,88%{opacity:1;transform:scale(1)}
100%{opacity:0;transform:scale(1.03)}}
.mixfig .out{animation:bloom 3s ease-in-out infinite;transform-origin:372px 92px}
/* contagion: one person, then a section, then a room */
@keyframes spread{0%,10%{opacity:.18}22%,100%{opacity:1}}
${[...Array(24)].map((_, i) => `.config .p${i}{animation:spread 3.4s ease-out infinite;animation-delay:${(0.05 * i).toFixed(2)}s}`).join('')}
/* the remembered shape of an experience */
@keyframes trace{from{stroke-dashoffset:640}to{stroke-dashoffset:0}}
.pkfig .curve{stroke-dasharray:640;animation:trace 5s ease-in-out infinite}
@keyframes mark{0%,44%{opacity:0;r:4}54%,94%{opacity:1;r:8}100%{opacity:0}}
.pkfig .peak{animation:mark 5s ease-in-out infinite}
.pkfig .end{animation:mark 5s ease-in-out infinite;animation-delay:.9s}
/* the valence-arousal map */
.vamap{position:relative;aspect-ratio:1.35;max-width:520px;margin:14px auto 0;border:1px solid var(--line);
border-radius:var(--r-md);background:var(--panel);overflow:hidden;touch-action:none;cursor:crosshair}
.vamap .ax{position:absolute;background:var(--line)}
.vamap .axh{left:0;right:0;top:50%;height:1px}
.vamap .axv{top:0;bottom:0;left:50%;width:1px}
.vamap .lb{position:absolute;font-family:var(--mono);font-size:10px;color:var(--dimmer);
text-transform:uppercase;letter-spacing:.5px}
.vamap .quad{position:absolute;width:50%;height:50%;display:grid;place-items:center;
font-family:var(--mono);font-size:11.5px;color:var(--dimmer);opacity:.55;pointer-events:none;text-align:center;
padding:10px;line-height:1.5}
.vamap .dot{position:absolute;width:18px;height:18px;border-radius:50%;background:var(--accent);
border:2px solid var(--bg);transform:translate(-50%,-50%);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 28%,transparent)}
.valevers{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-top:14px}
.valevers > div{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-sm);padding:13px}
.valevers dt{font-family:var(--mono);font-size:10.5px;letter-spacing:.5px;text-transform:uppercase;
color:var(--accent);margin-bottom:6px}
.valevers dd{margin:0;color:var(--dim);font-size:13.4px;line-height:1.55}
/* concrete recipes */
.recipes{display:grid;grid-template-columns:repeat(auto-fit,minmax(266px,1fr));gap:14px;margin:18px 0}
.recipes > div{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:17px;
border-top:3px solid var(--accent)}
.recipes > div:nth-child(2){border-top-color:var(--accent2)}
.recipes > div:nth-child(3){border-top-color:var(--dom-network)}
.recipes > div:nth-child(4){border-top-color:var(--dom-control)}
.recipes > div:nth-child(5){border-top-color:var(--warn)}
.recipes > div:nth-child(6){border-top-color:var(--ok)}
.recipes h4{margin:0 0 3px;font-size:16px;font-family:var(--sans);text-transform:none;letter-spacing:-.1px;
color:var(--ink);font-weight:650}
.recipes .ra{font-family:var(--mono);font-size:10.5px;letter-spacing:.4px;color:var(--dimmer);margin:0 0 12px}
.recipes p{margin:0 0 9px;color:var(--dim);font-size:13.6px;line-height:1.6}
.recipes p:last-child{margin-bottom:0}
.recipes b{color:var(--ink)}
/* debate panel */
.debate{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--line);
border-radius:var(--r-md);overflow:hidden;margin:18px 0}
.debate > div{padding:17px}
.debate > div:first-child{border-right:1px solid var(--line)}
.debate h4{margin:0 0 9px;font-family:var(--mono);font-size:11px;letter-spacing:.6px;text-transform:uppercase;
color:var(--accent2)}
.debate p{margin:0 0 9px;color:var(--dim);font-size:13.8px;line-height:1.6}
.debate p:last-child{margin-bottom:0}
@media(max-width:600px){.debate{grid-template-columns:1fr}
.debate > div:first-child{border-right:none;border-bottom:1px solid var(--line)}}
`

  const mixFig = `
<svg viewBox="0 0 460 180" role="img" class="mixfig">
  <g class="ing1">
    <rect x="26" y="26" width="140" height="46" rx="8" fill="var(--panel)" stroke="var(--accent)" stroke-width="1.5"/>
    <text x="96" y="48" class="val" font-size="11" text-anchor="middle" fill="var(--accent)">AROUSAL</text>
    <text x="96" y="63" class="lbl" font-size="8.5" text-anchor="middle">a body that is stirred up</text>
  </g>
  <g class="ing2">
    <rect x="26" y="106" width="140" height="46" rx="8" fill="var(--panel)" stroke="var(--accent2)" stroke-width="1.5"/>
    <text x="96" y="128" class="val" font-size="11" text-anchor="middle" fill="var(--accent2)">CONTEXT</text>
    <text x="96" y="143" class="lbl" font-size="8.5" text-anchor="middle">what the room says it means</text>
  </g>
  <path d="M170 49 C220 49 230 82 262 90" fill="none" stroke="var(--dimmer)" stroke-width="1.4"/>
  <path d="M170 129 C220 129 230 98 262 92" fill="none" stroke="var(--dimmer)" stroke-width="1.4"/>
  <g class="out">
    <rect x="268" y="62" width="164" height="60" rx="10" fill="var(--panel2)" stroke="var(--ok)" stroke-width="1.8"/>
    <text x="350" y="88" class="val" font-size="12" text-anchor="middle" fill="var(--ok)">a feeling</text>
    <text x="350" y="106" class="lbl" font-size="8.5" text-anchor="middle">constructed, not received</text>
  </g>
  <text x="230" y="172" class="lbl" font-size="9.5" text-anchor="middle">the same pounding heart is terror in one room and joy in another</text>
</svg>`

  const conFig = `
<svg viewBox="0 0 460 160" role="img" class="config">
  ${[...Array(24)].map((_, i) => {
    const c = i % 8, r = Math.floor(i / 8)
    const x = 60 + c * 46, y = 44 + r * 34
    const order = Math.abs(c - 0) + r
    return `<circle class="p${order}" cx="${x}" cy="${y}" r="8" fill="var(--accent)"/>`
  }).join('')}
  <text x="230" y="140" class="lbl" font-size="9.5" text-anchor="middle">one person reacts, their neighbours read it, the room agrees</text>
  <text x="230" y="156" class="lbl" font-size="9.5" text-anchor="middle">an audience is not a set of individuals having private experiences</text>
</svg>`

  const pkFig = `
<svg viewBox="0 0 460 180" role="img" class="pkfig">
  <line x1="24" y1="140" x2="440" y2="140" stroke="var(--line)"/>
  <path class="curve" d="M24 132 C90 126 110 104 150 100 C190 96 210 116 250 108 C280 102 296 40 330 36
    C356 33 366 92 392 98 C410 102 424 84 436 62"
    fill="none" stroke="var(--accent)" stroke-width="2.2"/>
  <circle class="peak" cx="330" cy="36" r="8" fill="var(--accent2)"/>
  <text x="330" y="22" class="lbl" font-size="9" text-anchor="middle" fill="var(--accent2)">the peak</text>
  <circle class="end" cx="436" cy="62" r="8" fill="var(--ok)"/>
  <text x="428" y="48" class="lbl" font-size="9" text-anchor="end" fill="var(--ok)">the end</text>
  <text x="230" y="164" class="lbl" font-size="9.5" text-anchor="middle">what is remembered is those two, not the whole line</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / emotion</div>
${learnNav(esc, 'emotion')}
<div class="lhero">
  <h2>How a feeling is built</h2>
  <p class="lede">A show cannot transmit an emotion. What it can do is produce a stirred-up body and a context that tells a person what the stirring means — and a feeling is assembled out of those two things. Which is why the same pounding heart is terror in one room and joy in another, and why contrast, not intensity, is the only lever that really works.</p>
</div>

${S('The finding this all rests on', 'Arousal is generic. The label is not.', [
  'The classic demonstration is Schachter and Singer\'s, in 1962: give people a physiological jolt without telling them why, put them in a room with someone behaving either cheerfully or angrily, and they report feeling euphoric or irritated accordingly. Same body state. Different explanation available. Different reported emotion.',
  'The details of that study have been argued over for sixty years, and the core observation has held up: <b>bodily arousal on its own is remarkably unspecific</b>. Heart rate, breathing, skin conductance and the rest go up for fear, for excitement, for anger and for joy. What sorts them into different feelings is an interpretation, and the interpretation draws on everything available — the situation, the faces around you, what you expected, what you have felt before.',
  'For anyone building experiences this is the most practically important fact in psychology, because it splits the job cleanly in two. <b>Raise arousal</b> with level, tempo, brightness, low frequency, movement, physical scale. <b>Set the meaning</b> with everything else — narrative, harmony, colour, faces, the words on the wall on the way in, the behaviour of the people around you. Get the first without the second and you have made a room loud.',
])}

${fig(mixFig, 'Two ingredients. Neither is the feeling; the feeling is what gets built out of them.')}

${S('The map', 'Two dials, not a list of moods', [
  'Rather than a list of named emotions, it is far more useful to treat affect as a position in two dimensions: <b>valence</b>, how pleasant or unpleasant it is, and <b>arousal</b>, how activated the body is. Russell called this the circumplex, and it has survived because it is honest about what is actually being measured.',
  'The value of it here is that the two are independently controllable, by different means. Drag the point and see what each region actually asks of a production.',
])}

<div class="vamap" id="va" tabindex="0" role="application" aria-label="Drag to explore valence and arousal">
  <div class="ax axh"></div><div class="ax axv"></div>
  <div class="quad" style="left:0;top:0">tense · alarmed<br>afraid</div>
  <div class="quad" style="left:50%;top:0">excited · elated<br>astonished</div>
  <div class="quad" style="left:0;top:50%">bleak · weary<br>sombre</div>
  <div class="quad" style="left:50%;top:50%">calm · content<br>held</div>
  <span class="lb" style="left:9px;top:50%;transform:translateY(-140%)">unpleasant</span>
  <span class="lb" style="right:9px;top:50%;transform:translateY(-140%)">pleasant</span>
  <span class="lb" style="left:50%;top:7px;transform:translateX(8px)">activated</span>
  <span class="lb" style="left:50%;bottom:7px;transform:translateX(8px)">quiet</span>
  <div class="dot" id="va-dot" style="left:72%;top:26%"></div>
</div>
<div class="verdict" id="va-out"></div>
<div class="valevers">
  <div><dt>raises arousal</dt><dd id="va-up"></dd></div>
  <div><dt>sets valence</dt><dd id="va-val"></dd></div>
</div>

${S('Getting concrete', 'Actual recipes, and what each one is really doing', [
  'The map gives you two dials. This is what turning them looks like in a room, for the states people most often ask for by name. None of it is a guarantee — it is what the levers are, and what each one is exploiting.',
])}

<div class="recipes">
  <div>
    <h4>Joy · elation</h4>
    <p class="ra">high arousal · positive valence</p>
    <p><b>Raise:</b> tempo above resting heart rate, rising pitch and brightening timbre, level, warm and saturated light, upward movement, physical scale.</p>
    <p><b>Label it:</b> resolution that arrives, major-mode harmony, visible faces, an audience that can see itself, room to move.</p>
    <p><b>The mechanism:</b> arousal plus an unambiguous positive reading, on top of a build that made the resolution wanted. It fails when the arousal has no reading — that is anxiety, not joy.</p>
  </div>
  <div>
    <h4>Excitement · anticipation</h4>
    <p class="ra">rising arousal · valence held open</p>
    <p><b>Raise:</b> accelerating tempo, accumulating layers, narrowing focus, a repeated figure that has not resolved, increasing low-frequency energy.</p>
    <p><b>Label it:</b> deliberately do not, yet. Excitement lives in the gap before the answer.</p>
    <p><b>The mechanism:</b> this is the dopaminergic build described above — the anticipation phase <em>is</em> part of the reward. Which is why holding it a beat longer than comfortable works, and why resolving early costs you the moment.</p>
  </div>
  <div>
    <h4>Sadness · melancholy</h4>
    <p class="ra">low arousal · negative valence</p>
    <p><b>Lower:</b> tempo below resting, sparse texture, small dynamic range, a single voice, restricted movement, dim and desaturated light, cool colour.</p>
    <p><b>Label it:</b> descending lines, minor mode, suspensions that resolve downward, a solitary figure in space, distance from the audience.</p>
    <p><b>The mechanism:</b> low arousal is the crucial half and the one people get wrong by making sad things loud. Sadness in an audience is mostly <em>absence</em> — of movement, of density, of company — and it needs time, which a running order rarely gives it.</p>
  </div>
  <div>
    <h4>Awe</h4>
    <p class="ra">high arousal · positive · plus scale</p>
    <p><b>Raise:</b> perceived vastness — height, depth, an unexpectedly large space, a sound with no visible source, many things moving as one.</p>
    <p><b>Label it:</b> something that does not fit the frame the audience arrived with, so it has to be accommodated rather than filed.</p>
    <p><b>The mechanism:</b> awe is the one that reliably needs <em>scale plus a need to update</em>. It is also the state most associated with feeling connected to the people around you, which makes it the one that benefits most from an audience being able to sense each other.</p>
  </div>
  <div>
    <h4>Tension · unease</h4>
    <p class="ra">high arousal · negative valence</p>
    <p><b>Raise:</b> unresolved dissonance, low-frequency content with no obvious source, irregular or absent pulse, restricted sightlines, silence where sound was expected.</p>
    <p><b>Label it:</b> withhold information. Uncertainty is what turns arousal negative.</p>
    <p><b>The mechanism:</b> the same arousal as excitement with the reading tipped. It is powerful, and it is the one state with a real duty of care — sustained tension with no release is not catharsis, it is distress, and some people in the room cannot leave easily.</p>
  </div>
  <div>
    <h4>Calm · being held</h4>
    <p class="ra">low arousal · positive valence</p>
    <p><b>Lower:</b> slow tempo, long tones, warm dim light, wide slow movement, low event density, predictability.</p>
    <p><b>Label it:</b> consonance, resolution that keeps arriving, safety cues — visible exits, comfortable temperature, no ambiguity about what is expected of them.</p>
    <p><b>The mechanism:</b> this is where a piece should spend most of its time. It is not the absence of design; it is the ground that makes everything above legible, and holding it is harder than any of them.</p>
  </div>
</div>

${rule('There is no lever that produces a named feeling. There is a lever for <b>arousal</b>, a lever for <b>what it means</b>, and a <b>contrast</b> that makes both readable — and every recipe above is those three, arranged.')}

${S('Where the theory is genuinely unsettled', 'Two accounts, and what they agree on', [
  'It is worth being straight about this rather than presenting one view as settled, because both traditions are active and both have serious people in them.',
])}

<div class="debate">
  <div>
    <h4>Basic emotions</h4>
    <p>Associated most with Paul Ekman. A small set of biologically basic emotions — anger, fear, disgust, joy, sadness, surprise — each with its own characteristic physiology and facial expression, recognisable across cultures.</p>
    <p>Enormously influential, and it is the model most design language quietly assumes when it talks about "making the audience feel X".</p>
  </div>
  <div>
    <h4>Constructed emotion</h4>
    <p>Associated most with Lisa Feldman Barrett. The brain is continuously predicting the state of the body and interpreting it using learned concepts; an emotion is a <em>category</em> applied to a situation, not a thing triggered in it.</p>
    <p>The evidence that specific emotions lack consistent physiological or facial signatures is strong, and this has become the dominant modern framework — though it is not unopposed.</p>
  </div>
</div>

<p style="color:var(--dim);font-size:15px;max-width:66ch">For practical purposes they converge where it matters. Both agree that arousal alone does not specify an emotion, that <b>context does enormous work</b>, that culture and prior experience shape what is felt, and that expectation and its violation drive the peaks. Every piece of advice on this page survives the disagreement, which is a reasonable test of whether advice is worth giving.</p>

${S('Why an audience is not a hundred individuals', 'Contagion, and moving together', [
  'Put the same performance in front of one person and in front of eight hundred and it is not the same event, and the difference is not acoustics.',
  '<b>Emotional contagion</b> is fast and largely automatic: we read faces, posture and vocal tone constantly, and we drift toward what we read. In a full room every person is receiving the performance <em>and</em> several hundred cues about how to interpret it. That is the mechanism behind a laugh that spreads and a silence that holds.',
  '<b>Synchrony</b> is the other half. Moving together — clapping, singing, dancing, breathing in the same rhythm — reliably increases how connected people feel and how much they cooperate afterwards, and it raises pain thresholds. Durkheim called the resulting state collective effervescence a century before anybody could measure it, and studies of concert and theatre audiences have since found measurable synchronisation of heart rate and breathing across a room during absorbing passages.',
  'The design consequence is concrete: the moments that let an audience act <em>together</em> — a shared beat, a held silence, a lighting state that includes them rather than only the stage — are doing structural work, not decorative work. And an audience configuration that makes people invisible to each other removes a channel the piece was probably relying on.',
])}

${fig(conFig, 'One person reacts, their neighbours read it, and the room converges on how to feel.')}

${S('What actually survives', 'The peak, the end, and almost nothing else', [
  'Kahneman\'s work on remembered experience found something uncomfortable and extremely useful: how an episode is remembered is predicted well by the average of its <b>most intense moment</b> and its <b>final moment</b>, and barely at all by how long it lasted.',
  'That has a blunt implication for a running order. The mediocre twenty minutes in the middle costs you far less than it feels like it should. A weak final five minutes costs you the whole night, because that is a full half of what gets stored.',
  'It also reframes what a peak requires. A peak is a peak <em>relative to what surrounded it</em> — which brings this straight back to the <a href="/learn/perception/">frisson mechanism</a>. Ninety minutes at maximum has no peak in it at all, because there is nothing for the peak to be higher than.',
])}

${fig(pkFig, 'The remembered version is roughly the peak and the ending. The middle is largely discarded.')}

${rule('Design the <b>peak</b> and the <b>ending</b> deliberately, and spend the rest of the running order making them possible. Restraint is not the absence of design — it is what the peak is measured against.')}

${bites([
  '<b>"Make it more emotional" is not actionable. "Raise arousal and change the valence cue" is.</b> Splitting the two is most of the craft.',
  '<b>Loudness produces arousal and also damage.</b> The physiological response is real and so is the exposure — use the <a href="/tools/#dose">noise dose tool</a> and treat it as the same conversation.',
  '<b>Culture is not a detail.</b> What a colour, a gesture, a silence or a piece of harmony means is learned. A cue that lands in one city can read as something else entirely in another.',
  '<b>Novelty decays across a run.</b> A moment built entirely on surprise works on press night and is inert by week three, for the crew if not for the audience.',
  '<b>Be careful with arousal you cannot resolve.</b> Sustained tension with no release does not produce catharsis, it produces exhaustion — and for some people, genuine distress.',
])}

${S('The honest limits', 'What this does not give you', [
  'None of this is deterministic and nobody should sell it as such. These are population tendencies with wide individual variation, heavily shaped by culture, mood on the night, who somebody came with, and what happened to them on the way in.',
  'It is also worth being blunt about the marketing around this area. "Neuro-" attached to a design service usually means somebody read a summary. Real measurement of audience response is possible — physiological synchrony, self-report at scale, behavioural traces — and it is slow, noisy and expensive, and it tells you about a distribution rather than about a person.',
  'What the material genuinely gives you is better questions. Not "will they like it", which is unanswerable, but: <em>what is raising arousal here, what is telling them what it means, what is this a contrast against, and what will they be feeling in the last ninety seconds.</em> Those are answerable, and answering them is the work.',
])}

<div class="cta"><strong>This page is a practitioner\'s summary of contested research.</strong>
<p>It simplifies, and it takes a position on where the accounts agree. If something here is out of date, overstated, or missing the caveat that matters, <a href="${GH}/issues/new?labels=tooling&amp;title=emotion%3A+">open an issue</a> — precision here improves the pages that depend on it.</p></div>

<script>
(function(){
  var map=document.getElementById('va'); if(!map) return;
  var dot=document.getElementById('va-dot'), out=document.getElementById('va-out'),
      up=document.getElementById('va-up'), val=document.getElementById('va-val');
  function set(vx,vy){
    vx=Math.max(0,Math.min(1,vx)); vy=Math.max(0,Math.min(1,vy));
    dot.style.left=(vx*100)+'%'; dot.style.top=(vy*100)+'%';
    var v=(vx-0.5)*2, a=(0.5-vy)*2;               // -1..1
    var name = a>0.25 ? (v>0.25?'excited, elated':v<-0.25?'tense, alarmed':'alert, keyed up')
             : a<-0.25 ? (v>0.25?'calm, content':v<-0.25?'bleak, weary':'still, suspended')
             : (v>0.25?'pleasant, settled':v<-0.25?'uneasy':'neutral');
    var mag=Math.round(Math.abs(a)*100), pol=Math.round(Math.abs(v)*100);
    out.innerHTML='<b>'+name+'</b> \\u2014 arousal '+(a>=0?'+':'\\u2212')+mag+', valence '+(v>=0?'+':'\\u2212')+pol+
      '. '+(Math.abs(a)>0.6&&Math.abs(v)<0.2
        ? 'High arousal with nothing telling the audience what it means is the state that reads as <em>anxious</em> rather than exciting. Give it a label.'
        : Math.abs(a)<0.2
        ? 'Low arousal is not a failure state \\u2014 it is what a peak will be measured against.'
        : 'Both dials are doing something. This is where most of a show should actually sit.');
    up.innerHTML = a>0.3
      ? 'Level, tempo, brightness, low-frequency energy, movement, physical scale, density of events. All of it non-specific \\u2014 it stirs the body without saying why.'
      : a<-0.3
      ? 'Take them away. Quiet, slow, dim, sparse, still. This is expensive to hold and it is what makes the next rise readable.'
      : 'Mid arousal. The workable default, and the level you have to leave in order to have anywhere to go.';
    val.innerHTML = v>0.3
      ? 'Consonance, warm and familiar colour, faces, resolution arriving, an audience able to see each other, room to move.'
      : v<-0.3
      ? 'Dissonance, cold or unnatural colour, absence of faces, resolution withheld, constriction, isolation from the rest of the room.'
      : 'Ambiguous. Powerful when deliberate \\u2014 the audience supplies the meaning \\u2014 and inert when accidental.';
  }
  function fromEvent(e){
    var r=map.getBoundingClientRect();
    var p = e.touches ? e.touches[0] : e;
    set((p.clientX-r.left)/r.width,(p.clientY-r.top)/r.height);
  }
  var down=false;
  map.addEventListener('pointerdown',function(e){
    down=true; fromEvent(e);
    // capture is a nicety; if the browser refuses it the drag must still work
    try{ map.setPointerCapture(e.pointerId); }catch(err){}
  });
  map.addEventListener('pointermove',function(e){if(down)fromEvent(e);});
  map.addEventListener('pointerup',function(){down=false;});
  map.addEventListener('keydown',function(e){
    var r={ArrowLeft:[-0.04,0],ArrowRight:[0.04,0],ArrowUp:[0,-0.04],ArrowDown:[0,0.04]}[e.key];
    if(!r) return; e.preventDefault();
    set(parseFloat(dot.style.left)/100+r[0], parseFloat(dot.style.top)/100+r[1]);
  });
  set(0.72,0.26);
})();
</script>
`

  return shell({
    title: 'How a feeling is built — arousal, context and what an audience remembers | showstack',
    description: 'Why bodily arousal is generic and context does the categorising, the valence-arousal map as two independent design dials, the live debate between basic and constructed emotion, emotional contagion and synchrony in an audience, and why the peak and the ending are what actually survive.',
    canonical: `${SITE}/learn/emotion/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'How a feeling is built',
      description: 'Arousal and appraisal, the valence-arousal circumplex, basic versus constructed emotion, emotional contagion and synchrony in audiences, and the peak-end rule applied to a running order.',
      url: `${SITE}/learn/emotion/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
