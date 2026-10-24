import { useMemo, useState } from 'react';
import { formatDay, type ISODate } from '../lib/dates';
import { buildPlan, entryKind, minutesOnDay, schedule } from '../lib/planner';
import { newId } from '../lib/storage';
import { focusSessions } from '../lib/strategy';
import type { BlockKind, Goal, PlannedBlock } from '../lib/types';
import { Icon } from './Icon';
import { KIND_ICON, KIND_LABEL, blockName, formatMinutes, kindHint, skillName } from './labels';
import { QuickRevision } from './QuickRevision';

interface Props {
  goal: Goal;
  today: ISODate;
  onChange: (goal: Goal) => void;
  onAdjust: () => void;
  onOpenNotes: () => void;
}

export function TodayView({ goal, today, onChange, onAdjust, onOpenNotes }: Props) {
  const plan = useMemo(() => buildPlan(goal, today), [goal, today]);
  const focusMinutes = useMemo(() => schedule(goal).profile.focusMinutes, [goal]);
  const day = plan[0]?.date === today ? plan[0] : undefined;
  const todaysLog = goal.log.filter((e) => e.date === today);
  const loggedToday = minutesOnDay(goal, today);

  const [extraSkill, setExtraSkill] = useState<string>(goal.skills[0]?.id ?? 'mock');
  const [extraMinutes, setExtraMinutes] = useState(30);

  const log = (skillId: string | null, minutes: number, kind?: BlockKind) => {
    if (minutes <= 0) return;
    onChange({ ...goal, log: [...goal.log, { id: newId(), date: today, skillId, minutes, kind }] });
  };

  const undo = (id: string) => onChange({ ...goal, log: goal.log.filter((e) => e.id !== id) });

  const loggedFor = (b: PlannedBlock) =>
    todaysLog.filter((e) => e.skillId === b.skillId && entryKind(e) === b.kind).reduce((s, e) => s + e.minutes, 0);

  const planned = day?.blocks.reduce((s, b) => s + b.minutes, 0) ?? 0;

  const showIntro = goal.prompt && goal.log.length === 0;

  return (
    <div className="stack">
      {showIntro && (
        <div className="intro">
          <p>
            Your plan for <strong>“{goal.prompt}”</strong>: {goal.skills.length} skills to cover by {formatDay(goal.targetDate)},{' '}
            {formatMinutes(goal.dailyMinutes)} a day.{' '}
            {goal.source === 'ai' ? 'Claude broke it down for this goal.' : 'Built from a standard breakdown for this kind of goal.'}
          </p>
          <button className="link" onClick={onAdjust}>Change skills, date or hours</button>
        </div>
      )}
      <QuickRevision goal={goal} today={today} todaysSkills={day?.blocks.map((b) => b.skillId) ?? []} onChange={onChange} onOpenNotes={onOpenNotes} />

      <div className="card">
        <div className="card-head">
          <h3 className="with-icon">
            <span className="icon-badge"><Icon name="sun" size={16} /></span>
            Today's mission <span className="muted head-date">{formatDay(today)}</span>
          </h3>
          {day && (
            <span className="muted small">
              {formatMinutes(Math.min(loggedToday, planned))} of {formatMinutes(planned)} done
            </span>
          )}
        </div>
        {day && <Progress value={planned ? Math.min(1, loggedToday / planned) : 0} />}

        {!day && plan.length === 0 && <p className="empty">The target date has passed. Good luck, or set a new goal.</p>}
        {!day && plan.length > 0 && <p className="empty">Rest day. Your next session is {formatDay(plan[0].date)}.</p>}
        {day && day.blocks.length === 0 && <p className="empty">Nothing planned. Add skills on the Skills tab to get a plan.</p>}

        {day && day.blocks.length > 0 && (
          <ul className="tasks">
            {day.blocks.map((b) => {
              const done = loggedFor(b);
              const complete = done >= b.minutes;
              const sessions = b.kind === 'mock' ? null : focusSessions(b.minutes, focusMinutes);
              return (
                <li key={`${b.kind}-${b.skillId}`} className={`task task-${b.kind} ${complete ? 'complete' : ''}`}>
                  <span className="task-icon"><Icon name={KIND_ICON[b.kind]} size={20} /></span>
                  <div className="task-main">
                    <div className="task-title">
                      <span className="kind">{KIND_LABEL[b.kind]}</span>
                      <span className="task-name">{blockName(goal, b)}</span>
                    </div>
                    <span className="task-hint muted small">
                      {kindHint(goal, b.kind)}
                      {sessions && <> · {sessions.count} × {sessions.minutes} min focus sessions</>}
                    </span>
                    <div className="task-progress">
                      <Progress value={Math.min(1, done / b.minutes)} />
                      <span className="muted small">{formatMinutes(Math.min(done, b.minutes))} / {formatMinutes(b.minutes)}</span>
                    </div>
                  </div>
                  <div className="task-actions">
                    <button className="ghost small" onClick={() => log(b.skillId, 15, b.kind)}>+15 min</button>
                    <button className="small done-btn" disabled={complete} onClick={() => log(b.skillId, b.minutes - done, b.kind)}>
                      <Icon name="check" size={14} /> {complete ? 'Done' : 'Mark done'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="card">
        <h3 className="with-icon">
          <span className="icon-badge"><Icon name="timer" size={16} /></span>
          Log other study time
        </h3>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            log(extraSkill === 'mock' ? null : extraSkill, extraMinutes);
          }}
        >
          <select aria-label="Skill" value={extraSkill} onChange={(e) => setExtraSkill(e.target.value)}>
            {goal.skills.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
            <option value="mock">{skillName(goal, null)}</option>
          </select>
          <input aria-label="Minutes" type="number" min={5} step={5} value={extraMinutes} onChange={(e) => setExtraMinutes(Number(e.target.value))} />
          <span className="muted">min</span>
          <button type="submit">Log</button>
        </form>

        {todaysLog.length > 0 && (
          <ul className="log-list">
            {todaysLog.map((e) => (
              <li key={e.id}>
                <span>
                  {blockName(goal, { skillId: e.skillId, minutes: e.minutes, kind: entryKind(e) })}
                  {e.skillId !== null && entryKind(e) !== 'learn' && <span className="muted"> · {KIND_LABEL[entryKind(e)].toLowerCase()}</span>}
                </span>
                <span className="muted">{formatMinutes(e.minutes)}</span>
                <button className="link" onClick={() => undo(e.id)}>Undo</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}
