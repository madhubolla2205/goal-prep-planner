import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { googleCalendarUrl, icsDateTime, planToIcs } from './calendar';
import type { Goal } from './types';

const TODAY = '2026-11-02'; // a Monday

const goal: Goal = {
  id: 'g', name: 'CAT', type: 'exam', startDate: TODAY, targetDate: addDays(TODAY, 13),
  dailyMinutes: 60, restDays: [0], log: [],
  skills: [{ id: 'q', name: 'Quant, DI; LR', weight: 5, estimatedHours: 10, confidence: 30 }],
};

describe('planToIcs', () => {
  const ics = planToIcs(goal, TODAY, { time: '23:30', title: 'Study: CAT', describe: () => 'Quant, DI; LR' });
  const events = ics.split('BEGIN:VEVENT').length - 1;

  it('has one event per study day, skipping rest days', () => {
    expect(events).toBe(12);
    expect(ics).not.toContain('DTSTART:20261108T'); // a Sunday
  });

  it('runs past midnight into the next day', () => {
    expect(ics).toContain('DTSTART:20261102T233000');
    expect(ics).toContain('DTEND:20261103T003000');
  });

  it('escapes text and uses CRLF line endings', () => {
    expect(ics).toContain(String.raw`Quant\, DI\; LR`);
    expect(ics.split('\r\n').every((l) => l.length <= 75)).toBe(true);
  });
});

describe('googleCalendarUrl', () => {
  it('repeats on study days until the target date', () => {
    const url = new URL(googleCalendarUrl({ title: 'Study', details: '', from: TODAY, until: goal.targetDate, time: '7:05', minutes: 90, restDays: [0, 6] }));
    expect(url.searchParams.get('recur')).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=20261115T235959');
    expect(url.searchParams.get('dates')).toBe('20261102T070500/20261102T083500');
  });

  it('formats times with two digits', () => {
    expect(icsDateTime(TODAY, '7:5')).toBe('20261102T070500');
  });
});
