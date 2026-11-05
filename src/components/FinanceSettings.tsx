import React, { useState } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { useAuth } from '../context/AuthContext';
import { Account } from '../types';
import {
  FileSpreadsheet,
  Download,
  RotateCcw,
  Sliders,
  CheckCircle,
  HelpCircle,
  Building2,
  User,
  PiggyBank,
  Leaf,
  Briefcase,
  Wallet,
  Landmark,
  Truck,
  Plus,
  Edit2,
  Trash2,
  ArrowRightLeft,
  X,
  Check,
  ShieldCheck,
  Lock,
  LogOut,
  Eye,
  EyeOff,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

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

export const FinanceSettings: React.FC = () => {
  const { user, signOut } = useAuth();
  const {
    settings,
    updateSettings,
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    resetAccountsToDefault,
    exportDataCSV,
    exportDataJSON,
    resetAllData,
    isPrivacyMasked,
    togglePrivacyMask,
  } = useLifeOS();

  // General preferences state
  const [currency, setCurrency] = useState(settings.currency);
  const [userName, setUserName] = useState(settings.userName);
  const [userEmail, setUserEmail] = useState(settings.userEmail);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isConfirmingAccountReset, setIsConfirmingAccountReset] = useState(false);

  // Account editing modal / dialog state
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  // Form state for add / edit account
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<Account['type']>('custom');
  const [accIcon, setAccIcon] = useState('building');
  const [accDesc, setAccDesc] = useState('');
  const [accStartingBalance, setAccStartingBalance] = useState('500');
  const [accIsTransferrable, setAccIsTransferrable] = useState(true);

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingAccount(null);
        setIsAddAccountOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleOpenEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setAccName(acc.name);
    setAccType(acc.type);
    setAccIcon(acc.icon || 'building');
    setAccDesc(acc.description);
    setAccStartingBalance(acc.startingBalance.toString());
    setAccIsTransferrable(acc.isTransferrable ?? true);
  };

  const handleOpenAddAccount = () => {
    setIsAddAccountOpen(true);
    setAccName('');
    setAccType('custom');
    setAccIcon('building');
    setAccDesc('');
    setAccStartingBalance('500');
    setAccIsTransferrable(true);
  };

  const handleSaveAccountEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;

    if (editingAccount) {
      updateAccount(editingAccount.id, {
        name: accName.trim(),
        type: accType,
        icon: accIcon,
        description: accDesc.trim(),
        startingBalance: parseFloat(accStartingBalance) || 0,
        isTransferrable: accIsTransferrable,
      });
      setEditingAccount(null);
    } else if (isAddAccountOpen) {
      addAccount({
        name: accName.trim(),
        type: accType,
        icon: accIcon,
        description: accDesc.trim(),
        startingBalance: parseFloat(accStartingBalance) || 0,
        isTransferrable: accIsTransferrable,
        color:
          accType === 'savings'
            ? '#f59e0b'
            : accType === 'personal'
            ? '#6366f1'
            : '#3b82f6',
      });
      setIsAddAccountOpen(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      currency: currency.trim() || '$',
      userName: userName.trim() || 'User',
      userEmail: userEmail.trim() || '',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150 pb-16">
      {/* Header */}
      <div>
        <span className="label-mono block mb-1 text-slate-400">Configuration & Ledger Settings</span>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Accounts & Settings
        </h1>
      </div>

      {/* USER AUTHENTICATION & MULTI-USER PRIVACY */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h2 className="font-heading text-lg font-bold text-white">
                User Authentication & Privacy
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Your financial ledger is private and protected by Google Authentication with zero-trust Firestore security rules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePrivacyMask}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                isPrivacyMasked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {isPrivacyMasked ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isPrivacyMasked ? 'Masking Active (••••••)' : 'Mask Balances'}</span>
            </button>

            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-10 h-10 rounded-full object-cover border border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-sm flex items-center justify-center font-mono">
                {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">
                  {user?.displayName || 'Finance User'}
                </span>
                <span className="text-[0.62rem] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active Session
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                {user?.email || 'Logged In'}
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-500 space-y-1 sm:text-right">
            <div>
              <span className="text-slate-400">UID: </span>
              <span className="text-slate-300">{user?.uid ? `${user.uid.slice(0, 12)}...` : 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400">Project: </span>
              <span className="text-slate-300 font-mono">{firebaseConfig.projectId}</span>
            </div>
          </div>
        </div>

        {/* Multi-user note */}
        <div className="flex items-start gap-3 p-3.5 bg-blue-950/30 border border-blue-900/40 rounded-xl text-xs text-blue-300/90">
          <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-blue-200">Multi-User Ready:</strong> Each user has an isolated workspace with dedicated collections (<code className="text-blue-300 font-mono">/users/{'{userId}'}/*</code>). When other users sign in with their own Google accounts, they will see only their own accounts, wishlist, and transactions.
          </p>
        </div>
      </div>

      {/* SECTION 1: TRANSFERRABLE ACCOUNTS & BUSINESS MANAGEMENT */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ArrowRightLeft className="w-4 h-4" />
              </span>
              <h2 className="font-heading text-lg font-bold text-white">
                Transferrable Accounts & Stashes
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configure your Main account, Personal account, Savings stash, and custom transfer destinations.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenAddAccount}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Account</span>
            </button>

            {isConfirmingAccountReset ? (
              <div className="flex items-center gap-1.5 bg-rose-950/70 border border-rose-800 px-2 py-1 rounded-lg text-xs font-mono">
                <span className="text-rose-200">Reset default accounts?</span>
                <button
                  type="button"
                  onClick={() => {
                    resetAccountsToDefault();
                    setIsConfirmingAccountReset(false);
                  }}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded cursor-pointer font-bold"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingAccountReset(false)}
                  className="text-slate-400 hover:text-white px-1 cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingAccountReset(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
                title="Reset to default Main, Personal, and Savings accounts"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            )}
          </div>
        </div>

        {/* Accounts Grid / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => {
            const IconComp = ICON_MAP[acc.icon] || Building2;

            return (
              <div
                key={acc.id}
                className="p-4 rounded-xl border transition-all bg-slate-950/60 border-slate-800/90 hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`p-2 rounded-lg border ${
                        acc.type === 'main'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : acc.type === 'personal'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-white text-sm">
                          {acc.name}
                        </h3>
                        {acc.isDefault && (
                          <span className="text-[0.62rem] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            Core
                          </span>
                        )}
                      </div>
                      <span className="text-[0.7rem] font-mono text-slate-400 uppercase tracking-wider block">
                        Role: {acc.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditAccount(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Account Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!acc.isDefault && (
                      <button
                        type="button"
                        onClick={() => deleteAccount(acc.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Custom Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-3 min-h-[32px]">
                  {acc.description || 'No description configured.'}
                </p>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[0.65rem] uppercase">Starting Balance</span>
                    <span className="text-slate-200 font-bold">
                      {currency}{acc.startingBalance.toFixed(2)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 block text-[0.65rem] uppercase">Transfers</span>
                    <button
                      type="button"
                      onClick={() => updateAccount(acc.id, { isTransferrable: !acc.isTransferrable })}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.68rem] font-mono transition-colors cursor-pointer ${
                        acc.isTransferrable
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
                      }`}
                      title="Click to toggle whether this account is eligible for transfers"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${acc.isTransferrable ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      <span>{acc.isTransferrable ? 'Transferrable' : 'Locked'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: PREFERENCES & CURRENCY */}
      <form
        onSubmit={handleSavePreferences}
        className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl space-y-6 shadow-sm"
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-white">General Preferences & Currency</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure your profile name, account email, and preferred regional currency symbol.
            </p>
          </div>

          {savedSuccess && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle className="w-3.5 h-3.5" />
              Settings Updated!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="label-mono block mb-1.5 text-slate-300">User Display Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Genuka"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-3 py-2.5 rounded-lg text-sm text-slate-100 font-mono outline-none"
            />
            <span className="text-[0.68rem] text-slate-500 mt-1 block">Displayed on header & greeting</span>
          </div>

          <div>
            <label className="label-mono block mb-1.5 text-slate-300">Account Email</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="genukakisara@gmail.com"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-3 py-2.5 rounded-lg text-sm text-slate-100 font-mono outline-none"
            />
            <span className="text-[0.68rem] text-slate-500 mt-1 block">Backup & receipt identifier</span>
          </div>

          <div>
            <label className="label-mono block mb-1.5 text-slate-300">Currency Symbol</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-3 py-2.5 rounded-lg text-sm text-slate-100 font-mono outline-none"
            >
              <option value="$">USD / CAD / AUD ($)</option>
              <option value="Rs. ">Sri Lankan Rupee (Rs.)</option>
              <option value="₹">Indian Rupee (₹)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
              <option value="¥">JPY / CNY (¥)</option>
              <option value="CHF ">CHF</option>
              <option value="₩">KRW (₩)</option>
            </select>
            <span className="text-[0.68rem] text-slate-500 mt-1 block">Display symbol across app</span>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-xs font-semibold font-mono tracking-wide cursor-pointer shadow-md shadow-blue-600/25 transition-all"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* SECTION 3: DATA EXPORT & BACKUP */}
      <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl space-y-4">
        <div>
          <h2 className="font-heading text-lg font-bold text-white">Data Management & Exports</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Export your financial ledger to CSV (compatible with Excel & Google Sheets) or create a JSON backup.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <button
            onClick={() => exportDataCSV('finances')}
            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer text-xs font-mono font-medium"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV Ledger</span>
          </button>

          <button
            onClick={exportDataJSON}
            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer text-xs font-mono font-medium"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Backup Data (JSON)</span>
          </button>

          {isConfirmingReset ? (
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs font-mono">
              <span className="text-rose-200">Confirm reset?</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    resetAllData();
                    setIsConfirmingReset(false);
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded cursor-pointer"
                >
                  Yes, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(false)}
                  className="px-2 py-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingReset(true)}
              className="flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer text-xs font-mono font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Sample Data</span>
            </button>
          )}
        </div>
      </div>

      {/* EDIT / ADD ACCOUNT MODAL */}
      {(editingAccount || isAddAccountOpen) && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 md:p-6 flex min-h-full items-center justify-center animate-in fade-in duration-150"
          onClick={() => {
            setEditingAccount(null);
            setIsAddAccountOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl my-auto flex flex-col max-h-[92dvh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-800/80 px-5 sm:px-6 py-4 bg-slate-900">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ArrowRightLeft className="w-4 h-4" />
                </span>
                <h3 className="font-heading text-base font-bold text-white">
                  {editingAccount ? `Edit "${editingAccount.name}"` : 'Add New Transferrable Account'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAccount(null);
                  setIsAddAccountOpen(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccountEdit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain text-xs">
              <div>
                <label className="label-mono block mb-1 text-slate-300">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Primary Bank, Pocket Allowance, Stash"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-3 py-2 rounded-lg text-sm text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-mono block mb-1 text-slate-300">Account Role / Type</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as Account['type'])}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-2.5 py-2 rounded-lg text-xs text-slate-100 outline-none"
                  >
                    <option value="main">Main (Income & Bills)</option>
                    <option value="personal">Personal (Spending)</option>
                    <option value="savings">Savings (Reserves)</option>
                    <option value="custom">Custom Account</option>
                  </select>
                </div>

                <div>
                  <label className="label-mono block mb-1 text-slate-300">Display Icon</label>
                  <select
                    value={accIcon}
                    onChange={(e) => setAccIcon(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-2.5 py-2 rounded-lg text-xs text-slate-100 outline-none"
                  >
                    <option value="building">🏦 Building / Bank</option>
                    <option value="user">👤 User / Personal</option>
                    <option value="piggy">🐖 Piggy Bank / Savings</option>
                    <option value="briefcase">💼 Briefcase / Work</option>
                    <option value="landmark">🏛️ Landmark</option>
                    <option value="wallet">👛 Wallet / Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-mono block mb-1 text-slate-300">Starting Balance ({currency})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={accStartingBalance}
                    onChange={(e) => setAccStartingBalance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 pl-7 pr-3 py-2 rounded-lg text-sm text-slate-100 font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="label-mono block mb-1 text-slate-300">Description & Role Purpose</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Daily spending allowance, emergency fund, or secondary checking account"
                  value={accDesc}
                  onChange={(e) => setAccDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 p-2.5 rounded-lg text-xs text-slate-100 outline-none resize-none"
                />
              </div>

              {/* Transferrable toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200 block text-xs">Allow Transfers Between Accounts</span>
                  <span className="text-[0.68rem] text-slate-400">
                    Enable this account as a source/destination in the Move Money transfer dialog
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAccIsTransferrable(!accIsTransferrable)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    accIsTransferrable ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      accIsTransferrable ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              </div>

              {/* Sticky Footer */}
              <div className="shrink-0 flex items-center justify-end gap-2 px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-900/95">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAccount(null);
                    setIsAddAccountOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-5 py-2 rounded-lg font-mono text-xs cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  {editingAccount ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
