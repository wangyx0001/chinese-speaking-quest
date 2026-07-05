/* ============================================================
   Progress — saving stars, unlocked chapters and stickers in
   localStorage so she can continue tomorrow.
   Exposes window.Progress.
   ============================================================ */

window.Progress = (function () {
  const KEY = 'chineseQuest.v1';

  let state = null;

  function freshStory() {
    return { unlocked: 1, done: {} }; // unlocked = how many chapters are open
  }

  function fresh() {
    const stories = {};
    (window.STORIES || []).forEach((s) => { stories[s.id] = freshStory(); });
    return { version: 1, stars: 0, helperMode: false, stories: stories };
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) { /* storage full/blocked — game still plays, just won't persist */ }
  }

  return {
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        state = raw ? JSON.parse(raw) : fresh();
      } catch (e) {
        state = fresh(); // corrupt save → fresh start, never crash
      }
      // Repair anything malformed so a legacy/corrupt save can never wedge
      // progression (e.g. a missing "unlocked" would lock every chapter).
      if (!state || typeof state !== 'object') state = fresh();
      if (typeof state.stars !== 'number') state.stars = 0;
      if (!state.stories || typeof state.stories !== 'object') state.stories = {};
      (window.STORIES || []).forEach((s) => {
        const st = state.stories[s.id];
        if (!st || typeof st !== 'object') { state.stories[s.id] = freshStory(); return; }
        if (typeof st.unlocked !== 'number' || st.unlocked < 1) st.unlocked = 1;
        if (!st.done || typeof st.done !== 'object') st.done = {};
      });
      save();
      return state;
    },

    get stars() { return state.stars; },

    get helperMode() { return !!state.helperMode; },
    setHelperMode(on) { state.helperMode = !!on; save(); },

    addStars(n) {
      state.stars += n;
      save();
      return state.stars;
    },

    story(storyId) { return state.stories[storyId]; },

    isUnlocked(storyId, chapterIdx) {
      return chapterIdx < state.stories[storyId].unlocked;
    },

    isDone(storyId, chapterId) {
      return !!state.stories[storyId].done[chapterId];
    },

    doneCount(storyId) {
      return Object.keys(state.stories[storyId].done).length;
    },

    completeChapter(storyId, chapterId, chapterIdx) {
      const s = state.stories[storyId];
      s.done[chapterId] = true;
      if (chapterIdx + 1 >= s.unlocked) s.unlocked = chapterIdx + 2; // open the next one
      save();
    },

    reset() {
      state = fresh();
      save();
    },
  };
})();
