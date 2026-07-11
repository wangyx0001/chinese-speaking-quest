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
  // Recorded clips play through a SINGLE, reused HTMLAudioElement, NOT a fresh
  // `new Audio()` per clip and NOT the Web Audio API. Why:
  //   - A fresh `new Audio().play()` per clip is blocked on iOS Safari unless it
  //     happens inside a user gesture. Clips chained off the previous clip's
  //     `ended` event are not gestures, so only the first clip of a chapter
  //     played — the original bug.
  //   - Web Audio "fixed" the chaining but regressed to *no* sound on iOS: our
  //     first real playback is async (after fetch + decodeAudioData), so it
  //     starts long after the gesture ends and iOS never truly activates the
  //     context; and separately, Web Audio output is silenced by the iPad's
  //     hardware mute/ring switch, while an <audio> element is not.
  //   - ONE <audio> element, "unlocked" once inside the Play-button gesture (see
  //     unlock(): a muted play()/pause() primes it), can then play any clip for
  //     the rest of the session just by swapping `.src` and calling `.play()`,
  //     with no further gesture — and it plays regardless of the mute switch.
  let queue = [];
  let playing = false;
  let gen = 0;            // bumped by stop(); invalidates any in-flight playback

  // The one reused audio element for all recorded clips. Created lazily so this
  // file has no side effects at load; primed once by unlock().
  let clipEl = null;
  let currentEl = null;  // the element mid-playback (for stop()); === clipEl or null

  function getClipEl() {
    if (clipEl) return clipEl;
    if (typeof Audio === 'undefined') return null;
    try {
      clipEl = new Audio();
      clipEl.preload = 'auto';
      // Keep it inline on iOS; never treat it as a fullscreen media player.
      clipEl.setAttribute('playsinline', '');
      clipEl.setAttribute('webkit-playsinline', '');
    } catch (e) { clipEl = null; }
    return clipEl;
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

  /** Play one queue item: a pre-recorded clip (via the reused <audio> element)
      if it has audioSrc, else TTS. A missing/failed clip falls back to TTS for
      that item, so the "clip present → play it; absent → TTS" contract holds. */
  function playItem(item, done) {
    if (!item.audioSrc) { speakUtter(item, done); return; }
    const el = getClipEl();
    if (!el) { speakUtter(item, done); return; }    // no <audio> support → TTS

    const startGen = gen;
    let settled = false;

    // Finish this item exactly once. `fell` = fall back to TTS for this item.
    // We detach our handlers but do NOT pause here: on normal end there's
    // nothing to pause, and on stop() the pause already happened in stop().
    function finish(fell) {
      if (settled) return; settled = true;
      el.onended = null;
      el.onerror = null;
      if (currentEl === el) currentEl = null;
      if (startGen !== gen) { done(); return; }     // stop() happened — just settle the item
      if (fell) { speakUtter(item, done); return; } // missing/failed clip → TTS fallback
      done();
    }

    el.onended = function () { finish(false); };
    el.onerror = function () { finish(true); };      // 404 / decode error / etc. → TTS

    currentEl = el;
    el.muted = false;
    el.playbackRate = item.rate || 1;
    try { el.pause(); } catch (e) { /* ignore */ }
    // Setting src to the same value won't reload; force a fresh load each item.
    el.src = item.audioSrc;
    try { el.currentTime = 0; } catch (e) { /* not ready yet; fine */ }

    let p;
    try { p = el.play(); } catch (e) { finish(true); return; }
    // play() rejects on iOS if the gesture unlock didn't take, or on decode
    // errors — fall back to TTS so the child is never left in silence.
    if (p && typeof p.catch === 'function') {
      p.catch(function () { finish(true); });
    }
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

    /** Prime recorded-clip playback inside a user gesture (call from the first
        tap — e.g. the Play button). iOS Safari keeps an <audio> element "locked"
        until it is first played from a gesture; once primed, the SAME element
        can play any later clip with no further gesture. We prime by muting the
        element and calling play()/pause() — silent to the user, and it counts as
        the gesture-blessed first playback. Harmless to call more than once. */
    unlock() {
      const el = getClipEl();
      if (!el) return;
      try {
        el.muted = true;
        const p = el.play();
        const settle = function () {
          try { el.pause(); } catch (e) { /* ignore */ }
          el.muted = false;
        };
        if (p && typeof p.then === 'function') p.then(settle, settle);
        else settle();
      } catch (e) { try { el.muted = false; } catch (e2) { /* ignore */ } }
    },

    /** Stop all speech immediately (always call before opening the mic!).
        Clears the queue and halts the current clip/utterance. Bumping `gen`
        invalidates any in-flight completion callback so a clip that ends after
        stop() can never fire onend or start the next queued line. */
    stop() {
      gen++;              // invalidate any in-flight item's completion callback
      queue = [];
      playing = false;
      if (synth) synth.cancel();
      if (currentEl) {
        try {
          currentEl.onended = null;
          currentEl.onerror = null;
          currentEl.pause();
        } catch (e) { /* already stopped */ }
        currentEl = null;
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
