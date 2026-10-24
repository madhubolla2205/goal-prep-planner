import { useState } from 'react';
import { addDays, daysBetween, weekday, type ISODate } from '../lib/dates';
import { LEARNING_SHARE } from '../lib/planner';
import { newId } from '../lib/storage';
import { TEMPLATES } from '../lib/templates';
import type { Goal, GoalType } from '../lib/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  today: ISODate;
  onCreate: (goal: Goal) => void;
  onCancel?: () => void;
}

export function GoalForm({ today, onCreate, onCancel }: Props) {
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [name, setName] = useState('');
  const [type, setType] = useState<GoalType>(TEMPLATES[0].type);
  const [targetDate, setTargetDate] = useState(addDays(today, 60));
  const [hours, setHours] = useState(2);
  const [restDays, setRestDays] = useState<number[]>([0]);

  const template = TEMPLATES.find((t) => t.id === templateId)!;

  const pickTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id)!;
    setTemplateId(id);
    setType(t.type);
  };

  const toggleRest = (d: number) =>
    setRestDays((r) => (r.includes(d) ? r.filter((x) => x !== d) : [...r, d]));

  const neededHours = template.skills.reduce((sum, sk) => sum + sk.estimatedHours, 0);
  const span = Math.max(0, daysBetween(today, targetDate) + 1);
  const studyDayCount = Array.from({ length: span }, (_, i) => addDays(today, i)).filter((d) => !restDays.includes(weekday(d))).length;
  // The rest of the time goes to revision, spaced review and mocks.
  const availableHours = Math.round(studyDayCount * hours * LEARNING_SHARE);

  const valid = name.trim() !== '' && targetDate > today && hours > 0 && restDays.length < 7;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onCreate({
      id: newId(),
      name: name.trim(),
      type,
      startDate: today,
      targetDate,
      dailyMinutes: Math.round(hours * 60),
      restDays,
      skills: template.skills.map((s) => ({ ...s, id: newId(), confidence: 30 })),
      log: [],
      source: 'manual',
    });
  };

  return (
    <form className="card goal-form" onSubmit={submit}>
      <h2>Set a goal</h2>
      <p className="muted">Pick what you're preparing for. You can edit the skills and estimates afterwards.</p>

      <fieldset>
        <legend>Start from</legend>
        <div className="template-grid">
          {TEMPLATES.map((t) => (
            <label key={t.id} className={`template ${t.id === templateId ? 'selected' : ''}`}>
              <input type="radio" name="template" checked={t.id === templateId} onChange={() => pickTemplate(t.id)} />
              <span className="template-name">{t.label}</span>
              <span className="muted small">{t.skills.length ? `${t.skills.length} skills` : 'Add your own skills'}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-row">
        <label>
          Goal name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={type === 'exam' ? 'e.g. GATE 2027' : 'e.g. Google SWE L4 onsite'} required />
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as GoalType)}>
            <option value="exam">Exam</option>
            <option value="interview">Interview</option>
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          {type === 'exam' ? 'Exam date' : 'Interview date'}
          <input type="date" value={targetDate} min={addDays(today, 1)} onChange={(e) => setTargetDate(e.target.value)} required />
        </label>
        <label>
          Study hours per day
          <input type="number" min={0.25} max={16} step={0.25} value={hours} onChange={(e) => setHours(Number(e.target.value))} required />
        </label>
      </div>

      <fieldset>
        <legend>Rest days</legend>
        <div className="weekday-row">
          {WEEKDAYS.map((w, i) => (
            <button type="button" key={w} className={`pill ${restDays.includes(i) ? 'on' : ''}`} aria-pressed={restDays.includes(i)} onClick={() => toggleRest(i)}>
              {w}
            </button>
          ))}
        </div>
      </fieldset>

      {neededHours > 0 && (
        <p className={`fit ${availableHours >= neededHours ? 'fit-ok' : 'fit-short'}`}>
          This template estimates <strong>{neededHours} h</strong> of study. Your schedule gives about{' '}
          <strong>{availableHours} h</strong> before revision starts
          {availableHours >= neededHours ? '.' : ', so add hours, move the date, or trim estimates on the Skills tab.'}
        </p>
      )}

      <div className="actions">
        {onCancel && <button type="button" className="ghost" onClick={onCancel}>Cancel</button>}
        <button type="submit" disabled={!valid}>Create plan</button>
      </div>
    </form>
  );
}
