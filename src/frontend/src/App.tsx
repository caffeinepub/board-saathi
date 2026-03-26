import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import React, { useEffect } from "react";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";

import Layout from "./components/Layout";
import AIChatPage from "./pages/AIChatPage";
import AttemptMockTestPage from "./pages/AttemptMockTestPage";
import ChaptersPage from "./pages/ChaptersPage";
import CreateMockTestPage from "./pages/CreateMockTestPage";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import MockTestsPage from "./pages/MockTestsPage";
import MyAchievementsPage from "./pages/MyAchievementsPage";
import ParentDashboard from "./pages/ParentDashboard";
import PlannerPage from "./pages/PlannerPage";
import ProfilePage from "./pages/ProfilePage";
import ProgressPage from "./pages/ProgressPage";
import QuestionBankPage from "./pages/QuestionBankPage";
import RemindersPage from "./pages/RemindersPage";
import RevisionPage from "./pages/RevisionPage";
import StudentMessagesPage from "./pages/StudentMessagesPage";
import SubjectsPage from "./pages/SubjectsPage";
import TargetsPage from "./pages/TargetsPage";
import TestReportPage from "./pages/TestReportPage";
import TimerPage from "./pages/TimerPage";

import {
  getCurrentUserId,
  getParentSession,
} from "./utils/localStorageService";

import AboutPage from "./pages/AboutPage";
import AnswerEvaluatorPage from "./pages/AnswerEvaluatorPage";
import ChapterDetailPage from "./pages/ChapterDetailPage";
import DailyWordBoosterPage from "./pages/DailyWordBoosterPage";
import DataTransferPage from "./pages/DataTransferPage";
import ExamPaperPage from "./pages/ExamPaperPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import HandwritingAnalyzerPage from "./pages/HandwritingAnalyzerPage";
import MindMapPage from "./pages/MindMapPage";
import OneTimePlannerPage from "./pages/OneTimePlannerPage";
import RevengeCornerPage from "./pages/RevengeCornerPage";
import SpacedRepetitionPage from "./pages/SpacedRepetitionPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// ─── Service Worker Registration ────────────────────────────────────────────

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // When a new SW activates and takes control, reload to get fresh assets
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New content available; the controllerchange listener will reload
            newWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    } catch (err) {
      console.error("[SW] Registration failed:", err);
    }
  });
}

registerServiceWorker();

// ─── Routes ─────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const parentDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/parent-dashboard",
  beforeLoad: () => {
    const session = getParentSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: ParentDashboard,
});

const studentLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  beforeLoad: () => {
    const userId = getCurrentUserId();
    if (!userId) throw redirect({ to: "/login" });
  },
  component: Layout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/",
  component: Dashboard,
});

const subjectsRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/subjects",
  component: SubjectsPage,
});

const chaptersRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/subjects/$subjectId",
  component: ChaptersPage,
});

const chapterDetailRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/subjects/$subjectId/chapters/$chapterId",
  component: ChapterDetailPage,
});

const oneTimePlannerRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/one-time-planner",
  component: OneTimePlannerPage,
});

const questionBankRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/question-bank",
  component: QuestionBankPage,
});

const mockTestsRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/mock-tests",
  component: MockTestsPage,
});

const createMockTestRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/mock-tests/create",
  component: CreateMockTestPage,
});

const attemptMockTestRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/mock-tests/$testId/attempt",
  component: AttemptMockTestPage,
});

const testReportRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/mock-tests/$testId/report",
  component: TestReportPage,
});

const progressRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/progress",
  component: ProgressPage,
});

const plannerRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/planner",
  component: PlannerPage,
});

const remindersRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/reminders",
  component: RemindersPage,
});

const targetsRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/targets",
  component: TargetsPage,
});

const revisionRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/revision",
  component: RevisionPage,
});

const profileRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/profile",
  component: ProfilePage,
});

const achievementsRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/achievements",
  component: MyAchievementsPage,
});

const flashcardsRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/flashcards",
  component: FlashcardsPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/about",
  component: AboutPage,
});

const messagesRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/messages",
  component: StudentMessagesPage,
});

const timerRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/timer",
  component: TimerPage,
});

const examPaperRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/exam-paper",
  component: ExamPaperPage,
});

const mindMapRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/mind-map",
  component: MindMapPage,
});

const answerEvaluatorRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/answer-evaluator",
  component: AnswerEvaluatorPage,
});

const handwritingRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/handwriting-analyzer",
  component: HandwritingAnalyzerPage,
});

const spacedRepRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/spaced-repetition",
  component: SpacedRepetitionPage,
});

const wordBoosterRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/daily-word-booster",
  component: DailyWordBoosterPage,
});

const revengeCornerRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/revenge-corner",
  component: RevengeCornerPage,
});

const dataTransferRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/data-transfer",
  component: DataTransferPage,
});

const aiChatRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/ai-chat",
  component: AIChatPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  parentDashboardRoute,
  studentLayoutRoute.addChildren([
    dashboardRoute,
    subjectsRoute,
    chaptersRoute,
    chapterDetailRoute,
    oneTimePlannerRoute,
    questionBankRoute,
    mockTestsRoute,
    createMockTestRoute,
    attemptMockTestRoute,
    testReportRoute,
    progressRoute,
    plannerRoute,
    remindersRoute,
    targetsRoute,
    revisionRoute,
    profileRoute,
    achievementsRoute,
    flashcardsRoute,
    aboutRoute,
    messagesRoute,
    timerRoute,
    examPaperRoute,
    mindMapRoute,
    answerEvaluatorRoute,
    handwritingRoute,
    spacedRepRoute,
    wordBoosterRoute,
    revengeCornerRoute,
    dataTransferRoute,
    aiChatRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InternetIdentityProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <RouterProvider router={router} />
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </InternetIdentityProvider>
    </QueryClientProvider>
  );
}
