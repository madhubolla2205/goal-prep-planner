import { useState } from 'react';
import type { ISODate } from '../lib/dates';
import { markRevised, newNote, quickRevision, revisedOn, unmarkRevised } from '../lib/notes';
import type { Goal, Note } from '../lib/types';
import { Icon } from './Icon';
import { skillName } from './labels';

interface Props {
  goal: Goal;
  today: ISODate;
  /** Skills on today's plan, whose points come up first. */
  todaysSkills: (string | null)[];
  onChange: (goal: Goal) => void;
  onOpenNotes: () => void;
}

/** A two-minute run through the person's points to remember, before the day's study. */
export function QuickRevision({ goal, today, todaysSkills, onChange, onOpenNotes }: Props) {
  const [draft, setDraft] = useState('');
  const picks = quickRevision(goal, today, todaysSkills);
  const total = goal.notes?.length ?? 0;
  const doneCount = picks.filter((n) => revisedOn(n, today)).length;
  const allDone = picks.length > 0 && doneCount === picks.length;

  const updateNotes = (fn: (n: Note) => Note, ids: Set<string>) =>
    onChange({ ...goal, notes: (goal.notes ?? []).map((n) => (ids.has(n.id) ? fn(n) : n)) });

  const toggle = (n: Note) =>
    updateNotes((x) => (revisedOn(x, today) ? unmarkRevised(x, today) : markRevised(x, today)), new Set([n.id]));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onChange({ ...goal, notes: [...(goal.notes ?? []), newNote(draft, null, today)] });
    setDraft('');
  };

  return (
    <section className={`card revision-card ${allDone ? 'is-done' : ''}`}>
      <div className="card-head">
        <h3 className="with-icon">
          <span className="icon-badge"><Icon name="bulb" size={16} /></span>
          Quick revision
        </h3>
        {picks.length > 0 && (
          <span className="muted small">{allDone ? 'Done for today. Nice start!' : `${doneCount} of ${picks.length} gone through`}</span>
        )}
      </div>

      {picks.length === 0 ? (
        <div className="revision-empty">
          <p>
            Keep your <strong>points to remember</strong> here: formulas you forget, mistakes you repeat, things to say in the room.
            A few come up every morning for a two-minute warm-up before you start.
          </p>
          <form className="inline-form" onSubmit={add}>
            <input aria-label="New point to remember" placeholder="Add your first point to remember" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <button type="submit" disabled={!draft.trim()}><Icon name="plus" size={16} /> Add</button>
          </form>
          <button className="link small" onClick={onOpenNotes}>See suggested points for this path</button>
        </div>
      ) : (
        <>
          <p className="muted small revision-sub">Read each one, say it back without looking, then tick it.</p>
          <ul className="revision-list">
            {picks.map((n) => {
              const done = revisedOn(n, today);
              return (
                <li key={n.id} className={done ? 'done' : ''}>
                  <button className="tick" aria-pressed={done} aria-label={done ? 'Mark as not revised' : 'Mark as revised'} onClick={() => toggle(n)}>
                    {done && <Icon name="check" size={14} />}
                  </button>
                  <span className="revision-text">
                    {n.text}
                    <span className="revision-meta">
                      {n.pinned && <span className="pin-tag"><Icon name="star" size={11} /> Pinned</span>}
                      {n.skillId !== null && <span className="skill-tag">{skillName(goal, n.skillId)}</span>}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="revision-foot">
            {!allDone && (
              <button className="small" onClick={() => updateNotes((x) => markRevised(x, today), new Set(picks.map((p) => p.id)))}>
                <Icon name="check" size={14} /> All revised
              </button>
            )}
            <button className="link small" onClick={onOpenNotes}>
              {total > picks.length ? `All ${total} points` : 'Add or edit points'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
