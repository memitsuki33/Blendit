import React, { useState, useEffect } from 'react';

// ── Instructions content per mode + game type ────────────────────────────────
const INSTRUCTIONS = {
  button: {
    normal: [
      { icon: '◀  ▶', text: 'Move piece left / right' },
      { icon: '▼',    text: 'Soft drop — fall faster' },
      { icon: '●',    text: 'Hard drop — place instantly (yellow button)' },
      { icon: '⊞',    text: 'HOLD — save the current piece' },
    ],
    tetris: [
      { icon: '◀  ▶', text: 'Move piece left / right' },
      { icon: '▼',    text: 'Soft drop — fall faster' },
      { icon: '●',    text: 'Hard drop — place instantly (yellow button)' },
      { icon: '↻',    text: 'Rotate piece (↻ button)' },
      { icon: '⊞',    text: 'HOLD — save the current piece' },
    ],
  },
  swipe: {
    normal: [
      { icon: '← →', text: 'Swipe left / right — move piece' },
      { icon: '↓',   text: 'Swipe down — hard drop (instant)' },
      { icon: '↑',   text: 'Swipe up — hold piece' },
    ],
    tetris: [
      { icon: '← →', text: 'Swipe left / right — move piece' },
      { icon: '↓',   text: 'Swipe down — hard drop (instant)' },
      { icon: '↑',   text: 'Swipe up — hold piece' },
      { icon: '✋',   text: 'Tap the board — rotate piece' },
    ],
  },
};

/**
 * Two-step pre-game onboarding modal.
 *
 * Props:
 *   gameType  — 'normal' | 'tetris'
 *   onReady   — called with the chosen controlMode when the user is done
 *
 * localStorage keys used:
 *   blendIt_controlMode      — 'button' | 'swipe'
 *   blendIt_skipModeSelect   — 'true'  → skip step 1
 *   blendIt_skipInstructions — 'true'  → skip step 2
 */
export default function MobilePreGameModal({ gameType = 'normal', onReady }) {
  const skipMode  = localStorage.getItem('blendIt_skipModeSelect')   === 'true';
  const skipInstr = localStorage.getItem('blendIt_skipInstructions') === 'true';
  const savedMode = localStorage.getItem('blendIt_controlMode') || 'button';

  // Compute which step to start on
  function initialStep() {
    if (skipMode && skipInstr) return 'done';
    if (skipMode)              return 'instructions';
    return 'mode-select';
  }

  const [step, setStep]           = useState(initialStep);
  const [mode, setMode]           = useState(savedMode);
  const [dontAskMode, setDontAskMode]   = useState(skipMode);
  const [dontAskInstr, setDontAskInstr] = useState(skipInstr);

  // If both already skipped, fire immediately
  useEffect(() => {
    if (step === 'done') onReady(savedMode);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (step === 'done') return null;

  // ── Step 1 — Mode select ────────────────────────────────────────────────
  function confirmMode() {
    localStorage.setItem('blendIt_controlMode', mode);
    if (dontAskMode) localStorage.setItem('blendIt_skipModeSelect', 'true');
    if (skipInstr) {
      onReady(mode);
    } else {
      setStep('instructions');
    }
  }

  // ── Step 2 — Instructions ───────────────────────────────────────────────
  function confirmInstructions() {
    if (dontAskInstr) localStorage.setItem('blendIt_skipInstructions', 'true');
    onReady(mode);
  }

  const instructions = INSTRUCTIONS[mode]?.[gameType] ?? INSTRUCTIONS.button.normal;

  return (
    <div className="pregame-backdrop">
      <div className="pregame-card">

        {step === 'mode-select' && (
          <>
            <div className="pregame-header">
              <span className="pregame-title">Choose Controls</span>
            </div>

            <div className="pregame-body">
              <div className="pregame-mode-grid">
                {/* Button Mode */}
                <button
                  className={`pregame-mode-opt${mode === 'button' ? ' selected' : ''}`}
                  onClick={() => setMode('button')}
                >
                  <span className="pregame-mode-icon">🎮</span>
                  <span className="pregame-mode-label">Button Mode</span>
                  <span className="pregame-mode-desc">Tap on-screen buttons</span>
                </button>

                {/* Swipe Mode */}
                <button
                  className={`pregame-mode-opt${mode === 'swipe' ? ' selected' : ''}`}
                  onClick={() => setMode('swipe')}
                >
                  <span className="pregame-mode-icon">👆</span>
                  <span className="pregame-mode-label">Swipe Mode</span>
                  <span className="pregame-mode-desc">Swipe &amp; tap the board</span>
                </button>
              </div>

              <label className="pregame-check-row">
                <input
                  type="checkbox"
                  checked={dontAskMode}
                  onChange={e => setDontAskMode(e.target.checked)}
                />
                <span>Don't ask again</span>
              </label>

              <button className="pregame-continue-btn" onClick={confirmMode}>
                Continue →
              </button>
            </div>
          </>
        )}

        {step === 'instructions' && (
          <>
            <div className="pregame-header">
              <span className="pregame-title">How to Play</span>
              <span className="pregame-mode-badge">
                {mode === 'swipe' ? '👆 Swipe' : '🎮 Buttons'}
              </span>
            </div>

            <div className="pregame-body">
              <ul className="pregame-instr-list">
                {instructions.map((row, i) => (
                  <li key={i} className="pregame-instr-row">
                    <span className="pregame-instr-icon">{row.icon}</span>
                    <span className="pregame-instr-text">{row.text}</span>
                  </li>
                ))}
              </ul>

              <label className="pregame-check-row">
                <input
                  type="checkbox"
                  checked={dontAskInstr}
                  onChange={e => setDontAskInstr(e.target.checked)}
                />
                <span>Don't show again</span>
              </label>

              <button className="pregame-continue-btn" onClick={confirmInstructions}>
                Play!
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
