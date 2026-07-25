import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.js';
import GameBoard from './GameBoard.jsx';
import InfoPanel from './InfoPanel.jsx';
import SettingsModal from './SettingsModal.jsx';
import { playMove, playHardDrop, playSoftDrop, playHold, playLock, playGarbageSend, playGarbageReceive, playTimedGarbage } from '../utils/soundEffects.js';

function isMobile() {
  return (
    typeof window !== 'undefined' &&
    (navigator.maxTouchPoints > 0 || window.innerWidth < 768)
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

  const p1 = useGameEngine({ startLevel: level, mode: 'battle' });
  const p2 = useGameEngine({ startLevel: level, mode: 'battle' });
  const [showSettings, setShowSettings] = useState(false);

  const p1GarbageProcessed = useRef(0);
  const p2GarbageProcessed = useRef(0);

  // P1 combos → queue garbage on P2
  useEffect(() => {
    const sent = p1.state.totalGarbageSent;
    const newRows = sent - p1GarbageProcessed.current;
    if (newRows > 0 && !p2.state.gameOver) {
      playGarbageSend();
      p2.addIncomingGarbage(newRows);
      p1GarbageProcessed.current = sent;
    }
  }, [p1.state.totalGarbageSent]);

  // P2 combos → queue garbage on P1
  useEffect(() => {
    const sent = p2.state.totalGarbageSent;
    const newRows = sent - p2GarbageProcessed.current;
    if (newRows > 0 && !p1.state.gameOver) {
      playGarbageSend();
      p1.addIncomingGarbage(newRows);
      p2GarbageProcessed.current = sent;
    }
  }, [p2.state.totalGarbageSent]);

  // Garbage received — play warning when pendingIncoming grows
  const p1PendingRef = useRef(0);
  useEffect(() => {
    if (p1.state.pendingIncoming > p1PendingRef.current) playGarbageReceive();
    p1PendingRef.current = p1.state.pendingIncoming;
  }, [p1.state.pendingIncoming]);

  const p2PendingRef = useRef(0);
  useEffect(() => {
    if (p2.state.pendingIncoming > p2PendingRef.current) playGarbageReceive();
    p2PendingRef.current = p2.state.pendingIncoming;
  }, [p2.state.pendingIncoming]);

  // Lock + timed garbage sounds (P1 drives the audio for both boards)
  const p1TurnsRef = useRef(0);
  useEffect(() => {
    if (p1.state.turns !== p1TurnsRef.current) {
      if (p1.state.timedGarbageThisTurn) playTimedGarbage();
      else playLock();
    }
    p1TurnsRef.current = p1.state.turns;
  }, [p1.state.turns, p1.state.timedGarbageThisTurn]);

  // When one player dies, immediately end the other player's game too
  useEffect(() => {
    if (p1.state.gameOver && !p2.state.gameOver) {
      p2.forceGameOver();
    }
  }, [p1.state.gameOver]);

  useEffect(() => {
    if (p2.state.gameOver && !p1.state.gameOver) {
      p1.forceGameOver();
    }
  }, [p2.state.gameOver]);

  const p1Dead = p1.state.gameOver;
  const p2Dead = p2.state.gameOver;
  const gameEnded = p1Dead || p2Dead;
  const winner = p1Dead && p2Dead
    ? (p1.state.score > p2.state.score ? 'Player 1' : p2.state.score > p1.state.score ? 'Player 2' : 'Draw')
    : p1Dead ? 'Player 2'
    : p2Dead ? 'Player 1'
    : null;

  const handleKey = useCallback(
    (e) => {
      const key = e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(key)) {
        e.preventDefault();
      }

      if (key === 'Escape') {
        setShowSettings(s => !s);
        return;
      }

      if (key === 'Enter' && gameEnded) {
        p1GarbageProcessed.current = 0;
        p2GarbageProcessed.current = 0;
        p1.restart(level);
        p2.restart(level);
        return;
      }

      if (!gameEnded && !showSettings) {
        // Player 1: WASD + R = hold
        switch (key) {
          case 'a': case 'A': playMove(); p1.moveLeft(); break;
          case 'd': case 'D': playMove(); p1.moveRight(); break;
          case 's': case 'S': playSoftDrop(); p1.softDrop(); break;
          case 'w': case 'W': playHardDrop(); p1.hardDrop(); break;
          case 'r': case 'R': playHold(); p1.hold(); break;
        }
        // Player 2: Arrow keys + / = hold
        switch (key) {
          case 'ArrowLeft':  playMove(); p2.moveLeft(); break;
          case 'ArrowRight': playMove(); p2.moveRight(); break;
          case 'ArrowDown':  playSoftDrop(); p2.softDrop(); break;
          case 'ArrowUp':    playHardDrop(); p2.hardDrop(); break;
          case ' ':          playHardDrop(); p2.hardDrop(); break;
          case '/':          playHold(); p2.hold(); break;
        }
      }
    },
    [p1, p2, gameEnded, level, showSettings]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const handleRestart = () => {
    p1GarbageProcessed.current = 0;
    p2GarbageProcessed.current = 0;
    p1.restart(level);
    p2.restart(level);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {/* Back button pinned to top-left corner */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={onBack}
        style={{ position: 'fixed', top: 12, left: 12, zIndex: 100 }}
      >
        Back
      </button>

      {/* Settings button pinned to top-right */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setShowSettings(true)}
        style={{ position: 'fixed', top: 12, right: 12, zIndex: 100 }}
        title="Settings (Esc)"
      >
        Settings
      </button>

      <div className="back-row" style={{ justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
          Battle — Level {level}
        </span>
        {gameEnded && (
          <button className="btn btn-primary btn-sm" onClick={handleRestart}>
            Rematch (Enter)
          </button>
        )}
      </div>

      {winner && (
        <div className="win-banner" style={{ position: 'fixed', top: 52, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
          {winner === 'Draw' ? 'DRAW' : `${winner.toUpperCase()} WINS`}
        </div>
      )}

      <div className="battle-wrapper">
        {/* Player 1 */}
        <div className="player-section p1-section">
          <span className="player-label p1">Player 1 — A D S W  |  R = Hold</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <InfoPanel
              state={p1.state}
              mode="battle"
              pendingGarbage={p1.state.pendingIncoming}
            />
            <GameBoard state={p1.state} animSpeed={animSpeed} />
          </div>
        </div>

        <div className="battle-vs">
          <div className="vs-label">VS</div>
        </div>

        {/* Player 2 */}
        <div className="player-section p2-section">
          <span className="player-label p2">/ = Hold  |  Player 2 — Arrows / Space</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <GameBoard state={p2.state} animSpeed={animSpeed} />
            <InfoPanel
              state={p2.state}
              mode="battle"
              pendingGarbage={p2.state.pendingIncoming}
            />
          </div>
        </div>
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
