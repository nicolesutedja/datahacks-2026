import { motion } from 'motion/react';
import { BarChart3, Users, Gauge, Target, RotateCcw, TrendingUp, Award, Terminal } from 'lucide-react';

interface Results {
  livesSaved: number;
  resourceEfficiency: number;
  predictionAccuracy: number;
  magnitude: number;
  unitsDeployed: number;
}

interface ResultsScreenProps {
  results: Results;
  onReset: () => void;
  onResetSimulation?: () => void;
  onViewSimulation?: () => void;
}

export const ResultsScreen = ({ results, onReset, onResetSimulation, onViewSimulation }: ResultsScreenProps) => {
  const getGrade = () => {
    const avgScore = (results.resourceEfficiency + results.predictionAccuracy) / 2;
    // Tactical Grade Colors: S is glowing white, A is bright red, lower grades fade out
    if (avgScore >= 90) return { letter: 'S', color: 'text-white shadow-white', border: 'border-white', bg: 'bg-white/10', desc: 'MISSION EXCEEDED' };
    if (avgScore >= 80) return { letter: 'A', color: 'text-red-400', border: 'border-red-400', bg: 'bg-red-400/10', desc: 'OUTSTANDING' };
    if (avgScore >= 70) return { letter: 'B', color: 'text-amber-500', border: 'border-amber-500', bg: 'bg-amber-500/10', desc: 'ACCEPTABLE' };
    if (avgScore >= 60) return { letter: 'C', color: 'text-orange-600', border: 'border-orange-600', bg: 'bg-orange-600/10', desc: 'SUBOPTIMAL' };
    return { letter: 'D', color: 'text-red-800', border: 'border-red-900', bg: 'bg-red-950/30', desc: 'CRITICAL FAILURE' };
  };

  const grade = getGrade();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono"
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="relative w-full max-w-4xl bg-black border border-red-900/50 shadow-[0_0_50px_rgba(220,38,38,0.15)] overflow-hidden"
      >
        {/* IMMERSION: CRT Scanline Overlay inside the modal */}
        <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20 mix-blend-overlay" />

        {/* Header */}
        <div className="bg-red-950/30 border-b border-red-900/50 p-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black border border-red-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                <BarChart3 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-500 tracking-[0.2em] uppercase">Simulation Complete</h2>
                <p className="text-[10px] text-red-500/50 tracking-widest uppercase mt-1">Post-Action Performance Analysis</p>
              </div>
            </div>
            
            {/* Tactical Grade Badge */}
            <div className="text-right">
              <div className={`inline-flex items-center gap-4 px-6 py-2 border ${grade.border} ${grade.bg} shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
                <Award className={`w-6 h-6 ${grade.color}`} />
                <div className="flex flex-col items-end">
                  <div className={`text-3xl font-black ${grade.color} drop-shadow-[0_0_10px_currentColor]`}>
                    {grade.letter}
                  </div>
                  <p className={`text-[9px] tracking-[0.2em] uppercase ${grade.color}`}>{grade.desc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6 relative z-10">
          <div className="grid grid-cols-2 gap-4 mb-6">
            
            {/* Lives Saved */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5 bg-black border border-red-900/50 hover:border-red-500/50 transition-colors relative group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600 hidden group-hover:block shadow-[0_0_10px_rgba(220,38,38,1)]" />
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-red-950/30 border border-red-900/50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-[9px] font-bold text-red-500 px-2 py-1 border border-red-900/50 bg-red-950/20 tracking-widest uppercase">
                  Primary Metric
                </span>
              </div>
              <p className="text-[10px] text-red-500/50 uppercase tracking-widest mb-1">Lives Saved</p>
              <p className="text-3xl font-black text-red-500 tracking-wider">
                {results.livesSaved.toLocaleString()}
              </p>
              <p className="text-[9px] text-red-500/40 mt-2 uppercase tracking-widest">
                Estimated civilian protection rate
              </p>
            </motion.div>

            {/* Resource Efficiency */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 bg-black border border-red-900/50 hover:border-red-500/50 transition-colors relative group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600 hidden group-hover:block shadow-[0_0_10px_rgba(220,38,38,1)]" />
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-red-950/30 border border-red-900/50 flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <p className="text-[10px] text-red-500/50 uppercase tracking-widest mb-1">Asset Efficiency</p>
              <p className="text-3xl font-black text-red-400 tracking-wider">
                {results.resourceEfficiency}%
              </p>
              <div className="mt-4 w-full bg-red-950 h-1.5 border border-red-900/30 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${results.resourceEfficiency}%` }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="bg-red-500 h-full shadow-[0_0_10px_rgba(220,38,38,1)]"
                />
              </div>
            </motion.div>

            {/* Prediction Accuracy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 bg-black border border-red-900/50 hover:border-red-500/50 transition-colors relative group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600 hidden group-hover:block shadow-[0_0_10px_rgba(220,38,38,1)]" />
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-red-950/30 border border-red-900/50 flex items-center justify-center">
                  <Target className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <p className="text-[10px] text-red-500/50 uppercase tracking-widest mb-1">ML Surrogate Accuracy</p>
              <p className="text-3xl font-black text-red-400 tracking-wider">
                {results.predictionAccuracy}%
              </p>
              <div className="mt-4 w-full bg-red-950 h-1.5 border border-red-900/30 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${results.predictionAccuracy}%` }}
                  transition={{ delay: 0.6, duration: 1 }}
                  className="bg-red-500 h-full shadow-[0_0_10px_rgba(220,38,38,1)]"
                />
              </div>
            </motion.div>

            {/* Event Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-5 bg-black border border-red-900/50 hover:border-red-500/50 transition-colors relative group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600 hidden group-hover:block shadow-[0_0_10px_rgba(220,38,38,1)]" />
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-red-950/30 border border-red-900/50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <p className="text-[10px] text-red-500/50 uppercase tracking-widest mb-1">Event Summary</p>
              <p className="text-xl font-bold text-red-500 uppercase tracking-wider">
                Magnitude {results.magnitude.toFixed(1)}
              </p>
              <p className="text-[10px] text-red-500/50 mt-2 uppercase tracking-widest">
                {results.unitsDeployed} Response assets deployed
              </p>
            </motion.div>
          </div>

          {/* AI Insights Terminal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="p-5 bg-black border border-red-900/50 mb-6 relative"
          >
            <div className="flex items-center gap-3 mb-4 border-b border-red-900/30 pb-3">
              <Terminal className="w-4 h-4 text-red-500" />
              <span className="text-xs font-bold text-red-500 tracking-[0.2em] uppercase">Gemini AI Insights</span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex items-start gap-3">
                <span className="text-red-500 mt-0.5">{'>'}</span>
                <p className="text-[10px] text-red-400/80 uppercase tracking-wider leading-relaxed">
                  Response time optimal for urban deployment
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-500 mt-0.5">{'>'}</span>
                <p className="text-[10px] text-red-400/80 uppercase tracking-wider leading-relaxed">
                  Consider additional medical resources for M7.0+
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-500 mt-0.5">{'>'}</span>
                <p className="text-[10px] text-red-400/80 uppercase tracking-wider leading-relaxed">
                  Wave propagation model matched reality by {results.predictionAccuracy}%
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-500 mt-0.5">{'>'}</span>
                <p className="text-[10px] text-red-400/80 uppercase tracking-wider leading-relaxed">
                  Asset distribution effective across impact zone
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-red-900/30 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
              <p className="text-[9px] text-red-500/40 uppercase tracking-widest">
                Data logged to master terminal
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-col">
            <div className="flex gap-3">
              {onViewSimulation && (
                <button
                  onClick={onViewSimulation}
                  className="flex-1 flex items-center justify-center gap-3 py-4 bg-orange-600/10 hover:bg-orange-600/20 border border-orange-600 text-orange-400
                           font-bold tracking-widest text-xs uppercase transition-all shadow-[0_0_15px_rgba(251,146,60,0.2)] hover:shadow-[0_0_25px_rgba(251,146,60,0.4)]"
                >
                  <span>Explore Simulation</span>
                </button>
              )}
              <button
                onClick={onReset}
                className="flex-1 flex items-center justify-center gap-3 py-4 bg-yellow-600/10 hover:bg-yellow-600/20 border border-yellow-600 text-yellow-400
                         font-bold tracking-widest text-xs uppercase transition-all shadow-[0_0_15px_rgba(251,146,60,0.2)] hover:shadow-[0_0_25px_rgba(251,146,60,0.4)]"
              >
                <RotateCcw className="w-4 h-4" />
                Return to Menu
              </button>
            </div>
            {onResetSimulation && (
              <button
                onClick={onResetSimulation}
                className="w-full flex items-center justify-center gap-3 py-4 bg-green-600/10 hover:bg-green-600/20 border border-green-600 text-green-400
                         font-bold tracking-widest text-xs uppercase transition-all shadow-[0_0_15px_rgba(34,197,189,0.2)] hover:shadow-[0_0_25px_rgba(34,197,189,0.4)]"
              >
                <RotateCcw className="w-4 h-4" />
                New Simulation
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};