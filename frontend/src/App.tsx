import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PlannerPage from './pages/PlannerPage';
import SubjectsPage from './pages/SubjectsPage';
import ChaptersPage from './pages/ChaptersPage';
import QuestionBankPage from './pages/QuestionBankPage';
import MockTestsPage from './pages/MockTestsPage';
import CreateMockTestPage from './pages/CreateMockTestPage';
import AttemptMockTestPage from './pages/AttemptMockTestPage';
import TestReportPage from './pages/TestReportPage';
import ProgressPage from './pages/ProgressPage';
import RemindersPage from './pages/RemindersPage';
import TargetsPage from './pages/TargetsPage';
import ProfilePage from './pages/ProfilePage';
import ProUpgradePage from './pages/ProUpgradePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
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

// Layout route (authenticated)
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: Layout,
  beforeLoad: () => {
    // Basic auth check - redirect to login if no user stored
    const stored = localStorage.getItem('board_saathi_user');
    if (!stored) {
      throw redirect({ to: '/login' });
    }
  },
});

// Dashboard
const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/dashboard',
  component: Dashboard,
});

// Planner
const plannerRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/planner',
  component: PlannerPage,
});

// Subjects
const subjectsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/subjects',
  component: SubjectsPage,
});

// Chapters
const chaptersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/subjects/$subjectId',
  component: ChaptersPage,
});

// Question Bank
const questionBankRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/question-bank',
  component: QuestionBankPage,
});

// Mock Tests
const mockTestsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/mock-tests',
  component: MockTestsPage,
});

// Create Mock Test
const createMockTestRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/mock-tests/create',
  component: CreateMockTestPage,
});

// Attempt Mock Test
const attemptMockTestRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/mock-tests/$testId/attempt',
  component: AttemptMockTestPage,
});

// Test Report
const testReportRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/mock-tests/$testId/report',
  component: TestReportPage,
});

// Progress
const progressRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/progress',
  component: ProgressPage,
});

// Reminders
const remindersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/reminders',
  component: RemindersPage,
});

// Targets
const targetsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/targets',
  component: TargetsPage,
});

// Profile
const profileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/profile',
  component: ProfilePage,
});

// Pro Upgrade
const proRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/pro',
  component: ProUpgradePage,
});

// Index redirect
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/login' });
  },
  component: () => null,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  layoutRoute.addChildren([
    dashboardRoute,
    plannerRoute,
    subjectsRoute,
    chaptersRoute,
    questionBankRoute,
    mockTestsRoute,
    createMockTestRoute,
    attemptMockTestRoute,
    testReportRoute,
    progressRoute,
    remindersRoute,
    targetsRoute,
    profileRoute,
    proRoute,
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
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
