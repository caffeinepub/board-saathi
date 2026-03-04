import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type TimerData,
  addTimer,
  deleteTimer,
  getCurrentUserId,
  getTimers,
} from "@/utils/localStorageService";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  Plus,
  Timer,
  Trash2,
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

interface CountdownResult {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function computeCountdown(
  endYear: number,
  endMonth: number,
  endDay: number,
): CountdownResult {
  const now = new Date();
  const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59);
  const totalMs = end.getTime() - now.getTime();

  if (totalMs <= 0) {
    return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  const endDate = new Date(end);
  const nowDate = new Date(now);

  let months =
    (endDate.getFullYear() - nowDate.getFullYear()) * 12 +
    (endDate.getMonth() - nowDate.getMonth());
  const tempDate = new Date(nowDate);
  tempDate.setMonth(tempDate.getMonth() + months);
  if (tempDate > endDate) months--;

  const afterMonths = new Date(nowDate);
  afterMonths.setMonth(afterMonths.getMonth() + months);
  const remainingMs = endDate.getTime() - afterMonths.getTime();

  const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  return { months, days, hours, minutes, seconds, totalMs };
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function TimerCard({
  timer,
  onDelete,
}: { timer: TimerData; onDelete: () => void }) {
  const [countdown, setCountdown] = useState<CountdownResult>(() =>
    computeCountdown(timer.endYear, timer.endMonth, timer.endDay),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(
        computeCountdown(timer.endYear, timer.endMonth, timer.endDay),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [timer.endYear, timer.endMonth, timer.endDay]);

  const isExpired = countdown.totalMs <= 0;

  return (
    <Card
      className={`relative overflow-hidden border-2 ${isExpired ? "border-muted" : "border-primary/30"}`}
    >
      <div
        className={`absolute inset-0 opacity-5 ${isExpired ? "bg-muted" : "bg-gradient-to-br from-primary to-accent"}`}
      />
      <CardHeader className="pb-2 relative">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              {timer.label}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Start: {MONTH_NAMES[timer.startMonth - 1]} {timer.startDay} → End:{" "}
              {MONTH_NAMES[timer.endMonth - 1]} {timer.endDay}, {timer.endYear}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {isExpired ? (
          <div className="text-center py-4">
            <p className="text-2xl font-bold text-muted-foreground">
              ⏰ Time's Up!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              This timer has ended
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 mt-2">
            {[
              { value: countdown.months, label: "Months" },
              { value: countdown.days, label: "Days" },
              { value: countdown.hours, label: "Hours" },
              { value: countdown.minutes, label: "Mins" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center bg-primary/10 rounded-xl p-3 border border-primary/20"
              >
                <span className="text-3xl font-black text-primary tabular-nums leading-none">
                  {String(value).padStart(2, "0")}
                </span>
                <span className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wide">
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
        {!isExpired && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">
              Live countdown
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TimerPage() {
  const navigate = useNavigate();
  const userId = getCurrentUserId() ?? "guest";
  const [timers, setTimers] = useState<TimerData[]>(() => getTimers(userId));
  const [showDialog, setShowDialog] = useState(false);

  const currentYear = new Date().getFullYear();
  const [label, setLabel] = useState("");
  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1);
  const [startDay, setStartDay] = useState(new Date().getDate());
  const [endYear, setEndYear] = useState(currentYear);
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1);
  const [endDay, setEndDay] = useState(new Date().getDate() + 1);
  const [error, setError] = useState("");

  const refreshTimers = useCallback(() => {
    setTimers(getTimers(userId));
  }, [userId]);

  const handleAdd = () => {
    if (!label.trim()) {
      setError("Please enter a timer name");
      return;
    }
    const endDate = new Date(endYear, endMonth - 1, endDay);
    const now = new Date();
    if (endDate <= now) {
      setError("End date must be in the future");
      return;
    }
    addTimer(userId, {
      label: label.trim(),
      startMonth,
      startDay,
      endYear,
      endMonth,
      endDay,
    });
    refreshTimers();
    setShowDialog(false);
    setLabel("");
    setError("");
  };

  const handleDelete = (timerId: string) => {
    deleteTimer(userId, timerId);
    refreshTimers();
  };

  const openDialog = () => {
    setLabel("");
    setStartMonth(new Date().getMonth() + 1);
    setStartDay(new Date().getDate());
    setEndYear(currentYear);
    setEndMonth(new Date().getMonth() + 1);
    setEndDay(new Date().getDate() + 1);
    setError("");
    setShowDialog(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/" })}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold">Countdown Timers</h1>
            </div>
          </div>
          <Button size="sm" onClick={openDialog} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Add Timer
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {timers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Clock className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Timers Yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Add a countdown timer to track important deadlines like exams,
              submission dates, or goals.
            </p>
            <Button onClick={openDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Timer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {timers.map((timer) => (
              <TimerCard
                key={timer.id}
                timer={timer}
                onDelete={() => handleDelete(timer.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Timer Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              Add Countdown Timer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Timer Name</Label>
              <Input
                placeholder="e.g. Board Exam 2026"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                When to Start
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Month</Label>
                  <select
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                    value={startMonth}
                    onChange={(e) => setStartMonth(Number(e.target.value))}
                  >
                    {MONTH_NAMES.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={startDay}
                    onChange={(e) => setStartDay(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                When to End
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Year</Label>
                  <Input
                    type="number"
                    min={currentYear}
                    max={currentYear + 10}
                    value={endYear}
                    onChange={(e) => setEndYear(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Month</Label>
                  <select
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                    value={endMonth}
                    onChange={(e) => setEndMonth(Number(e.target.value))}
                  >
                    {MONTH_NAMES.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={endDay}
                    onChange={(e) => setEndDay(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Save Timer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
