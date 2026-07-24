import React, { useEffect, useRef, useState } from 'react';
import ConfirmSkip from './ConfirmSkip.jsx';
import { C } from '../theme.js';

/* Shared shell for a full-screen video-only cutscene slot (the theft, the
   victory clip). See IgnisIntro.jsx for the cold-open slot, which is kept
   separate because it also has to support a still image -- these two are
   always video.

   Autoplay carries sound, which browsers block unless the gesture chain
   from the tap that opened this screen is intact -- these screens are only
   ever reached from a tap, so it normally is. If play() is still rejected
   we surface a tap-to-play button rather than sitting on a black rectangle. */
export default function VideoCutscene({ src, onDone }) {
  const vidRef = useRef(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => setNeedsTap(true));
  }, []);

  if (!src) return null;

  return (
    <div
      className="flex-1 relative flex flex-col items-center justify-center overflow-hidden"
      style={{ background: `radial-gradient(circle at 50% 40%, ${C.night2}, #000 75%)` }}
    >
      <video
        ref={vidRef}
        src={src}
        className="w-full h-full"
        style={{ objectFit: 'cover', maxHeight: '100%' }}
        playsInline
        autoPlay
        onEnded={onDone}
        onError={() => setFailed(true)}
      />

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
          ▶ TAP TO CONTINUE
        </button>
      )}

      {failed && (
        <div className="absolute inset-0 flex items-center justify-center font-black text-lg px-8 text-center" style={{ color: C.gold }}>
          Ignis is stirring…
        </div>
      )}

      <ConfirmSkip
        onSkip={onDone}
        label="SKIP ⏩"
        className="absolute bottom-4 right-4 px-5 py-3 rounded-full font-black text-sm"
        style={{ background: 'rgba(255,255,255,0.16)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)' }}
        armedStyle={{ background: C.flame, color: '#fff', border: '2px solid #fff' }}
      />
    </div>
  );
}
