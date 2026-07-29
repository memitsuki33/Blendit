import { ROWS, COLS, COLOR_COUNT, comboMultiplier } from './constants.js';

export function emptyBoard() {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}

export function canPlace(board, row, col) {
  if (col < 0 || col >= COLS) return false;
  if (row < 0) return true; // above board during spawn
  if (row >= ROWS) return false;
  return board[row][col] === 0;
}

export function getGhostRow(board, piece) {
  let row = piece.row;
  while (row + 1 < ROWS && board[row + 1][piece.col] === 0) {
    row++;
  }
  return row;
}

export function applyGravity(board) {
  const result = emptyBoard();
  for (let c = 0; c < COLS; c++) {
    let writeRow = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][c] !== 0) {
        result[writeRow][c] = board[r][c];
        writeRow--;
      }
    }
  }
  return result;
}

function bfsGroup(board, startRow, startCol, visited) {
  const value = board[startRow][startCol];
  if (value <= 0) return []; // empty or garbage cell

  const group = [];
  const queue = [[startRow, startCol]];

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const key = r * COLS + c;
    if (visited.has(key)) continue;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
    if (board[r][c] !== value) continue;
    if (board[r][c] < 0) { visited.add(key); continue; } // skip garbage cells
    visited.add(key);
    group.push([r, c]);
    queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
  }
  return group;
}

// Merge N tiles of color C → color ((C - 1 + N - 1) % COLOR_COUNT) + 1
function mergedColor(baseColor, groupSize) {
  return ((baseColor - 1 + groupSize - 1) % COLOR_COUNT) + 1;
}

// Base score per merge group — same for all colors; combo multiplier applied in lockPiece
function mergeScore(_resultColor) {
  return 200;
}

// Process all merges (with cascades). Returns { board, score, chainCount }.
export function processMerges(board, placedRow = -1, placedCol = -1) {
  let current = board.map(r => [...r]);
  let totalScore = 0;
  let chainCount = 0;
  let anyMerge = true;

  const resultCells = new Set();

  let pRow = placedRow;
  let pCol = placedCol;

  while (anyMerge) {
    anyMerge = false;
    const visited = new Set();
    const groups = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const key = r * COLS + c;
        if (current[r][c] > 0 && !visited.has(key)) {
          const group = bfsGroup(current, r, c, visited);
          if (group.length >= 2) {
            groups.push(group);
          }
        }
      }
    }

    if (groups.length === 0) break;

    anyMerge = true;
    chainCount += groups.length;

    const next = current.map(r => [...r]);

    for (const group of groups) {
      const value = current[group[0][0]][group[0][1]];
      const newValue = mergedColor(value, group.length);

      // If gap tile in a garbage row is part of this group, erase the garbage row
      for (const [gr] of group) {
        if (next[gr].some(v => v === -1)) {
          for (let col = 0; col < COLS; col++) {
            if (next[gr][col] === -1) next[gr][col] = 0;
          }
        }
      }

      // Target cell selection
      let targetCell = null;

      if (pRow >= 0 && pCol >= 0) {
        const inGroup = group.find(([r, c]) => r === pRow && c === pCol);
        if (inGroup) {
          targetCell = inGroup;
          pRow = -1;
          pCol = -1;
        }
      }

      if (!targetCell) {
        const preferred = group.filter(([r, c]) => !resultCells.has(r * COLS + c));
        const candidates = preferred.length > 0 ? preferred : group;

        let maxRow = -1;
        for (const [r] of candidates) if (r > maxRow) maxRow = r;
        const bottom = candidates.filter(([r]) => r === maxRow);
        bottom.sort((a, b) => a[1] - b[1]);
        targetCell = bottom[0];
      }

      for (const [gr, gc] of group) next[gr][gc] = 0;
      next[targetCell[0]][targetCell[1]] = newValue;
      resultCells.add(targetCell[0] * COLS + targetCell[1]);
      totalScore += mergeScore(newValue);
    }

    current = applyGravity(next);
  }

  return { board: current, score: totalScore, chainCount };
}

// Next piece: all 7 colors have equal chance
export function getNextPieceValue(_board) {
  return Math.ceil(Math.random() * COLOR_COUNT);
}

// Garbage gap tiles: any of the 7 colors
export function getGarbagePool(_board) {
  return [1, 2, 3, 4, 5, 6, 7];
}

// Add garbage rows at bottom (shifts board up). Returns { board, gameOver }.
export function addGarbageRows(board, count, garbagePool) {
  const pool = garbagePool && garbagePool.length > 0 ? garbagePool : [1, 2, 3];
  const newBoard = board.map(r => [...r]);

  for (let i = 0; i < count; i++) {
    if (newBoard[0].some(v => v !== 0)) {
      return { board: newBoard, gameOver: true };
    }

    for (let r = 0; r < ROWS - 1; r++) {
      newBoard[r] = [...newBoard[r + 1]];
    }

    const gapCol = Math.floor(Math.random() * COLS);
    const gapValue = pool[Math.floor(Math.random() * pool.length)];
    newBoard[ROWS - 1] = Array.from({ length: COLS }, (_, c) =>
      c === gapCol ? gapValue : -1
    );
  }

  return { board: newBoard, gameOver: false };
}

// Initial game state factory
export function createInitialState({ startLevel = 0, startScore = 0 } = {}) {
  const board = emptyBoard();
  const nextVal = getNextPieceValue(board);
  const pieceVal = getNextPieceValue(board);
  return {
    board,
    currentPiece: { value: pieceVal, col: Math.floor(COLS / 2), row: 0 },
    nextPieceValue: nextVal,
    score: startScore,
    level: startLevel,
    startLevel,
    gameOver: false,
    winner: null,
    totalGarbageSent: 0,
    lockFlash: false,
    mergeFlash: 0,
    pendingIncoming: 0,
    pendingIncomingPool: [1, 2, 3],
    mergeStreak: 0,
    streakMilestone: 0,
    lastChainCount: 0,
    lastComboMultiplier: 1,
    heldValue: null,
    holdUsed: false,
    turns: 0,
    timedGarbageThisTurn: false,
  };
}

export function gameReducer(state, action) {
  if (state.gameOver && action.type !== 'RESTART') {
    return state;
  }

  switch (action.type) {
    case 'RESTART': {
      return createInitialState({ startLevel: action.level ?? state.startLevel });
    }

    case 'MOVE_LEFT': {
      const { currentPiece, board } = state;
      if (!currentPiece) return state;
      const newCol = currentPiece.col - 1;
      if (!canPlace(board, currentPiece.row, newCol)) return state;
      return { ...state, currentPiece: { ...currentPiece, col: newCol } };
    }

    case 'MOVE_RIGHT': {
      const { currentPiece, board } = state;
      if (!currentPiece) return state;
      const newCol = currentPiece.col + 1;
      if (!canPlace(board, currentPiece.row, newCol)) return state;
      return { ...state, currentPiece: { ...currentPiece, col: newCol } };
    }

    case 'SOFT_DROP':
    case 'TICK': {
      const { currentPiece, board } = state;
      if (!currentPiece) return state;
      const nextRow = currentPiece.row + 1;
      if (!canPlace(board, nextRow, currentPiece.col)) {
        return lockPiece(state);
      }
      return { ...state, currentPiece: { ...currentPiece, row: nextRow } };
    }

    case 'HARD_DROP': {
      const { currentPiece, board } = state;
      if (!currentPiece) return state;
      let row = currentPiece.row;
      while (row + 1 < ROWS && board[row + 1][currentPiece.col] === 0) {
        row++;
      }
      return lockPiece({ ...state, currentPiece: { ...currentPiece, row } });
    }

    case 'LEVEL_UP': {
      return { ...state, level: state.level + 1 };
    }

    case 'ADD_INCOMING_GARBAGE': {
      return {
        ...state,
        pendingIncoming: state.pendingIncoming + action.rows,
        pendingIncomingPool: action.garbagePool ?? state.pendingIncomingPool,
      };
    }

    case 'HOLD': {
      if (state.holdUsed || !state.currentPiece) return state;
      const { currentPiece, heldValue, nextPieceValue, board } = state;
      const spawnCol = Math.floor(COLS / 2);
      if (heldValue === null) {
        const newNext = getNextPieceValue(board);
        return {
          ...state,
          heldValue: currentPiece.value,
          holdUsed: true,
          currentPiece: { value: nextPieceValue, col: spawnCol, row: 0 },
          nextPieceValue: newNext,
        };
      } else {
        return {
          ...state,
          heldValue: currentPiece.value,
          holdUsed: true,
          currentPiece: { value: heldValue, col: spawnCol, row: 0 },
        };
      }
    }

    case 'FORCE_GAMEOVER': {
      return { ...state, gameOver: true };
    }

    default:
      return state;
  }
}

function lockPiece(state) {
  const {
    currentPiece, board, score, level, startLevel,
    totalGarbageSent, pendingIncoming, pendingIncomingPool,
    mergeStreak = 0, streakMilestone = 0,
    turns = 0,
  } = state;

  const newBoard = board.map(r => [...r]);
  if (currentPiece.row >= 0) {
    newBoard[currentPiece.row][currentPiece.col] = currentPiece.value;
  }

  const { board: mergedBoard, score: mergeScoreVal, chainCount } = processMerges(newBoard, currentPiece.row, currentPiece.col);

  const newStreak = mergeScoreVal > 0 ? mergeStreak + 1 : 0;
  const multiplier = comboMultiplier(newStreak);
  const boostedScore = mergeScoreVal * multiplier;
  const streakBonus = (newStreak > 0 && newStreak % 3 === 0) ? 1 : 0;
  const newStreakMilestone = streakMilestone + (streakBonus > 0 ? 1 : 0);

  const garbageToSend = Math.floor(chainCount / 3) + streakBonus;
  const newTotalGarbage = totalGarbageSent + garbageToSend;
  const newScore = score + boostedScore;
  const newTurns = turns + 1;

  let finalBoard = mergedBoard;
  let garbageKill = false;

  // Every 10 turns: add 1 timed garbage row (with 1 colored gap tile to clear it)
  const timedGarbageThisTurn = newTurns % 10 === 0;
  if (timedGarbageThisTurn) {
    const pool = getGarbagePool(finalBoard);
    const gr = addGarbageRows(finalBoard, 1, pool);
    finalBoard = gr.board;
    if (gr.gameOver) garbageKill = true;
  }

  // Pending incoming (battle mode)
  if (!garbageKill && pendingIncoming > 0) {
    const pool = getGarbagePool(finalBoard);
    const result = addGarbageRows(finalBoard, pendingIncoming, pool);
    finalBoard = result.board;
    if (result.gameOver) garbageKill = true;
  }

  const spawnCol = Math.floor(COLS / 2);
  const newPieceValue = state.nextPieceValue;
  const nextPieceValue = getNextPieceValue(finalBoard);
  const newPiece = { value: newPieceValue, col: spawnCol, row: 0 };

  if (garbageKill || !canPlace(finalBoard, newPiece.row, newPiece.col)) {
    return {
      ...state,
      board: finalBoard,
      currentPiece: null,
      gameOver: true,
      score: newScore,
      totalGarbageSent: newTotalGarbage,
      pendingIncoming: 0,
      pendingIncomingPool: [1, 2, 3],
      mergeFlash: mergeScoreVal > 0 ? (state.mergeFlash + 1) : state.mergeFlash,
      mergeStreak: 0,
      streakMilestone: newStreakMilestone,
      lastChainCount: chainCount,
      lastComboMultiplier: multiplier,
      holdUsed: false,
      turns: newTurns,
      timedGarbageThisTurn,
    };
  }

  return {
    ...state,
    board: finalBoard,
    currentPiece: newPiece,
    nextPieceValue,
    score: newScore,
    level,
    startLevel,
    totalGarbageSent: newTotalGarbage,
    pendingIncoming: 0,
    pendingIncomingPool: [1, 2, 3],
    mergeFlash: mergeScoreVal > 0 ? (state.mergeFlash + 1) : state.mergeFlash,
    mergeStreak: newStreak,
    streakMilestone: newStreakMilestone,
    lastChainCount: chainCount,
    lastComboMultiplier: multiplier,
    holdUsed: false,
    turns: newTurns,
    timedGarbageThisTurn,
  };
}
