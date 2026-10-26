#!/usr/bin/env node
/* يجهّز ملفات الأحاديث للتطبيق من مجموعة AhmedBaset/hadith-json (نصوص عربية مأخوذة من sunnah.com)
   الاستخدام:
     node tools/build-hadith.js              تنزيل وتحويل الكتب الأربعة
     node tools/build-hadith.js --list       عرض ملفات المستودع المرشّحة دون تحويل
     node tools/build-hadith.js --map bukhari=db/by_book/the_9_books/bukhari.json
     node tools/build-hadith.js --file bukhari=/path/local.json   (ملف محلي بدل التنزيل)
   الناتج: www/hadith/index.json و www/hadith/<id>.json  */
'use strict';
const fs = require('fs'), path = require('path');
const OWNER = 'AhmedBaset', REPO = 'hadith-json';
const REFS = ['main', 'master', 'v1.2.0'];
const OUT = path.join(__dirname, '..', 'www', 'hadith');

const BOOKS = [
  { id: 'bukhari', match: /(^|\/)bukhari\.json$/i, title: 'صحيح البخاري', short: 'البخاري', author: 'الإمام محمد بن إسماعيل البخاري (ت 256هـ)', min: 5000, note: 'الأحاديث بتكرارها كما في الكتاب' },
  { id: 'muslim', match: /(^|\/)muslim\.json$/i, title: 'صحيح مسلم', short: 'مسلم', author: 'الإمام مسلم بن الحجاج (ت 261هـ)', min: 5000, note: '' },
  { id: 'nawawi40', match: /(^|\/)nawawi40\.json$/i, title: 'الأربعون النووية', short: 'الأربعون', author: 'الإمام يحيى بن شرف النووي (ت 676هـ)', min: 35, note: 'اثنان وأربعون حديثًا' },
  { id: 'riyad', match: /(^|\/)riyad[_-]?assalihin\.json$/i, title: 'رياض الصالحين', short: 'الرياض', author: 'الإمام يحيى بن شرف النووي (ت 676هـ)', min: 1500, note: 'فيه أحاديث متفاوتة الدرجة؛ راجع تخريج العلماء' }
];
const args = process.argv.slice(2);
const flag = n => args.includes(n);
const kv = n => args.map((a, i) => a === n ? args[i + 1] : null).filter(Boolean).map(s => s.split(/=(.+)/));

async function get(url, json) {
  const r = await fetch(url, { headers: { 'User-Agent': 'qisas-build' } });
  if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status);
  return json ? r.json() : r.text();
}
async function tree() {
  for (const ref of REFS) {
    try {
      const t = await get(`https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${ref}?recursive=1`, true);
      if (t && Array.isArray(t.tree)) return { ref, files: t.tree.filter(x => x.type === 'blob').map(x => x.path) };
    } catch (e) { console.error('  (تخطّي', ref, ':', e.message + ')'); }
  }
  throw new Error('تعذّر قراءة قائمة ملفات المستودع');
}
const txt = v => (v == null ? '' : typeof v === 'string' ? v : (v.text || v.arabic || v.ar || v.title || ''));

/* تحويل متسامح مع اختلاف الشكل: يبحث عن مصفوفتي hadiths و chapters */
function convert(raw, spec) {
  const root = Array.isArray(raw) ? { hadiths: raw } : raw;
  let hs = root.hadiths || root.data || root.items || (root.metadata && root.hadiths) || [];
  if (!Array.isArray(hs)) hs = [];
  const chs = Array.isArray(root.chapters) ? root.chapters : [];
  const meta = root.metadata || {};
  const titleOf = new Map();
  chs.forEach((c, i) => titleOf.set(c.id != null ? c.id : i + 1, txt(c.arabic != null ? c.arabic : c.title || c.name).trim()));
  const byCh = new Map(), order = [];
  let n = 0;
  hs.forEach((h, i) => {
    const text = txt(h.arabic != null ? h.arabic : h.text || h.ar).replace(/\s+/g, ' ').trim();
    if (!text) return;
    const key = h.chapterId != null ? h.chapterId : 0;
    if (!byCh.has(key)) { byCh.set(key, []); order.push(key); }
    const num = h.idInBook != null ? h.idInBook : (h.number != null ? h.number : (h.id != null ? h.id : i + 1));
    byCh.get(key).push([num, text]); n++;
  });
  const chapters = order.map(k => ({ t: titleOf.get(k) || 'أحاديث', h: byCh.get(k) }));
  const ar = meta.arabic || {};
  return { title: spec.title, author: spec.author, count: n, chapters, metaTitle: txt(ar.title) };
}

(async () => {
  const maps = Object.fromEntries(kv('--map'));
  const files = Object.fromEntries(kv('--file'));
  let T = null;
  if (flag('--list') || (!Object.keys(files).length)) {
    T = await tree();
    console.log('المستودع:', OWNER + '/' + REPO, '| الفرع:', T.ref, '| عدد الملفات:', T.files.length);
    if (flag('--list')) { T.files.filter(f => /\.json$/.test(f) && /by_book/.test(f)).forEach(f => console.log(' ', f)); return; }
  }
  fs.mkdirSync(OUT, { recursive: true });
  const index = {
    intro: 'ثلاثة مصادر موثوقة: الصحيحان (البخاري ومسلم) أصحّ الكتب بعد كتاب الله، والأربعون النووية، ورياض الصالحين. الحديث في الصحيحين متلقّى بالقبول عند أهل العلم إلا أحرفًا يسيرة انتقدها بعضهم.',
    note: 'هذا القسم لا يستوعب كل ما صحّ عن النبي ﷺ، فهناك السنن الأربعة والمسند والموطأ وغيرها. النصوص منقولة من مجموعة بيانات مفتوحة مأخوذة من موقع sunnah.com، فتحقق من الطبعات المحققة قبل الاستشهاد. أحاديث الصحيحين تخضع لشرط الصحة، أما رياض الصالحين فيحتاج إلى مراجعة التخريج.',
    books: []
  };
  const bad = [];
  for (const spec of BOOKS) {
    process.stdout.write(spec.id + ' … ');
    try {
      let raw;
      if (files[spec.id]) raw = JSON.parse(fs.readFileSync(files[spec.id], 'utf8'));
      else {
        const p = maps[spec.id] || T.files.filter(f => /by_book/.test(f) && spec.match.test(f))[0];
        if (!p) throw new Error('لم أجد الملف في المستودع (جرّب --list ثم --map ' + spec.id + '=المسار)');
        let lastErr;
        for (const ref of [T.ref, ...REFS.filter(r => r !== T.ref)]) {
          try { raw = await get(`https://raw.githubusercontent.com/${OWNER}/${REPO}/${ref}/${p}`, true); break; } catch (e) { lastErr = e; }
        }
        if (!raw) throw lastErr;
      }
      const out = convert(raw, spec);
      if (out.count < spec.min) throw new Error(`العدد ${out.count} أقل من المتوقع (${spec.min}) — الشكل غير مطابق، أرسل لي مخرجات --list`);
      fs.writeFileSync(path.join(OUT, spec.id + '.json'), JSON.stringify({ chapters: out.chapters }));
      index.books.push({ id: spec.id, title: spec.title, short: spec.short, author: spec.author, count: out.count, note: spec.note });
      console.log('تم:', out.count, 'حديثًا،', out.chapters.length, 'بابًا');
    } catch (e) { console.log('فشل:', e.message); bad.push(spec.id); }
  }
  if (!index.books.length) { console.error('لم يُجهَّز أي كتاب.'); process.exit(1); }
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
  console.log(bad.length ? 'تنبيه: لم تُجهَّز: ' + bad.join(', ') : 'اكتمل تجهيز كل الكتب.');
})().catch(e => { console.error('خطأ:', e.message); process.exit(1); });
