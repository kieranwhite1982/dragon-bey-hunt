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

export default function Narrator({ audio, onFinish }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState('');
  const typingRef = useRef(null);
  const vidRef = useRef(null);

  const clip = SCRIPT_VIDEOS[`script-${i}`] || null;

  const type = useCallback((line) => {
    setShown('');
    let k = 0;
    clearInterval(typingRef.current);
    typingRef.current = setInterval(() => {
      k += 1;
      setShown(line.slice(0, k));
      if (k >= line.length) clearInterval(typingRef.current);
    }, 26);
  }, []);

  useEffect(() => {
    type(SCRIPT[0]);
    return () => clearInterval(typingRef.current);
  }, [type]);

  /* Autoplay each line's clip as it comes up. The gesture chain from the
     tap that advanced the line keeps sound allowed; a rejected play() needs
     no handling here because the line is already on screen in full. */
  useEffect(() => {
    if (!clip) return;
    const v = vidRef.current;
    if (!v) return;
    v.currentTime = 0;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }, [clip, i]);

  const typing = shown.length < SCRIPT[i].length;
  const last = i === SCRIPT.length - 1;

  const next = () => {
    if (typing) {
      clearInterval(typingRef.current);
      setShown(SCRIPT[i]);
      return;
    }
    if (!last) {
      const ni = i + 1;
      audio.grumble();
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
        {clip ? (
          <video
            ref={vidRef}
            key={clip}
            src={clip}
            className="rounded-3xl"
            style={{
              width: 200,
              height: 200,
              objectFit: 'cover',
              border: `4px solid ${C.gold}`,
              boxShadow: `0 0 34px ${C.ember}`,
            }}
            playsInline
            autoPlay
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

      <button
        onClick={next}
        className="mt-5 px-10 py-4 rounded-full font-black text-xl glowy"
        style={{
          background: `linear-gradient(180deg, ${C.gold}, ${C.ember})`,
          color: '#3b0d00',
          border: '5px solid #fff',
        }}
      >
        {typing ? 'SKIP ⏩' : last ? 'START THE HUNT 🔥' : 'NEXT ▶'}
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
