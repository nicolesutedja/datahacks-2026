import { motion } from 'motion/react';
import { Play, RotateCcw, MapPin, Terminal, Gauge } from 'lucide-react';

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
    if (magnitude < 5.5) return 'text-green-500';
    if (magnitude < 6.5) return 'text-yellow-500';
    if (magnitude < 7.5) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      className="absolute top-20 right-0 bottom-0 w-80 bg-black/90 backdrop-blur-md border-l border-red-900/50 shadow-[-10px_0_30px_rgba(220,38,38,0.1)] font-mono z-20"
    >
      <div className="h-full overflow-y-auto p-6 space-y-8">
        
        {/* Magnitude Control */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-red-500/70" />
              <label className="text-xs uppercase tracking-widest text-red-500/70">
                Magnitude
              </label>
            </div>
            <span className={`text-xl font-bold ${getRiskColor()}`}>
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
            className="w-full h-1 bg-red-950 rounded-none appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                     [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-red-500
                     [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(220,38,38,0.8)]
                     disabled:opacity-30 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between mt-3">
            <span className="text-[10px] text-red-500/40 uppercase tracking-widest">Minor (5.0)</span>
            <span className="text-[10px] text-red-500/40 uppercase tracking-widest">Major (9.0)</span>
          </div>
        </div>

        {/* Epicenter Info */}
        <div className="p-4 bg-red-950/20 border border-red-900/30">
          <div className="flex items-center gap-2 mb-3 border-b border-red-900/30 pb-2">
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="text-xs uppercase tracking-widest text-red-500">Target Coords</span>
          </div>
          {epicenter ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-red-500/50">LAT</span>
                <span className="font-bold text-red-400">{epicenter.lat.toFixed(4)}°</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-red-500/50">LNG</span>
                <span className="font-bold text-red-400">{epicenter.lng.toFixed(4)}°</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-red-500/50 animate-pulse uppercase tracking-widest">Awaiting target...</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {gameState === 'SETUP' && (
            <button
              onClick={onStart}
              disabled={!epicenter}
              className="w-full flex items-center justify-center gap-2 py-4 bg-red-600/10 hover:bg-red-600/20 border border-red-600 text-red-500
                       font-bold tracking-widest text-xs uppercase transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_25px_rgba(220,38,38,0.4)]
                       disabled:opacity-20 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Play className="w-4 h-4" />
              Run Simulation
            </button>
          )}
        </div>

        {/* Terminal Analytics */}
        <div className="p-4 bg-black border border-red-900/30 shadow-inner relative overflow-hidden">
          {/* Subtle terminal scanline effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20 pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-4 relative z-10 border-b border-red-900/30 pb-2">
            <Terminal className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold tracking-widest text-red-500">TERMINAL OUTPUT</span>
          </div>
          <div className="space-y-2 font-mono text-[10px] text-red-400/70 relative z-10 tracking-widest leading-relaxed">
            <p>{'>'} SYSTEM INITIALIZED</p>
            <p className={epicenter ? 'text-red-400' : 'animate-pulse'}>
              {'>'} TARGET: {epicenter ? 'LOCKED' : 'PENDING'}
            </p>
            <p>{'>'} AWAITING ML SURROGATE...</p>
            <p>{'>'} READY FOR INJECTION</p>
            <div className="w-2 h-3 bg-red-500 animate-pulse mt-2" />
          </div>
        </div>

      </div>
    </motion.div>
  );
};