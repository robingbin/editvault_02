import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { http, setToken, getToken, initStore, clearStore } from '../lib/store';

const AuthContext = createContext(null);
const PROFILE_KEY = 'editvault_profile_v1';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    const token = getToken();
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!token || !raw) { setLoading(false); return; }
    try {
      // Validate the token against the server; the password_version check
      // will reject any token issued before an admin changed credentials.
      const me = (await http.get('/me')).data;
      setSession({ user: { id: me.username } });
      setProfile(me);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(me));
      await initStore(me);
    } catch (_) {
      // Stale token — wipe local session so the user is sent to /login.
      setToken(null);
      localStorage.removeItem(PROFILE_KEY);
      clearStore();
      setSession(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { restoreSession(); }, [restoreSession]);

  const signIn = useCallback(async ({ username, password }) => {
    try {
      const res = await http.post('/login', { username, password });
      const { token, profile: prof } = res.data;
      setToken(token);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(prof));
      setSession({ user: { id: prof.username } });
      setProfile(prof);
      await initStore(prof);
      return { data: { profile: prof } };
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid username or password.';
      return { error: { message: msg } };
    }
  }, []);

  const signOut = useCallback(async () => {
    setToken(null);
    localStorage.removeItem(PROFILE_KEY);
    clearStore();
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
