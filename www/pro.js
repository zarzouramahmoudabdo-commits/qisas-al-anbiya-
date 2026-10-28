/* ترقية الاحتراف: سلاسة، قراءة، تنزيلات، ملاحظات، مشاركة صورة، بحث موحّد، حديث اليوم، تعريف أول استخدام.
   وحدة مستقلة تُحمَّل بعد app.js وextra.js. مساراتها الخاصة: #/p/find  #/p/notes  #/p/dl */
(() => {
'use strict';
if (window.__qisasPro) return;
window.__qisasPro = true;
window.QPRO = {};

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
function play(a) { a.classList.remove('p-in'); void a.offsetWidth; a.classList.add('p-in'); }
function watchApp() {
  const a = app(); if (!a) return setTimeout(watchApp, 150);
  inObs = new MutationObserver(() => {
    afterRender();                                   // فورًا قبل الرسم لتفادي ومضة الواجهة القديمة
    if (a.querySelector('.p-skel')) { a._wasSk = true; play(a); }
    else if (a._wasSk) a._wasSk = false;            // استبدال الهيكل بالمحتوى: بدون إعادة حركة
    else play(a);
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
const RD = Object.assign({ fs: 0, ff: '', lh: 0, bg: '', auto: false, from: 19, to: 5, warm: true }, ls.get('p_read', {}));
const nightNow = () => { const h = new Date().getHours(); return RD.from > RD.to ? (h >= RD.from || h < RD.to) : (h >= RD.from && h < RD.to); };
function applyRead() {
  const r = document.documentElement.style;
  if (RD.fs) r.setProperty('--fs', RD.fs + 'px');
  RD.lh ? r.setProperty('--lh', RD.lh) : r.removeProperty('--lh');
  RD.ff ? r.setProperty('--ff', RD.ff) : r.removeProperty('--ff');
  const night = RD.auto && nightNow(), bg = night ? 'dark' : RD.bg;
  bg ? document.documentElement.setAttribute('data-rbg', bg) : document.documentElement.removeAttribute('data-rbg');
  let w = document.getElementById('p-warm');
  if (night && RD.warm) { if (!w) { w = document.createElement('div'); w.id = 'p-warm'; document.body.appendChild(w); } } else if (w) w.remove();
}
setInterval(() => { if (RD.auto) applyRead(); }, 60000);
const FONTS = [['', 'الافتراضي'], ["'Amiri','Noto Naskh Arabic','Traditional Arabic',serif", 'نسخ'], ["'Noto Sans Arabic','Segoe UI',Tahoma,sans-serif", 'بسيط']];
const BGS = [['', 'الافتراضي', '#faf6ea'], ['white', 'أبيض', '#ffffff'], ['paper', 'ورقي', '#f3e7c9'], ['dark', 'داكن', '#16211c'], ['black', 'أسود', '#000']];
function readPanel() {
  const m = modal(`<b>وضع القراءة</b>
    <div class="p-row"><span>حجم الخط <em id="p-fsv">${RD.fs || 21}</em></span><input id="p-fs" type="range" min="16" max="36" step="1" value="${RD.fs || 21}"></div>
    <div class="p-row"><span>تباعد الأسطر</span><input id="p-lh" type="range" min="1.5" max="2.8" step="0.1" value="${RD.lh || 2}"></div>
    <div class="p-row"><span>الخط</span><div class="p-seg">${FONTS.map(f => `<button data-pf="${esc(f[0])}" class="${RD.ff === f[0] ? 'on' : ''}">${f[1]}</button>`).join('')}</div></div>
    <div class="p-row"><span>الخلفية</span><div class="p-bgs">${BGS.map(b => `<button data-pb="${b[0]}" title="${b[1]}" class="${RD.bg === b[0] ? 'on' : ''}" style="background:${b[2]}"></button>`).join('')}</div></div>
    <div class="p-row"><label class="p-sw"><span>وضع ليلي تلقائي</span><input type="checkbox" id="p-auto" ${RD.auto ? 'checked' : ''}></label>
      <div class="p-night" ${RD.auto ? '' : 'hidden'}><span>من</span><select id="p-from">${[17, 18, 19, 20, 21, 22].map(h => `<option value="${h}" ${RD.from === h ? 'selected' : ''}>${h}:00</option>`).join('')}</select>
        <span>إلى</span><select id="p-to">${[3, 4, 5, 6, 7].map(h => `<option value="${h}" ${RD.to === h ? 'selected' : ''}>${h}:00</option>`).join('')}</select>
        <label class="p-sw"><span>تخفيف الضوء الأزرق</span><input type="checkbox" id="p-warm" ${RD.warm ? 'checked' : ''}></label></div></div>
    <div class="p-btns"><button class="x-btn alt" data-p="reset">إعادة الضبط</button><button class="x-btn" data-p="close">تم</button></div>`);
  $('#p-fs', m).oninput = e => { RD.fs = +e.target.value; $('#p-fsv', m).textContent = RD.fs; ls.set('p_read', RD); applyRead(); };
  const sv = () => { ls.set('p_read', RD); applyRead(); };
  $('#p-auto', m).onchange = e => { RD.auto = e.target.checked; $('.p-night', m).hidden = !RD.auto; sv(); };
  $('#p-from', m).onchange = e => { RD.from = +e.target.value; sv(); };
  $('#p-to', m).onchange = e => { RD.to = +e.target.value; sv(); };
  $('#p-warm', m).onchange = e => { RD.warm = e.target.checked; sv(); };
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
  closeModal(true);
  const m = document.createElement('div'); m.id = 'p-modal';
  m.innerHTML = `<div class="p-card">${html}</div>`;
  m.addEventListener('click', e => { if (e.target === m) closeModal(); });
  document.body.appendChild(m); return m;
}
function closeModal(instant) {
  const m = $('#p-modal'); if (!m) return;
  if (instant || !m.classList.contains('sheet') || m.classList.contains('closing')) { m.remove(); return; }
  m.classList.add('closing'); setTimeout(() => m.remove(), 240);
}
/* سحب القائمة للأسفل لإغلاقها */
function dragClose(m) {
  const card = $('.p-card', m); let y0 = 0, dy = 0, t0 = 0, on = false;
  card.addEventListener('touchstart', e => { if (card.scrollTop > 0) { on = false; return; } on = true; y0 = e.touches[0].clientY; dy = 0; t0 = Date.now(); card.style.animation = 'none'; card.style.transition = 'none'; }, { passive: true });
  card.addEventListener('touchmove', e => {
    if (!on) return; dy = e.touches[0].clientY - y0;
    if (dy <= 0) { card.style.transform = ''; return; }
    if (e.cancelable) e.preventDefault();
    card.style.transform = `translateY(${dy}px)`; m.style.background = `rgba(0,0,0,${Math.max(0, .66 - dy / 700)})`;
  }, { passive: false });
  const end = () => {
    if (!on) return; on = false;
    const v = dy / Math.max(1, Date.now() - t0);
    if (dy > 90 || (dy > 30 && v > .6)) { card.style.transition = 'transform .22s ease'; card.style.transform = 'translateY(105%)'; m.style.transition = 'background .22s'; m.style.background = 'transparent'; setTimeout(() => m.remove(), 230); }
    else { card.style.transition = 'transform .25s cubic-bezier(.2,.8,.2,1)'; card.style.transform = ''; m.style.background = ''; }
  };
  card.addEventListener('touchend', end); card.addEventListener('touchcancel', end);
}

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
  setPage(`<h2 class="page-title">ملاحظاتي</h2>${arr.length ? arr.map(x => `<div class="dua-card"><div class="dua">${esc(x.t)}</div>${x.n ? `<div class="p-nt">📝 ${esc(x.n)}</div>` : ''}
    <div class="row"><a class="chipbtn" href="${esc(x.h)}">فتح</a><button class="chipbtn" data-p="img" data-t="${esc(x.t)}">${IC.share}<span>صورة</span></button><button class="chipbtn" data-p="delnote" data-id="${x.id}">حذف</button></div></div>`).join('')
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
  setPage('<h2 class="page-title">التنزيلات</h2>' + SK);
  const rows = await dlStatus();
  const paint = rs => setPage(`<h2 class="page-title">التنزيلات</h2>
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
  $$('#app .x-hd .m').forEach(m => { if (!m.querySelector('[data-p="img"]')) { const b = document.createElement('button'); b.className = 'x-btn sm alt p-sh'; b.dataset.p = 'img'; b.innerHTML = IC.share + '<span>صورة</span>'; b.title = 'مشاركة كصورة'; m.appendChild(b); } });
  $$('#app .dua-card .row').forEach(m => { if (!m.querySelector('[data-p="img"]')) { const b = document.createElement('button'); b.className = 'chipbtn p-sh'; b.dataset.p = 'img'; b.innerHTML = IC.share + '<span>صورة</span>'; m.appendChild(b); } });
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
  setPage(`<h2 class="page-title">البحث الشامل</h2>
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
    if (p[1] === 'map') { window.QPRO.viewMap ? window.QPRO.viewMap(p[2]) : setPage('<div class="empty">جارٍ تحميل الخريطة…</div>'); } else if (p[1] === 'find') viewFind(p[2]); else if (p[1] === 'notes') viewNotes(); else if (p[1] === 'dl') viewDl();
    return;
  }
  if (/^#\/x\/(hadith\/[^/]+|history\/[^/]+|nasab)/.test(h)) { const a = app(); if (a && !a.querySelector('.x-wrap')) a.innerHTML = SK; }
  markSeen();
}
window.addEventListener('hashchange', onRoute);

/* ───── الرئيسية (واجهة جديدة) ───── */
const IC = {
  seerah: '<svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V12m14 9V12M5 12c0-4 3-6 7-9 4 3 7 5 7 9M12 3v-1.5M9 21v-4a3 3 0 016 0v4"/></svg>',
  prophets: '<svg viewBox="0 0 24 24"><path d="M12 6c-2-1.6-5-2-9-1.5v13c4-.5 7-.1 9 1.5 2-1.6 5-2 9-1.5v-13C17 4 14 4.4 12 6zM12 6v13"/></svg>',
  hadith: '<svg viewBox="0 0 24 24"><path d="M7 3h9a3 3 0 013 3v13a2 2 0 01-2 2H7a3 3 0 01-3-3V6a3 3 0 013-3zM8 8h7M8 12h7M8 16h4"/></svg>',
  history: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  nasab: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2.3"/><circle cx="5.5" cy="19" r="2.3"/><circle cx="18.5" cy="19" r="2.3"/><path d="M12 7.3V12M12 12l-6 4.7M12 12l6 4.7"/></svg>',
  lessons: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0012 3z"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7M6 10v10h4v-6h4v6h4V10"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/></svg>',
  more: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M12 15V4m0 0L8 8m4-4l4 4M5 13v6a1 1 0 001 1h12a1 1 0 001-1v-6"/></svg>',
  map: '<svg viewBox="0 0 24 24"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14"/></svg>',
  new: '<svg viewBox="0 0 24 24"><path d="M12 3l2.1 5.4L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.900-.6z"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  aa: '<svg viewBox="0 0 24 24"><path d="M3 19l5-13 5 13M5 14h6M15 19l3.5-8.5L22 19M16.2 16.5h4.6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  note: '<svg viewBox="0 0 24 24"><path d="M5 4h11l3 3v13H5zM9 11h6M9 15h4"/></svg>',
  dl: '<svg viewBox="0 0 24 24"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/></svg>'
};
const toAr = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
function greet() { const h = new Date().getHours(); return (h < 5 ? 'ليلة مباركة' : h < 12 ? 'صباح الخير' : h < 17 ? 'نهارك سعيد' : h < 20 ? 'مساء الخير' : 'ليلة مباركة') + '، ' + hijri(); }
function hijri() { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).replace(/ هـ$/, '') + ' هـ'; } catch (e) { return ''; } }
function resumeCard() {
  const d = D(), L = ls.get('p_last', null), A = ls.get('tamy_last', null), prog = ls.get('tamy_progress', {});
  let href = '', title = '', kind = '', pct = null;
  const m = L && L.h && L.h.match(/^#\/item\/([^/]+)\/([^/]+)/);
  if (L && L.h) { href = L.h; title = L.t; if (m) { kind = m[1]; const pr = prog[m[1] + ':' + m[2]]; if (pr && pr.total) pct = pr.done ? 100 : Math.round(pr.idx / pr.total * 100); } }
  else if (A && A.kind) { const it = ((d[A.kind] || []).find(x => x.id === A.id)); if (it) { href = `#/item/${A.kind}/${A.id}/r`; title = it.title; const pr = prog[A.kind + ':' + A.id]; if (pr && pr.total) pct = pr.done ? 100 : Math.round(pr.idx / pr.total * 100); } }
  if (!href) { const f = (d.prophets || [])[0]; if (!f) return ''; return `<a class="h2-resume start" href="#/item/prophets/${esc(f.id)}"><div class="h2-ring"><b><i>${IC.prophets}</i></b></div><div class="tx"><small>ابدأ رحلتك</small><b>${esc(f.title)}</b></div><span class="go">ابدأ ${IC.arrow}</span></a>`; }
  const r = 24, c = 2 * Math.PI * r, p = pct == null ? 0 : pct;
  const ring = `<div class="h2-ring"><svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="${r}" class="bg"/><circle cx="28" cy="28" r="${r}" class="fg" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - p / 100)).toFixed(1)}"/></svg><b>${pct == null ? '<i>' + IC.seerah + '</i>' : toAr(p) + '٪'}</b></div>`;
  return `<a class="h2-resume" href="${esc(href)}" data-p="resume">${ring}<div class="tx"><small>أكمل من حيث توقفت</small><b>${esc(title)}</b></div><span class="go">تابع ${IC.arrow}</span></a>`;
}
function homeBlock() {
  const box = $('#app .sec-cards'); if (!box || $('#app .p-home')) return;
  const d = D(), wrap = document.createElement('div'); wrap.className = 'p-home';
  const cnt = k => (d[k] || []).length;
  const tile = (href, ic, t, meta, cls) => `<a class="h2-tile ${cls || ''}" href="${href}"><span class="ic">${IC[ic]}</span><b>${t}</b><small>${meta}</small></a>`;
  const prog = ls.get('tamy_progress', {}), stories = cnt('seerah') + cnt('prophets');
  const done = Object.keys(prog).filter(k => prog[k] && prog[k].done).length, seen = Object.keys(ls.get('p_seen', {})).length;
  wrap.innerHTML = `
  <header class="h2-hero"><div class="arch" aria-hidden="true"></div><button class="h2-ref" data-act="update" aria-label="تحديث التطبيق" title="تحديث">🔄</button>
    <div class="date">${esc(greet())}</div>
    <h1>قصص الأنبياء</h1>
    <p>اقرأ سيرة النبي ﷺ وسير الأنبياء، وتعلّم من الأحاديث والتاريخ والأنساب.</p>
  </header>
  <form class="h2-search" data-form="search"><span>${IC.search}</span><input name="q" placeholder="ابحث في كل التطبيق" autocomplete="off" enterkeyhint="search"></form>
  ${resumeCard()}
  <div class="h2-bento">
    ${tile('#/seerah', 'seerah', 'السيرة النبوية', toAr(cnt('seerah')) + ' محطة من المولد إلى الوفاة', 'wide gold')}
    ${tile('#/prophets', 'prophets', 'قصص الأنبياء', toAr(cnt('prophets')) + ' نبيًّا')}
    ${tile('#/x/hadith', 'hadith', 'الأحاديث', 'أربعة كتب مع الشرح')}
    ${tile('#/x/history', 'history', 'التاريخ الإسلامي', '٢٢ فصلًا')}
    ${tile('#/x/nasab', 'nasab', 'أنساب الأنبياء', 'من آدم إلى محمد ﷺ')}
    ${tile('#/lessons', 'lessons', 'الفوائد والعبر', 'دروس وأدعية ومراجع', 'wide slim')}
  </div>
  <div class="p-daily" id="p-daily"></div>
  `;
  box.parentNode.insertBefore(wrap, box);
  daily();
  try { window.QPRO.onHome && window.QPRO.onHome(wrap); } catch (e) {}
}
async function daily() {
  const el = $('#p-daily'); if (!el) return;
  const day = Math.floor((Date.now() + 3 * 3600e3) / 864e5);
  let out = '';
  try {
    const b = await getJson('hadith/nawawi40.json'); const all = []; b.chapters.forEach((c, ci) => c.h.forEach(h => all.push([h[0], h[1], ci])));
    if (all.length) { const h = all[day % all.length];
      out += `<div class="p-dc"><small><i class="k"></i>حديث اليوم · الأربعون النووية ${esc(h[0])}</small><div class="t">${esc(h[1])}</div><div class="r"><button class="x-btn sm alt" data-p="img" data-t="${esc(h[1])}" data-f="الأربعون النووية · ${esc(h[0])}">${IC.share}<span>مشاركة</span></button><a class="x-btn sm" href="#/x/hadith/nawawi40/${h[2]}">افتح</a></div></div>`; }
  } catch (e) {}
  const du = D().duas || [];
  if (du.length) { const x = du[day % du.length];
    out += `<div class="p-dc"><small><i class="k"></i>دعاء اليوم</small><div class="t">${esc(x.text)}</div><div class="r"><button class="x-btn sm alt" data-p="img" data-t="${esc(x.text)}" data-f="${esc(x.ref || '')}">${IC.share}<span>مشاركة</span></button></div></div>`; }
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


/* ───── الشريط السفلي الجديد + قائمة «المزيد» + الترويسة ───── */
const NAVS = [['home', '#/', 'home', 'الرئيسية'], ['seerah', '#/seerah', 'seerah', 'السيرة'], ['prophets', '#/prophets', 'prophets', 'الأنبياء'], ['favs', '#/favs', 'heart', 'المفضلة'], ['more', '', 'more', 'المزيد']];
function buildNav() {
  const n = document.getElementById('nav'); if (!n || n.dataset.pn) return; n.dataset.pn = '1';
  n.innerHTML = NAVS.map(x => x[0] === 'more'
    ? `<a role="button" tabindex="0" data-n="more" data-p="more"><span class="pn-i">${IC[x[2]]}</span><em>${x[3]}</em></a>`
    : `<a href="${x[1]}" data-n="${x[0]}"><span class="pn-i">${IC[x[2]]}</span><em>${x[3]}</em></a>`).join('');
  const sync = () => { const m = $('#nav [data-n="more"]'); if (m) m.classList.toggle('new', !!(window.__qisasApkHas && window.__qisasApkHas())); };
  document.addEventListener('qisas-apk-flag', sync); sync(); setTimeout(sync, 4000);
}
const EMBLEM = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#15855c"/><stop offset="1" stop-color="#063d29"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><path d="M32 7c-9.5 6-15 14-15 25h30C47 21 41.500 13 32 7z" fill="none" stroke="#e8c75a" stroke-width="1.6" opacity=".75"/><path d="M36.500 15a9.500 9.500 0 100 15 7.500 7.500 0 010-15z" fill="#e8c75a"/><path d="M41 18.500l1 2.200 2.300.3-1.700 1.600.4 2.300-2-1.100-2 1.100.4-2.300-1.700-1.600 2.300-.3z" fill="#e8c75a"/><path d="M10 49c7-3.500 15-3.500 22 .5 7-4 15-4 22-.5V37c-7-3.500-15-3.500-22 .5-7-4-15-4-22-.5z" fill="#f6ecd0"/><path d="M32 37.500V49.500" stroke="#0b5d3b" stroke-width="1.400"/></svg>');
function header() {
  const im = $('#top .brand img'); if (im && im.dataset.pe !== '1') { im.src = EMBLEM; im.dataset.pe = '1'; }
  const br = $('#top .brand'); if (br && br.dataset.pt !== '1') { br.dataset.pt = '1'; [...br.childNodes].forEach(c => { if (c.nodeType === 3 && c.textContent.trim()) c.textContent = 'قصص الأنبياء'; }); }
}
function moreSheet() {
  const d = D(), prog = ls.get('tamy_progress', {}), stories = (d.seerah || []).length + (d.prophets || []).length;
  const done = Object.keys(prog).filter(k => prog[k] && prog[k].done).length, seen = Object.keys(ls.get('p_seen', {})).length;
  const pct = stories ? Math.round(done / stories * 100) : 0, hasNew = !!(window.__qisasApkHas && window.__qisasApkHas());
  const row = (href, ic, t, sub, attr) => `<a class="ms-row" ${href ? `href="${href}"` : 'role="button"'} ${attr || ''}><span class="ic">${IC[ic]}</span><div><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</div><span class="chev">${IC.arrow}</span></a>`;
  const m = modal(`<div class="ms-grip"></div>
    <div class="ms-prog"><div><b>${done}</b><small>من ${stories} قصة</small></div><div class="bar"><i style="width:${pct}%"></i></div><div><b>${seen}</b><small>صفحة قرأتها</small></div></div>
    <div class="ms-g"><h4>المكتبة</h4>
      ${row('#/x/hadith', 'hadith', 'الأحاديث', 'أربعة كتب مع الشرح')}${row('#/x/history', 'history', 'التاريخ الإسلامي', 'اثنان وعشرون فصلًا')}
      ${row('#/x/nasab', 'nasab', 'أنساب الأنبياء', 'من آدم إلى محمد ﷺ')}${row('#/lessons', 'lessons', 'الفوائد والعبر', 'دروس وأدعية ومراجع')}</div>
    <div class="ms-g"><h4>أدواتي</h4>
      ${row('#/p/find/', 'search', 'بحث شامل', 'في القصص والأحاديث والتاريخ')}${row('#/p/notes', 'note', 'ملاحظاتي', 'المقاطع التي ظلّلتها')}
      ${row('#/p/map', 'map', 'خريطة الأحداث', 'أماكن الأنبياء والسيرة والغزوات')}${row('#/p/dl', 'dl', 'التنزيلات', 'للعمل بدون إنترنت')}${row('', 'aa', 'وضع القراءة', 'الخط والخلفية والتباعد', 'data-p="read2"')}</div>
    <div class="ms-g"><h4>التطبيق</h4>
      ${row('', 'new', 'ما الجديد', 'آخر التحديثات والمحتوى المضاف', 'data-p="whatsnew"')}${row('#/settings', 'gear', 'الإعدادات', 'المظهر واللون وحجم الخط')}${row('', 'dl', 'تحديث التطبيق', hasNew ? 'يتوفر إصدار جديد — اضغط للتثبيت' : 'التحقق من آخر إصدار', 'data-p="apk"' + (hasNew ? ' data-new="1"' : ''))}</div>`);
  m.classList.add('sheet'); dragClose(m); try { window.QPRO.onSheet && window.QPRO.onSheet(m); } catch (e) {}
  m.addEventListener('click', e => { if (e.target.closest('a.ms-row[href]')) setTimeout(closeModal, 0); });
}

/* ───── الأحداث ───── */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-p]'); if (!el) return;
  const a = el.dataset.p;
  if (a === 'up') window.scrollTo({ top: 0, behavior: 'smooth' });
  else if (a === 'read') readPanel();
  else if (a === 'more') moreSheet();
  else if (a === 'whatsnew') { closeModal(); window.QPRO.showNew && window.QPRO.showNew(true); }
  else if (a === 'read2') { closeModal(); readPanel(); }
  else if (a === 'apk') { closeModal(); if (window.__qisasApkAction) window.__qisasApkAction(); else toast('التحديث الداخلي متاح داخل تطبيق أندرويد فقط'); }
  else if (a === 'close') closeModal();
  else if (a === 'reset') { RD.fs = 0; RD.ff = ''; RD.lh = 0; RD.bg = ''; RD.auto = false; ls.set('p_read', RD); applyRead(); document.documentElement.style.setProperty('--fs', '21px'); closeModal(); }
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

function exposeApi() { Object.assign(window.QPRO, { $, $$, esc, strip, ls, toast, modal, closeModal, dragClose, IC, setPage, getJson, loadScript, app, D, toAr }); }
function afterRender() { homeBlock(); const A = app(); const hm = !!$('.p-home'); if (A) { A.classList.toggle('p2', hm); A.classList.add('p-ready'); document.documentElement.classList.add('q-ready'); } document.body.classList.toggle('p-onhome', hm); buildNav(); header(); fabs(); fabState(); injectShare(); paintSeen(); markHL(); saveLast(); }
function boot() {
  try { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@700&display=swap'; document.head.appendChild(l); } catch (e) {}
  exposeApi(); applyRead(); watchApp(); onboarding();
  ['live.js', 'data-map.js', 'map.js'].forEach(f => loadScript(f).catch(() => {}));
  if (/^#\/(search|p\/)/.test(location.hash || '')) onRoute();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0)); else setTimeout(boot, 0);
})();
