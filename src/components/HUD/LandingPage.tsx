import { motion } from 'motion/react';
import { useState } from 'react';
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
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // fake settings state (UI only for now)
  const [soundOn, setSoundOn] = useState(true);
  const [intensity, setIntensity] = useState(6.8);

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

      {/* ================= ABOUT MODAL ================= */}
      {showAbout && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-[600px] bg-slate-900 border border-red-600 p-6 text-white"
          >
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              About Seismic Simulator
            </h2>

            <p className="text-sm text-white/70 mb-4">
              Real-time earthquake simulation with wave propagation, structural
              damage modeling, and emergency response strategy.
            </p>

            <button
              onClick={() => setShowAbout(false)}
              className="mt-4 px-4 py-2 bg-red-600 text-black font-bold"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* ================= SETTINGS MODAL ================= */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-[600px] bg-slate-900 border border-red-600 p-6 text-white"
          >
            <h2 className="text-2xl font-bold text-red-500 mb-6">
              Settings
            </h2>

            {/* SOUND TOGGLE */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm">Sound Effects</span>
              <button
                onClick={() => setSoundOn(!soundOn)}
                className={`px-4 py-2 text-xs font-bold ${
                  soundOn ? 'bg-green-600' : 'bg-red-600'
                } text-black`}
              >
                {soundOn ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* INTENSITY SLIDER */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Magnitude Intensity</span>
                <span className="text-red-400">{intensity.toFixed(1)}</span>
              </div>

              <input
                type="range"
                min="4"
                max="9"
                step="0.1"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="mt-2 px-4 py-2 bg-red-600 text-black font-bold"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* ================= MAIN ================= */}
      <div className="relative z-10 size-full flex flex-col items-center justify-center gap-12 px-8 pointer-events-none h-screen">

        {/* TITLE */}
        <motion.div className="text-center">
          <motion.img
            src={logoImage}
            className="w-24 h-24 opacity-80 mx-auto mb-4"
          />

          <h1 className="text-6xl font-black text-red-600">
            SEISMIC SIMULATOR
          </h1>
        </motion.div>

        {/* SHAKING BUTTONS */}
        <div className="flex gap-6 pointer-events-auto">
          <motion.div {...shake}>
            <PulseButton onClick={onStartScenario}>
              Game Mode
            </PulseButton>
          </motion.div>

          <motion.div {...shake}>
            <PulseButton onClick={onSandboxMode}>
              Sandbox
            </PulseButton>
          </motion.div>
        </div>

        {/* UTILITY BUTTONS */}
        <div className="flex gap-6 pointer-events-auto">
          <PulseButton 
          variant="tertiary" 
          onClick={() => setShowSettings(true)}
          >
             Settings
          </PulseButton>

          <PulseButton
            variant="tertiary"
            onClick={() => setShowAbout(true)}
          >
            About
          </PulseButton>
        </div>

      </div>
    </div>
  );
};