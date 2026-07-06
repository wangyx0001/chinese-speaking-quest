/* ============================================================
   Game — screens, the speaking-challenge state machine,
   rewards, and Parent Helper Mode. Exposes window.Game.

   Challenge flow per word:
   PRESENT → (tap 🎤) LISTENING → EVALUATE → CELEBRATE or RETRY
   After 3 tries the child ALWAYS passes with a rainbow star —
   nothing in this game can block her progress.
   ============================================================ */

window.Game = (function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const PRAISE = [
    { zh: '太棒了！', en: 'Wonderful!' },
    { zh: '真厉害！', en: 'Amazing!' },
    { zh: '好极了！', en: 'Great job!' },
    { zh: '你真棒！', en: "You're a star!" },
    { zh: '完美！', en: 'Perfect!' },
  ];
  // en is shown on screen; zh is what the game says out loud
  const RETRY_LINES = [
    { en: 'So close! Listen one more time…', zh: '差一点！再听一遍……' },
    { en: 'Good try! Hear it again…', zh: '说得不错！再听一次……' },
    { en: 'Almost! One more listen…', zh: '就差一点点！再听一遍……' },
  ];

  const state = {
    story: null,
    chapterIdx: 0,
    wordIdx: 0, // equals words.length → it's the finale phrase
    attempts: 0,
    busy: false,
    listening: false,
    listenToken: 0, // invalidates in-flight recognition when leaving the scene
    networkErrors: 0,
    helper: false,
    sttAvailable: true,
    praiseIdx: 0,
    retryIdx: 0,
    presentId: 0,   // bumps every new card; invalidates a pending auto-listen
    autoTimer: null, // timer that auto-starts the mic after the word is read
  };

  /* ---------------- helpers ---------------- */

  /** A hero/word picture: the image file if one is set, otherwise the emoji. */
  function heroHTML(who) {
    return who.img
      ? '<img class="hero-img" src="' + who.img + '" alt="' + (who.name || who.en || '') + '">'
      : who.emoji;
  }

  /** Number of Chinese characters in a string (drives the difficulty level). */
  function hanziCount(text) {
    const m = String(text || '').match(/[一-鿿]/g);
    return m ? m.length : 0;
  }

  /** Difficulty band for an item: 1 = word, 2 = phrase, 3 = sentence. */
  function levelOf(item) {
    const n = hanziCount(item.hanzi);
    if (n >= 5) return 3;
    if (n >= 3) return 2;
    return 1;
  }

  const LEVEL_BADGE = {
    1: '⭐ 词 word',
    2: '⭐⭐ 短语 phrase',
    3: '⭐⭐⭐ 句子 sentence',
  };

  function chapter() { return state.story.chapters[state.chapterIdx]; }

  function isFinale() { return state.wordIdx >= chapter().words.length; }

  function current() {
    return isFinale() ? chapter().finale : chapter().words[state.wordIdx];
  }

  function show(name) {
    ['title', 'story', 'map', 'scene', 'stickers'].forEach((n) => {
      $('#screen-' + n).classList.toggle('hidden', n !== name);
    });
    if (name === 'story') renderStorySelect();
    if (name === 'map') renderMap();
    if (name === 'stickers') renderStickers();
  }

  function toast(msg, ms) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.add('hidden'), ms || 3500);
  }

  function feedback(msg, oops) {
    const f = $('#feedback');
    f.textContent = msg || '';
    f.classList.toggle('oops', !!oops);
  }

  function updateStarHUD(pop) {
    $$('.star-count').forEach((el) => { el.textContent = Progress.stars; });
    if (pop) {
      $$('.star-hud').forEach((el) => {
        el.classList.remove('pop');
        void el.offsetWidth;
        el.classList.add('pop');
      });
    }
  }

  function heroAnimate(cls) {
    const h = $('#hero');
    h.classList.remove('jump', 'think');
    void h.offsetWidth;
    h.classList.add(cls);
  }

  /* ---------------- fun & rewards ---------------- */

  let audioCtx = null;

  function chime(big) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = big ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
      notes.forEach((f, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'triangle';
        o.frequency.value = f;
        const t = audioCtx.currentTime + i * 0.12;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(t);
        o.stop(t + 0.55);
      });
    } catch (e) { /* no sound? no problem */ }
  }

  // A soft two-note "your turn!" chirp played right before the mic auto-opens,
  // so she knows it's time to speak even if she can't read "Listening".
  function listenCue() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      [587.33, 880].forEach((f, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        const t = audioCtx.currentTime + i * 0.11;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(t);
        o.stop(t + 0.15);
      });
    } catch (e) { /* no sound? no problem */ }
  }

  function confetti(n) {
    const layer = $('#confetti-layer');
    const emo = ['🎉', '⭐', '✨', '🌟', '💛', '💙', '❤️', '💚', '💜', '🧡'];
    for (let i = 0; i < (n || 26); i++) {
      const d = document.createElement('div');
      d.className = 'confetto';
      d.textContent = emo[Math.floor(Math.random() * emo.length)];
      d.style.left = Math.random() * 100 + 'vw';
      d.style.animationDelay = Math.random() * 0.35 + 's';
      d.style.fontSize = 18 + Math.random() * 26 + 'px';
      layer.appendChild(d);
      setTimeout(() => d.remove(), 2100);
    }
  }

  /* ---------------- story select ---------------- */

  function renderStorySelect() {
    const wrap = $('#story-tiles');
    wrap.innerHTML = '';
    window.STORIES.forEach((s) => {
      const doneN = Progress.doneCount(s.id);
      const tile = document.createElement('button');
      tile.className = 'story-tile';
      tile.innerHTML =
        '<span class="tile-emoji">' + heroHTML(s.hero) + '</span>' +
        '<span><p class="tile-title">' + s.title + '</p>' +
        '<p class="tile-sub">' + s.titleEn + ' — ' + s.tagline + '</p></span>' +
        '<span class="tile-progress">' + doneN + '/' + s.chapters.length + '</span>';
      tile.addEventListener('click', () => {
        state.story = s;
        show('map');
      });
      wrap.appendChild(tile);
    });
    $('#btn-helper-toggle').textContent =
      '👨‍👩‍👧 Helper: ' + (Progress.helperMode ? 'ON' : 'OFF');
  }

  /* ---------------- chapter map ---------------- */

  function renderMap() {
    const s = state.story;
    $('#map-title').innerHTML = heroHTML(s.hero) + ' ' + s.title + ' · ' + s.titleEn;
    $('#map-tagline').textContent = s.tagline;
    const path = $('#map-path');
    path.innerHTML = '';
    s.chapters.forEach((ch, idx) => {
      const unlocked = Progress.isUnlocked(s.id, idx);
      const done = Progress.isDone(s.id, ch.id);
      const btn = document.createElement('button');
      btn.className = 'chapter-btn' + (unlocked ? '' : ' locked') + (done ? ' done' : '');
      btn.innerHTML =
        '<span class="ch-emoji">' + (unlocked ? ch.emoji : '🔒') + '</span>' +
        '<span class="ch-title">' + ch.title + '</span>' +
        '<span class="ch-sub">' + ch.titleEn + '</span>' +
        '<span class="ch-done">' + (done ? ch.sticker + ' ⭐' : '') + '</span>';
      btn.addEventListener('click', () => {
        if (!unlocked) {
          toast('🔒 Finish the earlier chapters to open this one!');
          return;
        }
        enterChapter(idx);
      });
      path.appendChild(btn);
    });
  }

  /* ---------------- scene / challenge ---------------- */

  function enterChapter(idx) {
    state.chapterIdx = idx;
    state.wordIdx = 0;
    state.attempts = 0;
    state.busy = false;
    state.networkErrors = 0;
    state.listenToken++;

    const s = state.story;
    const ch = chapter();

    $('#scene-title').textContent = ch.emoji + ' ' + ch.title + ' · ' + ch.titleEn;
    $('#scene-stage').style.background = ch.bg;
    $('#stage-deco').innerHTML =
      Array.from(ch.deco).map((e) => '<span>' + e + '</span>').join('');
    $('#hero').innerHTML = heroHTML(s.hero);
    $('#tableau').innerHTML = '';

    $('#intro-emoji').textContent = ch.emoji;
    $('#intro-text').textContent = ch.intro.en;
    $('#scene-intro').classList.remove('hidden');
    $('#challenge').classList.add('hidden');

    show('scene');

    Speech.stop();
    Speech.speakZh(ch.intro.zh);
  }

  function startChallenges() {
    $('#scene-intro').classList.add('hidden');
    $('#challenge').classList.remove('hidden');
    updateControls();
    present();
  }

  function updateControls() {
    $('#btn-mic').classList.toggle('hidden', state.helper);
    $('#btn-helper-yes').classList.toggle('hidden', !state.helper);
  }

  function present() {
    state.presentId++;               // new card — cancel any pending auto-listen
    if (state.autoTimer) { clearTimeout(state.autoTimer); state.autoTimer = null; }
    const item = current();
    const level = levelOf(item);
    $('#card-level').textContent = LEVEL_BADGE[level];
    $('#card-emoji').innerHTML = heroHTML(item);
    $('#card-hanzi').textContent = item.hanzi;
    $('#card-pinyin').textContent = item.pinyin;
    $('#card-en').textContent = (isFinale() ? '✨ magic phrase: ' : '') + item.en;
    // shrink the text for longer phrases/sentences so they fit on the card
    const card = $('#card');
    card.classList.remove('success', 'lvl-1', 'lvl-2', 'lvl-3');
    card.classList.add('lvl-' + level);
    feedback('');
    playModel(true);
  }

  function playModel(withPrompt) {
    const item = current();
    Speech.stop();
    if (withPrompt) {
      Speech.speakZh(isFinale() ? '魔法句子！跟我说：' : '跟我说：');
    }
    Speech.speakZh(item.hanzi);
    // When the word finishes being read, start the mic automatically so she
    // never has to press a button. onend is the trigger; the timer is a
    // safety net for browsers where the speech 'end' event is unreliable.
    const pid = state.presentId;
    Speech.speakZh(item.hanzi, 0.7, function () { scheduleAutoListen(pid); }); // 2nd time, extra slow
    armAutoFallback(pid);
  }

  function armAutoFallback(pid) {
    if (state.autoTimer) clearTimeout(state.autoTimer);
    state.autoTimer = setTimeout(function () { autoListen(pid); }, 6000);
  }

  function scheduleAutoListen(pid) {
    if (pid !== state.presentId) return;
    if (state.autoTimer) clearTimeout(state.autoTimer);
    // small pause after the word so it feels natural and the mic doesn't
    // catch the tail of the speech
    state.autoTimer = setTimeout(function () { autoListen(pid); }, 350);
  }

  function autoListen(pid) {
    state.autoTimer = null;
    if (pid !== state.presentId) return;               // already on another card
    if (state.helper || !state.sttAvailable) return;   // helper mode: parent taps
    if (state.busy || state.listening) return;         // already handling / listening
    if ($('#screen-scene').classList.contains('hidden')) return; // left the scene
    if ($('#challenge').classList.contains('hidden')) return;    // not on a challenge
    listenCue(); // a gentle "your turn!" chirp
    setTimeout(function () {
      if (pid !== state.presentId || state.busy || state.listening) return;
      startListening(true);
    }, 280);
  }

  function startListening(auto) {
    if (state.busy || state.listening) return;
    if (state.autoTimer) { clearTimeout(state.autoTimer); state.autoTimer = null; }
    Speech.stop(); // never let the game hear itself
    state.listening = true;
    const token = state.listenToken;
    const mic = $('#btn-mic');
    mic.classList.add('listening');
    mic.textContent = '👂';
    feedback('Listening… say it loud! 大声说吧!');
    // give her more time for longer phrases/sentences so she isn't cut off
    const chars = hanziCount(current().hanzi);
    const timeoutMs = Math.min(13000, 5000 + Math.max(0, chars - 2) * 900);
    Speech.listen({
      timeoutMs: timeoutMs,
      onDone: (result) => {
        if (token !== state.listenToken) return; // she left the scene mid-listen
        state.listening = false;
        mic.classList.remove('listening');
        mic.textContent = '🎤';
        handleResult(result, auto === true);
      },
    });
  }

  function handleResult(result, auto) {
    // ---- errors that aren't her fault ----
    if (result.error === 'not-allowed' || result.error === 'service-not-allowed' ||
        result.error === 'unsupported' || result.error === 'start-failed') {
      // Auto-start can be blocked until she taps once (Safari/iOS require a tap
      // to open the mic). Don't punish or switch modes — just invite one tap.
      if (auto) {
        feedback('👆 Tap the 🎤 and say it! 点一下话筒!', true);
        return;
      }
      enableHelper('The microphone is blocked, so Parent Helper Mode is on — tap ⭐ when she says the word!');
      return;
    }
    if (result.error === 'network') {
      state.networkErrors++;
      if (state.networkErrors >= 2) {
        enableHelper('No internet for the mic game — Parent Helper Mode is on! (The voice still works.)');
      } else {
        feedback('The internet hiccuped — tap 🎤 and try again!', true);
      }
      return;
    }

    console.log('[heard]', result.candidates,
      '(add mis-heard characters to "also" in js/data.js to accept them)');

    state.networkErrors = 0;

    if (result.candidates.length && Matcher.matches(current(), result.candidates)) {
      award(state.attempts === 0 ? 2 : 1, false);
      return;
    }

    // Either she was misheard, or the mic heard nothing at all. BOTH count
    // toward the effort pass — otherwise a quiet or shy speaker whose voice the
    // recognizer keeps missing would be stuck on one word forever. The story
    // must ALWAYS be able to move on.
    miss(result.candidates.length === 0);
  }

  function miss(heardNothing) {
    state.attempts++;
    if (state.attempts >= 3) {
      // effort pass — trying three times IS winning; the story always advances
      feedback('🌈 练习得真棒! Great practicing — keep going!');
      Speech.stop();
      Speech.speakZh('练习得真棒！');
      award(1, true);
      return;
    }
    heroAnimate('think');
    Speech.stop();
    if (heardNothing) {
      feedback("I didn't hear you — get close and say it big! 再试一次!", true);
      Speech.speakZh('我没听到，再试一次！');
    } else {
      const line = RETRY_LINES[state.retryIdx++ % RETRY_LINES.length];
      feedback(line.en, true);
      Speech.speakZh(line.zh);
    }
    // replay the word, then auto-open the mic again so she can just try again
    const pid = state.presentId;
    Speech.speakZh(current().hanzi, undefined, function () { scheduleAutoListen(pid); });
    armAutoFallback(pid);
  }

  function award(stars, rainbow) {
    state.busy = true;
    const item = current();

    Progress.addStars(stars);
    updateStarHUD(true);
    confetti();
    chime(false);
    heroAnimate('jump');
    $('#card').classList.add('success');

    if (!rainbow) {
      const p = PRAISE[state.praiseIdx++ % PRAISE.length];
      feedback((stars === 2 ? '⭐⭐ ' : '⭐ ') + p.zh + ' ' + p.en);
      Speech.stop();
      Speech.speakZh(p.zh);
    }

    // the story action: the word she spoke joins the scene
    const el = document.createElement('span');
    el.className = 'tableau-item';
    el.innerHTML = heroHTML(item);
    $('#tableau').appendChild(el);

    setTimeout(nextChallenge, 2000);
  }

  function nextChallenge() {
    state.busy = false;
    state.attempts = 0;
    state.wordIdx++;
    if (state.wordIdx > chapter().words.length) {
      chapterComplete();
    } else {
      present();
    }
  }

  function chapterComplete() {
    const s = state.story;
    const ch = chapter();
    const lastChapter = state.chapterIdx === s.chapters.length - 1;

    Progress.completeChapter(s.id, ch.id, state.chapterIdx);
    updateStarHUD(false);

    $('#celebrate-hero').innerHTML = heroHTML(s.hero);
    $('#celebrate-title').textContent = lastChapter
      ? '🏆 ' + s.title + ' 🏆'
      : '🎉 太棒了! Chapter complete! 🎉';
    $('#celebrate-text').textContent = lastChapter
      ? s.ending.en
      : 'You finished ' + ch.titleEn + ' and earned a new sticker!';
    $('#celebrate-sticker').textContent = ch.sticker;
    $('#celebrate').classList.remove('hidden');

    confetti(70);
    chime(true);
    Speech.stop();
    if (lastChapter) {
      Speech.speakZh(s.ending.zh);
    } else {
      Speech.speakZh('太棒了！你完成了' + ch.title + '！你得到了一张新贴纸！');
    }
  }

  /* ---------------- helper mode ---------------- */

  function enableHelper(message) {
    state.listening = false;
    state.helper = true;
    const mic = $('#btn-mic');
    mic.classList.remove('listening');
    mic.textContent = '🎤';
    updateControls();
    feedback('Say it together — then tap ⭐!');
    toast(message, 6000);
  }

  /* ---------------- sticker book ---------------- */

  function renderStickers() {
    const wrap = $('#sticker-sections');
    wrap.innerHTML = '';
    window.STORIES.forEach((s) => {
      const section = document.createElement('div');
      section.className = 'sticker-section';
      const h = document.createElement('h3');
      h.innerHTML = heroHTML(s.hero) + ' ' + s.title + ' · ' + s.titleEn;
      section.appendChild(h);
      const grid = document.createElement('div');
      grid.className = 'sticker-grid';
      s.chapters.forEach((ch) => {
        const earned = Progress.isDone(s.id, ch.id);
        const b = document.createElement('button');
        b.className = 'sticker ' + (earned ? 'earned' : 'mystery');
        b.textContent = earned ? ch.sticker : '❓';
        if (earned) {
          // sneaky review: tapping a sticker replays that chapter's magic phrase
          b.addEventListener('click', () => {
            Speech.stop();
            Speech.speakZh(ch.finale.hanzi);
            toast(ch.finale.hanzi + ' — ' + ch.finale.pinyin);
          });
        }
        grid.appendChild(b);
      });
      section.appendChild(grid);
      wrap.appendChild(section);
    });
  }

  /* ---------------- wiring & boot ---------------- */

  function leaveScene(to) {
    state.presentId++;   // invalidate any pending auto-listen
    if (state.autoTimer) { clearTimeout(state.autoTimer); state.autoTimer = null; }
    state.listenToken++; // ignore any in-flight recognition
    state.listening = false;
    state.busy = false;
    Speech.stop();
    const mic = $('#btn-mic');
    mic.classList.remove('listening');
    mic.textContent = '🎤';
    show(to);
  }

  function wire() {
    $('#btn-play').addEventListener('click', () => {
      // user gesture unlocks audio on both engines
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
      } catch (e) { /* ok */ }
      Speech.speakZh('出发！');
      show('story');
    });

    // How to Play overlay (open from title, close with the button or backdrop)
    const howto = $('#howto');
    $('#btn-howto').addEventListener('click', () => howto.classList.remove('hidden'));
    $('#btn-howto-close').addEventListener('click', () => howto.classList.add('hidden'));
    howto.addEventListener('click', (e) => { if (e.target === howto) howto.classList.add('hidden'); });

    $('#btn-story-back').addEventListener('click', () => show('title'));
    $('#btn-map-back').addEventListener('click', () => show('story'));
    $('#btn-scene-back').addEventListener('click', () => leaveScene('map'));
    $('#btn-stickers-back').addEventListener('click', () => show('story'));
    $('#btn-stickers').addEventListener('click', () => show('stickers'));

    $('#btn-helper-toggle').addEventListener('click', () => {
      const on = !Progress.helperMode;
      Progress.setHelperMode(on);
      state.helper = on || !state.sttAvailable;
      $('#btn-helper-toggle').textContent = '👨‍👩‍👧 Helper: ' + (on ? 'ON' : 'OFF');
      toast(on
        ? 'Parent Helper Mode ON — you tap ⭐ when she says the word.'
        : 'Parent Helper Mode OFF — the microphone will listen.');
    });

    $('#btn-start-chapter').addEventListener('click', startChallenges);
    $('#btn-replay').addEventListener('click', () => { if (!state.listening) playModel(false); });
    $('#btn-mic').addEventListener('click', () => startListening(false));

    $('#btn-helper-yes').addEventListener('click', () => {
      if (state.busy) return;
      award(2, false);
    });

    $('#btn-celebrate-next').addEventListener('click', () => {
      $('#celebrate').classList.add('hidden');
      leaveScene('map');
    });

    // secret parent reset: press and hold the title for 3 seconds
    const title = $('#game-title');
    let holdTimer = null;
    const startHold = () => {
      holdTimer = setTimeout(() => {
        if (confirm('Reset ALL progress (stars, chapters, stickers)?')) {
          Progress.reset();
          updateStarHUD(false);
          toast('Progress reset — a brand new adventure!');
        }
      }, 3000);
    };
    const cancelHold = () => clearTimeout(holdTimer);
    title.addEventListener('pointerdown', startHold);
    title.addEventListener('pointerup', cancelHold);
    title.addEventListener('pointerleave', cancelHold);
  }

  function boot() {
    Progress.load();
    const caps = Speech.capabilities();
    state.sttAvailable = caps.stt;
    state.helper = Progress.helperMode || !caps.stt;

    const note = $('#boot-note');
    if (!caps.tts) {
      note.textContent = '⚠️ This browser cannot speak — please use Chrome or Edge.';
    } else if (!caps.stt) {
      note.textContent =
        'ℹ️ This browser cannot listen, so Parent Helper Mode is on. For the microphone game, open this page in Chrome or Edge.';
    }

    updateStarHUD(false);
    wire();
    show('title');
  }

  document.addEventListener('DOMContentLoaded', boot);

  return { state: state, show: show };
})();
