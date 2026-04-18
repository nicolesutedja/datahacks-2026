import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Clock, AlertTriangle, Waves } from 'lucide-react';

interface TopBarProps {
  gameState: string;
  countdown: number | null;
  magnitude: number;
}

export const TopBar = ({ gameState, countdown, magnitude }: TopBarProps) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = () => {
    switch (gameState) {
      case 'SETUP':
        return {
          label: 'Ready',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: Activity
        };
      case 'PROPAGATING':
        return {
          label: 'Active',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: Waves
        };
      case 'RESULTS':
        return {
          label: 'Complete',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: Activity
        };
      default:
        return {
          label: 'Standby',
          color: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          icon: Activity
        };
    }
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  const getRiskLevel = () => {
    if (magnitude < 5.5) return { label: 'Low', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (magnitude < 6.5) return { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    if (magnitude < 7.5) return { label: 'High', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { label: 'Extreme', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const risk = getRiskLevel();

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Branding */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Seismic Sentinel
              </h1>
              <p className="text-xs text-slate-500">Response Dashboard</p>
            </div>
          </div>
        </div>

        {/* Center: Status and Countdown */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 ${status.bgColor} rounded-lg border ${status.borderColor}`}>
            <StatusIcon className={`w-4 h-4 ${status.color}`} />
            <span className={`text-sm font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>

          {gameState === 'PROPAGATING' && countdown !== null && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg border border-red-200"
            >
              <Clock className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-600">
                {countdown}s
              </span>
            </motion.div>
          )}
        </div>

        {/* Right: Metrics */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-500">Magnitude</p>
            <p className="text-lg font-semibold text-slate-900">
              M{magnitude.toFixed(1)}
            </p>
          </div>

          <div className={`px-3 py-1.5 ${risk.bg} rounded-lg border ${risk.border}`}>
            <p className="text-xs text-slate-500">Risk</p>
            <p className={`text-sm font-semibold ${risk.color}`}>
              {risk.label}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">Time</p>
            <p className="text-sm font-medium text-slate-900">{currentTime}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
