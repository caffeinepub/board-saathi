import { useNavigate } from '@tanstack/react-router';
import {
  BookOpen,
  Target,
  Calendar,
  BarChart2,
  Flame,
  Star,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { useGetSubjects, useGetProgressSummary, useGetStudyStreak } from '../hooks/useQueries';
import { getStoredUser } from '../hooks/useQueries';
import ActiveTargetsSection from '../components/ActiveTargetsSection';
import MadeByDevBadge from '../components/MadeByDevBadge';

const MOTIVATIONAL_QUOTES = [
  "Success is the sum of small efforts, repeated day in and day out.",
  "The secret of getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "Believe you can and you're halfway there.",
  "Education is the most powerful weapon you can use to change the world.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
];

function getDailyQuote(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const { data: subjects = [] } = useGetSubjects();
  const { data: progress } = useGetProgressSummary();
  const { data: streak } = useGetStudyStreak();

  // suppress unused warning
  void subjects;

  const quote = getDailyQuote();

  const completedChapters = progress?.subjectProgress.reduce(
    (sum, sp) => sum + Number(sp.completedChapters),
    0
  ) ?? 0;
  const totalChapters = progress?.subjectProgress.reduce(
    (sum, sp) => sum + Number(sp.totalChapters),
    0
  ) ?? 0;

  const stats = [
    {
      label: 'Chapters Done',
      value: `${completedChapters}/${totalChapters}`,
      icon: BookOpen,
      color: 'text-blue-600 bg-blue-50',
      path: '/subjects',
    },
    {
      label: 'Tasks Completed',
      value: `${Number(progress?.totalTasksCompleted ?? 0)}/${Number(progress?.totalTasks ?? 0)}`,
      icon: Calendar,
      color: 'text-green-600 bg-green-50',
      path: '/planner',
    },
    {
      label: 'Targets Achieved',
      value: `${Number(progress?.totalTargetsAchieved ?? 0)}/${Number(progress?.totalTargets ?? 0)}`,
      icon: Target,
      color: 'text-purple-600 bg-purple-50',
      path: '/targets',
    },
    {
      label: 'Mock Tests',
      value: String(Number(progress?.totalMockTestsAttempted ?? 0)),
      icon: ClipboardList,
      color: 'text-orange-600 bg-orange-50',
      path: '/mock-tests',
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Active Targets - shown first */}
      <ActiveTargetsSection />

      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Hello, {user?.name ?? 'Student'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Streak Banner */}
      {streak && Number(streak.currentStreak) > 0 && (
        <div className="mb-6 flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl px-4 py-3">
          <Flame size={24} className="text-orange-500" />
          <div>
            <p className="text-sm font-semibold text-orange-700">
              🔥 {Number(streak.currentStreak)}-day study streak!
            </p>
            <p className="text-xs text-orange-500">
              Best: {Number(streak.topStreak)} days — keep it up!
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color, path }) => (
          <button
            key={label}
            onClick={() => navigate({ to: path })}
            className="bg-white border border-gray-100 rounded-xl p-4 text-left hover:shadow-md transition-shadow"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${color}`}>
              <Icon size={18} />
            </div>
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      {/* Daily Quote */}
      <div className="mb-6 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 rounded-xl px-4 py-3">
        <div className="flex items-start gap-2">
          <Star size={16} className="text-teal-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-teal-800 italic">"{quote}"</p>
        </div>
      </div>

      {/* Subject Progress */}
      {progress && progress.subjectProgress.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Subject Progress</h2>
            <button
              onClick={() => navigate({ to: '/subjects' })}
              className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {progress.subjectProgress.map((sp) => {
              const pct =
                Number(sp.totalChapters) > 0
                  ? Math.round((Number(sp.completedChapters) / Number(sp.totalChapters)) * 100)
                  : 0;
              return (
                <div key={String(sp.subjectId)} className="bg-white border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{sp.subjectName}</span>
                    <span className="text-xs text-gray-400">
                      {String(sp.completedChapters)}/{String(sp.totalChapters)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Task', icon: Calendar, path: '/planner', color: 'bg-green-50 text-green-700' },
            { label: 'Mock Test', icon: ClipboardList, path: '/mock-tests', color: 'bg-orange-50 text-orange-700' },
            { label: 'Progress', icon: BarChart2, path: '/progress', color: 'bg-purple-50 text-purple-700' },
            { label: 'Subjects', icon: BookOpen, path: '/subjects', color: 'bg-blue-50 text-blue-700' },
          ].map(({ label, icon: Icon, path, color }) => (
            <button
              key={label}
              onClick={() => navigate({ to: path })}
              className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <span className="text-xs font-medium text-gray-600">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Made by DEV badge */}
      <div className="flex justify-center mt-4 mb-2">
        <MadeByDevBadge />
      </div>
    </div>
  );
}
