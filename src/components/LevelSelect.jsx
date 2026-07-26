import React, { useState } from 'react';
import { getDropInterval, levelThreshold, MAX_LEVEL } from '../utils/constants.js';
import ColorSequenceModal from './ColorSequenceModal.jsx';
import SettingsModal from './SettingsModal.jsx';

function LevelStepper({ value, onChange }) {
  const interval = getDropInterval(value);
  const speedLabel =
    value === 0 ? 'No auto-drop' : `Drop every ${(interval / 1000).toFixed(2)}s`;

  return (
    <div className="level-player-col">
      <div className="level-stepper">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          -
        </button>
        <div className="level-value">{value}</div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onChange(Math.min(MAX_LEVEL, value + 1))}
        >
          +
        </button>
      </div>
      <div className="level-speed-label">{speedLabel}</div>
    </div>
  );
}

function formatScore(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// Level jump checkpoints: multiples of 5
const JUMP_LEVELS = Array.from(
  { length: Math.floor(MAX_LEVEL / 5) },
  (_, i) => (i + 1) * 5
);

export default function LevelSelect({
  mode, onStart, onBack,
  animSpeed, onAnimSpeed,
  soundEnabled, onSoundEnabled,
  musicEnabled, onMusicEnabled,
}) {
  const [level, setLevel] = useState(0);
  const [showColors, setShowColors] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const isSingle = mode === 'single';

  return (
    <div className={`level-select-screen${isSingle ? ' level-select-single' : ''}`}>
      {/* ── Header row ── */}
      <div className="back-row">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>Back</button>
        <h2>{mode === 'battle' ? 'Battle Mode' : 'Single Player'}</h2>
        {/* Settings only in header for battle; single player has it inline below */}
        {!isSingle && (
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>
            Settings
          </button>
        )}
        {isSingle && <span style={{ width: 72 }} />}
      </div>

      {/* ── Scrollable content ── */}
      <div className={isSingle ? 'ls-single-body' : undefined}>

        {/* Battle: level stepper | Single: description */}
        {mode === 'battle' ? (
          <div className="level-players">
            <div className="level-player-col">
              <h3>Starting Level</h3>
              <LevelStepper value={level} onChange={setLevel} />
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center', maxWidth: 220, marginTop: 4 }}>
                Both players start at the same level.
              </p>
            </div>
          </div>
        ) : (
          <p className="ls-single-desc">
            Level rises automatically as your score grows.
            Jump ahead by choosing a starting level below.
          </p>
        )}

        {/* Color Cycle Guide */}
        <button className="btn btn-ghost" onClick={() => setShowColors(true)}>
          Color Cycle Guide
        </button>

        {/* Settings — inline for single player */}
        {isSingle && (
          <button className="btn btn-ghost" onClick={() => setShowSettings(true)}>
            Settings
          </button>
        )}

        {/* ── Single-player level jump section ── */}
        {isSingle && (
          <div className="ls-jump-section">
            <div className="ls-jump-label">Start Level</div>

            {/* Start at Level 0 = main "Start Game" */}
            <button
              className="btn btn-primary ls-jump-start0"
              onClick={() => onStart({ level: 0 })}
            >
              ▶ Start at Level 0
              <span className="ls-jump-start0-sub">Fresh start · no auto-drop</span>
            </button>

            {/* Jump to Lv 5, 10, 15 … */}
            <div className="ls-jump-grid">
              {JUMP_LEVELS.map(lv => {
                const needed = levelThreshold(lv);
                const interval = getDropInterval(lv);
                return (
                  <button
                    key={lv}
                    className="ls-jump-row"
                    onClick={() => onStart({ level: lv })}
                  >
                    <span className="ls-jump-lv">Lv {lv}</span>
                    <span className="ls-jump-speed">{(interval / 1000).toFixed(2)}s drops</span>
                    <span className="ls-jump-score">{formatScore(needed)} pts to reach</span>
                    <span className="ls-jump-play">▶</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Battle: start game button */}
        {!isSingle && (
          <button
            className="btn btn-primary"
            onClick={() => onStart({ level })}
          >
            Start Game
          </button>
        )}

        {/* Controls hint */}
        {mode === 'battle' && (
          <div className="controls-hint" style={{ lineHeight: 1.9 }}>
            <strong>Player 1:</strong> A / D = move &nbsp; S = soft drop &nbsp; W = hard drop &nbsp; R = hold<br />
            <strong>Player 2:</strong> Left / Right = move &nbsp; Down = soft drop &nbsp; Up = hard drop &nbsp; / = hold
          </div>
        )}
        {isSingle && (
          <div className="controls-hint" style={{ lineHeight: 1.9 }}>
            <strong>Controls:</strong> Left / Right (or A/D) = move &nbsp; Down/S = soft drop &nbsp; Up/W/Space = hard drop &nbsp; R = hold
          </div>
        )}
      </div>

      {showColors && (
        <ColorSequenceModal onClose={() => setShowColors(false)} actionLabel="Got it!" />
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
        />
      )}
    </div>
  );
}
