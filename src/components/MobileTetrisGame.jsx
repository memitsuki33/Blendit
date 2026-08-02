import React, { useState, useEffect, useRef } from 'react';
import { useTetrisEngine } from '../hooks/useTetrisEngine.js';
import TetrisBoard, { PiecePreview } from './TetrisBoard.jsx';
import ColorSequenceModal from './ColorSequenceModal.jsx';
import SettingsModal from './SettingsModal.jsx';
import { formatScore } from '../utils/colors.js';
import {
  playMove, playHardDrop, playSoftDrop, playHold, playLock,
} from '../utils/soundEffects.js';

export default function MobileTetrisGame({
  onBack,
  startLevel = 1,
  startScore = 0,
  animSpeed = 'normal', onAnimSpeed,
  soundEnabled, onSoundEnabled,
  musicEnabled, onMusicEnabled,
}) {
  const [showSettings, setShowSettings] = useState(false);

  const { state, moveLeft, moveRight, softDrop, hardDrop, rotate, hold, restart } =
    useTetrisEngine({ startLevel, startScore, paused: showSettings, gravity: true });

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

  // Persist max level reached
  useEffect(() => {
    if (state.level > 0) {
      const prev = parseInt(localStorage.getItem('blendIt_maxLevel') || '0', 10);
      if (state.level > prev) {
        localStorage.setItem('blendIt_maxLevel', String(state.level));
      }
    }
  }, [state.level]);

  const blocked = state.gameOver || showSettings;

  const handleLeft    = () => { if (blocked) return; flashPress('left');   playMove();     moveLeft(); };
  const handleRight   = () => { if (blocked) return; flashPress('right');  playMove();     moveRight(); };
  const handleSoft    = () => { if (blocked) return; flashPress('soft');   playSoftDrop(); softDrop(); };
  const handleHard    = () => { if (blocked) return; flashPress('hard');   playHardDrop(); hardDrop(); };
  const handleRotate  = () => { if (blocked) return; flashPress('rotate'); playMove();     rotate(); };
  const handleHold    = () => { if (blocked) return; flashPress('hold');   playHold();     hold(); };

  const handleRestart = () => restart(startLevel);

  const ctrlClass = (key, extra = '') =>
    `msp-ctrl-btn${pressedKey === key ? ' msp-ctrl-pressed' : ''}${extra ? ' ' + extra : ''}`;

  const { score, level, linesCleared = 0, nextPieceType, nextPieceColors, heldPiece, holdUsed } = state;

  return (
    <div className="msp-root">

      {/* ── Board ── */}
      <div className="msp-board-area">
        <TetrisBoard state={state} animSpeed={animSpeed} />
      </div>

      {/* ── NEXT row: real piece preview + 4 empty slots ── */}
      <div className="msp-next-row">
        {/* First slot — actual next piece */}
        <div className="msp-next-slot">
          <span className="msp-slot-label">NEXT</span>
          <div className="msp-tetris-preview">
            <PiecePreview type={nextPieceType} colors={nextPieceColors} cellSize={10} />
          </div>
        </div>

        {/* Slots 1–4 — locked placeholders */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="msp-next-slot">
            <span className="msp-slot-label">NEXT</span>
            <div className="msp-slot-tile msp-slot-tile-empty" />
          </div>
        ))}
      </div>

      {/* ── Info row ── */}
      <div className="msp-info-row">
        <div className="msp-info-chip">
          <span className="msp-chip-label">SCORE</span>
          <span className="msp-chip-val">{formatScore(score)}</span>
        </div>

        <div className="msp-info-chip">
          <span className="msp-chip-label">LEVEL</span>
          <span className="msp-chip-val msp-chip-val-red">{level}</span>
        </div>

        <div className="msp-info-chip">
          <span className="msp-chip-label">LINES</span>
          <span className="msp-chip-val">{linesCleared}</span>
        </div>

        {/* Hold display */}
        <div className="msp-info-chip">
          <span className="msp-chip-label">HOLD</span>
          <div
            className="msp-tetris-hold"
            style={{ opacity: holdUsed ? 0.4 : 1 }}
          >
            {heldPiece
              ? <PiecePreview type={heldPiece.type} colors={heldPiece.colors} cellSize={8} />
              : <div className="msp-hold-mini" style={{ border: '1px dashed var(--border)', background: 'transparent' }} />
            }
          </div>
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

      {/* ── Bottom touch controls (6 buttons) ── */}
      {/* Order: HOLD | hard-drop (yellow) | ROTATE | ◀ | ▼ | ▶ */}
      <div className="msp-controls">
        {state.gameOver ? (
          <button className="btn btn-primary msp-restart-btn" onClick={handleRestart}>
            Play Again
          </button>
        ) : (
          <>
            <button className={ctrlClass('hold')}   onPointerDown={tap('hold',   handleHold)}>HOLD</button>
            <button className={ctrlClass('hard', 'msp-ctrl-hard')} onPointerDown={tap('hard', handleHard)} />
            <button className={ctrlClass('rotate')} onPointerDown={tap('rotate', handleRotate)}>↻</button>
            <button className={ctrlClass('left')}   onPointerDown={tap('left',   handleLeft)}>◀</button>
            <button className={ctrlClass('soft')}   onPointerDown={tap('soft',   handleSoft)}>▼</button>
            <button className={ctrlClass('right')}  onPointerDown={tap('right',  handleRight)}>▶</button>
          </>
        )}
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
          onReset={handleRestart}
        />
      )}
    </div>
  );
}
