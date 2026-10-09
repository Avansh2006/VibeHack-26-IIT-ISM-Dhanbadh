import { useEffect, useRef } from 'react';
import { Crosshair } from 'lucide-react';
import { gsap } from 'gsap';

interface CursorCriminalProps {
  active: boolean;
  clickCount: number;
  reducedMotion: boolean;
}

export function CursorCriminal({ active, clickCount, reducedMotion }: CursorCriminalProps) {
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const badge = badgeRef.current;
    if (!active || !badge || reducedMotion) return;

    const moveX = gsap.quickTo(badge, 'x', { duration: 0.3, ease: 'power3.out' });
    const moveY = gsap.quickTo(badge, 'y', { duration: 0.3, ease: 'power3.out' });
    const handlePointerMove = (event: PointerEvent) => {
      moveX(event.clientX + 18);
      moveY(event.clientY + 18);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      gsap.killTweensOf(badge);
    };
  }, [active, reducedMotion]);

  if (!active) return null;

  return (
    <div
      ref={badgeRef}
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 z-40 flex items-center gap-2 rounded-full border border-red-400/60 bg-red-950/90 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-100 shadow-[0_0_30px_rgba(248,113,113,0.35)] ${
        reducedMotion ? 'left-4 top-20' : ''
      }`}
    >
      <Crosshair size={13} />
      Cursor suspect · {clickCount} charge{clickCount === 1 ? '' : 's'}
    </div>
  );
}
