import { useCallback, useState } from 'react';
import { useGameManager } from '../hooks/useGameManager';
import { LandingPage } from '../components/HUD/LandingPage';
import { SandboxMode } from '../components/HUD/SandboxMode';
import { GameMode } from '../components/HUD/GameMode';

export default function App() {
  // We now have 3 modes!
  const [appMode, setAppMode] = useState<'MENU' | 'SANDBOX' | 'GAME'>('MENU');

  const gameManager = useGameManager();
  const {
    gameState, epicenter, selectedUnitType, magnitude,
    setMagnitude, placeEpicenter, deployUnit, resetSimulation, GAME_STATES
  } = gameManager;

  // Shared map click handler
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (gameState === GAME_STATES.SETUP && !epicenter) {
      placeEpicenter(lat, lng);
    } else if (selectedUnitType && (gameState === GAME_STATES.SETUP || gameState === GAME_STATES.PROPAGATING)) {
      deployUnit(lat, lng);
    }
  }, [gameState, epicenter, selectedUnitType, placeEpicenter, deployUnit, GAME_STATES]);

  // --- NAVIGATION HANDLERS ---
  const handleStartScenario = () => {
    resetSimulation();
    // Default Scenario: La Jolla
    placeEpicenter(32.8328, -117.2713); 
    setMagnitude(6.8);
    setAppMode('GAME'); // Goes to Black & Red Mode
  };

  const handleStartSandbox = () => {
    resetSimulation();
    setAppMode('SANDBOX'); // Goes to Standard Mode
  };

  const handleReturnToMenu = () => {
    resetSimulation();
    setAppMode('MENU');
  };

  // --- RENDERING ---
  if (appMode === 'MENU') {
    return (
      <LandingPage 
        onStartScenario={handleStartScenario} 
        onSandboxMode={handleStartSandbox} 
      />
    );
  }

  if (appMode === 'GAME') {
    return (
      <GameMode 
        {...gameManager} 
        handleMapClick={handleMapClick}
        onReturnToMenu={handleReturnToMenu}
      />
    );
  }

  if (appMode === 'SANDBOX') {
    return (
      <SandboxMode 
        {...gameManager} 
        handleMapClick={handleMapClick}
        onReturnToMenu={handleReturnToMenu}
      />
    );
  }

  return null;
}