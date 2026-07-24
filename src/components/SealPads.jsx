import React, { useCallback, useEffect, useRef, useState } from 'react';
import useGlobalRelease from '../hooks/useGlobalRelease.js';
import { C } from '../theme.js';

const HOLD_MS = 3000;
const FALLBACK_MS = 12000;

/* Two pads at opposite screen edges, held simultaneously for three seconds.
   Same rules as the radar: press on the element, release only on window,
   rAF-driven progress, transforms on an inner pointer-events:none layer.

   Note both pads sit inside one flex row and take a full half of the width
   each, so two thumbs never land on the same element. */
export default function SealPads({ audio, onBroken }) {
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [prog, setProg] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  const aRef = useRef(false);
  const bRef = useRef(false);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const doneRef = useRef(onBroken);

  useEffect(() => {
    doneRef.current = onBroken;
  }, [onBroken]);

  useEffect(() => {
    const t = setTimeout(() => setShowFallback(true), FALLBACK_MS);
    return () => clearTimeout(t);
  }, []);

  const tick = useCallback(() => {
    if (!(aRef.current && bRef.current)) {
      setProg(0);
      return;
    }
    const p = Math.min(100, ((performance.now() - startRef.current) / HOLD_MS) * 100);
    setProg(p);
    if (p >= 100) {
      aRef.current = false;
      bRef.current = false;
      setA(false);
      setB(false);
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
    if (which === 'a') {
      if (aRef.current) return;
      aRef.current = true;
      setA(true);
    } else {
      if (bRef.current) return;
      bRef.current = true;
      setB(true);
    }
    sync();
  };

  /* One window release drops both pads. Trying to track which finger lifted
     is where this got fragile last time; restarting the 3 seconds is cheap
     and the boys just press again. */
  const release = useCallback(() => {
    if (!aRef.current && !bRef.current) return;
    aRef.current = false;
    bRef.current = false;
    setA(false);
    setB(false);
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
      <div
        className="pointer-events-none flex flex-col items-center"
        style={{ transform: active ? 'scale(0.94)' : 'scale(1)', transition: 'transform 120ms' }}
      >
        <div style={{ fontSize: 44 }}>{label}</div>
        <div className="font-black text-sm mt-1" style={{ color: active ? '#1a0b2e' : color, letterSpacing: 1 }}>
          {sub}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className="my-4 h-7 rounded-full overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.45)', border: '3px solid #fff' }}
      >
        <div
          style={{
            width: `${prog}%`,
            height: '100%',
            background: `linear-gradient(90deg,${C.ember},${C.gold},${C.flame})`,
          }}
        />
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
          onClick={() => {
            audio.roar(1.2);
            doneRef.current();
          }}
          className="mt-2 w-full py-3 rounded-2xl font-black"
          style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', border: `2px solid ${C.gold}` }}
        >
          Stuck? Tap to smash the seal
        </button>
      )}
    </>
  );
}
