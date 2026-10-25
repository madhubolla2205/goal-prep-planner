import { LANGS, t, type Lang } from '../lib/i18n';
import { Icon } from './Icon';

export function LanguagePicker({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  return (
    <label className="lang-picker">
      <Icon name="globe" size={16} />
      <span className="sr-only">{t('language')}</span>
      <select value={lang} onChange={(e) => onChange(e.target.value as Lang)} aria-label={t('language')}>
        {LANGS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
    </label>
  );
}
