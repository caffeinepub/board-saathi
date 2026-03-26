import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type LocalQuestion,
  useAddQuestion,
  useGetAllChapters,
  useGetQuestionBank,
  useGetSubjects,
} from "../hooks/useQueries";

function QuestionCard({ question }: { question: LocalQuestion }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-medium mb-2">{question.questionText}</p>
        <button
          type="button"
          onClick={() => setShowAnswer(!showAnswer)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {showAnswer ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
          {showAnswer ? "Hide Answer" : "Show Answer"}
        </button>
        {showAnswer && (
          <div className="mt-2 bg-muted/50 rounded-md p-2">
            <p className="text-sm text-muted-foreground">{question.answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function QuestionBankPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<
    number | undefined
  >(undefined);
  const [selectedChapterId, setSelectedChapterId] = useState<
    number | undefined
  >(undefined);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addSubjectId, setAddSubjectId] = useState<number | undefined>(
    undefined,
  );
  const [addChapterId, setAddChapterId] = useState<number | undefined>(
    undefined,
  );
  const [addQuestion, setAddQuestion] = useState("");
  const [addAnswer, setAddAnswer] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const addQuestionMutation = useAddQuestion();

  const { data: subjects = [] } = useGetSubjects();
  const { data: allChapters = [] } = useGetAllChapters();
  const { data: questions = [], isLoading } = useGetQuestionBank(
    selectedSubjectId,
    selectedChapterId,
  );

  const chaptersForSubject = selectedSubjectId
    ? allChapters.filter((c) => c.subjectId === selectedSubjectId)
    : [];
  const addChaptersForSubject = addSubjectId
    ? allChapters.filter((c) => c.subjectId === addSubjectId)
    : [];

  const handleSubjectChange = (val: string) => {
    if (val === "all") {
      setSelectedSubjectId(undefined);
    } else {
      setSelectedSubjectId(Number.parseInt(val, 10));
    }
    setSelectedChapterId(undefined);
  };

  const handleChapterChange = (val: string) => {
    if (val === "all") {
      setSelectedChapterId(undefined);
    } else {
      setSelectedChapterId(Number.parseInt(val, 10));
    }
  };

  const handleSaveQuestion = async () => {
    if (!addQuestion.trim() || !addAnswer.trim()) {
      toast.error("Question and answer are required");
      return;
    }
    if (!addSubjectId || !addChapterId) {
      toast.error("Please select a subject and chapter");
      return;
    }
    setAddSaving(true);
    try {
      await addQuestionMutation.mutateAsync({
        chapterId: addChapterId,
        subjectId: addSubjectId,
        questionText: addQuestion.trim(),
        answer: addAnswer.trim(),
      });
      toast.success("Question added to bank!");
      setAddDialogOpen(false);
      setAddQuestion("");
      setAddAnswer("");
      setAddSubjectId(undefined);
      setAddChapterId(undefined);
    } catch {
      toast.error("Failed to add question");
    } finally {
      setAddSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {questions.length} question{questions.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Select
          value={selectedSubjectId?.toString() ?? "all"}
          onValueChange={handleSubjectChange}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedChapterId?.toString() ?? "all"}
          onValueChange={handleChapterChange}
          disabled={!selectedSubjectId}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Chapters" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            <SelectItem value="all">All Chapters</SelectItem>
            {chaptersForSubject.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16">
          <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No questions found</h3>
          <p className="text-muted-foreground text-sm">
            Add questions inside chapters to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
      {/* FAB */}
      <button
        type="button"
        onClick={() => setAddDialogOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        data-ocid="question_bank.add_question.open_modal_button"
        aria-label="Add question"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Question Dialog */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) {
            setAddQuestion("");
            setAddAnswer("");
            setAddSubjectId(undefined);
            setAddChapterId(undefined);
          }
        }}
      >
        <DialogContent data-ocid="question_bank.add_question.dialog">
          <DialogHeader>
            <DialogTitle>Add Question to Bank</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-1.5 block">Subject</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={addSubjectId?.toString() ?? ""}
                onChange={(e) => {
                  setAddSubjectId(
                    e.target.value ? Number(e.target.value) : undefined,
                  );
                  setAddChapterId(undefined);
                }}
                data-ocid="question_bank.add_subject.select"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Chapter</Label>
              <ScrollArea className="max-h-40 border rounded-md">
                <select
                  className="w-full px-3 py-2 text-sm bg-background"
                  value={addChapterId?.toString() ?? ""}
                  onChange={(e) =>
                    setAddChapterId(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  disabled={!addSubjectId}
                  size={Math.min(5, addChaptersForSubject.length + 1)}
                  data-ocid="question_bank.add_chapter.select"
                >
                  <option value="">Select Chapter</option>
                  {addChaptersForSubject.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </ScrollArea>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Question *</Label>
              <Textarea
                value={addQuestion}
                onChange={(e) => setAddQuestion(e.target.value)}
                placeholder="Enter question"
                rows={3}
                data-ocid="question_bank.add_question.textarea"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Answer *</Label>
              <Textarea
                value={addAnswer}
                onChange={(e) => setAddAnswer(e.target.value)}
                placeholder="Enter answer"
                rows={3}
                data-ocid="question_bank.add_answer.textarea"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSaveQuestion}
              disabled={addSaving}
              data-ocid="question_bank.add_question.submit_button"
            >
              {addSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Save Question
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
