import { useMemo } from 'react';
import { Download, Printer, RotateCcw, Scale } from 'lucide-react';
import type { Verdict } from '@/components/courtroom/trialLogic';
import { createCertificateDataUri } from '@/components/certificate/certificateSvg';

export interface DigitalMenaceCertificateProps {
  certificateId: string;
  issuedAt: number;
  clickCount: number;
  verdict: Verdict;
  onReplay(this: void): void;
}

export function DigitalMenaceCertificate({
  certificateId,
  issuedAt,
  clickCount,
  verdict,
  onReplay,
}: DigitalMenaceCertificateProps) {
  const issuedDate = new Date(issuedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const certificateHref = useMemo(
    () => createCertificateDataUri({ certificateId, issuedAt, clickCount, verdict }),
    [certificateId, clickCount, issuedAt, verdict],
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-amber-200/40 bg-[radial-gradient(circle_at_top,#34200f_0%,#160d23_38%,#08090d_78%)] p-2 shadow-[0_45px_140px_rgba(0,0,0,0.78)]">
        <div className="rounded-[2rem] border border-amber-200/20 px-6 py-10 text-center sm:px-12 sm:py-14">
          <Scale aria-hidden="true" className="mx-auto text-amber-300" size={48} />
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.32em] text-amber-300 sm:text-xs">
            The Court of Interface Affairs
          </p>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] text-amber-50 sm:text-6xl">
            Certified Digital Menace
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-white/55">
            This document irresponsibly certifies that its holder has achieved the rank of
          </p>
          <p className="mt-3 font-serif text-2xl italic text-amber-200 sm:text-4xl">
            {verdict.menaceLevel}
          </p>
          <div className="mx-auto my-8 h-px max-w-2xl bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
          <p className="text-xl font-black text-white sm:text-2xl">{verdict.title}</p>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-white/60">{verdict.ruling}</p>
          <div className="mt-9 grid gap-4 text-left sm:grid-cols-3">
            <CertificateFact label="Evidence count" value={String(clickCount)} />
            <CertificateFact label="Issued" value={issuedDate} />
            <CertificateFact label="Certificate" value={certificateId} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <a
          href={certificateHref}
          download={`certified-digital-menace-${certificateId}.svg`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-amber-200 px-5 py-3 text-sm font-black text-amber-950 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
        >
          <Download aria-hidden="true" size={18} />
          Download certificate
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <Printer aria-hidden="true" size={18} />
          Print fallback
        </button>
        <button
          type="button"
          onClick={onReplay}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <RotateCcw aria-hidden="true" size={18} />
          Commit another offense
        </button>
      </div>
    </div>
  );
}

function CertificateFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-amber-200/15 bg-black/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300/60">{label}</p>
      <p className="mt-2 break-words text-sm font-black text-amber-50">{value}</p>
    </div>
  );
}
