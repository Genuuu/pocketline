import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { TransactionType, AccountType } from '../types';
import { normalizeAccount, searchTransactions } from '../utils/financeCalculators';
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  X,
  CreditCard,
  Building2,
  ArrowRightLeft,
  User,
  PiggyBank,
} from 'lucide-react';

interface FinanceLedgerProps {
  onOpenLogModal: (defaultType?: 'expense' | 'income', defaultAccount?: string) => void;
  onOpenTransferModal: (from?: string, to?: string) => void;
  initialSearchQuery?: string;
  highlightedTransactionId?: string;
  onClearHighlightedTransaction?: () => void;
}

export const FinanceLedger: React.FC<FinanceLedgerProps> = ({
  onOpenLogModal,
  onOpenTransferModal,
  initialSearchQuery = '',
  highlightedTransactionId,
  onClearHighlightedTransaction,
}) => {
  const {
    transactions,
    settings,
    accounts,
    deleteTransaction,
    toggleReimbursementStatus,
    formatAmount,
  } = useLifeOS();

  // Search and filters
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer' | 'reimbursable'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'this-month' | 'last-month' | 'all'>('this-month');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync external search query from global search
  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
      if (initialSearchQuery.trim()) {
        setTimeFilter('all'); // Automatically show all time for search queries
      }
    }
  }, [initialSearchQuery]);

  // Scroll to and highlight selected transaction
  useEffect(() => {
    if (highlightedTransactionId) {
      const el = document.getElementById(`tx-row-${highlightedTransactionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const timer = setTimeout(() => {
        onClearHighlightedTransaction?.();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [highlightedTransactionId, onClearHighlightedTransaction]);

  // Date filtering logic
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const filteredTransactions = useMemo(() => {
    // If search query is present, use multi-field searchTransactions (merchant, date, amount)
    let baseList = transactions;
    if (searchQuery.trim()) {
      baseList = searchTransactions(transactions, searchQuery);
    }

    return baseList.filter((t) => {
      // Type filter
      if (typeFilter === 'expense' && t.type !== 'expense') return false;
      if (typeFilter === 'income' && t.type !== 'income') return false;
      if (typeFilter === 'transfer' && t.type !== 'transfer') return false;
      if (typeFilter === 'reimbursable' && !t.isReimbursable) return false;

      // Account filter (Normalizes 'bank' to 'main', 'card'/'cash' to 'personal')
      if (accountFilter !== 'all') {
        const norm = normalizeAccount(t.account);
        const normDest = t.toAccount ? normalizeAccount(t.toAccount) : null;
        if (norm !== accountFilter && normDest !== accountFilter) {
          return false;
        }
      }

      // Timeframe filter - when searching, only filter time if user hasn't chosen 'all'
      if (timeFilter !== 'all') {
        const [y, m] = t.date ? t.date.split('-').map(Number) : [0, 0];
        if (timeFilter === 'this-month') {
          if (y !== currentYear || m !== currentMonth + 1) return false;
        } else if (timeFilter === 'last-month') {
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          const lastMonthNum = currentMonth === 0 ? 12 : currentMonth;
          if (y !== lastMonthYear || m !== lastMonthNum) return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    transactions,
    typeFilter,
    accountFilter,
    timeFilter,
    searchQuery,
    currentYear,
    currentMonth,
  ]);

  // Aggregated totals for currently filtered items
  const { filteredExpenseTotal, filteredIncomeTotal } = useMemo(() => {
    let exp = 0;
    let inc = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'expense') exp += Number(t.amount) || 0;
      if (t.type === 'income') inc += Number(t.amount) || 0;
    });
    return {
      filteredExpenseTotal: exp,
      filteredIncomeTotal: inc,
    };
  }, [filteredTransactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-16">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800/60">
        <div className="text-xs font-mono text-blue-400 mb-1">
          Transactions & Audit Trail
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
          Transactions Ledger
        </h1>
      </div>

      {/* Account Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-800/90 p-2 rounded-2xl">
        <span className="text-[0.68rem] font-mono uppercase tracking-wider text-slate-500 px-2 font-semibold">
          Filter Account:
        </span>
        <button
          onClick={() => setAccountFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            accountFilter === 'all'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          All Accounts
        </button>

        {accounts.map((acc) => {
          const isSelected = accountFilter === acc.id;
          const label =
            acc.id === 'main'
              ? `🏦 ${acc.name}`
              : acc.id === 'savings'
              ? `🐖 ${acc.name}`
              : `💳 ${acc.name}`;

          return (
            <button
              key={acc.id}
              onClick={() => setAccountFilter(acc.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by merchant name, date (e.g. 2026-11, Nov 5), or amount..."
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500/80 pl-9 pr-18 py-2 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-500 hover:text-slate-300 p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd
                onClick={() => searchInputRef.current?.focus()}
                className="hidden sm:inline-block px-1.5 py-0.5 text-[0.62rem] font-mono bg-slate-800 border border-slate-700/80 text-slate-400 rounded cursor-pointer hover:border-slate-600"
                title="Focus search input (⌘F)"
              >
                ⌘F
              </kbd>
            </div>
          </div>

          {/* Quick Type Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs self-start lg:self-auto flex-wrap">
            {(
              [
                { id: 'all', label: 'All Types' },
                { id: 'expense', label: 'Expenses' },
                { id: 'income', label: 'Income' },
                { id: 'transfer', label: 'Transfers' },
                { id: 'reimbursable', label: 'Owed' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  typeFilter === f.id
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters Row: Timeframe */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as 'this-month' | 'last-month' | 'all')}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none"
            >
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {(searchQuery || accountFilter !== 'all' || typeFilter !== 'all' || timeFilter !== 'this-month') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setAccountFilter('all');
                setTimeFilter('this-month');
              }}
              className="text-xs font-mono text-blue-400 hover:text-blue-300 ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Filtered Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 border border-slate-800/70 px-4 py-3 rounded-xl text-xs font-mono text-slate-400">
        <div>
          Showing <span className="font-medium text-white">{filteredTransactions.length}</span> transaction{filteredTransactions.length === 1 ? '' : 's'}
          {accountFilter !== 'all' && (
            <span className="text-slate-300 ml-1.5">
              (Filtered to {accounts.find((a) => a.id === accountFilter)?.name || accountFilter})
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div>
            Total Outflows:{' '}
            <span className="text-rose-400 font-medium tabular-nums">
              -{formatAmount(filteredExpenseTotal)}
            </span>
          </div>
          <div>
            Total Inflows:{' '}
            <span className="text-emerald-400 font-medium tabular-nums">
              +{formatAmount(filteredIncomeTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Ledger Table / List */}
      <div className="bg-slate-900/40 border border-slate-800/70 rounded-xl overflow-hidden shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs font-mono">
            No matching transactions found with current filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {filteredTransactions.map((tx) => {
              const isExpense = tx.type === 'expense';
              const isTransfer = tx.type === 'transfer';
              const normAcc = normalizeAccount(tx.account);
              const isHighlighted = highlightedTransactionId === tx.id;

              return (
                <div
                  key={tx.id}
                  id={`tx-row-${tx.id}`}
                  className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all duration-300 group ${
                    isHighlighted
                      ? 'bg-blue-600/20 border-l-4 border-l-blue-500 shadow-md ring-1 ring-blue-500/40'
                      : 'hover:bg-slate-800/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 text-slate-400">
                      {isTransfer ? (
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      ) : isExpense ? (
                        <ArrowDownRight className="w-3.5 h-3.5 text-rose-400/80" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400/80" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-normal text-xs sm:text-sm text-slate-200 truncate">
                          {tx.note}
                        </span>

                        <span className="text-[0.68rem] font-mono text-blue-300/80 capitalize font-medium">
                          {normAcc}
                        </span>

                        {isTransfer && tx.toAccount && (
                          <span className="text-[0.68rem] font-mono text-slate-400 flex items-center gap-1">
                            <span>→</span>
                            <span className="text-blue-300/80 capitalize font-medium">
                              {normalizeAccount(tx.toAccount)}
                            </span>
                          </span>
                        )}

                        {tx.isReimbursable && (
                          <span className="text-[0.62rem] font-mono text-slate-400 border border-slate-700/60 px-1 py-0.2 rounded">
                            Reimbursable
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[0.68rem] font-mono text-slate-500 mt-0.5">
                        <span>{tx.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {tx.isReimbursable && (
                      <button
                        onClick={() => toggleReimbursementStatus(tx.id)}
                        className={`text-[0.65rem] font-mono px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          tx.reimbursementStatus === 'pending'
                            ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                            : 'text-slate-500 hover:text-slate-400'
                        }`}
                        title="Click to toggle settlement"
                      >
                        {tx.reimbursementStatus === 'pending' ? 'Owed' : 'Settled'}
                      </button>
                    )}

                    <span
                      className={`font-mono text-xs sm:text-sm font-medium tabular-nums ${
                        isTransfer
                          ? 'text-slate-300'
                          : isExpense
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {isTransfer ? '⇄ ' : isExpense ? '-' : '+'}
                      {formatAmount(tx.amount)}
                    </span>

                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity cursor-pointer"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
