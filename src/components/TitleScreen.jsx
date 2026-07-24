import React, { useState } from 'react';
import Dragon from './Dragon.jsx';
import { IGNIS_PORTRAIT } from '../optionalAssets.js';
import { BUILD_VERSION, C } from '../theme.js';

/* If public/ignis-portrait.* exists at build time it takes the hero slot with
   a slow breathing scale; otherwise the SVG dragon does the job. Either way
   the screen is complete — the portrait is a bonus, never a dependency. */
function Hero({ onTap }) {
  const [broken, setBroken] = useState(false);

  if (IGNIS_PORTRAIT && !broken) {
    return (
      <div className="relative" onClick={onTap} style={{ width: '68%', maxWidth: 280 }}>
        <div
          className="breathe rounded-3xl overflow-hidden"
          style={{ border: `4px solid ${C.gold}`, boxShadow: `0 0 44px ${C.ember}` }}
        >
          <img
            src={IGNIS_PORTRAIT}
            alt="Ignis the dragon"
            className="w-full h-auto block"
            onError={() => setBroken(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative" onClick={onTap}>
      <Dragon speaking={false} fire size={150} />
    </div>
  );
}

export default function TitleScreen({ onStart, onContinue, resumeLabel, onHeaderTap }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(circle at 20% 30%, #ff2e63 0%, transparent 40%), radial-gradient(circle at 80% 70%, #22d3ee 0%, transparent 40%)',
        }}
      />

      <Hero onTap={onHeaderTap} />

      <h1
        className="font-black relative mt-2"
        style={{
          fontSize: 46,
          lineHeight: 1,
          color: C.gold,
          textShadow: `0 0 22px ${C.ember}, 4px 4px 0 ${C.flame}`,
          letterSpacing: -1,
        }}
      >
        DRAGON
        <br />
        BEY HUNT
      </h1>

      <p className="mt-4 font-bold relative" style={{ color: C.cyan }}>
        🔥 EVAN — Blader &amp; Navigator
        <br />
        🤖 SAWYER — Dragon Radar Tech
      </p>

      <button
        onClick={onStart}
        className="mt-7 px-10 py-5 rounded-full font-black text-2xl glowy relative"
        style={{
          background: `linear-gradient(180deg, ${C.gold}, ${C.ember})`,
          color: '#3b0d00',
          border: '5px solid #fff',
        }}
      >
        WAKE THE DRAGON
      </button>

      {resumeLabel && (
        <button
          onClick={onContinue}
          className="mt-4 px-7 py-3 rounded-full font-black relative"
          style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', border: `2px solid ${C.lime}` }}
        >
          {resumeLabel}
        </button>
      )}

      <p className="mt-5 text-xs font-bold relative" style={{ color: 'rgba(255,255,255,0.45)' }}>
        Turn the volume UP 🔊
      </p>

      <p className="absolute bottom-1 right-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
        v{BUILD_VERSION}
      </p>
    </div>
  );
}
