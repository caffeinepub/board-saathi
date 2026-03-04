import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useGetMockTest, useSubmitMockTest } from "../hooks/useQueries";

export default function AttemptMockTestPage() {
  const { testId: testIdStr } = useParams({
    from: "/layout/mock-tests/$testId/attempt",
  });
  const navigate = useNavigate();
  const testIdNum = Number.parseInt(testIdStr, 10);

  const { data: test, isLoading } = useGetMockTest(testIdNum);
  const submitMutation = useSubmitMockTest();

  const [currentIndex, setCurrentIndex] = useState(0);
  // answers: Record<questionId, selectedOptionIndex>
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [elapsed, setElapsed] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (!test) return;
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const report = await submitMutation.mutateAsync({
        testId: testIdNum,
        answers, // Record<number, number> — matches useSubmitMockTest signature
        timeTaken: elapsed,
      });
      setSubmitted(true);
      toast.success(`Test submitted! Score: ${report.score}/${report.total}`);
      navigate({
        to: "/mock-tests/$testId/report",
        params: { testId: testIdStr },
      });
    } catch {
      toast.error("Failed to submit test");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-muted-foreground">Test not found</p>
        <Button onClick={() => navigate({ to: "/mock-tests" })}>
          Back to Tests
        </Button>
      </div>
    );
  }

  const currentQuestion = test.questions[currentIndex];
  const progress = ((currentIndex + 1) / test.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">{test.name}</h1>
          <p className="text-sm text-muted-foreground">
            {answeredCount}/{test.questions.length} answered
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono text-sm font-medium">
            {formatTime(elapsed)}
          </span>
        </div>
      </div>

      <Progress value={progress} className="mb-6 h-2" />

      {/* Question */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <Badge variant="outline" className="shrink-0 mt-0.5">
              Q{currentIndex + 1}
            </Badge>
            <p className="font-medium text-sm leading-relaxed">
              {currentQuestion.questionText}
            </p>
          </div>
          <div className="space-y-2">
            {currentQuestion.options.map((option, idx) => (
              <button
                type="button"
                key={`${currentQuestion.id}-opt-${idx}`}
                onClick={() => handleSelectOption(currentQuestion.id, idx)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                  answers[currentQuestion.id] === idx
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <span className="font-medium mr-2">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {option}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {/* Question navigator */}
        <div className="flex gap-1 flex-wrap justify-center">
          {test.questions.map((q, idx) => (
            <button
              type="button"
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                idx === currentIndex
                  ? "bg-primary text-primary-foreground"
                  : answers[q.id] !== undefined
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentIndex < test.questions.length - 1 ? (
          <Button
            onClick={() =>
              setCurrentIndex((i) => Math.min(test.questions.length - 1, i + 1))
            }
            className="gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || submitted}
            className="gap-1 bg-green-600 hover:bg-green-700"
          >
            {submitMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            Submit
          </Button>
        )}
      </div>
    </div>
  );
}
