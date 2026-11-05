import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Task,
  Habit,
  PlanProject,
  Transaction,
  BrainDumpItem,
  UserSettings,
  ActiveTab,
  TaskStatus,
  Milestone,
  Account,
  FinanceCategory,
  WishlistItem,
  WishlistStatus,
} from '../types';
import {
  initialSettings,
  initialProjects,
  initialTasks,
  initialHabits,
  initialTransactions,
  initialBrainDump,
  initialAccounts,
  initialCategories,
  initialWishlist,
} from '../data/initialData';
import { parseQuickCapture, getTodayDateString } from '../utils/quickCaptureParser';
import {
  calculateSafeToSpend,
  calculatePendingReimbursements,
  SafeToSpendResult,
  calculateAccountBalances,
  AccountBalances,
} from '../utils/financeCalculators';
import { performDailyRollover } from '../utils/rollover';
import {
  db,
  auth,
  testConnection,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { useAuth } from './AuthContext';
import { User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  text: string;
}

interface LifeOSContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  tasks: Task[];
  habits: Habit[];
  projects: PlanProject[];
  transactions: Transaction[];
  brainDump: BrainDumpItem[];
  settings: UserSettings;
  toasts: ToastMessage[];
  addToast: (text: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Firebase Auth & User
  currentUser: User | null;
  isAuthLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;

  // Privacy & Masking Mode
  isPrivacyMasked: boolean;
  togglePrivacyMask: () => void;
  formatAmount: (amount: number, options?: { showSign?: boolean; decimals?: number }) => string;

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string) => void;
  toggleFocusTop3: (id: string) => void;

  // Habit actions
  addHabit: (habit: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'createdAt'>) => void;
  toggleHabitToday: (id: string) => void;
  deleteHabit: (id: string) => void;

  // Project actions
  addProject: (proj: Omit<PlanProject, 'id' | 'createdAt'>) => PlanProject;
  updateProject: (id: string, updates: Partial<PlanProject>) => void;
  deleteProject: (id: string) => void;
  toggleMilestone: (projectId: string, milestoneId: string) => void;
  addMilestone: (projectId: string, title: string, targetDate?: string) => void;
  deleteMilestone: (projectId: string, milestoneId: string) => void;

  // Finance actions
  addTransaction: (tx: Omit<Transaction, 'id'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  toggleReimbursementStatus: (id: string) => void;
  transferFunds: (transfer: {
    fromAccount: string;
    toAccount: string;
    amount: number;
    note?: string;
    date?: string;
  }) => Transaction;
  accountBalances: AccountBalances;

  // Accounts & Transfer Destinations
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  resetAccountsToDefault: () => void;

  // Categories & Budgets
  categories: FinanceCategory[];
  addCategory: (category: Omit<FinanceCategory, 'id'>) => FinanceCategory;
  updateCategory: (id: string, updates: Partial<FinanceCategory>, renameTransactions?: boolean) => void;
  deleteCategory: (id: string, reassignToCategory?: string) => void;
  resetCategoriesToDefault: () => void;

  // Wishlist
  wishlist: WishlistItem[];
  addWishlistItem: (item: Omit<WishlistItem, 'id' | 'createdAt'>) => WishlistItem;
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => void;
  deleteWishlistItem: (id: string) => void;
  allocateWishlistFunds: (id: string, amount: number) => void;
  markWishlistAsPurchased: (id: string, logAsExpense: boolean, account?: string) => void;

  // Brain dump actions
  addBrainDump: (content: string, category?: string) => void;
  updateBrainDump: (id: string, content: string, category?: string) => void;
  deleteBrainDump: (id: string) => void;
  convertBrainDumpToTask: (id: string) => void;
  convertBrainDumpToProject: (id: string) => void;

  // Settings
  updateSettings: (newSettings: Partial<UserSettings>) => void;

  // Global actions
  executeQuickCaptureText: (text: string) => boolean;
  startMyDay: () => { rolledOverCount: number; clearedClutterCount: number };
  safeToSpend: SafeToSpendResult;
  pendingReimbursements: ReturnType<typeof calculatePendingReimbursements>;

  // Backup & Restore
  exportDataJSON: () => void;
  exportDataCSV: (type: 'tasks' | 'finances' | 'projects') => void;
  importDataJSON: (jsonString: string) => boolean;
  resetAllData: () => void;
}

const LifeOSContext = createContext<LifeOSContextType | null>(null);

export const LifeOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: isAuthLoading, signInWithGoogle, signOut: signOutUser } = useAuth();
  const uid = user?.uid || 'guest';

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Privacy Masking (Masks balances with ••••••)
  const [isPrivacyMasked, setIsPrivacyMasked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`finance_os_${uid}_privacy_mask`) === 'true';
    } catch {
      return false;
    }
  });

  const togglePrivacyMask = useCallback(() => {
    setIsPrivacyMasked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(`finance_os_${uid}_privacy_mask`, String(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  }, [uid]);

  // Persistent stores strictly scoped to authenticated user ID
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(`finance_os_${uid}_tasks`);
      if (saved) {
        const parsed: Task[] = JSON.parse(saved);
        return parsed.filter((t) => !t.id.startsWith('t-') || t.id.length > 8);
      }
      return initialTasks;
    } catch {
      return initialTasks;
    }
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem(`finance_os_${uid}_habits`);
      if (saved) {
        const parsed: Habit[] = JSON.parse(saved);
        return parsed.filter((h) => !h.id.startsWith('h-') || h.id.length > 8);
      }
      return initialHabits;
    } catch {
      return initialHabits;
    }
  });

  const [projects, setProjects] = useState<PlanProject[]>(() => {
    try {
      const saved = localStorage.getItem(`finance_os_${uid}_projects`);
      if (saved) {
        const parsed: PlanProject[] = JSON.parse(saved);
        return parsed.filter((p) => !p.id.startsWith('proj-') || p.id.length > 15);
      }
      return initialProjects;
    } catch {
      return initialProjects;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(`finance_os_${uid}_transactions`);
      if (saved) {
        const parsed: Transaction[] = JSON.parse(saved);
        return parsed.filter(
          (t) =>
            t.account !== 'tea_estate' &&
            t.toAccount !== 'tea_estate' &&
            !t.id.startsWith('tx-inc-') &&
            !t.id.startsWith('tx-fixed-') &&
            !t.id.startsWith('tx-bom-') &&
            !t.id.startsWith('tx-exp-') &&
            !t.id.startsWith('tx-xfer-') &&
            !t.id.startsWith('tx-reimb-')
        );
      }
      return initialTransactions;
    } catch {
      return initialTransactions;
    }
  });

  const [brainDump, setBrainDump] = useState<BrainDumpItem[]>(() => {
    try {
      const saved = localStorage.getItem(`finance_os_${uid}_braindump`);
      if (saved) {
        const parsed: BrainDumpItem[] = JSON.parse(saved);
        return parsed.filter((d) => !d.id.startsWith('dump-'));
      }
      return initialBrainDump;
    } catch {
      return initialBrainDump;
    }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(`finance_os_${uid}_settings`);
      if (saved) return JSON.parse(saved);
      return {
        ...initialSettings,
        userName: user?.displayName || user?.email?.split('@')[0] || 'My Finances',
        userEmail: user?.email || '',
      };
    } catch {
      return initialSettings;
    }
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(`finance_os_${uid}_accounts`);
      if (saved) {
        const parsed: Account[] = JSON.parse(saved);
        return parsed.filter((a) => a.id !== 'tea_estate');
      }
      return initialAccounts;
    } catch {
      return initialAccounts;
    }
  });

  const [categories, setCategories] = useState<FinanceCategory[]>(() => {
    try {
      const saved = localStorage.getItem(`finance_os_${uid}_categories`);
      if (saved) return JSON.parse(saved);
      return initialCategories;
    } catch {
      return initialCategories;
    }
  });

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    try {
      const saved = localStorage.getItem(`finance_os_${uid}_wishlist`);
      if (saved) {
        const parsed: WishlistItem[] = JSON.parse(saved);
        return parsed.filter((w) => !w.id.startsWith('wish-'));
      }
      return initialWishlist;
    } catch {
      return initialWishlist;
    }
  });

  // Toast utility
  const addToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check connection on boot per skill instructions
  useEffect(() => {
    testConnection();
  }, []);

  // Format amount with privacy masking support
  const formatAmount = useCallback(
    (amount: number, options?: { showSign?: boolean; decimals?: number }): string => {
      if (isPrivacyMasked) return '••••••';
      const dec = options?.decimals ?? 2;
      const formatted = Math.abs(amount).toLocaleString(undefined, {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      });
      const sign = options?.showSign && amount > 0 ? '+' : amount < 0 ? '-' : '';
      return `${sign}${settings.currency}${formatted}`;
    },
    [isPrivacyMasked, settings.currency]
  );

  const isRemoteSyncAllowed = useCallback(() => {
    return Boolean(auth.currentUser && user && !user.uid.startsWith('guest-'));
  }, [user]);

  // Real-time Firestore synchronization scoped to the authenticated user ID
  const hasMigratedLocalRef = useRef(false);

  useEffect(() => {
    if (!isRemoteSyncAllowed() || !user) return;
    const currentUid = user.uid;

    // 1. Transactions listener
    const txColPath = `users/${currentUid}/transactions`;
    const unsubscribeTx = onSnapshot(
      collection(db, 'users', currentUid, 'transactions'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteTxs = snapshot.docs.map((docSnap) => docSnap.data() as Transaction);
          setTransactions(remoteTxs);
        } else if (!hasMigratedLocalRef.current && transactions.length > 0) {
          transactions.forEach((tx) => {
            setDoc(doc(db, 'users', currentUid, 'transactions', tx.id), tx).catch((err) =>
              console.warn('Firestore tx write warning:', err)
            );
          });
        }
      },
      (error) => {
        console.warn('Firestore tx subscription info:', error?.message || error);
      }
    );

    // 2. Accounts listener
    const accColPath = `users/${currentUid}/accounts`;
    const unsubscribeAcc = onSnapshot(
      collection(db, 'users', currentUid, 'accounts'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteAccs = snapshot.docs.map((docSnap) => docSnap.data() as Account);
          setAccounts(remoteAccs);
        } else if (!hasMigratedLocalRef.current && accounts.length > 0) {
          accounts.forEach((acc) => {
            setDoc(doc(db, 'users', currentUid, 'accounts', acc.id), acc).catch((err) =>
              console.warn('Firestore acc write warning:', err)
            );
          });
        }
      },
      (error) => {
        console.warn('Firestore acc subscription info:', error?.message || error);
      }
    );

    // 3. Wishlist listener
    const wishColPath = `users/${currentUid}/wishlist`;
    const unsubscribeWish = onSnapshot(
      collection(db, 'users', currentUid, 'wishlist'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteWish = snapshot.docs.map((docSnap) => docSnap.data() as WishlistItem);
          setWishlist(remoteWish);
        } else if (!hasMigratedLocalRef.current && wishlist.length > 0) {
          wishlist.forEach((item) => {
            setDoc(doc(db, 'users', currentUid, 'wishlist', item.id), item).catch((err) =>
              console.warn('Firestore wishlist write warning:', err)
            );
          });
        }
      },
      (error) => {
        console.warn('Firestore wishlist subscription info:', error?.message || error);
      }
    );

    // 4. User settings doc listener
    const settingsDocPath = `users/${currentUid}`;
    const unsubscribeSettings = onSnapshot(
      doc(db, 'users', currentUid),
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteSettings = docSnap.data() as UserSettings;
          setSettings((prev) => ({ ...prev, ...remoteSettings }));
        } else {
          setDoc(doc(db, 'users', currentUid), {
            ...settings,
            id: currentUid,
            email: user.email || settings.userEmail,
            name: user.displayName || settings.userName,
          }).catch((err) => console.warn('Firestore settings write warning:', err));
        }
      },
      (error) => {
        console.warn('Firestore settings subscription info:', error?.message || error);
      }
    );

    hasMigratedLocalRef.current = true;

    return () => {
      unsubscribeTx();
      unsubscribeAcc();
      unsubscribeWish();
      unsubscribeSettings();
    };
  }, [user, isRemoteSyncAllowed]);

  // Sync state changes to user-scoped localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`finance_os_${uid}_wishlist`, JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Storage sync failed for wishlist', e);
    }
  }, [wishlist, uid]);

  useEffect(() => {
    try {
      localStorage.setItem(`finance_os_${uid}_categories`, JSON.stringify(categories));
    } catch (e) {
      console.warn('Storage sync failed for categories', e);
    }
  }, [categories, uid]);

  useEffect(() => {
    try {
      localStorage.setItem(`finance_os_${uid}_tasks`, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Storage sync failed for tasks', e);
    }
  }, [tasks, uid]);

  useEffect(() => {
    try {
      localStorage.setItem(`finance_os_${uid}_habits`, JSON.stringify(habits));
    } catch (e) {
      console.warn('Storage sync failed for habits', e);
    }
  }, [habits, uid]);

  useEffect(() => {
    try {
      localStorage.setItem(`finance_os_${uid}_projects`, JSON.stringify(projects));
    } catch (e) {
      console.warn('Storage sync failed for projects', e);
    }
  }, [projects, uid]);

  useEffect(() => {
    try {
      localStorage.setItem(`finance_os_${uid}_transactions`, JSON.stringify(transactions));
    } catch (e) {
      console.warn('Storage sync failed for transactions', e);
    }
  }, [transactions, uid]);

  useEffect(() => {
    try {
      localStorage.setItem(`finance_os_${uid}_braindump`, JSON.stringify(brainDump));
    } catch (e) {
      console.warn('Storage sync failed for braindump', e);
    }
  }, [brainDump, uid]);

  useEffect(() => {
    try {
      localStorage.setItem(`finance_os_${uid}_settings`, JSON.stringify(settings));
    } catch (e) {
      console.warn('Storage sync failed for settings', e);
    }
  }, [settings, uid]);

  useEffect(() => {
    try {
      localStorage.setItem(`finance_os_${uid}_accounts`, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Storage sync failed for accounts', e);
    }
  }, [accounts, uid]);

  // Metrics
  const safeToSpend = useMemo(() => {
    return calculateSafeToSpend(
      transactions,
      settings.monthlyExpectedIncome,
      settings.monthlyFixedBills,
      settings.monthlyTargetSavings
    );
  }, [transactions, settings]);

  const pendingReimbursements = useMemo(() => {
    return calculatePendingReimbursements(transactions);
  }, [transactions]);

  const startingBalancesMap = useMemo(() => {
    const map: Record<string, number> = {};
    accounts.forEach((acc) => {
      if (acc.id === 'main' && settings.mainStartingBalance !== undefined) {
        map[acc.id] = settings.mainStartingBalance;
      } else if (acc.id === 'personal' && settings.personalStartingBalance !== undefined) {
        map[acc.id] = settings.personalStartingBalance;
      } else if (acc.id === 'savings' && settings.savingsStartingBalance !== undefined) {
        map[acc.id] = settings.savingsStartingBalance;
      } else {
        map[acc.id] = acc.startingBalance;
      }
    });
    return map;
  }, [accounts, settings.mainStartingBalance, settings.personalStartingBalance, settings.savingsStartingBalance]);

  const accountBalances = useMemo(() => {
    return calculateAccountBalances(transactions, startingBalancesMap);
  }, [transactions, startingBalancesMap]);

  // TASK ACTIONS
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);

    if (user && isRemoteSyncAllowed()) {
      const taskDocPath = `users/${user.uid}/tasks/${newTask.id}`;
      setDoc(doc(db, 'users', user.uid, 'tasks', newTask.id), {
        ...newTask,
        userId: user.uid,
      }).catch((err) => handleFirestoreError(err, OperationType.WRITE, taskDocPath));
    }

    addToast(`Task added: "${newTask.title}"`, 'success');
    return newTask;
  }, [addToast, user]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    if (user && isRemoteSyncAllowed()) {
      const taskDocPath = `users/${user.uid}/tasks/${id}`;
      updateDoc(doc(db, 'users', user.uid, 'tasks', id), updates).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, taskDocPath)
      );
    }
  }, [user]);

  const toggleTaskStatus = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextStatus: TaskStatus = t.status === 'done' ? 'todo' : 'done';
        if (nextStatus === 'done') {
          confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
          addToast(`Completed: ${t.title}`, 'success');
        }
        const updated = {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'done' ? new Date().toISOString() : undefined,
        };

        if (user && isRemoteSyncAllowed()) {
          const taskDocPath = `users/${user.uid}/tasks/${id}`;
          updateDoc(doc(db, 'users', user.uid, 'tasks', id), {
            status: nextStatus,
            completedAt: updated.completedAt || null,
          }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, taskDocPath));
        }

        return updated;
      })
    );
  }, [addToast, user]);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (user && isRemoteSyncAllowed()) {
      const taskDocPath = `users/${user.uid}/tasks/${id}`;
      deleteDoc(doc(db, 'users', user.uid, 'tasks', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, taskDocPath)
      );
    }
    addToast('Task deleted', 'info');
  }, [addToast, user]);

  const toggleFocusTop3 = useCallback((id: string) => {
    setTasks((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;
      const currentTop3Count = prev.filter((t) => t.isFocusTop3 && t.status !== 'done').length;
      if (!target.isFocusTop3 && currentTop3Count >= 3) {
        addToast("Top 3 Focus slots are full. Untick another to add this one.", 'warning');
        return prev;
      }
      const updatedList = prev.map((t) => (t.id === id ? { ...t, isFocusTop3: !t.isFocusTop3 } : t));

      if (user && isRemoteSyncAllowed()) {
        const taskDocPath = `users/${user.uid}/tasks/${id}`;
        updateDoc(doc(db, 'users', user.uid, 'tasks', id), {
          isFocusTop3: !target.isFocusTop3,
        }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, taskDocPath));
      }

      return updatedList;
    });
  }, [addToast, user]);

  // HABIT ACTIONS
  const addHabit = useCallback((habitData: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: `habit-${Date.now()}`,
      streak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    setHabits((prev) => [...prev, newHabit]);
    addToast(`Habit created: "${newHabit.title}"`, 'success');
  }, [addToast]);

  const toggleHabitToday = useCallback((id: string) => {
    const todayStr = getTodayDateString();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const isDone = h.completedDates.includes(todayStr);
        let updatedDates: string[];
        let newStreak = h.streak;

        if (isDone) {
          updatedDates = h.completedDates.filter((d) => d !== todayStr);
          newStreak = Math.max(0, h.streak - 1);
        } else {
          updatedDates = [...h.completedDates, todayStr];
          newStreak = h.streak + 1;
          confetti({ particleCount: 20, spread: 40, origin: { y: 0.85 } });
          addToast(`Habit checked! ${h.title} (Streak: ${newStreak}d)`, 'success');
        }

        return {
          ...h,
          completedDates: updatedDates,
          streak: newStreak,
        };
      })
    );
  }, [addToast]);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    addToast('Habit removed', 'info');
  }, [addToast]);

  // PROJECT ACTIONS
  const addProject = useCallback((projData: Omit<PlanProject, 'id' | 'createdAt'>): PlanProject => {
    const newProj: PlanProject = {
      ...projData,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [newProj, ...prev]);

    if (user && isRemoteSyncAllowed()) {
      const projDocPath = `users/${user.uid}/projects/${newProj.id}`;
      setDoc(doc(db, 'users', user.uid, 'projects', newProj.id), {
        ...newProj,
        userId: user.uid,
      }).catch((err) => handleFirestoreError(err, OperationType.WRITE, projDocPath));
    }

    addToast(`Roadmap project added: "${newProj.title}"`, 'success');
    return newProj;
  }, [addToast, user]);

  const updateProject = useCallback((id: string, updates: Partial<PlanProject>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    if (user && isRemoteSyncAllowed()) {
      const projDocPath = `users/${user.uid}/projects/${id}`;
      updateDoc(doc(db, 'users', user.uid, 'projects', id), updates).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, projDocPath)
      );
    }
  }, [user]);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (user && isRemoteSyncAllowed()) {
      const projDocPath = `users/${user.uid}/projects/${id}`;
      deleteDoc(doc(db, 'users', user.uid, 'projects', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, projDocPath)
      );
    }
    addToast('Project removed', 'info');
  }, [addToast, user]);

  const toggleMilestone = useCallback((projectId: string, milestoneId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const updatedMilestones = p.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const completedCount = updatedMilestones.filter((m) => m.completed).length;
        const total = updatedMilestones.length;
        const newProgress = total > 0 ? Math.round((completedCount / total) * 100) : p.progress;

        if (updatedMilestones.find((m) => m.id === milestoneId)?.completed) {
          confetti({ particleCount: 40, spread: 60 });
          addToast('Milestone achieved!', 'success');
        }

        const updatedProj = {
          ...p,
          milestones: updatedMilestones,
          progress: newProgress,
          status: newProgress === 100 ? ('shipped' as const) : p.status,
        };

        if (user && isRemoteSyncAllowed()) {
          const projDocPath = `users/${user.uid}/projects/${projectId}`;
          updateDoc(doc(db, 'users', user.uid, 'projects', projectId), {
            milestones: updatedMilestones,
            progress: newProgress,
            status: updatedProj.status,
          }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, projDocPath));
        }

        return updatedProj;
      })
    );
  }, [addToast, user]);

  const addMilestone = useCallback((projectId: string, title: string, targetDate?: string) => {
    const newMilestone: Milestone = {
      id: `m-${Date.now()}`,
      title,
      completed: false,
      targetDate,
    };
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const updated = [...p.milestones, newMilestone];
        const completedCount = updated.filter((m) => m.completed).length;
        const newProgress = Math.round((completedCount / updated.length) * 100);

        if (user && isRemoteSyncAllowed()) {
          const projDocPath = `users/${user.uid}/projects/${projectId}`;
          updateDoc(doc(db, 'users', user.uid, 'projects', projectId), {
            milestones: updated,
            progress: newProgress,
          }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, projDocPath));
        }

        return {
          ...p,
          milestones: updated,
          progress: newProgress,
        };
      })
    );
    addToast(`Milestone added to project`, 'success');
  }, [addToast, user]);

  const deleteMilestone = useCallback((projectId: string, milestoneId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const updated = p.milestones.filter((m) => m.id !== milestoneId);
        const completedCount = updated.filter((m) => m.completed).length;
        const newProgress = updated.length > 0 ? Math.round((completedCount / updated.length) * 100) : 0;

        if (user && isRemoteSyncAllowed()) {
          const projDocPath = `users/${user.uid}/projects/${projectId}`;
          updateDoc(doc(db, 'users', user.uid, 'projects', projectId), {
            milestones: updated,
            progress: newProgress,
          }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, projDocPath));
        }

        return {
          ...p,
          milestones: updated,
          progress: newProgress,
        };
      })
    );
  }, [user]);

  // FINANCE ACTIONS
  const addTransaction = useCallback((txData: Omit<Transaction, 'id'>): Transaction => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    if (user && isRemoteSyncAllowed()) {
      const txDocPath = `users/${user.uid}/transactions/${newTx.id}`;
      setDoc(doc(db, 'users', user.uid, 'transactions', newTx.id), {
        ...newTx,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      }).catch((err) => handleFirestoreError(err, OperationType.WRITE, txDocPath));
    }

    addToast(
      `${newTx.type === 'income' ? 'Income' : 'Expense'} recorded: ${settings.currency}${newTx.amount.toFixed(2)} (${newTx.category})`,
      'success'
    );
    return newTx;
  }, [addToast, settings.currency, user]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    if (user && isRemoteSyncAllowed()) {
      const txDocPath = `users/${user.uid}/transactions/${id}`;
      updateDoc(doc(db, 'users', user.uid, 'transactions', id), updates).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, txDocPath)
      );
    }
  }, [user]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (user && isRemoteSyncAllowed()) {
      const txDocPath = `users/${user.uid}/transactions/${id}`;
      deleteDoc(doc(db, 'users', user.uid, 'transactions', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, txDocPath)
      );
    }
    addToast('Transaction removed', 'info');
  }, [addToast, user]);

  const toggleReimbursementStatus = useCallback((id: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextStatus = t.reimbursementStatus === 'pending' ? 'settled' : 'pending';
        addToast(`Reimbursement marked as ${nextStatus}`, 'success');

        if (user && isRemoteSyncAllowed()) {
          const txDocPath = `users/${user.uid}/transactions/${id}`;
          updateDoc(doc(db, 'users', user.uid, 'transactions', id), {
            reimbursementStatus: nextStatus,
          }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, txDocPath));
        }

        return { ...t, reimbursementStatus: nextStatus };
      })
    );
  }, [addToast, user]);

  const transferFunds = useCallback(
    ({
      fromAccount,
      toAccount,
      amount,
      note,
      date,
    }: {
      fromAccount: string;
      toAccount: string;
      amount: number;
      note?: string;
      date?: string;
    }): Transaction => {
      const fromObj = accounts.find((a) => a.id === fromAccount);
      const toObj = accounts.find((a) => a.id === toAccount);
      const fromName = fromObj ? fromObj.name : fromAccount;
      const toName = toObj ? toObj.name : toAccount;

      const newTx: Transaction = {
        id: `tx-xfer-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        amount,
        type: 'transfer',
        category: 'Transfer',
        date: date || getTodayDateString(),
        account: fromAccount as any,
        toAccount: toAccount as any,
        note: note?.trim() || `Transfer: ${fromName} ➔ ${toName}`,
      };
      setTransactions((prev) => [newTx, ...prev]);

      if (user && isRemoteSyncAllowed()) {
        const txDocPath = `users/${user.uid}/transactions/${newTx.id}`;
        setDoc(doc(db, 'users', user.uid, 'transactions', newTx.id), {
          ...newTx,
          userId: user.uid,
          createdAt: new Date().toISOString(),
        }).catch((err) => handleFirestoreError(err, OperationType.WRITE, txDocPath));
      }

      addToast(
        `Transferred ${settings.currency}${amount.toFixed(2)} from ${fromName} to ${toName}`,
        'success'
      );
      return newTx;
    },
    [accounts, addToast, settings.currency, user]
  );

  // ACCOUNT MANAGEMENT ACTIONS
  const addAccount = useCallback((accountData: Omit<Account, 'id'>): Account => {
    const rawId = accountData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const uniqueId = rawId && !accounts.some((a) => a.id === rawId) ? rawId : `acc_${Date.now()}`;
    const newAccount: Account = {
      ...accountData,
      id: uniqueId,
      isTransferrable: accountData.isTransferrable ?? true,
    };
    setAccounts((prev) => [...prev, newAccount]);

    if (user && isRemoteSyncAllowed()) {
      const accDocPath = `users/${user.uid}/accounts/${newAccount.id}`;
      setDoc(doc(db, 'users', user.uid, 'accounts', newAccount.id), {
        ...newAccount,
        userId: user.uid,
      }).catch((err) => handleFirestoreError(err, OperationType.WRITE, accDocPath));
    }

    addToast(`Account created: "${newAccount.name}"`, 'success');
    return newAccount;
  }, [accounts, addToast, user]);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
    if (updates.startingBalance !== undefined) {
      if (id === 'main') setSettings((s) => ({ ...s, mainStartingBalance: updates.startingBalance }));
      if (id === 'personal') setSettings((s) => ({ ...s, personalStartingBalance: updates.startingBalance }));
      if (id === 'savings') setSettings((s) => ({ ...s, savingsStartingBalance: updates.startingBalance }));
    }

    if (user && isRemoteSyncAllowed()) {
      const accDocPath = `users/${user.uid}/accounts/${id}`;
      updateDoc(doc(db, 'users', user.uid, 'accounts', id), updates).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, accDocPath)
      );
    }

    addToast('Account configuration updated', 'success');
  }, [addToast, user]);

  const deleteAccount = useCallback((id: string) => {
    const target = accounts.find((a) => a.id === id);
    if (target?.isDefault) {
      addToast('Core accounts cannot be deleted, but you can customize their names and balances in Settings.', 'warning');
      return;
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));

    if (user && isRemoteSyncAllowed()) {
      const accDocPath = `users/${user.uid}/accounts/${id}`;
      deleteDoc(doc(db, 'users', user.uid, 'accounts', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, accDocPath)
      );
    }

    addToast(`Account "${target?.name || id}" deleted`, 'info');
  }, [accounts, addToast, user]);

  const resetAccountsToDefault = useCallback(() => {
    setAccounts(initialAccounts);
    if (user && isRemoteSyncAllowed()) {
      initialAccounts.forEach((acc) => {
        setDoc(doc(db, 'users', user.uid, 'accounts', acc.id), {
          ...acc,
          userId: user.uid,
        }).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/accounts/${acc.id}`)
        );
      });
    }
    addToast('Reset accounts to default setup (Main, Personal, Savings)', 'info');
  }, [addToast, user]);

  // CATEGORY ACTIONS
  const addCategory = useCallback((catData: Omit<FinanceCategory, 'id'>): FinanceCategory => {
    const newCat: FinanceCategory = {
      ...catData,
      id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: catData.name.trim(),
      monthlyBudget: Number(catData.monthlyBudget) || 0,
      scope: catData.scope || 'personal',
    };
    setCategories((prev) => [...prev, newCat]);
    addToast(`Category created: "${newCat.name}"`, 'success');
    return newCat;
  }, [addToast]);

  const updateCategory = useCallback(
    (id: string, updates: Partial<FinanceCategory>, renameTransactions = true) => {
      let oldName = '';
      let newName = updates.name !== undefined ? updates.name.trim() : undefined;

      setCategories((prev) =>
        prev.map((cat) => {
          if (cat.id === id) {
            oldName = cat.name;
            return {
              ...cat,
              ...updates,
              name: newName !== undefined && newName !== '' ? newName : cat.name,
              monthlyBudget: updates.monthlyBudget !== undefined ? Number(updates.monthlyBudget) || 0 : cat.monthlyBudget,
            };
          }
          return cat;
        })
      );

      if (renameTransactions && oldName && newName && oldName !== newName) {
        setTransactions((prev) =>
          prev.map((tx) => (tx.category === oldName ? { ...tx, category: newName! } : tx))
        );
        addToast(`Updated category "${oldName}" to "${newName}" and synced all transactions`, 'success');
      } else {
        addToast('Category updated', 'success');
      }
    },
    [addToast]
  );

  const deleteCategory = useCallback(
    (id: string, reassignToCategory = 'Other') => {
      const target = categories.find((c) => c.id === id);
      if (!target) return;
      if (categories.length <= 1) {
        addToast('Cannot delete the last category', 'warning');
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
      setTransactions((prev) =>
        prev.map((tx) => (tx.category === target.name ? { ...tx, category: reassignToCategory } : tx))
      );
      addToast(`Category "${target.name}" deleted (expenses reassigned to "${reassignToCategory}")`, 'info');
    },
    [categories, addToast]
  );

  const resetCategoriesToDefault = useCallback(() => {
    setCategories(initialCategories);
    addToast('Reset categories and budget limits to default setup', 'info');
  }, [addToast]);

  // WISHLIST ACTIONS
  const addWishlistItem = useCallback(
    (itemData: Omit<WishlistItem, 'id' | 'createdAt'>): WishlistItem => {
      const priceNum = Number(itemData.price) || 0;
      const savedNum = Number(itemData.savedAmount) || 0;
      const newItem: WishlistItem = {
        ...itemData,
        id: `wish-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        price: priceNum,
        savedAmount: savedNum,
        status: itemData.status || (savedNum >= priceNum && priceNum > 0 ? 'ready' : 'saving'),
        createdAt: getTodayDateString(),
      };
      setWishlist((prev) => [newItem, ...prev]);

      if (user && isRemoteSyncAllowed()) {
        const wishDocPath = `users/${user.uid}/wishlist/${newItem.id}`;
        setDoc(doc(db, 'users', user.uid, 'wishlist', newItem.id), {
          ...newItem,
          userId: user.uid,
        }).catch((err) => handleFirestoreError(err, OperationType.WRITE, wishDocPath));
      }

      addToast(`Added "${newItem.title}" to wishlist!`, 'success');
      return newItem;
    },
    [addToast, user]
  );

  const updateWishlistItem = useCallback(
    (id: string, updates: Partial<WishlistItem>) => {
      let finalUpdates: Partial<WishlistItem> = { ...updates };
      setWishlist((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updated: WishlistItem = { ...item, ...updates };
            if (updates.savedAmount !== undefined || updates.price !== undefined) {
              const p = updates.price !== undefined ? Number(updates.price) : item.price;
              const s = updates.savedAmount !== undefined ? Number(updates.savedAmount) : item.savedAmount;
              if (item.status !== 'purchased') {
                updated.status = (s >= p && p > 0 ? 'ready' : 'saving') as WishlistStatus;
              }
            }
            finalUpdates = updated;
            return updated;
          }
          return item;
        })
      );

      if (user && isRemoteSyncAllowed()) {
        const wishDocPath = `users/${user.uid}/wishlist/${id}`;
        updateDoc(doc(db, 'users', user.uid, 'wishlist', id), finalUpdates).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, wishDocPath)
        );
      }

      addToast('Wishlist item updated', 'info');
    },
    [addToast, user]
  );

  const deleteWishlistItem = useCallback(
    (id: string) => {
      setWishlist((prev) => prev.filter((i) => i.id !== id));
      if (user && isRemoteSyncAllowed()) {
        const wishDocPath = `users/${user.uid}/wishlist/${id}`;
        deleteDoc(doc(db, 'users', user.uid, 'wishlist', id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, wishDocPath)
        );
      }
      addToast('Wishlist item removed', 'info');
    },
    [addToast, user]
  );

  const allocateWishlistFunds = useCallback(
    (id: string, additionalAmount: number) => {
      let updatedObj: WishlistItem | undefined;
      setWishlist((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const newSaved = Math.max(0, item.savedAmount + additionalAmount);
            const isReady = newSaved >= item.price && item.status !== 'purchased';
            const nextStatus: WishlistStatus = item.status === 'purchased' ? 'purchased' : isReady ? 'ready' : 'saving';
            const updated: WishlistItem = {
              ...item,
              savedAmount: newSaved,
              status: nextStatus,
            };
            updatedObj = updated;
            return updated;
          }
          return item;
        })
      );

      if (user && updatedObj) {
        const wishDocPath = `users/${user.uid}/wishlist/${id}`;
        updateDoc(doc(db, 'users', user.uid, 'wishlist', id), {
          savedAmount: updatedObj.savedAmount,
          status: updatedObj.status,
        }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, wishDocPath));
      }

      addToast(`Allocated funds to wishlist item`, 'success');
    },
    [addToast, user]
  );

  const markWishlistAsPurchased = useCallback(
    (id: string, logAsExpense: boolean, account = 'personal') => {
      const item = wishlist.find((i) => i.id === id);
      if (!item) return;

      let createdTxId: string | undefined;

      if (logAsExpense) {
        const tx = addTransaction({
          amount: item.price,
          type: 'expense',
          category: 'General',
          account: (account || item.targetAccount || 'personal') as any,
          note: `Purchased: ${item.title}`,
          date: getTodayDateString(),
        });
        createdTxId = tx.id;
      }

      setWishlist((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                status: 'purchased',
                purchasedDate: getTodayDateString(),
                purchasedTxId: createdTxId,
                savedAmount: i.price,
              }
            : i
        )
      );

      if (user && isRemoteSyncAllowed()) {
        const wishDocPath = `users/${user.uid}/wishlist/${id}`;
        updateDoc(doc(db, 'users', user.uid, 'wishlist', id), {
          status: 'purchased',
          purchasedDate: getTodayDateString(),
          purchasedTxId: createdTxId || null,
          savedAmount: item.price,
        }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, wishDocPath));
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      addToast(
        logAsExpense
          ? `Purchased "${item.title}" & logged expense of ${settings.currency}${item.price.toFixed(2)}!`
          : `Marked "${item.title}" as purchased!`,
        'success'
      );
    },
    [wishlist, addTransaction, settings.currency, addToast, user]
  );

  // BRAIN DUMP ACTIONS
  const addBrainDump = useCallback((content: string, category = 'Quick Note') => {
    const newItem: BrainDumpItem = {
      id: `dump-${Date.now()}`,
      content,
      category,
      createdAt: getTodayDateString(),
      isPinned: false,
    };
    setBrainDump((prev) => [newItem, ...prev]);

    if (user && isRemoteSyncAllowed()) {
      const dumpDocPath = `users/${user.uid}/braindump/${newItem.id}`;
      setDoc(doc(db, 'users', user.uid, 'braindump', newItem.id), {
        ...newItem,
        userId: user.uid,
      }).catch((err) => handleFirestoreError(err, OperationType.WRITE, dumpDocPath));
    }

    addToast('Saved to Someday / Brain Dump', 'success');
  }, [addToast, user]);

  const updateBrainDump = useCallback((id: string, content: string, category?: string) => {
    setBrainDump((prev) =>
      prev.map((item) => (item.id === id ? { ...item, content, category: category || item.category } : item))
    );

    if (user && isRemoteSyncAllowed()) {
      const dumpDocPath = `users/${user.uid}/braindump/${id}`;
      updateDoc(doc(db, 'users', user.uid, 'braindump', id), {
        content,
        category: category || null,
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, dumpDocPath));
    }
  }, [user]);

  const deleteBrainDump = useCallback((id: string) => {
    setBrainDump((prev) => prev.filter((item) => item.id !== id));

    if (user && isRemoteSyncAllowed()) {
      const dumpDocPath = `users/${user.uid}/braindump/${id}`;
      deleteDoc(doc(db, 'users', user.uid, 'braindump', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, dumpDocPath)
      );
    }

    addToast('Note deleted', 'info');
  }, [addToast, user]);

  const convertBrainDumpToTask = useCallback((id: string) => {
    const item = brainDump.find((d) => d.id === id);
    if (!item) return;
    addTask({
      title: item.content.slice(0, 80),
      status: 'todo',
      priority: 'med',
      category: 'personal',
      dueDate: getTodayDateString(),
      notes: item.content,
      isFocusTop3: false,
    });
    deleteBrainDump(id);
    addToast('Converted scratchpad item to Task!', 'success');
  }, [brainDump, addTask, deleteBrainDump, addToast]);

  const convertBrainDumpToProject = useCallback((id: string) => {
    const item = brainDump.find((d) => d.id === id);
    if (!item) return;
    addProject({
      title: item.content.slice(0, 60),
      horizon: 'short-term',
      status: 'idea',
      targetDate: getTodayDateString(60),
      progress: 0,
      budget: 200,
      category: item.category || 'General',
      notes: item.content,
      milestones: [
        { id: `m-${Date.now()}`, title: 'Initial concept & requirements', completed: false },
      ],
    });
    deleteBrainDump(id);
    addToast('Converted scratchpad note to Roadmap Project!', 'success');
  }, [brainDump, addProject, deleteBrainDump, addToast]);

  // SETTINGS
  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (user && isRemoteSyncAllowed()) {
        const settingsDocPath = `users/${user.uid}`;
        setDoc(doc(db, 'users', user.uid), {
          ...updated,
          id: user.uid,
          updatedAt: new Date().toISOString(),
        }, { merge: true }).catch((err) => handleFirestoreError(err, OperationType.WRITE, settingsDocPath));
      }
      return updated;
    });
    addToast('Settings updated', 'success');
  }, [addToast, user]);

  // GLOBAL QUICK CAPTURE
  const executeQuickCaptureText = useCallback((text: string): boolean => {
    const parsed = parseQuickCapture(text);
    if (parsed.kind === 'unknown' || !text.trim()) {
      addToast('Please type a task, expense (e.g. $25 Lunch), plan, or note.', 'warning');
      return false;
    }

    if (parsed.kind === 'task' && parsed.task) {
      addTask({
        title: parsed.task.title,
        status: 'todo',
        priority: parsed.task.priority,
        category: parsed.task.category,
        dueDate: parsed.task.dueDate,
        isFocusTop3: parsed.task.isFocusTop3,
      });
      return true;
    }

    if ((parsed.kind === 'expense' || parsed.kind === 'income') && parsed.transaction) {
      let matchedProjectId: string | undefined;
      if (parsed.transaction.projectName) {
        const query = parsed.transaction.projectName.toLowerCase();
        const found = projects.find(
          (p) => p.title.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)
        );
        if (found) {
          matchedProjectId = found.id;
        }
      }

      addTransaction({
        amount: parsed.transaction.amount,
        type: parsed.transaction.type,
        category: parsed.transaction.category,
        account: parsed.transaction.account,
        note: parsed.transaction.note,
        date: parsed.transaction.date,
        projectId: matchedProjectId,
        isReimbursable: parsed.transaction.isReimbursable,
        reimbursementStatus: parsed.transaction.isReimbursable ? 'pending' : undefined,
      });
      return true;
    }

    if (parsed.kind === 'plan' && parsed.plan) {
      addProject({
        title: parsed.plan.title,
        horizon: parsed.plan.horizon,
        status: 'idea',
        targetDate: parsed.plan.targetDate,
        budget: parsed.plan.budget || 300,
        category: parsed.plan.category,
        progress: 0,
        notes: '',
        milestones: [
          { id: `m-${Date.now()}`, title: 'Kickoff and initial planning', completed: false },
        ],
      });
      return true;
    }

    if (parsed.kind === 'note' && parsed.note) {
      addBrainDump(parsed.note.content, parsed.note.category);
      return true;
    }

    return false;
  }, [addTask, addTransaction, addProject, addBrainDump, projects, addToast]);

  // SMART DAILY RESET ("START MY DAY")
  const startMyDay = useCallback(() => {
    const todayStr = getTodayDateString();
    const result = performDailyRollover(tasks, habits, todayStr, true);

    setTasks(result.updatedTasks);
    setHabits(result.updatedHabits);
    updateSettings({ lastRolloverDate: todayStr });

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });

    if (result.rolledOverCount > 0) {
      addToast(
        `Start My Day complete! Pulled ${result.rolledOverCount} unfinished tasks into Today's list. Let's conquer the day!`,
        'success'
      );
    } else {
      addToast(`Ready for action! All tasks are current for today. Let's make it count!`, 'success');
    }

    return {
      rolledOverCount: result.rolledOverCount,
      clearedClutterCount: result.clearedDoneCount,
    };
  }, [tasks, habits, addToast, updateSettings]);

  // BACKUP & RESTORE
  const exportDataJSON = useCallback(() => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: settings.userEmail,
      tasks,
      habits,
      projects,
      transactions,
      brainDump,
      settings,
      accounts,
      categories,
      wishlist,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `life-os-backup-${getTodayDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Downloaded complete JSON Life OS backup!', 'success');
  }, [tasks, habits, projects, transactions, brainDump, settings, accounts, categories, wishlist, addToast]);

  const exportDataCSV = useCallback((type: 'tasks' | 'finances' | 'projects') => {
    let csvContent = '';
    let fileName = '';

    if (type === 'tasks') {
      csvContent = 'Title,Status,Priority,Category,DueDate,IsTop3\n';
      tasks.forEach((t) => {
        csvContent += `"${t.title.replace(/"/g, '""')}",${t.status},${t.priority},${t.category},${t.dueDate},${t.isFocusTop3 ? 'yes' : 'no'}\n`;
      });
      fileName = `life-os-tasks-${getTodayDateString()}.csv`;
    } else if (type === 'finances') {
      csvContent = 'Date,Type,Amount,Category,Account,Note,ProjectId,IsReimbursable\n';
      transactions.forEach((tx) => {
        csvContent += `${tx.date},${tx.type},${tx.amount},"${tx.category}","${tx.account}","${tx.note.replace(/"/g, '""')}","${tx.projectId || ''}",${tx.isReimbursable ? 'yes' : 'no'}\n`;
      });
      fileName = `life-os-finances-${getTodayDateString()}.csv`;
    } else if (type === 'projects') {
      csvContent = 'Title,Status,Horizon,ProgressPercent,Budget,MilestonesCount\n';
      projects.forEach((p) => {
        csvContent += `"${p.title.replace(/"/g, '""')}",${p.status},${p.horizon},${p.progress},${p.budget || 0},${p.milestones.length}\n`;
      });
      fileName = `life-os-projects-${getTodayDateString()}.csv`;
    }

    const dataStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast(`Exported ${type} to CSV`, 'success');
  }, [tasks, transactions, projects, addToast]);

  const importDataJSON = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.tasks && Array.isArray(data.tasks)) setTasks(data.tasks);
      if (data.habits && Array.isArray(data.habits)) setHabits(data.habits);
      if (data.projects && Array.isArray(data.projects)) setProjects(data.projects);
      if (data.transactions && Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (data.brainDump && Array.isArray(data.brainDump)) setBrainDump(data.brainDump);
      if (data.settings && typeof data.settings === 'object') setSettings(data.settings);
      if (data.accounts && Array.isArray(data.accounts)) setAccounts(data.accounts);
      if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
      if (data.wishlist && Array.isArray(data.wishlist)) setWishlist(data.wishlist);
      addToast('Backup restored successfully!', 'success');
      return true;
    } catch (e) {
      console.error(e);
      addToast('Failed to parse backup file. Invalid JSON format.', 'error');
      return false;
    }
  }, [addToast]);

  const resetAllData = useCallback(() => {
    setTasks([]);
    setHabits([]);
    setProjects([]);
    setTransactions([]);
    setBrainDump([]);
    setWishlist([]);
    setAccounts(initialAccounts);
    setCategories(initialCategories);
    setSettings({
      ...initialSettings,
      userName: user?.displayName || user?.email?.split('@')[0] || 'My Finances',
      userEmail: user?.email || '',
    });
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('finance_os_') || key.startsWith('genuka_') || key.startsWith('pocketline_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('LocalStorage reset warning:', e);
    }
    addToast('Data reset to a clean slate', 'info');
  }, [addToast, user]);

  return (
    <LifeOSContext.Provider
      value={{
        activeTab,
        setActiveTab,
        tasks,
        habits,
        projects,
        transactions,
        brainDump,
        settings,
        accounts,
        addAccount,
        updateAccount,
        deleteAccount,
        resetAccountsToDefault,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        resetCategoriesToDefault,
        wishlist,
        addWishlistItem,
        updateWishlistItem,
        deleteWishlistItem,
        allocateWishlistFunds,
        markWishlistAsPurchased,
        toasts,
        addToast,
        removeToast,
        currentUser: user,
        isAuthLoading,
        signInWithGoogle,
        signOutUser,
        isPrivacyMasked,
        togglePrivacyMask,
        formatAmount,
        addTask,
        updateTask,
        toggleTaskStatus,
        deleteTask,
        toggleFocusTop3,
        addHabit,
        toggleHabitToday,
        deleteHabit,
        addProject,
        updateProject,
        deleteProject,
        toggleMilestone,
        addMilestone,
        deleteMilestone,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        toggleReimbursementStatus,
        transferFunds,
        accountBalances,
        addBrainDump,
        updateBrainDump,
        deleteBrainDump,
        convertBrainDumpToTask,
        convertBrainDumpToProject,
        updateSettings,
        executeQuickCaptureText,
        startMyDay,
        safeToSpend,
        pendingReimbursements,
        exportDataJSON,
        exportDataCSV,
        importDataJSON,
        resetAllData,
      }}
    >
      {children}
    </LifeOSContext.Provider>
  );
};

export const useLifeOS = () => {
  const context = useContext(LifeOSContext);
  if (!context) {
    throw new Error('useLifeOS must be used within a LifeOSProvider');
  }
  return context;
};
