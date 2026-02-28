import { useGetPersonalBest, useGetStudyStreak, useGetAchievements, useGetSubjects } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy, BookOpen, HelpCircle, Flame, Zap, Star, Crown, Medal, TrendingUp,
} from 'lucide-react';

function getRankIcon(rank: string) {
  if (rank === 'Board Champion') return <Crown className="w-8 h-8 text-yellow-500" />;
  if (rank === 'Rising Star') return <Star className="w-8 h-8 text-blue-500" />;
  if (rank === 'Dedicated Learner') return <Medal className="w-8 h-8 text-purple-500" />;
  return <BookOpen className="w-8 h-8 text-green-500" />;
}

function getRankColor(rank: string) {
  if (rank === 'Board Champion') return 'from-yellow-400 to-orange-500';
  if (rank === 'Rising Star') return 'from-blue-400 to-purple-500';
  if (rank === 'Dedicated Learner') return 'from-purple-400 to-pink-500';
  return 'from-green-400 to-teal-500';
}

interface AchievementCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  gradient: string;
}

function AchievementCard({ title, value, icon, description, gradient }: AchievementCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className={`bg-gradient-to-br ${gradient} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            {icon}
          </div>
          <span className="text-2xl font-bold">{value}</span>
        </div>
      </div>
      <CardContent className="p-3">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function MyAchievementsPage() {
  const { data: personalBest, isLoading } = useGetPersonalBest();
  const { data: streak } = useGetStudyStreak();
  const { data: achievements } = useGetAchievements();
  const { data: subjects } = useGetSubjects();

  // fastestTestTime comes from backend as bigint (nanoseconds or seconds)
  const formatTime = (seconds: number) => {
    if (seconds === 0) return 'N/A';
    const m = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${m}m ${sec}s`;
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">My Achievements</h1>
          <p className="text-sm text-muted-foreground">Your personal best stats and badges</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <>
          {/* Rank Card */}
          {personalBest && (
            <div
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${getRankColor(
                personalBest.rankLabel
              )} p-6 text-white`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                  {getRankIcon(personalBest.rankLabel)}
                </div>
                <div>
                  <p className="text-white/70 text-sm font-medium">Your Rank</p>
                  <h2 className="text-2xl font-bold">{personalBest.rankLabel}</h2>
                  <p className="text-white/80 text-sm mt-1">Keep studying to level up! 🚀</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <AchievementCard
              title="Chapters Completed"
              value={String(personalBest?.totalChaptersCompleted ?? 0)}
              icon={<BookOpen className="w-5 h-5 text-white" />}
              description="Total chapters finished"
              gradient="from-blue-500 to-blue-600"
            />
            <AchievementCard
              title="Questions Practiced"
              value={String(personalBest?.totalQuestionsPracticed ?? 0)}
              icon={<HelpCircle className="w-5 h-5 text-white" />}
              description="Total Q&A pairs added"
              gradient="from-purple-500 to-purple-600"
            />
            <AchievementCard
              title="Longest Streak"
              value={`${personalBest?.longestStreak ?? 0}d`}
              icon={<Flame className="w-5 h-5 text-white" />}
              description="Best consecutive days"
              gradient="from-orange-500 to-red-500"
            />
            <AchievementCard
              title="Current Streak"
              value={`${streak?.currentStreak ?? 0}d`}
              icon={<Zap className="w-5 h-5 text-white" />}
              description="Days active in a row"
              gradient="from-yellow-500 to-orange-500"
            />
            <AchievementCard
              title="Fastest Test"
              value={formatTime(Number(personalBest?.fastestTestTime ?? 0))}
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              description="Quickest test completion"
              gradient="from-green-500 to-teal-500"
            />
          </div>

          {/* Subject Best Scores */}
          {personalBest && personalBest.highestScorePerSubject.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Best Scores by Subject
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {personalBest.highestScorePerSubject.map(([subjectId, score]) => {
                  const subject = subjects?.find((s) => s.id === subjectId);
                  const pct = Number(score);
                  return (
                    <div key={String(subjectId)} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-40 truncate">
                        {subject?.name ?? `Subject ${subjectId}`}
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-12 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Milestone Badges */}
          {achievements && achievements.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Medal className="w-4 h-4 text-purple-500" />
                  Earned Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {achievements.map((ach) => {
                    const label = ach.achievementType.replace(/-/g, ' ');
                    const emoji =
                      ach.achievementType.includes('30')
                        ? '👑'
                        : ach.achievementType.includes('7')
                        ? '🏆'
                        : '🏅';
                    return (
                      <div
                        key={String(ach.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border"
                      >
                        <span className="text-lg">{emoji}</span>
                        <div>
                          <p className="text-xs font-semibold capitalize">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(Number(ach.achievedAt) / 1_000_000).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
