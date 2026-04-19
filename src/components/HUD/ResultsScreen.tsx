import { motion } from 'motion/react';
import {
  BarChart3,
  Users,
  Gauge,
  Target,
  RotateCcw,
  TrendingUp,
  Award,
  Terminal,
  Wallet,
  ShieldCheck,
} from 'lucide-react';

interface Results {
  livesSaved: number;
  resourceEfficiency: number;
  predictionAccuracy: number;
  magnitude: number;
  unitsDeployed: number;
  expectedDamageIndex: number;
  predictedSeverity: 'low' | 'moderate' | 'high' | 'severe';
  modelReliability: number;
}

interface ResultsScreenProps {
  results: Results;
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
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);

  const getGrade = () => {
    const avgScore =
      (results.resourceEfficiency +
      results.predictionAccuracy +
      results.modelReliability) / 3

    if (avgScore >= 90) {
      return {
        letter: 'S',
        color: 'text-white shadow-white',
        border: 'border-white',
        bg: 'bg-white/10',
        desc: 'MISSION EXCEEDED',
      };
    }
    if (avgScore >= 80) {
      return {
        letter: 'A',
        color: 'text-red-400',
        border: 'border-red-400',
        bg: 'bg-red-400/10',
        desc: 'OUTSTANDING',
      };
    }
    if (avgScore >= 70) {
      return {
        letter: 'B',
        color: 'text-amber-400',
        border: 'border-amber-400',
        bg: 'bg-amber-400/10',
        desc: 'STABLE RESPONSE',
      };
    }
    if (avgScore >= 60) {
      return {
        letter: 'C',
        color: 'text-orange-500',
        border: 'border-orange-500',
        bg: 'bg-orange-500/10',
        desc: 'PARTIAL CONTAINMENT',
      };
    }
    return {
      letter: 'D',
      color: 'text-red-800',
      border: 'border-red-900',
      bg: 'bg-red-950/30',
      desc: 'CRITICAL FAILURE',
    };
  };

  const grade = getGrade();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-red-900/50 bg-black/95 text-white shadow-2xl"
      >
        <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(to_bottom,transparent_50%,rgba(255,255,255,0.08)_50%)] [background-size:100%_6px]" />

        <div className="grid gap-0 lg:grid-cols-[1.2fr_1fr]">
          <div className="border-b border-red-900/30 p-6 lg:border-b-0 lg:border-r">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-red-400/70">
                  Simulation Complete
                </p>
                <h2 className="mt-2 text-3xl font-bold">Post-Action Analysis</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Your deployment is now scored on model reliability, response efficiency, and event severity alignment.
                </p>
              </div>

              <div
                className={`flex h-24 w-24 flex-col items-center justify-center rounded-2xl border ${grade.border} ${grade.bg}`}
              >
                <span className={`text-4xl font-black ${grade.color}`}>{grade.letter}</span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.22em] text-zinc-300">
                  {grade.desc}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-red-400">
                  <Users size={14} />
                  Primary Metric
                </div>
                <div className="text-sm text-zinc-400">Lives Saved</div>
                <div className="mt-1 text-3xl font-bold text-white">
                  {results.livesSaved.toLocaleString()}
                </div>
              </div>

              <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-red-400">
                  <Gauge size={14} />
                  Asset Efficiency
                </div>
                <div className="text-3xl font-bold">{results.resourceEfficiency}%</div>
                <div className="mt-1 text-sm text-zinc-400">How effectively your spend translated into response value</div>
              </div>

              <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-red-400">
                  <ShieldCheck size={14} />
                  Model Reliability
                </div>
                <div className="text-3xl font-bold">{results.modelReliability}%</div>
                <div className="mt-1 text-sm text-zinc-400">Confidence-adjusted trust in this simulation output</div>
              </div>

              <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-red-400">
                  <Target size={14} />
                  Predicted Severity
                </div>
                <div className="text-3xl font-bold uppercase">{results.predictedSeverity}</div>
                <div className="mt-1 text-sm text-zinc-400">Model-classified event severity from the hazard output</div>
              </div>

              <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-red-400">
                  <TrendingUp size={14} />
                  Risk Alignment
                </div>
                <div className="text-3xl font-bold">{results.predictionAccuracy}%</div>
                <div className="mt-1 text-sm text-zinc-400">Reliability-adjusted score for how well your response matched the modeled event</div>
              </div>

              <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-red-400">
                  <Wallet size={14} />
                  Damage Summary
                </div>
                <div className="text-lg font-bold">
                  Damage Index: {results.expectedDamageIndex}
                </div>
                <div className="mt-1 text-sm text-zinc-400">
                  Lower values indicate lighter modeled infrastructure impact
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-red-900/30 bg-red-950/10 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-red-400">
                <Award size={14} />
                Event Summary
              </div>
              <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-3">
                <div>Magnitude <span className="font-semibold text-white">{results.magnitude.toFixed(1)}</span></div>
                <div>Assets Deployed <span className="font-semibold text-white">{results.unitsDeployed}</span></div>
                <div>Damage Index <span className="font-semibold text-white">{results.expectedDamageIndex}</span></div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="rounded-2xl border border-red-900/30 bg-black/70 p-4">
              <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-red-400">
                <Terminal size={14} />
                Tactical Debrief
              </div>

              <div className="space-y-3 text-sm text-zinc-300">
                <div className="rounded-xl border border-red-900/25 bg-red-950/10 p-3">
                  <span className="mr-2 text-red-400">{'>'}</span>
                  Predicted severity: {results.predictedSeverity.toUpperCase()}
                </div>

                <div className="rounded-xl border border-red-900/25 bg-red-950/10 p-3">
                  <span className="mr-2 text-red-400">{'>'}</span>
                  Model reliability: {results.modelReliability}%
                </div>

                <div className="rounded-xl border border-red-900/25 bg-red-950/10 p-3">
                  <span className="mr-2 text-red-400">{'>'}</span>
                  Response efficiency: {results.resourceEfficiency}%
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {onViewSimulation && (
                <button
                  onClick={onViewSimulation}
                  className="rounded-xl border border-red-500/60 bg-red-600 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-red-700"
                >
                  Explore Simulation
                </button>
              )}

              {onResetSimulation && (
                <button
                  onClick={onResetSimulation}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800"
                >
                  <span className="inline-flex items-center gap-2">
                    <RotateCcw size={14} />
                    New Simulation
                  </span>
                </button>
              )}

              <button
                onClick={onReset}
                className="rounded-xl border border-red-900/40 bg-black px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-950/30"
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