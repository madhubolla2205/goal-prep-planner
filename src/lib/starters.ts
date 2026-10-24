import { TEMPLATES, type SkillTemplate } from './templates';
import type { GoalType, ThemeId } from './types';

// Ready-made plans for popular exams and interviews. Each one starts a plan
// in one tap and also gets its own page on the website (built by vite.config.ts),
// so people searching for "<exam> preparation plan" can find the app.
// Skills, importance and hours are starting points; every one is editable.

export interface Starter {
  id: string;
  /** The plan's name once created. */
  name: string;
  type: GoalType;
  /** Typical preparation time, used for the default target date. */
  days: number;
  dailyMinutes: number;
  restDays: number[];
  /** One or two sentences for the plan's web page. */
  summary: string;
  skills: SkillTemplate[];
  /** Set where the look picked from the name would be wrong. */
  theme?: ThemeId;
}

const template = (id: string) => TEMPLATES.find((t) => t.id === id)!.skills;

export const STARTERS: Starter[] = [
  {
    id: 'gate-cse', name: 'GATE CSE', type: 'exam', days: 180, dailyMinutes: 240, restDays: [0],
    summary: 'A day-by-day GATE Computer Science plan covering every subject, weighted by how much it counts, with spaced revision and full mock tests before the exam.',
    skills: template('gate-cse'),
  },
  {
    id: 'cat', name: 'CAT', type: 'exam', days: 150, dailyMinutes: 180, restDays: [0],
    summary: 'A CAT plan that splits your time across Quant, DILR and VARC, then switches to sectional and full mocks with time to analyse each one.',
    skills: template('cat'),
  },
  {
    id: 'upsc-prelims', theme: 'civil', name: 'UPSC CSE Prelims', type: 'exam', days: 240, dailyMinutes: 360, restDays: [0],
    summary: 'A UPSC Civil Services Prelims plan covering GS Paper I subjects, daily current affairs and CSAT, ending with previous-year papers and mock tests.',
    skills: [
      { name: 'History & culture', weight: 5, estimatedHours: 90 },
      { name: 'Indian polity & governance', weight: 5, estimatedHours: 80 },
      { name: 'Geography', weight: 4, estimatedHours: 70 },
      { name: 'Indian economy', weight: 4, estimatedHours: 70 },
      { name: 'Environment & ecology', weight: 4, estimatedHours: 50 },
      { name: 'Science & technology', weight: 3, estimatedHours: 40 },
      { name: 'Current affairs', weight: 5, estimatedHours: 100 },
      { name: 'CSAT (aptitude & comprehension)', weight: 3, estimatedHours: 40 },
      { name: 'Previous year papers', weight: 4, estimatedHours: 40 },
    ],
  },
  {
    id: 'ssc-cgl', theme: 'civil', name: 'SSC CGL', type: 'exam', days: 120, dailyMinutes: 180, restDays: [0],
    summary: 'An SSC CGL plan for Quant, Reasoning, English and General Awareness, with regular mocks so speed and accuracy improve together.',
    skills: [
      { name: 'Quantitative aptitude', weight: 5, estimatedHours: 70 },
      { name: 'General intelligence & reasoning', weight: 4, estimatedHours: 50 },
      { name: 'English comprehension', weight: 4, estimatedHours: 50 },
      { name: 'General awareness', weight: 4, estimatedHours: 50 },
      { name: 'Previous year papers', weight: 4, estimatedHours: 30 },
    ],
  },
  {
    id: 'ibps-po', theme: 'civil', name: 'IBPS PO', type: 'exam', days: 90, dailyMinutes: 180, restDays: [0],
    summary: 'A bank PO plan for prelims and mains: Quant, Reasoning, English, banking awareness and descriptive writing, with mock tests in the last weeks.',
    skills: [
      { name: 'Quantitative aptitude', weight: 5, estimatedHours: 50 },
      { name: 'Reasoning ability', weight: 5, estimatedHours: 50 },
      { name: 'English language', weight: 4, estimatedHours: 35 },
      { name: 'General & banking awareness', weight: 4, estimatedHours: 35 },
      { name: 'Computer aptitude', weight: 2, estimatedHours: 10 },
      { name: 'Descriptive writing (essay & letter)', weight: 2, estimatedHours: 8 },
    ],
  },
  {
    id: 'neet-ug', name: 'NEET UG', type: 'exam', days: 300, dailyMinutes: 360, restDays: [0],
    summary: 'A NEET UG plan across Physics, Chemistry and Biology, weighted towards Biology, with NCERT revision and full-length mocks before the exam.',
    skills: [
      { name: 'Physics', weight: 5, estimatedHours: 220 },
      { name: 'Physical chemistry', weight: 4, estimatedHours: 110 },
      { name: 'Organic chemistry', weight: 4, estimatedHours: 110 },
      { name: 'Inorganic chemistry', weight: 4, estimatedHours: 90 },
      { name: 'Botany', weight: 5, estimatedHours: 180 },
      { name: 'Zoology', weight: 5, estimatedHours: 180 },
      { name: 'NCERT line-by-line revision', weight: 4, estimatedHours: 80 },
    ],
  },
  {
    id: 'jee-main', name: 'JEE Main', type: 'exam', days: 300, dailyMinutes: 360, restDays: [0],
    summary: 'A JEE Main plan that balances Physics, Chemistry and Maths, then moves to previous papers and timed mocks.',
    skills: [
      { name: 'Physics', weight: 5, estimatedHours: 250 },
      { name: 'Chemistry', weight: 5, estimatedHours: 220 },
      { name: 'Mathematics', weight: 5, estimatedHours: 280 },
      { name: 'Previous year papers', weight: 4, estimatedHours: 60 },
    ],
  },
  {
    id: 'gre', name: 'GRE', type: 'exam', days: 60, dailyMinutes: 120, restDays: [0],
    summary: 'A two-month GRE plan for Quant, Verbal, vocabulary and the writing task, with practice tests every week near the end.',
    skills: [
      { name: 'Quantitative reasoning', weight: 5, estimatedHours: 40 },
      { name: 'Verbal reasoning', weight: 5, estimatedHours: 40 },
      { name: 'Vocabulary', weight: 3, estimatedHours: 20 },
      { name: 'Analytical writing', weight: 3, estimatedHours: 12 },
    ],
  },
  {
    id: 'tcs-nqt', name: 'TCS NQT', type: 'exam', days: 30, dailyMinutes: 120, restDays: [0],
    summary: 'A one-month plan for the TCS National Qualifier Test: numerical, verbal and reasoning ability, programming logic and coding.',
    skills: [
      { name: 'Numerical ability', weight: 5, estimatedHours: 15 },
      { name: 'Verbal ability', weight: 4, estimatedHours: 10 },
      { name: 'Reasoning ability', weight: 4, estimatedHours: 12 },
      { name: 'Programming logic', weight: 4, estimatedHours: 10 },
      { name: 'Coding problems', weight: 5, estimatedHours: 20 },
    ],
  },
  {
    id: 'amazon-sde', name: 'Amazon SDE interview', type: 'interview', days: 42, dailyMinutes: 120, restDays: [0],
    summary: 'A six-week Amazon SDE interview plan: data structures and algorithms, system design, low-level design and stories for the Leadership Principles.',
    skills: [
      { name: 'Data structures & algorithms', weight: 5, estimatedHours: 60 },
      { name: 'System design', weight: 4, estimatedHours: 20 },
      { name: 'Object-oriented & low-level design', weight: 3, estimatedHours: 10 },
      { name: 'Leadership Principles stories', weight: 4, estimatedHours: 10 },
      { name: 'Core CS (OS, networks, DBMS)', weight: 3, estimatedHours: 12 },
      { name: 'Company & team research', weight: 2, estimatedHours: 3 },
    ],
  },
  {
    id: 'software-engineer', name: 'Software engineer interview', type: 'interview', days: 60, dailyMinutes: 120, restDays: [0],
    summary: 'A coding interview plan for product companies: DSA, system design, core CS, your projects and behavioral rounds, with mock interviews.',
    skills: template('swe-interview'),
  },
  {
    id: 'data-analyst', name: 'Data analyst interview', type: 'interview', days: 30, dailyMinutes: 90, restDays: [0],
    summary: 'A one-month data analyst interview plan: SQL, statistics, Excel, Python, dashboards and case studies.',
    skills: [
      { name: 'SQL', weight: 5, estimatedHours: 20 },
      { name: 'Statistics', weight: 4, estimatedHours: 15 },
      { name: 'Excel & spreadsheets', weight: 3, estimatedHours: 8 },
      { name: 'Python & pandas', weight: 3, estimatedHours: 12 },
      { name: 'Dashboards & BI tools', weight: 3, estimatedHours: 8 },
      { name: 'Case studies & product sense', weight: 4, estimatedHours: 10 },
      { name: 'Behavioral', weight: 2, estimatedHours: 5 },
    ],
  },
  {
    id: 'data-scientist', name: 'Data scientist / ML interview', type: 'interview', days: 60, dailyMinutes: 120, restDays: [0],
    summary: 'A data science and machine learning interview plan: SQL, statistics, ML concepts, coding rounds and case studies.',
    skills: template('data-interview'),
  },
  {
    id: 'product-manager', name: 'Product manager interview', type: 'interview', days: 45, dailyMinutes: 90, restDays: [0],
    summary: 'A product manager interview plan: product sense, metrics, estimation, strategy, behavioral stories and enough tech to hold the conversation.',
    skills: [
      { name: 'Product sense & design', weight: 5, estimatedHours: 25 },
      { name: 'Metrics & analytics', weight: 4, estimatedHours: 15 },
      { name: 'Estimation', weight: 3, estimatedHours: 8 },
      { name: 'Strategy & market', weight: 3, estimatedHours: 10 },
      { name: 'Behavioral stories', weight: 4, estimatedHours: 8 },
      { name: 'Technical basics', weight: 2, estimatedHours: 8 },
    ],
  },
];

export const starterById = (id: string) => STARTERS.find((s) => s.id === id);
