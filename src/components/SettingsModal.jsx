import React from 'react';

/**
 * Shared settings modal.
 *
 * Props:
 *   onClose        — close the modal
 *   animSpeed      — current anim speed ('none' | 'normal')
 *   onAnimSpeed    — change anim speed
 *   soundEnabled   — bool
 *   onSoundEnabled — (bool) => void
 *   musicEnabled   — bool
 *   onMusicEnabled — (bool) => void
 *   onReset        — (optional) restart at level 0
 *   checkpointLevel— (optional) nearest multiple-of-5 level to load
 *   onLoadLevel    — (optional) restart at checkpointLevel
 */
export default function SettingsModal({
  onClose,
  animSpeed,
  onAnimSpeed,
  soundEnabled,
  onSoundEnabled,
  musicEnabled,
  onMusicEnabled,
  controlMode,
  onControlMode,
  onReset,
  checkpointLevel,
  onLoadLevel,
}) {
  const hasGameControls = onReset || onLoadLevel;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <span className="modal-title">Settings</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">

          {/* Animation toggle */}
          <div className="modal-row">
            <span className="modal-label">Animation</span>
            <div className="settings-options">
              {['none', 'normal'].map(opt => (
                <button
                  key={opt}
                  className={`settings-opt${animSpeed === opt ? ' active' : ''}`}
                  onClick={() => onAnimSpeed(opt)}
                >
                  {opt === 'none' ? 'Off' : 'On'}
                </button>
              ))}
            </div>
          </div>

          {/* Sound FX toggle */}
          <div className="modal-row">
            <span className="modal-label">Sound FX</span>
            <div className="settings-options">
              <button
                className={`settings-opt${soundEnabled ? ' active' : ''}`}
                onClick={() => onSoundEnabled(true)}
              >
                On
              </button>
              <button
                className={`settings-opt${!soundEnabled ? ' active' : ''}`}
                onClick={() => onSoundEnabled(false)}
              >
                Off
              </button>
            </div>
          </div>

          {/* Music toggle */}
          <div className="modal-row">
            <span className="modal-label">Music</span>
            <div className="settings-options">
              <button
                className={`settings-opt${musicEnabled ? ' active' : ''}`}
                onClick={() => onMusicEnabled(true)}
              >
                On
              </button>
              <button
                className={`settings-opt${!musicEnabled ? ' active' : ''}`}
                onClick={() => onMusicEnabled(false)}
              >
                Off
              </button>
            </div>
          </div>

          {/* Mobile controls toggle — only shown when prop is provided */}
          {onControlMode && (
            <div className="modal-row">
              <span className="modal-label">Controls</span>
              <div className="settings-options">
                {['button', 'swipe'].map(opt => (
                  <button
                    key={opt}
                    className={`settings-opt${controlMode === opt ? ' active' : ''}`}
                    onClick={() => onControlMode(opt)}
                  >
                    {opt === 'button' ? '🎮 Buttons' : '👆 Swipe'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* In-game: Reset / Load Level */}
          {hasGameControls && (
            <>
              <div className="modal-divider" />

              {onReset && (
                <button
                  className="btn btn-danger btn-sm modal-wide-btn"
                  onClick={() => { onReset(); onClose(); }}
                >
                  Reset — Level 0
                </button>
              )}

              {onLoadLevel && checkpointLevel >= 5 && (
                <button
                  className="btn btn-secondary btn-sm modal-wide-btn"
                  onClick={() => { onLoadLevel(checkpointLevel); onClose(); }}
                >
                  Load Level {checkpointLevel}
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
