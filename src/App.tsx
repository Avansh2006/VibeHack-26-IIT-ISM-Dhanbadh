import { useCallback, useLayoutEffect } from 'react';
import {
  ArrowUpRight,
  Fingerprint,
  MousePointerClick,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { CourtroomExperience } from '@/components/courtroom';
import { ChaosEffectsLayer } from '@/components/effects';
import { getChaosBeat, getChaosProgress, useInteractionGateway } from '@/engine';
import { CHAOS_STAGE_LABELS, type InteractionType } from '@/shared/contracts';
import { selectEffectiveChaosStage, useChaosStore } from '@/shared/chaosStore';

const TRUST_SIGNALS = [
  { icon: Sparkles, value: '99.99%', label: 'manufactured confidence' },
  { icon: Fingerprint, value: '0', label: 'clicks forgotten' },
  { icon: ShieldAlert, value: '13', label: 'ways this can become legal' },
] as const;

function App() {
  const clickCount = useChaosStore((state) => state.clickCount);
  const chaosStage = useChaosStore((state) => state.chaosStage);
  const effectiveStage = useChaosStore(selectEffectiveChaosStage);
  const evidenceLog = useChaosStore((state) => state.evidenceLog);
  const sessionId = useChaosStore((state) => state.sessionId);
  const startedAt = useChaosStore((state) => state.startedAt);
  const reset = useChaosStore((state) => state.reset);
  const { recordAction } = useInteractionGateway();
  const beat = getChaosBeat(clickCount);
  const progress = getChaosProgress(clickCount);
  const landingActionEnabled = clickCount < 4;

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [sessionId]);

  const handleEffectAction = useCallback(
    (type: InteractionType, label: string) => {
      recordAction(type, {
        targetId: `chaos-beat-${clickCount + 1}`,
        label,
        source: 'chaos-engine',
      });
    },
    [clickCount, recordAction],
  );

  if (chaosStage === 'courtroom') {
    return (
      <CourtroomExperience
        key={sessionId}
        sessionId={sessionId}
        startedAt={startedAt}
        evidenceLog={evidenceLog}
        onReplay={reset}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07080a] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,0.3),transparent_38rem),radial-gradient(circle_at_90%_70%,rgba(217,70,239,0.12),transparent_32rem)]"
      />

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#f4ff70] text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(244,255,112,0.22)]">
            C!
          </span>
          <div>
            <p className="text-sm font-black tracking-[-0.03em]">CLICKPOCALYPSE</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
              Liability as a service
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 text-xs font-bold text-white/70 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-indigo-300"
        >
          <RotateCcw aria-hidden="true" size={15} />
          Reset evidence
        </button>
      </header>

      <main
        data-chaos-surface
        className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] w-full max-w-7xl content-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center"
      >
        <section aria-labelledby="page-title">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">
            <span className="size-1.5 animate-pulse rounded-full bg-[#f4ff70] motion-reduce:animate-none" />
            {beat.eyebrow}
          </div>

          <h1
            id="page-title"
            className="mt-6 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.065em] sm:text-7xl lg:text-[5.7rem]"
          >
            {beat.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/58 sm:text-lg">
            {beat.detail}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={!landingActionEnabled}
              onClick={() =>
                recordAction(beat.actionType, {
                  targetId: 'primary-chaos-cta',
                  label: beat.actionLabel,
                  source: 'landing-integration',
                })
              }
              className="group inline-flex min-h-14 items-center gap-3 rounded-full bg-[#f4ff70] px-6 py-4 text-sm font-black text-slate-950 shadow-[0_0_40px_rgba(244,255,112,0.17)] transition hover:-translate-y-1 hover:shadow-[0_0_55px_rgba(244,255,112,0.28)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#f4ff70] disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transform-none"
            >
              {landingActionEnabled ? beat.actionLabel : 'Continue in the official notice below'}
              <ArrowUpRight
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 motion-reduce:transform-none"
                size={18}
              />
            </button>
            <p className="max-w-52 text-xs leading-5 text-white/35">
              By clicking, you agree that clicking occurred and may be discussed theatrically.
            </p>
          </div>
        </section>

        <aside className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_35px_90px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                Website sanity
              </p>
              <p className="mt-1 text-xl font-black">{CHAOS_STAGE_LABELS[effectiveStage]}</p>
            </div>
            <div className="grid size-14 place-items-center rounded-full border border-white/10 bg-black/20 text-lg font-black text-[#f4ff70]">
              {clickCount}
            </div>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/8" aria-hidden="true">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-red-400 transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {clickCount} eligible interactions. {CHAOS_STAGE_LABELS[effectiveStage]}.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {TRUST_SIGNALS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-black/15 p-3">
                <Icon aria-hidden="true" className="text-indigo-300" size={16} />
                <p className="mt-4 text-lg font-black">
                  {label === 'clicks forgotten' ? clickCount : value}
                </p>
                <p className="mt-1 text-[9px] leading-4 text-white/35">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 p-4">
            <MousePointerClick aria-hidden="true" className="shrink-0 text-fuchsia-300" size={22} />
            <p className="text-xs leading-5 text-white/55">
              Evidence is recorded from real actions only. Presenter and reset controls remain
              legally boring.
            </p>
          </div>
        </aside>
      </main>

      <ChaosEffectsLayer
        beat={beat}
        clickCount={clickCount}
        chaosStage={effectiveStage}
        evidenceLog={evidenceLog}
        onAction={handleEffectAction}
      />
    </div>
  );
}

export default App;
