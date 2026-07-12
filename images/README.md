# Chapter background images

Optional themed scene art, one file per chapter, layered over the chapter's `bg` gradient.

- Path convention: `images/<storyId>/<chapterId>.webp` (lowercase, byte-exact — GitHub Pages
  filenames are case-sensitive). Example: `images/panda/panda-greetings.webp`.
- Wire it up by adding one `bgImage: 'images/<storyId>/<chapterId>.webp'` line to that chapter
  in `js/data.js`, next to its `bg:`.
- Optional & incremental: a chapter with no image (or a missing file) just shows its gradient.

See [`tools/bg-image-prompts.md`](../tools/bg-image-prompts.md) for generation prompts, target
size/format (~1440×720 WebP, < ~100 KB), and step-by-step instructions.
