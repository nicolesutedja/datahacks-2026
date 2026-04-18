import { useEffect, useRef, useState } from 'react';

interface SeismicRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
  createdAt: number;
}

export function SeismicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const timeRef = useRef(0);
  const ringsRef = useRef<SeismicRing[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawGrid = () => {
      ctx.strokeStyle = 'rgba(139, 0, 0, 0.06)';
      ctx.lineWidth = 0.5;

      const gridSizeX = 40;
      const gridSizeY = 40;

      const offsetX = (mousePos.x * 0.05) % gridSizeX;
      const offsetY = (mousePos.y * 0.05) % gridSizeY;

      for (let x = -gridSizeX + offsetX; x < canvas.width + gridSizeX; x += gridSizeX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = -gridSizeY + offsetY; y < canvas.height + gridSizeY; y += gridSizeY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    const drawSeismographWaveforms = () => {
      const numWaveforms = 12;
      const spacing = canvas.height / (numWaveforms + 1);

      for (let i = 0; i < numWaveforms; i++) {
        const baseY = spacing * (i + 1);
        const mouseDistanceY = Math.abs(mousePos.y - baseY);
        const mouseInfluence = Math.max(0, 1 - mouseDistanceY / 300);

        ctx.strokeStyle = `rgba(220, 20, 20, ${0.15 + mouseInfluence * 0.3})`;
        ctx.lineWidth = 1.5 + mouseInfluence * 1.5;
        ctx.beginPath();

        for (let x = 0; x < canvas.width; x += 2) {
          const distanceFromMouse = Math.sqrt(
            Math.pow(x - mousePos.x, 2) + Math.pow(baseY - mousePos.y, 2)
          );
          const proximityFactor = Math.max(0, 1 - distanceFromMouse / 500);

          const frequency = 0.03 + proximityFactor * 0.08;
          const amplitude = 8 + proximityFactor * 35 + mouseInfluence * 20;

          const mouseWarp = proximityFactor * Math.sin(distanceFromMouse / 30 + timeRef.current * 0.05) * 25;

          const phase = (x * frequency) + (timeRef.current * 0.02) + (i * 0.5);
          const noise = Math.sin(phase * 2.3) * Math.sin(phase * 0.7) * 0.3;
          const spike = Math.random() < 0.008 ? (Math.random() - 0.5) * 50 * proximityFactor : 0;

          const y = baseY +
                    Math.sin(phase) * amplitude +
                    noise * amplitude * 0.5 +
                    spike +
                    mouseWarp;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    };

    const drawDataMarkers = () => {
      ctx.fillStyle = 'rgba(255, 50, 50, 0.4)';
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.6)';
      ctx.lineWidth = 1;

      const numMarkers = 15;
      for (let i = 0; i < numMarkers; i++) {
        const x = (canvas.width / numMarkers) * i + (timeRef.current % 100);
        const distToMouse = Math.abs(x - mousePos.x);
        const scale = distToMouse < 150 ? 1 + (150 - distToMouse) / 150 : 1;

        if (x < canvas.width) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x, canvas.height / 2, 2 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const drawSeismicRings = () => {
      ringsRef.current = ringsRef.current.filter(ring => ring.alpha > 0);

      ringsRef.current.forEach((ring, index) => {
        ring.radius += ring.speed;
        ring.alpha = Math.max(0, 1 - ring.radius / ring.maxRadius);

        // Check interaction with other rings
        ringsRef.current.forEach((otherRing, otherIndex) => {
          if (index !== otherIndex) {
            const distance = Math.sqrt(
              Math.pow(ring.x - otherRing.x, 2) + Math.pow(ring.y - otherRing.y, 2)
            );
            const radiusDiff = Math.abs(ring.radius - otherRing.radius);

            if (radiusDiff < 30 && distance < ring.radius + otherRing.radius) {
              const interference = Math.sin(timeRef.current * 0.1) * 0.3;
              ring.alpha = Math.min(1, ring.alpha + interference * 0.2);
            }
          }
        });

        // Draw multiple concentric rings for seismic effect
        for (let i = 0; i < 3; i++) {
          const offset = i * 15;
          const currentRadius = ring.radius + offset;
          const currentAlpha = ring.alpha * (1 - i * 0.3);

          ctx.strokeStyle = `rgba(220, 38, 38, ${currentAlpha * 0.6})`;
          ctx.lineWidth = 2 - i * 0.5;
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, currentRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw distortion waves
        const numPoints = 64;
        ctx.strokeStyle = `rgba(255, 50, 50, ${ring.alpha * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const distortion = Math.sin(angle * 4 + timeRef.current * 0.1) * 8 * ring.alpha;
          const r = ring.radius + distortion;
          const x = ring.x + Math.cos(angle) * r;
          const y = ring.y + Math.sin(angle) * r;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });
    };

    const drawGlitchScanlines = () => {
      if (Math.random() > 0.97) {
        const numLines = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numLines; i++) {
          const y = Math.random() * canvas.height;
          ctx.strokeStyle = `rgba(255, 0, 0, ${Math.random() * 0.15})`;
          ctx.lineWidth = Math.random() * 2 + 0.5;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawGrid();
      drawDataMarkers();
      drawSeismographWaveforms();
      drawSeismicRings();
      drawGlitchScanlines();

      timeRef.current += 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mousePos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ringsRef.current.push({
      x,
      y,
      radius: 0,
      maxRadius: 400,
      speed: 3,
      alpha: 1,
      createdAt: timeRef.current,
    });
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      className="fixed inset-0 w-full h-full cursor-crosshair"
      style={{ background: '#000000' }}
    />
  );
}
