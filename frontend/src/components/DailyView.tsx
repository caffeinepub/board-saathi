import { useState } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useGetPlannerTasksForDate,
  useAddPlannerTask,
  useCompletePlannerTask,
  useDeletePlannerTask,
} from '../hooks/useQueries';

interface DailyViewProps {
  year: number;
  month: number;
  date: number;
}

export default function DailyView({ year, month, date }: DailyViewProps) {
  const { data: tasks = [], isLoading } = useGetPlannerTasksForDate(year, month, date);
  const addTask = useAddPlannerTask();
  const completeTask = useCompletePlannerTask();
  const deleteTask = useDeletePlannerTask();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');

  const handleAdd = async () => {
    if (!title.trim()) return;
    await addTask.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      year,
      month,
      date,
      startTime,
    });
    setTitle('');
    setDescription('');
    setStartTime('09:00');
    setOpen(false);
  };

  const handleToggleComplete = async (taskId: bigint, completed: boolean) => {
    await completeTask.mutateAsync({
      taskId,
      completed: !completed,
      year,
      month,
      date,
    });
  };

  const handleDelete = async (taskId: bigint) => {
    await deleteTask.mutateAsync({ taskId, year, month, date });
  };

  const dateLabel = new Date(year, month - 1, date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{dateLabel}</h2>
          <p className="text-xs text-gray-400">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus size={14} className="mr-1" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="task-title">Title *</Label>
                <Input
                  id="task-title"
                  placeholder="e.g., Study Chapter 5"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="task-desc">Description</Label>
                <Input
                  id="task-desc"
                  placeholder="Optional details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="task-time">Start Time</Label>
                <Input
                  id="task-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleAdd}
                disabled={addTask.isPending || !title.trim()}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                {addTask.isPending ? 'Adding...' : 'Add Task'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Clock size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No tasks for this day</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={String(task.id)}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                task.completed
                  ? 'bg-gray-50 border-gray-100 opacity-60'
                  : 'bg-white border-gray-200 hover:border-teal-200'
              }`}
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <Clock size={11} className="text-gray-300" />
                  <span className="text-xs text-gray-400">{task.startTime}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(task.id)}
                className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
