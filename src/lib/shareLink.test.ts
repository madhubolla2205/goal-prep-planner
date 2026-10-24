import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { decodePlan, encodePlan, goalFromOffer, planCodeFromHash, shareUrl, starterIdFromHash } from './shareLink';
import type { Goal } from './types';

const TODAY = '2026-11-02';

const goal: Goal = {
  id: 'g', name: 'GATE CSE — 2027', type: 'exam', startDate: TODAY, targetDate: addDays(TODAY, 90),
  dailyMinutes: 180, restDays: [0], theme: 'engineering',
  skills: [
    { id: 'a', name: 'Algorithms', weight: 5, estimatedHours: 45, confidence: 80 },
    { id: 'b', name: 'गणित', weight: 4, estimatedHours: 30, confidence: 10 },
  ],
  log: [{ id: 'l', date: TODAY, skillId: 'a', minutes: 60 }],
};

describe('shared plan links', () => {
  it('round-trips the plan, including non-English names', () => {
    const offer = decodePlan(encodePlan(goal), TODAY)!;
    expect(offer).toMatchObject({ from: 'shared', name: goal.name, type: 'exam', targetDate: goal.targetDate, dailyMinutes: 180, restDays: [0], theme: 'engineering' });
    expect(offer.skills).toEqual([
      { name: 'Algorithms', weight: 5, estimatedHours: 45 },
      { name: 'गणित', weight: 4, estimatedHours: 30 },
    ]);
  });

  it('never carries progress or confidence', () => {
    const json = atob(encodePlan(goal).replace(/-/g, '+').replace(/_/g, '/'));
    expect(json).not.toContain('confidence');
    expect(json).not.toContain('"log"');
  });

  it("moves a passed date to the same length of preparation from today", () => {
    const later = addDays(TODAY, 200);
    expect(decodePlan(encodePlan(goal), later)!.targetDate).toBe(addDays(later, 90));
  });

  it('rejects junk and clamps out-of-range values', () => {
    expect(decodePlan('not-base64!', TODAY)).toBeNull();
    expect(decodePlan(btoa('{"v":1,"n":"x","s":[]}'), TODAY)).toBeNull();
    const hostile = btoa(JSON.stringify({ v: 1, n: 'X', t: 'exam', d: 'soon', p: 99999, m: 100000, r: [0, 1, 2, 3, 4, 5, 6], s: [['A', 99, -5]] }));
    const offer = decodePlan(hostile, TODAY)!;
    expect(offer.dailyMinutes).toBe(960);
    expect(offer.targetDate).toBe(addDays(TODAY, 730));
    expect(offer.restDays).toEqual([0]);
    expect(offer.skills[0]).toEqual({ name: 'A', weight: 5, estimatedHours: 1 });
  });

  it('reads plan and starter codes from the address', () => {
    const url = shareUrl(goal, 'https://example.com/app/');
    expect(planCodeFromHash(new URL(url).hash)).toBe(encodePlan(goal));
    expect(starterIdFromHash('#starter=gate-cse')).toBe('gate-cse');
    expect(planCodeFromHash('#other')).toBeNull();
  });

  it('turns an offer into a fresh goal', () => {
    const g = goalFromOffer(decodePlan(encodePlan(goal), TODAY)!, TODAY);
    expect(g.id).not.toBe(goal.id);
    expect(g.log).toEqual([]);
    expect(g.startDate).toBe(TODAY);
    expect(g.theme).toBe('engineering');
  });
});
