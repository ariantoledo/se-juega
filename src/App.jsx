import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import RegistrarCancha from './pages/RegistrarCancha';
import GestionarCancha from './pages/GestionarCancha';
import ConfigurarStripe from './pages/ConfigurarStripe';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
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
          <div className="w-8 h-8 mx-auto border-4 border-border border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
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
      <Route path="/RegistrarCancha" element={
        <LayoutWrapper currentPageName="RegistrarCancha">
          <RegistrarCancha />
        </LayoutWrapper>
      } />
      <Route path="/GestionarCancha" element={
        <LayoutWrapper currentPageName="GestionarCancha">
          <GestionarCancha />
        </LayoutWrapper>
      } />
      <Route path="/ConfigurarStripe" element={
        <LayoutWrapper currentPageName="ConfigurarStripe">
          <ConfigurarStripe />
        </LayoutWrapper>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App