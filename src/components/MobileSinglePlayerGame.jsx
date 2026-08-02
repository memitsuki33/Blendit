import React, { useState, useEffect, useRef } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.js';
import { useSwipeControls } from '../hooks/useSwipeControls.js';
import GameBoard from './GameBoard.jsx';
import ColorSequenceModal from './ColorSequenceModal.jsx';
import SettingsModal from './SettingsModal.jsx';
import MobilePreGameModal from './MobilePreGameModal.jsx';
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

  const [showPreGame,   setShowPreGame]   = useState(true);
  const [controlMode,   setControlMode]   = useState(
    () => localStorage.getItem('blendIt_controlMode') || 'button'
  );
  const [showColorGuide, setShowColorGuide] = useState(false); // shown AFTER pre-game
  const [showSettings,   setShowSettings]   = useState(false);

  // Visual press feedback (button mode)
  const [pressedKey, setPressedKey] = useState(null);
  const pressTimer = useRef(null);
  const flashPress = (key) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setPressedKey(key);
    pressTimer.current = setTimeout(() => setPressedKey(null), 100);
  };

  // Per-button 100 ms cooldown — onPointerDown only, no onClick on game buttons
  const cooldownMap = useRef({});
  const tap = (key, fn) => (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - (cooldownMap.current[key] || 0) < 100) return;
    cooldownMap.current[key] = now;
    fn();
  };

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
  const holdUsed  = state.holdUsed ?? false;
  const blocked   = state.gameOver || showColorGuide || showSettings || showPreGame;

  // Game actions
  const handleLeft     = () => { if (blocked) return; flashPress('left');  playMove();     moveLeft(); };
  const handleRight    = () => { if (blocked) return; flashPress('right'); playMove();     moveRight(); };
  const handleSoftDrop = () => { if (blocked) return; flashPress('soft');  playSoftDrop(); softDrop(); };
  const handleHardDrop = () => { if (blocked) return; flashPress('hard');  playHardDrop(); hardDrop(); };
  const handleHold     = () => { if (blocked) return; flashPress('hold');  playHold();     hold(); };
  const handleRestart  = () => { restart(0); setShowColorGuide(true); };

  // Swipe controls — normal mode
  //   ← → swipe  = move
  //   ↓  swipe   = hard drop
  //   ↑  swipe   = (no rotate in normal mode — unused)
  //   tap        = hold
  const swipeHandlers = useSwipeControls({
    enabled: controlMode === 'swipe' && !blocked,
    onLeft:  handleLeft,
    onRight: handleRight,
    onDown:  handleHardDrop,
    onTap:   handleHold,
  });

  const ctrlClass = (key, extra = '') =>
    `msp-ctrl-btn${pressedKey === key ? ' msp-ctrl-pressed' : ''}${extra ? ' ' + extra : ''}`;

  function handlePreGameReady(chosenMode) {
    setControlMode(chosenMode);
    setShowPreGame(false);
    setShowColorGuide(true); // show color guide after control selection
  }

  function handleControlModeChange(newMode) {
    setControlMode(newMode);
    localStorage.setItem('blendIt_controlMode', newMode);
  }

  return (
    <div className={`msp-root${controlMode === 'swipe' ? ' msp-swipe-mode' : ''}`}>

      {/* ── Board ── */}
      <div
        className={`msp-board-area${controlMode === 'swipe' ? ' msp-board-swipe' : ''}`}
        {...(controlMode === 'swipe' ? swipeHandlers : {})}
      >
        <GameBoard state={state} animSpeed={animSpeed} />
        {controlMode === 'swipe' && !state.gameOver && !showColorGuide && !showSettings && (
          <div className="swipe-hint">← → move · ↓ hard drop · tap hold</div>
        )}
      </div>

      {/* ── NEXT row ── */}
      <div className="msp-next-row">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="msp-next-slot">
            <span className="msp-slot-label">NEXT</span>
            {i === 0 ? (
              <div className="msp-slot-tile" style={{ backgroundColor: nextColor.bg }} />
            ) : (
              <div className="msp-slot-tile msp-slot-tile-empty" />
            )}
          </div>
        ))}
      </div>

      {/* ── Info row ── */}
      <div className="msp-info-row">
        <div className="msp-info-chip">
          <span className="msp-chip-label">SCORE</span>
          <span className="msp-chip-val">{formatScore(state.score)}</span>
        </div>
        <div className="msp-info-chip">
          <span className="msp-chip-label">LEVEL</span>
          <span className="msp-chip-val msp-chip-val-red">{state.level}</span>
        </div>
        <div className="msp-info-chip">
          <span className="msp-chip-label">HOLD</span>
          <div
            className="msp-hold-mini"
            style={{
              backgroundColor: heldColor ? heldColor.bg : 'transparent',
              border: heldColor ? 'none' : '1px dashed var(--border)',
              opacity: holdUsed ? 0.4 : 1,
            }}
          />
        </div>
        <button className="msp-info-btn" onClick={() => setShowSettings(true)}>SETTINGS</button>
        <button className="msp-info-btn msp-info-btn-pill" onClick={onBack}>MENU</button>
      </div>

      {/* ── Button controls (hidden in swipe mode) ── */}
      {controlMode === 'button' && (
        <div className="msp-controls">
          {state.gameOver ? (
            <button className="btn btn-primary msp-restart-btn" onClick={handleRestart}>Restart</button>
          ) : (
            <>
              <button className={ctrlClass('hold')}  onPointerDown={tap('hold', handleHold)}>HOLD</button>
              <button className={ctrlClass('hard', 'msp-ctrl-hard')} onPointerDown={tap('hard', handleHardDrop)} />
              <button className={ctrlClass('left')}  onPointerDown={tap('left', handleLeft)}>◀</button>
              <button className={ctrlClass('soft')}  onPointerDown={tap('soft', handleSoftDrop)}>▼</button>
              <button className={ctrlClass('right')} onPointerDown={tap('right', handleRight)}>▶</button>
            </>
          )}
        </div>
      )}

      {/* Swipe mode game-over restart */}
      {controlMode === 'swipe' && state.gameOver && (
        <div className="msp-controls">
          <button className="btn btn-primary msp-restart-btn" onClick={handleRestart}>Restart</button>
        </div>
      )}

      {/* ── Modals ── */}
      {showPreGame && (
        <MobilePreGameModal gameType="normal" onReady={handlePreGameReady} />
      )}

      {showColorGuide && (
        <ColorSequenceModal onClose={() => setShowColorGuide(false)} actionLabel="Play!" />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          animSpeed={animSpeed}     onAnimSpeed={onAnimSpeed}
          soundEnabled={soundEnabled} onSoundEnabled={onSoundEnabled}
          musicEnabled={musicEnabled} onMusicEnabled={onMusicEnabled}
          controlMode={controlMode}   onControlMode={handleControlModeChange}
          gameType="normal"
          onReset={handleRestart}
        />
      )}
    </div>
  );
}
