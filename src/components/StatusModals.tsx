import React from 'react';
import { Trophy, Skull, Play, RotateCcw, Map, Star, Award } from 'lucide-react';
import { GameOutcome } from '../game/engine.ts';

interface VictoryModalProps {
  outcome: GameOutcome;
  levelName: string;
  targetTime: number;
  starsEarned: { stars: number; cleared: boolean; timeStar: boolean; healthStar: boolean };
  onNextLevel: () => void;
  onReplay: () => void;
  onLevelSelect: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  outcome,
  levelName,
  targetTime,
  starsEarned,
  onNextLevel,
  onReplay,
  onLevelSelect,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 pointer-events-auto">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/50 rounded-2xl p-6 shadow-2xl text-center">
        {/* Victory Icon & Title */}
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/20">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black font-mono tracking-wider text-slate-100">
          MISSION CLEARED!
        </h2>
        <div className="text-xs font-mono text-cyan-400 font-bold uppercase mt-0.5">
          {levelName}
        </div>

        {/* 3-Star Rating Evaluation */}
        <div className="flex justify-center gap-2 my-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 min-w-[70px] ${
                s <= starsEarned.stars
                  ? 'bg-amber-950/40 border-amber-400 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-600'
              }`}
            >
              <Star
                className={`w-6 h-6 ${
                  s <= starsEarned.stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'
                }`}
              />
              <span className="text-[9px] font-mono font-bold">
                {s === 1 ? 'CLEAR' : s === 2 ? `<${targetTime}s` : 'HP >65%'}
              </span>
            </div>
          ))}
        </div>

        {/* Run Mastery Metrics */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/70 border border-slate-800 rounded-xl p-3 my-4 font-mono text-xs">
          <div>
            <div className="text-[10px] text-slate-500 font-bold">TIME</div>
            <div className="text-slate-200 font-bold tabular-nums">
              {Math.round(outcome.clearTime)}s
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold">REWARDS</div>
            <div className="text-amber-400 font-bold tabular-nums">
              +{outcome.coinsEarned}c
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold">CRYSTALS</div>
            <div className="text-cyan-400 font-bold tabular-nums">
              +{outcome.crystalsEarned}💎
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 mt-4">
          <button
            type="button"
            data-start="true"
            onClick={onNextLevel}
            className="w-full py-3.5 px-6 rounded-xl font-mono font-bold text-sm bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            NEXT MISSION
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onReplay}
              className="flex-1 py-2.5 px-3 rounded-xl font-mono text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              REPLAY
            </button>
            <button
              type="button"
              onClick={onLevelSelect}
              className="flex-1 py-2.5 px-3 rounded-xl font-mono text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex items-center justify-center gap-1.5"
            >
              <Map className="w-3.5 h-3.5" />
              SECTORS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  outcome: GameOutcome;
  levelName: string;
  onRetry: () => void;
  onLevelSelect: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  outcome,
  levelName,
  onRetry,
  onLevelSelect,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 pointer-events-auto">
      <div className="w-full max-w-md bg-slate-900 border border-red-500/50 rounded-2xl p-6 shadow-2xl text-center">
        {/* Defeat Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/20">
          <Skull className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black font-mono tracking-wider text-slate-100">
          OPERATIVE DOWN
        </h2>
        <div className="text-xs font-mono text-red-400 font-bold uppercase mt-0.5">
          {levelName}
        </div>

        <p className="text-xs text-slate-400 mt-2 mb-4">
          Vital signs depleted. Salvaged operational credits have been secured in your armory bank.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/70 border border-slate-800 rounded-xl p-3 my-4 font-mono text-xs">
          <div>
            <div className="text-[10px] text-slate-500 font-bold">FOES SLAIN</div>
            <div className="text-slate-200 font-bold tabular-nums">
              {outcome.enemiesDefeated}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold">SALVAGED</div>
            <div className="text-amber-400 font-bold tabular-nums">
              +{outcome.coinsEarned}c
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold">SCORE</div>
            <div className="text-slate-200 font-bold tabular-nums">
              {outcome.score}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 mt-4">
          <button
            type="button"
            data-start="true"
            onClick={onRetry}
            className="w-full py-3.5 px-6 rounded-xl font-mono font-bold text-sm bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            TRY AGAIN
          </button>

          <button
            type="button"
            onClick={onLevelSelect}
            className="w-full py-2.5 px-3 rounded-xl font-mono text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex items-center justify-center gap-1.5"
          >
            <Map className="w-3.5 h-3.5" />
            RETURN TO SECTORS / ARMORY
          </button>
        </div>
      </div>
    </div>
  );
};

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onLevelSelect: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onLevelSelect,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 pointer-events-auto">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center">
        <h2 className="text-xl font-black font-mono tracking-wider text-slate-100 mb-1">
          MISSION PAUSED
        </h2>
        <div className="text-xs text-slate-400 font-mono mb-6">
          System simulation suspended
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 rounded-xl font-mono font-bold text-sm bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all active:scale-95 shadow-md shadow-cyan-500/20"
          >
            RESUME MISSION
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl font-mono text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
          >
            RESTART MISSION
          </button>
          <button
            type="button"
            onClick={onLevelSelect}
            className="w-full py-2.5 rounded-xl font-mono text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
          >
            EXIT TO SECTORS
          </button>
        </div>
      </div>
    </div>
  );
};
