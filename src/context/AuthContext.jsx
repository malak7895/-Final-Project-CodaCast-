import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup,
  signOut, onAuthStateChanged, sendPasswordResetEmail, updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, authConfigured } from '../firebase';

const AuthContext = createContext(null);

const DEMO_SESSION_KEY = 'velora-demo-session';
const LOCAL_USERS_KEY = 'velora-local-users';
const LOCAL_SESSION_KEY = 'velora-local-session';

const DEMO_USER = {
  uid: 'demo-user-1',
  displayName: 'Sophia Laurent',
  email: 'sophia.laurent@velora-couture.com',
  isDemo: true,
};

function readLocalUsers() {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function readLocalSession() {
  try {
    const raw = sessionStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const MESSAGES = {
  'auth/configuration-not-found': 'Google sign-in requires Firebase settings in .env. Use Email/Password or the Demo Profile.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/network-request-failed': 'Network problem. Check your connection and try again.',
};
export const friendlyError = e => MESSAGES[e?.code] || 'Something went wrong. Please try again.';

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [localUser, setLocalUser] = useState(readLocalSession);
  const [demoActive, setDemoActive] = useState(
    () => sessionStorage.getItem(DEMO_SESSION_KEY) === 'true'
  );
  const [loading, setLoading] = useState(authConfigured);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, u => {
      setFirebaseUser(u);
      if (u) {
        sessionStorage.removeItem(DEMO_SESSION_KEY);
        sessionStorage.removeItem(LOCAL_SESSION_KEY);
        setDemoActive(false);
        setLocalUser(null);
      }
      setLoading(false);
    });
  }, []);

  const user = useMemo(
    () => firebaseUser || localUser || (demoActive ? DEMO_USER : null),
    [firebaseUser, localUser, demoActive]
  );

  const api = {
    user,
    loading,
    configured: authConfigured,
    isDemo: Boolean(!firebaseUser && !localUser && demoActive),
    enterDemoSession: () => {
      sessionStorage.removeItem(LOCAL_SESSION_KEY);
      setLocalUser(null);
      sessionStorage.setItem(DEMO_SESSION_KEY, 'true');
      setDemoActive(true);
    },
    signup: async (name, email, password) => {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (name || '').trim();
      if (!cleanEmail || !cleanEmail.includes('@')) throw { code: 'auth/invalid-email' };
      if (!password || password.length < 6) throw { code: 'auth/weak-password' };

      if (auth) {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await updateProfile(cred.user, { displayName: cleanName });
        setFirebaseUser(
          Object.assign(Object.create(Object.getPrototypeOf(cred.user)), cred.user, {
            displayName: cleanName,
          })
        );
        return;
      }

      const users = readLocalUsers();
      if (users.some(u => u.email === cleanEmail)) {
        throw { code: 'auth/email-already-in-use' };
      }
      const newUser = {
        uid: `local-${Date.now()}`,
        displayName: cleanName || cleanEmail.split('@')[0],
        email: cleanEmail,
        password,
      };
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify([...users, newUser]));
      const sessionUser = { uid: newUser.uid, displayName: newUser.displayName, email: newUser.email, isLocal: true };
      sessionStorage.removeItem(DEMO_SESSION_KEY);
      setDemoActive(false);
      sessionStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(sessionUser));
      setLocalUser(sessionUser);
    },
    login: async (email, password) => {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) throw { code: 'auth/invalid-email' };

      if (auth) {
        return signInWithEmailAndPassword(auth, cleanEmail, password);
      }

      const users = readLocalUsers();
      const matched = users.find(u => u.email === cleanEmail && u.password === password);
      if (!matched) {
        throw { code: 'auth/invalid-credential' };
      }
      const sessionUser = {
        uid: matched.uid,
        displayName: matched.displayName,
        email: matched.email,
        isLocal: true,
      };
      sessionStorage.removeItem(DEMO_SESSION_KEY);
      setDemoActive(false);
      sessionStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(sessionUser));
      setLocalUser(sessionUser);
    },
    loginWithGoogle: () => {
      if (!auth) throw { code: 'auth/configuration-not-found' };
      return signInWithPopup(auth, googleProvider);
    },
    logout: async () => {
      sessionStorage.removeItem(DEMO_SESSION_KEY);
      sessionStorage.removeItem(LOCAL_SESSION_KEY);
      setDemoActive(false);
      setLocalUser(null);
      if (auth) {
        await signOut(auth);
        setFirebaseUser(null);
      }
    },
    resetPassword: async email => {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) throw { code: 'auth/invalid-email' };
      if (!auth) return Promise.resolve();
      return sendPasswordResetEmail(auth, cleanEmail);
    },
  };
  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
