import type { GoalType } from './types';

export interface SkillTemplate {
  name: string;
  weight: number;
  estimatedHours: number;
}

export interface GoalTemplate {
  id: string;
  label: string;
  type: GoalType;
  skills: SkillTemplate[];
}

// Starting points only: every skill, weight and estimate is editable after the
// goal is created. Estimates assume a learner starting from working knowledge.
export const TEMPLATES: GoalTemplate[] = [
  {
    id: 'swe-interview',
    label: 'Software engineer interview',
    type: 'interview',
    skills: [
      { name: 'Data structures & algorithms', weight: 5, estimatedHours: 60 },
      { name: 'System design', weight: 4, estimatedHours: 25 },
      { name: 'Core CS (OS, networks, DBMS)', weight: 3, estimatedHours: 15 },
      { name: 'Language & framework depth', weight: 3, estimatedHours: 10 },
      { name: 'Behavioral & company research', weight: 3, estimatedHours: 8 },
      { name: 'Resume & project walkthroughs', weight: 2, estimatedHours: 4 },
    ],
  },
  {
    id: 'data-interview',
    label: 'Data / ML interview',
    type: 'interview',
    skills: [
      { name: 'SQL', weight: 5, estimatedHours: 20 },
      { name: 'Statistics & probability', weight: 4, estimatedHours: 20 },
      { name: 'Machine learning concepts', weight: 4, estimatedHours: 25 },
      { name: 'Python & coding rounds', weight: 4, estimatedHours: 25 },
      { name: 'Case studies & product sense', weight: 3, estimatedHours: 10 },
      { name: 'Behavioral', weight: 2, estimatedHours: 6 },
    ],
  },
  {
    id: 'gate-cse',
    label: 'GATE (CSE)',
    type: 'exam',
    skills: [
      { name: 'Engineering mathematics', weight: 4, estimatedHours: 50 },
      { name: 'Discrete mathematics', weight: 4, estimatedHours: 40 },
      { name: 'Digital logic', weight: 2, estimatedHours: 20 },
      { name: 'Computer organization & architecture', weight: 4, estimatedHours: 45 },
      { name: 'Programming & data structures', weight: 5, estimatedHours: 45 },
      { name: 'Algorithms', weight: 5, estimatedHours: 45 },
      { name: 'Theory of computation', weight: 4, estimatedHours: 35 },
      { name: 'Compiler design', weight: 3, estimatedHours: 25 },
      { name: 'Operating systems', weight: 4, estimatedHours: 40 },
      { name: 'Databases', weight: 4, estimatedHours: 35 },
      { name: 'Computer networks', weight: 4, estimatedHours: 35 },
      { name: 'General aptitude', weight: 3, estimatedHours: 25 },
    ],
  },
  {
    id: 'cat',
    label: 'CAT',
    type: 'exam',
    skills: [
      { name: 'Quantitative aptitude', weight: 5, estimatedHours: 120 },
      { name: 'Data interpretation & logical reasoning', weight: 5, estimatedHours: 100 },
      { name: 'Verbal ability & reading comprehension', weight: 5, estimatedHours: 100 },
    ],
  },
  {
    id: 'custom',
    label: 'Start from scratch',
    type: 'exam',
    skills: [],
  },
];
