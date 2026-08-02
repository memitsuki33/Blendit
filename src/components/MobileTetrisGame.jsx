import React, { useState, useEffect, useRef } from 'react';
import { useTetrisEngine } from '../hooks/useTetrisEngine.js';
import { useSwipeControls } from '../hooks/useSwipeControls.js';
import TetrisBoard, { PiecePreview } from './TetrisBoard.jsx';
import SettingsModal from './SettingsModal.jsx';
import MobilePreGameModal from './MobilePreGameModal.jsx';
import { formatScore } from '../utils/colors.js';
import { playMove, playHardDrop, playSoftDrop, playHold } from '../utils/soundEffects.js';

export default function MobileTetrisGame({
  onBack,
  startLevel = 1,
  startScore = 0,
  animSpeed = 'normal', onAnimSpeed,
  soundEnabled, onSoundEnabled,
  musicEnabled, onMusicEnabled,
}) {
  const [showPreGame,  setShowPreGame]  = useState(true);
  const [controlMode,  setControlMode]  = useState(
    () => localStorage.getItem('blendIt_controlMode') || 'button'
  );
  const [showSettings, setShowSettings] = useState(false);

  const { state, moveLeft, moveRight, softDrop, hardDrop, rotate, hold, restart } =
    useTetrisEngine({ startLevel, startScore, paused: showSettings || showPreGame, gravity: true });

  // Visual press feedback (button mode)
  const [pressedKey, setPressedKey] = useState(null);
  const pressTimer = useRef(null);
  const flashPress = (key) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setPressedKey(key);
    pressTimer.current = setTimeout(() => setPressedKey(null), 100);
  };

  // Per-button 100 ms cooldown
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

  const blocked = state.gameOver || showSettings || showPreGame;

  // Game actions
  const handleLeft   = () => { if (blocked) return; flashPress('left');   playMove();     moveLeft(); };
  const handleRight  = () => { if (blocked) return; flashPress('right');  playMove();     moveRight(); };
  const handleSoft   = () => { if (blocked) return; flashPress('soft');   playSoftDrop(); softDrop(); };
  const handleHard   = () => { if (blocked) return; flashPress('hard');   playHardDrop(); hardDrop(); };
  const handleRotate = () => { if (blocked) return; flashPress('rotate'); playMove();     rotate(); };
  const handleHold   = () => { if (blocked) return; flashPress('hold');   playHold();     hold(); };
  const handleRestart = () => restart(startLevel);

  // Swipe controls — tetris mode
  //   ← → swipe  = move
  //   ↓  swipe   = hard drop
  //   ↑  swipe   = rotate
  //   tap        = hold
  const swipeHandlers = useSwipeControls({
    enabled: controlMode === 'swipe' && !blocked,
    onLeft:  handleLeft,
    onRight: handleRight,
    onDown:  handleHard,
    onUp:    handleRotate,
    onTap:   handleHold,
  });

  const ctrlClass = (key, extra = '') =>
    `msp-ctrl-btn${pressedKey === key ? ' msp-ctrl-pressed' : ''}${extra ? ' ' + extra : ''}`;

  const { score, level, linesCleared = 0, nextPieceType, nextPieceColors, heldPiece, holdUsed } = state;

  function handlePreGameReady(chosenMode) {
    setControlMode(chosenMode);
    setShowPreGame(false);
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
        <TetrisBoard state={state} animSpeed={animSpeed} />
        {controlMode === 'swipe' && !state.gameOver && !showSettings && (
          <div className="swipe-hint">← → move · ↓ drop · ↑ rotate · tap hold</div>
        )}
      </div>

      {/* ── NEXT row ── */}
      <div className="msp-next-row">
        <div className="msp-next-slot">
          <span className="msp-slot-label">NEXT</span>
          <div className="msp-tetris-preview">
            <PiecePreview type={nextPieceType} colors={nextPieceColors} cellSize={10} />
          </div>
        </div>
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
        <div className="msp-info-chip">
          <span className="msp-chip-label">HOLD</span>
          <div className="msp-tetris-hold" style={{ opacity: holdUsed ? 0.4 : 1 }}>
            {heldPiece
              ? <PiecePreview type={heldPiece.type} colors={heldPiece.colors} cellSize={8} />
              : <div className="msp-hold-mini" style={{ border: '1px dashed var(--border)', background: 'transparent' }} />
            }
          </div>
        </div>
        <button className="msp-info-btn" onClick={() => setShowSettings(true)}>SETTINGS</button>
        <button className="msp-info-btn msp-info-btn-pill" onClick={onBack}>MENU</button>
      </div>

      {/* ── Button controls (hidden in swipe mode) ── */}
      {controlMode === 'button' && (
        <div className="msp-controls">
          {state.gameOver ? (
            <button className="btn btn-primary msp-restart-btn" onClick={handleRestart}>Play Again</button>
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
      )}

      {/* Swipe mode game-over restart */}
      {controlMode === 'swipe' && state.gameOver && (
        <div className="msp-controls">
          <button className="btn btn-primary msp-restart-btn" onClick={handleRestart}>Play Again</button>
        </div>
      )}

      {/* ── Modals ── */}
      {showPreGame && (
        <MobilePreGameModal gameType="tetris" onReady={handlePreGameReady} />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          animSpeed={animSpeed}     onAnimSpeed={onAnimSpeed}
          soundEnabled={soundEnabled} onSoundEnabled={onSoundEnabled}
          musicEnabled={musicEnabled} onMusicEnabled={onMusicEnabled}
          controlMode={controlMode}   onControlMode={handleControlModeChange}
          gameType="tetris"
          onReset={handleRestart}
        />
      )}
    </div>
  );
}
