import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { SeismicBackground } from './SeismicBackground';
import { PulseButton } from './PulseButton';
import logoImage from '../ui/logo.png';
import { X, Settings, Info, Activity, ShieldCheck } from 'lucide-react';

interface LandingPageProps {
  onStartScenario: () => void;
  onSandboxMode: () => void;
}

export const LandingPage = ({ onStartScenario, onSandboxMode }: LandingPageProps) => {
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [intensity, setIntensity] = useState(6.8);

  // --- STAGGERED ENTRANCE ANIMATIONS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 } 
    }
  };

  const shake = {
    whileHover: {
      x: [0, -6, 8, -8, 6, -3, 3, 0],
      y: [0, 4, -4, 4, -3, 2, -2, 0],
      rotate: [0, -1, 1, -1, 0],
    },
    transition: { duration: 0.25 },
  };

  return (
    <div className="size-full relative overflow-hidden bg-slate-950 font-mono">
      {/* KEEPING BACKGROUND FUNCTIONAL: 
         SeismicBackground stays at the bottom and retains mouse listeners 
      */}
      <SeismicBackground />

      {/* TACTICAL SCANLINE OVERLAY */}
      <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.05),rgba(0,255,0,0.02),rgba(0,0,255,0.05))] bg-[length:100%_4px,3px_100%] opacity-20 mix-blend-overlay" />

      <AnimatePresence>
        {/* ================= MODALS ================= */}
        {(showAbout || showSettings) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-[600px] bg-slate-900 border border-red-600 p-6 text-white shadow-[0_0_30px_rgba(220,38,38,0.2)]"
            >
              <div className="flex justify-between items-center mb-6 border-b border-red-900/50 pb-4">
                <h2 className="text-2xl font-bold text-red-500 flex items-center gap-3"
               style={{ fontFamily: 'Orbitron, sans-serif' }}   >
                  {showSettings ? <Settings className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                  {showSettings ? 'SETTINGS' : 'ABOUT SYSTEM'}
                </h2>
                <button onClick={() => { setShowAbout(false); setShowSettings(false); }} className="text-red-900 hover:text-red-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {showAbout ? (
                <div className="space-y-4">
                  <p className="text-sm text-red-500 leading-relaxed"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}   >
                   SeismicStabilize is an innovative educational platform dedicated to raising awareness 
                   about earthquake dynamics and prevention. By combining real-time seismic wave simulations with practical urban 
                  planning strategies, we empower users to understand and apply essential techniques like soil stabilization and 
                  structural shoring to reduce earthquake risks. Our mission is to foster resilient communities through interactive learning and informed decision-making.
                  </p>
                   <p

      className="text-sm text-red-500 leading-relaxed"

      style={{ fontFamily: 'Orbitron, sans-serif' }}

    >

      This project is a tactical, educational gaming platform built by the NJ Squared

      Team at DataHacks 2026. It is designed to teach users how to mitigate earthquake

      damage through real-time simulation, wave propagation analysis, and structural

      engineering decision-making tasks.

    </p>
                  <div className="flex items-center gap-2 text-[10px] text-red-900 font-bold tracking-widest"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    <ShieldCheck className="w-4 h-4" /> SECURE TERMINAL ACCESS GRANTED
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <span className="text-sm uppercase tracking-wider text-red-500"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}   >
                       Audio Feedback  </span>
                    <button onClick={() => setSoundOn(!soundOn)} className={`px-4 py-2 text-xs font-bold ${soundOn ? 'bg-black text-red-500 border border-red-500'     // <-- CHANGED

      : 'bg-red-500 text-black border border-red-500'}`}>
                      {soundOn ? 'ACTIVE' : 'MUTED'}
                    </button>
                  </div>
                </div>
              )}

              <button onClick={() => { setShowAbout(false); setShowSettings(false); }} className="mt-8 px-6 py-2 bg-black text-red-500 font-bold uppercase tracking-widest text-xs border border-red-500 hover:bg-red-500 hover:text-black transition-colors w-full"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}   >
                Close Terminal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MAIN INTERFACE ================= */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 size-full flex flex-col items-center justify-center gap-12 px-8 h-screen pointer-events-none"
      >
        {/* TITLE BLOCK */}
        <motion.div variants={itemVariants} className="text-center mb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="flex items-center justify-center mb-6"
          >
            <motion.img
              src={logoImage}
              alt="Logo"
              className="w-24 h-24 opacity-80"
              style={{
                filter: 'drop-shadow(0px 0px 12px rgba(220,38,38,0.4))'
              }}
              animate={{ 
                filter: [
                  'drop-shadow(0px 0px 12px rgba(220,38,38,0.4))',
                  'drop-shadow(0px 0px 24px rgba(220,38,38,0.7))',
                  'drop-shadow(0px 0px 12px rgba(220,38,38,0.4))'
                ] 
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>

          <h1 
            className="text-7xl font-black text-red-600 tracking-tighter" 
            style={{ 
              fontFamily: 'Orbitron, sans-serif',
              // Adds a dynamic "shimmer" to the text
              textShadow: '0 0 15px rgba(220, 38, 38, 0.4)'
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.8, 1, 0.9, 1] }}
              style={{ fontFamily: 'Inter, sans-serif' }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              SEISMIC
            </motion.span>
            <span className="text-red-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>STABILIZE</span>
          </h1>

          <p className="text-red-500/40 text-xs uppercase tracking-[0.3em] font-medium mt-2">
            An app for simulating seismic events and tactical response strategies.
          </p>
        </motion.div>

        {/* PRIMARY ACTIONS */}
        <motion.div variants={itemVariants} className="flex items-center gap-6 pointer-events-auto">
          <motion.div {...shake}>
            <PulseButton variant="primary" onClick={onStartScenario}>
              <span style={{ fontFamily: 'Orbitron, sans-serif' }}>Game Mode</span>
            </PulseButton>
          </motion.div>

          <motion.div {...shake}>
            <PulseButton variant="secondary" onClick={onSandboxMode}>
              <span style={{ fontFamily: 'Orbitron, sans-serif' }}>Sandbox</span>
            </PulseButton>
          </motion.div>
        </motion.div>

        {/* UTILITY ACTIONS */}
        <motion.div variants={itemVariants} className="flex gap-6 pointer-events-auto">
          <PulseButton variant="tertiary" onClick={() => setShowSettings(true)}>
            <span style={{ fontFamily: 'Orbitron, sans-serif' }}>Settings</span>
          </PulseButton>

          <PulseButton variant="tertiary" onClick={() => setShowAbout(true)}>
            <span style={{ fontFamily: 'Orbitron, sans-serif' }}>About</span>
          </PulseButton>
        </motion.div>

        {/* STATUS BAR */}
        <motion.div 
          variants={itemVariants}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 text-red-900/40 text-[10px] tracking-widest"
        >
          <Activity className="w-3 h-3 text-red-600 animate-pulse" />
          <span className="uppercase font-bold">System Online // Connected</span>
        </motion.div>
      </motion.div>
    </div>
  );
};