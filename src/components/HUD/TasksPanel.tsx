import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface TasksPanelProps {
  gameState: string;
  magnitude: number;
  unitsDeployed: number;
  epicenterSet: boolean;
  exploredZonesCount?: number; 
}

export const TasksPanel = ({
  gameState,
  unitsDeployed,
  exploredZonesCount = 0, 
}: TasksPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const getTasks = (): Task[] => {
    const tasks: Task[] = [];

    if (gameState === 'SETUP') {
      tasks.push({
        id: '1',
        title: `Scan unexplored regions to assess the damage (${Math.min(exploredZonesCount, 3)}/3)`,
        status: exploredZonesCount >= 3 ? 'completed' : exploredZonesCount > 0 ? 'in-progress' : 'pending',
        priority: 'high',
      });

      tasks.push({
        id: '2',
        title: `Deploy assets to mitigate damage (${Math.min(unitsDeployed, 3)}/3)`,
        status: unitsDeployed >= 3 ? 'completed' : unitsDeployed > 0 ? 'in-progress' : 'pending',
        priority: 'high',
      });

      tasks.push({
        id: '3',
        title: 'Click "Run simulation" to see the results',
        status: 'pending', // Completes automatically when user clicks Run
        priority: 'medium',
      });
    }

    if (gameState === 'PROPAGATING') {
      tasks.push({
        id: '1',
        title: 'Monitor wave propagation',
        status: 'in-progress',
        priority: 'high',
      });
      tasks.push({
        id: '2',
        title: 'Awaiting tactical debrief',
        status: 'pending',
        priority: 'medium',
      });
    }

    return tasks;
  };

  const tasks = getTasks();
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] rounded-full" />;
      case 'in-progress':
        return <AlertCircle size={16} className="text-amber-400 animate-pulse" />;
      default:
        return <Circle size={16} className="text-red-900" />;
    }
  };

  return (
    <div className="pointer-events-auto font-mono">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 border border-red-900/50 bg-black/90 px-4 py-3 backdrop-blur-md shadow-[0_0_15px_rgba(220,38,38,0.15)] transition-all hover:bg-red-950/40"
      >
        <ChevronDown
          size={16}
          className={`text-red-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
          Mission Objectives [{completedCount}/{tasks.length}]
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mt-2 w-80 border border-red-900/50 bg-black/95 p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(220,38,38,0.2)]"
          >
            {/* CRT Scanline effect */}
            <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />

            <div className="relative z-10 space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 border p-3 transition-colors duration-300
                    ${task.status === 'completed' ? 'border-green-900/30 bg-green-950/10' : 
                      task.status === 'in-progress' ? 'border-amber-900/30 bg-amber-950/10' : 
                      'border-red-900/20 bg-black'}`
                  }
                >
                  <div className="mt-0.5 shrink-0">{getStatusIcon(task.status)}</div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[11px] font-bold uppercase tracking-widest
                      ${task.status === 'completed' ? 'text-green-500' : 
                        task.status === 'in-progress' ? 'text-amber-400' : 
                        'text-red-500/70'}`
                    }>
                      {task.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative z-10 mt-5 pt-4 border-t border-red-900/30">
              <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">
                <span>Readiness Protocol</span>
                <span className={progress === 100 ? 'text-green-500' : ''}>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-red-950 border border-red-900/50">
                <div
                  className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.8)]'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};