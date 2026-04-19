import { useState, useEffect, useCallback } from 'react';

export const GAME_STATES = {
  SETUP: 'SETUP',
  PROPAGATING: 'PROPAGATING',
  RESULTS: 'RESULTS',
} as const;

type GameState = typeof GAME_STATES[keyof typeof GAME_STATES];

interface Position {
  lat: number;
  lng: number;
}

export interface Unit {
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
  fundsRemaining: number;
  budgetUsedPercent: number;
  readinessScore: number;
  coverageScore: number;
  recommendations: string[];
}

const TOTAL_BUDGET = 10000000;
const MAX_UNITS = 5;

const UNIT_COSTS = {
  ambulance: 1500000,
  fire: 2000000,
  hospital: 3000000,
} as const;

export const useGameManager = () => {
  const [gameState, setGameState] = useState<GameState>(GAME_STATES.SETUP);
  const [epicenter, setEpicenter] = useState<Position | null>(null);
  const [magnitude, setMagnitude] = useState(6.5);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitType, setSelectedUnitType] = useState<Unit['type'] | null>(null);
  const [waveProgress, setWaveProgress] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [results, setResults] = useState<Results | null>(null);

  const spentBudget = units.reduce((sum, unit) => sum + UNIT_COSTS[unit.type], 0);
  const currentFunds = Math.max(0, TOTAL_BUDGET - spentBudget);

  useEffect(() => {
    if (gameState === GAME_STATES.PROPAGATING) {
      const startTime = Date.now();
      const duration = 15000;

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
    const ambulanceCount = units.filter((u) => u.type === 'ambulance').length;
    const fireCount = units.filter((u) => u.type === 'fire').length;
    const hospitalCount = units.filter((u) => u.type === 'hospital').length;
    const uniqueTypes = new Set(units.map((u) => u.type)).size;

    const severityFactor = Math.max(0.45, Math.min(1.25, (magnitude - 4.5) / 3.2));
    const deploymentScore = Math.min(100, Math.round((units.length / MAX_UNITS) * 55));
    const mixScore = Math.min(
      100,
      ambulanceCount * 18 + fireCount * 18 + hospitalCount * 22 + uniqueTypes * 8
    );

    const coverageScore = Math.min(
      100,
      Math.round(deploymentScore * 0.55 + mixScore * 0.45)
    );

    const budgetUsedPercent = Math.round((spentBudget / TOTAL_BUDGET) * 100);
    const budgetBalanceScore = Math.max(50, 100 - Math.abs(budgetUsedPercent - 70));
    const readinessScore = Math.min(
      100,
      Math.round(
        (epicenter ? 28 : 0) +
          Math.min(32, units.length * 8) +
          Math.min(22, uniqueTypes * 7) +
          Math.round(budgetBalanceScore * 0.18)
      )
    );

    const resourceEfficiency = Math.min(
      100,
      Math.round(coverageScore * 0.45 + readinessScore * 0.35 + budgetBalanceScore * 0.2)
    );

    const predictionAccuracy = Math.min(
      100,
      Math.round(62 + coverageScore * 0.16 + readinessScore * 0.18 - magnitude * 1.2)
    );

    const baseExposure = Math.round(18000 + magnitude * 6500);
    const mitigationFactor = 0.18 + coverageScore / 160 + readinessScore / 220;
    const livesSaved = Math.max(
      0,
      Math.round(baseExposure * severityFactor * Math.min(0.95, mitigationFactor))
    );

    const recommendations: string[] = [];

    if (units.length < 3) {
      recommendations.push('Deploy more assets before starting the wave phase.');
    }
    if (ambulanceCount === 0) {
      recommendations.push('No medical response unit was deployed - add at least one ambulance.');
    }
    if (hospitalCount === 0 && magnitude >= 6.8) {
      recommendations.push('Higher-magnitude events benefit from a field hospital for surge capacity.');
    }
    if (uniqueTypes < 2) {
      recommendations.push('Diversify asset types to improve coverage and resilience.');
    }
    if (budgetUsedPercent < 35) {
      recommendations.push('You finished with too much unused budget - convert more funds into readiness.');
    }
    if (budgetUsedPercent > 90) {
      recommendations.push('Budget usage was too aggressive - leave reserve capacity for balance.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Strong deployment balance - your coverage and budget discipline were both solid.');
    }

    setResults({
      livesSaved,
      resourceEfficiency,
      predictionAccuracy,
      magnitude,
      unitsDeployed: units.length,
      fundsRemaining: currentFunds,
      budgetUsedPercent,
      readinessScore,
      coverageScore,
      recommendations,
    });
  }, [currentFunds, epicenter, magnitude, spentBudget, units]);

  const startSimulation = useCallback(() => {
    if (!epicenter) return;
    setGameState(GAME_STATES.PROPAGATING);
    setWaveProgress(0);

    const duration =
      magnitude < 5 ? 10 : magnitude < 6 ? 12 : magnitude < 7 ? 15 : magnitude < 8 ? 18 : 22;

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

  const placeEpicenter = useCallback(
    (lat: number, lng: number) => {
      if (gameState !== GAME_STATES.SETUP) return;
      setEpicenter({ lat, lng });
    },
    [gameState]
  );

  const deployUnit = useCallback(
    (lat: number, lng: number) => {
      if (!selectedUnitType || units.length >= MAX_UNITS) return;

      const unitCost = UNIT_COSTS[selectedUnitType];
      if (currentFunds < unitCost) return;

      const newUnit: Unit = {
        id: Date.now(),
        type: selectedUnitType,
        position: { lat, lng },
        status: 'DEPLOYING',
      };

      setUnits((prev) => [...prev, newUnit]);
      setSelectedUnitType(null);

      setTimeout(() => {
        setUnits((prev) =>
          prev.map((u) => (u.id === newUnit.id ? { ...u, status: 'ACTIVE' } : u))
        );
      }, 2000);
    },
    [selectedUnitType, units.length, currentFunds]
  );

  return {
    gameState,
    epicenter,
    magnitude,
    units,
    selectedUnitType,
    waveProgress,
    countdown,
    results,
    currentFunds,
    totalBudget: TOTAL_BUDGET,
    maxUnits: MAX_UNITS,
    unitCosts: UNIT_COSTS,
    setMagnitude,
    setSelectedUnitType,
    startSimulation,
    resetSimulation,
    placeEpicenter,
    deployUnit,
    GAME_STATES,
  };
};