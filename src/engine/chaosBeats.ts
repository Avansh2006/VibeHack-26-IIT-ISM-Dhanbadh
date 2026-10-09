import type { ChaosStage, InteractionType } from '@/shared/contracts';
import { stageForInteractionCount } from '@/shared/contracts';

export type ChaosEffect =
  | 'calm'
  | 'cursor-charge'
  | 'cursor-tail'
  | 'cursor-wanted'
  | 'escape-notice'
  | 'escape-button'
  | 'escape-denied'
  | 'innocence-form'
  | 'cross-examination'
  | 'evidence-storm'
  | 'meltdown-warning'
  | 'meltdown-shake'
  | 'final-summons'
  | 'courtroom';

export interface ChaosBeat {
  sequence: number;
  stage: ChaosStage;
  effect: ChaosEffect;
  eyebrow: string;
  headline: string;
  detail: string;
  actionLabel: string;
  actionType: InteractionType;
}

const BEATS = [
  {
    effect: 'calm',
    eyebrow: 'Operational status: suspiciously excellent',
    headline: 'One harmless click. Probably.',
    detail: 'Our legal department assures us the button has never held a grudge.',
    actionLabel: 'Begin responsible clicking',
    actionType: 'primary-cta',
  },
  {
    effect: 'cursor-charge',
    eyebrow: 'Incident report #001',
    headline: 'Your cursor has been identified at the scene.',
    detail: 'Remain calm. The website is merely documenting your enthusiasm for evidence.',
    actionLabel: 'That proves nothing',
    actionType: 'primary-cta',
  },
  {
    effect: 'cursor-tail',
    eyebrow: 'Cursor Criminal Unit',
    headline: 'We found fingerprints on the call-to-action.',
    detail: 'Digital fingerprints. Very advanced. Extremely admissible in imaginary court.',
    actionLabel: 'Inspect the alleged evidence',
    actionType: 'feature-card',
  },
  {
    effect: 'cursor-wanted',
    eyebrow: 'Wanted: one pointing device',
    headline: 'Stop moving. You are making the cursor look guilty.',
    detail: 'It has a tiny wanted poster now. This is devastating for its career.',
    actionLabel: 'Request emergency exit',
    actionType: 'navigation',
  },
  {
    effect: 'escape-notice',
    eyebrow: 'Emergency Escape initiated',
    headline: 'An exit has been provided for regulatory reasons.',
    detail: 'The regulation did not specify that the exit had to cooperate.',
    actionLabel: 'Use the totally normal exit',
    actionType: 'escape-attempt',
  },
  {
    effect: 'escape-button',
    eyebrow: 'Exit relocation notice',
    headline: 'The emergency exit has entered witness protection.',
    detail: 'Keyboard users retain diplomatic immunity. Pointer users must negotiate.',
    actionLabel: 'Catch the emergency exit',
    actionType: 'escape-attempt',
  },
  {
    effect: 'escape-denied',
    eyebrow: 'Escape request denied beautifully',
    headline: 'You clicked the exit. That counts as another click.',
    detail: 'This system was designed by lawyers and one deeply petty button.',
    actionLabel: 'File an appeal',
    actionType: 'popup-action',
  },
  {
    effect: 'innocence-form',
    eyebrow: 'Prove Your Innocence™',
    headline: 'Please explain all seven clicks in one dishonest sentence.',
    detail: 'We have pre-rejected your explanation to improve processing times.',
    actionLabel: 'Submit suspiciously honest statement',
    actionType: 'popup-action',
  },
  {
    effect: 'cross-examination',
    eyebrow: 'Automated cross-examination',
    headline: 'If you are innocent, why is the button still warm?',
    detail: 'Take your time. Every second is being billed to somebody else.',
    actionLabel: 'Object dramatically',
    actionType: 'popup-action',
  },
  {
    effect: 'evidence-storm',
    eyebrow: 'Evidence has achieved weather',
    headline: 'Your click history is now circling the building.',
    detail: 'Meteorologists are calling it a Category Nine liability event.',
    actionLabel: 'Dispute the forecast',
    actionType: 'custom',
  },
  {
    effect: 'meltdown-warning',
    eyebrow: 'Structural patience failure',
    headline: 'The interface has retained counsel and lost alignment.',
    detail: 'Please avoid sudden clicks. Or do one. The plot needs it.',
    actionLabel: 'Test structural integrity',
    actionType: 'custom',
  },
  {
    effect: 'meltdown-shake',
    eyebrow: 'This is fine, legally speaking',
    headline: 'The pixels are unionizing against your index finger.',
    detail: 'Their demands include healthcare, kerning, and your immediate surrender.',
    actionLabel: 'Decline pixel demands',
    actionType: 'custom',
  },
  {
    effect: 'final-summons',
    eyebrow: 'Final notice before litigation',
    headline: 'One more click and this becomes a court matter.',
    detail: 'For clarity: the enormous button below is absolutely not a trap.',
    actionLabel: 'PROVE MY INNOCENCE',
    actionType: 'courtroom-trigger',
  },
  {
    effect: 'courtroom',
    eyebrow: 'Case accepted',
    headline: 'The Website v. Your Clicking Finger',
    detail: 'Thirteen exhibits have been sealed. Courtroom jurisdiction is now active.',
    actionLabel: 'Court is in session',
    actionType: 'courtroom-trigger',
  },
] as const satisfies readonly Omit<ChaosBeat, 'sequence' | 'stage'>[];

export function getChaosBeat(clickCount: number): ChaosBeat {
  const sequence = Number.isFinite(clickCount)
    ? Math.min(BEATS.length - 1, Math.max(0, Math.floor(clickCount)))
    : 0;
  const beat = BEATS[sequence] ?? BEATS[0];

  return {
    ...beat,
    sequence,
    stage: stageForInteractionCount(sequence),
  };
}

export function getChaosProgress(clickCount: number): number {
  const courtroomCount = 13;
  const safeCount = Number.isFinite(clickCount) ? Math.max(0, clickCount) : 0;
  return Math.min(100, Math.round((safeCount / courtroomCount) * 100));
}
