import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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

interface MapLibreContainerProps {
  epicenter: Position | null;
  units: Unit[];
  waveProgress: number;
  gameState: string;
  onMapClick: (lat: number, lng: number) => void;
  selectedUnitType: Unit['type'] | null;
}

const LA_JOLLA_CENTER: [number, number] = [-117.2713, 32.8328];

export const MapLibreContainer = ({
  epicenter,
  units,
  waveProgress,
  gameState,
  onMapClick,
  selectedUnitType
}: MapLibreContainerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const epicenterMarker = useRef<maplibregl.Marker | null>(null);
  const unitMarkers = useRef<Map<number, maplibregl.Marker>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
      center: LA_JOLLA_CENTER,
      zoom: 12,
      pitch: 60,
      bearing: 0,
      antialias: true
    });

    // Add 3D terrain
    map.current.on('load', () => {
      if (!map.current) return;

      map.current.addSource('terrain', {
        type: 'raster-dem',
        url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
        tileSize: 256
      });

      map.current.setTerrain({ source: 'terrain', exaggeration: 1.5 });

      // Add 3D buildings
      map.current.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.6
        }
      });

      // Add sky layer
      map.current.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15
        }
      });
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

    // Map click handler
    map.current.on('click', (e) => {
      onMapClick(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [onMapClick]);

  // Update epicenter marker
  useEffect(() => {
    if (!map.current) return;

    if (epicenter) {
      if (!epicenterMarker.current) {
        const el = document.createElement('div');
        el.className = 'epicenter-marker';
        el.innerHTML = `
          <div class="relative w-8 h-8">
            <div class="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-80"></div>
            <div class="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-50"></div>
          </div>
        `;

        epicenterMarker.current = new maplibregl.Marker({ element: el })
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

  // Update unit markers
  useEffect(() => {
    if (!map.current) return;

    const currentIds = new Set(units.map(u => u.id));
    const existingIds = new Set(unitMarkers.current.keys());

    // Remove deleted units
    existingIds.forEach(id => {
      if (!currentIds.has(id)) {
        unitMarkers.current.get(id)?.remove();
        unitMarkers.current.delete(id);
      }
    });

    // Add or update units
    units.forEach(unit => {
      const existing = unitMarkers.current.get(unit.id);

      if (existing) {
        existing.setLngLat([unit.position.lng, unit.position.lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'unit-marker';

        let iconColor = '';
        let IconSVG = '';

        switch (unit.type) {
          case 'ambulance':
            iconColor = 'text-blue-500';
            IconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.579l-1.04-2.08A1 1 0 0 0 16.886 9H14"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>';
            break;
          case 'fire':
            iconColor = 'text-orange-500';
            IconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';
            break;
          case 'hospital':
            iconColor = 'text-green-500';
            IconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v4"/><path d="M14 14h-4"/><path d="M14 18h-4"/><path d="M14 8h-4"/><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/></svg>';
            break;
        }

        el.innerHTML = `
          <div class="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg border-2 border-${unit.type === 'ambulance' ? 'blue' : unit.type === 'fire' ? 'orange' : 'green'}-500 ${iconColor}">
            ${IconSVG}
          </div>
        `;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([unit.position.lng, unit.position.lat])
          .addTo(map.current!);

        unitMarkers.current.set(unit.id, marker);
      }
    });
  }, [units]);

  // Update wave overlay
  useEffect(() => {
    if (!map.current || !epicenter || gameState !== 'PROPAGATING') return;

    const sourceId = 'wave-circle';
    const layerId = 'wave-layer';

    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    const radiusKm = waveProgress * 100;
    const radiusMeters = radiusKm * 1000;

    const createGeoJSONCircle = (center: [number, number], radiusInMeters: number) => {
      const points = 64;
      const coords = {
        latitude: center[1],
        longitude: center[0]
      };

      const km = radiusInMeters / 1000;
      const ret = [];
      const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
      const distanceY = km / 110.574;

      for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);
        ret.push([coords.longitude + x, coords.latitude + y]);
      }
      ret.push(ret[0]);

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [ret]
        },
        properties: {}
      };
    };

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: createGeoJSONCircle([epicenter.lng, epicenter.lat], radiusMeters)
    });

    map.current.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': '#ef4444',
        'fill-opacity': 0.3
      }
    });

    map.current.addLayer({
      id: `${layerId}-outline`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#ef4444',
        'line-width': 3,
        'line-opacity': 0.8
      }
    });
  }, [epicenter, waveProgress, gameState]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {selectedUnitType && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-6 py-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium">
            Click map to deploy {selectedUnitType} unit
          </p>
        </div>
      )}
    </div>
  );
};
