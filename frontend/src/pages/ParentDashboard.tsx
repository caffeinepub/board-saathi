import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  LogOut,
  MessageSquare,
  Send,
  Star,
  AlertTriangle,
  CheckCircle,
  User,
  Clock,
  TrendingUp,
  Brain,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  getParentSession,
  clearParentSession,
  saveParentMessage,
} from '../utils/localStorageService';
import { useGetParentReplies } from '../hooks/useQueries';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChildSubject {
  id: number;
  name: string;
}

interface ChildChapter {
  id: number;
  subjectId: number;
  name: string;
  completed: boolean;
}

interface ChildMockTest {
  id: number;
  name: string;
  subjectId: number;
}

interface ChildTestAttempt {
  id: number;
  testId: number;
  report: { score: number; total: number; percentage: number; testName: string };
  attemptedAt: number;
}

interface ChildFlashcard {
  id: number;
  front: string;
  back: string;
  learned: boolean;
}

interface ChildNote {
  id: number;
  chapterId: number;
  content: string;
}

interface ChildQuestion {
  id: number;
  questionText: string;
  answer: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tryParseArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function getChildDataFromStorage(childUsername: string) {
  const subjects = tryParseArray<ChildSubject>(`subjects_${childUsername}`);
  const chapters = tryParseArray<ChildChapter>(`chapters_${childUsername}`);
  const mockTests = tryParseArray<ChildMockTest>(`mockTests_${childUsername}`);
  const testAttempts = tryParseArray<ChildTestAttempt>(`testAttempts_${childUsername}`);
  const flashcards = tryParseArray<ChildFlashcard>(`flashcards_${childUsername}`);
  const notes = tryParseArray<ChildNote>(`notes_${childUsername}`);
  const questions = tryParseArray<ChildQuestion>(`questions_${childUsername}`);
  return { subjects, chapters, mockTests, testAttempts, flashcards, notes, questions };
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <CardContent className="pt-0 pb-4 px-4 border-t border-border/50">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ParentDashboard() {
  const navigate = useNavigate();
  const session = getParentSession();

  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [sendingType, setSendingType] = useState<'comment' | 'scold' | 'appreciation' | null>(null);

  const { data: replies = [], markAsSeen } = useGetParentReplies(session?.parentUsername ?? null);

  // Mark unseen replies as seen after 2 seconds
  useEffect(() => {
    if (!session?.parentUsername) return;
    const unseen = replies.filter(r => !r.seen);
    if (unseen.length === 0) return;
    const timer = setTimeout(() => {
      unseen.forEach(r => markAsSeen(r.id));
    }, 2000);
    return () => clearTimeout(timer);
  }, [replies, session?.parentUsername, markAsSeen]);

  if (!session) {
    navigate({ to: '/login' });
    return null;
  }

  const childData = getChildDataFromStorage(session.childUsername);
  const sortedReplies = [...replies].sort((a, b) => b.repliedAt - a.repliedAt);

  const handleSendMessage = (type: 'comment' | 'scold' | 'appreciation') => {
    if (!messageText.trim()) return;
    setSendingType(type);

    saveParentMessage(session.childUsername, {
      fromParent: session.parentUsername,
      message: messageText.trim(),
      type,
    });

    setMessageText('');
    setMessageSent(true);
    setSendingType(null);

    setTimeout(() => setMessageSent(false), 3000);
  };

  const handleLogout = () => {
    clearParentSession();
    navigate({ to: '/login' });
  };

  // Compute stats
  const totalChapters = childData.chapters.length;
  const completedChapters = childData.chapters.filter(c => c.completed).length;
  const totalFlashcards = childData.flashcards.length;
  const learnedFlashcards = childData.flashcards.filter(f => f.learned).length;
  const totalTests = childData.mockTests.length;
  const attemptedTests = childData.testAttempts.length;
  const avgScore =
    childData.testAttempts.length > 0
      ? Math.round(
          childData.testAttempts.reduce((sum, a) => sum + a.report.percentage, 0) /
            childData.testAttempts.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-sm leading-tight">Parent Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                Viewing:{' '}
                <span className="font-medium text-foreground">{session.childUsername}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Hi, <span className="font-medium text-foreground">{session.parentName}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Chapters Done',
              value: `${completedChapters}/${totalChapters}`,
              icon: BookOpen,
              color: 'text-primary',
            },
            {
              label: 'Tests Attempted',
              value: `${attemptedTests}/${totalTests}`,
              icon: ClipboardList,
              color: 'text-blue-500',
            },
            {
              label: 'Avg Score',
              value: `${avgScore}%`,
              icon: TrendingUp,
              color: 'text-green-500',
            },
            {
              label: 'Flashcards',
              value: `${learnedFlashcards}/${totalFlashcards}`,
              icon: Brain,
              color: 'text-purple-500',
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color} shrink-0`} />
                <div>
                  <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Send Message */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Send Message to {session.childUsername}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Write a message to your child..."
              className="resize-none"
              rows={3}
            />
            {messageSent && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Message sent successfully!
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-green-500/40 text-green-700 hover:bg-green-50"
                onClick={() => handleSendMessage('appreciation')}
                disabled={!messageText.trim() || sendingType !== null}
              >
                <Star className="w-3.5 h-3.5" />
                Appreciate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-blue-500/40 text-blue-700 hover:bg-blue-50"
                onClick={() => handleSendMessage('comment')}
                disabled={!messageText.trim() || sendingType !== null}
              >
                <Send className="w-3.5 h-3.5" />
                Comment
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-red-500/40 text-red-700 hover:bg-red-50"
                onClick={() => handleSendMessage('scold')}
                disabled={!messageText.trim() || sendingType !== null}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Scold
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Replies from child */}
        {sortedReplies.length > 0 && (
          <Section title="Replies from Child" icon={MessageSquare} defaultOpen>
            <div className="space-y-3 mt-3">
              {sortedReplies.map(reply => (
                <div
                  key={reply.id}
                  className={`p-3 rounded-lg border ${
                    !reply.seen ? 'border-primary/40 bg-primary/5' : 'border-border bg-accent/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-foreground">{reply.fromChild}</span>
                      {!reply.seen && (
                        <Badge className="text-[9px] h-4 px-1.5">New</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(reply.repliedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Re: "{reply.originalMessage.slice(0, 60)}{reply.originalMessage.length > 60 ? '…' : ''}"
                  </p>
                  <p className="text-sm text-foreground">{reply.replyText}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Child Data Sections */}
        <Section title={`Chapters (${completedChapters}/${totalChapters} completed)`} icon={BookOpen} defaultOpen>
          {childData.chapters.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-3">No chapters added yet.</p>
          ) : (
            <div className="space-y-1.5 mt-3">
              {childData.chapters.map(ch => (
                <div key={ch.id} className="flex items-center gap-2 text-sm">
                  {ch.completed ? (
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <span className={ch.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>
                    {ch.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title={`Test Attempts (${attemptedTests} attempts)`} icon={ClipboardList}>
          {childData.testAttempts.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-3">No tests attempted yet.</p>
          ) : (
            <div className="space-y-2 mt-3">
              {childData.testAttempts.slice(-5).reverse().map(attempt => (
                <div key={attempt.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-accent/50">
                  <span className="text-foreground font-medium truncate flex-1 mr-2">
                    {attempt.report.testName}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={attempt.report.percentage >= 60 ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {attempt.report.percentage}%
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(attempt.attemptedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title={`Flashcards (${learnedFlashcards}/${totalFlashcards} learned)`} icon={Brain}>
          {childData.flashcards.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-3">No flashcards created yet.</p>
          ) : (
            <div className="space-y-1.5 mt-3">
              {childData.flashcards.slice(0, 10).map(card => (
                <div key={card.id} className="flex items-center gap-2 text-sm">
                  {card.learned ? (
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <span className="text-foreground truncate">{card.front}</span>
                </div>
              ))}
              {childData.flashcards.length > 10 && (
                <p className="text-xs text-muted-foreground">
                  +{childData.flashcards.length - 10} more flashcards
                </p>
              )}
            </div>
          )}
        </Section>
      </main>
    </div>
  );
}
