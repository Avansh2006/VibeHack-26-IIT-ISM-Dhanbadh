# CLICKPOCALYPSE Parallel Agent Tasks

## Shared dispatch rules

Exactly three implementation agents run in parallel. Before coding, each reads root `AGENTS.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, and `src/shared/contracts.ts`. Shared contracts and the initial store are already established and locked.

Agents work only in their owned paths, do not install packages, and do not edit `App.tsx`, `src/shared`, configuration, lockfiles, or another agent's files. Cross-boundary needs go to the integration lead as a concise handoff containing the desired export and typed props. Each agent finishes by running the repository checks, reporting only executed results, and listing its public exports.

---

## Agent 1 — Premium Frontend

### Ownership

- `src/components/landing/`
- `src/styles/`

### Dependencies

- Locked: `src/shared/contracts.ts`, `src/shared/chaosStore.ts`
- Installed UI/runtime packages: React, Motion, Lucide React, Tailwind CSS v4
- Consumes effective stage/count through typed props or the shared store selector; must not reproduce thresholds
- Coordinates semantic eligible-action callbacks with Agent 2 through the integration lead

### Outputs

- A polished landing root component and a public barrel export
- Responsive hero/navigation, fictional SaaS value content, central CTA, and sanity meter
- Clearly typed semantic callback/prop contract for eligible actions
- Stage-aware but non-destructive visual variants through `meltdown`
- Persistent reachable locations/hooks for mute/reset/presenter controls supplied by integration
- Styles/tokens for premium visual identity and reduced-motion/mobile behavior

### Acceptance criteria

- Stage 0 plausibly looks like a premium launch-ready SaaS page within five seconds.
- Primary CTA is central, keyboard accessible, touch friendly, and exposes one semantic action—never direct threshold math.
- Sanity meter reads from shared stage/count and has a useful accessible label/status.
- Layout works at 320, 375, 768, and desktop widths without horizontal overflow.
- No essential action depends on hover; focus is visible; reduced motion remains polished.
- Agent-owned files pass typecheck, lint, tests, and build when integrated with the current placeholder.

### Integration instructions

Export one stable root such as `LandingExperience` from `src/components/landing/index.ts`. Prefer a prop contract like `onEligibleInteraction(type, metadata)` and accept stage/count as props if that keeps visual code isolated. Do not make App changes yourself. Give the integration lead the exact import statement, prop type, and any required stacking/z-index assumptions for Agent 2's effects layer.

### Ready-to-paste Antigravity prompt

```text
You are Agent 1 — Premium Frontend for CLICKPOCALYPSE, a six-hour hackathon project. Work only in `src/components/landing/` and `src/styles/`. Do not modify `src/App.tsx`, `src/main.tsx`, `src/shared/`, root config, package files, lockfiles, `src/engine/`, effects, courtroom, certificate, or audio files.

First read `AGENTS.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/AGENT_TASKS.md`, and `src/shared/contracts.ts`. The shared interfaces and stage thresholds are locked. There is one Zustand chaos store; do not create another store, local click counter, or duplicated threshold logic. Do not install dependencies.

Build an exceptionally polished fictional SaaS landing experience that makes the later destruction funny through contrast. Own the responsive visual identity, premium hero/navigation/value content, central CTA, sanity meter, accessible microinteractions, and stage-aware visual styling. Use React, Tailwind v4/CSS, Motion, and Lucide only as already installed. Write concise original corporate copy with subtle legal/compliance foreshadowing, not generic meme filler.

Expose eligible actions through one strongly typed semantic callback or equally clear public prop contract; each user action must be recordable exactly once by the integration/engine layer. Never hardcode interaction thresholds in a UI component. Mute, reset, accessibility, and presenter controls must never be reported as eligible actions. The interface must remain finishable at every stage.

Support keyboard, touch, visible focus, semantic markup, 320/375/768/desktop layouts, and `prefers-reduced-motion`. Do not implement major chaos effects, popups, physics, courtroom, audio, certificate, or integration routing. Export a stable landing root from `src/components/landing/index.ts`.

Before handoff, run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Fix failures in your files and do not claim checks you did not execute. Return: files changed, public export/import, exact props, stacking assumptions for the effects layer, executed results, and any integration request. Do not edit outside your ownership even to fix integration.
```

---

## Agent 2 — Chaos Engine

### Ownership

- `src/engine/`
- `src/components/effects/`

### Dependencies

- Locked: `src/shared/contracts.ts`, `src/shared/chaosStore.ts`
- Installed animation/runtime packages: GSAP, Motion; Matter.js is not assumed installed
- Receives semantic actions from Agent 1/integration and consumes shared store state
- Provides a composable effects layer and interaction gateway to `App.tsx`

### Outputs

- One typed interaction gateway that prevents nested/double recording
- A deterministic beat plan for counts 1–12 and clean handoff on 13
- Escaping-button behavior, bounded arguing popups, disturbances, and controlled meltdown effects
- GSAP timelines/controllers with complete Strict Mode-safe cleanup
- Capability/reduced-motion fallbacks and capped resource use
- Public barrel exports plus a concise integration contract

### Acceptance criteria

- Each eligible semantic action calls shared `recordInteraction` once; supplied duplicate IDs remain idempotent.
- All 12 pre-court interactions have a distinct authored response aligned to their locked stage.
- Stage logic comes from shared state, not hardcoded alternative thresholds.
- Effects never permanently cover reset/mute/core progression or make keyboard completion impossible.
- No unbounded popups, timers, RAFs, bodies, listeners, timelines, or DOM nodes survive scene change/reset.
- Reduced-motion path conveys every beat without shaking/physics/large motion.
- Three reset/replay cycles do not duplicate effects in React Strict Mode.

### Integration instructions

Export an interaction adapter/hook and one `ChaosEffectsLayer` from barrel files. Document exactly whether the gateway accepts `InteractionType`/`InteractionMetadata` or returns semantic handlers. Effects should render above landing visuals but below persistent controls and courtroom. Never directly mount court or edit App; the integration lead owns the handoff. If a dependency seems necessary, provide the reason, bundle impact, and fallback—do not install it.

### Ready-to-paste Antigravity prompt

```text
You are Agent 2 — Chaos Engine for CLICKPOCALYPSE, a six-hour hackathon project. Work only in `src/engine/` and `src/components/effects/`. The Step 0 store remains owned and locked by the integration lead in `src/shared/`; do not edit it. Do not modify App, landing, styles, courtroom, certificate, audio, config, package files, or lockfiles.

First read `AGENTS.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/AGENT_TASKS.md`, `src/shared/contracts.ts`, and `src/shared/chaosStore.ts`. Use the existing shared types, `recordInteraction`, evidence log, and selectors. Never create a duplicate store/counter, change thresholds, fabricate evidence, or install dependencies.

Implement the progressive chaos engine and effects layer. Create one typed semantic interaction gateway that records each eligible action exactly once and guards nested/double dispatch. Author distinct coherent beats for interactions 1–12: subtle sarcasm at 1–3; catchable/reachable rebellious controls and complaining navigation at 4–6; bounded popup arguments and screen disturbances at 7–9; a cinematic but controlled meltdown at 10–12. Count 13 is the store-owned courtroom transition; expose a clean integration handoff but do not implement or mount court.

Use installed GSAP/Motion where helpful. Scope GSAP timelines and fully clean them with React lifecycle/`gsap.context`; cancel timers, RAFs, listeners, and generated nodes. React Strict Mode must not duplicate effects. Cap every repeated visual. Do not assume Matter.js exists; deliver a CSS/GSAP solution unless the integration lead approves a dependency. Essential controls must remain reachable, keyboard users need a stable path, and reduced-motion must replace shaking/physics/large travel with static visual/text beats. Avoid flashing and browser-trapping behavior.

Export a stable `ChaosEffectsLayer` and interaction gateway/hook through barrel files. Document z-index and props for integration. Before handoff run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`; report only executed results. Return files changed, exact imports/props, lifecycle cleanup notes, executed checks, and any narrow integration request. Never edit outside ownership.
```

---

## Agent 3 — Courtroom and Finale

### Ownership

- `src/components/courtroom/`
- `src/components/certificate/`
- `src/audio/`

### Dependencies

- Locked: shared `ChaosStage`, `InteractionRecord`, and store reset/evidence semantics
- Installed UI/runtime packages: React, Motion, GSAP, Lucide React
- Receives a frozen real evidence list and replay callback from integration
- Must work with no network and with audio/download support absent

### Outputs

- Courtroom root with local typed scene state: summons, charges/exhibits, defense, verdict, certificate
- Deterministic evidence selection/presentation using 3–5 actual records
- At least three humorous accessible defenses and evidence-aware verdict rules
- Branded Certified Digital Menace certificate with client-side download and visible/print fallback
- Optional user-initiated sound controller with persistent mute API and silent failure
- Public barrel exports and exact integration contract

### Acceptance criteria

- Court accepts real `readonly InteractionRecord[]`; it never appends or edits prosecution evidence.
- Exhibits render safe labels/types/sequences from actual records and remain useful if metadata is absent.
- Keyboard/touch users can reach every defense, verdict, certificate, and replay action.
- Verdict is immediate/local, funny, and tied to count/evidence/defense.
- Certificate remains visible/printable if image download fails; object URLs/resources are cleaned.
- Audio starts after user activation, is optional, and mute state never blocks progression.
- Reduced-motion and narrow/short viewport paths complete without clipped actions.

### Integration instructions

Export `CourtroomExperience` and its props from `src/components/courtroom/index.ts`; export certificate and audio public APIs from their own barrels. Expect the integration lead to pass evidence, session ID/date, reduced-motion/mute state as needed, and `onReplay`. Keep defense/verdict state local and reset it when the session ID changes. Do not call `recordInteraction` for trial controls. State any required print styles or asset paths in the handoff.

### Ready-to-paste Antigravity prompt

```text
You are Agent 3 — Courtroom and Finale for CLICKPOCALYPSE, a six-hour hackathon project. Work only in `src/components/courtroom/`, `src/components/certificate/`, and `src/audio/`. Do not modify App, shared contracts/store, landing, global styles owned by Agent 1, engine/effects, config, package files, or lockfiles.

First read `AGENTS.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/AGENT_TASKS.md`, and `src/shared/contracts.ts`. Treat the supplied `readonly InteractionRecord[]`, session ID, and reset/replay callback as authoritative. Never append, alter, or fabricate prosecution evidence, never call `recordInteraction` for courtroom actions, and do not install dependencies.

Build the complete local courtroom arc: concise summons, charges, 3–5 exhibits selected from actual evidence, at least three funny defense choices, an evidence/defense-aware verdict, and a branded Certified Digital Menace certificate. Use specific bureaucratic/legal absurdity and callbacks to record types/labels rather than generic memes. Scene state should be a clear typed progression and reset whenever session ID changes.

Implement certificate generation entirely client-side. Prefer a reliable native DOM/canvas approach with a user-initiated download; always keep a visible print-friendly fallback if generation/download fails. Clean object URLs and temporary resources. Implement optional sound only if it improves the flow using available browser capabilities/packages: it must start after activation, fail silently, expose a persistent mute API, and never convey required information.

All defenses, verdict, download, and replay controls must be keyboard/touch accessible with visible focus. Support reduced motion and mobile/short viewports; never block completion on animation, audio, canvas, or network. Export `CourtroomExperience` and typed props from a stable barrel, plus public certificate/audio APIs. Do not wire App yourself.

Before handoff run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Report only checks actually run. Return files changed, exact public imports/props, print/style or asset needs, executed results, and any integration request. Never edit outside ownership.
```
