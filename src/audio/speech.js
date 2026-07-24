import { useEffect, useState } from 'react';

/* Speech is a bonus, never a dependency. Every line spoken here is also on
   screen in large type, so a device with no voices loses nothing but flavour.

   Android Chrome only honours speechSynthesis.speak() when the call happens
   synchronously inside a real user gesture. Calling it from a useEffect after
   a state change is silently dropped — that is exactly how it broke before.
   Every call site in this app fires inside an onClick. */

function pickVoice(s) {
  const vs = s.getVoices() || [];
  if (!vs.length) return null;
  return (
    vs.find((v) => /male/i.test(v.name) && /^en/i.test(v.lang)) ||
    vs.find((v) => /^en-(GB|AU)/i.test(v.lang)) ||
    vs.find((v) => /^en/i.test(v.lang)) ||
    vs[0]
  );
}

function buildUtterance(text, s) {
  const clean = String(text).replace(/[^\w\s,.!?'-]/g, ' ');
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = 0.88;
  u.pitch = 0.5;
  u.volume = 1;
  u.lang = 'en-AU';
  const v = pickVoice(s);
  if (v) u.voice = v;
  return u;
}

export function speakLine(text, enabled) {
  if (!enabled) return false;
  try {
    const s = window.speechSynthesis;
    if (!s) return false;
    /* Only cancel if something is actually in flight; a bare cancel() on some
       Android builds wedges the queue for the rest of the session. */
    if (s.speaking || s.pending) s.cancel();
    s.resume();
    s.speak(buildUtterance(text, s));
    return true;
  } catch {
    return false;
  }
}

/* For a line that has to be queued inside a tap handler (Android's rule,
   see file header) but must not actually play yet -- e.g. the cold-open
   video already has its own dialogue track, and this line should only be
   heard once that video is done and the narrator's text is on screen.
   pause()/resume() are not gesture-gated the way speak() is, so pausing
   right after queuing holds it silently until resumeSpeaking() releases
   it later, with no fresh gesture required. */
export function primeLine(text, enabled) {
  if (!enabled) return false;
  try {
    const s = window.speechSynthesis;
    if (!s) return false;
    if (s.speaking || s.pending) s.cancel();
    s.speak(buildUtterance(text, s));
    s.pause();
    return true;
  } catch {
    return false;
  }
}

export function resumeSpeaking() {
  try {
    /* A harmless no-op if nothing was primed -- safe to call unconditionally
       from the narrator's mount effect regardless of which path got it there. */
    if (window.speechSynthesis) window.speechSynthesis.resume();
  } catch {
    /* noop */
  }
}

export function stopSpeaking() {
  try {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  } catch {
    /* noop */
  }
}

/* Voice list on Android arrives asynchronously; warm it via voiceschanged.
   -1 means the device has no speech synthesis at all. */
export function useVoiceStatus() {
  const [count, setCount] = useState(-1);
  useEffect(() => {
    let timer;
    try {
      const s = window.speechSynthesis;
      if (!s) {
        setCount(-1);
        return undefined;
      }
      const load = () => setCount((s.getVoices() || []).length);
      load();
      s.addEventListener('voiceschanged', load);
      timer = setTimeout(load, 900);
      return () => {
        s.removeEventListener('voiceschanged', load);
        clearTimeout(timer);
      };
    } catch {
      setCount(-1);
      return undefined;
    }
  }, []);
  return count;
}
