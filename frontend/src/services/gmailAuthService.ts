interface GmailAuthStatus {
  isAuthenticated: boolean;
  email?: string;
  expiresAt?: Date;
  needsRefresh?: boolean;
}

interface GmailAuthResponse {
  isAuthenticated: boolean;
  email?: string;
  expiresAt?: string;
  needsRefresh?: boolean;
  error?: string;
}

class GmailAuthService {
  private static instance: GmailAuthService;
  private authStatus: GmailAuthStatus | null = null;
  private lastCheck: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): GmailAuthService {
    if (!GmailAuthService.instance) {
      GmailAuthService.instance = new GmailAuthService();
    }
    return GmailAuthService.instance;
  }

  /**
   * Check if user is authenticated with Gmail
   * Uses caching to avoid frequent API calls
   */
  async checkAuthStatus(forceRefresh: boolean = false): Promise<GmailAuthStatus> {
    const now = Date.now();
    
    console.log('🔍 GmailAuthService: Checking auth status, forceRefresh:', forceRefresh);
    
    // Return cached result if not forcing refresh and cache is still valid
    if (!forceRefresh && this.authStatus && (now - this.lastCheck) < this.CACHE_DURATION) {
      console.log('🔍 GmailAuthService: Using cached result:', this.authStatus);
      return this.authStatus;
    }

    try {
      console.log('🔍 GmailAuthService: Making API call to check auth status...');
      const response = await fetch('http://localhost:4002/email/auth/GMAIL/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'my-secret-api-key-123'
        }
      });

      console.log('🔍 GmailAuthService: API response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GmailAuthResponse = await response.json();
      console.log('🔍 GmailAuthService: API response data:', data);
      
      this.authStatus = {
        isAuthenticated: data.isAuthenticated,
        email: data.email,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        needsRefresh: data.needsRefresh
      };

      this.lastCheck = now;
      console.log('🔍 GmailAuthService: Final auth status:', this.authStatus);
      return this.authStatus;

    } catch (error) {
      console.error('❌ GmailAuthService: Failed to check Gmail auth status:', error);
      
      // Return cached status if available, otherwise return not authenticated
      if (this.authStatus) {
        console.log('🔍 GmailAuthService: Returning cached status due to error:', this.authStatus);
        return this.authStatus;
      }
      
      const fallbackStatus = {
        isAuthenticated: false,
        needsRefresh: false
      };
      console.log('🔍 GmailAuthService: Returning fallback status:', fallbackStatus);
      return fallbackStatus;
    }
  }

  /**
   * Get OAuth URL for Gmail authentication
   */
  async getOAuthUrl(): Promise<string> {
    try {
      const response = await fetch('http://localhost:4002/api/mail-accounts/oauth-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'my-secret-api-key-123'
        },
        body: JSON.stringify({
          provider: 'gmail',
          redirectUri: 'http://localhost:4002/api/mail-accounts/oauth-callback'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get OAuth URL: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.oauthUrl;

    } catch (error) {
      console.error('Failed to get Gmail OAuth URL:', error);
      throw error;
    }
  }

  /**
   * Refresh Gmail tokens if needed
   */
  async refreshTokens(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:4002/email/auth/GMAIL/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'my-secret-api-key-123'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh tokens: ${response.statusText}`);
      }

      // Clear cache to force fresh check
      this.authStatus = null;
      this.lastCheck = 0;
      
      return true;

    } catch (error) {
      console.error('Failed to refresh Gmail tokens:', error);
      return false;
    }
  }

  /**
   * Clear authentication status (logout)
   */
  clearAuthStatus(): void {
    this.authStatus = null;
    this.lastCheck = 0;
  }

  /**
   * Check if tokens need refresh based on expiration time
   */
  needsTokenRefresh(): boolean {
    if (!this.authStatus?.expiresAt) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(this.authStatus.expiresAt);
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    
    // Refresh if expires within 5 minutes
    return timeUntilExpiry < 5 * 60 * 1000;
  }
}

export default GmailAuthService.getInstance();
