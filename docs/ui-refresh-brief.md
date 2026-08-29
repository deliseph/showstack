# showstack — UI/UX refresh brief

You are working on **showstack**, an open, citable index of live entertainment technology, plus 25 animated explainers arranged as one chain, plus ~20 offline field calculators. Live at `showstack-inky.vercel.app`. Data CC BY 4.0, code MIT, free JSON API, no accounts, no tracking.

This brief is the source of truth for a UI/UX refresh. Read all of it before you write a line of code.

---

## 0. Ground rules (these override your defaults)

- **Surgical, version-controlled edits. Not a rewrite.** One concern per commit. If a change touches more than three files, stop and explain why before doing it.
- **Do not touch the prose.** The writing is the best thing about this site. You may change where text sits, what size it is, what wraps it, and which fragment is promoted to a heading or a link label. You may not rewrite sentences, "punch them up", or add marketing copy.
- **Do not add dependencies** without asking. No animation library, no UI kit, no font-loading service beyond what is already there. If you think one is genuinely required, propose it with the byte cost and wait.
- **Offline-after-load must survive.** The tools page works with no signal once loaded. Any change that introduces a runtime fetch on a tools page is a regression.
- **No tracking, ever.** No analytics scripts, no third-party embeds, no fonts served from a domain that logs. If fonts are currently self-hosted, keep them self-hosted.
- **Accessibility is a hard gate, not a polish pass.** WCAG 2.2 AA. 4.5:1 body text, 3:1 non-text and UI boundaries, visible focus that is never removed, full keyboard operation, `prefers-reduced-motion` honoured on every animation including the explainer figures.
- **The pass/fail test for every change:** if an ordinary person (a stage tech on a phone, not a developer) cannot *feel* the difference, it failed. Delete it and move on.

---

## 1. What is actually wrong

Ranked. Fix in this order.

1. **The site does not apply its own thesis to itself.** `/learn/experience/` argues that you cannot design a feeling, only the conditions and the timing, and that the peak and the ending are the only two moments that survive. Yet every page on the site ends identically on a GitHub issue link and a licence line. The psychology lives in the content and is absent from the interface.
2. **Navigation is nine flat peers** (Search, Tools, Network, RF, Learn, Interop, Compare, Ports, Signals) with no grouping, no hierarchy, and a first item called "Search" that links to the homepage. Network and RF are also tools. Interop, Compare, Ports are also answers. The visitor is asked to construct the model themselves.
3. **Dead empty states.** `/interop/`, `/compare/` and `/ports/` render two empty selects and no result. There is no example, no default, no "most-checked pairs". This is the highest-bounce, cheapest-to-fix surface on the site.
4. **`/learn/` is 25 equal-weight cards** with paragraph-length descriptions. No reading time, no position in the chain, no progress, no visual difference between a foundational page and a late one. The excellent curiosity hooks already written into each card ("Why does DMX need termination?", "What breaks the illusion?") are buried as body text instead of being the entry point.
5. **`/tools/` is 20+ calculators in one long scroll** with no sticky category rail, no filter, no recently-used, no per-tool permalink, no copy-result. A rigger on a phone scrolls past nineteen tools to reach voltage drop.
6. **`/protocols/` exposes machine values as human labels**: `audio-transport`, `timecode-sync`, `open-free-registration`, `proprietary-closed`. This is a label-mapping fix, not a redesign, and it is the single biggest contributor to the site feeling like a database dump.
7. **Uniform page endings.** No next step, no related explainer, no acknowledgement of what the reader now knows.

Do **not** "fix" these, they are working: the prose, the citation-on-every-fact discipline, the chain concept, the honesty about what a tool is not (the bridle-angle geometry disclaimer is a model of it), and the free / no-account / no-tracking stance.

---

## 2. Design direction

**Structure:** make the chain visible and give the reader a position on it.
**Visual language:** editorial instrument. Serious publication, not developer console, not startup landing page.
**Interaction:** answer-first, but only on the four Answers pages (`/interop/`, `/compare/`, `/ports/`, `/rf/`). Everywhere else stays calm.

Accepted trade-off: someone arriving from a search engine to a single protocol page gets one extra layer of chrome. Mitigate by collapsing the chain spine to a thin bar on any deep-linked page.

### 2.1 Colour

Light mode is the default because the real usage context is a phone in a loading dock in daylight. Dark mode is a genuine first-class mode, not an inverted afterthought.

Define these as semantic tokens in one place. No raw hex anywhere in a component.

```
--surface            /* page background */
--surface-raised     /* cards, calculator panels */
--surface-sunken     /* code, results, mono blocks */
--ink                /* body text, >= 4.5:1 on --surface */
--ink-muted          /* secondary text, still >= 4.5:1 */
--ink-faint          /* labels only, never body copy */
--rule               /* borders, >= 3:1 where it carries meaning */
--signal             /* the one accent: links, active state, CTA */
--signal-ink         /* text on --signal */
--verified           /* ONLY for "cited / sourced". Never decorative. */
--warn               /* ONLY for real caution: unit-load limits, dose */
--fail               /* ONLY for real failure: intermod collision, no route */
--focus              /* focus ring, must clear 3:1 on every surface it lands on */
```

Accent family: lamp amber / warm signal orange, not tech blue. It is the colour of the subject matter (a lamp, a warning, a cue light) and it distinguishes the site from every other documentation product. Pick a specific value, check it at 4.5:1 for text use and 3:1 for UI use in both modes, and write the measured ratios into a comment beside the token.

Reserved-colour discipline is the point: if green appears anywhere that is not "this fact is sourced", the signal is dead. Same for red.

*Note: the ui-ux-pro-max database's default for this product type is knowledge-blue `#1E3A8A` with a purple accent. We are deliberately deviating. Record that decision in the design system file.*

### 2.2 Typography

Three roles, each earning its place. Do not add a fourth.

- **Prose (Learn pages only):** a reading serif. `Newsreader` is the validated pairing candidate. Body 18px minimum on desktop, 17px on mobile, line-height 1.6, measure capped at `68ch`.
- **UI, index, tools:** a modern grotesque. Whatever is already in use is likely fine. Body 16px minimum, line-height 1.5.
- **Numbers:** a mono, tabular figures on, for every calculator input, every result, every port number, every frequency. `font-variant-numeric: tabular-nums` so figures do not jitter as they update.

Set a real type scale as tokens (`--text-xs` through `--text-display`) using a consistent ratio. No arbitrary `font-size` values in components.

### 2.3 Spacing and motion

- 4px base, exposed as `--space-1` through `--space-16`. Standard density (this is reference material, not a dashboard).
- Motion tier: **standard**. Scroll-reveal and stagger, 300 to 450ms, nothing choreographed. The explainer figures are the exception, their motion *is* the content and should stay as it is.
- Animate `transform` and `opacity` only. Never `width`, `height`, `top`, `left`.
- Every animation wrapped in `@media (prefers-reduced-motion: no-preference)`, with the final state rendered immediately otherwise.
- Touch targets: 44px minimum on any control, 8px minimum gap. The DIP-switch toggles and the tool number-steppers are the ones most likely failing this. Check them first.

---

## 3. The psychology, applied deliberately

Each of these is a named mechanism with a specific implementation. Build them as listed. Do **not** add gamification: no streaks, no badges, no confetti, no points. The reward here is competence, the feeling of understanding something you did not understand this morning.

**Curiosity gap (Loewenstein).** Every Learn card already carries two or three real questions. Promote the strongest one to be the visible hook, styled distinctly, above or beside the title. The card becomes: question, then title, then one line of what you get. A gap the reader wants closed, opened before the label lands.

**Zeigarnik and goal-gradient.** The chain of 25 is a completion structure with no completion signal. Add a persistent, quiet chain indicator: which of the seven stages this page is in, and position within it. Store read state in `localStorage` only, never a server, never a cookie, and label it plainly ("stored on this device, nothing is sent"). Start the counter non-zero for anyone landing from the homepage (endowed progress): reading the homepage chain summary counts as stage 0 complete.

**Peak-end rule.** Rebuild the ending of every content page. It currently ends on admin. It should end on: the one thing you now know that you did not before (one sentence, drawn from existing text, not newly written marketing), then the next link in the chain, then the correction/GitHub link demoted below that. The peak is the interactive figure, keep it where it is. The ending is the last 200px of the page and it is currently wasted on all 25 pages.

**Von Restorff (isolation).** In every calculator, exactly one number is the answer. Right now results and inputs are visually equal. Give the answer a distinct treatment: larger, mono, tabular, on `--surface-sunken`, with the unit set smaller beside it. Everything else on that card recedes. One answer per tool, no exceptions, even where the tool outputs several values (pick the one the person came for, subordinate the rest).

**Recognition over recall.** Regroup the nav into three labelled clusters that match the model already on the homepage: **Learn** (the chain, Experience architecture), **Look up** (Protocols, Standards, Software, Hardware, Glossary, Signals, Ports), **Work it out** (all tools, Network, RF). Search becomes an input affordance, not a nav item that links to home. On mobile, this collapses to three tabs, not nine.

**Fluency.** The `/protocols/` group labels and licence values must be mapped to human strings at the presentation layer, with the machine value kept in `data-*` or `title` for anyone who wants it. `audio-transport` becomes "Audio transport". `open-free-registration` becomes "Open standard, free registration". `proprietary-closed` becomes "Proprietary, closed". Build one shared label map, use it everywhere, never inline the mapping in a template.

**Autonomy (self-determination theory).** "Free, no account, no tracking" is currently one line of small text. It is a genuine differentiator and a real reason people trust the site. Give it a visible, permanent, understated home in the header or the immediate sub-header. Not a banner, not a badge. One line, always there.

**Relatedness and status.** "Your handle goes on the entry" is buried in a contribution paragraph. Surface contributor attribution on the entries themselves where it exists. Add a lightweight contributors strip to the homepage. This is the mechanism that turns readers into maintainers.

**Competence feedback, not gamification.** When a reader finishes an explainer, the ending block states what they can now do, in the site's existing voice, sourced from existing text. Never "Great job!". Never a percentage.

**Answer-first (the four Answers pages).** `/interop/`, `/compare/`, `/ports/`, `/rf/` must never render empty. Each loads with:
- a real worked example already filled in and answered (pick a common, genuinely useful pair, for example an sACN console to an Art-Net node),
- three to five one-tap example chips of the most common real queries,
- and only then the empty controls, positioned below the worked example.
Every query state must be URL-addressable so a result can be pasted into a production WhatsApp group. This is the single highest-leverage change on the site.

---

## 4. Phases

Do these in order. Stop and report at the end of each phase. Do not begin the next until told.

### Phase 0 — Audit and report, no code

Report back with:
- Detected stack and build system, with evidence (`package.json`, config files, template engine).
- Where styles actually live. Is there a token layer already, or raw values in components?
- Current font loading strategy, self-hosted or CDN, and the byte cost.
- Measured contrast ratios for every existing text-on-background pair, both modes, flagging every failure against 4.5:1 body and 3:1 UI.
- Every touch target under 44px, with file and line.
- Whether `prefers-reduced-motion` is currently honoured in the explainer figures, per figure.
- Lighthouse or equivalent on `/`, `/learn/`, `/tools/`, `/protocols/`, mobile profile: LCP, CLS, TBT.
- Anything in this brief that is already implemented, so we do not redo it.
- Anything in this brief you think is wrong, with your reasoning. Push back here rather than silently complying.

### Phase 1 — Token layer

Semantic tokens for colour, type scale, spacing, radius, shadow, motion duration and easing. Light and dark. Replace raw values in components with tokens. No visual change intended in this phase beyond fixing contrast failures found in Phase 0. Verify visually that nothing moved.

### Phase 2 — Navigation and shell

Three-cluster nav, mobile three-tab collapse, search as an affordance, persistent "free, no account, no tracking" line, skip link, correct landmark roles, focus order verified by keyboard alone with no mouse.

### Phase 3 — The four Answers pages

Worked-example default state, example chips, URL-addressable queries, result-shaped output. Highest leverage, ship it before Learn.

### Phase 4 — Learn

Question-first cards, chain spine with position, `localStorage` progress with a plain-language note and a clear reset, rebuilt page endings using the peak-end structure, reading time per card.

### Phase 5 — Tools

Sticky category rail, filter, recently-used (localStorage), per-tool permalinks, copy-result, isolated primary answer per calculator, mobile-first control sizing.

### Phase 6 — Index pages

Human labels via the shared map, `/protocols/`, `/standards/`, `/signals/` scanning improvements, contributor attribution surfaced.

### Phase 7 — Motion and final pass

Scroll-reveal and stagger at standard tier, reduced-motion audit, full pre-delivery checklist.

---

## 5. Pre-delivery checklist

Every item verified, not assumed. State the evidence.

- [ ] SVG icons only, no emoji as icons
- [ ] All text 4.5:1, all UI boundaries and focus rings 3:1, both modes
- [ ] Focus visible on every interactive element, never removed
- [ ] Full keyboard operation of every calculator, every select, every toggle
- [ ] Touch targets 44px minimum, 8px minimum gap
- [ ] `prefers-reduced-motion` honoured everywhere including explainer figures
- [ ] Responsive verified at 375, 768, 1024, 1440
- [ ] No horizontal scroll at any width, zoom not disabled
- [ ] CLS below 0.1, space reserved for every figure and result block
- [ ] Tools still work offline after first load, verified with network disabled
- [ ] No tracking, no third-party requests, verified in the network panel
- [ ] Every calculator returns identical numbers to before, verified against the existing test suite
- [ ] Prose unchanged, verified by diff

---

## 6. Persist the decisions

Write the resolved design system to `design-system/showstack/MASTER.md` in the repo: tokens with measured contrast ratios, type scale, spacing scale, motion tiers, the reserved-colour rules, the label map, and the deviations from the ui-ux-pro-max database defaults with the reasoning. Page-specific overrides go in `design-system/showstack/pages/`. Anyone picking this up in six months should not have to re-derive any of it.
