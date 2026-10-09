import { BadgeCheck, FileWarning, Gavel, ShieldQuestion } from 'lucide-react';
import type { ChaosBeat } from '@/engine';
import type { InteractionRecord, InteractionType } from '@/shared/contracts';

interface ProveInnocenceProps {
  beat: ChaosBeat;
  clickCount: number;
  evidenceLog: readonly InteractionRecord[];
  onStatement(this: void, type: InteractionType, label: string): void;
}

const DEFENSES = [
  'The button looked emotionally available.',
  'My mouse slipped with remarkable consistency.',
  'I invoke dark-pattern immunity.',
] as const;

export function ProveInnocence({
  beat,
  clickCount,
  evidenceLog,
  onStatement,
}: ProveInnocenceProps) {
  const recentEvidence = evidenceLog.slice(-3).reverse();
  const isMeltdown = beat.stage === 'meltdown';

  return (
    <aside
      className={`fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl overflow-hidden rounded-[2rem] border p-5 text-white shadow-[0_35px_100px_rgba(0,0,0,0.72)] backdrop-blur-2xl sm:inset-x-6 sm:p-7 ${
        isMeltdown
          ? 'border-fuchsia-300/50 bg-fuchsia-950/95'
          : 'border-cyan-300/40 bg-slate-950/95'
      }`}
      aria-labelledby="innocence-title"
    >
      <div className="flex items-start gap-4">
        <span
          className={`rounded-2xl p-3 ${isMeltdown ? 'bg-fuchsia-300 text-fuchsia-950' : 'bg-cyan-300 text-slate-950'}`}
        >
          {isMeltdown ? <Gavel aria-hidden="true" /> : <ShieldQuestion aria-hidden="true" />}
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
            {beat.eyebrow}
          </p>
          <h2 id="innocence-title" className="mt-1 text-xl font-black tracking-tight sm:text-3xl">
            {beat.headline}
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/70">{beat.detail}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_0.8fr]">
        <div className="space-y-2">
          {isMeltdown ? (
            <button
              type="button"
              onClick={() => onStatement(beat.actionType, beat.actionLabel)}
              className="group flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-base font-black text-fuchsia-950 shadow-[0_0_35px_rgba(255,255,255,0.25)] transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transform-none"
            >
              {clickCount === 12 ? (
                <BadgeCheck aria-hidden="true" />
              ) : (
                <FileWarning aria-hidden="true" />
              )}
              {beat.actionLabel}
            </button>
          ) : (
            DEFENSES.map((defense, index) => (
              <button
                key={defense}
                type="button"
                onClick={() => onStatement('popup-action', defense)}
                className="min-h-11 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-left text-sm font-bold transition hover:border-cyan-300/60 hover:bg-cyan-300/10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
              >
                <span className="mr-2 text-cyan-300">{String.fromCharCode(65 + index)}.</span>
                {defense}
              </button>
            ))
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">
            Live prosecution feed
          </p>
          <ol className="mt-3 space-y-2">
            {recentEvidence.map((record) => (
              <li key={record.id} className="flex gap-2 text-xs leading-5 text-white/65">
                <span className="font-black text-fuchsia-300">#{record.sequence}</span>
                <span>{record.metadata?.label ?? record.type.replaceAll('-', ' ')}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 border-t border-white/10 pt-3 text-xs font-bold text-white/80">
            {evidenceLog.length} exhibits and somehow still clicking.
          </p>
        </div>
      </div>
    </aside>
  );
}
