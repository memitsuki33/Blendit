import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.js';
import GameBoard from './GameBoard.jsx';
import InfoPanel from './InfoPanel.jsx';
import ColorSequenceModal from './ColorSequenceModal.jsx';
import SettingsModal from './SettingsModal.jsx';
import { getTileColor, formatScore } from '../utils/colors.js';
import { getDropInterval, levelThreshold, MAX_LEVEL } from '../utils/constants.js';
import { playMove, playHardDrop, playSoftDrop, playHold, playLock, playTimedGarbage } from '../utils/soundEffects.js';

export default function SinglePlayerGame({
  onBack,
  startLevel = 0,
  startScore = 0,
  animSpeed = 'normal', onAnimSpeed,
  soundEnabled, onSoundEnabled,
  musicEnabled, onMusicEnabled,
}) {
  // ── All hooks first (no conditional returns before this) ────────────────
  const { state, moveLeft, moveRight, softDrop, hardDrop, hold, restart } = useGameEngine({
    startLevel,
    startScore,
    mode: 'single',
  });

  const [showColorGuide, setShowColorGuide] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const touchStartRef = useRef(null);

  // Persist max level reached
  useEffect(() => {
    if (state.level > 0) {
      const prev = parseInt(localStorage.getItem('blendIt_maxLevel') || '0', 10);
      if (state.level > prev) localStorage.setItem('blendIt_maxLevel', String(state.level));
    }
  }, [state.level]);

  // Lock + timed garbage sounds
  const prevTurnsRef = useRef(0);
  useEffect(() => {
    if (state.turns !== prevTurnsRef.current) {
      if (state.timedGarbageThisTurn) playTimedGarbage();
      else playLock();
    }
    prevTurnsRef.current = state.turns;
  }, [state.turns, state.timedGarbageThisTurn]);

  const handleKey = useCallback((e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) e.preventDefault();
    if (showColorGuide || showSettings || state.gameOver) return;
    switch (e.key) {
      case 'ArrowLeft':  case 'a': case 'A': playMove(); moveLeft();   break;
      case 'ArrowRight': case 'd': case 'D': playMove(); moveRight();  break;
      case 'ArrowDown':  case 's': case 'S': playSoftDrop(); softDrop(); break;
      case 'ArrowUp':   case 'w': case 'W':
      case ' ': playHardDrop(); hardDrop(); break;
      case 'r': case 'R': playHold(); hold(); break;
      case 'Escape': setShowSettings(s => !s); break;
    }
  }, [showColorGuide, showSettings, state.gameOver, moveLeft, moveRight, softDrop, hardDrop, hold]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Touch controls
  const handleTouchStart = useCallback((e) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartRef.current || showColorGuide || showSettings || state.gameOver) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    touchStartRef.current = null;

    if (absDx < 15 && absDy < 15) {
      // Tap → hard drop
      playHardDrop(); hardDrop();
    } else if (absDx > absDy && absDx > 20) {
      // Horizontal swipe
      if (dx > 0) { playMove(); moveRight(); } else { playMove(); moveLeft(); }
    } else if (dy > 40) {
      // Swipe down — fast = hard drop, slow = soft drop
      if (absDy > 100 && dt < 250) { playHardDrop(); hardDrop(); }
      else { playSoftDrop(); softDrop(); }
    }
  }, [showColorGuide, showSettings, state.gameOver, moveLeft, moveRight, softDrop, hardDrop]);

  const handleRestart = useCallback((level) => {
    restart(level ?? 0);
    setShowColorGuide(true);
  }, [restart]);

  const checkpointLevel = Math.floor(state.level / 5) * 5;

  // Derived for mobile sidebar
  const { score, level, nextPieceValue, heldValue, holdUsed } = state;
  const nextColor  = getTileColor(nextPieceValue);
  const heldColor  = heldValue ? getTileColor(heldValue) : null;
  let progressPct = 0, needed = null;
  if (level < MAX_LEVEL) {
    const cur = levelThreshold(level), nxt = levelThreshold(level + 1);
    needed = Math.max(0, nxt - score);
    progressPct = Math.min(1, Math.max(0, (score - cur) / (nxt - cur)));
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="mg-page-root">

      {/* ═══ DESKTOP layout ═══ */}
      <div className="mg-desktop-wrap">
        <button
          className="btn btn-ghost btn-sm"
          style={{ position: 'fixed', top: 12, left: 12, zIndex: 50 }}
          onClick={onBack}
        >Back</button>

        <button
          className="btn btn-ghost btn-sm"
          style={{ position: 'fixed', top: 12, right: 12, zIndex: 50 }}
          onClick={() => setShowSettings(true)}
          title="Settings (Esc)"
        >Settings</button>

        <div className="game-wrapper">
          <div className="player-section">
            <GameBoard state={state} animSpeed={animSpeed} hidden={showSettings} />
          </div>
          <InfoPanel state={state} mode="single" onRestart={() => handleRestart(0)} />
        </div>
      </div>

      {/* ═══ MOBILE layout ═══ */}
      <div className="mg-root">
        <div className="dashboard-bg" />

        <div className="mg-main">
          {/* Board — touch target */}
          <div
            className="mg-board"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <GameBoard state={state} animSpeed={animSpeed} hidden={showSettings} />
          </div>

          {/* Right sidebar */}
          <div className="mg-sidebar">
            {/* Single NEXT box */}
            <div className="mg-next-box">
              <span className="mg-next-label">NEXT</span>
              <div className="mg-next-tile" style={{ background: nextColor.bg }} />
            </div>
            {/* Filler NEXT boxes */}
            {[1,2,3,4].map(i => (
              <div key={i} className="mg-next-box">
                <span className="mg-next-label">NEXT</span>
                <div className="mg-next-tile locked" />
              </div>
            ))}

            {/* Score */}
            <div className="mg-info-box">
              <span className="mg-info-label">SCORE</span>
              <span className="mg-info-value">{formatScore(score)}</span>
            </div>

            {/* Level */}
            <div className="mg-info-box">
              <span className="mg-info-label">LEVEL</span>
              <span className="mg-info-value mg-red">{level}</span>
            </div>

            {/* Hold */}
            <div className="mg-info-box">
              <span className="mg-info-label">HOLD</span>
              <div className="mg-hold-tile" style={{
                background: heldColor ? heldColor.bg : 'transparent',
                border: heldColor ? 'none' : '1.5px dashed #334155',
                opacity: holdUsed ? 0.4 : 1,
              }} />
            </div>

            {/* Settings */}
            <button className="mg-btn" onClick={() => setShowSettings(true)}>SETTINGS</button>

            {/* Menu */}
            <button className="mg-btn" onClick={onBack}>MENU</button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mg-bar">
          <button
            className="mg-hold-btn"
            onTouchStart={(e) => { e.stopPropagation(); playHold(); hold(); }}
          >HOLD</button>
          {/* held color square */}
          <div className="mg-color-sq" style={{
            background: heldColor ? heldColor.bg : '#0d1b2e',
            opacity: holdUsed ? 0.4 : 1,
          }} />
          {/* next piece square */}
          <div className="mg-color-sq" style={{ background: nextColor.bg }} />
          {/* 3 dark filler squares */}
          {[0,1,2].map(i => <div key={i} className="mg-color-sq" />)}
        </div>

        {/* Game over overlay */}
        {state.gameOver && (
          <div className="mg-gameover">
            <div className="mg-gameover-title">GAME OVER</div>
            <div className="mg-gameover-score">{formatScore(score)}</div>
            <button className="mg-btn mg-gameover-btn" onClick={() => handleRestart(0)}>Play Again</button>
            <button className="mg-btn" onClick={onBack}>Menu</button>
          </div>
        )}
      </div>

      {/* Shared modals */}
      {showColorGuide && (
        <ColorSequenceModal onClose={() => setShowColorGuide(false)} actionLabel="Play!" />
      )}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          animSpeed={animSpeed} onAnimSpeed={onAnimSpeed}
          soundEnabled={soundEnabled} onSoundEnabled={onSoundEnabled}
          musicEnabled={musicEnabled} onMusicEnabled={onMusicEnabled}
          onReset={() => handleRestart(0)}
          checkpointLevel={checkpointLevel}
          onLoadLevel={(lvl) => handleRestart(lvl)}
        />
      )}
    </div>
  );
}
