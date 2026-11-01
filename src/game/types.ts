export type GameView =
  | 'title'
  | 'level_select'
  | 'playing'
  | 'paused'
  | 'victory'
  | 'gameover'
  | 'daily_rewards'
  | 'armory';

export type EnemyType = 'swarmer' | 'sniper' | 'brute' | 'spinner' | 'boss';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  color: string;
  // Attack telegraphs
  telegraphTimer: number; // >0 means winding up
  telegraphMax: number;
  targetX?: number;
  targetY?: number;
  attackCooldown: number;
  // Visual hit flash
  hitFlashTimer: number;
  angle: number;
  // Knockback
  kbX: number;
  kbY: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  isEnemy: boolean;
  life: number;
}

export interface Pickup {
  id: number;
  type: 'coin' | 'crystal' | 'health';
  x: number;
  y: number;
  vx: number;
  vy: number;
  amount: number;
  value: number;
  life: number;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  decay: number;
  shape: 'circle' | 'spark' | 'ring' | 'text';
  text?: string;
}

export interface WaveConfig {
  swarmers: number;
  snipers: number;
  brutes: number;
  spinners: number;
  bosses: number;
  spawnDelay: number;
}

export interface LevelConfig {
  id: number;
  sector: number;
  sectorName: string;
  name: string;
  targetTime: number; // seconds for 2-star time goal
  rewardCoins: number;
  rewardCrystals: number;
  waves: WaveConfig[];
  arenaWidth: number;
  arenaHeight: number;
}

export interface PlayerStats {
  maxHp: number;
  damageTier: number;
  speedTier: number;
  dashCooldownTier: number;
  magnetTier: number;
  critTier: number;
  bladeSkin: 'cyan' | 'crimson' | 'violet' | 'gold';
}

export interface SavedGameState {
  coins: number;
  crystals: number;
  highestUnlockedLevel: number;
  levelStars: Record<number, number>; // levelId -> stars (1-3)
  bestTimes: Record<number, number>;
  playerStats: PlayerStats;
  lastDailyClaim: string | null;
  dailyStreak: number;
  dailyChallengeCompletedDate: string | null;
  ownedSkins: string[];
}

export const LEVELS: LevelConfig[] = [
  // Sector 1: Cyber Alley
  {
    id: 1,
    sector: 1,
    sectorName: 'Cyber Alley',
    name: 'Sector Breach',
    targetTime: 30,
    rewardCoins: 150,
    rewardCrystals: 2,
    arenaWidth: 1200,
    arenaHeight: 800,
    waves: [
      { swarmers: 8, snipers: 0, brutes: 0, spinners: 0, bosses: 0, spawnDelay: 0.3 },
      { swarmers: 12, snipers: 0, brutes: 0, spinners: 0, bosses: 0, spawnDelay: 0.25 },
    ],
  },
  {
    id: 2,
    sector: 1,
    sectorName: 'Cyber Alley',
    name: 'Laser Sentry Outpost',
    targetTime: 40,
    rewardCoins: 220,
    rewardCrystals: 3,
    arenaWidth: 1300,
    arenaHeight: 850,
    waves: [
      { swarmers: 10, snipers: 2, brutes: 0, spinners: 0, bosses: 0, spawnDelay: 0.3 },
      { swarmers: 12, snipers: 3, brutes: 0, spinners: 0, bosses: 0, spawnDelay: 0.25 },
    ],
  },
  {
    id: 3,
    sector: 1,
    sectorName: 'Cyber Alley',
    name: 'Mag-Lev Station',
    targetTime: 45,
    rewardCoins: 300,
    rewardCrystals: 4,
    arenaWidth: 1400,
    arenaHeight: 900,
    waves: [
      { swarmers: 14, snipers: 2, brutes: 0, spinners: 1, bosses: 0, spawnDelay: 0.2 },
      { swarmers: 16, snipers: 4, brutes: 0, spinners: 1, bosses: 0, spawnDelay: 0.2 },
    ],
  },
  {
    id: 4,
    sector: 1,
    sectorName: 'Cyber Alley',
    name: 'Heavy Defense Trench',
    targetTime: 50,
    rewardCoins: 400,
    rewardCrystals: 5,
    arenaWidth: 1400,
    arenaHeight: 900,
    waves: [
      { swarmers: 12, snipers: 2, brutes: 2, spinners: 0, bosses: 0, spawnDelay: 0.25 },
      { swarmers: 16, snipers: 3, brutes: 2, spinners: 1, bosses: 0, spawnDelay: 0.2 },
    ],
  },
  {
    id: 5,
    sector: 1,
    sectorName: 'Cyber Alley',
    name: 'OVERSEER PRIME (BOSS)',
    targetTime: 65,
    rewardCoins: 750,
    rewardCrystals: 12,
    arenaWidth: 1500,
    arenaHeight: 1000,
    waves: [
      { swarmers: 8, snipers: 2, brutes: 1, spinners: 0, bosses: 0, spawnDelay: 0.3 },
      { swarmers: 10, snipers: 2, brutes: 0, spinners: 1, bosses: 1, spawnDelay: 0.1 },
    ],
  },

  // Sector 2: Neon Underworld
  {
    id: 6,
    sector: 2,
    sectorName: 'Neon Underworld',
    name: 'Acid Pipelines',
    targetTime: 45,
    rewardCoins: 500,
    rewardCrystals: 6,
    arenaWidth: 1400,
    arenaHeight: 900,
    waves: [
      { swarmers: 16, snipers: 3, brutes: 1, spinners: 1, bosses: 0, spawnDelay: 0.2 },
      { swarmers: 18, snipers: 4, brutes: 2, spinners: 1, bosses: 0, spawnDelay: 0.18 },
    ],
  },
  {
    id: 7,
    sector: 2,
    sectorName: 'Neon Underworld',
    name: 'Blade Dancer Grid',
    targetTime: 50,
    rewardCoins: 600,
    rewardCrystals: 8,
    arenaWidth: 1450,
    arenaHeight: 950,
    waves: [
      { swarmers: 14, snipers: 3, brutes: 1, spinners: 3, bosses: 0, spawnDelay: 0.2 },
      { swarmers: 16, snipers: 5, brutes: 2, spinners: 3, bosses: 0, spawnDelay: 0.18 },
    ],
  },
  {
    id: 8,
    sector: 2,
    sectorName: 'Neon Underworld',
    name: 'Quantum Smelter',
    targetTime: 55,
    rewardCoins: 700,
    rewardCrystals: 10,
    arenaWidth: 1500,
    arenaHeight: 1000,
    waves: [
      { swarmers: 18, snipers: 4, brutes: 3, spinners: 1, bosses: 0, spawnDelay: 0.18 },
      { swarmers: 22, snipers: 5, brutes: 3, spinners: 2, bosses: 0, spawnDelay: 0.15 },
    ],
  },
  {
    id: 9,
    sector: 2,
    sectorName: 'Neon Underworld',
    name: 'Sub-Grid Gauntlet',
    targetTime: 60,
    rewardCoins: 850,
    rewardCrystals: 12,
    arenaWidth: 1550,
    arenaHeight: 1000,
    waves: [
      { swarmers: 20, snipers: 5, brutes: 3, spinners: 2, bosses: 0, spawnDelay: 0.16 },
      { swarmers: 24, snipers: 6, brutes: 4, spinners: 3, bosses: 0, spawnDelay: 0.14 },
    ],
  },
  {
    id: 10,
    sector: 2,
    sectorName: 'Neon Underworld',
    name: 'VORTEX DESTROYER (BOSS)',
    targetTime: 75,
    rewardCoins: 1200,
    rewardCrystals: 20,
    arenaWidth: 1600,
    arenaHeight: 1100,
    waves: [
      { swarmers: 12, snipers: 3, brutes: 2, spinners: 2, bosses: 0, spawnDelay: 0.2 },
      { swarmers: 16, snipers: 4, brutes: 2, spinners: 2, bosses: 1, spawnDelay: 0.12 },
    ],
  },

  // Sector 3: Apex Citadel
  {
    id: 11,
    sector: 3,
    sectorName: 'Apex Citadel',
    name: 'High Voltage Spire',
    targetTime: 55,
    rewardCoins: 1000,
    rewardCrystals: 15,
    arenaWidth: 1500,
    arenaHeight: 1000,
    waves: [
      { swarmers: 22, snipers: 6, brutes: 3, spinners: 3, bosses: 0, spawnDelay: 0.15 },
      { swarmers: 26, snipers: 7, brutes: 4, spinners: 3, bosses: 0, spawnDelay: 0.13 },
    ],
  },
  {
    id: 12,
    sector: 3,
    sectorName: 'Apex Citadel',
    name: 'Quantum Sanctum',
    targetTime: 60,
    rewardCoins: 1150,
    rewardCrystals: 18,
    arenaWidth: 1600,
    arenaHeight: 1050,
    waves: [
      { swarmers: 25, snipers: 7, brutes: 4, spinners: 4, bosses: 0, spawnDelay: 0.14 },
      { swarmers: 28, snipers: 8, brutes: 4, spinners: 4, bosses: 0, spawnDelay: 0.12 },
    ],
  },
  {
    id: 13,
    sector: 3,
    sectorName: 'Apex Citadel',
    name: 'Core Accelerator',
    targetTime: 65,
    rewardCoins: 1300,
    rewardCrystals: 22,
    arenaWidth: 1650,
    arenaHeight: 1100,
    waves: [
      { swarmers: 28, snipers: 8, brutes: 5, spinners: 4, bosses: 0, spawnDelay: 0.13 },
      { swarmers: 32, snipers: 9, brutes: 5, spinners: 5, bosses: 0, spawnDelay: 0.11 },
    ],
  },
  {
    id: 14,
    sector: 3,
    sectorName: 'Apex Citadel',
    name: 'Throne Antechamber',
    targetTime: 70,
    rewardCoins: 1500,
    rewardCrystals: 26,
    arenaWidth: 1700,
    arenaHeight: 1150,
    waves: [
      { swarmers: 30, snipers: 9, brutes: 6, spinners: 5, bosses: 0, spawnDelay: 0.12 },
      { swarmers: 35, snipers: 10, brutes: 6, spinners: 6, bosses: 0, spawnDelay: 0.1 },
    ],
  },
  {
    id: 15,
    sector: 3,
    sectorName: 'Apex Citadel',
    name: 'NEXUS OVERLORD (FINAL BOSS)',
    targetTime: 90,
    rewardCoins: 3000,
    rewardCrystals: 50,
    arenaWidth: 1800,
    arenaHeight: 1200,
    waves: [
      { swarmers: 20, snipers: 6, brutes: 4, spinners: 3, bosses: 0, spawnDelay: 0.15 },
      { swarmers: 24, snipers: 6, brutes: 4, spinners: 4, bosses: 1, spawnDelay: 0.1 },
    ],
  },
];
