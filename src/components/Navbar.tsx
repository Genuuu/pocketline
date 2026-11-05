import React from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  CheckSquare,
  Map,
  Wallet,
  Lightbulb,
  Settings,
  Plus,
} from 'lucide-react';

interface NavbarProps {
  onOpenQuickCapture: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQuickCapture }) => {
  const { activeTab, setActiveTab, currentUser, signInWithGoogle, signOutUser } = useLifeOS();

  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'roadmap', label: 'Roadmap', icon: Map },
    { id: 'finances', label: 'Finances', icon: Wallet },
    { id: 'scratchpad', label: 'Notes', icon: Lightbulb },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Bar (Adhering to strict 3-zone contract) */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-8">
            {/* Zone 1: Brand Wordmark (Single clean element) */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-left group focus:outline-none flex items-center gap-2.5 shrink-0"
              aria-label="Go to Dashboard"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
                L
              </div>
              <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                Life OS
              </span>
            </button>

            {/* Zone 2: Navigation Links (Clean text links with active indicator) */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/70">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 opacity-80" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Actions & Firebase Sync Status */}
            <div className="flex items-center gap-2.5 shrink-0">
              {currentUser ? (
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-mono text-[11px] truncate max-w-[120px]">{currentUser.displayName || currentUser.email}</span>
                  <button
                    onClick={() => signOutUser()}
                    className="ml-1 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer underline"
                    title="Sign Out"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signInWithGoogle()}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-medium transition-all cursor-pointer"
                  title="Sign in with Google to sync across devices"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sync Account</span>
                </button>
              )}

              <button
                onClick={onOpenQuickCapture}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] whitespace-nowrap cursor-pointer"
                aria-label="Quick Add Entry"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Quick Add</span>
                <kbd className="hidden lg:inline text-[10px] bg-indigo-700/60 px-1 py-0.5 rounded font-mono ml-0.5">
                  ⌘K
                </kbd>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-2 flex items-center justify-around shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] transition-colors ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Floating Action Button */}
      <button
        onClick={onOpenQuickCapture}
        className="md:hidden fixed bottom-18 right-4 z-40 w-12 h-12 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        aria-label="Quick Add on Mobile"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </>
  );
};
