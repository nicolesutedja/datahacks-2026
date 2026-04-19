import { useCallback, useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, X, Volume2, VolumeX } from 'lucide-react';
import rumbleSound from './11labs-earthquake-sound.mp3';
import bgMusicFile from './seismic-bgmusic.mp3'; // <-- Your music file
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
  risk_classes?: string[];
  confidence?: string;
}

interface RegionInsight {
  regionName: string;
  soilSummary: string;
  populationDensity: string;
  earthquakeHazards: string[];
  recommendedAction: string;
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

  // --- UI & Mode State ---
  const [appMode, setAppMode] = useState<'MENU' | 'GAME'>('MENU');
  const [gameSubtype, setGameSubtype] = useState<'SCENARIO' | 'SANDBOX' | null>(null);
  const [mlData, setMlData] = useState<SimulationOutput | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [regionInsight, setRegionInsight] = useState<RegionInsight | null>(null);
  const [showRegionPopup, setShowRegionPopup] = useState(false);
  const [regionInsightLoading, setRegionInsightLoading] = useState(false);

  // --- Audio State ---
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(false);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Initialize Background Music and attempt Autoplay
  useEffect(() => {
    if (!bgMusicRef.current) {
      bgMusicRef.current = new Audio(bgMusicFile);
      bgMusicRef.current.loop = true;
      bgMusicRef.current.volume = 0.3;
    }

    const startMusic = async () => {
      try {
        if (bgMusicRef.current && bgMusicRef.current.paused && !isMusicMuted) {
           await bgMusicRef.current.play();
        }
      } catch (err) {
        console.log("Autoplay blocked. Waiting for first user interaction.", err);
      }
    };

    startMusic();

    const unlockAudio = () => {
      if (bgMusicRef.current && bgMusicRef.current.paused && !bgMusicRef.current.muted) {
        bgMusicRef.current.play().catch(() => {});
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    return () => {
      if (bgMusicRef.current) bgMusicRef.current.pause();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []); 

  // 2. Audio Control Helpers
  const toggleMusic = () => {
    if (bgMusicRef.current) {
      if (isMusicMuted) {
        bgMusicRef.current.play().catch(e => console.error(e));
        bgMusicRef.current.muted = false;
      } else {
        bgMusicRef.current.muted = true;
      }
      setIsMusicMuted(!isMusicMuted);
    }
  };

  const toggleSfx = () => setIsSfxMuted(!isSfxMuted);

  const ensureMusicPlaying = () => {
    if (bgMusicRef.current && bgMusicRef.current.paused && !isMusicMuted) {
        bgMusicRef.current.play().catch(() => {});
    }
  };

  // 3. Initialize Rumble Sound
  useEffect(() => {
    audioRef.current = new Audio(rumbleSound);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.6;
  }, []);

  // Sync SFX state with rumble
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isSfxMuted;
    }
  }, [isSfxMuted]);

  // Manage Rumble Playback based on Game State
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (gameState === GAME_STATES.PROPAGATING) {
      audio.currentTime = 0;
      audio.play().catch(() => console.log("Audio blocked until user interaction"));
    } else if (gameState === GAME_STATES.RESULTS) {
      audio.pause();
      audio.currentTime = 0;
      setShowResultsModal(true);
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [gameState, GAME_STATES]);

  const handleRegionInsightClick = useCallback(
    async (lat: number, lng: number) => {
      const apiBase = import.meta.env.VITE_SEISMIC_API_URL?.trim() || 'http://localhost:8000';

      try {
        setRegionInsightLoading(true);
        setShowRegionPopup(true);

        const response = await fetch(`${apiBase}/region-insight?lat=${lat}&lng=${lng}`);

        if (!response.ok) {
          throw new Error(`Region insight response not OK: ${response.status}`);
        }

        const data = await response.json();
        setRegionInsight(data);
      } catch (error) {
        console.error('Failed to fetch region insight:', error);
        setRegionInsight({
          regionName: 'Region Insight Unavailable',
          soilSummary: 'Could not fetch region insight for this location.',
          populationDensity: 'Unknown',
          earthquakeHazards: ['ground shaking'],
          recommendedAction: 'Try again or check backend logs.',
        });
      } finally {
        setRegionInsightLoading(false);
      }
    },
    []
  );

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (gameState === GAME_STATES.SETUP && !epicenter) {
        placeEpicenter(lat, lng);
        const apiBase = import.meta.env.VITE_SEISMIC_API_URL?.trim() || 'http://localhost:8000';

        try {
          const response = await fetch(`${apiBase}/simulate?lat=${lat}&lng=${lng}&magnitude=${magnitude}`);

          if (!response.ok) throw new Error(`Backend response not OK: ${response.status}`);

          const data = await response.json();

          if (!data.waveform || data.waveform.length === 0) {
            setMlData(null);
            return;
          }

          setMlData({
            waveform: data.waveform,
            max_amplitude: data.max_amplitude ?? 0.02,
            pgv: data.adjusted_pgv ?? data.pgv,
            risk_classes: data.risk_classes,
            confidence: data.confidence
          });

        } catch (error) {
          console.error('Failed to fetch ML data:', error);
          setMlData(null);
        }
      } else if (selectedUnitType && (gameState === GAME_STATES.SETUP || gameState === GAME_STATES.PROPAGATING)) {
        deployUnit(lat, lng);
      }
    },
    [gameState, epicenter, selectedUnitType, placeEpicenter, deployUnit, GAME_STATES, magnitude]
  );

  const handleStartScenario = async () => {
    ensureMusicPlaying();
    resetSimulation();
    setMlData(null);
    setRegionInsight(null);
    setShowRegionPopup(false);
    setGameSubtype('SCENARIO');
    setAppMode('GAME');

    const SOCAL_POINTS = [
      { lat: 34.05, lng: -118.25 }, { lat: 32.72, lng: -117.16 },
      { lat: 34.42, lng: -119.70 }, { lat: 34.10, lng: -117.30 },
      { lat: 33.94, lng: -117.40 }, { lat: 34.28, lng: -118.44 },
      { lat: 33.68, lng: -117.82 }, { lat: 34.95, lng: -120.44 },
    ];

    const base = SOCAL_POINTS[Math.floor(Math.random() * SOCAL_POINTS.length)];
    const lat = base.lat + (Math.random() - 0.5) * 0.15;
    const lng = base.lng + (Math.random() - 0.5) * 0.15;
    const mag = Number((5 + Math.random() * 4).toFixed(1));

    placeEpicenter(lat, lng);
    setMagnitude(mag);

    const apiBase = import.meta.env.VITE_SEISMIC_API_URL?.trim() || 'http://localhost:8000';

    try {
      const response = await fetch(`${apiBase}/simulate?lat=${lat}&lng=${lng}&magnitude=${mag}`);
      const data = await response.json();

      if (!data.waveform || data.waveform.length === 0) {
        setMlData(null);
        return;
      }

      setMlData({
        waveform: data.waveform,
        max_amplitude: data.max_amplitude ?? 0.02,
        pgv: data.adjusted_pgv ?? data.pgv,
        risk_classes: data.risk_classes,
        confidence: data.confidence
      });

      startSimulation();
    } catch (err) {
      console.error("Random simulation failed:", err);
      setMlData(null);
    }
  };

  const handleStartSandbox = () => {
    ensureMusicPlaying();
    resetSimulation();
    setMlData(null);
    setRegionInsight(null);
    setShowRegionPopup(false);
    setGameSubtype('SANDBOX');
    setAppMode('GAME');
  };

  const handleReturnToMenu = () => {
    setGameSubtype(null);
    resetSimulation();
    setMlData(null);
    setRegionInsight(null);
    setShowRegionPopup(false);
    setShowResultsModal(false);
    setAppMode('MENU');
  };

  const handleViewSimulation = () => setShowResultsModal(false);

  const handleResetSimulation = () => {
    resetSimulation();
    setMlData(null);
    setRegionInsight(null);
    setShowRegionPopup(false);
    setShowResultsModal(false);
  };

  const showLiquefactionAlert = waveProgress > 0.5 && gameState === GAME_STATES.PROPAGATING;

  if (appMode === 'MENU') {
    return (
      <LandingPage
        onStartScenario={handleStartScenario}
        onSandboxMode={handleStartSandbox}
        isMusicMuted={isMusicMuted}
        toggleMusic={toggleMusic}
        isSfxMuted={isSfxMuted}
        toggleSfx={toggleSfx}
      />
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white font-mono">
      
      {/* Global Mute Toggle for convenience */}
      <button
        onClick={toggleMusic}
        className="pointer-events-auto absolute bottom-6 left-6 z-50 flex h-10 w-10 items-center justify-center border border-zinc-800 bg-black/80 text-zinc-400 backdrop-blur-md transition-all hover:border-cyan-500 hover:text-cyan-400"
      >
        {isMusicMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      <MapboxContainer
        epicenter={epicenter}
        units={units}
        waveProgress={waveProgress}
        magnitude={magnitude}
        gameState={gameState}
        onMapClick={handleMapClick}
        onRegionInsightClick={handleRegionInsightClick}
        selectedUnitType={selectedUnitType}
        simulationOutput={mlData}
        onZoneClick={() => {}}
      />

      <TopBar gameState={gameState} countdown={countdown} magnitude={magnitude} onReturnToMenu={handleReturnToMenu} />

      <Sidebar
        gameState={gameState}
        magnitude={magnitude}
        panicMode={gameState === GAME_STATES.PROPAGATING}
        epicenter={epicenter}
        onMagnitudeChange={gameSubtype === 'SCENARIO' ? undefined : setMagnitude}
        onPanicModeToggle={() => {}}
        onStart={startSimulation}
        onReset={handleResetSimulation}
      />

      <div className="absolute left-6 top-28 z-20">
        <TasksPanel gameState={gameState} magnitude={magnitude} unitsDeployed={units.length} epicenterSet={Boolean(epicenter)} />
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex justify-center">
        <ResourceDock units={units} selectedUnitType={selectedUnitType} gameState={gameState} onSelectUnit={setSelectedUnitType} />
      </div>

      {showLiquefactionAlert && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute right-6 top-24 z-30 flex items-start gap-3 border border-red-500/40 bg-red-950/85 px-4 py-3 text-red-100 shadow-[0_0_20px_rgba(220,38,38,0.25)] backdrop-blur-md"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-400" />
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em]">High Risk: Liquefaction Zone</div>
            <div className="mt-1 text-xs text-red-200/80">Critical infrastructure at risk</div>
          </div>
        </motion.div>
      )}

      {showRegionPopup && (
        <div className="pointer-events-auto absolute left-6 bottom-70 z-40 w-[24rem] border border-green-400/40 bg-black/90 p-4 shadow-[0_0_20px_rgba(34,211,238,0.15)] backdrop-blur-md">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-green-400/80">Region Analysis</div>
              <div className="mt-1 text-lg font-semibold text-green-500">
                {regionInsightLoading ? 'Loading...' : (regionInsight?.regionName ?? 'Region Insight')}
              </div>
            </div>
            <button onClick={() => setShowRegionPopup(false)} className="text-zinc-400 transition-colors hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {regionInsightLoading ? (
            <div className="text-sm text-zinc-300">Asking Gemini about this region...</div>
          ) : regionInsight ? (
            <div className="space-y-3 text-sm text-zinc-200">
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-green-500/70">Soil</div>
                <div>{regionInsight.soilSummary}</div>
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-green-500/70">Population Density</div>
                <div>{regionInsight.populationDensity}</div>
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-green-500/70">Earthquake Hazards</div>
                <ul className="list-disc pl-5 space-y-1">
                  {regionInsight.earthquakeHazards.map((hazard, idx) => (
                    <li key={`${hazard}-${idx}`}>{hazard}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-green-500/70">Recommended Action</div>
                <div>{regionInsight.recommendedAction}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-zinc-300">No region insight available.</div>
          )}
        </div>
      )}

      {gameState === GAME_STATES.RESULTS && results && showResultsModal && (
        <ResultsScreen
          results={results}
          onReset={handleReturnToMenu}
          onResetSimulation={handleResetSimulation}
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
            onClick={handleResetSimulation}
            className="px-4 py-2 bg-black border border-red-500/50 hover:border-red-500 text-red-500 font-semibold text-xs uppercase tracking-wider transition-all"
          >
            New Simulation
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