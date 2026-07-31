import { ROWS, COLS, COLOR_COUNT, comboMultiplier } from './constants.js';
import { processMerges, emptyBoard } from './gameLogic.js';

// ── Piece types ──────────────────────────────────────────────────────────────
const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// SHAPES[type][rotation] = [[dr, dc], …]  relative to 4×4 bounding box origin
const SHAPES = {
  I: [
    [[1,0],[1,1],[1,2],[1,3]],
    [[0,2],[1,2],[2,2],[3,2]],
    [[2,0],[2,1],[2,2],[2,3]],
    [[0,1],[1,1],[2,1],[3,1]],
  ],
  O: [
    [[0,1],[0,2],[1,1],[1,2]],
    [[0,1],[0,2],[1,1],[1,2]],
    [[0,1],[0,2],[1,1],[1,2]],
    [[0,1],[0,2],[1,1],[1,2]],
  ],
  T: [
    [[0,1],[1,0],[1,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,1]],
    [[1,0],[1,1],[1,2],[2,1]],
    [[0,1],[1,0],[1,1],[2,1]],
  ],
  S: [
    [[0,1],[0,2],[1,0],[1,1]],
    [[0,1],[1,1],[1,2],[2,2]],
    [[1,1],[1,2],[2,0],[2,1]],
    [[0,0],[1,0],[1,1],[2,1]],
  ],
  Z: [
    [[0,0],[0,1],[1,1],[1,2]],
    [[0,2],[1,1],[1,2],[2,1]],
    [[1,0],[1,1],[2,1],[2,2]],
    [[0,1],[1,0],[1,1],[2,0]],
  ],
  J: [
    [[0,0],[1,0],[1,1],[1,2]],
    [[0,1],[0,2],[1,1],[2,1]],
    [[1,0],[1,1],[1,2],[2,2]],
    [[0,1],[1,1],[2,0],[2,1]],
  ],
  L: [
    [[0,2],[1,0],[1,1],[1,2]],
    [[0,1],[1,1],[2,1],[2,2]],
    [[1,0],[1,1],[1,2],[2,0]],
    [[0,0],[0,1],[1,1],[2,1]],
  ],
};

// Wall-kick offsets to try on rotation (dr, dc).
// Only filled cells are ever checked — empty cells in the 4×4 bounding box are
// completely ignored, so they never block movement near a wall.
const ROTATION_KICKS = [
  [0,0],[0,-1],[0,1],[0,-2],[0,2],[0,-3],[0,3],
  [-1,0],[-1,-1],[-1,1],[-1,-2],[-1,2],
  [-2,0],[-2,-1],[-2,1],
  [1,0],[1,-1],[1,1],
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the 4 absolute board positions (row, col, value) for a piece. */
export function getPieceCells(piece) {
  const offsets = SHAPES[piece.type][piece.rotation % 4];
  return offsets.map(([dr, dc], i) => ({
    row: piece.row + dr,
    col: piece.col + dc,
    value: piece.colors[i],
  }));
}

/** Returns the shape offsets for a given type/rotation (for previews). */
export function getShapeOffsets(type, rotation = 0) {
  return SHAPES[type][rotation % 4];
}

/** Check whether a piece can occupy its current position on the board. */
export function canPlacePiece(board, piece) {
  const cells = getPieceCells(piece);
  for (const { row, col } of cells) {
    if (col < 0 || col >= COLS) return false;
    if (row >= ROWS) return false;
    if (row >= 0 && board[row][col] !== 0) return false;
  }
  return true;
}

/** Ghost row: lowest valid row for the piece. */
export function getTetrisGhostRow(board, piece) {
  let p = piece;
  while (true) {
    const next = { ...p, row: p.row + 1 };
    if (!canPlacePiece(board, next)) break;
    p = next;
  }
  return p.row;
}

// ── Piece creation ────────────────────────────────────────────────────────────

function randomColors() {
  return Array.from({ length: 4 }, () => Math.ceil(Math.random() * COLOR_COUNT));
}

function randomType() {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

function spawnPiece(type, colors) {
  const t = type ?? randomType();
  const c = colors ?? randomColors();
  // I piece bounding box row 1 has the cells, so spawn at row -1 to appear at row 0
  const startRow = t === 'I' ? -1 : 0;
  return { type: t, rotation: 0, row: startRow, col: 3, colors: c };
}

// ── Line clearing ─────────────────────────────────────────────────────────────

function clearLines(board) {
  const remaining = [];
  let linesCleared = 0;
  for (let r = 0; r < ROWS; r++) {
    if (board[r].every(v => v !== 0)) {
      linesCleared++;
    } else {
      remaining.push([...board[r]]);
    }
  }
  const empties = Array.from({ length: linesCleared }, () => Array(COLS).fill(0));
  return { board: [...empties, ...remaining], linesCleared };
}

function lineClearScore(lines, level) {
  const base = [0, 100, 300, 500, 800][Math.min(lines, 4)];
  return base * Math.max(1, level);
}

// ── State ─────────────────────────────────────────────────────────────────────

export function createTetrisInitialState({ startLevel = 1, startScore = 0 } = {}) {
  const board = emptyBoard();
  const nextType   = randomType();
  const nextColors = randomColors();
  const current    = spawnPiece(randomType(), randomColors());
  return {
    board,
    currentPiece: current,
    nextPieceType:   nextType,
    nextPieceColors: nextColors,
    heldPiece:  null,   // { type, colors }
    holdUsed:   false,
    score:      startScore,
    level:      startLevel,
    startLevel,
    startScore,
    linesCleared: 0,
    gameOver: false,
    mergeFlash: 0,
    mergeStreak: 0,
    streakMilestone: 0,
    lastChainCount: 0,
    lastComboMultiplier: 1,
    turns: 0,
    timedGarbageThisTurn: false,
    pendingIncoming: 0,
  };
}

// ── Lock logic ────────────────────────────────────────────────────────────────

function lockTetrisPiece(state) {
  const {
    currentPiece, board, score, level,
    mergeStreak = 0, streakMilestone = 0, turns = 0,
  } = state;

  const cells = getPieceCells(currentPiece);
  const newBoard = board.map(r => [...r]);

  // Place cells — if any cell is above the board, it's a top-out
  for (const { row, col, value } of cells) {
    if (row < 0) return { ...state, gameOver: true };
    newBoard[row][col] = value;
  }

  // Blendit merge cascade (no line-clearing, no post-merge gravity)
  const { board: mergedBoard, score: mergeScoreVal, chainCount } = processMerges(newBoard);

  const finalBoard = mergedBoard;

  // Combo / streak
  const newStreak = mergeScoreVal > 0 ? mergeStreak + 1 : 0;
  const multiplier = comboMultiplier(newStreak);
  const boostedMergeScore = mergeScoreVal * multiplier;
  const newScore = score + boostedMergeScore;
  const newTurns = turns + 1;
  const streakBonus = newStreak > 0 && newStreak % 3 === 0 ? 1 : 0;
  const newStreakMilestone = streakMilestone + (streakBonus > 0 ? 1 : 0);

  // Spawn next piece
  const nextPiece = spawnPiece(state.nextPieceType, state.nextPieceColors);
  const nt = randomType();
  const nc = randomColors();

  const gameOver = !canPlacePiece(finalBoard, nextPiece);

  return {
    ...state,
    board: finalBoard,
    currentPiece: gameOver ? null : nextPiece,
    nextPieceType:   nt,
    nextPieceColors: nc,
    holdUsed: false,
    score: newScore,
    level,
    gameOver,
    mergeFlash: mergeScoreVal > 0 ? state.mergeFlash + 1 : state.mergeFlash,
    mergeStreak: gameOver ? 0 : newStreak,
    streakMilestone: newStreakMilestone,
    lastChainCount: chainCount,
    lastComboMultiplier: multiplier,
    turns: newTurns,
    timedGarbageThisTurn: false,
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

export function tetrisReducer(state, action) {
  if (state.gameOver && action.type !== 'RESTART') return state;

  switch (action.type) {
    case 'RESTART':
      return createTetrisInitialState({ startLevel: action.level ?? state.startLevel, startScore: action.startScore ?? 0 });

    case 'TICK':
    case 'SOFT_DROP': {
      const { currentPiece, board } = state;
      if (!currentPiece) return state;
      const next = { ...currentPiece, row: currentPiece.row + 1 };
      return canPlacePiece(board, next)
        ? { ...state, currentPiece: next }
        : lockTetrisPiece(state);
    }

    case 'HARD_DROP': {
      const { currentPiece, board } = state;
      if (!currentPiece) return state;
      let p = currentPiece;
      while (true) {
        const next = { ...p, row: p.row + 1 };
        if (!canPlacePiece(board, next)) break;
        p = next;
      }
      return lockTetrisPiece({ ...state, currentPiece: p });
    }

    case 'MOVE_LEFT': {
      const { currentPiece, board } = state;
      if (!currentPiece) return state;
      const next = { ...currentPiece, col: currentPiece.col - 1 };
      return canPlacePiece(board, next) ? { ...state, currentPiece: next } : state;
    }

    case 'MOVE_RIGHT': {
      const { currentPiece, board } = state;
      if (!currentPiece) return state;
      const next = { ...currentPiece, col: currentPiece.col + 1 };
      return canPlacePiece(board, next) ? { ...state, currentPiece: next } : state;
    }

    case 'ROTATE':
    case 'ROTATE_CCW': {
      const { currentPiece, board } = state;
      if (!currentPiece) return state;
      const dir = action.type === 'ROTATE' ? 1 : 3;
      const toRot = (currentPiece.rotation + dir) % 4;
      for (const [dr, dc] of ROTATION_KICKS) {
        const test = { ...currentPiece, rotation: toRot, row: currentPiece.row + dr, col: currentPiece.col + dc };
        if (canPlacePiece(board, test)) {
          return { ...state, currentPiece: test };
        }
      }
      return state;
    }

    case 'HOLD': {
      if (state.holdUsed || !state.currentPiece) return state;
      const { currentPiece, heldPiece, nextPieceType, nextPieceColors } = state;
      if (heldPiece === null) {
        const incoming = spawnPiece(nextPieceType, nextPieceColors);
        return {
          ...state,
          heldPiece: { type: currentPiece.type, colors: currentPiece.colors },
          currentPiece: incoming,
          nextPieceType: randomType(),
          nextPieceColors: randomColors(),
          holdUsed: true,
        };
      } else {
        const swapped = spawnPiece(heldPiece.type, heldPiece.colors);
        return {
          ...state,
          heldPiece: { type: currentPiece.type, colors: currentPiece.colors },
          currentPiece: swapped,
          holdUsed: true,
        };
      }
    }

    case 'LEVEL_UP':
      return { ...state, level: state.level + 1 };

    default:
      return state;
  }
}
