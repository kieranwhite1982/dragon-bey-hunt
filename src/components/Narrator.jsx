import React, { useCallback, useEffect, useRef, useState } from 'react';
import Dragon from './Dragon.jsx';
import { SCRIPT } from '../data/stages.js';
import { speakLine, stopSpeaking, resumeSpeaking } from '../audio/speech.js';
import { WYRM_PORTRAIT } from '../optionalAssets.js';
import { C } from '../theme.js';

/* The typewriter is decorative. Every line is fully on screen in large type
   before the Next button does anything useful, so if the voice is off (or the
   device has none) the briefing still reads. */

/* Index of the line where Ignis first names the Shadow Wyrm (data/stages.js
   SCRIPT[1]). Hardcoded rather than matched by content — the script order is
   fixed by design (CLAUDE.md), and a content match would only make this
   silently stop firing if the line is ever reworded. Optional: if no
   wyrm-portrait.* is dropped in public/, this line plays exactly as it
   always has. */
const WYRM_LINE = 1;
export default function Narrator({ audio, voiceOn, onFinish }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState('');
  const typingRef = useRef(null);

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
    /* Releases SCRIPT[0]'s speech if App.jsx queued-and-paused it rather than
       speaking it straight away (see primeLine in audio/speech.js) -- a
       harmless no-op if there was nothing to release, so this always runs
       regardless of whether a cold-open video came first. Text and voice
       start together right here. */
    resumeSpeaking();
    type(SCRIPT[0]);
    return () => clearInterval(typingRef.current);
  }, [type]);

  const typing = shown.length < SCRIPT[i].length;

  /* Speech fires synchronously in here — this is a real tap handler, which is
     the only thing Android Chrome will honour. */
  const next = () => {
    if (typing) {
      clearInterval(typingRef.current);
      setShown(SCRIPT[i]);
      return;
    }
    if (i < SCRIPT.length - 1) {
      const ni = i + 1;
      speakLine(SCRIPT[ni], voiceOn);
      audio.grumble();
      setI(ni);
      type(SCRIPT[ni]);
    } else {
      stopSpeaking();
      audio.roar(1.2);
      onFinish();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
      <div className="relative">
        <Dragon speaking={typing} fire={i === SCRIPT.length - 1} size={165} />
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
        {typing ? 'SKIP ⏩' : i === SCRIPT.length - 1 ? 'START THE HUNT 🔥' : 'NEXT ▶'}
      </button>

      <button
        onClick={() => {
          stopSpeaking();
          onFinish();
        }}
        className="mt-3 text-xs font-bold"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        skip the whole intro
      </button>
    </div>
  );
}
