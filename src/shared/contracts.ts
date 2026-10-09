/** Locked integration contract. Change only through the integration lead. */
export const CHAOS_STAGES = [
  'pristine',
  'uneasy',
  'rebellious',
  'hostile',
  'meltdown',
  'courtroom',
] as const;

export type ChaosStage = (typeof CHAOS_STAGES)[number];

export const CHAOS_STAGE_LABELS: Readonly<Record<ChaosStage, string>> = {
  pristine: 'System pristine',
  uneasy: 'Mildly concerned',
  rebellious: 'Openly uncooperative',
  hostile: 'Actively litigating',
  meltdown: 'Catastrophically offended',
  courtroom: 'Court is now in session',
};

export const CHAOS_STAGE_THRESHOLDS = {
  pristine: 0,
  uneasy: 1,
  rebellious: 4,
  hostile: 7,
  meltdown: 10,
  courtroom: 13,
} as const satisfies Readonly<Record<ChaosStage, number>>;

export const INTERACTION_TYPES = [
  'primary-cta',
  'navigation',
  'feature-card',
  'popup-action',
  'escape-attempt',
  'courtroom-trigger',
  'custom',
] as const;

export type InteractionType = (typeof INTERACTION_TYPES)[number];

export interface InteractionMetadata {
  /** Optional semantic event ID used to reject duplicate/nested dispatches. */
  interactionId?: string;
  targetId?: string;
  label?: string;
  [key: string]: unknown;
}

export interface InteractionRecord {
  id: string;
  sequence: number;
  type: InteractionType;
  timestamp: number;
  stageBefore: ChaosStage;
  stageAfter: ChaosStage;
  metadata?: Readonly<InteractionMetadata>;
}

export interface ChaosState {
  sessionId: string;
  startedAt: number;
  clickCount: number;
  /** Evidence-derived stage only. Use selectEffectiveChaosStage for presentation. */
  chaosStage: ChaosStage;
  evidenceLog: readonly InteractionRecord[];
  /** Presenter-only visual override. It never alters clickCount or evidenceLog. */
  demoStageOverride: ChaosStage | null;
  /** Bounded IDs used to make semantic interaction recording idempotent. */
  seenInteractionIds: readonly string[];
  recordInteraction(this: void, type: InteractionType, metadata?: InteractionMetadata): void;
  reset(this: void): void;
  demoStage(this: void, stage: ChaosStage | null): void;
}

export function stageForInteractionCount(count: number): ChaosStage {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;

  if (safeCount >= CHAOS_STAGE_THRESHOLDS.courtroom) return 'courtroom';
  if (safeCount >= CHAOS_STAGE_THRESHOLDS.meltdown) return 'meltdown';
  if (safeCount >= CHAOS_STAGE_THRESHOLDS.hostile) return 'hostile';
  if (safeCount >= CHAOS_STAGE_THRESHOLDS.rebellious) return 'rebellious';
  if (safeCount >= CHAOS_STAGE_THRESHOLDS.uneasy) return 'uneasy';
  return 'pristine';
}
