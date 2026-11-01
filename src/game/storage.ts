import { SavedGameState } from './types.ts';

const STORAGE_KEY = 'neon_rogue_save_v1';

const DEFAULT_STATE: SavedGameState = {
  coins: 250, // starter seed
  crystals: 5,
  highestUnlockedLevel: 1,
  levelStars: {},
  bestTimes: {},
  playerStats: {
    maxHp: 100,
    damageTier: 0,
    speedTier: 0,
    dashCooldownTier: 0,
    magnetTier: 0,
    critTier: 0,
    bladeSkin: 'cyan',
  },
  lastDailyClaim: null,
  dailyStreak: 0,
  dailyChallengeCompletedDate: null,
  ownedSkins: ['cyan'],
};

// In-memory fallback if localStorage is blocked or restricted in iframes
let inMemoryFallback: SavedGameState | null = null;

function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const testKey = '__test_storage__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function loadGameState(): SavedGameState {
  if (!isStorageAvailable()) {
    return inMemoryFallback || { ...DEFAULT_STATE };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    const loaded = {
      ...DEFAULT_STATE,
      ...parsed,
      playerStats: {
        ...DEFAULT_STATE.playerStats,
        ...(parsed.playerStats || {}),
      },
      levelStars: parsed.levelStars || {},
      bestTimes: parsed.bestTimes || {},
      ownedSkins: parsed.ownedSkins || ['cyan'],
    };
    inMemoryFallback = loaded;
    return loaded;
  } catch {
    return inMemoryFallback || { ...DEFAULT_STATE };
  }
}

export function saveGameState(state: SavedGameState): void {
  inMemoryFallback = state;
  if (!isStorageAvailable()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Graceful fallback to in-memory state
  }
}
