import { useEffect, useMemo, useState } from 'react';
import { FastForward, LockKeyhole, Stamp, X } from 'lucide-react';
import './courtroom-interruptions.css';

export function LegalLoadingSimulator({ onComplete }: { onComplete(this: void): void }) {
  const [progress, setProgress] = useState(4);
  const [message, setMessage] = useState('Cross-referencing innocence with browser history…');

  useEffect(() => {
    const sequence = [19, 47, 76, 99, 91, 99];
    let index = 0;
    let finishTimer = 0;
    const timer = window.setInterval(() => {
      const next = sequence[index++];
      if (next === undefined) {
        window.clearInterval(timer);
        setMessage('Innocence not found.');
        finishTimer = window.setTimeout(onComplete, 650);
        return;
      }
      setProgress(next);
      if (next === 91) setMessage('Correction: legal progress has been repossessed.');
    }, 260);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(finishTimer);
    };
  }, [onComplete]);

  return (
    <section
      className="court-interruption court-loading"
      aria-live="polite"
      data-legal-processing={progress}
    >
      <div>
        <span>LEGAL PROCESSING UNIT</span>
        <h1>{progress}%</h1>
        <div className="court-interruption-track">
          <i style={{ width: `${progress}%` }} />
        </div>
        <p>{message}</p>
        <button type="button" onClick={onComplete}>
          <FastForward size={15} /> Skip bureaucracy
        </button>
      </div>
    </section>
  );
}

export function BailForm({ onClose }: { onClose(this: void): void }) {
  const [rejected, setRejected] = useState(false);
  return (
    <section
      className="court-interruption"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bail-title"
    >
      <form
        className="court-paper-form"
        onSubmit={(event) => {
          event.preventDefault();
          setRejected(true);
        }}
      >
        <button
          type="button"
          className="court-interruption-close"
          onClick={onClose}
          aria-label="Close bail form"
        >
          <X />
        </button>
        <Stamp aria-hidden="true" size={30} />
        <p>FORM 404-B · TEMPORARY CLICK BAIL</p>
        <h2 id="bail-title">Bureaucracy Simulator</h2>
        <label>
          Browser blood group
          <input required placeholder="e.g. HTML positive" />
        </label>
        <label>
          Mouse's lawyer
          <input required placeholder="e.g. Better Call Scroll" />
        </label>
        <label>
          Mother's maiden CAPTCHA
          <input required placeholder="Select all emotional traffic lights" />
        </label>
        {rejected ? <strong role="status">Rejected. Blue ink required.</strong> : null}
        <div>
          <button type="submit">Submit 19 identical copies</button>
          <button type="button" onClick={onClose}>
            Abandon bail
          </button>
        </div>
      </form>
    </section>
  );
}

export function FakeOsUpdate({ onComplete }: { onComplete(this: void): void }) {
  const [progress, setProgress] = useState(3);
  const failed = progress >= 100;
  useEffect(() => {
    if (failed) {
      const finish = window.setTimeout(onComplete, 1100);
      return () => window.clearTimeout(finish);
    }
    const timer = window.setInterval(() => setProgress((value) => Math.min(100, value + 17)), 220);
    return () => window.clearInterval(timer);
  }, [failed, onComplete]);
  return (
    <section className="court-interruption court-update" aria-live="polite">
      <div>
        <span>{failed ? 'UPDATE FAILED' : 'Installing Regret…'}</span>
        <h2>{failed ? 'User remains guilty.' : `${progress}%`}</h2>
        <p>
          {failed
            ? 'Rollback unavailable. Dignity backup corrupted.'
            : 'Do not close your conscience.'}
        </p>
        <button type="button" onClick={onComplete}>
          Skip fake update
        </button>
      </div>
    </section>
  );
}

interface PasswordPrisonProps {
  onSentence(this: void, outcome: 'solved' | 'surrendered'): void;
  onAppeal(this: void): void;
}

export function PasswordPrison({ onSentence, onAppeal }: PasswordPrisonProps) {
  const [password, setPassword] = useState('');
  const [remaining, setRemaining] = useState(30);
  const [outcome, setOutcome] = useState<'solved' | 'surrendered' | null>(null);
  const rules = useMemo(
    () =>
      [
        ['At least 8 characters', password.length >= 8],
        ['One uppercase confession', /[A-Z]/.test(password)],
        ['The number 13, for legal reasons', password.includes('13')],
        ['Contains “samosa”', password.toLowerCase().includes('samosa')],
        ['Ends with an outraged exclamation mark', password.endsWith('!')],
      ] as const,
    [password],
  );
  const solved = rules.every(([, valid]) => valid);
  const visibleRules = Math.min(rules.length, Math.max(2, 1 + Math.floor(password.length / 3)));

  const resolve = (next: 'solved' | 'surrendered') => {
    if (outcome) return;
    setOutcome(next);
    onSentence(next);
  };

  useEffect(() => {
    if (outcome) return;
    const timer = window.setTimeout(() => {
      if (remaining <= 1) {
        setRemaining(0);
        setOutcome('surrendered');
        onSentence('surrendered');
      } else {
        setRemaining((value) => value - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [onSentence, outcome, remaining]);

  return (
    <section className="court-password-prison" aria-labelledby="password-prison-title">
      <p>
        <LockKeyhole size={16} /> SENTENCE EXECUTION · {remaining}s REMAINING
      </p>
      <h2 id="password-prison-title">Password Prison</h2>
      <blockquote>
        Judge:{' '}
        {outcome === 'solved'
          ? 'Annoyingly competent. Add suspicious competence to the record.'
          : outcome
            ? 'Surrender accepted. Your password is now “coward”.'
            : 'Create one password stronger than your defense.'}
      </blockquote>
      <input
        value={password}
        disabled={Boolean(outcome)}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Try Samosa13!"
        aria-label="Prison password"
      />
      <ul>
        {rules.slice(0, visibleRules).map(([label, valid]) => (
          <li key={label} className={valid ? 'is-valid' : ''}>
            {valid ? 'PASS' : 'FAIL'} · {label}
          </li>
        ))}
      </ul>
      {!outcome ? (
        <div>
          <button type="button" disabled={!solved} onClick={() => resolve('solved')}>
            Unlock sentence
          </button>
          <button type="button" onClick={() => resolve('surrendered')}>
            SURRENDER
          </button>
        </div>
      ) : (
        <button type="button" onClick={onAppeal}>
          Appeal password incarceration
        </button>
      )}
    </section>
  );
}
