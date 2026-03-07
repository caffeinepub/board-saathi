# Board Saathi

## Current State

The app uses Internet Identity (II) for login. After II login, the Principal text is stored. Data is synced to the Motoko canister via `saveUserData(username, dataType, blob)` where `username = principalText` (full principal string like "2vxsx-fae...").

**Root cause of cross-device failure (critical bug):**
The backend `saveUserData` and `getUserData` have an ownership check:
```
let isOwner = switch (studentProfiles.get(caller)) {
  case (?profile) { profile.username == username };
  ...
```
When the user first registers (`saveCallerUserProfile`), the profile stores `username = principalText.slice(0, 16)` (only 16 chars). But `syncService.ts` passes the FULL `principalText` as the `username` argument to `saveUserData`. These NEVER match, so **every single `saveUserData` call for II users fails with "Unauthorized"** — silently. Data never reaches the canister. Only local device storage works.

This is why: same profile doesn't work on other devices, subjects are empty on new device, nothing syncs.

## Requested Changes (Diff)

### Add
- Backend: New `saveMyData(dataType, jsonBlob)` and `getMyData(dataType)` and `listMyDataTypes()` methods that identify the user by their calling Principal directly (no username parameter) — no ownership mismatch possible
- Backend: New `getDefaultSubjects()` query to return the 6 default subjects as JSON for new device initialization
- Backend: Store data keyed by Principal in a new `principalDataStore` map
- Frontend: Update `syncService.ts` to call `saveMyData`/`getMyData`/`listMyDataTypes` instead of the broken username-based variants
- Frontend: On login (new device), pull data using `getMyData` — guaranteed to match because the canister uses caller's Principal as the key
- Frontend: On registration, push 6 default subjects via `saveMyData` immediately after profile creation
- Frontend: Fast sync: remove artificial delays, use Promise.allSettled with direct calls, no queue for foreground syncs
- Frontend: After pull completes, always check if subjects are empty and use DEFAULT_SUBJECTS if canister also returns empty (first-time device)

### Modify
- Backend: `saveUserData` / `getUserData` — keep for backward compat but also add the new Principal-based methods
- Frontend: `syncService.ts` — replace username-based canister calls with Principal-based `saveMyData`/`getMyData`/`listMyDataTypes`
- Frontend: `LoginPage.tsx` — after profile setup, immediately push all data using new methods; on returning user login, pull all data using new methods
- Frontend: `localStorageService.ts` — `initializeUserData` must always run for new users and push subjects to canister

### Remove
- Frontend: The broken push-local-before-pull logic that was causing race conditions

## Implementation Plan

1. Update Motoko backend: add `saveMyData(dataType, jsonBlob)`, `getMyData(dataType)`, `listMyDataTypes()` that key on `caller` Principal directly
2. Update `backend.d.ts` to include the new methods
3. Update `syncService.ts`:
   - Replace all `saveUserData(username, ...)` calls with `saveMyData(dataType, blob)`
   - Replace all `getUserData(username, ...)` calls with `getMyData(dataType)`
   - Replace all `listUserDataTypes(username)` calls with `listMyDataTypes()`
   - Remove the broken username-stripping logic
   - Make `pullAllData` use actor directly (not username)
   - Make `flushQueue` use `saveMyData`
4. Update `LoginPage.tsx`:
   - After profile setup: push default subjects + all local data
   - On returning login: pull all data, then show dashboard
5. Ensure subjects default initialization always saves to canister
