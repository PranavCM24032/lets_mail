import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
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

let cachedAccessToken: string | null = null;
let currentMockUser: OrganizerUser | null = null;
let mockToken: string | null = null;

// Multi-organizer simulator for testing multiple accounts without logging out of Google
const MOCK_STORAGE_KEY = 'letsmail_mock_active_user';

export const initAuth = (
  onAuthSuccess?: (user: OrganizerUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check if user previously selected a mock organizer for testing
  const storedMock = localStorage.getItem(MOCK_STORAGE_KEY);
  if (storedMock) {
    try {
      const parsed = JSON.parse(storedMock) as OrganizerUser;
      currentMockUser = parsed;
      mockToken = 'simulated_oauth_token_' + parsed.uid;
      if (onAuthSuccess) {
        onAuthSuccess(currentMockUser, mockToken);
        return () => {};
      }
    } catch {
      localStorage.removeItem(MOCK_STORAGE_KEY);
    }
  }

  // Restore token from active session if present
  const sessionToken = sessionStorage.getItem(TOKEN_SESSION_KEY);
  if (sessionToken) {
    cachedAccessToken = sessionToken;
  }

  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser) {
      const orgUser: OrganizerUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Organizer',
        photoURL: firebaseUser.photoURL || undefined,
      };

      const validToken = cachedAccessToken || sessionStorage.getItem(TOKEN_SESSION_KEY) || '';
      if (onAuthSuccess) {
        onAuthSuccess(orgUser, validToken);
      }
    } else {
      cachedAccessToken = null;
      sessionStorage.removeItem(TOKEN_SESSION_KEY);
      if (!currentMockUser && onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: OrganizerUser; accessToken: string } | null> => {
  try {
    currentMockUser = null;
    mockToken = null;
    localStorage.removeItem(MOCK_STORAGE_KEY);

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to acquire Gmail OAuth access token. Ensure popups are allowed in your browser.');
    }

    cachedAccessToken = credential.accessToken;
    try {
      sessionStorage.setItem(TOKEN_SESSION_KEY, credential.accessToken);
    } catch {
      // Storage access issue fallback
    }

    const orgUser: OrganizerUser = {
      uid: result.user.uid,
      email: result.user.email || '',
      displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Organizer',
      photoURL: result.user.photoURL || undefined,
    };

    return { user: orgUser, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    console.error('Google Sign In error:', error);
    throw error;
  }
};

export const reauthorizeGmail = async (): Promise<{ user: OrganizerUser; accessToken: string } | null> => {
  return await googleSignIn();
};

export const getAccessToken = async (): Promise<string | null> => {
  if (currentMockUser && mockToken) {
    return mockToken;
  }
  return cachedAccessToken || sessionStorage.getItem(TOKEN_SESSION_KEY) || null;
};

export const setManualAccessToken = (token: string) => {
  cachedAccessToken = token;
  try {
    sessionStorage.setItem(TOKEN_SESSION_KEY, token);
  } catch {
    //
  }
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  currentMockUser = null;
  mockToken = null;
  try {
    sessionStorage.removeItem(TOKEN_SESSION_KEY);
    localStorage.removeItem(MOCK_STORAGE_KEY);
  } catch {
    //
  }
};

// Switch organizer for testing multi-organizer isolation (Organizer A, Organizer B, Organizer C)
export const switchMockOrganizer = (organizer: OrganizerUser | null): { user: OrganizerUser | null; token: string | null } => {
  if (organizer) {
    currentMockUser = organizer;
    mockToken = 'simulated_oauth_token_' + organizer.uid;
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(organizer));
    return { user: organizer, token: mockToken };
  } else {
    currentMockUser = null;
    mockToken = null;
    localStorage.removeItem(MOCK_STORAGE_KEY);
    return { user: null, token: null };
  }
};
