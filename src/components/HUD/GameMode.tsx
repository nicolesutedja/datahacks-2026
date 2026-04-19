import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ArrowLeft, Target, ShieldCheck, Activity, MapPin } from 'lucide-react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { ResourceDock } from './ResourceDock';
import { TasksPanel } from './TasksPanel';
import { ResultsScreen } from './ResultsScreen';
import { MapboxContainer } from '../Map/MapboxContainer';

export const GameMode = ({
  gameState, epicenter, magnitude, units, selectedUnitType, waveProgress, countdown, results,
  setMagnitude, setSelectedUnitType, startSimulation, resetSimulation, handleMapClick, onReturnToMenu, GAME_STATES,
  simulationOutput, handleRegionInsightClick
}: any) => {

  const [activeZone, setActiveZone] = useState<any | null>(null);
  // Controls the pre-game briefing
  const [showBriefing, setShowBriefing] = useState(true);
  
  const showLiquefactionAlert = waveProgress > 0.5 && gameState === GAME_STATES.PROPAGATING;

  return (
    <div className="relative w-full h-screen bg-black text-red-500 font-mono overflow-hidden selection:bg-red-900/30">
      
      {/* --- PRE-GAME MISSION BRIEFING --- */}
      <AnimatePresence>
        {showBriefing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 font-mono pointer-events-auto"
          >
            <div className="relative w-full max-w-2xl bg-black border border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.2)] overflow-hidden">
              <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-30 mix-blend-overlay" />
              
              <div className="p-6 bg-red-950/40 border-b border-red-900/50 relative z-10 flex items-center gap-4">
                <Target className="w-8 h-8 text-red-500 animate-pulse" />
                <div>
                  <h2 className="text-2xl font-black text-red-500 tracking-[0.2em] uppercase">Mission Briefing</h2>
                  <p className="text-[10px] text-red-500/70 tracking-widest uppercase">Tactical Mitigation Objectives</p>
                </div>
              </div>

              <div className="p-8 relative z-10 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 border border-red-900/50 bg-black">
                    <MapPin className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-red-400 mb-1">1. Scan Unexplored Zones</h3>
                      <p className="text-xs text-red-500/70 leading-relaxed">Unidentified sectors will appear near the epicenter. Click these zones to run a <span className="text-amber-400 font-bold">Gemini AI Soil Analysis</span> to determine liquefaction risk.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 border border-red-900/50 bg-black">
                    <Activity className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-red-400 mb-1">2. Deploy Soil Mitigation</h3>
                      <p className="text-xs text-red-500/70 leading-relaxed">Based on the AI scan, deploy <span className="text-blue-400 font-bold">Drainage Networks</span>, <span className="text-orange-400 font-bold">Vibro-Stone Rigs</span>, or <span className="text-green-400 font-bold">Cement Injections</span> to stabilize the ground.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 border border-red-900/50 bg-black">
                    <ShieldCheck className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-green-400 mb-1">3. Survival Objective</h3>
                      <p className="text-xs text-red-500/70 leading-relaxed">You must achieve a Civilian Survival Rate of <span className="text-white font-bold">&gt;80%</span>. Execute the simulation when defenses are set.</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowBriefing(false)}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-black font-black uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]"
                >
                  Acknowledge & Commence
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen">
        <MapboxContainer
          epicenter={epicenter} 
          units={units} 
          waveProgress={waveProgress}
          gameState={gameState} 
          onMapClick={handleMapClick} 
          onRegionInsightClick={handleRegionInsightClick}
          selectedUnitType={selectedUnitType}
          simulationOutput={simulationOutput}
          onZoneClick={setActiveZone}
        />
      </div>

      <TopBar gameState={gameState} countdown={countdown} magnitude={magnitude} onReturnToMenu={onReturnToMenu} />

      <Sidebar
        gameState={gameState} magnitude={magnitude} panicMode={false} epicenter={epicenter}
        onMagnitudeChange={setMagnitude} onPanicModeToggle={() => {}} onStart={startSimulation}
        onReset={resetSimulation}
      />

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex justify-center">
        <ResourceDock
          units={units} selectedUnitType={selectedUnitType} gameState={gameState} onSelectUnit={setSelectedUnitType}
        />
      </div>

      <div className="absolute top-20 left-0 z-20 pointer-events-none">
        <div className="pointer-events-auto relative">
          <TasksPanel gameState={gameState} magnitude={magnitude} unitsDeployed={units.length} epicenterSet={!!epicenter} />
        </div>
      </div>

      {showLiquefactionAlert && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute top-32 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-black/95 backdrop-blur-md text-red-500 border border-red-600 px-8 py-4 flex items-center gap-4 shadow-[0_0_40px_rgba(220,38,38,0.6)]">
            <AlertTriangle className="w-8 h-8 animate-pulse text-red-500" />
            <div>
              <p className="font-bold text-sm tracking-[0.25em] uppercase">Critical Alert: Liquefaction</p>
              <p className="text-[10px] text-red-500/70 font-mono mt-1 tracking-widest">STRUCTURAL FAILURE DETECTED IN SECTOR 7</p>
            </div>
          </div>
        </motion.div>
      )}
      
      {gameState === GAME_STATES.RESULTS && results && (
        <ResultsScreen results={results} onReset={onReturnToMenu} onResetSimulation={resetSimulation} />
      )}
    </div>
  );
};