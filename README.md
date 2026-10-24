# Goal Prep Planner

Plan and track preparation for a goal: an exam (GATE, CAT, …) or an interview at a target company. The app does planning and daily tracking only; it does not provide study content.

## What it does

- **Goals.** Pick a template (software engineer interview, data/ML interview, GATE CSE, CAT) or start from scratch, then set the target date, daily study hours and rest days. The form tells you up front whether the estimated work fits your schedule.
- **Skills.** Each goal is a list of skills with an importance (1–5), an estimated number of hours and your confidence (0–100%). All of it is editable.
- **Schedule.** A day-by-day plan from today to the target date, in 15-minute blocks. Important, low-confidence skills come first, skills rotate so none goes untouched for long, and the last ~15% of study days are reserved for revision and mock tests.
- **Adaptive.** The plan is rebuilt every day from what you actually logged, so missed or extra study reshapes every later day. Time logged today doesn't change today's checklist.
- **Daily tracking.** Today's tasks with "Mark done" and "+15 min", plus a form to log any other study time or a mock test, with undo.
- **Dashboard.** Overall readiness (weighted by importance), pace (minutes/day now needed vs. planned), streak (rest days don't break it), the last 7 days, a 14-day study chart against your daily target, and readiness per skill, weakest first.

Data is stored in the browser's localStorage for now.

## Run it

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # planner engine tests
npm run build
```

## Code map

- `src/lib/planner.ts`: scheduling engine, pace, readiness and streak (pure functions, tested in `planner.test.ts`)
- `src/lib/templates.ts`: starting skill lists per goal type
- `src/lib/types.ts`, `src/lib/dates.ts`, `src/lib/storage.ts`: model, date helpers, persistence
- `src/components/`: Today, Plan, Dashboard, Skills and the goal form

## Next steps

Accounts and sync (Supabase), AI-assisted skill breakdown for a specific exam or company (Claude API), reminders, and mock-test score tracking.
