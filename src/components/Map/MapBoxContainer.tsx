import { useEffect, useRef, useMemo } from 'react'; // INJECTED 3: Added useMemo
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// 1. Import the visual hook we created earlier! 
import { useSeismicVisuals } from '../../hooks/useSeismicVisuals';
import React from 'react';

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

interface MapboxContainerProps {
  epicenter: Position | null;
  units: Unit[];
  waveProgress: number;
  gameState: string;
  onMapClick: (lat: number, lng: number) => void;
  selectedUnitType: Unit['type'] | null;

  // 2. ADDED: We now pass the ML output down to the map
  simulationOutput: {
    waveform: number[][];
    max_amplitude: number;
  } | null;
  onZoneClick: (zone: any) => void;
}

const LA_JOLLA_CENTER: [number, number] = [-117.2713, 32.8328];

export const MapboxContainer = ({
  epicenter,
  units,
  waveProgress,
  gameState,
  onMapClick,
  selectedUnitType,   
  simulationOutput, // Destructured here
  onZoneClick
}: MapboxContainerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const epicenterMarker = useRef<mapboxgl.Marker | null>(null);
  const unitMarkers = useRef<Map<number, mapboxgl.Marker>>(new Map());

  
  // 3. ADDED: Trigger the DOM screen shake when propagating!
  useSeismicVisuals(
    simulationOutput
      ? { waveform: simulationOutput.waveform, maxAmplitude: simulationOutput.max_amplitude }
      : null,
    gameState === 'PROPAGATING' // Shake the screen while the wave is moving
  );

  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Initialize Mapbox (Runs ONCE)
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Perfect for the tactical theme
      center: LA_JOLLA_CENTER,
      zoom: 12,
      pitch: 60,
      bearing: 0,
      antialias: true
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // --- VULNERABILITY ZONES (Example GeoJSON Layer) ---
        const vulnerabilityZones = {
        type: 'FeatureCollection',
        features: [
            {
            type: 'Feature',
            properties: { 
                id: 'zone-1',
                riskLevel: 'critical', // Will map to dark red
                health: 30, // Out of 100
                type: 'liquefaction' 
            },
            geometry: {
                type: 'Polygon',
                // Example coordinates for a block in San Diego
                coordinates: [[[-117.27, 32.83], [-117.26, 32.83], [-117.26, 32.84], [-117.27, 32.84], [-117.27, 32.83]]] 
            }
            }
            // Add more zones here...
        ]
        };

        //  Add the Data Source
        map.current.addSource('vulnerability-zones', {
        type: 'geojson',
        data: vulnerabilityZones
        });

        // 2. Add the Fill Layer (The colored regions)
        map.current.addLayer({
        id: 'zone-fill',
        type: 'fill',
        source: 'vulnerability-zones',
        paint: {
            // Dynamic coloring based on health!
            'fill-color': [
            'step',
            ['get', 'health'],
            '#dc2626', // < 40 health = Dark Red
            40, '#f97316', // 40-70 health = Orange
            70, '#54d630'  // > 70 health = Yellow/Greenish
            ],
            'fill-opacity': 0.4
        }
        });

        // 3. Add a glowing outline to the zones
        map.current.addLayer({
        id: 'zone-outline',
        type: 'line',
        source: 'vulnerability-zones',
        paint: {
            'line-color': '#ff0000',
            'line-width': 2,
            'line-dasharray': [2, 2] // Tactical dashed line
        }
        });
        
    
      // Add Mapbox 3D Terrain
    map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });
      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

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
          'fill-extrusion-opacity': 0.9
        }
      });

      // Add Atmosphere/Sky
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

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'left');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'left');
    map.current.on('click', (e) => {
      onMapClickRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update Epicenter Marker
  useEffect(() => {
    if (!map.current) return;

    if (epicenter) {
      if (!epicenterMarker.current) {
        const el = document.createElement('div');
        el.className = 'epicenter-marker';
        el.innerHTML = `
          <div class="relative w-8 h-8">
            <div class="absolute inset-0 bg-red-600 rounded-full animate-pulse opacity-80 shadow-[0_0_30px_rgba(220,38,38,1)]"></div>
            <div class="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-50"></div>
          </div>
        `;

        epicenterMarker.current = new mapboxgl.Marker({ element: el })
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

  // Update Unit Markers
  useEffect(() => {
    // ... [Your existing unit markers code remains exactly the same] ...
    if (!map.current) return;

    const currentIds = new Set(units.map(u => u.id));
    const existingIds = new Set(unitMarkers.current.keys());

    existingIds.forEach(id => {
      if (!currentIds.has(id)) {
        unitMarkers.current.get(id)?.remove();
        unitMarkers.current.delete(id);
      }
    });

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
            iconColor = 'text-blue-500 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]';
            IconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.579l-1.04-2.08A1 1 0 0 0 16.886 9H14"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>';
            break;
          case 'fire':
            iconColor = 'text-orange-500 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)]';
            IconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';
            break;
          case 'hospital':
            iconColor = 'text-green-500 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]';
            IconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6v4"/><path d="M14 14h-4"/><path d="M14 18h-4"/><path d="M14 8h-4"/><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/></svg>';
            break;
        }

        el.innerHTML = `
          <div class="flex items-center justify-center w-8 h-8 bg-black/90 backdrop-blur-md rounded-full border ${iconColor}">
            ${IconSVG}
          </div>
        `;

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([unit.position.lng, unit.position.lat])
          .addTo(map.current!);

        unitMarkers.current.set(unit.id, marker);
      }
    });
  }, [units]);

  // 4. UPDATED: Optimized Wave Overlay 
  useEffect(() => {
    // Hide layer when not propagating
    if (gameState !== 'PROPAGATING') {
        if (map.current?.getLayer('wave-layer')) {
            map.current.setLayoutProperty('wave-layer', 'visibility', 'none');
            map.current.setLayoutProperty('wave-layer-outline', 'visibility', 'none');
        }
        return;
    }

    if (!map.current || !epicenter) return;

    const sourceId = 'wave-circle';
    const layerId = 'wave-layer';

    let fillColor = '#f59e0b';
    let outlineColor = '#fbbf24';
    
    if (simulationOutput?.max_amplitude) {
      if (simulationOutput.max_amplitude > 0.02) {
        fillColor = '#dc2626'; // Severe
        outlineColor = '#ef4444';
      } else if (simulationOutput.max_amplitude > 0.01) {
        fillColor = '#ea580c'; // High
        outlineColor = '#f97316';
      }
    }


    // INJECTED 2: Dynamic Radius calculation based on amplitude!
    const predictedAmplitude = simulationOutput?.max_amplitude || 0.03;
    const maxRadiusKm = predictedAmplitude * 3000; 
    const radiusKm = waveProgress * maxRadiusKm;
    const radiusMeters = radiusKm * 1000;

    const createGeoJSONCircle = (center: [number, number], radiusInMeters: number) => {
      const points = 64;
      const coords = { latitude: center[1], longitude: center[0] };
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
        geometry: { type: 'Polygon' as const, coordinates: [ret] },
        properties: {}
      };
    };

    const newGeoJson = createGeoJSONCircle([epicenter.lng, epicenter.lat], radiusMeters);
    const source = map.current.getSource(sourceId) as mapboxgl.GeoJSONSource;

    if (source) {
      source.setData(newGeoJson);
      map.current.setLayoutProperty(layerId, 'visibility', 'visible');
      map.current.setLayoutProperty(`${layerId}-outline`, 'visibility', 'visible');
      map.current.setPaintProperty(layerId, 'fill-color', fillColor);
      map.current.setPaintProperty(`${layerId}-outline`, 'line-color', outlineColor);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: newGeoJson
    });

    map.current.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': fillColor,
        'fill-opacity': 0.2
      }
    });

    map.current.addLayer({
      id: `${layerId}-outline`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': outlineColor,
        'line-width': 4,
        'line-opacity': 0.8
      }
    });
    }
}, [epicenter, waveProgress, gameState, simulationOutput]);

  // INJECTED 3: The CSS CSS Screen Shake Algorithm!
  const shakeTransform = useMemo(() => {
    if (gameState !== 'PROPAGATING' || !simulationOutput?.waveform || simulationOutput.waveform.length === 0) {
      return 'translate(0px, 0px)';
    }

    const waveformArray = simulationOutput.waveform[0]; 
    if (!waveformArray) return 'translate(0px, 0px)';

    const totalFrames = waveformArray.length;
    const currentIndex = Math.floor(waveProgress * (totalFrames - 1));
    
    const currentShakeValue = waveformArray[currentIndex] || 0;
    const shakeIntensityMultiplier = 1500; 
    const randomAngle = Math.random() * Math.PI * 2;
    
    const x = Math.cos(randomAngle) * currentShakeValue * shakeIntensityMultiplier;
    const y = Math.sin(randomAngle) * currentShakeValue * shakeIntensityMultiplier;

    return `translate(${x}px, ${y}px)`;
  }, [waveProgress, gameState, simulationOutput]);

  // INJECTED 3 (CONT): Applied the shakeTransform to the inline style of the map container
  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <div 
        ref={mapContainer} 
        className="w-full h-full" 
        style={{ 
          transform: shakeTransform,
          transition: 'transform 0.05s linear' 
        }} 
      />
      
      {selectedUnitType && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-red-950/90 backdrop-blur-sm border border-red-500 text-red-500 px-6 py-3 rounded-none shadow-[0_0_20px_rgba(220,38,38,0.4)] pointer-events-none">
          <p className="text-sm font-bold tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Awaiting Deployment: {selectedUnitType}
          </p>
        </div>
      )}
    </div>
  );
};