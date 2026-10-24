import type { Goal } from './types';

// Study strategies the planner builds every schedule from, and how their
// settings change with the goal. Sources are listed in STRATEGIES below.

export type Horizon = 'sprint' | 'standard' | 'long';
export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface StrategyProfile {
  horizon: Horizon;
  level: Level;
  /** Share of all study days kept for the revision phase at the end. */
  revisionShare: number;
  /** Study days to wait before each successive spaced review of a skill. */
  reviewIntervals: number[];
  /** Whether to open with a diagnostic mock to calibrate confidence. */
  diagnostic: boolean;
  /** Study days between early checkpoint mocks, before weekly mocks begin. */
  checkpointEvery: number | null;
  /** Point in the learning phase (0 to 1) where regular mocks start. */
  mockStart: number;
  /** Study days between mocks once they are regular. */
  mockEvery: number;
  /** Study days between mocks in the revision phase. */
  revisionMockEvery: number;
  mockMinutes: number;
  analysisMinutes: number;
  /** Length of one timeboxed focus session. */
  focusMinutes: number;
}

const SPRINT_DAYS = 15;
const LONG_DAYS = 90;

/** Confidence averaged by skill weight, 0 to 100. */
export function startingConfidence(goal: Goal): number {
  const totalWeight = goal.skills.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;
  return goal.skills.reduce((sum, s) => sum + s.weight * s.confidence, 0) / totalWeight;
}

export function startingLevel(goal: Goal): Level {
  const c = startingConfidence(goal);
  if (c < 35) return 'beginner';
  if (c >= 65) return 'advanced';
  return 'intermediate';
}

/**
 * Picks the strategy settings for a goal from its type, how many study days
 * it spans in total and the learner's starting level.
 */
export function strategyProfile(goal: Goal, totalStudyDays: number): StrategyProfile {
  const horizon: Horizon = totalStudyDays < SPRINT_DAYS ? 'sprint' : totalStudyDays > LONG_DAYS ? 'long' : 'standard';
  const level = startingLevel(goal);
  const exam = goal.type === 'exam';
  const studyDaysPerWeek = Math.max(1, 7 - goal.restDays.length);

  let revisionShare = horizon === 'sprint' ? 0.3 : 0.2;
  let mockStart = horizon === 'sprint' ? 0 : exam ? 0.5 : 0.6;
  if (level === 'beginner') mockStart += 0.15;
  if (level === 'advanced') {
    mockStart -= 0.15;
    revisionShare += 0.05;
  }

  const mockMinutes = exam ? 180 : 60;
  return {
    horizon,
    level,
    revisionShare,
    reviewIntervals: horizon === 'sprint' ? [1, 2, 4] : horizon === 'long' ? [1, 3, 7, 14, 30] : [1, 3, 7, 14],
    diagnostic: level !== 'beginner' && totalStudyDays >= 7,
    checkpointEvery: horizon === 'long' ? studyDaysPerWeek * 4 : null,
    mockStart: Math.max(0, Math.min(1, mockStart)),
    mockEvery: horizon === 'sprint' ? 3 : studyDaysPerWeek,
    revisionMockEvery: 3,
    mockMinutes,
    analysisMinutes: Math.round(mockMinutes / 2),
    focusMinutes: goal.dailyMinutes < 90 ? 25 : 50,
  };
}

/** Splits a block into timeboxed focus sessions; empty when it is short enough to do in one. */
export function focusSessions(minutes: number, focusMinutes: number): { count: number; minutes: number } | null {
  if (minutes < focusMinutes * 1.5) return null;
  const count = Math.round(minutes / focusMinutes);
  return { count, minutes: Math.round(minutes / count / 5) * 5 };
}

export interface Strategy {
  id: string;
  name: string;
  /** How the planner applies it, in one sentence. */
  howApplied: string;
  source: { label: string; url: string };
}

export const STRATEGIES: Strategy[] = [
  {
    id: 'spacing',
    name: 'Spaced review',
    howApplied: 'Skills you have studied come back as short review blocks at growing gaps, so nothing fades before the exam.',
    source: { label: 'Cepeda et al., 2008', url: 'https://pubmed.ncbi.nlm.nih.gov/19076480/' },
  },
  {
    id: 'testing',
    name: 'Practice testing',
    howApplied: 'Review and revision blocks are recall work: closed-book problems and past papers, not rereading.',
    source: { label: 'Roediger & Karpicke, 2006', url: 'https://psychology.ecu.edu/wp-content/pv-uploads/sites/216/2019/03/Roediger-Karpicke-2006.pdf' },
  },
  {
    id: 'interleaving',
    name: 'Interleaving',
    howApplied: 'Days mix two or three skills when there is time, and revision days mix your weakest ones.',
    source: { label: 'Rohrer & Taylor, 2007', url: 'https://digitalcommons.usf.edu/psy_facpub/1767/' },
  },
  {
    id: 'mocks',
    name: 'Mock-test ramp',
    howApplied: 'Mocks start partway through and get more frequent toward the date, as top CAT and GATE candidates do.',
    source: { label: 'Cracku: mocks taken by CAT 99-percentilers', url: 'https://cracku.in/how-many-cat-mock-tests-do-99-percentilers-take/' },
  },
  {
    id: 'analysis',
    name: 'Mock analysis and weak-area focus',
    howApplied: 'Every mock is followed by an analysis session, and low-confidence, high-weight skills get more time.',
    source: { label: 'Ericsson et al., 1993 (deliberate practice)', url: 'https://www.jimdavies.org/summaries/ericsson1993.html' },
  },
  {
    id: 'focus',
    name: 'Timeboxed focus sessions',
    howApplied: 'Long blocks are split into focus sessions with short breaks in between.',
    source: { label: 'VisionIAS: UPSC toppers’ strategy', url: 'https://visionias.in/blog/toppers-strategy/upsc-2024-toppers-strategy' },
  },
  {
    id: 'taper',
    name: 'Taper before the date',
    howApplied: 'No full mocks in the last two study days, and the final day is a short, light review.',
    source: { label: 'MADE EASY: last-month GATE plan', url: 'https://www.madeeasy.in/blog/last-month-gate-preparation-plan' },
  },
];

export const HORIZON_LABEL: Record<Horizon, string> = {
  sprint: 'Sprint (under 3 weeks)',
  standard: 'Standard (3 weeks to 3 months)',
  long: 'Long haul (over 3 months)',
};

export const LEVEL_LABEL: Record<Level, string> = {
  beginner: 'starting from scratch',
  intermediate: 'some background',
  advanced: 'already strong',
};
