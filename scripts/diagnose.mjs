/**
 * /diagnose/ — six failures, and the discipline of finding them in order.
 *
 * /check/ catches the arithmetic mistakes BEFORE the show. This is the other
 * half: something is already wrong, the room is filling, and the only thing
 * that saves you is working bottom-up instead of guessing.
 *
 * Borrowed from the way this is taught rather than invented here: the thing
 * being trained is the ORDER you investigate in, not the answer. Naming the
 * fault after six wasted steps and forty minutes is not a pass. So the page
 * reports on how you worked, every step costs something, and the steps that
 * waste your time are in the list precisely because they are the ones people
 * reach for first.
 *
 * WHAT THIS DELIBERATELY IS NOT.
 *
 * There is no score, no streak, no badge, and nothing is stored. The site's
 * position on that is settled: the moment a drill is marked, people stop
 * taking risks on it, and taking risks is how you find out that reinstalling
 * the software first is a bad instinct. The feedback is a sentence about your
 * method, which is the only output worth having.
 *
 * GROUNDING.
 *
 * Every scenario is a documented failure mode from an entry in the index, and
 * links back to it. Nothing here is a puzzle invented to be clever — if it is
 * not something that has actually taken a show down, it does not belong.
 */

/**
 * Layers, in the order you should touch them. The number is what the feedback
 * reasons about, so it is the diagnostic order rather than the OSI numbering:
 * OSI has no layer for "the application is misconfigured", and that is where
 * the wasted forty minutes usually goes.
 */
const LAYERS = {
  1: 'Physical',
  2: 'Addressing',
  3: 'Reachability',
  4: 'Protocol',
  5: 'Software',
}

export const SCENARIOS = [
  {
    id: 'dup-ip',
    title: 'Two nodes, both flickering',
    flow: 'control',
    brief: 'Two Art-Net nodes on the same switch. Lighting output is intermittent on both. Unplug either one and the other is perfect. Nobody changed anything today — except that a spare node came out of the store this morning to replace one that got damaged.',
    answer: 'duplicate-ip',
    steps: [
      { id: 'link', layer: 1, label: 'Check the link lights on both node ports', result: 'Both solid, both at 100 Mbit. No flapping.', useful: true },
      { id: 'swap', layer: 1, label: 'Swap the two patch leads over', result: 'No change at all. The fault stays with the nodes, not the cables.', useful: true },
      { id: 'ping', layer: 3, label: 'Ping each node from the console', result: 'Both answer — but the replies are erratic and some time out.', useful: true },
      { id: 'ip', layer: 2, label: 'Read the IP address configured on each node', result: 'Both are set to 2.0.0.21.', useful: true, reveals: true },
      { id: 'arp', layer: 2, label: 'Run arp -a on the console', result: 'One IP address, and the MAC behind it keeps changing.', useful: true, reveals: true },
      { id: 'universe', layer: 4, label: 'Check the universe numbers', result: 'Universes 1 and 2, as patched. Correct.', useful: false },
      { id: 'reinstall', layer: 5, label: 'Reinstall the console software', result: 'Forty minutes. Nothing changed.', useful: false },
      { id: 'firmware', layer: 5, label: 'Update the node firmware', result: 'Both reboot, and the fault comes straight back.', useful: false },
    ],
    options: [
      { id: 'duplicate-ip', label: 'Both nodes are on the same IP address' },
      { id: 'bad-cable', label: 'A damaged patch lead' },
      { id: 'wrong-universe', label: 'Wrong universe patched' },
      { id: 'switch-port', label: 'A failing switch port' },
    ],
    explain: 'This is the signature of a duplicate address, and it is unmistakable once you have seen it: intermittent, <em>both</em> devices affected, and each one perfect when the other is unplugged. The spare came out of the store carrying the address of the node it replaced. It is the hardest fault for somebody new to name and the easiest to fix once named — and the only tool that finds it directly is <span class="mono">arp -a</span>, at layer 2, which is why the layer you start at matters.',
    links: [['/protocols/art-net/', 'Art-Net'], ['/tools/#addrkind', 'Check an address'], ['/field/', 'The field card']],
  },
  {
    id: 'igmp',
    title: 'It was perfect at two o’clock',
    flow: 'media',
    brief: 'A Dante system was checked at 14:00 and was flawless. At 19:15, a quarter of an hour into the show, audio from the stage boxes drops out completely. The lighting network, on its own switch, is untouched. The audio switch is a new managed model, installed last week.',
    answer: 'igmp-no-querier',
    steps: [
      { id: 'link', layer: 1, label: 'Check link lights across the audio switch', result: 'All solid. No errors on any port.', useful: true },
      { id: 'ping', layer: 3, label: 'Ping the stage boxes', result: 'All answer, promptly and consistently.', useful: true },
      { id: 'groups', layer: 4, label: 'Check which multicast groups the switch thinks are joined', result: 'The membership table is empty. It had entries this afternoon.', useful: true, reveals: true },
      { id: 'querier', layer: 4, label: 'Check whether anything on this VLAN is acting as IGMP querier', result: 'Nothing is. Snooping is enabled; there is no querier.', useful: true, reveals: true },
      { id: 'clock', layer: 4, label: 'Check the PTP master and clock status', result: 'One master, everything locked, no history of a change.', useful: false },
      { id: 'reboot', layer: 5, label: 'Reboot the audio switch', result: 'Everything works again — for about five minutes.', useful: false },
      { id: 'cable', layer: 1, label: 'Replace the trunk cable to the stage', result: 'Twenty minutes, and no change.', useful: false },
    ],
    options: [
      { id: 'igmp-no-querier', label: 'IGMP snooping is on with no querier, so memberships expired' },
      { id: 'ptp-master', label: 'The PTP grandmaster changed' },
      { id: 'bandwidth', label: 'The link ran out of bandwidth' },
      { id: 'bad-trunk', label: 'A failing trunk cable' },
    ],
    explain: 'Snooping without a querier is a delayed-action fault, which is exactly why it lands mid-show rather than during the check. Snooping learns who wants which multicast group by listening to membership reports; something has to <em>ask</em> for those reports periodically, and that something is the querier. With none, the entries the switch learned at power-on simply age out — typically after a few minutes, sometimes after hours — and the traffic stops being forwarded. The reboot "fixing" it for five minutes is the tell: you are re-learning the memberships, not repairing anything.',
    links: [['/protocols/igmp/', 'IGMP'], ['/protocols/dante/', 'Dante'], ['/network/', 'The network planner']],
  },
  {
    id: 'management',
    title: 'The video stutters, but only sometimes',
    flow: 'management',
    brief: 'An NDI feed to the director’s monitor stutters badly for two or three minutes at a time, then is perfect for an hour. It happened twice in yesterday’s rehearsal and once today. Everything is on one 1 Gbit switch: video, audio, lighting and the production office.',
    answer: 'management-on-show-vlan',
    steps: [
      { id: 'utilisation', layer: 4, label: 'Watch the switch port counters during a stutter', result: 'The uplink is saturated — sitting at 98% for the whole episode.', useful: true, reveals: true },
      { id: 'whose', layer: 4, label: 'Find which port the extra traffic is coming from', result: 'The production office port. A designer is copying content to the media server.', useful: true, reveals: true },
      { id: 'link', layer: 1, label: 'Check link lights and error counters', result: 'All clean. No CRC errors, no flapping.', useful: true },
      { id: 'ndi-settings', layer: 5, label: 'Lower the NDI bitrate', result: 'It stutters less. It still stutters. You have hidden the symptom.', useful: false },
      { id: 'reinstall', layer: 5, label: 'Reinstall the NDI tools on the monitor machine', result: 'Half an hour. It stutters again during the next copy.', useful: false },
      { id: 'swapcable', layer: 1, label: 'Replace the cable to the director’s monitor', result: 'No change.', useful: false },
    ],
    options: [
      { id: 'management-on-show-vlan', label: 'Management traffic is sharing the show VLAN and starving the media' },
      { id: 'ndi-bug', label: 'A fault in the NDI software' },
      { id: 'duplex', label: 'A duplex mismatch on the monitor port' },
      { id: 'multicast-storm', label: 'A multicast storm' },
    ],
    explain: 'This is the Four Flows model earning its keep. A file copy is <strong>management</strong> traffic: it has no deadline of its own, and therefore no manners. TCP will take every bit of bandwidth nobody is actively defending, and the media stream — which does have a deadline — loses. Nothing is broken. The design is broken. The fix is a VLAN or a queue, not a cable, and the reason it is intermittent is simply that nobody copies files continuously.',
    links: [['/learn/network/#flows', 'The Four Flows'], ['/protocols/ndi/', 'NDI'], ['/network/', 'Plan the queues']],
  },
  {
    id: 'two-masters',
    title: 'Audio drifts, then clicks, then settles',
    flow: 'clock',
    brief: 'A Dante network of about thirty devices. Audio develops a slow drift, then a burst of clicks, then goes clean again — every few minutes, unpredictably. It started after a second console was patched in this morning to run monitors.',
    answer: 'clock-fight',
    steps: [
      { id: 'ptp', layer: 4, label: 'Look at the PTP grandmaster on each device', result: 'They do not all agree. The elected master changes back and forth.', useful: true, reveals: true },
      { id: 'prefer', layer: 4, label: 'Check which devices are set as preferred master', result: 'Both consoles are set preferred. Neither will concede.', useful: true, reveals: true },
      { id: 'link', layer: 1, label: 'Check link lights and errors', result: 'All clean.', useful: true },
      { id: 'ping', layer: 3, label: 'Ping across the network', result: 'Everything reachable, times low and steady.', useful: false },
      { id: 'srate', layer: 4, label: 'Check every device is on the same sample rate', result: 'All at 48 kHz. Consistent.', useful: true },
      { id: 'replace', layer: 5, label: 'Swap the new console for a different unit', result: 'A whole get-out’s worth of work, and the same fault returns.', useful: false },
    ],
    options: [
      { id: 'clock-fight', label: 'Two devices are both configured to be clock master' },
      { id: 'sample-rate', label: 'A sample-rate mismatch' },
      { id: 'faulty-console', label: 'The new console is faulty' },
      { id: 'cable-length', label: 'The cable run is too long' },
    ],
    explain: 'Clock is the flow whose entire value is regularity, so two devices arguing about who owns it produces a fault that comes and goes with the argument. Each re-election shifts the reference slightly; the devices resynchronise; you hear that as drift and then clicks. Nothing is faulty. The clue is in the timing — it started when a second candidate arrived — and the model tells you where to look before the symptom does, because "intermittent audio" points at a dozen things and "clock" points at one.',
    links: [['/protocols/ptp-1588/', 'PTP'], ['/protocols/dante/', 'Dante'], ['/learn/timecode/', 'Clock and timecode']],
  },
  {
    id: 'dmx-line',
    title: 'The last six fixtures flicker',
    flow: 'control',
    brief: 'One DMX run, 48 fixtures on it. The first forty behave perfectly. The last six flicker and occasionally jump to full. It was fine in the shop. It has been fine for the first two days of the fit-up, and today the building is noticeably warmer.',
    answer: 'line-over-budget',
    steps: [
      { id: 'term', layer: 1, label: 'Check for a terminator at the end of the line', result: 'There is not one. There never was.', useful: true, reveals: true },
      { id: 'count', layer: 1, label: 'Count the unit loads on the line', result: '48 fixtures. Several are older units at a full unit load each — well over 32.', useful: true, reveals: true },
      { id: 'swaplast', layer: 1, label: 'Swap the last fixture for a known-good one', result: 'It flickers too. The fault belongs to the position, not the fixture.', useful: true },
      { id: 'addr', layer: 2, label: 'Check the addresses of the last six', result: 'All correct and all distinct.', useful: true },
      { id: 'console', layer: 5, label: 'Reboot the console', result: 'No change.', useful: false },
      { id: 'newdesk', layer: 5, label: 'Try a different console', result: 'Identical behaviour. An hour gone.', useful: false },
    ],
    options: [
      { id: 'line-over-budget', label: 'The line is over its unit-load budget and unterminated' },
      { id: 'bad-fixtures', label: 'Six faulty fixtures' },
      { id: 'address-clash', label: 'Overlapping DMX addresses' },
      { id: 'console-fault', label: 'A failing console DMX output' },
    ],
    explain: 'RS-485 allows 32 unit loads on one line, and that is an <em>electrical</em> limit rather than a DMX one — which is why a line well over budget works on the bench, works in a cool room, and fails at the far end when the building warms up and the run is long. The missing terminator is the other half: reflections corrupt the signal most at the end furthest from the source, which is exactly where the flicker is. Neither fault produces a clean failure; both produce this.',
    links: [['/tools/#dmxload', 'Unit-load calculator'], ['/protocols/dmx512/', 'DMX512'], ['/learn/dmx/', 'How DMX actually works']],
  },
  {
    id: 'poe-shed',
    title: 'Four cameras, and only three come up',
    flow: 'management',
    brief: 'Sixteen PoE devices on one 24-port switch: twelve ceiling access points and four PTZ cameras. Everything was tested a pair at a time and worked. Powered up together for the first time this morning, three cameras come up and the fourth stays dark. Move it to a different port and a different one goes dark.',
    answer: 'switch-budget',
    steps: [
      { id: 'budget', layer: 1, label: 'Read the switch’s total PoE budget and current draw', result: 'Budget 370 W. Demand with everything connected is well over it.', useful: true, reveals: true },
      { id: 'class', layer: 1, label: 'Check what class each device negotiates', result: 'The APs are Type 2, the cameras Type 3. Individually all within their port limits.', useful: true, reveals: true },
      { id: 'swapport', layer: 1, label: 'Move the dark camera to another port', result: 'It comes up, and a different device goes dark instead.', useful: true },
      { id: 'cable', layer: 1, label: 'Replace the camera’s cable', result: 'No change, on any port.', useful: false },
      { id: 'firmware', layer: 5, label: 'Update the camera firmware', result: 'It powers from a bench injector fine, so it updates fine. Back on the switch, same problem.', useful: false },
      { id: 'vlan', layer: 4, label: 'Check the VLAN configuration on the dark port', result: 'Identical to the working ports.', useful: false },
    ],
    options: [
      { id: 'switch-budget', label: 'The switch is out of total PoE budget and shedding ports' },
      { id: 'faulty-port', label: 'A faulty switch port' },
      { id: 'camera-fault', label: 'A faulty camera' },
      { id: 'cable-length', label: 'That run is too long for PoE' },
    ],
    explain: 'The per-port maximum and the whole-switch budget are separate limits, and passing one says nothing about the other. Every device here is legal on its own port; together they exceed what the switch’s supply can deliver, so it sheds ports by priority. The moving fault is the signature: swap the port and the shortfall simply lands somewhere else. The real question is not whether it copes but <em>which</em> devices you have decided may fail — and if nobody decided, the switch decided for you.',
    links: [['/tools/#poesw', 'Switch budget calculator'], ['/tools/#poe', 'PoE cable budget'], ['/protocols/poe/', 'PoE']],
  },
]

export function diagnosePage({ esc, shell, jsonForScript, SITE, GH }) {
  const style = `
.dintro{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 19px;margin-bottom:22px}
.dintro p{margin:0 0 9px;color:var(--dim);font-size:15px;line-height:1.65}
.dintro p:last-child{margin-bottom:0}
.dintro b{color:var(--ink)}
.dpick{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
.dpick button{background:var(--panel2);color:var(--dim);border:1px solid var(--line);border-radius:9px;
padding:0 14px;min-height:44px;font-size:14px;cursor:pointer;font-family:inherit}
.dpick button[aria-pressed=true]{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 50%,transparent);
background:color-mix(in srgb,var(--accent) 8%,var(--panel2))}
.dpick button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.dcard{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px 20px;margin-bottom:18px}
.dcard .dlab{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.7px;
color:var(--dimmer);margin-bottom:7px}
.dcard p{margin:0;color:var(--ink);font-size:15.5px;line-height:1.7}
.dh{margin:26px 0 4px;font-size:16.5px;color:var(--ink)}
.dsub{margin:0 0 12px;color:var(--dimmer);font-size:14px}
.dsteps{display:flex;flex-direction:column;gap:8px}
.dstep{display:flex;gap:11px;align-items:center;width:100%;text-align:left;background:var(--panel2);
color:var(--dim);border:1px solid var(--line);border-radius:9px;padding:11px 14px;min-height:44px;
font-size:14.5px;cursor:pointer;font-family:inherit;line-height:1.5}
.dstep:hover:not(:disabled){border-color:var(--rule-strong);color:var(--ink)}
.dstep:disabled{cursor:default;opacity:.62}
.dstep:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.dlayer{flex:0 0 auto;font-family:var(--mono);font-size:11px;color:var(--dimmer);
border:1px solid var(--line);border-radius:5px;padding:2px 6px}
.dresult{margin:2px 0 4px 30px;padding:9px 13px;border-left:2px solid var(--ok);
background:var(--panel2);border-radius:0 7px 7px 0;font-size:14px;color:var(--dim);line-height:1.6}
.dresult.dud{border-left-color:var(--warn)}
.dresult.dud::after{content:" That step told you nothing.";color:var(--warn)}
.dtally{display:flex;gap:14px;flex-wrap:wrap;margin:14px 0 0;font-family:var(--mono);font-size:12.5px;color:var(--dimmer)}
.dtally b{color:var(--ink);font-weight:600}
.dopts{display:flex;flex-direction:column;gap:8px}
.dopt{width:100%;text-align:left;background:var(--panel2);color:var(--dim);border:1px solid var(--line);
border-radius:9px;padding:12px 15px;min-height:44px;font-size:15px;cursor:pointer;font-family:inherit;line-height:1.5}
.dopt:hover:not(:disabled){border-color:var(--rule-strong);color:var(--ink)}
.dopt:disabled{cursor:default}
.dopt:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.dopt.right{border-color:var(--ok);color:var(--ink);background:color-mix(in srgb,var(--ok) 10%,var(--panel2))}
.dopt.wrong{border-color:var(--fail);color:var(--ink);background:color-mix(in srgb,var(--fail) 10%,var(--panel2))}
.dverdict{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--accent);
border-radius:var(--r-sm);padding:16px 19px;margin-top:18px}
.dverdict h4{margin:0 0 9px;font-size:16px;color:var(--ink)}
.dverdict p{margin:0 0 10px;color:var(--dim);font-size:14.5px;line-height:1.7}
.dverdict p:last-child{margin-bottom:0}
.dverdict .method{padding-top:11px;border-top:1px solid var(--line)}
.dverdict .method b{color:var(--ink)}
.dverdict a{color:var(--accent)}
.dagain{margin-top:14px;display:flex;gap:9px;flex-wrap:wrap}
.dagain button{background:var(--panel2);color:var(--accent);border:1px solid color-mix(in srgb,var(--accent) 40%,transparent);
border-radius:9px;padding:0 16px;min-height:44px;font-size:14.5px;cursor:pointer;font-family:inherit}
.dagain button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (max-width:560px){
  .dresult{margin-left:0}
  .dstep{align-items:flex-start}
}`

  const body = `
<div class="crumb"><a href="/">showstack</a> / diagnose</div>
<h2>Find the fault</h2>
<p class="lede">Six failures that have taken real shows down. Each one is investigated by choosing what to
look at, in the order you choose to look at it &mdash; and that order is the thing being practised, because
naming the fault after forty minutes of guessing is not the same as finding it.</p>

<div class="dintro">
  <p><b>Every step costs you something.</b> Some tell you a great deal. Some tell you nothing at all, and
  those are in the list precisely because they are the ones people reach for first.</p>
  <p><b>Nothing here is scored or stored.</b> There is no streak and no badge. A drill you are being marked
  on is a test, and on a test people stop taking the risks that teach them anything. What you get back is a
  sentence about how you worked, which is the only part worth having.</p>
  <p>Work bottom-up: <b>physical, addressing, reachability, protocol, software</b>. The link light is thirty
  seconds and rules out the largest fault family there is. Reinstalling the software is forty minutes and
  rules out almost nothing. <a href="/field/">The field card</a> has the commands.</p>
</div>

<div class="dpick" id="dpick" role="group" aria-label="Choose a scenario"></div>
<div id="dstage"></div>

<div class="cta"><strong>A failure that cost you an evening?</strong>
<p>If it has a signature &mdash; something that distinguishes it from the four things it looks like &mdash; it
belongs here. <a href="${GH}/issues/new?labels=content&amp;title=diagnose%3A+">Describe it</a>, including
the steps that wasted your time, because those are the half that makes a scenario teach anything.</p></div>`

  // The scenario data goes to the page as JSON rather than being baked into
  // markup: the page rebuilds the whole stage on every click, and templating
  // six scenarios into HTML twice (once here, once in the script) is how the
  // two get to disagree.
  const script = `
const SC = ${jsonForScript(SCENARIOS)};
const LAYERS = ${jsonForScript(LAYERS)};
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

let cur = SC[0];
let taken = [];
let done = false;

function pick() {
  $("#dpick").innerHTML = SC.map((s) =>
    '<button type="button" data-sc="' + s.id + '" aria-pressed="' + (s.id === cur.id) + '">' + esc(s.title) + '</button>').join("");
}

function stage() {
  const steps = cur.steps.map((s) => {
    const used = taken.indexOf(s.id) >= 0;
    return '<button type="button" class="dstep" data-step="' + s.id + '"' +
      (used || done ? " disabled" : "") + '>' +
      '<span class="dlayer">' + esc(LAYERS[s.layer]) + '</span>' + esc(s.label) + '</button>' +
      (used ? '<div class="dresult' + (s.useful ? '' : ' dud') + '">' + esc(s.result) + '</div>' : '');
  }).join("");

  const wasted = taken.filter((id) => !cur.steps.find((s) => s.id === id).useful).length;

  $("#dstage").innerHTML =
    '<div class="dcard"><div class="dlab">The symptom</div><p>' + esc(cur.brief) + '</p></div>' +
    '<h3 class="dh">Investigate</h3>' +
    '<p class="dsub">Pick what to look at. Cheapest and lowest first is not a rule of thumb, it is the method.</p>' +
    '<div class="dsteps">' + steps + '</div>' +
    (taken.length ? '<div class="dtally"><span><b>' + taken.length + '</b> step' + (taken.length === 1 ? '' : 's') +
      ' taken</span><span><b>' + wasted + '</b> wasted</span></div>' : '') +
    '<h3 class="dh">Name the fault</h3>' +
    (done ? '' : '<p class="dsub">You can answer at any point. Answering early with the right reasoning is the whole skill.</p>') +
    '<div class="dopts">' + cur.options.map((o) =>
      '<button type="button" class="dopt" data-ans="' + o.id + '"' + (done ? " disabled" : "") + '>' +
      esc(o.label) + '</button>').join("") + '</div>';
}

function answer(id) {
  done = true;
  const right = id === cur.answer;
  const wasted = taken.filter((t) => !cur.steps.find((s) => s.id === t).useful);
  const first = taken.length ? cur.steps.find((s) => s.id === taken[0]).layer : null;
  const revealing = taken.filter((t) => cur.steps.find((s) => s.id === t).reveals).length;
  stage();

  // Mark the options rather than just stating the answer: seeing your own
  // choice sitting next to the right one is the part that sticks.
  const opts = document.querySelectorAll(".dopt");
  for (const b of opts) {
    b.disabled = true;
    if (b.dataset.ans === cur.answer) b.classList.add("right");
    else if (b.dataset.ans === id) b.classList.add("wrong");
  }

  let method;
  if (!taken.length) {
    method = "You answered without looking at anything. On a real fault that is a guess, and a guess that happens to be right teaches you nothing you can use next time.";
  } else if (first >= 5) {
    method = "You started at software. That is the most expensive place to start and it rules out the least — reinstalling first is the forty minutes nobody gets back. The link light is thirty seconds.";
  } else if (first >= 4) {
    method = "You started at the protocol layer. Reasonable once the physical layer is known good, but you had not established that yet, and the physical check is cheaper than anything above it.";
  } else if (first === 1) {
    method = "You started at layer 1, which is right. The link light costs thirty seconds and rules out the largest single family of faults there is.";
  } else {
    method = "You started at " + LAYERS[first].toLowerCase() + ", which is defensible. The physical check is cheaper still, and it is the one that stops you reasoning carefully about a network with a cable half out of it.";
  }

  const names = wasted.map((t) => cur.steps.find((s) => s.id === t).label.toLowerCase()).join("; ");
  const eff = wasted.length === 0
    ? "Nothing wasted. Clean."
    : wasted.length === taken.length
      ? "Every step you took told you nothing (" + names + ")."
      : wasted.length + " of your " + taken.length + " steps told you nothing (" + names + ").";

  const found = revealing === 0
    ? " You never ran the step that would have shown you the fault directly."
    : "";

  const html =
    '<div class="dverdict">' +
    '<h4>' + (right ? "That is the fault." : "Not this one.") + '</h4>' +
    (right ? '' : '<p>It was <b>' + esc(cur.options.find((o) => o.id === cur.answer).label) + '</b>.</p>') +
    '<p>' + cur.explain + '</p>' +
    '<p class="method"><b>How you worked.</b> ' + esc(method) + ' ' + esc(eff) + esc(found) + '</p>' +
    '<p>' + cur.links.map((l) => '<a href="' + l[0] + '">' + esc(l[1]) + ' &rarr;</a>').join(" &middot; ") + '</p>' +
    '<div class="dagain"><button type="button" id="dretry">Try this one again</button>' +
    '<button type="button" id="dnext">Next scenario &rarr;</button></div></div>';
  $("#dstage").insertAdjacentHTML("beforeend", html);
  $("#dretry").focus();
}

function start(id) {
  cur = SC.find((s) => s.id === id) || SC[0];
  taken = [];
  done = false;
  pick();
  stage();
}

document.addEventListener("click", (e) => {
  const p = e.target.closest("[data-sc]");
  if (p) return start(p.dataset.sc);
  const st = e.target.closest("[data-step]");
  if (st && !done) { taken.push(st.dataset.step); return stage(); }
  const a = e.target.closest("[data-ans]");
  if (a && !done) return answer(a.dataset.ans);
  if (e.target.closest("#dretry")) return start(cur.id);
  if (e.target.closest("#dnext")) {
    const i = SC.findIndex((s) => s.id === cur.id);
    return start(SC[(i + 1) % SC.length].id);
  }
});

start(SC[0].id);
`

  return shell({
    title: 'Find the fault — diagnose a show network | showstack',
    description: 'Six real show-network failures, investigated step by step. Scored on the order you look in, not just the answer, because bottom-up diagnosis is the actual skill.',
    canonical: `${SITE}/diagnose/`,
    extraStyle: style,
    extraScript: script,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: 'Find the fault',
      learningResourceType: 'Simulation',
      teaches: 'Bottom-up fault diagnosis on show networks',
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    },
    body,
  })
}
