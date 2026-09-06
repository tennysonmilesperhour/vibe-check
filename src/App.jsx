import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AuthGate from '@/features/shell/AuthGate';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import UpdateToast from '@/features/shell/UpdateToast';
import PasswordRecoveryGate from '@/features/shell/PasswordRecoveryGate';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import Support from '@/pages/Support';
import NetworkNotice from '@/features/shell/NetworkNotice';
import { Suspense, useEffect } from 'react';
import { PUBLIC_APP_URL } from '@/lib/publicConfig';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;
const PUBLIC_METADATA = {
  '/': {
    title: 'Vibe Check: One-minute evening mood journal',
    description: 'A private one-minute evening mood journal with personal patterns, device reminders, and optional reflection tools.',
  },
  '/privacy': {
    title: 'Privacy policy | Vibe Check',
    description: 'How Vibe Check stores, processes, exports, and deletes your personal information.',
  },
  '/terms': {
    title: 'Terms of use | Vibe Check',
    description: 'Terms for using the Vibe Check mood journal and its optional reflection tools.',
  },
  '/support': {
    title: 'Support | Vibe Check',
    description: 'Get help with Vibe Check sign-in, exports, privacy, or account deletion.',
  },
};

const AppLoading = () => (
  <div className="fixed inset-0 flex items-center justify-center" role="status" aria-live="polite">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" aria-hidden="true"></div>
    <span className="sr-only">Loading Vibe Check</span>
  </div>
);

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isPasswordRecovery } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    const metadata = PUBLIC_METADATA[path];
    const publicBase = PUBLIC_APP_URL;
    const privatePageName = location.pathname.slice(1).replaceAll('-', ' ') || 'Vibe Check';
    document.title = metadata?.title || `${privatePageName} | Vibe Check`;
    const description = document.querySelector('meta[name="description"]');
    if (metadata?.description) description?.setAttribute('content', metadata.description);
    document.querySelector('meta[name="robots"]')?.setAttribute(
      'content',
      metadata ? 'index, follow, max-image-preview:large' : 'noindex, nofollow',
    );
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', metadata?.title || 'Vibe Check');
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', metadata?.title || 'Vibe Check');
    if (metadata?.description) {
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', metadata.description);
      document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', metadata.description);
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (metadata && publicBase) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', `${publicBase}${path === '/' ? '' : path}`);
      document.querySelector('meta[property="og:url"]')?.setAttribute('content', `${publicBase}${path === '/' ? '' : path}`);
      const socialImage = `${publicBase}/social-card.png`;
      document.querySelector('meta[property="og:image"]')?.setAttribute('content', socialImage);
      document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', socialImage);
    } else {
      canonical?.remove();
    }
  }, [location.pathname]);

  const publicPages = { '/privacy': Privacy, '/terms': Terms, '/support': Support };
  const PublicPage = publicPages[location.pathname.toLowerCase()];
  if (PublicPage) return <PublicPage />;

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <AppLoading />;
  }

  if (isPasswordRecovery) return <PasswordRecoveryGate />;

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
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
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
      <Route path="/HealingBoard" element={<Navigate to="/Practice" replace />} />
      <Route path="/CosmicWisdom" element={<Navigate to="/Analytics?tab=wisdom" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AppErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <Suspense fallback={<AppLoading />}>
              <AuthenticatedApp />
            </Suspense>
          </Router>
          <Toaster />
          <UpdateToast />
          <NetworkNotice />
        </QueryClientProvider>
      </AuthProvider>
    </AppErrorBoundary>
  )
}

export default App
