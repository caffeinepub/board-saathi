import React from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SubjectsPage from './pages/SubjectsPage';
import ChaptersPage from './pages/ChaptersPage';
import QuestionBankPage from './pages/QuestionBankPage';
import MockTestsPage from './pages/MockTestsPage';
import CreateMockTestPage from './pages/CreateMockTestPage';
import AttemptMockTestPage from './pages/AttemptMockTestPage';
import TestReportPage from './pages/TestReportPage';
import ProgressPage from './pages/ProgressPage';
import PlannerPage from './pages/PlannerPage';
import RemindersPage from './pages/RemindersPage';
import TargetsPage from './pages/TargetsPage';
import RevisionPage from './pages/RevisionPage';
import ProfilePage from './pages/ProfilePage';
import MyAchievementsPage from './pages/MyAchievementsPage';
import ParentDashboard from './pages/ParentDashboard';
import StudentMessagesPage from './pages/StudentMessagesPage';
import TimerPage from './pages/TimerPage';

import { getCurrentUserId, getParentSession } from './utils/localStorageService';

// Lazy import for flashcards
import FlashcardsPage from './pages/FlashcardsPage';
import AboutPage from './pages/AboutPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Parent dashboard route
const parentDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/parent-dashboard',
  beforeLoad: () => {
    const session = getParentSession();
    if (!session) throw redirect({ to: '/login' });
  },
  component: ParentDashboard,
});

// Student layout route (auth guard)
const studentLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  beforeLoad: () => {
    const userId = getCurrentUserId();
    if (!userId) throw redirect({ to: '/login' });
  },
  component: Layout,
});

// Student child routes
const dashboardRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/',
  component: Dashboard,
});

const subjectsRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/subjects',
  component: SubjectsPage,
});

const chaptersRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/subjects/$subjectId',
  component: ChaptersPage,
});

const questionBankRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/question-bank',
  component: QuestionBankPage,
});

const mockTestsRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/mock-tests',
  component: MockTestsPage,
});

const createMockTestRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/mock-tests/create',
  component: CreateMockTestPage,
});

const attemptMockTestRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/mock-tests/$testId/attempt',
  component: AttemptMockTestPage,
});

const testReportRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/mock-tests/$testId/report',
  component: TestReportPage,
});

const progressRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/progress',
  component: ProgressPage,
});

const plannerRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/planner',
  component: PlannerPage,
});

const remindersRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/reminders',
  component: RemindersPage,
});

const targetsRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/targets',
  component: TargetsPage,
});

const revisionRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/revision',
  component: RevisionPage,
});

const profileRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/profile',
  component: ProfilePage,
});

const achievementsRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/achievements',
  component: MyAchievementsPage,
});

const flashcardsRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/flashcards',
  component: FlashcardsPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/about',
  component: AboutPage,
});

const messagesRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/messages',
  component: StudentMessagesPage,
});

const timerRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: '/timer',
  component: TimerPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  parentDashboardRoute,
  studentLayoutRoute.addChildren([
    dashboardRoute,
    subjectsRoute,
    chaptersRoute,
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
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <RouterProvider router={router} />
        <Toaster richColors position="top-center" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
