// Hook that schedules browser notifications (5 min before) and alarm sounds (at reminder time)
import { useEffect, useRef, useCallback } from 'react';
import { LocalReminder } from '../utils/localStorageService';
import { useReminderAlarm, DEFAULT_ALARM_SOUND } from './useReminderAlarm';

const FIVE_MIN_MS = 5 * 60 * 1000;

// Track which reminder IDs have already been scheduled in this session
const scheduledIds = new Set<string>();

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

export function useReminderScheduler(reminders: LocalReminder[]) {
  const { playAlarm } = useReminderAlarm();
  // Store timeout IDs so we can clear them on unmount / reminder deletion
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current.clear();
  }, []);

  useEffect(() => {
    if (!reminders || reminders.length === 0) return;

    // Request permission once
    requestNotificationPermission();

    const now = Date.now();

    reminders.forEach(reminder => {
      const reminderTime = reminder.dateTime;
      const preNotifyTime = reminderTime - FIVE_MIN_MS;
      const soundId = reminder.alarmSound ?? DEFAULT_ALARM_SOUND;

      // Pre-notification key
      const preKey = `pre_${reminder.id}`;
      // Alarm key (exact time)
      const alarmKey = `alarm_${reminder.id}`;

      // Schedule pre-notification (5 min before)
      if (!scheduledIds.has(preKey) && preNotifyTime > now) {
        const delay = preNotifyTime - now;
        const tid = setTimeout(() => {
          showNotification(
            '⏰ Reminder in 5 minutes!',
            reminder.text
          );
          scheduledIds.delete(preKey);
        }, delay);
        timeoutsRef.current.set(preKey, tid);
        scheduledIds.add(preKey);
      }

      // Schedule alarm at exact reminder time — plays sound AND shows notification
      if (!scheduledIds.has(alarmKey) && reminderTime > now) {
        const delay = reminderTime - now;
        const tid = setTimeout(() => {
          // Play alarm sound on device
          playAlarm(soundId);
          // Show "due now" notification
          showNotification(
            '🔔 Reminder Due Now!',
            `Your reminder is due now: ${reminder.text}`
          );
          scheduledIds.delete(alarmKey);
        }, delay);
        timeoutsRef.current.set(alarmKey, tid);
        scheduledIds.add(alarmKey);
      }
    });

    return () => {
      // Don't clear on every re-render — only clear on unmount
    };
  }, [reminders, playAlarm]);

  // Clear all timeouts when component unmounts
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);
}
