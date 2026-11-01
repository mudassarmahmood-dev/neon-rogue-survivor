import React, { useState } from 'react';
import { X, Star, Lock, Swords, Award, ChevronRight } from 'lucide-react';
import { LEVELS, LevelConfig } from '../game/types.ts';

interface LevelSelectModalProps {
  highestUnlockedLevel: number;
  levelStars: Record<number, number>;
  onSelectLevel: (level: LevelConfig) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  highestUnlockedLevel,
  levelStars,
  onSelectLevel,
  onClose,
}) => {
  const [activeSector, setActiveSector] = useState<number>(1);

  const totalStars = Object.values(levelStars).reduce((acc, curr) => acc + curr, 0);
  const sectorLevels = LEVELS.filter((lvl) => lvl.sector === activeSector);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 pointer-events-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
                MISSION SECTORS
                <span className="text-xs px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 font-mono flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  {totalStars} / 45 STARS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                15 challenging levels. Master time and health objectives for 3-star ratings!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Close level select"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sector Tabs */}
        <div className="flex items-center gap-2 my-4">
          {[
            { id: 1, name: 'SECTOR 1: CYBER ALLEY', levels: 'LVL 1-5' },
            { id: 2, name: 'SECTOR 2: NEON UNDERWORLD', levels: 'LVL 6-10' },
            { id: 3, name: 'SECTOR 3: APEX CITADEL', levels: 'LVL 11-15' },
          ].map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSector(sec.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl font-mono text-xs font-bold transition-all border text-left ${
                activeSector === sec.id
                  ? 'bg-cyan-950/50 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div>{sec.name}</div>
              <div className="text-[10px] text-slate-500 font-normal">{sec.levels}</div>
            </button>
          ))}
        </div>

        {/* Level List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {sectorLevels.map((lvl) => {
            const isUnlocked = lvl.id <= highestUnlockedLevel;
            const stars = levelStars[lvl.id] || 0;
            const isBoss = lvl.name.includes('BOSS');

            return (
              <div
                key={lvl.id}
                className={`rounded-xl p-4 border flex items-center justify-between transition-all ${
                  isUnlocked
                    ? isBoss
                      ? 'bg-gradient-to-r from-red-950/30 to-slate-950/80 border-red-500/40 hover:border-red-400'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/20 border-slate-900 opacity-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Level Number Badge */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                      isUnlocked
                        ? isBoss
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isUnlocked ? (isBoss ? 'BOSS' : `0${lvl.id}`.slice(-2)) : <Lock className="w-5 h-5 text-slate-500" />}
                  </div>

                  {/* Level Details */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-100">
                        {lvl.name}
                      </span>
                      {isBoss && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono font-bold">
                          HIGH HAZARD
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                      <span>Target: {lvl.targetTime}s</span>
                      <span>·</span>
                      <span className="text-amber-400">+{lvl.rewardCoins}c</span>
                      <span>·</span>
                      <span className="text-cyan-400">+{lvl.rewardCrystals}💎</span>
                    </div>
                  </div>
                </div>

                {/* Right: Stars & Action CTA */}
                <div className="flex items-center gap-4">
                  {/* Stars Display */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= stars
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Launch button */}
                  <button
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => onSelectLevel(lvl)}
                    className={`py-2 px-4 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isUnlocked
                        ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 active:scale-95 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <span>PLAY</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
