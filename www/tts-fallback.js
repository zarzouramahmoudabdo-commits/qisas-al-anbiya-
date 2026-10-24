/* صوت بديل: لو محرك نطق الأندرويد فشل (مفيش بيانات عربي)، نشغّل الصوت أونلاين.
   يعمل فقط داخل الـ APK، ويلفّ window.QisasNativeTTS دون تغيير app.js */
(() => {
  'use strict';
  const orig = window.QisasNativeTTS;
  if (!orig || window.__qisasTtsFallback) return;
  window.__qisasTtsFallback = true;

  const audio = new Audio();
  audio.preload = 'auto';
  let nativeBad = false;
  let stopSeq = 0;
  let token = 0;

  const SOURCES = [
    t => 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ar&q=' + encodeURIComponent(t),
    t => 'https://api.streamelements.com/kappa/v2/speech?voice=Zeina&text=' + encodeURIComponent(t)
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
      const timer = setTimeout(() => { if (!started) finish(false, new Error('timeout')); }, 10000);
      audio.onplaying = () => { started = true; };
      audio.onended = () => finish(true);
      audio.onerror = () => finish(false, new Error('audio error'));
      const rate = Math.min(4, Math.max(0.5, Number(opts.rate) || 1));
      audio.src = url;
      audio.defaultPlaybackRate = rate;
      audio.playbackRate = rate;
      audio.volume = opts.volume == null ? 1 : Math.min(1, Math.max(0, Number(opts.volume)));
      audio.preservesPitch = audio.mozPreservesPitch = audio.webkitPreservesPitch = true;
      const p = audio.play();
      if (p && p.catch) p.catch(e => finish(false, e));
      const t = setInterval(() => { if (done) clearInterval(t); else if (my !== token) { done = true; clearInterval(t); clearTimeout(timer); } }, 200);
    });
  }

  async function playOnline(opts) {
    const text = String(opts.text || '').trim();
    if (!text) return;
    const my = ++token;
    let lastErr;
    for (const mk of SOURCES) {
      if (my !== token) return new Promise(() => {});
      try { await playUrl(mk(text), my, opts); return; }
      catch (e) { lastErr = e; }
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
        console.warn('Native TTS failed; using online voice.', e);
      }
    }
    return playOnline(opts);
  }

  async function stop() {
    stopSeq++; token++;
    audio.onended = audio.onerror = audio.onplaying = null;
    try { audio.pause(); audio.removeAttribute('src'); audio.load(); } catch {}
    try { return await orig.stop(); } catch { }
  }

  window.QisasNativeTTS = new Proxy(orig, {
    get(target, prop) {
      if (prop === 'speak') return speak;
      if (prop === 'stop') return stop;
      const v = Reflect.get(target, prop, target);
      return typeof v === 'function' ? v.bind(target) : v;
    }
  });
})();
