import { useMemo } from 'react';
import { daysBetween, formatDay, type ISODate } from '../lib/dates';
import { t } from '../lib/i18n';
import { buildPlan, minutesOnDay, overallReadiness, schedule, streak } from '../lib/planner';
import type { PathTheme } from '../lib/themes';
import type { Goal } from '../lib/types';
import { Icon } from './Icon';

interface Props {
  goal: Goal;
  theme: PathTheme;
  today: ISODate;
}

/** The goal's banner: path, countdown, headline numbers and the road to the target date. */
export function Hero({ goal, theme, today }: Props) {
  const sched = useMemo(() => schedule(goal), [goal]);
  const plan = useMemo(() => buildPlan(goal, today), [goal, today]);
  const daysLeft = daysBetween(today, goal.targetDate);
  const span = Math.max(1, daysBetween(goal.startDate, goal.targetDate));
  const elapsed = Math.min(1, Math.max(0, daysBetween(goal.startDate, today) / span));
  const day = plan[0]?.date === today ? plan[0] : undefined;
  const planned = day?.blocks.reduce((s, b) => s + b.minutes, 0) ?? 0;
  const todayShare = planned ? Math.min(1, minutesOnDay(goal, today) / planned) : 0;
  const days = streak(goal, today);

  const at = (d: ISODate) => `${Math.min(100, Math.max(0, (daysBetween(goal.startDate, d) / span) * 100))}%`;

  return (
    <section className="hero">
      <Icon name={theme.icon} size={220} className="hero-art" />
      <div className="hero-top">
        <div className="hero-title">
          <span className="hero-path"><Icon name={theme.icon} size={14} /> {theme.label} path</span>
          <h2>{goal.name}</h2>
          <p className="hero-tagline">{theme.tagline}</p>
        </div>
        <Countdown daysLeft={daysLeft} elapsed={elapsed} />
      </div>

      <div className="hero-stats">
        <Stat icon="target" value={`${overallReadiness(goal)}%`} label={t('heroReady')} />
        <Stat icon="flame" value={String(days)} label={t('heroStreak')} />
        <Stat icon="sun" value={day ? `${Math.round(todayShare * 100)}%` : t('heroRest')} label={t('heroToday')} />
        <Stat icon="timer" value={`${Math.round(goal.dailyMinutes / 6) / 10} h`} label={t('heroPerDay')} />
      </div>

      <div className="journey" aria-label={`Journey from ${formatDay(goal.startDate)} to ${formatDay(goal.targetDate)}`}>
        <div className="journey-track">
          <div className="journey-done" style={{ width: `${elapsed * 100}%` }} />
          {sched.revisionStart && <div className="journey-revise" style={{ left: at(sched.revisionStart) }} />}
          {[...sched.mockDates].map((d) => (
            <span key={d} className={`journey-mock ${d < today ? 'past' : ''}`} style={{ left: at(d) }} title={`Mock · ${formatDay(d)}`} />
          ))}
          <span className="journey-you" style={{ left: `${elapsed * 100}%` }}><span>You</span></span>
        </div>
        <div className="journey-labels">
          <span>Start</span>
          {sched.revisionStart && <span style={{ left: at(sched.revisionStart) }} className="journey-label-mid">Revision</span>}
          <span><Icon name="flag" size={12} /> {formatDay(goal.targetDate)}</span>
        </div>
      </div>
    </section>
  );
}

function Countdown({ daysLeft, elapsed }: { daysLeft: number; elapsed: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div className="countdown-ring" role="img" aria-label={daysLeft > 0 ? `${daysLeft} days to go` : 'Target date reached'}>
      <svg viewBox="0 0 100 100" width="104" height="104">
        <circle cx="50" cy="50" r={r} className="ring-track" />
        <circle cx="50" cy="50" r={r} className="ring-fill" strokeDasharray={c} strokeDashoffset={c * (1 - elapsed)} />
      </svg>
      <div className="ring-text">
        {daysLeft > 0 ? <><strong>{daysLeft}</strong><span>{t('ringDaysToGo')}</span></> : <strong className="ring-today">{daysLeft === 0 ? t('targetToday') : t('ringDone')}</strong>}
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: 'target' | 'flame' | 'sun' | 'timer'; value: string; label: string }) {
  return (
    <div className="hero-stat">
      <Icon name={icon} size={16} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
