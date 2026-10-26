// يولّد www/precache.json: قائمة كل الملفات مع بصمة، ليُنزّلها الـ service worker للعمل بدون إنترنت
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..','www');const SKIP=new Set(['sw.js','version.json','precache.json']);
const files={};
(function walk(d){for(const n of fs.readdirSync(d)){const p=path.join(d,n);const st=fs.statSync(p);
 if(st.isDirectory())walk(p);else{const rel=path.relative(root,p).split(path.sep).join('/');
 if(SKIP.has(rel)||/\.(bak|map)$/.test(rel)||n.startsWith('.'))continue;
 files[rel]=crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex').slice(0,12);}}})(root);
fs.writeFileSync(path.join(root,'precache.json'),JSON.stringify({files}));
console.log('precache.json:',Object.keys(files).length,'ملف');
