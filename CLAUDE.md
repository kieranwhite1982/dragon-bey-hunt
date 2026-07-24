# Dragon Bey Hunt

A birthday treasure-hunt PWA for Evan (7) and Sawyer (6). Five real presents in
five real rooms, dragon and Beyblade themed, played on an Android phone.
Full design brief lives in `docs/BRIEF.md`.

## Non-negotiables

- **Must run fully offline after one online load.** The finale happens in the
  garage. No runtime calls to any API, font CDN, or image host — ever.
- **Portrait phone first.** Big tap targets, readable at arm's length by a
  7-year-old.
- **All audio synthesised at runtime** via Web Audio. No audio files.
- **Speech synthesis is optional.** Every spoken line must also be on screen in
  large type.
- **Stage data in `src/data/stages.js` is real and ordered deliberately.**
  Don't reorder, don't "optimise" the route, don't invent rooms.

## Two bugs that must never come back

1. **Hold gestures on Android.** Press on the element (`onPointerDown` +
   `onTouchStart` + `onMouseDown`, ref-guarded); release detected **only on
   `window`**. Never `onPointerLeave`/`onPointerOut` on a hold target. Progress
   via `requestAnimationFrame` + `performance.now()`, never a `useEffect` on
   changing values. Scale transforms go on an inner `pointer-events: none`
   child so the hit area never moves. See `src/hooks/useGlobalRelease.js`.

2. **Speech silently dropped.** `speechSynthesis.speak()` must fire
   synchronously inside a real tap handler. Never from a `useEffect`.

Also: `useAudio()` must return a memoised object. An unstable identity there
restarts the battle's animation loop every frame.

## Commands

```bash
npm run dev -- --host     # dev server, open on the phone over wifi
npm run build             # production build into dist/
npm run preview -- --host # serve dist/ — use this to test the service worker
npm run icons             # regenerate PWA icons (Windows/GDI+ only)
```

## Deploy

Push to `main` → GitHub Actions → Pages. `base` in `vite.config.js` is
`/dragon-bey-hunt/` and **must match the repo name** or every asset 404s.

## Optional assets

Drop `ignis-portrait.*` or `ignis-intro.*` into `public/` and rebuild.
Generation prompts for both (and for the unwired ones) live in
`docs/FLOW-PROMPTS.md`. Anything generated in Flow must be **9:16 portrait**.
`vite.config.js` detects them at build time and bakes the filename in as a
define — no runtime probing, so they behave identically offline.
