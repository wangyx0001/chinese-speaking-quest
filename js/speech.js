/* ============================================================
   Speech — text-to-speech (the game's voice) and speech
   recognition (the game's ears), both via the Web Speech API.
   Exposes window.Speech. No dependencies.
   ============================================================ */

window.Speech = (function () {
  const synth = window.speechSynthesis;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  let zhVoiceCache = null;
  let enVoiceCache = null;

  // ---- serial playback queue ----
  // Every speakZh/speakEn call is queued and played one-at-a-time, so several
  // calls in a row (e.g. the "跟我说：" prompt + the word) play in order rather
  // than on top of each other.
  //
  // Recorded clips play through the Web Audio API (a single AudioContext), NOT
  // via `new Audio()`. On iOS Safari a fresh <audio> element stays "locked"
  // until it is played inside a user gesture, so a clip chained off the previous
  // clip's `ended` event (not a gesture) is silently blocked — you'd hear only
  // the first clip of each chapter. An AudioContext resumed once inside a gesture
  // (see unlock(), called from the Play button) can start any decoded buffer for
  // the rest of the session with no further gesture needed.
  let queue = [];
  let playing = false;
  let gen = 0;            // bumped by stop(); invalidates any in-flight playback

  const AC = window.AudioContext || window.webkitAudioContext;
  let clipCtx = null;
  const bufferCache = {}; // src -> decoded AudioBuffer, or 'failed'
  let currentSource = null;

  function getCtx() {
    if (!clipCtx && AC) { try { clipCtx = new AC(); } catch (e) { clipCtx = null; } }
    return clipCtx;
  }

  // Safari historically supports only the callback form of decodeAudioData;
  // newer engines return a promise. Support both.
  function decodeAudio(ctx, arrayBuf) {
    return new Promise((resolve, reject) => {
      let p;
      try { p = ctx.decodeAudioData(arrayBuf, resolve, reject); } catch (e) { reject(e); return; }
      if (p && typeof p.then === 'function') p.then(resolve, reject);
    });
  }

  // Fetch + decode a clip once, then cache the AudioBuffer. Resolves null if the
  // file is missing or won't decode (the caller then falls back to TTS).
  function loadBuffer(src) {
    if (bufferCache[src] === 'failed') return Promise.resolve(null);
    if (bufferCache[src]) return Promise.resolve(bufferCache[src]);
    const ctx = getCtx();
    if (!ctx) return Promise.resolve(null);
    return fetch(src)
      .then((r) => { if (!r.ok) throw new Error('http ' + r.status); return r.arrayBuffer(); })
      .then((ab) => decodeAudio(ctx, ab))
      .then((buf) => { bufferCache[src] = buf; return buf; })
      .catch(() => { bufferCache[src] = 'failed'; return null; });
  }

  function pickVoices() {
    if (!synth) return;
    const voices = synth.getVoices();
    if (!voices.length) return;

    const zh = voices.filter((v) => /^zh([-_]|$)/i.test(v.lang));
    const preferred = /Xiaoxiao|Xiaoyi|Yunxi|Yunyang|Huihui|普通话|Mandarin|Google\s*(中文|普通话)/i;
    zhVoiceCache =
      zh.find((v) => /zh[-_]CN/i.test(v.lang) && preferred.test(v.name)) ||
      zh.find((v) => /zh[-_]CN/i.test(v.lang)) ||
      zh[0] ||
      null;

    const en = voices.filter((v) => /^en([-_]|$)/i.test(v.lang));
    enVoiceCache =
      en.find((v) => /Aria|Jenny|Zira|Google US English/i.test(v.name)) || en[0] || null;
  }

  if (synth) {
    pickVoices();
    synth.onvoiceschanged = pickVoices;
  }

  /** Speak one queue item via system TTS, calling done() when it finishes. */
  function speakUtter(item, done) {
    if (!synth || !item.text) { done(); return; }
    if (!zhVoiceCache || !enVoiceCache) pickVoices(); // voices may arrive late
    const u = new SpeechSynthesisUtterance(item.text);
    u.lang = item.kind === 'en' ? 'en-US' : 'zh-CN';
    const voice = item.kind === 'en' ? enVoiceCache : zhVoiceCache;
    if (voice) u.voice = voice;
    u.rate = item.rate || (item.kind === 'en' ? 1.0 : 0.8);
    u.pitch = 1.05;
    u.onend = done;
    u.onerror = done; // never let a TTS error stall the queue
    synth.speak(u);
  }

  /** Play one queue item: a pre-recorded clip (via Web Audio) if it has
      audioSrc, else TTS. A missing/failed clip falls back to TTS for that item. */
  function playItem(item, done) {
    if (!item.audioSrc) { speakUtter(item, done); return; }
    const ctx = getCtx();
    if (!ctx) { speakUtter(item, done); return; }   // no Web Audio → TTS
    if (ctx.state === 'suspended') ctx.resume();     // best-effort; unlock() did the gesture
    const startGen = gen;
    loadBuffer(item.audioSrc).then((buf) => {
      if (startGen !== gen) { done(); return; }      // stop() happened while loading — don't play
      if (!buf) { speakUtter(item, done); return; }  // missing/corrupt clip → TTS fallback
      let settled = false;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      if (item.rate) src.playbackRate.value = item.rate;
      src.connect(ctx.destination);
      currentSource = src;
      src.onended = () => {
        if (settled) return; settled = true;
        if (currentSource === src) currentSource = null;
        done();
      };
      try { src.start(0); }
      catch (e) {
        if (settled) return; settled = true;
        if (currentSource === src) currentSource = null;
        speakUtter(item, done);
      }
    });
  }

  /** Play the next queued item, then advance. Guards against stop() (gen) and
      against a single item resolving twice (advanced). */
  function runNext() {
    if (!queue.length) { playing = false; return; }
    playing = true;
    const item = queue.shift();
    const myGen = gen;
    let advanced = false;
    playItem(item, function () {
      if (advanced) return;
      advanced = true;
      if (myGen !== gen) return;           // stop() happened mid-item — abandon
      if (item.onend) { try { item.onend(); } catch (e) { /* keep going */ } }
      runNext();
    });
  }

  function enqueue(item) {
    queue.push(item);
    if (!playing) runNext();
  }

  return {
    capabilities() {
      return {
        tts: !!synth,
        stt: !!SR,
        zhVoice: !!zhVoiceCache,
      };
    },

    /** Speak Mandarin slowly and clearly (the model pronunciation).
        Multiple calls play in order (queued). Pass onend to run something once
        this line finishes (e.g. auto-listen). Pass audioSrc (a data.js
        `audioZh`/`audio` path) to play a pre-recorded clip instead — it falls
        back to system TTS if the clip is missing or fails. */
    speakZh(text, rate, onend, audioSrc) {
      enqueue({ kind: 'zh', text: text, rate: rate, onend: onend, audioSrc: audioSrc });
    },

    /** Speak a short English helper phrase (queued like speakZh). */
    speakEn(text, rate) {
      enqueue({ kind: 'en', text: text, rate: rate });
    },

    /** Resume the audio context inside a user gesture (call from the first tap —
        e.g. the Play button). Required so recorded clips can play on iOS Safari,
        where audio must be unlocked by a gesture before it will play. */
    unlock() {
      const ctx = getCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },

    /** Stop all speech immediately (always call before opening the mic!).
        Clears the queue and halts the current clip/utterance. */
    stop() {
      gen++;              // invalidate any in-flight item's completion callback
      queue = [];
      playing = false;
      if (synth) synth.cancel();
      if (currentSource) {
        try { currentSource.onended = null; currentSource.stop(); } catch (e) { /* already stopped */ }
        currentSource = null;
      }
    },

    /**
     * Listen for Mandarin speech once.
     * Calls onDone({ error, candidates }) exactly once.
     *  - candidates: array of transcript strings (finals, interims, alternatives)
     *  - error: null | 'unsupported' | 'no-speech' | 'not-allowed' | 'network' | ...
     */
    listen(opts) {
      const onDone = opts.onDone;
      const timeoutMs = opts.timeoutMs || 6000;

      if (!SR) {
        onDone({ error: 'unsupported', candidates: [] });
        return null;
      }

      const rec = new SR();
      rec.lang = 'zh-CN';
      rec.interimResults = true;
      rec.maxAlternatives = 5;
      rec.continuous = false;

      const candidates = [];
      let errorSeen = null;
      let finished = false;

      function finish() {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        try { rec.abort(); } catch (e) { /* already stopped */ }
        onDone({ error: errorSeen, candidates });
      }

      const timer = setTimeout(finish, timeoutMs);

      rec.onresult = function (ev) {
        for (let r = 0; r < ev.results.length; r++) {
          const res = ev.results[r];
          for (let a = 0; a < res.length; a++) {
            const t = (res[a].transcript || '').trim();
            if (t && candidates.indexOf(t) === -1) candidates.push(t);
          }
        }
        // Got a final result? Wrap up right away — snappier for kids.
        if (ev.results.length && ev.results[ev.results.length - 1].isFinal) finish();
      };

      rec.onerror = function (ev) {
        // 'aborted' fires from our own abort() during cleanup — not a real error
        if (ev.error !== 'aborted') errorSeen = ev.error;
        finish();
      };

      rec.onend = finish;

      try {
        rec.start();
      } catch (e) {
        errorSeen = 'start-failed';
        finish();
      }
      return rec;
    },
  };
})();
