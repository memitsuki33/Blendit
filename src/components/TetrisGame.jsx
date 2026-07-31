import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useTetrisEngine } from '../hooks/useTetrisEngine.js';
import TetrisBoard from './TetrisBoard.jsx';
import SettingsModal from './SettingsModal.jsx';
import ShopModal from './ShopModal.jsx';
import { getTileColor, formatScore } from '../utils/colors.js';
import { getDropInterval, levelThreshold, MAX_LEVEL } from '../utils/constants.js';
import { getShapeOffsets } from '../utils/tetrisLogic.js';
import { playMove, playHardDrop, playSoftDrop, playHold, playLock } from '../utils/soundEffects.js';

function loadCoins() {
  return parseInt(localStorage.getItem('blendIt_coins') || '0', 10);
}
function saveCoins(n) {
  localStorage.setItem('blendIt_coins', String(n));
}
function loadPurchased() {
  try { return JSON.parse(localStorage.getItem('blendIt_nextSlots') || '[]'); }
  catch { return []; }
}
function savePurchased(arr) {
  localStorage.setItem('blendIt_nextSlots', JSON.stringify(arr));
}

const NAV_ITEMS = ['HOME', 'LEVELS', 'RANKS', 'TROPHIES', 'CHATS', 'SETTINGS', 'USER DATA', 'LOG OUT'];

/** Compact piece-shape preview — fits inside a tile slot. */
function PiecePreview({ type, colors, cellSize = 13 }) {
  if (!type || !colors) return null;
  const offsets = getShapeOffsets(type, 0);
  const rows = offsets.map(([dr]) => dr);
  const cols = offsets.map(([, dc]) => dc);
  const minR = Math.min(...rows), maxR = Math.max(...rows);
  const minC = Math.min(...cols), maxC = Math.max(...cols);
  const numR = maxR - minR + 1;
  const numC = maxC - minC + 1;
  const cellMap = new Map();
  offsets.forEach(([dr, dc], i) => cellMap.set(`${dr - minR}-${dc - minC}`, colors[i]));

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${numC}, ${cellSize}px)`,
      gridTemplateRows: `repeat(${numR}, ${cellSize}px)`,
      gap: '2px',
    }}>
      {Array.from({ length: numR }, (_, r) =>
        Array.from({ length: numC }, (_, c) => {
          const val = cellMap.get(`${r}-${c}`);
          const color = val ? getTileColor(val) : null;
          return (
            <div key={`${r}-${c}`} style={{
              width: cellSize, height: cellSize,
              background: color ? color.bg : 'transparent',
              borderRadius: 3,
            }} />
          );
        })
      )}
    </div>
  );
}

export default function TetrisGame({
  onBack,
  startLevel = 1,
  startScore = 0,
  animSpeed = 'normal', onAnimSpeed,
  soundEnabled, onSoundEnabled,
  musicEnabled, onMusicEnabled,
}) {
  const [paused, setPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [coins, setCoins] = useState(loadCoins);
  const [purchased, setPurchased] = useState(loadPurchased);

  const { state, moveLeft, moveRight, softDrop, hardDrop, rotate, rotateCCW, hold, restart } =
    useTetrisEngine({ startLevel, startScore, paused: paused || showSettings || showShop });

  // Accumulate coins from score earned this session
  const prevScoreRef = useRef(state.score);
  useEffect(() => {
    const gained = state.score - prevScoreRef.current;
    if (gained > 0) {
      setCoins(prev => {
        const next = prev + gained;
        saveCoins(next);
        return next;
      });
    }
    prevScoreRef.current = state.score;
  }, [state.score]);

  const handleBuy = useCallback((slot, price) => {
    setCoins(prev => {
      const next = prev - price;
      saveCoins(next);
      return next;
    });
    setPurchased(prev => {
      const next = [...prev, slot];
      savePurchased(next);
      return next;
    });
  }, []);

  // Persist max level reached
  useEffect(() => {
    if (state.level > 0) {
      const prev = parseInt(localStorage.getItem('blendIt_maxLevel') || '0', 10);
      if (state.level > prev) localStorage.setItem('blendIt_maxLevel', String(state.level));
    }
  }, [state.level]);

  // Lock sound on each piece placed
  const prevTurnsRef = useRef(0);
  useEffect(() => {
    if (state.turns !== prevTurnsRef.current) {
      playLock();
      prevTurnsRef.current = state.turns;
    }
  }, [state.turns]);

  const openSettings  = useCallback(() => { setPaused(true); setShowSettings(true); }, []);
  const closeSettings = useCallback(() => { setShowSettings(false); setPaused(false); }, []);
  const handleRestart = useCallback((level) => {
    restart(level ?? startLevel);
    setShowSettings(false);
    setPaused(false);
  }, [restart, startLevel]);

  const handleKey = useCallback((e) => {
    if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key)) e.preventDefault();
    if (showSettings || state.gameOver) return;
    switch (e.key) {
      case 'ArrowLeft':  case 'a': case 'A': playMove();     moveLeft();   break;
      case 'ArrowRight': case 'd': case 'D': playMove();     moveRight();  break;
      case 'ArrowDown':  case 's': case 'S': playSoftDrop(); softDrop();   break;
      case 'ArrowUp': case 'w': case 'W':
      case 'x': case 'X':                   rotate();                      break;
      case 'z': case 'Z':                    rotateCCW();                   break;
      case ' ':                              playHardDrop(); hardDrop();    break;
      case 'r': case 'R':                    playHold();     hold();        break;
      case 'Escape':                         openSettings();                break;
      case 'p': case 'P':                    setPaused(p => !p);            break;
    }
  }, [showSettings, state.gameOver, moveLeft, moveRight, softDrop, hardDrop, rotate, rotateCCW, hold, openSettings]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const { score, level, linesCleared = 0, nextPieceType, nextPieceColors, heldPiece, holdUsed } = state;

  const interval = getDropInterval(level);
  let progressPct = 0, needed = null;
  if (level < MAX_LEVEL) {
    const cur = levelThreshold(level);
    const nxt = levelThreshold(level + 1);
    needed = Math.max(0, nxt - score);
    progressPct = Math.min(1, Math.max(0, (score - cur) / (nxt - cur)));
  }

  return (
    <div className="dashboard gd-root">
      <div className="dashboard-bg" />

      {/* Left — board (same position as GameDashboard) */}
      <div className="gd-card-wrap">
        <div className="player-section">
          <TetrisBoard state={state} animSpeed={animSpeed} hidden={paused || showSettings} />
        </div>
      </div>

      {/* Center — NEXT column + info column */}
      <div className="gd-center">

        {/* NEXT previews column */}
        <div className="gd-next-col">
          {/* Slot 0 — real next piece as a shape preview */}
          <div className="gd-next-box">
            <span className="gd-next-label">NEXT</span>
            <div className="gd-next-tile" style={{ border: '1.5px dashed #334155', background: 'transparent' }}>
              <PiecePreview type={nextPieceType} colors={nextPieceColors} cellSize={12} />
            </div>
          </div>
          {/* Slots 1–4 — shop-unlockable */}
          {[1, 2, 3, 4].map(i => {
            const isUnlocked = purchased.includes(i);
            return (
              <div key={i} className="gd-next-box">
                <span className="gd-next-label">NEXT</span>
                {isUnlocked ? (
                  <div className="gd-next-tile" style={{ border: '1.5px dashed #334155', background: 'transparent' }}>
                    {/* future: show queued piece */}
                  </div>
                ) : (
                  <button
                    className="gd-next-tile gd-next-tile-shop"
                    style={{ border: '1.5px dashed #334155', background: 'transparent', cursor: 'pointer' }}
                    onClick={() => setShowShop(true)}
                    title="Open Shop to unlock"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                      <rect x="5" y="11" width="14" height="10" rx="2" fill="#3b82f6" opacity="0.85"/>
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                      <circle cx="12" cy="16" r="1.5" fill="#1e3a5f"/>
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Info column */}
        <div className="gd-info-col">

          {/* Score */}
          <div className="gd-info-block">
            <span className="gd-info-label">SCORE</span>
            <span className="gd-info-value">{formatScore(score)}</span>
          </div>

          {/* Level + next-level progress */}
          <div className="gd-row-pair">
            <div className="gd-info-block gd-half">
              <span className="gd-info-label">LEVEL</span>
              <span className="gd-info-value gd-red">{level}</span>
            </div>
            <div className="gd-info-block gd-half">
              <span className="gd-info-label">NEXT LEVEL</span>
              <div className="gd-progress-track">
                <div className="gd-progress-fill" style={{ width: `${progressPct * 100}%` }} />
              </div>
              <span className="gd-progress-label">
                {needed !== null ? `${formatScore(needed)} to go` : 'Max'}
              </span>
            </div>
          </div>

          {/* Hold */}
          <div className="gd-info-block">
            <span className="gd-info-label">
              HOLD&nbsp;&nbsp;<span style={{ fontSize: '0.5rem', opacity: 0.55 }}>(R)</span>
            </span>
            <div style={{
              minWidth: 46, minHeight: 46,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: heldPiece ? 'none' : '1.5px dashed #334155',
              borderRadius: 8,
              opacity: holdUsed ? 0.4 : 1,
              transition: 'opacity 0.15s',
            }}>
              {heldPiece
                ? <PiecePreview type={heldPiece.type} colors={heldPiece.colors} cellSize={14} />
                : null}
            </div>
          </div>

          {/* Back to Menu */}
          <button className="gd-menu-btn" onClick={onBack}>
            Back to Menu
          </button>

          {/* Play Again on game over */}
          {state.gameOver && (
            <button
              className="gd-menu-btn"
              style={{ background: '#1a3a20', borderColor: '#2a6a3a', color: '#4ade80', marginTop: 4 }}
              onClick={() => handleRestart(startLevel)}
            >
              Play Again
            </button>
          )}
        </div>
      </div>

      {/* Right — nav sidebar (disabled except SETTINGS) */}
      <nav className="dashboard-nav">
        {NAV_ITEMS.map(item => {
          const isSettings = item === 'SETTINGS';
          const isActive = isSettings && showSettings;
          return (
            <button
              key={item}
              className={`dashboard-nav-btn${isActive ? ' dashboard-nav-active' : ''}${!isSettings ? ' gd-nav-disabled' : ''}`}
              onClick={isSettings ? openSettings : undefined}
              disabled={!isSettings}
            >
              {item}
            </button>
          );
        })}
      </nav>

      {showSettings && (
        <SettingsModal
          onClose={closeSettings}
          animSpeed={animSpeed}     onAnimSpeed={onAnimSpeed}
          soundEnabled={soundEnabled} onSoundEnabled={onSoundEnabled}
          musicEnabled={musicEnabled} onMusicEnabled={onMusicEnabled}
          onReset={() => handleRestart(startLevel)}
          checkpointLevel={Math.floor(state.level / 5) * 5}
          onLoadLevel={(lvl) => handleRestart(lvl)}
        />
      )}

      {showShop && (
        <ShopModal
          coins={coins}
          purchased={purchased}
          onBuy={handleBuy}
          onClose={() => setShowShop(false)}
        />
      )}

      {paused && !showSettings && !showShop && (
        <div className="gd-pause-overlay">
          <div className="gd-pause-text">PAUSED</div>
          <button className="gd-pause-resume-btn" onClick={() => setPaused(false)}>▶ Resume</button>
        </div>
      )}
    </div>
  );
}
