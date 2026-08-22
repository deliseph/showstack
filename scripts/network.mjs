/**
 * /network/ - the converged-network planner.
 *
 * The question it answers is the one that sinks real installs: several
 * protocols share one switch fabric, each with its own idea of priority,
 * and the failure only shows up under load. Pick what runs on the network
 * and the page shows the queue plan, names the conflicts, and adds up the
 * bandwidth against real link sizes.
 *
 * All facts come from NETDATA in netmath.mjs, each with its source, and the
 * logic is the same tested code embedded verbatim (functions take the data
 * as an argument so toString() embedding stays self-contained).
 */
import { NETDATA, qosPlan, linkFill } from './netmath.mjs'

const MATH_SRC = [qosPlan, linkFill].map((f) => f.toString()).join('\n\n')

export function networkPage({ esc, shell, jsonForScript, SITE, GH, graphJSON }) {
  const style = `
.tool{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin-bottom:22px}
.tool h3{margin-top:0}
.protopick{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.protopick label{display:inline-flex;gap:7px;align-items:center;font-family:var(--mono);font-size:13px;color:var(--dim);
background:var(--panel2);border:1px solid var(--line);border-radius:9px;padding:9px 12px;cursor:pointer;min-height:40px}
.protopick label:has(input:checked){color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,transparent)}
.queue{border:1px solid var(--line);border-radius:9px;margin-bottom:8px;overflow:hidden}
.queue .qh{font-family:var(--mono);font-size:11.5px;text-transform:uppercase;letter-spacing:.5px;padding:7px 12px;
color:var(--dimmer);background:var(--panel2);border-bottom:1px solid var(--line)}
.queue .qb{padding:9px 12px;font-size:14px;color:var(--dim)}
.queue .qb b{color:var(--ink)}
.queue .dscp{font-family:var(--mono);color:var(--accent2);font-size:12.5px}
.conflict{background:color-mix(in srgb,var(--warn) 10%,transparent);border:1px solid color-mix(in srgb,var(--warn) 45%,transparent);
border-radius:9px;padding:12px 15px;margin:10px 0;color:var(--ink);font-size:14.5px}
.conflict b{color:var(--warn)}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin-bottom:10px}
.field{display:flex;flex-direction:column;gap:4px}
.field label{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--dimmer)}
.field input{padding:9px 11px;background:var(--panel2);color:var(--ink);border:1px solid var(--line);
border-radius:7px;font-family:var(--mono);font-size:15px;min-height:42px;width:96px}
.out{font-family:var(--mono);font-size:15px;color:var(--ink);background:var(--panel2);border:1px solid var(--line);
border-radius:7px;padding:10px 13px;margin-top:6px;overflow-x:auto}
.out b{color:var(--accent2)}
.linkbars{margin-top:10px;display:grid;gap:8px}
.lbar{position:relative;height:30px;background:var(--panel2);border:1px solid var(--line);border-radius:7px;overflow:hidden}
.lbar .fill{position:absolute;left:0;top:0;bottom:0;transition:width .25s}
.lbar .cap{position:absolute;right:9px;top:6px;font-family:var(--mono);font-size:12px;color:var(--dimmer)}
.lbar .pc{position:absolute;left:9px;top:6px;font-family:var(--mono);font-size:12px;color:var(--ink)}
.note{font-size:13.5px;color:var(--dimmer);margin-top:8px}
.note a{color:var(--accent)}
.gotcha{background:var(--panel);border-left:2px solid var(--accent2);padding:11px 15px;margin-bottom:9px;
border-radius:0 7px 7px 0;color:var(--dim);font-size:14.5px}
.gotcha b{color:var(--ink)}
`

  const picks = Object.entries(NETDATA.protocols).map(([id, p]) =>
    `<label><input type="checkbox" data-p="${esc(id)}"${['dante', 'qlan'].includes(id) ? ' checked' : ''}> ${esc(p.name)}</label>`
  ).join('')

  const bwInputs = Object.entries(NETDATA.bandwidth).map(([key, b]) =>
    `<div class="field"><label for="bw-${esc(key)}" title="${esc(b.label)}">${esc(b.label)}</label>
     <input id="bw-${esc(key)}" data-bw="${esc(key)}" type="number" min="0" value="0" inputmode="numeric"></div>`
  ).join('')

  const body = `
<div class="crumb"><a href="/">showstack</a> / network</div>
<h2>Converged network planner</h2>
<p class="lede">Several protocols on one switch fabric, each with its own idea of priority. Tick what runs on your network: the plan below shows which queue each traffic class belongs in, names the collisions before they cost you a show, and adds the bandwidth up against real link sizes. Every value carries its source.</p>

<div class="tool" id="qos">
  <h3>QoS priority plan</h3>
  <div class="protopick" id="picks">${picks}</div>
  <div id="conflicts" role="status" aria-live="polite"></div>
  <div id="queues"></div>
  <p class="note">Queue shape assumes a managed switch with four egress queues and strict priority on the top one, which is how AV-preset switches (Netgear M4250 AV profiles, Luminex GigaCore presets) ship. DSCP sources: <a href="https://support.getdante.com/hc/en-gb/articles/5508296234399" rel="noopener nofollow">Audinate</a>, <a href="https://support.qsys.com/en_US/awareness/awareness-%7C-quality-of-service-settings-across-qlan-dante-and-aes67" rel="noopener nofollow">Q-SYS</a>.</p>
</div>

<div class="tool" id="fill">
  <h3>Will it fit the link?</h3>
  <div class="row">${bwInputs}</div>
  <div class="out" id="fill-out" role="status" aria-live="polite"></div>
  <div class="linkbars" id="fill-bars"></div>
  <p class="note">Planning ceiling is 75% sustained: the rest is burst headroom, and NDI in particular is all bursts. Figures: Dante flows per <a href="https://www.glensound.co.uk/assets/library/5ddff2e74d5e7-Dante%20bandwidth.pdf" rel="noopener nofollow">Glensound's Dante note</a> (a flow carries 4 channels and costs the same even part-filled), sACN worst case with <a href="https://support.etcconnect.com/ETC/Getting_Started_with_ETC_and_FAQ/sACN_Bandwidth_Utilization" rel="noopener nofollow">ETC's measured typical</a> far lower, NDI per <a href="https://docs.ndi.video/all/getting-started/white-paper/bandwidth" rel="noopener nofollow">the NDI white paper</a>, Q-LAN per <a href="https://q-syshelp.qsc.com/q-sys_7.0/content/Appendix/q_dn_qlan_notes.pdf" rel="noopener nofollow">QSC's Q-LAN notes</a>.</p>
</div>

<div class="tool" id="why">
  <h3>Why converged networks fall over</h3>
  <div class="gotcha"><b>Clock starvation.</b> PTP is tiny but timing-critical. If heavy media shares its queue (the Dante-audio vs Q-LAN-clock collision above), clock packets arrive late, devices drift, and audio pops or mutes "randomly" under load. Strict-priority the clock queue and keep it clean.</div>
  <div class="gotcha"><b>Multicast flooding.</b> sACN and Dante multicast need IGMP snooping with an active querier. Without one, every multicast packet hits every port, and the moment universes or flows scale up the whole switch chokes. One querier per VLAN, snooping on, per <a href="https://www.getdante.com/wp-content/uploads/2025/05/Information-for-Network-Admins-v5.pdf" rel="noopener nofollow">Audinate's network admin guide</a>.</div>
  <div class="gotcha"><b>Energy Efficient Ethernet.</b> EEE (802.3az, "green Ethernet") powers the link down between packets and adds wake latency that wrecks PTP. Audinate and QSC both say the same thing: turn it off on AV ports.</div>
  <div class="gotcha"><b>Microbursts.</b> NDI and file traffic arrive as bursts that fill shallow switch buffers even when average load looks fine. That is why the plan above puts them in best effort with bandwidth headroom instead of priority.</div>
  <div class="gotcha"><b>AVB is different on purpose.</b> Milan/AVB does not trust DSCP at all: the switch reserves bandwidth per stream (SRP), which is why every switch in an AVB path must support it, and why a Milan rig will not cross a non-AVB core.</div>
  <p class="note">Deeper reading lives on the protocol pages: <a href="/protocols/dante/">Dante</a>, <a href="/protocols/q-lan/">Q-LAN</a>, <a href="/protocols/aes67/">AES67</a>, <a href="/protocols/avb-milan/">AVB/Milan</a>, <a href="/protocols/sacn/">sACN</a>, <a href="/protocols/ptp-1588/">PTP</a>. Capture and check with the <a href="/software/wireshark/">monitoring tools in the index</a>.</p>
</div>

<div class="cta"><strong>Running a stack this page gets wrong?</strong>
<p><a href="${GH}/issues/new?labels=data&amp;title=network%3A+">Say so</a> - every DSCP value and bandwidth figure here is data with a source, and correcting one fixes the planner for everyone.</p></div>
`

  const script = `
const NET = ${jsonForScript(NETDATA)};

${MATH_SRC}

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function renderQos() {
  const selected = [...document.querySelectorAll('#picks input:checked')].map(i => i.dataset.p);
  const plan = qosPlan(NET, selected);
  $("#conflicts").innerHTML = plan.conflicts.map(c =>
    '<div class="conflict"><b>Collision on DSCP ' + c.dscp + ':</b> ' + esc(c.text) + '</div>').join('') +
    (plan.avb ? '<div class="conflict" style="border-color:var(--line);background:var(--panel2)"><b style="color:var(--accent)">AVB/Milan selected:</b> it reserves bandwidth in the switch instead of using DSCP, so every switch in its path must be AVB-capable. Keep it on dedicated ports or AVB-aware hardware.</div>' : '');
  $("#queues").innerHTML = plan.queues.map(q =>
    '<div class="queue"><div class="qh">' + esc(q.name) + '</div><div class="qb">' +
    (q.holds.length ? q.holds.map(r =>
      '<div><b>' + esc(r.protocol) + '</b> - ' + esc(r.label) +
      (r.dscp !== null ? ' <span class="dscp">DSCP ' + r.dscp + ' (' + esc(r.dscpName) + ')</span>' : ' <span class="dscp">' + esc(r.dscpName) + '</span>') +
      '</div>').join('') : '<span style="color:var(--dimmer)">nothing selected lands here</span>') +
    '</div></div>').join('');
}

function renderFill() {
  const counts = {};
  for (const i of document.querySelectorAll('[data-bw]')) counts[i.dataset.bw] = i.value;
  const f = linkFill(NET, counts);
  $("#fill-out").innerHTML = f.totalMbps > 0
    ? 'Total <b>' + f.totalMbps + ' Mbps</b> sustained - ' +
      f.breakdown.map(b => b.qty + 'x ' + esc(b.label) + ' = ' + b.mbps + ' Mbps').join(' · ')
    : 'Enter counts above to size the link.';
  const bar = (name, v) => {
    const w = Math.min(100, v.pct);
    const col = v.ok ? 'var(--ok)' : (v.tight ? 'var(--accent2)' : 'var(--warn)');
    return '<div class="lbar"><div class="fill" style="width:' + w + '%;background:' + col + ';opacity:.75"></div>' +
      '<span class="pc">' + name + ': ' + v.pct + '%' + (v.ok ? '' : (v.tight ? ' - no burst headroom' : ' - does not fit')) + '</span>' +
      '<span class="cap">' + (v.cap >= 1000 ? (v.cap / 1000) + ' Gbps' : v.cap + ' Mbps') + '</span></div>';
  };
  $("#fill-bars").innerHTML = f.totalMbps > 0
    ? bar('100M', f.links.m100) + bar('1G', f.links.g1) + bar('10G', f.links.g10) : '';
}

$("#picks").addEventListener("change", renderQos);
for (const i of document.querySelectorAll('[data-bw]')) i.addEventListener("input", renderFill);
renderQos();
renderFill();
`

  return shell({
    title: 'Converged AV network planner - QoS, DSCP and bandwidth | showstack',
    description: 'Plan Dante, Q-LAN, AES67, AVB, sACN, Art-Net and NDI on one network: which DSCP goes in which queue, where the priority collisions are, and whether it all fits a gigabit link. Every value sourced.',
    canonical: `${SITE}/network/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'showstack network planner',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      url: `${SITE}/network/`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
      featureList: 'QoS DSCP queue planner, priority conflict detection, Dante Q-LAN AES67 AVB coexistence, bandwidth link-fill calculator',
    },
    body,
    extraStyle: style,
    extraScript: script,
    heroGraph: graphJSON,
  })
}
