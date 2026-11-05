import React, { useState, useEffect } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import {
  X,
  ArrowRightLeft,
  Building2,
  User,
  PiggyBank,
  Leaf,
  Briefcase,
  Wallet,
  Landmark,
  Truck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { getTodayDateString } from '../utils/quickCaptureParser';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  building: Building2,
  user: User,
  leaf: Leaf,
  piggy: PiggyBank,
  briefcase: Briefcase,
  wallet: Wallet,
  landmark: Landmark,
  truck: Truck,
};

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFrom?: string;
  defaultTo?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  defaultFrom = 'main',
  defaultTo = 'personal',
}) => {
  const { transferFunds, accountBalances, settings, accounts } = useLifeOS();

  // Filter accounts that allow transfers
  const transferrableAccounts = accounts.filter((a) => a.isTransferrable !== false);

  const [fromAccount, setFromAccount] = useState<string>(defaultFrom);
  const [toAccount, setToAccount] = useState<string>(defaultTo);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayDateString());

  useEffect(() => {
    if (isOpen) {
      // Validate default accounts exist
      const validFrom = accounts.some((a) => a.id === defaultFrom)
        ? defaultFrom
        : accounts[0]?.id || 'main';
      const validTo = accounts.some((a) => a.id !== validFrom)
        ? (accounts.find((a) => a.id === defaultTo && a.id !== validFrom)?.id || accounts.find((a) => a.id !== validFrom)?.id || 'personal')
        : 'personal';

      setFromAccount(validFrom);
      setToAccount(validTo);
      setAmount('');
      setNote('');
      setDate(getTodayDateString());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;

  const handleSwap = () => {
    setFromAccount(toAccount);
    setToAccount(fromAccount);
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const applyTemplate = (from: string, to: string, defaultAmt: number, defaultNote: string) => {
    setFromAccount(from);
    setToAccount(to);
    setAmount(defaultAmt.toString());
    setNote(defaultNote);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) return;
    if (fromAccount === toAccount) return;

    transferFunds({
      fromAccount,
      toAccount,
      amount: numAmount,
      note: note.trim() || undefined,
      date,
    });

    onClose();
  };

  const getAccountData = (id: string) => {
    const found = accounts.find((a) => a.id === id);
    const balObj = accountBalances.allAccounts[id];
    return {
      name: found?.name || id,
      icon: found?.icon || 'building',
      balance: balObj ? balObj.balance : 0,
    };
  };

  const fromData = getAccountData(fromAccount);
  const toData = getAccountData(toAccount);

  const FromIcon = ICON_MAP[fromData.icon] || Building2;
  const ToIcon = ICON_MAP[toData.icon] || Building2;

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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-white">Transfer / Move Money</h2>
              <p className="text-[0.7rem] text-slate-400 font-mono">
                Move money between Main, Personal, and Savings accounts
              </p>
            </div>
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

        {/* Quick Transfer Presets */}
        <div>
          <span className="text-[0.68rem] font-mono uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Quick Transfer Shortcuts</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs font-mono">
            <button
              type="button"
              onClick={() =>
                applyTemplate('main', 'personal', 500, 'Bi-weekly personal spending allowance')
              }
              className="p-2 rounded-lg bg-slate-950 border border-blue-500/30 hover:border-blue-500/60 text-blue-300 hover:text-blue-200 text-left transition-all cursor-pointer"
            >
              <div className="font-semibold flex items-center gap-1">
                <span>💳</span> Main ➔ Personal
              </div>
              <span className="text-[0.62rem] text-slate-400 block mt-0.5">Allowance ({settings.currency}500)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                applyTemplate('main', 'savings', 400, 'Monthly target savings allocation')
              }
              className="p-2 rounded-lg bg-slate-950 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 text-left transition-all cursor-pointer"
            >
              <div className="font-semibold flex items-center gap-1">
                <span>🐖</span> Main ➔ Savings
              </div>
              <span className="text-[0.62rem] text-slate-400 block mt-0.5">Reserves ({settings.currency}400)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                applyTemplate('personal', 'savings', 100, 'Transfer unspent daily allowance to savings')
              }
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white text-left transition-all cursor-pointer"
            >
              <div className="font-semibold flex items-center gap-1">
                <span>✨</span> Personal ➔ Savings
              </div>
              <span className="text-[0.62rem] text-slate-400 block mt-0.5">Leftover Stash</span>
            </button>
          </div>
        </div>


          {/* Source & Destination Selectors */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
              {/* From */}
              <div>
                <label className="text-[0.68rem] uppercase font-mono text-slate-400 block mb-1">
                  From (Source Account)
                </label>
                <div className="relative">
                  <select
                    value={fromAccount}
                    onChange={(e) => {
                      const next = e.target.value;
                      setFromAccount(next);
                      if (next === toAccount) {
                        const fallback = transferrableAccounts.find((a) => a.id !== next)?.id || 'personal';
                        setToAccount(fallback);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-100 outline-none"
                  >
                    {transferrableAccounts.map((acc) => {
                      const bal = accountBalances.allAccounts[acc.id]?.balance ?? acc.startingBalance;
                      return (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({settings.currency}{bal.toFixed(0)})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* To */}
              <div>
                <label className="text-[0.68rem] uppercase font-mono text-slate-400 block mb-1">
                  To (Destination Account)
                </label>
                <div className="relative">
                  <select
                    value={toAccount}
                    onChange={(e) => {
                      const next = e.target.value;
                      setToAccount(next);
                      if (next === fromAccount) {
                        const fallback = transferrableAccounts.find((a) => a.id !== next)?.id || 'main';
                        setFromAccount(fallback);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-100 outline-none"
                  >
                    {transferrableAccounts.map((acc) => {
                      const bal = accountBalances.allAccounts[acc.id]?.balance ?? acc.startingBalance;
                      return (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({settings.currency}{bal.toFixed(0)})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Balances & Swap Bar */}
            <div className="flex items-center justify-between text-[0.72rem] text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
              <div className="flex items-center gap-1.5">
                <FromIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {fromData.name}: <b className="text-white">{settings.currency}{fromData.balance.toFixed(2)}</b>
                </span>
              </div>

              <button
                type="button"
                onClick={handleSwap}
                className="text-blue-400 hover:text-blue-300 font-mono text-xs px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 cursor-pointer"
                title="Swap source and destination accounts"
              >
                ⇄ Swap
              </button>

              <div className="flex items-center gap-1.5">
                <ToIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {toData.name}: <b className="text-white">{settings.currency}{toData.balance.toFixed(2)}</b>
                </span>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="label-mono block mb-1 text-slate-300">Amount to Move ({settings.currency})</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xl font-bold text-slate-400">
                {settings.currency}
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 pl-9 pr-4 py-3 rounded-xl text-2xl font-mono font-bold text-white outline-none"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {[50, 100, 250, 500, 850, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 text-[0.72rem] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  +{settings.currency}{val}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label-mono block mb-1 text-slate-300">Transfer Note / Purpose</label>
            <input
              type="text"
              placeholder={
                toAccount === 'personal'
                  ? 'e.g. Monthly discretionary allowance'
                  : toAccount === 'savings'
                  ? 'e.g. Emergency fund deposit'
                  : 'e.g. Fund transfer'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 rounded-xl text-xs text-slate-100 outline-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="label-mono block mb-1 text-slate-300">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
            />
          </div>

          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 flex items-center justify-between border-t border-slate-800/80 px-5 sm:px-6 py-3.5 bg-slate-900/95">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!numAmount || numAmount <= 0}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold font-mono tracking-wide cursor-pointer shadow-md shadow-blue-600/25 flex items-center gap-1.5"
            >
              <span>Transfer {numAmount > 0 ? `${settings.currency}${numAmount.toFixed(2)}` : ''}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
