import React, { useState } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { Plus, Trash2, CheckSquare, MapPin } from 'lucide-react';

export const BrainDumpView: React.FC = () => {
  const {
    brainDump,
    addBrainDump,
    deleteBrainDump,
    convertBrainDumpToTask,
    convertBrainDumpToProject,
  } = useLifeOS();

  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Ideas');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    addBrainDump(newContent.trim(), newCategory.trim() || 'Note');
    setNewContent('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-16">
      {/* Header */}
      <div>
        <span className="label-mono block mb-1 text-slate-400">
          Unstructured Ideation
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Brain Dump & Scratchpad
        </h1>
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleCreate}
        className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-3.5 shadow-lg"
      >
        <textarea
          rows={3}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Dump an idea, part number, quick bookmark, or architectural thought..."
          className="w-full bg-slate-950 text-white placeholder-slate-500 text-sm p-4 rounded-xl border border-slate-800 focus:border-blue-500 outline-none transition-colors"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="label-mono">Tag:</span>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g. Hardware"
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 text-xs outline-none w-32 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={!newContent.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-lg text-xs tracking-wide flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Save Note</span>
          </button>
        </div>
      </form>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brainDump.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/60 text-slate-500 text-xs">
            Your scratchpad is clean and empty.
          </div>
        ) : (
          brainDump.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 text-[0.7rem] font-mono text-slate-400 mb-2.5">
                  <span className="text-blue-400 font-bold">#{item.category || 'Idea'}</span>
                  <span>·</span>
                  <span>{item.createdAt}</span>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => convertBrainDumpToTask(item.id)}
                    className="text-xs font-mono text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>To Task</span>
                  </button>

                  <span className="text-slate-600">·</span>

                  <button
                    onClick={() => convertBrainDumpToProject(item.id)}
                    className="text-xs font-mono text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>To Project</span>
                  </button>
                </div>

                <button
                  onClick={() => deleteBrainDump(item.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  aria-label="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
