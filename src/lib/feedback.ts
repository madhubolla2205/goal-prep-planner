// Sending feedback without a server: an email the person writes in their own
// mail app, or private feedback on the app's Google Play page. Nothing is sent
// unless they choose to send it.

import { daysBetween, type ISODate } from './dates';
import type { Goal } from './types';

/** Where feedback emails go. Empty hides the email option. */
export const FEEDBACK_EMAIL = '';

/** The app's Play page. Testers can leave private feedback there, which only the developer sees. */
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=io.github.madhubolla2205.goalprep';

/** The build's version, set by the release workflow; "web" for the website and local builds. */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' && __APP_VERSION__ ? __APP_VERSION__ : 'web';

export interface FeedbackInfo {
  version: string;
  native: boolean;
  userAgent: string;
  lang: string;
  plans: number;
}

/** The phone and Android version from the browser's user agent, e.g. "Android 15; Pixel 8". */
export function deviceFromUserAgent(ua: string): string {
  const android = /\(([^)]*Android [^)]*)\)/.exec(ua);
  if (android) {
    const parts = android[1].split(';').map((p) => p.trim());
    const version = parts.find((p) => p.startsWith('Android')) ?? 'Android';
    // Newer browsers hide the model as "K"; the Android app's WebView adds "wv".
    const model = parts[parts.indexOf(version) + 1]?.replace(/\s*Build\/.*$/, '');
    return model && model !== 'K' && model !== 'wv' ? `${version}; ${model}` : version;
  }
  if (/iPhone|iPad/.test(ua)) return /iPad/.test(ua) ? 'iPad' : 'iPhone';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'Mac';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown device';
}

/** A mailto: link with the subject and the details that help reproduce a problem already filled in. */
export function feedbackMailto(info: FeedbackInfo, email = FEEDBACK_EMAIL): string {
  const where = info.native ? `Android app ${info.version}` : 'website';
  const subject = `Goal Prep Planner feedback (${where})`;
  const body = [
    'What did you like, and what got in the way?',
    '',
    '',
    '---',
    `App: ${where}`,
    `Device: ${deviceFromUserAgent(info.userAgent)}`,
    `Language: ${info.lang}`,
    `Plans: ${info.plans}`,
  ].join('\n');
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Days the gentle prompt stays away after it was shown and closed, or used. */
export const ASK_AGAIN_AFTER = 7;

/** Distinct days with any study logged, across every plan. */
export function studyDays(goals: Goal[]): number {
  return new Set(goals.flatMap((g) => g.log.filter((e) => e.minutes > 0).map((e) => e.date))).size;
}

/**
 * Whether Today shows the small "how is it going?" prompt: once someone has
 * used the app on two different days, and then at most once a week.
 */
export function shouldAskForFeedback(goals: Goal[], today: ISODate, lastAsked: ISODate | null): boolean {
  if (studyDays(goals) < 2) return false;
  return lastAsked === null || daysBetween(lastAsked, today) >= ASK_AGAIN_AFTER;
}

const KEY = 'goal-prep-feedback-asked';

export function loadLastAsked(): ISODate | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveLastAsked(day: ISODate): void {
  try {
    localStorage.setItem(KEY, day);
  } catch {
    // Without storage the prompt may show again; nothing else breaks.
  }
}
