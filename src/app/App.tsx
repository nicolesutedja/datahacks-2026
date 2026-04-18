import { useCallback } from 'react';
import { motion } from 'motion/react';
import { useGameManager } from '../hooks/useGameManager';
import { MapLibreContainer } from '../components/Map/MapLibreContainer';
import { TopBar } from '../components/HUD/TopBar';
import { Sidebar } from '../components/HUD/Sidebar';
import { ResourceDock } from '../components/HUD/ResourceDock';
import { ResultsScreen } from '../components/Modals/ResultsScreen';
import { TasksPanel } from '../components/HUD/TasksPanel';
import { AlertTriangle } from 'lucide-react';

export default function App() {
  const {
    gameState,
    epicenter,
    magnitude,
    units,
    selectedUnitType,
    waveProgress,
    countdown,
    results,
    setMagnitude,
    setSelectedUnitType,
    startSimulation,
    resetSimulation,
    placeEpicenter,
    deployUnit,
    GAME_STATES
  } = useGameManager();

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (gameState === GAME_STATES.SETUP && !epicenter) {
      placeEpicenter(lat, lng);
    } else if (selectedUnitType && (gameState === GAME_STATES.SETUP || gameState === GAME_STATES.PROPAGATING)) {
      deployUnit(lat, lng);
    }
  }, [gameState, epicenter, selectedUnitType, placeEpicenter, deployUnit, GAME_STATES]);

  // High risk alert when wave reaches 50% radius
  const showLiquefactionAlert = waveProgress > 0.5 && gameState === GAME_STATES.PROPAGATING;

  return (
    <div className="relative w-full h-screen bg-slate-50 overflow-hidden">
      {/* Map Container */}
      <MapLibreContainer
        epicenter={epicenter}
        units={units}
        waveProgress={waveProgress}
        gameState={gameState}
        onMapClick={handleMapClick}
        selectedUnitType={selectedUnitType}
      />

      {/* HUD Overlays */}
      <TopBar
        gameState={gameState}
        countdown={countdown}
        magnitude={magnitude}
      />

      <Sidebar
        gameState={gameState}
        magnitude={magnitude}
        panicMode={false}
        epicenter={epicenter}
        onMagnitudeChange={setMagnitude}
        onPanicModeToggle={() => {}}
        onStart={startSimulation}
        onReset={resetSimulation}
      />

      <ResourceDock
        units={units}
        selectedUnitType={selectedUnitType}
        gameState={gameState}
        onSelectUnit={setSelectedUnitType}
      />

      {/* Tasks Panel */}
      <TasksPanel
        gameState={gameState}
        magnitude={magnitude}
        unitsDeployed={units.length}
        epicenterSet={!!epicenter}
      />

      {/* High Risk Alert */}
      {showLiquefactionAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-24 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="bg-red-500 text-white rounded-lg px-6 py-3 shadow-xl flex items-center gap-3 border border-red-600">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="font-semibold text-sm">
                High Risk: Liquefaction Zone
              </p>
              <p className="text-xs text-red-100">
                Critical infrastructure at risk
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results Modal */}
      {gameState === GAME_STATES.RESULTS && results && (
        <ResultsScreen results={results} onReset={resetSimulation} />
      )}
    </div>
  );
}