import React, { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Send, CheckCheck, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  getCurrentUserId,
  getUserAccountById,
  updateMessageReply,
  saveChildReplyToParent,
} from '../utils/localStorageService';
import { useGetChildMessages } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import type { ParentMessage } from '../utils/localStorageService';

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

function TypeBadge({ type }: { type: ParentMessage['type'] }) {
  const config: Record<string, { label: string; className: string }> = {
    appreciation: { label: 'Appreciation 🌟', className: 'bg-green-100 text-green-700 border-green-300' },
    scold: { label: 'Scold ⚠️', className: 'bg-red-100 text-red-700 border-red-300' },
    comment: { label: 'Comment 💬', className: 'bg-blue-100 text-blue-700 border-blue-300' },
  };
  const { label, className } = config[type] ?? config.comment;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${className}`}>
      {label}
    </span>
  );
}

interface MessageCardProps {
  message: ParentMessage;
  currentUsername: string;
  onMarkRead: (id: string) => void;
}

function MessageCard({ message, currentUsername, onMarkRead }: MessageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const queryClient = useQueryClient();

  const handleExpand = () => {
    if (!expanded && !message.read) {
      onMarkRead(message.id);
    }
    setExpanded(prev => !prev);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const now = Date.now();
      const replyId = now.toString() + Math.random().toString(36).slice(2);

      // Update the message with the reply text
      updateMessageReply(message.id, replyText.trim());

      // Save reply to parent's inbox
      saveChildReplyToParent(message.fromParent, {
        id: replyId,
        fromChild: currentUsername,
        originalMessageId: message.id,
        originalMessage: message.message,
        replyText: replyText.trim(),
        repliedAt: now,
      });

      queryClient.invalidateQueries({ queryKey: ['childMessages', currentUsername] });

      setSent(true);
      setReplyText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card
      className={`transition-all duration-200 ${
        !message.read
          ? 'border-primary/50 shadow-md bg-primary/5'
          : 'border-border bg-card'
      }`}
    >
      <div
        className="flex items-start justify-between p-4 cursor-pointer select-none"
        onClick={handleExpand}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground text-sm">{message.fromParent}</span>
              <TypeBadge type={message.type} />
              {!message.read && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                  New
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimestamp(message.timestamp)}
            </p>
            {!expanded && (
              <p className="text-sm text-muted-foreground mt-1 truncate">{message.message}</p>
            )}
          </div>
        </div>
        <div className="ml-2 shrink-0">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <CardContent className="pt-0 pb-4 px-4 border-t border-border/50">
          {/* Full message */}
          <div className="mt-3 p-3 rounded-lg bg-accent/50">
            <p className="text-sm text-foreground leading-relaxed">{message.message}</p>
          </div>

          {/* Reply section */}
          <div className="mt-4">
            {message.reply ? (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCheck className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">Your Reply</span>
                  {message.repliedAt && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatTimestamp(message.repliedAt)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground">{message.reply}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Reply to this message:</p>
                <Textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  className="text-sm resize-none"
                  rows={3}
                  disabled={sending || sent}
                />
                <div className="flex items-center justify-between">
                  {sent && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCheck className="w-3 h-3" /> Reply sent!
                    </span>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sending || sent}
                    className="ml-auto flex items-center gap-1.5"
                  >
                    {sending ? (
                      <span className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    {sending ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function StudentMessagesPage() {
  const userId = getCurrentUserId();
  const account = userId && userId !== 'guest' ? getUserAccountById(userId) : null;
  const username = account?.username ?? null;

  const { data: messages = [], isLoading, markAsRead } = useGetChildMessages(username);

  // Sort newest first
  const sortedMessages = [...messages].sort((a, b) => b.timestamp - a.timestamp);

  if (!username) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please log in to view messages.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Messages from Parents</h1>
          <p className="text-sm text-muted-foreground">
            {sortedMessages.length} message{sortedMessages.length !== 1 ? 's' : ''}
            {sortedMessages.filter(m => !m.read).length > 0 && (
              <span className="ml-2 text-primary font-medium">
                · {sortedMessages.filter(m => !m.read).length} unread
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Messages List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl bg-accent animate-pulse" />
          ))}
        </div>
      ) : sortedMessages.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No messages yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              When your parent sends you a message, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedMessages.map(msg => (
            <MessageCard
              key={msg.id}
              message={msg}
              currentUsername={username}
              onMarkRead={markAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
