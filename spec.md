# Specification

## Summary
**Goal:** Add a Parent Portal to Board Saathi, allowing parents to create accounts, log in, view their child's full progress, and send feedback notifications to the student.

**Planned changes:**
- Add a parent data layer in localStorage: parent account creation, parent login (authenticated via child's password), parent session management, and a function to retrieve all linked child data (subjects, chapters, notes, questions, mock tests, flashcards, question bank, planner, streaks, targets).
- Add "Login as Parent" and "Create Parent Account" buttons on the LoginPage, each opening a modal with appropriate fields and validation.
- Create a new `/parent-dashboard` route (protected, redirects to `/login` if no parent session) showing:
  - Parent username and child's name at the top, with all sections using "Your son/daughter [Name]" phrasing.
  - Overall performance card (chapter completion %, average mock score, streak, targets met).
  - Subjects list with chapter progress bars.
  - Notes count per subject/chapter with titles.
  - Questions added per chapter.
  - Mock Tests list with Attempted/Not Attempted status, best score, and attempt count.
  - Flashcards with total count and per-card flip/review count.
  - Question Bank grouped by subject/chapter.
  - A prominent comment box with "Scold 😠", "Comment 💬", and "Appreciate 🌟" buttons that pre-fill a textarea with a tone prefix, plus a Send button (disabled when empty).
- Add a localStorage notification system: `addNotification`, `getNotifications`, `markNotificationRead` functions; sending a parent comment writes a notification to the child's namespace.
- Add a notification bell icon with unread badge in the student-facing layout header/sidebar; clicking opens a panel listing notifications (sender, type badge with color, message, timestamp); clicking a notification marks it read.
- Add a logout button on the Parent Dashboard that clears parent session and redirects to `/login`.
- Register `/parent-dashboard` in TanStack Router in App.tsx without modifying any existing student routes.

**User-visible outcome:** Parents can create a parent account, log in using their child's password, and view a comprehensive dashboard of their child's study activity. Parents can send scold/comment/appreciate messages that appear as color-coded notifications in the student's notification bell, which the student can read and dismiss.
