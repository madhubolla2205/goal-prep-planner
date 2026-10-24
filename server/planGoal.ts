import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

// The shape Claude fills in. Ranges are enforced again on the client, which
// treats this response as untrusted input.
const PlanSchema = z.object({
  name: z.string().describe('Short goal name, e.g. "Amazon SDE interview"'),
  type: z.enum(['exam', 'interview']),
  targetDate: z.string().describe('YYYY-MM-DD'),
  dailyMinutes: z.number().int(),
  restDays: z.array(z.number().int()).describe('Weekdays with no study, 0 = Sunday … 6 = Saturday'),
  skills: z.array(
    z.object({
      name: z.string(),
      weight: z.number().int().describe('Importance 1 (low) to 5 (critical)'),
      estimatedHours: z.number().int(),
    }),
  ),
});

export type PlanResponse = z.infer<typeof PlanSchema>;

const SYSTEM = `You turn one sentence about what someone is preparing for (an exam, or an interview at a company) into the outline of a study plan. The app does the scheduling and tracking; your job is the breakdown.

Return:
- name: a short name for the goal in the person's words (no dates or hours).
- type: "interview" for job interviews, otherwise "exam".
- targetDate: the exam or interview date. Resolve relative phrases ("in 6 weeks", "mid December") against today's date. If none is given, use 60 days from today.
- dailyMinutes: the study time per day they mention, or 120 if they don't.
- restDays: weekdays off (0 = Sunday … 6 = Saturday). Use [0] unless they say otherwise ("weekends off" = [0, 6], "every day" = []).
- skills: 4 to 10 topics to track for this specific goal, most important first. For a named company or exam, reflect what it is actually known to test (for example a company's interview rounds, or an exam's official syllabus sections and their weightage). Each skill is a trackable area, not a lesson. Give each an importance from 1 to 5 and a realistic number of study hours, and keep the total hours within what fits: about 85% of (study days until the target date × daily hours).`;

export async function planGoal(client: Anthropic, text: string, today: string): Promise<PlanResponse | null> {
  let response;
  try {
    response = await client.beta.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      output_config: { effort: 'medium', format: betaZodOutputFormat(PlanSchema) },
      // If the request is declined by a safety classifier, retry on a fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM,
      messages: [{ role: 'user', content: `Today is ${today}.\n\nWhat I'm preparing for: ${text}` }],
    });
  } catch (err) {
    // API errors go to the caller; anything else is output that didn't parse
    // (for example an empty reply to a declined request).
    if (err instanceof Anthropic.APIError) throw err;
    return null;
  }
  if (response.stop_reason === 'refusal') return null;
  return response.parsed_output ?? null;
}
