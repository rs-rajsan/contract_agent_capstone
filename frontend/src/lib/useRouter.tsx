import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type PageType = 'chat' | 'intelligence' | 'agents' | 'search' | 'analytics' | 'login' | 'users' | 'insights' | 'settings';

interface RouterContextType {
  currentPage: PageType;
  navigate: (page: PageType) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function RouterProvider({ children, initialPage = 'intelligence' }: { children: ReactNode, initialPage?: PageType }): React.ReactElement {
  const [currentPage, setCurrentPage] = useState<PageType>(initialPage);

  const navigate = useCallback((page: PageType) => {
    setCurrentPage(page);
  }, []);

  const value = {
    currentPage,
    navigate
  };

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
}

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (context === undefined) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
