import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SessionService } from '../services/sessionService';

interface User {
  email: string;
  sub: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (token: string) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkAuth = (): boolean => {
    // Check if session is valid
    if (!SessionService.isSessionValid() || SessionService.isTokenExpired()) {
      SessionService.clearSession();
      setUser(null);
      return false;
    }

    // Get user from token
    const userData = SessionService.getUserFromToken();
    if (userData) {
      setUser(userData);
      return true;
    }

    return false;
  };

  const login = (token: string) => {
    SessionService.setToken(token);
    const isAuth = checkAuth();
    if (isAuth) {
      setIsInitialized(true);
    }
  };

  const logout = () => {
    SessionService.clearSession();
    setUser(null);
    setIsInitialized(false);
    // Force redirect to login page
    window.location.href = '/login';
  };

  useEffect(() => {
    // Initialize session monitoring
    SessionService.initializeSessionMonitoring();
    
    // Add a small delay to ensure proper initialization
    const initializeAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      const isAuth = checkAuth();
      setIsInitialized(true);
      setIsLoading(false);
    };
    
    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitialized,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
