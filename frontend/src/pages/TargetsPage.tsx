import { useState } from 'react';
import { Target, Plus, Trash2, CheckCircle2, Circle, Loader2, AlarmClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useGetTargets, useAddTarget, useCompleteTarget, useDeleteTarget } from '../hooks/useQueries';
import { useTargetAlarmScheduler } from '../hooks/useTargetAlarmScheduler';

const ONE_HOUR_MS = 60 * 60 * 1000;

export default function TargetsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');

  const { data: targets = [], isLoading } = useGetTargets();
  const addTargetMutation = useAddTarget();
  const completeTargetMutation = useCompleteTarget();
  const deleteTargetMutation = useDeleteTarget();

  // Schedule 1-hour-before alarms for all active targets with deadlines
  useTargetAlarmScheduler(targets);

  const handleAdd = async () => {
    if (!title.trim()) {
      toast.error('Please enter a target title');
      return;
    }
    if (!deadline) {
      toast.error('Please select a deadline');
      return;
    }

    const deadlineTs = new Date(deadline).getTime();
    if (isNaN(deadlineTs)) {
      toast.error('Invalid deadline date');
      return;
    }

    try {
      await addTargetMutation.mutateAsync({ title: title.trim(), description: description.trim(), deadline: deadlineTs });
      toast.success('Target added! You\'ll get an alarm 1 hour before the deadline.');
      setTitle('');
      setDescription('');
      setDeadline('');
      setAddOpen(false);
    } catch (err) {
      toast.error('Failed to add target. Please try again.');
    }
  };

  const handleToggleComplete = async (targetId: number, currentCompleted: boolean) => {
    try {
      await completeTargetMutation.mutateAsync({ targetId, completed: !currentCompleted });
      toast.success(currentCompleted ? 'Target marked incomplete' : 'Target completed! 🎉');
    } catch {
      toast.error('Failed to update target');
    }
  };

  const handleDelete = async (targetId: number) => {
    try {
      await deleteTargetMutation.mutateAsync(targetId);
      toast.success('Target deleted');
    } catch {
      toast.error('Failed to delete target');
    }
  };

  const now = Date.now();
  const active = targets.filter(t => !t.completed);
  const completed = targets.filter(t => t.completed);

  const formatDeadline = (ts: number) => {
    const d = new Date(ts);
    const diff = ts - now;
    const days = Math.ceil(diff / 86400000);
    const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (diff < 0) return { text: dateStr, badge: 'Overdue', variant: 'destructive' as const };
    if (days <= 3) return { text: dateStr, badge: `${days}d left`, variant: 'destructive' as const };
    if (days <= 7) return { text: dateStr, badge: `${days}d left`, variant: 'secondary' as const };
    return { text: dateStr, badge: `${days}d left`, variant: 'outline' as const };
  };

  // Returns true if the target has a deadline more than 1 hour in the future
  const hasActiveAlarm = (deadline: number): boolean => {
    return deadline - now > ONE_HOUR_MS;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Targets</h1>
          <p className="text-muted-foreground text-sm mt-1">{active.length} active, {completed.length} completed</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />Add Target
        </Button>
      </div>

      {targets.length === 0 ? (
        <div className="text-center py-16">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No targets yet</h3>
          <p className="text-muted-foreground mb-4">Set study targets to keep yourself motivated</p>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />Add Target
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Active Targets</h2>
              <div className="space-y-3">
                {active.map(target => {
                  const dl = formatDeadline(target.deadline);
                  const alarmActive = hasActiveAlarm(target.deadline);
                  return (
                    <Card key={target.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleComplete(target.id, target.completed)}
                            disabled={completeTargetMutation.isPending}
                            className="mt-0.5 flex-shrink-0"
                          >
                            <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm">{target.title}</p>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Badge variant={dl.variant} className="text-xs">{dl.badge}</Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(target.id)}
                                  disabled={deleteTargetMutation.isPending}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            {target.description && <p className="text-xs text-muted-foreground mt-1">{target.description}</p>}
                            <p className="text-xs text-muted-foreground mt-1">Deadline: {dl.text}</p>
                            {/* 1-hour alarm badge — only shown when deadline is more than 1 hour away */}
                            {alarmActive && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                <AlarmClock className="w-3 h-3" />
                                ⏰ 1hr alarm set
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Completed</h2>
              <div className="space-y-3">
                {completed.map(target => (
                  <Card key={target.id} className="opacity-60 border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleComplete(target.id, target.completed)}
                          disabled={completeTargetMutation.isPending}
                          className="mt-0.5 flex-shrink-0"
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm line-through">{target.title}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                              onClick={() => handleDelete(target.id)}
                              disabled={deleteTargetMutation.isPending}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          {target.description && <p className="text-xs text-muted-foreground mt-1 line-through">{target.description}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Target Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Target</DialogTitle>
            <DialogDescription>Set a study goal with a deadline. You'll get an alarm 1 hour before the deadline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="target-title">Title *</Label>
              <Input
                id="target-title"
                placeholder="e.g., Complete all Math chapters"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-desc">Description (optional)</Label>
              <Textarea
                id="target-desc"
                placeholder="Add more details about this target..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-deadline">Deadline *</Label>
              <Input
                id="target-deadline"
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlarmClock className="w-3 h-3" />
              An alarm will sound 1 hour before the deadline.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setTitle(''); setDescription(''); setDeadline(''); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={addTargetMutation.isPending}>
              {addTargetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Target
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
