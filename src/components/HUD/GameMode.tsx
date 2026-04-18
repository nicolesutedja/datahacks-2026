import { motion } from 'motion/react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { MapLibreContainer } from '../Map/MapLibreContainer';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { ResourceDock } from './ResourceDock';
import { TasksPanel } from './TasksPanel';
import { ResultsScreen } from '../Modals/ResultsScreen';
import { MapboxContainer } from '../Map/MapboxContainer';

export const GameMode = ({
  gameState, epicenter, magnitude, units, selectedUnitType, waveProgress, countdown, results,
  setMagnitude, setSelectedUnitType, startSimulation, resetSimulation, handleMapClick, onReturnToMenu, GAME_STATES
}: any) => {

  const showLiquefactionAlert = waveProgress > 0.5 && gameState === GAME_STATES.PROPAGATING;

  return (
    <div className="relative w-full h-screen bg-black text-red-500 font-mono overflow-hidden selection:bg-red-900/30">
      
      {/* IMMERSION: CRT Scanline Overlay */}
      <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20 mix-blend-overlay" />

      {/* Map Layer */}
      <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen">
        <MapLibreContainer
          epicenter={epicenter} units={units} waveProgress={waveProgress}
          gameState={gameState} onMapClick={handleMapClick} selectedUnitType={selectedUnitType}
        />
      </div>

      <TopBar gameState={gameState} countdown={countdown} magnitude={magnitude} />

      <Sidebar
        gameState={gameState} magnitude={magnitude} panicMode={false} epicenter={epicenter}
        onMagnitudeChange={setMagnitude} onPanicModeToggle={() => {}} onStart={startSimulation}
        onReset={resetSimulation}
      />

      <ResourceDock
        units={units} selectedUnitType={selectedUnitType} gameState={gameState} onSelectUnit={setSelectedUnitType}
      />

      <div className="absolute top-20 left-0 z-20 pointer-events-none">
        <div className="pointer-events-auto relative">
          <TasksPanel gameState={gameState} magnitude={magnitude} unitsDeployed={units.length} epicenterSet={!!epicenter} />
        </div>
      </div>

      {/* Tactical Abort Button */}
      <div className="absolute bottom-6 left-6 z-20">
        <button onClick={onReturnToMenu} className="group flex items-center gap-3 px-5 py-3 bg-black/90 hover:bg-red-950/80 border border-red-900/50 hover:border-red-500 text-red-500 transition-all duration-300 shadow-[0_0_15px_rgba(220,38,38,0.15)] hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] backdrop-blur-md">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-xs uppercase tracking-[0.2em] font-bold">Abort Mission</span>
        </button>
      </div>

      {/* Critical Risk Alert */}
      {showLiquefactionAlert && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute top-32 left-1/2 -translate-x-1/2 z-30">
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
        <ResultsScreen results={results} onReset={onReturnToMenu} />
      )}
    </div>
  );
};