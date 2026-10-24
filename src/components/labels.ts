import type { IconName } from './Icon';
import type { BlockKind, Goal, PlannedBlock } from '../lib/types';

export function skillName(goal: Goal, skillId: string | null): string {
  if (skillId === null) return goal.type === 'interview' ? 'Mock interview' : 'Mock test';
  return goal.skills.find((s) => s.id === skillId)?.name ?? 'Removed skill';
}

/** What a block is about: its skill, or the mock it belongs to. */
export function blockName(goal: Goal, block: PlannedBlock): string {
  if (block.kind === 'analysis') return goal.type === 'interview' ? 'Review your mock interview' : 'Analyse your mock';
  return skillName(goal, block.skillId);
}

export const KIND_LABEL: Record<BlockKind, string> = {
  learn: 'Study',
  review: 'Review',
  revise: 'Revise',
  mock: 'Mock',
  analysis: 'Analysis',
};

export const KIND_ICON: Record<BlockKind, IconName> = {
  learn: 'book',
  review: 'repeat',
  revise: 'pen',
  mock: 'timer',
  analysis: 'search',
};

/** One line on how to spend the block, following the strategy behind it. */
export function kindHint(goal: Goal, kind: BlockKind): string {
  switch (kind) {
    case 'learn':
      return 'New material, then a few problems without notes';
    case 'review':
      return 'Recall first, then check: flashcards or past questions';
    case 'revise':
      return 'Closed-book practice and past papers, not rereading';
    case 'mock':
      return goal.type === 'interview' ? 'Timed, with a peer or a mock-interview platform' : 'Timed, in exam conditions, in one sitting';
    case 'analysis':
      return 'Every mistake and skipped question: why, and which skill';
  }
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
