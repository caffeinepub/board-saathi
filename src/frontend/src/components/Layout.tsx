import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  Calendar,
  CheckSquare,
  ClipboardList,
  FileText,
  GitBranch,
  HelpCircle,
  Info,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  RotateCcw,
  Target,
  TrendingUp,
  Trophy,
  User,
  WifiOff,
  X,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useGetChildMessages } from "../hooks/useQueries";
import {
  clearCurrentSession,
  getCurrentUserId,
  getUserAccountById,
  isGuest,
} from "../utils/localStorageService";
import BottomNavBar from "./BottomNavBar";

const NAV_LINKS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/subjects", icon: BookOpen, label: "Subjects", exact: false },
  { to: "/planner", icon: Calendar, label: "Planner", exact: false },
  { to: "/reminders", icon: Bell, label: "Reminders", exact: false },
  { to: "/targets", icon: Target, label: "Targets", exact: false },
  {
    to: "/question-bank",
    icon: HelpCircle,
    label: "Question Bank",
    exact: false,
  },
  { to: "/mock-tests", icon: ClipboardList, label: "Mock Tests", exact: false },
  { to: "/revision", icon: RotateCcw, label: "Revision", exact: false },
  { to: "/flashcards", icon: Layers, label: "Flashcards", exact: false },
  { to: "/progress", icon: TrendingUp, label: "Progress", exact: false },
  { to: "/achievements", icon: Trophy, label: "Achievements", exact: false },
  { to: "/messages", icon: MessageSquare, label: "Messages", exact: false },
  { to: "/exam-paper", icon: FileText, label: "Exam Paper", exact: false },
  { to: "/mind-map", icon: GitBranch, label: "Mind Map", exact: false },
  {
    to: "/answer-evaluator",
    icon: CheckSquare,
    label: "Answer Eval",
    exact: false,
  },
  { to: "/profile", icon: User, label: "Profile", exact: false },
  { to: "/about", icon: Info, label: "About", exact: false },
];

export default function Layout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const guest = isGuest();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online!", { duration: 3000 });
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getCurrentUsername = (): string | null => {
    const userId = getCurrentUserId();
    if (!userId || userId === "guest") return null;
    const account = getUserAccountById(userId);
    return account?.username || null;
  };

  const currentUsername = getCurrentUsername();
  const { unreadCount } = useGetChildMessages(guest ? null : currentUsername);

  const handleLogout = () => {
    clearCurrentSession();
    queryClient.clear();
    toast.success("Logged out successfully");
    navigate({ to: "/login" });
  };

  const userId = getCurrentUserId();
  const account =
    userId && userId !== "guest" ? getUserAccountById(userId) : null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Offline banner — fixed at top, above everything */}
      {!isOnline && (
        <output
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold"
          style={{
            background: "oklch(0.38 0.13 200)",
            color: "#fff",
          }}
          aria-live="polite"
        >
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>You are offline — Some features may be limited</span>
        </output>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col w-64 border-r border-border bg-card fixed left-0 h-full z-40 ${
          !isOnline ? "top-10" : "top-0"
        }`}
        style={{ height: !isOnline ? "calc(100% - 40px)" : "100%" }}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/favicon.dim_32x32.png"
              alt="Board Saathi"
              className="w-8 h-8 rounded-lg"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "/assets/generated/app-icon-192.dim_192x192.png";
              }}
            />
            <div>
              <h1 className="font-black text-sm text-foreground">
                Board Saathi
              </h1>
              <p className="text-[10px] text-muted-foreground">CBSE Class 10</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_LINKS.map(({ to, icon: Icon, label, exact }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              activeProps={{
                className:
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary",
              }}
              activeOptions={{ exact }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {label === "Messages" && unreadCount > 0 && (
                <span className="w-5 h-5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          {account && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {account.name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  @{account.username}
                </p>
              </div>
            </div>
          )}
          {guest ? (
            <Button
              variant="default"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => navigate({ to: "/login" })}
            >
              Login / Register
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: overlay dismiss, keyboard handled by X button inside drawer
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-card border-r border-border z-50 transform transition-transform duration-300 lg:hidden flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/favicon.dim_32x32.png"
              alt="Board Saathi"
              className="w-8 h-8 rounded-lg"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "/assets/generated/app-icon-192.dim_192x192.png";
              }}
            />
            <div>
              <h1 className="font-black text-sm text-foreground">
                Board Saathi
              </h1>
              <p className="text-[10px] text-muted-foreground">CBSE Class 10</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_LINKS.map(({ to, icon: Icon, label, exact }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              activeProps={{
                className:
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary",
              }}
              activeOptions={{ exact }}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {label === "Messages" && unreadCount > 0 && (
                <span className="w-5 h-5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          {guest ? (
            <Button
              variant="default"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => {
                navigate({ to: "/login" });
                setSidebarOpen(false);
              }}
            >
              Login / Register
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div
        className="flex-1 lg:ml-64 flex flex-col min-h-screen"
        style={{ paddingTop: !isOnline ? "40px" : undefined }}
      >
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-1.5">
            <img
              src="/assets/generated/favicon.dim_32x32.png"
              alt=""
              className="w-6 h-6 rounded"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "/assets/generated/app-icon-192.dim_192x192.png";
              }}
            />
            <span className="font-black text-sm">Board Saathi</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate({ to: "/messages" })}
          >
            <MessageSquare className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </header>

        <main className="flex-1 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom Nav Bar - mobile only */}
      <div className="lg:hidden">
        <BottomNavBar />
      </div>
    </div>
  );
}
