/*
 * Generate a recording manifest (the {file, text} checklist that record.html
 * drives) for one or more stories, straight from js/data.js — so the recorder's
 * clip list can't drift from the game's content.
 *
 * Usage (from the repo root):
 *   node tools/gen-manifest.mjs pups princess > tools/audio-manifest-2.json
 *
 * Naming convention for the generated clip paths (all under audio/<storyId>/):
 *   word     -> <pinyin-slug>.wav            (deduped within the story)
 *   intro    -> intro-<chapterId>.wav
 *   finale   -> finale-<chapterId>.wav
 *   complete -> complete-<chapterId>.wav     (every chapter except the last;
 *               the last chapter plays the story ending instead)
 *   ending   -> ending-<storyId>.wav
 *
 * Shared engine phrases (prompt / praise / retry / launch, in audio/core/) are
 * NOT included — they're story-independent and already recorded.
 */
import fs from 'node:fs';

const dataSrc = fs.readFileSync(new URL('../js/data.js', import.meta.url), 'utf8');
const g = {};
new Function('window', dataSrc)(g);
const STORIES = g.STORIES;

const ids = process.argv.slice(2);
if (!ids.length) {
  console.error('Give one or more story ids, e.g.: node tools/gen-manifest.mjs pups princess');
  process.exit(1);
}

// pinyin -> filename slug: strip tone marks, lowercase, hyphenate.
function slug(pinyin) {
  const s = String(pinyin)
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // drop combining tone marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'x';
}

const out = [];
for (const sid of ids) {
  const s = STORIES.find((x) => x.id === sid);
  if (!s) { console.error('No story with id: ' + sid); process.exit(1); }
  const used = Object.create(null);
  s.chapters.forEach((ch, i) => {
    out.push({ file: `audio/${sid}/intro-${ch.id}.wav`, text: ch.intro.zh });
    ch.words.forEach((w) => {
      let base = slug(w.pinyin), name = base, n = 2;
      while (used[name]) { name = base + '-' + n; n++; }
      used[name] = true;
      out.push({ file: `audio/${sid}/${name}.wav`, text: w.hanzi });
    });
    out.push({ file: `audio/${sid}/finale-${ch.id}.wav`, text: ch.finale.hanzi });
    if (i < s.chapters.length - 1) {
      out.push({ file: `audio/${sid}/complete-${ch.id}.wav`,
        text: `太棒了！你完成了${ch.title}！你得到了一张新贴纸！` });
    }
  });
  out.push({ file: `audio/${sid}/ending-${sid}.wav`, text: s.ending.zh });
}

// one entry per line, matching the existing manifest style
process.stdout.write('[\n' + out.map((o) => '  ' + JSON.stringify(o)).join(',\n') + '\n]\n');
