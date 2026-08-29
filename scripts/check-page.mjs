/**
 * /check/ — describe the rig once, get every warning at once.
 *
 * /tools/ has a calculator per question, and answers them one at a time.
 * This answers the one
 * question a production electrician actually has at 2pm: is anything about
 * this rig going to bite me tonight?
 *
 * It is a workflow rather than a calculator. The same tested arithmetic runs
 * underneath — nothing here computes anything /tools/ does not — but the
 * inputs are the things you already know about your own rig, and the output
 * is sorted by how much it matters rather than by category.
 *
 * Deliberately not a design tool and it says so. It cannot see your venue,
 * your supply impedance, or what somebody else has already hung on that beam.
 * It catches the arithmetic mistakes, which is a useful and clearly bounded
 * thing to catch.
 */
import {
  dmxLineBudget, powerLoad, phaseBalance, voltageDrop, subnetCidr,
  heatLoad, fibreLossBudget, frameBudget, FIBRE_ATTENUATION,
} from './toolmath.mjs'

const MATH_SRC = [
  dmxLineBudget, powerLoad, phaseBalance, voltageDrop, subnetCidr,
  heatLoad, fibreLossBudget, frameBudget,
].map((f) => f.toString()).join('\n\n')

// fibreLossBudget reads this table, so it has to travel with the function.
const MATH_TABLES = `const FIBRE_ATTENUATION = ${JSON.stringify(FIBRE_ATTENUATION)};`

export function checkPage({ esc, shell, SITE, GH }) {
  const body = `
<div class="crumb"><a href="/">showstack</a> / check</div>
<h2>Pre-show check</h2>
<p class="lede">Describe the rig once. Everything that can be checked by arithmetic gets checked, and the
answers come back sorted by how much they matter rather than by which calculator they came from.</p>

<form class="ck" id="ck" autocomplete="off">
  <fieldset>
    <legend>Lighting data</legend>
    <div class="ckrow">
      <label>Fixtures on the longest DMX run <input id="ck-fix" type="number" min="0" step="1" value="24" inputmode="numeric"></label>
      <label>Unit load each <select id="ck-ul">
        <option value="1">1 UL (older gear)</option>
        <option value="0.5">1/2 UL</option>
        <option value="0.25" selected>1/4 UL (most modern)</option>
        <option value="0.125">1/8 UL</option>
      </select></label>
      <label>Universes on the network <input id="ck-uni" type="number" min="0" step="1" value="8" inputmode="numeric"></label>
    </div>
  </fieldset>

  <fieldset>
    <legend>Power</legend>
    <div class="ckrow">
      <label>Total load (kW) <input id="ck-kw" type="number" min="0" step="0.5" value="24" inputmode="decimal"></label>
      <label>Supply <select id="ck-ph">
        <option value="1">Single phase 230 V</option>
        <option value="3" selected>Three phase 400 V</option>
      </select></label>
      <label>Per-phase breaker (A) <input id="ck-brk" type="number" min="1" step="1" value="63" inputmode="numeric"></label>
    </div>
    <div class="ckrow">
      <label>L1 (A) <input id="ck-l1" type="number" min="0" step="1" value="34" inputmode="numeric"></label>
      <label>L2 (A) <input id="ck-l2" type="number" min="0" step="1" value="28" inputmode="numeric"></label>
      <label>L3 (A) <input id="ck-l3" type="number" min="0" step="1" value="19" inputmode="numeric"></label>
      <label>Longest run (m) <input id="ck-run" type="number" min="0" step="1" value="45" inputmode="numeric"></label>
      <label>Cable (mm&sup2;) <input id="ck-csa" type="number" min="0.5" step="0.5" value="6" inputmode="decimal"></label>
    </div>
  </fieldset>

  <fieldset>
    <legend>Room and network</legend>
    <div class="ckrow">
      <label>Audience <input id="ck-people" type="number" min="0" step="50" value="450" inputmode="numeric"></label>
      <label>Network prefix <select id="ck-net">
        <option value="24" selected>/24 — 254 devices</option>
        <option value="23">/23 — 510</option>
        <option value="22">/22 — 1022</option>
        <option value="16">/16 — 65534</option>
      </select></label>
      <label>Devices on it <input id="ck-dev" type="number" min="0" step="10" value="90" inputmode="numeric"></label>
      <label>Longest fibre (m) <input id="ck-fib" type="number" min="0" step="10" value="0" inputmode="numeric"></label>
    </div>
  </fieldset>
</form>

<div class="ckout" id="ck-out" role="status" aria-live="polite"></div>

<div class="cta">
  <strong>What this is not.</strong>
  <p>It cannot see your venue, your supply impedance, your local wiring regulations, or what somebody else has
  already hung on that beam. It catches arithmetic mistakes, which is a real and clearly bounded thing to catch,
  and it is not a substitute for a competent person with a meter or for the
  <a href="/standards/">governing standards</a>. Every figure here is the same arithmetic
  <a href="/tools/">the calculators</a> run and the test suite checks.</p>
</div>`

  const style = `
.ck{margin:22px 0 26px}
.ck fieldset{border:1px solid var(--rule);border-radius:var(--r-lg);padding:16px 18px 18px;margin:0 0 14px;
background:var(--surface-raised)}
.ck legend{font-family:var(--mono);font-size:10.5px;letter-spacing:.8px;text-transform:uppercase;
color:var(--signal);padding:0 8px}
.ckrow{display:flex;gap:12px;flex-wrap:wrap}
.ckrow label{display:flex;flex-direction:column;gap:5px;font-family:var(--mono);font-size:10.5px;
letter-spacing:.5px;text-transform:uppercase;color:var(--ink-faint);flex:1 1 150px;min-width:0}
.ckrow input,.ckrow select{min-height:44px;padding:0 12px;font-family:var(--mono);font-size:16px;
background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:var(--r-sm);
font-variant-numeric:tabular-nums;width:100%}
.ckrow input:focus,.ckrow select:focus{outline:none;border-color:var(--focus);
box-shadow:0 0 0 3px color-mix(in srgb,var(--focus) 22%,transparent)}
.ckout{display:flex;flex-direction:column;gap:10px;margin:0 0 8px}
.ckitem{display:flex;gap:14px;align-items:flex-start;padding:15px 17px;border-radius:var(--r-md);
border:1px solid var(--rule);background:var(--surface-raised);border-left-width:4px}
.ckitem .cki{flex:0 0 auto;width:22px;height:22px;border-radius:50%;margin-top:1px;position:relative}
.ckitem > div > b{display:block;color:var(--ink);font-size:16px;margin-bottom:4px;letter-spacing:-.1px}
.ckitem em b{display:inline;color:var(--ink);font-weight:600;font-size:inherit;margin:0}
.ckitem em{font-style:normal;color:var(--ink-muted);font-size:14.2px;line-height:1.55}
.ckitem .ckwhere{display:block;margin-top:7px;font-family:var(--mono);font-size:11px;color:var(--ink-faint)}
.ckitem .ckwhere a{color:var(--ink-faint);text-decoration:underline;text-underline-offset:2px}
/* Colour alone must not carry the state (WCAG 1.4.1), so each level has a
   glyph as well as a hue - and the glyph is what survives a photocopy, a
   colour-blind reader and a phone in daylight. */
.ckitem .cki::after,.ckitem .cki::before{content:"";position:absolute;background:var(--surface-raised)}
.ckitem.stop{border-left-color:var(--fail)}
.ckitem.stop .cki{background:var(--fail)}
.ckitem.stop .cki::before,.ckitem.stop .cki::after{left:10px;top:5px;width:2px;height:12px}
.ckitem.stop .cki::before{transform:rotate(45deg)}
.ckitem.stop .cki::after{transform:rotate(-45deg)}
.ckitem.warn{border-left-color:var(--warn)}
.ckitem.warn .cki{background:var(--warn)}
.ckitem.warn .cki::before{left:10px;top:4px;width:2px;height:8px}
.ckitem.warn .cki::after{left:10px;top:14px;width:2px;height:2px}
.ckitem.ok{border-left-color:var(--verified)}
.ckitem.ok .cki{background:var(--verified)}
.ckitem.ok .cki::before{left:7px;top:10px;width:5px;height:2px;transform:rotate(45deg)}
.ckitem.ok .cki::after{left:9px;top:9px;width:9px;height:2px;transform:rotate(-50deg)}
.ckitem.ok em{color:var(--ink-faint)}
.cksum{font-family:var(--mono);font-size:12.5px;color:var(--ink-faint);margin:0 0 14px}
.cksum b{color:var(--ink)}
@media(max-width:520px){.ckrow label{flex:1 1 100%}}
`

  const script = `
${MATH_TABLES}
${MATH_SRC}
(function(){
  var $=function(s){return document.querySelector(s)};
  var out=$('#ck-out');
  if(!out)return;
  var num=function(s){return Number($(s).value)};

  /* Every check returns the same shape, so the list can be sorted by severity
     rather than by the order the checks happen to run in. What a person needs
     first is what will stop the show, not what came out of the first
     calculator. */
  function checks(){
    var r=[];
    var push=function(level,title,detail,where){r.push({level:level,title:title,detail:detail,where:where})};

    /* --- DMX --- */
    var fix=num('#ck-fix'), ul=Number($('#ck-ul').value);
    var loads=fix*ul;
    if(fix>0){
      if(loads>32) push('stop','DMX line is over 32 unit loads',
        fix+' fixtures at '+ul+' UL is <b>'+loads+' unit loads</b>. RS-485 caps a segment at 32. Split it with an opto-splitter — each output is a new segment with its own budget and its own terminator.',
        '<a href="/tools/#dmxload">DMX line budget</a> · <a href="/learn/dmx/">DMX on the wire</a>');
      else if(loads>26) push('warn','DMX line is close to the limit',
        loads+' of 32 unit loads used. That works, and it leaves no room for the fixture somebody adds at the last minute.',
        '<a href="/tools/#dmxload">DMX line budget</a>');
      else push('ok','DMX line has headroom', loads+' of 32 unit loads.', '<a href="/tools/#dmxload">DMX line budget</a>');
    }

    /* --- power --- */
    var kw=num('#ck-kw'), ph=Number($('#ck-ph').value), brk=num('#ck-brk');
    var p=powerLoad(kw*1000, ph===3?400:230, ph);
    if(p){
      var pct=Math.round(p.amps/brk*100);
      if(p.amps>brk) push('stop','Load exceeds the breaker',
        kw+' kW on '+(ph===3?'three phase':'single phase')+' is <b>'+p.amps+' A</b> per phase against a '+brk+' A supply.',
        '<a href="/tools/#power">Power load</a>');
      else if(pct>75) push('warn','Power is above the 75% headroom rule',
        p.amps+' A of '+brk+' A is '+pct+'%. Sustained load above 75% of a breaker is where nuisance trips live, and inrush has not been counted yet.',
        '<a href="/tools/#power">Power load</a> · <a href="/learn/power/">Power and the things that trip</a>');
      else push('ok','Power has headroom', p.amps+' A of '+brk+' A ('+pct+'%).','<a href="/tools/#power">Power load</a>');
    }

    /* --- phase balance --- */
    if(ph===3){
      var b=phaseBalance(num('#ck-l1'),num('#ck-l2'),num('#ck-l3'));
      if(b){
        if(b.imbalancePercent>20) push('warn','Phases are badly out of balance',
          'L1/L2/L3 at '+num('#ck-l1')+'/'+num('#ck-l2')+'/'+num('#ck-l3')+' A is <b>'+b.imbalancePercent+'%</b> imbalance, putting '+b.neutralAmps+' A down the neutral before harmonics are counted.',
          '<a href="/tools/#phase">Phase balance</a> · <a href="/learn/power/">Why the neutral matters</a>');
        else if(b.imbalancePercent>10) push('warn','Phases are uneven',
          b.imbalancePercent+'% imbalance, '+b.neutralAmps+' A in the neutral. Worth moving a circuit if it is easy.',
          '<a href="/tools/#phase">Phase balance</a>');
        else push('ok','Phases are reasonably balanced', b.imbalancePercent+'% imbalance.','<a href="/tools/#phase">Phase balance</a>');
        push('warn','The neutral carries more than this figure says',
          'This is the fundamental only. LED fixtures and switch-mode supplies put third-harmonic current down the neutral that <b>adds instead of cancelling</b>, so a balanced rig can still load the neutral heavily — and nothing protects that conductor.',
          '<a href="/learn/power/">Power, earth and the things that trip</a>');
      }
    }

    /* --- volt drop --- */
    var run=num('#ck-run'), csa=num('#ck-csa');
    if(run>0&&csa>0&&p){
      /* The phase matters: three-phase drop uses sqrt(3), single uses 2, and
         omitting it understates a three-phase run. */
      var vd=voltageDrop(p.amps, run, csa, ph===3?400:230, ph);
      if(vd){
        if(vd.dropPercent>5) push('stop','Volt drop over 5%',
          run+' m of '+csa+' mm&sup2; at '+p.amps+' A drops <b>'+vd.dropPercent+'%</b> ('+vd.dropVolts+' V), leaving '+vd.voltsAtLoad+' V at the far end. Fixtures brown out on a colour change while the console reports everything fine.',
          '<a href="/tools/#vdrop">Voltage drop</a>');
        else if(vd.dropPercent>3) push('warn','Volt drop is getting significant',
          vd.dropPercent+'% over '+run+' m. Fine at rest, and the load is not constant — peak draw happens exactly when the drop hurts most.',
          '<a href="/tools/#vdrop">Voltage drop</a>');
        else push('ok','Volt drop is fine', vd.dropPercent+'% over '+run+' m.','<a href="/tools/#vdrop">Voltage drop</a>');
      }
    }

    /* --- heat --- */
    var people=num('#ck-people');
    var h=heatLoad(kw*1000,{people:people});
    if(h){
      push(h.tonsOfCooling>15?'warn':'ok','Heat into the room',
        '<b>'+h.btuPerHour.toLocaleString()+'</b> BTU/hr — '+h.tonsOfCooling+' tons of cooling'
        + (people>0?', of which '+h.peopleW.toLocaleString()+' W is the audience':'')
        + '. Near enough every watt the rig draws ends up as heat in the room.',
        '<a href="/tools/#heat">Heat load</a>');
    }

    /* --- network --- */
    var dev=num('#ck-dev'), pfx=Number($('#ck-net').value);
    var sn=subnetCidr('10.0.0.1',pfx);
    if(sn&&dev>0){
      if(dev>sn.usableHosts) push('stop','More devices than the subnet holds',
        dev+' devices will not fit in a /'+pfx+' ('+sn.usableHosts+' usable).',
        '<a href="/tools/#subnet">Subnet</a> · <a href="/learn/network/">Show networks</a>');
      else if(dev>sn.usableHosts*0.7) push('warn','Subnet is filling up',
        dev+' of '+sn.usableHosts+' usable addresses. Fine now; awkward when the video department arrives.',
        '<a href="/tools/#subnet">Subnet</a>');
      else push('ok','Subnet has room', dev+' of '+sn.usableHosts+' usable addresses.','<a href="/tools/#subnet">Subnet</a>');
    }
    var uni=num('#ck-uni');
    if(uni>0){
      push('warn','Multicast needs snooping and a querier',
        uni+' universes is about '+(Math.round(uni*0.22*10)/10)+' Mbit/s of multicast. Without IGMP snooping every port receives all of it; with snooping but <b>no querier</b>, memberships age out and traffic starts and stops on a timer, which reads as random dropouts.',
        '<a href="/learn/network/">Show networks</a> · <a href="/protocols/igmp/">IGMP</a>');
    }

    /* --- fibre --- */
    var fib=num('#ck-fib');
    if(fib>0){
      var f=fibreLossBudget(fib,'om3-850',2,0);
      if(f){
        if(!f.ok) push('stop','Fibre run is over budget',
          fib+' m of OM3 at 850 nm loses <b>'+f.totalLossDb+' dB</b> against a typical 8 dB budget. Singlemode reaches much further.',
          '<a href="/tools/#fibre">Fibre loss budget</a>');
        else if(f.thin) push('warn','Fibre run has little margin',
          f.totalLossDb+' dB used, '+f.marginDb+' dB spare. It works today and fails after one re-terminated connector or a dirty end face.',
          '<a href="/tools/#fibre">Fibre loss budget</a>');
        else push('ok','Fibre run has margin', f.marginDb+' dB spare over '+fib+' m.','<a href="/tools/#fibre">Fibre loss budget</a>');
      }
    }

    return r;
  }

  var ORDER={stop:0,warn:1,ok:2};
  function render(){
    var r=checks().sort(function(a,b){return ORDER[a.level]-ORDER[b.level]});
    var stops=r.filter(function(x){return x.level==='stop'}).length;
    var warns=r.filter(function(x){return x.level==='warn'}).length;
    var sum='<p class="cksum">'
      + (stops? '<b>'+stops+'</b> that will stop you' : 'Nothing that will stop you')
      + ' &middot; <b>'+warns+'</b> worth looking at &middot; '
      + r.filter(function(x){return x.level==='ok'}).length+' checked and fine</p>';
    out.innerHTML = sum + r.map(function(x){
      return '<div class="ckitem '+x.level+'"><span class="cki" aria-hidden="true"></span><div>'
        + '<b>'+x.title+'</b><em>'+x.detail+'</em>'
        + '<span class="ckwhere">'+x.where+'</span></div></div>';
    }).join('');
  }
  $('#ck').addEventListener('input',render);
  $('#ck').addEventListener('change',render);
  render();
})();
`

  return shell({
    title: 'Pre-show check — is anything about this rig going to bite me? | showstack',
    description: 'Describe a rig once and get every arithmetic check at once: DMX unit loads, power headroom, phase balance, volt drop, heat, subnet size, multicast and fibre budget — sorted by how much each one matters.',
    canonical: `${SITE}/check/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'showstack pre-show check',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      url: `${SITE}/check/`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
