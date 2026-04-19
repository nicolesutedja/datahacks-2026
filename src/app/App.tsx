import { useCallback, useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import rumbleSound from './rumble.wav';
import { useGameManager } from '../hooks/useGameManager';
import { MapboxContainer } from '../components/Map/MapBoxContainer';
import { TopBar } from '../components/HUD/TopBar';
import { Sidebar } from '../components/HUD/Sidebar';
import { ResourceDock } from '../components/HUD/ResourceDock';
import { ResultsScreen } from '../components/HUD/ResultsScreen';
import { TasksPanel } from '../components/HUD/TasksPanel';
import { LandingPage } from '../components/HUD/LandingPage';


interface SimulationOutput {
  waveform: number[][];
  max_amplitude: number;
  pgv: number[];
}

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

const isValidWaveform = (waveform: unknown): waveform is number[][] => {
  return (
    Array.isArray(waveform) &&
    waveform.length > 0 &&
    waveform.every(
      (receiverWave) =>
        Array.isArray(receiverWave) &&
        receiverWave.length > 0 &&
        receiverWave.every(
          (value) => typeof value === 'number' && Number.isFinite(value)
        )
    )
  );
};

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
    GAME_STATES,
  } = useGameManager();

   const audioRef = useRef<HTMLAudioElement | null>(null);

// initialize once
useEffect(() => {
  audioRef.current = new Audio(rumbleSound);
  audioRef.current.loop = true;
  audioRef.current.volume = 0.6;
}, []);

  useEffect(() => {
   if (!audioRef.current) return;

  const audio = audioRef.current;

  if (gameState === GAME_STATES.PROPAGATING) {
    audio.currentTime = 0;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        console.log("Audio blocked until user interaction");
      });
    }
  } else if (gameState === GAME_STATES.RESULTS) {
    audio.pause();
    audio.currentTime = 0;
    setShowResultsModal(true);
  } else {
    audio.pause();
    audio.currentTime = 0;
  }
}, [gameState]);

  const [appMode, setAppMode] = useState<'MENU' | 'GAME'>('MENU');
  const [mlData, setMlData] = useState<SimulationOutput | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (gameState === GAME_STATES.SETUP && !epicenter) {
        placeEpicenter(lat, lng);

        const apiBase =
          import.meta.env.VITE_SEISMIC_API_URL?.trim() || 'http://localhost:8000';

        try {
          const response = await fetch(
            `${apiBase}/simulate?lat=${lat}&lng=${lng}&magnitude=${magnitude}`
          );

          if (!response.ok) {
            throw new Error(`Backend response not OK: ${response.status}`);
          }

          const data = await response.json();
          console.log('Seismic backend response:', data);

          const waveformCandidate =
            isValidWaveform(data.waveform)
              ? data.waveform
              : isValidWaveform(data.wave)
                ? data.wave
                : null;

          if (!waveformCandidate) {
            console.error('Invalid ML waveform payload:', data);
            setMlData(null);
            return;
          }

          const waveform = waveformCandidate;

          const maxAmplitude =
            typeof data.max_amplitude === 'number' && Number.isFinite(data.max_amplitude)
              ? data.max_amplitude
              : computeMaxAmplitude(waveform);

          const pgv =
            Array.isArray(data.pgv) &&
            data.pgv.length > 0 &&
            data.pgv.every((value: unknown) => typeof value === 'number' && Number.isFinite(value))
              ? data.pgv
              : computePgv(waveform);

          setMlData({
            waveform,
            max_amplitude: maxAmplitude,
            pgv,
          });
        } catch (error) {
          console.error('Failed to fetch ML data:', error);
          setMlData(null);
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
    setMlData(null);
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
    setShowResultsModal(false);
    setAppMode('MENU');
  };

  const handleViewSimulation = () => {
    setShowResultsModal(false);
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
        magnitude={magnitude}
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

      {gameState === GAME_STATES.RESULTS && results && showResultsModal && (
        <ResultsScreen
          results={results}
          onReset={handleReturnToMenu}
          onViewSimulation={handleViewSimulation}
        />
      )}

      {gameState === GAME_STATES.RESULTS && results && !showResultsModal && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto absolute bottom-6 right-6 z-30 flex flex-col gap-2"
        >
          <button
            onClick={() => setShowResultsModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider transition-all"
          >
            View Results
          </button>
          <button
            onClick={handleReturnToMenu}
            className="px-4 py-2 bg-black border border-red-500/50 hover:border-red-500 text-red-500 font-semibold text-xs uppercase tracking-wider transition-all"
          >
            Return to Menu
          </button>
        </motion.div>
      )}
    </div>
  );
}