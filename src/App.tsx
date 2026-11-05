/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LifeOSProvider, useLifeOS } from './context/LifeOSContext';
import { Sidebar } from './components/Sidebar';
import { FinanceOverview } from './components/FinanceOverview';
import { FinanceLedger } from './components/FinanceLedger';
import { FinanceWishlist } from './components/FinanceWishlist';
import { FinanceReimbursements } from './components/FinanceReimbursements';
import { FinanceSettings } from './components/FinanceSettings';
import { LoginView } from './components/LoginView';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ToastContainer } from './components/ToastContainer';
import { Plus, FileSpreadsheet, ArrowRightLeft, Wallet, Receipt, Sparkles, RefreshCcw, LogOut, Eye, EyeOff, Search, Menu } from 'lucide-react';
import { ActiveTab, Transaction } from './types';

const MainApp: React.FC = () => {
  const { user, signOut } = useAuth();
  const { activeTab, setActiveTab, exportDataCSV, isPrivacyMasked, togglePrivacyMask } = useLifeOS();
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
  const [highlightedTransactionId, setHighlightedTransactionId] = useState<string | undefined>(undefined);
  const [modalDefaultType, setModalDefaultType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [modalDefaultAccount, setModalDefaultAccount] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Transfer defaults
  const [transferDefaults, setTransferDefaults] = useState<{
    from: string;
    to: string;
  }>({ from: 'main', to: 'personal' });

  // Keyboard shortcut listener for fast transaction capture & global search (⌘F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      // Global Search: ⌘F or Ctrl+F
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setModalDefaultType('expense');
        setModalDefaultAccount('personal');
        setIsQuickCaptureOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setModalDefaultType('transfer');
        setModalDefaultAccount('main');
        setTransferDefaults({ from: 'main', to: 'personal' });
        setIsQuickCaptureOpen(true);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        setModalDefaultType('expense');
        setModalDefaultAccount('personal');
        setIsQuickCaptureOpen(true);
      } else if (e.key === 'Escape') {
        setIsQuickCaptureOpen(false);
        setIsGlobalSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenLogModal = (
    type: 'expense' | 'income' | 'transfer' = 'expense',
    account?: string
  ) => {
    setModalDefaultType(type);
    setModalDefaultAccount(account);
    setIsQuickCaptureOpen(true);
  };

  const handleOpenTransferModal = (
    from = 'main',
    to = 'personal'
  ) => {
    setTransferDefaults({ from, to });
    setModalDefaultAccount(from);
    setModalDefaultType('transfer');
    setIsQuickCaptureOpen(true);
  };

  const handleSelectTransactionFromSearch = (tx: Transaction) => {
    setLedgerSearchQuery(tx.note || tx.date || '');
    setHighlightedTransactionId(tx.id);
    setActiveTab('ledger');
  };

  const handleOpenLedgerWithQuery = (query: string) => {
    setLedgerSearchQuery(query);
    setActiveTab('ledger');
  };

  const tabLabels: Record<string, string> = {
    overview: 'Cash Flow Overview',
    dashboard: 'Cash Flow Overview',
    finances: 'Cash Flow Overview',
    ledger: 'Transactions Ledger',
    wishlist: 'Purchase Wishlist',
    reimbursements: 'Shared & Owed',
    settings: 'Accounts & Settings',
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-[#f8fafc] font-sans flex flex-col lg:flex-row antialiased selection:bg-blue-600 selection:text-white">
      {/* 240px Minimalist Sidebar */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenMobile={() => setIsMobileSidebarOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen lg:ml-[240px] flex flex-col pt-0 pb-20 lg:pb-0 scroll-pt-20">
        {/* Sticky Top Bar Header - Streamlined Single Command Bar */}
        <header className="sticky top-0 z-30 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3 shadow-md shadow-slate-950/20">
          {/* Mobile Menu Toggle + App Brand + Active Section Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors shrink-0 cursor-pointer"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs font-heading shrink-0 shadow-sm shadow-blue-600/30">
                P
              </div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-white font-heading truncate">
                {tabLabels[activeTab] || 'Overview'}
              </span>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">{formattedDate}</span>
            </div>
          </div>

          {/* Unified Actions: Search + Move Money + New Entry + Utility Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Search Shortcut Button (⌘F) */}
            <button
              onClick={() => setIsGlobalSearchOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-900 border border-slate-700/80 hover:border-blue-500/50 hover:bg-slate-850 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Search transactions by merchant, date, or amount across Ledger (⌘F)"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[0.62rem] font-mono bg-slate-800 border border-slate-700 rounded text-slate-400">
                ⌘F
              </kbd>
            </button>

            {/* Move Money */}
            <button
              onClick={() => handleOpenTransferModal('main', 'personal')}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-900 border border-slate-700/80 hover:border-blue-500/50 hover:bg-slate-850 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Transfer funds between accounts (⌘T)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Move Money</span>
            </button>

            {/* Primary Action: + New Entry (Handles Expense, Income, or Transfer) */}
            <button
              onClick={() => handleOpenLogModal('expense', 'personal')}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/25 active:scale-98 cursor-pointer"
              title="Log expense, income, or transfer (⌘K or /)"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">New Entry</span>
              <span className="sm:hidden font-mono">Entry</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[0.65rem] bg-blue-700/80 rounded text-blue-100 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Icon Utilities: Privacy Mask & CSV Export */}
            <div className="flex items-center gap-1 pl-1 sm:pl-2 border-l border-slate-800">
              <button
                onClick={togglePrivacyMask}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer border ${
                  isPrivacyMasked
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                title={isPrivacyMasked ? 'Privacy Mask ON (numbers hidden) — click to reveal' : 'Privacy Mask OFF — click to hide numbers'}
                aria-label="Toggle privacy masking"
              >
                {isPrivacyMasked ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
              </button>

              <button
                onClick={() => exportDataCSV('finances')}
                className="hidden sm:inline-flex p-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-slate-700 transition-colors cursor-pointer"
                title="Download CSV export"
                aria-label="Export CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile Pill in Header */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-slate-700"
                    title={user.email || undefined}
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center font-mono"
                    title={user.email || undefined}
                  >
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => signOut()}
                  className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Viewport Content */}
        <div className="flex-1 px-3 sm:px-8 lg:px-12 py-6 sm:py-8">
          <div className="max-w-6xl mx-auto">
            {(activeTab === 'overview' || activeTab === 'dashboard' || activeTab === 'finances') && (
              <FinanceOverview
                onOpenLogModal={handleOpenLogModal}
                onOpenTransferModal={handleOpenTransferModal}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'ledger' && (
              <FinanceLedger
                onOpenLogModal={handleOpenLogModal}
                onOpenTransferModal={handleOpenTransferModal}
                initialSearchQuery={ledgerSearchQuery}
                highlightedTransactionId={highlightedTransactionId}
                onClearHighlightedTransaction={() => setHighlightedTransactionId(undefined)}
              />
            )}
            {activeTab === 'wishlist' && (
              <FinanceWishlist
                onOpenLogModal={handleOpenLogModal}
                onOpenTransferModal={handleOpenTransferModal}
              />
            )}
            {activeTab === 'reimbursements' && (
              <FinanceReimbursements onOpenLogModal={() => handleOpenLogModal('expense', 'personal')} />
            )}
            {activeTab === 'settings' && <FinanceSettings />}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#090d16]/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl"
      >
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'overview' || activeTab === 'dashboard' || activeTab === 'finances'
              ? 'text-blue-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span className="text-[0.65rem] font-medium mt-0.5">Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'ledger' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span className="text-[0.65rem] font-medium mt-0.5">Ledger</span>
        </button>

        {/* Floating Quick Capture Action */}
        <button
          onClick={() => handleOpenLogModal('expense', 'personal')}
          className="flex flex-col items-center justify-center -mt-5 cursor-pointer group"
          title="Log Expense or Income"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 border-2 border-slate-900 group-active:scale-95 transition-all">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[0.62rem] font-mono font-bold text-blue-300 mt-0.5">Log</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'wishlist' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[0.65rem] font-medium mt-0.5">Wishlist</span>
        </button>

        <button
          onClick={() => setActiveTab('reimbursements')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'reimbursements' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCcw className="w-4 h-4" />
          <span className="text-[0.65rem] font-medium mt-0.5">Shared</span>
        </button>
      </nav>

      {/* Global Transaction Search Modal (⌘F) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onSelectTransaction={handleSelectTransactionFromSearch}
        onOpenLedgerWithQuery={handleOpenLedgerWithQuery}
      />

      {/* Unified Fast Entry Modal (Expense / Income / Transfer) */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        defaultType={modalDefaultType}
        defaultAccount={modalDefaultAccount || transferDefaults.from}
        defaultToAccount={transferDefaults.to}
      />

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
};

const RootApp: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center font-heading mb-3 shadow-md shadow-blue-600/30">
          P
        </div>
        <div className="flex items-center gap-2 text-blue-400/80 text-xs font-mono">
          <div className="w-3.5 h-3.5 border-2 border-blue-900 border-t-blue-400 rounded-full animate-spin" />
          <span>Pocketline</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <LifeOSProvider key={user?.uid || 'guest'}>
      <MainApp />
    </LifeOSProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  );
}
