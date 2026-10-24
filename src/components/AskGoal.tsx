import { useState } from 'react';
import { requestDraft } from '../lib/aiPlan';
import type { ISODate } from '../lib/dates';
import { goalFromDraft } from '../lib/goalText';
import { THEMES, THEME_ORDER } from '../lib/themes';
import type { AppState } from '../lib/storage';
import type { Goal } from '../lib/types';
import { Icon } from './Icon';
import { RestoreButton } from './YourData';

const EXAMPLES = [
  'Amazon SDE interview in 6 weeks, 2 hours a day',
  'GATE CSE on Feb 7, 4 hours a day, Sundays off',
  'Data analyst interview at Swiggy in 3 weeks',
  'CAT in 5 months, 3 hours a day',
];

interface Props {
  today: ISODate;
  onCreate: (goal: Goal) => void;
  onManual: () => void;
  onCancel?: () => void;
  /** Offered on a fresh device, to pick up a plan from a backup file. */
  restore?: { state: AppState; onRestore: (next: AppState) => void };
}

export function AskGoal({ today, onCreate, onManual, onCancel, restore }: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = text.trim();
    if (!prompt || busy) return;
    setBusy(true);
    const draft = await requestDraft(prompt, today);
    setBusy(false);
    onCreate(goalFromDraft(draft, today, prompt));
  };

  return (
    <form className="ask" onSubmit={submit}>
      <div className="ask-paths" aria-hidden="true">
        {THEME_ORDER.map((id) => (
          <span key={id} className="ask-path" style={{ ['--t1' as string]: THEMES[id].from, ['--t2' as string]: THEMES[id].to }}>
            <Icon name={THEMES[id].icon} size={18} />
          </span>
        ))}
      </div>
      <h2 className="ask-title">What are you <span className="grad-text">preparing for?</span></h2>
      <p className="muted">Say it the way you'd tell a friend: the exam or interview, when it is, and how much time you have each day.</p>
      <textarea
        aria-label="What are you preparing for?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder="e.g. Amazon SDE interview in 6 weeks, 2 hours a day"
        rows={3}
        maxLength={1000}
        disabled={busy}
        autoFocus
      />
      <div className="examples">
        {EXAMPLES.map((ex) => (
          <button type="button" key={ex} className="pill" disabled={busy} onClick={() => setText(ex)}>
            {ex}
          </button>
        ))}
      </div>
      <div className="actions">
        {onCancel && <button type="button" className="ghost" onClick={onCancel} disabled={busy}>Cancel</button>}
        <button type="submit" className="cta" disabled={!text.trim() || busy}>
          <Icon name="spark" size={16} /> {busy ? 'Building your plan…' : 'Make my plan'}
        </button>
      </div>
      <button type="button" className="link small manual-link" onClick={onManual} disabled={busy}>
        Prefer to set everything up yourself?
      </button>
      {restore && (
        <div className="restore-link">
          <RestoreButton {...restore} className="link small" label="Have a backup from another device? Restore it" />
        </div>
      )}
    </form>
  );
}
