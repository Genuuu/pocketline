import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { Transaction } from '../types';
import { searchTransactions, normalizeAccount } from '../utils/financeCalculators';
import {
  Search,
  X,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Calendar,
  Building2,
  CreditCard,
  PiggyBank,
  ArrowRight,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenLedgerWithQuery: (query: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTransaction,
  onOpenLedgerWithQuery,
}) => {
  const { transactions, formatAmount } = useLifeOS();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search results sorted by date descending
  const matchingTransactions = useMemo(() => {
    if (!query.trim()) {
      // Show top 8 most recent transactions when search query is empty
      return [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);
    }
    return searchTransactions(transactions, query).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected element into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation within modal
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < matchingTransactions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : Math.max(0, matchingTransactions.length - 1)
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matchingTransactions.length > 0 && matchingTransactions[selectedIndex]) {
        onSelectTransaction(matchingTransactions[selectedIndex]);
      } else {
        onOpenLedgerWithQuery(query);
      }
      onClose();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-search-title"
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0d1322] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/60">
          <Search className="w-5 h-5 text-blue-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            id="global-search-title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search transactions by merchant, date (e.g. 2026-11, Nov 5), or amount..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 outline-none font-sans"
            autoComplete="off"
            spellCheck="false"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <kbd className="px-1.5 py-0.5 text-[0.65rem] bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono">
                ⌘F
              </kbd>
              <kbd className="px-1.5 py-0.5 text-[0.65rem] bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono">
                ESC
              </kbd>
            </div>
          )}
        </div>

        {/* Suggestion Chips / Quick Filters */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs text-slate-400">
          <span className="text-[0.68rem] font-mono text-slate-500 uppercase tracking-wider shrink-0 font-semibold">
            Quick suggestions:
          </span>
          <button
            onClick={() => setQuery('Nov')}
            className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-blue-600/20 hover:text-blue-300 border border-slate-800 transition-colors shrink-0 font-mono text-[0.7rem] cursor-pointer"
          >
            November
          </button>
          <button
            onClick={() => setQuery('Salary')}
            className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-blue-600/20 hover:text-blue-300 border border-slate-800 transition-colors shrink-0 font-mono text-[0.7rem] cursor-pointer"
          >
            Salary
          </button>
          <button
            onClick={() => setQuery('Groceries')}
            className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-blue-600/20 hover:text-blue-300 border border-slate-800 transition-colors shrink-0 font-mono text-[0.7rem] cursor-pointer"
          >
            Groceries
          </button>
          <button
            onClick={() => setQuery('50')}
            className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-blue-600/20 hover:text-blue-300 border border-slate-800 transition-colors shrink-0 font-mono text-[0.7rem] cursor-pointer"
          >
            $50
          </button>
          <button
            onClick={() => setQuery('Rent')}
            className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-blue-600/20 hover:text-blue-300 border border-slate-800 transition-colors shrink-0 font-mono text-[0.7rem] cursor-pointer"
          >
            Rent
          </button>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1"
        >
          {matchingTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-60" />
              <p className="text-sm font-medium text-slate-300">
                No transactions found matching &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching for another merchant, a date format like &ldquo;2026-11&rdquo; or &ldquo;Nov 5&rdquo;, or an amount like &ldquo;45&rdquo;.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => setQuery('')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="px-3 py-1.5 flex items-center justify-between text-[0.7rem] font-mono text-slate-400">
                <span>
                  {query ? (
                    <>
                      Found <strong className="text-blue-400">{matchingTransactions.length}</strong> matching transaction{matchingTransactions.length === 1 ? '' : 's'}
                    </>
                  ) : (
                    'Recent transactions'
                  )}
                </span>
                {query && (
                  <button
                    onClick={() => {
                      onOpenLedgerWithQuery(query);
                      onClose();
                    }}
                    className="text-blue-400 hover:text-blue-300 underline font-sans flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all in Ledger</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {matchingTransactions.map((tx, idx) => {
                const isSelected = idx === selectedIndex;
                const normAcc = normalizeAccount(tx.account);
                const isExpense = tx.type === 'expense';
                const isIncome = tx.type === 'income';
                const isTransfer = tx.type === 'transfer';

                return (
                  <div
                    key={tx.id}
                    data-selected={isSelected}
                    onClick={() => {
                      onSelectTransaction(tx);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-3 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                        : 'hover:bg-slate-900/60 text-slate-300 border border-transparent'
                    }`}
                  >
                    {/* Left: Type Icon + Note + Meta */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isTransfer
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : isTransfer ? (
                          <ArrowRightLeft className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate flex items-center gap-2">
                          <span>{tx.note || (isTransfer ? 'Account Transfer' : 'Transaction')}</span>
                          {tx.isReimbursable && (
                            <span className="text-[0.62rem] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                              Owed
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[0.72rem] text-slate-400 mt-0.5">
                          {/* Date */}
                          <span className="flex items-center gap-1 font-mono text-slate-400">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {tx.date}
                          </span>
                          <span>·</span>
                          {/* Account badge */}
                          <span className="inline-flex items-center gap-1 font-mono text-slate-300">
                            {normAcc === 'main' ? (
                              <Building2 className="w-3 h-3 text-blue-400" />
                            ) : normAcc === 'savings' ? (
                              <PiggyBank className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <CreditCard className="w-3 h-3 text-indigo-400" />
                            )}
                            {tx.account}
                            {isTransfer && tx.toAccount && ` → ${tx.toAccount}`}
                          </span>
                          {tx.category && (
                            <>
                              <span>·</span>
                              <span className="text-slate-400 truncate">{tx.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Jump Indicator */}
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <div
                          className={`font-mono text-sm font-bold ${
                            isIncome
                              ? 'text-emerald-400'
                              : isTransfer
                              ? 'text-blue-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}
                          {formatAmount(tx.amount)}
                        </div>
                      </div>

                      <div className="hidden sm:block text-slate-500 group-hover:text-blue-400">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Modal Footer with Shortcuts */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[0.72rem] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono text-[0.65rem]">
                ↑↓
              </kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono text-[0.65rem]">
                ↵
              </kbd>
              <span>open in ledger</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono text-[0.65rem]">
                esc
              </kbd>
              <span>close</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-slate-500 font-mono text-[0.68rem]">
            <span>FinanceLedger Quick Search</span>
          </div>
        </div>
      </div>
    </div>
  );
};
