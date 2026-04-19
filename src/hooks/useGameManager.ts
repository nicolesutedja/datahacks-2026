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
  expectedDamageIndex: number;
  predictedSeverity: 'low' | 'moderate' | 'high' | 'severe';
  modelReliability: number;
}

const TOTAL_BUDGET = 10000000;
const MAX_UNITS = 5;

const UNIT_COSTS = {
  ambulance: 1500000,
  fire: 2000000,
  hospital: 3000000,
} as const;

interface ModelAssessment {
  mean_pgv: number;
  max_pgv: number;
  high_risk_ratio: number;
  extreme_risk_ratio: number;
  expected_damage_index: number;
  predicted_severity: 'low' | 'moderate' | 'high' | 'severe';
  model_reliability: number;
}

export const useGameManager = (modelAssessment: ModelAssessment | null) => {
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
    const deploymentRatio = Math.min(1, units.length / 5);
    const typeDiversity = new Set(units.map((u) => u.type)).size / 3;
  
    const severityMultiplier =
      modelAssessment?.predicted_severity === 'severe'
        ? 1.2
        : modelAssessment?.predicted_severity === 'high'
        ? 1.0
        : modelAssessment?.predicted_severity === 'moderate'
        ? 0.8
        : 0.6;
  
    const expectedDamageIndex = modelAssessment?.expected_damage_index ?? magnitude * 10;

    const highRiskRatio = modelAssessment?.high_risk_ratio ?? 0.3;
    const extremeRiskRatio = modelAssessment?.extreme_risk_ratio ?? 0.1;
    const modelReliability = Math.round((modelAssessment?.model_reliability ?? 0.72) * 100);
  
    const readinessScore = Math.min(
      100,
      Math.round(35 + deploymentRatio * 40 + typeDiversity * 25)
    );
  
    const resourceEfficiency = Math.min(
      100,
      Math.round(
        25 +
          deploymentRatio * 35 +
          typeDiversity * 20 +
          (1 - Math.min(1, expectedDamageIndex / 100)) * 20
      )
    );
  
    const predictionAccuracy = Math.min(
      100,
      Math.round(
        modelReliability * (0.7 + 0.3 * (1 - extremeRiskRatio)) -
        Math.max(0, expectedDamageIndex - 70) * 0.2
      )
    );
  
    const exposureBase = 18000 + magnitude * 5500;
    const mitigationScore = 0.22 + deploymentRatio * 0.38 + typeDiversity * 0.22;
    const riskPenalty =
      1 -
      Math.min(
        0.55,
        expectedDamageIndex / 250 +
        highRiskRatio * 0.35 +
        extremeRiskRatio * 0.5
      );
  
      const livesSaved = Math.max(
        0,
        Math.round(
          exposureBase *
            severityMultiplier *
            mitigationScore *
            riskPenalty *
            (0.6 + modelReliability / 200)
        )
      );
  
    setResults({
      livesSaved,
      resourceEfficiency,
      predictionAccuracy,
      magnitude,
      unitsDeployed: units.length,
      expectedDamageIndex: Math.round(expectedDamageIndex),
      predictedSeverity: modelAssessment?.predicted_severity ?? 'moderate',
      modelReliability,
    });
  }, [magnitude, modelAssessment, units]);

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