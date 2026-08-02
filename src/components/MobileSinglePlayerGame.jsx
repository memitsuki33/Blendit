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

  // Visual press feedback
  const [pressedKey, setPressedKey] = useState(null);
  const pressTimer = useRef(null);
  const flashPress = (key) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setPressedKey(key);
    pressTimer.current = setTimeout(() => setPressedKey(null), 100);
  };

  // Per-button 100 ms cooldown. tap() is used on onPointerDown only — no onClick
  // on game buttons, so each physical press can only fire once.
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
  const holdUsed = state.holdUsed ?? false;
  const blocked = state.gameOver || showColorGuide || showSettings;

  const handleLeft     = () => { if (blocked) return; flashPress('left');  playMove();     moveLeft(); };
  const handleRight    = () => { if (blocked) return; flashPress('right'); playMove();     moveRight(); };
  const handleSoftDrop = () => { if (blocked) return; flashPress('soft');  playSoftDrop(); softDrop(); };
  const handleHardDrop = () => { if (blocked) return; flashPress('hard');  playHardDrop(); hardDrop(); };
  const handleHold     = () => { if (blocked) return; flashPress('hold');  playHold();     hold(); };

  const handleRestart = () => { restart(0); setShowColorGuide(true); };

  const ctrlClass = (key, extra = '') =>
    `msp-ctrl-btn${pressedKey === key ? ' msp-ctrl-pressed' : ''}${extra ? ' ' + extra : ''}`;

  return (
    <div className="msp-root">

      {/* ── Board — full width, takes all remaining height ── */}
      <div className="msp-board-area">
        <GameBoard state={state} animSpeed={animSpeed} />
      </div>

      {/* ── NEXT row — 5 tiles horizontal ── */}
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

      {/* ── Info row: score | level | hold display | settings | menu ── */}
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

        <button
          className="msp-info-btn"
          onTouchStart={touch(() => setShowSettings(true))}
          onClick={() => setShowSettings(true)}
        >
          SETTINGS
        </button>

        <button
          className="msp-info-btn msp-info-btn-pill"
          onTouchStart={touch(onBack)}
          onClick={onBack}
        >
          MENU
        </button>
      </div>

      {/* ── Bottom touch controls ── */}
      <div className="msp-controls">
        {state.gameOver ? (
          <button className="btn btn-primary msp-restart-btn" onClick={handleRestart}>
            Restart
          </button>
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
