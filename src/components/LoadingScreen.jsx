import React, { useEffect, useRef, useState } from 'react';

const TILE  = 46;   // tile square size in px
const GAP   = 5;    // gap between tiles in px
const RAD   = 9;    // tile border-radius
const FONT  = 96;   // "BlendIt" font size in px
const OVER  = 20;   // how many px the text overlaps each tile column

const C = {
  red:    '#e53935',
  orange: '#f57c00',
  yellow: '#fdd835',
  green:  '#43a047',
  gray:   '#546e7a',
  purple: '#8e24aa',
};

function Tile({ color, size = TILE, style = {} }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: RAD,
      background: C[color] || color,
      flexShrink: 0,
      ...style,
    }} />
  );
}

function TileCol({ tiles, style = {} }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: GAP,
      flexShrink: 0,
      ...style,
    }}>
      {tiles.map((color, i) => <Tile key={i} color={color} />)}
    </div>
  );
}

export default function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0);
  const rafRef  = useRef(null);
  const DURATION = 2400;

  useEffect(() => {
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / DURATION, 1);
      const p = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setProgress(p);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(onDone, 350);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []); // eslint-disable-line

  // height of 4-tile stack
  const stackH = 4 * TILE + 3 * GAP;
  // height of floating red tile (smaller than normal)
  const floatSize = TILE - 10;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0f172a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 64,
      zIndex: 9999,
      fontFamily: "'Righteous', system-ui, sans-serif",
      userSelect: 'none',
    }}>

      {/* ── Logo group ──────────────────────────────────── */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>

        {/* Yellow diamond — bounces above center of the row */}
        <div style={{
          position: 'absolute',
          top: -(floatSize + GAP + 38),
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: 30, height: 30,
          background: C.yellow,
          borderRadius: 5,
          animation: 'ldBounce 1.8s ease-in-out infinite',
          zIndex: 2,
        }} />

        {/* Left tile column — tiles are behind the text (z-index 0) */}
        <div style={{
          position: 'relative',
          flexShrink: 0,
          zIndex: 0,
          /* shift right so the right edge of this column is "behind" the B */
          marginRight: -OVER,
        }}>
          {/* Floating single red tile above the main stack */}
          <Tile
            color="red"
            size={floatSize}
            style={{
              position: 'absolute',
              top: -(floatSize + GAP),
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
          <TileCol tiles={['red', 'orange', 'yellow', 'green']} />
        </div>

        {/* BlendIt text — sits in front of the tile columns (z-index 1) */}
        <div style={{
          display: 'flex', alignItems: 'center',
          height: stackH,
          zIndex: 1,
          lineHeight: 1,
        }}>
          <span style={{ fontSize: FONT, fontWeight: 900, letterSpacing: -2, color: '#f57c00' }}>
            Blend
          </span>
          <span style={{ fontSize: FONT, fontWeight: 900, letterSpacing: -2, color: '#ffffff' }}>
            It
          </span>
        </div>

        {/* Right tile column — behind text */}
        <TileCol
          tiles={['gray', 'gray', 'gray', 'purple']}
          style={{
            zIndex: 0,
            marginLeft: -OVER,
          }}
        />
      </div>

      {/* ── Progress bar ─────────────────────────────────── */}
      <div style={{
        width: 'min(560px, 66vw)',
        height: 7,
        background: 'rgba(255,255,255,0.10)',
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{
          width: `${progress * 100}%`,
          minWidth: progress > 0.005 ? 8 : 0,
          height: '100%',
          background: 'linear-gradient(90deg, #e53935 0%, #f57c00 30%, #fdd835 58%, #43a047 100%)',
          borderRadius: 4,
        }} />
      </div>

      <style>{`
        @keyframes ldBounce {
          0%, 100% { transform: translateX(-50%) rotate(45deg) translateY(0); }
          50%       { transform: translateX(-50%) rotate(45deg) translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
