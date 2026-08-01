import React, { useState, useEffect, useRef } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.js';
import GameBoard from './GameBoard.jsx';
import ColorSequenceModal from './ColorSequenceModal.jsx';
import SettingsModal from './SettingsModal.jsx';
import { getTileColor, formatScore } from '../utils/colors.js';
import { playMove, playHardDrop, playSoftDrop, playHold, playTimedGarbage } from '../utils/soundEffects.js';

export default function MobileSinglePlayerGame({
  onBack,
  startLevel = 0,
  animSpeed = 'normal', onAnimSpeed,
  soundEnabled, onSoundEnabled,
  musicEnabled, onMusicEnabled,
}) {
  const { state, moveLeft, moveRight, softDrop, hardDrop, hold, restart } = useGameEngine({
    startLevel,
    mode: 'single',
  });

  const [showColorGuide, setShowColorGuide] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Persist max level reached for level-jump unlocks
  useEffect(() => {
    if (state.level > 0) {
      const prev = parseInt(localStorage.getItem('blendIt_maxLevel') || '0', 10);
      if (state.level > prev) {
        localStorage.setItem('blendIt_maxLevel', String(state.level));
      }
    }
  }, [state.level]);

  // Timed garbage sound
  const prevTurnsRef = useRef(0);
  useEffect(() => {
    if (state.timedGarbageThisTurn && state.turns !== prevTurnsRef.current) {
      playTimedGarbage();
    }
    prevTurnsRef.current = state.turns;
  }, [state.turns, state.timedGarbageThisTurn]);

  const nextColor = getTileColor(state.nextPieceValue);
  const heldColor = state.heldValue ? getTileColor(state.heldValue) : null;
  const holdUsed = state.holdUsed ?? false;

  const blocked = state.gameOver || showColorGuide || showSettings;

  const handleLeft      = () => { if (blocked) return; playMove();     moveLeft(); };
  const handleRight     = () => { if (blocked) return; playMove();     moveRight(); };
  const handleSoftDrop  = () => { if (blocked) return; playSoftDrop(); softDrop(); };
  const handleHardDrop  = () => { if (blocked) return; playHardDrop(); hardDrop(); };
  const handleHold      = () => { if (blocked) return; playHold();     hold(); };

  const handleRestart = () => {
    restart(0);
    setShowColorGuide(true);
  };

  // Wrap touch handlers to prevent ghost clicks
  const touch = (fn) => (e) => { e.preventDefault(); fn(); };

  return (
    <div className="msp-root">
      {/* ── Main area: board (left) + right panel ── */}
      <div className="msp-main">

        {/* Game board */}
        <div className="msp-board-area">
          <GameBoard state={state} animSpeed={animSpeed} />
        </div>

        {/* Right panel */}
        <div className="msp-right">

          {/* 5 NEXT slots — first is real, rest are empty placeholders */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="msp-panel-box">
              <span className="msp-panel-label">NEXT</span>
              {i === 0 ? (
                <div
                  className="msp-panel-tile"
                  style={{ backgroundColor: nextColor.bg }}
                />
              ) : (
                <div className="msp-panel-tile msp-panel-tile-empty" />
              )}
            </div>
          ))}

          {/* Score */}
          <div className="msp-panel-box">
            <span className="msp-panel-label">SCORE</span>
            <span className="msp-panel-val">{formatScore(state.score)}</span>
          </div>

          {/* Level */}
          <div className="msp-panel-box">
            <span className="msp-panel-label">LEVEL</span>
            <span className="msp-panel-val msp-panel-val-red">{state.level}</span>
          </div>

          {/* Hold display */}
          <div className="msp-panel-box">
            <span className="msp-panel-label">HOLD</span>
            <div
              className="msp-panel-tile"
              style={{
                backgroundColor: heldColor ? heldColor.bg : 'transparent',
                border: heldColor ? 'none' : '1.5px dashed var(--border)',
                opacity: holdUsed ? 0.4 : 1,
              }}
            />
          </div>

          {/* Settings */}
          <button
            className="msp-side-btn"
            onTouchStart={touch(() => setShowSettings(true))}
            onClick={() => setShowSettings(true)}
          >
            SETTINGS
          </button>

          {/* Menu */}
          <button
            className="msp-side-btn msp-side-btn-pill"
            onTouchStart={touch(onBack)}
            onClick={onBack}
          >
            MENU
          </button>
        </div>
      </div>

      {/* ── Bottom touch controls ── */}
      <div className="msp-controls">
        {state.gameOver ? (
          <button className="btn btn-primary msp-restart-btn" onClick={handleRestart}>
            Restart
          </button>
        ) : (
          <>
            {/* HOLD */}
            <button
              className="msp-ctrl-btn"
              onTouchStart={touch(handleHold)}
              onClick={handleHold}
            >
              HOLD
            </button>

            {/* Hard drop — yellow */}
            <button
              className="msp-ctrl-btn msp-ctrl-hard"
              onTouchStart={touch(handleHardDrop)}
              onClick={handleHardDrop}
            />

            {/* Left */}
            <button
              className="msp-ctrl-btn"
              onTouchStart={touch(handleLeft)}
              onClick={handleLeft}
            >
              ◀
            </button>

            {/* Soft drop */}
            <button
              className="msp-ctrl-btn"
              onTouchStart={touch(handleSoftDrop)}
              onClick={handleSoftDrop}
            >
              ▼
            </button>

            {/* Right */}
            <button
              className="msp-ctrl-btn"
              onTouchStart={touch(handleRight)}
              onClick={handleRight}
            >
              ▶
            </button>
          </>
        )}
      </div>

      {showColorGuide && (
        <ColorSequenceModal onClose={() => setShowColorGuide(false)} actionLabel="Play!" />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          animSpeed={animSpeed}
          onAnimSpeed={onAnimSpeed}
          soundEnabled={soundEnabled}
          onSoundEnabled={onSoundEnabled}
          musicEnabled={musicEnabled}
          onMusicEnabled={onMusicEnabled}
          onReset={handleRestart}
        />
      )}
    </div>
  );
}
