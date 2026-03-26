import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  BookMarked,
  CheckCircle,
  ChevronRight,
  Flame,
  RefreshCcw,
  Star,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { WORD_BANK, type Word } from "../data/wordBank";
import { getCurrentUserId } from "../utils/localStorageService";

// ─── State ────────────────────────────────────────────────────────────────────

interface WordBoosterState {
  scheduledDates: Record<string, string[]>;
  completedWords: Record<string, boolean>;
  rescheduled: Record<string, string>;
  quizScores: Record<string, number>;
  streak: number;
  lastActiveDate: string;
  masteredWordIds: string[];
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function loadState(userId: string): WordBoosterState {
  const raw = localStorage.getItem(`wordBooster_${userId}`);
  if (raw) {
    try {
      return JSON.parse(raw) as WordBoosterState;
    } catch {
      /* ignore */
    }
  }
  return {
    scheduledDates: {},
    completedWords: {},
    rescheduled: {},
    quizScores: {},
    streak: 0,
    lastActiveDate: "",
    masteredWordIds: [],
  };
}

function saveState(userId: string, state: WordBoosterState): void {
  localStorage.setItem(`wordBooster_${userId}`, JSON.stringify(state));
}

function buildTodaySchedule(state: WordBoosterState): WordBoosterState {
  const today = getTodayKey();
  if (state.scheduledDates[today]) return state;

  const newState = {
    ...state,
    scheduledDates: { ...state.scheduledDates },
    rescheduled: { ...state.rescheduled },
  };

  // Reschedule missed words from past dates
  for (const [date, wIds] of Object.entries(state.scheduledDates)) {
    if (date >= today) continue;
    for (const wId of wIds) {
      if (!state.completedWords[wId] && !state.masteredWordIds.includes(wId)) {
        newState.rescheduled[wId] = today;
      }
    }
  }

  const mastered = new Set(state.masteredWordIds);
  const alreadyScheduled = new Set(
    Object.values(newState.scheduledDates).flat(),
  );

  // Priority 1: rescheduled for today/overdue
  const overdueToday = WORD_BANK.filter(
    (w) =>
      newState.rescheduled[w.id] !== undefined &&
      newState.rescheduled[w.id] <= today &&
      !mastered.has(w.id),
  ).map((w) => w.id);

  // Priority 2: new words not yet scheduled
  const newWords = WORD_BANK.filter(
    (w) => !alreadyScheduled.has(w.id) && !mastered.has(w.id),
  ).map((w) => w.id);

  const todayWords = [...new Set([...overdueToday, ...newWords])].slice(0, 5);

  // If fewer than 5, cycle through all non-mastered
  if (todayWords.length < 5) {
    const allNonMastered = WORD_BANK.filter((w) => !mastered.has(w.id)).map(
      (w) => w.id,
    );
    const extra = allNonMastered.filter((id) => !todayWords.includes(id));
    todayWords.push(...extra.slice(0, 5 - todayWords.length));
  }

  newState.scheduledDates[today] = todayWords;

  // Clear completion status for rescheduled words so they can be marked done again
  newState.completedWords = { ...state.completedWords };
  for (const wId of todayWords) {
    if (state.rescheduled[wId] !== undefined) {
      delete newState.completedWords[wId];
    }
  }

  // Update streak
  const yesterday = addDays(today, -1);
  const yesterdayWords = state.scheduledDates[yesterday] || [];
  const allYesterdayDone =
    yesterdayWords.length > 0 &&
    yesterdayWords.every(
      (id) => state.completedWords[id] || state.masteredWordIds.includes(id),
    );
  if (allYesterdayDone) {
    newState.streak = (state.streak || 0) + 1;
  } else if (state.lastActiveDate && state.lastActiveDate < yesterday) {
    newState.streak = 0;
  }
  newState.lastActiveDate = today;

  return newState;
}

// ─── Quiz Modal ───────────────────────────────────────────────────────────────

type QuizType = "fill" | "sentence" | "synonyms" | "pos" | "antonym";

interface QuizQuestion {
  type: QuizType;
  prompt: string;
}

function QuizModal({
  word,
  onClose,
}: { word: Word; onClose: (score: number) => void }) {
  const questions: QuizQuestion[] = [
    {
      type: "fill",
      prompt: `Fill in the blank: "___ means '${word.meanings[0].definition}'." (type the word)`,
    },
    {
      type: "sentence",
      prompt: `Write an example sentence using the word "${word.word}"`,
    },
    {
      type: "synonyms",
      prompt: `Write any 2 synonyms of "${word.word}" (comma-separated)`,
    },
    { type: "pos", prompt: `What is the part of speech of "${word.word}"?` },
    { type: "antonym", prompt: `Write any 1 antonym of "${word.word}"` },
  ];

  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [scores, setScores] = useState<boolean[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const TOTAL_QUESTIONS = 5;
  const questionTypes: QuizType[] = [
    "fill",
    "sentence",
    "synonyms",
    "pos",
    "antonym",
  ];

  const checkAnswer = useCallback(() => {
    const qType = questionTypes[step];
    const ans = answer.trim().toLowerCase();
    let correct = false;

    if (qType === "fill") {
      correct = ans === word.word.toLowerCase();
    } else if (qType === "sentence") {
      correct = ans.includes(word.word.toLowerCase());
    } else if (qType === "synonyms") {
      const given = ans.split(",").map((s) => s.trim());
      correct =
        given.filter((g) => word.synonyms.some((s) => s.toLowerCase() === g))
          .length >= 2;
    } else if (qType === "pos") {
      correct = ans === word.partOfSpeech.toLowerCase();
    } else if (qType === "antonym") {
      correct = word.antonyms.some((a) => a.toLowerCase() === ans);
    }

    setFeedback(correct ? "correct" : "wrong");
    const newScores = [...scores, correct];

    setTimeout(() => {
      setFeedback(null);
      setAnswer("");
      if (step + 1 >= TOTAL_QUESTIONS) {
        setScores(newScores);
        setShowResult(true);
      } else {
        setScores(newScores);
        setStep((s) => s + 1);
      }
    }, 800);
  }, [answer, step, scores, word]);

  const totalScore = scores.filter(Boolean).length;

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="max-w-lg" data-ocid="quiz.dialog">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Quiz: <span className="text-primary capitalize">{word.word}</span>
          </DialogTitle>
        </DialogHeader>

        {!showResult ? (
          <div className="space-y-4">
            <div className="flex gap-1 mb-2">
              {questions.map((q, i) => (
                <div
                  key={q.type}
                  className={`h-2 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : i === step ? "bg-primary/50" : "bg-muted"}`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Question {step + 1} of {questions.length}
            </p>
            <p className="font-medium text-foreground">
              {questions[step].prompt}
            </p>
            <Input
              data-ocid="quiz.input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && answer.trim() && checkAnswer()
              }
              placeholder="Your answer..."
              className={`transition-colors ${feedback === "correct" ? "border-green-500 bg-green-50" : feedback === "wrong" ? "border-red-500 bg-red-50" : ""}`}
            />
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-2 text-sm font-medium ${feedback === "correct" ? "text-green-600" : "text-red-600"}`}
                >
                  {feedback === "correct" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {feedback === "correct"
                    ? "Correct!"
                    : "Not quite — try the next one."}
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              data-ocid="quiz.submit_button"
              onClick={checkAnswer}
              disabled={!answer.trim() || feedback !== null}
              className="w-full"
            >
              Submit Answer <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 py-4"
          >
            <div className="text-5xl">
              {totalScore === 5 ? "🏆" : totalScore >= 3 ? "👍" : "📖"}
            </div>
            <p className="text-2xl font-bold">{totalScore}/5</p>
            <p className="text-muted-foreground">
              {totalScore === 5
                ? "Perfect score! Word mastered!"
                : totalScore >= 3
                  ? "Good job! Rescheduled for day after tomorrow."
                  : "Needs more review. Rescheduled for tomorrow."}
            </p>
            <Button
              data-ocid="quiz.close_button"
              onClick={() => onClose(totalScore)}
              className="w-full"
            >
              Done
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Word Card ────────────────────────────────────────────────────────────────

function WordCard({
  word,
  isCompleted,
  isMastered,
  onMarkDone,
}: {
  word: Word;
  isCompleted: boolean;
  isMastered: boolean;
  onMarkDone: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`border-2 transition-colors ${isMastered ? "border-green-400 bg-green-50/30" : isCompleted ? "border-primary/40 bg-primary/5" : "border-border"}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground capitalize">
                {word.word}
                {isMastered && (
                  <Star className="inline w-5 h-5 ml-2 text-yellow-500 fill-yellow-400" />
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">
                /{word.pronunciation}/
              </p>
            </div>
            <Badge
              variant={isMastered ? "default" : "secondary"}
              className="shrink-0 capitalize"
            >
              {word.partOfSpeech}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
              Meanings
            </p>
            {word.meanings.map((m, i) => (
              <div key={m.definition.slice(0, 20)} className="mb-2">
                <p className="text-sm font-medium text-foreground">
                  {i + 1}. {m.definition}
                </p>
                <p className="text-xs text-muted-foreground italic">
                  "{m.example}"
                </p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
              Used in
            </p>
            <div className="flex flex-wrap gap-1">
              {word.typesOfUse.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                Synonyms
              </p>
              <p className="text-sm text-foreground">
                {word.synonyms.join(", ")}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                Antonyms
              </p>
              <p className="text-sm text-foreground">
                {word.antonyms.join(", ")}
              </p>
            </div>
          </div>
          {!isCompleted && !isMastered && (
            <Button
              data-ocid="word.primary_button"
              onClick={onMarkDone}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Mark as Done
            </Button>
          )}
          {(isCompleted || isMastered) && (
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              {isMastered ? "Mastered!" : "Completed — quiz done"}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DailyWordBoosterPage() {
  const userId = getCurrentUserId() || "guest";
  const [state, setState] = useState<WordBoosterState>(() =>
    buildTodaySchedule(loadState(userId)),
  );
  const [quizWord, setQuizWord] = useState<Word | null>(null);

  useEffect(() => {
    saveState(userId, state);
  }, [state, userId]);

  const today = getTodayKey();
  const todayWordIds = state.scheduledDates[today] || [];
  const todayWords = todayWordIds
    .map((id) => WORD_BANK.find((w) => w.id === id))
    .filter((w): w is Word => w !== undefined);

  const masteredCount = state.masteredWordIds.length;
  const rescheduledCount = Object.keys(state.rescheduled).filter(
    (id) => !state.masteredWordIds.includes(id),
  ).length;
  const completedToday = todayWordIds.filter(
    (id) => state.completedWords[id] || state.masteredWordIds.includes(id),
  ).length;

  const handleQuizClose = (score: number) => {
    if (!quizWord) return;
    const wId = quizWord.id;
    const today2 = getTodayKey();
    setState((prev) => {
      const next = {
        ...prev,
        quizScores: { ...prev.quizScores, [wId]: score },
        completedWords: { ...prev.completedWords, [wId]: true },
        rescheduled: { ...prev.rescheduled },
        masteredWordIds: [...prev.masteredWordIds],
      };
      if (score === 5) {
        if (!next.masteredWordIds.includes(wId))
          next.masteredWordIds = [...next.masteredWordIds, wId];
        delete next.rescheduled[wId];
      } else if (score >= 3) {
        // Score 3 or 4: reschedule day after tomorrow (1 day gap)
        next.rescheduled[wId] = addDays(today2, 2);
        delete next.completedWords[wId];
      } else {
        // Score below 3: reschedule tomorrow
        next.rescheduled[wId] = addDays(today2, 1);
        delete next.completedWords[wId];
      }
      return next;
    });
    setQuizWord(null);
  };

  return (
    <div className="min-h-screen bg-background" data-ocid="word_booster.page">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <BookMarked className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Daily Word Booster
            </h1>
          </div>
          <p className="text-muted-foreground ml-10">
            5 new words a day — build your vocabulary for board exams
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6" data-ocid="word_booster.card">
            <CardContent className="pt-4 pb-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {masteredCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Words Mastered
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500 flex items-center justify-center gap-1">
                    <Flame className="w-5 h-5" />
                    {state.streak}
                  </p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">
                    {rescheduledCount}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <RefreshCcw className="w-3 h-3" /> Rescheduled
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {completedToday}/5
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Today's Progress
                  </p>
                </div>
              </div>
              <Progress
                value={(completedToday / 5) * 100}
                className="mt-3 h-2"
              />
            </CardContent>
          </Card>
        </motion.div>

        <div className="mb-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Today · {today}
          </p>
        </div>

        {todayWords.length === 0 ? (
          <Card data-ocid="word_booster.empty_state">
            <CardContent className="py-12 text-center">
              <BookMarked className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-lg font-semibold">No words scheduled today</p>
              <p className="text-muted-foreground text-sm mt-1">
                Come back tomorrow for your next batch!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {todayWords.map((word, idx) => (
              <div key={word.id} data-ocid={`word_booster.item.${idx + 1}`}>
                <WordCard
                  word={word}
                  isCompleted={!!state.completedWords[word.id]}
                  isMastered={state.masteredWordIds.includes(word.id)}
                  onMarkDone={() => setQuizWord(word)}
                />
              </div>
            ))}
          </div>
        )}

        {completedToday === 5 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 text-center p-6 rounded-xl bg-primary/10 border border-primary/20"
            data-ocid="word_booster.success_state"
          >
            <p className="text-3xl mb-2">🎉</p>
            <p className="font-bold text-lg text-primary">
              All 5 words done today!
            </p>
            <p className="text-muted-foreground text-sm">
              Excellent work. Come back tomorrow!
            </p>
          </motion.div>
        )}
      </div>

      {quizWord && <QuizModal word={quizWord} onClose={handleQuizClose} />}
    </div>
  );
}
