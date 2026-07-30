import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.js';
import GameBoard from './GameBoard.jsx';
import SettingsModal from './SettingsModal.jsx';
import ColorSequenceModal from './ColorSequenceModal.jsx';
import { getTileColor, formatScore } from '../utils/colors.js';
import { getDropInterval, levelThreshold, MAX_LEVEL } from '../utils/constants.js';
import { playMove, playHardDrop, playSoftDrop, playHold, playLock, playTimedGarbage, playLevelUp } from '../utils/soundEffects.js';

const NAV_ITEMS = ['HOME', 'LEVELS', 'RANKS', 'TROPHIES', 'CHATS', 'SETTINGS', 'USER DATA', 'LOG OUT'];

export default function GameDashboard({
  startLevel = 0, startScore = 0, onBack,
  animSpeed = 'normal', onAnimSpeed,
  soundEnabled, onSoundEnabled,
  musicEnabled, onMusicEnabled,
}) {
  const [paused, setPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showColorGuide, setShowColorGuide] = useState(true);

  const { state, moveLeft, moveRight, softDrop, hardDrop, hold, restart } = useGameEngine({
    startLevel, startScore, mode: 'single',
    paused: paused || showSettings || showColorGuide,
  });

  // Persist max level
  useEffect(() => {
    if (state.level > 0) {
      const prev = parseInt(localStorage.getItem('blendIt_maxLevel') || '0', 10);
      if (state.level > prev) localStorage.setItem('blendIt_maxLevel', String(state.level));
    }
  }, [state.level]);

  // Lock / timed-garbage sounds
  const prevTurnsRef = useRef(0);
  useEffect(() => {
    if (state.turns !== prevTurnsRef.current) {
      if (state.timedGarbageThisTurn) playTimedGarbage();
      else playLock();
    }
    prevTurnsRef.current = state.turns;
  }, [state.turns, state.timedGarbageThisTurn]);

  const openSettings = useCallback(() => {
    setPaused(true);
    setShowSettings(true);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
    setPaused(false);
  }, []);

  const handleRestart = useCallback((level) => {
    restart(level ?? 0);
    setShowColorGuide(true);
    setShowSettings(false);
    setPaused(false);
  }, [restart]);

  // Keyboard
  const handleKey = useCallback((e) => {
    if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key)) e.preventDefault();
    if (showColorGuide || showSettings || state.gameOver) return;
    switch (e.key) {
      case 'ArrowLeft': case 'a': case 'A': playMove(); moveLeft(); break;
      case 'ArrowRight': case 'd': case 'D': playMove(); moveRight(); break;
      case 'ArrowDown': case 's': case 'S': playSoftDrop(); softDrop(); break;
      case 'ArrowUp': case 'w': case 'W': case ' ': playHardDrop(); hardDrop(); break;
      case 'r': case 'R': playHold(); hold(); break;
      case 'Escape': openSettings(); break;
      case 'p': case 'P': setPaused(p => !p); break;
    }
  }, [showColorGuide, showSettings, state.gameOver, moveLeft, moveRight, softDrop, hardDrop, hold, openSettings]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Info calculations
  const { score, level, nextPieceValue, heldValue, holdUsed } = state;
  const nextColor = getTileColor(nextPieceValue);
  const heldColor = heldValue ? getTileColor(heldValue) : null;
  const interval = getDropInterval(level);
  const speedLabel = level === 0 ? 'Manual' : `${(interval / 1000).toFixed(2)}s`;
  let progressPct = 0, needed = null;
  if (level < MAX_LEVEL) {
    const cur = levelThreshold(level);
    const nxt = levelThreshold(level + 1);
    needed = Math.max(0, nxt - score);
    progressPct = Math.min(1, Math.max(0, (score - cur) / (nxt - cur)));
  }

  return (
    <div className="dashboard gd-root">
      <div className="dashboard-bg" />

      {/* Left — board inside player card */}
      <div className="gd-card-wrap">
        <div
          className="dashboard-player-card gd-board-card"
          style={{ '--gd-cell': `min(29px, calc((88svh - 12px) / 20))` }}
        >
          <GameBoard state={state} animSpeed={animSpeed} />
        </div>

        {/* Pause button below board */}
        <button
          className="gd-pause-btn"
          onClick={() => paused ? setPaused(false) : setPaused(true)}
        >
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>

      {/* Center — NEXT column + info */}
      <div className="gd-center">
        {/* NEXT previews column */}
        <div className="gd-next-col">
          {[nextPieceValue, null, null, null, null].map((val, i) => {
            const c = val ? getTileColor(val) : null;
            return (
              <div key={i} className="gd-next-box">
                <span className="gd-next-label">NEXT</span>
                <div
                  className="gd-next-tile"
                  style={{ background: c ? c.bg : 'transparent', border: c ? 'none' : '1.5px dashed #334155' }}
                />
              </div>
            );
          })}
        </div>

        {/* Info column */}
        <div className="gd-info-col">
          {/* Score */}
          <div className="gd-info-block">
            <span className="gd-info-label">SCORE</span>
            <span className="gd-info-value">{formatScore(score)}</span>
          </div>

          {/* Level + speed */}
          <div className="gd-row-pair">
            <div className="gd-info-block gd-half">
              <span className="gd-info-label">LEVEL</span>
              <span className="gd-info-value gd-red">{level === 0 ? 'N/A' : level}</span>
            </div>
            <div className="gd-info-block gd-half">
              <span className="gd-info-label">NEXT LEVEL</span>
              <div className="gd-progress-track">
                <div className="gd-progress-fill" style={{ width: `${progressPct * 100}%` }} />
              </div>
              <span className="gd-progress-label">{needed !== null ? `${formatScore(needed)} to go` : 'Max'}</span>
            </div>
          </div>

          {/* Hold */}
          <div className="gd-info-block">
            <span className="gd-info-label">HOLD</span>
            <div
              className="gd-hold-tile"
              style={{
                background: heldColor ? heldColor.bg : 'transparent',
                border: heldColor ? 'none' : '1.5px dashed #334155',
                opacity: holdUsed ? 0.4 : 1,
              }}
            />
          </div>
        </div>
      </div>

      {/* Right — nav sidebar */}
      <nav className="dashboard-nav">
        {NAV_ITEMS.map(item => {
          const isSettings = item === 'SETTINGS';
          const isActive = isSettings && showSettings;
          return (
            <button
              key={item}
              className={`dashboard-nav-btn${isActive ? ' dashboard-nav-active' : ''}${!isSettings ? ' gd-nav-disabled' : ''}`}
              onClick={isSettings ? openSettings : undefined}
              disabled={!isSettings}
            >
              {item}
            </button>
          );
        })}
      </nav>

      {showColorGuide && (
        <ColorSequenceModal onClose={() => setShowColorGuide(false)} actionLabel="Play!" />
      )}

      {showSettings && (
        <SettingsModal
          onClose={closeSettings}
          animSpeed={animSpeed} onAnimSpeed={onAnimSpeed}
          soundEnabled={soundEnabled} onSoundEnabled={onSoundEnabled}
          musicEnabled={musicEnabled} onMusicEnabled={onMusicEnabled}
          onReset={() => handleRestart(0)}
          checkpointLevel={Math.floor(state.level / 5) * 5}
          onLoadLevel={(lvl) => handleRestart(lvl)}
        />
      )}

      {/* Pause overlay */}
      {paused && !showSettings && (
        <div className="gd-pause-overlay">
          <div className="gd-pause-text">PAUSED</div>
          <button className="gd-pause-resume-btn" onClick={() => setPaused(false)}>▶ Resume</button>
        </div>
      )}
    </div>
  );
}
