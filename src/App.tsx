import React, { useState, useEffect, useRef } from 'react';
import { TitleScreen } from './components/TitleScreen.tsx';
import { PlayingHUD } from './components/PlayingHUD.tsx';
import { DailyRewardsModal } from './components/DailyRewardsModal.tsx';
import { LevelSelectModal } from './components/LevelSelectModal.tsx';
import { ArmoryModal } from './components/ArmoryModal.tsx';
import { VictoryModal, GameOverModal, PauseModal } from './components/StatusModals.tsx';
import { GameEngine, HudData, GameOutcome } from './game/engine.ts';
import { audio } from './game/audio.ts';
import {
  GameView,
  LevelConfig,
  LEVELS,
  SavedGameState,
} from './game/types.ts';
import {
  calculateLevelStars,
  getNextDailyRewardState,
  isDailyRewardAvailable,
  getDailyChallenge,
} from './game/rules.ts';
import { loadGameState, saveGameState } from './game/storage.ts';

export default function App() {
  const [gameState, setGameState] = useState<SavedGameState>(() => loadGameState());
  const [currentView, setCurrentView] = useState<GameView>('title');
  const [activeLevel, setActiveLevel] = useState<LevelConfig>(LEVELS[0]);
  const [activeModifier, setActiveModifier] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => audio.getMuted());

  // In-run state
  const [hudData, setHudData] = useState<HudData>({
    hp: 100,
    maxHp: 100,
    score: 0,
    combo: 0,
    comboTimer: 0,
    coinsCollected: 0,
    crystalsCollected: 0,
    waveIndex: 1,
    totalWaves: 1,
    enemiesRemaining: 0,
    dashCooldownProgress: 1,
    elapsedTime: 0,
  });

  const [lastOutcome, setLastOutcome] = useState<GameOutcome | null>(null);
  const [starsBreakdown, setStarsBreakdown] = useState<{
    stars: number;
    cleared: boolean;
    timeStar: boolean;
    healthStar: boolean;
  }>({ stars: 1, cleared: true, timeStar: false, healthStar: false });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Sync state to body dataset
  useEffect(() => {
    const datasetState =
      currentView === 'playing'
        ? 'playing'
        : currentView === 'paused'
        ? 'paused'
        : currentView === 'victory' || currentView === 'gameover'
        ? 'gameover'
        : 'title';
    document.body.dataset.state = datasetState;
  }, [currentView]);

  // Persist gameState on change
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  // Handle Autostart query param & keyboard shortcuts on title
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startMission(LEVELS[0]);
    }

    const handleGlobalKey = (e: KeyboardEvent) => {
      if (!e || !e.key) return;
      if (e.key === 'm' || e.key === 'M') {
        const muted = audio.toggleMute();
        setIsMuted(muted);
      }

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (currentView === 'playing') {
          pauseMission();
        } else if (currentView === 'paused') {
          resumeMission();
        }
      }

      if (currentView === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        startMission(LEVELS[gameState.highestUnlockedLevel - 1] || LEVELS[0]);
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [currentView, gameState.highestUnlockedLevel]);

  // Resize canvas responsively
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Title screen ambient background loop
  useEffect(() => {
    if (currentView === 'playing') return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width || window.innerWidth || 1280;
    const h = canvas.height || window.innerHeight || 800;

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 20,
      vy: -15 - Math.random() * 25,
      size: 1 + Math.random() * 2.5,
      color: Math.random() > 0.4 ? 'rgba(0, 255, 255, 0.35)' : 'rgba(255, 0, 119, 0.3)',
    }));

    let lastT = performance.now();
    const renderAmbient = (now: number) => {
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;

      const cw = canvas.width || window.innerWidth;
      const ch = canvas.height || window.innerHeight;

      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, cw, ch);

      // Subtle cyber grid
      ctx.strokeStyle = 'rgba(26, 35, 58, 0.6)';
      ctx.lineWidth = 1;
      const step = 80;
      for (let x = 0; x < cw; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ch);
        ctx.stroke();
      }
      for (let y = 0; y < ch; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }

      // Update & render ambient particles
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y < 0) {
          p.y = ch + 10;
          p.x = Math.random() * cw;
        }
        if (p.x < 0) p.x = cw;
        if (p.x > cw) p.x = 0;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(renderAmbient);
    };

    animId = requestAnimationFrame(renderAmbient);
    return () => cancelAnimationFrame(animId);
  }, [currentView]);

  // Cleanup engine on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
    };
  }, []);

  const startMission = (level: LevelConfig, modifier: string | null = null) => {
    setActiveLevel(level);
    setActiveModifier(modifier);
    setCurrentView('playing');

    // Blur buttons
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Stop any existing engine
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }

    // Initialize new engine on canvas
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;

      const engine = new GameEngine(
        canvasRef.current,
        level,
        gameState.playerStats,
        (hud) => setHudData(hud),
        (outcome) => handleMissionOutcome(outcome, level, modifier),
        modifier
      );
      engineRef.current = engine;
      engine.start();
    }
  };

  const pauseMission = () => {
    if (engineRef.current && currentView === 'playing') {
      engineRef.current.pause();
      setCurrentView('paused');
    }
  };

  const resumeMission = () => {
    if (engineRef.current && currentView === 'paused') {
      engineRef.current.resume();
      setCurrentView('playing');
    }
  };

  const handleMissionOutcome = (
    outcome: GameOutcome,
    level: LevelConfig,
    modifier: string | null
  ) => {
    setLastOutcome(outcome);

    if (outcome.victory) {
      // Calculate stars
      const starEval = calculateLevelStars(
        outcome.clearTime,
        level.targetTime,
        outcome.hpRemaining,
        outcome.maxHp
      );
      setStarsBreakdown(starEval);

      // Update saved progress
      setGameState((prev) => {
        const nextLevelUnlocked = Math.max(
          prev.highestUnlockedLevel,
          Math.min(level.id + 1, LEVELS.length)
        );
        const currentStars = prev.levelStars[level.id] || 0;
        const bestStars = Math.max(currentStars, starEval.stars);

        const currentBestTime = prev.bestTimes[level.id] || 9999;
        const bestTime = Math.min(currentBestTime, outcome.clearTime);

        let challengeCompletedDate = prev.dailyChallengeCompletedDate;
        if (modifier) {
          challengeCompletedDate = new Date().toISOString().slice(0, 10);
        }

        return {
          ...prev,
          coins: prev.coins + outcome.coinsEarned,
          crystals: prev.crystals + outcome.crystalsEarned,
          highestUnlockedLevel: nextLevelUnlocked,
          levelStars: {
            ...prev.levelStars,
            [level.id]: bestStars,
          },
          bestTimes: {
            ...prev.bestTimes,
            [level.id]: bestTime,
          },
          dailyChallengeCompletedDate: challengeCompletedDate,
        };
      });

      setCurrentView('victory');
    } else {
      // Defeat: keep salvaged coins
      setGameState((prev) => ({
        ...prev,
        coins: prev.coins + outcome.coinsEarned,
      }));
      setCurrentView('gameover');
    }
  };

  // Claim Daily Login Reward
  const handleClaimDailyReward = () => {
    const today = new Date().toISOString();
    const { canClaim, nextStreak, reward } = getNextDailyRewardState(
      gameState.lastDailyClaim,
      today,
      gameState.dailyStreak
    );

    if (!canClaim) return;

    audio.playVictory();

    setGameState((prev) => {
      let coins = prev.coins;
      let crystals = prev.crystals;
      const ownedSkins = [...prev.ownedSkins];

      if (reward.rewardType === 'coins') {
        coins += reward.amount;
      } else if (reward.rewardType === 'crystals') {
        crystals += reward.amount;
      } else if (reward.rewardType === 'skin') {
        if (!ownedSkins.includes('crimson')) {
          ownedSkins.push('crimson');
        }
      }

      return {
        ...prev,
        coins,
        crystals,
        dailyStreak: nextStreak,
        lastDailyClaim: today,
        ownedSkins,
      };
    });
  };

  // Launch Daily Challenge
  const handlePlayDailyChallenge = () => {
    const today = new Date().toISOString().slice(0, 10);
    const challenge = getDailyChallenge(today);
    // Pick an engaging challenging level (e.g. Level 3 or 4)
    const challengeLevel = LEVELS[2];
    startMission(challengeLevel, challenge.modifier);
  };

  // Upgrade player stat
  const handleUpgrade = (type: 'damage' | 'speed' | 'dashCooldown' | 'magnet' | 'crit') => {
    const statKeyMap = {
      damage: 'damageTier',
      speed: 'speedTier',
      dashCooldown: 'dashCooldownTier',
      magnet: 'magnetTier',
      crit: 'critTier',
    } as const;

    const currentTier = gameState.playerStats[statKeyMap[type]];
    const baseCostMap = {
      damage: 150,
      dashCooldown: 180,
      speed: 160,
      magnet: 120,
      crit: 200,
    };
    const cost = Math.round(baseCostMap[type] * Math.pow(1.6, currentTier));

    if (gameState.coins >= cost && currentTier < 5) {
      audio.playCoin();
      setGameState((prev) => ({
        ...prev,
        coins: prev.coins - cost,
        playerStats: {
          ...prev.playerStats,
          [statKeyMap[type]]: currentTier + 1,
        },
      }));
    }
  };

  // Blade skin equip & purchase
  const handleSelectSkin = (skin: 'cyan' | 'crimson' | 'violet' | 'gold') => {
    audio.playDash();
    setGameState((prev) => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        bladeSkin: skin,
      },
    }));
  };

  const handleBuySkin = (
    skin: 'cyan' | 'crimson' | 'violet' | 'gold',
    costType: 'coins' | 'crystals',
    cost: number
  ) => {
    if (costType === 'coins' && gameState.coins >= cost) {
      audio.playVictory();
      setGameState((prev) => ({
        ...prev,
        coins: prev.coins - cost,
        ownedSkins: [...prev.ownedSkins, skin],
        playerStats: { ...prev.playerStats, bladeSkin: skin },
      }));
    } else if (costType === 'crystals' && gameState.crystals >= cost) {
      audio.playVictory();
      setGameState((prev) => ({
        ...prev,
        crystals: prev.crystals - cost,
        ownedSkins: [...prev.ownedSkins, skin],
        playerStats: { ...prev.playerStats, bladeSkin: skin },
      }));
    }
  };

  const totalStars = Object.values(gameState.levelStars).reduce((acc, curr) => acc + curr, 0);
  const isDailyRewardReady = isDailyRewardAvailable(
    gameState.lastDailyClaim,
    new Date().toISOString()
  );
  const todayStr = new Date().toISOString().slice(0, 10);
  const isDailyChallengeDone = gameState.dailyChallengeCompletedDate === todayStr;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 60fps Isolated Simulation Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        className="absolute inset-0 block w-full h-full cursor-crosshair"
      />

      {/* Screen Views & Overlays */}
      {currentView === 'title' && (
        <TitleScreen
          onStartGame={() =>
            startMission(LEVELS[gameState.highestUnlockedLevel - 1] || LEVELS[0])
          }
          onOpenLevelSelect={() => setCurrentView('level_select')}
          onOpenDailyRewards={() => setCurrentView('daily_rewards')}
          onOpenArmory={() => setCurrentView('armory')}
          isDailyRewardAvailable={isDailyRewardReady}
          totalStars={totalStars}
          coins={gameState.coins}
          crystals={gameState.crystals}
          isMuted={isMuted}
          onToggleMute={() => {
            const m = audio.toggleMute();
            setIsMuted(m);
          }}
        />
      )}

      {currentView === 'playing' && (
        <PlayingHUD
          hudData={hudData}
          levelName={activeLevel.name}
          sectorName={activeLevel.sectorName}
          isMuted={isMuted}
          onToggleMute={() => {
            const m = audio.toggleMute();
            setIsMuted(m);
          }}
          onPause={pauseMission}
          onSlashTouch={() => engineRef.current?.triggerSlash()}
          onDashTouch={() => engineRef.current?.triggerDash()}
        />
      )}

      {currentView === 'paused' && (
        <PauseModal
          onResume={resumeMission}
          onRestart={() => startMission(activeLevel, activeModifier)}
          onLevelSelect={() => {
            if (engineRef.current) engineRef.current.stop();
            setCurrentView('level_select');
          }}
        />
      )}

      {currentView === 'victory' && lastOutcome && (
        <VictoryModal
          outcome={lastOutcome}
          levelName={activeLevel.name}
          targetTime={activeLevel.targetTime}
          starsEarned={starsBreakdown}
          onNextLevel={() => {
            const nextLvl = LEVELS.find((l) => l.id === activeLevel.id + 1) || activeLevel;
            startMission(nextLvl);
          }}
          onReplay={() => startMission(activeLevel, activeModifier)}
          onLevelSelect={() => setCurrentView('level_select')}
        />
      )}

      {currentView === 'gameover' && lastOutcome && (
        <GameOverModal
          outcome={lastOutcome}
          levelName={activeLevel.name}
          onRetry={() => startMission(activeLevel, activeModifier)}
          onLevelSelect={() => setCurrentView('level_select')}
        />
      )}

      {currentView === 'daily_rewards' && (
        <DailyRewardsModal
          currentStreak={gameState.dailyStreak}
          isAvailable={isDailyRewardReady}
          onClaimDaily={handleClaimDailyReward}
          onPlayDailyChallenge={handlePlayDailyChallenge}
          onClose={() => setCurrentView('title')}
          isDailyChallengeDone={isDailyChallengeDone}
        />
      )}

      {currentView === 'level_select' && (
        <LevelSelectModal
          highestUnlockedLevel={gameState.highestUnlockedLevel}
          levelStars={gameState.levelStars}
          onSelectLevel={(lvl) => startMission(lvl)}
          onClose={() => setCurrentView('title')}
        />
      )}

      {currentView === 'armory' && (
        <ArmoryModal
          stats={gameState.playerStats}
          coins={gameState.coins}
          crystals={gameState.crystals}
          totalStars={totalStars}
          ownedSkins={gameState.ownedSkins}
          onUpgrade={handleUpgrade}
          onSelectSkin={handleSelectSkin}
          onBuySkin={handleBuySkin}
          onClose={() => setCurrentView('title')}
        />
      )}
    </div>
  );
}
