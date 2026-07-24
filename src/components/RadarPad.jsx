import React, { useCallback, useEffect, useRef, useState } from 'react';
import useGlobalRelease from '../hooks/useGlobalRelease.js';
import { C } from '../theme.js';

const HOLD_MS = 2500;
const FALLBACK_MS = 9000;

/* Sawyer's job. Press is handled on the element (three ways, guarded by a
   ref so a double-fire is harmless); release is only ever detected on window.
   Progress is driven by rAF reading performance.now(), never by a useEffect
   that depends on changing values. The scale transform lives on an inner
   pointer-events:none element so the hit area never moves under the finger. */
export default function RadarPad({ audio, onFound }) {
  const [prog, setProg] = useState(0);
  const [held, setHeld] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [taps, setTaps] = useState(0);

  const heldRef = useRef(false);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const beepRef = useRef(0);
  const doneRef = useRef(onFound);

  useEffect(() => {
    doneRef.current = onFound;
  }, [onFound]);

  useEffect(() => {
    const t = setTimeout(() => setShowFallback(true), FALLBACK_MS);
    return () => clearTimeout(t);
  }, []);

  const tick = useCallback(() => {
    if (!heldRef.current) return;
    const p = Math.min(100, ((performance.now() - startRef.current) / HOLD_MS) * 100);
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

  const begin = useCallback(
    (e) => {
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
    },
    [audio, tick]
  );

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
    if (nt >= 5) {
      audio.roar(0.9);
      doneRef.current();
    }
  };

  return (
    <div className="w-full max-w-xs mt-5">
      <div
        className="h-6 rounded-full overflow-hidden mb-4"
        style={{ background: 'rgba(0,0,0,0.4)', border: '3px solid #fff' }}
      >
        <div
          style={{
            width: `${prog}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${C.cyan}, ${C.lime}, ${C.gold})`,
          }}
        />
      </div>

      <div
        onPointerDown={begin}
        onTouchStart={begin}
        onMouseDown={begin}
        className="rounded-full flex items-center justify-center mx-auto"
        style={{
          width: 200,
          height: 200,
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
        <div
          className="flex flex-col items-center pointer-events-none"
          style={{ transform: held ? 'scale(0.92)' : 'scale(1)', transition: 'transform 140ms' }}
        >
          <div style={{ fontSize: 54 }}>🤖</div>
          <div className="font-black mt-1" style={{ color: held ? '#00212b' : C.cyan }}>
            {held ? 'SCANNING…' : 'HOLD ME'}
          </div>
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
