/**
 * Pure game rules, calculations, and state machines for Neon Rogue.
 * Decoupled from UI and Canvas for instant unit testing.
 */

export interface UpgradeTier {
  id: string;
  name: string;
  description: string;
  tier: number;
  maxTier: number;
  baseCost: number;
  costMultiplier: number;
  valuePerTier: number;
  unit: string;
}

export interface DailyReward {
  day: number;
  rewardType: 'coins' | 'crystals' | 'skin' | 'booster';
  amount: number;
  title: string;
  description: string;
}

export const DAILY_REWARDS_TABLE: DailyReward[] = [
  { day: 1, rewardType: 'coins', amount: 200, title: '200 Neon Credits', description: 'Basic operational currency.' },
  { day: 2, rewardType: 'crystals', amount: 5, title: '5 Cyber Crystals', description: 'Rare crystals for elite upgrades.' },
  { day: 3, rewardType: 'coins', amount: 500, title: '500 Neon Credits', description: 'Major munitions boost.' },
  { day: 4, rewardType: 'crystals', amount: 15, title: '15 Cyber Crystals', description: 'High-density quantum cells.' },
  { day: 5, rewardType: 'coins', amount: 1000, title: '1,000 Neon Credits', description: 'Large cash infusion.' },
  { day: 6, rewardType: 'crystals', amount: 30, title: '30 Cyber Crystals', description: 'Prototype energy crystals.' },
  { day: 7, rewardType: 'skin', amount: 1, title: 'Plasma Crimson Blade', description: 'Mythic flaming cyber blade skin!' },
];

/**
 * Calculates upgrade cost dynamically based on tier and multiplier
 */
export function calculateUpgradeCost(baseCost: number, tier: number, costMultiplier = 1.6): number {
  if (tier <= 0) return baseCost;
  return Math.round(baseCost * Math.pow(costMultiplier, tier));
}

/**
 * Calculates damage dealt with critical strikes
 */
export function calculateDamage(
  baseDamage: number,
  damageUpgradeTier: number,
  critChance: number,
  rng = Math.random
): { damage: number; isCrit: boolean } {
  const scaledDamage = baseDamage + damageUpgradeTier * 12;
  const isCrit = rng() < Math.min(critChance, 0.75);
  const finalDamage = isCrit ? Math.round(scaledDamage * 2.2) : Math.round(scaledDamage);
  return { damage: finalDamage, isCrit };
}

/**
 * Calculates level star rating (1 to 3 stars)
 * Star 1: Cleared
 * Star 2: Clear time under target
 * Star 3: Health retained >= 65%
 */
export function calculateLevelStars(
  clearTimeSeconds: number,
  targetTimeSeconds: number,
  healthRemaining: number,
  maxHealth: number
): { stars: number; cleared: boolean; timeStar: boolean; healthStar: boolean } {
  const cleared = true;
  const timeStar = clearTimeSeconds <= targetTimeSeconds;
  const healthPercent = (healthRemaining / Math.max(1, maxHealth)) * 100;
  const healthStar = healthPercent >= 65;

  let stars = 1;
  if (timeStar) stars++;
  if (healthStar) stars++;

  return { stars, cleared, timeStar, healthStar };
}

/**
 * Checks if daily reward is available based on last claim ISO date string
 */
export function isDailyRewardAvailable(lastClaimIsoDate: string | null, currentIsoDate: string): boolean {
  if (!lastClaimIsoDate) return true;
  
  const lastDate = lastClaimIsoDate.slice(0, 10);
  const curDate = currentIsoDate.slice(0, 10);
  return lastDate !== curDate;
}

/**
 * Calculates next streak day (1-7) when claiming
 */
export function getNextDailyRewardState(
  lastClaimIsoDate: string | null,
  currentIsoDate: string,
  currentStreak: number
): { canClaim: boolean; nextStreak: number; reward: DailyReward } {
  const canClaim = isDailyRewardAvailable(lastClaimIsoDate, currentIsoDate);
  if (!canClaim) {
    const safeDay = Math.min(Math.max(1, currentStreak), 7);
    return {
      canClaim: false,
      nextStreak: currentStreak,
      reward: DAILY_REWARDS_TABLE[safeDay - 1],
    };
  }

  // Check if streak was broken (more than 1 calendar day gap)
  let nextStreak = 1;
  if (lastClaimIsoDate) {
    const last = new Date(lastClaimIsoDate.slice(0, 10)).getTime();
    const cur = new Date(currentIsoDate.slice(0, 10)).getTime();
    const dayDiff = Math.floor((cur - last) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      // Consecutive day
      nextStreak = (currentStreak % 7) + 1;
    } else if (dayDiff === 0) {
      nextStreak = currentStreak;
    } else {
      // Broken streak reset to 1
      nextStreak = 1;
    }
  }

  const rewardIndex = (nextStreak - 1) % 7;
  return {
    canClaim: true,
    nextStreak,
    reward: DAILY_REWARDS_TABLE[rewardIndex],
  };
}

/**
 * Returns deterministic daily challenge based on date string (YYYY-MM-DD)
 */
export function getDailyChallenge(dateStr: string): {
  id: string;
  name: string;
  description: string;
  modifier: 'hyper_speed' | 'glass_cannon' | 'dense_swarm' | 'vampiric';
  rewardCoins: number;
  rewardCrystals: number;
} {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  const challenges = [
    {
      id: 'dc-1',
      name: 'Overdrive Protocol',
      description: 'Player and enemies move 40% faster. Dash cooldown reduced by 50%.',
      modifier: 'hyper_speed' as const,
      rewardCoins: 800,
      rewardCrystals: 15,
    },
    {
      id: 'dc-2',
      name: 'Glass Razor',
      description: 'Your slashes deal 300% critical damage, but you take double damage!',
      modifier: 'glass_cannon' as const,
      rewardCoins: 1000,
      rewardCrystals: 20,
    },
    {
      id: 'dc-3',
      name: 'Nanite Swarm Hazard',
      description: 'Double enemy density with increased coin drop rate.',
      modifier: 'dense_swarm' as const,
      rewardCoins: 1200,
      rewardCrystals: 25,
    },
    {
      id: 'dc-4',
      name: 'Siphon Circuit',
      description: 'No natural health regeneration. Defeating foes heals 8 HP.',
      modifier: 'vampiric' as const,
      rewardCoins: 900,
      rewardCrystals: 18,
    },
  ];

  return challenges[positiveHash % challenges.length];
}

/**
 * Clamp helper
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}
