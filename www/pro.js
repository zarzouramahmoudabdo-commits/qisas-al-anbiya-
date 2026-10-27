/* ترقية الاحتراف: سلاسة، قراءة، تنزيلات، ملاحظات، مشاركة صورة، بحث موحّد، حديث اليوم، تعريف أول استخدام.
   وحدة مستقلة تُحمَّل بعد app.js وextra.js. مساراتها الخاصة: #/p/find  #/p/notes  #/p/dl */
(() => {
'use strict';
if (window.__qisasPro) return;
window.__qisasPro = true;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const strip = s => String(s || '').replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toLowerCase();
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const app = () => document.getElementById('app');
const D = () => window.TAMY_DATA || {};
function toast(msg) {
  const t = document.createElement('div'); t.className = 'x-toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2000);
}
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
const loaded = {};
function loadScript(src) {
  if (!loaded[src]) loaded[src] = new Promise((res, rej) => {
    if (src === 'data-history-a.js' && window.QISAS_HISTORY) return res();
    const s = document.createElement('script'); s.src = src; s.onload = () => res();
    s.onerror = () => { delete loaded[src]; rej(new Error('load ' + src)); };
    document.head.appendChild(s);
  });
  return loaded[src];
}
const jc = {};
async function getJson(p) { if (jc[p]) return jc[p]; const r = await fetch(p); if (!r.ok) throw new Error(p); return (jc[p] = await r.json()); }

/* ───── 1) إحساس الضغط + اهتزاز خفيف ───── */
document.addEventListener('pointerdown', e => {
  if (e.target.closest('.sec-card,.item,.x-row,.x-btn,.chipbtn,#nav a,.cont,button,.p-tile')) buzz(6);
}, { passive: true });

/* ───── 2) انتقال ناعم بين الصفحات + 3) هيكل التحميل ───── */
let inObs;
function watchApp() {
  const a = app(); if (!a) return setTimeout(watchApp, 150);
  inObs = new MutationObserver(() => {
    a.classList.remove('p-in'); void a.offsetWidth; a.classList.add('p-in');
    clearTimeout(watchApp._t); watchApp._t = setTimeout(afterRender, 60);
  });
  inObs.observe(a, { childList: true });
  afterRender();
}
const SK = '<div class="p-skel"><i style="width:55%"></i><b></b><b></b><b style="width:80%"></b><b></b><b style="width:65%"></b></div>';

/* ───── 4) تتبّع آخر موضع + ما قُرئ ───── */
const TRACK = /^#\/(item\/|x\/(hadith|history|nasab))/;
const SEEN = /^#\/x\/(history|nasab|hadith)\/[^/]+(\/\d+)?$/;
let lastY = 0;
function saveLast() {
  const h = location.hash || '';
  if (!TRACK.test(h)) return;
  const t = ($('#app h1') || $('#app h2') || {}).textContent;
  if (!t) return;
  ls.set('p_last', { h, t: t.trim().slice(0, 60), y: Math.round(window.scrollY), ts: Date.now() });
}
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const up = $('#p-up'); if (up) up.classList.toggle('on', y > 600);
  if (Math.abs(y - lastY) > 80) { lastY = y; clearTimeout(saveLast._t); saveLast._t = setTimeout(saveLast, 400); }
}, { passive: true });
function markSeen() {
  const h = location.hash || '';
  if (!SEEN.test(h)) return;
  const s = ls.get('p_seen', {}); if (!s[h]) { s[h] = 1; ls.set('p_seen', s); }
}
function paintSeen() {
  const s = ls.get('p_seen', {});
  $$('#app a[href^="#/x/"]').forEach(a => { if (s[a.getAttribute('href')]) a.classList.add('p-seen'); });
}

/* ───── 5) وضع القراءة ───── */
const RD = Object.assign({ fs: 0, ff: '', lh: 0, bg: '' }, ls.get('p_read', {}));
function applyRead() {
  const r = document.documentElement.style;
  if (RD.fs) r.setProperty('--fs', RD.fs + 'px');
  RD.lh ? r.setProperty('--lh', RD.lh) : r.removeProperty('--lh');
  RD.ff ? r.setProperty('--ff', RD.ff) : r.removeProperty('--ff');
  RD.bg ? document.documentElement.setAttribute('data-rbg', RD.bg) : document.documentElement.removeAttribute('data-rbg');
}
const FONTS = [['', 'الافتراضي'], ["'Amiri','Noto Naskh Arabic','Traditional Arabic',serif", 'نسخ'], ["'Noto Sans Arabic','Segoe UI',Tahoma,sans-serif", 'بسيط']];
const BGS = [['', 'الافتراضي', '#faf6ea'], ['white', 'أبيض', '#ffffff'], ['paper', 'ورقي', '#f3e7c9'], ['dark', 'داكن', '#16211c'], ['black', 'أسود', '#000']];
function readPanel() {
  const m = modal(`<b>وضع القراءة</b>
    <div class="p-row"><span>حجم الخط <em id="p-fsv">${RD.fs || 21}</em></span><input id="p-fs" type="range" min="16" max="36" step="1" value="${RD.fs || 21}"></div>
    <div class="p-row"><span>تباعد الأسطر</span><input id="p-lh" type="range" min="1.5" max="2.8" step="0.1" value="${RD.lh || 2}"></div>
    <div class="p-row"><span>الخط</span><div class="p-seg">${FONTS.map(f => `<button data-pf="${esc(f[0])}" class="${RD.ff === f[0] ? 'on' : ''}">${f[1]}</button>`).join('')}</div></div>
    <div class="p-row"><span>الخلفية</span><div class="p-bgs">${BGS.map(b => `<button data-pb="${b[0]}" title="${b[1]}" class="${RD.bg === b[0] ? 'on' : ''}" style="background:${b[2]}"></button>`).join('')}</div></div>
    <div class="p-btns"><button class="x-btn alt" data-p="reset">إعادة الضبط</button><button class="x-btn" data-p="close">تم</button></div>`);
  $('#p-fs', m).oninput = e => { RD.fs = +e.target.value; $('#p-fsv', m).textContent = RD.fs; ls.set('p_read', RD); applyRead(); };
  $('#p-lh', m).oninput = e => { RD.lh = +e.target.value; ls.set('p_read', RD); applyRead(); };
  m.addEventListener('click', e => {
    const f = e.target.closest('[data-pf]'), b = e.target.closest('[data-pb]');
    if (f) { RD.ff = f.dataset.pf; $$('[data-pf]', m).forEach(x => x.classList.toggle('on', x === f)); }
    if (b) { RD.bg = b.dataset.pb; $$('[data-pb]', m).forEach(x => x.classList.toggle('on', x === b)); }
    if (f || b) { ls.set('p_read', RD); applyRead(); }
  });
}

/* ───── نافذة عامة ───── */
function modal(html) {
  closeModal();
  const m = document.createElement('div'); m.id = 'p-modal';
  m.innerHTML = `<div class="p-card">${html}</div>`;
  m.addEventListener('click', e => { if (e.target === m) closeModal(); });
  document.body.appendChild(m); return m;
}
function closeModal() { const m = $('#p-modal'); if (m) m.remove(); }

/* ───── أزرار عائمة ───── */
function fabs() {
  if ($('#p-fabs')) return;
  const d = document.createElement('div'); d.id = 'p-fabs';
  d.innerHTML = '<button id="p-up" data-p="up" aria-label="للأعلى">↑</button><button id="p-aa" data-p="read" aria-label="وضع القراءة">Aa</button>';
  document.body.appendChild(d);
}
function fabState() {
  const readable = !!$('#app .body, #app .x-body, #app .x-hd');
  const aa = $('#p-aa'); if (aa) aa.classList.toggle('on', readable);
}

/* ───── 6) تظليل وملاحظات ───── */
const HL = () => ls.get('p_notes', []);
const SELOK = '#app .body, #app .x-body, #app .x-hd .t, #app .dua, #app .x-sharh';
function selText() {
  const s = window.getSelection(); if (!s || s.isCollapsed || !s.rangeCount) return '';
  const n = s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement);
  if (!n || !n.closest(SELOK)) return '';
  return s.toString().replace(/\s+/g, ' ').trim();
}
let selT;
document.addEventListener('selectionchange', () => {
  clearTimeout(selT);
  selT = setTimeout(() => {
    const t = selText(); let b = $('#p-hl');
    if (t.length >= 4) {
      if (!b) { b = document.createElement('button'); b.id = 'p-hl'; b.dataset.p = 'hl'; b.textContent = '🖍 تظليل وملاحظة'; document.body.appendChild(b); }
      b._t = t;
    } else if (b) b.remove();
  }, 250);
});
function addNote() {
  const b = $('#p-hl'); if (!b) return; const text = b._t;
  const m = modal(`<b>حفظ المقطع</b><div class="p-quote">${esc(text.slice(0, 280))}</div>
    <textarea id="p-note" rows="3" placeholder="اكتب ملاحظتك (اختياري)"></textarea>
    <div class="p-btns"><button class="x-btn alt" data-p="close">إلغاء</button><button class="x-btn" data-p="savenote">حفظ</button></div>`);
  m._text = text;
}
function saveNote() {
  const m = $('#p-modal'); if (!m) return;
  const arr = HL();
  arr.unshift({ id: Date.now(), h: location.hash, t: m._text, n: ($('#p-note', m).value || '').trim(), ts: Date.now() });
  ls.set('p_notes', arr.slice(0, 500)); closeModal();
  const b = $('#p-hl'); if (b) b.remove();
  try { window.getSelection().removeAllRanges(); } catch (e) {}
  toast('تم الحفظ في «ملاحظاتي»'); markHL();
}
function markHL() {
  const here = HL().filter(x => x.h === location.hash); if (!here.length) return;
  $$(SELOK.split(',').join(',')).forEach(root => {
    here.forEach(x => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n; while ((n = w.nextNode())) {
        if (n.parentElement.closest('mark.p-hl')) continue;
        const i = n.nodeValue.indexOf(x.t); if (i < 0) continue;
        try { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + x.t.length);
          const mk = document.createElement('mark'); mk.className = 'x-m p-hl'; if (x.n) mk.title = x.n; r.surroundContents(mk); } catch (e) {}
        break;
      }
    });
  });
}
function viewNotes() {
  const arr = HL();
  setPage(`<h2 class="page-title">🖍 ملاحظاتي</h2>${arr.length ? arr.map(x => `<div class="dua-card"><div class="dua">${esc(x.t)}</div>${x.n ? `<div class="p-nt">📝 ${esc(x.n)}</div>` : ''}
    <div class="row"><a class="chipbtn" href="${esc(x.h)}">فتح</a><button class="chipbtn" data-p="img" data-t="${esc(x.t)}">🖼 صورة</button><button class="chipbtn" data-p="delnote" data-id="${x.id}">حذف</button></div></div>`).join('')
    : '<div class="empty">لا توجد ملاحظات بعد.<br>حدّد أي نص داخل قصة أو حديث واضغط «تظليل وملاحظة».</div>'}`);
}

/* ───── 7) شاشة التنزيلات ───── */
const GROUPS = [
  ['الأحاديث الأربعة', /^hadith\//], ['التاريخ الإسلامي', /^data-history/], ['الأنساب', /^data-nasab/],
  ['شروح الأحاديث', /^data-sharh/], ['أساسيات التطبيق', /./]
];
async function dlStatus() {
  let m; try { m = await (await fetch('precache.json?' + Date.now(), { cache: 'no-store' })).json(); } catch (e) { return null; }
  const files = Object.keys(m.files || {});
  let cache = null; try { cache = await caches.open('qisas-live-v1'); } catch (e) {}
  const rows = GROUPS.map(g => ({ name: g[0], re: g[1], files: [], done: 0 }));
  for (const f of files) {
    const g = rows.find(r => r.re.test(f));
    g.files.push(f);
    if (cache && await cache.match(new URL(f, location.href).href)) g.done++;
  }
  return rows;
}
async function viewDl() {
  setPage('<h2 class="page-title">⬇️ التنزيلات</h2>' + SK);
  const rows = await dlStatus();
  const paint = rs => setPage(`<h2 class="page-title">⬇️ التنزيلات</h2>
    <p class="x-sub">تُحفظ ملفات التطبيق على جهازك ليعمل بدون إنترنت. اضغط «تحديث الكل» وأنت متصل لتنزيل أي ملف ناقص أو محدّث.</p>
    ${rs ? rs.map(r => { const p = r.files.length ? Math.round(r.done / r.files.length * 100) : 0;
      return `<div class="p-dl"><div><b>${r.name}</b><small>${r.done} من ${r.files.length} ملفًا${p === 100 ? ' ✓' : ''}</small></div><div class="p-bar"><i style="width:${p}%"></i></div></div>`; }).join('')
      : '<div class="empty">تعذّر قراءة القائمة — تحتاج الاتصال بالإنترنت مرة واحدة.</div>'}
    <div class="p-btns"><button class="x-btn" data-p="dlall">⬇️ تحديث الكل</button></div>`);
  paint(rows);
  window.__pDlPaint = paint;
}
async function dlAll() {
  try { const r = await navigator.serviceWorker.ready; r.active && r.active.postMessage('precache'); } catch (e) { toast('الخدمة غير متاحة'); return; }
  toast('بدأ التنزيل… ستتحدث الأرقام تلقائيًا');
  let prev = -1, still = 0;
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1500));
    if (!/^#\/p\/dl/.test(location.hash)) return;
    const rs = await dlStatus(); if (!rs) continue;
    window.__pDlPaint && window.__pDlPaint(rs);
    const n = rs.reduce((a, r) => a + r.done, 0), tot = rs.reduce((a, r) => a + r.files.length, 0);
    if (n >= tot) { toast('اكتمل التنزيل ✓'); return; }
    still = n === prev ? still + 1 : 0; prev = n; if (still >= 6) return;
  }
}

/* ───── 9) مشاركة كبطاقة صورة ───── */
function wrapLines(ctx, text, maxW) {
  const out = []; let line = '';
  text.split(' ').forEach(w => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; });
  if (line) out.push(line); return out;
}
async function shareImage(text, from) {
  try { await document.fonts.ready; } catch (e) {}
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0b5d3b'); g.addColorStop(1, '#052a1b');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#e8c75a'; x.lineWidth = 6; x.strokeRect(40, 40, W - 80, H - 80);
  x.strokeStyle = '#e8c75a66'; x.lineWidth = 2; x.strokeRect(58, 58, W - 116, H - 116);
  const FF = "Cairo,'Noto Naskh Arabic','Segoe UI',system-ui,sans-serif";
  let fs = 60, lines, lh;
  text = String(text).replace(/\s+/g, ' ').trim().slice(0, 700);
  for (; fs >= 30; fs -= 3) { x.font = `700 ${fs}px ${FF}`; lines = wrapLines(x, text, W - 240); lh = fs * 1.75; if (lines.length * lh < H - 560) break; }
  x.fillStyle = '#e8c75a'; x.font = `700 44px ${FF}`; x.fillText('❝', W / 2, 190);
  x.fillStyle = '#fff'; x.font = `700 ${fs}px ${FF}`;
  const top = H / 2 - (lines.length * lh) / 2 + lh / 2 - 20;
  lines.forEach((l, i) => x.fillText(l, W / 2, top + i * lh));
  x.fillStyle = '#e8c75a'; x.font = `600 36px ${FF}`; if (from) x.fillText(from, W / 2, H - 230);
  x.fillStyle = '#ffffffaa'; x.font = `500 30px ${FF}`; x.fillText('تطبيق قصص الأنبياء', W / 2, H - 130);
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  if (!blob) return toast('تعذّر إنشاء الصورة');
  const file = new File([blob], 'qisas.png', { type: 'image/png' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'qisas.png'; document.body.appendChild(a); a.click(); a.remove(); toast('تم حفظ الصورة'); }
  catch (e) { toast('تعذّرت المشاركة على هذا الجهاز'); }
}
function injectShare() {
  $$('#app .x-hd .m').forEach(m => { if (!m.querySelector('[data-p="img"]')) { const b = document.createElement('button'); b.className = 'x-btn sm alt'; b.dataset.p = 'img'; b.textContent = '🖼'; b.title = 'مشاركة كصورة'; m.appendChild(b); } });
  $$('#app .dua-card .row').forEach(m => { if (!m.querySelector('[data-p="img"]')) { const b = document.createElement('button'); b.className = 'chipbtn'; b.dataset.p = 'img'; b.textContent = '🖼 صورة'; m.appendChild(b); } });
}

/* ───── 10) بحث موحّد ───── */
const BOOKS = [['bukhari', 'صحيح البخاري'], ['muslim', 'صحيح مسلم'], ['nawawi40', 'الأربعون النووية'], ['riyad', 'رياض الصالحين']];
let hdata = null;
async function loadAll() {
  if (hdata) return hdata; hdata = {};
  await Promise.all(BOOKS.map(async b => { try { hdata[b[0]] = await getJson('hadith/' + b[0] + '.json'); } catch (e) {} }));
  return hdata;
}
async function loadHistory() {
  try { if (!window.QISAS_HISTORY) await loadScript('data-history-a.js'); if (!window.QISAS_HISTORY.__b) { await loadScript('data-history-b.js'); window.QISAS_HISTORY.__b = true; } } catch (e) {}
  return window.QISAS_HISTORY;
}
const snip = (t, nq, n) => { const s = strip(t), i = s.indexOf(nq); const a = Math.max(0, (i < 0 ? 0 : i) - 30); return (a ? '…' : '') + t.slice(a, a + n) + '…'; };
async function runFind(q) {
  const box = $('#p-res'); if (!box) return;
  const nq = strip(q.trim());
  if (nq.length < 2) { box.innerHTML = '<div class="empty">اكتب كلمتين على الأقل. يبحث في القصص والأدعية والتاريخ والأحاديث.</div>'; return; }
  const tok = (runFind.t = (runFind.t || 0) + 1);
  const sec = (title, arr) => arr.length ? `<div class="group-t">${title} <em>${arr.length}</em></div><div class="list">${arr.join('')}</div>` : '';
  const row = (href, ic, h, p) => `<a class="item" href="${esc(href)}"><div class="no">${ic}</div><div style="min-width:0"><h3>${esc(h)}</h3><p>${esc(p)}</p></div></a>`;
  const d = D(), stories = [], duas = [];
  ['seerah', 'prophets'].forEach(k => (d[k] || []).forEach(it => {
    const hay = strip([it.title, it.short, it.text, ...(it.lessons || []), ...(it.verses || [])].join(' '));
    if (hay.includes(nq)) stories.push(row(`#/item/${k}/${it.id}`, it.icon || '📖', it.title, snip(it.text || (it.lessons || [])[0] || '', nq, 90)));
  }));
  (d.duas || []).forEach(x => { if (strip(x.text + ' ' + (x.ref || '')).includes(nq)) duas.push(`<div class="dua-card"><div class="dua">${esc(x.text)}</div><div class="ref">${esc(x.ref || '')}</div></div>`); });
  box.innerHTML = sec('القصص والسيرة', stories) + sec('أدعية', duas) + '<div class="empty" id="p-more">جارٍ البحث في التاريخ والأحاديث…</div>';
  const H = await loadHistory(); if (tok !== runFind.t) return;
  const hist = [];
  ((H && H.chapters) || []).forEach(c => { const hay = strip(c.title + ' ' + (c.body || []).join(' ')); if (hay.includes(nq)) hist.push(row('#/x/history/' + c.id, '🏛', c.title, snip((c.body || []).join(' '), nq, 90))); });
  const hd = await loadAll(); if (tok !== runFind.t) return;
  const had = []; let total = 0;
  BOOKS.forEach(([id, name]) => { const b = hd[id]; if (!b) return;
    b.chapters.forEach((c, ci) => c.h.forEach(([n, t]) => { if (strip(t).includes(nq)) { total++; if (had.length < 40) had.push(row(`#/x/hadith/${id}/${ci}`, '📜', name + ' · ' + n, snip(t, nq, 110))); } })); });
  box.innerHTML = sec('القصص والسيرة', stories) + sec('أدعية', duas) + sec('التاريخ الإسلامي', hist) + sec('الأحاديث' + (total > 40 ? ' (أول 40 من ' + total + ')' : ''), had)
    || '';
  if (!stories.length && !duas.length && !hist.length && !had.length) box.innerHTML = `<div class="empty">لا نتائج لـ «${esc(q)}»</div>`;
}
function viewFind(q) {
  q = decodeURIComponent(q || '');
  setPage(`<h2 class="page-title">🔍 البحث الشامل</h2>
    <div class="search"><input id="p-q" value="${esc(q)}" placeholder="ابحث في كل التطبيق…" autocomplete="off" enterkeyhint="search"><button data-p="find" aria-label="بحث">🔍</button></div>
    <div id="p-res"></div>`);
  const i = $('#p-q'); let t;
  i.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => runFind(i.value), 280); });
  if (q) runFind(q); else { i.focus(); runFind(''); }
}
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form="search"]'); if (!f) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const q = (new FormData(f).get('q') || '').toString().trim();
  location.hash = '#/p/find/' + encodeURIComponent(q);
}, true);

/* ───── الصفحة والتوجيه ───── */
function setPage(html) {
  const a = app(); if (!a) return;
  a.innerHTML = html; window.scrollTo(0, 0);
  const b = $('#btnBack'); if (b) b.hidden = false;
  $$('#nav a').forEach(x => x.classList.remove('on'));
}
function onRoute() {
  const h = location.hash || '';
  if (/^#\/search/.test(h)) { location.replace('#/p/find/' + h.replace(/^#\/search\/?/, '')); return; }
  const p = h.match(/^#\/p\/([a-z]+)\/?(.*)$/);
  if (p) {
    if (p[1] === 'find') viewFind(p[2]); else if (p[1] === 'notes') viewNotes(); else if (p[1] === 'dl') viewDl();
    return;
  }
  if (/^#\/x\/(hadith\/[^/]+|history\/[^/]+|nasab)/.test(h)) { const a = app(); if (a && !a.querySelector('.x-wrap')) a.innerHTML = SK; }
  markSeen();
}
window.addEventListener('hashchange', onRoute);

/* ───── الرئيسية: متابعة + حديث اليوم + تقدّم + اختصارات ───── */
function homeBlock() {
  const box = $('#app .sec-cards'); if (!box || $('#app .p-home')) return;
  const d = D(), L = ls.get('p_last', null), wrap = document.createElement('div'); wrap.className = 'p-home';
  let html = '';
  const appCont = $('#app a.cont');
  if (L && L.h && !(appCont && appCont.getAttribute('href').replace(/\/r$/, '') === L.h)) html += `<a class="p-cont" href="${esc(L.h)}" data-p="resume"><span>📌</span><div><b>أكمل من حيث توقفت</b><small>${esc(L.t)}</small></div><span class="go">تابع</span></a>`;
  html += '<div class="p-daily" id="p-daily"></div>';
  const stories = ['seerah', 'prophets'].reduce((a, k) => a.concat(d[k] || []), []);
  const prog = ls.get('tamy_progress', {});
  const done = Object.keys(prog).filter(k => prog[k] && prog[k].done).length;
  const seen = Object.keys(ls.get('p_seen', {})).length;
  html += `<div class="p-stats"><div><b>${done}</b><small>من ${stories.length} قصة مكتملة</small><div class="p-bar"><i style="width:${stories.length ? Math.round(done / stories.length * 100) : 0}%"></i></div></div><div><b>${seen}</b><small>صفحة من التاريخ والأحاديث والأنساب</small></div></div>
    <div class="p-tiles"><a class="p-tile" href="#/p/find/">🔍<span>بحث شامل</span></a><a class="p-tile" href="#/p/notes">🖍<span>ملاحظاتي</span></a><a class="p-tile" href="#/p/dl">⬇️<span>التنزيلات</span></a></div>`;
  wrap.innerHTML = html; box.parentNode.insertBefore(wrap, box);
  daily();
}
async function daily() {
  const el = $('#p-daily'); if (!el) return;
  const day = Math.floor((Date.now() + 3 * 3600e3) / 864e5);
  let out = '';
  try {
    const b = await getJson('hadith/nawawi40.json'); const all = []; b.chapters.forEach((c, ci) => c.h.forEach(h => all.push([h[0], h[1], ci])));
    if (all.length) { const h = all[day % all.length];
      out += `<div class="p-dc"><small>📜 حديث اليوم · الأربعون النووية ${esc(h[0])}</small><div class="t">${esc(h[1])}</div><div class="r"><button class="x-btn sm alt" data-p="img" data-t="${esc(h[1])}" data-f="الأربعون النووية · ${esc(h[0])}">🖼 مشاركة</button><a class="x-btn sm" href="#/x/hadith/nawawi40/${h[2]}">افتح</a></div></div>`; }
  } catch (e) {}
  const du = D().duas || [];
  if (du.length) { const x = du[day % du.length];
    out += `<div class="p-dc"><small>🤲 دعاء اليوم</small><div class="t">${esc(x.text)}</div><div class="r"><button class="x-btn sm alt" data-p="img" data-t="${esc(x.text)}" data-f="${esc(x.ref || '')}">🖼 مشاركة</button></div></div>`; }
  el.innerHTML = out;
}

/* ───── تعريف أول استخدام ───── */
function onboarding() {
  if (ls.get('p_onb', 0)) return;
  const S = [['📚', 'كل ما تحتاجه في مكان واحد', 'السيرة النبوية، قصص الأنبياء، التاريخ الإسلامي، الأنساب، والأحاديث مع الشرح.'],
    ['🎧', 'اقرأ، استمع، شارك', 'استمع لأي قصة بصوت مقروء، ظلّل ما يعجبك واحفظ ملاحظاتك، وشارك الأحاديث كصور جميلة.'],
    ['📴', 'يعمل بدون إنترنت', 'من «التنزيلات» تحدّث الملفات مرة، ثم يعمل التطبيق كله بلا اتصال. وغيّر المظهر والألوان من الإعدادات.']];
  let i = 0;
  const show = () => { const s = S[i]; const m = modal(`<div class="p-onb"><div class="e">${s[0]}</div><h2>${s[1]}</h2><p>${s[2]}</p>
    <div class="p-dots">${S.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="p-btns"><button class="x-btn alt" data-p="onbskip">تخطّي</button><button class="x-btn" data-p="onbnext">${i === S.length - 1 ? 'ابدأ' : 'التالي'}</button></div></div>`);
    m.classList.add('onb'); };
  window.__pOnb = () => { i++; if (i >= S.length) { ls.set('p_onb', 1); closeModal(); } else show(); };
  window.__pOnbSkip = () => { ls.set('p_onb', 1); closeModal(); };
  setTimeout(show, 900);
}

/* ───── الأحداث ───── */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-p]'); if (!el) return;
  const a = el.dataset.p;
  if (a === 'up') window.scrollTo({ top: 0, behavior: 'smooth' });
  else if (a === 'read') readPanel();
  else if (a === 'close') closeModal();
  else if (a === 'reset') { RD.fs = 0; RD.ff = ''; RD.lh = 0; RD.bg = ''; ls.set('p_read', RD); applyRead(); document.documentElement.style.setProperty('--fs', '21px'); closeModal(); }
  else if (a === 'hl') addNote();
  else if (a === 'savenote') saveNote();
  else if (a === 'delnote') { ls.set('p_notes', HL().filter(x => String(x.id) !== el.dataset.id)); viewNotes(); }
  else if (a === 'dlall') dlAll();
  else if (a === 'find') { const q = ($('#p-q') || {}).value; if (q) runFind(q); }
  else if (a === 'onbnext') window.__pOnb && window.__pOnb();
  else if (a === 'onbskip') window.__pOnbSkip && window.__pOnbSkip();
  else if (a === 'resume') { const L = ls.get('p_last', null); if (L && L.y) setTimeout(() => window.scrollTo(0, L.y), 700); }
  else if (a === 'img') {
    let t = el.dataset.t, f = el.dataset.f;
    if (!t) { const c = el.closest('.x-hd'); if (c) { t = $('.t', c).textContent; f = ($('.no', c) || {}).textContent; } else { const d = el.closest('.dua-card'); if (d) { t = $('.dua', d).textContent; f = ($('.ref', d) || {}).textContent; } } }
    if (t) shareImage(t, f);
  }
});

function afterRender() { fabs(); fabState(); injectShare(); paintSeen(); markHL(); homeBlock(); saveLast(); }
function boot() {
  applyRead(); watchApp(); onboarding();
  if (/^#\/(search|p\/)/.test(location.hash || '')) onRoute();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 150)); else setTimeout(boot, 150);
})();
