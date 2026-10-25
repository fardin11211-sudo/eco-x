import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  isFirebaseConfigured,
  AuthUserProfile,
  mapFirebaseUser,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  sendVerificationLink,
  updateUserDisplayName,
  changeUserPassword,
  deleteUserAccount,
  signOutUser
} from '../data/firebase';

interface AuthContextType {
  user: AuthUserProfile | null;
  loading: boolean;
  isFirebaseReady: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginGoogle: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string, name: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  updateName: (newName: string) => Promise<void>;
  updatePassword: (currentPass: string, newPass: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
  // Preview / Sandbox login for testing before Firebase console keys are pasted
  loginDemoUser: (name?: string, email?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'eco_demo_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const isFirebaseReady = isFirebaseConfigured();

  const clearAuthError = useCallback(() => setAuthError(null), []);

  useEffect(() => {
    // If Firebase is configured, subscribe to live auth state changes
    if (isFirebaseReady && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
        if (firebaseUser) {
          setUser(mapFirebaseUser(firebaseUser));
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // If Firebase credentials are placeholders (***), check if user signed in via preview demo
      const savedDemo = localStorage.getItem(DEMO_USER_STORAGE_KEY);
      if (savedDemo) {
        try {
          setUser(JSON.parse(savedDemo));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
  }, [isFirebaseReady]);

  const loginGoogle = async () => {
    setAuthError(null);
    if (!isFirebaseReady) {
      // Friendly demo login fallback when *** is active
      loginDemoUser('Google User', 'user@gmail.com');
      return;
    }
    try {
      const profile = await signInWithGoogle();
      setUser(profile);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign in with Google.');
      throw err;
    }
  };

  const loginEmail = async (email: string, pass: string) => {
    setAuthError(null);
    if (!isFirebaseReady) {
      loginDemoUser(email.split('@')[0], email);
      return;
    }
    try {
      const profile = await signInWithEmail(email, pass);
      setUser(profile);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign in.');
      throw err;
    }
  };

  const registerEmail = async (email: string, pass: string, name: string) => {
    setAuthError(null);
    if (!isFirebaseReady) {
      loginDemoUser(name || email.split('@')[0], email);
      return;
    }
    try {
      const profile = await signUpWithEmail(email, pass, name);
      setUser(profile);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to create account.');
      throw err;
    }
  };

  const requestPasswordReset = async (email: string) => {
    setAuthError(null);
    if (!isFirebaseReady) {
      return; // Simulated success
    }
    try {
      await sendPasswordReset(email);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to send password reset email.');
      throw err;
    }
  };

  const resendVerification = async () => {
    setAuthError(null);
    if (!isFirebaseReady) {
      if (user) {
        const updated = { ...user, emailVerified: true };
        setUser(updated);
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(updated));
      }
      return;
    }
    try {
      await sendVerificationLink();
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to send verification email.');
      throw err;
    }
  };

  const updateName = async (newName: string) => {
    setAuthError(null);
    if (!isFirebaseReady) {
      if (user) {
        const updated = { ...user, displayName: newName };
        setUser(updated);
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(updated));
      }
      return;
    }
    try {
      await updateUserDisplayName(newName);
      if (user) {
        setUser({ ...user, displayName: newName });
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to update name.');
      throw err;
    }
  };

  const updatePassword = async (currentPass: string, newPass: string) => {
    setAuthError(null);
    if (!isFirebaseReady) {
      return;
    }
    try {
      await changeUserPassword(currentPass, newPass);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to change password.');
      throw err;
    }
  };

  const deleteAccount = async () => {
    setAuthError(null);
    if (!isFirebaseReady) {
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      setUser(null);
      return;
    }
    try {
      await deleteUserAccount();
      setUser(null);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to delete account.');
      throw err;
    }
  };

  const logout = async () => {
    setAuthError(null);
    if (!isFirebaseReady) {
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      setUser(null);
      return;
    }
    try {
      await signOutUser();
      setUser(null);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign out.');
      throw err;
    }
  };

  const loginDemoUser = (name = 'Fardin', email = 'fardin@example.com') => {
    const demoProfile: AuthUserProfile = {
      uid: 'user_demo_' + Math.random().toString(36).substring(2, 8),
      displayName: name,
      email: email,
      photoURL: null,
      emailVerified: true,
      providerId: 'google',
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString()
    };
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoProfile));
    setUser(demoProfile);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseReady,
        authError,
        clearAuthError,
        loginGoogle,
        loginEmail,
        registerEmail,
        requestPasswordReset,
        resendVerification,
        updateName,
        updatePassword,
        deleteAccount,
        logout,
        loginDemoUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
