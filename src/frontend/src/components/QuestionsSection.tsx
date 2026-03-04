import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type LocalQuestion,
  useAddQuestion,
  useDeleteQuestion,
  useGetQuestionsForChapter,
} from "../hooks/useQueries";

function QuestionCard({
  question,
  onDelete,
}: { question: LocalQuestion; onDelete: () => void }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="border rounded-lg p-3 bg-background space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium flex-1">{question.questionText}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive flex-shrink-0"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
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
        <div className="bg-muted/50 rounded-md p-2">
          <p className="text-sm text-muted-foreground">{question.answer}</p>
        </div>
      )}
    </div>
  );
}

interface QuestionsSectionProps {
  chapterId: number;
  subjectId: number;
}

export default function QuestionsSection({
  chapterId,
  subjectId,
}: QuestionsSectionProps) {
  const { data: questions = [], isLoading } =
    useGetQuestionsForChapter(chapterId);
  const addQuestion = useAddQuestion();
  const deleteQuestion = useDeleteQuestion();

  const [showForm, setShowForm] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [answer, setAnswer] = useState("");

  const handleAdd = async () => {
    if (!questionText.trim() || !answer.trim()) {
      toast.error("Please enter both question and answer");
      return;
    }
    try {
      await addQuestion.mutateAsync({
        chapterId,
        subjectId,
        questionText: questionText.trim(),
        answer: answer.trim(),
      });
      toast.success("Question added!");
      setQuestionText("");
      setAnswer("");
      setShowForm(false);
    } catch {
      toast.error("Failed to add question");
    }
  };

  const handleDelete = async (questionId: number) => {
    try {
      await deleteQuestion.mutateAsync(questionId);
      toast.success("Question deleted");
    } catch {
      toast.error("Failed to delete question");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {questions.length} question{questions.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(!showForm)}
          className="gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Question
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <div className="space-y-1">
            <Label className="text-xs">Question *</Label>
            <Textarea
              placeholder="Enter your question..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={2}
              className="text-sm"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Answer *</Label>
            <Textarea
              placeholder="Enter the answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={addQuestion.isPending}
              className="flex-1"
            >
              {addQuestion.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              Save Question
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setQuestionText("");
                setAnswer("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {questions.length === 0 && !showForm ? (
        <div className="text-center py-6 text-muted-foreground">
          <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No questions yet. Add practice Q&A pairs!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onDelete={() => handleDelete(q.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
