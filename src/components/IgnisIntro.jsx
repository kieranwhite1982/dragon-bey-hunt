import React, { useEffect, useRef, useState } from 'react';
import { IGNIS_INTRO, INTRO_IS_VIDEO } from '../optionalAssets.js';
import { C } from '../theme.js';

/* Cold-open slot (brief §11). Only mounted when public/ignis-intro.* exists at
   build time. The file is bundled and precached, so it plays in the garage
   with the wifi off.

   Autoplay carries sound here, which browsers block unless the gesture chain
   is intact — the screen is only ever reached from the title button tap, so
   it normally is. If play() is still rejected we surface a tap-to-play button
   rather than sitting on a black rectangle. */
export default function IgnisIntro({ onDone }) {
  const vidRef = useRef(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!INTRO_IS_VIDEO) return;
    const v = vidRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => setNeedsTap(true));
  }, []);

  if (!IGNIS_INTRO) return null;

  return (
    <div className="flex-1 relative flex flex-col items-center justify-center bg-black">
      {INTRO_IS_VIDEO ? (
        <video
          ref={vidRef}
          src={IGNIS_INTRO}
          className="w-full h-full object-contain"
          playsInline
          autoPlay
          onEnded={onDone}
          onError={() => setFailed(true)}
          style={{ maxHeight: '100%' }}
        />
      ) : (
        <img src={IGNIS_INTRO} alt="" className="w-full h-full object-contain" onError={() => setFailed(true)} />
      )}

      {needsTap && !failed && (
        <button
          onClick={() => {
            setNeedsTap(false);
            const v = vidRef.current;
            if (v) v.play().catch(() => setFailed(true));
          }}
          className="absolute inset-0 flex items-center justify-center font-black text-2xl"
          style={{ background: 'rgba(0,0,0,0.55)', color: C.gold }}
        >
          ▶ TAP TO WAKE IGNIS
        </button>
      )}

      {failed && (
        <div className="absolute inset-0 flex items-center justify-center font-black text-lg px-8 text-center" style={{ color: C.gold }}>
          Ignis is stirring…
        </div>
      )}

      <button
        onClick={onDone}
        className="absolute bottom-4 right-4 px-5 py-3 rounded-full font-black text-sm"
        style={{ background: 'rgba(255,255,255,0.16)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)' }}
      >
        SKIP ⏩
      </button>
    </div>
  );
}
