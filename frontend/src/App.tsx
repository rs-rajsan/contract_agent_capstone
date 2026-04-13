import { useState, useEffect } from 'react';
import { ThemeProvider } from './components/shared/theme-provider';
import { Navigation } from './components/layout/Navigation';
import { ChatPage } from './pages/ChatPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { DocumentationPage } from './pages/DocumentationPage';
import { SearchPage } from './pages/SearchPage';
import { LoginPage } from './pages/LoginPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ContractHistoryProvider } from './contexts/ContractHistoryContext';
import { ModelProvider } from './contexts/ModelContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useRouter, RouterProvider } from './lib/useRouter';
import { Menu, X, Loader2 } from 'lucide-react';
import { Button } from './components/shared/ui/button';
import { APP_CONFIG } from './utils/config';
import { cn } from './lib/utils';
import { DiagnosticScreen } from './components/shared/DiagnosticScreen';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { useSystemSettings } from './hooks/useSystemSettings';
import './App.css';

function MainApp() {
  const { currentPage, navigate } = useRouter();
  const { isLoading, isAuthenticated } = useAuth();
  const { updateSetting, isDiagnosticsEnabled } = useSystemSettings();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasCheckedHealth, setHasCheckedHealth] = useState(false);

  // Handle URL parameter sync for temporary/forensic bypass
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('skipDiagnostics') === 'true') {
      updateSetting('skipDiagnostics', true);
      // Clean URL to avoid confusion
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [updateSetting]);

  // STAGE 0: Check if diagnostics are globally disabled via Persistent Settings
  useEffect(() => {
    if (!isDiagnosticsEnabled) {
      setHasCheckedHealth(true);
    }
  }, [isDiagnosticsEnabled]);

  // Close sidebar when navigating on mobile
  const handleNavigate = (page: any) => {
    navigate(page);
    setIsSidebarOpen(false);
  };

  // Sync logic for when we LOG IN or LOG OUT
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && currentPage === 'login') {
      navigate('intelligence');
    }
    // Note: Implicit redirect for logged-out users is handled by the render logic below
  }, [isAuthenticated, currentPage, navigate, isLoading]);

  // STAGE 1: System Health Diagnostic (Must pass before anything else)
  if (isDiagnosticsEnabled && !hasCheckedHealth) {
    return <DiagnosticScreen onComplete={() => setHasCheckedHealth(true)} />;
  }

  // STAGE 2: Identity Session Validation (Re-hydrating auth on refresh)
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Authenticating Identity Vault...</p>
        </div>
      </div>
    );
  }

  // STAGE 3: Authentication Gateway
  // If not authenticated, we block the App Shell entirely and force the Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // STAGE 4: App Shell & Orchestration (Authenticated Users Only)
  const renderPage = () => {
    switch (currentPage) {
      case 'chat':
        return <ChatPage />;
      case 'intelligence':
        return <IntelligencePage />;
      case 'agents':
        return <DocumentationPage />;
      case 'search':
        return (
          <ErrorBoundary>
            <SearchPage />
          </ErrorBoundary>
        );
      case 'analytics':
        return <AnalyticsPage />;
      case 'users':
      case 'settings':
        return <UserManagementPage />;
      case 'login':
        // Fallback in case state hasn't transitioned yet
        return <IntelligencePage />;
      default:
        return <IntelligencePage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:relative h-full border-r border-slate-200 dark:border-slate-800 transition-all duration-300 transform",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )} 
        style={{ width: APP_CONFIG.LAYOUT.SIDEBAR_WIDTH }}
      >
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
        
        {/* Global Persistence/Bypass Indicator */}
        {!isDiagnosticsEnabled && (
          <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
             <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Unprotected Mode</span>
             </div>
             <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight">
                System diagnostics are currently bypassed via persistent settings.
             </p>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="relative flex-1 h-full overflow-y-auto overflow-x-hidden transition-all duration-300">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {APP_CONFIG.TITLE}
          </h1>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </header>

        <div className="container p-4 lg:p-6 animate-in fade-in duration-500">
          <ErrorBoundary>
            {renderPage()}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <RouterProvider initialPage="intelligence">
      <AuthProvider>
        <ContractHistoryProvider>
          <ModelProvider>
            <ThemeProvider defaultTheme={APP_CONFIG.DEFAULT_THEME} storageKey={APP_CONFIG.STORAGE_KEYS.THEME}>
               <MainApp />
            </ThemeProvider>
          </ModelProvider>
        </ContractHistoryProvider>
      </AuthProvider>
    </RouterProvider>
  );
}

export default App;