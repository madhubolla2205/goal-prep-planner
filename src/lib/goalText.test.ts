import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import {
  draftFromText, goalFromDraft, learningHours, parseDailyMinutes, parseGoalName,
  parseGoalType, parseRestDays, parseTargetDate, sanitizeDraft,
} from './goalText';

const TODAY = '2026-10-24';

describe('parseTargetDate', () => {
  it.each([
    ['Amazon SDE interview in 6 weeks', addDays(TODAY, 42)],
    ['GATE in 3 months', addDays(TODAY, 90)],
    ['exam in a month', addDays(TODAY, 30)],
    ['interview in ten days', addDays(TODAY, 10)],
    ['GATE on Feb 7', '2027-02-07'],
    ['CAT on 29th November', '2026-11-29'],
    ['by 2027-01-15', '2027-01-15'],
  ])('%s', (text, expected) => {
    expect(parseTargetDate(text, TODAY)).toBe(expected);
  });

  it('does not mistake hours per day for a deadline', () => {
    expect(parseTargetDate('2 hours a day', TODAY)).toBeNull();
  });
});

describe('parseDailyMinutes', () => {
  it.each([
    ['2 hours a day', 120],
    ['1.5 hrs daily', 90],
    ['90 min per day', 90],
    ['3h/day', 180],
    ['in 6 weeks', null],
  ])('%s', (text, expected) => {
    expect(parseDailyMinutes(text)).toBe(expected);
  });
});

describe('parseRestDays', () => {
  it('reads common phrasings', () => {
    expect(parseRestDays('weekends off')).toEqual([0, 6]);
    expect(parseRestDays('Sundays off')).toEqual([0]);
    expect(parseRestDays('study every day')).toEqual([]);
    expect(parseRestDays('GATE in 3 months')).toBeNull();
  });
});

describe('parseGoalType and name', () => {
  it('detects interviews and exams', () => {
    expect(parseGoalType('Google onsite interview')).toBe('interview');
    expect(parseGoalType('GATE CSE 2027')).toBe('exam');
  });

  it('keeps just the goal', () => {
    expect(parseGoalName('Amazon SDE interview in 6 weeks, 2 hours a day')).toBe('Amazon SDE interview');
    expect(parseGoalName("I'm preparing for GATE CSE by Feb 7")).toBe('GATE CSE');
    expect(parseGoalName('prepare for a data analyst interview at Swiggy, weekends off')).toBe('Data analyst interview at Swiggy');
  });
});

describe('draftFromText', () => {
  it('builds a full draft from one sentence', () => {
    const d = draftFromText('Amazon SDE interview in 6 weeks, 2 hours a day, weekends off', TODAY);
    expect(d).toMatchObject({ name: 'Amazon SDE interview', type: 'interview', targetDate: addDays(TODAY, 42), dailyMinutes: 120, restDays: [0, 6] });
    expect(d.skills[0].name).toBe('Data structures & algorithms');
  });

  it('falls back to defaults and generic skills', () => {
    const d = draftFromText('UPSC prelims', TODAY);
    expect(d.type).toBe('exam');
    expect(d.targetDate).toBe(addDays(TODAY, 60));
    expect(d.skills.map((s) => s.name)).toContain('Previous papers');
  });
});

describe('goalFromDraft', () => {
  it('scales estimates down to fit the time available', () => {
    const draft = draftFromText('Amazon SDE interview in 2 weeks, 1 hour a day', TODAY);
    const goal = goalFromDraft(draft, TODAY);
    const total = goal.skills.reduce((s, k) => s + k.estimatedHours, 0);
    const available = learningHours(draft.targetDate, draft.dailyMinutes, draft.restDays, TODAY);
    expect(total).toBeLessThanOrEqual(Math.ceil(available) + goal.skills.length);
  });
});

describe('sanitizeDraft', () => {
  it('clamps bad values and falls back to rules', () => {
    const d = sanitizeDraft(
      { name: '', type: 'job' as never, targetDate: '2020-01-01', dailyMinutes: 5000, restDays: [0, 1, 2, 3, 4, 5, 6], skills: [{ name: 'SQL', weight: 9, estimatedHours: -3 }] },
      'data analyst interview in 4 weeks',
      TODAY,
    );
    expect(d).toMatchObject({ name: 'Data analyst interview', type: 'interview', targetDate: addDays(TODAY, 28), dailyMinutes: 960, restDays: [0], source: 'ai' });
    expect(d.skills[0]).toEqual({ name: 'SQL', weight: 5, estimatedHours: 1, confidence: 30 });
  });
});
