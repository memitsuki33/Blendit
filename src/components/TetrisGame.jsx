import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useTetrisEngine } from '../hooks/useTetrisEngine.js';
import TetrisBoard, { PiecePreview } from './TetrisBoard.jsx';
import { formatScore } from '../utils/colors.js';
import { playMove, playHardDrop, playSoftDrop, playHold, playLock } from '../utils/soundEffects.js';

export default function TetrisGame({
  onBack,
  startLevel = 1,
  animSpeed = 'normal',
}) {
  const { state, moveLeft, moveRight, softDrop, hardDrop, rotate, rotateCCW, hold, restart } = useTetrisEngine({
    startLevel,
  });

  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Lock sound on each turn
  const prevTurnsRef = useRef(0);
  useEffect(() => {
    if (state.turns !== prevTurnsRef.current) {
      playLock();
      prevTurnsRef.current = state.turns;
    }
  }, [state.turns]);

  const handleKey = useCallback(
    (e) => {
      if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key)) e.preventDefault();
      if (state.gameOver) return;

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setPaused(p => !p);
        return;
      }
      if (pausedRef.current) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a': case 'A': playMove(); moveLeft(); break;
        case 'ArrowRight':
        case 'd': case 'D': playMove(); moveRight(); break;
        case 'ArrowDown':
        case 's': case 'S': playSoftDrop(); softDrop(); break;
        case 'ArrowUp':
        case 'w': case 'W':
        case 'x': case 'X': rotate(); break;
        case 'z': case 'Z': rotateCCW(); break;
        case ' ': playHardDrop(); hardDrop(); break;
        case 'r': case 'R': playHold(); hold(); break;
      }
    },
    [state.gameOver, moveLeft, moveRight, softDrop, hardDrop, rotate, rotateCCW, hold]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const handleRestart = useCallback(() => restart(startLevel), [restart, startLevel]);

  const { heldPiece, nextPieceType, nextPieceColors, score, level, linesCleared, gameOver } = state;

  return (
    <div className="tetris-wrapper">
      {/* ── Left panel: Hold ── */}
      <div className="tetris-side-panel tetris-left-panel">
        <div className="tetris-panel-card">
          <div className="tetris-panel-label">HOLD</div>
          <div className="tetris-preview-wrap">
            {heldPiece
              ? <PiecePreview type={heldPiece.type} colors={heldPiece.colors} cellSize={18} />
              : <div className="tetris-preview-empty" />}
          </div>
        </div>

        <div className="tetris-panel-card tetris-controls-card">
          <div className="tetris-panel-label">CONTROLS</div>
          <div className="tetris-ctrl-grid">
            <span>Move</span>      <span>← → / A D</span>
            <span>Soft drop</span> <span>↓ / S</span>
            <span>Hard drop</span> <span>Space</span>
            <span>Rotate CW</span> <span>↑ / X</span>
            <span>Rotate CCW</span><span>Z</span>
            <span>Hold</span>      <span>R</span>
            <span>Pause</span>     <span>P / Esc</span>
          </div>
        </div>

        <button className="btn btn-ghost btn-sm tetris-back-btn" onClick={onBack}>
          ← Menu
        </button>
      </div>

      {/* ── Center: Board ── */}
      <div className="tetris-board-col">
        <div className="tetris-mode-badge">TETRIS MODE</div>
        <div className="player-section">
          <TetrisBoard state={state} animSpeed={animSpeed} />
        </div>
        {paused && !gameOver && (
          <div className="tetris-pause-overlay">
            <div className="tetris-pause-text">PAUSED</div>
            <button className="btn btn-ghost" onClick={() => setPaused(false)}>Resume (P)</button>
          </div>
        )}
      </div>

      {/* ── Right panel: Stats + Next ── */}
      <div className="tetris-side-panel tetris-right-panel">
        <div className="tetris-panel-card">
          <div className="tetris-panel-label">SCORE</div>
          <div className="tetris-stat-value">{formatScore(score)}</div>
        </div>

        <div className="tetris-panel-card">
          <div className="tetris-panel-label">LEVEL</div>
          <div className="tetris-stat-value">{level}</div>
        </div>

        <div className="tetris-panel-card">
          <div className="tetris-panel-label">LINES</div>
          <div className="tetris-stat-value">{linesCleared}</div>
        </div>

        <div className="tetris-panel-card">
          <div className="tetris-panel-label">NEXT</div>
          <div className="tetris-preview-wrap">
            <PiecePreview type={nextPieceType} colors={nextPieceColors} cellSize={18} />
          </div>
        </div>

        {gameOver && (
          <button className="btn btn-primary tetris-restart-btn" onClick={handleRestart}>
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}
