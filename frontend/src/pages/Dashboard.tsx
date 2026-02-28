import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  useGetCallerUserProfile,
  useGetProgressSummary,
  useGetStudyStreak,
  useRecordDailyLogin,
  useGetPendingRevisionTasks,
} from '../hooks/useQueries';
import { getCurrentUserId, getUserAccountById } from '../utils/localStorageService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Calendar,
  ClipboardList,
  TrendingUp,
  Target,
  RefreshCw,
  Trophy,
  Layers,
  ChevronRight,
  Star,
  Flame,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  // Get current user info from localStorage
  const userId = getCurrentUserId();
  const account = userId && userId !== 'guest' ? getUserAccountById(userId) : null;
  const displayName = account?.name ?? (userId === 'guest' ? 'Guest' : 'Student');

  const { data: progress, isLoading: progressLoading } = useGetProgressSummary();
  const { data: streak } = useGetStudyStreak();
  const { data: pendingRevisions } = useGetPendingRevisionTasks();
  const recordLogin = useRecordDailyLogin();

  useEffect(() => {
    recordLogin.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalChapters = progress?.subjectProgress.reduce((sum, s) => sum + s.totalChapters, 0) ?? 0;
  const completedChapters = progress?.subjectProgress.reduce((sum, s) => sum + s.completedChapters, 0) ?? 0;
  const overallProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  const quickStats = [
    {
      label: 'Chapters Done',
      value: `${completedChapters}/${totalChapters}`,
      icon: BookOpen,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      path: '/subjects',
    },
    {
      label: 'Mock Tests',
      value: String(progress?.totalMockTestsAttempted ?? 0),
      icon: ClipboardList,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      path: '/mock-tests',
    },
    {
      label: 'Avg Score',
      value: `${progress?.mockTestAverageScore ?? 0}%`,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-950/30',
      path: '/progress',
    },
    {
      label: 'Pending Revisions',
      value: String(pendingRevisions?.length ?? 0),
      icon: RefreshCw,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      path: '/revision',
    },
  ];

  const quickLinks = [
    { label: 'Planner', icon: Calendar, path: '/planner', desc: 'Plan your daily study' },
    { label: 'Flashcards', icon: Layers, path: '/flashcards', desc: 'Review with flashcards' },
    { label: 'Mock Tests', icon: ClipboardList, path: '/mock-tests', desc: 'Test your knowledge' },
    { label: 'Achievements', icon: Trophy, path: '/achievements', desc: 'View your badges' },
    { label: 'Targets', icon: Target, path: '/targets', desc: 'Track your goals' },
    { label: 'Revision', icon: RefreshCw, path: '/revision', desc: 'Spaced repetition' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {progressLoading ? (
            <Skeleton className="h-8 w-48 mb-2" />
          ) : (
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Hello, {displayName}! 👋
            </h1>
          )}
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        {account && (
          <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
            <Star className="w-3 h-3" />
            Class {account.studentClass}
          </Badge>
        )}
        {userId === 'guest' && (
          <Badge variant="outline" className="hidden sm:flex items-center gap-1 text-amber-600 border-amber-300">
            Guest Mode
          </Badge>
        )}
      </div>

      {/* Streak + Overall Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Study Streak</p>
                <p className="text-2xl font-bold text-orange-500">{streak?.currentStreak ?? 0} days</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Best: {streak?.topStreak ?? 0} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-3xl font-bold text-foreground">{overallProgress}%</span>
              <span className="text-muted-foreground text-sm mb-1">complete</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedChapters} of {totalChapters} chapters completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button key={stat.label} onClick={() => navigate({ to: stat.path })} className="text-left">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Subject Progress */}
      {progress && progress.subjectProgress.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Subject Progress</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/subjects' })}>
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {progress.subjectProgress.slice(0, 4).map((sp) => {
              const pct = sp.totalChapters > 0
                ? Math.round((sp.completedChapters / sp.totalChapters) * 100)
                : 0;
              return (
                <div key={sp.subjectId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium truncate">{sp.subjectName}</span>
                    <span className="text-muted-foreground flex-shrink-0 ml-2">
                      {sp.completedChapters}/{sp.totalChapters}
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-base font-semibold mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate({ to: link.path })}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border hover:shadow-md hover:border-primary/30 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">{link.label}</span>
              </button>
            );
          })}
        </div>
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
  );
}
