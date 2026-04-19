import { motion } from 'motion/react';
import { SeismicBackground } from './SeismicBackground';
import { PulseButton } from './PulseButton';
import logoImage from '../ui/logo.png';

interface LandingPageProps {
  onStartScenario: () => void;
  onSandboxMode: () => void;
}

export const LandingPage = ({
  onStartScenario,
  onSandboxMode,
}: LandingPageProps) => {
  const shake = {
    whileHover: {
      x: [0, -6, 8, -8, 6, -3, 3, 0],
      y: [0, 4, -4, 4, -3, 2, -2, 0],
      rotate: [0, -1, 1, -1, 0],
    },
    transition: { duration: 0.25 },
  };

  return (
    <div className="size-full relative overflow-hidden bg-slate-950">
      <SeismicBackground />

      <div className="relative z-10 size-full flex flex-col items-center justify-center gap-12 px-8 pointer-events-none h-screen">

        {/* TITLE */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="text-center mb-4"
        >
          <div className="flex items-center justify-center mb-6">
            <motion.img
              src={logoImage}
              alt="Seismic Simulator Logo"
              className="w-24 h-24 opacity-80"
              style={{
                filter:
                  'brightness(0) saturate(100%) invert(27%) sepia(93%) saturate(3571%) hue-rotate(349deg) brightness(95%) contrast(91%)',
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          <h1
            className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700 mb-3 tracking-tighter"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            SEISMICSIMULATOR
          </h1>

          <p
            className="text-red-500/40 text-xs uppercase tracking-[0.3em] font-medium"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            Tactical Waveform Analysis System v3.7
          </p>
        </motion.div>

        {/* 🌋 ONLY SHAKING BUTTONS */}
        <motion.div
          className="flex items-center gap-6 pointer-events-auto"
        >
          <motion.div {...shake}>
            <PulseButton
              variant="primary"
              onClick={onStartScenario}
            >
              Game Mode
            </PulseButton>
          </motion.div>

          <motion.div {...shake}>
            <PulseButton
              variant="secondary"
              onClick={onSandboxMode}
            >
              Sandbox Mode
            </PulseButton>
          </motion.div>
        </motion.div>

        {/* NO SHAKE BUTTONS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="flex gap-6 pointer-events-auto"
        >
          <PulseButton variant="tertiary">
            Settings
          </PulseButton>

          <PulseButton variant="tertiary">
            About
          </PulseButton>
        </motion.div>

        {/* STATUS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 text-red-900/40 text-xs">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.6)]" />
            <span className="uppercase tracking-[0.2em] font-medium">
              System Online
            </span>
          </div>
        </motion.div>

      </div>
    </div>
  );
};