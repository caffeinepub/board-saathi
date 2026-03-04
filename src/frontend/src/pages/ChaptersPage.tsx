import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  FileText,
  HelpCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import NotesSection from "../components/NotesSection";
import QuestionsSection from "../components/QuestionsSection";
import {
  useAddChapter,
  useGetChaptersForSubject,
  useGetSubjects,
  useMarkChapterCompleted,
} from "../hooks/useQueries";

interface ChapterCardProps {
  chapter: {
    id: number;
    subjectId: number;
    name: string;
    weightage: number;
    completed: boolean;
  };
  subjectId: number;
  onToggleComplete: () => void;
}

function ChapterCard({
  chapter,
  subjectId,
  onToggleComplete,
}: ChapterCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className={`transition-all ${chapter.completed ? "border-green-200 bg-green-50/30 dark:bg-green-950/20" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onToggleComplete}
            className="mt-0.5 flex-shrink-0"
          >
            {chapter.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                className={`font-medium text-sm ${chapter.completed ? "line-through text-muted-foreground" : ""}`}
              >
                {chapter.name}
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                {chapter.weightage > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {chapter.weightage}%
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {expanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 ml-8">
            <Tabs defaultValue="notes">
              <TabsList className="h-8">
                <TabsTrigger value="notes" className="text-xs gap-1 h-7">
                  <FileText className="w-3 h-3" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="questions" className="text-xs gap-1 h-7">
                  <HelpCircle className="w-3 h-3" />
                  Questions
                </TabsTrigger>
              </TabsList>
              <TabsContent value="notes" className="mt-3">
                <NotesSection chapterId={chapter.id} />
              </TabsContent>
              <TabsContent value="questions" className="mt-3">
                <QuestionsSection
                  chapterId={chapter.id}
                  subjectId={subjectId}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ChaptersPage() {
  const { subjectId: subjectIdStr } = useParams({
    from: "/layout/subjects/$subjectId",
  });
  const navigate = useNavigate();
  const subjectIdNum = Number.parseInt(subjectIdStr, 10);

  const { data: subjects = [] } = useGetSubjects();
  const { data: chapters = [], isLoading } =
    useGetChaptersForSubject(subjectIdNum);
  const addChapterMutation = useAddChapter();
  const markCompletedMutation = useMarkChapterCompleted();

  const [addOpen, setAddOpen] = useState(false);
  const [chapterName, setChapterName] = useState("");
  const [weightage, setWeightage] = useState("");

  const subject = subjects.find((s) => s.id === subjectIdNum);

  const handleAddChapter = async () => {
    if (!chapterName.trim()) {
      toast.error("Please enter a chapter name");
      return;
    }
    try {
      await addChapterMutation.mutateAsync({
        subjectId: subjectIdNum,
        name: chapterName.trim(),
        weightage: Number.parseInt(weightage, 10) || 0,
      });
      toast.success("Chapter added!");
      setChapterName("");
      setWeightage("");
      setAddOpen(false);
    } catch {
      toast.error("Failed to add chapter");
    }
  };

  const handleToggleComplete = async (
    chapterId: number,
    completed: boolean,
  ) => {
    try {
      await markCompletedMutation.mutateAsync({
        chapterId,
        completed: !completed,
      });
      if (!completed) {
        toast.success("Chapter marked complete! Revision tasks scheduled. 🎉");
      }
    } catch {
      toast.error("Failed to update chapter");
    }
  };

  const completedCount = chapters.filter((c) => c.completed).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/subjects" })}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">
            {subject?.name ?? "Subject"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {completedCount}/{chapters.length} chapters completed
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="gap-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Chapter
        </Button>
      </div>

      {chapters.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No chapters yet</h3>
          <p className="text-muted-foreground mb-4">
            Add chapters to start tracking your progress
          </p>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Chapter
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              subjectId={subjectIdNum}
              onToggleComplete={() =>
                handleToggleComplete(chapter.id, chapter.completed)
              }
            />
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Chapter</DialogTitle>
            <DialogDescription>
              Add a new chapter to {subject?.name ?? "this subject"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="chapter-name">Chapter Name *</Label>
              <Input
                id="chapter-name"
                placeholder="e.g., Real Numbers"
                value={chapterName}
                onChange={(e) => setChapterName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chapter-weightage">Weightage % (optional)</Label>
              <Input
                id="chapter-weightage"
                type="number"
                placeholder="e.g., 10"
                value={weightage}
                onChange={(e) => setWeightage(e.target.value)}
                min="0"
                max="100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                setChapterName("");
                setWeightage("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddChapter}
              disabled={addChapterMutation.isPending}
            >
              {addChapterMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Add Chapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
