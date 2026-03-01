import React, { useMemo } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  BookOpen,
  Target,
  Calendar,
  TrendingUp,
  Clock,
  MessageSquare,
  CalendarClock,
  Bell,
  ChevronRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useGetTargets,
  useGetReminders,
  useGetStudyStreak,
  useGetProgressSummary,
  useGetChildMessages,
} from '@/hooks/useQueries';
import {
  getCurrentUserId,
  getUserAccountById,
  isGuest,
} from '@/utils/localStorageService';
import TargetMotivationWidget from '@/components/TargetMotivationWidget';

function DaysLeftBanner() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const daysLeft = lastDay - today;

  const urgencyColor =
    daysLeft <= 3
      ? 'from-red-500 to-rose-600'
      : daysLeft <= 7
      ? 'from-orange-500 to-amber-500'
      : 'from-primary to-accent';

  const monthName = now.toLocaleString('default', { month: 'long' });

  return (
    <div className={`rounded-2xl bg-gradient-to-r ${urgencyColor} p-4 text-white shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-0.5">
            {monthName} {year}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black leading-none">{daysLeft}</span>
            <span className="text-lg font-bold">days left</span>
          </div>
          <p className="text-white/80 text-xs mt-1">to end of this month</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <span className="text-white/70 text-[10px] mt-1 font-medium">
            Day {today}/{lastDay}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const userId = getCurrentUserId();
  const guest = isGuest();
  const account = userId && userId !== 'guest' ? getUserAccountById(userId) : null;
  const userName = account?.name ?? (guest ? 'Guest' : 'Student');
  const currentUsername = account?.username ?? null;

  const { data: targets = [] } = useGetTargets();
  const { data: reminders = [] } = useGetReminders();
  const { data: streak } = useGetStudyStreak();
  const { data: progress } = useGetProgressSummary();
  const { unreadCount } = useGetChildMessages(guest ? null : currentUsername);

  const now = Date.now();

  // Upcoming reminders (future, sorted by dateTime)
  const upcomingReminders = useMemo(() => {
    return reminders
      .filter(r => r.dateTime > now)
      .sort((a, b) => a.dateTime - b.dateTime)
      .slice(0, 3);
  }, [reminders, now]);

  // Active targets (not completed, sorted by deadline)
  const activeTargets = useMemo(() => {
    return targets
      .filter(t => !t.completed)
      .sort((a, b) => a.deadline - b.deadline)
      .slice(0, 3);
  }, [targets]);

  const currentStreak = streak ? Number(streak.currentStreak) : 0;
  const totalChapters = progress?.subjectProgress.reduce(
    (sum, sp) => sum + Number(sp.totalChapters), 0
  ) ?? 0;
  const completedChapters = progress?.subjectProgress.reduce(
    (sum, sp) => sum + Number(sp.completedChapters), 0
  ) ?? 0;

  const formatDeadline = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatReminderTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Welcome back,</p>
            <h1 className="text-lg font-black text-foreground leading-tight">{userName} 👋</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate({ to: '/timer' })}
              title="Countdown Timers"
            >
              <CalendarClock className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate({ to: '/messages' })}
              title="Messages"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Days Left Banner */}
        <DaysLeftBanner />

        {/* Target Motivation Widget */}
        <TargetMotivationWidget targets={targets} />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 bg-primary/10">
            <CardContent className="p-3 text-center">
              <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <p className="text-xl font-black text-foreground">{currentStreak}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Day Streak</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-green-500/10">
            <CardContent className="p-3 text-center">
              <BookOpen className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-black text-foreground">{completedChapters}/{totalChapters}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Chapters</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-blue-500/10">
            <CardContent className="p-3 text-center">
              <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-black text-foreground">
                {progress ? Number(progress.mockTestAverageScore) : 0}%
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">Avg Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Upcoming Reminders
                </CardTitle>
                <Link to="/reminders">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                    View all <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {upcomingReminders.map(reminder => (
                <div
                  key={reminder.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/50 border border-border"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{reminder.text}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatReminderTime(reminder.dateTime)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Active Targets */}
        {activeTargets.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Active Targets
                </CardTitle>
                <Link to="/targets">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                    View all <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {activeTargets.map(target => {
                const daysUntil = Math.ceil((target.deadline - now) / (1000 * 60 * 60 * 24));
                const isUrgent = daysUntil <= 3 && daysUntil >= 0;
                const isOverdue = daysUntil < 0;
                return (
                  <div
                    key={target.id}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/50 border border-border"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isOverdue ? 'bg-destructive/10' : isUrgent ? 'bg-orange-500/10' : 'bg-primary/10'
                    }`}>
                      <Target className={`w-4 h-4 ${
                        isOverdue ? 'text-destructive' : isUrgent ? 'text-orange-500' : 'text-primary'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{target.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDeadline(target.deadline)}
                        </p>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-[9px] h-4 px-1.5">Overdue</Badge>
                        )}
                        {isUrgent && !isOverdue && (
                          <Badge className="text-[9px] h-4 px-1.5 bg-orange-500">Due soon</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { to: '/subjects', icon: BookOpen, label: 'Subjects', color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { to: '/planner', icon: Calendar, label: 'Planner', color: 'text-green-600', bg: 'bg-green-500/10' },
            { to: '/mock-tests', icon: TrendingUp, label: 'Mock Tests', color: 'text-purple-600', bg: 'bg-purple-500/10' },
            { to: '/progress', icon: CheckCircle2, label: 'Progress', color: 'text-orange-600', bg: 'bg-orange-500/10' },
          ].map(({ to, icon: Icon, label, color, bg }) => (
            <Link key={to} to={to}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <span className="font-semibold text-sm text-foreground">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground pt-4 border-t">
          © {new Date().getFullYear()} Board Saathi · Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'board-saathi')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
