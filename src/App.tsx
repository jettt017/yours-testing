import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { ViewType, User } from './types';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { getSubmissionRepository } from './services/submissionRepository';
import { authService } from './services/authService';
import { LogoLoader } from './components/LogoLoader';

// Code-splitting Lazy Loaded Views
const HomeView = lazy(() => import('./views/HomeView').then((m) => ({ default: m.HomeView })));
const SubmitView = lazy(() => import('./views/SubmitView').then((m) => ({ default: m.SubmitView })));
const SuccessView = lazy(() => import('./views/SuccessView').then((m) => ({ default: m.SuccessView })));
const TrackView = lazy(() => import('./views/TrackView').then((m) => ({ default: m.TrackView })));
const AdminView = lazy(() => import('./views/AdminView').then((m) => ({ default: m.AdminView })));

const ViewFallback: React.FC = () => (
  <div
    style={{
      flex: 1,
      minHeight: '65vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}
  >
    <LogoLoader size={54} label="Memuat konten..." />
  </div>
);

export const App: React.FC = () => {
  const repository = useMemo(() => getSubmissionRepository(), []);

  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<string | undefined>(undefined);

  // Real website loading states
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isInitialFadingOut, setIsInitialFadingOut] = useState(false);

  // Admin sub-navigation tab state
  const [adminTab, setAdminTab] = useState<'curate' | 'categories' | 'users'>('curate');

  // Real page transition loading states
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isPageFadingOut, setIsPageFadingOut] = useState(false);
  const [pageLoadingLabel, setPageLoadingLabel] = useState('Memuat halaman...');

  useEffect(() => {
    // Initial web entrance loading with typewriter animation
    const fadeTimer = window.setTimeout(() => {
      setIsInitialFadingOut(true);
    }, 1200);

    const removeTimer = window.setTimeout(() => {
      setIsInitialLoading(false);
    }, 1550);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Simple hash-based router synced with window.location.hash
  const getInitialView = useCallback((): ViewType => {
    const hash = window.location.hash.replace('#', '') as ViewType;
    if (['home', 'submit', 'success', 'track', 'admin'].includes(hash)) {
      return hash;
    }
    return currentUser?.role === 'admin' ? 'admin' : 'home';
  }, [currentUser]);

  const [currentView, setCurrentView] = useState<ViewType>(getInitialView);
  const [lastSubmission, setLastSubmission] = useState<{ id: string; email: string }>({
    id: '',
    email: '',
  });
  const [trackPrefill, setTrackPrefill] = useState<{ id: string; email: string }>({
    id: '',
    email: '',
  });

  // Sync hash change
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ViewType;
      if (['home', 'submit', 'success', 'track', 'admin'].includes(hash)) {
        setCurrentView(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: ViewType) => {
    if (view === currentView) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    let label = 'Memuat halaman...';
    if (view === 'home') label = 'Membuka beranda...';
    else if (view === 'submit') label = 'Menyiapkan formulir kurasi karya...';
    else if (view === 'track') label = 'Memuat pelacakan kurasi...';
    else if (view === 'admin') label = 'Membuka portal kurator...';
    else if (view === 'success') label = 'Menyiapkan status karya...';

    setPageLoadingLabel(label);
    setIsPageFadingOut(false);
    setIsPageLoading(true);

    // Switch view underneath frosted glass while typewriter types
    window.setTimeout(() => {
      window.location.hash = view === 'home' ? '' : view;
      setCurrentView(view);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 420);

    // Smooth fade out after typewriter has completed
    window.setTimeout(() => {
      setIsPageFadingOut(true);
    }, 680);

    // Clean unmount after fade-out transition finishes
    window.setTimeout(() => {
      setIsPageLoading(false);
      setIsPageFadingOut(false);
    }, 980);
  };

  const handleOpenAuth = (intent?: string) => {
    setAuthIntent(intent);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      navigateTo('admin');
    } else {
      if (authIntent?.includes('submit')) {
        navigateTo('submit');
      } else if (authIntent?.includes('track')) {
        navigateTo('track');
      }
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    navigateTo('home');
  };

  const handleSubmitSuccess = (id: string, email: string) => {
    setLastSubmission({ id, email });
    navigateTo('success');
  };

  const handleTrackPrefilled = (id: string, email: string) => {
    setTrackPrefill({ id, email });
    navigateTo('track');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Navbar
        currentView={currentView}
        adminTab={adminTab}
        currentUser={currentUser}
        onNavigate={navigateTo}
        onSelectAdminTab={(tab) => {
          setAdminTab(tab);
          if (currentView !== 'admin') {
            navigateTo('admin');
          }
        }}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Top Navigation Glowing Progress Bar */}
      {isPageLoading && <div className="nav-progress-bar" />}

      {/* Main View Area with Code-Splitting Lazy Loading & Fluid Spring Transition */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Suspense fallback={<ViewFallback />}>
          <div
            key={currentView}
            className="page-view-enter"
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            {currentView === 'home' && (
              <HomeView
                currentUser={currentUser}
                onNavigate={navigateTo}
                onOpenAuth={handleOpenAuth}
              />
            )}

            {currentView === 'submit' && (
              <SubmitView
                repository={repository}
                currentUser={currentUser}
                onSuccess={handleSubmitSuccess}
                onOpenAuth={handleOpenAuth}
              />
            )}

            {currentView === 'success' && (
              <SuccessView
                submissionId={lastSubmission.id || '#ART-2026-00000'}
                submissionEmail={lastSubmission.email}
                onNavigate={navigateTo}
                onTrackPrefilled={handleTrackPrefilled}
              />
            )}

            {currentView === 'track' && (
              <TrackView
                repository={repository}
                currentUser={currentUser}
                selectedId={trackPrefill.id}
                onNavigate={navigateTo}
                onOpenAuth={handleOpenAuth}
              />
            )}

            {currentView === 'admin' && (
              <AdminView
                repository={repository}
                currentUser={currentUser}
                activeTab={adminTab}
                onTabChange={setAdminTab}
                onOpenAuth={handleOpenAuth}
              />
            )}
          </div>
        </Suspense>
      </div>

      {/* Full-width Frosted Glass Footer Bar (No Logo) */}
      <footer
        style={{
          width: '100%',
          marginTop: 'auto',
          backgroundColor: 'var(--footer-bg)',
          WebkitBackdropFilter: 'blur(10px)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--ln)',
          padding: '24px 24px',
          transition: 'background-color 0.25s ease, border-color 0.2s ease',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '13px',
            color: 'var(--mt)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <div style={{ color: 'var(--bk)', fontWeight: 500 }}>
            yours. &mdash; editorial artwork curation platform
          </div>

          <div style={{ color: 'var(--mt)' }}>
            curation platform for creators and students
          </div>
        </div>
      </footer>

      {/* Real Website Initial Entrance Loading Screen */}
      {isInitialLoading && (
        <LogoLoader
          fullScreen
          fadeOut={isInitialFadingOut}
          label="Memuat platform kurasi seni..."
          speed="normal"
        />
      )}

      {/* Real Page Transition Loading Screen with Logo Animation */}
      {!isInitialLoading && isPageLoading && (
        <LogoLoader
          fullScreen
          fadeOut={isPageFadingOut}
          label={pageLoadingLabel}
          speed="fast"
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        intentMessage={authIntent}
      />
    </div>
  );
};

export default App;
