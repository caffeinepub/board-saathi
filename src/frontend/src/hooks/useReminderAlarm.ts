// Hook for playing alarm sounds at reminder time
// Alarm sound file paths (also listed in public/sw.js PRECACHE_URLS for offline support):
//   - /assets/sounds/joshsound.mp3
import { useCallback, useRef } from "react";

// Map of sound identifiers to their file paths
export const ALARM_SOUNDS: Record<string, { label: string; path: string }> = {
  joshsound: {
    label: "JoshSound 🔔",
    path: "/assets/sounds/joshsound.mp3",
  },
};

export const DEFAULT_ALARM_SOUND = "joshsound";

export function useReminderAlarm() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAlarm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const playAlarm = useCallback(
    (soundId: string = DEFAULT_ALARM_SOUND) => {
      const sound = ALARM_SOUNDS[soundId] ?? ALARM_SOUNDS[DEFAULT_ALARM_SOUND];
      try {
        stopAlarm();
        const audio = new Audio(sound.path);
        audio.volume = 1.0;
        audioRef.current = audio;
        audio.play().catch(() => {
          // Autoplay may be blocked; silently ignore
        });
      } catch {
        // Audio not supported or file missing
      }
    },
    [stopAlarm],
  );

  const previewAlarm = useCallback(
    (soundId: string = DEFAULT_ALARM_SOUND) => {
      playAlarm(soundId);
    },
    [playAlarm],
  );

  return { playAlarm, previewAlarm, stopAlarm };
}
