import type { ISODate } from './dates';
import type { Goal } from './types';

const KEY = 'goal-prep-planner/v1';

export interface AppState {
  goals: Goal[];
  activeGoalId: string | null;
}

export const EMPTY_STATE: AppState = { goals: [], activeGoalId: null };

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as AppState;
    return Array.isArray(parsed.goals) ? parsed : EMPTY_STATE;
  } catch {
    return EMPTY_STATE;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked (private mode); the app keeps working in memory.
  }
}

export function newId(): string {
  return crypto.randomUUID();
}

const LAST_BACKUP_KEY = 'goal-prep-planner/last-backup';

/** The day a backup file was last saved on this device, if ever. */
export function loadLastBackup(): ISODate | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY);
  } catch {
    return null;
  }
}

export function saveLastBackup(day: ISODate): void {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, day);
  } catch {
    // Same as saveState: nothing more to do.
  }
}
