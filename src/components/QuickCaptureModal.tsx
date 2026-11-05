import React, { useState, useEffect, useRef } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { TransactionType } from '../types';
import { getTodayDateString } from '../utils/quickCaptureParser';
import {
  X,
  Check,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  DollarSign,
  Building2,
  User,
  PiggyBank,
  Leaf,
  Briefcase,
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  building: Building2,
  user: User,
  leaf: Leaf,
  piggy: PiggyBank,
  briefcase: Briefcase,
};

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'expense' | 'income' | 'transfer';
  defaultAccount?: string;
  defaultToAccount?: string;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense',
  defaultAccount,
  defaultToAccount = 'personal',
}) => {
  const { addTransaction, transferFunds, settings, accountBalances, accounts } = useLifeOS();
  const inputRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [note, setNote] = useState('');
  const [account, setAccount] = useState<string>(
    defaultAccount || (defaultType === 'income' ? 'main' : 'personal')
  );
  const [toAccount, setToAccount] = useState<string>(defaultToAccount);
  const [date, setDate] = useState(getTodayDateString());
  const [isReimbursable, setIsReimbursable] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      const initialAcc = defaultAccount || (defaultType === 'income' ? 'main' : 'personal');
      setAccount(initialAcc);
      setToAccount(defaultToAccount === initialAcc ? (initialAcc === 'main' ? 'personal' : 'main') : defaultToAccount);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setAmount('');
      setNote('');
      setIsReimbursable(false);
    }
  }, [isOpen, defaultType, defaultAccount, defaultToAccount]);

  const handleSwapAccounts = () => {
    const prevFrom = account;
    setAccount(toAccount);
    setToAccount(prevFrom);
  };

  const [isSuccessState, setIsSuccessState] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return;

    setIsSuccessState(true);

    if (type === 'transfer') {
      transferFunds({
        fromAccount: account,
        toAccount,
        amount: num,
        note: note.trim() || 'Account Transfer',
        date,
      });
    } else {
      addTransaction({
        amount: num,
        type,
        category: 'General',
        account: account as any,
        note: note.trim() || (type === 'income' ? 'Income' : 'Expense'),
        date,
        isReimbursable,
        reimbursementStatus: isReimbursable ? 'pending' : undefined,
      });
    }

    setTimeout(() => {
      setIsSuccessState(false);
      onClose();
    }, 350);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 md:p-6 flex min-h-full items-center justify-center animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl my-auto flex flex-col max-h-[92dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-800/80 px-5 sm:px-6 py-4 bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="font-heading text-base font-bold text-white">
              {type === 'transfer' ? 'Move Money' : 'Log Cash Flow Entry'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
            {/* 3-Way Mode Toggle: Expense, Income, Transfer */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Expense</span>
              </button>

              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Income</span>
              </button>

              <button
                type="button"
                onClick={() => setType('transfer')}
                className={`py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'transfer'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transfer</span>
              </button>
            </div>

            {/* Account Selector Section */}
            {type === 'transfer' ? (
              <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Transfer Route</span>
                  <button
                    type="button"
                    onClick={handleSwapAccounts}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[0.68rem] cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Swap Direction</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[0.68rem] font-mono text-slate-400 uppercase block mb-1">
                      From Account (Source)
                    </label>
                    <select
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-medium outline-none focus:border-blue-500"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id} disabled={acc.id === toAccount}>
                          {acc.name} ({settings.currency}{(accountBalances.allAccounts[acc.id]?.balance ?? 0).toFixed(0)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[0.68rem] font-mono text-slate-400 uppercase block mb-1">
                      To Account (Destination)
                    </label>
                    <select
                      value={toAccount}
                      onChange={(e) => setToAccount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-medium outline-none focus:border-blue-500"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id} disabled={acc.id === account}>
                          {acc.name} ({settings.currency}{(accountBalances.allAccounts[acc.id]?.balance ?? 0).toFixed(0)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="label-mono block mb-1 text-slate-300">Account</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  {accounts.map((acc) => {
                    const IconComp = ICON_MAP[acc.icon] || Building2;
                    const isSelected = account === acc.id;
                    const bal = accountBalances.allAccounts[acc.id]?.balance ?? acc.startingBalance;

                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setAccount(acc.id)}
                        className={`py-2 px-1 rounded-lg text-xs font-medium flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? acc.type === 'main'
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : acc.type === 'savings'
                              ? 'bg-amber-600 text-white font-bold shadow-sm'
                              : 'bg-indigo-600 text-white font-bold shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <span className="flex items-center gap-1 text-[0.72rem] truncate">
                          <IconComp className="w-3 h-3 shrink-0" />
                          <span className="truncate">{acc.name.replace(' Account', '').replace(' Vault', '')}</span>
                        </span>
                        <span className="text-[0.62rem] font-mono opacity-80 mt-0.5">
                          {settings.currency}{bal.toFixed(0)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Amount input */}
            <div>
              <label className="label-mono block mb-1 text-slate-300">Amount ({settings.currency})</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xl font-bold text-slate-400">
                  {settings.currency}
                </span>
                <input
                  ref={inputRef}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 pl-9 pr-4 py-3 rounded-xl text-2xl font-mono font-bold text-white outline-none"
                />
              </div>
            </div>

            {/* Note / Description */}
            <div>
              <label className="label-mono block mb-1 text-slate-300">Description / Note</label>
              <input
                type="text"
                placeholder={
                  type === 'transfer'
                    ? 'e.g. Allowance refill, Emergency stash'
                    : type === 'income'
                    ? 'e.g. Salary, Client payment'
                    : 'e.g. Grocery restock, Dinner'
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 rounded-xl text-xs text-slate-100 outline-none"
              />
            </div>

            {/* Date & Shared Expense Row */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <label className="label-mono block mb-1 text-slate-300">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              {type === 'expense' && (
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={isReimbursable}
                      onChange={(e) => setIsReimbursable(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Shared / Owed back</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 flex items-center justify-between border-t border-slate-800/80 px-5 sm:px-6 py-3.5 bg-slate-900/95">
            <span className="text-[0.68rem] text-slate-400 font-mono hidden sm:inline">Press ↵ Enter to save</span>
            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSuccessState}
                className={`px-5 py-2 rounded-lg text-xs font-semibold font-mono tracking-wide cursor-pointer flex-1 sm:flex-initial flex items-center justify-center gap-1.5 transition-all duration-150 ${
                  isSuccessState
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25'
                }`}
              >
                {isSuccessState ? (
                  <>
                    <Check className="w-3.5 h-3.5 animate-in zoom-in-50 duration-150" />
                    <span>Entry Saved!</span>
                  </>
                ) : type === 'transfer' ? (
                  'Transfer Funds'
                ) : (
                  'Save Entry'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
