# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A zero-build, static browser game that helps a young child (~6–8) learn to **speak** Mandarin. The player advances an illustrated story by saying Chinese words out loud; the Web Speech API reads each word (TTS) and listens to the child (speech recognition). All art is emoji/CSS plus three background-removed character photos. Every story's Mandarin lines also have `.wav` clips of the **parent's own recorded voice** under `audio/`, played instead of the system TTS voice when present — see "Voice clips" below. It is hosted on GitHub Pages and used on an iPad.

## Run / develop / deploy

- **Run locally:** open `index.html` directly, or (needed for the microphone off `file://`) serve it: `npx http-server -p 8317 -c-1` then open `http://localhost:8317`. There is **no build step, no bundler, no package.json, no test runner.** Python is not installed on this machine; use the Node `http-server`.
- **Deploy:** `git push` to `main` auto-deploys via GitHub Pages (repo: `wangyx0001/chinese-speaking-quest`, live at `https://wangyx0001.github.io/chinese-speaking-quest/`). The Pages "deploy" step occasionally fails transiently — re-run the failed Actions run or push an empty commit; the build itself (artifact upload) is what matters. **iOS Safari caches JS aggressively**, so after deploying, a code fix will look unchanged on the iPad until the cache is busted: test in a Private tab, or (if added to the Home Screen as a PWA) delete and re-add the icon.
- **Verify changes:** there are no automated tests. Verify in a browser. The recognition/TTS layer is best tested by **monkey-patching `window.Speech`** from the console, since a headless/preview browser can't grant a real mic. Paste this to drive the challenge flow with no mic or audio (make her "say" a chosen word):

  ```js
  Speech.stop = () => {};
  Speech.speakZh = (t, rate, onend) => { if (onend) onend(); };            // skip audio, still fire callbacks
  Speech.listen = ({ onDone }) => { onDone({ error: null, candidates: ['你好'] }); return null; };
  ```

  `listen`'s real contract is `listen({timeoutMs, onDone})` → `onDone({ error, candidates })` (candidates = transcript strings); return `{ error: 'not-allowed' }` to exercise the mic-denied / Helper Mode paths, or `candidates: []` to exercise the silence/effort-pass path.

## Architecture

Plain `<script>` tags loaded in dependency order in `index.html` — **do NOT convert to ES modules**, because `import` breaks when the file is opened via `file://` (a supported way to run this). Each file attaches one global:

- `js/data.js` → `window.STORIES` — all content (see below).
- `js/speech.js` → `window.Speech` — TTS (`speakZh`/`speakEn`, both accept an optional `onend` callback) and recognition (`listen({timeoutMs, onDone})`). `speakZh` also takes an optional `audioSrc` (a path from `data.js`/`game.js`) — if given, it plays that pre-recorded clip and transparently falls back to system TTS if the clip is missing or fails to play. All calls run through one serial queue so consecutive lines play in order, never overlapping. **Recorded clips play through ONE reused `HTMLAudioElement` — not a fresh `new Audio()` per clip, and not the Web Audio API.** This is an iOS Safari requirement, learned the hard way: (a) a fresh `new Audio().play()` is blocked unless it happens inside a user gesture, so clips chained off the previous clip's end event silently fail (only the first clip of a chapter plays); (b) Web Audio "fixes" that but its output is silenced by the iPad's hardware mute/ring switch, and its async unlock (resume + a buffer start must both happen in the gesture) is fragile — you get no sound at all. A single `<audio>` element, primed once inside the Play-button gesture via `Speech.unlock()` (a muted `play()`/`pause()`), then plays any later clip by swapping `.src` with no further gesture, and ignores the mute switch. **Do not switch clip playback back to `new Audio()`-per-clip or to Web Audio.** Picks a `zh-CN` voice, always `stop()`s before listening so the mic never hears the game (this also stops any playing clip).
- `js/match.js` → `window.Matcher` — pure, console-testable fuzzy matching.
- `js/progress.js` → `window.Progress` — localStorage (`chineseQuest.v1`): global star count + per-story `{unlocked, done}`. `load()` self-repairs malformed/legacy saves so a bad value can't lock the game.
- `js/game.js` → `window.Game` — the whole UI + a per-word state machine. **Fully data-driven**: one engine renders all stories/chapters from `STORIES`. Screens are hidden `<section>`s toggled by `show()`.

The single screen with `overflow-y: auto` is `#screen-scene` — it must stay scrollable so tall finale cards never clip the mic/confirm button off-screen on short viewports.

## Editing content

`js/data.js` is the **only file to touch for content** (words, chapters, stories). Shape: `STORIES[] → { id, hero:{name,emoji,img?}, ending:{en,zh,audioZh?}, chapters[] }`; each chapter `→ { id, words[], finale, intro:{en,zh,audioZh?}, audioComplete?, sticker, bg, deco }`; each word/finale `→ { hanzi, pinyin, en, emoji, also[], img?, audioZh? }`.

- **Chapter `id`s must be unique within a story** (they key the `done` map) and **stable** (renaming an `id` orphans existing saved progress).
- `also[]` = extra accepted transcripts for that word. Kid speech is mis-heard constantly; the game logs `[heard]` candidates to the console during play — grow `also[]` from real sessions. This is the main tuning loop.
- `img` (on a hero or word) renders a picture instead of the emoji via `heroHTML()`. Referenced image files live at repo root. **Filenames are case-sensitive on GitHub Pages but not on Windows** — a case mismatch works locally then 404s when hosted, so keep `img:` values byte-exact. `.nojekyll` is required so Pages serves files with spaces in their names as-is.
- `audioZh` (on a word, finale, chapter `intro`, or story `ending`) and `audioComplete` (on a chapter, for the "chapter finished" line) point to a pre-recorded clip under `audio/` — see "Voice clips" below. Optional: content without one just uses system TTS, so new words/stories work immediately without recording anything.

## Voice clips

All three stories' Mandarin audio is a **human voice recorded by the parent** instead of the robotic system TTS voice, committed as static `.wav` files under `audio/<storyId>/` plus shared engine phrases in `audio/core/`. Two manifests are the source of truth for the `{file, text}` pairs: `tools/audio-manifest.json` (panda + core) and `tools/audio-manifest-2.json` (pups + princess) — keep them in sync with `data.js`/`game.js` if you add or rename an `audioZh`/`audio`/`audioComplete` reference. `tools/gen-manifest.mjs` regenerates a story's manifest straight from `data.js` (`node tools/gen-manifest.mjs pups princess`) using the path convention `intro-<chapterId>` / `finale-<chapterId>` / `complete-<chapterId>` / `ending-<storyId>` and a deduped pinyin slug for each word; use it so the manifest can't drift from the content. **Record clips with `tools/record.html`**: serve the site and open `http://localhost:8317/tools/record.html` (add `?manifest=audio-manifest-2.json` for a different set) in Chrome/Edge — it drives the manifest one line at a time, records the mic to 16-bit mono WAV in-browser (no ffmpeg/Python/npm), and uses the File System Access API to write each clip straight to its correct `audio/...` path (dodging the case-sensitivity trap), skipping clips already on disk so you can resume. WAV is used because it plays on iPad Safari; browser `MediaRecorder` webm/opus does not. The game itself never records or calls any API and still has no build step. `game.js` has its own `CORE_AUDIO` map plus `audio` fields on `PRAISE`/`RETRY_LINES` for the fixed engine phrases shared by all stories. A word/intro/finale/ending with no `audioZh` (or a chapter with no `audioComplete`) simply falls back to system TTS, so new content works immediately and clips can be added incrementally.

## Design invariants (do not break these)

- **The child can never be blocked.** After 3 unsuccessful tries on a word (mismatch **or** silence — silence counts too), an "effort pass" auto-advances with a rainbow star. Nothing may create a state where progress can't continue.
- **Matching is deliberately forgiving** (substring, ≥50% char overlap, `also[]` homophones, digit forms for numbers). Bias toward accepting, never toward rejecting.
- **Hands-free by default:** after a word is read (`speakZh` `onend`, with a timer fallback), the mic auto-opens (`autoListen`/`scheduleAutoListen`) with a short cue. If auto-start is blocked (iOS Safari may require a tap), show a gentle "tap the 🎤" hint — **do not** flip to Helper Mode from the auto path.
- **Parent Helper Mode** (no mic; parent taps "she said it") is the fallback for denied/absent recognition and a manual toggle. It must remain fully playable, and it must not auto-listen.
- The child reads **pinyin**, not characters. Keep pinyin prominent; hanzi is exposure-only. Spoken instructions are Mandarin; on-screen English text stays as-is.

## Platform notes

- Chrome/Edge (desktop/Android) are the most reliable for recognition. On iOS every browser is Safari/WebKit; recognition needs Dictation enabled and HTTPS, and may require a tap to start.
- TTS works offline; recognition needs internet. Voice quality varies by device (Edge's "Xiaoxiao" is best on Windows).
