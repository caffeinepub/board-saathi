// Hook for playing alarm sounds at reminder time using Web Audio API
// Generates real alarm tones without needing external audio files

export const ALARM_SOUNDS: Record<string, { label: string; path: string }> = {
  classic_bell: { label: "Classic Bell 🔔", path: "classic_bell" },
  urgent_beep: { label: "Urgent Beep 🚨", path: "urgent_beep" },
  soft_chime: { label: "Soft Chime 🎵", path: "soft_chime" },
  school_bell: { label: "School Bell 🏫", path: "school_bell" },
  joshsound: { label: "JoshSound ⚡", path: "joshsound" },
};

export const DEFAULT_ALARM_SOUND = "classic_bell";

// AudioContext singleton — created lazily
let _audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!_audioCtx || _audioCtx.state === "closed") {
    _audioCtx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();
  }
  return _audioCtx;
}

// Unlock audio context on any user interaction (click/touch/keydown)
// This ensures the AudioContext is pre-unlocked before any alarm fires.
let _audioUnlocked = false;
function unlockAudio() {
  if (_audioUnlocked) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === "suspended") {
      ctx
        .resume()
        .then(() => {
          _audioUnlocked = true;
        })
        .catch(() => {});
    } else {
      _audioUnlocked = true;
    }
  } catch {
    // Ignore
  }
}

// Attach unlock listeners once
if (typeof window !== "undefined") {
  for (const evt of [
    "click",
    "touchstart",
    "keydown",
    "scroll",
    "pointerdown",
  ] as const) {
    window.addEventListener(evt, unlockAudio, { passive: true, once: false });
  }
}

async function ensureAudioCtx(): Promise<AudioContext | null> {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  type: OscillatorType,
  startTime: number,
  duration: number,
  gainValue = 0.7,
) {
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gainValue, startTime + 0.02);
    gainNode.gain.setValueAtTime(gainValue, startTime + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {
    // Ignore individual tone errors
  }
}

async function playWebAudioAlarm(soundId: string): Promise<void> {
  const ctx = await ensureAudioCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  switch (soundId) {
    case "classic_bell": {
      // Classic bell pattern: ding-dong repeating
      for (let i = 0; i < 4; i++) {
        const t = now + i * 0.8;
        playTone(ctx, 880, "sine", t, 0.3, 0.8);
        playTone(ctx, 660, "sine", t + 0.35, 0.3, 0.6);
      }
      break;
    }
    case "urgent_beep": {
      // Rapid urgent beeping
      for (let i = 0; i < 10; i++) {
        playTone(ctx, 1000, "square", now + i * 0.25, 0.15, 0.6);
      }
      break;
    }
    case "soft_chime": {
      // Soft ascending chime
      const freqs = [523, 659, 784, 1047];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < freqs.length; j++) {
          playTone(ctx, freqs[j], "sine", now + i * 1.2 + j * 0.18, 0.4, 0.5);
        }
      }
      break;
    }
    case "school_bell": {
      // Long school bell ring
      for (let i = 0; i < 8; i++) {
        playTone(ctx, 750, "sawtooth", now + i * 0.35, 0.22, 0.55);
        playTone(ctx, 820, "sawtooth", now + i * 0.35 + 0.11, 0.18, 0.45);
      }
      break;
    }
    case "joshsound": {
      // Energetic alarm: ascending triple burst
      for (let i = 0; i < 6; i++) {
        const t = now + i * 0.45;
        playTone(ctx, 800, "square", t, 0.08, 0.7);
        playTone(ctx, 1100, "square", t + 0.12, 0.08, 0.7);
        playTone(ctx, 1400, "square", t + 0.24, 0.1, 0.7);
      }
      break;
    }
    default: {
      playTone(ctx, 880, "sine", now, 0.5, 0.7);
      break;
    }
  }
}

// Track alarm repeat interval
let _alarmInterval: ReturnType<typeof setInterval> | null = null;

function clearAlarmInterval() {
  if (_alarmInterval) {
    clearInterval(_alarmInterval);
    _alarmInterval = null;
  }
}

export function useReminderAlarm() {
  const stopAlarm = () => {
    clearAlarmInterval();
    // Close and recreate context to stop any currently-playing oscillators immediately
    if (_audioCtx && _audioCtx.state !== "closed") {
      try {
        _audioCtx.close();
      } catch {
        // Ignore
      }
      _audioCtx = null;
      _audioUnlocked = false;
    }
  };

  const playAlarm = async (soundId: string = DEFAULT_ALARM_SOUND) => {
    clearAlarmInterval();
    // Play immediately
    await playWebAudioAlarm(soundId);
    // Repeat every 3.5 seconds for ~30 seconds total
    let count = 0;
    _alarmInterval = setInterval(async () => {
      count++;
      if (count >= 8) {
        clearAlarmInterval();
        return;
      }
      await playWebAudioAlarm(soundId);
    }, 3500);
  };

  const previewAlarm = async (soundId: string = DEFAULT_ALARM_SOUND) => {
    clearAlarmInterval();
    await playWebAudioAlarm(soundId);
  };

  return { playAlarm, previewAlarm, stopAlarm };
}
