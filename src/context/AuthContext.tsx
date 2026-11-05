import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInAnonymously,
} from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from '../firebase/config';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  errorCode: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'pocketline_guest_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    // Initial connection probe
    testFirestoreConnection().catch(() => {});

    // Check for persisted local demo user if unauthenticated
    const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
    let mockGuestUser: User | null = null;
    if (savedGuest) {
      try {
        const parsed = JSON.parse(savedGuest);
        mockGuestUser = {
          uid: parsed.uid || 'demo-guest-user',
          displayName: parsed.displayName || 'Guest User',
          email: parsed.email || 'guest@pocketline.app',
          photoURL: null,
          emailVerified: true,
          isAnonymous: true,
          metadata: {},
          providerData: [],
          refreshToken: '',
          tenantId: null,
          delete: async () => {},
          getIdToken: async () => 'demo-token',
          getIdTokenResult: async () => ({} as any),
          reload: async () => {},
          toJSON: () => ({}),
          providerId: 'demo',
        } as unknown as User;
      } catch (e) {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (currentUser) {
          localStorage.removeItem(GUEST_STORAGE_KEY);
          setUser(currentUser);
        } else if (mockGuestUser) {
          setUser(mockGuestUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setAuthError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      setErrorCode(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      const code = error?.code || '';
      setErrorCode(code);

      if (code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        setAuthError(
          `Unauthorized Domain: "${hostname}" is not listed in Authorized Domains for Firebase project "${firebaseConfig.projectId}". Please add it in Firebase Console -> Auth -> Settings -> Authorized Domains, or continue with Guest Mode below.`
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in cancelled. Please try again.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by browser. Please allow popups for this site.');
      } else {
        setAuthError(error?.message || 'Failed to sign in with Google');
      }
      throw error;
    }
  };

  const signInAsGuest = async () => {
    try {
      setAuthError(null);
      setErrorCode(null);
      // Attempt anonymous sign-in first
      try {
        const cred = await signInAnonymously(auth);
        setUser(cred.user);
        return;
      } catch (e) {
        console.warn('Firebase anonymous sign in unavailable, falling back to local demo guest session:', e);
      }

      // Fallback local demo user
      const guestData = {
        uid: 'guest-' + Math.random().toString(36).substring(2, 9),
        displayName: 'Guest User',
        email: 'guest@pocketline.app',
      };
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestData));

      const mockGuestUser = {
        uid: guestData.uid,
        displayName: guestData.displayName,
        email: guestData.email,
        photoURL: null,
        emailVerified: true,
        isAnonymous: true,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'demo-token',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({}),
        providerId: 'demo',
      } as unknown as User;

      setUser(mockGuestUser);
    } catch (error: any) {
      console.error('Guest sign-in error:', error);
      setAuthError(error?.message || 'Failed to initialize guest session');
    }
  };

  const signOut = async () => {
    try {
      setAuthError(null);
      setErrorCode(null);
      localStorage.removeItem(GUEST_STORAGE_KEY);
      if (user?.isAnonymous && user.uid.startsWith('guest-')) {
        setUser(null);
      } else {
        await fbSignOut(auth);
        setUser(null);
      }
    } catch (error: any) {
      console.error('Sign-out error:', error);
      setAuthError(error?.message || 'Failed to sign out');
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
    setErrorCode(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInAsGuest,
        signOut,
        authError,
        errorCode,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
