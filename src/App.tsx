import { useEffect, useMemo, useState } from 'react';
import { AskGoal } from './components/AskGoal';
import { Dashboard } from './components/Dashboard';
import { GoalForm } from './components/GoalForm';
import { Hero } from './components/Hero';
import { Icon, type IconName } from './components/Icon';
import { NotesView } from './components/NotesView';
import { PlanView } from './components/PlanView';
import { SkillsView } from './components/SkillsView';
import { TodayView } from './components/TodayView';
import { YourData } from './components/YourData';
import { todayISO } from './lib/dates';
import { protectStorage } from './lib/device';
import { loadState, saveState, type AppState } from './lib/storage';
import { WELCOME_THEME, themeFor, type PathTheme } from './lib/themes';
import type { Goal } from './lib/types';

type Tab = 'today' | 'plan' | 'notes' | 'dashboard' | 'adjust';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Today', icon: 'sun' },
  { id: 'plan', label: 'Plan', icon: 'calendar' },
  { id: 'notes', label: 'Remember', icon: 'bulb' },
  { id: 'dashboard', label: 'Progress', icon: 'bars' },
  { id: 'adjust', label: 'Adjust', icon: 'sliders' },
];

/** The theme's colours as CSS variables, for everything under the app root. */
function themeStyle(theme: PathTheme): React.CSSProperties {
  return { ['--t1' as string]: theme.from, ['--t2' as string]: theme.to };
}

function Brand() {
  return (
    <h1 className="brand">
      <img className="brand-mark" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={32} height={32} />
      Goal Prep Planner
    </h1>
  );
}

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [tab, setTab] = useState<Tab>('today');
  const [creating, setCreating] = useState<false | 'ask' | 'manual'>(false);

  const [protectedData, setProtectedData] = useState<boolean | null>(null);
  const today = todayISO();
  const hasGoals = state.goals.length > 0;

  useEffect(() => saveState(state), [state]);

  // Once there's something worth keeping, ask the browser not to clear it.
  useEffect(() => {
    if (hasGoals) void protectStorage().then(setProtectedData);
  }, [hasGoals]);

  const goal = useMemo(
    () => state.goals.find((g) => g.id === state.activeGoalId) ?? state.goals[0],
    [state],
  );

  const updateGoal = (next: Goal) =>
    setState((s) => ({ ...s, goals: s.goals.map((g) => (g.id === next.id ? next : g)) }));

  const addGoal = (g: Goal) => {
    setState((s) => ({ goals: [...s.goals, g], activeGoalId: g.id }));
    setCreating(false);
    setTab('today');
  };

  const restore = (next: AppState) => {
    setState(next);
    setCreating(false);
    setTab('today');
  };

  const deleteGoal = (id: string) => {
    if (!confirm('Delete this goal and all its progress?')) return;
    setState((s) => {
      const goals = s.goals.filter((g) => g.id !== id);
      return { goals, activeGoalId: goals[0]?.id ?? null };
    });
  };

  if (creating || !goal) {
    return (
      <div className="app" style={themeStyle(WELCOME_THEME)}>
        <header className="topbar">
          <Brand />
        </header>
        <main>
          {creating === 'manual' ? (
            <GoalForm today={today} onCreate={addGoal} onCancel={() => setCreating(goal ? false : 'ask')} />
          ) : (
            <AskGoal
              today={today}
              onCreate={addGoal}
              onManual={() => setCreating('manual')}
              onCancel={goal ? () => setCreating(false) : undefined}
              restore={goal ? undefined : { state, onRestore: restore }}
            />
          )}
        </main>
      </div>
    );
  }

  const theme = themeFor(goal);

  return (
    <div className={`app theme-${theme.id}`} style={themeStyle(theme)}>
      <header className="topbar">
        <Brand />
        <div className="goal-switch">
          <select
            aria-label="Active goal"
            value={goal.id}
            onChange={(e) => setState((s) => ({ ...s, activeGoalId: e.target.value }))}
          >
            {state.goals.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <button className="ghost" onClick={() => setCreating('ask')}><Icon name="plus" size={16} /> New goal</button>
        </div>
      </header>

      <Hero goal={goal} theme={theme} today={today} />

      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={16} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <main>
        {tab === 'today' && (
          <TodayView goal={goal} today={today} onChange={updateGoal} onAdjust={() => setTab('adjust')} onOpenNotes={() => setTab('notes')} />
        )}
        {tab === 'plan' && <PlanView goal={goal} today={today} />}
        {tab === 'notes' && <NotesView goal={goal} theme={theme} today={today} onChange={updateGoal} />}
        {tab === 'dashboard' && <Dashboard goal={goal} today={today} />}
        {tab === 'adjust' && (
          <div className="stack">
            <SkillsView goal={goal} onChange={updateGoal} onDelete={() => deleteGoal(goal.id)} />
            <YourData state={state} today={today} protectedData={protectedData} onRestore={restore} />
          </div>
        )}
      </main>
    </div>
  );
}
