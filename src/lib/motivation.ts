import { addDays, daysBetween, weekday, type ISODate } from './dates';
import { t } from './i18n';
import { minutesOnDay } from './planner';
import type { Goal, RoleModel } from './types';

// Role models, the person's "why", and the small celebrations. All of it is
// the person's own words, kept with the plan on this device.

/** The name a role model goes by on screen; a note to oneself has a fixed one. */
export const modelName = (m: RoleModel): string => (m.self ? t('futureSelfName') : m.name);

/** Most role models a plan keeps; each can carry a photo, and storage is the browser's. */
export const MAX_ROLE_MODELS = 6;

/** The role model for a day. With several, a different one comes up each day, in turn. */
export function roleModelFor(goal: Goal, date: ISODate): RoleModel | null {
  const models = goal.roleModels ?? [];
  if (models.length === 0) return null;
  const n = models.length;
  return models[((daysBetween(goal.startDate, date) % n) + n) % n];
}

/**
 * Study days in a row, just before today, with nothing logged. Rest days are
 * skipped over, and days before the plan started don't count.
 */
export function missedStudyDays(goal: Goal, today: ISODate): number {
  let count = 0;
  for (let day = addDays(today, -1); day >= goal.startDate; day = addDays(day, -1)) {
    if (goal.restDays.includes(weekday(day))) continue;
    if (minutesOnDay(goal, day) > 0) break;
    count++;
  }
  return count;
}

/** Missed study days in a row after which the person's "why" comes up on Today. */
export const MISSED_DAYS_FOR_WHY = 2;

/**
 * Whether today finishes a week of study: every study day of this week
 * (Monday to Sunday) up to today has time logged, and no study day is left
 * this week. Called once today's plan is done.
 */
export function finishesWeek(goal: Goal, today: ISODate): boolean {
  const monday = addDays(today, -((weekday(today) + 6) % 7));
  const sunday = addDays(monday, 6);
  const isStudyDay = (d: ISODate) => d >= goal.startDate && d <= goal.targetDate && !goal.restDays.includes(weekday(d));
  let studyDays = 0;
  for (let d = monday; d <= sunday; d = addDays(d, 1)) {
    if (!isStudyDay(d)) continue;
    if (d > today) return false;
    if (minutesOnDay(goal, d) === 0) return false;
    studyDays++;
  }
  // A plan that started this Saturday hasn't had a week yet.
  return studyDays >= 3;
}

/** A role model's quote for a notification title, shortened to fit on one line. */
export function reminderLine(model: RoleModel, name: string): string {
  const quote = model.quote.trim();
  if (!quote) return name;
  const short = quote.length > 70 ? `${quote.slice(0, 67).trimEnd()}…` : quote;
  return `${name}: “${short}”`;
}

/** Side of the square a role model's photo is shrunk to, in pixels. */
const PHOTO_SIZE = 192;

/**
 * Shrinks a picked photo to a small centre-cropped square JPEG, a few
 * kilobytes, so that it fits in the browser's storage and in backups.
 */
export async function shrinkPhoto(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = PHOTO_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.8);
}
