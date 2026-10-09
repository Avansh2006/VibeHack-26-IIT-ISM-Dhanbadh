import type { InteractionRecord } from '@/shared/contracts';

export type DefenseId = 'mouse' | 'javascript' | 'fifth-tab';

export interface DefenseOption {
  id: DefenseId;
  label: string;
  legalTheory: string;
}

export const DEFENSE_OPTIONS: readonly DefenseOption[] = [
  {
    id: 'mouse',
    label: 'My mouse did it',
    legalTheory: 'An ambitious peripheral acted without informed human supervision.',
  },
  {
    id: 'javascript',
    label: 'I was framed by JavaScript',
    legalTheory: 'The runtime manufactured intent while the defendant merely supplied electricity.',
  },
  {
    id: 'fifth-tab',
    label: 'I plead the fifth tab',
    legalTheory: 'All testimony is privileged until at least four browser tabs are closed.',
  },
] as const;

export interface EvidenceSummary {
  totalClicks: number;
  cursorIncidents: number;
  escapeAttempts: number;
  failedInnocenceTests: number;
}

export interface Verdict {
  title: string;
  ruling: string;
  sentence: string;
  menaceLevel: string;
}

export function summarizeEvidence(evidence: readonly InteractionRecord[]): EvidenceSummary {
  return evidence.reduce<EvidenceSummary>(
    (summary, record) => {
      summary.totalClicks += 1;

      if (
        record.type === 'primary-cta' ||
        record.type === 'navigation' ||
        record.type === 'feature-card'
      ) {
        summary.cursorIncidents += 1;
      }

      if (record.type === 'escape-attempt') summary.escapeAttempts += 1;
      if (record.type === 'popup-action' || record.type === 'custom') {
        summary.failedInnocenceTests += 1;
      }

      return summary;
    },
    {
      totalClicks: 0,
      cursorIncidents: 0,
      escapeAttempts: 0,
      failedInnocenceTests: 0,
    },
  );
}

export function selectCourtroomExhibits(
  evidence: readonly InteractionRecord[],
  maximum = 5,
): readonly InteractionRecord[] {
  if (maximum <= 0 || evidence.length === 0) return [];

  const preferredTypes = [
    'courtroom-trigger',
    'escape-attempt',
    'popup-action',
    'custom',
    'primary-cta',
  ] as const;
  const selected: InteractionRecord[] = [];

  for (const type of preferredTypes) {
    const record = [...evidence].reverse().find((item) => item.type === type);
    if (record && !selected.some((item) => item.id === record.id)) selected.push(record);
    if (selected.length === maximum) break;
  }

  for (const record of [...evidence].reverse()) {
    if (!selected.some((item) => item.id === record.id)) selected.push(record);
    if (selected.length === maximum) break;
  }

  return selected.sort((left, right) => left.sequence - right.sequence);
}

export function getVerdict(defense: DefenseId, summary: EvidenceSummary): Verdict {
  const aggravatingFactor = summary.escapeAttempts + summary.failedInnocenceTests;

  if (defense === 'mouse') {
    return {
      title: 'Guilty by Peripheral Association',
      ruling: `The court examined your mouse. It squeaked, requested counsel, and produced ${summary.totalClicks} tiny receipts.`,
      sentence: `You must apologize to every button you have emotionally compressed and complete ${Math.max(13, aggravatingFactor * 7)} hours of cursor community service.`,
      menaceLevel: 'Mouse Accomplice, First Degree',
    };
  }

  if (defense === 'javascript') {
    return {
      title: 'Guilty of Reckless Runtime Enablement',
      ruling: `JavaScript admitted to everything, then pointed out that you personally supplied ${summary.cursorIncidents} suspicious cursor incidents.`,
      sentence:
        'You are sentenced to maintain one legacy dependency with no documentation and a release note reading “misc fixes.”',
      menaceLevel: 'Asynchronous Public Nuisance',
    };
  }

  return {
    title: 'Contempt of Browser',
    ruling: `The fifth tab was located playing music somewhere. It declined to testify. Your ${summary.escapeAttempts} escape attempts did not help.`,
    sentence:
      'You must identify which tab is making noise without using the speaker icon, then close a cookie banner using only moral persuasion.',
    menaceLevel: 'Tabbed Menace with Intent to Refresh',
  };
}
