import React, { useEffect, useRef } from 'react';

export default function Confetti({ run }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!run) return undefined;
    const cv = ref.current;
    if (!cv) return undefined;
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      cv.width = cv.offsetWidth * dpr;
      cv.height = cv.offsetHeight * dpr;
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
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        if (p.y > cv.offsetHeight + 20) {
          p.y = -20;
          p.x = Math.random() * cv.offsetWidth;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      });
      raf = requestAnimationFrame(loop);
    };
    loop();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [run]);

  if (!run) return null;
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 w-full h-full z-40" />;
}
