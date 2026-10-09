import { useState } from 'react';
import { DoorOpen, Siren } from 'lucide-react';
import type { ChaosBeat } from '@/engine';

interface EmergencyEscapeProps {
  beat: ChaosBeat;
  onEscape(this: void): void;
}

const ESCAPE_OFFSETS = [
  { x: 54, y: -18 },
  { x: -48, y: 22 },
] as const;

export function EmergencyEscape({ beat, onEscape }: EmergencyEscapeProps) {
  const [evasions, setEvasions] = useState(0);

  const offset = evasions === 0 ? { x: 0, y: 0 } : ESCAPE_OFFSETS[evasions - 1] ?? { x: 0, y: 0 };

  return (
    <aside
      className="fixed inset-x-4 bottom-5 z-50 mx-auto max-w-xl rounded-3xl border border-amber-300/40 bg-slate-950/95 p-5 text-left text-white shadow-[0_30px_90px_rgba(0,0,0,0.65)] backdrop-blur-xl"
      aria-labelledby="escape-title"
    >
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-amber-300 p-3 text-slate-950">
          <Siren aria-hidden="true" size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
            Emergency Escape Protocol
          </p>
          <h2 id="escape-title" className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
            {beat.headline}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{beat.detail}</p>
        </div>
      </div>

      <div className="mt-5 flex min-h-20 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-3">
        <button
          type="button"
          onPointerEnter={(event) => {
            if (event.pointerType === 'mouse' && evasions < ESCAPE_OFFSETS.length) {
              setEvasions((value) => value + 1);
            }
          }}
          onFocus={() => setEvasions(ESCAPE_OFFSETS.length)}
          onClick={onEscape}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition-transform duration-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
        >
          <DoorOpen aria-hidden="true" size={18} />
          {evasions >= ESCAPE_OFFSETS.length ? 'Fine. The exit gives up.' : beat.actionLabel}
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        Accessibility clause: keyboard focus immediately neutralizes evasive behavior.
      </p>
    </aside>
  );
}
