/* Optional asset slots (brief §11).

   Resolved at BUILD time by vite.config.js, which scans public/ for files
   named ignis-portrait.* and ignis-intro.* and bakes the filename in as a
   define. Nothing is probed over the network, so the slots behave identically
   online and in flight mode, and the service worker precaches whatever is
   there like any other build output.

   To use: drop the file into public/ (e.g. public/ignis-portrait.png,
   public/ignis-intro.mp4) and rebuild. Delete it and rebuild to go back to
   the SVG dragon. */

const portraitFile = typeof __IGNIS_PORTRAIT__ === 'undefined' ? null : __IGNIS_PORTRAIT__;
const introFile = typeof __IGNIS_INTRO__ === 'undefined' ? null : __IGNIS_INTRO__;

const base = import.meta.env.BASE_URL || '/';

export const IGNIS_PORTRAIT = portraitFile ? base + portraitFile : null;
export const IGNIS_INTRO = introFile ? base + introFile : null;

export const INTRO_IS_VIDEO =
  !!introFile && /\.(mp4|webm|m4v|mov|ogg)$/i.test(introFile);
