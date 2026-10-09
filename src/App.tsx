import { useCallback, useLayoutEffect } from 'react';
import { CourtroomExperience } from '@/components/courtroom';
import { ChaosDashboard } from '@/components/dashboard';
import { ChaosEffectsLayer } from '@/components/effects';
import { getChaosBeat, getChaosProgress, useInteractionGateway } from '@/engine';
import type { InteractionMetadata, InteractionType } from '@/shared/contracts';
import { selectEffectiveChaosStage, useChaosStore } from '@/shared/chaosStore';

function App() {
  const clickCount = useChaosStore((state) => state.clickCount);
  const chaosStage = useChaosStore((state) => state.chaosStage);
  const effectiveStage = useChaosStore(selectEffectiveChaosStage);
  const evidenceLog = useChaosStore((state) => state.evidenceLog);
  const sessionId = useChaosStore((state) => state.sessionId);
  const startedAt = useChaosStore((state) => state.startedAt);
  const reset = useChaosStore((state) => state.reset);
  const { recordAction } = useInteractionGateway();
  const beat = getChaosBeat(clickCount);
  const progress = getChaosProgress(clickCount);
  const landingActionEnabled = clickCount < 4;

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [sessionId]);

  const handleEffectAction = useCallback(
    (type: InteractionType, label: string) => {
      recordAction(type, {
        targetId: `chaos-beat-${clickCount + 1}`,
        label,
        source: 'chaos-engine',
      });
    },
    [clickCount, recordAction],
  );

  const handleDashboardInteraction = useCallback(
    (type: InteractionType, metadata: InteractionMetadata) => {
      recordAction(type, metadata);
    },
    [recordAction],
  );

  if (chaosStage === 'courtroom') {
    return (
      <CourtroomExperience
        key={sessionId}
        sessionId={sessionId}
        startedAt={startedAt}
        evidenceLog={evidenceLog}
        onReplay={reset}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0b0d]">
      <ChaosDashboard
        beat={beat}
        clickCount={clickCount}
        chaosStage={effectiveStage}
        evidenceLog={evidenceLog}
        progress={progress}
        actionEnabled={landingActionEnabled}
        onReset={reset}
        onInteraction={handleDashboardInteraction}
        onAction={() =>
          recordAction(beat.actionType, {
            targetId: 'primary-chaos-cta',
            label: beat.actionLabel,
            source: 'landing-integration',
          })
        }
      />

      <ChaosEffectsLayer
        beat={beat}
        clickCount={clickCount}
        chaosStage={effectiveStage}
        evidenceLog={evidenceLog}
        onAction={handleEffectAction}
      />
    </div>
  );
}

export default App;
