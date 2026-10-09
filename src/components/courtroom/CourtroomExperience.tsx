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
  news: 'Breaking News interruption',
  witness: 'Surprise witness',
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
  defendant: 'The Defendant (unprompted)',
  defense: 'Counsel Error 404',
  clerk: 'Bailiff Bitflip',
  assistant: 'Counsel Error 404',
  anchor: 'Channel 13 Emergency Desk',
  girlfriend: 'The Localhost Girlfriend',
};

const PUNISHMENTS: Readonly<
  Record<PunishmentType, { title: string; subtitle: string; description: string; angle: number }>
> = {
  mud: {
    title: 'Mud of Shame',
    subtitle: 'Acrobatic public humiliation',
    description: 'One heroic front roll into mud that has already retained counsel.',
    angle: 0,
  },
  spinner: {
    title: 'Human Loading Spinner',
    subtitle: '404 hours of manual buffering',
    description: 'Buffer manually until your dignity reaches one hundred percent. It will not.',
    angle: (Math.PI * 2) / 3,
  },
  apology: {
    title: 'Court-Ordered Apology',
    subtitle: 'Recite unhinged confessions',
    description: 'Apologize to every bruised pixel while the scrollbar refuses eye contact.',
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
  const [openingStep, setOpeningStep] = useState<
    'ready' | 'defendant' | 'prosecutor' | 'judge' | 'complete'
  >('ready');
  const [openingAudioResult, setOpeningAudioResult] = useState<'pending' | 'ended' | 'failed'>(
    'pending',
  );
  const [newsResult, setNewsResult] = useState<'pending' | 'ended' | 'skipped' | 'failed'>(
    'pending',
  );
  const [appealReveal, setAppealReveal] = useState(false);

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
  const openingGeneration = useRef(0);
  const newsGeneration = useRef(0);
  const mardAudioRef = useRef<HTMLAudioElement | null>(null);
  const newsVideoRef = useRef<HTMLVideoElement | null>(null);
  const mutedRef = useRef(muted);
  const summary = useMemo(() => summarizeEvidence(evidenceLog), [evidenceLog]);
  const exhibits = useMemo(() => selectCourtroomExhibits(evidenceLog), [evidenceLog]);
  const verdict = selectedDefense ? getVerdict(selectedDefense, summary) : null;
  const webGlSupported = useMemo(() => hasWebGlSupport(), []);

  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    startAmbience();
    return stopAudio;
  }, [startAmbience, stopAudio]);

  useEffect(() => {
    const asset = new Audio(`${import.meta.env.BASE_URL}audio/mard.mpeg`);
    asset.preload = 'auto';
    asset.muted = false;
    mardAudioRef.current = asset;
    return () => {
      openingGeneration.current += 1;
      asset.pause();
      asset.removeAttribute('src');
      asset.load();
      mardAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mardAudioRef.current) mardAudioRef.current.muted = muted;
  }, [muted]);

  const strikeGavel = useCallback(() => {
    setGavelPulse((value) => value + 1);
    playCue('gavel');
  }, [playCue]);

  // Dialogue director
  useEffect(() => {
    if (phase === 'summons' || phase === 'news') return;
    const generation = dialogueGeneration.current + 1;
    dialogueGeneration.current = generation;
    const lines = dialogueForPhase(phase, verdict?.title);

    const perform = async () => {
      if (phase === 'appeal' && !reducedMotion) {
        await new Promise((resolve) => window.setTimeout(resolve, 850));
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
      if (phase === 'witness' && dialogueGeneration.current === generation) {
        await new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 80 : 520));
        setGavelPulse((value) => value + 1);
        playCue('gavel');
        setActiveLine(null);
        setPhase('evidence');
      }
    };

    void perform();

    return () => {
      dialogueGeneration.current += 1;
      skipVoice();
    };
  }, [phase, reducedMotion, summary.totalClicks, verdict?.title, skipVoice, playCue]);

  useEffect(() => {
    if (phase !== 'news') return;
    const generation = newsGeneration.current + 1;
    newsGeneration.current = generation;
    const video = newsVideoRef.current;
    const line: SpokenLine = {
      speaker: 'anchor',
      text: `Breaking news! Defendant caught clicking ${summary.totalClicks} times. Even his mouse has hired a lawyer!`,
    };

    const perform = async () => {
      setNewsResult('pending');
      setActiveLine(line);
      if (!video) {
        setNewsResult('failed');
        await speakRef.current(line);
      } else {
        video.currentTime = 0;
        video.muted = mutedRef.current;
        const playback = new Promise<'ended' | 'failed'>((resolve) => {
          let settled = false;
          const finish = (result: 'ended' | 'failed') => {
            if (settled) return;
            settled = true;
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('error', handleError);
            resolve(result);
          };
          const handleEnded = () => finish('ended');
          const handleError = () => finish('failed');
          video.addEventListener('ended', handleEnded, { once: true });
          video.addEventListener('error', handleError, { once: true });
          void video.play().catch(() => finish('failed'));
        });
        const [, result] = await Promise.all([
          Promise.race([
            speakRef.current(line),
            new Promise((resolve) => window.setTimeout(resolve, 7200)),
          ]),
          playback,
        ]);
        if (newsGeneration.current !== generation) return;
        setNewsResult(result);
      }
      if (newsGeneration.current !== generation) return;
      await new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 80 : 520));
      setActiveLine(null);
      setPhase('witness');
    };

    void perform();
    return () => {
      newsGeneration.current += 1;
      video?.pause();
      skipVoice();
    };
  }, [phase, reducedMotion, skipVoice, summary.totalClicks]);

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
    const revealTimer = window.setTimeout(
      () => {
        setAppealReveal(true);
        playCue('buzzer');
      },
      reducedMotion ? 120 : 780,
    );
    const fanfareTimer = window.setTimeout(() => playCue('cheer'), reducedMotion ? 260 : 1350);

    const completeTimer = window.setTimeout(
      () => {
        setPhase('certificate');
      },
      reducedMotion ? 1100 : 5200,
    );
    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(fanfareTimer);
      window.clearTimeout(completeTimer);
    };
  }, [phase, playCue, reducedMotion]);

  const skipDialogue = () => {
    if (phase === 'news') {
      newsGeneration.current += 1;
      newsVideoRef.current?.pause();
      skipVoice();
      setNewsResult('skipped');
      setActiveLine(null);
      setPhase('witness');
      return;
    }
    dialogueGeneration.current += 1;
    skipVoice();
    setActiveLine(null);
  };

  const startOpeningDialogue = async () => {
    if (openingStep !== 'ready') return;
    const generation = openingGeneration.current + 1;
    openingGeneration.current = generation;
    dialogueGeneration.current += 1;
    skipVoice();
    startAmbience();

    const primedAsset = mardAudioRef.current;
    if (primedAsset) {
      primedAsset.muted = true;
      try {
        await primedAsset.play();
        primedAsset.pause();
        primedAsset.currentTime = 0;
      } catch {
        // Some browsers do not need priming; the real playback path still handles failure.
      }
      primedAsset.muted = muted;
    }

    const primedVideo = newsVideoRef.current;
    if (primedVideo) {
      primedVideo.muted = true;
      try {
        await primedVideo.play();
        primedVideo.pause();
        primedVideo.currentTime = 0;
      } catch {
        // The interruption still has a reliable TTS/subtitle fallback.
      }
      primedVideo.muted = muted;
    }

    const speakOpening = async (line: SpokenLine, minimumDuration: number) => {
      setActiveLine(line);
      await Promise.all([
        Promise.race([
          speakRef.current(line),
          new Promise((resolve) => window.setTimeout(resolve, 5200)),
        ]),
        new Promise((resolve) => window.setTimeout(resolve, minimumDuration)),
      ]);
    };

    setOpeningStep('defendant');
    await speakOpening({ speaker: 'defendant', text: 'I AM INNOCENT!' }, reducedMotion ? 450 : 900);
    if (openingGeneration.current !== generation) return;

    skipVoice();
    setOpeningStep('prosecutor');
    setActiveLine({ speaker: 'prosecutor', text: 'Ek kachori do samosa.' });
    const asset = mardAudioRef.current;
    let assetEnded = false;
    if (asset) {
      asset.currentTime = 0;
      asset.muted = muted;
      assetEnded = await new Promise<boolean>((resolve) => {
        const finish = (ended: boolean) => {
          asset.removeEventListener('ended', handleEnded);
          asset.removeEventListener('error', handleError);
          resolve(ended);
        };
        const handleEnded = () => finish(true);
        const handleError = () => finish(false);
        asset.addEventListener('ended', handleEnded, { once: true });
        asset.addEventListener('error', handleError, { once: true });
        void asset.play().catch(() => finish(false));
      });
    }
    setOpeningAudioResult(assetEnded ? 'ended' : 'failed');
    if (!assetEnded) {
      await new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 350 : 1100));
    }
    if (openingGeneration.current !== generation) return;

    setOpeningStep('judge');
    await speakOpening(
      { speaker: 'judge', text: "ORDER! ORDER! Let's continue with the court." },
      reducedMotion ? 550 : 1100,
    );
    if (openingGeneration.current !== generation) return;

    setOpeningStep('complete');
    setActiveLine(null);
    strikeGavel();
    setPhase('news');
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
    setAppealReveal(false);
    strikeGavel();
    setPhase('appeal');
  };

  return (
    <div
      className={`court-experience court-phase-${phase}`}
      data-opening-step={openingStep}
      data-opening-audio-result={openingAudioResult}
      data-story-phase={phase}
      data-news-result={newsResult}
      data-tts-supported={voices.supported}
    >
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
      <div className={`court-news-layer ${phase === 'news' ? 'is-active' : ''}`}>
        <video
          ref={newsVideoRef}
          src={`${import.meta.env.BASE_URL}video/video1.mp4`}
          playsInline
          preload="metadata"
          muted={muted}
          aria-label="Breaking news courtroom evidence reel"
        />
        <div className="court-news-bug" aria-hidden="true">
          <strong>BREAKING NEWS</strong>
          <span>LIVE · CLICK CRIME DESK</span>
        </div>
      </div>

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
            disabled={!activeLine || (phase === 'summons' && openingStep !== 'ready')}
          >
            <FastForward aria-hidden="true" size={16} />
            <span>{phase === 'news' ? 'Skip interruption' : 'Skip line'}</span>
          </button>
          <button
            type="button"
            className="court-control"
            onClick={() => {
              skipVoice();
              if (mardAudioRef.current) mardAudioRef.current.muted = !muted;
              if (newsVideoRef.current) newsVideoRef.current.muted = !muted;
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
                onClick={() => void startOpeningDialogue()}
                disabled={openingStep !== 'ready'}
              >
                {openingStep === 'ready'
                  ? 'Face the extremely online judge'
                  : 'Opening statements in progress…'}{' '}
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            </section>
          ) : null}

          {phase === 'news' ? (
            <section className="court-news-caption" aria-label="Breaking news interruption">
              <span>Channel 13½ · Courtroom Crisis Unit</span>
              <strong>{summary.totalClicks} CLICKS. ZERO ALIBIS.</strong>
            </section>
          ) : null}

          {phase === 'witness' ? (
            <section className="court-witness-caption" aria-label="Surprise witness testimony">
              <span>SURPRISE WITNESS · CONNECTION: LOCALHOST</span>
              <strong>Relationship status: uncommitted changes</strong>
              <small>
                Exhibit confirms {summary.totalClicks} clicks, {summary.cursorIncidents} suspicious
                cursor incidents and {summary.escapeAttempts} escape attempts.
              </small>
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
                {appealReveal ? 'Supreme Court Final Ruling' : 'Judges consulting a Magic 8 Ball'}
              </p>
              <h2>{appealReveal ? 'APPEAL DENIED!' : 'DELIBERATING…'}</h2>
              <p className="court-appeal-proclamation">
                {appealReveal
                  ? '“YOU ARE NOW BANNED FROM CLICKING FOR THREE BUSINESS CENTURIES!”'
                  : 'The court has reviewed your appeal for almost one whole second.'}
              </p>
              <div className="mt-3">
                {appealReveal ? (
                  <button
                    type="button"
                    className="court-primary"
                    onClick={() => setPhase('certificate')}
                  >
                    Accept Eternal Ban & View Certificate{' '}
                    <ArrowRight aria-hidden="true" size={18} />
                  </button>
                ) : null}
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

function dialogueForPhase(phase: TrialPhase, verdictTitle?: string): readonly SpokenLine[] {
  if (phase === 'summons' || phase === 'news') return [];
  if (phase === 'witness')
    return [
      { speaker: 'girlfriend', text: 'YOUR HONOR! I HAVE EVIDENCE!' },
      { speaker: 'judge', text: 'Who are you?' },
      {
        speaker: 'girlfriend',
        text: 'His girlfriend. Well, technically his localhost girlfriend. He never deployed our relationship.',
      },
      {
        speaker: 'girlfriend',
        text: "He promised me forever but couldn't even commit to one browser tab!",
      },
      { speaker: 'judge', text: "OBJECTION! That's actually devastating." },
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
        text: 'Three points deducted! The mud showed more commitment to that landing than you did!',
      },
      {
        speaker: 'prosecutor',
        text: 'For the record, even the mud has requested emotional damages.',
      },
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
      {
        speaker: 'prosecutor',
        text: 'The prosecution accepts this victory and the defendant’s remaining browser cookies.',
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
