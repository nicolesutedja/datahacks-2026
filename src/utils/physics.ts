// Seismic wave physics constants (pre-ML placeholders)

export const WAVE_SPEED_KM_S = 5; // P-wave speed in km/s
export const MAX_WAVE_RADIUS_KM = 100; // Maximum simulation radius

export const calculateWaveRadius = (progress: number): number => {
  return progress * MAX_WAVE_RADIUS_KM;
};

export const metersToPixels = (meters: number, zoomLevel: number): number => {
  // Approximate conversion at given zoom level
  const metersPerPixel = 156543.03392 * Math.cos(32.8328 * Math.PI / 180) / Math.pow(2, zoomLevel);
  return meters / metersPerPixel;
};

export const kmToMeters = (km: number): number => km * 1000;
