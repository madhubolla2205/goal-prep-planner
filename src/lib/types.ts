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
  /** Which kind of planned block the time was for; older entries have none. */
  kind?: BlockKind;
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
  /** Points the person wants to keep fresh; older goals have none. */
  notes?: Note[];
  /** Look of the goal's pages; picked from the goal itself when unset. */
  theme?: ThemeId;
}

export type ThemeId = 'code' | 'data' | 'engineering' | 'aptitude' | 'civil' | 'medical' | 'exam' | 'interview';

/** A point to remember, written by the person, shown in the daily quick revision. */
export interface Note {
  id: string;
  text: string;
  /** The skill the point belongs to, or null for the goal as a whole. */
  skillId: string | null;
  /** Pinned points come up in every quick revision. */
  pinned?: boolean;
  createdAt: ISODate;
  /** Days the point was gone through in a quick revision, most recent last. */
  revised?: ISODate[];
}

/**
 * learn: new material · review: spaced recall of a skill studied earlier ·
 * revise: practice on weak skills in the revision phase · mock: a full
 * practice test or mock interview · analysis: going through a mock's mistakes.
 */
export type BlockKind = 'learn' | 'review' | 'revise' | 'mock' | 'analysis';

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
