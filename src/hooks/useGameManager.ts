import { useState, useEffect, useCallback } from 'react';

export const GAME_STATES = {
  SETUP: 'SETUP',
  PROPAGATING: 'PROPAGATING',
  RESULTS: 'RESULTS',
} as const;

type GameState = typeof GAME_STATES[keyof typeof GAME_STATES];

export interface Position {
  lat: number;
  lng: number;
}

export interface Unit {
  id: number;
  type: 'ambulance' | 'fire' | 'hospital';
  position: Position;
  status: 'DEPLOYING' | 'ACTIVE';
}

export interface Results {
  livesSaved: number;
  resourceEfficiency: number;
  predictionAccuracy: number;
  magnitude: number;
  unitsDeployed: number;
  expectedDamageIndex: number;
  predictedSeverity: 'low' | 'moderate' | 'high' | 'severe';
  modelReliability: number;
  // Advanced Telemetry for the new Results Screen
  economicLossBillion: number;
  peakGroundVelocity: number;
  shakingDuration: number;
  aftershockProb: number;
  infrastructureIntegrity: number;
  displacedPersons: number;
}

const TOTAL_BUDGET = 10000000;
const MAX_UNITS = 5;

const UNIT_COSTS = {
  ambulance: 1500000, // Vertical Drainage
  fire: 2000000,      // Vibro-Stone Rigs
  hospital: 3000000,  // Cement Injections
} as const;

export interface ModelAssessment {
  mean_pgv: number;
  max_pgv: number;
  high_risk_ratio: number;
  extreme_risk_ratio: number;
  expected_damage_index: number;
  predicted_severity: 'low' | 'moderate' | 'high' | 'severe';
  model_reliability: number;
}

// Inland SoCal Generator
export const generateInlandEpicenter = (): Position => {
  const minLat = 32.6; 
  const maxLat = 34.5; 
  const maxLng = -116.0; 
  
  let lat = 0;
  let lng = 0;
  let isLand = false;

  while (!isLand) {
    lat = minLat + Math.random() * (maxLat - minLat);
    const coastLng = -117.2 - 1.0 * (lat - 32.7);
    lng = coastLng + Math.random() * (maxLng - coastLng);
    
    if (lng > coastLng && lng < maxLng) {
      isLand = true;
    }
  }

  return { lat, lng };
};

export const useGameManager = (modelAssessment: ModelAssessment | null) => {
  const [gameState, setGameState] = useState<GameState>(GAME_STATES.SETUP);
  const [epicenter, setEpicenter] = useState<Position | null>(null);
  const [magnitude, setMagnitude] = useState(6.5);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitType, setSelectedUnitType] = useState<Unit['type'] | null>(null);
  const [waveProgress, setWaveProgress] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [results, setResults] = useState<Results | null>(null);

  // Dynamic budget tracking
  const spentBudget = units.reduce((sum, unit) => sum + UNIT_COSTS[unit.type], 0);
  const currentFunds = Math.max(0, TOTAL_BUDGET - spentBudget);

  // Wave propagation timer
  useEffect(() => {
    if (gameState === GAME_STATES.PROPAGATING) {
      const startTime = Date.now();
      // Wave duration based on magnitude
      const duration = magnitude < 5 ? 10000 : magnitude < 6 ? 12000 : magnitude < 7 ? 15000 : magnitude < 8 ? 18000 : 22000;

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
  }, [gameState, magnitude]);

  const calculateResults = useCallback(() => {
    // 1. Establish the Baseline
    const basePopulation = 150000;
    const soilScore = 8; 
    const baseRisk = magnitude * soilScore;

    // 2. Calculate Investment Effectiveness (I_eff)
    let I_eff = 0;
    units.forEach(u => {
      if (u.type === 'ambulance') I_eff += 10;
      if (u.type === 'fire') I_eff += 15;
      if (u.type === 'hospital') I_eff += 25;
    });

    // 3. The Formula: Casualty Rate = (Risk - Defenses) / 100
    let baseCasualtyRate = (baseRisk - I_eff) / 100;
    baseCasualtyRate = Math.max(0, Math.min(1, baseCasualtyRate)); 

    // 4. Add a slight "Chaos Factor" (±5% variance)
    const chaosFactor = 0.95 + (Math.random() * 0.10);
    const finalCasualtyRate = Math.min(1, baseCasualtyRate * chaosFactor);

    // 5. Generate Core Stats
    const livesSaved = Math.floor(basePopulation * (1 - finalCasualtyRate));
    
    // Merge ML Assessment data if available, otherwise use procedural math
    const expectedDamageIndex = modelAssessment?.expected_damage_index 
      ? Math.round(modelAssessment.expected_damage_index) 
      : Math.floor(finalCasualtyRate * 100);
    
    const maxPossibleInvestment = 5 * 25; 
    const resourceEfficiency = Math.max(30, Math.floor((I_eff / maxPossibleInvestment) * 100));

    let predictedSeverity: 'low' | 'moderate' | 'high' | 'severe' = modelAssessment?.predicted_severity || 'moderate';
    if (!modelAssessment) {
      if (magnitude >= 7.5) predictedSeverity = 'severe';
      else if (magnitude >= 6.5) predictedSeverity = 'high';
      else if (magnitude < 5.5) predictedSeverity = 'low';
    }

    const modelReliability = modelAssessment?.model_reliability 
      ? Math.floor(modelAssessment.model_reliability * 100) 
      : Math.floor(90 + Math.random() * 8);

    // 6. Advanced Telemetry
    const peakGroundVelocity = modelAssessment?.max_pgv 
      ? Math.floor(modelAssessment.max_pgv * 100) 
      : Math.floor(Math.pow(10, 0.4 * magnitude - 1) * (soilScore * 0.8)); 
      
    const shakingDuration = Math.floor((magnitude - 4.0) * 14 + Math.random() * 6); 
    const aftershockProb = Math.min(99, Math.floor((magnitude - 5.0) * 22 + Math.random() * 10));
    const infrastructureIntegrity = Math.max(0, 100 - expectedDamageIndex);
    const economicLossBillion = Number((finalCasualtyRate * magnitude * 5.2 + (magnitude > 6.5 ? 3.5 : 0.8)).toFixed(2));
    const displacedPersons = Math.min(basePopulation, Math.floor(basePopulation * finalCasualtyRate * 2.5));

    setResults({
      livesSaved,
      resourceEfficiency,
      predictionAccuracy: Math.floor(85 + Math.random() * 10), 
      modelReliability,
      magnitude,
      unitsDeployed: units.length,
      expectedDamageIndex,
      predictedSeverity,
      economicLossBillion,
      peakGroundVelocity,
      shakingDuration,
      aftershockProb,
      infrastructureIntegrity,
      displacedPersons
    });
  }, [magnitude, units, modelAssessment]);

  const startSimulation = useCallback(() => {
    if (!epicenter) return;
    setGameState(GAME_STATES.PROPAGATING);
    setWaveProgress(0);
  }, [epicenter]);

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

      // Simulate deployment delay
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