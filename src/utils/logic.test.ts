import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuickCapture } from './quickCaptureParser';
import { calculateSafeToSpend, calculateProjectBudgetSummary, calculatePendingReimbursements, calculateCategoryBreakdown, calculateMonthlyCashFlow, normalizeAccount, calculateAccountBalances, searchTransactions } from './financeCalculators';
import { performDailyRollover } from './rollover';
import { Task, Habit, PlanProject, Transaction } from '../types';

test('quickCaptureParser parses task with tags, priority, and date', () => {
  const result = parseQuickCapture('!task Finish PCB routing #projects @tomorrow !p:high +focus');
  assert.equal(result.kind, 'task');
  assert.ok(result.task);
  assert.equal(result.task.title, 'Finish PCB routing');
  assert.equal(result.task.category, 'projects');
  assert.equal(result.task.priority, 'high');
  assert.equal(result.task.isFocusTop3, true);
});

test('quickCaptureParser parses expense shorthand with amount, category and account', () => {
  const result = parseQuickCapture('$45.50 Lunch with team #food [card] ?reimburse @proj:RobotArm');
  assert.equal(result.kind, 'expense');
  assert.ok(result.transaction);
  assert.equal(result.transaction.amount, 45.50);
  assert.equal(result.transaction.category, 'Food');
  assert.equal(result.transaction.account, 'card');
  assert.equal(result.transaction.isReimbursable, true);
  assert.equal(result.transaction.projectName, 'RobotArm');
});

test('quickCaptureParser parses income shorthand', () => {
  const result = parseQuickCapture('+$3200 Freelance project delivery #work [bank]');
  assert.equal(result.kind, 'income');
  assert.ok(result.transaction);
  assert.equal(result.transaction.amount, 3200);
  assert.equal(result.transaction.account, 'bank');
});

test('quickCaptureParser parses roadmap plan', () => {
  const result = parseQuickCapture('!plan Robotic Arm Mk1 @2026-12-15 $1500 #hardware');
  assert.equal(result.kind, 'plan');
  assert.ok(result.plan);
  assert.equal(result.plan.title, 'Robotic Arm Mk1');
  assert.equal(result.plan.targetDate, '2026-12-15');
  assert.equal(result.plan.budget, 1500);
});

test('quickCaptureParser parses brain dump note', () => {
  const result = parseQuickCapture('!note Research motor drivers with CAN bus #hardware');
  assert.equal(result.kind, 'note');
  assert.ok(result.note);
  assert.equal(result.note.content, 'Research motor drivers with CAN bus');
  assert.equal(result.note.category, 'hardware');
});

test('calculateSafeToSpend correctly computes monthly and daily allowance', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx1',
      amount: 200,
      type: 'expense',
      category: 'Food',
      date: '2026-10-15',
      account: 'card',
      note: 'Groceries'
    },
    {
      id: 'tx2',
      amount: 100,
      type: 'expense',
      category: 'Fuel',
      date: '2026-10-20',
      account: 'card',
      note: 'Gas'
    }
  ];

  // Ref date: 2026-10-30 (October has 31 days. Day 30 means 2 days left: 30th and 31st)
  const refDate = new Date(2026, 9, 30);
  // Monthly income 3000, fixed bills 1200, savings 600
  // Discretionary pool = 3000 - 1200 - 600 = 1200
  // Spent so far = 300
  // Safe to spend month = 1200 - 300 = 900
  // Days remaining = 31 - 30 + 1 = 2
  // Safe to spend today = 900 / 2 = 450
  const result = calculateSafeToSpend(mockTransactions, 3000, 1200, 600, refDate);
  assert.equal(result.spentSoFarThisMonth, 300);
  assert.equal(result.safeToSpendMonth, 900);
  assert.equal(result.daysRemainingInMonth, 2);
  assert.equal(result.safeToSpendToday, 450);
  assert.equal(result.isOverBudget, false);
});

test('calculateProjectBudgetSummary computes bill of materials spend', () => {
  const project: PlanProject = {
    id: 'proj-1',
    title: 'Drone Quadcopter',
    horizon: 'short-term',
    status: 'in-progress',
    targetDate: '2026-11-30',
    progress: 40,
    budget: 500,
    milestones: [],
    notes: '',
    category: 'hardware',
    createdAt: '2026-10-01'
  };

  const transactions: Transaction[] = [
    { id: 't1', amount: 150, type: 'expense', category: 'Hardware', date: '2026-10-05', account: 'card', note: 'Motors', projectId: 'proj-1' },
    { id: 't2', amount: 80, type: 'expense', category: 'Hardware', date: '2026-10-08', account: 'card', note: 'ESC', projectId: 'proj-1' },
    { id: 't3', amount: 20, type: 'expense', category: 'Food', date: '2026-10-09', account: 'cash', note: 'Lunch' } // not linked
  ];

  const summary = calculateProjectBudgetSummary(project, transactions);
  assert.equal(summary.totalSpent, 230);
  assert.equal(summary.remainingBudget, 270);
  assert.equal(summary.percentUsed, 46);
  assert.equal(summary.itemCount, 2);
  assert.equal(summary.isOverBudget, false);
});

test('calculatePendingReimbursements sums reimbursable items', () => {
  const transactions: Transaction[] = [
    { id: 't1', amount: 65, type: 'expense', category: 'Food', date: '2026-10-25', account: 'card', note: 'Team dinner', isReimbursable: true, reimbursementStatus: 'pending' },
    { id: 't2', amount: 35, type: 'expense', category: 'Supplies', date: '2026-10-26', account: 'card', note: 'Office markers', isReimbursable: true, reimbursementStatus: 'pending' },
    { id: 't3', amount: 50, type: 'expense', category: 'Food', date: '2026-10-20', account: 'card', note: 'Settled lunch', isReimbursable: true, reimbursementStatus: 'settled' }
  ];

  const result = calculatePendingReimbursements(transactions);
  assert.equal(result.totalPending, 100);
  assert.equal(result.count, 2);
});

test('performDailyRollover rolls over overdue incomplete tasks to today', () => {
  const tasks: Task[] = [
    { id: '1', title: 'Yesterday task', status: 'todo', priority: 'high', category: 'work', dueDate: '2026-10-29', createdAt: '2026-10-29' },
    { id: '2', title: 'Today task', status: 'doing', priority: 'med', category: 'personal', dueDate: '2026-10-30', createdAt: '2026-10-30' },
    { id: '3', title: 'Future task', status: 'todo', priority: 'low', category: 'projects', dueDate: '2026-11-05', createdAt: '2026-10-30' },
  ];
  const habits: Habit[] = [];

  const result = performDailyRollover(tasks, habits, '2026-10-30');
  assert.equal(result.rolledOverCount, 1);
  const rolled = result.updatedTasks.find(t => t.id === '1');
  assert.equal(rolled?.dueDate, '2026-10-30');
  assert.equal(rolled?.rolledOver, true);
});

test('calculateCategoryBreakdown groups expenses and computes percentages', () => {
  const transactions: Transaction[] = [
    { id: '1', amount: 300, type: 'expense', category: 'Groceries', date: '2026-10-04', account: 'card', note: 'Supermarket' },
    { id: '2', amount: 100, type: 'expense', category: 'Groceries', date: '2026-10-12', account: 'card', note: 'Produce' },
    { id: '3', amount: 200, type: 'expense', category: 'Utilities', date: '2026-10-08', account: 'bank', note: 'Electric' },
    { id: '4', amount: 500, type: 'income', category: 'Salary', date: '2026-10-01', account: 'bank', note: 'Income' },
  ];
  const refDate = new Date(2026, 9, 15); // Oct 15 2026
  const { breakdown, totalExpenseMonth } = calculateCategoryBreakdown(transactions, refDate);

  assert.equal(totalExpenseMonth, 600);
  assert.equal(breakdown.length, 2);
  assert.equal(breakdown[0].category, 'Groceries');
  assert.equal(breakdown[0].total, 400);
  assert.equal(breakdown[0].percentage, 67);
  assert.equal(breakdown[1].category, 'Utilities');
  assert.equal(breakdown[1].total, 200);
  assert.equal(breakdown[1].percentage, 33);
});

test('calculateMonthlyCashFlow computes income, bills and net cash flow', () => {
  const transactions: Transaction[] = [
    { id: '1', amount: 4000, type: 'income', category: 'Salary', date: '2026-10-01', account: 'bank', note: 'Paycheck' },
    { id: '2', amount: 500, type: 'expense', category: 'Food', date: '2026-10-04', account: 'card', note: 'Dining' },
  ];
  const refDate = new Date(2026, 9, 15);
  const result = calculateMonthlyCashFlow(transactions, 1200, refDate);

  assert.equal(result.totalIncome, 4000);
  assert.equal(result.totalExpenses, 1700); // 1200 fixed + 500 variable
  assert.equal(result.netCashFlow, 2300);
});

test('calculateAccountBalances tracks Main, Personal, and Savings accounts with transfers', () => {
  const transactions: Transaction[] = [
    // Main account gets salary
    { id: '1', amount: 3000, type: 'income', category: 'Salary', date: '2026-10-01', account: 'main', note: 'Salary' },
    // Main pays fixed rent
    { id: '2', amount: 1200, type: 'expense', category: 'Rent', date: '2026-10-02', account: 'main', note: 'Rent' },
    // Transfer from Main to Personal for spending
    { id: '3', amount: 600, type: 'transfer', category: 'Transfer', date: '2026-10-03', account: 'main', toAccount: 'personal', note: 'Personal Allowance' },
    // Transfer from Main to Savings
    { id: '4', amount: 400, type: 'transfer', category: 'Savings', date: '2026-10-04', account: 'main', toAccount: 'savings', note: 'Monthly stash' },
    // Personal account spends on groceries & coffee
    { id: '5', amount: 75, type: 'expense', category: 'Groceries', date: '2026-10-05', account: 'personal', note: 'Supermarket' },
  ];

  // Starting balances: Main = 1000, Personal = 100, Savings = 1000
  const balances = calculateAccountBalances(transactions, { main: 1000, personal: 100, savings: 1000 }, new Date(2026, 9, 15));

  // Main: 1000 + 3000 - 1200 - 600 - 400 = 1800
  assert.equal(balances.main.balance, 1800);
  assert.equal(balances.main.inflow, 3000);
  assert.equal(balances.main.outflow, 2200);

  // Personal: 100 + 600 - 75 = 625
  assert.equal(balances.personal.balance, 625);
  assert.equal(balances.personal.inflow, 600);
  assert.equal(balances.personal.outflow, 75);

  // Savings: 1000 + 400 = 1400
  assert.equal(balances.savings.balance, 1400);
  assert.equal(balances.savings.savedThisMonth, 400);

  // Total net worth = 1800 + 625 + 1400 = 3825
  assert.equal(balances.totalNetWorth, 3825);
});

test('calculateAccountBalances correctly tracks simple 2-account setup (Main & Personal) with Savings', () => {
  const transactions: Transaction[] = [
    // Main receives salary
    { id: '1', amount: 5000, type: 'income', category: 'Salary', date: '2026-10-01', account: 'main', note: 'Salary' },
    // Main transfers allowance to Personal
    { id: '2', amount: 800, type: 'transfer', category: 'Transfer', date: '2026-10-03', account: 'main', toAccount: 'personal', note: 'Monthly spending allowance' },
    // Personal spends on Groceries
    { id: '3', amount: 150, type: 'expense', category: 'Groceries', date: '2026-10-05', account: 'personal', note: 'Supermarket' },
    // Main pays fixed bills
    { id: '4', amount: 1200, type: 'expense', category: 'Housing', date: '2026-10-08', account: 'main', note: 'Rent' },
    // Main transfers savings to Savings Vault
    { id: '5', amount: 600, type: 'transfer', category: 'Transfer', date: '2026-10-12', account: 'main', toAccount: 'savings', note: 'Emergency fund deposit' },
    // Personal transfers leftover to Savings Vault
    { id: '6', amount: 50, type: 'transfer', category: 'Transfer', date: '2026-10-20', account: 'personal', toAccount: 'savings', note: 'Leftover pocket savings' },
  ];

  // Starting balances: Main = 2000, Personal = 300, Savings = 1500
  const balances = calculateAccountBalances(
    transactions,
    { main: 2000, personal: 300, savings: 1500 },
    new Date(2026, 9, 25)
  );

  // Main: 2000 + 5000 (salary) - 800 (to personal) - 1200 (rent) - 600 (to savings) = 4400
  assert.equal(balances.main.balance, 4400);

  // Personal: 300 + 800 (from main) - 150 (groceries) - 50 (to savings) = 900
  assert.equal(balances.personal.balance, 900);

  // Savings: 1500 + 600 (from main) + 50 (from personal) = 2150
  assert.equal(balances.savings.balance, 2150);
  assert.equal(balances.savings.savedThisMonth, 650);

  // Total net worth: 4400 + 900 + 2150 = 7450
  assert.equal(balances.totalNetWorth, 7450);
});

test('ledger cash flow and reimbursement settlement correctly calculates balances', () => {
  const transactions: Transaction[] = [
    { id: '1', amount: 80, type: 'expense', category: 'General', date: '2026-10-05', account: 'personal', note: 'Apples' },
    { id: '2', amount: 120, type: 'expense', category: 'General', date: '2026-10-10', account: 'personal', note: 'Office supplies', isReimbursable: true, reimbursementStatus: 'pending' },
    { id: '3', amount: 50, type: 'expense', category: 'General', date: '2026-10-15', account: 'main', note: 'Water bill' },
  ];

  const pending = calculatePendingReimbursements(transactions);
  assert.equal(pending.count, 1);
  assert.equal(pending.totalPending, 120);

  // Settle the reimbursement
  const settledTxs = transactions.map((t) => (t.id === '2' ? { ...t, reimbursementStatus: 'settled' as const } : t));
  const pendingAfterSettlement = calculatePendingReimbursements(settledTxs);
  assert.equal(pendingAfterSettlement.count, 0);
  assert.equal(pendingAfterSettlement.totalPending, 0);
});

test('searchTransactions finds transactions by merchant name, date, and amount', () => {
  const sample: Transaction[] = [
    {
      id: 'tx-1',
      amount: 45.50,
      type: 'expense',
      category: 'Dining',
      date: '2026-11-05',
      account: 'personal',
      note: "Trader Joe's groceries",
    },
    {
      id: 'tx-2',
      amount: 1200,
      type: 'expense',
      category: 'Housing',
      date: '2026-10-01',
      account: 'main',
      note: 'Monthly Apartment Rent',
    },
    {
      id: 'tx-3',
      amount: 4.75,
      type: 'expense',
      category: 'Coffee',
      date: '2026-11-04',
      account: 'personal',
      note: 'Starbucks latte',
    },
    {
      id: 'tx-4',
      amount: 3500,
      type: 'income',
      category: 'Salary',
      date: '2026-10-31',
      account: 'main',
      note: 'Acme Corp Payroll',
    },
  ];

  // 1. Search by Merchant / Note
  const merchantResults = searchTransactions(sample, 'Trader');
  assert.equal(merchantResults.length, 1);
  assert.equal(merchantResults[0].id, 'tx-1');

  const starbucksResults = searchTransactions(sample, 'starbucks');
  assert.equal(starbucksResults.length, 1);
  assert.equal(starbucksResults[0].id, 'tx-3');

  // 2. Search by Date (Raw ISO date, YYYY-MM, or Human formatted month/day)
  const dateIsoResults = searchTransactions(sample, '2026-11-05');
  assert.equal(dateIsoResults.length, 1);
  assert.equal(dateIsoResults[0].id, 'tx-1');

  const monthYearResults = searchTransactions(sample, '2026-10');
  assert.equal(monthYearResults.length, 2); // tx-2 and tx-4

  const monthNameResults = searchTransactions(sample, 'Nov');
  assert.equal(monthNameResults.length, 2); // tx-1 and tx-3

  // 3. Search by Amount (exact number, with currency symbol, or partial)
  const exactAmtResults = searchTransactions(sample, '45.50');
  assert.equal(exactAmtResults.length, 1);
  assert.equal(exactAmtResults[0].id, 'tx-1');

  const currencySymbolResults = searchTransactions(sample, '$1200');
  assert.equal(currencySymbolResults.length, 1);
  assert.equal(currencySymbolResults[0].id, 'tx-2');

  const smallAmtResults = searchTransactions(sample, '4.75');
  assert.equal(smallAmtResults.length, 1);
  assert.equal(smallAmtResults[0].id, 'tx-3');

  // 4. Empty or whitespace query returns all
  const emptyResults = searchTransactions(sample, '   ');
  assert.equal(emptyResults.length, 4);
});


