import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard, Calendar, BookMarked, HelpCircle,
  ClipboardList, TrendingUp, Bell, Target, User, LogOut,
  Menu, X, RotateCcw, Trophy, CreditCard, Info, LogIn, UserPlus,
  AlertTriangle, MessageSquare, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  clearCurrentSession,
  isGuest,
  getCurrentUserId,
  getUserAccountById,
  getNotifications,
  markNotificationRead,
  LocalNotification,
  NotificationType,
} from '../utils/localStorageService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import PWAInstallBanner from './PWAInstallBanner';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/subjects', label: 'Subjects', icon: BookMarked },
  { path: '/planner', label: 'Planner', icon: Calendar },
  { path: '/flashcards', label: 'Flashcards', icon: CreditCard },
  { path: '/mock-tests', label: 'Mock Tests', icon: ClipboardList },
  { path: '/question-bank', label: 'Question Bank', icon: HelpCircle },
  { path: '/revision', label: 'Revision', icon: RotateCcw },
  { path: '/targets', label: 'Targets', icon: Target },
  { path: '/reminders', label: 'Reminders', icon: Bell },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/achievements', label: 'Achievements', icon: Trophy },
  { path: '/about', label: 'About', icon: Info },
];

function getNotificationTypeColor(type: NotificationType): string {
  switch (type) {
    case 'scold': return 'bg-red-100 text-red-700 border-red-200';
    case 'appreciate': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'comment': return 'bg-blue-100 text-blue-700 border-blue-200';
  }
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'scold': return <AlertTriangle className="w-3 h-3" />;
    case 'appreciate': return <Star className="w-3 h-3" />;
    case 'comment': return <MessageSquare className="w-3 h-3" />;
  }
}

function formatNotificationTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const guest = isGuest();

  // Get current username for notifications
  const getCurrentUsername = useCallback((): string | null => {
    const userId = getCurrentUserId();
    if (!userId || userId === 'guest') return null;
    const account = getUserAccountById(userId);
    return account?.username || null;
  }, []);

  const refreshNotifications = useCallback(() => {
    const username = getCurrentUsername();
    if (username) {
      setNotifications(getNotifications(username));
    }
  }, [getCurrentUsername]);

  useEffect(() => {
    refreshNotifications();
  }, [location.pathname, refreshNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = (notifId: number) => {
    const username = getCurrentUsername();
    if (!username) return;
    markNotificationRead(username, notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    const username = getCurrentUsername();
    if (!username) return;
    notifications.forEach(n => {
      if (!n.read) markNotificationRead(username, n.id);
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    clearCurrentSession();
    queryClient.clear();
    toast.success('Logged out successfully');
    navigate({ to: '/login' });
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const NotificationBell = () => (
    <Popover open={notifOpen} onOpenChange={open => { setNotifOpen(open); if (open) refreshNotifications(); }}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-md hover:bg-muted transition-colors">
          <Bell className="w-4 h-4 text-sidebar-foreground/70" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {[...notifications].reverse().map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleMarkRead(notif.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${getNotificationTypeColor(notif.type)}`}>
                          {getNotificationIcon(notif.type)}
                          {notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">from {notif.from}</span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatNotificationTime(notif.timestamp)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <img
          src="/assets/generated/board-saathi-logo.dim_256x256.png"
          alt="Board Saathi"
          className="w-9 h-9 rounded-xl flex-shrink-0 shadow-sm object-contain"
          onError={(e) => {
            const target = e.currentTarget;
            target.src = '/assets/generated/app-icon-192.dim_192x192.png';
          }}
        />
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm text-sidebar-foreground">Board Saathi</h1>
          <p className="text-xs text-sidebar-foreground/60">CBSE Companion</p>
        </div>
        {!guest && <NotificationBell />}
      </div>

      {/* Guest badge */}
      {guest && (
        <div className="mx-3 mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-xs text-amber-600 font-medium">Guest Mode</p>
          <p className="text-xs text-amber-600/70">Data clears on browser close</p>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => { navigate({ to: item.path }); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        {guest ? (
          <>
            <Button
              variant="default"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => { navigate({ to: '/login' }); setSidebarOpen(false); }}
            >
              <LogIn className="w-4 h-4" />Login
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => { navigate({ to: '/login' }); setSidebarOpen(false); }}
            >
              <UserPlus className="w-4 h-4" />Register
            </Button>
          </>
        ) : (
          <>
            <button
              onClick={() => { navigate({ to: '/profile' }); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive('/profile')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <User className="w-4 h-4 flex-shrink-0" />
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-sidebar-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white flex flex-col shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/board-saathi-logo.dim_256x256.png"
              alt="Board Saathi"
              className="w-7 h-7 rounded-lg shadow-sm object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.src = '/assets/generated/app-icon-192.dim_192x192.png';
              }}
            />
            <span className="font-bold text-sm">Board Saathi</span>
          </div>
          {!guest ? (
            <div className="relative">
              <NotificationBell />
            </div>
          ) : (
            <div className="w-9" />
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  );
}
