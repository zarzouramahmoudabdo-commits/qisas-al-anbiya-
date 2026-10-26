/* أقسام إضافية: أنساب الأنبياء، التاريخ الإسلامي، الأحاديث النبوية
   وحدة مستقلة تُحمَّل بعد app.js ولا تغيّر منطقه. المسارات: #/x/nasab  #/x/history  #/x/hadith */
(() => {
'use strict';
if (window.__qisasExtra) return;
window.__qisasExtra = true;

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const strip = s => String(s || '').replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toLowerCase();
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const app = () => document.getElementById('app');

function toast(msg) {
  const t = document.createElement('div'); t.className = 'x-toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
}

/* ───── تحميل ملفات البيانات عند الحاجة ───── */
const loaded = {};
function loadScript(src) {
  if (!loaded[src]) loaded[src] = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src;
    s.onload = () => res(); s.onerror = () => { delete loaded[src]; rej(new Error('load ' + src)); };
    document.head.appendChild(s);
  });
  return loaded[src];
}
async function need(name) {
  if (name === 'nasab' && !window.QISAS_NASAB) await loadScript('data-nasab.js');
  if (name === 'history' && !(window.QISAS_HISTORY && window.QISAS_HISTORY.__b)) {
    if (!window.QISAS_HISTORY) await loadScript('data-history-a.js');
    await loadScript('data-history-b.js'); window.QISAS_HISTORY.__b = true;
  }
}
const jcache = {};
async function getJson(path) {
  if (jcache[path]) return jcache[path];
  const r = await fetch(path);
  if (!r.ok) throw new Error(path + ' ' + r.status);
  return (jcache[path] = await r.json());
}

/* ───── القراءة بصوت عالٍ ───── */
let speaking = false, spkToken = 0;
function chunks(text, max) {
  const out = [];
  String(text).replace(/\s+/g, ' ').split(/(?<=[\.،؛:!؟\?۔])\s+/).forEach(s => {
    while (s.length > max) {
      let i = s.lastIndexOf(' ', max); if (i < 40) i = max;
      out.push(s.slice(0, i)); s = s.slice(i).trim();
    }
    if (s) out.push(s);
  });
  return out;
}
async function stopSpeak() {
  spkToken++; speaking = false;
  try { if (window.QisasNativeTTS) await window.QisasNativeTTS.stop(); } catch (e) {}
  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
  document.querySelectorAll('[data-x="listen"]').forEach(b => b.textContent = '🔊 استمع');
}
async function speakText(text) {
  const my = ++spkToken; speaking = true;
  document.querySelectorAll('[data-x="listen"]').forEach(b => b.textContent = '⏹ إيقاف');
  const parts = chunks(text, 170);
  for (const p of parts) {
    if (my !== spkToken) return;
    try {
      if (window.QisasNativeTTS) {
        await window.QisasNativeTTS.speak({ text: p, lang: 'ar-SA', rate: 1, pitch: 1, volume: 1, category: 'ambient' });
      } else if (window.speechSynthesis) {
        await new Promise(res => {
          const u = new SpeechSynthesisUtterance(p); u.lang = 'ar-SA';
          u.onend = u.onerror = () => res(); window.speechSynthesis.speak(u);
        });
      } else { toast('الصوت غير متاح على هذا الجهاز'); break; }
    } catch (e) { if (my === spkToken) toast('تعذّر تشغيل الصوت'); break; }
  }
  if (my === spkToken) stopSpeak();
}
let curText = '';

/* ───── أدوات عرض ───── */
function paras(text) {
  return String(text || '').split(/\n{2,}/).map(p => {
    p = p.trim(); if (!p) return '';
    if (p.startsWith('## ')) return `<h3>${esc(p.slice(3))}</h3>`;
    return `<p>${esc(p)}</p>`;
  }).join('');
}
const wrap = h => `<div class="x-wrap">${h}</div>`;
function setPage(html) {
  stopSpeak();
  const a = app(); if (!a) return;
  a.innerHTML = wrap(html);
  window.scrollTo(0, 0);
  const b = $('#btnBack'); if (b) b.hidden = false;
  document.querySelectorAll('#nav a').forEach(x => x.classList.remove('on'));
}
const notFound = () => setPage('<div class="x-empty">الصفحة غير موجودة<br><a class="x-btn" href="#/">الرئيسية</a></div>');
const pager = (prev, next) => `<div class="x-pg">${prev ? `<a href="${prev[0]}">‹ ${esc(prev[1])}</a>` : '<span></span>'}${next ? `<a href="${next[0]}">${esc(next[1])} ›</a>` : '<span></span>'}</div>`;

/* ═════════ الأنساب ═════════ */
let nFilter = 'all';
async function viewNasab(parts) {
  await need('nasab');
  const N = window.QISAS_NASAB; const id = parts[0];
  if (id === 'lineage') {
    const rows = N.lineage.map(x => x.gap
      ? `<span class="gap">${esc(x.n)}</span>`
      : (x.p ? `<a href="#/x/nasab/${esc(x.p)}">${esc(x.n)}</a>` : `<span>${esc(x.n)}</span>`)).join('');
    return setPage(`<h1 class="x-h1">نسب النبي ﷺ من آدم</h1><div class="x-note warn">${esc(N.lineageNote)}</div><div class="x-line">${rows}</div>`);
  }
  if (id) {
    const i = N.prophets.findIndex(p => p.id === id); if (i < 0) return notFound();
    const p = N.prophets[i], t = N.tiers[p.tier] || {};
    const kids = (p.children || []).map(c => {
      const inner = `${esc(c.n)}${c.note ? ` <em>— ${esc(c.note)}</em>` : ''}`;
      return c.p ? `<a class="x-kid" href="#/x/nasab/${esc(c.p)}">${inner}</a>` : `<span class="x-kid">${inner}</span>`;
    }).join('');
    const full = [p.text, p.father ? '' : ''].join('');
    curText = p.name + '. ' + p.text.replace(/\n+/g, ' ');
    const prev = N.prophets[i - 1], next = N.prophets[i + 1];
    return setPage(`
      <h1 class="x-h1">${esc(p.name)} <span class="x-tag ${esc(t.css || '')}">${esc(t.label || '')}</span></h1>
      <div class="x-sub">${esc(p.era || '')}</div>
      ${p.disputed ? `<div class="x-note warn">${esc(p.disputed)}</div>` : ''}
      <div class="x-note"><b>الأب/الأصل:</b> ${esc(p.father || '—')}</div>
      ${(p.verses || []).length ? `<div class="x-note"><b>الآيات:</b> ${(p.verses).map(esc).join('، ')}</div>` : ''}
      <div class="x-bar"><button class="x-btn sm" data-x="listen">🔊 استمع</button></div>
      <div class="x-body">${paras(full)}</div>
      ${kids ? `<h3 class="x-era">الأبناء والذرية</h3><div>${kids}</div>` : ''}
      ${p.wives ? `<div class="x-note"><b>الزوجات:</b> ${esc(p.wives)}</div>` : ''}
      <div class="x-src"><b>المصادر:</b> ${(p.sources || []).map(esc).join(' • ')}</div>
      ${pager(prev && ['#/x/nasab/' + prev.id, prev.name], next && ['#/x/nasab/' + next.id, next.name])}`);
  }
  const f = nFilter;
  const list = N.prophets.filter(p => f === 'all' || p.tier === f).map(p => {
    const t = N.tiers[p.tier] || {};
    return `<a class="x-row" href="#/x/nasab/${esc(p.id)}"><span class="n">${N.prophets.indexOf(p) + 1}</span><div><b>${esc(p.name)} <span class="x-tag ${esc(t.css || '')}">${esc(t.label || '')}</span></b><small>${esc(p.era || '')}</small></div><span class="arr">›</span></a>`;
  }).join('');
  const chip = (k, l) => `<button class="x-chip ${f === k ? 'on' : ''}" data-x="nfilter" data-v="${k}">${l}</button>`;
  setPage(`<h1 class="x-h1">الأنبياء وذرياتهم</h1><div class="x-sub">${esc(N.intro)}</div>
    <a class="x-btn" style="display:inline-block;text-decoration:none" href="#/x/nasab/lineage">نسب النبي ﷺ من آدم</a>
    <div class="x-chips">${chip('all', 'الكل')}${Object.keys(N.tiers).map(k => chip(k, N.tiers[k].label)).join('')}</div>
    <div class="x-list">${list}</div>`);
}

/* ═════════ التاريخ ═════════ */
async function viewHistory(parts) {
  await need('history');
  const H = window.QISAS_HISTORY; const id = parts[0];
  if (id === 'search') return historySearch(decodeURIComponent(parts[1] || ''));
  if (id) {
    const i = H.chapters.findIndex(c => c.id === id); if (i < 0) return notFound();
    const c = H.chapters[i];
    curText = c.title + '. ' + c.body.join(' ').replace(/## /g, '');
    const prev = H.chapters[i - 1], next = H.chapters[i + 1];
    const tl = (c.timeline || []).map(t => `<li><b>${esc(t[0])}</b> — ${esc(t[1])}</li>`).join('');
    return setPage(`
      <h1 class="x-h1">${esc(c.title)}</h1><div class="x-sub">${esc(c.period)}</div>
      <div class="x-bar"><button class="x-btn sm" data-x="listen">🔊 استمع</button></div>
      ${tl ? `<h3 class="x-era">أبرز التواريخ</h3><ul class="x-tl">${tl}</ul>` : ''}
      <div class="x-body">${paras(c.body.join('\n\n'))}</div>
      <div class="x-src"><b>المصادر:</b> ${(c.sources || []).map(esc).join(' • ')}</div>
      <div class="x-note">التواريخ الميلادية تقريبية، وتتفاوت الروايات في بعض التفاصيل. راجع الكتب المطبوعة قبل الاستشهاد.</div>
      ${pager(prev && ['#/x/history/' + prev.id, prev.title], next && ['#/x/history/' + next.id, next.title])}`);
  }
  let html = `<h1 class="x-h1">التاريخ الإسلامي</h1><div class="x-sub">${esc(H.intro)}</div>
    <form class="x-search" data-x-form="history"><input name="q" placeholder="ابحث في التاريخ…" autocomplete="off"><button class="x-btn">بحث</button></form>`;
  H.eras.forEach(e => {
    const cs = H.chapters.filter(c => c.era === e.id); if (!cs.length) return;
    html += `<div class="x-era">${esc(e.title)}<small>${esc(e.period)}</small></div><div class="x-list">` +
      cs.map(c => `<a class="x-row" href="#/x/history/${esc(c.id)}"><span class="n">${H.chapters.indexOf(c) + 1}</span><div><b>${esc(c.title)}</b><small>${esc(c.period)}</small></div><span class="arr">›</span></a>`).join('') + '</div>';
  });
  setPage(html);
}
function historySearch(q) {
  const H = window.QISAS_HISTORY, nq = strip(q);
  const res = nq ? H.chapters.filter(c => strip(c.title + ' ' + c.body.join(' ') + ' ' + (c.timeline || []).map(t => t.join(' ')).join(' ')).includes(nq)) : [];
  setPage(`<h1 class="x-h1">نتائج: ${esc(q)}</h1><div class="x-list">${res.map(c => `<a class="x-row" href="#/x/history/${esc(c.id)}"><div><b>${esc(c.title)}</b><small>${esc(c.period)}</small></div><span class="arr">›</span></a>`).join('') || '<div class="x-empty">لا توجد نتائج</div>'}</div>`);
}

/* ═════════ الحديث ═════════ */
const PAGE = 30;
let hShown = PAGE, hCtx = null;
const favs = () => ls.get('x_hfav', []);
const favKey = (b, n) => b + ':' + n;
function hadithCard(h, b, hl) {
  const [n, t] = h; const on = favs().some(f => f.k === favKey(b.id, n));
  let txt = esc(t);
  if (hl) { try { const re = new RegExp('(' + hl.split(/\s+/).filter(Boolean).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g'); txt = txt.replace(re, '<mark class="x-m">$1</mark>'); } catch (e) {} }
  return `<div class="x-hd"><div class="t">${txt}</div><div class="m"><span class="no">${esc(b.short || b.title)} · ${esc(n)}</span>
    <button class="x-btn sm alt" data-x="hlisten" data-b="${esc(b.id)}" data-n="${esc(n)}">🔊</button>
    <button class="x-btn sm alt" data-x="hcopy" data-b="${esc(b.id)}" data-n="${esc(n)}">نسخ</button>
    <button class="x-btn sm alt" data-x="hfav" data-b="${esc(b.id)}" data-n="${esc(n)}">${on ? '♥' : '♡'}</button>${b.id === 'nawawi40' ? `<button class="x-btn sm" data-x="sharh" data-n="${esc(n)}">📖 الشرح</button>` : ''}</div><div class="x-sharh" hidden></div></div>`;
}
async function viewHadith(parts) {
  let idx;
  try { idx = await getJson('hadith/index.json'); }
  catch (e) {
    return setPage(`<h1 class="x-h1">الأحاديث النبوية</h1><div class="x-empty">لم تُجهَّز بيانات الأحاديث بعد.<br>شغّل أداة التجهيز من تريمكس ثم حدّث التطبيق.</div>`);
  }
  const [bid, sub, arg] = parts;
  if (bid === 'fav') {
    const f = favs();
    return setPage(`<h1 class="x-h1">أحاديثي المفضلة</h1>${f.length ? f.map(x => `<div class="x-hd"><div class="t">${esc(x.t)}</div><div class="m"><span class="no">${esc(x.s)} · ${esc(x.n)}</span><button class="x-btn sm alt" data-x="hunfav" data-k="${esc(x.k)}">حذف</button></div></div>`).join('') : '<div class="x-empty">لم تضف أحاديث بعد</div>'}`);
  }
  if (!bid) {
    const books = idx.books.map(b => `<a class="x-row" href="#/x/hadith/${esc(b.id)}"><span class="n">📜</span><div><b>${esc(b.title)}</b><small>${esc(b.author)} · ${esc(b.count)} حديثًا</small></div><span class="arr">›</span></a>`).join('');
    return setPage(`<h1 class="x-h1">الأحاديث النبوية</h1>
      <div class="x-sub">${esc(idx.intro || '')}</div>
      <div class="x-list">${books}<a class="x-row" href="#/x/hadith/fav"><span class="n">♥</span><div><b>أحاديثي المفضلة</b></div><span class="arr">›</span></a></div>
      <div class="x-note">${esc(idx.note || 'النصوص منقولة من مجموعات منشورة؛ تحقق منها من الطبعات المحققة قبل الاستشهاد، ولا يُقصد بهذا القسم استيعاب كل ما صحّ عن النبي ﷺ.')}</div>`);
  }
  const meta = idx.books.find(b => b.id === bid); if (!meta) return notFound();
  let book;
  try { book = await getJson('hadith/' + bid + '.json'); } catch (e) { return setPage('<div class="x-empty">تعذّر تحميل هذا الكتاب. تحقق من الاتصال ثم أعد المحاولة.</div>'); }
  const B = Object.assign({ id: bid }, meta, { chapters: book.chapters });
  if (sub === 's') {
    const q = decodeURIComponent(arg || ''), nq = strip(q).split(/\s+/).filter(Boolean);
    const out = [];
    for (const ch of B.chapters) for (const h of ch.h) {
      const s = strip(h[1]);
      if (nq.every(w => s.includes(w))) { out.push(h); if (out.length >= 300) break; }
    }
    hCtx = { b: B, list: out, hl: q }; hShown = PAGE;
    return setPage(`<h1 class="x-h1">«${esc(q)}» في ${esc(B.title)}</h1><div class="x-sub">${out.length >= 300 ? 'أول 300 نتيجة' : out.length + ' نتيجة'}</div><div id="xh">${renderHadithList()}</div>`);
  }
  if (sub != null && sub !== '') {
    const ci = parseInt(sub, 10), ch = B.chapters[ci]; if (!ch) return notFound();
    hCtx = { b: B, list: ch.h, hl: '' }; hShown = PAGE;
    return setPage(`<h1 class="x-h1">${esc(ch.t)}</h1><div class="x-sub">${esc(B.title)} · ${ch.h.length} حديثًا</div><div id="xh">${renderHadithList()}</div>
      ${pager(ci > 0 && ['#/x/hadith/' + bid + '/' + (ci - 1), 'السابق'], ci < B.chapters.length - 1 && ['#/x/hadith/' + bid + '/' + (ci + 1), 'التالي'])}`);
  }
  const chs = B.chapters.map((c, i) => `<a class="x-row" href="#/x/hadith/${esc(bid)}/${i}"><span class="n">${i + 1}</span><div><b>${esc(c.t)}</b><small>${c.h.length} حديثًا</small></div><span class="arr">›</span></a>`).join('');
  setPage(`<h1 class="x-h1">${esc(B.title)}</h1><div class="x-sub">${esc(B.author)}${B.note ? ' — ' + esc(B.note) : ''}</div>
    <form class="x-search" data-x-form="hadith" data-b="${esc(bid)}"><input name="q" placeholder="ابحث في هذا الكتاب…" autocomplete="off"><button class="x-btn">بحث</button></form>
    <div class="x-list">${chs}</div>`);
}
function renderHadithList() {
  const { b, list, hl } = hCtx;
  const part = list.slice(0, hShown).map(h => hadithCard(h, b, hl)).join('');
  const more = list.length > hShown ? `<div class="x-bar"><button class="x-btn" data-x="more">عرض المزيد (${list.length - hShown})</button></div>` : '';
  return part + more || '<div class="x-empty">لا توجد نتائج</div>';
}

/* ───── التوجيه ───── */
async function go() {
  const h = location.hash || '';
  if (!/^#\/x(\/|$)/.test(h)) return;
  const parts = h.replace(/^#\/x\/?/, '').split('/').filter(x => x !== '');
  const [sec, ...rest] = parts;
  try {
    if (sec === 'nasab') await viewNasab(rest);
    else if (sec === 'history') await viewHistory(rest);
    else if (sec === 'hadith') await viewHadith(rest);
    else location.hash = '#/';
  } catch (e) {
    setPage(`<div class="x-empty">تعذّر تحميل هذا القسم.<br>تأكد من الاتصال بالإنترنت أو حدّث التطبيق.<br><small>${esc(e && e.message)}</small></div>`);
  }
}
window.addEventListener('hashchange', () => setTimeout(go, 0));

/* ───── شرح الأربعين ───── */
async function toggleSharh(el) {
  const card = el.closest('.x-hd'), box = card.querySelector('.x-sharh');
  if (!box.hidden) { box.hidden = true; return; }
  try { if (!window.QISAS_SHARH) await loadScript('data-sharh-nawawi.js'); } catch (e) { box.innerHTML = '<p>تعذّر تحميل الشرح.</p>'; box.hidden = false; return; }
  const text = strip(card.querySelector('.t').textContent), n = parseInt(el.dataset.n, 10);
  const S = window.QISAS_SHARH;
  let e = S[n - 1] && text.includes(strip(S[n - 1].k)) ? S[n - 1] : S.find(x => text.includes(strip(x.k)));
  if (!e) { box.innerHTML = '<p>لا يتوفر شرح لهذا الحديث.</p>'; box.hidden = false; return; }
  curText = e.t + '. ' + e.s.replace(/\n+/g, ' ');
  box.innerHTML = `<h3>${esc(e.t)}</h3>${paras(e.s)}<h3>من الفوائد</h3><ul>${(e.f || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="x-bar"><button class="x-btn sm" data-x="listen">🔊 استمع</button></div>
    <div class="x-src">الشرح ملخص بتصرّف من شروح العلماء (ابن رجب، ابن دقيق العيد، النووي)، وليس نصًّا حرفيًّا؛ راجع الشروح المطبوعة للاستشهاد.</div>`;
  box.hidden = false;
}

/* ───── الأحداث ───── */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-x]'); if (!el) return;
  const a = el.dataset.x;
  if (a === 'listen') { speaking ? stopSpeak() : speakText(curText); }
  else if (a === 'nfilter') { nFilter = el.dataset.v; go(); }
  else if (a === 'more') { hShown += PAGE; $('#xh').innerHTML = renderHadithList(); }
  else if (a === 'hcopy' || a === 'hfav' || a === 'hlisten') {
    const b = hCtx && hCtx.b; if (!b) return;
    const h = hCtx.list.find(x => String(x[0]) === el.dataset.n); if (!h) return;
    if (a === 'hlisten') { speaking ? stopSpeak() : speakText(h[1]); return; }
    if (a === 'hcopy') {
      const txt = h[1] + '\n— ' + b.title + ' (' + h[0] + ')';
      if (navigator.share) navigator.share({ text: txt }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast('تم النسخ'), () => toast('تعذّر النسخ'));
      return;
    }
    const k = favKey(b.id, h[0]); let f = favs();
    if (f.some(x => x.k === k)) { f = f.filter(x => x.k !== k); el.textContent = '♡'; }
    else { f.push({ k, n: h[0], s: b.short || b.title, t: h[1] }); el.textContent = '♥'; toast('أُضيف إلى المفضلة'); }
    ls.set('x_hfav', f);
  }
  else if (a === 'sharh') { toggleSharh(el); }
  else if (a === 'hunfav') { ls.set('x_hfav', favs().filter(x => x.k !== el.dataset.k)); go(); }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-x-form]'); if (!f) return;
  e.preventDefault();
  const q = f.q.value.trim(); if (!q) return;
  if (f.dataset.xForm === 'history') location.hash = '#/x/history/search/' + encodeURIComponent(q);
  else location.hash = '#/x/hadith/' + f.dataset.b + '/s/' + encodeURIComponent(q);
});

/* ───── بطاقات الصفحة الرئيسية ───── */
const CARDS = [
  ['#/x/history', '🏛️', 'التاريخ الإسلامي', 'من العرب قبل الإسلام والخلافة الراشدة إلى الأمويين والعباسيين والأندلس والصليبيين والعثمانيين والعصر الحديث، بالتواريخ والمصادر'],
  ['#/x/nasab', '🌳', 'الأنبياء وذرياتهم', 'جميع الأنبياء من آدم إلى محمد ﷺ مع أبنائهم وأنسابهم والآيات وبيان درجة الثبوت'],
  ['#/x/hadith', '📜', 'الأحاديث النبوية', 'الصحيحان والأربعون النووية ورياض الصالحين، مع البحث والاستماع والمفضلة']
];
function injectCards() {
  const box = $('#app .sec-cards'); if (!box || box.querySelector('[data-xcard]')) return;
  const last = box.lastElementChild; // الإعدادات تبقى في الآخر
  CARDS.forEach(c => {
    const a = document.createElement('a'); a.className = 'sec-card'; a.href = c[0]; a.setAttribute('data-xcard', '1');
    a.innerHTML = `<div class="big">${c[1]}</div><div><h3>${esc(c[2])}</h3><p>${esc(c[3])}</p></div><span class="arr">›</span>`;
    box.insertBefore(a, last);
  });
}
function watch() {
  const a = app(); if (!a) return setTimeout(watch, 200);
  new MutationObserver(() => injectCards()).observe(a, { childList: true });
  injectCards(); go();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(watch, 100)); else setTimeout(watch, 100);
})();

/* طلب تنزيل الملفات للعمل بدون إنترنت */
(() => {
  const pre = () => { try { navigator.serviceWorker && navigator.serviceWorker.ready.then(r => r.active && r.active.postMessage('precache')); } catch (e) {} };
  window.addEventListener('online', pre); setTimeout(pre, 4000);
})();

/* تحديث الـ APK من داخل التطبيق (يعمل في تطبيق أندرويد فقط) */
(() => { try { var s = document.createElement('script'); s.src = 'apk-update.js'; document.head.appendChild(s); } catch (e) {} })();
