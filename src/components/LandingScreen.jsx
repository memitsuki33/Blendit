import React from 'react';

export default function LandingScreen({ onLogin, onRegister }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0f172a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 32,
      overflow: 'hidden',
    }}>
      {/* Group46 blocks — left side */}
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
          width: 'min(360px, 62vw)',
          imageRendering: 'auto',
          mixBlendMode: 'screen',
          position: 'relative',
          zIndex: 1,
          filter: 'drop-shadow(0 0 24px rgba(245,158,11,0.2))',
        }}
        draggable={false}
      />

      {/* Buttons */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        gap: 14,
        width: 'min(280px, 58vw)',
        position: 'relative', zIndex: 1,
      }}>
        <button
          onClick={onLogin}
          style={{
            background: '#f59e0b',
            color: '#1a1a2e',
            border: 'none',
            borderRadius: 10,
            padding: '16px 0',
            fontFamily: 'inherit',
            fontSize: '1rem',
            fontWeight: 900,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            width: '100%',
            boxShadow: '0 4px 0 #b45309',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
          onMouseDown={e => { e.currentTarget.style.transform='translateY(2px)'; e.currentTarget.style.boxShadow='0 2px 0 #b45309'; }}
          onMouseUp={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 0 #b45309'; }}
        >
          Log In
        </button>
        <button
          onClick={onRegister}
          style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '16px 0',
            fontFamily: 'inherit',
            fontSize: '1rem',
            fontWeight: 900,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            width: '100%',
            boxShadow: '0 4px 0 #1d4ed8',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
          onMouseDown={e => { e.currentTarget.style.transform='translateY(2px)'; e.currentTarget.style.boxShadow='0 2px 0 #1d4ed8'; }}
          onMouseUp={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 0 #1d4ed8'; }}
        >
          Register
        </button>
      </div>
    </div>
  );
}
