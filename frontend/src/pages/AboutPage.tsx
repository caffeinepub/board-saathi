import {
  BookMarked, Calendar, CreditCard, ClipboardList, HelpCircle,
  RotateCcw, Target, Bell, TrendingUp, Trophy, User, Flame,
  BookOpen, Info, Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: BookMarked,
    title: 'Subjects & Chapters',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950',
    description: 'Organize your studies by subject. Add custom subjects and chapters for each subject. Track chapter completion and mark chapters as done to trigger automatic spaced-repetition revision scheduling.',
    tips: ['Tap "Add Subject" to create a new subject', 'Open a subject to add chapters', 'Mark chapters complete to schedule revisions'],
  },
  {
    icon: CreditCard,
    title: 'Flashcards',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950',
    description: 'Create digital flashcards for quick revision. Each card has a front (question/term) and back (answer/definition). Flip cards to test yourself and mark them as learned.',
    tips: ['Tap a card to flip it', 'Mark cards as "Learned" to track progress', 'Filter by subject to focus your revision'],
  },
  {
    icon: ClipboardList,
    title: 'Mock Tests',
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950',
    description: 'Create and attempt MCQ-based mock tests. Build tests with multiple choice questions, attempt them with a timer, and get detailed score reports showing correct/incorrect answers.',
    tips: ['Create a test with "+" button', 'Each question has 4 options', 'View detailed reports after each attempt'],
  },
  {
    icon: Calendar,
    title: 'Daily Planner',
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950',
    description: 'Plan your daily study schedule with a calendar view. Add tasks for specific dates and times, mark them complete, and track your daily productivity. Completing tasks updates your study streak.',
    tips: ['Tap a date to view/add tasks', 'Set start times for better scheduling', 'Complete tasks to maintain your streak'],
  },
  {
    icon: Target,
    title: 'Targets',
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950',
    description: 'Set study goals with deadlines to stay motivated. Track active and completed targets. Targets show countdown timers so you always know how much time is left.',
    tips: ['Add a title and deadline for each target', 'Tap the circle to mark as complete', 'Overdue targets are highlighted in red'],
  },
  {
    icon: Bell,
    title: 'Reminders',
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    description: 'Set reminders for important study events, exams, or tasks. Reminders are sorted by date and separated into upcoming and past sections for easy tracking.',
    tips: ['Set date and optional time for each reminder', 'Upcoming reminders appear at the top', 'Delete reminders once done'],
  },
  {
    icon: RotateCcw,
    title: 'Revision',
    color: 'text-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-950',
    description: 'Spaced repetition revision tasks are automatically created when you complete a chapter. Revisions are scheduled at 1, 3, 7, and 21 days after completion for optimal memory retention.',
    tips: ['Complete chapters to auto-schedule revisions', 'Check off revision tasks as you complete them', 'Overdue revisions are highlighted'],
  },
  {
    icon: HelpCircle,
    title: 'Question Bank',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-950',
    description: 'A centralized bank of all practice questions across all subjects and chapters. Filter by subject or chapter, and reveal answers with a tap to test your knowledge.',
    tips: ['Add questions inside each chapter', 'Filter by subject or chapter', 'Tap "Show Answer" to reveal the answer'],
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracker',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-950',
    description: 'Get a bird\'s-eye view of your overall study progress. See chapter completion rates per subject, planner task completion, target achievement, and mock test average scores.',
    tips: ['Check progress regularly to stay motivated', 'Subject progress bars show chapter completion', 'Mock test average is calculated automatically'],
  },
  {
    icon: Trophy,
    title: 'Achievements',
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950',
    description: 'Earn achievements and track your personal bests. Unlock streak badges for consistent study habits. See your rank label based on overall performance.',
    tips: ['Study daily to earn streak achievements', 'Complete more chapters to improve your rank', 'Check your fastest test time and top scores'],
  },
  {
    icon: Flame,
    title: 'Study Streak',
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950',
    description: 'Your study streak tracks consecutive days of activity. Complete planner tasks, finish chapters, or attempt mock tests to keep your streak alive. Earn milestone badges at 3, 7, and 30 days.',
    tips: ['Study every day to build your streak', 'Any activity counts: tasks, chapters, or tests', 'Earn badges at 3, 7, and 30-day milestones'],
  },
  {
    icon: User,
    title: 'Profile & Accounts',
    color: 'text-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-950',
    description: 'Create a personal account to save all your data permanently across sessions. Your data is stored locally on your device. Use the Forgot Password feature with your school name to recover access.',
    tips: ['Register with username, name, school, and class', 'Use "Forgot Password" if you forget your password', 'Guest mode gives temporary access without registration'],
  },
  {
    icon: Star,
    title: 'Guest Mode',
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-950',
    description: 'Try the app without creating an account using Guest Mode. All features are available, but your data will be cleared when you close the browser. Register to save your progress permanently.',
    tips: ['Tap "Continue as Guest" on the login screen', 'All features work in guest mode', 'Register anytime to save your data permanently'],
  },
  {
    icon: BookOpen,
    title: 'Offline Support',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    description: 'Board Saathi works completely offline after the first load. All your data is stored on your device. Install it as a PWA (Add to Home Screen) for a native app-like experience.',
    tips: ['Add to Home Screen for offline access', 'All data is stored locally on your device', 'No internet needed after first load'],
  },
];

export default function AboutPage() {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
          <BookOpen className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">About Board Saathi</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Your complete CBSE Board Exam companion. Everything you need to study smarter, track progress, and ace your exams — all offline.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl mb-8">
        <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">How to use this guide</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Each section below explains a feature of Board Saathi with tips on how to use it effectively. All data is stored on your device — no internet required after first load.
          </p>
        </div>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{feature.description}</p>
                    <div className="space-y-1">
                      {feature.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-primary text-xs mt-0.5 flex-shrink-0">→</span>
                          <span className="text-xs text-muted-foreground">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Board Saathi v1.0 — Built for CBSE students</p>
        <p className="mt-1">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'board-saathi')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
