import Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it } from 'vitest';
import { planGoal } from './planGoal.ts';

const PLAN = {
  name: 'Amazon SDE interview',
  type: 'interview',
  targetDate: '2026-12-05',
  dailyMinutes: 120,
  restDays: [0],
  skills: [{ name: 'Data structures & algorithms', weight: 5, estimatedHours: 30 }],
};

function fakeClient(reply: object, seen: { body?: Record<string, unknown>; headers?: Headers }) {
  return new Anthropic({
    apiKey: 'test-key',
    maxRetries: 0,
    fetch: async (_url, init) => {
      seen.body = JSON.parse(String(init?.body));
      seen.headers = new Headers(init?.headers);
      return new Response(JSON.stringify(reply), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });
}

const message = (text: string, stop_reason = 'end_turn') => ({
  id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-opus-5-5',
  content: [{ type: 'text', text }], stop_reason, stop_sequence: null,
  usage: { input_tokens: 10, output_tokens: 10 },
});

describe('planGoal', () => {
  it('sends a structured-output request and parses the plan', async () => {
    const seen: { body?: Record<string, unknown>; headers?: Headers } = {};
    const plan = await planGoal(fakeClient(message(JSON.stringify(PLAN)), seen), 'Amazon SDE interview in 6 weeks', '2026-10-24');
    expect(plan).toEqual(PLAN);
    expect(seen.body).toMatchObject({ model: 'claude-opus-5-5', fallbacks: 'default', output_config: { effort: 'medium', format: { type: 'json_schema' } } });
    expect(JSON.stringify(seen.body?.messages)).toContain('Today is 2026-10-24');
    expect(seen.headers?.get('anthropic-beta')).toContain('server-side-fallback-2026-07-01');
  });

  it('returns null on a refusal', async () => {
    const plan = await planGoal(fakeClient(message('', 'refusal'), {}), 'x', '2026-10-24');
    expect(plan).toBeNull();
  });
});
