import { useMemo, type ReactNode } from 'react';
import { formatDay, type ISODate } from '../lib/dates';
import { t, type Key } from '../lib/i18n';
import { groupPlans, type PlanSummary } from '../lib/plans';
import { themeFor } from '../lib/themes';
import { Icon } from './Icon';
import { formatMinutes } from './labels';
import type { Goal } from '../lib/types';

interface Props {
  goals: Goal[];
  today: ISODate;
  onOpen: (id: string) => void;
  onNew: () => void;
  /** Shown under the plans. */
  children?: ReactNode;
}

const PACE: Record<PlanSummary['pace'], { label: Key; tone: string }> = {
  'on-track': { label: 'paceOnTrack', tone: 'good' },
  tight: { label: 'paceTight', tone: 'warning' },
  behind: { label: 'paceBehind', tone: 'critical' },
  done: { label: 'paceDone', tone: 'good' },
  overdue: { label: 'paceOverdue', tone: 'critical' },
};

/** Every plan on this device, active ones first, with a way to start another. */
export function Home({ goals, today, onOpen, onNew, children }: Props) {
  const { active, past } = useMemo(() => groupPlans(goals, today), [goals, today]);
  const leftToday = active.reduce((s, p) => s + Math.max(0, p.today.planned - p.today.logged), 0);

  return (
    <div className="stack">
      <div className="home-head">
        <div>
          <h2>{t('yourPlans')}</h2>
          <p className="muted">
            {active.length === 0
              ? t('noActivePlans')
              : leftToday > 0
                ? active.length === 1
                  ? t('leftTodayOne', { time: formatMinutes(leftToday) })
                  : t('leftTodayMany', { time: formatMinutes(leftToday), n: active.length })
                : t('allDoneToday')}
          </p>
        </div>
        <button onClick={onNew}><Icon name="plus" size={16} /> {t('newPlan')}</button>
      </div>

      <section aria-labelledby="active-plans">
        <h3 id="active-plans" className="home-section">{t('active')} <span className="pill-count">{active.length}</span></h3>
        <div className="plan-grid">
          {active.map((p) => <PlanCard key={p.goal.id} plan={p} onOpen={onOpen} />)}
          <button className="plan-new" onClick={onNew}>
            <span className="plan-new-icon"><Icon name="plus" size={22} /></span>
            <strong>{t('newPlan')}</strong>
            <span className="muted small">{t('newPlanHint')}</span>
          </button>
        </div>
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-plans">
          <h3 id="past-plans" className="home-section">{t('past')} <span className="pill-count">{past.length}</span></h3>
          <div className="plan-grid">
            {past.map((p) => <PlanCard key={p.goal.id} plan={p} onOpen={onOpen} />)}
          </div>
        </section>
      )}

      {children}
    </div>
  );
}

function PlanCard({ plan, onOpen }: { plan: PlanSummary; onOpen: (id: string) => void }) {
  const { goal, daysLeft, readiness } = plan;
  const theme = themeFor(goal);
  const past = daysLeft < 0;
  const pace = PACE[plan.pace];
  const todayLine = past
    ? t('endedOn', { date: formatDay(goal.targetDate) })
    : plan.today.planned === 0
      ? t('restDayToday')
      : plan.today.logged >= plan.today.planned
        ? t('todayDone', { time: formatMinutes(plan.today.logged) })
        : t('todayProgress', { done: formatMinutes(plan.today.logged), planned: formatMinutes(plan.today.planned) });

  return (
    <button
      className={`plan-card ${past ? 'past' : ''}`}
      style={{ ['--t1' as string]: theme.from, ['--t2' as string]: theme.to }}
      onClick={() => onOpen(goal.id)}
      aria-label={t('openPlan', { name: goal.name })}
    >
      <div className="plan-card-band">
        <Icon name={theme.icon} size={90} className="plan-card-art" />
        <span className="plan-card-path"><Icon name={theme.icon} size={13} /> {theme.label}</span>
        <strong className="plan-card-name">{goal.name}</strong>
        <span className="plan-card-when">
          {past ? t('finished') : daysLeft === 0 ? t('targetToday') : daysLeft === 1 ? t('oneDayToGo') : t('daysToGo', { n: daysLeft })}
          {' · '}{formatDay(goal.targetDate)}
        </span>
      </div>
      <div className="plan-card-body">
        <div className="plan-card-ready">
          <span><strong>{readiness}%</strong> {t('ready')}</span>
          {!past && <span className={`plan-pace pace-${pace.tone}`}>{t(pace.label)}</span>}
        </div>
        <div className="progress"><div style={{ width: `${readiness}%` }} /></div>
        <div className="plan-card-facts muted small">
          <span><Icon name={past ? 'flag' : 'sun'} size={13} /> {todayLine}</span>
          {past
            ? <span><Icon name="timer" size={13} /> {t('studiedTotal', { time: formatMinutes(plan.totalMinutes) })}</span>
            : <span><Icon name="flame" size={13} /> {plan.streak ? t('dayStreak', { n: plan.streak }) : t('noStreak')}</span>}
        </div>
      </div>
    </button>
  );
}
