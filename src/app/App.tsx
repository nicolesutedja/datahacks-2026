import { useCallback, useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react'; // Import icons for your mute button
import { motion } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import rumbleSound from './11labs-earthquake-sound.mp3';
import { useGameManager } from '../hooks/useGameManager';
import { MapboxContainer } from '../components/Map/MapBoxContainer';
import { TopBar } from '../components/HUD/TopBar';
import { Sidebar } from '../components/HUD/Sidebar';
import { ResourceDock } from '../components/HUD/ResourceDock';
import { ResultsScreen } from '../components/HUD/ResultsScreen';
import { TasksPanel } from '../components/HUD/TasksPanel';
import { LandingPage } from '../components/HUD/LandingPage';
import bgMusicFile from './seismic-bgmusic.mp3';

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
  const [isSfxMuted, setIsSfxMuted] = useState(false); // Added SFX state
  
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // This is your rumble sound

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
           console.log("Audio autoplay successful");
        }
      } catch (err) {
        console.log("Autoplay blocked. Waiting for user interaction.", err);
      }
    };

    startMusic();
// --- NEW: The "First Interaction" Unlocker ---
    // This catches the very first click anywhere on the page and starts the music.
    const unlockAudio = () => {
      // We check the ref's muted property because it stays up to date in this closure
      if (bgMusicRef.current && bgMusicRef.current.paused && !bgMusicRef.current.muted) {
        bgMusicRef.current.play().catch(() => {});
      }
      // Once the audio is unlocked, clean up the listeners so they don't fire every click
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };

    // Listen for any click or keypress
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // 2. Handle Music Toggling
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

  // 3. Handle SFX Toggling (Rumble)
  const toggleSfx = () => {
    setIsSfxMuted(!isSfxMuted);
  };

  // Apply SFX Mute State to the Rumble
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.muted = isSfxMuted;
    }
  }, [isSfxMuted]);

  // Helper to ensure music is playing when entering the game
  const ensureMusicPlaying = () => {
    if (bgMusicRef.current && bgMusicRef.current.paused && !isMusicMuted) {
        bgMusicRef.current.play().catch(() => {});
    }
  }

  // Initialize Rumble Sound
  useEffect(() => {
    audioRef.current = new Audio(rumbleSound);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.6;
    audioRef.current.muted = isSfxMuted; // Set initial mute state
  }, []);

  // Manage Rumble Playback based on Game State
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (gameState === GAME_STATES.PROPAGATING) {
      audio.currentTime = 0;
      audio.play().catch(() => console.log("Audio blocked"));
    } else if (gameState === GAME_STATES.RESULTS) {
      audio.pause();
      setShowResultsModal(true);
    } else {
      audio.pause();
    }
  }, [gameState, GAME_STATES]);

  const handleRegionInsightClick = useCallback(async (lat: number, lng: number) => {
    const apiBase = import.meta.env.VITE_SEISMIC_API_URL?.trim() || 'http://localhost:8000';
    try {
      setRegionInsightLoading(true);
      setShowRegionPopup(true);
      const response = await fetch(`${apiBase}/region-insight?lat=${lat}&lng=${lng}`);
      const data = await response.json();
      setRegionInsight(data);
    } catch (error) {
      setRegionInsight({
        regionName: 'Data Error',
        soilSummary: 'Geologic feed interrupted.',
        populationDensity: 'Unknown',
        earthquakeHazards: ['Seismic noise detected'],
        recommendedAction: 'Re-scan sector.',
      });
    } finally {
      setRegionInsightLoading(false);
    }
  }, []);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    if (gameState === GAME_STATES.SETUP && !epicenter) {
      placeEpicenter(lat, lng);
      const apiBase = import.meta.env.VITE_SEISMIC_API_URL?.trim() || 'http://localhost:8000';
      try {
        const response = await fetch(`${apiBase}/simulate?lat=${lat}&lng=${lng}&magnitude=${magnitude}`);
        const data = await response.json();
        if (data.waveform) {
          setMlData({
            waveform: data.waveform,
            max_amplitude: data.max_amplitude ?? 0.02,
            pgv: data.adjusted_pgv ?? data.pgv,
            risk_classes: data.risk_classes,
            confidence: data.confidence
          });
        }
      } catch (error) {
        console.error('ML fetch failed', error);
      }
    } else if (selectedUnitType && (gameState === GAME_STATES.SETUP || gameState === GAME_STATES.PROPAGATING)) {
      deployUnit(lat, lng);
    }
  }, [gameState, epicenter, selectedUnitType, placeEpicenter, deployUnit, GAME_STATES, magnitude]);

  const handleStartScenario = async () => {
    ensureMusicPlaying();
    setGameSubtype('SCENARIO');
    resetSimulation();
    setAppMode('GAME');
    
    const lat = 34.05 + (Math.random() - 0.5) * 0.3;
    const lng = -118.25 + (Math.random() - 0.5) * 0.3;
    const mag = Number((5.5 + Math.random() * 3).toFixed(1));
    
    placeEpicenter(lat, lng);
    setMagnitude(mag);
    startSimulation();
  };

  const handleStartSandbox = () => {
    ensureMusicPlaying();
    setGameSubtype('SANDBOX');
    resetSimulation();
    setMlData(null);
    setAppMode('GAME');
  };

  const handleReturnToMenu = () => {
    setGameSubtype(null);
    resetSimulation();
    setAppMode('MENU');
    setShowResultsModal(false);
  };

  const handleResetSimulation = () => {
    resetSimulation();
    setMlData(null);
    setShowResultsModal(false);
  };

  // Render Landing Page and pass audio props
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
        
      {/* Global Mute Toggle is still here for in-game convenience if you want it, 
          otherwise you can remove this block if you only want to control it via settings menu */}
      <button
        onClick={toggleMusic}
        className="pointer-events-auto absolute bottom-6 left-6 z-50 flex h-10 w-10 items-center justify-center border border-zinc-800 bg-black/80 text-zinc-400 backdrop-blur-md transition-all hover:border-cyan-500 hover:text-cyan-400"
      >
        {isMusicMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
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

      {showRegionPopup && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="pointer-events-auto absolute right-85 top-24 z-40 w-80 border-l-2 border-cyan-500 bg-zinc-950/90 backdrop-blur-xl shadow-2xl"
        >
          <div className="p-4">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">Intelligence Feed</div>
                <div className="mt-1 text-lg font-bold text-zinc-100 uppercase italic">
                  {regionInsightLoading ? 'Analyzing...' : (regionInsight?.regionName || 'Sector Data')}
                </div>
              </div>
              <button onClick={() => setShowRegionPopup(false)} className="text-zinc-500 hover:text-cyan-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            {!regionInsightLoading && regionInsight && (
              <div className="space-y-4 text-[12px]">
                <section>
                  <div className="text-[10px] font-bold text-cyan-500/70 uppercase">Lithology</div>
                  <div className="text-zinc-300">{regionInsight.soilSummary}</div>
                </section>
                <div className="grid grid-cols-2 gap-4 border-y border-zinc-800 py-3">
                  <div>
                    <div className="text-[10px] font-bold text-cyan-500/70">DENSITY</div>
                    <div className="text-zinc-100">{regionInsight.populationDensity}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-cyan-500/70">RISK</div>
                    <div className="text-zinc-100">{regionInsight.earthquakeHazards[0]}</div>
                  </div>
                </div>
                <section className="bg-cyan-500/5 p-2 border border-cyan-500/10">
                  <div className="text-[10px] font-bold text-cyan-400">ADVISORY</div>
                  <div className="italic text-cyan-100/90">"{regionInsight.recommendedAction}"</div>
                </section>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {gameState === GAME_STATES.RESULTS && results && showResultsModal && (
        <ResultsScreen results={results} onReset={handleReturnToMenu} onResetSimulation={handleResetSimulation} onViewSimulation={() => setShowResultsModal(false)} />
      )}
    </div>
  );
}