import { beforeEach, describe, expect, it } from 'vitest';
import { stageForInteractionCount } from '@/shared/contracts';
import { selectEffectiveChaosStage, useChaosStore } from '@/shared/chaosStore';

describe('stageForInteractionCount', () => {
  it.each([
    [0, 'pristine'],
    [1, 'uneasy'],
    [3, 'uneasy'],
    [4, 'rebellious'],
    [6, 'rebellious'],
    [7, 'hostile'],
    [9, 'hostile'],
    [10, 'meltdown'],
    [12, 'meltdown'],
    [13, 'courtroom'],
    [999, 'courtroom'],
  ] as const)('maps %i interactions to %s', (count, expected) => {
    expect(stageForInteractionCount(count)).toBe(expected);
  });
});

describe('chaos store', () => {
  beforeEach(() => useChaosStore.getState().reset());

  it('records one immutable evidence item per eligible interaction', () => {
    useChaosStore.getState().recordInteraction('primary-cta', { targetId: 'hero-cta' });

    const state = useChaosStore.getState();
    expect(state.clickCount).toBe(1);
    expect(state.chaosStage).toBe('uneasy');
    expect(state.evidenceLog).toHaveLength(1);
    expect(state.evidenceLog[0]).toMatchObject({
      sequence: 1,
      type: 'primary-cta',
      stageBefore: 'pristine',
      stageAfter: 'uneasy',
    });
  });

  it('rejects repeated semantic interaction IDs', () => {
    const metadata = { interactionId: 'pointer-42' };
    useChaosStore.getState().recordInteraction('navigation', metadata);
    useChaosStore.getState().recordInteraction('navigation', metadata);

    expect(useChaosStore.getState().clickCount).toBe(1);
  });

  it('keeps presenter overrides out of evidence and clears them on reset', () => {
    useChaosStore.getState().recordInteraction('feature-card');
    useChaosStore.getState().demoStage('meltdown');

    let state = useChaosStore.getState();
    expect(selectEffectiveChaosStage(state)).toBe('meltdown');
    expect(state.clickCount).toBe(1);
    expect(state.evidenceLog).toHaveLength(1);

    state.reset();
    state = useChaosStore.getState();
    expect(state.demoStageOverride).toBeNull();
    expect(state.evidenceLog).toEqual([]);
  });

  it('freezes prosecution evidence after the thirteenth interaction', () => {
    for (let index = 0; index < 15; index += 1) {
      useChaosStore.getState().recordInteraction('custom');
    }

    const state = useChaosStore.getState();
    expect(state.clickCount).toBe(13);
    expect(state.chaosStage).toBe('courtroom');
    expect(state.evidenceLog).toHaveLength(13);
  });
});
