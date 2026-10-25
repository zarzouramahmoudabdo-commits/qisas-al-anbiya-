/* Service worker: الملفات جوه الـ APK (تشتغل أوفلاين من أول فتح) + تحديث تلقائي من الموقع. */
const REMOTE = 'https://zarzouramahmoudabdo-commits.github.io/qisas-al-anbiya-/';
const CACHE = 'qisas-live-v1';
const TIMEOUT = 3000;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function remoteUrl(url) {
  const scope = new URL(self.registration.scope).pathname;
  const rel = url.pathname.startsWith(scope) ? url.pathname.slice(scope.length) : url.pathname.replace(/^\//, '');
  return REMOTE + rel + url.search;
}

function fetchRemote(href, init) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  return fetch(href, Object.assign({ cache: 'reload', signal: ctl.signal }, init || {}))
    .finally(() => clearTimeout(timer));
}

async function handle(e, req, url) {
  const cache = await caches.open(CACHE);
  const key = url.origin + url.pathname;
  const hit = await cache.match(key);
  const refresh = () => fetchRemote(remoteUrl(url)).then(r => {
    if (r && r.ok) cache.put(key, r.clone());
    return r;
  });
  if (hit) {
    e.waitUntil(refresh().catch(() => {}));
    return hit;
  }
  try {
    const r = await refresh();
    if (r && r.ok) return r;
  } catch (err) { }
  return fetch(req);
}

async function fonts(req) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req);
  const net = fetch(req).then(r => {
    if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone());
    return r;
  }).catch(() => hit);
  return (await (hit || net)) || Response.error();
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin !== location.origin) {
    if (/(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) e.respondWith(fonts(req));
    return;
  }
  if (req.mode === 'navigate') return;
  if (url.pathname.endsWith('/sw.js')) return;

  if (url.pathname.endsWith('/version.json')) {
    e.respondWith(
      fetchRemote(remoteUrl(url), { cache: 'no-store' })
        .then(r => (r && r.ok ? r : Response.error()))
        .catch(() => Response.error())
    );
    return;
  }
  e.respondWith(handle(e, req, url));
});
