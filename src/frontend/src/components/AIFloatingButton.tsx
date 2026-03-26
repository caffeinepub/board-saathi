import { Button } from "@/components/ui/button";
import { sendMessageToAI } from "@/utils/aiService";
import { getCurrentUserId } from "@/utils/localStorageService";
import { useNavigate } from "@tanstack/react-router";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function AIFloatingButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [actionResult, setActionResult] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const userId = getCurrentUserId() ?? "guest";

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setResponse("");
      setActionResult("");
      setInput("");
    }
  }, [open]);

  // Get current page context for AI
  const _getPageContext = (): string => {
    const path = window.location.pathname;
    const contextMap: Record<string, string> = {
      "/": "Dashboard - give a quick motivational tip based on my progress",
      "/subjects": "Subjects page - help me with subject management",
      "/planner": "Planner page - help me plan my study schedule",
      "/reminders": "Reminders page - help me set reminders",
      "/targets": "Targets page - help me set study targets",
      "/question-bank": "Question bank - help me with questions",
      "/mind-map": "Mind map - help me create mind maps",
      "/daily-word-booster": "Daily word booster - help me with vocabulary",
      "/one-time-planner": "One-time planner - help me plan recurring tasks",
      "/progress": "Progress page - analyse my progress",
      "/mock-tests": "Mock tests page - give me test tips",
    };
    return contextMap[path] ?? `${path} - help me with this feature`;
  };

  const handleQuickSend = async () => {
    const messageText = input.trim();
    if (!messageText || loading) return;

    setLoading(true);
    setResponse("");
    setActionResult("");

    try {
      const { text, actionResult: ar } = await sendMessageToAI(
        messageText,
        userId,
      );
      setResponse(text);
      if (ar) {
        setActionResult(ar);
        toast.success(`DEV Sir: ${ar}`, { duration: 4000 });
        window.dispatchEvent(new CustomEvent("bs:data-pulled"));
      }
      setInput("");
    } catch {
      setResponse("Sorry, I couldn't connect. Check your internet.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleQuickSend();
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleOpenFullChat = () => {
    setOpen(false);
    navigate({ to: "/ai-chat" });
  };

  return (
    <>
      {/* Quick chat popup */}
      {open && (
        <div className="fixed bottom-24 right-4 lg:bottom-8 z-[200] w-80 sm:w-96">
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-white" />
                <div>
                  <p className="text-white font-bold text-sm">DEV Sir</p>
                  <p className="text-white/70 text-[10px] flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI Assistant · Quick chat
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Response area */}
            {(response || loading) && (
              <div className="px-4 py-3 bg-muted/50 border-b border-border max-h-40 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">DEV Sir is thinking...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-foreground leading-relaxed">
                      {response}
                    </p>
                    {actionResult && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                        <span>✓</span>
                        <span>{actionResult}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Input */}
            <div className="p-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask DEV Sir anything..."
                  className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none border border-border focus:border-violet-400 placeholder:text-muted-foreground"
                />
                <Button
                  size="icon"
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 flex-shrink-0"
                  onClick={handleQuickSend}
                  disabled={loading || !input.trim()}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </Button>
              </div>
              <button
                type="button"
                onClick={handleOpenFullChat}
                className="w-full mt-2 text-xs text-center text-violet-600 dark:text-violet-400 hover:underline font-medium"
              >
                Open full chat →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`fixed bottom-[4.5rem] right-4 lg:bottom-6 z-[199] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open
            ? "bg-muted border-2 border-border"
            : "bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
        }`}
        title="Ask DEV Sir"
      >
        {open ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <Bot className="w-6 h-6 text-white" />
        )}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </button>
    </>
  );
}
