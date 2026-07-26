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

// Level jump checkpoints: multiples of 5 up to MAX_LEVEL
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

  // Max level ever reached — persisted in localStorage
  const maxUnlocked = parseInt(
    typeof localStorage !== 'undefined'
      ? (localStorage.getItem('blendIt_maxLevel') || '0')
      : '0',
    10
  );

  return (
    <div className={`level-select-screen${isSingle ? ' level-select-single' : ''}`}>
      {/* ── Header row ── */}
      <div className="back-row">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>Back</button>
        <h2>{mode === 'battle' ? 'Battle Mode' : 'Single Player'}</h2>
        {/* Settings in header only for battle mode */}
        {!isSingle
          ? <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>Settings</button>
          : <span style={{ width: 72 }} />
        }
      </div>

      {/* ── Battle mode body ── */}
      {!isSingle && (
        <div className="ls-battle-body">
          <div className="level-players">
            <div className="level-player-col">
              <h3>Starting Level</h3>
              <LevelStepper value={level} onChange={setLevel} />
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center', maxWidth: 220, marginTop: 4 }}>
                Both players start at the same level.
              </p>
            </div>
          </div>

          <button className="btn btn-ghost" onClick={() => setShowColors(true)}>
            Color Cycle Guide
          </button>
          <button className="btn btn-primary" onClick={() => onStart({ level })}>
            Start Game
          </button>

          <div className="controls-hint" style={{ lineHeight: 1.9 }}>
            <strong>Player 1:</strong> A / D = move &nbsp; S = soft drop &nbsp; W = hard drop &nbsp; R = hold<br />
            <strong>Player 2:</strong> Left / Right = move &nbsp; Down = soft drop &nbsp; Up = hard drop &nbsp; / = hold
          </div>
        </div>
      )}

      {/* ── Single player body (scrollable) ── */}
      {isSingle && (
        <div className="ls-single-body">
          <p className="ls-single-desc">
            Level rises automatically as your score grows.
            Jump ahead by choosing a starting level below.
          </p>

          <button className="btn btn-ghost" onClick={() => setShowColors(true)}>
            Color Cycle Guide
          </button>
          <button className="btn btn-ghost" onClick={() => setShowSettings(true)}>
            Settings
          </button>

          {/* Level jump section */}
          <div className="ls-jump-section">
            <div className="ls-jump-label">Start Level</div>

            {/* Level 0 — always available */}
            <button
              className="btn btn-primary ls-jump-start0"
              onClick={() => onStart({ level: 0 })}
            >
              ▶ Start at Level 0
              <span className="ls-jump-start0-sub">Fresh start · no auto-drop</span>
            </button>

            {/* Jump rows: Lv 5, 10, 15 … */}
            <div className="ls-jump-grid">
              {JUMP_LEVELS.map(lv => {
                const locked = lv > maxUnlocked;
                const needed = levelThreshold(lv);
                const interval = getDropInterval(lv);
                return (
                  <button
                    key={lv}
                    className={`ls-jump-row${locked ? ' ls-jump-row-locked' : ''}`}
                    onClick={locked ? undefined : () => onStart({ level: lv })}
                    disabled={locked}
                  >
                    <span className="ls-jump-lv">Lv {lv}</span>
                    {locked
                      ? <>
                          <span className="ls-jump-speed">🔒 locked</span>
                          <span className="ls-jump-score">{formatScore(needed)} pts to reach</span>
                          <span className="ls-jump-play" />
                        </>
                      : <>
                          <span className="ls-jump-speed">{(interval / 1000).toFixed(2)}s drops</span>
                          <span className="ls-jump-score">{formatScore(needed)} pts to reach</span>
                          <span className="ls-jump-play">▶</span>
                        </>
                    }
                  </button>
                );
              })}
            </div>
          </div>

          <div className="controls-hint" style={{ lineHeight: 1.9 }}>
            <strong>Controls:</strong> Left / Right (or A/D) = move &nbsp; Down/S = soft drop &nbsp; Up/W/Space = hard drop &nbsp; R = hold
          </div>
        </div>
      )}

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
