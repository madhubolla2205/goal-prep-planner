import { useState } from 'react';
import { googleCalendarUrl } from '../lib/calendar';
import type { ISODate } from '../lib/dates';
import { isNativeApp } from '../lib/device';
import { t } from '../lib/i18n';
import type { ReminderSettings } from '../lib/reminders';
import { appBaseUrl } from '../lib/sharing';
import type { Goal } from '../lib/types';
import { Icon } from './Icon';

export const APK_URL = 'https://github.com/madhubolla2205/goal-prep-planner/releases/latest/download/goal-prep-planner.apk';

interface Props {
  goals: Goal[];
  today: ISODate;
  settings: ReminderSettings;
  onChange: (settings: ReminderSettings) => void;
}

/**
 * The daily reminder: a notification in the Android app; on the website,
 * where nothing can notify while the page is closed, a repeating event in
 * Google Calendar and a link to the app.
 */
export function ReminderCard({ goals, today, settings, onChange }: Props) {
  const native = isNativeApp();
  const [blocked, setBlocked] = useState(false);
  const active = goals.filter((g) => g.targetDate >= today);
  if (active.length === 0) return null;

  const toggle = async (enabled: boolean) => {
    setBlocked(false);
    if (enabled) {
      const { allowNotifications } = await import('../lib/nativeReminders');
      if (!(await allowNotifications())) {
        setBlocked(true);
        return;
      }
    }
    onChange({ ...settings, enabled });
  };

  const calendar = googleCalendarUrl({
    title: t('reminderNotifTitle'),
    details: `${active.map((g) => g.name).join(', ')}\n${appBaseUrl()}`,
    from: today,
    until: active.reduce((last, g) => (g.targetDate > last ? g.targetDate : last), today),
    time: settings.time,
    minutes: 15,
    // Skip only the days every plan takes off.
    restDays: [0, 1, 2, 3, 4, 5, 6].filter((d) => active.every((g) => g.restDays.includes(d))),
  });

  return (
    <div className="card reminder-card">
      <h3 className="with-icon"><span className="icon-badge"><Icon name="bell" size={16} /></span>{t('reminderTitle')}</h3>
      <p className="muted small">{native ? t('reminderHintApp') : t('reminderHintWeb')}</p>
      <div className="data-actions">
        {native && (
          <label className="switch">
            <input type="checkbox" checked={settings.enabled} onChange={(e) => void toggle(e.target.checked)} />
            {t('reminderOn')}
          </label>
        )}
        <label className="inline-label">
          {t('reminderAt')}
          <input type="time" value={settings.time} onChange={(e) => e.target.value && onChange({ ...settings, time: e.target.value })} />
        </label>
        {!native && (
          <>
            <a className="button" href={APK_URL}><Icon name="phone" size={16} /> {t('getAndroidApp')}</a>
            <a className="button ghost" href={calendar} target="_blank" rel="noreferrer"><Icon name="calendar" size={16} /> {t('googleCalendar')}</a>
          </>
        )}
      </div>
      {blocked && <p className="data-error small" role="alert">{t('reminderBlocked')}</p>}
    </div>
  );
}
