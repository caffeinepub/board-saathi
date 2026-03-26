import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type LocalAchievement,
  type LocalBook,
  type LocalChapter,
  type LocalFlashcard,
  type LocalMCQQuestion,
  type LocalMockTest,
  type LocalNote,
  type LocalPlannerTask,
  type LocalQuestion,
  type LocalReminder,
  type LocalRevisionTask,
  type LocalStudyStreak,
  type LocalSubject,
  type LocalTarget,
  type LocalTestAttempt,
  type LocalTestReport,
  type ParentMessage,
  type ParentReply,
  deleteRevisionTask,
  getAchievements,
  getBooks,
  getChapters,
  getChildMessages,
  getCurrentUserId,
  getFlashcards,
  getMockTests,
  getNextId,
  getNotes,
  getParentReplies,
  getPlannerTasks,
  getQuestions,
  getReminders,
  getRevisionTasks,
  getStudyStreak,
  getSubjects,
  getTargets,
  getTestAttempts,
  markMessageAsRead as markMessageAsReadLS,
  markParentReplyAsSeen as markParentReplyAsSeenLS,
  saveBooks,
  saveChapters,
  saveFlashcards,
  saveMockTests,
  saveNotes,
  savePlannerTasks,
  saveQuestions,
  saveReminders,
  saveRevisionTasks,
  saveSubjects,
  saveTargets,
  saveTestAttempts,
  scheduleRevisionTasks,
  updateStreak,
} from "../utils/localStorageService";

// Re-export local types so pages can import them from useQueries
export type {
  LocalSubject,
  LocalChapter,
  LocalNote,
  LocalQuestion,
  LocalFlashcard,
  LocalMockTest,
  LocalMCQQuestion,
  LocalTestAttempt,
  LocalTestReport,
  LocalPlannerTask,
  LocalReminder,
  LocalTarget,
  LocalRevisionTask,
  LocalStudyStreak,
  LocalAchievement,
  ParentMessage,
  ParentReply,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  const id = getCurrentUserId();
  return id ?? "guest";
}

// ─── Subjects ─────────────────────────────────────────────────────────────────

export function useGetSubjects() {
  return useQuery<LocalSubject[]>({
    queryKey: ["subjects"],
    queryFn: () => getSubjects(uid()),
  });
}

export function useAddSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const userId = uid();
      const subjects = getSubjects(userId);
      const id = getNextId(userId, "subject");
      subjects.push({ id, name });
      saveSubjects(userId, subjects);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subjectId: number) => {
      const userId = uid();
      // Get chapters belonging to this subject
      const allChapters = getChapters(userId);
      const subjectChapterIds = allChapters
        .filter((c) => c.subjectId === subjectId)
        .map((c) => c.id);

      // Remove notes for those chapters
      const allNotes = getNotes(userId);
      saveNotes(
        userId,
        allNotes.filter((n) => !subjectChapterIds.includes(n.chapterId)),
      );

      // Remove questions for those chapters
      const allQuestions = getQuestions(userId);
      saveQuestions(
        userId,
        allQuestions.filter((q) => !subjectChapterIds.includes(q.chapterId)),
      );

      // Remove flashcards for this subject
      const allFlashcards = getFlashcards(userId);
      saveFlashcards(
        userId,
        allFlashcards.filter((f) => f.subjectId !== subjectId),
      );

      // Remove chapters for this subject
      saveChapters(
        userId,
        allChapters.filter((c) => c.subjectId !== subjectId),
      );

      // Remove the subject itself
      const allSubjects = getSubjects(userId);
      saveSubjects(
        userId,
        allSubjects.filter((s) => s.id !== subjectId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["allChapters"] });
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      queryClient.invalidateQueries({ queryKey: ["allFlashcards"] });
      queryClient.invalidateQueries({ queryKey: ["questionBank"] });
    },
  });
}

// ─── Chapters ─────────────────────────────────────────────────────────────────

export function useGetChaptersForSubject(subjectId: number) {
  return useQuery<LocalChapter[]>({
    queryKey: ["chapters", subjectId],
    queryFn: () => getChapters(uid()).filter((c) => c.subjectId === subjectId),
  });
}

export function useGetAllChapters() {
  return useQuery<LocalChapter[]>({
    queryKey: ["allChapters"],
    queryFn: () => getChapters(uid()),
  });
}

export function useAddChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subjectId,
      name,
      weightage,
      bookId,
    }: {
      subjectId: number;
      name: string;
      weightage: number;
      bookId?: number;
    }) => {
      const userId = uid();
      const chapters = getChapters(userId);
      const id = getNextId(userId, "chapter");
      chapters.push({
        id,
        subjectId,
        name,
        weightage,
        completed: false,
        bookId,
      });
      saveChapters(userId, chapters);
      return id;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chapters", variables.subjectId],
      });
      queryClient.invalidateQueries({ queryKey: ["allChapters"] });
    },
  });
}

export function useDeleteChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chapterId: number) => {
      const userId = uid();

      // Remove notes for this chapter
      const allNotes = getNotes(userId);
      saveNotes(
        userId,
        allNotes.filter((n) => n.chapterId !== chapterId),
      );

      // Remove questions for this chapter
      const allQuestions = getQuestions(userId);
      saveQuestions(
        userId,
        allQuestions.filter((q) => q.chapterId !== chapterId),
      );

      // Remove the chapter itself
      const allChapters = getChapters(userId);
      saveChapters(
        userId,
        allChapters.filter((c) => c.id !== chapterId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      queryClient.invalidateQueries({ queryKey: ["allChapters"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["questionBank"] });
    },
  });
}

export function useMarkChapterCompleted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      chapterId,
      completed,
    }: { chapterId: number; completed: boolean }) => {
      const userId = uid();
      const chapters = getChapters(userId);
      const chapter = chapters.find((c) => c.id === chapterId);
      const updated = chapters.map((c) =>
        c.id === chapterId ? { ...c, completed } : c,
      );
      saveChapters(userId, updated);
      if (completed && chapter && !chapter.completed) {
        scheduleRevisionTasks(userId, chapterId, chapter.subjectId);
        updateStreak(userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allChapters"] });
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      queryClient.invalidateQueries({ queryKey: ["revisionTasks"] });
      queryClient.invalidateQueries({ queryKey: ["studyStreak"] });
      queryClient.invalidateQueries({ queryKey: ["plannerTasks"] });
    },
  });
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export function useGetNotesForChapter(chapterId: number) {
  return useQuery<LocalNote[]>({
    queryKey: ["notes", chapterId],
    queryFn: () => getNotes(uid()).filter((n) => n.chapterId === chapterId),
  });
}

export function useGetNotesForSubject(
  subjectId: number,
  chapters: LocalChapter[],
) {
  const chapterIds = new Set(
    chapters.filter((c) => c.subjectId === subjectId).map((c) => c.id),
  );
  return useQuery<LocalNote[]>({
    queryKey: ["notes", "subject", subjectId],
    queryFn: () => getNotes(uid()).filter((n) => chapterIds.has(n.chapterId)),
  });
}

export function useGetQuestionsForSubject(subjectId: number) {
  return useQuery<LocalQuestion[]>({
    queryKey: ["questions", "subject", subjectId],
    queryFn: () => getQuestions(uid()).filter((q) => q.subjectId === subjectId),
  });
}

export function useAddNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      chapterId,
      content,
      imageData,
    }: { chapterId: number; content: string; imageData?: string }) => {
      const userId = uid();
      const notes = getNotes(userId);
      const id = getNextId(userId, "note");
      notes.push({ id, chapterId, content, imageData, createdAt: Date.now() });
      saveNotes(userId, notes);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (noteId: number) => {
      const userId = uid();
      const notes = getNotes(userId);
      const note = notes.find((n) => n.id === noteId);
      saveNotes(
        userId,
        notes.filter((n) => n.id !== noteId),
      );
      return note?.chapterId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

// ─── Questions ────────────────────────────────────────────────────────────────

export function useGetQuestionsForChapter(chapterId: number) {
  return useQuery<LocalQuestion[]>({
    queryKey: ["questions", chapterId],
    queryFn: () => getQuestions(uid()).filter((q) => q.chapterId === chapterId),
  });
}

export function useAddQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      chapterId,
      subjectId,
      questionText,
      answer,
    }: {
      chapterId: number;
      subjectId: number;
      questionText: string;
      answer: string;
    }) => {
      const userId = uid();
      const questions = getQuestions(userId);
      const id = getNextId(userId, "question");
      questions.push({ id, chapterId, subjectId, questionText, answer });
      saveQuestions(userId, questions);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["questionBank"] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questionId: number) => {
      const userId = uid();
      const questions = getQuestions(userId);
      saveQuestions(
        userId,
        questions.filter((q) => q.id !== questionId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["questionBank"] });
    },
  });
}

// ─── Question Bank ────────────────────────────────────────────────────────────

export function useGetQuestionBank(subjectId?: number, chapterId?: number) {
  return useQuery<LocalQuestion[]>({
    queryKey: ["questionBank", subjectId, chapterId],
    queryFn: () => {
      let questions = getQuestions(uid());
      if (subjectId !== undefined)
        questions = questions.filter((q) => q.subjectId === subjectId);
      if (chapterId !== undefined)
        questions = questions.filter((q) => q.chapterId === chapterId);
      return questions;
    },
  });
}

// ─── Flashcards ───────────────────────────────────────────────────────────────

export function useGetAllFlashcards() {
  return useQuery<LocalFlashcard[]>({
    queryKey: ["allFlashcards"],
    queryFn: () => getFlashcards(uid()),
  });
}

export function useAddFlashcard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      chapterId,
      subjectId,
      front,
      back,
    }: {
      chapterId: number;
      subjectId: number;
      front: string;
      back: string;
    }) => {
      const userId = uid();
      const flashcards = getFlashcards(userId);
      const id = getNextId(userId, "flashcard");
      flashcards.push({
        id,
        chapterId,
        subjectId,
        front,
        back,
        learned: false,
      });
      saveFlashcards(userId, flashcards);
      return id;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["allFlashcards"] }),
  });
}

export function useMarkFlashcardLearned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cardId,
      learned,
    }: { cardId: number; learned: boolean }) => {
      const userId = uid();
      const flashcards = getFlashcards(userId);
      saveFlashcards(
        userId,
        flashcards.map((f) => (f.id === cardId ? { ...f, learned } : f)),
      );
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["allFlashcards"] }),
  });
}

export function useDeleteFlashcard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: number) => {
      const userId = uid();
      const flashcards = getFlashcards(userId);
      saveFlashcards(
        userId,
        flashcards.filter((f) => f.id !== cardId),
      );
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["allFlashcards"] }),
  });
}

// ─── Mock Tests ───────────────────────────────────────────────────────────────

export function useGetMockTests() {
  return useQuery<LocalMockTest[]>({
    queryKey: ["mockTests"],
    queryFn: () => getMockTests(uid()),
  });
}

export function useGetMockTest(testId: number) {
  return useQuery<LocalMockTest | null>({
    queryKey: ["mockTest", testId],
    queryFn: () => getMockTests(uid()).find((t) => t.id === testId) ?? null,
  });
}

export function useCreateMockTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      subjectId,
      questions,
    }: { name: string; subjectId: number; questions: LocalMCQQuestion[] }) => {
      const userId = uid();
      const tests = getMockTests(userId);
      const id = getNextId(userId, "mockTest");
      tests.push({ id, name, subjectId, questions });
      saveMockTests(userId, tests);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mockTests"] }),
  });
}

export function useDeleteMockTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (testId: number) => {
      const userId = uid();
      saveMockTests(
        userId,
        getMockTests(userId).filter((t) => t.id !== testId),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mockTests"] }),
  });
}

export function useSubmitMockTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      testId,
      answers,
      timeTaken,
    }: {
      testId: number;
      answers: Record<number, number>;
      timeTaken: number;
    }) => {
      const userId = uid();
      const test = getMockTests(userId).find((t) => t.id === testId);
      if (!test) throw new Error("Test not found");

      let score = 0;
      const results = test.questions.map((q) => {
        const selected = answers[q.id] ?? 999;
        const isCorrect = selected === q.correctOption;
        if (isCorrect) score++;
        return {
          questionId: q.id,
          questionText: q.questionText,
          selectedOption: selected,
          correctOption: q.correctOption,
          isCorrect,
        };
      });

      const total = test.questions.length;
      const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
      const report: LocalTestReport = {
        testId,
        testName: test.name,
        score,
        total,
        percentage,
        timeTaken,
        results,
      };

      const attempts = getTestAttempts(userId);
      const id = getNextId(userId, "testAttempt");
      attempts.push({ id, testId, report, attemptedAt: Date.now() });
      saveTestAttempts(userId, attempts);
      updateStreak(userId);
      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testAttempts"] });
      queryClient.invalidateQueries({ queryKey: ["studyStreak"] });
    },
  });
}

export function useGetTestAttempts() {
  return useQuery<LocalTestAttempt[]>({
    queryKey: ["testAttempts"],
    queryFn: () => getTestAttempts(uid()),
  });
}

export function useGetTestAttemptsForTest(testId: number) {
  return useQuery<LocalTestAttempt[]>({
    queryKey: ["testAttempts", testId],
    queryFn: () => getTestAttempts(uid()).filter((a) => a.testId === testId),
  });
}

// ─── Planner ──────────────────────────────────────────────────────────────────

export function useGetPlannerTasksForMonth(year: number, month: number) {
  return useQuery<LocalPlannerTask[]>({
    queryKey: ["plannerTasks", year, month],
    queryFn: () => {
      const tasks = getPlannerTasks(uid());
      return tasks.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
    },
  });
}

export function useGetPlannerTasksForDate(
  year: number,
  month: number,
  date: number,
) {
  return useQuery<LocalPlannerTask[]>({
    queryKey: ["plannerTasksForDate", year, month, date],
    queryFn: () => {
      const tasks = getPlannerTasks(uid());
      return tasks.filter((t) => {
        const d = new Date(t.date);
        return (
          d.getFullYear() === year &&
          d.getMonth() + 1 === month &&
          d.getDate() === date
        );
      });
    },
  });
}

export function useAddPlannerTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
      year,
      month,
      date,
      startTime,
    }: {
      title: string;
      description: string;
      year: number;
      month: number;
      date: number;
      startTime: string;
    }) => {
      const userId = uid();
      const tasks = getPlannerTasks(userId);
      const id = getNextId(userId, "plannerTask");
      const dateObj = new Date(year, month - 1, date, 9, 0, 0);
      tasks.push({
        id,
        title,
        description,
        date: dateObj.getTime(),
        startTime,
        completed: false,
      });
      savePlannerTasks(userId, tasks);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plannerTasks"] });
      queryClient.invalidateQueries({ queryKey: ["plannerTasksForDate"] });
    },
  });
}

export function useCompletePlannerTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      completed,
    }: { taskId: number; completed: boolean }) => {
      const userId = uid();
      const tasks = getPlannerTasks(userId);
      savePlannerTasks(
        userId,
        tasks.map((t) => (t.id === taskId ? { ...t, completed } : t)),
      );
      if (completed) updateStreak(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plannerTasks"] });
      queryClient.invalidateQueries({ queryKey: ["plannerTasksForDate"] });
      queryClient.invalidateQueries({ queryKey: ["studyStreak"] });
    },
  });
}

export function useDeletePlannerTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: number) => {
      const userId = uid();
      savePlannerTasks(
        userId,
        getPlannerTasks(userId).filter((t) => t.id !== taskId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plannerTasks"] });
      queryClient.invalidateQueries({ queryKey: ["plannerTasksForDate"] });
    },
  });
}

// ─── Reminders ────────────────────────────────────────────────────────────────

export function useGetReminders() {
  return useQuery<LocalReminder[]>({
    queryKey: ["reminders"],
    queryFn: () =>
      [...getReminders(uid())].sort((a, b) => a.dateTime - b.dateTime),
  });
}

export function useAddReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      text,
      dateTime,
      alarmSound,
    }: { text: string; dateTime: number; alarmSound?: string }) => {
      const userId = uid();
      const reminders = getReminders(userId);
      const id = getNextId(userId, "reminder");
      reminders.push({ id, text, dateTime, alarmSound });
      saveReminders(userId, reminders);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reminderId: number) => {
      const userId = uid();
      saveReminders(
        userId,
        getReminders(userId).filter((r) => r.id !== reminderId),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

// ─── Targets ──────────────────────────────────────────────────────────────────

export function useGetTargets() {
  return useQuery<LocalTarget[]>({
    queryKey: ["targets"],
    queryFn: () => getTargets(uid()),
  });
}

export function useAddTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
      deadline,
    }: { title: string; description: string; deadline: number }) => {
      const userId = uid();
      const targets = getTargets(userId);
      const id = getNextId(userId, "target");
      targets.push({ id, title, description, deadline, completed: false });
      saveTargets(userId, targets);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["targets"] }),
  });
}

export function useCompleteTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      targetId,
      completed,
    }: { targetId: number; completed: boolean }) => {
      const userId = uid();
      const targets = getTargets(userId);
      saveTargets(
        userId,
        targets.map((t) => (t.id === targetId ? { ...t, completed } : t)),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["targets"] }),
  });
}

export function useDeleteTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetId: number) => {
      const userId = uid();
      saveTargets(
        userId,
        getTargets(userId).filter((t) => t.id !== targetId),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["targets"] }),
  });
}

// ─── Revision Tasks ───────────────────────────────────────────────────────────

export function useGetRevisionTasks() {
  return useQuery<LocalRevisionTask[]>({
    queryKey: ["revisionTasks"],
    queryFn: () => getRevisionTasks(uid()),
  });
}

export function useGetPendingRevisionTasks() {
  return useQuery<LocalRevisionTask[]>({
    queryKey: ["pendingRevisionTasks"],
    queryFn: () => getRevisionTasks(uid()).filter((r) => !r.completed),
  });
}

export function useMarkRevisionTaskCompleted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      revisionId,
      completed,
    }: { revisionId: number; completed: boolean }) => {
      const userId = uid();
      const tasks = getRevisionTasks(userId);
      saveRevisionTasks(
        userId,
        tasks.map((r) => (r.id === revisionId ? { ...r, completed } : r)),
      );
      if (completed) updateStreak(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revisionTasks"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRevisionTasks"] });
      queryClient.invalidateQueries({ queryKey: ["studyStreak"] });
    },
  });
}

export function useDeleteRevisionTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: number) => {
      deleteRevisionTask(uid(), taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revisionTasks"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRevisionTasks"] });
    },
  });
}

// ─── Study Streak ─────────────────────────────────────────────────────────────

export function useGetStudyStreak() {
  return useQuery<LocalStudyStreak>({
    queryKey: ["studyStreak"],
    queryFn: () => getStudyStreak(uid()),
  });
}

export function useRecordDailyLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const userId = uid();
      return updateStreak(userId);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["studyStreak"] }),
  });
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export function useGetAchievements() {
  return useQuery<LocalAchievement[]>({
    queryKey: ["achievements"],
    queryFn: () => getAchievements(uid()),
  });
}

// ─── Progress Summary ─────────────────────────────────────────────────────────

export function useGetProgressSummary() {
  return useQuery({
    queryKey: ["progressSummary"],
    queryFn: () => {
      const userId = uid();
      const subjects = getSubjects(userId);
      const chapters = getChapters(userId);
      const tasks = getPlannerTasks(userId);
      const targets = getTargets(userId);
      const attempts = getTestAttempts(userId);

      const subjectProgress = subjects.map((s) => {
        const subChapters = chapters.filter((c) => c.subjectId === s.id);
        const completedCount = subChapters.filter((c) => c.completed).length;
        return {
          subjectId: s.id,
          subjectName: s.name,
          totalChapters: subChapters.length,
          completedChapters: completedCount,
        };
      });

      const completedTasks = tasks.filter((t) => t.completed).length;
      const achievedTargets = targets.filter((t) => t.completed).length;
      const totalScore = attempts.reduce(
        (acc, a) => acc + a.report.percentage,
        0,
      );
      const avgScore =
        attempts.length === 0 ? 0 : Math.round(totalScore / attempts.length);

      return {
        subjectProgress,
        totalTasksCompleted: completedTasks,
        totalTasks: tasks.length,
        totalTargetsAchieved: achievedTargets,
        totalTargets: targets.length,
        mockTestAverageScore: avgScore,
        totalMockTestsAttempted: attempts.length,
      };
    },
  });
}

// ─── Personal Best ────────────────────────────────────────────────────────────

export function useGetPersonalBest() {
  return useQuery({
    queryKey: ["personalBest"],
    queryFn: () => {
      const userId = uid();
      const attempts = getTestAttempts(userId);
      const chapters = getChapters(userId);
      const questions = getQuestions(userId);
      const streak = getStudyStreak(userId);
      const subjects = getSubjects(userId);

      const highestScorePerSubject = subjects.map((s) => {
        const subjectAttempts = attempts;
        const maxScore = subjectAttempts.reduce(
          (acc, a) => Math.max(acc, a.report.percentage),
          0,
        );
        return [s.id, maxScore] as [number, number];
      });

      const fastestTime = attempts.reduce((acc, a) => {
        if (acc === 0 || (a.report.timeTaken > 0 && a.report.timeTaken < acc)) {
          return a.report.timeTaken;
        }
        return acc;
      }, 0);

      const totalChaptersCompleted = chapters.filter((c) => c.completed).length;
      const totalQuestionsPracticed = questions.length;
      const longestStreak = streak.topStreak;

      const totalScore = attempts.reduce(
        (acc, a) => acc + a.report.percentage,
        0,
      );
      const avgScore =
        attempts.length === 0 ? 0 : Math.round(totalScore / attempts.length);

      let rankLabel = "Beginner Scholar";
      if (
        totalChaptersCompleted >= 20 &&
        avgScore >= 80 &&
        longestStreak >= 30
      ) {
        rankLabel = "Board Champion";
      } else if (
        totalChaptersCompleted >= 10 &&
        avgScore >= 60 &&
        longestStreak >= 7
      ) {
        rankLabel = "Rising Star";
      } else if (totalChaptersCompleted >= 5 && avgScore >= 40) {
        rankLabel = "Dedicated Learner";
      }

      return {
        highestScorePerSubject,
        fastestTestTime: fastestTime,
        totalQuestionsPracticed,
        totalChaptersCompleted,
        longestStreak,
        rankLabel,
      };
    },
  });
}

// ─── Child Messages (Student inbox) ──────────────────────────────────────────

export function useGetChildMessages(currentUsername: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery<ParentMessage[]>({
    queryKey: ["childMessages", currentUsername],
    queryFn: () => {
      if (!currentUsername) return [];
      return getChildMessages(currentUsername);
    },
    enabled: !!currentUsername,
    refetchInterval: 10000,
  });

  const unreadCount = (query.data ?? []).filter((m) => !m.read).length;

  const markAsRead = (messageId: string) => {
    // Fix: markMessageAsReadLS now takes only the messageId
    markMessageAsReadLS(messageId);
    queryClient.invalidateQueries({
      queryKey: ["childMessages", currentUsername],
    });
  };

  return { ...query, unreadCount, markAsRead };
}

// ─── Parent Replies (Parent inbox) ───────────────────────────────────────────

export function useGetParentReplies(currentParentUsername: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery<ParentReply[]>({
    queryKey: ["parentReplies", currentParentUsername],
    queryFn: () => {
      if (!currentParentUsername) return [];
      return getParentReplies(currentParentUsername);
    },
    enabled: !!currentParentUsername,
    refetchInterval: 10000,
  });

  const unseenCount = (query.data ?? []).filter((r) => !r.seen).length;

  const markAsSeen = (replyId: string) => {
    // Fix: markParentReplyAsSeenLS now takes only the replyId
    markParentReplyAsSeenLS(replyId);
    queryClient.invalidateQueries({
      queryKey: ["parentReplies", currentParentUsername],
    });
  };

  return { ...query, unseenCount, markAsSeen };
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOK GROUP HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export type { LocalBook };

export function useGetBooksForSubject(subjectId: number) {
  return useQuery<LocalBook[]>({
    queryKey: ["books", subjectId],
    queryFn: () => getBooks(uid()).filter((b) => b.subjectId === subjectId),
  });
}

export function useAddBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subjectId,
      name,
    }: { subjectId: number; name: string }) => {
      const userId = uid();
      const books = getBooks(userId);
      const id = getNextId(userId, "book");
      const newBook: LocalBook = {
        id,
        subjectId,
        name: name.trim(),
        createdAt: Date.now(),
      };
      books.push(newBook);
      saveBooks(userId, books);
      return id;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["books", variables.subjectId],
      });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookId,
      subjectId: _subjectId,
    }: { bookId: number; subjectId: number }) => {
      const userId = uid();
      // Remove book
      const books = getBooks(userId);
      saveBooks(
        userId,
        books.filter((b) => b.id !== bookId),
      );
      // Unassign chapters from this book
      const chapters = getChapters(userId);
      saveChapters(
        userId,
        chapters.map((c) =>
          c.bookId === bookId ? { ...c, bookId: undefined } : c,
        ),
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["books", variables.subjectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["chapters", variables.subjectId],
      });
      queryClient.invalidateQueries({ queryKey: ["allChapters"] });
    },
  });
}

export function useAssignChapterToBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      chapterId,
      bookId,
      subjectId: _subjectId,
    }: {
      chapterId: number;
      bookId: number | undefined;
      subjectId: number;
    }) => {
      const userId = uid();
      const chapters = getChapters(userId);
      saveChapters(
        userId,
        chapters.map((c) => (c.id === chapterId ? { ...c, bookId } : c)),
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chapters", variables.subjectId],
      });
      queryClient.invalidateQueries({ queryKey: ["allChapters"] });
    },
  });
}
