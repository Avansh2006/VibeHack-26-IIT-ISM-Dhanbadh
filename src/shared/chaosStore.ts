import { create } from 'zustand';
import type {
  ChaosStage,
  ChaosState,
  InteractionMetadata,
  InteractionRecord,
  InteractionType,
} from '@/shared/contracts';
import { stageForInteractionCount } from '@/shared/contracts';

const MAX_DEDUPLICATION_IDS = 256;

function createId(prefix: string): string {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return `${prefix}-${id}`;
}

function initialSessionState() {
  return {
    sessionId: createId('session'),
    startedAt: Date.now(),
    clickCount: 0,
    chaosStage: 'pristine' as const,
    evidenceLog: [] as readonly InteractionRecord[],
    demoStageOverride: null,
    seenInteractionIds: [] as readonly string[],
  };
}

export const useChaosStore = create<ChaosState>()((set) => ({
  ...initialSessionState(),

  recordInteraction: (type: InteractionType, metadata?: InteractionMetadata) => {
    set((state) => {
      const interactionId = metadata?.interactionId;
      if (interactionId && state.seenInteractionIds.includes(interactionId)) {
        return state;
      }

      // Courtroom interactions are handled by its local scene state and are not new prosecution evidence.
      if (state.chaosStage === 'courtroom') {
        return state;
      }

      const nextCount = state.clickCount + 1;
      const nextStage = stageForInteractionCount(nextCount);
      const record: InteractionRecord = {
        id: createId('evidence'),
        sequence: nextCount,
        type,
        timestamp: Date.now(),
        stageBefore: state.chaosStage,
        stageAfter: nextStage,
        ...(metadata ? { metadata: { ...metadata } } : {}),
      };
      const nextSeenIds = interactionId
        ? [...state.seenInteractionIds, interactionId].slice(-MAX_DEDUPLICATION_IDS)
        : state.seenInteractionIds;

      return {
        clickCount: nextCount,
        chaosStage: nextStage,
        evidenceLog: [...state.evidenceLog, record],
        seenInteractionIds: nextSeenIds,
      };
    });
  },

  reset: () => set(initialSessionState()),

  demoStage: (stage: ChaosStage | null) => set({ demoStageOverride: stage }),
}));

export const selectEffectiveChaosStage = (state: ChaosState): ChaosStage =>
  state.demoStageOverride ?? state.chaosStage;
