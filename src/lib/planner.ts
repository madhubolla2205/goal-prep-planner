import { addDays, daysBetween, weekday, type ISODate } from './dates';
import { strategyProfile, type StrategyProfile } from './strategy';
import type { BlockKind, DayPlan, Goal, LogEntry, PlannedBlock, Skill } from './types';

/** Plans are built in 15-minute slots so blocks stay readable. */
export const SLOT_MINUTES = 15;

/**
 * Rough share of all study time that goes to new material once revision,
 * spaced review and mocks are set aside. Used to size estimates up front.
 */
export const LEARNING_SHARE = 0.7;

/** Entries logged before block kinds were recorded count as study, or as a mock when they have no skill. */
export function entryKind(e: LogEntry): BlockKind {
  return e.kind ?? (e.skillId === null ? 'mock' : 'learn');
}

export function minutesLogged(goal: Goal, skillId: string | null, before?: ISODate): number {
  return goal.log
    .filter((e) => e.skillId === skillId && (before === undefined || e.date < before))
    .reduce((sum, e) => sum + e.minutes, 0);
}

/** Minutes spent on a skill's new material; review and revision time is extra to the estimate. */
export function minutesLearned(goal: Goal, skillId: string, before?: ISODate): number {
  return goal.log
    .filter((e) => e.skillId === skillId && entryKind(e) === 'learn' && (before === undefined || e.date < before))
    .reduce((sum, e) => sum + e.minutes, 0);
}

export function minutesOnDay(goal: Goal, date: ISODate): number {
  return goal.log.filter((e) => e.date === date).reduce((sum, e) => sum + e.minutes, 0);
}

export function remainingMinutes(goal: Goal, skill: Skill, before?: ISODate): number {
  return Math.max(0, skill.estimatedHours * 60 - minutesLearned(goal, skill.id, before));
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

export interface Schedule {
  profile: StrategyProfile;
  /** First day of the revision phase, or null when the goal is too short for one. */
  revisionStart: ISODate | null;
  mockDates: Set<ISODate>;
  /** The study day after each mock, kept for going through its mistakes. */
  analysisDates: Set<ISODate>;
  /** The last study day, kept light, or null for very short goals. */
  taperDay: ISODate | null;
}

/**
 * Fixes the shape of the whole goal from its start date: when revision
 * starts and which days hold mocks. Anchoring to the start date keeps these
 * dates put while the daily plan is rebuilt around them.
 */
export function schedule(goal: Goal): Schedule {
  const days = studyDays(goal, goal.startDate);
  const profile = strategyProfile(goal, days.length);
  const empty = { profile, revisionStart: null, mockDates: new Set<ISODate>(), analysisDates: new Set<ISODate>(), taperDay: null };
  if (days.length < 5) return empty;

  const reviseCount = Math.max(1, Math.round(days.length * profile.revisionShare));
  const learnCount = days.length - reviseCount;
  const regularStart = Math.round(learnCount * profile.mockStart);
  const taper = days.length >= 7;
  const lastMock = taper ? days.length - 3 : days.length - 2;

  const candidates = new Set<number>();
  if (profile.diagnostic) candidates.add(0);
  if (profile.checkpointEvery) {
    for (let i = profile.checkpointEvery; i < regularStart; i += profile.checkpointEvery) candidates.add(i);
  }
  for (let i = regularStart; i < learnCount; i += profile.mockEvery) candidates.add(i);
  for (let i = learnCount; i < days.length; i += profile.revisionMockEvery) candidates.add(i);

  const mockDates = new Set<ISODate>();
  const analysisDates = new Set<ISODate>();
  let previous = -Infinity;
  for (const i of [...candidates].sort((a, b) => a - b)) {
    // Every mock needs the next study day free for its analysis.
    if (i > lastMock || i - previous < 2) continue;
    mockDates.add(days[i]);
    analysisDates.add(days[i + 1]);
    previous = i;
  }
  return {
    profile,
    revisionStart: days[learnCount],
    mockDates,
    analysisDates,
    taperDay: taper ? days[days.length - 1] : null,
  };
}

/**
 * Urgency of a skill: important, low-confidence skills with lots of work left
 * come first. Falls as the skill's remaining work is planned.
 */
function priority(skill: Skill, remaining: number): number {
  const total = Math.max(1, skill.estimatedHours * 60);
  return weakness(skill) * (remaining / total);
}

/** How much a skill needs work: its weight times the gap in confidence. */
function weakness(skill: Skill): number {
  return skill.weight * (1.5 - skill.confidence / 100);
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

/** Slots taken by a mock or its analysis on this day, if it is one of those days. */
function testBlock(sched: Schedule, date: ISODate, slots: number): PlannedBlock | null {
  const { mockMinutes, analysisMinutes } = sched.profile;
  const minutes = sched.mockDates.has(date) ? mockMinutes : sched.analysisDates.has(date) ? analysisMinutes : 0;
  if (minutes === 0 || slots === 0) return null;
  const n = Math.min(slots, Math.ceil(minutes / SLOT_MINUTES));
  return { skillId: null, minutes: n * SLOT_MINUTES, kind: sched.mockDates.has(date) ? 'mock' : 'analysis' };
}

/**
 * Revision days: practice on the weakest skills, rotating so each gets its
 * turn, around any mock or analysis. The final day is half length and only
 * touches the weakest skills.
 */
function revisionDay(goal: Goal, sched: Schedule, date: ISODate, dayIndex: number): PlannedBlock[] {
  let slots = Math.floor(goal.dailyMinutes / SLOT_MINUTES);
  if (slots === 0 || goal.skills.length === 0) return [];
  const taper = date === sched.taperDay;
  if (taper) slots = Math.max(1, Math.floor(slots / 2));
  const test = testBlock(sched, date, slots);
  if (test) slots -= test.minutes / SLOT_MINUTES;
  const blocks: PlannedBlock[] = [];

  const ranked = [...goal.skills].sort((a, b) => weakness(b) - weakness(a) || a.name.localeCompare(b.name));
  const perDay = Math.min(maxSkillsPerDay(goal.dailyMinutes), ranked.length);
  const offset = taper ? 0 : dayIndex * perDay;
  const picked = Array.from({ length: perDay }, (_, i) => ranked[(offset + i) % ranked.length]);
  for (let i = 0; i < slots; i++) {
    blocks.push({ skillId: picked[i % picked.length].id, minutes: SLOT_MINUTES, kind: 'revise' });
  }
  return [...(test ? [test] : []), ...mergeBlocks(blocks)];
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
  exclude: Set<string> = new Set(),
): PlannedBlock[] {
  const candidates = goal.skills
    .filter((s) => (remaining.get(s.id) ?? 0) > 0 && !exclude.has(s.id))
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

/** Spaced-review state of one skill: when it was last seen and how many reviews it has had since. */
interface ReviewState {
  last: number;
  stage: number;
}

/** Skills due for a spaced review, most overdue first, then the weakest. */
function dueForReview(goal: Goal, reviews: Map<string, ReviewState>, intervals: number[], dayIndex: number): Skill[] {
  return goal.skills
    .flatMap((skill) => {
      const r = reviews.get(skill.id);
      if (!r) return [];
      const gap = intervals[Math.min(r.stage, intervals.length - 1)];
      const overdue = (dayIndex - r.last) / gap;
      return overdue >= 1 ? [{ skill, overdue }] : [];
    })
    .sort((a, b) => b.overdue - a.overdue || weakness(b.skill) - weakness(a.skill))
    .map((d) => d.skill);
}

/** Spaced review gets a 15-minute slot on days of an hour or more, two from three hours. */
function reviewSlots(slots: number): number {
  if (slots >= 12) return 2;
  return slots >= 4 ? 1 : 0;
}

/**
 * Builds the day-by-day plan from `today` to the target date.
 *
 * The plan is recomputed from what has actually been logged before today, so
 * missed or extra study automatically reshapes every later day. Time logged
 * today does not change today's plan, which keeps the daily checklist stable.
 */
export function buildPlan(goal: Goal, today: ISODate): DayPlan[] {
  const sched = schedule(goal);
  const days = studyDays(goal, today);
  const remaining = new Map(goal.skills.map((s) => [s.id, remainingMinutes(goal, s, today)]));
  const slotsPerDay = Math.floor(goal.dailyMinutes / SLOT_MINUTES);
  const limit = maxSkillsPerDay(goal.dailyMinutes);
  const intervals = sched.profile.reviewIntervals;
  const plan: DayPlan[] = [];
  let reviseIndex = 0;

  const lastPlanned = new Map<string, number>();
  // Skills already studied enter spaced review from their last session.
  const reviews = new Map<string, ReviewState>();
  for (const e of goal.log) {
    if (e.skillId === null || e.date >= today || entryKind(e) !== 'learn') continue;
    const last = -daysBetween(e.date, today);
    if (last > (reviews.get(e.skillId)?.last ?? -Infinity)) reviews.set(e.skillId, { last, stage: 0 });
  }

  days.forEach((date, dayIndex) => {
    if (sched.revisionStart !== null && date >= sched.revisionStart) {
      plan.push({ date, phase: 'revise', blocks: revisionDay(goal, sched, date, reviseIndex++) });
      return;
    }
    let slots = slotsPerDay;
    const test = testBlock(sched, date, slots);
    if (test) slots -= test.minutes / SLOT_MINUTES;

    let due = dueForReview(goal, reviews, intervals, dayIndex).slice(0, Math.min(reviewSlots(slots), slots - 1));
    let learn = planLearnDay(goal, remaining, lastPlanned, dayIndex, slots - due.length, limit, new Set(due.map((s) => s.id)));
    if (learn.length === 0 && due.some((s) => (remaining.get(s.id) ?? 0) > 0)) {
      // The only skills left to learn were due for review: study them instead.
      due = [];
      learn = planLearnDay(goal, remaining, lastPlanned, dayIndex, slots, limit);
    }
    if (learn.length === 0 && [...remaining.values()].every((m) => m <= 0)) {
      // Everything is covered early: use the spare day for revision.
      plan.push({ date, phase: 'revise', blocks: revisionDay(goal, sched, date, reviseIndex++) });
      return;
    }

    // A study session counts as seeing the skill again, without moving it to a longer gap.
    for (const b of learn) reviews.set(b.skillId!, { last: dayIndex, stage: reviews.get(b.skillId!)?.stage ?? 0 });
    for (const s of due) {
      const r = reviews.get(s.id)!;
      reviews.set(s.id, { last: dayIndex, stage: r.stage + 1 });
    }
    const blocks: PlannedBlock[] = [
      ...(test ? [test] : []),
      ...learn,
      ...due.map((s): PlannedBlock => ({ skillId: s.id, minutes: SLOT_MINUTES, kind: 'review' })),
    ];
    plan.push({ date, phase: 'learn', blocks });
  });
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
  const { revisionStart } = schedule(goal);
  const learnDaysLeft = days.filter((d) => revisionStart === null || d < revisionStart).length;
  if (remaining === 0) return { remainingMinutes: 0, learnDaysLeft, requiredDailyMinutes: 0, status: 'done' };
  if (days.length === 0) {
    return { remainingMinutes: remaining, learnDaysLeft: 0, requiredDailyMinutes: Infinity, status: 'overdue' };
  }
  const required = Math.ceil(remaining / Math.max(1, learnDaysLeft));
  // Spaced review and mocks take part of each learning day.
  const ratio = required / Math.max(1, goal.dailyMinutes * 0.85);
  const status = ratio <= 0.9 ? 'on-track' : ratio <= 1.1 ? 'tight' : 'behind';
  return { remainingMinutes: remaining, learnDaysLeft, requiredDailyMinutes: required, status };
}

/**
 * Readiness of one skill, 0 to 100: mostly time put in against the estimate,
 * tempered by how confident the learner says they feel.
 */
export function skillReadiness(goal: Goal, skill: Skill): number {
  const target = skill.estimatedHours * 60;
  const coverage = target === 0 ? 1 : Math.min(1, minutesLearned(goal, skill.id) / target);
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
