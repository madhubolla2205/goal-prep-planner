import { useState } from 'react';
import type { ISODate } from '../lib/dates';
import { locale, t } from '../lib/i18n';
import { goalFromOffer, type PlanOffer } from '../lib/shareLink';
import { THEMES, detectTheme } from '../lib/themes';
import type { Goal } from '../lib/types';
import { Icon } from './Icon';

/** Short weekday names in the current language, Sunday first (1 Jan 2023 was a Sunday). */
const weekdays = () =>
  Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2023, 0, 1 + i)).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' }));

interface Props {
  offer: PlanOffer;
  today: ISODate;
  onCreate: (goal: Goal) => void;
  onCancel: () => void;
}

/** A starter plan or a shared plan, with the date and daily time to adjust before adding it. */
export function PlanOfferView({ offer, today, onCreate, onCancel }: Props) {
  const [targetDate, setTargetDate] = useState(offer.targetDate);
  const [hours, setHours] = useState(Math.round(offer.dailyMinutes / 15) / 4);
  const [restDays, setRestDays] = useState(offer.restDays);
  const theme = THEMES[offer.theme ?? detectTheme({ name: offer.name, type: offer.type, skills: offer.skills.map((s, i) => ({ ...s, id: String(i), confidence: 0 })) })];
  const totalHours = offer.skills.reduce((s, k) => s + k.estimatedHours, 0);
  const valid = targetDate > today && hours > 0 && restDays.length < 7;

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onCreate(goalFromOffer({ ...offer, targetDate, dailyMinutes: Math.round(hours * 60), restDays }, today));
  };

  return (
    <form className="offer stack" onSubmit={create} style={{ ['--t1' as string]: theme.from, ['--t2' as string]: theme.to }}>
      <div className="offer-band">
        <Icon name={theme.icon} size={120} className="plan-card-art" />
        <span className="plan-card-path"><Icon name={offer.from === 'shared' ? 'link' : 'spark'} size={13} /> {offer.from === 'shared' ? t('sharedWithYou') : t('readyMadePlan')}</span>
        <h2>{offer.name}</h2>
        <p>{t('previewIntro', { n: offer.skills.length, hours: totalHours })}</p>
      </div>

      <div className="card">
        <div className="form-row">
          <label>
            {t('targetDate')}
            <input type="date" min={today} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
          </label>
          <label>
            {t('hoursPerDay')}
            <input type="number" min={0.25} max={16} step={0.25} value={hours} onChange={(e) => setHours(Number(e.target.value))} required />
          </label>
        </div>
        <fieldset className="offer-rest">
          <legend>{t('restDays')}</legend>
          <div className="weekday-row">
            {weekdays().map((d, i) => (
              <button
                type="button"
                key={d}
                className={`pill ${restDays.includes(i) ? 'on' : ''}`}
                aria-pressed={restDays.includes(i)}
                onClick={() => setRestDays((r) => (r.includes(i) ? r.filter((x) => x !== i) : [...r, i]))}
              >
                {d}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="card">
        <h3>{t('skillsInPlan')}</h3>
        <ul className="offer-skills">
          {[...offer.skills].sort((a, b) => b.weight - a.weight).map((s) => (
            <li key={s.name}>
              <span>{s.name}</span>
              <span className="offer-weight" aria-label={`Importance ${s.weight} of 5`}>{'●'.repeat(s.weight)}<span>{'●'.repeat(5 - s.weight)}</span></span>
              <span className="muted small">{t('hoursShort', { n: s.estimatedHours })}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="actions">
        <button type="button" className="ghost" onClick={onCancel}>{t('noThanks')}</button>
        <button type="submit" className="cta" disabled={!valid}><Icon name="plus" size={16} /> {t('addToMyPlans')}</button>
      </div>
    </form>
  );
}
