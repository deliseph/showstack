/**
 * showstack service worker.
 *
 * The site's own description of its user is "a phone in a loading dock", and
 * until now "works offline once loaded" was true only until they reloaded.
 * This makes that claim honest.
 *
 * Three deliberate choices:
 *
 * 1. The precache is small - the shell, the tools, the four answer pages and
 *    the fonts. About half a megabyte. The full site is 33 MB and precaching
 *    it would be a hostile thing to do to somebody's data allowance.
 *
 * 2. Everything else is cached as it is visited, so the pages you actually
 *    read stay available. Stale-while-revalidate: you get the cached copy
 *    instantly and a fresh one lands for next time.
 *
 * 3. The 1.2 MB search index is opt-in. It is the single most useful thing to
 *    have in a basement, and it is also the single biggest download, so the
 *    page asks rather than deciding for you.
 *
 * The API JSON is network-first on purpose. This is a dataset that gets
 * corrected, and serving a stale port number from cache is worse than
 * serving nothing.
 *
 * No analytics, no beacons, nothing phones home. A service worker is a
 * plausible place to hide that, so: it is not here.
 */
const VERSION = '__SW_VERSION__'
const SHELL = `showstack-shell-${VERSION}`
const PAGES = `showstack-pages-${VERSION}`
const ASSETS = 'showstack-assets'

/** What has to work with no signal at all. */
const PRECACHE = [
  '/',
  '/tools/',
  '/field/',
  '/learn/',
  '/build/',
  '/interop/',
  '/ports/',
  '/rf/',
  '/compare/',
  '/offline/',
  '/assets/fonts/plex-sans-latin.woff2',
  '/assets/fonts/jetbrains-mono-latin.woff2',
  // The manifest icons. An installed app that has to reach the network to draw
  // its own icon is not installed in any useful sense, and the browser fetches
  // these off its own bat once the manifest parses - which, on a device that
  // went offline in between, is a request nothing asked for and nothing serves.
  // Four small files, and it makes "works with no signal" true of the icon too.
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/icon-maskable.png',
  '/assets/icons/apple-touch.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(SHELL)
    // Individually, so one 404 during a deploy does not fail the whole install.
    await Promise.all(PRECACHE.map((u) => cache.add(u).catch(() => {})))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keep = new Set([SHELL, PAGES, ASSETS])
    for (const key of await caches.keys()) {
      if (key.startsWith('showstack-') && !keep.has(key)) await caches.delete(key)
    }
    await self.clients.claim()
  })())
})

const isFontOrIcon = (url) => url.pathname.startsWith('/assets/')
const isApi = (url) => url.pathname.startsWith('/api/') || url.pathname === '/showstack.json'

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Fonts and icons never change under a given name: cache first, forever.
  if (isFontOrIcon(url)) {
    e.respondWith((async () => {
      const cached = await caches.match(req)
      if (cached) return cached
      const res = await fetch(req)
      if (res.ok) (await caches.open(ASSETS)).put(req, res.clone())
      return res
    })())
    return
  }

  // The dataset is corrected over time. A stale port number is worse than an
  // error, so the network wins and the cache is only a fallback.
  if (isApi(url)) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req)
        if (res.ok) (await caches.open(PAGES)).put(req, res.clone())
        return res
      } catch {
        const cached = await caches.match(req)
        if (cached) return cached
        throw new Error('offline and not cached')
      }
    })())
    return
  }

  // Pages: answer from cache instantly, refresh in the background.
  e.respondWith((async () => {
    const cached = await caches.match(req)
    const network = fetch(req).then(async (res) => {
      if (res.ok) (await caches.open(PAGES)).put(req, res.clone())
      return res
    }).catch(() => null)
    if (cached) { e.waitUntil(network); return cached }
    const res = await network
    if (res) return res

    // Offline and never visited. Only a page navigation gets a fallback
    // document - returning HTML for a failed JSON or asset request would be
    // a lie that breaks things quietly further down.
    if (req.mode !== 'navigate') {
      return new Response('', { status: 504, statusText: 'Offline' })
    }
    // And the fallback says what happened rather than silently serving the
    // home page under the URL the reader asked for.
    const offline = await caches.match('/offline/')
    if (offline) return offline
    return new Response(
      '<!doctype html><meta charset=utf-8><title>Offline</title>' +
      '<p>Offline, and this page has not been saved on this device.',
      { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } })
  })())
})

/**
 * Bulk save, triggered from the page. Used for the search index and the
 * explainers - the two things worth having in full when there is no signal.
 */
self.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'cache-urls') return
  const urls = Array.isArray(e.data.urls) ? e.data.urls : []
  e.waitUntil((async () => {
    const cache = await caches.open(PAGES)
    let done = 0
    for (const u of urls) {
      try { await cache.add(u) } catch {}
      done++
      if (e.source) e.source.postMessage({ type: 'cache-progress', done, total: urls.length })
    }
    if (e.source) e.source.postMessage({ type: 'cache-done', total: urls.length })
  })())
})
