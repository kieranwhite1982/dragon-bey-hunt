import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BATTLE_FINISH, IGNIS_PORTRAIT, WYRM_PORTRAIT } from '../optionalAssets.js';
import { C } from '../theme.js';

/* The final battle carries the whole payoff, so it is scripted to run about
   50 seconds end to end with zero input, and it CANNOT be lost.

   intro  5.0s   beys spiral into the bowl, spin-up whine, 3-2-1 LET IT RIP
   clash ~20s    nine scripted collisions, hero bleeds down to 32%
   mash  ~17s    power meter fills on its own; mashing only makes it faster
   finish ~4s    Dragon Strike, wyrm drains to zero and wobbles out
   win    3.2s   fanfare, then straight to the victory screen

   The simulation lives in a ref and is stepped by one rAF loop. React state
   is only the HUD, and it is throttled — pushing four setStates every frame
   for 50 seconds is the fastest way to make a mid-range Android phone stutter.

   `audio` must be referentially stable (see useAudio) or this effect tears
   down and the canvas freezes. */

const T = {
  intro: 5.0,
  clashEvery: 2.2,
  heroHitDmg: 8,
  foeChipDmg: 2.6,
  heroFloor: 32,
  foeClashFloor: 74,
  mashAutoPerSec: 6.0,
  mashPerPress: 3.5,
  foeDrainPerSec: 22,
  heroHealPerSec: 40,
  winHold: 3.2,
  skipAfter: 12000,
};

/* Hard ceiling on how long the victory screen will wait for the Dragon Strike
   clip, armed when that clip starts. Comfortably clear of the 20s render so a
   slow start doesn't truncate it, while still guaranteeing the finale can
   never hang on a video that stalls. */
const CLIP_BACKSTOP_MS = 32000;

export default function Battle({ audio, onDone }) {
  const cvRef = useRef(null);
  const [phase, setPhase] = useState('intro');
  const [heroHP, setHeroHP] = useState(100);
  const [foeHP, setFoeHP] = useState(100);
  const [power, setPower] = useState(0);
  const [count, setCount] = useState('3');
  const [showSkip, setShowSkip] = useState(false);

  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  /* When a Dragon Strike clip exists it plays over the canvas from the moment
     the power meter fills, and the victory screen waits for it. Held in a ref
     so the rAF loop can read it without the effect tearing down mid-battle.

     It is only ever a delay, never a gate: the clip ending, erroring, failing
     to autoplay, or simply taking too long all release it. Nothing about the
     finale may depend on a video actually playing. */
  const clipHoldRef = useRef(!!BATTLE_FINISH);
  const vidRef = useRef(null);

  /* Start the clip, and arm the backstop, when the Dragon Strike actually
     begins -- NOT on mount. The finish phase lands ~42s in (5s intro + ~20s
     clash + ~17s mash), so a timer started at mount would have expired long
     before the clip ever played and the victory screen would have cut it off
     part-way through.

     A rejected autoplay fires no onEnded, so that releases the hold at once
     rather than making them sit and wait out the backstop. */
  useEffect(() => {
    if (!BATTLE_FINISH || phase !== 'finish') return undefined;

    const v = vidRef.current;
    if (v) {
      const p = v.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          clipHoldRef.current = false;
        });
      }
    }

    const t = setTimeout(() => {
      clipHoldRef.current = false;
    }, CLIP_BACKSTOP_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const S = useRef({
    t: 0,
    total: 0,
    phase: 'intro',
    hero: 100,
    foe: 100,
    power: 0,
    shake: 0,
    flash: 0,
    beam: 0,
    nextClash: T.clashEvery,
    sparks: [],
    rings: [],
    heroTrail: [],
    foeTrail: [],
    hudAt: 0,
    finished: false,
  });

  const lastMash = useRef(0);

  /* Tap, not hold — pointerdown and touchstart both fire on Android, so a
     short dedupe window stops one press counting twice. */
  const mash = useCallback(
    (e) => {
      if (e && e.cancelable) e.preventDefault();
      const now = performance.now();
      if (now - lastMash.current < 40) return;
      lastMash.current = now;
      if (S.current.phase !== 'mash') return;
      S.current.power = Math.min(100, S.current.power + T.mashPerPress);
      S.current.shake = Math.max(S.current.shake, 5);
      audio.blip(420 + Math.random() * 520, 0.05, 'square', 0.13);
    },
    [audio]
  );

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), T.skipAfter);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return undefined;
    const ctx = cv.getContext('2d');

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      cv.width = Math.max(1, cv.offsetWidth * dpr);
      cv.height = Math.max(1, cv.offsetHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    audio.spinUp(2.4);
    const stopWhine = audio.spinLoop();

    const s = S.current;
    let raf = 0;
    let last = performance.now();
    let winTimer = 0;

    /* ---------- drawing helpers ---------- */

    const drawBey = (x, y, r, ang, c1, c2, glow, spikes) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.shadowColor = glow;
      ctx.shadowBlur = 26;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const rad = i % 2 === 0 ? r : r * 0.66;
        const a = (i / (spikes * 2)) * Math.PI * 2;
        ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
    };

    const drawTrail = (trail, colour) => {
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        const a = (i / trail.length) * 0.5;
        ctx.globalAlpha = a;
        ctx.fillStyle = colour;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 + (i / trail.length) * 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const pushTrail = (arr, x, y) => {
      arr.push({ x, y });
      if (arr.length > 16) arr.shift();
    };

    const burst = (x, y, n, cols, speed) => {
      for (let i = 0; i < n; i++) {
        s.sparks.push({
          x,
          y,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          life: 0.5 + Math.random() * 0.4,
          max: 0.9,
          c: cols[(Math.random() * cols.length) | 0],
        });
      }
    };

    /* ---------- the loop ---------- */

    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.t += dt;
      s.total += dt;

      const W = cv.offsetWidth;
      const H = cv.offsetHeight;
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) * 0.42;

      /* --- phase machine --- */

      if (s.phase === 'intro') {
        const left = T.intro - s.t;
        const label = left > 3.2 ? '3' : left > 2.2 ? '2' : left > 1.2 ? '1' : 'LET IT RIP!';
        if (label !== s.countLabel) {
          s.countLabel = label;
          setCount(label);
          audio.blip(label === 'LET IT RIP!' ? 1200 : 660, 0.16, 'square', 0.2);
        }
        if (s.t >= T.intro) {
          s.phase = 'clash';
          setPhase('clash');
          s.t = 0;
          audio.roar(1.0);
        }
      } else if (s.phase === 'clash') {
        s.nextClash -= dt;
        if (s.nextClash <= 0) {
          s.nextClash = T.clashEvery;
          audio.clash(1);
          s.shake = 14;
          s.flash = 0.45;
          burst(cx, cy, 26, ['#ffc94a', '#a78bfa', '#ffffff'], 460);
          s.rings.push({ r: 10, life: 0.6, c: 'rgba(255,201,74,0.8)' });
          s.hero = Math.max(T.heroFloor, s.hero - T.heroHitDmg);
          s.foe = Math.max(T.foeClashFloor, s.foe - T.foeChipDmg);
        }
        if (s.hero <= T.heroFloor) {
          s.phase = 'mash';
          setPhase('mash');
          s.t = 0;
          audio.roar(1.3);
        }
      } else if (s.phase === 'mash') {
        /* Fills on its own. Mashing is loud and fun and speeds it up; it is
           not a requirement, so nobody can fail at their own birthday. */
        s.power = Math.min(100, s.power + dt * T.mashAutoPerSec);
        if (s.power > (s.chargeAt || 0) + 20) {
          s.chargeAt = s.power;
          audio.charge(0.35);
          s.rings.push({ r: 4, life: 0.5, c: 'rgba(163,230,53,0.7)' });
        }
        if (s.power >= 100) {
          s.phase = 'finish';
          setPhase('finish');
          s.t = 0;
          s.beam = 1;
          s.flash = 1;
          s.shake = 30;
          audio.boom();
          audio.spinUp(1.2);
          burst(cx, cy, 60, ['#ffc94a', '#ff6b35', '#ffffff'], 700);
          s.rings.push({ r: 10, life: 1.0, c: 'rgba(255,107,53,0.95)' });
        }
      } else if (s.phase === 'finish') {
        s.foe = Math.max(0, s.foe - dt * T.foeDrainPerSec);
        s.hero = Math.min(100, s.hero + dt * T.heroHealPerSec);
        s.beam = Math.max(0, s.beam - dt * 0.55);
        if (Math.random() < dt * 12) burst(cx, cy, 4, ['#ffc94a', '#fff3b0'], 520);
        if (s.foe <= 0) {
          s.phase = 'win';
          setPhase('win');
          s.t = 0;
          s.flash = 0.9;
          s.shake = 22;
          audio.fanfare();
          audio.roar(1.4);
          burst(cx, cy, 80, ['#ffc94a', '#a3e635', '#ff6b35', '#ffffff'], 640);
        }
      } else if (s.phase === 'win') {
        if (!s.finished && s.t >= T.winHold && !clipHoldRef.current) {
          s.finished = true;
          winTimer = 1;
          doneRef.current();
        }
      }

      /* --- HUD, throttled to ~12 fps --- */
      s.hudAt += dt;
      if (s.hudAt > 0.08) {
        s.hudAt = 0;
        setHeroHP(s.hero);
        setFoeHP(s.foe);
        setPower(s.power);
      }

      /* --- render --- */

      ctx.clearRect(0, 0, W, H);
      const sh = s.shake;
      s.shake = Math.max(0, s.shake - dt * 55);

      ctx.save();
      ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);

      /* rotating arena light rays */
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(s.total * 0.16);
      for (let i = 0; i < 10; i++) {
        ctx.rotate((Math.PI * 2) / 10);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(R * 2.1, -R * 0.16);
        ctx.lineTo(R * 2.1, R * 0.16);
        ctx.closePath();
        ctx.fillStyle = s.phase === 'finish' || s.phase === 'win' ? 'rgba(255,201,74,0.07)' : 'rgba(168,85,247,0.05)';
        ctx.fill();
      }
      ctx.restore();

      /* stadium bowl */
      const bowl = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
      bowl.addColorStop(0, '#3b1a63');
      bowl.addColorStop(0.7, '#1d0b38');
      bowl.addColorStop(1, '#0e0520');
      ctx.beginPath();
      ctx.ellipse(cx, cy, R, R * 0.86, 0, 0, Math.PI * 2);
      ctx.fillStyle = bowl;
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = C.gold;
      ctx.shadowColor = C.gold;
      ctx.shadowBlur = 22;
      ctx.stroke();
      ctx.shadowBlur = 0;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, R * (1 - i * 0.22), R * 0.86 * (1 - i * 0.22), 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,201,74,0.16)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      /* shockwave rings */
      s.rings = s.rings.filter((r) => r.life > 0);
      s.rings.forEach((r) => {
        r.life -= dt;
        r.r += dt * 460;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r.r, r.r * 0.86, 0, 0, Math.PI * 2);
        ctx.strokeStyle = r.c;
        ctx.globalAlpha = Math.max(0, r.life);
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      /* bey positions */
      const introEase = s.phase === 'intro' ? Math.min(1, s.t / (T.intro * 0.7)) : 1;
      const spiral =
        s.phase === 'intro'
          ? R * (1.7 - 1.0 * introEase)
          : s.phase === 'win'
            ? R * 0.28
            : R * (0.24 + Math.abs(Math.sin(s.t * 2.1)) * 0.34);

      const a1 = s.total * 2.6;
      const a2 = s.total * 2.6 + Math.PI;
      const hx = cx + Math.cos(a1) * spiral;
      const hy = cy + Math.sin(a1) * spiral * 0.86;

      /* the wyrm wobbles out of the bowl once it is beaten */
      const foeOut = s.phase === 'win' ? Math.min(1, s.t / 1.6) : 0;
      const fx = cx + Math.cos(a2) * spiral * (1 + foeOut * 1.6);
      const fy = cy + Math.sin(a2) * spiral * 0.86 * (1 + foeOut * 1.6) + foeOut * 60;

      pushTrail(s.heroTrail, hx, hy);
      pushTrail(s.foeTrail, fx, fy);

      if (foeOut < 0.9) {
        drawTrail(s.foeTrail, '#7c3aed');
        drawBey(fx, fy, 30, -s.total * 26 * (1 - foeOut), '#c084fc', '#4c1d95', '#a855f7', 7);
        /* wyrm eyes */
        ctx.globalAlpha = 0.9 * (1 - foeOut);
        ctx.fillStyle = '#f0abfc';
        ctx.beginPath();
        ctx.arc(fx - 6, fy - 3, 2.6, 0, Math.PI * 2);
        ctx.arc(fx + 6, fy - 3, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      /* hero aura scales with the power meter and the finish */
      const powered = s.phase === 'finish' || s.phase === 'win';
      const heroR = 30 + (powered ? 20 : 0) + (s.power / 100) * 10;
      drawTrail(s.heroTrail, '#ff6b35');

      if (s.power > 4 || powered) {
        const auraR = heroR * (1.9 + Math.sin(s.total * 9) * 0.12);
        const aura = ctx.createRadialGradient(hx, hy, heroR * 0.6, hx, hy, auraR);
        aura.addColorStop(0, `rgba(255,201,74,${0.35 + (s.power / 100) * 0.35})`);
        aura.addColorStop(1, 'rgba(255,107,53,0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(hx, hy, auraR, 0, Math.PI * 2);
        ctx.fill();
      }
      drawBey(hx, hy, heroR, s.total * 30, '#fff1c9', '#ff3d00', '#ff6b35', 8);

      /* Dragon Strike beam */
      if (s.beam > 0) {
        const w = 70 * s.beam;
        const beam = ctx.createLinearGradient(0, 0, 0, cy);
        beam.addColorStop(0, `rgba(255,243,176,${0.9 * s.beam})`);
        beam.addColorStop(1, `rgba(255,107,53,${0.15 * s.beam})`);
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(hx - w * 0.35, 0);
        ctx.lineTo(hx + w * 0.35, 0);
        ctx.lineTo(hx + w, hy);
        ctx.lineTo(hx - w, hy);
        ctx.closePath();
        ctx.fill();
      }

      /* sparks */
      s.sparks = s.sparks.filter((p) => p.life > 0);
      s.sparks.forEach((p) => {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 380 * dt;
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, 5, 5);
      });
      ctx.globalAlpha = 1;

      if (s.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${s.flash})`;
        ctx.fillRect(-W, -H, W * 3, H * 3);
        s.flash = Math.max(0, s.flash - dt * 2.4);
      }

      ctx.restore();

      if (!winTimer) raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      stopWhine();
    };
  }, [audio]);

  const bar = (v, c) => (
    <div
      className="h-4 rounded-full overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.45)', border: '2px solid rgba(255,255,255,0.35)' }}
    >
      <div style={{ width: `${v}%`, height: '100%', background: c, transition: 'width 90ms linear' }} />
    </div>
  );

  const mashBtn = (label, bg, fg) => (
    <button
      onPointerDown={mash}
      onTouchStart={mash}
      className="flex-1 rounded-2xl font-black text-xl py-5"
      style={{
        background: bg,
        color: fg,
        border: '4px solid #fff',
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Portraits stand in for the emoji when they exist, so the fight reads
          as Ignis vs the Wyrm face to face rather than two HP bars. Both are
          optional everywhere else in the app, so both fall back here too. */}
      <div className="px-3 pt-2 pb-1">
        <div className="flex items-center gap-2 mb-1">
          {IGNIS_PORTRAIT ? (
            <img
              src={IGNIS_PORTRAIT}
              alt=""
              className="rounded-full object-cover shrink-0"
              style={{ width: 30, height: 30, border: `2px solid ${C.gold}` }}
            />
          ) : (
            <span className="text-lg shrink-0">🔥</span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-xs font-black mb-1" style={{ color: C.gold }}>
              <span className="truncate">DRAGON BEY (EVAN + SAWYER)</span>
              <span className="pl-2">{Math.round(heroHP)}</span>
            </div>
            {bar(heroHP, 'linear-gradient(90deg,#ffc94a,#ff3d00)')}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          {WYRM_PORTRAIT ? (
            <img
              src={WYRM_PORTRAIT}
              alt=""
              className="rounded-full object-cover shrink-0"
              style={{ width: 30, height: 30, border: `2px solid ${C.shadow}` }}
            />
          ) : (
            <span className="text-lg shrink-0">🐲</span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-xs font-black mb-1" style={{ color: C.shadow }}>
              <span className="truncate">SHADOW WYRM</span>
              <span className="pl-2">{Math.round(foeHP)}</span>
            </div>
            {bar(foeHP, 'linear-gradient(90deg,#c084fc,#4c1d95)')}
          </div>
        </div>
      </div>

      <div className="flex-1 relative min-h-0">
        <canvas ref={cvRef} className="w-full h-full" />

        {/* Covers the canvas from the Dragon Strike onward, but sits below the
            HP bars above it, so they still watch the Wyrm drain to zero. */}
        {BATTLE_FINISH && (phase === 'finish' || phase === 'win') && (
          <video
            ref={vidRef}
            src={BATTLE_FINISH}
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'cover', background: '#000' }}
            playsInline
            autoPlay
            onEnded={() => {
              clipHoldRef.current = false;
            }}
            onError={() => {
              clipHoldRef.current = false;
            }}
          />
        )}

        {phase === 'intro' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="font-black px-6 py-3 rounded-2xl pop"
              key={count}
              style={{ background: 'rgba(0,0,0,0.6)', color: C.gold, fontSize: count.length > 2 ? 32 : 72 }}
            >
              {count}
            </div>
          </div>
        )}

        {phase === 'clash' && (
          <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
            <div
              className="inline-block text-lg font-black px-4 py-2 rounded-xl"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
            >
              The Shadow Wyrm is winning!
            </div>
          </div>
        )}

        {phase === 'finish' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="font-black text-3xl pop" style={{ color: C.gold, textShadow: `0 0 24px ${C.ember}` }}>
              DRAGON STRIKE!!!
            </div>
          </div>
        )}

        {phase === 'win' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="font-black text-3xl text-center px-6 pop" style={{ color: C.lime, textShadow: '0 0 20px #000' }}>
              THE SHADOW WYRM
              <br />
              IS BEATEN!
            </div>
          </div>
        )}

        {showSkip && phase !== 'win' && (
          <button
            onClick={() => doneRef.current()}
            className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-1 rounded"
            style={{ color: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.06)' }}
          >
            skip
          </button>
        )}
      </div>

      {phase === 'mash' && (
        <div className="px-3 pb-3 slide-up">
          <div className="text-center font-black text-lg mb-2" style={{ color: C.flame }}>
            SMASH YOUR BUTTONS TOGETHER!
          </div>
          <div
            className="h-5 rounded-full overflow-hidden mb-2"
            style={{ background: 'rgba(0,0,0,0.5)', border: '2px solid #fff' }}
          >
            <div
              style={{
                width: `${power}%`,
                height: '100%',
                background: 'linear-gradient(90deg,#a3e635,#ffc94a,#ff2e63)',
              }}
            />
          </div>
          <div className="flex gap-3">
            {mashBtn('EVAN 🔥', C.ember, '#2b0a00')}
            {mashBtn('SAWYER 🤖', C.cyan, '#00212b')}
          </div>
        </div>
      )}
    </div>
  );
}
