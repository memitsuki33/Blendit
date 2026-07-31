import React, { useRef, useEffect, useState } from 'react';
import { ROWS, COLS } from '../utils/constants.js';
import { getTileColor, formatScore } from '../utils/colors.js';
import { getPieceCells, getTetrisGhostRow, getShapeOffsets } from '../utils/tetrisLogic.js';

const ANIM_DURATIONS = {
  none:   { transition: 0,   merge: 0   },
  normal: { transition: 80,  merge: 300 },
  '2x':   { transition: 40,  merge: 150 },
  '4x':   { transition: 20,  merge: 75  },
};

/** Small piece preview (4×4 cells shown as a centered mini-grid). */
export function PiecePreview({ type, colors, rotation = 0, cellSize = 16 }) {
  if (!type) {
    return <div style={{ width: cellSize * 4, height: cellSize * 4 }} />;
  }
  const offsets = getShapeOffsets(type, rotation);
  const occupied = new Map();
  offsets.forEach(([dr, dc], i) => occupied.set(`${dr}-${dc}`, colors[i]));

  return (
    <div
      className="tetris-preview-grid"
      style={{ gridTemplateColumns: `repeat(4, ${cellSize}px)`, gridTemplateRows: `repeat(4, ${cellSize}px)` }}
    >
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 4 }, (_, c) => {
          const val = occupied.get(`${r}-${c}`);
          const color = val ? getTileColor(val) : null;
          return (
            <div
              key={`${r}-${c}`}
              className="tetris-preview-cell"
              style={{
                width: cellSize,
                height: cellSize,
                background: color ? color.bg : 'transparent',
                borderRadius: color ? 3 : 0,
                opacity: color ? 1 : 0,
              }}
            />
          );
        })
      )}
    </div>
  );
}

export default function TetrisBoard({ state, animSpeed = 'normal', hidden = false }) {
  const { board, currentPiece, gameOver, mergeStreak = 0 } = state;
  const { transition: transMs, merge: mergeMs } = ANIM_DURATIONS[animSpeed] ?? ANIM_DURATIONS.normal;

  // Detect merge pops
  const prevBoardRef = useRef(null);
  const [poppingCells, setPoppingCells] = useState(new Set());
  const popTimerRef = useRef(null);

  useEffect(() => {
    if (animSpeed === 'none') { prevBoardRef.current = board; return; }
    if (!prevBoardRef.current) { prevBoardRef.current = board; return; }

    const changed = new Set();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const prev = prevBoardRef.current[r][c];
        const curr = board[r][c];
        if (curr > 0 && curr !== prev) changed.add(`${r}-${c}`);
      }
    }
    prevBoardRef.current = board;

    if (changed.size > 0) {
      if (popTimerRef.current) clearTimeout(popTimerRef.current);
      setPoppingCells(changed);
      popTimerRef.current = setTimeout(() => setPoppingCells(new Set()), mergeMs + 40);
    }
    return () => { if (popTimerRef.current) clearTimeout(popTimerRef.current); };
  }, [board, animSpeed, mergeMs]);

  // Build piece cell maps
  const pieceCells = currentPiece ? getPieceCells(currentPiece) : [];
  const ghostRow = currentPiece ? getTetrisGhostRow(board, currentPiece) : null;
  const ghostOffsets = currentPiece ? getShapeOffsets(currentPiece.type, currentPiece.rotation) : [];

  const pieceMap = new Map();
  pieceCells.forEach(({ row, col, value }) => pieceMap.set(`${row}-${col}`, value));

  const ghostMap = new Map();
  if (currentPiece && ghostRow !== null && ghostRow !== currentPiece.row) {
    const dr = ghostRow - currentPiece.row;
    ghostOffsets.forEach(([ddr, dc], i) => {
      const r = currentPiece.row + ddr + dr;
      const c = currentPiece.col + dc;
      if (!pieceMap.has(`${r}-${c}`)) {
        ghostMap.set(`${r}-${c}`, currentPiece.colors[i]);
      }
    });
  }

  const transStyle = transMs > 0 ? `background-color ${transMs}ms ease` : 'none';

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
            const cellKey = `${r}-${c}`;
            const raw = board[r][c];
            const pieceVal = pieceMap.get(cellKey);
            const ghostVal = ghostMap.get(cellKey);

            let type = 'empty';
            let value = raw;
            if (raw < 0)       { type = 'garbage'; }
            else if (raw > 0)  { type = 'board'; }
            if (ghostVal != null) { type = 'ghost'; value = ghostVal; }
            if (pieceVal != null) { type = 'piece'; value = pieceVal; }

            const color = getTileColor(value);
            const isPopping = poppingCells.has(cellKey) && mergeMs > 0;

            let bg;
            if (type === 'board' || type === 'piece') bg = color.bg;
            else if (type === 'ghost') bg = color.bg + '22';
            else if (type === 'garbage') bg = '#555';

            return (
              <div
                key={cellKey}
                className="cell"
                style={{
                  transition: transStyle,
                  backgroundColor: bg,
                  transform: type === 'piece' ? 'scale(1.03)' : undefined,
                  zIndex: type === 'piece' ? 2 : undefined,
                  boxShadow: type === 'piece' ? '0 2px 10px rgba(0,0,0,0.45)' : undefined,
                  border: type === 'ghost' ? `1.5px dashed ${color.bg}55` : undefined,
                  animation: isPopping ? `mergePopAnim ${mergeMs}ms ease` : undefined,
                }}
              />
            );
          })
        )}
      </div>

      {/* Combo overlay */}
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
