import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, FastForward, Gavel, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import {
  useCourtroomAudio,
  useCourtroomVoices,
  type CourtroomSpeaker,
  type SpokenLine,
} from '@/audio';
import { DigitalMenaceCertificate } from '@/components/certificate';
import {
  DEFENSE_OPTIONS,
  getVerdict,
  selectCourtroomExhibits,
  summarizeEvidence,
  type DefenseId,
} from '@/components/courtroom/trialLogic';
import type { PunishmentType, TrialPhase } from '@/components/courtroom/CourtroomScene3D';
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
  roulette: 'Punishment roulette',
  mud: 'Mud of Shame',
  spinner: 'Human loading spinner',
  apology: 'Court-ordered apology',
  appeal: 'The final twist',
  certificate: 'Menace certified',
};

const SPEAKER_LABELS: Readonly<Record<CourtroomSpeaker, string>> = {
  judge: 'Hon. Justice Null Pointer',
  prosecutor: 'Ms. Terms & Conditions',
  defense: 'Counsel Error 404',
  clerk: 'Bailiff Bitflip',
  assistant: 'Counsel Error 404',
};

const PUNISHMENTS: Readonly<
  Record<PunishmentType, { title: string; subtitle: string; description: string; angle: number }>
> = {
  mud: {
    title: 'Mud of Shame',
    subtitle: 'Acrobatic public humiliation',
    description: 'A stylized 3D front roll into a cartoon mud puddle for maximum embarrassment.',
    angle: 0,
  },
  spinner: {
    title: 'Human Loading Spinner',
    subtitle: '404 hours of manual buffering',
    description: 'Sentence the defendant to spin a ridiculous buffering wheel by hand.',
    angle: (Math.PI * 2) / 3,
  },
  apology: {
    title: 'Court-Ordered Apology',
    subtitle: 'Recite unhinged confessions',
    description: 'Confess to pixel brutality before an unsympathetic court.',
    angle: (Math.PI * 4) / 3,
  },
};

const APOLOGY_OPTIONS = [
  {
    id: 1,
    text: 'I solemnly apologize to the pixels I bruised; I genuinely thought clicking was free speech.',
    reactionSpeaker: 'prosecutor' as const,
    reactionText: 'Hear that? Even the scroll bar is weeping at this insincerity!',
  },
  {
    id: 2,
    text: 'My mouse was possessed by the unholy spirit of Internet Explorer 6.',
    reactionSpeaker: 'defense' as const,
    reactionText: 'Your Honor, in our defense, the button was wearing very provocative CSS!',
  },
  {
    id: 3,
    text: 'I regret nothing and will click every glowing rectangle until the heat death of the universe.',
    reactionSpeaker: 'judge' as const,
    reactionText: 'Contempt! Maximum contempt! The court will not tolerate unbuffered swagger!',
  },
] as const;

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

  // Punishment roulette & mini-game state
  const [selectedPunishment, setSelectedPunishment] = useState<PunishmentType>('mud');
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [rouletteAngle, setRouletteAngle] = useState(0);
  const [mudScore, setMudScore] = useState(2.4);
  const [spinnerProgress, setSpinnerProgress] = useState(15);
  const [selectedApology, setSelectedApology] = useState<number | null>(null);
  const [punishmentSentence, setPunishmentSentence] = useState<string>(
    'Mud of Shame (Score: 2.4/10)',
  );

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

  // Dialogue director
  useEffect(() => {
    const generation = dialogueGeneration.current + 1;
    dialogueGeneration.current = generation;
    const lines = dialogueForPhase(phase, summary.totalClicks, verdict?.title);

    const perform = async () => {
      if (phase === 'summons' && !reducedMotion) {
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }
      for (const line of lines) {
        if (dialogueGeneration.current !== generation) return;
        setActiveLine(line);
        const fallbackDuration = Math.min(6400, Math.max(1800, line.text.length * 50));
        await Promise.race([
          speakRef.current(line),
          new Promise((resolve) => window.setTimeout(resolve, fallbackDuration)),
        ]);
        if (dialogueGeneration.current !== generation) return;
        await new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 80 : 260));
      }
    };

    void perform();

    return () => {
      dialogueGeneration.current += 1;
      skipVoice();
    };
  }, [phase, reducedMotion, summary.totalClicks, verdict?.title, skipVoice]);

  // Objection -> Verdict auto transition
  useEffect(() => {
    if (phase !== 'objection') return;
    const timeout = window.setTimeout(
      () => {
        setPhase('verdict');
        playCue('verdict');
        setGavelPulse((value) => value + 1);
      },
      reducedMotion ? 400 : 2100,
    );
    return () => window.clearTimeout(timeout);
  }, [phase, playCue, reducedMotion]);

  // Appeal twist cinematic auto transition to certificate
  useEffect(() => {
    if (phase !== 'appeal') return;
    playCue('buzzer');
    const fanfareTimer = window.setTimeout(() => playCue('cheer'), 400);

    const completeTimer = window.setTimeout(
      () => {
        setPhase('certificate');
      },
      reducedMotion ? 800 : 4200,
    );
    return () => {
      window.clearTimeout(fanfareTimer);
      window.clearTimeout(completeTimer);
    };
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

  // Roulette Spin Animation
  const spinRoulette = useCallback(() => {
    if (rouletteSpinning) return;
    setRouletteSpinning(true);
    playCue('spin');
    const punishments: PunishmentType[] = ['mud', 'spinner', 'apology'];
    const pick = punishments[Math.floor(Math.random() * punishments.length)] ?? 'mud';
    setSelectedPunishment(pick);

    const targetAngle = PUNISHMENTS[pick].angle + Math.PI * 6;
    setRouletteAngle(targetAngle);

    window.setTimeout(
      () => {
        setRouletteSpinning(false);
        strikeGavel();
      },
      reducedMotion ? 100 : 2200,
    );
  }, [playCue, reducedMotion, rouletteSpinning, strikeGavel]);

  // Execute Punishment Mini-game
  const startPunishment = (type: PunishmentType) => {
    setSelectedPunishment(type);
    if (type === 'mud') {
      const score = Number((1.5 + Math.random() * 2.5).toFixed(1));
      setMudScore(score);
      setPunishmentSentence(`Mud of Shame (Judges' Score: ${score}/10)`);
      setPhase('mud');
      playCue('splash');
      strikeGavel();
    } else if (type === 'spinner') {
      setSpinnerProgress(20);
      setPunishmentSentence('404 Hours of Human Loading Spinner');
      setPhase('spinner');
      playCue('spin');
      strikeGavel();
    } else {
      setSelectedApology(null);
      setPunishmentSentence('Court-Ordered Apology (Maximum Contempt)');
      setPhase('apology');
      strikeGavel();
    }
  };

  // Trigger Appeal Climax
  const triggerAppeal = () => {
    strikeGavel();
    setPhase('appeal');
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
              selectedPunishment={selectedPunishment}
              rouletteSpinning={rouletteSpinning}
              rouletteAngle={rouletteAngle}
              mudScore={mudScore}
              spinnerProgress={spinnerProgress}
              reducedMotion={reducedMotion}
              gavelPulse={gavelPulse}
              onGavel={strikeGavel}
              onSpinDrag={(delta) =>
                setSpinnerProgress((prev) => Math.min(100, Math.max(0, prev + delta)))
              }
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
          {/* Phase 1: Summons */}
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

          {/* Phase 2: Evidence */}
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

          {/* Phase 3: Defense Choice */}
          {phase === 'defense' ? <DefenseConsole onChoose={chooseDefense} /> : null}

          {/* Phase 4: Objection */}
          {phase === 'objection' ? (
            <section className="court-objection" role="status" aria-live="assertive">
              <p>Prosecution event detected</p>
              <h2>OBJECTION!</h2>
              <span>That defense contains illegally concentrated audacity.</span>
            </section>
          ) : null}

          {/* Phase 5: Verdict */}
          {phase === 'verdict' && verdict ? (
            <section className="court-verdict">
              <p>Unanimous decision by twelve browser tabs</p>
              <h2>{verdict.title}</h2>
              <p className="court-verdict-ruling">{verdict.ruling}</p>
              <div>
                <span>Sentence</span>
                {verdict.sentence}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="court-primary"
                  onClick={() => {
                    strikeGavel();
                    setPhase('roulette');
                  }}
                >
                  Spin the Punishment Roulette <ArrowRight aria-hidden="true" size={18} />
                </button>
                <button
                  type="button"
                  className="court-control"
                  onClick={() => {
                    strikeGavel();
                    setPhase('certificate');
                  }}
                >
                  Issue my Digital Menace certificate
                </button>
              </div>
            </section>
          ) : null}

          {/* Phase 6: Punishment Roulette */}
          {phase === 'roulette' ? (
            <section className="court-roulette-console" aria-labelledby="roulette-title">
              <div className="court-roulette-heading">
                <p>Judicial Wheel of Misfortune</p>
                <h2 id="roulette-title">Punishment Roulette</h2>
                <small className="text-white/60">
                  Select your destiny or let the High Court spin the brass wheel of retribution
                </small>
              </div>

              <div className="court-roulette-options">
                {(['mud', 'spinner', 'apology'] as const).map((type) => {
                  const p = PUNISHMENTS[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      className={`court-roulette-card ${selectedPunishment === type ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedPunishment(type);
                        setRouletteAngle(p.angle);
                        strikeGavel();
                      }}
                    >
                      <strong>{p.title}</strong>
                      <span className="text-amber-300 text-xs block font-bold">{p.subtitle}</span>
                      <small>{p.description}</small>
                    </button>
                  );
                })}
              </div>

              <div className="court-roulette-actions">
                <button
                  type="button"
                  className="court-primary"
                  onClick={spinRoulette}
                  disabled={rouletteSpinning}
                >
                  {rouletteSpinning ? 'Wheel spinning…' : 'Spin Wheel of Judgment'}
                </button>
                <button
                  type="button"
                  className="court-primary"
                  onClick={() => startPunishment(selectedPunishment)}
                  disabled={rouletteSpinning}
                >
                  Serve Punishment: {PUNISHMENTS[selectedPunishment].title}{' '}
                  <ArrowRight aria-hidden="true" size={18} />
                </button>
              </div>
            </section>
          ) : null}

          {/* Phase 7A: Mud of Shame */}
          {phase === 'mud' ? (
            <section className="court-mud-console" aria-labelledby="mud-title">
              <p>Punishment Execution · Public Humiliation</p>
              <h2 id="mud-title">Mud of Shame</h2>
              <div className="court-scorecard">
                <span>Judges' Score</span>
                <strong>{mudScore} / 10</strong>
                <span>Splatter: Extra Sloppy</span>
              </div>
              <p className="text-sm max-w-xl mx-auto text-white/70">
                The defendant has belly-flopped into the permanent judicial mud puddle. Deductions
                applied for lack of splash aerodynamics.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  className="court-control"
                  onClick={() => {
                    const score = Number((1.5 + Math.random() * 2.5).toFixed(1));
                    setMudScore(score);
                    playCue('splash');
                    strikeGavel();
                  }}
                >
                  <RotateCcw size={16} /> Roll Again in Shame
                </button>
                <button type="button" className="court-primary" onClick={triggerAppeal}>
                  File an Immediate Appeal <ArrowRight aria-hidden="true" size={18} />
                </button>
              </div>
            </section>
          ) : null}

          {/* Phase 7B: Human Loading Spinner */}
          {phase === 'spinner' ? (
            <section className="court-spinner-console" aria-labelledby="spinner-title">
              <p>Sentence: 404 Hours of Buffering</p>
              <h2 id="spinner-title">Human Loading Spinner</h2>
              <div className="court-spinner-track">
                <div className="court-spinner-fill" style={{ width: `${spinnerProgress}%` }} />
              </div>
              <p className="text-sm text-cyan-300 font-mono">
                Buffer Progress: {spinnerProgress}% · Estimated Time Remaining: 403h 59m 54s
              </p>
              <button
                type="button"
                className="court-spinner-dial"
                onClick={() => {
                  setSpinnerProgress((p) => Math.min(100, p + 18));
                  playCue('spin');
                }}
              >
                SPIN ME
              </button>
              <p className="text-xs text-white/50">
                Click or drag the loading wheel rapidly to load your dignity back into memory!
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button type="button" className="court-primary" onClick={triggerAppeal}>
                  {spinnerProgress >= 100
                    ? 'Buffer Complete: Appeal Sentence'
                    : 'Abandon Buffering & Appeal'}{' '}
                  <ArrowRight aria-hidden="true" size={18} />
                </button>
              </div>
            </section>
          ) : null}

          {/* Phase 7C: Court-Ordered Apology */}
          {phase === 'apology' ? (
            <section className="court-apology-console" aria-labelledby="apology-title">
              <p>Mandatory Pixel Penance</p>
              <h2 id="apology-title">Court-Ordered Apology</h2>
              <div className="court-apology-options">
                {APOLOGY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`court-apology-button ${selectedApology === opt.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedApology(opt.id);
                      setActiveLine({ speaker: opt.reactionSpeaker, text: opt.reactionText });
                      void speakRef.current({
                        speaker: opt.reactionSpeaker,
                        text: opt.reactionText,
                      });
                      strikeGavel();
                    }}
                  >
                    "{opt.text}"
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-center gap-3">
                <button type="button" className="court-primary" onClick={triggerAppeal}>
                  Submit Apology & Appeal Sentence <ArrowRight aria-hidden="true" size={18} />
                </button>
              </div>
            </section>
          ) : null}

          {/* Phase 8: The Final Twist (Appeal Denied!) */}
          {phase === 'appeal' ? (
            <section className="court-appeal-console" role="status" aria-live="assertive">
              <p className="text-red-400 font-black tracking-widest uppercase text-xs">
                Supreme Court Final Ruling
              </p>
              <h2>APPEAL DENIED!</h2>
              <p className="court-appeal-proclamation">
                "YOU ARE NOW BANNED FROM CLICKING FOR THREE BUSINESS CENTURIES!"
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  className="court-primary"
                  onClick={() => setPhase('certificate')}
                >
                  Accept Eternal Ban & View Certificate <ArrowRight aria-hidden="true" size={18} />
                </button>
              </div>
            </section>
          ) : null}
        </main>
      ) : null}

      {/* Synchronized Subtitles with Speaker Labels */}
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

      {/* Phase 9: Menace Certificate */}
      {phase === 'certificate' && verdict ? (
        <div className="court-certificate-layer">
          <DigitalMenaceCertificate
            certificateId={certificateIdForSession(sessionId)}
            issuedAt={startedAt}
            clickCount={summary.totalClicks}
            verdict={verdict}
            punishment={punishmentSentence}
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
      {
        speaker: 'judge',
        text: 'Order! Order in this browser session! Who gave this individual administrator privileges over a mouse?',
      },
      {
        speaker: 'prosecutor',
        text: `Your Honor, the prosecution will prove the defendant clicked ${clicks} times without reading paragraph 42 of the Terms!`,
      },
      {
        speaker: 'defense',
        text: 'Objection! My client was merely exercising their constitutional right to tap glass!',
      },
      {
        speaker: 'clerk',
        text: 'Logging 13 counts of aggressive audacity. Dignity status: expired.',
      },
    ];
  if (phase === 'evidence')
    return [
      {
        speaker: 'prosecutor',
        text: 'I submit Exhibit A: A cursor caught lingering over a defenseless button with malicious confidence.',
      },
      {
        speaker: 'judge',
        text: 'The screenshots are blurry, but the sheer lack of remorse is in four K.',
      },
      { speaker: 'clerk', text: 'Exhibit entered. Dignity quotient recalculating to zero.' },
    ];
  if (phase === 'defense')
    return [
      {
        speaker: 'defense',
        text: 'Good news: I found three defenses. Bad news: I learned law from a cookie consent banner!',
      },
    ];
  if (phase === 'objection')
    return [
      {
        speaker: 'prosecutor',
        text: 'Objection! The defense is attempting to blame a rectangle with batteries!',
      },
      { speaker: 'judge', text: 'Sustained! The rectangle has a cleaner record than you.' },
    ];
  if (phase === 'verdict')
    return [
      {
        speaker: 'judge',
        text: `${verdictTitle ?? 'Guilty'}. Please remain seated while your dignity is permanently cached.`,
      },
      {
        speaker: 'clerk',
        text: 'Guilty verdict logged. Prepare the punishment roulette wheel.',
      },
    ];
  if (phase === 'roulette')
    return [
      {
        speaker: 'judge',
        text: 'Spin the wheel of judgment, convict! Let fate decide your public humiliation!',
      },
    ];
  if (phase === 'mud')
    return [
      {
        speaker: 'judge',
        text: 'Three points deducted for failing to splash the prosecution! Pathetic roll!',
      },
      { speaker: 'prosecutor', text: 'Notice how the mud immediately rejected the defendant.' },
    ];
  if (phase === 'spinner')
    return [
      {
        speaker: 'judge',
        text: 'Too slow! My dial-up in 1998 had more bandwidth than your wrist!',
      },
      {
        speaker: 'defense',
        text: 'Hang in there! We are buffering at approximately three pixels per second!',
      },
    ];
  if (phase === 'apology')
    return [
      {
        speaker: 'clerk',
        text: 'The defendant will now recite court-mandated regret to the World Wide Web.',
      },
      {
        speaker: 'defense',
        text: 'Please speak clearly into the mic, and remember to blame JavaScript!',
      },
    ];
  if (phase === 'appeal')
    return [
      {
        speaker: 'judge',
        text: 'APPEAL DENIED! YOU ARE NOW BANNED FROM CLICKING FOR THREE BUSINESS CENTURIES!',
      },
      { speaker: 'prosecutor', text: 'The prosecution accepts this glorious victory!' },
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
