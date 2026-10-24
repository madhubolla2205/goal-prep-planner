import { describe, expect, it } from 'vitest';
import { backupFileName, makeBackup, mergeBackup, parseBackup } from './backup';
import type { AppState } from './storage';
import type { Goal } from './types';

function goal(id: string, overrides: Partial<Goal> = {}): Goal {
  return {
    id, name: `Goal ${id}`, type: 'exam', startDate: '2026-10-01', targetDate: '2026-12-01',
    dailyMinutes: 120, restDays: [0], skills: [{ id: 's', name: 'Maths', weight: 4, estimatedHours: 20, confidence: 30 }],
    log: [{ id: 'l', date: '2026-10-02', skillId: 's', minutes: 45 }], ...overrides,
  };
}

const state = (goals: Goal[], activeGoalId = goals[0]?.id ?? null): AppState => ({ goals, activeGoalId });
const roundTrip = (s: AppState) => parseBackup(JSON.stringify(makeBackup(s)));

describe('backups', () => {
  it('restores exactly what was saved', () => {
    const s = state([goal('a'), goal('b', { notes: [{ id: 'n', text: 'Pivot', skillId: null, createdAt: '2026-10-03' }] })], 'b');
    expect(roundTrip(s)).toEqual(s);
  });

  it('names the file after the day', () => {
    expect(backupFileName('2026-10-24')).toBe('goal-prep-backup-2026-10-24.json');
  });

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('not json')).toThrow(/isn't a Goal Prep Planner backup/);
    expect(() => parseBackup('{"goals": []}')).toThrow(/isn't a Goal Prep Planner backup/);
    expect(() => parseBackup('null')).toThrow(/isn't a Goal Prep Planner backup/);
  });

  it('rejects damaged goals and backups from newer versions', () => {
    const b = makeBackup(state([goal('a')]));
    expect(() => parseBackup(JSON.stringify({ ...b, goals: [{ id: 'x' }] }))).toThrow(/damaged/);
    expect(() => parseBackup(JSON.stringify({ ...b, version: 99 }))).toThrow(/newer version/);
  });

  it('falls back to the first goal when the active one is missing', () => {
    const b = { ...makeBackup(state([goal('a'), goal('b')])), activeGoalId: 'gone' };
    expect(parseBackup(JSON.stringify(b)).activeGoalId).toBe('a');
  });
});

describe('mergeBackup', () => {
  it('fills an empty device', () => {
    const incoming = state([goal('a')]);
    expect(mergeBackup(state([]), incoming)).toEqual(incoming);
  });

  it('keeps other goals and replaces the ones in the backup', () => {
    const here = state([goal('a', { name: 'Old copy' }), goal('c')], 'c');
    const merged = mergeBackup(here, state([goal('a', { name: 'New copy' }), goal('b')], 'b'));
    expect(merged.goals.map((g) => [g.id, g.name])).toEqual([['c', 'Goal c'], ['a', 'New copy'], ['b', 'Goal b']]);
    expect(merged.activeGoalId).toBe('b');
  });

  it('changes nothing when the same backup is restored twice', () => {
    const incoming = state([goal('a'), goal('b')]);
    const once = mergeBackup(state([goal('c')]), incoming);
    expect(mergeBackup(once, incoming)).toEqual(once);
  });
});
