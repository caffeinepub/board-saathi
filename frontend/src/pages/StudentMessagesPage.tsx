import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Heart,
  AlertTriangle,
  Send,
  Inbox,
  CheckCircle2,
  Clock,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FeedbackItem {
  id: string;
  type: 'comment' | 'appreciate' | 'scold';
  message: string;
  timestamp: number;
  parentName: string;
  read: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'parent' | 'student';
  message: string;
  timestamp: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCurrentStudentUsername(): string {
  try {
    const raw = localStorage.getItem('current_user');
    if (raw) {
      const u = JSON.parse(raw);
      return u.username || 'student';
    }
    // fallback: try auth
    const auth = localStorage.getItem('auth_user');
    if (auth) {
      const a = JSON.parse(auth);
      return a.username || 'student';
    }
  } catch {}
  return 'student';
}

function getParentUsername(studentUsername: string): string {
  try {
    // Try to find a parent linked to this student
    const raw = localStorage.getItem(`parent_for_${studentUsername}`);
    if (raw) return raw;
    // fallback: scan parent sessions
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('parent_')) {
        try {
          const val = JSON.parse(localStorage.getItem(key) || '{}');
          if (val.linkedStudentUsername === studentUsername) {
            return val.username || '';
          }
        } catch {}
      }
    }
  } catch {}
  return '';
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

function markFeedbackRead(studentUsername: string, id: string) {
  try {
    const key = `feedback_${studentUsername}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const items: FeedbackItem[] = JSON.parse(raw);
    const updated = items.map((f) => (f.id === id ? { ...f, read: true } : f));
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {}
}

function getChatMessages(parentUsername: string, studentUsername: string): ChatMessage[] {
  try {
    const key = `chat_${parentUsername}_${studentUsername}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveChatMessages(parentUsername: string, studentUsername: string, messages: ChatMessage[]) {
  const key = `chat_${parentUsername}_${studentUsername}`;
  localStorage.setItem(key, JSON.stringify(messages));
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Feedback Badge Config ────────────────────────────────────────────────────

const feedbackConfig = {
  comment: {
    label: 'Comment',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200',
    cardClass: 'border-l-4 border-l-blue-400',
  },
  appreciate: {
    label: 'Appreciation',
    icon: <Heart className="w-3.5 h-3.5" />,
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200',
    cardClass: 'border-l-4 border-l-green-400',
  },
  scold: {
    label: 'Concern',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200',
    cardClass: 'border-l-4 border-l-red-400',
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentMessagesPage() {
  const studentUsername = getCurrentStudentUsername();
  const parentUsername = getParentUsername(studentUsername);

  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'feedback' | 'chat'>('feedback');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load feedback
  useEffect(() => {
    const items = getFeedbackList(studentUsername);
    setFeedbackItems(items.sort((a, b) => b.timestamp - a.timestamp));
  }, [studentUsername]);

  // Load & poll chat
  const loadChat = () => {
    if (!parentUsername) return;
    const msgs = getChatMessages(parentUsername, studentUsername);
    setChatMessages(msgs);
  };

  useEffect(() => {
    loadChat();
    const interval = setInterval(loadChat, 3000);
    return () => clearInterval(interval);
  }, [parentUsername, studentUsername]);

  useEffect(() => {
    if (activeTab === 'chat') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleMarkRead = (id: string) => {
    markFeedbackRead(studentUsername, id);
    setFeedbackItems((prev) =>
      prev.map((f) => (f.id === id ? { ...f, read: true } : f))
    );
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !parentUsername) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: studentUsername,
      senderName: studentUsername,
      senderRole: 'student',
      message: chatInput.trim(),
      timestamp: Date.now(),
    };
    const updated = [...chatMessages, newMsg];
    saveChatMessages(parentUsername, studentUsername, updated);
    setChatMessages(updated);
    setChatInput('');
  };

  const unreadCount = feedbackItems.filter((f) => !f.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <Inbox className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Messages from Parent</h1>
          <p className="text-sm text-muted-foreground">Feedback and live chat with your parent</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-muted rounded-xl p-1">
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'feedback'
              ? 'bg-card shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Feedback
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 h-4">{unreadCount}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-card shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Live Chat
        </button>
      </div>

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="space-y-3">
          {feedbackItems.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <Inbox className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No feedback from your parent yet</p>
                <p className="text-xs text-muted-foreground mt-1">Check back later!</p>
              </CardContent>
            </Card>
          ) : (
            feedbackItems.map((item) => {
              const config = feedbackConfig[item.type];
              return (
                <Card
                  key={item.id}
                  className={`border-0 shadow-sm ${config.cardClass} ${!item.read ? 'bg-card' : 'bg-muted/30'}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${config.badgeClass}`}
                          >
                            {config.icon}
                            {config.label}
                          </span>
                          {!item.read && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{item.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(item.timestamp)}
                          </span>
                          <span>From: {item.parentName}</span>
                        </div>
                      </div>
                      {!item.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkRead(item.id)}
                          className="shrink-0 text-xs h-7 px-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Chat with Parent
              <Badge variant="secondary" className="ml-auto text-xs">Live · updates every 3s</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <ScrollArea className="h-64 rounded-lg border bg-muted/30 p-3">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2 py-8">
                  <MessageSquare className="w-8 h-8 opacity-30" />
                  <span>No messages yet</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.senderRole === 'student' ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-xs text-muted-foreground mb-0.5">
                        {msg.senderName} · {formatDateTime(msg.timestamp)}
                      </span>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          msg.senderRole === 'student'
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-secondary text-secondary-foreground rounded-tl-sm'
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
            {!parentUsername ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                No parent linked to your account yet
              </p>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Reply to your parent..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  size="icon"
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
