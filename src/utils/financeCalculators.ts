import { Transaction, PlanProject } from '../types';

export interface SafeToSpendResult {
  monthlyIncome: number;
  monthlyFixedBills: number;
  monthlyTargetSavings: number;
  spentSoFarThisMonth: number;
  safeToSpendMonth: number;
  safeToSpendToday: number;
  daysRemainingInMonth: number;
  totalDaysInMonth: number;
  currentDayOfMonth: number;
  burnRatePercentage: number;
  isOverBudget: boolean;
}

export interface ProjectBudgetSummary {
  projectId: string;
  projectTitle: string;
  allocatedBudget: number;
  totalSpent: number;
  remainingBudget: number;
  percentUsed: number;
  isOverBudget: boolean;
  itemCount: number;
}

/**
 * Calculates days remaining in the current month (inclusive of today).
 */
export function getDaysRemainingInMonth(referenceDate = new Date()): {
  daysRemaining: number;
  totalDays: number;
  currentDay: number;
} {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const currentDay = referenceDate.getDate();
  // Include today as an available spending day
  const daysRemaining = Math.max(1, totalDays - currentDay + 1);

  return { daysRemaining, totalDays, currentDay };
}

/**
 * Calculates Safe-to-Spend metrics based on the formula:
 * Available = Monthly Income − Fixed Bills − Target Savings
 * Safe to Spend Month = Available − Spent So Far
 * Safe to Spend Today = Safe to Spend Month / Days Remaining
 */
export function calculateSafeToSpend(
  transactions: Transaction[],
  monthlyIncome: number,
  monthlyFixedBills: number,
  monthlyTargetSavings: number,
  referenceDate = new Date()
): SafeToSpendResult {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  // Filter transactions for the current month and year
  const currentMonthExpenses = transactions.filter((t) => {
    if (t.type !== 'expense') return false;
    const [y, m] = t.date ? t.date.split('-').map(Number) : [0, 0];
    return y === currentYear && m === currentMonth + 1;
  });

  const spentSoFarThisMonth = currentMonthExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Calculate net transfers into Personal spending account for this month
  let netPersonalTransfers = 0;
  for (const t of transactions) {
    if (t.type === 'transfer') {
      const [y, m] = t.date ? t.date.split('-').map(Number) : [0, 0];
      if (y === currentYear && m === currentMonth + 1) {
        const source = normalizeAccount(t.account);
        const dest = normalizeAccount(t.toAccount || 'personal');
        const amt = Number(t.amount) || 0;
        if (dest === 'personal' && source !== 'personal') {
          netPersonalTransfers += amt;
        } else if (source === 'personal' && dest !== 'personal') {
          netPersonalTransfers -= amt;
        }
      }
    }
  }

  const baseDiscretionary = Math.max(0, monthlyIncome - monthlyFixedBills - monthlyTargetSavings);
  const totalDiscretionaryPool = Math.max(0, baseDiscretionary + netPersonalTransfers);
  const safeToSpendMonth = totalDiscretionaryPool - spentSoFarThisMonth;

  const { daysRemaining, totalDays, currentDay } = getDaysRemainingInMonth(referenceDate);

  const safeToSpendToday = safeToSpendMonth > 0 ? Math.round((safeToSpendMonth / daysRemaining) * 100) / 100 : 0;

  const burnRatePercentage =
    totalDiscretionaryPool > 0
      ? Math.min(100, Math.round((spentSoFarThisMonth / totalDiscretionaryPool) * 100))
      : spentSoFarThisMonth > 0
      ? 100
      : 0;

  return {
    monthlyIncome,
    monthlyFixedBills,
    monthlyTargetSavings,
    spentSoFarThisMonth,
    safeToSpendMonth,
    safeToSpendToday,
    daysRemainingInMonth: daysRemaining,
    totalDaysInMonth: totalDays,
    currentDayOfMonth: currentDay,
    burnRatePercentage,
    isOverBudget: safeToSpendMonth < 0,
  };
}

/**
 * Summarizes project-linked expenses (Bill of Materials / Project Budget)
 */
export function calculateProjectBudgetSummary(
  project: PlanProject,
  transactions: Transaction[]
): ProjectBudgetSummary {
  const projectExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.projectId === project.id
  );

  const totalSpent = projectExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const allocatedBudget = project.budget || 0;
  const remainingBudget = allocatedBudget - totalSpent;
  const percentUsed = allocatedBudget > 0 ? Math.round((totalSpent / allocatedBudget) * 100) : 0;

  return {
    projectId: project.id,
    projectTitle: project.title,
    allocatedBudget,
    totalSpent,
    remainingBudget,
    percentUsed,
    isOverBudget: allocatedBudget > 0 && totalSpent > allocatedBudget,
    itemCount: projectExpenses.length,
  };
}

/**
 * Calculates pending reimbursements (money owed to user from shared expenses)
 */
export function calculatePendingReimbursements(transactions: Transaction[]): {
  totalPending: number;
  count: number;
  pendingList: Transaction[];
} {
  const pending = transactions.filter(
    (t) => t.isReimbursable && t.reimbursementStatus === 'pending'
  );
  const totalPending = pending.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return {
    totalPending,
    count: pending.length,
    pendingList: pending,
  };
}

export interface CategorySpendItem {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

/**
 * Calculates spending breakdown by category for expenses in a given month.
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  referenceDate = new Date()
): {
  breakdown: CategorySpendItem[];
  totalExpenseMonth: number;
} {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  const monthExpenses = transactions.filter((t) => {
    if (t.type !== 'expense') return false;
    const [y, m] = t.date.split('-').map(Number);
    return y === currentYear && m === currentMonth + 1;
  });

  const totalExpenseMonth = monthExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const categoryMap = new Map<string, { total: number; count: number }>();

  for (const tx of monthExpenses) {
    const cat = tx.category.trim() || 'General';
    const existing = categoryMap.get(cat) || { total: 0, count: 0 };
    categoryMap.set(cat, {
      total: existing.total + (Number(tx.amount) || 0),
      count: existing.count + 1,
    });
  }

  const breakdown: CategorySpendItem[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      percentage: totalExpenseMonth > 0 ? Math.round((data.total / totalExpenseMonth) * 100) : 0,
      count: data.count,
    }))
    .sort((a, b) => b.total - a.total);

  return { breakdown, totalExpenseMonth };
}

/**
 * Calculates total income, total variable expenses, and net cash flow for the month.
 */
export function calculateMonthlyCashFlow(
  transactions: Transaction[],
  monthlyFixedBills: number,
  referenceDate = new Date()
): {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
} {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  let totalIncome = 0;
  let totalExpenses = monthlyFixedBills;

  for (const t of transactions) {
    const [y, m] = t.date.split('-').map(Number);
    if (y === currentYear && m === currentMonth + 1) {
      if (t.type === 'income') {
        totalIncome += Number(t.amount) || 0;
      } else if (t.type === 'expense') {
        totalExpenses += Number(t.amount) || 0;
      }
    }
  }

  return {
    totalIncome,
    totalExpenses,
    netCashFlow: totalIncome - totalExpenses,
  };
}

export type MainOrPersonalOrSavings = 'main' | 'personal' | 'savings' | string;

/**
 * Normalizes legacy, informal, or custom account strings into uniform account keys:
 * - 'main': Primary account (Income, Fixed Bills, Rent, Transfers out)
 * - 'personal': Personal use account (Day to day spending, groceries, dining, fun)
 * - 'savings': Savings stash (Emergency fund, goals, savings)
 * - Custom account IDs returned as trimmed lowercase strings
 */
export function normalizeAccount(acc: string | undefined): string {
  if (!acc) return 'personal';
  const lower = acc.toLowerCase().trim();
  if (lower === 'main' || lower.includes('main') || lower === 'bank' || lower === 'checking') return 'main';
  if (lower === 'savings' || lower.includes('savings') || lower === 'vault' || lower === 'stash') return 'savings';
  if (lower === 'personal' || lower.includes('personal') || lower === 'card' || lower === 'cash') return 'personal';
  return lower;
}

export interface AccountBalanceItem {
  balance: number;
  inflow: number;
  outflow: number;
  safeToSpendDaily?: number;
  savedThisMonth?: number;
}

export interface AccountBalances {
  main: AccountBalanceItem;
  personal: AccountBalanceItem & { safeToSpendDaily: number };
  savings: AccountBalanceItem & { savedThisMonth: number };
  allAccounts: Record<string, AccountBalanceItem>;
  totalNetWorth: number;
}

/**
 * Computes live balances across Main Account, Personal Account,
 * Savings Vault, and any custom transferrable accounts.
 */
export function calculateAccountBalances(
  transactions: Transaction[],
  startingBalances: Record<string, number> | { main: number; personal: number; savings: number; [key: string]: number | undefined } = {
    main: 2500,
    personal: 500,
    savings: 2000,
  },
  referenceDate = new Date()
): AccountBalances {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();
  const { daysRemaining } = getDaysRemainingInMonth(referenceDate);

  const startMain = startingBalances.main ?? 2500;
  const startPersonal = startingBalances.personal ?? 500;
  const startSavings = startingBalances.savings ?? 2000;

  const allAccounts: Record<string, AccountBalanceItem> = {
    main: { balance: startMain, inflow: 0, outflow: 0 },
    personal: { balance: startPersonal, inflow: 0, outflow: 0, safeToSpendDaily: 0 },
    savings: { balance: startSavings, inflow: 0, outflow: 0, savedThisMonth: 0 },
  };

  // Populate any custom accounts provided in startingBalances
  for (const [key, val] of Object.entries(startingBalances)) {
    const normKey = normalizeAccount(key);
    if (!allAccounts[normKey]) {
      allAccounts[normKey] = { balance: typeof val === 'number' ? val : 0, inflow: 0, outflow: 0 };
    }
  }

  for (const tx of transactions) {
    const amt = Number(tx.amount) || 0;
    const source = normalizeAccount(tx.account);
    const [y, m] = tx.date ? tx.date.split('-').map(Number) : [0, 0];
    const isThisMonth = y === currentYear && m === currentMonth + 1;

    // Ensure account exists in tracker
    if (!allAccounts[source]) {
      allAccounts[source] = { balance: 0, inflow: 0, outflow: 0 };
    }

    if (tx.type === 'income') {
      allAccounts[source].inflow += amt;
      allAccounts[source].balance += amt;

      if (source === 'savings' && isThisMonth) {
        allAccounts.savings.savedThisMonth = (allAccounts.savings.savedThisMonth || 0) + amt;
      }
    } else if (tx.type === 'expense') {
      allAccounts[source].outflow += amt;
      allAccounts[source].balance -= amt;

      if (source === 'savings' && isThisMonth) {
        allAccounts.savings.savedThisMonth = (allAccounts.savings.savedThisMonth || 0) - amt;
      }
    } else if (tx.type === 'transfer') {
      const dest = normalizeAccount(tx.toAccount || 'personal');
      if (!allAccounts[dest]) {
        allAccounts[dest] = { balance: 0, inflow: 0, outflow: 0 };
      }

      // Deduct from source
      allAccounts[source].outflow += amt;
      allAccounts[source].balance -= amt;

      // Add to destination
      allAccounts[dest].inflow += amt;
      allAccounts[dest].balance += amt;

      if (dest === 'savings' && isThisMonth) {
        allAccounts.savings.savedThisMonth = (allAccounts.savings.savedThisMonth || 0) + amt;
      }
      if (source === 'savings' && isThisMonth) {
        allAccounts.savings.savedThisMonth = (allAccounts.savings.savedThisMonth || 0) - amt;
      }
    }
  }

  // Daily safe to spend from Personal account for the rest of this month
  const personalBal = allAccounts.personal.balance;
  allAccounts.personal.safeToSpendDaily =
    personalBal > 0 ? Math.round((personalBal / daysRemaining) * 100) / 100 : 0;

  // Compute total net worth across all balances
  let totalNetWorth = 0;
  for (const acc of Object.values(allAccounts)) {
    totalNetWorth += acc.balance;
  }

  return {
    main: allAccounts.main,
    personal: allAccounts.personal as AccountBalanceItem & { safeToSpendDaily: number },
    savings: allAccounts.savings as AccountBalanceItem & { savedThisMonth: number },
    allAccounts,
    totalNetWorth,
  };
}

/**
 * Searches transactions by merchant/note, date (YYYY-MM-DD or formatted like "Nov 5"),
 * amount (exact or partial numerical match, ignoring currency symbols), and account/category.
 */
export function searchTransactions(
  transactions: Transaction[],
  query: string
): Transaction[] {
  if (!query || !query.trim()) return transactions;

  const rawQuery = query.trim().toLowerCase();
  // Strip currency symbols and commas for amount comparison
  const cleanNumericQuery = rawQuery.replace(/[$€£,]/g, '').trim();
  const numericVal = parseFloat(cleanNumericQuery);
  const hasValidNumber = !isNaN(numericVal) && cleanNumericQuery.length > 0;

  return transactions.filter((t) => {
    // 1. Merchant / Note / Description match
    if (t.note && t.note.toLowerCase().includes(rawQuery)) {
      return true;
    }

    // 2. Date match
    // Check raw date string (e.g. "2026-11-05", "2026-11", "11-05")
    if (t.date && t.date.toLowerCase().includes(rawQuery)) {
      return true;
    }

    // Check human formatted date (e.g. "Nov 5", "November 5", "Nov 5, 2026", "November 2026")
    if (t.date) {
      const parts = t.date.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          const monthShort = d.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
          const monthLong = d.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
          const fullFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
          const monthDay = `${monthShort} ${day}`;
          const monthDayLong = `${monthLong} ${day}`;

          if (
            monthShort.includes(rawQuery) ||
            monthLong.includes(rawQuery) ||
            fullFormatted.includes(rawQuery) ||
            monthDay.includes(rawQuery) ||
            monthDayLong.includes(rawQuery)
          ) {
            return true;
          }
        }
      }
    }

    // 3. Amount match
    if (cleanNumericQuery.length > 0) {
      const amtStr = Math.abs(t.amount).toString();
      const amtFixed = Math.abs(t.amount).toFixed(2);
      if (amtStr.includes(cleanNumericQuery) || amtFixed.includes(cleanNumericQuery)) {
        return true;
      }
      if (hasValidNumber && Math.abs(t.amount) === numericVal) {
        return true;
      }
    }

    // 4. Account or category match
    if (t.account && t.account.toLowerCase().includes(rawQuery)) {
      return true;
    }
    if (t.toAccount && t.toAccount.toLowerCase().includes(rawQuery)) {
      return true;
    }
    if (t.category && t.category.toLowerCase().includes(rawQuery)) {
      return true;
    }

    return false;
  });
}

