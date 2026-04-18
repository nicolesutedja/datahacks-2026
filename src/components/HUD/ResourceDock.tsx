import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ambulance, Flame, Building2, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';

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
  onSelectUnit: (type: Unit['type']) => void;
}

const RESOURCE_CONFIG = [
  {
    type: 'ambulance' as const,
    label: 'Medical',
    description: 'Emergency response',
    icon: Ambulance
  },
  {
    type: 'fire' as const,
    label: 'Fire & Rescue',
    description: 'Structural integrity',
    icon: Flame
  },
  {
    type: 'hospital' as const,
    label: 'Field Hospital',
    description: 'Mass casualty prep',
    icon: Building2
  }
];

export const ResourceDock = ({
  units,
  selectedUnitType,
  gameState,
  onSelectUnit
}: ResourceDockProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const maxUnits = 5;
  const canDeploy = gameState === 'SETUP' || gameState === 'PROPAGATING';

  // --- BUDGET LOGIC ---
  const TOTAL_BUDGET = 10000000;
  const UNIT_COST = 2000000;
  const currentFunds = TOTAL_BUDGET - (units.length * UNIT_COST);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getUnitCount = (type: Unit['type']) => {
    return units.filter(u => u.type === type).length;
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      // When collapsed, drop it down by 100% minus the height of the tab (28px)
      animate={{ y: isCollapsed ? 'calc(100% - 28px)' : 0 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      // z-30 ensures it sits OVER the sidebar
      className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center pointer-events-none font-mono"
    >
      {/* --- TUCK AWAY TAB --- */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="pointer-events-auto bg-black/95 border-t border-l border-r border-red-900/50 text-red-500 hover:text-red-400 hover:bg-red-950/50 px-8 py-1 rounded-t-lg backdrop-blur-md transition-all flex items-center justify-center gap-3 shadow-[0_-5px_15px_rgba(220,38,38,0.15)] cursor-pointer"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-widest">Deploy Assets</span>
            <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <ChevronDown className="w-4 h-4 opacity-70 hover:opacity-100" />
        )}
      </button>

      {/* --- MAIN DOCK CONTENT --- */}
      <div className="pointer-events-auto w-full bg-black/95 backdrop-blur-md border-t border-red-900/50 shadow-[0_-10px_30px_rgba(220,38,38,0.2)]">
        <div className="px-6 py-4">
          
          {/* Header & Budget */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <div>
                <h3 className="text-sm font-bold tracking-[0.2em] text-red-500 uppercase">
                  Tactical Deployment
                </h3>
                <p className="text-[10px] tracking-widest text-red-500/50 uppercase mt-0.5">
                  Assets Deployed: {units.length}/{maxUnits}
                </p>
              </div>
              
              <div className="px-4 py-1.5 bg-red-950/30 border border-red-900/50 flex items-center gap-2">
                <DollarSign className="w-3 h-3 text-red-500" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-red-500/50 tracking-widest uppercase">Available Funds</span>
                  <span className="text-sm font-bold text-red-400 tracking-wider">
                    {formatMoney(currentFunds)}
                  </span>
                </div>
              </div>
            </div>

            {/* Unit Status Dots */}
            <div className="flex gap-2">
              {[...Array(maxUnits)].map((_, i) => {
                const unit = units[i];
                return (
                  <div
                    key={i}
                    className={`
                      w-2 h-2 rounded-full transition-all border
                      ${unit
                        ? unit.status === 'ACTIVE'
                          ? 'bg-red-500 border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.8)]'
                          : 'bg-red-800 border-red-600 animate-pulse'
                        : 'bg-black border-red-900/50'
                      }
                    `}
                  />
                );
              })}
            </div>
          </div>

          {/* Resource Cards */}
          <div className="grid grid-cols-3 gap-4">
            {RESOURCE_CONFIG.map((resource) => {
              const count = getUnitCount(resource.type);
              const isSelected = selectedUnitType === resource.type;
              const isDisabled = !canDeploy || units.length >= maxUnits;
              const Icon = resource.icon;

              return (
                <button
                  key={resource.type}
                  onClick={() => onSelectUnit(resource.type)}
                  disabled={isDisabled}
                  className={`
                    relative p-4 border transition-all duration-200 text-left flex flex-col
                    ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-red-950/40 hover:border-red-500'}
                    ${isSelected 
                      ? 'bg-red-600 border-red-400 text-black shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
                      : 'bg-black border-red-900/50 text-red-500'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-black' : 'text-red-500'}`} />
                    <span className={`text-[10px] font-bold px-2 py-0.5 border tracking-widest
                      ${isSelected 
                        ? 'bg-black text-red-500 border-black' 
                        : 'bg-red-950/50 text-red-500 border-red-900/50'
                      }`}
                    >
                      QTY: {count}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-0.5">
                      {resource.label}
                    </p>
                    <p className={`text-[9px] uppercase tracking-widest ${isSelected ? 'text-black/70' : 'text-red-500/50'}`}>
                      {resource.description}
                    </p>
                  </div>
                  
                  {/* Cost Tag */}
                  <div className={`absolute bottom-2 right-3 text-[8px] font-bold tracking-widest ${isSelected ? 'text-black/60' : 'text-red-500/40'}`}>
                    COST: {formatMoney(UNIT_COST)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selection Hint */}
          <AnimatePresence>
            {selectedUnitType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="p-2 bg-red-950/80 border border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                  <p className="text-xs text-red-400 font-bold tracking-[0.2em] uppercase text-center flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    Select Target Sector on Map for Deployment
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};