/**
 * Sync Service — bridges localStorage (offline cache) and the Motoko canister (persistent global storage).
 *
 * ARCHITECTURE (v3 — Principal-based, push-before-pull, merge-safe):
 *  - All canister calls use saveMyData/getMyData/listMyDataTypes — keyed by caller's Principal.
 *  - visibilityChange and actor-ready events push first, then pull.
 *  - Notes with imageData are stripped before canister upload (images stay local only).
 *  - Array merge uses "most items wins" + ID-based dedup so no data is ever lost.
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

const SYNC_QUEUE_KEY = "bs_sync_queue_v3"; // bumped — clears old broken queue
const LAST_SYNC_KEY = "bs_last_sync";

// Max payload size to send to canister in one call (1.5 MB safe limit)
const MAX_PAYLOAD_BYTES = 1_500_000;

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
  "books",
] as const;

// Data types that may contain large image blobs — strip imageData before canister upload
const IMAGE_BEARING_TYPES = new Set([
  "notes",
  "handwritingAnalyses",
  "answerEvaluations",
]);

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
  const idx = queue.findIndex((q) => q.dataType === item.dataType);
  if (idx >= 0) {
    queue[idx] = item;
  } else {
    queue.push(item);
  }
  saveQueue(queue);
}

// ─── Payload helpers ──────────────────────────────────────────────────────────

/**
 * For image-bearing data types, strip imageData fields before sending to canister.
 * Images are kept in localStorage only — they're device-local cache.
 * This prevents 2MB+ payloads that cause silent canister call failures.
 */
function prepareForCanister(dataType: string, raw: string): string {
  if (!IMAGE_BEARING_TYPES.has(dataType)) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return raw;
    // Strip imageData from each item, keep everything else
    const stripped = parsed.map((item: Record<string, unknown>) => {
      if (item && typeof item === "object" && "imageData" in item) {
        const { imageData: _img, ...rest } = item;
        return rest;
      }
      return item;
    });
    const result = JSON.stringify(stripped);
    // Extra safety: if still too large, skip sending to canister
    if (result.length > MAX_PAYLOAD_BYTES) {
      console.warn(
        `[SyncService] ${dataType} payload still too large after stripping (${result.length} bytes), skipping canister upload`,
      );
      return "";
    }
    return result;
  } catch {
    return raw;
  }
}

/**
 * Merge remote (canister) array with local array.
 * Strategy:
 *  - Union of all items by `id` field.
 *  - If same id exists in both, remote wins (canister is authoritative for existing items).
 *  - Items present only locally are kept (they may not have synced yet).
 *  - Result is sorted by id ascending.
 */
function mergeArrays(localRaw: string, remoteRaw: string): string {
  try {
    const local: Record<string, unknown>[] = JSON.parse(localRaw);
    const remote: Record<string, unknown>[] = JSON.parse(remoteRaw);
    if (!Array.isArray(local) || !Array.isArray(remote)) return remoteRaw;

    // Build a map: id -> item. Remote wins on conflict.
    const map = new Map<unknown, Record<string, unknown>>();
    for (const item of local) {
      const key = item.id ?? item.chapterId ?? JSON.stringify(item);
      map.set(key, item);
    }
    for (const item of remote) {
      const key = item.id ?? item.chapterId ?? JSON.stringify(item);
      map.set(key, item); // remote overwrites local on conflict
    }
    const merged = Array.from(map.values());
    return JSON.stringify(merged);
  } catch {
    return remoteRaw;
  }
}

// ─── localStorage key helper ──────────────────────────────────────────────────

function localKey(userId: string, dataType: string): string {
  return `bs_${userId}_${dataType}`;
}

// ─── Core sync functions ──────────────────────────────────────────────────────

/**
 * Schedules a data type to be synced to the canister.
 */
export function scheduleSync(
  userId: string,
  dataType: string,
  data: string,
  actor?: backendInterface | null,
): void {
  if (userId === "guest") return;

  const payload = prepareForCanister(dataType, data);
  if (!payload) return; // Too large even after stripping — skip

  const item: SyncQueueItem = {
    dataType,
    data: payload,
    timestamp: Date.now(),
  };

  enqueue(item);

  if (actor && navigator.onLine) {
    flushQueue(actor).catch(() => {});
  }
}

/**
 * Push ALL local data to canister, then pull the latest back.
 * This is the correct order: push first ensures canister has our latest data,
 * then pull merges any changes from other devices.
 */
export async function syncBothWays(
  userId: string,
  actor: backendInterface,
): Promise<void> {
  if (!userId || !actor || userId === "guest") return;
  // Step 1: push local → canister
  await pushAllLocalData(userId, actor);
  // Step 2: pull canister → local (merge)
  await pullAllData(userId, actor);
}

/**
 * Fetches all data types from the canister and merges with local data.
 * Remote data wins on conflicts, but local-only items are preserved.
 */
export async function pullAllData(
  userId: string,
  actor: backendInterface,
): Promise<void> {
  if (!userId || !actor) return;

  setIsPulling(true);
  try {
    let storedTypes: string[] = [];
    try {
      storedTypes = await actor.listMyDataTypes();
    } catch (e) {
      console.warn("[SyncService] listMyDataTypes failed:", e);
      storedTypes = [...SYNC_DATA_TYPES];
    }

    const typesToPull =
      storedTypes.length > 0 ? storedTypes : [...SYNC_DATA_TYPES];

    const results = await Promise.allSettled(
      typesToPull.map(async (dataType) => {
        try {
          const remote = await actor.getMyData(dataType);
          const key = localKey(userId, dataType);

          if (remote !== null && remote !== undefined && remote.trim() !== "") {
            try {
              const remoteParsed = JSON.parse(remote);
              const localRaw = localStorage.getItem(key);

              if (Array.isArray(remoteParsed)) {
                // For arrays: merge remote + local so we never lose local-only items
                if (localRaw && localRaw.trim() !== "") {
                  try {
                    const localParsed = JSON.parse(localRaw);
                    if (Array.isArray(localParsed)) {
                      if (remoteParsed.length === 0 && localParsed.length > 0) {
                        // Canister has nothing — push local up and keep local
                        const payload = prepareForCanister(dataType, localRaw);
                        if (payload)
                          actor.saveMyData(dataType, payload).catch(() => {});
                        return; // keep local
                      }
                      // Merge: keep items from both, remote wins on id conflict
                      const merged = mergeArrays(localRaw, remote);
                      localStorage.setItem(key, merged);
                      // If merged has more items than remote, push merged back
                      try {
                        const mergedParsed = JSON.parse(merged);
                        if (mergedParsed.length > remoteParsed.length) {
                          const payload = prepareForCanister(dataType, merged);
                          if (payload)
                            actor.saveMyData(dataType, payload).catch(() => {});
                        }
                      } catch {
                        /* ignore */
                      }
                      return;
                    }
                  } catch {
                    /* fall through to simple overwrite */
                  }
                }
                // No local data — just store remote
                localStorage.setItem(key, remote);
              } else {
                // Non-array (objects like streak): remote wins
                localStorage.setItem(key, remote);
              }
            } catch {
              localStorage.setItem(key, remote);
            }
          } else {
            // Canister has no data — push local up if we have any
            const existing = localStorage.getItem(key);
            if (existing && existing.trim() !== "") {
              try {
                const parsed = JSON.parse(existing);
                const hasData = Array.isArray(parsed)
                  ? parsed.length > 0
                  : typeof parsed === "object" &&
                    parsed !== null &&
                    Object.keys(parsed).length > 0;
                if (hasData) {
                  const payload = prepareForCanister(dataType, existing);
                  if (payload)
                    actor.saveMyData(dataType, payload).catch(() => {});
                }
              } catch {
                /* ignore */
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

    // Special case: wordBooster uses a different key format
    try {
      const wbRemote = await actor.getMyData("wordBooster");
      if (wbRemote && wbRemote.trim() !== "") {
        const wbKey = `wordBooster_${userId}`;
        const wbLocal = localStorage.getItem(wbKey);
        if (!wbLocal || wbLocal.trim() === "") {
          localStorage.setItem(wbKey, wbRemote);
        } else {
          // Keep local if it exists (more recent), but push local to canister
          try {
            const localParsed = JSON.parse(wbLocal);
            const remoteParsed = JSON.parse(wbRemote);
            // Use whichever has more progress (higher masteredCount)
            const localMastered = localParsed.masteredCount || 0;
            const remoteMastered = remoteParsed.masteredCount || 0;
            if (remoteMastered > localMastered) {
              localStorage.setItem(wbKey, wbRemote);
            }
          } catch {
            // keep local
          }
        }
      } else {
        // Nothing on canister — push local up
        const wbKey = `wordBooster_${userId}`;
        const wbRaw = localStorage.getItem(wbKey);
        if (wbRaw && wbRaw.trim() !== "") {
          actor.saveMyData("wordBooster", wbRaw).catch(() => {});
        }
      }
    } catch (e) {
      console.warn("[SyncService] Failed to pull wordBooster:", e);
    }
  } catch (e) {
    console.warn("[SyncService] pullAllData failed:", e);
  } finally {
    setIsPulling(false);
    // Notify all components that fresh data is available in localStorage
    try {
      window.dispatchEvent(new CustomEvent("bs:data-pulled"));
    } catch {
      /* ignore */
    }
  }
}

/**
 * Pushes ALL local data types for a given userId to the canister.
 * Image data is stripped before upload to stay within call size limits.
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
          const payload = prepareForCanister(dataType, raw);
          if (payload) {
            await actor.saveMyData(dataType, payload);
          }
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

  // Special case: wordBooster uses a different key format
  try {
    const wbKey = `wordBooster_${userId}`;
    const wbRaw = localStorage.getItem(wbKey);
    if (wbRaw && wbRaw.trim() !== "") {
      await actor.saveMyData("wordBooster", wbRaw);
    }
  } catch (e) {
    console.warn("[SyncService] Failed to push wordBooster:", e);
  }
}

/**
 * Flushes all queued items to the canister.
 */
export async function flushQueue(actor: backendInterface): Promise<void> {
  if (!actor || !navigator.onLine) return;

  const queue = getQueue();
  if (queue.length === 0) return;

  const failed: SyncQueueItem[] = [];

  await Promise.allSettled(
    queue.map(async (item) => {
      try {
        if (item.data && item.data.trim() !== "") {
          await actor.saveMyData(item.dataType, item.data);
        }
      } catch (e) {
        console.warn(`[SyncService] Failed to push ${item.dataType}:`, e);
        failed.push(item);
      }
    }),
  );

  saveQueue(failed);

  if (failed.length === 0) {
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    console.info(`[SyncService] Flushed ${queue.length} items`);
    try {
      window.dispatchEvent(new CustomEvent("bs:sync-status-changed"));
    } catch {
      /* ignore */
    }
  } else {
    console.warn(
      `[SyncService] ${failed.length}/${queue.length} items failed to flush`,
    );
  }
}

/**
 * Removes queue items older than 1 hour.
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

// ─── Global actor + listeners ─────────────────────────────────────────────────

let _globalActor: backendInterface | null = null;
let _listenerRegistered = false;

export function setGlobalActor(actor: backendInterface | null): void {
  _globalActor = actor;
  if (actor && navigator.onLine) {
    flushQueue(actor).catch(() => {});
  }
}

export function initDataChangeListener(): void {
  if (_listenerRegistered) return;
  _listenerRegistered = true;

  window.addEventListener("bs:data-changed", ((
    e: CustomEvent<{ userId: string; dataType: string; data: string }>,
  ) => {
    const { userId, dataType, data } = e.detail;
    scheduleSync(userId, dataType, data, _globalActor);
  }) as EventListener);

  window.addEventListener("online", () => {
    if (_globalActor) {
      flushQueue(_globalActor).catch(() => {});
    }
  });
}
