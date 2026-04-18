import { motion } from 'motion/react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { MapLibreContainer } from '../Map/MapLibreContainer';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { ResourceDock } from './ResourceDock';
import { TasksPanel } from './TasksPanel';
import { ResultsScreen } from '../Modals/ResultsScreen';

export const SandboxMode = ({
  gameState, epicenter, magnitude, units, selectedUnitType, waveProgress, countdown, results,
  setMagnitude, setSelectedUnitType, startSimulation, resetSimulation, handleMapClick, onReturnToMenu, GAME_STATES
}: any) => {

  const showLiquefactionAlert = waveProgress > 0.5 && gameState === GAME_STATES.PROPAGATING;

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 overflow-hidden selection:bg-amber-500/30">
      
      <MapLibreContainer
        epicenter={epicenter} units={units} waveProgress={waveProgress}
        gameState={gameState} onMapClick={handleMapClick} selectedUnitType={selectedUnitType}
      />

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

      {/* Back Button */}
      <div className="absolute bottom-6 left-6 z-20">
        <button onClick={onReturnToMenu} className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-100 rounded-lg border border-slate-700 shadow-lg backdrop-blur-md font-medium text-sm transition-all">
          <ArrowLeft className="w-4 h-4" /> Exit Sandbox
        </button>
      </div>

      {showLiquefactionAlert && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="absolute top-28 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-red-500/90 backdrop-blur-md text-white rounded-lg px-6 py-3 shadow-2xl flex items-center gap-3 border border-red-400">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <div>
              <p className="font-semibold text-sm tracking-wide uppercase">High Risk: Liquefaction Zone</p>
              <p className="text-xs text-red-100">Critical infrastructure at risk</p>
            </div>
          </div>
        </motion.div>
      )}

      {gameState === GAME_STATES.RESULTS && results && (
        <ResultsScreen results={results} onReset={resetSimulation} />
      )}
    </div>
  );
};