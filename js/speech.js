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
  let clipTurn = 0;      // bumped per clip; identifies who owns the element now

  let micWarmed = false; // see warmupMic()
  let micStream = null;  // persistent getUserMedia stream, see holdMic()

  // Clips are ~250 KB WAVs fetched from the network on demand. On a weak or
  // flaky connection one can take many seconds to arrive — or never arrive —
  // and until it does the whole queue is stuck and the child hears nothing
  // while the game's auto-mic timer keeps running. If a clip hasn't started
  // producing audio within STALL_MS (or stalls mid-clip), we abandon it and
  // speak that line with system TTS, which works offline. See playItem().
  const STALL_MS = 4000;

  // Preloaded clips, kept as in-memory blob: URLs (path → blob URL). We hold the
  // bytes rather than just warming the HTTP cache because the <audio> element
  // fetches media with RANGE requests, which a browser may or may not satisfy
  // from a cached full response — a blob is certain, and takes the network out
  // of the per-word path entirely. Bounded so a long session can't grow without
  // limit (~250 KB a clip, so the cap is a few MB).
  const clipCache = Object.create(null);
  const clipOrder = [];                  // insertion order, for eviction
  const clipPending = Object.create(null); // in-flight preloads
  const MAX_CACHED_CLIPS = 40;

  function cacheClip(url, objUrl) {
    clipCache[url] = objUrl;
    clipOrder.push(url);
    while (clipOrder.length > MAX_CACHED_CLIPS) {
      const old = clipOrder.shift();
      const dead = clipCache[old];
      // Never revoke the clip that's on the air right now.
      if (!dead || (currentEl && currentEl.src === dead)) { clipOrder.push(old); break; }
      delete clipCache[old];
      try { URL.revokeObjectURL(dead); } catch (e) { /* ignore */ }
    }
  }

  // iPadOS 13+ reports as "MacIntel" but has a touch screen; catch it too.
  const IS_IOS =
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

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
    const myTurn = ++clipTurn;   // this item's claim on the shared <audio> element
    let settled = false;
    let watchdog = null;

    // Are we still the item that owns the element? Callbacks can outlive their
    // item — the stall watchdog is a timer, and play() can reject a tick after
    // stop() — and by then the NEXT clip may already be running on the same
    // (deliberately reused) element. A stale callback must settle its own item
    // and touch nothing else, or it would strip the live item's handlers and
    // wedge the queue.
    function owns() { return clipTurn === myTurn && startGen === gen; }

    // Finish this item exactly once. `fell` = fall back to TTS for this item.
    // We detach our handlers but do NOT pause here: on normal end there's
    // nothing to pause, and on stop() the pause already happened in stop().
    // (The stall path below is the exception — it pauses before falling back,
    // so a clip that finally arrives can't blast over the TTS replacement.)
    function finish(fell) {
      if (settled) return; settled = true;
      clearTimeout(watchdog);
      if (!owns()) { done(); return; }               // superseded — settle only
      el.onended = null;
      el.onerror = null;
      el.onplaying = null;
      el.onwaiting = null;
      if (currentEl === el) currentEl = null;
      if (fell) { speakUtter(item, done); return; }  // missing/failed clip → TTS fallback
      done();
    }

    // Armed while we're waiting for audio to flow; cleared once it does.
    function armWatchdog() {
      clearTimeout(watchdog);
      watchdog = setTimeout(function () {
        if (settled) return;
        if (owns()) { try { el.pause(); } catch (e) { /* ignore */ } }
        finish(true);                                // slow/dead network → TTS
      }, STALL_MS);
    }

    el.onended = function () { finish(false); };
    el.onerror = function () { finish(true); };      // 404 / decode error / etc. → TTS
    el.onplaying = function () { clearTimeout(watchdog); };  // audio is flowing
    el.onwaiting = armWatchdog;                      // buffer ran dry mid-clip

    currentEl = el;
    el.muted = false;
    el.playbackRate = item.rate || 1;
    try { el.pause(); } catch (e) { /* ignore */ }
    // Setting src to the same value won't reload; force a fresh load each item.
    // A preloaded clip plays from memory (blob:), so a weak connection can't
    // delay it — see preload(). Still the SAME reused <audio> element.
    el.src = clipCache[item.audioSrc] || item.audioSrc;
    try { el.currentTime = 0; } catch (e) { /* not ready yet; fine */ }

    armWatchdog();
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

    /** True while a recorded clip is still loading/playing, or lines are still
        queued behind it. The game checks this before auto-opening the mic so a
        slow clip download can't leave the mic listening over the word she is
        supposed to be copying. Deliberately does NOT consult
        speechSynthesis.speaking: that flag is unreliable (it can stay stuck
        true), and the game's auto-mic safety-net timer exists precisely because
        TTS 'end' events can go missing — reporting a wedged utterance as "still
        speaking" forever would defeat it. */
    isSpeaking() {
      const busyClip = !!(currentEl && !currentEl.paused && !currentEl.ended);
      return queue.length > 0 || busyClip;
    },

    /** Download a list of clip paths into memory (best-effort, fire and forget).
        Called when a chapter opens so its clips arrive during the intro rather
        than one ~250 KB download at a time in the middle of each word — the
        difference between a smooth chapter and one where every word waits on
        the network. Failures are ignored: an un-preloaded clip just loads from
        the network as before (and the stall watchdog covers it if that hangs).
        Two at a time so a weak link isn't saturated, and each URL is fetched at
        most once per session. */
    preload(urls) {
      if (!urls || !urls.length || typeof fetch !== 'function') return;
      if (typeof URL === 'undefined' || !URL.createObjectURL) return;
      const list = [];
      for (let i = 0; i < urls.length; i++) {
        const u = urls[i];
        if (u && !clipCache[u] && !clipPending[u] && list.indexOf(u) === -1) list.push(u);
      }
      let next = 0;
      function pump() {
        if (next >= list.length) return;
        const u = list[next++];
        clipPending[u] = true;
        function done() { delete clipPending[u]; pump(); }
        let p;
        try { p = fetch(u); } catch (e) { done(); return; }
        p.then(function (res) {
          if (!res.ok) return null;                 // 404 → leave it to the TTS fallback
          return res.blob();
        }).then(function (blob) {
          if (blob && blob.size) cacheClip(u, URL.createObjectURL(blob));
          done();
        }, done);
      }
      pump();
      pump();
    },

    /** Prime recorded-clip playback inside a user gesture (call from the first
        tap — e.g. the Play button). iOS Safari keeps an <audio> element "locked"
        until it is first played from a gesture; once primed, the SAME element
        can play any later clip with no further gesture. We prime by muting the
        element and calling play() — silent to the user, and it counts as the
        gesture-blessed first playback. Harmless to call more than once.

        IMPORTANT: this must NOT pause the element afterward. The game plays a
        real clip (the launch phrase) on this same element in the very same tap,
        right after unlock() returns; a deferred pause() here would clobber that
        clip — it would stop mid-play and fall back to TTS. playItem() unmutes and
        takes over the element itself, so priming only needs to unmute on settle. */
    unlock() {
      const el = getClipEl();
      if (!el) return;
      try {
        el.muted = true;
        const p = el.play();
        const settle = function () { el.muted = false; };
        if (p && typeof p.then === 'function') p.then(settle, settle);
        else settle();
      } catch (e) { try { el.muted = false; } catch (e2) { /* ignore */ } }
    },

    /** Prime the mic ONCE, early, inside a user gesture (call from the tap that
        opens a chapter, before the intro plays) to fix inconsistent volume on
        iOS. Background: the first time SpeechRecognition starts, iOS switches the
        AVAudioSession to a record category that ducks/re-routes playback — and
        WebKit doesn't restore it afterward. So the chapter intro plays loud, then
        every clip after the first word (once the mic has opened) is quieter. There
        is no web API to control the audio session, so we can't undo the duck; we
        can only make it CONSISTENT by triggering it up front, before any audio
        plays, so the whole chapter sits at the same level. We do that with a brief
        throwaway recognizer (started then aborted; results ignored).

        iOS-only (elsewhere the mic doesn't duck and this would needlessly flash
        the recording indicator / prompt for permission), and once per session
        (the session stays in record mode after the first activation). Best-effort:
        any failure is swallowed — a warm-up that doesn't take just leaves the
        original behavior. Caller gates on mic actually being used (skip in Helper
        Mode, where no duck would otherwise occur). */
    warmupMic() {
      if (micWarmed || !SR || !IS_IOS) return;
      micWarmed = true;
      try {
        const rec = new SR();
        rec.lang = 'zh-CN';
        rec.interimResults = false;
        rec.continuous = false;
        rec.onerror = function () {};
        rec.onresult = function () {};
        rec.onend = function () {};
        rec.start();
        // Hold the mic briefly so the audio session settles into record mode,
        // then release it. The real per-word listen() comes much later (after
        // the intro, the word, and the Start tap), so there's no overlap.
        setTimeout(function () { try { rec.abort(); } catch (e) { /* ignore */ } }, 450);
      } catch (e) { /* best-effort — leave original behavior on failure */ }
    },

    /** Pin the iOS audio session in record mode by holding a microphone capture
        (getUserMedia) open — acquired the first time she enters a chapter and then
        kept open for the REST OF THE SESSION. Background: warmupMic() only covers
        the first activation, but each word does a full SpeechRecognition start→
        abort (see listen()), and on iOS that flips the session INTO record mode
        (ducking playback) and BACK each time — so playback volume dips and returns.
        A held stream keeps the session in record mode continuously, so neither the
        per-word start/stops NOR moving between chapters toggles it, and the volume
        stays even (slightly lower, but consistent).

        We deliberately do NOT release it between chapters: releasing let the
        session revert, so the next chapter re-ducked. The cost is the iOS recording
        indicator stays lit for the session — the accepted trade for even volume.
        (The browser releases the stream when the tab closes; there's no in-session
        moment we'd want it back.)

        Call from a tap gesture (iOS needs one to grant the mic). Idempotent — the
        micStream guard makes repeat calls no-ops. iOS-only; elsewhere playback
        doesn't duck so this does nothing. Best-effort and async: if the mic can't
        be acquired we fall back to the prior per-word behavior. The held stream is
        inert (never read); it exists only to keep the audio session active. */
    holdMic() {
      if (!IS_IOS || micStream) return;
      const md = navigator.mediaDevices;
      if (!md || !md.getUserMedia) return;
      md.getUserMedia({ audio: true }).then(function (stream) {
        micStream = stream;
      }).catch(function () { /* denied/unavailable — keep prior behavior */ });
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
     * Calls onDone({ error, candidates, durationMs }) exactly once.
     *  - candidates: array of transcript strings (finals, interims, alternatives)
     *  - error: null | 'unsupported' | 'no-speech' | 'not-allowed' | 'network' | ...
     *  - durationMs: how long the mic was actually open. A session that ends in
     *    a few hundred ms with nothing heard is the recognition service giving
     *    up (iOS sends audio to Apple's servers, so a flaky link does this), not
     *    the child staying silent — the game uses this to retry instead of
     *    counting a failed attempt against her.
     */
    listen(opts) {
      const onDone = opts.onDone;
      const timeoutMs = opts.timeoutMs || 6000;

      if (!SR) {
        onDone({ error: 'unsupported', candidates: [], durationMs: 0 });
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
      const startedAt = Date.now();

      function finish() {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        try { rec.abort(); } catch (e) { /* already stopped */ }
        onDone({
          error: errorSeen,
          candidates: candidates,
          durationMs: Date.now() - startedAt,
        });
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
