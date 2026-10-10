import type { InteractionMetadata, InteractionType } from '@/shared/contracts';

export type DashboardInteractionId =
  | 'nav-overview'
  | 'nav-incidents'
  | 'nav-analytics'
  | 'nav-evidence'
  | 'search-incidents'
  | 'toggle-alerts'
  | 'inspect-sanity'
  | 'verify-audit'
  | 'challenge-forecast';

export interface DashboardInteraction {
  type: InteractionType;
  metadata: InteractionMetadata & { targetId: string; label: string; source: string };
  sectionId?: string;
}

export const DASHBOARD_INTERACTIONS: Readonly<
  Record<DashboardInteractionId, DashboardInteraction>
> = {
  'nav-overview': {
    type: 'navigation',
    metadata: { targetId: 'dashboard-overview', label: 'Open overview', source: 'dashboard' },
    sectionId: 'dashboard-overview',
  },
  'nav-incidents': {
    type: 'navigation',
    metadata: { targetId: 'dashboard-incidents', label: 'Open incidents', source: 'dashboard' },
    sectionId: 'dashboard-incidents',
  },
  'nav-analytics': {
    type: 'navigation',
    metadata: { targetId: 'dashboard-analytics', label: 'Open analytics', source: 'dashboard' },
    sectionId: 'dashboard-analytics',
  },
  'nav-evidence': {
    type: 'navigation',
    metadata: { targetId: 'dashboard-evidence', label: 'Open evidence', source: 'dashboard' },
    sectionId: 'dashboard-evidence',
  },
  'search-incidents': {
    type: 'navigation',
    metadata: { targetId: 'incident-search', label: 'Search incident log', source: 'dashboard' },
    sectionId: 'dashboard-incidents',
  },
  'toggle-alerts': {
    type: 'popup-action',
    metadata: { targetId: 'dashboard-alerts', label: 'Review legal alerts', source: 'dashboard' },
  },
  'inspect-sanity': {
    type: 'feature-card',
    metadata: { targetId: 'sanity-telemetry', label: 'Run sanity diagnostic', source: 'dashboard' },
    sectionId: 'dashboard-analytics',
  },
  'verify-audit': {
    type: 'feature-card',
    metadata: {
      targetId: 'evidence-audit',
      label: 'Verify immutable audit trail',
      source: 'dashboard',
    },
    sectionId: 'dashboard-evidence',
  },
  'challenge-forecast': {
    type: 'feature-card',
    metadata: {
      targetId: 'chaos-forecast',
      label: 'Challenge chaos forecast',
      source: 'dashboard',
    },
    sectionId: 'dashboard-analytics',
  },
};
