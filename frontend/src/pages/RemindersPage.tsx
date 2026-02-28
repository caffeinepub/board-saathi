import { useState, useRef } from 'react';
import { Bell, Plus, Trash2, Loader2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useGetReminders, useAddReminder, useDeleteReminder } from '../hooks/useQueries';
import { useReminderScheduler } from '../hooks/useReminderScheduler';
import { ALARM_SOUNDS, DEFAULT_ALARM_SOUND } from '../hooks/useReminderAlarm';

export default function RemindersPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [reminderText, setReminderText] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [alarmSound, setAlarmSound] = useState<string>(DEFAULT_ALARM_SOUND);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const { data: reminders = [], isLoading } = useGetReminders();
  const addReminderMutation = useAddReminder();
  const deleteReminderMutation = useDeleteReminder();

  // Schedule notifications and alarms for all reminders
  useReminderScheduler(reminders);

  const handlePreviewSound = () => {
    const sound = ALARM_SOUNDS[alarmSound];
    if (!sound) return;

    if (previewPlaying) {
      previewAudioRef.current?.pause();
      if (previewAudioRef.current) previewAudioRef.current.currentTime = 0;
      setPreviewPlaying(false);
      return;
    }

    try {
      const audio = new Audio(sound.path);
      previewAudioRef.current = audio;
      audio.onended = () => setPreviewPlaying(false);
      audio.play()
        .then(() => setPreviewPlaying(true))
        .catch(() => {
          toast.error('Could not play preview. Try interacting with the page first.');
          setPreviewPlaying(false);
        });
    } catch {
      toast.error('Audio preview not supported on this device.');
    }
  };

  const handleAdd = async () => {
    if (!reminderText.trim()) {
      toast.error('Please enter reminder text');
      return;
    }
    if (!reminderDate) {
      toast.error('Please select a date');
      return;
    }

    const dateTimeStr = reminderTime ? `${reminderDate}T${reminderTime}` : `${reminderDate}T09:00`;
    const dateTime = new Date(dateTimeStr).getTime();

    if (isNaN(dateTime)) {
      toast.error('Invalid date/time');
      return;
    }

    // Request notification permission when adding first reminder
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    try {
      await addReminderMutation.mutateAsync({
        text: reminderText.trim(),
        dateTime,
        alarmSound,
      });
      toast.success('Reminder added! You\'ll get a notification 5 min before & alarm at the set time.');
      setReminderText('');
      setReminderDate('');
      setReminderTime('');
      setAlarmSound(DEFAULT_ALARM_SOUND);
      setAddOpen(false);
    } catch {
      toast.error('Failed to add reminder. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteReminderMutation.mutateAsync(id);
      toast.success('Reminder deleted');
    } catch {
      toast.error('Failed to delete reminder');
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Stop preview if playing
      previewAudioRef.current?.pause();
      if (previewAudioRef.current) previewAudioRef.current.currentTime = 0;
      setPreviewPlaying(false);
      setReminderText('');
      setReminderDate('');
      setReminderTime('');
      setAlarmSound(DEFAULT_ALARM_SOUND);
    }
    setAddOpen(open);
  };

  const now = Date.now();
  const upcoming = reminders.filter(r => r.dateTime >= now);
  const past = reminders.filter(r => r.dateTime < now);

  const formatDateTime = (ts: number) => {
    return new Date(ts).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getSoundLabel = (soundId?: string) => {
    if (!soundId) return null;
    return ALARM_SOUNDS[soundId]?.label ?? soundId;
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
          <h1 className="text-2xl font-bold">Reminders</h1>
          <p className="text-muted-foreground text-sm mt-1">{upcoming.length} upcoming reminder{upcoming.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />Add Reminder
        </Button>
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reminders yet</h3>
          <p className="text-muted-foreground mb-4">Add reminders to stay on track with your studies</p>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />Add Reminder
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map(reminder => (
                  <Card key={reminder.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Bell className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{reminder.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDateTime(reminder.dateTime)}</p>
                          {reminder.alarmSound && (
                            <p className="text-xs text-primary/70 mt-0.5 flex items-center gap-1">
                              <Volume2 className="w-3 h-3" />
                              {getSoundLabel(reminder.alarmSound)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => handleDelete(reminder.id)}
                        disabled={deleteReminderMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Past</h2>
              <div className="space-y-3">
                {past.map(reminder => (
                  <Card key={reminder.id} className="opacity-60">
                    <CardContent className="p-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Bell className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm line-through">{reminder.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDateTime(reminder.dateTime)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => handleDelete(reminder.id)}
                        disabled={deleteReminderMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Reminder Dialog */}
      <Dialog open={addOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Reminder</DialogTitle>
            <DialogDescription>Set a reminder with an alarm sound for an important study task or event.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reminder-text">Reminder Text *</Label>
              <Input
                id="reminder-text"
                placeholder="e.g., Study Chapter 5 of Science"
                value={reminderText}
                onChange={e => setReminderText(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-date">Date *</Label>
              <Input
                id="reminder-date"
                type="date"
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-time">Time (optional)</Label>
              <Input
                id="reminder-time"
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
              />
            </div>

            {/* Alarm Sound Selector */}
            <div className="space-y-2">
              <Label>Alarm Sound</Label>
              <div className="flex gap-2 items-center">
                <Select value={alarmSound} onValueChange={setAlarmSound}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select alarm sound" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ALARM_SOUNDS).map(([id, sound]) => (
                      <SelectItem key={id} value={id}>
                        {sound.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handlePreviewSound}
                  title={previewPlaying ? 'Stop preview' : 'Preview sound'}
                  className="flex-shrink-0"
                >
                  {previewPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You'll get a notification 5 min before & the alarm plays at the set time.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogClose(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={addReminderMutation.isPending}>
              {addReminderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
