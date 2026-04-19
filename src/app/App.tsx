import { useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

import { useGameManager } from '../hooks/useGameManager';
import { MapboxContainer } from '../components/Map/MapBoxContainer';
import { TopBar } from '../components/HUD/TopBar';
import { Sidebar } from '../components/HUD/Sidebar';
import { ResourceDock } from '../components/HUD/ResourceDock';
import { ResultsScreen } from '../components/Modals/ResultsScreen';
import { TasksPanel } from '../components/HUD/TasksPanel';
import { LandingPage } from '../components/HUD/LandingPage';

interface SimulationOutput {
  waveform: number[][];
  max_amplitude: number;
  pgv: number[];
}

const buildFallbackWaveform = (receiverCount = 16, frameCount = 600): number[][] => {
  return Array.from({ length: receiverCount }, (_, receiverIndex) => {
    const phaseOffset = receiverIndex * 0.45;
    const attenuation = 1 - receiverIndex * 0.035;

    return Array.from({ length: frameCount }, (_, frameIndex) => {
      const t = frameIndex / frameCount;
      const envelope = Math.exp(-3.2 * t);
      const primary = Math.sin((t * 24 + phaseOffset) * Math.PI * 2);
      const secondary = 0.45 * Math.sin((t * 42 + phaseOffset * 0.7) * Math.PI * 2);
      return (primary + secondary) * 0.018 * attenuation * envelope;
    });
  });
};

const computeMaxAmplitude = (waveform: number[][]): number => {
  return waveform.reduce((globalMax, receiverWave) => {
    const receiverMax = receiverWave.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
    return Math.max(globalMax, receiverMax);
  }, 0);
};

const computePgv = (waveform: number[][]): number[] => {
  return waveform.map((receiverWave) =>
    receiverWave.reduce((max, value) => Math.max(max, Math.abs(value)), 0)
  );
};

export default function App() {
  const [appMode, setAppMode] = useState<'MENU' | 'GAME'>('MENU');
  const [mlData, setMlData] = useState<SimulationOutput | null>(null);

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
    GAME_STATES,
  } = useGameManager();

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (gameState === GAME_STATES.SETUP && !epicenter) {
        placeEpicenter(lat, lng);

        try {
          const response = await fetch(
            `http://localhost:8000/simulate?lat=${lat}&lng=${lng}&magnitude=${magnitude}`
          );

          if (!response.ok) {
            throw new Error('Backend response not OK');
          }

          const data = await response.json();

          const waveform: number[][] = Array.isArray(data.waveform)
            ? data.waveform
            : Array.isArray(data.wave)
              ? data.wave
              : buildFallbackWaveform();

          const maxAmplitude =
            typeof data.max_amplitude === 'number'
              ? data.max_amplitude
              : computeMaxAmplitude(waveform);

          const pgv =
            Array.isArray(data.pgv) && data.pgv.length > 0
              ? data.pgv
              : computePgv(waveform);

          setMlData({
            waveform,
            max_amplitude: maxAmplitude,
            pgv,
          });
        } catch (error) {
          console.error('Failed to fetch ML data:', error);

          const fallbackWaveform = buildFallbackWaveform();
          setMlData({
            waveform: fallbackWaveform,
            max_amplitude: computeMaxAmplitude(fallbackWaveform),
            pgv: computePgv(fallbackWaveform),
          });
        }
      } else if (
        selectedUnitType &&
        (gameState === GAME_STATES.SETUP || gameState === GAME_STATES.PROPAGATING)
      ) {
        deployUnit(lat, lng);
      }
    },
    [
      gameState,
      epicenter,
      selectedUnitType,
      placeEpicenter,
      deployUnit,
      GAME_STATES,
      magnitude,
    ]
  );

  const handleStartScenario = () => {
    resetSimulation();
    setMagnitude(6.8);
    setAppMode('GAME');
  };

  const handleStartSandbox = () => {
    resetSimulation();
    setMlData(null);
    setAppMode('GAME');
  };

  const handleReturnToMenu = () => {
    resetSimulation();
    setMlData(null);
    setAppMode('MENU');
  };

  const showLiquefactionAlert =
    waveProgress > 0.5 && gameState === GAME_STATES.PROPAGATING;

  if (appMode === 'MENU') {
    return (
      <LandingPage
        onStartScenario={handleStartScenario}
        onSandboxMode={handleStartSandbox}
      />
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <MapboxContainer
        epicenter={epicenter}
        units={units}
        waveProgress={waveProgress}
        gameState={gameState}
        onMapClick={handleMapClick}
        selectedUnitType={selectedUnitType}
        simulationOutput={mlData}
        onZoneClick={() => {}}
      />

      <TopBar
        gameState={gameState}
        countdown={countdown}
        magnitude={magnitude}
      />

      <Sidebar
        gameState={gameState}
        magnitude={magnitude}
        panicMode={gameState === GAME_STATES.PROPAGATING}
        epicenter={epicenter}
        onMagnitudeChange={setMagnitude}
        onPanicModeToggle={() => {}}
        onStart={startSimulation}
        onReset={handleReturnToMenu}
      />

      <div className="pointer-events-none absolute left-6 top-28 z-20">
        <TasksPanel
          gameState={gameState}
          magnitude={magnitude}
          unitsDeployed={units.length}
          epicenterSet={Boolean(epicenter)}
        />
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex justify-center">
        <ResourceDock
          units={units}
          selectedUnitType={selectedUnitType}
          gameState={gameState}
          onSelectUnit={setSelectedUnitType}
        />
      </div>

      {showLiquefactionAlert && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute right-6 top-24 z-30 flex items-start gap-3 border border-red-500/40 bg-red-950/85 px-4 py-3 text-red-100 shadow-[0_0_20px_rgba(220,38,38,0.25)] backdrop-blur-md"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-400" />
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em]">
              High Risk: Liquefaction Zone
            </div>
            <div className="mt-1 text-xs text-red-200/80">
              Critical infrastructure at risk
            </div>
          </div>
        </motion.div>
      )}

      {gameState === GAME_STATES.RESULTS && results && (
        <ResultsScreen
          results={results}
          onReset={handleReturnToMenu}
        />
      )}
    </div>
  );
}