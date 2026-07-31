import React, { useState, useEffect } from 'react';
import LandingScreen from './components/LandingScreen.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import SignupScreen from './components/SignupScreen.jsx';
import ProfileSetupScreen from './components/ProfileSetupScreen.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import DashboardScreen from './components/DashboardScreen.jsx';
import GameDashboard from './components/GameDashboard.jsx';
import LevelSelect from './components/LevelSelect.jsx';
import SinglePlayerGame from './components/SinglePlayerGame.jsx';
import MobileSinglePlayerGame from './components/MobileSinglePlayerGame.jsx';
import BattleGame from './components/BattleGame.jsx';
import MobileLobby from './components/MobileLobby.jsx';
import MobileBattleGame from './components/MobileBattleGame.jsx';
import Tutorial from './components/Tutorial.jsx';
import TetrisGame from './components/TetrisGame.jsx';
import { setSoundEnabled, setMusicEnabled } from './utils/soundEffects.js';

export default function App() {
  const [screen, setScreen] = useState('loading-intro');
  const [gameConfig, setGameConfig] = useState(null);
  const [animSpeed, setAnimSpeed] = useState('normal');
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [musicEnabled, setMusicEnabledState] = useState(false);

  // Sync module-level flags whenever settings change
  useEffect(() => {
    setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    setMusicEnabled(musicEnabled);
  }, [musicEnabled]);

  const settings = { animSpeed, setAnimSpeed, soundEnabled, setSoundEnabledState, musicEnabled, setMusicEnabledState };

  const goMenu = () => {
    if (gameConfig?.ws) {
      try { gameConfig.ws.close(); } catch {}
    }
    setScreen('menu');
    setGameConfig(null);
  };

  if (screen === 'loading-intro') {
    return <LoadingScreen onDone={() => setScreen('landing')} />;
  }

  if (screen === 'landing') {
    return <LandingScreen onLogin={() => setScreen('login')} onRegister={() => setScreen('signup')} />;
  }

  if (screen === 'login') {
    return <LoginScreen onBack={() => setScreen('landing')} onLogin={() => setScreen('loading')} />;
  }

  if (screen === 'signup') {
    return <SignupScreen onBack={() => setScreen('landing')} onSignup={() => setScreen('profile-setup')} />;
  }

  if (screen === 'profile-setup') {
    return <ProfileSetupScreen onProceed={() => setScreen('loading')} />;
  }

  if (screen === 'loading') {
    return <LoadingScreen onDone={() => setScreen('menu')} />;
  }

  if (screen === 'menu') {
    return (
      <DashboardScreen
        onSinglePlayer={(cfg) => { setGameConfig(cfg); setScreen('game-dashboard'); }}
        onTetris={() => setScreen('tetris')}
        onPvP={() => setScreen('battle-select')}
        onLogOut={() => setScreen('landing')}
        animSpeed={animSpeed}
        onAnimSpeed={setAnimSpeed}
        soundEnabled={soundEnabled}
        onSoundEnabled={setSoundEnabledState}
        musicEnabled={musicEnabled}
        onMusicEnabled={setMusicEnabledState}
      />
    );
  }

  if (screen === 'game-dashboard') {
    return (
      <GameDashboard
        startLevel={gameConfig?.level ?? 0}
        startScore={gameConfig?.startScore ?? 0}
        onBack={goMenu}
        animSpeed={animSpeed} onAnimSpeed={setAnimSpeed}
        soundEnabled={soundEnabled} onSoundEnabled={setSoundEnabledState}
        musicEnabled={musicEnabled} onMusicEnabled={setMusicEnabledState}
      />
    );
  }

  if (screen === 'tetris') {
    return (
      <TetrisGame
        onBack={goMenu}
        startLevel={1}
        animSpeed={animSpeed}
      />
    );
  }

  if (screen === 'tutorial') {
    return <Tutorial onBack={goMenu} />;
  }

  if (screen === 'single-select') {
    return (
      <LevelSelect
        mode="single"
        onBack={goMenu}
        onStart={(cfg) => { setGameConfig(cfg); setScreen('single'); }}
        animSpeed={animSpeed} onAnimSpeed={setAnimSpeed}
        soundEnabled={soundEnabled} onSoundEnabled={setSoundEnabledState}
        musicEnabled={musicEnabled} onMusicEnabled={setMusicEnabledState}
      />
    );
  }

  if (screen === 'battle-select') {
    return (
      <LevelSelect
        mode="battle"
        onBack={goMenu}
        onStart={(cfg) => {
          setGameConfig(cfg);
          setScreen('battle');
        }}
        animSpeed={animSpeed} onAnimSpeed={setAnimSpeed}
        soundEnabled={soundEnabled} onSoundEnabled={setSoundEnabledState}
        musicEnabled={musicEnabled} onMusicEnabled={setMusicEnabledState}
      />
    );
  }

  if (screen === 'single') {
    return (
      <SinglePlayerGame
        onBack={goMenu}
        startLevel={gameConfig?.level ?? 0}
        startScore={gameConfig?.startScore ?? 0}
        animSpeed={animSpeed}
        onAnimSpeed={setAnimSpeed}
        soundEnabled={soundEnabled}
        onSoundEnabled={setSoundEnabledState}
        musicEnabled={musicEnabled}
        onMusicEnabled={setMusicEnabledState}
      />
    );
  }

  if (screen === 'mobile-single-select') {
    return (
      <LevelSelect
        mode="single"
        onBack={goMenu}
        onStart={(cfg) => { setGameConfig(cfg); setScreen('mobile-single'); }}
        animSpeed={animSpeed} onAnimSpeed={setAnimSpeed}
        soundEnabled={soundEnabled} onSoundEnabled={setSoundEnabledState}
        musicEnabled={musicEnabled} onMusicEnabled={setMusicEnabledState}
      />
    );
  }

  if (screen === 'mobile-single') {
    return (
      <MobileSinglePlayerGame
        onBack={goMenu}
        startLevel={gameConfig?.level ?? 0}
        animSpeed={animSpeed}
        onAnimSpeed={setAnimSpeed}
        soundEnabled={soundEnabled}
        onSoundEnabled={setSoundEnabledState}
        musicEnabled={musicEnabled}
        onMusicEnabled={setMusicEnabledState}
      />
    );
  }

  if (screen === 'battle' && gameConfig) {
    return (
      <BattleGame
        level={gameConfig.level}
        onBack={goMenu}
        animSpeed={animSpeed}
        onAnimSpeed={setAnimSpeed}
        soundEnabled={soundEnabled}
        onSoundEnabled={setSoundEnabledState}
        musicEnabled={musicEnabled}
        onMusicEnabled={setMusicEnabledState}
      />
    );
  }

  if (screen === 'mobile-lobby') {
    return (
      <MobileLobby
        onBack={goMenu}
        onStart={(cfg) => {
          setGameConfig(cfg);
          setScreen('mobile-battle');
        }}
      />
    );
  }

  if (screen === 'mobile-battle' && gameConfig) {
    return (
      <MobileBattleGame
        ws={gameConfig.ws}
        level={gameConfig.level}
        playerIndex={gameConfig.playerIndex}
        onBack={goMenu}
        animSpeed={animSpeed}
        onAnimSpeed={setAnimSpeed}
        soundEnabled={soundEnabled}
        onSoundEnabled={setSoundEnabledState}
        musicEnabled={musicEnabled}
        onMusicEnabled={setMusicEnabledState}
      />
    );
  }

  return null;
}
