import React from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from '../types';
import {
  Wallet,
  Receipt,
  Sparkles,
  RefreshCcw,
  Sliders,
  X,
  Menu,
  LogOut,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
  onOpenMobile,
}) => {
  const {
    activeTab,
    setActiveTab,
    accountBalances,
    pendingReimbursements,
    formatAmount,
    isPrivacyMasked,
    togglePrivacyMask,
  } = useLifeOS();
  const { user, signOut } = useAuth();

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Wallet },
    { id: 'ledger', label: 'Ledger', icon: Receipt },
    { id: 'wishlist', label: 'Wishlist', icon: Sparkles },
    {
      id: 'reimbursements',
      label: 'Shared & Owed',
      icon: RefreshCcw,
      badge: pendingReimbursements.count > 0 ? pendingReimbursements.count : undefined,
    },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  const handleNavClick = (id: ActiveTab) => {
    setActiveTab(id);
    onCloseMobile();
  };

  const isItemActive = (id: ActiveTab) => {
    if (activeTab === id) return true;
    if (id === 'overview' && (activeTab === 'dashboard' || activeTab === 'finances')) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs font-heading shadow-sm shadow-blue-600/30">
            P
          </div>
          <span className="font-heading text-base font-semibold tracking-tight text-white">
            Pocketline
          </span>
        </div>
        <button
          onClick={onOpenMobile}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      {/* Desktop & Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[240px] bg-[#090d16] border-r border-slate-800/80 p-5 flex flex-col justify-between transition-transform duration-200 ease-in-out overflow-y-auto ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1">
          {/* Brand Lockup */}
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs tracking-tight font-heading shadow-md shadow-blue-600/30">
                P
              </div>
              <span className="font-heading text-base font-bold tracking-tight text-white">
                Pocketline
              </span>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation with Rich Blue Highlights */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isItemActive(item.id);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2.5 cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate flex-1">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        active ? 'bg-blue-700 text-white' : 'bg-slate-800 text-blue-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Minimal Footer: Accounts Summary & User */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          {/* Accounts Summary Widget */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-mono text-blue-300/70 font-semibold">
                Accounts
              </span>
              <button
                type="button"
                onClick={togglePrivacyMask}
                className="p-1 rounded text-slate-500 hover:text-blue-300 transition-colors cursor-pointer"
                title={isPrivacyMasked ? 'Reveal amounts' : 'Mask amounts'}
              >
                {isPrivacyMasked ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
              </button>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                  <span>Main</span>
                </span>
                <span className="text-blue-200 font-medium tabular-nums">
                  {formatAmount(accountBalances.main.balance, { decimals: 0 })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50" />
                  <span>Personal</span>
                </span>
                <span className="text-slate-200 font-medium tabular-nums">
                  {formatAmount(accountBalances.personal.balance, { decimals: 0 })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                  <span>Savings</span>
                </span>
                <span className="text-amber-400 font-medium tabular-nums">
                  {formatAmount(accountBalances.savings.balance, { decimals: 0 })}
                </span>
              </div>
            </div>

            {/* Quick Shortcuts Cheat Sheet */}
            <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[0.65rem] font-mono text-slate-500">
              <span title="Search Ledger"><kbd className="text-slate-400">⌘F</kbd> Search</span>
              <span title="Quick New Entry"><kbd className="text-slate-400">⌘K</kbd> Log</span>
              <span title="Move Money"><kbd className="text-slate-400">⌘T</kbd> Move</span>
            </div>
          </div>

          {/* User Profile Row */}
          {user && (
            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-semibold text-[11px] flex items-center justify-center font-mono shrink-0">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-slate-200 truncate leading-tight">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono truncate">
                    {user.email}
                  </span>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
