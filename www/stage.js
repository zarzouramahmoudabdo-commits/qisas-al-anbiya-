/* واجهة القوائم: بطاقات تُسحب أفقيًا، وعند الوقوف على بطاقة تظهر خلفية وتعريف خاص بها */
(() => {
'use strict';
if (window.__qStage) return; window.__qStage = 1;
const IC = {
  seerah: '<svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V12m14 9V12M5 12c0-4 3-6 7-9 4 3 7 5 7 9M12 3v-1.5M9 21v-4a3 3 0 016 0v4"/></svg>',
  prophets: '<svg viewBox="0 0 24 24"><path d="M12 6c-2-1.6-5-2-9-1.5v13c4-.5 7-.1 9 1.5 2-1.6 5-2 9-1.5v-13C17 4 14 4.4 12 6zM12 6v13"/></svg>',
  hadith: '<svg viewBox="0 0 24 24"><path d="M7 3h9a3 3 0 013 3v13a2 2 0 01-2 2H7a3 3 0 01-3-3V6a3 3 0 013-3zM8 8h7M8 12h7M8 16h4"/></svg>',
  history: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  nasab: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2.3"/><circle cx="5.5" cy="19" r="2.3"/><circle cx="18.5" cy="19" r="2.3"/><path d="M12 7.3V12M12 12l-6 4.7M12 12l6 4.7"/></svg>',
  lessons: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0012 3z"/></svg>'
};
const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
try { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'stage.css'; document.head.appendChild(l); } catch (e) {}

function items() {
  const d = window.TAMY_DATA || {}, n = k => (d[k] || []).length;
  return [
    { id: 'seerah', href: '#/seerah', t: 'السيرة النبوية', m: (n('seerah') ? ar(n('seerah')) + ' محطة' : 'من المولد إلى الوفاة'), d: 'رحلة النبي ﷺ من المولد إلى الوفاة: النشأة والبعثة والهجرة والغزوات، في محطات مرتبة تقرؤها وتسمعها.', c: ['#7a5a16', '#1c1507'] },
    { id: 'prophets', href: '#/prophets', t: 'قصص الأنبياء', m: (n('prophets') ? ar(n('prophets')) + ' نبيًّا' : 'من آدم إلى عيسى'), d: 'قصص أنبياء الله ورسله كما وردت في القرآن والسنة، بما فيها من عبر وفوائد تُنير الطريق.', c: ['#0f6b45', '#04271a'] },
    { id: 'hadith', href: '#/x/hadith', t: 'الأحاديث', m: 'أربعة كتب مع الشرح', d: 'أربعة كتب من السنة النبوية مع شرح مبسّط يوضّح المعنى والفوائد، لتفهم الحديث وتعمل به.', c: ['#0e6a73', '#04252a'] },
    { id: 'history', href: '#/x/history', t: 'التاريخ الإسلامي', m: 'فصول متتابعة', d: 'فصول من التاريخ الإسلامي تتبّع أحداثه وأعلامه بأسلوب مبسّط، لتأخذ منه العبرة.', c: ['#7a4421', '#241107'] },
    { id: 'nasab', href: '#/x/nasab', t: 'أنساب الأنبياء', m: 'من آدم إلى محمد ﷺ', d: 'شجرة أنساب الأنبياء من آدم عليه السلام إلى نبينا محمد ﷺ، في عرض واضح يسهل تتبعه.', c: ['#5a3b86', '#170d29'] },
    { id: 'lessons', href: '#/lessons', t: 'الفوائد والعبر', m: 'دروس وأدعية ومراجع', d: 'فوائد وعبر وأدعية ومراجع مختارة، تزيد الفهم وتعين على العمل.', c: ['#8d3c52', '#2b0e18'] }
  ];
}

function build(wrap) {
  const hero = wrap.querySelector('.h2-hero'), bento = wrap.querySelector('.h2-bento');
  if (!hero || wrap.dataset.stage) return;
  wrap.dataset.stage = '1';
  const its = items(), date = (hero.querySelector('.date') || {}).outerHTML || '', ref = hero.querySelector('.h2-ref');
  hero.classList.add('st');
  hero.innerHTML = `
    <div class="st-bgs">${its.map((x, i) => `<div class="st-bg${i ? '' : ' on'}" style="--a:${x.c[0]};--b:${x.c[1]}"><i>${IC[x.id]}</i></div>`).join('')}</div>
    <div class="st-top">${date}<span class="st-count"><b>${ar(1)}</b>/${ar(its.length)}</span></div>
    <div class="st-txt" aria-live="polite"><h1></h1><p></p><a class="st-open" href="#">افتح القسم<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></a></div>
    <div class="st-row" role="list">${its.map((x, i) => `<a class="st-card${i ? '' : ' on'}" role="listitem" href="${x.href}" data-i="${i}" style="--a:${x.c[0]};--b:${x.c[1]}"><span class="ic">${IC[x.id]}</span><b>${esc(x.t)}</b><small>${esc(x.m)}</small></a>`).join('')}</div>
    <div class="st-bar"><i></i></div>`;
  if (ref) hero.appendChild(ref);
  if (bento) bento.remove();

  const row = hero.querySelector('.st-row'), cards = [...row.children], bgs = [...hero.querySelectorAll('.st-bg')];
  const h1 = hero.querySelector('h1'), p = hero.querySelector('p'), open = hero.querySelector('.st-open'), cnt = hero.querySelector('.st-count b'), bar = hero.querySelector('.st-bar i'), txt = hero.querySelector('.st-txt');
  let cur = -1, raf = 0, tm = 0;

  function show(i, first) {
    if (i === cur) return; const was = cur; cur = i; const x = its[i];
    bgs.forEach((b, k) => b.classList.toggle('on', k === i));
    cards.forEach((c, k) => c.classList.toggle('on', k === i));
    open.href = x.href; cnt.textContent = ar(i + 1);
    bar.style.transform = `scaleX(${(i + 1) / its.length})`;
    const set = () => { h1.textContent = x.t; p.textContent = x.d; txt.classList.remove('out'); };
    if (first) set(); else { txt.classList.add('out'); clearTimeout(tm); tm = setTimeout(set, 170); try { navigator.vibrate && navigator.vibrate(6); } catch (e) {} }
  }
  function update() {
    raf = 0; const r = row.getBoundingClientRect(), mid = r.left + r.width / 2; let best = 0, bd = 1e9;
    cards.forEach((c, k) => {
      const b = c.getBoundingClientRect(), d = Math.abs(b.left + b.width / 2 - mid), t = Math.max(0, 1 - d / (b.width * 1.25));
      c.style.setProperty('--t', t.toFixed(3)); if (d < bd) { bd = d; best = k; }
    });
    show(best, false);
  }
  row.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  row.addEventListener('click', e => {
    const c = e.target.closest('.st-card'); if (!c) return;
    if (+c.dataset.i !== cur) { e.preventDefault(); c.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }
  });
  cards.forEach((c, k) => c.style.setProperty('--t', k ? '0' : '1'));
  show(0, true); requestAnimationFrame(() => requestAnimationFrame(update));
}

function scan() { const w = document.querySelector('#app .p-home'); if (w) build(w); }
const app = document.getElementById('app');
if (app) { new MutationObserver(scan).observe(app, { childList: true, subtree: true }); }
scan();
})();
