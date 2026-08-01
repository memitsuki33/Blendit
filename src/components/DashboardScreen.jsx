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
  onSinglePlayer, onTetris, onPvP, onLogOut,
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

  // ── Sub-panels (shared between desktop and mobile) ──────────────────────
  function renderSinglePlayerPanel() {
    return (
      <div className="dashboard-center dashboard-sub-center">
        <h2 className="dashboard-sub-title">Single Player</h2>
        <button className="dash-btn dash-btn-orange" onClick={() => setPanel('normal-mode')}>
          Normal Mode
        </button>
        <button className="dash-btn dash-btn-blue" onClick={() => setPanel('tetris-mode')}>Tetris Mode</button>
        <button className="dash-btn dash-btn-ghost" onClick={() => setShowColors(true)}>
          Color Cycle Guide
        </button>
        <button className="dash-btn dash-btn-ghost" onClick={() => setPanel('home')}>Back</button>
      </div>
    );
  }

  function renderTetrisPanel() {
    return (
      <div className="dashboard-center dashboard-sub-center">
        <div className="nm-header">
          <button className="nm-back-btn" onClick={() => setPanel('single-player')}>Back</button>
          <h2 className="nm-title">Single Player<br />(Tetris Mode)</h2>
        </div>
        <div className="nm-list">
          <button
            className="dash-btn dash-btn-blue nm-start0"
            onClick={() => onTetris({ level: 1, startScore: 0 })}
          >
            Start at Level 1
          </button>
          {JUMP_LEVELS.map(lv => {
            const locked = lv > maxUnlocked;
            const pts = levelThreshold(lv);
            const startScore = Math.floor(pts * 0.95);
            return (
              <button
                key={lv}
                className={`nm-level-row${locked ? ' nm-level-locked' : ''}`}
                onClick={locked ? undefined : () => onTetris({ level: lv, startScore })}
                disabled={locked}
              >
                <span className="nm-lv-label">Lv {lv}</span>
                <span className="nm-lv-pts">{fmtScore(pts)} pts to reach</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderNormalPanel() {
    return (
      <div className="dashboard-center dashboard-sub-center">
        <div className="nm-header">
          <button className="nm-back-btn" onClick={() => setPanel('single-player')}>Back</button>
          <h2 className="nm-title">Single Player<br />(Normal Mode)</h2>
        </div>
        <div className="nm-list">
          <button
            className="dash-btn dash-btn-orange nm-start0"
            onClick={() => onSinglePlayer({ level: 0, startScore: 0 })}
          >
            Starts at Level 0
          </button>
          {JUMP_LEVELS.map(lv => {
            const locked = lv > maxUnlocked;
            const pts = levelThreshold(lv);
            const startScore = Math.floor(pts * 0.95);
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
    );
  }

  return (
    <div className="dashboard">
      {/* Background */}
      <div className="dashboard-bg" />

      {/* ════════════════════════════════════════
          DESKTOP layout (hidden on mobile)
          ════════════════════════════════════════ */}
      <div className="dashboard-desktop">
        {/* Left player card */}
        <div className="dashboard-player-card" />

        {/* Center panels */}
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
        {panel === 'single-player' && renderSinglePlayerPanel()}
        {panel === 'tetris-mode'   && renderTetrisPanel()}
        {panel === 'normal-mode'   && renderNormalPanel()}

        {/* Right nav sidebar */}
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
      </div>

      {/* ════════════════════════════════════════
          MOBILE layout (hidden on desktop)
          ════════════════════════════════════════ */}
      <div className="dashboard-mobile">
        <img src="/group46.png" alt="" aria-hidden="true" className="auth-group46-bg" />

        {/* Home panel */}
        {panel === 'home' && (
          <>
            {/* Logo */}
            <div className="db-mobile-logo-wrap">
              <img
                src="/logo.png"
                alt="BlendIt"
                className="db-mobile-logo"
                draggable={false}
              />
            </div>

            {/* Main buttons */}
            <div className="db-mobile-buttons">
              <button className="dash-btn dash-btn-orange db-mobile-btn" onClick={() => setPanel('single-player')}>
                Single Player
              </button>
              <button className="dash-btn dash-btn-blue db-mobile-btn" onClick={onPvP}>
                PvP
              </button>
              <button className="dash-btn dash-btn-green db-mobile-btn">
                Shop
              </button>
              <button className="dash-btn dash-btn-pink db-mobile-btn">
                Friends
              </button>
            </div>
          </>
        )}

        {/* Sub-panels on mobile — full scrollable list */}
        {panel === 'single-player' && (
          <div className="db-mobile-sub">
            <button className="nm-back-btn db-mobile-back" onClick={() => setPanel('home')}>← Back</button>
            <h2 className="dashboard-sub-title">Single Player</h2>
            <button className="dash-btn dash-btn-orange db-mobile-btn" onClick={() => setPanel('normal-mode')}>Normal Mode</button>
            <button className="dash-btn dash-btn-blue db-mobile-btn" onClick={() => setPanel('tetris-mode')}>Tetris Mode</button>
            <button className="dash-btn dash-btn-ghost db-mobile-btn" onClick={() => setShowColors(true)}>Color Cycle Guide</button>
          </div>
        )}

        {panel === 'tetris-mode' && (
          <div className="db-mobile-sub db-mobile-list">
            <button className="nm-back-btn db-mobile-back" onClick={() => setPanel('single-player')}>← Back</button>
            <h2 className="nm-title" style={{ textAlign: 'center', marginBottom: 8 }}>Tetris Mode</h2>
            <button className="dash-btn dash-btn-blue db-mobile-btn" onClick={() => onTetris({ level: 1, startScore: 0 })}>
              Start at Level 1
            </button>
            {JUMP_LEVELS.map(lv => {
              const locked = lv > maxUnlocked;
              const pts = levelThreshold(lv);
              return (
                <button
                  key={lv}
                  className={`nm-level-row db-mobile-level${locked ? ' nm-level-locked' : ''}`}
                  onClick={locked ? undefined : () => onTetris({ level: lv, startScore: Math.floor(pts * 0.95) })}
                  disabled={locked}
                >
                  <span className="nm-lv-label">Lv {lv}</span>
                  <span className="nm-lv-pts">{fmtScore(pts)} pts</span>
                </button>
              );
            })}
          </div>
        )}

        {panel === 'normal-mode' && (
          <div className="db-mobile-sub db-mobile-list">
            <button className="nm-back-btn db-mobile-back" onClick={() => setPanel('single-player')}>← Back</button>
            <h2 className="nm-title" style={{ textAlign: 'center', marginBottom: 8 }}>Normal Mode</h2>
            <button className="dash-btn dash-btn-orange db-mobile-btn" onClick={() => onSinglePlayer({ level: 0, startScore: 0 })}>
              Start at Level 0
            </button>
            {JUMP_LEVELS.map(lv => {
              const locked = lv > maxUnlocked;
              const pts = levelThreshold(lv);
              return (
                <button
                  key={lv}
                  className={`nm-level-row db-mobile-level${locked ? ' nm-level-locked' : ''}`}
                  onClick={locked ? undefined : () => onSinglePlayer({ level: lv, startScore: Math.floor(pts * 0.95) })}
                  disabled={locked}
                >
                  <span className="nm-lv-label">Lv {lv}</span>
                  <span className="nm-lv-pts">{fmtScore(pts)} pts</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom tab bar */}
        <nav className="db-mobile-nav">
          <button
            className={`db-mobile-nav-home${activeNav === 'HOME' ? ' active' : ''}`}
            onClick={() => { setActiveNav('HOME'); setPanel('home'); }}
          >
            HOME
          </button>
          <div className="db-mobile-nav-tabs">
            {['LEVELS', 'RANKS', 'TROPHIES', 'CHATS', 'SETTINGS', 'USER DATA', 'LOG OUT'].map(item => (
              <button
                key={item}
                className={`db-mobile-nav-tab${activeNav === item ? ' active' : ''}`}
                onClick={() => handleNav(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Shared modals */}
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
