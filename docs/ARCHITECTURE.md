# CLICKPOCALYPSE Architecture

## Architectural stance

CLICKPOCALYPSE is a static React single-page application built by Vite and deployed to Cloudflare Pages. All progression, evidence, court logic, verdict selection, and certificate rendering happen in the browser. There is no server, account, database, or runtime secret in the MVP.

The central design is a small deterministic state machine surrounded by disposable visual scenes. The evidence-derived state is authoritative; animation and presenter tools consume it but cannot rewrite history.

## Runtime topology

```text
Browser
├── App (integration router/composer)
│   ├── Persistent controls (mute, reset, presenter)
│   ├── Landing scene
│   │   ├── Premium content
│   │   ├── Sanity meter
│   │   └── Interaction gateway
│   ├── Chaos effects layer
│   └── Courtroom scene
│       ├── Evidence presentation
│       ├── Defense/verdict state
│       └── Certificate renderer
├── useChaosStore (single shared Zustand store)
└── Static local assets/audio
```

`App.tsx` chooses landing versus courtroom from the effective stage. It passes explicit data/handlers at ownership boundaries and does not contain effect implementations.

## Component hierarchy and ownership

```text
src/
├── App.tsx                         Integration lead: scene composition/handoff
├── main.tsx                        Integration lead: application entry
├── shared/
│   ├── contracts.ts                Locked types, thresholds, pure transition function
│   └── chaosStore.ts               Locked authoritative store
├── components/
│   ├── landing/                    Agent 1: premium page, CTA, nav, sanity meter
│   ├── effects/                    Agent 2: overlays, popups, debris, disturbances
│   ├── courtroom/                  Agent 3: summons, exhibits, defense, verdict
│   └── certificate/                Agent 3: render and download/fallback
├── engine/                         Agent 2: interaction gateway, beat planner, timelines
├── audio/                          Agent 3: audio assets/controller
└── styles/                         Agent 1: tokens, layout, responsive styles
```

Agents expose public barrel exports or a concise handoff contract; they never import another agent's private implementation. Only the integration lead updates `App.tsx`, `src/shared`, root dependencies/configuration, or resolves cross-owner changes.

## Authoritative shared interface

The executable authority is `src/shared/contracts.ts`; documentation must not drift from it. Its minimum surface is:

```ts
type ChaosStage = 'pristine' | 'uneasy' | 'rebellious' | 'hostile' | 'meltdown' | 'courtroom';

interface InteractionRecord {
  id: string;
  sequence: number;
  type: InteractionType;
  timestamp: number;
  stageBefore: ChaosStage;
  stageAfter: ChaosStage;
  metadata?: Readonly<InteractionMetadata>;
}

interface ChaosState {
  sessionId: string;
  startedAt: number;
  clickCount: number;
  chaosStage: ChaosStage;
  evidenceLog: readonly InteractionRecord[];
  demoStageOverride: ChaosStage | null;
  seenInteractionIds: readonly string[];
  recordInteraction(this: void, type: InteractionType, metadata?: InteractionMetadata): void;
  reset(this: void): void;
  demoStage(this: void, stage: ChaosStage | null): void;
}
```

Consumers use `selectEffectiveChaosStage(state)` for rendering and `state.chaosStage` when legal evidence requires the real stage. `demoStage` sets or clears only `demoStageOverride`; it does not call `recordInteraction`, alter `clickCount`, or append evidence.

## Deterministic progression

`stageForInteractionCount` is a pure, tested threshold function:

| Evidence count | Stage        |
| -------------: | ------------ |
|              0 | `pristine`   |
|            1–3 | `uneasy`     |
|            4–6 | `rebellious` |
|            7–9 | `hostile`    |
|          10–12 | `meltdown`   |
|            13+ | `courtroom`  |

`recordInteraction` performs one atomic Zustand update: reject a duplicate semantic ID, stop accepting prosecution evidence after court starts, increment count, derive stage, append a record, and remember the ID. The 13th update therefore contains the triggering evidence and the courtroom stage together.

The effect engine may choose a beat from `(sequence, type, metadata)`, but may not own or mutate a second count. Random visual variation must not determine progression or completion.

## Interaction recording and event ownership

- Agent 1 emits semantic intent from owned controls; it does not calculate stages.
- Agent 2 owns the interaction gateway and maps semantic actions to `InteractionType` and safe metadata.
- Each meaningful action invokes `recordInteraction` once at the narrowest owner. Parent containers must not also record it.
- For paths where bubbling or multiple input events are unavoidable, Agent 2 supplies one stable `interactionId` for the semantic action. The store treats repeated IDs idempotently.
- Metadata contains display-safe primitives such as stable target ID and human label. Never record raw events, DOM nodes, user-entered secrets, or cyclic values.
- Mute, reset, accessibility, defense, certificate download, replay, and presenter controls bypass the gateway.
- Courtroom scene choices use Agent 3's local discriminated state because the prosecution log is frozen at entry.

## Data flow

```text
Eligible semantic action
  → Agent 2 interaction gateway
  → useChaosStore.recordInteraction(type, metadata)
  → atomic count + stage + evidence update
  → selectors notify Landing / Effects / App
  → stage/sequence-owned effect runs
  → count 13 makes App hand evidence snapshot to Courtroom
  → local defense/verdict state
  → client-side certificate
```

Components select the smallest store slice needed to avoid rerender storms. Evidence is append-only until reset. Do not persist to local storage for the MVP; a refresh intentionally begins a clean session and avoids stale demo data.

## Animation lifecycle and cleanup

- Microinteractions use CSS or Motion; cinematic sequences use GSAP; Matter.js is added only if lightweight authored motion is insufficient.
- Each stage/beat animation has an owner, a finite duration, and an explicit cleanup path.
- In React, create timelines in an effect or layout effect, preferably inside `gsap.context`, and `revert()`/`kill()` on dependency change, scene exit, or unmount.
- Remove listeners and observers with their exact registered references. Cancel animation frames and timers. Stop Matter runners/engines and clear worlds. Stop/unload Howler instances owned by the exiting scene.
- React Strict Mode mounting twice in development must not duplicate any visible effect.
- Cap debris/particles/physics bodies and remove them after their beat. Never run background animation merely to keep the page “chaotic.”
- Reduced motion replaces large transforms, shaking, parallax, and physics with short opacity/color/text changes.

## Courtroom handoff

`App.tsx` observes `selectEffectiveChaosStage`, but courtroom entry caused by real play must use evidence-derived `chaosStage === 'courtroom'`. On that transition:

1. landing interaction input is disabled immediately;
2. effect engine finishes or cancels its short exit timeline;
3. `evidenceLog` is passed/read as a frozen snapshot;
4. the courtroom mounts exactly once for that session and owns `summons → exhibits → defense → verdict → certificate` locally;
5. replay invokes the shared `reset`, and each scene cleans its local resources.

A presenter override may preview a visual stage. If it previews courtroom, the scene must label preview mode and use mock display-only copy or the current immutable evidence; it must not fabricate records or produce a misleading certificate.

## Certificate strategy

Use browser-native DOM/canvas generation first to avoid another dependency. Render a fixed certificate component with text-safe session data, then:

1. attempt an on-demand PNG export using a verified lightweight renderer only if already approved/installed, or a canvas-native drawing path;
2. create an object URL, trigger a user-initiated download, and revoke the URL;
3. keep the same certificate visible with print CSS as the guaranteed fallback.

No remote image, font, API, or server is required. The certificate identifier is derived from the non-sensitive session ID and is not a credential.

## Error recovery and reset

- An error boundary at the integrated scene level should replace failed decorative effects with a plain continuation action; a court failure exposes evidence summary, reset, and certificate fallback.
- Audio and advanced effects are optional enhancements. Feature-detect APIs and continue silently when unavailable.
- `reset()` creates a new session/time, zeroes count, sets pristine, clears evidence, deduplication IDs, and demo override.
- Local controllers subscribe to reset/session ID changes and perform cleanup. No store reset may depend on an animation callback.
- A persistent reset control remains outside damageable scene layers and never records evidence.

## Responsive and reduced-motion behavior

- Use fluid type/spacing and content-driven breakpoints; 320 px is the minimum supported width.
- Effects use viewport-relative bounds and must not cover essential controls. Court content scrolls normally on short/mobile viewports.
- Input behavior supports pointer, touch, and keyboard without hover dependence.
- Read `prefers-reduced-motion` through CSS and a shared hook/controller; initialize safely during serverless static render and respond to preference changes.
- In reduced motion, preserve the same count, jokes, stages, and timing affordances while using static transforms/fades.

## Deployment architecture

```text
GitHub repository
  → Cloudflare Pages build
      command: npm run build
      output: dist
      Node: compatible current LTS
  → global static CDN
  → SPA assets execute entirely in browser
```

No environment variables are required. A future optional service must be feature-flagged, fail closed to the solo experience, and never become a requirement for court or certificate completion. Test direct navigation if routes are added; the initial single-route app needs no rewrite rule.

## Integration boundaries

| Owner            | May write                                                 | Must export/provide                                              | Must not do                                     |
| ---------------- | --------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------- |
| Agent 1          | `components/landing`, `styles`                            | landing root, semantic callbacks/props, responsive tokens        | import engine internals, change store/config    |
| Agent 2          | `engine`, `components/effects`                            | interaction gateway, effects layer, cleanup-safe stage response  | create another store, edit landing/court/shared |
| Agent 3          | `components/courtroom`, `components/certificate`, `audio` | courtroom root, completion/replay contract, certificate fallback | append prosecution evidence, edit store/App     |
| Integration lead | `App`, `main`, `shared`, configs                          | scene wiring, dependency decisions, conflict resolution          | silently change an agent-owned implementation   |

Cross-boundary requests are written as an exact import/prop contract and handed to the integration lead. Shared types change only when all consumers can be updated and verification can run immediately.
