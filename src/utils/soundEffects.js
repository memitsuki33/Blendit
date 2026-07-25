// Sound Effects — Web Audio API chiptune synthesis. No files required.

let _ctx = null;

function ac() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// Plays a single oscillator note with exponential gain decay.
function tone(type, freq, t, dur, gain = 0.25, freqEnd = null) {
  const c = ac();
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(c.destination);

  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (freqEnd != null) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  o.connect(g);
  o.start(t);
  o.stop(t + dur + 0.01);
}

// Plays a short burst of band-filtered noise (percussion / impact).
function noise(t, dur, gain = 0.3, filterFreq = 1200) {
  const c = ac();
  const bufSize = c.sampleRate * dur;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buf;

  const flt = c.createBiquadFilter();
  flt.type = 'bandpass';
  flt.frequency.value = filterFreq;
  flt.Q.value = 1.5;

  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(flt);
  flt.connect(g);
  g.connect(c.destination);
  src.start(t);
  src.stop(t + dur + 0.01);
}

// ─── Global flags ────────────────────────────────────────────────────────────

let _soundEnabled = true;
let _musicEnabled = false;

export function setSoundEnabled(val) {
  _soundEnabled = val;
}

export function setMusicEnabled(val) {
  _musicEnabled = val;
  if (val) startMusic();
  else stopMusic();
}

// ─── Music ───────────────────────────────────────────────────────────────────

// Simple 16-step chiptune loop in C major (0 = rest)
const MUSIC_SEQ = [
  523.25, 659.25, 783.99, 659.25,
  523.25, 392.00, 440.00, 0,
  523.25, 659.25, 783.99, 1046.50,
  783.99, 659.25, 523.25, 0,
];
const MUSIC_STEP_DUR = 0.18; // seconds per note slot
const MUSIC_NOTE_DUR = 0.13;
const MUSIC_NOTE_GAIN = 0.06;

let _musicInterval = null;
let _musicStep = 0;
let _musicNextTime = 0;

function scheduleMusicNotes() {
  if (!_musicEnabled || !_musicInterval) return;
  const c = ac();
  const lookAhead = 0.15;
  while (_musicNextTime < c.currentTime + lookAhead) {
    const freq = MUSIC_SEQ[_musicStep % MUSIC_SEQ.length];
    if (freq > 0) {
      tone('square', freq, _musicNextTime, MUSIC_NOTE_DUR, MUSIC_NOTE_GAIN);
    }
    _musicNextTime += MUSIC_STEP_DUR;
    _musicStep++;
  }
}

export function startMusic() {
  if (_musicInterval) return;
  try {
    const c = ac();
    _musicNextTime = c.currentTime + 0.1;
    _musicStep = 0;
    _musicInterval = setInterval(scheduleMusicNotes, 50);
  } catch {}
}

export function stopMusic() {
  if (_musicInterval) {
    clearInterval(_musicInterval);
    _musicInterval = null;
  }
}

// ─── Public SFX API ──────────────────────────────────────────────────────────

/** Tile move left / right — crisp blip. */
export function playMove() {
  if (!_soundEnabled) return;
  const t = ac().currentTime;
  tone('square', 330, t, 0.03, 0.18);
}

/** Hard drop — downward sweep + noise thud. */
export function playHardDrop() {
  if (!_soundEnabled) return;
  const t = ac().currentTime;
  tone('square', 520, t, 0.12, 0.35, 60);
  noise(t, 0.07, 0.25, 800);
}

/** Merge — short two-note chime on every merge. */
export function playMerge() {
  if (!_soundEnabled) return;
  const t = ac().currentTime;
  tone('sine', 440, t,        0.09, 0.22);
  tone('sine', 659, t + 0.06, 0.09, 0.18);
}

/**
 * Combo arpeggio — number of notes and speed scale with the streak.
 * mergeStreak < 2: silent (no combo display).
 */
export function playCombo(mergeStreak) {
  if (!_soundEnabled) return;
  if (mergeStreak < 2) return;
  const t = ac().currentTime;
  const allNotes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5 E5 G5 C6 E6
  const count = Math.min(mergeStreak, 5);
  const step  = mergeStreak >= 5 ? 0.045 : 0.065;
  const dur   = mergeStreak >= 5 ? 0.10  : 0.13;
  const gain  = 0.20 + (count - 2) * 0.04;
  const notes = allNotes.slice(0, count);
  notes.forEach((freq, i) => tone('square', freq, t + i * step, dur, gain));
}

/** Level-up fanfare — four-note ascending square-wave arpeggio. */
export function playLevelUp() {
  if (!_soundEnabled) return;
  const t = ac().currentTime;
  const seq = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  seq.forEach((freq, i) => {
    const isLast = i === seq.length - 1;
    tone('square', freq, t + i * 0.09, isLast ? 0.28 : 0.10, isLast ? 0.32 : 0.22);
  });
}

/** Game over — descending sad melody. */
export function playGameOver() {
  if (!_soundEnabled) return;
  const t = ac().currentTime;
  const seq = [392, 329.63, 261.63, 196];
  seq.forEach((freq, i) => {
    tone('square', freq, t + i * 0.18, 0.22, 0.28);
  });
  tone('sine', 80, t + seq.length * 0.18, 0.35, 0.35, 40);
}

/** Garbage sent — sharp aggressive attack burst. */
export function playGarbageSend() {
  if (!_soundEnabled) return;
  const t = ac().currentTime;
  tone('sawtooth', 880, t,        0.04, 0.30, 200);
  tone('sawtooth', 440, t + 0.04, 0.06, 0.20, 100);
  noise(t, 0.06, 0.20, 600);
}

/** Garbage received — warning alarm pulse (two short buzzes). */
export function playGarbageReceive() {
  if (!_soundEnabled) return;
  const t = ac().currentTime;
  tone('square', 220, t,        0.06, 0.30, 180);
  tone('square', 220, t + 0.10, 0.06, 0.25, 180);
}

/** Hold piece — quick two-tone swap blip. */
export function playHold() {
  if (!_soundEnabled) return;
  const t = ac().currentTime;
  tone('square', 523.25, t,        0.05, 0.20, 659.25);
  tone('square', 392.00, t + 0.06, 0.07, 0.15);
}

/** Soft drop — subtle short downward sweep. */
export function playSoftDrop() {
  if (!_soundEnabled) return;
  const t = ac().currentTime;
  tone('square', 280, t, 0.04, 0.10, 180);
}

/** Piece lock (auto-drop) — quiet thud. */
export function playLock() {
  if (!_soundEnabled) return;
  const t = ac().currentTime;
  noise(t, 0.04, 0.12, 500);
}

/** Timed garbage drop every 5 turns — low thud. */
export function playTimedGarbage() {
  if (!_soundEnabled) return;
  const t = ac().currentTime;
  tone('sawtooth', 160, t, 0.08, 0.28, 80);
  noise(t, 0.05, 0.18, 400);
}

/** Button click sound. */
export function playClick() {
  if (!_soundEnabled) return;
  const t = ac().currentTime;
  tone('square', 440, t, 0.04, 0.18, 380);
}

/** Button hover sound. */
export function playHover() {
  if (!_soundEnabled) return;
  const t = ac().currentTime;
  tone('sine', 660, t, 0.03, 0.08);
}
