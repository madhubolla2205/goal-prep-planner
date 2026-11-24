import { useState } from 'react';
import type { ISODate } from '../lib/dates';
import { isNativeApp } from '../lib/device';
import { APP_VERSION, FEEDBACK_EMAIL, PLAY_URL, feedbackMailto, loadLastAsked, saveLastAsked, shouldAskForFeedback } from '../lib/feedback';
import { getLang, t } from '../lib/i18n';
import type { Goal } from '../lib/types';
import { Icon } from './Icon';

/** The card's id, for the header's Feedback button to scroll to. */
export const FEEDBACK_ID = 'feedback';

function FeedbackActions({ plans, onUse }: { plans: number; onUse?: () => void }) {
  const mailto = feedbackMailto({ version: APP_VERSION, native: isNativeApp(), userAgent: navigator.userAgent, lang: getLang(), plans });
  return (
    <div className="data-actions">
      {FEEDBACK_EMAIL && <a className="button" href={mailto} onClick={onUse}><Icon name="chat" size={16} /> {t('feedbackEmail')}</a>}
      <a className={`button ${FEEDBACK_EMAIL ? 'ghost' : ''}`} href={PLAY_URL} target="_blank" rel="noreferrer" onClick={onUse}>
        <Icon name="star" size={16} /> {t('feedbackPlay')}
      </a>
    </div>
  );
}

/** Always-there ways to send feedback, on Adjust and under the list of plans. */
export function FeedbackCard({ plans }: { plans: number }) {
  return (
    <div className="card" id={FEEDBACK_ID}>
      <h3 className="with-icon"><span className="icon-badge"><Icon name="chat" size={16} /></span>{t('feedbackTitle')}</h3>
      <p className="muted small">{t('feedbackHint')}</p>
      <FeedbackActions plans={plans} />
      <p className="muted small">{t('feedbackPlayHint')}</p>
    </div>
  );
}

/** A small prompt on Today, once someone has studied on two days, then at most weekly. */
export function FeedbackNudge({ goals, today }: { goals: Goal[]; today: ISODate }) {
  const [show, setShow] = useState(() => shouldAskForFeedback(goals, today, loadLastAsked()));
  if (!show) return null;
  const close = () => {
    saveLastAsked(today);
    setShow(false);
  };
  return (
    <div className="intro feedback-nudge" role="note">
      <p className="with-icon"><Icon name="chat" size={16} /> {t('feedbackAsk')}</p>
      <div className="data-actions">
        <FeedbackActions plans={goals.length} onUse={close} />
        <button className="link" onClick={close}>{t('feedbackLater')}</button>
      </div>
    </div>
  );
}
