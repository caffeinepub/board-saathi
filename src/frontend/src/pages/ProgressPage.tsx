import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  CheckSquare,
  ClipboardList,
  Loader2,
  Target,
  TrendingUp,
} from "lucide-react";
import React from "react";
import { useGetProgressSummary, useGetTestAttempts } from "../hooks/useQueries";

export default function ProgressPage() {
  const { data: progress, isLoading } = useGetProgressSummary();
  const { data: attempts = [] } = useGetTestAttempts();

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array, stable order
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!progress) return null;

  const taskPct =
    Number(progress.totalTasks) > 0
      ? Math.round(
          (Number(progress.totalTasksCompleted) / Number(progress.totalTasks)) *
            100,
        )
      : 0;

  const targetPct =
    Number(progress.totalTargets) > 0
      ? Math.round(
          (Number(progress.totalTargetsAchieved) /
            Number(progress.totalTargets)) *
            100,
        )
      : 0;

  const recentAttempts = [...attempts]
    .sort((a, b) => Number(b.attemptedAt) - Number(a.attemptedAt))
    .slice(0, 5);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-primary" />
        <h1 className="font-heading font-bold text-2xl">Progress Tracker</h1>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-xs">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {progress.totalTasksCompleted.toString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Tasks Done</p>
          </CardContent>
        </Card>
        <Card className="shadow-xs">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">
              {progress.totalTargetsAchieved.toString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Targets Met</p>
          </CardContent>
        </Card>
        <Card className="shadow-xs">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {progress.mockTestAverageScore.toString()}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Avg Score</p>
          </CardContent>
        </Card>
        <Card className="shadow-xs">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {progress.totalMockTestsAttempted.toString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Tests Done</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Progress */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Chapter Completion by Subject
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {progress.subjectProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No subjects data yet.
            </p>
          ) : (
            progress.subjectProgress.map((sp) => {
              const pct =
                Number(sp.totalChapters) > 0
                  ? Math.round(
                      (Number(sp.completedChapters) /
                        Number(sp.totalChapters)) *
                        100,
                    )
                  : 0;
              return (
                <div key={sp.subjectId.toString()}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium">
                      {sp.subjectName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {sp.completedChapters.toString()}/
                        {sp.totalChapters.toString()} chapters
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-xs py-0 ${pct === 100 ? "bg-green-100 text-green-700" : ""}`}
                      >
                        {pct}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={pct} className="h-2.5" />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Planner & Targets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              Planner Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="font-bold text-sm">
                {progress.totalTasksCompleted.toString()}/
                {progress.totalTasks.toString()}
              </span>
            </div>
            <Progress value={taskPct} className="h-3 mb-1" />
            <p className="text-xs text-muted-foreground">
              {taskPct}% tasks completed
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              Study Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Achieved</span>
              <span className="font-bold text-sm">
                {progress.totalTargetsAchieved.toString()}/
                {progress.totalTargets.toString()}
              </span>
            </div>
            <Progress value={targetPct} className="h-3 mb-1" />
            <p className="text-xs text-muted-foreground">
              {targetPct}% targets achieved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Test Attempts */}
      {recentAttempts.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Recent Mock Test Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentAttempts.map((attempt) => {
              const pct = Number(attempt.report.percentage);
              return (
                <div
                  key={attempt.id.toString()}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attempt.report.testName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        Number(attempt.attemptedAt) / 1_000_000,
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`font-bold text-sm ${pct >= 70 ? "text-green-600" : pct >= 40 ? "text-yellow-600" : "text-red-600"}`}
                    >
                      {pct}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attempt.report.score.toString()}/
                      {attempt.report.total.toString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
