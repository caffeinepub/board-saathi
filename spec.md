# Board Saathi

## Current State

The app uses a username+password login system. All user data (subjects, chapters, notes, mock tests, reminders, targets, flashcards, revision tasks, planner tasks, streaks, achievements, mind maps, timers, SRS cards, handwriting analyses, answer evaluations, exam papers) is stored in **localStorage only** on the current device. The Motoko backend canister only stores: student profiles, parent profiles, chat messages, and feedback (authentication data).

Cross-device access fails because localStorage is device-local. The current backend has no endpoints to store or retrieve user study data.

## Requested Changes (Diff)

### Add
- Backend Motoko endpoints to store and retrieve all user study data per username:
  - `saveUserData(username, dataType, jsonPayload)` — saves any data blob keyed by username+dataType
  - `getUserData(username, dataType)` — returns the stored data blob
  - `listUserDataKeys(username)` — lists all stored data types for a user
- These endpoints use the existing username/password auth model (no Principal required) so any device can access them with just credentials
- A `syncService.ts` utility in the frontend that:
  - On login: pulls all user data from canister and writes to localStorage
  - On every save operation: saves to localStorage AND queues a canister write
  - On reconnect (online event): flushes the queue of pending canister writes
- A `SyncStatus` indicator component shown in the app header: shows "Synced", "Syncing...", or "Offline - changes saved locally"

### Modify
- `localStorageService.ts`: every `save*` function (saveSubjects, saveChapters, saveNotes, saveMockTests, saveReminders, saveTargets, saveFlashcards, savePlannerTasks, saveRevisionTasks, saveStudyStreak, saveAchievements, saveMindMaps, saveTimers, saveSRSCards, saveHandwritingAnalyses, saveAnswerEvaluations, saveExamPapers) should also call `syncService.scheduleSync(userId, dataType, data)` after saving locally
- `LoginPage.tsx`: after successful login, call `syncService.pullAllData(username)` to download all data from canister into localStorage before navigating to dashboard
- `ProfilePage.tsx`: show a "Sync Now" button that manually triggers full sync

### Remove
- Nothing is removed. All existing localStorage logic stays as the offline cache layer.

## Implementation Plan

1. **Extend backend Motoko** — add a generic `UserDataStore` map: `Map<Text, Map<Text, Text>>` keyed by `username -> dataType -> jsonBlob`. Add three public query/update functions: `saveUserData`, `getUserData`, `listUserDataKeys`. No auth required (username is the key, keeping existing pattern). Keep all existing endpoints intact.

2. **Regenerate backend** — run `generate_motoko_code` to update the canister and produce a new `backend.d.ts`.

3. **Create `syncService.ts`** — a frontend service that:
   - Maintains a pending sync queue in localStorage (`bs_sync_queue`)
   - `scheduleSync(userId, dataType, data)`: saves item to queue, tries immediate flush if online
   - `flushQueue(actor, username)`: iterates queue, calls `actor.saveUserData()` for each item, removes from queue on success
   - `pullAllData(actor, username)`: calls `actor.getUserData()` for each known data type, writes to localStorage if newer
   - Listens to `window.online` event to auto-flush queue

4. **Update `localStorageService.ts`** — wrap every `setData()` call to also call `syncService.scheduleSync()`

5. **Update `LoginPage.tsx`** — after successful student login, call `syncService.pullAllData()` to hydrate localStorage from canister before navigating to "/"

6. **Update `ProfilePage.tsx`** — add a "Sync Now" manual button

7. **Add SyncStatus indicator** — small component in the Layout header showing online/offline + sync status
