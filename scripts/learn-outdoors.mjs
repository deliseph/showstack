/**
 * /learn/outdoors/ — the venue with no roof.
 *
 * Half the industry works outside and nothing else on this site acknowledges
 * it. Every other explainer quietly assumes a building: a floor that is dry, a
 * temperature somebody else is managing, and no wind.
 *
 * Outdoors, three physical facts do most of the damage and all three are
 * counter-intuitive in the same direction — they are worse than they look.
 * Wind force goes with the SQUARE of speed, so the day that feels twice as
 * breezy is four times the load. Air holds water and gives it back on a
 * schedule set by temperature, not by rain, so gear gets wet on a clear night.
 * And an IP rating is a laboratory result about a sealed assembly, which is
 * not the thing sitting on your deck at 4pm with a connector half-mated.
 *
 * The page ends where it has to end: the decision to stop is a plan written
 * before the day, not a judgement made on it.
 */
import { windLoad, dewPoint, beaufort } from './toolmath.mjs'
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

const MATH_SRC = [windLoad, beaufort, dewPoint].map((f) => f.toString()).join('\n\n')
const MATH_TABLES = `const BEAUFORT = ${JSON.stringify([
  [0.5, 0, 'Calm'], [1.6, 1, 'Light air'], [3.4, 2, 'Light breeze'],
  [5.5, 3, 'Gentle breeze'], [8.0, 4, 'Moderate breeze'], [10.8, 5, 'Fresh breeze'],
  [13.9, 6, 'Strong breeze'], [17.2, 7, 'Near gale'], [20.8, 8, 'Gale'],
  [24.5, 9, 'Strong gale'], [28.5, 10, 'Storm'], [32.7, 11, 'Violent storm'],
])};`

export function learnOutdoorsPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* The wind figure grows its arrow with the square of speed, because the
   square is the entire lesson and a static drawing cannot make that point. */
.wfig .gustbar{transition:height .3s ease,y .3s ease,fill .3s ease}
.wfig .sail{transition:transform .4s cubic-bezier(.2,.8,.3,1);transform-origin:120px 176px}
/* Overnight cooling: the air temperature line falls toward a flat dew point
   and the moment they touch is the moment the rig gets wet. */
@keyframes dew-night{0%{stroke-dashoffset:520}100%{stroke-dashoffset:0}}
.dfig .track{stroke-dasharray:520;animation:dew-night 7s linear infinite}
@keyframes dew-wet{0%,62%{opacity:0}72%,100%{opacity:1}}
.dfig .wet{animation:dew-wet 7s linear infinite}
/* The two IP digits, each with the test it stands for. */
.ipgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:12px;margin:16px 0}
.ipcard{border:1px solid var(--rule);border-radius:var(--r-md);padding:15px 17px;background:var(--surface-raised)}
.ipcard b{display:block;font-family:var(--mono);font-size:12px;letter-spacing:.6px;text-transform:uppercase;
color:var(--ink-faint);margin-bottom:9px}
.iprow{display:flex;gap:11px;padding:6px 0;border-top:1px solid var(--rule);font-size:14px;line-height:1.5}
.iprow:first-of-type{border-top:0}
.iprow em{font-style:normal;font-family:var(--mono);font-size:13px;color:var(--ink);flex:0 0 22px;
font-variant-numeric:tabular-nums}
.iprow span{color:var(--ink-muted)}
.otable{width:100%;border-collapse:collapse;font-size:14px;margin:14px 0}
.otable th{text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;
color:var(--ink-faint);padding:0 12px 9px 0;border-bottom:1px solid var(--rule);font-weight:400}
.otable td{padding:11px 12px 11px 0;border-bottom:1px solid var(--rule);vertical-align:top;
color:var(--ink-muted);line-height:1.55}
.otable td:first-child{font-family:var(--mono);font-size:12.5px;color:var(--ink);white-space:nowrap}
.otable td strong{color:var(--ink)}
`

  // ---- wind: the square law, with a sail you can push --------------------
  const windFig = `
<svg viewBox="0 0 620 240" role="img" class="wfig">
  <line x1="40" y1="176" x2="580" y2="176" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <rect x="96" y="96" width="48" height="80" rx="3" fill="var(--surface-raised)" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <g class="sail" id="wf-sail">
    <rect x="100" y="60" width="40" height="112" rx="2" fill="color-mix(in srgb,var(--signal) 22%,transparent)"
          stroke="var(--signal)" stroke-width="2"/>
  </g>
  <text x="120" y="200" class="lbl" text-anchor="middle">the surface</text>
  <line x1="200" y1="116" x2="300" y2="116" stroke="var(--dimmer)" stroke-width="1.5" stroke-dasharray="4 5"/>
  <text x="250" y="106" class="lbl" text-anchor="middle">force</text>
  <rect x="320" y="56" width="54" height="120" rx="3" fill="none" stroke="var(--rule)" stroke-width="1"/>
  <rect class="gustbar" id="wf-bar" x="320" y="146" width="54" height="30" fill="var(--signal)"/>
  <text x="347" y="200" class="lbl" text-anchor="middle">at this speed</text>
  <rect x="420" y="56" width="54" height="120" rx="3" fill="none" stroke="var(--rule)" stroke-width="1"/>
  <rect class="gustbar" id="wf-gust" x="420" y="116" width="54" height="60" fill="var(--warn)"/>
  <text x="447" y="200" class="lbl" text-anchor="middle">in the gust</text>
  <text x="512" y="112" class="val" id="wf-read">&mdash;</text>
  <text x="512" y="132" class="lbl">kgf</text>
  <text x="40" y="228" class="lbl">Both bars are to the same scale. The right-hand one is 1.4&times; the speed, which is about twice the force.</text>
</svg>`

  // ---- dew: a clear night, and the moment the two lines meet -------------
  const dewFig = `
<svg viewBox="0 0 620 220" role="img" class="dfig">
  <line x1="52" y1="180" x2="590" y2="180" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <line x1="52" y1="30" x2="52" y2="180" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <line x1="52" y1="132" x2="590" y2="132" stroke="var(--accent2)" stroke-width="2" stroke-dasharray="7 6"/>
  <text x="592" y="128" class="lbl" text-anchor="end" style="fill:var(--accent2)">dew point &mdash; flat all night</text>
  <path class="track" d="M52 52 C170 58 250 90 330 122 C410 152 500 168 590 172"
        fill="none" stroke="var(--signal)" stroke-width="2.5"/>
  <text x="70" y="46" class="lbl" style="fill:var(--signal)">air temperature</text>
  <g class="wet">
    <circle cx="330" cy="132" r="6" fill="var(--warn)"/>
    <line x1="330" y1="132" x2="330" y2="180" stroke="var(--warn)" stroke-width="1.5" stroke-dasharray="4 4"/>
    <text x="338" y="164" class="lbl" style="fill:var(--warn)">everything outside is now wet</text>
  </g>
  <text x="60" y="198" class="lbl">dusk</text>
  <text x="330" y="198" class="lbl" text-anchor="middle">around 3am</text>
  <text x="580" y="198" class="lbl" text-anchor="end">dawn</text>
  <text x="52" y="216" class="lbl">No rain fell. The air simply cooled to the temperature at which it could no longer hold what it was carrying.</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / outdoors</div>
${learnNav(esc, 'outdoors')}
<h2>When the venue is a field</h2>
<p class="lede">Every other page here quietly assumes a building: a dry floor, a temperature somebody else is managing, and no wind. Outside, three physical facts do most of the damage, and all three are worse than they look.</p>

${S('The square law', 'Everything with an area is a sail',
  ['Wind force is proportional to the <em>square</em> of wind speed. That single fact is why outdoor production has speeds written into a plan rather than judgement exercised on the day: a wind that feels twice as strong as this morning is putting four times the load into your structure, and a gust 40% above the average carries twice the force of the average.',
   'The arithmetic is short. Dynamic pressure is <span class="mono">q = &frac12; &rho; v&sup2;</span>, about <span class="mono">0.625 v&sup2;</span> pascals for air at sea level. Force is that pressure times the area times a shape factor. A 3&nbsp;&times;&nbsp;6&nbsp;m banner in an ordinary 12&nbsp;m/s breeze &mdash; Beaufort 6, the kind of day nobody cancels &mdash; is carrying more than 200&nbsp;kg of push, and about twice that in the gusts.',
   'What the plan actually needs is not one number but three: the speed at which you stop adding to the structure, the speed at which you drop or furl anything with an area, and the speed at which people leave. Those are decided in advance by whoever designed the structure, against a site-specific wind assessment, and written down where the person on site at 3pm can read them.'])}

${fig(windFig, 'Drag the speed. Both bars are the same scale &mdash; the gust bar is 1.4&times; the speed and roughly twice the force.')}

<div class="tryit">
  <div class="f"><label for="wf-v">Wind speed <span id="wf-v-v">12 m/s</span></label>
    <input id="wf-v" type="range" min="2" max="30" step="1" value="12"></div>
  <div class="f"><label for="wf-a">Area <span id="wf-a-v">18 m&sup2;</span></label>
    <input id="wf-a" type="range" min="1" max="60" step="1" value="18"></div>
</div>
<div class="readout" id="wf-out" role="status" aria-live="polite"></div>

${rule('Doubling the wind speed does not double the load, it <b>quadruples</b> it. Any rule of thumb built on linear intuition is wrong in the dangerous direction.')}

${bites([
  '<b>Averaging the wrong thing.</b> An anemometer reading is usually a mean over some window. The structure is taken over by a gust, and gusts routinely run 40&ndash;60% above the mean. A plan written against mean speed is a plan written against a number that never arrives.',
  '<b>The scrim that was only decorative.</b> Adding a mesh banner to an existing goalpost changes it from a structure with almost no area to one with a lot. Nothing about the truss changed; everything about the load did.',
  '<b>Ballast that is on the wrong side.</b> Overturning is a moment, not a weight: mass helps in proportion to how far it sits from the tipping edge. A tonne stacked at the centre of a narrow base does far less than a quarter of it out at the feet.',
  '<b>Treating a wind speed as a stop trigger only.</b> By the time it is unsafe to be near a structure it is already unsafe to be up it dropping banners. The furl speed has to be well below the evacuate speed, and somebody has to own the decision.',
])}

${S('Water', 'The air holds water, and gives it back on a schedule',
  ['Warm air holds more water than cold air. Cool a parcel of air far enough and it reaches the temperature where it can no longer carry what it has &mdash; the dew point &mdash; and the surplus comes out as liquid on the nearest cold surface. Nothing has to fall from the sky for your rig to end up soaked.',
   'This runs in both directions and both directions bite. Outdoors on a clear night, the air cools toward its dew point around dawn, and every horizontal surface on site gets wet. Indoors, gear that has been on a cold truck arrives well below the room&rsquo;s dew point, and water condenses <em>inside</em> the amplifier before anybody has plugged anything in. Same physics, opposite geometry.',
   'The fix is the same in both cases and it is patience: do not energise it until the surface is above the dew point, with a margin, because exactly at the dew point is already wet. On a cold case in a humid venue that is usually a couple of hours, and the mistake is opening the lid, which lets humid air straight onto the cold metal.'])}

${fig(dewFig, 'A clear night. The dew point stays roughly flat while the air temperature falls to meet it.')}

<div class="tryit">
  <div class="f"><label for="df-t">Air <span id="df-t-v">26 &deg;C</span></label>
    <input id="df-t" type="range" min="-5" max="40" step="1" value="26"></div>
  <div class="f"><label for="df-h">Humidity <span id="df-h-v">75%</span></label>
    <input id="df-h" type="range" min="10" max="100" step="1" value="75"></div>
  <div class="f"><label for="df-s">Surface <span id="df-s-v">12 &deg;C</span></label>
    <input id="df-s" type="range" min="-10" max="40" step="1" value="12"></div>
</div>
<div class="readout" id="df-out" role="status" aria-live="polite"></div>

${rule('Condensation is set by <b>surface</b> temperature against the air&rsquo;s dew point. The room being warm is not the question; the metal being cold is.')}

${S('The rating', 'What IP65 actually promises, and what it does not',
  ['An ingress protection rating is two digits and each one is a specific laboratory test. The first is solids, the second is water, and a higher second digit is not automatically better &mdash; IPX7 is an immersion test and does not include the pressurised jets of IPX5, which is why some equipment carries two ratings.',
   'What the rating covers is the assembly as tested: closed, sealed, mated, in the orientation the laboratory used. What it does not cover is nearly everything that actually happens on a site. A connector is rated when mated; the same connector hanging open in the rain is rated IP-nothing. Condensation forms inside the enclosure from air that was already in there. Gaskets age, get pinched by a hurried lid, and lose their rating without looking any different. And no IP digit says anything about UV, salt, or a truss clamp resting on the housing.'])}

<div class="ipgrid">
  <div class="ipcard"><b>First digit &mdash; solids</b>
    <div class="iprow"><em>4</em><span>Wire and objects over 1&nbsp;mm. Not dust.</span></div>
    <div class="iprow"><em>5</em><span>Dust protected: some gets in, not enough to interfere.</span></div>
    <div class="iprow"><em>6</em><span>Dust tight. Nothing gets in at all.</span></div>
  </div>
  <div class="ipcard"><b>Second digit &mdash; water</b>
    <div class="iprow"><em>4</em><span>Splashing from any direction.</span></div>
    <div class="iprow"><em>5</em><span>Jets from a 6.3&nbsp;mm nozzle. This is the rain-and-hose case.</span></div>
    <div class="iprow"><em>6</em><span>Powerful jets, 12.5&nbsp;mm nozzle.</span></div>
    <div class="iprow"><em>7</em><span>Immersion to 1&nbsp;m. Does <em>not</em> imply 5 or 6.</span></div>
  </div>
</div>

${bites([
  '<b>Rated when mated.</b> A weatherproof connector left unmated on the deck is a funnel. Cap it or do not run it.',
  '<b>The rating is for the enclosure, not the install.</b> A drilled cable entry with no gland, or a gland done up on the wrong diameter, throws the whole rating away.',
  '<b>Water finds the flat surface.</b> A fixture rated for rain falling on it is not rated for standing in the puddle that forms under it. Get things off the deck.',
  '<b>Heat and IP fight each other.</b> A sealed enclosure cannot convect. The same box that survives the rain cooks itself in the sun, and the derating that follows is thermal, not electrical.',
])}

${S('Heat and sun', 'A black case in direct sun is a different machine',
  ['Equipment specifications are quoted at an ambient temperature, usually somewhere between 20 and 35&nbsp;&deg;C, in still air. Direct sun on a dark enclosure adds a solar gain that has nothing to do with air temperature: surface temperatures of 60&nbsp;&deg;C and above on black flight cases in summer sun are ordinary, not exceptional.',
   'Three things follow. Amplifiers and servers throttle or shut down, and the shutdown is usually thermal protection working correctly rather than a fault. Cable ampacity falls with ambient temperature &mdash; the derating is a published factor and the <a href="/tools/#derate">cable derating calculator</a> applies it. And LED walls lose brightness and shift colour as they heat, which is why a wall calibrated at 8am does not match itself at 3pm.',
   'The counter-measures are dull and effective: shade the thing rather than cooling it, keep dark surfaces out of direct sun, leave the airflow paths the manufacturer designed actually open, and plan the day so the heaviest thermal load is not at the hottest hour.'])}

<table class="otable">
  <thead><tr><th>What changes</th><th>Roughly how much</th><th>What to do about it</th></tr></thead>
  <tbody>
    <tr><td>Cable ampacity</td><td>A 90&nbsp;&deg;C cable at 45&nbsp;&deg;C ambient keeps about <strong>87%</strong> of its rating, before any bundling factor</td><td>Derate deliberately &mdash; <a href="/tools/#derate">the calculator</a> does both factors</td></tr>
    <tr><td>Battery capacity</td><td>Falls in the cold and ages faster in the heat; both directions are real</td><td>Size for the temperature you will actually have, not the datasheet&rsquo;s</td></tr>
    <tr><td>LED wall output</td><td>Brightness and colour drift as the panel heats</td><td>Calibrate warm, not cold, and let it settle before matching</td></tr>
    <tr><td>Sealed enclosures</td><td>No convection at all &mdash; the IP rating is the reason</td><td>Shade rather than ventilate; ventilating breaks the rating</td></tr>
  </tbody>
</table>

${S('Measuring it', 'What an anemometer is telling you, and what it is not',
  ['A wind action plan with trigger speeds in it needs somebody measuring wind, and the measurement is less straightforward than the instrument suggests.',
   'A <strong>cup or vane anemometer</strong> is mechanical and averages by nature &mdash; it has inertia, so it under-reads a short gust by design. An <strong>ultrasonic</strong> unit measures the time of flight between transducers, has no moving parts to seize or wear, responds fast enough to actually catch gusts, and reports direction as well. For anything the plan depends on, ultrasonic is worth the money precisely because gusts are what take structures over and a cup will smooth them away.',
   'Where it sits matters more than what it is. Wind speed rises with height and is disturbed by everything nearby, so a reading taken at head height beside a truck is not the wind hitting the top of your structure &mdash; it can easily be half of it. The meteorological convention is 10&nbsp;m in open ground, and a site anemometer should be as high and as clear as it can practically be, with its actual position written into the plan so a reading means something.',
   'And the averaging window is the number people forget to ask about. An instrument reporting a 10-minute mean and one reporting 3-second gusts will disagree by 40% or more on the same afternoon, and a trigger value copied from a structure&rsquo;s documentation refers to a specific one of those. A plan that says &ldquo;stop at 18 m/s&rdquo; without saying <em>which</em> 18 m/s is not a plan, and the two readings can be a whole Beaufort force apart.'])}

${rule('A trigger speed is meaningless without <b>the averaging window and the measurement height</b> it refers to. Mean and gust at the same moment can differ by 40%.')}

${S('Rain, and the thing rain actually does', 'Which is rarely getting into the box',
  ['Rain gets measured in millimetres per hour, and outdoor events usually care about three thresholds that have nothing to do with the number itself.',
   'The first is <strong>standing water</strong>, which is about drainage rather than rainfall. Any flat surface on a stage &mdash; a deck, a dimmer rack lid, a case lying down &mdash; becomes a pond, and an <a href="#">IP rating</a> that covers falling rain says nothing about immersion. Most water ingress on shows arrives from underneath or from a surface the equipment was standing in, not from the sky.',
   'The second is <strong>wind-driven rain</strong>, which arrives horizontally and reaches things a vertical test never contemplated. The IP water tests spray from defined angles; a 20&nbsp;m/s crosswind is not one of them, and a fixture rated for rain falling on it can be getting rain fired into its underside.',
   'The third is <strong>weight</strong>. Rain collecting in a banner, a roof pocket or a sagging cover is a load nobody put in the calculation, it accumulates quietly, and it is heaviest exactly when the wind is worst. A pocket holding 100 litres is 100&nbsp;kg hanging somewhere the design did not expect, and it is the classic cause of a structure failing on a night that was not especially windy.',
   'Which is why the practical answers are about geometry rather than about ratings: get things off the deck, give every surface a fall, make sure water has somewhere to go that is not into a connector, and check for pockets that can fill before the weather rather than during it.'])}

${S('Control in the weather', 'What outdoor control gear actually needs',
  ['Putting a node, a splitter or a control panel outside is not just a matter of buying the rated version, and four things decide whether it survives the run.',
   '<strong>The enclosure has to breathe without leaking.</strong> A sealed box cannot convect, so it cooks in the sun and then, as it cools at night, draws in humid air through whatever gap it has &mdash; and that air condenses inside. A breather vent, a membrane gland that passes air and not water, is the standard answer, and a sealed box without one accumulates water over a week of ordinary weather with no leak anywhere.',
   '<strong>Cable entries are where ratings die.</strong> A gland done up on the wrong cable diameter, an unused entry with no blank, or a cable entering from above so water runs down it into the box, each throws away the rating of everything behind it. Enter from below where you can, and where you cannot, leave a drip loop so the water leaves the cable before the cable reaches the gland.',
   '<strong>Connectors are rated mated.</strong> An unmated weatherproof connector is a funnel, and the caps that come with them exist for exactly that. A run that will sit unmated overnight needs capping as part of the get-out, not as an afterthought.',
   'And <strong>heat and IP fight each other</strong>, which is the trade sitting under all of it. The higher the ingress rating the less the box can ventilate, so an IP66 enclosure in direct sun may need shade or active cooling that an IP54 one in the same place does not. Shading the enclosure is nearly always cheaper than cooling it, and it does not compromise the seal.'])}

${bites([
  '<b>An anemometer at head height.</b> It is not measuring the wind at the top of the structure, and the difference can be a factor of two.',
  '<b>A trigger value with no averaging window.</b> Mean or gust? They are a Beaufort force apart on a normal afternoon.',
  '<b>A sealed enclosure with no breather.</b> It will fill with water over a week without a single leak, by breathing humid air in as it cools.',
  '<b>Water pockets nobody checked.</b> A hundred litres in a banner is a hundred kilos, and it arrives on the windiest night.',
  '<b>Cable entering from the top.</b> Water runs down a cable. Enter from below, or leave a drip loop so it falls off before the gland.',
])}

${S('Stopping', 'The decision is a document, not a judgement',
  ['The last thing on this page is the only one that is not physics. Every outdoor event needs an adverse weather plan that names the trigger values, names the person who calls it, and names what happens at each stage &mdash; and it needs to exist before the day, because the day is exactly when nobody wants to be the one who stops a show.',
   'The reason to write it down is not bureaucratic. On site, at the moment the decision matters, the people best placed to see the weather are the people with the strongest reasons not to act on it: a crew that has been building for two days, a promoter with a gate, and an audience already in. A trigger agreed in a quiet room a month earlier removes that conflict from the moment it would otherwise be resolved badly.',
   'Lightning has a similar shape, and a similar answer. There is no way to make an open field safe; there is only a distance and a clock, and a plan that says where people go. The common rule of thumb &mdash; if the gap between flash and thunder is under 30 seconds, take shelter, and wait 30 minutes after the last thunder &mdash; exists because it is short enough to be remembered under pressure.'])}

${rule('If the plan does not say <b>who</b> decides and <b>at what number</b>, there is no plan &mdash; there is an intention to have one.')}

${xnote('Weather is the one production variable an audience already has a relationship with. People are unusually forgiving of a show that visibly respects the weather &mdash; a clear announcement, a real plan, staff who obviously rehearsed it &mdash; and unusually unforgiving of one that appears to be improvising, because the improvisation reads as a statement about how much their safety was worth. The plan is an experience decision as much as a technical one.')}

${S('Where this goes next', 'The calculators on this page',
  ['<a href="/tools/#wind">Wind load</a> gives the force and the overturning check. <a href="/tools/#dew">Dew point</a> gives the condensation margin on a surface. <a href="/tools/#derate">Cable derating</a> applies the temperature and bundling factors. All three are screening numbers: they tell you whether to have the conversation, not whether the thing stands up. Temporary demountable structures are designed to <a href="/standards/">the governing standards</a> by somebody competent to do it, and that is not a web form.'])}
`

  const script = `
${MATH_TABLES}
${MATH_SRC}
(function(){
  var v=document.getElementById('wf-v'), a=document.getElementById('wf-a');
  if(!v||!a)return;
  function draw(){
    var speed=Number(v.value), area=Number(a.value);
    document.getElementById('wf-v-v').textContent=speed+' m/s';
    document.getElementById('wf-a-v').textContent=area+' m\\u00b2';
    var r=windLoad(speed, area);
    if(!r)return;
    /* Both bars share one scale, pinned to the largest value THIS area can
       reach at the top of the speed slider. A fixed pixels-per-kilogram scale
       clips at high speeds, and two clipped bars sitting level would flatly
       contradict the caption underneath them. Rescaling per area keeps the
       speed slider showing the square law, which is the whole lesson. */
    var full=windLoad(30, area).gustForceKgf;
    var SCALE=120/Math.max(1, full);
    var h=Math.max(3, r.forceKgf*SCALE);
    var gh=Math.max(3, r.gustForceKgf*SCALE);
    var bar=document.getElementById('wf-bar'), gust=document.getElementById('wf-gust');
    bar.setAttribute('height',h); bar.setAttribute('y',176-h);
    gust.setAttribute('height',gh); gust.setAttribute('y',176-gh);
    gust.setAttribute('fill', r.gustForceKgf>800 ? 'var(--fail)' : 'var(--warn)');
    document.getElementById('wf-read').textContent=r.forceKgf;
    /* The sail leans with the wind, which is the only decorative part. */
    var sail=document.getElementById('wf-sail');
    if(sail)sail.style.transform='rotate('+Math.min(18, speed*0.6)+'deg)';
    document.getElementById('wf-out').innerHTML=
      '<b>'+r.forceKgf.toLocaleString()+'</b> kgf on the face at '+speed+' m/s (Beaufort '+r.beaufort.force+', '
      +r.beaufort.name.toLowerCase()+') &mdash; and <b>'+r.gustForceKgf.toLocaleString()+'</b> kgf in a '
      +r.gustSpeedMs+' m/s gust.<br>Double the speed to '+(speed*2)+' m/s and it becomes '
      +Math.round(windLoad(speed*2, area).forceKgf).toLocaleString()+' kgf &mdash; four times, not twice.';
  }
  v.addEventListener('input',draw); a.addEventListener('input',draw); draw();
})();
(function(){
  var t=document.getElementById('df-t'), h=document.getElementById('df-h'), s=document.getElementById('df-s');
  if(!t||!h||!s)return;
  function draw(){
    var temp=Number(t.value), rh=Number(h.value), surf=Number(s.value);
    document.getElementById('df-t-v').textContent=temp+' \\u00b0C';
    document.getElementById('df-h-v').textContent=rh+'%';
    document.getElementById('df-s-v').textContent=surf+' \\u00b0C';
    var r=dewPoint(temp, rh, {surfaceTempC:surf});
    if(!r)return;
    var out=document.getElementById('df-out');
    var head='Dew point <b>'+r.dewPointC+' &deg;C</b> &mdash; the air has '+r.spreadC+' &deg;C to give before it starts raining on the rig.';
    out.innerHTML = r.condensation.willCondense
      ? head+'<br>A surface at '+surf+' &deg;C is <b>'+Math.abs(r.condensation.marginC)
        +' &deg;C below</b> that. It will be wet. Warm it past '+r.safeSurfaceC+' &deg;C before powering it.'
      : head+'<br>A surface at '+surf+' &deg;C stays dry, with '+r.condensation.marginC+' &deg;C of margin.';
  }
  [t,h,s].forEach(function(el){el.addEventListener('input',draw)}); draw();
})();
`

  return shell({
    title: 'When the venue is a field — wind, water and heat outdoors | showstack',
    description: 'Wind force goes with the square of speed, air gives back its water on a schedule set by temperature rather than rain, and an IP rating describes a laboratory assembly rather than your deck at 4pm. The three outdoor facts that are worse than they look.',
    canonical: `${SITE}/learn/outdoors/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'When the venue is a field',
      url: `${SITE}/learn/outdoors/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
