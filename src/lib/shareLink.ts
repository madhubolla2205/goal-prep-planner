import { addDays, daysBetween, type ISODate } from './dates';
import { goalFromDraft } from './goalText';
import type { Starter } from './starters';
import type { SkillTemplate } from './templates';
import type { Goal, GoalType, ThemeId } from './types';
import { THEMES } from './themes';

// A plan offered to the person before it becomes one of theirs: a ready-made
// starter plan, or a plan a friend shared as a link. A shared link carries the
// whole plan in the part after "#", which browsers never send to a server, so
// sharing needs no backend and the friend's progress is never included.

export interface PlanOffer {
  from: 'starter' | 'shared';
  name: string;
  type: GoalType;
  targetDate: ISODate;
  dailyMinutes: number;
  restDays: number[];
  skills: SkillTemplate[];
  theme?: ThemeId;
}

/** The website's address; the Android app links there so links work for anyone. */
export const SITE_URL = 'https://madhubolla2205.github.io/goal-prep-planner/';

export function offerFromStarter(s: Starter, today: ISODate): PlanOffer {
  return { from: 'starter', name: s.name, type: s.type, targetDate: addDays(today, s.days), dailyMinutes: s.dailyMinutes, restDays: s.restDays, skills: s.skills, ...(s.theme ? { theme: s.theme } : {}) };
}

/** Compact form of a plan for a link: short keys keep the link short. */
interface Payload {
  v: 1;
  n: string;
  t: GoalType;
  d: ISODate;
  /** Days of preparation the sharer planned, for when their date has passed. */
  p: number;
  m: number;
  r: number[];
  s: [string, number, number][];
  th?: ThemeId;
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code: string): string {
  const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodePlan(goal: Goal): string {
  const payload: Payload = {
    v: 1,
    n: goal.name,
    t: goal.type,
    d: goal.targetDate,
    p: Math.max(1, daysBetween(goal.startDate, goal.targetDate)),
    m: goal.dailyMinutes,
    r: goal.restDays,
    s: goal.skills.map((s) => [s.name, s.weight, s.estimatedHours]),
    ...(goal.theme ? { th: goal.theme } : {}),
  };
  return toBase64Url(JSON.stringify(payload));
}

export function shareUrl(goal: Goal, base: string): string {
  return `${base}#plan=${encodePlan(goal)}`;
}

const clamp = (n: unknown, lo: number, hi: number, def: number) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : def;

/**
 * Reads a shared plan from a link's code. Anyone can make a link, so every
 * field is checked and clamped; returns null for anything unreadable.
 */
export function decodePlan(code: string, today: ISODate): PlanOffer | null {
  let p: Partial<Payload>;
  try {
    p = JSON.parse(fromBase64Url(code));
  } catch {
    return null;
  }
  if (!p || p.v !== 1 || typeof p.n !== 'string' || !p.n.trim() || !Array.isArray(p.s)) return null;
  const skills = p.s
    .filter((s): s is [string, number, number] => Array.isArray(s) && typeof s[0] === 'string' && s[0].trim() !== '')
    .slice(0, 30)
    .map(([name, weight, hours]) => ({ name: name.trim().slice(0, 80), weight: clamp(weight, 1, 5, 3), estimatedHours: clamp(hours, 1, 1000, 10) }));
  if (skills.length === 0) return null;
  const validDate = typeof p.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.d) && p.d > today;
  const restDays = Array.isArray(p.r) ? [...new Set(p.r.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))] : [0];
  return {
    from: 'shared',
    name: p.n.trim().slice(0, 60),
    type: p.t === 'interview' ? 'interview' : 'exam',
    targetDate: validDate ? p.d! : addDays(today, clamp(p.p, 7, 730, 60)),
    dailyMinutes: clamp(p.m, 15, 960, 120),
    restDays: restDays.length < 7 ? restDays : [0],
    skills,
    ...(p.th && p.th in THEMES ? { theme: p.th } : {}),
  };
}

/** Reads "#plan=…" from a page address's hash, if it has one. */
export function planCodeFromHash(hash: string): string | null {
  const m = hash.match(/[#&]plan=([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

/** Reads "#starter=…" from a page address's hash, if it has one. */
export function starterIdFromHash(hash: string): string | null {
  const m = hash.match(/[#&]starter=([a-z0-9-]+)/);
  return m ? m[1] : null;
}

export function goalFromOffer(offer: PlanOffer, today: ISODate): Goal {
  const goal = goalFromDraft({ ...offer, source: 'rules' }, today);
  return offer.theme ? { ...goal, theme: offer.theme } : goal;
}
