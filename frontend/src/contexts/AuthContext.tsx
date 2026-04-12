import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserProfile, authApi } from '../services/authApi';
import { tokenStore, authEventBus } from '../services/apiClient';
import { logger } from '../utils/logger';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load: check if token exists and fetch user
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenStore.get();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authApi.me();
        setUser(userData);
      } catch (err) {
        logger.error('Failed to validate token on load', { error: err });
        tokenStore.clear();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback((token: string, userData: UserProfile) => {
    tokenStore.set(token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    setUser(null);
  }, []);

  // Set up the global unauthorized listener
  useEffect(() => {
    const off = authEventBus.subscribe(() => {
      logger.warn('Token invalid or expired; automatically logging out.');
      setUser(null);
    });
    return off;
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
