import { useState } from 'react';
import { requestDraft } from '../lib/aiPlan';
import type { ISODate } from '../lib/dates';
import { goalFromDraft } from '../lib/goalText';
import { t } from '../lib/i18n';
import { STARTERS, type Starter } from '../lib/starters';
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
  /** Opens a ready-made plan to adjust and add. */
  onStarter: (starter: Starter) => void;
  onCancel?: () => void;
  /** Offered on a fresh device, to pick up a plan from a backup file. */
  restore?: { state: AppState; onRestore: (next: AppState) => void };
}

export function AskGoal({ today, onCreate, onManual, onStarter, onCancel, restore }: Props) {
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
      <h2 className="ask-title">{t('askTitleA')} <span className="grad-text">{t('askTitleB')}</span></h2>
      <p className="muted">{t('askHint')}</p>
      <textarea
        aria-label={`${t('askTitleA')} ${t('askTitleB')}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder={t('askPlaceholder')}
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
        {onCancel && <button type="button" className="ghost" onClick={onCancel} disabled={busy}>{t('cancel')}</button>}
        <button type="submit" className="cta" disabled={!text.trim() || busy}>
          <Icon name="spark" size={16} /> {busy ? t('buildingPlan') : t('makeMyPlan')}
        </button>
      </div>
      <button type="button" className="link small manual-link" onClick={onManual} disabled={busy}>
        {t('manualSetup')}
      </button>
      <section className="starters" aria-labelledby="starters-title">
        <h3 id="starters-title" className="home-section">{t('popularPlans')}</h3>
        <div className="starter-grid">
          {STARTERS.map((s) => (
            <button type="button" key={s.id} className="pill starter" disabled={busy} onClick={() => onStarter(s)}>
              <Icon name={s.type === 'interview' ? 'briefcase' : 'book'} size={14} /> {s.name}
            </button>
          ))}
        </div>
      </section>
      {restore && (
        <div className="restore-link">
          <RestoreButton {...restore} className="link small" label={t('restoreBackup')} />
        </div>
      )}
    </form>
  );
}
