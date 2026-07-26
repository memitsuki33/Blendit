export const COLS = 10;
export const ROWS = 20;
export const SPAWN_COL = 5; // center

// Number of colors in the cycle: Red-Orange-Yellow-Green-Blue-Indigo-Violet
export const COLOR_COUNT = 7;

// Color names for display (index 1-7)
export const COLOR_NAMES = ['', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'];
export const COLOR_LETTERS = ['', 'R', 'O', 'Y', 'G', 'B', 'I', 'V'];

// Score thresholds for single-player level ups.
// Incremental cost to transition TO level n:
//   0→1: 1K | 1→5: 5K/lv | 6→10: 10K/lv | 11→15: 15K/lv | 16→20: 20K/lv
//   21→25: 25K/lv | 26→30: 30K/lv | 31→35: 35K/lv | 36→40: 40K/lv
//   41→45: 45K/lv | 46→50: 50K/lv | 51→100: 60K/lv
export function levelThreshold(n) {
  if (n <= 0) return 0;
  let total = 1_000; // 0→1
  for (let lv = 2; lv <= n; lv++) {
    if      (lv <= 5)  total += 5_000;
    else if (lv <= 10) total += 10_000;
    else if (lv <= 15) total += 15_000;
    else if (lv <= 20) total += 20_000;
    else if (lv <= 25) total += 25_000;
    else if (lv <= 30) total += 30_000;
    else if (lv <= 35) total += 35_000;
    else if (lv <= 40) total += 40_000;
    else if (lv <= 45) total += 45_000;
    else if (lv <= 50) total += 50_000;
    else               total += 60_000; // 51–100
  }
  return total;
}

// Combo multiplier for a given consecutive-merge streak count (1-based).
// streak 1 → ×1 | 2–5 → ×2 | 6–10 → ×3 | 11–15 → ×4 | 16–20 → ×5 | …
export function comboMultiplier(streak) {
  if (streak <= 1) return 1;
  if (streak <= 5) return 2;
  return Math.floor((streak - 6) / 5) + 3;
}

export function getDropInterval(level) {
  if (level === 0) return null; // level 0 = permanent, no auto-drop
  // Level 1 = 1000ms, each level −20ms, minimum 40ms at level 49+
  return Math.max(40, 1000 - (level - 1) * 20);
}

export const MAX_LEVEL = 100;
