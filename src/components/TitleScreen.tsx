import React from 'react';
import { Volume2, VolumeX, Gift, Swords, Crosshair, Award } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenLevelSelect: () => void;
  onOpenDailyRewards: () => void;
  onOpenArmory: () => void;
  isDailyRewardAvailable: boolean;
  totalStars: number;
  coins: number;
  crystals: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenLevelSelect,
  onOpenDailyRewards,
  onOpenArmory,
  isDailyRewardAvailable,
  totalStars,
  coins,
  crystals,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10 select-none z-10 pointer-events-auto">
      {/* Top Bar: Currency & Audio controls */}
      <div className="flex justify-between items-center w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-700/60 rounded-xl px-4 py-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono text-sm font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="tabular-nums">{coins}</span>
            <span className="text-xs text-amber-500/80">CREDITS</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-sm font-semibold">
            <span className="w-2 h-2 rotate-45 bg-cyan-400"></span>
            <span className="tabular-nums">{crystals}</span>
            <span className="text-xs text-cyan-500/80">CRYSTALS</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-1 text-yellow-400 font-mono text-sm font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span className="tabular-nums">{totalStars}/45</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500 transition-colors"
          aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Centerpiece: Bespoke SVG Title Lockup & Start Actions */}
      <div className="flex flex-col items-center justify-center my-auto text-center max-w-2xl mx-auto">
        {/* Bespoke Inline SVG Logo Lockup */}
        <div className="relative mb-6">
          <svg className="w-80 sm:w-96 h-28" viewBox="0 0 400 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00ffff" />
                <stop offset="50%" stopColor="#00aaff" />
                <stop offset="100%" stopColor="#ff0077" />
              </linearGradient>
              <filter id="shadowFilter">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#00ffff" floodOpacity="0.4" />
              </filter>
            </defs>
            {/* Background Cyber Frame */}
            <path d="M 40 20 L 360 20 L 380 45 L 360 70 L 40 70 L 20 45 Z" stroke="#00ffff" strokeWidth="1.5" strokeOpacity="0.4" fill="#0d1424" fillOpacity="0.8" />
            <line x1="80" y1="14" x2="320" y2="14" stroke="#ff0077" strokeWidth="2" strokeOpacity="0.8" />
            
            {/* Main Title Typography */}
            <text x="200" y="52" textAnchor="middle" fill="url(#neonGlow)" filter="url(#shadowFilter)" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="34" letterSpacing="4">
              NEON ROGUE
            </text>
            <text x="200" y="85" textAnchor="middle" fill="#94a3b8" fontFamily="system-ui, monospace" fontWeight="700" fontSize="12" letterSpacing="6">
              CYBER SURVIVOR // v2.0
            </text>
          </svg>
        </div>

        {/* Subtitle description */}
        <p className="text-slate-400 text-sm sm:text-base max-w-md mb-8 leading-relaxed">
          Infiltrate hostile cyber sectors, unleash kinetic blade strikes, and claim daily rewards to conquer challenging bosses.
        </p>

        {/* Menu Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
          {/* Primary Start Mission CTA */}
          <button
            type="button"
            data-start="true"
            onClick={onStartGame}
            className="w-full sm:flex-1 py-4 px-6 rounded-xl font-bold font-mono tracking-wider text-base bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Swords className="w-5 h-5" />
            START MISSION
          </button>

          {/* Daily Rewards Button with Notification Dot */}
          <button
            type="button"
            onClick={onOpenDailyRewards}
            className="w-full sm:w-auto relative py-4 px-5 rounded-xl font-mono text-sm font-semibold bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-300 transition-all flex items-center justify-center gap-2"
          >
            <Gift className="w-4 h-4 text-amber-400" />
            <span>DAILY REWARDS</span>
            {isDailyRewardAvailable && (
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
            )}
          </button>
        </div>

        {/* Secondary Navigation */}
        <div className="flex items-center gap-3 mt-3 w-full max-w-md">
          <button
            type="button"
            onClick={onOpenLevelSelect}
            className="flex-1 py-3 px-4 rounded-xl font-mono text-xs font-semibold bg-slate-900/90 border border-slate-800 hover:border-cyan-500/80 text-slate-300 hover:text-cyan-300 transition-all flex items-center justify-center gap-2"
          >
            <Crosshair className="w-4 h-4 text-cyan-400" />
            LEVEL SELECT (15)
          </button>

          <button
            type="button"
            onClick={onOpenArmory}
            className="flex-1 py-3 px-4 rounded-xl font-mono text-xs font-semibold bg-slate-900/90 border border-slate-800 hover:border-purple-500/80 text-slate-300 hover:text-purple-300 transition-all flex items-center justify-center gap-2"
          >
            <Swords className="w-4 h-4 text-purple-400" />
            ARMORY UPGRADES
          </button>
        </div>
      </div>

      {/* Flat borderless control hint line in safe margin */}
      <div className="text-center text-xs font-mono text-slate-500">
        WASD Move · Space/Click Slash · Shift/Right-Click Dash · Esc Pause
      </div>
    </div>
  );
};
