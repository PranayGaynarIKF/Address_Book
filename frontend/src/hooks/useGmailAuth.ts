import { useState, useEffect, useCallback } from 'react';
import gmailAuthService from '../services/gmailAuthService';

interface GmailAuthStatus {
  isAuthenticated: boolean;
  email?: string;
  expiresAt?: Date;
  needsRefresh?: boolean;
  isLoading: boolean;
  error?: string;
}

interface UseGmailAuthReturn {
  authStatus: GmailAuthStatus;
  checkAuth: (forceRefresh?: boolean) => Promise<boolean>;
  getOAuthUrl: () => Promise<string>;
  refreshTokens: () => Promise<boolean>;
  clearAuth: () => void;
}

export const useGmailAuth = (): UseGmailAuthReturn => {
  const [authStatus, setAuthStatus] = useState<GmailAuthStatus>({
    isAuthenticated: false,
    isLoading: true
  });

  const checkAuth = useCallback(async (forceRefresh: boolean = false): Promise<boolean> => {
    setAuthStatus(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      const status = await gmailAuthService.checkAuthStatus(forceRefresh);
      
      setAuthStatus({
        isAuthenticated: status.isAuthenticated,
        email: status.email,
        expiresAt: status.expiresAt,
        needsRefresh: status.needsRefresh,
        isLoading: false
      });

      // If tokens need refresh, try to refresh them automatically
      if (status.needsRefresh || gmailAuthService.needsTokenRefresh()) {
        console.log('Gmail tokens need refresh, attempting automatic refresh...');
        const refreshSuccess = await gmailAuthService.refreshTokens();
        
        if (refreshSuccess) {
          // Re-check auth status after refresh
          const refreshedStatus = await gmailAuthService.checkAuthStatus(true);
          setAuthStatus({
            isAuthenticated: refreshedStatus.isAuthenticated,
            email: refreshedStatus.email,
            expiresAt: refreshedStatus.expiresAt,
            needsRefresh: refreshedStatus.needsRefresh,
            isLoading: false
          });
          return refreshedStatus.isAuthenticated;
        } else {
          setAuthStatus(prev => ({
            ...prev,
            needsRefresh: true,
            isLoading: false,
            error: 'Failed to refresh tokens. Please re-authenticate.'
          }));
          return false;
        }
      }
      
      return status.isAuthenticated;
    } catch (error) {
      console.error('Gmail auth check failed:', error);
      setAuthStatus({
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check authentication status'
      });
      return false;
    }
  }, []);

  const getOAuthUrl = useCallback(async (): Promise<string> => {
    try {
      return await gmailAuthService.getOAuthUrl();
    } catch (error) {
      console.error('Failed to get OAuth URL:', error);
      throw error;
    }
  }, []);

  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      const success = await gmailAuthService.refreshTokens();
      if (success) {
        // Re-check auth status after refresh
        await checkAuth(true);
      }
      return success;
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      return false;
    }
  }, [checkAuth]);

  const clearAuth = useCallback(() => {
    gmailAuthService.clearAuthStatus();
    setAuthStatus({
      isAuthenticated: false,
      isLoading: false
    });
  }, []);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Set up periodic auth status check (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      checkAuth();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [checkAuth]);

  return {
    authStatus,
    checkAuth,
    getOAuthUrl,
    refreshTokens,
    clearAuth
  };
};
