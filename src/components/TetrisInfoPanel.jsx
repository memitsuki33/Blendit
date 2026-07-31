import React from 'react';
import { getTileColor, formatScore } from '../utils/colors.js';
import { getDropInterval, levelThreshold, MAX_LEVEL, comboMultiplier } from '../utils/constants.js';
import { getShapeOffsets } from '../utils/tetrisLogic.js';

const CELL = 18;

function PiecePreview({ type, colors }) {
  if (!type || !colors) {
    return (
      <div style={{ width: CELL * 4, height: CELL * 2, border: '1.5px dashed var(--border)', borderRadius: 6 }} />
    );
  }

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
      gridTemplateColumns: `repeat(${numC}, ${CELL}px)`,
      gridTemplateRows: `repeat(${numR}, ${CELL}px)`,
      gap: '2px',
    }}>
      {Array.from({ length: numR }, (_, r) =>
        Array.from({ length: numC }, (_, c) => {
          const val = cellMap.get(`${r}-${c}`);
          const color = val ? getTileColor(val) : null;
          return (
            <div key={`${r}-${c}`} style={{
              width: CELL,
              height: CELL,
              background: color ? color.bg : 'transparent',
              borderRadius: 4,
            }} />
          );
        })
      )}
    </div>
  );
}

export default function TetrisInfoPanel({ state, onRestart, onBack }) {
  const {
    score, level, linesCleared = 0,
    nextPieceType, nextPieceColors,
    heldPiece, holdUsed = false,
    mergeStreak = 0, gameOver,
  } = state;

  const multiplier = comboMultiplier(mergeStreak);
  const interval = getDropInterval(level);
  const speedLabel = !interval ? 'Manual' : `${(interval / 1000).toFixed(2)}s`;

  let progressPct = 0;
  let needed = null;
  if (level < MAX_LEVEL) {
    const curr = levelThreshold(level);
    const next = levelThreshold(level + 1);
    needed = Math.max(0, next - score);
    progressPct = Math.min(1, Math.max(0, (score - curr) / (next - curr)));
  }

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

      {/* Lines cleared */}
      <div className="info-block">
        <span className="info-label">Lines</span>
        <span className="info-value">{linesCleared}</span>
      </div>

      {/* Progress bar */}
      {level < MAX_LEVEL && (
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

      {/* Hold */}
      <div className="next-preview">
        <span className="info-label">Hold  <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>(R)</span></span>
        <div style={{ opacity: holdUsed ? 0.35 : 1, transition: 'opacity 0.15s' }}>
          <PiecePreview type={heldPiece?.type ?? null} colors={heldPiece?.colors ?? null} />
        </div>
      </div>

      {/* Combo streak */}
      {mergeStreak > 0 && (
        <div className="info-block">
          <span className="info-label">Combo</span>
          <span className="info-value" style={{ color: 'var(--accent)', fontSize: '1rem' }}>
            ×{multiplier}
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginLeft: 4 }}>
              {mergeStreak} streak
            </span>
          </span>
        </div>
      )}

      {/* Next piece */}
      <div className="next-preview">
        <span className="info-label">Next</span>
        <PiecePreview type={nextPieceType} colors={nextPieceColors} />
      </div>

      {/* Controls hint */}
      <div className="info-block" style={{ marginTop: 8 }}>
        <span className="info-label" style={{ marginBottom: 3 }}>Controls</span>
        <div style={{ fontSize: '0.58rem', color: 'var(--text-dim)', lineHeight: 1.9 }}>
          ←/→ · A/D &nbsp; Move<br />
          ↓ · S &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Soft drop<br />
          Space &nbsp;&nbsp;&nbsp;&nbsp; Hard drop<br />
          ↑ · X &nbsp;&nbsp;&nbsp;&nbsp; Rotate CW<br />
          Z &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Rotate CCW<br />
          R &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Hold<br />
          P / Esc &nbsp; Pause
        </div>
      </div>

      {/* Back to Menu */}
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginTop: 'auto' }}>
        ← Menu
      </button>

      {/* Restart on game over */}
      {gameOver && (
        <button className="btn btn-primary" onClick={() => onRestart(level)} style={{ marginTop: 6, width: '100%' }}>
          Play Again
        </button>
      )}
    </div>
  );
}
