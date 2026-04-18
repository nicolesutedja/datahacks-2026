import { motion } from 'motion/react';
import { Ambulance, Flame, Building2 } from 'lucide-react';

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
    description: 'Emergency medical response',
    icon: Ambulance,
    color: 'blue'
  },
  {
    type: 'fire' as const,
    label: 'Fire & Rescue',
    description: 'Structural firefighting',
    icon: Flame,
    color: 'orange'
  },
  {
    type: 'hospital' as const,
    label: 'Field Hospital',
    description: 'Mass casualty treatment',
    icon: Building2,
    color: 'green'
  }
];

export const ResourceDock = ({
  units,
  selectedUnitType,
  gameState,
  onSelectUnit
}: ResourceDockProps) => {
  const maxUnits = 5;
  const canDeploy = gameState === 'SETUP' || gameState === 'PROPAGATING';

  const getUnitCount = (type: Unit['type']) => {
    return units.filter(u => u.type === type).length;
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: {
        bg: isSelected ? 'bg-blue-500' : 'bg-blue-50 hover:bg-blue-100',
        text: isSelected ? 'text-white' : 'text-blue-600',
        border: isSelected ? 'border-blue-600' : 'border-blue-200',
        icon: isSelected ? 'text-white' : 'text-blue-500'
      },
      orange: {
        bg: isSelected ? 'bg-orange-500' : 'bg-orange-50 hover:bg-orange-100',
        text: isSelected ? 'text-white' : 'text-orange-600',
        border: isSelected ? 'border-orange-600' : 'border-orange-200',
        icon: isSelected ? 'text-white' : 'text-orange-500'
      },
      green: {
        bg: isSelected ? 'bg-green-500' : 'bg-green-50 hover:bg-green-100',
        text: isSelected ? 'text-white' : 'text-green-600',
        border: isSelected ? 'border-green-600' : 'border-green-200',
        icon: isSelected ? 'text-white' : 'text-green-500'
      }
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="absolute bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg"
    >
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Response Units
            </h3>
            <p className="text-xs text-slate-500">
              {units.length}/{maxUnits} deployed
            </p>
          </div>

          {/* Unit Status Indicators */}
          <div className="flex gap-1.5">
            {[...Array(maxUnits)].map((_, i) => {
              const unit = units[i];
              return (
                <div
                  key={i}
                  className={`
                    w-2 h-2 rounded-full transition-all
                    ${unit
                      ? unit.status === 'ACTIVE'
                        ? 'bg-green-500'
                        : 'bg-yellow-500 animate-pulse'
                      : 'bg-slate-300'
                    }
                  `}
                />
              );
            })}
          </div>
        </div>

        {/* Resource Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {RESOURCE_CONFIG.map((resource) => {
            const count = getUnitCount(resource.type);
            const isSelected = selectedUnitType === resource.type;
            const isDisabled = !canDeploy || units.length >= maxUnits;
            const Icon = resource.icon;
            const colors = getColorClasses(resource.color, isSelected);

            return (
              <button
                key={resource.type}
                onClick={() => onSelectUnit(resource.type)}
                disabled={isDisabled}
                className={`
                  relative p-4 rounded-lg border-2 transition-all
                  ${colors.bg} ${colors.border}
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-sm hover:shadow-md'}
                  ${isSelected ? 'shadow-md ring-2 ring-offset-2' : ''}
                `}
                style={isSelected ? { ringColor: `var(--color-${resource.color}-500)` } : {}}
              >
                <div className="flex items-start justify-between mb-2">
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-white'} ${colors.text}`}>
                    {count}
                  </span>
                </div>

                <div className="text-left">
                  <p className={`text-sm font-semibold ${colors.text} mb-0.5`}>
                    {resource.label}
                  </p>
                  <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                    {resource.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selection Hint */}
        {selectedUnitType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <p className="text-xs text-blue-700 text-center">
              Click on the map to deploy this unit
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
