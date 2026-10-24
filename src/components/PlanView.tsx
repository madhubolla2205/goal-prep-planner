import { useMemo, useState } from 'react';
import { formatDay, type ISODate } from '../lib/dates';
import { buildPlan } from '../lib/planner';
import type { Goal } from '../lib/types';
import { KIND_LABEL, formatMinutes, skillName } from './labels';

const PAGE = 14;

export function PlanView({ goal, today }: { goal: Goal; today: ISODate }) {
  const plan = useMemo(() => buildPlan(goal, today), [goal, today]);
  const [shown, setShown] = useState(PAGE);
  const revisionStart = plan.find((d) => d.phase === 'revise');

  if (plan.length === 0) return <div className="card"><p className="empty">No study days left before the target date.</p></div>;

  return (
    <div className="stack">
      <p className="muted">
        {plan.length} study days left.{' '}
        {revisionStart ? <>Revision and mock tests start {formatDay(revisionStart.date)}.</> : 'Too few days for a separate revision phase.'}{' '}
        The plan updates every day from what you actually log.
      </p>
      <div className="card">
        <ol className="plan-list">
          {plan.slice(0, shown).map((d) => (
            <li key={d.date} className={d.date === today ? 'is-today' : ''}>
              <div className="plan-date">
                <strong>{d.date === today ? 'Today' : formatDay(d.date)}</strong>
                {d.phase === 'revise' && <span className="chip small">Revision</span>}
              </div>
              <ul className="plan-blocks">
                {d.blocks.map((b) => (
                  <li key={`${b.kind}-${b.skillId}`}>
                    <span className={`kind kind-${b.kind}`}>{KIND_LABEL[b.kind]}</span>
                    {skillName(goal, b.skillId)}
                    <span className="muted"> · {formatMinutes(b.minutes)}</span>
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
