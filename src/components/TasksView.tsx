import React, { useState, useMemo } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { Priority, TaskCategory } from '../types';
import { getTodayDateString } from '../utils/quickCaptureParser';
import { Plus, Check, Trash2, Search, Star, Calendar, Filter } from 'lucide-react';

export const TasksView: React.FC = () => {
  const {
    tasks,
    projects,
    addTask,
    toggleTaskStatus,
    deleteTask,
    toggleFocusTop3,
    startMyDay,
  } = useLifeOS();

  const [activeFilter, setActiveFilter] = useState<'today' | 'all' | 'done'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [priority, setPriority] = useState<Priority>('med');
  const [isFocus, setIsFocus] = useState(false);
  const [projectId, setProjectId] = useState('');

  const todayStr = getTodayDateString();
  const overdueCount = tasks.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr).length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      status: 'todo',
      priority,
      category,
      dueDate,
      isFocusTop3: isFocus,
      projectId: projectId || undefined,
    });

    setTitle('');
    setIsAddOpen(false);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!task.title.toLowerCase().includes(q) && !task.category.toLowerCase().includes(q)) {
          return false;
        }
      }

      if (activeFilter === 'today') {
        return task.dueDate === todayStr && task.status !== 'done';
      }
      if (activeFilter === 'done') {
        return task.status === 'done';
      }
      return task.status !== 'done';
    });
  }, [tasks, activeFilter, searchQuery, todayStr]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="label-mono block mb-1 text-slate-400">
            Execution & Capture
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Daily & Tasks
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {overdueCount > 0 && (
            <button
              onClick={startMyDay}
              className="bg-amber-500/10 border border-amber-500/30 hover:border-amber-500 text-amber-400 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer"
            >
              Rollover {overdueCount} overdue task{overdueCount > 1 ? 's' : ''}
            </button>
          )}

          <button
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Add Task Drawer */}
      {isAddOpen && (
        <form
          onSubmit={handleCreate}
          className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4 animate-in fade-in shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="label-mono m-0 text-slate-300">Create New Task</span>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task description (e.g. Schedule team engineering review)..."
            autoFocus
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-4 py-3 rounded-xl text-sm text-white outline-none"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="label-mono block mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none"
              />
            </div>

            <div>
              <label className="label-mono block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none"
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="academic">Academic</option>
                <option value="projects">Projects</option>
              </select>
            </div>

            <div>
              <label className="label-mono block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none"
              >
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="label-mono block mb-1">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none truncate"
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isFocus}
                onChange={(e) => setIsFocus(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                <span>Mark as Today's Focus</span>
              </span>
            </label>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-md shadow-blue-600/20"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-lg border border-slate-800/60">
          <button
            onClick={() => setActiveFilter('today')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeFilter === 'today'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Today's Tasks
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Pending
          </button>
          <button
            onClick={() => setActiveFilter('done')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeFilter === 'done'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks or categories..."
            className="w-full bg-slate-950 text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 text-xs outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-1.5 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-2">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No tasks found in this view.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'done';
            const linkedProject = projects.find((p) => p.id === task.projectId);

            return (
              <div
                key={task.id}
                className={`py-3 px-4 rounded-xl border border-transparent flex items-center justify-between gap-3 group transition-colors ${
                  isDone
                    ? 'opacity-40 bg-slate-950/20'
                    : 'hover:bg-slate-800/40 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                      isDone
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-600 group-hover:border-blue-400'
                    }`}
                    aria-label={`Toggle task completion: ${task.title}`}
                  >
                    {isDone && <Check className="w-3 h-3 text-white" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-sm font-medium block truncate ${
                        isDone ? 'line-through text-slate-500' : 'text-slate-100 group-hover:text-white'
                      }`}
                    >
                      {task.title}
                    </span>

                    <div className="flex items-center gap-2 mt-0.5 text-[0.7rem] font-mono text-slate-400">
                      <span className="capitalize">{task.category}</span>
                      <span>·</span>
                      <span>{task.dueDate === todayStr ? 'Today' : task.dueDate}</span>
                      <span>·</span>
                      <span
                        className={
                          task.priority === 'high'
                            ? 'text-rose-400 font-bold'
                            : task.priority === 'med'
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }
                      >
                        {task.priority.toUpperCase()}
                      </span>
                      {linkedProject && (
                        <>
                          <span>·</span>
                          <span className="text-blue-400 truncate max-w-[140px]">
                            {linkedProject.title}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleFocusTop3(task.id)}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      task.isFocusTop3 ? 'text-blue-400 bg-blue-500/10' : 'text-slate-600 hover:text-blue-400'
                    }`}
                    aria-label="Toggle Current Focus"
                  >
                    <Star className={`w-3.5 h-3.5 ${task.isFocusTop3 ? 'fill-blue-400' : ''}`} />
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-slate-600 hover:text-rose-400 rounded-md hover:bg-rose-500/10 transition-colors cursor-pointer"
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
