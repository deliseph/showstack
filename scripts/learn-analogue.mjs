/**
 * /learn/analogue/ — the systems that ran shows before there was a computer
 * in anything, and the components they were built from.
 *
 * This site is thoroughly digital and the industry is not. There are analogue
 * consoles still in service, analogue amplifiers in every rack, and an entire
 * generation of technicians who learned the trade on gear with no processor
 * anywhere in it. More usefully: every digital thing here still has an
 * analogue layer underneath, and the failures that are hardest to diagnose
 * live in it.
 *
 * Four things this page is for.
 *
 * What the components actually do, because resistor, capacitor, transformer
 * and transistor is a vocabulary that gets used constantly around people who
 * were never taught it.
 *
 * How an analogue console controlled a rig with no memory and no computer,
 * which is a genuinely clever answer and explains why DMX looks the way it
 * does.
 *
 * How an amplifier is built, which is one idea — a small signal steering a
 * big current — dressed in different clothes.
 *
 * And storage: tape, vinyl, and the optical family, where CD, DVD and
 * Blu-ray are the same disc holding wildly different amounts for a reason
 * that is pure physics and calculable.
 */
import { opticalSpot, rcFilter, transformer } from './toolmath.mjs'
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

const MATH_SRC = [opticalSpot, rcFilter, transformer].map((f) => f.toString()).join('\n\n')

export function learnAnaloguePage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* A charging capacitor, drawn as the curve it actually follows. */
/* One half cycle of the mains, with the firing point sweeping. The conducting
   part is revealed by an animated clip, so the lamp gets brighter as the
   thyristor fires earlier - which is the whole of phase-angle dimming. */
/* The clip rect and the marker share one keyframe, so the shaded edge and the
   line that names it can never drift apart. A percentage inset cannot do that:
   it resolves against each element's own box, which is how the first version
   ended up marking the firing point 80px from where the shading started. */
@keyframes thy-slide{0%,100%{transform:translateX(0)}50%{transform:translateX(-196px)}}
@keyframes thy-lamp{0%,100%{opacity:.22}50%{opacity:1}}
@keyframes thy-edge{0%,100%{opacity:.35}50%{opacity:1}}
.thyfig .cliprect,.thyfig .mark{animation:thy-slide 4.6s ease-in-out infinite}
/* A base opacity matching the firing angle the figure freezes at, so the
   reduced-motion reader does not see a late firing point next to a lamp at
   full brightness. The keyframes override it whenever motion is allowed. */
.thyfig .lamp{opacity:.34;animation:thy-lamp 4.6s ease-in-out infinite}
.thyfig .edge{animation:thy-edge 4.6s ease-in-out infinite}
@keyframes rc-charge{from{stroke-dashoffset:400}to{stroke-dashoffset:0}}
.rcfig .curve{stroke-dasharray:400;animation:rc-charge 4s ease-out infinite}
@keyframes rc-mark{0%,55%{opacity:0}70%,100%{opacity:1}}
.rcfig .mark{animation:rc-mark 4s ease-out infinite}
/* Three discs, three spots, same physical disc. */
.discfig .spot{transition:r .3s ease}
.parts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:12px;margin:16px 0}
.part{border:1px solid var(--rule);border-radius:var(--r-md);padding:15px 17px;background:var(--surface-raised)}
.part b{display:block;font-size:15px;color:var(--ink);margin-bottom:4px}
.part i{display:block;font-style:normal;font-family:var(--mono);font-size:11px;letter-spacing:.4px;
text-transform:uppercase;color:var(--ink-faint);margin-bottom:8px}
.part p{margin:0;color:var(--ink-muted);font-size:14px;line-height:1.55}
/* A second paragraph in a card is the caveat on the first, so it needs its
   own space and a step down in weight. .part p is margin:0, so without
   this the two run together into one block. */
.part p + p{margin-top:9px;color:var(--ink-faint);font-size:13.4px}
.atable{width:100%;border-collapse:collapse;font-size:14px;margin:14px 0}
.atable th{text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;
color:var(--ink-faint);padding:0 12px 9px 0;border-bottom:1px solid var(--rule);font-weight:400}
.atable td{padding:11px 12px 11px 0;border-bottom:1px solid var(--rule);vertical-align:top;
color:var(--ink-muted);line-height:1.55}
.atable td:first-child{font-family:var(--mono);font-size:12.5px;color:var(--ink);white-space:nowrap}
.atable td strong{color:var(--ink)}
.tblscroll{overflow-x:auto;margin:14px 0}
`

  const rcFig = `
<svg viewBox="0 0 620 220" role="img" class="rcfig">
  <line x1="60" y1="170" x2="580" y2="170" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <line x1="60" y1="30" x2="60" y2="170" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <line x1="60" y1="45" x2="580" y2="45" stroke="var(--rule)" stroke-width="1.5" stroke-dasharray="5 5"/>
  <text x="584" y="42" class="lbl" text-anchor="end">supply voltage</text>
  <path class="curve" d="M60 170 C 130 170 150 80 210 62 C 290 47 400 46 580 45"
        fill="none" stroke="var(--signal)" stroke-width="2.5"/>
  <g class="mark">
    <line x1="150" y1="91" x2="150" y2="170" stroke="var(--accent2)" stroke-width="1.5" stroke-dasharray="4 4"/>
    <circle cx="150" cy="91" r="5" fill="var(--accent2)"/>
    <text x="158" y="112" class="lbl" style="fill:var(--accent2)">one time constant &mdash; 63% of the way</text>
  </g>
  <text x="150" y="188" class="lbl" text-anchor="middle">&tau; = RC</text>
  <text x="330" y="188" class="lbl" text-anchor="middle">3&tau; &mdash; 95%</text>
  <text x="480" y="188" class="lbl" text-anchor="middle">5&tau; &mdash; 99%</text>
  <text x="60" y="212" class="lbl">The same two components are a filter in the frequency domain and a delay in the time domain. One fact, two views.</text>
</svg>`


  const thyFig = `
<svg viewBox="0 0 560 208" role="img" class="thyfig">
  <defs>
    <clipPath id="thy-cut" clipPathUnits="userSpaceOnUse">
      <rect class="cliprect" x="236" y="0" width="220" height="208"/>
    </clipPath>
  </defs>

  <text x="40" y="24" class="lbl">one half cycle of the mains</text>
  <line x1="40" y1="150" x2="330" y2="150" stroke="var(--rule)" stroke-width="1.5"/>

  <path d="M40 150 C104 46 226 46 290 150" fill="none" stroke="var(--rule-strong)"
        stroke-width="1.5" stroke-dasharray="4 4"/>

  <g clip-path="url(#thy-cut)">
    <path d="M40 150 C104 46 226 46 290 150 Z" fill="var(--accent2)" fill-opacity=".24"/>
    <path d="M40 150 C104 46 226 46 290 150" fill="none" stroke="var(--accent2)" stroke-width="2.5"/>
  </g>

  <g class="mark">
    <line class="edge" x1="236" y1="52" x2="236" y2="160" stroke="var(--fail)" stroke-width="2"/>
    <!-- to the right of the line: the marker travels left, and an end-anchored
         label would run off the canvas at the far end of its sweep -->
    <text x="244" y="46" class="lbl" style="fill:var(--fail)">fires here</text>
  </g>

  <text x="40" y="186" class="lbl">the shaded part is all the lamp ever gets</text>

  <circle cx="452" cy="92" r="30" fill="none" stroke="var(--rule-strong)" stroke-width="1.5"/>
  <circle class="lamp" cx="452" cy="92" r="26" fill="var(--accent2)"/>
  <line x1="452" y1="122" x2="452" y2="146" stroke="var(--rule-strong)" stroke-width="2"/>
  <line x1="432" y1="146" x2="472" y2="146" stroke="var(--rule-strong)" stroke-width="2"/>
  <text x="452" y="186" class="lbl" text-anchor="middle">fire earlier, more light</text>
  <text x="452" y="24" class="lbl" text-anchor="middle">repeats every half cycle</text>
</svg>`

  const discFig = `
<svg viewBox="0 0 620 210" role="img" class="discfig">
  <g>
    <circle cx="130" cy="95" r="62" fill="none" stroke="var(--rule-strong)" stroke-width="1.5"/>
    <circle cx="130" cy="95" r="11" fill="var(--surface-sunken)" stroke="var(--rule-strong)"/>
    <circle class="spot" cx="130" cy="46" r="17" fill="color-mix(in srgb,var(--fail) 45%,transparent)" stroke="var(--fail)" stroke-width="1.5"/>
    <text x="130" y="180" class="val" text-anchor="middle">CD</text>
    <text x="130" y="198" class="lbl" text-anchor="middle">780 nm &middot; 2.1 &micro;m spot</text>
  </g>
  <g>
    <circle cx="310" cy="95" r="62" fill="none" stroke="var(--rule-strong)" stroke-width="1.5"/>
    <circle cx="310" cy="95" r="11" fill="var(--surface-sunken)" stroke="var(--rule-strong)"/>
    <circle class="spot" cx="310" cy="46" r="10.6" fill="color-mix(in srgb,var(--warn) 45%,transparent)" stroke="var(--warn)" stroke-width="1.5"/>
    <text x="310" y="180" class="val" text-anchor="middle">DVD</text>
    <text x="310" y="198" class="lbl" text-anchor="middle">650 nm &middot; 1.3 &micro;m spot</text>
  </g>
  <g>
    <circle cx="490" cy="95" r="62" fill="none" stroke="var(--rule-strong)" stroke-width="1.5"/>
    <circle cx="490" cy="95" r="11" fill="var(--surface-sunken)" stroke="var(--rule-strong)"/>
    <circle class="spot" cx="490" cy="46" r="4.7" fill="color-mix(in srgb,var(--signal) 55%,transparent)" stroke="var(--signal)" stroke-width="1.5"/>
    <text x="490" y="180" class="val" text-anchor="middle">Blu-ray</text>
    <text x="490" y="198" class="lbl" text-anchor="middle">405 nm &middot; 0.58 &micro;m spot</text>
  </g>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / analogue</div>
${learnNav(esc, 'analogue')}
<h2>Before there was a computer in it</h2>
<p class="lede">Every digital thing on this site still has an analogue layer underneath, and the faults that are hardest to diagnose live in it. This is what the components actually do, how a console controlled a rig with no memory and no processor, and why three identical-looking discs hold 0.7, 4.7 and 25 gigabytes.</p>

${S('The word', 'What analogue actually means',
  ['Analogue means one physical quantity standing in for another, continuously and proportionally. A microphone diaphragm moves the way the air moved; the voltage it produces varies the way the diaphragm moved. The voltage is an <em>analogue</em> of the sound, and at no point is it a number.',
   'That is the whole difference, and both consequences follow from it directly. An analogue signal has infinite resolution in principle &mdash; there is no step size, no smallest change &mdash; and it has no error correction whatever, because every imperfection the wire adds is indistinguishable from signal. Noise accumulates at every stage and never comes back off. A digital signal has a step size you chose and a floor you designed, and it either arrives intact or it does not.',
   'Which is better depends entirely on what you are protecting. Copy an analogue tape ten times and you have a recognisably worse tape. Copy a file ten times and you have the same file. But an analogue system degrades <em>gracefully</em> &mdash; it gets noisy, then noisier, and stays usable a long way down &mdash; where a digital one works perfectly and then stops, which is the cliff <a href="/learn/timecode/">every digital link on this site</a> has in it somewhere.'])}

${rule('Analogue trades <b>accumulating noise for graceful failure</b>. Digital trades <b>a designed floor for a cliff</b>. Neither is a better idea; they fail in opposite directions.')}

${S('The parts', 'Five components, and what each one is actually for',
  ['Resistor, capacitor, inductor, diode, transistor. Almost everything else is a combination of those, and each one does one thing.'])}

<div class="parts">
  <div class="part"><i>Resistor</i><b>Turns voltage into current</b>
    <p>V = IR, and everything else follows. Two in series make a <b>voltage divider</b> &mdash; the output is the input times the lower resistance over the total &mdash; and that is the single most reused circuit there is: it is what a fader is, what sets an amplifier&rsquo;s gain from its feedback path, and how almost every sensor is read. It also turns the difference into heat, which is why the value and the wattage are two separate specifications.</p><p>A divider is only accurate while nothing much is drawn from its output. Load it and the lower leg has company, the ratio moves, and a reading drifts for no visible reason.</p></div>
  <div class="part"><i>Capacitor</i><b>Stores charge, blocks DC</b>
    <p>Two plates that cannot pass a steady voltage but happily pass a changing one. That single property makes it a coupling element between stages, a filter with a resistor, and the reservoir that holds a power supply up between mains peaks.</p></div>
  <div class="part"><i>Inductor &amp; transformer</i><b>Stores energy in a field</b>
    <p>Opposes a change in current, which is a capacitor&rsquo;s behaviour turned around. Wind two on one core and you have a transformer: voltage follows the turns ratio, impedance follows its <em>square</em>, and there is no electrical connection at all &mdash; which is how it breaks a ground loop.</p></div>
  <div class="part"><i>Diode</i><b>A one-way valve</b>
    <p>Current one way and not the other. Four of them turn AC into DC; one across a relay coil absorbs the spike that would otherwise destroy whatever switched it. It also drops a fixed voltage doing it, which is why a rectifier runs warm.</p></div>
  <div class="part"><i>Transistor</i><b>A small current steering a big one</b>
    <p>The whole of electronics in one sentence. A tiny base current controls a much larger collector current, and that ratio is amplification. NPN and PNP are the same device with the polarities reversed, which is why they appear in pairs either side of a signal.</p></div>
  <div class="part"><i>Op-amp</i><b>Gain so high you throw it away</b>
    <p>Not a component so much as a building block: a differential amplifier with enormous gain, wrapped in feedback so the <em>resistors</em> decide what the circuit does and the chip&rsquo;s own imprecision stops mattering. Almost every analogue console channel is a handful of these.</p></div>
</div>

${S('One resistor and one capacitor', 'The most useful circuit in the trade',
  ['Put a resistor and a capacitor together and you have a filter, a delay, a de-bounce, and the tone control on every analogue console ever built. Two equations describe it and they are the same fact seen twice.',
   'In the time domain the capacitor charges through the resistor on a curve, reaching 63% of the way in one <em>time constant</em> &mdash; <span class="mono">&tau; = RC</span> &mdash; then 95% in three and 99% in five. That is how long a mute ramp takes, how long a de-bounce holds off a bouncing switch contact, and how long a power supply holds up when the mains dips.',
   'In the frequency domain the same two components have a corner at <span class="mono">f = 1 / 2&pi;RC</span>, where the capacitor&rsquo;s reactance equals the resistance. Below it the signal passes, above it the slope is 6&nbsp;dB per octave, and stacking another stage adds another 6. Every analogue EQ on every console is networks of these, and every filter slope you have ever specified in a processor is counting poles.'])}

${fig(rcFig, 'One time constant is 63% of the way, whatever the values are.')}

${S('The console', 'How a rig was controlled with no memory and no processor',
  ['An analogue lighting console has no computer in it, and the way it worked is genuinely clever rather than merely primitive.',
   'Each fader is a potentiometer &mdash; a resistor with a sliding tap &mdash; producing a control voltage, usually 0 to 10 volts, and that voltage runs down its own wire to its own dimmer. One conductor per channel, all the way. A 48-way rig meant a 48-core cable, and the reason multicore looms were as thick as an arm is that there was no other way to do it.',
   'Memory is where it gets interesting, because there is none. What a two-preset console has instead is <em>two complete banks of faders</em> and a crossfader between them. The operator sets the next state on the inactive bank while the current one is live, then crossfades. The crossfader is a dual-gang potentiometer wired so one half fades up as the other fades down &mdash; the cue stack is physical, the memory is the operator&rsquo;s hands, and the fade is a resistance changing.',
   'Then the cable became the problem, and the answer was multiplexing: send the channels one after another down one pair instead of all at once down many. Analogue multiplexing came first (AMX192, D54), sampling each channel in turn as a voltage. Digital multiplexing followed and won, because once you are sending them in sequence anyway you may as well send numbers, which do not degrade. <a href="/learn/dmx/">DMX512</a> is that idea and nothing more: 512 numbers in a row, over and over, on one pair.'])}

${S('The dimmer', 'Three ways to make a lamp half bright, two of them obsolete',
  ['The console sent a control voltage. Something had to turn that into less light, and the three answers in order are a good short history of the whole trade, because each one solves the previous one&rsquo;s worst problem and introduces its own.',
   '<strong>The resistance dimmer</strong> is a variable resistor in series with the lamp. It works, and it is terrible: the power you take away from the lamp does not vanish, it comes out of the dimmer as heat. A 1&nbsp;kW lamp at half brightness means several hundred watts being burned in a box backstage, which is why resistance boards lived in their own room and why the operator worked in the heat. Worse, it is <em>load dependent</em>. A resistance dimmer built for a 1000&nbsp;W lamp given a 500&nbsp;W one will not black out, because the two resistances now divide the voltage differently. You matched the dimmer to the lamp or you did not get a fade. The portable version, a rack of these on a frame with a row of levers along the top, is the <em>piano board</em>, and the name is purely about the shape of the thing you stood at.',
   '<strong>The autotransformer dimmer</strong> &mdash; a Variac, a tapped winding with a sliding brush &mdash; fixed both faults at once. It transforms rather than burns, so it is efficient and runs cool, and because it varies the voltage rather than dividing it, it is load independent: any lamp within its rating fades properly. What it is instead is <em>enormous</em>. One iron-cored transformer per channel, each the size of a paint tin, which is why a 60-way autotransformer board is a piece of furniture and why they were operated by hand, sometimes with mechanical linkages so one lever could move several.',
   '<strong>The thyristor dimmer</strong> is what replaced both and what almost every dimmer still is. It does not reduce the voltage at all &mdash; it switches the mains on partway through each half cycle and lets the rest through, so the lamp sees a chopped waveform and averages it. Cheap, small, load independent, and controllable by a tiny signal, which is what made a remote console with hundreds of channels practical.',
   'And it introduced the problems we still have. Chopping the waveform generates harmonics, the third among them, which is a triplen &mdash; and triplens do not cancel in a three-phase neutral, they <a href="/learn/power/">add up in it</a>. It also makes the filament move: the sudden switch-on each half cycle is a mechanical shock, which is filament sing, and the choke in every dimmer exists to slow that edge down. A dimmer that buzzes has a choke doing its job; a lamp that buzzes has one that is not big enough.'])}

${fig(thyFig, 'It never reduces the voltage. It waits, then lets the rest of each half cycle through, and the lamp averages what it gets. That abrupt start is the harmonics and the filament sing, both.')}

${bites([
  '<b>A resistance dimmer will not black out an undersized lamp.</b> If it is on a historic rig and it will not go to zero, check the lamp wattage against the dimmer before assuming a fault.',
  '<b>Thyristor dimmers need a minimum load.</b> Put an LED lamp on a dimmer channel and it may flicker, glow when off, or nothing at all, because there is not enough current to hold the thyristor on.',
  '<b>Filament sing is the choke, not the lamp.</b> Slower rise time means quieter filament and more harmonics filtered; that is the whole trade a dimmer choke makes.',
  '<b>Sine-wave dimmers exist</b> and solve the harmonics and the sing by reconstructing a real sine at reduced amplitude. They cost and weigh what you would expect.',
])}

${S('The VCA', 'A fader that carries no audio at all',
  ['The audio console has its own version of the same problem: how one hand controls many things without the signal having to go through that hand.',
   'A <strong>voltage-controlled amplifier</strong> is a gain stage whose gain is set by a control voltage rather than by a knob in the signal path. Once you have that, the fader stops being part of the audio circuit and becomes a source of DC. It is a control surface in the literal sense, decades before that phrase existed.',
   'That is what a VCA group is, and it is why it is not a subgroup. A <em>subgroup</em> sums the audio of several channels into one bus and gives you a fader on the sum. A <em>VCA group</em> sums nothing: the channels stay on their own paths and the group fader simply adds an offset to each channel&rsquo;s control voltage. Pull a VCA group down and each channel&rsquo;s own fader moves in effect but not in fact, all their sends and inserts scale with them, and the audio never met an extra amplifier.',
   'The practical difference shows up the moment you use a post-fade send. On a subgroup, a reverb send taken from the channel is unaffected by the group fader, because the audio has already left. On a VCA, it follows, because the channel gain itself moved. Every digital console still models this distinction and still calls them by these names, which is why the vocabulary of a 1975 console is worth knowing on a 2025 one.'])}

${bites([
  '<b>0&ndash;10&nbsp;V is still out there.</b> Architectural dimming, some house lights and a lot of installed kit still take an analogue control voltage, and a DMX-to-0-10V gateway is a normal thing to need.',
  '<b>A pot is a wear part.</b> Faders get dirty and scratchy because they are a physical wiper on a resistive track. A channel that crackles when moved is mechanical, not electronic.',
  '<b>Analogue multiplexing had no error checking at all.</b> AMX192 corrupted silently under interference. Half the reason DMX feels reliable is simply that it is digital.',
  '<b>One wire per channel means one fault per channel.</b> The great advantage of the old way was that a fault took out exactly one dimmer, which is a diagnostic luxury nobody has any more.',
])}

${S('The amplifier', 'One idea in three sets of clothes',
  ['An amplifier is a small signal controlling a much larger current from the power supply. The signal does not get bigger; it steers something bigger. What separates the classes is <em>how</em> the output devices are driven, and it is entirely a bargain about heat.',
   '<strong>Class A</strong> keeps the output devices conducting all the time, over the whole waveform. Beautifully linear and appallingly inefficient &mdash; well under a third of the power drawn reaches the loudspeaker and the rest is heat, at idle as much as at full output.',
   '<strong>Class AB</strong> splits the waveform between two devices, one handling the positive half and one the negative, with a small overlap so neither switches off exactly at the crossing point. That overlap is the point: without it you get crossover distortion right where the signal is quietest and the ear is most sensitive. Efficiency around 50 to 60%, and it was the standard for touring amplifiers for decades.',
   '<strong>Class D</strong> is not analogue in the middle at all. The output devices are switched fully on or fully off at a high frequency, with the <em>proportion</em> of on-time following the signal, and a passive filter at the output turns that back into a waveform. A device that is fully on or fully off dissipates very little, so efficiency runs past 90% &mdash; which is why modern amplifiers are a fraction of the weight and why an amp rack no longer needs its own air conditioning.',
   'All three still put a fixed voltage across a load through some output impedance, which is why the <a href="/tools/#spkz">speaker impedance</a> arithmetic is the same whatever the class, and why halving the load impedance still asks the supply for twice the current.'])}

${S('Inside the output stage', 'Push-pull, damping factor, slew rate, and which number on the sheet is lying to you',
  ['&ldquo;Two devices, one per half of the waveform&rdquo; has a name: a <strong>push-pull</strong> output stage. One device sources current into the load on the positive half, the other sinks it on the negative. They are almost always the complementary pair the components section named &mdash; an NPN and a PNP, or their MOSFET equivalents &mdash; and the bias current through both at the crossing point is the single adjustment that separates a clean amplifier from a harsh one.',
   'Which device type matters more than the marketing suggests. A <strong>bipolar</strong> output device is driven by current and gets <em>more</em> conductive as it heats, so it will run away and destroy itself unless something watches its temperature and pulls the bias back. That something is a bias servo, usually a transistor bolted to the same heatsink, and it is a real failure point on old amplifiers. A <strong>MOSFET</strong> is driven by voltage and, in the region amplifiers use, gets <em>less</em> conductive as it heats, so it self-limits. That is why MOSFET outputs are more thermally forgiving and why they took over the touring market.',
   '<strong>Damping factor</strong> is the number most often quoted and most often meaningless. It is just the load impedance divided by the amplifier&rsquo;s output impedance, and it describes how firmly the amplifier can resist the voltage a moving cone generates back into it. A figure of 500 sounds authoritative. Then you put 30&nbsp;m of cable between the two, and the cable&rsquo;s own resistance is in series with the amplifier&rsquo;s, so the damping factor the driver actually experiences is 8 divided by (the output impedance plus the cable), which for a couple of tenths of an ohm collapses 500 to something in the tens. <em>The cable sets the damping factor, not the amplifier.</em> That is the whole argument for short speaker runs and fat conductors, and the <a href="/tools/#vdrop">voltage drop</a> calculator is the same arithmetic.',
   '<strong>Slew rate</strong> is how many volts the output can move in a microsecond. Too low and a fast transient comes out as a ramp rather than an edge, which is not the same distortion as clipping and sounds like smearing rather than hardness. It is rarely the limit on a modern amplifier and it is worth knowing the word, because it is the one specification that describes a failure in <em>time</em> rather than in level.'])}

${bites([
  '<b>Bridging halves the load the amplifier sees.</b> Two channels bridged into 8 ohms is each channel working into 4. Bridging into 4 asks each for 2, which most amplifiers will not survive.',
  '<b>A damping factor over about 50 is a specification, not a benefit.</b> The cable has already decided.',
  '<b>Class D output filters are tuned for a load.</b> Some designs misbehave into an impedance far from what they expect, which is one reason a long high-impedance line is not just a longer cable.',
  '<b>Crossover distortion rises as the signal gets quieter.</b> It is a bias fault, it is worst where the ear is most sensitive, and it does not show up in a full-power THD figure at all.',
])}

<div class="tryit">
  <div class="f"><label for="af-r">Resistance <span id="af-rv">10 kΩ</span></label>
    <input id="af-r" type="range" min="1" max="100" value="10"></div>
  <div class="f"><label for="af-c">Capacitance <span id="af-cv">100 nF</span></label>
    <input id="af-c" type="range" min="1" max="1000" value="100"></div>
</div>
<div class="readout" id="af-out" role="status" aria-live="polite"></div>

${S('Storage', 'Tape, vinyl, and three discs that look identical',
  ['Recording is the other half of the analogue story, and each medium is a different physical trick.',
   '<strong>Tape</strong> is magnetic domains in an oxide coating, aligned by a recording head as the tape passes it. The signal is continuous, so tape has the analogue signature exactly: lovely graceful saturation when pushed, and a noise floor that gets worse with every generation of copying. Capacity is linear density times track count times length, which is why a wider tape running faster sounded better and cost more of everything.',
   '<strong>Vinyl</strong> is a groove whose wiggle is a direct mechanical analogue of the waveform &mdash; the most literal analogue medium there is. You can see the signal with a microscope.',
   '<strong>Optical discs</strong> are where it gets calculable, and where the answer to &ldquo;why does a Blu-ray hold more than a CD&rdquo; is genuinely satisfying. All three are the same 120&nbsp;mm polycarbonate disc, spun the same way, read by a laser that follows a spiral of pits. What changed is <em>how small a spot the optics can focus</em>, and that cannot beat diffraction: <span class="mono">spot &asymp; 1.22 &lambda; / NA</span>.',
   'Infrared to red to blue-violet takes the wavelength from 780 to 650 to 405&nbsp;nm, and the numerical aperture rose from 0.45 to 0.60 to 0.85. Both help, and together they take the spot from about 2.1&nbsp;&micro;m to 0.58&nbsp;&micro;m. Density goes with the <em>square</em> of that, because a disc is a surface &mdash; about 13&times;. But capacity actually rose about 36&times;, and the missing factor of 2.7 is not physics at all. It is coding: better modulation, better error correction, more of the disc used. The optics gave one factor and the mathematics gave another.'])}

${fig(discFig, 'Same disc, same spin. The spot is what changed, and area goes with its square.')}

${S('Why an old tape sounds wrong', 'Three faults that are not the recording, and one that is not EQ',
  ['If you are ever handed a reel and asked to get the show audio off it, four things account for nearly every complaint, and only one of them is the tape being old.',
   '<strong>Azimuth</strong> is the angle of the head gap relative to the tape&rsquo;s direction of travel, and it should be exactly perpendicular. If the machine that recorded and the machine playing back disagree even slightly, the top of the track is read a fraction of a moment before the bottom, so high frequencies partly cancel across the width of the track. It presents as a dull recording. It is not dull &mdash; it is a phase error, and no amount of top-end EQ fixes it, because you are boosting something that is cancelling itself. Aligning the playback head to the tape recovers it completely, and this is the single most common reason an archive tape sounds worse than it is.',
   '<strong>Wow and flutter</strong> are the same fault at two speeds: the tape is not moving at a constant rate. Slow variation, below roughly 4&nbsp;Hz, is heard as pitch drifting and is called wow; faster variation is heard as a roughness or warble on sustained notes and is called flutter. Wow is usually a capstan or a slipping pinch roller; flutter is often a bearing or tape dragging on a guide.',
   '<strong>Bias</strong> is the one that is not a fault at all. Magnetic tape does not respond linearly to a small signal, so recorders add a strong high-frequency tone &mdash; far above hearing, typically 100&nbsp;kHz or so &mdash; to push the signal into the part of the curve that behaves. Bias level is a real alignment setting: too little and the recording is distorted and thin, too much and the top end is gone. A machine biased for one tape formulation and fed another is mis-set by definition.',
   '<strong>Noise reduction</strong> is where a tape can be actively misread. Dolby A, B, C and SR all work by compressing certain bands on the way in and expanding them by the exact inverse on the way out. Play a Dolby-encoded tape without decoding and it is bright and forward; decode a tape that was never encoded and it is dull and lifeless. Worse, the expansion tracks against a reference level, so if the machine&rsquo;s alignment does not match the one that recorded it, the decode mistracks and the sound pumps. Getting an encoded tape back needs the type <em>and</em> the reference level, and the box is often the only place either was written down.'])}

${bites([
  '<b>Dull is usually azimuth, not age.</b> Check alignment before reaching for EQ, because EQ cannot undo a cancellation.',
  '<b>Play the alignment tones first if the reel has them.</b> They exist precisely so a future machine can be matched to the one that recorded.',
  '<b>Sticky-shed is real and is a one-shot risk.</b> Some 1970s to 1990s stock absorbs moisture and sheds oxide onto the heads, and playing it once without baking can be the last time it plays.',
  '<b>Note the speed and the track format before threading.</b> A half-track tape on a quarter-track machine plays two things at once, one of them backwards.',
])}

<div class="tblscroll">
<table class="atable">
  <thead><tr><th>Medium</th><th>What physically holds the signal</th><th>What limits it</th></tr></thead>
  <tbody>
    <tr><td>Tape</td><td>Magnetic domains in an oxide coating</td><td>Particle size and tape speed &mdash; and a noise floor that compounds with every copy</td></tr>
    <tr><td>Vinyl</td><td>A groove shaped like the waveform</td><td>Stylus size, groove spacing, and how much the arm can track</td></tr>
    <tr><td>CD</td><td>Pits in a reflective layer, read at 780 nm</td><td>A 2.1 &micro;m spot &mdash; <strong>0.7 GB</strong></td></tr>
    <tr><td>DVD</td><td>Same, read at 650 nm with a wider aperture</td><td>A 1.3 &micro;m spot &mdash; <strong>4.7 GB</strong></td></tr>
    <tr><td>Blu-ray</td><td>Same again, at 405 nm and NA 0.85</td><td>A 0.58 &micro;m spot &mdash; <strong>25 GB</strong></td></tr>
  </tbody>
</table>
</div>

${rule('Three identical discs hold 36&times; different amounts because the <b>focused spot got 3.6&times; smaller</b>, area goes with the square of that, and coding supplied the rest.')}

${S('What was lost', 'And what genuinely was not',
  ['It is worth being unsentimental. Digital control did not win because it sounded better; it won because it was cheaper, thinner, recallable and did not degrade. A show that took two operators and a 48-core loom takes one console and a pair now, and the cues survive being written down.',
   'What was genuinely lost is smaller than nostalgia claims but it is not nothing. Graceful degradation, so a fault produced a worse signal rather than none. One wire per channel, so a fault was localised by construction. And an interface where the state of the show was visible as physical positions across a surface, which is a real cognitive advantage that no amount of screen has fully replaced.',
   'What was not lost: the analogue layer never went anywhere. Every input has a preamplifier, every output has a reconstruction filter, every dimmer still switches a real current, and every one of the five components above is still in every box on the rig. The digital part sits in the middle of an analogue sandwich, and the two ends are where the difficult faults live.'])}

${xnote('There is a reason people mourn analogue desks that has nothing to do with sound quality. A surface where every state is a physical position is one an operator can read at a glance and adjust without looking &mdash; the memory is in the hands rather than in a screen. That is not nostalgia, it is a genuine property of the interface, and it is the thing worth stealing back rather than the noise floor.')}

${S('Where this goes next', 'The calculators on this page',
  ['<a href="/tools/#optical">The optical spot calculator</a> does the diffraction arithmetic and separates what the physics gave from what the coding did. <a href="/tools/#rc">RC time constant</a> gives the corner and the settling times together, because they are one fact. <a href="/tools/#xfmr">Transformer ratios</a> shows why impedance follows the square. And <a href="/learn/power/">power, earth and the things that trip</a> is the same components at rig scale, where getting them wrong hurts somebody.'])}
`

  const script = `
${MATH_SRC}
(function(){
  var r=document.getElementById('af-r'), c=document.getElementById('af-c');
  if(!r||!c)return;
  function draw(){
    var ohms=Number(r.value)*1000, farads=Number(c.value)*1e-9;
    document.getElementById('af-rv').textContent=r.value+' k\\u03a9';
    document.getElementById('af-cv').textContent=c.value+' nF';
    var f=rcFilter(ohms, farads);
    if(!f)return;
    document.getElementById('af-out').innerHTML=
      'Corner at <b>'+f.corner+'</b>, time constant <b>'+f.tau+'</b>.<br>'
      +'Reaches 95% in '+f.riseTo95+' and 99% in '+f.riseTo99
      +'. <span class="dim">The same two components, read two different ways.</span>';
  }
  r.addEventListener('input',draw); c.addEventListener('input',draw); draw();
})();
`

  return shell({
    title: 'Before there was a computer in it — analogue systems, components and optical media | showstack',
    description: 'What a resistor, capacitor, transformer and transistor actually do; how an analogue lighting console controlled a rig with no memory and no processor; how an amplifier is built; and why a CD, a DVD and a Blu-ray are the same disc holding 0.7, 4.7 and 25 gigabytes.',
    canonical: `${SITE}/learn/analogue/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Before there was a computer in it',
      url: `${SITE}/learn/analogue/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
