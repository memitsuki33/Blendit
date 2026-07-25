export const COLS = 10;
export const ROWS = 20;
export const SPAWN_COL = 5; // center

// Number of colors in the cycle: Red-Orange-Yellow-Green-Blue-Indigo-Violet
export const COLOR_COUNT = 7;

// Color names for display (index 1-7)
export const COLOR_NAMES = ['', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'];
export const COLOR_LETTERS = ['', 'R', 'O', 'Y', 'G', 'B', 'I', 'V'];

// Score thresholds for single-player level ups
// threshold[n] = cumulative score needed to reach level n
export function levelThreshold(n) {
  if (n === 0) return 0;
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += 300 * Math.pow(2, i - 1);
  }
  return total;
}

export function getDropInterval(level) {
  if (level === 0) return null; // level 0 = permanent, no auto-drop
  // Level 1 = 1000ms, each level subtracts 20ms (0.02s), minimum 20ms at level 50+
  return Math.max(20, 1000 - (level - 1) * 20);
}

export const MAX_LEVEL = 60;
