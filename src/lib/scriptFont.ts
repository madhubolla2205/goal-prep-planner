import { LANGS, type Lang } from './i18n';

/**
 * Loads the font for a language's script from Google Fonts (free), so the
 * script looks right on devices without one. Offline, the device's own font is used.
 */
export function loadScriptFont(lang: Lang): void {
  const font = LANGS.find((l) => l.id === lang)?.font;
  const root = document.documentElement;
  root.style.setProperty('--script-font', font ? `'${font}'` : 'system-ui');
  if (!font || document.querySelector(`link[data-font="${font}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.dataset.font = font;
  link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;600;700;800&display=swap`;
  document.head.append(link);
}
