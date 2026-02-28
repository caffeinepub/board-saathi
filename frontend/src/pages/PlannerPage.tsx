import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetPlannerTasksForMonth } from '../hooks/useQueries';
import DailyView from '../components/DailyView';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function PlannerPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  // selectedDay is just the day-of-month number (or null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // month+1 because our hook uses 1-indexed months
  const { data: tasks = [] } = useGetPlannerTasksForMonth(viewYear, viewMonth + 1);

  // Build a map: day -> task count for the current view month
  const taskCountByDay: Record<number, number> = {};
  const completedByDay: Record<number, number> = {};
  tasks.forEach((task) => {
    const d = new Date(task.date); // task.date is now a number (ms timestamp)
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate();
      taskCountByDay[day] = (taskCountByDay[day] || 0) + 1;
      if (task.completed) {
        completedByDay[day] = (completedByDay[day] || 0) + 1;
      }
    }
  });

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setDialogOpen(true);
  };

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const selectedDateLabel = selectedDay
    ? new Date(viewYear, viewMonth, selectedDay).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Study Planner</h1>
        <Button
          size="sm"
          onClick={() => { setSelectedDay(today.getDate()); setDialogOpen(true); }}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />Today
        </Button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {MONTHS[viewMonth]} {viewYear}
        </h2>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="bg-card rounded-xl border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells for first week offset */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-14 border-b border-r border-border/50" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const count = taskCountByDay[day] || 0;
            const done = completedByDay[day] || 0;
            const allDone = count > 0 && done === count;
            const todayCell = isToday(day);

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`h-14 border-b border-r border-border/50 flex flex-col items-center justify-start pt-1.5 gap-0.5 transition-colors hover:bg-muted/50 ${
                  todayCell ? 'bg-primary/5' : ''
                }`}
              >
                <span
                  className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    todayCell
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {day}
                </span>
                {count > 0 && (
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      allDone
                        ? 'bg-green-100 text-green-700'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {done}/{count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-primary/10" />
          <span>Has tasks</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-100" />
          <span>All done</span>
        </div>
      </div>

      {/* Daily View Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              {selectedDateLabel}
            </DialogTitle>
          </DialogHeader>
          {selectedDay !== null && (
            <DailyView
              year={viewYear}
              month={viewMonth + 1}
              date={selectedDay}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
