import { describe, expect, it } from 'vitest';
import { deviceFromUserAgent, feedbackMailto, shouldAskForFeedback, studyDays } from './feedback';
import type { Goal } from './types';

const TODAY = '2026-11-24';

function goal(days: string[]): Goal {
  return {
    id: 'g',
    name: 'GATE',
    type: 'exam',
    startDate: '2026-11-01',
    targetDate: '2027-02-01',
    dailyMinutes: 60,
    restDays: [],
    skills: [],
    log: days.map((date, i) => ({ id: String(i), date, skillId: null, minutes: 30 })),
  };
}

describe('deviceFromUserAgent', () => {
  it("reads the Android version and model from the app's WebView", () => {
    const ua = 'Mozilla/5.0 (Linux; Android 15; Pixel 8 Build/AP3A.241005.015; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36';
    expect(deviceFromUserAgent(ua)).toBe('Android 15; Pixel 8');
  });
  it('leaves out the hidden model of newer Chrome', () => {
    expect(deviceFromUserAgent('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36')).toBe('Android 10');
  });
  it('names other systems without detail', () => {
    expect(deviceFromUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')).toBe('Windows');
  });
});

describe('feedbackMailto', () => {
  it('fills in the subject and the details, encoded', () => {
    const link = feedbackMailto({ version: '1.0.20', native: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-A156E)', lang: 'te', plans: 2 }, 'dev@example.com');
    expect(link.startsWith('mailto:dev@example.com?subject=')).toBe(true);
    const body = decodeURIComponent(link.split('&body=')[1]);
    expect(decodeURIComponent(link.split('subject=')[1].split('&')[0])).toBe('Goal Prep Planner feedback (Android app 1.0.20)');
    expect(body).toContain('Device: Android 14; SM-A156E');
    expect(body).toContain('Language: te');
    expect(body).toContain('Plans: 2');
  });
});

describe('shouldAskForFeedback', () => {
  it('waits until study is logged on two different days', () => {
    expect(shouldAskForFeedback([goal([TODAY, TODAY])], TODAY, null)).toBe(false);
    expect(shouldAskForFeedback([goal(['2026-11-23', TODAY])], TODAY, null)).toBe(true);
  });
  it('counts days across plans', () => {
    expect(studyDays([goal(['2026-11-23']), goal([TODAY])])).toBe(2);
  });
  it('asks again only a week after the last time', () => {
    const g = [goal(['2026-11-10', '2026-11-11'])];
    expect(shouldAskForFeedback(g, TODAY, '2026-11-20')).toBe(false);
    expect(shouldAskForFeedback(g, TODAY, '2026-11-17')).toBe(true);
  });
});
