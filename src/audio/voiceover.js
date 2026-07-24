import { speakLine, primeLine, resumeSpeaking, stopSpeaking } from './speech.js';
import { VOICE_FILES } from '../optionalAssets.js';

/* Every line in this game is fixed -- SCRIPT and STAGES never change at
   runtime -- so instead of always synthesising speech, each line first
   checks for a pre-recorded file (dropped in public/voice/, detected at
   build time exactly like the portraits and cutscenes). If a better voice
   has been generated for that key, it plays; if not, speakLine() picks up
   the same fallbackText and reads it with the device's TTS, so nothing
   ever goes silent. See docs/FLOW-PROMPTS.md for the key list and
   generation prompts. */

let audioEl = null;
function el() {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = 'auto';
  }
  return audioEl;
}

export function playVoice(key, fallbackText, enabled) {
  if (!enabled) return false;
  const src = VOICE_FILES[key];
  if (!src) return speakLine(fallbackText, enabled);
  try {
    const a = el();
    a.pause();
    a.currentTime = 0;
    a.src = src;
    const p = a.play();
    if (p && typeof p.catch === 'function') p.catch(() => speakLine(fallbackText, enabled));
    return true;
  } catch {
    return speakLine(fallbackText, enabled);
  }
}

/* Same "queue now, release later" trick as primeLine() in speech.js, for the
   same reason: a cold-open video has its own dialogue track, so this line
   must stay silent until the narrator's text is actually on screen. play()
   then an immediate pause() -- both inside the tap, before the browser has
   produced any audible output -- holds it at frame zero for resumeVoice()
   to release with no fresh gesture required. */
export function primeVoice(key, fallbackText, enabled) {
  if (!enabled) return false;
  const src = VOICE_FILES[key];
  if (!src) return primeLine(fallbackText, enabled);
  try {
    const a = el();
    a.pause();
    a.currentTime = 0;
    a.src = src;
    const p = a.play();
    a.pause();
    a._primed = true;
    if (p && typeof p.catch === 'function') p.catch(() => {});
    return true;
  } catch {
    return primeLine(fallbackText, enabled);
  }
}

export function resumeVoice() {
  resumeSpeaking(); // no-op if nothing was primed via the TTS fallback path
  try {
    if (audioEl && audioEl._primed) {
      audioEl._primed = false;
      audioEl.currentTime = 0;
      audioEl.play().catch(() => {});
    }
  } catch {
    /* noop */
  }
}

export function stopVoice() {
  stopSpeaking();
  try {
    if (audioEl) audioEl.pause();
  } catch {
    /* noop */
  }
}
