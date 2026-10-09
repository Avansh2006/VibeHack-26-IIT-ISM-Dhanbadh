import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, FastForward, Gavel, Volume2, VolumeX } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useCourtroomAudio, useCourtroomVoices, type SpokenLine } from '@/audio';
import { DigitalMenaceCertificate } from '@/components/certificate';
import {
  DEFENSE_OPTIONS,
  getVerdict,
  selectCourtroomExhibits,
  summarizeEvidence,
  type DefenseId,
} from '@/components/courtroom/trialLogic';
import type { TrialPhase } from '@/components/courtroom/CourtroomScene3D';
import type { InteractionRecord } from '@/shared/contracts';
import './courtroom.css';

const CourtroomScene3D = lazy(() => import('@/components/courtroom/CourtroomScene3D'));

export interface CourtroomExperienceProps {
  sessionId: string;
  startedAt: number;
  evidenceLog: readonly InteractionRecord[];
  onReplay(this: void): void;
}

const PHASE_LABELS: Readonly<Record<TrialPhase, string>> = {
  summons: 'Court convening',
  evidence: 'Exhibits entered',
  defense: 'Questionable defense',
  objection: 'Prosecutorial yelling',
  verdict: 'Judgment rendered',
  certificate: 'Menace certified',
};
const SPEAKER_LABELS: Readonly<Record<SpokenLine['speaker'], string>> = {
  judge: 'Hon. Justice Null Pointer',
  prosecutor: 'Ms. Terms & Conditions',
  assistant: 'Your court-appointed tab',
};

function certificateIdForSession(sessionId: string): string {
  return `CASE-${sessionId.replace('session-', '').replaceAll('-', '').slice(0, 8).toUpperCase()}`;
}

function hasWebGlSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function CourtroomExperience({
  sessionId,
  startedAt,
  evidenceLog,
  onReplay,
}: CourtroomExperienceProps) {
  const [phase, setPhase] = useState<TrialPhase>('summons');
  const [selectedDefense, setSelectedDefense] = useState<DefenseId | null>(null);
  const [activeLine, setActiveLine] = useState<SpokenLine | null>(null);
  const [gavelPulse, setGavelPulse] = useState(0);
  const reducedMotion = useReducedMotion() ?? false;
  const audio = useCourtroomAudio();
  const voices = useCourtroomVoices(audio.muted);
  const { muted, playCue, startAmbience, stop: stopAudio, toggleMute } = audio;
  const { skip: skipVoice, speak } = voices;
  const speakRef = useRef(speak);
  const dialogueGeneration = useRef(0);
  const summary = useMemo(() => summarizeEvidence(evidenceLog), [evidenceLog]);
  const exhibits = useMemo(() => selectCourtroomExhibits(evidenceLog), [evidenceLog]);
  const verdict = selectedDefense ? getVerdict(selectedDefense, summary) : null;
  const webGlSupported = useMemo(() => hasWebGlSupport(), []);

  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);
  useEffect(() => {
    startAmbience();
    return stopAudio;
  }, [startAmbience, stopAudio]);

  const strikeGavel = useCallback(() => {
    setGavelPulse((value) => value + 1);
    playCue('gavel');
  }, [playCue]);

  useEffect(() => {
    const generation = dialogueGeneration.current + 1;
    dialogueGeneration.current = generation;
    const lines = dialogueForPhase(phase, summary.totalClicks, verdict?.title);
    const perform = async () => {
      if (phase === 'summons' && !reducedMotion)
        await new Promise((resolve) => window.setTimeout(resolve, 1550));
      for (const line of lines) {
        if (dialogueGeneration.current !== generation) return;
        setActiveLine(line);
        const fallbackDuration = Math.min(6200, Math.max(1700, line.text.length * 48));
        await Promise.race([
          speakRef.current(line),
          new Promise((resolve) => window.setTimeout(resolve, fallbackDuration)),
        ]);
        if (dialogueGeneration.current !== generation) return;
        await new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 80 : 280));
      }
    };
    void perform();
    return () => {
      dialogueGeneration.current += 1;
      skipVoice();
    };
  }, [phase, reducedMotion, summary.totalClicks, verdict?.title, skipVoice]);

  useEffect(() => {
    if (phase !== 'objection') return;
    const timeout = window.setTimeout(
      () => {
        setPhase('verdict');
        playCue('verdict');
        setGavelPulse((value) => value + 1);
      },
      reducedMotion ? 500 : 2200,
    );
    return () => window.clearTimeout(timeout);
  }, [phase, playCue, reducedMotion]);

  const skipDialogue = () => {
    dialogueGeneration.current += 1;
    skipVoice();
    setActiveLine(null);
  };
  const chooseDefense = (defense: DefenseId) => {
    setSelectedDefense(defense);
    setPhase('objection');
    setGavelPulse((value) => value + 1);
    playCue('objection');
  };

  return (
    <div className={`court-experience court-phase-${phase}`}>
      <div className="court-canvas" aria-hidden="true">
        {webGlSupported ? (
          <Suspense fallback={<CourtroomFallback loading />}>
            <CourtroomScene3D
              phase={phase}
              speaker={activeLine?.speaker ?? null}
              exhibits={exhibits}
              selectedDefense={selectedDefense}
              reducedMotion={reducedMotion}
              gavelPulse={gavelPulse}
              onGavel={strikeGavel}
            />
          </Suspense>
        ) : (
          <CourtroomFallback />
        )}
      </div>
      <div className="court-vignette" aria-hidden="true" />

      <header className="court-topbar">
        <div>
          <p className="court-kicker">The High Court of Interface Affairs</p>
          <p className="court-phase-label">
            {PHASE_LABELS[phase]} · Case {certificateIdForSession(sessionId)}
          </p>
        </div>
        <div className="court-controls">
          <button
            type="button"
            className="court-control"
            onClick={strikeGavel}
            aria-label="Strike the interactive gavel"
          >
            <Gavel aria-hidden="true" size={16} />
            <span>Gavel</span>
          </button>
          <button
            type="button"
            className="court-control"
            onClick={skipDialogue}
            disabled={!activeLine}
          >
            <FastForward aria-hidden="true" size={16} />
            <span>Skip line</span>
          </button>
          <button
            type="button"
            className="court-control"
            onClick={() => {
              skipVoice();
              toggleMute();
            }}
            aria-pressed={muted}
          >
            {muted ? (
              <VolumeX aria-hidden="true" size={16} />
            ) : (
              <Volume2 aria-hidden="true" size={16} />
            )}
            <span>{muted ? 'Unmute court' : 'Mute court'}</span>
          </button>
        </div>
      </header>

      {phase !== 'certificate' ? (
        <main className="court-ui">
          {phase === 'summons' ? (
            <section className="court-title-sequence" aria-labelledby="trial-title">
              <p>Supreme Court of Extremely Online Conduct</p>
              <h1 id="trial-title">
                THE INTERNET
                <br />
                <span>VS. YOU.</span>
              </h1>
              <div className="court-charge">13 counts of clicking with suspicious confidence</div>
              <button
                type="button"
                className="court-primary"
                onClick={() => {
                  strikeGavel();
                  setPhase('evidence');
                }}
              >
                Face the extremely online judge <ArrowRight aria-hidden="true" size={18} />
              </button>
            </section>
          ) : null}
          {phase === 'evidence' ? (
            <EvidenceConsole
              summary={summary}
              exhibits={exhibits}
              onContinue={() => {
                strikeGavel();
                setPhase('defense');
              }}
            />
          ) : null}
          {phase === 'defense' ? <DefenseConsole onChoose={chooseDefense} /> : null}
          {phase === 'objection' ? (
            <section className="court-objection" role="status" aria-live="assertive">
              <p>Prosecution event detected</p>
              <h2>OBJECTION!</h2>
              <span>That defense contains illegally concentrated audacity.</span>
            </section>
          ) : null}
          {phase === 'verdict' && verdict ? (
            <section className="court-verdict">
              <p>Unanimous decision by twelve browser tabs</p>
              <h2>{verdict.title}</h2>
              <p className="court-verdict-ruling">{verdict.ruling}</p>
              <div>
                <span>Sentence</span>
                {verdict.sentence}
              </div>
              <button
                type="button"
                className="court-primary"
                onClick={() => {
                  strikeGavel();
                  setPhase('certificate');
                }}
              >
                Issue my Digital Menace certificate <ArrowRight aria-hidden="true" size={18} />
              </button>
            </section>
          ) : null}
        </main>
      ) : null}

      {phase !== 'certificate' ? (
        <div className="court-subtitle" role="status" aria-live="polite">
          {activeLine ? (
            <>
              <span>{SPEAKER_LABELS[activeLine.speaker]}</span>
              <p>{activeLine.text}</p>
            </>
          ) : (
            <p>
              {muted
                ? 'Court audio muted. Subtitles remain constitutionally protected.'
                : 'The court is dramatically shuffling papers.'}
            </p>
          )}
        </div>
      ) : null}

      {phase === 'certificate' && verdict ? (
        <div className="court-certificate-layer">
          <DigitalMenaceCertificate
            certificateId={certificateIdForSession(sessionId)}
            issuedAt={startedAt}
            clickCount={summary.totalClicks}
            verdict={verdict}
            onReplay={() => {
              skipVoice();
              stopAudio();
              onReplay();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function dialogueForPhase(
  phase: TrialPhase,
  clicks: number,
  verdictTitle?: string,
): readonly SpokenLine[] {
  if (phase === 'summons')
    return [
      { speaker: 'judge', text: 'Order! Order! Who let this person near a mouse?' },
      {
        speaker: 'prosecutor',
        text: `Your Honor, the defendant clicked ${clicks} times. With intent.`,
      },
      { speaker: 'judge', text: 'Disgusting. My Wi-Fi has seen enough.' },
    ];
  if (phase === 'evidence')
    return [
      {
        speaker: 'prosecutor',
        text: 'I submit Exhibit A: a cursor caught loitering over a perfectly innocent button.',
      },
      { speaker: 'judge', text: 'The screenshots are blurry, but the audacity is in four K.' },
    ];
  if (phase === 'defense')
    return [
      {
        speaker: 'assistant',
        text: 'Good news. I found three defenses. Bad news: I learned law from a cookie banner.',
      },
    ];
  if (phase === 'objection')
    return [
      {
        speaker: 'prosecutor',
        text: 'Objection! The defense is attempting to blame a rectangle with batteries!',
      },
      { speaker: 'judge', text: 'Sustained. The rectangle has a cleaner record.' },
    ];
  if (phase === 'verdict')
    return [
      {
        speaker: 'judge',
        text: `${verdictTitle ?? 'Guilty'}. Please remain seated while your dignity is cached.`,
      },
    ];
  return [];
}

function EvidenceConsole({
  summary,
  exhibits,
  onContinue,
}: {
  summary: ReturnType<typeof summarizeEvidence>;
  exhibits: readonly InteractionRecord[];
  onContinue(this: void): void;
}) {
  const metrics = [
    ['Clicks', summary.totalClicks],
    ['Cursor incidents', summary.cursorIncidents],
    ['Escape attempts', summary.escapeAttempts],
    ['Failed innocence tests', summary.failedInnocenceTests],
  ] as const;
  return (
    <section className="court-evidence-console" aria-labelledby="evidence-title">
      <div className="court-console-heading">
        <div>
          <p>Evidence hologram · actual Zustand history</p>
          <h2 id="evidence-title">The click trail testifies</h2>
        </div>
        <button type="button" className="court-primary" onClick={onContinue}>
          Attempt a legally questionable defense <ArrowRight aria-hidden="true" size={18} />
        </button>
      </div>
      <div className="court-metrics">
        {metrics.map(([label, value]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <ol className="court-exhibit-strip">
        {exhibits.map((record) => (
          <li key={record.id}>
            <span>Exhibit {record.sequence}</span>
            <strong>{String(record.metadata?.label ?? record.type).replaceAll('-', ' ')}</strong>
            <small>
              {record.type.replaceAll('-', ' ')} · {record.stageAfter}
            </small>
          </li>
        ))}
      </ol>
    </section>
  );
}

function DefenseConsole({ onChoose }: { onChoose(this: void, defense: DefenseId): void }) {
  return (
    <section className="court-defense-console" aria-labelledby="defense-title">
      <p>Your court-appointed tab is sweating</p>
      <h2 id="defense-title">Choose a defense</h2>
      <div>
        {DEFENSE_OPTIONS.map((option, index) => (
          <button key={option.id} type="button" onClick={() => onChoose(option.id)}>
            <span>0{index + 1}</span>
            <strong>{option.label}</strong>
            <small>{option.legalTheory}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function CourtroomFallback({ loading = false }: { loading?: boolean }) {
  return (
    <div className="court-webgl-fallback">
      <div className="court-fallback-bench" />
      <div className="court-fallback-judge" />
      <p>
        {loading
          ? 'Assembling twelve polygons of judgment…'
          : 'WebGL recused itself. The trial remains fully playable.'}
      </p>
    </div>
  );
}
