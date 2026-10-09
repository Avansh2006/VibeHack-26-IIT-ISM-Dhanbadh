# CLICKPOCALYPSE

> Every click has consequences. Yours are legally questionable.

CLICKPOCALYPSE is an interactive comedy experience for the VibeHack '26 IIT (ISM) Dhanbad challenge “Chaos Click.” It begins as a suspiciously polished SaaS dashboard, escalates through 13 evidence-producing interactions, and puts the user on trial for crimes against interface stability.

**Live:** [avansh2006.github.io/VibeHack-26-IIT-ISM-Dhanbadh](https://avansh2006.github.io/VibeHack-26-IIT-ISM-Dhanbadh/)
**Video Link:** [https://youtu.be/-BLhu_TS2q4] (https://youtu.be/-BLhu_TS2q4)

## Experience

- One deterministic Zustand evidence trail across a 14-beat chaos journey
- Checkbox Hydra, an evasive button, CAPTCHA From Hell, legal loading, bail bureaucracy, Password Prison, and a fake regret update
- Full 3D React Three Fiber courtroom with speaker-directed cameras, TTS, real media reactions, a visible AI girlfriend witness, and interactive defenses
- Sequential, cancellable audio/video direction with mute, skip, reduced-motion, replay, mobile, and WebGL fallback support
- Downloadable SVG Digital Menace certificate and optional post-credits ending

## Run locally

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite.

## Verify

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
npm run test:courtroom-game
npm run test:browser-download
```

## Project documents

- `docs/PRD.md` — product requirements and acceptance criteria
- `docs/ARCHITECTURE.md` — state, event, animation, and integration architecture
- `docs/AGENT_TASKS.md` — exact ownership and three ready-to-paste implementation prompts
- `docs/SPRINT_PLAN.md` — six-hour schedule with checkpoints/fallbacks
- `docs/DEMO_CHECKLIST.md` — production and judging verification
- `AGENTS.md` — repository-wide rules for every coding agent

## Deployment

GitHub Pages deploys the production build through `.github/workflows/deploy-pages.yml`.

Cloudflare Pages is also supported and needs no environment variables for the MVP.

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install` (or `npm ci` after committing the lockfile)

The checked-in `wrangler.jsonc` also declares `dist` as the Pages output directory. With an
authenticated Wrangler installation, deploy a preview with:

```powershell
npm run build
npx wrangler pages deploy dist --project-name clickpocalypse --branch avansh
```
