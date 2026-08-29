/**
 * /learn/power/ — the supply, the earth, and the things that trip.
 *
 * There are four power calculators on /tools/ and nothing that explains why
 * their numbers behave the way they do. That is the wrong way round: a person
 * who has just been told their neutral is carrying more current than any of
 * the phases needs to know why before they need a number.
 *
 * The three things this page is for. Why a three-phase supply gives you more
 * than three times a single phase and then quietly takes some back. Why the
 * neutral on a rig full of LED fixtures is not the spare conductor it looks
 * like. And why a device that protects a cable and a device that protects a
 * person are not the same device, which is the misunderstanding that actually
 * hurts people.
 */
import { powerLoad, voltageDrop, phaseBalance, ohmsLaw } from './toolmath.mjs'
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

const MATH_SRC = [powerLoad, voltageDrop, phaseBalance, ohmsLaw].map((f) => f.toString()).join('\n\n')

export function learnPowerPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* Three phases are 120 degrees apart and the whole page rests on that, so the
   first figure rotates rather than sitting still: the sum of three balanced
   sinusoids really is zero, and watching it is more convincing than the
   assertion. */
@keyframes ph-sweep{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.phfig .rotor{animation:ph-sweep 6s linear infinite;transform-origin:150px 120px}
.phfig .vec{transform-origin:150px 120px}
@keyframes ph-trace{from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}
.phfig .wave{stroke-dasharray:1000;animation:ph-trace 6s linear infinite}
/* The neutral figure grows a bar as the third harmonic is dialled in. */
.harmfig .nbar{transition:height .35s ease,y .35s ease,fill .35s ease}
.harmfig .hwave{transition:d .3s ease}
/* An RCD is a balance, and the imbalance is the whole point. */
@keyframes rcd-leak{0%,55%{opacity:0}62%,100%{opacity:1}}
@keyframes rcd-trip{0%,68%{opacity:0}75%,100%{opacity:1}}
.rcdfig .leak{animation:rcd-leak 5s ease-in-out infinite}
.rcdfig .tripped{animation:rcd-trip 5s ease-in-out infinite}
.rcdfig .flow{stroke-dasharray:6 8;animation:rcd-flow 1.4s linear infinite}
@keyframes rcd-flow{to{stroke-dashoffset:-28}}
.ptable{width:100%;border-collapse:collapse;font-size:14px;margin:14px 0}
.ptable th{text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;
text-transform:uppercase;color:var(--ink-faint);padding:0 12px 9px 0;border-bottom:1px solid var(--rule);font-weight:400}
.ptable td{padding:11px 12px 11px 0;border-bottom:1px solid var(--rule);vertical-align:top;color:var(--ink-muted);line-height:1.55}
.ptable td:first-child{font-family:var(--mono);font-size:12.5px;color:var(--ink);white-space:nowrap}
.ptable td strong{color:var(--ink)}
`

  // ---- three phases, and why the neutral is usually quiet -----------------
  const phaseFig = `
<svg viewBox="0 0 620 250" role="img" class="phfig">
  <circle cx="150" cy="120" r="84" fill="none" stroke="var(--rule)" stroke-width="1.5"/>
  <g class="rotor">
    <line class="vec" x1="150" y1="120" x2="234" y2="120" stroke="var(--dom-safety)" stroke-width="3"/>
    <line class="vec" x1="150" y1="120" x2="108" y2="47" stroke="var(--accent2)" stroke-width="3" transform="rotate(0)"/>
    <line class="vec" x1="150" y1="120" x2="108" y2="193" stroke="var(--dom-network)" stroke-width="3"/>
    <circle cx="234" cy="120" r="5" fill="var(--dom-safety)"/>
    <circle cx="108" cy="47" r="5" fill="var(--accent2)"/>
    <circle cx="108" cy="193" r="5" fill="var(--dom-network)"/>
  </g>
  <circle cx="150" cy="120" r="4" fill="var(--ink-faint)"/>
  <text x="150" y="228" class="lbl" text-anchor="middle">120&deg; apart, always</text>
  <path class="wave" d="M290 120 q22 -55 44 0 t44 0 t44 0 t44 0 t44 0 t44 0"
        fill="none" stroke="var(--dom-safety)" stroke-width="2"/>
  <path class="wave" d="M290 120 q22 55 44 0 t44 0 t44 0 t44 0 t44 0 t44 0"
        fill="none" stroke="var(--accent2)" stroke-width="2" opacity=".85"/>
  <line x1="290" y1="120" x2="598" y2="120" stroke="var(--rule)" stroke-width="1.5"/>
  <line x1="290" y1="120" x2="598" y2="120" stroke="var(--ok)" stroke-width="3" opacity=".9"/>
  <text x="596" y="112" class="lbl" text-anchor="end">neutral: the sum, and it is zero</text>
  <text x="292" y="228" class="lbl">three sinusoids that cancel</text>
</svg>`

  // ---- the third harmonic, which does not cancel --------------------------
  const harmFig = `
<svg viewBox="0 0 620 230" role="img" class="harmfig" id="harm-fig">
  <line x1="40" y1="180" x2="590" y2="180" stroke="var(--rule)" stroke-width="1.5"/>
  <g>
    <rect x="70" y="80" width="52" height="100" rx="3" fill="var(--dom-safety)" opacity=".75"/>
    <rect x="140" y="80" width="52" height="100" rx="3" fill="var(--accent2)" opacity=".75"/>
    <rect x="210" y="80" width="52" height="100" rx="3" fill="var(--dom-network)" opacity=".75"/>
    <rect class="nbar" id="hf-nbar" x="300" y="176" width="52" height="4" rx="3" fill="var(--ok)"/>
    <text x="96" y="200" class="lbl" text-anchor="middle">L1</text>
    <text x="166" y="200" class="lbl" text-anchor="middle">L2</text>
    <text x="236" y="200" class="lbl" text-anchor="middle">L3</text>
    <text x="326" y="200" class="lbl" text-anchor="middle">N</text>
    <text x="96" y="70" class="lbl" text-anchor="middle" id="hf-l">32 A</text>
    <text x="326" y="70" class="lbl" text-anchor="middle" id="hf-n">0 A</text>
  </g>
  <text x="430" y="86" class="lbl">fundamental cancels in the neutral</text>
  <text x="430" y="108" class="lbl">the 3rd harmonic does not &mdash;</text>
  <text x="430" y="128" class="lbl">it arrives in phase on all three</text>
  <text x="430" y="148" class="lbl">and adds up instead</text>
</svg>`

  // ---- RCD: a balance, not a limit ----------------------------------------
  const rcdFig = `
<svg viewBox="0 0 620 220" role="img" class="rcdfig">
  <rect x="40" y="76" width="88" height="70" rx="6" fill="var(--surface-raised)" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <text x="84" y="116" class="lbl" text-anchor="middle">supply</text>
  <rect x="196" y="66" width="96" height="90" rx="6" fill="var(--surface-raised)" stroke="var(--signal)" stroke-width="2"/>
  <text x="244" y="100" class="lbl" text-anchor="middle">RCD</text>
  <text x="244" y="122" class="lbl" text-anchor="middle">compares</text>
  <circle cx="244" cy="140" r="7" fill="none" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <circle class="tripped" cx="244" cy="140" r="7" fill="var(--dom-safety)"/>
  <rect x="372" y="76" width="96" height="70" rx="6" fill="var(--surface-raised)" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <text x="420" y="116" class="lbl" text-anchor="middle">the fixture</text>
  <line class="flow" x1="128" y1="94" x2="196" y2="94" stroke="var(--dom-safety)" stroke-width="2.5"/>
  <line class="flow" x1="292" y1="94" x2="372" y2="94" stroke="var(--dom-safety)" stroke-width="2.5"/>
  <line class="flow" x1="372" y1="130" x2="292" y2="130" stroke="var(--ok)" stroke-width="2.5"/>
  <line class="flow" x1="196" y1="130" x2="128" y2="130" stroke="var(--ok)" stroke-width="2.5"/>
  <text x="150" y="82" class="lbl">out</text>
  <text x="150" y="150" class="lbl">back</text>
  <g class="leak">
    <line x1="420" y1="146" x2="420" y2="192" stroke="var(--warn)" stroke-width="2.5" stroke-dasharray="5 5"/>
    <text x="432" y="188" class="lbl" style="fill:var(--warn)">30 mA leaving through a person</text>
  </g>
  <text x="40" y="212" class="lbl">out and back must match. When they do not, the missing current found another way home.</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / power</div>
${learnNav(esc, 'power')}
<h2>Power, earth, and the things that trip</h2>
<p class="lede">A rig is a large, ugly, non-linear load that gets built in a day by people who did not design the building's supply. This is the arithmetic underneath that, and the two or three places where the obvious answer is wrong.</p>

${S('Why three', 'Three phases, and the conductor that usually does nothing',
  ['A three-phase supply is three alternating voltages of the same size, 120&deg; apart in time. That spacing is not an arbitrary convention &mdash; it is what lets three conductors carry three times the power of one while the return current cancels itself out. Add three equal sinusoids that are evenly spread around a cycle and the sum is exactly zero, at every instant, forever.',
   'That sum is what the neutral carries. On a perfectly balanced linear load the neutral carries nothing at all, which is why it can historically be the same size as a phase or smaller. It is also why an unbalanced rig is a real problem rather than an aesthetic one: whatever the three phases fail to cancel comes back down the neutral, and the neutral is the one conductor with no breaker in it.'])}

${fig(phaseFig, 'Three voltages 120&deg; apart. The vector sum is the neutral current, and on a balanced linear load it sits on zero.')}

${rule('A three-phase supply is rated <b>per phase</b>. A 63 A three-phase service is 63 A on each of three phases &mdash; not 21 A each, and not 189 A of anything you can put on one leg.')}

${S('The catch', 'The neutral is not the spare conductor it looks like',
  ['Everything above assumes the load is linear: current follows voltage, a sine in gives a sine back. Almost nothing on a modern rig does that. An LED fixture, a media server, a <a href="/hardware/">switch-mode amplifier</a> and a phase-control dimmer all draw current in bursts rather than smoothly, and a burst is a fundamental plus a stack of harmonics.',
   'Most harmonics still cancel in the neutral. The third does not, and neither does the ninth or the fifteenth &mdash; the <em>triplen</em> harmonics. At three times the fundamental frequency, the 120&deg; separation between phases becomes 360&deg;, which is no separation at all. All three phases deliver their third harmonic to the neutral in step, and instead of cancelling it adds arithmetically.',
   'The result is the one genuinely counter-intuitive thing about show power: a balanced rig full of LED fixtures can put more current down the neutral than any single phase is carrying. Published figures for LED drivers and electronic ballasts put current THD in the 15&ndash;40% range, which is why installations expecting heavy non-linear load size the neutral at up to 200% of the phase conductor rather than treating it as the small one.'])}

${fig(harmFig, 'Balanced phases, and a neutral that fills up anyway. Drag the third-harmonic content and watch what the return conductor is actually asked to carry.', 'harm-fig')}

<div class="dial">
  <div class="dialrow">
    <label for="hf-thd">Third-harmonic content</label>
    <input id="hf-thd" type="range" min="0" max="40" step="1" value="0">
    <output id="hf-thd-v">0%</output>
  </div>
  <div class="dialrow">
    <label for="hf-amps">Phase current (A)</label>
    <input id="hf-amps" type="range" min="10" max="63" step="1" value="32">
    <output id="hf-amps-v">32 A</output>
  </div>
  <div class="verdict" id="hf-out"></div>
</div>

${bites([
  'A neutral sized for a balanced linear load, feeding a rig that is neither. It does not trip, because nothing protects it &mdash; it just gets hot.',
  'Assuming a balanced rig means a quiet neutral. Balance fixes the fundamental. It does nothing at all about triplens.',
  'Measuring neutral current with a meter that only reads the fundamental, and concluding there is nothing there. True RMS or it is a guess.',
])}

${S('Putting a number on it', 'THD, and the two versions of it that disagree',
  ['Everything above describes what harmonics do. The number that measures how many there are is total harmonic distortion, and there are two of them, both called THD, which is why a meter and a datasheet can give different answers while both are correct.',
   '<strong>THD-F</strong> compares the harmonic content against the <em>fundamental</em> alone. <strong>THD-R</strong> compares it against the <em>total</em> RMS current. THD-F is the one usually meant in power work and it has no upper bound &mdash; a badly behaved load can exceed 100%, because the harmonics really can add up to more than the fundamental. THD-R can never pass 100% by construction. At low distortion they are nearly identical; at the levels a rig full of switch-mode supplies actually produces they are visibly different.',
   'The consequence people meet first is the power factor. Distortion alone drags true power factor down even when nothing is inductive and the current is perfectly in phase with the voltage &mdash; there is a <em>distortion</em> power factor of one over the square root of one plus THD-F squared, and it multiplies whatever the displacement factor is. That is how a rig of LED fixtures with no motors anywhere in it presents a poor power factor to a generator, draws more current than the wattage suggests, and makes the genset work harder than the load sheet says it should.',
   'And the other side of the same coin is <strong>crest factor</strong> &mdash; peak divided by RMS. A pure sine is 1.414. A switch-mode supply drawing in spikes near the voltage peak runs 2 to 3, and a generator or UPS sized on RMS alone will clip those peaks while its average reading sits comfortably inside its rating. It is the same distortion seen from the time domain instead of the frequency domain, and it is the reason a genset that is obviously big enough still misbehaves.'])}

${rule('Distortion costs you power factor with <b>nothing inductive present</b>, and costs you headroom in peaks a meter reading RMS will never show you. <a href="/tools/#thd">The calculator</a> does both, and the neutral current with them.')}

${S('Phase rotation', 'The one wiring fault that makes a hoist go the wrong way',
  ['The three phases arrive in an order. L1 peaks, then L2 a third of a cycle later, then L3 &mdash; and swapping any two of them reverses that order. Nothing about the supply looks different: the voltages are right, the phase-to-phase voltages are right, a meter is happy, single-phase loads down the line neither know nor care. Every heater, lamp and dimmer works perfectly on a supply with reversed rotation.',
   'A three-phase motor is not so relaxed. It turns in the direction the field rotates, and the field rotates in whatever order the phases arrive, so a motor on a reversed supply runs backwards. That is the whole fault, and on a touring rig it is attached to chain hoists. <strong>Up is down.</strong> The controller is fine, the pendant is fine, the labelling is fine, and the load goes the wrong way when somebody presses the button. This is why a rotation check is the first thing done on arrival at an unfamiliar supply, before anything is plugged into it, and why a phase rotation meter is in the electrician&rsquo;s bag rather than in a drawer at the shop.',
   'Two things make it likelier than it sounds. Generators and temporary supplies get terminated by hand, and a hand is what swaps two cores. And adaptors are a genuine hazard, because a badly made one, or a legitimately made crossover, changes rotation invisibly &mdash; the connector fits, the pins are live, the order is different. Which is also why some hoist controllers include phase reversal detection or an automatic rotation corrector, and why the ones that do not put the responsibility exactly where it was already.',
   'The connectors themselves try to help. On a Powerlock or a camlock set the sequence is fixed by the colours and by the order they are terminated; on a 16&nbsp;A or 32&nbsp;A three-phase CEE connector it is fixed by the pin positions, and some carry a rotatable insert specifically so a wrong rotation can be corrected at the plug with a screwdriver rather than by re-terminating a tail. None of that helps if the supply upstream is wrong, which is the case the meter exists for.'])}

${bites([
  '<b>Every load except the motors is happy on reversed rotation.</b> Nothing else in the rig will tell you, so the check has to be deliberate.',
  '<b>Check at the supply, and check again after any adaptor.</b> The point of failure is usually something between the supply and the distro, not the supply itself.',
  '<b>A generator that was right yesterday can be wrong today.</b> If it was re-terminated, re-fuelled by someone who moved cables, or swapped for another unit, it is an unfamiliar supply again.',
  '<b>Never fix rotation by swapping cores in a hoist tail.</b> Fix it at the source or at a purpose-made phase reversal adaptor, so the next person to plug in there meets the same supply you did.',
])}

${S('Two different jobs', 'A breaker protects the cable. An RCD protects the person.',
  ['These get conflated constantly and they are not the same device doing the same thing at different sensitivities. A circuit breaker watches the current in the circuit and opens when it exceeds what the <em>cable</em> can carry without cooking. That threshold is tens of amps, because that is what melts insulation. A person is in serious trouble at a small fraction of one amp, so a breaker sized to protect a cable offers a person essentially nothing.',
   'A residual current device does something else entirely. It does not care how much current is flowing; it compares the current going out with the current coming back. On a healthy circuit those match exactly. If they do not, the difference left by another route, and the most common other route is through somebody standing on damp ground holding a piece of metal.',
   'The numbers are the point. A 30&nbsp;mA RCD provided for additional protection has to operate within 40&nbsp;ms at five times its rating, and within 300&nbsp;ms at its rated residual current. Those times are chosen against what a heart will tolerate, not against what a cable will.'])}

${fig(rcdFig, 'An RCD is a comparison, not a limit. Out and back have to match; the current that does not come back went somewhere.')}

<table class="ptable">
  <tr><th>Device</th><th>What it watches</th><th>What it is protecting</th></tr>
  <tr><td><strong>MCB</strong></td><td>Current in the circuit, against a time curve</td><td>The cable, from overload and short circuit. Not you.</td></tr>
  <tr><td><strong>RCD</strong></td><td>The difference between out and back</td><td>A person, from current finding a path to earth through them.</td></tr>
  <tr><td><strong>RCBO</strong></td><td>Both, in one module</td><td>Both &mdash; and it drops one circuit instead of the whole board.</td></tr>
  <tr><td><strong>Type AC</strong></td><td>Sinusoidal residual current only</td><td>Legacy loads. Blind to the DC components modern electronics can leak.</td></tr>
  <tr><td><strong>Type A</strong></td><td>Sinusoidal plus pulsating DC residual</td><td>Nearly everything on a modern rig, which is why it is the sensible default.</td></tr>
  <tr><td><strong>Type B</strong></td><td>Plus smooth DC residual</td><td>Drives, EV charging, some large PSUs. Rare on a rig, essential where required.</td></tr>
</table>

${rule('One RCD covering a whole rig means one fault takes the whole rig. That is a design decision about <b>what a fault costs you</b>, and it belongs in the plan rather than in the moment it happens.')}

${S('Down the cable', 'Volt drop is a length problem, not a load problem',
  ['Every conductor has resistance, and every amp pushed through it loses some voltage on the way. Over a 3&nbsp;m tail it is nothing. Over 120&nbsp;m of trailing socket to a stage-left position it is the reason a moving light browns out on a colour change while the console reports everything as fine.',
   'The arithmetic is Ohm&rsquo;s law twice: the drop is current times the loop resistance of the run, and the loop is both directions, so a 60&nbsp;m run is 120&nbsp;m of copper. Doubling the length doubles the drop; doubling the cross-section roughly halves it.',
   'What makes it a rigging problem rather than a maths problem is that the load is not constant. A fixture that dips its voltage when the motor moves and the lamp strikes at the same time is drawing peak current exactly when it can least afford the drop.'])}

${bites([
  'Sizing the cable for the steady-state draw and forgetting inrush. A rack of switch-mode supplies &mdash; or a shelf of <a href="/protocols/poe/">PoE</a> switches &mdash; energising together pulls a large multiple of running current for a few cycles &mdash; enough to trip a Type B breaker that would have held all night.',
  'A long run at a small cross-section that measures fine cold and sags once everything is warm and running.',
  'Daisy-chained distro where the drop is cumulative and nobody adds it up.',
])}

${xnote('Nothing on this page is felt by an audience directly, and that is exactly the point of it. Power is the only layer in the whole chain whose success condition is that nobody ever notices it &mdash; every other stage is trying to produce an effect, and this one is trying to produce nothing at all. A brownout on a colour change, a dimmer buzz under a quiet scene, a house-light flicker during a blackout: these are not lighting failures, they are power failures wearing a lighting costume, and they break an illusion that took an hour to build.')}

${S('Where the numbers live', 'The calculators, and what they assume',
  ['<a href="/tools/#power">Power load</a> converts between kW, amps and phases. <a href="/tools/#vdrop">Voltage drop</a> takes a length and a cross-section. <a href="/tools/#phase">Phase balance</a> shows what the neutral is carrying when the legs are uneven. <a href="/tools/#ohm">Ohm&rsquo;s law</a> is there for the moment you need it and cannot remember which way round it goes.',
   'All four run the same arithmetic the test suite checks. None of them knows your local wiring regulations, your supply impedance, or what the venue actually installed behind the panel, and none of them is a substitute for a competent person with a meter.'])}
`

  const script = `
${MATH_SRC}
(function(){
  var thd=document.getElementById('hf-thd'), amps=document.getElementById('hf-amps');
  if(!thd||!amps)return;
  function draw(){
    var h=Number(thd.value), a=Number(amps.value);
    document.getElementById('hf-thd-v').textContent=h+'%';
    document.getElementById('hf-amps-v').textContent=a+' A';
    /* Triplen harmonics arrive in phase on all three legs, so the neutral
       carries three times the per-phase third-harmonic current. */
    var third=a*(h/100);
    var neutral=3*third;
    var bar=document.getElementById('hf-nbar');
    var full=100, px=Math.min(full, (neutral/63)*full*1.6);
    bar.setAttribute('height', Math.max(4,px));
    bar.setAttribute('y', 180-Math.max(4,px));
    bar.setAttribute('fill', neutral>a ? 'var(--warn)' : 'var(--ok)');
    document.getElementById('hf-l').textContent=a+' A';
    document.getElementById('hf-n').textContent=Math.round(neutral)+' A';
    var v=document.getElementById('hf-out');
    if(neutral>a) v.innerHTML='Neutral is carrying <b>'+Math.round(neutral)+' A</b> &mdash; more than any phase, on a perfectly balanced rig. Nothing protects that conductor.';
    else if(neutral>0) v.innerHTML='Neutral is carrying <b>'+Math.round(neutral)+' A</b> from triplens alone, with the fundamental fully cancelled.';
    else v.innerHTML='Balanced and linear: the neutral carries <b>nothing</b>. This is the case almost nothing on a rig actually is.';
  }
  thd.addEventListener('input',draw); amps.addEventListener('input',draw); draw();
})();
`

  return shell({
    title: 'Power, earth and the things that trip | showstack',
    description: 'Why a three-phase neutral can carry more than any phase, why a breaker protects the cable and an RCD protects the person, and where voltage drop actually comes from.',
    canonical: `${SITE}/learn/power/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Power, earth and the things that trip',
      url: `${SITE}/learn/power/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
