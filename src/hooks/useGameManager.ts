import { useState, useEffect, useCallback } from 'react';

const GAME_STATES = {
  SETUP: 'SETUP',
  PROPAGATING: 'PROPAGATING',
  RESULTS: 'RESULTS'
} as const;

type GameState = typeof GAME_STATES[keyof typeof GAME_STATES];

interface Position {
  lat: number;
  lng: number;
}

interface Unit {
  id: number;
  type: 'ambulance' | 'fire' | 'hospital';
  position: Position;
  status: 'DEPLOYING' | 'ACTIVE';
}

interface Results {
  livesSaved: number;
  resourceEfficiency: number;
  predictionAccuracy: number;
  magnitude: number;
  unitsDeployed: number;
}

export const useGameManager = () => {
  const [gameState, setGameState] = useState<GameState>(GAME_STATES.SETUP);
  const [epicenter, setEpicenter] = useState<Position | null>(null);
  const [magnitude, setMagnitude] = useState(6.5);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitType, setSelectedUnitType] = useState<Unit['type'] | null>(null);
  const [waveProgress, setWaveProgress] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [results, setResults] = useState<Results | null>(null);

  // Wave propagation timer (15 seconds)
  useEffect(() => {
    if (gameState === GAME_STATES.PROPAGATING) {
      const startTime = Date.now();
      const duration = 15000; // 15 seconds

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setWaveProgress(progress);
        setCountdown(Math.max(0, Math.ceil((duration - elapsed) / 1000)));

        if (progress >= 1) {
          clearInterval(interval);
          calculateResults();
          setGameState(GAME_STATES.RESULTS);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [gameState]);

  const calculateResults = useCallback(() => {
    // Scoring algorithm (placeholder for ML)
    const basePopulation = 50000;
    const magnitudeFactor = Math.pow(magnitude - 4, 2) / 25;
    const unitBonus = units.length * 0.15;

    const livesSaved = Math.floor(
      basePopulation * magnitudeFactor * (0.3 + unitBonus)
    );

    const resourceEfficiency = Math.min(
      100,
      Math.floor((units.length / 5) * 100 + Math.random() * 20)
    );

    const predictionAccuracy = Math.floor(75 + Math.random() * 20);

    setResults({
      livesSaved,
      resourceEfficiency,
      predictionAccuracy,
      magnitude,
      unitsDeployed: units.length
    });
  }, [magnitude, units]);

  const startSimulation = useCallback(() => {
    if (!epicenter) return;
  
    setGameState(GAME_STATES.PROPAGATING);
    setWaveProgress(0);
  
    // 🔥 magnitude-dependent duration
    const duration =
      magnitude < 5 ? 10 :
      magnitude < 6 ? 12 :
      magnitude < 7 ? 15 :
      magnitude < 8 ? 18 : 22;
  
    setCountdown(duration);
  }, [epicenter, magnitude]);

  
  const resetSimulation = useCallback(() => {
    setGameState(GAME_STATES.SETUP);
    setEpicenter(null);
    setUnits([]);
    setWaveProgress(0);
    setCountdown(null);
    setResults(null);
    setSelectedUnitType(null);
  }, []);

  const placeEpicenter = useCallback((lat: number, lng: number) => {
    if (gameState !== GAME_STATES.SETUP) return;
    setEpicenter({ lat, lng });
  }, [gameState]);

  const deployUnit = useCallback((lat: number, lng: number) => {
    if (!selectedUnitType || units.length >= 5) return;

    const newUnit: Unit = {
      id: Date.now(),
      type: selectedUnitType,
      position: { lat, lng },
      status: 'DEPLOYING'
    };

    setUnits(prev => [...prev, newUnit]);
    setSelectedUnitType(null);

    // Simulate deployment time
    setTimeout(() => {
      setUnits(prev => prev.map(u =>
        u.id === newUnit.id ? { ...u, status: 'ACTIVE' } : u
      ));
    }, 2000);
  }, [selectedUnitType, units.length]);

  return {
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
  };
};
