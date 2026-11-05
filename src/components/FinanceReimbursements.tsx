import React, { useState, useMemo } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { getTodayDateString } from '../utils/quickCaptureParser';
import { AccountType } from '../types';
import {
  RefreshCcw,
  Plus,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  Trash2,
  DollarSign,
  UserCheck,
} from 'lucide-react';

interface FinanceReimbursementsProps {
  onOpenLogModal: () => void;
}

export const FinanceReimbursements: React.FC<FinanceReimbursementsProps> = ({ onOpenLogModal }) => {
  const {
    transactions,
    settings,
    addTransaction,
    deleteTransaction,
    toggleReimbursementStatus,
    formatAmount,
  } = useLifeOS();

  const [filter, setFilter] = useState<'all' | 'pending' | 'settled'>('pending');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state for logging a shared out-of-pocket expense
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Shared Expenses');
  const [account, setAccount] = useState<AccountType>('card');
  const [date, setDate] = useState(getTodayDateString());

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return;

    addTransaction({
      amount: num,
      type: 'expense',
      category: category.trim() || 'Shared Expenses',
      account,
      note: note.trim() || 'Shared Expense',
      date,
      isReimbursable: true,
      reimbursementStatus: 'pending',
    });

    setAmount('');
    setNote('');
    setIsAddOpen(false);
  };

  const reimbursableTransactions = useMemo(() => {
    return transactions.filter((t) => t.isReimbursable);
  }, [transactions]);

  const { totalPending, countPending, totalSettled, countSettled } = useMemo(() => {
    let pendingSum = 0;
    let pendingCount = 0;
    let settledSum = 0;
    let settledCount = 0;

    reimbursableTransactions.forEach((t) => {
      if (t.reimbursementStatus === 'pending') {
        pendingSum += Number(t.amount) || 0;
        pendingCount++;
      } else {
        settledSum += Number(t.amount) || 0;
        settledCount++;
      }
    });

    return {
      totalPending: pendingSum,
      countPending: pendingCount,
      totalSettled: settledSum,
      countSettled: settledCount,
    };
  }, [reimbursableTransactions]);

  const displayedTransactions = useMemo(() => {
    return reimbursableTransactions.filter((t) => {
      if (filter === 'pending') return t.reimbursementStatus === 'pending';
      if (filter === 'settled') return t.reimbursementStatus === 'settled';
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reimbursableTransactions, filter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="text-xs font-mono text-blue-400 mb-1">
            Out-of-Pocket & Shared Expenses
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
            Shared & Reimbursements
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/25 active:scale-98 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Track Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
        <div className="bg-slate-900/40 border border-slate-800/70 p-4 sm:p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
            <span className="uppercase tracking-wider text-[0.68rem]">Owed to You</span>
            <Clock className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-emerald-400 tracking-tight tabular-nums">
            {formatAmount(totalPending)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {countPending} pending item{countPending === 1 ? '' : 's'} waiting to be collected
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/70 p-4 sm:p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
            <span className="uppercase tracking-wider text-[0.68rem]">Settled</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-slate-200 tracking-tight tabular-nums">
            {formatAmount(totalSettled)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {countSettled} item{countSettled === 1 ? '' : 's'} settled
          </p>
        </div>
      </div>

      {/* Add Drawer */}
      {isAddOpen && (
        <form
          onSubmit={handleCreate}
          className="bg-slate-900 border border-blue-500/30 p-5 rounded-2xl space-y-4 shadow-xl animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="label-mono m-0 text-slate-200">Track Shared Out-of-Pocket Expense</span>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-mono block mb-1 text-slate-300">Amount ({settings.currency})</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 text-lg font-bold text-white font-mono outline-none rounded-lg"
              />
            </div>

            <div>
              <label className="label-mono block mb-1 text-slate-300">Description & Who Owes</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Dinner bill (Alex owes $35)"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 text-sm text-slate-200 outline-none rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="label-mono block mb-1 text-slate-300">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="label-mono block mb-1 text-slate-300">Account Paid From</label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value as AccountType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none"
              >
                <option value="card">Card</option>
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="label-mono block mb-1 text-slate-300">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-md shadow-blue-600/25"
            >
              Save Shared Item
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 text-xs w-fit">
        {(
          [
            { id: 'pending', label: `Pending Owed (${countPending})` },
            { id: 'settled', label: `Settled (${countSettled})` },
            { id: 'all', label: `All (${reimbursableTransactions.length})` },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === f.id
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="bg-slate-900/40 border border-slate-800/70 rounded-xl overflow-hidden shadow-sm">
        {displayedTransactions.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs font-mono">
            {filter === 'pending'
              ? 'No pending reimbursements. All shared expenses are settled.'
              : 'No reimbursable transactions found.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {displayedTransactions.map((tx) => {
              const isPending = tx.reimbursementStatus === 'pending';

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-800/20 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 text-slate-400">
                      {isPending ? (
                        <Clock className="w-3.5 h-3.5 text-amber-400/80" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/80" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className="font-normal text-xs sm:text-sm text-slate-200 block truncate">
                        {tx.note}
                      </span>
                      <div className="flex items-center gap-1.5 text-[0.68rem] font-mono text-slate-400 mt-0.5">
                        <span className="text-slate-300">{tx.category}</span>
                        <span>·</span>
                        <span className="capitalize">{tx.account}</span>
                        <span>·</span>
                        <span>{tx.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => toggleReimbursementStatus(tx.id)}
                      className={`text-[0.65rem] font-mono px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        isPending
                          ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                          : 'text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      {isPending ? 'Mark Settled' : 'Mark Pending'}
                    </button>

                    <span
                      className={`font-mono text-xs sm:text-sm font-medium tabular-nums ${
                        isPending ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      {formatAmount(tx.amount)}
                    </span>

                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity cursor-pointer"
                      title="Delete record"
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
