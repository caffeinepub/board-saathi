import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  LogOut, BookOpen, FileText, HelpCircle, ClipboardList,
  CreditCard, TrendingUp, Target, Flame, Trophy, Send,
  MessageSquare, AlertTriangle, Star, ChevronDown, ChevronUp,
  Users, CheckCircle, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  getParentSession,
  clearParentSession,
  getLinkedChildData,
  addNotification,
  LinkedChildData,
  NotificationType,
} from '../utils/localStorageService';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const session = getParentSession();
  const [childData, setChildData] = useState<LinkedChildData | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState<NotificationType>('comment');
  const [sendingComment, setSendingComment] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    subjects: true,
    notes: false,
    questions: false,
    mockTests: true,
    flashcards: false,
    questionBank: false,
  });

  useEffect(() => {
    if (!session) {
      navigate({ to: '/login' });
      return;
    }
    const data = getLinkedChildData(session.parentUsername);
    setChildData(data);
  }, []);

  const handleLogout = () => {
    clearParentSession();
    toast.success('Logged out from parent portal');
    navigate({ to: '/login' });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCommentTypeSelect = (type: NotificationType) => {
    setCommentType(type);
    const prefixes: Record<NotificationType, string> = {
      scold: '⚠️ [Scold]: ',
      comment: '💬 [Comment]: ',
      appreciate: '🌟 [Appreciate]: ',
    };
    // Only set prefix if textarea is empty or starts with a known prefix
    const knownPrefixes = Object.values(prefixes);
    const currentText = commentText;
    const hasPrefix = knownPrefixes.some(p => currentText.startsWith(p));
    if (hasPrefix || currentText === '') {
      setCommentText(prefixes[type]);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !session || !childData) return;
    setSendingComment(true);
    try {
      addNotification(childData.childAccount.username, {
        id: Date.now(),
        from: session.parentUsername,
        type: commentType,
        message: commentText.trim(),
        timestamp: Date.now(),
        read: false,
      });
      toast.success(`Message sent to ${childData.childAccount.name}!`);
      setCommentText('');
      setCommentType('comment');
    } finally {
      setSendingComment(false);
    }
  };

  if (!session) return null;

  if (!childData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Child account not found.</p>
          <Button className="mt-4" onClick={handleLogout}>Go Back</Button>
        </div>
      </div>
    );
  }

  const { childAccount, subjects, chapters, notes, questions, flashcards, mockTests, testAttempts, targets, streak } = childData;
  const childName = childAccount.name;

  // Compute stats
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter(c => c.completed).length;
  const completionPct = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  const avgScore = testAttempts.length > 0
    ? Math.round(testAttempts.reduce((sum, a) => sum + a.report.percentage, 0) / testAttempts.length)
    : 0;

  const completedTargets = targets.filter(t => t.completed).length;
  const learnedFlashcards = flashcards.filter(f => f.learned).length;

  // Mock test status per test
  const testStatusMap: Record<number, { attempted: boolean; count: number; bestScore: number }> = {};
  for (const attempt of testAttempts) {
    if (!testStatusMap[attempt.testId]) {
      testStatusMap[attempt.testId] = { attempted: true, count: 0, bestScore: 0 };
    }
    testStatusMap[attempt.testId].count++;
    if (attempt.report.percentage > testStatusMap[attempt.testId].bestScore) {
      testStatusMap[attempt.testId].bestScore = attempt.report.percentage;
    }
  }

  // Notes per subject/chapter
  const notesCountByChapter: Record<number, number> = {};
  for (const note of notes) {
    notesCountByChapter[note.chapterId] = (notesCountByChapter[note.chapterId] || 0) + 1;
  }

  // Questions per chapter
  const questionsCountByChapter: Record<number, number> = {};
  for (const q of questions) {
    questionsCountByChapter[q.chapterId] = (questionsCountByChapter[q.chapterId] || 0) + 1;
  }

  const SectionHeader = ({ title, icon: Icon, sectionKey, count }: { title: string; icon: React.ElementType; sectionKey: string; count?: number }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        <span className="font-semibold text-foreground">{title}</span>
        {count !== undefined && (
          <Badge variant="secondary" className="text-xs">{count}</Badge>
        )}
      </div>
      {expandedSections[sectionKey] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-background to-emerald-50/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-foreground leading-tight">{session.parentUsername}</p>
              <p className="text-xs text-muted-foreground">Viewing: <span className="font-medium text-amber-700">{childName}</span></p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
          <h1 className="text-xl font-bold mb-1">Parent Dashboard</h1>
          <p className="text-amber-100 text-sm">
            Your child <span className="font-bold text-white">{childName}</span>'s complete academic progress at a glance.
          </p>
        </div>

        {/* Overall Performance */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary">{completionPct}%</div>
            <div className="text-xs text-muted-foreground mt-1">Chapter Completion</div>
            <div className="text-xs text-muted-foreground">{completedChapters}/{totalChapters} chapters</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-blue-600">{avgScore}%</div>
            <div className="text-xs text-muted-foreground mt-1">Avg Mock Score</div>
            <div className="text-xs text-muted-foreground">{testAttempts.length} attempts</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-orange-500 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5" />{streak.currentStreak}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Day Streak</div>
            <div className="text-xs text-muted-foreground">Best: {streak.topStreak}</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-emerald-600">{completedTargets}</div>
            <div className="text-xs text-muted-foreground mt-1">Targets Met</div>
            <div className="text-xs text-muted-foreground">of {targets.length} total</div>
          </Card>
        </div>

        {/* Comment Box - Prominently placed */}
        <Card className="border-2 border-primary/20 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="w-5 h-5 text-primary" />
              Send Feedback to {childName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your message will appear as a notification for your child.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Tone buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleCommentTypeSelect('scold')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  commentType === 'scold'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'border-red-300 text-red-600 hover:bg-red-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Scold 😠
              </button>
              <button
                onClick={() => handleCommentTypeSelect('comment')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  commentType === 'comment'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Comment 💬
              </button>
              <button
                onClick={() => handleCommentTypeSelect('appreciate')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  commentType === 'appreciate'
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                Appreciate 🌟
              </button>
            </div>
            <Textarea
              placeholder={`Write your message to ${childName}...`}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <Button
              onClick={handleSendComment}
              disabled={!commentText.trim() || sendingComment}
              className="w-full gap-2"
            >
              {sendingComment ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</span>
              ) : (
                <><Send className="w-4 h-4" />Send to {childName}</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Subjects Section */}
        <Card className="overflow-hidden">
          <SectionHeader title={`Your child ${childName}'s Subjects`} icon={BookOpen} sectionKey="subjects" count={subjects.length} />
          {expandedSections.subjects && (
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              {subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No subjects found.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {subjects.map(subject => {
                    const subChapters = chapters.filter(c => c.subjectId === subject.id);
                    const completed = subChapters.filter(c => c.completed).length;
                    const pct = subChapters.length > 0 ? Math.round((completed / subChapters.length) * 100) : 0;
                    return (
                      <div key={subject.id} className="p-3 rounded-lg bg-muted/40 border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{subject.name}</span>
                          <span className="text-xs text-muted-foreground">{completed}/{subChapters.length} chapters</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                        <p className="text-xs text-muted-foreground mt-1">{pct}% complete</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Mock Tests Section */}
        <Card className="overflow-hidden">
          <SectionHeader title={`Your child ${childName}'s Mock Tests`} icon={ClipboardList} sectionKey="mockTests" count={mockTests.length} />
          {expandedSections.mockTests && (
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              {mockTests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No mock tests created yet.</p>
              ) : (
                <div className="space-y-2">
                  {mockTests.map(test => {
                    const status = testStatusMap[test.id];
                    const subjectName = subjects.find(s => s.id === test.subjectId)?.name || 'Unknown';
                    return (
                      <div key={test.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{test.name}</p>
                          <p className="text-xs text-muted-foreground">{subjectName} · {test.questions.length} questions</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          {status?.attempted ? (
                            <>
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />Attempted
                              </Badge>
                              <div className="text-right">
                                <p className="text-xs font-medium">{status.bestScore}% best</p>
                                <p className="text-xs text-muted-foreground">{status.count}x</p>
                              </div>
                            </>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              <XCircle className="w-3 h-3 mr-1" />Not Attempted
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Flashcards Section */}
        <Card className="overflow-hidden">
          <SectionHeader title={`Your child ${childName}'s Flashcards`} icon={CreditCard} sectionKey="flashcards" count={flashcards.length} />
          {expandedSections.flashcards && (
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              {flashcards.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No flashcards created yet.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-center">
                      <p className="text-2xl font-bold text-blue-600">{flashcards.length}</p>
                      <p className="text-xs text-blue-600/70">Total Flashcards</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{learnedFlashcards}</p>
                      <p className="text-xs text-emerald-600/70">Marked Learned</p>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {flashcards.map(card => {
                      const subjectName = subjects.find(s => s.id === card.subjectId)?.name || '';
                      const chapterName = chapters.find(c => c.id === card.chapterId)?.name || '';
                      return (
                        <div key={card.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{card.front}</p>
                            <p className="text-xs text-muted-foreground">{subjectName} · {chapterName}</p>
                          </div>
                          {card.learned ? (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs ml-2 flex-shrink-0">Learned</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">Reviewing</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          )}
        </Card>

        {/* Notes Section */}
        <Card className="overflow-hidden">
          <SectionHeader title={`Your child ${childName}'s Notes`} icon={FileText} sectionKey="notes" count={notes.length} />
          {expandedSections.notes && (
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No notes uploaded yet.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {subjects.map(subject => {
                    const subjectChapters = chapters.filter(c => c.subjectId === subject.id);
                    const subjectNotes = notes.filter(n => subjectChapters.some(c => c.id === n.chapterId));
                    if (subjectNotes.length === 0) return null;
                    return (
                      <div key={subject.id}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{subject.name}</p>
                        {subjectChapters.map(chapter => {
                          const chapterNotes = notes.filter(n => n.chapterId === chapter.id);
                          if (chapterNotes.length === 0) return null;
                          return (
                            <div key={chapter.id} className="ml-3 mb-2">
                              <p className="text-sm font-medium">{chapter.name} <span className="text-xs text-muted-foreground">({chapterNotes.length} notes)</span></p>
                              {chapterNotes.map(note => (
                                <div key={note.id} className="ml-3 text-xs text-muted-foreground py-0.5 truncate">
                                  • {note.content.substring(0, 60)}{note.content.length > 60 ? '...' : ''}
                                  {note.imageData && <span className="ml-1 text-blue-500">[📷 image]</span>}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Question Bank Section */}
        <Card className="overflow-hidden">
          <SectionHeader title={`Your child ${childName}'s Question Bank`} icon={HelpCircle} sectionKey="questionBank" count={questions.length} />
          {expandedSections.questionBank && (
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              {questions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No questions added yet.</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {subjects.map(subject => {
                    const subjectQuestions = questions.filter(q => q.subjectId === subject.id);
                    if (subjectQuestions.length === 0) return null;
                    return (
                      <div key={subject.id}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{subject.name} ({subjectQuestions.length})</p>
                        {subjectQuestions.slice(0, 5).map(q => {
                          const chapterName = chapters.find(c => c.id === q.chapterId)?.name || '';
                          return (
                            <div key={q.id} className="ml-3 mb-1.5 p-2 rounded bg-muted/40 border border-border/30">
                              <p className="text-xs font-medium">{q.questionText.substring(0, 80)}{q.questionText.length > 80 ? '...' : ''}</p>
                              <p className="text-xs text-muted-foreground">{chapterName}</p>
                            </div>
                          );
                        })}
                        {subjectQuestions.length > 5 && (
                          <p className="text-xs text-muted-foreground ml-3">+{subjectQuestions.length - 5} more questions</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Overall Performance Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-primary" />
              Your child {childName}'s Overall Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Chapter Completion</span>
                <span className="font-medium">{completedChapters}/{totalChapters}</span>
              </div>
              <Progress value={completionPct} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-muted-foreground">Mock Tests:</span>
                <span className="font-medium">{testAttempts.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <span className="text-muted-foreground">Targets:</span>
                <span className="font-medium">{completedTargets}/{targets.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-500" />
                <span className="text-muted-foreground">Flashcards:</span>
                <span className="font-medium">{learnedFlashcards}/{flashcards.length} learned</span>
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-500" />
                <span className="text-muted-foreground">Questions:</span>
                <span className="font-medium">{questions.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>{' '}
          · © {new Date().getFullYear()} Board Saathi
        </p>
      </main>
    </div>
  );
}
