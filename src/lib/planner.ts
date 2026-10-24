import { addDays, daysBetween, weekday, type ISODate } from './dates';
import type { DayPlan, Goal, PlannedBlock, Skill } from './types';

/** Plans are built in 15-minute slots so blocks stay readable. */
export const SLOT_MINUTES = 15;

/** Share of the remaining study days kept for revision and mock tests. */
const REVISION_SHARE = 0.15;

export function minutesLogged(goal: Goal, skillId: string | null, before?: ISODate): number {
  return goal.log
    .filter((e) => e.skillId === skillId && (before === undefined || e.date < before))
    .reduce((sum, e) => sum + e.minutes, 0);
}

export function minutesOnDay(goal: Goal, date: ISODate): number {
  return goal.log.filter((e) => e.date === date).reduce((sum, e) => sum + e.minutes, 0);
}

export function remainingMinutes(goal: Goal, skill: Skill, before?: ISODate): number {
  return Math.max(0, skill.estimatedHours * 60 - minutesLogged(goal, skill.id, before));
}

/** Days from `from` to the target date (inclusive) that are not rest days. */
export function studyDays(goal: Goal, from: ISODate): ISODate[] {
  const days: ISODate[] = [];
  const total = daysBetween(from, goal.targetDate);
  for (let i = 0; i <= total; i++) {
    const d = addDays(from, i);
    if (!goal.restDays.includes(weekday(d))) days.push(d);
  }
  return days;
}

/** Splits study days into a learning phase followed by a revision phase. */
function splitPhases(days: ISODate[]): { learn: ISODate[]; revise: ISODate[] } {
  if (days.length < 5) return { learn: days, revise: [] };
  const reviseCount = Math.max(1, Math.round(days.length * REVISION_SHARE));
  return { learn: days.slice(0, -reviseCount), revise: days.slice(-reviseCount) };
}

/**
 * Urgency of a skill: important, low-confidence skills with lots of work left
 * come first. Falls as the skill's remaining work is planned.
 */
function priority(skill: Skill, remaining: number): number {
  const total = Math.max(1, skill.estimatedHours * 60);
  const confidenceGap = 1.5 - skill.confidence / 100;
  return skill.weight * confidenceGap * (remaining / total);
}

function maxSkillsPerDay(dailyMinutes: number): number {
  if (dailyMinutes <= 60) return 1;
  if (dailyMinutes <= 150) return 2;
  return 3;
}

function mergeBlocks(blocks: PlannedBlock[]): PlannedBlock[] {
  const merged: PlannedBlock[] = [];
  for (const b of blocks) {
    const same = merged.find((m) => m.skillId === b.skillId && m.kind === b.kind);
    if (same) same.minutes += b.minutes;
    else merged.push({ ...b });
  }
  return merged.sort((a, b) => b.minutes - a.minutes);
}

/** Revision days: one mock test slot plus revision spread by skill weight. */
function revisionDay(goal: Goal, dayIndex: number): PlannedBlock[] {
  const slots = Math.floor(goal.dailyMinutes / SLOT_MINUTES);
  if (slots === 0 || goal.skills.length === 0) return [];
  const mockSlots = Math.max(1, Math.round(slots * 0.5));
  const blocks: PlannedBlock[] = [{ skillId: null, minutes: mockSlots * SLOT_MINUTES, kind: 'mock' }];
  const reviseSlots = slots - mockSlots;
  if (reviseSlots === 0) return blocks;

  // Rotate through skills, heaviest first, so each gets revised in turn.
  const ranked = [...goal.skills].sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));
  const perDay = Math.min(maxSkillsPerDay(goal.dailyMinutes), ranked.length);
  const picked = Array.from({ length: perDay }, (_, i) => ranked[(dayIndex * perDay + i) % ranked.length]);
  for (let i = 0; i < reviseSlots; i++) {
    blocks.push({ skillId: picked[i % picked.length].id, minutes: SLOT_MINUTES, kind: 'revise' });
  }
  return mergeBlocks(blocks);
}

/** Skills left untouched for a few days get a boost so every skill keeps rotating in. */
function rotationBoost(lastPlanned: Map<string, number>, skillId: string, dayIndex: number): number {
  const last = lastPlanned.get(skillId);
  const gap = last === undefined ? 7 : Math.min(7, dayIndex - last);
  return 1 + 0.25 * gap;
}

/**
 * Picks the day's skills, then shares the day's slots between them in
 * proportion to urgency. Mutates `remaining` and `lastPlanned`.
 */
function planLearnDay(
  goal: Goal,
  remaining: Map<string, number>,
  lastPlanned: Map<string, number>,
  dayIndex: number,
  slots: number,
  limit: number,
): PlannedBlock[] {
  const candidates = goal.skills
    .filter((s) => (remaining.get(s.id) ?? 0) > 0)
    .map((s) => {
      const urgency = priority(s, remaining.get(s.id) ?? 0);
      return { skill: s, urgency, score: urgency * rotationBoost(lastPlanned, s.id, dayIndex) };
    })
    .sort((a, b) => b.score - a.score);
  const picked = candidates.slice(0, Math.min(limit, slots));
  const totalUrgency = picked.reduce((sum, c) => sum + c.urgency, 0);

  const allocation = new Map<string, number>();
  let free = slots;
  for (const c of picked) {
    const cap = Math.ceil((remaining.get(c.skill.id) ?? 0) / SLOT_MINUTES);
    const share = Math.max(1, Math.round((slots * c.urgency) / totalUrgency));
    const n = Math.min(share, cap, free);
    allocation.set(c.skill.id, n);
    free -= n;
  }
  // Hand out slots left by rounding or capped skills, most urgent first.
  for (const c of [...picked, ...candidates.slice(picked.length)]) {
    if (free === 0) break;
    const cap = Math.ceil((remaining.get(c.skill.id) ?? 0) / SLOT_MINUTES);
    const have = allocation.get(c.skill.id) ?? 0;
    if (!allocation.has(c.skill.id) && allocation.size >= limit) continue;
    const extra = Math.min(cap - have, free);
    if (extra > 0) {
      allocation.set(c.skill.id, have + extra);
      free -= extra;
    }
  }

  const blocks: PlannedBlock[] = [];
  for (const [skillId, n] of allocation) {
    if (n === 0) continue;
    remaining.set(skillId, (remaining.get(skillId) ?? 0) - n * SLOT_MINUTES);
    lastPlanned.set(skillId, dayIndex);
    blocks.push({ skillId, minutes: n * SLOT_MINUTES, kind: 'learn' });
  }
  return blocks.sort((a, b) => b.minutes - a.minutes);
}

/**
 * Builds the day-by-day plan from `today` to the target date.
 *
 * The plan is recomputed from what has actually been logged before today, so
 * missed or extra study automatically reshapes every later day. Time logged
 * today does not change today's plan, which keeps the daily checklist stable.
 */
export function buildPlan(goal: Goal, today: ISODate): DayPlan[] {
  const days = studyDays(goal, today);
  const { learn, revise } = splitPhases(days);
  const remaining = new Map(goal.skills.map((s) => [s.id, remainingMinutes(goal, s, today)]));
  const slotsPerDay = Math.floor(goal.dailyMinutes / SLOT_MINUTES);
  const limit = maxSkillsPerDay(goal.dailyMinutes);
  const plan: DayPlan[] = [];
  let reviseIndex = 0;

  const lastPlanned = new Map<string, number>();

  learn.forEach((date, dayIndex) => {
    const blocks = planLearnDay(goal, remaining, lastPlanned, dayIndex, slotsPerDay, limit);
    if (blocks.length === 0) {
      // Everything is covered early: use the spare day for revision.
      plan.push({ date, phase: 'revise', blocks: revisionDay(goal, reviseIndex++) });
    } else {
      plan.push({ date, phase: 'learn', blocks });
    }
  });
  for (const date of revise) {
    plan.push({ date, phase: 'revise', blocks: revisionDay(goal, reviseIndex++) });
  }
  return plan;
}

export interface Pace {
  /** Study minutes still needed across all skills. */
  remainingMinutes: number;
  /** Days left for learning new material (excludes the revision phase). */
  learnDaysLeft: number;
  /** Minutes per day needed to finish learning before revision starts. */
  requiredDailyMinutes: number;
  status: 'on-track' | 'tight' | 'behind' | 'done' | 'overdue';
}

export function pace(goal: Goal, today: ISODate): Pace {
  const remaining = goal.skills.reduce((sum, s) => sum + remainingMinutes(goal, s), 0);
  const days = studyDays(goal, today);
  const learnDaysLeft = splitPhases(days).learn.length;
  if (remaining === 0) return { remainingMinutes: 0, learnDaysLeft, requiredDailyMinutes: 0, status: 'done' };
  if (days.length === 0) {
    return { remainingMinutes: remaining, learnDaysLeft: 0, requiredDailyMinutes: Infinity, status: 'overdue' };
  }
  const required = Math.ceil(remaining / Math.max(1, learnDaysLeft));
  const ratio = required / Math.max(1, goal.dailyMinutes);
  const status = ratio <= 0.9 ? 'on-track' : ratio <= 1.1 ? 'tight' : 'behind';
  return { remainingMinutes: remaining, learnDaysLeft, requiredDailyMinutes: required, status };
}

/**
 * Readiness of one skill, 0 to 100: mostly time put in against the estimate,
 * tempered by how confident the learner says they feel.
 */
export function skillReadiness(goal: Goal, skill: Skill): number {
  const target = skill.estimatedHours * 60;
  const coverage = target === 0 ? 1 : Math.min(1, minutesLogged(goal, skill.id) / target);
  return Math.round(100 * (0.7 * coverage + 0.3 * (skill.confidence / 100)));
}

export function overallReadiness(goal: Goal): number {
  const totalWeight = goal.skills.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = goal.skills.reduce((sum, s) => sum + s.weight * skillReadiness(goal, s), 0);
  return Math.round(weighted / totalWeight);
}

/**
 * Consecutive study days ending today (or yesterday, if nothing is logged yet
 * today). Rest days neither count nor break the streak.
 */
export function streak(goal: Goal, today: ISODate): number {
  const studied = new Set(goal.log.filter((e) => e.minutes > 0).map((e) => e.date));
  let day = studied.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (day >= goal.startDate) {
    if (studied.has(day)) count++;
    else if (!goal.restDays.includes(weekday(day))) break;
    day = addDays(day, -1);
  }
  return count;
}

/** Minutes logged on each of the last `n` days, oldest first. */
export function recentActivity(goal: Goal, today: ISODate, n: number): { date: ISODate; minutes: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(today, i - n + 1);
    return { date, minutes: minutesOnDay(goal, date) };
  });
}
