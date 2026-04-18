import { useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { WaveOverlay } from './WaveOverlay';


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

interface GoogleMapContainerProps {
  epicenter: Position | null;
  units: Unit[];
  waveProgress: number;
  gameState: string;
  onMapClick: (lat: number, lng: number) => void;
  selectedUnitType: Unit['type'] | null;
}

const LA_JOLLA_CENTER = { lat: 32.8328, lng: -117.2713 };

export const GoogleMapContainer = ({
  epicenter,
  units,
  waveProgress,
  gameState,
  onMapClick,
  selectedUnitType
}: GoogleMapContainerProps) => {
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.detail?.latLng) {
        const lat = e.detail.latLng.lat;
        const lng = e.detail.latLng.lng;
        onMapClick(lat, lng);
      }
    },
    [onMapClick]
  );

  const getUnitIcon = (type: Unit['type']) => {
    switch (type) {
      case 'ambulance':
        return '🚑';
      case 'fire':
        return '🚒';
      case 'hospital':
        return '🏥';
    }
  };

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div className="relative w-full h-full">
        <Map
          mapId="seismic-sentinel-map"
          defaultCenter={LA_JOLLA_CENTER}
          defaultZoom={11}
          gestureHandling="greedy"
          disableDefaultUI={false}
          onClick={handleMapClick}
          mapTypeId={gameState === 'PROPAGATING' ? 'hybrid' : 'roadmap'}
          className="w-full h-full"
        >
          {/* Epicenter Marker */}
          {epicenter && (
            <AdvancedMarker position={epicenter}>
              <div className="relative">
                <div className="absolute -translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-8 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-500/50 border-2 border-red-400" />
                  <div className="absolute inset-0 w-8 h-8 bg-red-600/30 rounded-full animate-ping" />
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Unit Markers */}
          {units.map((unit) => (
            <AdvancedMarker key={unit.id} position={unit.position}>
              <div className="relative group">
                <div
                  className={`
                    text-2xl transform transition-all duration-300
                    ${unit.status === 'DEPLOYING' ? 'animate-bounce' : 'hover:scale-125'}
                  `}
                >
                  {getUnitIcon(unit.type)}
                </div>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-slate-900/95 text-amber-400 px-2 py-1 rounded text-xs whitespace-nowrap border border-amber-500/30 font-mono">
                    {unit.status}
                  </div>
                </div>
              </div>
            </AdvancedMarker>
          ))}

          {/* Wave Overlay */}
          {epicenter && gameState === 'PROPAGATING' && (
            <WaveOverlay epicenter={epicenter} progress={waveProgress} />
          )}
        </Map>

        {/* Cursor indicator when placing units */}
        {selectedUnitType && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 px-4 py-2 rounded-lg font-mono font-bold text-sm shadow-lg animate-pulse">
            Click map to deploy {selectedUnitType.toUpperCase()}
          </div>
        )}
      </div>
    </APIProvider>
  );
};
