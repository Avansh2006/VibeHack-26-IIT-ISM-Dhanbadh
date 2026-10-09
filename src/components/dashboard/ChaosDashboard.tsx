import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  CircleDot,
  Command,
  FileClock,
  Gauge,
  LayoutDashboard,
  MousePointer2,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  SquareTerminal,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ChaosBeat } from '@/engine/chaosBeats';
import { CHAOS_STAGE_LABELS, type ChaosStage, type InteractionRecord } from '@/shared/contracts';

interface ChaosDashboardProps {
  beat: ChaosBeat;
  clickCount: number;
  chaosStage: ChaosStage;
  evidenceLog: readonly InteractionRecord[];
  progress: number;
  actionEnabled: boolean;
  onAction(this: void): void;
  onReset(this: void): void;
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', active: true },
  { icon: Activity, label: 'Incidents', active: false },
  { icon: BarChart3, label: 'Analytics', active: false },
  { icon: FileClock, label: 'Evidence', active: false },
] as const;

const STAGE_TONE: Readonly<Record<ChaosStage, { accent: string; status: string; note: string }>> = {
  pristine: { accent: '#d8ff63', status: 'Nominal', note: 'All systems behaving professionally' },
  uneasy: { accent: '#f4d06f', status: 'Watching', note: 'Cursor intent analysis enabled' },
  rebellious: { accent: '#ffab66', status: 'Degraded', note: 'Interface cooperation declining' },
  hostile: { accent: '#ff6b6b', status: 'Hostile', note: 'Legal automation is warming up' },
  meltdown: { accent: '#ff476f', status: 'Critical', note: 'Pixels have retained counsel' },
  courtroom: { accent: '#ff476f', status: 'Litigating', note: 'Jurisdiction transferred' },
};

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp);
}

export function ChaosDashboard({
  beat,
  clickCount,
  chaosStage,
  evidenceLog,
  progress,
  actionEnabled,
  onAction,
  onReset,
}: ChaosDashboardProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const tone = STAGE_TONE[chaosStage];
  const sanity = Math.max(0, 100 - progress);
  const recentEvidence = evidenceLog.slice(-5).reverse();
  const cursorIncidents = evidenceLog.filter((record) =>
    ['primary-cta', 'feature-card', 'navigation'].includes(record.type),
  ).length;
  const escapeAttempts = evidenceLog.filter((record) => record.type === 'escape-attempt').length;
  const systemSignals: Array<[string, string, LucideIcon]> = [
    ['Evidence pipeline', evidenceLog.length ? 'Recording' : 'Standby', ShieldCheck],
    ['Cursor surveillance', clickCount > 1 ? 'Tracking' : 'Passive', MousePointer2],
    ['Legal escalation', progress >= 54 ? 'Armed' : 'Dormant', Bot],
  ];

  return (
    <div
      data-chaos-surface
      className="relative z-10 min-h-screen bg-[#0a0b0d] text-[#f4f4f2] selection:bg-[#d8ff63] selection:text-black"
      style={{ '--dashboard-accent': tone.accent } as CSSProperties}
    >
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[15.5rem] border-r border-white/[0.075] bg-[#0c0d10] lg:flex lg:flex-col">
        <div className="flex h-[4.5rem] items-center gap-3 border-b border-white/[0.075] px-5">
          <div className="grid size-8 place-items-center bg-[var(--dashboard-accent)] text-xs font-black text-black">
            C!
          </div>
          <div>
            <p className="text-[13px] font-bold tracking-[-0.02em]">CLICKPOCALYPSE</p>
            <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/32">
              Control plane
            </p>
          </div>
        </div>

        <nav className="space-y-1 px-3 py-5" aria-label="Dashboard navigation">
          <p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/25">
            Workspace
          </p>
          {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              type="button"
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-[12px] font-medium transition-colors ${
                active
                  ? 'bg-white/[0.075] text-white'
                  : 'text-white/42 hover:bg-white/[0.04] hover:text-white/75'
              }`}
            >
              <Icon size={15} strokeWidth={1.8} />
              {label}
              {label === 'Incidents' && clickCount > 0 ? (
                <span className="ml-auto min-w-5 bg-[var(--dashboard-accent)] px-1.5 py-0.5 text-center text-[9px] font-bold text-black">
                  {clickCount}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/[0.075] p-3">
          <button
            type="button"
            className="flex w-full items-center gap-3 px-3 py-2.5 text-[12px] text-white/42 transition hover:bg-white/[0.04] hover:text-white/75"
          >
            <Settings size={15} /> Settings
          </button>
          <div className="mt-2 flex items-center gap-3 border border-white/[0.075] p-3">
            <div className="grid size-7 place-items-center bg-white/[0.08] text-[10px] font-bold">
              AY
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold">Primary suspect</p>
              <p className="truncate text-[9px] text-white/30">admin@localhost</p>
            </div>
            <ChevronDown className="ml-auto text-white/25" size={13} />
          </div>
        </div>
      </aside>

      <div className="lg:pl-[15.5rem]">
        <header className="sticky top-0 z-20 flex h-[4.5rem] items-center border-b border-white/[0.075] bg-[#0a0b0d]/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid size-8 place-items-center bg-[var(--dashboard-accent)] text-xs font-black text-black">
              C!
            </span>
            <span className="text-xs font-bold">CLICKPOCALYPSE</span>
          </div>
          <div className="hidden items-center gap-2 text-[11px] text-white/34 sm:flex">
            <Command size={13} />
            <span>Operations</span>
            <span className="text-white/15">/</span>
            <span className="text-white/72">Liability workspace</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="hidden h-9 w-52 items-center gap-2 border border-white/[0.08] bg-white/[0.025] px-3 text-left text-[10px] text-white/28 transition hover:border-white/15 sm:flex"
            >
              <Search size={13} /> Search incidents
              <kbd className="ml-auto border border-white/10 px-1.5 py-0.5 font-mono text-[8px]">
                ⌘K
              </kbd>
            </button>
            <button
              type="button"
              className="grid size-9 place-items-center border border-white/[0.08] text-white/42 transition hover:bg-white/[0.05] hover:text-white"
              aria-label="Notifications"
            >
              <Bell size={14} />
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-9 items-center gap-2 border border-white/[0.08] px-3 text-[10px] font-semibold text-white/52 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
            >
              <RotateCcw size={13} /> <span className="hidden sm:inline">Reset evidence</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
                <span className="size-1.5 bg-[var(--dashboard-accent)]" /> Live workspace
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">
                Interaction command center
              </h1>
            </div>
            <div className="flex items-center gap-2 border border-white/[0.08] px-3 py-2 text-[10px] text-white/45">
              <CircleDot size={12} className="text-[var(--dashboard-accent)]" /> Session recording
              active
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.75fr)]">
            <motion.section
              key={beat.sequence}
              initial={reducedMotion ? false : { opacity: 0.5, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="relative min-h-[31rem] overflow-hidden border border-white/[0.085] bg-[#0d0f12] p-5 sm:p-8 lg:p-10"
              aria-labelledby="dashboard-hero-title"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-[var(--dashboard-accent)] opacity-75" />
              <div className="flex items-start justify-between gap-4">
                <div className="inline-flex items-center gap-2 border border-white/[0.09] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">
                  <SquareTerminal size={12} className="text-[var(--dashboard-accent)]" />
                  {beat.eyebrow}
                </div>
                <span className="font-mono text-[9px] text-white/22">
                  BEAT_{String(beat.sequence).padStart(2, '0')}
                </span>
              </div>

              <div className="mt-12 max-w-4xl sm:mt-16">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--dashboard-accent)]">
                  Primary interaction protocol
                </p>
                <h2
                  id="dashboard-hero-title"
                  className="mt-4 text-4xl font-semibold leading-[0.96] tracking-[-0.06em] sm:text-6xl lg:text-[4.6rem]"
                >
                  {beat.headline}
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-white/46 sm:text-base sm:leading-7">
                  {beat.detail}
                </p>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <motion.button
                  type="button"
                  disabled={!actionEnabled}
                  onClick={onAction}
                  whileHover={reducedMotion || !actionEnabled ? {} : { y: -2 }}
                  whileTap={reducedMotion || !actionEnabled ? {} : { scale: 0.985 }}
                  className="group relative min-w-[16rem] border border-[var(--dashboard-accent)] bg-[var(--dashboard-accent)] px-5 py-4 text-left text-black transition disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-white/28"
                >
                  <span className="block text-[9px] font-black uppercase tracking-[0.2em] opacity-55">
                    {actionEnabled ? 'Do not click' : 'Interaction delegated'}
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-4 text-[13px] font-black">
                    {actionEnabled ? beat.actionLabel : 'Continue in the official notice below'}
                    <ArrowUpRight
                      size={16}
                      className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                </motion.button>
                <p className="max-w-xs text-[10px] leading-5 text-white/27">
                  Every interaction is evidence. By proceeding, you acknowledge the button may
                  develop opinions.
                </p>
              </div>

              <div className="absolute bottom-0 right-0 hidden w-52 border-l border-t border-white/[0.07] p-4 lg:block">
                <div className="flex items-center justify-between text-[9px] text-white/27">
                  <span>Chaos trajectory</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-3 flex h-10 items-end gap-1" aria-hidden="true">
                  {Array.from({ length: 18 }, (_, index) => (
                    <span
                      key={index}
                      className="flex-1 bg-[var(--dashboard-accent)] transition-all duration-500"
                      style={{
                        height: `${12 + ((index * 17 + clickCount * 11) % 28)}px`,
                        opacity: 0.18 + index / 28,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.section>

            <section className="border border-white/[0.085] bg-[#0d0f12]">
              <div className="flex items-center justify-between border-b border-white/[0.075] px-5 py-4">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/27">
                    Live telemetry
                  </p>
                  <h2 className="mt-1 text-sm font-semibold">System sanity</h2>
                </div>
                <Gauge size={17} className="text-[var(--dashboard-accent)]" />
              </div>
              <div className="p-5">
                <div className="flex items-end justify-between">
                  <p className="text-5xl font-semibold tracking-[-0.07em]">
                    {sanity}
                    <span className="ml-1 text-base text-white/25">%</span>
                  </p>
                  <div className="mb-1 text-right">
                    <p className="text-[10px] font-bold text-[var(--dashboard-accent)]">
                      {tone.status}
                    </p>
                    <p className="mt-1 text-[9px] text-white/28">{tone.note}</p>
                  </div>
                </div>
                <div className="mt-5 h-1 bg-white/[0.065]">
                  <motion.div
                    className="h-full bg-[var(--dashboard-accent)]"
                    animate={{ width: `${sanity}%` }}
                    transition={{ duration: reducedMotion ? 0 : 0.5 }}
                  />
                </div>
                <div className="mt-6 grid grid-cols-3 border-y border-white/[0.075]">
                  {[
                    ['Clicks', clickCount],
                    ['Cursor flags', cursorIncidents],
                    ['Escapes', escapeAttempts],
                  ].map(([label, value], index) => (
                    <div
                      key={label}
                      className={`py-4 text-center ${index ? 'border-l border-white/[0.075]' : ''}`}
                    >
                      <p className="font-mono text-xl font-semibold">{value}</p>
                      <p className="mt-1 text-[8px] uppercase tracking-[0.12em] text-white/27">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 space-y-3">
                  {systemSignals.map(([label, status, Icon]) => (
                    <div key={label} className="flex items-center gap-3 text-[10px]">
                      <Icon size={13} className="text-white/32" />
                      <span className="text-white/42">{label}</span>
                      <span className="ml-auto font-mono text-white/68">{status}</span>
                      <span className="size-1.5 bg-[var(--dashboard-accent)]" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
            <section className="border border-white/[0.085] bg-[#0d0f12]">
              <div className="flex items-center justify-between border-b border-white/[0.075] px-5 py-4">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-white/27">
                    Immutable audit trail
                  </p>
                  <h2 className="mt-1 text-sm font-semibold">Recent activity</h2>
                </div>
                <span className="font-mono text-[9px] text-white/24">
                  {evidenceLog.length} EVENTS
                </span>
              </div>
              <div className="min-h-52 overflow-x-auto">
                {recentEvidence.length ? (
                  <table className="w-full min-w-[620px] text-left text-[10px]">
                    <thead className="border-b border-white/[0.055] text-[8px] uppercase tracking-[0.14em] text-white/22">
                      <tr>
                        <th className="px-5 py-3 font-medium">Event</th>
                        <th className="px-3 py-3 font-medium">Target</th>
                        <th className="px-3 py-3 font-medium">Stage</th>
                        <th className="px-5 py-3 text-right font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEvidence.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-white/[0.045] text-white/48 transition hover:bg-white/[0.025]"
                        >
                          <td className="px-5 py-3.5">
                            <span className="mr-2 inline-block size-1.5 bg-[var(--dashboard-accent)]" />
                            {record.type.replaceAll('-', ' ')}
                          </td>
                          <td className="max-w-60 truncate px-3 py-3.5 text-white/68">
                            {String(
                              record.metadata?.label ??
                                record.metadata?.targetId ??
                                'anonymous control',
                            )}
                          </td>
                          <td className="px-3 py-3.5 font-mono">{record.stageAfter}</td>
                          <td className="px-5 py-3.5 text-right font-mono text-white/28">
                            {formatTime(record.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="grid min-h-52 place-items-center px-6 text-center">
                    <div>
                      <Activity className="mx-auto text-white/18" size={22} />
                      <p className="mt-3 text-xs font-medium text-white/45">
                        No suspicious activity yet
                      </p>
                      <p className="mt-1 text-[9px] text-white/22">
                        The audit trail is uncomfortably clean.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="border border-white/[0.085] bg-[#0d0f12] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-white/27">
                    Escalation map
                  </p>
                  <h2 className="mt-1 text-sm font-semibold">Chaos progression</h2>
                </div>
                <AlertTriangle
                  size={15}
                  className={progress > 50 ? 'text-[var(--dashboard-accent)]' : 'text-white/24'}
                />
              </div>
              <div className="mt-6 space-y-4">
                {(['pristine', 'uneasy', 'rebellious', 'hostile', 'meltdown'] as const).map(
                  (stage, index) => {
                    const stageProgress = [0, 8, 31, 54, 77][index] ?? 0;
                    const passed = progress >= stageProgress;
                    return (
                      <div key={stage} className="flex items-center gap-3">
                        <span
                          className={`grid size-5 place-items-center border text-[8px] font-mono ${passed ? 'border-[var(--dashboard-accent)] bg-[var(--dashboard-accent)] text-black' : 'border-white/10 text-white/20'}`}
                        >
                          {index + 1}
                        </span>
                        <span
                          className={`text-[10px] ${passed ? 'text-white/70' : 'text-white/24'}`}
                        >
                          {CHAOS_STAGE_LABELS[stage]}
                        </span>
                        <span className="ml-auto font-mono text-[8px] text-white/20">
                          {stageProgress}%
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
              <div className="mt-6 border-t border-white/[0.075] pt-4">
                <div className="flex items-center gap-3">
                  <Users size={14} className="text-white/27" />
                  <div>
                    <p className="text-[10px] text-white/55">Risk committee</p>
                    <p className="mt-0.5 text-[8px] text-white/22">
                      0 humans · 3 increasingly nervous scripts
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
