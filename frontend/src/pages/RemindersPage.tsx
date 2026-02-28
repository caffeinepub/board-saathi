import { useState } from 'react';
import { Bell, Plus, Trash2, Clock, Volume2, VolumeX, Target as TargetIcon } from 'lucide-react';
import { useGetReminders, useAddReminder, useDeleteReminder, useGetTargets } from '../hooks/useQueries';
import { useReminderScheduler } from '../hooks/useReminderScheduler';
import { useReminderAlarm, ALARM_SOUNDS, DEFAULT_ALARM_SOUND } from '../hooks/useReminderAlarm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function RemindersPage() {
  const { data: reminders = [], isLoading } = useGetReminders();
  const { data: targets = [] } = useGetTargets();
  const addReminder = useAddReminder();
  const deleteReminder = useDeleteReminder();
  const { previewAlarm, stopAlarm } = useReminderAlarm();

  useReminderScheduler(reminders);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [selectedSound, setSelectedSound] = useState(DEFAULT_ALARM_SOUND);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('none');
  const [isPreviewing, setIsPreviewing] = useState(false);

  const activeTargets = targets.filter((t) => !t.completed);

  const handleAdd = async () => {
    if (!text.trim() || !dateTime) return;
    const ms = new Date(dateTime).getTime();
    const targetId = selectedTargetId !== 'none' ? parseInt(selectedTargetId) : undefined;
    await addReminder.mutateAsync({
      text: text.trim(),
      dateTime: ms,
      alarmSound: selectedSound,
      targetId,
    });
    setText('');
    setDateTime('');
    setSelectedSound(DEFAULT_ALARM_SOUND);
    setSelectedTargetId('none');
    setOpen(false);
  };

  const handlePreview = () => {
    if (isPreviewing) {
      stopAlarm();
      setIsPreviewing(false);
    } else {
      previewAlarm(selectedSound);
      setIsPreviewing(true);
      setTimeout(() => setIsPreviewing(false), 3000);
    }
  };

  const getLinkedTarget = (targetId?: number) => {
    if (!targetId) return null;
    return targets.find((t) => t.id === targetId) ?? null;
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Stay on top of your study schedule</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus size={16} className="mr-1" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="reminder-text">Reminder Text</Label>
                <Input
                  id="reminder-text"
                  placeholder="e.g., Revise Chapter 3 - Polynomials"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="reminder-datetime">Date & Time</Label>
                <Input
                  id="reminder-datetime"
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Alarm Sound</Label>
                <div className="flex gap-2 mt-1">
                  <Select value={selectedSound} onValueChange={setSelectedSound}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select sound" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ALARM_SOUNDS).map(([key]) => (
                        <SelectItem key={key} value={key}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handlePreview}
                    title={isPreviewing ? 'Stop preview' : 'Preview sound'}
                  >
                    {isPreviewing ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </Button>
                </div>
              </div>
              {/* Target Link */}
              <div>
                <Label>Link to Target (Optional)</Label>
                <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a target..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No target</SelectItem>
                    {activeTargets.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">
                  Link this reminder to an active target for context
                </p>
              </div>
              <Button
                onClick={handleAdd}
                disabled={addReminder.isPending || !text.trim() || !dateTime}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                {addReminder.isPending ? 'Adding...' : 'Add Reminder'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell size={32} className="text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No reminders yet</h3>
          <p className="text-sm text-gray-400">Add a reminder to stay on track with your studies.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => {
            const linkedTarget = getLinkedTarget(reminder.targetId);
            const isPast = reminder.dateTime < Date.now();
            return (
              <div
                key={reminder.id}
                className={`bg-white border rounded-xl p-4 shadow-sm flex items-start gap-3 ${
                  isPast ? 'border-gray-200 opacity-70' : 'border-teal-100'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isPast ? 'bg-gray-100' : 'bg-teal-50'
                  }`}
                >
                  <Bell size={18} className={isPast ? 'text-gray-400' : 'text-teal-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 leading-snug">{reminder.text}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {new Date(reminder.dateTime).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                    {isPast && <span className="text-xs text-gray-400 ml-1">(Past)</span>}
                  </div>
                  {linkedTarget && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <TargetIcon size={11} className="text-teal-500" />
                      <span className="text-xs text-teal-600 font-medium">
                        Linked: {linkedTarget.title}
                      </span>
                    </div>
                  )}
                  {reminder.alarmSound && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Volume2 size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-400 capitalize">{reminder.alarmSound}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteReminder.mutate(reminder.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
