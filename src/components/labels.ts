import type { BlockKind, Goal } from '../lib/types';

export function skillName(goal: Goal, skillId: string | null): string {
  if (skillId === null) return 'Mock test';
  return goal.skills.find((s) => s.id === skillId)?.name ?? 'Removed skill';
}

export const KIND_LABEL: Record<BlockKind, string> = {
  learn: 'Study',
  revise: 'Revise',
  mock: 'Full mock',
};

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
