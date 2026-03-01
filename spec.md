# Specification

## Summary
**Goal:** Enhance the Board Saathi homepage with new widgets and navigation, add a Timer/Countdown page, and introduce a persistent bottom navigation bar.

**Planned changes:**
- Add a "Days Left to End of Month" countdown banner at the top of the Dashboard/homepage
- Add a section on the homepage showing the user's upcoming reminders and active targets (pulled from localStorage), displaying title, due date/time, and status
- Add a "Target 🎯 100%" motivational widget on the homepage with gold/trophy/champion styling, showing overall target completion percentage and an encouraging message
- Add a calendar-clock icon button in the homepage header (beside the existing message icon) that navigates to a new Timer page
- Create a new Timer/Countdown page where users can add multiple timers with a start date (month + day) and end date (year + month + day); each saved timer displays a large live countdown in months, days, hours, and minutes; timers persist in localStorage and can be deleted individually
- Add a persistent fixed bottom navigation bar visible on every authenticated page with five buttons (Home, Subject, Question, Reminder, Target), each with an icon and label; the active page is highlighted and page content has bottom padding to avoid overlap

**User-visible outcome:** Students can see days remaining in the month, their reminders and targets at a glance, and a motivational target widget on the homepage; they can set and track multiple countdown timers; and they can quickly navigate to any main section of the app via a fixed bottom navigation bar.
