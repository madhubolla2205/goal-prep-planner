import type { ISODate } from './dates';
import type { AppState } from './storage';
import type { Goal } from './types';

// A backup is a JSON file holding every goal on the device. It is the way to
// move a plan to another device, since nothing is stored on a server.

const KIND = 'goal-prep-planner-backup';
const VERSION = 1;

export interface Backup {
  kind: typeof KIND;
  version: number;
  exportedAt: string;
  goals: Goal[];
  activeGoalId: string | null;
}

export function makeBackup(state: AppState, now = new Date()): Backup {
  return { kind: KIND, version: VERSION, exportedAt: now.toISOString(), goals: state.goals, activeGoalId: state.activeGoalId };
}

export function backupFileName(today: ISODate): string {
  return `goal-prep-backup-${today}.json`;
}

const isDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

function isGoal(v: unknown): v is Goal {
  if (!v || typeof v !== 'object') return false;
  const g = v as Record<string, unknown>;
  return (
    typeof g.id === 'string' &&
    typeof g.name === 'string' &&
    (g.type === 'exam' || g.type === 'interview') &&
    isDate(g.startDate) &&
    isDate(g.targetDate) &&
    typeof g.dailyMinutes === 'number' &&
    Array.isArray(g.restDays) &&
    Array.isArray(g.skills) &&
    Array.isArray(g.log)
  );
}

/** Reads a backup file's text. Throws an Error with a message fit to show the person. */
export function parseBackup(text: string): AppState {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file isn't a Goal Prep Planner backup.");
  }
  const b = data as Partial<Backup> | null;
  if (!b || b.kind !== KIND || !Array.isArray(b.goals)) throw new Error("This file isn't a Goal Prep Planner backup.");
  if (typeof b.version !== 'number' || b.version > VERSION) {
    throw new Error('This backup comes from a newer version of the app. Reload the page and try again.');
  }
  if (!b.goals.every(isGoal)) throw new Error('This backup is damaged and could not be read.');
  const activeGoalId = b.goals.some((g) => g.id === b.activeGoalId) ? (b.activeGoalId as string) : (b.goals[0]?.id ?? null);
  return { goals: b.goals, activeGoalId };
}

/**
 * Adds the backup's goals to the ones already here. A goal that exists in
 * both is replaced by the backup's copy, so restoring the same file twice
 * changes nothing.
 */
export function mergeBackup(current: AppState, incoming: AppState): AppState {
  const ids = new Set(incoming.goals.map((g) => g.id));
  const goals = [...current.goals.filter((g) => !ids.has(g.id)), ...incoming.goals];
  return { goals, activeGoalId: incoming.activeGoalId ?? current.activeGoalId ?? goals[0]?.id ?? null };
}
