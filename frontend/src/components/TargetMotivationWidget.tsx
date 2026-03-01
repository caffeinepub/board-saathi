import React from 'react';
import { Trophy, Star, Zap } from 'lucide-react';
import type { LocalTarget } from '../utils/localStorageService';

interface TargetMotivationWidgetProps {
  targets: LocalTarget[];
}

const MOTIVATIONAL_MESSAGES = [
  "You're unstoppable! Keep pushing! 🔥",
  "Champions never quit! Go for 100%! 💪",
  "Every target completed is a victory! 🏆",
  "You've got this! Aim for perfection! ⭐",
  "Board topper in the making! 🎓",
];

export default function TargetMotivationWidget({ targets }: TargetMotivationWidgetProps) {
  const total = targets.length;
  const completed = targets.filter(t => t.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  const messageIndex = Math.min(Math.floor(percentage / 25), MOTIVATIONAL_MESSAGES.length - 1);
  const message = MOTIVATIONAL_MESSAGES[messageIndex];

  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-amber-500 via-yellow-400 to-orange-500 shadow-lg">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 translate-y-8 -translate-x-8" />

      <div className="relative flex items-center gap-4">
        {/* Circular progress */}
        <div className="relative flex-shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88" className="rotate-[-90deg]">
            <circle
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="8"
            />
            <circle
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-white leading-none">{percentage}%</span>
            <span className="text-[9px] font-bold text-white/80 uppercase tracking-wide">Done</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="w-4 h-4 text-white" />
            <span className="text-white font-black text-base tracking-tight">Target 🎯 100%</span>
          </div>
          <p className="text-white/90 text-xs font-medium leading-snug mb-2">{message}</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-bold">{completed}/{total} done</span>
            </div>
            {percentage === 100 && total > 0 && (
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                <Zap className="w-3 h-3 text-white" />
                <span className="text-white text-xs font-bold">Champion!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative mt-3">
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-white/70 text-[10px] font-medium">0%</span>
          <span className="text-white/70 text-[10px] font-medium">100% 🏆</span>
        </div>
      </div>
    </div>
  );
}
