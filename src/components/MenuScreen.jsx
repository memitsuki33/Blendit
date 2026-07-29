import React, { useState } from 'react';
import { playClick, playHover } from '../utils/soundEffects.js';
import SettingsModal from './SettingsModal.jsx';

export default function MenuScreen({
  onSinglePlayerPC, onSinglePlayerMobile, onBattlePC, onBattleMobile, onTutorial,
  animSpeed, onAnimSpeed,
  soundEnabled, onSoundEnabled,
  musicEnabled, onMusicEnabled,
}) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="menu">
      {/* Full-screen background image */}
      <div className="menu-bg" />

      {/* Logo section */}
      <div className="menu-logo-section">
        <img
          src="/logo.png"
          alt="BlendIt"
          className="menu-logo"
          draggable={false}
        />
        <div className="menu-subtitle">Mix the colors to attack!</div>
      </div>

      {/* Buttons section */}
      <div className="menu-buttons">
        <button className="btn btn-primary" onMouseEnter={playHover} onClick={() => { playClick(); onSinglePlayerPC(); }}>
          Single Player (PC)
        </button>
        <button className="btn btn-mobile" onMouseEnter={playHover} onClick={() => { playClick(); onSinglePlayerMobile(); }}>
          Single Player (Mobile)
        </button>
        <button className="btn btn-secondary" onMouseEnter={playHover} onClick={() => { playClick(); onBattlePC(); }}>
          Battle (PC)
        </button>
        <button className="btn btn-mobile" onMouseEnter={playHover} onClick={() => { playClick(); onBattleMobile(); }}>
          Battle (Mobile)
        </button>
        <button className="btn btn-ghost" onMouseEnter={playHover} onClick={() => { playClick(); onTutorial(); }}>
          How to Play
        </button>
        <button className="btn btn-ghost" onMouseEnter={playHover} onClick={() => { playClick(); setShowSettings(true); }}>
          Settings
        </button>
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          animSpeed={animSpeed}
          onAnimSpeed={onAnimSpeed}
          soundEnabled={soundEnabled}
          onSoundEnabled={onSoundEnabled}
          musicEnabled={musicEnabled}
          onMusicEnabled={onMusicEnabled}
        />
      )}
    </div>
  );
}
