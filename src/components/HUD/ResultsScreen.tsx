import { motion } from 'motion/react';
import {
  BarChart3,
  Users,
  Gauge,
  RotateCcw,
  TrendingUp,
  Terminal,
  Wallet,
  Activity,
  Zap,
  Clock,
  Home,
  Building2,
  AlertTriangle
} from 'lucide-react';

interface ResultsScreenProps {
  results: any; // Using any here to bypass strict typing for the snippet, but it matches the updated Results interface
  onReset: () => void;
  onResetSimulation?: () => void;
  onViewSimulation?: () => void;
}

export const ResultsScreen = ({
  results,
  onReset,
  onResetSimulation,
  onViewSimulation,
}: ResultsScreenProps) => {

  const TOTAL_POPULATION = 150000;
  const survivalRate = (results.livesSaved / TOTAL_POPULATION) * 100;

  const getGrade = () => {
    if (survivalRate >= 90) return { letter: 'S', color: 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]', border: 'border-white', bg: 'bg-white/10', desc: 'MISSION EXCEEDED' };
    if (survivalRate >= 80) return { letter: 'A', color: 'text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.8)]', border: 'border-red-400', bg: 'bg-red-400/10', desc: 'OUTSTANDING' };
    if (survivalRate >= 65) return { letter: 'B', color: 'text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]', border: 'border-amber-500', bg: 'bg-amber-500/10', desc: 'STABLE RESPONSE' };
    if (survivalRate >= 45) return { letter: 'C', color: 'text-orange-600 drop-shadow-[0_0_15px_rgba(234,88,12,0.8)]', border: 'border-orange-600', bg: 'bg-orange-600/10', desc: 'HEAVY CASUALTIES' };
    return { letter: 'D', color: 'text-red-800 drop-shadow-[0_0_10px_rgba(153,27,27,0.8)]', border: 'border-red-900', bg: 'bg-red-950/30', desc: 'CRITICAL FAILURE' };
  };

  const grade = getGrade();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 px-4 backdrop-blur-md font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-sm border border-red-900/50 bg-black shadow-[0_0_50px_rgba(220,38,38,0.15)] overflow-y-auto"
      >
        <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20 mix-blend-overlay" />

        <div className="grid gap-0 lg:grid-cols-[1.5fr_1fr] relative z-10">
          
          {/* Left Column: Dense Data Grid */}
          <div className="border-b border-red-900/30 p-6 lg:border-b-0 lg:border-r bg-black/80">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-red-500/70 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                  Simulation Complete
                </p>
                <h2 className="mt-2 text-3xl font-black text-red-500 uppercase tracking-widest">Post-Action Analysis</h2>
              </div>

              <div className={`flex h-20 w-20 flex-col items-center justify-center rounded-sm border ${grade.border} ${grade.bg}`}>
                <span className={`text-4xl font-black ${grade.color}`}>{grade.letter}</span>
              </div>
            </div>

            {/* Core Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              <div className="border border-red-900/30 bg-red-950/10 p-4 relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-red-500">
                  <span className="flex items-center gap-2"><Users size={14} /> Survival Rate</span>
                  <span className="text-red-500/50">Metric Alpha</span>
                </div>
                <div className="text-3xl font-bold text-white tracking-wider">{survivalRate.toFixed(1)}%</div>
                <div className="mt-1 text-[10px] uppercase text-red-500/50 tracking-widest">
                  {results.livesSaved.toLocaleString()} / {TOTAL_POPULATION.toLocaleString()} Saved
                </div>
              </div>

              <div className="border border-red-900/30 bg-red-950/10 p-4">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-red-500">
                  <span className="flex items-center gap-2"><Gauge size={14} /> Asset Efficiency</span>
                  <span className="text-red-500/50">Metric Beta</span>
                </div>
                <div className="text-3xl font-bold text-red-400 tracking-wider">{results.resourceEfficiency}%</div>
                <div className="mt-2 w-full bg-red-950 h-1 border border-red-900/30">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${results.resourceEfficiency}%` }} className="bg-red-500 h-full" />
                </div>
              </div>
            </div>

            {/* Geophysical Telemetry */}
            <h3 className="text-xs font-bold text-red-500/70 uppercase tracking-widest mb-3 border-b border-red-900/30 pb-2">Geophysical Telemetry</h3>
            <div className="grid gap-3 sm:grid-cols-3 mb-6">
              <div className="border border-red-900/20 bg-black p-3">
                <div className="text-[9px] uppercase tracking-widest text-red-500/60 mb-1 flex items-center gap-1"><Zap size={10}/> Peak Ground Velocity</div>
                <div className="text-lg font-bold text-red-400">{results.peakGroundVelocity} <span className="text-[10px] text-red-500/40">cm/s</span></div>
              </div>
              <div className="border border-red-900/20 bg-black p-3">
                <div className="text-[9px] uppercase tracking-widest text-red-500/60 mb-1 flex items-center gap-1"><Clock size={10}/> Shaking Duration</div>
                <div className="text-lg font-bold text-red-400">{results.shakingDuration} <span className="text-[10px] text-red-500/40">sec</span></div>
              </div>
              <div className="border border-red-900/20 bg-black p-3">
                <div className="text-[9px] uppercase tracking-widest text-red-500/60 mb-1 flex items-center gap-1"><AlertTriangle size={10}/> Aftershock Prob</div>
                <div className="text-lg font-bold text-red-400">{results.aftershockProb}%</div>
              </div>
            </div>

            {/* Socio-Economic Impact */}
            <h3 className="text-xs font-bold text-red-500/70 uppercase tracking-widest mb-3 border-b border-red-900/30 pb-2">Socio-Economic Impact</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-red-900/20 bg-black p-3">
                <div className="text-[9px] uppercase tracking-widest text-red-500/60 mb-1 flex items-center gap-1"><Wallet size={10}/> Est. Economic Loss</div>
                <div className="text-lg font-bold text-red-400">${results.economicLossBillion} <span className="text-[10px] text-red-500/40">Billion</span></div>
              </div>
              <div className="border border-red-900/20 bg-black p-3">
                <div className="text-[9px] uppercase tracking-widest text-red-500/60 mb-1 flex items-center gap-1"><Building2 size={10}/> Infra. Integrity</div>
                <div className="text-lg font-bold text-red-400">{results.infrastructureIntegrity}%</div>
              </div>
              <div className="border border-red-900/20 bg-black p-3">
                <div className="text-[9px] uppercase tracking-widest text-red-500/60 mb-1 flex items-center gap-1"><Home size={10}/> Displaced Persons</div>
                <div className="text-lg font-bold text-red-400">{results.displacedPersons.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Terminal & Actions */}
          <div className="p-6 bg-black flex flex-col justify-between">
            <div className="border border-red-900/30 bg-black/90 p-4 shadow-inner mb-6">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-red-500 border-b border-red-900/30 pb-2">
                <Terminal size={14} />
                Gemini Tactical Debrief
              </div>

              <div className="space-y-3 text-[10px] text-red-400/80 tracking-widest uppercase leading-relaxed">
                <div className="flex gap-2">
                  <span className="text-red-500">{'>'}</span>
                  <span>Event logged: Magnitude {results.magnitude.toFixed(1)}. {results.unitsDeployed} Mitigation assets deployed.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-red-500">{'>'}</span>
                  <span>Damage Index registered at {results.expectedDamageIndex}/100. Structural integrity compromised in {results.infrastructureIntegrity < 50 ? 'majority' : 'minority'} of sectors.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-red-500">{'>'}</span>
                  <span>{results.displacedPersons > 50000 ? 'CRITICAL: Massive displacement detected. Initiate emergency shelter protocols.' : 'Displacement within expected parameters for M' + results.magnitude.toFixed(1) + ' event.'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-red-500">{'>'}</span>
                  <span>Overall Grade: {grade.desc}</span>
                </div>
                <div className="w-2 h-3 bg-red-500 animate-pulse mt-4" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {onViewSimulation && (
                <button
                  onClick={onViewSimulation}
                  className="w-full py-4 bg-orange-600/10 hover:bg-orange-600/20 border border-orange-600 text-orange-400 font-bold tracking-widest text-xs uppercase transition-all shadow-[0_0_15px_rgba(251,146,60,0.2)] hover:shadow-[0_0_25px_rgba(251,146,60,0.4)]"
                >
                  Explore Simulation
                </button>
              )}

              {onResetSimulation && (
                <button
                  onClick={onResetSimulation}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-red-950/30 hover:bg-red-900/40 border border-red-600 text-red-500 font-bold tracking-widest text-xs uppercase transition-all hover:shadow-[0_0_25px_rgba(220,38,38,0.4)]"
                >
                  <RotateCcw size={14} />
                  New Scenario
                </button>
              )}

              <button
                onClick={onReset}
                className="w-full flex items-center justify-center gap-3 py-4 bg-black hover:bg-red-950/20 border border-red-900/50 text-red-500/70 font-bold tracking-widest text-xs uppercase transition-all"
              >
                Return to Menu
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};