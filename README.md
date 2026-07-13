# 说中文大冒险 · Chinese Speaking Quest

A speaking game for kids learning Mandarin. Help three heroes — Red Pandy the
red panda (红熊猫), Skye of the Puppy Rescue Squad (天天), and the Little
Princess (小公主) — by **saying Chinese words out loud**. The game speaks each word, listens through the microphone, and
celebrates every attempt with stars, confetti, and stickers. She can never get
stuck: after three tries she always passes with a rainbow star.

Each hero has nine illustrated chapters, every one with its own themed scene, and
the Chinese can be spoken in a **parent's own recorded voice** instead of the
robotic computer voice (see Parent tips below).

## How to play

1. **Open `index.html` in Edge or Chrome.** Edge is recommended — its Chinese
   voice ("Xiaoxiao") sounds the most natural.
2. Click **PLAY** and **allow the microphone** when the browser asks.
3. Pick a story, pick a chapter, and start talking!

If the microphone is blocked on a double-clicked file, run a tiny server
instead: `npx http-server` in this folder, then open the shown address.

It's also published online at
**<https://wangyx0001.github.io/chinese-speaking-quest/>** — handy for playing on
an iPad. (On iPad every browser is Safari; recognition needs Dictation turned on,
and after an update you may need a Private tab to get the newest version.)

Notes:
- The game's voice works offline, but the **listening** part needs internet
  (the browser's speech recognizer is cloud-based).
- Progress (stars, chapters, stickers) is saved in the browser automatically.

## Parent tips

- **👨‍👩‍👧 Helper Mode** (button on the story screen): replaces the microphone
  with a "⭐ She said it!" button that *you* tap. Use it when there's no
  internet, no mic, or when she just wants to practice with you judging.
- **Tune the listening:** kids' speech is often mis-heard. Open the browser
  console (F12) while she plays and watch the `[heard]` lines. If her good
  attempts show up as a different character, add it to that word's `also:`
  list in `js/data.js` — the game will accept it next time.
- **Add or change words:** everything she practices lives in `js/data.js`,
  with comments explaining the format. Change words, add chapters, or even
  write a whole new storyline.
- **🎨 Custom scene art:** each chapter shows a themed background picture behind
  the hero. To add or change one, save an image as
  `images/<story>/<chapter>.webp` (about 1440×720, under ~100 KB). `tools/bg-image-prompts.md`
  has a ready-made description for every chapter to generate them with an AI
  image tool. A chapter with no picture just uses a colored background, so you
  can add art a few chapters at a time.
- **🎙️ Record your own voice:** the Mandarin can be spoken in *your* voice
  instead of the computer's. Open `tools/record.html` in Chrome or Edge (serve
  the folder first, as above) and read each line aloud — it saves the clips
  automatically. Lines you haven't recorded fall back to the computer voice, so
  you can record a little at a time.
- **Reset stars & stickers:** press and hold the title on the first screen for
  3 seconds. This clears her star count, earned stickers, and Helper Mode —
  chapters she's already unlocked **stay open**, so she isn't locked back
  out of anything.
