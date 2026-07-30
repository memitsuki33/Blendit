import React, { useState } from 'react';
import SettingsModal from './SettingsModal.jsx';
import ColorSequenceModal from './ColorSequenceModal.jsx';
import { levelThreshold, MAX_LEVEL } from '../utils/constants.js';

const NAV_ITEMS = ['HOME', 'LEVELS', 'RANKS', 'TROPHIES', 'CHATS', 'SETTINGS', 'USER DATA', 'LOG OUT'];

// Level jump checkpoints: multiples of 5 up to MAX_LEVEL
const JUMP_LEVELS = Array.from({ length: Math.floor(MAX_LEVEL / 5) }, (_, i) => (i + 1) * 5);

function fmtScore(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function DashboardScreen({
  onSinglePlayer, onPvP, onLogOut,
  animSpeed, onAnimSpeed,
  soundEnabled, onSoundEnabled,
  musicEnabled, onMusicEnabled,
}) {
  const [activeNav, setActiveNav] = useState('HOME');
  const [panel, setPanel] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const [showColors, setShowColors] = useState(false);

  const maxUnlocked = parseInt(
    typeof localStorage !== 'undefined'
      ? (localStorage.getItem('blendIt_maxLevel') || '0')
      : '0', 10
  );

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

      {/* ── HOME panel ── */}
      {panel === 'home' && (
        <div className="dashboard-center">
          <div className="dashboard-row">
            <button className="dash-btn dash-btn-orange" onClick={() => setPanel('single-player')}>
              Single Player
            </button>
            <button className="dash-btn dash-btn-pink">Friends</button>
          </div>
          <div className="dashboard-row">
            <button className="dash-btn dash-btn-blue" onClick={onPvP}>PvP</button>
            <button className="dash-btn dash-btn-purple">Dailies</button>
          </div>
          <div className="dashboard-row">
            <button className="dash-btn dash-btn-green">Shop</button>
            <button className="dash-btn dash-btn-teal">Quest</button>
          </div>
        </div>
      )}

      {/* ── SINGLE PLAYER panel ── */}
      {panel === 'single-player' && (
        <div className="dashboard-center dashboard-sub-center">
          <h2 className="dashboard-sub-title">Single Player</h2>
          <button className="dash-btn dash-btn-orange" onClick={() => setPanel('normal-mode')}>
            Normal Mode
          </button>
          <button className="dash-btn dash-btn-blue">Tetris Mode</button>
          <button className="dash-btn dash-btn-ghost" onClick={() => setShowColors(true)}>
            Color Cycle Guide
          </button>
          <button className="dash-btn dash-btn-ghost" onClick={() => setPanel('home')}>Back</button>
        </div>
      )}

      {/* ── NORMAL MODE panel ── */}
      {panel === 'normal-mode' && (
        <div className="dashboard-center dashboard-sub-center">
          <div className="nm-header">
            <button className="nm-back-btn" onClick={() => setPanel('single-player')}>Back</button>
            <h2 className="nm-title">Single Player<br />(Normal Mode)</h2>
          </div>

          <div className="nm-list">
            {/* Level 0 — always available */}
            <button
              className="dash-btn dash-btn-orange nm-start0"
              onClick={() => onSinglePlayer({ level: 0, startScore: 0 })}
            >
              Starts at Level 0
            </button>

            {/* Jump levels */}
            {JUMP_LEVELS.map(lv => {
              const locked = lv > maxUnlocked;
              const pts = levelThreshold(lv);
              const startScore = Math.floor(pts * 0.75);
              return (
                <button
                  key={lv}
                  className={`nm-level-row${locked ? ' nm-level-locked' : ''}`}
                  onClick={locked ? undefined : () => onSinglePlayer({ level: lv, startScore })}
                  disabled={locked}
                >
                  <span className="nm-lv-label">Lv {lv}</span>
                  <span className="nm-lv-pts">{fmtScore(pts)} pts to reach</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
          animSpeed={animSpeed} onAnimSpeed={onAnimSpeed}
          soundEnabled={soundEnabled} onSoundEnabled={onSoundEnabled}
          musicEnabled={musicEnabled} onMusicEnabled={onMusicEnabled}
        />
      )}

      {showColors && (
        <ColorSequenceModal onClose={() => setShowColors(false)} actionLabel="Got it!" />
      )}
    </div>
  );
}
