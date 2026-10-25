import { useEffect, useRef, useState } from 'react';
import type { ISODate } from '../lib/dates';
import { t } from '../lib/i18n';
import { MAX_ROLE_MODELS, MISSED_DAYS_FOR_WHY, missedStudyDays, modelName, roleModelFor, shrinkPhoto } from '../lib/motivation';
import { newId } from '../lib/storage';
import type { Goal, RoleModel } from '../lib/types';
import { Icon } from './Icon';

export function Avatar({ model, size = 56 }: { model: RoleModel; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (model.photo) return <img className="avatar" src={model.photo} alt="" width={size} height={size} style={style} />;
  return (
    <span className="avatar avatar-letter" style={style} aria-hidden="true">
      {model.self ? <Icon name="star" size={size * 0.5} /> : model.name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

interface FormProps {
  initial?: RoleModel;
  onSave: (model: RoleModel) => void;
  onCancel?: () => void;
}

/** Adding or changing one role model: a person with a photo, or a note to the future self. */
function RoleModelForm({ initial, onSave, onCancel }: FormProps) {
  const [self, setSelf] = useState(initial?.self ?? false);
  const [name, setName] = useState(initial?.self ? '' : (initial?.name ?? ''));
  const [quote, setQuote] = useState(initial?.quote ?? '');
  const [photo, setPhoto] = useState(initial?.photo);
  const [photoError, setPhotoError] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const valid = self ? quote.trim() !== '' : name.trim() !== '';

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setPhotoError(false);
    try {
      setPhoto(await shrinkPhoto(f));
    } catch {
      setPhotoError(true);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSave({
      id: initial?.id ?? newId(),
      name: self ? t('futureSelfName') : name.trim(),
      quote: quote.trim(),
      ...(photo ? { photo } : {}),
      ...(self ? { self: true } : {}),
    });
    if (!initial) {
      setName('');
      setQuote('');
      setPhoto(undefined);
    }
  };

  const preview: RoleModel = { id: '', name: self ? t('futureSelfName') : name, quote, photo, self };

  return (
    <form className="model-form" onSubmit={submit}>
      <div className="model-form-photo">
        <Avatar model={preview} size={64} />
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} />
        <button type="button" className="ghost small" onClick={() => file.current?.click()}>
          <Icon name="image" size={14} /> {t('choosePhoto')}
        </button>
        {photo && <button type="button" className="link small" onClick={() => setPhoto(undefined)}>{t('removePhoto')}</button>}
      </div>
      <div className="model-form-fields">
        {!self && (
          <label>
            {t('roleModelName')}
            <input value={name} placeholder={t('roleModelNamePlaceholder')} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label>
          {self ? t('futureSelfQuote') : t('roleModelQuote')}
          <textarea
            rows={2}
            value={quote}
            maxLength={240}
            placeholder={self ? t('futureSelfPlaceholder') : t('roleModelQuotePlaceholder')}
            onChange={(e) => setQuote(e.target.value)}
          />
        </label>
        {photoError && <p className="data-error small" role="alert">{t('photoError')}</p>}
        <div className="data-actions">
          <button type="submit" disabled={!valid}>
            {initial ? <><Icon name="check" size={16} /> {t('save')}</> : <><Icon name="plus" size={16} /> {t('addRoleModel')}</>}
          </button>
          {!initial && (
            <button type="button" className="ghost" onClick={() => setSelf(!self)}>
              {self ? t('realPerson') : <><Icon name="star" size={16} /> {t('futureSelf')}</>}
            </button>
          )}
          {onCancel && <button type="button" className="link" onClick={onCancel}>{t('cancel')}</button>}
        </div>
      </div>
    </form>
  );
}

interface EditorProps {
  goal: Goal;
  onChange: (goal: Goal) => void;
}

/** The plan's role models and the person's "why", on the Adjust tab and when first added from Today. */
export function MotivationEditor({ goal, onChange }: EditorProps) {
  const models = goal.roleModels ?? [];
  const [editing, setEditing] = useState<string | null>(null);
  const [why, setWhy] = useState(goal.why ?? '');

  const setModels = (next: RoleModel[]) => onChange({ ...goal, roleModels: next });

  return (
    <div className="card motivation-editor">
      <h3 className="with-icon"><span className="icon-badge"><Icon name="star" size={16} /></span>{t('motivationTitle')}</h3>
      <p className="muted small">{t('motivationHint')}</p>

      {models.length > 0 && (
        <ul className="model-list">
          {models.map((m) =>
            editing === m.id ? (
              <li key={m.id}>
                <RoleModelForm
                  initial={m}
                  onSave={(next) => {
                    setModels(models.map((x) => (x.id === m.id ? next : x)));
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <li key={m.id} className="model-row">
                <Avatar model={m} size={44} />
                <div className="model-row-text">
                  <strong>{modelName(m)}</strong>
                  {m.quote && <span className="muted small">“{m.quote}”</span>}
                </div>
                <button className="link small" onClick={() => setEditing(m.id)}>{t('edit')}</button>
                <button className="link small danger" onClick={() => setModels(models.filter((x) => x.id !== m.id))}>{t('remove')}</button>
              </li>
            ),
          )}
        </ul>
      )}

      {models.length < MAX_ROLE_MODELS ? (
        <RoleModelForm onSave={(m) => setModels([...models, m])} />
      ) : (
        <p className="muted small">{t('roleModelsFull')}</p>
      )}

      <label className="why-field">
        <span className="with-icon"><Icon name="flag" size={14} /> {t('whyTitle')}</span>
        <textarea
          rows={2}
          value={why}
          maxLength={400}
          placeholder={t('whyPlaceholder')}
          onChange={(e) => setWhy(e.target.value)}
          onBlur={() => why.trim() !== (goal.why ?? '') && onChange({ ...goal, why: why.trim() || undefined })}
        />
        <span className="muted small">{t('whyHint')}</span>
      </label>
    </div>
  );
}

interface TodayProps {
  goal: Goal;
  today: ISODate;
  onChange: (goal: Goal) => void;
}

/**
 * The top of Today: the person's "why" after a few missed days, then the
 * day's role model, or an invitation to add one.
 */
export function TodayMotivation({ goal, today, onChange }: TodayProps) {
  const [adding, setAdding] = useState(false);
  const model = roleModelFor(goal, today);
  const missed = missedStudyDays(goal, today);

  const whyCard = missed >= MISSED_DAYS_FOR_WHY && (
    <div className="why-card" role="note">
      <Icon name="flag" size={20} />
      <div>
        <strong>{goal.why ? t('missedTitle', { n: missed }) : t('missedNoWhy', { n: missed })}</strong>
        {goal.why ? <p>“{goal.why}”</p> : <button className="link small" onClick={() => setAdding(true)}>{t('missedAddWhy')}</button>}
      </div>
    </div>
  );

  if (adding) {
    return (
      <>
        {whyCard}
        <MotivationEditor goal={goal} onChange={onChange} />
        <button className="link done-adding" onClick={() => setAdding(false)}>{t('done')}</button>
      </>
    );
  }

  if (model) {
    return (
      <>
        {whyCard}
        <figure className="model-banner">
          <Avatar model={model} size={64} />
          <div>
            <figcaption className="model-banner-name">{model.self ? t('fromFutureYou') : t('todaysRoleModel', { name: model.name })}</figcaption>
            {model.quote && <blockquote>“{model.quote}”</blockquote>}
          </div>
        </figure>
      </>
    );
  }

  return (
    <>
      {whyCard}
      {!goal.motivationDismissed && (
        <div className="intro model-invite">
          <p><strong>{t('inviteTitle')}</strong> {t('inviteText')}</p>
          <div className="data-actions">
            <button className="small" onClick={() => setAdding(true)}><Icon name="star" size={14} /> {t('inviteAdd')}</button>
            <button className="link small" onClick={() => onChange({ ...goal, motivationDismissed: true })}>{t('notNow')}</button>
          </div>
        </div>
      )}
    </>
  );
}

interface CelebrationProps {
  goal: Goal;
  today: ISODate;
  week: boolean;
  minutes: string;
  onClose: () => void;
}

/** A short celebration when the day's plan, or a whole week, is done, with the day's role model. */
export function Celebration({ goal, today, week, minutes, onClose }: CelebrationProps) {
  const model = roleModelFor(goal, today);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="celebrate-backdrop" onClick={onClose}>
      <div className="celebrate" role="dialog" aria-modal="true" aria-labelledby="celebrate-title" onClick={(e) => e.stopPropagation()}>
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => <span key={i} style={{ ['--i' as string]: i }} />)}
        </div>
        {model ? <Avatar model={model} size={88} /> : <span className="celebrate-icon"><Icon name={week ? 'star' : 'check'} size={40} /></span>}
        <h2 id="celebrate-title">{week ? t('celebrateWeek') : t('celebrateDay')}</h2>
        <p>{week ? t('celebrateWeekText') : t('celebrateDayText', { time: minutes })}</p>
        {model?.quote && (
          <blockquote>
            “{model.quote}”
            <cite>{modelName(model)}</cite>
          </blockquote>
        )}
        <button ref={close} onClick={onClose}>{t('celebrateClose')}</button>
      </div>
    </div>
  );
}
