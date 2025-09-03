import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  sub: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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

  const checkAuth = (): boolean => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return false;
    }

    try {
      // Decode JWT token (basic validation)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        // Token expired
        localStorage.removeItem('accessToken');
        setUser(null);
        return false;
      }

      setUser({
        email: payload.email,
        sub: payload.sub
      });
      return true;
    } catch (error) {
      // Invalid token
      localStorage.removeItem('accessToken');
      setUser(null);
      return false;
    }
  };

  const login = (token: string) => {
    localStorage.setItem('accessToken', token);
    checkAuth();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    // Force redirect to login page
    window.location.href = '/login';
  };

  useEffect(() => {
    const isAuth = checkAuth();
    setIsLoading(false);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
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
