import React, { useState, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import SplashScreen from './components/SplashScreen';
import IntroAnimation from './components/IntroAnimation';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useNavDirection } from '@/lib/nav-history';

// Lazy load pages NOT already in pages.config.js
const Estadios = lazy(() => import('./pages/Estadios'));
const RegistrarDueno = lazy(() => import('./pages/RegistrarDueno'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const MercadoPagoCallback = lazy(() => import('./pages/MercadoPagoCallback'));
const PaymentResult = lazy(() => import('./pages/PaymentResult'));
const EditarCancha = lazy(() => import('./pages/EditarCancha'));
const Help = lazy(() => import('./pages/Help'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
  </div>
);

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const PageTransition = ({ children, pageKey }) => {
  const direction = useNavDirection();
  return (
    <motion.div
      key={pageKey}
      initial={{ x: direction === "back" ? -28 : 28, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ willChange: "transform, opacity", overflow: "hidden" }}
    >
      {children}
    </motion.div>
  );
};

const LayoutWrapper = ({ children, currentPageName }) => {
  const content = <PageTransition pageKey={currentPageName}>{children}</PageTransition>;
  return Layout
    ? <Layout currentPageName={currentPageName}>{content}</Layout>
    : content;
};

const LazyPageWrapper = ({ element, currentPageName }) => (
  <Suspense fallback={<PageLoader />}>
    <LayoutWrapper currentPageName={currentPageName}>
      {element}
    </LayoutWrapper>
  </Suspense>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // While loading, render nothing (content loads in background)
  if (isLoadingPublicSettings || isLoadingAuth) {
    return null;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to Base44 login with Google OAuth support
      navigateToLogin();
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 100 100" className="w-10 h-10">
                <circle cx="50" cy="50" r="40" fill="white"/>
                <path d="M 30 50 L 40 60 L 60 40 L 70 50" stroke="currentColor" strokeWidth="6" fill="none" className="text-primary"/>
                <circle cx="50" cy="70" r="8" fill="currentColor" className="text-primary"/>
              </svg>
            </div>
            <p className="text-muted-foreground">Redirigiendo a inicio de sesión...</p>
          </div>
        </div>
      );
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
      {/* Pages NOT in pages.config.js - need explicit routes */}
      <Route path="/Estadios" element={<LazyPageWrapper element={<Estadios />} currentPageName="Estadios" />} />
      <Route path="/RegistrarDueno" element={<LazyPageWrapper element={<RegistrarDueno />} currentPageName="RegistrarDueno" />} />
      <Route path="/AdminPanel" element={<LazyPageWrapper element={<AdminPanel />} currentPageName="AdminPanel" />} />
      <Route path="/MercadoPagoCallback" element={<LazyPageWrapper element={<MercadoPagoCallback />} currentPageName="MercadoPagoCallback" />} />
      <Route path="/PaymentResult" element={<LazyPageWrapper element={<PaymentResult />} currentPageName="PaymentResult" />} />
      <Route path="/EditarCancha" element={<LazyPageWrapper element={<EditarCancha />} currentPageName="EditarCancha" />} />
      <Route path="/Help" element={<LazyPageWrapper element={<Help />} currentPageName="Help" />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  const alreadySeen = sessionStorage.getItem('intro_seen');
  const [showSplash, setShowSplash] = useState(!alreadySeen);
  const [showIntro, setShowIntro] = useState(false);

  const handleSplashDone = () => {
    setShowSplash(false);
    setShowIntro(true);
  };

  const handleIntroDone = () => {
    sessionStorage.setItem('intro_seen', '1');
    setShowIntro(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      {!showSplash && showIntro && <IntroAnimation onComplete={handleIntroDone} />}
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </>
  );
}

export default App