import { useMemo, useState } from 'react';
import { formatDay, type ISODate } from '../lib/dates';
import { buildPlan, schedule } from '../lib/planner';
import { HORIZON_LABEL, LEVEL_LABEL, STRATEGIES } from '../lib/strategy';
import type { Goal } from '../lib/types';
import { Icon } from './Icon';
import { KIND_ICON, KIND_LABEL, blockName, formatMinutes } from './labels';

const PAGE = 14;

export function PlanView({ goal, today }: { goal: Goal; today: ISODate }) {
  const plan = useMemo(() => buildPlan(goal, today), [goal, today]);
  const sched = useMemo(() => schedule(goal), [goal]);
  const mocksLeft = [...sched.mockDates].filter((d) => d >= today).length;
  const [shown, setShown] = useState(PAGE);
  const revisionStart = plan.find((d) => d.phase === 'revise');

  if (plan.length === 0) return <div className="card"><p className="empty">No study days left before the target date.</p></div>;

  return (
    <div className="stack">
      <p className="muted">
        {plan.length} study days left.{' '}
        {revisionStart ? <>Revision starts {formatDay(revisionStart.date)}.</> : 'Too few days for a separate revision phase.'}{' '}
        The plan updates every day from what you actually log.
      </p>
      <div className="card strategy-card">
        <h3 className="with-icon">
          <span className="icon-badge"><Icon name="spark" size={16} /></span>
          How this plan works
        </h3>
        <p className="strategy-summary muted">
          {HORIZON_LABEL[sched.profile.horizon]} plan for {goal.type === 'exam' ? 'an exam' : 'an interview'}, starting level:{' '}
          {LEVEL_LABEL[sched.profile.level]}. {mocksLeft} {goal.type === 'exam' ? 'mock tests' : 'mock interviews'} to go, each followed by an
          analysis session, plus short spaced reviews of what you have already studied.
        </p>
        <details>
          <summary>Strategies this plan uses</summary>
          <ul className="strategy-list">
            {STRATEGIES.map((s) => (
              <li key={s.id}>
                <strong>{s.name}.</strong> {s.howApplied}{' '}
                <a className="small" href={s.source.url} target="_blank" rel="noreferrer">{s.source.label}</a>
              </li>
            ))}
          </ul>
        </details>
      </div>
      <div className="card">
        <ol className="plan-list">
          {plan.slice(0, shown).map((d) => (
            <li key={d.date} className={`${d.date === today ? 'is-today' : ''} phase-${d.phase}`}>
              <div className="plan-date">
                <strong>{d.date === today ? 'Today' : formatDay(d.date)}</strong>
                {d.phase === 'revise' && <span className="chip small">Revision</span>}
              </div>
              <ul className="plan-blocks">
                {d.blocks.map((b) => (
                  <li key={`${b.kind}-${b.skillId}`} className={`plan-block task-${b.kind}`}>
                    <span className="plan-block-icon" title={KIND_LABEL[b.kind]}><Icon name={KIND_ICON[b.kind]} size={14} /><span className="sr-only">{KIND_LABEL[b.kind]}:</span></span>
                    <span className="plan-block-name">{blockName(goal, b)}</span>
                    <span className="muted small">{formatMinutes(b.minutes)}</span>
                  </li>
                ))}
                {d.blocks.length === 0 && <li className="muted">Nothing planned</li>}
              </ul>
            </li>
          ))}
        </ol>
        {shown < plan.length && (
          <button className="ghost full" onClick={() => setShown((n) => n + PAGE)}>Show more days</button>
        )}
      </div>
    </div>
  );
}
