import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddPlannerTask } from "../hooks/useQueries";

interface RecurringTask {
  id: string;
  title: string;
  description: string;
  scheduleType: "dayOfWeek" | "dayOfMonth";
  dayOfWeek?: number;
  dayOfMonth?: number;
  duration: 3 | 6 | 12;
  startDate: string;
  createdAt: number;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getStorageKey(): string {
  const principalId = localStorage.getItem("bs_principalId");
  const userId = localStorage.getItem("bs_userId");
  const id = principalId ?? userId ?? "guest";
  return `oneTimePlanner_${id}`;
}

function loadTasks(): RecurringTask[] {
  try {
    const raw = localStorage.getItem(getStorageKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: RecurringTask[]) {
  localStorage.setItem(getStorageKey(), JSON.stringify(tasks));
}

function generateDates(
  task: RecurringTask,
): { year: number; month: number; date: number }[] {
  const results: { year: number; month: number; date: number }[] = [];
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + task.duration);

  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);

  while (cur <= end) {
    let match = false;
    if (task.scheduleType === "dayOfWeek" && task.dayOfWeek !== undefined) {
      match = cur.getDay() === task.dayOfWeek;
    } else if (
      task.scheduleType === "dayOfMonth" &&
      task.dayOfMonth !== undefined
    ) {
      match = cur.getDate() === task.dayOfMonth;
    }
    if (match) {
      results.push({
        year: cur.getFullYear(),
        month: cur.getMonth() + 1,
        date: cur.getDate(),
      });
    }
    cur.setDate(cur.getDate() + 1);
  }
  return results;
}

function getScheduleLabel(task: RecurringTask): string {
  const durLabel =
    task.duration === 12
      ? "1 Year"
      : `${task.duration} Month${task.duration > 1 ? "s" : ""}`;
  if (task.scheduleType === "dayOfWeek" && task.dayOfWeek !== undefined) {
    return `Every ${FULL_DAY_NAMES[task.dayOfWeek]} for ${durLabel}`;
  }
  if (task.scheduleType === "dayOfMonth" && task.dayOfMonth !== undefined) {
    const suffix =
      task.dayOfMonth === 1
        ? "st"
        : task.dayOfMonth === 2
          ? "nd"
          : task.dayOfMonth === 3
            ? "rd"
            : "th";
    return `Every ${task.dayOfMonth}${suffix} of month for ${durLabel}`;
  }
  return durLabel;
}

export default function OneTimePlannerPage() {
  const [tasks, setTasks] = useState<RecurringTask[]>(loadTasks);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleType, setScheduleType] = useState<"dayOfWeek" | "dayOfMonth">(
    "dayOfWeek",
  );
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedDate, setSelectedDate] = useState(1);
  const [duration, setDuration] = useState<3 | 6 | 12>(6);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  const addPlannerTask = useAddPlannerTask();

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    const newTask: RecurringTask = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      scheduleType,
      dayOfWeek: scheduleType === "dayOfWeek" ? selectedDay : undefined,
      dayOfMonth: scheduleType === "dayOfMonth" ? selectedDate : undefined,
      duration,
      startDate: new Date().toISOString().split("T")[0],
      createdAt: Date.now(),
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    saveTasks(updated);
    setTitle("");
    setDescription("");
    toast.success("Recurring task saved!");
  };

  const handleDelete = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveTasks(updated);
    toast.success("Task deleted");
  };

  const handleScheduleNow = async (task: RecurringTask) => {
    setSchedulingId(task.id);
    try {
      const dates = generateDates(task);
      let scheduled = 0;
      for (const d of dates) {
        await addPlannerTask.mutateAsync({
          title: task.title,
          description: task.description,
          year: d.year,
          month: d.month,
          date: d.date,
          startTime: "09:00",
        });
        scheduled++;
        // Reminder 3 days before
        const reminderDate = new Date(d.year, d.month - 1, d.date);
        reminderDate.setDate(reminderDate.getDate() - 3);
        if (reminderDate >= new Date()) {
          await addPlannerTask.mutateAsync({
            title: `\u23F0 Reminder: ${task.title} in 3 days`,
            description: task.description,
            year: reminderDate.getFullYear(),
            month: reminderDate.getMonth() + 1,
            date: reminderDate.getDate(),
            startTime: "09:00",
          });
        }
      }
      toast.success(`Scheduled ${scheduled} occurrences in Planner!`);
    } catch {
      toast.error("Failed to schedule some tasks");
    } finally {
      setSchedulingId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-primary/10">
            <CalendarClock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">One-Time Planner</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Set recurring tasks that auto-schedule every week or month
        </p>
      </div>

      {/* Add Task Form */}
      <Card data-ocid="one_time_planner.panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Recurring Task
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs mb-1.5 block">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly revision session"
              data-ocid="one_time_planner.title.input"
            />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">
              Description (optional)
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you do?"
              rows={2}
              data-ocid="one_time_planner.description.textarea"
            />
          </div>

          {/* Schedule type */}
          <div>
            <Label className="text-xs mb-2 block">Repeat Every</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScheduleType("dayOfWeek")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  scheduleType === "dayOfWeek"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
                data-ocid="one_time_planner.day_of_week.toggle"
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setScheduleType("dayOfMonth")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  scheduleType === "dayOfMonth"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
                data-ocid="one_time_planner.day_of_month.toggle"
              >
                Month
              </button>
            </div>
          </div>

          {/* Day/Date selector */}
          {scheduleType === "dayOfWeek" ? (
            <div>
              <Label className="text-xs mb-2 block">Day of Week</Label>
              <div className="flex gap-1.5 flex-wrap">
                {DAY_NAMES.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(i)}
                    className={`w-10 h-10 rounded-full text-xs font-semibold border transition-colors ${
                      selectedDay === i
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                    data-ocid={"one_time_planner.day.button"}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-xs mb-2 block">Date of Month (1–31)</Label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`w-9 h-9 rounded-lg text-xs font-semibold border transition-colors ${
                      selectedDate === d
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                    data-ocid={"one_time_planner.date.button"}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Duration */}
          <div>
            <Label className="text-xs mb-2 block">Duration</Label>
            <div className="flex gap-2">
              {([3, 6, 12] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    duration === d
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                  data-ocid="one_time_planner.duration.toggle"
                >
                  {d === 12 ? "1 Year" : `${d} Mo`}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="w-full"
            data-ocid="one_time_planner.save.button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Save Recurring Task
          </Button>
        </CardContent>
      </Card>

      {/* Saved Tasks */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Repeat className="w-4 h-4" />
          Saved Recurring Tasks
          <Badge variant="secondary">{tasks.length}</Badge>
        </h2>

        {tasks.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="one_time_planner.tasks.empty_state"
          >
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No recurring tasks yet.</p>
            <p className="text-xs mt-1">Add one above to get started!</p>
          </div>
        ) : (
          <div className="space-y-3" data-ocid="one_time_planner.tasks.list">
            {tasks.map((task, idx) => (
              <Card
                key={task.id}
                data-ocid={`one_time_planner.task.item.${idx + 1}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {task.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="text-[10px] gap-1"
                        >
                          <Clock className="w-2.5 h-2.5" />
                          {getScheduleLabel(task)}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <CalendarDays className="w-2.5 h-2.5" />
                          From {task.startDate}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleScheduleNow(task)}
                        disabled={schedulingId === task.id}
                        data-ocid={`one_time_planner.schedule.button.${idx + 1}`}
                        className="text-xs h-7 px-2"
                      >
                        {schedulingId === task.id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        )}
                        Schedule
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            data-ocid={`one_time_planner.task.delete_button.${idx + 1}`}
                            className="text-xs h-7 px-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-ocid="one_time_planner.delete.dialog">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{task.title}
                              &quot;? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="one_time_planner.delete.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(task.id)}
                              data-ocid="one_time_planner.delete.confirm_button"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
