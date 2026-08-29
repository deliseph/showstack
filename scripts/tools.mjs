/**
 * /tools/ — the calculators technicians reach for daily.
 *
 * The market told us what belongs here: the consistently top-ranked apps for
 * working technicians are DMX/DIP addressing calculators, speaker delay
 * calculators, and ShowTool-style timecode utilities. This page is those,
 * in one URL, offline-capable, with no install and no ads.
 *
 * Design constraints, in order:
 *  - Works from a phone on venue wifi, or none: everything client-side.
 *  - The arithmetic is the SAME code that is unit tested in Node. The
 *    functions in toolmath.mjs are embedded via toString(), so the page can
 *    never drift from the tested implementation.
 *  - Where two conventions exist in the field (DIP minus-one fixtures), the
 *    page says so instead of silently picking one. A wrong address set
 *    confidently is the exact failure this page exists to prevent.
 */
import { LEARN_TOPICS, LEARN_COUNT } from './learn-kit.mjs'

/**
 * Every calculator on the page, in the order it appears, grouped the way the
 * page groups them.
 *
 * This exists because "34 calculators" was written into the prose of three
 * different files by hand and was wrong in all three within two rounds of
 * work. The count is now read off this list, and a test asserts the list
 * matches what the page actually renders, so the sentence cannot lie again.
 */
export const TOOL_GROUPS = [
  ['Addressing & show control', ['dmx', 'dmxload', 'dip', 'dmxrate', 'uid', 'tc', 'midi', 'relay']],
  ['Audio', ['delay', 'spl', 'latency', 'spkz', 'audiounits', 'dose', 'modes', 'array']],
  ['Lighting & video', ['beam', 'led', 'throw', 'screen', 'aspect', 'mix', 'whites', 'mired', 'stops']],
  ['Power & electrical', ['power', 'vdrop', 'derate', 'phase', 'thd', 'ohm', 'heat', 'battery']],
  ['Rigging, load & weather', ['bridle', 'wind', 'dew']],
  ['Scenic & illusion', ['peppers', 'forced']],
  ['Access', ['flash', 'ada']],
  ['Content & timing', ['frame', 'pyro', 'storage']],
  ['Networking', ['subnet', 'fibre', 'sdi']],
  ['Protocol builders', ['osc', 'pjlink', 'artnet', 'sacn', 'rdmpkt', 'mscb']],
  ['RF', ['im', 'rf']],
]

export const TOOL_IDS = TOOL_GROUPS.flatMap(([, ids]) => ids)
export const TOOL_COUNT = TOOL_IDS.length
import {
  CORRECTION_GELS, FIBRE_ATTENUATION, BEAUFORT, BUNDLE_FACTORS, SDI_RATES,
  miredShift, fibreLossBudget, heatLoad, videoStorage, batteryRuntime, whFromMah, aspectFit,
  roomModes, lineArrayCoverage, stopsOfLight,
  windLoad, beaufort, dewPoint, flashRate, assistiveListening,
  cableDerating, awgToMm2, mm2ToAwg, coaxReach,
  srgbToLinear, linearToSrgb, colourMix, mixWhites, midiDecode, midiNoteName,
  peppersGhost, forcedPerspective, STEREO_LIMIT_M,
  dmxFrameTime, rdmOverhead, rdmUid, thd, crestFactor, RDM_OVERHEAD_BYTES,
  oscMessage, md5, pjlinkCommand, PJLINK_COMMANDS, artnetDmx, artnetPoll, ARTNET_OPCODES,
  rdmPacket, RDM_COMMAND_CLASSES, RDM_PIDS, mmcCommand, MMC_COMMANDS, mscCommand, sacnPacket, SACN_ACN_ID,
  channelDetail, sysexDetail, MIDI_CHANNEL, MIDI_SYSTEM, NOTE_NAMES, MSC_FORMATS, MSC_COMMANDS,
  sacnMulticast, artnetCompose, artnetSplit,
  dmxAbsolute, dmxFromAbsolute, dipSwitches, dipToAddress,
  speakerDelay, tcToFrames, framesToTc,
  powerLoad, beamDiameter, illuminance, ledWall, rfWavelength,
  ohmsLaw, speakerImpedance, processingDelay, speakerNetwork,
  throwRatio, screenLuminance, relayLogic, dbuToDbv, dbvToDbu,
  bridleTension, voltageDrop, phaseBalance, noiseDose, intermod3,
  subnetCidr, dmxLineBudget, splAtDistance, frameBudget, pyroCueTime, tcString,
} from './toolmath.mjs'

// The tested implementations, embedded verbatim.
const MATH_SRC = [
  sacnMulticast, artnetCompose, artnetSplit,
  dmxAbsolute, dmxFromAbsolute, dipSwitches, dipToAddress,
  speakerDelay, tcToFrames, framesToTc,
  powerLoad, beamDiameter, illuminance, ledWall, rfWavelength,
  ohmsLaw, speakerImpedance, processingDelay, speakerNetwork,
  throwRatio, screenLuminance, relayLogic, dbuToDbv, dbvToDbu,
  bridleTension, voltageDrop, phaseBalance, noiseDose, intermod3,
  subnetCidr, dmxLineBudget, splAtDistance, frameBudget, pyroCueTime, tcString,
  miredShift, fibreLossBudget, heatLoad, videoStorage, batteryRuntime, whFromMah, aspectFit,
  roomModes, lineArrayCoverage, stopsOfLight,
  windLoad, beaufort, dewPoint, flashRate, assistiveListening,
  cableDerating, awgToMm2, mm2ToAwg, coaxReach,
  srgbToLinear, linearToSrgb, colourMix, mixWhites, midiDecode, midiNoteName,
  peppersGhost, forcedPerspective,
  dmxFrameTime, rdmOverhead, rdmUid, thd, crestFactor,
  oscMessage, md5, pjlinkCommand, artnetDmx, artnetPoll, rdmPacket, mmcCommand, mscCommand, sacnPacket,
  channelDetail, sysexDetail,
].map((f) => f.toString()).join('\n\n')

// Two of the new tools need their reference tables in the page as well as the
// function, so they are serialised beside the source rather than duplicated.
const MATH_TABLES = `const CORRECTION_GELS = ${JSON.stringify(CORRECTION_GELS)};
const FIBRE_ATTENUATION = ${JSON.stringify(FIBRE_ATTENUATION)};
const BEAUFORT = ${JSON.stringify(BEAUFORT)};
const BUNDLE_FACTORS = ${JSON.stringify(BUNDLE_FACTORS)};
const SDI_RATES = ${JSON.stringify(SDI_RATES)};
const MIDI_CHANNEL = ${JSON.stringify(MIDI_CHANNEL)};
const MIDI_SYSTEM = ${JSON.stringify(MIDI_SYSTEM)};
const NOTE_NAMES = ${JSON.stringify(NOTE_NAMES)};
const MSC_FORMATS = ${JSON.stringify(MSC_FORMATS)};
const MSC_COMMANDS = ${JSON.stringify(MSC_COMMANDS)};
const STEREO_LIMIT_M = ${JSON.stringify(STEREO_LIMIT_M)};
const RDM_OVERHEAD_BYTES = ${JSON.stringify(RDM_OVERHEAD_BYTES)};
const PJLINK_COMMANDS = ${JSON.stringify(PJLINK_COMMANDS)};
const ARTNET_OPCODES = ${JSON.stringify(ARTNET_OPCODES)};
const RDM_COMMAND_CLASSES = ${JSON.stringify(RDM_COMMAND_CLASSES)};
const RDM_PIDS = ${JSON.stringify(RDM_PIDS)};
const MMC_COMMANDS = ${JSON.stringify(MMC_COMMANDS)};
const SACN_ACN_ID = ${JSON.stringify(SACN_ACN_ID)};
const enc = new TextEncoder();
const toHex = (bytes) => [...bytes].map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');`

/**
 * Everything on this page that is the same for every calculator: the finder,
 * the category rail, per-tool permalinks, copy-result and recently-used.
 *
 * Written once and applied generically rather than per tool - 42 hand-wired
 * copies of a copy button is how a page like this rots. Nothing here touches
 * the arithmetic; every calculator still returns exactly the numbers the test
 * suite checks.
 */
const TOOLKIT_JS = `
/**
 * Render a result to a PNG on a canvas and put it on the clipboard.
 *
 * A link pasted into a production WhatsApp group shows a bare URL, and a
 * screenshot of a phone browser loses the numbers to compression and includes
 * half the nav. This produces a small, legible card with the tool name, the
 * inputs, the answer and where it came from - which is what somebody actually
 * wants to send at 4pm.
 *
 * Canvas rather than a server: it works with no signal, needs no runtime, and
 * nothing about the calculation leaves the device.
 */
function shotResult(tool, out, btn){
  try{
    var title=(tool.querySelector('h3')||{}).textContent||'showstack';
    title=title.replace(/#$|copied$/,'').replace(/image$/,'').trim();
    var answer=out.innerText.trim();
    var inputs=[].slice.call(tool.querySelectorAll('.field')).map(function(f){
      var l=f.querySelector('label'), i=f.querySelector('input,select');
      if(!l||!i)return null;
      var v=i.tagName==='SELECT'?(i.selectedOptions[0]||{}).textContent:i.value;
      return l.textContent.replace(/\\s+/g,' ').trim()+': '+String(v||'').trim();
    }).filter(Boolean).slice(0,6);

    var cs=getComputedStyle(document.documentElement);
    var bg=cs.getPropertyValue('--surface-raised').trim()||'#fff';
    var ink=cs.getPropertyValue('--ink').trim()||'#111';
    var dim=cs.getPropertyValue('--ink-muted').trim()||'#555';
    var faint=cs.getPropertyValue('--ink-faint').trim()||'#888';
    var sig=cs.getPropertyValue('--signal').trim()||'#0b7561';
    var rule=cs.getPropertyValue('--rule').trim()||'#ddd';

    var W=1200,PAD=64,scale=2;
    var mono='"JetBrains Mono", ui-monospace, monospace';
    var sans='"IBM Plex Sans", system-ui, sans-serif';

    /* Measure first so the card is exactly as tall as its content. */
    var probe=document.createElement('canvas').getContext('2d');
    function wrap(text,font,maxW){
      probe.font=font;
      var words=String(text).split(/\\s+/), lines=[], line='';
      for(var i=0;i<words.length;i++){
        var t=line?line+' '+words[i]:words[i];
        if(probe.measureText(t).width>maxW && line){lines.push(line);line=words[i]}
        else line=t;
      }
      if(line)lines.push(line);
      return lines;
    }
    /* Split on meaning, not on where the line happens to break: the headline
       is the first clause, the rest is context set smaller. Changing size
       mid-sentence is what made the first version read badly. */
    var flat=answer.replace(/\\s*\\n\\s*/g,' \u00b7 ');
    var cut=flat.indexOf(' \u00b7 ');
    var head=cut>0?flat.slice(0,cut):flat;
    var restText=cut>0?flat.slice(cut+3):'';
    var answerFont='600 44px '+mono;
    var restFont='400 27px '+mono;
    var headLines=wrap(head,answerFont,W-PAD*2);
    var restLines=restText?wrap(restText,restFont,W-PAD*2).slice(0,3):[];
    var H=PAD+34+22+headLines.length*56+restLines.length*38+26+(inputs.length?36:0)+56+PAD;

    var cv=document.createElement('canvas');
    cv.width=W*scale; cv.height=H*scale;
    var g=cv.getContext('2d'); g.scale(scale,scale);
    g.fillStyle=bg; g.fillRect(0,0,W,H);
    g.fillStyle=sig; g.fillRect(0,0,W,6);

    var y=PAD+8;
    g.fillStyle=faint; g.font='500 20px '+mono;
    g.fillText('showstack \u00b7 field tools',PAD,y);
    y+=34;
    g.fillStyle=ink; g.font='650 30px '+sans;
    g.fillText(title,PAD,y);
    y+=48;

    g.font=answerFont; g.fillStyle=sig;
    for(var i=0;i<headLines.length;i++){ g.fillText(headLines[i],PAD,y); y+=56 }
    if(restLines.length){
      g.font=restFont; g.fillStyle=dim; y-=6;
      for(var j=0;j<restLines.length;j++){ g.fillText(restLines[j],PAD,y); y+=38 }
    }

    if(inputs.length){
      y+=6; g.fillStyle=rule; g.fillRect(PAD,y,W-PAD*2,1); y+=30;
      g.fillStyle=faint; g.font='400 22px '+mono;
      g.fillText(inputs.join('   \u00b7   ').slice(0,110),PAD,y);
    }

    g.fillStyle=faint; g.font='400 20px '+mono;
    g.fillText(location.origin.replace(/^https?:\\/\\//,'')+'/tools/#'+tool.id,PAD,H-PAD+12);

    cv.toBlob(function(blob){
      if(!blob){btn.textContent='image';return}
      var done=function(){ btn.textContent='copied'; btn.setAttribute('data-done','');
        setTimeout(function(){btn.textContent='image';btn.removeAttribute('data-done')},1600) };
      if(navigator.clipboard && window.ClipboardItem){
        navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(done,function(){ download(blob) });
      } else download(blob);
      function download(b){
        var a=document.createElement('a');
        a.href=URL.createObjectURL(b);
        a.download='showstack-'+tool.id+'.png';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function(){URL.revokeObjectURL(a.href)},2000);
        btn.textContent='saved'; btn.setAttribute('data-done','');
        setTimeout(function(){btn.textContent='image';btn.removeAttribute('data-done')},1600);
      }
    },'image/png');
  }catch(err){ btn.textContent='image'; }
}

(function(){
  var wrap=document.getElementById('toolwrap');
  if(!wrap)return;
  var tools=[].slice.call(wrap.querySelectorAll('.tool'));
  var groups=[].slice.call(wrap.querySelectorAll('.toolgroup'));

  /* --- permalink + copy on every tool --- */
  tools.forEach(function(t){
    var h=t.querySelector('h3'); if(h&&t.id){
      var a=document.createElement('a');
      a.className='tlink'; a.href='#'+t.id; a.textContent='#';
      a.title='Link to this tool'; a.setAttribute('aria-label','Copy a link to '+h.textContent.trim());
      a.addEventListener('click',function(e){
        e.preventDefault();
        var url=location.origin+location.pathname+'#'+t.id;
        history.replaceState(null,'',url);
        if(navigator.clipboard)navigator.clipboard.writeText(url).catch(function(){});
        a.textContent='copied'; a.setAttribute('data-done','');
        setTimeout(function(){a.textContent='#';a.removeAttribute('data-done')},1400);
      });
      h.appendChild(a);
    }
    var out=t.querySelector('.out');
    if(out){
      /* The button goes in a wrapper beside .out, not inside it: every
         calculator rewrites out.innerHTML on each keystroke, which would
         delete a child button on the first character typed. */
      var w=document.createElement('div');
      w.className='outwrap';
      out.parentNode.insertBefore(w,out);
      w.appendChild(out);
      /* Two ways to get a result out. Text for a terminal or a note; an image
         for a production group chat, where a pasted link shows nothing and a
         screenshot loses the numbers to compression. */
      var img=document.createElement('button');
      img.type='button'; img.className='tcopy tshot'; img.textContent='image';
      img.setAttribute('aria-label','Copy this result as an image');
      img.addEventListener('click',function(){ shotResult(t,out,img) });
      w.appendChild(img);

      var c=document.createElement('button');
      c.type='button'; c.className='tcopy'; c.textContent='copy';
      c.setAttribute('aria-label','Copy this result');
      c.addEventListener('click',function(){
        var txt=out.innerText.trim();
        if(navigator.clipboard)navigator.clipboard.writeText(txt).catch(function(){});
        c.textContent='copied'; c.setAttribute('data-done','');
        setTimeout(function(){c.textContent='copy';c.removeAttribute('data-done')},1400);
      });
      w.appendChild(c);
    }
  });

  /* --- category rail, built from the group headings that are already there --- */
  var rail=document.getElementById('trail');
  groups.forEach(function(g,i){
    var id='g'+i; g.id=id;
    var a=document.createElement('a');
    a.href='#'+id; a.textContent=g.textContent.trim();
    rail.appendChild(a);
  });
  var seen=[].slice.call(rail.children);
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting)return;
        var i=groups.indexOf(e.target);
        seen.forEach(function(a,j){ if(j===i)a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current') });
      });
    },{rootMargin:'-90px 0px -70% 0px'});
    groups.forEach(function(g){io.observe(g)});
  }

  /* --- the finder --- */
  var input=document.getElementById('tf'), none=document.getElementById('tnone'), count=document.getElementById('tfn');
  function apply(q){
    q=q.trim().toLowerCase();
    var shown=0;
    tools.forEach(function(t){
      var on=!q||t.innerText.toLowerCase().indexOf(q)>-1;
      t.hidden=!on; if(on)shown++;
    });
    /* a group heading with nothing under it is noise */
    groups.forEach(function(g){
      var any=false,n=g.nextElementSibling;
      while(n&&!n.classList.contains('toolgroup')){
        if(n.classList.contains('toolgrid')){
          if([].slice.call(n.querySelectorAll('.tool')).some(function(t){return !t.hidden}))any=true;
        } else if(n.classList.contains('tool')&&!n.hidden) any=true;
        n=n.nextElementSibling;
      }
      g.hidden=!any;
    });
    none.hidden=shown>0;
    rail.hidden=!!q;
    count.textContent=q?(shown+' of '+tools.length+' tools'):'';
  }
  input.addEventListener('input',function(){apply(input.value)});

  /* --- recently used, on this device only --- */
  var KEY='ss-tools';
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return []}}
  function save(a){try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
  function title(id){var t=document.getElementById(id);var h=t&&t.querySelector('h3');
    return h?h.textContent.replace(/#$|copied$/,'').trim():id}
  function note(id){
    var a=load().filter(function(x){return x!==id}); a.unshift(id);
    save(a.slice(0,4)); paintRecent();
  }
  function paintRecent(){
    var a=load().filter(function(id){return document.getElementById(id)});
    var box=document.getElementById('trecent'), list=document.getElementById('trl');
    box.hidden=a.length<2;
    list.innerHTML='';
    a.forEach(function(id){
      var el=document.createElement('a'); el.href='#'+id; el.textContent=title(id);
      list.appendChild(el);
    });
  }
  tools.forEach(function(t){
    t.addEventListener('input',function(){note(t.id)});
    t.addEventListener('click',function(e){if(e.target.closest('button,select'))note(t.id)});
  });
  paintRecent();

  /* --- deep link straight to one tool --- */
  if(location.hash){
    var t=document.querySelector(location.hash);
    if(t&&t.classList.contains('tool'))t.scrollIntoView({block:'center'});
  }
})();
`

export function toolsPage({ esc, shell, SITE, GH, SPONSOR }) {
  const style = `
.tool{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin-bottom:22px}
.tool h3{margin-top:0}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin-bottom:10px}
.field{display:flex;flex-direction:column;gap:4px}
.field label{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--dimmer)}
.field input,.field select{padding:9px 11px;background:var(--panel2);color:var(--ink);
border:1px solid var(--rule-strong);border-radius:7px;font-family:var(--mono);font-size:16px;
min-height:44px;width:110px;font-variant-numeric:tabular-nums}
.field input:focus-visible,.field select:focus-visible{outline:2px solid var(--focus);outline-offset:1px}
.field select{width:auto;max-width:100%}
/* A long <option> makes a <select> as wide as its longest label, which on a
   390px screen pushes the whole document sideways. Clamp the field, not just
   the control, since the field is the flex item that was growing. */
.field{max-width:100%;min-width:0}
.field textarea{max-width:100%}
@media(max-width:640px){
  .field select,.field textarea{width:100%}
  .tool{padding:16px 15px}
}
/* Von Restorff: in every one of these tools exactly one number is the thing
   the person came for, and results used to be set at the same weight as the
   inputs. The result surface is now sunken and the first figure in it is set
   large, in mono, with tabular figures so it does not jitter as you type.
   Later figures stay legible but recede. */
.out{font-family:var(--mono);font-size:15px;color:var(--ink-muted);background:var(--surface-sunken);
border:1px solid var(--rule);border-radius:var(--r-sm);padding:13px 140px 13px 15px;margin-top:8px;overflow-x:auto;min-height:56px;
line-height:1.65;font-variant-numeric:tabular-nums;position:relative}
.out b{color:var(--accent2);font-weight:600}
.out b:first-of-type{font-size:23px;color:var(--signal);letter-spacing:-.4px;line-height:1.15;
display:inline-block;vertical-align:-1px}
.out .err{color:var(--fail);font-weight:600}
.out .warn{color:var(--warn);font-weight:600}
.swatches{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,132px),1fr));gap:10px;margin:14px 0 4px}
.sw{border:1px solid var(--rule-strong);border-radius:var(--r-sm);overflow:hidden;background:var(--surface-raised)}
.sw .chip{height:58px;display:block}
.sw b{display:block;font-family:var(--mono);font-size:10.5px;letter-spacing:.5px;text-transform:uppercase;
color:var(--ink-faint);padding:8px 10px 2px}
.sw em{display:block;font-style:normal;font-family:var(--mono);font-size:12.5px;color:var(--ink);padding:0 10px 9px}
.bytes{font-family:var(--mono);font-size:12px;line-height:1.7;color:var(--ink-muted);
background:var(--surface-sunken);border:1px solid var(--rule);border-radius:var(--r-sm);
padding:10px 12px;margin:10px 0 0;overflow-x:auto;word-break:break-all}
.bytes:empty{display:none}
.midisend{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px}
.midisend select{min-height:44px;padding:0 10px;background:var(--panel2);color:var(--ink);
border:1px solid var(--rule-strong);border-radius:7px;font-family:var(--mono);font-size:13px;max-width:100%}
.midisend button{min-height:44px;padding:0 18px;border:1px solid var(--signal);border-radius:var(--r-pill);
background:color-mix(in srgb,var(--signal) 14%,transparent);color:var(--signal);
font-family:var(--mono);font-size:13px;cursor:pointer}
.midisend button:hover{background:color-mix(in srgb,var(--signal) 24%,transparent)}
.midisend span{font-family:var(--mono);font-size:12px;color:var(--ink-faint)}
.fllist{margin:6px 0 8px;padding-left:18px}
.fllist li{margin:3px 0;color:var(--ink-muted)}
.out .err:first-of-type,.out .ok:first-of-type{font-size:inherit}
.outwrap{position:relative}
.tcopy{position:absolute;top:5px;right:5px;font-family:var(--mono);font-size:10px;letter-spacing:.5px;
text-transform:uppercase;color:var(--ink-faint);background:var(--surface-raised);border:1px solid var(--rule-strong);
border-radius:var(--r-pill);min-height:44px;min-width:56px;padding:0 12px;cursor:pointer;opacity:0;
display:inline-flex;align-items:center;justify-content:center;
transition:opacity var(--dur-fast),color var(--dur-fast)}
.tool:hover .tcopy,.tcopy:focus-visible{opacity:1}
.tcopy:hover{color:var(--signal);border-color:var(--signal)}
.tcopy[data-done]{color:var(--verified);border-color:var(--verified);opacity:1}
@media(hover:none){.tcopy{opacity:1}}
/* Declared after .tcopy, not before it: .tshot carries both classes, both
   selectors weigh the same, so whichever is written last sets the offset. When
   this sat above, the image button was parked underneath the copy button and
   could not be clicked at all. */
.tshot{right:min(70px,38%)}

/* Find a tool. Forty-two calculators in one scroll is a reference; a rigger
   on a phone should not pass nineteen of them to reach voltage drop. */
/* The offline panel lives on /tools/ because that is where somebody who is
   about to lose signal actually is. It stays hidden until the browser confirms
   a service worker is running, so it never promises something that is not
   there. */
/* The ask, at the moment of value rather than in the footer. It appears once
   per browser after somebody has actually got an answer out of the page, it is
   one line, and dismissing it is permanent. A modal here would be a betrayal
   of the thing that makes people want to support it in the first place. */
.ask{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:18px 0 0;padding:13px 16px;
border:1px solid color-mix(in srgb,var(--signal) 30%,var(--rule));border-radius:var(--r-md);
background:color-mix(in srgb,var(--signal) 6%,var(--surface-raised))}
.ask p{margin:0;flex:1 1 300px;min-width:0;color:var(--ink-muted);font-size:13.8px;line-height:1.55}
.ask a{display:inline-flex;align-items:center;gap:7px;min-height:44px;padding:0 16px;flex:0 0 auto;
border-radius:var(--r-pill);font-family:var(--mono);font-size:12.5px;
background:var(--signal);color:var(--signal-ink);border:1px solid var(--signal)}
.ask a:hover{filter:brightness(1.08);text-decoration:none;color:var(--signal-ink)}
.ask button{flex:0 0 auto;min-height:44px;padding:0 12px;border:0;background:none;cursor:pointer;
font-family:var(--mono);font-size:11.5px;color:var(--ink-faint)}
.ask button:hover{color:var(--ink-muted);text-decoration:underline}
.offline{border:1px solid var(--rule);border-radius:var(--r-lg);background:var(--surface-raised);
padding:18px 20px;margin:22px 0 4px}
.offhead{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:9px}
.offk{font-family:var(--mono);font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:var(--signal)}
.offstate{font-family:var(--mono);font-size:11px;color:var(--ink-faint)}
.offstate[data-on]{color:var(--verified)}
.offp{margin:0 0 14px;color:var(--ink-muted);font-size:14.5px;line-height:1.6;max-width:66ch}
.offbtns{display:flex;gap:9px;flex-wrap:wrap}
.offbtns button{font-family:var(--mono);font-size:12.5px;padding:0 16px;min-height:44px;border-radius:var(--r-pill);
border:1px solid var(--rule-strong);background:var(--surface);color:var(--ink-muted);cursor:pointer;
display:inline-flex;align-items:center;gap:7px}
.offbtns button:hover:not(:disabled){color:var(--signal);border-color:var(--signal)}
.offbtns button:disabled{opacity:.55;cursor:default}
.offbtns button span{color:var(--ink-faint);font-size:11px}
.offbtns button[data-done]{color:var(--verified);border-color:var(--verified)}
.offnote{margin:12px 0 0;font-family:var(--mono);font-size:10.5px;color:var(--ink-faint);line-height:1.6}
.tfind{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:22px 0 12px}
.tfind label{font-family:var(--mono);font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:var(--ink-faint)}
.tfind input{flex:1 1 260px;min-width:0;min-height:44px;padding:0 14px;font-size:16px;font-family:var(--mono);
background:var(--surface-raised);color:var(--ink);border:1px solid var(--rule-strong);border-radius:var(--r-sm)}
.tfind input:focus{outline:none;border-color:var(--focus);box-shadow:0 0 0 3px color-mix(in srgb,var(--focus) 22%,transparent)}
.tfn{font-family:var(--mono);font-size:12px;color:var(--ink-faint);font-variant-numeric:tabular-nums}
.trail{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 0 8px;padding-bottom:2px;
position:sticky;top:var(--stick,96px);z-index:5;background:var(--surface);
-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 22px),transparent);
mask-image:linear-gradient(90deg,#000 calc(100% - 22px),transparent)}
.trail::-webkit-scrollbar{display:none}
.trail a{flex:0 0 auto;font-family:var(--mono);font-size:12px;padding:0 13px;min-height:44px;border-radius:var(--r-pill);
border:1px solid var(--rule);color:var(--ink-muted);display:inline-flex;align-items:center;white-space:nowrap;
background:var(--surface-raised)}
.trail a:hover{color:var(--signal);border-color:var(--signal);text-decoration:none}
.trail a[aria-current]{color:var(--signal);border-color:var(--signal);
background:color-mix(in srgb,var(--signal) 12%,var(--surface-raised))}
.trecent{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:0 0 16px}
.trk{font-family:var(--mono);font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:var(--ink-faint)}
.trl{display:flex;gap:6px;flex-wrap:wrap}
.trl a{font-family:var(--mono);font-size:12px;padding:0 12px;min-height:36px;border-radius:var(--r-pill);
border:1px dashed var(--rule-strong);color:var(--ink-muted);display:inline-flex;align-items:center}
.trl a:hover{color:var(--signal);border-color:var(--signal);text-decoration:none}
.tnone{color:var(--ink-muted);font-size:15px;line-height:1.6;margin:14px 0}
.tool h3{display:flex;align-items:center;gap:8px}
.tlink{font-family:var(--mono);font-size:11px;color:var(--ink-faint);text-decoration:none;opacity:0;
min-height:44px;min-width:44px;display:inline-flex;align-items:center;justify-content:center;
padding:0 6px;border-radius:var(--r-sm);margin:-10px 0}
.tool:hover .tlink,.tlink:focus-visible{opacity:1}
.tlink:hover{color:var(--signal);text-decoration:none}
.tlink[data-done]{color:var(--verified);opacity:1}
@media(hover:none){.tlink{opacity:1}}
.tool:target{border-color:var(--signal);box-shadow:0 0 0 3px color-mix(in srgb,var(--signal) 18%,transparent)}
/* The bank wraps rather than scrolls, and the numbers live INSIDE the
   buttons. Both of those are fixes for the same mistake.
   
   It used to be a horizontal scroller with overflow-x:auto and
   overflow-y:visible, and the second of those is not a thing CSS will do:
   when one axis is not visible the other computes to auto as well. So the
   switch numbers, positioned at top:-18px outside the button, were clipped
   by a scroll container at every width. And because the scrollbar was
   deliberately hidden, switches 8 and 9 sat outside the box with nothing on
   screen to say they existed. Nine switches at 44px need 444px and the
   column is about 325px, so that was every visit, not an edge case. */
.dips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 4px}
.dip{width:44px;height:64px;flex:0 0 auto;border:1px solid var(--rule-strong);border-radius:5px;
background:var(--panel2);position:relative;cursor:pointer;padding:0}
.dip:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.dip::after{content:"";position:absolute;left:7px;right:7px;height:19px;border-radius:3px;
background:var(--dimmer);bottom:4px;transition:all .12s}
.dip[aria-pressed="true"]::after{top:19px;bottom:auto;background:var(--signal)}
.dip .n{position:absolute;top:3px;left:0;right:0;text-align:center;font-family:var(--mono);
font-size:10px;color:var(--dimmer);line-height:1.2}
.dip[aria-pressed="true"] .n{color:var(--signal)}
/* Which way is on. A real DIP block prints this on the housing, and without
   it the up/down convention is something you have to already know. */
.dips-wrap{display:flex;align-items:flex-start;gap:9px;margin-top:2px}
.dipkey{flex:0 0 auto;width:26px;height:64px;margin-top:10px;position:relative;
font-family:var(--mono);font-size:9.5px;letter-spacing:.5px;color:var(--ink-faint)}
.dipkey b{position:absolute;top:17px;right:0;font-weight:400;color:var(--signal)}
.dipkey i{position:absolute;bottom:5px;right:0;font-style:normal}
.note{font-size:13.5px;color:var(--dimmer);margin-top:8px}
.note a{color:var(--accent)}
label.inline{display:flex;gap:10px;align-items:center;font-size:14px;color:var(--dim);
margin-top:8px;min-height:44px;cursor:pointer}
label.inline input[type=checkbox]{width:20px;height:20px;flex:0 0 auto;accent-color:var(--signal)}
/* True masonry, not a uniform-row grid: CSS grid sizes every row to its
   tallest card, so a short calculator next to a tall one leaves dead space
   underneath it. Multi-column flow instead packs each card into whichever
   column is shortest so far, using the card's own height — no row to be
   uneven. Each domain group gets its OWN small column container rather
   than one page-wide one: a column-span:all break (a wide card, or a group
   label) forces every column to resync to the same height at that point,
   so one shared container turns every group boundary back into the exact
   row-height-mismatch gap this layout exists to avoid. Scoping the columns
   per group keeps that resync cheap — it only has to balance 2-4 cards,
   not the whole page. */
.toolearn{margin:36px 0 22px;padding-top:26px;border-top:1px solid var(--line)}
.toolearn h3{font-family:var(--sans);font-size:19px;letter-spacing:-.2px;text-transform:none;margin:0 0 6px;
color:var(--ink);font-weight:650}
.toolearn > p{color:var(--dim);font-size:14.5px;margin:0 0 16px;max-width:66ch}
.tlgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(216px,1fr));gap:10px}
.tlgrid a{display:block;padding:13px 15px;border:1px solid var(--line);border-radius:12px;background:var(--panel);
color:inherit;text-decoration:none;transition:border-color .18s,transform .16s}
.tlgrid a:hover{border-color:color-mix(in srgb,var(--accent) 50%,var(--line));transform:translateY(-2px);
text-decoration:none}
.tlgrid b{display:block;color:var(--ink);font-size:14px;margin-bottom:4px;font-weight:600}
.tlgrid em{display:block;font-style:normal;color:var(--dimmer);font-family:var(--mono);font-size:11px;line-height:1.5}
.toolgroup{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.6px;
color:var(--dimmer);margin:28px 0 10px}
.toolgroup:first-of-type{margin-top:0}
.toolgrid{columns:2;column-gap:18px}
.toolgrid .tool{break-inside:avoid;margin:0 0 18px}
.tool.wide{column-span:all}
@media(max-width:720px){.toolgrid{columns:1}}
.viz{margin-top:10px;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:8px;overflow:hidden}
.viz svg{display:block;width:100%;height:auto}
.meter{position:relative;height:34px;background:var(--panel2);border:1px solid var(--line);border-radius:7px;margin-top:10px;overflow:hidden}
.meter .fill{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,var(--ok),var(--accent2));transition:width .25s;border-radius:6px 0 0 6px}
.meter .tick{position:absolute;top:0;bottom:0;width:1px;background:var(--dimmer);opacity:.6}
.meter .tick span{position:absolute;top:2px;left:3px;font-family:var(--mono);font-size:10px;color:var(--dimmer)}
.ledprev{margin-top:10px;border:1px solid var(--line);border-radius:8px;background-color:#000;
background-image:radial-gradient(circle,var(--accent) 22%,transparent 26%);max-width:100%}
.field textarea{padding:9px 11px;background:var(--panel2);color:var(--ink);border:1px solid var(--line);
border-radius:7px;font-family:var(--mono);font-size:14px;width:300px;min-height:74px;resize:vertical}
/* Animated explainers. Each one draws the SHOW, not an abstract graph: a
   bridle over a truss, a lamp at the end of a long cable run, three legs of
   a distro, a dose clock, a spectrum with your channels on it. The motion is
   there to make the cause visible - the tension arrows grow as the angle
   opens, the lamp dims as the run gets longer - and every one of them is
   switched off entirely by prefers-reduced-motion via the global rule. */
.scene{margin-top:12px;background:var(--panel2);border:1px solid var(--line);border-radius:9px;
padding:10px;overflow:hidden}
.scene svg{display:block;width:100%;height:auto;max-width:540px;margin:0 auto}
.field input[type=range]{accent-color:var(--accent);width:100%;min-width:140px}
.scene .lbl{font-family:var(--mono);font-size:10px;fill:var(--dimmer)}
.scene .val{font-family:var(--mono);font-size:12px;fill:var(--ink);font-weight:600}
.scene .warnfill{fill:var(--warn)}
.scene .okfill{fill:var(--ok)}
@keyframes ss-sway{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}
@keyframes ss-pulse{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes ss-flow{to{stroke-dashoffset:-24}}
@keyframes ss-sweep{0%{transform:translateX(0)}100%{transform:translateX(var(--sweep,300px))}}
@keyframes ss-flicker{0%,100%{opacity:var(--glowop,.8)}47%{opacity:var(--glowop,.8)}
50%{opacity:calc(var(--glowop,.8) * .45)}53%{opacity:var(--glowop,.8)}}
.sway{animation:ss-sway 3.4s ease-in-out infinite;transform-origin:center}
.pulse{animation:ss-pulse 1.9s ease-in-out infinite}
.flow{stroke-dasharray:5 7;animation:ss-flow 1.1s linear infinite}
.sweep{animation:ss-sweep 4.5s linear infinite}
.flick{animation:ss-flicker 2.6s ease-in-out infinite}
.bars{display:flex;gap:8px;align-items:flex-end;height:120px;margin-top:12px}
.bars .leg{flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%;
text-align:center;font-family:var(--mono);font-size:11px;color:var(--dimmer)}
.bars .leg i{display:block;border-radius:5px 5px 0 0;background:var(--accent);
transition:height .35s ease,background .35s ease;min-height:2px}
.bars .leg.hot i{background:var(--warn)}
.bars .leg.neutral i{background:var(--accent2)}
.bars .leg b{color:var(--ink);font-weight:600;display:block;margin-bottom:3px}
.imlist{margin-top:10px;font-family:var(--mono);font-size:12.5px;max-height:190px;overflow-y:auto}
.imlist div{padding:3px 0;border-bottom:1px solid var(--line);color:var(--dim)}
.imlist div.clash{color:var(--warn);font-weight:600}
.ttwrap{overflow-x:auto;margin-top:10px}
.tt td.on{color:var(--ok);font-weight:700}
.tt td.off{color:var(--dimmer)}
.tt th.outcol,.tt td.outcol{border-left:1px solid var(--line);padding-left:12px}
`

  const body = `
<div class="crumb"><a href="/">showstack</a> / tools</div>
<h2>Field tools</h2>
<p class="lede">The calculations every crew does at load-in, done by the same arithmetic our test suite checks against published standards. Everything runs on this page: no install, no account, and it works with no signal once loaded.</p>

<div class="offline" id="offline" hidden>
  <div class="offhead">
    <span class="offk">Offline</span>
    <span class="offstate" id="off-state">checking&hellip;</span>
  </div>
  <p class="offp" id="off-msg">These calculators already run on this page with no signal. Saving the rest means the explainers and the whole searchable index work in a basement too.</p>
  <div class="offbtns">
    <button type="button" id="off-learn">Save the ${LEARN_COUNT} explainers <span>&middot; ~3 MB</span></button>
    <button type="button" id="off-index">Save the searchable index <span>&middot; ~1.2 MB</span></button>
  </div>
  <p class="offnote" id="off-note">Stored by your browser on this device. Nothing is sent anywhere, and you can clear it from your browser&rsquo;s site settings.</p>
</div>

<div class="tfind">
  <label for="tf">Find a tool</label>
  <input id="tf" type="search" autocomplete="off" spellcheck="false"
         placeholder="voltage, delay, bridle, dose, subnet&hellip;" aria-controls="toolwrap">
  <span class="tfn" id="tfn" role="status" aria-live="polite"></span>
</div>
<nav class="trail" id="trail" aria-label="Tool categories"></nav>
<div class="trecent" id="trecent" hidden>
  <span class="trk">Last used</span><span class="trl" id="trl"></span>
</div>
<p class="tnone" id="tnone" hidden>No tool here matches that. Everything on this page is listed in the rail above &mdash;
if the calculation you need is missing, it is one pull request.</p>

<div id="toolwrap">
<div class="toolgroup">Addressing &amp; show control</div>
<div class="toolgrid">
<div class="tool" id="dmx">
  <h3>DMX address</h3>
  <div class="row">
    <div class="field"><label for="dmx-u">Universe</label><input id="dmx-u" type="number" min="1" value="1" inputmode="numeric"></div>
    <div class="field"><label for="dmx-a">Address</label><input id="dmx-a" type="number" min="1" max="512" value="1" inputmode="numeric"></div>
    <div class="field"><label for="dmx-abs">Absolute channel</label><input id="dmx-abs" type="number" min="1" value="1" inputmode="numeric"></div>
  </div>
  <div class="out" id="dmx-out" role="status" aria-live="polite"></div>
  <p class="note">Absolute = (universe − 1) × 512 + address. sACN multicast per <a href="/protocols/sacn/">ANSI E1.31</a>; Art-Net port-address per <a href="/protocols/art-net/">Art-Net 4</a> (7-bit Net, 4-bit Sub-Net, 4-bit Universe — the sACN universe number and the Art-Net universe nibble are different things).</p>
</div>
<div class="tool" id="dmxload">
  <h3>DMX line budget</h3>
  <div class="row">
    <div class="field"><label for="dl-1">at 1 UL</label><input id="dl-1" type="number" min="0" value="8" inputmode="numeric" style="width:92px"></div>
    <div class="field"><label for="dl-2">at 1/2 UL</label><input id="dl-2" type="number" min="0" value="0" inputmode="numeric" style="width:92px"></div>
    <div class="field"><label for="dl-4">at 1/4 UL</label><input id="dl-4" type="number" min="0" value="40" inputmode="numeric" style="width:92px"></div>
    <div class="field"><label for="dl-8">at 1/8 UL</label><input id="dl-8" type="number" min="0" value="0" inputmode="numeric" style="width:92px"></div>
  </div>
  <div class="meter" id="dl-meter"></div>
  <div class="out" id="dl-out" role="status" aria-live="polite"></div>
  <p class="note">RS-485 caps a segment at <b>32 unit loads</b>, not 32 fixtures. A modern receiver is often 1/4 or 1/8 UL, so a line can carry far more than thirty-two boxes — and a rig of old 1 UL gear cannot. The figure is in the fixture manual; assume 1 UL if it is not stated. <a href="/learn/dmx/">Why this is the limit →</a></p>
</div>
<div class="tool" id="dip">
  <h3>DIP switch</h3>
  <div class="row">
    <div class="field"><label for="dip-a">Address</label><input id="dip-a" type="number" min="1" max="512" value="1" inputmode="numeric"></div>
  </div>
  <div class="dips-wrap"><div class="dipkey" aria-hidden="true"><b>ON</b><i>off</i></div><div class="dips" id="dip-bank" aria-label="DIP switch bank"></div></div>
  <div class="out" id="dip-out" role="status" aria-live="polite"></div>
  <label class="inline"><input type="checkbox" id="dip-minus"> This fixture uses the (address − 1) convention</label>
  <p class="note">Most fixtures read the switches as plain binary of the address: switch 1 is value 1, switch 9 is value 256, so address 1 = switch 1 ON. Some older gear encodes address − 1 (address 1 = all OFF) — check the fixture manual before trusting either. Click switches to go the other way.</p>
</div>
<div class="tool wide" id="dmxrate">
  <h3>DMX refresh &amp; what RDM costs</h3>
  <div class="row">
    <div class="field"><label for="dr-slots">Slots sent</label><input id="dr-slots" type="number" min="1" max="512" step="1" value="512" inputmode="numeric" style="width:120px"></div>
    <div class="field"><label for="dr-tx">RDM transactions/sec</label><input id="dr-tx" type="number" min="0" max="400" step="1" value="0" inputmode="numeric" style="width:170px"></div>
    <div class="field"><label for="dr-pdl">Response data bytes</label><input id="dr-pdl" type="number" min="0" max="231" step="1" value="8" inputmode="numeric" style="width:170px"></div>
  </div>
  <div class="out" id="dr-out" role="status" aria-live="polite"></div>
  <p class="note">DMX refresh is not a setting, it is arithmetic. 250&nbsp;kbit/s with eleven bits per slot is <b>44&nbsp;&micro;s a slot</b>, and a full 513-slot frame plus break and mark comes to 22.7&nbsp;ms &mdash; the familiar 44&nbsp;Hz ceiling. The only lever is sending fewer slots. RDM shares the same pair by taking turns on it, so every transaction is time the transmitter is not sending levels: an RDM packet is <b>25 bytes before it carries anything</b>, and a request plus a response plus two line turnarounds is a few milliseconds each. That is why heavy discovery or continuous sensor polling really does make a rig sluggish. <a href="/learn/dmx/">How RDM answers back on a one-way wire &rarr;</a></p>
</div>
<div class="tool" id="uid">
  <h3>RDM UID</h3>
  <div class="row">
    <div class="field"><label for="ru-in">UID</label><input id="ru-in" type="text" value="4C55:12345678" spellcheck="false" style="width:190px"></div>
  </div>
  <div class="out" id="ru-out" role="status" aria-live="polite"></div>
  <p class="note">Forty-eight bits: a 16-bit ESTA manufacturer ID and a 32-bit device ID. Devices are addressed by this rather than by DMX address, which is the point &mdash; a fixture can be found and interrogated before anybody knows what address it is on, or when two are sitting on the same one. <span class="mono">FFFF:FFFFFFFF</span> is broadcast to everything and <span class="mono">mmmm:FFFFFFFF</span> to one manufacturer&rsquo;s devices. Manufacturer IDs from <span class="mono">8000h</span> up are reserved for E1.33 dynamic UIDs and name nobody, so the <a href="https://tsp.esta.org/tsp/working_groups/CP/mfctrIDs.php" rel="noopener nofollow">ESTA registry</a> lookup does not apply to them.</p>
</div>
<div class="tool wide" id="tc">
  <h3>Timecode</h3>
  <div class="row">
    <div class="field"><label for="tc-h">HH</label><input id="tc-h" type="number" min="0" value="1" inputmode="numeric"></div>
    <div class="field"><label for="tc-m">MM</label><input id="tc-m" type="number" min="0" max="59" value="0" inputmode="numeric"></div>
    <div class="field"><label for="tc-s">SS</label><input id="tc-s" type="number" min="0" max="59" value="0" inputmode="numeric"></div>
    <div class="field"><label for="tc-f">FF</label><input id="tc-f" type="number" min="0" value="0" inputmode="numeric"></div>
    <div class="field"><label for="tc-rate">Rate</label><select id="tc-rate">
      <option value="24">24</option><option value="23.976">23.976</option><option value="25" selected>25</option>
      <option value="29.97df">29.97 DF</option><option value="29.97ndf">29.97 NDF</option><option value="30">30</option>
    </select></div>
    <div class="field"><label for="tc-frames">Total frames</label><input id="tc-frames" type="number" min="0" inputmode="numeric" style="width:140px"></div>
  </div>
  <div class="out" id="tc-out" role="status" aria-live="polite"></div>
  <p class="note">Drop-frame skips frame labels 00 and 01 at the start of every minute except each tenth minute — labels, not time. Entering a label that does not exist (say 00:01:00;00 in DF) is reported as such rather than silently rounded. See <a href="/protocols/ltc/">LTC</a> and <a href="/protocols/mtc/">MTC</a>.</p>
</div>
<div class="tool wide" id="midi">
  <h3>MIDI hex decoder</h3>
  <div class="row">
    <div class="field"><label for="md-in">Bytes (hex &mdash; spaces, commas or 0x all fine)</label>
      <textarea id="md-in" spellcheck="false">90 3C 7F 3E 7F 3C 00 B0 07 64 F1 04 F0 7F 7F 02 01 01 31 00 F7</textarea></div>
  </div>
  <div class="out" id="md-out" role="status" aria-live="polite"></div>
  <div class="ttwrap"><table class="tt" id="md-table"></table></div>
  <p class="note">One rule does all the framing: a <b>status byte has its top bit set</b> (80&ndash;FF), a data byte does not (00&ndash;7F). There is no header, no length field and no checksum, so a receiver joining mid-stream resynchronises on the next byte with the high bit set. For channel messages the high nibble is the command and the low nibble is the channel &mdash; zero-based on the wire, displayed one-based nearly everywhere, which is the off-by-one everybody meets once. <b>Running status</b> lets a repeated status byte be omitted, and it is why Note On at velocity 0 exists as a Note Off: a whole passage of notes shares one 9n byte. <a href="/learn/timecode/">How MTC and MSC sit on top of this &rarr;</a></p>
</div>
<div class="tool wide" id="relay">
  <h3>Relay logic matrix</h3>
  <div class="row">
    <div class="field"><label for="rl-rules">Rules (one per line: OUT = expr)</label><textarea id="rl-rules" spellcheck="false">MAIN = GO &amp; !ESTOP
HORN = GO &amp; (A | B)</textarea></div>
  </div>
  <div class="out" id="rl-out" role="status" aria-live="polite"></div>
  <div class="ttwrap" id="rl-table"></div>
  <p class="note">Write each output as a boolean rule: <b>&amp;</b> AND, <b>|</b> OR, <b>!</b> NOT, parentheses group. Every input combination is evaluated into the matrix, which is how you sanity-check an interlock chain before wiring it. Up to 5 inputs and 6 rules; outputs cannot feed back, because latching and timing belong in the controller, not a truth table. This is a thinking tool: a real e-stop chain is hard-wired to the <a href="/standards/">machinery standards</a>, never through software.</p>
</div>
</div>
<div class="toolgroup">Audio</div>
<div class="toolgrid">
<div class="tool" id="delay">
  <h3>Speaker delay</h3>
  <div class="row">
    <div class="field"><label for="del-d">Distance</label><input id="del-d" type="number" min="0" step="0.1" value="10" inputmode="decimal"></div>
    <div class="field"><label for="del-unit">Unit</label><select id="del-unit"><option value="m">metres</option><option value="ft">feet</option></select></div>
    <div class="field"><label for="del-t">Air temp °C</label><input id="del-t" type="number" value="20" inputmode="numeric"></div>
  </div>
  <div class="out" id="del-out" role="status" aria-live="polite"></div>
  <p class="note">Speed of sound = 331.3 + 0.606 × T m/s. Temperature is not pedantry: a 30 m throw shifts by several milliseconds between a cold morning line check and a hot afternoon show.</p>
</div>
<div class="tool" id="spl">
  <h3>SPL over distance</h3>
  <div class="row">
    <div class="field"><label for="sp-l">Level (dB)</label><input id="sp-l" type="number" value="100" inputmode="decimal" style="width:96px"></div>
    <div class="field"><label for="sp-r">at (m)</label><input id="sp-r" type="number" value="1" min="0.1" step="0.1" inputmode="decimal" style="width:86px"></div>
    <div class="field"><label for="sp-d">Listener at (m)</label><input id="sp-d" type="number" value="30" min="0.1" step="0.5" inputmode="decimal" style="width:120px"></div>
  </div>
  <div class="out" id="sp-out" role="status" aria-live="polite"></div>
  <p class="note">Inverse square law: −6 dB per doubling of distance, in a free field. Indoors reflections give some back, so this is the conservative figure for neighbour-noise and clearance work and the pessimistic one for coverage. <a href="/learn/sound/">Why 6 dB →</a></p>
</div>
<div class="tool" id="latency">
  <h3>Latency budget</h3>
  <div class="row">
    <div class="field"><label for="lt-list">Stage delays ms</label><input id="lt-list" type="text" value="0.9, 2.1, 1.5" style="width:200px" spellcheck="false"></div>
  </div>
  <div class="out" id="lt-out" role="status" aria-live="polite"></div>
  <div class="viz" id="lt-viz" aria-hidden="true"></div>
  <p class="note">List every hop in the chain: console, plugin, system processor, amp DSP. The total is what your time alignment has to absorb, shown as the distance sound covers in that time at 20 °C. Pair it with the speaker delay tool when you align delays to the main PA.</p>
</div>
<div class="tool" id="spkz">
  <h3>Speaker load</h3>
  <div class="row">
    <div class="field"><label for="sz-list">Wiring (+ series, comma parallel)</label><input id="sz-list" type="text" value="8+8, 8+8" style="width:210px" spellcheck="false"></div>
    <div class="field"><label for="sz-amp">Amp watts (opt)</label><input id="sz-amp" type="number" min="1" inputmode="numeric" style="width:120px"></div>
  </div>
  <div class="out" id="sz-out" role="status" aria-live="polite"></div>
  <div class="viz" id="sz-viz" aria-hidden="true"></div>
  <p class="note">Mixed wiring the way you would say it: <b>8+8, 8+8</b> is two series pairs in parallel (8 Ω total). "+" chains boxes in series, "," or "||" puts groups in parallel. With amp watts set it shows power per group and per box: in parallel the lower-impedance group takes more, inside a series chain the higher-impedance box takes more. Check the amplifier's minimum rated load before you land below 4 Ω; 70/100 V line systems play by transformer-tap rules instead.</p>
</div>
<div class="tool wide" id="audiounits">
  <h3>Audio levels &amp; impedance</h3>
  <div class="row">
    <div class="field"><label for="db-u">dBu</label><input id="db-u" type="number" step="0.1" value="4" inputmode="decimal"></div>
    <div class="field"><label for="db-v">dBV</label><input id="db-v" type="number" step="0.1" inputmode="decimal"></div>
  </div>
  <div class="out" id="db-out" role="status" aria-live="polite"></div>
  <p class="note">dBu and dBV are both line-level <em>voltage</em> references, fixed 2.21 dB apart at any level — 0 dBu = 0.775 V RMS (the "unloaded" successor to 600 Ω-referenced dBm), 0 dBV = 1 V RMS. Pro gear nominally runs +4 dBu; consumer/semi-pro gear −10 dBV — an 11.8 dB gap, the reason a "line level" cable between the two clips or hisses until you pad or gain-stage it.</p>
  <table style="margin-top:14px">
    <tr><th>Unit</th><th>Reference</th><th>Measures</th></tr>
    <tr><td><b>dB SPL</b></td><td>20 µPa (threshold of hearing)</td><td>Sound pressure in air — what a bare SPL meter reads before any weighting is applied.</td></tr>
    <tr><td><b>dB(A)</b></td><td>SPL, A-weighted</td><td>Rolls off bass steeply to approximate ear sensitivity at moderate levels. Standard for noise-exposure limits and most SPL-meter defaults — under-represents low end.</td></tr>
    <tr><td><b>dB(C)</b></td><td>SPL, C-weighted</td><td>Nearly flat 31.5 Hz–8 kHz, only rolling off at the extremes. Used for peak/impact readings and subwoofer or system alignment, where dB(A) hides too much low end — the gap between an A- and C-weighted reading of the same signal is a quick tell for how bass-heavy it is.</td></tr>
    <tr><td><b>dB(Z)</b></td><td>SPL, unweighted</td><td>Flat 10 Hz–20 kHz ±1.5 dB per IEC 61672-1 ("Z" = zero weighting). The true acoustic level, used where the low end matters: sub alignment, cinema and room calibration.</td></tr>
    <tr><td><b>dBu</b></td><td>0.775 V RMS</td><td>Line-level signal voltage, independent of load impedance — the professional-gear standard.</td></tr>
    <tr><td><b>dBV</b></td><td>1 V RMS</td><td>Line-level signal voltage on the simpler round-number reference — consumer and semi-pro gear.</td></tr>
  </table>
  <p class="note">SPL and dBu/dBV are not the same kind of measurement and do not convert into each other: one is acoustic pressure in air, the other is electrical voltage in a cable. A mixer's output meter reading "0 dBu" says nothing about how loud the room is.</p>
  <p class="note">Ohms (Ω) also names two different things on this page. <b>Resistance</b> — the Ohm's law tool below, a lamp or heater element — opposes current the same way at any frequency, all of it dissipated as heat. <b>Impedance</b> — the Speaker load tool above — is resistance's AC generalisation, Z = R + jX: a reactance X from the driver's voice coil and crossover that shifts with frequency. A loudspeaker's "8 Ω" is a nominal average, not a fixed value — the real number can swing from under 5 Ω to well over 40 Ω near cone resonance. That is why the speaker load arithmetic above is exact for a stated nominal figure, while Ohm's law's resistive-only assumption is indicative, not exact, once it is pointed at a driver instead of a lamp.</p>
  <p class="note">Light and sound both obey the <b>inverse square law</b> because both radiate from a small source across an expanding sphere: double the distance and the energy spreads over 4× the area, so the level at any point is quartered. For light that is illuminance — lux = candela ÷ throw², see <a href="#beam">Beam &amp; throw</a> below — a fixture twice as far away lights its target at a quarter the lux, all else equal. For sound in a free field (no walls or ground reflection filling it back in) the same physics shows up as a level drop rather than a ratio: −6 dB every doubling of distance, +6 dB every halving. How to use it: to sanity-check a claimed SPL at FOH against a spec measured at 1 m, count doublings of distance and subtract 6 dB each — a source rated 100 dB at 1 m is roughly 88 dB by 4 m (two doublings) outdoors. Indoors, reflections refill part of that drop, so 6 dB/doubling is the conservative, worst-case figure for clearance and neighbour-noise planning, not what a meter will actually read in a live room.</p>
</div>
<div class="tool wide" id="dose">
  <h3>Noise exposure dose</h3>
  <div class="row">
    <div class="field"><label for="ns-l">Level LAeq (dB)</label><input id="ns-l" type="number" min="60" max="140" value="100" inputmode="decimal"></div>
    <div class="field"><label for="ns-h">Exposure (hours)</label><input id="ns-h" type="number" min="0" step="0.25" value="2" inputmode="decimal"></div>
    <div class="field"><label for="ns-r">Rule</label><select id="ns-r">
      <option value="85|3|8" selected>EU — 85 dB(A), 3 dB</option>
      <option value="80|3|8">EU lower action — 80 dB(A), 3 dB</option>
      <option value="90|5|8">OSHA — 90 dB(A), 5 dB</option>
      <option value="85|5|8">85 dB(A), 5 dB</option>
    </select></div>
  </div>
  <div class="out" id="ns-out" role="status" aria-live="polite"></div>
  <div class="scene" id="ns-viz" aria-hidden="true"></div>
  <p class="note">The rule selector picks the criterion level, the exchange rate and the criterion duration together. Exchange rate is the whole argument: 3 dB halves the permitted time for every 3 dB louder, 5 dB is far more permissive, and which one applies is a matter of jurisdiction, not physics. This is <em>crew</em> exposure under <a href="/standards/eu-directive-2003-10-ec/">2003/10/EC</a> or <a href="/standards/osha-1910-95/">OSHA 1910.95</a>. Audience exposure is a separate question with its own document — in Germany, <a href="/standards/din-15905-5/">DIN 15905-5</a>.</p>
</div>
<div class="tool wide" id="modes">
  <h3>Room modes</h3>
  <div class="row">
    <div class="field"><label for="rm-l">Length (m)</label><input id="rm-l" type="number" min="1" step="0.1" value="12" inputmode="decimal"></div>
    <div class="field"><label for="rm-w">Width (m)</label><input id="rm-w" type="number" min="1" step="0.1" value="9" inputmode="decimal"></div>
    <div class="field"><label for="rm-h">Height (m)</label><input id="rm-h" type="number" min="1" step="0.1" value="4" inputmode="decimal"></div>
    <div class="field"><label for="rm-rt">RT60 (s)</label><input id="rm-rt" type="number" min="0" step="0.1" value="1.2" inputmode="decimal"></div>
  </div>
  <div class="out" id="rm-out" role="status" aria-live="polite"></div>
  <p class="note">Below the Schroeder frequency a room does not behave statistically &mdash; individual standing waves dominate and the response at a seat is set by the room&rsquo;s dimensions rather than by the system. Absorption on the walls does not fix that; the wavelengths are metres long. Axial modes (two parallel surfaces) are the loud ones. Rooms whose dimensions are simple multiples stack their modes instead of spreading them, which is why a cube sounds bad. <a href="/learn/sound/">Measuring and aligning sound</a> has the RT60 side.</p>
</div>
<div class="tool wide" id="array">
  <h3>Line array coverage</h3>
  <div class="row">
    <div class="field"><label for="la-len">Array length (m)</label><input id="la-len" type="number" min="0.5" step="0.5" value="4" inputmode="decimal"></div>
    <div class="field"><label for="la-f">Frequency (Hz)</label><input id="la-f" type="number" min="20" step="100" value="1000" inputmode="numeric"></div>
    <div class="field"><label for="la-front">Front row (m)</label><input id="la-front" type="number" min="1" step="1" value="5" inputmode="numeric"></div>
    <div class="field"><label for="la-back">Back row (m)</label><input id="la-back" type="number" min="2" step="1" value="35" inputmode="numeric"></div>
  </div>
  <div class="out" id="la-out" role="status" aria-live="polite"></div>
  <p class="note">A point source loses 6&nbsp;dB per doubling of distance because the energy spreads over a sphere. A line source long compared with the wavelength spreads cylindrically and loses 3&nbsp;dB &mdash; which is the whole reason an array reaches the back without removing the front row&rsquo;s hearing. It does not last: beyond a transition set by array length squared and frequency, the wavefront becomes spherical again. Designing as though the 3&nbsp;dB region reached the back wall is the classic mistake.</p>
</div>
</div>
<div class="toolgroup">Lighting &amp; video</div>
<div class="toolgrid">
<div class="tool" id="beam">
  <h3>Beam &amp; throw</h3>
  <div class="row">
    <div class="field"><label for="bm-t">Throw m</label><input id="bm-t" type="number" min="0" step="0.1" value="10" inputmode="decimal"></div>
    <div class="field"><label for="bm-a">Beam angle °</label><input id="bm-a" type="number" min="1" max="179" step="0.5" value="26" inputmode="decimal"></div>
    <div class="field"><label for="bm-cd">Candela (optional)</label><input id="bm-cd" type="number" min="0" value="" inputmode="numeric" style="width:130px"></div>
  </div>
  <div class="out" id="bm-out" role="status" aria-live="polite"></div>
  <div class="viz" id="bm-viz" aria-hidden="true"></div>
  <p class="note">Beam diameter = 2 × throw × tan(angle ÷ 2). Illuminance by the inverse square law: lux = candela ÷ throw². Enter the field angle instead to size the visible pool edge — fixture datasheets quote both.</p>
</div>
<div class="tool" id="led">
  <h3>LED wall</h3>
  <div class="row">
    <div class="field"><label for="lw-w">Width m</label><input id="lw-w" type="number" min="0.1" step="0.1" value="5" inputmode="decimal"></div>
    <div class="field"><label for="lw-h">Height m</label><input id="lw-h" type="number" min="0.1" step="0.1" value="3" inputmode="decimal"></div>
    <div class="field"><label for="lw-p">Pixel pitch mm</label><input id="lw-p" type="number" min="0.4" step="0.1" value="3.9" inputmode="decimal"></div>
  </div>
  <div class="out" id="lw-out" role="status" aria-live="polite"></div>
  <div class="ledprev" id="lw-prev" aria-hidden="true"></div>
  <p class="note">Resolution = size ÷ pitch. The minimum comfortable viewing distance shown is the common rule of thumb (1 m per 1 mm of pitch), not a spec — content, brightness and camera use all move it.</p>
</div>
<div class="tool" id="throw">
  <h3>Projector throw</h3>
  <div class="row">
    <div class="field"><label for="th-d">Distance m</label><input id="th-d" type="number" min="0.1" step="0.1" inputmode="decimal"></div>
    <div class="field"><label for="th-w">Image width m</label><input id="th-w" type="number" min="0.1" step="0.1" inputmode="decimal"></div>
    <div class="field"><label for="th-r">Throw ratio</label><input id="th-r" type="number" min="0.1" step="0.01" inputmode="decimal"></div>
  </div>
  <div class="out" id="th-out" role="status" aria-live="polite">Enter any two values.</div>
  <p class="note">Ratio = distance ÷ image width, the number on every lens datasheet. Fill any two, the third follows (the two you touched last are the knowns). A 1.8:1 lens filling a 4 m screen sits at 7.2 m. Zoom lenses quote a range: check both ends still land in the booth.</p>
</div>
<div class="tool" id="screen">
  <h3>Screen brightness</h3>
  <div class="row">
    <div class="field"><label for="sc-lm">Projector lumens</label><input id="sc-lm" type="number" min="1" value="10000" inputmode="numeric" style="width:130px"></div>
    <div class="field"><label for="sc-w">Width m</label><input id="sc-w" type="number" min="0.1" step="0.1" value="6" inputmode="decimal"></div>
    <div class="field"><label for="sc-h">Height m</label><input id="sc-h" type="number" min="0.1" step="0.1" value="3.4" inputmode="decimal"></div>
    <div class="field"><label for="sc-g">Screen gain</label><input id="sc-g" type="number" min="0.1" step="0.1" value="1.0" inputmode="decimal"></div>
  </div>
  <div class="out" id="sc-out" role="status" aria-live="polite"></div>
  <p class="note">Incident light is lux = lumens ÷ area. What the audience sees is luminance: fL = lumens × gain ÷ area in ft², and 1 fL = 3.4263 cd/m² (nits). <a href="https://www.dcimovies.com/specification/" rel="noopener nofollow">DCI cinema reference</a> is 48 cd/m² (14 fL) in the dark; ambient light on the screen is the number that actually kills contrast. Gain redirects light toward the axis rather than creating it, so high gain trades viewing angle.</p>
</div>
<div class="tool wide" id="aspect">
  <h3>Aspect fit</h3>
  <div class="row">
    <div class="field"><label for="as-cw">Content W</label><input id="as-cw" type="number" min="1" step="1" value="1920" inputmode="numeric"></div>
    <div class="field"><label for="as-ch">Content H</label><input id="as-ch" type="number" min="1" step="1" value="1080" inputmode="numeric"></div>
    <div class="field"><label for="as-sw">Surface W</label><input id="as-sw" type="number" min="1" step="1" value="2560" inputmode="numeric"></div>
    <div class="field"><label for="as-sh">Surface H</label><input id="as-sh" type="number" min="1" step="1" value="1080" inputmode="numeric"></div>
  </div>
  <div class="out" id="as-out" role="status" aria-live="polite"></div>
  <p class="note">Fit letterboxes and wastes surface; fill crops and loses content. The bar and crop figures are the numbers a designer needs, because that is the dead area to mask or design around. Scaling past 1:1 is flagged separately &mdash; that is the point where an LED wall starts to look soft, and no amount of processing puts the pixels back.</p>
</div>
<div class="tool wide" id="mix">
  <h3>Colour mixing &amp; shadows</h3>
  <div class="row">
    <div class="field"><label for="cm-mode">Mixing</label><select id="cm-mode">
      <option value="additive">additive &mdash; emitters, lamps, LED</option>
      <option value="subtractive">subtractive &mdash; gel, CMY flags, a costume</option>
    </select></div>
    <div class="field"><label for="cm-c1">Source 1</label><input id="cm-c1" type="color" value="#ff8c28"></div>
    <div class="field"><label for="cm-l1">at <span id="cm-l1v">100%</span></label><input id="cm-l1" type="range" min="0" max="100" value="100" style="width:110px"></div>
    <div class="field"><label for="cm-c2">Source 2</label><input id="cm-c2" type="color" value="#285aff"></div>
    <div class="field"><label for="cm-l2">at <span id="cm-l2v">100%</span></label><input id="cm-l2" type="range" min="0" max="100" value="100" style="width:110px"></div>
    <div class="field"><label for="cm-c3">Source 3</label><input id="cm-c3" type="color" value="#000000"></div>
    <div class="field"><label for="cm-l3">at <span id="cm-l3v">0%</span></label><input id="cm-l3" type="range" min="0" max="100" value="0" style="width:110px"></div>
  </div>
  <div class="swatches" id="cm-sw"></div>
  <div class="out" id="cm-out" role="status" aria-live="polite"></div>
  <p class="note">Two operations share the word mixing and they are opposites. <b>Additive</b> is emitters: each source contributes its own spectrum and they sum, so you start at black and add, and red plus green is yellow. <b>Subtractive</b> is gel, CMY flags and costume: each layer <em>removes</em> part of the spectrum, which is multiplication, so you start at white and take away, and a deep colour is always a dim one. All of it is computed in linear light, not in code values &mdash; two sources at 50% make 176, not 255. The shadow swatches are the answer to why shadows go coloured: a shadow is the light that still arrives, so blocking one of two sources leaves the other one&rsquo;s colour. <a href="/learn/mixing/">The whole mechanism &rarr;</a></p>
</div>
<div class="tool" id="whites">
  <h3>Mixing colour temperatures</h3>
  <div class="row">
    <div class="field"><label for="cw-a">Source A (K)</label><input id="cw-a" type="number" min="1000" max="20000" step="100" value="3200" inputmode="numeric" style="width:120px"></div>
    <div class="field"><label for="cw-al">at <span id="cw-alv">100%</span></label><input id="cw-al" type="range" min="0" max="100" value="100" style="width:110px"></div>
    <div class="field"><label for="cw-b">Source B (K)</label><input id="cw-b" type="number" min="1000" max="20000" step="100" value="6500" inputmode="numeric" style="width:120px"></div>
    <div class="field"><label for="cw-bl">at <span id="cw-blv">100%</span></label><input id="cw-bl" type="range" min="0" max="100" value="100" style="width:110px"></div>
  </div>
  <div class="out" id="cw-out" role="status" aria-live="polite"></div>
  <p class="note">Colour temperature averages in <b>mireds</b>, not in kelvin, because that is the scale on which equal steps look equal and the scale gel shift values are printed on. Half 3200&nbsp;K and half 6500&nbsp;K is about 4290&nbsp;K, not 4850. The warning matters more than the number: two sources on the Planckian locus mix to a point <em>off</em> it, toward green, because mixing walks the straight line between two points on a curve. That is why a tungsten wash and a daylight LED read green on camera when both are individually clean, and why the fix is minus-green rather than a colour temperature change. <a href="/tools/#mired">Gel correction</a> works the same mired arithmetic.</p>
</div>
<div class="tool wide" id="mired">
  <h3>Colour temperature correction</h3>
  <div class="row">
    <div class="field"><label for="mi-s">Source (K)</label><input id="mi-s" type="number" min="1000" max="20000" step="50" value="3200" inputmode="numeric"></div>
    <div class="field"><label for="mi-t">Target (K)</label><input id="mi-t" type="number" min="1000" max="20000" step="50" value="5600" inputmode="numeric"></div>
  </div>
  <div class="out" id="mi-out" role="status" aria-live="polite"></div>
  <p class="note">Kelvin is the wrong scale for this arithmetic: the step from 3200 K to 3400 K looks far bigger than the step from 9000 K to 9200 K, so no gel can have a fixed effect stated in kelvin. The mired &mdash; micro reciprocal degree, 10<sup>6</sup>/K &mdash; is the scale on which correction <em>is</em> fixed, which is why every swatch book prints a mired shift. Gel values are the published Lee shifts; Rosco equivalents differ slightly. <a href="/learn/colour/">How a colour becomes a number</a> covers why.</p>
</div>
<div class="tool" id="stops">
  <h3>Stops of light</h3>
  <div class="row">
    <div class="field"><label for="so-mode">Given</label><select id="so-mode">
      <option value="stops">stops</option>
      <option value="density">ND density</option>
      <option value="transmission">transmission (0&ndash;1)</option>
    </select></div>
    <div class="field"><label for="so-v">Value</label><input id="so-v" type="number" min="0" step="0.1" value="1" inputmode="decimal"></div>
    <div class="field"><label for="so-lux">Applied to (lux)</label><input id="so-lux" type="number" min="0" step="100" value="1000" inputmode="numeric"></div>
  </div>
  <div class="out" id="so-out" role="status" aria-live="polite"></div>
  <p class="note">A stop is a factor of two in light, which is the unit the trade counts in because it matches how the eye responds. The confusion is that ND is labelled two incompatible ways: photographic ND is an optical density where 0.3 is one stop, while plenty of stage filter is labelled by the fraction it passes. Stacking filters multiplies transmission, which is adding stops.</p>
</div>
</div>
<div class="toolgroup">Power &amp; electrical</div>
<div class="toolgrid">
<div class="tool" id="power">
  <h3>Power load</h3>
  <div class="row">
    <div class="field"><label for="pw-w">Total watts</label><input id="pw-w" type="number" min="0" value="10000" inputmode="numeric" style="width:130px"></div>
    <div class="field"><label for="pw-v">Volts</label><select id="pw-v">
      <option value="120">120</option><option value="208" selected>208</option><option value="230">230</option><option value="240">240</option><option value="400">400</option>
    </select></div>
    <div class="field"><label for="pw-ph">Phase</label><select id="pw-ph"><option value="1">single</option><option value="3" selected>three</option></select></div>
    <div class="field"><label for="pw-pf">Power factor</label><input id="pw-pf" type="number" min="0.1" max="1" step="0.05" value="1" inputmode="decimal"></div>
  </div>
  <div class="out" id="pw-out" role="status" aria-live="polite"></div>
  <div class="meter" id="pw-meter" aria-hidden="true"></div>
  <p class="note">Single phase: A = W ÷ (V × PF). Three phase: A = W ÷ (√3 × V × PF), volts line-to-line. Moving lights and LED fixtures with a poor power factor draw more current than the wattage alone suggests. Circuit fill rules (like the 80% continuous-load rule) are jurisdiction-specific — check the code that applies to your venue.</p>
</div>
<div class="tool" id="vdrop">
  <h3>Voltage drop</h3>
  <div class="row">
    <div class="field"><label for="vd-i">Current (A)</label><input id="vd-i" type="number" min="0" value="32" inputmode="decimal"></div>
    <div class="field"><label for="vd-l">Run, one way (m)</label><input id="vd-l" type="number" min="0" value="50" inputmode="decimal"></div>
    <div class="field"><label for="vd-a">Conductor (mm²)</label><input id="vd-a" type="number" min="0.5" step="0.5" value="6" inputmode="decimal"></div>
    <div class="field"><label for="vd-v">Supply (V)</label><input id="vd-v" type="number" min="1" value="230" inputmode="decimal"></div>
    <div class="field"><label for="vd-ph">Phase</label><select id="vd-ph"><option value="1" selected>1φ</option><option value="3">3φ</option></select></div>
    <div class="field"><label for="vd-m">Metal</label><select id="vd-m"><option value="copper" selected>Copper</option><option value="aluminium">Aluminium</option></select></div>
  </div>
  <div class="out" id="vd-out" role="status" aria-live="polite"></div>
  <div class="scene" id="vd-viz" aria-hidden="true"></div>
  <p class="note">Single phase drops over the out-and-back pair (k = 2); a balanced three-phase line-to-line drop uses √3. Resistivity is taken at 20 °C, so a warm cable on a busy dimmer run is worse than this says. The 3 % and 5 % marks are the usual lighting and power conventions from installation practice — your local wiring rules, <a href="/standards/bs-7671/">BS 7671</a> or <a href="/standards/nfpa-70/">NFPA 70</a>, are what actually apply.</p>
</div>
<div class="tool wide" id="derate">
  <h3>Cable derating &amp; gauge</h3>
  <div class="row">
    <div class="field"><label for="cd-a">Rated amps</label><input id="cd-a" type="number" min="1" step="1" value="100" inputmode="numeric" style="width:110px"></div>
    <div class="field"><label for="cd-n">Loaded conductors</label><input id="cd-n" type="number" min="1" max="60" step="1" value="6" inputmode="numeric" style="width:140px"></div>
    <div class="field"><label for="cd-t">Ambient (&deg;C)</label><input id="cd-t" type="number" min="-10" max="90" step="1" value="45" inputmode="numeric" style="width:110px"></div>
    <div class="field"><label for="cd-i">Insulation</label><select id="cd-i">
      <option value="90" selected>90 &deg;C</option>
      <option value="75">75 &deg;C</option>
      <option value="60">60 &deg;C</option>
    </select></div>
    <div class="field"><label for="cd-g">Gauge</label><input id="cd-g" type="number" min="-3" max="40" step="1" value="2" inputmode="numeric" style="width:90px"></div>
  </div>
  <div class="out" id="cd-out" role="status" aria-live="polite"></div>
  <p class="note">A cable&rsquo;s rating is measured in still 30&nbsp;&deg;C air with three current-carrying conductors, and a touring rig gives it none of those things. Two published factors correct for it: bundling from NEC Table 310.15(C)(1), and ambient temperature from Table 310.15(B)(1) &mdash; computed here from the formula that table was generated from, <span class="mono">&radic;((Tc&minus;Ta)/(Tc&minus;30))</span>, so it lands on the published values and keeps working between the rows. The base rating has to come off your cable&rsquo;s own datasheet; a tool that guessed would be worse than no tool. Then check the run with <a href="#vdrop">voltage drop</a> &mdash; on a long run that, not heat, is usually what sizes the cable.</p>
</div>
<div class="tool" id="phase">
  <h3>Three-phase balance</h3>
  <div class="row">
    <div class="field"><label for="ph-1">L1 (A)</label><input id="ph-1" type="number" min="0" value="80" inputmode="decimal" style="width:90px"></div>
    <div class="field"><label for="ph-2">L2 (A)</label><input id="ph-2" type="number" min="0" value="40" inputmode="decimal" style="width:90px"></div>
    <div class="field"><label for="ph-3">L3 (A)</label><input id="ph-3" type="number" min="0" value="30" inputmode="decimal" style="width:90px"></div>
  </div>
  <div class="out" id="ph-out" role="status" aria-live="polite"></div>
  <div class="bars" id="ph-bars" aria-hidden="true"></div>
  <p class="note">Balanced legs cancel in the neutral; one leg alone puts its whole current there. The distro is sized by its <em>worst</em> leg, never by the total divided by three. This is the linear-load figure: LED drivers and switch-mode supplies inject triplen harmonics that add rather than cancel in the neutral, so a rig full of them can exceed this with the legs looking even.</p>
</div>
<div class="tool wide" id="thd">
  <h3>Harmonics &amp; the neutral</h3>
  <div class="row">
    <div class="field"><label for="hd-a">Fundamental per phase (A)</label><input id="hd-a" type="number" min="0" step="1" value="30" inputmode="numeric" style="width:180px"></div>
    <div class="field"><label for="hd-3">3rd <span id="hd-3v">70%</span></label><input id="hd-3" type="range" min="0" max="100" value="70" style="width:120px"></div>
    <div class="field"><label for="hd-5">5th <span id="hd-5v">40%</span></label><input id="hd-5" type="range" min="0" max="100" value="40" style="width:110px"></div>
    <div class="field"><label for="hd-7">7th <span id="hd-7v">25%</span></label><input id="hd-7" type="range" min="0" max="100" value="25" style="width:110px"></div>
    <div class="field"><label for="hd-9">9th <span id="hd-9v">15%</span></label><input id="hd-9" type="range" min="0" max="100" value="15" style="width:110px"></div>
  </div>
  <div class="out" id="hd-out" role="status" aria-live="polite"></div>
  <p class="note">A perfect load draws a sine. Nothing on a rig does &mdash; switch-mode supplies draw in spikes near the voltage peak, and a spiky current is a sine plus harmonics at multiples of the mains frequency. On three phases the fundamentals cancel in the neutral, but the <b>triplens</b> (3rd, 9th, 15th) arrive in phase on all three legs and <b>add</b> there instead. So a perfectly balanced rig can put more current down the neutral than any phase is carrying, and the neutral is the one conductor with no breaker in it. THD-F and THD-R are both in use and are different numbers, which is why a meter and a datasheet can disagree while both are right. <a href="/learn/power/">Why three phases cancel, and what stops them &rarr;</a></p>
</div>
<div class="tool" id="ohm">
  <h3>Ohm's law</h3>
  <div class="row">
    <div class="field"><label for="oh-v">Volts</label><input id="oh-v" type="number" min="0" step="0.1" inputmode="decimal"></div>
    <div class="field"><label for="oh-i">Amps</label><input id="oh-i" type="number" min="0" step="0.1" inputmode="decimal"></div>
    <div class="field"><label for="oh-r">Ohms</label><input id="oh-r" type="number" min="0.01" step="0.1" inputmode="decimal"></div>
    <div class="field"><label for="oh-p">Watts</label><input id="oh-p" type="number" min="0" step="1" inputmode="decimal"></div>
  </div>
  <div class="out" id="oh-out" role="status" aria-live="polite">Enter any two values.</div>
  <p class="note">Fill in any two and the other two follow (V = I × R, P = V × I). The last two fields you edited are treated as the knowns. Resistive-load arithmetic: fine for lamps and heaters, indicative for anything reactive.</p>
</div>
<div class="tool" id="heat">
  <h3>Heat load</h3>
  <div class="row">
    <div class="field"><label for="he-w">Equipment (W)</label><input id="he-w" type="number" min="0" step="100" value="20000" inputmode="numeric"></div>
    <div class="field"><label for="he-p">People</label><input id="he-p" type="number" min="0" step="10" value="0" inputmode="numeric"></div>
    <div class="field"><label for="he-d">Allowed rise (&deg;C)</label><input id="he-d" type="number" min="1" max="30" step="1" value="10" inputmode="numeric"></div>
  </div>
  <div class="out" id="he-out" role="status" aria-live="polite"></div>
  <p class="note">Near enough every watt a rig draws ends up as heat in the room &mdash; the light and sound that leave are a rounding error against the input. 1&nbsp;W = 3.412&nbsp;BTU/hr; 1 ton of refrigeration = 12&nbsp;000&nbsp;BTU/hr. A seated person adds roughly 100&nbsp;W sensible, more when dancing, which is why a full house feels different from the tech. Airflow assumes air at 1.2&nbsp;kg/m&sup3; and 1005&nbsp;J/kg&middot;K.</p>
</div>
<div class="tool" id="battery">
  <h3>Battery runtime</h3>
  <div class="row">
    <div class="field"><label for="ba-c">Capacity (Wh)</label><input id="ba-c" type="number" min="1" step="1" value="98" inputmode="decimal"></div>
    <div class="field"><label for="ba-d">Draw (W)</label><input id="ba-d" type="number" min="0.1" step="0.5" value="12" inputmode="decimal"></div>
    <div class="field"><label for="ba-u">Usable (%)</label><input id="ba-u" type="number" min="10" max="100" step="5" value="80" inputmode="numeric"></div>
    <div class="field"><label for="ba-n">Need (hours)</label><input id="ba-n" type="number" min="0.5" step="0.5" value="6" inputmode="decimal"></div>
  </div>
  <div class="out" id="ba-out" role="status" aria-live="polite"></div>
  <p class="note">Packs are labelled in mAh more often than Wh: multiply mAh by the nominal voltage and divide by 1000. The derating matters more than the arithmetic &mdash; you lose some capacity to the device's cutoff voltage, some to cold, and a lithium pack that has done three hundred shows is not the pack on the label. 80% is a working default, not a measurement of your stock.</p>
</div>
</div>
<div class="toolgroup">Rigging, load &amp; weather</div>
<div class="toolgrid">
<div class="tool wide" id="bridle">
  <h3>Bridle angle — why it is never half each</h3>
  <div class="row">
    <div class="field"><label for="br-w">Load (kg)</label><input id="br-w" type="number" min="0" value="500" inputmode="decimal"></div>
    <div class="field"><label for="br-a">Leg angle from vertical (°)</label><input id="br-a" type="range" min="0" max="80" value="30" style="width:200px"></div>
    <div class="field"><label for="br-an">or type °</label><input id="br-an" type="number" min="0" max="80" value="30" inputmode="decimal" style="width:90px"></div>
  </div>
  <div class="out" id="br-out" role="status" aria-live="polite"></div>
  <div class="scene" id="br-viz" aria-hidden="true"></div>
  <p class="note"><b>This is a geometry explainer, not a design tool.</b> It shows one symmetric two-leg bridle with the load hanging at the apex, and nothing else: no sling angle derating, no shock load, no self-weight, no assessment of whether the structure can take the sideways pull it shows you. Real bridles are designed by a qualified rigger against <a href="/standards/din-56950-1/">DIN 56950-1</a>, <a href="/standards/en-17206/">EN 17206</a> or the local equivalent. What it is good for is the thing people get wrong from memory: tension per leg is W / (2 cos θ), so at 60° from vertical each leg is carrying the <em>whole</em> load, not half of it.</p>
</div>
<div class="tool wide" id="wind">
  <h3>Wind load on a surface</h3>
  <div class="row">
    <div class="field"><label for="wl-v">Wind (m/s)</label><input id="wl-v" type="number" min="0" step="0.5" value="12" inputmode="decimal" style="width:100px"></div>
    <div class="field"><label for="wl-a">Area (m&sup2;)</label><input id="wl-a" type="number" min="0.1" step="0.5" value="18" inputmode="decimal" style="width:100px"></div>
    <div class="field"><label for="wl-cf">Shape</label><select id="wl-cf">
      <option value="1.3">flat panel, square on (1.3)</option>
      <option value="1.8">signboard, EN 1991-1-4 (1.8)</option>
      <option value="0.7">mesh scrim, 50% open (0.7)</option>
      <option value="2">sharp-edged worst case (2.0)</option>
    </select></div>
    <div class="field"><label for="wl-m">Mass (kg)</label><input id="wl-m" type="number" min="0" step="10" value="300" inputmode="numeric" style="width:100px"></div>
    <div class="field"><label for="wl-h">Centre height (m)</label><input id="wl-h" type="number" min="0" step="0.5" value="3" inputmode="decimal" style="width:110px"></div>
    <div class="field"><label for="wl-b">Base width (m)</label><input id="wl-b" type="number" min="0" step="0.5" value="2" inputmode="decimal" style="width:110px"></div>
  </div>
  <div class="out" id="wl-out" role="status" aria-live="polite"></div>
  <p class="note"><b>A screening number, not a design.</b> Force goes with the square of wind speed, so doubling the wind quadruples the load &mdash; that is the whole reason a wind action plan carries speeds rather than opinions. What this does not model: terrain and height factors, the difference between a 10-minute mean and a 3-second gust at your actual site, dynamic response, or anything about how the structure is built. Temporary demountable structures are designed to <a href="/standards/">EN 13782 or ANSI E1.21</a> by somebody competent to do it. Use this to decide whether to have the conversation.</p>
</div>
<div class="tool" id="dew">
  <h3>Dew point &amp; condensation</h3>
  <div class="row">
    <div class="field"><label for="dp-t">Air temp (&deg;C)</label><input id="dp-t" type="number" min="-40" max="60" step="0.5" value="26" inputmode="decimal" style="width:110px"></div>
    <div class="field"><label for="dp-rh">Humidity (%)</label><input id="dp-rh" type="number" min="1" max="100" step="1" value="75" inputmode="numeric" style="width:110px"></div>
    <div class="field"><label for="dp-s">Surface (&deg;C)</label><input id="dp-s" type="number" min="-40" max="60" step="0.5" value="12" inputmode="decimal" style="width:110px"></div>
  </div>
  <div class="out" id="dp-out" role="status" aria-live="polite"></div>
  <p class="note">Two situations, one calculation. A case comes off a cold truck into a humid venue and water forms inside the amplifier before anyone plugs it in. Or an LED wall sits out overnight, the air reaches its dew point around dawn, and the panels are wet at 6am. The fix in both directions is the same: do not power it until the surface is above the dew point, and give it a margin, because exactly at the dew point is already wet.</p>
</div>
</div>
<div class="toolgroup">Access</div>
<div class="toolgrid">
<div class="tool wide" id="peppers">
  <h3>Pepper&rsquo;s ghost contrast</h3>
  <div class="row">
    <div class="field"><label for="pg-obj">Hidden object (cd/m&sup2;)</label><input id="pg-obj" type="number" min="1" step="50" value="1000" inputmode="numeric" style="width:150px"></div>
    <div class="field"><label for="pg-bg">Behind the ghost (cd/m&sup2;)</label><input id="pg-bg" type="number" min="0" step="5" value="50" inputmode="numeric" style="width:170px"></div>
    <div class="field"><label for="pg-r">Pane</label><select id="pg-r">
      <option value="0.08">plain glass (~8% reflective)</option>
      <option value="0.2">coated glass (~20%)</option>
      <option value="0.45">stage foil (~45%)</option>
      <option value="0.5">half-silvered (50/50)</option>
    </select></div>
    <div class="field"><label for="pg-t">Target ratio</label><input id="pg-t" type="number" min="1" step="0.5" value="4" inputmode="decimal" style="width:110px"></div>
  </div>
  <div class="out" id="pg-out" role="status" aria-live="polite"></div>
  <p class="note">Everybody gets the geometry right and the contrast wrong. The image sits as far behind the pane as the object is in front &mdash; that part is easy. What decides whether it reads as a solid figure or a smear on a window is two luminances arriving at the same retina: the object times the pane&rsquo;s <b>reflectance</b>, against the set behind it times the pane&rsquo;s <b>transmittance</b>. There are only two moves, and brightening the object is the expensive one. Darkening what sits behind the ghost is almost always cheaper, and it is the one people reach for last. <a href="/learn/illusion/">The rest of the craft &rarr;</a></p>
</div>
<div class="tool wide" id="forced">
  <h3>Forced perspective</h3>
  <div class="row">
    <div class="field"><label for="fp-s">Reference size (m)</label><input id="fp-s" type="number" min="0.01" step="0.1" value="1.8" inputmode="decimal" style="width:140px"></div>
    <div class="field"><label for="fp-d1">at distance (m)</label><input id="fp-d1" type="number" min="0.1" step="0.5" value="4" inputmode="decimal" style="width:140px"></div>
    <div class="field"><label for="fp-d2">Match it from (m)</label><input id="fp-d2" type="number" min="0.1" step="1" value="20" inputmode="decimal" style="width:150px"></div>
  </div>
  <div class="out" id="fp-out" role="status" aria-live="polite"></div>
  <p class="note">Two things look the same size when they subtend the same angle, and angle is size over distance &mdash; so an object twice as far away has to be twice as big. That is the whole trick, and the arithmetic is the easy half. The useful half is where it stops: angular size is one depth cue among several, and inside about ten metres <b>binocular disparity simply overrules it</b>. A forced-perspective set that is perfect in a photograph collapses for the front row, because a camera has one eye and an audience has two. Motion parallax does the same job for anybody who moves their head. The technique is really a statement about who is allowed to look, and from where.</p>
</div>
<div class="tool wide" id="flash">
  <h3>Flash rate &amp; photosensitivity</h3>
  <div class="row">
    <div class="field"><label for="fl-bpm">Track BPM</label><input id="fl-bpm" type="number" min="20" max="300" step="1" value="128" inputmode="numeric" style="width:100px"></div>
    <div class="field"><label for="fl-div">Strobe on</label><select id="fl-div">
      <option value="4">every 1/16 note</option>
      <option value="2">every 1/8 note</option>
      <option value="1" selected>every beat</option>
      <option value="0.5">every 2 beats</option>
      <option value="0.25">every bar (4/4)</option>
    </select></div>
    <div class="field"><label for="fl-hz">or Hz (0 = use tempo)</label><input id="fl-hz" type="number" min="0" max="60" step="0.1" value="0" inputmode="decimal" style="width:110px"></div>
    <div class="field"><label for="fl-red">Colour</label><select id="fl-red">
      <option value="0">any colour but saturated red</option>
      <option value="1">saturated red</option>
    </select></div>
    <div class="field"><label for="fl-st">Stripes in pattern</label><input id="fl-st" type="number" min="0" max="40" step="1" value="0" inputmode="numeric" style="width:130px"></div>
  </div>
  <div class="out" id="fl-out" role="status" aria-live="polite"></div>
  <p class="note">Three flashes in any one second is the line, and it is the same number in <a href="https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html" rel="noopener nofollow">WCAG 2.3.1</a>, in ITU-R BT.1702 and in the Ofcom guidance. Sensitivity peaks between 15 and 20&nbsp;Hz, which is exactly where a strobe lands when somebody sets it by ear. Saturated deep red is judged more strictly than any other colour, and static patterns count too: more than five clearly discernible light-dark stripe pairs is its own hazard. This is a screening check &mdash; broadcast material is assessed with a Harding test, and a venue still needs signage at the door.</p>
</div>
<div class="tool" id="ada">
  <h3>Assistive listening receivers</h3>
  <div class="row">
    <div class="field"><label for="al-s">Seats</label><input id="al-s" type="number" min="1" step="10" value="850" inputmode="numeric" style="width:110px"></div>
    <div class="field"><label for="al-loop">System</label><select id="al-loop">
      <option value="0">IR or RF receivers</option>
      <option value="1">induction loop, all seats</option>
    </select></div>
  </div>
  <div class="out" id="al-out" role="status" aria-live="polite"></div>
  <p class="note">Table 219.3 of the <a href="/standards/ada-standards-2010/">2010 ADA Standards</a>, which is a stepped formula people reliably get wrong from memory. The second number is the one that gets forgotten: a share of receivers must be hearing-aid compatible, meaning a neckloop that couples to a telecoil, not headphones. An induction loop covering every seat waives that column under Exception 2, because the hearing aids in the room already are the receivers. Under Exception 1, assembly areas under one management can be counted together.</p>
</div>
</div>
<div class="toolgroup">Content &amp; timing</div>
<div class="toolgrid">
<div class="tool" id="frame">
  <h3>Frame budget</h3>
  <div class="row">
    <div class="field"><label for="fb-fps">Frame rate</label><input id="fb-fps" type="number" min="1" max="240" step="1" value="60" inputmode="numeric" style="width:100px"></div>
    <div class="field"><label for="fb-a">Geometry ms</label><input id="fb-a" type="number" min="0" step="0.1" value="4" inputmode="decimal" style="width:100px"></div>
    <div class="field"><label for="fb-b">Lighting ms</label><input id="fb-b" type="number" min="0" step="0.1" value="5" inputmode="decimal" style="width:100px"></div>
    <div class="field"><label for="fb-c">Effects ms</label><input id="fb-c" type="number" min="0" step="0.1" value="3" inputmode="decimal" style="width:100px"></div>
    <div class="field"><label for="fb-d">Post + output ms</label><input id="fb-d" type="number" min="0" step="0.1" value="2" inputmode="decimal" style="width:118px"></div>
  </div>
  <div class="out" id="fb-out" role="status" aria-live="polite"></div>
  <div class="scene" id="fb-viz" aria-hidden="true"></div>
  <p class="note">Every stage of a real-time pipeline spends part of the same frame period, and a pipeline that overruns does not run slightly slower — it drops frames. The achievable rate shown is what the measured work can actually hold. <a href="/learn/engines/">Why real-time is a timing problem →</a></p>
</div>
<div class="tool" id="pyro">
  <h3>Pyro fire time</h3>
  <div class="row">
    <div class="field"><label for="py-e">Effect seen at (s)</label><input id="py-e" type="number" min="0" step="0.1" value="60" inputmode="decimal" style="width:120px"></div>
    <div class="field"><label for="py-l">Lift time (s)</label><input id="py-l" type="number" min="0" step="0.1" value="4.2" inputmode="decimal" style="width:110px"></div>
    <div class="field"><label for="py-p">Prefire (s)</label><input id="py-p" type="number" min="0" step="0.1" value="0.8" inputmode="decimal" style="width:110px"></div>
  </div>
  <div class="out" id="py-out" role="status" aria-live="polite"></div>
  <p class="note">A designer programs the moment an effect is <em>seen</em>; the firing system fires earlier by the item&rsquo;s lift and prefire. Two effects bursting on the same beat can be seconds apart on the script. This is design arithmetic only — the item data comes from the manufacturer, and nothing here arms anything. <a href="/learn/aerial/">How pyro is synchronised →</a></p>
</div>
<div class="tool" id="storage">
  <h3>Video storage</h3>
  <div class="row">
    <div class="field"><label for="st-b">Bitrate (Mbps)</label><input id="st-b" type="number" min="0.1" step="1" value="100" inputmode="decimal"></div>
    <div class="field"><label for="st-m">Minutes</label><input id="st-m" type="number" min="0" step="5" value="60" inputmode="numeric"></div>
    <div class="field"><label for="st-n">Streams</label><input id="st-n" type="number" min="1" max="64" step="1" value="1" inputmode="numeric"></div>
    <div class="field"><label for="st-c">Card / array (GB)</label><input id="st-c" type="number" min="1" step="64" value="1000" inputmode="numeric"></div>
  </div>
  <div class="out" id="st-out" role="status" aria-live="polite"></div>
  <p class="note">The units are the trap. Cards and drives are sold in decimal gigabytes and reported by the operating system in binary gibibytes, so a &ldquo;1&nbsp;TB&rdquo; card holds about 931&nbsp;GiB &mdash; the difference is a whole afternoon of recording. The sustained write figure is the spec that actually decides whether media drops frames, not the capacity.</p>
</div>
</div>
<div class="toolgroup">Networking</div>
<div class="toolgrid">
<div class="tool wide" id="subnet">
  <h3>Subnet calculator</h3>
  <div class="row">
    <div class="field"><label for="sb-ip">Address</label><input id="sb-ip" type="text" value="192.168.1.50" spellcheck="false" style="width:170px"></div>
    <div class="field"><label for="sb-p">Prefix /<span id="sb-plab">24</span></label><input id="sb-p" type="range" min="0" max="32" value="24" style="width:190px"></div>
    <div class="field"><label for="sb-pn">or type it</label><input id="sb-pn" type="number" min="0" max="32" value="24" inputmode="numeric" style="width:92px"></div>
  </div>
  <div class="out" id="sb-out" role="status" aria-live="polite"></div>
  <div class="ttwrap"><table class="tt" id="sb-table"></table></div>
  <p class="note">The mask says how many of the 32 bits are the network; everything else follows from that. A /31 is a point-to-point link with both addresses usable (RFC 3021) and a /32 is a single host, which is why neither reserves a broadcast address. <a href="/learn/network/">How to calculate it by hand →</a></p>
</div>
<div class="tool wide" id="fibre">
  <h3>Fibre loss budget</h3>
  <div class="row">
    <div class="field"><label for="fi-l">Length (m)</label><input id="fi-l" type="number" min="0" step="10" value="500" inputmode="numeric"></div>
    <div class="field"><label for="fi-t">Fibre &amp; wavelength</label><select id="fi-t"></select></div>
    <div class="field"><label for="fi-c">Connector pairs</label><input id="fi-c" type="number" min="0" max="40" step="1" value="2" inputmode="numeric"></div>
    <div class="field"><label for="fi-s">Splices</label><input id="fi-s" type="number" min="0" max="40" step="1" value="0" inputmode="numeric"></div>
    <div class="field"><label for="fi-b">Link budget (dB)</label><input id="fi-b" type="number" min="1" max="40" step="0.5" value="8" inputmode="decimal"></div>
  </div>
  <div class="out" id="fi-out" role="status" aria-live="polite"></div>
  <p class="note">Attenuation figures are typical values per TIA-568 and FOA guidance: OM3/OM4 about 3.0&nbsp;dB/km at 850&nbsp;nm and 1.0 at 1300; OS2 about 0.4 at 1310 and 0.3 at 1550. Connector pairs are counted at 0.3&nbsp;dB (TIA allows up to 0.75) and fusion splices at 0.1. The link budget belongs to the optics, not the glass &mdash; take it from the transceiver datasheet rather than this default. A run that passes with under 3&nbsp;dB spare works on the day and fails after one re-terminated connector.</p>
</div>
<div class="tool wide" id="sdi">
  <h3>SDI reach on coax</h3>
  <div class="row">
    <div class="field"><label for="sd-att">Cable loss (dB/100 m)</label><input id="sd-att" type="number" min="0.1" step="0.1" value="21.6" inputmode="decimal" style="width:150px"></div>
    <div class="field"><label for="sd-f">quoted at (MHz)</label><input id="sd-f" type="number" min="1" step="10" value="1000" inputmode="numeric" style="width:130px"></div>
    <div class="field"><label for="sd-eq">Receiver EQ (dB)</label><input id="sd-eq" type="number" min="1" max="60" step="1" value="20" inputmode="numeric" style="width:130px"></div>
    <div class="field"><label for="sd-len">Your run (m)</label><input id="sd-len" type="number" min="1" step="5" value="80" inputmode="numeric" style="width:120px"></div>
  </div>
  <div class="out" id="sd-out" role="status" aria-live="polite"></div>
  <div class="ttwrap"><table class="tt" id="sd-table"></table></div>
  <p class="note">SDI does not degrade &mdash; it works perfectly and then stops, which is why a run that was fine in the shop fails in the venue ten metres longer. Two facts set the cliff: coax loss rises with the square root of frequency, and the frequency that matters is half the bit rate. Take both cable numbers off the manufacturer&rsquo;s datasheet, at whatever frequency they quoted; every coax maker publishes them. The 20&nbsp;dB equalisation figure is what SMPTE writes down, and real receivers often do better, which is why the same cable gets quoted at different lengths by different people. A run inside 3&nbsp;dB of the budget is flagged: it works today and fails after somebody swaps a barrel in.</p>
</div>
</div>
<div class="toolgroup">Protocol builders</div>
<div class="toolgrid">
<div class="tool wide" id="osc">
  <h3>OSC message</h3>
  <div class="row">
    <div class="field"><label for="os-addr">Address pattern</label><input id="os-addr" type="text" value="/eos/cue/1/fire" spellcheck="false" style="width:230px"></div>
    <div class="field"><label for="os-args">Arguments (comma separated)</label><input id="os-args" type="text" value="" spellcheck="false" placeholder="1, 0.5, go" style="width:200px"></div>
  </div>
  <div class="out" id="os-out" role="status" aria-live="polite"></div>
  <div class="bytes" id="os-hex"></div>
  <p class="note">Four rules and everything follows. Strings are null-terminated then padded with more nulls to a multiple of four. Numbers are big-endian, four bytes. The type tag string starts with a comma and names each argument in order. And the whole message is <b>always</b> a multiple of four bytes &mdash; which is why an OSC dump is full of trailing zeros that mean nothing. Integers are sent as <span class="mono">i</span>, anything with a decimal point as <span class="mono">f</span>, everything else as <span class="mono">s</span>. Note that <span class="mono">T</span>, <span class="mono">F</span>, <span class="mono">N</span> and <span class="mono">I</span> carry a tag and no bytes at all.</p>
</div>
<div class="tool wide" id="pjlink">
  <h3>PJLink projector command</h3>
  <div class="row">
    <div class="field"><label for="pj-cmd">Command</label><select id="pj-cmd"></select></div>
    <div class="field"><label for="pj-param">Parameter</label><input id="pj-param" type="text" value="?" spellcheck="false" style="width:110px"></div>
    <div class="field"><label for="pj-chal">Challenge from projector</label><input id="pj-chal" type="text" placeholder="498e4a67" spellcheck="false" style="width:150px"></div>
    <div class="field"><label for="pj-pass">Password</label><input id="pj-pass" type="text" spellcheck="false" autocomplete="off" style="width:150px"></div>
  </div>
  <div class="out" id="pj-out" role="status" aria-live="polite"></div>
  <p class="note">TCP port 4352, one line per command: per cent, class, four upper-case letters, space, parameter, carriage return. On connect the projector greets you with <span class="mono">PJLINK 0</span> (no security) or <span class="mono">PJLINK 1 &lt;8 hex digits&gt;</span> &mdash; paste those digits and your password above and the MD5 digest is prepended to the <em>first</em> command only, with no separator. Nothing typed here leaves your device; the password is used to compute a hash locally and is never sent anywhere or stored.</p>
</div>
<div class="tool wide" id="artnet">
  <h3>Art-Net packet</h3>
  <div class="row">
    <div class="field"><label for="an-kind">Packet</label><select id="an-kind">
      <option value="dmx">ArtDmx &mdash; level data</option>
      <option value="poll">ArtPoll &mdash; find every node</option>
    </select></div>
    <div class="field"><label for="an-net">Net</label><input id="an-net" type="number" min="0" max="127" value="0" inputmode="numeric" style="width:90px"></div>
    <div class="field"><label for="an-sub">Subnet</label><input id="an-sub" type="number" min="0" max="15" value="0" inputmode="numeric" style="width:90px"></div>
    <div class="field"><label for="an-uni">Universe</label><input id="an-uni" type="number" min="0" max="15" value="0" inputmode="numeric" style="width:100px"></div>
    <div class="field"><label for="an-slots">First slots</label><input id="an-slots" type="text" value="255, 128, 0" spellcheck="false" style="width:150px"></div>
  </div>
  <div class="out" id="an-out" role="status" aria-live="polite"></div>
  <div class="bytes" id="an-hex"></div>
  <p class="note">Eighteen header bytes and then the slots. Two things trip people: the opcode is sent <b>low byte first</b> while the data length in the same header is sent <b>high byte first</b>, which is a real inconsistency in the protocol rather than a mistake in your reading. And the sequence number is not a counter of slots &mdash; it is 1 to 255 with 0 meaning sequencing is off, used by a receiver to drop packets that overtook each other. ArtPoll is the broadcast that makes every node reply with ArtPollReply, which is how a controller builds its node list.</p>
</div>
<div class="tool wide" id="sacn">
  <h3>sACN packet</h3>
  <div class="row">
    <div class="field"><label for="sa-uni">Universe</label><input id="sa-uni" type="number" min="1" max="63999" value="1" inputmode="numeric" style="width:110px"></div>
    <div class="field"><label for="sa-pri">Priority</label><input id="sa-pri" type="number" min="0" max="200" value="100" inputmode="numeric" style="width:100px"></div>
    <div class="field"><label for="sa-name">Source name</label><input id="sa-name" type="text" value="showstack" spellcheck="false" style="width:160px"></div>
    <div class="field"><label for="sa-slots">Slots</label><input id="sa-slots" type="number" min="0" max="512" value="512" inputmode="numeric" style="width:100px"></div>
  </div>
  <div class="out" id="sa-out" role="status" aria-live="polite"></div>
  <div class="bytes" id="sa-hex"></div>
  <p class="note">Three nested PDUs &mdash; root, framing, DMP &mdash; each opening with a combined flags-and-length field where the top nibble is <span class="mono">0x7</span> and the remaining twelve bits are that PDU&rsquo;s own length. Getting one of the three wrong produces a packet some receivers accept and others silently drop, which is a miserable fault to chase. A full universe is 638 bytes: root 622, framing 600, DMP 523. The <b>CID identifies the source, not the universe</b>, and must not change between packets &mdash; a device generating a fresh one each time looks like unlimited new sources and breaks priority arbitration.</p>
</div>
<div class="tool wide" id="rdmpkt">
  <h3>RDM packet</h3>
  <div class="row">
    <div class="field"><label for="rp-dest">Destination UID</label><input id="rp-dest" type="text" value="FFFF:FFFFFFFF" spellcheck="false" style="width:170px"></div>
    <div class="field"><label for="rp-src">Controller UID</label><input id="rp-src" type="text" value="0001:00000001" spellcheck="false" style="width:170px"></div>
    <div class="field"><label for="rp-cc">Command</label><select id="rp-cc"></select></div>
    <div class="field"><label for="rp-pid">Parameter</label><select id="rp-pid"></select></div>
  </div>
  <div class="out" id="rp-out" role="status" aria-live="polite"></div>
  <div class="bytes" id="rp-hex"></div>
  <p class="note">Twenty-four header bytes, then parameter data, then a two-byte additive checksum &mdash; a plain sum of every preceding byte, which catches exactly the single-bit errors a marginal RS-485 line produces. The message length field counts everything <b>up to but not including</b> the checksum, which is the off-by-two everybody hits once. Start code <span class="mono">0xCC</span> is what tells a fixture this is management traffic rather than levels. <a href="/learn/dmx/">How RDM answers back on a one-way wire &rarr;</a></p>
</div>
<div class="tool wide" id="mscb">
  <h3>MIDI Show Control &amp; Machine Control</h3>
  <div class="row">
    <div class="field"><label for="mb-kind">Message</label><select id="mb-kind">
      <option value="msc">MSC &mdash; cue control</option>
      <option value="mmc">MMC &mdash; transport</option>
    </select></div>
    <div class="field"><label for="mb-dev">Device ID</label><input id="mb-dev" type="number" min="0" max="127" value="127" inputmode="numeric" style="width:110px"></div>
    <div class="field" id="mb-mscf"><label for="mb-fmt">Command format</label><select id="mb-fmt">
      <option value="1">Lighting (General)</option>
      <option value="2">Moving Lights</option>
      <option value="127">All-types</option>
    </select></div>
    <div class="field" id="mb-msccmd"><label for="mb-cmd">Command</label><select id="mb-cmd">
      <option value="1">GO</option><option value="2">STOP</option><option value="3">RESUME</option>
    </select></div>
    <div class="field" id="mb-cuef"><label for="mb-cue">Cue</label><input id="mb-cue" type="text" value="1" spellcheck="false" style="width:90px"></div>
    <div class="field" id="mb-listf"><label for="mb-list">List</label><input id="mb-list" type="text" value="" spellcheck="false" style="width:90px"></div>
    <div class="field" id="mb-mmcf" hidden><label for="mb-mmc">Transport</label><select id="mb-mmc"></select></div>
  </div>
  <div class="out" id="mb-out" role="status" aria-live="polite"></div>
  <div class="bytes" id="mb-hex"></div>
  <div class="midisend" id="mb-send" hidden>
    <select id="mb-port" aria-label="MIDI output"></select>
    <button type="button" id="mb-go">Send it</button>
    <span id="mb-status"></span>
  </div>
  <p class="note">The one thing on this page that can actually leave the machine. Browsers implement Web MIDI, so with a MIDI interface attached these bytes can be transmitted for real &mdash; your browser will ask permission first, including for system exclusive, which both of these are. Everything stays local: no network, nothing recorded. MSC cue data is <b>ASCII digits</b>, so cue 12 is <span class="mono">31 32</span> and not <span class="mono">0C</span>, which is why a cue number can contain a decimal point. A receiver acts only if <em>both</em> its device ID and its command format match, and a format mismatch is the commonest reason MSC appears to do nothing at all.</p>
</div>
</div>

<div class="toolgroup">RF</div>
<div class="toolgrid">
<div class="tool wide" id="im">
  <h3>Third-order intermod check</h3>
  <div class="row">
    <div class="field"><label for="im-f">Frequencies in use (MHz, comma or space separated)</label>
      <textarea id="im-f" spellcheck="false">470.100, 471.300, 472.500, 474.700</textarea></div>
    <div class="field"><label for="im-g">Guard (MHz)</label><input id="im-g" type="number" min="0" step="0.05" value="0.3" inputmode="decimal" style="width:90px"></div>
  </div>
  <div class="out" id="im-out" role="status" aria-live="polite"></div>
  <div class="scene" id="im-viz" aria-hidden="true"></div>
  <div class="imlist" id="im-list"></div>
  <p class="note">Two transmitters make products at 2a−b and 2b−a; three make a+b−c. Third order is the set that matters because the products land near the originals and are strong enough to open a receiver. A product in empty spectrum is harmless — the ones flagged in red are landing on a channel you are actually using. This is a check, not a coordination tool: it ignores transmitter power, antenna placement, receiver selectivity, fifth-order products and every broadcaster already on air, which is what the <a href="/rf/">frequency map</a> and a real coordination pass are for.</p>
</div>
<div class="tool" id="rf">
  <h3>RF wavelength</h3>
  <div class="row">
    <div class="field"><label for="rf-f">Frequency MHz</label><input id="rf-f" type="number" min="1" step="0.025" value="600" inputmode="decimal" style="width:130px"></div>
  </div>
  <div class="out" id="rf-out" role="status" aria-live="polite"></div>
  <p class="note">λ = c ÷ f. Antenna lengths include the standard ~5% end-effect shortening (the 468/f rule). Handy for wireless mic and IEM antenna placement: keep transmit and receive antennas at least a wavelength apart where you can.</p>
</div>
</div>
</div>

<div class="toolearn">
  <h3>Where these numbers come from</h3>
  <p>Every calculator here is the arithmetic from an explainer, embedded verbatim from the test file so the page cannot drift from the tests. If a number surprises you, the mechanism is one click away.</p>
  <div class="tlgrid">
    <a href="/learn/dmx/"><b>DMX on the wire</b><em>unit loads, termination, reflections</em></a>
    <a href="/learn/network/"><b>Show networks</b><em>subnetting, QoS, multicast</em></a>
    <a href="/learn/sound/"><b>Measuring and aligning sound</b><em>delay, inverse square law, arrays</em></a>
    <a href="/learn/light/"><b>Beams and blends</b><em>beam angle, throw, illuminance</em></a>
    <a href="/learn/wireless/"><b>Sharing the airwaves</b><em>intermod, duplex, WMAS</em></a>
    <a href="/learn/bits/"><b>Numbers that stand for signals</b><em>bit depth, sample rate, DSP</em></a>
    <a href="/learn/engines/"><b>Node graphs and game engines</b><em>the frame budget</em></a>
    <a href="/learn/aerial/"><b>Drone shows and pyro</b><em>lift time, prefire, timecode</em></a>
    <a href="/learn/"><b>All ${LEARN_COUNT} explainers &rarr;</b><em>arranged as one chain</em></a>
  </div>
</div>

</div>

<div class="cta"><strong>A calculation your crew does daily that is missing here?</strong>
<p><a href="${GH}/issues/new?labels=tooling&amp;title=tools%3A+">Name it</a> — if the arithmetic can be written down and tested, it belongs on this page. The one piece of rigging maths here is labelled as a geometry explainer for a reason: point loads and real bridle design belong with a qualified rigger and the <a href="/standards/">governing standards</a>, not a web form.</p></div>
`

  const script = `
${TOOLKIT_JS}
${MATH_TABLES}
${MATH_SRC}

const $ = (s) => document.querySelector(s);

// ---- DMX address ----
// Two-way binding: editing universe/address updates absolute, editing
// absolute updates universe/address. The lastEdited flag prevents loops.
function dmxRender(fromAbs) {
  if (fromAbs) {
    const t = dmxFromAbsolute($("#dmx-abs").value);
    if (t) { $("#dmx-u").value = t.universe; $("#dmx-a").value = t.address; }
  } else {
    const abs = dmxAbsolute($("#dmx-u").value, $("#dmx-a").value);
    if (abs) $("#dmx-abs").value = abs;
  }
  const u = Number($("#dmx-u").value), a = Number($("#dmx-a").value);
  const abs = dmxAbsolute(u, a);
  if (abs === null) { $("#dmx-out").innerHTML = '<span class="err">Address must be 1–512, universe 1 or more.</span>'; return; }
  const mc = sacnMulticast(u);
  const an = artnetSplit(u - 1); // common one-to-one mapping: sACN u1 ~ port-address 0
  $("#dmx-out").innerHTML =
    'Absolute channel <b>' + abs + '</b>' +
    (mc ? ' · sACN universe ' + u + ' multicasts on <b>' + mc + '</b>' : '') +
    (an ? ' · as an Art-Net port-address ' + (u - 1) + ': Net <b>' + an.net + '</b> / Sub-Net <b>' + an.subnet + '</b> / Universe <b>' + an.universe + '</b>' : '');
}
for (const id of ["dmx-u", "dmx-a"]) $("#" + id).addEventListener("input", () => dmxRender(false));
$("#dmx-abs").addEventListener("input", () => dmxRender(true));

// ---- DIP switches ----
let dipState = { minus: false };
function dipRenderFromAddress() {
  const a = Number($("#dip-a").value);
  const sw = dipSwitches(a, dipState.minus);
  const bank = $("#dip-bank");
  if (!sw) {
    $("#dip-out").innerHTML = '<span class="err">' +
      (a === 512 && !dipState.minus
        ? 'Address 512 in plain binary needs a 10th switch — most 9-switch fixtures top out at 511, or use the (address − 1) convention.'
        : 'Address must be 1–512.') + '</span>';
    bank.innerHTML = "";
    return;
  }
  bank.innerHTML = sw.map((on, i) =>
    '<button type="button" class="dip" role="switch" aria-pressed="' + on + '" data-i="' + i + '" aria-label="switch ' + (i + 1) + '">' +
    '<span class="n">' + (i + 1) + '</span></button>').join("");
  const on = sw.map((v, i) => v ? (i + 1) : null).filter(Boolean);
  $("#dip-out").innerHTML = on.length
    ? 'Switches ON: <b>' + on.join(", ") + '</b> (values ' + on.map(n => 1 << (n - 1)).join(" + ") + ')'
    : 'All switches OFF';
}
$("#dip-a").addEventListener("input", dipRenderFromAddress);
$("#dip-minus").addEventListener("change", (e) => { dipState.minus = e.target.checked; dipRenderFromAddress(); });
$("#dip-bank").addEventListener("click", (e) => {
  const b = e.target.closest(".dip");
  if (!b) return;
  const current = [...$("#dip-bank").querySelectorAll(".dip")].map(x => x.getAttribute("aria-pressed") === "true");
  current[Number(b.dataset.i)] = !current[Number(b.dataset.i)];
  const a = dipToAddress(current, dipState.minus);
  if (a) { $("#dip-a").value = a; dipRenderFromAddress(); }
});

// ---- Speaker delay ----
function delayRender() {
  let d = Number($("#del-d").value);
  if ($("#del-unit").value === "ft") d = d * 0.3048;
  const r = speakerDelay(d, $("#del-t").value);
  if (!r) { $("#del-out").innerHTML = '<span class="err">Distance and temperature must be numbers.</span>'; return; }
  $("#del-out").innerHTML =
    '<b>' + r.ms.toFixed(2) + ' ms</b> at ' + r.speedOfSound + ' m/s' +
    ' · ' + r.samples48k + ' samples @48k · ' + r.samples96k + ' samples @96k';
}
for (const id of ["del-d", "del-unit", "del-t"]) $("#" + id).addEventListener("input", delayRender);

// ---- Timecode ----
function tcRenderFromFields() {
  const rate = $("#tc-rate").value;
  const n = tcToFrames($("#tc-h").value, $("#tc-m").value, $("#tc-s").value, $("#tc-f").value, rate);
  if (n === null) {
    $("#tc-out").innerHTML = '<span class="err">' +
      (rate === "29.97df" ? 'Not a valid drop-frame label — frames ;00 and ;01 do not exist at the start of a non-tenth minute.' : 'Fields out of range for this rate.') +
      '</span>';
    return;
  }
  $("#tc-frames").value = n;
  $("#tc-out").innerHTML = 'Frame <b>' + n + '</b> from zero at ' + $("#tc-rate").selectedOptions[0].text + ' fps';
}
function tcRenderFromFrames() {
  const t = framesToTc($("#tc-frames").value, $("#tc-rate").value);
  if (!t) { $("#tc-out").innerHTML = '<span class="err">Total frames must be a non-negative integer.</span>'; return; }
  $("#tc-h").value = t.h; $("#tc-m").value = t.m; $("#tc-s").value = t.s; $("#tc-f").value = t.f;
  const pad = (x) => String(x).padStart(2, "0");
  const sep = $("#tc-rate").value === "29.97df" ? ";" : ":";
  $("#tc-out").innerHTML = 'Timecode <b>' + pad(t.h) + ':' + pad(t.m) + ':' + pad(t.s) + sep + pad(t.f) + '</b>';
}
for (const id of ["tc-h", "tc-m", "tc-s", "tc-f"]) $("#" + id).addEventListener("input", tcRenderFromFields);
$("#tc-rate").addEventListener("input", tcRenderFromFields);
$("#tc-frames").addEventListener("input", tcRenderFromFrames);

// ---- Power load ----
function powerRender() {
  const r = powerLoad($("#pw-w").value, $("#pw-v").value, Number($("#pw-ph").value), $("#pw-pf").value);
  if (!r) { $("#pw-out").innerHTML = '<span class="err">Watts, volts and power factor must be sensible numbers.</span>'; return; }
  $("#pw-out").innerHTML = '<b>' + r.amps + ' A</b> at ' + $("#pw-v").value + ' V ' +
    ($("#pw-ph").value === "3" ? 'three-phase (per line)' : 'single phase');
}
for (const id of ["pw-w", "pw-v", "pw-ph", "pw-pf"]) $("#" + id).addEventListener("input", powerRender);

// ---- Beam & throw ----
function beamRender() {
  const b = beamDiameter($("#bm-t").value, $("#bm-a").value);
  if (!b) { $("#bm-out").innerHTML = '<span class="err">Throw must be 0 or more, angle between 1 and 179.</span>'; return; }
  let html = 'Beam diameter <b>' + b.diameter + ' m</b> at ' + $("#bm-t").value + ' m';
  const cd = $("#bm-cd").value;
  if (cd !== "") {
    const e = illuminance(cd, $("#bm-t").value);
    if (e) html += ' · <b>' + e.lux + ' lx</b> (' + e.footcandles + ' fc) centre beam';
  }
  $("#bm-out").innerHTML = html;
}
for (const id of ["bm-t", "bm-a", "bm-cd"]) $("#" + id).addEventListener("input", beamRender);

// ---- LED wall ----
function ledRender() {
  const r = ledWall($("#lw-w").value, $("#lw-h").value, $("#lw-p").value);
  if (!r) { $("#lw-out").innerHTML = '<span class="err">Width, height and pitch must be positive.</span>'; return; }
  $("#lw-out").innerHTML = '<b>' + r.pxW + ' × ' + r.pxH + ' px</b> · ' +
    (r.totalPx / 1000000).toFixed(2) + ' Mpx · comfortable from ≈<b>' + r.minViewMeters + ' m</b>';
}
for (const id of ["lw-w", "lw-h", "lw-p"]) $("#" + id).addEventListener("input", ledRender);

// ---- RF wavelength ----
function rfRender() {
  const r = rfWavelength($("#rf-f").value);
  if (!r) { $("#rf-out").innerHTML = '<span class="err">Frequency must be a positive number of MHz.</span>'; return; }
  $("#rf-out").innerHTML = 'λ <b>' + r.wavelength + ' m</b> · half-wave <b>' + r.halfWave +
    ' m</b> · quarter-wave <b>' + r.quarterWave + ' m</b> (' + r.quarterWaveInches + ' in)';
}
$("#rf-f").addEventListener("input", rfRender);

// ---- Live visuals ----
// Small, honest pictures of the numbers: the cone you would see, the load on
// the feed, the pixel density you specified. Each redraws with its inputs.
function drawBeam() {
  const t = Number($("#bm-t").value), a = Number($("#bm-a").value);
  const b = beamDiameter(t, a);
  const el = $("#bm-viz");
  if (!b || t <= 0) { el.innerHTML = ""; return; }
  const W = 320, H = 120, fx = 16, fy = H / 2;
  const half = Math.min((b.diameter / (2 * t)) * (W - 60), H / 2 - 8);
  el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img">' +
    '<polygon points="' + fx + ',' + fy + ' ' + (W - 30) + ',' + (fy - half) + ' ' + (W - 30) + ',' + (fy + half) + '"' +
    ' fill="var(--accent2)" opacity="0.25"/>' +
    '<line x1="' + fx + '" y1="' + fy + '" x2="' + (W - 30) + '" y2="' + (fy - half) + '" stroke="var(--accent2)" stroke-width="1.5"/>' +
    '<line x1="' + fx + '" y1="' + fy + '" x2="' + (W - 30) + '" y2="' + (fy + half) + '" stroke="var(--accent2)" stroke-width="1.5"/>' +
    '<rect x="6" y="' + (fy - 8) + '" width="14" height="16" rx="3" fill="var(--dim)"/>' +
    '<line x1="' + (W - 30) + '" y1="' + (fy - half) + '" x2="' + (W - 30) + '" y2="' + (fy + half) + '" stroke="var(--accent)" stroke-width="2"/>' +
    '<text x="' + (W - 6) + '" y="' + (fy + 4) + '" text-anchor="end" fill="var(--dim)" font-size="11" font-family="monospace">' + b.diameter + 'm</text>' +
    '</svg>';
}
function drawPowerMeter() {
  const r = powerLoad($("#pw-w").value, $("#pw-v").value, Number($("#pw-ph").value), $("#pw-pf").value);
  const el = $("#pw-meter");
  if (!r) { el.innerHTML = ""; return; }
  const marks = [13, 16, 20, 32, 63, 125];
  const top = marks.find((m) => m >= r.amps) ?? Math.ceil(r.amps / 100) * 100;
  const scale = top * 1.25;
  let html = '<div class="fill" style="width:' + Math.min(100, r.amps / scale * 100) + '%"></div>';
  for (const m of marks) {
    if (m > scale) break;
    html += '<div class="tick" style="left:' + (m / scale * 100) + '%"><span>' + m + 'A</span></div>';
  }
  el.innerHTML = html;
}
function drawLedPreview() {
  const r = ledWall($("#lw-w").value, $("#lw-h").value, $("#lw-p").value);
  const el = $("#lw-prev");
  if (!r) { el.style.display = "none"; return; }
  const w = Number($("#lw-w").value), h = Number($("#lw-h").value), p = Number($("#lw-p").value);
  const boxW = 300, boxH = Math.max(40, Math.min(200, boxW * (h / w)));
  const dot = Math.max(3, Math.min(24, p * 2.5));
  el.style.display = "block";
  el.style.width = boxW + "px";
  el.style.height = boxH + "px";
  el.style.backgroundSize = dot + "px " + dot + "px";
}

// ---- Ohm's law ----
// The two most recently edited fields are the knowns; the others follow.
const ohKeys = ["v", "i", "r", "p"];
let ohEdited = [];
function ohmRender() {
  if (ohEdited.length < 2) { $("#oh-out").textContent = "Enter any two values."; return; }
  const args = {};
  for (const k of ohEdited) args[k] = $("#oh-" + k).value;
  const r = ohmsLaw(args);
  if (!r) { $("#oh-out").innerHTML = '<span class="err">Those two do not make a solvable pair — check the numbers.</span>'; return; }
  $("#oh-out").innerHTML =
    '<b>' + r.volts + ' V</b> · <b>' + r.amps + ' A</b> · <b>' + r.ohms + ' Ω</b> · <b>' + r.watts + ' W</b>';
}
for (const k of ohKeys) {
  $("#oh-" + k).addEventListener("input", () => {
    if ($("#oh-" + k).value === "") { ohEdited = ohEdited.filter((x) => x !== k); }
    else { ohEdited = ohEdited.filter((x) => x !== k); ohEdited.push(k); if (ohEdited.length > 2) ohEdited.shift(); }
    ohmRender();
  });
}

// ---- dBu / dBV ----
function dbuvRender(from) {
  if (from === "dbv") {
    const u = dbvToDbu($("#db-v").value);
    if (u !== null) { $("#db-u").value = u; $("#db-out").innerHTML = '<b>' + u + ' dBu</b> · <b>' + $("#db-v").value + ' dBV</b>'; }
    else { $("#db-out").innerHTML = '<span class="err">Enter a number.</span>'; }
  } else {
    const v = dbuToDbv($("#db-u").value);
    if (v !== null) { $("#db-v").value = v; $("#db-out").innerHTML = '<b>' + $("#db-u").value + ' dBu</b> · <b>' + v + ' dBV</b>'; }
    else { $("#db-out").innerHTML = '<span class="err">Enter a number.</span>'; }
  }
}
$("#db-u").addEventListener("input", () => dbuvRender("dbu"));
$("#db-v").addEventListener("input", () => dbuvRender("dbv"));

// ---- Speaker load (mixed series/parallel) ----
function spkRender() {
  const amp = $("#sz-amp").value;
  const r = speakerNetwork($("#sz-list").value, amp === "" ? null : amp);
  const el = $("#sz-viz");
  if (!r) { $("#sz-out").innerHTML = '<span class="err">Write it like: 8+8, 8+8 (series pairs in parallel) or 8, 8, 4</span>'; el.innerHTML = ""; return; }
  $("#sz-out").innerHTML = 'Total load <b>' + r.total + ' Ω</b> across ' + r.boxes +
    (r.boxes === 1 ? ' box' : ' boxes') + ' in ' + r.groups.length + (r.groups.length === 1 ? ' group' : ' groups') +
    (r.groups[0].watts !== undefined ? ' · per group: <b>' + r.groups.map(g => g.watts + ' W').join(" / ") + '</b>' : '') +
    (r.total < 4 ? ' <span class="err">below 4 Ω — check the amp rating</span>' : '');
  // Picture: each parallel group is a series chain hanging between the rails.
  const n = Math.min(r.groups.length, 5), W = 320, maxLen = Math.max.apply(null, r.groups.map(g => g.zs.length));
  const H = 34 + Math.min(maxLen, 4) * 30 + 14;
  const colW = (W - 40) / n;
  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img">' +
    '<line x1="10" y1="12" x2="' + (W - 10) + '" y2="12" stroke="var(--dim)" stroke-width="1.5"/>' +
    '<line x1="10" y1="' + (H - 10) + '" x2="' + (W - 10) + '" y2="' + (H - 10) + '" stroke="var(--dim)" stroke-width="1.5"/>';
  for (let k = 0; k < n; k++) {
    const cx = 20 + colW * k + colW / 2;
    const g = r.groups[k];
    const m = Math.min(g.zs.length, 4);
    const step = (H - 46) / m;
    svg += '<line x1="' + cx + '" y1="12" x2="' + cx + '" y2="' + (H - 10) + '" stroke="var(--dim)"/>';
    for (let j = 0; j < m; j++) {
      const y = 22 + j * step;
      const label = g.zs[j] + 'Ω' + (g.perBox && m === g.zs.length ? ' ' + g.perBox[j] + 'W' : '');
      svg += '<rect x="' + (cx - 27) + '" y="' + y + '" width="54" height="' + Math.min(24, step - 4) + '" rx="4" fill="var(--panel)" stroke="var(--accent)"/>' +
        '<text x="' + cx + '" y="' + (y + Math.min(24, step - 4) / 2 + 4) + '" text-anchor="middle" fill="var(--ink)" font-size="10" font-family="monospace">' + label + '</text>';
    }
    if (g.zs.length > 4) svg += '<text x="' + cx + '" y="' + (H - 14) + '" text-anchor="middle" fill="var(--dimmer)" font-size="9" font-family="monospace">+' + (g.zs.length - 4) + '</text>';
  }
  if (r.groups.length > 5) svg += '<text x="' + (W - 12) + '" y="' + (H - 14) + '" text-anchor="end" fill="var(--dimmer)" font-size="10" font-family="monospace">+' + (r.groups.length - 5) + ' groups</text>';
  el.innerHTML = svg + '</svg>';
}
for (const id of ["sz-list", "sz-amp"]) $("#" + id).addEventListener("input", spkRender);

function parseList(s) {
  return String(s).split(/[\s,]+/).filter(Boolean).map(Number);
}

// ---- Latency budget ----
function latRender() {
  const stages = parseList($("#lt-list").value);
  const r = processingDelay(stages);
  const el = $("#lt-viz");
  if (!r) { $("#lt-out").innerHTML = '<span class="err">List stage delays like: 0.9, 2.1, 1.5</span>'; el.innerHTML = ""; return; }
  $("#lt-out").innerHTML = 'Total <b>' + r.totalMs + ' ms</b> · ' + r.samples48k + ' smp @48k · ' +
    r.samples96k + ' smp @96k · ≈<b>' + r.meters + ' m</b> (' + r.feet + ' ft) of arrival offset';
  const W = 320, H = 46;
  let x = 10, s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img">';
  const usable = W - 20, total = r.totalMs || 1;
  const cols = ["var(--accent)", "var(--accent2)", "var(--ok)", "var(--warn)"];
  stages.forEach((st, k) => {
    const w = Math.max(2, st / total * usable);
    s += '<rect x="' + x + '" y="12" width="' + (w - 2) + '" height="16" rx="3" fill="' + cols[k % cols.length] + '" opacity="0.85"/>' +
         (w > 26 ? '<text x="' + (x + w / 2 - 1) + '" y="40" text-anchor="middle" fill="var(--dimmer)" font-size="10" font-family="monospace">' + st + '</text>' : '');
    x += w;
  });
  el.innerHTML = s + '</svg>';
}
$("#lt-list").addEventListener("input", latRender);

// The original render listeners were bound by reference, so the visuals get
// their own listeners on the same inputs rather than monkey-patching.
for (const id of ["bm-t", "bm-a", "bm-cd"]) $("#" + id).addEventListener("input", drawBeam);
for (const id of ["pw-w", "pw-v", "pw-ph", "pw-pf"]) $("#" + id).addEventListener("input", drawPowerMeter);
for (const id of ["lw-w", "lw-h", "lw-p"]) $("#" + id).addEventListener("input", drawLedPreview);

// ---- Projector throw ----
const thKeys = ["d", "w", "r"];
let thEdited = [];
function thRender() {
  if (thEdited.length < 2) { $("#th-out").textContent = "Enter any two values."; return; }
  const map = { d: "distance", w: "width", r: "ratio" };
  const args = {};
  for (const k of thEdited) args[map[k]] = $("#th-" + k).value;
  const r = throwRatio(args);
  if (!r) { $("#th-out").innerHTML = '<span class="err">Both knowns must be positive numbers.</span>'; return; }
  $("#th-out").innerHTML = 'Distance <b>' + r.distance + ' m</b> · width <b>' + r.width + ' m</b> · ratio <b>' + r.ratio + ':1</b>';
}
for (const k of thKeys) {
  $("#th-" + k).addEventListener("input", () => {
    if ($("#th-" + k).value === "") { thEdited = thEdited.filter((x) => x !== k); }
    else { thEdited = thEdited.filter((x) => x !== k); thEdited.push(k); if (thEdited.length > 2) thEdited.shift(); }
    thRender();
  });
}

// ---- Screen brightness ----
function scrRender() {
  const r = screenLuminance($("#sc-lm").value, $("#sc-w").value, $("#sc-h").value, $("#sc-g").value);
  if (!r) { $("#sc-out").innerHTML = '<span class="err">Lumens, size and gain must be positive.</span>'; return; }
  const vsDci = r.nits >= 48 ? 'meets' : 'below';
  $("#sc-out").innerHTML = '<b>' + r.lux + ' lx</b> on screen · <b>' + r.fl + ' fL</b> · <b>' + r.nits +
    ' cd/m²</b> (' + vsDci + ' the 48 cd/m² DCI dark-room reference) · ' + r.areaM2 + ' m²';
}
for (const id of ["sc-lm", "sc-w", "sc-h", "sc-g"]) $("#" + id).addEventListener("input", scrRender);

// ---- Relay logic matrix ----
function relayRender() {
  const r = relayLogic($("#rl-rules").value);
  const host = $("#rl-table");
  if (!r) {
    $("#rl-out").innerHTML = '<span class="err">Rules look like: MAIN = GO &amp; !ESTOP - up to 5 inputs, 6 rules, no output on the right-hand side.</span>';
    host.innerHTML = "";
    return;
  }
  $("#rl-out").innerHTML = r.inputs.length + ' inputs · ' + r.outputs.length + ' outputs · ' + r.rows.length + ' states';
  const mark = (v) => v ? '<td class="on">1</td>' : '<td class="off">0</td>';
  const markOut = (v, first) => v ? '<td class="on' + (first ? ' outcol' : '') + '">✓</td>' : '<td class="off' + (first ? ' outcol' : '') + '">·</td>';
  host.innerHTML = '<table class="tt"><tr>' +
    r.inputs.map((n) => '<th>' + n + '</th>').join('') +
    r.outputs.map((n, i) => '<th' + (i === 0 ? ' class="outcol"' : '') + '>' + n + '</th>').join('') + '</tr>' +
    r.rows.map((row) => '<tr>' + row.in.map(mark).join('') + row.out.map((v, i) => markOut(v, i === 0)).join('') + '</tr>').join('') +
    '</table>';
}
$("#rl-rules").addEventListener("input", relayRender);


// ---- Bridle geometry explainer ----
// The picture is the point: as the slider opens the legs, the arrows on them
// grow and the number climbs past "half each". The truss sways because a
// still drawing of a hanging load reads as a diagram, and a moving one reads
// as a thing above your head.
function brRender(fromSlider) {
  if (fromSlider) $("#br-an").value = $("#br-a").value;
  else $("#br-a").value = Math.min(80, Math.max(0, Number($("#br-an").value) || 0));
  const w = Number($("#br-w").value), a = Number($("#br-a").value);
  const r = bridleTension(w, a);
  const out = $("#br-out");
  if (!r) { out.innerHTML = '<span class="err">Load must be 0 or more, angle 0–80° from vertical.</span>'; $("#br-viz").innerHTML = ""; return; }
  const cls = r.multiplier >= 2 ? "err" : "";
  out.innerHTML = '<b>' + r.perLegKg + ' kg</b> in each leg — <span class="' + cls + '">' +
    r.multiplier + '× what "half each" would give you</span> · included angle ' + r.includedAngle + '° · ' +
    'each point also pulled <b>' + r.horizontalKg + ' kg</b> sideways';
  brDraw(r, a);
}
function brDraw(r, angleDeg) {
  const W = 460, H = 228;
  const beamY = 26, apexY = 140, cx = W / 2;
  const dx = (apexY - beamY) * Math.tan((angleDeg * Math.PI) / 180);
  const lx = Math.max(12, cx - dx), rx = Math.min(W - 12, cx + dx);
  // Arrow weight tracks the multiplier, so the picture gets heavier as the
  // number does. Capped so a 70 degree bridle does not draw a black bar.
  const wgt = Math.min(9, 1.6 + (r.multiplier - 1) * 3.4);
  const col = r.multiplier >= 2 ? "var(--warn)" : r.multiplier >= 1.4 ? "var(--accent2)" : "var(--accent)";
  const label = (x, y, t, c) => '<text x="' + x + '" y="' + y + '" class="val" fill="' + (c || "var(--ink)") + '" text-anchor="middle">' + t + '</text>';
  $("#br-viz").innerHTML =
    '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Bridle geometry">' +
    // structure
    '<rect x="0" y="' + (beamY - 12) + '" width="' + W + '" height="10" fill="var(--line)"/>' +
    '<circle cx="' + lx + '" cy="' + beamY + '" r="5" fill="var(--dim)"/>' +
    '<circle cx="' + rx + '" cy="' + beamY + '" r="5" fill="var(--dim)"/>' +
    // sideways pull on each point, drawn only when it is worth noticing
    (r.horizontalKg > 1 ?
      '<line x1="' + lx + '" y1="' + (beamY - 16) + '" x2="' + (lx + 26) + '" y2="' + (beamY - 16) + '" stroke="var(--warn)" stroke-width="2" class="pulse"/>' +
      '<line x1="' + rx + '" y1="' + (beamY - 16) + '" x2="' + (rx - 26) + '" y2="' + (beamY - 16) + '" stroke="var(--warn)" stroke-width="2" class="pulse"/>' : '') +
    '<g class="sway">' +
    // the two legs
    '<line x1="' + lx + '" y1="' + beamY + '" x2="' + cx + '" y2="' + apexY + '" stroke="' + col + '" stroke-width="' + wgt + '" stroke-linecap="round"/>' +
    '<line x1="' + rx + '" y1="' + beamY + '" x2="' + cx + '" y2="' + apexY + '" stroke="' + col + '" stroke-width="' + wgt + '" stroke-linecap="round"/>' +
    // hoist and truss
    '<rect x="' + (cx - 13) + '" y="' + apexY + '" width="26" height="20" rx="4" fill="var(--dim)"/>' +
    '<line x1="' + cx + '" y1="' + (apexY + 20) + '" x2="' + cx + '" y2="' + (apexY + 32) + '" stroke="var(--dimmer)" stroke-width="3"/>' +
    '<rect x="' + (cx - 90) + '" y="' + (apexY + 32) + '" width="180" height="12" rx="3" fill="var(--dimmer)"/>' +
    '</g>' +
    // the angle itself
    '<line x1="' + cx + '" y1="' + apexY + '" x2="' + cx + '" y2="' + beamY + '" stroke="var(--dimmer)" stroke-width="1" stroke-dasharray="3 3"/>' +
    label((lx + cx) / 2 - 14, (beamY + apexY) / 2, r.perLegKg + ' kg', col) +
    label((rx + cx) / 2 + 14, (beamY + apexY) / 2, r.perLegKg + ' kg', col) +
    '<text x="' + cx + '" y="' + (H - 8) + '" class="lbl" text-anchor="middle">load ' + $("#br-w").value + ' kg · legs ' + angleDeg + '° from vertical · ×' + r.multiplier + ' per leg</text>' +
    '</svg>';
}
$("#br-w").addEventListener("input", () => brRender(false));
$("#br-a").addEventListener("input", () => brRender(true));
$("#br-an").addEventListener("input", () => brRender(false));

// ---- Voltage drop ----
// The lamp at the far end is the whole explanation: the run gets longer, the
// glow gets weaker. Luminous output falls much faster than voltage, so the
// glow is scaled by roughly the cube of the ratio - exaggerated on purpose,
// and the numbers above it are the honest ones.
function vdRender() {
  const r = voltageDrop($("#vd-i").value, $("#vd-l").value, $("#vd-a").value,
                        $("#vd-v").value, Number($("#vd-ph").value), $("#vd-m").value);
  if (!r) { $("#vd-out").innerHTML = '<span class="err">Check the inputs: conductor and supply must be above zero.</span>'; $("#vd-viz").innerHTML = ""; return; }
  const verdict = r.withinLighting ? '<span class="ok">inside the 3% lighting convention</span>'
    : r.withinPower ? '<span class="err">over 3%</span> — inside the 5% power convention'
    : '<span class="err">over 5%: size up the cable or shorten the run</span>';
  $("#vd-out").innerHTML = '<b>' + r.dropVolts + ' V</b> lost (' + r.dropPercent + '%) · <b>' +
    r.voltsAtLoad + ' V</b> at the load · ' + verdict;
  vdDraw(r);
}
function vdDraw(r) {
  const W = 460, H = 120, y = 58;
  const v = Number($("#vd-v").value);
  const ratio = Math.max(0, Math.min(1, r.voltsAtLoad / v));
  const glow = Math.max(0.06, Math.pow(ratio, 3));
  const bad = !r.withinPower;
  const cableCol = bad ? "var(--warn)" : r.withinLighting ? "var(--accent)" : "var(--accent2)";
  $("#vd-viz").innerHTML =
    '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Voltage drop along a cable run">' +
    '<rect x="8" y="' + (y - 22) + '" width="46" height="44" rx="5" fill="var(--panel)" stroke="var(--line)"/>' +
    '<text x="31" y="' + (y + 4) + '" class="lbl" text-anchor="middle">DISTRO</text>' +
    '<line x1="54" y1="' + y + '" x2="' + (W - 78) + '" y2="' + y + '" stroke="var(--line)" stroke-width="7" stroke-linecap="round"/>' +
    '<line x1="54" y1="' + y + '" x2="' + (W - 78) + '" y2="' + y + '" stroke="' + cableCol + '" stroke-width="3" class="flow"/>' +
    // the lamp
    '<circle cx="' + (W - 46) + '" cy="' + y + '" r="26" fill="var(--accent2)" opacity="' + (glow * 0.4).toFixed(3) + '"' +
      (bad ? ' class="flick" style="--glowop:' + (glow * 0.4).toFixed(3) + '"' : '') + '/>' +
    '<circle cx="' + (W - 46) + '" cy="' + y + '" r="13" fill="var(--accent2)" opacity="' + glow.toFixed(3) + '"' +
      (bad ? ' class="flick" style="--glowop:' + glow.toFixed(3) + '"' : '') + '/>' +
    '<circle cx="' + (W - 46) + '" cy="' + y + '" r="13" fill="none" stroke="var(--dim)" stroke-width="1.5"/>' +
    '<text x="' + (W - 46) + '" y="' + (y + 44) + '" class="val" text-anchor="middle" fill="' + cableCol + '">' + r.voltsAtLoad + ' V</text>' +
    '<text x="' + ((W - 78 + 54) / 2) + '" y="' + (y - 14) + '" class="lbl" text-anchor="middle">' +
      $("#vd-l").value + ' m · ' + $("#vd-a").value + ' mm² · ' + $("#vd-i").value + ' A</text>' +
    '<text x="' + ((W - 78 + 54) / 2) + '" y="' + (y + 26) + '" class="val" text-anchor="middle" fill="' + cableCol + '">−' + r.dropVolts + ' V (' + r.dropPercent + '%)</text>' +
    '</svg>';
}
for (const id of ["#vd-i", "#vd-l", "#vd-a", "#vd-v", "#vd-ph", "#vd-m"]) $(id).addEventListener("input", vdRender);

// ---- Three-phase balance ----
function phRender() {
  const r = phaseBalance($("#ph-1").value, $("#ph-2").value, $("#ph-3").value);
  if (!r) { $("#ph-out").innerHTML = '<span class="err">Three leg currents, zero or more.</span>'; $("#ph-bars").innerHTML = ""; return; }
  const hot = r.imbalancePercent > 20;
  $("#ph-out").innerHTML = 'Neutral carrying <b>' + r.neutralAmps + ' A</b> · ' +
    (hot ? '<span class="err">' : '<span class="ok">') + r.imbalancePercent + '% imbalance</span> · ' +
    'size the distro on <b>' + r.worstLeg + ' at ' + r.maxAmps + ' A</b>, not on the average of ' + r.meanAmps + ' A';
  const legs = [["L1", r.maxAmps === Number($("#ph-1").value)], ["L2", false], ["L3", false]];
  const vals = [Number($("#ph-1").value), Number($("#ph-2").value), Number($("#ph-3").value)];
  const top = Math.max(1, r.maxAmps, r.neutralAmps);
  let html = "";
  vals.forEach((v, i) => {
    const isMax = v === r.maxAmps;
    html += '<div class="leg' + (isMax && hot ? " hot" : "") + '"><b>' + v + 'A</b>' +
      '<i style="height:' + Math.max(2, (v / top) * 82) + '%"></i>' + legs[i][0] + '</div>';
  });
  html += '<div class="leg neutral"><b>' + r.neutralAmps + 'A</b><i style="height:' +
    Math.max(2, (r.neutralAmps / top) * 82) + '%"></i>N</div>';
  $("#ph-bars").innerHTML = html;
}
for (const id of ["#ph-1", "#ph-2", "#ph-3"]) $(id).addEventListener("input", phRender);

// ---- Noise dose ----
// Drawn as the show day: a bar of permitted time with the actual exposure
// laid over it, so running past the end of the allowance is something you
// see rather than a percentage you have to interpret.
function nsRender() {
  const parts = $("#ns-r").value.split("|");
  const r = noiseDose($("#ns-l").value, $("#ns-h").value, Number(parts[0]), Number(parts[1]), Number(parts[2]));
  if (!r) { $("#ns-out").innerHTML = '<span class="err">Level in dB, exposure in hours.</span>'; $("#ns-viz").innerHTML = ""; return; }
  const t = r.permittedMinutes < 90 ? r.permittedMinutes + ' min' : r.permittedHours + ' h';
  $("#ns-out").innerHTML = 'Permitted at that level: <b>' + t + '</b> · you are at <b class="' +
    (r.overExposed ? "err" : "") + '">' + r.dosePercent + '%</b> of the daily dose' +
    (r.overExposed ? ' — <span class="err">over</span>' : '') +
    (r.levelForDuration !== null ? ' · ' + $("#ns-h").value + ' h would need <b>' + r.levelForDuration + ' dB(A)</b>' : '');
  nsDraw(r);
}
function nsDraw(r) {
  const W = 460, H = 92, y = 34, barH = 26, x0 = 10, x1 = W - 10;
  const span = Math.max(r.permittedHours, Number($("#ns-h").value), 0.1);
  const px = (h) => x0 + (Math.min(h, span) / span) * (x1 - x0);
  const doseW = px(Number($("#ns-h").value)) - x0;
  const okW = px(r.permittedHours) - x0;
  const over = r.overExposed;
  $("#ns-viz").innerHTML =
    '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Noise dose against permitted time">' +
    '<rect x="' + x0 + '" y="' + y + '" width="' + (x1 - x0) + '" height="' + barH + '" rx="5" fill="var(--panel)" stroke="var(--line)"/>' +
    '<rect x="' + x0 + '" y="' + y + '" width="' + okW + '" height="' + barH + '" rx="5" fill="var(--ok)" opacity="0.28"/>' +
    '<rect x="' + x0 + '" y="' + (y + 5) + '" width="' + doseW + '" height="' + (barH - 10) + '" rx="3" fill="' +
      (over ? "var(--warn)" : "var(--ok)") + '"' + (over ? ' class="pulse"' : '') + '/>' +
    '<line x1="' + px(r.permittedHours) + '" y1="' + (y - 6) + '" x2="' + px(r.permittedHours) + '" y2="' + (y + barH + 6) + '" stroke="var(--accent2)" stroke-width="2"/>' +
    '<text x="' + Math.min(W - 42, px(r.permittedHours)) + '" y="' + (y - 11) + '" class="lbl" text-anchor="middle">limit</text>' +
    '<text x="' + x0 + '" y="' + (y + barH + 20) + '" class="lbl">0 h</text>' +
    '<text x="' + x1 + '" y="' + (y + barH + 20) + '" class="lbl" text-anchor="end">' + (Math.round(span * 10) / 10) + ' h</text>' +
    '<text x="' + (W / 2) + '" y="' + (y + barH + 20) + '" class="val" text-anchor="middle" fill="' +
      (over ? "var(--warn)" : "var(--ok)") + '">' + r.dosePercent + '% of the daily dose</text>' +
    '</svg>';
}
for (const id of ["#ns-l", "#ns-h", "#ns-r"]) $(id).addEventListener("input", nsRender);

// ---- Third-order intermod ----
function imRender() {
  const freqs = parseList($("#im-f").value);
  const r = intermod3(freqs, $("#im-g").value);
  if (!r) { $("#im-out").innerHTML = '<span class="err">Give at least two frequencies in MHz.</span>'; $("#im-viz").innerHTML = ""; $("#im-list").innerHTML = ""; return; }
  const n = r.clashes.length;
  $("#im-out").innerHTML = freqs.length + ' carriers · <b>' + r.products.length + '</b> third-order products · ' +
    (n ? '<span class="err"><b>' + n + '</b> landing on a channel in use</span>' : '<span class="ok">none landing on a channel in use</span>');
  $("#im-list").innerHTML = r.products.map((p) =>
    '<div class="' + (p.clashesWith !== null ? "clash" : "") + '">' + p.mhz.toFixed(3) + ' MHz · ' + p.order +
    ' from ' + p.from.join(", ") + (p.clashesWith !== null ? ' → hits ' + p.clashesWith : '') + '</div>').join("");
  imDraw(freqs, r);
}
function imDraw(freqs, r) {
  const W = 460, H = 128, base = 84;
  const all = freqs.concat(r.products.map((p) => p.mhz));
  const lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
  const span = (hi - lo) || 1;
  const px = (f) => 12 + ((f - lo) / span) * (W - 24);
  const mark = (f, h, col, cls) => '<line x1="' + px(f) + '" y1="' + base + '" x2="' + px(f) + '" y2="' + (base - h) +
    '" stroke="' + col + '" stroke-width="2.5" stroke-linecap="round"' + (cls ? ' class="' + cls + '"' : '') + '/>';
  $("#im-viz").innerHTML =
    '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Spectrum with intermodulation products">' +
    '<line x1="8" y1="' + base + '" x2="' + (W - 8) + '" y2="' + base + '" stroke="var(--line)" stroke-width="1.5"/>' +
    r.products.map((p) => mark(p.mhz, p.clashesWith !== null ? 34 : 16,
      p.clashesWith !== null ? "var(--warn)" : "var(--dimmer)", p.clashesWith !== null ? "pulse" : "")).join("") +
    freqs.map((f) => mark(f, 58, "var(--accent)")).join("") +
    '<rect x="12" y="' + (base - 62) + '" width="2" height="62" fill="var(--accent)" opacity="0.35" class="sweep" style="--sweep:' + (W - 26) + 'px"/>' +
    '<text x="12" y="' + (base + 18) + '" class="lbl">' + lo.toFixed(1) + ' MHz</text>' +
    '<text x="' + (W - 12) + '" y="' + (base + 18) + '" class="lbl" text-anchor="end">' + hi.toFixed(1) + ' MHz</text>' +
    '<text x="' + (W / 2) + '" y="' + (H - 8) + '" class="lbl" text-anchor="middle">tall = yours · short = product · red = collision</text>' +
    '</svg>';
}
$("#im-f").addEventListener("input", imRender);
$("#im-g").addEventListener("input", imRender);

// ---- DMX line budget in unit loads ----
function dlRender(){
  const g = [
    {count: Number($("#dl-1").value) || 0, unitLoad: 1},
    {count: Number($("#dl-2").value) || 0, unitLoad: 0.5},
    {count: Number($("#dl-4").value) || 0, unitLoad: 0.25},
    {count: Number($("#dl-8").value) || 0, unitLoad: 0.125},
  ];
  const r = dmxLineBudget(g);
  if (!r) { $("#dl-out").innerHTML = '<span class="err">Counts must be zero or more.</span>'; return; }
  const scale = Math.max(r.limit / 0.75, r.unitLoads * 1.08);
  $("#dl-meter").innerHTML =
    '<div class="fill" style="width:' + Math.min(100, (r.unitLoads / scale) * 100) + '%' +
    (r.withinLimit ? '' : ';background:linear-gradient(90deg,var(--accent2),var(--warn))') + '"></div>' +
    '<div class="tick" style="left:' + ((r.limit / scale) * 100) + '%"><span>32 UL</span></div>';
  $("#dl-out").innerHTML = r.withinLimit
    ? '<b>' + r.fixtures + '</b> fixtures = <b>' + r.unitLoads + '</b> unit loads · <span class="ok">one segment</span>, ' + r.headroomUnitLoads + ' UL spare'
    : '<b>' + r.fixtures + '</b> fixtures = <b>' + r.unitLoads + '</b> unit loads · <span class="err">needs ' + r.segmentsNeeded + ' segments</span> — split with an opto-splitter';
}
for (const id of ["#dl-1","#dl-2","#dl-4","#dl-8"]) $(id).addEventListener("input", dlRender);

// ---- Subnet calculator ----
function fbRender(){
  const r = frameBudget($("#fb-fps").value,
    [$("#fb-a").value, $("#fb-b").value, $("#fb-c").value, $("#fb-d").value]);
  if (!r) { $("#fb-out").textContent = "Enter a frame rate."; $("#fb-viz").innerHTML = ""; return; }
  const verdict = r.withinBudget
    ? '<b>' + r.headroomMs + ' ms</b> of headroom left'
    : '<b class="bad">over by ' + (r.usedMs - r.periodMs).toFixed(2) + ' ms</b> — this drops frames';
  $("#fb-out").innerHTML = 'A frame at ' + r.fps + ' fps is <b>' + r.periodMs + ' ms</b>. '
    + 'Using <b>' + r.usedMs + ' ms</b> (' + r.percentUsed + '%), ' + verdict + '. '
    + 'Achievable rate with this work: <b>' + r.achievableFps + ' fps</b>.';
  const stages = [["geometry", $("#fb-a").value], ["lighting", $("#fb-b").value],
    ["effects", $("#fb-c").value], ["post + output", $("#fb-d").value]];
  const colours = ["var(--dom-control)", "var(--accent2)", "var(--dom-network)", "var(--dom-visual)"];
  let bar = '<div style="display:flex;height:30px;border:1px solid var(--line);border-radius:6px;overflow:hidden">';
  stages.forEach((st, i) => {
    const ms = Math.max(0, Number(st[1]) || 0);
    const w = Math.min(100, (ms / r.periodMs) * 100);
    if (w > 0) bar += '<div style="width:' + w + '%;background:' + colours[i] + ';color:var(--bg);'
      + 'font-family:var(--mono);font-size:10px;display:flex;align-items:center;justify-content:center;'
      + 'overflow:hidden;white-space:nowrap">' + st[0] + '</div>';
  });
  if (r.withinBudget) bar += '<div style="flex:1;background:var(--panel2)"></div>';
  $("#fb-viz").innerHTML = bar + '</div>';
}
for (const id of ["#fb-fps","#fb-a","#fb-b","#fb-c","#fb-d"]) $(id).addEventListener("input", fbRender);

function pyRender(){
  const r = pyroCueTime($("#py-e").value, $("#py-l").value, $("#py-p").value);
  if (!r) { $("#py-out").textContent = "Enter a time and non-negative delays."; return; }
  if (r.beforeShowStart) {
    $("#py-out").innerHTML = 'Fire time is <b class="bad">' + r.fireSeconds + ' s</b> — before the show starts. '
      + 'This item cannot land where it is programmed; move the effect later or choose a shorter lift.';
    return;
  }
  $("#py-out").innerHTML = 'Fire at <b>' + r.fireSeconds + ' s</b> — '
    + '<b>' + r.fireTimecode25 + '</b> at 25 fps, <b>' + r.fireTimecode30 + '</b> at 30 fps. '
    + 'That is <b>' + r.totalDelaySeconds + ' s</b> before the audience sees it.';
}
for (const id of ["#py-e","#py-l","#py-p"]) $(id).addEventListener("input", pyRender);

function sbRender(fromNum){
  if (fromNum) $("#sb-p").value = Math.max(0, Math.min(32, Number($("#sb-pn").value) || 0));
  else $("#sb-pn").value = $("#sb-p").value;
  const p = Number($("#sb-p").value);
  $("#sb-plab").textContent = p;
  const r = subnetCidr($("#sb-ip").value.trim(), p);
  if (!r) {
    $("#sb-out").innerHTML = '<span class="err">Four numbers 0–255 separated by dots, and a prefix 0–32.</span>';
    $("#sb-table").innerHTML = "";
    return;
  }
  $("#sb-out").innerHTML = '<b>' + r.cidr + '</b> · ' + r.usableHosts.toLocaleString() + ' usable hosts · ' +
    (r.isPrivate ? '<span class="ok">RFC 1918 private</span>' : '<span class="err">public address space</span>');
  const row = (k, v) => '<tr><th>' + k + '</th><td>' + v + '</td></tr>';
  $("#sb-table").innerHTML =
    row("Network", r.network) + row("Subnet mask", r.mask) + row("Wildcard", r.wildcard) +
    row("Broadcast", r.broadcast ?? "— none at /" + r.prefix) +
    row("First host", r.firstHost ?? "—") + row("Last host", r.lastHost ?? "—") +
    row("Total addresses", r.totalAddresses.toLocaleString()) +
    row("Usable hosts", r.usableHosts.toLocaleString());
}
$("#sb-ip").addEventListener("input", () => sbRender(false));
$("#sb-p").addEventListener("input", () => sbRender(false));
$("#sb-pn").addEventListener("input", () => sbRender(true));

// ---- SPL over distance ----
function spRender(){
  const r = splAtDistance($("#sp-l").value, $("#sp-r").value, $("#sp-d").value);
  if (!r) { $("#sp-out").innerHTML = '<span class="err">Distances must be greater than zero.</span>'; return; }
  $("#sp-out").innerHTML = '<b>' + r.spl + ' dB</b> at ' + $("#sp-d").value + ' m — down <b>' + r.dropDb +
    ' dB</b> over ' + r.doublings + ' doublings of distance (free field)';
}
for (const id of ["#sp-l","#sp-r","#sp-d"]) $(id).addEventListener("input", spRender);

dmxRender(false);
dipRenderFromAddress();
dbuvRender("dbu");
delayRender();
tcRenderFromFields();
powerRender();
beamRender();
ledRender();
rfRender();
drawBeam();
drawPowerMeter();
drawLedPreview();
ohmRender();
spkRender();
latRender();
thRender();
scrRender();
relayRender();
dlRender();
fbRender();
pyRender();
sbRender(false);
spRender();
brRender(true);
vdRender();
phRender();
nsRender();
imRender();

/* ---- colour temperature correction ------------------------------------ */
function miRender(){
  const r = miredShift($("#mi-s").value, $("#mi-t").value);
  if(!r){ $("#mi-out").innerHTML = '<span class="err">Enter two temperatures in kelvin.</span>'; return; }
  const sign = (n) => (n > 0 ? "+" : "") + n;
  let html = "<b>" + sign(r.shift) + "</b> mired &middot; " + r.direction
    + " &middot; " + r.sourceMired + " &rarr; " + r.targetMired + " mired";
  if (r.gelIsClose) {
    html += "<br>Nearest gel: <b>" + r.nearestGel.name + "</b> (Lee " + r.nearestGel.id
      + ", " + sign(r.nearestGel.shift) + ") &mdash; " + r.nearestGel.error + " mired out, lands at "
      + r.resultOf(r.nearestGel.shift) + " K";
  } else {
    html += '<br><span class="err">No single gel is close</span> &mdash; nearest is '
      + r.nearestGel.name + " at " + r.nearestGel.error + " mired out";
    if (r.nearestPair) {
      html += "<br>Stack <b>" + r.nearestPair.a.name + " + " + r.nearestPair.b.name + "</b> ("
        + sign(r.nearestPair.sum) + ") &mdash; " + r.nearestPair.error + " mired out, lands at "
        + r.resultOf(r.nearestPair.sum) + " K";
    }
  }
  $("#mi-out").innerHTML = html;
}
["#mi-s","#mi-t"].forEach(id => $(id).addEventListener("input", miRender));
miRender();

/* ---- fibre loss budget ------------------------------------------------- */
$("#fi-t").innerHTML = Object.entries(FIBRE_ATTENUATION)
  .map(([k,v]) => '<option value="' + k + '">' + v.label + " (" + v.dbPerKm + " dB/km)</option>").join("");
function fiRender(){
  const r = fibreLossBudget($("#fi-l").value, $("#fi-t").value, $("#fi-c").value, $("#fi-s").value,
    { linkBudgetDb: $("#fi-b").value });
  if(!r){ $("#fi-out").innerHTML = '<span class="err">Check the length and counts.</span>'; return; }
  let verdict;
  if (!r.ok) verdict = '<span class="err">over budget by ' + Math.abs(r.marginDb) + " dB</span>";
  else if (r.thin) verdict = '<span class="err">only ' + r.marginDb + " dB spare &mdash; too thin to trust</span>";
  else verdict = '<span class="ok">' + r.marginDb + " dB margin</span>";
  $("#fi-out").innerHTML = "<b>" + r.totalLossDb + "</b> dB total &middot; " + verdict
    + "<br>" + r.fibreLossDb + " dB glass &middot; " + r.connectorLossDb + " dB connectors &middot; "
    + r.spliceLossDb + " dB splices &middot; budget " + r.linkBudgetDb + " dB"
    + "<br>Same construction reaches <b>" + r.maxLengthM + "</b> m before it runs out";
}
["#fi-l","#fi-t","#fi-c","#fi-s","#fi-b"].forEach(id => $(id).addEventListener("input", fiRender));
fiRender();

/* ---- heat load --------------------------------------------------------- */
function heRender(){
  const r = heatLoad($("#he-w").value, { people: $("#he-p").value });
  if(!r){ $("#he-out").innerHTML = '<span class="err">Enter the equipment load in watts.</span>'; return; }
  const dt = Number($("#he-d").value);
  const m3 = r.airflowM3PerHourFor(dt), cfm = r.airflowCfmFor(dt);
  $("#he-out").innerHTML = "<b>" + r.btuPerHour.toLocaleString() + "</b> BTU/hr &middot; "
    + r.kwThermal + " kW thermal &middot; <b>" + r.tonsOfCooling + "</b> tons of cooling"
    + (r.peopleW ? "<br>" + r.equipmentW.toLocaleString() + " W kit + " + r.peopleW.toLocaleString() + " W audience" : "")
    + (m3 ? "<br>Needs <b>" + m3.toLocaleString() + "</b> m&sup3;/h (" + cfm.toLocaleString()
      + " cfm) to hold a " + dt + " &deg;C rise" : "");
}
["#he-w","#he-p","#he-d"].forEach(id => $(id).addEventListener("input", heRender));
heRender();

/* ---- video storage ----------------------------------------------------- */
function stRender(){
  const r = videoStorage($("#st-b").value, $("#st-m").value, { streams: $("#st-n").value });
  if(!r){ $("#st-out").innerHTML = '<span class="err">Enter a bitrate and a duration.</span>'; return; }
  const card = Number($("#st-c").value);
  const mins = r.minutesForGb(card);
  $("#st-out").innerHTML = "<b>" + r.gigabytes.toLocaleString() + "</b> GB ("
    + r.gibibytes.toLocaleString() + " GiB as the OS reports it)"
    + "<br>Sustained write <b>" + r.writeMBps + "</b> MB/s"
    + (r.streams > 1 ? " across " + r.streams + " streams at " + r.totalMbps + " Mbps" : "")
    + (mins ? "<br>A " + card.toLocaleString() + " GB card holds <b>"
      + Math.floor(mins / 60) + " h " + Math.round(mins % 60) + " min</b>" : "");
}
["#st-b","#st-m","#st-n","#st-c"].forEach(id => $(id).addEventListener("input", stRender));
stRender();

/* ---- battery runtime --------------------------------------------------- */
function baRender(){
  const r = batteryRuntime($("#ba-c").value, $("#ba-d").value,
    { usableFraction: Number($("#ba-u").value) / 100 });
  if(!r){ $("#ba-out").innerHTML = '<span class="err">Enter a capacity and a draw.</span>'; return; }
  const need = Number($("#ba-n").value);
  const covers = r.coversHours(need), packs = r.packsForHours(need);
  $("#ba-out").innerHTML = "<b>" + Math.floor(r.minutes / 60) + " h " + (r.minutes % 60)
    + " min</b> usable &middot; " + r.idealHours + " h on the nameplate"
    + (covers === null ? "" : "<br>" + (covers
      ? '<span class="ok">covers a ' + need + " h call on one pack</span>"
      : '<span class="err">does not cover ' + need + " h</span> &mdash; needs <b>" + packs + "</b> packs or a swap"));
}
["#ba-c","#ba-d","#ba-u","#ba-n"].forEach(id => $(id).addEventListener("input", baRender));
baRender();

/* ---- aspect fit -------------------------------------------------------- */
function asRender(){
  const r = aspectFit($("#as-cw").value, $("#as-ch").value, $("#as-sw").value, $("#as-sh").value);
  if(!r){ $("#as-out").innerHTML = '<span class="err">All four dimensions must be above zero.</span>'; return; }
  if (r.match) {
    $("#as-out").innerHTML = "<b>Same aspect</b> &mdash; " + r.contentAspect
      + ":1, no bars and no crop &middot; scale " + r.fit.scale + "&times;"
      + (r.upscalingFit ? ' <span class="err">upscaling</span>' : "");
    return;
  }
  const bars = r.fit.pillarboxEach
    ? "<b>" + r.fit.pillarboxEach + "</b> px bars each side"
    : "<b>" + r.fit.letterboxEach + "</b> px bars top and bottom";
  const crop = r.fill.cropEachSide
    ? "<b>" + r.fill.cropEachSide + "</b> px off each side"
    : "<b>" + r.fill.cropTopBottom + "</b> px off top and bottom";
  $("#as-out").innerHTML = "Content " + r.contentAspect + ":1 into a surface of " + r.screenAspect + ":1"
    + "<br><b>Fit</b> &mdash; " + r.fit.width + "&times;" + r.fit.height + " at " + r.fit.scale
    + "&times;, " + bars + ", " + r.fit.unusedPercent + "% of the surface unused"
    + (r.upscalingFit ? ' <span class="err">upscaling</span>' : "")
    + "<br><b>Fill</b> &mdash; " + r.fill.width + "&times;" + r.fill.height + " at " + r.fill.scale
    + "&times;, " + crop + ", " + r.fill.lostPercent + "% of the content lost"
    + (r.upscalingFill ? ' <span class="err">upscaling</span>' : "");
}
["#as-cw","#as-ch","#as-sw","#as-sh"].forEach(id => $(id).addEventListener("input", asRender));
asRender();

/* ---- room modes -------------------------------------------------------- */
function rmRender(){
  const r = roomModes($("#rm-l").value, $("#rm-w").value, $("#rm-h").value, { rt60: $("#rm-rt").value });
  if(!r){ $("#rm-out").innerHTML = '<span class="err">All three dimensions must be above zero.</span>'; return; }
  const list = r.modes.slice(0,5).map(m => "<b>"+m.hz+"</b> Hz <span style='color:var(--dimmer)'>("+m.axis+" "+m.order+")</span>").join(" &middot; ");
  let html = (r.schroeder ? "<b>"+r.schroeder+"</b> Hz Schroeder &mdash; modal below, diffuse above" : "Enter an RT60 for the Schroeder frequency")
    + "<br>Lowest axial modes: " + list
    + "<br>" + r.volume + " m&sup3;";
  if (r.pileups.length) {
    const at = [...new Set(r.pileups.map(p=>p.hz))].slice(0,3).join(", ");
    html += '<br><span class="err">Modes pile up around ' + at + ' Hz</span> &mdash; two axes landing together is worse than either alone.';
  }
  if (r.ratioWarning) html += '<br><span class="err">Dimensions are near-simple multiples</span> &mdash; modes stack instead of spreading.';
  $("#rm-out").innerHTML = html;
}
["#rm-l","#rm-w","#rm-h","#rm-rt"].forEach(id => $(id).addEventListener("input", rmRender));
rmRender();

/* ---- line array coverage ----------------------------------------------- */
function laRender(){
  const front = Number($("#la-front").value), back = Number($("#la-back").value);
  const r = lineArrayCoverage($("#la-len").value, $("#la-f").value, back);
  if(!r){ $("#la-out").innerHTML = '<span class="err">Check the length, frequency and distance.</span>'; return; }
  const ftb = r.frontToBackDb(front, back);
  let html = "<b>" + r.transitionM + "</b> m transition at " + r.frequencyHz + " Hz"
    + " &middot; the back row at " + back + " m is " + (r.nearField ? "still cylindrical" : "into the spherical region");
  if (ftb !== null) {
    html += "<br>Front to back: <b>" + ftb + "</b> dB"
      + (ftb > 12 ? ' <span class="err">&mdash; the front row is paying for the back row</span>'
                  : ' <span class="ok">&mdash; workable without heavy shading</span>');
  }
  html += "<br>A point source over the same distance would lose <b>" + r.pointSourceLossDb
    + "</b> dB; this array loses " + r.lossDb + " &mdash; " + r.advantageDb + " dB better.";
  $("#la-out").innerHTML = html;
}
["#la-len","#la-f","#la-front","#la-back"].forEach(id => $(id).addEventListener("input", laRender));
laRender();

/* ---- stops of light ---------------------------------------------------- */
function soRender(){
  const r = stopsOfLight($("#so-v").value, $("#so-mode").value);
  if(!r){ $("#so-out").innerHTML = '<span class="err">Transmission is 0 to 1; density and stops are positive.</span>'; return; }
  const lux = Number($("#so-lux").value);
  const after = r.appliedTo(lux);
  $("#so-out").innerHTML = "<b>" + r.stops + "</b> stop" + (r.stops === 1 ? "" : "s")
    + " &middot; " + r.percent + "% transmission &middot; " + r.ndLabel
    + (after !== null ? "<br>" + lux.toLocaleString() + " lux becomes <b>" + after.toLocaleString() + "</b> lux" : "");
}
["#so-v","#so-mode","#so-lux"].forEach(id => $(id).addEventListener("input", soRender));
$("#so-mode").addEventListener("change", soRender);
soRender();

/* ---- wind load ---------------------------------------------------------- */
function wlRender(){
  const m = Number($("#wl-m").value), h = Number($("#wl-h").value), b = Number($("#wl-b").value);
  const r = windLoad($("#wl-v").value, $("#wl-a").value, {
    forceCoefficient: $("#wl-cf").value,
    centroidHeightM: h, baseWidthM: b, massKg: m,
  });
  if(!r){ $("#wl-out").innerHTML = '<span class="err">Speed cannot be negative and area has to be more than zero.</span>'; return; }
  let html = "<b>" + r.forceKgf.toLocaleString() + "</b> kgf on the face at " + r.speedMs + " m/s"
    + " &middot; " + r.pressurePa + " Pa &middot; Beaufort " + r.beaufort.force + ", " + r.beaufort.name.toLowerCase();
  html += "<br>In a " + r.gustSpeedMs + " m/s gust: <b>" + r.gustForceKgf.toLocaleString() + "</b> kgf"
    + ' <span class="dim">&mdash; the gust is what takes it over, not the average</span>';
  if (r.overturning) {
    const o = r.overturning;
    html += o.stable
      ? '<br><span class="ok">&#10003; Stable in that gust</span> &mdash; restoring moment is ' + o.ratio + '&times; the overturning moment'
      : '<br><span class="err">&#9888; Overturns in that gust</span> &mdash; needs <b>' + o.extraBallastKg.toLocaleString() + '</b> kg more ballast, or a wider base';
  }
  html += "<br>At 20 m/s the same face takes <b>" + Math.round(r.atSpeed(20).forceN / 9.81).toLocaleString() + "</b> kgf.";
  $("#wl-out").innerHTML = html;
}
["#wl-v","#wl-a","#wl-cf","#wl-m","#wl-h","#wl-b"].forEach(id => $(id).addEventListener("input", wlRender));
$("#wl-cf").addEventListener("change", wlRender);
wlRender();

/* ---- dew point ---------------------------------------------------------- */
function dpRender(){
  const r = dewPoint($("#dp-t").value, $("#dp-rh").value, { surfaceTempC: Number($("#dp-s").value) });
  if(!r){ $("#dp-out").innerHTML = '<span class="err">Relative humidity is 1 to 100%.</span>'; return; }
  let html = "Dew point <b>" + r.dewPointC + "</b> &deg;C &middot; " + r.absoluteHumidityGm3 + " g of water per m&sup3;"
    + " &middot; the air has " + r.spreadC + " &deg;C to give before it rains on the rig";
  const c = r.condensation;
  if (c) {
    html += c.willCondense
      ? '<br><span class="err">&#9888; A surface at ' + c.surfaceTempC + ' &deg;C will condense</span> &mdash; it is '
        + Math.abs(c.marginC) + ' &deg;C below the dew point. Do not power it.'
      : '<br><span class="ok">&#10003; A surface at ' + c.surfaceTempC + ' &deg;C stays dry</span> &mdash; '
        + c.marginC + ' &deg;C of margin.';
    html += "<br>Warm it to <b>" + r.safeSurfaceC + "</b> &deg;C for a 2 &deg;C margin.";
  }
  $("#dp-out").innerHTML = html;
}
["#dp-t","#dp-rh","#dp-s"].forEach(id => $(id).addEventListener("input", dpRender));
dpRender();

/* ---- flash rate --------------------------------------------------------- */
function flRender(){
  const typed = Number($("#fl-hz").value);
  const bpm = Number($("#fl-bpm").value), div = Number($("#fl-div").value);
  /* A typed Hz overrides the musical division, because somebody who typed a
     number wants that number, not our arithmetic. */
  const hz = typed > 0 ? typed : flashRate(0).fromBpm(bpm, div);
  if (hz === null) { $("#fl-out").innerHTML = '<span class="err">Check the tempo.</span>'; return; }
  const r = flashRate(hz, { saturatedRed: $("#fl-red").value === "1", stripes: Number($("#fl-st").value) });
  if(!r){ $("#fl-out").innerHTML = '<span class="err">Flash rate cannot be negative.</span>'; return; }
  let html = "<b>" + r.flashesPerSecond + "</b> flashes per second"
    + (typed > 0 ? "" : ' <span class="dim">&mdash; ' + bpm + " BPM, " + $("#fl-div").selectedOptions[0].textContent + "</span>")
    + (r.periodMs ? " &middot; one every " + r.periodMs + " ms" : "");
  html += r.withinGuidance
    ? '<br><span class="ok">&#10003; Within the three-per-second guidance</span>'
    : '<br><span class="err">&#9888; Outside the guidance</span>';
  /* Single quotes: a backslash-escaped quote inside the template literal that
     wraps this script collapses to a bare quote and breaks the whole file. */
  if (r.issues.length) html += '<ul class="fllist"><li>' + r.issues.join('</li><li>') + '</li></ul>';
  if (!r.withinGuidance) {
    const safe = r.slowestSafeDivision(bpm);
    if (safe) html += "At " + bpm + " BPM the fastest division that stays inside the guidance is <b>"
      + safe.label + "</b>, which is " + safe.rate + " a second.";
  }
  $("#fl-out").innerHTML = html;
}
["#fl-bpm","#fl-div","#fl-hz","#fl-red","#fl-st"].forEach(id => $(id).addEventListener("input", flRender));
["#fl-div","#fl-red"].forEach(id => $(id).addEventListener("change", flRender));
flRender();

/* ---- assistive listening ------------------------------------------------ */
function alRender(){
  const r = assistiveListening($("#al-s").value, { inductionLoopAllSeats: $("#al-loop").value === "1" });
  if(!r){ $("#al-out").innerHTML = '<span class="err">A venue needs at least one seat.</span>'; return; }
  let html = "<b>" + r.receivers + "</b> receivers required"
    + ' <span class="dim">&mdash; Table 219.3 row &ldquo;' + r.band + '&rdquo;, about one per ' + r.onePer + " seats</span>";
  html += r.hearingAidCompatible > 0
    ? "<br><b>" + r.hearingAidCompatible + "</b> of them hearing-aid compatible"
    : "<br><b>No</b> hearing-aid compatible receivers required";
  html += '<br><span class="dim">' + r.note + "</span>";
  $("#al-out").innerHTML = html;
}
["#al-s","#al-loop"].forEach(id => $(id).addEventListener("input", alRender));
$("#al-loop").addEventListener("change", alRender);
alRender();

/* ---- cable derating ----------------------------------------------------- */
function cdRender(){
  const r = cableDerating($("#cd-a").value, {
    conductors: $("#cd-n").value, ambientC: $("#cd-t").value, insulationC: $("#cd-i").value,
  });
  if(!r){ $("#cd-out").innerHTML = '<span class="err">Check the rating, conductor count and temperatures.</span>'; return; }
  if (r.overTemperature) {
    $("#cd-out").innerHTML = '<span class="err">&#9888; Ambient is at or above the insulation rating &mdash; this cable has no ampacity here at all.</span>';
    return;
  }
  let html = "<b>" + r.deratedAmps + "</b> A after derating"
    + ' <span class="dim">&mdash; from ' + r.baseAmps + " A, a loss of " + r.lostPercent + "%</span>"
    + "<br>Bundling &times;" + r.bundleFactor + " &middot; temperature &times;" + r.tempFactor;
  const g = awgToMm2($("#cd-g").value);
  if (g) {
    const back = mm2ToAwg(g.areaMm2);
    html += "<br>" + g.label + " is <b>" + g.areaMm2 + "</b> mm&sup2; (" + g.diameterMm + " mm across the conductor)";
    if (back && back.nearestAwg !== g.awg) html += ' <span class="dim">&mdash; nearest metric size differs</span>';
  }
  $("#cd-out").innerHTML = html;
}
["#cd-a","#cd-n","#cd-t","#cd-i","#cd-g"].forEach(id => $(id).addEventListener("input", cdRender));
$("#cd-i").addEventListener("change", cdRender);
cdRender();

/* ---- SDI reach ---------------------------------------------------------- */
function sdRender(){
  const r = coaxReach($("#sd-att").value, $("#sd-f").value, { equalisationDb: Number($("#sd-eq").value) });
  if(!r){ $("#sd-out").innerHTML = '<span class="err">Loss, frequency and the EQ budget all have to be above zero.</span>'; $("#sd-table").innerHTML = ""; return; }
  const len = Number($("#sd-len").value);
  let rows = "<tr><th>Rate</th><th>Half clock</th><th>Loss</th><th>Max run</th><th>At " + (len > 0 ? len + " m" : "your run") + "</th></tr>";
  for (const rate of r.rates) {
    const run = len > 0 ? r.canRun(len, rate.key) : null;
    let verdict = "&mdash;";
    if (run) {
      verdict = run.ok
        ? (run.thin ? '<span class="warn">&#9679; ' + run.marginDb + ' dB spare</span>' : '<span class="ok">&#10003; ' + run.marginDb + " dB spare</span>")
        : '<span class="err">&#9888; ' + Math.abs(run.marginDb) + " dB over</span>";
    }
    rows += "<tr><td>" + rate.label + "</td><td>" + Math.round(rate.halfClockMhz) + " MHz</td><td>"
      + rate.lossDbPer100m + " dB/100 m</td><td><b>" + rate.reachM + "</b> m</td><td>" + verdict + "</td></tr>";
  }
  $("#sd-table").innerHTML = rows;
  const twelve = r.rates.find(x => x.key === "12g"), three = r.rates.find(x => x.key === "3g");
  $("#sd-out").innerHTML = "This cable carries 3G-SDI <b>" + three.reachM + "</b> m and 12G-SDI <b>" + twelve.reachM
    + '</b> m &middot; <span class="dim">four times the bit rate is half the reach, because loss goes with the square root of frequency</span>';
}
["#sd-att","#sd-f","#sd-eq","#sd-len"].forEach(id => $(id).addEventListener("input", sdRender));
sdRender();

/* ---- colour mixing and shadows ------------------------------------------ */
function cmRender(){
  const hexToRgb = (h) => ({ r: parseInt(h.slice(1,3),16), g: parseInt(h.slice(3,5),16), b: parseInt(h.slice(5,7),16) });
  const mode = $("#cm-mode").value;
  const src = [];
  for (const n of [1,2,3]) {
    const level = Number($("#cm-l"+n).value) / 100;
    $("#cm-l"+n+"v").textContent = Math.round(level*100) + "%";
    /* A source at zero is not in the rig. Keeping it in the list would make a
       subtractive stack multiply by a filter that is not in the beam, and
       would give a shadow for a lamp that is off. */
    if (level > 0) src.push({ ...hexToRgb($("#cm-c"+n).value), level, name: "source " + n, index: n });
  }
  if (!src.length) {
    $("#cm-sw").innerHTML = "";
    $("#cm-out").innerHTML = '<span class="err">Everything is at zero. Bring a source up.</span>';
    return;
  }
  const m = colourMix(src, mode);
  if (!m) { $("#cm-out").innerHTML = '<span class="err">Check the levels.</span>'; return; }

  let sw = '<div class="sw"><span class="chip" style="background:' + m.hex + '"></span>'
    + "<b>the mix</b><em>" + m.hex + "</em></div>";
  if (mode === "additive") {
    src.forEach((s, i) => {
      const sh = m.shadowOf(i);
      if (!sh) return;
      sw += '<div class="sw"><span class="chip" style="background:' + sh.hex + '"></span>'
        + "<b>shadow of " + s.index + "</b><em>" + (sh.black ? "black" : sh.hex) + "</em></div>";
    });
  }
  $("#cm-sw").innerHTML = sw;

  let html = "Mix <b>" + m.hex + "</b> &middot; relative luminance " + m.luminance;
  /* Headroom is an additive idea. A subtractive stack cannot clip - it only
     ever removes - so reporting headroom there would be answering a question
     nobody asked with a number that means nothing. */
  if (mode === "additive") {
    html += m.clipped
      ? ' <span class="warn">&#9679; clipped &mdash; a channel is out of headroom, so pushing further shifts the hue rather than adding brightness</span>'
      : ' <span class="dim">&middot; ' + Math.round(m.headroom*100) + "% headroom left</span>";
  }
  if (mode === "additive") {
    const lit = src.length;
    html += "<br>" + (lit > 1
      ? "Each shadow is lit by every source the object does not block, so it takes those sources&rsquo; colour &mdash; not grey."
      : "One source casts a genuinely black shadow: there is nothing else reaching the surface.");
  } else {
    html += "<br>Each layer multiplies what is left. " + (m.luminance < 0.15
      ? "This stack is nearly closed &mdash; a deep colour is always a dim one."
      : "Stack another and it gets deeper and dimmer together.");
  }
  $("#cm-out").innerHTML = html;
}
["#cm-mode","#cm-c1","#cm-c2","#cm-c3","#cm-l1","#cm-l2","#cm-l3"].forEach(id => $(id).addEventListener("input", cmRender));
$("#cm-mode").addEventListener("change", cmRender);
cmRender();

/* ---- mixing colour temperatures ----------------------------------------- */
function cwRender(){
  const al = Number($("#cw-al").value)/100, bl = Number($("#cw-bl").value)/100;
  $("#cw-alv").textContent = Math.round(al*100) + "%";
  $("#cw-blv").textContent = Math.round(bl*100) + "%";
  const r = mixWhites([{ cct: $("#cw-a").value, level: al }, { cct: $("#cw-b").value, level: bl }]);
  if (!r) { $("#cw-out").innerHTML = '<span class="err">Colour temperatures are 1000 to 20000 K, and something has to be above zero.</span>'; return; }
  let html = "<b>" + r.resultK.toLocaleString() + "</b> K &middot; " + r.resultMired + " mired";
  if (r.kelvinErrorIfAveraged !== 0) {
    html += '<br><span class="dim">Averaging the kelvin figures would have said ' + r.naiveKelvinAverage.toLocaleString()
      + " K &mdash; out by " + Math.abs(r.kelvinErrorIfAveraged).toLocaleString() + " K.</span>";
  }
  html += "<br>" + r.miredSpread + " mired apart &middot; "
    + (r.greenShift ? '<span class="warn">&#9679; ' : '<span class="ok">&#10003; ') + r.advice + "</span>";
  $("#cw-out").innerHTML = html;
}
["#cw-a","#cw-b","#cw-al","#cw-bl"].forEach(id => $(id).addEventListener("input", cwRender));
cwRender();

/* ---- MIDI hex decoder ---------------------------------------------------- */
function mdRender(){
  const d = midiDecode($("#md-in").value);
  if (!d) { $("#md-out").innerHTML = '<span class="err">Paste some hex bytes.</span>'; $("#md-table").innerHTML = ""; return; }
  if (d.error) { $("#md-out").innerHTML = '<span class="err">' + d.error + "</span>"; $("#md-table").innerHTML = ""; return; }
  if (!d.messages.length) { $("#md-out").innerHTML = '<span class="dim">Nothing to decode yet.</span>'; $("#md-table").innerHTML = ""; return; }
  let rows = "<tr><th>Bytes</th><th>Message</th><th>Ch</th><th>What it means</th></tr>";
  let bad = 0;
  for (const m of d.messages) {
    if (m.error) bad++;
    rows += "<tr><td>" + m.raw.join(" ")
      + (m.runningStatus ? ' <span class="dim">(running)</span>' : "")
      + "</td><td>" + (m.error ? '<span class="err">' + m.name + "</span>" : m.name)
      + "</td><td>" + (m.channel ?? "&mdash;")
      + "</td><td>" + (m.detail ?? "&mdash;") + "</td></tr>";
  }
  $("#md-table").innerHTML = rows;
  const running = d.messages.filter(m => m.runningStatus).length;
  $("#md-out").innerHTML = "<b>" + d.messages.length + "</b> message" + (d.messages.length === 1 ? "" : "s")
    + " from " + d.bytes + " bytes"
    + (running ? ' &middot; <span class="dim">' + running + " using running status</span>" : "")
    + (bad ? ' &middot; <span class="err">' + bad + " could not be parsed</span>" : "");
}
$("#md-in").addEventListener("input", mdRender);
mdRender();

/* ---- Pepper's ghost ------------------------------------------------------ */
function pgRender(){
  const r = peppersGhost({
    objectLuminance: $("#pg-obj").value,
    backgroundLuminance: $("#pg-bg").value,
    reflectance: $("#pg-r").value,
  });
  if(!r){ $("#pg-out").innerHTML = '<span class="err">Luminances cannot be negative and a pane cannot reflect everything.</span>'; return; }
  const target = Number($("#pg-t").value);
  let html = "Ghost <b>" + r.ghostLuminance + "</b> cd/m&sup2; against <b>" + r.backgroundLuminance
    + "</b> cd/m&sup2; of set showing through";
  html += "<br>" + (r.contrastRatio === null
    ? '<span class="ok">&#10003; Nothing behind it &mdash; the ghost is as solid as it gets</span>'
    : "<b>" + r.contrastRatio + ":1</b> &middot; reads as <b>" + r.reads + "</b>"
      + (r.reads === "solid" ? ' <span class="ok">&#10003;</span>' : ' <span class="warn">&#9679;</span>'));
  if (target > 0 && r.contrastRatio !== null && r.contrastRatio < target) {
    const needObj = r.objectLuminanceFor(target);
    const needBg = r.backgroundLuminanceFor(target);
    html += "<br>For " + target + ":1 you can light the object to <b>" + needObj.toLocaleString()
      + "</b> cd/m&sup2;, or bring the set behind it down to <b>" + needBg
      + '</b> &mdash; <span class="dim">the second one costs nothing but a conversation</span>';
  }
  $("#pg-out").innerHTML = html;
}
["#pg-obj","#pg-bg","#pg-r","#pg-t"].forEach(id => $(id).addEventListener("input", pgRender));
$("#pg-r").addEventListener("change", pgRender);
pgRender();

/* ---- forced perspective -------------------------------------------------- */
function fpRender(){
  const r = forcedPerspective($("#fp-s").value, $("#fp-d1").value, $("#fp-d2").value);
  if(!r){ $("#fp-out").innerHTML = '<span class="err">Sizes and distances all have to be above zero.</span>'; return; }
  let html = "To match a <b>" + r.realSize + "</b> m object at " + r.realDistanceM + " m, an object at "
    + r.targetDistanceM + " m has to be <b>" + r.requiredSize + "</b> m &mdash; " + r.scaleFactor + "&times; the size";
  html += '<br><span class="dim">Both subtend ' + r.angularSizeDeg + "&deg; at the eye, which is the only thing being matched.</span>";
  html += "<br>" + (r.disparityWillBetrayIt
    ? '<span class="warn">&#9679; ' : '<span class="ok">&#10003; ') + r.note + "</span>";
  $("#fp-out").innerHTML = html;
}
["#fp-s","#fp-d1","#fp-d2"].forEach(id => $(id).addEventListener("input", fpRender));
fpRender();

/* ---- DMX refresh, and what RDM costs ------------------------------------ */
function drRender(){
  const slots = Number($("#dr-slots").value);
  const r = rdmOverhead($("#dr-tx").value, { slots, responsePdl: Number($("#dr-pdl").value) });
  if(!r){ $("#dr-out").innerHTML = '<span class="err">Slots are 1&ndash;512 and response data tops out at 231 bytes.</span>'; return; }
  if (r.saturated) {
    $("#dr-out").innerHTML = '<span class="err">&#9888; The wire is full of RDM. There is no room left for level data at all &mdash; which is what a runaway discovery looks like from the fixture&rsquo;s end.</span>';
    return;
  }
  let html = "<b>" + r.refreshHz + "</b> Hz with " + slots + " slots"
    + (r.transactionsPerSecond > 0
      ? " and " + r.transactionsPerSecond + " RDM transactions a second"
      : ' <span class="dim">and no RDM traffic</span>');
  if (r.transactionsPerSecond > 0) {
    html += "<br>Each transaction is <b>" + r.transactionMs + "</b> ms of wire time &mdash; "
      + r.wirePercent + "% of the second &mdash; costing <b>" + r.lostHz + "</b> Hz off "
      + r.baseRefreshHz + ".";
  } else {
    html += '<br><span class="dim">A full frame is break + mark + 513 slots at 44 &micro;s. Sending fewer slots is the only way to go faster.</span>';
  }
  $("#dr-out").innerHTML = html;
}
["#dr-slots","#dr-tx","#dr-pdl"].forEach(id => $(id).addEventListener("input", drRender));
drRender();

/* ---- RDM UID ------------------------------------------------------------- */
function ruRender(){
  const u = rdmUid($("#ru-in").value);
  if(!u){ $("#ru-out").innerHTML = '<span class="err">A UID is 48 bits: four hex digits, then eight. Try 4C55:12345678.</span>'; return; }
  let html = "<b>" + u.uid + "</b> &middot; manufacturer <b>" + u.manufacturerHex
    + "</b>, device <b>" + u.deviceHex + "</b>";
  html += "<br>Addresses <b>" + u.scope + "</b>";
  html += '<br><span class="dim">' + u.note + "</span>";
  $("#ru-out").innerHTML = html;
}
$("#ru-in").addEventListener("input", ruRender);
ruRender();

/* ---- harmonics and the neutral ------------------------------------------- */
function hdRender(){
  const pct = (id) => { const v = Number($(id).value); $(id + "v").textContent = v + "%"; return v / 100; };
  /* Index 0 is the 2nd harmonic, so the odd orders land at 1, 3, 5, 7. */
  const harmonics = [0, pct("#hd-3"), 0, pct("#hd-5"), 0, pct("#hd-7"), 0, pct("#hd-9")];
  const r = thd(harmonics, { fundamentalAmps: Number($("#hd-a").value) });
  if(!r){ $("#hd-out").innerHTML = '<span class="err">Check the current and the harmonic levels.</span>'; return; }
  let html = "THD-F <b>" + r.thdF + "%</b> &middot; THD-R " + r.thdR
    + "% &middot; distortion power factor <b>" + r.distortionPowerFactor + "</b>";
  if (r.neutral) {
    html += "<br>Each phase carries <b>" + r.neutral.phaseAmps + "</b> A; the neutral carries <b>"
      + r.neutral.neutralAmps + "</b> A";
    html += r.neutral.exceedsPhase
      ? ' <span class="err">&#9888; more than any phase, on a perfectly balanced rig, with nothing protecting that conductor</span>'
      : ' <span class="ok">&#10003; inside the phase current</span>';
  }
  html += '<br><span class="dim">Triplens are ' + r.triplenShare + "% of the fundamental &mdash; those are the ones that add. " + r.verdict + ".</span>";
  $("#hd-out").innerHTML = html;
}
["#hd-a","#hd-3","#hd-5","#hd-7","#hd-9"].forEach(id => $(id).addEventListener("input", hdRender));
hdRender();

/* ---- protocol builders --------------------------------------------------
   These produce the exact octets a protocol puts on the wire. A browser
   cannot open a raw TCP or UDP socket, so for everything except MIDI the
   deliverable is the bytes and a command line, not a transmission. Being
   clear about that is the point: a tool that pretended to send would be
   worse than one that hands you something you can actually run. */
const bytesBlock = (hex, extra) =>
  '<div class="lbl">' + extra + '</div>' + hex;

function osRender(){
  const raw = $("#os-args").value.trim();
  const args = raw ? raw.split(",").map(t => {
    const v = t.trim();
    if (v === "") return "";
    /* A bare number is an int if it has no decimal point, a float if it does.
       Everything else is a string. Doubled escapes because this is inside a
       template literal: a single backslash-d collapses to a plain d, and the
       regex then silently matches nothing instead of failing loudly. */
    return /^-?\\d+$/.test(v) ? parseInt(v, 10) : /^-?\\d*\\.\\d+$/.test(v) ? parseFloat(v) : v;
  }) : [];
  const m = oscMessage($("#os-addr").value.trim(), args);
  if(!m){ $("#os-out").innerHTML = '<span class="err">An OSC address has to start with a slash.</span>'; $("#os-hex").textContent = ""; return; }
  /* Single quotes around any string that contains an HTML attribute. This is
     the third time a double-quoted one has killed the page script. */
  $("#os-out").innerHTML = '<b>' + m.length + '</b> bytes &middot; type tags <span class="mono">' + m.typeTags
    + '</span> &middot; <span class="dim">' + m.transport + '</span>';
  $("#os-hex").innerHTML = bytesBlock(m.hex, "the message, on the wire");
}
["#os-addr","#os-args"].forEach(id => $(id).addEventListener("input", osRender));

function pjRender(){
  const p = pjlinkCommand($("#pj-cmd").value, $("#pj-param").value.trim() || "?", {
    challenge: $("#pj-chal").value.trim() || null,
    password: $("#pj-pass").value || null,
  });
  if(!p){ $("#pj-out").innerHTML = '<span class="err">Check the command, the parameter, and that the challenge is eight hex digits.</span>'; return; }
  let html = "<b>" + p.label + "</b> " + (p.isQuery ? "query" : "set")
    /* Doubled escapes: this string is inside a template literal, so a single
       backslash-r would become a real carriage return in the emitted page and
       leave the regex literal unterminated. */
    + ' &middot; <span class="mono">' + p.line.replace(/\\r/g, '\\\\r') + '</span>';
  if (p.authDigest) html += '<br><span class="dim">digest ' + p.authDigest + " prepended</span>";
  /* The placeholder is written in angle brackets, which innerHTML eats as a
     tag. Escape it or the reader gets "nc 4352" with no host. */
  html += '<br><span class="mono">' + p.netcat.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
  html += '<br><span class="dim">' + p.note + "</span>";
  $("#pj-out").innerHTML = html;
}
["#pj-cmd","#pj-param","#pj-chal","#pj-pass"].forEach(id => $(id).addEventListener("input", pjRender));
$("#pj-cmd").addEventListener("change", pjRender);

function anRender(){
  const kind = $("#an-kind").value;
  if (kind === "poll") {
    const p = artnetPoll();
    $("#an-out").innerHTML = "<b>ArtPoll</b> &middot; " + p.length + " bytes &middot; "
      + p.transport + '<br><span class="dim">' + p.expects + "</span>";
    $("#an-hex").innerHTML = bytesBlock(p.hex, "the whole packet");
    return;
  }
  const slots = $("#an-slots").value.split(",").map(t => parseInt(t.trim(), 10)).filter(n => Number.isInteger(n));
  const a = artnetDmx(Number($("#an-net").value), Number($("#an-sub").value), Number($("#an-uni").value), slots);
  if(!a){ $("#an-out").innerHTML = '<span class="err">Net 0&ndash;127, subnet and universe 0&ndash;15, slot values 0&ndash;255.</span>'; $("#an-hex").textContent = ""; return; }
  $("#an-out").innerHTML = "<b>ArtDmx</b> port address <b>" + a.portAddress + "</b> &middot; "
    + a.slots + " slots sent as " + a.dataLength + " &middot; " + a.length + " bytes &middot; "
    + a.transport + '<br><span class="dim">' + a.note + "</span>";
  $("#an-hex").innerHTML = bytesBlock(a.hex, "18-byte header, then the slots");
}
["#an-kind","#an-net","#an-sub","#an-uni","#an-slots"].forEach(id => $(id).addEventListener("input", anRender));
$("#an-kind").addEventListener("change", anRender);

function saRender(){
  const n = Math.max(0, Math.min(512, Number($("#sa-slots").value) || 0));
  const p = sacnPacket(Number($("#sa-uni").value), new Array(n).fill(0), {
    priority: Number($("#sa-pri").value), sourceName: $("#sa-name").value,
  });
  if(!p){ $("#sa-out").innerHTML = '<span class="err">Universe 1&ndash;63999, priority 0&ndash;200, source name under 64 bytes.</span>'; $("#sa-hex").textContent = ""; return; }
  $("#sa-out").innerHTML = "<b>" + p.length + "</b> bytes &middot; root PDU " + p.rootPduLength
    + ", framing " + p.framingPduLength + ", DMP " + p.dmpPduLength
    + "<br>" + p.transport + '<br><span class="dim">' + p.note + "</span>";
  $("#sa-hex").innerHTML = bytesBlock(p.hex, "root layer, framing layer, DMP layer");
}
["#sa-uni","#sa-pri","#sa-name","#sa-slots"].forEach(id => $(id).addEventListener("input", saRender));

function rpRender(){
  const r = rdmPacket({
    destination: $("#rp-dest").value, source: $("#rp-src").value,
    commandClass: Number($("#rp-cc").value), pid: Number($("#rp-pid").value),
  });
  if(!r){ $("#rp-out").innerHTML = '<span class="err">Both UIDs need to be 48 bits, like 4C55:12345678.</span>'; $("#rp-hex").textContent = ""; return; }
  $("#rp-out").innerHTML = "<b>" + r.commandClass + "</b> " + r.pid
    + " &middot; message length " + r.messageLength + ", checksum 0x" + r.checksumHex
    + " &middot; " + r.length + " bytes total"
    + '<br><span class="dim">' + r.note + "</span>";
  $("#rp-hex").innerHTML = bytesBlock(r.hex, "starts 0xCC, ends with an additive checksum");
}
["#rp-dest","#rp-src","#rp-cc","#rp-pid"].forEach(id => $(id).addEventListener("input", rpRender));
["#rp-cc","#rp-pid"].forEach(id => $(id).addEventListener("change", rpRender));

let mbBytes = null;
function mbRender(){
  const kind = $("#mb-kind").value;
  const isMsc = kind === "msc";
  ["#mb-mscf","#mb-msccmd","#mb-cuef","#mb-listf"].forEach(id => { $(id).hidden = !isMsc });
  $("#mb-mmcf").hidden = isMsc;
  const device = Number($("#mb-dev").value);
  const m = isMsc
    ? mscCommand({ device, format: Number($("#mb-fmt").value), command: Number($("#mb-cmd").value),
        cue: $("#mb-cue").value, list: $("#mb-list").value })
    : mmcCommand(Number($("#mb-mmc").value), { device });
  if(!m){
    $("#mb-out").innerHTML = '<span class="err">' + (isMsc
      ? "A cue number is digits and dots only, and the device ID is 0&ndash;127."
      : "Check the transport command and the device ID.") + "</span>";
    $("#mb-hex").textContent = ""; mbBytes = null; return;
  }
  mbBytes = m.bytes;
  $("#mb-out").innerHTML = "<b>" + m.command + "</b>"
    + (isMsc ? " to " + m.format : "") + " &middot; device " + m.device
    + " &middot; " + m.length + " bytes"
    + '<br><span class="dim">' + m.note + "</span>";
  $("#mb-hex").innerHTML = bytesBlock(m.hex, "system exclusive, F0 to F7");
}
["#mb-kind","#mb-dev","#mb-fmt","#mb-cmd","#mb-cue","#mb-list","#mb-mmc"].forEach(id => $(id).addEventListener("input", mbRender));
["#mb-kind","#mb-fmt","#mb-cmd","#mb-mmc"].forEach(id => $(id).addEventListener("change", mbRender));

/* Populate the selects from the same tables the encoders use, so a name can
   never drift from the byte it stands for. */
(function(){
  const opt = (v, label, sel) => '<option value="' + v + '"' + (sel ? " selected" : "") + ">" + label + "</option>";
  $("#pj-cmd").innerHTML = Object.keys(PJLINK_COMMANDS)
    .map(k => opt(k, k + " — " + PJLINK_COMMANDS[k].label, k === "POWR")).join("");
  $("#rp-cc").innerHTML = Object.keys(RDM_COMMAND_CLASSES)
    .filter(k => Number(k) === 0x20 || Number(k) === 0x30 || Number(k) === 0x10)
    .map(k => opt(k, RDM_COMMAND_CLASSES[k], Number(k) === 0x20)).join("");
  $("#rp-pid").innerHTML = Object.keys(RDM_PIDS)
    .map(k => opt(k, RDM_PIDS[k], Number(k) === 0x0060)).join("");
  $("#mb-mmc").innerHTML = Object.keys(MMC_COMMANDS)
    .map(k => opt(k, MMC_COMMANDS[k], Number(k) === 2)).join("");
  osRender(); pjRender(); anRender(); saRender(); rpRender(); mbRender();
})();

/* ---- and the one that can actually leave the machine ---------------------
   Web MIDI is real output to real hardware, so it asks for permission and it
   asks specifically for system exclusive, which is what both of these are.
   The panel stays hidden where the API does not exist rather than offering
   something that cannot work. */
(function(){
  const panel = document.getElementById("mb-send");
  if (!panel || !navigator.requestMIDIAccess) return;
  panel.hidden = false;
  const sel = document.getElementById("mb-port");
  const status = document.getElementById("mb-status");
  const go = document.getElementById("mb-go");
  let access = null;

  function fillPorts(){
    const outs = [...access.outputs.values()];
    sel.innerHTML = outs.length
      ? outs.map(o => '<option value="' + o.id + '">' + (o.name || o.id) + "</option>").join("")
      : '<option value="">no MIDI outputs found</option>';
    status.textContent = outs.length ? outs.length + " output" + (outs.length === 1 ? "" : "s") : "connect an interface";
  }

  go.addEventListener("click", async function(){
    if (!mbBytes) { status.textContent = "nothing to send"; return; }
    try {
      if (!access) {
        status.textContent = "asking permission…";
        access = await navigator.requestMIDIAccess({ sysex: true });
        access.onstatechange = fillPorts;
        fillPorts();
        if (![...access.outputs.values()].length) return;
      }
      const port = access.outputs.get(sel.value);
      if (!port) { status.textContent = "pick an output"; return; }
      port.send(mbBytes);
      status.textContent = "sent " + mbBytes.length + " bytes to " + (port.name || port.id);
    } catch (err) {
      /* Denied permission, an insecure context, or a browser without sysex.
         Say which rather than failing silently. */
      status.textContent = String(err && err.name === "SecurityError"
        ? "permission denied — MIDI needs HTTPS and your consent"
        : "unavailable here: " + (err && err.message ? err.message : err));
    }
  });
})();

/* ---- offline ------------------------------------------------------------
   The panel only appears once a controller is actually running. Until then
   the site would be promising something it cannot do, and this is a site
   whose whole pitch is not doing that. */
(function(){
  var box=document.getElementById('offline');
  if(!box||!('serviceWorker' in navigator))return;
  var state=document.getElementById('off-state');
  var LEARN_URLS=${JSON.stringify(['/learn/', ...LEARN_TOPICS.map((t) => `/learn/${t.slug}/`), '/learn/experience/'])};
  var INDEX_URLS=['/search/','/showstack.json'];

  function show(on){
    box.hidden=!on;
    if(on){state.textContent='ready — this site works with no signal';state.setAttribute('data-on','')}
  }
  navigator.serviceWorker.ready.then(function(){show(true)}).catch(function(){});
  if(navigator.serviceWorker.controller)show(true);

  function saver(btn,urls,label){
    if(!btn)return;
    btn.addEventListener('click',function(){
      if(!navigator.serviceWorker.controller){
        btn.textContent='reload first, then try again'; return;
      }
      btn.disabled=true;
      var orig=label;
      navigator.serviceWorker.controller.postMessage({type:'cache-urls',urls:urls});
      var handler=function(e){
        if(!e.data)return;
        if(e.data.type==='cache-progress'){
          btn.textContent=orig+' — '+e.data.done+'/'+e.data.total;
        } else if(e.data.type==='cache-done'){
          btn.textContent='saved for offline';
          btn.setAttribute('data-done','');
          navigator.serviceWorker.removeEventListener('message',handler);
        }
      };
      navigator.serviceWorker.addEventListener('message',handler);
    });
  }
  saver(document.getElementById('off-learn'),LEARN_URLS,'Saving explainers');
  saver(document.getElementById('off-index'),INDEX_URLS,'Saving index');

  /* Say so plainly when the network has gone, rather than letting a stale
     page look live. */
  function net(){
    if(navigator.onLine)return;
    state.textContent='no network — you are reading saved copies';
    state.removeAttribute('data-on');
    box.hidden=false;
  }
  window.addEventListener('offline',net);
  window.addEventListener('online',function(){
    state.textContent='ready — this site works with no signal';
    state.setAttribute('data-on','');
  });
  net();
})();

/* ---- the ask ------------------------------------------------------------
   Shown once, after somebody has actually copied a result - which is the
   moment the page has demonstrably been useful, rather than the moment they
   arrived. Dismissing it is permanent, and it never becomes a modal. */
(function(){
  var KEY='ss-ask';
  function seen(){try{return localStorage.getItem(KEY)}catch(e){return '1'}}
  function mark(v){try{localStorage.setItem(KEY,v)}catch(e){}}
  if(seen())return;
  var used=0;
  function offer(tool){
    if(seen())return;
    mark('shown');
    var box=document.createElement('div');
    box.className='ask';
    box.innerHTML='<p>That answer took somebody a while to get right, and there is no ad or account paying for it. '
      +'If it saved you time tonight, you can keep it going.</p>'
      +'<a href="${SPONSOR}" rel="noopener">'
      +'<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" fill="currentColor">'
      +'<path d="M4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.6 20.6 0 0 0 8 13.393a20.6 20.6 0 0 0 3.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.75.75 0 0 1-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5Z"/>'
      +'</svg>Sponsor</a>'
      +'<button type="button">not now</button>';
    box.querySelector('button').addEventListener('click',function(){ mark('dismissed'); box.remove() });
    tool.appendChild(box);
  }
  document.addEventListener('click',function(e){
    var btn=e.target.closest('.tcopy');
    if(!btn)return;
    used++;
    /* Two results copied, not one: once could be curiosity, twice is use. */
    if(used>=2){
      var tool=btn.closest('.tool');
      if(tool)setTimeout(function(){offer(tool)},900);
    }
  });
})();
`

  return shell({
    title: 'Field tools — subnet, DMX unit loads, bridle angle, voltage drop, noise dose, RF intermod, delay and timecode | showstack',
    description: 'The calculators technicians use daily: bridle angle, voltage drop, three-phase balance, noise dose, RF intermod, DMX address, DIP switches, speaker delay and mixed impedance, timecode, relay logic, dBu/dBV and SPL weighting reference, power load, Ohm’s law, latency budget, beam photometrics, LED wall, projector throw and screen brightness, RF wavelength. Free, offline, tested arithmetic.',
    canonical: `${SITE}/tools/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'showstack field tools',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      url: `${SITE}/tools/`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
      featureList: 'subnet calculator, DMX unit-load line budget, SPL over distance, bridle angle and leg tension explainer, cable voltage drop calculator, three-phase load balance and neutral current calculator, noise exposure dose calculator, third-order intermodulation checker, DMX address calculator, sACN multicast calculator, Art-Net port-address, DIP switch calculator, speaker delay calculator, drop-frame timecode converter, relay logic truth table, dBu/dBV line-level converter, SPL weighting (dBA/dBZ) reference, impedance vs resistance reference, power load calculator, Ohm law calculator, mixed series parallel speaker impedance calculator, latency budget calculator, beam angle and photometrics calculator, LED wall resolution calculator, projector throw ratio calculator, screen brightness foot-lambert calculator, RF wavelength calculator',
    },
    body,
    extraStyle: style,
    extraScript: script,
  })
}
