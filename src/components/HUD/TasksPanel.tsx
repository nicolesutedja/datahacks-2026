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
  currentFunds: number;
  totalBudget: number;
  maxUnits: number;
}

export const TasksPanel = ({
  gameState,
  magnitude,
  unitsDeployed,
  epicenterSet,
  currentFunds,
  totalBudget,
  maxUnits,
}: TasksPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const budgetUsedPercent = Math.round(((totalBudget - currentFunds) / totalBudget) * 100);

  const getTasks = (): Task[] => {
    const tasks: Task[] = [];

    if (gameState === 'SETUP') {
      tasks.push({
        id: '1',
        title: 'Lock epicenter on grid',
        status: epicenterSet ? 'completed' : 'in-progress',
        priority: 'high',
      });

      tasks.push({
        id: '2',
        title: `Set hazard level (current M${magnitude.toFixed(1)})`,
        status: magnitude !== 6.5 ? 'completed' : 'pending',
        priority: 'medium',
      });

      tasks.push({
        id: '3',
        title: `Deploy at least 3 assets (${unitsDeployed}/3)`,
        status:
          unitsDeployed >= 3 ? 'completed' : unitsDeployed > 0 ? 'in-progress' : 'pending',
        priority: 'high',
      });

      tasks.push({
        id: '4',
        title: `Use budget efficiently (${budgetUsedPercent}% used)`,
        status:
          budgetUsedPercent >= 55 && budgetUsedPercent <= 85
            ? 'completed'
            : budgetUsedPercent > 0
            ? 'in-progress'
            : 'pending',
        priority: 'medium',
      });

      tasks.push({
        id: '5',
        title: `Reach deployment capacity (${unitsDeployed}/${maxUnits})`,
        status:
          unitsDeployed === maxUnits
            ? 'completed'
            : unitsDeployed >= 3
            ? 'in-progress'
            : 'pending',
        priority: 'low',
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
        title: 'Assess readiness before debrief',
        status: 'in-progress',
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
        return <CheckCircle2 size={16} className="text-red-400" />;
      case 'in-progress':
        return <AlertCircle size={16} className="text-amber-400" />;
      default:
        return <Circle size={16} className="text-zinc-500" />;
    }
  };

  return (
    <div className="pointer-events-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 border border-red-900/50 bg-black/80 px-4 py-2 backdrop-blur-md shadow-[0_0_15px_rgba(220,38,38,0.1)] transition-all hover:bg-red-950/40"
      >
        <ChevronDown
          size={16}
          className={`text-red-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
          Tasks {completedCount}/{tasks.length}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 w-80 rounded-2xl border border-red-900/50 bg-black/90 p-4 backdrop-blur-md"
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white">
              Mission Objectives
            </h3>

            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 rounded-xl border border-red-900/25 bg-red-950/10 p-3"
                >
                  <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium uppercase tracking-[0.06em] text-zinc-100">
                      {task.title}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-red-400/80">
                      {task.priority} priority
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-red-900/30 bg-red-950/20 p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-red-400">
                <span>Mission Readiness</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-full rounded-full bg-red-500 transition-all duration-300"
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