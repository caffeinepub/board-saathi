import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Award,
  Bell,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Heart,
  LogOut,
  MessageSquare,
  Send,
  Target,
  TrendingUp,
  User,
  X,
  Zap,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  type LinkedChildData,
  type ParentSession,
  clearParentSession,
  getLinkedChildData,
  getParentSession,
} from "../utils/localStorageService";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "parent" | "student";
  message: string;
  timestamp: number;
}

interface FeedbackItem {
  id: string;
  type: "comment" | "appreciate" | "scold";
  message: string;
  timestamp: number;
  parentName: string;
  read: boolean;
}

interface Alert {
  id: string;
  type:
    | "inactivity"
    | "low_score"
    | "missed_target"
    | "student_reply"
    | "streak";
  message: string;
  icon: React.ReactNode;
  color: string;
}

// ─── LocalStorage Helpers ────────────────────────────────────────────────────

/**
 * Shared chat key: chat_<parentUsername>_<studentUsername>
 * Must match exactly what StudentMessagesPage uses.
 */
function getChatKey(parentUsername: string, studentUsername: string): string {
  return `chat_${parentUsername}_${studentUsername}`;
}

function getChatMessages(
  parentUsername: string,
  studentUsername: string,
): ChatMessage[] {
  try {
    const key = getChatKey(parentUsername, studentUsername);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveChatMessages(
  parentUsername: string,
  studentUsername: string,
  messages: ChatMessage[],
) {
  const key = getChatKey(parentUsername, studentUsername);
  localStorage.setItem(key, JSON.stringify(messages));
}

function getFeedbackList(studentUsername: string): FeedbackItem[] {
  try {
    const key = `feedback_${studentUsername}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveFeedback(studentUsername: string, feedback: FeedbackItem[]) {
  const key = `feedback_${studentUsername}`;
  localStorage.setItem(key, JSON.stringify(feedback));
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(ts: number): string {
  return `${formatDate(ts)} ${formatTime(ts)}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// Feedback Panel
function StudentFeedbackPanel({
  session,
  studentUsername,
}: {
  session: ParentSession;
  studentUsername: string;
}) {
  const [openType, setOpenType] = useState<
    "comment" | "appreciate" | "scold" | null
  >(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = () => {
    if (!message.trim()) return;
    setSubmitting(true);
    const existing = getFeedbackList(studentUsername);
    const newItem: FeedbackItem = {
      id: Date.now().toString(),
      type: openType!,
      message: message.trim(),
      timestamp: Date.now(),
      parentName: session.parentName,
      read: false,
    };
    saveFeedback(studentUsername, [...existing, newItem]);
    setMessage("");
    setSubmitting(false);
    setOpenType(null);
    setSuccessMsg(
      `${openType === "appreciate" ? "Appreciation" : openType === "scold" ? "Scold" : "Comment"} sent!`,
    );
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const feedbackTypes = [
    {
      type: "comment" as const,
      label: "Comment",
      icon: <MessageSquare className="w-5 h-5" />,
      color: "bg-blue-500 hover:bg-blue-600",
      desc: "Leave a general comment for your child",
    },
    {
      type: "appreciate" as const,
      label: "Appreciate",
      icon: <Heart className="w-5 h-5" />,
      color: "bg-green-500 hover:bg-green-600",
      desc: "Appreciate your child's efforts",
    },
    {
      type: "scold" as const,
      label: "Scold",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "bg-red-500 hover:bg-red-600",
      desc: "Express concern or disappointment",
    },
  ];

  return (
    <Card className="border-0 shadow-md bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <MessageSquare className="w-5 h-5 text-primary" />
          Student Feedback
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Send a message, appreciation, or concern to your child
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {successMsg && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {feedbackTypes.map((ft) => (
            <button
              type="button"
              key={ft.type}
              onClick={() => setOpenType(ft.type)}
              className={`${ft.color} text-white rounded-xl py-3 px-2 flex flex-col items-center gap-1.5 transition-all active:scale-95 shadow-sm`}
            >
              {ft.icon}
              <span className="text-xs font-semibold">{ft.label}</span>
            </button>
          ))}
        </div>

        <Dialog
          open={openType !== null}
          onOpenChange={(o) => !o && setOpenType(null)}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {openType === "comment" && (
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                )}
                {openType === "appreciate" && (
                  <Heart className="w-5 h-5 text-green-500" />
                )}
                {openType === "scold" && (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                {openType === "comment"
                  ? "Leave a Comment"
                  : openType === "appreciate"
                    ? "Appreciate Your Child"
                    : "Express Concern"}
              </DialogTitle>
              <DialogDescription>
                {feedbackTypes.find((f) => f.type === openType)?.desc}
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder={
                openType === "appreciate"
                  ? "e.g. Great job on your test today! I'm proud of you."
                  : openType === "scold"
                    ? "e.g. You need to focus more on your studies."
                    : "e.g. Remember to complete your revision tasks."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenType(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!message.trim() || submitting}
                className={
                  openType === "appreciate"
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : openType === "scold"
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                }
              >
                {submitting ? "Sending..." : "Send"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Live Chat Panel
function LiveChatPanel({
  session,
  studentUsername,
}: {
  session: ParentSession;
  studentUsername: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    // Try scrolling the inner viewport of ScrollArea
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement | null;
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: smooth ? "smooth" : "auto",
        });
        return;
      }
    }
    // Fallback: scroll the bottomRef into view
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  const loadMessages = () => {
    const msgs = getChatMessages(session.parentUsername, studentUsername);
    setMessages(msgs);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadMessages is stable; deps trigger re-setup
  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [session.parentUsername, studentUsername]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll when messages update (from polling)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional scroll on message change
  useEffect(() => {
    scrollToBottom(true);
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: session.parentUsername,
      senderName: session.parentName,
      senderRole: "parent",
      message: input.trim(),
      timestamp: Date.now(),
    };
    const updated = [...messages, newMsg];
    saveChatMessages(session.parentUsername, studentUsername, updated);
    setMessages(updated);
    setInput("");
    // Immediately scroll to bottom after sending
    setTimeout(() => scrollToBottom(true), 50);
  };

  return (
    <Card className="border-0 shadow-md bg-card flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Send className="w-5 h-5 text-primary" />
          Live Chat with Student
          <Badge variant="secondary" className="ml-auto text-xs">
            Live
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Chat updates every 3 seconds
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4 pt-0">
        <div ref={scrollAreaRef}>
          <ScrollArea className="h-52 rounded-lg border bg-muted/30 p-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2 py-8">
                <MessageSquare className="w-8 h-8 opacity-30" />
                <span>No messages yet. Start the conversation!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.senderRole === "parent" ? "items-end" : "items-start"}`}
                  >
                    <span className="text-xs text-muted-foreground mb-0.5">
                      {msg.senderName} · {formatDateTime(msg.timestamp)}
                    </span>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        msg.senderRole === "parent"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-secondary text-secondary-foreground rounded-tl-sm"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Attendance Summary Card
function AttendanceSummaryCard({ childData }: { childData: LinkedChildData }) {
  const { plannerTasks, streak } = childData;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const activeDaysThisMonth = new Set(
    plannerTasks
      .filter((t) => t.date >= monthStart.getTime())
      .map((t) => new Date(t.date).toDateString()),
  ).size;

  const today = new Date().getDate();

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    d.setHours(0, 0, 0, 0);
    const dayStr = d.toDateString();
    const hasActivity = plannerTasks.some(
      (t) => new Date(t.date).toDateString() === dayStr,
    );
    return { date: d, hasActivity };
  });

  return (
    <Card className="border-0 shadow-md bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Flame className="w-5 h-5 text-orange-500" />
          Attendance & Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-orange-500">
              {streak.currentStreak}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Current Streak
            </div>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-primary">
              {activeDaysThisMonth}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Days Active
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {streak.topStreak}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Best Streak
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Last 14 days activity
          </p>
          <div className="flex gap-1 flex-wrap">
            {last14.map((day) => (
              <div
                key={day.date.toISOString()}
                title={day.date.toDateString()}
                className={`w-6 h-6 rounded-sm ${day.hasActivity ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Monthly Progress</span>
            <span>
              {activeDaysThisMonth}/{today} days
            </span>
          </div>
          <Progress
            value={(activeDaysThisMonth / Math.max(today, 1)) * 100}
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Grade Performance Card
function GradePerformanceCard({ childData }: { childData: LinkedChildData }) {
  const { testAttempts } = childData;

  const scores = testAttempts.map((a) => a.report.percentage);
  const best = scores.length ? Math.max(...scores) : 0;
  const avg = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
  const last5 = testAttempts.slice(-5).map((a) => ({
    name: a.report.testName?.slice(0, 8) || "Test",
    score: a.report.percentage,
  }));

  const getBarColor = (score: number) => {
    if (score >= 75) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="border-0 shadow-md bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Grade Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-500">{best}%</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Best Score
            </div>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-primary">{avg}%</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Average Score
            </div>
          </div>
        </div>
        {last5.length > 0 ? (
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Last {last5.length} tests
            </p>
            <div className="flex items-end gap-1 h-16">
              {last5.map((t) => (
                <div
                  key={t.name}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-full rounded-t-sm ${getBarColor(t.score)}`}
                    style={{ height: `${Math.max(t.score, 4)}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                    {t.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            No test attempts yet
          </p>
        )}
        <div className="text-xs text-muted-foreground">
          Total tests attempted:{" "}
          <span className="font-semibold text-foreground">
            {testAttempts.length}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Smart Alerts Card
function SmartAlertsCard({ childData }: { childData: LinkedChildData }) {
  const { testAttempts, targets, streak } = childData;
  const [dismissed, setDismissed] = useState<string[]>([]);

  const alerts: Alert[] = [];

  // Inactivity alert
  if (streak.lastActiveDate > 0) {
    const daysSinceActive = Math.floor(
      (Date.now() - streak.lastActiveDate) / 86400000,
    );
    if (daysSinceActive >= 2) {
      alerts.push({
        id: "inactivity",
        type: "inactivity",
        message: `No activity for ${daysSinceActive} days. Encourage your child to study!`,
        icon: <Clock className="w-4 h-4" />,
        color: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
      });
    }
  }

  // Low score alert
  const recentScores = testAttempts.slice(-3).map((a) => a.report.percentage);
  if (recentScores.length > 0 && recentScores.every((s) => s < 50)) {
    alerts.push({
      id: "low_score",
      type: "low_score",
      message: `Last ${recentScores.length} test(s) scored below 50%. Consider extra help.`,
      icon: <TrendingUp className="w-4 h-4" />,
      color: "text-red-500 bg-red-50 dark:bg-red-900/20",
    });
  }

  // Missed targets
  const missedTargets = targets.filter(
    (t) => !t.completed && t.deadline < Date.now(),
  );
  if (missedTargets.length > 0) {
    alerts.push({
      id: "missed_target",
      type: "missed_target",
      message: `${missedTargets.length} target(s) missed deadline. Review with your child.`,
      icon: <Target className="w-4 h-4" />,
      color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
    });
  }

  // Streak milestone
  if (streak.currentStreak >= 7) {
    alerts.push({
      id: "streak",
      type: "streak",
      message: `🔥 Amazing! ${streak.currentStreak}-day study streak! Keep encouraging them!`,
      icon: <Flame className="w-4 h-4" />,
      color: "text-green-600 bg-green-50 dark:bg-green-900/20",
    });
  }

  const visible = alerts.filter((a) => !dismissed.includes(a.id));

  if (visible.length === 0) return null;

  return (
    <Card className="border-0 shadow-md bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Bell className="w-5 h-5 text-yellow-500" />
          Smart Alerts
          <Badge className="ml-auto bg-yellow-500 text-white text-xs">
            {visible.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-xl p-3 ${alert.color}`}
          >
            <span className="mt-0.5 shrink-0">{alert.icon}</span>
            <p className="text-sm flex-1">{alert.message}</p>
            <button
              type="button"
              onClick={() => setDismissed((prev) => [...prev, alert.id])}
              className="shrink-0 opacity-60 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Upcoming Events Card
function UpcomingEventsCard({ childData }: { childData: LinkedChildData }) {
  const { plannerTasks, targets } = childData;
  const now = Date.now();
  const next7Days = now + 7 * 86400000;

  const upcomingTasks = plannerTasks
    .filter((t) => !t.completed && t.date >= now && t.date <= next7Days)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);

  const upcomingTargets = targets
    .filter((t) => !t.completed && t.deadline >= now && t.deadline <= next7Days)
    .sort((a, b) => a.deadline - b.deadline)
    .slice(0, 3);

  if (upcomingTasks.length === 0 && upcomingTargets.length === 0) {
    return (
      <Card className="border-0 shadow-md bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Calendar className="w-5 h-5 text-purple-500" />
            Upcoming (Next 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming tasks or targets
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Calendar className="w-5 h-5 text-purple-500" />
          Upcoming (Next 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcomingTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0"
          >
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(task.date)}
              </p>
            </div>
          </div>
        ))}
        {upcomingTargets.map((target) => (
          <div
            key={target.id}
            className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0"
          >
            <div className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{target.title}</p>
              <p className="text-xs text-muted-foreground">
                Deadline: {formatDate(target.deadline)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Behavior & Progress Card
function BehaviorProgressCard({ childData }: { childData: LinkedChildData }) {
  const { chapters, revisionTasks, targets } = childData;

  const completedChapters = chapters.filter((c) => c.completed).length;
  const totalChapters = chapters.length;
  const chapterPct =
    totalChapters > 0
      ? Math.round((completedChapters / totalChapters) * 100)
      : 0;

  const completedRevisions = revisionTasks.filter((r) => r.completed).length;
  const totalRevisions = revisionTasks.length;
  const revisionPct =
    totalRevisions > 0
      ? Math.round((completedRevisions / totalRevisions) * 100)
      : 0;

  const completedTargets = targets.filter((t) => t.completed).length;
  const totalTargets = targets.length;
  const targetPct =
    totalTargets > 0 ? Math.round((completedTargets / totalTargets) * 100) : 0;

  const items = [
    {
      label: "Chapters Completed",
      value: chapterPct,
      detail: `${completedChapters}/${totalChapters}`,
      color: "bg-blue-500",
    },
    {
      label: "Revisions Done",
      value: revisionPct,
      detail: `${completedRevisions}/${totalRevisions}`,
      color: "bg-purple-500",
    },
    {
      label: "Targets Achieved",
      value: targetPct,
      detail: `${completedTargets}/${totalTargets}`,
      color: "bg-green-500",
    },
  ];

  return (
    <Card className="border-0 shadow-md bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Brain className="w-5 h-5 text-purple-500" />
          Study Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold">{item.detail}</span>
            </div>
            <Progress value={item.value} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState<ParentSession | null>(null);
  const [childData, setChildData] = useState<LinkedChildData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getParentSession();
    if (!s) {
      navigate({ to: "/login" });
      return;
    }
    setSession(s);
    const data = getLinkedChildData(s.parentUsername);
    setChildData(data);
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    clearParentSession();
    // Full page reload ensures router re-evaluates auth state from scratch
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const studentUsername = session.childUsername;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur border-b border-border/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">
                {session.parentName}
              </p>
              <p className="text-xs text-muted-foreground">
                Viewing: {studentUsername}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-16">
        {/* Hero Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-80 mb-1">Parent Dashboard</p>
              <h1 className="text-2xl font-bold">
                {studentUsername}'s Progress
              </h1>
              <p className="text-sm opacity-80 mt-1">
                Stay connected with your child's studies
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          {childData && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-white/15 rounded-xl p-2.5 text-center">
                <div className="text-xl font-bold">
                  {childData.chapters.filter((c) => c.completed).length}
                </div>
                <div className="text-xs opacity-80">Chapters Done</div>
              </div>
              <div className="bg-white/15 rounded-xl p-2.5 text-center">
                <div className="text-xl font-bold">
                  {childData.testAttempts.length}
                </div>
                <div className="text-xs opacity-80">Tests Taken</div>
              </div>
              <div className="bg-white/15 rounded-xl p-2.5 text-center">
                <div className="text-xl font-bold">
                  {childData.streak.currentStreak}
                </div>
                <div className="text-xs opacity-80">Day Streak</div>
              </div>
            </div>
          )}
        </div>

        {/* Smart Alerts */}
        {childData && <SmartAlertsCard childData={childData} />}

        {/* Feedback Panel */}
        <StudentFeedbackPanel
          session={session}
          studentUsername={studentUsername}
        />

        {/* Live Chat */}
        <LiveChatPanel session={session} studentUsername={studentUsername} />

        {/* Attendance & Streak */}
        {childData && <AttendanceSummaryCard childData={childData} />}

        {/* Grade Performance */}
        {childData && <GradePerformanceCard childData={childData} />}

        {/* Upcoming Events */}
        {childData && <UpcomingEventsCard childData={childData} />}

        {/* Study Progress */}
        {childData && <BehaviorProgressCard childData={childData} />}

        {/* No child data warning */}
        {!childData && (
          <Card className="border-0 shadow-md">
            <CardContent className="py-8 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                Could not load child data.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Make sure your child has logged in on this device at least once.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground pt-4">
          <p>
            Built with <span className="text-red-500">♥</span> using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || "board-saathi")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
          <p className="mt-1">© {new Date().getFullYear()} Board Saathi</p>
        </footer>
      </main>
    </div>
  );
}
