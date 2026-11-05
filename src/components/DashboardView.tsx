import React, { useState } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { getTodayDateString } from '../utils/quickCaptureParser';
import {
  Check,
  Plus,
  Flame,
  ArrowRight,
  TrendingUp,
  Target,
  Sparkles,
  Wallet,
  CheckCircle2,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenQuickAdd: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenQuickAdd }) => {
  const {
    tasks,
    habits,
    projects,
    settings,
    setActiveTab,
    toggleTaskStatus,
    toggleHabitToday,
    executeQuickCaptureText,
    safeToSpend,
  } = useLifeOS();

  const [quickInput, setQuickInput] = useState('');
  const todayStr = getTodayDateString();

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    executeQuickCaptureText(quickInput);
    setQuickInput('');
  };

  // Focus tasks
  const focusTasks = tasks.filter((t) => t.isFocusTop3);
  const completedFocusCount = focusTasks.filter((t) => t.status === 'done').length;
  const pendingFocusTasks = focusTasks.filter((t) => t.status !== 'done');

  // Active projects (up to 3)
  const activeProjects = projects.filter((p) => p.status === 'in-progress').slice(0, 3);
  const avgProjectProgress =
    projects.length > 0
      ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)
      : 0;

  // Date formatting
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Welcome & Quick Entry Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="label-mono text-slate-400">
                Command Center · {formattedToday}
              </span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white tracking-tight leading-tight">
              Welcome back, {settings.userName}
            </h1>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={onOpenQuickAdd}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all shadow-md shadow-blue-600/25 active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Capture (⌘K)</span>
            </button>
          </div>
        </div>

        {/* Universal Quick Input Bar */}
        <form onSubmit={handleQuickSubmit} className="relative">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Quick capture: type task (e.g. Call client !task), expense (e.g. $45 Groceries), or plan (e.g. Launch V2 !plan)..."
            className="w-full bg-slate-900/90 border border-slate-800/80 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 px-5 py-3.5 rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition-all shadow-inner"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700/60 transition-colors"
          >
            Enter ↵
          </button>
        </form>
      </div>

      {/* 4-Card Executive KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Focus Queue */}
        <div className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-xl flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="label-mono">Focus Queue</span>
            <span className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-mono text-3xl font-bold text-white tracking-tight">
              {completedFocusCount}/{focusTasks.length || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {pendingFocusTasks.length === 0 ? 'All focus completed' : `${pendingFocusTasks.length} pending today`}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-500">Target: 3 Focus Tasks</span>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              View <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 2: Safe to Spend Daily */}
        <div className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-xl flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="label-mono">Safe To Spend</span>
            <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-mono text-3xl font-bold text-emerald-400 tracking-tight">
              {settings.currency}{Math.max(0, safeToSpend.safeToSpendToday).toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Daily budget allowance
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.min(100, safeToSpend.burnRatePercentage)}%` }}
              />
            </div>
            <div className="flex justify-between text-[0.7rem] font-mono mt-1.5 text-slate-400">
              <span>Month Burn: {safeToSpend.burnRatePercentage}%</span>
              <span>{safeToSpend.daysRemainingInMonth}d left</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Active Habit Streaks */}
        <div className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-xl flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="label-mono">Daily Rituals</span>
            <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-mono text-3xl font-bold text-amber-400 tracking-tight">
              {habits.filter((h) => h.completedDates.includes(todayStr)).length}/{habits.length}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Rituals completed today
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Top streak: {Math.max(...habits.map((h) => h.streak), 0)} days
            </span>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              Habits <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 4: Roadmap Velocity */}
        <div className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-xl flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="label-mono">Roadmap Velocity</span>
            <span className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-mono text-3xl font-bold text-indigo-400 tracking-tight">
              {avgProjectProgress}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Across {projects.length} active projects
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-500">{activeProjects.length} in progress</span>
            <button
              onClick={() => setActiveTab('roadmap')}
              className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              Roadmap <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Today's Focus Action Queue */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-white">
                  Today's Priority Focus
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Locked-in high leverage actions for today
                </p>
              </div>
              <button
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-mono text-blue-400 hover:text-blue-300 hover:underline"
              >
                Manage All ({tasks.length}) &rarr;
              </button>
            </div>

            {focusTasks.length === 0 ? (
              <div className="py-8 text-center rounded-xl border border-dashed border-slate-800 p-6 space-y-2">
                <p className="text-xs text-slate-400">
                  No focus tasks locked in for today.
                </p>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-md text-xs font-medium"
                >
                  Select Top 3 Tasks
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {focusTasks.map((task) => {
                  const isDone = task.status === 'done';
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer group ${
                        isDone
                          ? 'bg-slate-900/40 border-slate-800/40 opacity-60'
                          : 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                            isDone
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-600 group-hover:border-blue-400'
                          }`}
                          aria-label={`Toggle ${task.title}`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <span
                          className={`text-sm truncate transition-colors ${
                            isDone ? 'line-through text-slate-500' : 'text-slate-100 group-hover:text-white'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-slate-500">
                        <span className="capitalize text-slate-400 text-[0.7rem] bg-slate-800/80 px-2 py-0.5 rounded">
                          {task.category}
                        </span>
                        {task.priority === 'high' && (
                          <span className="text-rose-400 text-[0.7rem] font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            HIGH
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Roadmap Projects Grid */}
          <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-white">
                  Active Roadmap Projects
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Long-term project milestones & build budgets
                </p>
              </div>
              <button
                onClick={() => setActiveTab('roadmap')}
                className="text-xs font-mono text-blue-400 hover:text-blue-300 hover:underline"
              >
                View Roadmap &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setActiveTab('roadmap')}
                  className="p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-semibold text-slate-200 group-hover:text-white text-sm line-clamp-1">
                      {project.title}
                    </h3>
                    <span className="font-mono text-xs font-bold text-blue-400 shrink-0">
                      {project.progress}%
                    </span>
                  </div>

                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[0.7rem] font-mono text-slate-500">
                    <span>Target: {project.targetDate}</span>
                    <span className="capitalize">{project.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Financial Radar & Daily Rituals */}
        <div className="lg:col-span-5 space-y-6">
          {/* Daily Rituals Strip */}
          <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-white">
                  Daily Rituals
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tap to record completed habits for today
                </p>
              </div>
              <button
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-mono text-blue-400 hover:text-blue-300 hover:underline"
              >
                Manage &rarr;
              </button>
            </div>

            <div className="space-y-2">
              {habits.map((habit) => {
                const isCompleted = habit.completedDates.includes(todayStr);
                return (
                  <div
                    key={habit.id}
                    onClick={() => toggleHabitToday(habit.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group ${
                      isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-600 group-hover:border-slate-400'
                        }`}
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-sm truncate ${isCompleted ? 'font-medium' : ''}`}>
                        {habit.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono shrink-0">
                      <Flame
                        className={`w-3.5 h-3.5 ${
                          habit.streak > 0 ? 'text-amber-400 fill-amber-400/30' : 'text-slate-600'
                        }`}
                      />
                      <span className="font-bold text-slate-400">{habit.streak}d</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Burn Radar */}
          <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-white">
                  Monthly Budget Radar
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Remaining cushion & discretionary burn
                </p>
              </div>
              <button
                onClick={() => setActiveTab('finances')}
                className="text-xs font-mono text-blue-400 hover:text-blue-300 hover:underline"
              >
                Ledger &rarr;
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Total Spent This Month</span>
                <span className="font-mono text-sm font-bold text-slate-200">
                  {settings.currency}{safeToSpend.spentSoFarThisMonth.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Discretionary Remaining</span>
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {settings.currency}{Math.max(0, safeToSpend.safeToSpendMonth).toFixed(2)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/60">
                <div className="flex justify-between text-xs font-mono mb-1 text-slate-400">
                  <span>Burn Pace</span>
                  <span>{safeToSpend.burnRatePercentage}% of budget</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, safeToSpend.burnRatePercentage)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
