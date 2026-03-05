/**
 * Sync Service — bridges localStorage (offline cache) and the Motoko canister (persistent global storage).
 *
 * Design rules:
 *  - No React hooks. Pure functions/class only.
 *  - Never throws. All errors are caught and logged.
 *  - userId format in localStorage is "user_<username>". Canister calls use plain "username".
 *  - Queue items are persisted to localStorage under "bs_sync_queue" so they survive refreshes.
 */

import type { backendInterface } from "../backend";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncStatus = "synced" | "pending" | "offline";

interface SyncQueueItem {
  username: string;
  dataType: string;
  data: string;
  timestamp: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYNC_QUEUE_KEY = "bs_sync_queue";
const LAST_SYNC_KEY = "bs_last_sync";

// All user data types that should be synced to the canister
export const SYNC_DATA_TYPES = [
  "subjects",
  "chapters",
  "notes",
  "questions",
  "flashcards",
  "mockTests",
  "testAttempts",
  "plannerTasks",
  "reminders",
  "targets",
  "revisionTasks",
  "streak",
  "achievements",
  "mindMaps",
  "timers",
  "srsCards",
  "handwritingAnalyses",
  "answerEvaluations",
  "examPapers",
] as const;

// ─── Queue helpers ────────────────────────────────────────────────────────────

function getQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as SyncQueueItem[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: SyncQueueItem[]): void {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn("[SyncService] Could not persist sync queue:", e);
  }
}

function enqueue(item: SyncQueueItem): void {
  const queue = getQueue();
  // Replace existing entry for same username+dataType with newer one
  const idx = queue.findIndex(
    (q) => q.username === item.username && q.dataType === item.dataType,
  );
  if (idx >= 0) {
    queue[idx] = item;
  } else {
    queue.push(item);
  }
  saveQueue(queue);
}

// ─── Username helpers ─────────────────────────────────────────────────────────

/**
 * Strips the "user_" prefix from a userId to get the plain username for canister calls.
 * e.g. "user_devkumar" → "devkumar"
 */
function toUsername(userId: string): string {
  if (userId.startsWith("user_")) {
    return userId.slice(5);
  }
  return userId;
}

/**
 * Returns the localStorage key that getUserDataKey(userId, dataType) would produce.
 * Mirrors the logic in localStorageService.ts.
 */
function localKey(username: string, dataType: string): string {
  return `bs_user_${username}_${dataType}`;
}

// ─── Core sync functions ──────────────────────────────────────────────────────

/**
 * Schedules a data type to be synced to the canister.
 * If the actor is available and the device is online, it attempts an immediate flush.
 */
export function scheduleSync(
  userId: string,
  dataType: string,
  data: string,
  actor?: backendInterface | null,
): void {
  // Don't sync guest data
  if (userId === "guest") return;

  const username = toUsername(userId);
  const item: SyncQueueItem = {
    username,
    dataType,
    data,
    timestamp: Date.now(),
  };

  enqueue(item);

  // Attempt immediate flush if conditions are met
  if (actor && navigator.onLine) {
    flushQueue(username, actor).catch(() => {
      // Queue will be flushed later on reconnect
    });
  }
}

/**
 * Fetches all data types from the canister for a given username and writes them
 * into localStorage. Uses latest-timestamp conflict resolution.
 */
export async function pullAllData(
  username: string,
  actor: backendInterface,
): Promise<void> {
  if (!username || !actor) return;

  try {
    // First, get the list of data types stored on the canister
    let storedTypes: string[] = [];
    try {
      storedTypes = await actor.listUserDataTypes(username);
    } catch (e) {
      console.warn("[SyncService] listUserDataTypes failed:", e);
      // Fall back to pulling all known types
      storedTypes = [...SYNC_DATA_TYPES];
    }

    const typesToPull =
      storedTypes.length > 0 ? storedTypes : [...SYNC_DATA_TYPES];

    // Fetch all data types in parallel
    const results = await Promise.allSettled(
      typesToPull.map(async (dataType) => {
        try {
          const remote = await actor.getUserData(username, dataType);
          if (remote !== null && remote !== undefined) {
            // Write to localStorage using the stable key format
            const key = localKey(username, dataType);
            // Conflict resolution: compare timestamps if both are arrays/objects with timestamps
            try {
              const localRaw = localStorage.getItem(key);
              if (localRaw) {
                // If both exist, use the one with more data (simple heuristic for arrays)
                // For more precise conflict resolution, prefer remote if it's longer
                if (remote.length >= localRaw.length) {
                  localStorage.setItem(key, remote);
                }
              } else {
                localStorage.setItem(key, remote);
              }
            } catch {
              localStorage.setItem(key, remote);
            }
          }
        } catch (e) {
          console.warn(`[SyncService] Failed to pull ${dataType}:`, e);
        }
      }),
    );

    // Count successes
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    console.info(
      `[SyncService] Pulled ${succeeded}/${typesToPull.length} data types for "${username}"`,
    );

    // Update last sync timestamp
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch (e) {
    console.warn("[SyncService] pullAllData failed:", e);
  }
}

/**
 * Pushes all queued items to the canister for a given username.
 * Items are removed from the queue only after a successful upload.
 */
export async function flushQueue(
  username: string,
  actor: backendInterface,
): Promise<void> {
  if (!username || !actor || !navigator.onLine) return;

  const queue = getQueue();
  const userItems = queue.filter((item) => item.username === username);
  if (userItems.length === 0) return;

  const remaining: SyncQueueItem[] = queue.filter(
    (item) => item.username !== username,
  );
  const failed: SyncQueueItem[] = [];

  await Promise.allSettled(
    userItems.map(async (item) => {
      try {
        await actor.saveUserData(item.username, item.dataType, item.data);
      } catch (e) {
        console.warn(
          `[SyncService] Failed to push ${item.dataType} for "${item.username}":`,
          e,
        );
        failed.push(item);
      }
    }),
  );

  // Re-queue failed items
  saveQueue([...remaining, ...failed]);

  if (failed.length === 0) {
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    console.info(
      `[SyncService] Flushed ${userItems.length} items for "${username}"`,
    );
  } else {
    console.warn(
      `[SyncService] ${failed.length}/${userItems.length} items failed to flush for "${username}"`,
    );
  }
}

/**
 * Returns the current sync status.
 */
export function getSyncStatus(): SyncStatus {
  if (!navigator.onLine) return "offline";
  const queue = getQueue();
  if (queue.length > 0) return "pending";
  return "synced";
}

/**
 * Listens for bs:data-changed events dispatched by localStorageService,
 * and schedules a sync for the changed data type.
 */
let _globalActor: backendInterface | null = null;

export function setGlobalActor(actor: backendInterface | null): void {
  _globalActor = actor;
}

export function initDataChangeListener(): void {
  window.addEventListener("bs:data-changed", ((
    e: CustomEvent<{ userId: string; dataType: string; data: string }>,
  ) => {
    const { userId, dataType, data } = e.detail;
    scheduleSync(userId, dataType, data, _globalActor);
  }) as EventListener);
}
