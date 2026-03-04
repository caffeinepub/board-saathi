import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateMockTest, useGetSubjects } from "../hooks/useQueries";

interface MCQQuestionForm {
  id: number;
  questionText: string;
  options: string[];
  correctOption: number;
}

export default function CreateMockTestPage() {
  const navigate = useNavigate();
  const { data: subjects = [] } = useGetSubjects();
  const createMockTest = useCreateMockTest();

  const [testName, setTestName] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [questions, setQuestions] = useState<MCQQuestionForm[]>([
    { id: 1, questionText: "", options: ["", "", "", ""], correctOption: 0 },
  ]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        questionText: "",
        options: ["", "", "", ""],
        correctOption: 0,
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length === 1) {
      toast.error("At least one question is required");
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (
    idx: number,
    field: keyof MCQQuestionForm,
    value: string | number | string[],
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)),
    );
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOptions = [...q.options];
        newOptions[optIdx] = value;
        return { ...q, options: newOptions };
      }),
    );
  };

  const handleCreate = async () => {
    if (!testName.trim()) {
      toast.error("Please enter a test name");
      return;
    }
    if (!subjectId) {
      toast.error("Please select a subject");
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Question ${i + 1} is empty`);
        return;
      }
      if (q.options.some((o) => !o.trim())) {
        toast.error(`All options for Question ${i + 1} must be filled`);
        return;
      }
    }

    try {
      const _id = await createMockTest.mutateAsync({
        name: testName.trim(),
        subjectId: Number.parseInt(subjectId, 10),
        questions: questions.map((q) => ({
          id: q.id,
          questionText: q.questionText.trim(),
          options: q.options.map((o) => o.trim()),
          correctOption: q.correctOption,
        })),
      });
      toast.success("Mock test created!");
      navigate({ to: "/mock-tests" });
    } catch {
      toast.error("Failed to create test");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/mock-tests" })}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Create Mock Test</h1>
      </div>

      <div className="space-y-6">
        {/* Test details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-name">Test Name *</Label>
              <Input
                id="test-name"
                placeholder="e.g., Chapter 1 Practice Test"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        {questions.map((q, qIdx) => (
          <Card key={q.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Question {qIdx + 1}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removeQuestion(qIdx)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Question Text *</Label>
                <Input
                  placeholder="Enter your question..."
                  value={q.questionText}
                  onChange={(e) =>
                    updateQuestion(qIdx, "questionText", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">
                  Options (select correct answer)
                </Label>
                <RadioGroup
                  value={q.correctOption.toString()}
                  onValueChange={(v) =>
                    updateQuestion(
                      qIdx,
                      "correctOption",
                      Number.parseInt(v, 10),
                    )
                  }
                >
                  {q.options.map((opt, optIdx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed 4-option MCQ list
                    <div key={optIdx} className="flex items-center gap-3">
                      <RadioGroupItem
                        value={optIdx.toString()}
                        id={`q${qIdx}-opt${optIdx}`}
                      />
                      <Input
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        value={opt}
                        onChange={(e) =>
                          updateOption(qIdx, optIdx, e.target.value)
                        }
                        className="flex-1 h-8 text-sm"
                      />
                    </div>
                  ))}
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Select the radio button next to the correct answer
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addQuestion}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </Button>

        <Button
          onClick={handleCreate}
          disabled={createMockTest.isPending}
          className="w-full"
        >
          {createMockTest.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Create Test
        </Button>
      </div>
    </div>
  );
}
