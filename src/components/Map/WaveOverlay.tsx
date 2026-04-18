import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface Position {
  lat: number;
  lng: number;
}

interface WaveOverlayProps {
  epicenter: Position;
  progress: number;
}

export const WaveOverlay = ({ epicenter, progress }: WaveOverlayProps) => {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);

  useEffect(() => {
    if (!map) return;

    class WaveCanvasOverlay extends google.maps.OverlayView {
      private canvas: HTMLCanvasElement;
      private epicenter: Position;
      private progress: number;

      constructor(epicenter: Position, progress: number) {
        super();
        this.epicenter = epicenter;
        this.progress = progress;
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'none';
        canvasRef.current = this.canvas;
      }

      onAdd() {
        const panes = this.getPanes();
        if (panes) {
          panes.overlayLayer.appendChild(this.canvas);
        }
      }

      draw() {
        const overlayProjection = this.getProjection();
        if (!overlayProjection) return;

        const point = overlayProjection.fromLatLngToDivPixel(
          new google.maps.LatLng(this.epicenter.lat, this.epicenter.lng)
        );

        if (!point) return;

        const mapDiv = map.getDiv();
        const width = mapDiv.offsetWidth;
        const height = mapDiv.offsetHeight;

        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        // Calculate radius in pixels based on zoom
        const maxRadiusKm = 100;
        const zoom = map.getZoom() || 11;
        const metersPerPixel = 156543.03392 * Math.cos(this.epicenter.lat * Math.PI / 180) / Math.pow(2, zoom);
        const maxRadiusPixels = (maxRadiusKm * 1000) / metersPerPixel;
        const currentRadius = maxRadiusPixels * this.progress;

        // Draw expanding wave with glow effect
        for (let i = 0; i < 3; i++) {
          const offset = i * 15;
          const alpha = 0.3 - i * 0.1;

          const gradient = ctx.createRadialGradient(
            point.x, point.y, currentRadius - offset,
            point.x, point.y, currentRadius + offset
          );

          gradient.addColorStop(0, `rgba(239, 68, 68, 0)`);
          gradient.addColorStop(0.5, `rgba(239, 68, 68, ${alpha})`);
          gradient.addColorStop(1, `rgba(239, 68, 68, 0)`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(point.x, point.y, currentRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Inner pulsing circle
        ctx.fillStyle = 'rgba(220, 38, 38, 0.4)';
        ctx.beginPath();
        ctx.arc(point.x, point.y, currentRadius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Outer ring
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(point.x, point.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      onRemove() {
        if (this.canvas.parentNode) {
          this.canvas.parentNode.removeChild(this.canvas);
        }
      }

      updateProgress(newProgress: number) {
        this.progress = newProgress;
        this.draw();
      }
    }

    if (!overlayRef.current) {
      const overlay = new WaveCanvasOverlay(epicenter, progress);
      overlay.setMap(map);
      overlayRef.current = overlay;
    } else {
      (overlayRef.current as any).updateProgress(progress);
    }

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, epicenter, progress]);

  return null;
};
