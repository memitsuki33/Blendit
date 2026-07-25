import React from 'react';
import { getTileColor, formatValue, formatScore } from '../utils/colors.js';
import { getDropInterval, levelThreshold, MAX_LEVEL } from '../utils/constants.js';

export default function InfoPanel({ state, mode = 'single', pendingGarbage = 0 }) {
  const { score, level, nextPieceValue } = state;
  const color = getTileColor(nextPieceValue);
  const interval = getDropInterval(level);
  const speedLabel = level === 0 ? 'Manual' : `${(interval / 1000).toFixed(2)}s`;

  // Score-to-next-level progress (single player only)
  let progressPct = 0;
  let needed = null;
  if (mode === 'single' && level < MAX_LEVEL) {
    const currentThreshold = levelThreshold(level);
    const nextT = levelThreshold(level + 1);
    needed = Math.max(0, nextT - score);
    progressPct = Math.min(1, Math.max(0, (score - currentThreshold) / (nextT - currentThreshold)));
  }

  const heldColor = state.heldValue ? getTileColor(state.heldValue) : null;
  const holdUsed = state.holdUsed ?? false;

  return (
    <div className="info-panel">
      {/* Score */}
      <div className="info-block">
        <span className="info-label">Score</span>
        <span className="info-value">{formatScore(score)}</span>
      </div>

      {/* Level */}
      <div className="info-block">
        <span className="info-label">Level</span>
        <span className="info-value red">{level}</span>
        <span className="level-speed-label">{speedLabel}</span>
      </div>

      {/* Progress bar (single player) */}
      {mode === 'single' && level < MAX_LEVEL && (
        <div className="score-bar-wrap">
          <span className="score-bar-label">Next Level</span>
          <div className="score-bar-track">
            <div className="score-bar-fill" style={{ width: `${progressPct * 100}%` }} />
          </div>
          <span className="score-bar-label" style={{ color: 'var(--text-dim)' }}>
            {formatScore(needed)} to go
          </span>
        </div>
      )}

      {/* Hold slot */}
      <div className="next-preview">
        <span className="info-label">Hold</span>
        <div
          className="next-tile"
          style={{
            backgroundColor: heldColor ? heldColor.bg : 'transparent',
            border: heldColor ? 'none' : '1.5px dashed var(--border)',
            opacity: holdUsed ? 0.4 : 1,
            transition: 'opacity 0.15s ease',
          }}
        />
      </div>

      {/* Next piece */}
      <div className="next-preview">
        <span className="info-label">Next</span>
        <div
          className="next-tile"
          style={{ backgroundColor: color.bg }}
        />
      </div>

      {/* Pending garbage (battle mode) */}
      {mode === 'battle' && pendingGarbage > 0 && (
        <div className="info-block">
          <span className="info-label">Incoming</span>
          <div className="pending-garbage">
            {Array.from({ length: Math.min(pendingGarbage, 8) }).map((_, i) => (
              <div key={i} className="garbage-block" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
