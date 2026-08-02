import React, { useState, useRef, useEffect } from 'react';
import SettingsModal from './SettingsModal.jsx';
import ColorSequenceModal from './ColorSequenceModal.jsx';
import ShopModal from './ShopModal.jsx';
import { levelThreshold, MAX_LEVEL } from '../utils/constants.js';

function getWsUrl() {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/game-ws`;
}

const NAV_ITEMS = ['HOME', 'LEVELS', 'RANKS', 'TROPHIES', 'CHATS', 'SETTINGS', 'USER DATA', 'LOG OUT'];

// Level jump checkpoints: multiples of 5 up to MAX_LEVEL
const JUMP_LEVELS = Array.from({ length: Math.floor(MAX_LEVEL / 5) }, (_, i) => (i + 1) * 5);

function fmtScore(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function DashboardScreen({
  onSinglePlayer, onMobileSinglePlayer, onTetris, onMobileTetris, onLocalBattle, onOnlineStart, onLogOut,
  animSpeed, onAnimSpeed,
  soundEnabled, onSoundEnabled,
  musicEnabled, onMusicEnabled,
}) {
  const [activeNav, setActiveNav] = useState('HOME');
  const [panel, setPanel] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showShop, setShowShop] = useState(false);

  // 2-player local battle level
  const [localLevel, setLocalLevel] = useState(0);

  // Online lobby state
  const [lobbyPhase, setLobbyPhase] = useState('menu'); // menu | creating | waiting | joining | error
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [lobbyError, setLobbyError] = useState('');
  const [onlineLevel, setOnlineLevel] = useState(0);
  const wsRef = useRef(null);

  // Clean up WebSocket when leaving online-lobby panel or unmounting
  useEffect(() => {
    if (panel !== 'online-lobby' && wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [panel]);
  useEffect(() => () => { if (wsRef.current) wsRef.current.close(); }, []);

  // Coins & purchased slots — persisted in localStorage
  const [coins] = useState(() =>
    parseInt(localStorage.getItem('blendIt_coins') || '0', 10)
  );
  const [purchased, setPurchased] = useState(() => {
    try { return JSON.parse(localStorage.getItem('blendIt_purchased') || '[]'); }
    catch { return []; }
  });

  function handleBuy(slot, price) {
    if (coins < price || purchased.includes(slot)) return;
    // coins spending would be wired to real currency later; for now just unlock
    const next = [...purchased, slot];
    setPurchased(next);
    localStorage.setItem('blendIt_purchased', JSON.stringify(next));
  }

  const maxUnlocked = parseInt(
    typeof localStorage !== 'undefined'
      ? (localStorage.getItem('blendIt_maxLevel') || '0')
      : '0', 10
  );

  function handleNav(item) {
    if (item === 'LOG OUT') { onLogOut(); return; }
    if (item === 'SETTINGS') { setShowSettings(true); return; }
    setActiveNav(item);
  }

  // ── Sub-panels (shared between desktop and mobile) ──────────────────────
  function renderSinglePlayerPanel() {
    return (
      <div className="dashboard-center dashboard-sub-center">
        <h2 className="dashboard-sub-title">Single Player</h2>
        <button className="dash-btn dash-btn-orange" onClick={() => setPanel('normal-mode')}>
          Normal Mode
        </button>
        <button className="dash-btn dash-btn-blue" onClick={() => setPanel('tetris-mode')}>Tetris Mode</button>
        <button className="dash-btn dash-btn-ghost" onClick={() => setShowColors(true)}>
          Color Cycle Guide
        </button>
        <button className="dash-btn dash-btn-ghost" onClick={() => setPanel('home')}>Back</button>
      </div>
    );
  }

  function renderTetrisPanel() {
    return (
      <div className="dashboard-center dashboard-sub-center">
        <div className="nm-header">
          <button className="nm-back-btn" onClick={() => setPanel('single-player')}>Back</button>
          <h2 className="nm-title">Single Player<br />(Tetris Mode)</h2>
        </div>
        <div className="nm-list">
          <button
            className="dash-btn dash-btn-blue nm-start0"
            onClick={() => onTetris({ level: 1, startScore: 0 })}
          >
            Start at Level 1
          </button>
          {JUMP_LEVELS.map(lv => {
            const locked = lv > maxUnlocked;
            const pts = levelThreshold(lv);
            const startScore = Math.floor(pts * 0.95);
            return (
              <button
                key={lv}
                className={`nm-level-row${locked ? ' nm-level-locked' : ''}`}
                onClick={locked ? undefined : () => onTetris({ level: lv, startScore })}
                disabled={locked}
              >
                <span className="nm-lv-label">Lv {lv}</span>
                <span className="nm-lv-pts">{fmtScore(pts)} pts to reach</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderNormalPanel() {
    return (
      <div className="dashboard-center dashboard-sub-center">
        <div className="nm-header">
          <button className="nm-back-btn" onClick={() => setPanel('single-player')}>Back</button>
          <h2 className="nm-title">Single Player<br />(Normal Mode)</h2>
        </div>
        <div className="nm-list">
          <button
            className="dash-btn dash-btn-orange nm-start0"
            onClick={() => onSinglePlayer({ level: 0, startScore: 0 })}
          >
            Starts at Level 0
          </button>
          {JUMP_LEVELS.map(lv => {
            const locked = lv > maxUnlocked;
            const pts = levelThreshold(lv);
            const startScore = Math.floor(pts * 0.95);
            return (
              <button
                key={lv}
                className={`nm-level-row${locked ? ' nm-level-locked' : ''}`}
                onClick={locked ? undefined : () => onSinglePlayer({ level: lv, startScore })}
                disabled={locked}
              >
                <span className="nm-lv-label">Lv {lv}</span>
                <span className="nm-lv-pts">{fmtScore(pts)} pts to reach</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderPvpPanel() {
    return (
      <div className="dashboard-center dashboard-sub-center">
        <h2 className="dashboard-sub-title">Player vs Player</h2>
        <button className="dash-btn dash-btn-orange" onClick={() => {
          setLobbyPhase('menu');
          setRoomCode('');
          setJoinInput('');
          setLobbyError('');
          setPanel('online-lobby');
        }}>
          Online Mode
        </button>
        <button className="dash-btn dash-btn-blue" onClick={() => {
          setLocalLevel(0);
          setPanel('two-player');
        }}>
          2 Player Mode
        </button>
        <button className="dash-btn dash-btn-ghost" onClick={() => setPanel('home')}>
          Back
        </button>
      </div>
    );
  }

  function renderTwoPlayerPanel() {
    return (
      <div className="dashboard-center dashboard-sub-center">
        <h2 className="dashboard-sub-title">Player vs Player</h2>

        <div className="ol-level-row">
          <span className="ol-label">Starting Level</span>
          <div className="ol-stepper">
            <button
              className="dash-btn dash-btn-ghost ol-step-btn"
              onClick={() => setLocalLevel(l => Math.max(0, l - 1))}
            >−</button>
            <span className="ol-level-val">{localLevel}</span>
            <button
              className="dash-btn dash-btn-ghost ol-step-btn"
              onClick={() => setLocalLevel(l => Math.min(MAX_LEVEL, l + 1))}
            >+</button>
          </div>
          <span className="ol-label" style={{ color: 'var(--text-dim)', fontSize: '0.65rem', marginTop: 2 }}>
            Both players start at the same level
          </span>
        </div>

        <button
          className="dash-btn dash-btn-orange ol-wide"
          onClick={() => onLocalBattle({ level: localLevel })}
        >
          Start Game
        </button>

        <button className="dash-btn dash-btn-ghost" onClick={() => setShowColors(true)}>
          Color Cycle Guide
        </button>

        <div className="tp-controls-hint">
          <strong>P1:</strong> A/D = move &nbsp; S = soft drop &nbsp; W = hard drop<br />
          <strong>P2:</strong> ← / → = move &nbsp; ↓ = soft drop &nbsp; ↑ = hard drop
        </div>

        <button className="dash-btn dash-btn-ghost" onClick={() => setPanel('pvp')}>
          Back
        </button>
      </div>
    );
  }

  // ── Online lobby WebSocket helpers ───────────────────────────────────────
  function openWs(onMessage) {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;
    ws.onmessage = (e) => {
      let msg; try { msg = JSON.parse(e.data); } catch { return; }
      onMessage(ws, msg);
    };
    ws.onerror = () => { setLobbyPhase('error'); setLobbyError('Connection failed. Try again.'); };
    ws.onclose = (ev) => {
      if (ev.code !== 1000) {
        setLobbyPhase(p => p === 'waiting' ? 'error' : p);
        setLobbyError('Disconnected. Please try again.');
      }
    };
    return ws;
  }

  function handleCreate() {
    setLobbyPhase('creating');
    setLobbyError('');
    const ws = openWs((ws, msg) => {
      if (msg.type === 'created') { setRoomCode(msg.code); setLobbyPhase('waiting'); }
      if (msg.type === 'start')   { onOnlineStart({ ws, level: onlineLevel, playerIndex: msg.playerIndex }); }
      if (msg.type === 'error')   { setLobbyPhase('error'); setLobbyError(msg.message); }
    });
    ws.onopen = () => ws.send(JSON.stringify({ type: 'create', level: onlineLevel }));
  }

  function handleJoin() {
    const code = joinInput.trim().toUpperCase();
    if (code.length !== 4) { setLobbyError('Enter the 4-letter room code.'); return; }
    setLobbyPhase('joining');
    setLobbyError('');
    const ws = openWs((ws, msg) => {
      if (msg.type === 'joined') { setRoomCode(code); setLobbyPhase('waiting'); }
      if (msg.type === 'start')  { onOnlineStart({ ws, level: msg.level ?? onlineLevel, playerIndex: msg.playerIndex }); }
      if (msg.type === 'error')  { setLobbyPhase('menu'); setLobbyError(msg.message); ws.close(); }
    });
    ws.onopen = () => ws.send(JSON.stringify({ type: 'join', code }));
  }

  function handleLobbyBack() {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (lobbyPhase === 'menu' || lobbyPhase === 'error') {
      setPanel('pvp');
    } else {
      setLobbyPhase('menu');
      setRoomCode('');
      setJoinInput('');
      setLobbyError('');
    }
  }

  function renderOnlineLobbyPanel() {
    const busy = lobbyPhase === 'creating' || lobbyPhase === 'joining';
    return (
      <div className="dashboard-center dashboard-sub-center">
        <h2 className="dashboard-sub-title">Online Mode</h2>

        {(lobbyPhase === 'menu' || busy) && (
          <>
            {/* Level picker */}
            <div className="ol-level-row">
              <span className="ol-label">Starting Level</span>
              <div className="ol-stepper">
                <button className="dash-btn dash-btn-ghost ol-step-btn"
                  onClick={() => setOnlineLevel(l => Math.max(0, l - 1))}
                  disabled={busy}>−</button>
                <span className="ol-level-val">{onlineLevel}</span>
                <button className="dash-btn dash-btn-ghost ol-step-btn"
                  onClick={() => setOnlineLevel(l => Math.min(60, l + 1))}
                  disabled={busy}>+</button>
              </div>
            </div>

            <button
              className="dash-btn dash-btn-orange ol-wide"
              onClick={handleCreate}
              disabled={busy}
            >
              {lobbyPhase === 'creating' ? 'Connecting...' : 'Create Room'}
            </button>

            <div className="ol-or">— or —</div>

            <div className="ol-join-row">
              <input
                className="ol-code-input"
                placeholder="XXXX"
                maxLength={4}
                value={joinInput}
                onChange={e => setJoinInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                disabled={busy}
              />
              <button
                className="dash-btn dash-btn-blue"
                onClick={handleJoin}
                disabled={busy}
              >
                {lobbyPhase === 'joining' ? '...' : 'Join'}
              </button>
            </div>

            {lobbyError && <div className="ol-error">{lobbyError}</div>}
          </>
        )}

        {lobbyPhase === 'waiting' && (
          <div className="ol-waiting">
            <div className="ol-code-display">
              <span className="ol-label">Room Code</span>
              <span className="ol-code-big">{roomCode}</span>
              <span className="ol-label">Share with your opponent</span>
            </div>
            <div className="lobby-spinner" />
            <span className="ol-label">Waiting for opponent...</span>
          </div>
        )}

        {lobbyPhase === 'error' && (
          <div className="ol-waiting">
            <div className="ol-error" style={{ fontSize: '0.9rem', textAlign: 'center' }}>{lobbyError}</div>
          </div>
        )}

        <button className="dash-btn dash-btn-ghost" onClick={handleLobbyBack}>
          {lobbyPhase === 'waiting' ? 'Cancel' : 'Back'}
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Background */}
      <div className={`dashboard-bg${panel === 'pvp' ? ' dashboard-bg--pvp' : ''}`} />

      {/* ════════════════════════════════════════
          DESKTOP layout (hidden on mobile)
          ════════════════════════════════════════ */}
      <div className="dashboard-desktop">
        {/* Left player card */}
        <div className="dashboard-player-card" />

        {/* Center panels */}
        {panel === 'home' && (
          <div className="dashboard-center">
            <div className="dashboard-row">
              <button className="dash-btn dash-btn-orange" onClick={() => setPanel('single-player')}>
                Single Player
              </button>
              <button className="dash-btn dash-btn-pink">Friends</button>
            </div>
            <div className="dashboard-row">
              <button className="dash-btn dash-btn-blue" onClick={() => setPanel('pvp')}>PvP</button>
              <button className="dash-btn dash-btn-purple">Dailies</button>
            </div>
            <div className="dashboard-row">
              <button className="dash-btn dash-btn-green" onClick={() => setShowShop(true)}>Shop</button>
              <button className="dash-btn dash-btn-teal">Quest</button>
            </div>
          </div>
        )}
        {panel === 'single-player'  && renderSinglePlayerPanel()}
        {panel === 'tetris-mode'    && renderTetrisPanel()}
        {panel === 'normal-mode'    && renderNormalPanel()}
        {panel === 'pvp'            && renderPvpPanel()}
        {panel === 'two-player'     && renderTwoPlayerPanel()}
        {panel === 'online-lobby'   && renderOnlineLobbyPanel()}

        {/* Right nav sidebar */}
        <nav className="dashboard-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item}
              className={`dashboard-nav-btn${item === activeNav ? ' dashboard-nav-active' : ''}`}
              onClick={() => handleNav(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      {/* ════════════════════════════════════════
          MOBILE layout (hidden on desktop)
          ════════════════════════════════════════ */}
      <div className="dashboard-mobile">
        <img src="/group46.png" alt="" aria-hidden="true" className="auth-group46-bg" />

        {/* Home panel */}
        {panel === 'home' && (
          <>
            {/* Logo */}
            <div className="db-mobile-logo-wrap">
              <img
                src="/logo.png"
                alt="BlendIt"
                className="db-mobile-logo"
                draggable={false}
              />
            </div>

            {/* Main buttons */}
            <div className="db-mobile-buttons">
              <button className="dash-btn dash-btn-orange db-mobile-btn" onClick={() => setPanel('single-player')}>
                Single Player
              </button>
              <button className="dash-btn dash-btn-blue db-mobile-btn" onClick={() => setPanel('pvp')}>
                PvP
              </button>
              <button className="dash-btn dash-btn-green db-mobile-btn" onClick={() => setShowShop(true)}>
                Shop
              </button>
              <button className="dash-btn dash-btn-pink db-mobile-btn">
                Friends
              </button>
            </div>
          </>
        )}

        {/* Sub-panels on mobile — full scrollable list */}
        {panel === 'single-player' && (
          <div className="db-mobile-sub">
            <button className="nm-back-btn db-mobile-back" onClick={() => setPanel('home')}>← Back</button>
            <h2 className="dashboard-sub-title">Single Player</h2>
            <button className="dash-btn dash-btn-orange db-mobile-btn" onClick={() => setPanel('normal-mode')}>Normal Mode</button>
            <button className="dash-btn dash-btn-blue db-mobile-btn" onClick={() => setPanel('tetris-mode')}>Tetris Mode</button>
            <button className="dash-btn dash-btn-ghost db-mobile-btn" onClick={() => setShowColors(true)}>Color Cycle Guide</button>
          </div>
        )}

        {panel === 'tetris-mode' && (
          <div className="db-mobile-sub db-mobile-list">
            <button className="nm-back-btn db-mobile-back" onClick={() => setPanel('single-player')}>← Back</button>
            <h2 className="nm-title" style={{ textAlign: 'center', marginBottom: 8 }}>Tetris Mode</h2>
            <button className="dash-btn dash-btn-blue db-mobile-btn" onClick={() => onMobileTetris({ level: 1, startScore: 0 })}>
              Start at Level 1
            </button>
            {JUMP_LEVELS.map(lv => {
              const locked = lv > maxUnlocked;
              const pts = levelThreshold(lv);
              return (
                <button
                  key={lv}
                  className={`nm-level-row db-mobile-level${locked ? ' nm-level-locked' : ''}`}
                  onClick={locked ? undefined : () => onMobileTetris({ level: lv, startScore: Math.floor(pts * 0.95) })}
                  disabled={locked}
                >
                  <span className="nm-lv-label">Lv {lv}</span>
                  <span className="nm-lv-pts">{fmtScore(pts)} pts</span>
                </button>
              );
            })}
          </div>
        )}

        {panel === 'normal-mode' && (
          <div className="db-mobile-sub db-mobile-list">
            <button className="nm-back-btn db-mobile-back" onClick={() => setPanel('single-player')}>← Back</button>
            <h2 className="nm-title" style={{ textAlign: 'center', marginBottom: 8 }}>Normal Mode</h2>
            <button className="dash-btn dash-btn-orange db-mobile-btn" onClick={() => onMobileSinglePlayer({ level: 0, startScore: 0 })}>
              Start at Level 0
            </button>
            {JUMP_LEVELS.map(lv => {
              const locked = lv > maxUnlocked;
              const pts = levelThreshold(lv);
              return (
                <button
                  key={lv}
                  className={`nm-level-row db-mobile-level${locked ? ' nm-level-locked' : ''}`}
                  onClick={locked ? undefined : () => onMobileSinglePlayer({ level: lv, startScore: Math.floor(pts * 0.95) })}
                  disabled={locked}
                >
                  <span className="nm-lv-label">Lv {lv}</span>
                  <span className="nm-lv-pts">{fmtScore(pts)} pts</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom tab bar */}
        <nav className="db-mobile-nav">
          <button
            className={`db-mobile-nav-home${activeNav === 'HOME' ? ' active' : ''}`}
            onClick={() => { setActiveNav('HOME'); setPanel('home'); }}
          >
            HOME
          </button>
          <div className="db-mobile-nav-tabs">
            {['LEVELS', 'RANKS', 'TROPHIES', 'CHATS', 'SETTINGS', 'USER DATA', 'LOG OUT'].map(item => (
              <button
                key={item}
                className={`db-mobile-nav-tab${activeNav === item ? ' active' : ''}`}
                onClick={() => handleNav(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Shared modals */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          animSpeed={animSpeed} onAnimSpeed={onAnimSpeed}
          soundEnabled={soundEnabled} onSoundEnabled={onSoundEnabled}
          musicEnabled={musicEnabled} onMusicEnabled={onMusicEnabled}
        />
      )}
      {showColors && (
        <ColorSequenceModal onClose={() => setShowColors(false)} actionLabel="Got it!" />
      )}
      {showShop && (
        <ShopModal
          coins={coins}
          purchased={purchased}
          onBuy={handleBuy}
          onClose={() => setShowShop(false)}
        />
      )}
    </div>
  );
}
