import React from 'react';
import { Volume2, VolumeX, Pause, Shield, Zap, Sparkles } from 'lucide-react';
import { HudData } from '../game/engine.ts';

interface PlayingHUDProps {
  hudData: HudData;
  levelName: string;
  sectorName: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onSlashTouch?: () => void;
  onDashTouch?: () => void;
}

export const PlayingHUD: React.FC<PlayingHUDProps> = ({
  hudData,
  levelName,
  sectorName,
  isMuted,
  onToggleMute,
  onPause,
  onSlashTouch,
  onDashTouch,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (hudData.hp / Math.max(1, hudData.maxHp)) * 100));
  const isLowHp = hpPercent <= 25;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 md:p-6 font-mono">
      {/* Top Cluster */}
      <div className="flex justify-between items-start w-full">
        {/* Top-Left: HP Pips & Dash Meter */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Level & Sector Info */}
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            {sectorName} // <span className="text-cyan-400">{levelName}</span>
          </div>

          {/* Health Bar & Numeric readout */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 min-w-[210px]">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="flex items-center gap-1 font-bold text-slate-300">
                <Shield className="w-3.5 h-3.5 text-red-400" />
                VITALITY
              </span>
              <span className={`font-mono tabular-nums font-bold ${isLowHp ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
                {hudData.hp} / {hudData.maxHp}
              </span>
            </div>
            {/* Health track */}
            <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  isLowHp ? 'bg-red-500' : hpPercent <= 50 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>

            {/* Dash Cooldown Bar */}
            <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-800/80 text-[11px]">
              <Zap className="w-3 h-3 text-cyan-400" />
              <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-75"
                  style={{ width: `${Math.round(hudData.dashCooldownProgress * 100)}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400">
                {hudData.dashCooldownProgress >= 1 ? 'READY' : 'COOLDOWN'}
              </span>
            </div>
          </div>
        </div>

        {/* Top-Center: Wave & Timer */}
        <div className="flex flex-col items-center bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            WAVE {hudData.waveIndex} / {hudData.totalWaves}
          </div>
          <div className="text-sm font-bold text-slate-200 tabular-nums">
            {hudData.enemiesRemaining} <span className="text-[10px] font-normal text-slate-400">FOES</span>
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
            {Math.floor(hudData.elapsedTime)}s
          </div>
        </div>

        {/* Top-Right: Score, Currency & Utility Buttons */}
        <div className="flex items-start gap-2 pointer-events-auto">
          <div className="flex flex-col items-end bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-right">
            <div className="text-[10px] text-slate-400 font-bold">SCORE</div>
            <div className="text-sm font-bold text-slate-100 tabular-nums">{hudData.score}</div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className="text-amber-400 tabular-nums">+{hudData.coinsCollected}c</span>
              <span className="text-cyan-400 tabular-nums">+{hudData.crystalsCollected}💎</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={onToggleMute}
              className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500 transition-colors"
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onPause}
              className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500 transition-colors"
              aria-label="Pause game"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Center: Dynamic Combo Multiplier (Shows when combo > 1) */}
      {hudData.combo > 1 && (
        <div className="self-center flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/90 border border-amber-500/50 shadow-lg shadow-amber-500/20 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-black text-amber-300 tracking-wider">
            {hudData.combo}x COMBO
          </span>
          <span className="text-[10px] text-amber-400/80">
            (+{Math.min(hudData.combo * 10, 150)}% DMG)
          </span>
        </div>
      )}

      {/* Bottom Area: Controls hint on desktop / Touch buttons on mobile */}
      <div className="flex justify-between items-end w-full">
        {/* Left Touch Joystick Zone label */}
        <div className="text-[10px] text-slate-600 block md:hidden">
          [Drag Left to Move]
        </div>

        {/* Desktop Controls Hint */}
        <div className="hidden md:block text-center mx-auto text-xs text-slate-500 bg-slate-950/70 border border-slate-800/60 px-4 py-1.5 rounded-lg">
          [WASD] Move · [Space / Left Click] Slash · [Shift / Right Click] Dash
        </div>

        {/* Mobile Action Buttons (Right side) */}
        <div className="flex items-center gap-3 pointer-events-auto md:hidden">
          <button
            type="button"
            onClick={onDashTouch}
            className="w-14 h-14 rounded-full bg-slate-900 border-2 border-cyan-400 text-cyan-300 font-bold text-xs flex flex-col items-center justify-center active:scale-90 shadow-lg shadow-cyan-500/20"
          >
            <Zap className="w-4 h-4" />
            <span>DASH</span>
          </button>
          <button
            type="button"
            onClick={onSlashTouch}
            className="w-16 h-16 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex flex-col items-center justify-center active:scale-90 shadow-xl shadow-cyan-500/40"
          >
            <Shield className="w-5 h-5" />
            <span>SLASH</span>
          </button>
        </div>
      </div>
    </div>
  );
};
