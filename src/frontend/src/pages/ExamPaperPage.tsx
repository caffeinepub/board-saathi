import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  type LocalExamPaper,
  type LocalExamPaperQuestion,
  type LocalQuestion,
  getChapters,
  getCurrentUserId,
  getExamPapers,
  getQuestions,
  getSubjects,
  saveExamPapers,
} from "../utils/localStorageService";

type Step = 1 | 2 | 3;

const GUIDE_STEPS = [
  "Step 1 — Configure your paper: give it a title, pick subjects/chapters, set marks per question and time limit.",
  "Step 2 — Select questions from your question bank. Use filters to narrow down by subject and chapter.",
  "Step 3 — Preview the generated paper. Use the Print button to print or save as PDF.",
  "Saved papers appear at the top of the page. You can delete old papers anytime.",
];

export default function ExamPaperPage() {
  const userId = getCurrentUserId() ?? "guest";

  // ── Saved papers
  const [papers, setPapers] = useState<LocalExamPaper[]>(() =>
    getExamPapers(userId),
  );

  // ── Guide
  const [guideOpen, setGuideOpen] = useState(false);

  // ── Step
  const [step, setStep] = useState<Step>(1);

  // ── Step 1 state
  const [title, setTitle] = useState("Practice Paper");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState<number[]>([]);
  const [marksPerQuestion, setMarksPerQuestion] = useState(2);
  const [timeLimit, setTimeLimit] = useState(60);

  // ── Step 2 state
  const [filterSubjectId, setFilterSubjectId] = useState<number | "all">("all");
  const [filterChapterId, setFilterChapterId] = useState<number | "all">("all");
  const [selectedQIds, setSelectedQIds] = useState<Set<number>>(new Set());
  const [allQuestions, setAllQuestions] = useState<LocalQuestion[]>([]);

  // ── Step 3 state
  const [generatedPaper, setGeneratedPaper] = useState<LocalExamPaper | null>(
    null,
  );
  const [viewPaper, setViewPaper] = useState<LocalExamPaper | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Data
  const subjects = getSubjects(userId);
  const chapters = getChapters(userId);

  useEffect(() => {
    const qs = getQuestions(userId);
    setAllQuestions(qs);
  }, [userId]);

  // Filtered questions for step 2
  const filteredQuestions = allQuestions.filter((q) => {
    const inSubject =
      selectedSubjectIds.length === 0 ||
      selectedSubjectIds.includes(q.subjectId);
    const inChapter =
      selectedChapterIds.length === 0 ||
      selectedChapterIds.includes(q.chapterId);
    const matchFilter =
      filterSubjectId === "all" || q.subjectId === filterSubjectId;
    const matchChapterFilter =
      filterChapterId === "all" || q.chapterId === filterChapterId;
    return inSubject && inChapter && matchFilter && matchChapterFilter;
  });

  const toggleSubject = (id: number) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    // Also clear chapter filter for removed subjects
    setSelectedChapterIds((prev) => {
      const chaptersForSubject = chapters
        .filter((c) => c.subjectId === id)
        .map((c) => c.id);
      return prev.filter((cid) => !chaptersForSubject.includes(cid));
    });
  };

  const toggleChapter = (id: number) => {
    setSelectedChapterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleQuestion = (id: number) => {
    setSelectedQIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const chaptersForSelectedSubjects =
    selectedSubjectIds.length > 0
      ? chapters.filter((c) => selectedSubjectIds.includes(c.subjectId))
      : chapters;

  const chaptersForFilterSubject =
    filterSubjectId === "all"
      ? chaptersForSelectedSubjects
      : chaptersForSelectedSubjects.filter(
          (c) => c.subjectId === filterSubjectId,
        );

  const handleGoToStep2 = () => {
    if (!title.trim()) {
      toast.error("Please enter a paper title.");
      return;
    }
    setStep(2);
  };

  const handleGeneratePaper = useCallback(() => {
    if (selectedQIds.size === 0) {
      toast.error("Please select at least one question.");
      return;
    }

    const questions: LocalExamPaperQuestion[] = Array.from(selectedQIds)
      .map((qid) => allQuestions.find((q) => q.id === qid))
      .filter(Boolean)
      .map(
        (q) =>
          ({
            questionId: q!.id,
            questionText: q!.questionText,
            answer: q!.answer,
            chapterId: q!.chapterId,
            subjectId: q!.subjectId,
            marks: marksPerQuestion,
          }) as LocalExamPaperQuestion,
      );

    const paper: LocalExamPaper = {
      id: `ep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      subjectIds: selectedSubjectIds,
      chapterIds: selectedChapterIds,
      questions,
      marksPerQuestion,
      totalMarks: questions.length * marksPerQuestion,
      timeLimit,
      createdAt: Date.now(),
    };

    const updated = [paper, ...papers];
    setPapers(updated);
    saveExamPapers(userId, updated);
    setGeneratedPaper(paper);
    setStep(3);
    toast.success("Exam paper generated!");
  }, [
    selectedQIds,
    allQuestions,
    marksPerQuestion,
    title,
    selectedSubjectIds,
    selectedChapterIds,
    timeLimit,
    papers,
    userId,
  ]);

  const handleDeletePaper = (id: string) => {
    const updated = papers.filter((p) => p.id !== id);
    setPapers(updated);
    saveExamPapers(userId, updated);
    if (generatedPaper?.id === id) setGeneratedPaper(null);
    if (viewPaper?.id === id) setViewPaper(null);
    toast.success("Paper deleted.");
  };

  const handleReset = () => {
    setStep(1);
    setTitle("Practice Paper");
    setSelectedSubjectIds([]);
    setSelectedChapterIds([]);
    setMarksPerQuestion(2);
    setTimeLimit(60);
    setSelectedQIds(new Set());
    setGeneratedPaper(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const paperToView = viewPaper ?? generatedPaper;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Exam Paper Generator
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Auto-generate full practice papers from your question bank
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setGuideOpen((v) => !v)}
          data-ocid="exam.guide.toggle"
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

      {/* Saved Papers */}
      {papers.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Saved Papers</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {papers.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  data-ocid={`exam.paper.item.${i + 1}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.questions.length} questions · {p.totalMarks} marks ·{" "}
                      {p.timeLimit} min ·{" "}
                      {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setViewPaper(p);
                        setStep(3);
                      }}
                      data-ocid={`exam.paper.edit_button.${i + 1}`}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeletePaper(p.id)}
                      data-ocid={`exam.paper.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : step > s
                    ? "bg-primary/30 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            {s < 3 && <div className="w-8 h-0.5 bg-border" />}
          </div>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {step === 1
            ? "Configure"
            : step === 2
              ? "Select Questions"
              : "Preview & Print"}
        </span>
      </div>

      {/* ─── STEP 1 ─── */}
      {step === 1 && (
        <Card data-ocid="exam.config.card">
          <CardHeader>
            <CardTitle className="text-base">Step 1: Configure Paper</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-1 block">
                Paper Title
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Science Mid-Term Practice"
                data-ocid="exam.title.input"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Select Subjects
              </Label>
              {subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No subjects added yet. Add subjects first.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubject(s.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selectedSubjectIds.includes(s.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-muted-foreground hover:border-primary/50"
                      }`}
                      data-ocid="exam.subject.toggle"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedSubjectIds.length > 0 &&
              chaptersForSelectedSubjects.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Select Chapters (optional — leave empty for all)
                  </Label>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                    {chaptersForSelectedSubjects.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleChapter(c.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selectedChapterIds.includes(c.id)
                            ? "bg-accent text-accent-foreground border-accent"
                            : "bg-background border-border text-muted-foreground hover:border-accent/50"
                        }`}
                        data-ocid="exam.chapter.toggle"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  Marks per Question
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={marksPerQuestion}
                  onChange={(e) =>
                    setMarksPerQuestion(Math.max(1, Number(e.target.value)))
                  }
                  data-ocid="exam.marks.input"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  Time Limit (minutes)
                </Label>
                <Input
                  type="number"
                  min={10}
                  max={300}
                  value={timeLimit}
                  onChange={(e) =>
                    setTimeLimit(Math.max(10, Number(e.target.value)))
                  }
                  data-ocid="exam.time.input"
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleGoToStep2}
              data-ocid="exam.next.button"
            >
              Next: Select Questions →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 2 ─── */}
      {step === 2 && (
        <Card data-ocid="exam.questions.card">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Step 2: Select Questions</span>
              <Badge variant="secondary">{selectedQIds.size} selected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
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
                  data-ocid="exam.filter.subject.select"
                >
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {(selectedSubjectIds.length > 0
                    ? subjects.filter((s) => selectedSubjectIds.includes(s.id))
                    : subjects
                  ).map((s) => (
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
                  disabled={chaptersForFilterSubject.length === 0}
                  data-ocid="exam.filter.chapter.select"
                >
                  <SelectValue placeholder="All Chapters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chapters</SelectItem>
                  {chaptersForFilterSubject.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const ids = filteredQuestions.map((q) => q.id);
                  setSelectedQIds((prev) => {
                    const next = new Set(prev);
                    for (const id of ids) next.add(id);
                    return next;
                  });
                }}
                data-ocid="exam.select_all.button"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedQIds(new Set())}
                data-ocid="exam.clear_all.button"
              >
                Clear
              </Button>
            </div>

            {filteredQuestions.length === 0 ? (
              <div
                className="text-center py-12"
                data-ocid="exam.questions.empty_state"
              >
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No questions found. Add questions to chapters first.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredQuestions.map((q, i) => {
                  const chap = chapters.find((c) => c.id === q.chapterId);
                  const subj = subjects.find((s) => s.id === q.subjectId);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedQIds.has(q.id)
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:border-border/80 hover:bg-muted/30"
                      }`}
                      onClick={() => toggleQuestion(q.id)}
                      data-ocid={`exam.question.item.${i + 1}`}
                    >
                      <Checkbox
                        checked={selectedQIds.has(q.id)}
                        onCheckedChange={() => toggleQuestion(q.id)}
                        className="mt-0.5 pointer-events-none"
                        data-ocid={`exam.question.checkbox.${i + 1}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">
                          {q.questionText}
                        </p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
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
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                data-ocid="exam.back.button"
              >
                ← Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleGeneratePaper}
                disabled={selectedQIds.size === 0}
                data-ocid="exam.generate.button"
              >
                Generate Paper ({selectedQIds.size} questions)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 3: Preview ─── */}
      {step === 3 && paperToView && (
        <div>
          <div className="flex gap-3 mb-4 flex-wrap">
            <Button
              variant="outline"
              onClick={() => {
                setViewPaper(null);
                if (!generatedPaper) setStep(1);
                else setStep(2);
              }}
              data-ocid="exam.back_to_list.button"
            >
              ← Back
            </Button>
            <Button
              onClick={handlePrint}
              className="flex items-center gap-2"
              data-ocid="exam.print.button"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              data-ocid="exam.new_paper.button"
            >
              + Create New Paper
            </Button>
          </div>

          {/* Print Area */}
          <div
            ref={printRef}
            className="bg-white rounded-xl border border-border shadow-sm p-6 md:p-10 print:shadow-none print:border-none print:rounded-none"
            data-ocid="exam.preview.card"
          >
            {/* Paper Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                {paperToView.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Board Saathi — CBSE Class 10 Practice Paper
              </p>
              <div className="flex justify-center gap-8 mt-3 text-sm text-gray-700">
                <span>
                  <strong>Date:</strong>{" "}
                  {new Date(paperToView.createdAt).toLocaleDateString("en-IN")}
                </span>
                <span>
                  <strong>Total Marks:</strong> {paperToView.totalMarks}
                </span>
                <span>
                  <strong>Time:</strong> {paperToView.timeLimit} minutes
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-6 text-xs text-gray-600">
              <strong>General Instructions:</strong> All questions are
              compulsory. Each question carries {paperToView.marksPerQuestion}{" "}
              marks. Read each question carefully before answering.
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {paperToView.questions.map((q, i) => (
                <div
                  key={q.questionId}
                  data-ocid={`exam.preview.question.item.${i + 1}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-gray-900 w-8 flex-shrink-0">
                      {i + 1}.
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between gap-2">
                        <p className="text-sm text-gray-900 font-medium leading-relaxed">
                          {q.questionText}
                        </p>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          [{q.marks} marks]
                        </span>
                      </div>
                      {/* Answer lines */}
                      <div className="mt-3 space-y-2">
                        {(["l1", "l2", "l3", "l4"] as const).map((lk) => (
                          <div
                            key={lk}
                            className="border-b border-gray-300 h-6"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-300 mt-8 pt-4 text-center text-xs text-gray-400">
              Generated by Board Saathi · Total Questions:{" "}
              {paperToView.questions.length} · Total Marks:{" "}
              {paperToView.totalMarks}
            </div>
          </div>
        </div>
      )}

      {step === 3 && !paperToView && (
        <div className="text-center py-16" data-ocid="exam.empty_state">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No paper selected.</p>
          <Button
            className="mt-4"
            onClick={handleReset}
            data-ocid="exam.create.button"
          >
            Create New Paper
          </Button>
        </div>
      )}

      {/* Print styles injected inline so they work without a separate CSS file */}
      <style>{`
        @media print {
          body > *:not(#root) { display: none !important; }
          #root > * { display: none !important; }
          [data-ocid="exam.preview.card"] {
            display: block !important;
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            z-index: 9999;
          }
        }
      `}</style>
    </div>
  );
}
