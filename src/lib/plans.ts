import { daysBetween, type ISODate } from './dates';
import { buildPlan, minutesOnDay, overallReadiness, pace, streak, type Pace } from './planner';
import type { Goal } from './types';

// The numbers shown for each plan on the home page.

export interface PlanSummary {
  goal: Goal;
  /** Days until the target date; negative once it has passed. */
  daysLeft: number;
  /** Share of the plan's calendar already behind you, 0 to 1. */
  elapsed: number;
  readiness: number;
  streak: number;
  pace: Pace['status'];
  /** Minutes planned and logged today; planned is 0 on a rest day. */
  today: { planned: number; logged: number };
  /** Total minutes ever logged. */
  totalMinutes: number;
  /** The last day anything was logged, if ever. */
  lastStudied: ISODate | null;
}

export function planSummary(goal: Goal, today: ISODate): PlanSummary {
  const span = Math.max(1, daysBetween(goal.startDate, goal.targetDate));
  const day = buildPlan(goal, today)[0];
  const planned = day?.date === today ? day.blocks.reduce((s, b) => s + b.minutes, 0) : 0;
  const studied = goal.log.filter((e) => e.minutes > 0);
  return {
    goal,
    daysLeft: daysBetween(today, goal.targetDate),
    elapsed: Math.min(1, Math.max(0, daysBetween(goal.startDate, today) / span)),
    readiness: overallReadiness(goal),
    streak: streak(goal, today),
    pace: pace(goal, today).status,
    today: { planned, logged: minutesOnDay(goal, today) },
    totalMinutes: studied.reduce((s, e) => s + e.minutes, 0),
    lastStudied: studied.reduce<ISODate | null>((last, e) => (last === null || e.date > last ? e.date : last), null),
  };
}

/**
 * Splits plans into active ones (target date today or later), soonest first,
 * and past ones, most recently finished first.
 */
export function groupPlans(goals: Goal[], today: ISODate): { active: PlanSummary[]; past: PlanSummary[] } {
  const all = goals.map((g) => planSummary(g, today));
  return {
    active: all.filter((p) => p.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft),
    past: all.filter((p) => p.daysLeft < 0).sort((a, b) => b.daysLeft - a.daysLeft),
  };
}
