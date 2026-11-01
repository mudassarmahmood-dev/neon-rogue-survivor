import React from 'react';
import { X, Gift, CheckCircle2, Flame, Award, Zap } from 'lucide-react';
import { DAILY_REWARDS_TABLE, DailyReward, getDailyChallenge } from '../game/rules.ts';

interface DailyRewardsModalProps {
  currentStreak: number;
  isAvailable: boolean;
  onClaimDaily: () => void;
  onPlayDailyChallenge: () => void;
  onClose: () => void;
  isDailyChallengeDone: boolean;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  currentStreak,
  isAvailable,
  onClaimDaily,
  onPlayDailyChallenge,
  onClose,
  isDailyChallengeDone,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const dailyChallenge = getDailyChallenge(todayStr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
                DAILY LOGIN REWARDS
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  STREAK: {currentStreak} DAYS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Log in every day to claim compounding rewards and the Day 7 Plasma Blade!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Close daily rewards"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 7-Day Rewards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 my-6">
          {DAILY_REWARDS_TABLE.map((r: DailyReward) => {
            const isClaimed = currentStreak >= r.day && (!isAvailable || currentStreak > r.day);
            const isReady = isAvailable && (currentStreak === 0 ? r.day === 1 : r.day === (currentStreak % 7) + 1);
            const isSpecial = r.day === 7;

            return (
              <div
                key={r.day}
                className={`relative rounded-xl p-3 flex flex-col items-center text-center justify-between border transition-all ${
                  isReady
                    ? 'bg-amber-950/40 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                    : isClaimed
                    ? 'bg-slate-950/60 border-slate-800 opacity-60'
                    : 'bg-slate-950/40 border-slate-800/80'
                }`}
              >
                <div className="text-[10px] font-mono font-bold text-slate-400 mb-1">
                  DAY {r.day}
                </div>

                <div className="my-2">
                  {r.rewardType === 'coins' ? (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs mx-auto">
                      🪙
                    </div>
                  ) : r.rewardType === 'crystals' ? (
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs mx-auto">
                      💎
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs mx-auto animate-pulse">
                      ⚔️
                    </div>
                  )}
                </div>

                <div className="text-xs font-mono font-bold text-slate-200">
                  {r.rewardType === 'skin' ? 'MYTHIC' : `+${r.amount}`}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5 truncate w-full">
                  {r.rewardType === 'skin' ? 'Plasma Blade' : r.rewardType}
                </div>

                {isClaimed && (
                  <div className="absolute inset-0 bg-slate-950/70 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Claim Today's Reward CTA */}
        {isAvailable ? (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-amber-300 font-mono">
                DAY {currentStreak === 0 ? 1 : (currentStreak % 7) + 1} REWARD IS WAITING!
              </div>
              <div className="text-xs text-amber-400/80">
                Claim your bonus credits and maintain your consecutive streak.
              </div>
            </div>
            <button
              type="button"
              onClick={onClaimDaily}
              className="w-full sm:w-auto py-3 px-6 rounded-xl font-mono font-bold text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              CLAIM REWARD NOW
            </button>
          </div>
        ) : (
          <div className="mb-6 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center text-xs text-slate-400 font-mono">
            Next daily reward unlocks tomorrow! Keep playing missions to earn more credits.
          </div>
        )}

        {/* Daily Challenge Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 to-slate-950/80 border border-purple-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  TODAY'S SPECIAL CHALLENGE
                </span>
                {isDailyChallengeDone && (
                  <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded font-mono font-bold">
                    COMPLETED
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
                {dailyChallenge.name}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                {dailyChallenge.description}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                <span className="text-amber-400 font-bold">+{dailyChallenge.rewardCoins} Credits</span>
                <span className="text-cyan-400 font-bold">+{dailyChallenge.rewardCrystals} Crystals</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onPlayDailyChallenge}
            className="w-full sm:w-auto py-3 px-5 rounded-xl font-mono font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition-all active:scale-95 whitespace-nowrap shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2"
          >
            <Award className="w-4 h-4" />
            {isDailyChallengeDone ? 'REPLAY CHALLENGE' : 'LAUNCH CHALLENGE'}
          </button>
        </div>
      </div>
    </div>
  );
};
