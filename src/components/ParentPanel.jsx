import React from 'react';
import { STAGES } from '../data/stages.js';
import useOfflineReady from '../hooks/useOfflineReady.js';
import { BUILD_VERSION, C } from '../theme.js';

/* Four taps on the header opens this. Everything a parent needs the night
   before (the full hide list) and everything they need mid-hunt if something
   goes sideways (jump to stage, start over).

   No voice controls here any more: the app doesn't synthesise speech at all.
   Ignis either talks in his own pre-rendered clips or the line is read off
   the screen, so there is nothing to toggle or test. */
const READY_STYLES = {
  ready: { bg: '#dcfce7', fg: '#14532d' },
  partial: { bg: '#fef3c7', fg: '#78350f' },
  error: { bg: '#fee2e2', fg: '#7f1d1d' },
};

function OfflineReady() {
  const { status, total, cached, missing, recheck } = useOfflineReady(true);

  if (status === 'none') return null;

  const tone = READY_STYLES[status] || { bg: '#f6f2ea', fg: '#6b5a45' };
  const line = {
    idle: 'Checking…',
    checking: 'Checking…',
    ready: `✅ All ${total} clips and pictures are on this phone. The garage will work.`,
    partial: `⚠️ Only ${cached} of ${total} downloaded. Stay on wifi and reopen — the garage may not work yet.`,
    unsupported: 'Offline cache not active here. This check only works on the installed app, not the dev server.',
    error: "Couldn't read the offline cache on this device.",
  }[status];

  return (
    <div className="mb-3 p-3 rounded-xl" style={{ background: tone.bg }}>
      <div className="text-xs font-black mb-1" style={{ color: tone.fg }}>
        Ready for the garage?
      </div>
      <div className="text-xs font-bold" style={{ color: tone.fg }}>{line}</div>
      {status === 'partial' && missing.length > 0 && (
        <div className="text-[10px] mt-1" style={{ color: tone.fg, opacity: 0.85 }}>
          Missing: {missing.slice(0, 4).join(', ')}
          {missing.length > 4 ? ` +${missing.length - 4} more` : ''}
        </div>
      )}
      {(status === 'partial' || status === 'error') && (
        <button
          onClick={recheck}
          className="mt-2 w-full py-2 rounded-xl font-black text-xs"
          style={{ background: C.gold, color: C.ink }}
        >
          Check again
        </button>
      )}
    </div>
  );
}

export default function ParentPanel({ onClose, onJump, onReset }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-2xl p-4 overflow-auto" style={{ background: '#fff', maxHeight: '85%' }}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-black text-lg" style={{ color: C.ink }}>
            Hide list (parent)
          </h3>
          <button onClick={onClose} className="px-3 py-1 rounded-lg font-black" style={{ background: '#eee', color: C.ink }}>
            ✕
          </button>
        </div>

        <OfflineReady />

        {STAGES.map((s, i) => (
          <div key={s.n} className="mb-3 p-3 rounded-xl" style={{ background: '#f6f2ea' }}>
            <div className="font-black text-sm" style={{ color: C.ember }}>
              {s.n}. {s.roomName}
            </div>
            <div className="text-sm font-bold" style={{ color: C.ink }}>
              {s.gift}
            </div>
            <div className="text-xs" style={{ color: '#6b5a45' }}>
              {s.spot}
            </div>
            <button
              onClick={() => onJump(i)}
              className="mt-2 text-xs font-black px-3 py-1 rounded-lg"
              style={{ background: C.gold, color: C.ink }}
            >
              Jump to this stage
            </button>
          </div>
        ))}

        <button
          onClick={onReset}
          className="w-full mb-3 py-2 rounded-xl font-black text-sm"
          style={{ background: '#fee2e2', color: '#7f1d1d' }}
        >
          Start over from the title screen
        </button>

        <p className="text-xs" style={{ color: '#6b5a45' }}>
          Tap the 🐉 header 4 times to open this again.
        </p>
        <p className="text-xs mt-1" style={{ color: '#a08b70' }}>
          Build {BUILD_VERSION}
        </p>
      </div>
    </div>
  );
}
