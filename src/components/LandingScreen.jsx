import React from 'react';

export default function LandingScreen({ onLogin, onRegister }) {
  return (
    <div className="landing">
      <div className="landing-bg" />
      <img
        src="/logo.png"
        alt="BlendIt"
        className="landing-logo"
        draggable={false}
      />

      <div className="landing-buttons">
        <button className="btn btn-primary landing-btn" onClick={onLogin}>
          Log In
        </button>
        <button className="btn btn-secondary landing-btn" onClick={onRegister}>
          Register
        </button>
      </div>
    </div>
  );
}
