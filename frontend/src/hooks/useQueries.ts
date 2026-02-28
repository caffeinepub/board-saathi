import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  UserProfile,
  Target,
  Subject,
  Chapter,
  Note,
  Question,
  PlannerTask,
  Reminder,
  MockTest,
  MCQQuestion,
  MCQAnswer,
  TestAttempt,
  RevisionTask,
  Flashcard,
  StudyStreak,
  UserAchievement,
  ProgressSummary,
  PersonalBest,
} from '../backend';

// ─── Local types ─────────────────────────────────────────────────────────────

export interface LocalReminder {
  id: number;
  text: string;
  dateTime: number; // ms
  alarmSound?: string;
  targetId?: number;
}

export interface LocalTarget {
  id: number;
  title: string;
  description: string;
  deadline: number; // ms
  completed: boolean;
}

// ─── localStorage helpers ────────────────────────────────────────────────────

const REMINDERS_KEY = 'board_saathi_reminders';
const TARGETS_KEY = 'board_saathi_targets';
const USER_KEY = 'board_saathi_user';

function getStoredReminders(): LocalReminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredReminders(reminders: LocalReminder[]): void {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

function getStoredTargets(): LocalTarget[] {
  try {
    const raw = localStorage.getItem(TARGETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredTargets(targets: LocalTarget[]): void {
  localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
}

export function getStoredUser(): { name: string; username: string } | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: { name: string; username: string }): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useRegister() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      username: string;
      name: string;
      school: string;
      studentClass: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.register(params.username, params.name, params.school, params.studentClass);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Subjects ────────────────────────────────────────────────────────────────

export function useGetSubjects() {
  const { actor, isFetching } = useActor();

  return useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSubjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddSubject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addSubject(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

// ─── Chapters ────────────────────────────────────────────────────────────────

export function useGetChapters(subjectId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Chapter[]>({
    queryKey: ['chapters', String(subjectId)],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChaptersForSubject(subjectId);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Alias for pages that import useGetChaptersForSubject */
export const useGetChaptersForSubject = useGetChapters;

/** Fetch all chapters across all subjects (fetches per-subject and merges) */
export function useGetAllChapters() {
  const { actor, isFetching } = useActor();
  const { data: subjects = [] } = useGetSubjects();

  return useQuery<Chapter[]>({
    queryKey: ['allChapters', subjects.map((s) => String(s.id)).join(',')],
    queryFn: async () => {
      if (!actor || subjects.length === 0) return [];
      const results = await Promise.all(
        subjects.map((s) => actor.getChaptersForSubject(s.id))
      );
      return results.flat();
    },
    enabled: !!actor && !isFetching && subjects.length > 0,
  });
}

export function useAddChapter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { subjectId: bigint; name: string; weightage: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addChapter(params.subjectId, params.name, params.weightage);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chapters', String(variables.subjectId)] });
      queryClient.invalidateQueries({ queryKey: ['allChapters'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useMarkChapterCompleted() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { chapterId: bigint; completed: boolean; subjectId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markChapterCompleted(params.chapterId, params.completed);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chapters', String(variables.subjectId)] });
      queryClient.invalidateQueries({ queryKey: ['allChapters'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      queryClient.invalidateQueries({ queryKey: ['revisionTasks'] });
    },
  });
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export function useGetNotes(chapterId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Note[]>({
    queryKey: ['notes', String(chapterId)],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNotesForChapter(chapterId);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Alias for components that import useGetNotesForChapter */
export const useGetNotesForChapter = useGetNotes;

export function useAddNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { chapterId: bigint; content: string; imageData: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addNote(params.chapterId, params.content, params.imageData);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', String(variables.chapterId)] });
    },
  });
}

export function useDeleteNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { noteId: bigint; chapterId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteNote(params.noteId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', String(variables.chapterId)] });
    },
  });
}

// ─── Questions ───────────────────────────────────────────────────────────────

export function useGetQuestions(chapterId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Question[]>({
    queryKey: ['questions', String(chapterId)],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getQuestionsForChapter(chapterId);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Alias for components that import useGetQuestionsForChapter */
export const useGetQuestionsForChapter = useGetQuestions;

export function useAddQuestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      chapterId: bigint;
      subjectId: bigint;
      questionText: string;
      answer: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addQuestion(params.chapterId, params.subjectId, params.questionText, params.answer);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['questions', String(variables.chapterId)] });
      queryClient.invalidateQueries({ queryKey: ['questionBank'] });
    },
  });
}

export function useDeleteQuestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { questionId: bigint; chapterId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteQuestion(params.questionId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['questions', String(variables.chapterId)] });
      queryClient.invalidateQueries({ queryKey: ['questionBank'] });
    },
  });
}

// ─── Question Bank ───────────────────────────────────────────────────────────

export function useGetQuestionBank(subjectId?: bigint, chapterId?: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Question[]>({
    queryKey: ['questionBank', String(subjectId), String(chapterId)],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getQuestionBank(subjectId ?? null, chapterId ?? null);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Planner ─────────────────────────────────────────────────────────────────

export function useGetPlannerTasksForMonth(year: number, month: number) {
  const { actor, isFetching } = useActor();

  return useQuery<PlannerTask[]>({
    queryKey: ['plannerMonth', year, month],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPlannerTasksForMonth(BigInt(year), BigInt(month));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPlannerTasksForDate(year: number, month: number, date: number) {
  const { actor, isFetching } = useActor();

  return useQuery<PlannerTask[]>({
    queryKey: ['plannerDate', year, month, date],
    queryFn: async () => {
      if (!actor) return [];
      const d = new Date(year, month - 1, date);
      const ts = BigInt(d.getTime()) * BigInt(1_000_000);
      return actor.getPlannerTasksForDate(ts);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddPlannerTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      description: string;
      year: number;
      month: number;
      date: number;
      startTime: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const d = new Date(params.year, params.month - 1, params.date);
      const ts = BigInt(d.getTime()) * BigInt(1_000_000);
      return actor.addPlannerTask(params.title, params.description, ts, params.startTime);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plannerDate', variables.year, variables.month, variables.date] });
      queryClient.invalidateQueries({ queryKey: ['plannerMonth', variables.year, variables.month] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useCompletePlannerTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      taskId: bigint;
      completed: boolean;
      year: number;
      month: number;
      date: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.completePlannerTask(params.taskId, params.completed);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plannerDate', variables.year, variables.month, variables.date] });
      queryClient.invalidateQueries({ queryKey: ['plannerMonth', variables.year, variables.month] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}

export function useDeletePlannerTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      taskId: bigint;
      year: number;
      month: number;
      date: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletePlannerTask(params.taskId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plannerDate', variables.year, variables.month, variables.date] });
      queryClient.invalidateQueries({ queryKey: ['plannerMonth', variables.year, variables.month] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export function useGetReminders() {
  const { actor, isFetching } = useActor();

  return useQuery<LocalReminder[]>({
    queryKey: ['reminders'],
    queryFn: async () => {
      if (!actor) return getStoredReminders();
      try {
        const backendReminders = await actor.getReminders();
        const localReminders: LocalReminder[] = backendReminders.map((r) => ({
          id: Number(r.id),
          text: r.text,
          dateTime: Number(r.dateTime) / 1_000_000,
          alarmSound: undefined,
          targetId: r.targetId !== undefined && r.targetId !== null ? Number(r.targetId) : undefined,
        }));
        saveStoredReminders(localReminders);
        return localReminders;
      } catch {
        return getStoredReminders();
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddReminder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      text: string;
      dateTime: number;
      alarmSound?: string;
      targetId?: number;
    }) => {
      const localReminders = getStoredReminders();
      const newId = Date.now();
      const newReminder: LocalReminder = {
        id: newId,
        text: params.text,
        dateTime: params.dateTime,
        alarmSound: params.alarmSound,
        targetId: params.targetId,
      };
      saveStoredReminders([...localReminders, newReminder]);

      if (actor) {
        try {
          const ts = BigInt(Math.round(params.dateTime)) * BigInt(1_000_000);
          const targetId = params.targetId !== undefined ? BigInt(params.targetId) : null;
          await actor.addReminder(params.text, ts, targetId);
        } catch {
          // Silently fail backend sync
        }
      }
      return newReminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useDeleteReminder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reminderId: number) => {
      const localReminders = getStoredReminders();
      saveStoredReminders(localReminders.filter((r) => r.id !== reminderId));

      if (actor) {
        try {
          await actor.deleteReminder(BigInt(reminderId));
        } catch {
          // Silently fail backend sync
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

// ─── Targets ─────────────────────────────────────────────────────────────────

export function useGetTargets() {
  const { actor, isFetching } = useActor();

  return useQuery<LocalTarget[]>({
    queryKey: ['targets'],
    queryFn: async () => {
      if (!actor) return getStoredTargets();
      try {
        const backendTargets = await actor.getTargets();
        const localTargets: LocalTarget[] = backendTargets.map((t) => ({
          id: Number(t.id),
          title: t.title,
          description: t.description,
          deadline: Number(t.deadline) / 1_000_000,
          completed: t.completed,
        }));
        saveStoredTargets(localTargets);
        return localTargets;
      } catch {
        return getStoredTargets();
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTarget() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { title: string; description: string; deadline: number }) => {
      const localTargets = getStoredTargets();
      const newId = Date.now();
      const newTarget: LocalTarget = {
        id: newId,
        title: params.title,
        description: params.description,
        deadline: params.deadline,
        completed: false,
      };
      saveStoredTargets([...localTargets, newTarget]);

      if (actor) {
        try {
          const ts = BigInt(Math.round(params.deadline)) * BigInt(1_000_000);
          await actor.addTarget(params.title, params.description, ts);
        } catch {
          // Silently fail backend sync
        }
      }
      return newTarget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useCompleteTarget() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { targetId: number; completed: boolean }) => {
      const id = Number(params.targetId);
      const localTargets = getStoredTargets();
      saveStoredTargets(localTargets.map((t) => (t.id === id ? { ...t, completed: params.completed } : t)));

      if (actor) {
        try {
          await actor.completeTarget(BigInt(id), params.completed);
        } catch {
          // Silently fail backend sync
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useDeleteTarget() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetId: number) => {
      const localTargets = getStoredTargets();
      saveStoredTargets(localTargets.filter((t) => t.id !== targetId));

      if (actor) {
        try {
          await actor.deleteTarget(BigInt(targetId));
        } catch {
          // Silently fail backend sync
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

// ─── Mock Tests ──────────────────────────────────────────────────────────────

export function useGetMockTests() {
  const { actor, isFetching } = useActor();

  return useQuery<MockTest[]>({
    queryKey: ['mockTests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMockTests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMockTest(testId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<MockTest | null>({
    queryKey: ['mockTest', String(testId)],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMockTest(testId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateMockTest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string; subjectId: bigint; questions: MCQQuestion[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createMockTest(params.name, params.subjectId, params.questions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mockTests'] });
    },
  });
}

export function useDeleteMockTest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMockTest(testId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mockTests'] });
    },
  });
}

export function useSubmitMockTest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { testId: bigint; answers: MCQAnswer[]; timeTaken: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitMockTest(params.testId, params.answers, params.timeTaken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testAttempts'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}

export function useGetTestAttempts() {
  const { actor, isFetching } = useActor();

  return useQuery<TestAttempt[]>({
    queryKey: ['testAttempts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTestAttempts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTestAttemptsForTest(testId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<TestAttempt[]>({
    queryKey: ['testAttempts', String(testId)],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTestAttemptsForTest(testId);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Revision Tasks ──────────────────────────────────────────────────────────

export function useGetRevisionTasks() {
  const { actor, isFetching } = useActor();

  return useQuery<RevisionTask[]>({
    queryKey: ['revisionTasks'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRevisionTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPendingRevisionTasks() {
  const { actor, isFetching } = useActor();

  return useQuery<RevisionTask[]>({
    queryKey: ['pendingRevisionTasks'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingRevisionTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkRevisionTaskCompleted() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { revisionId: bigint; completed: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markRevisionTaskCompleted(params.revisionId, params.completed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisionTasks'] });
      queryClient.invalidateQueries({ queryKey: ['pendingRevisionTasks'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}

// ─── Flashcards ──────────────────────────────────────────────────────────────

export function useGetFlashcards(chapterId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Flashcard[]>({
    queryKey: ['flashcards', String(chapterId)],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFlashcardsForChapter(chapterId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllFlashcards() {
  const { actor, isFetching } = useActor();

  return useQuery<Flashcard[]>({
    queryKey: ['allFlashcards'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFlashcards();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddFlashcard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { chapterId: bigint; subjectId: bigint; front: string; back: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addFlashcard(params.chapterId, params.subjectId, params.front, params.back);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', String(variables.chapterId)] });
      queryClient.invalidateQueries({ queryKey: ['allFlashcards'] });
    },
  });
}

export function useMarkFlashcardLearned() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { cardId: bigint; learned: boolean; chapterId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markFlashcardLearned(params.cardId, params.learned);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', String(variables.chapterId)] });
      queryClient.invalidateQueries({ queryKey: ['allFlashcards'] });
    },
  });
}

export function useDeleteFlashcard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { cardId: bigint; chapterId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteFlashcard(params.cardId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', String(variables.chapterId)] });
      queryClient.invalidateQueries({ queryKey: ['allFlashcards'] });
    },
  });
}

// ─── Study Streak ────────────────────────────────────────────────────────────

export function useGetStudyStreak() {
  const { actor, isFetching } = useActor();

  return useQuery<StudyStreak>({
    queryKey: ['streak'],
    queryFn: async () => {
      if (!actor) return { currentStreak: BigInt(0), lastActiveDate: BigInt(0), topStreak: BigInt(0) };
      return actor.getStudyStreak();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordDailyLogin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordDailyLogin();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}

// ─── Achievements ────────────────────────────────────────────────────────────

export function useGetAchievements() {
  const { actor, isFetching } = useActor();

  return useQuery<UserAchievement[]>({
    queryKey: ['achievements'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAchievements();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Progress ────────────────────────────────────────────────────────────────

export function useGetProgressSummary() {
  const { actor, isFetching } = useActor();

  return useQuery<ProgressSummary>({
    queryKey: ['progress'],
    queryFn: async () => {
      if (!actor) {
        return {
          subjectProgress: [],
          totalTasksCompleted: BigInt(0),
          totalTasks: BigInt(0),
          totalTargetsAchieved: BigInt(0),
          totalTargets: BigInt(0),
          mockTestAverageScore: BigInt(0),
          totalMockTestsAttempted: BigInt(0),
        };
      }
      return actor.getProgressSummary();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Personal Best ───────────────────────────────────────────────────────────

export function useGetPersonalBest() {
  const { actor, isFetching } = useActor();

  return useQuery<PersonalBest>({
    queryKey: ['personalBest'],
    queryFn: async () => {
      if (!actor) {
        return {
          highestScorePerSubject: [],
          fastestTestTime: BigInt(0),
          rankLabel: 'Beginner Scholar',
          totalQuestionsPracticed: BigInt(0),
          totalChaptersCompleted: BigInt(0),
          longestStreak: BigInt(0),
        };
      }
      return actor.getPersonalBest();
    },
    enabled: !!actor && !isFetching,
  });
}
