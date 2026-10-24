import { afterEach, describe, expect, it } from 'vitest';
import { EN, LANGS, setLang, t, type Key } from './i18n';
import { TRANSLATIONS } from './translations';

afterEach(() => setLang('en'));

describe('t', () => {
  it('fills placeholders', () => {
    expect(t('daysToGo', { n: 12 })).toBe('12 days to go');
  });

  it('switches language and falls back to English for missing words', () => {
    setLang('hi');
    expect(t('allPlans')).toBe(TRANSLATIONS.hi?.allPlans ?? EN.allPlans);
  });
});

describe('translations', () => {
  const keys = Object.keys(EN) as Key[];
  for (const { id } of LANGS.filter((l) => l.id !== 'en')) {
    it(`${id} covers every word and keeps every placeholder`, () => {
      const dict = TRANSLATIONS[id] ?? {};
      expect(keys.filter((k) => !(k in dict))).toEqual([]);
      for (const k of keys) {
        const want = (EN[k].match(/\{\w+\}/g) ?? []).sort();
        expect((dict[k]?.match(/\{\w+\}/g) ?? []).sort(), `${id}.${k}`).toEqual(want);
      }
    });
  }
});
