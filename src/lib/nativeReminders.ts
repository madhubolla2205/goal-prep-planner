// Android notifications for the daily reminder. Loaded only in the Android
// app, so the website doesn't carry the plugin.

import { LocalNotifications } from '@capacitor/local-notifications';
import type { ISODate } from './dates';
import { reminderTime, type DayReminder } from './reminders';

/** Reminder notifications use ids from here up, one per day ahead. */
const FIRST_ID = 1000;
const DAYS_AHEAD = 31;

/** Asks for notification permission if needed; resolves to whether it was given. */
export async function allowNotifications(): Promise<boolean> {
  const status = await LocalNotifications.checkPermissions();
  if (status.display === 'granted') return true;
  return (await LocalNotifications.requestPermissions()).display === 'granted';
}

async function cancelAll(): Promise<void> {
  const ids = Array.from({ length: DAYS_AHEAD }, (_, i) => ({ id: FIRST_ID + i }));
  await LocalNotifications.cancel({ notifications: ids });
}

/**
 * Replaces the scheduled reminders with one per upcoming study day. Only
 * days whose reminder time is still ahead are scheduled.
 */
export async function scheduleReminders(
  days: DayReminder[],
  time: string | null,
  text: (day: DayReminder) => { title: string; body: string },
): Promise<void> {
  await cancelAll();
  if (time === null) return;
  if ((await LocalNotifications.checkPermissions()).display !== 'granted') return;
  const now = Date.now();
  const notifications = days
    .slice(0, DAYS_AHEAD)
    .map((day, i) => ({ day, i, at: reminderTime(day.date as ISODate, time) }))
    .filter(({ at }) => at.getTime() > now)
    .map(({ day, i, at }) => ({
      id: FIRST_ID + i,
      ...text(day),
      schedule: { at, allowWhileIdle: true },
      smallIcon: 'ic_stat_notify',
      isExactNotification: false,
    }));
  if (notifications.length) await LocalNotifications.schedule({ notifications });
}
