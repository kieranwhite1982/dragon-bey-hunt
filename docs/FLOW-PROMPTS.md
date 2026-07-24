# Google Flow prompts

Every generated asset for this app, with a copy-pasteable prompt. The intro
clip (§4.1) is already generated and in `public/`; everything else is a slot
waiting to be filled.

---

## 1. Rules that apply to every generation

**Set the aspect ratio to 9:16 before you hit generate.** This is the mistake
that cost the first intro clip — Flow defaults to 16:9, the phone is portrait,
and a 16:9 clip letterboxes into a thin strip. Portrait, every time.

**Generate the Ignis portrait (§3.1) first.** It becomes the reference image
you feed into every other prompt via *Ingredients to Video*, which is the only
reliable way to keep the same dragon across clips. Without it you get a
different dragon in every asset and the illusion breaks.

**Don't ask for on-screen text.** Veo garbles lettering more often than not.
"HAPPY BIRTHDAY EVAN" is drawn by the app in real type — let it.

**Say the dialogue you want, in quotes, and add "no subtitles".** Veo 3
generates native audio; quoted lines get spoken, unquoted description gets
acted. Without the subtitle instruction it often burns captions into the frame.

**Keep clips at 8–10 seconds.** Kids skip anything longer, and the service
worker precaches the whole app — the current budget is ~2.9 MB total with one
clip in it. The 40 MB precache ceiling is the hard limit; four clips at ~2.5 MB
each is still comfortable.

**Download as MP4, rename to the exact filename below, drop it in `public/`,
rebuild.** `vite.config.js` detects the file at build time and bakes the name
in — no code change needed for the two wired slots.

---

## 2. The character bible

Paste this block into every prompt so the dragon and the villain stay on model.
The colours are lifted from `src/theme.js` and `src/components/Dragon.jsx`, so
the generated art sits on the app's palette instead of fighting it.

**IGNIS (the good dragon).**

> Ignis is a friendly cartoon dragon in a bright children's-cartoon style:
> chunky rounded shapes, thick dark outlines, flat cel shading, no realism and
> no photorealistic texture. His body is a warm gradient from pale orange
> (#ffb35c) through orange (#ff7a2f) to deep red (#d61f1f). His belly, horns
> and chin spike are cream (#ffe9b0). His eyes are large and round with bright
> gold irises (#ffc94a). His wings are deep crimson to dark magenta (#ff2e63
> to #7a0f3d). He looks bold and heroic, never scary — this is for a
> seven-year-old.

**THE SHADOW WYRM (the villain).**

> The Shadow Wyrm is a cartoon serpent-dragon in the same chunky
> children's-cartoon style, but built from violet and deep purple (#c084fc
> highlights over #4c1d95 shadow) with smoky purple energy trailing off its
> body. Glowing white-violet eyes, long sinuous neck, no visible teeth
> close-ups. Menacing in a Saturday-morning-cartoon way, not frightening.

**The world.** Deep indigo night (#1a0b2e to #2d1155), floating embers, gold
and orange rim light, a spinning Beyblade top wherever one is called for.

---

## 3. Still images

### 3.1 Ignis portrait — `public/ignis-portrait.png` — **slot already wired**

Title screen hero. Drops straight in: the app swaps it for the SVG dragon and
gives it a slow breathing animation inside a gold frame. Square or portrait
crop, and **keep the composition centred with headroom** — the frame rounds the
corners off.

> [paste the IGNIS bible]
>
> A head-and-shoulders hero portrait of Ignis facing the viewer, chin slightly
> raised, wings spread behind him and partly out of frame. He is mid-roar with
> a small curl of flame at the corner of his mouth. Deep indigo night sky
> behind him with floating orange embers and a soft golden glow behind his
> head. Centred composition, subject fills the middle 70% of the frame with
> clear space above his horns. Flat vivid cartoon illustration, thick outlines,
> high contrast, no text, no watermark, no border.

### 3.2 Shadow Wyrm portrait — `public/wyrm-portrait.png` — *needs a code slot*

Would show on the battle intro so the boys see who they're fighting before the
first clash. Nothing reads it yet — say the word and I'll wire it.

> [paste the SHADOW WYRM bible]
>
> A head-and-shoulders portrait of the Shadow Wyrm coiling toward the viewer
> out of purple smoke, eyes glowing, five glowing shards of a broken Beyblade
> orbiting its neck. Deep indigo background, violet rim light. Centred
> composition with clear space above the head. Flat vivid cartoon
> illustration, thick outlines, no text, no watermark.

---

## 4. Video clips

### 4.1 Cold open — `public/ignis-intro.mp4` — **done, in the repo**

Recorded for the record, and for when you want to regenerate it. This is the
one that plays before the narrator, full bleed, with a skip button.

> [paste the IGNIS bible]
>
> Vertical 9:16. Ignis flies out of a swirling column of fire toward the
> camera, lands, and speaks directly to the viewer. He says, in a big warm
> booming cartoon-dragon voice: "RRRAAAWWR! I am Ignis, guardian of the Dragon
> Beyblade. A Shadow Wyrm smashed my Beyblade into five parts and hid them in
> YOUR house. Find them, brave bladers!" He beats his wings once on the last
> word and embers scatter toward the camera. Deep indigo cave background,
> floating embers, warm orange key light on his face. Subject centred with
> margin on both sides. No subtitles, no on-screen text.

### 4.2 The theft — `public/wyrm-smash.mp4` — *needs a code slot*

The backstory beat the narrator only describes. Would slot in right after the
Ignis intro, or as the battle's cold open.

> [paste both bibles]
>
> Vertical 9:16. A glowing golden Beyblade top spins on a stone pedestal in a
> deep indigo cavern. The Shadow Wyrm erupts from purple smoke behind it and
> smashes down with its tail. The Beyblade shatters into five glowing shards —
> cyan, lime green, hot pink, gold and orange — which streak off in five
> different directions and vanish. The Wyrm laughs, a low cartoon-villain
> laugh, and dissolves back into smoke. Slow push-in on the empty pedestal.
> Subject centred with margin on both sides. No dialogue, no subtitles, no
> on-screen text.

### 4.3 Victory — `public/ignis-victory.mp4` — *needs a code slot*

Plays on the victory screen, over the top of the confetti. This is the last
thing they see, so it's worth the generation credits.

> [paste the IGNIS bible]
>
> Vertical 9:16. Ignis roars in triumph with the fully reassembled Dragon
> Beyblade — a glowing gold and orange spinning top — hovering and spinning
> above his open claws. He breathes a huge plume of fire straight up. Golden
> sparks and confetti-like embers rain down through the frame. He looks
> delighted, wings thrown wide. He says, in a big warm booming cartoon-dragon
> voice: "You did it, bladers! The Dragon Beyblade is whole again!" Deep indigo
> background lit gold. Subject centred with margin on both sides. No subtitles,
> no on-screen text.

### 4.4 Per-stage taunts — `public/taunt-1.mp4` … `taunt-5.mp4` — *stretch*

Five short clips, one per room, playing on the navigate screen where the text
taunt currently sits. Fun, but it's five generations and five downloads for
about four seconds of screen time each — I'd do 4.1–4.3 first and only come
back to these if the credits are burning a hole.

Template — swap the bracketed line per stage:

> [paste the IGNIS bible]
>
> Vertical 9:16, 6 seconds. Close on Ignis's face, smirking, one eyebrow
> raised. He leans toward the camera and says, in a big warm booming
> cartoon-dragon voice: "[LINE]" Then he snorts a small puff of smoke. Deep
> indigo background with floating embers. Subject centred with margin on both
> sides. No subtitles, no on-screen text.

| # | Room | `[LINE]` |
|---|---|---|
| 1 | Butler's Pantry | "The first shard hides where the plates are stacked. Find it if you can!" |
| 2 | Laundry | "Sniff around where the cat takes her dinner, little bladers!" |
| 3 | Study | "This one is sitting in plain sight. Are your eyes sharp enough?" |
| 4 | Movie Room | "Downstairs now! Where you watch your films, beside the light." |
| 5 | Garage | "The last shard is in the GARAGE. Come and face me!" |

---

## 5. After you download

```bash
npm run build
npm run preview -- --host
```

Then open the network URL on the actual phone and watch it before you commit —
`object-fit` on the intro is one word in `src/components/IgnisIntro.jsx`
(`cover` fills the screen and trims the sides; `contain` shows the whole frame
with thin bars). Two of the five slots above exist in code today; the rest are
half an hour of wiring each.
