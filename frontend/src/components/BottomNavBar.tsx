import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Home, BookOpen, HelpCircle, Bell, Target } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/subjects', label: 'Subject', icon: BookOpen, exact: false },
  { to: '/question-bank', label: 'Question', icon: HelpCircle, exact: false },
  { to: '/reminders', label: 'Reminder', icon: Bell, exact: false },
  { to: '/targets', label: 'Target', icon: Target, exact: false },
];

export default function BottomNavBar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isActive = (to: string, exact: boolean) => {
    if (exact) return currentPath === to;
    return currentPath.startsWith(to);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-lg">
      <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
          const active = isActive(to, exact);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-all duration-200 relative
                ${active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-primary/10' : ''}`}>
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              </div>
              <span className={`text-[10px] font-medium leading-none ${active ? 'font-bold' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
