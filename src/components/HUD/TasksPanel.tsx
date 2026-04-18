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
}

export const TasksPanel = ({ gameState, magnitude, unitsDeployed, epicenterSet }: TasksPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getTasks = (): Task[] => {
    const tasks: Task[] = [];

    if (gameState === 'SETUP') {
      tasks.push({
        id: '1',
        title: 'Lock epicenter on grid',
        status: epicenterSet ? 'completed' : 'in-progress',
        priority: 'high'
      });
      tasks.push({
        id: '2',
        title: 'Calibrate seismic magnitude',
        status: magnitude !== 6.5 ? 'completed' : 'pending',
        priority: 'medium'
      });
      tasks.push({
        id: '3',
        title: `Deploy response units (${unitsDeployed}/5)`,
        status: unitsDeployed > 0 ? 'in-progress' : 'pending',
        priority: 'high'
      });
    }

    if (gameState === 'PROPAGATING') {
      tasks.push({
        id: '1',
        title: 'Monitor wave velocity',
        status: 'in-progress',
        priority: 'high'
      });
    }

    return tasks;
  };

  const tasks = getTasks();
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />;
      default:
        return <Circle className="w-4 h-4 text-red-900" />;
    }
  };

  return (
    <div className="absolute top-4 left-4 z-20 font-mono">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-black/80 hover:bg-red-950/40 backdrop-blur-md border border-red-900/50 px-4 py-2 shadow-[0_0_15px_rgba(220,38,38,0.1)] transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,1)]" />
          <span className="text-xs font-bold tracking-widest text-red-500 uppercase">
            Tasks {completedCount}/{tasks.length}
          </span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown className="w-4 h-4 text-red-500/70" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 w-80 bg-black/90 backdrop-blur-lg border border-red-900/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-red-900/30 bg-red-950/20">
              <h3 className="text-xs font-bold tracking-[0.2em] text-red-500 uppercase">Mission Objectives</h3>
            </div>

            {/* Task List */}
            <div className="p-2 max-h-96 overflow-y-auto">
              {tasks.map((task) => (
                <div key={task.id} className="p-3 mb-1 border border-transparent hover:border-red-900/30 hover:bg-red-950/10 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                    <div className="flex-1">
                      <p className={`text-xs tracking-wide ${task.status === 'completed' ? 'line-through text-red-900' : 'text-red-100'}`}>
                        {task.title.toUpperCase()}
                      </p>
                      <span className={`text-[9px] px-1.5 py-0.5 mt-2 inline-block border ${
                        task.priority === 'high' ? 'border-red-600 text-red-500 bg-red-950/40' : 'border-red-900 text-red-700'
                      }`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Progress */}
            <div className="p-3 border-t border-red-900/30 bg-black/40">
              <div className="flex items-center justify-between text-[10px] text-red-500/50 mb-2 tracking-widest">
                <span>SYNC PROGRESS</span>
                <span>{Math.round((completedCount / tasks.length) * 100)}%</span>
              </div>
              <div className="w-full bg-red-950/30 h-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / tasks.length) * 100}%` }}
                  className="bg-red-600 h-full shadow-[0_0_8px_rgba(220,38,38,0.8)]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};