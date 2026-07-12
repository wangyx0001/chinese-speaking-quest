# Chapter background art — generation prompts & drop-in guide

Each chapter's scene can show a themed background illustration behind the hero. Art is
**optional and incremental**: add one chapter or all 27, in any order. A chapter with no
image (or a mis-named file) just shows its plain gradient — nothing breaks.

This doc has everything to make the 27 images consistent and light on the iPad.

---

## How to generate one image

Build each prompt as **`STYLE PREAMBLE` + `,` + the chapter's `SUBJECT`** from the table below.

### STYLE PREAMBLE (paste in front of every subject — keeps one look across all chapters)

> Soft children's storybook illustration, bright cheerful colors, gentle rounded shapes,
> wide horizontal scene, flat simple background, **no text, no words, no letters, no
> characters, no people, no animals** — just the empty setting. Leave the lower third
> calm and uncluttered as an open stage where a character will stand. Sunny, friendly,
> inviting. Wide 2:1 banner composition.

Why "no characters": the game composites the hero photo (red panda / puppy / princess) on
top at runtime in the lower-left, and fills the lower-right with word pictures as the child
speaks. Keep the art a **backdrop only**, with the bottom area open.

### Target specs (important for iPad performance)
- **Size:** ~**1440 × 720** (2:1). The scene box crops with `background-size: cover`, so keep
  key scenery centered; edges and the lower-middle may be cropped/covered.
- **Format:** **WebP** (supported on iPad Safari; much smaller than PNG).
- **File weight:** aim **< ~100 KB each.** For reference, one existing hero PNG is 3.6 MB —
  that's the weight to avoid. If your AI tool exports large PNG/JPEG, resize + convert to
  WebP in the browser at **squoosh.app** (no install): drop the file in, set width 1440,
  choose WebP, nudge quality until it's under ~100 KB, download.

### Drop it in
1. Save the file as **`images/<storyId>/<chapterId>.webp`** — lowercase, exactly as written in
   the table (filenames are **case-sensitive** on GitHub Pages; a mismatch works on Windows
   then 404s when hosted). Example: `images/panda/panda-greetings.webp`.
2. In `js/data.js`, add one line to that chapter, next to its `bg:`:
   ```js
   bgImage: 'images/panda/panda-greetings.webp',
   ```
3. Reload. That's it. (Test in a **Private Safari tab** on the iPad — it caches aggressively.)

---

## Per-chapter subjects

Path = `images/<storyId>/<chapterId>.webp`. Full prompt = STYLE PREAMBLE + the SUBJECT.

### Story 1 — panda · 红熊猫回家 / Red Pandy Goes Home
| chapterId | scene | SUBJECT |
|---|---|---|
| `panda-greetings` | Hello Village 🏡 | a friendly little village street with cozy houses and leafy trees |
| `panda-animals` | Happy Farm 🚜 | a cheerful farm with a red barn, green fields and a small tractor |
| `panda-colors` | Rainbow Bridge 🌈 | a big colorful rainbow arching over a stone bridge and a river |
| `panda-numbers` | Number River 🌊 | a winding blue river with round stepping stones and lily pads |
| `panda-food` | Big Market 🧺 | a lively outdoor market with fruit and vegetable stalls under awnings |
| `panda-weather` | Weather Mountain ⛰️ | a tall green mountain with sun, fluffy clouds and a rainbow of weather |
| `panda-describe` | Describe It 🔍 | a cozy gallery nook with framed pictures on a warm wall |
| `panda-family` | Bamboo Mountain 🎋 | a lush green bamboo forest on a gentle hillside |
| `panda-speaks` | Red Pandy Speaks 💬 | a warm welcoming home interior with soft light and cushions |

### Story 2 — pups · 汪汪救援队 / Puppy Rescue Squad
| chapterId | scene | SUBJECT |
|---|---|---|
| `pups-hq` | Rescue HQ 🗼 | a bright cartoon rescue-team headquarters with a tall lookout tower |
| `pups-vehicles` | Vehicle Garage 🚒 | an open garage bay with a fire truck and ambulance parked inside |
| `pups-actions` | Action Training 🏃 | an outdoor training field with an obstacle course and ramps |
| `pups-city` | City Search 🗺️ | a friendly cartoon city street with rows of colorful buildings |
| `pups-rollout` | Roll Out 🛞 | an open road heading out toward hills under a fresh morning sky |
| `pups-where` | Where's the Kitten 🔦 | a quiet dusk alley with bushes and a soft glow, gentle mystery |
| `pups-radio` | Radio Call 📻 | a cozy command room with a big screen map and a radio antenna |
| `pups-rescue` | The Big Rescue 🚁 | a dramatic but friendly rescue scene by a cliff with a helicopter overhead |
| `pups-hero` | Little Hero 🦸 | a celebratory town plaza with banners and confetti at golden sunset |

### Story 3 — princess · 小公主的皇冠 / The Princess's Crown
| chapterId | scene | SUBJECT |
|---|---|---|
| `princess-palace` | The Palace 🏰 | a grand sparkling fairytale palace throne hall with tall windows |
| `princess-wardrobe` | Magic Wardrobe 👗 | a magical wardrobe room full of colorful gowns on golden rails |
| `princess-dressup` | Dress Up 💄 | a pretty vanity table with a mirror, ribbons and little makeup pots |
| `princess-mirror` | Magic Mirror 🪞 | an ornate gold-framed magic mirror glowing softly on a wall |
| `princess-inmirror` | In the Mirror 💫 | a dreamy sparkling reflection world of soft clouds and stars |
| `princess-teaparty` | Royal Tea Party 🫖 | a royal garden tea table set with a teapot and pretty cakes |
| `princess-serving` | Serving Guests 🧁 | a long banquet table laden with cupcakes, treats and flowers |
| `princess-garden` | Royal Garden 🌷 | a lush royal flower garden with fountains and blooming tulips |
| `princess-ball` | Ball & Coronation 👑 | a grand ballroom with chandeliers, drapes and a red carpet |

---

_Keep the naming byte-exact and the files small, and the art will drop straight in._
