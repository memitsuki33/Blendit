import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.js';
import GameBoard from './GameBoard.jsx';
import InfoPanel from './InfoPanel.jsx';
import ColorSequenceModal from './ColorSequenceModal.jsx';
import SettingsModal from './SettingsModal.jsx';
import { playMove, playHardDrop, playSoftDrop, playHold, playLock, playTimedGarbage } from '../utils/soundEffects.js';

function isMobile() {
  return (
    typeof window !== 'undefined' &&
    (navigator.maxTouchPoints > 0 || window.innerWidth < 768)
  );
}

export default function SinglePlayerGame({
  onBack,
  startLevel = 0,
  animSpeed = 'normal', onAnimSpeed,
  soundEnabled, onSoundEnabled,
  musicEnabled, onMusicEnabled,
}) {
  if (isMobile()) {
    return (
      <div className="mobile-pc-block">
        <div className="mobile-pc-icon">🎮</div>
        <div className="mobile-pc-title">PC Only</div>
        <div className="mobile-pc-msg">
          Single Player (PC) uses keyboard controls.
          Use <strong>Single Player (Mobile)</strong> to play on your phone.
        </div>
        <button className="btn btn-ghost" onClick={onBack}>Back to Menu</button>
      </div>
    );
  }

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

  // Lock + timed garbage sounds
  const prevTurnsRef = useRef(0);
  useEffect(() => {
    if (state.turns !== prevTurnsRef.current) {
      if (state.timedGarbageThisTurn) playTimedGarbage();
      else playLock();
    }
    prevTurnsRef.current = state.turns;
  }, [state.turns, state.timedGarbageThisTurn]);

  const handleKey = useCallback(
    (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (showColorGuide || showSettings || state.gameOver) return;
      switch (e.key) {
        case 'ArrowLeft':
        case 'a': case 'A':
          playMove(); moveLeft(); break;
        case 'ArrowRight':
        case 'd': case 'D':
          playMove(); moveRight(); break;
        case 'ArrowDown':
        case 's': case 'S':
          playSoftDrop(); softDrop(); break;
        case 'ArrowUp':
        case 'w': case 'W':
        case ' ':
          playHardDrop(); hardDrop(); break;
        case 'r': case 'R':
          playHold(); hold(); break;
        case 'Escape':
          setShowSettings(s => !s); break;
      }
    },
    [showColorGuide, showSettings, state.gameOver, moveLeft, moveRight, softDrop, hardDrop, hold]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const handleRestart = useCallback((level) => {
    restart(level ?? 0);
    setShowColorGuide(true);
  }, [restart]);

  const checkpointLevel = Math.floor(state.level / 5) * 5;

  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        style={{ position: 'fixed', top: 12, left: 12, zIndex: 50 }}
        onClick={onBack}
      >
        Back
      </button>

      <button
        className="btn btn-ghost btn-sm"
        style={{ position: 'fixed', top: 12, right: 12, zIndex: 50 }}
        onClick={() => setShowSettings(true)}
        title="Settings (Esc)"
      >
        Settings
      </button>

      <div className="game-wrapper">
        <div className="player-section">
          <GameBoard state={state} animSpeed={animSpeed} />
        </div>
        <InfoPanel state={state} mode="single" onRestart={() => handleRestart(0)} />
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
          onReset={() => handleRestart(0)}
          checkpointLevel={checkpointLevel}
          onLoadLevel={(lvl) => handleRestart(lvl)}
        />
      )}
    </>
  );
}
