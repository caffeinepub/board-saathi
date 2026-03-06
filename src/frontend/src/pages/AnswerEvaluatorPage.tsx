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
  BookOpen,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Loader2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { compressImage } from "../utils/imageCompression";
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

// ─── Keyword Extraction + Smart Scoring ──────────────────────────────────────

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "shall",
  "can",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "for",
  "with",
  "from",
  "as",
  "into",
  "through",
  "and",
  "or",
  "but",
  "if",
  "that",
  "this",
  "these",
  "those",
  "it",
  "its",
  "we",
  "our",
  "they",
  "their",
  "you",
  "your",
  "i",
  "my",
  "me",
  "him",
  "her",
  "his",
  "us",
  "them",
  "not",
  "also",
  "very",
  "so",
  "than",
  "then",
  "when",
  "which",
  "what",
  "how",
  "why",
  "about",
  "after",
  "before",
  "between",
  "during",
  "each",
  "other",
  "such",
  "some",
  "give",
  "explain",
  "describe",
  "write",
  "define",
  "what",
  "how",
  "state",
  "list",
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function scoreKeywordCoverage(
  studentAnswer: string,
  modelAnswer: string,
): { covered: string[]; missed: string[]; percentage: number } {
  const modelKws = extractKeywords(modelAnswer);
  // Deduplicate model keywords
  const uniqueModel = [...new Set(modelKws)];
  if (uniqueModel.length === 0)
    return { covered: [], missed: [], percentage: 0 };

  const studentWords = new Set(
    studentAnswer
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );

  const covered: string[] = [];
  const missed: string[] = [];

  for (const kw of uniqueModel) {
    // Allow partial match (e.g. "photosynthesis" matches "photosynthesize")
    const found =
      studentWords.has(kw) ||
      [...studentWords].some(
        (sw) =>
          sw.startsWith(kw.slice(0, Math.max(4, kw.length - 2))) ||
          kw.startsWith(sw.slice(0, Math.max(4, sw.length - 2))),
      );
    if (found) covered.push(kw);
    else missed.push(kw);
  }

  const percentage = Math.round((covered.length / uniqueModel.length) * 100);
  return { covered, missed, percentage };
}

function getSmartFeedback(
  totalScore: number,
  keywordPct: number,
  hasIntro: boolean,
  hasConclusion: boolean,
  hasExamples: boolean,
): { summary: string; tips: string[] } {
  const tips: string[] = [];

  if (keywordPct < 40) {
    tips.push(
      "You missed many key concepts — re-read the model answer carefully.",
    );
  } else if (keywordPct < 70) {
    tips.push(
      `You covered ${keywordPct}% of key terms — try to include more specific vocabulary.`,
    );
  } else {
    tips.push(
      `Great keyword coverage (${keywordPct}%) — your answer is content-rich.`,
    );
  }

  if (!hasIntro)
    tips.push("Add a clear introductory sentence defining the topic.");
  if (!hasExamples)
    tips.push(
      "Include at least one example, diagram label, or real-world application.",
    );
  if (!hasConclusion)
    tips.push("End with a concluding statement summarizing the answer.");

  if (totalScore >= 9)
    return { summary: "Excellent! Board-exam ready answer.", tips };
  if (totalScore >= 7)
    return {
      summary: "Good answer. Minor improvements will make it perfect.",
      tips,
    };
  if (totalScore >= 5)
    return { summary: "Average. Focus on covering more key points.", tips };
  if (totalScore >= 3)
    return { summary: "Needs improvement. Review this topic again.", tips };
  return { summary: "Very weak. Please revise this chapter thoroughly.", tips };
}

function getFeedbackColor(score: number): string {
  if (score >= 9) return "text-green-600";
  if (score >= 7) return "text-blue-600";
  if (score >= 5) return "text-yellow-600";
  if (score >= 3) return "text-orange-600";
  return "text-red-600";
}

// ─── Score Slider ─────────────────────────────────────────────────────────────

function ScoreSlider({
  label,
  desc,
  value,
  max,
  onChange,
  ocid,
  autoScore,
}: {
  label: string;
  desc: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  ocid: string;
  autoScore?: number;
}) {
  return (
    <div className="space-y-1.5 bg-muted/30 rounded-xl p-3">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <Label className="text-sm font-semibold">{label}</Label>
          <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-lg font-black text-primary">{value}</span>
          <span className="text-xs text-muted-foreground">/{max}</span>
          {autoScore !== undefined && autoScore !== value && (
            <button
              type="button"
              className="block text-[10px] text-primary/70 underline mt-0.5 text-right"
              onClick={() => onChange(autoScore)}
            >
              AI suggests: {autoScore}
            </button>
          )}
        </div>
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
        <span>0 — Not present</span>
        <span>{max} — Full marks</span>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

const GUIDE_STEPS = [
  "Select a subject and chapter to filter questions.",
  "Tap 'Evaluate' on any question to open the smart evaluator.",
  "Upload a photo of your handwritten answer — AI will auto-suggest scores based on keyword matching with the model answer.",
  "Type your written answer text (optional) for even more accurate AI scoring — the system checks which key terms you covered.",
  "Adjust sliders manually if needed, then tap 'Submit Evaluation' to save.",
  "The AI score is based on: Introduction (2pts) + Key Points / Keyword Coverage (4pts) + Examples (2pts) + Conclusion (2pts) = 10 total.",
  "View your history and score trends in the 'History' tab.",
];

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
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [studentAnswerText, setStudentAnswerText] = useState("");

  // Scores
  const [introScore, setIntroScore] = useState(0);
  const [keyPointsScore, setKeyPointsScore] = useState(0);
  const [examplesScore, setExamplesScore] = useState(0);
  const [conclusionScore, setConclusionScore] = useState(0);

  // AI-suggested scores
  const [aiIntro, setAiIntro] = useState<number | undefined>(undefined);
  const [aiKeyPoints, setAiKeyPoints] = useState<number | undefined>(undefined);
  const [aiExamples, setAiExamples] = useState<number | undefined>(undefined);
  const [aiConclusion, setAiConclusion] = useState<number | undefined>(
    undefined,
  );
  const [keywordAnalysis, setKeywordAnalysis] = useState<{
    covered: string[];
    missed: string[];
    percentage: number;
  } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const totalScore =
    introScore + keyPointsScore + examplesScore + conclusionScore;
  const smartFeedback = evaluating
    ? getSmartFeedback(
        totalScore,
        keywordAnalysis?.percentage ?? 0,
        introScore > 0,
        conclusionScore > 0,
        examplesScore > 0,
      )
    : null;

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

  // Run AI analysis whenever student answer text changes
  const runAiAnalysis = (text: string, modelAnswer: string) => {
    if (!text.trim()) {
      setKeywordAnalysis(null);
      setAiIntro(undefined);
      setAiKeyPoints(undefined);
      setAiExamples(undefined);
      setAiConclusion(undefined);
      return;
    }

    const kwa = scoreKeywordCoverage(text, modelAnswer);
    setKeywordAnalysis(kwa);

    // AI-suggest intro score: check if first sentence looks like an intro
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const firstSentenceWords = sentences[0]?.split(/\s+/).length ?? 0;
    const suggestedIntro =
      firstSentenceWords >= 5 ? 2 : firstSentenceWords >= 3 ? 1 : 0;
    setAiIntro(suggestedIntro);

    // AI-suggest key points score based on keyword coverage
    const suggestedKeyPoints =
      kwa.percentage >= 80
        ? 4
        : kwa.percentage >= 60
          ? 3
          : kwa.percentage >= 40
            ? 2
            : kwa.percentage >= 20
              ? 1
              : 0;
    setAiKeyPoints(suggestedKeyPoints);

    // AI-suggest examples: look for example indicator words
    const exampleIndicators = [
      "example",
      "eg",
      "such as",
      "like",
      "for instance",
      "diagram",
      "fig",
      "figure",
      "e.g",
    ];
    const hasExamples = exampleIndicators.some((ind) =>
      text.toLowerCase().includes(ind),
    );
    setAiExamples(hasExamples ? 2 : text.length > 200 ? 1 : 0);

    // AI-suggest conclusion: check if last sentence looks like a conclusion
    const lastSentence = sentences[sentences.length - 1] ?? "";
    const conclusionIndicators = [
      "therefore",
      "thus",
      "hence",
      "conclusion",
      "conclude",
      "summary",
      "important",
      "finally",
      "overall",
      "so",
    ];
    const hasConclusion =
      conclusionIndicators.some((w) =>
        lastSentence.toLowerCase().includes(w),
      ) ||
      (sentences.length >= 3 && lastSentence.split(/\s+/).length >= 5);
    setAiConclusion(
      hasConclusion ? 2 : lastSentence.split(/\s+/).length >= 4 ? 1 : 0,
    );
  };

  // Auto-apply AI suggestions when answer text changes
  const handleStudentAnswerChange = (text: string) => {
    setStudentAnswerText(text);
    if (evaluating) {
      runAiAnalysis(text, evaluating.answer);
    }
  };

  // Apply all AI suggestions at once
  const applyAllAiSuggestions = () => {
    if (aiIntro !== undefined) setIntroScore(aiIntro);
    if (aiKeyPoints !== undefined) setKeyPointsScore(aiKeyPoints);
    if (aiExamples !== undefined) setExamplesScore(aiExamples);
    if (aiConclusion !== undefined) setConclusionScore(aiConclusion);
    toast.success("AI scores applied — adjust manually if needed.");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;
    if (!rawFile.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    const previewUrl = URL.createObjectURL(rawFile);
    setImagePreview(previewUrl);
    setImageData("");
    setUploadingImage(true);

    try {
      const file = await compressImage(rawFile);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      await blob.getBytes();
      const url = blob.getDirectURL();
      setImageData(url);
      URL.revokeObjectURL(previewUrl);
      setImagePreview("");
    } catch {
      toast.error("Failed to upload image. Please try again.");
      URL.revokeObjectURL(previewUrl);
      setImagePreview("");
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setUploadingImage(false);
    }
  };

  const handleStartEvaluation = (q: LocalQuestion) => {
    setEvaluating(q);
    setImageData("");
    setImagePreview("");
    setUploadingImage(false);
    setStudentAnswerText("");
    setIntroScore(0);
    setKeyPointsScore(0);
    setExamplesScore(0);
    setConclusionScore(0);
    setAiIntro(undefined);
    setAiKeyPoints(undefined);
    setAiExamples(undefined);
    setAiConclusion(undefined);
    setKeywordAnalysis(null);
  };

  const handleSubmitEvaluation = () => {
    if (!evaluating) return;
    if (uploadingImage) {
      toast.error("Please wait for the image to finish uploading.");
      return;
    }
    if (!imageData && !studentAnswerText.trim()) {
      toast.error("Please upload a photo or type your answer.");
      return;
    }

    const evalRecord: LocalAnswerEvaluation = {
      id: `ae_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      questionId: evaluating.id,
      questionText: evaluating.questionText,
      modelAnswer: evaluating.answer,
      imageData: imageData || "",
      introScore,
      keyPointsScore,
      examplesScore,
      conclusionScore,
      totalScore,
      feedback: smartFeedback?.summary ?? "",
      evaluatedAt: Date.now(),
    };
    const updated = [evalRecord, ...evals];
    setEvals(updated);
    saveAnswerEvaluations(userId, updated);
    toast.success(`Evaluation saved! Score: ${totalScore}/10`);
    setEvaluating(null);
  };

  const handleDeleteEval = (id: string) => {
    const updated = evals.filter((e) => e.id !== id);
    setEvals(updated);
    saveAnswerEvaluations(userId, updated);
    toast.success("Evaluation deleted.");
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
            Smart AI scoring — keyword coverage + manual rubric out of 10
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
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-start justify-between gap-3 p-5 border-b border-border sticky top-0 bg-card z-10">
              <div className="flex-1">
                <h2 className="font-bold text-base">Evaluate Answer</h2>
                <p className="text-sm text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                  {evaluating.questionText}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEvaluating(null)}
                className="text-muted-foreground hover:text-foreground flex-shrink-0"
                data-ocid="eval.close.button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Model Answer */}
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-primary flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  Model Answer
                </Label>
                <div className="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed text-foreground">
                  {evaluating.answer}
                </div>
              </div>

              {/* Student Answer Text (for AI analysis) */}
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">
                  Type Your Answer (for AI Analysis)
                  <span className="text-[11px] font-normal text-muted-foreground ml-1">
                    — optional but improves accuracy
                  </span>
                </Label>
                <textarea
                  className="w-full border border-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  rows={4}
                  placeholder="Type or paste your written answer here for AI keyword analysis..."
                  value={studentAnswerText}
                  onChange={(e) => handleStudentAnswerChange(e.target.value)}
                  data-ocid="eval.student_answer.textarea"
                />

                {/* AI Keyword Analysis */}
                {keywordAnalysis && (
                  <div className="mt-2 bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs font-semibold text-primary">
                        AI Analysis: {keywordAnalysis.percentage}% key concepts
                        covered
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={applyAllAiSuggestions}
                        data-ocid="eval.apply_ai.button"
                      >
                        Apply AI Scores
                      </Button>
                    </div>
                    <Progress
                      value={keywordAnalysis.percentage}
                      className="h-2"
                    />
                    {keywordAnalysis.covered.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] text-green-600 font-semibold">
                          Covered:
                        </span>
                        {keywordAnalysis.covered.slice(0, 10).map((kw) => (
                          <span
                            key={kw}
                            className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                    {keywordAnalysis.missed.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] text-red-600 font-semibold">
                          Missed:
                        </span>
                        {keywordAnalysis.missed.slice(0, 8).map((kw) => (
                          <span
                            key={kw}
                            className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">
                  Upload Handwritten Answer Photo
                  <span className="text-[11px] font-normal text-muted-foreground ml-1">
                    — optional
                  </span>
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
                  onClick={() => !uploadingImage && fileRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  data-ocid="eval.upload_button"
                >
                  {uploadingImage ? (
                    <>
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Uploading"
                          className="max-h-40 rounded-lg object-contain opacity-60"
                        />
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading image…
                      </div>
                    </>
                  ) : imageData ? (
                    <img
                      src={imageData}
                      alt="Your answer"
                      className="max-h-40 rounded-lg object-contain"
                    />
                  ) : (
                    <>
                      <ImageIcon className="w-7 h-7 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Tap to upload answer photo
                      </p>
                    </>
                  )}
                </button>
                {imageData && !uploadingImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageData("");
                      setImagePreview("");
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="text-xs text-destructive hover:underline mt-1"
                    data-ocid="eval.remove_image.button"
                  >
                    Remove image
                  </button>
                )}
              </div>

              {/* Scoring Rubric */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Scoring Rubric (10 marks)
                  </Label>
                  {(aiIntro !== undefined || aiKeyPoints !== undefined) && (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-primary border-primary/30"
                    >
                      AI suggestions active
                    </Badge>
                  )}
                </div>
                <ScoreSlider
                  label="Introduction (2 marks)"
                  desc="Clear opening sentence that defines or introduces the topic"
                  value={introScore}
                  max={2}
                  onChange={setIntroScore}
                  ocid="eval.intro.input"
                  autoScore={aiIntro}
                />
                <ScoreSlider
                  label="Key Points / Content Coverage (4 marks)"
                  desc="Main facts, concepts, and key terms from the model answer are present"
                  value={keyPointsScore}
                  max={4}
                  onChange={setKeyPointsScore}
                  ocid="eval.keypoints.input"
                  autoScore={aiKeyPoints}
                />
                <ScoreSlider
                  label="Examples / Diagrams / Applications (2 marks)"
                  desc="Real examples, diagrams, labels, or practical applications mentioned"
                  value={examplesScore}
                  max={2}
                  onChange={setExamplesScore}
                  ocid="eval.examples.input"
                  autoScore={aiExamples}
                />
                <ScoreSlider
                  label="Conclusion / Summary (2 marks)"
                  desc="Closing sentence that wraps up or summarizes the answer"
                  value={conclusionScore}
                  max={2}
                  onChange={setConclusionScore}
                  ocid="eval.conclusion.input"
                  autoScore={aiConclusion}
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p
                    className={`text-sm font-medium ${getFeedbackColor(totalScore)}`}
                  >
                    {smartFeedback?.summary}
                  </p>
                  <StarScore score={totalScore} />
                </div>
                {smartFeedback?.tips && smartFeedback.tips.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {smartFeedback.tips.map((tip) => (
                      <li
                        key={tip}
                        className="text-xs text-muted-foreground flex gap-1.5"
                      >
                        <span className="text-primary mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEvaluating(null)}
                  data-ocid="eval.cancel.button"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmitEvaluation}
                  disabled={
                    uploadingImage || (!imageData && !studentAnswerText.trim())
                  }
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

        {/* QUESTIONS TAB */}
        <TabsContent value="questions">
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
                const lastScore = alreadyEvaluated[0]?.totalScore;
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
                                className={`text-[10px] px-1.5 py-0 ${
                                  (lastScore ?? 0) >= 7
                                    ? "text-green-600 border-green-300"
                                    : (lastScore ?? 0) >= 5
                                      ? "text-yellow-600 border-yellow-300"
                                      : "text-red-600 border-red-300"
                                }`}
                              >
                                Best: {lastScore}/10 ({alreadyEvaluated.length}
                                ×)
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

        {/* HISTORY TAB */}
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
                            <button
                              type="button"
                              onClick={() => handleDeleteEval(ev.id)}
                              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                              data-ocid={`eval.history.delete_button.${i + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
