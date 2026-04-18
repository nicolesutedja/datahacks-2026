import { useEffect } from 'react';

interface VisualData {
  waveform: number[][]; // (16x600) for screen shake frequency
  maxAmplitude: number;  // (single number) for visual intensity
}

export function useSeismicVisuals(data: VisualData | null, isSimulating: boolean) {
  useEffect(() => {
    // 1. Cleanup & Panic Mode (Screen Shake) reset
    if (!isSimulating || !data || data.waveform.length === 0) {
        document.body.style.transform = 'translateY(0px)';
        return;
    }

    let frame = 0;
    // Use Receiver 0's waveform for the browser screen shake
    const mainWave = data.waveform[0]; 
    const totalFrames = mainWave.length; 
    
    // Convert mathematical amplitude into DOM pixel displacement
    // Your amplitude is ~0.03, so 1000 multiplier gives ~30px shake.
    const intensityMultiplier = 1000; 
    let animationId: number;

    // --- Part A: The Panic Mode Shake Loop ---
    const animatePanicMode = () => {
      if (frame < totalFrames) {
        // Vibrate document.body translateY by the exact amplitude at this frame
        const pixelShift = mainWave[frame] * intensityMultiplier;
        document.body.style.transform = `translateY(${pixelShift}px)`;
        
        frame++;
        animationId = requestAnimationFrame(animatePanicMode);
      } else {
        // Disaster over, reset screen position
        document.body.style.transform = 'translateY(0px)';
      }
    };

    // --- Part B: Start the visualizations ---
    animatePanicMode(); // Start screen shake immediately

    // 2. Cleanup function
    return () => {
      cancelAnimationFrame(animationId);
      document.body.style.transform = 'translateY(0px)';
    };
  }, [data, isSimulating]);
}