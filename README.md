# Dragon Bey Hunt

A ten-minute treasure hunt for Evan's birthday. Evan navigates the map, Sawyer
works the radar, and neither of them can finish a stage without the other.
Installs to an Android home screen and runs entirely offline once loaded —
the finale happens in the garage, where the wifi does not.

## Quick start

```bash
npm install
npm run dev -- --host
```

Then open the printed network URL on the phone (same wifi). `npm run build`
produces `dist/`; `npm run preview -- --host` serves that build, which is what
you want for testing the service worker and Add to Home Screen.

## Deploying

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and
publishes to GitHub Pages. In the repo settings, set **Pages → Build and
deployment → Source** to **GitHub Actions** once, and you never touch it again.

The site lives at `https://<user>.github.io/dragon-bey-hunt/`. That subpath is
why `vite.config.js` sets `base: '/dragon-bey-hunt/'` — **if you rename the
repo, change `REPO` in `vite.config.js` to match** or every asset 404s.

## Checking which build is live

The title screen shows `v<timestamp>-<sha>` in the bottom-right corner, and
the parent panel repeats it. The service worker uses `registerType: 'autoUpdate'`
with `skipWaiting`, so a reload after a deploy picks up the new build; if the
version string still looks stale, close the app from the recents list and
reopen it.

## Testing offline

1. Open the site once with wifi on and let it finish loading.
2. Add to Home Screen.
3. Turn on flight mode.
4. Launch from the home screen icon and play through to the victory screen.

## The presents

The full hide list lives in `src/data/stages.js`, and the parent panel shows it
in-app — **tap the header four times** (the 🐉 on the hunt screen, or the
dragon on the title screen). The panel also has a jump-to-stage control and the
voice toggle.

The route order matters: it uses the stairs exactly once and saves the garage
for last, so nobody walks past the finale on the way to something else.

## Optional assets

Two slots, both optional, both resolved at build time (no network probing, so
they behave the same offline):

| Drop this in `public/` | What happens |
|---|---|
| `ignis-portrait.png` / `.jpg` / `.webp` | Replaces the SVG dragon on the title screen, with a slow breathing animation |
| `ignis-intro.mp4` / `.webm` | Plays as a cold open before the narrator, with a skip button |

Add the file, rebuild, done. Delete it and rebuild to go back. The service
worker precaches files up to 40 MB, so keep any video comfortably under that.

## Voice

Speech synthesis is treated as a bonus everywhere. Every spoken line is also on
screen in large type, so you can read them aloud yourself if the phone's voice
is silent. The parent panel has a voice test that reports how many voices the
device found.

## Regenerating icons

```bash
npm run icons
```

Windows only (uses GDI+). The PNGs are committed, so a normal build never needs
this.
