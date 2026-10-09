import { useCallback, useEffect, useRef, useState } from 'react';

export type CourtroomSoundCue = 'gavel' | 'objection' | 'verdict';

export interface CourtroomAudioController {
  muted: boolean;
  supported: boolean;
  playCue(this: void, cue: CourtroomSoundCue): void;
  toggleMute(this: void): void;
  stop(this: void): void;
}

const CUE_FREQUENCIES: Readonly<Record<CourtroomSoundCue, readonly number[]>> = {
  gavel: [92, 64],
  objection: [330, 440],
  verdict: [261.63, 329.63, 392],
};

export function useCourtroomAudio(): CourtroomAudioController {
  const [muted, setMuted] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const supported = typeof window !== 'undefined' && 'AudioContext' in window;

  const stop = useCallback(() => {
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== 'closed') void context.close();
  }, []);

  const playCue = useCallback(
    (cue: CourtroomSoundCue) => {
      if (muted || !supported) return;

      try {
        const context = contextRef.current ?? new AudioContext();
        contextRef.current = context;
        const now = context.currentTime;

        CUE_FREQUENCIES[cue].forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          const start = now + index * (cue === 'verdict' ? 0.08 : 0.035);
          const duration = cue === 'gavel' ? 0.16 : 0.24;

          oscillator.type = cue === 'gavel' ? 'square' : 'sine';
          oscillator.frequency.setValueAtTime(frequency, start);
          if (cue === 'gavel') oscillator.frequency.exponentialRampToValueAtTime(42, start + duration);
          gain.gain.setValueAtTime(cue === 'gavel' ? 0.12 : 0.055, start);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start(start);
          oscillator.stop(start + duration);
        });
      } catch {
        // Audio is progressive enhancement; browser policy or device failures must not block court.
      }
    },
    [muted, supported],
  );

  const toggleMute = useCallback(() => setMuted((value) => !value), []);

  useEffect(() => stop, [stop]);

  return { muted, supported, playCue, toggleMute, stop };
}
