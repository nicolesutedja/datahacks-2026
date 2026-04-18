import { motion } from 'motion/react';
import { Play, RotateCcw, MapPin, TrendingUp, Gauge } from 'lucide-react';

interface SidebarProps {
  gameState: string;
  magnitude: number;
  panicMode: boolean;
  epicenter: { lat: number; lng: number } | null;
  onMagnitudeChange: (value: number) => void;
  onPanicModeToggle: () => void;
  onStart: () => void;
  onReset: () => void;
}

export const Sidebar = ({
  gameState,
  magnitude,
  epicenter,
  onMagnitudeChange,
  onStart,
  onReset
}: SidebarProps) => {
  const getRiskColor = () => {
    if (magnitude < 5.5) return 'text-green-600';
    if (magnitude < 6.5) return 'text-yellow-600';
    if (magnitude < 7.5) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      className="absolute top-20 right-0 bottom-0 w-80 bg-white/95 backdrop-blur-sm border-l border-slate-200 shadow-lg"
    >
      <div className="h-full overflow-y-auto p-6 space-y-6">
        {/* Magnitude Control */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-slate-600" />
              <label className="text-sm font-medium text-slate-700">
                Magnitude
              </label>
            </div>
            <span className={`text-2xl font-bold ${getRiskColor()}`}>
              M{magnitude.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="5.0"
            max="9.0"
            step="0.1"
            value={magnitude}
            onChange={(e) => onMagnitudeChange(parseFloat(e.target.value))}
            disabled={gameState !== 'SETUP'}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-lg
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-slate-500">Minor (5.0)</span>
            <span className="text-xs text-slate-500">Major (9.0)</span>
          </div>
        </div>

        {/* Epicenter Info */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">Epicenter Location</span>
          </div>
          {epicenter ? (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Latitude</span>
                <span className="font-medium text-slate-900">{epicenter.lat.toFixed(4)}°</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Longitude</span>
                <span className="font-medium text-slate-900">{epicenter.lng.toFixed(4)}°</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Click map to set location</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {gameState === 'SETUP' && (
            <button
              onClick={onStart}
              disabled={!epicenter}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                       font-medium text-sm transition-colors shadow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
            >
              <Play className="w-4 h-4" />
              Start Simulation
            </button>
          )}

          {gameState !== 'SETUP' && (
            <button
              onClick={onReset}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg
                       font-medium text-sm transition-colors border border-slate-300"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Simulation
            </button>
          )}
        </div>

        {/* Analytics Preview */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-900">AI Insights</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
              <p className="text-xs text-slate-700">
                La Jolla fault line monitoring active
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
              <p className="text-xs text-slate-700">
                Population density analysis in progress
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
              <p className="text-xs text-slate-700">
                Infrastructure vulnerability assessment
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-slate-500 italic">
              ML integration ready for Gemini API
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h4 className="text-sm font-medium text-slate-900 mb-2">How to Use</h4>
          <ol className="space-y-2 text-xs text-slate-600">
            <li className="flex gap-2">
              <span className="font-medium text-slate-900">1.</span>
              <span>Click the map to set the epicenter</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-slate-900">2.</span>
              <span>Adjust magnitude using the slider</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-slate-900">3.</span>
              <span>Deploy response units from the bottom dock</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-slate-900">4.</span>
              <span>Click Start to run the simulation</span>
            </li>
          </ol>
        </div>
      </div>
    </motion.div>
  );
};
