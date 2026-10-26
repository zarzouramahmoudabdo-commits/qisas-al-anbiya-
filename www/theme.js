/* مظهر التطبيق: ألوان قابلة للتغيير + أيقونات SVG. */
(() => {
'use strict';
if (window.__qisasTheme) return; window.__qisasTheme = true;
const KEY = 'x_accent';
const PRESETS = [
  ['أخضر', '#0b5d3b', '#073d27', '#c9a227'],
  ['أزرق', '#1456a8', '#0b3366', '#e0a82e'],
  ['بنفسجي', '#6a3fb5', '#3f2275', '#e8b84a'],
  ['فيروزي', '#0e7c86', '#075058', '#e0b040'],
  ['عنابي', '#9a2c42', '#5e1626', '#dcb35e'],
  ['بني', '#7a4a21', '#4a2a10', '#d9a93b'],
  ['وردي', '#b03a74', '#701f47', '#e6b04e'],
  ['أسود', '#2e3438', '#111416', '#d4af37']
];
const ls = { get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }, set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} } };
const shade = (hex, f) => '#' + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(hex.substr(i, 2), 16) * f))).toString(16).padStart(2, '0')).join('');

function apply(a) {
  const r = document.documentElement.style;
  if (!a) { ['--g1', '--g2', '--gold', '--gold2'].forEach(k => r.removeProperty(k)); }
  else { r.setProperty('--g1', a.g1); r.setProperty('--g2', a.g2); r.setProperty('--gold', a.gold || '#c9a227'); r.setProperty('--gold2', a.gold2 || shade(a.gold || '#c9a227', 1.18)); }
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = (a && a.g1) || '#0b5d3b';
}
apply(ls.get());

/* ───── الأيقونات ───── */
const P = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  mosque: '<path d="M7.5 21v-5a4.5 4.5 0 019 0v5"/><path d="M12 11.5V8.5M2 21h20"/><path d="M3 21V11l1.6-3L6.2 11v10M17.8 21V11l1.6-3 1.6 3v10"/>',
  book: '<path d="M2 5c3-1 7-1 10 1 3-2 7-2 10-1v14c-3-1-7-1-10 1-3-2-7-2-10-1z"/><path d="M12 6v14"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0012 3z"/>',
  heart: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 10c0 6-8 11-8 11z"/>',
  columns: '<path d="M2 10l10-7 10 7z"/><path d="M5 10v10M9.5 10v10M14.5 10v10M19 10v10M3 21h18"/>',
  tree: '<circle cx="12" cy="5" r="2.3"/><circle cx="5.5" cy="19" r="2.3"/><circle cx="12" cy="19" r="2.3"/><circle cx="18.5" cy="19" r="2.3"/><path d="M12 7.3v4M12 11.3H5.5v5.4M12 11.3h6.5v5.4M12 11.3v5.4"/>',
  scroll: '<path d="M8 21h10a2 2 0 002-2v-2H10v2a2 2 0 01-2 2zm0 0a2 2 0 01-2-2V5a2 2 0 00-2-2h12a2 2 0 012 2v12"/><path d="M10 7h6M10 11h6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  down: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>'
};
const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${P[k]}</svg>`;
const BY_HREF = { '#/seerah': 'mosque', '#/prophets': 'book', '#/lessons': 'bulb', '#/settings': 'gear', '#/x/history': 'columns', '#/x/nasab': 'tree', '#/x/hadith': 'scroll' };
function icons() {
  document.querySelectorAll('#app .sec-card').forEach(c => {
    const big = c.querySelector('.big'); if (!big || big.dataset.xi) return;
    const k = c.hasAttribute('data-apkcard') ? 'down' : BY_HREF[c.getAttribute('href')];
    if (k) { big.innerHTML = svg(k); big.dataset.xi = '1'; big.removeAttribute('style'); }
  });
}
const NAV = { home: 'home', seerah: 'mosque', prophets: 'book', lessons: 'bulb', favs: 'heart' };
function nav() {
  document.querySelectorAll('#nav a[data-n]').forEach(a => {
    const i = a.querySelector('i'); const k = NAV[a.dataset.n];
    if (i && k && !i.dataset.xi) { i.innerHTML = svg(k); i.dataset.xi = '1'; }
  });
}

/* ───── اختيار اللون في الإعدادات ───── */
function settingsUI() {
  const sets = document.querySelectorAll('#app .set');
  if (!sets.length || document.querySelector('#app [data-xtheme]')) return;
  const cur = ls.get();
  const box = document.createElement('div'); box.className = 'set'; box.setAttribute('data-xtheme', '1');
  box.innerHTML = `<div class="r" style="flex-direction:column;align-items:stretch;gap:10px"><span>لون التطبيق<small>اختر لونًا أو اصنع لونك</small></span>
    <div class="x-colors">${PRESETS.map((p, i) => `<button type="button" data-i="${i}" title="${p[0]}" style="background:linear-gradient(135deg,${p[1]},${p[2]})" class="${cur && cur.g1 === p[1] ? 'on' : (!cur && i === 0 ? 'on' : '')}"></button>`).join('')}
    <label title="لون مخصص"><span>🎨</span><input type="color" value="${(cur && cur.g1) || '#0b5d3b'}"></label></div></div>`;
  sets[0].after(box);
  box.addEventListener('click', e => {
    const b = e.target.closest('button[data-i]'); if (!b) return;
    const p = PRESETS[+b.dataset.i];
    const a = +b.dataset.i === 0 ? null : { g1: p[1], g2: p[2], gold: p[3] };
    ls.set(a); apply(a);
    box.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  });
  box.querySelector('input[type=color]').addEventListener('input', e => {
    const c = e.target.value, a = { g1: c, g2: shade(c, .6), gold: '#c9a227' };
    ls.set(a); apply(a); box.querySelectorAll('button').forEach(x => x.classList.remove('on'));
  });
}

function all() { icons(); settingsUI(); }
nav();
const app = document.getElementById('app');
if (app) { new MutationObserver(all).observe(app, { childList: true, subtree: true }); all(); }
setTimeout(all, 600); setTimeout(all, 1800);
})();
