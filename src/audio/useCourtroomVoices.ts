import { useCallback, useEffect, useRef, useState } from 'react';

export type CourtroomSpeaker = 'judge' | 'prosecutor' | 'defense' | 'clerk' | 'assistant';

export interface SpokenLine {
  speaker: CourtroomSpeaker;
  text: string;
}

export interface CourtroomVoiceController {
  speaking: boolean;
  supported: boolean;
  speak(this: void, line: SpokenLine): Promise<void>;
  skip(this: void): void;
}

const VOICE_HINTS: Readonly<Record<CourtroomSpeaker, readonly string[]>> = {
  judge: ['david', 'mark', 'george', 'guy', 'male'],
  prosecutor: ['zira', 'samantha', 'susan', 'female'],
  defense: ['aria', 'jenny', 'microsoft', 'male', 'female'],
  clerk: ['alex', 'fred', 'daniel', 'male'],
  assistant: ['aria', 'jenny', 'google uk english female', 'female'],
};

const VOICE_SETTINGS: Readonly<Record<CourtroomSpeaker, { pitch: number; rate: number }>> = {
  judge: { pitch: 0.62, rate: 0.85 },
  prosecutor: { pitch: 1.16, rate: 1.12 },
  defense: { pitch: 1.32, rate: 1.06 },
  clerk: { pitch: 0.78, rate: 0.88 },
  assistant: { pitch: 1.32, rate: 1.06 },
};

function chooseVoice(voices: readonly SpeechSynthesisVoice[], speaker: CourtroomSpeaker) {
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'));
  const candidates = english.length > 0 ? english : voices;
  const hints = VOICE_HINTS[speaker];
  return (
    candidates.find((voice) => hints.some((hint) => voice.name.toLowerCase().includes(hint))) ??
    candidates[0]
  );
}

export function useCourtroomVoices(muted: boolean): CourtroomVoiceController {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState<readonly SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const completionRef = useRef<(() => void) | null>(null);

  const skip = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    completionRef.current?.();
    completionRef.current = null;
    setSpeaking(false);
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [supported]);

  useEffect(() => skip, [skip]);

  const speak = useCallback(
    (line: SpokenLine) => {
      skip();
      if (!supported || muted) return Promise.resolve();

      return new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(line.text);
        const settings = VOICE_SETTINGS[line.speaker];
        utterance.pitch = settings.pitch;
        utterance.rate = settings.rate;
        utterance.volume = 0.9;
        utterance.voice = chooseVoice(voices, line.speaker) ?? null;

        const complete = () => {
          completionRef.current = null;
          setSpeaking(false);
          resolve();
        };
        completionRef.current = complete;
        utterance.addEventListener('end', complete, { once: true });
        utterance.addEventListener('error', complete, { once: true });
        setSpeaking(true);
        window.speechSynthesis.speak(utterance);
      });
    },
    [muted, skip, supported, voices],
  );

  return { speaking, supported, speak, skip };
}
