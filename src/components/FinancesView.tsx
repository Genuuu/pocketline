import React, { useState, useMemo } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { TransactionType, AccountType } from '../types';
import { getTodayDateString } from '../utils/quickCaptureParser';
import { Plus, ArrowUpRight, ArrowDownRight, Trash2, Wallet, DollarSign, PiggyBank, RefreshCcw } from 'lucide-react';

export const FinancesView: React.FC = () => {
  const {
    transactions,
    projects,
    settings,
    addTransaction,
    deleteTransaction,
    toggleReimbursementStatus,
    safeToSpend,
    pendingReimbursements,
    updateSettings,
  } = useLifeOS();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('Groceries');
  const [account, setAccount] = useState<AccountType>('card');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [projectId, setProjectId] = useState('');
  const [isReimbursable, setIsReimbursable] = useState(false);

  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'reimbursable'>('all');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [incomeInput, setIncomeInput] = useState(settings.monthlyExpectedIncome.toString());
  const [billsInput, setBillsInput] = useState(settings.monthlyFixedBills.toString());
  const [savingsInput, setSavingsInput] = useState(settings.monthlyTargetSavings.toString());

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return;

    addTransaction({
      amount: num,
      type,
      category: category.trim() || 'General',
      account,
      note: note.trim() || (type === 'income' ? 'Income' : 'Expense'),
      date,
      projectId: projectId || undefined,
      isReimbursable,
      reimbursementStatus: isReimbursable ? 'pending' : undefined,
    });

    setAmount('');
    setNote('');
    setIsReimbursable(false);
    setIsAddOpen(false);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      monthlyExpectedIncome: parseFloat(incomeInput) || 0,
      monthlyFixedBills: parseFloat(billsInput) || 0,
      monthlyTargetSavings: parseFloat(savingsInput) || 0,
    });
    setIsEditingBudget(false);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType === 'expense' && t.type !== 'expense') return false;
      if (filterType === 'income' && t.type !== 'income') return false;
      if (filterType === 'reimbursable' && !t.isReimbursable) return false;
      return true;
    });
  }, [transactions, filterType]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="label-mono block mb-1 text-slate-400">
            Cash Flow & Ledger
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Finances & Budget
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsEditingBudget(!isEditingBudget)}
            className="bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-colors"
          >
            Budget Rules
          </button>

          <button
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label-mono">Safe To Spend Today</span>
              <span className="p-1 rounded-md bg-blue-500/10 text-blue-400">
                <Wallet className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="font-mono text-3xl font-bold text-blue-400 tracking-tight leading-none mb-1">
              <span>{settings.currency}</span>
              {Math.max(0, safeToSpend.safeToSpendToday).toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {safeToSpend.daysRemainingInMonth} days left in billing cycle
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${Math.min(100, safeToSpend.burnRatePercentage)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono mt-2 text-slate-400">
              <span>Month Burn</span>
              <span className="text-blue-400 font-bold">{safeToSpend.burnRatePercentage}%</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label-mono">Discretionary Spent</span>
              <span className="p-1 rounded-md bg-rose-500/10 text-rose-400">
                <DollarSign className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="font-mono text-3xl font-bold text-slate-100 tracking-tight leading-none mb-1">
              <span>{settings.currency}</span>
              {safeToSpend.spentSoFarThisMonth.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Variable expenses this month
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400 mt-4 pt-3 border-t border-slate-800/60">
            Remaining pool: {settings.currency}{safeToSpend.safeToSpendMonth.toFixed(2)}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label-mono">Pending Reimbursements</span>
              <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                <RefreshCcw className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="font-mono text-3xl font-bold text-emerald-400 tracking-tight leading-none mb-1">
              <span>{settings.currency}</span>
              {pendingReimbursements.totalPending.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {pendingReimbursements.count} shared item{pendingReimbursements.count === 1 ? '' : 's'} to collect
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400 mt-4 pt-3 border-t border-slate-800/60">
            Shared out-of-pocket costs
          </div>
        </div>
      </div>

      {/* Budget Rules Editor */}
      {isEditingBudget && (
        <form
          onSubmit={handleSaveBudget}
          className="bg-slate-900/95 border border-slate-800 p-5 rounded-2xl space-y-4 animate-in fade-in shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="label-mono m-0 text-slate-300">Configure Budget Baselines</span>
            <button
              type="button"
              onClick={() => setIsEditingBudget(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="label-mono block mb-1">Monthly Expected Income ({settings.currency})</label>
              <input
                type="number"
                step="any"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none"
              />
            </div>
            <div>
              <label className="label-mono block mb-1">Monthly Fixed Bills ({settings.currency})</label>
              <input
                type="number"
                step="any"
                value={billsInput}
                onChange={(e) => setBillsInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none"
              />
            </div>
            <div>
              <label className="label-mono block mb-1">Target Savings Goal ({settings.currency})</label>
              <input
                type="number"
                step="any"
                value={savingsInput}
                onChange={(e) => setSavingsInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-md shadow-blue-600/20"
            >
              Update Rules
            </button>
          </div>
        </form>
      )}

      {/* Log Transaction Drawer */}
      {isAddOpen && (
        <form
          onSubmit={handleCreate}
          className="bg-slate-900/95 border border-slate-800 p-5 rounded-2xl space-y-4 animate-in fade-in shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="label-mono m-0 text-slate-300">Log Cash Flow Entry</span>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="label-mono block mb-1">Amount ({settings.currency})</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 text-base font-bold text-white font-mono outline-none rounded-lg"
              />
            </div>

            <div>
              <label className="label-mono block mb-1">Type</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    type === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    type === 'income' ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400'
                  }`}
                >
                  Income
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="label-mono block mb-1">Description</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Component order"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="label-mono block mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Hardware, Food"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="label-mono block mb-1">Payment Method</label>
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
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isReimbursable}
                onChange={(e) => setIsReimbursable(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span>Pending reimbursement (owed back)</span>
            </label>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-md shadow-blue-600/20"
            >
              Save Entry
            </button>
          </div>
        </form>
      )}

      {/* Segmented Filter */}
      <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800/80 text-xs w-fit">
        {(
          [
            { id: 'all', label: 'All Records' },
            { id: 'expense', label: 'Expenses' },
            { id: 'income', label: 'Income' },
            { id: 'reimbursable', label: `Owed (${pendingReimbursements.count})` },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              filterType === f.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-1 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-2">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No transactions found.
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isExpense = tx.type === 'expense';
            const linkedProject = projects.find((p) => p.id === tx.projectId);

            return (
              <div
                key={tx.id}
                className="py-3 px-4 rounded-xl border border-transparent hover:bg-slate-800/40 hover:border-slate-800 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isExpense ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {isExpense ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                  </div>

                  <div className="min-w-0">
                    <span className="font-medium text-sm text-slate-100 block truncate">
                      {tx.note}
                    </span>

                    <div className="flex items-center gap-2 text-[0.7rem] font-mono text-slate-400 mt-0.5">
                      <span>{tx.category}</span>
                      <span>·</span>
                      <span className="capitalize">{tx.account}</span>
                      <span>·</span>
                      <span>{tx.date}</span>
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

                <div className="flex items-center gap-3 shrink-0">
                  {tx.isReimbursable && (
                    <button
                      onClick={() => toggleReimbursementStatus(tx.id)}
                      className={`text-[0.65rem] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        tx.reimbursementStatus === 'pending'
                          ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                          : 'border-slate-800 text-slate-500'
                      }`}
                    >
                      {tx.reimbursementStatus === 'pending' ? 'COLLECT' : 'SETTLED'}
                    </button>
                  )}

                  <span
                    className={`font-mono text-sm font-bold tabular-nums ${
                      isExpense ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {isExpense ? '-' : '+'}
                    {settings.currency}
                    {tx.amount.toFixed(2)}
                  </span>

                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    className="p-1.5 text-slate-600 hover:text-rose-400 rounded-md hover:bg-rose-500/10 transition-colors cursor-pointer"
                    aria-label="Delete transaction"
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
