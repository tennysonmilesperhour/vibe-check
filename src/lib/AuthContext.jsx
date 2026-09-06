import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import { base44 } from '@/api/base44Client';

// Supabase-backed auth, preserving the context contract the app already
// consumes (App.jsx, ProtectedRoute): user / isAuthenticated / isLoadingAuth /
// isLoadingPublicSettings / authError / logout / navigateToLogin / checkAppState
// plus authChecked / checkUserAuth.
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'auth_required', message: 'Sign in to continue' });
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: error?.message || 'Sign in to continue' });
    }
    setIsLoadingAuth(false);
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    checkUserAuth();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Never call supabase from inside this callback: it runs while the
      // client holds its auth lock, and further auth calls deadlock the app
      // (the post-login blank screen). Defer to the next tick instead.
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      if (session) setTimeout(() => { checkUserAuth(); }, 0);
      else {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'auth_required', message: 'Sign in to continue' });
        setAuthChecked(true);
        setIsLoadingAuth(false);
      }
    });
    return () => sub?.subscription?.unsubscribe();
  }, [checkUserAuth]);

  const logout = async () => {
    await base44.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // With in-app sign-in there is nowhere to redirect; the gate renders inline.
  const navigateToLogin = () => {};

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
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
        finishPasswordRecovery: () => setIsPasswordRecovery(false),
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
