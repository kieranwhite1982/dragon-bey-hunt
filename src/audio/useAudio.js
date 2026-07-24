import { useCallback, useMemo, useRef } from 'react';

/* Everything is synthesised at runtime — no audio files, nothing to fetch,
   works with the wifi off.

   The returned object MUST be referentially stable. Battle.jsx keys its
   requestAnimationFrame loop on `audio`; an unstable identity here tears the
   loop down and rebuilds it on every render, which reads as a frozen canvas. */
export function useAudio() {
  const ctxRef = useRef(null);
  const noiseRef = useRef(null);

  const get = useCallback(() => {
    try {
      if (!ctxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctxRef.current = new AC();
      }
      if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
      return ctxRef.current;
    } catch {
      return null;
    }
  }, []);

  const getNoise = useCallback((ctx) => {
    if (!noiseRef.current) {
      const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      noiseRef.current = b;
    }
    return noiseRef.current;
  }, []);

  const roar = useCallback(
    (len = 1.1) => {
      const ctx = get();
      if (!ctx) return;
      const t = ctx.currentTime;

      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(48, t + len);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.32, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(1400, t);
      f.frequency.exponentialRampToValueAtTime(300, t + len);
      o.connect(f);
      f.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + len + 0.05);

      const n = ctx.createBufferSource();
      n.buffer = getNoise(ctx);
      const nf = ctx.createBiquadFilter();
      nf.type = 'bandpass';
      nf.frequency.setValueAtTime(700, t);
      nf.frequency.exponentialRampToValueAtTime(160, t + len);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.2, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + len);
      n.connect(nf);
      nf.connect(ng);
      ng.connect(ctx.destination);
      n.start(t);
      n.stop(t + len);
    },
    [get, getNoise]
  );

  const blip = useCallback(
    (freq = 700, len = 0.09, type = 'square', vol = 0.16) => {
      const ctx = get();
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + len + 0.02);
    },
    [get]
  );

  const clash = useCallback(
    (power = 1) => {
      const ctx = get();
      if (!ctx) return;
      const t = ctx.currentTime;
      const n = ctx.createBufferSource();
      n.buffer = getNoise(ctx);
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.4 * power, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      n.connect(f);
      f.connect(g);
      g.connect(ctx.destination);
      n.start(t);
      n.stop(t + 0.3);

      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(320, t);
      o.frequency.exponentialRampToValueAtTime(70, t + 0.25);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.3 * power, t);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(g2);
      g2.connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.27);
    },
    [get, getNoise]
  );

  const spinUp = useCallback(
    (len = 1.4) => {
      const ctx = get();
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(90, t);
      o.frequency.exponentialRampToValueAtTime(900, t + len);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + len * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.3);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 6;
      f.frequency.setValueAtTime(300, t);
      f.frequency.exponentialRampToValueAtTime(2200, t + len);
      o.connect(f);
      f.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + len + 0.35);
    },
    [get]
  );

  /* Held, detuned whine under the whole battle. Returns a stop() so the
     caller can kill it on unmount — a stray oscillator would outlive the
     screen and drone through the victory fanfare. */
  const spinLoop = useCallback(() => {
    const ctx = get();
    if (!ctx) return () => {};
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.055, t + 1.2);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 4;
    f.frequency.value = 1500;
    const oscs = [640, 646].map((freq) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq, t);
      o.connect(f);
      o.start(t);
      return o;
    });
    f.connect(g);
    g.connect(ctx.destination);
    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      try {
        const now = ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        oscs.forEach((o) => o.stop(now + 0.4));
      } catch {
        /* context already closed */
      }
    };
  }, [get]);

  const fanfare = useCallback(() => {
    const ctx = get();
    if (!ctx) return;
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((fr, i) => {
      const t = ctx.currentTime + i * 0.13;
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(fr, t);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.55);
    });
  }, [get]);

  const grumble = useCallback(() => {
    const ctx = get();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(120, t);
    o.frequency.linearRampToValueAtTime(70, t + 0.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 500;
    o.connect(f);
    f.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.45);
  }, [get]);

  /* Low boom for the Dragon Strike. */
  const boom = useCallback(() => {
    const ctx = get();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 1.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 1.25);

    const n = ctx.createBufferSource();
    n.buffer = getNoise(ctx);
    const nf = ctx.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.setValueAtTime(2400, t);
    nf.frequency.exponentialRampToValueAtTime(180, t + 0.9);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.34, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
    n.connect(nf);
    nf.connect(ng);
    ng.connect(ctx.destination);
    n.start(t);
    n.stop(t + 1);
  }, [get, getNoise]);

  /* Rising zap for the charge-up. */
  const charge = useCallback(
    (len = 0.5) => {
      const ctx = get();
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(1800, t + len);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.13, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.05);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + len + 0.08);
    },
    [get]
  );

  return useMemo(
    () => ({ roar, blip, clash, spinUp, spinLoop, fanfare, grumble, boom, charge, unlock: get }),
    [roar, blip, clash, spinUp, spinLoop, fanfare, grumble, boom, charge, get]
  );
}

export default useAudio;
