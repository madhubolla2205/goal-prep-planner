import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { markRevised, quickRevision, revisedOn, unmarkRevised } from './notes';
import { detectTheme } from './themes';
import type { Goal, Note } from './types';

const TODAY = '2026-11-02';

function note(id: string, overrides: Partial<Note> = {}): Note {
  return { id, text: `Point ${id}`, skillId: null, createdAt: addDays(TODAY, -10), ...overrides };
}

function goal(notes: Note[], overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g', name: 'Test goal', type: 'interview', startDate: TODAY, targetDate: addDays(TODAY, 30),
    dailyMinutes: 120, restDays: [], skills: [{ id: 'a', name: 'Algorithms', weight: 5, estimatedHours: 20, confidence: 20 }],
    log: [], notes, ...overrides,
  };
}

const ids = (ns: Note[]) => ns.map((n) => n.id);

describe('quickRevision', () => {
  it('shows nothing when there are no points', () => {
    expect(quickRevision(goal([]), TODAY, [])).toEqual([]);
    expect(quickRevision(goal([], { notes: undefined }), TODAY, [])).toEqual([]);
  });

  it('puts pinned points first, then points on today’s skills, then the least recently revised', () => {
    const notes = [
      note('recent', { revised: [addDays(TODAY, -1)] }),
      note('old', { revised: [addDays(TODAY, -6)] }),
      note('never'),
      note('skill', { skillId: 'a', revised: [addDays(TODAY, -1)] }),
      note('pinned', { pinned: true, revised: [addDays(TODAY, -1)] }),
    ];
    expect(ids(quickRevision(goal(notes), TODAY, ['a', null]))).toEqual(['pinned', 'skill', 'never', 'old', 'recent']);
  });

  it('limits the pick to the given size', () => {
    const notes = Array.from({ length: 8 }, (_, i) => note(String(i)));
    expect(quickRevision(goal(notes), TODAY, [], 3)).toHaveLength(3);
  });

  it('keeps today’s pick the same after points are revised today', () => {
    const notes = Array.from({ length: 7 }, (_, i) => note(String(i), { revised: [addDays(TODAY, -7 + i)] }));
    const before = quickRevision(goal(notes), TODAY, []);
    const revised = notes.map((n) => (ids(before).includes(n.id) ? markRevised(n, TODAY) : n));
    expect(ids(quickRevision(goal(revised), TODAY, []))).toEqual(ids(before));
    // The next day the points not yet seen come up first.
    const tomorrow = quickRevision(goal(revised), addDays(TODAY, 1), []);
    expect(ids(tomorrow).slice(0, 2)).toEqual(['5', '6']);
  });
});

describe('markRevised', () => {
  it('records a day once and can be undone', () => {
    const n = markRevised(markRevised(note('x'), TODAY), TODAY);
    expect(n.revised).toEqual([TODAY]);
    expect(revisedOn(n, TODAY)).toBe(true);
    expect(revisedOn(unmarkRevised(n, TODAY), TODAY)).toBe(false);
  });

  it('keeps only the last ten days', () => {
    let n = note('x');
    for (let i = 0; i < 15; i++) n = markRevised(n, addDays(TODAY, i));
    expect(n.revised).toHaveLength(10);
    expect(n.revised?.[9]).toBe(addDays(TODAY, 14));
  });
});

describe('detectTheme', () => {
  const g = (name: string, type: Goal['type'], skills: string[] = []) => ({
    name, type, skills: skills.map((s, i) => ({ id: String(i), name: s, weight: 3, estimatedHours: 5, confidence: 30 })),
  });

  it('picks the path from the goal', () => {
    expect(detectTheme(g('Amazon SDE interview', 'interview', ['Data structures & algorithms']))).toBe('code');
    expect(detectTheme(g('Swiggy analyst interview', 'interview', ['SQL']))).toBe('data');
    expect(detectTheme(g('GATE CSE 2027', 'exam', ['Algorithms']))).toBe('engineering');
    expect(detectTheme(g('CAT 2026', 'exam'))).toBe('aptitude');
    expect(detectTheme(g('UPSC prelims', 'exam'))).toBe('civil');
    expect(detectTheme(g('NEET UG', 'exam'))).toBe('medical');
  });

  it('falls back to the goal type', () => {
    expect(detectTheme(g('Final exams', 'exam'))).toBe('exam');
    expect(detectTheme(g('Product manager at Zomato', 'interview'))).toBe('interview');
  });
});
