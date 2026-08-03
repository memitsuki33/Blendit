import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.js';
import GameBoard from './GameBoard.jsx';
import SettingsModal from './SettingsModal.jsx';
import { getTileColor, formatScore } from '../utils/colors.js';
import { playMove, playHardDrop, playSoftDrop, playHold, playLock, playGarbageSend, playGarbageReceive } from '../utils/soundEffects.js';

function isMobile() {
  return (
    typeof window !== 'undefined' &&
    (navigator.maxTouchPoints > 0 || window.innerWidth < 768)
  );
}

/* ── Reusable panel blocks ─────────────────────────────────────────── */
function InfoBlock({ label, children }) {
  return (
    <div className="bg2-block">
      <span className="bg2-label">{label}</span>
      {children}
    </div>
  );
}

function HoldBlock({ state }) {
  const heldColor = state.heldValue ? getTileColor(state.heldValue) : null;
  return (
    <InfoBlock label="HOLD">
      <div
        className="bg2-tile"
        style={{
          background: heldColor ? heldColor.bg : 'transparent',
          border: heldColor ? 'none' : '1.5px dashed #1e3a5f',
          opacity: state.holdUsed ? 0.4 : 1,
        }}
      />
    </InfoBlock>
  );
}

function NextBlock({ value, label = 'NEXT' }) {
  const color = value != null ? getTileColor(value) : null;
  return (
    <div className="bg2-block">
      <span className="bg2-label">{label}</span>
      <div
        className="bg2-tile"
        style={{
          background: color ? color.bg : 'transparent',
          border: color ? 'none' : '1.5px dashed #1e3a5f',
        }}
      />
    </div>
  );
}

function PlayerSection({ state, animSpeed, side }) {
  const queue = state.nextQueue || (state.nextPieceValue != null ? [state.nextPieceValue] : []);
  const score = state.score ?? 0;
  const level = state.level ?? 0;

  return (
    <div className={`bg2-player bg2-player--${side}`}>
      {/* Left: info column */}
      <div className="bg2-info-col">
        <InfoBlock label="SCORE">
          <span className="bg2-value">{formatScore(score)}</span>
        </InfoBlock>
        <InfoBlock label="LEVEL">
          <span className="bg2-value bg2-value--red">{level}</span>
        </InfoBlock>
        <HoldBlock state={state} />
      </div>

      {/* Center: game board */}
      <div className="bg2-board-wrap">
        <GameBoard state={state} animSpeed={animSpeed} mode="battle" />
      </div>

      {/* Right: next-piece queue */}
      <div className="bg2-next-col">
        {queue.map((val, i) => (
          <NextBlock key={i} value={val} label={i === 0 ? 'NEXT' : 'NEXT'} />
        ))}
      </div>
    </div>
  );
}

export default function BattleGame({
  level, onBack,
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
          Battle (PC) requires a keyboard with two players on the same screen.
          Use <strong>Battle (Mobile)</strong> to play on your phone.
        </div>
        <button className="btn btn-ghost" onClick={onBack}>Back to Menu</button>
      </div>
    );
  }

  const [paused, setPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const p1 = useGameEngine({ startLevel: level, mode: 'battle', paused: paused || showSettings });
  const p2 = useGameEngine({ startLevel: level, mode: 'battle', paused: paused || showSettings });

  const p1GarbageProcessed = useRef(0);
  const p2GarbageProcessed = useRef(0);

  const gameEnded = p1.state.gameOver || p2.state.gameOver;

  const winner = (() => {
    if (!gameEnded) return null;
    if (p1.state.gameOver && p2.state.gameOver) return 'Draw';
    if (p1.state.gameOver) return 'Player 2';
    return 'Player 1';
  })();

  // P1 combos → garbage on P2
  useEffect(() => {
    const sent = p1.state.totalGarbageSent;
    const newRows = sent - p1GarbageProcessed.current;
    if (newRows > 0 && !p2.state.gameOver) {
      playGarbageSend();
      p2.addIncomingGarbage(newRows);
      p1GarbageProcessed.current = sent;
    }
  }, [p1.state.totalGarbageSent]);

  // P2 combos → garbage on P1
  useEffect(() => {
    const sent = p2.state.totalGarbageSent;
    const newRows = sent - p2GarbageProcessed.current;
    if (newRows > 0 && !p1.state.gameOver) {
      playGarbageSend();
      p1.addIncomingGarbage(newRows);
      p2GarbageProcessed.current = sent;
    }
  }, [p2.state.totalGarbageSent]);

  const handleKey = useCallback((e) => {
    if (showSettings) return;

    // Pause toggle
    if (e.key === 'Escape') {
      setPaused(p => !p);
      return;
    }
    if (paused) return;
    if (gameEnded) {
      if (e.key === 'Enter') {
        p1GarbageProcessed.current = 0;
        p2GarbageProcessed.current = 0;
        p1.restart(level);
        p2.restart(level);
      }
      return;
    }

    // Player 1: A/D/S/W/R
    switch (e.key) {
      case 'a': case 'A': playMove(); p1.moveLeft();  break;
      case 'd': case 'D': playMove(); p1.moveRight(); break;
      case 's': case 'S': playSoftDrop(); p1.softDrop(); break;
      case 'w': case 'W': playHardDrop(); p1.hardDrop(); break;
      case 'r': case 'R': playHold(); p1.hold(); break;
    }

    // Player 2: Arrows / Space / /
    switch (e.key) {
      case 'ArrowLeft':  playMove(); p2.moveLeft();  break;
      case 'ArrowRight': playMove(); p2.moveRight(); break;
      case 'ArrowDown':  playSoftDrop(); p2.softDrop(); break;
      case 'ArrowUp':    playHardDrop(); p2.hardDrop(); break;
      case '/':          playHold(); p2.hold(); break;
    }
  }, [paused, gameEnded, showSettings, p1, p2, level]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const handleRestart = () => {
    p1GarbageProcessed.current = 0;
    p2GarbageProcessed.current = 0;
    setPaused(false);
    p1.restart(level);
    p2.restart(level);
  };

  return (
    <div className="bg2-root">
      {/* Background */}
      <div className="dashboard-bg dashboard-bg--pvp" />

      {/* Players */}
      <div className="bg2-players-row">
        <PlayerSection state={p1.state} animSpeed={animSpeed} side="p1" />
        <PlayerSection state={p2.state} animSpeed={animSpeed} side="p2" />
      </div>

      {/* Winner banner */}
      {winner && (
        <div className="bg2-win-banner">
          {winner === 'Draw' ? 'DRAW!' : `${winner.toUpperCase()} WINS!`}
          <button className="bg2-rematch-btn" onClick={handleRestart}>
            Rematch (Enter)
          </button>
        </div>
      )}

      {/* Pause overlay */}
      {paused && !showSettings && (
        <div className="bg2-pause-overlay">
          <div className="bg2-pause-text">PAUSED</div>
          <button className="bg2-resume-btn" onClick={() => setPaused(false)}>Resume (Esc)</button>
          <button className="btn btn-ghost" onClick={() => { setPaused(false); setShowSettings(true); }}>Settings</button>
          <button className="btn btn-ghost" onClick={onBack}>Back to Menu</button>
        </div>
      )}

      {/* Bottom controls row */}
      <div className="bg2-bottom-row">
        <span className="bg2-controls-hint">P1: A D S W · R=Hold</span>
        <button
          className="bg2-pause-btn"
          onClick={() => setPaused(p => !p)}
        >
          {paused ? 'RESUME' : 'PAUSE'}
        </button>
        <span className="bg2-controls-hint" style={{ textAlign: 'right' }}>P2: ← → ↓ ↑ · /=Hold</span>
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
        />
      )}
    </div>
  );
}
