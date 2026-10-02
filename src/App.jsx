import { Suspense, lazy, useState } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AuthGate, { authLinkError } from '@/features/shell/AuthGate';
import Landing from '@/features/shell/Landing';
import PasswordReset from '@/features/shell/PasswordReset';
import OfflineGate from '@/features/shell/OfflineGate';
import LockGate from '@/features/safety/LockGate';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import UpdateToast from '@/features/shell/UpdateToast';
import './living.css';
import LoadingState from '@/features/shell/LoadingState';

const { Pages, Layout, mainPage } = pagesConfig;
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const Support = lazy(() => import('@/pages/Support'));
const SupportNow = lazy(() => import('@/pages/SupportNow'));
const HelpNow = lazy(() => import('@/pages/HelpNow'));
const ShareSummary = lazy(() => import('@/features/summary/ShareSummaryPage'));
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, authError, isPasswordRecovery, clearPasswordRecovery } = useAuth();
  const { pathname } = useLocation();
  // A sign-in link that didn't work comes back with its reason in the address.
  const [linkError] = useState(authLinkError);

  // Show loading spinner while checking auth
  if (isLoadingAuth) {
    return (
      <div className="field-wash min-h-screen"><LoadingState variant="screen" label="Opening your sanctuary…" /></div>
    );
  }

  // The reset-link session: one job before anything else — set a new password.
  if (isPasswordRecovery) {
    return <PasswordReset onDone={clearPasswordRecovery} />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'offline') {
      return <OfflineGate />;
    } else if (authError.type === 'auth_required') {
      // Visitors to the front page see what Vibe Check is. Any other address,
      // or a sign-in link that didn't work, asks them to sign in.
      if (pathname === '/' && !linkError) return <Landing />;
      return <AuthGate initialMode={pathname === '/signup' ? 'signup' : 'signin'} initialError={linkError} />;
    }
  }

  // Render the main app. A different account starts it afresh, so no open
  // form can save one person's words into another's account.
  return (
    <LockGate key={user?.id}>
    {(frozenLocation) => (
    <Suspense fallback={<div className="min-h-screen field-wash" aria-busy="true" />}>
    <Routes location={frozenLocation}>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <RouteErrorBoundary key="/"><MainPage /></RouteErrorBoundary>
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <RouteErrorBoundary key={path}><Page /></RouteErrorBoundary>
            </LayoutWrapper>
          }
        />
      ))}
      {/* Signing in from these addresses opens the app. */}
      <Route path="/signin" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />
      {/* Prints on its own, without the app's navigation around it. */}
      <Route path="/Summary" element={<RouteErrorBoundary key="/Summary"><ShareSummary /></RouteErrorBoundary>} />
      {/* legacy routes from the pre-golden-hour IA */}
      <Route path="/Dashboard" element={<Navigate to="/Today" replace />} />
      <Route path="/DailyLog" element={<Navigate to="/Today" replace />} />
      <Route path="/Boundaries" element={<Navigate to="/Today" replace />} />
      <Route path="/Relationships" element={<Navigate to="/People" replace />} />
      <Route path="/Constellation" element={<Navigate to="/People" replace />} />
      <Route path="/TarotReading" element={<Navigate to="/CosmicAddons?tab=tarot" replace />} />
      <Route path="/HealingBoard" element={<Navigate to="/Practice?tab=healing" replace />} />
      <Route path="/CosmicWisdom" element={<Navigate to="/CosmicAddons?tab=readings" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
    )}
    </LockGate>
  );
};


function App() {

  return (
    <AppErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <Suspense fallback={<div className="min-h-screen field-wash" aria-busy="true" />}>
              <Routes>
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/support" element={<Support />} />
                <Route path="/support-now" element={<SupportNow />} />
                <Route path="/help-now/:stateId?/:practiceId?" element={<HelpNow />} />
                <Route path="*" element={<AuthenticatedApp />} />
              </Routes>
            </Suspense>
          </Router>
          <Toaster />
          <UpdateToast />
        </QueryClientProvider>
      </AuthProvider>
    </AppErrorBoundary>
  )
}

export default App
