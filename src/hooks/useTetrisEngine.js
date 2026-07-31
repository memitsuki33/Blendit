import { useReducer, useEffect, useRef, useCallback } from 'react';
import { tetrisReducer, createTetrisInitialState } from '../utils/tetrisLogic.js';
import { getDropInterval, levelThreshold, MAX_LEVEL } from '../utils/constants.js';
import { playLevelUp, playMerge, playCombo, playGameOver } from '../utils/soundEffects.js';

export function useTetrisEngine({ startLevel = 1, startScore = 0, paused = false, gravity = false }) {
  const [state, dispatch] = useReducer(
    tetrisReducer,
    { startLevel, startScore },
    createTetrisInitialState
  );

  const stateRef = useRef(state);
  stateRef.current = state;
  const timerRef = useRef(null);

  // Gravity tick
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (state.gameOver || paused) return;

    if (!gravity) return;
    const interval = getDropInterval(state.level);
    if (!interval) return;

    timerRef.current = setInterval(() => dispatch({ type: 'TICK' }), interval);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [state.level, state.gameOver, paused]);

  // Level-up from score
  useEffect(() => {
    const { score, level } = state;
    if (level >= MAX_LEVEL) return;
    if (score >= levelThreshold(level + 1)) {
      dispatch({ type: 'LEVEL_UP' });
    }
  }, [state.score, state.level]);

  // Level-up sound
  const prevLevelRef = useRef(null);
  useEffect(() => {
    if (prevLevelRef.current !== null && state.level > prevLevelRef.current) playLevelUp();
    prevLevelRef.current = state.level;
  }, [state.level]);

  // Game-over sound
  const prevGameOverRef = useRef(false);
  useEffect(() => {
    if (state.gameOver && !prevGameOverRef.current) playGameOver();
    prevGameOverRef.current = state.gameOver;
  }, [state.gameOver]);

  // Merge + combo sounds
  const prevMergeFlashRef = useRef(state.mergeFlash);
  useEffect(() => {
    if (state.mergeFlash !== prevMergeFlashRef.current) {
      playMerge();
      playCombo(state.mergeStreak);
      prevMergeFlashRef.current = state.mergeFlash;
    }
  }, [state.mergeFlash, state.mergeStreak]);

  const moveLeft   = useCallback(() => dispatch({ type: 'MOVE_LEFT' }), []);
  const moveRight  = useCallback(() => dispatch({ type: 'MOVE_RIGHT' }), []);
  const softDrop   = useCallback(() => dispatch({ type: 'SOFT_DROP' }), []);
  const hardDrop   = useCallback(() => dispatch({ type: 'HARD_DROP' }), []);
  const rotate     = useCallback(() => dispatch({ type: 'ROTATE' }), []);
  const rotateCCW  = useCallback(() => dispatch({ type: 'ROTATE_CCW' }), []);
  const hold       = useCallback(() => dispatch({ type: 'HOLD' }), []);
  const restart    = useCallback((level) => dispatch({ type: 'RESTART', level: level ?? startLevel, startScore }), [startLevel, startScore]);

  return { state, moveLeft, moveRight, softDrop, hardDrop, rotate, rotateCCW, hold, restart };
}
