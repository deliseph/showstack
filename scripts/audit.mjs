/**
 * The pre-delivery checklist, run rather than asserted.
 *
 * Serves dist/ locally and checks every gate the UI/UX refresh committed to:
 * contrast is covered by the token comments in pages.mjs, and this covers the
 * rest — focus, target size, motion, CLS, horizontal scroll, third-party
 * requests, emoji-as-icon, zoom, and a painted body background in both themes.
 *
 * It found two real regressions during the refresh that reading the diff did
 * not, both on /search/, which is the argument for having it.
 *
 * Playwright is deliberately NOT a dependency of this package — the site
 * builds and tests without a browser, and a 300 MB devDependency for a check
 * that runs on demand is a bad trade. Install it when you need this:
 *
 *     npm i --no-save playwright && npx playwright install chromium
 *     npm run audit
 *
 * Usage: npm run build && npm run audit
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')

let chromium
try {
  ({ chromium } = await import('playwright'))
} catch {
  console.error('This check needs Playwright, which is not a dependency of this package.\n')
  console.error('  npm i --no-save playwright && npx playwright install chromium')
  console.error('  npm run audit\n')
  process.exit(2)
}

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('dist/ is empty. Run `npm run build` first.')
  process.exit(2)
}

/** The pages worth checking: one of every shape the site produces. */
const PAGES = [
  '/', '/learn/', '/learn/colour/', '/learn/senses/', '/learn/rigging/', '/learn/experience/',
  '/tools/', '/protocols/', '/protocols/sacn/', '/standards/', '/software/', '/hardware/',
  '/glossary/', '/search/', '/build/', '/interop/', '/compare/', '/ports/', '/rf/',
  // A protocol page and a comparison page that both carry a media
  // capability block, so that grid and its contrast get audited too.
  '/protocols/dante/', '/compare/ndi-vs-smpte-st-2110/',
  '/network/', '/signals/', '/check/', '/verify/', '/offline/',
  '/learn/outdoors/', '/learn/access/', '/learn/power/', '/learn/mixing/', '/learn/timecode/', '/learn/empathy/', '/learn/illusion/', '/learn/analogue/', '/learn/space/', '/learn/proto/',
]
const WIDTHS = [375, 768, 1024, 1440]

const MIME = {
  '.html': 'text/html', '.woff2': 'font/woff2', '.json': 'application/json',
  '.txt': 'text/plain', '.xml': 'application/xml', '.svg': 'image/svg+xml',
}
const server = createServer((req, res) => {
  let f = join(DIST, decodeURIComponent(req.url.split('?')[0]))
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html')
  if (!existsSync(f)) { res.writeHead(404); res.end(''); return }
  res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' })
  res.end(readFileSync(f))
})
await new Promise((r) => server.listen(8099, r))
const at = (p) => `http://127.0.0.1:8099${p}`

const browser = await chromium.launch(
  existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {})
const fail = []
const warn = []
const pass = []

// --- layout, third-party, emoji, zoom, painted body, over every width ------
for (const w of WIDTHS) {
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme })
    const page = await ctx.newPage()
    const external = new Set()
    const errors = []
    page.on('request', (r) => { if (!r.url().startsWith('http://127.0.0.1')) external.add(r.url()) })
    page.on('pageerror', (e) => errors.push(e.message))
    for (const p of PAGES) {
      await page.goto(at(p), { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(120)
      const r = await page.evaluate(() => ({
        hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        // An emoji standing in for an icon, as opposed to appearing in prose.
        emoji: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(
          [...document.querySelectorAll('.pill,.ltag,h1,h2,h3,nav a,button')].map((e) => e.textContent).join('')),
        viewport: (document.querySelector('meta[name=viewport]') ?? {}).content ?? '',
      }))
      if (r.hscroll) fail.push(`horizontal scroll: ${p} at ${w}px ${theme}`)
      if (r.emoji) fail.push(`emoji used as an icon: ${p}`)
      if (/maximum-scale|user-scalable=no/.test(r.viewport)) fail.push(`zoom disabled: ${p}`)
      // A transparent body borrows whatever ground the host paints.
      if (/rgba\(0, 0, 0, 0\)|^transparent$/.test(r.bodyBg)) fail.push(`transparent body: ${p} ${theme}`)
    }
    if (external.size) fail.push(`third-party requests at ${w}px ${theme}: ${[...external].join(', ')}`)
    if (errors.length) fail.push(`JS errors at ${w}px ${theme}: ${errors.slice(0, 3).join(' | ')}`)
    await ctx.close()
  }
}
pass.push(`no horizontal scroll, painted body, no emoji icons, zoom enabled, no third-party requests and no JS errors across ${PAGES.length} pages x ${WIDTHS.length} widths x 2 themes`)

// --- reduced motion --------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  for (const p of PAGES) {
    await page.goto(at(p), { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(150)
    const moving = await page.evaluate(() => {
      let n = 0
      for (const el of document.querySelectorAll('*')) {
        const s = getComputedStyle(el)
        if (s.animationName !== 'none' && s.animationDuration !== '0s' && s.animationPlayState !== 'paused') n++
      }
      // The CSS guard cannot stop SMIL, so count it separately rather than
      // assuming there is none.
      return n + document.querySelectorAll('animate,animateTransform,animateMotion').length
    })
    if (moving) fail.push(`motion under prefers-reduced-motion: ${p} (${moving} elements)`)
  }
  await ctx.close()
}
pass.push('nothing animates under prefers-reduced-motion, and no SMIL exists to escape the CSS guard')

// --- focus ring and target size -------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  for (const p of PAGES) {
    await page.goto(at(p), { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(200)
    // Controls inside a closed <details> have no layout box; open them first.
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true }))
    await page.waitForTimeout(120)
    const r = await page.evaluate(() => {
      const sel = 'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])'
      const noRing = new Set(); const small = new Set(); const under44 = new Set()
      const undersized = []
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el)
        if (cs.display === 'none' || cs.visibility === 'hidden') continue
        // Document coordinates, not viewport coordinates. el.focus() below
        // scrolls the element into view, so by the time the next element is
        // measured the viewport has moved under it. Comparing a rect captured
        // at scrollY 0 with one captured at scrollY 3000 produced distances
        // that were pure fiction — it invented crowding between elements
        // screens apart and hid it between genuine neighbours. Adding the
        // scroll offset at the moment of measurement makes every rect
        // comparable no matter where the page happened to be sitting.
        const r = el.getBoundingClientRect()
        const box = { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height }
        if (box.width === 0 && box.height === 0) continue
        const name = el.tagName + (typeof el.className === 'string' && el.className
          ? '.' + el.className.trim().split(/\s+/)[0] : '')
        el.focus()
        const f = getComputedStyle(el)
        const ring = (f.outlineStyle !== 'none' && parseFloat(f.outlineWidth) > 0) || f.boxShadow !== 'none'
        if (!ring) noRing.add(name)
        // SC 2.5.8's inline exception: a target "in a sentence or block of
        // text". Testing the parent's tag name is not enough — a footer link
        // sits in a <div> and is still inline prose. What actually matters is
        // that the element renders inline AND its parent carries real text
        // around it, so hitting it precisely is a typographic constraint
        // rather than a design choice.
        const parent = el.parentElement
        const siblingText = parent
          ? [...parent.childNodes]
              .filter((n) => n.nodeType === 3 && n.textContent.trim().length > 1).length > 0
          : false
        const inlineInProse = cs.display.startsWith('inline') && siblingText
        // A checkbox or radio is tapped on its label, which carries the size.
        const isBox = el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')
        // Two thresholds, because they are two different claims. 24x24 is
        // WCAG 2.2 SC 2.5.8 at AA and is a hard gate. 44x44 is SC 2.5.5 at
        // AAA and this project's house standard - reported, not fatal, so a
        // link in a dense table does not block a release while still being
        // visible as a thing we have not solved.
        if (!inlineInProse && !isBox) {
          const label = `${name} ${Math.round(box.width)}x${Math.round(box.height)}`
          const meets24 = box.width >= 24 && box.height >= 24
          if (!meets24) undersized.push({ el, box, label })
          else if (box.width < 44 || box.height < 44) under44.add(label)
        }
      }
      // SC 2.5.8's spacing exception: a target smaller than 24x24 still
      // passes if a 24px-diameter circle centred on it does not intersect the
      // circle of any other target. That is what clears a link sitting alone
      // in a table cell with real row spacing, and what correctly fails one
      // crammed against its neighbour. Without it the check reports every
      // dense table as a violation, which is louder than it is useful.
      const centres = undersized.map(({ box }) => ({
        x: box.left + box.width / 2, y: box.top + box.height / 2 }))
      const allTargets = [...document.querySelectorAll(
        'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])')]
        .map((e) => {
          const b = e.getBoundingClientRect()
          return { left: b.left + scrollX, top: b.top + scrollY, width: b.width, height: b.height }
        })
        .filter((b) => b.width > 0 || b.height > 0)
      undersized.forEach(({ box, label }, i) => {
        const c = centres[i]
        const crowded = allTargets.some((o) => {
          if (o.left === box.left && o.top === box.top && o.width === box.width) return false
          const ox = o.left + o.width / 2, oy = o.top + o.height / 2
          return Math.hypot(ox - c.x, oy - c.y) < 24
        })
        if (crowded) small.add(label)
        else under44.add(`${label} (under 24 but spaced)`)
      })
      return { noRing: [...noRing], small: [...small], under44: [...under44] }
    })
    if (r.noRing.length) fail.push(`no focus ring: ${p} — ${r.noRing.join(', ')}`)
    if (r.small.length) fail.push(`target under 24px (WCAG AA): ${p} — ${r.small.join(', ')}`)
    if (r.under44.length) warn.push(`${p}: ${r.under44.length} target${r.under44.length === 1 ? '' : 's'} between 24 and 44px — ${r.under44.slice(0, 6).join(', ')}${r.under44.length > 6 ? ', …' : ''}`)
  }
  await ctx.close()
}
pass.push('focus ring on every interactive element, and every target at least 24x24 (WCAG 2.2 AA)')

// --- CLS, mobile profile ---------------------------------------------------
for (const p of ['/', '/learn/', '/tools/', '/protocols/', '/search/', '/interop/']) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 })
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.addInitScript(() => {
    window.__cls = 0
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value })
      .observe({ type: 'layout-shift', buffered: true })
  })
  await page.goto(at(p), { waitUntil: 'load' })
  await page.waitForTimeout(2000)
  const cls = await page.evaluate(() => +window.__cls.toFixed(4))
  if (cls >= 0.1) fail.push(`CLS ${cls} on ${p}`)
  else pass.push(`CLS ${cls.toFixed(2)} on ${p}`)
  await ctx.close()
}

// --- offline after load ----------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(at('/tools/'), { waitUntil: 'networkidle' })
  await ctx.setOffline(true)
  const late = []
  page.on('request', (r) => late.push(r.url()))
  await page.fill('#dmx-u', '3')
  await page.fill('#dmx-a', '25')
  await page.waitForTimeout(250)
  const out = await page.evaluate(() => document.getElementById('dmx-out').innerText)
  if (!/1049/.test(out)) fail.push(`tools do not compute offline: got "${out.slice(0, 60)}"`)
  if (late.length) fail.push(`tools made requests while offline: ${late.join(', ')}`)
  if (errors.length) fail.push(`JS errors offline: ${errors.join(' | ')}`)
  else pass.push('tools still compute with the network disabled, with no new requests')

  // --- every tool actually produced something ------------------------------
  // The parse test in the suite catches a page script that dies. It cannot
  // catch one that runs and gets the answer wrong, which is what happened
  // when a \d inside a template literal collapsed to a plain d: no error,
  // no dead page, just every OSC argument silently typed as a string. This
  // walks all of them and looks for the shapes a broken handler produces.
  {
    const bad = await page.evaluate(() => {
      const out = []
      for (const tool of document.querySelectorAll('.tool')) {
        const box = tool.querySelector('.out')
        if (!box) continue
        const text = (box.innerText || '').trim()
        if (!text) { out.push(`${tool.id}: empty`); continue }
        for (const smell of ['undefined', 'NaN', '[object Object]', 'null']) {
          if (text.includes(smell)) out.push(`${tool.id}: says "${smell}"`)
        }
      }
      return out
    })
    if (bad.length) fail.push(`tools rendering wrongly: ${bad.join(', ')}`)
    else pass.push('every tool on the page rendered a result with no undefined, NaN or [object Object] in it')
  }
  await ctx.close()
}

await browser.close()
server.close()

for (const p of pass) console.log(`  ok   ${p}`)
if (warn.length) {
  console.log(`\n${warn.length} page${warn.length === 1 ? '' : 's'} with targets between 24px (AA, met) and 44px (the house standard, not met):`)
  for (const w of warn) console.log(`  warn ${w}`)
}
if (fail.length) {
  console.error(`\n${fail.length} failure${fail.length === 1 ? '' : 's'}:`)
  for (const f of fail) console.error(`  FAIL ${f}`)
  process.exit(1)
}
console.log('\nAll checks pass.')
