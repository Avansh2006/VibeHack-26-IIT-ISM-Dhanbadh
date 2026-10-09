import { RotateCcw, Scale } from 'lucide-react';
import type { InteractionRecord } from '@/shared/contracts';

interface CourtroomBridgeProps {
  evidenceLog: readonly InteractionRecord[];
  onReset(this: void): void;
}

export function CourtroomBridge({ evidenceLog, onReset }: CourtroomBridgeProps) {
  const exhibits = evidenceLog.slice(-5).reverse();

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-16 sm:px-8">
      <section className="w-full overflow-hidden rounded-[2.5rem] border border-amber-200/25 bg-[#140d08]/95 text-amber-50 shadow-[0_50px_160px_rgba(0,0,0,0.75)]">
        <div className="border-b border-amber-200/15 bg-amber-200 px-6 py-3 text-center text-xs font-black uppercase tracking-[0.32em] text-amber-950">
          Courtroom handoff confirmed
        </div>
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <Scale aria-hidden="true" className="text-amber-300" size={42} />
            <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-amber-300">
              The Website v. Your Clicking Finger
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
              Your innocence has been successfully submitted as evidence against you.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-amber-100/65">
              The chaos engine sealed {evidenceLog.length} authentic interaction records. The full
              courtroom can consume this immutable docket without inventing a single charge.
            </p>
            <button
              type="button"
              onClick={onReset}
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-amber-200 px-5 py-3 text-sm font-black text-amber-950 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-amber-100"
            >
              <RotateCcw aria-hidden="true" size={18} />
              Request a completely new trial
            </button>
          </div>

          <div className="rounded-3xl border border-amber-200/15 bg-black/20 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
              Sealed exhibits
            </p>
            <ol className="mt-4 space-y-3">
              {exhibits.map((record) => (
                <li key={record.id} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-black text-amber-300">EXHIBIT {record.sequence}</span>
                    <span className="text-[10px] uppercase tracking-wider text-white/35">
                      {record.stageAfter}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-white/85">
                    {record.metadata?.label ?? record.type.replaceAll('-', ' ')}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
