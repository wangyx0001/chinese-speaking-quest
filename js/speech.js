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
  // Every speakZh/speakEn call is queued and played one-at-a-time. The
  // SpeechSynthesis engine already queues its own utterances, but recorded
  // <audio> clips do NOT — without this queue, several speakZh() calls in a
  // row (e.g. "跟我说：" + the word + the slow repeat) would all start at once
  // and play on top of each other. The queue restores that in-order playback.
  let queue = [];
  let playing = false;
  let gen = 0;            // bumped by stop(); invalidates any in-flight playback
  let currentClip = null; // the <audio> clip currently playing, if any

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

  /** Play one queue item: a pre-recorded clip if it has audioSrc, else TTS.
      A missing/failed clip falls back to TTS for that same item. */
  function playItem(item, done) {
    if (!item.audioSrc) { speakUtter(item, done); return; }
    const audio = new Audio(item.audioSrc);
    audio.playbackRate = item.rate || 1; // clips are recorded at natural speed
    currentClip = audio;
    let settled = false;
    const clearIfCurrent = () => { if (currentClip === audio) currentClip = null; };
    audio.onended = () => { if (settled) return; settled = true; clearIfCurrent(); done(); };
    const fallback = () => { if (settled) return; settled = true; clearIfCurrent(); speakUtter(item, done); };
    audio.onerror = fallback;              // missing/corrupt file
    audio.play().catch(fallback);          // autoplay blocked, etc.
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

    /** Stop all speech immediately (always call before opening the mic!).
        Clears the queue and halts the current clip/utterance. */
    stop() {
      gen++;              // invalidate any in-flight item's completion callback
      queue = [];
      playing = false;
      if (synth) synth.cancel();
      if (currentClip) {
        try { currentClip.pause(); currentClip.currentTime = 0; } catch (e) { /* already stopped */ }
        currentClip = null;
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
