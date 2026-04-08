import React, { useState } from 'react';
import { ThemeProvider } from './components/shared/theme-provider';
import { Navigation } from './components/layout/Navigation';
import { ChatPage } from './pages/ChatPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { DocumentationPage } from './pages/DocumentationPage';
import { SearchPage } from './pages/SearchPage';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ContractHistoryProvider } from './contexts/ContractHistoryContext';
import { useRouter } from './lib/useRouter';
import { Menu, X } from 'lucide-react';
import { Button } from './components/shared/ui/button';
import { APP_CONFIG } from './utils/config';
import { cn } from './lib/utils';

function App() {
  const { currentPage, navigate } = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when navigating on mobile
  const handleNavigate = (page: any) => {
    navigate(page);
    setIsSidebarOpen(false);
  };

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
      default:
        return <IntelligencePage />;
    }
  };

  return (
    <ContractHistoryProvider>
      <ThemeProvider defaultTheme={APP_CONFIG.DEFAULT_THEME} storageKey={APP_CONFIG.STORAGE_KEYS.THEME}>
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
              {renderPage()}
            </div>
          </main>
        </div>
      </ThemeProvider>
    </ContractHistoryProvider>
  );
}

export default App;