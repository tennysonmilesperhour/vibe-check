import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabase';
import { queryClientInstance } from '@/lib/query-client';
import { isTransientAuthError, userFromSession, sessionChange } from '@/lib/auth-session';
import { clearLegacyDrafts } from '@/lib/legacy-drafts';
import { clearAllBuffers } from '@/lib/writing-buffer';

// Supabase-backed auth, preserving the context contract the app already
// consumes (App.jsx, ProtectedRoute): user / isAuthenticated / isLoadingAuth /
// isLoadingPublicSettings / authError / logout / navigateToLogin / checkAppState
// plus authChecked / checkUserAuth.
const AuthContext = createContext();

const SIGNED_OUT = { type: 'auth_required', message: 'Sign in to continue' };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
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
      clearAllBuffers();
      userIdRef.current = null;
      setUser(null);
      setAuthError(SIGNED_OUT);
    } else if (change === 'switched') {
      if (userIdRef.current) {
        queryClientInstance.clear();
        clearAllBuffers();
      }
      userIdRef.current = next.id;
      setUser(next);
      setAuthError(null);
    }
    setAuthChecked(true);
    setIsLoadingAuth(false);
  }, []);

  const checkUserAuth = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      applySession(data?.session ?? null);
    } catch {
      applySession(null);
    }
  }, [applySession]);

  useEffect(() => {
    checkUserAuth();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Only set React state here. Calling supabase inside this callback runs
      // while the client holds its auth lock and deadlocks the app.
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      applySession(session);
    });
    return () => sub?.subscription?.unsubscribe();
  }, [checkUserAuth, applySession]);

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

  const logout = async (scope = 'local') => {
    const { error } = await supabase.auth.signOut({ scope });
    if (error) throw error;
    applySession(null);
  };

  // With in-app sign-in there is nowhere to redirect; the gate renders inline.
  const navigateToLogin = () => {};

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoadingAuth,
        isLoadingPublicSettings: false,
        authChecked,
        authError,
        appPublicSettings: null,
        logout,
        navigateToLogin,
        checkAppState: checkUserAuth,
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
