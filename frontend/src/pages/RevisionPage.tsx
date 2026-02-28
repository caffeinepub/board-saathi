import { RotateCcw, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  useGetRevisionTasks,
  useMarkRevisionTaskCompleted,
  useGetSubjects,
  useGetAllChapters,
} from '../hooks/useQueries';
import type { RevisionTask } from '../backend';

function getRevisionLabel(num: bigint) {
  const n = Number(num);
  const labels = ['1st Revision', '2nd Revision', '3rd Revision', '4th Revision'];
  return labels[n - 1] || `Revision #${n}`;
}

function getDueDateStatus(dueDateNs: bigint) {
  const now = Date.now();
  const dueDateMs = Number(dueDateNs) / 1_000_000;
  const diff = dueDateMs - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diff < 0)
    return { label: 'Overdue', color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertCircle };
  if (days === 0)
    return { label: 'Due Today', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', icon: Clock };
  if (days <= 3)
    return { label: `Due in ${days}d`, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', icon: Clock };
  return { label: `Due in ${days}d`, color: 'text-muted-foreground', bg: 'bg-muted/50', icon: Clock };
}

export default function RevisionPage() {
  const { data: tasks = [], isLoading } = useGetRevisionTasks();
  const { data: subjects = [] } = useGetSubjects();
  const { data: chapters = [] } = useGetAllChapters();
  const markCompleted = useMarkRevisionTaskCompleted();

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const getSubjectName = (subjectId: bigint) => {
    return subjects.find((s) => s.id === subjectId)?.name ?? `Subject ${subjectId}`;
  };

  const getChapterName = (chapterId: bigint) => {
    return chapters.find((c) => c.id === chapterId)?.name ?? `Chapter ${chapterId}`;
  };

  const handleToggle = async (task: RevisionTask, checked: boolean) => {
    try {
      await markCompleted.mutateAsync({ revisionId: task.id, completed: checked });
      if (checked) toast.success('Revision completed! 🎉');
    } catch {
      toast.error('Failed to update revision task');
    }
  };

  const RevisionCard = ({ task }: { task: RevisionTask }) => {
    const status = getDueDateStatus(task.dueDate);
    const StatusIcon = status.icon;
    const dueDateMs = Number(task.dueDate) / 1_000_000;
    const dueDate = new Date(dueDateMs);

    return (
      <Card className={`transition-all ${task.completed ? 'opacity-60' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.completed}
              onCheckedChange={(checked) => handleToggle(task, !!checked)}
              disabled={markCompleted.isPending}
              className="mt-0.5 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-medium text-sm">{getSubjectName(task.subjectId)}</span>
                <Badge variant="secondary" className="text-xs">
                  {getRevisionLabel(task.revisionNumber)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {getChapterName(task.chapterId)}
              </p>
              <div
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
              >
                <StatusIcon className="w-3 h-3" />
                {status.label} ·{' '}
                {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Sort by dueDate (bigint nanoseconds) — convert to number for comparison
  const sortedPending = [...pending].sort(
    (a, b) => Number(a.dueDate) - Number(b.dueDate)
  );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <RotateCcw className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Revision Schedule</h1>
          <p className="text-sm text-muted-foreground">Spaced repetition for better retention</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{pending.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending Revisions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-500">{completed.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Pending */}
          <div>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Pending ({pending.length})
            </h2>
            {sortedPending.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete chapters to schedule revision tasks automatically.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {sortedPending.map((task) => (
                  <RevisionCard key={String(task.id)} task={task} />
                ))}
              </div>
            )}
          </div>

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Completed ({completed.length})
              </h2>
              <div className="space-y-2">
                {completed.map((task) => (
                  <RevisionCard key={String(task.id)} task={task} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
