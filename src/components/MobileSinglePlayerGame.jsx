import React, { useState, useEffect, useRef } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.js';
import GameBoard from './GameBoard.jsx';
import DPad from './DPad.jsx';
import ColorSequenceModal from './ColorSequenceModal.jsx';
import SettingsModal from './SettingsModal.jsx';
import { getTileColor, formatScore } from '../utils/colors.js';
import { playTimedGarbage } from '../utils/soundEffects.js';

export default function MobileSinglePlayerGame({
  onBack,
  animSpeed = 'normal', onAnimSpeed,
  soundEnabled, onSoundEnabled,
  musicEnabled, onMusicEnabled,
}) {
  const { state, moveLeft, moveRight, softDrop, hardDrop, restart } = useGameEngine({
    startLevel: 0,
    mode: 'single',
  });

  const [showColorGuide, setShowColorGuide] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Timed garbage sound
  const prevTurnsRef = useRef(0);
  useEffect(() => {
    if (state.timedGarbageThisTurn && state.turns !== prevTurnsRef.current) {
      playTimedGarbage();
    }
    prevTurnsRef.current = state.turns;
  }, [state.turns, state.timedGarbageThisTurn]);

  const nextColor = getTileColor(state.nextPieceValue);

  const handleRestart = () => {
    restart(0);
    setShowColorGuide(true);
  };

  return (
    <div className="mobile-battle">

      {/* Board */}
      <div className="mobile-game-area mobile-game-area-full">
        <GameBoard state={state} animSpeed={animSpeed} />
      </div>

      {/* Info row: back + score + level + next + settings */}
      <div className="mobile-bottom-info">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>Back</button>
        <div className="mobile-info-strip">
          <div className="mobile-info-item">
            <span className="mobile-info-val">{formatScore(state.score)}</span>
            <span className="mobile-info-lbl">SCORE</span>
          </div>
          <div className="mobile-info-item">
            <span className="mobile-info-val red">{state.level}</span>
            <span className="mobile-info-lbl">LEVEL</span>
          </div>
          <div className="mobile-info-item">
            <div
              className="mobile-next-mini"
              style={{ backgroundColor: nextColor.bg }}
            />
            <span className="mobile-info-lbl">NEXT</span>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>
          Settings
        </button>
      </div>

      {/* Controls row */}
      <div className="mobile-controls-row">
        {state.gameOver ? (
          <button className="btn btn-primary mobile-restart-btn" onClick={handleRestart}>
            Restart
          </button>
        ) : (
          <DPad
            onLeft={moveLeft}
            onRight={moveRight}
            onSoftDrop={softDrop}
            onHardDrop={hardDrop}
          />
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
