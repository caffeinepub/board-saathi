export interface FAQEntry {
  keywords: string[];
  response: string;
}

const FAQ_DATABASE: FAQEntry[] = [
  {
    keywords: [
      "planner",
      "calendar",
      "schedule",
      "task",
      "daily",
      "plan",
      "study plan",
    ],
    response:
      "📅 **Planner**: Go to the Planner section from the sidebar. You'll see a monthly calendar. Click on any date to view or add tasks for that day. Each task has a title, description, start time, and a completion checkbox. Mark tasks as done to track your daily progress!",
  },
  {
    keywords: [
      "subject",
      "subjects",
      "maths",
      "english",
      "science",
      "sst",
      "sanskrit",
      "it",
      "information technology",
    ],
    response:
      "📚 **Subjects**: All 6 CBSE Class 10 subjects (Mathematics, English, Science, SST, Sanskrit, IT) are pre-loaded for you. Go to the Subjects section to see them. Click on any subject to view its chapters, add new chapters with weightage, and manage notes & questions per chapter.",
  },
  {
    keywords: ["chapter", "chapters", "add chapter", "weightage", "weight"],
    response:
      '📖 **Chapters**: Open any subject from the Subjects page. Click "Add Chapter" to add a new chapter with its name and weightage (marks/percentage). You can mark chapters as complete to track your syllabus coverage. Each chapter has tabs for Notes and Questions.',
  },
  {
    keywords: [
      "note",
      "notes",
      "camera",
      "photo",
      "image",
      "capture",
      "picture",
    ],
    response:
      '📷 **Notes**: Inside any chapter, go to the Notes tab. You can add text notes or capture an image using your device camera. Click "Take Photo" to open the camera, capture your handwritten notes or diagrams, and save them. All notes are stored permanently.',
  },
  {
    keywords: [
      "question",
      "questions",
      "practice",
      "add question",
      "chapter question",
    ],
    response:
      "❓ **Chapter Questions**: Inside any chapter, go to the Questions tab. Add practice questions with their answers. These questions automatically appear in the Question Bank where you can review them all in one place.",
  },
  {
    keywords: ["question bank", "bank", "all questions", "filter questions"],
    response:
      "🗂️ **Question Bank**: The Question Bank aggregates all questions you've added across all chapters and subjects. Use the filter dropdowns to filter by subject or chapter. Click on any question to reveal its answer. Great for quick revision!",
  },
  {
    keywords: [
      "mock test",
      "test",
      "mcq",
      "create test",
      "attempt test",
      "exam",
    ],
    response:
      '📝 **Mock Tests**: Go to Mock Tests from the sidebar. Click "Create New Test" to make a custom MCQ test — give it a name, select a subject, and add questions with 4 options each (mark the correct one). Once saved, click "Attempt" to take the test. After submitting, you\'ll get a detailed report with your score, percentage, and per-question analysis!',
  },
  {
    keywords: [
      "report",
      "result",
      "score",
      "percentage",
      "test result",
      "test report",
    ],
    response:
      "📊 **Test Report**: After attempting a mock test, a detailed report is generated showing: total questions, correct answers, wrong answers, score percentage, time taken, and a per-question breakdown. You can review past reports from the Mock Tests page.",
  },
  {
    keywords: [
      "progress",
      "tracker",
      "progress tracker",
      "performance",
      "statistics",
      "stats",
    ],
    response:
      "📈 **Progress Tracker**: The Progress page shows your overall study performance — chapter completion per subject (with progress bars), mock test average scores, planner task completion count, and targets achieved. It updates in real-time as you study!",
  },
  {
    keywords: ["reminder", "reminders", "alert", "notify", "notification"],
    response:
      '🔔 **Reminders**: Go to the Reminders section. Click "Add Reminder" and enter the reminder text, date, and time. Your reminders are sorted by date — upcoming ones appear first, and past reminders are shown separately. You can delete any reminder.',
  },
  {
    keywords: ["target", "targets", "goal", "goals", "objective", "deadline"],
    response:
      "🎯 **Targets**: The Targets section lets you set study goals. Add a target with a title, description, and deadline. Mark targets as complete when achieved. You can see how many targets you've achieved vs. total targets in the Progress Tracker.",
  },
  {
    keywords: [
      "login",
      "logout",
      "register",
      "sign up",
      "account",
      "profile",
      "username",
      "password",
    ],
    response:
      "👤 **Account & Login**: Board Saathi uses Internet Identity for secure login. When you first log in, you'll be asked to create your Board Saathi profile (name, school, class). Your profile and all data are permanently saved. To logout, click the Logout button in the sidebar.",
  },
  {
    keywords: [
      "profile",
      "edit profile",
      "name",
      "school",
      "class",
      "update profile",
    ],
    response:
      '✏️ **Profile**: Go to the Profile page from the sidebar. You can view your username, name, school, and class. Click "Edit" to update your name or school. Your profile is permanently saved and linked to your account.',
  },
  {
    keywords: ["dashboard", "home", "overview", "summary"],
    response:
      "🏠 **Dashboard**: The Dashboard is your home screen showing a quick overview — upcoming tasks, pending targets, recent mock test scores, and quick navigation to all sections. It's your starting point every time you open Board Saathi.",
  },
  {
    keywords: [
      "help",
      "how to",
      "how do i",
      "what is",
      "explain",
      "guide",
      "tutorial",
    ],
    response:
      "💡 **Help**: I'm your Board Saathi AI Assistant! You can ask me about any feature: planner, subjects, chapters, notes, questions, question bank, mock tests, progress tracker, reminders, targets, or your profile. Just type your question and I'll guide you!",
  },
  {
    keywords: ["cbse", "class 10", "board", "board exam", "syllabus"],
    response:
      "🎓 **CBSE Class 10**: Board Saathi is designed specifically for CBSE Class 10 board exam preparation. All 6 main subjects are pre-loaded. Use the Subjects section to manage your syllabus, add chapters with weightage, and track your preparation progress.",
  },
];

export function matchFAQ(query: string): string {
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return "Hi! I'm your Board Saathi AI Assistant 🤖. Ask me anything about how to use the app — planner, subjects, mock tests, progress tracker, and more!";
  }

  let bestMatch: FAQEntry | null = null;
  let bestScore = 0;

  for (const entry of FAQ_DATABASE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (lowerQuery.includes(keyword)) {
        score += keyword.length; // longer keyword matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch.response;
  }

  return "🤔 I'm not sure about that. Try asking about: **planner**, **subjects**, **chapters**, **notes**, **questions**, **question bank**, **mock tests**, **progress**, **reminders**, **targets**, or **profile**. I'm here to help you ace your boards! 📚";
}
