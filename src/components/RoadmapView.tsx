import React, { useState } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { PlanProject, ProjectStatus, ProjectHorizon } from '../types';
import { calculateProjectBudgetSummary } from '../utils/financeCalculators';
import { getTodayDateString } from '../utils/quickCaptureParser';
import { Plus, Check, ChevronDown, ChevronUp, Trash2, Cpu, Calendar, DollarSign } from 'lucide-react';

export const RoadmapView: React.FC = () => {
  const {
    projects,
    transactions,
    settings,
    addProject,
    updateProject,
    deleteProject,
    toggleMilestone,
    addMilestone,
    deleteMilestone,
    addTransaction,
  } = useLifeOS();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newHorizon, setNewHorizon] = useState<ProjectHorizon>('short-term');
  const [newStatus, setNewStatus] = useState<ProjectStatus>('in-progress');
  const [newTargetDate, setNewTargetDate] = useState(getTodayDateString(60));
  const [newBudget, setNewBudget] = useState('500');
  const [newCategory, setNewCategory] = useState('Hardware');
  const [newNotes, setNewNotes] = useState('');

  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(projects[0]?.id || null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  const [expenseProject, setExpenseProject] = useState<PlanProject | null>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNote, setExpenseNote] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = addProject({
      title: newTitle.trim(),
      horizon: newHorizon,
      status: newStatus,
      targetDate: newTargetDate,
      progress: 0,
      budget: parseFloat(newBudget) || 0,
      category: newCategory.trim() || 'General',
      notes: newNotes.trim(),
      milestones: [
        { id: `m-${Date.now()}`, title: 'Initial setup & architecture', completed: false },
      ],
    });

    setExpandedProjectId(created.id);
    setIsAddOpen(false);
    setNewTitle('');
    setNewNotes('');
  };

  const handleAddMilestone = (projectId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    addMilestone(projectId, newMilestoneTitle.trim());
    setNewMilestoneTitle('');
  };

  const handleLogBOMExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseProject || !expenseAmount) return;

    addTransaction({
      amount: parseFloat(expenseAmount),
      type: 'expense',
      category: 'Components',
      account: 'card',
      note: expenseNote.trim() || `Component for ${expenseProject.title}`,
      date: getTodayDateString(),
      projectId: expenseProject.id,
    });

    setExpenseAmount('');
    setExpenseNote('');
    setExpenseProject(null);
  };

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="label-mono block mb-1 text-slate-400">
            Strategic Horizons & BOM
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Roadmap & Projects
          </h1>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Segmented Filter */}
      <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800/80 text-xs w-fit">
        {(
          [
            { id: 'all', label: 'All Projects' },
            { id: 'in-progress', label: 'In Progress' },
            { id: 'idea', label: 'Ideas' },
            { id: 'shipped', label: 'Shipped' },
          ] as const
        ).map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === s.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.map((project) => {
          const isExpanded = expandedProjectId === project.id;
          const budgetSummary = calculateProjectBudgetSummary(project, transactions);
          const projectExpenses = transactions.filter(
            (t) => t.type === 'expense' && t.projectId === project.id
          );

          return (
            <div
              key={project.id}
              className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl overflow-hidden transition-colors"
            >
              <div
                className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-lg font-bold text-white">
                    {project.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
                    <span className="capitalize text-slate-300">{project.status}</span>
                    <span>·</span>
                    <span className="capitalize">{project.horizon}</span>
                    <span>·</span>
                    <span>Target: {project.targetDate}</span>
                    {project.budget && project.budget > 0 && (
                      <>
                        <span>·</span>
                        <span>
                          BOM: {settings.currency}{budgetSummary.totalSpent.toFixed(2)} / {settings.currency}{project.budget}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-36">
                    <div className="flex items-center justify-between text-xs mb-1 font-mono text-slate-400">
                      <span>Progress</span>
                      <span className="text-blue-400 font-bold">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-slate-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-950/60 p-5 space-y-5 animate-in fade-in">
                  {project.notes && (
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                      {project.notes}
                    </p>
                  )}

                  {/* Milestones */}
                  <div>
                    <span className="label-mono block mb-2 text-slate-400">
                      Milestones ({project.milestones.filter((m) => m.completed).length}/{project.milestones.length})
                    </span>

                    <div className="space-y-1.5">
                      {project.milestones.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-900/40 border border-slate-800/60 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              onClick={() => toggleMilestone(project.id, m.id)}
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                                m.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-600'
                              }`}
                            >
                              {m.completed && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <span className={m.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                              {m.title}
                            </span>
                          </div>

                          <button
                            onClick={() => deleteMilestone(project.id, m.id)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={(e) => handleAddMilestone(project.id, e)} className="flex items-center gap-2 mt-3">
                      <input
                        type="text"
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        placeholder="Add milestone step..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Add
                      </button>
                    </form>
                  </div>

                  {/* BOM Section */}
                  <div className="pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="label-mono m-0 text-slate-400">
                        Bill of Materials ({settings.currency}{budgetSummary.totalSpent.toFixed(2)} spent of {settings.currency}{project.budget || 0})
                      </span>
                      <button
                        onClick={() => setExpenseProject(project)}
                        className="text-xs font-mono text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                      >
                        + Add BOM Component
                      </button>
                    </div>

                    {projectExpenses.length > 0 && (
                      <div className="space-y-1.5">
                        {projectExpenses.map((exp) => (
                          <div
                            key={exp.id}
                            className="py-2 px-3 bg-slate-900/50 rounded-lg border border-slate-800/60 flex items-center justify-between text-xs"
                          >
                            <span className="text-slate-300">{exp.note}</span>
                            <span className="font-mono text-rose-400 font-bold">
                              -{settings.currency}{exp.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Project Modal */}
      {isAddOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 flex min-h-full items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsAddOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 my-auto max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading text-xl font-bold text-white">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="label-mono block mb-1">Project Name</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Autonomous Robotic Arm"
                  autoFocus
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="label-mono block mb-1">Target Date</label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="label-mono block mb-1">Budget ({settings.currency})</label>
                  <input
                    type="number"
                    step="any"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-md shadow-blue-600/20"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log BOM Modal */}
      {expenseProject && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 flex min-h-full items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setExpenseProject(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 my-auto max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading text-lg font-bold text-white">
              Add Component for: {expenseProject.title}
            </h2>
            <form onSubmit={handleLogBOMExpense} className="space-y-3">
              <div>
                <label className="label-mono block mb-1">Cost ({settings.currency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="45.00"
                  autoFocus
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="label-mono block mb-1">Component Name</label>
                <input
                  type="text"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  placeholder="e.g. Brushless motors"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExpenseProject(null)}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-md shadow-blue-600/20"
                >
                  Save Component
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
