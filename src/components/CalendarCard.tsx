import { useState } from 'react';
import { googleCalendarUrl, icsFileName, planToIcs } from '../lib/calendar';
import type { ISODate } from '../lib/dates';
import { t } from '../lib/i18n';
import { buildPlan } from '../lib/planner';
import { loadReminder } from '../lib/reminders';
import { appBaseUrl, deliverFile } from '../lib/sharing';
import type { Goal } from '../lib/types';
import { Icon } from './Icon';
import { blockName } from './labels';

/** The plan's study sessions in the person's own calendar. */
export function CalendarCard({ goal, today }: { goal: Goal; today: ISODate }) {
  const [time, setTime] = useState(() => loadReminder().time);
  const title = t('calendarEventTitle', { name: goal.name });
  const firstDay = buildPlan(goal, today).find((d) => d.blocks.length > 0);
  if (!firstDay) return null;

  const google = googleCalendarUrl({
    title,
    details: `${goal.name}\n${appBaseUrl()}`,
    from: firstDay.date,
    until: goal.targetDate,
    time,
    minutes: goal.dailyMinutes,
    restDays: goal.restDays,
  });

  const ics = () => {
    const text = planToIcs(goal, today, { time, title, describe: (b) => blockName(goal, b), url: appBaseUrl() });
    void deliverFile(new Blob([text], { type: 'text/calendar' }), icsFileName(goal), title);
  };

  return (
    <div className="card">
      <h3 className="with-icon"><span className="icon-badge"><Icon name="calendar" size={16} /></span>{t('calendarTitle')}</h3>
      <p className="muted small">{t('calendarHint')}</p>
      <div className="data-actions calendar-actions">
        <label className="inline-label">
          {t('studyTime')}
          <input type="time" value={time} onChange={(e) => e.target.value && setTime(e.target.value)} />
        </label>
        <a className="button" href={google} target="_blank" rel="noreferrer"><Icon name="calendar" size={16} /> {t('googleCalendar')}</a>
        <button type="button" className="ghost" onClick={ics}><Icon name="download" size={16} /> {t('downloadIcs')}</button>
      </div>
      <p className="muted small">{t('icsHint')}</p>
    </div>
  );
}
