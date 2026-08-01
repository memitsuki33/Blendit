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

  // Touch controls
  const touchStartRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartRef.current || showSettings || state.gameOver) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    touchStartRef.current = null;

    if (absDx < 15 && absDy < 15) {
      rotate();
    } else if (absDx > absDy && absDx > 20) {
      if (dx > 0) { playMove(); moveRight(); } else { playMove(); moveLeft(); }
    } else if (dy > 40) {
      if (absDy > 100 && dt < 250) { playHardDrop(); hardDrop(); }
      else { playSoftDrop(); softDrop(); }
    } else if (dy < -40) {
      rotateCCW();
    }
  }, [showSettings, state.gameOver, moveLeft, moveRight, softDrop, hardDrop, rotate, rotateCCW]);

  const { score, level, linesCleared = 0, nextPieceType, nextPieceColors, heldPiece, holdUsed } = state;

  const interval = getDropInterval(level);
  let progressPct = 0, needed = null;
  if (level < MAX_LEVEL) {
    const cur = levelThreshold(level);
    const nxt = levelThreshold(level + 1);
    needed = Math.max(0, nxt - score);
    progressPct = Math.min(1, Math.max(0, (score - cur) / (nxt - cur)));
  }

  // Mobile: held piece primary color
  const heldMobileColor = heldPiece?.colors?.[0]
    ? getTileColor(heldPiece.colors[0]) : null;
  const nextMobileColor = nextPieceColors?.[0]
    ? getTileColor(nextPieceColors[0]) : null;

  return (
    <div className="mg-page-root">

      {/* ═══ DESKTOP layout ═══ */}
      <div className="mg-desktop-wrap">
        <div className="dashboard gd-root">
          <div className="dashboard-bg" />

          {/* Left — board */}
          <div className="gd-card-wrap">
            <div className="player-section">
              <TetrisBoard state={state} animSpeed={animSpeed} hidden={paused || showSettings} />
            </div>
          </div>

          {/* Center — NEXT column + info column */}
          <div className="gd-center">
            <div className="gd-next-col">
              <div className="gd-next-box">
                <span className="gd-next-label">NEXT</span>
                <div className="gd-next-tile" style={{ border: '1.5px dashed #334155', background: 'transparent' }}>
                  <PiecePreview type={nextPieceType} colors={nextPieceColors} cellSize={12} />
                </div>
              </div>
              {[1, 2, 3, 4].map(i => {
                const isUnlocked = purchased.includes(i);
                return (
                  <div
                    key={i}
                    className="gd-next-box"
                    style={!isUnlocked ? { cursor: 'pointer' } : undefined}
                    onClick={!isUnlocked ? () => setShowShop(true) : undefined}
                    title={!isUnlocked ? 'Open Shop to unlock' : undefined}
                  >
                    <span className="gd-next-label">NEXT</span>
                    <div className={`gd-next-tile${isUnlocked ? '' : ' gd-next-tile-shop'}`} style={{ border: '1.5px dashed #334155', background: 'transparent' }}>
                      {!isUnlocked && (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" style={{ pointerEvents: 'none' }}>
                          <rect x="5" y="11" width="14" height="10" rx="2" fill="#3b82f6" opacity="0.85"/>
                          <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                          <circle cx="12" cy="16" r="1.5" fill="#1e3a5f"/>
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="gd-info-col">
              <div className="gd-info-block">
                <span className="gd-info-label">SCORE</span>
                <span className="gd-info-value">{formatScore(score)}</span>
              </div>
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
              <button className="gd-menu-btn" onClick={onBack}>Back to Menu</button>
              {state.gameOver && (
                <button
                  className="gd-menu-btn"
                  style={{ background: '#1a3a20', borderColor: '#2a6a3a', color: '#4ade80', marginTop: 4 }}
                  onClick={() => handleRestart(startLevel)}
                >Play Again</button>
              )}
            </div>
          </div>

          {/* Right nav sidebar */}
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
                >{item}</button>
              );
            })}
          </nav>

          {paused && !showSettings && !showShop && (
            <div className="gd-pause-overlay">
              <div className="gd-pause-text">PAUSED</div>
              <button className="gd-pause-resume-btn" onClick={() => setPaused(false)}>▶ Resume</button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ MOBILE layout ═══ */}
      <div className="mg-root">
        <div className="dashboard-bg" />

        <div className="mg-main">
          {/* Board — touch target */}
          <div
            className="mg-board"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <TetrisBoard state={state} animSpeed={animSpeed} hidden={paused || showSettings} />
          </div>

          {/* Right sidebar */}
          <div className="mg-sidebar">
            {/* Slot 0 — real next piece */}
            <div className="mg-next-box">
              <span className="mg-next-label">NEXT</span>
              <div className="mg-next-tile" style={{ border: '1.5px dashed #334155', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PiecePreview type={nextPieceType} colors={nextPieceColors} cellSize={9} />
              </div>
            </div>
            {/* Slots 1–4 locked */}
            {[1,2,3,4].map(i => {
              const isUnlocked = purchased.includes(i);
              return (
                <div key={i} className="mg-next-box"
                  style={!isUnlocked ? { cursor: 'pointer' } : undefined}
                  onClick={!isUnlocked ? () => setShowShop(true) : undefined}
                >
                  <span className="mg-next-label">NEXT</span>
                  <div className={`mg-next-tile${isUnlocked ? '' : ' locked'}`}>
                    {!isUnlocked && (
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
                        <rect x="5" y="11" width="14" height="10" rx="2" fill="#3b82f6" opacity="0.85"/>
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                        <circle cx="12" cy="16" r="1.5" fill="#1e3a5f"/>
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Score */}
            <div className="mg-info-box">
              <span className="mg-info-label">SCORE</span>
              <span className="mg-info-value">{formatScore(score)}</span>
            </div>

            {/* Level */}
            <div className="mg-info-box">
              <span className="mg-info-label">LEVEL</span>
              <span className="mg-info-value mg-red">{level}</span>
            </div>

            {/* Hold */}
            <div className="mg-info-box">
              <span className="mg-info-label">HOLD</span>
              <div className="mg-hold-tile" style={{
                border: '1.5px dashed #334155',
                background: 'transparent',
                opacity: holdUsed ? 0.4 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {heldPiece && <PiecePreview type={heldPiece.type} colors={heldPiece.colors} cellSize={9} />}
              </div>
            </div>

            {/* Settings */}
            <button className="mg-btn" onClick={openSettings}>SETTINGS</button>

            {/* Menu */}
            <button className="mg-btn" onClick={onBack}>MENU</button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mg-bar">
          <button
            className="mg-hold-btn"
            onTouchStart={(e) => { e.stopPropagation(); playHold(); hold(); }}
          >HOLD</button>
          {/* held piece color */}
          <div className="mg-color-sq" style={{
            background: heldMobileColor ? heldMobileColor.bg : '#0d1b2e',
            opacity: holdUsed ? 0.4 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {heldPiece && <PiecePreview type={heldPiece.type} colors={heldPiece.colors} cellSize={7} />}
          </div>
          {/* next piece color */}
          <div className="mg-color-sq" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: nextMobileColor ? nextMobileColor.bg : '#0d1b2e',
          }}>
            {nextPieceType && <PiecePreview type={nextPieceType} colors={nextPieceColors} cellSize={7} />}
          </div>
          {/* 4 dark filler squares */}
          {[0,1,2,3].map(i => <div key={i} className="mg-color-sq" />)}
        </div>

        {/* Pause overlay */}
        {paused && !showSettings && !showShop && (
          <div className="mg-gameover">
            <div className="mg-gameover-title">PAUSED</div>
            <button className="mg-btn mg-gameover-btn" onClick={() => setPaused(false)}>▶ Resume</button>
          </div>
        )}

        {/* Game over overlay */}
        {state.gameOver && (
          <div className="mg-gameover">
            <div className="mg-gameover-title">GAME OVER</div>
            <div className="mg-gameover-score">{formatScore(score)}</div>
            <button className="mg-btn mg-gameover-btn" onClick={() => handleRestart(startLevel)}>Play Again</button>
            <button className="mg-btn" onClick={onBack}>Menu</button>
          </div>
        )}
      </div>

      {/* Shared modals */}
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
    </div>
  );
}
