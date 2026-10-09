import { describe, expect, it } from 'vitest';
import type { InteractionRecord, InteractionType } from '@/shared/contracts';
import {
  DEFENSE_OPTIONS,
  getVerdict,
  selectCourtroomExhibits,
  summarizeEvidence,
} from '@/components/courtroom/trialLogic';

function record(sequence: number, type: InteractionType): InteractionRecord {
  return {
    id: `evidence-${sequence}`,
    sequence,
    type,
    timestamp: sequence,
    stageBefore: sequence < 4 ? 'uneasy' : 'rebellious',
    stageAfter: sequence >= 13 ? 'courtroom' : 'rebellious',
    metadata: { label: `Action ${sequence}` },
  };
}

describe('courtroom trial logic', () => {
  const evidence = [
    record(1, 'primary-cta'),
    record(2, 'navigation'),
    record(3, 'feature-card'),
    record(4, 'escape-attempt'),
    record(5, 'escape-attempt'),
    record(6, 'popup-action'),
    record(7, 'custom'),
    record(13, 'courtroom-trigger'),
  ];

  it('summarizes real evidence categories', () => {
    expect(summarizeEvidence(evidence)).toEqual({
      totalClicks: 8,
      cursorIncidents: 3,
      escapeAttempts: 2,
      failedInnocenceTests: 2,
    });
  });

  it('selects diverse exhibits while preserving chronology', () => {
    const exhibits = selectCourtroomExhibits(evidence, 5);
    expect(exhibits).toHaveLength(5);
    expect(exhibits.map((item) => item.sequence)).toEqual([1, 5, 6, 7, 13]);
  });

  it('provides exactly the three required defenses and distinct verdicts', () => {
    expect(DEFENSE_OPTIONS.map((option) => option.label)).toEqual([
      'My mouse did it',
      'I was framed by JavaScript',
      'I plead the fifth tab',
    ]);

    const summary = summarizeEvidence(evidence);
    expect(new Set(DEFENSE_OPTIONS.map((option) => getVerdict(option.id, summary).title)).size).toBe(
      3,
    );
  });
});
