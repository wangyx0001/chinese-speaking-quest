# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A zero-build, static browser game that helps a young child (~6–8) learn to **speak** Mandarin. The player advances an illustrated story by saying Chinese words out loud; the Web Speech API reads each word (TTS) and listens to the child (speech recognition). All art is emoji/CSS plus three background-removed character photos — no external runtime assets. It is hosted on GitHub Pages and used on an iPad.

## Run / develop / deploy

- **Run locally:** open `index.html` directly, or (needed for the microphone off `file://`) serve it: `npx http-server -p 8317 -c-1` then open `http://localhost:8317`. There is **no build step, no bundler, no package.json, no test runner.** Python is not installed on this machine; use the Node `http-server`.
- **Deploy:** `git push` to `main` auto-deploys via GitHub Pages (repo: `wangyx0001/chinese-speaking-quest`, live at `https://wangyx0001.github.io/chinese-speaking-quest/`). The Pages "deploy" step occasionally fails transiently — re-run the failed Actions run or push an empty commit; the build itself (artifact upload) is what matters.
- **Verify changes:** there are no automated tests. Verify in a browser. The recognition/TTS layer is best tested by **monkey-patching `window.Speech`** from the console (see the mock pattern below), since a headless/preview browser can't grant a real mic.

## Architecture

Plain `<script>` tags loaded in dependency order in `index.html` — **do NOT convert to ES modules**, because `import` breaks when the file is opened via `file://` (a supported way to run this). Each file attaches one global:

- `js/data.js` → `window.STORIES` — all content (see below).
- `js/speech.js` → `window.Speech` — TTS (`speakZh`/`speakEn`, both accept an optional `onend` callback) and recognition (`listen({timeoutMs, onDone})`). Picks a `zh-CN` voice, always `stop()`s before listening so the mic never hears the game.
- `js/match.js` → `window.Matcher` — pure, console-testable fuzzy matching.
- `js/progress.js` → `window.Progress` — localStorage (`chineseQuest.v1`): global star count + per-story `{unlocked, done}`. `load()` self-repairs malformed/legacy saves so a bad value can't lock the game.
- `js/game.js` → `window.Game` — the whole UI + a per-word state machine. **Fully data-driven**: one engine renders all stories/chapters from `STORIES`. Screens are hidden `<section>`s toggled by `show()`.

The single screen with `overflow-y: auto` is `#screen-scene` — it must stay scrollable so tall finale cards never clip the mic/confirm button off-screen on short viewports.

## Editing content

`js/data.js` is the **only file to touch for content** (words, chapters, stories). Shape: `STORIES[] → { id, hero:{name,emoji,img?}, chapters[] }`; each chapter `→ { id, words[], finale, intro:{en,zh}, sticker, bg, deco }`; each word `→ { hanzi, pinyin, en, emoji, also[], img? }`.

- **Chapter `id`s must be unique within a story** (they key the `done` map) and **stable** (renaming an `id` orphans existing saved progress).
- `also[]` = extra accepted transcripts for that word. Kid speech is mis-heard constantly; the game logs `[heard]` candidates to the console during play — grow `also[]` from real sessions. This is the main tuning loop.
- `img` (on a hero or word) renders a picture instead of the emoji via `heroHTML()`. Referenced image files live at repo root. **Filenames are case-sensitive on GitHub Pages but not on Windows** — a case mismatch works locally then 404s when hosted, so keep `img:` values byte-exact. `.nojekyll` is required so Pages serves files with spaces in their names as-is.

## Design invariants (do not break these)

- **The child can never be blocked.** After 3 unsuccessful tries on a word (mismatch **or** silence — silence counts too), an "effort pass" auto-advances with a rainbow star. Nothing may create a state where progress can't continue.
- **Matching is deliberately forgiving** (substring, ≥50% char overlap, `also[]` homophones, digit forms for numbers). Bias toward accepting, never toward rejecting.
- **Hands-free by default:** after a word is read (`speakZh` `onend`, with a timer fallback), the mic auto-opens (`autoListen`/`scheduleAutoListen`) with a short cue. If auto-start is blocked (iOS Safari may require a tap), show a gentle "tap the 🎤" hint — **do not** flip to Helper Mode from the auto path.
- **Parent Helper Mode** (no mic; parent taps "she said it") is the fallback for denied/absent recognition and a manual toggle. It must remain fully playable, and it must not auto-listen.
- The child reads **pinyin**, not characters. Keep pinyin prominent; hanzi is exposure-only. Spoken instructions are Mandarin; on-screen English text stays as-is.

## Platform notes

- Chrome/Edge (desktop/Android) are the most reliable for recognition. On iOS every browser is Safari/WebKit; recognition needs Dictation enabled and HTTPS, and may require a tap to start.
- TTS works offline; recognition needs internet. Voice quality varies by device (Edge's "Xiaoxiao" is best on Windows).
