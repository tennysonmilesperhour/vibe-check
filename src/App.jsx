import { Suspense, lazy } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AuthGate from '@/features/shell/AuthGate';
import PasswordReset from '@/features/shell/PasswordReset';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import UpdateToast from '@/features/shell/UpdateToast';
import './living.css';

const { Pages, Layout, mainPage } = pagesConfig;
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const Support = lazy(() => import('@/pages/Support'));
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isPasswordRecovery, clearPasswordRecovery } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // The reset-link session: one job before anything else — set a new password.
  if (isPasswordRecovery) {
    return <PasswordReset onDone={clearPasswordRecovery} />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Inline sign-in: the golden hour front door
      return <AuthGate />;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<div className="min-h-screen field-wash" aria-busy="true" />}>
    <Routes>
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
      {/* legacy routes from the pre-golden-hour IA */}
      <Route path="/Dashboard" element={<Navigate to="/Today" replace />} />
      <Route path="/DailyLog" element={<Navigate to="/Today" replace />} />
      <Route path="/Boundaries" element={<Navigate to="/Today" replace />} />
      <Route path="/Relationships" element={<Navigate to="/People" replace />} />
      <Route path="/Constellation" element={<Navigate to="/People" replace />} />
      <Route path="/TarotReading" element={<Navigate to="/Practice" replace />} />
      <Route path="/HealingBoard" element={<Navigate to="/Practice?tab=healing" replace />} />
      <Route path="/CosmicWisdom" element={<Navigate to="/Analytics?tab=wisdom" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
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
