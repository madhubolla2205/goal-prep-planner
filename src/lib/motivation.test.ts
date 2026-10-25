import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { finishesWeek, missedStudyDays, reminderLine, roleModelFor } from './motivation';
import type { Goal, LogEntry } from './types';

const TODAY = '2026-11-02'; // a Monday

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g',
    name: 'Test goal',
    type: 'interview',
    startDate: addDays(TODAY, -14),
    targetDate: addDays(TODAY, 30),
    dailyMinutes: 60,
    restDays: [0],
    skills: [{ id: 'a', name: 'Algorithms', weight: 5, estimatedHours: 20, confidence: 20 }],
    log: [],
    ...overrides,
  };
}

const studied = (...offsets: number[]): LogEntry[] =>
  offsets.map((n, i) => ({ id: String(i), date: addDays(TODAY, n), skillId: 'a', minutes: 30 }));

const model = (name: string, quote = '') => ({ id: name, name, quote });

describe('roleModelFor', () => {
  it('is null without role models', () => {
    expect(roleModelFor(goal(), TODAY)).toBeNull();
  });

  it('takes turns, one a day', () => {
    const g = goal({ startDate: TODAY, roleModels: [model('A'), model('B'), model('C')] });
    expect([0, 1, 2, 3].map((n) => roleModelFor(g, addDays(TODAY, n))?.name)).toEqual(['A', 'B', 'C', 'A']);
  });
});

describe('missedStudyDays', () => {
  it('counts study days with nothing logged, skipping rest days', () => {
    // Sunday (-1) is a rest day; Saturday (-2) and Friday (-3) are missed; Thursday studied.
    expect(missedStudyDays(goal({ log: studied(-4) }), TODAY)).toBe(2);
  });

  it('is zero after studying yesterday', () => {
    expect(missedStudyDays(goal({ restDays: [], log: studied(-1) }), TODAY)).toBe(0);
  });

  it('stops at the start of the plan', () => {
    expect(missedStudyDays(goal({ startDate: TODAY }), TODAY)).toBe(0);
  });
});

describe('finishesWeek', () => {
  const sunday = addDays(TODAY, 6);

  it('is true when every study day of the week has time and none is left', () => {
    // Monday to Saturday studied, Sunday off; checked on Saturday.
    const g = goal({ log: studied(0, 1, 2, 3, 4, 5) });
    expect(finishesWeek(g, addDays(TODAY, 5))).toBe(true);
  });

  it('is false with a study day still to come', () => {
    const g = goal({ restDays: [], log: studied(0, 1, 2, 3, 4, 5) });
    expect(finishesWeek(g, addDays(TODAY, 5))).toBe(false);
    expect(finishesWeek({ ...g, log: studied(0, 1, 2, 3, 4, 5, 6) }, sunday)).toBe(true);
  });

  it('is false with a missed day', () => {
    expect(finishesWeek(goal({ log: studied(0, 1, 3, 4, 5) }), addDays(TODAY, 5))).toBe(false);
  });
});

describe('reminderLine', () => {
  it('puts the quote after the name and shortens long ones', () => {
    expect(reminderLine(model('Sundar', 'Keep going'), 'Sundar')).toBe('Sundar: “Keep going”');
    const long = reminderLine(model('X', 'a'.repeat(100)), 'X');
    expect(long.length).toBeLessThan(80);
    expect(long.endsWith('…”')).toBe(true);
  });

  it('is just the name without a quote', () => {
    expect(reminderLine(model('Sundar'), 'Sundar')).toBe('Sundar');
  });
});
