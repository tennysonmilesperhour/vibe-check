// The service worker: lets the app open without a connection, from the files
// of the build it came with. It keeps app files only, never anyone's records.
// Sign-in, records and other sites always go straight to the network.
//
// vite.config.js builds this into /sw.js and fills in the three values below.
// To switch it off for everyone, deploy a version whose install handler calls
// self.skipWaiting() and whose activate handler deletes every vibe-app- cache
// and calls self.registration.unregister().

const BUILD = __SW_BUILD__;
// Files to keep from the start: the first load, fonts, icons, and the pages
// most worth having offline (Support now, help now, Practice, Patterns, People).
const PRECACHE = __SW_PRECACHE__;
// The page's own script, to check the cached page belongs to this build.
const ENTRY = __SW_ENTRY__;
const CACHE = `vibe-app-${BUILD}`;
const SHELL = '/index.html';
const PRECACHED = new Set(PRECACHE);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const page = await fetch(SHELL);
    // A deploy between this worker's download and now would cache another
    // build's page. Installing fails instead, and the browser tries again.
    if (!page.ok || !(await page.clone().text()).includes(ENTRY)) throw new Error('The app page belongs to another build.');
    await cache.put(SHELL, page);
    await cache.addAll(PRECACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // This build's files, and the newest earlier build's, so a page still open
    // from before a deploy can load the rest of its files.
    const builds = (await caches.keys()).filter((key) => key.startsWith('vibe-app-')).sort().reverse();
    const keep = new Set([CACHE, builds.find((key) => key !== CACHE)]);
    await Promise.all(builds.filter((key) => !keep.has(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') event.respondWith(openPage(request));
  else if (url.pathname.startsWith('/assets/') || PRECACHED.has(url.pathname + url.search)) event.respondWith(appFile(event));
});

// The network first, so a new deploy arrives as it always has; without a
// connection, this build's page, which then opens the address it was asked for.
async function openPage(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const page = (await caches.match(SHELL, { cacheName: CACHE })) || (await caches.match(SHELL));
    if (page) return page;
    throw error;
  }
}

// Built files never change under the same name, so a kept copy is always
// right, whatever headers the request carried (scripts and fonts are requested
// with an Origin header the kept copy was fetched without).
async function appFile(event) {
  const { request } = event;
  const kept = (await caches.match(request, { cacheName: CACHE, ignoreVary: true })) || (await caches.match(request, { ignoreVary: true }));
  if (kept) return kept;
  const response = await fetch(request);
  if (response.ok && new URL(request.url).pathname.startsWith('/assets/')) {
    const copy = response.clone();
    event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
  }
  return response;
}
