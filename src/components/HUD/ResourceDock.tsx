import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Ambulance,
  Flame,
  Building2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';

interface Unit {
  id: number;
  type: 'ambulance' | 'fire' | 'hospital';
  position: { lat: number; lng: number };
  status: 'DEPLOYING' | 'ACTIVE';
}

interface ResourceDockProps {
  units: Unit[];
  selectedUnitType: Unit['type'] | null;
  gameState: string;
  currentFunds: number;
  totalBudget: number;
  maxUnits: number;
  unitCosts: Record<Unit['type'], number>;
  onSelectUnit: (type: Unit['type']) => void;
}

const RESOURCE_CONFIG = [
  {
    type: 'ambulance' as const,
    label: 'Medical',
    description: 'Fast response and casualty stabilization',
    icon: Ambulance,
  },
  {
    type: 'fire' as const,
    label: 'Fire & Rescue',
    description: 'Structural rescue and hazard control',
    icon: Flame,
  },
  {
    type: 'hospital' as const,
    label: 'Field Hospital',
    description: 'High-capacity treatment and surge support',
    icon: Building2,
  },
];

export const ResourceDock = ({
  units,
  selectedUnitType,
  gameState,
  currentFunds,
  totalBudget,
  maxUnits,
  unitCosts,
  onSelectUnit,
}: ResourceDockProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const canDeploy = gameState === 'SETUP' || gameState === 'PROPAGATING';
  const spentBudget = totalBudget - currentFunds;
  const budgetUsedPercent = Math.round((spentBudget / totalBudget) * 100);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);

  const getUnitCount = (type: Unit['type']) => units.filter((u) => u.type === type).length;

  return (
    <div className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-full max-w-5xl -translate-x-1/2 px-4">
      <div className="flex justify-center">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="pointer-events-auto flex items-center gap-3 rounded-t-lg border border-b-0 border-red-900/50 bg-black/95 px-8 py-2 text-red-500 shadow-[0_-5px_15px_rgba(220,38,38,0.15)] transition-all hover:bg-red-950/50 hover:text-red-400"
        >
          {isCollapsed ? (
            <>
              <ChevronUp size={16} />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                Deploy Assets
              </span>
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                Minimize Dock
              </span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto rounded-t-2xl border border-red-900/50 bg-black/95 p-5 backdrop-blur-md"
          >
            <div className="mb-4 flex flex-col gap-4 border-b border-red-900/40 pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-red-500/70">
                  Tactical Deployment
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  Assets Deployed: {units.length}/{maxUnits}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3">
                  <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-red-400">
                    <DollarSign size={14} />
                    Available Funds
                  </div>
                  <div className="text-lg font-semibold text-white">{formatMoney(currentFunds)}</div>
                </div>

                <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3">
                  <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-red-400">
                    <span>Budget Used</span>
                    <span>{budgetUsedPercent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all duration-300"
                      style={{ width: `${budgetUsedPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4 flex gap-2">
              {[...Array(maxUnits)].map((_, i) => {
                const unit = units[i];
                return (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full ${
                      unit
                        ? unit.status === 'ACTIVE'
                          ? 'bg-red-500'
                          : 'bg-amber-400'
                        : 'bg-zinc-800'
                    }`}
                  />
                );
              })}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {RESOURCE_CONFIG.map((resource) => {
                const count = getUnitCount(resource.type);
                const isSelected = selectedUnitType === resource.type;
                const isAffordable = currentFunds >= unitCosts[resource.type];
                const isDisabled = !canDeploy || units.length >= maxUnits || !isAffordable;
                const Icon = resource.icon;

                return (
                  <button
                    key={resource.type}
                    onClick={() => onSelectUnit(resource.type)}
                    disabled={isDisabled}
                    className={`relative rounded-2xl border p-4 text-left transition-all duration-200 ${
                      isDisabled
                        ? 'cursor-not-allowed border-zinc-800 bg-zinc-950/80 opacity-45'
                        : isSelected
                        ? 'border-red-300 bg-red-600 text-black shadow-[0_0_24px_rgba(220,38,38,0.35)]'
                        : 'border-red-900/50 bg-black text-red-500 hover:border-red-500 hover:bg-red-950/30'
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="rounded-xl border border-current/20 p-2">
                        <Icon size={22} />
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em]">
                        QTY: {count}
                      </div>
                    </div>

                    <div className="mb-1 text-base font-semibold">{resource.label}</div>
                    <div className="mb-4 text-sm opacity-80">{resource.description}</div>

                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em]">
                      <span>Cost: {formatMoney(unitCosts[resource.type])}</span>
                      {!isAffordable && (
                        <span className="flex items-center gap-1 text-amber-300">
                          <Lock size={12} />
                          Locked
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedUnitType && (
              <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3 text-center text-sm uppercase tracking-[0.2em] text-red-300">
                Select target sector on map for deployment
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};