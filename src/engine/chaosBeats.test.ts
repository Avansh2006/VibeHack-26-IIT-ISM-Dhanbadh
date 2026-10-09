import { describe, expect, it } from 'vitest';
import { getChaosBeat, getChaosProgress } from '@/engine/chaosBeats';

describe('chaos beat plan', () => {
  it('provides an authored beat for every interaction through courtroom handoff', () => {
    const beats = Array.from({ length: 14 }, (_, count) => getChaosBeat(count));

    expect(beats).toHaveLength(14);
    expect(new Set(beats.map((beat) => beat.effect)).size).toBe(14);
    expect(beats[0]?.stage).toBe('pristine');
    expect(beats[4]?.stage).toBe('rebellious');
    expect(beats[7]?.stage).toBe('hostile');
    expect(beats[10]?.stage).toBe('meltdown');
    expect(beats[13]?.stage).toBe('courtroom');
    expect(beats[12]?.actionType).toBe('courtroom-trigger');
  });

  it('clamps invalid and out-of-range counts safely', () => {
    expect(getChaosBeat(-4).sequence).toBe(0);
    expect(getChaosBeat(Number.NaN).sequence).toBe(0);
    expect(getChaosBeat(999).sequence).toBe(13);
  });

  it('reports bounded progress', () => {
    expect(getChaosProgress(-1)).toBe(0);
    expect(getChaosProgress(0)).toBe(0);
    expect(getChaosProgress(13)).toBe(100);
    expect(getChaosProgress(99)).toBe(100);
  });
});
