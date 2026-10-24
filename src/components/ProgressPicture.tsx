import { useEffect, useState } from 'react';
import type { ISODate } from '../lib/dates';
import { getLang, t } from '../lib/i18n';
import { canvasToBlob, drawProgress } from '../lib/progressImage';
import { deliverFile } from '../lib/sharing';
import type { PathTheme } from '../lib/themes';
import type { Goal } from '../lib/types';
import { Icon } from './Icon';

/** A picture of the plan's streak and readiness to post or send. */
export function ProgressPicture({ goal, theme, today }: { goal: Goal; theme: PathTheme; today: ISODate }) {
  const [preview, setPreview] = useState<{ url: string; blob: Blob } | null>(null);
  const lang = getLang();

  useEffect(() => {
    let url = '';
    let stale = false;
    void drawProgress(goal, theme, today)
      .then(canvasToBlob)
      .then((blob) => {
        if (stale) return;
        url = URL.createObjectURL(blob);
        setPreview({ url, blob });
      });
    return () => {
      stale = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [goal, theme, today, lang]);

  const name = `${goal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'progress'}-progress.png`;

  return (
    <div className="card progress-picture">
      <div className="picture-text">
        <h3 className="with-icon"><span className="icon-badge"><Icon name="image" size={16} /></span>{t('pictureTitle')}</h3>
        <p className="muted small">{t('pictureHint')}</p>
        <div className="data-actions">
          <button type="button" disabled={!preview} onClick={() => preview && void deliverFile(preview.blob, name, goal.name, true)}>
            <Icon name="share" size={16} /> {t('sharePicture')}
          </button>
          <button type="button" className="ghost" disabled={!preview} onClick={() => preview && void deliverFile(preview.blob, name, goal.name)}>
            <Icon name="download" size={16} /> {t('downloadPicture')}
          </button>
        </div>
      </div>
      {preview ? <img className="picture-preview" src={preview.url} alt="" width={216} height={270} /> : <div className="picture-preview" />}
    </div>
  );
}
