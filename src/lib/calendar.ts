import { addDays, type ISODate } from './dates';
import { buildPlan } from './planner';
import type { Goal, PlannedBlock } from './types';

// Calendar exports: a .ics file with every planned study day, and a Google
// Calendar link for one repeating study reminder. Times are "floating"
// (no time zone), so each calendar shows them at that clock time wherever
// the person is.

const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** "2026-11-02" and "07:30" → "20261102T073000". */
export function icsDateTime(date: ISODate, time: string): string {
  const [h, m] = time.split(':');
  return `${date.replace(/-/g, '')}T${h.padStart(2, '0')}${m.padStart(2, '0')}00`;
}

function addMinutes(date: ISODate, time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const day = addDays(date, Math.floor(total / 1440));
  const rest = total % 1440;
  return icsDateTime(day, `${Math.floor(rest / 60)}:${rest % 60}`);
}

const escape = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Lines longer than 75 characters continue on the next line after a space (RFC 5545). */
function fold(line: string): string {
  const parts: string[] = [];
  for (let i = 0; i < line.length; i += 73) parts.push(line.slice(i, i + 73));
  return parts.join('\r\n ');
}

export interface IcsOptions {
  /** Start time of each session, "HH:MM". */
  time: string;
  /** Event title, e.g. "Study: GATE CSE". */
  title: string;
  /** Names each planned block; the screens pass their own wording. */
  describe: (block: PlannedBlock) => string;
  /** Link back to the app, put in each event. */
  url?: string;
}

/** Every remaining study day of the plan as a calendar event with a 10-minute alert. */
export function planToIcs(goal: Goal, today: ISODate, opts: IcsOptions): string {
  const stamp = `${today.replace(/-/g, '')}T000000Z`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Goal Prep Planner//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const day of buildPlan(goal, today)) {
    const minutes = day.blocks.reduce((s, b) => s + b.minutes, 0);
    if (minutes === 0) continue;
    const details = day.blocks.map((b) => `• ${opts.describe(b)}: ${b.minutes} min`).join('\n') + (opts.url ? `\n\n${opts.url}` : '');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${goal.id}-${day.date}@goal-prep-planner`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDateTime(day.date, opts.time)}`,
      `DTEND:${addMinutes(day.date, opts.time, minutes)}`,
      `SUMMARY:${escape(opts.title)}`,
      `DESCRIPTION:${escape(details)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escape(opts.title)}`,
      'TRIGGER:-PT10M',
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

export interface ReminderEvent {
  title: string;
  details: string;
  /** First day of the reminder. */
  from: ISODate;
  /** Last day: the latest target date. */
  until: ISODate;
  time: string;
  minutes: number;
  /** Weekdays with no reminder (0 = Sunday). */
  restDays: number[];
}

/** A Google Calendar "add event" link for a reminder that repeats on study days until the target date. */
export function googleCalendarUrl(e: ReminderEvent): string {
  const days = WEEKDAY_CODES.filter((_, i) => !e.restDays.includes(i));
  const rule = `RRULE:FREQ=WEEKLY;BYDAY=${days.join(',')};UNTIL=${e.until.replace(/-/g, '')}T235959`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    details: e.details,
    dates: `${icsDateTime(e.from, e.time)}/${addMinutes(e.from, e.time, e.minutes)}`,
    recur: rule,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export const icsFileName = (goal: Goal) =>
  `${goal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'study-plan'}.ics`;
