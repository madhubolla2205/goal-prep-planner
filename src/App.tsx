import { useEffect, useMemo, useState } from 'react';
import { AskGoal } from './components/AskGoal';
import { Dashboard } from './components/Dashboard';
import { GoalForm } from './components/GoalForm';
import { PlanView } from './components/PlanView';
import { SkillsView } from './components/SkillsView';
import { TodayView } from './components/TodayView';
import { daysBetween, todayISO } from './lib/dates';
import { loadState, saveState, type AppState } from './lib/storage';
import type { Goal } from './lib/types';

type Tab = 'today' | 'plan' | 'dashboard' | 'adjust';

const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'plan', label: 'Plan' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'adjust', label: 'Adjust' },
];

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [tab, setTab] = useState<Tab>('today');
  const [creating, setCreating] = useState<false | 'ask' | 'manual'>(false);
  const today = todayISO();

  useEffect(() => saveState(state), [state]);

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

  const deleteGoal = (id: string) => {
    if (!confirm('Delete this goal and all its progress?')) return;
    setState((s) => {
      const goals = s.goals.filter((g) => g.id !== id);
      return { goals, activeGoalId: goals[0]?.id ?? null };
    });
  };

  if (creating || !goal) {
    return (
      <div className="app">
        <header className="topbar">
          <h1 className="brand">Goal Prep Planner</h1>
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
            />
          )}
        </main>
      </div>
    );
  }

  const daysLeft = daysBetween(today, goal.targetDate);

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">Goal Prep Planner</h1>
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
          <button className="ghost" onClick={() => setCreating('ask')}>New goal</button>
        </div>
      </header>

      <section className="goal-head">
        <div>
          <span className="chip">{goal.type === 'exam' ? 'Exam' : 'Interview'}</span>
          <h2>{goal.name}</h2>
        </div>
        <p className="countdown">
          {daysLeft > 0 ? <><strong>{daysLeft}</strong> days to go</> : daysLeft === 0 ? <strong>Today is the day</strong> : 'Target date passed'}
        </p>
      </section>

      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'today' && <TodayView goal={goal} today={today} onChange={updateGoal} onAdjust={() => setTab('adjust')} />}
        {tab === 'plan' && <PlanView goal={goal} today={today} />}
        {tab === 'dashboard' && <Dashboard goal={goal} today={today} />}
        {tab === 'adjust' && <SkillsView goal={goal} onChange={updateGoal} onDelete={() => deleteGoal(goal.id)} />}
      </main>
    </div>
  );
}
