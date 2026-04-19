import { useEffect, useMemo, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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

interface SoilHeatmapFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
    properties: {
      vs30?: number;
      soil_strength?: number;
      soil_strength_label?: string;
      soil_factor?: number;
      site_class?: string;
    };
  }>;
}

interface SimulationOutput {
  waveform: number[][];
  max_amplitude: number;
  pgv: number[];
  risk_classes?: string[];
  confidence?: string;
  soil_heatmap?: SoilHeatmapFeatureCollection;
}

interface MapboxContainerProps {
  epicenter: Position | null;
  units: Unit[];
  waveProgress: number;
  magnitude: number;
  gameState: string;
  onMapClick: (lat: number, lng: number) => void;
  onRegionInsightClick: (lat: number, lng: number) => void;
  selectedUnitType: Unit['type'] | null;
  simulationOutput: SimulationOutput | null;
  onZoneClick: (zone: any) => void;
}

const LA_JOLLA_CENTER: [number, number] = [-117.2713, 32.8328];
const EARTH_RADIUS_METERS = 6378137;

const WAVE_IDS = {
  pSource: 'p-wave-source',
  sSource: 's-wave-source',
  surfaceSource: 'surface-wave-source',
  pFill: 'p-wave-fill',
  pLine: 'p-wave-line',
  sFill: 's-wave-fill',
  sLine: 's-wave-line',
  surfaceFill: 'surface-wave-fill',
  surfaceLine: 'surface-wave-line',
};

const SOIL_IDS = {
  source: 'soil-heatmap-source',
  heatLayer: 'soil-heatmap-layer',
};

const RESOURCE_RADIUS_IDS = {
  source: 'resource-radii-source',
  fill: 'resource-radii-fill',
  line: 'resource-radii-line',
};

const EMPTY_FEATURE_COLLECTION = {
  type: 'FeatureCollection' as const,
  features: [],
};

const RESOURCE_RADIUS_METERS: Record<Unit['type'], number> = {
  ambulance: 900,
  fire: 1500,
  hospital: 2300,
};

const destinationPoint = (
  lng: number,
  lat: number,
  bearingDeg: number,
  distanceMeters: number
): [number, number] => {
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
  const bearing = (bearingDeg * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  const destLat = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing)
  );

  const destLng =
    lngRad +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(destLat)
    );

  return [(destLng * 180) / Math.PI, (destLat * 180) / Math.PI];
};

const createGeoJSONCircle = (
  center: [number, number],
  radiusMeters: number,
  points = 64
) => {
  const [lng, lat] = center;
  const ring: [number, number][] = [];

  for (let i = 0; i <= points; i += 1) {
    const bearing = (i / points) * 360;
    ring.push(destinationPoint(lng, lat, bearing, radiusMeters));
  }

  return {
    type: 'Feature' as const,
    geometry: {
      type: 'Polygon' as const,
      coordinates: [ring],
    },
    properties: {},
  };
};

const createEpicenterMarkerElement = () => {
  const el = document.createElement('div');
  el.className = 'epicenter-marker';
  el.innerHTML = `
    <div style="
      width: 22px;
      height: 22px;
      border-radius: 999px;
      border: 2px solid rgba(255,255,255,0.95);
      background: radial-gradient(circle, rgba(239,68,68,1) 0%, rgba(127,29,29,1) 70%, rgba(69,10,10,1) 100%);
      box-shadow: 0 0 18px rgba(239,68,68,0.65), 0 0 36px rgba(239,68,68,0.25);
      position: relative;
    ">
      <div style="
        position: absolute;
        inset: -8px;
        border-radius: 999px;
        border: 1px solid rgba(248,113,113,0.45);
      "></div>
    </div>
  `;
  return el;
};

const createUnitMarkerElement = (unit: Unit) => {
  const el = document.createElement('div');

  const config = {
    ambulance: {
      label: 'M',
      border: '#3b82f6',
      glow: 'rgba(59,130,246,0.45)',
      background: 'rgba(2,6,23,0.95)',
    },
    fire: {
      label: 'F',
      border: '#f97316',
      glow: 'rgba(249,115,22,0.45)',
      background: 'rgba(2,6,23,0.95)',
    },
    hospital: {
      label: 'H',
      border: '#22c55e',
      glow: 'rgba(34,197,94,0.45)',
      background: 'rgba(2,6,23,0.95)',
    },
  }[unit.type];

  const opacity = unit.status === 'DEPLOYING' ? 0.7 : 1;

  el.className = 'unit-marker';
  el.innerHTML = `
    <div style="
      width: 28px;
      height: 28px;
      border-radius: 999px;
      border: 2px solid ${config.border};
      color: ${config.border};
      background: ${config.background};
      box-shadow: 0 0 16px ${config.glow};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      opacity: ${opacity};
    ">
      ${config.label}
    </div>
  `;

  return el;
};

const buildResourceRadiusData = (units: Unit[]) => {
  return {
    type: 'FeatureCollection' as const,
    features: units.map((unit) => ({
      type: 'Feature' as const,
      properties: {
        id: unit.id,
        type: unit.type,
        status: unit.status,
      },
      geometry: createGeoJSONCircle(
        [unit.position.lng, unit.position.lat],
        RESOURCE_RADIUS_METERS[unit.type]
      ).geometry,
    })),
  };
};

const ensureSimulationLayers = (map: mapboxgl.Map) => {
  if (!map.getSource(WAVE_IDS.pSource)) {
    map.addSource(WAVE_IDS.pSource, {
      type: 'geojson',
      data: EMPTY_FEATURE_COLLECTION,
    });
  }

  if (!map.getSource(WAVE_IDS.sSource)) {
    map.addSource(WAVE_IDS.sSource, {
      type: 'geojson',
      data: EMPTY_FEATURE_COLLECTION,
    });
  }

  if (!map.getSource(WAVE_IDS.surfaceSource)) {
    map.addSource(WAVE_IDS.surfaceSource, {
      type: 'geojson',
      data: EMPTY_FEATURE_COLLECTION,
    });
  }

  if (!map.getLayer(WAVE_IDS.pFill)) {
    map.addLayer({
      id: WAVE_IDS.pFill,
      type: 'fill',
      source: WAVE_IDS.pSource,
      paint: {
        'fill-color': '#60a5fa',
        'fill-opacity': 0.05,
      },
    });
  }

  if (!map.getLayer(WAVE_IDS.pLine)) {
    map.addLayer({
      id: WAVE_IDS.pLine,
      type: 'line',
      source: WAVE_IDS.pSource,
      paint: {
        'line-color': '#93c5fd',
        'line-width': 2,
        'line-opacity': 0.55,
      },
    });
  }

  if (!map.getLayer(WAVE_IDS.sFill)) {
    map.addLayer({
      id: WAVE_IDS.sFill,
      type: 'fill',
      source: WAVE_IDS.sSource,
      paint: {
        'fill-color': '#f59e0b',
        'fill-opacity': 0.08,
      },
    });
  }

  if (!map.getLayer(WAVE_IDS.sLine)) {
    map.addLayer({
      id: WAVE_IDS.sLine,
      type: 'line',
      source: WAVE_IDS.sSource,
      paint: {
        'line-color': '#fbbf24',
        'line-width': 3,
        'line-opacity': 0.78,
      },
    });
  }

  if (!map.getLayer(WAVE_IDS.surfaceFill)) {
    map.addLayer({
      id: WAVE_IDS.surfaceFill,
      type: 'fill',
      source: WAVE_IDS.surfaceSource,
      paint: {
        'fill-color': '#ef4444',
        'fill-opacity': 0.1,
      },
    });
  }

  if (!map.getLayer(WAVE_IDS.surfaceLine)) {
    map.addLayer({
      id: WAVE_IDS.surfaceLine,
      type: 'line',
      source: WAVE_IDS.surfaceSource,
      paint: {
        'line-color': '#f87171',
        'line-width': 3,
        'line-opacity': 0.8,
      },
    });
  }

  if (!map.getSource(SOIL_IDS.source)) {
    map.addSource(SOIL_IDS.source, {
      type: 'geojson',
      data: EMPTY_FEATURE_COLLECTION,
    });
  }

  if (!map.getLayer(SOIL_IDS.heatLayer)) {
    map.addLayer({
      id: SOIL_IDS.heatLayer,
      type: 'heatmap',
      source: SOIL_IDS.source,
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'soil_strength'], 0],
          0,
          0.5,
          1,
          4.5,
        ],
        'heatmap-intensity': 3.8,
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          4,
          24,
          6,
          34,
          8,
          48,
          10,
          62,
        ],
        'heatmap-opacity': 0.2,
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(0,0,0,0)',
          0.12,
          'rgba(34,211,238,0.18)',
          0.28,
          'rgba(59,130,246,0.34)',
          0.45,
          'rgba(16,185,129,0.48)',
          0.65,
          'rgba(250,204,21,0.62)',
          0.82,
          'rgba(249,115,22,0.76)',
          1,
          'rgba(239,68,68,0.88)',
        ],
      },
    });
  }

  if (!map.getSource(RESOURCE_RADIUS_IDS.source)) {
    map.addSource(RESOURCE_RADIUS_IDS.source, {
      type: 'geojson',
      data: EMPTY_FEATURE_COLLECTION,
    });
  }

  if (!map.getLayer(RESOURCE_RADIUS_IDS.fill)) {
    map.addLayer({
      id: RESOURCE_RADIUS_IDS.fill,
      type: 'fill',
      source: RESOURCE_RADIUS_IDS.source,
      paint: {
        'fill-color': [
          'match',
          ['get', 'type'],
          'ambulance',
          '#3b82f6',
          'fire',
          '#f97316',
          'hospital',
          '#22c55e',
          '#94a3b8',
        ],
        'fill-opacity': [
          'case',
          ['==', ['get', 'status'], 'DEPLOYING'],
          0.06,
          0.1,
        ],
      },
    });
  }

  if (!map.getLayer(RESOURCE_RADIUS_IDS.line)) {
    map.addLayer({
      id: RESOURCE_RADIUS_IDS.line,
      type: 'line',
      source: RESOURCE_RADIUS_IDS.source,
      paint: {
        'line-color': [
          'match',
          ['get', 'type'],
          'ambulance',
          '#60a5fa',
          'fire',
          '#fb923c',
          'hospital',
          '#4ade80',
          '#cbd5e1',
        ],
        'line-width': 2,
        'line-opacity': 0.75,
        'line-dasharray': [
          'case',
          ['==', ['get', 'status'], 'DEPLOYING'],
          ['literal', [1.5, 1.5]],
          ['literal', [2.5, 1.2]],
        ],
      },
    });
  }
};

const setLayerVisibility = (
  map: mapboxgl.Map,
  layerIds: string[],
  visible: boolean
) => {
  layerIds.forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    }
  });
};

export const MapboxContainer = ({
  epicenter,
  units,
  waveProgress,
  magnitude,
  gameState,
  onMapClick,
  onRegionInsightClick,
  selectedUnitType,
  simulationOutput,
  onZoneClick,
}: MapboxContainerProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const epicenterMarker = useRef<mapboxgl.Marker | null>(null);
  const unitMarkers = useRef<Map<number, mapboxgl.Marker>>(new Map());

  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  const onRegionInsightClickRef = useRef(onRegionInsightClick);
  useEffect(() => {
    onRegionInsightClickRef.current = onRegionInsightClick;
  }, [onRegionInsightClick]);

  const onZoneClickRef = useRef(onZoneClick);
  useEffect(() => {
    onZoneClickRef.current = onZoneClick;
  }, [onZoneClick]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    const instance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: LA_JOLLA_CENTER,
      zoom: 12,
      pitch: 60,
      bearing: 0,
      antialias: true,
    });

    map.current = instance;

    instance.on('load', () => {
      if (!map.current) return;

      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });

      map.current.setTerrain({
        source: 'mapbox-dem',
        exaggeration: 1.5,
      });

      map.current.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#1a1a1a',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.9,
        },
      });

      map.current.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15,
        },
      });

      map.current.addSource('liquefaction-zones', {
        type: 'geojson',
        data: '/data/CGS_Liquefaction_Zones.geojson',
      });

      fetch('/data/CGS_Liquefaction_Zones.geojson')
        .then((res) => res.json())
        .then((data) => console.log('GeoJSON features:', data.features.length));

      map.current.addLayer({
        id: 'liquefaction-fill',
        type: 'fill',
        source: 'liquefaction-zones',
        paint: {
          'fill-color': '#00ffff',
          'fill-opacity': 0.6,
        },
      });

      map.current.addLayer({
        id: 'liquefaction-outline',
        type: 'line',
        source: 'liquefaction-zones',
        paint: {
          'line-color': '#00ffff',
          'line-width': 3,
        },
      });

      ensureSimulationLayers(map.current);

      setLayerVisibility(
        map.current,
        [
          WAVE_IDS.pFill,
          WAVE_IDS.pLine,
          WAVE_IDS.sFill,
          WAVE_IDS.sLine,
          WAVE_IDS.surfaceFill,
          WAVE_IDS.surfaceLine,
        ],
        false
      );

      map.current.on('click', 'liquefaction-fill', (event) => {
        const feature = event.features?.[0];
        if (feature) {
          onZoneClickRef.current(feature);
        }
      });
    });

    instance.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'left'
    );
    instance.addControl(new mapboxgl.FullscreenControl(), 'left');

    instance.on('click', (e) => {
      if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
        onRegionInsightClickRef.current(e.lngLat.lat, e.lngLat.lng);
        return;
      }

      onMapClickRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    instance.on('contextmenu', (e) => {
      e.preventDefault();
      onRegionInsightClickRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    if (epicenter) {
      if (!epicenterMarker.current) {
        epicenterMarker.current = new mapboxgl.Marker({
          element: createEpicenterMarkerElement(),
        })
          .setLngLat([epicenter.lng, epicenter.lat])
          .addTo(map.current);
      } else {
        epicenterMarker.current.setLngLat([epicenter.lng, epicenter.lat]);
      }
    } else {
      epicenterMarker.current?.remove();
      epicenterMarker.current = null;
    }
  }, [epicenter]);

  useEffect(() => {
    if (!map.current) return;

    const currentIds = new Set(units.map((unit) => unit.id));
    const existingIds = new Set(unitMarkers.current.keys());

    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        unitMarkers.current.get(id)?.remove();
        unitMarkers.current.delete(id);
      }
    });

    units.forEach((unit) => {
      const existing = unitMarkers.current.get(unit.id);
      if (existing) {
        existing.setLngLat([unit.position.lng, unit.position.lat]);
      } else {
        const marker = new mapboxgl.Marker({
          element: createUnitMarkerElement(unit),
        })
          .setLngLat([unit.position.lng, unit.position.lat])
          .addTo(map.current!);

        unitMarkers.current.set(unit.id, marker);
      }
    });

    const source = map.current.getSource(
      RESOURCE_RADIUS_IDS.source
    ) as mapboxgl.GeoJSONSource | undefined;

    if (source) {
      source.setData(buildResourceRadiusData(units) as any);
    }
  }, [units]);

  useEffect(() => {
    if (!map.current) return;

    const shouldShowSimulationLayers =
      (gameState === 'PROPAGATING' || gameState === 'RESULTS') && Boolean(epicenter);

    setLayerVisibility(
      map.current,
      [
        WAVE_IDS.pFill,
        WAVE_IDS.pLine,
        WAVE_IDS.sFill,
        WAVE_IDS.sLine,
        WAVE_IDS.surfaceFill,
        WAVE_IDS.surfaceLine,

      ],
      shouldShowSimulationLayers
    );

    if (!shouldShowSimulationLayers || !epicenter) {
      return;
    }

    const maxAmplitude = simulationOutput?.max_amplitude ?? 0.018;
    const amplitudeScale = Math.max(0.85, Math.min(maxAmplitude / 0.02, 1.25));

    const magnitudeSpeedFactor = Math.max(0.9, 1 + (magnitude - 5.0) * 0.35);

    const pRadiusMeters =
      waveProgress * 22000 * magnitudeSpeedFactor * amplitudeScale;

    const sProgress = Math.max(0, (waveProgress - 0.08) / 0.92);
    const sRadiusMeters =
      sProgress * 42000 * magnitudeSpeedFactor * amplitudeScale;

    const surfaceProgress = Math.max(0, (waveProgress - 0.16) / 0.84);
    const surfaceRadiusMeters =
      surfaceProgress * 65000 * magnitudeSpeedFactor * amplitudeScale;

    const pSource = map.current.getSource(WAVE_IDS.pSource) as mapboxgl.GeoJSONSource;
    const sSource = map.current.getSource(WAVE_IDS.sSource) as mapboxgl.GeoJSONSource;
    const surfaceSource = map.current.getSource(
      WAVE_IDS.surfaceSource
    ) as mapboxgl.GeoJSONSource;
    const soilSource = map.current.getSource(
      SOIL_IDS.source
    ) as mapboxgl.GeoJSONSource;

    pSource?.setData(
      createGeoJSONCircle([epicenter.lng, epicenter.lat], Math.max(pRadiusMeters, 1)) as any
    );
    sSource?.setData(
      createGeoJSONCircle([epicenter.lng, epicenter.lat], Math.max(sRadiusMeters, 1)) as any
    );
    surfaceSource?.setData(
      createGeoJSONCircle(
        [epicenter.lng, epicenter.lat],
        Math.max(surfaceRadiusMeters, 1)
      ) as any
    );

    soilSource?.setData(EMPTY_FEATURE_COLLECTION as any);

    map.current.setPaintProperty(
      WAVE_IDS.pFill,
      'fill-opacity',
      0.04 + 0.015 * Math.sin(waveProgress * Math.PI * 6)
    );
    map.current.setPaintProperty(
      WAVE_IDS.sFill,
      'fill-opacity',
      0.06 + 0.025 * Math.sin(waveProgress * Math.PI * 5)
    );
    map.current.setPaintProperty(
      WAVE_IDS.surfaceFill,
      'fill-opacity',
      0.08 + 0.04 * Math.sin(waveProgress * Math.PI * 4)
    );
  }, [epicenter, gameState, magnitude, simulationOutput, waveProgress]);

  const shakeTransform = useMemo(() => {
    if (
      gameState !== 'PROPAGATING' ||
      !simulationOutput?.waveform ||
      simulationOutput.waveform.length === 0
    ) {
      return 'translate(0px, 0px)';
    }

    const mainWave = simulationOutput.waveform[0];
    if (!Array.isArray(mainWave) || mainWave.length === 0) {
      return 'translate(0px, 0px)';
    }

    const currentIndex = Math.min(
      mainWave.length - 1,
      Math.max(0, Math.floor(waveProgress * (mainWave.length - 1)))
    );

    const currentShakeValue = Math.abs(mainWave[currentIndex] ?? 0);

    if (currentShakeValue < 0.002) {
      return 'translate(0px, 0px)';
    }

    const angle = waveProgress * Math.PI * 24;
    const intensityMultiplier = 220;

    const x = Math.cos(angle) * currentShakeValue * intensityMultiplier;
    const y = Math.sin(angle) * currentShakeValue * intensityMultiplier;

    return `translate(${x}px, ${y}px)`;
  }, [gameState, simulationOutput, waveProgress]);

  return (
    <div className="absolute inset-0">
      <div
        ref={mapContainer}
        className="h-full w-full"
        style={{
          transform: shakeTransform,
          transition:
            gameState === 'PROPAGATING'
              ? 'transform 70ms linear'
              : 'transform 300ms ease-out',
        }}
      />

      {selectedUnitType && (
        <div className="pointer-events-none absolute right-6 top-28 z-20 border border-red-500/40 bg-black/80 px-4 py-3 text-xs uppercase tracking-[0.22em] text-red-200 backdrop-blur-md">
          Awaiting Deployment: {selectedUnitType}
        </div>
      )}
      {simulationOutput?.confidence && (
        <div className="absolute top-4 left-4 bg-black/70 px-3 py-2 text-xs border border-white/20">
          Confidence: {simulationOutput.confidence}
        </div>
      )}
    </div>
  );
};