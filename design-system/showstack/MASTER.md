# showstack design system

Resolved during the UI/UX refresh. Every ratio here was measured against the
rendered pages, not estimated. If you change a token, run `npm run audit`
before you ship it — it checks contrast, focus, target size, motion, CLS,
horizontal scroll and third-party requests across 21 pages, four widths and
both themes.

Source of truth: `scripts/pages.mjs`, exported as `TOKENS`, `BASE_CSS` and
`SHELL_CSS`. `site/search.html` inlines the same three at build time. There is
no CSS file — styles are string constants inside `.mjs` modules, so a token
rename is a mechanical change across ~40 files with no visual diff.

---

## 1. Colour

Semantic names are the source of truth. The older presentational names
(`--bg`, `--panel`, `--line`, `--accent`) remain as aliases so the 40 page
modules that use them keep working; new work uses the semantic name.

### Light (the base palette)

| Token | Value | On `--surface` | On `--surface-raised` | On `--surface-sunken` |
|---|---|---|---|---|
| `--surface` | `#f4f2ee` | — | — | — |
| `--surface-raised` | `#fbfaf7` | — | — | — |
| `--surface-sunken` | `#e9e6e0` | — | — | — |
| `--ink` | `#282b30` | 12.70 | 13.61 | 11.40 |
| `--ink-muted` | `#4e5560` | 6.73 | 7.21 | 6.04 |
| `--ink-faint` | `#5f656f` | 5.25 | 5.62 | 4.71 |
| `--rule` | `#ddd9d2` | 1.26 | 1.35 | 1.12 |
| `--rule-strong` | `#7c7973` | **3.88** | **4.16** | **3.48** |
| `--signal` | `#0a6e5c` | 5.53 | 5.92 | 4.96 |
| `--signal-ink` | `#ffffff` | 6.18 on `--signal` | | |
| `--focus` | `#0a6e5c` | 5.53 | 5.92 | 4.96 |
| `--verified` | `#376f22` | 5.43 | 5.82 | 4.87 |
| `--warn` | `#8a5608` | 5.50 | 5.89 | 4.94 |
| `--fail` | `#b13f28` | 5.20 | 5.57 | 4.67 |

**Revised for eye comfort, and why.** The light palette used to put `--ink`
at 17.62:1 on a pure white card. Both halves of that were a problem and both
were reported as strain before they were changed.

*No pure white.* `--surface-raised` was `#ffffff`, which is the brightest
thing most screens can produce, and it was the ground under every card, tool
and panel on the site. It is `#fbfaf7` now — off-white, and nothing on the
site renders `#ffffff` as a surface any more.

*Contrast is a floor, not a score.* 17.62:1 is two and a half times what
WCAG asks for AAA body text, and sustained reading at that level is
genuinely tiring. `--ink` is 13.61:1 on the raised surface now: still nearly
double the AAA threshold of 7, and considerably kinder for an hour.

*Warm rather than blue.* The old neutrals were blue-biased (`#f6f7f9` has
more blue than red). At equal luminance a blue-biased neutral reads as
glarier. The new ones carry a slight warm bias instead, and the drop shadow
was warmed to match — a blue-black shadow on a warm ground reads as a smudge
rather than as depth.

Every accent was re-measured against the new surfaces, and most of them
*gained* ratio, because the surfaces are slightly darker than they were.
`--verified` went from 4.61 to 4.87 at its worst, and `--rule-strong` from
3.37 to 3.48.

### Dark

| Token | Value | On `--surface` | On `--surface-raised` | On `--surface-sunken` |
|---|---|---|---|---|
| `--surface` | `#0b0e14` | — | — | — |
| `--surface-raised` | `#121722` | — | — | — |
| `--surface-sunken` | `#19212f` | — | — | — |
| `--ink` | `#e9edf4` | 16.45 | 15.27 | 13.76 |
| `--ink-muted` | `#9aa8bc` | 8.00 | 7.43 | 6.69 |
| `--ink-faint` | `#7a889f` | 5.38 | 4.99 | 4.50 |
| `--rule` | `#242f42` | 1.44 | 1.33 | 1.18 |
| `--rule-strong` | `#556e9b` | **3.76** | **3.49** | **3.15** |
| `--signal` | `#5fd4bb` | 10.69 | 9.92 | 8.94 |
| `--signal-ink` | `#0b0e14` | 10.69 on `--signal` | | |
| `--focus` | `#5fd4bb` | 10.69 | 9.92 | 8.94 |
| `--verified` | `#8cc96a` | 9.82 | 9.12 | 8.21 |
| `--warn` / `--fail` | `#ec7f66` | 7.17 | 6.65 | 6.00 |

### The two-rule rule

`--rule` is decorative and deliberately quiet. It fails 3:1 and that is fine
for a card edge, which carries no meaning. **`--rule-strong` is mandatory on
anything a person operates** — input, select, textarea, button, tab, checkbox.
This is WCAG 2.2 SC 1.4.11 and it was the site's only accessibility failure
before the refresh.

### Reserved colours

Green is `--verified` and means **this fact is sourced**. Amber is `--warn` and
means a real caution — a unit-load limit, a noise dose. Red is `--fail` and
means a real failure — an intermod collision, no route between two devices.
None of the three is ever decorative. The moment green appears on something
that is not "sourced", the signal is dead.

The sponsor button uses `--signal`, not GitHub's pink. It is an action in the
link family, not a state, and one more hue for one more purpose is how the
reserved-colour rule dies. The heart glyph carries the recognition; the colour
does not have to.

`--dom-*` (visual, audio, network, safety, control) identify a domain and
nothing else. `--accent2` is the secondary figure colour inside calculator
results. Neither is a semantic state.

### Deviations from the ui-ux-pro-max defaults, and why

**Not knowledge-blue `#1E3A8A` with a purple accent.** That is the database
default for this product type. It was never used here.

**Not lamp amber either, which the brief asked for.** Amber is already
`--accent2` and `--dom-visual`, and warm orange-red is already `--warn`.
Promoting amber to the single `--signal` would put links, active states and
CTAs in the same hue family as caution, which breaks the reserved-colour rule
that the same section of the brief correctly calls the point. Teal is kept —
it clears 5.25:1 light and 10.69:1 dark, and it leaves the warm end of the
spectrum free to mean exactly one thing. Raised with the author; if they want
amber, `--warn` has to be re-hued to a distinctly redder value first, with a
measured hue separation.

**Light is the base palette, dark is the override.** The brief asked for light
as the default and it is right about why — the usage context is a phone in a
loading dock in daylight. But there are three theme states, not two: explicit
light, explicit dark, and *system*, which stamps no attribute and is what most
visitors get. So light is what a browser expressing no preference lands on,
`@media(prefers-color-scheme:dark)` still honours the OS, and an explicit
`[data-theme]` beats the OS in both directions. Forcing light regardless of OS
would hand a dark-set phone a white page in a dark auditorium.

---

## 2. Type

Three roles. Do not add a fourth.

| Role | Family | Where |
|---|---|---|
| UI, index, prose | IBM Plex Sans | everything by default |
| Numbers, labels, code | JetBrains Mono | every calculator field and result, every port number, frequency, token name, structural label |
| Reading serif | `--serif` (Newsreader, Georgia fallback) | explainer prose only — bare `<p>` and `<ul>` inside `.lsec`, plus the page lede |

**Self-hosted, same origin.** Six variable `woff2` files, 197 KB total, with
`unicode-range` so the 42 KB of latin-ext only downloads on a page that
contains those characters, and the 80 KB of Newsreader only on an explainer.
`font-display: swap`; `rel=preload` on the two latin files everywhere, plus
Newsreader upright on Learn pages, which is what holds those pages at CLS 0.

This was the single largest measured problem on the site. The fonts used to
load render-blocking from Google — the only third-party request anywhere. With
that request hanging the way a venue firewall or a captive portal makes it
hang, mobile LCP was **12 812 ms**. With it failing fast, 316 ms. Same markup.
There is now no external request to hang. **Do not reintroduce a font CDN.**

`font-variant-numeric: tabular-nums` on every calculator field and result, so
figures do not jitter as they update.

### The serif, trialled and adopted

This was parked with a worry: the explainers are not essays — each is prose
interleaved with animated SVG figures, interactive dials and tables of numbers
— and a reading serif next to mono figure labels looked like a harder pairing
than it sounds. Trialled on `/learn/mixing/` and `/learn/senses/` at 390 and
1200 px, in both themes, and the worry did not survive contact: the mono
eyebrow, sans heading and serif body read as the three distinct roles the
brief asked for rather than as three fonts on a page. Adopted across all 39.

**Where it applies.** Bare `<p>` and `<ul>` inside `.lsec`, plus the page
lede. Scoped with `:not([class])`, because running prose is the only thing on
these pages that carries no class — every eyebrow, caption, quiz option, table
and control does. That is a hook that stays correct when somebody adds a
component, which an exclusion list is not. 18px desktop, 17px mobile,
`--leading-prose`, `--measure`. Colour unchanged, so contrast is unchanged.

**The `body.reading` class is derived from the canonical**, not passed in.
There are 39 explainer modules and a flag on 39 call sites is a flag somebody
forgets on the 40th. The `/learn/` index is deliberately excluded — it is a
card grid, not prose.

**Cost, and how it was kept down.** Google serves Newsreader with an optical
size axis; requesting a fixed size drops that axis and takes the upright and
italic pair from 272 KB to 80 KB, with the weight axis kept because the prose
leans on `<strong>` throughout. It is not in the service worker's shell
precache — a reader who never opens an explainer should not pay for a face
they never see — but it *is* in the explainer offline-save list, so somebody
who saves the set and goes offline does not read all 39 in Georgia.

### Scale

`--text-xs` 11 · `--text-sm` 13 · `--text-base` 16 · `--text-md` 17 ·
`--text-lg` 20 · `--text-xl` 24 · `--text-2xl` 29 · `--text-3xl` 35 ·
`--text-display` `clamp(30px, 5.2vw, 50px)`

`--leading-tight` 1.25 · `--leading-normal` 1.5 · `--leading-prose` 1.65 ·
`--measure` 68ch

---

## 3. Spacing, radius, motion

4px base: `--space-1` … `--space-16` (4, 8, 12, 16, 20, 24, 32, 40, 48, 64).

Radius: `--r-sm` 8 · `--r-md` 12 · `--r-lg` 16 · `--r-pill` 999.

Motion, standard tier: `--dur-fast` 150ms · `--dur-base` 250ms ·
`--dur-slow` 400ms · `--ease-out` `cubic-bezier(.22,.61,.36,1)`.

Animate `transform` and `opacity` only. The explainer figures are the
exception — their motion *is* the content and it stays as it is.

**`prefers-reduced-motion` is complete and must stay that way.** One global
guard in `BASE_CSS` kills every CSS animation. It works because the codebase
contains **zero SMIL** (`<animate>`, `<animateTransform>`, `<animateMotion>`)
and **zero** `requestAnimationFrame` or `setInterval` — a CSS-only guard has no
hole to leak through. If you ever add SMIL or a JS animation loop, the guard no
longer covers it and you have to handle reduced motion yourself.

---

## 4. Target size

Two thresholds, because they are two different claims.

**24 × 24 — WCAG 2.2 SC 2.5.8, level AA. A hard gate.** `npm run audit` fails
the build if anything misses it. Every page currently passes, verified with
the spacing exception implemented rather than assumed: a target under 24px
still passes if a 24px-diameter circle centred on it does not intersect
another target's circle, which is what legitimately clears a link sitting
alone in a table row.

**44 × 44 — SC 2.5.5, level AAA, and this project's house standard.**
Reported by the audit, not fatal. Enforced in `BASE_CSS` on `input`,
`select`, `textarea` and `button`, and on every nav pill, chip, tab and
primary control.

Where the two diverge, deliberately:

- **Links inside dense tables and result lists** (`/ports/`, `/compare/`,
  `/search/`, `/build/`) sit at 30px. They clear AA with room to spare;
  taking them to 44 would add ~14px per row to tables that are already long,
  for a link that is rarely the primary action on the page. `td a` and
  friends get `padding: 4px 0` in `BASE_CSS` to grow the box without growing
  the type.
- **The twelve DIP switches on `/tools/`** are 44px and the row scrolls
  sideways, rather than shrinking the thing you have to hit with a thumb.
- **Checkboxes and radios** are 20px; their *label* carries the 44px, because
  the label is what you actually tap.
- **Inline links inside running prose** are exempt under SC 2.5.8's inline
  exception. The audit tests this by looking for real text nodes beside the
  link, not by guessing from the parent's tag name — a footer link sits in a
  `<div>` and is still prose.

The audit prints the 24–44px band as warnings so what is unsolved stays
visible instead of being quietly rounded off.

---

## 5. The label map

`scripts/labels.mjs`. One map, used by the 608 static pages and injected into
the search bundle at build time so the two can never disagree about wording.

Three rules, all load-bearing:

1. **The machine value is never thrown away.** Every mapped element keeps its
   key in `data-value`, and the long form goes in `title` where the pill shows
   a short one.
2. **Deep links keep the machine value.** Section anchors are unchanged —
   `/protocols/#g-audio-transport` still resolves. Only the text a person reads
   is mapped.
3. **An unnamed value degrades to prose, not to the key.** A category added
   tomorrow reads as "Haptic feedback", not `haptic-feedback`. Values that are
   already prose (`ISO/IEC`, `BSMI (經濟部標準檢驗局)`) pass through untouched.

`test/labels.test.mjs` walks the shipped dataset and fails if any value
reaching a reader lacks an explicit entry. The fallback exists so new data is
never ugly; the test exists so the fallback never becomes the norm.

---

## 6. The psychology, as built

| Mechanism | Where it lives |
|---|---|
| Curiosity gap | The strongest question opens every hub card, in `--signal`, above a quieter title |
| Zeigarnik / goal-gradient | `localStorage` read state, shared by `/learn/` and the 27 explainers through one key; progress bar, count, Clear button |
| Peak–end | The figure stays the peak. The ending is "You can now answer", drawn from the same questions on the hub card, then where to go next, then the index cross-links |
| Von Restorff | One answer per calculator: first figure in `.out` at 23px in `--signal`, on `--surface-sunken`, everything else recedes |
| Recognition over recall | Three labelled nav clusters; question-first cards; worked examples on the Answers pages |
| Fluency | The label map above |
| Autonomy | "Free forever · no account, no tracking, no third-party requests" under the header on every page |
| Relatedness | Contributor attribution on the entry itself (renders nothing until someone is credited) |
| Competence | Stated in the site's own voice. No score, no badge, no percentage, no "great job" |

**Not built, deliberately:** endowed progress. The brief asks for the counter
to start non-zero by marking the homepage as stage 0 complete. That marks
something read which the reader did not read, on a site whose entire pitch is
that it leaves a field visibly empty rather than guessing at it. The Zeigarnik
structure works without it.

**Never:** streaks, badges, confetti, points. The reward is competence — the
feeling of understanding something you did not understand this morning.

---

## 7. Verified state

`npm run audit`, across 21 pages at 375 / 768 / 1024 / 1440 in both themes.
It needs Playwright, which is deliberately not a dependency of this package:

    npm i --no-save playwright && npx playwright install chromium
    npm run build && npm run audit


- All 33 text-on-surface pairs ≥ 4.5:1, both themes
- `--rule-strong` ≥ 3:1 on all three surfaces, both themes
- Focus ring visible on every interactive element on every page
- Every target at least 24×24 (SC 2.5.8 AA), spacing exception implemented
- Zero animation under `prefers-reduced-motion`; zero SMIL; zero rAF/setInterval
- CLS 0.00 on every page, now measured by `npm run audit` against a 0.1 budget
  rather than asserted here. This line used to be a claim nobody checked, and
  it stopped being true: the tools page drifted to 0.15 on a phone when the
  category rail started being built on load. It is a gate now.
- No horizontal scroll at any of the four widths; zoom not disabled
- **Zero third-party requests**
- Tools still compute with the network disabled after first load, zero new requests
- 573 tests passing; `data/` untouched by the refresh, so every calculator
  returns the numbers it returned before and no prose was rewritten
