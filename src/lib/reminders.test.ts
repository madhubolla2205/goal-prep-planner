import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { reminderTime, upcomingReminders } from './reminders';
import type { Goal } from './types';

const TODAY = '2026-11-02'; // a Monday

const goal = (id: string, overrides: Partial<Goal> = {}): Goal => ({
  id, name: id, type: 'exam', startDate: TODAY, targetDate: addDays(TODAY, 30), dailyMinutes: 60, restDays: [], log: [],
  skills: [{ id: 's', name: 'S', weight: 3, estimatedHours: 40, confidence: 30 }],
  ...overrides,
});

describe('upcomingReminders', () => {
  it('adds up every active plan per day', () => {
    const days = upcomingReminders([goal('a'), goal('b', { dailyMinutes: 30 }), goal('old', { targetDate: addDays(TODAY, -1) })], TODAY, 7);
    expect(days).toHaveLength(7);
    expect(days[0]).toMatchObject({ date: TODAY, minutes: 90 });
    expect(days[0].goals.map((g) => g.id)).toEqual(['a', 'b']);
  });

  it("leaves out rest days and today once today's plan is done", () => {
    const done = goal('a', { restDays: [2], log: [{ id: 'l', date: TODAY, skillId: 's', minutes: 60 }] });
    const dates = upcomingReminders([done], TODAY, 7).map((d) => d.date);
    expect(dates).not.toContain(TODAY);
    expect(dates).not.toContain(addDays(TODAY, 1)); // Tuesday off
    expect(dates).toHaveLength(5);
  });

  it('builds the local time of a reminder', () => {
    const at = reminderTime(TODAY, '07:30');
    expect([at.getFullYear(), at.getMonth(), at.getDate(), at.getHours(), at.getMinutes()]).toEqual([2026, 10, 2, 7, 30]);
  });
});
