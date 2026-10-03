// The service worker (src/service-worker.js), run as built: its values filled
// in, in a sandbox with an in-memory cache store and a stand-in network.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const TEMPLATE = readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
const ORIGIN = 'https://vibe.example';
const href = (request) => new URL(typeof request === 'string' ? request : request.url, ORIGIN).href;

class MemoryCache {
  entries = new Map();
  async put(request, response) { this.entries.set(href(request), response); }
  async match(request) { return this.entries.get(href(request))?.clone(); }
  async keys() { return [...this.entries.keys()].map((url) => new Request(url)); }
  async addAll(urls) {
    for (const url of urls) {
      const response = await this.network(href(url));
      if (!response.ok) throw new TypeError(`${url} answered ${response.status}`);
      await this.put(url, response);
    }
  }
}

class MemoryCaches {
  stores = new Map();
  constructor(network) { this.network = network; }
  async open(name) {
    if (!this.stores.has(name)) this.stores.set(name, Object.assign(new MemoryCache(), { network: this.network }));
    return this.stores.get(name);
  }
  async keys() { return [...this.stores.keys()]; }
  async delete(name) { return this.stores.delete(name); }
  async match(request, { cacheName } = {}) {
    for (const [name, cache] of this.stores) {
      if (cacheName && name !== cacheName) continue;
      const found = await cache.match(request);
      if (found) return found;
    }
    return undefined;
  }
  paths(name) { return [...(this.stores.get(name)?.entries.keys() || [])].map((url) => new URL(url).pathname).sort(); }
}

/**
 * A network serving a build's files, every other address outside /assets/
 * answered with the app's page (vercel.json's rewrite). Offline, every
 * request fails; with `hang`, none answers.
 */
function network(files, state = { offline: false, hang: false }) {
  const fetch = async (input) => {
    if (state.offline) throw new TypeError('Failed to fetch');
    if (state.hang) return new Promise(() => {});
    const { pathname } = new URL(href(input));
    if (pathname in files) return new Response(files[pathname], { status: 200 });
    return pathname.startsWith('/assets/') ? new Response('missing', { status: 404 }) : new Response(files['/index.html'], { status: 200 });
  };
  return Object.assign(fetch, { state });
}

function worker({ build, precache, assets = precache, entry = '/assets/index-a.js', caches, fetch }) {
  const source = TEMPLATE
    .replace('__SW_BUILD__', JSON.stringify(build))
    .replace('__SW_PRECACHE__', JSON.stringify(precache))
    .replace('__SW_ASSETS__', JSON.stringify(assets))
    .replace('__SW_ENTRY__', JSON.stringify(entry));
  const listeners = {};
  const self = {
    addEventListener: (type, listener) => { listeners[type] = listener; },
    location: new URL(ORIGIN),
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
    registration: { navigationPreload: { enable: async () => {} } },
  };
  // Waits are a thousand times shorter, so the timing tests run quickly.
  const shortTimeout = (callback, ms) => setTimeout(callback, ms / 1000);
  vm.runInContext(source, vm.createContext({ self, caches, fetch, Response, Request, URL, Set, Promise, setTimeout: shortTimeout }));
  return {
    async event(type, fields = {}) {
      const waits = [];
      let response;
      listeners[type]({ ...fields, waitUntil: (promise) => waits.push(promise), respondWith: (promise) => { response = promise; } });
      const settled = await Promise.allSettled(waits);
      const failed = settled.find((result) => result.status === 'rejected');
      if (failed) throw failed.reason;
      return response;
    },
    async request(url, { mode = 'cors', preloadResponse = Promise.resolve(undefined) } = {}) {
      let response;
      // A plain request: Node's Request won't take a navigation's mode.
      listeners.fetch({ request: { url: href(url), method: 'GET', mode }, preloadResponse, waitUntil: () => {}, respondWith: (promise) => { response = promise; } });
      return response && (await response);
    },
  };
}

const PAGE = '<script type="module" src="/assets/index-a.js"></script>';
const B1 = { '/index.html': PAGE, '/assets/index-a.js': 'entry', '/assets/People-p.js': 'people', '/assets/Cosmos-c1.js': 'cosmos one', '/favicon.svg': 'icon' };

async function installed({ caches, fetch, build = '1', precache = ['/assets/index-a.js', '/favicon.svg'], assets = Object.keys(B1).filter((path) => path.startsWith('/assets/')) }) {
  const sw = worker({ build, precache, assets, caches, fetch });
  await sw.event('install');
  await sw.event('activate');
  return sw;
}

describe('the service worker', () => {
  it("keeps its build's page and files when it installs", async () => {
    const fetch = network(B1);
    const caches = new MemoryCaches(fetch);
    await installed({ caches, fetch });
    expect(caches.paths('vibe-app-1')).toEqual(['/assets/index-a.js', '/favicon.svg', '/index.html']);
  });

  it("fails to install, and keeps nothing, when the page belongs to another build", async () => {
    const fetch = network({ ...B1, '/index.html': '<script type="module" src="/assets/index-z.js"></script>' });
    const caches = new MemoryCaches(fetch);
    const sw = worker({ build: '1', precache: ['/assets/index-a.js'], caches, fetch });
    await expect(sw.event('install')).rejects.toThrow('another build');
    expect(await caches.keys()).toEqual([]);
  });

  it('fails to install, and keeps nothing, when a file is missing', async () => {
    const fetch = network(B1);
    const caches = new MemoryCaches(fetch);
    const sw = worker({ build: '1', precache: ['/assets/index-a.js', '/assets/gone.js'], caches, fetch });
    await expect(sw.event('install')).rejects.toThrow('404');
    expect(await caches.keys()).toEqual([]);
  });

  it('serves pages from the network, and its own page without a connection', async () => {
    const fetch = network(B1);
    const caches = new MemoryCaches(fetch);
    const sw = await installed({ caches, fetch });
    expect(await (await sw.request('/People', { mode: 'navigate' })).text()).toBe(PAGE);
    fetch.state.offline = true;
    expect(await (await sw.request('/People', { mode: 'navigate' })).text()).toBe(PAGE);
  });

  it("uses its page when the network doesn't answer in time", async () => {
    const fetch = network(B1);
    const caches = new MemoryCaches(fetch);
    const sw = await installed({ caches, fetch });
    fetch.state.hang = true;
    expect(await (await sw.request('/support-now', { mode: 'navigate' })).text()).toBe(PAGE);
  });

  it("uses the browser's early page request when there is one", async () => {
    const fetch = network(B1);
    const caches = new MemoryCaches(fetch);
    const sw = await installed({ caches, fetch });
    const preloaded = new Response('preloaded page');
    expect(await (await sw.request('/Today', { mode: 'navigate', preloadResponse: Promise.resolve(preloaded) })).text()).toBe('preloaded page');
  });

  it('keeps a page once opened, and serves it without a connection', async () => {
    const fetch = network(B1);
    const caches = new MemoryCaches(fetch);
    const sw = await installed({ caches, fetch });
    expect(await (await sw.request('/assets/People-p.js')).text()).toBe('people');
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    fetch.state.offline = true;
    expect(await (await sw.request('/assets/People-p.js')).text()).toBe('people');
  });

  it('leaves records, sign-in and other sites to the network', async () => {
    const fetch = network(B1);
    const caches = new MemoryCaches(fetch);
    const sw = await installed({ caches, fetch });
    expect(await sw.request('https://project.supabase.co/rest/v1/people')).toBeUndefined();
    expect(await sw.request('/version.json')).toBeUndefined();
  });

  it("carries a kept page over to the next build when its file hasn't changed, and drops one that changed", async () => {
    const fetch = network(B1);
    const caches = new MemoryCaches(fetch);
    const first = await installed({ caches, fetch });
    await first.request('/assets/People-p.js');
    await first.request('/assets/Cosmos-c1.js');
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    // The next build changes Cosmos only.
    const files = { ...B1, '/assets/Cosmos-c2.js': 'cosmos two' };
    delete files['/assets/Cosmos-c1.js'];
    const next = network(files);
    await installed({ caches, fetch: next, build: '2', assets: ['/assets/index-a.js', '/assets/People-p.js', '/assets/Cosmos-c2.js'] });
    expect(caches.paths('vibe-app-2')).toEqual(['/assets/People-p.js', '/assets/index-a.js', '/favicon.svg', '/index.html']);
  });

  it('keeps the build that ran before for a page still open, and lets go of older ones', async () => {
    const fetch = network(B1);
    const caches = new MemoryCaches(fetch);
    await installed({ caches, fetch, build: '1' });
    await installed({ caches, fetch, build: '2' });
    expect((await caches.keys()).sort()).toEqual(['vibe-app-1', 'vibe-app-2', 'vibe-meta']);
    await installed({ caches, fetch, build: '3' });
    expect((await caches.keys()).sort()).toEqual(['vibe-app-2', 'vibe-app-3', 'vibe-meta']);
  });

  it('lets go of a build that never ran, rather than the one before', async () => {
    const fetch = network(B1);
    const caches = new MemoryCaches(fetch);
    await installed({ caches, fetch, build: '1' });
    // Build 2's install failed partway, after its cache was named.
    const half = await caches.open('vibe-app-2');
    await half.put('/index.html', new Response(PAGE));
    await installed({ caches, fetch, build: '3' });
    expect((await caches.keys()).sort()).toEqual(['vibe-app-1', 'vibe-app-3', 'vibe-meta']);
  });
});
