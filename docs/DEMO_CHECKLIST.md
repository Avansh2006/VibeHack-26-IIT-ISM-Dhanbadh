# CLICKPOCALYPSE Demo and Quality Checklist

Record device/browser and actual result beside each item. Never mark an unexecuted check as passed.

## Progression and comedy

- [ ] Fresh load shows polished stage 0 with a zeroed sanity meter.
- [ ] Interactions 1–3 each produce a distinct `uneasy` response.
- [ ] Interactions 4–6 show controlled rebellion without blocking keyboard/touch completion.
- [ ] Interactions 7–9 escalate coherently; popups never multiply without a cap.
- [ ] Interactions 10–12 perform smoothly and leave essential controls usable.
- [ ] Interaction 13 appends exactly one final exhibit and enters court exactly once.
- [ ] Escalation feels causal and tells one lawsuit story rather than random glitches.
- [ ] Nested click targets and keyboard activation do not double-count.
- [ ] Mute, reset, accessibility, presenter, defense, and download controls do not count.

## Courtroom and evidence

- [ ] Court loads even if audio, advanced animation, or canvas is unavailable.
- [ ] Exhibits match the current session's actual sequence/type/labels.
- [ ] Presenter preview creates no evidence and is clearly distinguishable from a real trial.
- [ ] At least three defense choices are readable, focusable, and produce a verdict.
- [ ] Verdict references actual evidence/defense and cannot leave the user stuck.
- [ ] Certificate is legible and downloads on a supported desktop browser.
- [ ] Visible/printable certificate fallback works when download generation is forced to fail.

## Recovery, replay, and lifecycle

- [ ] Reset is reachable during landing chaos and returns to pristine state.
- [ ] Replay clears count, evidence, demo override, scene state, sound, and visual debris.
- [ ] Three consecutive full replays do not duplicate listeners, popups, audio, timers, or timelines.
- [ ] Refresh starts a clean session and does not expose stale evidence.
- [ ] Decorative-effect failure leaves a usable continuation/reset path.

## Responsive and accessibility

- [ ] Complete journey at 1440×900 desktop.
- [ ] Complete journey at 768 px tablet width.
- [ ] Complete journey at 375×667 and inspect 320 px minimum width.
- [ ] No essential control is clipped, obscured, too small, or hover-only.
- [ ] Keyboard-only journey preserves visible focus and logical focus order.
- [ ] Screen-reader names and status announcements are meaningful and not noisy.
- [ ] Reduced-motion journey preserves all stages/jokes with safe static transitions.
- [ ] No rapid flashing, browser trap, forced fullscreen, or fake system UI.

## Sound

- [ ] Audio starts only after user activation.
- [ ] Persistent mute works before, during, and after court.
- [ ] Muting does not change timing or completion.
- [ ] Missing/blocked audio produces no console exception and no blocked scene.

## Performance and engineering

- [ ] No uncaught errors or repeated warnings in the console during a full run.
- [ ] Intensive animations remain responsive on the demo laptop and one mid-range mobile device.
- [ ] Physics/particles are capped and cleaned after their stage.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes from the committed source.
- [ ] `npm run preview` completes the core journey using production assets.

## Deployment and judging

- [ ] Cloudflare Pages uses build command `npm run build` and output directory `dist`.
- [ ] Production URL loads on a separate device/network with correct assets and no console errors.
- [ ] Two consecutive production journeys complete in under two minutes.
- [ ] Presenter knows the exact click route, key comedy beats, and recovery/reset path.
- [ ] Optional network features are disabled or degrade to the complete solo experience.
- [ ] Local production preview is ready as an offline fallback.
- [ ] `dist` backup and a current two-minute screen recording are available offline.
