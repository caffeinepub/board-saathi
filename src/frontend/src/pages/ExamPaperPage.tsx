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
  Download,
  FileText,
  Loader2,
  Plus,
  Trash2,
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

// ── Local types ───────────────────────────────────────────────────────────────
interface ExamSection {
  id: string;
  name: string;
  marksPerQuestion: number;
}

type Step = 1 | 2 | 3;

const GUIDE_STEPS = [
  "Step 1 — Give your paper a title, pick subjects/chapters, set the time limit, then add sections (Section A, B, C...) with custom names and marks per question for each section.",
  "Step 2 — Select questions from your question bank and assign each question to a section using the section picker.",
  "Step 3 — Preview the generated paper in A4 format with section-wise grouping. Tap 'Save as PDF' to directly download the full A4 PDF to your device — no print dialog required.",
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
  const [timeLimit, setTimeLimit] = useState(60);
  const [sections, setSections] = useState<ExamSection[]>([
    { id: "sec_1", name: "Section A", marksPerQuestion: 2 },
  ]);

  // ── Step 2 state
  const [filterSubjectId, setFilterSubjectId] = useState<number | "all">("all");
  const [filterChapterId, setFilterChapterId] = useState<number | "all">("all");
  const [selectedQIds, setSelectedQIds] = useState<Set<number>>(new Set());
  const [allQuestions, setAllQuestions] = useState<LocalQuestion[]>([]);
  // Maps question id → section id
  const [questionSectionMap, setQuestionSectionMap] = useState<
    Record<number, string>
  >({});

  // ── Step 3 state
  const [generatedPaper, setGeneratedPaper] = useState<LocalExamPaper | null>(
    null,
  );
  const [generatedSections, setGeneratedSections] = useState<ExamSection[]>([]);
  const [viewPaper, setViewPaper] = useState<LocalExamPaper | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Data
  const subjects = getSubjects(userId);
  const chapters = getChapters(userId);

  useEffect(() => {
    const qs = getQuestions(userId);
    setAllQuestions(qs);
  }, [userId]);

  // When sections change, update questionSectionMap defaults so unset questions point to sections[0]
  useEffect(() => {
    if (sections.length === 0) return;
    setQuestionSectionMap((prev) => {
      const next = { ...prev };
      // Remove references to deleted sections
      const validIds = new Set(sections.map((s) => s.id));
      for (const [qid, sid] of Object.entries(next)) {
        if (!validIds.has(sid)) {
          next[Number(qid)] = sections[0].id;
        }
      }
      return next;
    });
  }, [sections]);

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
    // Default section assignment
    setQuestionSectionMap((prev) => {
      if (prev[id]) return prev;
      return { ...prev, [id]: sections[0]?.id ?? "sec_1" };
    });
  };

  // ── Section management ────────────────────────────────────────────────────
  const addSection = () => {
    const newId = `sec_${Date.now()}`;
    const letter = String.fromCharCode(65 + sections.length); // A=65
    setSections((prev) => [
      ...prev,
      { id: newId, name: `Section ${letter}`, marksPerQuestion: 1 },
    ]);
  };

  const updateSection = (
    id: string,
    field: keyof ExamSection,
    value: string | number,
  ) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const removeSection = (id: string) => {
    if (sections.length <= 1) {
      toast.error("At least one section is required.");
      return;
    }
    setSections((prev) => prev.filter((s) => s.id !== id));
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
    if (sections.some((s) => !s.name.trim())) {
      toast.error("Please give every section a name.");
      return;
    }
    setStep(2);
  };

  const handleGeneratePaper = useCallback(() => {
    if (selectedQIds.size === 0) {
      toast.error("Please select at least one question.");
      return;
    }

    const questions: (LocalExamPaperQuestion & { sectionId?: string })[] =
      Array.from(selectedQIds)
        .map((qid) => allQuestions.find((q) => q.id === qid))
        .filter(Boolean)
        .map((q) => {
          const sectionId =
            questionSectionMap[q!.id] ?? sections[0]?.id ?? "sec_1";
          const section = sections.find((s) => s.id === sectionId);
          const marks = section?.marksPerQuestion ?? 2;
          return {
            questionId: q!.id,
            questionText: q!.questionText,
            answer: q!.answer,
            chapterId: q!.chapterId,
            subjectId: q!.subjectId,
            marks,
            sectionId,
          } as LocalExamPaperQuestion & { sectionId?: string };
        });

    // Compute total marks across sections
    const totalMarks = sections.reduce((sum, sec) => {
      const count = questions.filter(
        (q) => (q as { sectionId?: string }).sectionId === sec.id,
      ).length;
      return sum + count * sec.marksPerQuestion;
    }, 0);

    // Use first section's marksPerQuestion as fallback for the LocalExamPaper type
    const paper = {
      id: `ep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      subjectIds: selectedSubjectIds,
      chapterIds: selectedChapterIds,
      questions: questions as LocalExamPaperQuestion[],
      marksPerQuestion: sections[0]?.marksPerQuestion ?? 2,
      totalMarks,
      timeLimit,
      createdAt: Date.now(),
    } as LocalExamPaper;

    const updated = [paper, ...papers];
    setPapers(updated);
    saveExamPapers(userId, updated);
    setGeneratedPaper(paper);
    setGeneratedSections([...sections]);
    setStep(3);
    toast.success("Exam paper generated!");
  }, [
    selectedQIds,
    allQuestions,
    questionSectionMap,
    sections,
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
    setSections([{ id: "sec_1", name: "Section A", marksPerQuestion: 2 }]);
    setTimeLimit(60);
    setSelectedQIds(new Set());
    setQuestionSectionMap({});
    setGeneratedPaper(null);
    setGeneratedSections([]);
    setViewPaper(null);
  };

  const [savingPdf, setSavingPdf] = useState(false);

  const handleSaveAsPdf = useCallback(() => {
    if (!printRef.current) return;
    setSavingPdf(true);

    const currentPaper = viewPaper ?? generatedPaper;
    const safeTitle = (currentPaper?.title ?? "Exam Paper")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim();

    // Inject print styles dynamically
    const styleId = "exam-print-style";
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = `
      @media print {
        body > * { display: none !important; }
        #exam-print-area { display: block !important; position: static !important; }
        #exam-print-area * { visibility: visible !important; }
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 15mm 15mm;
        }
        .print-section-wrapper { page-break-inside: avoid; }
        .print-question-block { page-break-inside: avoid; margin-bottom: 18px; }
      }
    `;

    // Move print content to a top-level div for printing
    const printDiv = document.createElement("div");
    printDiv.id = "exam-print-area";
    printDiv.style.display = "none";
    printDiv.innerHTML = printRef.current.outerHTML;
    document.body.appendChild(printDiv);

    // Set document title to paper title for PDF filename
    const prevTitle = document.title;
    document.title = safeTitle;

    const cleanup = () => {
      document.title = prevTitle;
      printDiv.remove();
      style!.textContent = "";
      setSavingPdf(false);
    };

    // afterprint fires when print dialog closes
    const onAfterPrint = () => {
      cleanup();
      window.removeEventListener("afterprint", onAfterPrint);
    };
    window.addEventListener("afterprint", onAfterPrint);

    // Fallback cleanup after 60s in case afterprint never fires
    const fallback = setTimeout(() => {
      cleanup();
      window.removeEventListener("afterprint", onAfterPrint);
    }, 60000);

    setTimeout(() => {
      window.print();
      clearTimeout(fallback);
    }, 100);
  }, [viewPaper, generatedPaper]);

  const paperToView = viewPaper ?? generatedPaper;

  // For preview: determine sections to use
  // If viewing a saved paper (not just generated), use generatedSections or fall back to single-section
  const sectionsForPreview: ExamSection[] =
    generatedSections.length > 0
      ? generatedSections
      : [
          {
            id: "sec_fallback",
            name: "Questions",
            marksPerQuestion: paperToView?.marksPerQuestion ?? 2,
          },
        ];

  // Group questions by sectionId for preview
  const questionsBySectionId: Record<
    string,
    (LocalExamPaperQuestion & { sectionId?: string })[]
  > = {};
  if (paperToView) {
    for (const sec of sectionsForPreview) {
      questionsBySectionId[sec.id] = [];
    }
    for (const q of paperToView.questions as (LocalExamPaperQuestion & {
      sectionId?: string;
    })[]) {
      const sid = q.sectionId ?? sectionsForPreview[0]?.id ?? "sec_fallback";
      if (!questionsBySectionId[sid]) {
        questionsBySectionId[sid] = [];
      }
      questionsBySectionId[sid].push(q);
    }
  }

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
            Auto-generate full practice papers with section-wise questions
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
                        setGeneratedSections([]);
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
                className="w-40"
                data-ocid="exam.time.input"
              />
            </div>

            {/* ── Sections Manager ─────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Sections</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSection}
                  className="gap-1.5 h-8 text-xs"
                  data-ocid="exam.add_section.button"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Section
                </Button>
              </div>

              <div
                className="space-y-3 border border-border rounded-xl p-3 bg-muted/30"
                data-ocid="exam.sections.list"
              >
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="flex items-center gap-2 flex-wrap"
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground w-5 font-bold flex-shrink-0">
                        {idx + 1}.
                      </span>
                      <Input
                        value={sec.name}
                        onChange={(e) =>
                          updateSection(sec.id, "name", e.target.value)
                        }
                        placeholder="Section name (e.g. Section A – MCQ)"
                        className="h-8 text-xs flex-1 min-w-28"
                        data-ocid="exam.section.name.input"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">
                        Marks/Q
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={sec.marksPerQuestion}
                        onChange={(e) =>
                          updateSection(
                            sec.id,
                            "marksPerQuestion",
                            Math.max(1, Number(e.target.value)),
                          )
                        }
                        className="h-8 w-16 text-xs"
                        data-ocid="exam.section.marks.input"
                      />
                      <button
                        type="button"
                        onClick={() => removeSection(sec.id)}
                        disabled={sections.length <= 1}
                        className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Remove section"
                        data-ocid="exam.remove_section.button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Each section can have a different marks-per-question value.
              </p>
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
              <span>Step 2: Select Questions & Assign Sections</span>
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
                  // Assign defaults
                  setQuestionSectionMap((prev) => {
                    const next = { ...prev };
                    for (const id of ids) {
                      if (!next[id]) next[id] = sections[0]?.id ?? "sec_1";
                    }
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

            {/* Section legend */}
            <div className="flex flex-wrap gap-2">
              {sections.map((sec) => (
                <Badge key={sec.id} variant="outline" className="text-xs gap-1">
                  {sec.name} — {sec.marksPerQuestion} mk/q
                </Badge>
              ))}
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
                  const sectionId =
                    questionSectionMap[q.id] ?? sections[0]?.id ?? "sec_1";
                  return (
                    <div
                      key={q.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        selectedQIds.has(q.id)
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:border-border/80 hover:bg-muted/30"
                      }`}
                      data-ocid={`exam.question.item.${i + 1}`}
                    >
                      <button
                        type="button"
                        className="flex items-start gap-3 flex-1 min-w-0 text-left"
                        onClick={() => toggleQuestion(q.id)}
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

                      {/* Section picker (only when question is selected) */}
                      {selectedQIds.has(q.id) && sections.length > 1 && (
                        <Select
                          value={sectionId}
                          onValueChange={(v) =>
                            setQuestionSectionMap((prev) => ({
                              ...prev,
                              [q.id]: v,
                            }))
                          }
                        >
                          <SelectTrigger
                            className="w-36 h-7 text-xs flex-shrink-0"
                            data-ocid="exam.question.section.select"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sections.map((sec) => (
                              <SelectItem
                                key={sec.id}
                                value={sec.id}
                                className="text-xs"
                              >
                                {sec.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
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
              onClick={handleSaveAsPdf}
              disabled={savingPdf}
              className="flex items-center gap-2"
              data-ocid="exam.save_device.button"
            >
              {savingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {savingPdf ? "Generating PDF..." : "Save as PDF"}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              data-ocid="exam.new_paper.button"
            >
              + Create New Paper
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mb-3">
            Tap "Save as PDF" to directly download the full multi-page A4 PDF —
            no print dialog needed.
          </p>

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
              <div className="flex justify-center gap-6 mt-3 text-sm text-gray-700 flex-wrap">
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
                <span>
                  <strong>Sections:</strong> {sectionsForPreview.length}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-6 text-xs text-gray-600">
              <strong>General Instructions:</strong> All questions are
              compulsory. Marks for each question are indicated in brackets.
              Read each question carefully before answering.
            </div>

            {/* Section-wise questions */}
            {sectionsForPreview.map((sec) => {
              const secQuestions =
                questionsBySectionId[sec.id] ??
                (
                  paperToView.questions as (LocalExamPaperQuestion & {
                    sectionId?: string;
                  })[]
                ).filter(
                  (q) => (q.sectionId ?? sectionsForPreview[0]?.id) === sec.id,
                );

              if (secQuestions.length === 0) return null;

              const secTotal = secQuestions.length * sec.marksPerQuestion;

              // Global question number offset
              let globalOffset = 0;
              for (const prevSec of sectionsForPreview) {
                if (prevSec.id === sec.id) break;
                globalOffset += (questionsBySectionId[prevSec.id] ?? []).length;
              }

              return (
                <div
                  key={sec.id}
                  className="print-section-wrapper"
                  style={{ marginBottom: "24px" }}
                >
                  {/* Section header */}
                  <div
                    className="print-section-header"
                    style={{
                      backgroundColor: "#f3f4f6",
                      borderBottom: "2px solid #374151",
                      padding: "8px 12px",
                      marginBottom: "16px",
                    }}
                  >
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="font-bold text-gray-900 text-sm">
                        {sec.name}
                      </span>
                      <span className="text-xs text-gray-600">
                        Total Marks: {secTotal} &nbsp;|&nbsp;{" "}
                        {sec.marksPerQuestion} mark
                        {sec.marksPerQuestion !== 1 ? "s" : ""} each
                      </span>
                    </div>
                  </div>

                  {/* Questions in this section */}
                  <div className="space-y-6">
                    {secQuestions.map((q, qi) => (
                      <div
                        key={q.questionId}
                        className="print-question-block"
                        data-ocid={`exam.preview.question.item.${globalOffset + qi + 1}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-bold text-gray-900 w-8 flex-shrink-0">
                            {globalOffset + qi + 1}.
                          </span>
                          <div className="flex-1">
                            <div className="flex justify-between gap-2">
                              <p className="text-sm text-gray-900 font-medium leading-relaxed">
                                {q.questionText}
                              </p>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                [{q.marks} mark{q.marks !== 1 ? "s" : ""}]
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
                </div>
              );
            })}

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
    </div>
  );
}
