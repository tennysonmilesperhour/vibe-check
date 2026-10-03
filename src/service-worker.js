// The service worker: lets the app open without a connection, from the files
// of the build it came with. It keeps app files only, never anyone's records.
// Sign-in, records and other sites always go straight to the network.
//
// vite.config.js builds this into /sw.js and fills in the values below.
// To switch it off for everyone, deploy a version whose install handler calls
// self.skipWaiting() and whose activate handler deletes every vibe-app- cache
// and the vibe-meta cache, then calls self.registration.unregister().

const BUILD = __SW_BUILD__;
// Kept from the start: everything index.html loads, the fonts, and the pages
// that need no records (Support now, help now, Practice) with the policies.
const PRECACHE = __SW_PRECACHE__;
// Every file of this build under /assets/. A page kept from an earlier build
// stays kept when its file hasn't changed.
const ASSETS = new Set(__SW_ASSETS__);
// The page's own script, to check the kept page belongs to this build.
const ENTRY = __SW_ENTRY__;
const CACHE = `vibe-app-${BUILD}`;
// Which builds have run here, newest last.
const META = 'vibe-meta';
const SHELL = '/index.html';
const PRECACHED = new Set(PRECACHE);
// On a connection that's up but passes nothing, how long a page or a file may
// take before the kept copy is used, or the request fails.
const PAGE_WAIT_MS = 4000;
const FILE_WAIT_MS = 8000;

const within = (ms, promise) => Promise.race([promise, new Promise((_, reject) => { setTimeout(() => reject(new Error('No answer in time.')), ms); })]);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const page = await fetch(SHELL, { cache: 'no-store' });
      // A deploy between this worker's download and now would serve another
      // build's page. Installing fails instead, and the browser tries again.
      if (!page.ok || !(await page.clone().text()).includes(ENTRY)) throw new Error('The app page belongs to another build.');
      const cache = await caches.open(CACHE);
      await cache.put(SHELL, page);
      await cache.addAll(PRECACHE);
    } catch (error) {
      // A build only part kept is never taken for one that ran.
      await caches.delete(CACHE);
      throw error;
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const meta = await caches.open(META);
    const recorded = await meta.match('/builds');
    const builds = [...(recorded ? await recorded.json() : []).filter((build) => build !== BUILD), BUILD].slice(-2);
    await meta.put('/builds', new Response(JSON.stringify(builds)));
    // This build's files and the build that ran before it, so a page still
    // open from before a deploy can load the files it kept.
    const keep = new Set(builds.map((build) => `vibe-app-${build}`));
    const cache = await caches.open(CACHE);
    for (const name of (await caches.keys()).filter((key) => key.startsWith('vibe-app-') && key !== CACHE)) {
      const earlier = await caches.open(name);
      // Pages opened on an earlier build stay kept when their files haven't changed.
      for (const request of await earlier.keys()) {
        if (!ASSETS.has(new URL(request.url).pathname) || (await cache.match(request, { ignoreVary: true }))) continue;
        const response = await earlier.match(request, { ignoreVary: true });
        if (response) await cache.put(request, response);
      }
      if (!keep.has(name)) await caches.delete(name);
    }
    // Page requests start while the worker wakes, not after.
    await self.registration.navigationPreload?.enable();
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') event.respondWith(openPage(event));
  else if (url.pathname.startsWith('/assets/') || PRECACHED.has(url.pathname + url.search)) event.respondWith(appFile(event));
});

// The network first, so a new deploy arrives as it always has. Without a
// connection, or with one that doesn't answer in time, this build's page,
// which then opens the address it was asked for.
async function openPage(event) {
  const network = (async () => (await event.preloadResponse) || fetch(event.request))();
  // The page request keeps going after the kept copy is used, and is let go once it settles.
  event.waitUntil(network.catch(() => {}));
  try {
    return await within(PAGE_WAIT_MS, network);
  } catch {
    const page = (await caches.match(SHELL, { cacheName: CACHE })) || (await caches.match(SHELL));
    // Nothing kept yet: wait for the network after all.
    return page || network;
  }
}

// Built files never change under the same name, so a kept copy is always
// right, whatever headers the request carried (scripts and fonts are requested
// with an Origin header the kept copy was fetched without).
async function appFile(event) {
  const { request } = event;
  const kept = (await caches.match(request, { cacheName: CACHE, ignoreVary: true })) || (await caches.match(request, { ignoreVary: true }));
  if (kept) return kept;
  const response = await within(FILE_WAIT_MS, fetch(request));
  if (response.ok && new URL(request.url).pathname.startsWith('/assets/')) {
    const copy = response.clone();
    event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
  }
  return response;
}
