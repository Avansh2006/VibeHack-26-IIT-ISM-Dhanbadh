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
  MemeReaction,
  type MemePlaybackResult,
  type MemeReactionHandle,
} from '@/components/courtroom/MemeReaction';
import type { MemeReactionDefinition, MemeReactionId } from '@/components/courtroom/memeReactions';
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
  breakup: 'Relationship rollback',
  evidence: 'Exhibits entered',
  defense: 'Questionable defense',
  objection: 'Prosecutorial yelling',
  jury: 'Browser-tab jury',
  bribe: 'Highly ethical negotiation',
  bribeResult: 'Bribe entered into evidence',
  rage: 'Judicial rage mode',
  mouse: 'Mouse witness',
  verdict: 'Judgment rendered',
  sponsor: 'Contractually suspicious ad',
  plea: 'Impossible plea bargain',
  pleaResult: 'Plea regretted instantly',
  secret: 'Final judicial meltdown',
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
  jury: 'The Browser-Tab Jury',
  mouse: 'Mr. Logitech, Hostile Witness',
  sponsor: 'Definitely Real Sponsor Voice',
};

type BribeChoice = 'cash' | 'samosa' | 'star';
type PleaChoice = 'buffering' | 'ad';

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
  const [witnessReady, setWitnessReady] = useState(false);
  const [bribeChoice, setBribeChoice] = useState<BribeChoice | null>(null);
  const [pleaChoice, setPleaChoice] = useState<PleaChoice | null>(null);
  const [innocenceClaims, setInnocenceClaims] = useState(0);
  const [appealReveal, setAppealReveal] = useState(false);
  const [activeMeme, setActiveMeme] = useState<MemeReactionId | null>(null);
  const [verdictReady, setVerdictReady] = useState(false);
  const [arrestResult, setArrestResult] = useState<'pending' | 'ended' | 'skipped' | 'failed'>(
    'pending',
  );
  const [postCredits, setPostCredits] = useState<'idle' | 'playing' | 'complete'>('idle');

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
  const directorGeneration = useRef(0);
  const currentMediaCancelRef = useRef<(() => void) | null>(null);
  const mardAudioRef = useRef<HTMLAudioElement | null>(null);
  const newsVideoRef = useRef<HTMLVideoElement | null>(null);
  const arrestVideoRef = useRef<HTMLVideoElement | null>(null);
  const arrestStartedRef = useRef(false);
  const memeReactionRef = useRef<MemeReactionHandle | null>(null);
  const mutedRef = useRef(muted);
  const witnessReadyRef = useRef(false);
  const witnessReadyResolverRef = useRef<(() => void) | null>(null);
  const summary = useMemo(() => summarizeEvidence(evidenceLog), [evidenceLog]);
  const exhibits = useMemo(() => selectCourtroomExhibits(evidenceLog), [evidenceLog]);
  const verdict = selectedDefense ? getVerdict(selectedDefense, summary) : null;
  const webGlSupported = useMemo(() => hasWebGlSupport(), []);

  const handleWitnessReady = useCallback(() => {
    witnessReadyRef.current = true;
    setWitnessReady(true);
    witnessReadyResolverRef.current?.();
    witnessReadyResolverRef.current = null;
  }, []);

  const waitForWitnessReady = useCallback(async () => {
    if (!webGlSupported || witnessReadyRef.current) return;
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(watchdog);
        resolve();
      };
      const watchdog = window.setTimeout(finish, 12000);
      witnessReadyResolverRef.current = finish;
    });
  }, [webGlSupported]);

  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    if (arrestResult === 'pending') return;
    startAmbience();
    return stopAudio;
  }, [arrestResult, startAmbience, stopAudio]);

  useEffect(() => {
    const asset = new Audio(`${import.meta.env.BASE_URL}audio/mard.mpeg`);
    asset.preload = 'auto';
    asset.muted = false;
    mardAudioRef.current = asset;
    return () => {
      directorGeneration.current += 1;
      currentMediaCancelRef.current?.();
      skipVoice();
      asset.pause();
      asset.removeAttribute('src');
      asset.load();
      mardAudioRef.current = null;
    };
  }, [skipVoice]);

  useEffect(() => {
    if (mardAudioRef.current) mardAudioRef.current.muted = muted;
    if (arrestVideoRef.current) arrestVideoRef.current.muted = muted;
  }, [muted]);

  const strikeGavel = useCallback(() => {
    setGavelPulse((value) => value + 1);
    playCue('gavel');
  }, [playCue]);

  const handleMemeActiveChange = useCallback((reaction: MemeReactionDefinition | null) => {
    setActiveMeme(reaction?.id ?? null);
    if (reaction) {
      setActiveLine({ speaker: reaction.cameraSpeaker, text: reaction.caption });
    }
  }, []);

  const playMeme = useCallback(
    async (id: MemeReactionId): Promise<MemePlaybackResult> => {
      const player = memeReactionRef.current;
      if (!player) return 'failed';
      skipVoice();
      stopAudio();
      const cancel = () => player.skip();
      currentMediaCancelRef.current = cancel;
      const result = await player.play(id);
      if (currentMediaCancelRef.current === cancel) currentMediaCancelRef.current = null;
      startAmbience();
      return result;
    },
    [skipVoice, startAmbience, stopAudio],
  );

  const waitForSpeech = useCallback(
    async (line: SpokenLine) => {
      setActiveLine(line);
      if (mutedRef.current) {
        await new Promise((resolve) =>
          window.setTimeout(resolve, reducedMotion ? 160 : Math.min(2200, line.text.length * 34)),
        );
        return;
      }
      await new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(watchdog);
          resolve();
        };
        const watchdog = window.setTimeout(
          () => {
            skipVoice();
            finish();
          },
          Math.min(45000, Math.max(15000, line.text.length * 260)),
        );
        void speakRef.current(line).then(finish, finish);
      });
      await new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 60 : 640));
    },
    [reducedMotion, skipVoice],
  );

  const waitForMedia = useCallback(
    (media: HTMLMediaElement, watchdogMs: number) =>
      new Promise<'ended' | 'failed' | 'skipped'>((resolve) => {
        let settled = false;
        const finish = (result: 'ended' | 'failed' | 'skipped') => {
          if (settled) return;
          settled = true;
          window.clearTimeout(watchdog);
          media.removeEventListener('ended', handleEnded);
          media.removeEventListener('error', handleError);
          if (currentMediaCancelRef.current === cancel) currentMediaCancelRef.current = null;
          resolve(result);
        };
        const handleEnded = () => finish('ended');
        const handleError = () => finish('failed');
        const cancel = () => {
          media.pause();
          finish('skipped');
        };
        const watchdog = window.setTimeout(() => {
          media.pause();
          finish('failed');
        }, watchdogMs);
        currentMediaCancelRef.current = cancel;
        media.addEventListener('ended', handleEnded, { once: true });
        media.addEventListener('error', handleError, { once: true });
        void media.play().catch(handleError);
      }),
    [],
  );

  useEffect(() => {
    const video = arrestVideoRef.current;
    if (!video || arrestResult !== 'pending' || arrestStartedRef.current) return;
    arrestStartedRef.current = true;
    video.currentTime = 0;
    video.muted = mutedRef.current;
    void waitForMedia(video, 30000).then(setArrestResult);
    return () => video.pause();
  }, [arrestResult, waitForMedia]);

  const cancelDirector = useCallback(() => {
    directorGeneration.current += 1;
    currentMediaCancelRef.current?.();
    currentMediaCancelRef.current = null;
    witnessReadyResolverRef.current?.();
    witnessReadyResolverRef.current = null;
    skipVoice();
  }, [skipVoice]);

  useEffect(() => {
    if (['summons', 'news', 'witness', 'certificate'].includes(phase)) return;
    const generation = directorGeneration.current + 1;
    directorGeneration.current = generation;
    const lines = dialogueForPhase(phase, verdict?.title, bribeChoice, pleaChoice);
    const perform = async () => {
      if (phase === 'verdict') setVerdictReady(false);
      if (phase === 'bribeResult' && bribeChoice === 'samosa') {
        await playMeme('golden-samosa');
        if (directorGeneration.current !== generation) return;
      }
      for (const line of lines) {
        if (directorGeneration.current !== generation) return;
        await waitForSpeech(line);
      }
      if (directorGeneration.current !== generation) return;
      if (phase === 'breakup') await playMeme('girlfriend-breakup');
      if (phase === 'bribeResult' && bribeChoice !== 'samosa') await playMeme('judge-bribe');
      if (phase === 'mouse' && selectedDefense === 'mouse') await playMeme('unexpected-witness');
      if (phase === 'verdict') await playMeme('guilty-verdict');
      if (phase === 'appeal' && selectedPunishment === 'mud') await playMeme('failed-appeal');
      if (directorGeneration.current !== generation) return;
      if (phase === 'verdict') setVerdictReady(true);
      setActiveLine(null);
      if (phase === 'breakup') {
        setPhase('evidence');
      } else if (phase === 'objection') {
        setGavelPulse((value) => value + 1);
        playCue('objection');
        setPhase('jury');
      } else if (phase === 'jury') {
        playCue('buzzer');
        setPhase('bribe');
      } else if (phase === 'bribeResult') {
        setGavelPulse((value) => value + 1);
        setPhase('rage');
      } else if (phase === 'rage') {
        playCue('gavel');
        setPhase('mouse');
      } else if (phase === 'mouse') {
        playCue('verdict');
        setPhase('verdict');
      } else if (phase === 'sponsor') {
        setPhase('plea');
      } else if (phase === 'pleaResult') {
        setPhase('roulette');
      } else if (phase === 'secret') {
        setInnocenceClaims(0);
        setPhase('verdict');
      } else if (phase === 'appeal') {
        setAppealReveal(true);
        playCue('buzzer');
        playCue('cheer');
      }
    };
    void perform();
    return cancelDirector;
  }, [
    bribeChoice,
    cancelDirector,
    phase,
    playCue,
    playMeme,
    pleaChoice,
    selectedDefense,
    selectedPunishment,
    verdict?.title,
    waitForSpeech,
  ]);

  const skipDialogue = () => {
    if (phase === 'news') setNewsResult('skipped');
    currentMediaCancelRef.current?.();
    skipVoice();
  };

  const startOpeningDialogue = async () => {
    if (openingStep !== 'ready') return;
    cancelDirector();
    const generation = directorGeneration.current + 1;
    directorGeneration.current = generation;
    startAmbience();
    await memeReactionRef.current?.prime();
    const isCurrent = () => directorGeneration.current === generation;

    for (const media of [mardAudioRef.current, newsVideoRef.current]) {
      if (!media) continue;
      media.muted = true;
      try {
        await media.play();
        media.pause();
        media.currentTime = 0;
      } catch {
        // The explicit playback path below reports failure and continues safely.
      }
      media.muted = mutedRef.current;
    }

    setOpeningStep('defendant');
    await waitForSpeech({ speaker: 'defendant', text: 'I AM INNOCENT!' });
    if (!isCurrent()) return;
    await playMeme('innocence-claim');
    if (!isCurrent()) return;

    setOpeningStep('prosecutor');
    setActiveLine({ speaker: 'prosecutor', text: 'Ek kachori do samosa.' });
    const mard = mardAudioRef.current;
    let mardResult: 'ended' | 'failed' | 'skipped' = 'failed';
    if (mard) {
      mard.currentTime = 0;
      mard.muted = mutedRef.current;
      mardResult = await waitForMedia(mard, 20000);
    }
    setOpeningAudioResult(mardResult === 'ended' ? 'ended' : 'failed');
    if (!isCurrent()) return;
    await playMeme('samosa-rebuttal');
    if (!isCurrent()) return;

    setOpeningStep('judge');
    await waitForSpeech({
      speaker: 'judge',
      text: "ORDER! ORDER! Let's continue with the court.",
    });
    if (!isCurrent()) return;
    setOpeningStep('complete');
    strikeGavel();

    setPhase('news');
    setNewsResult('pending');
    const newsLine: SpokenLine = {
      speaker: 'anchor',
      text: `Breaking news! Defendant caught clicking ${summary.totalClicks} times. Even his mouse has hired a lawyer!`,
    };
    const video = newsVideoRef.current;
    setActiveLine(newsLine);
    if (video) {
      video.currentTime = 0;
      video.muted = mutedRef.current;
      const [videoResult] = await Promise.all([
        waitForMedia(video, 90000),
        waitForSpeech(newsLine),
      ]);
      setNewsResult(videoResult);
    } else {
      setNewsResult('failed');
      await waitForSpeech(newsLine);
    }
    if (!isCurrent()) return;

    setPhase('witness');
    witnessReadyRef.current = false;
    setWitnessReady(false);
    await waitForWitnessReady();
    if (!isCurrent()) return;
    if (!reducedMotion) {
      await new Promise((resolve) => window.setTimeout(resolve, 560));
    }
    const witnessLines = dialogueForPhase('witness');
    for (const [index, line] of witnessLines.entries()) {
      if (!isCurrent()) return;
      await waitForSpeech(line);
      if (index === 0) await playMeme('girlfriend-evidence');
    }
    if (!isCurrent()) return;
    setActiveLine(null);
    strikeGavel();
    setPhase('breakup');
  };

  const chooseDefense = (defense: DefenseId) => {
    setSelectedDefense(defense);
    setPhase('objection');
    setGavelPulse((value) => value + 1);
    playCue('objection');
  };

  const chooseBribe = (choice: BribeChoice) => {
    setBribeChoice(choice);
    if (choice === 'samosa') {
      setPunishmentSentence('DOUBLE SENTENCE: Samosa-Based Judicial Corruption');
    }
    setPhase('bribeResult');
  };

  const choosePlea = (choice: PleaChoice) => {
    setPleaChoice(choice);
    if (choice === 'buffering') {
      setSelectedPunishment('spinner');
      setPunishmentSentence(
        `${bribeChoice === 'samosa' ? 'DOUBLE SENTENCE: ' : ''}404 Years of Human Buffering`,
      );
    } else {
      setSelectedPunishment('apology');
      setPunishmentSentence(
        `${bribeChoice === 'samosa' ? 'DOUBLE SENTENCE: ' : ''}One Unskippable Ad Every Time You Blink`,
      );
    }
    setPhase('pleaResult');
  };

  const startPostCredits = async () => {
    if (postCredits !== 'idle') return;
    cancelDirector();
    const generation = directorGeneration.current + 1;
    directorGeneration.current = generation;
    setPostCredits('playing');
    await playMeme('judge-collapse');
    if (directorGeneration.current !== generation) return;
    await waitForSpeech({
      speaker: 'judge',
      text: 'SOMEONE DOUBLE-CLICKED A PDF?! I QUIT!',
    });
    if (directorGeneration.current !== generation) return;
    setPostCredits('complete');
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

  if (arrestResult === 'pending') {
    return (
      <section className="court-arrest" data-arrest-status="playing" aria-label="Digital arrest">
        <video
          ref={arrestVideoRef}
          src={`${import.meta.env.BASE_URL}video/digital-arrest.mp4`}
          playsInline
          preload="auto"
          muted={muted}
          aria-label="SWAT officers arrest a computer mouse"
        />
        <div className="court-arrest-shade" aria-hidden="true" />
        <div className="court-arrest-copy">
          <span>DIGITAL ARREST WARRANT · CLICK UNIT 13</span>
          <h1>YOU ARE UNDER ARREST FOR FIRST-DEGREE CLICKING.</h1>
        </div>
        <div className="court-arrest-controls">
          <button type="button" onClick={() => currentMediaCancelRef.current?.()}>
            <FastForward aria-hidden="true" size={16} /> Skip arrest
          </button>
          <button type="button" onClick={toggleMute} aria-pressed={muted}>
            {muted ? (
              <VolumeX aria-hidden="true" size={16} />
            ) : (
              <Volume2 aria-hidden="true" size={16} />
            )}
            {muted ? 'Unmute' : 'Mute'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <div
      className={`court-experience court-phase-${phase}`}
      data-opening-step={openingStep}
      data-opening-audio-result={openingAudioResult}
      data-story-phase={phase}
      data-news-result={newsResult}
      data-tts-supported={voices.supported}
      data-active-speaker={activeLine?.speaker ?? 'none'}
      data-witness-ready={witnessReady}
      data-arrest-status={arrestResult}
      data-post-credits={postCredits}
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
              onWitnessReady={handleWitnessReady}
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
      <MemeReaction
        ref={memeReactionRef}
        muted={muted}
        reducedMotion={reducedMotion}
        onActiveChange={handleMemeActiveChange}
      />

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
            disabled={!activeLine && !activeMeme}
          >
            <FastForward aria-hidden="true" size={16} />
            <span>
              {activeMeme ? 'Skip reaction' : phase === 'news' ? 'Skip interruption' : 'Skip line'}
            </span>
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

          {phase === 'witness' || phase === 'breakup' ? (
            <section className="court-witness-caption" aria-label="Surprise witness testimony">
              <span>
                {phase === 'breakup'
                  ? 'BREAKUP DEPLOYMENT · STATUS: IRREVERSIBLE'
                  : 'SURPRISE WITNESS · CONNECTION: LOCALHOST'}
              </span>
              <strong>
                {phase === 'breakup'
                  ? 'Relationship moved to production without you'
                  : 'Relationship status: uncommitted changes'}
              </strong>
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

          {phase === 'jury' ? (
            <section className="court-chaos-console court-jury-console">
              <p>Six tabs deliberating · 4.7 GB memory consumed</p>
              <h2>THE BROWSER JURY HAS A VERDICT</h2>
              <strong>One dissenting tab has stopped responding.</strong>
            </section>
          ) : null}

          {phase === 'bribe' ? (
            <section className="court-chaos-console" aria-labelledby="bribe-title">
              <p>Absolutely not a bribery menu</p>
              <h2 id="bribe-title">Influence the judge</h2>
              <div className="court-choice-grid">
                <button type="button" onClick={() => chooseBribe('cash')}>
                  <strong>₹10</strong>
                  <small>Enough for 0.04% of a judicial chai</small>
                </button>
                <button type="button" onClick={() => chooseBribe('samosa')}>
                  <strong>One samosa</strong>
                  <small>Flaky, warm and constitutionally suspicious</small>
                </button>
                <button type="button" onClick={() => chooseBribe('star')}>
                  <strong>GitHub star</strong>
                  <small>Public validation with no monetary value</small>
                </button>
              </div>
            </section>
          ) : null}

          {phase === 'bribeResult' || phase === 'rage' ? (
            <section className="court-chaos-console court-rage-console">
              <p>
                {phase === 'rage' ? 'JUDICIAL TEMPERATURE: 404°C' : 'Ethics server unavailable'}
              </p>
              <h2>{phase === 'rage' ? 'JUDGE RAGE MODE' : 'BRIBE PROCESSED'}</h2>
              <strong>
                {bribeChoice === 'samosa'
                  ? 'The samosa was accepted. Your sentence was doubled.'
                  : 'Your influence attempt has been screenshotted.'}
              </strong>
            </section>
          ) : null}

          {phase === 'mouse' ? (
            <section className="court-chaos-console court-mouse-console">
              <p>Hostile peripheral witness</p>
              <h2>THE MOUSE TESTIFIES</h2>
              <strong>Claiming repetitive-click trauma and unpaid overtime.</strong>
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
                  disabled={!verdictReady}
                  onClick={() => {
                    strikeGavel();
                    setPhase('sponsor');
                  }}
                >
                  Begin absurd sentencing <ArrowRight aria-hidden="true" size={18} />
                </button>
                <button
                  type="button"
                  className="court-control"
                  disabled={!verdictReady || voices.speaking}
                  onClick={() => {
                    const next = innocenceClaims + 1;
                    setInnocenceClaims(next);
                    if (next >= 3) setPhase('secret');
                    else {
                      const line: SpokenLine = {
                        speaker: 'judge',
                        text: next === 1 ? 'Denied.' : 'Still denied. Stop refreshing innocence.',
                      };
                      setActiveLine(line);
                    }
                  }}
                >
                  I'm innocent{innocenceClaims ? ` (${innocenceClaims}/3 ignored)` : ''}
                </button>
                <button
                  type="button"
                  className="court-control"
                  disabled={!verdictReady}
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

          {phase === 'sponsor' ? (
            <section className="court-chaos-console court-sponsor-console">
              <p>UNSKIPPABLE SPONSOR MESSAGE · probably legal</p>
              <h2>CTRL ALT DECEIT™</h2>
              <strong>Accountability deleted in three convenient keystrokes.</strong>
            </section>
          ) : null}

          {phase === 'plea' ? (
            <section className="court-chaos-console" aria-labelledby="plea-title">
              <p>The plea bargain nobody requested</p>
              <h2 id="plea-title">Choose your inconvenience</h2>
              <div className="court-choice-grid court-plea-grid">
                <button type="button" onClick={() => choosePlea('buffering')}>
                  <strong>404 years buffering</strong>
                  <small>Release date: NaN</small>
                </button>
                <button type="button" onClick={() => choosePlea('ad')}>
                  <strong>An ad every blink</strong>
                  <small>Premium eyelids sold separately</small>
                </button>
              </div>
            </section>
          ) : null}

          {phase === 'pleaResult' || phase === 'secret' ? (
            <section className="court-chaos-console court-rage-console">
              <p>{phase === 'secret' ? 'SECRET ENDING UNLOCKED' : 'Plea accepted by mistake'}</p>
              <h2>{phase === 'secret' ? 'FINAL MELTDOWN' : 'NO REFUNDS'}</h2>
              <strong>
                {phase === 'secret'
                  ? 'The judge has rate-limited innocence.'
                  : pleaChoice === 'buffering'
                    ? 'Your freedom is loading at zero percent.'
                    : 'Blink responsibly. This message was an ad.'}
              </strong>
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
              cancelDirector();
              stopAudio();
              onReplay();
            }}
          />
          <button
            type="button"
            className="court-secret-ending"
            disabled={postCredits !== 'idle'}
            onClick={() => void startPostCredits()}
          >
            {postCredits === 'idle'
              ? 'Secret Ending'
              : postCredits === 'playing'
                ? 'Post-credits scene playing…'
                : 'Secret ending unlocked'}
          </button>
          {postCredits !== 'idle' ? (
            <section className={`court-post-credits is-${postCredits}`} aria-live="assertive">
              <span>POST-CREDITS · COURT.EXE</span>
              <strong>
                {postCredits === 'complete'
                  ? 'SOMEONE DOUBLE-CLICKED A PDF?! I QUIT!'
                  : 'Judicial stability critically low…'}
              </strong>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function dialogueForPhase(
  phase: TrialPhase,
  verdictTitle?: string,
  bribeChoice?: BribeChoice | null,
  pleaChoice?: PleaChoice | null,
): readonly SpokenLine[] {
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
  if (phase === 'breakup')
    return [
      {
        speaker: 'girlfriend',
        text: "And one more thing. I'm leaving you. Even your GitHub has more commitment.",
      },
      {
        speaker: 'judge',
        text: 'Let the record show: relationship status changed to detached HEAD.',
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
  if (phase === 'jury')
    return [
      { speaker: 'jury', text: 'GUILTY! GUILTY! GUILTY! GUILTY in six open tabs!' },
      {
        speaker: 'jury',
        text: 'Tab seven votes innocent. Tab seven has crashed. Also, your attendance is seventy-five percent in a class that does not exist at IIT ISM.',
      },
    ];
  if (phase === 'bribe')
    return [
      {
        speaker: 'judge',
        text: 'The court does not accept bribes. The court does, however, review tasteful gifts.',
      },
    ];
  if (phase === 'bribeResult') {
    if (bribeChoice === 'samosa')
      return [
        { speaker: 'judge', text: 'BRIBE ACCEPTED! SENTENCE DOUBLED!' },
        { speaker: 'prosecutor', text: 'Your Honor just deep-fried due process.' },
      ];
    if (bribeChoice === 'star')
      return [
        { speaker: 'judge', text: 'A GitHub star? I only accept forks with no merge conflicts.' },
        { speaker: 'prosecutor', text: 'Bribery attempt rejected for insufficient engagement.' },
      ];
    return [
      { speaker: 'judge', text: 'Ten rupees? That barely covers one judicial chai pixel.' },
      { speaker: 'prosecutor', text: 'Adding one count of budget corruption.' },
    ];
  }
  if (phase === 'rage')
    return [
      { speaker: 'judge', text: 'ENOUGH! My wig has rage-quit before I could!' },
      { speaker: 'jury', text: 'The tabs are panicking! Somebody restore the previous session!' },
    ];
  if (phase === 'mouse')
    return [
      {
        speaker: 'mouse',
        text: 'I am the mouse. He clicked me thirteen times without so much as a coffee break.',
      },
      { speaker: 'judge', text: 'Powerful testimony. Give that mouse a ergonomic pension.' },
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
  if (phase === 'sponsor')
    return [
      {
        speaker: 'sponsor',
        text: 'This guilty verdict is sponsored by Ctrl Alt Deceit, the keyboard shortcut for avoiding accountability!',
      },
      { speaker: 'judge', text: 'I hate that this court has ad-supported justice.' },
    ];
  if (phase === 'plea')
    return [
      {
        speaker: 'judge',
        text: 'Choose your plea bargain: four hundred four years of buffering, or one unskippable ad every time you blink.',
      },
    ];
  if (phase === 'pleaResult')
    return pleaChoice === 'buffering'
      ? [
          {
            speaker: 'judge',
            text: 'Buffering selected. Your release date is currently loading at zero percent.',
          },
        ]
      : [
          {
            speaker: 'sponsor',
            text: 'Ad sentence selected. Blinking now requires accepting all cookies.',
          },
        ];
  if (phase === 'secret')
    return [
      { speaker: 'defendant', text: "I'm innocent! I'm innocent! I'm innocent!" },
      {
        speaker: 'judge',
        text: 'FINAL MELTDOWN! Innocence has been rate-limited. Bailiff, uninstall the defendant!',
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
