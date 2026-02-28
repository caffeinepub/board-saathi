import { useNavigate } from '@tanstack/react-router';
import { Target, CheckCircle, AlertCircle, Clock, Plus } from 'lucide-react';
import { useGetTargets, useCompleteTarget } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function getDeadlineStatus(deadlineMs: number): { label: string; color: string; icon: React.ReactNode } {
  const now = Date.now();
  const diff = deadlineMs - now;
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  if (diff < 0) {
    return {
      label: 'Overdue',
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: <AlertCircle size={12} />,
    };
  } else if (diff <= threeDaysMs) {
    return {
      label: 'Due Soon',
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: <Clock size={12} />,
    };
  } else {
    return {
      label: 'On Track',
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: <CheckCircle size={12} />,
    };
  }
}

function formatDeadline(ms: number): string {
  return new Date(ms).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ActiveTargetsSection() {
  const navigate = useNavigate();
  const { data: targets = [], isLoading } = useGetTargets();
  const completeTarget = useCompleteTarget();

  const activeTargets = targets.filter((t) => !t.completed);

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Target size={18} className="text-teal-600" />
          <h2 className="text-base font-semibold text-gray-800">Active Targets</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (activeTargets.length === 0) {
    return (
      <div className="mb-6 p-4 rounded-xl border border-dashed border-teal-200 bg-teal-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
            <Target size={20} className="text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">No active targets</p>
            <p className="text-xs text-gray-500">Set a new target to stay on track!</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-teal-300 text-teal-700 hover:bg-teal-50"
          onClick={() => navigate({ to: '/targets' })}
        >
          <Plus size={14} className="mr-1" />
          Add Target
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-teal-600" />
          <h2 className="text-base font-semibold text-gray-800">Active Targets</h2>
          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
            {activeTargets.length}
          </span>
        </div>
        <button
          onClick={() => navigate({ to: '/targets' })}
          className="text-xs text-teal-600 hover:text-teal-800 font-medium"
        >
          View all →
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeTargets.map((target) => {
          const deadlineMs = Number(target.deadline) / 1_000_000;
          const status = getDeadlineStatus(deadlineMs);
          return (
            <div
              key={String(target.id)}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-1">
                  {target.title}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${status.color}`}
                >
                  {status.icon}
                  {status.label}
                </span>
              </div>
              {target.description && (
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{target.description}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  Due: {formatDeadline(deadlineMs)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-teal-200 text-teal-700 hover:bg-teal-50 px-2"
                  disabled={completeTarget.isPending}
                  onClick={() =>
                    completeTarget.mutate({ targetId: target.id, completed: true })
                  }
                >
                  <CheckCircle size={12} className="mr-1" />
                  Done
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
