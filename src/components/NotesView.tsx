import { useState } from 'react';
import { formatDay, type ISODate } from '../lib/dates';
import { STARTER_POINTS, newNote } from '../lib/notes';
import type { PathTheme } from '../lib/themes';
import type { Goal, Note } from '../lib/types';
import { Icon } from './Icon';
import { skillName } from './labels';

interface Props {
  goal: Goal;
  theme: PathTheme;
  today: ISODate;
  onChange: (goal: Goal) => void;
}

type Filter = 'all' | 'general' | string;

export function NotesView({ goal, theme, today, onChange }: Props) {
  const notes = goal.notes ?? [];
  const [text, setText] = useState('');
  const [skillId, setSkillId] = useState<string>('general');
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);

  const setNotes = (next: Note[]) => onChange({ ...goal, notes: next });
  const patch = (id: string, p: Partial<Note>) => setNotes(notes.map((n) => (n.id === id ? { ...n, ...p } : n)));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setNotes([...notes, newNote(text, skillId === 'general' ? null : skillId, today)]);
    setText('');
  };

  const remove = (id: string) => {
    if (!confirm('Delete this point?')) return;
    setNotes(notes.filter((n) => n.id !== id));
  };

  const saveEdit = () => {
    if (editing && editing.text.trim()) patch(editing.id, { text: editing.text.trim() });
    setEditing(null);
  };

  const have = new Set(notes.map((n) => n.text.toLowerCase()));
  const suggestions = STARTER_POINTS[theme.id].filter((s) => !have.has(s.toLowerCase()));

  const count = (f: Filter) => notes.filter((n) => matches(n, f)).length;
  const shown = notes
    .filter((n) => matches(n, filter))
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'general', label: 'General' },
    ...goal.skills.map((s) => ({ id: s.id, label: s.name })),
  ].filter((f) => f.id === 'all' || count(f.id) > 0);

  return (
    <div className="stack">
      <div className="card notes-intro">
        <h3 className="with-icon">
          <span className="icon-badge"><Icon name="bulb" size={16} /></span>
          Points to remember
        </h3>
        <p className="muted">
          Your own short notes for this goal. Five of them come up in the quick revision at the top of Today, pinned ones every day,
          then the ones on today's skills and the ones you haven't seen for longest.
        </p>
        <form className="note-form" onSubmit={add}>
          <textarea
            aria-label="New point to remember"
            placeholder="e.g. Sliding window when the question says “longest substring”"
            value={text}
            rows={2}
            maxLength={280}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className="note-form-row">
            <select aria-label="Skill" value={skillId} onChange={(e) => setSkillId(e.target.value)}>
              <option value="general">General</option>
              {goal.skills.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button type="submit" disabled={!text.trim()}><Icon name="plus" size={16} /> Add point</button>
          </div>
        </form>
      </div>

      {suggestions.length > 0 && (
        <div className="card suggestions">
          <h3 className="with-icon">
            <span className="icon-badge"><Icon name="spark" size={16} /></span>
            Suggested for the {theme.label.toLowerCase()} path
          </h3>
          <p className="muted small">Tap one to add it, then make it your own.</p>
          <div className="suggestion-list">
            {suggestions.map((s) => (
              <button key={s} className="suggestion" onClick={() => setNotes([...notes, newNote(s, null, today)])}>
                <Icon name="plus" size={14} /> {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div className="card">
          <div className="filter-row" role="group" aria-label="Filter by skill">
            {filters.map((f) => (
              <button key={f.id} className={`pill ${filter === f.id ? 'on' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label} <span className="pill-count">{count(f.id)}</span>
              </button>
            ))}
          </div>
          <ul className="note-list">
            {shown.map((n) => (
              <li key={n.id} className={n.pinned ? 'pinned' : ''}>
                <button
                  className={`star ${n.pinned ? 'on' : ''}`}
                  aria-pressed={!!n.pinned}
                  aria-label={n.pinned ? 'Unpin' : 'Pin to every quick revision'}
                  title={n.pinned ? 'Unpin' : 'Pin to every quick revision'}
                  onClick={() => patch(n.id, { pinned: !n.pinned })}
                >
                  <Icon name="star" size={16} />
                </button>
                <div className="note-body">
                  {editing?.id === n.id ? (
                    <input
                      aria-label="Edit point"
                      autoFocus
                      value={editing.text}
                      onChange={(e) => setEditing({ id: n.id, text: e.target.value })}
                      onBlur={saveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') setEditing(null);
                      }}
                    />
                  ) : (
                    <span className="note-text">{n.text}</span>
                  )}
                  <span className="note-meta">
                    <select
                      aria-label="Skill"
                      className="tag-select"
                      value={n.skillId ?? 'general'}
                      onChange={(e) => patch(n.id, { skillId: e.target.value === 'general' ? null : e.target.value })}
                    >
                      <option value="general">General</option>
                      {goal.skills.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                      {n.skillId !== null && !goal.skills.some((s) => s.id === n.skillId) && (
                        <option value={n.skillId}>{skillName(goal, n.skillId)}</option>
                      )}
                    </select>
                    <span className="muted small">{revisedLabel(n)}</span>
                  </span>
                </div>
                <div className="note-actions">
                  <button className="icon-btn" aria-label="Edit" title="Edit" onClick={() => setEditing({ id: n.id, text: n.text })}>
                    <Icon name="pen" size={16} />
                  </button>
                  <button className="icon-btn danger" aria-label="Delete" title="Delete" onClick={() => remove(n.id)}>
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function matches(n: Note, f: Filter): boolean {
  if (f === 'all') return true;
  if (f === 'general') return n.skillId === null;
  return n.skillId === f;
}

function revisedLabel(n: Note): string {
  const r = n.revised ?? [];
  if (r.length === 0) return 'Not revised yet';
  return `Revised ${r.length}× · last ${formatDay(r[r.length - 1])}`;
}
