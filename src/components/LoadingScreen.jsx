import React, { useEffect, useRef, useState } from 'react';

export default function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const DURATION = 2400;

  useEffect(() => {
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / DURATION, 1);
      const p = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setProgress(p);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else        setTimeout(onDone, 350);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []); // eslint-disable-line

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0f172a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 40,
      zIndex: 9999,
      overflow: 'hidden',
    }}>
      {/* Group46 blocks — left side, mix-blend-mode makes black transparent */}
      <img
        src="/group46.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-40%)',
          height: '90%',
          width: 'auto',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* Logo */}
      <img
        src="/logo.png"
        alt="BlendIt"
        style={{
          width: 'min(420px, 65vw)',
          imageRendering: 'auto',
          mixBlendMode: 'screen',
          position: 'relative',
          zIndex: 1,
          filter: 'drop-shadow(0 0 24px rgba(245,158,11,0.2))',
        }}
        draggable={false}
      />

      {/* ROYGBIV progress bar */}
      <div style={{
        width: 'min(340px, 72vw)',
        height: 7,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: `${progress * 100}%`,
          minWidth: progress > 0.005 ? 6 : 0,
          height: '100%',
          background: 'linear-gradient(90deg, #e53935, #f57c00, #fdd835, #43a047, #1e88e5, #3949ab, #8e24aa)',
          borderRadius: 4,
          transition: 'width 60ms linear',
        }} />
      </div>
    </div>
  );
}
