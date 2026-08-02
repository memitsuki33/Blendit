import { useRef } from 'react';

const MIN_SWIPE = 35; // px — minimum travel to register as a swipe
const TAP_MAX   = 12; // px — max travel to still count as a tap

/**
 * Attach the returned handlers to any touch-target element.
 * onLeft / onRight / onDown / onUp fire on swipe.
 * onTap fires when the finger barely moved.
 * enabled=false silences everything (useful when game is paused / over).
 */
export function useSwipeControls({ onLeft, onRight, onDown, onUp, onTap, enabled = true }) {
  const startRef = useRef(null);

  const handleTouchStart = (e) => {
    if (!enabled) return;
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e) => {
    if (!enabled || !startRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startRef.current.x;
    const dy = t.clientY - startRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    startRef.current = null;

    // Tap — finger barely moved
    if (absDx < TAP_MAX && absDy < TAP_MAX) {
      onTap?.();
      return;
    }

    // Swipe — use dominant axis
    if (absDx >= absDy) {
      if (absDx >= MIN_SWIPE) dx > 0 ? onRight?.() : onLeft?.();
    } else {
      if (absDy >= MIN_SWIPE) dy > 0 ? onDown?.() : onUp?.();
    }
  };

  return { onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd };
}
