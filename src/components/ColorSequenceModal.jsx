import React from 'react';

const COLORS = [
  { label: 'R', name: 'Red',    bg: '#e53935', text: '#fff',    pts: 100  },
  { label: 'O', name: 'Orange', bg: '#f57c00', text: '#fff',    pts: 200  },
  { label: 'Y', name: 'Yellow', bg: '#fdd835', text: '#1a1a1a', pts: 400  },
  { label: 'G', name: 'Green',  bg: '#43a047', text: '#fff',    pts: 800  },
  { label: 'B', name: 'Blue',   bg: '#1e88e5', text: '#fff',    pts: 1600 },
  { label: 'I', name: 'Indigo', bg: '#3949ab', text: '#fff',    pts: 3200 },
  { label: 'V', name: 'Violet', bg: '#8e24aa', text: '#fff',    pts: 6400 },
];

function formatPts(n) {
  if (n >= 1000) return `${n / 1000}K`;
  return String(n);
}

function Chip({ color, size = 26, label }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 4,
      background: color.bg, color: color.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 900, fontSize: size * 0.42, flexShrink: 0,
      boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
    }}>
      {label ?? color.label}
    </div>
  );
}

// N chips of baseColor in a row
function ChipRow({ color, count, size = 24 }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: count }).map((_, i) => (
        <Chip key={i} color={color} size={size} />
      ))}
    </div>
  );
}

// Merge rule row: N tiles of base → 1 result tile
function MergeRow({ base, count, result, note }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 0', borderBottom: '1px solid var(--border)',
    }}>
      <ChipRow color={base} count={Math.min(count, 5)} size={22} />
      {count > 5 && (
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-dim)' }}>×{count}</span>
      )}
      <span style={{ color: 'var(--text-dim)', fontWeight: 900, fontSize: '0.8rem', flexShrink: 0 }}>→</span>
      <Chip color={result} size={26} />
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', marginLeft: 2 }}>
        {note}
      </span>
    </div>
  );
}

// Section label
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '0.62rem', fontWeight: 900, letterSpacing: '2px',
      textTransform: 'uppercase', color: 'var(--text-dim)',
      marginTop: 4, marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

export default function ColorSequenceModal({ onClose, actionLabel = 'Play!' }) {
  const red = COLORS[0];

  // Pre-compute merge results for N reds (index 0-based in COLORS)
  // N tiles → advance N-1 steps
  const mergeRows = [
    { count: 2, resultIdx: 1, note: 'Step up once. Easiest merge — happens constantly.' },
    { count: 3, resultIdx: 2, note: 'Skip two steps. Great for chaining into existing tiles.' },
    { count: 4, resultIdx: 3, note: 'Leap three steps. Stack columns to set this up.' },
    { count: 5, resultIdx: 4, note: 'Four steps up. Takes patience — worth the setup.' },
    { count: 6, resultIdx: 5, note: 'Five steps. Rare but devastating in combos.' },
    { count: 7, resultIdx: 6, note: 'All the way to Violet — 6.4K pts in one merge!' },
    { count: 8, resultIdx: 0, note: 'Wraps back to Red. Cycle starts over.' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card color-seq-card" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <span className="modal-title">Color Cycle Guide</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="csg-body">

          {/* ── Section 1: The Cycle ── */}
          <SectionLabel>The Cycle</SectionLabel>
          <div className="csg-cycle-row">
            {COLORS.map((c, i) => (
              <React.Fragment key={c.label}>
                <div className="csg-cycle-cell">
                  <div className="csg-big-tile" style={{ background: c.bg, color: c.text }}>
                    {c.label}
                  </div>
                  <span className="csg-color-name">{c.name}</span>
                  <span className="csg-color-pts">{formatPts(c.pts)} pts</span>
                </div>
                {i < COLORS.length - 1 && (
                  <span className="csg-cycle-arrow">›</span>
                )}
              </React.Fragment>
            ))}
            <span className="csg-cycle-arrow csg-wrap-arrow">↩</span>
          </div>

          {/* ── Section 2: Merge Rules ── */}
          <SectionLabel>Merge Rules — using Red as example</SectionLabel>
          <p style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginBottom: 8, lineHeight: 1.5 }}>
            N connected same-color tiles → <strong style={{ color: 'var(--text)' }}>1 tile, N−1 steps forward</strong> in the cycle.
            Applies to every color — group more tiles for a bigger jump and higher score.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {mergeRows.map(({ count, resultIdx, note }) => (
              <MergeRow
                key={count}
                base={red}
                count={count}
                result={COLORS[resultIdx]}
                note={note}
              />
            ))}
          </div>

          {/* ── Section 3: Clearing Garbage ── */}
          <SectionLabel>Garbage Rows</SectionLabel>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', background: 'var(--bg)',
            borderRadius: 6, border: '1px solid var(--border)',
          }}>
            {/* Garbage row visual */}
            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
              {[0,1,2,3,4].map(i => (
                i === 2
                  ? <Chip key={i} color={COLORS[0]} size={20} />
                  : <div key={i} style={{ width: 20, height: 20, borderRadius: 3, background: '#555' }} />
              ))}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              Gray, non-mergeable rows with <strong style={{ color: 'var(--text)' }}>one colored gap tile</strong>.
              Drop a matching color onto the gap — the <em>entire row disappears instantly</em>.
              One row arrives every <strong style={{ color: 'var(--accent)' }}>10 turns</strong>, so clear each one before the next hits.
            </span>
          </div>

          {/* ── Section 4: Tips ── */}
          <SectionLabel>Strategy Tips</SectionLabel>
          <div className="csg-tips">
            <div className="csg-tip">
              <span className="csg-tip-icon">⛓</span>
              <span><strong>Cascades are free score.</strong> After a merge, tiles fall and recheck — a single well-placed drop can trigger 4 or 5 chain merges automatically.</span>
            </div>
            <div className="csg-tip">
              <span className="csg-tip-icon">🎯</span>
              <span><strong>Drop position is the result position.</strong> The merged tile lands exactly where you dropped — use this to aim your cascade into the next group.</span>
            </div>
            <div className="csg-tip">
              <span className="csg-tip-icon">🤚</span>
              <span><strong>Hold (R / /)</strong> banks the current tile without placing it. Dodge a bad color or save a tile for an incoming match. Resets after each drop.</span>
            </div>
            <div className="csg-tip">
              <span className="csg-tip-icon">⚔</span>
              <span><strong>Battle attacks:</strong> every 3 cascade steps sends 1 garbage row to your opponent. A 9-chain sends 3 rows at once — overwhelm them before they recover.</span>
            </div>
          </div>

        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
            {actionLabel}
          </button>
        </div>

      </div>
    </div>
  );
}
