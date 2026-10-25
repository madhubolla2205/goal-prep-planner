import { useEffect, useMemo, useState } from 'react';
import { AskGoal } from './components/AskGoal';
import { CalendarCard } from './components/CalendarCard';
import { Dashboard } from './components/Dashboard';
import { GoalForm } from './components/GoalForm';
import { Hero } from './components/Hero';
import { Home } from './components/Home';
import { Icon, type IconName } from './components/Icon';
import { formatMinutes } from './components/labels';
import { LanguagePicker } from './components/LanguagePicker';
import { MotivationEditor } from './components/Motivation';
import { NotesView } from './components/NotesView';
import { PlanOfferView } from './components/PlanOfferView';
import { PlanView } from './components/PlanView';
import { ProgressPicture } from './components/ProgressPicture';
import { ReminderCard } from './components/ReminderCard';
import { SharePlan } from './components/SharePlan';
import { SkillsView } from './components/SkillsView';
import { TodayView } from './components/TodayView';
import { YourData } from './components/YourData';
import { todayISO, type ISODate } from './lib/dates';
import { isNativeApp, protectStorage } from './lib/device';
import { getLang, setLang, t, type Key, type Lang } from './lib/i18n';
import { modelName, reminderLine, roleModelFor } from './lib/motivation';
import { loadReminder, saveReminder, upcomingReminders, type ReminderSettings } from './lib/reminders';
import { loadScriptFont } from './lib/scriptFont';
import { decodePlan, offerFromStarter, planCodeFromHash, starterIdFromHash, type PlanOffer } from './lib/shareLink';
import { starterById } from './lib/starters';
import { loadState, saveState, type AppState } from './lib/storage';
import { WELCOME_THEME, themeFor, type PathTheme } from './lib/themes';
import type { Goal } from './lib/types';

type Tab = 'today' | 'plan' | 'notes' | 'dashboard' | 'adjust';

const TABS: { id: Tab; label: Key; icon: IconName }[] = [
  { id: 'today', label: 'tabToday', icon: 'sun' },
  { id: 'plan', label: 'tabPlan', icon: 'calendar' },
  { id: 'notes', label: 'tabRemember', icon: 'bulb' },
  { id: 'dashboard', label: 'tabProgress', icon: 'bars' },
  { id: 'adjust', label: 'tabAdjust', icon: 'sliders' },
];

/** The theme's colours as CSS variables, for everything under the app root. */
function themeStyle(theme: PathTheme): React.CSSProperties {
  return { ['--t1' as string]: theme.from, ['--t2' as string]: theme.to };
}

function Brand({ onHome }: { onHome?: () => void }) {
  const mark = <img className="brand-mark" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={32} height={32} />;
  return (
    <h1 className="brand">
      {onHome ? (
        <button className="brand brand-home" onClick={onHome} aria-label={`Goal Prep Planner, ${t('allPlans')}`}>{mark} Goal Prep Planner</button>
      ) : (
        <>{mark} Goal Prep Planner</>
      )}
    </h1>
  );
}

/** A plan offered by the page address: "#plan=…" from a shared link, "#starter=…" from a plan's web page. */
function offerFromAddress(today: ISODate): PlanOffer | null {
  const code = planCodeFromHash(location.hash);
  if (code) return decodePlan(code, today);
  const starter = starterById(starterIdFromHash(location.hash) ?? '');
  return starter ? offerFromStarter(starter, today) : null;
}

export default function App() {
  const today = todayISO();
  const [state, setState] = useState<AppState>(loadState);
  const [tab, setTab] = useState<Tab>('today');
  const [creating, setCreating] = useState<false | 'ask' | 'manual'>(false);
  // With more than one plan the app opens on the list of plans; with one it opens that plan.
  const [view, setView] = useState<'home' | 'plan'>(() => (state.goals.length > 1 ? 'home' : 'plan'));
  const [offer, setOffer] = useState<PlanOffer | null>(() => offerFromAddress(today));
  const [lang, setLangState] = useState<Lang>(getLang);
  const [reminder, setReminder] = useState<ReminderSettings>(loadReminder);

  const [protectedData, setProtectedData] = useState<boolean | null>(null);
  const hasGoals = state.goals.length > 0;

  useEffect(() => saveState(state), [state]);

  // Once there's something worth keeping, ask the browser not to clear it.
  useEffect(() => {
    if (hasGoals) void protectStorage().then(setProtectedData);
  }, [hasGoals]);

  // t() reads the language when screens render, so it is switched before the re-render.
  const changeLang = (next: Lang) => {
    setLang(next);
    setLangState(next);
  };
  useEffect(() => {
    document.documentElement.lang = lang;
    loadScriptFont(lang);
  }, [lang]);

  // A plan link opened while the app is already open; the address is then
  // tidied so a reload doesn't offer the plan again.
  useEffect(() => {
    const read = () => {
      const next = offerFromAddress(todayISO());
      if (next) setOffer(next);
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  // Android reminders follow the plan: rescheduled after every change, shortly after it.
  useEffect(() => {
    saveReminder(reminder);
    if (!isNativeApp()) return;
    const timer = setTimeout(() => {
      void import('./lib/nativeReminders').then(({ scheduleReminders }) =>
        scheduleReminders(upcomingReminders(state.goals, todayISO()), reminder.enabled ? reminder.time : null, (day) => {
          // The day's role model, from the first plan that has one, leads the notification.
          const model = day.goals.map((g) => roleModelFor(g, day.date)).find((m) => m !== null);
          return {
            title: model ? reminderLine(model, modelName(model)) : t('reminderNotifTitle'),
            body: day.goals.length === 1
              ? t('reminderNotifOne', { time: formatMinutes(day.minutes), name: day.goals[0].name })
              : t('reminderNotifMany', { time: formatMinutes(day.minutes), n: day.goals.length }),
          };
        }),
      );
    }, 1500);
    return () => clearTimeout(timer);
  }, [state.goals, reminder, lang]);

  const goal = useMemo(
    () => state.goals.find((g) => g.id === state.activeGoalId) ?? state.goals[0],
    [state],
  );

  const updateGoal = (next: Goal) =>
    setState((s) => ({ ...s, goals: s.goals.map((g) => (g.id === next.id ? next : g)) }));

  const addGoal = (g: Goal) => {
    setState((s) => ({ goals: [...s.goals, g], activeGoalId: g.id }));
    setCreating(false);
    setOffer(null);
    setView('plan');
    setTab('today');
    window.scrollTo(0, 0);
  };

  const openGoal = (id: string) => {
    setState((s) => ({ ...s, activeGoalId: id }));
    setView('plan');
    setTab('today');
    window.scrollTo(0, 0);
  };

  const goHome = () => {
    setCreating(false);
    setView('home');
    window.scrollTo(0, 0);
  };

  const restore = (next: AppState) => {
    setState(next);
    setCreating(false);
    setView(next.goals.length > 1 ? 'home' : 'plan');
    setTab('today');
  };

  const deleteGoal = (id: string) => {
    if (!confirm('Delete this goal and all its progress?')) return;
    setState((s) => {
      const goals = s.goals.filter((g) => g.id !== id);
      return { goals, activeGoalId: goals[0]?.id ?? null };
    });
    setView('home');
  };

  const picker = <LanguagePicker lang={lang} onChange={changeLang} />;

  if (offer) {
    return (
      <div className="app" style={themeStyle(WELCOME_THEME)}>
        <header className="topbar">
          <Brand />
          <div className="goal-switch">{picker}</div>
        </header>
        <main>
          <PlanOfferView offer={offer} today={today} onCreate={addGoal} onCancel={() => setOffer(null)} />
        </main>
      </div>
    );
  }

  if (creating || !goal) {
    return (
      <div className="app" style={themeStyle(WELCOME_THEME)}>
        <header className="topbar">
          <Brand onHome={goal ? goHome : undefined} />
          <div className="goal-switch">{picker}</div>
        </header>
        <main>
          {creating === 'manual' ? (
            <GoalForm today={today} onCreate={addGoal} onCancel={() => setCreating(goal ? false : 'ask')} />
          ) : (
            <AskGoal
              today={today}
              onCreate={addGoal}
              onManual={() => setCreating('manual')}
              onStarter={(s) => setOffer(offerFromStarter(s, today))}
              onCancel={goal ? () => setCreating(false) : undefined}
              restore={goal ? undefined : { state, onRestore: restore }}
            />
          )}
        </main>
      </div>
    );
  }

  if (view === 'home') {
    return (
      <div className="app" style={themeStyle(WELCOME_THEME)}>
        <header className="topbar">
          <Brand />
          <div className="goal-switch">{picker}</div>
        </header>
        <main>
          <Home goals={state.goals} today={today} onOpen={openGoal} onNew={() => setCreating('ask')}>
            <ReminderCard goals={state.goals} today={today} settings={reminder} onChange={setReminder} />
          </Home>
        </main>
      </div>
    );
  }

  const theme = themeFor(goal);

  return (
    <div className={`app theme-${theme.id}`} style={themeStyle(theme)}>
      <header className="topbar">
        <Brand onHome={goHome} />
        <div className="goal-switch">
          {picker}
          <button className="ghost" onClick={goHome} aria-label={t('allPlans')}><Icon name="grid" size={16} /> <span className="hide-sm">{t('allPlans')}</span></button>
          <button className="ghost" onClick={() => setCreating('ask')} aria-label={t('newPlan')}><Icon name="plus" size={16} /> <span className="hide-sm">{t('newPlan')}</span></button>
        </div>
      </header>

      <Hero goal={goal} theme={theme} today={today} />

      <nav className="tabs" role="tablist">
        {TABS.map((tb) => (
          <button key={tb.id} role="tab" aria-selected={tab === tb.id} className={tab === tb.id ? 'active' : ''} onClick={() => setTab(tb.id)}>
            <Icon name={tb.icon} size={16} />
            <span>{t(tb.label)}</span>
          </button>
        ))}
      </nav>

      <main>
        {tab === 'today' && (
          <TodayView goal={goal} today={today} onChange={updateGoal} onAdjust={() => setTab('adjust')} onOpenNotes={() => setTab('notes')} />
        )}
        {tab === 'plan' && (
          <div className="stack">
            <div className="tool-grid">
              <SharePlan goal={goal} />
              <CalendarCard goal={goal} today={today} />
            </div>
            <PlanView goal={goal} today={today} />
          </div>
        )}
        {tab === 'notes' && <NotesView goal={goal} theme={theme} today={today} onChange={updateGoal} />}
        {tab === 'dashboard' && (
          <div className="stack">
            <ProgressPicture goal={goal} theme={theme} today={today} />
            <Dashboard goal={goal} today={today} />
          </div>
        )}
        {tab === 'adjust' && (
          <div className="stack">
            <SkillsView goal={goal} onChange={updateGoal} onDelete={() => deleteGoal(goal.id)} />
            <MotivationEditor key={goal.id} goal={goal} onChange={updateGoal} />
            <ReminderCard goals={state.goals} today={today} settings={reminder} onChange={setReminder} />
            <YourData state={state} today={today} protectedData={protectedData} onRestore={restore} />
          </div>
        )}
      </main>
    </div>
  );
}
