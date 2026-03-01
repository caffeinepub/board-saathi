// Hook that schedules 1-hour-before alarm and browser notification for targets with deadlines
import { useEffect, useRef, useCallback } from 'react';
import { useReminderAlarm, DEFAULT_ALARM_SOUND } from './useReminderAlarm';

const ONE_HOUR_MS = 60 * 60 * 1000;

// Track which target alarm IDs have already been scheduled in this session
const scheduledTargetIds = new Set<string>();

async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function showNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/assets/app-icon.svg',
      badge: '/assets/app-icon.svg',
    });
  }
}

export interface SchedulableTarget {
  id: number;
  title: string;
  deadline: number; // ms timestamp
  completed: boolean;
}

export function useTargetAlarmScheduler(
  targets: SchedulableTarget[],
  alarmSound: string = DEFAULT_ALARM_SOUND
) {
  const { playAlarm } = useReminderAlarm();
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current.clear();
  }, []);

  useEffect(() => {
    if (!targets || targets.length === 0) return;

    // Request notification permission
    requestNotificationPermission();

    const now = Date.now();

    targets.forEach(target => {
      // Skip completed targets or targets without a valid deadline
      if (target.completed || !target.deadline) return;

      const oneHourBeforeDeadline = target.deadline - ONE_HOUR_MS;
      const alarmKey = `target_1hr_${target.id}`;

      // Only schedule if the 1-hour-before time is still in the future
      if (!scheduledTargetIds.has(alarmKey) && oneHourBeforeDeadline > now) {
        const delay = oneHourBeforeDeadline - now;
        const tid = setTimeout(() => {
          // Play alarm sound on device
          playAlarm(alarmSound);
          // Show browser notification
          showNotification(
            '⏰ Target Deadline in 1 Hour!',
            `Your target deadline is in 1 hour: ${target.title}`
          );
          scheduledTargetIds.delete(alarmKey);
        }, delay);
        timeoutsRef.current.set(alarmKey, tid);
        scheduledTargetIds.add(alarmKey);
      }
    });

    return () => {
      // Don't clear on every re-render — only clear on unmount
    };
  }, [targets, alarmSound, playAlarm]);

  // Clear all timeouts when component unmounts
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);
}
