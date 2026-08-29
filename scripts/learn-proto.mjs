/**
 * /learn/proto/ — making the part that does not exist.
 *
 * Every production eventually needs a bracket, an adaptor, a mount or a
 * housing that nobody sells. The trade has quietly absorbed a workshop's
 * worth of digital fabrication in the last decade and almost nobody has
 * written down how the pieces fit together for THIS industry, where the part
 * is often needed by Thursday, will be climbed on, and has to survive being
 * packed in a truck.
 *
 * Four things this page is for.
 *
 * What the printing processes actually are, because FDM and SLA and SLS fail
 * in different directions and the choice is usually decided by the failure
 * you cannot accept rather than by the finish you want.
 *
 * The one that matters most on a show: a printed part is ANISOTROPIC. It is
 * dramatically weaker between the layers than along them, which means the
 * orientation on the bed is a structural decision made by whoever pressed
 * slice.
 *
 * Scanning and reverse engineering, which is how you make a part fit
 * something you did not design and cannot take apart.
 *
 * And the boundary that is not negotiable: what may be printed and what may
 * not, when a person's weight is on it.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

export function learnProtoPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* Layers pulling apart is the whole lesson, so the figure shows it happening
   rather than describing it. */
@keyframes lay-split{0%,45%{transform:translateY(0)}70%,100%{transform:translateY(-7px)}}
.layfig .top{animation:lay-split 3.6s ease-in-out infinite}
@keyframes lay-crack{0%,50%{opacity:0}72%,100%{opacity:1}}
.layfig .crack{animation:lay-crack 3.6s ease-in-out infinite}
.ptable{width:100%;border-collapse:collapse;font-size:14px;margin:14px 0}
.ptable th{text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;
color:var(--ink-faint);padding:0 12px 9px 0;border-bottom:1px solid var(--rule);font-weight:400}
.ptable td{padding:11px 12px 11px 0;border-bottom:1px solid var(--rule);vertical-align:top;
color:var(--ink-muted);line-height:1.55}
.ptable td:first-child{color:var(--ink);white-space:nowrap;font-weight:600}
.tblscroll{overflow-x:auto;margin:14px 0}
.warnbox{border:1px solid var(--fail);border-left-width:3px;border-radius:0 var(--r-sm) var(--r-sm) 0;
padding:15px 18px;margin:20px 0;background:color-mix(in srgb,var(--fail) 6%,transparent)}
.warnbox b{display:block;color:var(--fail);font-family:var(--mono);font-size:11px;letter-spacing:.6px;
text-transform:uppercase;margin-bottom:8px}
.warnbox p{margin:0 0 9px;color:var(--ink);font-size:15px;line-height:1.6}
.warnbox p:last-child{margin-bottom:0}
`

  const layerFig = `
<svg viewBox="0 0 620 220" role="img" class="layfig">
  <text x="40" y="28" class="lbl">Load ALONG the layers &mdash; strong</text>
  <g>
    <rect x="46" y="60" width="200" height="12" rx="2" fill="var(--signal)" opacity=".85"/>
    <rect x="46" y="76" width="200" height="12" rx="2" fill="var(--signal)" opacity=".7"/>
    <rect x="46" y="92" width="200" height="12" rx="2" fill="var(--signal)" opacity=".85"/>
    <rect x="46" y="108" width="200" height="12" rx="2" fill="var(--signal)" opacity=".7"/>
    <path d="M146 140 L146 168 M138 160 L146 168 L154 160" fill="none" stroke="var(--ink)" stroke-width="2"/>
    <text x="146" y="190" class="lbl" text-anchor="middle">force in the plane of the layers</text>
  </g>
  <text x="360" y="28" class="lbl" style="fill:var(--fail)">Load ACROSS them &mdash; it is a stack of pancakes</text>
  <g>
    <g class="top">
      <rect x="376" y="60" width="200" height="12" rx="2" fill="var(--fail)" opacity=".85"/>
      <rect x="376" y="76" width="200" height="12" rx="2" fill="var(--fail)" opacity=".7"/>
    </g>
    <rect x="376" y="92" width="200" height="12" rx="2" fill="var(--fail)" opacity=".85"/>
    <rect x="376" y="108" width="200" height="12" rx="2" fill="var(--fail)" opacity=".7"/>
    <g class="crack">
      <line x1="376" y1="90" x2="576" y2="90" stroke="var(--fail)" stroke-width="2.5" stroke-dasharray="5 4"/>
      <text x="584" y="86" class="lbl" text-anchor="end" style="fill:var(--fail)">it comes apart here</text>
    </g>
    <text x="476" y="190" class="lbl" text-anchor="middle">force pulling the layers apart</text>
  </g>
  <text x="40" y="212" class="lbl">Same part, same material, same machine. The orientation on the bed decided which of these you got.</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / proto</div>
${learnNav(esc, 'proto')}
<h2>Making the part that does not exist</h2>
<p class="lede">Every production eventually needs a bracket, an adaptor or a housing nobody sells, by Thursday. The trade has quietly absorbed a workshop&rsquo;s worth of digital fabrication and almost nobody has written down how it fits together for a job where the part gets climbed on, packed in a truck, and used in the dark.</p>

${S('The processes', 'Three ways of making a solid, and how each one fails',
  ['Nearly all of it is one of three families, and they are chosen by the failure you cannot accept rather than by the finish you want.',
   '<strong>FDM</strong> &mdash; fused deposition, the familiar filament printer &mdash; extrudes molten plastic in layers. It is cheap, the machines are everywhere, the materials range from PLA to nylon and carbon-filled composites, and it produces the anisotropy the next section is about. It is the right answer for most brackets, jigs, cable management and one-off housings.',
   '<strong>SLA and DLP</strong> cure liquid resin with light, layer by layer. Far finer detail and a genuinely smooth surface, which matters for anything optical, anything that seals, and anything appearing on camera. The catch is that most resins are brittle and many degrade under UV, so a resin part that lives outdoors or in a followspot beam is on a clock. The uncured resin is also a skin sensitiser, which makes it a workshop process rather than a corner-of-the-office one.',
   '<strong>SLS and MJF</strong> fuse powdered nylon with a laser or a binder plus heat. Genuinely strong, close to isotropic because there are no bonded layers in the same sense, and it needs no support structure at all because the unfused powder holds the part up &mdash; so it can make geometries the other two cannot. It is the one you send out to a bureau rather than own, and it is what you use when the part actually has to work.'])}

<div class="tblscroll">
<table class="ptable">
  <thead><tr><th>Process</th><th>Good at</th><th>Fails at</th><th>Reach for it when</th></tr></thead>
  <tbody>
    <tr><td>FDM</td><td>Cheap, fast, tough materials, in the building</td><td>Layer adhesion, fine detail, sealing surfaces</td><td>Brackets, jigs, mounts, anything iterated more than once</td></tr>
    <tr><td>SLA / DLP</td><td>Detail and surface finish</td><td>Brittle, UV-sensitive, resin handling</td><td>Optical parts, camera-facing detail, patterns for casting</td></tr>
    <tr><td>SLS / MJF</td><td>Strength, near-isotropy, no supports</td><td>Cost, lead time, surface texture</td><td>The part that has to work rather than look right</td></tr>
    <tr><td>CNC</td><td>Real material properties, tolerances, metals</td><td>Geometry a cutter can reach, setup time</td><td>Load paths, anything replacing a metal part</td></tr>
    <tr><td>Laser cut</td><td>Speed, cost, flat things</td><td>It is two-dimensional and it burns edges</td><td>Panels, gobos, templates, flat brackets in ply or acrylic</td></tr>
  </tbody>
</table>
</div>

${S('The one that matters', 'A printed part is not the same strength in every direction',
  ['This is the fact that separates people who print things that work from people who print things that break, and it is not intuitive because the part looks solid.',
   'An FDM part is built from bonded layers, and the bond between layers is <em>weaker</em> than the material within a layer &mdash; often dramatically so, because it is a partial re-melt rather than continuous material. Load it in the plane of the layers and you get something close to the plastic&rsquo;s real strength. Load it across them and you are relying on that bond, and it delaminates like a stack of pancakes.',
   'The consequence is that <strong>orientation on the bed is a structural decision</strong>, made in the <em>slicer</em> by whoever pressed slice, usually without thinking of it that way. That is worth saying plainly, because the slicer looks like a print-settings dialogue and is in fact where the part&rsquo;s mechanical properties are chosen. The same file, the same machine, the same spool, turned ninety degrees, is a different part. A hook printed lying down is far stronger than the identical hook printed standing up, and nothing about the model or the settings tells you which one you got.',
   'Two practical habits follow. Design so the load runs along the layers, and if you cannot, say so on the part &mdash; a printed component with no indication of its build orientation cannot be safely reproduced by the next person. And treat infill percentage as a stiffness setting rather than a strength one: perimeters carry most of the load, so three walls at 20% infill beats two walls at 60% for most brackets, and uses less material doing it.'])}

${fig(layerFig, 'Same file, same machine, turned ninety degrees. Only the orientation changed.')}

${rule('Orientation on the bed is a <b>structural decision</b>. A part with no build direction marked on it cannot be safely reprinted by anybody else.')}

${bites([
  '<b>Infill treated as strength.</b> It mostly buys stiffness. Perimeter count is what carries load, and adding walls beats adding infill nearly every time.',
  '<b>PLA in a truck in summer.</b> It softens around 60&nbsp;°C, which a black case in a trailer reaches easily. PETG or ABS for anything that travels; PLA for anything that lives indoors and gets replaced.',
  '<b>Resin in a beam.</b> Most photopolymers keep curing under UV and go brittle. A resin part near a discharge source has a service life measured in weeks.',
  '<b>Screwing directly into a print.</b> Threads in plastic strip. Heat-set inserts take thirty seconds each and turn a disposable part into a serviceable one.',
  '<b>No tolerance for the process.</b> An FDM hole prints undersize and a resin one prints closer to nominal. Test the fit on a coupon before printing the part.',
])}

${S('Measuring what exists', 'Scanning, and when a caliper is faster',
  ['Reverse engineering on a show usually means making something fit a thing you did not design, cannot take away, and are not allowed to modify. There are three levels of answer and the first is almost always the right one.',
   '<strong>Measure it.</strong> A caliper, a set of radius gauges, thread pitch gauges and twenty minutes gets a better model than a scan for anything with flat faces, round holes and right angles &mdash; which is most brackets, most panels and most mounting plates. A scan gives you a mesh of approximately where the surface was; a measurement gives you the number the original was made to, which is nearly always a round one in some unit. Recognising that a hole is 8&nbsp;mm rather than 7.94 is the entire skill.',
   '<strong>Photogrammetry</strong> builds geometry from a set of overlapping photographs. It is free, the camera is in your pocket, and it is excellent for organic shapes, scenic elements and anything textured. It is poor at shiny, transparent and featureless surfaces, because it needs visual detail to match between frames &mdash; and it gives you no absolute scale unless you photograph a ruler alongside.',
   '<strong>Structured light and laser scanning</strong> project a pattern and measure its distortion. Genuinely accurate, genuinely scaled, and it produces a mesh rather than a model: you still have to work out what the designer intended and rebuild it as real geometry, which is the part that takes the time. Scan-to-CAD is not a conversion, it is a reconstruction.'])}

${bites([
  '<b>Scanning something you could measure.</b> A scan of a rectangular plate is a slow way to get four numbers you could have read off a caliper.',
  '<b>Photogrammetry with no scale reference.</b> A beautiful mesh at an unknown size. Put a ruler in the scene.',
  '<b>Shiny or clear parts.</b> Both processes struggle. A dusting of matt spray is the standard answer, and it is not always allowed on somebody else&rsquo;s equipment.',
  '<b>Treating a mesh as a model.</b> A scan is a record of a surface. Turning it into something you can modify and print is a rebuild, and it is where nearly all the time goes.',
])}

<div class="warnbox">
  <b>The boundary that does not move</b>
  <p>Nothing printed goes into a load path with a person under it. Not a shackle, not a clamp, not a hook, not a safety, not a link in a rigging chain &mdash; and not &ldquo;temporarily&rdquo;. Rated components are rated because they are made of a known material to a known process with traceability and a test certificate, and a printed part has none of those things even when it is stronger than the metal one.</p>
  <p>The same applies to anything holding a person up, anything retaining a lifted load, and anything an audience could be under. Between those absolutes and ordinary brackets sits a large grey area &mdash; a camera mount over a walkway, a housing containing a battery &mdash; and the correct move there is to ask the person who signs for the rig rather than to decide alone.</p>
  <p>What printing is genuinely excellent at: jigs, templates, drilling guides, cable management, dust caps, adaptor plates that carry no load, mock-ups, and the fifty small parts that make an install tidy. That is not a consolation prize, it is most of the work.</p>
</div>

${S('Working like it is production', 'Because on a show it is',
  ['A prototype on a production is not a prototype. It goes in the truck and stays there for eighteen months, so the habits that matter are the boring ones.',
   'Print two of everything and put the spare in the case, because the second one costs the material and nothing else, and the day it is needed there is no printer. Mark parts with the file name and the date, in the model, as embossed text &mdash; a part you cannot identify cannot be reprinted. Keep the source file rather than only the mesh, because an STL cannot be sensibly modified and a parametric file can be adjusted in a minute. And write the material and orientation on it, for the same reason you write the gauge on a cable.',
   'Iterate on the joint rather than on the part. Most failures are at the interface &mdash; a hole in the wrong place, a fit that is 0.2&nbsp;mm out &mdash; so printing a small coupon of just that feature takes ten minutes instead of four hours and answers the only question that was actually uncertain.'])}

${xnote('The reason this belongs on a site about signal and light is that fabrication has become part of the same job. The bracket that holds the sensor, the housing that keeps the rain off the node, the jig that makes fifty identical looms &mdash; each of them is the difference between an idea that works on a bench and one that survives a get-in. The craft is the same craft: know what the process actually does, know how it fails, and do not ask it for something it cannot give.')}

${S('Where this goes next', 'The neighbouring pages',
  ['<a href="/learn/drawings/">Drawings, models and BIM</a> covers the modelling side and why an object that knows what it weighs is different from a line. <a href="/learn/outdoors/">When the venue is a field</a> has the IP ratings that decide whether a printed housing is protecting anything. <a href="/learn/rigging/">Hoists and the safety chain</a> is where the boundary above comes from. And <a href="/learn/analogue/">before there was a computer in it</a> is the components that usually end up inside whatever you just printed a case for.'])}
`

  return shell({
    title: 'Making the part that does not exist — printing, scanning and reverse engineering | showstack',
    description: 'FDM, SLA and SLS fail in different directions, and a printed part is dramatically weaker across its layers than along them — so orientation on the bed is a structural decision. Plus scanning, photogrammetry, and the load-path boundary that does not move.',
    canonical: `${SITE}/learn/proto/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Making the part that does not exist',
      url: `${SITE}/learn/proto/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
