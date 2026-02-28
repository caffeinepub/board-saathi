import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCurrentUserId,
  getSubjects,
  saveSubjects,
  getChapters,
  saveChapters,
  getNotes,
  saveNotes,
  getQuestions,
  saveQuestions,
  getFlashcards,
  saveFlashcards,
  getMockTests,
  saveMockTests,
  getTestAttempts,
  saveTestAttempts,
  getPlannerTasks,
  savePlannerTasks,
  getReminders,
  saveReminders,
  getTargets,
  saveTargets,
  getRevisionTasks,
  saveRevisionTasks,
  getStudyStreak,
  getAchievements,
  getUserAccountById,
  saveUserAccount,
  updateStreak,
  scheduleRevisionTasks,
  getNextId,
  initializeUserData,
} from '../utils/localStorageService';

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
} from '../utils/localStorageService';

// Helper to get current user ID safely
function useUserId(): string {
  return getCurrentUserId() || 'guest';
}

// ─── User Profile ───────────────────────────────────────────────────────────

export interface UserProfile {
  username: string;
  name: string;
  school: string;
  studentClass: number;
}

export function useGetCallerUserProfile() {
  const userId = useUserId();

  return useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile', userId],
    queryFn: () => {
      if (!userId || userId === 'guest') return null;
      const account = getUserAccountById(userId);
      if (!account) return null;
      return {
        username: account.username,
        name: account.name,
        school: account.school,
        studentClass: account.studentClass,
      };
    },
    enabled: true,
  });
}

export function useSaveCallerUserProfile() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!userId || userId === 'guest') throw new Error('Not authenticated');
      const account = getUserAccountById(userId);
      if (!account) throw new Error('Account not found');
      saveUserAccount({ ...account, name: profile.name, school: profile.school, studentClass: profile.studentClass });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Subjects ───────────────────────────────────────────────────────────────

export function useGetSubjects() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['subjects', userId],
    queryFn: () => {
      initializeUserData(userId);
      return getSubjects(userId);
    },
    enabled: true,
  });
}

export function useAddSubject() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async (name: string) => {
      const subjects = getSubjects(userId);
      const id = getNextId(userId, 'subject');
      const newSubject = { id, name };
      saveSubjects(userId, [...subjects, newSubject]);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

// ─── Chapters ───────────────────────────────────────────────────────────────

export function useGetChaptersForSubject(subjectId: number) {
  const userId = useUserId();

  return useQuery({
    queryKey: ['chapters', userId, subjectId],
    queryFn: () => {
      const all = getChapters(userId);
      return all.filter(c => c.subjectId === subjectId);
    },
    enabled: subjectId > 0,
  });
}

export function useGetAllChapters() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['chapters', userId],
    queryFn: () => getChapters(userId),
  });
}

export function useAddChapter() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ subjectId, name, weightage }: { subjectId: number; name: string; weightage: number }) => {
      const chapters = getChapters(userId);
      const id = getNextId(userId, 'chapter');
      const newChapter = { id, subjectId, name, weightage, completed: false };
      saveChapters(userId, [...chapters, newChapter]);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
    },
  });
}

export function useMarkChapterCompleted() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ chapterId, completed }: { chapterId: number; completed: boolean }) => {
      const chapters = getChapters(userId);
      const chapter = chapters.find(c => c.id === chapterId);
      const updated = chapters.map(c => c.id === chapterId ? { ...c, completed } : c);
      saveChapters(userId, updated);
      if (completed && chapter && !chapter.completed) {
        scheduleRevisionTasks(userId, chapterId, chapter.subjectId);
        updateStreak(userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      queryClient.invalidateQueries({ queryKey: ['revisionTasks'] });
      queryClient.invalidateQueries({ queryKey: ['plannerTasks'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}

// ─── Notes ──────────────────────────────────────────────────────────────────

export function useGetNotesForChapter(chapterId: number) {
  const userId = useUserId();

  return useQuery({
    queryKey: ['notes', userId, chapterId],
    queryFn: () => {
      const all = getNotes(userId);
      return all.filter(n => n.chapterId === chapterId);
    },
    enabled: chapterId > 0,
  });
}

export function useAddNote() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ chapterId, content, imageData }: { chapterId: number; content: string; imageData?: string }) => {
      const notes = getNotes(userId);
      const id = getNextId(userId, 'note');
      const newNote = { id, chapterId, content, imageData, createdAt: Date.now() };
      saveNotes(userId, [...notes, newNote]);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async (noteId: number) => {
      const notes = getNotes(userId);
      saveNotes(userId, notes.filter(n => n.id !== noteId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

// ─── Questions ──────────────────────────────────────────────────────────────

export function useGetQuestionsForChapter(chapterId: number) {
  const userId = useUserId();

  return useQuery({
    queryKey: ['questions', userId, chapterId],
    queryFn: () => {
      const all = getQuestions(userId);
      return all.filter(q => q.chapterId === chapterId);
    },
    enabled: chapterId > 0,
  });
}

export function useGetQuestionBank(subjectIdFilter?: number, chapterIdFilter?: number) {
  const userId = useUserId();

  return useQuery({
    queryKey: ['questionBank', userId, subjectIdFilter, chapterIdFilter],
    queryFn: () => {
      const all = getQuestions(userId);
      return all.filter(q => {
        const subjectMatch = subjectIdFilter ? q.subjectId === subjectIdFilter : true;
        const chapterMatch = chapterIdFilter ? q.chapterId === chapterIdFilter : true;
        return subjectMatch && chapterMatch;
      });
    },
  });
}

export function useAddQuestion() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ chapterId, subjectId, questionText, answer }: { chapterId: number; subjectId: number; questionText: string; answer: string }) => {
      const questions = getQuestions(userId);
      const id = getNextId(userId, 'question');
      const newQuestion = { id, chapterId, subjectId, questionText, answer };
      saveQuestions(userId, [...questions, newQuestion]);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionBank'] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async (questionId: number) => {
      const questions = getQuestions(userId);
      saveQuestions(userId, questions.filter(q => q.id !== questionId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questionBank'] });
    },
  });
}

// ─── Flashcards ─────────────────────────────────────────────────────────────

export function useGetAllFlashcards() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['flashcards', userId],
    queryFn: () => getFlashcards(userId),
  });
}

export function useGetFlashcardsForChapter(chapterId: number) {
  const userId = useUserId();

  return useQuery({
    queryKey: ['flashcards', userId, chapterId],
    queryFn: () => {
      const all = getFlashcards(userId);
      return all.filter(f => f.chapterId === chapterId);
    },
    enabled: chapterId > 0,
  });
}

export function useAddFlashcard() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ chapterId, subjectId, front, back }: { chapterId: number; subjectId: number; front: string; back: string }) => {
      const flashcards = getFlashcards(userId);
      const id = getNextId(userId, 'flashcard');
      const newCard = { id, chapterId, subjectId, front, back, learned: false };
      saveFlashcards(userId, [...flashcards, newCard]);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
  });
}

export function useMarkFlashcardLearned() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ cardId, learned }: { cardId: number; learned: boolean }) => {
      const flashcards = getFlashcards(userId);
      saveFlashcards(userId, flashcards.map(f => f.id === cardId ? { ...f, learned } : f));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
  });
}

export function useDeleteFlashcard() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async (cardId: number) => {
      const flashcards = getFlashcards(userId);
      saveFlashcards(userId, flashcards.filter(f => f.id !== cardId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
  });
}

// ─── Mock Tests ─────────────────────────────────────────────────────────────

export function useGetMockTests() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['mockTests', userId],
    queryFn: () => getMockTests(userId),
  });
}

export function useGetMockTest(testId: number) {
  const userId = useUserId();

  return useQuery({
    queryKey: ['mockTest', userId, testId],
    queryFn: () => {
      const tests = getMockTests(userId);
      return tests.find(t => t.id === testId) ?? null;
    },
    enabled: testId > 0,
  });
}

export function useCreateMockTest() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ name, subjectId, questions }: { name: string; subjectId: number; questions: { id: number; questionText: string; options: string[]; correctOption: number }[] }) => {
      const tests = getMockTests(userId);
      const id = getNextId(userId, 'mockTest');
      const newTest = { id, name, subjectId, questions };
      saveMockTests(userId, [...tests, newTest]);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mockTests'] });
    },
  });
}

export function useDeleteMockTest() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async (testId: number) => {
      const tests = getMockTests(userId);
      saveMockTests(userId, tests.filter(t => t.id !== testId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mockTests'] });
    },
  });
}

export function useSubmitMockTest() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ testId, answers, timeTaken }: { testId: number; answers: { questionId: number; selectedOption: number }[]; timeTaken: number }) => {
      const tests = getMockTests(userId);
      const test = tests.find(t => t.id === testId);
      if (!test) throw new Error('Test not found');

      let score = 0;
      const results = test.questions.map(q => {
        const answer = answers.find(a => a.questionId === q.id);
        const selected = answer ? answer.selectedOption : 999;
        const isCorrect = selected === q.correctOption;
        if (isCorrect) score++;
        return { questionId: q.id, questionText: q.questionText, selectedOption: selected, correctOption: q.correctOption, isCorrect };
      });

      const total = test.questions.length;
      const percentage = total === 0 ? 0 : Math.round((score * 100) / total);

      const report = { testId, testName: test.name, score, total, percentage, timeTaken, results };
      const attempts = getTestAttempts(userId);
      const id = getNextId(userId, 'testAttempt');
      const attempt = { id, testId, report, attemptedAt: Date.now() };
      saveTestAttempts(userId, [...attempts, attempt]);
      updateStreak(userId);
      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testAttempts'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}

export function useGetTestAttempts() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['testAttempts', userId],
    queryFn: () => getTestAttempts(userId),
  });
}

export function useGetTestAttemptsForTest(testId: number) {
  const userId = useUserId();

  return useQuery({
    queryKey: ['testAttempts', userId, testId],
    queryFn: () => {
      const all = getTestAttempts(userId);
      return all.filter(a => a.testId === testId);
    },
    enabled: testId > 0,
  });
}

// ─── Planner Tasks ──────────────────────────────────────────────────────────

export function useGetPlannerTasksForMonth(year: number, month: number) {
  const userId = useUserId();

  return useQuery({
    queryKey: ['plannerTasks', userId, year, month],
    queryFn: () => getPlannerTasks(userId),
  });
}

export function useGetPlannerTasksForDate(year: number, month: number, date: number) {
  const userId = useUserId();

  return useQuery({
    queryKey: ['plannerTasksDate', userId, year, month, date],
    queryFn: () => {
      const all = getPlannerTasks(userId);
      return all.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === date;
      });
    },
  });
}

export function useGetAllPlannerTasks() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['plannerTasks', userId],
    queryFn: () => getPlannerTasks(userId),
  });
}

export function useAddPlannerTask() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ title, description, date, startTime }: { title: string; description: string; date: number; startTime: string }) => {
      const tasks = getPlannerTasks(userId);
      const id = getNextId(userId, 'plannerTask');
      const newTask = { id, title, description, date, startTime, completed: false };
      savePlannerTasks(userId, [...tasks, newTask]);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannerTasks'] });
      queryClient.invalidateQueries({ queryKey: ['plannerTasksDate'] });
    },
  });
}

export function useCompletePlannerTask() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: number; completed: boolean }) => {
      const tasks = getPlannerTasks(userId);
      savePlannerTasks(userId, tasks.map(t => t.id === taskId ? { ...t, completed } : t));
      if (completed) updateStreak(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannerTasks'] });
      queryClient.invalidateQueries({ queryKey: ['plannerTasksDate'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}

export function useDeletePlannerTask() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async (taskId: number) => {
      const tasks = getPlannerTasks(userId);
      savePlannerTasks(userId, tasks.filter(t => t.id !== taskId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannerTasks'] });
      queryClient.invalidateQueries({ queryKey: ['plannerTasksDate'] });
    },
  });
}

// ─── Reminders ──────────────────────────────────────────────────────────────

export function useGetReminders() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['reminders', userId],
    queryFn: () => {
      const all = getReminders(userId);
      return all.sort((a, b) => a.dateTime - b.dateTime);
    },
  });
}

export function useAddReminder() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ text, dateTime, alarmSound }: { text: string; dateTime: number; alarmSound?: string }) => {
      const reminders = getReminders(userId);
      const id = getNextId(userId, 'reminder');
      const newReminder = { id, text, dateTime, alarmSound };
      saveReminders(userId, [...reminders, newReminder]);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async (reminderId: number) => {
      const reminders = getReminders(userId);
      saveReminders(userId, reminders.filter(r => r.id !== reminderId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

// ─── Targets ────────────────────────────────────────────────────────────────

export function useGetTargets() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['targets', userId],
    queryFn: () => getTargets(userId),
  });
}

export function useAddTarget() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ title, description, deadline }: { title: string; description: string; deadline: number }) => {
      const targets = getTargets(userId);
      const id = getNextId(userId, 'target');
      const newTarget = { id, title, description, deadline, completed: false };
      saveTargets(userId, [...targets, newTarget]);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
    },
  });
}

export function useCompleteTarget() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ targetId, completed }: { targetId: number; completed: boolean }) => {
      const targets = getTargets(userId);
      saveTargets(userId, targets.map(t => t.id === targetId ? { ...t, completed } : t));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
    },
  });
}

export function useDeleteTarget() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async (targetId: number) => {
      const targets = getTargets(userId);
      saveTargets(userId, targets.filter(t => t.id !== targetId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
    },
  });
}

// ─── Revision Tasks ─────────────────────────────────────────────────────────

export function useGetRevisionTasks() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['revisionTasks', userId],
    queryFn: () => getRevisionTasks(userId),
  });
}

export function useGetPendingRevisionTasks() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['revisionTasks', userId, 'pending'],
    queryFn: () => {
      const all = getRevisionTasks(userId);
      return all.filter(r => !r.completed);
    },
  });
}

export function useMarkRevisionTaskCompleted() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ revisionId, completed }: { revisionId: number; completed: boolean }) => {
      const tasks = getRevisionTasks(userId);
      saveRevisionTasks(userId, tasks.map(r => r.id === revisionId ? { ...r, completed } : r));
      if (completed) updateStreak(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisionTasks'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}

// ─── Study Streak ────────────────────────────────────────────────────────────

export function useGetStudyStreak() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['streak', userId],
    queryFn: () => getStudyStreak(userId),
  });
}

export function useRecordDailyLogin() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async () => {
      return updateStreak(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}

// ─── Achievements ────────────────────────────────────────────────────────────

export function useGetAchievements() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['achievements', userId],
    queryFn: () => getAchievements(userId),
  });
}

// ─── Progress Summary ────────────────────────────────────────────────────────

export function useGetProgressSummary() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['progress', userId],
    queryFn: () => {
      initializeUserData(userId);
      const subjects = getSubjects(userId);
      const chapters = getChapters(userId);
      const tasks = getPlannerTasks(userId);
      const targets = getTargets(userId);
      const attempts = getTestAttempts(userId);

      const subjectProgress = subjects.map(s => {
        const subChapters = chapters.filter(c => c.subjectId === s.id);
        const completedCount = subChapters.filter(c => c.completed).length;
        return {
          subjectId: s.id,
          subjectName: s.name,
          totalChapters: subChapters.length,
          completedChapters: completedCount,
        };
      });

      const completedTasks = tasks.filter(t => t.completed).length;
      const achievedTargets = targets.filter(t => t.completed).length;
      const totalScore = attempts.reduce((acc, a) => acc + a.report.percentage, 0);
      const avgScore = attempts.length === 0 ? 0 : Math.round(totalScore / attempts.length);

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

// ─── Personal Best ───────────────────────────────────────────────────────────

export function useGetPersonalBest() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['personalBest', userId],
    queryFn: () => {
      const attempts = getTestAttempts(userId);
      const chapters = getChapters(userId);
      const questions = getQuestions(userId);
      const streak = getStudyStreak(userId);
      const subjects = getSubjects(userId);

      const highestScorePerSubject = subjects.map(s => {
        const subjectAttempts = attempts;
        const maxScore = subjectAttempts.reduce((acc, a) => Math.max(acc, a.report.percentage), 0);
        return [s.id, maxScore] as [number, number];
      });

      const fastestTime = attempts.reduce((acc, a) => {
        if (acc === 0 || (a.report.timeTaken > 0 && a.report.timeTaken < acc)) return a.report.timeTaken;
        return acc;
      }, 0);

      const totalChaptersCompleted = chapters.filter(c => c.completed).length;
      const totalQuestionsPracticed = questions.length;
      const longestStreak = streak.topStreak;

      const totalScore = attempts.reduce((acc, a) => acc + a.report.percentage, 0);
      const avgScore = attempts.length === 0 ? 0 : Math.round(totalScore / attempts.length);

      let rankLabel = 'Beginner Scholar';
      if (totalChaptersCompleted >= 20 && avgScore >= 80 && longestStreak >= 30) {
        rankLabel = 'Board Champion';
      } else if (totalChaptersCompleted >= 10 && avgScore >= 60 && longestStreak >= 7) {
        rankLabel = 'Rising Star';
      } else if (totalChaptersCompleted >= 5 && avgScore >= 40) {
        rankLabel = 'Dedicated Learner';
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
