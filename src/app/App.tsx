import { useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { useGameManager } from '../hooks/useGameManager';
import { MapLibreContainer } from '../components/Map/MapLibreContainer';
import { TopBar } from '../components/HUD/TopBar';
import { Sidebar } from '../components/HUD/Sidebar';
import { ResourceDock } from '../components/HUD/ResourceDock';
import { ResultsScreen } from '../components/Modals/ResultsScreen';
import { TasksPanel } from '../components/HUD/TasksPanel';
import { LandingPage } from '../components/HUD/LandingPage';
import { AlertTriangle } from 'lucide-react';

export default function App() {
  // Add App Mode State (MENU vs GAME)
  const [appMode, setAppMode] = useState<'MENU' | 'GAME'>('MENU');

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

  // Landing Page Handlers
  const handleStartScenario = (scenario: any) => {
    placeEpicenter(scenario.coordinates.lat, scenario.coordinates.lng);
    setMagnitude(scenario.magnitude);
    setAppMode('GAME');
  };

  const handleStartSandbox = () => {
    setAppMode('GAME');
  };

  const handleReturnToMenu = () => {
    resetSimulation();
    setAppMode('MENU');
  };

  // High risk alert when wave reaches 50% radius
  const showLiquefactionAlert = waveProgress > 0.5 && gameState === GAME_STATES.PROPAGATING;

  // 1. Render Landing Page if in MENU mode
  if (appMode === 'MENU') {
    return (
      <LandingPage 
        onSelectScenario={handleStartScenario} 
        onSandboxMode={handleStartSandbox} 
      />
    );
  }

  // 2. Render Game UI (Dark Mode Applied)
  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 overflow-hidden selection:bg-amber-500/30">
      
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
        onReset={handleReturnToMenu} // Returns to main menu instead of just resetting map
      />

      <ResourceDock
        units={units}
        selectedUnitType={selectedUnitType}
        gameState={gameState}
        onSelectUnit={setSelectedUnitType}
      />

      {/* Tasks Panel - Wrapped in a positioning div to push it below the TopBar */}
      <div className="absolute top-20 left-0 z-20 pointer-events-none w-full h-full">
        <div className="pointer-events-auto relative w-full h-full">
          <TasksPanel
            gameState={gameState}
            magnitude={magnitude}
            unitsDeployed={units.length}
            epicenterSet={!!epicenter}
          />
        </div>
      </div>

      {/* Map Controls Hint (Visible only during setup) */}
      {gameState === GAME_STATES.SETUP && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-32 right-80 mr-6 z-10 bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-400 pointer-events-none"
        >
          Right-Click + Drag map to tilt/rotate
        </motion.div>
      )}

      {/* High Risk Alert */}
      {showLiquefactionAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-28 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="bg-red-500/90 backdrop-blur-md text-white rounded-lg px-6 py-3 shadow-2xl flex items-center gap-3 border border-red-400">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <div>
              <p className="font-semibold text-sm tracking-wide uppercase">
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
        <ResultsScreen results={results} onReset={handleReturnToMenu} />
      )}
    </div>
  );
}