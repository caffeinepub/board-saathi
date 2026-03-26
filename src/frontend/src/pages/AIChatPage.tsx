import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  type AIChatMessage,
  clearAIChatHistory,
  getAIChatHistory,
  getAIUserProfile,
  sendMessageToAI,
} from "@/utils/aiService";
import { getCurrentUserId } from "@/utils/localStorageService";
import {
  Bell,
  BookOpen,
  Bot,
  Brain,
  ChevronDown,
  Loader2,
  Send,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

const QUICK_PROMPTS = [
  {
    icon: TrendingUp,
    label: "Analyse my progress",
    text: "Analyse my overall study progress and tell me where I stand for board exams",
  },
  {
    icon: Target,
    label: "Set a study target",
    text: "Help me set a study target for this week based on my current progress",
  },
  {
    icon: Bell,
    label: "Add reminder",
    text: "Add a reminder for me to study Maths tomorrow at 6 PM",
  },
  {
    icon: Brain,
    label: "Weak areas",
    text: "What are my weak areas and how can I improve them?",
  },
  {
    icon: BookOpen,
    label: "Study plan",
    text: "Create a 30-day study plan for my board exam preparation",
  },
  {
    icon: Zap,
    label: "Motivate me",
    text: "I'm feeling demotivated. Give me a boost to study right now!",
  },
];

export default function AIChatPage() {
  const userId = getCurrentUserId() ?? "guest";
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const aiProfile = getAIUserProfile(userId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const history = getAIChatHistory(userId);
    setMessages(history);
    setTimeout(() => scrollToBottom(), 100);
  }, [userId, scrollToBottom]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;
    setShowScrollBtn(!isNearBottom);
  };

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = (text ?? input).trim();
      if (!messageText || loading) return;

      setInput("");
      setLoading(true);

      // Optimistically add user message
      const tempUserMsg: AIChatMessage = {
        role: "user",
        text: messageText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);
      setTimeout(() => scrollToBottom(), 50);

      try {
        const { actionResult } = await sendMessageToAI(messageText, userId);

        // Reload from storage (authoritative)
        const updatedHistory = getAIChatHistory(userId);
        setMessages(updatedHistory);

        if (actionResult) {
          toast.success(`AI Action: ${actionResult}`, { duration: 4000 });
          // Invalidate queries so UI updates
          window.dispatchEvent(new CustomEvent("bs:data-pulled"));
        }
      } catch {
        toast.error("Could not reach DEV Sir. Check your internet connection.");
        // Remove the optimistic user message
        setMessages(getAIChatHistory(userId));
      } finally {
        setLoading(false);
        setTimeout(() => scrollToBottom(), 100);
      }
    },
    [input, loading, userId, scrollToBottom],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClearHistory = () => {
    clearAIChatHistory(userId);
    setMessages([]);
    toast.success("Chat history cleared");
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div>
              <h1 className="font-black text-base text-foreground">DEV Sir</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-violet-500" />
                AI Study Assistant · Always learning
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs hidden sm:flex">
              {aiProfile.totalChats} chats
            </Badge>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-destructive"
                onClick={handleClearHistory}
                title="Clear history"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl mb-4">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-black text-foreground mb-2">
              Namaste! I'm DEV Sir
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Your personal AI study assistant. I know your subjects, progress,
              and study patterns. Ask me anything — I can even add reminders and
              targets for you!
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {QUICK_PROMPTS.map(({ icon: Icon, label, text }) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => sendMessage(text)}
                  className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card hover:bg-muted text-left transition-colors"
                >
                  <Icon className="w-4 h-4 text-violet-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={`${msg.timestamp}_${i}`}
                className={`flex gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    msg.role === "user"
                      ? "bg-primary/20"
                      : "bg-gradient-to-br from-violet-500 to-purple-600"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 text-primary" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[78%] ${
                    msg.role === "user" ? "items-end" : "items-start"
                  } flex flex-col gap-1`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm border border-border"
                    }`}
                  >
                    {msg.text.split("\n").map((line, li) => (
                      <React.Fragment key={`${msg.timestamp}_line_${li}`}>
                        {line}
                        {li < msg.text.split("\n").length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Action performed badge */}
                  {msg.actionPerformed && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-full">
                      <Zap className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                        {msg.actionPerformed}
                      </span>
                    </div>
                  )}

                  <span className="text-[10px] text-muted-foreground px-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-muted border border-border px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="fixed bottom-28 right-4 z-20 w-8 h-8 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Quick prompts for non-empty history */}
      {messages.length > 0 && !loading && (
        <div className="px-4 py-2 border-t border-border">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_PROMPTS.slice(0, 4).map(({ label, text }) => (
              <button
                type="button"
                key={label}
                onClick={() => sendMessage(text)}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition-colors font-medium text-foreground"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-end gap-2 bg-muted rounded-2xl px-4 py-2 border border-border">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask DEV Sir anything..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground leading-relaxed py-1 min-h-[24px] max-h-[120px]"
          />
          <Button
            size="icon"
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 flex-shrink-0 shadow-md"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          DEV Sir can add reminders, targets, and questions directly
        </p>
      </div>
    </div>
  );
}
