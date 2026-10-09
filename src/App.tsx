import { RotateCcw } from 'lucide-react';
import { CHAOS_STAGE_LABELS } from '@/shared/contracts';
import { selectEffectiveChaosStage, useChaosStore } from '@/shared/chaosStore';

function App() {
  const clickCount = useChaosStore((state) => state.clickCount);
  const chaosStage = useChaosStore(selectEffectiveChaosStage);
  const recordInteraction = useChaosStore((state) => state.recordInteraction);
  const reset = useChaosStore((state) => state.reset);

  return (
    <main className="app-shell">
      <section className="placeholder-card" aria-labelledby="page-title">
        <p className="eyebrow">A calm, trustworthy software company</p>
        <h1 id="page-title">CLICKPOCALYPSE</h1>
        <p className="tagline">Every click has consequences. Yours are legally questionable.</p>

        <button
          className="primary-button"
          type="button"
          onClick={() =>
            recordInteraction('primary-cta', {
              targetId: 'bootstrap-primary-cta',
            })
          }
        >
          Improve my workflow responsibly
        </button>

        <div className="status" role="status" aria-live="polite">
          <span>{clickCount} eligible interactions</span>
          <span>{CHAOS_STAGE_LABELS[chaosStage]}</span>
        </div>

        {clickCount > 0 && (
          <button className="reset-button" type="button" onClick={reset}>
            <RotateCcw aria-hidden="true" size={16} />
            Reset demo
          </button>
        )}

        <p className="handoff-note">
          Step 0 foundation is live. Feature agents can now work in their owned directories.
        </p>
      </section>
    </main>
  );
}

export default App;
