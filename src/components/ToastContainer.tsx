import React from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useLifeOS();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success' || !toast.type;
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl text-xs font-medium animate-in fade-in slide-in-from-bottom-4 duration-200 ${
              isSuccess
                ? 'bg-slate-900/95 border-emerald-500/30 text-emerald-100 shadow-emerald-950/20'
                : isWarning
                ? 'bg-slate-900/95 border-amber-500/30 text-amber-100 shadow-amber-950/20'
                : isError
                ? 'bg-slate-900/95 border-rose-500/30 text-rose-100 shadow-rose-950/20'
                : 'bg-slate-900/95 border-blue-500/30 text-blue-100 shadow-blue-950/20'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  isSuccess
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isWarning
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : isError
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
                {isWarning && <AlertTriangle className="w-3.5 h-3.5" />}
                {isError && <XCircle className="w-3.5 h-3.5" />}
                {!isSuccess && !isWarning && !isError && <Info className="w-3.5 h-3.5" />}
              </div>
              <span className="truncate leading-tight font-medium">{toast.text}</span>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

