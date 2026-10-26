/* صوت بديل v2 (مع تشخيص على الشاشة). يلفّ window.QisasNativeTTS دون تغيير app.js */
(() => {
  'use strict';
  const DEBUG = false;
  const lines = [];
  let box = null, hideT = null;
  function note(msg) {
    if (!DEBUG || typeof document === 'undefined') return;
    try {
      lines.push(String(msg)); while (lines.length > 5) lines.shift();
      if (!box) {
        box = document.createElement('div');
        box.style.cssText = 'position:fixed;top:64px;left:8px;right:8px;z-index:99999;background:#000d;color:#fff;font:12px/1.6 monospace;padding:8px 10px;border-radius:10px;direction:ltr;text-align:left;white-space:pre-wrap;word-break:break-all;pointer-events:none';
        (document.body || document.documentElement).appendChild(box);
      }
      box.textContent = 'TTS: ' + lines.join('\n');
      box.style.display = 'block';
      clearTimeout(hideT); hideT = setTimeout(() => { box.style.display = 'none'; }, 9000);
    } catch (e) {}
  }
  const errText = e => { try { return (e && (e.message || e.errorMessage || e.error || e.code)) || JSON.stringify(e) || String(e); } catch (x) { return String(e); } };

  const orig = window.QisasNativeTTS;
  if (!orig) { note('v2 loaded, but NO native bridge (QisasNativeTTS missing)'); return; }
  if (window.__qisasTtsFallback) return;
  window.__qisasTtsFallback = true;

  const audio = new Audio();
  audio.preload = 'auto';
  let nativeBad = false, stopSeq = 0, token = 0, onlineOk = false;

  const SOURCES = [
    ['google', t => 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ar&q=' + encodeURIComponent(t)],
    ['streamelements', t => 'https://api.streamelements.com/kappa/v2/speech?voice=Zeina&text=' + encodeURIComponent(t)]
  ];

  function playUrl(url, my, opts) {
    return new Promise((resolve, reject) => {
      let done = false, started = false;
      const finish = (ok, err) => {
        if (done) return; done = true;
        clearTimeout(timer);
        audio.onended = audio.onerror = audio.onplaying = null;
        ok ? resolve() : reject(err || new Error('audio failed'));
      };
      const timer = setTimeout(() => { if (!started) finish(false, new Error('timeout 10s (no sound started)')); }, 10000);
      audio.onplaying = () => { started = true; };
      audio.onended = () => finish(true);
      audio.onerror = () => {
        const c = audio.error ? ('code ' + audio.error.code) : 'unknown';
        finish(false, new Error('media error ' + c));
      };
      const rate = Math.min(4, Math.max(0.5, Number(opts.rate) || 1));
      audio.src = url;
      audio.defaultPlaybackRate = rate;
      audio.playbackRate = rate;
      audio.volume = opts.volume == null ? 1 : Math.min(1, Math.max(0, Number(opts.volume)));
      audio.preservesPitch = audio.mozPreservesPitch = audio.webkitPreservesPitch = true;
      const p = audio.play();
      if (p && p.catch) p.catch(e => finish(false, new Error('play() blocked: ' + errText(e))));
      const t = setInterval(() => { if (done) clearInterval(t); else if (my !== token) { done = true; clearInterval(t); clearTimeout(timer); } }, 200);
    });
  }

  async function playOnline(opts) {
    const text = String(opts.text || '').trim();
    if (!text) return;
    const my = ++token;
    let lastErr;
    for (const [name, mk] of SOURCES) {
      if (my !== token) return new Promise(() => {});
      try {
        await playUrl(mk(text), my, opts);
        if (!onlineOk) { onlineOk = true; note('online voice OK via ' + name); }
        return;
      } catch (e) {
        lastErr = e;
        if (my === token) note(name + ' failed: ' + errText(e));
      }
    }
    throw lastErr || new Error('online tts failed');
  }

  async function speak(opts) {
    if (!nativeBad) {
      const seq = stopSeq;
      try { return await orig.speak(opts); }
      catch (e) {
        if (seq !== stopSeq) throw e;
        nativeBad = true;
        note('native failed: ' + errText(e) + ' -> trying online');
      }
    }
    return playOnline(opts);
  }

  async function stop() {
    stopSeq++; token++;
    audio.onended = audio.onerror = audio.onplaying = null;
    try { audio.pause(); audio.removeAttribute('src'); audio.load(); } catch (e) {}
    try { return await orig.stop(); } catch (e) { }
  }

  const proxy = new Proxy(orig, {
    get(target, prop) {
      if (prop === 'speak') return speak;
      if (prop === 'stop') return stop;
      const v = Reflect.get(target, prop, target);
      return typeof v === 'function' ? v.bind(target) : v;
    }
  });
  try { window.QisasNativeTTS = proxy; } catch (e) {}
  if (window.QisasNativeTTS !== proxy) {
    try { Object.defineProperty(window, 'QisasNativeTTS', { value: proxy, configurable: true, writable: true }); } catch (e) {}
  }
  note('v2 loaded; wrapper ' + (window.QisasNativeTTS === proxy ? 'ACTIVE' : 'NOT applied'));
})();
