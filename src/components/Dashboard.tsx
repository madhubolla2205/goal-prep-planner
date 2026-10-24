import { useMemo } from 'react';
import { formatDay, type ISODate } from '../lib/dates';
import { overallReadiness, pace, recentActivity, remainingMinutes, skillReadiness, streak } from '../lib/planner';
import type { Goal } from '../lib/types';
import { Icon } from './Icon';
import { formatMinutes } from './labels';

const PACE_LABEL = {
  'on-track': { icon: '✓', label: 'On track', tone: 'good' },
  tight: { icon: '!', label: 'Tight', tone: 'warning' },
  behind: { icon: '!', label: 'Behind', tone: 'critical' },
  done: { icon: '✓', label: 'All study done', tone: 'good' },
  overdue: { icon: '×', label: 'Target passed', tone: 'critical' },
} as const;

const ACTIVITY_DAYS = 14;

export function Dashboard({ goal, today }: { goal: Goal; today: ISODate }) {
  const p = useMemo(() => pace(goal, today), [goal, today]);
  const activity = useMemo(() => recentActivity(goal, today, ACTIVITY_DAYS), [goal, today]);
  const readiness = overallReadiness(goal);
  const days = streak(goal, today);
  const lastWeek = activity.slice(-7).reduce((s, d) => s + d.minutes, 0);
  const status = PACE_LABEL[p.status];
  const peak = Math.max(goal.dailyMinutes, ...activity.map((d) => d.minutes));

  const skills = goal.skills
    .map((s) => ({ skill: s, readiness: skillReadiness(goal, s), left: remainingMinutes(goal, s) }))
    .sort((a, b) => a.readiness - b.readiness);

  return (
    <div className="stack">
      <div className="tiles">
        <div className="tile">
          <span className="tile-label"><span className="icon-badge"><Icon name="target" size={14} /></span>Readiness</span>
          <span className="tile-value">{readiness}%</span>
          <span className="muted small">Weighted by skill importance</span>
        </div>
        <div className="tile">
          <span className="tile-label"><span className="icon-badge"><Icon name="timer" size={14} /></span>Pace</span>
          <span className={`tile-value status status-${status.tone}`}>
            <span aria-hidden="true" className="status-icon">{status.icon}</span>{status.label}
          </span>
          <span className="muted small">
            {p.status === 'done' || p.status === 'overdue'
              ? `${formatMinutes(p.remainingMinutes)} left`
              : `Needs ${formatMinutes(p.requiredDailyMinutes)}/day, you planned ${formatMinutes(goal.dailyMinutes)}`}
          </span>
        </div>
        <div className="tile">
          <span className="tile-label"><span className="icon-badge"><Icon name="flame" size={14} /></span>Streak</span>
          <span className="tile-value">{days} {days === 1 ? 'day' : 'days'}</span>
          <span className="muted small">Rest days don't break it</span>
        </div>
        <div className="tile">
          <span className="tile-label"><span className="icon-badge"><Icon name="calendar" size={14} /></span>Last 7 days</span>
          <span className="tile-value">{formatMinutes(lastWeek)}</span>
          <span className="muted small">{formatMinutes(p.remainingMinutes)} of study left</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Study time, last {ACTIVITY_DAYS} days</h3>
          <span className="legend"><span className="legend-line" /> Daily target</span>
        </div>
        <div className="bars" style={{ ['--target-frac' as string]: goal.dailyMinutes / peak }}>
          {activity.map((d) => (
            <div key={d.date} className="bar-col" tabIndex={0}>
              <div className="bar-track">
                {d.minutes > 0 && <div className="bar" style={{ height: `${(d.minutes / peak) * 100}%` }} />}
              </div>
              <span className="tip">{formatDay(d.date)}<br /><strong>{formatMinutes(d.minutes)}</strong></span>
              <span className="bar-label">
                <span className="label-long">{d.date === today ? 'Today' : formatDay(d.date).split(',')[0]}</span>
                <span className="label-short">{formatDay(d.date).charAt(0)}</span>
              </span>
            </div>
          ))}
          <div className="target-line" aria-hidden="true" />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Readiness by skill</h3>
          <span className="muted small">Weakest first</span>
        </div>
        {skills.length === 0 && <p className="empty">Add skills to see readiness.</p>}
        <ul className="skill-bars">
          {skills.map(({ skill, readiness: r, left }) => (
            <li key={skill.id}>
              <div className="skill-bar-head">
                <span>{skill.name}</span>
                <span className="muted small">{r}% · {left ? `${formatMinutes(left)} left` : 'covered'}</span>
              </div>
              <div className="progress"><div style={{ width: `${r}%` }} /></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
