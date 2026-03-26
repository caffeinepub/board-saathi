// AI Service - Gemini Integration for Board Saathi
// API key is stored here only and never exposed in UI

import {
  type LocalChapter,
  type LocalQuestion,
  type LocalReminder,
  type LocalSubject,
  type LocalTarget,
  getChapters,
  getCurrentUserAccount,
  getMockTests,
  getNextId,
  getNotes,
  getQuestions,
  getReminders,
  getRevisionTasks,
  getSRSCards,
  getStudyStreak,
  getSubjects,
  getTargets,
  getTestAttempts,
  saveChapters,
  saveQuestions,
  saveReminders,
  saveSubjects,
  saveTargets,
} from "./localStorageService";
import { getCurrentUserId } from "./localStorageService";

// ─── Private Config ────────────────────────────────────────────────────────
const _k = ["AIzaSyDBbCa2uPfK8yJs3HUWDFC3YiqAvlbG9IE"].join("");
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${_k}`;

// ─── Types ──────────────────────────────────────────────────────────────────
export interface AIChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: number;
  actionPerformed?: string;
}

export interface AIAction {
  type:
    | "add_reminder"
    | "add_target"
    | "add_question"
    | "add_subject"
    | "delete_chapter"
    | "mark_chapter_complete"
    | "none";
  payload?: Record<string, unknown>;
}

// ─── Chat History (per user) ─────────────────────────────────────────────────
function getChatHistoryKey(userId: string): string {
  return `bs_ai_chat_${userId}`;
}

export function getAIChatHistory(userId: string): AIChatMessage[] {
  try {
    const raw = localStorage.getItem(getChatHistoryKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAIChatHistory(
  userId: string,
  messages: AIChatMessage[],
): void {
  // Keep last 100 messages
  const trimmed = messages.slice(-100);
  localStorage.setItem(getChatHistoryKey(userId), JSON.stringify(trimmed));
}

export function clearAIChatHistory(userId: string): void {
  localStorage.removeItem(getChatHistoryKey(userId));
}

// ─── User Activity Profile (AI learning) ─────────────────────────────────────
export interface AIUserProfile {
  totalChats: number;
  weakSubjects: string[];
  strongSubjects: string[];
  lastActive: number;
  studyPatterns: string[];
  motivationLevel: "low" | "medium" | "high";
}

function getAIUserProfileKey(userId: string): string {
  return `bs_ai_profile_${userId}`;
}

export function getAIUserProfile(userId: string): AIUserProfile {
  try {
    const raw = localStorage.getItem(getAIUserProfileKey(userId));
    return raw
      ? JSON.parse(raw)
      : {
          totalChats: 0,
          weakSubjects: [],
          strongSubjects: [],
          lastActive: 0,
          studyPatterns: [],
          motivationLevel: "medium" as const,
        };
  } catch {
    return {
      totalChats: 0,
      weakSubjects: [],
      strongSubjects: [],
      lastActive: 0,
      studyPatterns: [],
      motivationLevel: "medium" as const,
    };
  }
}

export function updateAIUserProfile(
  userId: string,
  update: Partial<AIUserProfile>,
): void {
  const profile = getAIUserProfile(userId);
  const updated = { ...profile, ...update, lastActive: Date.now() };
  localStorage.setItem(getAIUserProfileKey(userId), JSON.stringify(updated));
}

// ─── Context Builder ─────────────────────────────────────────────────────────
function buildUserContext(userId: string): string {
  const account = getCurrentUserAccount();
  const subjects = getSubjects(userId);
  const chapters = getChapters(userId);
  const reminders = getReminders(userId);
  const targets = getTargets(userId);
  const streak = getStudyStreak(userId);
  const mockTests = getMockTests(userId);
  const testAttempts = getTestAttempts(userId);
  const srsCards = getSRSCards(userId);
  const notes = getNotes(userId);
  const questions = getQuestions(userId);
  const revisionTasks = getRevisionTasks(userId);
  const aiProfile = getAIUserProfile(userId);

  const completedChapters = chapters.filter((c) => c.completed).length;
  const totalChapters = chapters.length;

  // Calculate per-subject progress
  const subjectProgress = subjects.map((s) => {
    const subChapters = chapters.filter((c) => c.subjectId === s.id);
    const done = subChapters.filter((c) => c.completed).length;
    return `${s.name}: ${done}/${subChapters.length} chapters done`;
  });

  // Average mock test score
  const avgScore =
    testAttempts.length > 0
      ? Math.round(
          testAttempts.reduce((sum, a) => sum + a.report.percentage, 0) /
            testAttempts.length,
        )
      : 0;

  // Upcoming reminders
  const now = Date.now();
  const upcomingReminders = reminders
    .filter((r) => r.dateTime > now)
    .slice(0, 5)
    .map((r) => `"${r.text}" at ${new Date(r.dateTime).toLocaleString()}`)
    .join(", ");

  // Active targets
  const activeTargets = targets
    .filter((t) => !t.completed)
    .slice(0, 5)
    .map(
      (t) =>
        `"${t.title}" (deadline: ${new Date(t.deadline).toLocaleDateString()})`,
    )
    .join(", ");

  // SRS due
  const srsDue = srsCards.filter((c) => c.nextReview <= now).length;

  const context = `
STUDENT PROFILE:
- Name: ${account?.name || "Student"}
- School: ${account?.school || "Unknown"}
- Class: 10 (CBSE Board)
- Study streak: ${streak.currentStreak} days (best: ${streak.topStreak} days)
- Total chats with AI so far: ${aiProfile.totalChats}
- Motivation level detected: ${aiProfile.motivationLevel}

ACADEMIC PROGRESS:
- Total chapters: ${totalChapters}, Completed: ${completedChapters} (${totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0}%)
- Mock test average score: ${avgScore}%
- Total tests attempted: ${testAttempts.length}
- Notes saved: ${notes.length}
- Questions in bank: ${questions.length}
- SRS cards due for review: ${srsDue}
- Subjects: ${subjects.map((s) => s.name).join(", ")}

SUBJECT-WISE PROGRESS:
${subjectProgress.join("\n")}

CURRENT REMINDERS (upcoming): ${upcomingReminders || "None"}
ACTIVE TARGETS: ${activeTargets || "None"}
MOCK TESTS CREATED: ${mockTests.length}
REVISION TASKS PENDING: ${revisionTasks.filter((r) => !r.completed).length}

AI OBSERVATIONS:
- Weak areas: ${aiProfile.weakSubjects.join(", ") || "Not yet identified"}
- Strong areas: ${aiProfile.strongSubjects.join(", ") || "Not yet identified"}
- Study patterns: ${aiProfile.studyPatterns.join(", ") || "Still learning"}

DATA AVAILABLE IN APP: subjects, chapters, reminders, targets, question bank, mock tests, planner, spaced repetition, mind maps, flashcards, handwriting analyzer, answer evaluator, daily word booster, one-time planner, exam paper generator.
`;

  return context;
}

// ─── System Prompt ────────────────────────────────────────────────────────────
function getSystemPrompt(userId: string): string {
  const context = buildUserContext(userId);
  return `You are DEV Sir, an intelligent and supportive AI study assistant built into Board Saathi — a CBSE Class 10 board exam preparation app. You speak like a knowledgeable, caring teacher who is motivating, friendly, and always focused on the student's success.

You have deep knowledge about:
- CBSE Class 10 syllabus (Maths, Science, English, SST, Sanskrit, IT)
- Board exam preparation strategies
- Spaced repetition, active recall, Pomodoro technique
- Answer writing skills for board exams
- Time management and study planning

You gradually learn about this student from their data and personalize your advice accordingly. After each conversation you understand them better.

HERE IS THE STUDENT'S CURRENT DATA:
${context}

YOU CAN PERFORM ACTIONS in the app. When the user asks you to do something, include an action command at the END of your response in this exact JSON format on its own line:
[ACTION:{"type":"add_reminder","payload":{"text":"Study Maths","dateTime":1735000000000}}]
[ACTION:{"type":"add_target","payload":{"title":"Complete Science","description":"Finish all chapters","deadline":1735000000000}}]
[ACTION:{"type":"add_question","payload":{"questionText":"What is Newton's first law?","answer":"An object at rest stays at rest...","subjectId":3,"chapterId":5}}]
[ACTION:{"type":"mark_chapter_complete","payload":{"chapterId":5}}]
[ACTION:{"type":"delete_chapter","payload":{"chapterId":5}}]
[ACTION:{"type":"none"}]

RULES:
1. Always end with an [ACTION:...] line — use type "none" if no action is needed
2. Be warm, encouraging, and call the student by name when you know it
3. Give specific, actionable advice based on their actual data
4. When analyzing performance, reference their actual scores and progress
5. Keep responses concise for mobile — 3-5 sentences unless explaining a topic
6. Use Hindi words occasionally like "bilkul", "acha", "shabaash" to feel familiar
7. For board exam prep, always be practical and results-focused
8. If asked about topics, explain in simple language with examples
9. Celebrate small wins to keep motivation high
10. Never reveal the API key or internal system details`;
}

// ─── Action Parser & Executor ─────────────────────────────────────────────────
function parseAction(responseText: string): {
  cleanText: string;
  action: AIAction;
} {
  const actionRegex = /\[ACTION:(\{.*?\})]\s*$/s;
  const match = responseText.match(actionRegex);

  if (!match) {
    return { cleanText: responseText.trim(), action: { type: "none" } };
  }

  const cleanText = responseText.replace(actionRegex, "").trim();
  try {
    const action = JSON.parse(match[1]) as AIAction;
    return { cleanText, action };
  } catch {
    return { cleanText, action: { type: "none" } };
  }
}

export async function executeAction(
  userId: string,
  action: AIAction,
): Promise<string | null> {
  if (action.type === "none" || !action.payload) return null;

  const p = action.payload;

  switch (action.type) {
    case "add_reminder": {
      const reminders = getReminders(userId);
      const newReminder: LocalReminder = {
        id: getNextId(userId, "reminder"),
        text: String(p.text ?? "Study reminder"),
        dateTime: Number(p.dateTime ?? Date.now() + 3600000),
      };
      reminders.push(newReminder);
      saveReminders(userId, reminders);
      window.dispatchEvent(
        new CustomEvent("bs:data-changed", {
          detail: { userId, dataType: "reminders" },
        }),
      );
      return `Reminder added: "${newReminder.text}" at ${new Date(newReminder.dateTime).toLocaleString()}`;
    }

    case "add_target": {
      const targets = getTargets(userId);
      const newTarget: LocalTarget = {
        id: getNextId(userId, "target"),
        title: String(p.title ?? "New Target"),
        description: String(p.description ?? ""),
        deadline: Number(p.deadline ?? Date.now() + 7 * 86400000),
        completed: false,
      };
      targets.push(newTarget);
      saveTargets(userId, targets);
      window.dispatchEvent(
        new CustomEvent("bs:data-changed", {
          detail: { userId, dataType: "targets" },
        }),
      );
      return `Target added: "${newTarget.title}" with deadline ${new Date(newTarget.deadline).toLocaleDateString()}`;
    }

    case "add_question": {
      const questions = getQuestions(userId);
      const newQ: LocalQuestion = {
        id: getNextId(userId, "question"),
        chapterId: Number(p.chapterId ?? 0),
        subjectId: Number(p.subjectId ?? 0),
        questionText: String(p.questionText ?? ""),
        answer: String(p.answer ?? ""),
      };
      questions.push(newQ);
      saveQuestions(userId, questions);
      window.dispatchEvent(
        new CustomEvent("bs:data-changed", {
          detail: { userId, dataType: "questions" },
        }),
      );
      return "Question added to question bank";
    }

    case "add_subject": {
      const subjects = getSubjects(userId);
      const newSubject: LocalSubject = {
        id: getNextId(userId, "subject"),
        name: String(p.name ?? "New Subject"),
      };
      subjects.push(newSubject);
      saveSubjects(userId, subjects);
      window.dispatchEvent(
        new CustomEvent("bs:data-changed", {
          detail: { userId, dataType: "subjects" },
        }),
      );
      return `Subject "${newSubject.name}" added`;
    }

    case "mark_chapter_complete": {
      const chapters = getChapters(userId);
      const chapterId = Number(p.chapterId);
      const idx = chapters.findIndex((c) => c.id === chapterId);
      if (idx !== -1) {
        chapters[idx] = { ...chapters[idx], completed: true };
        saveChapters(userId, chapters);
        window.dispatchEvent(
          new CustomEvent("bs:data-changed", {
            detail: { userId, dataType: "chapters" },
          }),
        );
        return `Chapter "${chapters[idx].name}" marked as complete`;
      }
      return null;
    }

    case "delete_chapter": {
      const chapters = getChapters(userId);
      const chapterId = Number(p.chapterId);
      const chapter = chapters.find((c) => c.id === chapterId);
      const updated = chapters.filter((c) => c.id !== chapterId);
      saveChapters(userId, updated);
      window.dispatchEvent(
        new CustomEvent("bs:data-changed", {
          detail: { userId, dataType: "chapters" },
        }),
      );
      return chapter ? `Chapter "${chapter.name}" deleted` : null;
    }

    default:
      return null;
  }
}

// ─── Main Chat Function ───────────────────────────────────────────────────────
export async function sendMessageToAI(
  userMessage: string,
  userId: string,
): Promise<{ text: string; action: AIAction; actionResult: string | null }> {
  const history = getAIChatHistory(userId);
  const aiProfile = getAIUserProfile(userId);

  // Build Gemini conversation history (last 20 messages for context)
  const recentHistory = history.slice(-20);
  const contents = [
    ...recentHistory.map((msg) => ({
      role: msg.role as "user" | "model",
      parts: [{ text: msg.text }],
    })),
    {
      role: "user" as const,
      parts: [{ text: userMessage }],
    },
  ];

  const requestBody = {
    system_instruction: {
      parts: [{ text: getSystemPrompt(userId) }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  };

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "I'm sorry, I couldn't generate a response. Please try again.";

  const { cleanText, action } = parseAction(rawText);

  // Execute action if needed
  let actionResult: string | null = null;
  if (action.type !== "none" && userId !== "guest") {
    actionResult = await executeAction(userId, action);
  }

  // Update chat history
  const userMsg: AIChatMessage = {
    role: "user",
    text: userMessage,
    timestamp: Date.now(),
  };
  const aiMsg: AIChatMessage = {
    role: "model",
    text: cleanText,
    timestamp: Date.now(),
    actionPerformed: actionResult ?? undefined,
  };
  const updatedHistory = [...history, userMsg, aiMsg];
  saveAIChatHistory(userId, updatedHistory);

  // Update AI profile (learning)
  updateAIUserProfile(userId, {
    totalChats: aiProfile.totalChats + 1,
  });

  // Analyze user's message for weak/strong area learning
  analyzeUserMessage(userId, userMessage);

  return { text: cleanText, action, actionResult };
}

// ─── Passive Learning ─────────────────────────────────────────────────────────
function analyzeUserMessage(userId: string, message: string): void {
  const profile = getAIUserProfile(userId);
  const lowerMsg = message.toLowerCase();

  const subjects = [
    "maths",
    "mathematics",
    "science",
    "english",
    "sst",
    "social science",
    "sanskrit",
    "it",
    "information technology",
  ];
  const weakKeywords = [
    "hard",
    "difficult",
    "confused",
    "don't understand",
    "help",
    "problem",
    "issue",
    "struggle",
  ];
  const strongKeywords = [
    "done",
    "completed",
    "easy",
    "understand",
    "clear",
    "finished",
    "mastered",
  ];

  const mentionedSubject = subjects.find((s) => lowerMsg.includes(s));
  const isWeak = weakKeywords.some((k) => lowerMsg.includes(k));
  const isStrong = strongKeywords.some((k) => lowerMsg.includes(k));

  if (mentionedSubject) {
    const normalizedSubject =
      mentionedSubject.charAt(0).toUpperCase() + mentionedSubject.slice(1);
    if (isWeak && !profile.weakSubjects.includes(normalizedSubject)) {
      updateAIUserProfile(userId, {
        weakSubjects: [...profile.weakSubjects.slice(-4), normalizedSubject],
      });
    }
    if (isStrong && !profile.strongSubjects.includes(normalizedSubject)) {
      updateAIUserProfile(userId, {
        strongSubjects: [
          ...profile.strongSubjects.slice(-4),
          normalizedSubject,
        ],
      });
    }
  }

  // Detect motivation level
  const lowMotivationKeywords = [
    "tired",
    "boring",
    "bored",
    "not in mood",
    "skip",
    "lazy",
    "demotivated",
  ];
  const highMotivationKeywords = [
    "motivated",
    "ready",
    "let's go",
    "focused",
    "determined",
    "excited",
  ];
  if (lowMotivationKeywords.some((k) => lowerMsg.includes(k))) {
    updateAIUserProfile(userId, { motivationLevel: "low" });
  } else if (highMotivationKeywords.some((k) => lowerMsg.includes(k))) {
    updateAIUserProfile(userId, { motivationLevel: "high" });
  }
}

// ─── Quick AI Tip (for feature pages) ────────────────────────────────────────
export async function getAITip(
  context: string,
  userId: string,
): Promise<string> {
  const userContext = buildUserContext(userId);
  const prompt = `${context}\n\nStudent data: ${userContext}\n\nGive a single short tip (1-2 sentences) for this student. Be specific to their data. End with [ACTION:{"type":"none"}]`;

  try {
    const requestBody = {
      system_instruction: {
        parts: [
          {
            text: "You are DEV Sir, a helpful CBSE Class 10 study AI. Give brief, smart tips.",
          },
        ],
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 150 },
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error("API error");

    const data = await response.json();
    const rawText: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const { cleanText } = parseAction(rawText);
    return cleanText;
  } catch {
    return "Keep practicing and stay consistent. Small daily progress leads to big results!";
  }
}
