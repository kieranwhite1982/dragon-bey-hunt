import React, { useCallback, useEffect, useRef, useState } from 'react';
import useGlobalRelease from '../hooks/useGlobalRelease.js';
import { C } from '../theme.js';

const HOLD_MS = 2500;
const FALLBACK_MS = 9000;

/* A slip drains rather than resets, and slower than it fills, so a six-year-old
   who loses grip at 90% grabs it again and carries on instead of starting over.
   Kept well short of instant so it still reads as "don't let go". */
const DRAIN_MS = 4000;

/* What the radar says as it closes in. Visual first -- the ring, the sweep and
   the quickening beeps carry this for a kid who isn't reading fast yet -- but
   the words give Evan something to shout at his brother. */
const STAGES = [
  { at: 88, label: 'ALMOST GOT IT!' },
  { at: 60, label: 'GETTING WARMER!' },
  { at: 28, label: 'SOMETHING IS HERE…' },
  { at: 0, label: 'SCANNING…' },
];

const R = 46;
const CIRC = 2 * Math.PI * R;

/* Sawyer's job. Press is handled on the element (three ways, guarded by a
   ref so a double-fire is harmless); release is only ever detected on window.
   Progress is driven by rAF reading performance.now(), never by a useEffect
   that depends on changing values. The scale transform lives on an inner
   pointer-events:none element so the hit area never moves under the finger.

   Everything added for flavour -- the ring, the sweep, the drain -- is drawn
   by inner pointer-events:none children of that same element, so none of it
   can move or intercept the hit area mid-press. */
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

  /* Progress also lives in a ref: the drain loop and a resumed hold both need
     to read the current value without waiting for a React render. */
  const progRef = useRef(0);
  const drainRafRef = useRef(0);
  const drainAtRef = useRef(0);

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
    progRef.current = p;
    setProg(p);
    /* Beeps close up as the lock nears -- a quickening pulse, not a metronome. */
    if (p > beepRef.current) {
      beepRef.current += p > 70 ? 5 : p > 40 ? 8 : 12;
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

  const drain = useCallback(() => {
    if (heldRef.current) return;
    const now = performance.now();
    const dt = now - drainAtRef.current;
    drainAtRef.current = now;
    const p = Math.max(0, progRef.current - (dt / DRAIN_MS) * 100);
    progRef.current = p;
    setProg(p);
    if (p > 0) drainRafRef.current = requestAnimationFrame(drain);
  }, []);

  const begin = useCallback(
    (e) => {
      if (e && e.cancelable) e.preventDefault();
      if (heldRef.current) return;
      heldRef.current = true;
      setHeld(true);
      cancelAnimationFrame(drainRafRef.current);
      /* Backdate the start so a re-grab resumes from whatever the drain left,
         and don't replay the beeps already earned. */
      startRef.current = performance.now() - (progRef.current / 100) * HOLD_MS;
      beepRef.current = progRef.current;
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
    drainAtRef.current = performance.now();
    cancelAnimationFrame(drainRafRef.current);
    drainRafRef.current = requestAnimationFrame(drain);
  }, [drain]);

  useGlobalRelease(end);
  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(drainRafRef.current);
    },
    []
  );

  const tapScan = () => {
    audio.blip(400 + taps * 160, 0.09);
    const nt = taps + 1;
    setTaps(nt);
    progRef.current = (nt / 5) * 100;
    setProg(progRef.current);
    if (nt >= 5) {
      audio.roar(0.9);
      doneRef.current();
    }
  };

  const stage = STAGES.find((s) => prog >= s.at) || STAGES[STAGES.length - 1];
  /* Sweeps faster the closer it gets, so the dish visibly winds up. */
  const sweepDeg = Math.pow(prog / 100, 1.5) * 1440;

  return (
    <div className="w-full max-w-xs mt-5">
      <div
        onPointerDown={begin}
        onTouchStart={begin}
        onMouseDown={begin}
        className="rounded-full flex items-center justify-center mx-auto relative"
        style={{
          width: 210,
          height: 210,
          background: held ? `radial-gradient(circle, ${C.cyan}, #0891b2)` : 'rgba(34,211,238,0.14)',
          border: `6px solid ${C.cyan}`,
          boxShadow: held
            ? `0 0 ${40 + prog * 0.7}px ${C.cyan}`
            : '0 0 18px rgba(34,211,238,0.4)',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          cursor: 'pointer',
        }}
      >
        {/* Radar sweep, behind everything else. Decorative only: if a browser
            ever lacks conic-gradient this simply doesn't paint. */}
        <div
          className="absolute rounded-full pointer-events-none overflow-hidden"
          style={{ inset: 10, opacity: held ? 0.55 : 0.16 }}
        >
          <div
            className="w-full h-full"
            style={{
              background: `conic-gradient(from ${sweepDeg}deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0) 300deg, ${C.lime} 358deg, rgba(255,255,255,0) 360deg)`,
            }}
          />
        </div>

        {/* Progress ring, so the feedback is under his finger instead of in a
            bar he has to look away to read. SVG rather than a masked gradient:
            no mask support to depend on. */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="7" />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={prog > 88 ? C.gold : C.lime}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - prog / 100)}
          />
        </svg>

        <div
          className="flex flex-col items-center pointer-events-none relative"
          style={{ transform: held ? 'scale(0.92)' : 'scale(1)', transition: 'transform 140ms' }}
        >
          <div style={{ fontSize: 54 }}>🤖</div>
          <div
            className="font-black mt-1 text-center px-2"
            style={{ color: held ? '#00212b' : C.cyan, fontSize: held ? 13 : 16, lineHeight: 1.1 }}
          >
            {held ? stage.label : 'HOLD ME'}
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Keep your finger down until the ring goes all the way round
      </p>
      <p className="mt-1 text-center text-xs font-bold" style={{ color: 'rgba(255,255,255,0.32)' }}>
        Slipped? Just grab it again — you keep most of your scan.
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
