import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { resolveUser } from '../mock';

const AuthContext = createContext(null);
const STORAGE_KEY = 'editvault_session_v2';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setSession({ user: { id: s.username } });
        setProfile(s);
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  const signIn = useCallback(async ({ username, password }) => {
    const u = resolveUser(username, password);
    if (!u) return { error: { message: 'Invalid username or password.' } };
    const prof = { ...u, email: `${u.username}@editvault.local` };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prof));
    setSession({ user: { id: u.username } });
    setProfile(prof);
    return { data: { user: { id: u.username }, profile: prof } };
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setProfile(null);
  }, []);

  const value = {
    session, profile, loading,
    isAdmin: profile?.role === 'admin',
    isClient: profile?.role === 'client',
    signIn, signOut,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
