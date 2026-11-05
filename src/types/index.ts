export type Priority = 'low' | 'med' | 'high';
export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskCategory = 'personal' | 'work' | 'academic' | 'projects';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  category: TaskCategory;
  dueDate: string; // YYYY-MM-DD
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekdays' | 'weekly';
  completedAt?: string;
  createdAt: string;
  projectId?: string;
  notes?: string;
  isFocusTop3?: boolean;
  rolledOver?: boolean;
}

export interface Habit {
  id: string;
  title: string;
  category: string;
  streak: number;
  completedDates: string[]; // YYYY-MM-DD
  targetDaysPerWeek: number;
  createdAt: string;
}

export type ProjectStatus = 'idea' | 'in-progress' | 'shipped';
export type ProjectHorizon = 'short-term' | 'long-term';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  targetDate?: string;
}

export interface PlanProject {
  id: string;
  title: string;
  horizon: ProjectHorizon;
  status: ProjectStatus;
  targetDate: string; // YYYY-MM-DD
  progress: number; // 0 - 100
  budget?: number;
  milestones: Milestone[];
  notes: string;
  category: string;
  createdAt: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'main' | 'personal' | 'savings' | 'cash' | 'bank' | 'card' | string;

export interface Account {
  id: string;
  name: string;
  type: 'main' | 'personal' | 'savings' | 'custom';
  icon: string;
  description: string;
  startingBalance: number;
  isTransferrable: boolean;
  isDefault?: boolean;
  color?: string;
}

export interface FinanceCategory {
  id: string;
  name: string;
  scope: 'personal' | 'main' | 'all';
  monthlyBudget: number;
  icon?: string;
  color?: string;
  isDefault?: boolean;
  description?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  account: AccountType;
  toAccount?: AccountType; // For transfers between accounts
  note: string;
  projectId?: string;
  isReimbursable?: boolean;
  reimbursementStatus?: 'pending' | 'settled';
  isRecurringBill?: boolean;
}

export interface BrainDumpItem {
  id: string;
  content: string;
  category?: string;
  createdAt: string;
  isPinned?: boolean;
}

export interface UserSettings {
  userName: string;
  userEmail: string;
  currency: string;
  monthlyBudgetLimit: number;
  monthlyFixedBills: number;
  monthlyTargetSavings: number;
  monthlyExpectedIncome: number;
  mainStartingBalance?: number;
  personalStartingBalance?: number;
  savingsStartingBalance?: number;
  lastRolloverDate?: string;
  pinLockEnabled?: boolean;
  pinCode?: string;
}

export type WishlistPriority = 'high' | 'medium' | 'low';
export type WishlistStatus = 'saving' | 'ready' | 'purchased';

export interface WishlistItem {
  id: string;
  title: string;
  price: number;
  savedAmount: number;
  priority: WishlistPriority;
  status: WishlistStatus;
  url?: string;
  notes?: string;
  targetAccount?: 'personal' | 'savings' | 'main';
  targetDate?: string;
  purchasedDate?: string;
  purchasedTxId?: string;
  createdAt: string;
}

export type ActiveTab =
  | 'overview'
  | 'ledger'
  | 'wishlist'
  | 'categories'
  | 'reimbursements'
  | 'settings'
  | 'dashboard'
  | 'finances'
  | 'tasks'
  | 'roadmap'
  | 'scratchpad';
