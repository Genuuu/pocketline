import React, { useMemo } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import {
  TrendingDown,
  TrendingUp,
  PiggyBank,
  RefreshCcw,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Building2,
  User,
  ArrowRightLeft,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { calculateMonthlyCashFlow, normalizeAccount } from '../utils/financeCalculators';

interface FinanceOverviewProps {
  onOpenLogModal?: (defaultType?: 'expense' | 'income', defaultAccount?: string) => void;
  onOpenTransferModal?: (from?: string, to?: string) => void;
  onNavigateToTab: (tab: 'ledger' | 'wishlist' | 'reimbursements' | 'settings') => void;
}

export const FinanceOverview: React.FC<FinanceOverviewProps> = ({
  onNavigateToTab,
}) => {
  const {
    transactions,
    settings,
    accountBalances,
    accounts,
    wishlist,
    pendingReimbursements,
    deleteTransaction,
    toggleReimbursementStatus,
    formatAmount,
  } = useLifeOS();

  const now = new Date();
  const currentMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculate monthly cash flow
  const cashFlow = useMemo(
    () => calculateMonthlyCashFlow(transactions, settings.monthlyFixedBills, now),
    [transactions, settings.monthlyFixedBills]
  );

  // Recent 8 transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [transactions]);

  // Savings target progress calculation
  const monthlySavingsTarget = settings.monthlyTargetSavings || 1000;
  const savedThisMonth = accountBalances.savings.savedThisMonth ?? 0;
  const savingsProgressPercent =
    monthlySavingsTarget > 0
      ? Math.min(100, Math.round((savedThisMonth / monthlySavingsTarget) * 100))
      : 100;

  // Custom accounts that are not default
  const customAccounts = accounts.filter(
    (a) => a.id !== 'main' && a.id !== 'personal' && a.id !== 'savings'
  );

  // Active wishlist items
  const activeWishlistItems = useMemo(
    () => wishlist.filter((i) => i.status !== 'purchased'),
    [wishlist]
  );
  const topWishlistGoal = activeWishlistItems[0];

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-150">
      {/* Overview Title Banner */}
      <div className="pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span>Pocketline Cash Flow · {currentMonthName}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
          Accounts & Cash Flow
        </h1>
      </div>

      {/* CORE 3 ACCOUNTS (Main, Personal, Savings) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Account 1: MAIN ACCOUNT */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 p-5 rounded-xl transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Building2 className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-heading font-bold text-white text-sm leading-tight">
                  Main Account
                </h2>
                <span className="text-[0.68rem] text-slate-400 font-mono">
                  Income, Bills & Overhead
                </span>
              </div>
            </div>
            <span className="text-[0.62rem] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Primary
            </span>
          </div>

          <div className="my-3">
            <span className="text-[0.68rem] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
              Available Balance
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums">
              {formatAmount(accountBalances.main.balance)}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono text-slate-400">
            <div className="flex justify-between items-center">
              <span>Inflows</span>
              <span className="text-emerald-400 font-medium tabular-nums">
                +{formatAmount(accountBalances.main.inflow)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Bills & Outflows</span>
              <span className="text-rose-400 font-medium tabular-nums">
                -{formatAmount(accountBalances.main.outflow)}
              </span>
            </div>
          </div>
        </div>

        {/* Account 2: PERSONAL ACCOUNT */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 p-5 rounded-xl transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <User className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-heading font-bold text-white text-sm leading-tight">
                  Personal Account
                </h2>
                <span className="text-[0.68rem] text-slate-400 font-mono">
                  Groceries & Daily Spending
                </span>
              </div>
            </div>
            <span className="text-[0.62rem] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Allowance
            </span>
          </div>

          <div className="my-3">
            <span className="text-[0.68rem] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
              Spending Allowance
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-indigo-200 tabular-nums">
              {formatAmount(accountBalances.personal.balance)}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono text-slate-400">
            <div className="flex justify-between items-center">
              <span>Transfers In</span>
              <span className="text-emerald-400 font-medium tabular-nums">
                +{formatAmount(accountBalances.personal.inflow)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Spent This Month</span>
              <span className="text-rose-400 font-medium tabular-nums">
                -{formatAmount(accountBalances.personal.outflow)}
              </span>
            </div>
          </div>
        </div>

        {/* Account 3: SAVINGS VAULT */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 p-5 rounded-xl transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <PiggyBank className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-heading font-bold text-white text-sm leading-tight">
                  Savings Vault
                </h2>
                <span className="text-[0.68rem] text-slate-400 font-mono">
                  Emergency Fund & Goals
                </span>
              </div>
            </div>
            <span className="text-[0.62rem] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Reserves
            </span>
          </div>

          <div className="my-3">
            <span className="text-[0.68rem] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
              Vault Balance
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-amber-400 tabular-nums">
              {formatAmount(accountBalances.savings.balance)}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs font-mono text-slate-400">
            <div className="flex justify-between items-center">
              <span>Saved This Month</span>
              <span className="text-emerald-400 font-medium tabular-nums">
                +{formatAmount(savedThisMonth)}
              </span>
            </div>
            <div>
              <div className="flex justify-between text-[0.68rem] text-slate-400 mb-1">
                <span>Target: {formatAmount(monthlySavingsTarget)}</span>
                <span className="tabular-nums font-semibold">{savingsProgressPercent}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${savingsProgressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Accounts (if configured) */}
      {customAccounts.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-blue-300/80 uppercase tracking-wider text-[0.68rem] font-semibold">
              Additional Accounts
            </span>
            <button
              onClick={() => onNavigateToTab('settings')}
              className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              Manage in Settings →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customAccounts.map((acc) => {
              const bal = accountBalances.allAccounts[acc.id]?.balance ?? acc.startingBalance;
              return (
                <div
                  key={acc.id}
                  className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-lg flex items-center justify-between font-mono"
                >
                  <div className="min-w-0">
                    <span className="text-white text-xs font-medium block truncate">{acc.name}</span>
                    <span className="text-[0.65rem] text-slate-400">{acc.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-200 text-xs font-medium block tabular-nums">
                      {formatAmount(bal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reimbursement Callout Banner (if money is owed) */}
      {pendingReimbursements.count > 0 && (
        <div className="bg-blue-950/30 border border-blue-800/50 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <RefreshCcw className="w-4 h-4" />
            </span>
            <div>
              <span className="text-white font-medium text-sm block sm:inline">
                {pendingReimbursements.count} Pending Reimbursement{pendingReimbursements.count === 1 ? '' : 's'}
              </span>
              <span className="text-slate-400 block sm:inline sm:ml-2">
                Owed out-of-pocket: <span className="text-emerald-400 font-bold tabular-nums">{formatAmount(pendingReimbursements.totalPending)}</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('reimbursements')}
            className="self-start sm:self-auto text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            Review in Shared →
          </button>
        </div>
      )}

      {/* Wishlist Spotlight Banner */}
      {topWishlistGoal && (
        <div className="bg-indigo-950/25 border border-indigo-800/40 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
                <span className="text-indigo-300 font-semibold">Wishlist Goal</span>
                <span className="text-slate-500">·</span>
                <span className="text-white font-medium truncate">{topWishlistGoal.title}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-200 tabular-nums font-bold">{formatAmount(topWishlistGoal.price)}</span>
                {accountBalances.personal.balance >= topWishlistGoal.price && (
                  <span className="text-[0.62rem] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Affordable with Personal Funds
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 max-w-xs sm:max-w-md">
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((topWishlistGoal.savedAmount / topWishlistGoal.price) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-[0.68rem] font-mono text-slate-400 tabular-nums">
                  {formatAmount(topWishlistGoal.savedAmount)} / {formatAmount(topWishlistGoal.price)} ({Math.min(100, Math.round((topWishlistGoal.savedAmount / topWishlistGoal.price) * 100))}%)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('wishlist')}
            className="self-start sm:self-auto text-xs font-mono text-indigo-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            All Wishlist ({activeWishlistItems.length}) →
          </button>
        </div>
      )}

      {/* Monthly Cash Flow Summary */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[0.7rem] font-mono uppercase tracking-wider text-blue-300/70 mb-0.5">
                Monthly Summary
              </div>
              <div className="text-sm font-semibold text-white">
                {currentMonthName} Cash Flow
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-6 text-xs font-mono">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/70">
              <span className="text-[0.65rem] text-slate-400 block uppercase">Inflow</span>
              <span className="font-semibold text-emerald-400 text-sm tabular-nums">
                +{formatAmount(cashFlow.totalIncome)}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/70">
              <span className="text-[0.65rem] text-slate-400 block uppercase">Outflow</span>
              <span className="font-semibold text-rose-400 text-sm tabular-nums">
                -{formatAmount(cashFlow.totalExpenses)}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/70">
              <span className="text-[0.65rem] text-slate-400 block uppercase">Net</span>
              <span
                className={`font-semibold text-sm tabular-nums ${
                  cashFlow.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {cashFlow.netCashFlow >= 0 ? '+' : ''}
                {formatAmount(cashFlow.netCashFlow)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[0.7rem] font-mono uppercase tracking-wider text-blue-300/70 mb-0.5">
              Recent Activity
            </div>
            <h2 className="text-sm font-semibold text-white">Latest Transactions</h2>
          </div>
          <button
            onClick={() => onNavigateToTab('ledger')}
            className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            View Full Ledger →
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs font-mono">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {recentTransactions.map((tx) => {
              const isExpense = tx.type === 'expense';
              const isTransfer = tx.type === 'transfer';
              const normalizedAcc = normalizeAccount(tx.account);

              return (
                <div
                  key={tx.id}
                  className="py-2.5 flex items-center justify-between gap-3 group hover:bg-slate-800/30 px-2 -mx-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                        isTransfer
                          ? 'bg-blue-500/10 text-blue-400'
                          : isExpense
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {isTransfer ? (
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      ) : isExpense ? (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className="font-medium text-xs sm:text-sm text-slate-200 block truncate">
                        {tx.note}
                      </span>
                      <div className="flex items-center gap-1.5 text-[0.68rem] font-mono text-slate-400">
                        <span className="text-blue-300/90 capitalize font-medium">
                          {normalizedAcc}
                        </span>
                        {isTransfer && tx.toAccount && (
                          <>
                            <span>→</span>
                            <span className="text-blue-300/90 capitalize font-medium">
                              {normalizeAccount(tx.toAccount)}
                            </span>
                          </>
                        )}
                        <span>·</span>
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
                      className={`font-mono text-xs sm:text-sm font-semibold tabular-nums ${
                        isTransfer
                          ? 'text-blue-300'
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
                      title="Delete"
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
