import React, { useCallback, useEffect, useRef, useState } from 'react';
import Dragon from './Dragon.jsx';
import { SCRIPT } from '../data/stages.js';
import { SCRIPT_VIDEOS, WYRM_PORTRAIT } from '../optionalAssets.js';
import { C } from '../theme.js';

/* Each of the six briefing lines is either a talking-dragon clip (Ignis
   says it himself, in the voice from the Flow renders) or, if that clip
   is missing, the animated SVG dragon plus the line in large type for the
   boys to read aloud. No speech synthesis either way -- the device's TTS
   voice was worse than no voice at all.

   The line is on screen in full underneath regardless, so a clip that
   fails to load or gets skipped never costs them the instructions. */

/* Index of the line where Ignis first names the Shadow Wyrm (data/stages.js
   SCRIPT[1]). Hardcoded rather than matched by content — the script order is
   fixed by design (CLAUDE.md), and a content match would only make this
   silently stop firing if the line is ever reworded. Optional: if no
   wyrm-portrait.* is dropped in public/, this line plays exactly as it
   always has. */
const WYRM_LINE = 1;

/* Typewriter speed with no clip to pace against. */
const TYPE_MS = 26;

export default function Narrator({ audio, onFinish }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState('');
  const [talking, setTalking] = useState(false);
  const typingRef = useRef(null);
  const vidRef = useRef(null);

  const clip = SCRIPT_VIDEOS[`script-${i}`] || null;

  const type = useCallback((line, ms = TYPE_MS) => {
    setShown('');
    let k = 0;
    clearInterval(typingRef.current);
    typingRef.current = setInterval(() => {
      k += 1;
      setShown(line.slice(0, k));
      if (k >= line.length) clearInterval(typingRef.current);
    }, ms);
  }, []);

  useEffect(() => {
    type(SCRIPT[0]);
    return () => clearInterval(typingRef.current);
  }, [type]);

  /* Autoplay each line's clip as it comes up. The gesture chain from the tap
     that advanced the line keeps sound allowed; a rejected play() lands in
     onEnded-equivalent state below, so the line never gets stuck behind a
     clip that was never going to play. */
  useEffect(() => {
    if (!clip) {
      setTalking(false);
      return;
    }
    setTalking(true);
    const v = vidRef.current;
    if (!v) return;
    v.currentTime = 0;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => setTalking(false));
  }, [clip, i]);

  /* Pace the typing to the clip so the words land roughly as Ignis says them
     instead of racing 5-7s ahead of his voice. Falls back to the fixed speed
     when there's no clip or the duration isn't known yet. */
  const paceToClip = () => {
    const v = vidRef.current;
    const line = SCRIPT[i];
    if (!v || !isFinite(v.duration) || v.duration <= 0) return;
    const ms = Math.max(TYPE_MS, Math.floor((v.duration * 1000 * 0.85) / line.length));
    type(line, ms);
  };

  const typing = shown.length < SCRIPT[i].length;
  const last = i === SCRIPT.length - 1;

  const next = () => {
    /* The two-stage "first tap finishes the text, second tap advances" only
       makes sense without a clip. Mid-clip that would cost two taps to skip
       a line they've decided to skip, so there one tap just moves on. */
    if (!talking && typing) {
      clearInterval(typingRef.current);
      setShown(SCRIPT[i]);
      return;
    }
    if (!last) {
      const ni = i + 1;
      /* The grumble is a UI sound for the no-clip case. With a clip it would
         land on top of Ignis's first word, so let his own voice carry it. */
      if (!SCRIPT_VIDEOS[`script-${ni}`]) audio.grumble();
      setI(ni);
      type(SCRIPT[ni]);
    } else {
      audio.roar(1.2);
      onFinish();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
      <div className="relative">
        {/* The video box is portrait, not square: the clips are 9:16, and a
            square crop cut 44% of the frame -- enough to lose his horns. */}
        {clip ? (
          <video
            ref={vidRef}
            key={clip}
            src={clip}
            className="rounded-3xl"
            style={{
              /* Shrinks on short screens so the NEXT button and the line of
                 text are never pushed off the bottom; 270px is the cap on a
                 normal phone. */
              height: 'min(270px, 38dvh)',
              aspectRatio: '186 / 270',
              objectFit: 'cover',
              border: `4px solid ${C.gold}`,
              boxShadow: `0 0 34px ${C.ember}`,
            }}
            playsInline
            autoPlay
            onLoadedMetadata={paceToClip}
            onEnded={() => setTalking(false)}
            onError={() => setTalking(false)}
          />
        ) : (
          <Dragon speaking={typing} fire={last} size={165} />
        )}
        {WYRM_PORTRAIT && i === WYRM_LINE && (
          <img
            key="wyrm-cameo"
            src={WYRM_PORTRAIT}
            alt="The Shadow Wyrm"
            className="pop absolute object-cover rounded-full"
            style={{
              width: 74,
              height: 74,
              top: -8,
              right: -10,
              border: `3px solid ${C.shadow}`,
              boxShadow: `0 0 24px ${C.shadowDeep}`,
            }}
          />
        )}
      </div>

      <div
        className="mt-4 w-full max-w-sm rounded-3xl px-5 py-4"
        style={{ background: 'rgba(255,255,255,0.10)', border: `3px solid ${C.gold}`, minHeight: 130 }}
      >
        <div className="text-xs font-black mb-1" style={{ color: C.gold, letterSpacing: 2 }}>
          IGNIS THE DRAGON
        </div>
        <div className="font-bold text-white text-lg leading-snug">
          {shown}
          <span style={{ opacity: typing ? 1 : 0 }}>▌</span>
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        {SCRIPT.map((_, k) => (
          <div
            key={k}
            className="w-2 h-2 rounded-full mt-3"
            style={{ background: k <= i ? C.gold : 'rgba(255,255,255,0.25)' }}
          />
        ))}
      </div>

      {/* While Ignis is mid-sentence the button stays deliberately dull and
          says so. It is still tappable -- nothing in this app may trap them --
          but it stops reading as "press me", which is the only thing standing
          between a 6-year-old and cutting off every line 5 seconds early. */}
      <button
        onClick={next}
        className={`mt-5 px-10 py-4 rounded-full font-black text-xl${talking ? '' : ' glowy'}`}
        style={
          talking
            ? {
                background: 'rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.75)',
                border: '5px solid rgba(255,255,255,0.25)',
              }
            : {
                background: `linear-gradient(180deg, ${C.gold}, ${C.ember})`,
                color: '#3b0d00',
                border: '5px solid #fff',
              }
        }
      >
        {talking ? '🐉 Ignis is talking…' : typing ? 'SKIP ⏩' : last ? 'START THE HUNT 🔥' : 'NEXT ▶'}
      </button>

      <button
        onClick={onFinish}
        className="mt-3 text-xs font-bold"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        skip the whole intro
      </button>
    </div>
  );
}
