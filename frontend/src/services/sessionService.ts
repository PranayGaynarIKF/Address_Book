// Session Management Service
export class SessionService {
  private static readonly TOKEN_KEY = 'accessToken';
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly LAST_ACTIVITY_KEY = 'lastActivity';

  // Store token and update last activity
  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.updateLastActivity();
  }

  // Get token from localStorage
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Remove token and session data
  static clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.LAST_ACTIVITY_KEY);
  }

  // Update last activity timestamp
  static updateLastActivity(): void {
    localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());
  }

  // Check if session is still valid
  static isSessionValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const lastActivity = localStorage.getItem(this.LAST_ACTIVITY_KEY);
    if (!lastActivity) return false;

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    return timeSinceLastActivity < this.SESSION_TIMEOUT;
  }

  // Check if token is expired
  static isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp && payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Get user info from token
  static getUserFromToken(): { email: string; sub: string } | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email: payload.email,
        sub: payload.sub
      };
    } catch (error) {
      return null;
    }
  }

  // Initialize session monitoring
  static initializeSessionMonitoring(): void {
    // Update activity on user interaction
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const updateActivity = () => {
      this.updateLastActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check session validity periodically
    setInterval(() => {
      if (!this.isSessionValid() || this.isTokenExpired()) {
        this.clearSession();
        window.location.href = '/login';
      }
    }, 60000); // Check every minute
  }
}
