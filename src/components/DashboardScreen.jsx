import React, { useState } from 'react';
import SettingsModal from './SettingsModal.jsx';

const NAV_ITEMS = ['HOME', 'LEVELS', 'RANKS', 'TROPHIES', 'CHATS', 'SETTINGS', 'USER DATA', 'LOG OUT'];

export default function DashboardScreen({
  onSinglePlayer, onPvP, onLogOut,
  animSpeed, onAnimSpeed,
  soundEnabled, onSoundEnabled,
  musicEnabled, onMusicEnabled,
}) {
  const [activeNav, setActiveNav] = useState('HOME');
  const [showSettings, setShowSettings] = useState(false);

  function handleNav(item) {
    if (item === 'LOG OUT') { onLogOut(); return; }
    if (item === 'SETTINGS') { setShowSettings(true); return; }
    setActiveNav(item);
  }

  return (
    <div className="dashboard">
      {/* Background */}
      <div className="dashboard-bg" />

      {/* Left — player card */}
      <div className="dashboard-player-card" />

      {/* Center — game buttons */}
      <div className="dashboard-center">
        <div className="dashboard-row">
          <button className="dash-btn dash-btn-orange" onClick={onSinglePlayer}>
            Single Player
          </button>
          <button className="dash-btn dash-btn-pink">
            Friends
          </button>
        </div>
        <button className="dash-btn dash-btn-blue">
          PvP
        </button>
        <button className="dash-btn dash-btn-green">
          Shop
        </button>
      </div>

      {/* Right — nav sidebar */}
      <nav className="dashboard-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item}
            className={`dashboard-nav-btn${item === activeNav ? ' dashboard-nav-active' : ''}`}
            onClick={() => handleNav(item)}
          >
            {item}
          </button>
        ))}
      </nav>

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
