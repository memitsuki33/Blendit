import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.js';
import GameBoard from './GameBoard.jsx';
import DPad from './DPad.jsx';
import SettingsModal from './SettingsModal.jsx';
import { getTileColor, formatValue, formatScore } from '../utils/colors.js';
import { playGarbageSend, playGarbageReceive, playTimedGarbage } from '../utils/soundEffects.js';

export default function MobileBattleGame({
  ws, level, playerIndex, onBack,
  animSpeed = 'normal', onAnimSpeed,
  soundEnabled, onSoundEnabled,
  musicEnabled, onMusicEnabled,
}) {
  const engine = useGameEngine({ startLevel: level, mode: 'battle' });
  const garbageSentRef = useRef(0);
  const [showSettings, setShowSettings] = useState(false);

  const [oppState, setOppState] = React.useState({ score: 0, gameOver: false, pendingIncoming: 0 });

  useEffect(() => {
    const sent = engine.state.totalGarbageSent;
    const newRows = sent - garbageSentRef.current;
    if (newRows > 0 && ws && ws.readyState === 1) {
      playGarbageSend();
      ws.send(JSON.stringify({ type: 'garbage', rows: newRows }));
      garbageSentRef.current = sent;
    }
  }, [engine.state.totalGarbageSent, ws]);

  const gameOverSentRef = useRef(false);
  useEffect(() => {
    if (engine.state.gameOver && !gameOverSentRef.current && ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'game_over', score: engine.state.score }));
      gameOverSentRef.current = true;
    }
  }, [engine.state.gameOver, engine.state.score, ws]);

  const prevScoreRef = useRef(0);
  useEffect(() => {
    const s = engine.state.score;
    if (s !== prevScoreRef.current && ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'score', score: s }));
      prevScoreRef.current = s;
    }
  }, [engine.state.score, ws]);

  useEffect(() => {
    if (!ws) return;
    ws.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      if (msg.type === 'garbage') {
        playGarbageReceive();
        engine.addIncomingGarbage(msg.rows);
        setOppState(s => ({ ...s, pendingIncoming: s.pendingIncoming + msg.rows }));
      }
      if (msg.type === 'game_over') {
        setOppState(s => ({ ...s, gameOver: true, score: msg.score ?? s.score }));
        if (!engine.state.gameOver) engine.forceGameOver();
      }
      if (msg.type === 'score') {
        setOppState(s => ({ ...s, score: msg.score }));
      }
      if (msg.type === 'opponent_left') {
        setOppState(s => ({ ...s, gameOver: true }));
        engine.forceGameOver();
      }
    };
  }, [ws, engine]);

  // Timed garbage sound
  const prevTurnsRef = useRef(0);
  useEffect(() => {
    if (engine.state.timedGarbageThisTurn && engine.state.turns !== prevTurnsRef.current) {
      playTimedGarbage();
    }
    prevTurnsRef.current = engine.state.turns;
  }, [engine.state.turns, engine.state.timedGarbageThisTurn]);

  const handleRestart = useCallback(() => {
    garbageSentRef.current = 0;
    gameOverSentRef.current = false;
    setOppState({ score: 0, gameOver: false, pendingIncoming: 0 });
    engine.restart(level);
    if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'restart' }));
  }, [engine, level, ws]);

  const myDead = engine.state.gameOver;
  const oppDead = oppState.gameOver;
  const gameEnded = myDead || oppDead;

  let resultText = null;
  if (gameEnded) {
    if (myDead && oppDead) resultText = 'DRAW';
    else if (oppDead) resultText = 'YOU WIN';
    else resultText = 'YOU LOSE';
  }

  const nextColor = getTileColor(engine.state.nextPieceValue);

  return (
    <div className="mobile-battle">

      {/* Result banner */}
      {resultText && (
        <div
          className={`win-banner ${resultText === 'YOU WIN' ? '' : resultText === 'DRAW' ? 'draw' : 'lose'}`}
          style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}
        >
          {resultText}
        </div>
      )}

      {/* Board */}
      <div className="mobile-game-area mobile-game-area-full">
        <GameBoard state={engine.state} animSpeed={animSpeed} />
      </div>

      {/* Info row */}
      <div className="mobile-bottom-info">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>Back</button>
        <div className="mobile-info-strip">
          <div className="mobile-info-item">
            <span className="mobile-info-val">{formatScore(engine.state.score)}</span>
            <span className="mobile-info-lbl">SCORE</span>
          </div>
          <div className="mobile-info-item">
            <span className="mobile-info-val red">{engine.state.level}</span>
            <span className="mobile-info-lbl">LEVEL</span>
          </div>
          <div className="mobile-info-item">
            <div
              className="mobile-next-mini"
              style={{ backgroundColor: nextColor.bg, color: nextColor.text }}
            >
              {formatValue(engine.state.nextPieceValue)}
            </div>
            <span className="mobile-info-lbl">NEXT</span>
          </div>
          <div className="mobile-info-item">
            <span className={`mobile-info-val ${oppDead ? 'red' : ''}`}>
              {oppDead ? 'OUT' : formatScore(oppState.score)}
            </span>
            <span className="mobile-info-lbl">OPP</span>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>
          Settings
        </button>
      </div>

      {/* Controls row */}
      <div className="mobile-controls-row">
        {gameEnded ? (
          <button className="btn btn-primary mobile-restart-btn" onClick={handleRestart}>
            Rematch
          </button>
        ) : (
          <DPad
            onLeft={engine.moveLeft}
            onRight={engine.moveRight}
            onSoftDrop={engine.softDrop}
            onHardDrop={engine.hardDrop}
          />
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
        />
      )}
    </div>
  );
}
