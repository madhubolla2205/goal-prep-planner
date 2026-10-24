import { useState } from 'react';
import { minutesLogged } from '../lib/planner';
import { newId } from '../lib/storage';
import type { Goal, Skill } from '../lib/types';
import { formatMinutes } from './labels';

interface Props {
  goal: Goal;
  onChange: (goal: Goal) => void;
  onDelete: () => void;
}

export function SkillsView({ goal, onChange, onDelete }: Props) {
  const [newName, setNewName] = useState('');

  const updateSkill = (id: string, patch: Partial<Skill>) =>
    onChange({ ...goal, skills: goal.skills.map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  const removeSkill = (id: string) => {
    if (!confirm('Remove this skill? Logged time for it stays in your history.')) return;
    onChange({ ...goal, skills: goal.skills.filter((s) => s.id !== id) });
  };

  const addSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onChange({
      ...goal,
      skills: [...goal.skills, { id: newId(), name: newName.trim(), weight: 3, estimatedHours: 10, confidence: 30 }],
    });
    setNewName('');
  };

  return (
    <div className="stack">
      <p className="muted">
        Importance and confidence decide what gets scheduled first. Update your confidence as you go, and the plan adjusts.
      </p>
      <div className="card">
        <ul className="skill-editor">
          {goal.skills.map((s) => (
            <li key={s.id}>
              <div className="skill-editor-head">
                <input className="skill-name" aria-label="Skill name" value={s.name} onChange={(e) => updateSkill(s.id, { name: e.target.value })} />
                <button className="link danger" onClick={() => removeSkill(s.id)}>Remove</button>
              </div>
              <div className="skill-fields">
                <label>
                  Importance
                  <select value={s.weight} onChange={(e) => updateSkill(s.id, { weight: Number(e.target.value) })}>
                    {[1, 2, 3, 4, 5].map((w) => (
                      <option key={w} value={w}>{['', 'Low', 'Some', 'Medium', 'High', 'Critical'][w]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Estimated hours
                  <input type="number" min={0} step={1} value={s.estimatedHours} onChange={(e) => updateSkill(s.id, { estimatedHours: Math.max(0, Number(e.target.value)) })} />
                </label>
                <label className="grow">
                  Confidence: {s.confidence}%
                  <input type="range" min={0} max={100} step={5} value={s.confidence} onChange={(e) => updateSkill(s.id, { confidence: Number(e.target.value) })} />
                </label>
              </div>
              <span className="muted small">Logged so far: {formatMinutes(minutesLogged(goal, s.id))}</span>
            </li>
          ))}
        </ul>
        <form className="inline-form" onSubmit={addSkill}>
          <input aria-label="New skill" placeholder="Add a skill, e.g. Dynamic programming" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button type="submit" disabled={!newName.trim()}>Add skill</button>
        </form>
      </div>

      <div className="card">
        <h3>Goal settings</h3>
        <div className="skill-fields">
          <label>
            Target date
            <input type="date" value={goal.targetDate} onChange={(e) => e.target.value && onChange({ ...goal, targetDate: e.target.value })} />
          </label>
          <label>
            Study hours per day
            <input type="number" min={0.25} step={0.25} value={goal.dailyMinutes / 60} onChange={(e) => onChange({ ...goal, dailyMinutes: Math.max(15, Math.round(Number(e.target.value) * 60)) })} />
          </label>
        </div>
        <button className="link danger" onClick={onDelete}>Delete this goal</button>
      </div>
    </div>
  );
}
