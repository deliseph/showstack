# Phase 0 — audit and report

Against `docs/ui-refresh-brief.md`. No refresh code written. One repair was made
first and is declared in §J, because Phase 0 numbers measured against a broken
file would have been wrong.

All numbers below are measured in this environment, not estimated. Method is
stated wherever it matters.

---

## A. Stack and build system

| | |
|---|---|
| Runtime | Node ≥ 20, ESM, no framework, no bundler, no CSS pipeline |
| Package | `package.json` — private monorepo, 4 dev deps (`ajv`, `ajv-formats`, `yaml`, `typescript`). No runtime deps. |
| Data | YAML in `data/` → JSON Schema validation (`scripts/validate.mjs`) → `dist/api/v1/*.json` |
| Template engine | None. Pages are JS template literals. `shell()` at `scripts/pages.mjs:292` wraps every page. |
| Build | `scripts/build.mjs` → `scripts/pages.mjs:buildPages()` |
| Output | 608 static pages, 500 entries, `dist/` |
| Deploy | Vercel. `vercel.json`: `buildCommand` runs validate + build, `outputDirectory: dist`, `cleanUrls: true`. No serverless functions, no runtime, no edge config. |
| Tests | `node --test`, 263 passing. Tool arithmetic is embedded into pages via `Function.prototype.toString()`, so a page cannot drift from its test. |
| CI | GitHub Actions `validate.yml` |

Consequence for this refresh: **there is no CSS file to edit.** Styles are string
constants inside `.mjs` modules. Any token work is a JS-level change.

## B. Where styles actually live

| Location | Lines | Scope |
|---|---|---|
| `scripts/pages.mjs` `CSS` const, lines 88–229 | ~140 | Shared by all 608 generated pages |
| `scripts/learn-kit.mjs` `LEARN_CSS` | ~120 | The 27 explainers |
| `scripts/related.mjs` `RELATED_CSS` | ~50 | Cross-link blocks |
| `extraStyle` per page module | 40 files | Page-local |
| `site/search.html` `<style>` | ~270 | `/search/` only — **duplicates the token block and the whole header** |

**A token layer exists**, but it is presentational, not semantic:

`--bg --panel --panel2 --line --ink --dim --dimmer --accent --accent2 --warn --ok
--dom-visual --dom-audio --dom-network --dom-safety --dom-control --glow --shadow
--r-sm --r-md --r-lg --mono --sans`

Declared three times for the three theme states (bare `:root`,
`:root[data-theme="light"]`, `@media(prefers-color-scheme:light)` guarded by
`:root:not([data-theme="dark"])`). That structure is correct and should be kept.

**Missing entirely:** type scale tokens, spacing scale, motion duration/easing
tokens, `--focus`, `--signal-ink`, `--surface-sunken`.

**Raw hex outside the token block:** 59 occurrences. Highest is
`scripts/learn-colour.mjs` (13) — but those are *subject matter*: a page
explaining what `#ffffff` means has to show literal hex. Genuine offenders are
the ~15 in `learn-light.mjs`, `learn-perception.mjs`, `learn-rigging.mjs`,
`learn-senses.mjs`, `learn-kit.mjs`, `tools.mjs`.

## C. Font loading

**CDN, not self-hosted.** `scripts/pages.mjs:307–309` and `site/search.html:11–13`:

```
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap">
```

This is the **only** third-party request on the entire site, and it is
render-blocking on every page. It contradicts two of the brief's own ground
rules ("keep fonts self-hosted", "no third-party requests, verified in the
network panel").

**Measured impact — this is the largest performance finding on the site:**

| Condition | LCP (mobile, 4× CPU) |
|---|---|
| Font stylesheet request hangs (venue firewall / captive portal) | **12 812 ms** |
| Font stylesheet request fails fast | **316 ms** |

Same HTML, same everything else. A stage tech on a venue network that
silently drops requests to Google waits ~13 seconds for a page that otherwise
renders in a third of a second.

Byte cost is **not measurable from this environment** — egress to
`fonts.gstatic.com` is blocked here. It must be measured before Phase 1 decides
on self-hosting. Shape of it: 1 CSS request + up to 7 woff2 files (4 IBM Plex
Sans weights, 3 JetBrains Mono).

## D. Contrast, measured

WCAG 2.x relative luminance, computed from the actual token values.
Blank = passes 4.5:1 body. `~` = passes 3:1 only. `!` = fails 3:1.

### Dark

| foreground | on `--bg` | on `--panel` | on `--panel2` |
|---|---|---|---|
| `--ink` | 16.45 | 15.27 | 13.76 |
| `--dim` | 8.00 | 7.43 | 6.69 |
| `--dimmer` | 5.38 | 4.99 | 4.50 |
| `--accent` | 10.69 | 9.92 | 8.94 |
| `--accent2` | 10.81 | 10.03 | 9.04 |
| `--warn` | 7.17 | 6.65 | 6.00 |
| `--ok` | 9.82 | 9.12 | 8.21 |
| `--dom-visual` | 10.95 | 10.17 | 9.16 |
| `--dom-audio` | 10.94 | 10.16 | 9.15 |
| `--dom-network` | 8.00 | 7.42 | 6.69 |
| `--dom-control` | 7.45 | 6.91 | 6.23 |

### Light

| foreground | on `--bg` | on `--panel` | on `--panel2` |
|---|---|---|---|
| `--ink` | 16.44 | 17.62 | 15.41 |
| `--dim` | 7.24 | 7.76 | 6.79 |
| `--dimmer` | 5.02 | 5.38 | 4.71 |
| `--accent` | 5.25 | 5.63 | 4.92 |
| `--accent2` | 5.04 | 5.41 | 4.73 |
| `--warn` | 5.02 | 5.38 | 4.71 |
| `--ok` | 4.91 | 5.27 | 4.61 |
| `--dom-visual` | 5.39 | 5.77 | 5.05 |
| `--dom-audio` | 5.33 | 5.71 | 5.00 |
| `--dom-network` | 6.70 | 7.18 | 6.28 |
| `--dom-control` | 6.39 | 6.85 | 6.00 |

**Every text pair passes 4.5:1 in both modes.** Nothing to fix there.

### The one failure

| token | on `--bg` | on `--panel` | needs | verdict |
|---|---|---|---|---|
| `--line` | **1.44** (dark) / **1.23** (light) | **1.33** / **1.31** | 3:1 | **FAIL** |

`--line` is the border on every `input`, `select`, `.tab`, `.gapbtn`,
`.ghlink` and card. Where it is the *only* thing marking a control's boundary
that is a WCAG 2.2 SC 1.4.11 failure. Decorative card borders are exempt; the
form controls are not. This is the single accessibility fix Phase 1 owes.

Focus ring passes: `--accent` on `--bg` is 10.69 (dark) / 5.25 (light) against a
3:1 requirement.

## E. Touch targets under 44 px

Measured at 390 px, inline prose links excluded per SC 2.5.8's inline exception.

| element | size | file |
|---|---|---|
| `#dip-minus` DIP toggle | **13 × 13** | `scripts/tools.mjs` |
| `.themebtn` | 36 × 36 | `scripts/pages.mjs:137` |
| `.ghlink` | 65 × 33 | `scripts/pages.mjs:134` |
| `header nav a` | ~62 × 29 | `scripts/pages.mjs:127` (`padding:8px 12px`) |
| tool number inputs (`#dmx-u`, `#dl-1`, `#tc-h`, …) | 110 × 42 | `scripts/tools.mjs` — 2 px short, ~60 of them |
| `select` (`#tc-rate` and others) | 126 × 42 | `scripts/tools.mjs` |
| `.tab` (search category) | 72 × 38 | `site/search.html:120` |
| `.showall` | 390 × 41 | `site/search.html:196` |
| `#q` search input | 350 × 43 | `site/search.html:115` |
| `.gapbtn` | 140 × 32 | `site/search.html:236` |
| `.more` quicktool | 113 × 39 | `site/search.html:113` |

The brief predicted the DIP switches and the steppers. It was right about both;
the DIP toggles at 13 px are by a wide margin the worst control on the site.

Footer/inline links measured at 15 px tall are inside running prose and are
exempt, but `/`'s `.cbtns a.primary` at 243 × 42 is a real control and 2 px short.

## F. prefers-reduced-motion

**Already fully honoured. This brief item is done — do not redo it.**

Evidence:
- Global guard, `scripts/pages.mjs:229`:
  `@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important;animation:none!important;scroll-behavior:auto!important}}`
- **Zero SMIL** in the codebase (`<animate>`, `<animateTransform>`, `<animateMotion>`: 0 occurrences across all 40 page modules). SMIL is the usual hole in a CSS-only guard; there is none here.
- **Zero `requestAnimationFrame`, zero `setInterval`** across the whole codebase. No JS-driven motion to escape the guard.
- Empirically verified with `reducedMotion: 'reduce'`: **0 still-animating elements** on `/learn/transducers/`, `/learn/senses/`, `/learn/colour/`, `/learn/rigging/`, `/learn/systems/`, `/learn/aerial/`, `/learn/reading/`, `/tools/`, `/`.

Every explainer figure is CSS keyframes, and every one stops.

## G. Performance — mobile profile, 4× CPU throttle, 390 px

Font request failing fast (see §C for what happens when it hangs instead).

| page | LCP | CLS | TBT | HTML | 3rd-party |
|---|---|---|---|---|---|
| `/` | 316 ms | 0 | 166 ms | 33 KB | 1 (fonts) |
| `/learn/` | 264 ms | 0 | 104 ms | 53 KB | 1 |
| `/tools/` | 404 ms | 0 | **471 ms** | 118 KB | 1 |
| `/protocols/` | 240 ms | 0 | 73 ms | 31 KB | 1 |
| `/search/` | 412 ms | 0 | **459 ms** | 1 120 KB | 1 |
| `/interop/` | 188 ms | 0 | 86 ms | 131 KB | 1 |

- **CLS is 0 on every page.** The brief's "space reserved for every figure" gate is already met.
- **TBT exceeds 200 ms on `/tools/` and `/search/`.** `/search/` parses a 1.1 MB inlined JSON bundle; `/tools/` wires ~20 calculators at load.
- No Lighthouse binary in this environment; these are PerformanceObserver measurements of LCP, layout-shift and long-task entries, which is what Lighthouse derives the same three metrics from.

Horizontal scroll at 375 / 768 / 1024 / 1440, across 17 pages: **none** (after the §J repair). Zoom is not disabled — `width=device-width,initial-scale=1`, no `maximum-scale`.

## H. Already implemented — do not redo

1. **Nav is already three labelled clusters**, not nine flat peers. `scripts/pages.mjs:275–290`: Home · [Learn, Search, Tools, Build] · [Protocols, Standards, Software, Hardware, Glossary] · [Interop, Compare, Ports, Signals, Network, RF]. It collapses to a masked horizontal rail below 860 px.
2. **"Search" no longer links to the homepage.** The search app moved to `/search/`; `/` is a front door that ships counts only (33 KB vs 1 120 KB).
3. **The chain is already visible on the homepage** as a seven-stage spine with per-stage explainer counts.
4. **Position-in-chain already exists on every explainer** — `.lnav`/`.lrail` in `learn-kit.mjs` lists all 27 topics grouped by stage with the current one marked `aria-current`.
5. **Explainer page endings are already rebuilt.** `learnFooter()` in `scripts/related.mjs` appends related-explainer cards plus the capstone, with the GitHub link demoted below. *Entry* pages still end on admin — that part of item 7 stands.
6. **Explainer ↔ entry cross-linking is done and derived, not hand-maintained** — links are extracted from rendered HTML and reversed, so 500/500 entries link into the explainers that cover their mechanism.
7. **reduced-motion** — §F.
8. **SVG icons only**, no emoji used as an icon anywhere.
9. **Curiosity questions already exist on every Learn card** (`.lq`, e.g. "What does phantom power do?", "Why is there a hum?"). They are positioned *last* in the card rather than promoted — that is a move, not a write.
10. **CLS 0, zoom enabled, correct landmarks** (`header`/`nav`/`main`/`footer`, one per page).

## I. Confirmed not implemented

| Brief item | Status |
|---|---|
| Worked-example default on `/interop/`, `/compare/`, `/ports/` | **0** examples, **0** chips, **0** default results on all three |
| URL-addressable query state on the Answers pages | Absent |
| Human label map | **53 distinct machine values render as human headings** — `/protocols/` 12 (`audio-transport`, `timecode-sync`, `machinery-motion`…), `/software/` 14, `/hardware/` 15, `/glossary/` 12. Plus `open-free-registration` / `proprietary-closed` / `open-paid` on entry pages. |
| `/tools/` filter, permalinks, copy-result, recently-used | Absent (a sticky category rail **does** already exist) |
| One isolated answer per calculator | Absent — results and inputs are visually equal |
| Skip link | Absent |
| `localStorage` read state | Absent |
| "Free, no account, no tracking" sitewide | Present on `/` and `/tools/` only |
| Contributor attribution on entries | Absent — and latent: the dataset currently has 0 credited contributors |
| Question-first Learn cards | Questions present, position wrong |
| Reading time per card | Absent |

## J. Bugs found that are not in the brief

**1 — `site/search.html` was corrupted. Repaired.**
3 024 characters had been cut mid-element, truncating the Learn card's `<em>`
and swallowing three wayfinding cards and the whole contribute block, leaving
unbalanced markup. Effect: **191 px of horizontal scroll at 375 px** on
`/search/`. This came from my own uncommitted work earlier today when the search
app was split out of the old front page — it has never been deployed. Repaired
by removing the wayfind remnant cleanly (those blocks now live on `/`, correctly)
and restoring the contribute block. Re-verified: no horizontal scroll at 375 /
768 / 1024 / 1440 across 17 pages. Flagged rather than fixed silently because
every §G and §E number would otherwise have been measured against a broken file.

**2 — Double-escaped `<code>` on every gapped entry page.** `scripts/pages.mjs:349`:

```js
`<code>${esc(gap.missing.join('</code>, <code>'))}</code>`
```

`esc()` runs over the joined string *including the separators*, so the reader
sees literal `</code>, <code>` text:

> Known gaps on this entry: `default_ports</code>, <code>first_published</code>, <code>implementations`

Affects every entry with more than one gap. Not repaired — it is a one-line fix
and belongs in a commit of its own.

**3 — Two `outline:none` declarations.** `scripts/home.mjs:61` and
`site/search.html:116`. Both replace the outline with a border-colour change
plus a box-shadow ring, so focus is not invisible, but neither ring has been
contrast-checked. Phase 1 owes both a measured 3:1.

## K. Where I think the brief is wrong

Pushing back here rather than complying silently, as §4 Phase 0 asks.

**1. "Light mode is the default."**
Agreed on the reasoning — a phone in a loading dock in daylight — but the
framing has a trap. The site has *three* theme states, not two: explicit light,
explicit dark, and **system**, which is what most visitors get and which stamps
no attribute at all. If "default" is implemented as "light unless told
otherwise", every visitor whose phone is set to dark gets a white page in a dark
auditorium, which is the worse of the two failure modes. Proposal: keep honouring
the OS preference, treat light as the fallback where none is expressed, and give
light mode equal design effort (which §2.1's "not an inverted afterthought" is
really asking for). If you want light unconditionally regardless of OS, say so
and I will do exactly that.

**2. "Lamp amber, not tech blue" collides with the reserved-colour rule.**
Two problems. First, the current accent is not tech blue — it is teal
(`#5fd4bb` dark / `#0b7561` light). Second, and harder: amber is *already*
`--accent2` and `--dom-visual`, and warm orange-red is *already* `--warn`.
Promoting amber to the single `--signal` puts links, active states and CTAs in
the same hue family as caution — which breaks the reserved-colour discipline
that the same section correctly calls the point. Two coherent options:
**(a)** keep teal as `--signal` and spend the warmth on `--accent2` where it
already lives; **(b)** move `--signal` to amber and re-hue `--warn` to a
distinctly redder value with a measured hue separation. I would take (a) — the
reserved-colour rule is the more valuable half of that section, and teal already
clears 5.25:1 light and 10.69:1 dark. Your call, and I will record whichever in
`MASTER.md` with the reasoning.

**3. "Newsreader serif, 18px, Learn pages only."**
The explainers are not essays. Each one is prose interleaved with five to eight
animated SVG figures, interactive dials, and tables of numbers. A reading serif
next to mono figure labels and tabular data is a harder pairing than it looks,
and setting Learn in a different family from the rest of the site cuts directly
against "every page has an aligned design concept". Counter-proposal: first take
the free win — cap the measure at 68ch and raise leading to 1.65 on Learn prose,
which is most of the readability gain — then trial the serif on **one** page and
look at it before committing 27. Also note §C: adding a third family to a
render-blocking CDN request makes the 12.8 s failure mode worse.

**4. The brief's counts are stale in three places.** "25 animated explainers" —
there are 27. "Navigation is nine flat peers" — it is already three labelled
clusters. "A first item called Search that links to the homepage" — search moved
to `/search/`. Flagging so Phase 4 is not scoped against the wrong number.

**5. Drop the endowed-progress step.** "Start the counter non-zero… reading the
homepage chain summary counts as stage 0 complete" is the one mechanism in §3
that marks something read which the reader did not read. On a site whose whole
pitch is that it leaves a field visibly empty rather than guessing at it, that is
a bad trade for a small motivational gain. The Zeigarnik and goal-gradient
structure works without it. Everything else in §3 I would build as written.

**6. The font CDN should be in Phase 1, ahead of most of the token work.**
It is not mentioned anywhere in the brief, and it is the largest measured problem
on the site: 12 812 ms vs 316 ms LCP, and the only third-party request the
"no third-party requests" checklist item would fail on.

**7. "More than three files, stop and explain" needs a translation.**
The architecture makes file count a poor proxy for risk: one shared `CSS`
constant feeds 608 pages, and page CSS lives inside 40 separate
`scripts/learn-*.mjs` modules. A single token rename is a mechanical 40-file
change with a zero-pixel diff; a 2-file change to `shell()` alters every page on
the site. I will treat **one concern per commit** as the real rule, and call out
explicitly whether a change is mechanical or substantive.

## L. State of the working tree

Uncommitted, held at Phase 0 as instructed. Full test suite green (263 passing),
build clean (608 pages).

| file | change |
|---|---|
| `scripts/toolmath.mjs` | +214 — six new tested functions (`hexToChannels`, `codeToLight`, `videoRange`, `chromaBitrate`, `rt60Sabine`, `stereoParallax`) |
| `test/tools.test.mjs` | +194 — tests for the above |
| `scripts/learn-colour.mjs` | new — `/learn/colour/`, RGB/hex/bit-depth/gamma/colour-space/subsampling |
| `scripts/learn-senses.mjs` | new — `/learn/senses/`, hearing/colour vision/depth/3D/volumetric/temperature/touch |
| `scripts/home.mjs` | new — `/` generated through `shell()` instead of a hand-maintained `site/index.html` |
| `scripts/build-page.mjs` | new — `/build/`, the API kit and eight recipes |
| `site/search.html` | new — the search app, split out of the old front page |
| `site/index.html` | deleted — replaced by `scripts/home.mjs` |
| `scripts/learn-rigging.mjs` | +17 — SWL vs WLL |
| `scripts/learn-sound.mjs` | +80 — RT60 and venue reverberation targets |
| `scripts/pages.mjs`, `scripts/build.mjs`, `scripts/learn-kit.mjs` | wiring |

Moving the front page into `shell()` is worth noting for Phase 2: it removed the
last page that maintained its own copy of the header and nav, and with it about
200 lines of CSS for components that page never rendered. `site/search.html` is
now the only remaining duplicate of the token block.

---

## Recommended order, given the above

Unchanged from the brief except for one insertion:

- **Phase 1** — token layer, **plus self-hosted fonts** (§C), **plus the `--line` 3:1 fix** (§D), plus the two bugs in §J.2–3.
- Phases 2–7 as written, with §K.1, §K.2 and §K.3 resolved before Phase 1 starts,
  since all three decide token values.

Three decisions are blocking Phase 1: the light-default question (§K.1), the
accent family (§K.2), and the serif (§K.3).
