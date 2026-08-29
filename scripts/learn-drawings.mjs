/**
 * /learn/drawings/ — drawings, models and BIM.
 *
 * The idea this page is built around is the difference between geometry and
 * data. A line in a CAD file is a line. A fixture object in an entertainment
 * CAD package knows what it is, what it weighs, what it draws, what it is
 * patched to and which universe it lives on — so the plot and the paperwork
 * are the same database, and cannot disagree. Everything else here follows
 * from that one distinction: why Braceworks can compute a load, why GDTF and
 * MVR matter, why exporting to DWG loses the interesting half, and why a
 * venue's BIM model is a different kind of object again.
 *
 * The other thing it insists on is that a drawing is a contract between
 * departments rather than a picture of the show.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav } from './learn-kit.mjs'

export function learnDrawingsPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* a line, versus an object that knows things */
@keyframes reveal{0%,30%{opacity:0;transform:translateY(6px)}45%,88%{opacity:1;transform:translateY(0)}
100%{opacity:0;transform:translateY(6px)}}
.objfig .meta{animation:reveal 5s ease-in-out infinite}
.objfig .meta.m2{animation-delay:.18s}
.objfig .meta.m3{animation-delay:.36s}
.objfig .meta.m4{animation-delay:.54s}
.objfig .meta.m5{animation-delay:.72s}
/* one model, many drawings falling out of it */
@keyframes fan{0%{opacity:0;transform:translate(0,0)}18%{opacity:1}
72%{opacity:1;transform:translate(var(--dx),var(--dy))}86%,100%{opacity:0;transform:translate(var(--dx),var(--dy))}}
.fanfig .out{animation:fan 4.2s ease-out infinite}
.fanfig .out.o2{animation-delay:.3s}.fanfig .out.o3{animation-delay:.6s}
.fanfig .out.o4{animation-delay:.9s}.fanfig .out.o5{animation-delay:1.2s}
/* load finding its way down */
@keyframes drop{0%{transform:translateY(0);opacity:0}10%{opacity:1}
70%{transform:translateY(72px);opacity:1}84%,100%{opacity:0}}
.loadfig .w{animation:drop 2.8s ease-in infinite}
.loadfig .w.d2{animation-delay:.45s}
.loadfig .w.d3{animation-delay:.9s}
@keyframes strain{0%,100%{stroke:var(--ok)}54%,72%{stroke:var(--warn)}}
.loadfig .hoist{animation:strain 2.8s ease-in-out infinite}
/* format exchange: what survives the export */
.fmt{width:100%;border-collapse:collapse;font-size:14.2px;margin:16px 0}
.fmt th{text-align:left;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;
color:var(--dimmer);padding:0 12px 9px 0;border-bottom:1px solid var(--line);font-weight:400;white-space:nowrap}
.fmt td{padding:12px 12px 12px 0;border-bottom:1px solid var(--line);vertical-align:top;color:var(--dim);
line-height:1.55}
.fmt td:first-child{color:var(--ink);font-family:var(--mono);font-size:13px;white-space:nowrap}
.fmtwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.fmtwrap .fmt{min-width:600px}
/* the drawing set */
.set{display:grid;grid-template-columns:repeat(auto-fit,minmax(212px,1fr));gap:12px;margin:18px 0}
.set div{border:1px solid var(--line);border-radius:var(--r-sm);padding:14px;background:var(--panel)}
.set dt{font-family:var(--mono);font-size:11.5px;color:var(--accent);margin-bottom:6px}
.set dd{margin:0;font-size:13.4px;color:var(--dim);line-height:1.55}
/* tool rows */
.tools2{margin:18px 0}
.trow{display:grid;grid-template-columns:minmax(140px,190px) 1fr;gap:16px;padding:15px 0;
border-bottom:1px solid var(--line)}
.trow:last-child{border-bottom:none}
.trow .tn{color:var(--ink);font-weight:600;font-size:15px}
.trow .tk{font-family:var(--mono);font-size:10.5px;color:var(--accent2);text-transform:uppercase;
letter-spacing:.5px;margin-top:4px}
.trow p{margin:0;color:var(--dim);font-size:14px;line-height:1.6}
@media(max-width:600px){.trow{grid-template-columns:1fr;gap:7px}}
`

  const objFig = `
<svg viewBox="0 0 460 190" role="img" class="objfig">
  <text x="106" y="18" class="lbl" font-size="10" text-anchor="middle" fill="var(--dimmer)">A LINE</text>
  <line x1="34" y1="70" x2="178" y2="70" stroke="var(--dim)" stroke-width="2"/>
  <text x="106" y="96" class="lbl" font-size="9" text-anchor="middle">start point, end point, layer</text>
  <text x="106" y="112" class="lbl" font-size="9" text-anchor="middle">and nothing else at all</text>
  <line x1="228" y1="10" x2="228" y2="178" stroke="var(--line)"/>
  <text x="348" y="18" class="lbl" font-size="10" text-anchor="middle" fill="var(--accent)">AN OBJECT</text>
  <rect x="326" y="52" width="44" height="34" rx="5" fill="var(--panel)" stroke="var(--accent)" stroke-width="1.5"/>
  <path d="M338 86 L358 86 L362 100 L334 100 Z" fill="var(--accent)" opacity=".35"/>
  ${['26 kg', '480 W', 'ch 214', 'universe 3', '19° lens'].map((t, i) => `
  <text class="meta${i ? ` m${i + 1}` : ''}" x="392" y="${44 + i * 17}" class="lbl" font-size="9.5" fill="var(--accent2)">${t}</text>`).join('')}
  <text x="348" y="132" class="lbl" font-size="9" text-anchor="middle">the drawing and the paperwork</text>
  <text x="348" y="147" class="lbl" font-size="9" text-anchor="middle">are the same database</text>
  <text x="230" y="180" class="lbl" text-anchor="middle" font-size="9.5">this is the whole difference between drafting and entertainment CAD</text>
</svg>`

  const fanFig = `
<svg viewBox="0 0 460 200" role="img" class="fanfig">
  <rect x="176" y="82" width="108" height="42" rx="8" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.8"/>
  <text x="230" y="108" class="val" font-size="12" text-anchor="middle" fill="var(--accent)">ONE MODEL</text>
  ${[
    ['plot', -160, -58, ''],
    ['section', -170, 34, 'o2'],
    ['schedule', 148, -62, 'o3'],
    ['hoist plot', 158, 30, 'o4'],
    ['patch', -6, 74, 'o5'],
  ].map(([t, dx, dy, c]) => `
  <g class="out ${c}" style="--dx:${dx}px;--dy:${dy}px">
    <rect x="196" y="92" width="68" height="24" rx="5" fill="var(--panel)" stroke="var(--accent2)"/>
    <text x="230" y="108" class="lbl" font-size="9" text-anchor="middle">${t}</text>
  </g>`).join('')}
  <text x="230" y="192" class="lbl" text-anchor="middle" font-size="9.5">edit the model, and every document that came out of it is already correct</text>
</svg>`

  const loadFig = `
<svg viewBox="0 0 400 180" role="img" class="loadfig">
  <line x1="20" y1="24" x2="380" y2="24" stroke="var(--dim)" stroke-width="3"/>
  <text x="200" y="16" class="lbl" font-size="9" text-anchor="middle">steel</text>
  ${[110, 200, 290].map((x, i) => `
  <line class="hoist" x1="${x}" y1="24" x2="${x}" y2="86" stroke="var(--ok)" stroke-width="2"/>
  <rect x="${x - 13}" y="86" width="26" height="16" rx="3" fill="var(--panel)" stroke="var(--line)"/>
  <text x="${x}" y="98" class="lbl" font-size="8" text-anchor="middle">H${i + 1}</text>`).join('')}
  <rect x="70" y="108" width="260" height="10" rx="3" fill="var(--panel2)" stroke="var(--line)"/>
  <text x="200" y="132" class="lbl" font-size="9" text-anchor="middle">truss</text>
  ${[130, 200, 268].map((x, i) => `<g class="w${i ? ` d${i + 1}` : ''}"><circle cx="${x}" cy="126" r="5" fill="var(--accent2)"/></g>`).join('')}
  <text x="200" y="168" class="lbl" text-anchor="middle" font-size="9.5">every weight ends up in a hoist — the software works out where</text>
</svg>`

  const F = (a, b, c) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / drawings</div>
${learnNav(esc, 'drawings')}
<div class="lhero">
  <h2>Drawings, models and BIM</h2>
  <p class="lede">A show drawing is not a picture of the show. It is a contract between departments about where things are, what they weigh and who is responsible — and the reason modern entertainment CAD is worth its learning curve is that it stops the drawing and the paperwork from ever disagreeing.</p>
</div>

${S('The distinction that explains everything', 'A line, and a thing that knows what it is', [
  'In general drafting, a light on a plan is a symbol: some lines on a layer. It looks right, it prints, and it knows nothing. If you move it, nothing else in the document notices. If you swap it for a heavier fixture, no total changes anywhere.',
  'In entertainment CAD the same light is an <b>object with data attached</b>. It knows its type, weight, power draw, lens, colour, focus, channel, universe, address, the position it hangs on and the circuit it is on. Move it and the plot, the instrument schedule, the hookup, the load on that truss and the patch all update, because they are not separate documents — they are different views of one database.',
  'That is the entire argument for the extra complexity, and it is also why exporting to a plain DWG at the end feels lossy. It is lossy. The geometry survives and the intelligence does not.',
])}

${fig(objFig, 'Left: coordinates. Right: coordinates plus everything that makes paperwork possible.')}

${rule('Ask of any drawing file: <b>is this geometry, or is this data?</b> Geometry can be drawn beautifully and still cannot answer a question. Data can produce every document you need and cannot contradict itself.')}

${S('What actually gets produced', 'The drawing set a show runs on', [
  'Different venues and different countries name these differently, but the set is remarkably consistent — and almost all of it can come out of one model.',
])}

<div class="set">
  <div><dt>Plan / plot</dt><dd>Looking down. Where everything is in the space, at a stated scale, with a stated origin.</dd></div>
  <div><dt>Section</dt><dd>Looking from the side. Trim heights, sightlines, throw distances, and whether the thing on the plan actually clears.</dd></div>
  <div><dt>Rigging / hanging plot</dt><dd>Bars, trusses, hoists and points, numbered — and the schedule of what each point takes.</dd></div>
  <div><dt>Instrument schedule</dt><dd>Every fixture as a row: type, position, unit number, channel, address, purpose, colour, accessory.</dd></div>
  <div><dt>Patch and universes</dt><dd>What address is what, on which universe, through which node. Derived, never retyped.</dd></div>
  <div><dt>Signal and power</dt><dd>What connects to what, through which rack — the drawing everyone wants at 2am and nobody budgeted time for.</dd></div>
  <div><dt>Screen and projection layout</dt><dd>Pixel maps, surface geometry, throw and blend zones, and the processing behind each.</dd></div>
  <div><dt>Venue overlay</dt><dd>Your show on top of the venue’s own drawing, in the venue’s coordinates — the document that reveals the column nobody mentioned.</dd></div>
</div>

${fig(fanFig, 'Every document is a view. Change the model and they are all already right.')}

${S('The tools', 'What each one is for, and what it is not for', [])}

<div class="tools2">
  <div class="trow"><div><div class="tn"><a href="/software/autocad/">AutoCAD</a></div><div class="tk">2D drafting · DWG</div></div>
    <p>The common language. Venues, architects and structural engineers will send you DWG, and expect DWG back. Precise, universal, and deliberately unopinionated: it draws what you tell it and attaches no meaning. Treat it as the exchange format and the survey base rather than as the place a show lives.</p></div>
  <div class="trow"><div><div class="tn"><a href="/software/vectorworks-spotlight/">Vectorworks Spotlight</a></div><div class="tk">entertainment CAD · objects</div></div>
    <p>The industry default for lighting and scenic documentation, because of the object model above. Fixtures carry data, paperwork generates from the drawing, and the same file exports to previsualisation and to consoles. The learning curve is real and it buys you a set of documents that cannot silently disagree with each other.</p></div>
  <div class="trow"><div><div class="tn"><a href="/software/vectorworks-braceworks/">Braceworks</a></div><div class="tk">structural analysis · add-on</div></div>
    <p>Takes the rig you have drawn — trusses, hoists, bridles, the weight of every object hanging on it — and computes the loads. It tells you what each hoist is carrying, where a truss is over its limit, and what happens when you move a point. It is a calculation aid inside a competent process, not a substitute for a rigger or an engineer, and it is only ever as good as the weights and the structure you told it about.</p></div>
  <div class="trow"><div><div class="tn">SketchUp</div><div class="tk">massing · communication</div></div>
    <p>Fast, forgiving, and excellent at answering "roughly, does this fit and what does it feel like" in an afternoon. Not a data model and not a documentation tool. Perfect for the conversation with a director; wrong as the source of truth for the build.</p></div>
  <div class="trow"><div><div class="tn"><a href="/software/blender/">Blender</a></div><div class="tk">modelling · animation · free</div></div>
    <p>A complete free modelling, animation and rendering package. Strong for scenic visualisation, content, and anything that has to move. Weak as a drafting tool — dimensioned, annotated, printable drawings are not what it is for. Increasingly the bridge between design and a <a href="/learn/engines/">real-time engine</a>.</p></div>
  <div class="trow"><div><div class="tn"><a href="/software/rhino-3d/">Rhino</a> + Grasshopper</div><div class="tk">parametric geometry</div></div>
    <p>Where complex scenic and structural geometry gets designed. Grasshopper makes the shape a set of rules rather than a set of surfaces, so changing a parameter regenerates everything downstream. The natural tool when a scenic element is a family of variations rather than one object.</p></div>
  <div class="trow"><div><div class="tn">Revit and BIM · IFC</div><div class="tk">building information model</div></div>
    <p>The venue’s own world. A BIM model carries data on every element of the building — structure, services, capacities — so it can be queried and checked for clashes rather than eyeballed. IFC is the open exchange format that lets a model move between packages. For touring work you mostly <em>consume</em> BIM: the venue’s model tells you where the steel is, what it takes, and where the services run. For installed and new-build work you contribute to it, and the discipline of doing so is what stops a lighting position from being discovered to occupy the same space as a sprinkler main.</p></div>
</div>

${S('Loads', 'What Braceworks is actually doing, and what it is not', [
  'Every fixture, motor, cable and scenic piece has a weight, and every one of those weights ends up somewhere. The question a rigging plot has to answer is <em>where</em>, and the answer is not obvious: a truss on three hoists does not put a third of the load on each, and moving one fixture two metres changes every reaction along the span.',
  'Structural analysis inside the CAD package does that arithmetic continuously as the drawing changes, and flags the point where something exceeds its rated capacity. That is genuinely valuable, because the alternative is a spreadsheet that was accurate at one moment last Tuesday.',
  'What it does not do is take responsibility. The result depends entirely on the weights you entered, the structure you modelled, the capacities you specified and the assumptions the software makes about how the pieces connect. A competent rigger reviews the output; nobody signs a load-in on a screenshot.',
])}

${fig(loadFig, 'A load path, computed continuously. The number is only as good as what was modelled.')}

${bites([
  '<b>Weights get left out, not entered wrong.</b> The cable, the safety, the clamp, the scroller, the haze machine somebody clipped on at the end. A structural total is only as complete as the model.',
  '<b>A venue DWG is a starting point, not a survey.</b> It may be from before the last refurbishment, drawn in a different unit, or accurate about the building and silent about the steel. Verify anything you are going to hang from.',
  '<b>Agree the origin before anyone draws.</b> Centre line and setting line, or the venue’s grid — but written down, once, and used by lighting, video, audio, automation and scenic alike. This is the same coordinate problem as on the <a href="/learn/systems/">systems</a> page, and it is where tracked systems fail.',
  '<b>Units bite silently.</b> Millimetres against metres against feet and inches, a model imported at 1/1000 scale that still looks fine on screen. Check a known dimension immediately after any import.',
])}

${S('Exchange', 'What survives a hand-off, and what quietly does not', [
  'Almost every problem in a drawing hand-off is a lost attribute rather than lost geometry. It is worth knowing what each format is <em>for</em>, because the shape usually arrives fine and the data does not.',
])}

<div class="fmtwrap">
<table class="fmt">
  <thead><tr><th>Format</th><th>Carries</th><th>What to watch</th></tr></thead>
  <tbody>
    ${F('DWG / DXF', 'Geometry, layers, blocks, text. 2D and some 3D.', 'The universal exchange, and the one that drops object data. Agree layer naming and units in advance or expect an evening of cleanup.')}
    ${F('IFC', 'A building model: elements with properties and relationships.', 'The open BIM format. Big files, and a round trip through another package rarely returns everything.')}
    ${F('GDTF', 'A fixture: DMX footprint, modes, geometry, physical data.', 'The open format that lets one fixture definition serve the console, the previz tool and the CAD package. Check the file matches the firmware the fixture is actually running.')}
    ${F('MVR', 'A whole rig: fixtures, positions, structures, in one scene.', 'Built on GDTF. This is what makes handing a plot to a console or a previz system a transfer rather than a re-entry. Support varies by version — test it before you rely on it.')}
    ${F('FBX / glTF / OBJ', 'Meshes, materials, sometimes animation.', 'The route into a render engine. Scale and axis convention are the first two things to check, every time.')}
    ${F('PDF', 'What the drawing looked like.', 'Perfect for issuing, useless for working. Never the only copy of anything.')}
  </tbody>
</table>
</div>

${rule('<b>GDTF and MVR are the ones to push for.</b> They are the reason a plot can move from CAD to previz to console without anyone retyping a patch — and retyped patches are where the errors live.')}

${S('The point of it all', 'A drawing is a contract', [
  'It is tempting to treat drawings as documentation — something produced after the design, for the file. On a show they are the opposite: they are how departments agree with each other before anything is built, and how a disagreement is discovered on paper rather than at 40 feet.',
  'That is why the boring parts are the important ones. A stated scale. A stated origin. A revision number and a date. A legend that says what the symbols mean. A title block that says who drew it and who to ask. None of that makes the drawing better looking, and all of it is what makes it usable by somebody who was not in the room.',
  'The good news is that the tools above will do almost all of it for you, from one model, as long as the model is built with data in it rather than lines that look like data.',
])}

<div class="cta"><strong>Drawing and paperwork workflows vary a lot by market.</strong>
<p>This page describes the shape that is common across them; the naming, the standard sheet set and the responsibility split differ by country and by venue. If your region does it meaningfully differently, <a href="${GH}/issues/new?labels=tooling&amp;title=drawings%3A+">open an issue</a> — regional practice is exactly the sort of thing this site should record rather than flatten.</p></div>
`

  return shell({
    title: 'Drawings, models and BIM — CAD, Braceworks, GDTF and MVR | showstack',
    description: 'Why an entertainment CAD fixture is an object with data rather than a line, what drawing set a show actually produces, what AutoCAD, Vectorworks Spotlight, Braceworks, SketchUp, Blender, Rhino and BIM are each for, and what survives a DWG, IFC, GDTF or MVR hand-off.',
    canonical: `${SITE}/learn/drawings/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Drawings, models and BIM in live production',
      description: 'Geometry versus data in entertainment CAD, the show drawing set, structural load analysis, and exchange formats including DWG, IFC, GDTF and MVR.',
      url: `${SITE}/learn/drawings/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
