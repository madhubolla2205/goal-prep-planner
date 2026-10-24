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
