import { useState } from 'react';
import { BadgeHelp, FastForward } from 'lucide-react';
import type { InteractionType } from '@/shared/contracts';

interface CaptchaHellProps {
  onAnswer(this: void, type: InteractionType, label: string): void;
}

const OPTIONS = [
  ['A suspicious triangle', 'That was a samosa. You have insulted lunch.'],
  ['A samosa wearing glasses', 'Correct shape, criminal confidence. Bot behavior detected.'],
  ['Three pixels in a trench coat', 'Those pixels have an alibi. You do not.'],
  ['The concept of potato', 'Too philosophical. CAPTCHA requests simpler defendant.'],
] as const;

export function CaptchaHell({ onAnswer }: CaptchaHellProps) {
  const [accusation, setAccusation] = useState(
    'Select every tile containing a legally distinct samosa.',
  );

  const answer = (label: string, response: string) => {
    setAccusation(response);
    onAnswer('popup-action', `CAPTCHA answer: ${label}`);
  };

  return (
    <aside
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl border border-red-300/45 bg-[#100d13]/95 p-5 text-white shadow-[0_35px_100px_rgba(0,0,0,0.78)] backdrop-blur-2xl sm:p-7"
      aria-labelledby="captcha-title"
    >
      <div className="flex items-start gap-3">
        <span className="bg-red-300 p-3 text-red-950">
          <BadgeHelp aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-300">
            CAPTCHA FROM HELL
          </p>
          <h2 id="captcha-title" className="mt-1 text-xl font-black sm:text-2xl">
            Prove you are human enough to be prosecuted.
          </h2>
          <p className="mt-2 text-sm text-white/62" role="status">
            {accusation}
          </p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {OPTIONS.map(([label, response]) => (
          <button
            key={label}
            type="button"
            onClick={() => answer(label, response)}
            className="min-h-20 border border-white/10 bg-white/[0.04] p-3 text-left text-xs font-bold transition hover:border-red-300/60 hover:bg-red-300/10"
          >
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          answer('Skip verification', 'Skipping is exactly what a highly organized bot would do.')
        }
        className="mt-3 inline-flex min-h-10 items-center gap-2 border border-white/10 px-4 text-xs font-bold text-white/62 hover:text-white"
      >
        <FastForward aria-hidden="true" size={15} /> Skip impossible CAPTCHA
      </button>
    </aside>
  );
}
