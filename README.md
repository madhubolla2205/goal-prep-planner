# Goal Prep Planner

[![Android app downloads](https://img.shields.io/github/downloads/madhubolla2205/goal-prep-planner/total?label=Android%20downloads)](https://github.com/madhubolla2205/goal-prep-planner/releases)

Plan and track preparation for a goal: an exam (GATE, CAT, …) or an interview at a target company. The app does planning and daily tracking only; it does not provide study content.

## What it does

- **Just ask.** Type what you're preparing for in one sentence, e.g. "Amazon SDE interview in 6 weeks, 2 hours a day, weekends off". The app works out the goal, date, daily hours, rest days and the skills to cover, and builds the plan. With an Anthropic API key, Claude breaks the goal down for that specific company or exam; without one, built-in rules handle common exams and roles. Estimates are scaled to fit the time you have. Prefer forms? "Set everything up yourself" still offers templates and every option.
- **Adjust.** Each goal is a list of skills with an importance (1–5), an estimated number of hours and your confidence (0–100%). All of it is editable.
- **Schedule.** A day-by-day plan from today to the target date, in 15-minute blocks. Important, low-confidence skills come first, skills rotate so none goes untouched for long, and the last ~15% of study days are reserved for revision and mock tests.
- **Adaptive.** The plan is rebuilt every day from what you actually logged, so missed or extra study reshapes every later day. Time logged today doesn't change today's checklist.
- **Daily tracking.** Today's tasks with "Mark done" and "+15 min", plus a form to log any other study time or a mock test, with undo.
- **Dashboard.** Overall readiness (weighted by importance), pace (minutes/day now needed vs. planned), streak (rest days don't break it), the last 7 days, a 14-day study chart against your daily target, and readiness per skill, weakest first.

- **Install and offline.** The app can be added to a phone's home screen or installed on a computer, and works without internet once opened.
- **Backup and restore.** "Your data" (under Adjust) saves every goal to a JSON file and restores it on any device, which is how plans move between devices without an account. A fresh device offers "Restore it" on the first screen.

Data is stored in the browser's localStorage. Once a goal exists, the app asks the browser to keep that data even when space runs low (`navigator.storage.persist`).

## Run it

```bash
npm install
npm run dev                                # app on http://localhost:5173
ANTHROPIC_API_KEY=sk-ant-... npm run server  # optional, in a second terminal: Claude-generated plans
npm test
```

Production: `npm run build`, then `ANTHROPIC_API_KEY=... npm start` serves the app and the API on port 8787 (`PORT` to change). Without a key the server still runs and the app uses its built-in rules. Each Claude-generated plan is one request to `claude-opus-5-5`.

GitHub Pages: every push to `main` builds the app and publishes it to https://madhubolla2205.github.io/goal-prep-planner/ (`.github/workflows/deploy-pages.yml`). The hosted copy has no server, so it always uses the built-in rules, and each visitor's plans stay in their own browser.

## Code map

- `src/lib/planner.ts`: scheduling engine, pace, readiness and streak (pure functions, tested in `planner.test.ts`)
- `src/lib/goalText.ts`: turns a sentence into a goal (date, hours, rest days, skills) with built-in rules, and validates AI responses
- `src/lib/aiPlan.ts`: calls `/api/plan` and falls back to the rules
- `server/`: the `/api/plan` endpoint (Anthropic SDK with structured outputs) and a static file server for production
- `src/lib/templates.ts`: starting skill lists per goal type
- `src/lib/types.ts`, `src/lib/dates.ts`, `src/lib/storage.ts`: model, date helpers, persistence
- `src/lib/backup.ts`: backup file format, validation and merging (tested in `backup.test.ts`)
- `src/lib/device.ts`, `pwa/sw.js`, `public/manifest.webmanifest`: install prompt, persistent storage and the offline service worker; `vite.config.ts` fills the worker with the build's file list
- `src/components/`: the "What are you preparing for?" screen, Today, Plan, Dashboard, Adjust and the manual goal form

## Usage numbers

Both counters are free. The badge at the top counts downloads of every APK on the Releases page (people who download but never install are counted too). Visitors to the site are counted by [GoatCounter](https://www.goatcounter.com/), which sets no cookies and stores no personal data. Visitor numbers are at https://goal-prep-planner.goatcounter.com (the site code is set in `.github/workflows/deploy-pages.yml`; a repository variable `GOATCOUNTER_CODE` overrides it). Local builds and the Android app are not counted.

## Next steps

Reminders, a nudge to back up, and mock-test score tracking.
