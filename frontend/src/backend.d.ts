import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ProgressSummary {
    totalTasks: bigint;
    totalTargets: bigint;
    totalMockTestsAttempted: bigint;
    totalTargetsAchieved: bigint;
    mockTestAverageScore: bigint;
    totalTasksCompleted: bigint;
    subjectProgress: Array<SubjectProgress>;
}
export interface Note {
    id: bigint;
    content: string;
    imageData?: string;
    createdAt: Time;
    chapterId: bigint;
}
export interface MockTest {
    id: bigint;
    name: string;
    subjectId: bigint;
    questions: Array<MCQQuestion>;
}
export type Time = bigint;
export interface MCQQuestion {
    id: bigint;
    correctOption: bigint;
    questionText: string;
    options: Array<string>;
}
export interface PersonalBest {
    totalQuestionsPracticed: bigint;
    fastestTestTime: bigint;
    rankLabel: string;
    highestScorePerSubject: Array<[bigint, bigint]>;
    totalChaptersCompleted: bigint;
    longestStreak: bigint;
}
export interface MCQAnswer {
    questionId: bigint;
    selectedOption: bigint;
}
export interface SubjectProgress {
    completedChapters: bigint;
    subjectName: string;
    subjectId: bigint;
    totalChapters: bigint;
}
export interface Chapter {
    id: bigint;
    weightage: bigint;
    name: string;
    completed: boolean;
    subjectId: bigint;
}
export interface QuestionResult {
    correctOption: bigint;
    isCorrect: boolean;
    questionText: string;
    questionId: bigint;
    selectedOption: bigint;
}
export interface Target {
    id: bigint;
    title: string;
    completed: boolean;
    description: string;
    deadline: Time;
}
export interface UserAchievement {
    id: bigint;
    achievedAt: Time;
    achievementType: string;
}
export interface TestAttempt {
    id: bigint;
    report: TestReport;
    attemptedAt: Time;
    testId: bigint;
}
export interface PlannerTask {
    id: bigint;
    startTime: string;
    title: string;
    date: Time;
    completed: boolean;
    description: string;
}
export interface Reminder {
    id: bigint;
    text: string;
    targetId?: bigint;
    dateTime: Time;
}
export interface Flashcard {
    id: bigint;
    front: string;
    learned: boolean;
    back: string;
    chapterId: bigint;
    subjectId: bigint;
}
export interface TestReport {
    total: bigint;
    testName: string;
    results: Array<QuestionResult>;
    score: bigint;
    timeTaken: bigint;
    testId: bigint;
    percentage: bigint;
}
export interface Question {
    id: bigint;
    chapterId: bigint;
    answer: string;
    questionText: string;
    subjectId: bigint;
}
export interface StudyStreak {
    lastActiveDate: Time;
    topStreak: bigint;
    currentStreak: bigint;
}
export interface RevisionTask {
    id: bigint;
    plannerTaskId?: bigint;
    completed: boolean;
    dueDate: Time;
    chapterId: bigint;
    subjectId: bigint;
    revisionNumber: bigint;
}
export interface Subject {
    id: bigint;
    name: string;
}
export interface UserProfile {
    username: string;
    school: string;
    name: string;
    studentClass: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / addChapter: only authenticated users (#user) can add chapters.
     */
    addChapter(subjectId: bigint, name: string, weightage: bigint): Promise<bigint>;
    /**
     * / addFlashcard: only authenticated users (#user) can add flashcards.
     */
    addFlashcard(chapterId: bigint, subjectId: bigint, front: string, back: string): Promise<bigint>;
    /**
     * / addNote: only authenticated users (#user) can add notes.
     */
    addNote(chapterId: bigint, content: string, imageData: string | null): Promise<bigint>;
    /**
     * / addPlannerTask: only authenticated users (#user) can add planner tasks.
     */
    addPlannerTask(title: string, description: string, date: Time, startTime: string): Promise<bigint>;
    /**
     * / addQuestion: only authenticated users (#user) can add questions.
     */
    addQuestion(chapterId: bigint, subjectId: bigint, questionText: string, answer: string): Promise<bigint>;
    /**
     * / addReminder: only authenticated users (#user) can add reminders.
     */
    addReminder(text: string, dateTime: Time, targetId: bigint | null): Promise<bigint>;
    addSubject(name: string): Promise<bigint>;
    /**
     * / addTarget: only authenticated users (#user) can add targets.
     */
    addTarget(title: string, description: string, deadline: Time): Promise<bigint>;
    /**
     * / adminListUsers: only admins can list all users.
     */
    adminListUsers(): Promise<Array<Principal>>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / completePlannerTask: only authenticated users (#user) can update their own planner tasks.
     * / Completing a task also updates the study streak.
     */
    completePlannerTask(taskId: bigint, completed: boolean): Promise<void>;
    /**
     * / completeTarget: only authenticated users (#user) can update their own targets.
     */
    completeTarget(targetId: bigint, completed: boolean): Promise<void>;
    /**
     * / createMockTest: only authenticated users (#user) can create mock tests.
     */
    createMockTest(name: string, subjectId: bigint, questions: Array<MCQQuestion>): Promise<bigint>;
    /**
     * / deleteFlashcard: only authenticated users (#user) can delete their own flashcards.
     */
    deleteFlashcard(cardId: bigint): Promise<void>;
    /**
     * / deleteMockTest: only authenticated users (#user) can delete their own mock tests.
     */
    deleteMockTest(testId: bigint): Promise<void>;
    /**
     * / deleteNote: only authenticated users (#user) can delete their own notes.
     */
    deleteNote(noteId: bigint): Promise<void>;
    /**
     * / deletePlannerTask: only authenticated users (#user) can delete their own planner tasks.
     */
    deletePlannerTask(taskId: bigint): Promise<void>;
    /**
     * / deleteQuestion: only authenticated users (#user) can delete their own questions.
     */
    deleteQuestion(questionId: bigint): Promise<void>;
    /**
     * / deleteReminder: only authenticated users (#user) can delete their own reminders.
     */
    deleteReminder(reminderId: bigint): Promise<void>;
    /**
     * / deleteTarget: only authenticated users (#user) can delete their own targets.
     */
    deleteTarget(targetId: bigint): Promise<void>;
    /**
     * / getAchievements: only authenticated users (#user) can view their achievements.
     */
    getAchievements(): Promise<Array<UserAchievement>>;
    /**
     * / getAllFlashcards: only authenticated users (#user) can view all their flashcards.
     */
    getAllFlashcards(): Promise<Array<Flashcard>>;
    /**
     * / getAllPlannerTasks: only authenticated users (#user) can view all their planner tasks.
     */
    getAllPlannerTasks(): Promise<Array<PlannerTask>>;
    /**
     * / getCallerUserProfile: only authenticated users (#user) can call this.
     */
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / getChaptersForSubject: only authenticated users (#user) can view their chapters.
     */
    getChaptersForSubject(subjectId: bigint): Promise<Array<Chapter>>;
    /**
     * / getFlashcardsForChapter: only authenticated users (#user) can view their flashcards.
     */
    getFlashcardsForChapter(chapterId: bigint): Promise<Array<Flashcard>>;
    /**
     * / getMockTest: only authenticated users (#user) can view a specific mock test.
     */
    getMockTest(testId: bigint): Promise<MockTest | null>;
    /**
     * / getMockTests: only authenticated users (#user) can view their mock tests.
     */
    getMockTests(): Promise<Array<MockTest>>;
    /**
     * / getNotesForChapter: only authenticated users (#user) can view their notes.
     */
    getNotesForChapter(chapterId: bigint): Promise<Array<Note>>;
    /**
     * / getPendingRevisionTasks: only authenticated users (#user) can view their pending revision tasks.
     */
    getPendingRevisionTasks(): Promise<Array<RevisionTask>>;
    /**
     * / getPersonalBest: only authenticated users (#user) can view their personal best stats.
     */
    getPersonalBest(): Promise<PersonalBest>;
    /**
     * / getPlannerTasksForDate: only authenticated users (#user) can view their planner tasks.
     */
    getPlannerTasksForDate(date: Time): Promise<Array<PlannerTask>>;
    /**
     * / getPlannerTasksForMonth: only authenticated users (#user) can view their planner tasks.
     */
    getPlannerTasksForMonth(_year: bigint, _month: bigint): Promise<Array<PlannerTask>>;
    /**
     * / getProgressSummary: only authenticated users (#user) can view their progress.
     */
    getProgressSummary(): Promise<ProgressSummary>;
    /**
     * / getQuestionBank: only authenticated users (#user) can view the question bank.
     */
    getQuestionBank(subjectIdFilter: bigint | null, chapterIdFilter: bigint | null): Promise<Array<Question>>;
    /**
     * / getQuestionsForChapter: only authenticated users (#user) can view their questions.
     */
    getQuestionsForChapter(chapterId: bigint): Promise<Array<Question>>;
    /**
     * / getReminders: only authenticated users (#user) can view their reminders.
     */
    getReminders(): Promise<Array<Reminder>>;
    /**
     * / getRevisionTasks: only authenticated users (#user) can view their revision tasks.
     */
    getRevisionTasks(): Promise<Array<RevisionTask>>;
    /**
     * / getStudyStreak: only authenticated users (#user) can view their study streak.
     */
    getStudyStreak(): Promise<StudyStreak>;
    /**
     * / getSubjects: only authenticated users (#user) can view their subjects.
     */
    getSubjects(): Promise<Array<Subject>>;
    /**
     * / getTargets: only authenticated users (#user) can view their targets.
     */
    getTargets(): Promise<Array<Target>>;
    /**
     * / getTestAttempts: only authenticated users (#user) can view their test attempts.
     */
    getTestAttempts(): Promise<Array<TestAttempt>>;
    /**
     * / getTestAttemptsForTest: only authenticated users (#user) can view test attempts for a specific test.
     */
    getTestAttemptsForTest(testId: bigint): Promise<Array<TestAttempt>>;
    /**
     * / getUserProfile: users can only view their own profile; admins can view any.
     */
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / markChapterCompleted: only authenticated users (#user) can update their chapters.
     * / When a chapter is marked complete, revision tasks are automatically scheduled.
     */
    markChapterCompleted(chapterId: bigint, completed: boolean): Promise<void>;
    /**
     * / markFlashcardLearned: only authenticated users (#user) can update their own flashcards.
     */
    markFlashcardLearned(cardId: bigint, learned: boolean): Promise<void>;
    /**
     * / markRevisionTaskCompleted: only authenticated users (#user) can update their own revision tasks.
     */
    markRevisionTaskCompleted(revisionId: bigint, completed: boolean): Promise<void>;
    /**
     * / recordDailyLogin: only authenticated users (#user) can record their daily login for streak tracking.
     */
    recordDailyLogin(): Promise<StudyStreak>;
    /**
     * / Register is open to anyone (guests), since users need to register before having a #user role.
     */
    register(username: string, name: string, school: string, studentClass: bigint): Promise<void>;
    /**
     * / saveCallerUserProfile: only authenticated users (#user) can save their own profile.
     */
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    /**
     * / submitMockTest: only authenticated users (#user) can submit mock tests.
     */
    submitMockTest(testId: bigint, answers: Array<MCQAnswer>, timeTaken: bigint): Promise<TestReport>;
}
