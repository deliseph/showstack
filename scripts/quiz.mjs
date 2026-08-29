/**
 * Check yourself — a short assessment at the end of each explainer.
 *
 * This is not a test and there is deliberately no score. The design rules the
 * rest of the site follows apply here with more force, because a quiz is
 * exactly where a knowledge site starts gamifying itself: no percentage, no
 * badge, no streak, no "great job". The reward is the same one the peak-end
 * block offers — knowing something you did not know an hour ago.
 *
 * What that means in practice:
 *
 *   - Every option carries an explanation, and the explanation for a WRONG
 *     answer is the most valuable text on the page. A plausible wrong answer
 *     is usually somebody's actual working model, and saying why it fails is
 *     the whole job.
 *   - You can answer again. Nothing is locked, nothing is scored, and there
 *     is no advantage to guessing carefully the first time.
 *   - Questions test the mechanism, not the trivia. "What is the terminator
 *     value" is a lookup; "why does an unterminated rig often work" is the
 *     thing that makes somebody safe on a load-in.
 *
 * State is localStorage on the device, sharing the shape of the read-state
 * key, and it records only which questions have been answered correctly so
 * the hub can say which pages you have checked.
 */

/**
 * The question bank, by explainer slug.
 *
 * Each option's `why` is shown when that option is chosen — for the right
 * answer it confirms the mechanism, for a wrong one it names the
 * misconception. Options are rendered in source order; the correct one is
 * not always last.
 */
const BANK = {
  dmx: [
    {
      q: 'A DMX segment is rated at 32 unit loads. You have 40 fixtures on it and it works. What is the most likely explanation?',
      options: [
        { text: 'The 32 limit is a guideline rather than a rule', why: 'It is a real electrical limit in the standard, not advice. Something else is going on here.' },
        { text: 'The fixtures use quarter-unit-load receivers', correct: true, why: 'Right. A unit load is a property of the receiver chip, not the box. Quarter-unit-load receivers put four fixtures in one unit load, so 40 fixtures can be 10 unit loads.' },
        { text: 'The line is running below its rated data rate', why: 'DMX512 runs at 250 kbit/s regardless. Unit loads are about the electrical load on the driver, not the speed.' },
        { text: 'The fixtures are drawing power from a separate supply', why: 'Mains power has nothing to do with it. A unit load is the DMX receiver&rsquo;s input impedance on the data pair.' },
      ],
    },
    {
      q: 'An unterminated DMX run has worked every night for a year. Then it starts dropping out. What changed?',
      options: [
        { text: 'The terminator finally failed', why: 'There is no terminator — that is the premise. The fault is elsewhere.' },
        { text: 'Nothing about the termination; the signal reflection was always there', correct: true, why: 'Right. An unterminated line always reflects. Whether the reflection corrupts data depends on cable length, fixture count and edge speed — so a longer run, a warmer room or one more fixture tips a line that was already marginal.' },
        { text: 'The console started sending a faster refresh rate', why: 'A higher refresh sends more packets but does not change the reflection behaviour that was already present.' },
        { text: 'DMX universes drift out of sync over time', why: 'There is no drift mechanism in DMX. Each packet is self-contained and starts with a break.' },
      ],
    },
    {
      q: 'You need to feed three positions from one console output. What do you use?',
      options: [
        { text: 'A Y-split cable, which is the standard way to branch DMX', why: 'A Y-split puts an unterminated stub on the line, and a stub reflects. This is the single most common cause of an intermittent DMX fault.' },
        { text: 'An opto-splitter, giving three new segments', correct: true, why: 'Right. Each splitter output is electrically a new segment: its own unit-load budget and its own terminator at the far end.' },
        { text: 'A passive three-way adaptor at the console', why: 'Passive branching is the Y-split problem with extra connectors. It works until it does not.' },
        { text: 'Three consoles, one per position', why: 'It would work, and it is an expensive answer to a problem a splitter solves.' },
      ],
    },
  ],

  network: [
    {
      q: 'A show network has plenty of spare bandwidth and the audio still glitches. Why can QoS still be the answer?',
      options: [
        { text: 'QoS increases the available bandwidth on the link', why: 'It does not add bandwidth. It changes the order things leave in.' },
        { text: 'It decides which packet goes first when two arrive at once', correct: true, why: 'Right. Even a lightly loaded link has microseconds where two packets contend, and on a media network the one that must not wait is the clock.' },
        { text: 'It compresses the audio stream to reduce load', why: 'QoS does not touch payloads. It is a scheduling decision at the switch.' },
        { text: 'It reserves a dedicated physical path for audio', why: 'That is circuit switching. QoS prioritises within a shared path rather than reserving one.' },
      ],
    },
    {
      q: 'sACN was working, then multicast traffic starts appearing and disappearing on a timer. What is the most likely cause?',
      options: [
        { text: 'IGMP snooping is on with no querier on the VLAN', correct: true, why: 'Right. Without a querier, nothing prompts devices to re-report their group membership, so the switch ages out the entries and traffic stops until the next join. It reads as random dropouts.' },
        { text: 'The universe count exceeds what the switch can address', why: 'Switches do not have a universe limit. This is a multicast group management problem.' },
        { text: 'Two devices are using the same universe number', why: 'That produces conflicting levels, not traffic that starts and stops on a timer.' },
        { text: 'IGMP snooping is off, so traffic is flooding', why: 'Flooding sends multicast everywhere — wasteful, but constant. The on-off pattern points at membership ageing out.' },
      ],
    },
  ],

  bits: [
    {
      q: 'Why does a moving light have a coarse and a fine channel for pan?',
      options: [
        { text: 'To let the operator choose between speed and precision', why: 'Both channels are always active. They are two halves of one 16-bit number, not a mode switch.' },
        { text: 'Because 8 bits gives 256 steps across the whole pan range', correct: true, why: 'Right. 256 steps across 540&deg; is about 2&deg; per step, which is visible as a stutter on a slow move. Two channels give 65,536 steps and the movement becomes smooth.' },
        { text: 'Because DMX cannot send values above 255 on any channel', why: 'True, and it is the constraint rather than the reason. The reason is that 256 steps is not enough resolution for the movement to look continuous.' },
        { text: 'For redundancy if one channel is lost', why: 'Losing the coarse channel would move the fixture to a completely different position. There is no redundancy here.' },
      ],
    },
    {
      q: 'What does 32-bit floating point actually buy you over 24-bit fixed point?',
      options: [
        { text: 'Higher resolution at every level', why: 'At any given level, 32-bit float has roughly the same usable resolution as 24-bit fixed. The gain is elsewhere.' },
        { text: 'Enormous headroom, so an overshoot inside the chain is recoverable', correct: true, why: 'Right. Float moves the exponent rather than clipping, so a stage that goes over full scale internally can be pulled back down intact. It is about where the ceiling is, not how fine the steps are.' },
        { text: 'A higher sample rate', why: 'Bit depth and sample rate are independent. Float changes how each sample is stored, not how many there are.' },
        { text: 'Lower noise floor at normal levels', why: 'Marginally, but that is not why anybody uses it. The headroom is the point.' },
      ],
    },
  ],

  encoding: [
    {
      q: 'A live video stream loses a packet. Why is error correction more useful than error detection here?',
      options: [
        { text: 'Correction uses less bandwidth than detection', why: 'The opposite — correction sends redundant data and costs more.' },
        { text: 'Because asking for it again is not an option in time', correct: true, why: 'Right. Detection tells you something is wrong, and the usual remedy is retransmission. On a live stream the retransmitted packet arrives after the moment it was needed, so the data has to carry its own repair.' },
        { text: 'Detection cannot find errors in video payloads', why: 'It finds them perfectly well. The problem is what you can do about it in the time available.' },
        { text: 'Correction is faster to compute than detection', why: 'It is generally slower and more expensive. It is chosen despite that.' },
      ],
    },
    {
      q: 'DMX512 has no line code. How does a receiver know where a packet starts?',
      options: [
        { text: 'A start byte with a unique bit pattern', why: 'The start code exists but comes after the framing. Something has to mark the frame boundary first.' },
        { text: 'A break — the line held low longer than any valid byte', correct: true, why: 'Right. The break is longer than any legal character, so it cannot be mistaken for data. That is the framing, and it is why DMX needs no line code.' },
        { text: 'A clock line running alongside the data', why: 'DMX is two data conductors and a shield. There is no separate clock.' },
        { text: 'Timing from the previous packet', why: 'That would drift, and a receiver joining mid-stream would never sync.' },
      ],
    },
  ],

  colour: [
    {
      q: 'Why is #808080 not half as bright as #ffffff on a normal display?',
      options: [
        { text: 'Because displays are not calibrated accurately', why: 'It happens on a perfectly calibrated display. It is by design.' },
        { text: 'Because code values are gamma-encoded, not linear light', correct: true, why: 'Right. The encoding spends more code values on dark tones where the eye is sensitive. 128 out of 255 lands around 22% of the light, not 50%.' },
        { text: 'Because 128 is not exactly half of 255', why: 'The half-integer is a rounding detail. The factor-of-two discrepancy is the transfer function.' },
        { text: 'Because grey is a mix of three channels rather than one', why: 'Equal channels do give a neutral grey. The non-linearity is in the encoding, not the mixing.' },
      ],
    },
    {
      q: 'You are sending fine coloured text to an LED wall and it looks soft at the edges. Which is the most likely cause?',
      options: [
        { text: 'The wall is being fed 4:2:0 rather than 4:4:4', correct: true, why: 'Right. Subsampling halves colour resolution horizontally and vertically. It is nearly invisible on camera footage and obvious on a sharp coloured edge, which is exactly what graphics and text are.' },
        { text: 'The bit depth is 8 rather than 10', why: 'Low bit depth shows as banding in gradients, not soft edges on text.' },
        { text: 'The colour space is Rec.709 rather than DCI-P3', why: 'A narrower gamut changes which colours are reachable, not how sharp an edge is.' },
        { text: 'The refresh rate is too low', why: 'That shows as flicker or judder on movement, not softness on a static edge.' },
      ],
    },
  ],

  power: [
    {
      q: 'A three-phase rig is perfectly balanced — 32 A on every leg — and the neutral is carrying 38 A. Is this possible?',
      options: [
        { text: 'No, a balanced load always gives zero neutral current', why: 'That holds only for a linear load. Almost nothing on a modern rig is linear.' },
        { text: 'Yes, if the load is non-linear and rich in third harmonic', correct: true, why: 'Right. At three times the fundamental, the 120&deg; phase separation becomes 360&deg; — no separation at all. The triplen harmonics arrive in step on all three legs and add instead of cancelling.' },
        { text: 'Only if one phase is at a different voltage', why: 'A voltage imbalance would show as unequal currents. The premise here is that they are equal.' },
        { text: 'Only if the neutral is shared with another distro', why: 'A shared neutral is a real hazard, but the harmonic mechanism produces this on a single balanced distro.' },
      ],
    },
    {
      q: 'What is the difference between what a circuit breaker protects and what an RCD protects?',
      options: [
        { text: 'They protect the same thing at different sensitivities', why: 'They watch completely different quantities. This is the misunderstanding that gets people hurt.' },
        { text: 'The breaker protects the cable; the RCD protects the person', correct: true, why: 'Right. A breaker watches current against what the cable can carry — tens of amps, because that is what melts insulation. An RCD compares current out against current back and trips at around 30 mA, because that is what a heart will tolerate.' },
        { text: 'The breaker is for overload, the RCD is for short circuits', why: 'Both overload and short circuit are the breaker&rsquo;s job. The RCD is watching for current that never comes back.' },
        { text: 'The RCD is a faster version of the breaker', why: 'It is faster, but speed is not the distinction. It is measuring something else entirely.' },
      ],
    },
  ],

  video: [
    {
      q: 'A source connects direct to a screen and works. Put a switcher in the middle and the picture is black. What is the most likely cause?',
      options: [
        { text: 'The switcher does not have enough bandwidth', why: 'Possible, but it would usually show as sparkle or intermittent loss rather than nothing at all.' },
        { text: 'The switcher presents its own EDID, or breaks the HDCP chain', correct: true, why: 'Right. Testing direct removes every device that was doing the negotiating. The middle box usually presents its own EDID, and HDCP authenticates at every hop — either failure shows as black at the far end.' },
        { text: 'The cable to the switcher is faulty', why: 'Worth checking, but the cable is the one part of the chain with no opinion. Three different negotiation failures all look like this.' },
        { text: 'The screen has gone into standby', why: 'A screen in standby usually says so. A failed handshake gives you nothing.' },
      ],
    },
    {
      q: 'Two projectors edge-blend into one image. The seam tears intermittently. What fixes it?',
      options: [
        { text: 'Matching the frame rate of both sources', why: 'Necessary but not sufficient. Two devices at the same rate still start their frames at different moments.' },
        { text: 'A shared genlock reference so both start frames together', correct: true, why: 'Right. Free-running outputs drift relative to each other. On one screen a late frame start is invisible; across a join it is a tear. Genlock fixes when the frame begins.' },
        { text: 'Reducing the processing latency on both machines', why: 'That fixes lip-sync against live sound. It does not align frame starts.' },
        { text: 'Increasing the overlap region of the blend', why: 'A wider blend hides a geometry mismatch, not a timing one.' },
      ],
    },
  ],

  senses: [
    {
      q: 'What lets you tell that a sound is coming from your left rather than your right?',
      options: [
        { text: 'The sound is louder in the left ear only', why: 'Level difference is part of it, but it works poorly at low frequencies where the head is not much of an obstacle.' },
        { text: 'Mainly a time difference between the ears, up to about 700 µs', correct: true, why: 'Right. The path to the far ear is longer, and below roughly 1.5 kHz the brain reads that phase and timing difference. Level difference takes over higher up, where the head casts an acoustic shadow.' },
        { text: 'The pinna filters the sound differently on each side', why: 'The pinna matters, but mostly for up-down and front-back rather than left-right.' },
        { text: 'Small head movements triangulate the source', why: 'Head movement resolves front-back confusion. Left-right works without moving at all.' },
      ],
    },
    {
      q: 'Why do 3D headsets and 3D cinema cause discomfort that real depth does not?',
      options: [
        { text: 'The frame rate is lower than reality', why: 'Frame rate affects judder rather than the specific fatigue 3D produces.' },
        { text: 'The eyes converge at one distance while focusing at another', correct: true, why: 'Right — the vergence-accommodation conflict. In the real world the two always agree. On a screen the eyes must converge on where the object appears while focusing on the screen surface, and holding that mismatch is tiring.' },
        { text: 'The interocular distance is wrong for most people', why: 'A mismatched interocular distorts scale, which reads as wrongness rather than physical discomfort.' },
        { text: 'The brightness is halved by the glasses', why: 'True of polarised systems, and it makes the image dim rather than uncomfortable.' },
      ],
    },
  ],

  rigging: [
    {
      q: 'Somebody hands you a shackle with no markings. What is its working load limit?',
      options: [
        { text: 'Estimate it from the pin diameter against a standard table', why: 'A table tells you what a compliant shackle of that size should be. It tells you nothing about this one.' },
        { text: 'Unknown, which means it cannot be used', correct: true, why: 'Right. A WLL is a property the manufacturer marks on the item. Unmarked is unusable — not because of a paperwork rule, but because nothing about the object tells you what it will hold.' },
        { text: 'Assume the lowest common rating for that shackle type', why: 'An assumption about a load-bearing component is the thing this discipline exists to prevent.' },
        { text: 'Test it to destruction and derate', why: 'Destructive testing tells you about the one you destroyed, not the one you were about to use.' },
      ],
    },
    {
      q: 'Two legs of a bridle at a wide angle carry the same load as two legs at a narrow angle. True or false?',
      options: [
        { text: 'True — the load is shared equally either way', why: 'The vertical component is shared, but each leg carries more than its share of the vertical as the angle opens.' },
        { text: 'False — a wider angle puts more tension in each leg', correct: true, why: 'Right. As the angle from vertical increases, each leg needs more tension to produce the same upward force. At 120&deg; between legs, each leg carries the full load rather than half of it.' },
        { text: 'False — a wider angle puts less tension in each leg', why: 'It is the other way round. Spreading the legs increases the tension in them.' },
        { text: 'It depends only on the length of the legs', why: 'Length matters because it sets the angle. The angle is what governs the tension.' },
      ],
    },
  ],

  sound: [
    {
      q: 'A hall measures RT60 of 2.2 seconds. What is it well suited to?',
      options: [
        { text: 'Amplified music and dance', why: 'Around 1.0-1.4 s suits amplified work. At 2.2 s the reverberant tail smears rhythm and intelligibility.' },
        { text: 'Unamplified choral and organ music', correct: true, why: 'Right. Choral and organ repertoire is written for long reverberation — the tail is part of the sound, and 2.2-3.0 s is the band it sits in.' },
        { text: 'Spoken drama', why: 'Drama wants roughly 0.8-1.1 s. At 2.2 s consonants get buried in the tail of the syllable before.' },
        { text: 'Conference speech', why: 'Speech intelligibility wants around 0.6-0.9 s. This hall would need heavy treatment or a very directional system.' },
      ],
    },
    {
      q: 'A full audience arrives and the room sounds noticeably drier than in rehearsal. Why?',
      options: [
        { text: 'Body heat changes the speed of sound', why: 'Temperature does change the speed of sound slightly, which affects timing rather than reverberation time.' },
        { text: 'People are absorption, and absorption shortens RT60', correct: true, why: 'Right. RT60 is inversely proportional to total absorption, and a few hundred clothed bodies are a large number of sabins. This is why an empty-room measurement flatters the room.' },
        { text: 'The PA is being turned down for the audience', why: 'The room itself has changed, not the system gain.' },
        { text: 'Humidity from the audience absorbs high frequencies', why: 'Air absorption is real at high frequencies and over long distances, but it is a much smaller effect than the bodies themselves.' },
      ],
    },
  ],

  wireless: [
    {
      q: 'Why can two radio mics on legal, licence-exempt frequencies still interfere with each other?',
      options: [
        { text: 'Because licence-exempt bands have no interference protection', why: 'True and important, but it does not explain interference between two of your own well-chosen frequencies.' },
        { text: 'Because their transmitters mix to produce intermodulation products', correct: true, why: 'Right. Two transmitters combine in a non-linear stage and generate sums and differences of their frequencies. A third-order product can land exactly on a third channel that is itself perfectly legal and clear.' },
        { text: 'Because they share the same antenna distribution', why: 'Shared distribution can contribute, but intermod happens between transmitters regardless.' },
        { text: 'Because the receivers are not diversity models', why: 'Diversity fixes dropouts from multipath, not interference from another carrier.' },
      ],
    },
  ],

  connectivity: [
    {
      q: 'A LoRa sensor runs for years on a coin cell. A radio mic runs for a show on a much bigger battery. What is the main reason?',
      options: [
        { text: 'LoRa transmits at far lower power', why: 'Transmit power differs, but not by the factor of a thousand this life difference implies.' },
        { text: 'Duty cycle — the sensor is asleep almost all the time', correct: true, why: 'Right. A sensor transmitting 300 ms an hour has its transmitter on for about 0.008% of its life. A radio mic sits at 100%. Almost everything else is a second-order effect next to that ratio.' },
        { text: 'LoRa uses a more efficient modulation', why: 'Its modulation does buy sensitivity, which buys range. It does not buy years of standby.' },
        { text: 'Coin cells have a higher energy density', why: 'They have far less energy than a mic pack. They last because almost nothing is drawn from them.' },
      ],
    },
    {
      q: 'A production truck parks in an underground loading dock and its timecode starts drifting. Why?',
      options: [
        { text: 'The concrete attenuates the timecode distribution', why: 'Timecode inside the truck is cable-bound and unaffected by the building.' },
        { text: 'The GNSS receiver has lost sight of the sky, so the clock is free-running', correct: true, why: 'Right. A GNSS receiver is an accurate traceable clock that happens to also know where it is. Lose the satellites and the grandmaster stops being disciplined and starts drifting on its own oscillator.' },
        { text: 'Cellular handover changes the network time source', why: 'Cellular time is not what a broadcast plant disciplines its grandmaster from.' },
        { text: 'Temperature underground changes the oscillator frequency', why: 'It does, slightly, which is exactly why the oscillator needs disciplining from outside.' },
      ],
    },
  ],

  light: [
    {
      q: 'A fixture is quoted with a 15° beam angle and a 30° field angle. What is the difference?',
      options: [
        { text: 'Beam is the lens size, field is the usable output', why: 'Neither is a physical dimension. Both are angles defined by how far the intensity has fallen.' },
        { text: 'Beam is where intensity has fallen to 50%, field to 10%', correct: true, why: 'Right. They are two definitions of "edge" on the same cone. Feed either into the same formula and you get a different diameter — which is why a spec sheet quoting only one number is ambiguous.' },
        { text: 'Beam is with the shutters open, field with them closed', why: 'Shutters cut the beam mechanically. These angles describe the optics before any shuttering.' },
        { text: 'Beam applies to spots, field applies to washes', why: 'Both angles are quoted for both kinds of fixture.' },
      ],
    },
    {
      q: 'Two projectors edge-blend and the overlap still looks like a visible band. The ramp is set correctly. What is most likely wrong?',
      options: [
        { text: 'The blend width is too narrow', why: 'A narrow blend makes the ramp steep, but a correctly set ramp is the premise here.' },
        { text: 'The black levels do not match', correct: true, why: 'Right. A blend hides a seam in brightness. It cannot hide a difference in black level, colour or geometry — and black level is the one that shows most in the dark content a show usually runs.' },
        { text: 'The projectors are different resolutions', why: 'That shows as a sharpness difference across the join rather than a band in the overlap.' },
        { text: 'The gamma curve is wrong on one machine', why: 'Worth checking, and it usually shows across the whole image rather than specifically in the overlap.' },
      ],
    },
  ],

  perception: [
    {
      q: 'An LED fixture is described as "flicker-free at 1000 Hz". Why is that claim incomplete?',
      options: [
        { text: 'Because 1000 Hz is below the flicker fusion threshold', why: 'It is well above it for most viewing conditions. The problem is that there is no single threshold.' },
        { text: 'Because fusion depends on brightness, angle and movement', correct: true, why: 'Right. Fusion is a property of an eye in a condition, not of a light. Peripheral vision, high brightness and anything moving all push the threshold up — which is why a fixture that looks fine head-on strobes in the corner of your eye or on camera.' },
        { text: 'Because cameras always see flicker that eyes do not', why: 'Cameras have their own sampling problem, but the human threshold varies too, which is the point.' },
        { text: 'Because PWM frequency is not the same as refresh rate', why: 'True and worth knowing, but it does not explain why one number can never be the whole answer.' },
      ],
    },
    {
      q: 'Why does the biggest moment in a show only land if the rest of the show is restrained?',
      options: [
        { text: 'Because the audience needs rest before a climax', why: 'Fatigue is real, but the mechanism here is about contrast rather than recovery.' },
        { text: 'Because a violation needs an expectation to violate', correct: true, why: 'Right. Chills need a before. Nothing can be broken that was not first established, so the loudest, brightest, widest moment is only ever as strong as the restraint that preceded it.' },
        { text: 'Because loudness compresses over time', why: 'Auditory adaptation contributes, and it is not the reason a quiet first act makes a finale work.' },
        { text: 'Because attention has a fixed budget per performance', why: 'Attention is finite, but the point here is that surprise is defined relative to what came before.' },
      ],
    },
  ],

  connectors: [
    {
      q: 'A Thunderbolt 2 device will not work on a Mini DisplayPort output, even though the connector fits. Why?',
      options: [
        { text: 'The cable is the wrong specification', why: 'A cable can be the problem, but the connector shape here is hiding a deeper mismatch.' },
        { text: 'The same connector is carrying a different protocol', correct: true, why: 'Right. Mini DisplayPort is a physical shape. Thunderbolt 2 borrowed it and puts PCIe and DisplayPort over it, so a DisplayPort-only port has no idea what a Thunderbolt device is asking for.' },
        { text: 'Thunderbolt needs more power than the port supplies', why: 'Power can matter for bus-powered devices, but the fundamental issue is protocol, not watts.' },
        { text: 'The port is running an older DisplayPort version', why: 'Even the newest DisplayPort port speaks DisplayPort. It does not speak PCIe.' },
      ],
    },
  ],
}

/**
 * Options are written in whatever order made them easiest to write, which in
 * practice put the correct answer second nearly every time. That is a quiz you
 * can pass by pattern rather than by understanding, so the order is rotated
 * deterministically here: same input, same output on every build, but the
 * answer moves around the list.
 *
 * A hash of the slug and question index picks the rotation, so adding a
 * question does not reshuffle the ones around it.
 */
function rotation(slug, index) {
  let h = 0
  const key = `${slug}:${index}`
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return h
}

export const QUIZZES = Object.fromEntries(
  Object.entries(BANK).map(([slug, questions]) => [
    slug,
    questions.map((q, i) => {
      const n = q.options.length
      const by = rotation(slug, i) % n
      const options = q.options.map((_, k) => q.options[(k + by) % n])
      return { ...q, options }
    }),
  ]))

/**
 * The block, appended to an explainer by the same second pass that adds the
 * footer. Renders nothing where a slug has no questions yet, rather than an
 * empty shell.
 */
export function quizBlock(esc, slug) {
  const qs = QUIZZES[slug]
  if (!qs || !qs.length) return ''
  const items = qs.map((item, qi) => {
    const opts = item.options.map((o, oi) => `
      <li>
        <button type="button" class="qopt" data-q="${qi}" data-o="${oi}"
                data-correct="${o.correct ? '1' : '0'}" aria-describedby="qw-${qi}-${oi}">
          <span class="qmark" aria-hidden="true"></span>
          <span class="qtext">${esc(o.text)}</span>
        </button>
        <p class="qwhy" id="qw-${qi}-${oi}" hidden>${o.why}</p>
      </li>`).join('')
    return `
    <li class="qitem" data-qi="${qi}">
      <p class="qq"><span class="qn">${qi + 1}</span>${esc(item.q)}</p>
      <ul class="qopts">${opts}</ul>
    </li>`
  }).join('')

  return `
  <section class="quiz" data-slug="${esc(slug)}">
    <span class="qk">Check yourself</span>
    <p class="qlede">${qs.length} question${qs.length === 1 ? '' : 's'} on the mechanism rather than the trivia.
      Nothing is scored and you can answer again &mdash; the explanation under a wrong answer is the point of it.</p>
    <ol class="qlist">${items}</ol>
    <p class="qnote">Answers are kept in this browser on this device. Nothing is sent anywhere.</p>
  </section>`
}

/** Styles, injected once into the shared stylesheet alongside RELATED_CSS. */
export const QUIZ_CSS = `
.quiz{margin:34px 0 0;padding:24px;border-radius:var(--r-lg);border:1px solid var(--rule);
background:var(--surface-raised)}
.quiz .qk{display:block;font-family:var(--mono);font-size:10.5px;letter-spacing:.8px;text-transform:uppercase;
color:var(--signal);margin-bottom:10px}
.quiz .qlede{margin:0 0 20px;color:var(--ink-muted);font-size:14.5px;line-height:1.6;max-width:64ch}
.qlist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:26px}
.qitem{margin:0}
.qq{margin:0 0 12px;color:var(--ink);font-size:16.5px;line-height:1.5;font-weight:600;
display:flex;gap:11px;align-items:baseline;flex-wrap:wrap}
.qq > span:not(.qn):not(.qdone){flex:1 1 auto}
.qn{flex:0 0 auto;font-family:var(--mono);font-size:11px;color:var(--ink-faint);font-weight:400;
border:1px solid var(--rule);border-radius:var(--r-pill);padding:2px 8px;line-height:1.5}
.qopts{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}
.qopt{display:flex;width:100%;text-align:left;gap:11px;align-items:flex-start;min-height:44px;
padding:11px 14px;border-radius:var(--r-md);border:1px solid var(--rule-strong);
background:var(--surface);color:var(--ink-muted);cursor:pointer;font-family:var(--sans);font-size:15px;
line-height:1.5;transition:border-color var(--dur-fast),background var(--dur-fast),color var(--dur-fast)}
.qopt:hover{border-color:var(--signal);color:var(--ink)}
.qmark{flex:0 0 auto;width:18px;height:18px;margin-top:2px;border-radius:50%;
border:1.5px solid var(--rule-strong);position:relative}
.qopt[data-state="right"]{border-color:var(--verified);color:var(--ink);
background:color-mix(in srgb,var(--verified) 10%,var(--surface))}
.qopt[data-state="right"] .qmark{border-color:var(--verified);background:var(--verified)}
.qopt[data-state="right"] .qmark::after{content:"";position:absolute;left:5px;top:2px;width:5px;height:9px;
border-right:2px solid var(--surface);border-bottom:2px solid var(--surface);transform:rotate(42deg)}
.qopt[data-state="wrong"]{border-color:var(--fail);color:var(--ink);
background:color-mix(in srgb,var(--fail) 9%,var(--surface))}
.qopt[data-state="wrong"] .qmark{border-color:var(--fail)}
.qopt[data-state="wrong"] .qmark::after,.qopt[data-state="wrong"] .qmark::before{content:"";position:absolute;
left:7px;top:3px;width:2px;height:11px;background:var(--fail)}
.qopt[data-state="wrong"] .qmark::after{transform:rotate(45deg)}
.qopt[data-state="wrong"] .qmark::before{transform:rotate(-45deg)}
.qwhy{margin:7px 0 0 43px;color:var(--ink-muted);font-size:14px;line-height:1.6;max-width:62ch;
padding-left:13px;border-left:2px solid var(--rule)}
.qopt[data-state="right"] + .qwhy{border-left-color:var(--verified)}
.qopt[data-state="wrong"] + .qwhy{border-left-color:var(--fail)}
.quiz .qnote{margin:22px 0 0;font-family:var(--mono);font-size:10.5px;color:var(--ink-faint)}
.qdone{display:inline-flex;align-items:center;gap:7px;margin-left:auto;flex:0 0 auto;
white-space:nowrap;font-family:var(--mono);font-size:10px;letter-spacing:.7px;text-transform:uppercase;
color:var(--verified);border:1px solid color-mix(in srgb,var(--verified) 40%,transparent);
border-radius:var(--r-pill);padding:3px 9px}
@media(max-width:520px){.quiz{padding:18px 16px}.qwhy{margin-left:0;padding-left:11px}}
`

/**
 * Behaviour. Answering reveals that option's explanation and marks it; a wrong
 * answer leaves everything else open so you can try again, and the correct
 * answer is never auto-revealed — being told the answer teaches nothing.
 */
export const QUIZ_JS = `
(function(){
  var quiz=document.querySelector('.quiz');
  if(!quiz)return;
  var KEY='ss-quiz', slug=quiz.dataset.slug;
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
  function save(o){try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}}
  function markDone(qi){
    var all=load(); var got=all[slug]||[];
    if(got.indexOf(qi)<0){got.push(qi);all[slug]=got;save(all)}
    paint();
  }
  function paint(){
    var got=(load()[slug]||[]);
    var items=quiz.querySelectorAll('.qitem');
    for(var i=0;i<items.length;i++){
      var badge=items[i].querySelector('.qdone');
      var on=got.indexOf(i)>-1;
      if(on&&!badge){
        badge=document.createElement('span');
        badge.className='qdone'; badge.textContent='got it';
        items[i].querySelector('.qq').appendChild(badge);
      } else if(!on&&badge){ badge.remove(); }
    }
  }
  quiz.addEventListener('click',function(e){
    var btn=e.target.closest('.qopt');
    if(!btn)return;
    var right=btn.dataset.correct==='1';
    var why=document.getElementById('qw-'+btn.dataset.q+'-'+btn.dataset.o);
    btn.setAttribute('data-state', right?'right':'wrong');
    btn.setAttribute('aria-pressed','true');
    if(why)why.hidden=false;
    if(right)markDone(Number(btn.dataset.q));
  });
  paint();
})();
`
