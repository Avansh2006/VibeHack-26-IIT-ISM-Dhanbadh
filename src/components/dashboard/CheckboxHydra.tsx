import { useState } from 'react';
import type { InteractionMetadata, InteractionType } from '@/shared/contracts';

interface CheckboxHydraProps {
  active: boolean;
  onInteraction(this: void, type: InteractionType, metadata: InteractionMetadata): void;
}

const CONTRADICTIONS = [
  'I accept the terms I have not read',
  'I reject my previous acceptance',
  'I consent to not consenting',
  'I am not a checkbox pretending to be a person',
  'Please unsubscribe me from unsubscribing',
  'I accept liability for this checkbox multiplying',
] as const;

export function CheckboxHydra({ active, onInteraction }: CheckboxHydraProps) {
  const [attempts, setAttempts] = useState(0);
  if (!active) return null;

  const choices = CONTRADICTIONS.slice(0, Math.min(CONTRADICTIONS.length, 1 + attempts * 2));
  const rejected = attempts >= 3;

  return (
    <aside className="fixed bottom-4 right-4 z-40 w-[min(92vw,22rem)] border border-white/12 bg-[#111318]/95 p-4 text-white shadow-2xl backdrop-blur-xl">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--dashboard-accent)]">
        Compliance quick check
      </p>
      <h2 className="mt-1 text-sm font-bold">Please accept one perfectly normal condition.</h2>
      <div className="mt-3 space-y-2">
        {choices.map((label, index) => (
          <label
            key={label}
            className="flex cursor-pointer items-start gap-2 border border-white/[0.07] p-2.5 text-[11px] leading-4 text-white/60 hover:border-white/20"
          >
            <input
              type="checkbox"
              disabled={rejected}
              onChange={() => {
                setAttempts((value) => value + 1);
                onInteraction('popup-action', {
                  targetId: `checkbox-hydra-${attempts + 1}`,
                  label: `Accept contradictory consent clause ${index + 1}`,
                  source: 'checkbox-hydra',
                });
              }}
              className="mt-0.5 accent-[var(--dashboard-accent)]"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <p
        className={`mt-3 text-[10px] font-bold ${rejected ? 'text-red-300' : 'text-white/30'}`}
        role="status"
      >
        {rejected
          ? 'Consent rejected for being too enthusiastic.'
          : `Each agreement creates two exciting new obligations. Attempts: ${attempts}/3`}
      </p>
    </aside>
  );
}
