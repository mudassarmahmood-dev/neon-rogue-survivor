import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateUpgradeCost,
  calculateDamage,
  calculateLevelStars,
  isDailyRewardAvailable,
  getNextDailyRewardState,
  getDailyChallenge,
  DAILY_REWARDS_TABLE,
} from './rules.ts';

test('calculateUpgradeCost scales exponentially with tiers', () => {
  const baseCost = 100;
  assert.equal(calculateUpgradeCost(baseCost, 0), 100);
  assert.equal(calculateUpgradeCost(baseCost, 1), 160);
  assert.equal(calculateUpgradeCost(baseCost, 2), 256);
  assert.ok(calculateUpgradeCost(baseCost, 3) > 400);
});

test('calculateDamage handles normal hits and critical hits', () => {
  // Mock RNG for deterministic crit (0.1 < 0.5 => crit)
  const critHit = calculateDamage(50, 2, 0.5, () => 0.1);
  assert.equal(critHit.isCrit, true);
  // (50 + 2*12) * 2.2 = 74 * 2.2 = 162.8 => 163
  assert.equal(critHit.damage, 163);

  // Mock RNG for non-crit (0.8 > 0.5 => no crit)
  const normalHit = calculateDamage(50, 2, 0.5, () => 0.8);
  assert.equal(normalHit.isCrit, false);
  assert.equal(normalHit.damage, 74);
});

test('calculateLevelStars awards 1, 2, or 3 stars based on criteria', () => {
  // Clear time fast (30 <= 45) and high health (80/100 >= 65%)
  const threeStars = calculateLevelStars(30, 45, 80, 100);
  assert.equal(threeStars.stars, 3);
  assert.equal(threeStars.timeStar, true);
  assert.equal(threeStars.healthStar, true);

  // Slow time (55 > 45) but high health (90/100 >= 65%)
  const twoStars = calculateLevelStars(55, 45, 90, 100);
  assert.equal(twoStars.stars, 2);
  assert.equal(twoStars.timeStar, false);
  assert.equal(twoStars.healthStar, true);

  // Slow time and low health (30/100 < 65%)
  const oneStar = calculateLevelStars(60, 45, 30, 100);
  assert.equal(oneStar.stars, 1);
  assert.equal(oneStar.timeStar, false);
  assert.equal(oneStar.healthStar, false);
});

test('isDailyRewardAvailable checks calendar day boundaries', () => {
  assert.equal(isDailyRewardAvailable(null, '2026-11-01T10:00:00Z'), true);
  assert.equal(isDailyRewardAvailable('2026-10-31T20:00:00Z', '2026-11-01T10:00:00Z'), true);
  assert.equal(isDailyRewardAvailable('2026-11-01T08:00:00Z', '2026-11-01T12:00:00Z'), false);
});

test('getNextDailyRewardState calculates streaks accurately', () => {
  // First time ever claiming
  const firstClaim = getNextDailyRewardState(null, '2026-11-01T10:00:00Z', 0);
  assert.equal(firstClaim.canClaim, true);
  assert.equal(firstClaim.nextStreak, 1);
  assert.equal(firstClaim.reward.day, 1);
  assert.equal(firstClaim.reward.amount, 200);

  // Consecutive day claim (Day 1 -> Day 2)
  const consecutiveClaim = getNextDailyRewardState('2026-11-01T10:00:00Z', '2026-11-02T09:00:00Z', 1);
  assert.equal(consecutiveClaim.canClaim, true);
  assert.equal(consecutiveClaim.nextStreak, 2);
  assert.equal(consecutiveClaim.reward.day, 2);

  // Same day attempt
  const sameDay = getNextDailyRewardState('2026-11-02T10:00:00Z', '2026-11-02T14:00:00Z', 2);
  assert.equal(sameDay.canClaim, false);
  assert.equal(sameDay.nextStreak, 2);

  // Day 7 mythic skin reward verification
  const day7Reward = DAILY_REWARDS_TABLE[6];
  assert.equal(day7Reward.rewardType, 'skin');
  assert.equal(day7Reward.day, 7);
});

test('getDailyChallenge returns deterministic modifier for date', () => {
  const challenge1 = getDailyChallenge('2026-11-01');
  const challenge2 = getDailyChallenge('2026-11-01');
  assert.equal(challenge1.id, challenge2.id);
  assert.equal(challenge1.modifier, challenge2.modifier);
  assert.ok(challenge1.rewardCoins > 0);
});
