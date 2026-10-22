import React, { useState } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LogOut,
  RefreshCw,
  Shield,
  Lock,
  ChevronRight
} from 'lucide-react';
import { OrganizerUser } from '../types';

export interface GoogleAuthCardProps {
  /** If provided, displays the connected state */
  organizer?: OrganizerUser | null;
  /** Async or sync sign-in handler */
  onSignIn?: () => Promise<void> | void;
  /** Disconnect/logout handler */
  onDisconnect?: () => void;
  /** Handler to open account management */
  onManageAccount?: () => void;
  /** External loading state (optional) */
  isLoading?: boolean;
  /** External error message (optional) */
  errorMessage?: string | null;
  /** Callback when error is cleared / retry requested */
  onRetry?: () => void;
  /** Custom additional CSS classes for wrapper */
  className?: string;
  /** Whether to show the top logo and wordmark (default true) */
  showLogo?: boolean;
}

export const GoogleAuthCard: React.FC<GoogleAuthCardProps> = ({
  organizer,
  onSignIn,
  onDisconnect,
  onManageAccount,
  isLoading = false,
  errorMessage = null,
  onRetry,
  className = '',
  showLogo = true
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const activeLoading = isLoading || internalLoading;
  const activeError = errorMessage !== undefined && errorMessage !== null ? errorMessage : internalError;

  const handleSignInClick = async () => {
    if (activeLoading || !onSignIn) return;
    setInternalError(null);
    setInternalLoading(true);
    try {
      await onSignIn();
    } catch (err: unknown) {
      console.error('Sign-in failed:', err);
      const errorObj = err as { code?: string; message?: string };
      if (
        errorObj?.code === 'auth/popup-closed-by-user' ||
        errorObj?.message?.includes('closed-by-user')
      ) {
        setInternalError('Sign-in was cancelled before completion.');
      } else if (
        errorObj?.code === 'auth/popup-blocked' ||
        errorObj?.message?.includes('popup-blocked')
      ) {
        setInternalError('Popup was blocked by your browser. Please allow popups.');
      } else if (errorObj?.code === 'auth/network-request-failed') {
        setInternalError('Network error. Please check your internet connection.');
      } else {
        setInternalError(errorObj?.message || 'Authentication could not be completed. Please try again.');
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const handleRetry = () => {
    setInternalError(null);
    if (onRetry) {
      onRetry();
    } else {
      handleSignInClick();
    }
  };

  const defaultManageAccount = () => {
    if (onManageAccount) {
      onManageAccount();
    } else {
      window.open('https://myaccount.google.com/permissions', '_blank', 'noopener,noreferrer');
    }
  };

  const isConnected = !!organizer && !!organizer.email;

  return (
    <div
      className={`w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs text-slate-800 transition-all ${className}`}
    >
      {/* 1. Header with Let's Mail Logo and Wordmark */}
      {showLogo && (
        <div className="flex items-center gap-2.5 pb-5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-slate-900">Let's Mail</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
              Workspace
            </span>
          </div>
        </div>
      )}

      {/* 2. Card Content based on Connection Status */}
      {isConnected ? (
        /* CONNECTED STATE */
        <div className="space-y-5 pt-5">
          {/* Status Row */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              Connected Google Account
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Connected
            </span>
          </div>

          {/* Account Profile Tile */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-3">
            {organizer.photoURL ? (
              <img
                src={organizer.photoURL}
                alt={organizer.displayName || 'Google Profile'}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                {organizer.displayName ? organizer.displayName[0].toUpperCase() : organizer.email[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900 text-xs sm:text-sm truncate">
                {organizer.displayName || 'Google User'}
              </p>
              <p className="text-[11px] font-mono text-slate-600 truncate mt-0.5">
                {organizer.email}
              </p>
            </div>
          </div>

          {/* Action Buttons: Manage Account & Disconnect */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={defaultManageAccount}
              type="button"
              className="h-9.5 px-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>Manage account</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>

            <button
              onClick={onDisconnect}
              type="button"
              className="h-9.5 px-3 rounded-lg border border-rose-200/80 bg-rose-50/40 hover:bg-rose-50 text-rose-600 font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Disconnect</span>
            </button>
          </div>

          {/* Reassurance & Security Notes */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500 leading-relaxed">
            <p className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Google permissions are used only for the features you authorize.</span>
            </p>
            <p className="pl-5 text-slate-400 text-[10.5px]">
              Your account stays yours. We never ask for your Google password.
            </p>
          </div>
        </div>
      ) : (
        /* DISCONNECTED / SIGN-IN STATE */
        <div className="space-y-5 pt-5">
          {/* Heading & Supporting Text */}
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
              Connect your Google Account
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Connect your Gmail account to send personalized emails directly from your own email address.
            </p>
          </div>

          {/* Error / Cancelled Alert Banner with Retry */}
          {activeError && (
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs flex items-start justify-between gap-2.5 animate-in fade-in duration-150">
              <div className="flex items-start gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-snug text-[11.5px]">{activeError}</span>
              </div>
              <button
                onClick={handleRetry}
                type="button"
                className="shrink-0 font-medium text-amber-800 hover:text-amber-950 underline text-[11.5px] cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          {/* Prominent White Continue with Google Button */}
          <div>
            <button
              onClick={handleSignInClick}
              disabled={activeLoading}
              type="button"
              className="w-full h-11 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 hover:border-slate-400/80 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-3 shadow-2xs transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              aria-label="Continue with Google"
            >
              {activeLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin"></span>
                  <span className="text-slate-600">Connecting to Google...</span>
                </>
              ) : (
                <>
                  {/* Official Multicolor Google "G" SVG */}
                  <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
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
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Privacy Reassurance and Subtle Security Note */}
          <div className="space-y-1.5 text-center sm:text-left">
            <p className="text-[11.5px] text-slate-500 font-normal">
              Your account stays yours. We never ask for your Google password.
            </p>
            <p className="text-[10.5px] text-slate-400 leading-snug">
              Google permissions are used only for the features you authorize.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
