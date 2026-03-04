import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Star,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  type LocalAnswerEvaluation,
  type LocalQuestion,
  getAnswerEvaluations,
  getChapters,
  getCurrentUserId,
  getQuestions,
  getSubjects,
  saveAnswerEvaluations,
} from "../utils/localStorageService";

const GUIDE_STEPS = [
  "Select a subject and chapter to filter questions.",
  "Click 'Evaluate' on any question to open the evaluator.",
  "Upload a photo of your handwritten answer.",
  "Score yourself honestly on each criterion using the sliders.",
  "Your total score out of 10 is calculated automatically with feedback.",
  "Click 'Submit Evaluation' to save. View history in the 'History' tab.",
];

function getFeedback(score: number): string {
  if (score >= 9) return "Excellent! Well-structured answer.";
  if (score >= 7) return "Good answer. Minor improvements possible.";
  if (score >= 5) return "Average. Work on coverage of key points.";
  if (score >= 3) return "Needs improvement. Review the topic again.";
  return "Very weak. Please revise this chapter.";
}

function getFeedbackColor(score: number): string {
  if (score >= 9) return "text-green-600";
  if (score >= 7) return "text-blue-600";
  if (score >= 5) return "text-yellow-600";
  if (score >= 3) return "text-orange-600";
  return "text-red-600";
}

function ScoreSlider({
  label,
  value,
  max,
  onChange,
  ocid,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  ocid: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-bold text-primary">
          {value} / {max}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
        data-ocid={ocid}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function StarScore({ score }: { score: number }) {
  const stars = Math.round((score / 10) * 5);
  const starKeys = ["s1", "s2", "s3", "s4", "s5"] as const;
  return (
    <div className="flex gap-0.5">
      {starKeys.map((sk, i) => (
        <Star
          key={sk}
          className={`w-4 h-4 ${
            i < stars
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export default function AnswerEvaluatorPage() {
  const userId = getCurrentUserId() ?? "guest";
  const subjects = getSubjects(userId);
  const chapters = getChapters(userId);
  const allQuestions = getQuestions(userId);

  const [guideOpen, setGuideOpen] = useState(false);
  const [filterSubjectId, setFilterSubjectId] = useState<number | "all">("all");
  const [filterChapterId, setFilterChapterId] = useState<number | "all">("all");

  // Evaluation state
  const [evaluating, setEvaluating] = useState<LocalQuestion | null>(null);
  const [imageData, setImageData] = useState<string>("");
  const [introScore, setIntroScore] = useState(0);
  const [keyPointsScore, setKeyPointsScore] = useState(0);
  const [examplesScore, setExamplesScore] = useState(0);
  const [conclusionScore, setConclusionScore] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalScore =
    introScore + keyPointsScore + examplesScore + conclusionScore;
  const feedback = getFeedback(totalScore);

  // History
  const [evals, setEvals] = useState<LocalAnswerEvaluation[]>(() =>
    getAnswerEvaluations(userId),
  );

  const chaptersForSubject =
    filterSubjectId === "all"
      ? chapters
      : chapters.filter((c) => c.subjectId === filterSubjectId);

  const filteredQuestions = allQuestions.filter((q) => {
    const matchSubject =
      filterSubjectId === "all" || q.subjectId === filterSubjectId;
    const matchChapter =
      filterChapterId === "all" || q.chapterId === filterChapterId;
    return matchSubject && matchChapter;
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageData(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStartEvaluation = (q: LocalQuestion) => {
    setEvaluating(q);
    setImageData("");
    setIntroScore(0);
    setKeyPointsScore(0);
    setExamplesScore(0);
    setConclusionScore(0);
  };

  const handleSubmitEvaluation = () => {
    if (!evaluating) return;
    if (!imageData) {
      toast.error("Please upload a photo of your answer.");
      return;
    }
    const evalRecord: LocalAnswerEvaluation = {
      id: `ae_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      questionId: evaluating.id,
      questionText: evaluating.questionText,
      modelAnswer: evaluating.answer,
      imageData,
      introScore,
      keyPointsScore,
      examplesScore,
      conclusionScore,
      totalScore,
      feedback,
      evaluatedAt: Date.now(),
    };
    const updated = [evalRecord, ...evals];
    setEvals(updated);
    saveAnswerEvaluations(userId, updated);
    toast.success(`Evaluation saved! Score: ${totalScore}/10`);
    setEvaluating(null);
  };

  const handleCancelEvaluation = () => {
    setEvaluating(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-primary" />
            Answer Sheet Evaluator
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload handwritten answers and score yourself out of 10
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setGuideOpen((v) => !v)}
          data-ocid="eval.guide.toggle"
        >
          {guideOpen ? (
            <ChevronUp className="w-4 h-4 mr-1" />
          ) : (
            <ChevronDown className="w-4 h-4 mr-1" />
          )}
          How to Use
        </Button>
      </div>

      {/* Guide */}
      {guideOpen && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <ul className="space-y-2">
              {GUIDE_STEPS.map((s) => (
                <li key={s} className="text-sm flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Modal */}
      {evaluating && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          data-ocid="eval.dialog"
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-start justify-between gap-3 p-5 border-b border-border">
              <div className="flex-1">
                <h2 className="font-bold text-base">Evaluate Answer</h2>
                <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                  {evaluating.questionText}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelEvaluation}
                className="text-muted-foreground hover:text-foreground flex-shrink-0"
                data-ocid="eval.close.button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Model Answer */}
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-primary">
                  Model Answer
                </Label>
                <div className="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed text-foreground">
                  {evaluating.answer}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">
                  Upload Your Handwritten Answer Photo
                </Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  data-ocid="eval.upload_button"
                >
                  {imageData ? (
                    <img
                      src={imageData}
                      alt="Your answer"
                      className="max-h-48 rounded-lg object-contain"
                    />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Tap to upload answer photo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG accepted
                      </p>
                    </>
                  )}
                </button>
                {imageData && (
                  <button
                    type="button"
                    onClick={() => setImageData("")}
                    className="text-xs text-destructive hover:underline mt-1"
                    data-ocid="eval.remove_image.button"
                  >
                    Remove image
                  </button>
                )}
              </div>

              {/* Scoring Rubric */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold block">
                  Self-Scoring Rubric
                </Label>
                <ScoreSlider
                  label="Introduction written clearly"
                  value={introScore}
                  max={2}
                  onChange={setIntroScore}
                  ocid="eval.intro.input"
                />
                <ScoreSlider
                  label="Key points covered"
                  value={keyPointsScore}
                  max={4}
                  onChange={setKeyPointsScore}
                  ocid="eval.keypoints.input"
                />
                <ScoreSlider
                  label="Examples / diagrams mentioned"
                  value={examplesScore}
                  max={2}
                  onChange={setExamplesScore}
                  ocid="eval.examples.input"
                />
                <ScoreSlider
                  label="Conclusion present"
                  value={conclusionScore}
                  max={2}
                  onChange={setConclusionScore}
                  ocid="eval.conclusion.input"
                />
              </div>

              {/* Score display */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Total Score</span>
                  <span className="text-2xl font-black text-primary">
                    {totalScore}
                    <span className="text-base font-normal text-muted-foreground">
                      /10
                    </span>
                  </span>
                </div>
                <Progress value={totalScore * 10} className="h-3 mb-3" />
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm font-medium ${getFeedbackColor(totalScore)}`}
                  >
                    {feedback}
                  </p>
                  <StarScore score={totalScore} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelEvaluation}
                  data-ocid="eval.cancel.button"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmitEvaluation}
                  disabled={!imageData}
                  data-ocid="eval.submit.button"
                >
                  Submit Evaluation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="questions" data-ocid="eval.tabs">
        <TabsList className="mb-4">
          <TabsTrigger value="questions" data-ocid="eval.questions.tab">
            Questions
          </TabsTrigger>
          <TabsTrigger value="history" data-ocid="eval.history.tab">
            History
            {evals.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {evals.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── QUESTIONS TAB ─── */}
        <TabsContent value="questions">
          {/* Filters */}
          <div className="flex gap-3 mb-5 flex-wrap">
            <Select
              value={
                filterSubjectId === "all" ? "all" : String(filterSubjectId)
              }
              onValueChange={(v) => {
                setFilterSubjectId(v === "all" ? "all" : Number(v));
                setFilterChapterId("all");
              }}
            >
              <SelectTrigger
                className="w-44"
                data-ocid="eval.filter.subject.select"
              >
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={
                filterChapterId === "all" ? "all" : String(filterChapterId)
              }
              onValueChange={(v) =>
                setFilterChapterId(v === "all" ? "all" : Number(v))
              }
            >
              <SelectTrigger
                className="w-44"
                disabled={chaptersForSubject.length === 0}
                data-ocid="eval.filter.chapter.select"
              >
                <SelectValue placeholder="All Chapters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chapters</SelectItem>
                {chaptersForSubject.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredQuestions.length === 0 ? (
            <div
              className="text-center py-16"
              data-ocid="eval.questions.empty_state"
            >
              <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-1">No questions found</h3>
              <p className="text-sm text-muted-foreground">
                Add questions inside chapters to evaluate answers here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q, i) => {
                const subj = subjects.find((s) => s.id === q.subjectId);
                const chap = chapters.find((c) => c.id === q.chapterId);
                const alreadyEvaluated = evals.filter(
                  (e) => e.questionId === q.id,
                );
                return (
                  <Card
                    key={q.id}
                    className="hover:border-primary/30 transition-colors"
                    data-ocid={`eval.question.item.${i + 1}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug mb-2">
                            {q.questionText}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {subj && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {subj.name}
                              </Badge>
                            )}
                            {chap && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {chap.name}
                              </Badge>
                            )}
                            {alreadyEvaluated.length > 0 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 text-green-600 border-green-300"
                              >
                                Evaluated {alreadyEvaluated.length}×
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleStartEvaluation(q)}
                          data-ocid={`eval.evaluate.button.${i + 1}`}
                        >
                          Evaluate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── HISTORY TAB ─── */}
        <TabsContent value="history">
          {evals.length === 0 ? (
            <div
              className="text-center py-16"
              data-ocid="eval.history.empty_state"
            >
              <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-1">No evaluations yet</h3>
              <p className="text-sm text-muted-foreground">
                Evaluate an answer in the Questions tab to see history here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {evals.map((ev, i) => (
                <Card
                  key={ev.id}
                  data-ocid={`eval.history.item.${i + 1}`}
                  className="overflow-hidden"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                      {/* Uploaded image thumbnail */}
                      {ev.imageData && (
                        <img
                          src={ev.imageData}
                          alt="Answer"
                          className="w-20 h-20 object-cover rounded-lg border border-border flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug mb-1 line-clamp-2">
                          {ev.questionText}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(ev.evaluatedAt).toLocaleString("en-IN")}
                        </p>

                        {/* Score breakdown */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground mb-2">
                          <span>
                            Introduction:{" "}
                            <strong className="text-foreground">
                              {ev.introScore}/2
                            </strong>
                          </span>
                          <span>
                            Key Points:{" "}
                            <strong className="text-foreground">
                              {ev.keyPointsScore}/4
                            </strong>
                          </span>
                          <span>
                            Examples:{" "}
                            <strong className="text-foreground">
                              {ev.examplesScore}/2
                            </strong>
                          </span>
                          <span>
                            Conclusion:{" "}
                            <strong className="text-foreground">
                              {ev.conclusionScore}/2
                            </strong>
                          </span>
                        </div>

                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p
                            className={`text-xs font-medium ${getFeedbackColor(ev.totalScore)}`}
                          >
                            {ev.feedback}
                          </p>
                          <div className="flex items-center gap-2">
                            <StarScore score={ev.totalScore} />
                            <Badge
                              className={`text-sm font-bold px-2 ${
                                ev.totalScore >= 7
                                  ? "bg-green-500"
                                  : ev.totalScore >= 5
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              } text-white border-0`}
                            >
                              {ev.totalScore}/10
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
