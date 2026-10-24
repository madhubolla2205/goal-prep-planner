import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { buildPlan, overallReadiness, pace, skillReadiness, streak, studyDays } from './planner';
import type { Goal } from './types';

const TODAY = '2026-11-02'; // a Monday

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g',
    name: 'Test goal',
    type: 'interview',
    startDate: TODAY,
    targetDate: addDays(TODAY, 29),
    dailyMinutes: 120,
    restDays: [],
    skills: [
      { id: 'a', name: 'Algorithms', weight: 5, estimatedHours: 20, confidence: 20 },
      { id: 'b', name: 'Behavioral', weight: 2, estimatedHours: 5, confidence: 60 },
      { id: 'c', name: 'Design', weight: 4, estimatedHours: 10, confidence: 30 },
    ],
    log: [],
    ...overrides,
  };
}

const total = (p: ReturnType<typeof buildPlan>, kind: string, id?: string) =>
  p.flatMap((d) => d.blocks).filter((b) => b.kind === kind && (id === undefined || b.skillId === id))
    .reduce((s, b) => s + b.minutes, 0);

describe('studyDays', () => {
  it('skips rest days', () => {
    const days = studyDays(goal({ restDays: [0, 6], targetDate: addDays(TODAY, 6) }), TODAY);
    expect(days).toHaveLength(5);
  });
});

describe('buildPlan', () => {
  it('covers one day per study day through the target date', () => {
    const plan = buildPlan(goal(), TODAY);
    expect(plan).toHaveLength(30);
    expect(plan[0].date).toBe(TODAY);
    expect(plan.at(-1)!.date).toBe(addDays(TODAY, 29));
  });

  it('never plans more than the daily budget', () => {
    for (const day of buildPlan(goal(), TODAY)) {
      expect(day.blocks.reduce((s, b) => s + b.minutes, 0)).toBeLessThanOrEqual(120);
    }
  });

  it('schedules all estimated work when there is time', () => {
    const plan = buildPlan(goal(), TODAY);
    expect(total(plan, 'learn', 'a')).toBe(20 * 60);
    expect(total(plan, 'learn', 'b')).toBe(5 * 60);
    expect(total(plan, 'learn', 'c')).toBe(10 * 60);
  });

  it('ends with a revision phase that includes mock tests', () => {
    const plan = buildPlan(goal(), TODAY);
    expect(plan.at(-1)!.phase).toBe('revise');
    expect(total(plan, 'mock')).toBeGreaterThan(0);
  });

  it('starts with the most urgent skill', () => {
    const first = buildPlan(goal(), TODAY)[0];
    expect(first.blocks[0].skillId).toBe('a');
  });

  it('limits how many skills share a day', () => {
    for (const day of buildPlan(goal({ dailyMinutes: 60 }), TODAY)) {
      if (day.phase === 'learn') expect(day.blocks).toHaveLength(1);
    }
  });

  it('re-plans from logged progress', () => {
    const done = goal({
      log: [{ id: '1', date: addDays(TODAY, -1), skillId: 'a', minutes: 20 * 60 }],
    });
    expect(total(buildPlan(done, TODAY), 'learn', 'a')).toBe(0);
  });

  it('ignores time logged today so the day stays stable', () => {
    const before = buildPlan(goal(), TODAY)[0];
    const after = buildPlan(goal({ log: [{ id: '1', date: TODAY, skillId: 'a', minutes: 60 }] }), TODAY)[0];
    expect(after).toEqual(before);
  });

  it('returns nothing after the target date', () => {
    expect(buildPlan(goal(), addDays(TODAY, 40))).toEqual([]);
  });
});

describe('pace', () => {
  it('is on track when the daily budget covers the work', () => {
    expect(pace(goal(), TODAY).status).toBe('on-track');
  });

  it('is behind when the work does not fit', () => {
    expect(pace(goal({ dailyMinutes: 30 }), TODAY).status).toBe('behind');
  });

  it('is done when every estimate is met', () => {
    const g = goal({ skills: [{ id: 'a', name: 'A', weight: 3, estimatedHours: 1, confidence: 50 }] });
    g.log.push({ id: '1', date: TODAY, skillId: 'a', minutes: 60 });
    expect(pace(g, TODAY).status).toBe('done');
  });
});

describe('readiness', () => {
  it('blends coverage and confidence', () => {
    const g = goal();
    expect(skillReadiness(g, g.skills[0])).toBe(6); // 0.3 * 20
    g.log.push({ id: '1', date: TODAY, skillId: 'a', minutes: 20 * 60 });
    expect(skillReadiness(g, g.skills[0])).toBe(76);
  });

  it('weights overall readiness by skill importance', () => {
    const g = goal();
    expect(overallReadiness(g)).toBeGreaterThan(0);
    expect(overallReadiness(g)).toBeLessThan(100);
  });
});

describe('streak', () => {
  it('counts consecutive days and skips rest days', () => {
    const g = goal({
      startDate: addDays(TODAY, -10),
      restDays: [0], // Sunday 2026-11-01
      log: [
        { id: '1', date: TODAY, skillId: 'a', minutes: 30 },
        { id: '2', date: addDays(TODAY, -2), skillId: 'a', minutes: 30 },
        { id: '3', date: addDays(TODAY, -3), skillId: 'a', minutes: 30 },
        { id: '4', date: addDays(TODAY, -5), skillId: 'a', minutes: 30 },
      ],
    });
    expect(streak(g, TODAY)).toBe(3);
  });

  it('does not break before today is logged', () => {
    const g = goal({ startDate: addDays(TODAY, -5), log: [{ id: '1', date: addDays(TODAY, -1), skillId: 'a', minutes: 30 }] });
    expect(streak(g, TODAY)).toBe(1);
  });
});

describe('variety', () => {
  it('mixes skills within the first week', () => {
    const week = buildPlan(goal(), TODAY).slice(0, 7);
    const touched = new Set(week.flatMap((d) => d.blocks.map((b) => b.skillId)));
    expect(touched.size).toBe(3);
  });
});
