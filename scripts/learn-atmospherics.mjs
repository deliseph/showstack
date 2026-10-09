/**
 * /learn/atmospherics/ — making air visible, and what it costs.
 *
 * Every lighting designer depends on this and almost nobody is taught it. A
 * beam is invisible in clean air: you see the lamp and you see what it lands
 * on, and nothing in between. The shaft of light that the whole industry
 * designs around is not light at all — it is a suspension of particles, each
 * one scattering a little of the beam sideways into an eye.
 *
 * So the page is organised around one number, particle size, because it
 * explains almost everything else: why haze reveals beams without fogging the
 * picture, why fog reads grey and haze reads faintly blue, why low fog stays
 * on the floor, and why the same machine that makes a show beautiful also
 * sets off the detector and has an exposure limit attached to it.
 *
 * TWO THINGS THIS PAGE REFUSES TO DO.
 *
 * It does not give a recipe for a pyrotechnic effect, and it does not print a
 * glycol exposure figure. The first because the competence to fire pyro is
 * licensed, not read; the second because the published limit I could source
 * is for glycerin and the glycol figures in circulation did not check out
 * against a primary document. Naming the standard and saying go and read it
 * is the honest service here, and it is more useful than a number somebody
 * would quote into a risk assessment on our authority.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

export function learnAtmosphericsPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* The scattering figure. Particles grow with the slider and the beam becomes
   visible, then becomes opaque — the whole argument of the page in one
   control. It must also teach while completely still, so the three labelled
   regimes are drawn as separate columns rather than as one animated state. */
.scat{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:18px 0}
.scatcol{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-sm);padding:13px 14px}
.scatcol h5{margin:0 0 3px;font-size:14.5px;color:var(--ink)}
.scatcol .sz{font-family:var(--mono);font-size:11.5px;color:var(--accent);letter-spacing:.4px}
.scatcol p{margin:7px 0 0;font-size:13.5px;color:var(--dim);line-height:1.6}
/* Particle dots sized to the regime, so the column shows the thing it names. */
.pfield{height:46px;position:relative;margin:9px 0 2px;overflow:hidden;border-radius:5px;
background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 14%,transparent),transparent)}
.pfield i{position:absolute;border-radius:50%;background:var(--ink-muted);opacity:.55}
/* The atmospherics comparison table wants the numbers to line up. */
.atab{width:100%;border-collapse:collapse;font-size:14.5px;margin:14px 0 20px}
.atab th{text-align:left;font-family:var(--mono);font-size:11px;text-transform:uppercase;
letter-spacing:.6px;color:var(--dimmer);padding:0 10px 7px 0;font-weight:400}
.atab td{padding:10px 10px 10px 0;border-top:1px solid var(--line);vertical-align:top;
color:var(--dim);line-height:1.55}
.atab td:first-child{color:var(--ink);font-weight:500;white-space:nowrap}
.atab .num{font-variant-numeric:tabular-nums;font-family:var(--mono);font-size:13px;color:var(--accent)}
/* Pyro effect cards. Deliberately plain: this is a naming reference, and
   anything that looked like a how-to would be the wrong object entirely. */
.pyro{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:10px;margin:14px 0 20px}
.pyrocard{background:var(--panel);border:1px solid var(--line);border-radius:var(--r-sm);padding:12px 14px}
.pyrocard b{display:block;color:var(--ink);font-size:14.5px;margin-bottom:4px}
.pyrocard span{display:block;font-size:13.3px;color:var(--dim);line-height:1.55}
/* The warning block, for the two places on this page where getting it wrong
   is not an aesthetic problem. */
.danger{background:color-mix(in srgb,var(--warn) 9%,var(--panel));
border:1px solid color-mix(in srgb,var(--warn) 45%,transparent);
border-left:3px solid var(--warn);border-radius:var(--r-sm);padding:14px 17px;margin:18px 0}
.danger b{color:var(--warn)}
.danger p{margin:0 0 8px;color:var(--dim);font-size:14.5px;line-height:1.65}
.danger p:last-child{margin-bottom:0}`

  // Three regimes, drawn as still columns. Dot sizes are proportional to the
  // particle diameters named, so the picture is the data rather than a
  // decoration beside it.
  const dots = (n, px, seed) => {
    let out = ''
    let r = seed
    for (let i = 0; i < n; i += 1) {
      r = (r * 1103515245 + 12345) % 2147483648
      const x = (r / 2147483648) * 96
      r = (r * 1103515245 + 12345) % 2147483648
      const y = (r / 2147483648) * 86
      out += `<i style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;width:${px}px;height:${px}px"></i>`
    }
    return out
  }

  const body = `
<div class="crumb"><a href="/">showstack</a> / learn / atmospherics</div>
<h2>Making air visible</h2>
<p class="lede">A beam of light is invisible. You see the lamp, and you see what it lands on, and in clean
air there is nothing in between. Every shaft of light the industry designs around is not light at all &mdash;
it is a few grams of suspended particles, each one scattering a little of the beam sideways into somebody's
eye. Almost everything else on this page follows from how big those particles are.</p>

${S('The one number', 'Particle size decides all of it', [
  'Light scatters off a particle in a way that depends on how the particle&rsquo;s size compares with the wavelength of the light. Visible light runs roughly 0.4 to 0.7&nbsp;µm, and the particles we put in the air to catch it run from about 0.1 to 10&nbsp;µm &mdash; which places atmospheric effects squarely in the <strong>Mie scattering</strong> regime, the awkward middle where the maths has no shortcut and the behaviour changes as the droplets grow.',
  'That is not trivia. It is the whole design space. <strong>Small particles scatter short wavelengths more strongly than long ones</strong>, which is why a well-hazed room has a faint cool cast and why haze reveals a beam without greying out the scenery behind it. <strong>Large droplets attenuate every visible wavelength about equally</strong>, which is why fog reads neutral white and why you stop being able to see through it.',
  'So <a href="/glossary/haze/">haze</a> and <a href="/glossary/fog/">fog</a> are not two settings of the same idea. They are two different optical regimes, and choosing between them is choosing whether the audience looks <em>at</em> the air or <em>through</em> it.',
])}

<div class="scat">
  <div class="scatcol">
    <h5><a href="/glossary/haze/">Haze</a></h5><span class="sz">under ~1 µm</span>
    <div class="pfield">${dots(44, 2, 7)}</div>
    <p>Beams become visible; the room does not. Hangs for hours and spreads evenly, which is why it is laid in before the house opens rather than cued.</p>
  </div>
  <div class="scatcol">
    <h5><a href="/glossary/fog/">Fog</a></h5><span class="sz">a few µm</span>
    <div class="pfield">${dots(26, 5, 31)}</div>
    <p>A visible cloud with a shape and an edge. Reads as an event, obscures what is behind it, and dissipates on a timescale you can cue.</p>
  </div>
  <div class="scatcol">
    <h5><a href="/glossary/smoke/">Smoke</a></h5><span class="sz">combustion particulate</span>
    <div class="pfield">${dots(34, 4, 53)}</div>
    <p>Solid products of burning rather than a condensed fluid. Behaves differently, stains, smells, and is treated as a different hazard class.</p>
  </div>
</div>

${rule('Haze and fog differ in <b>particle size</b>, not in quantity. You cannot make haze by using less fog, and turning a hazer up does not give you fog &mdash; it gives you too much haze.')}

${S('What is actually in it', 'Glycol, glycerin and mineral oil', [
  'Most of what the industry calls fog is a <strong>water-based fluid</strong>: a glycol or glycerin dissolved in water, pushed through a heat exchanger, flashed to vapour and condensed into droplets as it hits room air. Change the glycol, the ratio or the block temperature and you change the droplet size and how long it hangs &mdash; which is why fluids are not interchangeable between machines and why using the wrong one is both an effect problem and a warranty problem.',
  '<strong>White mineral oil</strong> hazers work differently: the oil is atomised mechanically rather than heated, so the particles are very small and very consistent, and the output hangs for a long time. It is the classic film and concert haze, and it is a different substance with a different exposure profile &mdash; which is exactly why the standard names it separately.',
  '<strong>Cracked oil</strong> is the older name for the same mechanical principle. It earned a poor reputation from machines that spat rather than atomised, and left a film on everything downstage of them.',
])}

<table class="atab">
  <tr><th>Effect</th><th>How it is made</th><th>Hangs for</th><th>What it is for</th></tr>
  <tr><td>Haze</td><td>Glycol/water heated, or mineral oil atomised</td><td class="num">hours</td><td>Beam visibility across a whole space</td></tr>
  <tr><td>Fog</td><td>Glycol/water, higher output, larger droplets</td><td class="num">minutes</td><td>A cloud the audience notices as an event</td></tr>
  <tr><td>Low fog</td><td>Fog chilled below the temperature of the room</td><td class="num">1&ndash;5 min</td><td>A layer that stays on the deck</td></tr>
  <tr><td>Dry ice</td><td>Solid CO<sub>2</sub> into hot water</td><td class="num">1&ndash;3 min</td><td>Dense white low fog, no machine in sight</td></tr>
  <tr><td>Cryo jet</td><td>Liquid CO<sub>2</sub> released through a nozzle</td><td class="num">seconds</td><td>A sharp white plume, usually on a beat</td></tr>
  <tr><td>Coloured smoke</td><td>A pyrotechnic composition subliming a dye</td><td class="num">varies</td><td>A coloured plume outdoors; it is pyro, not fog</td></tr>
</table>

${S('Why it stays on the floor', 'Low fog is a temperature trick, not a different fluid', [
  'Fog hangs at eye level because its droplets are close to the density of the air around them. Cool that same fog and two things happen at once: the air carrying it contracts and becomes denser than the room, and the droplets stop evaporating as fast. The result sinks, spreads and sits.',
  'Every <a href="/glossary/low-fog/">low-fog</a> method is some version of that. A <strong>chiller</strong> passes ordinary fog over ice or a refrigerated coil. <strong><a href="/glossary/dry-ice/">Dry ice</a></strong> drops solid CO<sub>2</sub> at &minus;78&nbsp;°C into hot water, which does the chilling and the fog-making in one gesture. <strong>Liquid nitrogen</strong> does it harder and colder.',
  'And all of them end the same way: the layer warms to room temperature, becomes neutrally buoyant again, and <strong>rises as ordinary fog</strong>. Low fog does not disperse where it lies. It gets up and walks into the beams twenty seconds later, which is a lighting problem nobody cues for the first time they use it.',
])}

<div class="danger">
<p><b>CO<sub>2</sub> displaces air, and it pools.</b> Dry ice and cryo effects put carbon dioxide into the
room, and it collects in exactly the places the effect is designed to fill: low, still, enclosed. Orchestra
pits, traps, under-stage voids and basement corridors are the hazard, and a person lying down in it &mdash;
a performer playing dead, somebody who has fainted &mdash; is in the worst part of it.</p>
<p>This is a ventilation calculation and a monitoring decision, not a thing to judge by eye. Carbon dioxide
is colourless and the fog you can see is not the gas you cannot.</p>
</div>

${S('The detector problem', 'Why the fire panel is part of the design', [
  'The same property that makes atmospherics work &mdash; suspended particles scattering light &mdash; is the property a smoke detector is built to notice. A <strong>photoelectric</strong> detector looks for light scattered into a chamber by particles, which is precisely what haze does. An <strong>ionisation</strong> detector senses particles disturbing a small current, and reacts to very fine particles particularly well. A <strong>beam detector</strong> across a large space measures obscuration, which is what fog produces by definition.',
  'So this is never a question of whether the system <em>might</em> trigger. It is a question of which zones are isolated, by whom, under what written permission, and who is watching the space while the detection that normally watches it is switched off. That last part is the actual safety measure: isolation removes a protection, and something has to replace it.',
  'Get it wrong and the cost is not embarrassment. It is an evacuation mid-show, a brigade attendance, a charge for the call-out, and a venue that will not let you haze again.',
])}

${rule('Isolating a detector zone <b>removes a protection</b>. The permit is not paperwork about the effect &mdash; it is the record of what replaced the protection while it was off.')}

${S('The health question', 'What the standards actually say, and what they do not', [
  'Two ESTA standards carry this. <a href="/standards/ansi-e1-23/">ANSI E1.23</a>, now titled <em>Design, Execution, and Maintenance of Atmospheric Effects</em>, covers glycol, glycerin and white mineral oil effects, and requires that exposure be <strong>monitored</strong> rather than estimated. ANSI E1.5 sets out acceptable components and the exposure limits themselves for glycol and glycerin fogs.',
  'The limit worth knowing the shape of: for glycerin, E1.5 has carried a figure of <strong>10&nbsp;mg/m³ as a time-weighted average and 50&nbsp;mg/m³ as a peak</strong>. Figures for the other fluids are in the standard and are not reproduced here, because the values circulating secondhand for glycol did not reconcile against a primary document and a wrong number in a risk assessment is worse than no number.',
  'The part almost nobody quotes is the scope. E1.5 describes fogs <strong>not likely to be harmful to otherwise healthy performers, technicians or audience members aged 18 to 64</strong>. It makes no statement about anybody else. Child performers, a cast member with asthma, an audience that includes both &mdash; the standard is silent, and silence is not permission. A 2017 review commissioned for the US film industry said so explicitly.',
])}

<div class="danger">
<p><b>Monitoring means measuring.</b> E1.23 asks for assurance that recognised limits are not exceeded, and
a handheld meter does that only once it is calibrated for the particular machine and fluid in use. The same
reading means different concentrations for different fluids.</p>
<p>The practical version: a rig that has been hazing into a sealed room with the HVAC off all afternoon is a
different exposure from the same rig in the same room with air moving, and nothing about the look tells you
which one you are in.</p>
</div>

${S('Pyrotechnics', 'The vocabulary, and where this page stops', [
  '<a href="/glossary/pyro/">Pyro</a> is a different discipline with a different legal basis, and the competence to fire it is licensed rather than read. What follows is a naming reference, so that a designer can ask for the right thing and a technician can understand a cue sheet. It is not a method and there is deliberately nothing here about composition, quantity or firing.',
  'The governing documents in the US are <a href="/standards/nfpa-1126/">NFPA 1126</a> for pyrotechnics before a proximate audience and <a href="/standards/nfpa-160/">NFPA 160</a> for <a href="/glossary/flame-effect/">flame effects</a>; other jurisdictions have their own, and the local authority having jurisdiction has the final say regardless.',
])}

<div class="pyro">
  <div class="pyrocard"><b>Gerb</b><span>A fountain throwing a controlled plume of sparks. Classed fast or duration by burn time; hung inverted in a row it becomes a waterfall.</span></div>
  <div class="pyrocard"><b>Comet</b><span>A single bright star rising, silver or coloured.</span></div>
  <div class="pyrocard"><b>Mine</b><span>Multiple stars thrown upward together by a lift charge. A spread rather than a single point.</span></div>
  <div class="pyrocard"><b>Airburst</b><span>A hanging charge bursting into a sphere of sparks, used where a floor position would be wrong.</span></div>
  <div class="pyrocard"><b>Flash pot</b><span>A short preloaded tube producing a bright flash, often with a report or a spray of sparks.</span></div>
  <div class="pyrocard"><b>Flash tray</b><span>A longer slit tube giving a fan-shaped flash rather than a point. Also called a split mine.</span></div>
  <div class="pyrocard"><b>Concussion</b><span>A loud report with little to see. Fired from a mortar built only for that, and frequently used to punctuate a visual effect elsewhere.</span></div>
  <div class="pyrocard"><b>Line rocket</b><span>A device on a wire, used for its thrust: something travels rather than something appears.</span></div>
</div>

<div class="danger">
<p><b>Coloured smoke is pyrotechnic, not atmospheric.</b> It works by burning a composition that sublimes a
dye, so it involves combustion, heat and solid residue, and it falls under pyrotechnic rules rather than
under the fog standards. The name invites the confusion and the two are regulated differently.</p>
<p>It is also, in practice, an outdoor effect. Indoors the residue coats surfaces, the smell persists, and
the particulate is a genuine respiratory exposure rather than the engineered one a fog standard describes.</p>
</div>

${bites([
  '<b>Hazing after the house opens.</b> Haze needs time to spread evenly and the machine is audible and visible while it works. It goes in early, with the air handling set the way it will be during the show &mdash; because changing the HVAC later changes the look.',
  '<b>Assuming the HVAC is a constant.</b> It is usually on a schedule, and the schedule often changes at the exact moment the house opens. A room hazed to look right at 18:00 can be clear by 19:30 for no reason anybody on headset can see.',
  '<b>Low fog that comes back.</b> It warms, rises, and arrives in the beams a minute later looking like a hazer fault.',
  '<b>Fluid swapping.</b> A fluid formulated for another machine changes droplet size, output and residue, and can block a heat exchanger. The exposure profile changes too, so the monitoring you did no longer describes what is in the air.',
  '<b>Treating the permit as admin.</b> The isolation is a removed protection. Somebody has to be the replacement, and that person needs to know they are it.',
])}

${xnote('An audience does not perceive haze, and that is the measure of it working. What they perceive is depth &mdash; a room with air in it, where light has somewhere to travel. Every beam that reads as solid is doing the same job a painter does with atmospheric perspective: telling the eye how far away things are. Overdo it and you have not added more atmosphere, you have flattened the picture into a grey field with no distance in it at all.')}

${S('Where this sits', 'The rest of the chain', [
  'Atmospherics are a <a href="/learn/light/">lighting</a> tool before they are anything else &mdash; the beam you are revealing was shaped by optics, and the colour you see in it is being filtered by the air. The <a href="/learn/outdoors/">outdoor</a> page covers the wind that makes all of this unpredictable, and <a href="/learn/space/">the room</a> covers the air handling that decides whether your haze stays where you put it.',
  'For the numbers and the look-up, the <a href="/glossary/">glossary</a> carries the vocabulary bilingually, and the governing standards are indexed with access links on <a href="/standards/">the standards pages</a>.',
])}

${learnNav(esc, 'atmospherics')}`

  return shell({
    title: 'Making air visible — haze, fog, low fog and pyro | showstack',
    description: 'Why a beam is invisible without particles in the air, how haze and fog differ optically rather than in quantity, why low fog comes back, what the exposure standards actually say, and the pyrotechnic effect vocabulary.',
    canonical: `${SITE}/learn/atmospherics/`,
    extraStyle: style,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Making air visible',
      about: 'Theatrical atmospheric effects, haze, fog and pyrotechnics',
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
  })
}
