import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle2,
  Circle,
  HelpCircle,
  Info,
  Layers,
  Loader2,
  MessageSquare,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import NotesSection from "../components/NotesSection";
import QuestionsSection from "../components/QuestionsSection";
import {
  useAddFlashcard,
  useDeleteFlashcard,
  useGetAllFlashcards,
  useGetChaptersForSubject,
  useGetNotesForChapter,
  useGetQuestionsForChapter,
  useGetSubjects,
  useMarkChapterCompleted,
} from "../hooks/useQueries";
import {
  getCurrentUserId,
  getSRSCards,
  saveSRSCards,
} from "../utils/localStorageService";
import type { LocalSRSCard } from "../utils/localStorageService";

export default function ChapterDetailPage() {
  const { subjectId: subjectIdStr, chapterId: chapterIdStr } = useParams({
    strict: false,
  }) as { subjectId: string; chapterId: string };
  const subjectIdNum = Number.parseInt(subjectIdStr, 10);
  const chapterIdNum = Number.parseInt(chapterIdStr, 10);
  const navigate = useNavigate();

  const { data: subjects = [] } = useGetSubjects();
  const { data: chapters = [] } = useGetChaptersForSubject(subjectIdNum);
  const { data: notes = [] } = useGetNotesForChapter(chapterIdNum);
  const { data: questions = [] } = useGetQuestionsForChapter(chapterIdNum);
  const { data: allFlashcards = [] } = useGetAllFlashcards();
  const markCompleted = useMarkChapterCompleted();
  const addFlashcard = useAddFlashcard();
  const deleteFlashcard = useDeleteFlashcard();

  const chapter = chapters.find((c) => c.id === chapterIdNum);
  const subject = subjects.find((s) => s.id === subjectIdNum);
  const flashcards = allFlashcards.filter((f) => f.chapterId === chapterIdNum);

  const [flashFront, setFlashFront] = useState("");
  const [flashBack, setFlashBack] = useState("");
  const [addingFlash, setAddingFlash] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const userId = getCurrentUserId() ?? "guest";
  const srsCards = getSRSCards(userId);
  const inSRS = srsCards.some(
    (c) => c.chapterId === chapterIdNum && c.subjectId === subjectIdNum,
  );

  const handleToggleComplete = () => {
    if (!chapter) return;
    markCompleted.mutate(
      { chapterId: chapterIdNum, completed: !chapter.completed },
      {
        onSuccess: () =>
          toast.success(
            chapter.completed ? "Marked incomplete" : "Chapter completed! 🎉",
          ),
      },
    );
  };

  const handleAddToSRS = () => {
    if (!chapter || !subject) return;
    if (inSRS) {
      toast.info("Already in Spaced Repetition");
      return;
    }
    const newCard: LocalSRSCard = {
      chapterId: chapterIdNum,
      subjectId: subjectIdNum,
      chapterName: chapter.name,
      subjectName: subject.name,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: Date.now(),
      lastReview: 0,
      addedAt: Date.now(),
    };
    saveSRSCards(userId, [...srsCards, newCard]);
    toast.success(`"${chapter.name}" added to SRS 🧠`);
  };

  const handleAddFlashcard = async () => {
    if (!flashFront.trim() || !flashBack.trim()) {
      toast.error("Both front and back are required");
      return;
    }
    setAddingFlash(true);
    try {
      await addFlashcard.mutateAsync({
        chapterId: chapterIdNum,
        subjectId: subjectIdNum,
        front: flashFront.trim(),
        back: flashBack.trim(),
      });
      setFlashFront("");
      setFlashBack("");
      toast.success("Flashcard added!");
    } catch {
      toast.error("Failed to add flashcard");
    } finally {
      setAddingFlash(false);
    }
  };

  const toggleFlip = (id: number) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!chapter) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading chapter...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() =>
            navigate({
              to: "/subjects/$subjectId",
              params: { subjectId: subjectIdStr },
            })
          }
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
          data-ocid="chapter_detail.back_button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {subject?.name ?? "Subject"}
        </button>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
              {subject?.name}
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              {chapter.name}
            </h1>
          </div>
          <Button
            variant={chapter.completed ? "secondary" : "default"}
            size="sm"
            onClick={handleToggleComplete}
            disabled={markCompleted.isPending}
            data-ocid="chapter_detail.complete_toggle"
            className="flex-shrink-0"
          >
            {chapter.completed ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Done
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 mr-1.5" /> Mark Done
              </>
            )}
          </Button>
        </div>

        {/* Stats bar */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <Badge variant="secondary" className="gap-1.5">
            <MessageSquare className="w-3 h-3" />
            {notes.length} Note{notes.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <HelpCircle className="w-3 h-3" />
            {questions.length} Question{questions.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Layers className="w-3 h-3" />
            {flashcards.length} Flashcard{flashcards.length !== 1 ? "s" : ""}
          </Badge>
          {chapter.completed && (
            <Badge className="gap-1.5 bg-green-500 text-white">
              <CheckCircle2 className="w-3 h-3" /> Completed
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notes">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="notes" data-ocid="chapter_detail.notes.tab">
            Notes
          </TabsTrigger>
          <TabsTrigger
            value="questions"
            data-ocid="chapter_detail.questions.tab"
          >
            Questions
          </TabsTrigger>
          <TabsTrigger
            value="flashcards"
            data-ocid="chapter_detail.flashcards.tab"
          >
            Flashcards
          </TabsTrigger>
          <TabsTrigger value="info" data-ocid="chapter_detail.info.tab">
            Info
          </TabsTrigger>
        </TabsList>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-4">
          <NotesSection chapterId={chapterIdNum} />
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="mt-4">
          <QuestionsSection chapterId={chapterIdNum} subjectId={subjectIdNum} />
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards" className="mt-4 space-y-4">
          {/* Add Flashcard */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Flashcard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs mb-1 block">Front (Term)</Label>
                <Input
                  value={flashFront}
                  onChange={(e) => setFlashFront(e.target.value)}
                  placeholder="Enter term or question"
                  data-ocid="chapter_detail.flashcard_front.input"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Back (Definition)</Label>
                <Textarea
                  value={flashBack}
                  onChange={(e) => setFlashBack(e.target.value)}
                  placeholder="Enter definition or answer"
                  rows={2}
                  data-ocid="chapter_detail.flashcard_back.textarea"
                />
              </div>
              <Button
                size="sm"
                onClick={handleAddFlashcard}
                disabled={addingFlash}
                data-ocid="chapter_detail.add_flashcard.button"
              >
                {addingFlash ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-1" />
                )}
                Add Flashcard
              </Button>
            </CardContent>
          </Card>

          {/* Flashcard list */}
          {flashcards.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No flashcards yet. Add one above!</p>
            </div>
          ) : (
            <div
              className="space-y-3"
              data-ocid="chapter_detail.flashcards.list"
            >
              {flashcards.map((card, idx) => (
                <div
                  key={card.id}
                  data-ocid={`chapter_detail.flashcard.item.${idx + 1}`}
                  className="relative"
                >
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => toggleFlip(card.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {!flippedCards.has(card.id) ? (
                            <>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                                Front
                              </p>
                              <p className="font-medium text-sm">
                                {card.front}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-[10px] text-primary uppercase tracking-wide mb-1">
                                Back
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {card.back}
                              </p>
                            </>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-2">
                            Tap to flip
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFlashcard.mutate(card.id, {
                              onSuccess: () =>
                                toast.success("Flashcard deleted"),
                            });
                          }}
                          className="ml-2 p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                          data-ocid={`chapter_detail.flashcard.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {chapter.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {chapter.completed ? "Completed" : "Not completed yet"}
                  </span>
                </div>
                {chapter.weightage > 0 && (
                  <Badge variant="outline">
                    {chapter.weightage}% weightage
                  </Badge>
                )}
              </div>

              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
                  Spaced Repetition
                </p>
                {inSRS ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Brain className="w-4 h-4" />
                    Enrolled in SRS — review scheduled automatically
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddToSRS}
                    data-ocid="chapter_detail.add_srs.button"
                  >
                    <Brain className="w-4 h-4 mr-1.5" />
                    Enroll in Spaced Repetition
                  </Button>
                )}
              </div>

              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
                  Study Tips
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <RotateCcw className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{" "}
                    Review notes regularly using the Notes tab
                  </li>
                  <li className="flex items-start gap-2">
                    <HelpCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{" "}
                    Add practice questions for self-testing
                  </li>
                  <li className="flex items-start gap-2">
                    <Layers className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{" "}
                    Create flashcards for key terms and definitions
                  </li>
                  <li className="flex items-start gap-2">
                    <Brain className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{" "}
                    Enroll in SRS for long-term retention
                  </li>
                  <li className="flex items-start gap-2">
                    <BookOpen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{" "}
                    Mark as complete when you feel confident
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Progress tips based on status */}
          {!chapter.completed && (
            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Chapter in Progress
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                      You have {notes.length} note
                      {notes.length !== 1 ? "s" : ""} and {questions.length}{" "}
                      question{questions.length !== 1 ? "s" : ""} saved. Keep
                      going!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
