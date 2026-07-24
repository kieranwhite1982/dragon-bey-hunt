import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

/* ============================================================
   DRAGON BEY HUNT — Evan's Birthday Treasure Hunt
   Evan = Blader (navigates the map)
   Sawyer = Radar Tech (scans the room to find the spot)
   Both = break the Dragon Seal together
   ============================================================ */

const C = {
  night: '#1a0b2e',
  night2: '#2d1155',
  ember: '#ff6b35',
  gold: '#ffc94a',
  flame: '#ff2e63',
  cyan: '#22d3ee',
  lime: '#a3e635',
  parch: '#fff6e0',
  ink: '#3b1f0b',
};

const STAGES = [
  {
    n: 1,
    floor: 'up',
    roomId: 'pantry',
    roomName: "the Butler's Pantry",
    spot: 'In the drawer with the plastic plates',
    spotEmoji: '🍽️',
    gift: 'Coding Spy Experiment Kit',
    part: { name: 'THE RATCHET', emoji: '⚙️', color: '#22d3ee' },
    taunt: 'I smell something sneaky where the food is kept!',
    hint: 'The little room at the TOP of the map, next to the kitchen.',
  },
  {
    n: 2,
    floor: 'up',
    roomId: 'laundry',
    roomName: 'the Laundry',
    spot: 'In the cupboard where the cat food lives',
    spotEmoji: '🐱',
    gift: 'Snap Circuits Junior',
    part: { name: 'THE ENERGY LAYER', emoji: '⚡', color: '#a3e635' },
    taunt: 'Something is BUZZING with power near the washing machine…',
    hint: 'Left side of the map — the room with the washing machine.',
  },
  {
    n: 3,
    floor: 'up',
    roomId: 'study',
    roomName: 'the Study',
    spot: 'Sitting right on the chair',
    spotEmoji: '🪑',
    gift: 'Apitor Robot J',
    part: { name: 'THE BIT CHIP', emoji: '🧠', color: '#ff2e63' },
    taunt: 'The brain of the Bey is hidden where the thinking happens!',
    hint: 'Bottom left of the map — the room with the desk.',
  },
  {
    n: 4,
    floor: 'down',
    roomId: 'lounge',
    roomName: 'the Movie Room',
    spot: 'Beside the couch, next to the lamp',
    spotEmoji: '🛋️',
    gift: 'Small World',
    part: { name: 'THE FORGE DISC', emoji: '💿', color: '#ffc94a' },
    taunt: 'DOWN THE STAIRS! The Shadow Wyrm flew to the bottom floor!',
    hint: 'Downstairs, out of the hall, into the big Movie Room.',
  },
  {
    n: 5,
    floor: 'down',
    roomId: 'garage',
    roomName: 'THE GARAGE',
    spot: "In the car — on the driver's seat!",
    spotEmoji: '🚗',
    gift: 'Smart Watch',
    part: { name: 'THE DRAGON DRIVER', emoji: '🔥', color: '#ff6b35' },
    taunt: 'The last part is in the GARAGE. Be brave, Bladers.',
    hint: 'From the hall, through the DOOR into the huge garage.',
  },
];

/* ---------------- ROOM SHAPES ---------------- */

const ROOMS_UP = [
  { id: 'pantry', name: "Butler's\nPantry", x: 40, y: 30, w: 112, h: 150, fill: '#f9a8d4', icon: 'shelves' },
  { id: 'nook', name: '', x: 40, y: 190, w: 112, h: 52, fill: '#dfe3ea' },
  { id: 'kitchen', name: 'Kitchen', x: 40, y: 252, w: 112, h: 180, fill: '#5eead4', icon: 'kitchen' },
  {
    id: 'living', name: 'Living Room', poly: '162,30 522,30 522,420 332,420 332,720 202,720 202,420 162,420',
    cx: 350, cy: 190, fill: '#fca5a5', icon: 'sofa',
  },
  { id: 'laundry', name: 'Laundry', x: 42, y: 450, w: 138, h: 162, fill: '#a7f3d0', icon: 'washer' },
  { id: 'room2', name: '', x: 402, y: 442, w: 118, h: 96, fill: '#bfdbfe' },
  { id: 'bedroom', name: 'Bedroom', x: 350, y: 556, w: 212, h: 200, fill: '#fde68a', icon: 'bed' },
  { id: 'study', name: 'Study', x: 38, y: 656, w: 152, h: 204, fill: '#a5b4fc', icon: 'desk' },
];

const ROOMS_DOWN = [
  { id: 'lounge', name: 'Movie Room', x: 298, y: 148, w: 252, h: 262, fill: '#fbbf24', icon: 'tv' },
  { id: 'halldown', name: 'Hall', x: 300, y: 410, w: 170, h: 106, fill: '#bfdbfe', lx: 336, ly: 470 },
  { id: 'garage', name: 'GARAGE', x: 30, y: 328, w: 264, h: 332, fill: '#c4b5fd', icon: 'car' },
];

/* ---------------- AUDIO + VOICE ---------------- */

function useAudio() {
  const ctxRef = useRef(null);
  const get = useCallback(() => {
    try {
      if (!ctxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctxRef.current = new AC();
      }
      if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
      return ctxRef.current;
    } catch (e) { return null; }
  }, []);

  const noiseBuf = useRef(null);
  const getNoise = (ctx) => {
    if (!noiseBuf.current) {
      const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      noiseBuf.current = b;
    }
    return noiseBuf.current;
  };

  const roar = useCallback((len = 1.1) => {
    const ctx = get(); if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(48, t + len);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(1400, t);
    f.frequency.exponentialRampToValueAtTime(300, t + len);
    o.connect(f); f.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + len + 0.05);

    const n = ctx.createBufferSource(); n.buffer = getNoise(ctx);
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass';
    nf.frequency.setValueAtTime(700, t);
    nf.frequency.exponentialRampToValueAtTime(160, t + len);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.2, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + len);
    n.connect(nf); nf.connect(ng); ng.connect(ctx.destination);
    n.start(t); n.stop(t + len);
  }, [get]);

  const blip = useCallback((freq = 700, len = 0.09, type = 'square', vol = 0.16) => {
    const ctx = get(); if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(freq, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + len + 0.02);
  }, [get]);

  const clash = useCallback(() => {
    const ctx = get(); if (!ctx) return;
    const t = ctx.currentTime;
    const n = ctx.createBufferSource(); n.buffer = getNoise(ctx);
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    n.connect(f); f.connect(g); g.connect(ctx.destination);
    n.start(t); n.stop(t + 0.3);
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.25);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.3, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g2); g2.connect(ctx.destination);
    o.start(t); o.stop(t + 0.27);
  }, [get]);

  const spinUp = useCallback((len = 1.4) => {
    const ctx = get(); if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(900, t + len);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + len * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.3);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(2200, t + len);
    o.connect(f); f.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + len + 0.35);
  }, [get]);

  const fanfare = useCallback(() => {
    const ctx = get(); if (!ctx) return;
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((fr, i) => {
      const t = ctx.currentTime + i * 0.13;
      const o = ctx.createOscillator(); o.type = 'square';
      o.frequency.setValueAtTime(fr, t);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + 0.55);
    });
  }, [get]);

  const grumble = useCallback(() => {
    const ctx = get(); if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(120, t);
    o.frequency.linearRampToValueAtTime(70, t + 0.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    o.connect(f); f.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.45);
  }, [get]);

  return useMemo(
    () => ({ roar, blip, clash, spinUp, fanfare, grumble, unlock: get }),
    [roar, blip, clash, spinUp, fanfare, grumble, get]
  );
}

/* Speech must be kicked off INSIDE a real tap handler on Android/iOS,
   never from a useEffect, or the browser silently drops it. */
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

function speakLine(text, enabled) {
  if (!enabled) return false;
  try {
    const s = window.speechSynthesis;
    if (!s) return false;
    if (s.speaking || s.pending) s.cancel();
    const clean = String(text).replace(/[^\w\s,.!?'-]/g, ' ');
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 0.88; u.pitch = 0.5; u.volume = 1; u.lang = 'en-AU';
    const v = pickVoice(s);
    if (v) u.voice = v;
    s.resume();
    s.speak(u);
    return true;
  } catch (e) { return false; }
}

function stopSpeaking() {
  try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* noop */ }
}

function useVoiceStatus() {
  const [count, setCount] = useState(-1);
  useEffect(() => {
    try {
      const s = window.speechSynthesis;
      if (!s) { setCount(-1); return; }
      const load = () => setCount((s.getVoices() || []).length);
      load();
      s.addEventListener('voiceschanged', load);
      const t = setTimeout(load, 900);
      return () => { s.removeEventListener('voiceschanged', load); clearTimeout(t); };
    } catch (e) { setCount(-1); }
  }, []);
  return count;
}

/* ---------------- DRAGON CHARACTER ---------------- */

function Dragon({ speaking, fire = false, size = 190 }) {
  return (
    <svg width={size} height={size * 1.18} viewBox="0 0 220 260" className="dragon-bob" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="dbody" cx="40%" cy="30%">
          <stop offset="0%" stopColor="#ffb35c" />
          <stop offset="60%" stopColor="#ff7a2f" />
          <stop offset="100%" stopColor="#d61f1f" />
        </radialGradient>
        <linearGradient id="dwing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff2e63" />
          <stop offset="100%" stopColor="#7a0f3d" />
        </linearGradient>
        <linearGradient id="dflame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="45%" stopColor="#ff9d2f" />
          <stop offset="100%" stopColor="#ff2e2e" />
        </linearGradient>
      </defs>

      {/* tail */}
      <g className="dragon-tail" style={{ transformOrigin: '150px 172px' }}>
        <path d="M148,172 C198,188 218,158 204,134 C197,122 183,125 181,136"
          fill="none" stroke="#e0521a" strokeWidth="15" strokeLinecap="round" />
        <path d="M178,142 l-13,-15 l26,-5 z" fill="#ffe9b0" stroke="#8f1a08" strokeWidth="3" strokeLinejoin="round" />
      </g>

      {/* wings */}
      <g className="wing-l">
        <path d="M72,118 C30,86 8,104 6,138 C30,132 44,140 50,158 C58,138 62,128 72,118 Z"
          fill="url(#dwing)" stroke="#5c0c2c" strokeWidth="4" strokeLinejoin="round" />
        <path d="M66,122 L18,112 M66,126 L20,132 M68,132 L34,150" stroke="#5c0c2c" strokeWidth="2.6" opacity="0.6" fill="none" />
      </g>
      <g className="wing-r">
        <path d="M148,118 C190,86 212,104 214,138 C190,132 176,140 170,158 C162,138 158,128 148,118 Z"
          fill="url(#dwing)" stroke="#5c0c2c" strokeWidth="4" strokeLinejoin="round" />
        <path d="M154,122 L202,112 M154,126 L200,132 M152,132 L186,150" stroke="#5c0c2c" strokeWidth="2.6" opacity="0.6" fill="none" />
      </g>

      {/* body */}
      <ellipse cx="110" cy="146" rx="58" ry="50" fill="url(#dbody)" stroke="#8f1a08" strokeWidth="5" />
      <ellipse cx="110" cy="158" rx="34" ry="32" fill="#ffd88a" opacity="0.95" />
      {[0, 1, 2].map((i) => (
        <line key={i} x1="82" y1={142 + i * 16} x2="138" y2={142 + i * 16} stroke="#e0a94a" strokeWidth="3" opacity="0.7" />
      ))}

      {/* spine spikes */}
      <path d="M62,116 l-11,-13 l16,2 z M158,116 l11,-13 l-16,2 z" fill="#ffe9b0" stroke="#8f1a08" strokeWidth="2.6" strokeLinejoin="round" />

      {/* horns */}
      <path d="M70,52 L58,14 L88,42 Z" fill="#ffe9b0" stroke="#8f1a08" strokeWidth="4" strokeLinejoin="round" />
      <path d="M150,52 L162,14 L132,42 Z" fill="#ffe9b0" stroke="#8f1a08" strokeWidth="4" strokeLinejoin="round" />

      {/* head */}
      <ellipse cx="110" cy="78" rx="56" ry="46" fill="url(#dbody)" stroke="#8f1a08" strokeWidth="5" />

      {/* eyes with slit pupils */}
      <g className="dragon-blink">
        <ellipse cx="88" cy="70" rx="15" ry="16" fill="#fff" stroke="#8f1a08" strokeWidth="3" />
        <ellipse cx="132" cy="70" rx="15" ry="16" fill="#fff" stroke="#8f1a08" strokeWidth="3" />
        <circle cx="90" cy="71" r="8" fill="#ffc94a" />
        <circle cx="134" cy="71" r="8" fill="#ffc94a" />
        <ellipse cx="90" cy="71" rx="3" ry="8" fill="#1a0b2e" />
        <ellipse cx="134" cy="71" rx="3" ry="8" fill="#1a0b2e" />
        <circle cx="93" cy="67" r="2.4" fill="#fff" />
        <circle cx="137" cy="67" r="2.4" fill="#fff" />
      </g>

      {/* brow ridges */}
      <path d="M72,50 q16,-8 30,2 M148,50 q-16,-8 -30,2" fill="none" stroke="#8f1a08" strokeWidth="4" strokeLinecap="round" />

      {/* snout + jaw */}
      <ellipse cx="110" cy="102" rx="32" ry="17" fill="#ff9a4d" stroke="#8f1a08" strokeWidth="4" />
      <circle cx="100" cy="98" r="3.4" fill="#8f1a08" />
      <circle cx="120" cy="98" r="3.4" fill="#8f1a08" />
      <g className={speaking ? 'dragon-jaw' : ''} style={{ transformOrigin: '110px 106px' }}>
        <path d="M84,106 Q110,132 136,106 Q110,118 84,106 Z" fill="#7a0f2d" stroke="#8f1a08" strokeWidth="4" strokeLinejoin="round" />
        <path d="M92,108 l5,9 l5,-9 Z" fill="#fff" />
        <path d="M118,108 l5,9 l5,-9 Z" fill="#fff" />
      </g>

      {/* fire breath */}
      {fire && (
        <g style={{ transformOrigin: '110px 112px' }}>
          <path className="flame-a" d="M92,112 Q68,182 110,246 Q152,182 128,112 Z" fill="#ff2e2e" opacity="0.75" style={{ transformOrigin: '110px 112px' }} />
          <path className="flame-b" d="M98,114 Q84,180 110,228 Q136,180 122,114 Z" fill="url(#dflame)" style={{ transformOrigin: '110px 112px' }} />
          <path className="flame-c" d="M104,116 Q97,174 110,210 Q123,174 116,116 Z" fill="#fff3b0" opacity="0.95" style={{ transformOrigin: '110px 112px' }} />
        </g>
      )}

      {/* embers */}
      <g className="ember-1"><circle cx="58" cy="150" r="4" fill="#ffc94a" /></g>
      <g className="ember-2"><circle cx="168" cy="160" r="3.4" fill="#ff9d2f" /></g>
      <g className="ember-3"><circle cx="74" cy="176" r="3" fill="#ff6b35" /></g>
      <g className="ember-4"><circle cx="152" cy="182" r="4.2" fill="#ffe08a" /></g>

      {/* nostril smoke */}
      {speaking && (
        <g className="dragon-smoke">
          <circle cx="70" cy="98" r="7" fill="#ffffff" opacity="0.35" />
          <circle cx="56" cy="88" r="5" fill="#ffffff" opacity="0.25" />
          <circle cx="150" cy="98" r="7" fill="#ffffff" opacity="0.35" />
          <circle cx="164" cy="88" r="5" fill="#ffffff" opacity="0.25" />
        </g>
      )}
    </svg>
  );
}

/* ---------------- HOLD PADS (robust) ---------------- */

/* Release is detected on WINDOW, not on the element. Element-level
   pointerleave/out was cancelling the hold on touch devices. */
function useGlobalRelease(onRelease) {
  const ref = useRef(onRelease);
  useEffect(() => { ref.current = onRelease; }, [onRelease]);
  useEffect(() => {
    const f = () => ref.current();
    window.addEventListener('pointerup', f);
    window.addEventListener('pointercancel', f);
    window.addEventListener('touchend', f);
    window.addEventListener('touchcancel', f);
    window.addEventListener('blur', f);
    return () => {
      window.removeEventListener('pointerup', f);
      window.removeEventListener('pointercancel', f);
      window.removeEventListener('touchend', f);
      window.removeEventListener('touchcancel', f);
      window.removeEventListener('blur', f);
    };
  }, []);
}

function RadarPad({ audio, onFound }) {
  const [prog, setProg] = useState(0);
  const [held, setHeld] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [taps, setTaps] = useState(0);
  const heldRef = useRef(false);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const beepRef = useRef(0);
  const doneRef = useRef(onFound);
  useEffect(() => { doneRef.current = onFound; }, [onFound]);

  useEffect(() => {
    const t = setTimeout(() => setShowFallback(true), 9000);
    return () => clearTimeout(t);
  }, []);

  const tick = useCallback(() => {
    if (!heldRef.current) return;
    const p = Math.min(100, ((performance.now() - startRef.current) / 2500) * 100);
    setProg(p);
    if (p > beepRef.current) {
      beepRef.current += 12;
      audio.blip(320 + p * 7, 0.05, 'sine', 0.11);
    }
    if (p >= 100) {
      heldRef.current = false;
      setHeld(false);
      audio.roar(0.9);
      doneRef.current();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [audio]);

  const begin = useCallback((e) => {
    if (e && e.cancelable) e.preventDefault();
    if (heldRef.current) return;
    heldRef.current = true;
    setHeld(true);
    startRef.current = performance.now();
    beepRef.current = 0;
    audio.unlock();
    audio.grumble();
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [audio, tick]);

  const end = useCallback(() => {
    if (!heldRef.current) return;
    heldRef.current = false;
    setHeld(false);
    cancelAnimationFrame(rafRef.current);
    setProg(0);
  }, []);

  useGlobalRelease(end);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const tapScan = () => {
    audio.blip(400 + taps * 160, 0.09);
    const nt = taps + 1;
    setTaps(nt);
    setProg((nt / 5) * 100);
    if (nt >= 5) { audio.roar(0.9); doneRef.current(); }
  };

  return (
    <div className="w-full max-w-xs mt-5">
      <div className="h-6 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(0,0,0,0.4)', border: '3px solid #fff' }}>
        <div style={{ width: `${prog}%`, height: '100%', background: `linear-gradient(90deg, ${C.cyan}, ${C.lime}, ${C.gold})` }} />
      </div>

      <div
        onPointerDown={begin}
        onTouchStart={begin}
        onMouseDown={begin}
        className="rounded-full flex items-center justify-center mx-auto"
        style={{
          width: 200, height: 200,
          background: held ? `radial-gradient(circle, ${C.cyan}, #0891b2)` : 'rgba(34,211,238,0.14)',
          border: `6px solid ${C.cyan}`,
          boxShadow: held ? `0 0 60px ${C.cyan}` : '0 0 18px rgba(34,211,238,0.4)',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          cursor: 'pointer',
        }}
      >
        <div className="flex flex-col items-center pointer-events-none" style={{ transform: held ? 'scale(0.92)' : 'scale(1)', transition: 'transform 140ms' }}>
          <div style={{ fontSize: 54 }}>🤖</div>
          <div className="font-black mt-1" style={{ color: held ? '#00212b' : C.cyan }}>{held ? 'SCANNING…' : 'HOLD ME'}</div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Keep your finger down until the bar fills up
      </p>

      {showFallback && (
        <button
          onClick={tapScan}
          className="mt-3 w-full py-3 rounded-2xl font-black"
          style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', border: `2px solid ${C.cyan}` }}
        >
          Holding not working? TAP HERE 5 times ({taps}/5)
        </button>
      )}
    </div>
  );
}

function SealPads({ audio, onBroken }) {
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [prog, setProg] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const aRef = useRef(false); const bRef = useRef(false);
  const startRef = useRef(0); const rafRef = useRef(0);
  const doneRef = useRef(onBroken);
  useEffect(() => { doneRef.current = onBroken; }, [onBroken]);

  useEffect(() => {
    const t = setTimeout(() => setShowFallback(true), 12000);
    return () => clearTimeout(t);
  }, []);

  const tick = useCallback(() => {
    if (!(aRef.current && bRef.current)) { setProg(0); return; }
    const p = Math.min(100, ((performance.now() - startRef.current) / 3000) * 100);
    setProg(p);
    if (p >= 100) {
      aRef.current = false; bRef.current = false;
      setA(false); setB(false);
      audio.roar(1.2);
      doneRef.current();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [audio]);

  const sync = useCallback(() => {
    if (aRef.current && bRef.current) {
      startRef.current = performance.now();
      cancelAnimationFrame(rafRef.current);
      audio.unlock();
      audio.grumble();
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
      setProg(0);
    }
  }, [audio, tick]);

  const press = (which) => (e) => {
    if (e && e.cancelable) e.preventDefault();
    if (which === 'a') { if (aRef.current) return; aRef.current = true; setA(true); }
    else { if (bRef.current) return; bRef.current = true; setB(true); }
    sync();
  };

  const release = useCallback(() => {
    if (!aRef.current && !bRef.current) return;
    aRef.current = false; bRef.current = false;
    setA(false); setB(false);
    cancelAnimationFrame(rafRef.current);
    setProg(0);
  }, []);

  useGlobalRelease(release);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const pad = (label, sub, color, active, onDown) => (
    <div
      onPointerDown={onDown}
      onTouchStart={onDown}
      onMouseDown={onDown}
      className="flex-1 rounded-3xl flex flex-col items-center justify-center"
      style={{
        background: active ? color : 'rgba(255,255,255,0.10)',
        border: `4px solid ${color}`,
        boxShadow: active ? `0 0 34px ${color}` : 'none',
        minHeight: 140,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        cursor: 'pointer',
      }}
    >
      <div className="pointer-events-none flex flex-col items-center" style={{ transform: active ? 'scale(0.94)' : 'scale(1)', transition: 'transform 120ms' }}>
        <div style={{ fontSize: 44 }}>{label}</div>
        <div className="font-black text-sm mt-1" style={{ color: active ? '#1a0b2e' : color, letterSpacing: 1 }}>{sub}</div>
      </div>
    </div>
  );

  return (
    <>
      <div className="my-4 h-7 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.45)', border: '3px solid #fff' }}>
        <div style={{ width: `${prog}%`, height: '100%', background: `linear-gradient(90deg,${C.ember},${C.gold},${C.flame})` }} />
      </div>
      <div className="flex gap-3 flex-1">
        {pad('🔥', 'EVAN', C.ember, a, press('a'))}
        {pad('🤖', 'SAWYER', C.cyan, b, press('b'))}
      </div>
      <p className="text-center text-xs font-bold mt-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {a && b ? 'HOLD IT… THE SEAL IS CRACKING!' : 'Both pads must glow at the same time!'}
      </p>
      {showFallback && (
        <button
          onClick={() => { audio.roar(1.2); doneRef.current(); }}
          className="mt-2 w-full py-3 rounded-2xl font-black"
          style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', border: `2px solid ${C.gold}` }}
        >
          Stuck? Tap to smash the seal
        </button>
      )}
    </>
  );
}

/* ---------------- CONFETTI ---------------- */

function Confetti({ run }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!run) return;
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      cv.width = cv.offsetWidth * dpr; cv.height = cv.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const cols = ['#ff6b35', '#ffc94a', '#ff2e63', '#22d3ee', '#a3e635', '#ffffff'];
    const P = [];
    for (let i = 0; i < 150; i++) {
      P.push({
        x: Math.random() * cv.offsetWidth,
        y: -Math.random() * cv.offsetHeight,
        vx: (Math.random() - 0.5) * 2.4,
        vy: 1.6 + Math.random() * 3.4,
        s: 5 + Math.random() * 8,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        c: cols[(Math.random() * cols.length) | 0],
      });
    }
    let raf;
    const loop = () => {
      ctx.clearRect(0, 0, cv.offsetWidth, cv.offsetHeight);
      P.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.r += p.vr;
        if (p.y > cv.offsetHeight + 20) { p.y = -20; p.x = Math.random() * cv.offsetWidth; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      });
      raf = requestAnimationFrame(loop);
    };
    loop();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [run]);
  if (!run) return null;
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 w-full h-full z-40" />;
}

/* ---------------- ROOM ICONS ---------------- */

function RoomIcon({ type, cx, cy }) {
  const s = { fill: 'none', stroke: '#4b2e10', strokeWidth: 3.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (type) {
    case 'shelves':
      return (
        <g opacity="0.75">
          <rect x={cx - 26} y={cy - 24} width="52" height="48" rx="3" {...s} />
          <line x1={cx - 26} y1={cy - 8} x2={cx + 26} y2={cy - 8} {...s} />
          <line x1={cx - 26} y1={cy + 8} x2={cx + 26} y2={cy + 8} {...s} />
          <circle cx={cx - 12} cy={cy - 16} r="4" {...s} />
          <circle cx={cx + 6} cy={cy} r="4" {...s} />
        </g>
      );
    case 'kitchen':
      return (
        <g opacity="0.75">
          <rect x={cx - 26} y={cy - 22} width="52" height="44" rx="4" {...s} />
          <circle cx={cx - 13} cy={cy - 9} r="6" {...s} />
          <circle cx={cx + 12} cy={cy - 9} r="6" {...s} />
          <circle cx={cx - 13} cy={cy + 11} r="6" {...s} />
          <circle cx={cx + 12} cy={cy + 11} r="6" {...s} />
        </g>
      );
    case 'washer':
      return (
        <g opacity="0.75">
          <rect x={cx - 24} y={cy - 26} width="48" height="52" rx="5" {...s} />
          <circle cx={cx} cy={cy + 4} r="15" {...s} />
          <circle cx={cx - 15} cy={cy - 17} r="3" {...s} />
        </g>
      );
    case 'desk':
      return (
        <g opacity="0.75">
          <rect x={cx - 28} y={cy - 6} width="56" height="8" rx="2" {...s} />
          <line x1={cx - 22} y1={cy + 2} x2={cx - 22} y2={cy + 24} {...s} />
          <line x1={cx + 22} y1={cy + 2} x2={cx + 22} y2={cy + 24} {...s} />
          <rect x={cx - 14} y={cy - 26} width="28" height="18" rx="2" {...s} />
        </g>
      );
    case 'sofa':
      return (
        <g opacity="0.7">
          <rect x={cx - 30} y={cy - 8} width="60" height="24" rx="6" {...s} />
          <rect x={cx - 30} y={cy - 22} width="12" height="18" rx="4" {...s} />
          <rect x={cx + 18} y={cy - 22} width="12" height="18" rx="4" {...s} />
        </g>
      );
    case 'tv':
      return (
        <g opacity="0.78">
          <rect x={cx - 34} y={cy - 30} width="68" height="40" rx="4" {...s} />
          <line x1={cx} y1={cy + 10} x2={cx} y2={cy + 18} {...s} />
          <line x1={cx - 14} y1={cy + 18} x2={cx + 14} y2={cy + 18} {...s} />
          <rect x={cx - 26} y={cy + 26} width="52" height="16" rx="5" {...s} />
        </g>
      );
    case 'bed':
      return (
        <g opacity="0.7">
          <rect x={cx - 28} y={cy - 18} width="56" height="38" rx="5" {...s} />
          <rect x={cx - 28} y={cy - 18} width="56" height="14" rx="4" {...s} />
        </g>
      );
    case 'car':
      return (
        <g opacity="0.8">
          <path d={`M ${cx - 38} ${cy + 6} l 8 -18 h 60 l 8 18 z`} {...s} />
          <circle cx={cx - 22} cy={cy + 12} r="8" {...s} />
          <circle cx={cx + 22} cy={cy + 12} r="8" {...s} />
          <line x1={cx - 14} y1={cy - 12} x2={cx - 14} y2={cy + 4} {...s} />
          <line x1={cx + 14} y1={cy - 12} x2={cx + 14} y2={cy + 4} {...s} />
        </g>
      );
    default:
      return null;
  }
}

/* ---------------- FLOOR MAP ---------------- */

function FloorMap({ floor, targetRoom, showArrow, onPick, wrongId }) {
  const rooms = floor === 'up' ? ROOMS_UP : ROOMS_DOWN;
  const centre = (r) => (r.poly ? { x: r.cx, y: r.cy } : { x: r.x + r.w / 2, y: r.y + r.h / 2 });

  return (
    <svg viewBox="0 0 600 900" className="w-full h-full" style={{ touchAction: 'manipulation' }}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M 26 0 L 0 0 0 26" fill="none" stroke="rgba(80,45,10,0.10)" strokeWidth="1.5" />
        </pattern>
      </defs>

      <rect x="0" y="0" width="600" height="900" fill={C.parch} rx="18" />
      <rect x="0" y="0" width="600" height="900" fill="url(#grid)" rx="18" />

      {rooms.map((r) => {
        const isTarget = r.id === targetRoom;
        const isWrong = r.id === wrongId;
        const c = centre(r);
        const lx = r.lx != null ? r.lx : c.x;
        const ly = r.ly != null ? r.ly : c.y;
        const common = {
          fill: r.fill,
          opacity: isTarget ? 1 : 0.42,
          stroke: isTarget ? C.ember : '#7c5b34',
          strokeWidth: isTarget ? 8 : 3.5,
          filter: isTarget ? 'url(#glow)' : undefined,
          style: { cursor: 'pointer', transition: 'opacity 250ms' },
          onClick: () => onPick(r.id),
        };
        return (
          <g key={r.id} className={isWrong ? 'shake' : ''}>
            {r.poly
              ? <polygon points={r.poly} {...common} />
              : <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="7" {...common} />}
            {r.icon && <RoomIcon type={r.icon} cx={lx} cy={ly + (r.id === 'living' ? 0 : 26)} />}
            {r.name && r.name.split('\n').map((line, i, arr) => (
              <text
                key={i}
                x={lx}
                y={ly - (r.id === 'living' ? 46 : 22) + i * 22 - (arr.length - 1) * 8}
                textAnchor="middle"
                fontSize={r.id === 'garage' ? 30 : 21}
                fontWeight="900"
                fill={isTarget ? '#5b1a00' : '#6b4a28'}
                style={{ letterSpacing: '0.5px' }}
              >
                {line}
              </text>
            ))}
            {isTarget && (
              <g>
                <circle cx={lx} cy={ly + (r.id === 'living' ? 40 : 70)} r="26" fill={C.flame} className="pulse" />
                <text x={lx} y={ly + (r.id === 'living' ? 51 : 81)} textAnchor="middle" fontSize="34" fontWeight="900" fill="#fff">?</text>
              </g>
            )}
          </g>
        );
      })}

      {/* stairs */}
      {floor === 'up' ? (
        <g>
          <rect x="215" y="612" width="104" height="100" rx="6" fill="#e9d5ff" stroke="#7c5b34" strokeWidth="3" opacity="0.9" />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1="219" y1={630 + i * 22} x2="315" y2={630 + i * 22} stroke="#7c5b34" strokeWidth="3" />
          ))}
          <text x="267" y="600" textAnchor="middle" fontSize="18" fontWeight="900" fill="#6b4a28">STAIRS ↓</text>
        </g>
      ) : (
        <g>
          <rect x="392" y="418" width="70" height="90" rx="6" fill="#e9d5ff" stroke="#7c5b34" strokeWidth="3" opacity="0.9" />
          {[0, 1, 2].map((i) => (
            <line key={i} x1="396" y1={440 + i * 24} x2="458" y2={440 + i * 24} stroke="#7c5b34" strokeWidth="3" />
          ))}
          <text x="427" y="536" textAnchor="middle" fontSize="17" fontWeight="900" fill="#6b4a28">STAIRS ↑</text>
        </g>
      )}

      {/* garage door */}
      {floor === 'down' && (
        <g>
          <rect x="288" y="438" width="14" height="50" fill={C.ember} rx="3" />
          <text x="262" y="425" textAnchor="middle" fontSize="16" fontWeight="900" fill="#5b1a00">DOOR</text>
        </g>
      )}

      {showArrow && targetRoom && (() => {
        const r = rooms.find((x) => x.id === targetRoom);
        if (!r) return null;
        const c = centre(r);
        const ax = r.lx != null ? r.lx : c.x;
        const ay = r.ly != null ? r.ly : c.y;
        return (
          <g className="bounce">
            <path
              d={`M ${ax} ${ay - 118} l 26 -34 h -14 v -44 h -24 v 44 h -14 z`}
              fill={C.flame}
              stroke="#fff"
              strokeWidth="4"
              transform={`rotate(180 ${ax} ${ay - 150})`}
            />
          </g>
        );
      })()}
    </svg>
  );
}

/* ---------------- BATTLE ---------------- */

function Battle({ audio, onDone }) {
  const cvRef = useRef(null);
  const [phase, setPhase] = useState('intro');
  const [heroHP, setHeroHP] = useState(100);
  const [foeHP, setFoeHP] = useState(100);
  const [power, setPower] = useState(0);
  const st = useRef({ t: 0, hero: 100, foe: 100, power: 0, phase: 'intro', shake: 0, sparks: [], flash: 0, nextClash: 1.6 });
  const doneRef = useRef(onDone);
  useEffect(() => { doneRef.current = onDone; }, [onDone]);

  const mash = useCallback((e) => {
    if (e && e.cancelable) e.preventDefault();
    if (st.current.phase !== 'mash') return;
    st.current.power = Math.min(100, st.current.power + 5);
    audio.blip(400 + Math.random() * 500, 0.05, 'square', 0.12);
  }, [audio]);

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      cv.width = cv.offsetWidth * dpr; cv.height = cv.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    audio.spinUp(1.6);

    let raf, last = performance.now();
    const S = st.current;

    const drawBey = (x, y, r, ang, c1, c2, glow) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.shadowColor = glow; ctx.shadowBlur = 26;
      ctx.beginPath();
      const teeth = 8;
      for (let i = 0; i < teeth * 2; i++) {
        const rad = i % 2 === 0 ? r : r * 0.66;
        const a = (i / (teeth * 2)) * Math.PI * 2;
        ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.restore();
    };

    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      S.t += dt;
      const W = cv.offsetWidth, H = cv.offsetHeight;
      const cx = W / 2, cy = H / 2;

      if (S.phase === 'intro' && S.t > 2.2) { S.phase = 'clash'; setPhase('clash'); S.t = 0; }
      if (S.phase === 'clash') {
        S.nextClash -= dt;
        if (S.nextClash <= 0) {
          S.nextClash = 1.5;
          audio.clash(); S.shake = 14; S.flash = 0.5;
          for (let i = 0; i < 26; i++) {
            S.sparks.push({ x: cx, y: cy, vx: (Math.random() - 0.5) * 460, vy: (Math.random() - 0.5) * 460, life: 0.6, c: Math.random() > 0.5 ? '#ffc94a' : '#a78bfa' });
          }
          S.hero = Math.max(32, S.hero - 24); setHeroHP(S.hero);
          S.foe = Math.max(72, S.foe - 9); setFoeHP(S.foe);
        }
        if (S.hero <= 32) { S.phase = 'mash'; setPhase('mash'); S.t = 0; audio.roar(1.3); }
      }
      if (S.phase === 'mash') {
        S.power = Math.min(100, S.power + dt * 9);
        setPower(S.power);
        if (S.power >= 100) { S.phase = 'finish'; setPhase('finish'); S.t = 0; audio.spinUp(1.1); }
      }
      if (S.phase === 'finish') {
        S.foe = Math.max(0, S.foe - dt * 90); setFoeHP(S.foe);
        S.hero = Math.min(100, S.hero + dt * 60); setHeroHP(S.hero);
        if (S.t > 0.4 && S.t < 0.5) { audio.clash(); S.flash = 1; S.shake = 26; }
        if (S.foe <= 0) {
          S.phase = 'win'; setPhase('win'); S.t = 0;
          audio.fanfare(); audio.roar(1.4);
          setTimeout(() => doneRef.current(), 2600);
        }
      }

      ctx.clearRect(0, 0, W, H);
      const sh = S.shake > 0 ? S.shake : 0;
      S.shake = Math.max(0, S.shake - dt * 55);
      ctx.save();
      ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);

      const R = Math.min(W, H) * 0.42;
      const bowl = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
      bowl.addColorStop(0, '#3b1a63'); bowl.addColorStop(0.7, '#1d0b38'); bowl.addColorStop(1, '#0e0520');
      ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.86, 0, 0, Math.PI * 2);
      ctx.fillStyle = bowl; ctx.fill();
      ctx.lineWidth = 8; ctx.strokeStyle = '#ffc94a'; ctx.shadowColor = '#ffc94a'; ctx.shadowBlur = 22; ctx.stroke();
      ctx.shadowBlur = 0;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath(); ctx.ellipse(cx, cy, R * (1 - i * 0.22), R * 0.86 * (1 - i * 0.22), 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,201,74,0.16)'; ctx.lineWidth = 2; ctx.stroke();
      }

      const orbit = S.phase === 'intro' ? R * 0.72 : S.phase === 'win' ? R * 0.3 : R * (0.24 + Math.abs(Math.sin(S.t * 2.1)) * 0.34);
      const a1 = S.t * 2.6, a2 = S.t * 2.6 + Math.PI;
      const hx = cx + Math.cos(a1) * orbit, hy = cy + Math.sin(a1) * orbit * 0.86;
      const fx = cx + Math.cos(a2) * orbit, fy = cy + Math.sin(a2) * orbit * 0.86;

      const heroR = 30 + (S.phase === 'finish' || S.phase === 'win' ? 16 : 0) + (S.power / 100) * 8;
      if (S.phase !== 'win' || S.t < 0.5) {
        drawBey(fx, fy, 30, -S.t * 26, '#c084fc', '#4c1d95', '#a855f7');
      } else {
        ctx.save(); ctx.globalAlpha = 0.4;
        drawBey(fx, fy + 30, 26, -S.t * 3, '#6b7280', '#1f2937', '#374151');
        ctx.restore();
      }
      drawBey(hx, hy, heroR, S.t * 30, '#fff1c9', '#ff3d00', '#ff6b35');

      S.sparks = S.sparks.filter((p) => p.life > 0);
      S.sparks.forEach((p) => {
        p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 380 * dt;
        ctx.globalAlpha = Math.max(0, p.life / 0.6);
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, 5, 5);
        ctx.globalAlpha = 1;
      });

      if (S.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${S.flash})`;
        ctx.fillRect(0, 0, W, H);
        S.flash = Math.max(0, S.flash - dt * 2.4);
      }
      ctx.restore();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [audio]);

  const bar = (v, c) => (
    <div className="h-4 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.45)', border: '2px solid rgba(255,255,255,0.35)' }}>
      <div style={{ width: `${v}%`, height: '100%', background: c }} />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-2 pb-1">
        <div className="flex justify-between text-xs font-black mb-1" style={{ color: C.gold }}>
          <span>🔥 DRAGON BEY (EVAN + SAWYER)</span><span>{Math.round(heroHP)}</span>
        </div>
        {bar(heroHP, 'linear-gradient(90deg,#ffc94a,#ff3d00)')}
        <div className="flex justify-between text-xs font-black mt-2 mb-1" style={{ color: '#c084fc' }}>
          <span>🐲 SHADOW WYRM</span><span>{Math.round(foeHP)}</span>
        </div>
        {bar(foeHP, 'linear-gradient(90deg,#c084fc,#4c1d95)')}
      </div>

      <div className="flex-1 relative min-h-0">
        <canvas ref={cvRef} className="w-full h-full" />
        {phase === 'intro' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-3xl font-black px-6 py-3 rounded-2xl" style={{ background: 'rgba(0,0,0,0.6)', color: C.gold }}>3… 2… 1… LET IT RIP!</div>
          </div>
        )}
        {phase === 'clash' && (
          <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
            <div className="inline-block text-lg font-black px-4 py-2 rounded-xl" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
              The Shadow Wyrm is winning!
            </div>
          </div>
        )}
      </div>

      {phase === 'mash' && (
        <div className="px-3 pb-3">
          <div className="text-center font-black text-lg mb-2" style={{ color: C.flame }}>SMASH YOUR BUTTONS TOGETHER!</div>
          <div className="h-5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(0,0,0,0.5)', border: '2px solid #fff' }}>
            <div style={{ width: `${power}%`, height: '100%', background: 'linear-gradient(90deg,#a3e635,#ffc94a,#ff2e63)' }} />
          </div>
          <div className="flex gap-3">
            <button onPointerDown={mash} onTouchStart={mash} className="flex-1 rounded-2xl font-black text-xl py-5"
              style={{ background: C.ember, color: '#2b0a00', border: '4px solid #fff', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              EVAN 🔥
            </button>
            <button onPointerDown={mash} onTouchStart={mash} className="flex-1 rounded-2xl font-black text-xl py-5"
              style={{ background: C.cyan, color: '#00212b', border: '4px solid #fff', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              SAWYER 🤖
            </button>
          </div>
        </div>
      )}
      {phase === 'finish' && (
        <div className="text-center font-black text-2xl py-6" style={{ color: C.gold }}>DRAGON STRIKE!!!</div>
      )}
      {phase === 'win' && (
        <div className="text-center font-black text-2xl py-6" style={{ color: C.lime }}>THE SHADOW WYRM IS BEATEN!</div>
      )}
    </div>
  );
}

/* ---------------- DRAGON NARRATOR ---------------- */

const SCRIPT = [
  "RRRAAAWWR! I am Ignis, guardian of the Dragon Beyblade.",
  "A Shadow Wyrm smashed my Beyblade into FIVE PARTS and hid them in YOUR house!",
  "Evan — you are the Blader. Read my map, tap the glowing room, then RUN there!",
  "Sawyer — you are the Radar Tech. HOLD the radar button to sniff out the exact hiding spot!",
  "Every part is hidden inside a treasure. When you find it, BOTH of you hold the Dragon Seal together.",
  "Find all five parts... then meet me in the GARAGE for the final battle. GO!",
];

function Narrator({ audio, voiceOn, onFinish }) {
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

  useEffect(() => { type(SCRIPT[0]); return () => clearInterval(typingRef.current); }, [type]);

  const typing = shown.length < SCRIPT[i].length;

  const next = () => {
    if (typing) { clearInterval(typingRef.current); setShown(SCRIPT[i]); return; }
    if (i < SCRIPT.length - 1) {
      const ni = i + 1;
      speakLine(SCRIPT[ni], voiceOn);   /* fired inside the tap — required by Android */
      audio.grumble();
      setI(ni);
      type(SCRIPT[ni]);
    } else {
      stopSpeaking(); audio.roar(1.2); onFinish();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
      <Dragon speaking={typing} fire={i === SCRIPT.length - 1} size={165} />
      <div
        className="mt-4 w-full max-w-sm rounded-3xl px-5 py-4"
        style={{ background: 'rgba(255,255,255,0.10)', border: `3px solid ${C.gold}`, minHeight: 130 }}
      >
        <div className="text-xs font-black mb-1" style={{ color: C.gold, letterSpacing: 2 }}>IGNIS THE DRAGON</div>
        <div className="font-bold text-white text-lg leading-snug">{shown}<span style={{ opacity: typing ? 1 : 0 }}>▌</span></div>
      </div>

      <div className="flex gap-2 mt-1">
        {SCRIPT.map((_, k) => (
          <div key={k} className="w-2 h-2 rounded-full mt-3" style={{ background: k <= i ? C.gold : 'rgba(255,255,255,0.25)' }} />
        ))}
      </div>

      <button
        onClick={next}
        className="mt-5 px-10 py-4 rounded-full font-black text-xl glowy"
        style={{ background: `linear-gradient(180deg, ${C.gold}, ${C.ember})`, color: '#3b0d00', border: '5px solid #fff' }}
      >
        {typing ? 'SKIP ⏩' : (i === SCRIPT.length - 1 ? 'START THE HUNT 🔥' : 'NEXT ▶')}
      </button>

      <button
        onClick={() => { stopSpeaking(); onFinish(); }}
        className="mt-3 text-xs font-bold"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        skip the whole intro
      </button>
    </div>
  );
}

/* ---------------- PARENT PANEL ---------------- */

function ParentPanel({ onClose, onJump, voiceOn, setVoiceOn, voiceCount }) {
  const [tested, setTested] = useState(null);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-2xl p-4 overflow-auto" style={{ background: '#fff', maxHeight: '85%' }}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-black text-lg" style={{ color: C.ink }}>Hide list (parent)</h3>
          <button onClick={onClose} className="px-3 py-1 rounded-lg font-black" style={{ background: '#eee' }}>✕</button>
        </div>
        <div className="mb-3 p-3 rounded-xl" style={{ background: '#f6f2ea' }}>
          <div className="text-xs font-black mb-2" style={{ color: C.ink }}>
            Voices found on this phone: {voiceCount < 0 ? 'speech not supported' : voiceCount}
          </div>
          <button
            onClick={() => { const ok = speakLine('Rawr! I am Ignis, guardian of the Dragon Beyblade.', true); setTested(ok ? 'sent' : 'failed'); }}
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
            onClick={() => { setVoiceOn(!voiceOn); stopSpeaking(); }}
            className="w-full py-2 rounded-xl font-black text-sm"
            style={{ background: voiceOn ? C.lime : '#ddd', color: C.ink }}
          >
            Dragon voice: {voiceOn ? 'ON' : 'OFF'}
          </button>
        </div>
        {STAGES.map((s, i) => (
          <div key={s.n} className="mb-3 p-3 rounded-xl" style={{ background: '#f6f2ea' }}>
            <div className="font-black text-sm" style={{ color: C.ember }}>{s.n}. {s.roomName}</div>
            <div className="text-sm font-bold" style={{ color: C.ink }}>{s.gift}</div>
            <div className="text-xs" style={{ color: '#6b5a45' }}>{s.spot}</div>
            <button onClick={() => onJump(i)} className="mt-2 text-xs font-black px-3 py-1 rounded-lg" style={{ background: C.gold, color: C.ink }}>
              Jump to this stage
            </button>
          </div>
        ))}
        <p className="text-xs" style={{ color: '#6b5a45' }}>Tap the 🐉 header 4 times to open this again.</p>
      </div>
    </div>
  );
}

/* ---------------- MAIN APP ---------------- */

export default function App() {
  const audio = useAudio();
  const [screen, setScreen] = useState('title');
  const [stageIdx, setStageIdx] = useState(0);
  const [step, setStep] = useState('navigate');
  const [floor, setFloor] = useState('up');
  const [wrongId, setWrongId] = useState(null);
  const [showArrow, setShowArrow] = useState(false);
  const [parts, setParts] = useState([]);
  const [parent, setParent] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const voiceCount = useVoiceStatus();
  const tapRef = useRef(0);

  const stage = STAGES[stageIdx];

  useEffect(() => {
    if (screen !== 'hunt' || step !== 'navigate') { setShowArrow(false); return; }
    setShowArrow(false);
    const id = setTimeout(() => setShowArrow(true), 60000);
    return () => clearTimeout(id);
  }, [screen, step, stageIdx]);

  useEffect(() => () => stopSpeaking(), []);

  const pickRoom = (id) => {
    if (step !== 'navigate') return;
    if (id === stage.roomId) {
      audio.blip(900, 0.12, 'square', 0.2);
      setTimeout(() => audio.blip(1300, 0.16, 'square', 0.2), 110);
      setWrongId(null);
      speakLine(`Yes! Run to ${stage.roomName}!`, voiceOn);
      setStep('radar');
    } else {
      audio.grumble();
      setWrongId(id);
      setTimeout(() => setWrongId(null), 500);
    }
  };

  const onFound = useCallback(() => {
    speakLine(stage.spot, voiceOn);
    setStep('grab');
  }, [stage, voiceOn]);

  const onSealBroken = useCallback(() => {
    setParts((p) => [...p, stage.part]);
    setStep('reward');
  }, [stage]);

  const nextStage = () => {
    stopSpeaking();
    if (stageIdx === STAGES.length - 1) {
      setScreen('battle');
    } else {
      const ni = stageIdx + 1;
      setStageIdx(ni);
      setFloor(STAGES[ni].floor);
      setStep('navigate');
      audio.spinUp(0.8);
    }
  };

  const titleTap = () => {
    tapRef.current += 1;
    if (tapRef.current >= 4) { tapRef.current = 0; setParent(true); }
    setTimeout(() => { tapRef.current = 0; }, 1600);
  };

  const styleTag = (
    <style>{`
      @keyframes pulseA { 0%,100%{ transform:scale(1); opacity:1 } 50%{ transform:scale(1.22); opacity:0.75 } }
      .pulse { animation: pulseA 1s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
      @keyframes bounceA { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-16px) } }
      .bounce { animation: bounceA 0.7s ease-in-out infinite; }
      @keyframes shakeA { 0%,100%{ transform:translateX(0) } 25%{ transform:translateX(-7px) } 75%{ transform:translateX(7px) } }
      .shake { animation: shakeA 0.16s 3; }
      @keyframes floatA { 0%,100%{ transform: translateY(0) rotate(-2deg) } 50%{ transform: translateY(-10px) rotate(2deg) } }
      .floaty { animation: floatA 2.6s ease-in-out infinite; }
      @keyframes popA { 0%{ transform:scale(0) rotate(-25deg); opacity:0 } 70%{ transform:scale(1.18) rotate(6deg) } 100%{ transform:scale(1) rotate(0); opacity:1 } }
      .pop { animation: popA 480ms cubic-bezier(.3,1.5,.5,1) both; }
      @keyframes glowA { 0%,100%{ box-shadow:0 0 14px rgba(255,107,53,.55) } 50%{ box-shadow:0 0 38px rgba(255,107,53,.95) } }
      .glowy { animation: glowA 1.4s ease-in-out infinite; }
      @keyframes bobA { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-9px) } }
      .dragon-bob { animation: bobA 2.4s ease-in-out infinite; }
      @keyframes flapL { 0%,100%{ transform: rotate(0deg) } 50%{ transform: rotate(-16deg) } }
      @keyframes flapR { 0%,100%{ transform: rotate(0deg) } 50%{ transform: rotate(16deg) } }
      .wing-l { animation: flapL 1.1s ease-in-out infinite; transform-origin: 76px 122px; }
      .wing-r { animation: flapR 1.1s ease-in-out infinite; transform-origin: 144px 122px; }
      @keyframes blinkA { 0%,92%,100%{ transform: scaleY(1) } 96%{ transform: scaleY(0.08) } }
      .dragon-blink { animation: blinkA 4.5s ease-in-out infinite; transform-origin: 110px 70px; }
      @keyframes jawA { 0%,100%{ transform: scaleY(0.4) } 50%{ transform: scaleY(1.5) } }
      .dragon-jaw { animation: jawA 0.24s ease-in-out infinite; }
      @keyframes tailA { 0%,100%{ transform: rotate(0deg) } 50%{ transform: rotate(9deg) } }
      .dragon-tail { animation: tailA 3.1s ease-in-out infinite; }
      @keyframes flameA { 0%,52%{ transform: scaleY(0.04) scaleX(0.5); opacity:0 } 60%{ transform: scaleY(1.08) scaleX(1.05); opacity:1 } 72%{ transform: scaleY(0.92) scaleX(0.95); opacity:1 } 84%{ transform: scaleY(1.04) scaleX(1.02); opacity:0.95 } 100%{ transform: scaleY(0.04) scaleX(0.5); opacity:0 } }
      .flame-a { animation: flameA 3.6s ease-in-out infinite; }
      .flame-b { animation: flameA 3.6s ease-in-out infinite 0.06s; }
      .flame-c { animation: flameA 3.6s ease-in-out infinite 0.12s; }
      @keyframes emberA { 0%{ transform: translate(0,0) scale(1); opacity:0.9 } 100%{ transform: translate(-6px,-70px) scale(0.2); opacity:0 } }
      .ember-1 { animation: emberA 3.2s linear infinite; }
      .ember-2 { animation: emberA 3.8s linear infinite 0.7s; }
      .ember-3 { animation: emberA 2.9s linear infinite 1.4s; }
      .ember-4 { animation: emberA 4.1s linear infinite 2.1s; }
      @keyframes smokeA { 0%{ opacity:0.5; transform: translateY(0) scale(0.6) } 100%{ opacity:0; transform: translateY(-26px) scale(1.5) } }
      .dragon-smoke { animation: smokeA 1.6s ease-out infinite; }
      @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; } }
    `}</style>
  );

  const shell = (children) => (
    <div className="w-full h-full flex flex-col relative overflow-hidden"
      style={{ background: `radial-gradient(circle at 50% 0%, ${C.night2}, ${C.night} 70%)` }}>
      {styleTag}
      {children}
      {parent && (
        <ParentPanel
          onClose={() => setParent(false)}
          voiceOn={voiceOn}
          setVoiceOn={setVoiceOn}
          voiceCount={voiceCount}
          onJump={(i) => { setStageIdx(i); setFloor(STAGES[i].floor); setStep('navigate'); setScreen('hunt'); setParent(false); }}
        />
      )}
    </div>
  );

  /* ---------- TITLE ---------- */
  if (screen === 'title') {
    return shell(
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 20% 30%, #ff2e63 0%, transparent 40%), radial-gradient(circle at 80% 70%, #22d3ee 0%, transparent 40%)' }} />
        <div className="relative" onClick={titleTap}><Dragon speaking={false} fire size={150} /></div>
        <h1 className="font-black relative mt-2" style={{ fontSize: 46, lineHeight: 1, color: C.gold, textShadow: `0 0 22px ${C.ember}, 4px 4px 0 ${C.flame}`, letterSpacing: -1 }}>
          DRAGON<br />BEY HUNT
        </h1>
        <p className="mt-4 font-bold relative" style={{ color: C.cyan }}>
          🔥 EVAN — Blader &amp; Navigator<br />🤖 SAWYER — Dragon Radar Tech
        </p>
        <button
          onClick={() => {
            audio.unlock();
            audio.roar(1.2);
            speakLine(SCRIPT[0], voiceOn);   /* first speech must ride this tap */
            setScreen('brief');
          }}
          className="mt-7 px-10 py-5 rounded-full font-black text-2xl glowy relative"
          style={{ background: `linear-gradient(180deg, ${C.gold}, ${C.ember})`, color: '#3b0d00', border: '5px solid #fff' }}
        >
          WAKE THE DRAGON
        </button>
        <p className="mt-5 text-xs font-bold relative" style={{ color: 'rgba(255,255,255,0.45)' }}>Turn the volume UP 🔊</p>
      </div>
    );
  }

  /* ---------- NARRATOR ---------- */
  if (screen === 'brief') {
    return shell(<Narrator audio={audio} voiceOn={voiceOn} onFinish={() => setScreen('hunt')} />);
  }

  /* ---------- BATTLE ---------- */
  if (screen === 'battle') {
    return shell(
      <>
        <div className="px-4 pt-3 text-center">
          <h2 className="font-black text-2xl" style={{ color: C.gold, textShadow: `0 0 16px ${C.ember}` }}>FINAL BATTLE</h2>
          <p className="text-xs font-bold text-white opacity-70">All 5 parts assembled. Let it rip.</p>
        </div>
        <div className="flex-1 min-h-0">
          <Battle audio={audio} onDone={() => setScreen('victory')} />
        </div>
      </>
    );
  }

  /* ---------- VICTORY ---------- */
  if (screen === 'victory') {
    return shell(
      <div className="flex-1 relative flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <Confetti run />
        <div className="text-7xl floaty relative">🏆</div>
        <h1 className="font-black mt-3 relative" style={{ fontSize: 38, color: C.gold, textShadow: `0 0 22px ${C.ember}, 3px 3px 0 ${C.flame}` }}>
          HAPPY BIRTHDAY<br />EVAN!
        </h1>
        <p className="mt-3 font-bold text-white relative">You beat the Shadow Wyrm.<br />The Dragon Beyblade is yours.</p>
        <div className="flex flex-wrap justify-center gap-2 mt-4 relative">
          {parts.map((p, i) => (
            <div key={i} className="px-3 py-2 rounded-xl font-black text-xs" style={{ background: p.color, color: '#1a0b2e' }}>
              {p.emoji} {p.name}
            </div>
          ))}
        </div>
        <p className="mt-4 font-black relative" style={{ color: C.cyan }}>Great radar work, Sawyer 🤖</p>
        <button
          onClick={() => { setScreen('title'); setStageIdx(0); setParts([]); setStep('navigate'); setFloor('up'); }}
          className="mt-6 px-8 py-3 rounded-full font-black relative"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)' }}
        >
          Play again
        </button>
      </div>
    );
  }

  /* ---------- HUNT ---------- */
  const wrongFloor = floor !== stage.floor;

  return shell(
    <>
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="font-black text-lg" style={{ color: C.gold }} onClick={titleTap}>🐉 PART {stage.n} / 5</div>
          <div className="flex gap-1">
            {STAGES.map((s, i) => (
              <div key={s.n} className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black"
                style={{
                  background: i < parts.length ? parts[i].color : 'rgba(255,255,255,0.12)',
                  color: i < parts.length ? '#1a0b2e' : 'rgba(255,255,255,0.4)',
                  border: i === stageIdx ? `2px solid ${C.gold}` : '2px solid transparent',
                }}>
                {i < parts.length ? parts[i].emoji : s.n}
              </div>
            ))}
          </div>
        </div>
      </div>

      {step === 'navigate' && (
        <>
          <div className="px-3 pb-2 flex items-center gap-2">
            <div style={{ flexShrink: 0 }}><Dragon speaking size={78} /></div>
            <div className="rounded-2xl px-3 py-2 font-bold text-white text-sm flex-1"
              style={{ background: 'rgba(255,255,255,0.10)', border: `2px solid ${C.ember}` }}>
              {stage.taunt}
            </div>
          </div>
          <div className="px-3 pb-2 flex gap-2">
            {['up', 'down'].map((f) => (
              <button key={f} onClick={() => { setFloor(f); audio.blip(600, 0.07); }}
                className="flex-1 py-2 rounded-xl font-black text-sm"
                style={{
                  background: floor === f ? C.gold : 'rgba(255,255,255,0.10)',
                  color: floor === f ? '#3b1f0b' : '#fff',
                  border: `2px solid ${floor === f ? '#fff' : 'rgba(255,255,255,0.2)'}`,
                }}>
                {f === 'up' ? '⬆️ UPSTAIRS' : '⬇️ DOWNSTAIRS'}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 px-2 pb-2">
            <div className="w-full h-full rounded-2xl overflow-hidden" style={{ border: `4px solid ${C.gold}` }}>
              <FloorMap
                floor={floor}
                targetRoom={wrongFloor ? null : stage.roomId}
                showArrow={showArrow && !wrongFloor}
                onPick={pickRoom}
                wrongId={wrongId}
              />
            </div>
          </div>
          <div className="px-3 pb-3 text-center font-black text-sm" style={{ color: wrongFloor ? C.flame : '#fff' }}>
            {wrongFloor
              ? (stage.floor === 'down' ? '🐉 Go DOWNSTAIRS! Tap the downstairs button.' : '🐉 Go UPSTAIRS! Tap the upstairs button.')
              : 'EVAN: tap the glowing room, then RUN there!'}
          </div>
        </>
      )}

      {step === 'radar' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center overflow-auto">
          <h2 className="font-black text-2xl" style={{ color: C.cyan }}>SAWYER'S TURN</h2>
          <p className="font-bold text-white mt-2 text-sm">
            You're in <span style={{ color: C.gold }}>{stage.roomName}</span>.<br />
            Sawyer — hold the radar to sniff out the spot!
          </p>
          <RadarPad audio={audio} onFound={onFound} />
        </div>
      )}

      {step === 'grab' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-7xl pop">{stage.spotEmoji}</div>
          <h2 className="font-black text-xl mt-3" style={{ color: C.lime }}>RADAR LOCK!</h2>
          <div className="mt-3 px-5 py-4 rounded-3xl pop" style={{ background: `linear-gradient(180deg, ${C.gold}, ${C.ember})`, border: '5px solid #fff' }}>
            <div className="font-black text-xl" style={{ color: '#3b0d00' }}>{stage.spot}</div>
          </div>
          <p className="mt-4 font-bold text-white">GO! Grab the treasure!</p>
          <button
            onClick={() => { audio.blip(800, 0.14); setStep('seal'); }}
            className="mt-7 px-10 py-5 rounded-full font-black text-2xl glowy"
            style={{ background: `linear-gradient(180deg,${C.flame},#9d174d)`, color: '#fff', border: '5px solid #fff' }}
          >
            GOT IT! 🙌
          </button>
        </div>
      )}

      {step === 'seal' && (
        <div className="flex-1 flex flex-col px-4 pb-4">
          <div className="text-center">
            <div className="text-5xl floaty">🔒</div>
            <h2 className="font-black text-2xl" style={{ color: C.gold }}>DRAGON SEAL</h2>
            <p className="font-bold text-white text-sm mt-1">
              The Bey part is locked inside!<br />
              <span style={{ color: C.flame }}>BOTH of you hold your pad — at the same time!</span>
            </p>
          </div>
          <SealPads audio={audio} onBroken={onSealBroken} />
        </div>
      )}

      {step === 'reward' && (
        <div className="flex-1 relative flex flex-col items-center justify-center px-6 text-center overflow-hidden">
          <Confetti run />
          <div className="text-7xl pop relative">{stage.part.emoji}</div>
          <h2 className="font-black text-3xl mt-2 pop relative" style={{ color: stage.part.color, textShadow: '2px 2px 0 rgba(0,0,0,0.4)' }}>
            {stage.part.name}
          </h2>
          <p className="font-bold text-white mt-2 relative">RECLAIMED!</p>
          <div className="mt-4 px-5 py-4 rounded-3xl relative" style={{ background: 'rgba(255,255,255,0.12)', border: `3px solid ${C.gold}` }}>
            <div className="text-xs font-black" style={{ color: C.gold }}>THE DRAGON HID IT INSIDE…</div>
            <div className="font-black text-2xl text-white mt-1">{stage.gift}</div>
            <div className="text-3xl mt-1">🎁</div>
          </div>
          <div className="flex gap-2 mt-4 relative">
            {STAGES.map((s, i) => (
              <div key={s.n} className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: i < parts.length ? parts[i].color : 'rgba(255,255,255,0.12)' }}>
                {i < parts.length ? parts[i].emoji : '·'}
              </div>
            ))}
          </div>
          <button
            onClick={nextStage}
            className="mt-6 px-9 py-4 rounded-full font-black text-xl glowy relative"
            style={{ background: `linear-gradient(180deg,${C.lime},#3f6212)`, color: '#12240b', border: '5px solid #fff' }}
          >
            {stageIdx === STAGES.length - 1 ? 'ASSEMBLE THE DRAGON BEY ⚔️' : `HUNT PART ${stage.n + 1} →`}
          </button>
        </div>
      )}
    </>
  );
}
