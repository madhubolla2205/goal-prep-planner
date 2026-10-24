import type { ISODate } from './dates';
import { draftFromText, sanitizeDraft, type GoalDraft } from './goalText';

const TIMEOUT_MS = 90_000;

/**
 * Asks the server for a Claude-generated plan. Falls back to the built-in
 * rules when the server is missing, unconfigured, slow or fails.
 */
export async function requestDraft(text: string, today: ISODate): Promise<GoalDraft> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, today }),
      signal: controller.signal,
    });
    if (!res.ok) return draftFromText(text, today);
    return sanitizeDraft(await res.json(), text, today);
  } catch {
    return draftFromText(text, today);
  } finally {
    clearTimeout(timer);
  }
}
