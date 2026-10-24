import type { ISODate } from './dates';

export type GoalType = 'exam' | 'interview';

export interface Skill {
  id: string;
  name: string;
  /** How much this skill matters for the goal, 1 (low) to 5 (critical). */
  weight: number;
  /** Total study time the skill is expected to need, in hours. */
  estimatedHours: number;
  /** Self-rated confidence, 0 to 100. */
  confidence: number;
}

export interface LogEntry {
  id: string;
  date: ISODate;
  /** The skill studied, or null for a mock test / full practice session. */
  skillId: string | null;
  minutes: number;
  note?: string;
}

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  startDate: ISODate;
  targetDate: ISODate;
  dailyMinutes: number;
  /** Weekdays with no study (0 = Sunday … 6 = Saturday). */
  restDays: number[];
  skills: Skill[];
  log: LogEntry[];
  /** The sentence the goal was created from, if any. */
  prompt?: string;
  /** Who broke the goal into skills: Claude, the built-in rules, or the person. */
  source?: 'ai' | 'rules' | 'manual';
}

export type BlockKind = 'learn' | 'revise' | 'mock';

export interface PlannedBlock {
  skillId: string | null;
  minutes: number;
  kind: BlockKind;
}

export interface DayPlan {
  date: ISODate;
  phase: 'learn' | 'revise';
  blocks: PlannedBlock[];
}
