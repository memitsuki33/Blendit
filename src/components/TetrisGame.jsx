import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useTetrisEngine } from '../hooks/useTetrisEngine.js';
import TetrisBoard from './TetrisBoard.jsx';
import TetrisInfoPanel from './TetrisInfoPanel.jsx';
import { playMove, playHardDrop, playSoftDrop, playHold, playLock } from '../utils/soundEffects.js';

export default function TetrisGame({
  onBack,
  startLevel = 1,
  animSpeed = 'normal',
}) {
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const { state, moveLeft, moveRight, softDrop, hardDrop, rotate, rotateCCW, hold, restart } =
    useTetrisEngine({ startLevel, paused });

  // Lock sound on each turn
  const prevTurnsRef = useRef(0);
  useEffect(() => {
    if (state.turns !== prevTurnsRef.current) {
      playLock();
      prevTurnsRef.current = state.turns;
    }
  }, [state.turns]);

  // Persist max level
  useEffect(() => {
    if (state.level > 0) {
      const prev = parseInt(localStorage.getItem('blendIt_maxLevel') || '0', 10);
      if (state.level > prev) localStorage.setItem('blendIt_maxLevel', String(state.level));
    }
  }, [state.level]);

  const handleKey = useCallback(
    (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (!state.gameOver) setPaused(p => !p);
        return;
      }
      if (state.gameOver || pausedRef.current) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a': case 'A': playMove(); moveLeft(); break;
        case 'ArrowRight':
        case 'd': case 'D': playMove(); moveRight(); break;
        case 'ArrowDown':
        case 's': case 'S': playSoftDrop(); softDrop(); break;
        case 'ArrowUp':
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

  const handleRestart = useCallback(
    (level) => { restart(level ?? startLevel); setPaused(false); },
    [restart, startLevel]
  );

  return (
    <>
      <div className="game-wrapper">
        <div className="player-section">
          <div style={{ position: 'relative' }}>
            <TetrisBoard state={state} animSpeed={animSpeed} />
            {/* Pause overlay sits on top of the board */}
            {paused && !state.gameOver && (
              <div className="gd-pause-overlay" style={{ position: 'absolute', borderRadius: 8 }}>
                <div className="gd-pause-text">PAUSED</div>
                <button className="gd-pause-resume-btn" onClick={() => setPaused(false)}>
                  Resume  (P)
                </button>
              </div>
            )}
          </div>
        </div>

        <TetrisInfoPanel
          state={state}
          onRestart={handleRestart}
          onBack={onBack}
        />
      </div>
    </>
  );
}
