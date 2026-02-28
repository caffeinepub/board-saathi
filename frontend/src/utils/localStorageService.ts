// Local Storage Service - Manages all user data offline
// All data is namespaced by userId to prevent cross-account data leakage

export interface StoredUserAccount {
  userId: string;
  username: string;
  passwordHash: string;
  name: string;
  school: string;
  studentClass: number;
  createdAt: number;
}

// Simple hash function for offline password storage
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Generate a unique user ID
export function generateUserId(): string {
  return 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

// Account management
export function saveUserAccount(account: StoredUserAccount): void {
  const accounts = getAllAccounts();
  accounts[account.username] = account;
  localStorage.setItem('bs_accounts', JSON.stringify(accounts));
}

export function getAllAccounts(): Record<string, StoredUserAccount> {
  try {
    const raw = localStorage.getItem('bs_accounts');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getUserAccount(username: string): StoredUserAccount | null {
  const accounts = getAllAccounts();
  return accounts[username] || null;
}

export function getUserAccountById(userId: string): StoredUserAccount | null {
  const accounts = getAllAccounts();
  return Object.values(accounts).find(a => a.userId === userId) || null;
}

export function validateCredentials(username: string, password: string): StoredUserAccount | null {
  const account = getUserAccount(username);
  if (!account) return null;
  if (account.passwordHash !== simpleHash(password)) return null;
  return account;
}

export function findAccountsBySchool(schoolName: string): StoredUserAccount[] {
  const accounts = getAllAccounts();
  return Object.values(accounts).filter(
    a => a.school.toLowerCase().trim() === schoolName.toLowerCase().trim()
  );
}

export function updateUserPassword(username: string, newPassword: string): boolean {
  const account = getUserAccount(username);
  if (!account) return false;
  account.passwordHash = simpleHash(newPassword);
  saveUserAccount(account);
  return true;
}

export function isUsernameAvailable(username: string): boolean {
  return !getUserAccount(username);
}

// Session management
export function getCurrentUserId(): string | null {
  return sessionStorage.getItem('bs_currentUserId');
}

export function setCurrentUserId(userId: string): void {
  sessionStorage.setItem('bs_currentUserId', userId);
}

export function clearCurrentSession(): void {
  sessionStorage.removeItem('bs_currentUserId');
}

export function isGuest(): boolean {
  return getCurrentUserId() === 'guest';
}

export function isAuthenticated(): boolean {
  const id = getCurrentUserId();
  return !!id && id !== 'guest';
}

// Storage key helpers
export function getUserDataKey(userId: string, dataType: string): string {
  if (userId === 'guest') {
    return `bs_guest_${dataType}`;
  }
  return `bs_${userId}_${dataType}`;
}

function getStorage(userId: string): Storage {
  // Guest data uses sessionStorage (cleared on browser close)
  if (userId === 'guest') return sessionStorage;
  return localStorage;
}

// Generic get/set helpers
function getData<T>(userId: string, dataType: string, defaultValue: T): T {
  try {
    const storage = getStorage(userId);
    const key = getUserDataKey(userId, dataType);
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setData<T>(userId: string, dataType: string, data: T): void {
  try {
    const storage = getStorage(userId);
    const key = getUserDataKey(userId, dataType);
    storage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${dataType}:`, e);
  }
}

// Subject helpers
export interface LocalSubject {
  id: number;
  name: string;
}

export function getSubjects(userId: string): LocalSubject[] {
  return getData<LocalSubject[]>(userId, 'subjects', []);
}

export function saveSubjects(userId: string, subjects: LocalSubject[]): void {
  setData(userId, 'subjects', subjects);
}

// Chapter helpers
export interface LocalChapter {
  id: number;
  subjectId: number;
  name: string;
  weightage: number;
  completed: boolean;
}

export function getChapters(userId: string): LocalChapter[] {
  return getData<LocalChapter[]>(userId, 'chapters', []);
}

export function saveChapters(userId: string, chapters: LocalChapter[]): void {
  setData(userId, 'chapters', chapters);
}

// Note helpers
export interface LocalNote {
  id: number;
  chapterId: number;
  content: string;
  imageData?: string;
  createdAt: number;
}

export function getNotes(userId: string): LocalNote[] {
  return getData<LocalNote[]>(userId, 'notes', []);
}

export function saveNotes(userId: string, notes: LocalNote[]): void {
  setData(userId, 'notes', notes);
}

// Question helpers
export interface LocalQuestion {
  id: number;
  chapterId: number;
  subjectId: number;
  questionText: string;
  answer: string;
}

export function getQuestions(userId: string): LocalQuestion[] {
  return getData<LocalQuestion[]>(userId, 'questions', []);
}

export function saveQuestions(userId: string, questions: LocalQuestion[]): void {
  setData(userId, 'questions', questions);
}

// Flashcard helpers
export interface LocalFlashcard {
  id: number;
  chapterId: number;
  subjectId: number;
  front: string;
  back: string;
  learned: boolean;
}

export function getFlashcards(userId: string): LocalFlashcard[] {
  return getData<LocalFlashcard[]>(userId, 'flashcards', []);
}

export function saveFlashcards(userId: string, flashcards: LocalFlashcard[]): void {
  setData(userId, 'flashcards', flashcards);
}

// Mock test helpers
export interface LocalMCQQuestion {
  id: number;
  questionText: string;
  options: string[];
  correctOption: number;
}

export interface LocalMockTest {
  id: number;
  name: string;
  subjectId: number;
  questions: LocalMCQQuestion[];
}

export function getMockTests(userId: string): LocalMockTest[] {
  return getData<LocalMockTest[]>(userId, 'mockTests', []);
}

export function saveMockTests(userId: string, tests: LocalMockTest[]): void {
  setData(userId, 'mockTests', tests);
}

// Test attempt helpers
export interface LocalQuestionResult {
  questionId: number;
  questionText: string;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
}

export interface LocalTestReport {
  testId: number;
  testName: string;
  score: number;
  total: number;
  percentage: number;
  timeTaken: number;
  results: LocalQuestionResult[];
}

export interface LocalTestAttempt {
  id: number;
  testId: number;
  report: LocalTestReport;
  attemptedAt: number;
}

export function getTestAttempts(userId: string): LocalTestAttempt[] {
  return getData<LocalTestAttempt[]>(userId, 'testAttempts', []);
}

export function saveTestAttempts(userId: string, attempts: LocalTestAttempt[]): void {
  setData(userId, 'testAttempts', attempts);
}

// Planner task helpers
export interface LocalPlannerTask {
  id: number;
  title: string;
  description: string;
  date: number;
  startTime: string;
  completed: boolean;
}

export function getPlannerTasks(userId: string): LocalPlannerTask[] {
  return getData<LocalPlannerTask[]>(userId, 'plannerTasks', []);
}

export function savePlannerTasks(userId: string, tasks: LocalPlannerTask[]): void {
  setData(userId, 'plannerTasks', tasks);
}

// Reminder helpers — alarmSound stores the sound identifier (e.g. 'joshsound')
export interface LocalReminder {
  id: number;
  text: string;
  dateTime: number;
  alarmSound?: string;
}

export function getReminders(userId: string): LocalReminder[] {
  return getData<LocalReminder[]>(userId, 'reminders', []);
}

export function saveReminders(userId: string, reminders: LocalReminder[]): void {
  setData(userId, 'reminders', reminders);
}

// Target helpers
export interface LocalTarget {
  id: number;
  title: string;
  description: string;
  deadline: number;
  completed: boolean;
}

export function getTargets(userId: string): LocalTarget[] {
  return getData<LocalTarget[]>(userId, 'targets', []);
}

export function saveTargets(userId: string, targets: LocalTarget[]): void {
  setData(userId, 'targets', targets);
}

// Revision task helpers
export interface LocalRevisionTask {
  id: number;
  chapterId: number;
  subjectId: number;
  dueDate: number;
  completed: boolean;
  revisionNumber: number;
  plannerTaskId?: number;
}

export function getRevisionTasks(userId: string): LocalRevisionTask[] {
  return getData<LocalRevisionTask[]>(userId, 'revisionTasks', []);
}

export function saveRevisionTasks(userId: string, tasks: LocalRevisionTask[]): void {
  setData(userId, 'revisionTasks', tasks);
}

// Streak helpers
export interface LocalStudyStreak {
  currentStreak: number;
  lastActiveDate: number;
  topStreak: number;
}

export function getStudyStreak(userId: string): LocalStudyStreak {
  return getData<LocalStudyStreak>(userId, 'streak', { currentStreak: 0, lastActiveDate: 0, topStreak: 0 });
}

export function saveStudyStreak(userId: string, streak: LocalStudyStreak): void {
  setData(userId, 'streak', streak);
}

// Achievement helpers
export interface LocalAchievement {
  id: number;
  achievementType: string;
  achievedAt: number;
}

export function getAchievements(userId: string): LocalAchievement[] {
  return getData<LocalAchievement[]>(userId, 'achievements', []);
}

export function saveAchievements(userId: string, achievements: LocalAchievement[]): void {
  setData(userId, 'achievements', achievements);
}

// ID counter helpers
export function getNextId(userId: string, counterName: string): number {
  const key = `bs_${userId}_counter_${counterName}`;
  const storage = userId === 'guest' ? sessionStorage : localStorage;
  const current = parseInt(storage.getItem(key) || '0', 10);
  const next = current + 1;
  storage.setItem(key, next.toString());
  return next;
}

// Update streak helper
export function updateStreak(userId: string): LocalStudyStreak {
  const now = Date.now();
  const oneDayMs = 86400000;
  const todayTs = Math.floor(now / oneDayMs) * oneDayMs;
  const streak = getStudyStreak(userId);
  const lastDay = Math.floor(streak.lastActiveDate / oneDayMs) * oneDayMs;

  if (lastDay === todayTs) return streak;

  const yesterday = todayTs - oneDayMs;
  const newStreak = lastDay === yesterday ? streak.currentStreak + 1 : 1;
  const newTop = Math.max(newStreak, streak.topStreak);
  const newStreakData: LocalStudyStreak = { currentStreak: newStreak, lastActiveDate: now, topStreak: newTop };
  saveStudyStreak(userId, newStreakData);

  // Award milestone achievements
  const milestones = [3, 7, 30];
  const achievements = getAchievements(userId);
  let updated = [...achievements];
  for (const m of milestones) {
    if (newStreak === m) {
      const aType = `${m}-day-streak`;
      if (!achievements.find(a => a.achievementType === aType)) {
        updated.push({ id: getNextId(userId, 'achievement'), achievementType: aType, achievedAt: now });
      }
    }
  }
  saveAchievements(userId, updated);
  return newStreakData;
}

// Schedule revision tasks when chapter is completed
export function scheduleRevisionTasks(userId: string, chapterId: number, subjectId: number): void {
  const now = Date.now();
  const intervals = [1, 3, 7, 21];
  const revisionTasks = getRevisionTasks(userId);
  const plannerTasks = getPlannerTasks(userId);
  let revNum = 0;

  for (const days of intervals) {
    revNum++;
    const dueDate = now + days * 86400000;
    const plannerTaskId = getNextId(userId, 'plannerTask');
    const plannerTask: LocalPlannerTask = {
      id: plannerTaskId,
      title: `Revision #${revNum}`,
      description: 'Spaced repetition revision for chapter',
      date: dueDate,
      startTime: '09:00',
      completed: false,
    };
    plannerTasks.push(plannerTask);

    const revisionId = getNextId(userId, 'revision');
    revisionTasks.push({
      id: revisionId,
      chapterId,
      subjectId,
      dueDate,
      completed: false,
      revisionNumber: revNum,
      plannerTaskId,
    });
  }

  savePlannerTasks(userId, plannerTasks);
  saveRevisionTasks(userId, revisionTasks);
}

// Default subjects for new users
export const DEFAULT_SUBJECTS: Omit<LocalSubject, 'id'>[] = [
  { name: 'Mathematics' },
  { name: 'English' },
  { name: 'Science' },
  { name: 'Social Science (SST)' },
  { name: 'Sanskrit' },
  { name: 'Information Technology (IT)' },
];

export function initializeUserData(userId: string): void {
  const existing = getSubjects(userId);
  if (existing.length === 0) {
    const subjects: LocalSubject[] = DEFAULT_SUBJECTS.map((s, i) => ({ id: i + 1, name: s.name }));
    saveSubjects(userId, subjects);
    // Set counter to 6
    const storage = userId === 'guest' ? sessionStorage : localStorage;
    storage.setItem(`bs_${userId}_counter_subject`, '6');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PARENT PORTAL
// ─────────────────────────────────────────────────────────────────────────────

export interface StoredParentAccount {
  parentUsername: string;
  passwordHash: string; // hash of child's password used as parent credential
  childUsername: string;
}

export interface ParentSession {
  parentUsername: string;
  childUsername: string;
}

// Parent account storage
function getAllParentAccounts(): Record<string, StoredParentAccount> {
  try {
    const raw = localStorage.getItem('bs_parent_accounts');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllParentAccounts(accounts: Record<string, StoredParentAccount>): void {
  localStorage.setItem('bs_parent_accounts', JSON.stringify(accounts));
}

export function getParentAccount(parentUsername: string): StoredParentAccount | null {
  const accounts = getAllParentAccounts();
  return accounts[parentUsername] || null;
}

/**
 * Create a parent account linked to a child's account.
 * Validates that the child account exists and the provided password matches.
 */
export function createParentAccount(
  parentUsername: string,
  childUsername: string,
  childPassword: string
): void {
  // Validate parent username not already taken
  if (getParentAccount(parentUsername)) {
    throw new Error('Parent username already taken. Please choose another.');
  }

  // Validate child account exists
  const childAccount = getUserAccount(childUsername);
  if (!childAccount) {
    throw new Error(`No student account found with username "${childUsername}". Ask your child to register first.`);
  }

  // Validate child password
  if (childAccount.passwordHash !== simpleHash(childPassword)) {
    throw new Error("Child's password is incorrect. Please ask your child for their password.");
  }

  const parentAccount: StoredParentAccount = {
    parentUsername,
    passwordHash: simpleHash(childPassword),
    childUsername,
  };

  const accounts = getAllParentAccounts();
  accounts[parentUsername] = parentAccount;
  saveAllParentAccounts(accounts);
}

/**
 * Authenticate a parent using their username and the child's password.
 */
export function parentLogin(parentUsername: string, childPassword: string): ParentSession {
  const parentAccount = getParentAccount(parentUsername);
  if (!parentAccount) {
    throw new Error('Parent account not found. Please create an account first.');
  }

  if (parentAccount.passwordHash !== simpleHash(childPassword)) {
    throw new Error("Incorrect password. Please enter your child's password.");
  }

  return {
    parentUsername: parentAccount.parentUsername,
    childUsername: parentAccount.childUsername,
  };
}

// Parent session management (stored in sessionStorage separately from student session)
export function getParentSession(): ParentSession | null {
  try {
    const raw = sessionStorage.getItem('bs_parentSession');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setParentSession(session: ParentSession): void {
  sessionStorage.setItem('bs_parentSession', JSON.stringify(session));
}

export function clearParentSession(): void {
  sessionStorage.removeItem('bs_parentSession');
}

/**
 * Get all child data for a parent session.
 * Looks up the child's userId from their username and returns all their data.
 */
export interface LinkedChildData {
  childAccount: StoredUserAccount;
  subjects: LocalSubject[];
  chapters: LocalChapter[];
  notes: LocalNote[];
  questions: LocalQuestion[];
  flashcards: LocalFlashcard[];
  mockTests: LocalMockTest[];
  testAttempts: LocalTestAttempt[];
  plannerTasks: LocalPlannerTask[];
  targets: LocalTarget[];
  streak: LocalStudyStreak;
  revisionTasks: LocalRevisionTask[];
}

export function getLinkedChildData(parentUsername: string): LinkedChildData | null {
  const parentAccount = getParentAccount(parentUsername);
  if (!parentAccount) return null;

  const childAccount = getUserAccount(parentAccount.childUsername);
  if (!childAccount) return null;

  const userId = childAccount.userId;

  return {
    childAccount,
    subjects: getSubjects(userId),
    chapters: getChapters(userId),
    notes: getNotes(userId),
    questions: getQuestions(userId),
    flashcards: getFlashcards(userId),
    mockTests: getMockTests(userId),
    testAttempts: getTestAttempts(userId),
    plannerTasks: getPlannerTasks(userId),
    targets: getTargets(userId),
    streak: getStudyStreak(userId),
    revisionTasks: getRevisionTasks(userId),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType = 'scold' | 'comment' | 'appreciate';

export interface LocalNotification {
  id: number;
  from: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  read: boolean;
}

function getNotificationsKey(username: string): string {
  return `bs_notifications_${username}`;
}

export function getNotifications(username: string): LocalNotification[] {
  try {
    const raw = localStorage.getItem(getNotificationsKey(username));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addNotification(username: string, notification: LocalNotification): void {
  const notifications = getNotifications(username);
  notifications.push(notification);
  localStorage.setItem(getNotificationsKey(username), JSON.stringify(notifications));
}

export function markNotificationRead(username: string, notificationId: number): void {
  const notifications = getNotifications(username);
  const updated = notifications.map(n =>
    n.id === notificationId ? { ...n, read: true } : n
  );
  localStorage.setItem(getNotificationsKey(username), JSON.stringify(updated));
}

export function getUnreadNotificationCount(username: string): number {
  return getNotifications(username).filter(n => !n.read).length;
}
