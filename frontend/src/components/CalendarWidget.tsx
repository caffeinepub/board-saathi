import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';

function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

function getDaysLeftInMonth(date: Date): number {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return lastDay - date.getDate();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export default function CalendarWidget() {
  const [open, setOpen] = useState(false);
  const now = useCurrentTime();
  const daysLeft = getDaysLeftInMonth(now);
  const monthName = now.toLocaleDateString('en-IN', { month: 'long' });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-500 hover:text-teal-600 hover:bg-teal-50"
          title="Open Calendar"
        >
          <CalendarIcon size={20} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 shadow-xl border border-gray-200 rounded-2xl overflow-hidden"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-teal-100 uppercase tracking-wide">
              {daysLeft === 0
                ? `Last day of ${monthName}!`
                : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in ${monthName}`}
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-teal-200 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="text-sm font-semibold">{formatDate(now)}</div>
          <div className="text-xl font-bold tracking-wider mt-0.5 font-mono">{formatTime(now)}</div>
        </div>

        {/* Calendar */}
        <div className="p-2">
          <Calendar
            mode="single"
            selected={now}
            defaultMonth={now}
            className="rounded-none border-0"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
