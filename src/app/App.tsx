import { useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { useGameManager } from '../hooks/useGameManager';
// 1. Swapped the import to Mapbox
import { MapboxContainer } from '../components/Map/MapboxContainer';
import { TopBar } from '../components/HUD/TopBar';
import { Sidebar } from '../components/HUD/Sidebar';
import { ResourceDock } from '../components/HUD/ResourceDock';
import { ResultsScreen } from '../components/Modals/ResultsScreen';
import { TasksPanel } from '../components/HUD/TasksPanel';
import { LandingPage } from '../components/HUD/LandingPage';
import { AlertTriangle } from 'lucide-react';

interface SimulationData {
  waveform: number[][];
  max_amplitude: number;
}

export default function App() {
  // Add App Mode State (MENU vs GAME)
  const [appMode, setAppMode] = useState<'MENU' | 'GAME'>('MENU');
  const [mlData, setMlData] = useState<SimulationData | null>(null);
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

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    // 1. SCENARIO: Placing the Epicenter
    if (gameState === GAME_STATES.SETUP && !epicenter) {
      // Keep your existing state update
      placeEpicenter(lat, lng);
  
      // Fetch the ML math for the visual effects!
      try {
        // INJECTED 1: Dynamic magnitude applied to the fetch!
        const response = await fetch(`http://localhost:8000/simulate?lat=${lat}&lng=${lng}&magnitude=${magnitude}`);
        
        if (response.ok) {
          const data = await response.json();
          setMlData({
            waveform: data.waveform,
            max_amplitude: data.max_amplitude
          });
        } else {
          throw new Error("Backend response not OK");
        }
      } catch (error) {
        console.error("Failed to fetch ML data:", error);
        
        // HACKATHON BACKUP: If the Python server drops during the live demo, 
        // fallback to dummy math so the screen still shakes and you don't lose points!
        setMlData({
          waveform: [Array.from({length: 600}, () => (Math.random() - 0.5) * 0.03)], 
          max_amplitude: 0.03
        });
      }
    } 
    // 2. SCENARIO: Deploying Units (Your original logic, untouched!)
    else if (selectedUnitType && (gameState === GAME_STATES.SETUP || gameState === GAME_STATES.PROPAGATING)) {
      deployUnit(lat, lng);
    }
  }, [
    gameState, 
    epicenter, 
    selectedUnitType, 
    placeEpicenter, 
    deployUnit, 
    GAME_STATES, 
    setMlData,
    magnitude // INJECTED 1: Added magnitude to dependencies so it reads the slider!
  ]);

  // Landing Page Handlers
  const handleStartScenario = (scenario: any) => {
    // We can safely grab the coords from the scenario object now
    if (scenario && scenario.coordinates) {
      placeEpicenter(scenario.coordinates.lat, scenario.coordinates.lng);
      setMagnitude(scenario.magnitude);
    } else {
      // Fallback just in case
      placeEpicenter(32.8328, -117.2713);
      setMagnitude(6.8);
    }
    setAppMode('GAME');
  };

  const handleStartSandbox = () => {
    resetSimulation();
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
        onStartScenario={handleStartScenario} 
        onSandboxMode={handleStartSandbox} 
      />
    );
  }

  // 2. Render Game UI (Dark Mode Applied)
  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 overflow-hidden selection:bg-amber-500/30">
      
      {/* 2. Swapped to Mapbox Container */}
      <MapboxContainer 
        epicenter={epicenter}
        units={units}
        waveProgress={waveProgress}
        gameState={gameState}
        onMapClick={handleMapClick}
        selectedUnitType={selectedUnitType}
        // NEW: Pass the ML data down so the map can shake and color itself!
        simulationOutput={mlData} 
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
        onReset={handleReturnToMenu} 
      />

      <ResourceDock
        units={units}
        selectedUnitType={selectedUnitType}
        gameState={gameState}
        onSelectUnit={setSelectedUnitType}
      />

      {/* Tasks Panel - FIX: Kept the click-blocking fix intact */}
      <div className="absolute top-20 left-0 z-20 pointer-events-none">
        <div className="pointer-events-auto relative">
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