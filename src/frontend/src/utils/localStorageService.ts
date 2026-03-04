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
  return `user_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

// Account management
export function saveUserAccount(account: StoredUserAccount): void {
  const accounts = getAllAccounts();
  accounts[account.username] = account;
  localStorage.setItem("bs_accounts", JSON.stringify(accounts));
}

export function getAllAccounts(): Record<string, StoredUserAccount> {
  try {
    const raw = localStorage.getItem("bs_accounts");
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
  return Object.values(accounts).find((a) => a.userId === userId) || null;
}

export function validateCredentials(
  username: string,
  password: string,
): StoredUserAccount | null {
  const account = getUserAccount(username);
  if (!account) return null;
  if (account.passwordHash !== simpleHash(password)) return null;
  return account;
}

export function findAccountsBySchool(schoolName: string): StoredUserAccount[] {
  const accounts = getAllAccounts();
  return Object.values(accounts).filter(
    (a) => a.school.toLowerCase().trim() === schoolName.toLowerCase().trim(),
  );
}

export function updateUserPassword(
  username: string,
  newPassword: string,
): boolean {
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
  return sessionStorage.getItem("bs_currentUserId");
}

export function setCurrentUserId(userId: string): void {
  sessionStorage.setItem("bs_currentUserId", userId);
}

export function clearCurrentSession(): void {
  sessionStorage.removeItem("bs_currentUserId");
}

export function isGuest(): boolean {
  return getCurrentUserId() === "guest";
}

export function isAuthenticated(): boolean {
  const id = getCurrentUserId();
  return !!id && id !== "guest";
}

// Alias for compatibility
export function getStoredAuth(): StoredUserAccount | null {
  const userId = getCurrentUserId();
  if (!userId || userId === "guest") return null;
  return getUserAccountById(userId);
}

// Storage key helpers
export function getUserDataKey(userId: string, dataType: string): string {
  if (userId === "guest") {
    return `bs_guest_${dataType}`;
  }
  return `bs_${userId}_${dataType}`;
}

function getStorage(userId: string): Storage {
  if (userId === "guest") return sessionStorage;
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
  return getData<LocalSubject[]>(userId, "subjects", []);
}

export function saveSubjects(userId: string, subjects: LocalSubject[]): void {
  setData(userId, "subjects", subjects);
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
  return getData<LocalChapter[]>(userId, "chapters", []);
}

export function saveChapters(userId: string, chapters: LocalChapter[]): void {
  setData(userId, "chapters", chapters);
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
  return getData<LocalNote[]>(userId, "notes", []);
}

export function saveNotes(userId: string, notes: LocalNote[]): void {
  setData(userId, "notes", notes);
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
  return getData<LocalQuestion[]>(userId, "questions", []);
}

export function saveQuestions(
  userId: string,
  questions: LocalQuestion[],
): void {
  setData(userId, "questions", questions);
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
  return getData<LocalFlashcard[]>(userId, "flashcards", []);
}

export function saveFlashcards(
  userId: string,
  flashcards: LocalFlashcard[],
): void {
  setData(userId, "flashcards", flashcards);
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
  return getData<LocalMockTest[]>(userId, "mockTests", []);
}

export function saveMockTests(userId: string, tests: LocalMockTest[]): void {
  setData(userId, "mockTests", tests);
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
  return getData<LocalTestAttempt[]>(userId, "testAttempts", []);
}

export function saveTestAttempts(
  userId: string,
  attempts: LocalTestAttempt[],
): void {
  setData(userId, "testAttempts", attempts);
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
  return getData<LocalPlannerTask[]>(userId, "plannerTasks", []);
}

export function savePlannerTasks(
  userId: string,
  tasks: LocalPlannerTask[],
): void {
  setData(userId, "plannerTasks", tasks);
}

// Reminder helpers
export interface LocalReminder {
  id: number;
  text: string;
  dateTime: number;
  alarmSound?: string;
}

export function getReminders(userId: string): LocalReminder[] {
  return getData<LocalReminder[]>(userId, "reminders", []);
}

export function saveReminders(
  userId: string,
  reminders: LocalReminder[],
): void {
  setData(userId, "reminders", reminders);
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
  return getData<LocalTarget[]>(userId, "targets", []);
}

export function saveTargets(userId: string, targets: LocalTarget[]): void {
  setData(userId, "targets", targets);
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
  return getData<LocalRevisionTask[]>(userId, "revisionTasks", []);
}

export function saveRevisionTasks(
  userId: string,
  tasks: LocalRevisionTask[],
): void {
  setData(userId, "revisionTasks", tasks);
}

// Streak helpers
export interface LocalStudyStreak {
  currentStreak: number;
  lastActiveDate: number;
  topStreak: number;
}

export function getStudyStreak(userId: string): LocalStudyStreak {
  return getData<LocalStudyStreak>(userId, "streak", {
    currentStreak: 0,
    lastActiveDate: 0,
    topStreak: 0,
  });
}

export function saveStudyStreak(
  userId: string,
  streak: LocalStudyStreak,
): void {
  setData(userId, "streak", streak);
}

// Achievement helpers
export interface LocalAchievement {
  id: number;
  achievementType: string;
  achievedAt: number;
}

export function getAchievements(userId: string): LocalAchievement[] {
  return getData<LocalAchievement[]>(userId, "achievements", []);
}

export function saveAchievements(
  userId: string,
  achievements: LocalAchievement[],
): void {
  setData(userId, "achievements", achievements);
}

// ID counter helpers
export function getNextId(userId: string, counterName: string): number {
  const key = `bs_${userId}_counter_${counterName}`;
  const storage = userId === "guest" ? sessionStorage : localStorage;
  const current = Number.parseInt(storage.getItem(key) || "0", 10);
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
  const newStreakData: LocalStudyStreak = {
    currentStreak: newStreak,
    lastActiveDate: now,
    topStreak: newTop,
  };
  saveStudyStreak(userId, newStreakData);

  const milestones = [3, 7, 30];
  const achievements = getAchievements(userId);
  let updated = [...achievements];
  for (const m of milestones) {
    if (newStreak === m) {
      const aType = `${m}-day-streak`;
      if (!achievements.find((a) => a.achievementType === aType)) {
        updated.push({
          id: getNextId(userId, "achievement"),
          achievementType: aType,
          achievedAt: now,
        });
      }
    }
  }
  saveAchievements(userId, updated);
  return newStreakData;
}

// Schedule revision tasks when chapter is completed
export function scheduleRevisionTasks(
  userId: string,
  chapterId: number,
  subjectId: number,
): void {
  const now = Date.now();
  const intervals = [1, 3, 7, 21];
  const revisionTasks = getRevisionTasks(userId);
  const plannerTasks = getPlannerTasks(userId);
  let revNum = 0;

  for (const days of intervals) {
    revNum++;
    const dueDate = now + days * 86400000;
    const plannerTaskId = getNextId(userId, "plannerTask");
    const plannerTask: LocalPlannerTask = {
      id: plannerTaskId,
      title: `Revision #${revNum}`,
      description: "Spaced repetition revision for chapter",
      date: dueDate,
      startTime: "09:00",
      completed: false,
    };
    plannerTasks.push(plannerTask);

    const revisionId = getNextId(userId, "revision");
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
export const DEFAULT_SUBJECTS: Omit<LocalSubject, "id">[] = [
  { name: "Mathematics" },
  { name: "English" },
  { name: "Science" },
  { name: "Social Science (SST)" },
  { name: "Sanskrit" },
  { name: "Information Technology (IT)" },
];

export function initializeUserData(userId: string): void {
  const existing = getSubjects(userId);
  if (existing.length === 0) {
    const subjects: LocalSubject[] = DEFAULT_SUBJECTS.map((s, i) => ({
      id: i + 1,
      name: s.name,
    }));
    saveSubjects(userId, subjects);
    const storage = userId === "guest" ? sessionStorage : localStorage;
    storage.setItem(`bs_${userId}_counter_subject`, "6");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PARENT PORTAL
// ─────────────────────────────────────────────────────────────────────────────

export interface StoredParentAccount {
  parentUsername: string;
  passwordHash: string;
  childUsername: string;
  parentName: string;
}

export interface ParentSession {
  parentUsername: string;
  childUsername: string;
  parentName: string;
}

function getAllParentAccounts(): Record<string, StoredParentAccount> {
  try {
    const raw = localStorage.getItem("bs_parent_accounts");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllParentAccounts(
  accounts: Record<string, StoredParentAccount>,
): void {
  localStorage.setItem("bs_parent_accounts", JSON.stringify(accounts));
}

export function getParentAccount(
  parentUsername: string,
): StoredParentAccount | null {
  const accounts = getAllParentAccounts();
  return accounts[parentUsername] || null;
}

// Save a parent account directly (used for cross-device sync from backend)
export function saveParentAccountDirect(account: StoredParentAccount): void {
  const accounts = getAllParentAccounts();
  accounts[account.parentUsername] = account;
  saveAllParentAccounts(accounts);
}

export function createParentAccount(
  parentUsername: string,
  childUsername: string,
  childPassword: string,
): void {
  if (getParentAccount(parentUsername)) {
    throw new Error("Parent username already taken. Please choose another.");
  }
  const childAccount = getUserAccount(childUsername);
  if (!childAccount) {
    throw new Error(
      `No student account found with username "${childUsername}". Ask your child to register first.`,
    );
  }
  if (childAccount.passwordHash !== simpleHash(childPassword)) {
    throw new Error(
      "Child's password is incorrect. Please ask your child for their password.",
    );
  }
  const parentAccount: StoredParentAccount = {
    parentUsername,
    passwordHash: simpleHash(childPassword),
    childUsername,
    parentName: parentUsername,
  };
  const accounts = getAllParentAccounts();
  accounts[parentUsername] = parentAccount;
  saveAllParentAccounts(accounts);
}

export function parentLogin(
  parentUsername: string,
  childPassword: string,
): ParentSession {
  const parentAccount = getParentAccount(parentUsername);
  if (!parentAccount) {
    throw new Error(
      "Parent account not found. Please create an account first.",
    );
  }
  if (parentAccount.passwordHash !== simpleHash(childPassword)) {
    throw new Error("Incorrect password. Please enter your child's password.");
  }
  return {
    parentUsername: parentAccount.parentUsername,
    childUsername: parentAccount.childUsername,
    parentName: parentAccount.parentName,
  };
}

export function getParentSession(): ParentSession | null {
  try {
    const raw = sessionStorage.getItem("bs_parentSession");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setParentSession(session: ParentSession): void {
  sessionStorage.setItem("bs_parentSession", JSON.stringify(session));
}

export function clearParentSession(): void {
  sessionStorage.removeItem("bs_parentSession");
}

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

export function getLinkedChildData(
  parentUsername: string,
): LinkedChildData | null {
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
// NOTIFICATIONS (legacy popover system)
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType = "scold" | "comment" | "appreciate";

export interface LocalNotification {
  id: number;
  from: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  read: boolean;
}

const NOTIF_KEY_PREFIX = "bs_notif_";

export function getNotifications(childUsername: string): LocalNotification[] {
  try {
    const raw = localStorage.getItem(NOTIF_KEY_PREFIX + childUsername);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotifications(
  childUsername: string,
  notifications: LocalNotification[],
): void {
  localStorage.setItem(
    NOTIF_KEY_PREFIX + childUsername,
    JSON.stringify(notifications),
  );
}

export function addNotification(
  childUsername: string,
  notification: Omit<LocalNotification, "id" | "read">,
): void {
  const notifications = getNotifications(childUsername);
  const id = Date.now();
  notifications.unshift({ ...notification, id, read: false });
  saveNotifications(childUsername, notifications.slice(0, 50));
}

export function markNotificationRead(
  childUsername: string,
  notifId: number,
): void {
  const notifications = getNotifications(childUsername);
  const updated = notifications.map((n) =>
    n.id === notifId ? { ...n, read: true } : n,
  );
  saveNotifications(childUsername, updated);
}

export function markAllNotificationsRead(childUsername: string): void {
  const notifications = getNotifications(childUsername);
  const updated = notifications.map((n) => ({ ...n, read: true }));
  saveNotifications(childUsername, updated);
}

export function getUnreadCount(childUsername: string): number {
  return getNotifications(childUsername).filter((n) => !n.read).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARENT-CHILD MESSAGING (new system)
// ─────────────────────────────────────────────────────────────────────────────

export interface ParentMessage {
  id: string;
  fromParent: string;
  parentName: string;
  childUsername: string;
  message: string;
  type: "comment" | "scold" | "appreciation";
  timestamp: number;
  read: boolean;
  reply?: string;
  repliedAt?: number;
}

const CHILD_MESSAGES_KEY = "bs_child_messages";

export function getChildMessages(childUsername: string): ParentMessage[] {
  try {
    const raw = localStorage.getItem(CHILD_MESSAGES_KEY);
    const all: ParentMessage[] = raw ? JSON.parse(raw) : [];
    return all.filter((m) => m.childUsername === childUsername);
  } catch {
    return [];
  }
}

export function saveParentMessage(
  childUsername: string,
  msg: {
    fromParent: string;
    message: string;
    type: "comment" | "scold" | "appreciation";
  },
): void {
  try {
    const raw = localStorage.getItem(CHILD_MESSAGES_KEY);
    const all: ParentMessage[] = raw ? JSON.parse(raw) : [];
    const newMsg: ParentMessage = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      fromParent: msg.fromParent,
      parentName: msg.fromParent,
      childUsername,
      message: msg.message,
      type: msg.type,
      timestamp: Date.now(),
      read: false,
    };
    all.push(newMsg);
    localStorage.setItem(CHILD_MESSAGES_KEY, JSON.stringify(all));
  } catch (e) {
    console.error("Failed to save parent message:", e);
  }
}

export function markMessageAsRead(messageId: string): void {
  try {
    const raw = localStorage.getItem(CHILD_MESSAGES_KEY);
    const all: ParentMessage[] = raw ? JSON.parse(raw) : [];
    const updated = all.map((m) =>
      m.id === messageId ? { ...m, read: true } : m,
    );
    localStorage.setItem(CHILD_MESSAGES_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function updateMessageReply(messageId: string, reply: string): void {
  try {
    const raw = localStorage.getItem(CHILD_MESSAGES_KEY);
    const all: ParentMessage[] = raw ? JSON.parse(raw) : [];
    const updated = all.map((m) =>
      m.id === messageId ? { ...m, reply, repliedAt: Date.now() } : m,
    );
    localStorage.setItem(CHILD_MESSAGES_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PARENT REPLY INBOX
// ─────────────────────────────────────────────────────────────────────────────

export interface ParentReply {
  id: string;
  fromChild: string;
  toParent: string;
  originalMessageId: string;
  originalMessage: string;
  replyText: string;
  repliedAt: number;
  seen: boolean;
}

const PARENT_REPLIES_KEY = "bs_parent_replies";

export function getParentReplies(parentUsername: string): ParentReply[] {
  try {
    const raw = localStorage.getItem(PARENT_REPLIES_KEY);
    const all: ParentReply[] = raw ? JSON.parse(raw) : [];
    return all.filter((r) => r.toParent === parentUsername);
  } catch {
    return [];
  }
}

export function saveChildReplyToParent(
  toParent: string,
  reply: Omit<ParentReply, "toParent" | "seen">,
): void {
  try {
    const raw = localStorage.getItem(PARENT_REPLIES_KEY);
    const all: ParentReply[] = raw ? JSON.parse(raw) : [];
    const existing = all.findIndex((r) => r.id === reply.id);
    const newReply: ParentReply = { ...reply, toParent, seen: false };
    if (existing >= 0) {
      all[existing] = newReply;
    } else {
      all.push(newReply);
    }
    localStorage.setItem(PARENT_REPLIES_KEY, JSON.stringify(all));
  } catch (e) {
    console.error("Failed to save child reply:", e);
  }
}

export function markParentReplyAsSeen(replyId: string): void {
  try {
    const raw = localStorage.getItem(PARENT_REPLIES_KEY);
    const all: ParentReply[] = raw ? JSON.parse(raw) : [];
    const updated = all.map((r) =>
      r.id === replyId ? { ...r, seen: true } : r,
    );
    localStorage.setItem(PARENT_REPLIES_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMERS
// ─────────────────────────────────────────────────────────────────────────────

export interface TimerData {
  id: string;
  label: string;
  startMonth: number;
  startDay: number;
  endYear: number;
  endMonth: number;
  endDay: number;
  createdAt: number;
}

function getTimersKey(userId: string): string {
  return `bs_${userId}_timers`;
}

export function getTimers(userId: string): TimerData[] {
  try {
    const raw = localStorage.getItem(getTimersKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addTimer(
  userId: string,
  timer: Omit<TimerData, "id" | "createdAt">,
): TimerData {
  const timers = getTimers(userId);
  const newTimer: TimerData = {
    ...timer,
    id: `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
  };
  timers.push(newTimer);
  localStorage.setItem(getTimersKey(userId), JSON.stringify(timers));
  return newTimer;
}

export function deleteTimer(userId: string, timerId: string): void {
  const timers = getTimers(userId);
  const updated = timers.filter((t) => t.id !== timerId);
  localStorage.setItem(getTimersKey(userId), JSON.stringify(updated));
}
