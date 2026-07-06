# 说中文大冒险 · Chinese Speaking Quest

A speaking game for kids learning Mandarin. Help three heroes — Red Pandy the
red panda (红熊猫), Skye of the Puppy Rescue Squad (天天), and the Little
Princess (小公主) — by **saying Chinese words out loud**. The game speaks each word, listens through the microphone, and
celebrates every attempt with stars, confetti, and stickers. She can never get
stuck: after three tries she always passes with a rainbow star.

## How to play

1. **Open `index.html` in Edge or Chrome.** Edge is recommended — its Chinese
   voice ("Xiaoxiao") sounds the most natural.
2. Click **PLAY** and **allow the microphone** when the browser asks.
3. Pick a story, pick a chapter, and start talking!

If the microphone is blocked on a double-clicked file, run a tiny server
instead: `npx http-server` in this folder, then open the shown address.

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
- **Reset progress:** press and hold the title on the first screen for
  3 seconds.
