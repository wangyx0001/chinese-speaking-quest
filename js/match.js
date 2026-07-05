/* ============================================================
   Matcher — forgiving fuzzy matching between what the child
   said (recognition transcripts) and the target word.
   Pure functions; test from the console, e.g.:
     Matcher.matches({hanzi:'狗', also:[]}, ['我看到狗了'])  // true
   Exposes window.Matcher.
   ============================================================ */

window.Matcher = (function () {
  /** Keep only Chinese characters and digits (digits matter for numbers:
      the recognizer often returns "3" when a kid says 三). */
  function normalize(text) {
    if (!text) return '';
    const kept = String(text).match(/[一-鿿0-9]/g);
    return kept ? kept.join('') : '';
  }

  /** How many of target's characters appear anywhere in the candidate. */
  function overlapCount(target, candidate) {
    let n = 0;
    for (const ch of target) {
      if (candidate.indexOf(ch) !== -1) n++;
    }
    return n;
  }

  /** Does one normalized candidate match one normalized target? */
  function matchOne(target, candidate) {
    if (!target || !candidate) return false;

    // Layer A: substring either way.
    // "我看到狗了" contains 狗 → match. And for short targets (≤3 chars),
    // hearing just part of it ("香" for 香蕉) counts too.
    if (candidate.indexOf(target) !== -1) return true;
    if (target.length <= 3 && target.indexOf(candidate) !== -1) return true;

    // Layer B: at least half of the target's characters were heard.
    if (target.length >= 2 && overlapCount(target, candidate) / target.length >= 0.5) {
      return true;
    }

    return false;
  }

  return {
    normalize: normalize,

    /**
     * item: a vocab entry { hanzi, also: [...] }
     * transcripts: array of strings the recognizer heard
     */
    matches(item, transcripts) {
      const targets = [item.hanzi].concat(item.also || [])
        .map(normalize)
        .filter(Boolean);
      const candidates = (transcripts || []).map(normalize).filter(Boolean);

      for (const c of candidates) {
        for (const t of targets) {
          if (matchOne(t, c)) return true;
        }
      }
      return false;
    },
  };
})();
