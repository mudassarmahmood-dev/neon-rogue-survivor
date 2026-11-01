import React from 'react';
import { X, Swords, Zap, Shield, Magnet, Crosshair, Check, Lock } from 'lucide-react';
import { PlayerStats } from '../game/types.ts';
import { calculateUpgradeCost } from '../game/rules.ts';

interface ArmoryModalProps {
  stats: PlayerStats;
  coins: number;
  crystals: number;
  totalStars: number;
  ownedSkins: string[];
  onUpgrade: (type: 'damage' | 'speed' | 'dashCooldown' | 'magnet' | 'crit') => void;
  onSelectSkin: (skin: 'cyan' | 'crimson' | 'violet' | 'gold') => void;
  onBuySkin: (skin: 'cyan' | 'crimson' | 'violet' | 'gold', costType: 'coins' | 'crystals', cost: number) => void;
  onClose: () => void;
}

export const ArmoryModal: React.FC<ArmoryModalProps> = ({
  stats,
  coins,
  crystals,
  totalStars,
  ownedSkins,
  onUpgrade,
  onSelectSkin,
  onBuySkin,
  onClose,
}) => {
  const upgrades = [
    {
      id: 'damage' as const,
      name: 'Nanite Edge',
      description: '+12 base slash damage & extended blade arc reach',
      tier: stats.damageTier,
      maxTier: 5,
      cost: calculateUpgradeCost(150, stats.damageTier),
      icon: Swords,
      color: 'text-cyan-400',
    },
    {
      id: 'dashCooldown' as const,
      name: 'Kinetic Thrusters',
      description: '-0.1s dash cooldown recovery & longer invulnerability',
      tier: stats.dashCooldownTier,
      maxTier: 5,
      cost: calculateUpgradeCost(180, stats.dashCooldownTier),
      icon: Zap,
      color: 'text-blue-400',
    },
    {
      id: 'speed' as const,
      name: 'Cyber Stride',
      description: '+22 movement velocity & faster strafing',
      tier: stats.speedTier,
      maxTier: 5,
      cost: calculateUpgradeCost(160, stats.speedTier),
      icon: Shield,
      color: 'text-emerald-400',
    },
    {
      id: 'magnet' as const,
      name: 'Magnetic Coil',
      description: '+50px attraction radius for coins, crystals & health',
      tier: stats.magnetTier,
      maxTier: 5,
      cost: calculateUpgradeCost(120, stats.magnetTier),
      icon: Magnet,
      color: 'text-amber-400',
    },
    {
      id: 'crit' as const,
      name: 'Targeting Matrix',
      description: '+8% critical strike chance (deals 220% damage)',
      tier: stats.critTier,
      maxTier: 5,
      cost: calculateUpgradeCost(200, stats.critTier),
      icon: Crosshair,
      color: 'text-purple-400',
    },
  ];

  const skins = [
    {
      id: 'cyan' as const,
      name: 'Neon Cyan',
      subtitle: 'Standard Operative',
      colorHex: '#00ffff',
      unlocked: true,
      cost: 0,
      costType: 'coins' as const,
    },
    {
      id: 'crimson' as const,
      name: 'Plasma Crimson',
      subtitle: 'Day 7 Streak or 800c',
      colorHex: '#ff3344',
      unlocked: ownedSkins.includes('crimson'),
      cost: 800,
      costType: 'coins' as const,
    },
    {
      id: 'violet' as const,
      name: 'Void Violet',
      subtitle: '20 Cyber Crystals',
      colorHex: '#bf00ff',
      unlocked: ownedSkins.includes('violet'),
      cost: 20,
      costType: 'crystals' as const,
    },
    {
      id: 'gold' as const,
      name: 'Golden Apex',
      subtitle: 'Requires 20 Total Stars',
      colorHex: '#ffd700',
      unlocked: ownedSkins.includes('gold') || totalStars >= 20,
      cost: 0,
      costType: 'coins' as const,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 pointer-events-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
              CYBERNETIC ARMORY
            </h2>
            <p className="text-xs text-slate-400">
              Upgrade core systems and equip customized neon blade styles.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
              <span className="text-amber-400 font-bold">{coins} Credits</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400 font-bold">{crystals} Crystals</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              aria-label="Close armory"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upgrades Section */}
        <div className="my-5">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
            PERMANENT SYSTEM UPGRADES
          </h3>
          <div className="space-y-2.5">
            {upgrades.map((u) => {
              const isMax = u.tier >= u.maxTier;
              const canAfford = coins >= u.cost;
              const Icon = u.icon;

              return (
                <div
                  key={u.id}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-slate-900 border border-slate-800 ${u.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-100">{u.name}</span>
                        {/* Tier Pips */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((t) => (
                            <span
                              key={t}
                              className={`w-2.5 h-1.5 rounded-sm ${
                                t <= u.tier ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{u.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isMax || !canAfford}
                    onClick={() => onUpgrade(u.id)}
                    className={`py-2 px-4 rounded-xl font-mono text-xs font-bold transition-all whitespace-nowrap ${
                      isMax
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : canAfford
                        ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-95'
                        : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                    }`}
                  >
                    {isMax ? 'MAX TIER' : `UPGRADE (${u.cost}c)`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Blade Skins Section */}
        <div className="mt-2">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
            BLADE COATINGS & SKINS
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {skins.map((skin) => {
              const isSelected = stats.bladeSkin === skin.id;

              return (
                <div
                  key={skin.id}
                  className={`rounded-xl p-3.5 border flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-4 h-4 rounded-full border border-white/50"
                      style={{ backgroundColor: skin.colorHex }}
                    />
                    {isSelected && (
                      <span className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> EQUIPPED
                      </span>
                    )}
                  </div>

                  <div className="font-mono font-bold text-sm text-slate-200">{skin.name}</div>
                  <div className="text-[10px] text-slate-400 mb-3">{skin.subtitle}</div>

                  {skin.unlocked ? (
                    <button
                      type="button"
                      disabled={isSelected}
                      onClick={() => onSelectSkin(skin.id)}
                      className={`w-full py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isSelected ? 'ACTIVE' : 'EQUIP'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onBuySkin(skin.id, skin.costType, skin.cost)}
                      className="w-full py-1.5 rounded-lg font-mono text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 transition-all flex items-center justify-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      UNLOCK ({skin.cost}{skin.costType === 'coins' ? 'c' : '💎'})
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
