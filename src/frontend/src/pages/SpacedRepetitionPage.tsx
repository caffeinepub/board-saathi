import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Star,
  Target,
  Trash2,
  Zap,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  type LocalSRSCard,
  getCurrentUserId,
  getSRSCards,
  saveSRSCards,
} from "../utils/localStorageService";

// ─── SM-2 Algorithm ───────────────────────────────────────────────────────────

type Rating = 0 | 1 | 2 | 3; // 0=Again, 1=Hard, 2=Good, 3=Easy

function sm2Update(card: LocalSRSCard, rating: Rating): LocalSRSCard {
  const now = Date.now();
  let { interval, easeFactor, repetitions } = card;

  if (rating < 2) {
    // Again or Hard: reset
    interval = 1;
    repetitions = 0;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor
  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02),
  );

  const nextReview = now + interval * 86400000;

  return {
    ...card,
    interval,
    easeFactor,
    repetitions,
    nextReview,
    lastReview: now,
  };
}

// ─── Review Log helpers ───────────────────────────────────────────────────────

function getReviewLog(userId: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(`bs_${userId}_srsReviewLog`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function incrementTodayLog(userId: string) {
  const log = getReviewLog(userId);
  const today = new Date().toISOString().slice(0, 10);
  log[today] = (log[today] ?? 0) + 1;
  localStorage.setItem(`bs_${userId}_srsReviewLog`, JSON.stringify(log));
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

function ReviewHeatmap({ userId }: { userId: string }) {
  const log = useMemo(() => getReviewLog(userId), [userId]);

  // Build last 56 days
  const days: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 55; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: log[key] ?? 0 });
  }

  const maxCount = Math.max(...days.map((d) => d.count), 1);

  function cellColor(count: number) {
    if (count === 0) return "bg-muted";
    const pct = count / maxCount;
    if (pct < 0.25) return "bg-green-200 dark:bg-green-900";
    if (pct < 0.5) return "bg-green-400 dark:bg-green-700";
    if (pct < 0.75) return "bg-green-600 dark:bg-green-500";
    return "bg-green-700 dark:bg-green-400";
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2 font-medium">
        Last 56 days
      </p>
      <div className="grid grid-cols-8 gap-0.5">
        {days.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} review${d.count !== 1 ? "s" : ""}`}
            className={`w-full aspect-square rounded-sm ${cellColor(d.count)}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-1 mt-1 text-[9px] text-muted-foreground">
        <span>Less</span>
        {[
          "bg-muted",
          "bg-green-200",
          "bg-green-400",
          "bg-green-600",
          "bg-green-700",
        ].map((c, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static list
          <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ─── Card Components ──────────────────────────────────────────────────────────

function SubjectBadge({ name }: { name: string }) {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-orange-100 text-orange-700",
    "bg-teal-100 text-teal-700",
    "bg-cyan-100 text-cyan-700",
  ];
  const color = colors[Math.abs(name.charCodeAt(0)) % colors.length];
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}
    >
      {name}
    </span>
  );
}

function DueCard({
  card,
  onReview,
}: {
  card: LocalSRSCard;
  onReview: (card: LocalSRSCard) => void;
}) {
  return (
    <Card className="border-l-4 border-l-orange-400">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">
            {card.chapterName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <SubjectBadge name={card.subjectName} />
            <span className="text-[10px] text-muted-foreground">
              ×{card.repetitions} done
            </span>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1 text-xs flex-shrink-0"
          onClick={() => onReview(card)}
          data-ocid="srs.review.primary_button"
        >
          <Zap className="w-3 h-3" />
          Review
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({
  card,
  onRate,
  onClose,
}: {
  card: LocalSRSCard;
  onRate: (rating: Rating) => void;
  onClose: () => void;
}) {
  const [reviewed, setReviewed] = useState(false);

  const ratingButtons: {
    label: string;
    rating: Rating;
    color: string;
    ocid: string;
  }[] = [
    {
      label: "Again",
      rating: 0,
      color: "bg-red-500 hover:bg-red-600 text-white",
      ocid: "srs.again.button",
    },
    {
      label: "Hard",
      rating: 1,
      color: "bg-orange-500 hover:bg-orange-600 text-white",
      ocid: "srs.hard.button",
    },
    {
      label: "Good",
      rating: 2,
      color: "bg-green-600 hover:bg-green-700 text-white",
      ocid: "srs.good.button",
    },
    {
      label: "Easy",
      rating: 3,
      color: "bg-blue-600 hover:bg-blue-700 text-white",
      ocid: "srs.easy.button",
    },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm" data-ocid="srs.review.dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Review Chapter
          </DialogTitle>
          <DialogDescription>
            <SubjectBadge name={card.subjectName} />
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 text-center space-y-3">
          <p className="text-xl font-bold">{card.chapterName}</p>
          <p className="text-sm text-muted-foreground">
            Study this chapter, then rate how well you recall it.
          </p>

          {!reviewed ? (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setReviewed(true)}
              data-ocid="srs.confirm.button"
            >
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              I've reviewed this chapter
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                How well did you recall?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ratingButtons.map(({ label, rating, color, ocid }) => (
                  <button
                    key={label}
                    type="button"
                    className={`py-2 px-3 rounded-lg text-sm font-bold transition-all active:scale-95 ${color}`}
                    onClick={() => onRate(rating)}
                    data-ocid={ocid}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Again = forgot • Hard = barely recalled • Good = remembered •
                Easy = knew instantly
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-ocid="srs.review.cancel_button"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SpacedRepetitionPage() {
  const userId = getCurrentUserId() ?? "guest";

  const [cards, setCards] = useState<LocalSRSCard[]>(() => getSRSCards(userId));
  const [reviewCard, setReviewCard] = useState<LocalSRSCard | null>(null);

  const now = Date.now();

  const dueCards = useMemo(
    () =>
      cards
        .filter((c) => c.nextReview <= now)
        .sort((a, b) => a.nextReview - b.nextReview),
    [cards, now],
  );

  const allCardsSorted = useMemo(
    () => [...cards].sort((a, b) => a.nextReview - b.nextReview),
    [cards],
  );

  const masteredCount = cards.filter((c) => c.interval > 21).length;
  const totalReviews = cards.reduce((sum, c) => sum + c.repetitions, 0);

  const handleRate = (rating: Rating) => {
    if (!reviewCard) return;
    const updated = cards.map((c) =>
      c.chapterId === reviewCard.chapterId &&
      c.subjectId === reviewCard.subjectId
        ? sm2Update(c, rating)
        : c,
    );
    saveSRSCards(userId, updated);
    setCards(updated);
    incrementTodayLog(userId);
    setReviewCard(null);

    const labels = ["Again", "Hard", "Good", "Easy"];
    const nextIntervals = sm2Update(reviewCard, rating).interval;
    toast.success(
      `Rated: ${labels[rating]} — next review in ${nextIntervals} day${nextIntervals !== 1 ? "s" : ""}`,
    );
  };

  const handleRemove = (card: LocalSRSCard) => {
    const updated = cards.filter(
      (c) =>
        !(c.chapterId === card.chapterId && c.subjectId === card.subjectId),
    );
    saveSRSCards(userId, updated);
    setCards(updated);
    toast.success("Removed from SRS");
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Spaced Repetition</h1>
          <p className="text-xs text-muted-foreground">
            SM-2 algorithm schedules what to study today
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Enrolled",
            value: cards.length,
            icon: BookOpen,
            color: "text-blue-600",
          },
          {
            label: "Due Today",
            value: dueCards.length,
            icon: Calendar,
            color: "text-orange-500",
          },
          {
            label: "Mastered",
            value: masteredCount,
            icon: Star,
            color: "text-green-600",
          },
          {
            label: "Total Reviews",
            value: totalReviews,
            icon: Target,
            color: "text-purple-600",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-3 flex items-center gap-2">
              <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
              <div>
                <p className="text-lg font-black leading-none">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="today">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="today" data-ocid="srs.today.tab">
            Today
            {dueCards.length > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-[9px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center">
                {dueCards.length > 9 ? "9+" : dueCards.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" data-ocid="srs.all.tab">
            All Cards
          </TabsTrigger>
          <TabsTrigger value="stats" data-ocid="srs.stats.tab">
            Stats
          </TabsTrigger>
          <TabsTrigger value="guide" data-ocid="srs.guide.tab">
            Guide
          </TabsTrigger>
        </TabsList>

        {/* ── Today Tab ── */}
        <TabsContent value="today" className="mt-4 space-y-3">
          {dueCards.length === 0 ? (
            <div
              className="text-center py-12 space-y-3"
              data-ocid="srs.today.empty_state"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-green-700">All caught up!</p>
                <p className="text-sm text-muted-foreground">
                  No chapters due for review today.
                </p>
                {cards.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Add chapters to SRS from the Subjects → Chapters page.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {dueCards.length} chapter{dueCards.length !== 1 ? "s" : ""} due
                for review
              </p>
              <div className="space-y-2" data-ocid="srs.today.list">
                {dueCards.map((card, idx) => (
                  <div
                    key={`${card.subjectId}-${card.chapterId}`}
                    data-ocid={`srs.today.item.${idx + 1}`}
                  >
                    <DueCard card={card} onReview={() => setReviewCard(card)} />
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ── All Cards Tab ── */}
        <TabsContent value="all" className="mt-4 space-y-3">
          {allCardsSorted.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="srs.all.empty_state"
            >
              <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No SRS cards yet</p>
              <p className="text-xs mt-1">
                Open Subjects → a chapter → tap "Add to SRS"
              </p>
            </div>
          ) : (
            <div className="space-y-2" data-ocid="srs.all.list">
              {allCardsSorted.map((card, idx) => {
                const isDue = card.nextReview <= now;
                const daysUntil = Math.ceil((card.nextReview - now) / 86400000);
                return (
                  <Card
                    key={`${card.subjectId}-${card.chapterId}`}
                    data-ocid={`srs.all.item.${idx + 1}`}
                    className={
                      isDue
                        ? "border-orange-200 bg-orange-50/50 dark:bg-orange-950/20"
                        : ""
                    }
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight">
                          {card.chapterName}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <SubjectBadge name={card.subjectName} />
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {isDue ? (
                              <span className="text-orange-600 font-semibold">
                                Due now
                              </span>
                            ) : (
                              <span>In {daysUntil}d</span>
                            )}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            EF: {card.easeFactor.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ×{card.repetitions}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => handleRemove(card)}
                        data-ocid={`srs.all.delete_button.${idx + 1}`}
                        title="Remove from SRS"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Stats Tab ── */}
        <TabsContent value="stats" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Review Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewHeatmap userId={userId} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold">Progress Overview</p>
              {cards.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No cards enrolled yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {[
                    {
                      label: "New (0 reps)",
                      count: cards.filter((c) => c.repetitions === 0).length,
                      color: "bg-blue-400",
                    },
                    {
                      label: "Learning (1–3 reps)",
                      count: cards.filter(
                        (c) => c.repetitions > 0 && c.repetitions <= 3,
                      ).length,
                      color: "bg-yellow-400",
                    },
                    {
                      label: "Review (4–10 reps)",
                      count: cards.filter(
                        (c) => c.repetitions > 3 && c.interval <= 21,
                      ).length,
                      color: "bg-orange-400",
                    },
                    {
                      label: "Mastered (>21d interval)",
                      count: masteredCount,
                      color: "bg-green-500",
                    },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${color}`}
                          style={{
                            width: `${cards.length ? (count / cards.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Guide Tab ── */}
        <TabsContent value="guide" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-sm font-semibold">
                  What is Spaced Repetition?
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Spaced repetition is a proven learning technique that shows you
                the right information at the right time. Instead of reviewing
                everything every day, you review each chapter just before you're
                about to forget it — dramatically improving long-term retention.
              </p>

              <div className="space-y-3">
                <p className="text-sm font-semibold">
                  The SM-2 Algorithm (used here)
                </p>
                <div className="bg-muted rounded-lg p-3 space-y-2 text-xs text-muted-foreground">
                  <p>
                    <strong>Rating scale:</strong> Again (forgot) → Hard → Good
                    → Easy
                  </p>
                  <p>
                    <strong>If Again/Hard:</strong> Chapter resets — you'll see
                    it again tomorrow
                  </p>
                  <p>
                    <strong>If Good:</strong> Interval grows by your "ease
                    factor"
                  </p>
                  <p>
                    <strong>If Easy:</strong> Interval grows faster, ease factor
                    increases
                  </p>
                  <p>
                    <strong>Ease Factor</strong> starts at 2.5 and adjusts based
                    on your ratings
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">How to use</p>
                <ol className="text-sm text-muted-foreground space-y-1.5 list-none">
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">1.</span>Go to
                    Subjects → open any chapter → tap "Add to SRS"
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">2.</span>Come here
                    daily and review due chapters
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">3.</span>After
                    reviewing, rate your recall honestly
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">4.</span>The app
                    schedules the next review automatically
                  </li>
                </ol>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-primary font-semibold">
                  💡 Board Exam Tip
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start adding all 6 subjects' chapters to SRS at least 3 months
                  before your board exam. Review consistently every day — even
                  10 minutes is enough!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      {reviewCard && (
        <ReviewModal
          card={reviewCard}
          onRate={handleRate}
          onClose={() => setReviewCard(null)}
        />
      )}
    </div>
  );
}
