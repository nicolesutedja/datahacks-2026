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
        title: 'Set epicenter location on map',
        status: epicenterSet ? 'completed' : 'in-progress',
        priority: 'high'
      });

      tasks.push({
        id: '2',
        title: 'Adjust earthquake magnitude',
        status: magnitude !== 6.5 ? 'completed' : 'pending',
        priority: 'medium'
      });

      tasks.push({
        id: '3',
        title: `Deploy response units (${unitsDeployed}/5)`,
        status: unitsDeployed > 0 ? 'in-progress' : 'pending',
        priority: 'high'
      });

      tasks.push({
        id: '4',
        title: 'Start simulation',
        status: 'pending',
        priority: 'high'
      });
    }

    if (gameState === 'PROPAGATING') {
      tasks.push({
        id: '1',
        title: 'Monitor wave propagation',
        status: 'in-progress',
        priority: 'high'
      });

      tasks.push({
        id: '2',
        title: 'Deploy additional resources if needed',
        status: unitsDeployed >= 5 ? 'completed' : 'in-progress',
        priority: 'medium'
      });

      tasks.push({
        id: '3',
        title: 'Wait for simulation completion',
        status: 'in-progress',
        priority: 'low'
      });
    }

    if (gameState === 'RESULTS') {
      tasks.push({
        id: '1',
        title: 'Review performance metrics',
        status: 'in-progress',
        priority: 'high'
      });

      tasks.push({
        id: '2',
        title: 'Analyze AI recommendations',
        status: 'pending',
        priority: 'medium'
      });

      tasks.push({
        id: '3',
        title: 'Plan next simulation',
        status: 'pending',
        priority: 'low'
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
        return <AlertCircle className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="absolute top-4 left-4 z-20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white rounded-lg shadow-lg px-4 py-3 border border-slate-200 hover:shadow-xl transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="font-medium text-slate-900">
            Tasks {completedCount}/{tasks.length}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-slate-600" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-900">Current Tasks</h3>
              <p className="text-xs text-slate-600 mt-1">
                {completedCount === tasks.length
                  ? 'All tasks completed'
                  : `${tasks.length - completedCount} tasks remaining`}
              </p>
            </div>

            <div className="p-2 max-h-96 overflow-y-auto">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 rounded-lg hover:bg-slate-50 transition-colors mb-1"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Progress</span>
                <span>{Math.round((completedCount / tasks.length) * 100)}%</span>
              </div>
              <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / tasks.length) * 100}%` }}
                  className="bg-blue-500 h-1.5 rounded-full"
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
