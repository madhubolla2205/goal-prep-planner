import { addDays, type ISODate } from './dates';
import { buildPlan, minutesOnDay } from './planner';
import type { Goal } from './types';

// The daily reminder. In the Android app it is a notification; the next two
// weeks are scheduled ahead with what's planned each day, and rescheduled
// whenever the app is opened or progress is logged. Websites can't notify
// while closed, so there the reminder lives in the person's calendar instead.

export interface ReminderSettings {
  enabled: boolean;
  /** "HH:MM", local time. */
  time: string;
}

const KEY = 'goal-prep-planner/reminder';
export const DEFAULT_REMINDER: ReminderSettings = { enabled: false, time: '07:00' };

export function loadReminder(): ReminderSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<ReminderSettings> | null;
    if (saved && typeof saved.enabled === 'boolean' && typeof saved.time === 'string' && /^\d{2}:\d{2}$/.test(saved.time)) {
      return { enabled: saved.enabled, time: saved.time };
    }
  } catch {
    // Fall back to the default.
  }
  return DEFAULT_REMINDER;
}

export function saveReminder(settings: ReminderSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // The setting then lasts until the app is closed.
  }
}

export interface DayReminder {
  date: ISODate;
  /** Minutes still planned that day across all active plans. */
  minutes: number;
  /** Plans with study planned that day. */
  goals: Goal[];
}

/**
 * What each of the next `days` days holds, across every active plan. Days
 * with nothing planned are left out, and so is today once its plan is done.
 */
export function upcomingReminders(goals: Goal[], today: ISODate, days = 14): DayReminder[] {
  const byDate = new Map<ISODate, DayReminder>();
  for (const goal of goals) {
    if (goal.targetDate < today) continue;
    for (const day of buildPlan(goal, today)) {
      if (day.date >= addDays(today, days)) break;
      const planned = day.blocks.reduce((s, b) => s + b.minutes, 0);
      const left = day.date === today ? Math.max(0, planned - minutesOnDay(goal, today)) : planned;
      if (left === 0) continue;
      const entry = byDate.get(day.date) ?? { date: day.date, minutes: 0, goals: [] };
      entry.minutes += left;
      entry.goals.push(goal);
      byDate.set(day.date, entry);
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** The moment a reminder fires, from a calendar day and "HH:MM". */
export function reminderTime(date: ISODate, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
}
