// The app's words in English and in Indian languages. Screens call t(key);
// a key missing from a language falls back to English. The language is kept
// on this device only.

import { TRANSLATIONS } from './translations';

export type Lang = 'en' | 'hi' | 'bn' | 'mr' | 'te' | 'ta' | 'kn';

/** `font` is the Noto font for the script, loaded when the language is picked. */
export const LANGS: { id: Lang; name: string; locale: string; font?: string }[] = [
  { id: 'en', name: 'English', locale: 'en-IN' },
  { id: 'hi', name: 'हिन्दी', locale: 'hi-IN', font: 'Noto Sans Devanagari' },
  { id: 'bn', name: 'বাংলা', locale: 'bn-IN', font: 'Noto Sans Bengali' },
  { id: 'mr', name: 'मराठी', locale: 'mr-IN', font: 'Noto Sans Devanagari' },
  { id: 'te', name: 'తెలుగు', locale: 'te-IN', font: 'Noto Sans Telugu' },
  { id: 'ta', name: 'தமிழ்', locale: 'ta-IN', font: 'Noto Sans Tamil' },
  { id: 'kn', name: 'ಕನ್ನಡ', locale: 'kn-IN', font: 'Noto Sans Kannada' },
];

export const EN = {
  // Header and tabs
  allPlans: 'All plans',
  newPlan: 'New plan',
  language: 'Language',
  tabToday: 'Today',
  tabPlan: 'Plan',
  tabRemember: 'Remember',
  tabProgress: 'Progress',
  tabAdjust: 'Adjust',

  // Home
  yourPlans: 'Your plans',
  noActivePlans: 'No active plans. Start one for your next exam or interview.',
  leftTodayOne: '{time} of study left today.',
  leftTodayMany: '{time} of study left today across {n} plans.',
  allDoneToday: 'Nothing left for today. Nice work.',
  active: 'Active',
  past: 'Past',
  newPlanHint: 'An exam or an interview, in one sentence',
  daysToGo: '{n} days to go',
  oneDayToGo: '1 day to go',
  targetToday: 'Today!',
  finished: 'Finished',
  ready: 'ready',
  paceOnTrack: 'On track',
  paceTight: 'Tight',
  paceBehind: 'Behind',
  paceDone: 'All study done',
  paceOverdue: 'Target passed',
  restDayToday: 'Rest day today',
  todayDone: 'Today done · {time}',
  todayProgress: 'Today {done} of {planned}',
  endedOn: 'Ended {date}',
  studiedTotal: '{time} studied',
  dayStreak: '{n} day streak',
  noStreak: 'No streak yet',
  openPlan: 'Open {name}',

  // Banner
  heroReady: 'Ready',
  heroStreak: 'Day streak',
  heroToday: 'Today',
  heroRest: 'Rest',
  heroPerDay: 'Per day',
  ringDaysToGo: 'days to go',
  ringDone: 'Done',

  // Today
  todaysMission: "Today's mission",
  doneOfPlanned: '{done} of {planned} done',
  markDone: 'Mark done',
  done: 'Done',
  logOtherTime: 'Log other study time',
  log: 'Log',
  undo: 'Undo',
  min: 'min',
  restDayNext: 'Rest day. Your next session is {date}.',
  targetPassedToday: 'The target date has passed. Good luck, or set a new goal.',
  kindLearn: 'Study',
  kindReview: 'Review',
  kindRevise: 'Revise',
  kindMock: 'Mock',
  kindAnalysis: 'Analysis',

  // Progress
  readiness: 'Readiness',
  pace: 'Pace',
  streak: 'Streak',
  last7Days: 'Last 7 days',
  studyTime14: 'Study time, last 14 days',
  readinessBySkill: 'Readiness by skill',

  // New plan
  askTitleA: 'What are you',
  askTitleB: 'preparing for?',
  askHint: "Say it the way you'd tell a friend: the exam or interview, when it is, and how much time you have each day.",
  askPlaceholder: 'e.g. Amazon SDE interview in 6 weeks, 2 hours a day',
  makeMyPlan: 'Make my plan',
  buildingPlan: 'Building your plan…',
  cancel: 'Cancel',
  manualSetup: 'Prefer to set everything up yourself?',
  restoreBackup: 'Have a backup from another device? Restore it',
  popularPlans: 'Or start from a ready-made plan',

  // Plan preview (starter plans and shared links)
  sharedWithYou: 'A plan was shared with you',
  readyMadePlan: 'Ready-made plan',
  previewIntro: '{n} skills, about {hours} hours of study. Set your date and daily time; the plan fits itself to them.',
  targetDate: 'Exam or interview date',
  hoursPerDay: 'Hours a day',
  restDays: 'Days off',
  addToMyPlans: 'Add to my plans',
  noThanks: 'No thanks',
  skillsInPlan: 'Skills in this plan',
  hoursShort: '{n} h',

  // Share
  shareTitle: 'Share this plan',
  shareHint: 'Send your plan to a friend or study group. They get the same skills and can set their own date. Your progress stays private.',
  shareLink: 'Share link',
  whatsApp: 'WhatsApp',
  copyLink: 'Copy link',
  copied: 'Link copied',
  shareMessage: "I'm preparing for {name} with this free plan. Open it to use the same plan:",

  // Calendar
  calendarTitle: 'Put it in your calendar',
  calendarHint: 'Add your study time to the calendar you already use, with a reminder before each session.',
  studyTime: 'Study time',
  googleCalendar: 'Add to Google Calendar',
  downloadIcs: 'All study days (.ics)',
  icsHint: 'The plan adapts as you log time, so download the file again after big changes.',
  calendarEventTitle: 'Study: {name}',

  // Reminders
  reminderTitle: 'Daily reminder',
  reminderHintApp: "A notification at the time you pick, saying what's planned for the day. Skipped on days you've already finished.",
  reminderHintWeb: "Websites can't remind you when they're closed. Get the free Android app for notifications, or add a repeating reminder to Google Calendar.",
  reminderOn: 'Remind me every day',
  reminderAt: 'At',
  reminderBlocked: 'Notifications are turned off for this app. Turn them on in Android settings, then try again.',
  getAndroidApp: 'Get the Android app',
  reminderNotifTitle: 'Time to study',
  reminderNotifOne: 'Today: {time} for {name}',
  reminderNotifMany: 'Today: {time} across {n} plans',

  // Progress picture
  pictureTitle: 'Share your progress',
  pictureHint: 'A picture of your streak and readiness for WhatsApp status or Instagram. Nothing else from your plan is in it.',
  sharePicture: 'Share picture',
  downloadPicture: 'Download',
  pictureReady: 'ready',
  pictureStreak: 'day streak',
  pictureDaysLeft: 'days to go',
  pictureStudied: 'hours studied',
  pictureFooter: 'Planned with Goal Prep Planner · free',

  // Role models and motivation
  motivationTitle: 'Who keeps you going',
  motivationHint: 'Add someone who reached a goal like yours, or write to your future self. One shows up on Today each day, and in your daily reminder.',
  inviteTitle: 'Add a role model',
  inviteText: 'Someone who made it, with a line of theirs that pushes you. Or a note to your future self.',
  inviteAdd: 'Add one',
  notNow: 'Not now',
  roleModelName: 'Name',
  roleModelNamePlaceholder: 'e.g. Sundar Pichai',
  roleModelQuote: 'Their words, or why they inspire you',
  roleModelQuotePlaceholder: 'e.g. Wear your failure as a badge of honour.',
  choosePhoto: 'Choose photo',
  removePhoto: 'Remove photo',
  photoError: "This photo couldn't be read. Try another one.",
  addRoleModel: 'Add role model',
  futureSelf: 'Write to my future self',
  futureSelfName: 'Future me',
  futureSelfQuote: 'What will it feel like when you make it?',
  futureSelfPlaceholder: 'e.g. You got the offer. Every early morning was worth it.',
  realPerson: 'Add a person instead',
  remove: 'Remove',
  save: 'Save',
  edit: 'Edit',
  roleModelsFull: 'That is the most for one plan. Remove one to add another.',
  whyTitle: "Why I'm doing this",
  whyHint: 'Comes up on Today if you miss a few study days.',
  whyPlaceholder: 'e.g. To get my family a better life, and to prove to myself I can.',
  todaysRoleModel: 'Today with {name}',
  fromFutureYou: 'A note from future you',
  missedTitle: "You've missed {n} study days. Remember why you started.",
  missedNoWhy: "You've missed {n} study days. One small session today gets you going again.",
  missedAddWhy: "Write down why you're doing this",
  celebrateDay: 'Today is done!',
  celebrateDayText: '{time} of study today. That is how it gets done.',
  celebrateWeek: 'A whole week done!',
  celebrateWeekText: 'You studied every day you planned this week. Keep it going.',
  celebrateClose: 'Thanks!',
} as const;

export type Key = keyof typeof EN;
export type Dictionary = Partial<Record<Key, string>>;

const KEY = 'goal-prep-planner/lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && LANGS.some((l) => l.id === saved)) return saved as Lang;
  } catch {
    // Storage blocked: fall through to the browser's language.
  }
  const browser = typeof navigator === 'undefined' ? '' : navigator.language.slice(0, 2);
  return LANGS.find((l) => l.id === browser)?.id ?? 'en';
}

let current: Lang = initialLang();

export const getLang = (): Lang => current;

/** The locale for dates in the current language; in English, the browser's own. */
export const locale = (): string | undefined => (current === 'en' ? undefined : LANGS.find((l) => l.id === current)!.locale);

export function setLang(lang: Lang): void {
  current = lang;
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // The choice then lasts until the page is closed.
  }
}

/** The text for a key in the current language, with {name} placeholders filled in. */
export function t(key: Key, vars?: Record<string, string | number>): string {
  const text = (current === 'en' ? undefined : TRANSLATIONS[current]?.[key]) ?? EN[key];
  return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : text;
}
