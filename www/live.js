/* تحديثات حيّة: شارات «جديد» تلقائية، إعلانات من الموقع، مواسم هجرية، ونافذة «ما الجديد».
   تعتمد على live.json (يكتبه صاحب التطبيق) وprecache.json (يُولَّد تلقائيًا عند كل رفع). */
(() => {
'use strict';
const Q = window.QPRO; if (!Q || window.__qisasLive) return; window.__qisasLive = true;
const { $, $$, esc, ls } = Q;
const R = 'https://zarzouramahmoudabdo-commits.github.io/qisas-al-anbiya-/';
const GROUPS = {
  hadith: { re: /^(hadith\/|data-sharh)/, label: 'الأحاديث وشروحها', routes: ['#/x/hadith'] },
  history: { re: /^data-history/, label: 'التاريخ الإسلامي', routes: ['#/x/history'] },
  nasab: { re: /^data-nasab/, label: 'أنساب الأنبياء', routes: ['#/x/nasab'] },
  stories: { re: /^data\.js$/, label: 'القصص والسيرة', routes: ['#/seerah', '#/prophets'] }
};
const routeGroup = h => Object.keys(GROUPS).find(g => GROUPS[g].routes.some(r => h === r || h.indexOf(r + '/') === 0));
const today = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };

async function remote(p, ms) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms || 7000);
  try { const r = await fetch(R + p + '?t=' + Date.now(), { cache: 'no-store', signal: ctl.signal }); if (!r.ok) throw new Error(p + ' ' + r.status); return await r.json(); }
  finally { clearTimeout(t); }
}
const fnv = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
function groupHashes(m) {
  const files = Object.keys((m && m.files) || {}).sort(), out = {};
  Object.keys(GROUPS).forEach(g => { out[g] = fnv(files.filter(f => GROUPS[g].re.test(f)).map(f => f + m.files[f]).join('|')); });
  return out;
}

/* ───── الحالة ───── */
let live = ls.get('lv_live', { announce: [], whatsnew: [], seasons: [] });
let cur = ls.get('lv_cur', null);                    // بصمات المجموعات الحالية
const seen = () => ls.get('lv_seen', {});
const changed = () => (cur ? Object.keys(GROUPS).filter(g => seen()[g] && seen()[g] !== cur[g]) : []);

async function sync() {
  if (navigator.onLine === false) return;
  try { const l = await remote('live.json'); if (l && typeof l === 'object') { live = l; ls.set('lv_live', l); } } catch (e) {}
  try {
    const m = await remote('precache.json'); cur = groupHashes(m); ls.set('lv_cur', cur);
    if (!ls.get('lv_base', 0)) { ls.set('lv_seen', cur); ls.set('lv_base', 1); }   // أول تشغيل: نعتبر كل شيء مقروءًا
  } catch (e) {}
  refresh();
  maybeShowNew();
}

/* ───── شارات «جديد» ───── */
const HREFS = { '#/x/hadith': 'hadith', '#/x/history': 'history', '#/x/nasab': 'nasab', '#/seerah': 'stories', '#/prophets': 'stories' };
function badges(root) {
  const ch = changed();
  $$('.h2-tile[href],.ms-row[href],.st-card[href]', root).forEach(a => {
    const g = HREFS[a.getAttribute('href')]; if (!g) return;
    const has = a.querySelector('.lv-new');
    if (ch.includes(g) && !has) { const s = document.createElement('span'); s.className = 'lv-new'; s.textContent = 'جديد'; a.appendChild(s); }
    else if (!ch.includes(g) && has) has.remove();
  });
}
function markSeen() {
  const g = routeGroup(location.hash || ''); if (!g || !cur) return;
  const s = seen(); if (s[g] !== cur[g]) { s[g] = cur[g]; ls.set('lv_seen', s); }
  $$('.lv-new').forEach(x => { const a = x.closest('a'); if (a && HREFS[a.getAttribute('href')] === g) x.remove(); });
}
window.addEventListener('hashchange', markSeen);

/* ───── المواسم ───── */
function hijri(d) {
  try { const p = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(d || new Date()); const g = t => +(p.find(x => x.type === t) || {}).value; return { d: g('day'), m: g('month'), y: g('year') }; } catch (e) { return null; }
}
function season() {
  const t = today();
  for (const s of (live.seasons || [])) if (s && s.from && s.to && t >= s.from && t <= s.to) return s;
  const h = hijri(), fri = new Date().getDay() === 5;
  if (h) {
    if (h.m === 10 && h.d <= 3) return { id: 'eid', title: 'عيد الفطر المبارك', sub: 'تقبّل الله منا ومنكم صالح الأعمال.' };
    if (h.m === 12 && h.d === 9) return { id: 'hajj', title: 'يوم عرفة', sub: 'يُسنّ صيامه لغير الحاج (رواه مسلم). أكثِر من الدعاء والذكر.' };
    if (h.m === 12 && h.d === 10) return { id: 'eid', title: 'عيد الأضحى المبارك', sub: 'كل عام وأنتم بخير، وتقبّل الله طاعاتكم.' };
    if (h.m === 12 && h.d >= 11 && h.d <= 13) return { id: 'hajj', title: 'أيام التشريق', sub: 'أيام أكل وشرب وذكر لله (رواه مسلم).' };
    if (h.m === 12 && h.d < 9) return { id: 'hajj', title: 'عشر ذي الحجة', sub: 'من أفضل أيام العام؛ أكثِر فيها من الطاعات والذكر.' };
    if (h.m === 1 && (h.d === 9 || h.d === 10)) return { id: 'ashura', title: 'عاشوراء', sub: 'يُستحب صيامه (متفق عليه)، ويُستحب صيام يوم قبله.' };
    if (h.m === 9 && h.d >= 21) return { id: 'ramadan', title: 'العشر الأواخر من رمضان', sub: 'التمسوا ليلة القدر في الوتر من العشر الأواخر (متفق عليه).' };
    if (h.m === 9) return { id: 'ramadan', title: 'رمضان كريم', sub: 'شهر القرآن والصيام والقيام. اقرأ قصة نبي مع كل ليلة.' };
  }
  if (fri) return { id: 'friday', title: 'جمعة مباركة', sub: 'أكثِر من الصلاة على النبي ﷺ، ويُستحب قراءة سورة الكهف.' };
  return null;
}

/* ───── الإعلانات ───── */
function announcement() {
  const t = today(), dis = ls.get('lv_dis', []);
  return (live.announce || []).find(a => a && a.id && !dis.includes(a.id) && (!a.from || t >= a.from) && (!a.to || t <= a.to));
}

/* ───── الرئيسية ───── */
function onHome(wrap) {
  const hero = $('.h2-hero', wrap);
  const s = season();
  if (hero && s) {
    hero.dataset.season = s.id || 'x';
    const el = document.createElement('div'); el.className = 'lv-season'; el.dataset.s = s.id || 'x';
    el.innerHTML = `<i></i><div><b>${esc(s.title)}</b><small>${esc(s.sub || '')}</small></div>`;
    hero.insertAdjacentElement('afterend', el);
  }
  const a = announcement(), form = $('.h2-search', wrap);
  if (a && form) {
    const d = document.createElement('div'); d.className = 'lv-ann';
    d.innerHTML = `<div class="t"><b>${esc(a.title || '')}</b><button data-lv="dis" data-id="${esc(a.id)}" aria-label="إغلاق">×</button></div>${a.body ? `<p>${esc(a.body)}</p>` : ''}${a.link ? `<a class="x-btn sm" href="${esc(a.link)}" data-lv="go" data-id="${esc(a.id)}">${esc(a.btn || 'افتح')}</a>` : ''}`;
    form.insertAdjacentElement('afterend', d);
  }
  badges(wrap);
}
function refresh() { const w = $('#app .p-home'); if (w) { $$('.lv-season,.lv-ann', w).forEach(x => x.remove()); const h = $('.h2-hero', w); if (h) delete h.dataset.season; onHome(w); } }
function onSheet(m) {
  badges(m);
  const row = $('[data-p="whatsnew"]', m);
  if (row && wnPending()) { const s = document.createElement('span'); s.className = 'lv-new'; s.textContent = 'جديد'; row.appendChild(s); }
}

/* ───── ما الجديد ───── */
const wnKey = () => (cur ? changed().map(g => g + cur[g]).join(',') : '');
const wnPending = () => !!wnKey() && wnKey() !== ls.get('lv_wn', '');
function maybeShowNew() { if (wnPending() && !$('#p-modal') && !$('.p-onb')) setTimeout(() => { if (!$('#p-modal')) showNew(false); }, 1500); }
function showNew(force) {
  const ch = changed(), items = (live.whatsnew || []).slice(0, force ? 5 : 1);
  if (!force && !ch.length && !items.length) return;
  const parts = [];
  if (ch.length) parts.push(`<div class="lv-wn-g"><small>تم تحديث</small>${ch.map(g => `<a href="${GROUPS[g].routes[0]}" data-p="close"><span>${esc(GROUPS[g].label)}</span></a>`).join('')}</div>`);
  items.forEach(w => parts.push(`<div class="lv-wn"><b>${esc(w.title || w.v || 'تحديث')}</b>${w.date ? `<small>${esc(w.date)}</small>` : ''}<ul>${(w.items || []).map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`));
  if (!parts.length) parts.push('<div class="empty">أنت على آخر إصدار، ولا توجد تحديثات جديدة.</div>');
  const m = Q.modal(`<div class="ms-grip"></div><h3 class="lv-h">ما الجديد</h3>${parts.join('')}<div class="p-btns"><button class="x-btn" data-p="close">حسنًا</button></div>`);
  m.classList.add('sheet'); if (Q.dragClose) Q.dragClose(m);
  ls.set('lv_wn', wnKey());
}

/* ───── الأحداث ───── */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-lv]'); if (!el) return;
  if (el.dataset.lv === 'dis') { const d = ls.get('lv_dis', []); d.push(el.dataset.id); ls.set('lv_dis', d.slice(-50)); const c = el.closest('.lv-ann'); if (c) c.remove(); }
  else if (el.dataset.lv === 'go') { const d = ls.get('lv_dis', []); d.push(el.dataset.id); ls.set('lv_dis', d.slice(-50)); }
});

Object.assign(Q, { onHome, onSheet, showNew });
const w = $('#app .p-home'); if (w) onHome(w);
sync(); window.addEventListener('online', sync);
document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
})();
