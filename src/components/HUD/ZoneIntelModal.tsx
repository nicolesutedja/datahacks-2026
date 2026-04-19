import { motion } from 'motion/react';
import { AlertTriangle, Hammer, X } from 'lucide-react';

interface ZoneIntelModalProps {
  zone: any;
  currentFunds: number;
  onUpgrade: (zoneId: string) => void;
  onClose: () => void;
}

export const ZoneIntelModal = ({ zone, currentFunds, onUpgrade, onClose }: ZoneIntelModalProps) => {
  const upgradeCost = 3000000; 
  const upgradeName = zone.type === 'liquefaction' ? 'Deep Soil Mixing' : 'Seismic Retrofit';
  const fact = zone.type === 'liquefaction' 
    ? "Liquefaction occurs when seismic waves increase water pressure in loose soil, causing it to behave like a liquid. Upgrading via deep soil mixing stabilizes the foundation."
    : "Unreinforced structures are highly vulnerable to lateral sheer stress. Retrofitting prevents catastrophic collapse.";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-[450px] bg-black border border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.4)] font-mono"
      >
        <div className="p-3 bg-red-950 flex justify-between items-center border-b border-red-500">
          <span className="text-red-500 font-bold tracking-widest uppercase flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Sector Analysis
          </span>
          <button onClick={onClose}><X className="text-red-500 hover:text-white" /></button>
        </div>

        <div className="p-6">
          <h2 className="text-xl text-white font-bold uppercase mb-2">
            Risk: {zone.type}
          </h2>
          
          <div className="mb-6">
            <div className="flex justify-between text-xs text-red-500/70 mb-1 tracking-widest">
              <span>STRUCTURAL INTEGRITY</span>
              <span>{zone.health}%</span>
            </div>
            <div className="w-full bg-red-950 h-2">
              <div 
                className={`h-full ${zone.health < 50 ? 'bg-red-500' : 'bg-orange-500'}`} 
                style={{ width: `${zone.health}%` }} 
              />
            </div>
          </div>

          <div className="p-4 bg-red-950/30 border border-red-900 mb-6 text-xs text-red-300 leading-relaxed">
            <span className="font-bold text-red-500 block mb-1">AI INTEL:</span>
            {fact}
          </div>

          <button 
            onClick={() => onUpgrade(zone.id)}
            disabled={currentFunds < upgradeCost || zone.health >= 100}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-black font-bold uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-30 disabled:bg-red-900 disabled:cursor-not-allowed transition-colors"
          >
            <Hammer className="w-4 h-4" />
            Initiate {upgradeName} ($3M)
          </button>
        </div>
      </motion.div>
    </div>
  );
};