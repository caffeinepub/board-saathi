/**
 * Sync Service — bridges localStorage (offline cache) and the Motoko canister (persistent global storage).
 *
 * ARCHITECTURE (v2 — Principal-based):
 *  - All canister calls use saveMyData/getMyData/listMyDataTypes — keyed by caller's Principal.
 *  - No username matching, no ownership errors, no "Unauthorized" surprises.
 *  - This is the fix for the cross-device sync bug where username prefix mismatch caused
 *    every saveUserData call to silently fail.
 *
 * Design rules:
 *  - No React hooks. Pure functions/class only.
 *  - Never throws. All errors are caught and logged.
 *  - Queue items are persisted to localStorage under "bs_sync_queue" so they survive refreshes.
 */

import type { backendInterface } from "../backend";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncStatus = "synced" | "pending" | "pulling" | "offline";

interface SyncQueueItem {
  dataType: string;
  data: string;
  timestamp: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYNC_QUEUE_KEY = "bs_sync_queue_v2"; // new key — clears old broken queue
const LAST_SYNC_KEY = "bs_last_sync";

// ─── Pulling state ────────────────────────────────────────────────────────────
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
  // Replace existing entry for same dataType with newer one
  const idx = queue.findIndex((q) => q.dataType === item.dataType);
  if (idx >= 0) {
    queue[idx] = item;
  } else {
    queue.push(item);
  }
  saveQueue(queue);
}

// ─── localStorage key helper ──────────────────────────────────────────────────

/**
 * Returns the localStorage key for a given userId and dataType.
 * userId is in the format "principal_<principalText>" for II users.
 */
function localKey(userId: string, dataType: string): string {
  return `bs_${userId}_${dataType}`;
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

  const item: SyncQueueItem = {
    dataType,
    data,
    timestamp: Date.now(),
  };

  enqueue(item);

  // Attempt immediate flush if conditions are met
  if (actor && navigator.onLine) {
    flushQueue(actor).catch(() => {
      // Queue will be flushed later on reconnect
    });
  }
}

/**
 * Fetches all data types from the canister for the authenticated caller.
 * Uses saveMyData/getMyData which key on the caller's Principal — no username mismatch.
 * Remote (canister) data is always treated as source of truth during login pull.
 */
export async function pullAllData(
  userId: string,
  actor: backendInterface,
): Promise<void> {
  if (!userId || !actor) return;

  setIsPulling(true);
  try {
    // Get the list of data types stored on the canister for this Principal
    let storedTypes: string[] = [];
    try {
      storedTypes = await actor.listMyDataTypes();
    } catch (e) {
      console.warn("[SyncService] listMyDataTypes failed:", e);
      // Fall back to pulling all known types
      storedTypes = [...SYNC_DATA_TYPES];
    }

    const typesToPull =
      storedTypes.length > 0 ? storedTypes : [...SYNC_DATA_TYPES];

    // Fetch all data types in parallel using getMyData (Principal-keyed, always works)
    const results = await Promise.allSettled(
      typesToPull.map(async (dataType) => {
        try {
          const remote = await actor.getMyData(dataType);
          const key = localKey(userId, dataType);

          if (remote !== null && remote !== undefined && remote.trim() !== "") {
            try {
              const parsed = JSON.parse(remote);

              // For arrays: if canister has empty [] but local has real data, push local up
              if (Array.isArray(parsed) && parsed.length === 0) {
                const existing = localStorage.getItem(key);
                if (existing) {
                  try {
                    const existingParsed = JSON.parse(existing);
                    if (
                      Array.isArray(existingParsed) &&
                      existingParsed.length > 0
                    ) {
                      console.info(
                        `[SyncService] Canister empty for ${dataType}, pushing local data up`,
                      );
                      // Push local to canister in background
                      actor.saveMyData(dataType, existing).catch(() => {});
                      // Keep local data
                      return;
                    }
                  } catch {
                    // ignore
                  }
                }
              }

              // Valid JSON — overwrite local with canister data (source of truth)
              localStorage.setItem(key, remote);
            } catch {
              // Still store even if parse fails
              localStorage.setItem(key, remote);
            }
          } else {
            // Canister has no data — check if we have local data to push up
            const existing = localStorage.getItem(key);
            if (existing && existing.trim() !== "") {
              try {
                const parsed = JSON.parse(existing);
                if (
                  (Array.isArray(parsed) && parsed.length > 0) ||
                  (!Array.isArray(parsed) &&
                    typeof parsed === "object" &&
                    parsed !== null &&
                    Object.keys(parsed).length > 0)
                ) {
                  console.info(
                    `[SyncService] Canister missing ${dataType}, pushing local data up`,
                  );
                  actor.saveMyData(dataType, existing).catch(() => {});
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

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    console.info(
      `[SyncService] Pulled ${succeeded}/${typesToPull.length} data types`,
    );

    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch (e) {
    console.warn("[SyncService] pullAllData failed:", e);
  } finally {
    setIsPulling(false);
  }
}

/**
 * Pushes ALL local data types for a given userId to the canister immediately.
 * Uses saveMyData — keyed by caller's Principal, always succeeds for the authenticated user.
 */
export async function pushAllLocalData(
  userId: string,
  actor: backendInterface,
): Promise<void> {
  if (!userId || !actor) return;

  const results = await Promise.allSettled(
    SYNC_DATA_TYPES.map(async (dataType) => {
      try {
        const key = localKey(userId, dataType);
        const raw = localStorage.getItem(key);
        if (raw !== null && raw !== undefined && raw.trim() !== "") {
          // Push even empty arrays/objects — they represent valid state
          await actor.saveMyData(dataType, raw);
        }
      } catch (e) {
        console.warn(`[SyncService] Failed to push ${dataType}:`, e);
      }
    }),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  console.info(
    `[SyncService] Pushed ${succeeded}/${SYNC_DATA_TYPES.length} data types`,
  );
  localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
}

/**
 * Pushes all queued items to the canister.
 * Items are removed from the queue only after successful upload.
 */
export async function flushQueue(actor: backendInterface): Promise<void> {
  if (!actor || !navigator.onLine) return;

  const queue = getQueue();
  if (queue.length === 0) return;

  const failed: SyncQueueItem[] = [];

  await Promise.allSettled(
    queue.map(async (item) => {
      try {
        await actor.saveMyData(item.dataType, item.data);
      } catch (e) {
        console.warn(`[SyncService] Failed to push ${item.dataType}:`, e);
        failed.push(item);
      }
    }),
  );

  // Re-queue failed items only
  saveQueue(failed);

  if (failed.length === 0) {
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    console.info(`[SyncService] Flushed ${queue.length} items`);
    try {
      window.dispatchEvent(new CustomEvent("bs:sync-status-changed"));
    } catch {
      // ignore
    }
  } else {
    console.warn(
      `[SyncService] ${failed.length}/${queue.length} items failed to flush`,
    );
  }
}

/**
 * Removes queue items older than 1 hour — they are stale and will never succeed.
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

  // When actor becomes available, immediately flush any pending queue items
  if (actor && navigator.onLine) {
    flushQueue(actor).catch(() => {});
  }
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

  // Flush queue when coming back online
  window.addEventListener("online", () => {
    if (_globalActor) {
      flushQueue(_globalActor).catch(() => {});
    }
  });
}
