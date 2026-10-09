import { useCallback, useEffect, useRef, useState } from 'react';

export type CourtroomSoundCue = 'gavel' | 'objection' | 'verdict';

export interface CourtroomAudioController {
  muted: boolean;
  supported: boolean;
  playCue(this: void, cue: CourtroomSoundCue): void;
  startAmbience(this: void): void;
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
  const ambienceRef = useRef<readonly OscillatorNode[]>([]);
  const ambienceWantedRef = useRef(false);
  const supported = typeof window !== 'undefined' && 'AudioContext' in window;

  const shutdown = useCallback(() => {
    ambienceRef.current.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch {
        // The oscillator may already have stopped with its AudioContext.
      }
    });
    ambienceRef.current = [];
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== 'closed') void context.close();
  }, []);

  const stop = useCallback(() => {
    ambienceWantedRef.current = false;
    shutdown();
  }, [shutdown]);

  const startAmbience = useCallback(() => {
    ambienceWantedRef.current = true;
    if (muted || !supported || ambienceRef.current.length > 0) return;

    try {
      const context = contextRef.current ?? new AudioContext();
      contextRef.current = context;
      void context.resume();
      const master = context.createGain();
      master.gain.setValueAtTime(0.0001, context.currentTime);
      master.gain.exponentialRampToValueAtTime(0.014, context.currentTime + 1.8);
      master.connect(context.destination);
      const oscillators = [55, 82.41, 110].map((frequency, index) => {
        const oscillator = context.createOscillator();
        const voiceGain = context.createGain();
        oscillator.type = index === 1 ? 'triangle' : 'sine';
        oscillator.frequency.value = frequency;
        voiceGain.gain.value = index === 0 ? 0.65 : 0.24;
        oscillator.connect(voiceGain);
        voiceGain.connect(master);
        oscillator.start();
        return oscillator;
      });
      ambienceRef.current = oscillators;
    } catch {
      // Ambient audio is optional and must never block the trial.
    }
  }, [muted, supported]);

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
          if (cue === 'gavel')
            oscillator.frequency.exponentialRampToValueAtTime(42, start + duration);
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

  useEffect(() => {
    if (muted) shutdown();
    else if (ambienceWantedRef.current) startAmbience();
  }, [muted, shutdown, startAmbience]);

  useEffect(() => stop, [stop]);

  return { muted, supported, playCue, startAmbience, toggleMute, stop };
}
