import React, { useState } from 'react';
import { getTileColor, formatValue } from '../utils/colors.js';
import { getDropInterval } from '../utils/constants.js';

function Tile({ value, size = 40 }) {
  const color = getTileColor(value);
  return (
    <div style={{
      width: size, height: size, borderRadius: 5,
      background: color.bg, color: color.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 900, fontSize: size * 0.38, flexShrink: 0,
      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      letterSpacing: 0,
    }}>
      {formatValue(value)}
    </div>
  );
}

function GarbageCell({ size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 5,
      background: '#555', flexShrink: 0,
    }} />
  );
}

function Empty({ size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 5,
      background: '#0d1520', flexShrink: 0,
      border: '1px solid #1e2a3a',
    }} />
  );
}

function Arrow({ size = 40 }) {
  return (
    <div style={{
      width: size, height: size, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.55, color: 'var(--text-dim)', flexShrink: 0,
    }}>
      →
    </div>
  );
}

function MiniGrid({ cells, cols, size = 36, gap = 3 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, ${size}px)`,
      gap,
    }}>
      {cells.map((v, i) =>
        v === -1 ? <GarbageCell key={i} size={size} />
        : v === 0 ? <Empty key={i} size={size} />
        : <Tile key={i} value={v} size={size} />
      )}
    </div>
  );
}

function MergeExample({ before, beforeCols, after, afterCols, label, size = 36 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <MiniGrid cells={before} cols={beforeCols} size={size} />
      <Arrow size={size} />
      <MiniGrid cells={after} cols={afterCols} size={size} />
      <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-dim)', minWidth: 130 }}>
        {label}
      </span>
    </div>
  );
}

const PAGES = [
  { title: 'The Board' },
  { title: 'Colors & Merging' },
  { title: 'Bigger Groups & Chains' },
  { title: 'Levels & Speed' },
  { title: 'Battle Mode' },
  { title: 'Controls' },
];

// Score per color index
const COLOR_SCORES = [0, 100, 200, 400, 800, 1600, 3200, 6400];
const COLOR_NAMES  = ['', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'];

export default function Tutorial({ onBack }) {
  const [page, setPage] = useState(0);

  return (
    <div className="tutorial-screen">
      <div className="tutorial-header">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>Back</button>
        <div className="tutorial-progress">
          {PAGES.map((p, i) => (
            <button
              key={i}
              className={`tutorial-dot${i === page ? ' active' : ''}`}
              onClick={() => setPage(i)}
            />
          ))}
        </div>
        <span className="tutorial-page-label">{page + 1} / {PAGES.length}</span>
      </div>

      <div className="tutorial-body">
        <h2 className="tutorial-title">{PAGES[page].title}</h2>

        {/* ── Page 0: The Board ── */}
        {page === 0 && (
          <div className="tutorial-content">
            <p>
              The board is <strong>10 columns wide</strong> and <strong>20 rows tall</strong>.
              One colored tile falls at a time — move it left or right, then drop it into a column.
              Tiles of the <strong>same color</strong> that are touching (horizontally or vertically)
              <strong> automatically merge</strong> into a higher color the moment they meet.
            </p>

            {/* Color strip */}
            <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5, 6, 7].map(v => <Tile key={v} value={v} size={42} />)}
            </div>
            <p style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>
              Red → Orange → Yellow → Green → Blue → Indigo → Violet → Red (repeats)
            </p>

            <p style={{ marginTop: 12, color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              <strong style={{ color: 'var(--text)' }}>Ghost outline</strong> — the faint tile
              below your piece shows exactly where it will land. Use it to line up merges
              before you commit. The <strong style={{ color: 'var(--text)' }}>Next</strong> preview
              in the side panel shows what's coming so you can plan two moves ahead.
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              <strong style={{ color: 'var(--text)' }}>Hold (R)</strong> — banks the current
              tile without placing it. Swap it back in at any time. Use Hold to skip a color
              that doesn't fit or save a key tile to complete a group — resets after each drop.
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              <strong style={{ color: 'var(--text)' }}>Goal:</strong> survive as long as
              possible while building the highest score you can. The game ends when a new tile
              can't spawn — keep the board clear and chase Violet merges.
            </p>
          </div>
        )}

        {/* ── Page 1: Colors & Merging ── */}
        {page === 1 && (
          <div className="tutorial-content">
            <p>
              When <strong>2 or more same-color tiles touch</strong>, they instantly merge
              into <strong>1 tile advanced in the color cycle</strong>.
              More tiles in the group = a bigger jump forward:
            </p>
            <div className="merge-examples">
              <MergeExample
                label="2 Reds → Orange (+1 step)"
                before={[1, 1]}       beforeCols={2}
                after={[2]}           afterCols={1}
              />
              <MergeExample
                label="3 Reds → Yellow (+2 steps)"
                before={[1, 1, 1, 0]} beforeCols={2}
                after={[0, 3]}        afterCols={2}
              />
              <MergeExample
                label="4 Reds → Green (+3 steps)"
                before={[0,1,1,1,1,0]} beforeCols={3}
                after={[0,4,0,0,0,0]}  afterCols={3}
              />
            </div>
            <p style={{ marginTop: 12, color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              <strong style={{ color: 'var(--text)' }}>Formula:</strong> N tiles of color C
              → 1 tile, N−1 steps forward. After a merge, gravity pulls tiles down and
              the board rechecks — if the merged tile now touches another same-color group,
              it merges again for free. These <strong style={{ color: 'var(--text)' }}>cascades</strong> are
              the key to high scores.
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              <strong style={{ color: 'var(--text)' }}>Drop position = result position.</strong> The
              merged tile lands where you placed your piece. Drop left of a group and
              the result sits left; drop right and it stays right. Use this to steer
              your cascade into the next match deliberately.
            </p>
          </div>
        )}

        {/* ── Page 2: Bigger Groups & Chains ── */}
        {page === 2 && (
          <div className="tutorial-content">
            <p>
              Each color has a point value — higher colors score exponentially more.
              A single Violet merge is worth <strong>64× a Red merge</strong>:
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, marginBottom: 12 }}>
              {[1, 2, 3, 4, 5, 6, 7].map(v => (
                <div key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Tile value={v} size={38} />
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)' }}>
                    {COLOR_SCORES[v] >= 1000 ? `${COLOR_SCORES[v] / 1000}K` : COLOR_SCORES[v]}
                  </span>
                </div>
              ))}
            </div>

            <div className="merge-examples">
              <MergeExample
                label="2 Oranges → Yellow (400 pts)"
                before={[2, 2]}        beforeCols={2}
                after={[3]}            afterCols={1}
              />
              <MergeExample
                label="3 Blues → Violet (6.4K pts!)"
                before={[5, 5, 5, 0]}  beforeCols={2}
                after={[0, 7]}         afterCols={2}
              />
            </div>

            <p style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              <strong style={{ color: 'var(--text)' }}>Chain combos</strong> happen when one
              merge cascades into another. Each step in a chain adds to your score and — in
              Battle mode — sends garbage to your opponent. A 9-step chain sends 3 rows at once.
              Build columns of matching colors and trigger them all with a single drop.
              After Violet, the cycle wraps back to Red and you start climbing again.
            </p>
          </div>
        )}

        {/* ── Page 3: Levels & Speed ── */}
        {page === 3 && (
          <div className="tutorial-content">
            <p>
              <strong>Level 0 — Permanent.</strong> Tiles never fall on their own.
              Drop at your own pace — ideal for learning.
            </p>
            <p style={{ marginTop: 6 }}>
              <strong>Level 1+</strong> — tiles auto-drop on a timer.
              Every level cuts <strong>0.02 s</strong> off the interval:
            </p>
            <div className="level-table">
              {[1, 5, 10, 20, 30, 40, 50].map(lv => {
                const ms = getDropInterval(lv);
                const maxMs = getDropInterval(1);
                return (
                  <div key={lv} className="level-table-row">
                    <span className="level-table-lv">Lv {lv}</span>
                    <div className="level-table-bar-wrap">
                      <div className="level-table-bar" style={{ width: `${(ms / maxMs) * 100}%` }} />
                    </div>
                    <span className="level-table-ms">{(ms / 1000).toFixed(2)}s</span>
                  </div>
                );
              })}
            </div>
            <p style={{ marginTop: 10, color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              Your level rises automatically as your score grows — no input needed.
              Speed caps at <strong style={{ color: 'var(--text)' }}>0.02 s</strong> (level 50+).
              Open <strong style={{ color: 'var(--text)' }}>Settings</strong> in-game to
              <strong style={{ color: 'var(--text)' }}> Reset</strong> to level 0, or
              <strong style={{ color: 'var(--text)' }}> Load Level</strong> to jump back to
              the nearest lower multiple of 5 (e.g. level 13 → load 10).
            </p>
          </div>
        )}

        {/* ── Page 4: Battle Mode ── */}
        {page === 4 && (
          <div className="tutorial-content">
            <p>
              <strong>PC battle</strong> — two players share one keyboard on side-by-side boards.
              <strong> Mobile battle</strong> — play online against anyone using a room code.
              The first player whose board fills to the top <strong>loses</strong>. If both
              fill up on the same piece, the higher score wins.
            </p>

            <p style={{ marginTop: 8 }}>
              Build chain combos to attack. Every <strong>3 combo steps</strong> sends
              <strong> 1 garbage row</strong> to the opponent:
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 6 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[3, 6, 9, 12].map(c => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 52, fontWeight: 800, fontSize: '0.82rem', color: 'var(--accent)' }}>{c}-chain</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>→</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 700 }}>
                      {Math.floor(c / 3)} garbage row{Math.floor(c / 3) !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, padding: '10px 12px', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.77rem', color: 'var(--text-dim)', lineHeight: 1.8 }}>
                Garbage rows rise from the bottom — gray and unblendable, with
                <strong style={{ color: 'var(--text)' }}> 1 colored gap tile</strong>.
                Match a tile to that gap color and the <em>entire row vanishes</em>.
                Rows land on the opponent's <em>next</em> piece drop, giving a brief window to react.
              </div>
            </div>

            <p style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--accent)' }}>Timed garbage</strong> — every
              <strong style={{ color: 'var(--text)' }}> 10 pieces</strong>, one garbage row
              rises on <em>every player's board</em> automatically, no matter what.
              Clear the colored gap quickly — rows stack up fast and a buried board is
              nearly impossible to recover from.
            </p>
          </div>
        )}

        {/* ── Page 5: Controls ── */}
        {page === 5 && (
          <div className="tutorial-content">
            <div className="controls-table">
              <div className="controls-section">
                <div className="controls-section-title p1">Single Player / Player 1 (PC)</div>
                <div className="controls-row">
                  <kbd>←</kbd><kbd>A</kbd> <span>Move left</span>
                </div>
                <div className="controls-row">
                  <kbd>→</kbd><kbd>D</kbd> <span>Move right</span>
                </div>
                <div className="controls-row">
                  <kbd>↓</kbd><kbd>S</kbd> <span>Soft drop — one step down</span>
                </div>
                <div className="controls-row">
                  <kbd>↑</kbd><kbd>W</kbd><kbd>Space</kbd> <span>Hard drop — instant</span>
                </div>
                <div className="controls-row">
                  <kbd>R</kbd> <span>Hold — stash tile for later</span>
                </div>
                <div className="controls-row">
                  <kbd>Esc</kbd> <span>Settings</span>
                </div>
              </div>
              <div className="controls-section">
                <div className="controls-section-title p2">Player 2 (PC Battle only)</div>
                <div className="controls-row">
                  <kbd>←</kbd> <span>Move left</span>
                </div>
                <div className="controls-row">
                  <kbd>→</kbd> <span>Move right</span>
                </div>
                <div className="controls-row">
                  <kbd>↓</kbd> <span>Soft drop</span>
                </div>
                <div className="controls-row">
                  <kbd>↑</kbd><kbd>Space</kbd> <span>Hard drop</span>
                </div>
                <div className="controls-row">
                  <kbd>/</kbd> <span>Hold</span>
                </div>
              </div>
              <div className="controls-section">
                <div className="controls-section-title" style={{ color: '#16a34a' }}>Mobile</div>
                <div className="controls-row">
                  <span style={{ color: 'var(--text)' }}>
                    On-screen D-pad:
                    <strong style={{ color: 'var(--accent)' }}> ▲▲</strong> hard drop,
                    <strong> ◀▶</strong> move,
                    <strong> ▼</strong> soft drop.
                    Tap <strong>Settings</strong> in the info bar to reset or load a level.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="tutorial-footer">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Prev
        </button>
        {page < PAGES.length - 1 ? (
          <button className="btn btn-primary btn-sm" onClick={() => setPage(p => p + 1)}>
            Next
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onBack}>
            Got it
          </button>
        )}
      </div>
    </div>
  );
}
