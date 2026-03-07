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

export type SyncStatus = "synced" | "pending" | "pulling" | "offline";

interface SyncQueueItem {
  username: string;
  dataType: string;
  data: string;
  timestamp: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYNC_QUEUE_KEY = "bs_sync_queue";
const LAST_SYNC_KEY = "bs_last_sync";

// ─── Pulling state (set during login data pull) ───────────────────────────────
let _isPulling = false;

export function setIsPulling(v: boolean): void {
  _isPulling = v;
  try {
    window.dispatchEvent(new CustomEvent("bs:sync-status-changed"));
  } catch {
    // ignore
  }
}

export function getIsPulling(): boolean {
  return _isPulling;
}

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
 * Strips the userId prefix to get the plain identifier for canister calls.
 *
 * - "principal_<principalText>" → "<principalText>"  (Internet Identity)
 * - "user_<username>"           → "<username>"         (legacy username/password)
 * - anything else               → returned as-is
 */
function toUsername(userId: string): string {
  if (userId.startsWith("principal_")) {
    return userId.slice(10); // strip "principal_" → plain Principal text
  }
  if (userId.startsWith("user_")) {
    return userId.slice(5); // strip "user_" → plain username
  }
  return userId;
}

/**
 * Returns the localStorage key for a given (stripped) identifier and dataType.
 *
 * Key format mirrors getUserDataKey(userId, dataType) = "bs_" + userId + "_" + dataType:
 *   - II users:     username = principalText  → "bs_principal_<principalText>_<dataType>"
 *   - Legacy users: username = plain username → "bs_user_<username>_<dataType>"
 *
 * Principal IDs always contain dashes (e.g. "2vxsx-fae"), usernames don't.
 */
function localKey(username: string, dataType: string): string {
  // If the identifier looks like a Principal ID (contains dashes), it came from II
  if (username.includes("-")) {
    return `bs_principal_${username}_${dataType}`;
  }
  // Legacy username format
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
 * into localStorage. Remote (canister) data is always treated as source of truth
 * during login sync — this ensures a fresh device always gets the real profile.
 */
export async function pullAllData(
  username: string,
  actor: backendInterface,
): Promise<void> {
  if (!username || !actor) return;

  setIsPulling(true);
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
          // Only skip null/undefined/empty string — empty arrays [] and objects {} ARE valid data
          if (remote !== null && remote !== undefined && remote.trim() !== "") {
            // Validate it's parseable JSON before storing
            const key = localKey(username, dataType);
            try {
              const parsed = JSON.parse(remote);
              // For arrays: prefer canister data if it has more items than local,
              // otherwise prefer canister data (it's the authoritative server).
              // Exception: if canister has [] but local has real data, keep local AND push local.
              if (Array.isArray(parsed) && parsed.length === 0) {
                const existing = localStorage.getItem(key);
                if (existing) {
                  try {
                    const existingParsed = JSON.parse(existing);
                    if (
                      Array.isArray(existingParsed) &&
                      existingParsed.length > 0
                    ) {
                      // Local has real data, canister is empty — push local to canister
                      console.info(
                        `[SyncService] Canister empty for ${dataType}, pushing local data up`,
                      );
                      actor
                        .saveUserData(username, dataType, existing)
                        .catch(() => {});
                      // Keep local data, don't overwrite with empty canister
                      return;
                    }
                  } catch {
                    // ignore parse error
                  }
                }
              }
              // Valid JSON — always overwrite local (canister is source of truth on login)
              localStorage.setItem(key, remote);
            } catch {
              // If parse fails, still store it as-is
              localStorage.setItem(key, remote);
            }
          } else {
            // Canister has no data for this type — check if we have local data to push up
            const key = localKey(username, dataType);
            const existing = localStorage.getItem(key);
            if (existing && existing.trim() !== "") {
              try {
                const parsed = JSON.parse(existing);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  console.info(
                    `[SyncService] Canister missing ${dataType}, pushing local data up`,
                  );
                  actor
                    .saveUserData(username, dataType, existing)
                    .catch(() => {});
                }
              } catch {
                // ignore
              }
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
  } finally {
    setIsPulling(false);
  }
}

/**
 * Pushes ALL local data types for a given username to the canister immediately.
 * Used at registration and manual sync — ensures canister has the latest copy
 * so other devices can pull it on login.
 *
 * @param username  plain username (no "user_" prefix)
 * @param userId    localStorage userId ("user_<username>")
 * @param actor     backend actor
 */
export async function pushAllLocalData(
  username: string,
  userId: string,
  actor: backendInterface,
): Promise<void> {
  if (!username || !userId || !actor) return;

  const results = await Promise.allSettled(
    SYNC_DATA_TYPES.map(async (dataType) => {
      try {
        const key = localKey(username, dataType);
        const raw = localStorage.getItem(key);
        if (raw !== null && raw !== undefined) {
          // Push even empty arrays/objects — they represent valid state
          await actor.saveUserData(username, dataType, raw);
        }
      } catch (e) {
        console.warn(`[SyncService] Failed to push ${dataType}:`, e);
      }
    }),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  console.info(
    `[SyncService] Pushed ${succeeded}/${SYNC_DATA_TYPES.length} data types for "${username}"`,
  );
  localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
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
 * Removes queue items older than 1 hour — they are stale and will never succeed.
 * Called on startup to prevent the "Syncing…" indicator from being stuck forever.
 */
export function pruneStaleQueue(): void {
  const queue = getQueue();
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const fresh = queue.filter((item) => item.timestamp > oneHourAgo);
  if (fresh.length !== queue.length) {
    saveQueue(fresh);
    console.info(
      `[SyncService] Pruned ${queue.length - fresh.length} stale sync queue items`,
    );
  }
}

/**
 * Returns the current sync status.
 */
export function getSyncStatus(): SyncStatus {
  if (!navigator.onLine) return "offline";
  if (_isPulling) return "pulling";
  const queue = getQueue();
  if (queue.length > 0) return "pending";
  return "synced";
}

/**
 * Listens for bs:data-changed events dispatched by localStorageService,
 * and schedules a sync for the changed data type.
 */
let _globalActor: backendInterface | null = null;
let _listenerRegistered = false;

export function setGlobalActor(actor: backendInterface | null): void {
  _globalActor = actor;
}

export function initDataChangeListener(): void {
  // Guard against duplicate listener registration on re-mounts
  if (_listenerRegistered) return;
  _listenerRegistered = true;

  window.addEventListener("bs:data-changed", ((
    e: CustomEvent<{ userId: string; dataType: string; data: string }>,
  ) => {
    const { userId, dataType, data } = e.detail;
    scheduleSync(userId, dataType, data, _globalActor);
  }) as EventListener);
}
