/* تحديث التطبيق (APK) من داخل التطبيق: يتحقق من آخر إصدار على GitHub Releases، ينزّله ويفتح شاشة التثبيت.
   يعمل داخل تطبيق أندرويد فقط ويحتاج مكوّن ApkInstaller المضاف أثناء بناء الـ APK. */
(() => {
'use strict';
const C = window.Capacitor;
if (!(C && C.isNativePlatform && C.isNativePlatform())) return;
let P; try { P = C.registerPlugin('ApkInstaller'); } catch (e) { return; }
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let info = null, latest = null, busy = false, hasNew = false;
const FLAG = 'x_apk_new';
function flag(n) { try { n ? localStorage.setItem(FLAG, String(n)) : localStorage.removeItem(FLAG); } catch (e) {} hasNew = !!n; paint(); }
function paint() { const c = document.querySelector('[data-apkcard]'); if (c) c.classList.toggle('has-update', hasNew); }

function modal(html) {
  let m = document.getElementById('x-apkm');
  if (!m) {
    m = document.createElement('div'); m.id = 'x-apkm';
    m.style.cssText = 'position:fixed;inset:0;z-index:99998;background:#000a;display:flex;align-items:center;justify-content:center;padding:20px';
    document.body.appendChild(m);
  }
  m.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink,#111);border-radius:18px;padding:18px;max-width:420px;width:100%;line-height:2;text-align:center">${html}</div>`;
  return m;
}
const close = () => { const m = document.getElementById('x-apkm'); if (m) m.remove(); };
const btn = (id, label, alt) => `<button id="${id}" class="x-btn${alt ? ' alt' : ''}" style="margin:4px">${label}</button>`;

async function load() {
  if (info === null) {
    try { info = await (await fetch('apk-build.json')).json(); } catch (e) { info = false; }
  }
  return info;
}
async function fetchLatest() {
  const i = await load(); if (!i) throw new Error('هذه النسخة لا تدعم التحديث الداخلي');
  const r = await fetch(`https://api.github.com/repos/${i.repo}/releases/tags/${encodeURIComponent(i.tag)}`, { cache: 'no-store' });
  if (!r.ok) throw new Error('تعذّر الاتصال بـ GitHub (' + r.status + ')');
  const j = await r.json();
  const n = parseInt(((j.body || '').match(/build\s+(\d+)/) || [])[1], 10);
  const a = (j.assets || []).find(x => /\.apk$/i.test(x.name));
  if (!a || !n) throw new Error('لم أجد ملف APK في الإصدار');
  return { n, url: a.browser_download_url, size: a.size };
}

async function start() {
  if (busy) return; busy = true;
  try {
    let ok = true; try { ok = (await P.canInstall()).value; } catch (e) {}
    if (!ok) {
      modal(`<b>صلاحية التثبيت</b><br>اسمح لهذا التطبيق بتثبيت التحديثات في الشاشة التالية، ثم ارجع واضغط تحديث مرة أخرى.${btn('xa-set', 'فتح الإعدادات')}${btn('xa-no', 'إلغاء', 1)}`);
      document.getElementById('xa-no').onclick = close;
      document.getElementById('xa-set').onclick = async () => { close(); try { await P.openSettings(); } catch (e) {} };
      busy = false; return;
    }
    modal('<b>جارٍ تنزيل التحديث…</b><div id="xa-p" style="margin-top:6px">0%</div>');
    const h = await P.addListener('progress', p => {
      const el = document.getElementById('xa-p');
      if (el) el.textContent = (p.total > 0 ? Math.round(p.done / p.total * 100) : Math.round(p.done / 1048576) + ' MB') + (p.total > 0 ? '%' : '');
    });
    try { await P.download({ url: latest.url }); } finally { try { h.remove(); } catch (e) {} }
    modal('<b>تم التنزيل</b><br>اضغط «تثبيت» في الشاشة التي ستظهر.');
    await P.install();
    setTimeout(close, 2500);
  } catch (e) {
    modal(`<b>تعذّر التحديث</b><br><small>${esc(e && e.message || e)}</small><br>${btn('xa-x', 'إغلاق', 1)}`);
    document.getElementById('xa-x').onclick = close;
  }
  busy = false;
}

async function check(manual) {
  try {
    if (!navigator.onLine) { if (manual) modal(`لا يوجد اتصال بالإنترنت.${btn('xa-x', 'إغلاق', 1)}`), document.getElementById('xa-x').onclick = close; return; }
    const i = await load();
    if (!i) { if (manual) { modal(`هذه النسخة لا تدعم التحديث الداخلي.${btn('xa-x', 'إغلاق', 1)}`); document.getElementById('xa-x').onclick = close; } return; }
    latest = await fetchLatest();
    flag(latest.n > i.n ? latest.n : 0);
    if (latest.n > i.n && manual) {
      const mb = latest.size ? ' (' + (latest.size / 1048576).toFixed(1) + ' MB)' : '';
      modal(`<b>يوجد إصدار جديد من التطبيق</b>${mb}<br>سيُنزَّل ويُثبَّت فوق النسخة الحالية.<br>${btn('xa-go', 'تنزيل وتثبيت')}${btn('xa-no', 'لاحقًا', 1)}`);
      document.getElementById('xa-no').onclick = close;
      document.getElementById('xa-go').onclick = start;
    } else if (manual) {
      modal(`أنت تستخدم أحدث إصدار من التطبيق ✓<br>${btn('xa-x', 'إغلاق', 1)}`); document.getElementById('xa-x').onclick = close;
    }
  } catch (e) {
    if (manual) { modal(`<b>تعذّر التحقق</b><br><small>${esc(e && e.message || e)}</small><br>${btn('xa-x', 'إغلاق', 1)}`); document.getElementById('xa-x').onclick = close; }
  }
}
window.__qisasApkCheck = check;

/* بطاقة تحديث التطبيق في الرئيسية: نقطة حمراء عند وجود إصدار جديد، والضغط عليها ينزّل ويثبّت مباشرة */
function card() {
  const box = document.querySelector('#app .sec-cards');
  if (!box || box.querySelector('[data-apkcard]')) return;
  const a = document.createElement('a'); a.className = 'sec-card gold'; a.href = '#'; a.setAttribute('data-apkcard', '1');
  a.innerHTML = '<div class="big">⬇️</div><div><h3>تحديث التطبيق (APK)</h3><p>تنزيل آخر إصدار من التطبيق وتثبيته من داخل التطبيق</p></div><span class="arr">›</span>';
  a.onclick = ev => { ev.preventDefault(); if (hasNew && latest) start(); else check(true); };
  box.appendChild(a); paint();
}
const app = document.getElementById('app');
if (app) { new MutationObserver(card).observe(app, { childList: true }); card(); }
document.addEventListener('visibilitychange', () => { if (!document.hidden) check(false); });
try { if (localStorage.getItem(FLAG)) { hasNew = true; } } catch (e) {}
setTimeout(() => check(false), 3000);
})();
