import { useMemo } from 'react';
import { formatDay, type ISODate } from '../lib/dates';
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
}

const PACE = {
  'on-track': { label: 'On track', tone: 'good' },
  tight: { label: 'Tight', tone: 'warning' },
  behind: { label: 'Behind', tone: 'critical' },
  done: { label: 'All study done', tone: 'good' },
  overdue: { label: 'Target passed', tone: 'critical' },
} as const;

/** Every plan on this device, active ones first, with a way to start another. */
export function Home({ goals, today, onOpen, onNew }: Props) {
  const { active, past } = useMemo(() => groupPlans(goals, today), [goals, today]);
  const leftToday = active.reduce((s, p) => s + Math.max(0, p.today.planned - p.today.logged), 0);

  return (
    <div className="stack">
      <div className="home-head">
        <div>
          <h2>Your plans</h2>
          <p className="muted">
            {active.length === 0
              ? 'No active plans. Start one for your next exam or interview.'
              : leftToday > 0
                ? `${formatMinutes(leftToday)} of study left today across ${active.length === 1 ? 'your plan' : `${active.length} plans`}.`
                : 'Nothing left for today. Nice work.'}
          </p>
        </div>
        <button onClick={onNew}><Icon name="plus" size={16} /> New plan</button>
      </div>

      <section aria-labelledby="active-plans">
        <h3 id="active-plans" className="home-section">Active <span className="pill-count">{active.length}</span></h3>
        <div className="plan-grid">
          {active.map((p) => <PlanCard key={p.goal.id} plan={p} onOpen={onOpen} />)}
          <button className="plan-new" onClick={onNew}>
            <span className="plan-new-icon"><Icon name="plus" size={22} /></span>
            <strong>New plan</strong>
            <span className="muted small">An exam or an interview, in one sentence</span>
          </button>
        </div>
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-plans">
          <h3 id="past-plans" className="home-section">Past <span className="pill-count">{past.length}</span></h3>
          <div className="plan-grid">
            {past.map((p) => <PlanCard key={p.goal.id} plan={p} onOpen={onOpen} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function PlanCard({ plan, onOpen }: { plan: PlanSummary; onOpen: (id: string) => void }) {
  const { goal, daysLeft, readiness } = plan;
  const theme = themeFor(goal);
  const past = daysLeft < 0;
  const pace = PACE[plan.pace];
  const todayLine = past
    ? `Ended ${formatDay(goal.targetDate)}`
    : plan.today.planned === 0
      ? 'Rest day today'
      : plan.today.logged >= plan.today.planned
        ? `Today done · ${formatMinutes(plan.today.logged)}`
        : `Today ${formatMinutes(plan.today.logged)} of ${formatMinutes(plan.today.planned)}`;

  return (
    <button
      className={`plan-card ${past ? 'past' : ''}`}
      style={{ ['--t1' as string]: theme.from, ['--t2' as string]: theme.to }}
      onClick={() => onOpen(goal.id)}
      aria-label={`Open ${goal.name}`}
    >
      <div className="plan-card-band">
        <Icon name={theme.icon} size={90} className="plan-card-art" />
        <span className="plan-card-path"><Icon name={theme.icon} size={13} /> {theme.label}</span>
        <strong className="plan-card-name">{goal.name}</strong>
        <span className="plan-card-when">
          {past ? 'Finished' : daysLeft === 0 ? 'Today!' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} to go`}
          {' · '}{formatDay(goal.targetDate)}
        </span>
      </div>
      <div className="plan-card-body">
        <div className="plan-card-ready">
          <span><strong>{readiness}%</strong> ready</span>
          {!past && <span className={`plan-pace pace-${pace.tone}`}>{pace.label}</span>}
        </div>
        <div className="progress"><div style={{ width: `${readiness}%` }} /></div>
        <div className="plan-card-facts muted small">
          <span><Icon name={past ? 'flag' : 'sun'} size={13} /> {todayLine}</span>
          {past
            ? <span><Icon name="timer" size={13} /> {formatMinutes(plan.totalMinutes)} studied</span>
            : <span><Icon name="flame" size={13} /> {plan.streak ? `${plan.streak} day streak` : 'No streak yet'}</span>}
        </div>
      </div>
    </button>
  );
}
