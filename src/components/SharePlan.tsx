import { useState } from 'react';
import { t } from '../lib/i18n';
import { shareUrl } from '../lib/shareLink';
import { appBaseUrl, copyText, shareMessage } from '../lib/sharing';
import type { Goal } from '../lib/types';
import { Icon } from './Icon';

/** A link to the plan (skills, date and hours, never progress) for friends and study groups. */
export function SharePlan({ goal }: { goal: Goal }) {
  const [copied, setCopied] = useState(false);
  const url = shareUrl(goal, appBaseUrl());
  const message = t('shareMessage', { name: goal.name });

  const flash = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="card">
      <h3 className="with-icon"><span className="icon-badge"><Icon name="share" size={16} /></span>{t('shareTitle')}</h3>
      <p className="muted small">{t('shareHint')}</p>
      <div className="data-actions">
        <button type="button" onClick={async () => { if ((await shareMessage(goal.name, message, url)) === 'copied') flash(); }}>
          <Icon name="share" size={16} /> {t('shareLink')}
        </button>
        <a className="button ghost" href={`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`} target="_blank" rel="noreferrer">
          <Icon name="chat" size={16} /> {t('whatsApp')}
        </a>
        <button type="button" className="ghost" onClick={async () => { if (await copyText(url)) flash(); }}>
          <Icon name="link" size={16} /> {t('copyLink')}
        </button>
      </div>
      {copied && <p className="data-status ok small" role="status"><Icon name="check" size={15} /> {t('copied')}</p>}
    </div>
  );
}
