import {
  Task,
  Habit,
  PlanProject,
  Transaction,
  BrainDumpItem,
  UserSettings,
  Account,
  FinanceCategory,
  WishlistItem,
} from '../types';
import { getTodayDateString } from '../utils/quickCaptureParser';

const today = getTodayDateString();

export const initialAccounts: Account[] = [
  {
    id: 'main',
    name: 'Main Account',
    type: 'main',
    icon: 'building',
    description: 'Primary income salary, fixed overhead, and fund transfers to personal & savings',
    startingBalance: 0,
    isTransferrable: true,
    isDefault: true,
    color: '#3b82f6',
  },
  {
    id: 'personal',
    name: 'Personal Account',
    type: 'personal',
    icon: 'user',
    description: 'Day-to-day spending, groceries, dining, coffee & personal purchases',
    startingBalance: 0,
    isTransferrable: true,
    isDefault: true,
    color: '#10b981',
  },
  {
    id: 'savings',
    name: 'Savings Vault',
    type: 'savings',
    icon: 'piggy',
    description: 'Emergency fund, target savings stash, and reserve capital',
    startingBalance: 0,
    isTransferrable: true,
    isDefault: true,
    color: '#f59e0b',
  },
];

export const initialCategories: FinanceCategory[] = [
  // Personal & Living Expenses
  {
    id: 'cat-housing',
    name: 'Housing & Rent',
    scope: 'personal',
    monthlyBudget: 0,
    icon: 'home',
    color: '#6366f1',
    description: 'Apartment rent, property lease, municipal rates',
    isDefault: true,
  },
  {
    id: 'cat-groceries',
    name: 'Groceries',
    scope: 'personal',
    monthlyBudget: 0,
    icon: 'shopping-cart',
    color: '#10b981',
    description: 'Supermarket essentials, fresh produce, pantry staples',
    isDefault: true,
  },
  {
    id: 'cat-dining',
    name: 'Dining & Food',
    scope: 'personal',
    monthlyBudget: 0,
    icon: 'utensils',
    color: '#f59e0b',
    description: 'Cafes, takeout, work lunches, weekend dinners',
    isDefault: true,
  },
  {
    id: 'cat-utilities',
    name: 'Utilities',
    scope: 'personal',
    monthlyBudget: 0,
    icon: 'zap',
    color: '#3b82f6',
    description: 'Electricity, fiber internet, water, gas',
    isDefault: true,
  },
  {
    id: 'cat-transport',
    name: 'Transportation',
    scope: 'personal',
    monthlyBudget: 0,
    icon: 'bus',
    color: '#06b6d4',
    description: 'Transit smart card top-ups, fuel, rideshare',
    isDefault: true,
  },
  {
    id: 'cat-tech',
    name: 'Tech & Software',
    scope: 'personal',
    monthlyBudget: 0,
    icon: 'laptop',
    color: '#a855f7',
    description: 'Subscriptions, tools, cloud hosting',
    isDefault: true,
  },
  {
    id: 'cat-shopping',
    name: 'Shopping',
    scope: 'personal',
    monthlyBudget: 0,
    icon: 'tag',
    color: '#14b8a6',
    description: 'Apparel, household items, personal gear',
    isDefault: true,
  },
  {
    id: 'cat-healthcare',
    name: 'Healthcare',
    scope: 'personal',
    monthlyBudget: 0,
    icon: 'activity',
    color: '#ef4444',
    description: 'Pharmacy, medical clinic checkups, vitamins',
    isDefault: true,
  },
  {
    id: 'cat-salary',
    name: 'Salary',
    scope: 'personal',
    monthlyBudget: 0,
    icon: 'dollar-sign',
    color: '#22c55e',
    description: 'Monthly salary paycheck deposit',
    isDefault: true,
  },
  {
    id: 'cat-freelance',
    name: 'Freelance',
    scope: 'personal',
    monthlyBudget: 0,
    icon: 'briefcase',
    color: '#38bdf8',
    description: 'Contract consulting and freelance deliverables',
    isDefault: true,
  },
  {
    id: 'cat-other',
    name: 'Other',
    scope: 'all',
    monthlyBudget: 0,
    icon: 'more-horizontal',
    color: '#94a3b8',
    description: 'Miscellaneous uncategorized entries',
    isDefault: true,
  },
];

export const initialSettings: UserSettings = {
  userName: 'User',
  userEmail: '',
  currency: '$',
  monthlyExpectedIncome: 0,
  monthlyFixedBills: 0,
  monthlyTargetSavings: 0,
  monthlyBudgetLimit: 0,
  lastRolloverDate: today,
  pinLockEnabled: false,
};

export const initialProjects: PlanProject[] = [];
export const initialTasks: Task[] = [];
export const initialHabits: Habit[] = [];
export const initialTransactions: Transaction[] = [];
export const initialBrainDump: BrainDumpItem[] = [];
export const initialWishlist: WishlistItem[] = [];
