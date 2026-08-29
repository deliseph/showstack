/**
 * What a protocol can carry — sample rates, bit depths, resolutions, frame rates.
 *
 * This lives in its own module because two pages need it and they must agree.
 * The comparison page puts it in a side-by-side table; the protocol page puts
 * it under "What it carries". If either grew its own formatting, "48 kHz" on
 * one page and "48kHz" on the other would eventually become "48" on one and
 * "44.1, 48, 96" on the other, and a reader cross-checking the two would be
 * right to stop trusting both.
 *
 * Nothing here emits HTML. Escaping has exactly one definition, in pages.mjs,
 * and this module returning plain strings is what keeps it that way.
 */

/** Join a list through a formatter, or return '' so callers can drop the row. */
const list = (xs, fmt) => (xs ?? []).map(fmt).join(', ')

/**
 * What to print when an entry carries video but fixes no ceiling.
 *
 * ST 2110 and SRT genuinely set no limit — the link does — and the first cut
 * of this dropped the row entirely, so the page answered "does 2110 do 4K?"
 * by not mentioning resolution at all. A reader cannot tell a missing answer
 * from an unbounded one, so say which it is. Entries with no video block at
 * all still return '' and the row disappears, correctly.
 */
const unfixed = (p) => (p.media?.video ? 'Not fixed by the specification' : '')

/**
 * Rows in the order a reader wants them: audio first because far more entries
 * carry audio, then video. Same [label, getter] shape as the comparison
 * table's own ROWS, so it can be spread straight in.
 *
 * Every getter returns a string or undefined. A row where both protocols
 * return nothing is filtered out by the caller, which is why a video-only
 * protocol shows no audio rows rather than eight dashes.
 */
export const MEDIA_ROWS = [
  ['Sample rates', (p) => list(p.media?.audio?.sample_rates_khz, (r) => `${r} kHz`)],
  ['Audio bit depth', (p) => list(p.media?.audio?.bit_depths, (b) => `${b}-bit`)],
  ['Audio channels', (p) => (p.media?.audio?.max_channels ? `up to ${p.media.audio.max_channels}` : '')],
  ['Audio encoding', (p) => p.media?.audio?.encoding],
  ['Resolution', (p) => p.media?.video?.max_resolution ?? unfixed(p)],
  ['Frame rate', (p) => (p.media?.video?.max_frame_rate ? `up to ${p.media.video.max_frame_rate} Hz` : unfixed(p))],
  ['Colour sampling', (p) => list(p.media?.video?.colour_sampling, (s) => s)],
  ['Video bit depth', (p) => list(p.media?.video?.bit_depths, (b) => `${b}-bit`)],
  ['Video compression', (p) => p.media?.video?.compression],
]

/** True when the entry has anything at all worth putting in the table. */
export const hasMedia = (p) => MEDIA_ROWS.some(([, get]) => get(p))

/**
 * The notes, labelled by essence.
 *
 * These matter more than the numbers do. "48 kHz" on AES67 is only half the
 * truth without "and that is the mandatory interoperability point, other rates
 * cannot be assumed between vendors" — a number quoted into a specification
 * without its caveat is how a rig ends up not working on site.
 */
export function mediaNotes(p) {
  const out = []
  if (p.media?.audio?.note) out.push(['Audio', p.media.audio.note])
  if (p.media?.video?.note) out.push(['Video', p.media.video.note])
  return out
}
