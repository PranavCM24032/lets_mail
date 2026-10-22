import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { OrganizerUser } from '../types';

// Initialize Firebase App only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

export const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

const provider = new GoogleAuthProvider();
provider.addScope(GMAIL_SEND_SCOPE);
provider.setCustomParameters({
  prompt: 'select_account'
});

const TOKEN_SESSION_KEY = 'letsmail_gmail_oauth_token';
const REDIRECT_ERROR_KEY = 'letsmail_auth_error';

const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
  'auth/web-storage-unsupported'
]);

let cachedAccessToken: string | null = null;

const toOrganizerUser = (firebaseUser: User): OrganizerUser => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email || '',
  displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Organizer',
  photoURL: firebaseUser.photoURL || undefined,
});

const cacheAccessToken = (token: string) => {
  cachedAccessToken = token;
  try {
    sessionStorage.setItem(TOKEN_SESSION_KEY, token);
  } catch {
    // Storage access issue fallback
  }
};

const storeRedirectError = (error: unknown) => {
  try {
    const errorObj = error as { code?: string; message?: string };
    sessionStorage.setItem(
      REDIRECT_ERROR_KEY,
      JSON.stringify({
        code: errorObj?.code || 'auth/unknown',
        message: errorObj?.message || 'Authentication could not be completed. Please try again.'
      })
    );
  } catch {
    // Storage access issue fallback
  }
};

export const consumeRedirectAuthError = (): { code: string; message: string } | null => {
  try {
    const raw = sessionStorage.getItem(REDIRECT_ERROR_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(REDIRECT_ERROR_KEY);
    return JSON.parse(raw) as { code: string; message: string };
  } catch {
    return null;
  }
};

const handleRedirectResult = (
  onAuthSuccess?: (user: OrganizerUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  getRedirectResult(auth)
    .then((result) => {
      if (!result) return;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || '';
      if (token) {
        cacheAccessToken(token);
      }
      const orgUser = toOrganizerUser(result.user);
      if (onAuthSuccess) {
        onAuthSuccess(orgUser, token || cachedAccessToken || '');
      }
    })
    .catch((error: unknown) => {
      // Popup was blocked/closed or the OAuth consent screen rejected the request.
      // Persist the reason so the sign-in screen can show it after the page reload.
      storeRedirectError(error);
      console.error('Google redirect sign-in error:', error);
      if (onAuthFailure) onAuthFailure();
    });
};

export const initAuth = (
  onAuthSuccess?: (user: OrganizerUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  handleRedirectResult(onAuthSuccess, onAuthFailure);

  // Restore token from active session if present
  const sessionToken = sessionStorage.getItem(TOKEN_SESSION_KEY);
  if (sessionToken) {
    cachedAccessToken = sessionToken;
  }

  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser) {
      const orgUser = toOrganizerUser(firebaseUser);
      const validToken = cachedAccessToken || sessionStorage.getItem(TOKEN_SESSION_KEY) || '';
      if (onAuthSuccess) {
        onAuthSuccess(orgUser, validToken);
      }
    } else {
      cachedAccessToken = null;
      sessionStorage.removeItem(TOKEN_SESSION_KEY);
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: OrganizerUser; accessToken: string } | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to acquire Gmail OAuth access token. Ensure popups are allowed in your browser.');
    }

    cacheAccessToken(credential.accessToken);

    return { user: toOrganizerUser(result.user), accessToken: credential.accessToken };
  } catch (error: unknown) {
    const errorObj = error as { code?: string };
    if (errorObj?.code && POPUP_FALLBACK_CODES.has(errorObj.code)) {
      // Popups are commonly blocked (or closed automatically) by third-party
      // storage restrictions. The redirect flow uses the same OAuth provider
      // but survives without an opener window.
      console.warn('Popup sign-in unavailable, falling back to redirect flow:', errorObj.code);
      try {
        await signInWithRedirect(auth, provider);
        return null;
      } catch (redirectError) {
        storeRedirectError(redirectError);
        console.error('Google redirect sign-in error:', redirectError);
        throw redirectError;
      }
    }
    console.error('Google Sign In error:', error);
    throw error;
  }
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  try {
    sessionStorage.removeItem(TOKEN_SESSION_KEY);
  } catch {
    //
  }
};
