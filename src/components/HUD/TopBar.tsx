import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Clock, Waves } from 'lucide-react';
// Assuming TopBar is in src/components/HUD/, this goes up one level then into ui/
import logoImage from '../ui/logo.png'; 

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
          label: 'STANDBY',
          color: 'text-red-500/70',
          bgColor: 'bg-red-950/20',
          borderColor: 'border-red-900/30',
          icon: Activity
        };
      case 'PROPAGATING':
        return {
          label: 'ACTIVE RUPTURE',
          color: 'text-red-500',
          bgColor: 'bg-red-900/40',
          borderColor: 'border-red-500',
          icon: Waves
        };
      case 'RESULTS':
        return {
          label: 'ANALYSIS',
          color: 'text-amber-500',
          bgColor: 'bg-amber-950/30',
          borderColor: 'border-amber-900/50',
          icon: Activity
        };
      default:
        return {
          label: 'OFFLINE',
          color: 'text-slate-600',
          bgColor: 'bg-black',
          borderColor: 'border-slate-800',
          icon: Activity
        };
    }
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  const getRiskLevel = () => {
    if (magnitude < 5.5) return { label: 'LOW', color: 'text-green-500', bg: 'bg-green-950/20', border: 'border-green-900/30' };
    if (magnitude < 6.5) return { label: 'MODERATE', color: 'text-yellow-500', bg: 'bg-yellow-950/20', border: 'border-yellow-900/30' };
    if (magnitude < 7.5) return { label: 'HIGH', color: 'text-orange-500', bg: 'bg-orange-950/20', border: 'border-orange-900/30' };
    return { label: 'EXTREME', color: 'text-red-500', bg: 'bg-red-950/40', border: 'border-red-500' };
  };

  const risk = getRiskLevel();

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="absolute top-0 left-0 right-0 z-10 bg-black/90 backdrop-blur-md border-b border-red-900/50 shadow-[0_4px_30px_rgba(220,38,38,0.15)] font-mono"
    >
      <div className="flex items-center justify-between px-6 py-4">
        
        {/* Left: Branding & Custom Logo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black border border-red-900/50 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.2)] overflow-hidden">
              <img 
                src={logoImage} 
                alt="Seismic Simulator Logo" 
                className="w-full h-full object-cover opacity-90"
                style={{
                  // Optional: adds a slight red tint to your image to match the theme!
                  filter: 'drop-shadow(0px 0px 4px rgba(220,38,38,0.5))' 
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-[0.2em] text-red-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                SEISMIC SIMULATOR
              </h1>
              <p className="text-[10px] text-red-500/50 tracking-widest uppercase">Tactical Response v3.7</p>
            </div>
          </div>
        </div>

        {/* Center: Status and Countdown */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-1.5 ${status.bgColor} border ${status.borderColor}`}>
            <StatusIcon className={`w-4 h-4 ${status.color} ${gameState === 'PROPAGATING' ? 'animate-pulse' : ''}`} />
            <span className={`text-xs font-bold tracking-widest ${status.color}`}>
              {status.label}
            </span>
          </div>

          {gameState === 'PROPAGATING' && countdown !== null && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 px-4 py-1.5 bg-red-950/80 border border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
            >
              <Clock className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-sm font-bold text-red-500 tracking-wider">
                T-{countdown}s
              </span>
            </motion.div>
          )}
        </div>

        {/* Right: Metrics */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-red-500/50 uppercase tracking-widest">Target Mag</p>
            <p className="text-lg font-bold text-red-500">
              M{magnitude.toFixed(1)}
            </p>
          </div>

          <div className={`px-3 py-1.5 ${risk.bg} border ${risk.border}`}>
            <p className="text-[10px] text-red-500/50 uppercase tracking-widest mb-0.5">Risk</p>
            <p className={`text-xs font-bold tracking-widest ${risk.color}`}>
              {risk.label}
            </p>
          </div>

          <div className="w-px h-8 bg-red-900/30 hidden md:block" />

          <div className="text-right hidden md:block">
            <p className="text-[10px] text-red-500/50 uppercase tracking-widest">SYS.TIME</p>
            <p className="text-sm font-medium text-red-400/80">{currentTime}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};