import { useCallback } from 'react';
import type { InteractionMetadata, InteractionType } from '@/shared/contracts';
import { useChaosStore } from '@/shared/chaosStore';

function createInteractionId(targetId: string): string {
  const uniquePart = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return `${targetId}-${uniquePart}`;
}

export interface InteractionGateway {
  recordAction(this: void, type: InteractionType, metadata?: InteractionMetadata): void;
}

export function useInteractionGateway(): InteractionGateway {
  const recordInteraction = useChaosStore((state) => state.recordInteraction);

  const recordAction = useCallback(
    (type: InteractionType, metadata?: InteractionMetadata) => {
      const targetId = metadata?.targetId ?? type;
      recordInteraction(type, {
        ...metadata,
        interactionId: metadata?.interactionId ?? createInteractionId(targetId),
      });
    },
    [recordInteraction],
  );

  return { recordAction };
}
