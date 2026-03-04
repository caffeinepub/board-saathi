import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddPlannerTask,
  useCompletePlannerTask,
  useDeletePlannerTask,
  useGetPlannerTasksForDate,
} from "../hooks/useQueries";

interface DailyViewProps {
  year: number;
  month: number;
  date: number;
}

export default function DailyView({ year, month, date }: DailyViewProps) {
  const { data: tasks = [], isLoading } = useGetPlannerTasksForDate(
    year,
    month,
    date,
  );
  const addTask = useAddPlannerTask();
  const completeTask = useCompletePlannerTask();
  const deleteTask = useDeletePlannerTask();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("09:00");

  const handleAdd = async () => {
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    try {
      await addTask.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        year,
        month,
        date,
        startTime,
      });
      toast.success("Task added!");
      setTitle("");
      setDescription("");
      setStartTime("09:00");
      setShowForm(false);
    } catch {
      toast.error("Failed to add task");
    }
  };

  const handleToggleComplete = async (taskId: number, completed: boolean) => {
    try {
      await completeTask.mutateAsync({ taskId, completed: !completed });
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async (taskId: number) => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""} for this day
        </p>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="space-y-1">
            <Label htmlFor="task-title" className="text-xs">
              Title *
            </Label>
            <Input
              id="task-title"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="task-desc" className="text-xs">
              Description
            </Label>
            <Input
              id="task-desc"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="task-time" className="text-xs">
              Start Time
            </Label>
            <Input
              id="task-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={addTask.isPending}
              className="flex-1"
            >
              {addTask.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {tasks.length === 0 && !showForm ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No tasks for this day</p>
          <p className="text-xs mt-1">
            Click &quot;Add Task&quot; to get started
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                task.completed ? "bg-muted/30 opacity-60" : "bg-background"
              }`}
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() =>
                  handleToggleComplete(task.id, task.completed)
                }
                disabled={completeTask.isPending}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {task.description}
                  </p>
                )}
                {task.startTime && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {task.startTime}
                    </span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                onClick={() => handleDelete(task.id)}
                disabled={deleteTask.isPending}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
