/**
 * /learn/ai/ — what these systems are actually doing.
 *
 * The aim is to remove the magic without removing the usefulness. A neural
 * network is a learned function: weighted sums and a non-linearity, repeated.
 * Training and inference are two completely different jobs. An image
 * generator starts from noise and removes a little of it at a time. A
 * language model predicts the next token and nothing else.
 *
 * Two interactives, both chosen because they make a specific misconception
 * impossible to keep: a denoising slider that shows an image emerging from
 * noise step by step, and a temperature slider that shows a probability
 * distribution flattening. Neither is a simulation of a real model - they are
 * illustrations, and the page says so.
 *
 * The quantum section exists because the honest answer is unglamorous and
 * genuinely useful: it will not speed up your render, and it does have a real
 * near-term consequence, which is cryptographic.
 */
import { LEARN_CSS, sec, rule, bites, fig, learnNav, xnote } from './learn-kit.mjs'

export function learnAiPage({ esc, shell, SITE, GH }) {
  const S = sec(esc)

  const style = LEARN_CSS + `
/* a signal passing through layers of weights */
@keyframes nfire{0%,100%{opacity:.25;r:5}18%,32%{opacity:1;r:7}}
.nnfig .n1{animation:nfire 3s ease-in-out infinite}
.nnfig .n2{animation:nfire 3s ease-in-out infinite;animation-delay:.4s}
.nnfig .n3{animation:nfire 3s ease-in-out infinite;animation-delay:.8s}
.nnfig .n4{animation:nfire 3s ease-in-out infinite;animation-delay:1.2s}
@keyframes edge{0%{stroke-dashoffset:40;opacity:0}20%{opacity:.8}
70%{stroke-dashoffset:0;opacity:.8}86%,100%{opacity:0}}
.nnfig .e{stroke-dasharray:40;animation:edge 3s linear infinite}
.nnfig .e.l2{animation-delay:.4s}
.nnfig .e.l3{animation-delay:.8s}
/* training loop: guess, measure, adjust, repeat */
@keyframes cyc{to{transform:rotate(360deg)}}
.trnfig .orb{animation:cyc 4s linear infinite;transform-origin:120px 92px}
.trnfig .st{animation:l-breathe 4s ease-in-out infinite}
.trnfig .st.s2{animation-delay:1s}
.trnfig .st.s3{animation-delay:2s}
.trnfig .st.s4{animation-delay:3s}
@keyframes shrink{0%{height:70px;y:22}100%{height:6px;y:86}}
.trnfig .err{animation:shrink 4s ease-out infinite}
/* the noise grid */
.noisegrid{display:grid;gap:2px;margin:14px auto 0;max-width:340px}
.noisegrid i{display:block;aspect-ratio:1;border-radius:2px}
/* token probability bars */
.toks{margin:14px 0 0}
.tokrow{display:grid;grid-template-columns:minmax(64px,90px) 1fr auto;gap:10px;align-items:center;
padding:5px 0;font-size:13.5px}
.tokrow .t{font-family:var(--mono);color:var(--ink)}
.tokrow .bar{height:12px;background:var(--panel2);border-radius:6px;overflow:hidden}
.tokrow .bar i{display:block;height:100%;background:var(--accent);border-radius:6px;transition:width .18s}
.tokrow .v{font-family:var(--mono);font-size:11.5px;color:var(--accent2);min-width:46px;text-align:right}
/* use-case split */
.usefor{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--line);
border-radius:var(--r-md);overflow:hidden;margin:18px 0}
.usefor > div{padding:17px}
.usefor > div:first-child{border-right:1px solid var(--line);
background:color-mix(in srgb,var(--ok) 5%,transparent)}
.usefor > div:last-child{background:color-mix(in srgb,var(--warn) 5%,transparent)}
.usefor h4{margin:0 0 10px;font-family:var(--mono);font-size:11.5px;letter-spacing:.6px;text-transform:uppercase}
.usefor > div:first-child h4{color:var(--ok)}
.usefor > div:last-child h4{color:var(--warn)}
.usefor ul{margin:0;padding:0;list-style:none}
.usefor li{padding:7px 0;color:var(--dim);font-size:13.8px;line-height:1.55;border-bottom:1px solid var(--line)}
.usefor li:last-child{border-bottom:none}
@media(max-width:600px){.usefor{grid-template-columns:1fr}
.usefor > div:first-child{border-right:none;border-bottom:1px solid var(--line)}}
`

  const nnFig = `
<svg viewBox="0 0 460 200" role="img" class="nnfig">
  ${[[40, 'n1', 3], [160, 'n2', 4], [280, 'n3', 4], [400, 'n4', 2]].map(([x, c, n]) =>
    [...Array(n)].map((_, i) => {
      const y = 100 - ((n - 1) * 34) / 2 + i * 34
      return `<circle class="${c}" cx="${x}" cy="${y}" r="5" fill="var(--accent)"/>`
    }).join('')).join('')}
  ${[[40, 3, 160, 4, ''], [160, 4, 280, 4, 'l2'], [280, 4, 400, 2, 'l3']].map(([x0, n0, x1, n1, cl]) => {
    let s = ''
    for (let i = 0; i < n0; i++) for (let j = 0; j < n1; j++) {
      const y0 = 100 - ((n0 - 1) * 34) / 2 + i * 34
      const y1 = 100 - ((n1 - 1) * 34) / 2 + j * 34
      s += `<line class="e ${cl}" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="var(--accent)" stroke-width=".9" opacity=".5"/>`
    }
    return s
  }).join('')}
  <text x="40" y="182" class="lbl" font-size="9" text-anchor="middle">input</text>
  <text x="220" y="182" class="lbl" font-size="9" text-anchor="middle">layers of weighted sums, each followed by a bend</text>
  <text x="400" y="182" class="lbl" font-size="9" text-anchor="middle">output</text>
  <text x="230" y="20" class="lbl" font-size="9.5" text-anchor="middle">no rules were written. The numbers on the lines were found by example.</text>
</svg>`

  const trnFig = `
<svg viewBox="0 0 460 190" role="img" class="trnfig">
  <circle cx="120" cy="92" r="56" fill="none" stroke="var(--line)" stroke-dasharray="4 5"/>
  <g class="orb"><circle cx="120" cy="36" r="6" fill="var(--accent)"/></g>
  <g class="st"><rect x="66" y="4" width="108" height="24" rx="5" fill="var(--panel)" stroke="var(--accent)"/>
    <text x="120" y="20" class="lbl" font-size="8.5" text-anchor="middle">1 — guess</text></g>
  <g class="st s2"><rect x="182" y="80" width="108" height="24" rx="5" fill="var(--panel)" stroke="var(--accent)"/>
    <text x="236" y="96" class="lbl" font-size="8.5" text-anchor="middle">2 — measure the error</text></g>
  <g class="st s3"><rect x="66" y="156" width="108" height="24" rx="5" fill="var(--panel)" stroke="var(--accent)"/>
    <text x="120" y="172" class="lbl" font-size="8.5" text-anchor="middle">3 — nudge every weight</text></g>
  <g class="st s4"><rect x="6" y="80" width="108" height="24" rx="5" fill="var(--panel)" stroke="var(--accent)"/>
    <text x="60" y="96" class="lbl" font-size="8.5" text-anchor="middle">4 — again</text></g>
  <rect x="356" y="22" width="26" height="70" rx="3" fill="var(--warn)" class="err"/>
  <text x="369" y="112" class="lbl" font-size="9" text-anchor="middle">error</text>
  <text x="369" y="150" class="lbl" font-size="9" text-anchor="middle">millions of</text>
  <text x="369" y="164" class="lbl" font-size="9" text-anchor="middle">times over</text>
</svg>`

  const body = `
<div class="crumb"><a href="/">showstack</a> / <a href="/learn/">learn</a> / ai</div>
${learnNav(esc, 'ai')}
<div class="lhero">
  <h2>What AI is actually doing</h2>
  <p class="lede">A network of numbers that was adjusted, by example, until it produced useful outputs — and is then run forwards. That is the whole architecture. Everything that looks like understanding is that mechanism doing its job well, and everything that looks like stupidity is the same mechanism doing its job exactly as specified.</p>
</div>

${S('The object itself', 'A neural network is a learned function', [
  'Take some numbers in. Multiply each by a weight and add them up. Bend the result — pass it through a simple non-linear function, which is what stops the whole stack collapsing back into one multiplication. Do that again, in layers, and read the numbers at the far end.',
  'That is a neural network. There is no reasoning module, no store of facts, no rulebook. The only thing that distinguishes a useful one from noise is the values of the weights, and those were not written by anybody. They were <em>found</em>.',
  'This matters more than it sounds. A model does not contain knowledge in a form you can inspect or edit. It contains a very large number of numbers that, together, implement a mapping from inputs to outputs. That is why you cannot open one up and correct a fact, and why "why did it do that" is a genuinely hard research question rather than a lookup.',
])}

${fig(nnFig, 'Weighted sums, a non-linearity, repeated. The numbers on the lines are the entire model.')}

${S('The distinction that clears up most confusion', 'Training and inference are different jobs', [
  '<b>Training</b> is the search for the weights. Show the network an example, compare its output to the right answer, calculate how much each individual weight contributed to the error, and nudge all of them slightly in the direction that reduces it. Repeat across an enormous number of examples. It takes vast compute, it happens once, and it happens somewhere else.',
  '<b>Inference</b> is running the finished function forwards on new input. It is comparatively cheap — cheap enough to run on a laptop, a phone, or a machine in a rack backstage.',
  'Nearly every practical question resolves once you know which one is being discussed. "Does it need the internet?" — inference often does not. "Does it learn from what I give it?" — not during inference; that is a separate training run somebody else decided to do. "Why is it slow?" — inference cost scales with model size and, for generative models, with how many steps you asked for.',
])}

${fig(trnFig, 'Training: guess, measure, adjust, repeat. Inference is just the first box, once.')}

${rule('A model is a <b>function that was fitted to examples</b>. It interpolates confidently inside the space it was fitted on and it has no idea where the edge of that space is — which is exactly what "hallucination" is.')}

${S('Images', 'Why a generator starts from pure noise', [
  'A diffusion model is trained on a strange task: given an image with a known amount of noise added, predict the noise. Do that well enough, across every level from barely-speckled to completely random, and you have a model that can <em>remove</em> a little noise from anything.',
  'Generation runs that backwards. Start with a field of pure random noise. Ask the model what noise it sees, remove a fraction of it, and look again. Repeat twenty or fifty times. Each step the image becomes slightly more like something the model considers plausible, and after enough steps you are left with a picture that was never in the training data but sits comfortably inside the distribution of things that were.',
  'The text prompt steers it. The words are turned into a vector by a text encoder trained to place descriptions and images near each other, and that vector biases every denoising step toward the region of the space that matches. It does not fetch anything. It bends the path.',
  'Two consequences fall straight out. The same prompt with the same starting noise — the <b>seed</b> — gives the same image every time, because nothing about the process is actually random after that first field. And the model has no model of the world: hands come out wrong not because hands are hard to draw but because nothing in the process counts fingers.',
])}

<div class="dial">
  <div class="d"><label for="ai-steps">denoising steps <b id="ai-stepsv">0</b></label>
    <input id="ai-steps" type="range" min="0" max="24" step="1" value="0"></div>
  <div class="d"><label for="ai-seed">seed <b id="ai-seedv">7</b></label>
    <input id="ai-seed" type="range" min="1" max="40" step="1" value="7"></div>
</div>
<div class="fig" data-driven="dial" style="padding:16px">
  <div class="noisegrid" id="ai-grid" aria-hidden="true"></div>
  <div class="cap" style="text-align:left;margin-top:12px">An illustration, not a real model — but the mechanism is honest. Start at zero steps and drag right: structure does not arrive from anywhere, it is what remains once enough noise has been removed. Change the seed and the same number of steps gives a different picture, because the starting noise was different.</div>
</div>

${S('Language', 'A model that only ever predicts the next token', [
  'A language model is trained on one task: given a run of text, predict what comes next. Not the answer, not the meaning — the next <b>token</b>, which is a word or a fragment of one. It outputs a probability for every token it knows.',
  'To produce a sentence it picks one, appends it, and asks again. Everything a language model appears to do — answering, summarising, translating, writing code — is that loop, run repeatedly, on a model whose weights encode an extraordinary amount of structure about how text goes together.',
  '<b>Temperature</b> controls how the pick is made. Low temperature takes the most probable token nearly every time: consistent, predictable, and dull. Raise it and the distribution is flattened, so less likely tokens get a real chance: more varied, and more likely to wander somewhere untrue.',
  'This also explains the failure everybody has met. A model has no separate sense of whether it knows something. A confident false statement and a confident true one are produced by the same process, with the same fluency, because fluency is what was optimised. The <em>tone</em> of the output carries no information about its reliability, and reading it as if it did is the mistake.',
])}

<div class="dial">
  <div class="d"><label for="ai-temp">temperature <b id="ai-tempv">0.7</b></label>
    <input id="ai-temp" type="range" min="0" max="20" step="1" value="7"></div>
</div>
<div class="fig" data-driven="dial" style="padding:16px">
  <div class="toks" id="ai-toks" aria-hidden="true"></div>
  <div class="cap" style="text-align:left;margin-top:10px">Continuing “the console sends the cue to the …”. At low temperature the top token wins almost always. Raise it and the tail gets a real chance — which is where both creativity and nonsense come from, because the model cannot tell them apart.</div>
</div>

${S('', 'What inference actually costs you', [
  'Two numbers decide whether a generative step fits into a working session: how many denoising steps you asked for, and how fast each one is on the machine you have.',
])}

<div class="dial">
  <div class="d"><label for="ic-steps">denoising steps <b id="ic-stepsv">30</b></label>
    <input id="ic-steps" type="range" min="4" max="150" step="1" value="30"></div>
  <div class="d"><label for="ic-ms">per step on this machine <b id="ic-msv">120 ms</b></label>
    <input id="ic-ms" type="range" min="5" max="600" step="5" value="120"></div>
  <div class="d"><label for="ic-n">variations wanted <b id="ic-nv">8</b></label>
    <input id="ic-n" type="range" min="1" max="64" step="1" value="8"></div>
</div>
<div class="verdict" id="ic-out"></div>

${S('On a show', 'Where it earns its place, and where it does not', [])}

<div class="usefor">
  <div>
    <h4>Genuinely useful</h4>
    <ul>
      <li><b>Transcription and captioning</b> — speech to text is now good enough to be a real accessibility tool rather than a demo, with a human check.</li>
      <li><b>Translation drafts</b> for multilingual signage and surtitles, reviewed by somebody who speaks the language.</li>
      <li><b>Content and mood exploration</b> — dozens of looks before anyone opens <a href="/software/blender/">Blender</a> or <a href="/software/touchdesigner/">TouchDesigner</a>, as a conversation with a designer.</li>
      <li><b>Upscaling, denoising, rotoscoping and stem separation</b> — narrow, well-defined jobs with a human judging the result.</li>
      <li><b>Search across your own documents</b> — riders, manuals, patch sheets — where the model retrieves and you verify. This site&rsquo;s own <a href="/api/v1/index.json">JSON API</a> is a reasonable thing to point one at.</li>
      <li><b>Anomaly spotting in monitoring data</b>, as an alert to look, never as a decision.</li>
    </ul>
  </div>
  <div>
    <h4>Not this</h4>
    <ul>
      <li><b>Anything in a safety chain.</b> Non-deterministic by construction. See <a href="/learn/code/">determinism</a>.</li>
      <li><b>Anything that must be identical every night.</b> A show is a repeatable artefact; a sampled distribution is not.</li>
      <li><b>Anything you cannot check.</b> If verifying the output is harder than doing the work, you have added risk, not capacity.</li>
      <li><b>Specifications and numbers presented as fact.</b> A model will produce a plausible DMX footprint or a plausible standard number with total confidence. Check it against the <a href="/protocols/">protocol index</a> or the <a href="/standards/">standards</a>, both of which cite a source on every claim.</li>
      <li><b>Anything on the critical path with no fallback.</b> A cloud service is a dependency; treat it like any other single point of failure.</li>
    </ul>
  </div>
</div>

${bites([
  '<b>"It knows about our system" is almost never true.</b> Unless it was given your documents at the time of asking, it is producing text shaped like documentation about a system like yours.',
  '<b>Confidence is a writing style, not a signal.</b> It was optimised for fluency, and fluency is what you get whether or not the content is right.',
  '<b>Determinism is available if you ask for it.</b> Fixed seed, temperature at zero, same input — same output. That is worth knowing when you need reproducibility.',
  '<b>Your prompt may be somebody else\'s training data.</b> Check the terms before you paste a client\'s unreleased plot into a hosted service.',
])}

${S('The question people always ask next', 'What quantum computing actually changes', [
  'It is worth being precise here, because the popular description is wrong in a specific and misleading way.',
  'A quantum computer does <b>not</b> try every answer at once and pick the right one. A qubit can be in a superposition of states, and a register of them can represent an enormous number of combinations simultaneously — but reading it out collapses the whole thing to a single value, and by default that value is random and useless.',
  'The actual skill is <b>interference</b>. A quantum algorithm has to be constructed so that the paths leading to wrong answers cancel each other out and the paths leading to right ones reinforce, so that when you finally measure, the answer you want is overwhelmingly the likely one. Only a small number of problems have a known structure that allows this, and building a new one is a research achievement rather than a programming task.',
  '<b>Shor\'s algorithm</b> factors large numbers efficiently, which breaks RSA and elliptic-curve cryptography — the mathematics under essentially all of today\'s secure connections. <b>Grover\'s algorithm</b> gives a quadratic speedup on unstructured search, which effectively halves the strength of a symmetric key. Those are the two that matter.',
  'Where it is today: machines exist, they are noisy, and error correction costs an enormous ratio of physical qubits to each reliable logical one. Nobody is close to running Shor\'s at a useful scale.',
])}

${S('', 'So what does it mean for you', [
  '<b>For processing: nothing, for the foreseeable future.</b> It will not render frames faster, mix audio, drive fixtures or run a show network. Those are not problems with the mathematical structure quantum algorithms exploit, and a GPU is a far better answer to all of them.',
  '<b>For security: something real, and already.</b> The concern is <em>harvest now, decrypt later</em> — an adversary recording encrypted traffic today and decrypting it once a capable machine exists. That is why NIST standardised post-quantum algorithms in 2024 and why browsers, VPNs and messaging systems have begun switching. It is a supply-chain and vendor question, not a show-floor one, and it is the one place your industry will actually encounter this.',
  'The realistic near-term uses are simulation of quantum systems themselves — chemistry and materials — and specific optimisation research. If a vendor tells you a quantum computer is improving your media server, that is marketing.',
])}

${rule('Quantum computing is not a faster computer. It is a <b>different machine for a small set of problems</b>, and the one that touches this industry is cryptography rather than performance.')}

${xnote('These tools change how fast an idea becomes something you can look at, which is real and worth having. What they cannot do is decide whether it belongs — and <b>the deciding is the design</b>. Used for exploration they widen the search; used for delivery they make a show that is average by construction.')}

${S('Keeping it in its place', 'A tool, aimed at a person', [
  'Everything on this page is a machine doing a version of something the <a href="/learn/perception/">previous stage</a> describes a person doing: taking in a signal, finding structure, deciding what it means. A network of weights is a crude imitation of a network of neurons, and a very good one for narrow jobs.',
  'What none of it does is care what the show is for. It has no audience, no intent, no sense of a room going quiet. It produces material; a person decides whether the material is any good and whether it belongs.',
  'That is not a limitation to be engineered away in the next release. It is what the tool is — and treating it that way is what makes it genuinely useful rather than either frightening or oversold.',
])}

<div class="cta"><strong>Using these tools on real work?</strong>
<p>The <a href="/software/">software index</a> records what tools actually speak and integrate with, which is a more useful question than what they claim. If you are running something in production with a real workflow around it, <a href="${GH}/issues/new?labels=data&amp;title=software%3A+">add it</a> — with what it does and does not do.</p></div>

<script>
(function(){
  // ---- diffusion illustration ----------------------------------------
  var st=document.getElementById('ai-steps'), sd=document.getElementById('ai-seed');
  if(st){
    var stv=document.getElementById('ai-stepsv'), sdv=document.getElementById('ai-seedv'),
        grid=document.getElementById('ai-grid'), N=18;
    grid.style.gridTemplateColumns='repeat('+N+',1fr)';
    var cells=[]; for(var i=0;i<N*N;i++){ var e=document.createElement('i'); grid.appendChild(e); cells.push(e); }
    function rnd(s){ var x=Math.sin(s)*10000; return x-Math.floor(x); }
    // the "image" the process is converging on: a simple lit-stage shape
    function target(c,r){
      var dx=(c-N/2)/N, dy=(r-N/2)/N;
      var beam = Math.abs(dx) < 0.06 + (r/N)*0.16 && r > N*0.15;
      var floor = r > N*0.78;
      return beam ? 0.95 : floor ? 0.35 : 0.08;
    }
    function draw(){
      var steps=Number(st.value), seed=Number(sd.value), k=steps/24;
      stv.textContent=steps; sdv.textContent=seed;
      for(var r=0;r<N;r++) for(var c=0;c<N;c++){
        var i=r*N+c;
        var noise=rnd(seed*97.3 + i*12.9898);
        var v = noise*(1-k) + target(c,r)*k;
        var a=Math.max(0,Math.min(1,v));
        cells[i].style.background = 'color-mix(in srgb, var(--accent) '+Math.round(a*100)+'%, var(--panel2))';
      }
    }
    st.addEventListener('input',draw); sd.addEventListener('input',draw); draw();
  }
  // ---- temperature illustration --------------------------------------
  var tp=document.getElementById('ai-temp');
  if(tp){
    var tpv=document.getElementById('ai-tempv'), box=document.getElementById('ai-toks');
    var TOK=[['console',6.0],['fixture',5.2],['media server',4.6],['node',3.9],['universe',3.2],
             ['moon',0.6],['sandwich',0.1]];
    function draw(){
      var t=Math.max(0.05,Number(tp.value)/10);
      tpv.textContent=t.toFixed(2);
      var ex=TOK.map(function(x){ return Math.exp(x[1]/t); });
      var sum=ex.reduce(function(a,b){return a+b;},0);
      box.innerHTML=TOK.map(function(x,i){
        var p=ex[i]/sum;
        return '<div class="tokrow"><span class="t">'+x[0]+'</span>'+
          '<span class="bar"><i style="width:'+(p*100).toFixed(1)+'%"></i></span>'+
          '<span class="v">'+(p*100).toFixed(1)+'%</span></div>';
      }).join('');
    }
    tp.addEventListener('input',draw); draw();
  }
})();
</script>

<script>
(function(){
  var st=document.getElementById('ic-steps'); if(!st) return;
  var ms=document.getElementById('ic-ms'), n=document.getElementById('ic-n'),
      sv=document.getElementById('ic-stepsv'), mv=document.getElementById('ic-msv'),
      nv=document.getElementById('ic-nv'), out=document.getElementById('ic-out');
  function human(s){ return s<90 ? s.toFixed(1)+' s' : s<5400 ? (s/60).toFixed(1)+' min' : (s/3600).toFixed(1)+' hours' }
  function draw(){
    var S=Number(st.value), M=Number(ms.value), N=Number(n.value);
    sv.textContent=S; mv.textContent=M+' ms'; nv.textContent=N;
    var one=(S*M)/1000, all=one*N;
    var verdict = one<2 ? '<span class="ok">Fast enough to iterate in conversation.</span> This is where it is actually useful \u2014 a designer changes a word and looks again.'
      : one<15 ? 'Slow enough that you stop iterating and start waiting. Usable, and it changes how you work.'
      : '<span class="err">A batch job, not a conversation.</span> Set it running and go and do something else.';
    out.innerHTML='<b>'+human(one)+'</b> per image, <b>'+human(all)+'</b> for '+N+
      '. '+verdict+' More steps buys diminishing quality: past roughly 30&ndash;50 the difference is usually smaller than the difference between two seeds.';
  }
  for (var el of [st,ms,n]) el.addEventListener('input',draw);
  draw();
})();
</script>
`

  return shell({
    title: 'What AI is actually doing — networks, diffusion, language models and quantum | showstack',
    description: 'A neural network is a learned function, and training and inference are different jobs. How a diffusion image generator works backwards from noise, what a language model is really predicting and why temperature matters, where these tools earn their place on a show, and the honest answer about quantum computing.',
    canonical: `${SITE}/learn/ai/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'What AI is actually doing',
      description: 'Neural networks as learned functions, training versus inference, diffusion image generation, next-token prediction and temperature, practical uses in live production, and the real impact of quantum computing.',
      url: `${SITE}/learn/ai/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
  })
}
