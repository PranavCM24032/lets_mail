import React, { useState } from 'react';
import {
  Mail,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { OrganizerUser } from '../types';
import { consumeRedirectAuthError } from '../services/auth';

const describeAuthError = (code: string, message: string): string => {
  if (code === 'auth/unauthorized-domain') {
    return `This domain is not authorized for Google sign-in in Firebase. Add "${window.location.hostname}" under Firebase Console > Authentication > Settings > Authorized domains.`;
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is disabled for this Firebase project. Enable the Google provider under Firebase Console > Authentication > Sign-in method.';
  }
  if (code === 'auth/internal-error') {
    return 'Google rejected the OAuth request. This usually means the OAuth consent screen is not configured for the gmail.send scope, or this account is not allowed as a test user.';
  }
  return message;
};

interface SignInViewProps {
  onGoogleSignIn: () => Promise<any> | void;
  isLoading: boolean;
  onSelectMockOrganizer: (organizer: OrganizerUser) => void;
}

export const SignInView: React.FC<SignInViewProps> = ({
  onGoogleSignIn,
  isLoading,
  onSelectMockOrganizer
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(() => {
    const stored = consumeRedirectAuthError();
    return stored ? describeAuthError(stored.code, stored.message) : null;
  });
  const [showSandbox, setShowSandbox] = useState(false);

  const activeLoading = isLoading || internalLoading;

  const handleSignIn = async () => {
    if (activeLoading) return;
    setAuthError(null);
    setInternalLoading(true);
    try {
      await onGoogleSignIn();
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      const errorObj = err as { code?: string; message?: string };
      if (
        errorObj?.code === 'auth/popup-closed-by-user' ||
        errorObj?.message?.includes('closed-by-user')
      ) {
        setAuthError('Sign-in was cancelled before completion. Click retry when you are ready.');
      } else if (
        errorObj?.code === 'auth/popup-blocked' ||
        errorObj?.message?.includes('popup-blocked')
      ) {
        setAuthError('The sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else if (errorObj?.code === 'auth/network-request-failed') {
        setAuthError('A network error occurred. Please verify your internet connection and try again.');
      } else if (errorObj?.code === 'auth/unauthorized-domain') {
        setAuthError(describeAuthError('auth/unauthorized-domain', ''));
      } else if (errorObj?.code === 'auth/operation-not-allowed') {
        setAuthError(describeAuthError('auth/operation-not-allowed', ''));
      } else {
        setAuthError(errorObj?.message || 'Authentication could not be completed. Please try again.');
      }
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 flex flex-col justify-between selection:bg-indigo-600 selection:text-white relative">
      {/* Subtle background ambient grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top minimal bar */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
            <Mail className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-xs tracking-tight text-slate-900">Let's Mail</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200/80 text-[11px] text-slate-600 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            100% Free Tier
          </span>
        </div>
      </header>

      {/* Main Centered Authentication Experience */}
      <main className="relative z-10 w-full px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-[420px] space-y-4">
          {/* Centered Let's Mail Branding */}
          <div className="text-center space-y-2 pb-2">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 items-center justify-center text-white shadow-sm ring-4 ring-indigo-50">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Let's Mail
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Free multi-organizer email dispatch platform for college festivals, student clubs, and campus events.
            </p>
          </div>

          {/* Premium White Authentication Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
            {/* Card Header */}
            <div className="space-y-1 text-center">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
                Connect your Google Account
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect your Gmail account to send personalized emails directly from your own email address.
              </p>
            </div>

            {/* Error Banner with Retry */}
            {authError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs flex items-start justify-between gap-2.5 animate-in fade-in duration-150">
                <div className="flex items-start gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-snug text-[11.5px]">{authError}</span>
                </div>
                <button
                  onClick={handleSignIn}
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
                onClick={handleSignIn}
                disabled={activeLoading}
                type="button"
                className="w-full h-11 sm:h-12 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 hover:border-slate-400 rounded-xl font-medium text-sm flex items-center justify-center gap-3 shadow-2xs transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                aria-label="Continue with Google"
              >
                {activeLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin"></span>
                    <span className="text-slate-600 text-xs sm:text-sm">Connecting to Google...</span>
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

            {/* Privacy and Security Reassurance Underneath Button */}
            <div className="space-y-2 text-center pt-1">
              <p className="text-[11.5px] text-slate-500 leading-snug">
                Your account stays yours. We never ask for your Google password.
              </p>
              <p className="text-[11px] text-slate-400 leading-snug">
                Google permissions are used only for the features you authorize.
              </p>
            </div>

            {/* Detailed Least-Privilege Trust Badge */}
            <div className="pt-4 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Least-Privilege Gmail Access</span>
                </div>
                <p className="text-slate-500 text-[10.5px]">
                  We exclusively request the <code className="text-slate-700 bg-white px-1 py-0.5 rounded border border-slate-200">gmail.send</code> scope to transmit approved campaigns. We cannot read, modify, or delete your inbox messages.
                </p>
              </div>
            </div>
          </div>

          {/* Sandbox Testing Accordion for Testing Multiple Accounts */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs">
            <button
              onClick={() => setShowSandbox((prev) => !prev)}
              type="button"
              className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 transition font-medium cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-indigo-500" />
                <span>Multi-Organizer Testing Sandbox</span>
              </span>
              {showSandbox ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {showSandbox && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-150">
                <p className="text-[11px] text-slate-500">
                  Switch between isolated organizer profiles to test quotas, templates, and campaign isolation:
                </p>
                <div className="space-y-1.5">
                  <button
                    onClick={() =>
                      onSelectMockOrganizer({
                        uid: 'org_techfest',
                        email: 'techfest.lead@sbjit.edu.in',
                        displayName: 'Prof. Sarah Chen (Tech Fest)'
                      })
                    }
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-slate-900 text-xs">Prof. Sarah Chen</p>
                      <p className="text-[11px] text-slate-500 font-mono">techfest.lead@sbjit.edu.in</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() =>
                      onSelectMockOrganizer({
                        uid: 'org_cultural',
                        email: 'cultural.coord@sbjit.edu.in',
                        displayName: 'Rohan Verma (Cultural Club)'
                      })
                    }
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-slate-900 text-xs">Rohan Verma</p>
                      <p className="text-[11px] text-slate-500 font-mono">cultural.coord@sbjit.edu.in</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Value Props Row */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2 rounded-lg bg-white/70 border border-slate-200/60 shadow-2xs">
              <span className="font-semibold text-slate-800 text-[11px] block">500 / day</span>
              <span className="text-[10px] text-slate-400">Free Gmail cap</span>
            </div>
            <div className="p-2 rounded-lg bg-white/70 border border-slate-200/60 shadow-2xs">
              <span className="font-semibold text-slate-800 text-[11px] block">Zero Billing</span>
              <span className="text-[10px] text-slate-400">No card needed</span>
            </div>
            <div className="p-2 rounded-lg bg-white/70 border border-slate-200/60 shadow-2xs">
              <span className="font-semibold text-slate-800 text-[11px] block">Google Forms</span>
              <span className="text-[10px] text-slate-400">Instant triggers</span>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="relative z-10 w-full py-4 px-6 text-center text-xs text-slate-400 border-t border-slate-200/60 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Let's Mail &bull; Free Multi-Organizer Event Email Platform</span>
        <span>Runs 100% on Free Consumer Google Infrastructure</span>
      </footer>
    </div>
  );
};
