/* Optional asset slots (brief §11).

   Resolved at BUILD time by vite.config.js, which scans public/ for files
   named ignis-portrait.*, ignis-intro.*, wyrm-portrait.*, wyrm-smash.* and
   ignis-victory.* and bakes the filename in as a define. Nothing is probed
   over the network, so the slots behave identically online and in flight
   mode, and the service worker precaches whatever is there like any other
   build output.

   To use: drop the file into public/ (e.g. public/ignis-portrait.png,
   public/ignis-intro.mp4) and rebuild. Delete it and rebuild to go back to
   the SVG dragon. */

const portraitFile = typeof __IGNIS_PORTRAIT__ === 'undefined' ? null : __IGNIS_PORTRAIT__;
const introFile = typeof __IGNIS_INTRO__ === 'undefined' ? null : __IGNIS_INTRO__;
const wyrmFile = typeof __WYRM_PORTRAIT__ === 'undefined' ? null : __WYRM_PORTRAIT__;
const wyrmSmashFile = typeof __WYRM_SMASH__ === 'undefined' ? null : __WYRM_SMASH__;
const victoryFile = typeof __IGNIS_VICTORY__ === 'undefined' ? null : __IGNIS_VICTORY__;
const voiceFiles = typeof __VOICE_FILES__ === 'undefined' ? {} : __VOICE_FILES__;

const base = import.meta.env.BASE_URL || '/';

export const IGNIS_PORTRAIT = portraitFile ? base + portraitFile : null;
export const IGNIS_INTRO = introFile ? base + introFile : null;
export const WYRM_PORTRAIT = wyrmFile ? base + wyrmFile : null;
export const WYRM_SMASH = wyrmSmashFile ? base + wyrmSmashFile : null;
export const IGNIS_VICTORY = victoryFile ? base + victoryFile : null;

/* {key: url} for whichever of the 16 fixed voice lines have a pre-recorded
   file in public/voice/ -- see audio/voiceover.js. A key absent from this
   object means that line falls back to the device's speechSynthesis. */
export const VOICE_FILES = Object.fromEntries(
  Object.entries(voiceFiles).map(([k, f]) => [k, base + f]),
);

export const INTRO_IS_VIDEO =
  !!introFile && /\.(mp4|webm|m4v|mov|ogg)$/i.test(introFile);
