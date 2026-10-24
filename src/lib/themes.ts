import type { Goal, ThemeId } from './types';

export type PathIcon = 'code' | 'chart' | 'chip' | 'sigma' | 'landmark' | 'pulse' | 'book' | 'briefcase';

export interface PathTheme {
  id: ThemeId;
  /** The kind of path, as shown on the goal's banner. */
  label: string;
  tagline: string;
  icon: PathIcon;
  /** Gradient stops; both carry white text. */
  from: string;
  to: string;
}

export const THEMES: Record<ThemeId, PathTheme> = {
  code: {
    id: 'code', label: 'Coding interview', icon: 'code', from: '#4f46e5', to: '#0284c7',
    tagline: 'Every problem you solve is a pattern you keep.',
  },
  data: {
    id: 'data', label: 'Data & ML interview', icon: 'chart', from: '#0f766e', to: '#2563eb',
    tagline: 'Practice today, signal on the day.',
  },
  engineering: {
    id: 'engineering', label: 'Engineering exam', icon: 'chip', from: '#ea580c', to: '#db2777',
    tagline: 'One subject at a time, all the way to the paper.',
  },
  aptitude: {
    id: 'aptitude', label: 'Aptitude exam', icon: 'sigma', from: '#c026d3', to: '#6d28d9',
    tagline: 'Speed and accuracy, built a day at a time.',
  },
  civil: {
    id: 'civil', label: 'Government exam', icon: 'landmark', from: '#047857', to: '#0e7490',
    tagline: 'Steady every day beats intense once a week.',
  },
  medical: {
    id: 'medical', label: 'Medical exam', icon: 'pulse', from: '#be123c', to: '#c2410c',
    tagline: 'Small daily doses, strong recall.',
  },
  exam: {
    id: 'exam', label: 'Exam', icon: 'book', from: '#2563eb', to: '#7c3aed',
    tagline: 'Show up today and the score follows.',
  },
  interview: {
    id: 'interview', label: 'Interview', icon: 'briefcase', from: '#7c3aed', to: '#db2777',
    tagline: 'Walk in prepared, walk out with the offer.',
  },
};

export const THEME_ORDER: ThemeId[] = ['code', 'data', 'engineering', 'aptitude', 'civil', 'medical', 'exam', 'interview'];

/** The theme for screens with no goal yet. */
export const WELCOME_THEME = THEMES.interview;

const EXAM_PATHS: [ThemeId, RegExp][] = [
  ['medical', /\b(neet|mbbs|usmle|aiims|nclex|plab|medical|biology)\b/],
  ['engineering', /\b(gate|jee|ese|ies|engineering)\b/],
  ['aptitude', /\b(cat|gmat|gre|xat|snap|cmat|mba|aptitude|quant\w*)\b/],
  ['civil', /\b(upsc|ias|ssc|ibps|sbi|rbi|psc|bank\w*|civil services|government)\b/],
];

const INTERVIEW_PATHS: [ThemeId, RegExp][] = [
  ['data', /\b(data(?! structures)|ml|machine learning|analyst|analytics|sql|statistics)\b/],
  ['code', /\b(sde|swe|software|developer|coding|dsa|leetcode|frontend|backend|full ?stack|algorithms|system design)\b/],
];

/** Picks the look that fits the goal, from its name, wording and skills. */
export function detectTheme(goal: Pick<Goal, 'name' | 'type' | 'prompt' | 'skills'>): ThemeId {
  const text = [goal.name, goal.prompt ?? '', ...goal.skills.map((s) => s.name)].join(' ').toLowerCase();
  const paths = goal.type === 'exam' ? EXAM_PATHS : INTERVIEW_PATHS;
  return paths.find(([, re]) => re.test(text))?.[0] ?? goal.type;
}

export function themeFor(goal: Goal): PathTheme {
  return THEMES[goal.theme ?? detectTheme(goal)];
}
