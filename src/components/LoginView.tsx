import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle, ArrowRight, Copy, Check, ShieldAlert, UserCheck } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

export const LoginView: React.FC = () => {
  const { signInWithGoogle, signInAsGuest, authError, errorCode, clearAuthError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      await signInWithGoogle();
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsGuestSubmitting(true);
      await signInAsGuest();
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsGuestSubmitting(false);
    }
  };

  const handleCopyDomain = () => {
    if (currentDomain) {
      navigator.clipboard.writeText(currentDomain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const isUnauthorizedDomain =
    errorCode === 'auth/unauthorized-domain' || authError?.includes('unauthorized-domain');

  return (
    <div className="min-h-screen bg-[#090d16] text-[#f8fafc] flex flex-col items-center justify-center p-6 antialiased selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Wordmark with Blue Accent */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm tracking-tight font-heading shadow-md shadow-blue-600/30">
            P
          </div>
          <span className="text-2xl font-bold tracking-tight text-white font-heading">
            Pocketline
          </span>
        </div>

        <p className="text-blue-200/60 text-xs text-center mb-6 font-mono">
          Private cash flow & personal ledger
        </p>

        {/* Minimal Auth Card */}
        <div className="w-full bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl">
          <div className="space-y-1 text-center">
            <h2 className="text-sm font-semibold text-white">Sign In to Continue</h2>
            <p className="text-xs text-slate-400">
              Your ledger is encrypted and isolated strictly to your user account.
            </p>
          </div>

          {/* Special Guidance Card for auth/unauthorized-domain */}
          {isUnauthorizedDomain ? (
            <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-3 text-xs text-amber-200">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-amber-300">Firebase Domain Authorization Required</h3>
                  <p className="text-amber-200/90 text-[0.72rem] leading-relaxed">
                    Firebase project <strong className="font-mono text-white">{firebaseConfig.projectId}</strong> requires authorizing this preview domain before Google Sign-In can open.
                  </p>
                </div>
              </div>

              {/* Copy Domain Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-2 font-mono text-[0.7rem] text-slate-300">
                <span className="truncate">{currentDomain}</span>
                <button
                  onClick={handleCopyDomain}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors flex items-center gap-1 cursor-pointer shrink-0 font-sans text-[0.68rem] font-semibold"
                >
                  {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDomain ? 'Copied!' : 'Copy Domain'}</span>
                </button>
              </div>

              <div className="text-[0.68rem] text-amber-200/80 space-y-1 pt-1 border-t border-amber-500/20">
                <p><strong>To enable Google Sign-In:</strong></p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-300 font-mono text-[0.65rem]">
                  <li>Open Firebase Console for <strong>{firebaseConfig.projectId}</strong></li>
                  <li>Go to <strong>Authentication &gt; Settings &gt; Authorized Domains</strong></li>
                  <li>Click <strong>Add Domain</strong> and paste the copied domain</li>
                </ol>
              </div>

              {/* Guest Action Prompt */}
              <div className="pt-2">
                <button
                  onClick={handleGuestLogin}
                  disabled={isGuestSubmitting}
                  className="w-full py-2 px-3 rounded-lg font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs shadow-md shadow-amber-500/20"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Continue in Guest Mode Now</span>
                </button>
              </div>
            </div>
          ) : authError ? (
            /* General Auth Error Banner */
            <div className="flex items-start justify-between gap-2 p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs text-rose-300">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
              <button
                onClick={clearAuthError}
                className="text-rose-400 hover:text-white font-mono cursor-pointer ml-1"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitting || isGuestSubmitting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-950 transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group shadow-sm"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isSubmitting ? 'Authenticating...' : 'Continue with Google'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform ml-auto" />
            </button>

            {/* Guest Sign In Button */}
            {!isUnauthorizedDomain && (
              <button
                onClick={handleGuestLogin}
                disabled={isSubmitting || isGuestSubmitting}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isGuestSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-slate-200 rounded-full animate-spin" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>{isGuestSubmitting ? 'Launching...' : 'Continue in Guest Mode'}</span>
              </button>
            )}
          </div>

          <div className="pt-2 text-center">
            <span className="text-[11px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Multi-user isolated · Firebase project: {firebaseConfig.projectId}</span>
            </span>
          </div>
        </div>

        {/* Quiet footnote */}
        <p className="mt-8 text-[11px] font-mono text-slate-600 text-center">
          Pocketline · 3-Account Personal Cash Flow Ledger
        </p>
      </div>
    </div>
  );
};

