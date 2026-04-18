import { motion } from 'motion/react';
import { BarChart3, Users, Gauge, Target, RotateCcw, TrendingUp, Award } from 'lucide-react';

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
}

export const ResultsScreen = ({ results, onReset }: ResultsScreenProps) => {
  const getGrade = () => {
    const avgScore = (results.resourceEfficiency + results.predictionAccuracy) / 2;
    if (avgScore >= 90) return { letter: 'S', color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Exceptional' };
    if (avgScore >= 80) return { letter: 'A', color: 'text-green-600', bg: 'bg-green-50', desc: 'Excellent' };
    if (avgScore >= 70) return { letter: 'B', color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Good' };
    if (avgScore >= 60) return { letter: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50', desc: 'Fair' };
    return { letter: 'D', color: 'text-red-600', bg: 'bg-red-50', desc: 'Needs Improvement' };
  };

  const grade = getGrade();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Simulation Complete</h2>
                <p className="text-sm text-blue-100">Performance Analysis</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 ${grade.bg} rounded-lg`}>
                <Award className={`w-5 h-5 ${grade.color}`} />
                <div>
                  <div className={`text-3xl font-bold ${grade.color}`}>
                    {grade.letter}
                  </div>
                  <p className={`text-xs ${grade.color}`}>{grade.desc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Lives Saved */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-700 px-2 py-1 bg-green-100 rounded-full">
                  Primary Metric
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">Lives Saved</p>
              <p className="text-3xl font-bold text-green-600">
                {results.livesSaved.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Estimated civilian protection rate
              </p>
            </motion.div>

            {/* Resource Efficiency */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Gauge className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-2">Resource Efficiency</p>
              <p className="text-3xl font-bold text-blue-600">
                {results.resourceEfficiency}%
              </p>
              <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${results.resourceEfficiency}%` }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="bg-blue-500 h-2 rounded-full"
                />
              </div>
            </motion.div>

            {/* Prediction Accuracy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-2">Prediction Accuracy</p>
              <p className="text-3xl font-bold text-purple-600">
                {results.predictionAccuracy}%
              </p>
              <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${results.predictionAccuracy}%` }}
                  transition={{ delay: 0.6, duration: 1 }}
                  className="bg-purple-500 h-2 rounded-full"
                />
              </div>
            </motion.div>

            {/* Event Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-slate-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-slate-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-2">Event Summary</p>
              <p className="text-xl font-bold text-slate-900">
                M{results.magnitude.toFixed(1)} Earthquake
              </p>
              <p className="text-sm text-slate-600 mt-2">
                {results.unitsDeployed} response units deployed
              </p>
            </motion.div>
          </div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-slate-900">AI-Powered Insights</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 bg-green-500 rounded-full mt-1.5" />
                <p className="text-sm text-slate-700">
                  Response time optimal for urban deployment
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 bg-yellow-500 rounded-full mt-1.5" />
                <p className="text-sm text-slate-700">
                  Consider additional medical resources for M7.0+
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5" />
                <p className="text-sm text-slate-700">
                  Wave propagation model accuracy: {results.predictionAccuracy}%
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 bg-purple-500 rounded-full mt-1.5" />
                <p className="text-sm text-slate-700">
                  Unit distribution effective across impact zone
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-slate-500 italic">
                Integration point for Gemini ML analysis
              </p>
            </div>
          </motion.div>

          {/* Action Button */}
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
                     text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Start New Simulation
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
