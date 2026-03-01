import { Trophy, Flame, Clock, BookOpen, HelpCircle, Star, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAchievements, useGetPersonalBest, useGetStudyStreak } from '../hooks/useQueries';

function formatTime(seconds: number): string {
  if (!seconds || seconds === 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

const ACHIEVEMENT_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  '3-day-streak': { label: '3-Day Streak', icon: '🔥', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  '7-day-streak': { label: '7-Day Streak', icon: '⚡', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  '30-day-streak': { label: '30-Day Streak', icon: '🏆', color: 'bg-amber-100 text-amber-700 border-amber-200' },
};

export default function MyAchievementsPage() {
  const { data: achievements = [], isLoading: achLoading } = useGetAchievements();
  const { data: personalBest, isLoading: pbLoading } = useGetPersonalBest();
  const { data: streak } = useGetStudyStreak();

  const isLoading = achLoading || pbLoading;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Chapters Completed',
      value: String(personalBest?.totalChaptersCompleted ?? 0),
      icon: BookOpen,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Questions Practiced',
      value: String(personalBest?.totalQuestionsPracticed ?? 0),
      icon: HelpCircle,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      label: 'Longest Streak',
      value: `${personalBest?.longestStreak ?? 0} days`,
      icon: Flame,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
    {
      label: 'Fastest Test',
      value: formatTime(personalBest?.fastestTestTime ?? 0),
      icon: Clock,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">My Achievements</h1>
          <p className="text-sm text-muted-foreground">Your personal bests and badges</p>
        </div>
      </div>

      {/* Rank */}
      {personalBest?.rankLabel && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-3xl">
              🏅
            </div>
            <div>
              <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Current Rank</p>
              <p className="text-2xl font-bold text-amber-800">{personalBest.rankLabel}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current Streak */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Streak</p>
              <p className="text-3xl font-bold text-orange-500">{streak?.currentStreak ?? 0} days</p>
              <p className="text-xs text-muted-foreground">Best: {streak?.topStreak ?? 0} days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Earned Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No badges yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Keep studying to earn streak badges!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map(ach => {
                const config = ACHIEVEMENT_CONFIG[ach.achievementType] ?? {
                  label: ach.achievementType,
                  icon: '🎖️',
                  color: 'bg-gray-100 text-gray-700 border-gray-200',
                };
                return (
                  <div
                    key={ach.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${config.color}`}
                  >
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{config.label}</p>
                      <p className="text-xs opacity-70">
                        {new Date(ach.achievedAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-auto text-xs">Earned</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
