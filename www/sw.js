/* Service worker: الملفات جوه الـ APK (تشتغل أوفلاين من أول فتح) + تحديث تلقائي من الموقع.
   - ملف موجود في الكاش: يُعرض فورًا ويتحدّث في الخلفية من الموقع.
   - ملف مش في الكاش: يُجلب من الموقع (مهلة 3 ثواني)، وإن فشل يُستخدم الملف الموجود جوه الـ APK.
   - version.json: من الموقع فقط (لو مفيش نت يفشل بهدوء). */
const REMOTE = 'https://zarzouramahmoudabdo-commits.github.io/qisas-al-anbiya-/';
const CACHE = 'qisas-live-v1';
const TIMEOUT = 3000;

/* تنزيل كل ملفات الموقع في الخلفية (مرة واحدة، ثم الملفات المتغيّرة فقط) ليعمل كل شيء بدون إنترنت */
let busy = false;
async function precache() {
  if (busy) return; busy = true;
  try {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 8000);
    const m = await fetch(REMOTE + 'precache.json?' + Date.now(), { cache: 'no-store', signal: ctl.signal })
      .then(r => (r.ok ? r.json() : null)).finally(() => clearTimeout(tm));
    if (!m || !m.files) return;
    const cache = await caches.open(CACHE);
    const mk = new URL('__manifest', self.registration.scope).href;
    const oldR = await cache.match(mk);
    const old = oldR ? await oldR.json() : { files: {} };
    const done = Object.assign({}, old.files);
    Object.keys(done).forEach(p => { if (!m.files[p]) delete done[p]; });
    const todo = Object.keys(m.files).filter(p => done[p] !== m.files[p]);
    for (let i = 0; i < todo.length; i += 4) {
      await Promise.all(todo.slice(i, i + 4).map(async p => {
        try {
          const r = await fetch(REMOTE + p, { cache: 'reload' });
          if (r.ok) { await cache.put(new URL(p, self.registration.scope).href, r); done[p] = m.files[p]; }
        } catch (e) {}
      }));
    }
    await cache.put(mk, new Response(JSON.stringify({ files: done })));
  } catch (e) {} finally { busy = false; }
}
self.addEventListener('message', e => { if (e.data === 'precache') e.waitUntil(precache()); });

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
    if (!url.pathname.includes('/hadith/')) e.waitUntil(refresh().catch(() => {}));
    return hit;
  }
  try {
    const r = await refresh();
    if (r && r.ok) return r;
  } catch (err) { /* نكمل للنسخة الداخلية */ }
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

async function nav(req, url) {
  const cache = await caches.open(CACHE);
  const key = url.origin + url.pathname;
  try {
    const r = await fetchRemote(remoteUrl(url).split('?')[0], { cache: 'no-store' });
    if (r && r.ok) { cache.put(key, r.clone()); return r; }
  } catch (err) { /* بلا إنترنت */ }
  const hit = (await cache.match(key)) || (await cache.match(new URL('index.html', self.registration.scope).href));
  return hit || fetch(req);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin !== location.origin) {
    if (/(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) e.respondWith(fonts(req));
    return;
  }
  if (req.mode === 'navigate') { e.respondWith(nav(req, url)); return; }
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
