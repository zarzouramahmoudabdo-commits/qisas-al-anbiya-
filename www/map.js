/* صفحة الخريطة التفاعلية: #/p/map  (رسم SVG تخطيطي يعمل بدون إنترنت) */
(() => {
'use strict';
const Q = window.QPRO; if (!Q || window.__qisasMap) return; window.__qisasMap = true;
const { $, $$, esc, setPage, D } = Q;
const M = () => window.QISAS_MAP;

/* الإسقاط: خط الطول 29–62.5 وخط العرض 10.5–38.5 */
const K = 22, X = lon => (lon - 29) * K, Y = lat => (38.5 - lat) * K, W = (62.5 - 29) * K, H = (38.5 - 10.5) * K;
const pt = ([lat, lon]) => X(lon).toFixed(1) + ',' + Y(lat).toFixed(1);
const poly = a => 'M' + a.map(pt).join('L') + 'Z';

/* خطوط الشواطئ (تقريبية جدًا) */
const SEAS = [
  /* البحر الأحمر والخليج العربي وبحر العرب */
  [[29.97, 32.55], [27.25, 33.8], [25.05, 34.9], [23.9, 35.8], [19.6, 37.2], [15.6, 39.45], [13.0, 42.7], [11.6, 43.15], [10.45, 45.0], [11.3, 49.2], [11.8, 51.25], [10.5, 62.5], [25.3, 62.5],
   [25.3, 60.6], [25.65, 57.8], [27.15, 56.25], [26.55, 54.9], [28.95, 50.8], [30.4, 49.1], [29.98, 48.5], [29.35, 48.0], [27.0, 49.65], [26.4, 50.2], [26.15, 51.2], [25.3, 51.55], [24.1, 51.65], [24.45, 54.35], [25.25, 55.3], [25.8, 56.0], [26.2, 56.25], [24.35, 56.7], [23.6, 58.6], [22.5, 59.8], [19.65, 57.7], [17.0, 54.1], [15.6, 52.2], [14.5, 49.1], [12.8, 45.0], [12.65, 43.4], [13.3, 43.25], [14.8, 42.95], [16.9, 42.55], [19.13, 41.08], [21.5, 39.15], [22.8, 39.03], [24.1, 38.05], [25.0, 37.27], [26.25, 36.45], [27.35, 35.7], [29.25, 34.93], [29.53, 35.0], [29.5, 34.9], [29.0, 34.65], [28.5, 34.5], [27.85, 34.3], [27.73, 34.25], [29.05, 33.1]],
  /* البحر المتوسط (الجزء الظاهر) */
  [[30.9, 29], [31.26, 32.3], [31.5, 34.45], [33.9, 35.5], [35.5, 35.8], [36.6, 36.2], [36.8, 34.6], [36.1, 32.8], [36.8, 30.7], [36.6, 29]]
];
const COL = { p: '#c9a227', s: '#2f9e6b', g: '#d0553a' };
const KL = { p: 'الأنبياء', s: 'السيرة', g: 'الغزوات' };
let st = { f: 'all', sel: null, routes: true, vb: { x: 0, y: 0, w: W, h: H } };

function story(l) { const D0 = D(); const it = (D0[l[0]] || []).find(x => x.id === l[1]); return it ? { href: `#/item/${l[0]}/${l[1]}`, t: it.short || it.title } : null; }
const vis = p => st.f === 'all' || p.k.includes(st.f);
const placeById = id => M().places.find(p => p.id === id);

function svg() {
  const m = M(), vb = st.vb, sc = W / vb.w;
  const sea = SEAS.map(s => `<path d="${poly(s)}" class="mp-sea"/>`).join('');
  const grid = []; for (let lat = 12; lat <= 38; lat += 4) grid.push(`<path d="M0 ${Y(lat)}H${W}" class="mp-g"/><text x="6" y="${Y(lat) - 3}" class="mp-gt" style="font-size:${9 / sc}px">${lat}°</text>`);
  for (let lon = 30; lon <= 62; lon += 4) grid.push(`<path d="M${X(lon)} 0V${H}" class="mp-g"/><text x="${X(lon) + 3}" y="${H - 5}" class="mp-gt" style="font-size:${9 / sc}px">${lon}°</text>`);
  const routes = st.routes ? m.routes.filter(r => st.f === 'all' || r.k === st.f || (st.f === 'g' && false)).map(r => {
    const pts = r.pts.map(id => placeById(id)).filter(Boolean).map(p => pt([p.lat, p.lon]));
    return `<path d="M${pts.join('L')}" class="mp-r" stroke="${COL[r.k]}" style="stroke-width:${2.2 / sc}px;stroke-dasharray:${7 / sc} ${5 / sc}" data-r="${r.id}"/>`;
  }).join('') : '';
  const dots = m.places.filter(vis).map(p => {
    const k = p.k[0], on = st.sel === p.id, r = (on ? 9 : 6.5) / sc;
    const label = (on || sc >= 2.6) ? `<text x="${X(p.lon) + 10 / sc}" y="${Y(p.lat) + 4 / sc}" class="mp-lb" style="font-size:${11.5 / sc}px">${esc(p.n)}</text>` : '';
    return `<g class="mp-pt${on ? ' on' : ''}" data-pid="${p.id}"><circle cx="${X(p.lon)}" cy="${Y(p.lat)}" r="${r * 2.4}" fill="transparent"/><circle cx="${X(p.lon)}" cy="${Y(p.lat)}" r="${r}" fill="${COL[k]}" stroke="#fff" stroke-width="${1.6 / sc}"/>${on ? `<circle cx="${X(p.lon)}" cy="${Y(p.lat)}" r="${r * 1.9}" fill="none" stroke="${COL[k]}" stroke-width="${1.5 / sc}" opacity=".6"/>` : ''}${label}</g>`;
  }).join('');
  return `<svg id="mp-svg" viewBox="${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="خريطة تخطيطية">${sea}${grid.join('')}${routes}${dots}</svg>`;
}
function card() {
  const p = st.sel && placeById(st.sel); if (!p) return '<div class="mp-hint">اضغط على أي نقطة لعرض تفاصيلها، واسحب الخريطة وكبّرها بإصبعين.</div>';
  const links = (p.l || []).map(story).filter(Boolean);
  const route = M().routes.filter(r => r.pts.includes(p.id) && (st.f === 'all' || r.k === st.f)).map(r => `<div class="mp-note"><b>${esc(r.n)}:</b> ${esc(r.note)}</div>`).join('');
  return `<div class="mp-card"><div class="h"><b>${esc(p.n)}</b>${p.k.map(k => `<span class="mp-chip" style="--c:${COL[k]}">${KL[k]}</span>`).join('')}</div>
    <p>${esc(p.d)}</p>${p.c ? `<div class="mp-conf">⚠ ${esc(p.c)}</div>` : ''}${route}
    <div class="mp-links">${links.map(x => `<a class="x-btn sm alt" href="${x.href}">${esc(x.t)}</a>`).join('')}<a class="x-btn sm alt" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}">افتح في الخرائط</a></div></div>`;
}
function render() {
  const a = $('#app'); if (!a || !/^#\/p\/map/.test(location.hash)) return;
  const keep = st.vb;
  a.innerHTML = `<div class="mp"><h2 class="page-title">خريطة الأحداث</h2>
    <p class="x-sub">خريطة تخطيطية تقريبية: مواضع بعض الأماكن محل خلاف بين أهل العلم، وقد نبّهنا عليه في بطاقة كل مكان.</p>
    <div class="mp-chips">${[['all', 'الكل'], ['p', 'الأنبياء'], ['s', 'السيرة'], ['g', 'الغزوات']].map(f => `<button data-mp="f" data-v="${f[0]}" class="${st.f === f[0] ? 'on' : ''}">${f[1]}</button>`).join('')}<button data-mp="routes" class="${st.routes ? 'on' : ''}">الرحلات</button></div>
    <div class="mp-wrap">${svg()}<div class="mp-zoom"><button data-mp="z" data-v="1.5" aria-label="تكبير">+</button><button data-mp="z" data-v="0.67" aria-label="تصغير">−</button><button data-mp="z" data-v="0" aria-label="إعادة">⌂</button></div></div>
    <div id="mp-card">${card()}</div>
    <div class="group-t">الأماكن</div><div class="list">${M().places.filter(vis).map(p => `<a class="item" href="#" data-mp="pick" data-id="${p.id}"><div class="no" style="background:${COL[p.k[0]]}">${esc(p.n.slice(0, 1))}</div><div style="min-width:0"><h3>${esc(p.n)}</h3><p>${p.k.map(k => KL[k]).join(' · ')}</p></div></a>`).join('')}</div></div>`;
  st.vb = keep; bind();
}
function redraw() { const w = $('.mp-wrap'); if (!w) return render(); const s = $('#mp-svg'); s.outerHTML = svg(); bind(); const c = $('#mp-card'); if (c) c.innerHTML = card(); }
function clamp() { const v = st.vb; v.w = Math.min(W, Math.max(W / 7, v.w)); v.h = v.w * H / W; v.x = Math.min(W - v.w, Math.max(0, v.x)); v.y = Math.min(H - v.h, Math.max(0, v.y)); }
function bind() {
  const s = $('#mp-svg'); if (!s) return;
  const pts = new Map(); let d0 = 0, moved = 0;
  const px = () => s.getBoundingClientRect();
  s.addEventListener('pointerdown', e => { s.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; d0 = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  s.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId), r = px(), v = st.vb;
    if (pts.size === 1) {
      const k = Math.max(v.w / r.width, v.h / r.height); moved += Math.abs(e.clientX - prev[0]) + Math.abs(e.clientY - prev[1]);
      v.x -= (e.clientX - prev[0]) * k; v.y -= (e.clientY - prev[1]) * k; pts.set(e.pointerId, [e.clientX, e.clientY]); clamp(); s.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
    } else {
      pts.set(e.pointerId, [e.clientX, e.clientY]); const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (d0 > 0) { zoom(d0 / d, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, true); d0 = d; }
    }
  });
  const up = e => { const was = pts.size; pts.delete(e.pointerId); if (was === 1 && moved < 6) { const el0 = document.elementFromPoint(e.clientX, e.clientY), g = el0 && el0.closest && el0.closest('[data-pid]'); if (g) { st.sel = g.dataset.pid; redraw(); } } if (moved >= 6 || was === 2) redrawLabels(); };
  s.addEventListener('pointerup', up); s.addEventListener('pointercancel', up);
  s.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.15 : 0.87, e.clientX, e.clientY); }, { passive: false });
}
function redrawLabels() { const s = $('#mp-svg'); if (s) { s.outerHTML = svg(); bind(); } }
function zoom(f, cx, cy, quiet) {
  const s = $('#mp-svg'), r = s.getBoundingClientRect(), v = st.vb;
  const fx = cx == null ? .5 : (cx - r.left) / r.width, fy = cy == null ? .5 : (cy - r.top) / r.height;
  const nw = Math.min(W, Math.max(W / 7, v.w * f)), nh = nw * H / W;
  v.x += (v.w - nw) * fx; v.y += (v.h - nh) * fy; v.w = nw; v.h = nh; clamp();
  s.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
  if (!quiet) redrawLabels();
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-mp]'); if (!el) return;
  const a = el.dataset.mp;
  if (a === 'f') { st.f = el.dataset.v; if (st.sel && !vis(placeById(st.sel))) st.sel = null; render(); }
  else if (a === 'routes') { st.routes = !st.routes; render(); }
  else if (a === 'z') { const f = +el.dataset.v; if (!f) { st.vb = { x: 0, y: 0, w: W, h: H }; redrawLabels(); } else zoom(1 / f); }
  else if (a === 'pick') {
    e.preventDefault(); st.sel = el.dataset.id; const p = placeById(st.sel);
    st.vb = { w: W / 3, h: H / 3, x: X(p.lon) - W / 6, y: Y(p.lat) - H / 6 }; clamp(); render(); window.scrollTo({ top: $('.mp-wrap').offsetTop - 70, behavior: 'smooth' });
  }
});
Q.viewMap = () => { if (!M()) return setPage('<div class="empty">جارٍ تحميل الخريطة…</div>'); st.vb = { x: 0, y: 0, w: W, h: H }; st.sel = null; render(); };
if (/^#\/p\/map/.test(location.hash)) setTimeout(() => Q.viewMap(), 0);
})();
