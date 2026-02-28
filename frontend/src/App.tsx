import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
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
import FlashcardsPage from './pages/FlashcardsPage';
import RevisionPage from './pages/RevisionPage';
import MyAchievementsPage from './pages/MyAchievementsPage';
import AboutPage from './pages/AboutPage';
import ParentDashboard from './pages/ParentDashboard';
import { getCurrentUserId, getParentSession } from './utils/localStorageService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: false,
    },
  },
});

// Auth guard for students
function requireAuth() {
  const userId = getCurrentUserId();
  if (!userId) {
    throw redirect({ to: '/login' });
  }
}

// Auth guard for parent portal
function requireParentAuth() {
  const session = getParentSession();
  if (!session) {
    throw redirect({ to: '/login' });
  }
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const parentDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/parent-dashboard',
  beforeLoad: requireParentAuth,
  component: ParentDashboard,
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  beforeLoad: requireAuth,
  component: Layout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: Dashboard,
});

const plannerRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/planner',
  component: PlannerPage,
});

const subjectsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/subjects',
  component: SubjectsPage,
});

const chaptersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/subjects/$subjectId',
  component: ChaptersPage,
});

const questionBankRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/question-bank',
  component: QuestionBankPage,
});

const mockTestsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/mock-tests',
  component: MockTestsPage,
});

const createMockTestRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/mock-tests/create',
  component: CreateMockTestPage,
});

const attemptMockTestRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/mock-tests/$testId/attempt',
  component: AttemptMockTestPage,
});

const testReportRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/mock-tests/$testId/report',
  component: TestReportPage,
});

const progressRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/progress',
  component: ProgressPage,
});

const remindersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/reminders',
  component: RemindersPage,
});

const targetsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/targets',
  component: TargetsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/profile',
  component: ProfilePage,
});

const flashcardsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/flashcards',
  component: FlashcardsPage,
});

const revisionRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/revision',
  component: RevisionPage,
});

const achievementsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/achievements',
  component: MyAchievementsPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/about',
  component: AboutPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  parentDashboardRoute,
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
    flashcardsRoute,
    revisionRoute,
    achievementsRoute,
    aboutRoute,
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
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
