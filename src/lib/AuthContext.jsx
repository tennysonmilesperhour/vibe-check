import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabase';
import { setOwner } from '@/api/owner';
import { queryClientInstance } from '@/lib/query-client';
import { isTransientAuthError, userFromSession, sessionChange } from '@/lib/auth-session';
import { clearLegacyDrafts } from '@/lib/legacy-drafts';
import { clearAllBuffers } from '@/lib/writing-buffer';
import { clearKeptSaves } from '@/lib/kept-saves';

// Supabase-backed auth: the user, whether the first answer is still loading,
// any auth error (signed out or offline), sign-out, a re-check, and the
// password-recovery session.
const AuthContext = createContext();

const SIGNED_OUT = { type: 'auth_required', message: 'Sign in to continue' };
const OFFLINE = { type: 'offline', message: 'Your account could not be reached' };
const STARTUP_PATIENCE_MS = 6000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  // True while the session came from a password-reset email link; the app
  // shows the new-password screen until it's cleared.
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const userIdRef = useRef(null);

  // State comes from the local session. Once the first answer is known the
  // loading state never returns, so the page tree stays mounted and writing in
  // progress survives tab switches, token refreshes, and network blips.
  // Supabase re-announces SIGNED_IN whenever a tab becomes visible again; for
  // the same person that changes nothing here.
  const applySession = useCallback((session) => {
    const change = sessionChange(userIdRef.current, session);
    const next = userFromSession(session);
    if (change === 'signed-out') {
      queryClientInstance.clear();
      clearLegacyDrafts();
      // Unsaved words are cleared only when someone signed in here signs out.
      // A cold start with no session (for example, offline) keeps them.
      if (userIdRef.current) clearAllBuffers();
      userIdRef.current = null;
      setOwner(null);
      setUser(null);
      setAuthError(SIGNED_OUT);
    } else if (change === 'switched') {
      if (userIdRef.current) {
        queryClientInstance.clear();
        clearAllBuffers();
      }
      userIdRef.current = next.id;
      setOwner(next.id);
      setUser(next);
      setAuthError(null);
    }
    setIsLoadingAuth(false);
  }, []);

  // An unreachable server at startup (for example, a phone reopening a tab
  // offline after its token expired) is not a sign-out: show the offline
  // state and keep everything on the device.
  const showOffline = useCallback(() => {
    setAuthError(OFFLINE);
    setIsLoadingAuth(false);
  }, []);

  const checkUserAuth = useCallback(async () => {
    // Supabase retries a failed token refresh for up to 30 seconds before it
    // answers. Show the connection screen sooner; a late success still signs
    // the person in through applySession.
    const slow = setTimeout(() => { if (!userIdRef.current) showOffline(); }, STARTUP_PATIENCE_MS);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!data?.session && error && isTransientAuthError(error)) {
        if (!userIdRef.current) showOffline();
        return;
      }
      applySession(data?.session ?? null);
    } catch (error) {
      if (isTransientAuthError(error)) {
        if (!userIdRef.current) showOffline();
      } else {
        applySession(null);
      }
    } finally {
      clearTimeout(slow);
    }
  }, [applySession, showOffline]);

  useEffect(() => {
    checkUserAuth();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Only set React state here. Calling supabase inside this callback runs
      // while the client holds its auth lock and deadlocks the app.
      // The first answer comes from checkUserAuth, which can tell an offline
      // start apart from a real absence of a session.
      if (event === 'INITIAL_SESSION') return;
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      applySession(session);
    });
    return () => sub?.subscription?.unsubscribe();
  }, [checkUserAuth, applySession]);

  // While offline, try again as soon as the connection returns.
  useEffect(() => {
    if (authError?.type !== 'offline') return undefined;
    const onOnline = () => { checkUserAuth(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [authError, checkUserAuth]);

  // Confirm the session with the server in the background. Only a definite
  // rejection (for example, a deleted account) signs the person out; an
  // unreachable server changes nothing.
  useEffect(() => {
    if (!user?.id) return undefined;
    let active = true;
    supabase.auth.getUser().then(({ error }) => {
      if (!active || !error || isTransientAuthError(error)) return;
      supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }).catch(() => {});
    return () => { active = false; };
  }, [user?.id]);

  const logout = async (scope = 'local', { keepSaves = false } = {}) => {
    // Read before signing out: the sign-out event clears the signed-in id.
    const userId = userIdRef.current;
    const { error } = await supabase.auth.signOut({ scope });
    if (error) throw error;
    // Signing out from Settings removes saves kept on this device while
    // offline (Settings warns first). A forgotten PIN keeps them, as an
    // expired session does, for when the person signs back in.
    if (!keepSaves) clearKeptSaves(userId);
    applySession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoadingAuth,
        authError,
        logout,
        checkUserAuth,
        isPasswordRecovery,
        clearPasswordRecovery: () => setIsPasswordRecovery(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
