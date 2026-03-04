import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Flame, Medal, Trophy } from "lucide-react";

interface StreakCardProps {
  currentStreak: number;
  topStreak: number;
}

export default function StreakCard({
  currentStreak,
  topStreak,
}: StreakCardProps) {
  const milestones = [
    {
      days: 3,
      icon: "🏅",
      label: "3-Day Streak",
      color:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    },
    {
      days: 7,
      icon: "🏆",
      label: "7-Day Streak",
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
    },
    {
      days: 30,
      icon: "👑",
      label: "30-Day Streak",
      color: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    },
  ];

  const earnedMilestones = milestones.filter((m) => currentStreak >= m.days);

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-orange-500 to-red-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-xs font-medium uppercase tracking-wide">
              Study Streak
            </p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-4xl font-bold">{currentStreak}</span>
              <span className="text-orange-200 mb-1">days</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <Flame className="w-8 h-8 text-white" />
          </div>
        </div>
        {topStreak > 0 && (
          <p className="text-orange-200 text-xs mt-2">Best: {topStreak} days</p>
        )}
      </div>
      {earnedMilestones.length > 0 && (
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-1.5">
            {earnedMilestones.map((m) => (
              <span
                key={m.days}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.color}`}
              >
                {m.icon} {m.label}
              </span>
            ))}
          </div>
        </CardContent>
      )}
      {earnedMilestones.length === 0 && (
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">
            {currentStreak === 0
              ? "Start studying today to build your streak! 🔥"
              : `${3 - currentStreak} more days to earn your first badge!`}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
