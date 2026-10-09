import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeAlert,
  Gavel,
  ScrollText,
  ShieldQuestion,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { gsap } from 'gsap';
import { useReducedMotion } from 'motion/react';
import { useCourtroomAudio } from '@/audio';
import { DigitalMenaceCertificate } from '@/components/certificate';
import {
  DEFENSE_OPTIONS,
  getVerdict,
  selectCourtroomExhibits,
  summarizeEvidence,
  type DefenseId,
} from '@/components/courtroom/trialLogic';
import type { InteractionRecord } from '@/shared/contracts';

type TrialPhase = 'summons' | 'evidence' | 'defense' | 'objection' | 'verdict' | 'certificate';

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

function certificateIdForSession(sessionId: string): string {
  return `CASE-${sessionId.replace('session-', '').replaceAll('-', '').slice(0, 8).toUpperCase()}`;
}

export function CourtroomExperience({
  sessionId,
  startedAt,
  evidenceLog,
  onReplay,
}: CourtroomExperienceProps) {
  const [phase, setPhase] = useState<TrialPhase>('summons');
  const [selectedDefense, setSelectedDefense] = useState<DefenseId | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const audio = useCourtroomAudio();
  const summary = useMemo(() => summarizeEvidence(evidenceLog), [evidenceLog]);
  const exhibits = useMemo(() => selectCourtroomExhibits(evidenceLog), [evidenceLog]);
  const verdict = selectedDefense ? getVerdict(selectedDefense, summary) : null;

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const context = gsap.context(() => {
      const duration = reducedMotion ? 0.01 : 0.65;
      gsap.fromTo(
        '[data-scene]',
        { autoAlpha: 0, y: reducedMotion ? 0 : 28 },
        { autoAlpha: 1, y: 0, duration, ease: 'power3.out' },
      );

      if (phase === 'summons' && !reducedMotion) {
        gsap.fromTo(
          '[data-curtain-left]',
          { xPercent: 0 },
          { xPercent: -102, duration: 1.2, ease: 'power4.inOut' },
        );
        gsap.fromTo(
          '[data-curtain-right]',
          { xPercent: 0 },
          { xPercent: 102, duration: 1.2, ease: 'power4.inOut' },
        );
        gsap.fromTo(
          '[data-debris]',
          { y: -120, rotate: -18, autoAlpha: 0.9 },
          {
            y: '115vh',
            rotate: 260,
            autoAlpha: 0,
            duration: 1.45,
            stagger: 0.07,
            ease: 'power2.in',
          },
        );
      }

      if (phase === 'objection' && !reducedMotion) {
        gsap.fromTo(
          '[data-objection]',
          { scale: 0.2, rotate: -12, autoAlpha: 0 },
          {
            scale: 1,
            rotate: -3,
            autoAlpha: 1,
            duration: 0.38,
            ease: 'back.out(2.6)',
          },
        );
      }

      if (phase === 'verdict' && !reducedMotion) {
        gsap.fromTo(
          '[data-judge]',
          { y: 0 },
          { y: -9, duration: 0.16, repeat: 3, yoyo: true, ease: 'power1.inOut' },
        );
      }
    }, root);

    return () => context.revert();
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase !== 'objection') return;

    const timeout = window.setTimeout(
      () => {
        setPhase('verdict');
        audio.playCue('verdict');
      },
      reducedMotion ? 250 : 1250,
    );
    return () => window.clearTimeout(timeout);
  }, [audio, phase, reducedMotion]);

  const chooseDefense = (defense: DefenseId) => {
    setSelectedDefense(defense);
    setPhase('objection');
    audio.playCue('objection');
  };

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen overflow-x-hidden bg-[#090605] text-amber-50"
    >
      <CourtroomBackdrop phase={phase} />

      {phase === 'summons' && !reducedMotion && (
        <>
          <div
            data-curtain-left
            aria-hidden="true"
            className="pointer-events-none fixed inset-y-0 left-0 z-50 w-1/2 origin-left bg-[linear-gradient(90deg,#180409,#5f101f_70%,#25040b)] shadow-2xl"
          />
          <div
            data-curtain-right
            aria-hidden="true"
            className="pointer-events-none fixed inset-y-0 right-0 z-50 w-1/2 origin-right bg-[linear-gradient(270deg,#180409,#5f101f_70%,#25040b)] shadow-2xl"
          />
          {Array.from({ length: 7 }, (_, index) => (
            <span
              key={index}
              data-debris
              aria-hidden="true"
              className="pointer-events-none fixed z-40 h-4 w-20 rounded-full bg-fuchsia-300/65"
              style={{ left: `${12 + index * 13}%`, top: `${5 + (index % 3) * 8}%` }}
            />
          ))}
        </>
      )}

      <header className="relative z-30 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">
            Court of Interface Affairs
          </p>
          <p className="mt-1 text-sm font-bold text-white/45">{PHASE_LABELS[phase]}</p>
        </div>
        <button
          type="button"
          onClick={audio.toggleMute}
          aria-pressed={audio.muted}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-amber-200/15 bg-black/25 px-4 text-xs font-bold text-amber-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
        >
          {audio.muted ? (
            <VolumeX aria-hidden="true" size={16} />
          ) : (
            <Volume2 aria-hidden="true" size={16} />
          )}
          {audio.muted ? 'Unmute court' : 'Mute court'}
        </button>
      </header>

      <main className="relative z-20 mx-auto flex w-full max-w-7xl flex-col px-4 pb-16 sm:px-8">
        {phase !== 'certificate' && (
          <div className="order-2 mt-7 grid gap-5 lg:order-1 lg:mt-0 lg:grid-cols-[0.72fr_1.6fr_0.78fr] lg:items-end">
            <Prosecutor phase={phase} evidenceCount={summary.totalClicks} />
            <Judge phase={phase} />
            <CourtClerk exhibitCount={exhibits.length} />
          </div>
        )}

        <section data-scene className="relative order-1 mt-2 lg:order-2 lg:mt-7">
          {phase === 'summons' && (
            <SummonsScene
              evidenceCount={summary.totalClicks}
              onContinue={() => {
                audio.playCue('gavel');
                setPhase('evidence');
              }}
            />
          )}

          {phase === 'evidence' && (
            <EvidenceScene
              summary={summary}
              exhibits={exhibits}
              onContinue={() => {
                audio.playCue('gavel');
                setPhase('defense');
              }}
            />
          )}

          {phase === 'defense' && <DefenseScene onChoose={chooseDefense} />}

          {phase === 'objection' && (
            <div className="grid min-h-72 place-items-center" role="status" aria-live="assertive">
              <div data-objection className="text-center">
                <p className="text-6xl font-black tracking-[-0.08em] text-red-400 drop-shadow-[0_0_35px_rgba(248,113,113,0.45)] sm:text-9xl">
                  OBJECTION!
                </p>
                <p className="mt-4 text-lg font-black text-amber-50">
                  That defense contains dangerously high levels of confidence.
                </p>
              </div>
            </div>
          )}

          {phase === 'verdict' && verdict && (
            <VerdictScene
              verdict={verdict}
              onCertificate={() => {
                audio.playCue('gavel');
                setPhase('certificate');
              }}
            />
          )}

          {phase === 'certificate' && verdict && (
            <DigitalMenaceCertificate
              certificateId={certificateIdForSession(sessionId)}
              issuedAt={startedAt}
              clickCount={summary.totalClicks}
              verdict={verdict}
              onReplay={() => {
                audio.stop();
                onReplay();
              }}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function CourtroomBackdrop({ phase }: { phase: TrialPhase }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.17),transparent_40rem),linear-gradient(180deg,#120a08,#070707)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[repeating-linear-gradient(90deg,rgba(120,53,15,0.1)_0_8%,transparent_8%_16%)]" />
      <div className="absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-300/8 blur-3xl" />
      {phase === 'objection' && <div className="absolute inset-0 bg-red-700/20" />}
    </div>
  );
}

function Judge({ phase }: { phase: TrialPhase }) {
  const dialogue =
    phase === 'summons'
      ? 'Order in the DOM. And somebody center that div.'
      : phase === 'evidence'
        ? 'The screenshots are blurry, but the audacity is in 4K.'
        : phase === 'defense'
          ? 'Counsel, choose your excuse with whatever dignity remains.'
          : phase === 'verdict'
            ? 'I have reached a verdict and also my lunch break.'
            : 'The court is pretending to deliberate.';

  return (
    <div data-judge className="order-first text-center lg:order-none">
      <div className="mx-auto w-fit rounded-[2rem] border border-amber-200/20 bg-[#21130d]/95 px-7 pb-5 pt-6 shadow-[0_28px_75px_rgba(0,0,0,0.62)]">
        <div className="mx-auto grid size-24 place-items-center rounded-full border-4 border-amber-200/35 bg-[radial-gradient(circle_at_50%_35%,#fde68a,#92400e)] text-5xl shadow-[0_0_45px_rgba(251,191,36,0.2)]">
          👩‍⚖️
        </div>
        <p className="mt-3 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
          Hon. Justice Null Pointer
        </p>
        <p className="mt-3 max-w-md text-sm font-bold leading-6 text-amber-50/75">“{dialogue}”</p>
      </div>
      <div className="mx-auto h-8 w-[88%] rounded-b-xl bg-gradient-to-b from-amber-950 to-[#100704] shadow-2xl" />
    </div>
  );
}

function Prosecutor({ phase, evidenceCount }: { phase: TrialPhase; evidenceCount: number }) {
  const statement =
    phase === 'defense'
      ? 'The prosecution is prepared to object to all three options simultaneously.'
      : phase === 'objection'
        ? 'I object to the defendant having a personality!'
        : `We have ${evidenceCount} clicks, motive, opportunity, and an extremely judgmental cursor.`;

  return (
    <aside
      data-prosecutor
      className="rounded-3xl border border-red-300/20 bg-red-950/35 p-5 backdrop-blur-lg"
    >
      <div className="flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-red-400/15 text-2xl">🧑‍💼</div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Prosecutor</p>
          <p className="text-sm font-black">Ms. Terms &amp; Conditions</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/60">“{statement}”</p>
    </aside>
  );
}

function CourtClerk({ exhibitCount }: { exhibitCount: number }) {
  return (
    <aside className="rounded-3xl border border-cyan-300/15 bg-cyan-950/20 p-5 backdrop-blur-lg">
      <div className="flex items-center gap-3">
        <ScrollText aria-hidden="true" className="text-cyan-300" />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
            Court clerk
          </p>
          <p className="text-sm font-black">Exhibit.exe</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/55">
        {exhibitCount} premium exhibits selected. Printer jam classified as hostile witness.
      </p>
    </aside>
  );
}

function SummonsScene({
  evidenceCount,
  onContinue,
}: {
  evidenceCount: number;
  onContinue(this: void): void;
}) {
  return (
    <div className="mx-auto max-w-4xl rounded-[2rem] border border-amber-200/20 bg-black/35 p-6 text-center backdrop-blur-xl sm:p-9">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-300">
        Case opened automatically
      </p>
      <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
        The Website v. Your Clicking Finger
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/60">
        The collapsed interface has reorganized itself into a court because therapy was outside the
        sprint scope. {evidenceCount} interactions are now under oath.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-amber-200 px-6 py-3 text-sm font-black text-amber-950 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
      >
        <Gavel aria-hidden="true" size={18} />
        Face the extremely online judge
      </button>
    </div>
  );
}

function EvidenceScene({
  summary,
  exhibits,
  onContinue,
}: {
  summary: ReturnType<typeof summarizeEvidence>;
  exhibits: readonly InteractionRecord[];
  onContinue(this: void): void;
}) {
  const metrics = [
    ['Clicks entered into evidence', summary.totalClicks],
    ['Suspicious cursor incidents', summary.cursorIncidents],
    ['Emergency escape attempts', summary.escapeAttempts],
    ['Failed innocence tests', summary.failedInnocenceTests],
  ] as const;

  return (
    <div className="rounded-[2rem] border border-amber-200/15 bg-black/35 p-5 backdrop-blur-xl sm:p-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-3xl font-black text-amber-200">{value}</p>
            <p className="mt-2 text-xs leading-5 text-white/45">{label}</p>
          </div>
        ))}
      </div>

      <ol className="mt-6 grid gap-3 lg:grid-cols-5">
        {exhibits.map((record) => (
          <li key={record.id} className="rounded-2xl border border-red-300/15 bg-red-950/20 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-300">
              Exhibit {record.sequence}
            </p>
            <p className="mt-2 text-sm font-black text-white">
              {record.metadata?.label ?? record.type.replaceAll('-', ' ')}
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-wider text-white/30">
              {record.type.replaceAll('-', ' ')} · {record.stageAfter}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-amber-200 px-5 py-3 text-sm font-black text-amber-950 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
        >
          Attempt a legally questionable defense
          <ArrowRight aria-hidden="true" size={17} />
        </button>
      </div>
    </div>
  );
}

function DefenseScene({ onChoose }: { onChoose(this: void, defense: DefenseId): void }) {
  return (
    <div className="mx-auto max-w-5xl rounded-[2rem] border border-cyan-200/15 bg-black/40 p-6 backdrop-blur-xl sm:p-8">
      <div className="text-center">
        <ShieldQuestion aria-hidden="true" className="mx-auto text-cyan-300" size={38} />
        <p className="mt-3 text-xs font-black uppercase tracking-[0.26em] text-cyan-300">
          Choose counsel wisely
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
          How do you plead?
        </h2>
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {DEFENSE_OPTIONS.map((option, index) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChoose(option.id)}
            className="group min-h-52 rounded-3xl border border-white/10 bg-white/[0.045] p-5 text-left transition hover:-translate-y-2 hover:border-cyan-200/45 hover:bg-cyan-200/10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-cyan-200 motion-reduce:transform-none"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-cyan-300 text-sm font-black text-cyan-950">
              {index + 1}
            </span>
            <span className="mt-6 block text-xl font-black text-white">{option.label}</span>
            <span className="mt-3 block text-sm leading-6 text-white/45">{option.legalTheory}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function VerdictScene({
  verdict,
  onCertificate,
}: {
  verdict: NonNullable<ReturnType<typeof getVerdict>>;
  onCertificate(this: void): void;
}) {
  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.25rem] border border-red-300/25 bg-[linear-gradient(135deg,rgba(69,10,10,0.88),rgba(9,9,11,0.94))] shadow-[0_35px_110px_rgba(0,0,0,0.7)]">
      <div className="border-b border-red-300/15 bg-red-400 px-6 py-3 text-center text-xs font-black uppercase tracking-[0.3em] text-red-950">
        Verdict entered into the permanent browser history
      </div>
      <div className="p-6 text-center sm:p-10">
        <BadgeAlert aria-hidden="true" className="mx-auto text-red-300" size={46} />
        <h2 className="mt-5 text-4xl font-black tracking-[-0.055em] sm:text-6xl">
          {verdict.title}
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/65">{verdict.ruling}</p>
        <div className="mx-auto mt-7 max-w-3xl rounded-2xl border border-amber-200/20 bg-amber-200/8 p-5 text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
            Sentence
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-amber-50">{verdict.sentence}</p>
        </div>
        <button
          type="button"
          onClick={onCertificate}
          className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-amber-200 px-6 py-3 text-sm font-black text-amber-950 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
        >
          Issue my Digital Menace certificate
          <ArrowRight aria-hidden="true" size={17} />
        </button>
      </div>
    </div>
  );
}
