import { useLayoutEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { useReducedMotion } from 'motion/react';
import type { ChaosBeat } from '@/engine';
import type { ChaosStage, InteractionRecord, InteractionType } from '@/shared/contracts';
import { CursorCriminal } from '@/components/effects/CursorCriminal';
import { EmergencyEscape } from '@/components/effects/EmergencyEscape';
import { ProveInnocence } from '@/components/effects/ProveInnocence';

interface ChaosEffectsLayerProps {
  beat: ChaosBeat;
  clickCount: number;
  chaosStage: ChaosStage;
  evidenceLog: readonly InteractionRecord[];
  onAction(this: void, type: InteractionType, label: string): void;
}

const PARTICLES = Array.from({ length: 14 }, (_, index) => index);

export function ChaosEffectsLayer({
  beat,
  clickCount,
  chaosStage,
  evidenceLog,
  onAction,
}: ChaosEffectsLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const isCursorCriminal = chaosStage !== 'pristine' && chaosStage !== 'courtroom';
  const showEscape = chaosStage === 'rebellious';
  const showInnocence = chaosStage === 'hostile' || chaosStage === 'meltdown';
  const particlePositions = useMemo(
    () =>
      PARTICLES.map((index) => ({
        left: `${(index * 29 + 7) % 96}%`,
        top: `${(index * 47 + 13) % 88}%`,
        rotate: `${(index * 37) % 180}deg`,
      })),
    [],
  );

  useLayoutEffect(() => {
    const layer = layerRef.current;
    const surface = document.querySelector<HTMLElement>('[data-chaos-surface]');
    if (!layer || !surface) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        layer,
        { opacity: 0 },
        { opacity: 1, duration: prefersReducedMotion ? 0.01 : 0.28, ease: 'power2.out' },
      );

      if (!prefersReducedMotion && chaosStage === 'meltdown') {
        gsap.fromTo(
          surface,
          { x: -4, rotate: -0.35 },
          {
            x: 4,
            rotate: 0.35,
            duration: 0.075,
            repeat: 5,
            yoyo: true,
            ease: 'none',
            clearProps: 'transform',
          },
        );
      }
    }, layer);

    return () => context.revert();
  }, [chaosStage, clickCount, prefersReducedMotion]);

  return (
    <div ref={layerRef} className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-live="polite">
      <div
        aria-hidden="true"
        className={`absolute inset-0 transition-colors duration-500 ${
          chaosStage === 'meltdown'
            ? 'bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.16),transparent_60%)]'
            : chaosStage === 'hostile'
              ? 'bg-[linear-gradient(115deg,transparent,rgba(34,211,238,0.08),transparent)]'
              : ''
        }`}
      />

      {chaosStage === 'meltdown' &&
        particlePositions.map((position, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="absolute h-2 w-10 rounded-full bg-fuchsia-300/45 shadow-[0_0_18px_rgba(232,121,249,0.5)] motion-safe:animate-pulse"
            style={{
              left: position.left,
              top: position.top,
              rotate: position.rotate,
            }}
          />
        ))}

      {clickCount > 0 && !showEscape && !showInnocence && (
        <div className="absolute left-1/2 top-5 w-[min(92vw,42rem)] -translate-x-1/2 rounded-2xl border border-white/15 bg-slate-950/88 px-5 py-4 text-center text-white shadow-2xl backdrop-blur-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-300">
            {beat.eyebrow}
          </p>
          <p className="mt-1 text-sm font-bold sm:text-base">{beat.headline}</p>
        </div>
      )}

      <CursorCriminal
        active={isCursorCriminal}
        clickCount={clickCount}
        reducedMotion={prefersReducedMotion}
      />

      <div className="pointer-events-auto">
        {showEscape && (
          <EmergencyEscape
            key={clickCount}
            beat={beat}
            onEscape={() => onAction('escape-attempt', beat.actionLabel)}
          />
        )}
        {showInnocence && (
          <ProveInnocence
            beat={beat}
            clickCount={clickCount}
            evidenceLog={evidenceLog}
            onStatement={onAction}
          />
        )}
      </div>
    </div>
  );
}
