// Local storage service for Board Saathi
// Provides typed helpers for persisting app data locally

export interface LocalReminder {
  id: number;
  text: string;
  dateTime: number; // ms timestamp
  alarmSound?: string;
  targetId?: number;
}

export interface LocalTarget {
  id: number;
  title: string;
  description: string;
  deadline: number; // ms timestamp
  completed: boolean;
}

export interface LocalUser {
  name: string;
  username: string;
}

// ─── Keys ────────────────────────────────────────────────────────────────────

const USER_KEY = 'board_saathi_user';
const REMINDERS_KEY = 'board_saathi_reminders';
const TARGETS_KEY = 'board_saathi_targets';

// ─── User ────────────────────────────────────────────────────────────────────

export function storeUser(user: LocalUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): LocalUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export function getReminders(): LocalReminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    return raw ? (JSON.parse(raw) as LocalReminder[]) : [];
  } catch {
    return [];
  }
}

// Alias for backward compatibility
export const getStoredReminders = getReminders;

export function saveReminders(reminders: LocalReminder[]): void {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

// ─── Targets ─────────────────────────────────────────────────────────────────

export function getTargets(): LocalTarget[] {
  try {
    const raw = localStorage.getItem(TARGETS_KEY);
    return raw ? (JSON.parse(raw) as LocalTarget[]) : [];
  } catch {
    return [];
  }
}

// Alias for backward compatibility
export const getStoredTargets = getTargets;

export function saveTargets(targets: LocalTarget[]): void {
  localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
}
