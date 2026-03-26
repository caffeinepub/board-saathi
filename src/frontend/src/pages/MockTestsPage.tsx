import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle,
  ClipboardList,
  Edit,
  FileText,
  Loader2,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useCreateMockTest,
  useDeleteMockTest,
  useGetMockTests,
  useGetSubjects,
  useGetTestAttempts,
} from "../hooks/useQueries";
import type { LocalMCQQuestion } from "../hooks/useQueries";
import {
  type LocalMockTestDraft,
  deleteMockTestDraft,
  getCurrentUserId,
  getMockTestDrafts,
  updateMockTestDraft,
} from "../utils/localStorageService";

export default function MockTestsPage() {
  const navigate = useNavigate();
  const { data: tests = [], isLoading } = useGetMockTests();
  const { data: subjects = [] } = useGetSubjects();
  const { data: attempts = [] } = useGetTestAttempts();
  const deleteMockTest = useDeleteMockTest();
  const createMockTest = useCreateMockTest();

  const userId = getCurrentUserId() || "guest";
  const [drafts, setDrafts] = useState<LocalMockTestDraft[]>([]);
  const [editDraft, setEditDraft] = useState<LocalMockTestDraft | null>(null);
  const [confirmingDraftId, setConfirmingDraftId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    setDrafts(getMockTestDrafts(userId));
  }, [userId]);

  const refreshDrafts = () => setDrafts(getMockTestDrafts(userId));

  const getSubjectName = (subjectId: number) =>
    subjects.find((s) => s.id === subjectId)?.name ?? "Unknown";

  const getAttemptsForTest = (testId: number) =>
    attempts.filter((a) => a.testId === testId);

  const getBestScore = (testId: number) => {
    const ta = getAttemptsForTest(testId);
    if (ta.length === 0) return null;
    return Math.max(...ta.map((a) => a.report.percentage));
  };

  const handleDeleteTest = async (testId: number) => {
    try {
      await deleteMockTest.mutateAsync(testId);
      toast.success("Test deleted");
    } catch {
      toast.error("Failed to delete test");
    }
  };

  const handleDeleteDraft = (draftId: number) => {
    deleteMockTestDraft(userId, draftId);
    refreshDrafts();
    toast.success("Draft deleted");
  };

  const handleConfirmDraft = async (draft: LocalMockTestDraft) => {
    setConfirmingDraftId(draft.id);
    try {
      const valid = draft.questions.every(
        (q) => q.questionText.trim() && q.options.every((o) => o.trim()),
      );
      if (!valid) {
        toast.error("Some questions are incomplete. Edit the draft first.");
        setConfirmingDraftId(null);
        return;
      }
      await createMockTest.mutateAsync({
        name: draft.name,
        subjectId: draft.subjectId,
        questions: draft.questions,
      });
      deleteMockTestDraft(userId, draft.id);
      refreshDrafts();
      toast.success("Test created from draft!");
    } catch {
      toast.error("Failed to create test from draft");
    } finally {
      setConfirmingDraftId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mock Tests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {tests.length} test{tests.length !== 1 ? "s" : ""} · {drafts.length}{" "}
            draft
            {drafts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => navigate({ to: "/mock-tests/create" })}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Test
        </Button>
      </div>

      <Tabs defaultValue="tests">
        <TabsList className="mb-4">
          <TabsTrigger value="tests" data-ocid="mock_tests.tab">
            Tests ({tests.length})
          </TabsTrigger>
          <TabsTrigger value="drafts" data-ocid="mock_drafts.tab">
            Drafts ({drafts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tests">
          {tests.length === 0 ? (
            <div
              className="text-center py-16"
              data-ocid="mock_tests.empty_state"
            >
              <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No mock tests yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first mock test to practice
              </p>
              <Button
                onClick={() => navigate({ to: "/mock-tests/create" })}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Test
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test, idx) => {
                const testAttempts = getAttemptsForTest(test.id);
                const bestScore = getBestScore(test.id);
                return (
                  <Card
                    key={test.id}
                    className="hover:shadow-md transition-shadow"
                    data-ocid={`mock_tests.item.${idx + 1}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">
                            {test.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {getSubjectName(test.subjectId)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {test.questions.length} question
                              {test.questions.length !== 1 ? "s" : ""}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {testAttempts.length} attempt
                              {testAttempts.length !== 1 ? "s" : ""}
                            </span>
                            {bestScore !== null && (
                              <Badge variant="outline" className="text-xs">
                                Best: {bestScore}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {testAttempts.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate({
                                  to: "/mock-tests/$testId/report",
                                  params: { testId: test.id.toString() },
                                })
                              }
                              className="gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Report
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() =>
                              navigate({
                                to: "/mock-tests/$testId/attempt",
                                params: { testId: test.id.toString() },
                              })
                            }
                            className="gap-1"
                            data-ocid={`mock_tests.primary_button.${idx + 1}`}
                          >
                            <Play className="w-3.5 h-3.5" />
                            Attempt
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteTest(test.id)}
                            disabled={deleteMockTest.isPending}
                            data-ocid={`mock_tests.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="drafts">
          {drafts.length === 0 ? (
            <div
              className="text-center py-16"
              data-ocid="mock_drafts.empty_state"
            >
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No drafts saved</h3>
              <p className="text-muted-foreground mb-4">
                While creating a test, tap "Save as Draft" to save for later
              </p>
              <Button
                onClick={() => navigate({ to: "/mock-tests/create" })}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Test
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft, idx) => (
                <Card
                  key={draft.id}
                  className="border-dashed border-2 border-amber-300 bg-amber-50/30 hover:shadow-md transition-shadow"
                  data-ocid={`mock_drafts.item.${idx + 1}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {draft.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-xs border-amber-400 text-amber-700"
                          >
                            Draft
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {getSubjectName(draft.subjectId)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {draft.questions.length} question
                            {draft.questions.length !== 1 ? "s" : ""}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Saved{" "}
                            {new Date(draft.updatedAt).toLocaleDateString(
                              "en-IN",
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditDraft(draft)}
                          className="gap-1"
                          data-ocid={`mock_drafts.edit_button.${idx + 1}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleConfirmDraft(draft)}
                          disabled={confirmingDraftId === draft.id}
                          className="gap-1 bg-green-600 hover:bg-green-700"
                          data-ocid={`mock_drafts.confirm_button.${idx + 1}`}
                        >
                          {confirmingDraftId === draft.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDraft(draft.id)}
                          data-ocid={`mock_drafts.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Draft Dialog */}
      {editDraft && (
        <DraftEditDialog
          draft={editDraft}
          subjects={subjects}
          onClose={() => setEditDraft(null)}
          onSave={(updated) => {
            updateMockTestDraft(userId, editDraft.id, updated);
            refreshDrafts();
            setEditDraft(null);
            toast.success("Draft updated!");
          }}
        />
      )}
    </div>
  );
}

interface DraftEditDialogProps {
  draft: LocalMockTestDraft;
  subjects: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSave: (
    updated: Partial<Omit<LocalMockTestDraft, "id" | "createdAt">>,
  ) => void;
}

function DraftEditDialog({
  draft,
  subjects,
  onClose,
  onSave,
}: DraftEditDialogProps) {
  const [name, setName] = useState(draft.name);
  const [subjectId, setSubjectId] = useState(draft.subjectId.toString());
  const [questions, setQuestions] = useState<LocalMCQQuestion[]>(
    draft.questions.map((q) => ({ ...q, options: [...q.options] })),
  );

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now(),
        questionText: "",
        options: ["", "", "", ""],
        correctOption: 0,
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length === 1) {
      toast.error("At least one question required");
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQ = (
    idx: number,
    field: keyof LocalMCQQuestion,
    value: string | number,
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)),
    );
  };

  const updateOpt = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options];
        opts[optIdx] = value;
        return { ...q, options: opts };
      }),
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-ocid="mock_drafts.dialog"
      >
        <DialogHeader>
          <DialogTitle>Edit Draft</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Test Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Test name..."
              data-ocid="mock_drafts.input"
            />
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent
                className="max-h-60 overflow-y-auto"
                data-ocid="mock_drafts.select"
              >
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {questions.map((q, qIdx) => (
            <Card key={q.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Question {qIdx + 1}
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeQuestion(qIdx)}
                  data-ocid={`mock_drafts.delete_button.${qIdx + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <Input
                placeholder="Question text..."
                value={q.questionText}
                onChange={(e) => updateQ(qIdx, "questionText", e.target.value)}
                data-ocid="mock_drafts.textarea"
              />
              <RadioGroup
                value={q.correctOption.toString()}
                onValueChange={(v) =>
                  updateQ(qIdx, "correctOption", Number.parseInt(v, 10))
                }
              >
                {q.options.map((opt, optIdx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed 4-option MCQ list
                  <div key={optIdx} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={optIdx.toString()}
                      id={`edit-q${qIdx}-opt${optIdx}`}
                    />
                    <Input
                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                      value={opt}
                      onChange={(e) => updateOpt(qIdx, optIdx, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Select radio button next to correct answer
              </p>
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
        </div>
        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="mock_drafts.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSave({
                name,
                subjectId: Number.parseInt(subjectId, 10),
                questions,
              })
            }
            data-ocid="mock_drafts.save_button"
          >
            Save Draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
