// Schedules browser notifications (5 min before) and alarm sounds (at reminder time)
// Uses Web Audio API for real alarm tones — no external audio files needed
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { LocalReminder } from "../utils/localStorageService";
import { DEFAULT_ALARM_SOUND, useReminderAlarm } from "./useReminderAlarm";

const FIVE_MIN_MS = 5 * 60 * 1000;

async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function showNotification(title: string, body: string) {
  toast(title, {
    description: body,
    duration: 10000,
    icon: "🔔",
  });

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const n = new Notification(title, {
        body,
        icon: "/assets/generated/dev-winner-icon.dim_512x512.png",
        badge: "/assets/generated/dev-winner-icon-192.dim_192x192.png",
        requireInteraction: true,
        tag: `reminder_${Date.now()}`,
      });
      setTimeout(() => n.close(), 30000);
    } catch {
      // Notifications may be blocked
    }
  }

  if ("vibrate" in navigator) {
    try {
      navigator.vibrate([500, 200, 500, 200, 500]);
    } catch {
      // Ignore
    }
  }
}

function showAlarmNotification(reminderText: string) {
  toast("🚨 ALARM — Reminder Due Now!", {
    description: reminderText,
    duration: 30000,
    icon: "⏰",
    action: {
      label: "Dismiss",
      onClick: () => {},
    },
  });

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const n = new Notification("⏰ ALARM — Reminder Due Now!", {
        body: reminderText,
        icon: "/assets/generated/dev-winner-icon.dim_512x512.png",
        badge: "/assets/generated/dev-winner-icon-192.dim_192x192.png",
        requireInteraction: true,
        tag: `alarm_${Date.now()}`,
      });
      setTimeout(() => n.close(), 60000);
    } catch {
      // Ignore
    }
  }

  if ("vibrate" in navigator) {
    try {
      navigator.vibrate([1000, 300, 1000, 300, 1000, 300, 1000]);
    } catch {
      // Ignore
    }
  }
}

export function useReminderScheduler(reminders: LocalReminder[]) {
  const { playAlarm } = useReminderAlarm();
  // Map: key → { timeoutId, scheduledAt }
  const timeoutsRef = useRef<
    Map<string, { tid: ReturnType<typeof setTimeout>; scheduledAt: number }>
  >(new Map());

  useEffect(() => {
    if (!reminders || reminders.length === 0) return;

    requestNotificationPermission();

    const now = Date.now();

    for (const reminder of reminders) {
      const reminderTime = reminder.dateTime;
      const preNotifyTime = reminderTime - FIVE_MIN_MS;
      const soundId = reminder.alarmSound ?? DEFAULT_ALARM_SOUND;

      const preKey = `pre_${reminder.id}`;
      const alarmKey = `alarm_${reminder.id}`;

      // --- Schedule 5-min-before notification ---
      if (preNotifyTime > now) {
        const existing = timeoutsRef.current.get(preKey);
        // Only re-schedule if not already scheduled for this exact time
        if (!existing || existing.scheduledAt !== preNotifyTime) {
          if (existing) clearTimeout(existing.tid);
          const delay = preNotifyTime - now;
          const tid = setTimeout(() => {
            showNotification(
              "⏰ Reminder in 5 minutes!",
              `Upcoming: ${reminder.text}`,
            );
            timeoutsRef.current.delete(preKey);
          }, delay);
          timeoutsRef.current.set(preKey, { tid, scheduledAt: preNotifyTime });
        }
      }

      // --- Schedule alarm at exact reminder time ---
      if (reminderTime > now) {
        const existing = timeoutsRef.current.get(alarmKey);
        // Only re-schedule if not already scheduled for this exact time
        if (!existing || existing.scheduledAt !== reminderTime) {
          if (existing) clearTimeout(existing.tid);
          const delay = reminderTime - now;
          const tid = setTimeout(async () => {
            // Show alarm notification and vibrate FIRST (no user gesture needed for notification/vibration)
            showAlarmNotification(reminder.text);
            // Play alarm — AudioContext may be suspended if no recent user interaction.
            // We attempt to resume it; on most browsers this works if the page is visible.
            try {
              await playAlarm(soundId);
            } catch {
              // Audio blocked — toast already shown above
            }
            timeoutsRef.current.delete(alarmKey);
          }, delay);
          timeoutsRef.current.set(alarmKey, { tid, scheduledAt: reminderTime });
        }
      }
    }

    // Clean up timeouts for deleted reminders
    const validPreKeys = new Set(reminders.map((r) => `pre_${r.id}`));
    const validAlarmKeys = new Set(reminders.map((r) => `alarm_${r.id}`));
    for (const [key, { tid }] of timeoutsRef.current.entries()) {
      if (!validPreKeys.has(key) && !validAlarmKeys.has(key)) {
        clearTimeout(tid);
        timeoutsRef.current.delete(key);
      }
    }
  }, [reminders, playAlarm]);

  // Clear all timeouts on unmount
  useEffect(() => {
    return () => {
      for (const { tid } of timeoutsRef.current.values()) clearTimeout(tid);
      timeoutsRef.current.clear();
    };
  }, []);
}
