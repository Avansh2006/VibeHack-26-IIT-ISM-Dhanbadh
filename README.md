# CLICKPOCALYPSE

> Every click has consequences. Yours are legally questionable.

CLICKPOCALYPSE is an interactive comedy experience for the VibeHack '26 IIT (ISM) Dhanbad challenge “Chaos Click.” It begins as a polished SaaS landing page, escalates through 13 evidence-producing interactions, and puts the user on trial for crimes against interface stability.

Step 0 provides the strict React/Vite/Tailwind foundation, deterministic Zustand state, implementation-ready product/architecture documents, and isolated ownership for three parallel agents. The complete experience is intentionally not implemented yet.

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
```

## Project documents

- `docs/PRD.md` — product requirements and acceptance criteria
- `docs/ARCHITECTURE.md` — state, event, animation, and integration architecture
- `docs/AGENT_TASKS.md` — exact ownership and three ready-to-paste implementation prompts
- `docs/SPRINT_PLAN.md` — six-hour schedule with checkpoints/fallbacks
- `docs/DEMO_CHECKLIST.md` — production and judging verification
- `AGENTS.md` — repository-wide rules for every coding agent

## Deployment

Cloudflare Pages needs no environment variables for the MVP.

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install` (or `npm ci` after committing the lockfile)

The checked-in `wrangler.jsonc` also declares `dist` as the Pages output directory. With an
authenticated Wrangler installation, deploy a preview with:

```powershell
npm run build
npx wrangler pages deploy dist --project-name clickpocalypse --branch avansh
```
