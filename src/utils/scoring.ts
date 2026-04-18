// Scoring and analytics utilities

export const calculateLivesSaved = (
  magnitude: number,
  unitsDeployed: number,
  basePopulation: number = 50000
): number => {
  const magnitudeFactor = Math.pow(magnitude - 4, 2) / 25;
  const unitBonus = unitsDeployed * 0.15;
  return Math.floor(basePopulation * magnitudeFactor * (0.3 + unitBonus));
};

export const calculateResourceEfficiency = (
  unitsDeployed: number,
  maxUnits: number = 5
): number => {
  const baseEfficiency = (unitsDeployed / maxUnits) * 100;
  const variability = Math.random() * 20;
  return Math.min(100, Math.floor(baseEfficiency + variability));
};

export const calculatePredictionAccuracy = (): number => {
  return Math.floor(75 + Math.random() * 20);
};

export const getRiskLevel = (magnitude: number): string => {
  if (magnitude < 5.5) return 'LOW';
  if (magnitude < 6.5) return 'MODERATE';
  if (magnitude < 7.5) return 'HIGH';
  return 'EXTREME';
};
