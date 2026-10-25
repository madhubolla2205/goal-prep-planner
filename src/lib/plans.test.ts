import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { groupPlans, planSummary } from './plans';
import type { Goal } from './types';

const TODAY = '2026-11-02'; // a Monday

function goal(id: string, targetIn: number, overrides: Partial<Goal> = {}): Goal {
  return {
    id,
    name: `Goal ${id}`,
    type: 'exam',
    startDate: addDays(TODAY, -10),
    targetDate: addDays(TODAY, targetIn),
    dailyMinutes: 60,
    restDays: [],
    skills: [{ id: 's', name: 'Maths', weight: 3, estimatedHours: 10, confidence: 50 }],
    log: [],
    ...overrides,
  };
}

describe('groupPlans', () => {
  it('lists active plans soonest first and past plans most recent first', () => {
    const { active, past } = groupPlans([goal('far', 30), goal('old', -40), goal('soon', 3), goal('recent', -2), goal('now', 0)], TODAY);
    expect(active.map((p) => p.goal.id)).toEqual(['now', 'soon', 'far']);
    expect(past.map((p) => p.goal.id)).toEqual(['recent', 'old']);
  });
});

describe('planSummary', () => {
  it("reports today's planned and logged minutes", () => {
    const g = goal('a', 20, { log: [{ id: 'l', date: TODAY, skillId: 's', minutes: 15 }] });
    const s = planSummary(g, TODAY);
    expect(s.today.planned).toBe(60);
    expect(s.today.logged).toBe(15);
    expect(s.totalMinutes).toBe(15);
    expect(s.lastStudied).toBe(TODAY);
    expect(s.daysLeft).toBe(20);
  });

  it('plans nothing on a rest day', () => {
    expect(planSummary(goal('a', 20, { restDays: [1] }), TODAY).today.planned).toBe(0);
  });
});
