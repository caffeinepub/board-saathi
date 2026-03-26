import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  FileText,
  FolderOpen,
  HelpCircle,
  Layers,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import NotesSection from "../components/NotesSection";
import QuestionsSection from "../components/QuestionsSection";
import {
  useAddBook,
  useAddChapter,
  useAddNote,
  useAddQuestion,
  useAssignChapterToBook,
  useDeleteBook,
  useDeleteChapter,
  useDeleteNote,
  useDeleteQuestion,
  useGetBooksForSubject,
  useGetChaptersForSubject,
  useGetNotesForSubject,
  useGetQuestionsForSubject,
  useGetSubjects,
  useMarkChapterCompleted,
} from "../hooks/useQueries";
import type { LocalBook, LocalChapter } from "../hooks/useQueries";
import {
  type LocalSRSCard,
  getCurrentUserId,
  getSRSCards,
  saveSRSCards,
} from "../utils/localStorageService";

interface ChapterCardProps {
  chapter: LocalChapter;
  subjectId: number;
  subjectName: string;
  books: LocalBook[];
  onToggleComplete: () => void;
  onDelete: () => void;
  onAssignBook?: (bookId: number | undefined) => void;
}

function ChapterCard({
  chapter,
  subjectId,
  subjectName,
  books,
  onToggleComplete,
  onDelete,
  onAssignBook,
}: ChapterCardProps) {
  const userId = getCurrentUserId() ?? "guest";
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [inSRS, setInSRS] = useState(() => {
    const cards = getSRSCards(userId);
    return cards.some(
      (c) => c.chapterId === chapter.id && c.subjectId === subjectId,
    );
  });

  const handleAddToSRS = () => {
    const cards = getSRSCards(userId);
    if (
      cards.some((c) => c.chapterId === chapter.id && c.subjectId === subjectId)
    ) {
      toast.info("Already in Spaced Repetition");
      return;
    }
    const newCard: LocalSRSCard = {
      chapterId: chapter.id,
      subjectId,
      chapterName: chapter.name,
      subjectName,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: Date.now(),
      lastReview: 0,
      addedAt: Date.now(),
    };
    saveSRSCards(userId, [...cards, newCard]);
    setInSRS(true);
    toast.success(`"${chapter.name}" added to SRS 🧠`);
  };

  return (
    <Card
      className={`transition-all ${
        chapter.completed
          ? "border-green-200 bg-green-50/30 dark:bg-green-950/20"
          : ""
      }`}
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
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/subjects/$subjectId/chapters/$chapterId",
                    params: {
                      subjectId: String(subjectId),
                      chapterId: String(chapter.id),
                    },
                  })
                }
                className={`font-medium text-sm text-left cursor-pointer hover:underline hover:text-primary transition-colors ${
                  chapter.completed ? "line-through text-muted-foreground" : ""
                }`}
                data-ocid="chapters.chapter.link"
              >
                {chapter.name}
              </button>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {chapter.weightage > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {chapter.weightage}%
                  </Badge>
                )}
                {inSRS ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                    <Brain className="w-2.5 h-2.5" />
                    In SRS
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddToSRS}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    title="Add to Spaced Repetition"
                    data-ocid="chapter.srs.button"
                  >
                    <Brain className="w-2.5 h-2.5" />
                    SRS
                  </button>
                )}
                {onAssignBook && books.length > 0 && (
                  <Select
                    value={chapter.bookId?.toString() ?? "none"}
                    onValueChange={(val) =>
                      onAssignBook(val === "none" ? undefined : Number(val))
                    }
                  >
                    <SelectTrigger className="h-6 w-24 text-[10px] border-dashed">
                      <SelectValue placeholder="Book" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Book</SelectItem>
                      {books.map((b) => (
                        <SelectItem key={b.id} value={b.id.toString()}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <button
                  type="button"
                  data-ocid="chapters.delete_button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-1 rounded text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete chapter"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
  const { data: books = [] } = useGetBooksForSubject(subjectIdNum);

  const addChapterMutation = useAddChapter();
  const markCompletedMutation = useMarkChapterCompleted();
  const deleteChapterMutation = useDeleteChapter();
  const addBookMutation = useAddBook();
  const deleteBookMutation = useDeleteBook();
  const assignChapterMutation = useAssignChapterToBook();

  const [addOpen, setAddOpen] = useState(false);
  const [chapterName, setChapterName] = useState("");
  const [weightage, setWeightage] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string>("none");
  const [deleteChapterId, setDeleteChapterId] = useState<number | null>(null);

  const [addBookOpen, setAddBookOpen] = useState(false);
  const [newBookName, setNewBookName] = useState("");
  const [deleteBookId, setDeleteBookId] = useState<number | null>(null);

  const [viewMode, setViewMode] = useState<"all" | "books">("all");

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
        bookId: selectedBookId !== "none" ? Number(selectedBookId) : undefined,
      });
      toast.success("Chapter added!");
      setChapterName("");
      setWeightage("");
      setSelectedBookId("none");
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

  const handleDeleteChapter = async () => {
    if (deleteChapterId === null) return;
    try {
      await deleteChapterMutation.mutateAsync(deleteChapterId);
      toast.success("Chapter deleted");
    } catch {
      toast.error("Failed to delete chapter");
    } finally {
      setDeleteChapterId(null);
    }
  };

  const handleAddBook = async () => {
    if (!newBookName.trim()) {
      toast.error("Please enter a book name");
      return;
    }
    try {
      await addBookMutation.mutateAsync({
        subjectId: subjectIdNum,
        name: newBookName.trim(),
      });
      toast.success(`Book "${newBookName.trim()}" added!`);
      setNewBookName("");
      setAddBookOpen(false);
    } catch {
      toast.error("Failed to add book");
    }
  };

  const handleDeleteBook = async () => {
    if (deleteBookId === null) return;
    try {
      await deleteBookMutation.mutateAsync({
        bookId: deleteBookId,
        subjectId: subjectIdNum,
      });
      toast.success("Book deleted (chapters moved to uncategorized)");
    } catch {
      toast.error("Failed to delete book");
    } finally {
      setDeleteBookId(null);
    }
  };

  const handleAssignBook = async (
    chapterId: number,
    bookId: number | undefined,
  ) => {
    try {
      await assignChapterMutation.mutateAsync({
        chapterId,
        bookId,
        subjectId: subjectIdNum,
      });
      toast.success(
        bookId
          ? `Chapter moved to ${books.find((b) => b.id === bookId)?.name}`
          : "Chapter removed from book",
      );
    } catch {
      toast.error("Failed to assign chapter");
    }
  };

  const deleteChapterName =
    chapters.find((c) => c.id === deleteChapterId)?.name ?? "";
  const deleteBookName = books.find((b) => b.id === deleteBookId)?.name ?? "";
  const completedCount = chapters.filter((c) => c.completed).length;

  const addNoteMutation = useAddNote();
  const deleteNoteMutation = useDeleteNote();
  const addQuestionMutation = useAddQuestion();
  const deleteQuestionMutation = useDeleteQuestion();
  const { data: subjectNotes = [] } = useGetNotesForSubject(
    subjectIdNum,
    chapters,
  );
  const { data: subjectQuestions = [] } =
    useGetQuestionsForSubject(subjectIdNum);

  const [noteChapterId, setNoteChapterId] = useState<string>("");
  const [noteText, setNoteText] = useState("");
  const [questionChapterId, setQuestionChapterId] = useState<string>("");
  const [questionText, setQuestionText] = useState("");

  const uncategorizedChapters = chapters.filter((c) => !c.bookId);

  const handleAddSubjectNote = async () => {
    if (!noteChapterId) {
      toast.error("Select a chapter");
      return;
    }
    if (!noteText.trim()) {
      toast.error("Enter note text");
      return;
    }
    try {
      await addNoteMutation.mutateAsync({
        chapterId: Number.parseInt(noteChapterId, 10),
        content: noteText.trim(),
      });
      setNoteText("");
      toast.success("Note added!");
    } catch {
      toast.error("Failed to add note");
    }
  };

  const handleAddSubjectQuestion = async () => {
    if (!questionChapterId) {
      toast.error("Select a chapter");
      return;
    }
    if (!questionText.trim()) {
      toast.error("Enter question text");
      return;
    }
    try {
      await addQuestionMutation.mutateAsync({
        chapterId: Number.parseInt(questionChapterId, 10),
        subjectId: subjectIdNum,
        questionText: questionText.trim(),
        answer: "",
      });
      setQuestionText("");
      toast.success("Question added!");
    } catch {
      toast.error("Failed to add question");
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
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddBookOpen(true)}
            className="gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            Add Book
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Chapter
          </Button>
        </div>
      </div>

      <Tabs defaultValue="chapters" className="mt-2">
        <TabsList className="mb-4">
          <TabsTrigger value="chapters" data-ocid="subject.chapters.tab">
            Chapters
          </TabsTrigger>
          <TabsTrigger value="notes" data-ocid="subject.notes.tab">
            <MessageSquare className="w-3.5 h-3.5 mr-1" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="questions" data-ocid="subject.questions.tab">
            <HelpCircle className="w-3.5 h-3.5 mr-1" />
            Questions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chapters">
          {/* View toggle */}
          {books.length > 0 && (
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setViewMode("all")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                All Chapters
              </button>
              <button
                type="button"
                onClick={() => setViewMode("books")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "books"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                By Books
              </button>
            </div>
          )}

          {chapters.length === 0 ? (
            <div className="text-center py-16" data-ocid="chapters.empty_state">
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
          ) : viewMode === "all" ? (
            <div className="space-y-3">
              {chapters.map((chapter) => (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  subjectId={subjectIdNum}
                  subjectName={subject?.name ?? "Unknown Subject"}
                  books={books}
                  onToggleComplete={() =>
                    handleToggleComplete(chapter.id, chapter.completed)
                  }
                  onDelete={() => setDeleteChapterId(chapter.id)}
                  onAssignBook={(bookId) =>
                    handleAssignBook(chapter.id, bookId)
                  }
                />
              ))}
            </div>
          ) : (
            // Books view
            <div className="space-y-6">
              {books.map((book) => {
                const bookChapters = chapters.filter(
                  (c) => c.bookId === book.id,
                );
                const bookCompleted = bookChapters.filter(
                  (c) => c.completed,
                ).length;
                return (
                  <Card key={book.id} className="border-2 border-primary/20">
                    <CardHeader className="pb-3 pt-4 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-primary" />
                          <CardTitle className="text-base">
                            {book.name}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {bookCompleted}/{bookChapters.length}
                          </Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeleteBookId(book.id)}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete book"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      {bookChapters.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">
                          No chapters in this book yet. Add a chapter and assign
                          it to this book.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {bookChapters.map((chapter) => (
                            <ChapterCard
                              key={chapter.id}
                              chapter={chapter}
                              subjectId={subjectIdNum}
                              subjectName={subject?.name ?? "Unknown Subject"}
                              books={books}
                              onToggleComplete={() =>
                                handleToggleComplete(
                                  chapter.id,
                                  chapter.completed,
                                )
                              }
                              onDelete={() => setDeleteChapterId(chapter.id)}
                              onAssignBook={(bookId) =>
                                handleAssignBook(chapter.id, bookId)
                              }
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Uncategorized */}
              {uncategorizedChapters.length > 0 && (
                <Card className="border-dashed">
                  <CardHeader className="pb-3 pt-4 px-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <CardTitle className="text-base text-muted-foreground">
                        Uncategorized
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {uncategorizedChapters.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {uncategorizedChapters.map((chapter) => (
                        <ChapterCard
                          key={chapter.id}
                          chapter={chapter}
                          subjectId={subjectIdNum}
                          subjectName={subject?.name ?? "Unknown Subject"}
                          books={books}
                          onToggleComplete={() =>
                            handleToggleComplete(chapter.id, chapter.completed)
                          }
                          onDelete={() => setDeleteChapterId(chapter.id)}
                          onAssignBook={(bookId) =>
                            handleAssignBook(chapter.id, bookId)
                          }
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Add Note
                </h3>
                <Select value={noteChapterId} onValueChange={setNoteChapterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select chapter..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {chapters.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Write your note here..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  data-ocid="subject_notes.textarea"
                />
                <Button
                  onClick={handleAddSubjectNote}
                  disabled={addNoteMutation.isPending}
                  className="w-full gap-2"
                  data-ocid="subject_notes.submit_button"
                >
                  {addNoteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Note
                </Button>
              </CardContent>
            </Card>
            {subjectNotes.length === 0 ? (
              <div
                className="text-center py-10 text-muted-foreground"
                data-ocid="subject_notes.empty_state"
              >
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notes yet for this subject</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subjectNotes.map((note, idx) => {
                  const chapterName =
                    chapters.find((c) => c.id === note.chapterId)?.name ??
                    "Unknown";
                  return (
                    <Card
                      key={note.id}
                      data-ocid={`subject_notes.item.${idx + 1}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">
                              {chapterName}
                            </p>
                            <p className="text-sm whitespace-pre-wrap">
                              {note.content}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            disabled={deleteNoteMutation.isPending}
                            data-ocid={`subject_notes.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  Add Question
                </h3>
                <Select
                  value={questionChapterId}
                  onValueChange={setQuestionChapterId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select chapter..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {chapters.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Enter your question here..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  rows={2}
                  data-ocid="subject_questions.textarea"
                />
                <Button
                  onClick={handleAddSubjectQuestion}
                  disabled={addQuestionMutation.isPending}
                  className="w-full gap-2"
                  data-ocid="subject_questions.submit_button"
                >
                  {addQuestionMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Question
                </Button>
              </CardContent>
            </Card>
            {subjectQuestions.length === 0 ? (
              <div
                className="text-center py-10 text-muted-foreground"
                data-ocid="subject_questions.empty_state"
              >
                <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No questions yet for this subject</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subjectQuestions.map((q, idx) => {
                  const chapterName =
                    chapters.find((c) => c.id === q.chapterId)?.name ??
                    "Unknown";
                  return (
                    <Card
                      key={q.id}
                      data-ocid={`subject_questions.item.${idx + 1}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">
                              {chapterName}
                            </p>
                            <p className="text-sm">{q.questionText}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                            onClick={() => deleteQuestionMutation.mutate(q.id)}
                            disabled={deleteQuestionMutation.isPending}
                            data-ocid={`subject_questions.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Chapter Dialog */}
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
            {books.length > 0 && (
              <div className="space-y-2">
                <Label>Assign to Book (optional)</Label>
                <Select
                  value={selectedBookId}
                  onValueChange={setSelectedBookId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No book" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Book</SelectItem>
                    {books.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                setChapterName("");
                setWeightage("");
                setSelectedBookId("none");
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

      {/* Add Book Dialog */}
      <Dialog open={addBookOpen} onOpenChange={setAddBookOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Book</DialogTitle>
            <DialogDescription>
              Add a book/section to group chapters in {subject?.name}. Example:
              History, Civics, Geography...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="book-name">Book Name</Label>
              <Input
                id="book-name"
                placeholder="e.g., History, Civics..."
                value={newBookName}
                onChange={(e) => setNewBookName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddBook()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddBookOpen(false);
                setNewBookName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddBook}
              disabled={addBookMutation.isPending}
            >
              {addBookMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Add Book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Chapter Confirmation */}
      <AlertDialog
        open={deleteChapterId !== null}
        onOpenChange={(open) => !open && setDeleteChapterId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>&ldquo;{deleteChapterName}&rdquo;</strong>? This will also
              delete all its notes and questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="chapters.delete.cancel_button"
              onClick={() => setDeleteChapterId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="chapters.delete.confirm_button"
              onClick={handleDeleteChapter}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteChapterMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete Chapter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Book Confirmation */}
      <AlertDialog
        open={deleteBookId !== null}
        onOpenChange={(open) => !open && setDeleteBookId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the book{" "}
              <strong>&ldquo;{deleteBookName}&rdquo;</strong>? All chapters in
              this book will be moved to Uncategorized. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteBookId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBookMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete Book
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
