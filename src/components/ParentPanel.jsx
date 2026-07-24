import React, { useState } from 'react';
import { STAGES } from '../data/stages.js';
import { speakLine, stopSpeaking } from '../audio/speech.js';
import { BUILD_VERSION, C } from '../theme.js';

/* Four taps on the header opens this. Everything a parent needs the night
   before (the full hide list) and everything they need mid-hunt if something
   goes sideways (jump to stage, voice controls). */
export default function ParentPanel({ onClose, onJump, voiceOn, setVoiceOn, voiceCount, onReset }) {
  const [tested, setTested] = useState(null);

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

        <div className="mb-3 p-3 rounded-xl" style={{ background: '#f6f2ea' }}>
          <div className="text-xs font-black mb-2" style={{ color: C.ink }}>
            Voices found on this phone: {voiceCount < 0 ? 'speech not supported' : voiceCount}
          </div>
          <button
            onClick={() => {
              const ok = speakLine('Rawr! I am Ignis, guardian of the Dragon Beyblade.', true);
              setTested(ok ? 'sent' : 'failed');
            }}
            className="w-full mb-2 py-2 rounded-xl font-black text-sm"
            style={{ background: C.gold, color: C.ink }}
          >
            🔊 Test the dragon voice
          </button>
          {tested && (
            <div className="text-xs mb-2" style={{ color: '#6b5a45' }}>
              {tested === 'sent'
                ? 'Sent to the phone. Heard nothing? The browser is blocking speech — switch the voice OFF and read the lines aloud yourself.'
                : 'This browser refused speech. Switch the voice OFF and read the lines aloud yourself.'}
            </div>
          )}
          <button
            onClick={() => {
              setVoiceOn(!voiceOn);
              stopSpeaking();
            }}
            className="w-full py-2 rounded-xl font-black text-sm"
            style={{ background: voiceOn ? C.lime : '#ddd', color: C.ink }}
          >
            Dragon voice: {voiceOn ? 'ON' : 'OFF'}
          </button>
        </div>

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
