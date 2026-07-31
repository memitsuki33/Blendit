import React, { useRef, useEffect, useState } from 'react';
import { ROWS, COLS } from '../utils/constants.js';
import { getTileColor, formatValue, formatScore } from '../utils/colors.js';
import { getGhostRow } from '../utils/gameLogic.js';

// Animation duration in ms per speed setting
const ANIM_DURATIONS = {
  none:   { transition: 0,   merge: 0   },
  normal: { transition: 120, merge: 300 },
  '2x':   { transition: 60,  merge: 150 },
  '4x':   { transition: 30,  merge: 75  },
};

export default function GameBoard({ state, animSpeed = 'normal', hidden = false }) {
  const { board, currentPiece, gameOver, mergeStreak = 0, streakMilestone = 0 } = state;
  const { transition: transMs, merge: mergeMs } = ANIM_DURATIONS[animSpeed] ?? ANIM_DURATIONS.normal;


  // Detect which board cells changed (for merge pop animation)
  const prevBoardRef = useRef(null);
  const [poppingCells, setPoppingCells] = useState(new Set());
  const popTimerRef = useRef(null);

  useEffect(() => {
    if (animSpeed === 'none') {
      prevBoardRef.current = board;
      return;
    }
    if (!prevBoardRef.current) {
      prevBoardRef.current = board;
      return;
    }

    const changed = new Set();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const prev = prevBoardRef.current[r][c];
        const curr = board[r][c];
        // A cell that gained a new positive value is a merge result
        if (curr > 0 && curr !== prev) {
          changed.add(`${r}-${c}`);
        }
      }
    }
    prevBoardRef.current = board;

    if (changed.size > 0) {
      if (popTimerRef.current) clearTimeout(popTimerRef.current);
      setPoppingCells(changed);
      popTimerRef.current = setTimeout(
        () => setPoppingCells(new Set()),
        mergeMs + 40
      );
    }

    return () => {
      if (popTimerRef.current) clearTimeout(popTimerRef.current);
    };
  }, [board, animSpeed, mergeMs]);

  // Ghost row
  const ghostRow = currentPiece ? getGhostRow(board, currentPiece) : null;

  const transStyle = transMs > 0
    ? `background-color ${transMs}ms ease, transform ${transMs}ms ease`
    : 'none';

  const mergeKeyframes = mergeMs > 0
    ? `@keyframes mergePop${mergeMs} {
        0%   { transform: scale(1); }
        40%  { transform: scale(1.25); }
        70%  { transform: scale(0.93); }
        100% { transform: scale(1); }
      }`
    : '';

  return (
    <div className="board-outer" style={hidden ? { visibility: 'hidden' } : undefined}>
      {mergeMs > 0 && (
        <style>{`
          @keyframes mergePopAnim {
            0%   { transform: scale(1); }
            40%  { transform: scale(1.25); }
            70%  { transform: scale(0.93); }
            100% { transform: scale(1); }
          }
        `}</style>
      )}

      <div className="board-grid">
        {Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const raw = board[r][c];
            const isGhost =
              currentPiece &&
              ghostRow !== null &&
              r === ghostRow &&
              c === currentPiece.col &&
              ghostRow !== currentPiece.row &&
              raw === 0;
            const isPiece =
              currentPiece &&
              r === currentPiece.row &&
              c === currentPiece.col;

            let type = 'empty';
            let value = raw;
            if (raw < 0)   type = 'garbage';
            if (raw > 0)   type = 'board';
            if (isGhost)   { type = 'ghost'; value = currentPiece.value; }
            if (isPiece)   { type = 'piece'; value = currentPiece.value; }

            const color = getTileColor(value);
            const label = formatValue(value);
            const isLong = label.length >= 4;
            const cellKey = `${r}-${c}`;
            const isPopping = poppingCells.has(cellKey) && mergeMs > 0;

            let bg = undefined;
            let textColor = undefined;
            if (type === 'board' || type === 'piece') {
              bg = color.bg;
              textColor = color.text;
            } else if (type === 'ghost') {
              // Tint ghost with the piece's own color at very low opacity
              bg = color.bg + '15';
            } else if (type === 'garbage') {
              bg = '#555';
              textColor = 'transparent';
            }

            const cellStyle = {
              transition: transStyle,
              backgroundColor: bg,
              color: textColor,
              transform: type === 'piece' ? 'scale(1.04)' : undefined,
              zIndex: type === 'piece' ? 2 : undefined,
              boxShadow: type === 'piece' ? '0 2px 12px rgba(0,0,0,0.5)' : undefined,
              border: type === 'ghost' ? `1.5px dashed ${color.bg}55` : undefined,
              animation: isPopping
                ? `mergePopAnim ${mergeMs}ms ease`
                : undefined,
            };

            return (
              <div
                key={cellKey}
                className="cell"
                style={cellStyle}
              />
            );
          })
        )}
      </div>

      {/* Tetris-Battle-style combo display */}
      {mergeStreak >= 2 && !gameOver && (
        <div
          key={mergeStreak}
          className={`combo-center combo-tier-${Math.min(Math.ceil(mergeStreak / 3), 5)}`}
        >
          <div className="combo-label">COMBO</div>
          <div className="combo-number">×{mergeStreak}</div>
        </div>
      )}

      {gameOver && (
        <div className="gameover-overlay">
          <div className="gameover-title">GAME OVER</div>
          <div className="gameover-score">Score: {formatScore(state.score)}</div>
        </div>
      )}
    </div>
  );
}
