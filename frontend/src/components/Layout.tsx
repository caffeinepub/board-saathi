import { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from '@tanstack/react-router';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Bell,
  Target,
  BarChart2,
  User,
  Menu,
  X,
  LogOut,
  ClipboardList,
  HelpCircle,
  Zap,
  Crown,
} from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import CalendarWidget from './CalendarWidget';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/planner', label: 'Planner', icon: Calendar },
  { path: '/subjects', label: 'Subjects', icon: BookOpen },
  { path: '/question-bank', label: 'Question Bank', icon: HelpCircle },
  { path: '/mock-tests', label: 'Mock Tests', icon: ClipboardList },
  { path: '/progress', label: 'Progress', icon: BarChart2 },
  { path: '/reminders', label: 'Reminders', icon: Bell },
  { path: '/targets', label: 'Targets', icon: Target },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col bg-sidebar border-r border-sidebar-border shadow-sm transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-sidebar-border">
          <img
            src="/assets/generated/board-saathi-logo.dim_256x256.png"
            alt="Board Saathi"
            className="w-9 h-9 rounded-xl object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/generated/board-saathi-icon.dim_512x512.png';
            }}
          />
          <div>
            <span className="font-bold text-sidebar-foreground text-base leading-tight block">Board Saathi</span>
            <span className="text-xs text-sidebar-foreground/50">CBSE Class 10</span>
          </div>
          <button
            className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <Icon size={18} className={active ? 'text-sidebar-primary' : 'text-sidebar-foreground/50'} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Pro Button */}
        <div className="px-3 pb-2">
          <Link
            to="/pro"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:from-amber-500 hover:to-orange-600 transition-all"
          >
            <Crown size={18} className="text-white" />
            <span>Upgrade to Pro</span>
            <Zap size={14} className="ml-auto text-white/80" />
          </Link>
        </div>

        {/* Logout */}
        <div className="px-3 pb-4 pt-1 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:bg-red-900/30 hover:text-red-300 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          {/* Calendar Widget */}
          <CalendarWidget />
          {/* User avatar */}
          {identity && (
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
              {identity.getPrincipal().toString().slice(0, 2).toUpperCase()}
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
