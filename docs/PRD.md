# CLICKPOCALYPSE Product Requirements Document

## Product overview and vision

CLICKPOCALYPSE is a two-minute interactive comedy experience disguised as an exceptionally polished SaaS landing page. The product starts credible, then treats each meaningful interaction as a personal attack. Its responses escalate from passive-aggressive copy to coordinated UI rebellion, a controlled visual meltdown, and a fictional courtroom where the user's real interaction history becomes evidence.

**Concept:** The Website That Is Suing You  
**Tagline:** Every click has consequences. Yours are legally questionable.

The creative rule is causality: each gag must feel like the website reacting to something the user actually did. Chaos is authored and paced, not a random glitch filter.

## Problem statement and compliance

**Challenge:** “Chaos Click — Create a website that becomes progressively more chaotic every time the user clicks or interacts with it.”

The submission complies when:

- every eligible pre-trial interaction is counted once and produces an immediate response;
- escalation follows the locked thresholds: 0, 1–3, 4–6, 7–9, 10–12, and courtroom at 13;
- the experience begins as a usable premium website and becomes progressively more chaotic;
- the trial uses evidence generated from this session's real actions;
- the user can always reach the finale, download a certificate, reset, and replay;
- mute, reset, accessibility, and presenter controls never inflate the evidence;
- chaos avoids browser traps, dangerous flashing, fake system prompts, and permanent loss of controls.

## Audience and judging experience

Primary users are hackathon judges and spectators encountering the project with no instructions. Secondary users are online visitors on mobile or desktop. A judge should understand the premium façade within 5 seconds, discover the joke in the first click, see a fresh escalation every few seconds, enter court by roughly 75 seconds, and finish with a shareable certificate before the two-minute mark.

## Differentiators and humour strategy

- **Receipts, not randomness:** exact targets, labels, timestamps, and sequences become legal “evidence.”
- **A character with an arc:** the website moves from corporate restraint through resentment to theatrical litigation.
- **Visual contrast:** disciplined typography and restrained motion make later collapse more surprising.
- **Comedy through specificity:** jokes cite the user's behavior (“Exhibit 4: clicked Pricing after being warned”), not generic memes.
- **Committed framing:** nav complaints, popups, physics, courtroom language, verdict, and certificate all serve one lawsuit narrative.
- **Safe hostility:** the interface complains and misbehaves theatrically while preserving consent, accessibility, and an exit.

Writing should be concise, original, and escalating. Prefer bureaucratic absurdity, petty corporate indignation, and callbacks to evidence. Avoid stale meme slang, insults about identity or ability, and long text that slows the demo.

## Core user journey

1. The user lands on a pristine fictional SaaS page with a clear primary action and sanity meter.
2. The first actions trigger restrained sarcastic feedback while preserving the premium layout.
3. Navigation and buttons begin to object, evade, and argue through stages 4–9.
4. Interactions 10–12 trigger a choreographed, performance-safe visual collapse.
5. Interaction 13 freezes prosecution evidence and transitions into court.
6. The court presents selected real evidence and asks the user to choose a defense.
7. A deterministic-but-varied verdict responds to the evidence and defense.
8. The user downloads a Certified Digital Menace certificate or replays from a clean session.

## Functional requirements

### Interaction and progression

- A single shared store owns `clickCount`, evidence, evidence-derived stage, and demo override.
- Eligible actions include meaningful landing navigation, CTA clicks, feature-card actions, popup actions, and authored escape attempts.
- Pointer and keyboard activation of the same semantic action count identically.
- Nested handlers must not double-count; a supplied `interactionId` is idempotent and the engine must also own DOM event routing.
- Interaction 13 must atomically add the final record and set the evidence-derived stage to `courtroom`.
- No new prosecution evidence is collected after courtroom entry.
- Presenter stage preview changes rendering only and never alters count or evidence.

### Feedback and controls

- Every counted action gets perceivable visual or textual feedback within 150 ms.
- A persistent sanity/chaos indicator reflects the effective displayed stage.
- Mute, reset/replay, reduced-motion behavior, and presenter controls remain reachable.
- Reset creates a fresh session, clears evidence and overrides, stops owned effects/audio, and returns to the pristine page.

### Evidence, court, and finale

- Evidence records include sequence, type, time, before/after stage, and safe display metadata.
- Court selects 3–5 readable exhibits with a bias toward diverse action types and later-stage behavior.
- The user receives at least three humorous defense options.
- The verdict references evidence count and chosen defense; it must render without network access.
- Certificate generation is client-side and includes verdict title, session date, count, selected exhibits, and a unique non-sensitive certificate ID.
- Download failure exposes a printable/shareable on-screen certificate rather than blocking completion.

## Non-functional requirements

- **Reliability:** deterministic threshold transitions, idempotent event recording, React Strict Mode-safe effects, and a complete reset path.
- **Performance:** target 60 fps on a typical modern laptop; cap particles/physics bodies; avoid layout thrash; pause offscreen/unneeded loops.
- **Startup:** first meaningful UI should render promptly on hackathon Wi-Fi and remain functional if audio/assets fail.
- **Privacy:** no accounts, analytics, camera, microphone, location, or personal data. Evidence exists only in memory unless the user downloads a certificate.
- **Compatibility:** current Chrome/Edge desktop and modern mobile Safari/Chrome. Progressive enhancement for sound, canvas, and downloads.
- **Maintainability:** strict TypeScript, one store, locked contracts, folder ownership, and no hidden threshold logic.

## Detailed chaos progression

| Count | Stage        | Narrative intent               | Required response                                                          | Guardrail                                   |
| ----: | ------------ | ------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------- |
|     0 | `pristine`   | Earn trust                     | Premium hero, crisp navigation, calm sanity meter                          | All core controls work                      |
|   1–3 | `uneasy`     | Website notices                | Sarcastic toast/copy shift, subtle button recoil, meter concern            | No layout obstruction                       |
|   4–6 | `rebellious` | Website resists                | Escaping-but-catchable button, complaining nav, absurd consent-style popup | Keyboard path remains stable                |
|   7–9 | `hostile`    | Website organizes against user | Popup argument, mild screen skew/noise, behavior changes tied to evidence  | Close/continue controls visible             |
| 10–12 | `meltdown`   | Controlled catastrophe         | Choreographed collapse, limited physics, dramatic transition cues          | Cap workload; reduced-motion static variant |
|    13 | `courtroom`  | Consequences                   | Freeze evidence and hand off exactly once to trial                         | Transition cannot be skipped accidentally   |

At least one distinctive authored beat must occur per interaction. Repeated clicks may vary copy but may not create unbounded popups, DOM nodes, audio, or animation loops.

## Courtroom flow and finale

1. **Summons:** a short transition replaces the destroyed site with a legible courtroom.
2. **Charges:** “reckless clicking,” “premeditated CTA harassment,” and similar charges are derived from evidence categories.
3. **Exhibits:** 3–5 actual records show sequence and target labels; metadata is escaped as text.
4. **Defense:** user chooses one of at least three accessible buttons (for example: “The button looked clickable,” “My mouse slipped 13 times,” “I invoke dark-pattern immunity”).
5. **Verdict:** a local ruleset selects a funny verdict and sentence with a reduced-motion-safe reveal.
6. **Certificate:** render a branded certificate, offer PNG download if supported, and retain a print-friendly visible fallback.
7. **Replay:** resets all global and scene-local state and returns to stage 0.

## MVP and stretch features

### MVP—required before feature expansion

- polished responsive landing façade;
- accurate 13-interaction progression with one distinctive response per beat;
- sanity meter, reset, mute, and reduced-motion behavior;
- controlled meltdown and reliable courtroom handoff;
- evidence-driven exhibits, three defenses, verdict, certificate download/fallback, replay;
- passing typecheck, lint, tests, build, and a verified production deployment.

### Stretch—only after the complete solo journey works

- additional evidence-aware joke variants and sound design;
- presenter stage picker that only sets `demoStageOverride`;
- richer Matter.js debris on capable devices;
- share-card refinement;
- optional Convex audience voting, isolated behind a feature flag and graceful offline fallback.

## Accessibility, performance, and responsive requirements

- All interactive elements are native buttons/links or implement equivalent keyboard semantics.
- Focus remains visible through every stage; focus moves deliberately when modal/court scenes open.
- Status copy uses polite announcements; rapid decorative changes are hidden from assistive technology.
- `prefers-reduced-motion` substitutes fades/static compositions for shaking, large travel, physics, and cinematic motion.
- Do not flash more than three times per second. Never force fullscreen, steal browser shortcuts, or trap users.
- Sound begins only after user activation, never carries required information, and is controlled by a persistent labeled mute button.
- Layout works at 320 px minimum, 375 px, 768 px, 1440 px, and common landscape heights. Court evidence and certificate remain scrollable.
- Cap concurrent physics bodies/particles and clean all timelines/listeners on stage change or reset.

## User stories and acceptance criteria

### First-time judge

As a judge, I want an immediately impressive landing page so the later destruction has contrast.

- Given a fresh session, when the page loads, then count is 0, stage is pristine, and no chaos effect runs.
- The value proposition, primary action, and sanity state are clear at desktop and 375 px.

### Curious clicker

As a user, I want every action to provoke the site so I feel responsible for the escalation.

- Given any pre-court stage, when one eligible semantic action occurs, then exactly one evidence record is appended and feedback appears.
- Given nested handlers with the same interaction ID, only one record is appended.
- Ineligible controls never change count or evidence.

### Court defendant

As a user, I want the trial to cite my behavior so the payoff feels personal.

- The 13th eligible interaction enters court once and evidence contains exactly 13 records.
- Exhibits visibly correspond to actual records and show no presenter-generated evidence.
- A keyboard user can select every defense and reach a verdict.

### Finale collector

As a user, I want a certificate and replay so the experience has a satisfying end.

- Download produces a readable certificate when supported.
- If generation/download fails, the certificate remains visible and printable.
- Replay clears evidence, stage override, audio/effect state, and restores the pristine scene.

### Presenter

As a presenter, I want to preview a stage without poisoning the trial data.

- Selecting a demo stage changes only `demoStageOverride`.
- Clearing the override restores the evidence-derived stage.
- Reset clears the override.

## Risks, dependencies, and mitigation

| Risk/dependency                     | Impact                     | Mitigation                                                                    |
| ----------------------------------- | -------------------------- | ----------------------------------------------------------------------------- |
| Three agents edit integration files | Merge delays               | Enforce folder ownership; integration lead alone edits shared/root files      |
| Duplicate event bubbling            | Incorrect trial evidence   | One engine gateway plus semantic `interactionId` deduplication and tests      |
| Animation leaks in Strict Mode      | Duplicated effects/crashes | Owned lifecycle, `gsap.context`, cleanup tests/manual replay loops            |
| Physics overload                    | Demo stutter               | Lazy-load if used, cap bodies, short lifetime, reduced-motion/static fallback |
| Audio/autoplay failure              | Missing cues               | User-initiated start, text/visual equivalence, silent fallback                |
| Certificate library/asset failure   | Broken finale              | Prefer native canvas/DOM strategy; visible print fallback                     |
| Comedy becomes random or repetitive | Weak judging story         | Script beats by sequence and use evidence callbacks                           |
| Integration falls behind            | Incomplete project         | Lock MVP gates and use fallback actions in sprint plan                        |
| Hackathon Wi-Fi/deployment issue    | No demo                    | local production preview, offline-capable assets, backup screen recording     |

## Definition of Done

- All 13 eligible interactions are reproducible, count once, and show coherent escalation.
- Court entry, exhibits, defense, verdict, certificate, and replay work in a two-minute rehearsal.
- Reset and at least three consecutive replays show no duplicated listeners, timelines, or stale evidence.
- Desktop and mobile paths retain visible, keyboard-accessible essential controls.
- Reduced-motion and muted journeys preserve the complete narrative.
- No uncaught console errors occur in the rehearsed flow.
- `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` pass from a clean install.
- Cloudflare Pages production URL is verified, with local preview and recording backups prepared.

## Explicit exclusions

- Authentication, accounts, profiles, databases, custom servers, AI APIs, payments, or real legal services.
- Collecting personal information, cross-session behavior, analytics, or surveillance-style browser permissions.
- Native mobile apps, browser extensions, multiplayer in the MVP, or a general-purpose game engine.
- Forced fullscreen, browser hijacking, unclosable dialogs, deceptive OS/browser warnings, or destructive behavior.
- Unlimited procedural chaos, user-authored content, localization, and exhaustive browser support during the six-hour build.
