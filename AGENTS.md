# CLICKPOCALYPSE Agent Rules

These rules apply to the entire repository. The integration lead owns this file and resolves conflicts.

## Non-negotiable contracts

- TypeScript stays in strict mode. Do not weaken `tsconfig` checks, add broad `any`, or suppress errors without a written reason beside the narrow suppression.
- `src/shared/contracts.ts` and `src/shared/chaosStore.ts` are locked integration contracts. Only the integration lead may edit them. Request a contract change instead of creating a substitute.
- There is exactly one global chaos store: `useChaosStore`. Do not create parallel click counters, evidence arrays, or Zustand stores for shared progression. Scene-local state is allowed for ephemeral UI.
- UI components must derive thresholds and stage labels from shared exports. Never hardcode interaction counts or reproduce stage-transition logic inside a component.
- Record an eligible user action exactly once through `recordInteraction`. Accessibility, mute, restart/reset, and presenter controls never increment chaos. Courtroom choices are scene state, not new prosecution evidence.
- Never invent an API, component export, asset, environment variable, package, or backend endpoint. Verify it exists before importing or documenting it.

## Ownership

- Integration lead only: `src/App.tsx`, `src/main.tsx`, `src/shared/`, root configuration, dependency files, and central integration edits.
- Agent 1 only: `src/components/landing/`, `src/styles/`.
- Agent 2 only: `src/engine/`, `src/components/effects/`.
- Agent 3 only: `src/components/courtroom/`, `src/components/certificate/`, `src/audio/`.
- Do not modify, rename, format, or delete another owner's files. Put cross-boundary needs in a short handoff note with the exact requested import/prop contract.
- The Step 0 store is in locked `src/shared/`; Agent 2 owns chaos orchestration code in `src/engine/`, not the shared store.

## Implementation quality

- Build small reusable components with typed props. Keep scene-specific logic near its owning scene and avoid giant multi-purpose components.
- Use existing primitives before adding dependencies. Do not add a dependency without integration-lead approval and a compatibility check against the installed React/Vite versions.
- Keep the app frontend-only. No authentication, database, server, AI API, or secret is part of the MVP.
- All imports must resolve on a clean checkout. Prefer the `@/` alias for source imports and avoid reaching into another feature's private modules.
- Never start an uncontrolled `requestAnimationFrame`, interval, event listener, observer, audio instance, Matter runner, or GSAP timeline. Create it in a React effect or owned controller and stop/kill/remove it during cleanup.
- Scope GSAP work with `gsap.context` where practical and call `context.revert()` in cleanup. React Strict Mode must not duplicate timelines or listeners.
- Never make essential controls escape permanently, become obscured, or require precision pointing. Chaos may appear destructive but the two-minute journey must remain finishable.
- Fail gracefully: missing audio, unsupported canvas, failed certificate download, or reduced hardware capability must fall back to usable text/UI without blocking the story.

## Accessibility and responsive behavior

- Use semantic HTML, visible focus states, keyboard-operable controls, meaningful accessible names, and polite live regions for status changes.
- Respect `prefers-reduced-motion`. Provide static substitutions for large movement, shaking, physics, flashes, and cinematic transitions.
- Avoid rapid flashing, browser traps, forced fullscreen, blocked navigation, or hostile system dialogs.
- Support widths from 320 px upward. Test at 375 px, 768 px, and a desktop viewport. Keep all recovery, mute, defense, verdict, and replay controls reachable.
- Sound is optional enhancement only, starts after user interaction, and always has a persistent mute control. Missing sound must not change progression.

## Verification and commits

- Before handing off or committing, run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Fix failures in owned files; report unrelated failures precisely.
- Do not commit generated `dist`, coverage, local environment files, or unrelated workspace changes.
- Make small, understandable commits limited to owned files. Use an imperative message that states the outcome.
- Never fabricate test, browser, build, deployment, performance, or accessibility results. Distinguish checks actually run from checks still required.
