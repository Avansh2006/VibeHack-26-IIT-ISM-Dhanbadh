import { describe, expect, it } from 'vitest';
import { DASHBOARD_INTERACTIONS } from './dashboardInteractions';

describe('dashboard interaction coverage', () => {
  it('routes every enabled dashboard affordance through a unique evidence target', () => {
    const interactions = Object.values(DASHBOARD_INTERACTIONS);
    const targets = interactions.map(({ metadata }) => metadata.targetId);

    expect(interactions).toHaveLength(9);
    expect(new Set(targets).size).toBe(interactions.length);
    expect(new Set(interactions.map(({ type }) => type))).toEqual(
      new Set(['navigation', 'popup-action', 'feature-card']),
    );
    expect(interactions.every(({ metadata }) => metadata.source === 'dashboard')).toBe(true);
    expect(interactions.every(({ metadata }) => Boolean(metadata.label))).toBe(true);
  });
});
