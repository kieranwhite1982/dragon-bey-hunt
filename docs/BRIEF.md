# Build brief: Dragon Bey Hunt

Paste this whole file into Claude Code as the opening prompt. Attach `dragon-bey-hunt.jsx` alongside it — that file is a working implementation and should be treated as the reference, not thrown away.

---

## 1. What this is

A single-page interactive treasure-hunt app for my son Evan's birthday. He and his younger brother Sawyer follow a map of our house on my phone to find five real presents hidden in five real rooms, in order. Dragon and Beyblade themed.

Story: a Shadow Wyrm smashed the legendary Dragon Beyblade into five parts and hid each one inside a treasure in our house. Find all five, assemble the Bey, beat the Wyrm in a final battle in the garage.

Target runtime: about 10 minutes of real-world play. Ages 7 and 6.

**Roles are load-bearing — do not collapse them into one player.**
- **Evan = Navigator.** Reads the map, taps the glowing room, leads them there. The map only ever highlights a *room*, never the exact hiding spot.
- **Sawyer = Radar Tech.** Only his hold-to-scan reveals *where in the room* to look. Evan cannot complete a stage without him.
- **Both = Dragon Seal.** Two hold-pads at opposite screen edges, held simultaneously for 3 seconds, release the Bey part.

## 2. Why I'm rebuilding it here

It currently runs as a Claude artifact. Moving to a real repo to get:

1. A stable URL and a proper web app manifest, so Add to Home Screen gives true fullscreen with no browser chrome.
2. **Offline capability.** The finale happens in a garage with unreliable wifi. The app must work fully offline once loaded. This is the single most important reason for the move.
3. Normal persistent storage on a stable origin, so future edits don't wipe saved state.
4. Room to host a generated video/image asset locally.

## 3. Hard constraints

- Must run offline after first load. No runtime calls to any external API, font CDN, or image host.
- Portrait phone first (Android Chrome is the target device). Everything reachable one-handed, tap targets large.
- All audio synthesised at runtime via Web Audio API. No audio files unless I explicitly add them later.
- No dependency on speech synthesis working — see §8.
- Deployed to GitHub Pages.

## 4. Stack

- Vite + React 18, TypeScript optional (JS is fine, don't spend time on types).
- Tailwind for layout; inline styles for the bright custom colour work.
- `vite-plugin-pwa` for the service worker and manifest.
- No component library, no animation library. SVG + CSS keyframes + one canvas for the battle.

**GitHub Pages gotchas to handle up front, not later:**
- Set `base: '/<repo-name>/'` in `vite.config.js`, and make every asset path relative. This is the most common first-deploy failure.
- Configure the PWA plugin with `registerType: 'autoUpdate'` and skipWaiting, so I never get served a stale cached build. Add a visible build version string somewhere small on the title screen so I can confirm which version is live.
- Add a GitHub Actions workflow that builds and deploys to Pages on push to `main`.

## 5. Repo structure

```
src/
  App.jsx                 screen router + game state
  data/stages.js          the five stages (see §6)
  data/rooms.js           floor plan geometry (see §7)
  audio/useAudio.js       Web Audio hooks
  audio/speech.js         speech synthesis with fallback
  components/Dragon.jsx   animated SVG dragon
  components/FloorMap.jsx clickable SVG floor plan
  components/RadarPad.jsx hold-to-scan
  components/SealPads.jsx two-player hold
  components/Battle.jsx   canvas Beyblade battle
  components/Narrator.jsx dragon briefing sequence
  components/Confetti.jsx
  components/ParentPanel.jsx
  styles/animations.css
public/
  manifest + icons
```

## 6. Stage data — copy exactly

The rooms, gifts and hiding places are real. Do not invent or reorder them.

| # | Floor | Room id | Room shown | Hiding spot | Real gift | Bey part |
|---|-------|---------|-----------|-------------|-----------|----------|
| 1 | up | `pantry` | the Butler's Pantry | In the drawer with the plastic plates | Coding Spy Experiment Kit | THE RATCHET ⚙️ `#22d3ee` |
| 2 | up | `laundry` | the Laundry | In the cupboard where the cat food lives | Snap Circuits Junior | THE ENERGY LAYER ⚡ `#a3e635` |
| 3 | up | `study` | the Study | Sitting right on the chair | Apitor Robot J | THE BIT CHIP 🧠 `#ff2e63` |
| 4 | down | `lounge` | the Movie Room | Beside the couch, next to the lamp | Small World | THE FORGE DISC 💿 `#ffc94a` |
| 5 | down | `garage` | THE GARAGE | In the car — on the driver's seat! | Smart Watch | THE DRAGON DRIVER 🔥 `#ff6b35` |

Route order matters: it uses the stairs once and saves the garage for last so the finale isn't spoiled by walking past it. Don't "optimise" it.

Each stage also carries a `taunt` (dragon line shown on the map screen) and a `hint`. Take these from the reference file.

**When a part is reclaimed, the app names the actual gift on screen** — "The dragon hid it inside… your new Smart Watch!" That specificity is the whole payoff. Keep it.

## 7. Floor plan

Two floors, toggled by a segmented control. Both drawn as SVG in a `0 0 600 900` viewBox on a parchment background with a faint grid.

Deliberately simplified and landmark-driven, not an accurate architectural trace — a 7-year-old needs to recognise rooms by their contents. Every named room carries a hand-drawn icon: pantry shelves, kitchen stovetop, washing machine, desk, sofa, TV, bed, car.

Geometry is in `ROOMS_UP` / `ROOMS_DOWN` in the reference file — copy the coordinates verbatim, they're tuned against photos of my actual floor plan.

Behaviour:
- Target room glows with an animated outline and a pulsing `?` marker. All other rooms are visible but muted.
- Tapping a wrong room shakes it and plays a dragon grumble. No penalty.
- If the target is on the other floor, hide the highlight entirely and show a prompt to switch floors. Making them find the stairs is intentional.
- After 60 seconds stuck on one stage, a large pulsing arrow auto-appears over the target room. I'll be filming, not troubleshooting.
- Downstairs, the staircase arrives in the **hall**, and a marked `DOOR` connects the hall to the garage.

## 8. The two bugs that already bit me — do not reintroduce

**Hold gestures broke on Android.** Original cause: `onPointerLeave` on the hold button, combined with a CSS scale transform on that same button, which shrank the element out from under the finger and fired a phantom leave event the instant it was pressed. The bar never moved.

Required implementation for every hold interaction:
- Press handled on the element via `onPointerDown`, `onTouchStart` and `onMouseDown` (guarded by a ref so a double-fire is harmless).
- **Release detected only on `window`** — `pointerup`, `pointercancel`, `touchend`, `touchcancel`, `blur`. Never element-level leave/out events.
- Progress driven by `requestAnimationFrame` reading `performance.now()`, never by a `useEffect` that depends on changing values.
- Any scale transform goes on an *inner* element with `pointer-events: none`, so the hit area never moves.
- Set `touch-action: none`, `user-select: none`, `-webkit-touch-callout: none`, `-webkit-tap-highlight-color: transparent`.
- Ship an escape hatch: after ~9s on the radar and ~12s on the seal, reveal a tap-based alternative. The party cannot stall.

**Speech synthesis was silently dropped.** Cause: speech was started from a `useEffect` after a state change. Android Chrome only honours speech initiated inside a real tap handler.

Required:
- Every `speechSynthesis.speak()` call fires synchronously inside an `onClick`, including the very first line.
- Warm up the voice list via the `voiceschanged` event; call `resume()` before speaking; only `cancel()` if already speaking.
- **Treat voice as optional throughout.** Every spoken line must also be on screen in large type, because I may end up reading them aloud myself. Provide an ON/OFF toggle and a "test the voice" button in the parent panel that reports how many voices the device found.

Also: the audio hook's returned object must be memoised. An unstable object identity there tears down and restarts the battle's animation loop every frame.

## 9. Screens and flow

`title → narrator → [stage 1..5] → battle → victory`

Per stage: `navigate → radar → grab → seal → reward`

- **Title.** Big animated dragon, game name, both boys' roles, one huge start button.
- **Narrator.** Ignis the dragon delivers a six-line briefing with a typewriter effect, a Next button, and a skip. He breathes fire on the last line. Script is in the reference file.
- **navigate.** Map + dragon taunt + floor toggle. Evan taps the target room.
- **radar.** Sawyer's hold-to-scan, ~2.5s, rising beeps, ends in a roar.
- **grab.** Reveals the exact hiding spot in huge type. They physically retrieve the present. One "GOT IT!" button.
- **seal.** Two hold-pads, 3 seconds simultaneous, roar, part released.
- **reward.** Part name and emoji, the real gift named, confetti, progress tray of all five slots, button to the next stage.
- **battle.** See §10.
- **victory.** "HAPPY BIRTHDAY EVAN", all five parts listed, credit to Sawyer, confetti, play again.

## 10. The final battle

This carries the entire emotional payoff of the hunt. Budget effort here accordingly — if it's a two-second animation the whole thing deflates at the end.

Canvas, ~45–60 seconds, phase machine:
1. **intro** — beys spiral into a glowing stadium bowl, spin-up whine, "3… 2… 1… LET IT RIP!"
2. **clash** — scripted collisions with sparks, screen shake and impact sounds. The Shadow Wyrm dominates; hero HP scripted down to ~32%. On-screen text says the Wyrm is winning.
3. **mash** — two buttons appear, one labelled EVAN, one SAWYER. Both boys mash to fill a power meter. **The meter also fills on its own, so the fight is unloseable** — mashing only makes it faster and louder.
4. **finish** — hero bey grows and glows, big flash, Dragon Strike, Wyrm's HP hits zero and it wobbles out.
5. **win** — fanfare, roar, straight to victory screen.

## 11. Optional asset slots

I may generate a dragon portrait and/or a short talking-dragon clip in Google Flow. Leave clean slots for these:
- `public/ignis-portrait.*` — if present, show on the title screen with a subtle breathing/parallax effect; otherwise fall back to the SVG dragon.
- `public/ignis-intro.*` — if present, offer it as a cold-open before the narrator, with a skip. Must be bundled locally and precached by the service worker so it plays offline.

Both are optional. The app must be fully complete and shippable with neither.

## 12. Parent panel

Hidden behind four taps on the header. Contains: the full hide list (room, gift, exact spot) so I can plant the presents the night before; a jump-to-stage control in case something goes wrong mid-hunt; the voice toggle and voice test.

## 13. Acceptance checklist

Before you tell me it's done, verify:

- [ ] Builds and deploys to GitHub Pages; assets resolve under the repo subpath.
- [ ] Installs to an Android home screen and launches fullscreen with no address bar.
- [ ] **Loads and completes end to end with the device in flight mode** after one online visit.
- [ ] Radar hold and both seal pads work with real touch input, including two simultaneous fingers.
- [ ] Tap-based fallbacks appear on schedule.
- [ ] All five stages reachable in order; each names the correct gift and hiding spot.
- [ ] Wrong-room taps and wrong-floor states behave as described.
- [ ] The 60-second stuck arrow appears.
- [ ] The battle always ends in a win, even with zero button presses.
- [ ] Everything readable at arm's length on a phone by a 7-year-old.
- [ ] Nothing breaks if speech synthesis is unavailable.

## 14. Working style

Keep the theming loud — bright, high-contrast, chunky type, lots of orange, gold, hot pink and cyan on a deep indigo ground. Cheerful, not tasteful.

Flag design trade-offs honestly as you go rather than delivering silently. If something in this brief is a bad idea, say so.
