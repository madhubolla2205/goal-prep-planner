import { addDays, daysBetween, weekday, type ISODate } from './dates';
import { newId } from './storage';
import { TEMPLATES } from './templates';
import type { Goal, GoalType } from './types';

/** A goal described in plain words, before it becomes a tracked Goal. */
export interface GoalDraft {
  name: string;
  type: GoalType;
  targetDate: ISODate;
  dailyMinutes: number;
  restDays: number[];
  skills: { name: string; weight: number; estimatedHours: number; confidence?: number }[];
  /** Where the skill breakdown came from. */
  source: 'ai' | 'rules';
}

export const DEFAULT_DAYS = 60;
export const DEFAULT_DAILY_MINUTES = 120;
export const DEFAULT_REST_DAYS = [0];

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12,
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function toNumber(word: string): number {
  return NUMBER_WORDS[word] ?? Number(word);
}

/** "in 6 weeks", "3 months", "by Dec 15", "on 15 March", "2027-02-01". */
export function parseTargetDate(text: string, today: ISODate): ISODate | null {
  const t = text.toLowerCase();

  const iso = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso && iso[0] > today) return iso[0];

  const monthName = `(${MONTHS.join('|')})[a-z]*\\.?`;
  const monthFirst = t.match(new RegExp(`\\b${monthName}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`));
  const dayFirst = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${monthName}`));
  const named = monthFirst
    ? { month: MONTHS.indexOf(monthFirst[1]), day: Number(monthFirst[2]) }
    : dayFirst
      ? { month: MONTHS.indexOf(dayFirst[2]), day: Number(dayFirst[1]) }
      : null;
  if (named && named.day >= 1 && named.day <= 31) {
    const year = Number(today.slice(0, 4));
    const mm = String(named.month + 1).padStart(2, '0');
    const dd = String(named.day).padStart(2, '0');
    const thisYear = `${year}-${mm}-${dd}`;
    return thisYear > today ? thisYear : `${year + 1}-${mm}-${dd}`;
  }

  const span = t.match(/(?<!(?:hours?|hrs?|h|mins?|minutes?|times|per|each)\s+)\b(\d+|an?|one|two|three|four|five|six|seven|eight|nine|ten|twelve)\s+(day|week|month|year)s?\b(?!\s*(?:a|per|each)\s+(?:day|week))/);
  if (span) {
    const n = toNumber(span[1]);
    const unitDays = { day: 1, week: 7, month: 30, year: 365 }[span[2] as 'day' | 'week' | 'month' | 'year'];
    if (n > 0) return addDays(today, Math.round(n * unitDays));
  }
  return null;
}

/** "2 hours a day", "1.5 hrs daily", "90 min per day", "2h/day". */
export function parseDailyMinutes(text: string): number | null {
  const t = text.toLowerCase();
  const hours = t.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b(?!\s*(?:a|per)\s*week)/);
  if (hours) return Math.round(Number(hours[1]) * 60);
  const mins = t.match(/(\d+)\s*(?:m|min|mins|minutes)\b/);
  if (mins) return Number(mins[1]);
  return null;
}

/** "weekends off", "Sundays off", "every day", "no breaks". */
export function parseRestDays(text: string): number[] | null {
  const t = text.toLowerCase();
  if (/weekends?\s+off|no\s+(?:study\s+)?(?:on\s+)?weekends/.test(t)) return [0, 6];
  if (/sundays?\s+off/.test(t)) return [0];
  if (/saturdays?\s+off/.test(t)) return [6];
  if (/every\s*day|7\s+days\s+a\s+week|no\s+(?:rest|breaks?|days?\s+off)/.test(t)) return [];
  return null;
}

export function parseGoalType(text: string): GoalType {
  const t = text.toLowerCase();
  if (/interview|onsite|on-site|hiring|recruit|job|placement|offer|\bround/.test(t)) return 'interview';
  return 'exam';
}

/** Short goal name: the first clause, without the timing and hours. */
export function parseGoalName(text: string): string {
  let name = text
    .trim()
    .replace(/^(?:i\s+(?:have|want|need)\s+(?:to\s+)?(?:prepare\s+for\s+|crack\s+|clear\s+|pass\s+)?(?:an?\s+|my\s+)?|i'?m\s+preparing\s+for\s+(?:an?\s+|my\s+)?|(?:help\s+me\s+)?(?:prepare|preparing|prep)\s+for\s+(?:an?\s+|my\s+)?)/i, '')
    .split(/[,.;\n]|\s+(?:in|within|by|on|after|starting)\s+(?=\d|an?\b|one|two|three|four|five|six|seven|eight|nine|ten|twelve|next|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)[0]
    .replace(/\s+(?:with\s+)?\d+(?:\.\d+)?\s*(?:h|hrs?|hours?|m|mins?|minutes?)\b.*$/i, '')
    .trim();
  if (name.length > 60) name = `${name.slice(0, 57).trimEnd()}…`;
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : 'My goal';
}

const GENERIC_SKILLS: Record<GoalType, GoalDraft['skills']> = {
  interview: [
    { name: 'Role-specific technical skills', weight: 5, estimatedHours: 30 },
    { name: 'Problem-solving practice', weight: 4, estimatedHours: 20 },
    { name: 'Behavioral stories', weight: 3, estimatedHours: 6 },
    { name: 'Company & role research', weight: 3, estimatedHours: 4 },
    { name: 'Mock interviews', weight: 4, estimatedHours: 8 },
  ],
  exam: [
    { name: 'Syllabus coverage', weight: 5, estimatedHours: 40 },
    { name: 'Practice problems', weight: 4, estimatedHours: 25 },
    { name: 'Previous papers', weight: 4, estimatedHours: 15 },
    { name: 'Weak-area revision', weight: 3, estimatedHours: 10 },
  ],
};

/** Picks the best built-in skill list for the description. */
export function matchSkills(text: string, type: GoalType): GoalDraft['skills'] {
  const t = text.toLowerCase();
  const pick = (id: string) => TEMPLATES.find((x) => x.id === id)!.skills;
  if (/\bgate\b/.test(t)) return pick('gate-cse');
  if (/\bcat\b/.test(t)) return pick('cat');
  if (type === 'interview') {
    if (/\b(data|ml|machine learning|analyst|analytics|scientist|sql|ai)\b/.test(t)) return pick('data-interview');
    if (/\b(sde|swe|software|developer|engineer|engineering|coding|leetcode|frontend|backend|full ?stack|programmer)\b/.test(t)) {
      return pick('swe-interview');
    }
  }
  return GENERIC_SKILLS[type];
}

/** Builds a complete draft from a sentence, using only built-in rules. */
export function draftFromText(text: string, today: ISODate): GoalDraft {
  const type = parseGoalType(text);
  return {
    name: parseGoalName(text),
    type,
    targetDate: parseTargetDate(text, today) ?? addDays(today, DEFAULT_DAYS),
    dailyMinutes: parseDailyMinutes(text) ?? DEFAULT_DAILY_MINUTES,
    restDays: parseRestDays(text) ?? DEFAULT_REST_DAYS,
    skills: matchSkills(text, type),
    source: 'rules',
  };
}

/** Hours available for new material before the revision phase. */
export function learningHours(targetDate: ISODate, dailyMinutes: number, restDays: number[], today: ISODate): number {
  const span = Math.max(0, daysBetween(today, targetDate) + 1);
  let days = 0;
  for (let i = 0; i < span; i++) if (!restDays.includes(weekday(addDays(today, i)))) days++;
  return (days * 0.85 * dailyMinutes) / 60;
}

/**
 * Turns a draft into a goal. Estimates that don't fit the time available are
 * scaled down so the plan starts out achievable; the person can raise them later.
 */
export function goalFromDraft(draft: GoalDraft, today: ISODate, prompt?: string): Goal {
  const available = learningHours(draft.targetDate, draft.dailyMinutes, draft.restDays, today);
  const needed = draft.skills.reduce((sum, s) => sum + s.estimatedHours, 0);
  const scale = needed > available && needed > 0 ? available / needed : 1;
  return {
    id: newId(),
    name: draft.name,
    type: draft.type,
    startDate: today,
    targetDate: draft.targetDate,
    dailyMinutes: draft.dailyMinutes,
    restDays: draft.restDays,
    skills: draft.skills.map((s) => ({
      id: newId(),
      name: s.name,
      weight: s.weight,
      estimatedHours: Math.max(1, Math.round(s.estimatedHours * scale)),
      confidence: s.confidence ?? 30,
    })),
    log: [],
    prompt,
    source: draft.source,
  };
}

/** Clamps a draft from an untrusted source (the network) into valid ranges. */
export function sanitizeDraft(raw: Partial<GoalDraft>, text: string, today: ISODate): GoalDraft {
  const fallback = draftFromText(text, today);
  const clamp = (n: unknown, lo: number, hi: number, def: number) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def;
  const validDate = typeof raw.targetDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.targetDate) && raw.targetDate > today;
  const skills = Array.isArray(raw.skills)
    ? raw.skills
        .filter((s) => s && typeof s.name === 'string' && s.name.trim())
        .slice(0, 15)
        .map((s) => ({
          name: s.name.trim().slice(0, 80),
          weight: Math.round(clamp(s.weight, 1, 5, 3)),
          estimatedHours: Math.round(clamp(s.estimatedHours, 1, 500, 10)),
          confidence: Math.round(clamp(s.confidence, 0, 100, 30)),
        }))
    : [];
  const restDays = Array.isArray(raw.restDays)
    ? [...new Set(raw.restDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))]
    : fallback.restDays;
  return {
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 60) : fallback.name,
    type: raw.type === 'interview' || raw.type === 'exam' ? raw.type : fallback.type,
    targetDate: validDate ? raw.targetDate! : fallback.targetDate,
    dailyMinutes: Math.round(clamp(raw.dailyMinutes, 15, 960, fallback.dailyMinutes)),
    restDays: restDays.length < 7 ? restDays : fallback.restDays,
    skills: skills.length ? skills : fallback.skills,
    source: skills.length ? 'ai' : 'rules',
  };
}
