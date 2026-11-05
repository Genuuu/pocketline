import React, { useState, useRef } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { Download, Upload, FileSpreadsheet, ShieldCheck, Cloud, CheckCircle2, LogIn, LogOut } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDataJSON,
    exportDataCSV,
    importDataJSON,
    resetAllData,
    tasks,
    projects,
    transactions,
    brainDump,
    currentUser,
    isAuthLoading,
    signInWithGoogle,
    signOutUser,
  } = useLifeOS();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(settings.userName);
  const [email, setEmail] = useState(settings.userEmail);
  const [currency, setCurrency] = useState(settings.currency);
  const [income, setIncome] = useState(settings.monthlyExpectedIncome.toString());
  const [bills, setBills] = useState(settings.monthlyFixedBills.toString());
  const [savings, setSavings] = useState(settings.monthlyTargetSavings.toString());

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      userName: name.trim() || 'Genuka',
      userEmail: email.trim() || 'genukakisara@gmail.com',
      currency: currency.trim() || '$',
      monthlyExpectedIncome: parseFloat(income) || 0,
      monthlyFixedBills: parseFloat(bills) || 0,
      monthlyTargetSavings: parseFloat(savings) || 0,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        importDataJSON(text);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-16">
      {/* Header */}
      <div>
        <span className="label-mono block mb-1 text-slate-400">
          Data Sovereignty & Configuration
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Settings & Local Data
        </h1>
      </div>

      {/* Firebase Cloud Sync Card */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold text-white">Firebase Cloud Database</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Connected to Firebase Project <span className="font-mono text-slate-300 font-semibold">{firebaseConfig.projectId}</span>.
              Real-time Firestore listeners keep your ledger, wishlist, accounts, and tasks securely synchronized.
            </p>
          </div>
          <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Cloud className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/70 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-medium text-slate-200">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase">
                    {(currentUser.displayName || currentUser.email || 'U')[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{currentUser.displayName || 'Google Account'}</div>
                    <div className="text-slate-400 text-[11px] font-mono">{currentUser.email}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                    ?
                  </div>
                  <div>
                    <div className="font-semibold text-slate-300">Local Mode (Signed Out)</div>
                    <div className="text-slate-400 text-[11px]">Sign in with Google to sync across your mobile & desktop devices.</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            {currentUser ? (
              <button
                onClick={() => signOutUser()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                disabled={isAuthLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Google</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Backup Card */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-white">Data Ownership & Backups</h2>
            <p className="text-xs text-slate-400 mt-1">
              Your entire workspace is saved in your local storage. Export full JSON snapshots or CSV ledgers at any time.
            </p>
          </div>
          <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportDataJSON}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Restore Backup</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            onClick={() => exportDataCSV('tasks')}
            className="bg-slate-950 text-slate-300 hover:text-white border border-slate-800 px-3.5 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
            <span>Tasks CSV</span>
          </button>

          <button
            onClick={() => exportDataCSV('finances')}
            className="bg-slate-950 text-slate-300 hover:text-white border border-slate-800 px-3.5 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
            <span>Finances CSV</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-800/60 text-xs font-mono text-slate-400 flex items-center gap-2">
          <span>{tasks.length} tasks</span>
          <span>·</span>
          <span>{projects.length} projects</span>
          <span>·</span>
          <span>{transactions.length} finances</span>
          <span>·</span>
          <span>{brainDump.length} notes</span>
        </div>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-5 shadow-lg"
      >
        <h2 className="font-heading text-lg font-bold text-white">Profile & Financial Baselines</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="label-mono block mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="label-mono block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="label-mono block mb-1">Currency Symbol</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white outline-none font-mono"
            >
              <option value="$">$ (USD)</option>
              <option value="Rs">Rs (Rupees)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="¥">¥ (JPY)</option>
              <option value="CHF">CHF (Franc)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-800/60">
          <div>
            <label className="label-mono block mb-1">Monthly Expected Income ({currency})</label>
            <input
              type="number"
              step="any"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white font-mono outline-none"
            />
          </div>
          <div>
            <label className="label-mono block mb-1">Monthly Fixed Bills ({currency})</label>
            <input
              type="number"
              step="any"
              value={bills}
              onChange={(e) => setBills(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white font-mono outline-none"
            />
          </div>
          <div>
            <label className="label-mono block mb-1">Target Savings Goal ({currency})</label>
            <input
              type="number"
              step="any"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white font-mono outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer shadow-md shadow-blue-600/20"
          >
            Save Configuration
          </button>
        </div>
      </form>

      {/* Reset Demo */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-slate-200 font-medium">Reset Demo Life Data</span>
          <p className="text-slate-400 mt-0.5">Restore all original sample tasks, projects, and finances.</p>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Reset all data to default demo state?')) {
              resetAllData();
            }
          }}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2 rounded-lg text-xs transition-colors cursor-pointer self-start sm:self-auto border border-slate-700/60"
        >
          Reset Demo Data
        </button>
      </div>
    </div>
  );
};
