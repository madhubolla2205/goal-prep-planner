import type { ISODate } from './dates';
import { newId } from './storage';
import type { Goal, Note, ThemeId } from './types';

/** How many points a quick revision shows. */
export const QUICK_REVISION_SIZE = 5;

/** Revision days kept per point; older ones don't change what comes up next. */
const REVISED_KEPT = 10;

/** The most recent day before `today` the point was revised, or null if never. */
function lastRevisedBefore(note: Note, today: ISODate): ISODate | null {
  const earlier = (note.revised ?? []).filter((d) => d < today);
  return earlier.length ? earlier[earlier.length - 1] : null;
}

export function revisedOn(note: Note, date: ISODate): boolean {
  return (note.revised ?? []).includes(date);
}

/**
 * The points for today's quick revision: pinned points first, then points on
 * skills planned for today, then the ones gone longest without a revision.
 * Revising a point today doesn't change today's pick, so the card stays put.
 */
export function quickRevision(goal: Goal, today: ISODate, todaysSkills: (string | null)[], size = QUICK_REVISION_SIZE): Note[] {
  const planned = new Set(todaysSkills.filter((id): id is string => id !== null));
  const rank = (n: Note) => [
    n.pinned ? 0 : 1,
    n.skillId !== null && planned.has(n.skillId) ? 0 : 1,
  ];
  return [...(goal.notes ?? [])]
    .filter((n) => n.createdAt <= today)
    .sort((a, b) => {
      const [ra, rb] = [rank(a), rank(b)];
      if (ra[0] !== rb[0]) return ra[0] - rb[0];
      if (ra[1] !== rb[1]) return ra[1] - rb[1];
      const [la, lb] = [lastRevisedBefore(a, today) ?? '', lastRevisedBefore(b, today) ?? ''];
      if (la !== lb) return la < lb ? -1 : 1;
      return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
    })
    .slice(0, size);
}

export function markRevised(note: Note, date: ISODate): Note {
  if (revisedOn(note, date)) return note;
  return { ...note, revised: [...(note.revised ?? []), date].sort().slice(-REVISED_KEPT) };
}

export function unmarkRevised(note: Note, date: ISODate): Note {
  return { ...note, revised: (note.revised ?? []).filter((d) => d !== date) };
}

export function newNote(text: string, skillId: string | null, today: ISODate): Note {
  return { id: newId(), text: text.trim(), skillId, createdAt: today };
}

/**
 * Starter points per path the person can add with a tap. They are reminders
 * about how to prepare and sit the exam or interview, not study material.
 */
export const STARTER_POINTS: Record<ThemeId, string[]> = {
  code: [
    'Restate the problem and ask clarifying questions before writing code',
    'Say the brute force first, then optimise out loud',
    'Test edge cases: empty input, one element, duplicates, overflow',
    'Finish with the time and space complexity',
    'Keep three STAR stories ready: conflict, failure, ownership',
  ],
  data: [
    'Pin down the metric and its exact definition before any SQL',
    'Say your assumptions before you model anything',
    'Sanity-check every result against a rough estimate',
    'Explain the trade-offs, not only the method you picked',
    'Keep two project stories with real numbers ready',
  ],
  engineering: [
    'Read each question twice: check if it is MCQ, MSQ or NAT',
    'Skip pure guesses where wrong answers lose marks',
    'Write down the formulas you keep forgetting, here',
    'Check units and boundary cases before you move on',
    'Attempt sections in the order you practised',
  ],
  aptitude: [
    'Pick the easiest questions in each set first',
    'Leave a question after two to three minutes stuck',
    'Track accuracy, not only how many you attempted',
    'Note the calculation shortcuts you keep reaching for',
    'Stick to the section time plan you practised',
  ],
  civil: [
    'Go through current affairs notes once a week',
    'Answer exactly what is asked: intro, body, conclusion',
    'Map every topic you read back to the syllabus',
    'Practise writing within the word limit',
    'Revise the same sources again rather than adding new ones',
  ],
  medical: [
    'Revisit the diagrams and tables you keep getting wrong',
    'Mark doubtful questions and come back at the end',
    'Revise the highest-weightage chapters first',
    'Watch your time per section in every mock',
    'Sleep the night before beats one more chapter',
  ],
  exam: [
    'Know the exam pattern and marking scheme by heart',
    'Answer the questions you are sure of first',
    'Keep a list of mistakes you repeat',
    'Time every practice set',
    'In the last week, revise your own notes, not new material',
  ],
  interview: [
    'Know the company: product, values and recent news',
    'Have three stories ready in STAR format',
    'Prepare two questions to ask the interviewer',
    'Pause and think before you answer',
    'Send a short thank-you note afterwards',
  ],
};
