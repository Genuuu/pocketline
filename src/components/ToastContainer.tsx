import React from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { Check, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useLifeOS();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-[rgba(242,242,242,0.15)] bg-[#0c0c0e]/95 backdrop-blur-md shadow-2xl text-[#f2f2f2] text-xs font-medium animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-4 h-4 rounded-[3px] bg-[#5e5ce6] flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="truncate">{toast.text}</span>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-[#f2f2f2]/40 hover:text-white p-0.5 rounded transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
